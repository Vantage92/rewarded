# Offline-bootstrap

Eenmalig, met netwerk: `pnpm bootstrap`. Dat vult de pnpm-store vanuit de lockfile (`pnpm fetch`). Daarna werkt `pnpm install --offline` op een schone checkout, en draaien `pnpm build`, `pnpm test`, `pnpm verify` en `pnpm e2e` zonder netwerk.

- **SQLite-driver.** `better-sqlite3` haalt bij de installatie een prebuild op of bouwt met `node-gyp`. Lukt dat niet, dan valt de adapter in `apps/api/src/db/open.ts` vanzelf terug op `node:sqlite` (`DatabaseSync`), ingebouwd in Node 22.23.4. Het buildscript mag draaien omdat `better-sqlite3` in `pnpm.onlyBuiltDependencies` staat.
- **Playwright-browsers.** De e2e-tests gebruiken de browsers in `PLAYWRIGHT_BROWSERS_PATH` (in de bouwcontainer `/opt/pw-browsers`, Chromium revisie 1243 bij Playwright 1.63.0). Voer in die container nooit `playwright install` uit. Op een eigen machine met netwerk: `PLAYWRIGHT_BROWSERS_PATH=./.cache/ms-playwright pnpm exec playwright install chromium webkit`.
- **Zonder netwerk op een nieuwe machine.** Neem van een collega de pnpm-store (`pnpm store path`) en de browsermap over als archief, zet `PLAYWRIGHT_BROWSERS_PATH`, en draai `pnpm install --offline`.

Prebuilds per Node-versie in `tooling/bootstrap/prebuilds/` (architectuur §2.1) zijn nog niet nodig: in de bouwomgeving lukt de installatie van `better-sqlite3` direct. WP-11 voegt ze toe als een machine zonder compiler ze nodig heeft.
