# WP-6 — Fraude, beheer, steekproef en privacy

*Bouwrapport, 5 november 2026. Bouwer WP-6. Niet gecommit; dat doet de orchestrator. De opdracht noemde het pakket "Fraude, beheer, trekkingen en privacy". Het productplan gaat voor: de trekkingsmodule wordt niet gebouwd (§0c.3, §3, §4 en §7, "valt eruit en blijft eruit"). WP-6 bouwt in plaats daarvan de steekproef, de schadesignalen en het instellingsanker (productplan §7; architectuur §12.1 en §12.5).*

## Wat af is

**Core** (`packages/core/src/fraud/`), alleen pure functies:

- **H1–H12 met netklassen** (`heuristics.ts`).
  - Per sessie: H1, H3, H4, H8 en H11.
  - In batch: H2 (schuivend venster van 24 uur), H5, H6, H7, H9, H10 en H12. H12 meet de overlap over de hele sessieduur met een sweep, per (IP-hash, UA-klasse).
  - Campus en mobiel CGNAT worden nooit overgeslagen. Ze tellen mee met een eigen, hogere drempel.
  - Staat die drempel nog op `null` (tot de red-teamdag), dan wordt de groep als `skipped` gerapporteerd en gelogd. `fraudReleaseBlockers()` noemt de vier ontbrekende drempels.
  - Elke bevinding heeft een `dedupKey`, zodat een job die opnieuw draait geen dubbele markering maakt.
- **Schadesignalen** (`harm.ts`): S1–S3 met een afkoeltijd van 14 dagen, de absolute schadegrens per code, de stopregel voor arm B (criterium 1 met minimaal 40 per arm en twee weken, criterium 2 als verhouding) en de bewakingsregel voor de rustarm.
- **Steekproef** (`sample.ts`): gestratificeerd met de grootste-restmethode en minstens één per stratum met ≥ 5 actieven. Het uitbreidingscohort is een eigen stratum. De volgorde komt uit `HMAC-SHA256(seed, soort|sleutel|stratum|gebruiker)`. Daarnaast de prijssteekproef van 20 en de ambassadeurssteekproef van 5.
- **SHA-256 en HMAC in pure TypeScript** (`sha256.ts`). Core mag geen platform-crypto gebruiken. De implementatie is getest tegen de FIPS- en RFC 4231-vectoren en tegen `node:crypto`.
- **Schatting** (`estimate.ts`): gewogen naar strata, met een Wilson-interval op de effectieve n. De bovengrens is de go/no-go-maat en de schatting heet "ondergrens".
- **Beoordelingsregels** (`review.ts`): vaste redencodes per besluit en per steekproefoordeel, de beroepstermijn, wie een beroep mag beslissen (anders een derde persoon), de melding van een belang en de criteria van voorregistratie §7.2.
- **Bewaartermijnen** (`retention.ts`): de tabel van architectuur §10.6 als data, met `reduceEvidence`.

**Migraties**:

- `0080_fraud_queue.sql` maakt `fraud_flag` (met `dedup_key` en CHECKs voor redencode en vier ogen) en `appeal`.
- `0300_fraud_admin_privacy.sql` maakt:
  - `fraud_flag_session` (sessie en/of account);
  - `blocked_phone_hash` en `blocked_institution_hash`;
  - `user.institution_email_hash` met een unieke index, `institution_reconfirm_due`, `institution_domain` en `institution_verification`;
  - `fraud_sample` en `fraud_sample_item` (met belang, contactkanaal en adresverschil);
  - `prize`, met plafonds als CHECK, de 18+-regel als CHECK en `drawn` alleen als lege plek;
  - `prize_delivery_contact`, `harm_signal` en `harm_week`;
  - `ambassador` en `ambassador_payout`;
  - `support_ticket`;
  - `event_week_aggregate` en `research_aggregate`;
  - een benoemde bewaarregel voor het auditlog (`audit_retention`).

**Services**:

