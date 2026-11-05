# WP-5 — Sociaal

*Bouwrapport, 5 november 2026. Bouwer WP-5. Niet gecommit; dat doet de orchestrator.*

## Wat af is

**Core** (`packages/core/src/`, puur, zonder I/O):

- `squads/`
  - `evaluateSquadDay` voor de squadstreak: een dag slaagt als `max(2, ⌈actief/2⌉)` leden hun doel halen, een joker gebruiken of een tentamendag hebben. Onder 3 actieven bevriest de streak. In de vakantiepauze verandert er niets. Breekt de streak, dan herstelt hij na twee geslaagde squaddagen tot de oude lengte, één keer per breuk.
  - `jokerDayOfWeek`: de joker gaat naar het eerste gemiste doel van de week.
  - `pauseDue` en `countingWindowStart`: de pauze volgt na 7 dagen zonder sessie; vakantiedagen tellen niet mee.
  - `memberCountsOn`: een lid telt vanaf de dag na instappen of terugkeer, en wie vertrekt telt tot en met de vertrekdag.
  - `isLowActivity`, `regroupOpen`, `mergeAllowed` (zelfde vereniging, zelfde `arm_rest`) en `inviteMomentAllowed` (vrije plek, hoogstens één keer per week).
- `challenges/`
  - `participationWeek` volgt architectuur §6.2:
    - teller: ≥ 3 dagen met `goal_met_final`, alleen dagen waarop het lid gekoppeld was, zonder joker of tentamendag, en in prijsweken alleen met een anker van vóór het weekeinde;
    - noemer: `max(ledental, gekoppeld bij weekbegin)`;
    - actief lid en intensiteit: plafond 300, vakantiedagen tellen niet mee in de noemer.
  - Verder: `poolFor`, `mergePools` (minder dan 3 verenigingen gaat samen met de buur), `rankPools` (≥ 15 gekoppeld, daarna intensiteit, daarna gedeelde plaats), `codeCap` (⌊1,1×⌋), `prizeWeeksFor(T)`, `prizePeriodScore`, `meetsThreshold`, `performanceProgress` en `nextSeat`.
- `privacy/`
  - `roundTo` en `suppressCount`: afronden op vijftallen, onderdrukken onder 5.
  - `shareFromRounded`: aandelen uit de afgeronde aantallen.
  - `weeklyCountSeries`: de verschiltest. Een wijziging van 1–4 ten opzichte van de laatst *getoonde* week wordt onderdrukt.
- `belofte/`
  - `offerDueDay`: vroeg op T − 6, laat op A + 1, buiten het experiment op dag 14; wie zich afmeldde krijgt het vroege aanbod.
  - `suggestBelofte`, `belofteEndDay` (vakantiedagen tellen niet), `belofteDayMet`, `belofteSummary`, `reflectionDue`, `ratioToHistory` en `renewalOffered`.
- `referral/`
  - `qualifyingSessions` en `evaluateVesting`: eerst de toesteluitsluiting, dan de deadline, dan beoordeling bij een gedeelde IP of telefoon, wachten op de wachttijd en tot slot het maandplafond.
  - Verder `partyVestDay` (rustperiode) en `referralLive`.

**Migratie `0200_social.sql`**:

- Tabellen: `exam_calendar`, `club`, `club_board_member`, `club_membership`, `squad`, `squad_membership` (trigger: hoogstens 6 open), `squad_day`, `squad_joker`, `squad_merge_request`, `squad_name_report`, `duel`, `challenge`, `challenge_enrollment`, `challenge_score`, `club_week_stat` (weeksnapshot voor het bestuur), `belofte_offer`, `belofte`, `belofte_day`, `card`, `referral` en `reminder_log`.
- Privacyviews `squad_compare_v` (wederzijdse opt-in) en `squad_belofte_v` (`witnesses = squad`).

**API-modules**: alle 40 routes uit contracts-v1 voor squads, invites, duels, clubs (plus bestuur en beheer), leaderboards, challenges (plus beheer), belofte, cards, referral en reminders.

