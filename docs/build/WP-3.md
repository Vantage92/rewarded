# WP-3 — API-basis

*Bouwrapport, 5 november 2026. Bouwer WP-3. Niet gecommit; dat doet de orchestrator. Deze ronde is een vervolg op de tussenstand in commit `bdaf7fe`: de failing tests zijn opgelost, de TOTP-sleutel is aangesloten, het slot op de toewijzing staat er en de ontbrekende tests zijn toegevoegd.*

## Wat af is

- **Db en migraties** (`apps/api/src/db/`): de `Db`-interface met adapter voor `better-sqlite3`, met terugval op `node:sqlite`. Geneste transacties worden savepoints. `isConstraintError` werkt voor beide drivers. De migratierunner draait elke migratie in een eigen transactie, met checksum, en weigert bestanden buiten de nummerreeksen van §12.3 en toegepaste versies die niet meer op schijf staan. Daarnaast: ULID's en tokens uit `Clock`/`Random` (`ids.ts`), feature flags (`flags.ts`; `draws` kan nooit aan) en de tweede factor voor beheerders (`adminMfa.ts`).
- **Migraties 0001–0006**: alle WP-3-tabellen uit §12.3. Het auditlog weigert UPDATE en DELETE met triggers (0002). Nieuw is **0006**: de armbepalende kolommen van `experiment_assignment` en `arm_switch` zijn vergrendeld. Alleen het unit- of gebruikers-id mag nog wijzigen, voor de privacy-eraser.
- **Platform**: `SystemClock` (zonder setter), `CryptoRandom`, `HmacHasher` met vier peppers, `loadSecrets` (peppers, TOTP-sleutel, experimentseed), `stdoutLogger` met allowlist, TOTP volgens RFC 6238 met AES-256-GCM-versleutelde geheimen, normalisatie van e-mailadressen, UA-klasse en netklasse (CIDR, langste prefix). Voor dev: `DevClock`, `DevInbox`, `DevMailer`, `DevSmsSender` met nummertypetabel en `SeededRandom`.
- **Middleware** (`apps/api/src/middleware/`), op volgorde:
  1. requestcontext: IP alleen in het geheugen, daarna hash en netklasse;
  2. toegangslog: alleen het routepatroon, onbekende paden als `/unmatched`;
  3. securityheaders van §10.3;
  4. sessie: `rw_sid`, alleen de SHA-256 opgeslagen, 30 dagen glijdend, beheer 12 uur absoluut;
  5. CSRF: double submit, Origin-controle en een body-token voor het beacon-pad.

  Verder per route: `mount()` (autorisatie, rate limit, strikte zod-validatie, `Idempotency-Key`, responsecontrole tegen het contract), een token-bucket met de limieten van §10.2 en een foutafhandeling met alleen contractcodes. Zod-fouten geven veldpaden zonder waarden; overige fouten worden `INTERNAL`, en de stacktrace gaat zonder bericht naar de log.
- **Auth** (`modules/auth`):
  - een magic link met het token in het URL-fragment, bevestigd met een POST, en een code van zes cijfers als terugval; link en code zijn samen eenmalig;
  - het antwoord is altijd 202;
  - gesloten pilot: zonder uitnodiging krijgt een nieuw adres een wachtlijstmail;
  - een pre-sessie met `pre_pseudonym`;
  - onboarding met leeftijdsklasse en `turns_18_on`: onder 16 worden de pre-sessie, de magic-linkrijen en `event_pending` verwijderd; 16_17 krijgt standaard de stille modus en persoonlijk A/continue als `arm_switch minor`;
  - de toewijzing (squad of solo, stratum club|kanaal) en de events `experiment_assigned`, `account_created` en `daily_goal_set` in dezelfde transactie;
  - `/me`, de instellingen, afmelden voor het onderzoek (vanaf de volgende focusdag) en uitloggen (alle sessies);
  - `auth_daily_stat`.
- **Wachtlijst**: altijd 202, ontdubbeld op het genormaliseerde adres, een groepslink, uitschrijven met een HMAC-token (verwijdert direct), een overzicht per prioriteitsklasse en een batch-uitnodiging (groepen eerst, nooit gesplitst, één invite met `max_uses` = groepsgrootte, auditregel, dry-run).
- **Events**: `POST /events` (alleen client-events, `UNKNOWN_EVENT`; pre-gebruikers in `event_pending`) en `POST /me/plus-interest` achter de vlag.
- **Dev** (`modules/dev`, alleen in `server.dev.ts`): inbox, klok, job draaien, reset (de triggers blijven staan, met een haak voor `seedDemo` van WP-11) en de A/A-controle.
- **Services**: `SqlAuditWriter` (actor `admin:<HMAC>`), `SqlEventWriter` (in `tx`, alleen de taxonomie; armen, kanaal, cohort en release per event) en `SqlExperimentService`. Die laatste randomiseert per factor in blokken van 4 per stratum met een HMAC uit de seed, vergrendelt de toewijzing, logt `arm_switch` met ingangsdatum (join/merge volgende maandag, opt-out volgende focusdag) en stopt arm B met vier ogen.
- **Jobs**: een scheduler met `job_run` (idempotent per `run_key`, herstart vanaf de stap die faalde), tikt elke 30 s, en de jobs worden per map geladen. De dagafsluitingsorchestrator gebruikt een manifest uit `jobs/day_close/<nn>-<naam>.ts` met een eigenaarscontrole per stapnummer. Stap 3 zet de leeftijdsklasse om. Stap 9 vult de inlogstatistiek aan en ruimt magic links, `event_pending` en verlopen sessies op.
- **i18n**: `errors/common.json`, `errors/auth.json` en `errors/events.json` in NL en EN. Een test controleert dat elke code van deze modules een tekst heeft en dat er geen sleutels te veel zijn.