- `SqlFlagService`: raise is idempotent per sleutel, alleen een beheerder beslist, een blokkade gaat via vier ogen, en `closeForDeletedAccount` / `closeForUser` sluiten markeringen van verwijderde accounts.
- `SqlPrizeService`: plafonds en soort, winnaar voordragen met een automatische steekproef van 20 bij een collectieve prijs, leeftijdscontrole, en verificatie met de zes controles van spec §4.7. Levering mag pas 14 dagen later (`deliver_after`, `markDelivered`).
- Het register van `PrivacyService` blijft bestaan. Daarin staan de erasers en exporters van WP-6, en `deleteAccount` / `exportAccount` gebruiken het.
- `installWp6Services` vervangt alleen de standaard-fakes, dus tests met een eigen fake blijven werken.

**Routes**:

- **fraud**: `POST /appeals`, `POST /me/institution-email/start` en `…/confirm` (anker, herbevestiging, en steekproefcontact met HMAC-vergelijking), de wachtrij (`GET /admin/flags` met een auditregel per inzage), `POST /admin/flags/:id/decision` (redencode uit de vaste lijst; afkeuren boekt via `reconcileDay`), `POST /admin/blocks/:id/confirm` (andere beheerder; account geblokkeerd, sessies weg, hashes 2 jaar bewaard), de beroepen (`SAME_REVIEWER`, `NO_ELIGIBLE_REVIEWER`, `waiting_for_third`; een gegrond beroep geeft de punten terug en heft de blokkade op), `GET /admin/first-redemptions`, en `GET /admin/samples/current` met `POST …/judgement` (verdacht of frauduleus opent een `SAMPLE`-markering).
- **admin**:
  - MFA (enroll en verify);
  - gebruikers zoeken en bekijken (alleen met reden en auditregel), teamvlag;
  - prijzen: verify, age-check (alleen de uitkomst, het documentsoort wordt niet bewaard) en delivery-contact;
  - vakantiepauze (`PERIOD_LOCKED` voor gesloten dagen);
  - experimenten;
  - feature-flags: `draws` geeft `FEATURE_DISABLED`; `arm_b` en het aanzetten van `rest_period` vragen vier ogen, het uitzetten van `rest_period` niet;
  - welzijnssamenvatting, stop van arm B, ambassadeurs en het auditlog.
- **privacy**: `GET /me/export`, `DELETE /me` (`CONFIRMATION_REQUIRED`) en `DELETE /admin/users/:id` met vier ogen.
- **support**: lijst, extern ticket (alleen label en datum) en PATCH. Het label "welzijn" ziet alleen `assigned_to`, en het label maakt een S4-signaal aan.
- **kpi**: `GET /admin/kpi/:query` met 23 opgeslagen SQL-query's uit spec §7.2. Elke query heeft ook een `_clean`-variant zonder accounts die de steekproef als verdacht markeerde. Teamaccounts tellen nooit mee en afgekeurde sessies ook niet. Daarnaast is er `fraud_estimate`, per week en cumulatief, in twee reeksen.
- **draws**: registreert geen enkele route.

**Jobs**:

- Dagafsluiting stap 7 (`07-fraud-batch.ts`): H2, H5, H6, H7, H12 over de week tot nu, en S1–S3.
- Stap 11 (`11-retention.ts`): elke regel van §10.6, plus het herbevestigen en laten vervallen van oude instellingsankers.
- Weekafsluiting: orchestrator `week_close/index.ts` en stap `fraud-weekly.ts`. Die draait H9 en H12 over de week, trekt de steekproef van 30 en rekent de schade-evaluatie uit. De bewakingsregel zet `rest_period` uit, met een auditregel.
- `hourly.ts`: H10.
- Steekproefcontrole: `apps/api/src/modules/fraud/cli/sample-verify.ts` rekent elke opgeslagen weekelijkse steekproef na.

**i18n en DPIA**:

- `apps/web/src/i18n/{nl,en}/errors/{fraud,admin,privacy}.json`, plus lege bestanden voor `kpi`, `support` en `draws`, omdat die modules geen codes hebben.
- `docs/dpia/verwerkingen.md` §5 beschrijft de stand van de bouw per verwerking, met de afwijkingen.
- `docs/dpia/sleutelbeheer.md` is nieuw (architectuur §10.9).