- Uitnodigingsobjecten: squad 7 dagen en 5 gebruikers, duel 48 uur en 1 gebruiker, persoonlijke link. Een uitnodiging waarmee iemand zich registreerde, telt niet dubbel.
- Squads:
  - de armen worden toegewezen bij het aanmaken, met `arm_switched` voor wie later aansluit of samengevoegd wordt;
  - live aanwezigheid zonder minuten; leden in stille modus ontbreken;
  - de vergelijking loopt alleen via de view;
  - uitnodigingsmomenten, hersamenstellen en samenvoegen binnen de tentamenperiode;
  - meldknop met een `NAME_REPORT`-markering en `name_status = reported`;
  - de beheerdersrol gaat over naar het langst zittende lid.
- Duels: `AGE_RESTRICTED` buiten de squad, één duel tegelijk, de uitslag op `goal_met_final` (een tentamendag telt niet) en `pending_review` bij een open markering.
- Verenigingen:
  - code met plafond (daarboven `pending_admin` en `code_cap_reached`), één open koppeling per gebruiker;
  - bestuursdashboard met vier tabbladen uit de weeksnapshot, met afronding, onderdrukking en verschiltest; geen query selecteert een user-id;
  - promotiekit, beheer met overeenkomst, code, `MEMBERS_FIXED`, auditregels en de afhandeling van wachtende koppelingen.
- Ranglijst per poule op deelnamegraad, met intensiteit en gedeelde plaats; in een prijschallenge het gemiddelde van de prijsweken.
- Prestatiechallenges:
  - vaste plaatsen; inschrijven kan alleen vóór de start;
  - geen inschrijving voor het onderzoekscohort in de rustperiode;
  - europlafonds via `prizeCeiling`;
  - de uitslag vraagt de prijssteekproef (`SAMPLE_REQUIRED`) en vier ogen (`FOUR_EYES_REQUIRED`).
- Belofte: aanbod per arm en kalender, `OFFER_NOT_YET`, getuigen, dagresultaat, stoppen, reflectie met het eenmalige hernieuwingsaanbod in de vroege arm, en de inzetvraag alleen voor 18+. Er komt geen enkele grootboekpost aan te pas.
- Kaart:
  - een SVG met XML-escape en strenge headers (CSP `default-src 'none'`, `nosniff`);
  - geen punten erop; de squadnaam alleen als alle leden dat toestaan;
  - geen kaart voor een sessie in afwachting; intrekken kan;
  - verificatiepagina met `noindex`, die verdwijnt als de sessie wordt afgekeurd.
- Referral achter de vlag en vanaf 5 januari: 150 punten per partij als `referral_unvested` via `LedgerService`. Vesting en verval vinden plaats in stap 8; de rustperiode-regel geldt per partij.
- Herinneringsmail: de job `jobs/reminders.ts` draait om 19:30, stuurt hoogstens één mail per dag, niet in de vakantiepauze en achter de vlag. De afmeldlink is ondertekend en werkt zonder inloggen. De tekst noemt geen punten.

**Dagafsluiting** (alleen eigen stappen):

- `04-squad-activity`: pauze, terugkeer, lage activiteit met hersamenstelaanbod binnen de tentamenperiode, archief.
- `05-squad-days`: `squad_day`, streak, joker en herstel, plus het afsluiten en laten verlopen van duels.
- `06-belofte`: dagresultaten, afsluiting met hernieuwingsaanbod, aanbiedingsrijen.
- `08-challenge-scores`: `challenge_score` met rang, `club_week_stat`, de status van prestatiechallenges en de referralvesting.

Alle stappen slaan zichzelf over zonder WP-4/5-tabellen. Ze zijn idempotent per dag.

**Overig**:

- Erasers en exporters voor alle WP-5-tabellen via `PrivacyService`. Een gekoppelde vereniging blijft zonder user-id in de noemer staan.
- `SocialService` via module-augmentatie: `streak`, `jokerAvailable`, `membership`.
- Foutteksten NL en EN in `apps/web/src/i18n/*/errors/{squads,invites,duels,clubs,challenges,leaderboards,belofte,cards,referral,reminders}.json`.

## Verificatie

