// Idempotency-Key (architecture §4.7, §5.4): a repeated key with the same request replays the stored
// response; the same key with another body gives IDEMPOTENCY_CONFLICT. Records live 24 hours (§10.6).
// A handler that writes inside its own transaction can call `saveIdempotentResponse(tx, c, …)` so
// the record commits together with the change; otherwise the middleware stores it after a 2xx.
import { DomainError } from '@rewarded/contracts';
import type { Context, MiddlewareHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { sha256 } from '../db/ids.ts';
import type { Db } from '../db/types.ts';
import type { Clock } from '../platform/types.ts';
import type { AppEnv } from './context.ts';

export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
export const IDEMPOTENCY_TTL_MS = 24 * 3600 * 1000;
const KEY_FORMAT = /^[A-Za-z0-9_.:-]{8,128}$/;

export interface IdempotencyOptions {
  /** Route id or name, stored with the record. */
  scope: string;
  db?: Db;
  clock?: Clock;
}

/** Stable JSON (sorted keys) so the same body always hashes the same. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(',')}}`;
}

function scopeRefOf(c: Context<AppEnv>): string {
  const auth = c.var.auth;
  if (auth.kind === 'user') return auth.user.id;
  if (auth.kind === 'pre') return `pre:${auth.sessionId}`;
  return `public:${c.var.ipHash}`;
}

interface StoredRecord {
  route: string;
  request_hash: string;
  status_code: number;
  response: string;
}

/**
 * Checks the key before the handler. Returns a replay response, or undefined when the handler
 * should run (the key is then on `c.var.idempotency`).
 */
export function checkIdempotency(c: Context<AppEnv>, db: Db, clock: Clock, scope: string, body: unknown): Response | undefined {
  const key = c.req.header(IDEMPOTENCY_HEADER);
  if (key === undefined || !KEY_FORMAT.test(key)) throw new DomainError('VALIDATION_FAILED', { field: IDEMPOTENCY_HEADER });
  const scopeRef = scopeRefOf(c);
  const requestHash = sha256(`${c.req.method} ${c.req.path}\n${canonicalJson(body ?? null)}`);
  const cutoff = new Date(clock.now().getTime() - IDEMPOTENCY_TTL_MS).toISOString();
  const rec = db.get<StoredRecord & { created_at: string }>(
    'SELECT route, request_hash, status_code, response, created_at FROM idempotency_record WHERE scope_ref = ? AND key = ?',
    [scopeRef, key],
  );
  if (rec && rec.created_at > cutoff) {
    if (rec.request_hash !== requestHash || rec.route !== scope) throw new DomainError('IDEMPOTENCY_CONFLICT');
    c.header('Idempotent-Replayed', 'true');
    if (rec.response === '') return c.body(null, rec.status_code as ContentfulStatusCode);
    return c.newResponse(rec.response, rec.status_code as ContentfulStatusCode, { 'Content-Type': 'application/json' });
  }
  if (rec) db.run('DELETE FROM idempotency_record WHERE scope_ref = ? AND key = ?', [scopeRef, key]);
  c.set('idempotency', { scopeRef, key, route: scope, requestHash, saved: false });
  return undefined;
}

/** Stores the response for the current key in `tx` (call inside the handler's transaction). */
export function saveIdempotentResponse(tx: Db, c: Context<AppEnv>, clock: Clock, status: number, response: unknown): void {
  const idem = c.var.idempotency;
  if (!idem || idem.saved) return;
  tx.run(
    `INSERT INTO idempotency_record (scope_ref, key, route, request_hash, status_code, response, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (scope_ref, key) DO NOTHING`,
    [idem.scopeRef, idem.key, idem.route, idem.requestHash, status, response === undefined ? '' : JSON.stringify(response), clock.now().toISOString()],
  );
  idem.saved = true;
}

/** Middleware form (reads a JSON body itself); `mount` uses the functions above directly. */
export function idempotency(opts: IdempotencyOptions): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    let body: unknown = null;
    try {
      body = await c.req.raw.clone().json();
    } catch {
      body = null;
    }
    const db = opts.db ?? c.var.db;
    const clock = opts.clock ?? c.var.clock;
    const replay = checkIdempotency(c, db, clock, opts.scope, body);
    if (replay) return replay;
    await next();
    const idem = c.var.idempotency;
    if (idem && !idem.saved && c.res.status >= 200 && c.res.status < 300) {
      const text = await c.res.clone().text();
      saveIdempotentResponse(db, c, clock, c.res.status, text === '' ? undefined : (JSON.parse(text) as unknown));
    }
  };
}
