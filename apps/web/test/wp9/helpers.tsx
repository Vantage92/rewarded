// Test helpers for the WP-9 student screens: the real app routes on the contracts mock client.
import { render, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { responseExamples, type MeResponse, type MockHandlers, type RouteId } from '@rewarded/contracts';
import { createMemoryRouter } from 'react-router';
import { App } from '../../src/app/App.tsx';
import { routes } from '../../src/app/routes.tsx';
import { createWebApi, type WebApi } from '../../src/lib/api/web.ts';

type MeOverrides = {
  age_band?: MeResponse['age_band'];
  flags?: Partial<MeResponse['flags']>;
  settings?: Partial<NonNullable<MeResponse['settings']>>;
  user?: Partial<NonNullable<MeResponse['user']>>;
  squad?: MeResponse['squad'] | null;
  club?: MeResponse['club'] | null;
};

export function makeMe(o: MeOverrides = {}): MeResponse {
  const base = structuredClone(responseExamples['me.get']) as MeResponse;
  const me: MeResponse = {
    ...base,
    age_band: o.age_band === undefined ? base.age_band : o.age_band,
    flags: { ...base.flags, ...o.flags },
    settings: { ...base.settings!, ...o.settings },
    user: { ...base.user!, ...o.user },
  };
  if (o.squad === null) delete me.squad;
  else if (o.squad) me.squad = o.squad;
  if (o.club === null) delete me.club;
  else if (o.club) me.club = o.club;
  return me;
}

export interface RenderOptions {
  handlers?: MockHandlers;
  me?: MeOverrides;
  locale?: 'nl' | 'en';
}

export function renderAt(path: string, { handlers = {}, me = {}, locale = 'nl' }: RenderOptions = {}) {
  const meResponse = makeMe(me);
  const api: WebApi = createWebApi({ mode: 'mock', loadFeatureMocks: false, handlers: { 'me.get': () => meResponse, ...handlers } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(<App router={router} locale={locale} api={api} />);
  return { ...utils, api, router };
}

/** Route ids called so far on the mock. */
export const calledIds = (api: WebApi): RouteId[] => api.mock?.calls.map((c) => c.id) ?? [];

/** Bodies of tracked client events. */
export const trackedEvents = (api: WebApi) =>
  (api.mock?.calls ?? []).filter((c) => c.id === 'events.track').map((c) => c.input.body as { name: string; props: Record<string, unknown> });

export async function waitForCall(api: WebApi, id: RouteId) {
  await waitFor(() => expect(calledIds(api)).toContain(id));
}

/** Visible text of the document body. */
export const bodyText = () => document.body.textContent ?? '';
