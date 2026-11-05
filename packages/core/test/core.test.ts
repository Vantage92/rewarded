import { describe, expect, it } from 'vitest';
import * as core from '../src/index.ts';

describe('@rewarded/core', () => {
  it('loads the public entry point (empty until WP-1/4/5/6 fill it)', () => {
    expect(typeof core).toBe('object');
  });
});