| Commando | Uitkomst |
|---|---|
| `pnpm -F @rewarded/core test` | 10 bestanden, 381 tests groen; `test/wp5-social.test.ts` heeft er 39 |
| `pnpm -F @rewarded/api test` | 29 bestanden, 305 tests groen |
| `pnpm typecheck` (root: core, contracts, api, web) | groen |
| `npx oxlint --deny-warnings apps/api packages/core` | 0 meldingen |
| `pnpm -F @rewarded/web lint:i18n` | 0 issues |
| `test/wp7-i18n.test.ts` | groen |

Van de API-tests zijn er 51 nieuw, in `apps/api/test/wp5/`. De squad- en dagafsluitingstests draaien op beide drivers.

Wat de acceptatiecriteria in `apps/api/test/wp5/` dekken:

- **Privacytest §6.4** (`privacy.test.ts`):
  - geen user-id, e-mailadres of pseudoniem van anderen op de sociale routes;
  - minuten alleen bij wederzijdse opt-in; leden in stille modus ontbreken; getuigen alleen bij `witnesses = squad`;
  - het bestuur ziet afgeronde weekaggregaten en krijgt `FORBIDDEN` voor andere verenigingen;
  - **verschiltest**: wie één van twintig leden verwijdert, verandert geen enkel getoond getal van deze of vorige week;
  - elke route van de tien modules is gemount.
- **Spec §4.4** (`squad-dayclose.test.ts`): streak, joker, tentamendag, herstel, automatische pauze, bevriezen onder 3, vakantiepauze, terugkeer en idempotentie, plus het hersamenstelaanbod. Daarnaast de kernregels in `wp5-social.test.ts`.
- **Deelnamegraad §6.2**: met de hand nagerekend in `clubs-challenges.test.ts` (drie verenigingen, rang op intensiteit) en in de core-tests (anker, gekoppelde dagen, vertrek, plafond, vakantie).
- **SVG-escape**: `duels-belofte-cards.test.ts`, het scenario "Kaart met kwaadaardige voornaam".

## Tegenspraak in de documenten (en wat ik koos)

1. Architectuur §12.1 geeft WP-5 ook `surveys`, de squadprompt en competentiefeedback. De opdracht geeft ze niet in eigendom, dus ik heb ze niet gebouwd.
2. `MERGE_ARM_MISMATCH` staat in architectuur §8.3 (ronde 2), maar niet in contracts-v1. Ik geef `NOT_ELIGIBLE` met `details.reason = 'merge_arm_mismatch'`.
3. Spec §4.4 zegt "herstelt tot de oude lengte". Ik geef letterlijk de oude lengte terug (`max(huidig, oud)`), zonder de twee hersteldagen erbij op te tellen.
4. Spec §4.13 rekent per instelling (T, A, tentamenperiodes), maar params v1 kent één datum. Voor een squad of vereniging zonder `exam_calendar` val ik terug op T = `goal_bonus.season.last_day` (17 januari), A-einde = `rest_period.last_day` en tentamenperiode = seizoensstart tot en met T. T − 6 komt zo uit op 11 januari, gelijk aan het oude `belofte.early_offer_day`.
5. Architectuur §6.1 laat stap 4–6 in de vakantiepauze overslaan. Stap 4 en 6 doen dat. Stap 5 schrijft wel een `squad_day` met `result = vacation`, zonder dat de streak verandert; daarmee is de reeks volledig.
6. Architectuur §6.4 vraagt `verification_level` bij elk bestuurscijfer, maar de `Metric` in contracts heeft dat veld niet. Ik heb niets toegevoegd. WP-10 moet het niveau als vaste copy tonen, of het contract moet uitgebreid worden.
7. Spec §4.8 toont tijden op de verificatiepagina ("14:02 tot 14:52"), maar het contract heeft `from/to` als `FocusDay`. Ik volg het contract.
8. De referralvesting heeft geen eigen jobplek in §6.1. Ze draait aan het eind van stap 8 (eigendom WP-5), na de gesloten dagen.

## Interface-notities

