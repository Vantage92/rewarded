# INTEGRATIE — alle werkpakketten samen, plus de bouwpunten van pitchronde 3

*Bouwrapport, 6 november 2026. Integratie-engineer. Niet gecommit; dat doet de orchestrator. Bronnen: productplan §0–§4, §7; spec §3.13, §3.16, §4.13, §6.3, §7.1, §8; architectuur §2, §3.4, §4.7, §5.1, §6.5, §8.2, §8.3, §10.3, §10.9, §11, §12.5; `docs/pitch/ronde-3-founder-reactie.md` (G-MF3, G-S2) en de rapporten `docs/build/WP-1.md` tot en met `WP-11.md`.*

## Uitgangspunt

Bij de start was de repository bijna groen: 1 rode unittest (`/kans` in `apps/web/test/shell.test.tsx`), `pnpm build`, `pnpm seed:demo` en `pnpm e2e` geslaagd (53 groen, 11 `fixme`, 1 verwachte fout). De integratie zat vooral in wat de pakketten aan elkaar overlieten.

## Wat werkt

### Kernflow end-to-end

`e2e/chain/kernflow.spec.ts` draait in Chromium tegen de echte API van de worker:

1. de beheerder maakt een tentamenkalender, een vereniging met code, een catalogusitem en een aanloopklassement;
2. een student opent de squadlink, logt in met de code uit `GET /dev/inbox` en doorloopt de onboarding;
3. hij koppelt zich via `/vereniging/koppelen?code=…`;
4. hij doet een sessie van 25 minuten. `POST /dev/clock` en de gepauzeerde `page.clock` lopen daarbij in stappen van 30 s samen op, en er komen ≥ 45 heartbeats als contact binnen;
5. de sessie is voltooid maar gemarkeerd H1 (Playwright heeft `webdriver = true`), dus de punten worden nagekeken;
6. een tweede beheerder logt in met TOTP en geeft de markering vrij in `/beheer/wachtrij`;
7. de student ziet 45 punten (25 plus de doelbonus van 20 in arm A), zijn squad, de verenigingsranglijst na de dagafsluiting en de catalogus.

`pnpm dev` start API (8787) en web (5173, met proxy). Health, de dev-klok en de dev-inbox antwoorden.

### WP-8-scenario's tegen de echte API (`e2e/chain/focus-real.spec.ts`)

- Stoppen na 7 minuten met bevestiging: `user_stop` en de F6-tekst.
- Verborgen na 12 minuten: `hidden`, 0 minuten.
- Hervatten op hetzelfde toestel: na de hervatting tellen de heartbeats als contact (de fout van WP-4, zie hieronder).

De specs in `e2e/focus` blijven ook tegen hun fake draaien.

### Bouwpunten uit pitchronde 3 (elk met een test)