## Verificatie

- `pnpm -F @rewarded/core test`: 10 bestanden, 381 tests geslaagd. Daarvan staan er 40 in `wp6-fraud.test.ts`: sha256/HMAC-vectoren, H1–H12 met UB-NAT, mobiel adres, hotspot, vier accounts en zes profielen (tegelijk en gespreid), S1–S3, stopregel, bewakingsregel, schadegrens, steekproef met testvector (snapshot), schatting, beoordelingsregels en bewaartermijnen.
- `pnpm -F @rewarded/api test`: 38 bestanden, 344 tests geslaagd. Daarvan 39 in de `wp6-*`-bestanden:
  - **wp6-no-negative-decision**: elke route buiten `/admin`, aangeroepen als de eigenaar, als een ander en zonder sessie, met voorbeeld- en "besluit"-bodies (meer dan 300 aanroepen), boekt niets negatiefs. Dagafsluiting, weekafsluiting en uurjob markeren alleen. Een statische controle laat zien dat de besluitcode alleen vanuit `/admin`-routes bereikbaar is.
  - **wp6-heuristics**: UB-NAT en mobiel adres markeren niet bij H2, H7, H10 en H12, zowel met drempel `null` als met testdrempels. Hotspot, vier accounts, H10 en zes laptopprofielen markeren wel. Opnieuw draaien maakt geen extra markeringen.
  - **wp6-privacy**: na `DELETE /me` vindt een scan over alle tabellen en kolommen het oude id, e-mailadres en pseudoniem niet meer, en in `event` ook het oude squad-id niet. Het journaal sluit nog op nul, de props zijn niet meer te koppelen, H8 houdt het nummer, en het verwijderen door een beheerder vraagt vier ogen.
  - **wp6-retention**: per regel na 1, 31, 91 en 731 dagen; een lopend beroep houdt het bewijs vast; aggregatie na 15 juni 2027; tweede run idempotent; stap 11 in de dagafsluiting.
  - **wp6-queue**, **wp6-sample**, **wp6-admin**, **wp6-i18n** en **wp6-drivers** (`better-sqlite3` en `node:sqlite`).
- `pnpm -F @rewarded/core typecheck`, `pnpm -F @rewarded/api typecheck` en `pnpm -F @rewarded/contracts typecheck` geslaagd. `pnpm -F @rewarded/contracts test`: 33 geslaagd.
- `npx oxlint --deny-warnings apps/api packages/core packages/contracts`: 0 meldingen. `pnpm -F @rewarded/web lint:i18n`: 0 meldingen.
- `pnpm typecheck` (hele repo) faalt alleen in `apps/web/test/wp9-*.test.tsx` van WP-9 (`handlers`, `idempotencyKey`). Dat zijn niet mijn bestanden.
- Handmatig gecontroleerd:
  - de dev-server start;
  - onder gewone Node laadt `loadJobs()` `day_close`, `hourly`, `week_close` en `week_open`;
  - het manifest van de weekafsluiting is `coverage-alarm` en `fraud-weekly`;
  - de stappen 7 en 11 hebben eigenaar WP-6;
  - `sample-verify.ts` draait op een gemigreerde lege database.

## Niet gedaan

