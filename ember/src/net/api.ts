/**
 * The small REST surface: accounts and records. Everything that happens at a
 * table goes over the socket instead.
 */

import type { LeaderboardRow, PublicUser, UserStats } from '../../shared/protocol';

const configured = process.env.EXPO_PUBLIC_EMBER_SERVER;

/**
 * Whether this build has a server to talk to at all. Building with
 * EXPO_PUBLIC_EMBER_SERVER=none produces a bots-only app, which is what gets
 * published anywhere the app cannot reach a server.
 */
export const ONLINE_ENABLED = configured !== 'none';

/**
 * Where the server lives. Set EXPO_PUBLIC_EMBER_SERVER when you build, or
 * leave it for a server running on the same machine during development.
 */
export const SERVER_URL = (
  configured && configured !== 'none' ? configured : 'http://localhost:8787'
).replace(/\/$/, '');

export function socketUrl(): string {
  return `${SERVER_URL.replace(/^http/, 'ws')}/ws`;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;

  let response: Response;
  try {
    response = await fetch(`${SERVER_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'offline', 'Could not reach the server. Check your connection.');
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    throw new ApiError(
      response.status,
      String(payload.error ?? 'server_error'),
      String(payload.message ?? 'Something went wrong.'),
    );
  }
  return payload as T;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export const api = {
  register: (name: string, password: string) =>
    request<AuthResponse>('/api/register', { method: 'POST', body: { name, password } }),

  login: (name: string, password: string) =>
    request<AuthResponse>('/api/login', { method: 'POST', body: { name, password } }),

  logout: (token: string) => request<{ ok: boolean }>('/api/logout', { method: 'POST', token }),

  me: (token: string) => request<{ user: PublicUser; stats: UserStats }>('/api/me', { token }),

  leaderboard: () => request<{ rows: LeaderboardRow[] }>('/api/leaderboard'),
};
