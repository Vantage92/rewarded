# REPARATIE: bevindingen van de onafhankelijke review opgelost

*Bouwrapport, 6 november 2026. Reparatie-engineer. Niet gecommit; dat doet de orchestrator. Bronnen: `docs/build/REVIEW-correctheid.md`, `REVIEW-beveiliging.md` en `REVIEW-ux-copy.md`, productplan, spec (05) §3–§6 en §8, architectuur (07) §2, §5, §6, §10 en §11, en UX (06) §3.3 en §6.2.*

## Samenvatting

Alle 10 blockers en alle 19 majors zijn opgelost. Elke opgeloste blocker heeft een test. Van de minors zijn er 13 meegenomen. 5 minors staan hieronder onder "Niet gedaan", met de reden. Er is één nieuwe migratie in een eigen reeks (`0400_reparatie`). De wijzigingen in contracts en service-interfaces zijn allemaal achterwaarts compatibel (optionele velden en één nieuwe route).

## Blockers

| # | Bevinding | Oplossing | Test |
|---|---|---|---|
| 1 | Bonus- en rustarm niet per focusdag | `ExperimentService.armsFor` krijgt optioneel `day`. Wissels, opt-out en `arm_b_stopped` worden op die dag beoordeeld. `PointsContext` bepaalt de eenheid uit het lidmaatschap dat op `day` gold. Een join- of merge-wissel die op `day` nog niet ingaat, geeft de oude arm (`from`). Een dag vóór het aanzetten van de vlag `arm_b` blijft A | `tooling/test/reparatie-arms.test.ts`: een solo-gebruiker in arm A sluit op woensdag aan bij een squad in arm B. Woensdag tot en met zondag blijft A, maandag wordt B, ook bij een herbeoordeling na maandag. `experiments-events.test.ts` is aangepast: een join-wissel op een solo-eenheid verandert niets, en de stop werkt niet met terugwerkende kracht |
| 2 | Geen rate limit op `POST /admin/mfa/verify` | De mount gebruikt `RATE_LIMITS.mfaVerify`. Mislukte pogingen worden in een eigen transactie in `admin_mfa` vastgelegd (`failed_count`, `failed_window_start`, `locked_until`). Na 5 mislukte pogingen geldt een lock van 15 minuten, die een herstart overleeft | `tooling/test/reparatie-security.test.ts`: de zesde poging geeft `RATE_LIMITED`, ook met de juiste code in een nieuw API-proces op dezelfde database |
| 3 | Geblokkeerd account kan geen beroep, export of DELETE /me doen | `loadSession` houdt de sessie van een geblokkeerd account. `checkAuth` weigert met `ACCOUNT_BLOCKED`, behalve bij routes met `allowBlocked`: `GET /me`, logout, `POST /appeals`, `GET /appeals/mine`, export en `DELETE /me`. Een geblokkeerde gebruiker kan inloggen. `MeUser.blocked`. Web: scherm `/geblokkeerd` met het besluit, [Beroep instellen] en een link naar privacy | `tooling/test/reparatie-blocked.test.ts` (API: blokkeren, inloggen, `ACCOUNT_BLOCKED` op punten, beroep, gegrond, weer actief); `apps/web/test/reparatie.test.tsx`; e2e `e2e/chain/reparatie.spec.ts` "Blokkeren, beroep in de browser, gegrond, account weer actief" |
| 4 | 18+-prijzen en eurowaarde voor 16- en 17-jarigen | `challenges.list` laat challenges met een 18+-prijs weg voor wie niet `18_plus` is. `PrizeSummary.value_cents` is optioneel en wordt niet meer gestuurd (P7). Er is geen `challenges.get`; enroll gaf al `AGE_RESTRICTED` | `wp5/clubs-challenges.test.ts` (spec §3.8 / §4.7 / UX P10): geen `value_cents`, en geen challenge of prijstekst voor een minderjarige |
| 5 | `email_reminders` staat standaard aan | Migratie `0400`: bestaande niet-kiezers op 0, plus een trigger die een ongekozen 1 bij een insert op 0 zet (een rebuild van `user` was te riskant). De registratie zet 0 expliciet. Een keuze in `PATCH /me/settings` zet `reminders_chosen_at` | `wp5/duels-belofte-cards.test.ts`: na een directe insert staat niemand op 1. De e2e controleert `settings.email_reminders === false` na registratie |
| 6 | Afmeldlinks wijzen naar een niet-bestaande route of een placeholder | Nieuwe feature `apps/web/src/features/unsubscribe`: `/herinneringen/uit` en `/afmelden`. Het token komt uit de hash. Eerst een GET voor het CSRF-cookie, daarna de POST. Bevestiging in NL en EN | `apps/web/test/reparatie.test.tsx` (beide routes, ook EN); e2e "Herinneringsmail: opt-in, mail om de gekozen tijd, uitschrijven met één klik via de dev-inbox" |
| 7 | Geen Meldingen, geen F8-besluit, `appeals.create` ongebruikt | Nieuwe route `GET /appeals/mine` (contracts `appeals.mine`, `MyDecision`): eigen markeringen en blokkades met redencode, de beroepstermijn en de status van het beroep. In Ik staat de kaart Meldingen (`id="meldingen"`) met de copy per redencode en [Beroep instellen] (modal, `appeals.create`). "Vraag het via Hulp" verwijst nu naar het contactadres, want `/hulp` bestaat niet | `apps/web/test/reparatie.test.tsx` (de reden in gewone taal, beroep met de juiste body); `tooling/test/reparatie-blocked.test.ts` (`appeals.mine`) |
| 8 | `/c/:code` uit de promokit is een placeholder | De feature club exporteert `c/:code`. Met een account gaat de link naar V2 (`/vereniging/koppelen?code=…&bron=…`). Zonder account wordt de code bewaard in sessionStorage; na de onboarding opent F1 daarmee V2. De placeholdertekst noemt geen werkpakket meer | `apps/web/test/reparatie.test.tsx`; e2e "Koppelen aan een vereniging via de URL uit de promokit /c/:code" (URL uit `board.promoKit`, met `qr_source = poster`) |
| 9 | Akkoordvinkjes zonder links, geen datum van de bonusstop | Links naar `/profiel/voorwaarden` en `/profiel/privacy` in een nieuw tabblad. `consent.pilot` en `bonus.season` krijgen `{date}`. `InvitePreview.t_day` (optioneel) levert T van de kalender waar de uitnodiging naartoe leidt; zonder uitnodiging geldt de standaardkalender. Het Bonusregelscherm gebruikt `me.calendar` | `apps/web/test/reparatie.test.tsx` (links en datum) |
| 10 | Bonusregel ontbreekt op F1 en F5 | Component `features/focus/BonusRule.tsx` met de copy uit UX §6.2 voor arm A, arm B, arm B op maandag en na een gehaald doel, en de link "Waarom zie ik dit?". Niet bij `none`, niet in de modus zonder punten en niet in de nachtregel. Nieuw optioneel veld `TodayResponse.week_budget` (resterend `pending_goal_budget`, punten per dag, eerste dag van de week). Op F1 staat de regel onder de startknop, op F5 als laatste regel van het puntenblok | `apps/web/test/reparatie.test.tsx` (A, B, `none`, zonder punten) |

