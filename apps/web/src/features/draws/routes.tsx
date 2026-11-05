// Draws are not built (product plan §0c.3 and §4; spec §3.9 "geen flow, scherm, route of job";
// UX §4.7; architecture §7). The feature folder stays as the empty place next to the `draws` flag,
// which can never be enabled. No route: /kans is an unknown page for everyone, so nothing about
// draws reaches the DOM, for 16_17 or anyone else (UX principle P10). Owner: WP-9.
import type { RouteObject } from 'react-router';

export const routes: RouteObject[] = [];