- **Bevroren lagen niet gewijzigd.** `packages/contracts`, `services/*` en core-typen van anderen zijn ongemoeid gelaten.
- **Module-augmentatie** `Services.social?: SocialService` in `modules/squads/lib/service.ts`. Die is optioneel, dus achterwaarts compatibel. `points` (WP-4) kan er `streak` en `joker_available` voor `/me/today` uit halen, en `auth` (WP-3) `squad` en `club` voor `/me`.
- **De joker staat in `squad_joker`.** `user_day.joker_used` blijft 0 (WP-4 vult het niet), dus `/me/today.joker_available` van WP-4 klopt nu niet. Gebruik `services.social.jokerAvailable`.
- **Gedeelde WP-5-hulpcode** in `modules/squads/lib/` (`social.ts`, `membership.ts`, `dayclose.ts`, `privacy.ts`, `names.ts`, `service.ts`). Andere WP-5-modules importeren die, en ook `clubs/link.ts`, `duels/logic.ts`, `referral/logic.ts`, `belofte/logic.ts` en `challenges/scores.ts`. Alles blijft binnen WP-5; er is geen import van modules van anderen. Gebruikte helpers van WP-3: `jobs/day_close/index.ts#isVacation`, `db/services/audit.ts#auditRef/adminActor`, `db/flags.ts`, `middleware/feature.ts`.
- **Gelezen data van WP-4.**
  - `user_day` via `services.userDays`, of read-only SQL als die niet geïnstalleerd is.
  - `focus_session` read-only via SQL, voor aanwezigheid, sessiedagen, kaarten en de referralsessies; `SessionRepository` heeft daar geen methode voor.
  - `device` voor de toestelvergelijking bij referral.
- **Squad-events.** `squad_became_active`, `squad_day_evaluated`, `streak_recovered` en `squad_regroup_offered` dragen het pseudoniem van de squadbeheerder, zodat ze de armen van de squad meekrijgen. De `FakeEventWriter` eist een pseudoniem.
- **`belofte_renewal_offered`** staat niet in de taxonomie. Het hernieuwingsaanbod staat alleen in `belofte_offer.renewal_offered_at`; het event ontbreekt.
- **`fraud_sample`/`fraud_sample_item` (WP-6).** De uitslagcontrole leest ze defensief. Ontbreken ze, dan volgt `SAMPLE_REQUIRED` (fail closed).

## Niet gedaan

- Beheerroutes voor tentamenkalenders (`/admin/exam-calendars`) en `exam_calendar_id` op een vereniging: die staan niet in contracts-v1. De tabel bestaat, de terugval staat hierboven.
- De bekendmaking van de rustperiode op T − 6 en `rest_notice` (WP-4 levert die in `/me/today`). Ook ontbreekt de melding vóór het aansluiten bij een rustsquad voor het uitbreidingscohort: de invite-preview heeft daar geen veld voor.
- De squadprompt (`squad_prompt` in `/me/today`), vragenlijsten en competentiefeedback: niet in mijn eigendom.
- De aprilchallenge is een gewone `club_prize`-challenge in A; er is nog geen filter op verenigingen van het onderzoekscohort.
- `COVERAGE_INSUFFICIENT` bij challenges: er is geen budgetservice in de interfaces, de dekking ligt bij `PrizeService` (WP-6).
- `sample_status` in het tabblad Kwaliteit staat vast op `none`.

## Bekende problemen

- De naamfilter is een korte woordenlijst. Moderatie loopt verder via de meldknop en de wachtrij van WP-6.
- WP-4's `PointsContext` gebruikt de squadarmen direct na het aansluiten. WP-5 logt `arm_switched` zoals de spec vraagt, maar "vanaf de eerstvolgende maandag" wordt in het grootboek nog niet afgedwongen (eigendom WP-4/WP-3).
- Een eraser schrijft `left_day` met SQLite `date('now')` in plaats van de platformklok, omdat de eraser-signatuur geen klok meegeeft.
- Bestuurscijfers en de ranglijst komen uit de nachtelijke snapshot. Na een besluit over een markering zijn ze pas na de volgende dagafsluiting bijgewerkt.
- Rule 3 maakt een kleine wijziging zichtbaar als "minder dan 5 veranderd" (`suppressed`), maar niet wie er veranderde. De verschiltest controleert dat geen getoond getal verandert.