## Majors

| Bevinding | Oplossing | Test |
|---|---|---|
| Weekbudget arm B bij instap midden in de week | `ensureWeekGrant` rekent vanaf de eerste dag van de week waarop de gebruiker in arm B zit. Stap `jobs/week_close/goal-budget-lapse.ts` laat de rest van de afgesloten week vervallen (`goal_budget_lapse`, redencode `week_end`), met uitzondering van de 20 per `postponed`-dag. De berekening telt alleen de stroom van die week, want de weekafsluiting kan midden in de volgende week inhalen | `reparatie-arms.test.ts`: de vlag gaat donderdag aan, het budget is 80, en na de weekafsluiting blijft er niets hangen |
| `goalFor` leest een uitgestelde wijziging terug | Tabel `user_goal_change` (wijziging plus `effective_from`). `goalFor` gebruikt `goalForDay` uit core zodra er historie is | `tooling/test/reparatie-goal.test.ts` (het scenario uit de review: woensdag blijft 120, geen bonus) |
| `restore()` gooit markeringen weg | De vlaggen uit de nieuwe beoordeling (`flag_codes`, `review_status = pending`, `flags.raise`) worden vóór `reconcileDay` gezet, zoals in `complete()` | `tooling/test/reparatie-fraud.test.ts` (H1 blijft na een herstel om een storing) |
| De sweep geeft altijd `heartbeat_gap` | Als het laatste contact vóór het geplande einde binnen `gap_ok` valt, wordt de uitkomst `late_end` op het geplande einde | `wp4-sessions.test.ts` "late_end via the sweep" |
| H1 ziet geen headless UA | De server legt `ua_headless` vast bij de start, met een regex op de ruwe User-Agent (`isHeadlessUserAgent` in core). `flagsFor` geeft H1 bij `webdriver` of `uaHeadless` | `reparatie-fraud.test.ts` (HeadlessChrome zonder webdriver geeft H1) |
| `persistFindings` slaat bestaande dedupkeys over | Bij een open vlag worden de nieuwe sessies gekoppeld en op pending gezet; een besliste vlag blijft ongemoeid | `reparatie-fraud.test.ts` |
| `appeal_upheld` zonder beroep | `restore` eist een gegrond beroep over een markering op deze sessie | `reparatie-fraud.test.ts` (`SESSION_NOT_RESTORABLE` zonder beroep) |
| Geen controle op belangenconflict | `assertNotOwnSubject` geeft `SAME_REVIEWER` in decide, confirmBlock, decideAppeal, restore, prizes.verify en samples.judge. De foutcode is aan de `errors` van die routes toegevoegd | `reparatie-fraud.test.ts` (Anna kan niet over haar eigen account beslissen, Bram wel) |
| X-Forwarded-For: eerste element | `clientIp` neemt het element `TRUST_PROXY_HOPS` (standaard 1) van rechts. `server.prod.ts` start niet zonder `TRUST_PROXY` (0 of 1) en zonder een `APP_ORIGIN` met `https://`, en zet Secure-cookies altijd aan (minor uit de beveiligingsreview meegenomen) | `reparatie-security.test.ts`; `prod-bundle.test.ts` start met de nieuwe variabelen |
| `device_id` blijft na 30 dagen | Na 30 dagen wijzen sessies naar één plaatshouder per gebruiker (`retired_<user>`, zonder echte `client_device_id`). Daarna wordt de echte `device` verwijderd op `last_seen_at` (180 dagen). Zie de tegenspraak hieronder over de NOT NULL-kolom | `wp6-retention.test.ts` (uitgebreid) |
| `squads.mine` toont status van stille leden | Een stil lid krijgt alleen `first_name` en `status: 'silent'`. `today: { active, goal_met }` komt als aggregaat terug. `paused` en `goal_met_today` zijn optioneel geworden | `wp5/privacy.test.ts` (`squads.mine` in de privacytest) |
| Bestuursdashboard toont de lopende week | Alleen afgesloten weken. `pending` gaat ook door `weeklyCountSeries` (verschilregel) | `wp5/privacy.test.ts`: de lopende week wordt niet getoond, en één koppeling midden in de week verandert niets |
| Ambassadeurs tellen pending sessies | `review_status IN ('none', 'released')`, en accounts met een open markering tellen niet mee. De telling wordt bevroren bij het trekken van de steekproef en kan daarna alleen dalen | Bestaande tests groen (geen nieuwe test: geen blocker) |
| Inlogmail naar het getypte plus-adres | Voor een bestaand account gaat de mail naar `user.email`, en dat adres staat in `auth_magic_link.email`. `auth.code` zoekt via de genormaliseerde hash | `reparatie-security.test.ts`; `wp3/auth-flow.test.ts` en e2e `access.spec.ts` aangepast |
| Herinneringen: vaste tijd, ook als het doel gehaald is, andere copy | `reminder_time` en `reminder_days` per gebruiker, in `SettingsPatch` en `UserSettings` (optioneel). De job draait per kwartier (`reminders:<dag>T<HH:MM>`). Er gaat niets weg als het doel gehaald is. De mailcopy uit UX §6.2 (dagdoel- en squadmail, voet "Je krijgt deze mail omdat…") staat in `modules/reminders/mail.json`. Het afmeldtoken is willekeurig en staat in een opzoekkolom. Web: tijd en dagen in Ik, en het voorstel op F1 | `wp5/duels-belofte-cards.test.ts` (tijd, dagen, copy, token zonder user-id); e2e |
| F5 zonder reden bij een markering | `EndSessionResponse.flag_reason` (optioneel): `no_signal`, `automation`, `clock`, `outage` of `pattern`. De copy is `completed.points_pending` met `{reason}` | Indirect via e2e kernflow (tekst "wordt nagekeken") |
| F5 mist squadblok, kaartlink en inverdienregel | Squadblok uit `squads.mine.today` met de squaddag-copy uit UX §6.2, plus de streak. De link "Maak een kaart" (niet bij een markering, alleen met de vlag `cards`). De regel "Nog N minuten focus tot je eerste verzilvering" | Geen aparte test (major, geen blocker) |
| Noemer op F1 | `PresenceResponse.active_count` (optioneel, volgens spec §4.4) | `apps/web/test/reparatie.test.tsx` en `wp5/privacy.test.ts` |
| Taalkeuze alleen in localStorage | `AccountLanguageSwitch` in Ik stuurt `PATCH /me/settings {locale}` en invalideert me, catalogus en challenges. `useAccountLocale` neemt `me.locale` over als de browser nog geen keuze heeft | Geen aparte test |
| F1 mist joker, tentamenlink, squadstreak, vereniging en herinneringsvoorstel | Alle vijf toegevoegd. F10 is een sheet die `PUT` of `DELETE /me/exam-days/:day` aanroept. `TodayResponse.streak` wordt nu gevuld uit de squad | Geen aparte test |

