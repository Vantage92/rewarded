import { describe, expect, it } from 'vitest';
import * as contracts from '../src/index.ts';
import type { ApiErrorBody } from '../src/index.ts';

describe('@rewarded/contracts', () => {
  it('loads the public entry point', () => {
    expect(typeof contracts).toBe('object');
  });

  it('exposes the error body type', () => {
    const body: ApiErrorBody = { error: { code: 'INTERNAL', message_key: 'errors.common.internal' } };
    expect(body.error.code).toBe('INTERNAL');
  });
});
