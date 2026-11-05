# WP-4 — Sessies en punten

*Bouwrapport, 5 november 2026. Bouwer WP-4. Niet gecommit; dat doet de orchestrator. Deze ronde gaat verder op de tussenstand in commit `bdaf7fe`. Daarin stonden al de core-modules, het sessieprotocol, het grootboek en de migraties. Nieuw in deze ronde zijn de routes voor punten, catalogus, verzilvering en telefoon, de jobstappen, de i18n-bestanden en de acceptatietests.*

## Wat af is

- **Core** (`packages/core/src/{session,ledger,goals,catalog}`):
  - **Sessie**: de client-toestandsmachine als pure reducer, zonder pauzetoestand. `evaluateSession` volgt de gatregels, afbreekcodes en randgevallen van spec §4.1 en is idempotent en monotoon in de tijd. De retry-regels staan in `retry.ts` (architectuur §4.7).
  - **Grootboek**: de boekingsregels als data (tabel 5.1), `reconcileDay` met daglimiet, nachtregel, tentamendag, rustperiode en arm A/B, en `redeemSplit` (hoogstens de helft uit referral).
  - **Doelen**: dagdoel, overmoedrem, doelvoorstel, tentamendagen, seizoen, weekbudget van arm B, `earnArmFor` en de persoonlijke arm voor 16–17 jaar en afmelders.
  - **Catalogus**: puntenprijs, europlafonds, soorten per niveau (geen geld, geen open tegoed), dekking, gespreide vrijgave en dekkingsalarm.
- **Sessies** (`modules/sessions`):
  - apparaten registreren;
  - start met `Idempotency-Key`, hervatten op hetzelfde toestel met een nieuwe nonce, en `second_session` bij een ander toestel;
  - heartbeats met de nonce-keten, het antwoord uit de cache bij een herhaalde `seq` en een rate limit op nieuwe `seq`;
  - het beacon-pad met het CSRF-token in de body;
  - end en stop met de opgeslagen uitspraak, en `SESSION_CLOSED` met `details.verdict`;
  - de sweep, "Klopt dit niet?", `restore_session` en outages.
  - Bij de uitspraak worden H1, H3 en H4 gemarkeerd. `ACCOUNT_BLOCKED` geldt bij de start.
- **Punten** (`modules/points`):
  - `SqlLedgerService` als dubbel boekhouden met unieke sleutels, waarbij dezelfde sleutel met andere inhoud `KEY_CONFLICT` geeft. Saldi zijn afgeleid. Verder `reconcileDay` met de `rev`-regel, de weektoekenning van arm B en `expireAll`;
  - `SqlUserDayRepository`;
  - de routes `GET /points/balance` (drie delen), `GET /points/ledger`, `PUT /me/daily-goal` (overmoedrem, geldt vanaf de volgende focusdag), `PUT`/`DELETE /me/exam-days/:day` (hoogstens 3 per week, `PERIOD_LOCKED`) en `GET /me/today`.
- **Catalogus** (`modules/catalog`):
  - partners en budgetten: geboekt alleen met een documentverwijzing, de pool per budget, en annuleren alleen binnen de vrije ruimte;
  - het budgetoverzicht;
  - items: soortcontrole, plafond van €5 en een allocatie `kostprijs × voorraad` die binnen het vrije budget moet vallen;
  - CSV-import, publiceren (verklaring en vinkje, `CASH_CHECK_REQUIRED`) en een weekvrijgave per dag met een gereserveerd ankerdeel;
  - `GET /catalog` met de voorraad van vandaag, de volgende vrijgave en per week `released` naast `eligible_users`.
- **Verzilveringen** (`modules/redemptions`): één transactie (`BEGIN IMMEDIATE`). De controles lopen in deze volgorde:
  1. actief account;
  2. inverdienperiode uit `counted_min` van finale sessies (`EARN_IN_REQUIRED`);
  3. wachttijd van 7 dagen (`FIRST_REDEEM_HOLD`);
  4. telefoon (`PHONE_NOT_VERIFIED`);
  5. week (`WEEKLY_CAP`, ook als unieke index);
  6. maand (≤ €15);
  7. voucher uit de eigen pool, met ankervouchers alleen voor accounts met een instellingsanker (`OUT_OF_STOCK`);
  8. saldo en referral-aandeel.

  Daarna volgen de journaalpost, de reservering, H11, het event en de code per mail. Een weigering schrijft alleen `redemption_blocked`. Verder: `GET /redemptions`, "Werkt niet" (ticket als de tabel van WP-6 bestaat), een vervangende code door de beheerder (zonder journaalpost) en `refundRedemption` (`redeem_refund`, die de week weer vrijmaakt).
