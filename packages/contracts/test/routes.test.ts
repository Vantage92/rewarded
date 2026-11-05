import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ERROR_CODES, ROUTE_IDS, StartSessionRequest, matchRoute, requestExamples, responseExamples, routes, buildPath, type RouteDef } from '../src/index.ts';
import { SECTION_8_2_ENDPOINTS } from './endpoints.ts';

const all = ROUTE_IDS.map((id) => [id, routes[id] as RouteDef] as const);

/** Walks a zod schema and returns the paths of object schemas that accept unknown keys. */
function looseObjects(schema: z.ZodType, path = '$', seen = new Set<unknown>()): string[] {
  if (seen.has(schema)) return [];
  seen.add(schema);
  const def = (schema as unknown as { _zod: { def: Record<string, unknown> & { type: string } } })._zod.def;
  const sub = (s: unknown, p: string) => looseObjects(s as z.ZodType, p, seen);
  switch (def.type) {
    case 'object': {
      const catchall = def.catchall as { _zod: { def: { type: string } } } | undefined;
      const out = catchall?._zod.def.type === 'never' ? [] : [path];
      for (const [k, v] of Object.entries(def.shape as Record<string, unknown>)) out.push(...sub(v, `${path}.${k}`));
      return out;
    }
    case 'array':
      return sub(def.element, `${path}[]`);
    case 'optional':
    case 'nullable':
    case 'default':
    case 'readonly':
    case 'nonoptional':
    case 'catch':
    case 'prefault':
      return sub(def.innerType, path);
    case 'union':
      return (def.options as unknown[]).flatMap((o, i) => sub(o, `${path}|${i}`));
    case 'record':
      return sub(def.valueType, `${path}{}`);
    case 'pipe':
      return [...sub(def.in, path), ...sub(def.out, path)];
    case 'intersection':
      return [...sub(def.left, path), ...sub(def.right, path)];
    case 'lazy':
      return sub((def.getter as () => unknown)(), path);
    default:
      return [];
  }
}

