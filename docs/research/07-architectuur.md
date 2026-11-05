# Rewarded — Technische architectuur web-MVP

*Rol: technisch architect. Versie 1.2, 4 november 2026, herzien na een kritische tegenlezing en na pitchronde 1 volgens de bindende besluiten van de founder (`docs/pitch/ronde-1-founder-reactie.md`; wijzigingslog in hoofdstuk 15). Maten, toewijzing en randomisatieseed: `docs/pilot/voorregistratie.md`. Bouwdocument voor de bouwers van R1 (2 december 2026), R2 (16 december) en R3 (5 januari 2027). Bindend kader: `docs/01-businessplan.md` (verder: businessplan). Functionele bron: `docs/research/05-productspecificatie.md` (verder: spec); alle parameters, codes en drempels komen daaruit en worden hier niet opnieuw gekozen. Bewijs over browsers en verificatie: `docs/research/09-verificatietechniek.md` (verder: rapport 09). AVG en fraude-economie: `docs/research/02-businessmodel-juridisch-unit-economics.md` §2.4 en hoofdstuk 4 (verder: rapport 02). Schermen, routes en tokens: `docs/research/06-ux-ontwerp.md` (verder: UX), dat sinds versie 1.0 is verschenen; §9.7 sluit erop aan. Keuzes die niet uit een bron volgen, staan er als **keuze** (met reden), **aanname** of **open vraag** (hoofdstuk 14). Waar deze versie van de spec afwijkt, staat dat er als **afwijking van de spec** bij, met de vraag aan product in hoofdstuk 14.*

---

## 1. Overzicht en principes

Rewarded bestaat in de MVP uit drie delen in één repository: een Progressive Web App die de focussessie op het toestel draait, een Node-API die als enige beslist wat een sessie waard is, en een puur TypeScript-domeinpakket met alle regels die beide kanten moeten kennen. Er is geen derde partij in de keten: geen analytics-SDK (verboden in spec §4.10), geen cloudfunctie, geen externe auth-dienst.

```
 Browser (PWA)                                 Server (Node 22 LTS, gepind)
 ┌───────────────────────────────┐             ┌──────────────────────────────┐
 │ React UI  ── i18n NL/EN       │   HTTPS     │ Hono-router  /api/v1         │
 │ Sessie-machine (core) ────────┼── JSON ────▶│ Sessieverifier (core)        │
 │ Platform-adapters:            │  cookie     │ Grootboek + reconcileDay     │
 │  Page Visibility, Wake Lock,  │             │ Dagafsluiting 05:45 (dag D)  │
 │  performance.now, Web Locks   │◀── nonce ───│ Heuristieken H1–H11 (core)   │
 │ Outbox in IndexedDB           │  (+ vorige) │ SQLite (WAL) + migraties     │
 │ Service worker (app-shell)    │             │ Dev-inbox, dev-klok (alleen  │
 └───────────────────────────────┘             │ in de dev-build)             │
                 ▲                             └──────────────────────────────┘
                 └──────────── packages/core ──────────────┘
                   (toestandsmachine, regels, parameters)
```

Vier principes sturen elke ontwerpkeuze hieronder.

**Local-first sessie.** Een sessie mag niet sneuvelen omdat de bibliotheekwifi een minuut wegvalt. Na de start loopt ze op het toestel door zonder netwerk: de client meet tijd met de monotone klok (`performance.now()`), legt elke zichtbaarheids- en Wake Lock-wijziging met volgnummer vast in IndexedDB en stuurt die na herstel na. Wat het toestel vastlegt, is getuigenis, geen uitspraak. Starten vraagt wel netwerk, omdat de server starttijd en eerste nonce uitgeeft (spec §3.2). Elk sessieverzoek is idempotent, zodat een verloren antwoord nooit punten kost (§4.7).

**Server als scheidsrechter.** Duur, uitkomst, punten, dagdoel, streak en ranglijst berekent de server uit servertijd en vastgelegde gebeurtenissen, met dezelfde pure functies uit `packages/core` die de client gebruikt. De klok van de client telt nooit voor punten (spec §4.1, rapport 09 §3.2). Heuristieken markeren; een mens beslist over alles wat punten of prijzen kost (spec §4.11).

**Dataminimalisatie.** We verwerken wat spec §4.10 opsomt en niets meer: sessietijdstempels, zichtbaarheidsgebeurtenissen, Wake Lock-status, heartbeats, lidmaatschappen, een gehasht IP-adres met een grove netklasse, een user-agentklasse en vanaf de eerste verzilvering een gehasht telefoonnummer. De geboortedatum wordt een leeftijdsklasse en wordt niet bewaard, ook niet in logs. Besturen krijgen alleen aggregaten vanaf 5 leden (spec §4.6), per week en afgerond (§6.4). Bewaartermijnen zitten per tabel en kolom in een job, niet alleen in beleid (§10.6).

**Alles testbaar zonder internet, na één bootstrap.** Tijd, willekeur (met de vastgelegde experimentseed), e-mail en sms (met nummertypecontrole) zijn interfaces met een productie- en een testimplementatie. Magic links, inlogcodes en sms-codes verschijnen in ontwikkeling in de console en een dev-inbox. De serverklok is in dev en test te verzetten, zodat een sessie van 25 minuten of een dagafsluiting in seconden te testen is. "Zonder internet" geldt ná een eenmalige bootstrap die pakketten, de SQLite-driver en de Playwright-browsers in een lokale cache zet (§2.1); de oude belofte "na `pnpm install`" was niet waar.

**Wat de web-MVP eerlijk claimt.** Het systeem bewijst dat één browser de pagina zichtbaar had tussen twee servertijdstippen, niet dat de telefoon niet gebruikt is of dat er een mens zat (rapport 09 §3.3). Elke sessie draagt `verification_level = 1` en de plafonds in core zijn per niveau gedefinieerd, zodat een websessie technisch nooit tot geld of vrij besteedbaar tegoed leidt (businessplan besluit 5 en §8; uitwerking in §4.6 en §5.3).

## 2. Repo-structuur

