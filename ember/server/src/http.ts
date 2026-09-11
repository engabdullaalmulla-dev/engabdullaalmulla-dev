/** The small REST surface: accounts, your own record, and the leaderboard. */

import type { IncomingMessage, ServerResponse } from 'node:http';

import { AuthError, RateLimiter, login, register, revokeSession, userForToken } from './auth';
import { config } from './config';
import { leaderboard, statsFor } from './stats';

const signUps = new RateLimiter(5, 60 * 60_000);
const signIns = new RateLimiter(10, 15 * 60_000);
const perName = new RateLimiter(6, 15 * 60_000);

setInterval(() => {
  signUps.sweep();
  signIns.sweep();
  perName.sweep();
}, 5 * 60_000).unref?.();

export function clientIp(request: IncomingMessage): string {
  if (config.trustProxy) {
    const forwarded = request.headers['x-forwarded-for'];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (first) return first.split(',')[0].trim();
  }
  return request.socket.remoteAddress ?? 'unknown';
}

export function bearer(request: IncomingMessage): string {
  const header = request.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function cors(request: IncomingMessage, response: ServerResponse): void {
  const origin = request.headers.origin;
  if (!origin) return;
  if (config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Max-Age', '600');
  }
}

function send(response: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  response.end(text);
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += (chunk as Buffer).length;
    // Nobody needs to send more than this to sign in.
    if (size > 8192) throw new AuthError(413, 'too_large', 'That request is too big.');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    throw new AuthError(400, 'bad_json', 'That request was not valid JSON.');
  }
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

export async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  cors(request, response);
  const url = new URL(request.url ?? '/', 'http://localhost');
  const route = `${request.method} ${url.pathname}`;

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    switch (route) {
      case 'GET /health':
        send(response, 200, { ok: true });
        return;

      case 'POST /api/register': {
        const ip = clientIp(request);
        if (!signUps.take(ip)) {
          send(response, 429, { error: 'rate_limited', message: 'Too many new accounts from here.' });
          return;
        }
        const body = await readJson(request);
        const result = await register(text(body.name), text(body.password));
        send(response, 201, result);
        return;
      }

      case 'POST /api/login': {
        const ip = clientIp(request);
        const name = text((await peek(request)).name);
        if (!signIns.take(ip) || !perName.take(name.toLowerCase())) {
          send(response, 429, { error: 'rate_limited', message: 'Too many tries. Wait a moment.' });
          return;
        }
        const body = cached(request);
        const result = await login(text(body.name), text(body.password));
        signIns.clear(ip);
        perName.clear(name.toLowerCase());
        send(response, 200, result);
        return;
      }

      case 'POST /api/logout': {
        revokeSession(bearer(request));
        send(response, 200, { ok: true });
        return;
      }

      case 'GET /api/me': {
        const user = userForToken(bearer(request));
        if (!user) {
          send(response, 401, { error: 'unauthorised', message: 'Sign in again.' });
          return;
        }
        send(response, 200, { user, stats: statsFor(user.id) });
        return;
      }

      case 'GET /api/leaderboard': {
        const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 25) || 25));
        send(response, 200, { rows: leaderboard(limit) });
        return;
      }

      default:
        send(response, 404, { error: 'not_found', message: 'No such endpoint.' });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      send(response, error.status, { error: error.code, message: error.message });
      return;
    }
    send(response, 500, { error: 'server_error', message: 'Something went wrong at our end.' });
  }
}

/* The login route needs the body before it decides on rate limits, so it is
 * read once and held for the handler below. */
const bodies = new WeakMap<IncomingMessage, Record<string, unknown>>();

async function peek(request: IncomingMessage): Promise<Record<string, unknown>> {
  const existing = bodies.get(request);
  if (existing) return existing;
  const body = await readJson(request);
  bodies.set(request, body);
  return body;
}

function cached(request: IncomingMessage): Record<string, unknown> {
  return bodies.get(request) ?? {};
}
