# Rewarded

Focus-app die je beloont voor bewezen focus. Web-MVP als Progressive Web App.

- `docs/00-founder-brief.md` — vertrekpunt en hypotheses
- `docs/research/` — onderzoek van het strategieteam (architectuur: `docs/research/07-architectuur.md`)
- `docs/01-businessplan.md` — besluiten van de founder over markt, model en groei
- `docs/02-productplan.md` — productspecificatie, UX en architectuur
- `docs/pitch/` — pitch en kritische beoordelingsrondes

## Status

Dit is het **fundament (WP-0)**: repo-structuur, buildketen, tests, lint en lege stubs. Er is nog geen productlogica, geen scherm en geen domeinregel. Elke API-module en elke web-feature bestaat als stub die alleen een health-route of een placeholderscherm geeft, met de eigenaar erbij.

Volgende werkpakketten (architectuur §12.1):

| WP | Naam | Vult |
|---|---|---|
| WP-1 | Core-regie | `packages/core/src/{params,time}` |
| WP-2 | Contracts | `packages/contracts/**` (bevroren op dag 2, tag `contracts-v1`) |
| WP-3 | API-basis | `apps/api/src/{db,platform,middleware}`, scheduler, `modules/{auth,waitlist,dev,events}`, migraties `0001–0079` |
| WP-4 | Sessies en punten | `core/{session,ledger,goals,catalog}`, `modules/{sessions,points,catalog,redemptions,phone}`, migraties `0100–0199` |
| WP-5 | Sociaal | `core/{squads,challenges,belofte,referral,privacy}`, tien sociale modules, migraties `0200–0299` |
| WP-6 | Fraude, beheer, trekkingen, privacy | `core/{fraud,draws}`, `modules/{fraud,admin,draws,privacy,kpi,support}`, migraties `0080–0099` en `0300–0399` |
| WP-7 | Web-shell | `apps/web/src/{app,design,lib/api,sw}`, `i18n/*/common.json`, `public/` |
| WP-8 | Web focus-engine en toegang | `platform/`, `features/{focus,onboarding,waitlist}` |
| WP-9 | Web features | `features/{points,squads,duels,club,challenges,belofte,cards,draws,profile}` |
| WP-10 | Web bestuur en beheer | `features/{board,admin}` |
| WP-11 | Seed en e2e | `tooling/seed/**`, `e2e/**` |

## Vereisten

- Node **22.23.4** (zie `.nvmrc`; `node:sqlite` en het strippen van TypeScript-typen werken daarin zonder vlag)
- pnpm **10.28** (`corepack enable` of een globale installatie)
- Voor e2e: Chromium in `PLAYWRIGHT_BROWSERS_PATH` (zie `tooling/bootstrap/README.md`)

## Installeren

```sh
pnpm install          # bouwt better-sqlite3 en genereert modules.gen.ts en tokens.css
pnpm secrets:init     # optioneel: lokale peppers in ~/.config/rewarded/secrets (buiten de repo)
cp .env.example .env  # optioneel: lokale instellingen, zonder secrets
```

Zonder netwerk na een eenmalige bootstrap: `pnpm bootstrap` en daarna `pnpm install --offline` (zie `tooling/bootstrap/README.md`).

## Draaien

```sh
pnpm dev              # API op http://localhost:8787/api/v1 en web op http://localhost:5173 (proxy /api → 8787)
pnpm db:migrate       # past migraties uit apps/api/migrations toe op .data/rewarded.sqlite
pnpm build            # productiebundel API (zonder dev-module) en web-app met service worker
pnpm --filter @rewarded/api start   # draait de productiebundel; vraagt peppers (pnpm secrets:init)
```

`pnpm seed:demo` bestaat nog niet en meldt dat; de demo-seed komt in WP-11.

## Testen

```sh
pnpm test             # Vitest over core, contracts, api, web en tooling
pnpm e2e              # Playwright (Chromium); start zelf api en web via webServer
pnpm verify           # typecheck + lint + test
```

De integratietests van de API draaien tegen beide SQLite-drivers (`better-sqlite3` en `node:sqlite`). Een test bouwt de productiebundel en controleert dat de dev-module, de dev-klok en de dev-inbox er niet in zitten.

## Structuur

```
packages/core/          puur domein: geen I/O, geen Date.now(), geen DOM of Node (lint + tsconfig bewaken dat)
packages/contracts/     zod-schema's per module, foutcodes, eventtaxonomie
apps/api/
  migrations/           platte SQL, nummerreeksen per werkpakket (zie README daar)
  src/app.ts            Hono-app; registreert de modules uit modules.gen.ts
  src/modules/<naam>/   één map per module, met export `module`; gen-modules.ts maakt de lijst
  src/db/               Db-interface, driver-adapter (better-sqlite3, terugval node:sqlite), migratierunner
  src/platform/         Clock, Random, Mailer, SmsSender, Hasher; productie (system.ts) en dev (dev.ts)
  src/services/         bevroren interfaces tussen modules (vanaf dag 2)
  src/middleware/       auth, csrf, rate limit, idempotentie (doorlaatstubs) en foutafhandeling
  src/jobs/scheduler.ts scheduler-stub
  src/server.dev.ts     dev- en e2e-entry (met modules/dev)
  src/server.prod.ts    productie-entry (zonder modules/dev)
apps/web/
  public/               manifest.webmanifest en iconen
  src/app/              shell, providers en routes.tsx (laadt features/*/routes.tsx via import.meta.glob)
  src/design/           tokens.json (UX §5.2–5.4) → tokens.css en tokens.gen.ts via scripts/build-tokens.ts
  src/i18n/             <taal>/<namespace>.json en een kleine i18n-helper (useT)
  src/lib/api/          getypeerde API-client
  src/sw/               service worker (vite-plugin-pwa, injectManifest)
  src/features/<naam>/  één map per feature met routes.tsx
e2e/                    Playwright-config en specs
tooling/
  bootstrap/            offline-bootstrap
  scripts/              gen-modules.ts, peppers.ts
  seed/                 demo-seed (WP-11)
```

Een module of feature toevoegen: maak een map met `index.ts` (API) of `routes.tsx` (web). `app.ts` en `routes.tsx` hoeven niet te veranderen.