- **Telefoon** (`modules/phone`): een nummertypecontrole via `SmsSender.lookupLineType` (alleen mobiel), alleen een HMAC van het nummer, één nummer per account (`PHONE_IN_USE`), een sms-code met vijf pogingen en een verlooptijd, en H8 tegen `blocked_phone_hash` als die tabel bestaat.
- **Jobs**:
  - dagafsluiting stap 1 (sweep; faalt als er nog een sessie van D loopt), stap 2 (`reconcileDay(day_close)` per gebruiker, `daily_goal_met`/`daily_goal_missed` alleen bij de eerste sluiting) en stap 10 (de drie controles van §5.5 naar `ledger_alert`);
  - `jobs/week_open.ts`: dagelijks om 04:00 de vrijgave, en op maandag de toekenning voor arm B;
  - `jobs/week_close/coverage-alarm.ts`: per pool het aantal gerechtigden × 1 tegenover de vrijgave van de week, opgeslagen in `coverage_alert`.
- **Privacy**: erasers en exporters voor `points`, `sessions`, `redemptions` en `phone` (§10.7). Eerst zet een `expire` de saldi op nul, daarna wordt `ledger_account_owner` geleegd. Het journaal blijft ongewijzigd.
- **i18n**: `apps/web/src/i18n/{nl,en}/errors/{sessions,points,catalog,redemptions,phone}.json`, met een test die per code de sleutel controleert.
- **Migraties** `0100_sessions`, `0110_ledger`, `0120_catalog` (uit de tussenstand, ongewijzigd). Ze bevatten de append-only-triggers, de daglimiet als trigger, de `CHECK` op soort, de onveranderlijke puntenprijs en de unieke index per week.

## Verificatie

- **`pnpm -F @rewarded/core test`**: 8 bestanden, 302 tests geslaagd. Daarbij:
  - `wp4-session` (tabellen §4.1, machine, retry);
  - `wp4-ledger` (regels §4.2/§5.1, plus fast-check: nul-som, daglimiet, idempotent, convergent, A=B-maximum);
  - `wp4-goals-catalog`.
- **WP-4-bestanden in `apps/api/test`**: 8 bestanden, 91 tests geslaagd. Ze draaien met `npx vitest run --project api` op `wp4-*.test.ts` en `test/services`:
  - **`wp4-sessions`** (35 tests): alle rijen van de §4.1-tabellen, inclusief de randgevallen, en de volledige herhalingstabel §4.7 en §4.8;
  - **`wp4-redemptions`**: de flow `EARN_IN_REQUIRED` → `FIRST_REDEEM_HOLD` → `PHONE_NOT_VERIFIED` → voucher → `WEEKLY_CAP` → refund → opnieuw, met maandplafond, anker, 18+, idempotentie, vervanging en de dekking van de catalogus. **50 gelijktijdige verzilveringen** (10 gebruikers × 5, voorraad 7) leveren precies 7 vouchers op, hoogstens één per gebruiker per week. Het journaal sluit op nul en de nachtcontroles zijn leeg;
  - **`wp4-points`**: routes, dagafsluiting met 03:55, arm B lapse, nacht en tentamendag, de sweep in stap 1, een alert in stap 10, de weekopening, de vrijgave en het dekkingsalarm;
  - **`wp4-ledger-sql`**: afkeuring op een afgetopte dag (reverse plus `earn_topup`), vrijgave, en **fast-check op het echte SQL-grootboek** (40 runs, vaste seed). Gecontroleerd worden idempotentie, convergentie tegen een herberekening vanaf nul, nul-som en de daglimiet;
  - **`wp4-drivers`**: keten en verwijdering op `better-sqlite3` en `node:sqlite`;
  - **`wp4-i18n`**.
