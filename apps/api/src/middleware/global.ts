// The global middleware stack of /api/v1, in order (architecture §8.1, §10.2, §10.3, §10.9).
// createApp installs it before any module registers its routes.
import type { Hono } from 'hono';
import type { Db } from '../db/types.ts';
import { CURRENT_PARAMS } from '@rewarded/core';
import { CidrNetClassifier, type NetClassifier } from '../platform/net.ts';
import { JsonLineLogger, type Logger } from '../platform/log.ts';
import type { Platform } from '../platform/types.ts';
import { sessionLoader } from './auth.ts';
import { DEFAULT_HTTP_CONFIG, type AppEnv, type HttpConfig } from './context.ts';
import { csrf } from './csrf.ts';
import { RateLimiter } from './rateLimit.ts';
import { accessLog, requestContext, securityHeaders } from './request.ts';

export interface GlobalMiddlewareDeps {
  db: Db;
  platform: Platform;
  http?: HttpConfig;
}

export interface GlobalMiddlewareResult {
  logger: Logger;
  net: NetClassifier;
  limiter: RateLimiter;
  http: HttpConfig;
}

export function globalMiddleware(api: Hono<AppEnv>, deps: GlobalMiddlewareDeps): GlobalMiddlewareResult {
  const { platform } = deps;
  const logger = platform.logger ?? new JsonLineLogger((line) => process.stdout.write(line + '\n'), () => platform.clock.now());
  // Without configured CIDR ranges every address is `other` (params.net_classes is empty, open question 17).
  const net = platform.net ?? new CidrNetClassifier(CURRENT_PARAMS.net_classes);
  const limiter = new RateLimiter(platform.clock);
  const http = deps.http ?? DEFAULT_HTTP_CONFIG;
  api.use('*', requestContext({ db: deps.db, clock: platform.clock, random: platform.random, hasher: platform.hasher, net, logger, limiter, http }));
  api.use('*', accessLog());
  api.use('*', securityHeaders());
  api.use('*', sessionLoader(deps.db, platform.clock));
  api.use('*', csrf({ random: platform.random }));
  return { logger, net, limiter, http };
}