| # | Punt | Waar | Test |
|---|---|---|---|
| 1 | De tentamenkalender per vereniging is de bron van T, N en A | `packages/core/src/calendar` (alle afgeleide data van spec §4.13), `apps/api/src/db/calendar.ts` (de kalender van een eenheid: squad, dan eigen vereniging, dan de standaardkalender), migraties 0210/0211, `modules/clubs/calendars.ts`, scherm `/beheer/tentamenkalenders` | `packages/core/test/integratie-calendar.test.ts`; `tooling/test/integratie-ronde3.test.ts` "two clubs with a different T…" en "no code without a club calendar…"; `apps/web/test/integratie.test.tsx` |
| 2 | Het instellingsanker is uniek per adres via een HMAC met de lokale pepper | `HashPurpose 'inst'` met `pepper_inst` (`platform/system.ts`; `pnpm secrets:init` schrijft hem, oudere bestanden leiden hem af), `fraud/lib/institution.ts`. Alleen HMAC en domein worden bewaard | `tooling/test/integratie-ronde3.test.ts` "§6.5 the anchor is unique…": hoofdletters en plus-deel geven dezelfde HMAC, het adres staat in geen enkele tabel, en een ander adres bij herbevestiging geeft `ADDRESS_MISMATCH` |
| 3 | H12 meet overlap over de hele duur | Bestond al in `core/fraud` (WP-6) | `packages/core/test/integratie-h12.test.ts`: starts 20 minuten uit elkaar markeren wel, gelijke starts met 25 minuten overlap niet |
| 4 | Het uitbreidingscohort in een rustsquad krijgt persoonlijk doorlopende punten | `earnArmFor` krijgt `cohort` en de rustperiode van de kalender; `PointsContext` geeft ze door; referral idem | core-test en `tooling/test/integratie-ronde3.test.ts` "§3.16 stap 3": een laat lid (expansion) in een rustsquad krijgt `earn_session` op T + 4, de oprichter niet |
| 5 | Een overstap van een rustsquad naar een doorlopende squad telt als uitstap | `modules/points/restarm.ts`: de rustarm wordt vanaf T − 6 aan de persoon vastgezet (dagafsluiting stap 6 en bij vertrek uit een squad), `afterJoinSquad` zet `rest_exit_at` en `rest_exit_source = squad_switch`, het event `rest_period_exit` en `arm_switch` met reden `squad_switch`. `POST /me/rest-exit` voor de knop | `tooling/test/integratie-ronde3.test.ts` "§3.16 stap 4 / Overstap" (dezelfde dag nog rust, vanaf de volgende focusdag `earn_session`, daarna `ALREADY_EXITED`) en "POST /me/rest-exit" (`NOT_IN_REST_ARM`) |
| 6 | De seed maakt twee verenigingen met een verschillende T | `tooling/seed/demo.ts`: Kompas en Prisma op de hogeschoolkalender (T = 24 januari 2027), Ratio op de universiteitskalender (T = 7 februari 2027), plus de standaardkalender | `tooling/test/seed.test.ts` "demo has two club calendars…" |

### Kalender in elke module die een vaste datum las

- **Sessies en punten:**
  - het seizoen en de doelbonus per kalender (`PointsContext.day`);
  - het weekbudget van arm B (`ensureWeekGrant`);
  - de pool `pilot`/`research` en `eligible_users` (`catalog/stock.ts`);
  - de rustperiode in `earnArm`.
- **Squads:** de tentamenperiodes voor hersamenstellen (`calendarById` loopt via core). Verandert de kalender van een vereniging, dan krijgen haar squads de nieuwe `calendar_id`.
- **Challenges:** de blokkade van prestatiechallenges in de rustperiode gebruikt de kalender van de gebruiker, ook voor solo-gebruikers.
- **Belofte** (`calendarById`) en **referral** (de rustperiode uit de kalender).
- **Registratie:** experimentpopulatie of uitbreidingscohort volgens T van de kalender van de uitnodiging (squad, vereniging of maker).
- **Bewakingsregel:** de weekafsluiting kijkt naar de rustperiode van alle kalenders, de standaardkalender inbegrepen.
- **KPI's:**
  - `event.calendar_id` wordt nu gevuld;
  - de query's vallen terug op de standaardkalender in plaats van op "de kalender met de vroegste T";
  - zonder ingevulde N geldt T + 1 … T + 14.
- **`params`:** de vaste data worden alleen nog gelezen in `core/calendar` `defaultCalendar` en `pilotStartDay`. Een `grep` buiten `core/calendar` en de params-bestanden zelf vindt geen lezer van `season`, `rest_period`, `early_offer_day`, `registration_last_day` of `prize_period_weeks` meer.

### Verplichte punten uit de not_done-lijsten

- **Tentamenkalender:**
  - `exam_calendar` met `is_default`, `a_resit_days` en vier ogen na `fixed_at` (`pending_patch`);
  - `exam_calendar_id` op een vereniging;
  - zonder kalender (en nooit de standaardkalender) krijgt een vereniging geen code;
  - het aprilledental: `POST /admin/clubs/:id/april-members` en het scherm in het verenigingsdetail.