## Minors

Meegenomen:

- de idempotentie van de verzilvering wordt in de transactie opgeslagen;
- uitloggen in Ik (`auth.logout`, daarna IndexedDB `active_session`, `outbox` en `cache` leeg);
- de export bevat heartbeats, zichtbaarheidsgebeurtenissen en samenvattingen;
- DELETE /me geeft het beheer aan het langst zittende lid;
- de SVG-kaart heeft `Content-Disposition: attachment`;
- productie zonder `APP_ORIGIN` met https;
- het afmeldtoken bevat geen user-id meer;
- de eigen sleutel `points:plus.off`;
- de tabtitel "Sessie klaar · Rewarded" op het eindsignaal;
- de F2-regel "Je hebt een sessie op een ander toestel. Starten stopt die.";
- de README-zin;
- de reminder-mailcopy in een catalogus (`mail.json`), zie "Niet gedaan" voor de lint;
- de placeholder noemt geen werkpakket meer.

## Niet gedaan (met reden)

- **Intensiteit in challenges op afgetopte geverifieerde minuten** (minor, `core/challenges`). Dit raakt de tweede sorteersleutel van `rankPools` en de bestaande scoretests. Het verschil ontstaat pas in de rustperiode (vanaf T + 1), dus na de pilotstart. Daarom heb ik het niet zonder risico kunnen meenemen.
- **`rest_period.first_day` in params v1** (minor). Een wijziging van een parameterwaarde in v1 raakt de paramversie en de bestaande boekingen. De standaardkalender rekent al goed via `calendarDates`; alleen de terugval in `earnArmFor` leest de afwijkende datum. Die terugval treedt niet op zolang `PointsContext` `restPeriod` doorgeeft (dat gebeurt altijd). Besluit nodig: v2 van de params, of verwijderen.
- **De i18n-lint over de API-mailteksten** (minor). De herinneringscopy staat nu in `apps/api/src/modules/reminders/mail.json`, maar `lint.ts` leest alleen de web-catalogi, en `waitlist/mail.ts` staat nog in code. De lint uitbreiden naar een tweede map vraagt een wijziging in de lint-CLI en de test van WP-7.
- **AbortedView (F6)**: de dubbele tijdzin, de definitielijst uit mockup 08 en de duur op de knop. Dit is cosmetisch en de e2e-teksten van WP-8 hangen eraan.
- **RunningView**: stippen of avatars. Dit is een ontwerpbesluit (presence geeft bewust geen namen). Het vraagt een keuze van UX en architectuur en is geen code.
- **Uitsluiten van `is_team`-accounts bij verzilvering en prijzen** ("overweeg" in de review). Niet gedaan: geen spectekst.
- **De rest van de F5-copy "Mila en Daan zaten er ook"**. De presence geeft geen namen, dus ik toon de squaddag-zin uit UX §6.2 in plaats van namen.