describe('route registry (architecture §8.2)', () => {
  it('§8.2: every endpoint in the document has exactly one route definition', () => {
    const registered = all.map(([, r]) => `${r.method} ${r.path}`);
    expect(new Set(registered).size).toBe(registered.length);
    expect([...registered].sort()).toEqual([...SECTION_8_2_ENDPOINTS].sort());
  });

  it('§8.2: every route has a response schema, a success status and a module', () => {
    for (const [id, r] of all) {
      expect(r.response, id).toBeDefined();
      expect(r.status.length, id).toBeGreaterThan(0);
      expect(r.module, id).toMatch(/^[a-z_]+$/);
      expect(r.spec, id).toMatch(/§/);
    }
  });

  it('§8.2: mutating routes with a request body in the table have a body schema; GET routes never do', () => {
    for (const [id, r] of all) if (r.method === 'GET') expect(r.body, id).toBeUndefined();
    const needsBody = ['POST /sessions', 'POST /sessions/:id/heartbeats', 'POST /sessions/:id/end', 'POST /redemptions', 'POST /events', 'DELETE /me', 'POST /onboarding'];
    for (const ep of needsBody) {
      const r = all.find(([, d]) => `${d.method} ${d.path}` === ep)?.[1];
      expect(r?.body, ep).toBeDefined();
    }
  });

  it('§8.2: path parameters and their schema agree', () => {
    for (const [id, r] of all) {
      const names = [...r.path.matchAll(/:([a-z_]+)/g)].map((m) => m[1]);
      if (names.length === 0) {
        expect(r.params, id).toBeUndefined();
        continue;
      }
      const shape = (r.params as unknown as { _zod: { def: { shape: Record<string, unknown> } } })._zod.def.shape;
      expect(Object.keys(shape).sort(), id).toEqual([...names].sort());
    }
  });

  it('§8.2: every listed error code exists and has an owning module', () => {
    for (const [id, r] of all) for (const code of r.errors) expect(ERROR_CODES[code]?.module, `${id} ${code}`).toBeTruthy();
  });

  it('§10.3: every object schema (params, query, body, response) rejects unknown fields', () => {
    const loose: string[] = [];
    for (const [id, r] of all)
      for (const part of ['params', 'query', 'body', 'response'] as const) {
        const s = r[part];
        if (s) loose.push(...looseObjects(s, `${id}.${part}`));
      }
    expect(loose).toEqual([]);
  });

  it('§10.3: the strictness walker detects loose objects (self-test)', () => {
    expect(looseObjects(z.object({ a: z.string() }))).toEqual(['$']);
    expect(looseObjects(z.strictObject({ a: z.array(z.object({ b: z.string() }).optional()) }))).toEqual(['$.a[]']);
    expect(looseObjects(z.strictObject({ a: z.union([z.strictObject({}), z.looseObject({})]) }))).toEqual(['$.a|1']);
  });

  it('§10.3: request examples pass, and the same body with an extra field is refused', () => {
    for (const [id, ex] of Object.entries(requestExamples) as [keyof typeof requestExamples, { body?: unknown; params?: unknown; query?: unknown }][]) {
      const r: RouteDef = routes[id];
      if (ex.params !== undefined) expect(r.params?.safeParse(ex.params).success, `${id} params`).toBe(true);
      if (ex.query !== undefined) expect(r.query?.safeParse(ex.query).success, `${id} query`).toBe(true);
      if (ex.body !== undefined) {
        const ok = r.body!.safeParse(ex.body);
        expect(ok.success, `${id} body ${JSON.stringify(ok.error?.issues)}`).toBe(true);
        expect(r.body!.safeParse({ ...(ex.body as object), unexpected_field: 1 }).success, `${id} strict`).toBe(false);
      }
    }
  });

  it('§11 contract: response examples pass their schema and fail with an extra field', () => {
    for (const [id, ex] of Object.entries(responseExamples)) {
      const r: RouteDef = routes[id as keyof typeof routes];
      const res = r.response.safeParse(ex);
      expect(res.success, `${id} ${JSON.stringify(res.error?.issues)}`).toBe(true);
      expect(r.response.safeParse({ ...(ex as object), unexpected_field: 1 }).success, `${id} strict`).toBe(false);
    }
  });

  it('arch §4.3 step 5: practice holds exactly when planned_min is 1', () => {
    const base = { device_id: '01JC0000000000000000000040', client_ts: 1, mono_ms: 1, webdriver: false, standalone: false };
    expect(StartSessionRequest.safeParse({ ...base, planned_min: 1, practice: true }).success).toBe(true);
    expect(StartSessionRequest.safeParse({ ...base, planned_min: 25, practice: false }).success).toBe(true);
    expect(StartSessionRequest.safeParse({ ...base, planned_min: 1, practice: false }).success).toBe(false);
    expect(StartSessionRequest.safeParse({ ...base, planned_min: 50, practice: true }).success).toBe(false);
    expect(StartSessionRequest.safeParse({ ...base, planned_min: 30, practice: false }).success).toBe(false);
  });

  it('arch §8.2: idempotent routes require the Idempotency-Key header', () => {
    for (const id of ['waitlist.join', 'sessions.start', 'redemptions.create', 'squads.create', 'challenges.enroll'] as const) expect(routes[id].idempotencyKey).toBe('required');
  });

  it('arch §7: no draw routes exist', () => {
    expect(all.filter(([, r]) => r.path.includes('draw'))).toEqual([]);
  });

  it('matchRoute prefers literal segments over parameters', () => {
    expect(matchRoute('GET', '/sessions/active')?.id).toBe('sessions.active');
    expect(matchRoute('GET', '/sessions/01JC0000000000000000000030')).toEqual({ id: 'sessions.get', params: { id: '01JC0000000000000000000030' } });
    expect(matchRoute('POST', '/squads/merge-requests/01JC0000000000000000000001/accept')?.id).toBe('squads.mergeAccept');
    expect(matchRoute('GET', '/nope')).toBeUndefined();
    expect(buildPath('/admin/samples/:id/items/:item/judgement', { id: 'a', item: 'b/c' })).toBe('/admin/samples/a/items/b%2Fc/judgement');
  });
});
