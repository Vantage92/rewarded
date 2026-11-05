// Global request middleware (architecture §8.1, §10.3, §10.9): request id, client IP → hash and
// net class (raw address only in memory), user-agent class, security headers and the access log.
import type { MiddlewareHandler } from 'hono';
import { routePath } from 'hono/route';
import type { Db } from '../db/types.ts';
import type { Logger } from '../platform/log.ts';
import type { NetClassifier } from '../platform/net.ts';
import type { Clock, Hasher, Random } from '../platform/types.ts';
import { uaClassOf } from '../platform/ua.ts';
import type { AppEnv, HttpConfig } from './context.ts';
import type { RateLimiter } from './rateLimit.ts';

export interface RequestContextDeps {
  db: Db;
  clock: Clock;
  random: Random;
  hasher: Hasher;
  net: NetClassifier;
  logger: Logger;
  limiter: RateLimiter;
  http: HttpConfig;
}

interface NodeEnv {
  incoming?: { socket?: { remoteAddress?: string } };
}

/** Client IP: X-Forwarded-For only behind our own proxy, else the socket address. */
export function clientIp(headers: Headers, env: unknown, trustProxy: boolean): string {
  if (trustProxy) {
    const first = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (first) return first;
  }
  const addr = (env as NodeEnv | undefined)?.incoming?.socket?.remoteAddress;
  return addr ?? '0.0.0.0';
}

export function requestContext(deps: RequestContextDeps): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const ip = clientIp(c.req.raw.headers, c.env, deps.http.trustProxy);
    c.set('requestId', Buffer.from(deps.random.bytes(8)).toString('hex'));
    c.set('ipHash', deps.hasher.hash('ip', ip));
    c.set('netClass', deps.net.classify(ip));
    c.set('uaClass', uaClassOf(c.req.header('User-Agent')));
    c.set('limiter', deps.limiter);
    c.set('http', deps.http);
    c.set('db', deps.db);
    c.set('clock', deps.clock);
    c.set('logger', deps.logger);
    c.set('auth', { kind: 'none' });
    await next();
  };
}

/** Headers of architecture §10.3; routes may override (cards set their own CSP). */
export function securityHeaders(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    await next();
    const set = (name: string, value: string) => {
      if (!c.res.headers.has(name)) c.res.headers.set(name, value);
    };
    set('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'");
    set('Referrer-Policy', 'same-origin');
    set('X-Content-Type-Options', 'nosniff');
    set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    set('Cache-Control', 'no-store');
  };
}

/** Access log with the allowlist: route pattern, status, duration, request id, net class, error code. */
export function accessLog(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const start = c.var.clock.now().getTime();
    await next();
    let errorCode: string | undefined;
    if (c.res.status >= 400 && c.res.headers.get('Content-Type')?.includes('application/json')) {
      try {
        errorCode = ((await c.res.clone().json()) as { error?: { code?: string } }).error?.code;
      } catch {
        errorCode = undefined;
      }
    }
    let pattern = '*';
    try {
      pattern = routePath(c, -1);
    } catch {
      pattern = '*';
    }
    c.var.logger.log(c.res.status >= 500 ? 'error' : 'info', 'request', {
      // Only middleware matched (e.g. '/api/v1/*'): no route, so no concrete path in the log either.
      route: `${c.req.method} ${pattern === '*' || pattern.endsWith('/*') ? '/unmatched' : pattern}`,
      status: c.res.status,
      duration_ms: c.var.clock.now().getTime() - start,
      request_id: c.var.requestId,
      net_class: c.var.netClass,
      error_code: errorCode,
    });
  };
}