## Tegenspraak in de documenten (en wat ik koos)

1. **Redencodes.** UX §6.2 stelt `release_ok`, `reject_automation` en zo verder voor (met de expliciete kanttekening "voorstel, af te stemmen met spec 4.11"). Core (`FLAG_REASON_CODES`, WP-6) gebruikt `no_evidence`, `automation` en zo verder. Ik heb de codes uit core gehouden, omdat beheer en de database ze al gebruiken, en de UX-copy per core-code in `profile.json` gezet.
2. **`focus_session.device_id` is NOT NULL** (WP-4), terwijl de review vraagt om de kolom nullable te maken. Een rebuild van `focus_session` raakt vier tabellen met foreign keys en de triggers. Daarom wijzen sessies na 30 dagen naar een plaatshouder per gebruiker zonder toestelkenmerk. Dat bereikt het doel van §10.6 (geen `client_device_id` na de termijn).
3. **De standaardwaarde van `email_reminders`.** Een DEFAULT wijzigen kan in SQLite niet zonder een rebuild. Een AFTER INSERT-trigger geeft hetzelfde gedrag.
4. **Arm B midden in de week.** Spec §5 noemt 20 × resterende dagen bij instap. Voor een vlag die midden in de week aangaat, lees ik "instap" als de eerste focusdag waarop de vlag aan stond (`feature_flag.updated_at`). Dagen daarvoor blijven ook bij een herbeoordeling A.
5. **"Waarom zie ik dit?" bij de nachtregel.** De UX-tabel noemt de Bonusregel en de nachtregel allebei op F1. Bij een sessie na 01:00 is er geen doelbonus, dus ik toon dan alleen de nachtregel.