De bouwomgeving is vastgesteld: pnpm-workspaces, Vite en React voor de web-app, Hono voor de API, SQLite met een synchrone driver, Vitest en Playwright. Ik wijk op één punt af van de opdracht: naast `packages/core` komt een tweede pakket, `packages/contracts`. De reden is dwingend voor het parallel bouwen: core bevat domeinlogica zonder I/O, terwijl de API-vorm (request- en responseschema's, foutcodes, eventnamen) een afspraak tussen twee bouwteams is die op dag twee bevroren moet zijn. Als die schema's in core staan, wordt elke API-wijziging een wijziging in het domeinpakket, en daarmee een conflict tussen drie werkpakketten. Contracts hangt af van core (voor typen zoals `AbortReason`), nooit andersom.

Een tweede bevroren laag is nieuw in deze versie: `apps/api/src/services/`. Daar staan de interne interfaces waarmee API-modules elkaars domein gebruiken (grootboek boeken, markeringen maken, `user_day` lezen), met een fake per interface. Zonder die laag bouwt elk pakket zijn eigen variant van het grootboek of de fraudewachtrij (§12.2).

```
rewarded/
├── .nvmrc                    # Node 22 LTS, exacte patchversie (§2.1)
├── package.json              # engines.node, scripts: bootstrap, dev, test, e2e, verify, seed:demo, db:migrate
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example              # geen secrets; peppers en de experimentseed buiten de repo en buiten .data (§10.9)
├── packages/
│   ├── core/                 # puur domein, geen I/O, geen Date.now()
│   │   └── src/
│   │       ├── params/       # parameterset v1 (spec §5), per verificatieniveau, netklassen, grace-tijden
│   │       ├── time/         # focusdag 04:00, sluitmoment dagafsluiting, weeksleutel, seizoen, Clock-interface
│   │       ├── session/      # client-toestandsmachine, serververifier, retry-regels
│   │       ├── ledger/       # rekeningen, boekingsregels, reconcileDay, saldo-afleiding
│   │       ├── goals/        # dagdoel, overmoedrem, doelvoorstel, doelbonus arm A/B
│   │       ├── squads/       # streak, joker, pauze, bevriezen
│   │       ├── challenges/   # deelnamegraad, intensiteit, poules, drempel
│   │       ├── fraud/        # heuristieken H1–H11, steekproeftrekking, schadesignalen S1–S4 als pure functies
│   │       ├── experiments/  # toewijzing uit seed per factor, stratum en blok; uitzonderingen 16_17
│   │       ├── belofte/      # aanbod, dagresultaat, reflectie
│   │       ├── referral/     # vesting
│   │       ├── catalog/      # puntenprijs, plafonds, dekking, toegestane soorten per niveau
│   │       └── privacy/      # suppressSmallGroups, afronding, verschilonderdrukking
│   ├── contracts/            # zod-schema's per module (src/<module>.ts), foutcodes, eventtaxonomie
│   └── tsconfig/             # gedeelde tsconfig-presets (optioneel)
├── apps/
│   ├── api/
│   │   ├── migrations/       # 0001_….sql t/m 0399_….sql, reeksen per werkpakket (§12.3)
│   │   └── src/
│   │       ├── app.ts        # Hono-app, middleware; laadt modules uit modules.gen.ts
│   │       ├── modules.gen.ts# gegenereerd uit modules/*/index.ts; nooit handmatig bewerkt
│   │       ├── server.prod.ts# productie-entry: zonder modules/dev
│   │       ├── server.dev.ts # dev/test-entry: met modules/dev
│   │       ├── db/           # driver-adapter, migratierunner, transactiehelper
│   │       ├── platform/     # Clock, Random, Mailer, SmsSender (met nummertype), Hasher, Logger (prod + dev)
│   │       ├── services/     # bevroren interfaces + fakes: LedgerService, FlagService, UserDayRepository, …
│   │       ├── middleware/   # auth, csrf, rate limit, idempotentie, foutafhandeling, logging
│   │       ├── jobs/         # scheduler, dagafsluiting (orchestrator + stappen), weekstart, retentie
│   │       └── modules/      # auth, waitlist, dev, events, sessions, points, catalog, redemptions,
│   │                         # phone, squads, invites, duels, clubs, challenges, leaderboards,
│   │                         # belofte, cards, referral, reminders, fraud, sample, wellbeing, privacy, kpi,
│   │                         # support, admin
│   └── web/
│       ├── public/           # manifest.webmanifest, iconen
│       └── src/
│           ├── app/          # router (laadt features/*/routes.tsx via import.meta.glob), layout, providers
│           ├── design/       # tokens.json (uit UX §5) → tokens.css, basiscomponenten
│           ├── i18n/         # <taal>/<feature>.json, <taal>/errors/<module>.json
│           ├── platform/     # visibility, wakelock, monotone klok, web locks, outbox, rasterizer
│           ├── lib/api/      # getypeerde client op contracts
│           ├── sw/           # service worker (injectManifest)
│           └── features/     # waitlist, onboarding, focus, points, squads, duels, club, challenges,
│                             # belofte, cards, survey, profile, board, admin
├── e2e/                      # Playwright-specs, fixtures (API-proces per worker), test-hooks
└── tooling/
    ├── bootstrap/            # offline-bootstrap: pnpm fetch, driver-prebuild, browsercache
    ├── seed/                 # deterministische demo-seed
    └── scripts/              # gen-modules, aa-check (A/A-controle), kpi-export, secrets genereren
```

| Map | Verantwoordelijkheid | Mag afhangen van | Mag niet |
|---|---|---|---|
| `packages/core` | Domeinregels, parameters, pure berekeningen | Niets buiten de standaardbibliotheek en `zod` voor parametervalidatie | I/O, `Date.now()`, `Math.random()`, DOM, Node-API's |
| `packages/contracts` | API-schema's, foutcodes, eventnamen, gedeelde DTO's | `core`, `zod` | Logica |
| `apps/api/src/services` | Interfaces tussen API-modules, plus fakes | `core`, `contracts` | Implementatie (die staat in de eigenaarsmodule) |
| `apps/api` | HTTP, opslag, transacties, jobs, auth, audit | `core`, `contracts`, `hono`, SQLite-driver | Regels dupliceren die in core staan; een andere module direct importeren (alleen via `services`) |
| `apps/web` | UI, platform-API's, offline opslag, PWA | `core`, `contracts`, React, router, TanStack Query, `idb` | Punten of uitkomsten zelf vaststellen |
| `e2e` | Scenario's door de hele keten | Draaiende `api` en `web` | Productcode importeren behalve test-hooks |
| `tooling/seed` | Demo- en testdata | `core`, `apps/api` (repositories) | Willekeur zonder vaste seed |

**Modules registreren zonder handmatige lijst.** Elke API-module heeft `modules/<naam>/index.ts` met `export const module = { name, register(app, services) }`. Het script `tooling/scripts/gen-modules.ts` schrijft daaruit `modules.gen.ts`, als stap vóór `dev`, `test` en `build`; de productiebuild slaat `dev` over (§10.3). De web-app laadt `features/*/routes.tsx` met `import.meta.glob`. Zo hoeft geen werkpakket `app.ts` of de router te bewerken om een module toe te voegen; WP-0 maakt op dag één een stub voor elke module uit de lijst hierboven, die de vereniging is van alle modules uit hoofdstuk 12.

### 2.1 Node, driver en offline-bootstrap

**Node-versie.** `.nvmrc` en `engines.node` pinnen één Node 22 LTS-patchversie. Die moet `node:sqlite` zonder `--experimental-sqlite`-vlag laden. Volgens mijn kennis is die vlag in de 22-lijn vervallen vanaf 22.13.0 (de module geeft nog wel een experimentele waarschuwing); dat is een **aanname** die WP-0 op dag één controleert met een test die `DatabaseSync` opent op de gepinde versie. Klopt de aanname niet, dan pint WP-0 een hogere versie en past deze paragraaf aan.

**Driverkeuze.** `better-sqlite3` is de eerste keus: synchroon en met echte transacties. Het pakket haalt bij installatie een prebuild op of laat `node-gyp` Node-headers downloaden; beide vragen internet. Daarom zit de prebuild voor de gepinde Node-versie in de bootstrapcache. Ontbreekt die, dan valt de adapter terug op `node:sqlite` (`DatabaseSync`). De code ziet alleen de interface `Db`, en de integratietests draaien in `pnpm verify` tegen beide drivers, zodat verschillen (bijvoorbeeld in foutmeldingen bij een geschonden unieke index) vroeg zichtbaar worden. Migraties zijn platte SQL-bestanden met een eigen runner, zonder ORM, omdat grootboek- en KPI-query's leesbaar moeten blijven voor de beheerder (spec §7).

**Offline-bootstrap.** `pnpm bootstrap` draait eenmalig met netwerk en vult drie caches: de pnpm-store (`pnpm fetch` op de lockfile), de driver-prebuild (`tooling/bootstrap/prebuilds/`) en de Playwright-browsers (Chromium en WebKit, in `PLAYWRIGHT_BROWSERS_PATH=./.cache/ms-playwright`). Daarna werkt `pnpm install --offline` op een schone checkout, en `pnpm e2e` start zonder download. Een machine die de bootstrap niet kan draaien, krijgt de caches als archief van een collega; WP-0 beschrijft dat in `tooling/bootstrap/README.md`. Er is geen native afhankelijkheid voor kaarten: de server levert SVG en de browser rastert die zelf naar PNG voor het delen (§8.2, §9.5).

## 3. Domeinmodel

Alle identifiers zijn ULID's (sorteerbaar, geen volgordelek tussen gebruikers) en worden door de server gemaakt. Tijdstippen zijn servertijd in UTC als ISO-tekst of milliseconden; een `focus_day` is een datum (`YYYY-MM-DD`) volgens de dagrand 04:00 Europe/Amsterdam (spec §4.2), berekend door `core/time`. Geldbedragen zijn gehele eurocenten. Punten zijn gehele getallen. Waar een veld een vaste lijst waarden heeft, staat die lijst in `core` als TypeScript-union en in SQLite als `CHECK`-constraint. Per tabel staan de eigenaar en de migratiereeks in §12.3; de bewaartermijn per tabel en kolom in §10.6; wat er bij `DELETE /me` gebeurt in §10.7.

### 3.1 Identiteit, toegang en wachtlijst

| Entiteit | Velden | Invarianten |
|---|---|---|
| `user` (gebruiker) | `id`, `email` (lowercase), `email_norm_hash` (uniek; HMAC van het genormaliseerde adres: plus-deel weg, punten weg bij providers die ze negeren), `first_name`, `last_name?`, `locale` (nl/en), `age_band` (`16_17`/`18_plus`), `turns_18_on?`, `status` (active/blocked/deleted), `is_team`, `pseudonym` (willekeurig, voor events), `registration_source` (squad/duel/club/personal/ambassador/waitlist/card), `registration_invite_id?`, `registration_ip_hash?`, `registration_net_class?`, `daily_goal_min`, `daily_goal_next?` + `daily_goal_next_from?`, `compare_opt_in`, `silent_mode` (standaard 1 bij `16_17`), `squad_name_on_cards`, `no_points_mode`, `email_reminders` (standaard aan, opt-out), `phone_hash?`, `phone_line_type?` (mobile; andere typen worden geweigerd), `phone_verified_at?`, `institution_domain?`, `institution_email_hash?` (uniek; HMAC met eigen pepper, alleen voor uniekheid, open vraag 26), `institution_verified_at?`, `earn_in_reached_at?`, `first_redeem_after?` (+7 dagen), `research_opt_out_at?`, `registration_channel` (club/squad_invite/ambassador/waitlist/other), `terms_version`, `privacy_version`, `created_at` | Geen geboortedatum opgeslagen; `turns_18_on` alleen bij `16_17`; leeftijdsklasse wisselt in de dagafsluiting op `turns_18_on`; een rij bestaat pas na een geslaagde leeftijdscheck (onder 16 wordt niets bewaard, spec §3.1) |
| `auth_magic_link` | `id`, `email`, `token_hash`, `code_hash` (zescijferige code, zelfde mail), `invite_token?`, `ip_hash`, `net_class`, `expires_at` (15 min), `attempts`, `used_at?`, `used_via?` (link/code) | Token en code samen eenmalig: wie de ene gebruikt, maakt de andere ongeldig; alleen hashes opgeslagen; vijf codepogingen; rij verwijderd 24 uur na aanmaak, na telling in `auth_daily_stat` |
| `auth_daily_stat` | `day`, `requested`, `consumed_link`, `consumed_code`, `expired`, `invalid` | Geen persoonsgegevens; KPI voor de inlogflow (§10.1) |
| `auth_session` | `id` (SHA-256 van cookiewaarde), `user_id?`, `pending_email?`, `pre_pseudonym?`, `created_at`, `expires_at`, `last_seen_at`, `ua_class`, `mfa_at?` | `user_id` of `pending_email` (pre-onboarding), nooit beide; sliding 30 dagen, beheerder 12 uur en alleen met `mfa_at` (§10.8) |
| `admin_mfa` | `user_id`, `totp_secret_enc`, `enrolled_at`, `last_used_step` | TOTP volgens RFC 6238; geheim versleuteld met een sleutel buiten de database (§10.9); `last_used_step` weigert hergebruik van dezelfde code |
| `device` (apparaat) | `id` (server-ULID), `client_device_id` (UUID uit IndexedDB), `user_id`, `ua_class`, `standalone`, `wakelock_supported`, `first_seen_at`, `last_seen_at`, `max_verification_level` (1), `attestation_kind?`, `attestation_ref?` | Uniek op (`client_device_id`, `user_id`): twee accounts in één browserprofiel krijgen elk een eigen rij en worden nooit stil aan elkaar gekoppeld; attestatievelden leeg in de MVP (zie §13) |
| `admin` (beheerder) | `user_id`, `role` (reviewer/admin), `created_at`, `created_by` | Een beheerder is ook een `user` met `is_team = 1`; teamaccounts tellen in geen KPI mee (spec §7) |
| `invite` | `id`, `token` (128 bits, base64url), `source` (squad/duel/club/personal/ambassador/waitlist/card), `creator_user_id?`, `squad_id?`, `duel_id?`, `club_id?`, `waitlist_entry_id?`, `qr_source?`, `max_uses` (squad 5, duel 1, wachtlijst 1, of het aantal leden van een wachtlijstgroep), `uses`, `expires_at` (squad 7 dagen, duel 48 uur, wachtlijst 14 dagen: **keuze**), `created_at` | `uses ≤ max_uses`; preview noemt nooit punten of prijzen (spec §3.5); bronnen `waitlist`, `card`, `club` en `ambassador` tellen niet voor K (spec §7.2) |
| `waitlist_entry` | `id`, `email` (nodig om uit te nodigen), `email_hash` (uniek, voor ontdubbelen), `locale`, `source` (landing/card/club_qr/ambassador/creator/other), `group_token?` (aanmelden met vrienden), `club_hint?` (vrije verenigingsnaam, ingekort), `priority_reason` (group/club/card/none), `consent_version`, `created_at`, `invited_at?`, `invite_id?`, `ip_hash`, `net_class` | Geen leeftijd of naam; aanmelden is geen account; bewaartermijn in §10.6 en in de DPIA |

**Toegangspoort in de gesloten pilot.** Alleen een geldig `invite` geeft toegang (`INVITE_REQUIRED`, spec §3.1). De wachtlijst levert die uitnodigingen in batches: de beheerder kiest een aantal, de server ordent op `priority_reason` (eerst groepen die samen kunnen instromen, dan verenigingen, dan kaart, dan de rest, binnen elke klasse op `created_at`), maakt per groep één `invite` met bron `waitlist` en `max_uses` gelijk aan de groepsgrootte, en stuurt de mail via de `Mailer`. Zo kunnen vrienden die samen aanmeldden, samen een squad vormen, en blijft de wachtlijst buiten de K-factor.

### 3.2 Sessies en signalen

| Entiteit | Velden | Invarianten |
|---|---|---|
| `focus_session` (sessie) | `id`, `user_id`, `device_id` (FK `device.id`), `planned_min` (1/25/50/90), `is_practice`, `status` (active/completed/aborted), `server_start_at`, `planned_end_at`, `server_end_at?`, `end_received_at?`, `abort_reason?` (hidden/heartbeat_gap/user_stop/second_session/late_end), `abort_at?`, `verified_min`, `counted_min` (afgeleid door `reconcileDay`, §5.1), `focus_day`, `late_start`, `review_status` (none/pending/released/rejected), `flag_codes` (JSON), `verification_level` (1), `nonce_hash`, `prev_nonce_hash?`, `last_seq`, `last_response` (JSON, antwoord op `last_seq`), `start_idempotency_key`, `verdict` (JSON, na sluiting), `closed_by?` (end/stop/sweep/events/second_session/restore), `last_heartbeat_at`, `covered_gap_s`, `clock_skew_ms?`, `claim_delay_s?`, `webdriver`, `standalone`, `ua_class`, `ip_hash`, `net_class`, `restored_by?`, `restored_reason?` | `CHECK (is_practice = (planned_min = 1))`; hoogstens één `active` per gebruiker (gedeeltelijke unieke index); `verified_min = planned_min` alleen bij `completed` en niet-oefensessie, anders 0; `counted_min ≤ verified_min` en de som van `counted_min` per gebruiker per `focus_day` ≤ 300 (puntenplafond, spec §4.2); `late_start` = start tussen 01:00 en 04:00 (nachtregel); `verified_min` blijft ook boven 300 bewaard voor dagdoel, H5 en de schadesignalen; `focus_day` = dag van `server_start_at`; `aborted → completed` alleen via `restore_session` (§4.8) |
| `session_heartbeat` | `session_id`, `seq`, `server_recv_at`, `client_ts`, `mono_ms`, `visibility`, `wakelock` (acquired/denied/released/unsupported), `nonce_ok`, `buffered`, `kind` (online/buffered/resume) | (`session_id`, `seq`, `kind`) uniek; `mono_ms` stijgend in `seq`; een herhaald verzoek schrijft geen nieuwe rij (§4.7) |
| `visibility_event` (zichtbaarheidsgebeurtenis) | `id`, `session_id`, `ev_seq`, `kind` (visible/hidden/pagehide/pageshow/blur/focus/wakelock_acquired/wakelock_denied/wakelock_released/online/offline/first_interaction_after_end), `mono_ms`, `client_ts`, `server_recv_at`, `buffered` | Append-only; (`session_id`, `ev_seq`) uniek, een duplicaat wordt genegeerd; ruwe rijen na 90 dagen samengevat (§10.6) |
| `session_summary` | `session_id`, `hidden_count`, `max_gap_s`, `covered_gap_s`, `wakelock_states`, `skew_ms`, `claim_delay_s` | Ontstaat bij opschoning; blijft zolang de sessie bestaat |
| `outage` | `id`, `from`, `to`, `note`, `created_by`, `created_at` | Storing aan onze kant; context voor `evaluateSession` en `restore_session` |
| `fraud_flag` (fraudemarkering) | `id`, `subject_type` (session/account/squad/club), `subject_id?`, `code` (H1–H11, USER_REPORT, NAME_REPORT, SAMPLE, OUTAGE), `evidence` (JSON), `evidence_reduced_at?`, `status` (open/released/rejected/blocked/closed), `created_at`, `decided_by?`, `decided_at?`, `block_confirmed_by?`, `reason_code?` | Ontstaat alleen door heuristiek of melding; wordt alleen door een mens gesloten (uitzondering: `closed` met `account_deleted`, §10.7); `blocked` vereist `block_confirmed_by ≠ decided_by` |
| `fraud_flag_session` | `flag_id`, `session_id` | Koppelt een markering aan alle sessies die ze raakt (H2, H5, H6, H7, H9, H10 raken er meerdere); boekingen gebeuren per paar (§5.1) |
| `appeal` (beroep) | `id`, `object_type` (flag/redemption/block/prize), `object_id`, `user_id?`, `text?`, `status`, `submitted_at`, `decided_by?`, `decided_at?`, `outcome?`, `motivation?`, `waiting_for_third` | Binnen 14 dagen na het besluit; `decided_by` ∉ {`decided_by`, `block_confirmed_by`} van het oorspronkelijke besluit (afgedwongen in de transactie, §10.8); besluit binnen 5 werkdagen (bewaakt in de wachtrij, spec §6.5) |
| `blocked_phone_hash` | `phone_hash`, `blocked_at`, `expires_at`, `flag_id` | Geen `user_id`; ontstaat bij een bevestigde blokkade en overleeft `DELETE /me`, zodat H8 werkt; grondslag en termijn in §10.6 |

### 3.3 Punten en beloningen

Het grootboek is dubbel boekhouden: elke mutatie is een journaalpost met twee of meer boekingsregels die samen nul zijn. Saldi bestaan niet als kolom; ze zijn de som van regels per rekening (spec §4.2: "saldi zijn afgeleid, nooit los opgeslagen"). Het journaal verwijst nergens naar een gebruiker: de koppeling van gebruiker naar rekening staat in een aparte tabel, zodat verwijderen kan zonder één journaalrij te wijzigen (§10.7).

| Entiteit | Velden | Invarianten |
|---|---|---|
| `ledger_account` | `id`, `owner_type` (user/system), `kind` | Gebruikersrekeningen: `available_own`, `available_referral`, `pending_session`, `pending_goal_budget`, `referral_unvested`. Systeemrekeningen: `issuance`, `redeemed`, `lapsed`, `reversed`, `expired`, uniek op `kind` waar `owner_type = system`. Geen eigenaarskolom |
| `ledger_account_owner` | `account_id` (uniek), `user_id`, `kind`, uniek op (`user_id`, `kind`) | De enige plek waar een gebruiker aan een rekening hangt; wordt bij `DELETE /me` geleegd, na de `expire`-post die de saldi op nul zet |
| `journal_entry` (puntenboeking) | `id`, `type` (zie tabel 5.1), `idempotency_key` (uniek), `account_set` (ULID van de rekeningenset, geen `user_id`), `ref_type`, `ref_id`, `cause_type?` + `cause_id?` (flag, decision, appeal, restore), `focus_day?`, `reason_code?`, `actor` (`system` of `admin:<ref>`), `arm?`, `param_version`, `created_at` | Som van regels = 0; nooit gewijzigd of verwijderd (SQLite-triggers weigeren UPDATE en DELETE, zonder uitzondering); een correctie is een nieuwe post |
| `posting` | `id`, `entry_id`, `account_id`, `amount` (± punten) | Bedrag ≠ 0; per post minstens één debet- en één creditregel; zelfde triggers |
| `partner` | `id`, `name`, `kind` (vereniging/faculteit/sponsor/werkgever), `contact_ref` | Geen persoonsgegevens van studenten gedeeld (businessplan §5) |
| `partner_budget` (partnerbudget) | `id`, `partner_id`, `kind` (direct_reward/revenue), `booked_cents`, `reward_pct` (100 bij direct_reward; standaard 20 bij revenue, spec §4.3), `document_ref` (factuur of contract), `booked_at`, `status` (booked/cancelled), `cancelled_cents`, `created_by` | Alleen geboekt = gefactureerd of getekend contract met bedrag en datum; zonder `document_ref` geen rij; annuleren alleen als de vrije ruimte het geannuleerde deel dekt (§5.3) |
| `budget_allocation` | `id`, `budget_id`, `target_type` (reward_stock/prize), `target_id`, `amount_cents` (± ; negatief = vrijgave), `reverses_id?`, `reason_code`, `created_at`, `created_by` | Append-only (triggers); Σ allocaties per budget ≤ `(booked_cents − cancelled_cents) × reward_pct / 100`; dit is de dekkingsregel; elke rij heeft een auditregel |
| `reward` (beloning, catalogusitem) | `id`, `partner_id`, `kind` (`in_kind`/`service`/`partner_discount`), `title_nl`, `title_en`, `terms_nl`, `terms_en`, `cost_cents` (≤ 500), `points_price` (veelvoud van 50), `min_age_band`, `declaration_ref` (verklaring van de partner dat het item een voucher of korting voor één product of dienst is en geen geld, cadeaukaart of tegoed voor een assortiment; spec §4.3), `collective` (bij voorkeur collectief, ervaringsgericht of symbolisch), `cash_check_by?` + `cash_check_at?`, `status` (draft/published/offline), `published_at?`, `published_by?` | `CHECK (kind IN ('in_kind','service','partner_discount'))`: open cadeaukaarten, winkeltegoed en geldequivalenten bestaan als soort niet; `points_price` onveranderlijk na publicatie; publiceren alleen met `declaration_ref`, vinkje van de beheerder en een allocatie die `cost_cents × voorraad` dekt (§5.3) |
| `reward_voucher` | `id`, `reward_id`, `code`, `release_week` (maandag), `release_day` (dag van de week waarop de voucher vrijkomt; spreiding over de week), `anchor_only` (gereserveerd voor accounts met een instellingsanker), `status` (unreleased/available/reserved/delivered/broken/void), `redemption_id?`, `replaces_voucher_id?` | Een code hoort na reservering bij precies één verzilvering; geïmporteerd per CSV; een vervanging is een nieuwe voucher op dezelfde verzilvering, met auditregel |
| `redemption` (verzilvering) | `id`, `user_id?`, `reward_id`, `voucher_id` (huidige), `points`, `points_from_referral`, `cost_cents`, `week_key`, `month_key`, `entry_id`, `status` (reserved/delivered/replaced/refunded), `created_at` | Gedeeltelijke unieke index op (`user_id`, `week_key`) `WHERE status IN ('reserved','delivered','replaced') AND user_id IS NOT NULL`: na `refunded` kan de student in dezelfde week opnieuw verzilveren; Σ `cost_cents` + individuele prijzen per `month_key` ≤ 1.500 (refunded telt niet); `points_from_referral ≤ floor(points / 2)` |
| `phone_verification` | `user_id`, `phone_hash`, `code_hash`, `expires_at`, `attempts` | Eén geverifieerd nummer per account; vijf pogingen |
| `support_ticket` | `id`, `user_id?`, `kind` (redemption_broken/session/other/external), `ref_id?`, `text?`, `label?` (uitbetalen/focus/vrienden/techniek/welzijn), `status` (open/resolved), `created_at`, `labeled_by?` | Bron van `support_labeled` (spec §7.1); `external` voor berichten die buiten de app binnenkwamen, alleen met label en datum |

### 3.4 Sociaal, challenges en prijzen

| Entiteit | Velden | Invarianten |
|---|---|---|
| `squad` | `id`, `name`, `name_status` (pending/ok/rejected/reported), `club_id?`, `admin_user_id`, `status` (building/active/archived), `arm_bonus` (A/B), `arm_belofte` (early/late), `arm_rest` (rest/continue), `assignment_block`, `streak`, `streak_before_break?`, `recovery_until_day?`, `low_activity_since_day?`, `merged_into?`, `created_at` | Armen vast vanaf aanmaak; een minderjarig lid krijgt persoonlijk A en `continue` (§5.1); `active` vanaf drie actieve leden; hersamenstellen na 7 dagen met < 2 actieven; archief na 14 dagen zonder actieve leden |
| `squad_membership` (lidmaatschap) | `id`, `squad_id`, `user_id?`, `role` (maker/member), `joined_at`, `active_from_day`, `left_at?`, `paused_since_day?`, `invite_id?` | Eén open lidmaatschap per gebruiker (unieke index waar `left_at IS NULL`); hoogstens zes open per squad |
| `user_day` | `user_id`, `focus_day`, `rev` (revisie, start bij 1), `verified_min` (alle voltooide minuten, ook boven 300), `counted_min`, `counted_min_final` (zonder open markeringen), `goal_min`, `goal_met`, `goal_met_final`, `goal_bonus_eligible` (doel gehaald met sessies die vóór 01:00 startten), `exam_day`, `goal_state` (none/pending/available/secured/lapsed/postponed/exam), `joker_used`, `vacation`, `closed_at?` | Ontstaat bij de eerste sessie van de dag of uiterlijk in de dagafsluiting; elke herberekening verhoogt `rev`; alleen geschreven via `UserDayRepository` (§12.2) |
| `squad_day` | `squad_id`, `focus_day`, `active_members`, `met`, `jokers`, `exam_days`, `result` (success/fail/frozen/vacation), `recovered`, `streak_after` | Eén rij per squad per dag; idempotent herberekenbaar |
| `duel` | `id`, `challenger_id`, `opponent_id?`, `invite_id`, `in_squad`, `status` (open/expired/running/pending_review/finished), `start_day`, `end_day`, `result?` (challenger/opponent/tie), `accepted_at?` | Per speler hoogstens één `open` of `running`; uitslag op het aantal dagen met `goal_met_final`; `in_squad = 0` alleen als beide spelers `18_plus` zijn; geen punten aan de uitslag (spec §4.5) |
| `club` (vereniging) | `id`, `name`, `city`, `declared_members`, `members_source_kind` (institution/board_grant/faculty/self), `members_source_ref`, `members_fixed_at`, `prize_eligible` (0 bij `self`), `agreement_ref`, `help_resources` (JSON: hulpbronnen van de instelling voor schadesignalen), `pool` (lt150/150_500/gt500), `join_code`, `status`, `created_by` | `code_cap = floor(1,1 × declared_members)`; koppelingen boven het plafond gaan naar de beheerder; geen code zonder `agreement_ref`; `declared_members` niet te wijzigen na `members_fixed_at`; ledental en soort bron openbaar op de ranglijst |
| `club_board_member` | `user_id`, `club_id`, `role`, `created_by` | Bestuursrol geeft alleen aggregaten (§6.4) |
| `club_membership` | `user_id?`, `club_id`, `linked_at`, `qr_source?`, `left_at?`, `pending_admin`, `ip_hash`, `net_class` | Eén open koppeling per gebruiker (**aanname**: de spec noemt "zijn vereniging" enkelvoud) |
| `challenge` | `id`, `type` (club_warmup/club_prize/performance), `title_nl/en`, `period_start_day`, `period_end_day`, `pool?`, `rules` (JSON: drempel, dagminuten, plaatsen), `status` (draft/published/running/review/final), `published_by?`, `final_by?`, `final_confirmed_by?` | Publiceren alleen met gedekte prijzen binnen de europlafonds; `final_confirmed_by ≠ final_by` (vier ogen) |
| `challenge_enrollment` (deelname) | `id`, `challenge_id`, `user_id?`, `club_id?`, `seat_no?`, `enrolled_at`, `status` (enrolled/achieved/failed/verified/rejected/withdrawn) | Prestatiechallenge: `seat_no ≤ plaatsen`; inschrijven alleen vóór de start |
| `challenge_score` | `challenge_id`, `club_id`, `week_start`, `participation_rate`, `intensity_min`, `linked_members`, `rank?`, `is_final`, `computed_at` | Alleen verenigingsniveau; geen kolom per lid |
| `prize` (prijs) | `id`, `kind` (earned_collective/earned_individual; de waarde `drawn` blijft in de `CHECK` als lege plek maar heeft geen route), `reward_kind` (`in_kind`/`service`), `challenge_id?`, `sample_id?` (verplichte steekproef van 20, §6.2), `description_nl/en`, `value_cents`, `partner_id`, `allocation_id`, `declaration_ref`, `min_age_band`, `winner_user_id?`, `winner_club_id?`, `status` (open/candidate/verified/delivered/rejected), `verified_by?`, `age_checked_by?`, `age_checked_at?`, `age_check_outcome?` (ok/failed), `delivery_contact_ref?`, `deliver_after` (+14 dagen) | Individueel ≤ 1.000; hoofdprijs ≤ 15.000; drempelprijs ≤ 7.500 (spec §4.3); nooit geld of vrij besteedbaar tegoed (zelfde soortregel als `reward`); bij `min_age_band = 18_plus` geen `verified` zonder `age_check_outcome = ok` |
| `prize_delivery_contact` | `id`, `prize_id`, `full_name`, `address`, `created_at` | Spec §4.7 stap 5: naam en adres voor levering; verwijderd 30 dagen na levering (**keuze**); nooit in export naar partners behalve voor de levering zelf |
| `referral` | `id`, `invite_id`, `inviter_id?`, `invitee_id?`, `status` (pending/review/vested/lapsed), `deadline_at` (+7 × 24 uur), `qualifying_sessions`, `vested_at?` | Max. 5 gevestigd per uitnodiger per kalendermaand; vesting pas na drie sessies én na `first_redeem_after` van de genodigde; zelfde `client_device_id` als de uitnodiger → `lapsed`; zelfde IP-hash binnen 24 uur (campus en mobiel CGNAT met hogere drempel, §4.5) of zelfde telefoonhash → `review` |
| `ambassador` | `id`, `code_invite_id`, `name_ref`, `is_board_member_of?` (club-id; moet leeg zijn bij een deelnemende vereniging), `cap_users`, `created_by` | Telling per spec §4.9 via een KPI-query; betaling buiten de app |
| `belofte` / `belofte_offer` | `id`, `user_id`, `days_per_week`, `min_per_day`, `witnesses` (squad/none), `start_day`, `end_day`, `status`, `reflection_action?`, `stake_interest?` / `user_id`, `arm`, `trigger` (early/late/outside), `due_day` (vroeg: eerste dag van de laatste tentamenweek van de vereniging; laat: dag na het aprilvenster), `offered_at?` | Geen grootboekpost hangt aan een Belofte (spec §4.12); vóór `offered_at` kan de gebruiker geen Belofte starten |
| `survey_response` | `id`, `pseudonym`, `moment` (intake/reflection/end_january/april), `items` (JSON met itemcodes en antwoordcodes), `skipped`, `created_at` | Geen vrije tekst behalve het vrije veld van de bonusregelvraag (ingekort); geen punten; bij `DELETE /me` verwijderd |
| `harm_signal` | `id`, `user_id?`, `code` (S1–S4), `focus_day`, `card_shown_at?`, `help_opened_at?` | Geen fraudegevolg; hoogstens één per code per 14 dagen; voor beheer alleen als telling per arm |
| `card` | `id`, `user_id`, `kind`, `ref_id`, `fields` (JSON), `token` (128 bits), `revoked_at?` | Geen kaart voor een sessie met `review_status = pending`; afkeuring zet `revoked_at` |
| `reminder_log` | `user_id`, `focus_day`, `kind` (goal_at_risk/streak_at_risk), `sent_at` | Uniek op (`user_id`, `focus_day`): hoogstens één herinnering per dag (spec §8, Should R1) |

### 3.5 Beheer en meting

| Entiteit | Velden | Invarianten |
|---|---|---|
| `audit_log` | `id`, `actor_ref`, `action`, `object_type`, `object_ref`, `reason`, `at`, `net_class` | Append-only via triggers; elke inzage van sessiegegevens door een beheerder schrijft een rij vóór het antwoord; verwijzingen naar personen zijn `HMAC(user_id, pepper_audit)`, nooit het ruwe id (§10.7) |
| `event` | `id`, `name`, `pseudonym?`, `server_at`, `props` (JSON), `release`, `arm_bonus?`, `arm_belofte?`, `arm_rest?`, `arm_prompt?`, `channel?`, `squad_id?` | Namen alleen uit de taxonomie in contracts (spec §7.1); geen e-mail, naam of IP in `props`; serverevents in dezelfde transactie als de mutatie (§8.1) |
| `event_pending` | `pre_pseudonym`, `name`, `server_at`, `props` | Events van pre-gebruikers; bij een geslaagde onboarding verplaatst naar `event` onder het pseudonym van de nieuwe gebruiker, bij `AGE_BELOW_MINIMUM` of na 24 uur verwijderd |
| `experiment_assignment` / `arm_switch` | `unit_type` (squad/solo), `unit_id`, `factor` (bonus/belofte/rest/prompt), `arm`, `stratum`, `block`, `seed_version`, `assigned_at` / `user_id`, `factor`, `from`, `to`, `reason` (join/merge/minor/opt_out/arm_b_stopped), `at` | Toewijzing deterministisch uit de seed (`core/experiments`, voorregistratie §9) en vergrendeld; wijziging alleen met logregel (spec §4.11) |
| `fraud_sample` / `fraud_sample_item` | `id`, `week_key`, `kind` (weekly/prize), `challenge_id?`, `club_id?`, `seed_version`, `drawn_at` / `sample_id`, `user_id?`, `stratum`, `checks` (JSON: anker, nummertype, patroon, contact), `judgement` (none/suspect/fraud), `reason_code`, `judged_by`, `judged_at` | Trekking reproduceerbaar uit seed en week; een oordeel boekt niets en opent hoogstens een markering met code `SAMPLE` |
| `vacation_pause`, `feature_flag`, `param_set` | periode / sleutel, aan-uit / versie, JSON, `effective_from` | Elke wijziging met auditregel; flags `referral`, `cards`, `duels`, `belofte`, `arm_b`, `rest_period`, `squad_prompt`, `no_points_mode`, `plus_door`, `reminders`, en `draws` als lege plek (altijd uit, geen route) |
| `job_run` | `job`, `run_key` (bijv. `day_close:2026-12-14`), `status`, `started_at`, `finished_at`, `step_results` (JSON) | (`job`, `run_key`) uniek: een job draait per dag precies één keer succesvol; een mislukte stap herstart vanaf die stap |
| `idempotency_record` | `key`, `user_id`, `route`, `request_hash`, `status_code`, `response`, `created_at` | 24 uur bewaard; zelfde sleutel met andere body → `IDEMPOTENCY_CONFLICT` |

**Relaties in één zin per kern.** Een gebruiker heeft apparaten, sessies, grootboekrekeningen (via `ledger_account_owner`), hoogstens één open squadlidmaatschap en hoogstens één open verenigingskoppeling. Een sessie heeft heartbeats, zichtbaarheidsgebeurtenissen, nul of meer markeringen (via `fraud_flag_session`) en precies één `earn_session`-post zodra ze voltooid is, plus eventuele aanvullingen of terugboekingen. Een partner heeft budgetten, een budget heeft allocaties, een allocatie dekt voorraad, een prijs of een spel. Een verzilvering verbindt een gebruiker, een voucher en een journaalpost. Een challenge heeft deelnames (personen of verenigingen) en scores per vereniging per week. Een wachtlijstaanmelding wordt hoogstens één uitnodiging.

## 4. Het sessieprotocol

### 4.1 Toestandsmachine

De toestandsmachine staat in `core/session/machine.ts` en draait in de browser. Ze is een pure reducer `(state, event) → [state, effects]`; effecten (heartbeat versturen, Wake Lock aanvragen, outbox schrijven) voert de web-app uit. Zo is de machine met Vitest te testen zonder DOM.

| Toestand | Betekenis | Uitgaande overgangen |
|---|---|---|
| `idle` | Geen sessie | `START_REQUESTED` → `starting` |
| `starting` | Wacht op server (sessie-id, nonce, servertijd); herhaalt met dezelfde `Idempotency-Key` | `STARTED` of `RESUMED` → `running`; `START_FAILED` → `idle` met fout |
| `running` | Pagina zichtbaar, heartbeats lopen | `HIDDEN` → `aborted_local`; `NET_LOST` → `running_offline`; `DURATION_REACHED` → `ending`; `USER_STOP` → `stopping`; `SERVER_ABORT` → `aborted` |
| `running_offline` | Zichtbaar, geen netwerk; alles naar de outbox | `NET_BACK` → `running` (eerst de openstaande heartbeat herhalen, dan de outbox); `HIDDEN` → `aborted_local`; `DURATION_REACHED` → `ending`; `GAP_LIMIT` (monotoon > 5 min sinds laatste bevestigde heartbeat) → `aborted_local` |
| `ending` | Einde gemeld, wacht op uitslag; herhaalt dezelfde eindmelding | `RESULT` → `completed` of `aborted` |
| `stopping` | Gebruiker bevestigde Stoppen; herhaalt dezelfde stopmelding | `RESULT` → `aborted` (`user_stop`) |
| `aborted_local` | Client weet dat de sessie stopte, server nog niet bevestigd | `RESULT` → `aborted` |
| `completed` / `aborted` | Eindtoestand met uitslag van de server | `RESET` → `idle` |

Een pauze bestaat niet. De spec sluit een pauze binnen een sessie en een terugkeervenster uit (§4.1, §8 Won't), en de toestandsmachine heeft er daarom geen toestand voor. Wat de client wel vastlegt, is hoe lang de pagina verborgen was als de student terugkomt (`return_after_abort`, met `hidden_duur_s`), zodat de founder na de pilot op data over een kort venster kan beslissen.

### 4.2 Wat de client vastlegt

Bij de eerste start in een browserprofiel maakt de client een `client_device_id` (UUID in IndexedDB) en registreert die met `POST /devices`; de server geeft een eigen `device_id` terug, uniek per combinatie van profiel en gebruiker. Daarna stuurt de client `POST /sessions` met een `Idempotency-Key`, geplande duur, `device_id`, `standalone` (`display-mode: standalone`), `wakelock_supported`, `navigator.webdriver`, de clientklok en de monotone klok. De server antwoordt met `session_id`, `nonce`, `server_start_at`, `planned_end_at` en het heartbeatinterval van 30 seconden. Vanaf dat moment telt de client verstreken tijd als `performance.now() − mono_start`; de getoonde resterende tijd komt daaruit, niet uit `Date.now()`.

| Signaal | Bron in de browser | Wanneer vastgelegd | Doel |
|---|---|---|---|
| Zichtbaarheid | `document.visibilityState`, `visibilitychange` | Bij elke wijziging en in elke heartbeat | Afbreken op `hidden` (spec §4.1) |
| Pagina weg | `pagehide` (met `persisted`), `pageshow` | Bij elke wijziging | Afbreken; herladen herkennen |
| Wake Lock | `navigator.wakeLock.request('screen')`, `release`-event | Bij aanvraag, verkrijging, weigering, vrijgave; opnieuw na elke terugkeer naar `visible` | Uitleg aan student; signaal |
| Focus van venster | `blur`, `focus` | Alleen desktop | Zwak signaal (rapport 09 §3.2), nooit afbreken |
| Netwerk | `online`, `offline`, mislukte fetch | Bij wijziging | Gaten verklaren |
| Monotone tijd | `performance.now()` | Bij elke gebeurtenis | Gatdekking, klokvergelijking |
| Clientklok | `Date.now()` | Bij elke gebeurtenis | Alleen klokafwijking (H4) |
| Eerste aanraking na einde | `pointerdown`/`keydown` of `visible` na het einde | Eenmalig | Claimvertraging (H9) |

Er zijn twee tellers. Elke gebeurtenis krijgt een oplopend `ev_seq`; een gebeurtenis die twee keer binnenkomt, wordt op (`session_id`, `ev_seq`) ontdubbeld, dus gebeurtenissen zijn vanzelf idempotent. Elk online heartbeatverzoek krijgt een oplopend `seq`, dat de nonce-keten draagt. Een heartbeat bevat de laatst ontvangen nonce, `seq`, `mono_ms`, `client_ts`, de huidige zichtbaarheid en Wake Lock-status, en alle outbox-gebeurtenissen (inclusief gebufferde heartbeats) sinds de vorige bevestiging. De server antwoordt met een nieuwe nonce en de servertijd. De client stuurt een heartbeat met een nieuwe `seq` pas als het vorige verzoek een antwoord kreeg; tot dan herhaalt hij het openstaande verzoek ongewijzigd (§4.7) en zet hij nieuwe waarnemingen in de outbox. Bij `hidden` probeert de client met `navigator.sendBeacon` direct `POST /sessions/:id/events` te sturen; lukt dat niet, dan staat de gebeurtenis in de outbox en gaat ze mee met het eerstvolgende contact.

### 4.3 Hoe de server valideert

De validatie is één pure functie, `core/session/verify.ts`:

```ts
evaluateSession(input: {
  session: SessionHeader;            // planned_min, server_start_at, planned_end_at, start mono
  heartbeats: Heartbeat[];           // online, gebufferd en resume, met server_recv_at
  events: VisibilityEvent[];
  endReport?: EndReport;             // mono_ms, client_ts, server_recv_at
  outages: OutageWindow[];           // storingen aan onze kant (§4.8)
  now: Instant;                      // servertijd van evaluatie
  params: SessionParams;             // spec §4.1
}): SessionVerdict                   // pending | completed | aborted(reason, at) | review(outage) + flags + metrics
```

De API roept haar aan bij elke heartbeat, bij het einde, bij een gebeurtenissenbatch en in een sweep-job elke minuut voor sessies zonder contact. De functie is idempotent: dezelfde invoer geeft dezelfde uitspraak, zodat een herhaalde aanroep niets dubbel boekt. Ze werkt in vaste stappen.

1. **Nonce-keten.** Een online heartbeat is geldig als ze de laatst uitgegeven nonce draagt; de server bewaart alleen de hash daarvan, plus de hash van de vorige nonce voor herhaalde verzoeken (§4.7). Een onbekende nonce, of de vorige nonce met een andere `seq` dan `last_seq`, levert `NONCE_INVALID` op en de heartbeat telt niet als contact. Gebufferde heartbeats dragen de laatste nonce die de client kende; ze bewijzen geen contact, alleen wat het toestel zegt dat er gebeurde.
2. **Afbreken op zichtbaarheid.** De vroegste `hidden` of `pagehide` met `mono_ms` vóór het einde breekt de sessie af met code `hidden`. Het afbreektijdstip is `server_start_at + (mono_hidden − mono_start)`, begrensd tussen de laatste geldige heartbeat ervoor en het moment van ontvangst. Omdat een afgebroken sessie geen punten oplevert, bepaalt dit tijdstip alleen de uitleg ("Je hield 18 minuten vol").
3. **Gaten.** De server bekijkt de intervallen tussen opeenvolgende geldige online heartbeats in servertijd, inclusief start tot eerste heartbeat en laatste heartbeat tot einde. De regels zijn die van spec §4.1, één op één in `params`:

| Gat (servertijd) | Dekkend gebufferd log? | Uitkomst |
|---|---|---|
| ≤ 90 s | n.v.t. | Telt |
| > 90 s en ≤ 300 s | Ja: gebufferde heartbeats met onderlinge monotone afstand ≤ 90 s, geen `hidden`, monotone verstreken tijd binnen 5 s van de serververstreken tijd | Telt; duur opgeteld bij `covered_gap_s` |
| > 90 s | Nee | Afgebroken op de laatste geldige heartbeat (`heartbeat_gap`) |
| > 300 s | Ook met log | Afgebroken op de laatste geldige heartbeat (`heartbeat_gap`) |
| Log toont `hidden` in het gat | — | Afgebroken op het tijdstip van `hidden` |
| Gat valt (deels) in een geregistreerde `outage` | — | Niet afgebroken: uitkomst `review(outage)`, de sessie gaat naar de wachtrij (spec §4.1) |

4. **Einde.** Een eindmelding is geldig als `server_recv_at − server_start_at ≥ planned − 30 s`, of als de client offline was bij het einde en het gebufferde log het laatste gat volgens de tabel dekt, met een monotone eindtijd ≥ geplande duur. Komt de eindmelding later dan `planned_end_at + 10 min` zonder heartbeats ertussen, dan is de uitkomst `late_end`. Komt er helemaal niets, dan sluit de sweep-job de sessie op `planned_end_at + 10 min` (spec §4.1: "de server beslist pas als de client terug is of als de geplande eindtijd plus 10 minuten zonder herstel verstreken is") met `heartbeat_gap` op de laatste geldige heartbeat. Deze 10 minuten zijn de parameter `end_grace_min` in `core/params`; de dagafsluiting rekent ermee (§6.1).
5. **Geverifieerde minuten.** Een voltooide sessie krijgt `verified_min = planned_min`; er bestaan geen gedeeltelijke minuten. Hoeveel daarvan punten oplevert, bepaalt daarna `reconcileDay` met het puntenplafond van 300 minuten per dag (§5.1). De oefensessie van één minuut doorloopt hetzelfde protocol, maar boekt niets en telt nergens mee; dat `planned_min = 1` alleen samengaat met `practice = true` (en omgekeerd), dwingen het contract en een `CHECK` af.
6. **Markeringen per sessie.** H1 (`webdriver` of headless user agent), H3 (`covered_gap_s > 10%` van de geplande duur) en H4 (klokafwijking > 5 min) worden bij de uitspraak bepaald, via `FlagService.raise`. Een gemarkeerde voltooide sessie krijgt `review_status = pending` en haar punten gaan naar `pending_session`.

### 4.4 Randgevallen

**Klokverschil.** Per heartbeat is `skew = client_ts − (server_recv_at − rtt/2)`, met de round-trip van de vorige heartbeat; de mediaan is `clock_skew_ms`. Een verzette klok raakt de punten niet; boven 5 minuten markeert hij (H4).

**Offline.** De sessie loopt in `running_offline` door met een kleine melding ("Geen verbinding; je sessie loopt door"); na herstel gaat de outbox in volgorde naar de server. Na vijf minuten offline weet de client zelf dat de sessie verloren is (`GAP_LIMIT`) en zegt dat direct, zodat niemand 40 minuten doorwerkt voor niets. Dat is de eerlijke grens van offline-first hier: UI en log overleven elk netwerkverlies, de beloning niet.

**Herladen.** Herladen vuurt `pagehide`, en spec §4.1 telt dat als afbreken. Na het herladen leest de app de sessie uit IndexedDB, stuurt de `pagehide` door en toont de afbreekuitleg. Een `beforeunload`-waarschuwing tijdens de sessie voorkomt onbedoeld herladen; het detail `reload` (`PerformanceNavigationTiming.type`) maakt de frequentie meetbaar (open vraag 2).

**Tabwissel en vergrendelen.** Ander tabblad, andere app, scherm uit, laptop dicht of venster geminimaliseerd geven `hidden` (rapport 09 §3.1) en breken af. Een melding zonder openen en een ander venster over een zichtbaar tabblad doen dat niet; daar wordt alleen `blur` vastgelegd.

**Dubbele tabs.** De Web Locks API (`navigator.locks.request('rw-session-owner')`) kiest één eigenaartab; andere tabs volgen via een `BroadcastChannel` en tonen "Je sessie loopt in een ander tabblad", zonder start of heartbeats. Vraagt hetzelfde `device_id` toch een start terwijl er een sessie loopt, dan geeft de server die lopende sessie terug met een nieuwe nonce (`resumed: true`, §4.7) in plaats van een fout; de oude nonce van een eventuele andere tab is daarmee ongeldig, zodat er altijd één eigenaar is. Een start vanaf een ander `device_id` beëindigt de lopende sessie met `second_session` (spec §4.1).

**Over 04:00 en storingen.** De focusdag is de dag van `server_start_at`. Een sessie die om 03:55 start, hoort bij de dag ervoor, ook als ze pas om 05:25 eindigt; de dagafsluiting wacht daarom tot 05:45 (§6.1). Bij een storing aan onze kant registreert de beheerder een `OUTAGE`-periode; sessies met een gat daarin gaan naar de wachtrij in plaats van af te breken (spec §4.1), en een sessie die al was afgebroken voordat de storing werd geregistreerd, kan worden hersteld (§4.8).

### 4.5 Heuristieken

De heuristieken H1–H11 liggen vast in spec §6.3; de architectuur bepaalt alleen waar en wanneer ze draaien. Elke heuristiek is een pure functie in `core/fraud` met de drempels uit `params`, zodat een aanpassing (alleen met besluit van de founder) één parameterversie is en beide cijfers, met en zonder aanpassing, te reproduceren zijn. Een heuristiek die meerdere sessies of accounts raakt, maakt één `fraud_flag` met een rij in `fraud_flag_session` per geraakte sessie.

**Netklasse in plaats van een lijst gehashte adressen.** Een HMAC van een IP-adres valt niet te toetsen aan een IP-bereik. Daarom bepaalt de API bij ontvangst van elk verzoek dat een IP-hash opslaat, met het ruwe adres alleen in het geheugen, een netklasse: `campus` (eduroam en bibliotheekwifi van de pilotsteden), `mobile_cgnat` (mobiele providers die veel klanten achter één adres zetten) of `other`. De bron is een CIDR-lijst in `params` (`net_classes: [{ cidr, class, source, checked_at }]`), met per regel een bronvermelding. De klasse komt naast `ip_hash` in de tabel en het ruwe adres wordt nergens bewaard of gelogd (§10.9). De CIDR-bereiken zelf zijn nog niet verzameld: campusbereiken vragen we op bij de IT-diensten van de pilotinstellingen, mobiele bereiken komen uit de openbare registratie bij RIPE NCC (**open vraag 17**; ik verzin hier geen bereiken).

| Code | Draait | Onderwerp van de markering | Invoer | Netklasse |
|---|---|---|---|---|
| H1 | Bij de uitspraak | Sessie | `webdriver`, `ua_class` | — |
| H2 | Dagafsluiting (§6.1) | Sessies van de betrokken accounts in het venster | Accounts per `ip_hash` per 24 uur | `campus` en `mobile_cgnat` met de hogere drempel `h2_shared_threshold` |
| H3 | Bij de uitspraak | Sessie | `covered_gap_s`, `planned_min` | — |
| H4 | Bij de uitspraak | Sessie | `clock_skew_ms` | — |
| H5 | Dagafsluiting | Sessies van de derde dag | `user_day.verified_min` over 3 dagen (> 480) | — |
| H6 | Dagafsluiting | Nachtsessies van die week | Sessies 01:00–06:00 per week | — |
| H7 | Bij het actief worden van de squad en dagelijks | Squad, plus sessies van haar leden sinds registratie | `registration_ip_hash` en registratiemomenten van leden | Bij `campus` of `mobile_cgnat` de hogere drempel `h7_shared_threshold` |
| H8 | Bij telefoonverificatie | Account | `phone_hash` tegen `blocked_phone_hash` | — |
| H9 | Weekafsluiting maandag 05:45 | Sessies van de afgelopen week | `claim_delay_s` | — |
| H10 | Elk uur | Vereniging, plus de nieuwe koppelingen | Koppelingen per 48 uur en hun `ip_hash` | `campus` en `mobile_cgnat` tellen mee met de hogere drempel `h10_shared_threshold` |
| H11 | Bij elke verzilvering | Accounts | Verzilverende accounts per `client_device_id` per `week_key` (> 1) | — |

**Hogere drempel in plaats van overslaan (besluit founder na ronde 1, J2).** Versie 1.1 sloeg `campus` en `mobile_cgnat` bij H2, H7 en H10 over, met als reden dat een hogere drempel een getal vraagt dat we niet kunnen onderbouwen. De jurist wees erop dat overslaan ook een getal is, namelijk oneindig, en dat precies daar de verenigingsprijs de grootste fraudeprikkel geeft. Daarom tellen die adressen nu mee met drie aparte drempels in `params` (`h2_shared_threshold`, `h7_shared_threshold`, `h10_shared_threshold`). De getallen komen uit de red-teamdag (vóór 25 november) en liggen vóór 2 december op de seed vast (voorregistratie §7.4). Acceptatietest van WP-6: op de seed met een gesimuleerde UB-NAT (twintig eerlijke studenten achter één campusadres, verspreid over de dag) en een gesimuleerd mobiel adres markeren H2, H7 en H10 niet; het red-teamscenario (tien accounts achter een hotspot, geregistreerd binnen een uur, in één vereniging) markeert wel; vier accounts achter één `other`-adres markeren ook. Omdat markeringen detectie meten en geen fraude, is de go/no-go-maat de steekproef (§6.5); het aandeel markeringen is alleen de wachtrijlast.

Markeert een heuristiek achteraf een sessie waarvan de punten al beschikbaar waren, dan verschuift de server niets automatisch: de punten blijven staan tot het besluit, de markering gaat de wachtrij in, en pas een afkeuring door een mens boekt een `reverse`. Zo blijft de regel "heuristieken markeren, een mens beslist" ook bij de batchheuristieken waar.

### 4.6 Wat de web-MVP eerlijk claimt, in de techniek

De claim uit spec §6.1 staat in de onboarding, op "Hoe we tellen" en op de verificatiepagina (spec §4.8). Vier technische borgen houden haar waar. Het woord "bewezen" komt in geen i18n-sleutel voor (lintregel). Elke websessie heeft `verification_level = 1`, waarvoor `core/params` alleen punten, catalogusitems tot €5 van een toegestane soort (§5.3) en verdiende prijzen in natura binnen spec §4.3 toestaat. Geen tabel kent een soort beloning die geld of vrij besteedbaar tegoed is (`CHECK` op `reward.kind` en `prize.reward_kind`). En de e2e-suite legt vast dat een headless browser met overschreven `navigator.webdriver` een ongemarkeerde sessie haalt: de plafonds zijn de echte verdediging, niet H1 (rapport 09 §3.3, rapport 02 hoofdstuk 4).

### 4.7 Herhaalde verzoeken en verloren antwoorden

Op mobiel netwerk en bibliotheekwifi gaat regelmatig een antwoord verloren nadat de server het verzoek al verwerkte. Zonder voorziening kost dat een eerlijke student punten: de server heeft de nonce al geroteerd, de herhaling met de oude nonce krijgt `NONCE_INVALID`, en na twee van zulke herhalingen plus één gemiste heartbeat is het gat groter dan 90 seconden. Elke sessieroute is daarom idempotent op (`session_id`, `seq`) of op een `Idempotency-Key`. De regels staan als pure functie in `core/session/retry.ts` en gelden voor client en server.

| Route | Eerste verzoek | Herhaling | Wat de server teruggeeft |
|---|---|---|---|
| `POST /sessions` | Met `Idempotency-Key`; maakt de sessie | Zelfde sleutel en zelfde body | Het opgeslagen antwoord (zelfde `session_id`, de nonce die nog geldig is) |
| `POST /sessions` | Zonder bekende sleutel, terwijl op hetzelfde `device_id` een sessie loopt | — | `200 { …, resumed: true }` met de lopende sessie en een nieuwe nonce; `prev_nonce_hash` wordt de oude; een `resume`-heartbeatrij legt het contactmoment vast; gaten worden met de gewone regels beoordeeld, dus hervatten levert niets op wat een heartbeat niet ook had opgeleverd |
| `POST /sessions/:id/heartbeats` | Huidige nonce, `seq = last_seq + 1` | Vorige nonce, zelfde `seq` als `last_seq` | Het gecachete antwoord (`last_response`), met de nonce die de server toen uitgaf; geen nieuwe heartbeatrij, want het origineel telde al als contact |
| `POST /sessions/:id/heartbeats` | — | Vorige nonce, andere `seq` | `NONCE_INVALID` |
| `POST /sessions/:id/end` | Huidige nonce | Vorige of huidige nonce, sessie al gesloten door deze eindmelding | `200` met de opgeslagen uitspraak (`verdict`) |
| `POST /sessions/:id/stop` | Huidige nonce | Idem | `200` met de opgeslagen uitspraak |
| `end` of `stop` | — | Sessie gesloten door iets anders (sweep, `hidden`, tweede toestel) | `409 SESSION_CLOSED` met de opgeslagen uitspraak in `details.verdict`, zodat de client de uitleg kan tonen |
| `POST /sessions/:id/events` | — | Elke herhaling | `202`; gebeurtenissen worden op `ev_seq` ontdubbeld |

**Rate limit op `seq`, niet op verzoeken.** De limiet "één heartbeat per 10 seconden" geldt voor een nieuwe `seq`. Herhalingen van dezelfde `seq` vallen eronder niet, met een ruime grens tegen misbruik (§10.2). Gebufferde heartbeats gaan bij een outbox-flush als gebeurtenissen mee in één verzoek en tellen dus niet als aparte heartbeats.

**Wat de client doet.** De client herhaalt een openstaand verzoek ongewijzigd met exponentiële wachttijd (1, 2, 4, 8 seconden, dan elke 10 seconden), stuurt pas een nieuwe `seq` na een antwoord, en gaat na drie mislukte pogingen naar `running_offline`, waar hij gebufferde heartbeats schrijft. Komt het netwerk terug, dan herhaalt hij eerst het openstaande verzoek, krijgt de geldige nonce, en stuurt daarna `seq + 1` met de outbox.

**E2E.** Playwright laat de server een verzoek verwerken en gooit het antwoord weg (`const r = await route.fetch(); await route.abort('connectionreset')`). Er zijn scenario's voor een gedropt antwoord op start, op twee heartbeats achter elkaar, op einde en op stop (§11).

### 4.8 Herstel van een sessie

Een sessie die al door de sweep of een `heartbeat_gap` is afgebroken, kan alsnog voltooid blijken: een storing aan onze kant wordt later geregistreerd, of een melding via "Klopt dit niet?" is gegrond omdat een gebufferd log alsnog binnenkwam (spec §6.4). Daarvoor is er één beheerhandeling, `restore_session`, met een redencode (`outage`, `late_log`, `appeal_upheld`) en een auditregel. Ze draait `evaluateSession` opnieuw met de outage-context of het nagekomen log. Is de uitkomst `completed`, dan zet de transactie de sessie van `aborted` op `completed` (`restored_by`, `restored_reason`), roept `reconcileDay` aan voor de focusdag (die `earn:{session_id}` en een eventuele doelbonus boekt, §5.1) en schrijft het event `session_completed` met `restored: true`. Is de uitkomst niet `completed`, dan blijft de afbreking staan en ziet de student de uitleg. Herstel kan alleen zolang de periode van een challenge-uitslag niet definitief is, voor zover het die uitslag raakt (spec §6.5).

## 5. Puntenmodel

### 5.1 Journaal en boekingsregels

Elke mutatie uit spec §4.2 is een journaalpost met vaste regels. De regels staan als data in `core/ledger/rules.ts`; de API schrijft ze in één SQLite-transactie, samen met de wijziging die ze veroorzaakt (de sessie-uitspraak, de verzilvering, het besluit), via `LedgerService.post` (§12.2). Rekeningen in de tabel zijn de rekeningen van de gebruiker, opgezocht via `ledger_account_owner`.

| Type | Debet | Credit | Idempotentiesleutel |
|---|---|---|---|
| `earn_session` (niet gemarkeerd) | `system:issuance` | `user:available_own` | `earn:{session_id}` |
| `earn_session` (gemarkeerd) | `system:issuance` | `user:pending_session` | `earn:{session_id}` |
| `earn_topup` (vrijgekomen daglimiet na een afkeuring, §5.1 daglimiet) | `system:issuance` | `user:available_own` of `user:pending_session` | `earn_topup:{session_id}:r{rev}` |
| `release_flag` | `user:pending_session` | `user:available_own` | `release:{flag_id}:{session_id}` |
| `reverse` (uit afwachting) | `user:pending_session` | `system:reversed` | `reverse:{flag_id}:{session_id}` |
| `reverse` (al beschikbaar) | `user:available_own` | `system:reversed` | `reverse:{flag_id}:{session_id}` (saldo mag negatief, spec §4.2) |
| `goal_bonus` (arm A) | `system:issuance` | `user:available_own` (of `user:pending_session` als het doel alleen dankzij gemarkeerde minuten gehaald is) | `goal_bonus:{user}:{day}`; na een eerdere terugboeking `goal_bonus:{user}:{day}:r{rev}` |
| `goal_bonus_release` | `user:pending_session` | `user:available_own` | `goal_bonus_release:{user}:{day}:r{rev}` |
| `goal_bonus_reverse` | `user:available_own` of `user:pending_session` | `system:reversed` | `goal_bonus_reverse:{user}:{day}:r{rev}` |
| `goal_budget_grant` (arm B) | `system:issuance` | `user:pending_goal_budget` | `goal_grant:{user}:{week}` |
| `goal_budget_secure` | `user:pending_goal_budget` | `user:available_own` | `goal_secure:{user}:{day}` |
| `goal_budget_lapse` | `user:pending_goal_budget` | `system:lapsed` | `goal_lapse:{user}:{day}` |
| `goal_secure_reverse` (doel na afkeuring niet meer gehaald) | `user:available_own` | `system:reversed` | `goal_secure_reverse:{user}:{day}:r{rev}` |
| `goal_lapse_reverse` (doel na vrijgave, herstel of beroep alsnog gehaald) | `system:lapsed` | `user:available_own` | `goal_lapse_reverse:{user}:{day}:r{rev}` |
| `redeem` | `user:available_own` en `user:available_referral` | `system:redeemed` | `redeem:{redemption_id}` |
| `redeem_refund` ("Werkt niet", punten terug) | `system:redeemed` | `user:available_own` en `user:available_referral` (zelfde verdeling) | `redeem_refund:{redemption_id}` |
| `adjust` | naar richting | naar richting | `adjust:{appeal_id}` of `adjust:{admin_action_id}` |
| `referral_pending` | `system:issuance` | `user:referral_unvested` | `ref_pending:{referral_id}:{role}` |
| `referral_vest` | `user:referral_unvested` | `user:available_referral` | `ref_vest:{referral_id}:{role}` |
| `referral_lapse` | `user:referral_unvested` | `system:lapsed` | `ref_lapse:{referral_id}:{role}` |
| `expire` | `user:available_*`, `user:pending_*`, `user:referral_unvested` | `system:expired` | `expire:{account_set}:{reason}:{date}` |

`rev` is de revisie van de `user_day`-rij die door het besluit ontstaat. Een besluit, herstel of beroep verhoogt `rev` één keer; alle posten die het veroorzaakt, dragen die `rev`. Herhaalt de transactie zich, dan bestaan de sleutels al en geldt de post als "al gedaan". Komt er later een nieuw besluit over dezelfde dag, dan heeft dat een nieuwe `rev` en dus nieuwe sleutels. De oude fout, één sleutel per markering voor een markering over meerdere sessies, kan niet meer optreden: elke sessiepost heeft `{flag_id}:{session_id}` in de sleutel.

**Eén functie voor sessie-einde en besluit: `reconcileDay`.** In versie 1.0 stond niet welke posten volgen als een besluit `user_day` herberekent. Nu loopt elke wijziging die de minuten of het doel van een dag kan raken, door dezelfde pure functie in `core/ledger/reconcile.ts`:

```ts
reconcileDay(input: {
  day: FocusDay;
  arm: 'A' | 'B' | null;              // null buiten het seizoen of zonder doelbonus
  inSeason: boolean;                  // uit params.goal_bonus_season en vacation_pause
  goalMin: number;
  sessions: DaySession[];             // alle sessies van de dag: start, status, review_status, verified_min
  booked: BookedDay;                  // per sessie en voor het doel: wat het journaal nu op welke rekening heeft
  cause: Cause;                       // session_end | flag_decision(flag_id) | restore | appeal | day_close
  rev: number;
  params: LedgerParams;               // puntenplafond 300, nachtregel 01:00–04:00
  examDay: boolean;                   // tentamendag (spec §3.13)
  earnArm: 'earn' | 'rest';           // rustperiode: geen earn_session na 18 januari 04:00 (spec §3.16)
}): { userDay: UserDayDraft; entries: JournalEntryDraft[] }
```

De functie rekent de gewenste eindtoestand uit en geeft het verschil met wat geboekt is terug als posten uit de tabel hierboven. Ze schrijft nooit zelf; de aanroeper boekt de posten in dezelfde transactie als het besluit. Ze kent vijf regels.

| Regel | Gewenste toestand | Posten bij verschil |
|---|---|---|
| Puntenplafond | Sessies die tellen (voltooid, niet afgekeurd), op volgorde van `server_start_at`, krijgen `counted_min` tot samen 300; in de rustperiode (`earnArm = rest`, focusdag ≥ 18 januari) is `counted_min` 0 en wordt geen `earn_session` geboekt, terwijl `verified_min`, dagdoel en streak gewoon tellen; een sessie die eerder de limiet al kreeg, verliest nooit minuten door een later herstelde sessie: die krijgt alleen wat over is | `earn_session` bij de eerste toekenning, `earn_topup` als door een afkeuring ruimte vrijkomt voor een eerder afgetopte sessie; nooit een negatieve aanvulling |
| Sessiepunten | Niet gemarkeerd of vrijgegeven: `available_own`; open markering: `pending_session`; afgekeurd: 0 | `release_flag` of `reverse` per (`flag_id`, `session_id`) |
| Doel arm A | Doel gehaald met finale minuten uit sessies met `late_start = 0`: bonus `available_own`; alleen dankzij gemarkeerde minuten: `pending_session`; niet gehaald, of alleen dankzij nachtsessies: geen bonus | `goal_bonus`, `goal_bonus_release` of `goal_bonus_reverse` |
| Doel arm B | Doel gehaald met finale minuten uit sessies met `late_start = 0`: `secured`; alleen dankzij gemarkeerde minuten: `postponed` (de 20 blijven in `pending_goal_budget`, geen lapse); niet gehaald (ook alleen dankzij nachtsessies) na de dagafsluiting: `lapsed`; tentamendag zonder gehaald doel: `exam` (de 20 vervallen met type `goal_budget_lapse` en redencode `exam_day`, zonder melding) | `goal_budget_secure`, `goal_budget_lapse`, `goal_secure_reverse` of `goal_lapse_reverse` |
| Minderjarigen en afmelding | `age_band = 16_17` of `research_opt_out_at` gezet: persoonlijk arm A en `earnArm = earn`, ongeacht de squad | Geen afwijkende posten; de arm komt uit `core/experiments` |
| Seizoen | Buiten `params.goal_bonus_season` (focusdagen 2 december 2026 tot en met 17 januari 2027, de laatste dag vóór maandag 18 januari 04:00, spec §4.2) en in de vakantiepauze: geen doelbonus en geen budget | Geen doelposten; een besluit over een seizoensdag ná het seizoen boekt wel de correctie van die dag |

**Boekingsmoment van de doelbonus.** De doelbonus wordt geboekt bij het sessie-einde, zodra de sessie die het doel haalt voltooid is (Levitt e.a. 2016 via businessplan §4: beloning direct na de prestatie). Het einde roept `reconcileDay` aan met `cause = session_end`; die boekt dan `earn_session` en, als het doel nu gehaald is, `goal_bonus` (arm A) of `goal_budget_secure` (arm B). De dagafsluiting is het vangnet: ze roept `reconcileDay` met `cause = day_close` aan voor elke gebruiker met activiteit of een open weekbudget, boekt wat bij het einde misliep, en boekt in arm B de `goal_budget_lapse` voor een gemist doel. Beide paden controleren de seizoensvlag uit `params` op de focusdag, niet op het boekingsmoment: een sessie van zondag 17 januari die na 04:00 op maandag eindigt, krijgt de bonus nog.

**Wat er na een besluit gebeurt.** `FlagService.decide` zet de markering en de `review_status` van de geraakte sessies, verhoogt `rev` van elke geraakte `user_day` en roept daarvoor `reconcileDay` aan met `cause = flag_decision(flag_id)`. Een sessie met meerdere markeringen komt pas vrij als de laatste open markering vrijgegeven is; de eerste afkeuring keurt haar af. Daarna herberekenen de eigenaars van de afgeleide tabellen (`squad_day`, challenge-scores, Belofte, duel) hun rijen voor de geraakte dagen, zolang de periode niet definitief is (§6.1). Alleen routes onder `/admin` roepen `decide` aan, dus elke negatieve post hangt aan een menselijk besluit (§10.8).

Het saldo in de app volgt de drie delen van spec §3.4: *beschikbaar* is `available_own + available_referral`, *in afwachting* is `pending_session + pending_goal_budget`, *referral, nog niet vrij* is `referral_unvested`. Een `adjust` vraagt altijd een redencode uit een vaste lijst en een auditregel. De invariant dat elke post op nul sluit, controleert de transactiehelper vóór de commit; de nachtelijke controles staan in §5.5.

### 5.2 Regels rond verzilvering

**Inverdienperiode en wachttijd.** De eerste verzilvering kan pas na 300 geverifieerde minuten (spec §4.2). De server berekent die uit sessies, niet uit punten: de som van `counted_min` (dus met het dagplafond van 300) van voltooide sessies met `review_status` in (none, released). Bonus- en referralpunten tellen daardoor vanzelf niet mee, en gemarkeerde minuten pas na vrijgave. Op het moment dat de som 300 haalt, zet de dagafsluiting `earn_in_reached_at` en `first_redeem_after = earn_in_reached_at + 7 dagen` (founder J3). Tot die datum weigert de verzilvering met `FIRST_REDEEM_HOLD`, en staat het account in de beheerlijst "eerste verzilveringen" met sessiepatroon, anker, nummertype en H11-overlap. Een beheerder kan een markering openen; er is geen automatische weigering. Na de eerste verzilvering speelt de wachttijd niet meer.

**Telefoon.** `POST /me/phone/start` vraagt bij de sms-verwerker het nummertype op (interface `SmsSender.lookupLineType`); alleen `mobile` wordt geaccepteerd (`PHONE_TYPE_NOT_ALLOWED`). In de testimplementatie bepaalt een vaste tabel het type.

**Weekplafond en maandplafond.** `week_key` is de maandag van de focusweek (maandag 04:00 tot maandag 04:00), `month_key` de kalendermaand in Europe/Amsterdam. Een gedeeltelijke unieke index op (`user_id`, `week_key`) in `redemption`, alleen over de statussen `reserved`, `delivered` en `replaced`, maakt een tweede verzilvering in dezelfde week onmogelijk, ook bij gelijktijdige verzoeken, maar laat een nieuwe verzilvering toe nadat een kapotte code met `redeem_refund` is teruggeboekt. Een vervangende code (spec §4.3: "een nieuwe code of de punten terug") is een nieuwe `reward_voucher` met `replaces_voucher_id` op dezelfde verzilvering; de oude voucher wordt `broken`, de verzilvering `replaced`, met een auditregel, en er volgt geen nieuwe journaalpost. Het europlafond van €15 per persoon per maand telt verzilveringen (behalve `refunded`) en toegekende individuele prijzen samen (spec §4.3).

**De verzilvering als één transactie** (spec §3.4 stap 5). `BEGIN IMMEDIATE` in SQLite geeft één schrijver tegelijk en vervangt de rijvergrendeling per account. Binnen de transactie: account actief en telefoon geverifieerd; inverdienperiode gehaald en `first_redeem_after` voorbij; geen actieve verzilvering in deze `week_key`; maandtotaal plus kostprijs ≤ €15; een voucher met status `available` voor deze week en vandaag vrijgegeven (`release_day ≤` vandaag), waarbij `anchor_only`-vouchers alleen naar accounts met een instellingsanker of geverifieerd mobiel nummer gaan; beschikbaar saldo voldoende, waarbij hoogstens de helft van de puntenprijs uit `available_referral` mag komen (spec §4.9); dan de journaalpost, de voucherreservering en de verzilveringsrij. Faalt één controle, dan wordt niets geschreven en volgt een specifieke foutcode (§8.3).

**Vervaldatum.** Het verval na 12 maanden zonder voltooide sessie is niet gebouwd (spec §4.2). Het grootboek kent het type `expire` en de rekening `system:expired` al, zodat de latere job alleen boekingen toevoegt. Verwijdert een gebruiker zijn account, dan boekt de server eerst alle saldi van zijn rekeningen naar `system:expired` met type `expire` en redencode `account_deleted`, en leegt daarna `ledger_account_owner` (§10.7).

### 5.3 Budgetdekking en soorten in de catalogus

Een `partner_budget` bestaat alleen met een documentverwijzing (geboekt = gefactureerd of getekend, spec §4.3). Het vrije budget is `Σ (booked_cents − cancelled_cents) × reward_pct / 100 − Σ allocaties`, en dat getal mag nooit negatief worden: de functie `allocate()` draait in een transactie en weigert met `COVERAGE_INSUFFICIENT`. Allocaties zijn append-only; een vrijgave is een negatieve allocatie met `reverses_id`, redencode en auditregel. Een budget annuleren (deels of geheel) kan alleen als de vrije ruimte het geannuleerde deel dekt. Is dat niet zo, dan zet de beheerder eerst de getroffen items offline en geeft hun niet-gereserveerde voorraad vrij (negatieve allocaties); al verstrekte codes blijven geldig (spec §4.3: "Partner trekt zich terug"). De API weigert anders met `COVERAGE_INSUFFICIENT`.

Een catalogusitem publiceren betekent: voorraad importeren (CSV met codes), een allocatie van `cost_cents × aantal codes` maken, en pas daarna de status `published`. Een prijs voor een challenge werkt hetzelfde.

**Geen geld en geen vrij besteedbaar tegoed, ook niet via een omweg.** Een cadeaukaart van €5 die overal te besteden is, zou onder de grens van €5 door de catalogus gaan en is in feite een cash-out (businessplan besluit 5 en §8; spec §4.3: "Geen enkele beloning op trede 1 is geld of vrij besteedbaar tegoed"). Daarom heeft elk item een `kind`, en de regel per verificatieniveau staat in `core/catalog/kinds.ts`:

| Soort | Voorbeeld | Trede 1 (web-MVP) |
|---|---|---|
| `in_kind` | Een koffie, een tentamentraining, een product bij de vereniging | Toegestaan |
| `service` | Een sessie bij een studiecoach, een plek bij een workshop | Toegestaan |
| `partner_discount` | Korting op één product of dienst van de partner, niet als tegoed | Toegestaan |
| `store_credit`, `gift_card_open`, `cash_equivalent` | Winkeltegoed, een open cadeaukaart, een betaalkaart, een overboeking | Bestaat niet: geen waarde in de `CHECK`, geen route om het aan te maken |

Publiceren vraagt daarnaast een verklaring van de partner (`declaration_ref`, een document zoals bij een budget) dat het item geen geld, cadeaukaart of vrij besteedbaar tegoed is, en een expliciet vinkje van de beheerder (`cash_check_by`, `cash_check_at`), met een auditregel. Trede 2 of hoger kan later in `core/catalog` een andere set toestaan; de databasewaarden worden dan met een migratie uitgebreid, niet stil verruimd.

De puntenprijs is `round50(cost_cents / budget_value_per_point)` (spec §4.3), berekend in `core/catalog` en bij publicatie bevroren in `reward.points_price`. De vrijgave is gespreid (founder J3): de dagelijkse job om 04:00 zet de vouchers van die dag (`release_day`) van `unreleased` op `available`; bij het importeren verdeelt de beheeromgeving de weekvoorraad over de zeven dagen en markeert een deel als `anchor_only` (werkhypothesen in spec §4.3). De weekstartjob draait het dekkingsalarm: gebruikers voorbij de inverdienperiode tegenover de vrijgegeven voorraad van de komende week, als `coverage_alert` in eventlog en beheeroverzicht. Puntenprijzen veranderen nooit.

### 5.4 Idempotentie

Idempotentie zit op vier lagen. Elke journaalpost heeft een deterministische, unieke sleutel (tabel 5.1): een herhaalde uitspraak of job faalt op de unieke index en geldt als "al gedaan". Elke sessieroute is idempotent op (`session_id`, `seq`) of met een `Idempotency-Key` (§4.7). Elk ander muterend endpoint dat een gebruiker kan herhalen (verzilveren, squad aanmaken, inschrijven, beroep, wachtlijst) accepteert een `Idempotency-Key`-header; de client genereert die per handeling en bewaart hem in de outbox tot er een antwoord is. En elke job schrijft een `job_run` met een sleutel per dag of week, zodat een herstart van de server de dagafsluiting niet opnieuw draait; een mislukte stap herstart vanaf die stap.

### 5.5 Nachtelijke controles

Stap 10 van de dagafsluiting draait drie controlequery's. Elk resultaat dat niet leeg is, wordt een `ledger_alert` in het beheeroverzicht en laat de integratietest falen.

| Controle | Query (verkort) | Moet zijn |
|---|---|---|
| Nul-som | `SELECT entry_id FROM posting GROUP BY entry_id HAVING SUM(amount) <> 0` | Leeg |
| Eén earn-post per sessie | Voltooide niet-oefensessies zonder precies één post met sleutel `earn:{session_id}` | Leeg |
| Sessiepunten = `counted_min` | Per sessie de som van alle regels op gebruikersrekeningen van posten met `ref_type = session` en `ref_id = session_id`, vergeleken met `counted_min` (niet afgekeurd) of 0 (afgekeurd) | Leeg |

## 6. Challenge- en ranglijstberekening

### 6.1 Dagafsluiting als bron

Alle sociale berekeningen rusten op `user_day`. De dagrand blijft 04:00 Europe/Amsterdam (spec §4.2), maar de dagafsluiting voor focusdag D kan pas draaien als geen sessie van D meer open kan zijn. Een sessie van 90 minuten die om 03:59 start, eindigt om 05:29 en wordt hoogstens `end_grace_min` (10 minuten) later door de sweep gesloten, en de sweep draait elke minuut. Daarom draait de dagafsluiting om **05:45** Europe/Amsterdam: `04:00 + max_session_min (90) + end_grace_min (10) + sweep_margin_min (5)`. Dat moment berekent `core/time/closeAt(day, params)` uit parameters, zodat een andere sessielengte het vanzelf verschuift. Om 04:00 gebeurt alleen wat niet van de vorige dag afhangt (de weekopening op maandag, hieronder). Spec §7.1 noemt bij `daily_goal_met` en `squad_day_evaluated` het tijdstip "04:00"; de events volgen nu om 05:45, de dag waarover ze gaan blijft dezelfde.

De orchestrator in `jobs/day_close/index.ts` voert vaste stappen uit, elk idempotent per dag en elk met één eigenaar (§12.3).

| Stap | Wat | Eigenaar |
|---|---|---|
| 1 | Controleren dat er geen `active` sessie van D meer is; anders de sweep voor D eerst laten draaien en de stap herhalen | WP-4 |
| 2 | Per gebruiker `reconcileDay(cause = day_close)`: `verified_min`, `counted_min`, dagdoel, tentamendag, `goal_met`, `goal_bonus_eligible`, joker, vangnet voor de doelbonus, `goal_budget_lapse` in arm B; `earn_in_reached_at` en `first_redeem_after` | WP-4 |
| 3 | Leeftijdsklassen bijwerken op `turns_18_on` | WP-3 |
| 4 | Automatische pauzes (7 dagen zonder voltooide sessie); squads met 7 dagen < 2 actieven krijgen `low_activity_since_day` en het aanbod tot hersamenstellen | WP-5 |
| 5 | `squad_day`, de streak en het streakherstel (twee geslaagde dagen direct na de breuk zetten `streak_before_break` terug) | WP-5 |
| 6 | Belofte-dagresultaten; Belofte-aanbiedingen met `due_day` = vandaag zichtbaar maken | WP-5 |
| 7 | Batchheuristieken H2, H5, H6, H7 (dagelijks deel) en schadesignalen S1–S3 (`harm_signal`) | WP-6 |
| 8 | Challenge-scores (snapshot `challenge_score`) | WP-5 |
| 9 | Inlogstatistiek (`auth_daily_stat`) en opschonen van `event_pending` | WP-3 |
| 10 | Nachtelijke controles (§5.5) | WP-4 |
| 11 | Bewaartermijnen (§10.6) | WP-6 |

Tijdens de vakantiepauze schrijft de job `vacation = 1` en slaat de doelposten in stap 2 en de stappen 4, 5 en 6 over, zoals spec §4.4 en §4.11 vragen. De week heeft twee jobs. **Weekopening** op maandag 04:00 boekt `goal_budget_grant` voor arm B; de voorraad komt sinds ronde 1 per dag vrij (§5.3). **Weekafsluiting** op maandag 05:45, na de dagafsluiting van zondag, draait H9, het dekkingsalarm, de stopregeltelling van de schadesignalen per arm (voorregistratie §8.3) en de trekking van de wekelijkse steekproef van 30 accounts (§6.5).

`user_day` heeft twee varianten van minuten en doelen. `counted_min` en `goal_met` tellen gemarkeerde sessies voorlopig mee, omdat een gemarkeerde sessie voorlopig telt voor dagdoel, squadstreak en Belofte (spec §6.4). `counted_min_final` en `goal_met_final` laten open en afgekeurde markeringen weg; die tellen voor de inverdienperiode, verzilvering, het duel, de challenge, prijzen en de kwalificatie voor trekkingen. Een besluit over een markering herberekent de betrokken `user_day`-rijen via `reconcileDay` (met de posten uit §5.1) en daarna de afgeleide scores, zolang de periode niet definitief is.

**Tests.** `core/time` heeft unit-tests voor `closeAt` (ook in de zomertijdnachten) en een test voor een sessie die om 03:55 start. De e2e-suite zet de dev-klok op 03:55, start een sessie van 90 minuten, laat haar voltooien, draait de dagafsluiting om 05:45 en controleert dat de sessie bij de vorige focusdag hoort, het doel gehaald is, er geen `goal_lapse` is geboekt en de squadstreak doorloopt.

### 6.2 Verenigingsranglijst

De prijsmaatstaf is de deelnamegraad (spec §4.6). De functie `participationRate` in `core/challenges` krijgt per vereniging de koppelingen met hun begin- en einddatum, het opgegeven ledental en de `user_day`-rijen.

| Grootheid | Definitie | Bron |
|---|---|---|
| Teller deelnamegraad | Gekoppelde leden met `goal_met_final` op ≥ 3 dagen van de challengeweek, alleen dagen waarop ze gekoppeld waren; joker en tentamendag tellen niet; in de prijsweken alleen leden met een instellingsanker (`institution_verified_at`) of een geverifieerd mobiel nummer | Spec §4.6; founder J2 |
| Noemer deelnamegraad | `max(declared_members, gekoppelde leden bij het begin van de week)`, met `declared_members` uit de externe bron, vastgelegd vóór het aanloopklassement; leden zonder anker blijven erin; wie tijdens de week vertrekt of zijn account verwijdert, blijft erin (de koppeling blijft zonder `user_id` bestaan, §10.7) | Spec §4.6 |
| Actief lid | Gekoppeld lid met ≥ 1 voltooide, niet-afgekeurde sessie in de challengeweek | **Keuze**: de spec definieert "actief lid" voor de intensiteit niet; te bevestigen (open vraag 4) |
| Intensiteit | `Σ min(counted_min_final, 300)` over actieve leden en dagen, gedeeld door (aantal actieve leden × aantal niet-vakantiedagen in de week) | Spec §4.6, businessplan §4 |
| Score prijsperiode | Gemiddelde deelnamegraad van de twee prijsweken | Spec §4.6 |
| Rangschikking | Per poule; alleen verenigingen met ≥ 15 gekoppelde leden; een poule met < 3 verenigingen gaat samen met de naastgelegen poule | Spec §4.6 |
| Gelijke stand | Eerst intensiteit, daarna gedeelde plaats | **Keuze**, voorleggen aan de founder (open vraag 5) |
| Drempelprijs | Gemiddelde deelnamegraad ≥ 25% over de prijsperiode | Spec §4.6, werkhypothese |
| Hoofdprijs | Alleen verenigingen met `prize_eligible = 1` (extern ledental); een vereniging zonder externe bron staat wel in de rangschikking | Founder J2 |
| Terugvalvariant | Parameter `club_prize_mode` (`rank_and_threshold` / `threshold_only`); bij `threshold_only` wordt geen hoofdprijs aangemaakt | Founder J2 |

Totalen worden nergens berekend voor weergave. Het puntenplafond van 300 minuten zit dubbel in de berekening: bij het boeken (`counted_min`) en nog eens in de intensiteitsformule, zodat een correctie in het ene nooit het andere ondergraaft. De scores worden elke nacht als snapshot in `challenge_score` geschreven, met `is_final = 0`. De uitslag wordt definitief na de fraudecontrole, de verplichte steekproef en de winnaarsverificatie: bij elke hoofdprijswinnaar en elke vereniging die de drempel haalt, trekt de server een `fraud_sample` van soort `prize` met 20 meegetelde leden (of allemaal bij minder dan 20), los van het aandeel markeringen; zolang niet elk item een oordeel heeft, weigert `results/propose` met `SAMPLE_REQUIRED`. Daarna zet een beheerder de uitslag klaar en bevestigt een tweede (`final_by` ≠ `final_confirmed_by`). Diskwalificatie bij georganiseerde manipulatie is een beheerbesluit met redencode, na hoor en wederhoor; de prijs gaat dan naar de volgende plaats (challengevoorwaarden).

### 6.3 Squads, duels en prestatiechallenges

De squadstreak volgt spec §4.4: een squaddag slaagt als minstens `max(2, ceil(actieve leden / 2))` leden hun dagdoel halen, een joker gebruiken of een tentamendag hebben (een tentamendag telt mee als niet-gemist, zonder joker). Met minder dan drie actieve leden bevriest de streak, in de vakantiepauze ook. Breekt de streak, dan bewaart `squad` de oude lengte in `streak_before_break`; slagen de twee squaddagen direct daarna allebei, dan zet stap 5 de streak terug op die lengte plus twee en schrijft `streak_recovered` (spec §4.4). Een lid dat later instapt of terugkomt van pauze, telt vanaf de dag erna (`active_from_day`). Het duel telt per speler de dagen met `goal_met_final` over zeven dagen (een joker of tentamendag telt niet); de meeste dagen wint, gelijk is `tie`; een speler met een open markering in de duelperiode krijgt pas na het besluit een uitslag (`pending_review`). `POST /duels` met een duellink buiten de squad weigert met `AGE_RESTRICTED` als een van beide spelers `16_17` is.

**Hersamenstellen.** Heeft een squad 7 dagen achter elkaar minder dan 2 actieve leden, dan zet stap 4 `low_activity_since_day` en tonen de overgebleven leden een kaart met een nieuwe uitnodigingslink of samenvoegen. Samenvoegen kan alleen met een squad van dezelfde vereniging die ook onder de 2 actieven zit en zelf heeft ingestemd; de kleinere squad krijgt `merged_into`, haar leden krijgen een nieuw lidmaatschap en, vanaf de eerstvolgende maandag, de armen van de grotere squad (`arm_switch` met reden `merge`).

**Squadprompt.** Bij registratie van een solo-gebruiker wijst `core/experiments` de factor `prompt` toe; `GET /me/today` geeft op dag 1–3 in de sterke arm `squad_prompt: { invite_url, share_text }` terug. Een individuele prestatiechallenge ("elke dag van de tentamenweek minstens 120 minuten") is een predicaat over `user_day` van ingeschreven deelnemers, met vaste plaatsen die bij inschrijving worden toegekend: geen race, geen loting.

**Doelvoorstel.** Na 7 dagen berekent `core/goals/suggestGoal` het voorstel uit spec §4.4 (de hoogste doelwaarde die niet boven de mediaan ligt van de geverifieerde minuten op actieve dagen, minimaal 25). `GET /me/today` geeft het terug als `goal_suggestion`, zolang het afwijkt van het huidige doel en niet is afgewezen; tonen en accepteren zijn de events `goal_suggestion_shown` en `goal_suggestion_accepted` (spec §7.1).

**Getuigen van een Belofte.** Een Belofte met `witnesses = squad` is zichtbaar voor de squadleden: `GET /squads/mine/beloftes` geeft per lid dat dit koos voornaam, dagen per week, minuten per dag en per dag gehaald of niet (spec §3.12 stap 3). Wie `none` kiest, ontbreekt. Er staan geen minuten van andere dagen of sessies in.

**E-mailherinnering.** De job `reminders` draait dagelijks op een vast moment in de avond (**keuze**: 19:30 Europe/Amsterdam, parameter in `params`). Hij stuurt hoogstens één mail per gebruiker per focusdag (`reminder_log` uniek), alleen bij `email_reminders = 1`, alleen als het dagdoel nog niet gehaald is of de squadstreak in gevaar is, en nooit in de vakantiepauze. De mail heeft een afmeldlink die `email_reminders` uitzet zonder in te loggen (ondertekend token). De tekst noemt focus en de squad, geen punten (spec §3.2 en UX §6). De mail staat achter de vlag `reminders`, zodat hij als eerste te schrappen is (spec §8).

### 6.4 Privacy van individuele data

Individuele vergelijking bestaat alleen binnen de squad en het duel, en alleen opt-in. De architectuur dwingt dat op drie plaatsen af, omdat één vergeten filter genoeg is om de randvoorwaarde te breken.

| Wie vraagt | Wat de API teruggeeft | Afdwinging |
|---|---|---|
| Squadlid, live aanwezigheid | Per lid: focust nu ja/nee, resterende minuten, dagdoel gehaald ja/nee, pauze; leden in stille modus ontbreken (voor `16_17` standaard) | Query in `modules/squads/presence.ts` filtert op `silent_mode`; geen minuten per lid |
| Squadlid, minuten vergelijken | Minuten per lid, alleen van leden met `compare_opt_in = 1`, en alleen als de vrager zelf opt-in heeft | Eén SQL-view `squad_compare_v` met beide voorwaarden; het endpoint leest alleen die view |
| Squadlid, Beloftes | Alleen Beloftes van leden die de squad als getuige kozen | View `squad_belofte_v` met `witnesses = 'squad'` |
| Duelpartner | Per dag dagdoel gehaald ja/nee en het aantal gehaalde dagen van beide spelers; geen minuten | Acceptatie van het duel is de opt-in (spec §3.6); buiten de squad alleen tussen 18-plussers |
| Bestuur | Aggregaten per vereniging, met de regels hieronder | `core/privacy`; het bestuursendpoint heeft geen query die `user_id` selecteert |
| Iedereen | Ranglijst per poule: vereniging, ledental met soort bron, deelnamegraad, intensiteit, rang | Bron is `challenge_score` en `club`, zonder kolom per lid |
| Beheer, schadesignalen | Alleen tellingen per arm en per code; per persoon alleen bij een supportbericht met label "welzijn" | `harm_signal` heeft geen beheerroute per gebruiker |
| Partner of sponsor | Niets via de API in de MVP; rapportage handmatig uit aggregaten | Geen partnerportaal (spec §8 Won't) |

**Verschilaanvallen op het bestuursdashboard.** Een drempel van 5 leden per cel is niet genoeg. Een bestuur dat zijn leden kent, kan uit dagelijkse reeksen van gekoppelde en actieve leden, uit koppelingen per QR-bron of uit het aandeel gemarkeerde sessies afleiden wie stopte of wie gemarkeerd is, en dat raakt "geen individuele monitoring" (businessplan §8). `core/privacy` past daarom drie regels toe op de tabbladen Werving en Kwaliteit: (1) cijfers per week in plaats van per dag; (2) aantallen afgerond op 5 en aandelen berekend uit de afgeronde aantallen; (3) een cijfer wordt ook onderdrukt als het minder dan 5 verschilt van de vorige week (dan staat er "minder dan 5 veranderd"), en een cel onder 5 leden blijft `null` met `suppressed: true`. Het tabblad Stand blijft dagelijks, omdat het een cijfer op verenigingsniveau is dat iedereen in de ranglijst ziet. Weekcijfers in Werving zijn een **afwijking van de spec** (§4.6 noemt "per dag"), voor te leggen aan product (open vraag 18).

Een integratietest per endpoint controleert dat geen antwoord buiten de eigen squad of het eigen duel een `user_id`, voornaam of minutental van een ander lid bevat; die test draait over alle routes die in `contracts` als "sociaal" zijn gemarkeerd. De privacytest op de seed controleert daarnaast dat het verwijderen van één lid uit een vereniging van twintig in geen enkel bestuurscijfer van de lopende of vorige week zichtbaar wordt.

### 6.5 Wekelijkse steekproef

De weekafsluiting trekt met `core/fraud/sample.ts` 30 accounts uit de accounts met ≥ 1 voltooide sessie in de afgelopen week, gestratificeerd per vereniging (plus "geen vereniging"), proportioneel met minstens één per stratum met ≥ 5 actieven. De trekking is `HMAC-SHA256(seed, "sample" ‖ week_key ‖ stratum)`-gedreven en daardoor achteraf te reproduceren (voorregistratie §7.1). De beheeromgeving toont per item de lichte controle (anker, nummertype, sessiepatroon, contact) en legt het oordeel vast; een oordeel `suspect` of `fraud` opent een markering met code `SAMPLE` in de gewone wachtrij met beroep. De KPI-query geeft de gewogen schatting met 95%-interval per week en cumulatief, en elke KPI-query heeft een variant zonder de accounts met oordeel `suspect` of `fraud`.

## 7. Trekkingen: niet gebouwd

De trekkingsmodule wordt niet gebouwd (businessplan §1, besluit 3 na ronde 1; founder J4 en S9). Versie 1.1 beschreef hier een commit-reveal-loting met een externe beacon; die tekst is vervallen. Wat blijft, is een lege plek: de vlag `draws` bestaat en staat altijd uit, en `prize.kind` houdt de waarde `drawn` in de `CHECK`, zonder route, scherm, job, tabel of `Beacon`-interface. Daarmee bespaart de bouw `core/draws`, vier tabellen, vijf beheerroutes, de beacon-stub, `draw-verify` en de testvectoren; die tijd gaat naar de steekproef (§6.5), de schadesignalen, het instellingsanker en de experimenttoewijzing.

Komen trekkingen ooit terug, dan alleen na een schriftelijke advocatenopinie én een expliciete schriftelijke reactie van de Kansspelautoriteit (stilte is nee), als één promotioneel spel per jaar met hooguit twintig trekkingen en een pot onder €100.000, met de spelvoorwaarden uit het sjabloon in `docs/juridisch/`. Het ontwerp uit versie 1.1 (deterministische entry-codes uit een vooraf gecommit salt, publicatie van de deelnemerslijst vóór een externe beacon-ronde, selectie zonder modulobias) staat in de versiegeschiedenis van dit document en is dan het startpunt.

## 8. API-ontwerp

### 8.1 Conventies

Alle routes staan onder `/api/v1`. Request- en responsebodies zijn JSON en worden aan beide kanten met de zod-schema's uit `packages/contracts` gevalideerd; de getypeerde client in de web-app is daaruit afgeleid. Authenticatie loopt via de cookie `rw_sid` (HttpOnly, SameSite=Lax, Secure buiten localhost, pad `/`). Muterende verzoeken vragen de header `X-CSRF-Token` met de waarde uit de niet-HttpOnly cookie `rw_csrf` (double submit) en een `Origin` die gelijk is aan de app-origin. Uitzondering: `POST /sessions/:id/events` accepteert het CSRF-token in de body, omdat `sendBeacon` geen headers kan zetten. Paginering is cursorgebaseerd (`?cursor=&limit=`). Tijdstippen in antwoorden zijn ISO-8601 in UTC; focusdagen zijn datums.

Foutantwoorden hebben één vorm: `{ "error": { "code": "WEEKLY_CAP", "message_key": "errors.redemptions.weekly_cap", "details": {…} } }`. De namespace na `errors.` is de module die de code bezit; elke module heeft een eigen vertaalbestand (`i18n/<taal>/errors/<module>.json`), zodat werkpakketten niet in één bestand schrijven. De web-app vertaalt `message_key`; de server stuurt geen vrije tekst naar gebruikers.

**Events in dezelfde transactie.** Een serverevent (bijvoorbeeld `session_completed`, `redemption_completed`, `flag_reviewed`) wordt door `EventWriter.write(tx, …)` in dezelfde SQLite-transactie geschreven als de domeinwijziging. Faalt de wijziging, dan bestaat het event niet, en omgekeerd. Zo kunnen de KPI's uit events (spec §7.2) niet afwijken van de tabellen; een integratietest per serverevent controleert dat een teruggerolde transactie geen event achterlaat.

**Events vóór registratie.** `invite_link_opened` (spec §7.1: "op de server, vóór registratie") wordt geschreven zonder pseudonym, alleen met `invite_id` en `nieuwe_bezoeker`; het hangt aan niemand en is daarom ook niet te wissen voor iemand die later onder de 16 blijkt. Client-events van een pre-gebruiker (`POST /events` in de toestand `pre`) gaan naar `event_pending` onder het `pre_pseudonym` van de pre-sessie: bij een geslaagde onboarding worden ze in dezelfde transactie naar `event` verplaatst onder het nieuwe pseudonym, bij `AGE_BELOW_MINIMUM` verwijderd, en anders na 24 uur.

Autorisatie in de tabellen: **publiek** (geen sessie), **pre** (inlog bevestigd, onboarding niet af), **student** (gebruiker met afgeronde onboarding), **18+** (student met `18_plus`), **bestuur** (bestuurslid van die vereniging), **beheer** (rol `admin` of `reviewer`, met tweede factor, §10.8), **dev** (alleen in de dev-build; de productiebuild bevat de module niet, §10.3).

### 8.2 Endpoints

**Wachtlijst, auth, onboarding en profiel**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `POST /waitlist` | `{ email, locale, source, group_token?, club_hint?, consent_version }` + `Idempotency-Key` | `202 {}` (altijd); de bevestigingsmail bevat de groepslink "Meld je vrienden aan" | publiek | `VALIDATION_FAILED`, `RATE_LIMITED` |
| `POST /waitlist/unsubscribe` | `{ token }` (uit de mail) | `204` | publiek | `LINK_INVALID` |
| `POST /auth/magic-link` | `{ email, locale, invite_token? }` | `202 {}` (altijd, ook bij onbekend adres); de mail bevat een link en een zescijferige code | publiek | `VALIDATION_FAILED`, `RATE_LIMITED`, `INVITE_REQUIRED` (gesloten pilot zonder uitnodiging) |
| `POST /auth/confirm` | `{ token }` (uit het fragment van de link, verstuurd na een tik op "Inloggen") | `200 { next: "/onboarding" \| "/" }`, zet `rw_sid` en `rw_csrf` | publiek | `LINK_INVALID`, `LINK_EXPIRED` |
| `POST /auth/code` | `{ email, code }` | Idem | publiek | `CODE_INVALID`, `CODE_EXPIRED`, `TOO_MANY_ATTEMPTS` |
| `POST /auth/logout` | — | `204` | student, pre | — |
| `GET /me` | — | `{ user, age_band, settings, squad?, club?, flags, onboarding_complete }` | student, pre | `AUTH_REQUIRED` |
| `POST /onboarding` | `{ first_name, last_name?, birth_date, terms_version, privacy_version, research_info_version, daily_goal_min, confirm_overreach?, silent_mode? }` | `201 { user, assignment }` (toewijzing uit `core/experiments`; `16_17` krijgt `silent_mode = 1` tenzij expliciet uit) | pre | `AGE_BELOW_MINIMUM` (en pre-sessie, magic-linkrij en `event_pending` gewist), `TERMS_OUTDATED`, `VALIDATION_FAILED` |
| `PATCH /me/settings` | `{ compare_opt_in?, silent_mode?, squad_name_on_cards?, no_points_mode?, email_reminders?, locale? }` | `{ settings }` | student | `VALIDATION_FAILED` |
| `POST /me/research-opt-out` | `{ confirm: true }` | `{ opted_out_at }` (vanaf de volgende focusdag arm A, doorlopende punten; punten blijven) | student | `ALREADY_OPTED_OUT` |
| `PUT /me/daily-goal` | `{ minutes, confirm_overreach?, from_suggestion? }` | `{ goal_min, effective_from_day }` | student | `OVERREACH_CONFIRM_REQUIRED` |
| `PUT /me/exam-days/:day` · `DELETE …` | — | `{ exam_days_this_week }` | student | `EXAM_DAY_LIMIT` (> 3 per week), `PERIOD_LOCKED` (dag al gesloten) |
| `GET /me/today` | — | `{ focus_day, counted_min, goal_min, goal_met, goal_days_this_week, exam_day, joker_available, bonus_rule, earn_arm, streak, recovery?, goal_suggestion?: { suggested_min }, squad_prompt?: { invite_url, share_text }, harm_card?: { code, help }, survey_due?, rest_notice? }` | student | — |
| `GET /surveys/due` · `POST /surveys/:moment` | — / `{ items, skipped }` | Vragenlijst / `201` | student | `NOT_DUE` |
| `POST /me/institution-email/start` · `POST …/confirm` | `{ email }` / `{ code }` | `202` / `{ domain, verified: true }` (adres zelf niet bewaard) | student | `DOMAIN_NOT_ALLOWED`, `INSTITUTION_EMAIL_IN_USE`, `CODE_INVALID` |
| `POST /me/plus-interest` | — | `204` (nepdeur) | student | `FEATURE_DISABLED` |
| `POST /me/phone/start` | `{ phone }` | `202 { expires_at }` | student | `PHONE_IN_USE`, `PHONE_TYPE_NOT_ALLOWED`, `RATE_LIMITED` |
| `POST /me/phone/confirm` | `{ code }` | `{ verified: true }` | student | `CODE_INVALID`, `CODE_EXPIRED`, `TOO_MANY_ATTEMPTS` |
| `POST /reminders/unsubscribe` | `{ token }` (pagina uit de herinneringsmail, met knop) | `204` | publiek | `LINK_INVALID` |
| `GET /me/export` | — | JSON-bestand met alle gegevens van de gebruiker (§10.7) | student | `RATE_LIMITED` |
| `DELETE /me` | `{ confirm: "VERWIJDER" }` | `202 { deleted_at }` | student | `CONFIRMATION_REQUIRED` |

**Sessies**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `POST /devices` | `{ client_device_id, ua_class, standalone, wakelock_supported }` | `{ device_id }` (server-ULID, hetzelfde bij herhaling) | student | `VALIDATION_FAILED` |
| `POST /sessions` | `{ planned_min: 1\|25\|50\|90, device_id, practice, client_ts, mono_ms, webdriver, standalone }` + `Idempotency-Key` | `201 { session_id, nonce, server_start_at, planned_end_at, heartbeat_s: 30 }`, of `200 { …, resumed: true }` als op dit toestel al een sessie loopt (§4.7) | student | `INVALID_DURATION` (ook bij `practice` ≠ (`planned_min` = 1)), `ACCOUNT_BLOCKED`, `IDEMPOTENCY_CONFLICT` |
| `POST /sessions/:id/heartbeats` | `{ nonce, seq, mono_ms, client_ts, rtt_ms?, visibility, wakelock, events: VisibilityEvent[] }` | `{ nonce, server_now, status, abort_reason? }`; bij herhaling van `last_seq` het gecachete antwoord | student (eigenaar) | `NONCE_INVALID`, `SESSION_CLOSED` (met `details.verdict`), `RATE_LIMITED` |
| `POST /sessions/:id/events` | `{ csrf?, last_nonce, events: (VisibilityEvent \| Heartbeat)[] }` (ook als `text/plain` via beacon) | `202 { status }` | student (eigenaar) | `SESSION_CLOSED`, `VALIDATION_FAILED` |
| `POST /sessions/:id/end` | `{ nonce, mono_ms, client_ts, events }` | `{ status, verified_min, counted_min, points, points_status, flagged, goal_met, streak, earn_in_progress_min }`; bij herhaling de opgeslagen uitspraak | student (eigenaar) | `NONCE_INVALID`, `SESSION_CLOSED` (met `details.verdict`) |
| `POST /sessions/:id/stop` | `{ nonce }` | `{ status: "aborted", abort_reason: "user_stop", elapsed_s }`; bij herhaling idem | student (eigenaar) | `SESSION_CLOSED` (met `details.verdict`) |
| `GET /sessions/active` | — | `{ session? }` (zonder nonce; hervatten loopt via `POST /sessions`) | student | — |
| `GET /sessions/:id` | — | `{ session, abort_reason?, explanation_key, review_status }` | student (eigenaar) | `NOT_FOUND` |
| `GET /sessions?from=&to=` | — | `{ items, next_cursor }` | student | — |
| `POST /sessions/:id/report` | `{ text? }` ("Klopt dit niet?") | `201 { flag_id }` | student (eigenaar) | `ALREADY_REPORTED`, `SESSION_NOT_ABORTED` |

**Punten, catalogus en verzilvering**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `GET /points/balance` | — | `{ available, pending, referral_unvested, earn_in_min, earn_in_required: 300, first_redeem_after?, next_redeem_from? }` | student | — |
| `GET /points/ledger` | `?cursor` | `{ items: [{ type, amount, status, ref, rule_key?, created_at }], next_cursor }` | student | — |
| `GET /catalog` | — | `{ items: [{ id, kind, collective, title, partner, points_price, stock_today, next_release?, terms }] }` | student | — |
| `POST /redemptions` | `{ reward_id }` + `Idempotency-Key` | `201 { redemption_id, voucher_code, points, points_from_referral }` | student | `EARN_IN_REQUIRED`, `FIRST_REDEEM_HOLD`, `PHONE_NOT_VERIFIED`, `WEEKLY_CAP`, `MONTHLY_CAP`, `OUT_OF_STOCK`, `INSUFFICIENT_POINTS`, `REFERRAL_SHARE_EXCEEDED`, `IDEMPOTENCY_CONFLICT` |
| `GET /redemptions` | — | `{ items }` | student | — |
| `POST /redemptions/:id/broken` | `{ text? }` ("Werkt niet") | `201 { ticket_id }` (rij in `support_ticket`) | student (eigenaar) | `ALREADY_REPORTED` |

**Squads, uitnodigingen en duels**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `GET /invites/:token` | — | `{ source, inviter_first_name?, squad_name?, valid }` (zonder punten of prijzen) | publiek | `INVITE_INVALID`, `INVITE_EXPIRED`, `INVITE_EXHAUSTED` |
| `POST /invites/:token/accept` | — | `{ squad? \| duel? }` | student | idem, `ALREADY_IN_SQUAD`, `SQUAD_FULL`, `DUEL_ACTIVE` |
| `POST /squads` | `{ name, club_id? }` + `Idempotency-Key` | `201 { squad, invite }` | student | `ALREADY_IN_SQUAD`, `NAME_REJECTED` |
| `GET /squads/mine` | — | `{ squad, members: [{ first_name, paused, goal_met_today }], streak, status }` | student (lid) | `NOT_IN_SQUAD` |
| `GET /squads/mine/presence` | — | `{ members: [{ member_ref, focusing, remaining_min? }], polled_at }` | student (lid) | `NOT_IN_SQUAD` |
| `GET /squads/mine/compare` | — | `{ members: [{ first_name, minutes_today, minutes_week }] }` (alleen wederzijds opt-in) | student (lid, opt-in) | `COMPARE_OPT_IN_REQUIRED` |
| `GET /squads/mine/beloftes` | — | `{ items: [{ first_name, days_per_week, min_per_day, start_day, end_day, days: [{ day, met }] }] }` (alleen `witnesses = squad`) | student (lid) | `NOT_IN_SQUAD` |
| `POST /squads/mine/invites` | — | `201 { invite }` | student (lid) | `INVITE_MOMENT_NOT_ALLOWED`, `SQUAD_FULL` |
| `PATCH /squads/mine` | `{ name?, club_id? }` | `{ squad }` | student (beheerder squad) | `NAME_REJECTED` |
| `POST /squads/mine/leave` | — | `204` | student (lid) | — |
| `POST /duels` | `{ opponent_member_ref? }` (zonder squadlid alleen als de vrager `18_plus` is) | `201 { duel, invite }` | student | `DUEL_ACTIVE`, `AGE_RESTRICTED` |
| `GET /duels/current` | — | `{ duel, days: [{ day, me_met, opponent_met }], me_total, opponent_total, result? }` | student (speler) | `NOT_FOUND` |
| `POST /squads/mine/regroup` · `POST /squads/mine/merge-requests` · `POST /squads/merge-requests/:id/accept` | — / `{ target_squad_ref }` / — | Nieuwe link / verzoek / samengevoegde squad | student (lid van een squad met `low_activity_since_day`) | `NOT_ELIGIBLE` |
| `POST /squads/:id/name-report` | `{ reason? }` | `201` (markering `NAME_REPORT`, `name_status = reported`) | student die de naam ziet | `ALREADY_REPORTED` |

**Vereniging, challenges, ranglijst en bestuur**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `POST /clubs/join` | `{ code, qr_source? }` | `{ club, status: "linked" \| "pending_admin" }` | student | `CODE_INVALID`, `ALREADY_LINKED` |
| `POST /clubs/leave` | — | `204` | student | — |
| `GET /leaderboards/:challenge_id` | — | `{ pools: [{ pool, rows: [{ club_name, declared_members, members_source_kind, prize_eligible, participation_rate, intensity_min, rank }] }], is_final, computed_at }` | student | `NOT_FOUND` |
| `GET /challenges` | — | `{ items: [{ id, type, title, period, seats_left?, prize }] }` | student | — |
| `POST /challenges/:id/enroll` | `Idempotency-Key` | `201 { enrollment, seat_no }` | student | `SEATS_FULL`, `ENROLLMENT_CLOSED`, `AGE_RESTRICTED` |
| `GET /challenges/:id/progress` | — | `{ days: [{ day, minutes, met }], status }` | student (deelnemer) | `NOT_ENROLLED` |
| `GET /board/clubs/:id/dashboard?tab=` | `tab` = stand/werving/prijs/kwaliteit | Aggregaten volgens spec §4.6 en de regels van §6.4; onderdrukte cijfers als `null` met `suppressed: true` | bestuur | `FORBIDDEN` |
| `GET /board/clubs/:id/promo-kit` | — | `{ assets: [{ kind, url, qr_source }] }` | bestuur | `FORBIDDEN` |

**Belofte, kaarten, referral, events en beroep**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `GET /belofte/offer` | — | `{ offer?: { suggested_days, suggested_min, trigger } }` (alleen vanaf `due_day`) | student | `FEATURE_DISABLED` |
| `POST /beloftes` | `{ days_per_week, min_per_day, witnesses }` | `201 { belofte }` | student | `BELOFTE_ACTIVE`, `OFFER_NOT_YET`, `VALIDATION_FAILED` |
| `GET /beloftes/current` | — | `{ belofte, days }` | student | `NOT_FOUND` |
| `POST /beloftes/:id/stop` | — | `{ status: "stopped" }` | student (eigenaar) | — |
| `POST /beloftes/:id/reflection` | `{ action, stake_interest? }` (`stake_interest` alleen 18+) | `{ next? }` | student (eigenaar) | `AGE_RESTRICTED` |
| `POST /cards` | `{ kind, ref_id, fields }` | `201 { card_id, token, image_url }` | student | `SESSION_UNDER_REVIEW`, `FEATURE_DISABLED` |
| `GET /cards/:id/image?format=9x16\|1x1` | — | `image/svg+xml` met eigen strenge headers (§10.3); de browser rastert naar PNG voor het delen | student (eigenaar) | `NOT_FOUND` |
| `DELETE /cards/:id` | — | `204` | student (eigenaar) | — |
| `GET /verify/:token` | — | `{ first_name, duration_min, from, to, streak?, statement_key, focus_ook_url }` (in de pilot naar de wachtlijst met `source = card`) | publiek (`noindex`) | `CARD_UNAVAILABLE` |
| `GET /referral/mine` | — | `{ link?, pending: [{ first_name, sessions_done, deadline }] }` | student | `FEATURE_DISABLED` |
| (vervallen) `GET /draws`, `POST /draws/:game_id/opt-in` | Trekkingen worden niet gebouwd (§7) | — | — |
| (vervallen) `GET /draws/:game_id/public` | Idem | — | — | — |
| `POST /events` | `{ name, props }` (alleen client-events uit de taxonomie) | `202`; voor pre-gebruikers naar `event_pending` | student, pre | `UNKNOWN_EVENT` |
| `POST /appeals` | `{ object_type, object_id, text }` | `201 { appeal_id }` | student | `APPEAL_WINDOW_CLOSED`, `ALREADY_APPEALED` |

**Beheer** (elke route vraagt een beheerderssessie met tweede factor; routes van een domein staan in de module van dat domein, onder het pad `/admin`)

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `POST /admin/mfa/enroll` · `POST /admin/mfa/verify` | — / `{ code }` | QR-gegevens voor TOTP / `mfa_at` gezet | beheer (zonder factor alleen deze twee) | `MFA_INVALID` |
| `GET /admin/waitlist` · `POST /admin/waitlist/invite-batch` | `{ count, dry_run? }` | Overzicht per voorrangsklasse / aangemaakte uitnodigingen | beheer | — |
| `GET/POST/PATCH /admin/clubs[/:id]` | Naam, stad, ledental met soort bron en documentverwijzing, `agreement_ref`, hulpbronnen, poule, bestuursaccounts | Club met code en plafond | beheer | `VALIDATION_FAILED`, `AGREEMENT_REQUIRED`, `MEMBERS_FIXED` |
| `GET /admin/clubs/:id/pending-links` · `POST …/decide` | `{ user_ref, decision }` | — | beheer | — |
| `GET/POST /admin/partners`, `POST /admin/partners/:id/budgets`, `POST /admin/budgets/:id/cancel` | `{ kind, booked_cents, reward_pct, document_ref, booked_at }` / `{ cancel_cents, reason_code }` | Budget met vrije ruimte | beheer | `DOCUMENT_REQUIRED`, `COVERAGE_INSUFFICIENT` |
| `GET /admin/budget/overview` | — | Geboekt, gealloceerd, vrij, uitstaande punten, waarde tegen budgetwaarde, dekkingsgraad | beheer | — |
| `POST /admin/rewards` · `POST /admin/rewards/:id/vouchers` (CSV) · `POST /admin/rewards/:id/publish` · `POST /admin/rewards/:id/releases` · `POST /admin/redemptions/:id/replace` | Item met `kind` en `declaration_ref`, codes, publicatie met `{ cash_check: true }`, weekvrijgave, vervangende code | Item met allocatie | beheer | `CEILING_EXCEEDED` (> €5), `KIND_NOT_ALLOWED`, `DECLARATION_REQUIRED`, `CASH_CHECK_REQUIRED`, `COVERAGE_INSUFFICIENT`, `PRICE_IMMUTABLE` |
| `POST /admin/challenges` · `POST …/publish` · `POST …/results/propose` · `POST …/results/confirm` | Challenge, prijzen, uitslag | Challenge | beheer | `CEILING_EXCEEDED`, `KIND_NOT_ALLOWED`, `COVERAGE_INSUFFICIENT`, `FOUR_EYES_REQUIRED`, `SAMPLE_REQUIRED` |
| `GET /admin/flags?status=open` | — | Wachtrij met bewijs per markering en geraakte sessies | beheer (auditregel per inzage) | — |
| `POST /admin/flags/:id/decision` | `{ decision: release\|reject\|block, reason_code, note }` | Markering met gevolgen (posten uit §5.1) | beheer | `REASON_REQUIRED`, `FOUR_EYES_REQUIRED` (block) |
| `POST /admin/blocks/:id/confirm` | `{ note }` | Blokkade actief; `phone_hash` naar `blocked_phone_hash` | beheer (andere beheerder) | `SAME_REVIEWER` |
| `POST /admin/sessions/:id/restore` | `{ reason_code: outage\|late_log\|appeal_upheld, note }` | Sessie met nieuwe uitspraak (§4.8) | beheer | `SESSION_NOT_RESTORABLE`, `PERIOD_LOCKED`, `REASON_REQUIRED` |
| `GET /admin/appeals` · `POST /admin/appeals/:id/decision` | `{ outcome, motivation }` | Beroep | beheer (niet betrokken bij het oorspronkelijke besluit, §10.8) | `SAME_REVIEWER`, `NO_ELIGIBLE_REVIEWER`, `REASON_REQUIRED` |
| `POST /admin/outages` | `{ from, to, note }` | Storing, plus lijst van sessies die voor herstel in aanmerking komen | beheer | — |
| `GET /admin/users?q=` · `GET /admin/users/:id` | `reason` verplicht als queryparameter | Gebruiker, sessies | beheer (auditregel) | `REASON_REQUIRED` |
| `POST /admin/users/:id/team-flag` · `DELETE /admin/users/:id` | — | — | beheer | `FOUR_EYES_REQUIRED` (verwijderen door beheer) |
| `GET /admin/support` · `POST /admin/support` · `PATCH /admin/support/:id` | Ticket, extern bericht met alleen label en datum, label zetten | Ticket | beheer | — |
| `POST /admin/prizes/:id/verify` · `POST /admin/prizes/:id/age-check` · `POST /admin/prizes/:id/delivery-contact` | Verificatie, uitkomst leeftijdscontrole (geen kopie van het document), naam en adres | Prijs | beheer | `AGE_CHECK_REQUIRED`, `FOUR_EYES_REQUIRED` |
| `PUT /admin/vacation-pause` | `{ start_day, end_day }` | Periode | beheer | `PERIOD_LOCKED` |
| `GET /admin/experiments` | — | Toewijzing per eenheid en wissels | beheer | — |
| `PUT /admin/feature-flags/:key` | `{ enabled }` | Vlag | beheer | `FOUR_EYES_REQUIRED` (`rest_period`, `arm_b`); `FEATURE_DISABLED` (`draws` kan niet aan) |
| `GET /admin/first-redemptions` | — | Accounts in de wachttijd met sessiepatroon, anker, nummertype en H11 | beheer (auditregel) | — |
| `GET /admin/samples/current` · `POST /admin/samples/:id/items/:item/judgement` | — / `{ checks, judgement, reason_code }` | Steekproef / oordeel | beheer | `REASON_REQUIRED` |
| `GET /admin/wellbeing/summary` | — | Schadesignalen per code en arm, stopregeltelling | beheer | — |
| `POST /admin/experiments/arm-b/stop` | `{ reason }` | Arm B gestopt vanaf de volgende maandag (`arm_switch` met `arm_b_stopped`) | beheer (vier ogen) | `FOUR_EYES_REQUIRED` |
| `GET/POST /admin/ambassadors` | Code, bestuurscontrole, plafond | Ambassadeur met telling | beheer | `BOARD_MEMBER_CONFLICT` |
| (vervallen) `POST /admin/draw-games` en de overige trekkingsroutes | Trekkingen worden niet gebouwd (§7) | — | — | — |
| `GET /admin/kpi/:query` | `?from&to` | Tabel uit opgeslagen query (spec §7.2) | beheer | `NOT_FOUND` |
| `GET /admin/audit` | `?object&actor` | Auditregels | beheer | — |

**Ontwikkeling en test** (alleen in de dev-build, §10.3)

| Methode en pad | Request | Response | Autorisatie |
|---|---|---|---|
| `GET /dev/inbox?to=` | — | Laatste e-mails en sms'en met magic link, inlogcode of sms-code | dev |
| `POST /dev/clock` | `{ set?: ISO, advance_ms? }` | `{ now }` | dev |
| `POST /dev/jobs/:job/run` | `{ run_key? }` | `{ status }` | dev |
| `POST /dev/reset` | `{ seed?: "demo" \| "empty" }` | `{ ok }` | dev |
| `POST /dev/aa-check` | `{ users: 800, seed: "test" }` | Verdeling per factor en stratum, controles uit voorregistratie §9.3 | dev |

### 8.3 Foutcodes

| HTTP | Codes |
|---|---|
| 400 / 422 | `VALIDATION_FAILED`, `INVALID_DURATION`, `CEILING_EXCEEDED`, `KIND_NOT_ALLOWED`, `EXAM_DAY_LIMIT`, `DOMAIN_NOT_ALLOWED`, `PHONE_TYPE_NOT_ALLOWED`, `CONFIRMATION_REQUIRED`, `REASON_REQUIRED`, `DOCUMENT_REQUIRED`, `DECLARATION_REQUIRED`, `CASH_CHECK_REQUIRED`, `UNKNOWN_EVENT` |
| 401 | `AUTH_REQUIRED`, `LINK_INVALID`, `LINK_EXPIRED`, `MFA_REQUIRED`, `MFA_INVALID` |
| 403 | `FORBIDDEN`, `CSRF_INVALID`, `AGE_BELOW_MINIMUM`, `AGE_RESTRICTED`, `ACCOUNT_BLOCKED`, `INVITE_REQUIRED`, `COMPARE_OPT_IN_REQUIRED` |
| 404 | `NOT_FOUND`, `FEATURE_DISABLED`, `CARD_UNAVAILABLE`, `NOT_IN_SQUAD`, `NOT_ENROLLED` |
| 409 | `SESSION_CLOSED`, `SESSION_NOT_ABORTED`, `SESSION_NOT_RESTORABLE`, `NONCE_INVALID`, `EARN_IN_REQUIRED`, `PHONE_NOT_VERIFIED`, `PHONE_IN_USE`, `WEEKLY_CAP`, `MONTHLY_CAP`, `OUT_OF_STOCK`, `INSUFFICIENT_POINTS`, `REFERRAL_SHARE_EXCEEDED`, `COVERAGE_INSUFFICIENT`, `PRICE_IMMUTABLE`, `IDEMPOTENCY_CONFLICT`, `ALREADY_IN_SQUAD`, `SQUAD_FULL`, `DUEL_ACTIVE`, `BELOFTE_ACTIVE`, `ALREADY_LINKED`, `SEATS_FULL`, `ENROLLMENT_CLOSED`, `SESSION_UNDER_REVIEW`, `ALREADY_REPORTED`, `ALREADY_APPEALED`, `APPEAL_WINDOW_CLOSED`, `FOUR_EYES_REQUIRED`, `SAME_REVIEWER`, `NO_ELIGIBLE_REVIEWER`, `SAMPLE_REQUIRED`, `AGE_CHECK_REQUIRED`, `FIRST_REDEEM_HOLD`, `OFFER_NOT_YET`, `INSTITUTION_EMAIL_IN_USE`, `ALREADY_OPTED_OUT`, `AGREEMENT_REQUIRED`, `MEMBERS_FIXED`, `BOARD_MEMBER_CONFLICT`, `NOT_ELIGIBLE`, `NOT_DUE`, `PERIOD_LOCKED`, `TERMS_OUTDATED`, `OVERREACH_CONFIRM_REQUIRED`, `INVITE_MOMENT_NOT_ALLOWED`, `NAME_REJECTED` |
| 410 | `INVITE_INVALID`, `INVITE_EXPIRED`, `INVITE_EXHAUSTED`, `CODE_EXPIRED` |
| 429 | `RATE_LIMITED`, `TOO_MANY_ATTEMPTS` (met `Retry-After`) |
| 500 / 503 | `INTERNAL`, `MAINTENANCE` |

`SESSION_ACTIVE` uit versie 1.0 is vervallen: een tweede start op hetzelfde toestel hervat de lopende sessie (§4.7).

## 9. Web-app

### 9.1 Routes

| Route | Inhoud | Toegang | Release |
|---|---|---|---|
| `/` | Vandaag: dagdoel, squad live, startknop, eventueel doelvoorstel | student | R1 |
| `/welkom`, `/i/:token`, `/c/:code` | Landing, uitnodigingspreview, verenigingslink (UX §2.2) | publiek | R1 |
| `/wachtlijst`, `/wachtlijst/groep/:token` | Aanmelden, met vrienden aanmelden | publiek | R1 (pre-launch vanaf 4 november) |
| `/login`, `/auth/check-inbox`, `/auth/bevestig`, `/auth/code` | Inloggen aanvragen; bevestigingspagina met knop; code invoeren | publiek | R1 |
| `/onboarding/*` | Stappen uit spec §3.1, inclusief oefensessie | pre | R1 |
| `/focus` | Checklist, duurkeuze, lopende sessie, eindscherm, afbreekscherm | student | R1 |
| `/hoe-we-tellen` | Eerlijke claim, regels, oefensessie | publiek | R1 |
| `/punten`, `/punten/catalogus`, `/punten/geschiedenis` | Saldo in drie delen, catalogus, journaal | student | R1 |
| `/squad`, `/squad/nieuw`, `/squad/vergelijken` | Squad, aanmaken, opt-in vergelijking, Beloftes van getuigen (R2) | student | R1 |
| `/duel` | Duel | student | R2 |
| `/vereniging`, `/vereniging/ranglijst` | Koppelen, ranglijst | student | R1 |
| `/challenges/:id` | Prestatiechallenge | student | R3 |
| `/belofte` | Aanbod, lopende Belofte, reflectie | student | R2 |
| `/kaart/:id`, `/v/:token` | Kaart maken; publieke verificatiepagina | student / publiek | R2 |
| `/vragen/:moment` | Korte vragenlijst (instroom, reflectie, eind januari, april) | student | R1 / R2 |
| `/hulp` | Hulpbronnen van de eigen instelling (schadesignaal) | student | R1 |
| `/profiel`, `/profiel/privacy` | Instellingen (ook herinneringen), export, verwijderen | student | R1 |
| `/afmelden` | Afmelden voor herinneringen of wachtlijst, met knop | publiek | R1 |
| `/bestuur/:clubId/*` | Dashboardtabbladen uit spec §4.6 | bestuur | R1 |
| `/beheer/*` | Beheeromgeving (lui geladen bundel) | beheer | R1–R3 |

De router is React Router in data-modus en laadt de routes per feature met `import.meta.glob`; de beheer- en bestuursbundels laden lui, zodat de studentenbundel klein blijft voor het eerste bezoek via een WhatsApp-link.

### 9.2 State-management

Serverdata (saldo, squad, catalogus, ranglijst) loopt via TanStack Query met de getypeerde client; elke query heeft een sleutel per resource en de aanwezigheid pollt elke 30 seconden zolang het squadscherm of de focusweergave zichtbaar is (spec §4.4: polling, geen websockets). De sessie zelf staat niet in TanStack Query maar in een kleine store rond de toestandsmachine uit core (`useSyncExternalStore`), omdat ze moet blijven werken als het netwerk wegvalt en omdat haar overgangen deterministisch getest moeten kunnen worden. Formulieren gebruiken de zod-schema's uit contracts voor validatie in de browser. Er is geen globale state-bibliotheek nodig.

### 9.3 Offline-opslag

IndexedDB (via de kleine wrapper `idb`) heeft vier stores: `device` (de `client_device_id` en, per gebruiker, het `device_id` van de server), `active_session` (kop van de lopende sessie, de laatste nonce, de openstaande heartbeat met haar `seq` en de `Idempotency-Key` van de start), `outbox` (gebeurtenissen, heartbeats en idempotente handelingen met hun sleutel, in volgorde) en `cache` (laatste squad- en saldogegevens voor de offline weergave). Bij uitloggen worden `active_session`, `outbox` en `cache` gewist. Persistente opslag wordt aangevraagd met `navigator.storage.persist()` na de eerste voltooide sessie. De outbox wordt geleegd bij `online`, bij elke heartbeat en bij het opstarten; er is geen afhankelijkheid van Background Sync, omdat die niet in alle browsers bestaat. `localStorage` wordt alleen gebruikt voor de taalkeuze en het laatste tabblad, met try/catch.

### 9.4 PWA-manifest en service worker

Het manifest heeft `name` "Rewarded", `lang` nl, `start_url` `/?bron=pwa`, `display` `standalone`, `orientation` `portrait`, kleuren uit de tokens en iconen van 192, 512 en maskable 512. De service worker (`vite-plugin-pwa`, modus `injectManifest`, code in `src/sw/`) precachet app-shell en vertalingen, laat `/api/*` altijd netwerk-only (een gecachet antwoord zou de nonce-keten breken) en toont een offline-pagina. Een nieuwe versie wordt nooit tijdens een lopende sessie geactiveerd: de app stuurt `SKIP_WAITING` pas als de toestandsmachine in `idle` staat. Webpush valt onder Could in R2 (spec §8) en wordt pas gebouwd na een test op een echte iPhone.

**Installeerbaarheid testen zonder Lighthouse.** Lighthouse heeft de PWA-categorie geschrapt, dus die kan geen acceptatiecriterium zijn. In de plaats komt een eigen test: een Vitest-test op het manifest (verplichte velden, iconmaten, `display`, `start_url` binnen de scope), en een Playwright-test die controleert dat de service worker geregistreerd en actief is en dat de app-shell met `context.setOffline(true)` opnieuw laadt.

### 9.5 Wake Lock, Page Visibility en kaarten

De platform-API's zitten achter adapters in `src/platform/`, met een interface die de tests kunnen vervangen.

| Adapter | Gedrag |
|---|---|
| `visibility.ts` | Leest `document.visibilityState`, luistert naar `visibilitychange`, `pagehide`, `pageshow`, `blur`, `focus`; geeft gebeurtenissen met `performance.now()` door aan de machine |
| `wakelock.ts` | Vraagt `navigator.wakeLock.request('screen')` aan bij start en na elke terugkeer naar `visible`; meldt `acquired`, `denied`, `released`, `unsupported`; bij vrijgave terwijl de pagina zichtbaar is: waarschuwing en één nieuwe poging per 10 seconden (spec §4.1) |
| `clock.ts` | `monoNow()` en `wallNow()`; nooit `Date.now()` voor duur |
| `tabLock.ts` | Web Locks en `BroadcastChannel` voor de eigenaartab (§4.4); terugval zonder Web Locks: `BroadcastChannel`-handdruk |
| `beacon.ts` | `sendBeacon` met CSRF-token in de body; terugval `fetch(..., { keepalive: true })` |
| `transport.ts` | Herhaalt openstaande sessieverzoeken volgens §4.7 en houdt `seq` en `Idempotency-Key` vast |
| `rasterize.ts` | Tekent de SVG van een kaart in een `<canvas>` en levert met `toBlob` een PNG voor de Web Share API; de SVG gebruikt alleen ingebedde of systeemlettertypen, zodat het canvas niet vervuild raakt |

De sessieweergave is een donker scherm met resterende tijd en de squad (spec §3.2). Zonder Wake Lock toont de app de tekst uit spec §3.2 stap 3. Vóór 2 december wordt het gedrag getest op minstens één iPhone (Safari en Home Screen-app) en twee Android-toestellen (spec §4.1); die test is handwerk en staat als acceptatiecriterium in WP-8.

### 9.6 i18n en toegankelijkheid

i18n gebruikt `i18next` met `react-i18next` en ICU-meervoud; Nederlands is standaard, Engels tweede taal. Vertaalbestanden staan per feature (`i18n/nl/focus.json`) en foutteksten per module (`i18n/nl/errors/sessions.json`), zodat werkpakketten niet in elkaars bestanden schrijven. Afbreek-, fout- en heuristiekcodes hebben vaste sleutels die ook support gebruikt (spec §4.1). Een test eist elke sleutel in beide talen en een sleutel voor elke code uit contracts in de namespace van de eigenaarsmodule; een lintregel weert verboden woorden ("bewezen", "verdien geld", "winnen" buiten trekkingen). Tijden worden getoond in Europe/Amsterdam.

Toegankelijkheid volgt WCAG 2.2 AA. Concreet: alle interactieve elementen zijn met het toetsenbord bereikbaar en minstens 44 × 44 px; het donkere sessiescherm haalt contrast 4,5:1; de timer kondigt via `aria-live="polite"` alleen hele minuten aan, niet elke seconde; animaties respecteren `prefers-reduced-motion`; formulieren hebben labels en foutmeldingen die aan het veld gekoppeld zijn; de afbreekuitleg is tekst, geen kleur alleen. Playwright draait `@axe-core/playwright` op de hoofdroutes als onderdeel van de e2e-suite.

### 9.7 Designsysteem als tokens

De bron is `apps/web/src/design/tokens.json` in twee lagen: primitieven (kleurschalen, maatstappen, lettertypen, radii, schaduwen, duur van animaties) en semantische tokens (`color.surface`, `color.surface-focus` voor het donkere sessiescherm, `color.text`, `color.accent`, `color.success`, `color.warning`, `space.1–8`, `radius.card`, `font.body`, `font.numeric`). De waarden komen uit UX §5.2 (kleurtokens in licht en donker met contrastwaarden), §5.3 (typografie) en §5.4 (spacing en vorm); de basiscomponenten (knop, kaart, lijstregel, voortgangsring, tijdweergave, melding) volgen UX §5.5. Een klein buildscript zet het bestand om in `tokens.css` met CSS custom properties op `:root`, een donkere variant onder `prefers-color-scheme: dark` en `[data-theme]`, en een TypeScript-typebestand zodat componenten alleen bestaande tokens gebruiken. Componenten gebruiken uitsluitend semantische tokens. Een test controleert de contrastwaarden uit UX §5.2 op de gegenereerde tokens.

## 10. Beveiliging en AVG

### 10.1 Authenticatie

De inlogflow moet de activatie van ≥ 60% (businessplan §6) niet ondergraven. Een gewone magic link faalt op drie bekende punten. Mailgateways van hogescholen en universiteiten volgen links vooraf om ze te scannen en verbruiken zo een eenmalig token, zodat de student `LINK_INVALID` krijgt. Op iOS heeft een Home Screen-webapp een andere cookie- en opslagcontainer dan Safari, dus een link uit Mail logt in in Safari en niet in de geïnstalleerde app. En een link die in de in-app browser van Instagram of TikTok opent, of in een andere browser dan waarin de student begon, verliest de pre-sessie en de uitnodiging. De flow is daarom zo gebouwd:

1. `POST /auth/magic-link` maakt een token van 32 willekeurige bytes en een zescijferige code, bewaart van beide alleen de hash (15 minuten geldig, samen eenmalig) en neemt het `invite_token` op in de rij. De mail bevat de link en de code. In ontwikkeling gaan ze naar console en dev-inbox, in productie via een nog te kiezen verwerker (open vraag 1). Het antwoord is altijd 202, zodat niet te zien is welke adressen bestaan.
2. De link wijst naar `/auth/bevestig#t=<token>`. Het token staat in het fragment, dat een browser niet naar de server stuurt; een scanner die de link ophaalt, verbruikt dus niets en het token komt in geen toegangslog. De pagina toont "Inloggen als …" met één knop, en pas die tik stuurt `POST /auth/confirm`. Er is geen automatische verzending, ook niet met JavaScript, omdat sommige scanners pagina's ook uitvoeren.
3. Op elk scherm "Check je mail" staat een veld voor de code (`POST /auth/code`), met dezelfde hash, geldigheid en limieten (vijf pogingen per aanvraag, §10.2). Zo logt een student in de Home Screen-app of in de browser waar hij begon in, ongeacht waar de mail opent. De onboarding toont dit ook als eerste optie in een geïnstalleerde app.
4. Omdat het `invite_token` in de rij staat, komt de uitnodiging mee via welk pad de student ook inlogt; in de oorspronkelijke browser bewaart de app het daarnaast in `sessionStorage`. Een nieuw adres krijgt een sessie in de toestand `pre` met alleen het e-mailadres en een `pre_pseudonym`.
5. De onboarding controleert de leeftijd; onder 16 verwijdert de server de pre-sessie, de magic-linkrij en alle `event_pending`-rijen, zodat er niets van die persoon blijft (spec §3.1 stap 5). Een geslaagde onboarding maakt de gebruiker, koppelt de sessie en verplaatst de pre-events. Sessies verlopen na 30 dagen inactiviteit, beheersessies na 12 uur; uitloggen en blokkeren verwijderen alle sessies van het account.

**Meten.** `auth_daily_stat` telt per dag aanvragen, verbruik via link en via code, verlopen en ongeldige pogingen, zonder persoonsgegevens. Het aandeel verbruikte tegenover aangevraagde inlogs is een KPI naast de activatie; de handmatige toesteltest (§11) bevat inloggen in de iOS Home Screen-app en vanuit de in-app browser van Instagram.

### 10.2 Rate limiting

Een token-bucket in het geheugen van het API-proces, per sleutel (IP-hash, e-mailhash, gebruiker of sessie). Bij één API-proces in de pilot volstaat dat; meerdere processen vragen een gedeelde opslag (open vraag 9).

| Route | Limiet (**keuze**, aan te passen na de eerste pilotweek) |
|---|---|
| `POST /waitlist` | 5 per uur per e-mailhash, 30 per uur per IP-hash (campus en mobiel CGNAT: 300) |
| `POST /auth/magic-link` | 5 per uur per e-mail, 20 per uur per IP-hash (campus en mobiel CGNAT: 200) |
| `POST /auth/code` | 5 pogingen per aanvraag, daarna ongeldig; 20 per uur per e-mail |
| `POST /me/phone/start` / `confirm` | 3 per uur per gebruiker / 5 pogingen per code |
| `POST /sessions` | 12 per uur per gebruiker; herhalingen met een bekende `Idempotency-Key` tellen niet |
| `POST /sessions/:id/heartbeats` | Een nieuwe `seq` hoogstens 1 per 10 s per sessie; herhalingen van dezelfde `seq` vrij tot 30 per minuut |
| `POST /redemptions` | 10 per uur per gebruiker |
| `POST /events` | 120 per uur per gebruiker of pre-sessie |
| Beheer: `POST /admin/mfa/verify` | 5 per 15 minuten per beheerder |
| Overige muterende routes | 60 per minuut per gebruiker |

### 10.3 CSRF, invoervalidatie, headers en de productiebuild

CSRF-bescherming is drievoudig: SameSite=Lax op de sessiecookie, een double-submit-token in `X-CSRF-Token` en een controle van `Origin`. Alle invoer gaat door zod-schema's met strikte objecten (onbekende velden worden geweigerd), begrensde stringlengtes en enumeraties voor elke code. Vrije tekst (squadnaam, beroep, melding, ticket) wordt als tekst opgeslagen en nooit als HTML gerenderd; squadnamen gaan langs een woordenlijst en worden bij twijfel `pending` voor moderatie. SQL is altijd geparametriseerd. De API zet `Content-Security-Policy` (alleen eigen origin, geen inline scripts), `Referrer-Policy: same-origin`, `X-Content-Type-Options: nosniff` en `Permissions-Policy` die camera, microfoon en geolocatie uitzet. De verificatiepagina `/v/:token` heeft `X-Robots-Tag: noindex`.

**Kaarten als SVG.** Een SVG met door de gebruiker gekozen tekst (voornaam, squadnaam), geserveerd als `image/svg+xml` vanaf de eigen origin, is een XSS-vector als hij direct wordt geopend. Daarom: alle tekst in de SVG-templates gaat door één escapefunctie (`&`, `<`, `>`, `"`, `'`), de templates bevatten geen `<script>`, `<foreignObject>` of externe verwijzingen, en `/cards/:id/image` krijgt eigen headers: `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`, `Content-Disposition: attachment; filename="rewarded-kaart.svg"` en `X-Content-Type-Options: nosniff`. Een test maakt een kaart met de voornaam `<script>alert(1)</script>"/><foreignObject>` en controleert dat de SVG alleen geëscapete tekst bevat en dat de headers kloppen.

**Dev-routes bestaan niet in productie.** Versie 1.0 zette `modules/dev` alleen uit op `NODE_ENV`; één verkeerde omgevingsvariabele zou in productie de dev-klok en `/dev/reset` openzetten. Nu heeft de API twee entries: `server.dev.ts` importeert de dev-module en de instelbare klok, `server.prod.ts` niet, en de productiebuild gebruikt alleen `server.prod.ts` met een `modules.gen.ts` zonder `dev`. De productieklok is `SystemClock` zonder setter. Een test bouwt de productiebundel, start hem en controleert dat `GET /api/v1/dev/inbox`, `POST /dev/clock` en `POST /dev/reset` 404 geven en dat de bundel de string `dev/clock` niet bevat.

### 10.4 Dataminimalisatie

| Gegeven | Vorm | Waarom |
|---|---|---|
| IP-adres | `HMAC-SHA256(ip, pepper_ip)` plus `net_class` (campus/mobile_cgnat/other), bepaald met het ruwe adres alleen in het geheugen; nooit het adres zelf, ook niet in logs | H2, H7, H10, referraluitsluiting (spec §4.9), rate limiting |
| Telefoonnummer | `HMAC-SHA256(E.164, pepper_phone)` plus `phone_line_type`; het nummer zelf alleen in geheugen tijdens verzending en de nummertypecontrole | Eén mobiel nummer per account, H8 |
| E-mailadres voor uniekheid | `email_norm_hash = HMAC-SHA256(genormaliseerd adres, pepper_email)` naast het adres zelf | Eén account per genormaliseerd adres (founder J2) |
| Instellingsmailadres | Alleen `institution_domain`, `institution_verified_at` en `institution_email_hash` (HMAC met `pepper_inst`); het adres zelf alleen in geheugen tijdens de bevestiging | Identiteitsanker voor de teller (spec §4.6); de hash is een afwijking van "alleen vinkje en domein", voor de DPIA (open vraag 26) |
| Toestel-id | `client_device_id` (UUID in IndexedDB), 30 dagen op de sessie, 180 dagen op `device` | `second_session`, H11, referraluitsluiting; art. 11.7a Telecommunicatiewet in de DPIA |
| Vragenlijsten | Alleen itemcodes en antwoordcodes onder het pseudonym; één ingekort vrij veld | Welzijnsmeting en bonusregelvraag (spec §7.4) |
| User agent | Klasse (`ios-safari`, `ios-standalone`, `android-chrome`, `desktop-chromium`, `desktop-firefox`, `desktop-safari`, `headless`, `other`) | H1, uitleg Wake Lock |
| Geboortedatum | Niet opgeslagen en niet gelogd; alleen `age_band` en `turns_18_on` | Spec §4.10 |
| Events | `pseudonym` in plaats van `user_id` | Spec §7 |
| Verwijzingen in het auditlog | `HMAC(user_id, pepper_audit)` | Verantwoording zonder ruwe id's (§10.7) |

De IPv4-ruimte en de Nederlandse mobiele nummers zijn klein genoeg om alle hashes uit te rekenen als iemand de pepper heeft. Daarom staan de peppers niet naast de database (§10.9). Of een IP-hash onder de cookiebepaling valt, is een open vraag voor de jurist (spec open vraag 14, rapport 09 §7.3).

### 10.5 Grondslag en DPIA

Versie 1.1 noemde "overeenkomst voor de kernfunctie, toestemming voor de rest". De jurist wees erop dat de gerandomiseerde toewijzing, het eventlog en de fraudeheuristieken niet noodzakelijk zijn voor de uitvoering van de overeenkomst, en dat toestemming slecht past omdat weigeren de pilot ongeldig maakt. Na ronde 1 (founder J5) geldt per verwerking:

| Verwerking | Grondslag | Tabellen |
|---|---|---|
| Account, sessie, punten, verzilvering | Overeenkomst (art. 6 lid 1 sub b AVG) | `user` (kern), `auth_*`, `focus_session`, `session_heartbeat`, `visibility_event`, `user_day`, grootboek, `redemption`, `phone_verification` |
| Experiment: toewijzing, armwissels, vragenlijsten, schadesignalen | Gerechtvaardigd belang (sub f) met schriftelijke belangenafweging, met aandacht voor 16- en 17-jarigen; opt-out zonder verlies van punten | `experiment_assignment`, `arm_switch`, `survey_response`, `harm_signal` |
| Eventlog voor de KPI-analyse | Gerechtvaardigd belang (sub f) | `event`, `event_pending` |
| Fraudebestrijding: heuristieken, steekproef, toestel-id, instellingsanker, `blocked_phone_hash` | Gerechtvaardigd belang (sub f) | `fraud_*`, `device`, `blocked_phone_hash`, ankervelden op `user` |
| Wachtlijst | Toestemming | `waitlist_entry` |
| Herinneringsmail | Overeenkomst, met afmelding | `reminder_log` |
| Logs | Gerechtvaardigd belang: beveiliging | — |

Een DPIA is verplicht, omdat we stelselmatig gedrag van een jonge doelgroep in een experiment monitoren (businessplan §9). De DPIA-light voor de wachtlijst komt deze week; de volledige DPIA is ondertekend vóór de eerste uitnodiging, uiterlijk 1 december 2026. De architectuur levert een verwerkingsregister als bijlage in de repo (`docs/dpia/verwerkingen.md`, door WP-6 bij te houden): per tabel het doel, de categorie, de grondslag uit deze tabel en de bewaartermijn uit §10.6, plus de verwerkers (EU, geen subverwerkers buiten de EER zonder waarborgen, inclusief de nummertypecontrole), het toestel-id onder art. 11.7a Telecommunicatiewet, het ontbreken van een kopie van een identiteitsbewijs bij de leeftijdscontrole, de bewaring van `blocked_phone_hash` en het sleutelbeheer (§10.9). De rol van de vereniging (gezamenlijke verantwoordelijkheid waar dat zo is) ligt vast in een korte overeenkomst per vereniging; de API geeft geen code zonder `agreement_ref` en heeft geen route om een ledenlijst te uploaden.

### 10.6 Bewaartermijnen

De opschoning is stap 11 van de dagafsluiting en is idempotent; de integratietest van de retentiejob zet de dev-klok voorbij elke termijn en controleert per regel van deze tabel dat het gegeven weg of gereduceerd is. De termijnen zijn werkhypothesen (spec §4.10 waar die iets noemt, anders **keuze**), vast te leggen in de DPIA.

| Tabel en kolom | Termijn | Daarna | Bron |
|---|---|---|---|
| `ip_hash`, `net_class`, `ua_class` op `focus_session`, `auth_magic_link`, `user.registration_*`, `club_membership`, `waitlist_entry` | 30 dagen | Kolom op NULL | Spec §4.10 |
| `focus_session.device_id` | 30 dagen na het einde van de sessie | NULL (H1–H11 en `second_session` hebben het daarna niet meer nodig) | Keuze |
| `focus_session` (rest, incl. `flag_codes`) | Zolang het account bestaat | Verwijderd bij `DELETE /me` | Nodig voor punten en uitleg |
| `session_heartbeat`, `visibility_event` | 90 dagen | Samengevat in `session_summary`, ruwe rijen verwijderd | Spec §4.10 |
| `session_summary`, `user_day`, `squad_day` | Zolang de sessie, het account of de squad bestaat | Verwijderd met het account (`squad_day` heeft geen persoonsgegevens) | Keuze |
| `device` | 180 dagen na `last_seen_at` | Verwijderd | Keuze |
| `fraud_flag.evidence` | Tot het besluit plus de beroepstermijn van 14 dagen, of tot het besluit op het beroep | Gereduceerd tot codes en drempelwaarden, zonder `ip_hash`, tijdpatronen of verwijzingen naar andere accounts (`evidence_reduced_at`) | Keuze |
| `fraud_flag` (rij) | 2 jaar na het besluit | Verwijderd; tot dan nodig voor de rapportage van valse positieven (spec §6.5) | Keuze |
| `appeal.text` | 90 dagen na het besluit | NULL; uitkomst en motivatie blijven voor dezelfde 2 jaar als de markering | Keuze |
| `blocked_phone_hash` | 2 jaar na de blokkade (`expires_at`) | Verwijderd | Keuze; gerechtvaardigd belang, in de DPIA |
| `challenge_enrollment`, `belofte`, `belofte_offer`, `card` | Zolang het account bestaat; ingetrokken kaarten 30 dagen na intrekking | Verwijderd | Keuze |
| `survey_response`, `harm_signal` | Als `event` (tot uiterlijk 15 juni 2027) | Geaggregeerd per arm en moment; rijen verwijderd | Keuze, in de DPIA |
| `fraud_sample_item` | 2 jaar na het oordeel, als `fraud_flag` | Verwijderd; de schatting per week blijft | Keuze |
| `redemption`, `reward_voucher` | Zolang nodig voor de verantwoording aan partners; fiscale bewaarplicht toetsen (open vraag 12) | `user_id` NULL bij `DELETE /me` | Businessplan §5 |
| `journal_entry`, `posting`, `ledger_account` | Als `redemption` | Blijven ongewijzigd; na `DELETE /me` onkoppelbaar (§10.7) | Spec §4.2 |
| `prize_delivery_contact` | 30 dagen na levering | Verwijderd | Keuze |
| `auth_magic_link`, `phone_verification`, `idempotency_record` | 24 uur | Verwijderd (`phone_hash` blijft op de gebruiker zolang het account bestaat) | Spec §4.10 |
| `auth_session` | Bij verloop | Verwijderd | — |
| `event_pending` | 24 uur of bij afloop van de pre-sessie | Verwijderd | Spec §3.1 |
| `event` | Tot na de nawerkingsmeting in de tentamenperiode van april 2027 en de analyse daarvan, uiterlijk 15 juni 2027 (founder JS5; spec §7.3) | Geaggregeerd naar weekcijfers per arm, bron en release; ruwe events verwijderd | Founder JS5; motivering in de DPIA |
| `waitlist_entry` | Uitgenodigd: 30 dagen na de uitnodiging; niet uitgenodigd: 30 dagen na de publieke lancering (18 februari 2027); afmelden: direct | Verwijderd | Keuze, in de DPIA |
| `reminder_log` | 30 dagen | Verwijderd | Keuze |
| `support_ticket.text` | 90 dagen na `resolved` | NULL; label blijft | Keuze |
| `audit_log` | 2 jaar | Verwijderd | Founder JS5 |
| Applicatie- en toegangslogs | 14 dagen | Verwijderd door logrotatie | Keuze, §10.9 |

### 10.7 Export en verwijdering

`GET /me/export` levert één JSON-bestand met profiel, sessies met hun signalen (voor zover nog bewaard), journaal (via de eigen rekeningen), verzilveringen, lidmaatschappen, Beloftes, kaarten, markeringen met besluiten en beroepen, herinneringen en supporttickets. Gegevens van anderen (namen van squadleden) staan er niet in, alleen verwijzingen.

**`DELETE /me` per tabel.** Versie 1.0 beloofde dat grootboekrijen "met een geanonimiseerde eigenaar" bleven, terwijl `journal_entry` een `user_id` had en triggers elke UPDATE weigeren. Dat kon alleen door de triggers uit te zetten. Nu verwijst het journaal nergens naar een gebruiker (§3.3), en bepaalt de verwijdering per tabel wat er gebeurt, in één transactie na de bevestiging en na een `expire`-post die alle saldi op nul zet.

| Tabel | Bij `DELETE /me` |
|---|---|
| `user`, `auth_session`, `auth_magic_link`, `admin_mfa`, `device`, `phone_verification`, `idempotency_record`, `event_pending`, `survey_response`, `harm_signal` | Verwijderd |
| `ledger_account_owner` | Verwijderd; de rekeningen en het journaal blijven ongewijzigd en zijn daarna aan niemand te koppelen |
| `journal_entry`, `posting`, `ledger_account` | Ongewijzigd (triggers blijven heel) |
| `focus_session`, `session_heartbeat`, `visibility_event`, `session_summary`, `user_day` | Verwijderd; `journal_entry.ref_id` en eventuele event-props met dit `session_id` lopen daarna dood |
| `fraud_flag`, `fraud_flag_session` | Open markeringen: `closed` met `account_deleted`; alle markeringen over dit account: `subject_id` NULL, `evidence` gereduceerd tot codes, koppelrijen verwijderd |
| `appeal` | Open: gesloten met `account_deleted`; alle: `user_id` en `text` NULL |
| `redemption`, `challenge_enrollment`, `fraud_sample_item` | `user_id` NULL |
| `prize` | `winner_user_id` NULL; `prize_delivery_contact` verwijderd |
| `squad_membership`, `club_membership` | `user_id` NULL en `left_at` gezet, zodat noemers en historie kloppen zonder persoon |
| `squad` | Was de gebruiker beheerder, dan gaat het beheer naar het langst zittende lid (spec §4.4) |
| `invite`, `referral`, `duel` | Verwijzingen naar de gebruiker NULL |
| `belofte`, `belofte_offer`, `card`, `reminder_log` | Verwijderd; kaarten tonen "niet meer beschikbaar" |
| `experiment_assignment` (solo), `arm_switch` | `unit_id` en `user_id` vervangen door één nieuw willekeurig id, dat nergens anders voorkomt |
| `event` | `pseudonym` vervangen door een nieuw willekeurig pseudonym; `squad_id` vervangen door een nieuw willekeurig id per verwijderde gebruiker (founder J5: een squad van drie tot zes leden maakt een individu anders herleidbaar); uit `props` worden `session_id`, `invite_id`, `card_id`, `duel_id`, `redemption_id`, `referral_id` en `squad_id` verwijderd. De events blijven bruikbaar voor de cohortanalyse (spec §4.10: "daarna blijven events gepseudonimiseerd voor de pilotanalyse"), maar zijn aan geen andere rij meer te koppelen |
| `support_ticket` | `user_id` en `text` NULL; label blijft |
| `audit_log` | Ongewijzigd; bevat alleen `HMAC(user_id, pepper_audit)`, nooit het id, het e-mailadres of het pseudonym |
| `blocked_phone_hash` | Ongewijzigd; staat los van het account, zodat een geblokkeerde fraudeur na verwijderen niet met hetzelfde nummer opnieuw kan beginnen (H8) |

De integratietest maakt een gebruiker met sessies, markering, beroep, verzilvering, squad, vereniging, kaart, events, vragenlijsten en een geblokkeerd telefoonnummer, verwijdert hem en controleert daarna dat geen enkele rij in geen enkele tabel (een scan over alle tekstkolommen en JSON) het oude `user_id`, het e-mailadres, het oude pseudonym of, in `event`, het oude `squad_id` bevat, dat het journaal nog op nul sluit, dat een join van `event.props` op `session_id` of `invite_id` naar elke andere tabel leeg is, en dat H8 het nummer nog herkent. Of het vervangen pseudonym voor de pilotanalyse volstaat, of dat events direct geaggregeerd moeten worden, is een vraag voor de DPIA (open vraag 19).

### 10.8 Menselijke herbeoordeling, audit en beheerderstoegang

De architectuur maakt een geautomatiseerd negatief besluit onmogelijk (art. 22 AVG, rapport 02 §2.4; businessplan §4). Geen job of heuristiek kan een `reverse`, blokkade of afgekeurde prijs boeken; alleen routes onder `/admin/flags`, `/admin/appeals`, `/admin/sessions` en `/admin/prizes` kunnen dat, met beheerderssessie, redencode en auditregel in dezelfde transactie. De enige automatische uitkomst is het afbreken van een sessie op de vaste regels van spec §4.1, en die heeft de meldroute "Klopt dit niet?" en het herstel uit §4.8. Blokkade en uitslagpublicatie vragen een tweede beheerder. Het auditlog is append-only (triggers), en elke inzage van sessiegegevens schrijft een regel met reden.

**Wie een beroep mag beslissen.** Uitgesloten is iedereen die aan het oorspronkelijke besluit meewerkte: `decided_by` en `block_confirmed_by` van de markering, en bij een prijs of uitslag ook `verified_by`, `final_by` en `final_confirmed_by`. Met twee beheerders betekent dat bij een bevestigde blokkade dat niemand overblijft. Het beroep krijgt dan `waiting_for_third = 1`, de API weigert beide beheerders met `NO_ELIGIBLE_REVIEWER`, en het beroep wacht op een derde persoon (een teamlid of een externe beoordelaar met een geheimhoudingsafspraak). Die afhankelijkheid en de termijn van 5 werkdagen staan in de DPIA; wie de derde persoon is, moet vóór 2 december vastliggen (open vraag 20).

**Tweede factor voor beheer.** Beheerders loggen in met de magic link plus een TOTP-code (RFC 6238, zes cijfers, stap van 30 seconden). Wie alleen de mailbox van een beheerder overneemt, heeft dan nog geen beheerrechten, en het vier-ogenprincipe blijft betekenis houden. TOTP is met `node:crypto` te bouwen en met de nep-`Clock` offline te testen; het geheim staat versleuteld in `admin_mfa` met een sleutel uit de geheimenmap (§10.9). Bestuursleden van verenigingen zien alleen aggregaten en krijgen in de MVP geen tweede factor (**keuze**). WebAuthn is de betere factor, maar vraagt meer bouw en een echte toesteltest; dat is iets voor na de pilot.

### 10.9 Logging en sleutelbeheer

**Logging.** De tabellen hashen IP-adressen, maar een standaard toegangslog van een reverse proxy of de Hono-logger bewaart het ruwe adres, en een foutlog met request-body bevat de geboortedatum uit `POST /onboarding`, het nummer uit `POST /me/phone/start` of een e-mailadres. Daarom:

| Regel | Uitwerking |
|---|---|
| Eén logger | `platform/logger.ts`: gestructureerde JSON-regels met een allowlist van velden (`ts`, `level`, `route` als patroon, `status`, `duration_ms`, `request_id`, `error_code`, `net_class`, `user_ref` als korte hash); elk ander veld wordt weggegooid, niet gemaskeerd. De Hono-logger staat uit |
| Geen bodies | Request- en responsebodies, query-strings van auth-routes en headers met cookies worden nooit gelogd; een stacktrace wordt gelogd zonder de argumenten van de fout |
| IP | Alleen `net_class`, nooit het adres of de hash; de reverse proxy in productie logt zonder IP (instelling vast te leggen bij de hostingkeuze, open vraag 1) |
| Bewaartermijn | 14 dagen, in de DPIA |
| Test | Een integratietest roept `POST /onboarding` met een geboortedatum en `POST /me/phone/start` met een nummer aan, ook met een geforceerde fout, vangt alle logregels af en controleert dat de datum, het nummer en het e-mailadres in geen enkele vorm voorkomen |

**Sleutelbeheer.** De peppers (`pepper_ip`, `pepper_phone`, `pepper_audit`, `pepper_email`, `pepper_inst`), de sleutel voor TOTP-geheimen en de experimentseed (voorregistratie §9.2; in de voorregistratie staat alleen de hash) staan niet in `.data/` naast de database. `tooling/scripts/secrets.ts` genereert ze bij de eerste start in een aparte geheimenmap (`$REWARDED_SECRETS_DIR`, standaard buiten de repo en buiten `.data/`), met bestandsrechten 0600. De databasebackup bevat die map niet. De geheimen krijgen een eigen, versleutelde backup met een sleutel die alleen de founder en één teamlid hebben, zodat één gelekte databasebackup geen IP- of telefoonhashes terug laat rekenen. Rotatie van een pepper maakt bestaande hashes onbruikbaar voor vergelijking; daarom roteren we alleen na een incident, en dan verliezen H2, H7, H8, H10 en de referraluitsluiting tijdelijk hun historie. Dit staat in `docs/dpia/sleutelbeheer.md` (WP-6).

## 11. Teststrategie

| Laag | Gereedschap | Wat | Draait |
|---|---|---|---|
| Unit | Vitest op `packages/core` | Toestandsmachine, retry-regels, `evaluateSession`, grootboekregels, `reconcileDay`, focusdag, `closeAt` en zomertijd, doelbonus A en B en seizoen, nachtregel, tentamendag, puntenplafond 300, rustperiode, doelvoorstel, streak, joker en streakherstel, hersamenstellen, deelnamegraad met anker en intensiteit, H1–H11 met netklassen en hogere drempels, steekproeftrekking (reproduceerbaar), schadesignalen S1–S3, experimenttoewijzing uit de seed (uitzonderingen `16_17` en afmelding), e-mailnormalisatie, puntenprijs, plafonds en soorten, privacyafronding, vesting, Belofte-aanbod per arm | Elke commit, < 10 s |
| Eigenschappen | `fast-check` in Vitest | Elke reeks boekingen sluit op nul; saldo = som; puntenplafond van 300 nooit overschreden; arm A en arm B hebben bij elke reeks dagen met dezelfde uitkomsten (gehaald, gemist, tentamendag, nacht) dezelfde maximale bonus; nooit een 16- of 17-jarige in arm B of de rustperiode; `reconcileDay` is idempotent (twee keer toepassen geeft geen posten) en convergent (een willekeurige reeks besluiten eindigt in dezelfde saldi als één herberekening vanaf nul); sessiepunten per sessie = `counted_min`; toewijzing deterministisch per seed en gebalanceerd per blok; `evaluateSession` monotoon in tijd | Elke commit |
| A/A-controle | `tooling/scripts/aa-check.ts` | Gesimuleerd cohort (werkhypothese 800 fictieve gebruikers) door toewijzing, armwissels, vakantiepauze, tentamendagen en alle KPI-query's; controles uit voorregistratie §9.3 | Vóór 2 december, en na elke wijziging in `core/experiments` of de KPI-query's |
| Contract | Vitest op `packages/contracts` | Schema's accepteren voorbeelden en weigeren onbekende velden; elke foutcode heeft een i18n-sleutel in de namespace van haar module; `practice` ⇔ `planned_min = 1` | Elke commit |
| API-integratie | Vitest + Hono `app.request()`, SQLite `:memory:` per test, nep-`Clock`, nep-`Mailer`, nep-`SmsSender` met nummertypetabel, logcapture; tegen beide drivers | Elke route met autorisatiematrix, foutcodes, idempotentie en herhalingen, gelijktijdige verzilveringen, dagafsluiting, privacyfilters (§6.4), events in de transactie, auditregels, bewaartermijnen per tabel (§10.6), verwijdering (§10.7), logging (§10.9), productiebundel zonder dev-routes (§10.3) | Elke commit, < 60 s |
| Componenten | Vitest + Testing Library (jsdom) | Afbreekscherm per code, saldo in drie delen, overmoedrem, opt-in-schakelaars, codeveld bij inloggen | Elke commit |
| End-to-end | Playwright met Chromium en WebKit, `webServer` start api en web per worker | Kernflows door de hele keten (tabel hieronder), axe-controle, installeerbaarheid (§9.4) | Voor elke merge naar main en elke release |
| Handmatig op toestel | Checklist in `e2e/MANUAL.md` | Wake Lock en zichtbaarheid op iPhone (Safari, Home Screen) en twee Android-toestellen; inloggen met code in de Home Screen-app; link openen vanuit de in-app browser van Instagram; kaart delen als PNG | Vóór R1 en na elke wijziging in `platform/` of de auth-flow |

De end-to-endsuite simuleert zichtbaarheid en tijd zonder de productiecode te omzeilen. Een init-script (`page.addInitScript`) installeert in testmodus `window.__rwTest` met `setVisibility('hidden' | 'visible')`, dat de getter van `document.visibilityState` overschrijft en een echt `visibilitychange`-event afvuurt, en een nep-Wake Lock die op commando `acquired` of `released` meldt. Tijd loopt aan twee kanten gelijk op: Playwright's `page.clock` verzet de browserklok inclusief `performance.now()`, en `POST /dev/clock` verzet de serverklok met hetzelfde bedrag.

**Parallelle workers.** De dev-klok van de server is globaal, dus twee workers die tegen één API-proces draaien, verzetten elkaars tijd. Elke Playwright-worker start daarom een eigen API-proces met een eigen SQLite-bestand op een eigen poort (`4100 + workerIndex`), via een worker-fixture; de web-app krijgt de API-basis-URL per worker. Lukt dat in de bouw niet op tijd, dan draaien de tijdgevoelige specs in een project met `workers: 1`.

**WebKit.** iOS Safari is het belangrijkste doelplatform. Naast Chromium draait een WebKit-project voor de scenario's met zichtbaarheid, Web Locks, outbox en herhaalde verzoeken. Playwright-WebKit op Linux is niet hetzelfde als Safari op een iPhone; de handmatige toesteltest blijft daarom nodig.

| Scenario | Verwachting |
|---|---|
| Wachtlijst: aanmelden met groepslink, beheerder nodigt een batch uit, registratie via de uitnodiging | `invite.source = waitlist`, groep in één uitnodiging, registratie telt niet voor K |
| Registratie via squadlink: code uit `/dev/inbox` in het codeveld, geboortedatum 17 jaar, oefensessie | Account `16_17`, in squad, stille modus aan, persoonlijk arm A en doorlopende punten ook als de squad arm B en de rustperiode heeft; duellink van buiten de squad geeft `AGE_RESTRICTED` |
| Solo-registratie in de arm "sterke squadprompt" | Dag 1–3 `squad_prompt` in `/me/today`, dag 4 niet meer; in de standaardarm nooit |
| Sessie van 50 minuten die om 01:30 start, dagdoel 50 | Punten en dagdoel geteld, geen `goal_bonus` (arm A) en `goal_budget_lapse` (arm B), rustig signaal op het eindscherm |
| Zes sessies van 90 minuten op één dag | `counted_min` 300, `verified_min` 540; na drie zulke dagen H5; na drie dagen boven 360 minuten S2 en de kaart met hulpbronnen |
| Tentamendag aangezet, dagdoel niet gehaald, arm B | Geen joker gebruikt, streak niet gebroken, geen "−20"-melding; vierde tentamendag in de week geeft `EXAM_DAY_LIMIT` |
| Rustperiode-arm, sessie op 18 januari | Geen `earn_session`, dagdoel en streak tellen, saldo blijft inwisselbaar |
| Verzilvering direct na 300 minuten | `FIRST_REDEEM_HOLD` tot 7 dagen later; account in de beheerlijst; daarna voucher; tweede account op hetzelfde toestel in dezelfde week geeft H11 |
| Telefoonnummer van type VoIP | `PHONE_TYPE_NOT_ALLOWED` |
| Registratie met `jan.jansen+2@` na `jan.jansen@` (en punten bij een provider die ze negeert) | Geweigerd als bestaand adres |
| Steekproef van de week opnieuw trekken met dezelfde seed | Zelfde 30 accounts |
| Uitslag voorstellen zonder oordeel op elk steekproefitem | `SAMPLE_REQUIRED` |
| Inloglink eerst opgehaald door een "scanner" (`request.get` op de link zonder klik) | Token niet verbruikt; daarna tik op "Inloggen" slaagt |
| Inloglink geopend in een tweede browsercontext, code in de eerste | Beide paden geven toegang met dezelfde uitnodiging; daarna is de andere ongeldig |
| Registratie met geboortedatum 15 jaar | `AGE_BELOW_MINIMUM`, geen rij in `user`, magic-linkrij en `event_pending` weg |
| Sessie van 25 minuten met klok vooruit in stappen van 30 s | `completed`, 25 punten beschikbaar, dagdoel gehaald, doelbonus bij het einde geboekt, squad ziet "doel gehaald" |
| Antwoord op twee heartbeats achter elkaar weggegooid na verwerking (`route.fetch` + `route.abort`) | Geen `NONCE_INVALID` in de keten, geen `heartbeat_gap`, `completed` |
| Antwoord op `POST /sessions` weggegooid; client herhaalt met dezelfde sleutel | Zelfde `session_id`; sessie loopt normaal |
| Client verliest de sleutel (herladen tijdens `starting`) en start opnieuw op hetzelfde toestel | `resumed: true` met nieuwe nonce, geen tweede sessie |
| Antwoord op `/end` en op `/stop` weggegooid; client herhaalt | Opgeslagen uitspraak, geen dubbele boeking |
| Sessie van 90 minuten die om 03:55 start; dagafsluiting om 05:45 | Sessie bij de vorige focusdag, doel gehaald, geen `goal_lapse`, streak loopt door |
| Dezelfde sessie, na 12 minuten `setVisibility('hidden')` | Afgebroken met `hidden`, uitleg "Je hield 12 minuten vol", 0 punten, streak intact |
| Netwerk 3 minuten offline (`context.setOffline`) met zichtbare pagina | `completed`, gemarkeerd H3 als het gat > 10% van de duur is |
| Netwerk 6 minuten offline | Client toont direct afbreking; server `heartbeat_gap` |
| Afgebroken door een gat, daarna storing geregistreerd en `restore` | Sessie `completed`, `earn:{session_id}` en doelbonus geboekt, auditregel |
| Herladen tijdens sessie | `beforeunload`-dialoog; na herladen afbreekuitleg met code `hidden` |
| Tweede tabblad op hetzelfde toestel | "Je sessie loopt in een ander tabblad", geen tweede start |
| Tweede browsercontext (ander toestel) start sessie | Eerste sessie `second_session` |
| Tweede gebruiker logt in in hetzelfde browserprofiel | Eigen `device`-rij; de sessies van de eerste blijven aan de eerste gekoppeld |
| Standaard Playwright (`navigator.webdriver = true`) | Sessie `completed` maar gemarkeerd H1, punten en doelbonus in afwachting, beheerder geeft vrij in de wachtrij, beide komen vrij |
| `navigator.webdriver` overschreven op `false` | Ongemarkeerd voltooid: vastlegging dat H1 te omzeilen is (§4.6) |
| Afkeuring van een eerdere sessie op een dag waarop een latere sessie was afgetopt | `reverse` voor de eerste, `earn_topup` voor de latere, doelbonus volgens §5.1 |
| Verzilvering vóór 300 minuten, daarna na 300 minuten, daarna tweede in dezelfde week, daarna "Werkt niet" met punten terug en opnieuw verzilveren | `EARN_IN_REQUIRED`, dan voucher, dan `WEEKLY_CAP`, dan `redeem_refund`, dan een nieuwe voucher |
| Beheerder publiceert een item zonder verklaring of vinkje | `DECLARATION_REQUIRED` of `CASH_CHECK_REQUIRED` |
| Dagafsluiting via `POST /dev/jobs/day_close/run` | `user_day`, `squad_day`, arm-B-lapse, ranglijstsnapshot, controles leeg |
| Bestuur opent dashboard | Alleen weekaggregaten, afgerond op 5, cijfers onder 5 leden en wijzigingen onder 5 onderdrukt |
| Kaart met kwaadaardige voornaam | Geëscapete SVG, strenge headers |

**Seeddata.** `pnpm seed:demo` bouwt deterministisch (vaste PRNG-seed) een fictieve demo-omgeving: één stad "Demostad", drie fictieve studieverenigingen in één poule (zodat een poule geldig is), elk met een opgegeven ledental en code; 45 studenten, waarvan 36 in negen squads van drie tot vijf leden en negen solo; beide armen van beide factoren; 14 dagen aan sessies met een realistische mix van voltooid, afgebroken per code en een handvol gemarkeerde sessies (H3, H4, H9) in de wachtrij; een gesimuleerde UB-NAT (twintig studenten met sessies vanaf één adres in een fictief campusbereik) en een gesimuleerd mobiel CGNAT-adres, voor de toets van de hogere drempels van H2, H7 en H10, plus het red-teamscenario (tien accounts achter een hotspot binnen een uur in één vereniging, met e-mailaliassen) dat wel moet markeren; alle vier experimentfactoren, twee 16-jarigen, een afgemelde gebruiker, een vereniging zonder externe ledentalbron en een squad die onder de twee actieven zakt; één partner met een geboekt budget en documentverwijzing, drie catalogusitems van toegestane soorten met verklaring, vouchercodes en weekvrijgave; een aanloopklassement en een prestatiechallenge; één duel; twintig wachtlijstaanmeldingen in vier voorrangsklassen; drie beheerders met TOTP (zodat vier ogen én een beroep na een blokkade te testen zijn) en één bestuurslid per vereniging. Alle namen, adressen, bereiken en codes zijn fictief; de seed bevat geen echte vereniging, persoon of IP-bereik. Een tweede seed, `empty`, maakt alleen de beheerders, voor de e2e-tests die vanaf nul beginnen.

## 12. Bouwplan in werkpakketten

Het plan rust op vier regels. (1) Elk werkpakket bezit mappen, tabellen, dagafsluitingsstappen en vertaalnamespaces, en schrijft niet in die van een ander; de eigenaarstabellen in §12.3 zijn volledig, en wat er niet in staat, heeft nog geen eigenaar en mag niet gebouwd worden voordat het erin staat. (2) Registratiepunten bestaan niet als handmatige lijst: API-modules en web-features worden uit hun mappen geladen (§2), en WP-0 maakt op dag één een stub voor elke module en feature uit §12.3. (3) Migraties krijgen een nummerreeks per pakket, in een volgorde waarin elke foreign key naar een eerdere reeks wijst. (4) Op dag twee worden drie lagen bevroren: core-typen, `contracts` en de service-interfaces in `apps/api/src/services`. Een wijziging daarna loopt via de eigenaar van die interface, met een korte notitie in de pull request en een aangepaste fake.

### 12.1 Werkpakketten

| WP | Naam | Bezit (mappen) | Levert | Gebruikt | Acceptatiecriteria |
|---|---|---|---|---|---|
| WP-0 | Fundament | root (`package.json`, `.nvmrc`, `pnpm-workspace.yaml`, `tsconfig.base.json`, lint), `apps/api/src/app.ts`, `server.*.ts`, `tooling/scripts/gen-modules.ts`, `tooling/bootstrap/**`, `apps/web/src/app/routes.tsx` (glob-lader), stubs | `pnpm bootstrap`, daarna `pnpm install --offline`, `pnpm dev`, `pnpm test`, `pnpm e2e`, `pnpm verify` op een schone checkout zonder netwerk | — | Schone checkout na bootstrap: install, build, lege tests en een lege Playwright-test (Chromium en WebKit) slagen offline; adapter getest op `better-sqlite3` en `node:sqlite` op de gepinde Node-versie; productiebundel zonder `dev` |
| WP-1 | Core-regie en experimenten | `packages/core/src/{params,time,experiments}`, lintregels voor core | Parameterset v2 (incl. netklassen met hogere drempels, puntenplafond 300, nachtregel, tentamendagen, wachttijd, vrijgavespreiding, `end_grace_min`, `closeAt`, seizoen, rustperiode), focusdag en weeksleutel; toewijzing uit de seed voor vier factoren met de uitzonderingen; review van elke wijziging in `packages/core` | — | Elke parameter uit spec §5 met specparagraaf; `closeAt` en zomertijd getest; toewijzing gebalanceerd per blok en reproduceerbaar; geen import van Node- of DOM-API's in core (lintregel) |
| WP-2 | Contracts | `packages/contracts/**` | Zod-schema's per module voor alle routes in §8.2, foutcodes met eigenaarsmodule, eventtaxonomie uit spec §7.1, API-client | `core`-typen | Elk endpoint uit §8.2 heeft request- en responseschema; bevroren op dag 2 (tag `contracts-v1`) |
| WP-3 | API-basis | `apps/api/src/{db,platform,middleware}`, `jobs/scheduler.ts`, `jobs/day_close/index.ts` (orchestrator), dagafsluitingsstappen 3 en 9, `services/{audit,events,experiments}.ts`, `modules/{auth,waitlist,dev,events}`, migraties `0001–0079` | Db-interface, migratierunner, auth met link, bevestiging en code, wachtlijst, CSRF, rate limit, logger met allowlist, idempotentie-middleware, foutafhandeling, auditwriter, eventwriter, netklasse, TOTP, dev-klok, scheduler | WP-1, `contracts` | Integratietests voor de hele inlogflow inclusief scanner-scenario en onder-16-verwijdering; CSRF-weigering; auditlog weigert UPDATE en DELETE; jobs idempotent per `run_key` en herstartbaar per stap; logtest (§10.9); wachtlijst live uiterlijk 12 november |
| WP-4 | Sessies en punten | `packages/core/src/{session,ledger,goals,catalog}`, `modules/{sessions,points,catalog,redemptions,phone,exam_days}`, `services/{ledger,userDay,sessions}.ts`, dagafsluitingsstappen 1, 2 en 10, `jobs/week_open.ts`, dekkingsalarm in `jobs/week_close.ts`, migraties `0100–0199` | Sessieprotocol met herhalingen (§4), herstel (§4.8), grootboek met `reconcileDay` (§5) inclusief puntenplafond, nachtregel, tentamendag en rustperiode, catalogus met soorten, dekking en gespreide vrijgave, verzilvering met wachttijd, telefoonverificatie met nummertype, nachtelijke controles | WP-3, `services` van WP-6 (fakes eerst) | Alle scenario's uit spec §4.1-tabellen als integratietest; herhalingstabel §4.7 volledig getest; 50 gelijktijdige verzilveringen leveren hoogstens één per week per gebruiker en nooit meer dan de voorraad; journaal sluit altijd op nul; eigenschapstests voor `reconcileDay` slagen |
| WP-5 | Sociaal | `packages/core/src/{squads,challenges,belofte,referral,privacy}`, `modules/{squads,invites,duels,clubs,challenges,leaderboards,belofte,cards,referral,reminders,surveys}`, dagafsluitingsstappen 4, 5, 6 en 8, `jobs/reminders.ts`, migraties `0200–0299` | Squads met streakherstel, hersamenstellen, meldknop en squadprompt, aanwezigheid (uit voor `16_17`), vergelijking, getuigenoverzicht, duels op dagdoelen, verenigingen met externe ledentalbron en overeenkomst, ranglijst met anker in de teller en terugvalvariant, bestuursdashboard met privacyregels, prestatiechallenges, Belofte met aanbod per arm, kaarten als SVG, referral achter vlag, herinneringsmail, vragenlijsten | WP-3, `LedgerService`, `UserDayRepository`, `PrizeService` | Privacytest §6.4 slaagt op alle sociale routes, inclusief de verschiltest; streak, joker, pauze en vakantiepauze kloppen met spec §4.4; deelnamegraad volgens §6.2 op seeddata nagerekend; SVG-escape-test |
| WP-6 | Fraude, beheer, steekproef en privacy | `packages/core/src/fraud`, `modules/{fraud,admin,sample,wellbeing,ambassadors,privacy,kpi,support}`, `services/{flags,prizes,privacy}.ts`, dagafsluitingsstappen 7 en 11, H9, steekproef en stopregeltelling in `jobs/week_close.ts`, `jobs/hourly.ts` (H10), migraties `0080–0099` en `0300–0399`, `docs/dpia/**` | Wachtrij, besluiten, beroep met uitsluiting, vier ogen, outages, heuristiek-batches met netklassen en hogere drempels, H11, wekelijkse steekproef en prijssteekproef, lijst eerste verzilveringen, schadesignalen met stopregeltelling en stopknop arm B, ambassadeurstelling, instellingsanker, export, verwijdering via erasers per module (incl. `squad_id` in events), bewaartermijnen, KPI-query's uit spec §7.2 per kanaal en zonder verdachte accounts, supporttickets | WP-3, `LedgerService`, `SessionRepository`, `UserDayRepository` | Geen route buiten `/admin` kan een negatief besluit boeken (test); steekproef reproduceerbaar uit de seed; verwijdertest §10.7 slaagt; retentietest §10.6 slaagt; H2, H7 en H10 markeren de gesimuleerde UB-NAT niet en het red-teamscenario wel |
| WP-7 | Web-shell | `apps/web/src/{app,design,lib/api,sw}`, `i18n/*/common.json`, `apps/web/public` | Layout, router met glob-lader, providers, tokens uit UX §5, basiscomponenten, i18n-opzet met lintregels, getypeerde client met mock uit contracts, manifest, service worker | `contracts` | Manifesttest en offline-shelltest (§9.4); axe zonder ernstige fouten op de shell; contrasttest op tokens |
| WP-8 | Web focus-engine en toegang | `apps/web/src/{platform,features/focus,features/onboarding,features/waitlist}`, `i18n/*/{focus,onboarding,waitlist}.json` | Adapters (§9.5) incl. transport met herhalingen, sessie-store, focusweergave, eind- en afbreekschermen, inloggen met bevestigingspagina en code, onboarding met oefensessie, wachtlijst, outbox, test-hooks `__rwTest` | `core/session`, WP-7, `contracts` | E2E-scenario's voor sessie, afbreken, offline, herladen, dubbele tab, gedropte antwoorden en inloggen slagen in Chromium en WebKit; handmatige toesteltest (§11) afgevinkt |
| WP-9 | Web features | `apps/web/src/features/{points,squads,duels,club,challenges,belofte,cards,survey,profile}`, bijbehorende i18n-bestanden | Alle studentenschermen behalve focus, onboarding en wachtlijst; tentamendag, schadekaart, vragenlijsten, afmelden voor het onderzoek, instellingsmail, nepdeur Plus; rasterizer voor kaarten | WP-7, `contracts` | Copy volgens spec (punten nooit tijdens de sessie; dagdoel en weekprestatie vóór punten; geen punten in uitnodigingen; geen schaamtetaal); componenttests per scherm |
| WP-10 | Web bestuur en beheer | `apps/web/src/features/{board,admin}`, i18n-bestanden | Bestuursdashboard, beheeromgeving uit spec §4.11 met TOTP-inlog, inclusief steekproef, eerste verzilveringen, schadesignalen, ambassadeurs | WP-7, `contracts` | Beheerder kan op seeddata een markering vrijgeven, een sessie herstellen, een item met verklaring publiceren, een wachtlijstbatch uitnodigen, een steekproef beoordelen en een uitslag pas na de prijssteekproef met vier ogen definitief maken |
| WP-11 | Seed, e2e en A/A | `tooling/seed/**`, `tooling/scripts/aa-check.ts`, `e2e/**` (behalve de specs die WP-8 schrijft in `e2e/focus/`) | Demo- en lege seed met red-teamscenario, Playwright-config met API-proces per worker en WebKit-project, alle scenario's uit §11, A/A-controle, handmatige checklist met batterijverbruik en iOS-gedrag per platform | Alles | `pnpm seed:demo && pnpm e2e` slaagt lokaal zonder netwerk, met meerdere workers; A/A-controle vóór 2 december groen |

### 12.2 Bevroren service-interfaces

`apps/api/src/services/` bevat alleen interfaces, typen en fakes. De implementatie staat in de eigenaarsmodule en wordt bij het opstarten in een `Services`-object gezet dat elke module bij `register` krijgt. Een module importeert nooit een andere module direct; een lintregel bewaakt dat.

| Interface | Eigenaar | Kern van de signatuur | Gebruikers |
|---|---|---|---|
| `LedgerService` | WP-4 | `post(tx, rule: RuleId, key: string, args)`; `reconcileDay(tx, userId, day, cause): Entry[]`; `balances(userId)`; `expireAll(tx, userId, reason)` | WP-5 (referral), WP-6 (besluiten, verwijdering) |
| `UserDayRepository` | WP-4 | `get(userId, day)`; `range(userIds, from, to)`; `bumpRev(tx, userId, day): number`; `finalMinutes(userId, from, to)` | WP-5 (squads, challenges, duels, Belofte), WP-6 (H5, schadesignalen, steekproef) |
| `SessionRepository` | WP-4 | `byDay(userId, day)`; `setReviewStatus(tx, sessionIds, status)`; `forHeuristics(window)`; `restore(tx, sessionId, reason, actor)` | WP-6 |
| `FlagService` | WP-6 | `raise(tx, { code, subject, sessionIds, evidence }): flagId`; `decide(tx, flagId, decision, actor, reasonCode)`; `openForSessions(ids)` | WP-4 (H1, H3, H4 bij de uitspraak, H8 bij telefoon, "Klopt dit niet?"), WP-5 (kaarten weigeren bij open markering) |
| `PrizeService` | WP-6 | `createForChallenge(tx, challengeId, spec)`; `candidates(challengeId)`; `verify(tx, prizeId, actor)` | WP-5 |
| `PrivacyService` | WP-6 | `registerEraser(module, (tx, userId) => void)`; `registerExporter(module, (userId) => object)` | Elke module met persoonsgegevens registreert een eraser en een exporter voor haar eigen tabellen |
| `AuditWriter`, `EventWriter`, `ExperimentService` | WP-3 (de toewijzingsregels zelf in `core/experiments`, WP-1) | `audit(tx, entry)`; `event(tx, name, props, pseudonym?)`; `assign(tx, unit, factors)`, `switchArm(tx, …)`, `optOut(tx, userId)`, `stopArmB(tx, actor)` | Alle |
| `Clock`, `Random`, `Mailer`, `SmsSender` (met `lookupLineType`), `NetClassifier`, `Logger` | WP-3 | Platforminterfaces met productie- en testimplementatie | Alle |

Elke fake is een in-memory implementatie die dezelfde invarianten afdwingt (nul-som, unieke sleutels). Zo kan WP-5 de doelbonus of de referral testen en WP-6 besluiten nemen voordat het echte grootboek van WP-4 af is, zonder een eigen variant te bouwen.

### 12.3 Eigenaarschap per tabel, stap en namespace

**Tabellen en migratiereeksen.** De reeksen draaien in nummervolgorde; een foreign key wijst altijd naar een tabel uit dezelfde of een eerdere reeks.

| Reeks | Eigenaar | Tabellen |
|---|---|---|
| `0001–0079` | WP-3 | `user`, `auth_magic_link`, `auth_daily_stat`, `auth_session`, `admin`, `admin_mfa`, `device`, `invite`, `waitlist_entry`, `audit_log`, `event`, `event_pending`, `job_run`, `idempotency_record`, `feature_flag`, `param_set`, `vacation_pause`, `outage`, `experiment_assignment`, `arm_switch` |
| `0080–0099` | WP-6 | `fraud_flag`, `appeal` (in de basisreeks, zodat latere reeksen ernaar kunnen verwijzen) |
| `0100–0199` | WP-4 | `focus_session`, `session_heartbeat`, `visibility_event`, `session_summary`, `user_day`, `ledger_account`, `ledger_account_owner`, `journal_entry`, `posting`, `partner`, `partner_budget`, `budget_allocation`, `reward`, `reward_voucher`, `redemption`, `phone_verification` |
| `0200–0299` | WP-5 | `squad`, `squad_membership`, `squad_day`, `duel`, `club`, `club_board_member`, `club_membership`, `challenge`, `challenge_enrollment`, `challenge_score`, `belofte`, `belofte_offer`, `card`, `referral`, `reminder_log`, `survey_response` |
| `0300–0399` | WP-6 | `fraud_flag_session`, `blocked_phone_hash`, `prize`, `prize_delivery_contact`, `fraud_sample`, `fraud_sample_item`, `harm_signal`, `ambassador`, `support_ticket` (de `draw_*`-tabellen uit versie 1.1 vervallen) |

`user.registration_invite_id` verwijst naar `invite` in dezelfde reeks; `squad_membership.invite_id` en `club_membership` verwijzen terug naar de basisreeks; `prize` verwijst naar `challenge` (0200) en `budget_allocation` (0100). Geen tabel uit een lagere reeks verwijst naar een hogere.

**Dagafsluiting en andere jobs.** De stappen en eigenaars staan in §6.1. De orchestrator is van WP-3; een stap is een bestand `jobs/day_close/<nn>-<naam>.ts` in de map van de eigenaar en wordt via het manifest geladen, zodat een nieuwe stap de orchestrator niet bewerkt. `week_open` (grant, vrijgave) is van WP-4, `week_close` heeft twee stappen (dekkingsalarm WP-4, H9 WP-6), `hourly` (H10) en de sweep zijn van WP-6 respectievelijk WP-4, `reminders` van WP-5.

**Vertaalnamespaces.** `common.json` is van WP-7. Elke feature-namespace (`focus.json`, `squads.json` enzovoort) is van het web-pakket dat de feature bezit. Elke foutnamespace `errors/<module>.json` is van het API-pakket dat de module en dus de foutcodes bezit; de test uit §9.6 controleert dat elke code in de namespace van haar eigenaar staat. Gedeelde codes (`VALIDATION_FAILED`, `RATE_LIMITED`, `AUTH_REQUIRED`, `INTERNAL`) staan in `errors/common.json` van WP-3.

### 12.4 Bezetting en volgorde

Het businessplan rekent met drie bouwrollen: een senior engineer met native iOS-ervaring, een full-stack engineer en een ontwerper in deeltijd, met AI-ondersteunde ontwikkeling (**aanname**: de mensen zijn nog te werven; businessplan §10). Twaalf pakketten zijn dan geen parallel plan maar een wachtrij, dus hieronder staat wie wat doet, uitgaande van drie bouwers: A (sessie, punten en experimenten; de senior engineer), B (API-basis, sociaal en beheer; de full-stack engineer) en C (web, met AI-ondersteuning en de ontwerper voor tokens en schermen). WP-1 is geen apart persoon: A bewaakt de parameters en reviewt core, en de andere core-submappen liggen bij de pakketten die ze gebruiken, zodat WP-1 geen knelpunt is.

| Week | A | B | C | Klaar aan het eind |
|---|---|---|---|---|
| 1 (do 5 – zo 8 nov) | WP-0 op dag 1; `core/params`, `core/time`; typen van `core/session` en `core/ledger`; interfaces `LedgerService`, `UserDayRepository`, `SessionRepository` | WP-2 voor alle modules; interfaces `FlagService`, `PrizeService`, `PrivacyService`, `AuditWriter`, `EventWriter` met fakes | WP-7: shell, tokens uit UX §5, i18n-opzet, mock-client | Vrijdag 6 november: tags `contracts-v1`, `services-v1`, `core-types-v1` |
| 2 (9–15 nov) | `core/session` (machine, verify, retry); `modules/sessions` met herhalingen | WP-3: db, migraties, auth met code, wachtlijst (live uiterlijk 12 nov), CSRF, rate limit, logger, scheduler, orchestrator | WP-7 af (manifest, offline-shell); WP-8: adapters en focusweergave tegen de mock | Sessie start en loopt tegen de echte API; wachtlijst live |
| 3 (16–22 nov) | `core/ledger` met `reconcileDay`, `core/goals`; `points`, dagafsluiting 1, 2 en 10; `core/catalog`, catalogus, verzilvering, telefoon | `core/squads`, `squads`, `invites`, `clubs`, `leaderboards`; `core/privacy` en bestuursdashboard; aanloopklassement | WP-8: integratie met sessies, inloggen, onboarding; e2e-specs voor het kritieke pad | Kritiek pad e2e groen in Chromium |
| 4 (23–29 nov) | E2E voor gedropte antwoorden en 03:55; weekjobs met gespreide vrijgave; verzilveringsconcurrentie en wachttijd; `restore`; `core/fraud` H1, H3, H4, H11; `core/experiments` met A/A-controle (uiterlijk 30 nov) | WP-6: wachtrij, besluiten, beroep, outages, batchheuristieken met hogere drempels op de seed met UB-NAT en red-teamscenario (drempels na de red-teamdag, uiterlijk 25 nov), steekproef, schadesignalen, verwijdering, export, 24-uursopschoning, KPI-query's per kanaal | WP-9: punten, squad, vereniging, profiel, tentamendag, schadekaart, instroomvragenlijst; WP-10 minimaal (wachtrij, steekproef, eerste verzilveringen, catalogus en budget, verenigingen, wachtlijstbatch); handmatige toesteltest 25–27 nov met batterijverbruik en iOS-gedrag per platform | 25 november: haalbaarheidsmelding aan de founder |
| 5 (30 nov – 1 dec) | Fixes; A/A-controle groen | Fixes | Fixes | Release-checklist R1 |
| R2 (2–16 dec) | Kaarten-API en SVG; WebKit-project op alle specs | Belofte met aanbod per arm (eerste aanbod 11 januari), duels op dagdoelen, pilotreflectie en vragenlijst eind januari, retentie voor de termijnen van 30 en 90 dagen, herinneringsmail als die in R1 schoof | Belofte-, duel-, vragenlijst- en kaartschermen met rasterizer; modus zonder punten | R2 |
| R3 (17 dec – 5 jan, met de vakantie) | Rustperiode in `reconcileDay` achter de vlag `rest_period`, met e2e op 18 januari | Prijsperiode met anker in de teller, prijssteekproef, terugvalvariant, prestatiechallenges, prijzen en winnaarsverificatie, referral | Challenge- en prijsschermen, bekendmaking rustperiode | R3 |

**Kritiek pad.** `core/session` → `modules/sessions` (met herhalingen) → `features/focus` en `platform` → e2e van de sessie → handmatige toesteltest. Het loopt via A en C en heeft geen speling: schuift het een week, dan schuift R1. Het tweede knelpunt is B in week 2 tot en met 4, die WP-3, de R1-delen van WP-5 en WP-6 draagt. Daarom liggen de fakes van week 1 klaar, zodat B sociaal en beheer kan bouwen voordat A het grootboek af heeft, en schuift de retentie voor termijnen van 30 dagen en langer naar R2 (de eerste verloopt pas begin januari); de opschoning van 24 uur gaat wel in R1.

De trekkingsmodule is uit R3 gehaald (besluit 3 na ronde 1); de vrijgekomen tijd van A in R3 gaat naar de rustperiode-arm, en de extra R1-onderdelen (experimentfactoren, steekproef, schadesignalen, anker, wachttijd) vullen de ruimte die in week 4 ontstond doordat de beacon en de testvectoren niet meer nodig zijn. Dat is krap; de haalbaarheidsmelding van 25 november zegt of R1 op 2 december haalbaar is.

**Met twee ontwikkelaars** past R1 niet zonder schrappen. Dan geldt de schrapvolgorde van spec §8 (Could-items, nepdeur Plus, e-mailherinnering, aanloopklassement naar 9 december, minuten vergelijken), en daarnaast stel ik voor: het WebKit-project naar R2 (de handmatige toesteltest blijft), de beheer-UI in R1 alleen voor wachtrij, catalogus en budget, verenigingen en wachtlijst, met de overige beheerhandelingen als gedocumenteerde scripts in `tooling/scripts`, en de KPI-query's als script in plaats van een scherm. Dat voorstel is aan de founder (open vraag 16).

**Wat nooit schuift.** Focus-engine, grootboek met `reconcileDay`, squads, events, de experimenttoewijzing met seed, de fraudewachtrij, de steekproef, de deelnemersbescherming (geïnformeerde deelname, afmelden, schadesignalen, stopknop arm B), de idempotente sessieroutes, de dagafsluiting om 05:45, de verwijdering en de logging zonder persoonsgegevens. R2- en R3-onderdelen zitten in dezelfde pakketten maar achter vlaggen; de vlaggen gaan aan op 16 december en 5 januari, `rest_period` op 18 januari en alleen na akkoord van de jurist.

## 13. Na de MVP

De verificatieladder (businessplan §4, rapport 09 §8) bepaalt wat er na de pilot verandert. De architectuur houdt daar op vijf punten al rekening mee.

**Native wrapper.** Trede 2 is een native app op de voorgrond met attestatie. Voorstel: de web-app verpakken met een cross-platform-wrapper (bijvoorbeeld Capacitor) en native onderdelen als plugins schrijven; rapport 09 §8 schat 8–12 weken voor iOS en Android. Dat kan omdat alle platformafhankelijkheid achter de adapters in `src/platform/` zit: native adapters vervangen de webversies, machine en protocol blijven gelijk (open vraag 15).

**Screen Time en UsageStats.** Op iOS beloont Rewarded een actieve blokkade, geen gemeten niet-gebruik, en een drempel-callback is aanleiding voor controle, geen automatisch verlies (rapport 09 §1.2, §8). Android stuurt alleen "sessie schoon ja/nee" plus de gebeurtenissen rond begin en einde (rapport 09 §2.1, §7.3). Het schema heeft `verification_level` op de sessie en krijgt een tabel `session_evidence` (`session_id`, `kind`, `payload`) voor het bewijs per trede; `evaluateSession`, de plafonds in `core/params` en de toegestane beloningssoorten in `core/catalog` zijn al per niveau opgezet.

**Attestatie.** `device` heeft de velden `attestation_kind` en `attestation_ref` al voor App Attest en Play Integrity. Plafonds per toestel en per persoon worden een extra controle in de verzilveringstransactie. Omdat App Attest-sleutels een herinstallatie niet overleven en DeviceCheck-bits eerst in productie getest moeten worden (rapport 09 §7.2), rust het plafond per persoon op telefoonnummer en later identiteit.

**Betalingen.** Plus krijgt na native verificatie een eigen abonnementstabel en raakt het puntengrootboek niet; in de web-MVP is er alleen de nepdeur (`plus_interest`). De inzetlaag blijft visie, buiten deze ronde en de bouw (businessplan besluit 3); komt ze ooit, dan pas na native verificatie, juridische toetsing en een volgende ronde, als kaartreservering zonder eigen saldo, met verbeurde inzet volledig naar een goed doel. Er bestaat geen boekingsregel die punten in euro's omzet en die komt er ook niet. Het pool-model komt in geen fase terug.

**Schaal.** SQLite met WAL volstaat voor de pilot (**inschatting**: enkele honderden gelijktijdige sessies geven enkele heartbeats per seconde). Bij groei vervangt een Postgres-adapter de `Db`-interface; de SQL blijft daarom standaard, en rate limiting en scheduler gaan naar gedeelde opslag.

## 14. Open vragen en risico's

De lijst is gerangschikt op urgentie. "Besluit" betekent dat de founder kiest; "product" dat de auteur van de spec het bevestigt; "jurist" dat het in de advocatenopinie of DPIA hoort; "risico" dat de architectuur het beheerst maar niet wegneemt.

| # | Onderwerp | Soort | Wat er speelt | Voorstel of beheersing |
|---|---|---|---|---|
| 1 | Hosting, mailer, sms, back-up, reverse proxy | Open, blokkerend voor 2 december | De MVP draait lokaal; waar de pilot draait, wie e-mail en sms levert en hoe de proxy logt, is niet besloten | Eén kleine EU-gehoste server met dagelijkse versleutelde back-up van de database en een aparte back-up van de geheimen (§10.9); EU-verwerkers met verwerkersovereenkomst; proxy-log zonder IP; vermelden in de DPIA |
| 17 | Netklassen en hogere drempels voor campus en mobiel CGNAT | Besloten (founder J2); getallen open, vóór de voorregistratie | Niet overslaan maar een hogere drempel; de CIDR-bereiken zijn nog niet verzameld en de drempels komen uit de red-teamdag | Netklasse bij ontvangst (§4.5); bereiken bij de IT-diensten van de instellingen en uit de RIPE-registratie, met bron per regel; drempels vóór 2 december op de seed vastgelegd (UB-NAT markeert niet, red-teamscenario wel) |
| 26 | Sleutelhash van het instellingsadres | Jurist (DPIA) | De founder vraagt "alleen vinkje en domein"; zonder hash kan één instellingsadres onbeperkt accounts verankeren | `institution_email_hash` met eigen pepper, alleen voor uniekheid; de DPIA beslist; zonder akkoord vervalt de hash en telt het anker alleen samen met een geverifieerd mobiel nummer |
| 27 | Rustperiode-arm en "geen hogere maximale beloning" | Jurist, vóór 25 november | De rustperiode-arm levert per constructie minder op dan de doorlopende arm, terwijl de opdracht aan de advocaat bevestiging vraagt dat geen arm een hogere maximale beloning kan opleveren (founder JS2) | De vlag `rest_period` gaat alleen aan na schriftelijk akkoord; de architectuur kan de arm zonder migratie uitzetten |
| 28 | Einde rustperiode en aprilchallenge | Besluit, vóór 2 december | "Tot de aprilchallenge" en "terugkeer in april zonder nieuwe challenge" botsen als de challenge in het meetvenster valt | Parameter `rest_period_end_day`; voorstel: na het aprilvenster (voorregistratie open punt 1) |
| 29 | Belofte-aanbod per vereniging | Product, vóór 2 december | Het vroege aanbod hangt aan de laatste tentamenweek per vereniging, die nog niet per vereniging bevestigd is | `belofte_offer.due_day` per vereniging uit `params`; terugval 11 januari |
| 16 | Tijdpad en bezetting | Risico, besluit | Twaalf pakketten in vier weken met twee à drie ontwikkelaars (spec open vraag 2); het kritieke pad heeft geen speling en B is overbelast in week 2–4 | Bezetting en schrapvolgorde in §12.4; met twee ontwikkelaars de extra schrappingen uit §12.4; uiterlijk 25 november melden of R1 op 2 december haalbaar is |
| 20 | Derde beoordelaar voor beroepen | Besloten (productplan §10), vast te leggen vóór 2 december | Met twee beheerders blijft na een bevestigde blokkade niemand over die het beroep mag beslissen (§10.8) | Een extern adviseur (jurist) met geheimhoudingsafspraak; vastleggen in de DPIA |
| 21 | Wachtlijst live vóór 12 november | Open | De pre-launch loopt vanaf 4 november (businessplan §6); `POST /waitlist` is er uiterlijk 12 november | Eerdere aanmeldingen via een ander kanaal importeren met `source = other` en een bevestigingsmail met toestemming; besluit founder over het tijdelijke kanaal |
| 2 | Herladen als afbreking | Besluit | De spec telt `pagehide` als afbreken, dus ook per ongeluk herladen | Volgen, met `beforeunload`-waarschuwing en detail `reload`; na de pilot op data beslissen of een uitzondering (pagina zichtbaar gebleven, gat < 90 s) de bewust geopende fraudeweg waard is |
| 3 | Node-versie en SQLite-driver | Risico, aanname | Dat `node:sqlite` vanaf Node 22.13.0 zonder vlag laadt, is een aanname; `better-sqlite3` vraagt een prebuild of Node-headers | WP-0 test beide op dag één op de gepinde versie; prebuild in de bootstrapcache (§2.1) |
| 4 | Definitie "actief lid" | Besluit | De spec definieert het voor de intensiteit niet | Gekoppeld lid met ≥ 1 voltooide, niet-afgekeurde sessie in de challengeweek (§6.2) |
| 5 | Gelijke stand in de ranglijst | Besluit | Een gedeelde eerste plaats vraagt een tweede gedekte hoofdprijs | Eerst intensiteit, dan gedeelde plaats; vooraf in de challengevoorwaarden |
| 18 | Bestuursdashboard per week | Product | Spec §4.6 noemt wervingscijfers per dag; dagreeksen maken verschilaanvallen mogelijk (§6.4) | Werving en Kwaliteit per week, afgerond op 5, met verschilonderdrukking; Stand blijft dagelijks |
| 22 | Tijdstip van de dagafsluiting | Product | Spec §7.1 noemt 04:00 voor de dagevents; de afsluiting draait nu om 05:45 (§6.1) | De dagrand blijft 04:00; alleen het rekenmoment verschuift; spec bijwerken |
| 23 | Toegestane beloningssoorten | Besloten (founder JS6) | Een voucher of korting voor één product of dienst valt binnen de uitsluiting voor beperkte netwerken; tegoed voor een assortiment niet | `partner_discount` toegestaan; de partnerverklaring (`declaration_ref`) maakt het onderscheid expliciet; assortimentstegoed bestaat niet als soort |
| 6 | H1 is te omzeilen | Risico, geaccepteerd | Wie `navigator.webdriver` overschrijft, haalt een ongemarkeerde sessie; de e2e-suite en de red-teamdag leggen dat vast | Plafonds, soortregel, inverdienperiode met wachttijd, telefoonverificatie met nummertype, H11 en vertraagde levering zijn de echte verdediging (spec §6.1, rapport 09 §3.3); de steekproef meet wat er doorheen komt; boven 5% geschatte fraude gaan beloningen omlaag (businessplan §9) |
| 7 | (Vervallen) Eerlijkheid van trekkingen | — | Trekkingen worden niet gebouwd (§7) | — |
| 8 | Gebufferde logs zijn getuigenis van de client | Risico | Een gemanipuleerde client kan een dekkend log tot vijf minuten verzinnen | Begrensd tot gaten ≤ 5 min, boven 10% van de duur gemarkeerd (H3); kalibratie is een werkhypothese (spec open vraag 11) |
| 9 | Eén API-proces | Aanname | Rate limits, scheduler en sweep draaien in het geheugen van één proces | Jobs zijn idempotent via `job_run`; bij een tweede proces rate limits naar gedeelde opslag |
| 10 | iOS-gedrag in het veld | Aanname | Wake Lock en zichtbaarheid in de Home Screen-app vanaf iOS 18.4 komen uit compatibiliteitsdata (rapport 09 §3.1, C7); aandeel oudere iOS-versies onbekend; inloggen in de Home Screen-app is alleen met de code betrouwbaar | Handmatige toesteltest vóór R1, inclusief inloggen; zonder Wake Lock eerlijke uitleg dat het scherm uit kan gaan |
| 11 | Zomertijd en dagrand | Risico, klein | De dagrand van 04:00 en het sluitmoment van 05:45 liggen in een wisselnacht anders | `Intl`-tijdzonedata en tests voor 29 maart en 25 oktober; in de pilot valt geen wissel |
| 12 | Bewaartermijn grootboek en verzilveringen | Jurist, fiscalist | Voor de financiële administratie kan een wettelijke bewaarplicht gelden | Auditlog twee jaar (besloten, founder JS5); grootboek en verzilveringen zolang de verantwoording aan partners en een eventuele fiscale plicht vragen; vast te leggen in de DPIA |
| 19 | Events na verwijdering | Jurist (DPIA) | Met een nieuw pseudonym, een vervangen `squad_id` (founder J5) en zonder koppelvelden zijn ze aan geen rij meer te koppelen, maar wel per persoon te groeperen | Zo doen tot het einde van de analyseperiode (uiterlijk 15 juni 2027); als de DPIA dat onvoldoende vindt, direct aggregeren bij verwijdering |
| 24 | Termijnen in §10.6 | Jurist (DPIA) | Veel termijnen zijn keuzes van de architectuur | Vastleggen in de DPIA vóór 2 december; de retentiejob leest ze uit `params` |
| 13 | Leeftijdscontrole bij 18+-prijzen | Open (spec open vraag 8) | Controle zonder kopie van een identiteitsbewijs en zonder BSN (founder J5) | Alleen uitkomst, datum en beheerder opslaan; werkwijze besluiten vóór R3 |
| 14 | Cookiebepaling en IP-hash | Jurist (spec open vraag 14) | Valt de IP-hash eronder, dan vragen H2, H7, H10 en de referraluitsluiting mogelijk toestemming | Uitkomst afwachten; zonder die heuristieken stijgt het fraude-risico |
| 25 | Moment van de herinneringsmail | Product | Spec §8 noemt geen tijdstip | 19:30 Europe/Amsterdam als parameter; na de eerste pilotweek bijstellen op data |
| 15 | Wrapper of volledig native | Open, na de pilot | Niet onderzocht of Screen Time-extensies en UsageStats-verwerking in een wrapper passen | Uitzoeken bij de planning van trede 2 (hoofdstuk 13) |

## 15. Wijzigingslog

**4 november 2026, versie 1.1 (na kritische tegenlezing).**

- §4.2, §4.7, §8.2: sessieprotocol idempotent gemaakt. Server bewaart huidige en vorige nonce-hash plus het antwoord op `last_seq`; een herhaling met de vorige nonce en dezelfde `seq` krijgt het gecachete antwoord. `POST /sessions` met `Idempotency-Key`; op hetzelfde toestel hervat de server de lopende sessie met een nieuwe nonce (`SESSION_ACTIVE` vervallen). `/end` en `/stop` geven bij herhaling de opgeslagen uitspraak. Aparte tellers `seq` en `ev_seq`. Rate limit op nieuwe `seq`. E2E met gedropte antwoorden.
- §6.1, §4.4, `core/time`: dagafsluiting voor focusdag D om 05:45 (`closeAt` uit parameters); weekopening om 04:00, weekafsluiting om 05:45; unit- en e2e-test voor een sessie die om 03:55 start.
- §5.1, §5.5: `reconcileDay` als één pure functie voor sessie-einde, dagafsluiting, besluit, herstel en beroep; compenserende posten met sleutels per object en revisie; doelbonus bij het sessie-einde met de dagafsluiting als vangnet; seizoen op focusdag; daglimiet met aanvulling zonder negatieve correctie; drie nachtelijke controles; `fraud_flag_session` voor markeringen over meerdere sessies.
- §3.3, §10.7: journaal zonder `user_id`, koppeling via `ledger_account_owner`; triggers blijven heel; `DELETE /me` per tabel uitgeschreven; auditlog met HMAC-verwijzingen; integratietest op restanten.
- §3.3, §5.3, §4.6: `reward.kind` en `prize.reward_kind` met `CHECK`; open cadeaukaart, winkeltegoed en geldequivalent bestaan niet; publiceren vraagt partnerverklaring en vinkje van de beheerder; regel per verificatieniveau in `core/catalog`.
- §4.5, §10.4: netklasse bij ontvangst met CIDR-lijst in `params`; H2, H7 en H10 slaan `campus` en `mobile_cgnat` over (besluit founder gevraagd); toets op seed met UB-NAT vóór de voorregistratie.
- §7: trekking met deterministische entry-codes uit een vooraf gecommit salt, publicatie van de deelnemerslijst vóór een externe beacon-ronde, selectie als pseudocode met afwijzing en verwijderen zonder teruglegging, testvectoren, seed buiten de database, kwalificatie op `goal_met_final`.
- §12: eigenaarstabellen per tabel en migratiereeks, per dagafsluitingsstap en per vertaalnamespace; modules en features via manifest en glob; bevroren service-interfaces met fakes; core-submappen bij de gebruikende pakketten; bezetting per ontwikkelaar per week met kritiek pad.
- §10.1, §9.1: inloglink met token in het fragment en een bevestigingsknop, zescijferige code in dezelfde mail, uitnodiging in de magic-linkrij; `auth_daily_stat` als KPI; toesteltest voor iOS Home Screen en in-app browser.
- §3.1, §8.2, §9.1: wachtlijst met voorrangsklassen en groepen, `POST /waitlist`, batchuitnodiging met bron `waitlist`, bron `card` voor de kaart-QR.
- §10.9: logging met allowlist en logtest; peppers, TOTP-sleutel en trekkingsseeds in een aparte geheimenmap buiten de databasebackup.
- §10.6: bewaartermijnen per tabel en kolom, inclusief `event`, `fraud_flag.evidence`, `appeal.text`, wachtlijst en logs; `blocked_phone_hash` los van het account.
- §2.1, §9.4, WP-0: Node gepind, offline-bootstrap met pnpm-store, driver-prebuild en Playwright-browsercache; kaarten alleen als SVG met rastering in de browser; Lighthouse vervangen door eigen manifest- en offlinetests.
- §11: API-proces en database per Playwright-worker; WebKit-project.
- Kleinere punten: `device` met server-ULID en unieke (`client_device_id`, `user_id`); gedeeltelijke unieke index op verzilveringen en vervangende voucher op dezelfde verzilvering; `CHECK` op oefensessie; `restore_session` (§4.8); herinneringsmail, getuigenoverzicht, doelvoorstel, supporttickets, leveringsgegevens en leeftijdscontrole bij prijzen; budgetannulering alleen met dekking en append-only allocaties; beroep uitgesloten voor iedereen die aan het besluit meewerkte, TOTP voor beheer; bestuursdashboard per week met afronding en verschilonderdrukking; `event_pending` voor pre-gebruikers en serverevents in dezelfde transactie; SVG-escape en strenge headers; dev-module buiten de productiebuild.
- §1, §9.7: UX-ontwerp bestaat nu; tokens komen uit UX §5.

**4 november 2026, versie 1.2 (ronde 1, na pitchronde 1).** Herzien volgens de bindende besluiten in `docs/pitch/ronde-1-founder-reactie.md`.

- §7, §8.2, §9.1, §12: trekkingsmodule uit de bouw (J4, S9). `core/draws`, de `draw_*`-tabellen, de trekkingsroutes, `/kans`, de `Beacon`-interface, `draw-verify` en de testvectoren vervallen; vlag `draws` en de waarde `drawn` blijven als lege plek. WP-6 heet nu "Fraude, beheer, steekproef en privacy"; WP-1 krijgt `core/experiments`; WP-11 de A/A-controle; R3 krijgt de rustperiode-arm in plaats van trekkingen.
- §3: nieuwe velden en tabellen voor e-mailnormalisatie, nummertype, instellingsanker, wachttijd op de eerste verzilvering, afmelding voor het onderzoek, instroomkanaal, tentamendag, nachtregel, streakherstel, hersamenstellen, extern ledental en verenigingsovereenkomst, duels op dagdoelen, Belofte-aanbod per arm, vragenlijsten, schadesignalen, steekproef, ambassadeurs, vier experimentfactoren (G1, G2, G4, GS2, GS4, GS5, J2, J3, J5, JS3).
- §4.5: hogere drempels voor `campus` en `mobile_cgnat` bij H2, H7 en H10 in plaats van overslaan, met de getallen uit de red-teamdag; nieuwe H11 (toestel-id bij verzilvering); H5 op `verified_min` (J1, J2, J3).
- §5: puntenplafond 300 in plaats van 480; nachtregel, tentamendag, rustperiode en minderjarigen in `reconcileDay`; wachttijd en nummertype bij verzilvering; gespreide voorraadvrijgave met reservering voor accounts met een anker; partnerverklaring (G1, G4, GS9, J3, JS6).
- §6: dagafsluiting met schadesignalen, streakherstel en hersamenstellen; ranglijst met anker in de teller, extern ledental, hoofdprijs alleen bij externe bron, terugvalvariant en verplichte prijssteekproef; nieuwe §6.5 wekelijkse steekproef; duels op gehaalde dagdoelen en buiten de squad alleen 18+; privacy van aanwezigheid voor `16_17` (G4, GS4, J1, J2, JS3).
- §10: grondslag per verwerking (sub b en sub f), DPIA-planning, verwerkers, toestel-id; `squad_id` in events vervangen bij verwijdering; auditlog 2 jaar; ruwe events tot na de aprilmeting, uiterlijk 15 juni 2027 (J5, JS4, JS5).
- §11: nieuwe unit-, eigenschaps- en e2e-scenario's (nachtregel, plafond 300, tentamendag, rustperiode, wachttijd, H11, nummertype, e-mailnormalisatie, steekproef, prijssteekproef, minderjarigen), A/A-controle (GS10).
- §12.4: bezetting gelijk aan het businessplan (drie bouwrollen, AI-ondersteund; M5); §14: nieuwe open vragen 26–29 (sleutelhash instellingsadres, rustperiode-arm tegenover JS2, einde rustperiode, Belofte-aanbod per vereniging).