- **`GET /me`** geeft `squad`, `club` (`linked`/`pending_admin`) en `calendar` (T, bonusstop, aanbod T − 6, rustperiode, A).
- **MFA-routes voor beheerders:** `POST /admin/mfa/enroll` en `/verify` bestonden al in `modules/admin` (WP-6). Ze zijn gecontroleerd en worden gebruikt in de seed en de e2e.
- **Jobs:** `jobs/sweep.ts` registreert de sweep van WP-4 (elke minuut). `jobs/retention.ts` maakt `POST /dev/jobs/retention/run` mogelijk; 's nachts draait de opschoning als dagafsluitingsstap 11. Elke jobnaam uit contracts heeft nu een jobbestand (test).
- **Foutcodes en events in contracts:**
  - foutcodes: `ALREADY_EXITED`, `NOT_IN_REST_ARM`, `MERGE_ARM_MISMATCH`, `SCHEDULE_LOCKED`, `CALENDAR_FIXED`, `DEFAULT_CALENDAR_EXISTS`, `SOURCE_REQUIRED`, `EXPANSION_CAP_REACHED`, `ADDRESS_MISMATCH`, `ANCHOR_NOT_UNIQUE`, `AMBASSADOR_SAMPLE_REQUIRED` en `INTEREST_DECLARED`, met NL- en EN-teksten;
  - events: `rest_period_exit`, `rest_period_flag_off`, `institution_email_rejected`, `institution_email_reconfirmed`, `sample_interest_declared`, `sample_contact_reconfirmed`, `belofte_renewal_offered`, `competence_feedback_shown` en `catalog_empty_seen`;
  - nieuwe routes: `/admin/exam-calendars` (lijst, detail, aanmaken, wijzigen), `/admin/clubs/:id/april-members`, `/me/rest-exit`, `/me/institution-email/reconfirm`, `/admin/samples/:id/items/:item/interest` en `/admin/ambassadors/:id/payouts`. Ze zijn allemaal geïmplementeerd.
- **De productiebundel start zonder dev-routes.** `apps/api/test/prod-bundle.test.ts` bouwt, start de bundel met tijdelijke peppers, controleert `/health` en verwacht 404 op `/dev/inbox`, `/dev/clock`, `/dev/jobs/sweep/run` en `/dev/reset`. `modules/draws` en `packages/core/src/draws` zijn verwijderd (architectuur §12.5).

### Bekende punten uit de rapporten, opgelost

| Punt | Oplossing |
|---|---|
| Heartbeats vielen na een hervatting weg (`last_seq = 0` tegen de primaire sleutel `(session_id, seq, kind)`) | Migratie `0130_session_seq_offset`. Opgeslagen rijen krijgen `seq + seq_offset`, het protocol-`seq` begint opnieuw bij 1. Test `apps/api/test/integratie/session-resume.test.ts` en de e2e-hervatting |
| Rode test `/kans` | Aangepast: `/kans` is een onbekende pagina, want er komt geen trekkingsscherm (spec §3.9) |
| i18n-namespaces `board` en `admin` in de shelltests | Waren al aanwezig (WP-10); de shelltests zijn groen |
| WP-8-specs tegen een fake | De kernscenario's draaien nu ook tegen de echte API (zie boven) |
| `main.tsx` zonder `canActivateUpdate` | `registerServiceWorker({ canActivate: canActivateUpdate })`, met een nieuwe poging bij terugkeer naar de pagina en elke minuut. Daarbij een fout opgelost in `sw-register.ts`: de eerste installatie (`clientsClaim`) herlaadde de pagina. Alleen een update herlaadt nog (`test:pwa` 10/10) |
| Mocks per feature voor `?api=mock` | `features/focus/mock.ts` (sessie, heartbeats, einde, `/me/today`, toestel) en mockhandlers voor kalenders en het aprilledental in `features/admin/mock.ts` |
| Bundel per route lazy laden | Splitsing in vendor-, contracts- en core-chunks (`apps/web/vite.config.ts`). De hoofdchunk gaat van 857 naar 335 kB en de waarschuwing boven 500 kB is weg. Beheer en bestuur waren al lazy. Lazy laden per feature heb ik niet gedaan; zie hieronder |
| `POST /admin/challenges` met prijzen gaf 500 (foreign key) | De challenge-rij wordt eerst ingevoegd. Test in `tooling/test/integratie-ronde3.test.ts` |
| `/dev/reset` wiste de systeemrekeningen | `db/migration-rows.ts` zet de systeemrekeningen en de standaardkalender terug; de seed gebruikt dezelfde functie |
| H9 telde een late `first_interaction_after_end` niet | `POST /sessions/:id/events` vult `claim_delay_s` bij een voltooide sessie zonder claim. Test in `session-resume.test.ts` |
| Arm B "boekt toch `goal_budget_lapse` op een tentamendag" | Geen fout: architectuur §5.1 schrijft precies dat voor (redencode `exam_day`, zonder melding), en spec §3.13 zegt "valt stil uit het weekbudget". De e2e-verwachting is aangepast (zie tegenspraak 1) |
| `MERGE_ARM_MISMATCH` als `NOT_ELIGIBLE` | Nu de echte code; `details.reason` blijft voor oudere clients |

