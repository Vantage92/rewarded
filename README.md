# Rewarded

Focus-app voor studenten: samen focussen in een squad, met punten voor focustijd die we zichtbaar op je scherm zagen. Web-MVP als Progressive Web App.

- `docs/00-founder-brief.md` — vertrekpunt en hypotheses
- `docs/research/` — onderzoek van het strategieteam (architectuur: `docs/research/07-architectuur.md`)
- `docs/01-businessplan.md` — besluiten van de founder over markt, model en groei
- `docs/02-productplan.md` — productspecificatie, UX en architectuur
- `docs/pitch/` — pitch en kritische beoordelingsrondes

## Status

**Eind-QA afgerond (5 november 2026): de web-MVP draait end-to-end op de demo-seed.** Het rapport staat in `docs/build/QA.md`, met de screenshots in `docs/build/screenshots/`.

Verificatie op een schone stand:

- `pnpm install`, `pnpm build` en `pnpm seed:demo` geven exit 0;
- `pnpm verify` geeft exit 0, met 86 bestanden en 1171 tests;
- `pnpm e2e` geeft exit 0, met 60 geslaagd, 11 `fixme` en 0 gefaald.

De kernflow werkt in de echte app tegen de echte API:

- uitnodiging, inloggen met de code uit de dev-inbox, onboarding met geboortedatum, en de oefensessie;
- 25 minuten met de dev-klok, en het eindscherm met punten;
- een afgebroken sessie met reden en 0 punten;
- squad, verenigingsranglijst, catalogus en profiel;
- bestuursdashboard en een beheerder die een markering vrijgeeft na TOTP.

De harde randvoorwaarden zijn in de werkende app gecontroleerd: geen punten tijdens de sessie, geen eurowaarde bij punten, geen trekkingen (niet gebouwd), bestuur ziet alleen aggregaten, en "bewezen" komt niet voor. In de QA is één blocker opgelost: de eerste login vanuit een verse browser mislukte op CSRF (`apps/web/src/lib/api/web.ts`).

### Wat nog ontbreekt (eerlijk)

- **Vragenlijsten** (`/surveys/*`) zijn niet gebouwd. Daardoor ontbreekt de pilotmeting (instroom, reflectie en welzijn) en criterium 1 van de stopregel. Dit is het belangrijkste open punt voor de pilot.
- **Schermen voor de rustperiode** (bericht op T − 6 en op A-start, "Ik wil weer punten verdienen", `rest_notice`). De API is er; 4 e2e-scenario's staan op `fixme`.
- **Bestuur kan het eigen dashboard niet vanuit de app openen**: alleen via de link uit de mail (QA, major).
- **Niet op echte toestellen getest**: Safari/WebKit, de echte Wake Lock, schermvergrendeling, app-wissels en de PWA-installatie (`e2e/MANUAL.md`). De suite draait alleen in Chromium.
- **Productie-infrastructuur**: er is geen productiemailer en geen sms-provider, de hogere fraudedrempels (H2/H7/H10/H12) en `net_classes` volgen pas na de red-teamdag, en er is geen terugboekroute.
- **A/A-controle met kalenders**, de kalender per faculteit, herkansingsdagen in KPI (d) en H3, en het wisselen van kalender bij een overstap.
- **Web-UI voor een deel van de beheerroutes** (herbevestiging van het anker, "Ik heb een belang", uitbetaling aan ambassadeurs). De API is er.
- **Kleinere UX-punten uit de QA**:
  - de kop van de deelnamegraad volgt de lopende week;
  - een dubbele zin op het afbreekscherm;
  - `/punten/catalogus` en `/vereniging/ranglijst` hebben geen eigen scherm;
  - de lange akkoordtekst.
- **Bekende operationele punten**:
  - `job_run` groeit met ongeveer 1500 rijen per dag zonder opruiming;
  - de rate limit op MFA telt ook geslaagde pogingen;
  - zet in dev eerst de klok op de demotijd, anders weigert de TOTP-replaybescherming de beheercodes.

Volledige lijsten: `docs/build/QA.md`, `docs/build/REPARATIE.md` ("Niet gedaan") en `docs/build/INTEGRATIE.md` ("Niet gedaan").

### Eerdere golven

**Reparatiegolf na de onafhankelijke review afgerond (6 november 2026).** Alle 10 blockers en alle majors uit `docs/build/REVIEW-*.md` zijn opgelost, met tests; het rapport staat in `docs/build/REPARATIE.md` (wat niet is gedaan staat daar onder "Niet gedaan"). De belangrijkste wijzigingen: arm per focusdag (aansluiten werkt vanaf de volgende maandag, ook bij herbeoordeling), beroep na een blokkade met een beperkte sessie, Meldingen en beroep in Ik, herinneringen opt-in met eigen tijd en dagen en uitschrijven met één klik, de QR-link `/c/:code`, de Bonusregel op F1 en F5, een rate limit op TOTP, de echte client-IP achter de proxy, en geen 18+-prijzen of eurobedragen voor minderjarigen. Migratiereeks `0400–0499` hoort bij de reparatie. De productie-API start alleen met `TRUST_PROXY` (0 of 1) en een `APP_ORIGIN` met `https://`.

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
