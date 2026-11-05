// Playwright fixtures for the WP-8 session specs. Every test gets its own FakeApi behind
// page.route('/api/v1/**'), Playwright's page.clock for browser time (setTimeout, Date and
// performance.now) and `advance()` that moves server and browser time together, the way
// architecture §11 pairs page.clock with POST /dev/clock. Test mode installs window.__rwTest.
import { test as base, expect, type BrowserContext, type Page, type Route } from '@playwright/test';
import type { RouteId } from '../../packages/contracts/src/routes.ts';
import { matchRoute } from '../../packages/contracts/src/routes.ts';
import { FakeApi, type FakeApiOptions } from './fake-api.ts';

export const START = Date.parse('2026-12-02T09:00:00.000Z');
export const MIN = 60_000;

interface Rw {
  fake: FakeApi;
  /** Drop the answer to the next n calls of a route after the server processed them (§4.7). */
  dropNext(id: RouteId, n?: number): void;
  /** Browser and server time forward together, in steps (ms). */
  advance(ms: number, step?: number): Promise<void>;
  /** Network off/on: context.setOffline plus the fake refusing requests. */
  setOffline(offline: boolean): Promise<void>;
  setVisibility(page: Page, v: 'visible' | 'hidden'): Promise<void>;
  /** Opens a page of this context with clock, test hooks and the fake API. */
  openPage(): Promise<Page>;
}

const origins = new WeakMap<FakeApi, { server: number; mono: number }>();

/** Maps the first page's performance.now() onto server time: server elapsed = browser elapsed. */
async function syncServerTime(page: Page, fake: FakeApi): Promise<void> {
  const mono = await page.evaluate(() => performance.now()).catch(() => null);
  if (mono === null) return;
  let o = origins.get(fake);
  if (!o) {
    o = { server: fake.now, mono };
    origins.set(fake, o);
  }
  const t = o.server + (mono - o.mono);
  if (t > fake.now) fake.now = Math.round(t);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const inflight = new WeakMap<FakeApi, { n: number }>();

/** Real-time pause until requests the page started have reached the fake and been answered. */
async function settle(fake: FakeApi): Promise<void> {
  await sleep(15);
  const c = inflight.get(fake);
  for (let i = 0; c && c.n > 0 && i < 200; i++) await sleep(5);
}

async function wire(context: BrowserContext, page: Page, fake: FakeApi, drops: Map<RouteId, number>, offline: { on: boolean }): Promise<void> {
  if (!inflight.has(fake)) inflight.set(fake, { n: 0 });
  const counter = inflight.get(fake)!;
  await page.addInitScript(() => {
    (globalThis as unknown as { __RW_TEST__: boolean }).__RW_TEST__ = true;
  });
  // Paused: browser time moves only with advance(), never with real time (load, slow CI).
  await page.clock.install({ time: fake.now });
  await page.clock.pauseAt(fake.now + 1);
  await page.route('**/api/v1/**', async (route: Route) => {
    counter.n++;
    try {
      await answer(route);
    } finally {
      counter.n--;
    }
  });
  async function answer(route: Route): Promise<void> {
    if (offline.on) return route.abort('internetdisconnected');
    const req = route.request();
    // Server time follows the browser's monotonic clock (page.clock), the way architecture §11 pairs
    // page.clock with POST /dev/clock; it never runs backwards.
    await syncServerTime(page, fake);
    const url = new URL(req.url());
    const match = matchRoute(req.method() as 'GET', url.pathname.replace(/^\/api\/v1/, ''));
    const res = fake.http(req.method(), req.url(), req.postData(), req.headers());
    const left = match ? (drops.get(match.id) ?? 0) : 0;
    if (match && left > 0) {
      // Processed by the server, answer lost on the way back (architecture §4.7 E2E).
      drops.set(match.id, left - 1);
      return route.abort('connectionreset');
    }
    if (res.body === null) return route.fulfill({ status: res.status, body: '' });
    return route.fulfill({ status: res.status, contentType: 'application/json', body: JSON.stringify(res.body) });
  }
  void context;
}

export const test = base.extend<{ rw: Rw; fakeOptions: FakeApiOptions }>({
  fakeOptions: [{ now: START, auth: 'student', squad: true }, { option: true }],
  rw: async ({ page, context, fakeOptions }, provide) => {
    const fake = new FakeApi(fakeOptions);
    const drops = new Map<RouteId, number>();
    const offline = { on: false };
    const pages: Page[] = [page];
    await wire(context, page, fake, drops, offline);
    const rw: Rw = {
      fake,
      dropNext(id, n = 1) {
        drops.set(id, n);
      },
      async advance(ms, step = 5000) {
        let left = ms;
        while (left > 0) {
          const d = Math.min(step, left);
          for (const p of pages) await p.clock.runFor(d);
          await settle(fake);
          await syncServerTime(pages[0]!, fake);
          left -= d;
        }
      },
      async setOffline(on) {
        offline.on = on;
        await context.setOffline(on);
        await settle(fake);
      },
      async setVisibility(p, v) {
        await p.waitForFunction(() => Boolean((globalThis as unknown as { __rwTest?: unknown }).__rwTest));
        await p.evaluate((vis) => (globalThis as unknown as { __rwTest: { setVisibility(x: string): void } }).__rwTest.setVisibility(vis), v);
      },
      async openPage() {
        const p = await context.newPage();
        await wire(context, p, fake, drops, offline);
        pages.push(p);
        return p;
      },
    };
    await provide(rw);
  },
});

export { expect };

/** From the home screen: choose a length, then [Start focussessie] and [Begin] on F2. */
export async function startSession(page: Page, minutes: 25 | 50 | 90 = 25): Promise<void> {
  await page.goto(`/focus?duur=${minutes}`);
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
}
