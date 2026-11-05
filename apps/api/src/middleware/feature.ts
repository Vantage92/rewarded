// Feature flags as route guards (architecture §3.5): a disabled flag answers FEATURE_DISABLED.
import { DomainError } from '@rewarded/contracts';
import type { MiddlewareHandler } from 'hono';
import { isFeatureEnabled, type FeatureFlagName } from '../db/flags.ts';
import type { AppEnv } from './context.ts';

export function requireFeature(key: FeatureFlagName): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!isFeatureEnabled(c.var.db, key)) throw new DomainError('FEATURE_DISABLED', { flag: key });
    await next();
  };
}
