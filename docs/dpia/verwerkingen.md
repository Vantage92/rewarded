# Rewarded — DPIA-aanzet: verwerkingsregister en DPIA-checklist (concept)

*Aanzet van het productteam en het juridische team, stand 5 november 2026, versie 0.1 (ronde 2, eindredactie). **Dit is geen DPIA en geen juridisch advies.** Dit document verzamelt wat de DPIA moet bevatten en wat er al in de andere stukken staat, zodat de opsteller van de DPIA en de advocaat één beginpunt hebben. De volledige DPIA is ondertekend vóór de eerste uitnodiging, uiterlijk 1 december 2026 (businessplan §9); de DPIA-light voor de wachtlijst komt deze week (actie founder). Gebaseerd op `docs/research/07-architectuur.md` §10.4–10.6 (versie 1.3), `docs/research/05-productspecificatie.md` §4.10 en §6.6 (versie 1.2), `docs/juridisch/privacyverklaring.md` §2 en §6 (versie 0.3), `docs/pilot/voorregistratie.md` §8 en de besluiten in `docs/pitch/ronde-2-founder-reactie.md` (J8, J9, G4). Waar dit document afwijkt van die stukken, gelden die stukken; dit document verzint geen grondslagen of termijnen.*

*Leeswijzer. Markeringen zoals in de juridische concepten: **in te vullen** = nog niet bekend; **voorstel** = keuze die de founder of advocaat nog moet bevestigen; **keuze** = termijn die de architectuur koos (architectuur §10.6); **vraag advocaat** = staat in `docs/juridisch/vragen-advocatenopinie.md`. Dit bestand is het verwerkingsregister waarnaar architectuur §10.5 verwijst; WP-6 houdt het bij als de bouw verandert.*

---

## 1. Waarom een DPIA

Een DPIA is verplicht: we monitoren stelselmatig gedrag van een jonge doelgroep in een experiment (businessplan §9). De pilot is een gerandomiseerd veldexperiment met studenten vanaf 16 jaar, in hun drukste weken (voorregistratie §1). Daarom moet de DPIA af zijn vóór de verwerking begint, dus vóór de eerste uitnodiging.

| Onderdeel van de DPIA | Waar het nu staat | Stand |
|---|---|---|
| Beschrijving van de verwerkingen en de doelen | §2 hieronder; privacyverklaring §2 | Aanzet |
| Noodzaak en evenredigheid, dataminimalisatie | Architectuur §10.4; spec §4.10 | Beschreven in de bouwdocumenten |
| Grondslag per verwerking | §2 hieronder; architectuur §10.5; privacyverklaring §2 | Voorlopig; definitief na vragen advocaat 8 en 9 |
| Schriftelijke belangenafweging (gerechtvaardigd belang), met aandacht voor 16- en 17-jarigen | **In te vullen** | Open, vóór 1 december |
| Risico's voor betrokkenen en maatregelen | §3 hieronder | Aanzet |
| Bewaartermijnen | §2 hieronder; architectuur §10.6 | Werkhypothesen en **keuzes**, vast te leggen in de DPIA |
| Verwerkers en doorgifte | Privacyverklaring §4; architectuur §14 #1 | Open: verwerkers nog niet gekozen |
| Ondertekening | **In te vullen**: wie, datum | Vóór 1 december 2026 |

## 2. Verwerkingsregister (aanzet)

Per verwerking de grondslag zoals architectuur §10.5 en privacyverklaring §2 die nu noemen, de tabellen en de bewaartermijn uit architectuur §10.6. De grondslagen zijn voorlopig (founder J5, ronde 1) en definitief na de advocatenopinie.