## Interface-notities (alle wijzigingen achterwaarts compatibel)

- **`packages/contracts`:**
  - nieuwe route `appeals.mine` (`GET /appeals/mine`, `MyDecision`, `MyDecisionsResponse`), opgenomen in `test/endpoints.ts`. Reden: de student moet besluiten zien en in beroep kunnen gaan (spec §6.4, §6.5), en architectuur §8.2 had daar geen route voor;
  - optionele velden: `MeUser.blocked`, `UserSettings`/`SettingsPatch.reminder_time` en `reminder_days`, `TodayResponse.week_budget`, `EndSessionResponse.flag_reason`, `PresenceResponse.active_count`, `SquadMineResponse.today`, `SquadMember.status` (en `paused`/`goal_met_today` optioneel), `InvitePreview.t_day`;
  - `PrizeSummary.value_cents` is optioneel en wordt niet meer gevuld;
  - `SAME_REVIEWER` toegevoegd aan de errors van `admin.flags.decide`, `admin.samples.judge`, `admin.prizes.verify` en `admin.sessions.restore`.
- **Service-interfaces:**
  - `UserArmContext.day?` (optioneel; zonder `day` geldt vandaag, zoals vroeger);
  - `HttpConfig.proxyHops?`;
  - `RequireAuthOptions.allowBlocked?`.
- **`packages/core`:**
  - `SessionHeader.uaHeadless?`;
  - `isHeadlessUserAgent` en `HEADLESS_UA` in `core/session`;
  - `flagsFor` geeft H1 ook bij `uaHeadless`.
