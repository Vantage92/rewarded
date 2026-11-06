// Registry of every endpoint of architecture §8.2, keyed by a stable route id. The dev routes are
// kept out on purpose (import them from '@rewarded/contracts/dev'), so the production bundle never
// contains them (architecture §10.3).
import { adminRoutes } from './admin.ts';
import { authRoutes } from './auth.ts';
import { belofteRoutes } from './belofte.ts';
import { calendarRoutes } from './calendars.ts';
import { cardRoutes } from './cards.ts';
import { catalogRoutes } from './catalog.ts';
import { challengeRoutes } from './challenges.ts';
import { clubRoutes } from './clubs.ts';
import { drawRoutes } from './draws.ts';
import { duelRoutes } from './duels.ts';
import { eventRoutes } from './events.ts';
import { fraudRoutes } from './fraud.ts';
import { inviteRoutes } from './invites.ts';
import { kpiRoutes } from './kpi.ts';
import { leaderboardRoutes } from './leaderboards.ts';
import { phoneRoutes } from './phone.ts';
import { pointsRoutes } from './points.ts';
import { privacyRoutes } from './privacy.ts';
import { redemptionRoutes } from './redemptions.ts';
import { referralRoutes } from './referral.ts';
import { reminderRoutes } from './reminders.ts';
import type { HttpMethod, RouteDef } from './route.ts';
import { sessionRoutes } from './sessions.ts';
import { squadRoutes } from './squads.ts';
import { supportRoutes } from './support.ts';
import { surveyRoutes } from './surveys.ts';
import { waitlistRoutes } from './waitlist.ts';

export const routes = {
  ...waitlistRoutes,
  ...authRoutes,
  ...pointsRoutes,
  ...phoneRoutes,
  ...surveyRoutes,
  ...privacyRoutes,
  ...reminderRoutes,
  ...sessionRoutes,
  ...catalogRoutes,
  ...redemptionRoutes,
  ...inviteRoutes,
  ...squadRoutes,
  ...duelRoutes,
  ...clubRoutes,
  ...leaderboardRoutes,
  ...challengeRoutes,
  ...belofteRoutes,
  ...cardRoutes,
  ...referralRoutes,
  ...eventRoutes,
  ...fraudRoutes,
  ...kpiRoutes,
  ...supportRoutes,
  ...adminRoutes,
  ...calendarRoutes,
  ...drawRoutes,
} as const;

export type Routes = typeof routes;
export type RouteId = keyof Routes;
export const ROUTE_IDS = Object.keys(routes) as RouteId[];

export function getRoute(id: RouteId): RouteDef {
  return routes[id];
}

/** Substitutes :params into a route path, URL-encoding each value. */
export function buildPath(path: string, params: Readonly<Record<string, string | number>> = {}): string {
  return path.replace(/:([a-z_]+)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path parameter ${name} for ${path}`);
    return encodeURIComponent(String(value));
  });
}

function pathPattern(path: string): RegExp {
  return new RegExp(`^${path.replace(/:([a-z_]+)/g, '(?<$1>[^/]+)')}$`);
}

/** Finds the route for a method and concrete path; literal segments win over parameters. */
export function matchRoute(method: HttpMethod, path: string): { id: RouteId; params: Record<string, string> } | undefined {
  const candidates = ROUTE_IDS.filter((id) => routes[id].method === method)
    .map((id) => ({ id, m: pathPattern(routes[id].path).exec(path) }))
    .filter((c): c is { id: RouteId; m: RegExpExecArray } => c.m !== null)
    .sort((a, b) => (routes[a.id].path.match(/:/g)?.length ?? 0) - (routes[b.id].path.match(/:/g)?.length ?? 0));
  const best = candidates[0];
  if (!best) return undefined;
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(best.m.groups ?? {})) params[k] = decodeURIComponent(v);
  return { id: best.id, params };
}
