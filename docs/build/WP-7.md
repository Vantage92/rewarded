# WP-7 Web-shell — bouwrapport

*5 november 2026. Eigenaar: WP-7. Bron: UX-ontwerp §2, §3.1, §5; architectuur §2, §9, §11, §12.*

## Wat af is

- **Layout** (`apps/web/src/app/Layout.tsx`, `nav.ts`, `icons.tsx`): vijf tabs Focus, Squad, Vereniging, Beloningen, Ik (UX §2.1) als onderste tabbalk van 64 px en vanaf 960 px als zijbalk van 232 px met een inhoudskolom van maximaal 720 px (UX §2.2). Het actieve item heeft `aria-current="page"`, een gevuld icoon en een balkje van 3 px. Er is een skiplink, een offline-strook met de copy uit UX §6.2 en een stip op een tab met tekstalternatief. In de modus zonder punten verdwijnt Beloningen (UX §2.1). De chrome-modi zijn `full`, `immersive` (sessie: geen kop, tabs of toasts) en `bare` (publieke pagina's). Features kiezen die via `handle: { chrome }` of `useImmersive(true)`.
- **Router**: de glob-lader uit WP-0, aangevuld met placeholders voor routes uit §9.1 die nog geen feature hebben (`/welkom`, `/i/:token`, `/c/:code`, `/login`, `/auth/*`, `/hoe-we-tellen`, `/vragen/:moment`, `/hulp`, `/afmelden`, `/v/:token`). Placeholders en de home-route staan ná de featureroutes, dus een feature met hetzelfde pad (of `index: true`) wint. Een test bewijst dat.
- **Providers** (`app/providers.tsx`, `App.tsx`): TanStack Query, getypeerde API-client, i18n, thema en shellstatus. `AppProviders` is ook bruikbaar in tests van andere pakketten.
- **Thema** (`design/theme.tsx`, `public/theme-init.js`): systeem (standaard), licht of donker. Een handmatige keuze zet `<html data-theme>` en wordt bewaard. Een extern script past de keuze toe vóór de eerste paint, zonder inline script, vanwege de CSP (§10.3).
- **Tokens** (`design/tokens.json`): kleuren uit UX §5.2 en de typeschaal uit §5.3 in rem (als `font.size-*`, `font.line-*` en `font.weight-*`, zodat het buildscript van WP-0 ze zonder wijziging meeneemt). De contrastparen uit §5.2 staan in `$contrast`. Layout- en bewegingsconstanten (§2.2, §5.7) staan als custom properties in `base.css`.
- **Basiscomponenten** (`design/components/*`, `design/components.css`, barrel `design/index.ts`): Button/ButtonLink, Card, List/ListItem/Avatar, ProgressRing/ProgressBar, TimerDisplay, Toast, Modal, BottomSheet en FormField/TextField. Daarnaast Segment, Switch, Chip, Banner, ThemeSwitch/LanguageSwitch en `useFocusTrap`, allemaal volgens UX §5.5 en §5.8.
- **i18n** (`i18n/index.tsx`): dezelfde `useT()`, met een ICU-subset (plural, select, `=n`), Intl-getallen, tijden in Europe/Amsterdam, `errors.<module>.<code>` → namespace `errors/<module>` met een generieke terugval, en `<html lang>` volgt de taal. Lintregels (`i18n/lint.ts`): `no-hardcoded-text` (JSX-tekst en attributen zoals aria-label, title, alt en placeholder, via de oxc-parser van Vite), `forbidden-words` ("bewezen", "verdien geld", "winnen" buiten draws, plus Engelse tegenhangers) en `missing-key` (NL/EN-pariteit). CLI: `pnpm -F @rewarded/web lint:i18n` over heel `src`.
- **API-client** (`lib/api`): `createWebApi()` levert de contracts-client met fetch en `rw_csrf` → `X-CSRF-Token`, of in mock-modus de contracts-mock (lui geladen, buiten de productiebundel). De mock-modus gaat aan met `VITE_API_MODE=mock`, of in dev met `?api=mock`. Features leveren mock-handlers in `features/<naam>/mock.ts` (`export const handlers: MockHandlers`), die per glob worden geladen. Verder: `ApiProvider`, `useApi`, `useApiQuery`, `useApiMutation`, `apiKey` en `errorText`. De oude `createApiClient` blijft bestaan (deprecated).
- **PWA**: het manifest heeft nu ook `id`, `description` en `categories`, met kleuren uit de tokens. De service worker precachet de app-shell, valt bij navigaties terug op index.html (en in het uiterste geval op `offline.html`), raakt `/api/*` nooit aan, neemt bij de eerste installatie direct de pagina over en activeert een update alleen op `SKIP_WAITING`. `app/sw-register.ts` regelt veilige updates met `canActivate()`.

## Verificatie

- `pnpm -F @rewarded/web typecheck`: geslaagd (app en service worker).
- `pnpm -F @rewarded/web test`: 8 bestanden, 149 tests geslaagd. Daarin zitten de contrasttest op alle paren in licht en donker, de manifesttest, de componenttests, axe zonder ernstige of kritieke fouten op de shellroutes (jsdom, zonder kleurcontrast), i18n en lint, en de API-client.
- `pnpm -F @rewarded/web test:pwa`: 10 Playwright-tests in Chromium geslaagd. Ze dekken het manifest, een actieve service worker die de pagina beheert, een offline herlaadbeurt met diepe links, geen `/api` uit de cache, axe mét kleurcontrast in licht/donker en op telefoon/laptop, de tabbalk en de zijbalk met maten, en het thema vóór de eerste paint.
- `pnpm -F @rewarded/web build` geslaagd; `npx oxlint --deny-warnings apps/web` geeft 0 meldingen; `lint:i18n` geeft 0 meldingen; de e2e van WP-0 (`e2e/shell.spec.ts`) blijft groen.

## Tegenspraak in de documenten

1. Architectuur §9.6 noemt i18next/react-i18next. WP-0 leverde een eigen helper "achter dezelfde useT()". Die heb ik gehouden en uitgebreid met ICU-plural en -select, zonder nieuwe afhankelijkheid.
2. Architectuur §9.6 vraagt aanraakdoelen van 44 px, UX §5.5/§5.8 vraagt 48 px. Ik gebruik 48 px, wat aan beide voldoet.
3. Architectuur §9.7 noemt semantische namen (`color.accent`, `color.success`, `space.1–8`), UX §5.2/§5.4 andere (`primary`, `pause-text`, zeven stappen). Ik volg UX, zoals WP-0 ook deed, omdat het productplan één tokenset uit het UX-ontwerp vastlegt.
4. UX §5.2 zegt dat de kans-kleur vervalt met de trekkingen, maar de tabel noemt hem nog. De tokens blijven staan en zijn in `tokens.json` als `$deprecated` gemarkeerd.
5. Architectuur §9.1 noemt `/` "Vandaag", UX §2.1 noemt tab 1 "Focus" met F1 Home. De tab Focus wijst naar `/` en is ook actief op `/focus/*`; de home-placeholder heet "Vandaag".
6. Het UX-snippet gebruikt `aria-label="Hoofdnavigatie"`, WP-0 gebruikt "Hoofdmenu" (en de e2e van WP-0 controleert dat). Ik heb "Hoofdmenu" gehouden.
7. Architectuur §2 noemt de feature `survey`, maar die heeft geen stub. `/vragen/:moment` heeft daarom een shell-placeholder.
8. De eigenaar van de home-route (`/`) staat niet eenduidig vast: WP-0 schreef WP-9, maar F1 hoort bij de focusweergave van WP-8. De placeholder noemt WP-8, en elke feature kan de index-route overnemen.

## Interface-notities

- Ik heb niets gewijzigd in `packages/core`, `packages/contracts` of `apps/api/src/services`. Ik gebruik de subpaden `@rewarded/contracts/client` en `@rewarded/contracts/mock` (toegestaan via `exports: "./*"`), zodat de mock en de voorbeelden buiten de studentenbundel blijven.
- `apps/web/package.json`: scripts `test`, `test:pwa` en `lint:i18n` toegevoegd (`pnpm -F @rewarded/web test` bestond nog niet), plus `@tanstack/react-query@5.104.5` en dev-dependency `axe-core@4.14.0` via `pnpm add --filter`. Daardoor is `pnpm-lock.yaml` ook gewijzigd.
- `apps/web/test/shell.test.tsx` (WP-0) aangepast: de tablabels volgen nu UX §2.1, en `featureNames` gebruikt `arrayContaining`, zodat WP-9 `survey` kan toevoegen zonder deze test te breken.
- Nieuwe registratiepunten voor features, zonder een gedeeld bestand te bewerken: `handle: { chrome: 'bare' | 'immersive' }` in routes, `useImmersive()`, `useShell().setNoPointsMode()` en `setDot()`, en `features/<naam>/mock.ts`.

## Niet gedaan

- `src/main.tsx` (WP-0) registreert de service worker nog zonder `sw-register.ts`. Het koppelen van `canActivate()` aan de sessiestore hoort bij WP-8 of de orchestrator.
- De i18n-lint draait niet in de root (`pnpm lint`/`verify`), omdat ik de root package.json niet mag wijzigen. `test:pwa` zit ook niet in `pnpm test`.
- Een WebKit-project voor de PWA-test (WP-11, browser niet in de cache).

## Bekende problemen

- De hoofdbundel is 516 kB (155 kB gzip), boven de waarschuwingsgrens van 500 kB. Dat komt door de zod-schema's van alle contracts, React, de router en Query. Splitsen (bijvoorbeeld per vendor) is een vervolgstap.
- De axe-test in jsdom slaat kleurcontrast over. Dat contrast controleren de tokentest en de Chromium-test.
- Een toast tijdens een sessie wordt weggegooid, niet bewaard tot later (UX §5.5: "nooit tijdens een sessie").
- In mock-modus laden de feature-mocks asynchroon. Elke call wacht daarop via `ready`.
