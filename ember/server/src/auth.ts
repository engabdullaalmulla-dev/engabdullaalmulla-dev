/**
 * Accounts.
 *
 * A name and a password, nothing else — the server never asks for an email or
 * anything else about a person, so there is nothing here worth stealing beyond
 * the hashes themselves. Those are scrypt, which is memory-hard, with a random
 * salt each and a constant-time comparison.
 */

import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { config } from './config';
import { db } from './db';
import type { PublicUser } from '../../shared/protocol';

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

// 16 MiB of memory per hash: enough to make a rented GPU farm uninteresting,
// small enough that a busy table does not notice a sign-in.
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 };

export const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _.-]{2,15}$/;
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 200;

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export class AuthError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------------ */
/* passwords                                                           */
/* ------------------------------------------------------------------ */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize('NFKC'), salt, SCRYPT.keylen, SCRYPT);
  return [
    'scrypt',
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password.normalize('NFKC'), salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ------------------------------------------------------------------ */
/* names                                                               */
/* ------------------------------------------------------------------ */

export function foldName(name: string): string {
  return name.normalize('NFKC').trim().toLowerCase();
}

function checkCredentials(name: string, password: string): void {
  const trimmed = name.trim();
  if (!NAME_PATTERN.test(trimmed)) {
    throw new AuthError(
      400,
      'bad_name',
      'Names are 3 to 16 characters: letters, numbers, spaces, and . _ -',
    );
  }
  if (password.length < MIN_PASSWORD) {
    throw new AuthError(400, 'weak_password', `Passwords need at least ${MIN_PASSWORD} characters.`);
  }
  if (password.length > MAX_PASSWORD) {
    throw new AuthError(400, 'long_password', 'That password is too long.');
  }
}

/* ------------------------------------------------------------------ */
/* sessions                                                            */
/* ------------------------------------------------------------------ */

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function issueSession(userId: string): string {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  db()
    .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?,?,?,?)')
    .run(hashToken(token), userId, now, now + config.sessionDays * 86_400_000);
  return token;
}

export function userForToken(token: string): PublicUser | null {
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT users.id AS id, users.name AS name, sessions.expires_at AS expires_at
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`,
    )
    .get(hashToken(token)) as { id: string; name: string; expires_at: number } | undefined;

  if (!row) return null;
  if (row.expires_at < Date.now()) {
    revokeSession(token);
    return null;
  }
  db().prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(Date.now(), row.id);
  return { id: row.id, name: row.name };
}

export function revokeSession(token: string): void {
  db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

/* ------------------------------------------------------------------ */
/* register and sign in                                                */
/* ------------------------------------------------------------------ */

export async function register(name: string, password: string): Promise<AuthResult> {
  checkCredentials(name, password);
  const trimmed = name.trim();
  const folded = foldName(trimmed);

  const taken = db().prepare('SELECT 1 FROM users WHERE name_folded = ?').get(folded);
  if (taken) throw new AuthError(409, 'name_taken', 'That name is already playing.');

  const id = randomBytes(12).toString('base64url');
  const now = Date.now();
  const passwordHash = await hashPassword(password);

  try {
    db()
      .prepare(
        `INSERT INTO users (id, name, name_folded, password_hash, created_at, last_seen_at)
         VALUES (?,?,?,?,?,?)`,
      )
      .run(id, trimmed, folded, passwordHash, now, now);
  } catch {
    // Two people claiming the same name in the same instant land here.
    throw new AuthError(409, 'name_taken', 'That name is already playing.');
  }
  db().prepare('INSERT INTO stats (user_id, updated_at) VALUES (?, ?)').run(id, now);

  return { token: issueSession(id), user: { id, name: trimmed } };
}

export async function login(name: string, password: string): Promise<AuthResult> {
  const folded = foldName(name ?? '');
  const row = db()
    .prepare('SELECT id, name, password_hash FROM users WHERE name_folded = ?')
    .get(folded) as { id: string; name: string; password_hash: string } | undefined;

  // The same wording and roughly the same work either way, so a stranger
  // cannot use the sign-in form to find out who has an account.
  const stored =
    row?.password_hash ??
    'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');
  const ok = await verifyPassword(password ?? '', stored);

  if (!row || !ok) throw new AuthError(401, 'bad_credentials', 'Wrong name or password.');
  return { token: issueSession(row.id), user: { id: row.id, name: row.name } };
}

/* ------------------------------------------------------------------ */
/* rate limiting                                                       */
/* ------------------------------------------------------------------ */

/** A plain sliding window, held in memory. One machine, one process. */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** True when the caller is inside their allowance. */
  take(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((at) => now - at < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  /** Called after a success, so honest users never accumulate a penalty. */
  clear(key: string): void {
    this.hits.delete(key);
  }

  sweep(now = Date.now()): void {
    for (const [key, times] of this.hits) {
      const recent = times.filter((at) => now - at < this.windowMs);
      if (recent.length === 0) this.hits.delete(key);
      else this.hits.set(key, recent);
    }
  }
}
