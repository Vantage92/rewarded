# Rewarded

Focus-app die je beloont voor bewezen focus. Web-MVP als Progressive Web App.

- `docs/00-founder-brief.md` — vertrekpunt en hypotheses
- `docs/research/` — onderzoek van het strategieteam (architectuur: `docs/research/07-architectuur.md`)
- `docs/01-businessplan.md` — besluiten van de founder over markt, model en groei
- `docs/02-productplan.md` — productspecificatie, UX en architectuur
- `docs/pitch/` — pitch en kritische beoordelingsrondes

## Status

**Integratiegolf afgerond (6 november 2026).** De werkpakketten WP-0 tot en met WP-11 zijn samengevoegd tot één werkend geheel; het bouwrapport staat in `docs/build/INTEGRATIE.md`, de rapporten per pakket in `docs/build/WP-*.md`.

Wat werkt, end-to-end in de browser tegen de echte API (`e2e/chain/kernflow.spec.ts`): uitnodiging via squadlink, inloggen met de code uit de dev-inbox, onboarding, een sessie van 25 minuten op de dev-klok, punten met doelbonus, squad, verenigingsranglijst, catalogus en een beheerder die een markering vrijgeeft na TOTP.

Na pitchronde 3 doorgevoerd:

- **Tentamenkalender per vereniging** (`packages/core/src/calendar`, tabel `exam_calendar` met `is_default` en `a_resit_days`, beheerroutes `/admin/exam-calendars`, scherm `/beheer/tentamenkalenders`). Sessies en punten (seizoen, doelbonus, arm B-budget, pool), squads (tentamenperiodes), challenges, Belofte, referral, cohort bij registratie, bewakingsregel en KPI's lezen de kalender van de eenheid. De vaste data in `params` voeden alleen nog de standaardkalender. Zonder vereniging geldt de standaardkalender (migratie 0211).
- **Instellingsanker** als HMAC met de eigen `pepper_inst`; alleen HMAC en domein worden bewaard.
- **H12** meet overlap over de hele sessieduur.
- **Rustperiode per persoon** vanaf T − 6 (`user.rest_arm_fixed`); het uitbreidingscohort in een rustsquad verdient persoonlijk door; een overstap naar een doorlopende squad telt als uitstap (`rest_period_exit`, bron `squad_switch`); `POST /me/rest-exit`.
- **Seed** met twee verenigingskalenders met een verschillende T plus de standaardkalender.

Wat nog ontbreekt, staat in `docs/build/INTEGRATIE.md` onder "Niet gedaan".

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

```sh
pnpm seed:demo        # demo in .data/rewarded.sqlite (stop eerst pnpm dev); klok daarna op 16 december
```

Met `pnpm dev` draaiend: `POST /api/v1/dev/reset {"seed":"demo"}` laadt de demo in de draaiende server, `POST /api/v1/dev/clock {"set": "..."}` zet de klok en `GET /api/v1/dev/inbox` toont mails en sms'en (codes om in te loggen). De beheerders en hun TOTP-geheimen staan in de uitvoer van de seed. `?api=mock` in de URL (alleen dev) draait de web-app op de mocks, `?api=http` schakelt terug.

## Testen

```sh
pnpm test             # Vitest over core, contracts, api, web en tooling
pnpm e2e              # Playwright (Chromium); start zelf web en per worker een API-proces
pnpm verify           # typecheck + lint + test
pnpm -F @rewarded/web lint:i18n   # i18n-lint (NL/EN-pariteit, verboden woorden)
pnpm -F @rewarded/web test:pwa    # PWA: service worker, offline-shell, axe
```

Integratietests: `apps/api/test/integratie/`, `packages/core/test/integratie-*.test.ts`, `tooling/test/integratie-ronde3.test.ts`, `apps/web/test/integratie.test.tsx`, en de e2e-specs `e2e/chain/kernflow.spec.ts` en `e2e/chain/focus-real.spec.ts`.

De integratietests van de API draaien tegen beide SQLite-drivers (`better-sqlite3` en `node:sqlite`). Een test bouwt de productiebundel, controleert dat de dev-module, de dev-klok en de dev-inbox er niet in zitten, start de bundel en controleert dat `/dev/*` 404 geeft.

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
