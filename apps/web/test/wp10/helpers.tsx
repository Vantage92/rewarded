// Test helpers for WP-10 (admin and board): the real app routes on the contracts mock client with the
// stateful admin mock, so a decision changes what the next screen shows.
import { render, within } from '@testing-library/react';
import type { MockHandlers, RouteId } from '@rewarded/contracts';
import { createMemoryRouter } from 'react-router';
import { App } from '../../src/app/App.tsx';
import { routes } from '../../src/app/routes.tsx';
import { createWebApi, type WebApi } from '../../src/lib/api/web.ts';
import { adminMock } from '../../src/features/admin/mock.ts';
import { handlers as boardHandlers } from '../../src/features/board/mock.ts';
import { clearWorksets } from '../../src/features/admin/ui.tsx';

export interface RenderOptions {
  handlers?: MockHandlers;
  locale?: 'nl' | 'en';
  mfaVerified?: boolean;
}

export function renderAdmin(path: string, { handlers = {}, locale = 'nl', mfaVerified = true }: RenderOptions = {}) {
  adminMock.reset({ mfaVerified });
  clearWorksets();
  const api: WebApi = createWebApi({ mode: 'mock', loadFeatureMocks: false, handlers: { ...adminMock.handlers, ...boardHandlers, ...handlers } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(<App router={router} locale={locale} api={api} />);
  return { ...utils, api, router, mock: adminMock };
}

export const calledIds = (api: WebApi): RouteId[] => api.mock?.calls.map((c) => c.id) ?? [];

/** The <article> that holds the heading matching `name`. */
export function cardOf(heading: HTMLElement): HTMLElement {
  const card = heading.closest('article');
  if (!card) throw new Error('heading is not inside an article');
  return card as HTMLElement;
}

export const inCard = (heading: HTMLElement) => within(cardOf(heading));