## Verificatie

- `pnpm -F @rewarded/api typecheck`: geslaagd.
- `pnpm -F @rewarded/api test`: 18 bestanden, 217 tests geslaagd. Daarvan 108 in `test/wp3/`, steeds op beide drivers. Ze dekken:
  - de inlogflow met het scannerscenario, code en link in twee contexten, pogingen en verloop;
  - onder 16 waarbij niets overblijft;
  - CSRF-weigering;
  - een auditlog dat UPDATE en DELETE weigert;
  - jobs die idempotent zijn per `run_key` en per stap herstartbaar;
  - de logtest van §10.9;
  - TOTP tegen de RFC-vectoren, plus inschrijven, verifiëren en herhaling;
  - de dev-routes;
  - de productiebundel zonder dev-strings.
- `pnpm test` (hele repo): 39 bestanden, 702 tests geslaagd. `pnpm typecheck`: geslaagd.
- `npx oxlint --deny-warnings apps/api`: 0 meldingen in WP-3-bestanden (2 in `test/wp4/`, van WP-4).
- Handmatig: de productiebundel gebouwd en gestart met tijdelijke peppers. Hij migreert, `/health` geeft 200 en `/api/v1/dev/inbox` geeft 404.

## Tegenspraak in de documenten

1. Volgens architectuur §10.9 hoort de logger in `platform/logger.ts`. WP-2 zette hem in `platform/log.ts`; die is aangehouden.
2. De UA-klassen van architectuur §10.4 wijken af van de enum in contracts (keuze van WP-2). Contracts gaat voor.
3. Spec §4.10 zegt dat de leeftijdsklasse "op die dag" wisselt. Stap 3 draait om 05:45 op D + 1, dus de wissel valt op de verjaardag om 05:45 en niet om 00:00.
4. Architectuur §10.9 noemt `tooling/scripts/secrets.ts`; WP-0 leverde `peppers.ts`. `totp_key` en `experiment_seed` worden daarom optioneel uit `peppers.json` gelezen. Zonder TOTP-sleutel wordt er een afgeleid van `pepper_audit`; zonder seed is de toewijzing `provisional`.
5. Spec §3.1 zegt dat er onder 16 "niets opgeslagen" wordt. De tellers in `auth_daily_stat` (zonder persoonsgegevens) blijven wel staan.

## Interface-notities

- `platform/types.ts`: optioneel `Platform.totpKey` (achterwaarts compatibel). Beide servers zetten hem. `mfaDepsOf(platform)` weigert te werken zonder sleutel.
- Kleine bedrading in `server.dev.ts` en `server.prod.ts` (TOTP-sleutel; de SQL-services van WP-3 via `createSqlServices`), hoewel die bestanden niet expliciet in mijn eigendom staan.
- `apps/api/package.json`: script `test` toegevoegd, anders deed `pnpm -F @rewarded/api test` niets.
- `test/app.test.ts` (WP-0): de healthtest accepteert nu `stub` of `ok` en slaat modules over waarvan een route de health-route overschaduwt. Met strikt `stub` zou de test breken zodra een module af is.
- Voor andere pakketten:
  - `mount()` en `reply()`;
  - `ModuleDeps.http` (`HttpConfig`) en `RequestVars` met `auth`, `netClass`, `ipHash`, `uaClass`, `limiter`, `db` en `clock`;
  - `csrfValueMatches` en `BODY_TOKEN_PATHS` voor de beacon;
  - `requireFeature`;
  - `DayCloseStep` (`no`, `name`, `owner`, `run`);
  - `enrollMfa` en `verifyMfa` voor de MFA-routes van WP-6;
  - `auditRef` en `adminActor`;
  - `setFeatureFlag` (vier ogen en de auditregel bij de aanroeper).
- `ExperimentService.get` en `assign` geven nu het opgeslagen stratum terug, niet dat van de aanroeper.
- `core/experiments` bestaat nog niet (WP-1). De toewijzingsregel staat daarom in `db/services/experiments.ts`.

## Niet gedaan

- De MFA-routes `/admin/mfa/*` (eigendom van WP-6). De functies en tests zijn er.
- De bewaartermijnjob (§10.6). De dev-route kent de naam `retention`, maar er is nog geen jobbestand.
- Een geautomatiseerde test die de productiebundel start. Alleen de stringcontrole is geautomatiseerd; het starten is handmatig gecontroleerd.
- Squad en vereniging in `GET /me` (WP-5 vult die aan).

## Bekende problemen

- Er is nog geen productiemailer (open vraag 1). `UnconfiguredMailer` gooit een fout, dus een magic link in productie geeft nu 500.
- De rate limiter zit in het geheugen; dat werkt alleen met één proces (open vraag 9).
- `net_classes` is leeg (open vraag 17), dus iedereen is `other` en de hogere limieten voor campus en CGNAT gelden nog niet.
- Zonder geregistreerde experimentseed is de toewijzing `provisional`. Die moet vóór de eerste uitnodiging vastliggen.
- WP-0-tests zonder logger schrijven toegangsregels naar stdout. Dat is alleen ruis.