- **Trekkingen** (commit-reveal, beacon, testvectoren, `draw-verify`): bewust niet gebouwd, omdat het productplan voorgaat (zie hieronder). `modules/draws` registreert geen route. `packages/core/src/draws/index.ts` blijft een lege stub, omdat `packages/core/src/index.ts` (niet van mij) hem nog exporteert. De integratiegolf verwijdert beide, samen met `platform/beacon.ts` en de regel `draws` in `test/modules.test.ts`.
- **Routes en foutcodes van ronde 3 die niet in contracts v1 staan**:
  - routes: `POST /me/institution-email/reconfirm`, `POST /admin/samples/:id/items/:item/interest`, `POST /admin/ambassadors/:id/payouts` en `POST /admin/clubs/:id/april-members` (van WP-5);
  - foutcodes: `ADDRESS_MISMATCH`, `AMBASSADOR_SAMPLE_REQUIRED`, `ANCHOR_NOT_UNIQUE` en `INTEREST_DECLARED`;
  - events: `institution_email_rejected`, `institution_email_reconfirmed`, `sample_interest_declared`, `sample_contact_reconfirmed` en `rest_period_flag_off`.

  De domeinlogica en de tests zijn er wel (`declareInterest`, `ambassadorPayout`, herbevestiging via start/confirm). WP-2 moet de routes en codes toevoegen.
- **Criterium 1 van de stopregel op echte antwoorden**: de functie bestaat, maar `survey_response` (WP-5) bestaat nog niet, dus de weekafsluiting toetst nu alleen criterium 2.
- **(c) met terugval op N en herkansingsdagen in (d)**: `exam_calendar` van WP-5 heeft geen `a_resit_days`, en (c) gebruikt alleen 1–14 februari.
- **Geen route voor**: een prijs als geleverd markeren (alleen de functie `markDelivered`), een beroep tegen een blokkade (een geblokkeerde student kan niet inloggen; support legt het vast met `submitAppeal`), het beheren van de domeinlijst, en een contactverzoek. Bij een account met anker wordt dat contactverzoek automatisch gezet bij de trekking.
- **Jobbestand `jobs/retention.ts`** voor de dev-route `retention`: valt niet onder mijn eigendom. De opschoning draait als dagafsluitingsstap 11.

## Interface-notities

- **`packages/contracts/src/common.ts`**: `FlagCode` kreeg `'H12'`, achterwaarts compatibel. Zonder die waarde kon geen H12-markering het contract `AdminFlag` halen, en H12 is Must vóór 4 januari.
- **Migratie 0300 raakt tabellen van WP-3**:
  - `ALTER TABLE user ADD COLUMN institution_email_hash` en `institution_reconfirm_due`. Architectuur §12.5 legt dit bij WP-6.
  - De trigger `audit_log_no_delete` uit 0002 is vervangen door een benoemde regel: verwijderen mag alleen onder de afkapdatum in `audit_retention`, die stap 11 op nu − 2 jaar zet. Zonder datum blijft verwijderen geweigerd. 0002 zei dat hiervoor een migratie nodig was.
- **`prize.user_id`** is een gegenereerde kolom (= `winner_user_id`), zodat de maandplafondquery van WP-4 (`prize.user_id`, `month_key`) werkt.
- **Uitbreidingen op de services** (module-augmentatie in `modules/fraud/lib/install.ts`):
  - `Services.fraudRules?` (drempels voor tests en de red-teamdag) en `Services.sampleSeed?`;
  - `SqlFlagService.raise` accepteert ook `userIds` en `dedupKey`.
- **Seed van de steekproef**: zonder `services.sampleSeed` wordt de experimentseed structureel uit `SqlExperimentService` gelezen. WP-3 zou die seed moeten exporteren; zonder seed wordt een seed afgeleid van `pepper_audit` (versie `derived`).
- **`pepper_inst` ontbreekt** in de Hasher van WP-3. `institution_email_hash` gebruikt nu `pepper_email` met de scheider `inst|`. Dat moet vóór 4 januari om, en staat in `sleutelbeheer.md`.
- **Weekafsluiting**: WP-4 liet de orchestrator aan WP-6. Ik heb `jobs/week_close/index.ts` gebouwd, hoewel de opdracht alleen "eigen bestand voor H9" noemde. Stappen zijn bestanden met `export const step: WeekCloseStep`, op volgorde van bestandsnaam. Draait de dagafsluiting van zondag nog niet als `done`, dan wordt de job opnieuw geprobeerd.
- **Gebruik door andere pakketten**: `storeHarmSignal` (S4 en elk ander signaal), `submitAppeal`, `deleteAccount` en `exportAccount`, `runKpi` en `KPI_NAMES` (voor het KPI-overzicht van WP-10), en de redencodes `FLAG_REASON_CODES` / `SAMPLE_REASON_CODES` in core. Voor de uitleg aan de student is een i18n-namespace nodig (WP-9/10).