- **`pnpm -F @rewarded/api test`**: 23 bestanden, 254 tests geslaagd. **`pnpm typecheck`**: geslaagd. **`pnpm test`** (hele repo): 44 bestanden, 739 tests geslaagd. Dit is de laatste run, nadat de bestanden van WP-5 die tussendoor ontbraken er stonden.
- `npx oxlint --deny-warnings apps/api packages/core`: exit 0. `pnpm -F @rewarded/web lint:i18n`: 0 meldingen.

## Niet gedaan

- **Rustperiode en seizoen per tentamenkalender**: `core/calendar` (WP-1) en `exam_calendar` (WP-5) bestaan nog niet. Het seizoen, de bonusstop, de pool `pilot`/`research` en de rustperiode volgen daarom de globale parameters (`goal_bonus.season`, `rest_period`). Ook de squadregel voor het uitbreidingscohort in een rustsquad ontbreekt nog.
- **`PERIOD_LOCKED` bij restore** (de uitslag van een challenge is definitief) wacht op WP-5.
- **`SCHEDULE_LOCKED`**: deze code staat niet in contracts (zie de interface-notities). De vrijgaveroute voegt alleen voorraad toe, dus verlagen kan via de API niet. `scheduleChangeAllowed` in core is klaar.
- **Event `first_redemption_hold_ended`**: wordt niet geschreven.
- **Route voor terugboeken** ("punten terug"): die bestaat niet in contracts. `refundRedemption` is er als functie voor de supportflow van WP-6.
- **Squadstreak, squadprompt, schadekaart en vragenlijst in `/me/today`**: die komen van WP-5 en WP-6. `streak` is nu `null`.

## Interface-notities

- **Contracts** (`packages/contracts/src/catalog.ts`), drie optionele velden, achterwaarts compatibel:
  - `BudgetCreateRequest.pool` en `Budget.pool` (`BudgetPool`): zonder pool kon een eigen budget niet aan een van de drie posten van spec §4.3 hangen;
  - `CatalogResponse.week = { week, released, eligible_users }` (`CatalogWeek`): voor de voorraad naast de gerechtigden (spec §3.4, founder J10, architectuur §5.3).
- **Core-typen**: `ReconcileDayInput.dayClosed?` (optioneel, uit de tussenstand). Arm B laat een gemist doel pas na de sluiting vervallen.
- **`apps/api/package.json`**:
  - script `test` (WP-3 noteert hetzelfde script; het staat er één keer);
  - devDependency `fast-check@4.3.0` via `pnpm add --filter`. Daardoor is `pnpm-lock.yaml` gewijzigd.
- **Services**: via module-augmentatie in `modules/points/services.ts` komen erbij `ledger`, `userDays` (alias `userDay`), `sessions` en `pointsContext`. `installWp4Services(deps)` zet ze één keer per `Services`-object en registreert de erasers en exporters. `pointsContext.arms` is vervangbaar; standaard gebruikt het `ExperimentService.armsFor`, met de squad uit `squad_membership` als die tabel bestaat, en arm B alleen als de vlag `arm_b` aan staat.
- **Sweep-job**: `modules/sessions/sweep.ts` exporteert `job`, maar `jobs/sweep.ts` ligt niet in mijn paden. De eigenaar van `jobs/` zet daar `export { job } from '../modules/sessions/sweep.ts';`. Tot dan sluiten stap 1, `GET /sessions/active` en elke sessieroute de sessies.
- **Weekafsluiting**: er is nog geen orchestrator `jobs/week_close/index.ts` (WP-6). Mijn stap exporteert `step: { name, owner, run({ deps, now, week? }) }`.
- **WP-4-stappen zonder eigen tabellen**: ze slaan stil over als de WP-4-tabellen ontbreken. Testharnassen van andere pakketten migreren alleen hun eigen reeks, en de WP-3-test van de dagafsluiting faalde daardoor.
- **Lokale bodyschema's**: `sessions.start` en `admin.rewards.publish` gebruiken een eigen bodyschema zonder refine of literal, zodat de contractfoutcodes `INVALID_DURATION` en `CASH_CHECK_REQUIRED` terugkomen in plaats van `VALIDATION_FAILED`. Het wire-formaat blijft gelijk.
- **Afhankelijkheden van tabellen van WP-6** (met terugval als ze ontbreken): `support_ticket` ("Werkt niet"), `blocked_phone_hash` (H8) en `prize` (maandplafond).
- **Systeemevent zonder pseudonym**: `SqlEventWriter` en `FakeEventWriter` weigeren een serverevent zonder pseudonym. Daardoor wordt `coverage_alert` alleen in de tabel `coverage_alert` vastgelegd, niet in het eventlog. WP-3 moet systeemevents toestaan.
- **Interne koppelingen binnen WP-4**: redemptions gebruikt `points/index.ts#hasRedemptionInWeek` en `catalog/stock.ts`, sessions gebruikt `points/ledger.ts#earnInMinutes`. Andere pakketten gebruiken alleen de services.