## Verificatie (werkelijke uitkomst)

| Commando | Uitkomst |
|---|---|
| `pnpm install --offline` | exit 0 |
| `pnpm verify` (typecheck root en alle pakketten, oxlint `--deny-warnings`, Vitest) | exit 0; **80 bestanden, 1151 tests, alle groen** |
| `pnpm -F @rewarded/web lint:i18n` | 0 meldingen |
| `pnpm -F @rewarded/web test:pwa` | 10/10 groen. Vóór de fix in `sw-register.ts` faalden er 2, door een herlaadactie na de eerste installatie |
| `pnpm build` | exit 0, geen chunk boven 500 kB, geen `__rwTest`, `DevClock` of `DevInbox` in de bundels |
| `pnpm seed:demo` | exit 0, ongeveer 13 s: 45 studenten, 9 squads, 3 verenigingen op 2 kalenders, 578 sessies, red team 10, wachtlijst 20 |
| `pnpm e2e` | exit 0, **57 geslaagd, 11 overgeslagen** (`fixme` in `later.spec.ts`), 0 gefaald, 1,9 minuten |
| `pnpm dev` | API en web starten. `GET /api/v1/health` via de proxy op 5173 antwoordt, `POST /dev/clock` antwoordt |
| Productiebundel handmatig (`node apps/api/dist/server.prod.js` met eigen peppers) | Start. `/health` 200, `/dev/inbox` 404, `POST /dev/clock` 403 (CSRF vóór de 404) |

## Tegenspraak in de documenten (en wat ik koos)

1. **Tentamendag in arm B.** De e2e van WP-11 verwachtte "geen −20" als "geen boeking". Spec §3.13 stap 3 zegt "valt stil uit het weekbudget"; architectuur §5.1 boekt `goal_budget_lapse` met redencode `exam_day`, zonder melding. Ik volg spec en architectuur (die hier niet botsen). De test controleert nu de redencode en de afwezigheid van `daily_goal_missed`.
2. **Data van de standaardkalender.** Spec §4.13 neemt als werkhypothese de laatst eindigende pilotkalender. De parameters (ronde 1) geven T = 17 januari en het einde van de rustperiode op 31 maart, zonder aprilvenster. De demo heeft een kalender met T = 7 februari, dus de standaardkalender eindigt vroeger dan de laatst eindigende pilotkalender. Ik heb de waarden uit `params` gelaten (migratie 0211, ook te wijzigen via `PATCH /admin/exam-calendars/:id`). De founder moet ze vóór 2 december vastleggen. Zonder A-start heeft de standaardkalender geen tweede Belofte-aanbod en geen herhaalbericht.
3. **Cohort bij registratie via de wachtlijst.** Spec §4.13: "tot en met T van zijn kalender". Bij registratie is de kalender van de gebruiker alleen bekend via de uitnodiging (squad, vereniging of maker). Een wachtlijstuitnodiging valt op de standaardkalender. Wie daarna een vereniging met een latere T kiest, blijft in het cohort van de standaardkalender. Een besluit is nodig: herclassificeren bij het koppelen (dat raakt de toewijzing) of zo laten.
4. **`MERGE_ARM_MISMATCH` en `DOMAIN_MISMATCH`/`SESSION_ACTIVE`.** Architectuur §8.3 noemt de laatste twee als vervallen. Ze staan niet in contracts.
5. **Module van de nieuwe foutcodes.** Architectuur §8.3 noemt alleen de HTTP-klasse. De kalendercodes vallen onder `clubs` (daar staan de beheerroutes van verenigingen), de uitstapcodes onder `points` (`earnArm`) en de ankercodes onder `fraud`.