## Tegenspraak in de documenten

1. **Trekkingen**: de opdracht vraagt commit-reveal, een beacon, testvectoren en `draw-verify`. Het productplan (§0c.3, §3, §4, §7), spec §3.9 en §8 en architectuur §7 en §12.5 zeggen "niet bouwen" en "restanten verdwijnen". Het productplan gaat voor. De reproduceerbaarheid en de testvectoren zijn er wel, voor de steekproef (HMAC-trekking, snapshot-vector, `sample-verify.ts`).
2. **Acceptatie**: de opdracht noemt H2, H7 en H10, architectuur §12.1 ook H12 en de red-teamscenario's. Alle vijf scenario's zijn getest.
3. **Stopregel tegenover bewakingsregel**: architectuur §6.1 laat de job de vlag `rest_period` zelf uitzetten. Voor arm B zegt spec §6.6 alleen "arm B stopt", terwijl §8.2 vier ogen vraagt. De job telt en rapporteert de stopregel (auditregel `stop_rule_triggered`) en zet de bewakingsregel automatisch door.
4. **Interpretaties waar de documenten geen getal of definitie geven**:
   - H6 "zonder onderbreking": het venster 01:00–06:00 is gedekt, met pauzes van hoogstens `end_grace_min` (10 minuten).
   - Hogere drempel bij H7: het minimaal aantal leden.
   - H10: de gedeelde klasse geldt als een van de top-3 IP-hashes gedeeld is.
   - H12: `desktop` telt overal met de basisdrempel (zes profielen op eduroam), andere UA-klassen op campus en CGNAT met de gedeelde drempel. Mobiel CGNAT wordt bij H12 behandeld als campus.
   - Vier ogen bij prijsverificatie: de leeftijdscontroleur is niet de verificateur.
5. **Parameters die params v1 (WP-1) mist**: H12 (3 accounts, 40 minuten, 2 dagen), schadegrens 2%, verhouding 2×, welzijnscriterium 0,5 SD / 2 weken / 40 per arm, ambassadeurssteekproef 5. Ze staan als WP-6-standaard met bron in `core/fraud/rules.ts` en horen in een volgende parameterversie.
6. **Bewaartermijn van `focus_session.device_id` en `ua_class`**: architectuur §10.6 wil ze na 30 dagen op NULL, maar WP-4 maakte beide kolommen NOT NULL. `ua_class` gaat naar `other`, `device_id` blijft staan.
7. **KPI-dagen**: de query's gebruiken de UTC-datum van `server_at`, omdat events geen focusdag dragen. Rond middernacht kan dat een dag schelen ten opzichte van de focusdag.

## Bekende problemen

- **`h2/h7/h10/h12_shared_threshold` zijn `null`**: groepen op campus en CGNAT worden tot de red-teamdag niet gemarkeerd, alleen gelogd (`fraud_shared_threshold_missing`). Dat blokkeert de release (`fraudReleaseBlockers`).
- **`net_classes` is leeg** (open vraag 17), dus in productie is alles nu `other`.
- **Steekproef na verwijdering**: na een `DELETE /me` reproduceert `verifyStoredSample` een steekproef van vóór de verwijdering niet meer exact, omdat de kandidaten uit de sessies komen. Het script meldt dat.
- **Geen `prize_awarded`-event bij een collectieve prijs**: een event heeft een pseudonym nodig. De kosten-KPI leest daarom de tabel `prize`.
- **README-tabel van de migraties**: `apps/api/migrations/README.md` (WP-0/WP-3) noemt in de 0300-reeks nog de `draw_*`-tabellen.
- **Typecheck van de web-app**: `pnpm typecheck` van de hele repo faalt op dit moment in de WP-9-tests van de web-app (niet van WP-6).