| Verwerking | Doel | Grondslag (voorlopig) | Tabellen | Bewaartermijn (architectuur §10.6) |
|---|---|---|---|---|
| Account, sessie, punten, verzilvering | De app leveren: sessies tellen, punten bijschrijven, beloningen verzilveren | Overeenkomst (art. 6 lid 1 sub b AVG) | `user` (kern), `auth_*`, `focus_session`, `session_heartbeat`, `visibility_event`, `user_day`, grootboek, `redemption` | Heartbeats en zichtbaarheidsgebeurtenissen 90 dagen, daarna samengevat; sessies en `user_day` zolang het account bestaat; verzilveringen en grootboek zolang nodig voor de verantwoording aan partners, fiscale bewaarplicht te toetsen (architectuur §14 #12) |
| Kalender van de instelling | De juiste data per gebruiker: bonusstop, Belofte-aanbod, rustperiode, aprilchallenge | Overeenkomst | `exam_calendar`, `club`, `squad` | Zolang het account bestaat (privacyverklaring §2.1) |
| Experiment: toewijzing, armwissels, rustuitstap, vragenlijsten (ook de wekelijkse twee items), schadesignalen | De pilot als veldexperiment uitvoeren en deelnemers beschermen | Gerechtvaardigd belang (sub f) met schriftelijke belangenafweging, met aandacht voor 16- en 17-jarigen; opt-out zonder verlies van punten. Welzijnsitems: voorlopig aparte toestemming (art. 9 AVG; vraag advocaat 9a) | `experiment_assignment`, `arm_switch`, `survey_response`, `harm_signal` | `survey_response` en `harm_signal` als `event`, tot uiterlijk 15 juni 2027, daarna geaggregeerd per arm en moment (**keuze**) |
| Eventlog voor de KPI-analyse | Meten of de pilot werkt, per groep, kanaal en instelling | Gerechtvaardigd belang (sub f) | `event`, `event_pending` | Ruwe events tot na de nawerkingsmeting in april 2027 en de analyse, uiterlijk 15 juni 2027, daarna weekcijfers per arm (founder JS5); valt een aprilvenster later, dan schuift deze datum mee (privacyverklaring §2.3) |
| Fraudebestrijding: heuristieken, steekproef, toestel-id, instellingsanker, telefoonverificatie, `blocked_phone_hash` | Eerlijke punten en prijzen; nepaccounts en samenspanning tegengaan | Gerechtvaardigd belang (sub f); telefoonverificatie voorlopig, definitief na vraag advocaat 8b | `fraud_*`, `device`, `blocked_phone_hash`, ankervelden op `user`, `phone_verification` | IP-hash, netklasse en user-agentklasse 30 dagen; `device` 180 dagen na laatst gezien; bewijs bij een markering tot het besluit plus de beroepstermijn, daarna gereduceerd; markeringen en steekproefoordelen 2 jaar; `blocked_phone_hash` 2 jaar (**keuzes**) |
| Wachtlijst | Uitnodigen voor de pilot en de gecontroleerde uitbreiding; de wachtlijsttest | Toestemming | `waitlist_entry` | Uitgenodigd: 30 dagen na de uitnodiging; niet uitgenodigd: zolang de wachtlijst van de uitbreiding loopt, uiterlijk 30 dagen na het einde van semester 2 (**keuze**; de privacyverklaring noemt als **voorstel** hoogstens 12 maanden; gelijk te trekken in de DPIA) |
| Herinneringsmail | Herinnering aan dagdoel of streak | Overeenkomst, met afmelding | `reminder_log` | 30 dagen |
| Supportlabel "welzijn" (S4) | Persoonlijk antwoorden met hulpbronnen; telling per arm | Gezondheidsgegeven (art. 4 lid 15 en art. 9 AVG): uitzondering van art. 9 lid 2 **in te vullen** door de onderzoeker en de advocaat (vraag advocaat 9b; founder J8) | `support_ticket` | Tekst 90 dagen na afhandeling, daarna alleen het label als telling |
| Ambassadeurs | Attributie en vergoeding buiten de app | **In te vullen** (privacyverklaring §6.4) | `ambassador` | **In te vullen**, met de fiscale bewaartermijn (privacyverklaring bijlage #17) |
| Logs | Beveiliging | Gerechtvaardigd belang | — | Applicatie- en toegangslogs 14 dagen; auditlog 2 jaar (founder JS5) |

**Wat ook in de DPIA moet** (architectuur §10.5): de verwerkers (EU, geen subverwerkers buiten de EER zonder waarborgen, inclusief de nummertypecontrole); het toestel-id onder art. 11.7a Telecommunicatiewet (niet geverifieerd; spec open vraag 14); het ontbreken van een kopie van een identiteitsbewijs bij de leeftijdscontrole; de bewaring van `blocked_phone_hash`; het sleutelbeheer (architectuur §10.9); de rol van de vereniging (gezamenlijke verantwoordelijkheid waar dat zo is; `overeenkomst-verenigingen.md`); het vervangen van het squad-id in events bij verwijdering (architectuur §10.7).

## 3. Bijzondere onderwerpen (founder J8)

### 3.1 Supportlabel "welzijn" als gezondheidsgegeven

| Onderdeel | Inhoud | Bron |
|---|---|---|
| Kwalificatie | Het label is waarschijnlijk een gegeven over gezondheid; de aparte toestemming voor de vragenlijst dekt het niet | Jurist ronde 2; vraag advocaat 9b |
| Uitzondering van art. 9 lid 2 AVG | **In te vullen** door de onderzoeker en de advocaat | Founder J8 |
| Toegang | Alleen het teamlid dat het bericht beantwoordt (`assigned_to`) ziet het label; naar de arm alleen als telling | Spec §4.10; architectuur §6.4, §10.5 |
| Bewaring | Tekst na 90 dagen weg; daarna alleen het label als telling | Spec §4.10; architectuur §10.6 |

### 3.2 Welzijnsitems en de wekelijkse meting

De welzijnsitems en de wekelijkse twee items (stress, ervaren druk) staan achter een aparte toestemmingsvraag, voor iedereen, ook voor 16- en 17-jarigen (founder G4: "vanaf week 2, voor iedereen"). Of 16- en 17-jarigen die toestemming zelf kunnen geven, is vraag advocaat 9a; alleen als de advocaat dat vraagt, krijgen zij alleen de vragen over studietijd en afleiding (privacyverklaring §6.1.3, **voorstel**). Weigeraars tellen in de stopregel als ontbrekend, met een gevoeligheidsanalyse (voorregistratie §8.3).

### 3.3 Schadesignalen S1–S3 als profilering

S1 (nachtsessies), S2 (meer dan 360 geverifieerde minuten per dag op meerdere dagen) en S3 (scherpe daling na een gebroken squadstreak) zijn profilering zonder rechtsgevolg (founder J8; definities in voorregistratie §8.3). De DPIA legt de belangenafweging vast.

| Onderdeel | Inhoud | Bron |
|---|---|---|
| Doel | Deelnemers beschermen: een rustig bericht met hulpbronnen; een arm stoppen als die schade doet; vóór de uitbreiding toetsen of de schade in alle armen samen onder de grens blijft | Voorregistratie §8.3; spec §6.6 |
| Gevolg voor de student | Nooit een sanctie, nooit puntverlies, geen besluit over het account; hoogstens één bericht per signaal per 14 dagen | Spec §3.15, §6.6; privacyverklaring §2.3 |
| Wie het ziet | Alleen de student; het team alleen als telling per arm en per code | Architectuur §6.4 |
| Belangenafweging | **In te vullen** (opsteller DPIA, met de onderzoeker) | Founder J8 |
| Gegevens | Alleen sessiegegevens die we al hebben; geen welzijnsantwoorden (S4 is het supportlabel, §3.1) | Vragen-advocatenopinie vraag 9 |
| Bezwaar | Bezwaar (art. 21 AVG) kan via "Uit het onderzoek stappen"; wat er daarna met de signalen gebeurt, legt de DPIA vast (**in te vullen**) | Privacyverklaring §5 |

## 4. DPIA-checklist

Vaste momenten waarop de DPIA opnieuw wordt bekeken. De herbeoordeling van de FG-plicht is een besluit van de founder (J9); de andere regels komen uit de bestaande stukken.

| # | Moment | Wat | Eigenaar | Bron |
|---|---|---|---|---|
| 1 | Deze week | DPIA-light voor de wachtlijst | Founder | Businessplan §9; privacyverklaring bijlage #1 |
| 2 | Vóór 1 december 2026 | Volledige DPIA ondertekend, met per verwerking de grondslag en de schriftelijke belangenafweging (met aandacht voor 16- en 17-jarigen); verwerkers gekozen | Founder, juridisch team | Businessplan §9; privacyverklaring bijlage #2 en #7 |
| 3 | Na het antwoord op vragen advocaat 8 en 9 (uiterlijk 1 december) | Grondslagen, art. 9-uitzondering voor het supportlabel en de welzijnsitems, en de regel voor 16- en 17-jarigen definitief maken | Juridisch team | Vragen-advocatenopinie vragen 8 en 9 |
| 4 | Vóór 2 december 2026 | Bewaartermijnen uit architectuur §10.6 vastgelegd; einddatum van de ruwe events afgestemd op de aprilvensters per instelling | Productteam, opsteller DPIA | Architectuur §10.6, §14 #24; privacyverklaring bijlage #6 |
| 5 | **Bij de start van de gecontroleerde uitbreiding** | Herbeoordeling van de plicht tot een functionaris gegevensbescherming (art. 37 AVG) | Founder | Founder J9; privacyverklaring §1.2 |
| 6 | **Bij het eerste B2B-contract met een instelling** | Herbeoordeling van de plicht tot een functionaris gegevensbescherming | Founder | Founder J9; privacyverklaring §1.2 |
| 7 | Vóór de eerste ambassadeur | Gegevens van ambassadeurs in het register, met de fiscale bewaartermijn | Founder, fiscalist | Privacyverklaring bijlage #17 |
| 8 | Bij elke wijziging van een verwerking in de bouw | Dit register bijwerken | WP-6 | Architectuur §10.5 |

## 5. Stand van de bouw (WP-6, 5 november 2026)

Wat de code nu doet, per verwerking uit §2, zodat de opsteller van de DPIA ziet wat er technisch vastligt. Bron: `apps/api/migrations/0080_fraud_queue.sql`, `0300_fraud_admin_privacy.sql`, `packages/core/src/fraud/retention.ts` en `apps/api/src/modules/fraud/lib/{retention,privacy}.ts`. Waar dit afwijkt van §2, gaat §2 (en daarmee de architectuur) voor; de afwijking staat erbij.

| Verwerking | Tabellen in de bouw | Bewaartermijn zoals gebouwd (dagafsluiting stap 11) | Opmerking |
|---|---|---|---|
| Fraudebestrijding: markeringen en besluiten | `fraud_flag`, `fraud_flag_session` (koppelt sessie én account) | Bewijs gereduceerd tot codes en drempelwaarden 14 dagen na het besluit, of pas na het besluit op een lopend beroep; rij 2 jaar na het besluit; open markeringen blijven | Bij `DELETE /me`: open markeringen `closed` met `account_deleted`, onderwerp en koppelingen weg, bewijs gereduceerd |
| Beroep | `appeal` | Tekst 90 dagen na het besluit; rij 2 jaar | Bij `DELETE /me`: open beroep gesloten, `user_id` en tekst leeg |
| Geblokkeerde nummers en instellingsadressen | `blocked_phone_hash`, `blocked_institution_hash` (zonder `user_id`) | 2 jaar na de bevestigde blokkade (`expires_at`) | Overleven `DELETE /me`, zodat H8 en de uniekheidscontrole blijven werken |
| Instellingsanker | `user.institution_email_hash` (unieke index), `user.institution_reconfirm_due`, `institution_verification` (lopende code), `institution_domain` (domeinlijst) | Code: 15 minuten geldig, rij weg na 24 uur; HMAC zolang het account bestaat | **Afwijking:** de HMAC gebruikt nu de e-mailpepper met een domeinscheider (`inst|…`), omdat `pepper_inst` nog niet in de geheimenmap van WP-3 zit; vóór 4 januari omzetten (zie `sleutelbeheer.md`). Het adres zelf wordt nergens bewaard |
| Steekproef | `fraud_sample`, `fraud_sample_item` | Item 2 jaar na het oordeel; de schatting per week blijft | Trekking reproduceerbaar uit de seed (HMAC-SHA256); bij `DELETE /me`: `user_id` en controles leeg |
| Schadesignalen S1–S4 | `harm_signal` (met de armen op het moment van het signaal), `harm_week` (alleen tellingen) | Tot 15 juni 2027, daarna geaggregeerd in `research_aggregate` en verwijderd | Geen fraudegevolg, geen markering; het team ziet alleen tellingen per arm en code |
| Supportlabel "welzijn" (S4) | `support_ticket.label`, `assigned_to` | Tekst 90 dagen na afhandeling; label blijft als telling | Alleen `assigned_to` ziet label en tekst in de beheeromgeving |
| Verdiende prijzen | `prize`, `prize_delivery_contact` | Naam en adres 30 dagen na levering | Leeftijdscontrole: alleen uitkomst, datum en controleur; de soort document wordt niet opgeslagen |
| Ambassadeurs | `ambassador`, `ambassador_payout` | **In te vullen** (fiscale bewaartermijn) | Alleen een `name_ref`, geen persoonsgegevens van de ambassadeur zelf |
| Eventlog na 15 juni 2027 | `event_week_aggregate` | Ruwe events geaggregeerd naar week, naam, arm, kanaal en release, daarna verwijderd | Datum vast in `core/fraud/retention.ts`; schuift een aprilvenster, dan schuift die datum mee (nieuwe parameterversie) |
| Netwerkgegevens | `ip_hash`, `net_class` op sessies, inloglinks, registratie, verenigingskoppelingen en wachtlijst | 30 dagen, dan leeg | **Afwijking:** `focus_session.ua_class` en `device_id` zijn verplichte kolommen (WP-4); de UA-klasse gaat na 30 dagen naar `other`, het toestel-id blijft tot het account of de toestelrij weg is. Op te lossen in WP-4 |
| Auditlog | `audit_log` | 2 jaar, via een benoemde regel (`audit_retention`); recentere rijen blijven onwijzigbaar | De triggers van WP-3 blijven; alleen rijen ouder dan de afkapdatum mogen weg |

**Export (`GET /me/export`).** Eén JSON-bestand met een sectie per module die een exporter registreerde (nu: profiel, sessies, punten, verzilveringen, telefoon, squads, duels, verenigingen, challenges, Belofte, kaarten, referral, herinneringen, markeringen met besluiten en beroepen, schadesignalen, prijzen, instellingsanker en supporttickets). Gegevens van anderen staan er niet in.

**Verwijdering (`DELETE /me`, en door beheer alleen met vier ogen).** Eén transactie over alle erasers per module; daarna de rijen van WP-3 (gebruiker, inlog, toestellen, idempotentie, wachtlijst) en de events: nieuw willekeurig pseudoniem, nieuw willekeurig squad-id per verwijderde gebruiker, en de id's uit de eigenschappen weg. De verwijdertest scant alle tabellen en kolommen op het oude id, het e-mailadres en het pseudoniem.

## Wijzigingslog

| Ronde | Datum | Wijziging |
|---|---|---|
| WP-6 | 5 november 2026 | §5 toegevoegd: stand van de bouw per verwerking, met de twee afwijkingen (pepper voor het instellingsadres, verplichte kolommen van WP-4) en de nieuwe tabellen (`harm_week`, `institution_domain`, `institution_verification`, `event_week_aggregate`, `research_aggregate`, `audit_retention`). Versie 0.2. |
| ronde 2 (eindredactie) | 5 november 2026 | Eerste aanzet, opgesteld in de eindredactie van ronde 2 omdat businessplan §9, spec §4.10, architectuur §10.5 en de privacyverklaring naar een DPIA-aanzet en DPIA-checklist verwijzen (founder J8, J9) en `docs/dpia/` nog niet bestond. Alleen samengesteld uit de bestaande stukken; belangenafweging, art. 9-uitzondering, verwerkers en ondertekening staan als **in te vullen**. Versie 0.1. |