## Interface-notities (alle wijzigingen achterwaarts compatibel)

- **`packages/core`:**
  - nieuw `core/calendar`: `ExamCalendar`, `CalendarDates`, `CalendarRange`, `defaultCalendar`, `calendarDates`, `isSeasonDay`, `isRestDay`, `cohortForRegistration`, `restArmFixedOn` en `validateCalendar`;
  - `EarnArmInput` kreeg de optionele velden `cohort` en `restPeriod`;
  - `core/draws` (een lege stub) is verwijderd, samen met de export.
  - Reden: de kalenderregel van G-MF3. Bestaande aanroepen werken ongewijzigd.
- **`packages/contracts`:**
  - nieuw bestand `calendars.ts` met de routes en schema's hierboven;
  - nieuwe optionele velden: `MeResponse.calendar`, `AdminClub.exam_calendar_id`, `AdminClub.april_members` en `AdminClubCreate.exam_calendar_id`;
  - `ArmSwitchReason` uitgebreid met `rest_flag_off` en `squad_switch`;
  - foutcodes en events aangevuld;
  - `errors` van bestaande routes aangevuld: `squads.merge*` (`MERGE_ARM_MISMATCH`), `admin.rewards.releases` (`SCHEDULE_LOCKED`) en `me.onboarding` (`EXPANSION_CAP_REACHED`);
  - de testlijsten (`test/endpoints.ts`) volgen architectuur §8.2 en §8.3 versie 1.4.
- **Service-interfaces en platform:**
  - `HashPurpose` kreeg `'inst'` en `Peppers` het optionele veld `pepper_inst`;
  - `PointsContext` kreeg `unitArms` en `pool(p, day, db?)`;
  - `poolOf(cohort, day, tDay?)`;
  - `PointsContext.arms` past nu de vastgezette rustarm toe vanaf T − 6.
- **Migraties:**
  - `0010_user_round3` (WP-3-reeks): `rest_arm_fixed` en `rest_exit_source`, en een rebuild van `arm_switch` voor de nieuwe redenen, met de append-only-trigger;
  - `0130_session_seq_offset` (WP-4);
  - `0210_exam_calendar_round3` en `0211_default_calendar` (WP-5).
  - Er botsen geen nummers.
- **Verwijderd:** `apps/api/src/modules/draws`, waardoor de modulelijst 24 modules telt (tests aangepast).
- **Tests van anderen aangepast, met reden:**
  - `shell.test.tsx`: `/kans`;
  - `wp3/platform-dev.test.ts`: retention heeft nu een jobbestand;
  - `app.test.ts` en `modules.test.ts`: draws is weg;
  - `wp5/clubs-challenges.test.ts`: een code vraagt nu een kalender;
  - `wp5/squads.test.ts`: `MERGE_ARM_MISMATCH`;
  - de e2e-specs `points`, `social` en `fraud`: de kalender bij een vereniging en de tentamendag;
  - `prod-bundle.test.ts`: de bundel wordt ook gestart en staat in `apps/api/.prod-bundle-test` (op dezelfde diepte als `dist/`, zodat `config.ts` de root vindt); in `.gitignore`.
- **Seed:** de demo maakt eerst de kalenders, dan de verenigingen. De vingerafdruk is veranderd, het determinisme niet (seed-test groen).

## Niet gedaan

- **Vragenlijsten** (`GET /surveys/due`, `POST /surveys/:moment`): de enige twee routes uit contracts zonder implementatie. Ze raken de pilotmeting (instroom, pilotreflectie, N, na A, de wekelijkse welzijnsmeting) en dus ook criterium 1 van de stopregel. Dit is het belangrijkste open punt.
- **Schermen voor de rustperiode:**
  - het bericht op T − 6, het herhaalbericht op A-start, en P6/Q9 "Ik wil weer punten verdienen";
  - `rest_notice` in `/me/today`;
  - de melding vóór het aansluiten bij een squad (invite-preview).
  - De API ligt klaar: `POST /me/rest-exit`, `joinWouldExitRest` en `GET /me.calendar`. Daarom blijven 4 rijen in `e2e/chain/later.spec.ts` `fixme` in de browser; hun API-kant is gedekt in `tooling/test/integratie-ronde3.test.ts`.