- **Migratie `0400_reparatie`** (nieuwe reeks `0400–0499`, `REPARATIE` in `MIGRATION_SERIES`): `user_goal_change`; `admin_mfa` (`failed_count`, `failed_window_start`, `locked_until`); `user` (`reminders_chosen_at`, `reminder_time`, `reminder_days`, `reminder_unsub_token` met unieke index, de opt-in-trigger); `focus_session.ua_headless`.
- **Gedrag:**
  - de reminders-job heeft runkeys per kwartier;
  - de productie-API vraagt `TRUST_PROXY` en `APP_ORIGIN` met https;
  - de SVG-kaart komt als attachment;
  - een geblokkeerd account kan inloggen (beperkte sessie).
- **Tests van anderen aangepast, met reden:**
  - `wp3/experiments-events.test.ts`: de join-wissel geldt nu voor het squadlidmaatschap;
  - `wp3/platform-dev.test.ts`: reeks 0400;
  - `wp3/auth-flow.test.ts` en e2e `access.spec.ts`: de mail gaat naar het accountadres;
  - `wp5/clubs-challenges.test.ts`: geen `value_cents`;
  - `wp5/privacy.test.ts`: alleen afgesloten weken, en een stil lid;
  - `wp5/duels-belofte-cards.test.ts`: herinneringen;
  - `wp5/squads.test.ts`: `t_day` in de preview;
  - `wp6-retention.test.ts`: de toestelkoppeling;
  - `prod-bundle.test.ts`: de omgevingsvariabelen;
  - e2e `kernflow`, `session-complete` en `session-offline`: de tekst "wordt nagekeken" heeft nu een reden.
- **Gedeelde testhelper** `tooling/test/world.ts`: een kopie van de wereld uit `integratie-ronde3.test.ts`, plus `armBOn`, `clock`, `hasher` en `ua`.

## Bekende problemen

- **De reminders-job schrijft 96 `job_run`-rijen per dag** (een per kwartier), naast de sweep. De bewaartermijnjob ruimt `job_run` nog steeds niet op.
- **De in-memory rate limit op MFA telt ook geslaagde pogingen** (5 per 15 minuten per beheerder). Wie vaker dan vijf keer per kwartier inlogt, wacht. De seed en de e2e blijven daaronder.
- **Een pending clubcode van `/c/:code` leeft in sessionStorage.** Opent de student de inlogmail in een ander tabblad of op een ander toestel, dan moet hij de QR opnieuw scannen.
- **Squadmail.** De squadmail noemt alleen voornamen van leden die niet in stille modus staan en hun doel al haalden. Zijn die er niet, dan gaat de dagdoelmail weg.

## Verificatie (werkelijke uitkomst)

| Commando | Uitkomst |
|---|---|
| `pnpm verify` (typecheck, oxlint `--deny-warnings`, Vitest) | exit 0; **86 bestanden, 1170 tests, alle groen** (vóór de reparatie: 80 bestanden, 1151 tests) |
| `pnpm build` | exit 0 |
| `pnpm seed:demo` | exit 0, ongeveer 14 s; 45 studenten, 9 squads, 3 verenigingen, 578 sessies |
| `pnpm e2e` | exit 0, **60 geslaagd, 11 overgeslagen** (`fixme` in `later.spec.ts`, ongewijzigd), 0 gefaald, 2,1 minuten. Nieuw: `e2e/chain/reparatie.spec.ts` (3 scenario's) |
| `pnpm -F @rewarded/web lint:i18n` | 0 meldingen |
| `pnpm -F @rewarded/web test:pwa` | 10/10 groen |

Nieuwe tests:
- `tooling/test/reparatie-arms.test.ts`, `reparatie-goal.test.ts`, `reparatie-security.test.ts`, `reparatie-blocked.test.ts` en `reparatie-fraud.test.ts`;
- `apps/web/test/reparatie.test.tsx`;
- `e2e/chain/reparatie.spec.ts`;
- uitbreidingen in `wp4-sessions`, `wp5/*` en `wp6-retention`.