## Tegenspraak in de documenten

1. **Sessie om 03:55 (architectuur §11)**: de e2e-tabel en §6.1 verwachten "doel gehaald, geen goal_lapse". Een start om 03:55 valt echter onder de nachtregel (01:00–04:00, spec §4.2), waardoor in arm B de 20 vervallen als het doel alleen zo gehaald is. De spec gaat voor. Getest is arm A: doel gehaald, geen bonus, geen lapse.
2. **Tentamendagen**: architectuur §12.1 noemt `modules/exam_days`, maar contracts zetten de routes in `points`. Contracts aangehouden.
3. **Dekkingsalarm**: architectuur §12.1 noemt `jobs/week_close.ts`, de opdracht een eigen bestand in `jobs/week_close/`. De opdracht aangehouden.
4. **Catalogusroute**: architectuur §5.3 noemt `GET /rewards`, §8.2 en contracts `GET /catalog`. `GET /catalog` aangehouden.
5. **Ronde-2-foutcodes**: architectuur §5.3 noemt `SCHEDULE_LOCKED`, maar contracts missen alle codes uit de 409-rij "na ronde 2" (`SCHEDULE_LOCKED`, `ALREADY_EXITED`, `MERGE_ARM_MISMATCH`, `CALENDAR_FIXED`, `DOMAIN_MISMATCH`, `EXPANSION_CAP_REACHED`). Een toevoeging breekt de §8.3-test van WP-2, dus ik heb niets toegevoegd. WP-2 moet ze toevoegen.
6. **Weekbudget arm B in de eerste seizoensweek**: het seizoen begint op woensdag 2 december. Volgens "20 × resterende dagen" krijgt arm B in week 49 100 punten en geen 140; zo gebouwd.
7. **Moment van de wachttijd**: architectuur §5.2 laat de dagafsluiting `earn_in_reached_at` zetten. Hier gebeurt dat al bij `reconcileDay`, dus bij het sessie-einde dat de 300 minuten haalt. Dat ligt dichter bij spec §4.2 ("7 dagen vanaf het halen van de inverdienperiode"). Stap 2 is het vangnet.
8. **Geldigheid sms-code**: geen enkel document noemt een termijn. Ik koos 15 minuten, gelijk aan de inlogcode (§3.1).

## Bekende problemen

- Tijdens de bouw faalden de volledige API-suite en de typecheck een tijd door onaffe WP-5-bestanden (`modules/invites` importeerde nog niet bestaande bestanden). Bij de laatste run was dat opgelost. Andere pakketten werken nog in `apps/api`, dus een volgende run kan door hun tussenstanden weer rood zijn.
- De gelijktijdigheidstest draait in één Node-proces. Daar zijn de synchrone transacties per verzoek al geserialiseerd. Voor meerdere processen leunt de correctheid op `BEGIN IMMEDIATE`, de unieke index per week en de voorwaardelijke voucherupdate. Dat is niet als multiprocestest gedraaid.
- Het budgetoverzicht rekent de waarde per punt uit de gepubliceerde prijslijst (Σ kostprijs / Σ puntenprijs), omdat `budgetwaarde per punt` (teamaanname) geen parameter is.
- `eligible_users` en de pool gebruiken de globale bonusstop, niet de kalender per instelling.