- **De A/A-controle `tooling/scripts/aa-check.ts`** op de bevroren toewijzing en de KPI-query's met 800 gebruikers en twee kalenders. De opdracht stond de seed als alternatief toe. `POST /dev/aa-check` toetst alleen de toewijzingsregel en kent geen kalenders. `core/experiments` (WP-1) bestaat nog niet; de toewijzing staat in `db/services/experiments.ts`.
- **Kalender per faculteit per persoon.** De tabel kent `faculty`, maar een vereniging heeft één kalender en een gebruiker kiest geen faculteit.
- **Herkansingsdagen in A.** Ze worden opgeslagen, maar KPI (d) en H3 sluiten ze nog niet uit. N houdt nog geen rekening met herkansingen als het niet ingevuld is.
- **Wisselen van kalender bij een overstap** "vanaf de eerstvolgende maandag" met `arm_switch` factor `calendar`: de squad bepaalt direct.
- **Gedeclareerd maar niet afgedwongen:**
  - `EXPANSION_CAP_REACHED`: er is geen MAU-teller en geen parameter `expansion_mau_cap`;
  - `SCHEDULE_LOCKED`: de vrijgaveroute kan alleen ophogen;
  - `ANCHOR_NOT_UNIQUE`: de unieke index maakt de situatie onmogelijk.
- **Lazy laden per feature-route.** Dat vraagt dat elke `features/*/routes.tsx` `lazy` gebruikt, en de i18n laadt alle catalogi eager (WP-7). Ik heb alleen de vendors gesplitst, omdat dat zonder risico kan.
- **Web-UI voor de overige nieuwe beheerroutes** (herbevestiging van het anker, "Ik heb een belang", uitbetaling aan ambassadeurs). De API en contracts zijn er.
- **Uit eerdere rapporten blijft open:**
  - WebKit en de handmatige toesteltest (`e2e/MANUAL.md`);
  - een productiemailer;
  - `net_classes` en de hogere drempels H2/H7/H10/H12 (`null` tot de red-teamdag);
  - `first_redemption_hold_ended`;
  - een route voor terugboeken;
  - squadprompt, schadekaart en `survey_due` in `/me/today`;
  - de contractgaten van WP-9 en WP-10 (lijstroutes in beheer, badges, herinneringstijden, `member_ref` voor duels).

## Bekende problemen

- **De sweep draait elke minuut met een eigen `job_run`-rij** (`sweep:YYYY-MM-DDTHH:MM`), dus ongeveer 1440 rijen per dag. De bewaartermijnjob ruimt `job_run` nog niet op.
- **Gewijzigde HMAC voor het instellingsanker.** Ankers die vóór deze wijziging met de e-mailpepper zijn gezet, kloppen niet meer. In dev is dat onschadelijk; in een bestaande database moet het via de herbevestiging (`institution_reconfirm_due`, aanleiding `invoering_hmac`).
- **De e2e met de gepauzeerde `page.clock` moet de klok laten tikken na elke navigatie**, omdat React Query notificaties met `setTimeout(0)` bundelt (`visit()` in `e2e/support/browser.ts`). Zonder dat blijven schermen op "Laden…" staan.
- **Beacons bereiken in de e2e de worker-API niet.** `sendBeacon` loopt niet door `context.route` (WP-8). De store haalt de uitspraak bij terugkeer zelf op, en de hidden-test slaagt daardoor toch.
- **`pnpm seed:demo` vervangt het databasebestand van de dev-server.** Stop daarom eerst `pnpm dev`, of gebruik `POST /dev/reset {"seed":"demo"}`.

### Reproductie

```sh
pnpm install && pnpm verify && pnpm build && pnpm seed:demo && pnpm e2e
pnpm -F @rewarded/web test:pwa
npx vitest run --project tooling tooling/test/integratie-ronde3.test.ts   # de ronde-3-punten
npx playwright test -c e2e/playwright.config.ts e2e/chain/kernflow.spec.ts e2e/chain/focus-real.spec.ts
```
