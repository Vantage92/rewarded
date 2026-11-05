# Rewarded — Technische architectuur web-MVP

*Rol: technisch architect. Versie 1.0, 4 november 2026. Bouwdocument voor de bouwers van R1 (2 december 2026), R2 (16 december) en R3 (5 januari 2027). Bindend kader: `docs/01-businessplan.md` (verder: businessplan). Functionele bron: `docs/research/05-productspecificatie.md` (verder: spec); alle parameters, codes en drempels komen daaruit en worden hier niet opnieuw gekozen. Bewijs over browsers en verificatie: `docs/research/09-verificatietechniek.md` (verder: rapport 09). AVG en fraude-economie: `docs/research/02-businessmodel-juridisch-unit-economics.md` §2.4 en hoofdstuk 4 (verder: rapport 02). Een UX-ontwerp (`06-ux-ontwerp.md`) bestond op de datum van dit document nog niet; §9.7 beschrijft hoe de tokens aansluiten zodra het er is. Keuzes die niet uit een bron volgen, staan er als **keuze** (met reden), **aanname** of **open vraag** (hoofdstuk 14).*

---

## 1. Overzicht en principes

Rewarded bestaat in de MVP uit drie delen in één repository: een Progressive Web App die de focussessie op het toestel draait, een Node-API die als enige beslist wat een sessie waard is, en een puur TypeScript-domeinpakket met alle regels die beide kanten moeten kennen. Er is geen derde partij in de keten: geen analytics-SDK (verboden in spec §4.10), geen cloudfunctie, geen externe auth-dienst.

```
 Browser (PWA)                                 Server (Node 22)
 ┌───────────────────────────────┐             ┌──────────────────────────────┐
 │ React UI  ── i18n NL/EN       │   HTTPS     │ Hono-router  /api/v1         │
 │ Sessie-machine (core) ────────┼── JSON ────▶│ Sessieverifier (core)        │
 │ Platform-adapters:            │  cookie     │ Grootboek (core + SQL)       │
 │  Page Visibility, Wake Lock,  │             │ Jobs 04:00 Europe/Amsterdam  │
 │  performance.now, Web Locks   │◀── nonce ───│ Heuristieken H1–H10 (core)   │
 │ Outbox in IndexedDB           │             │ SQLite (WAL) + migraties     │
 │ Service worker (app-shell)    │             │ Dev-inbox, dev-klok          │
 └───────────────────────────────┘             └──────────────────────────────┘
                 ▲                                         ▲
                 └──────────── packages/core ──────────────┘
                   (toestandsmachine, regels, parameters)
```

Vier principes sturen elke ontwerpkeuze hieronder.

**Local-first sessie.** Een sessie mag niet sneuvelen omdat de bibliotheekwifi een minuut wegvalt. Na de start loopt ze op het toestel door zonder netwerk: de client meet tijd met de monotone klok (`performance.now()`), legt elke zichtbaarheids- en Wake Lock-wijziging met volgnummer vast in IndexedDB en stuurt die na herstel na. Wat het toestel vastlegt, is getuigenis, geen uitspraak. Starten vraagt wel netwerk, omdat de server starttijd en eerste nonce uitgeeft (spec §3.2).

**Server als scheidsrechter.** Duur, uitkomst, punten, dagdoel, streak en ranglijst berekent de server uit servertijd en vastgelegde gebeurtenissen, met dezelfde pure functies uit `packages/core` die de client gebruikt. De klok van de client telt nooit voor punten (spec §4.1, rapport 09 §3.2). Heuristieken markeren; een mens beslist over alles wat punten of prijzen kost (spec §4.11).

**Dataminimalisatie.** We verwerken wat spec §4.10 opsomt en niets meer: sessietijdstempels, zichtbaarheidsgebeurtenissen, Wake Lock-status, heartbeats, lidmaatschappen, een gehasht IP-adres, een user-agentklasse en vanaf de eerste verzilvering een gehasht telefoonnummer. De geboortedatum wordt een leeftijdsklasse en wordt niet bewaard. Besturen krijgen alleen aggregaten vanaf 5 leden (spec §4.6). Bewaartermijnen zitten in een job, niet alleen in beleid (§10.6).

**Alles testbaar zonder internet.** Tijd, willekeur, e-mail en sms zijn interfaces met een productie- en een testimplementatie. Magic links en sms-codes verschijnen in ontwikkeling in de console en een dev-inbox. De serverklok is in dev en test te verzetten, zodat een sessie van 25 minuten of een dagafsluiting om 04:00 in seconden te testen is.

**Wat de web-MVP eerlijk claimt.** Het systeem bewijst dat één browser de pagina zichtbaar had tussen twee servertijdstippen, niet dat de telefoon niet gebruikt is of dat er een mens zat (rapport 09 §3.3). Elke sessie draagt `verification_level = 1` en de plafonds in core zijn per niveau gedefinieerd, zodat een websessie technisch nooit tot geld leidt (businessplan besluit 5; uitwerking in §4.6).

## 2. Repo-structuur

De bouwomgeving is vastgesteld: pnpm-workspaces, Vite en React voor de web-app, Hono voor de API, SQLite met een synchrone driver, Vitest en Playwright. Ik wijk op één punt af van de opdracht: naast `packages/core` komt een tweede pakket, `packages/contracts`. De reden is dwingend voor het parallel bouwen: core bevat domeinlogica zonder I/O, terwijl de API-vorm (request- en responseschema's, foutcodes, eventnamen) een afspraak tussen twee bouwteams is die op dag twee bevroren moet zijn. Als die schema's in core staan, wordt elke API-wijziging een wijziging in het domeinpakket, en daarmee een conflict tussen drie werkpakketten. Contracts hangt af van core (voor typen zoals `AbortReason`), nooit andersom.

```
rewarded/
├── package.json              # scripts: dev, test, e2e, verify, seed:demo, db:migrate
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example              # geen secrets; peppers worden lokaal gegenereerd
├── packages/
│   ├── core/                 # puur domein, geen I/O, geen Date.now()
│   │   └── src/
│   │       ├── params/       # parameterset v1 (spec §5), per verificatieniveau
│   │       ├── time/         # focusdag 04:00 Europe/Amsterdam, weeksleutel, Clock-interface
│   │       ├── session/      # client-toestandsmachine + serververifier
│   │       ├── ledger/       # rekeningen, boekingsregels, saldo-afleiding
│   │       ├── goals/        # dagdoel, overmoedrem, doelbonus arm A/B
│   │       ├── squads/       # streak, joker, pauze, bevriezen
│   │       ├── challenges/   # deelnamegraad, intensiteit, poules, drempel
│   │       ├── fraud/        # heuristieken H1–H10 als pure functies
│   │       ├── draws/        # commit-reveal, deterministische trekking, verifier
│   │       ├── belofte/      # aanbod, dagresultaat, reflectie
│   │       ├── referral/     # vesting
│   │       └── catalog/      # puntenprijs, plafonds, dekking
│   ├── contracts/            # zod-schema's per endpoint, foutcodes, eventtaxonomie
│   └── tsconfig/             # gedeelde tsconfig-presets (optioneel)
├── apps/
│   ├── api/
│   │   ├── migrations/       # 0001_….sql t/m 0399_….sql, nummerreeksen per werkpakket
│   │   └── src/
│   │       ├── app.ts        # Hono-app, middleware, vaste modulelijst
│   │       ├── db/           # driver-adapter, migratierunner, transactiehelper
│   │       ├── platform/     # Clock, Random, Mailer, SmsSender, Hasher (prod + dev)
│   │       ├── middleware/   # auth, csrf, rate limit, idempotentie, foutafhandeling
│   │       ├── jobs/         # scheduler + dagafsluiting, weekstart, opschoning
│   │       └── modules/      # auth, sessions, points, catalog, squads, duels, clubs,
│   │                         # challenges, belofte, cards, referral, draws, fraud,
│   │                         # admin, privacy, events, kpi, dev
│   └── web/
│       ├── public/           # manifest.webmanifest, iconen
│       └── src/
│           ├── app/          # router, layout, providers
│           ├── design/       # tokens.json → tokens.css, basiscomponenten
│           ├── i18n/         # nl/<feature>.json, en/<feature>.json
│           ├── platform/     # visibility, wakelock, monotone klok, web locks, outbox
│           ├── lib/api/      # getypeerde client op contracts
│           ├── sw/           # service worker (injectManifest)
│           └── features/     # onboarding, focus, points, squads, duels, club,
│                             # challenges, belofte, cards, profile, board, admin
├── e2e/                      # Playwright-specs, fixtures, test-hooks
└── tooling/
    ├── seed/                 # deterministische demo-seed
    └── scripts/              # draw-verify, kpi-export, peppers genereren
```

| Map | Verantwoordelijkheid | Mag afhangen van | Mag niet |
|---|---|---|---|
| `packages/core` | Domeinregels, parameters, pure berekeningen | Niets buiten de standaardbibliotheek en `zod` voor parametervalidatie | I/O, `Date.now()`, `Math.random()`, DOM, Node-API's |
| `packages/contracts` | API-schema's, foutcodes, eventnamen, gedeelde DTO's | `core`, `zod` | Logica |
| `apps/api` | HTTP, opslag, transacties, jobs, auth, audit | `core`, `contracts`, `hono`, `better-sqlite3` | Regels dupliceren die in core staan |
| `apps/web` | UI, platform-API's, offline opslag, PWA | `core`, `contracts`, React, router, TanStack Query, `idb` | Punten of uitkomsten zelf vaststellen |
| `e2e` | Scenario's door de hele keten | Draaiende `api` en `web` | Productcode importeren behalve test-hooks |
| `tooling/seed` | Demo- en testdata | `core`, `apps/api` (repositories) | Willekeur zonder vaste seed |

**Driverkeuze.** `better-sqlite3` is de eerste keus: synchroon en met echte transacties. Faalt de native build, dan valt de adapter terug op `node:sqlite` (`DatabaseSync`, ingebouwd in Node 22); de code ziet alleen de interface `Db`. Migraties zijn platte SQL-bestanden met een eigen runner, zonder ORM, omdat grootboek- en KPI-query's leesbaar moeten blijven voor de beheerder (spec §7).

## 3. Domeinmodel

Alle identifiers zijn ULID's (sorteerbaar, geen volgordelek tussen gebruikers). Tijdstippen zijn servertijd in UTC als ISO-tekst of milliseconden; een `focus_day` is een datum (`YYYY-MM-DD`) volgens de dagrand 04:00 Europe/Amsterdam (spec §4.2), berekend door `core/time`. Geldbedragen zijn gehele eurocenten. Punten zijn gehele getallen. Waar een veld een vaste lijst waarden heeft, staat die lijst in `core` als TypeScript-union en in SQLite als `CHECK`-constraint.

### 3.1 Identiteit en toegang

| Entiteit | Velden | Invarianten |
|---|---|---|
| `user` (gebruiker) | `id`, `email` (uniek, lowercase), `first_name`, `last_name?`, `locale` (nl/en), `age_band` (`16_17`/`18_plus`), `turns_18_on?`, `status` (active/blocked/deleted), `is_team`, `pseudonym` (willekeurig, voor events), `registration_source`, `registration_invite_id?`, `daily_goal_min`, `daily_goal_next?` + `daily_goal_next_from?`, `compare_opt_in`, `silent_mode`, `squad_name_on_cards`, `no_points_mode`, `phone_hash?`, `phone_verified_at?`, `terms_version`, `privacy_version`, `created_at` | Geen geboortedatum opgeslagen; `turns_18_on` alleen bij `16_17`; leeftijdsklasse wisselt in de dagafsluiting op `turns_18_on`; een rij bestaat pas na een geslaagde leeftijdscheck (onder 16 wordt niets bewaard, spec §3.1) |
| `auth_magic_link` | `id`, `email`, `token_hash`, `invite_token?`, `ip_hash`, `expires_at` (15 min), `used_at?` | Token eenmalig; alleen hash opgeslagen; rij verwijderd 24 uur na aanmaak |
| `auth_session` | `id` (SHA-256 van cookiewaarde), `user_id?`, `pending_email?`, `created_at`, `expires_at`, `last_seen_at`, `ua_class` | `user_id` of `pending_email` (pre-onboarding), nooit beide; sliding 30 dagen, beheerder 12 uur |
| `device` (apparaat) | `id` (door client gegenereerde UUID, bewaard in IndexedDB), `user_id`, `ua_class`, `standalone`, `wakelock_supported`, `first_seen_at`, `last_seen_at`, `max_verification_level` (1), `attestation_kind?`, `attestation_ref?` | Eén rij per browserprofiel per gebruiker; attestatievelden leeg in de MVP (zie §13) |
| `admin` (beheerder) | `user_id`, `role` (reviewer/admin), `created_at`, `created_by` | Een beheerder is ook een `user` met `is_team = 1`; teamaccounts tellen in geen KPI mee (spec §7) |
| `club_board_member` | `user_id`, `club_id`, `role`, `created_by` | Bestuursrol geeft alleen aggregaten (§6.4) |

### 3.2 Sessies en signalen

| Entiteit | Velden | Invarianten |
|---|---|---|
| `focus_session` (sessie) | `id`, `user_id`, `device_id`, `planned_min` (1/25/50/90), `is_practice`, `status` (active/completed/aborted), `server_start_at`, `planned_end_at`, `server_end_at?`, `end_received_at?`, `abort_reason?` (hidden/heartbeat_gap/user_stop/second_session/late_end), `abort_at?`, `verified_min`, `counted_min`, `focus_day`, `review_status` (none/pending/released/rejected), `flag_codes` (JSON), `verification_level` (1), `nonce_hash`, `last_seq`, `last_heartbeat_at`, `covered_gap_s`, `clock_skew_ms?`, `claim_delay_s?`, `webdriver`, `standalone`, `ua_class`, `ip_hash` | Hoogstens één `active` per gebruiker (gedeeltelijke unieke index); `verified_min = planned_min` alleen bij `completed` en niet-oefensessie, anders 0; `counted_min ≤ verified_min` en de som van `counted_min` per gebruiker per `focus_day` ≤ 480; `focus_day` = dag van `server_start_at` |
| `session_heartbeat` | `session_id`, `seq`, `server_recv_at`, `client_ts`, `mono_ms`, `visibility`, `wakelock` (acquired/denied/released/unsupported), `nonce_ok`, `buffered` | (`session_id`, `seq`) uniek; `mono_ms` stijgend in `seq` |
| `visibility_event` (zichtbaarheidsgebeurtenis) | `id`, `session_id`, `seq`, `kind` (visible/hidden/pagehide/pageshow/blur/focus/wakelock_acquired/wakelock_denied/wakelock_released/online/offline/first_interaction_after_end), `mono_ms`, `client_ts`, `server_recv_at`, `buffered` | Append-only; (`session_id`, `seq`) uniek; ruwe rijen na 90 dagen samengevat (§10.6) |
| `session_summary` | `session_id`, `hidden_count`, `max_gap_s`, `covered_gap_s`, `wakelock_states`, `skew_ms`, `claim_delay_s` | Ontstaat bij opschoning; blijft zolang de sessie bestaat |
| `fraud_flag` (fraudemarkering) | `id`, `subject_type` (session/account/squad/club), `subject_id`, `code` (H1–H10, USER_REPORT, OUTAGE), `evidence` (JSON), `status` (open/released/rejected/blocked), `created_at`, `decided_by?`, `decided_at?`, `reason_code?` | Ontstaat alleen door heuristiek of melding; wordt alleen door een mens gesloten; een besluit `blocked` vereist een tweede beheerder (`block_confirmed_by ≠ decided_by`) |
| `appeal` (beroep) | `id`, `object_type` (flag/redemption/block/prize), `object_id`, `user_id`, `text`, `status`, `submitted_at`, `decided_by?`, `decided_at?`, `outcome?`, `motivation?` | Binnen 14 dagen na het besluit; `decided_by` ≠ beheerder van het oorspronkelijke besluit (afgedwongen in de transactie); besluit binnen 5 werkdagen (bewaakt in de wachtrij, spec §6.5) |

### 3.3 Punten en beloningen

Het grootboek is dubbel boekhouden: elke mutatie is een journaalpost met twee of meer boekingsregels die samen nul zijn. Saldi bestaan niet als kolom; ze zijn de som van regels per rekening (spec §4.2: "saldi zijn afgeleid, nooit los opgeslagen").

| Entiteit | Velden | Invarianten |
|---|---|---|
| `ledger_account` | `id`, `owner_type` (user/system), `owner_id?`, `kind`, uniek op (`owner_type`, `owner_id`, `kind`) | Gebruikersrekeningen: `available_own`, `available_referral`, `pending_session`, `pending_goal_budget`, `referral_unvested`. Systeemrekeningen: `issuance`, `redeemed`, `lapsed`, `reversed`, `expired` |
| `journal_entry` (puntenboeking) | `id`, `type` (spec §4.2: earn_session, goal_bonus, goal_budget_grant/secure/lapse, redeem, release_flag, reverse, adjust, referral_pending/vest/lapse, expire), `idempotency_key` (uniek), `user_id`, `ref_type`, `ref_id`, `reason_code?`, `actor` (system of admin-id), `arm?`, `param_version`, `created_at` | Som van regels = 0; nooit gewijzigd of verwijderd (SQLite-triggers weigeren UPDATE en DELETE); een correctie is een nieuwe post |
| `posting` | `id`, `entry_id`, `account_id`, `amount` (± punten) | Bedrag ≠ 0; per post minstens één debet- en één creditregel |
| `partner` | `id`, `name`, `kind` (vereniging/faculteit/sponsor/werkgever), `contact_ref` | Geen persoonsgegevens van studenten gedeeld (businessplan §5) |
| `partner_budget` (partnerbudget) | `id`, `partner_id`, `kind` (direct_reward/revenue), `booked_cents`, `reward_pct` (100 bij direct_reward; standaard 20 bij revenue, spec §4.3), `document_ref` (factuur of contract), `booked_at`, `status` (booked/cancelled), `created_by` | Alleen geboekt = gefactureerd of getekend contract met bedrag en datum; zonder `document_ref` geen rij |
| `budget_allocation` | `id`, `budget_id`, `target_type` (reward_stock/prize/draw_game/ksb), `target_id`, `amount_cents`, `created_at`, `released_at?` | Σ allocaties per budget ≤ `booked_cents × reward_pct / 100`; dit is de dekkingsregel |
| `reward` (beloning, catalogusitem) | `id`, `partner_id`, `title_nl`, `title_en`, `terms_nl`, `terms_en`, `cost_cents` (≤ 500), `points_price` (veelvoud van 50), `min_age_band`, `status` (draft/published/offline), `published_at?`, `published_by?` | `points_price` onveranderlijk na publicatie; publiceren alleen met allocatie die `cost_cents × voorraad` dekt |
| `reward_voucher` | `id`, `reward_id`, `code`, `release_week` (maandag), `status` (unreleased/available/reserved/delivered/broken/void), `redemption_id?` | Een code hoort na reservering bij precies één account; geïmporteerd per CSV |
| `redemption` (verzilvering) | `id`, `user_id`, `reward_id`, `voucher_id`, `points`, `points_from_referral`, `cost_cents`, `week_key`, `month_key`, `entry_id`, `status` (reserved/delivered/replaced/refunded), `created_at` | Eén per gebruiker per `week_key`; Σ `cost_cents` + individuele prijzen per `month_key` ≤ 1.500; `points_from_referral ≤ floor(points / 2)` |
| `phone_verification` | `user_id`, `phone_hash`, `code_hash`, `expires_at`, `attempts` | Eén geverifieerd nummer per account; vijf pogingen |

### 3.4 Sociaal, challenges en prijzen

| Entiteit | Velden | Invarianten |
|---|---|---|
| `invite` | `id`, `token` (128 bits, base64url), `source` (squad/duel/club/personal/ambassador), `creator_user_id?`, `squad_id?`, `duel_id?`, `club_id?`, `qr_source?`, `max_uses` (squad 5, duel 1), `uses`, `expires_at` (squad 7 dagen, duel 48 uur), `created_at` | `uses ≤ max_uses`; preview noemt nooit punten of prijzen (spec §3.5) |
| `squad` | `id`, `name`, `name_status` (pending/ok/rejected), `club_id?`, `admin_user_id`, `status` (building/active/archived), `arm_bonus` (A/B), `arm_belofte` (early/late), `assignment_block`, `streak`, `created_at` | Arm vast vanaf aanmaak; `active` vanaf drie actieve leden; archief na 14 dagen zonder actieve leden |
| `squad_membership` (lidmaatschap) | `id`, `squad_id`, `user_id`, `role` (maker/member), `joined_at`, `active_from_day`, `left_at?`, `paused_since_day?`, `invite_id?` | Eén open lidmaatschap per gebruiker (unieke index waar `left_at IS NULL`); hoogstens zes open per squad |
| `user_day` | `user_id`, `focus_day`, `counted_min`, `counted_min_final` (zonder open markeringen), `goal_min`, `goal_met`, `goal_met_final`, `joker_used`, `vacation` | Ontstaat in de dagafsluiting; herberekend bij een besluit over een markering zolang de periode niet definitief is |
| `squad_day` | `squad_id`, `focus_day`, `active_members`, `met`, `jokers`, `result` (success/fail/frozen/vacation), `streak_after` | Eén rij per squad per dag; idempotent herberekenbaar |
| `duel` | `id`, `challenger_id`, `opponent_id?`, `invite_id`, `status` (open/expired/running/pending_review/finished), `start_day`, `end_day`, `result?` (challenger/opponent/draw), `accepted_at?` | Per speler hoogstens één `open` of `running`; geen punten aan de uitslag (spec §4.5) |
| `club` (vereniging) | `id`, `name`, `city`, `declared_members`, `members_source_ref`, `pool` (lt150/150_500/gt500), `join_code`, `status`, `created_by` | `code_cap = floor(1,1 × declared_members)`; koppelingen boven het plafond gaan naar de beheerder |
| `club_membership` | `user_id`, `club_id`, `linked_at`, `qr_source?`, `left_at?`, `pending_admin` | Eén open koppeling per gebruiker (**aanname**: de spec noemt "zijn vereniging" enkelvoud) |
| `challenge` | `id`, `type` (club_warmup/club_prize/performance), `title_nl/en`, `period_start_day`, `period_end_day`, `pool?`, `rules` (JSON: drempel, dagminuten, plaatsen), `status` (draft/published/running/review/final), `published_by?`, `final_by?`, `final_confirmed_by?` | Publiceren alleen met gedekte prijzen binnen de europlafonds; `final_confirmed_by ≠ final_by` (vier ogen) |
| `challenge_enrollment` (deelname) | `id`, `challenge_id`, `user_id?`, `club_id?`, `seat_no?`, `enrolled_at`, `status` (enrolled/achieved/failed/verified/rejected) | Prestatiechallenge: `seat_no ≤ plaatsen`; inschrijven alleen vóór de start |
| `challenge_score` | `challenge_id`, `club_id`, `week_start`, `participation_rate`, `intensity_min`, `linked_members`, `rank?`, `is_final`, `computed_at` | Alleen verenigingsniveau; geen kolom per lid |
| `prize` (prijs) | `id`, `kind` (earned_collective/earned_individual/drawn), `challenge_id?`, `draw_id?`, `description_nl/en`, `value_cents`, `in_kind`, `partner_id`, `allocation_id`, `min_age_band`, `winner_user_id?`, `winner_club_id?`, `status` (open/candidate/verified/delivered/rejected), `verified_by?`, `deliver_after` (+14 dagen) | Individueel ≤ 1.000; hoofdprijs ≤ 15.000; drempelprijs ≤ 7.500 (spec §4.3); nooit geld of vrij besteedbaar tegoed |
| `draw_game` (spel) | `id`, `title_nl/en`, `terms_version`, `terms_md`, `prize_total_cents` (≤ 450.000), `ksb_cents`, `period_start`, `period_end`, `seed_hash`, `status` (draft/committed/open/closed/drawn/final), `created_by`, `committed_by` | `ksb_cents = ceil(prize_total_cents × 378 / 622)`; allocatie voor prijs + KSB vóór publicatie |
| `draw` (trekking) | `id`, `game_id`, `draw_no`, `qualify_week`, `entries_hash?`, `entries_count?`, `executed_at?`, `winners` (JSON met entry-codes), `executed_by?` | Seed pas zichtbaar na uitvoering; uitvoering herhaalbaar met hetzelfde resultaat |
| `draw_secret` | `game_id`, `seed` | Aparte tabel, alleen leesbaar voor de trekkingsjob; wordt na de laatste trekking gepubliceerd |
| `draw_opt_in` / `draw_entry` | `user_id`, `game_id`, `terms_version`, `opted_in_at` / `id`, `draw_id`, `user_id`, `entry_code` | Alleen `18_plus`, niet `is_team`, niet geblokkeerd; één entry per gebruiker per trekking |
| `referral` | `id`, `invite_id`, `inviter_id`, `invitee_id`, `status` (pending/review/vested/lapsed), `deadline_at` (+7 × 24 uur), `qualifying_sessions`, `vested_at?` | Max. 5 gevestigd per uitnodiger per kalendermaand; zelfde IP-hash binnen 24 uur of zelfde telefoonhash → `review` |
| `belofte` / `belofte_offer` | `id`, `user_id`, `days_per_week`, `min_per_day`, `witnesses` (squad/none), `start_day`, `end_day`, `status`, `reflection_action?`, `stake_interest?` / `user_id`, `arm`, `trigger`, `offered_at` | Geen grootboekpost hangt aan een Belofte (spec §4.12) |
| `card` | `id`, `user_id`, `kind`, `ref_id`, `fields` (JSON), `token` (128 bits), `revoked_at?` | Geen kaart voor een sessie met `review_status = pending`; afkeuring zet `revoked_at` |

### 3.5 Beheer en meting

| Entiteit | Velden | Invarianten |
|---|---|---|
| `audit_log` | `id`, `actor_user_id`, `action`, `object_type`, `object_id`, `reason`, `at`, `ip_hash` | Append-only via triggers; elke inzage van sessiegegevens door een beheerder schrijft een rij vóór het antwoord |
| `event` | `id`, `name`, `pseudonym`, `server_at`, `props` (JSON), `release`, `arm_bonus?`, `arm_belofte?`, `squad_id?` | Namen alleen uit de taxonomie in contracts (spec §7.1); geen e-mail, naam of IP in `props` |
| `experiment_assignment` / `arm_switch` | `unit_type` (squad/solo), `unit_id`, `factor`, `arm`, `block`, `assigned_at` / `user_id`, `factor`, `from`, `to`, `reason`, `at` | Toewijzing vergrendeld; wijziging alleen met logregel (spec §4.11) |
| `vacation_pause`, `feature_flag`, `param_set` | periode / sleutel, aan-uit / versie, JSON, `effective_from` | Elke wijziging met auditregel; flags `draws`, `referral`, `cards`, `duels`, `belofte`, `arm_b` |
| `job_run` | `job`, `run_key` (bijv. `day_close:2026-12-14`), `status`, `started_at`, `finished_at` | (`job`, `run_key`) uniek: een job draait per dag precies één keer succesvol |
| `idempotency_record` | `key`, `user_id`, `route`, `request_hash`, `status_code`, `response`, `created_at` | 24 uur bewaard; zelfde sleutel met andere body → `IDEMPOTENCY_CONFLICT` |

**Relaties in één zin per kern.** Een gebruiker heeft apparaten, sessies, grootboekrekeningen, hoogstens één open squadlidmaatschap en hoogstens één open verenigingskoppeling. Een sessie heeft heartbeats, zichtbaarheidsgebeurtenissen, nul of meer markeringen en hoogstens één `earn_session`-post. Een partner heeft budgetten, een budget heeft allocaties, een allocatie dekt voorraad, een prijs of een spel. Een verzilvering verbindt een gebruiker, een voucher en een journaalpost. Een challenge heeft deelnames (personen of verenigingen) en scores per vereniging per week.

## 4. Het sessieprotocol

### 4.1 Toestandsmachine

De toestandsmachine staat in `core/session/machine.ts` en draait in de browser. Ze is een pure reducer `(state, event) → [state, effects]`; effecten (heartbeat versturen, Wake Lock aanvragen, outbox schrijven) voert de web-app uit. Zo is de machine met Vitest te testen zonder DOM.

| Toestand | Betekenis | Uitgaande overgangen |
|---|---|---|
| `idle` | Geen sessie | `START_REQUESTED` → `starting` |
| `starting` | Wacht op server (sessie-id, nonce, servertijd) | `STARTED` → `running`; `START_FAILED` → `idle` met fout |
| `running` | Pagina zichtbaar, heartbeats lopen | `HIDDEN` → `aborted_local`; `NET_LOST` → `running_offline`; `DURATION_REACHED` → `ending`; `USER_STOP` → `stopping`; `SERVER_ABORT` → `aborted` |
| `running_offline` | Zichtbaar, geen netwerk; alles naar de outbox | `NET_BACK` → `running` (outbox doorsturen); `HIDDEN` → `aborted_local`; `DURATION_REACHED` → `ending`; `GAP_LIMIT` (monotoon > 5 min sinds laatste bevestigde heartbeat) → `aborted_local` |
| `ending` | Einde gemeld, wacht op uitslag | `RESULT` → `completed` of `aborted` |
| `stopping` | Gebruiker bevestigde Stoppen | `RESULT` → `aborted` (`user_stop`) |
| `aborted_local` | Client weet dat de sessie stopte, server nog niet bevestigd | `RESULT` → `aborted` |
| `completed` / `aborted` | Eindtoestand met uitslag van de server | `RESET` → `idle` |

Een pauze bestaat niet. De spec sluit een pauze binnen een sessie en een terugkeervenster uit (§4.1, §8 Won't), en de toestandsmachine heeft er daarom geen toestand voor. Wat de client wel vastlegt, is hoe lang de pagina verborgen was als de student terugkomt (`return_after_abort`, met `hidden_duur_s`), zodat de founder na de pilot op data over een kort venster kan beslissen.

### 4.2 Wat de client vastlegt

Bij de start registreert de client het apparaat (een UUID in IndexedDB, eenmalig per browserprofiel) en stuurt `POST /sessions` met geplande duur, `device_id`, `standalone` (`display-mode: standalone`), `wakelock_supported`, `navigator.webdriver`, de clientklok en de monotone klok. De server antwoordt met `session_id`, `nonce`, `server_start_at`, `planned_end_at` en het heartbeatinterval van 30 seconden. Vanaf dat moment telt de client verstreken tijd als `performance.now() − mono_start`; de getoonde resterende tijd komt daaruit, niet uit `Date.now()`.

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

Elke gebeurtenis krijgt een oplopend `seq` en gaat eerst naar de outbox in IndexedDB en dan naar de server. Een heartbeat bevat de laatst ontvangen nonce, `seq`, `mono_ms`, `client_ts`, de huidige zichtbaarheid en Wake Lock-status, en alle outbox-gebeurtenissen sinds de vorige bevestiging. De server antwoordt met een nieuwe nonce en de servertijd. Bij `hidden` probeert de client met `navigator.sendBeacon` direct `POST /sessions/:id/events` te sturen; lukt dat niet, dan staat de gebeurtenis in de outbox en gaat ze mee met het eerstvolgende contact.

### 4.3 Hoe de server valideert

De validatie is één pure functie, `core/session/verify.ts`:

```ts
evaluateSession(input: {
  session: SessionHeader;            // planned_min, server_start_at, planned_end_at, start mono
  heartbeats: Heartbeat[];           // online en gebufferd, met server_recv_at
  events: VisibilityEvent[];
  endReport?: EndReport;             // mono_ms, client_ts, server_recv_at
  now: Instant;                      // servertijd van evaluatie
  params: SessionParams;             // spec §4.1
}): SessionVerdict                   // pending | completed | aborted(reason, at) + flags + metrics
```

De API roept haar aan bij elke heartbeat, bij het einde, bij een gebeurtenissenbatch en in een sweep-job elke minuut voor sessies zonder contact. De functie is idempotent: dezelfde invoer geeft dezelfde uitspraak, zodat een herhaalde aanroep niets dubbel boekt. Ze werkt in vaste stappen.

1. **Nonce-keten.** Een online heartbeat is geldig als ze de laatst uitgegeven nonce draagt; de server bewaart alleen de hash daarvan. Een oude of onbekende nonce levert `NONCE_INVALID` op en de heartbeat telt niet als contact. Gebufferde heartbeats dragen de laatste nonce die de client kende; ze bewijzen geen contact, alleen wat het toestel zegt dat er gebeurde.
2. **Afbreken op zichtbaarheid.** De vroegste `hidden` of `pagehide` met `mono_ms` vóór het einde breekt de sessie af met code `hidden`. Het afbreektijdstip is `server_start_at + (mono_hidden − mono_start)`, begrensd tussen de laatste geldige heartbeat ervoor en het moment van ontvangst. Omdat een afgebroken sessie geen punten oplevert, bepaalt dit tijdstip alleen de uitleg ("Je hield 18 minuten vol").
3. **Gaten.** De server bekijkt de intervallen tussen opeenvolgende geldige online heartbeats in servertijd, inclusief start tot eerste heartbeat en laatste heartbeat tot einde. De regels zijn die van spec §4.1, één op één in `params`:

| Gat (servertijd) | Dekkend gebufferd log? | Uitkomst |
|---|---|---|
| ≤ 90 s | n.v.t. | Telt |
| > 90 s en ≤ 300 s | Ja: gebufferde heartbeats met onderlinge monotone afstand ≤ 90 s, geen `hidden`, monotone verstreken tijd binnen 5 s van de serververstreken tijd | Telt; duur opgeteld bij `covered_gap_s` |
| > 90 s | Nee | Afgebroken op de laatste geldige heartbeat (`heartbeat_gap`) |
| > 300 s | Ook met log | Afgebroken op de laatste geldige heartbeat (`heartbeat_gap`) |
| Log toont `hidden` in het gat | — | Afgebroken op het tijdstip van `hidden` |

4. **Einde.** Een eindmelding is geldig als `server_recv_at − server_start_at ≥ planned − 30 s`, of als de client offline was bij het einde en het gebufferde log het laatste gat volgens de tabel dekt, met een monotone eindtijd ≥ geplande duur. Komt de eindmelding later dan `planned_end_at + 10 min` zonder heartbeats ertussen, dan is de uitkomst `late_end`. Komt er helemaal niets, dan sluit de sweep-job de sessie op `planned_end_at + 10 min` (spec §4.1: "de server beslist pas als de client terug is of als de geplande eindtijd plus 10 minuten zonder herstel verstreken is") met `heartbeat_gap` op de laatste geldige heartbeat.
5. **Geverifieerde minuten.** Een voltooide sessie krijgt `verified_min = planned_min`; er bestaan geen gedeeltelijke minuten. Het grootboek past daarna de daglimiet toe: `counted_min = min(planned_min, 480 − reeds geteld op die focusdag)`. De oefensessie van één minuut doorloopt hetzelfde protocol, maar boekt niets en telt nergens mee.
6. **Markeringen per sessie.** H1 (`webdriver` of headless user agent), H3 (`covered_gap_s > 10%` van de geplande duur) en H4 (klokafwijking > 5 min) worden bij de uitspraak bepaald. Een gemarkeerde voltooide sessie krijgt `review_status = pending` en haar punten gaan naar `pending_session`.

### 4.4 Randgevallen

**Klokverschil.** Per heartbeat is `skew = client_ts − (server_recv_at − rtt/2)`, met de round-trip van de vorige heartbeat; de mediaan is `clock_skew_ms`. Een verzette klok raakt de punten niet; boven 5 minuten markeert hij (H4).

**Offline.** De sessie loopt in `running_offline` door met een kleine melding ("Geen verbinding; je sessie loopt door"); na herstel gaat de outbox in volgorde naar de server. Na vijf minuten offline weet de client zelf dat de sessie verloren is (`GAP_LIMIT`) en zegt dat direct, zodat niemand 40 minuten doorwerkt voor niets. Dat is de eerlijke grens van offline-first hier: UI en log overleven elk netwerkverlies, de beloning niet.

**Herladen.** Herladen vuurt `pagehide`, en spec §4.1 telt dat als afbreken. Na het herladen leest de app de sessie uit IndexedDB, stuurt de `pagehide` door en toont de afbreekuitleg. Een `beforeunload`-waarschuwing tijdens de sessie voorkomt onbedoeld herladen; het detail `reload` (`PerformanceNavigationTiming.type`) maakt de frequentie meetbaar (open vraag 2).

**Tabwissel en vergrendelen.** Ander tabblad, andere app, scherm uit, laptop dicht of venster geminimaliseerd geven `hidden` (rapport 09 §3.1) en breken af. Een melding zonder openen en een ander venster over een zichtbaar tabblad doen dat niet; daar wordt alleen `blur` vastgelegd.

**Dubbele tabs.** De Web Locks API (`navigator.locks.request('rw-session-owner')`) kiest één eigenaartab; andere tabs volgen via een `BroadcastChannel` en tonen "Je sessie loopt in een ander tabblad", zonder start of heartbeats. De server weigert een tweede start vanaf hetzelfde `device_id` met `SESSION_ACTIVE`; een start vanaf een ander `device_id` beëindigt de lopende sessie met `second_session` (spec §4.1). Twee clients op één sessie breken elkaars nonce-keten (`NONCE_INVALID`).

**Over 04:00 en storingen.** De focusdag is de dag van `server_start_at`. Bij een storing aan onze kant registreert de beheerder een `OUTAGE`-periode; sessies met een gat daarin gaan naar de wachtrij in plaats van af te breken (spec §4.1).

### 4.5 Heuristieken

De heuristieken H1–H10 liggen vast in spec §6.3; de architectuur bepaalt alleen waar en wanneer ze draaien. Elke heuristiek is een pure functie in `core/fraud` met de drempels uit `params`, zodat een aanpassing (alleen met besluit van de founder) één parameterversie is en beide cijfers, met en zonder aanpassing, te reproduceren zijn.

| Code | Draait | Onderwerp van de markering | Invoer |
|---|---|---|---|
| H1 | Bij de uitspraak | Sessie | `webdriver`, `ua_class` |
| H2 | Dagafsluiting 04:00 | Sessies van de betrokken accounts in het venster | Accounts per `ip_hash` per 24 uur, campus-uitzonderingslijst (in `params`, met bron) |
| H3 | Bij de uitspraak | Sessie | `covered_gap_s`, `planned_min` |
| H4 | Bij de uitspraak | Sessie | `clock_skew_ms` |
| H5 | Dagafsluiting | Sessies van de derde dag | `user_day.counted_min` over 3 dagen |
| H6 | Dagafsluiting | Nachtsessies van die week | Sessies 01:00–06:00 per week |
| H7 | Bij het actief worden van de squad en dagelijks | Squad, plus sessies van haar leden sinds registratie | Registratiemomenten en `ip_hash` van leden |
| H8 | Bij telefoonverificatie | Account | `phone_hash` tegen geblokkeerde accounts |
| H9 | Weekstart maandag 04:00 | Sessies van de afgelopen week | `claim_delay_s` |
| H10 | Elk uur | Vereniging, plus de nieuwe koppelingen | Koppelingen per 48 uur en hun `ip_hash` |

Markeert een heuristiek achteraf een sessie waarvan de punten al beschikbaar waren, dan verschuift de server niets automatisch: de punten blijven staan tot het besluit, de markering gaat de wachtrij in, en pas een afkeuring door een mens boekt een `reverse`. Zo blijft de regel "heuristieken markeren, een mens beslist" ook bij de batchheuristieken waar.

### 4.6 Wat de web-MVP eerlijk claimt, in de techniek

De claim uit spec §6.1 staat in de onboarding, op "Hoe we tellen" en op de verificatiepagina (spec §4.8). Drie technische borgen houden haar waar. Het woord "bewezen" komt in geen i18n-sleutel voor (lintregel). Elke websessie heeft `verification_level = 1`, waarvoor `core/params` alleen punten, catalogusitems tot €5 en verdiende prijzen in natura binnen spec §4.3 toestaat. En de e2e-suite legt vast dat een headless browser met overschreven `navigator.webdriver` een ongemarkeerde sessie haalt: de plafonds zijn de echte verdediging, niet H1 (rapport 09 §3.3, rapport 02 hoofdstuk 4).

## 5. Puntenmodel

### 5.1 Journaal en boekingsregels

Elke mutatie uit spec §4.2 is een journaalpost met vaste regels. De regels staan als data in `core/ledger/rules.ts`; de API schrijft ze in één SQLite-transactie, samen met de wijziging die ze veroorzaakt (de sessie-uitspraak, de verzilvering, het besluit).

| Type | Debet | Credit | Idempotentiesleutel |
|---|---|---|---|
| `earn_session` (niet gemarkeerd) | `system:issuance` | `user:available_own` | `earn:{session_id}` |
| `earn_session` (gemarkeerd) | `system:issuance` | `user:pending_session` | `earn:{session_id}` |
| `release_flag` | `user:pending_session` | `user:available_own` | `release:{flag_id}` |
| `reverse` (uit afwachting) | `user:pending_session` | `system:reversed` | `reverse:{flag_id}` |
| `reverse` (al beschikbaar) | `user:available_own` | `system:reversed` | `reverse:{flag_id}` (saldo mag negatief, spec §4.2) |
| `goal_bonus` (arm A) | `system:issuance` | `user:available_own` (of `pending_session` als het doel alleen dankzij gemarkeerde minuten gehaald is) | `goal_bonus:{user}:{day}` |
| `goal_budget_grant` (arm B) | `system:issuance` | `user:pending_goal_budget` | `goal_grant:{user}:{week}` |
| `goal_budget_secure` | `user:pending_goal_budget` | `user:available_own` | `goal_secure:{user}:{day}` |
| `goal_budget_lapse` | `user:pending_goal_budget` | `system:lapsed` | `goal_lapse:{user}:{day}` |
| `redeem` | `user:available_own` en `user:available_referral` | `system:redeemed` | `redeem:{redemption_id}` |
| `adjust` | naar richting | naar richting | `adjust:{appeal_id}` of `adjust:{admin_action_id}` |
| `referral_pending` | `system:issuance` | `user:referral_unvested` | `ref_pending:{referral_id}:{role}` |
| `referral_vest` | `user:referral_unvested` | `user:available_referral` | `ref_vest:{referral_id}:{role}` |
| `referral_lapse` | `user:referral_unvested` | `system:lapsed` | `ref_lapse:{referral_id}:{role}` |
| `expire` (niet gebouwd) | `user:available_*` | `system:expired` | `expire:{user}:{date}` |

Het saldo in de app volgt de drie delen van spec §3.4: *beschikbaar* is `available_own + available_referral`, *in afwachting* is `pending_session + pending_goal_budget`, *referral, nog niet vrij* is `referral_unvested`. Een `adjust` vraagt altijd een redencode uit een vaste lijst en een auditregel. De invariant dat elke post op nul sluit, controleert de transactiehelper vóór de commit, en een nachtelijke controle-query (`SELECT entry_id FROM posting GROUP BY entry_id HAVING SUM(amount) <> 0`) moet altijd leeg zijn; die query is ook een integratietest.

### 5.2 Regels rond verzilvering

**Inverdienperiode.** De eerste verzilvering kan pas na 300 geverifieerde minuten (spec §4.2). De server berekent die uit sessies, niet uit punten: de som van `counted_min` van voltooide sessies met `review_status` in (none, released). Bonus- en referralpunten tellen daardoor vanzelf niet mee, en gemarkeerde minuten pas na vrijgave.

**Weekplafond en maandplafond.** `week_key` is de maandag van de focusweek (maandag 04:00 tot maandag 04:00), `month_key` de kalendermaand in Europe/Amsterdam. Een unieke index op (`user_id`, `week_key`) in `redemption` maakt een tweede verzilvering in dezelfde week onmogelijk, ook bij gelijktijdige verzoeken. Het europlafond van €15 per persoon per maand telt verzilveringen en toegekende individuele prijzen samen (spec §4.3).

**De verzilvering als één transactie** (spec §3.4 stap 5). `BEGIN IMMEDIATE` in SQLite geeft één schrijver tegelijk en vervangt de rijvergrendeling per account. Binnen de transactie: account actief en telefoon geverifieerd; inverdienperiode gehaald; geen verzilvering in deze `week_key`; maandtotaal plus kostprijs ≤ €15; een voucher met status `available` voor deze week; beschikbaar saldo voldoende, waarbij hoogstens de helft van de puntenprijs uit `available_referral` mag komen (spec §4.9); dan de journaalpost, de voucherreservering en de verzilveringsrij. Faalt één controle, dan wordt niets geschreven en volgt een specifieke foutcode (§8.3).

**Vervaldatum.** Het verval na 12 maanden zonder voltooide sessie is niet gebouwd (spec §4.2). Het grootboek kent het type `expire` en de rekening `system:expired` al, zodat de latere job alleen boekingen toevoegt. Verwijdert een gebruiker zijn account, dan boekt de server alle positieve gebruikerssaldi naar `system:expired` met type `expire` en redencode `account_deleted`.

### 5.3 Budgetdekking van de catalogus

Een `partner_budget` bestaat alleen met een documentverwijzing (geboekt = gefactureerd of getekend, spec §4.3). Het vrije budget is `Σ booked_cents × reward_pct / 100 − Σ allocaties`, en dat getal mag nooit negatief worden: de functie `allocate()` draait in een transactie en weigert met `COVERAGE_INSUFFICIENT`. Een catalogusitem publiceren betekent: voorraad importeren (CSV met codes), een allocatie van `cost_cents × aantal codes` maken, en pas daarna de status `published`. Een prijs voor een challenge of een trekkingsspel werkt hetzelfde, en bij een spel wordt ook de kansspelbelasting gealloceerd voordat het gepubliceerd kan worden (spec §4.7).

De puntenprijs is `round50(cost_cents / budget_value_per_point)` (spec §4.3), berekend in `core/catalog` en bij publicatie bevroren in `reward.points_price`. De weekstartjob zet de geplande vouchers van `unreleased` op `available` en draait het dekkingsalarm: gebruikers voorbij de inverdienperiode tegenover de vrijgegeven voorraad van de komende week, als `coverage_alert` in eventlog en beheeroverzicht. Puntenprijzen veranderen nooit.

### 5.4 Idempotentie

Idempotentie zit op drie lagen. Elke journaalpost heeft een deterministische, unieke sleutel (tabel 5.1): een herhaalde uitspraak of job faalt op de unieke index en geldt als "al gedaan". Elk muterend endpoint dat een gebruiker kan herhalen (verzilveren, squad aanmaken, inschrijven, beroep) accepteert een `Idempotency-Key`-header; de client genereert die per handeling en bewaart hem in de outbox tot er een antwoord is. En elke job schrijft een `job_run` met een sleutel per dag of week, zodat een herstart van de server om 04:01 de dagafsluiting niet opnieuw draait.

## 6. Challenge- en ranglijstberekening

### 6.1 Dagafsluiting als bron

Alle sociale berekeningen rusten op `user_day`, dat de dagafsluiting om 04:00 Europe/Amsterdam schrijft. De job is een vaste reeks stappen, elk idempotent per dag: (1) open sessies van gisteren afsluiten via de sweep; (2) per gebruiker `counted_min`, dagdoel, `goal_met` en de joker bepalen; (3) per gebruiker in arm B de `goal_budget_lapse` boeken bij een gemist doel; (4) leeftijdsklassen bijwerken op `turns_18_on`; (5) automatische pauzes (7 dagen zonder voltooide sessie); (6) `squad_day` en de streak; (7) Belofte-dagresultaten; (8) de batchheuristieken; (9) challenge-scores; (10) bewaartermijnen. Tijdens de vakantiepauze schrijft de job `vacation = 1` en slaat stap 3, 5, 6 en 7 over, zoals spec §4.4 en §4.11 vragen. De weekstartjob op maandag 04:00 boekt `goal_budget_grant` voor arm B, voert de weekvrijgave van voorraad uit, draait H9 en het dekkingsalarm.

`user_day` heeft twee varianten van minuten en doelen. `counted_min` en `goal_met` tellen gemarkeerde sessies voorlopig mee, omdat een gemarkeerde sessie voorlopig telt voor dagdoel, squadstreak en Belofte (spec §6.4). `counted_min_final` en `goal_met_final` laten open en afgekeurde markeringen weg; die tellen voor de inverdienperiode, verzilvering, het duel, de challenge en prijzen. Een besluit over een markering herberekent de betrokken `user_day`-rijen en de afgeleide scores zolang de periode niet definitief is.

### 6.2 Verenigingsranglijst

De prijsmaatstaf is de deelnamegraad (spec §4.6). De functie `participationRate` in `core/challenges` krijgt per vereniging de koppelingen met hun begin- en einddatum, het opgegeven ledental en de `user_day`-rijen.

| Grootheid | Definitie | Bron |
|---|---|---|
| Teller deelnamegraad | Gekoppelde leden met `goal_met_final` op ≥ 3 dagen van de challengeweek, alleen dagen waarop ze gekoppeld waren; joker telt niet | Spec §4.6 |
| Noemer deelnamegraad | `max(declared_members, gekoppelde leden bij het begin van de week)`; wie tijdens de week vertrekt, blijft erin | Spec §4.6 |
| Actief lid | Gekoppeld lid met ≥ 1 voltooide, niet-afgekeurde sessie in de challengeweek | **Keuze**: de spec definieert "actief lid" voor de intensiteit niet; te bevestigen (open vraag 4) |
| Intensiteit | `Σ min(counted_min_final, 480)` over actieve leden en dagen, gedeeld door (aantal actieve leden × aantal niet-vakantiedagen in de week) | Spec §4.6, businessplan §4 |
| Score prijsperiode | Gemiddelde deelnamegraad van de twee prijsweken | Spec §4.6 |
| Rangschikking | Per poule; alleen verenigingen met ≥ 15 gekoppelde leden; een poule met < 3 verenigingen gaat samen met de naastgelegen poule | Spec §4.6 |
| Gelijke stand | Eerst intensiteit, daarna gedeelde plaats | **Keuze**, voorleggen aan de founder (open vraag 5) |
| Drempelprijs | Gemiddelde deelnamegraad ≥ 25% over de prijsperiode | Spec §4.6, werkhypothese |

Totalen worden nergens berekend voor weergave. De daglimiet van 480 minuten zit dubbel in de berekening: bij het boeken (`counted_min`) en nog eens in de intensiteitsformule, zodat een correctie in het ene nooit het andere ondergraaft. De scores worden elke nacht als snapshot in `challenge_score` geschreven, met `is_final = 0`. De uitslag wordt definitief na de fraudecontrole en winnaarsverificatie: een beheerder zet de uitslag klaar en een tweede bevestigt (`final_by` ≠ `final_confirmed_by`). Boven 10% gemarkeerde sessies in een vereniging blokkeert de server die stap tot er een steekproef van 20 accounts is vastgelegd (spec §4.7).

### 6.3 Squads, duels en prestatiechallenges

De squadstreak volgt spec §4.4: een squaddag slaagt als minstens `max(2, ceil(actieve leden / 2))` leden hun dagdoel halen of een joker gebruiken. Met minder dan drie actieve leden bevriest de streak, in de vakantiepauze ook. Een lid dat later instapt of terugkomt van pauze, telt vanaf de dag erna (`active_from_day`). Het duel vergelijkt `counted_min_final` per dag over zeven dagen; een speler met een open markering in de duelperiode krijgt pas na het besluit een uitslag (`pending_review`). Een individuele prestatiechallenge ("elke dag van de tentamenweek minstens 120 minuten") is een predicaat over `user_day` van ingeschreven deelnemers, met vaste plaatsen die bij inschrijving worden toegekend: geen race, geen loting.

### 6.4 Privacy van individuele data

Individuele vergelijking bestaat alleen binnen de squad en het duel, en alleen opt-in. De architectuur dwingt dat op drie plaatsen af, omdat één vergeten filter genoeg is om de randvoorwaarde te breken.

| Wie vraagt | Wat de API teruggeeft | Afdwinging |
|---|---|---|
| Squadlid, live aanwezigheid | Per lid: focust nu ja/nee, resterende minuten, dagdoel gehaald ja/nee, pauze; leden in stille modus ontbreken | Query in `modules/squads/presence.ts` filtert op `silent_mode`; geen minuten per lid |
| Squadlid, minuten vergelijken | Minuten per lid, alleen van leden met `compare_opt_in = 1`, en alleen als de vrager zelf opt-in heeft | Eén SQL-view `squad_compare_v` met beide voorwaarden; het endpoint leest alleen die view |
| Duelpartner | Dagminuten van beide spelers | Acceptatie van het duel is de opt-in (spec §3.6) |
| Bestuur | Aggregaten per vereniging; een cijfer verschijnt pas bij ≥ 5 leden in de groep | Functie `suppressSmallGroups(n ≥ 5)` in core; het bestuursendpoint heeft geen query die `user_id` selecteert |
| Iedereen | Ranglijst per poule: vereniging, deelnamegraad, intensiteit, rang | Bron is `challenge_score`, dat geen kolom per lid heeft |
| Partner of sponsor | Niets via de API in de MVP; rapportage handmatig uit aggregaten | Geen partnerportaal (spec §8 Won't) |

Een integratietest per endpoint controleert dat geen antwoord buiten de eigen squad of het eigen duel een `user_id`, voornaam of minutental van een ander lid bevat; die test draait over alle routes die in `contracts` als "sociaal" zijn gemarkeerd.

## 7. Trekkingen

De trekkingsmodule wordt gebouwd in R3 en staat achter de vlag `draws`, die uit staat tot de advocatenopinie, een positieve voorlegging bij de Kansspelautoriteit en een besluit van de founder (spec §3.9, businessplan §8). Met de vlag uit geven alle trekkingsendpoints voor studenten `404 FEATURE_DISABLED`; de beheeromgeving kan spellen voorbereiden.

**Aantoonbaar eerlijke loting.** Het mechanisme is commit-reveal met een deterministische, publiek na te rekenen selectie.

1. *Vastleggen.* Bij het aanmaken van een spel genereert de server 32 willekeurige bytes (`crypto.randomBytes`) als seed, bewaart ze in `draw_secret` en publiceert `seed_hash = SHA-256(seed)` in de spelvoorwaarden en op de kaart "Kans op". Dat gebeurt vóór het begin van de deelnameperiode, door één beheerder, bevestigd door een tweede, met auditregels.
2. *Sluiten.* Na de kwalificatieweek maakt de job de deelnemerslijst: gebruikers met opt-in voor de huidige versie van de spelvoorwaarden, `age_band = 18_plus` op de sluitingsdag, niet geblokkeerd, niet `is_team`, en weekdoel gehaald (dagdoel op ≥ 5 van 7 dagen, jokers tellen niet; spec §4.7). Elke deelname krijgt een willekeurige `entry_code` van tien tekens die de student in de app ziet. De gesorteerde codes worden gehasht tot `entries_hash` en gepubliceerd met het aantal deelnemers.
3. *Trekken.* Winnaar `k` is index `HMAC-SHA256(seed, entries_hash ‖ ":" ‖ k)` als 64-bits getal, modulo het aantal deelnemers, met afwijzing van waarden boven het grootste veelvoud om modulobias te vermijden, en zonder teruglegging. De volgorde van getrokken codes na het aantal prijzen zijn de reservewinnaars, wat vooraf in de spelvoorwaarden staat.
4. *Openbaren.* Na de laatste trekking van het spel publiceert de app de seed, de lijst van codes per trekking en de winnende codes. `tooling/scripts/draw-verify.ts` en een functie op de publieke pagina rekenen de uitslag na uit seed en lijst; ze gebruiken dezelfde functie `core/draws/select.ts` als de server.

Dit bewijst dat de uitslag volgt uit een seed die vóór de deelname vastlag en uit een gepubliceerde deelnemerslijst. Het bewijst niet dat Rewarded de seed niet kende: wie databasetoegang heeft, kan in theorie nepaccounts laten kwalificeren. Vier ogen, auditregels, uitsluiting van teamaccounts en winnaarsverificatie (spec §4.7) beperken dat; een externe randomness-beacon past pas na de MVP (open vraag 7).

**18+-controle.** Drie lagen: voor `16_17` bestaat het onderdeel niet (API en route); de opt-in is een expliciete handeling met de versie van de spelvoorwaarden; en bij een prijs controleert een beheerder de leeftijd, waarbij alleen uitkomst en controleur worden opgeslagen (spec §4.7).

**Spelvoorwaarden en grenzen.** De spelvoorwaarden zijn een versie-object (Markdown, NL en EN) met de onderdelen uit spec §4.7. De beheeromgeving weigert een spel boven €4.500 of boven de jaarlimiet (één spel, twintig trekkingen, €100.000) en boekt de kansspelbelasting (`prijswaarde × 37,8/62,2`) als allocatie. De kans staat als getal op de kaart: vóór sluiting als schatting gemarkeerd, daarna exact. De API heeft geen veld dat deelname aan een aankoop of abonnement koppelt.

**Logging.** Elke stap schrijft een auditregel en een event (`draw_opt_in`, `draw_entry`, `draw_executed`). Een trekking is idempotent per `draw_id` en weigert als `entries_hash` sinds publicatie is veranderd (`ENTRIES_CHANGED`).

## 8. API-ontwerp

### 8.1 Conventies

Alle routes staan onder `/api/v1`. Request- en responsebodies zijn JSON en worden aan beide kanten met de zod-schema's uit `packages/contracts` gevalideerd; de getypeerde client in de web-app is daaruit afgeleid. Authenticatie loopt via de cookie `rw_sid` (HttpOnly, SameSite=Lax, Secure buiten localhost, pad `/`). Muterende verzoeken vragen de header `X-CSRF-Token` met de waarde uit de niet-HttpOnly cookie `rw_csrf` (double submit) en een `Origin` die gelijk is aan de app-origin. Uitzondering: `POST /sessions/:id/events` accepteert het CSRF-token in de body, omdat `sendBeacon` geen headers kan zetten. Paginering is cursorgebaseerd (`?cursor=&limit=`). Tijdstippen in antwoorden zijn ISO-8601 in UTC; focusdagen zijn datums.

Foutantwoorden hebben één vorm: `{ "error": { "code": "WEEKLY_CAP", "message_key": "errors.weekly_cap", "details": {…} } }`. De web-app vertaalt `message_key`; de server stuurt geen vrije tekst naar gebruikers.

Autorisatie in de tabellen: **publiek** (geen sessie), **pre** (magic link gevolgd, onboarding niet af), **student** (gebruiker met afgeronde onboarding), **18+** (student met `18_plus`), **bestuur** (bestuurslid van die vereniging), **beheer** (rol `admin` of `reviewer`), **dev** (alleen `NODE_ENV` development of test; in productie bestaat de route niet).

### 8.2 Endpoints

**Auth, onboarding en profiel**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `POST /auth/magic-link` | `{ email, locale, invite_token? }` | `202 {}` (altijd, ook bij onbekend adres) | publiek | `VALIDATION_FAILED`, `RATE_LIMITED`, `INVITE_REQUIRED` (gesloten pilot zonder uitnodiging) |
| `GET /auth/callback?token=` | — | `302` naar `/onboarding` of `/`, zet `rw_sid` en `rw_csrf` | publiek | `LINK_INVALID`, `LINK_EXPIRED` (als redirect met foutparameter) |
| `POST /auth/logout` | — | `204` | student, pre | — |
| `GET /me` | — | `{ user, age_band, settings, squad?, club?, flags, onboarding_complete }` | student, pre | `AUTH_REQUIRED` |
| `POST /onboarding` | `{ first_name, last_name?, birth_date, terms_version, privacy_version, daily_goal_min, confirm_overreach? }` | `201 { user }` | pre | `AGE_BELOW_MINIMUM` (en sessie + e-mail gewist), `TERMS_OUTDATED`, `VALIDATION_FAILED` |
| `PATCH /me/settings` | `{ compare_opt_in?, silent_mode?, squad_name_on_cards?, no_points_mode?, locale? }` | `{ settings }` | student | `VALIDATION_FAILED` |
| `PUT /me/daily-goal` | `{ minutes, confirm_overreach? }` | `{ goal_min, effective_from_day }` | student | `OVERREACH_CONFIRM_REQUIRED` |
| `GET /me/today` | — | `{ focus_day, counted_min, goal_min, goal_met, joker_available, bonus_rule, streak }` | student | — |
| `POST /me/phone/start` | `{ phone }` | `202 { expires_at }` | student | `PHONE_IN_USE`, `RATE_LIMITED` |
| `POST /me/phone/confirm` | `{ code }` | `{ verified: true }` | student | `CODE_INVALID`, `CODE_EXPIRED`, `TOO_MANY_ATTEMPTS` |
| `GET /me/export` | — | JSON-bestand met alle gegevens van de gebruiker (§10.7) | student | `RATE_LIMITED` |
| `DELETE /me` | `{ confirm: "VERWIJDER" }` | `202 { deleted_at }` | student | `CONFIRMATION_REQUIRED` |

**Sessies**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `POST /devices` | `{ device_id, ua_class, standalone, wakelock_supported }` | `{ device_id }` | student | `VALIDATION_FAILED` |
| `POST /sessions` | `{ planned_min: 1\|25\|50\|90, device_id, practice, client_ts, mono_ms, webdriver, standalone }` | `201 { session_id, nonce, server_start_at, planned_end_at, heartbeat_s: 30 }` | student | `SESSION_ACTIVE` (zelfde toestel), `INVALID_DURATION`, `ACCOUNT_BLOCKED` |
| `POST /sessions/:id/heartbeats` | `{ nonce, seq, mono_ms, client_ts, rtt_ms?, visibility, wakelock, events: VisibilityEvent[] }` | `{ nonce, server_now, status, abort_reason? }` | student (eigenaar) | `NONCE_INVALID`, `SESSION_CLOSED`, `RATE_LIMITED` |
| `POST /sessions/:id/events` | `{ csrf?, last_nonce, events: (VisibilityEvent \| Heartbeat)[] }` (ook als `text/plain` via beacon) | `202 { status }` | student (eigenaar) | `SESSION_CLOSED`, `VALIDATION_FAILED` |
| `POST /sessions/:id/end` | `{ nonce, mono_ms, client_ts, events }` | `{ status, verified_min, counted_min, points, points_status, flagged, goal_met, streak, earn_in_progress_min }` | student (eigenaar) | `NONCE_INVALID`, `SESSION_CLOSED` |
| `POST /sessions/:id/stop` | `{ nonce }` | `{ status: "aborted", abort_reason: "user_stop", elapsed_s }` | student (eigenaar) | `SESSION_CLOSED` |
| `GET /sessions/active` | — | `{ session? }` | student | — |
| `GET /sessions/:id` | — | `{ session, abort_reason?, explanation_key, review_status }` | student (eigenaar) | `NOT_FOUND` |
| `GET /sessions?from=&to=` | — | `{ items, next_cursor }` | student | — |
| `POST /sessions/:id/report` | `{ text? }` ("Klopt dit niet?") | `201 { flag_id }` | student (eigenaar) | `ALREADY_REPORTED`, `SESSION_NOT_ABORTED` |

**Punten, catalogus en verzilvering**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `GET /points/balance` | — | `{ available, pending, referral_unvested, earn_in_min, earn_in_required: 300, next_redeem_from? }` | student | — |
| `GET /points/ledger` | `?cursor` | `{ items: [{ type, amount, status, ref, rule_key?, created_at }], next_cursor }` | student | — |
| `GET /catalog` | — | `{ items: [{ id, title, partner, points_price, stock_this_week, next_release?, terms }] }` | student | — |
| `POST /redemptions` | `{ reward_id }` + `Idempotency-Key` | `201 { redemption_id, voucher_code, points, points_from_referral }` | student | `EARN_IN_REQUIRED`, `PHONE_NOT_VERIFIED`, `WEEKLY_CAP`, `MONTHLY_CAP`, `OUT_OF_STOCK`, `INSUFFICIENT_POINTS`, `REFERRAL_SHARE_EXCEEDED`, `IDEMPOTENCY_CONFLICT` |
| `GET /redemptions` | — | `{ items }` | student | — |
| `POST /redemptions/:id/broken` | `{ text? }` ("Werkt niet") | `201 { ticket_id }` | student (eigenaar) | `ALREADY_REPORTED` |

**Squads, uitnodigingen en duels**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `GET /invites/:token` | — | `{ source, inviter_first_name?, squad_name?, valid }` (zonder punten of prijzen) | publiek | `INVITE_INVALID`, `INVITE_EXPIRED`, `INVITE_EXHAUSTED` |
| `POST /invites/:token/accept` | — | `{ squad? \| duel? }` | student | idem, `ALREADY_IN_SQUAD`, `SQUAD_FULL`, `DUEL_ACTIVE` |
| `POST /squads` | `{ name, club_id? }` + `Idempotency-Key` | `201 { squad, invite }` | student | `ALREADY_IN_SQUAD`, `NAME_REJECTED` |
| `GET /squads/mine` | — | `{ squad, members: [{ first_name, paused, goal_met_today }], streak, status }` | student (lid) | `NOT_IN_SQUAD` |
| `GET /squads/mine/presence` | — | `{ members: [{ member_ref, focusing, remaining_min? }], polled_at }` | student (lid) | `NOT_IN_SQUAD` |
| `GET /squads/mine/compare` | — | `{ members: [{ first_name, minutes_today, minutes_week }] }` (alleen wederzijds opt-in) | student (lid, opt-in) | `COMPARE_OPT_IN_REQUIRED` |
| `POST /squads/mine/invites` | — | `201 { invite }` | student (lid) | `INVITE_MOMENT_NOT_ALLOWED`, `SQUAD_FULL` |
| `PATCH /squads/mine` | `{ name?, club_id? }` | `{ squad }` | student (beheerder squad) | `NAME_REJECTED` |
| `POST /squads/mine/leave` | — | `204` | student (lid) | — |
| `POST /duels` | `{ opponent_member_ref? }` | `201 { duel, invite }` | student | `DUEL_ACTIVE` |
| `GET /duels/current` | — | `{ duel, days: [{ day, me, opponent }], result? }` | student (speler) | `NOT_FOUND` |

**Vereniging, challenges, ranglijst en bestuur**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `POST /clubs/join` | `{ code, qr_source? }` | `{ club, status: "linked" \| "pending_admin" }` | student | `CODE_INVALID`, `ALREADY_LINKED` |
| `POST /clubs/leave` | — | `204` | student | — |
| `GET /leaderboards/:challenge_id` | — | `{ pools: [{ pool, rows: [{ club_name, participation_rate, intensity_min, rank }] }], is_final, computed_at }` | student | `NOT_FOUND` |
| `GET /challenges` | — | `{ items: [{ id, type, title, period, seats_left?, prize }] }` | student | — |
| `POST /challenges/:id/enroll` | `Idempotency-Key` | `201 { enrollment, seat_no }` | student | `SEATS_FULL`, `ENROLLMENT_CLOSED`, `AGE_RESTRICTED` |
| `GET /challenges/:id/progress` | — | `{ days: [{ day, minutes, met }], status }` | student (deelnemer) | `NOT_ENROLLED` |
| `GET /board/clubs/:id/dashboard?tab=` | `tab` = stand/werving/prijs/kwaliteit | Aggregaten volgens spec §4.6; onderdrukte cijfers als `null` met `suppressed: true` | bestuur | `FORBIDDEN` |
| `GET /board/clubs/:id/promo-kit` | — | `{ assets: [{ kind, url, qr_source }] }` | bestuur | `FORBIDDEN` |

**Belofte, kaarten, referral, trekkingen en events**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `GET /belofte/offer` | — | `{ offer?: { suggested_days, suggested_min } }` | student | `FEATURE_DISABLED` |
| `POST /beloftes` | `{ days_per_week, min_per_day, witnesses }` | `201 { belofte }` | student | `BELOFTE_ACTIVE`, `VALIDATION_FAILED` |
| `GET /beloftes/current` | — | `{ belofte, days }` | student | `NOT_FOUND` |
| `POST /beloftes/:id/stop` | — | `{ status: "stopped" }` | student (eigenaar) | — |
| `POST /beloftes/:id/reflection` | `{ action, stake_interest? }` (`stake_interest` alleen 18+) | `{ next? }` | student (eigenaar) | `AGE_RESTRICTED` |
| `POST /cards` | `{ kind, ref_id, fields }` | `201 { card_id, token, image_url }` | student | `SESSION_UNDER_REVIEW`, `FEATURE_DISABLED` |
| `GET /cards/:id/image?format=9x16\|1x1` | — | SVG of PNG | student (eigenaar) | `NOT_FOUND` |
| `DELETE /cards/:id` | — | `204` | student (eigenaar) | — |
| `GET /verify/:token` | — | `{ first_name, duration_min, from, to, streak?, statement_key }` | publiek (`noindex`) | `CARD_UNAVAILABLE` |
| `GET /referral/mine` | — | `{ link?, pending: [{ first_name, sessions_done, deadline }] }` | student | `FEATURE_DISABLED` |
| `GET /draws` | — | `{ games: [{ id, prize, prizes_count, chance, draw_at, seed_hash, terms_url, opted_in }] }` | 18+ | `FEATURE_DISABLED`, `AGE_RESTRICTED` |
| `POST /draws/:game_id/opt-in` | `{ terms_version }` | `{ opted_in: true }` | 18+ | `TERMS_OUTDATED` |
| `GET /draws/:game_id/public` | — | `{ seed_hash, draws: [{ entries_hash, entries_count, winners_codes, seed? }] }` | publiek | `FEATURE_DISABLED` |
| `POST /events` | `{ name, props }` (alleen client-events uit de taxonomie) | `202` | student, pre | `UNKNOWN_EVENT` |
| `POST /appeals` | `{ object_type, object_id, text }` | `201 { appeal_id }` | student | `APPEAL_WINDOW_CLOSED`, `ALREADY_APPEALED` |

**Beheer**

| Methode en pad | Request | Response | Autorisatie | Foutcodes |
|---|---|---|---|---|
| `GET/POST/PATCH /admin/clubs[/:id]` | Naam, stad, ledental met bron, poule, bestuursaccounts | Club met code en plafond | beheer | `VALIDATION_FAILED` |
| `GET /admin/clubs/:id/pending-links` · `POST …/decide` | `{ user_ref, decision }` | — | beheer | — |
| `GET/POST /admin/partners`, `POST /admin/partners/:id/budgets` | `{ kind, booked_cents, reward_pct, document_ref, booked_at }` | Budget met vrije ruimte | beheer | `DOCUMENT_REQUIRED` |
| `GET /admin/budget/overview` | — | Geboekt, gealloceerd, vrij, uitstaande punten, waarde tegen budgetwaarde, dekkingsgraad | beheer | — |
| `POST /admin/rewards` · `POST /admin/rewards/:id/vouchers` (CSV) · `POST /admin/rewards/:id/publish` · `POST /admin/rewards/:id/releases` | Item, codes, weekvrijgave | Item met allocatie | beheer | `CEILING_EXCEEDED` (> €5), `COVERAGE_INSUFFICIENT`, `PRICE_IMMUTABLE` |
| `POST /admin/challenges` · `POST …/publish` · `POST …/results/propose` · `POST …/results/confirm` | Challenge, prijzen, uitslag | Challenge | beheer | `CEILING_EXCEEDED`, `COVERAGE_INSUFFICIENT`, `FOUR_EYES_REQUIRED`, `SAMPLE_REQUIRED` |
| `GET /admin/flags?status=open` | — | Wachtrij met bewijs per markering | beheer (auditregel per inzage) | — |
| `POST /admin/flags/:id/decision` | `{ decision: release\|reject\|block, reason_code, note }` | Markering met gevolgen | beheer | `REASON_REQUIRED`, `FOUR_EYES_REQUIRED` (block) |
| `POST /admin/blocks/:id/confirm` | `{ note }` | Blokkade actief | beheer (andere beheerder) | `SAME_REVIEWER` |
| `GET /admin/appeals` · `POST /admin/appeals/:id/decision` | `{ outcome, motivation }` | Beroep | beheer (≠ oorspronkelijke beslisser) | `SAME_REVIEWER`, `REASON_REQUIRED` |
| `POST /admin/outages` | `{ from, to, note }` | Storing | beheer | — |
| `GET /admin/users?q=` · `GET /admin/users/:id` | `reason` verplicht als queryparameter | Gebruiker, sessies | beheer (auditregel) | `REASON_REQUIRED` |
| `POST /admin/users/:id/team-flag` · `DELETE /admin/users/:id` | — | — | beheer | `FOUR_EYES_REQUIRED` (verwijderen door beheer) |
| `PUT /admin/vacation-pause` | `{ start_day, end_day }` | Periode | beheer | `PERIOD_LOCKED` |
| `GET /admin/experiments` | — | Toewijzing per eenheid en wissels | beheer | — |
| `PUT /admin/feature-flags/:key` | `{ enabled }` | Vlag | beheer | `FOUR_EYES_REQUIRED` (`draws`) |
| `POST /admin/draw-games` · `POST …/commit` · `POST …/confirm-commit` · `POST /admin/draws/:id/execute` · `POST /admin/prizes/:id/verify` | Spel, voorwaarden, seed-commit, trekking, winnaarsverificatie | Spel, trekking, prijs | beheer | `GAME_LIMIT_EXCEEDED`, `ANNUAL_LIMIT_EXCEEDED`, `ENTRIES_CHANGED`, `FEATURE_DISABLED` |
| `GET /admin/kpi/:query` | `?from&to` | Tabel uit opgeslagen query (spec §7.2) | beheer | `NOT_FOUND` |
| `GET /admin/audit` | `?object&actor` | Auditregels | beheer | — |

**Ontwikkeling en test**

| Methode en pad | Request | Response | Autorisatie |
|---|---|---|---|
| `GET /dev/inbox?to=` | — | Laatste e-mails en sms'en met magic link of code | dev |
| `POST /dev/clock` | `{ set?: ISO, advance_ms? }` | `{ now }` | dev |
| `POST /dev/jobs/:job/run` | `{ run_key? }` | `{ status }` | dev |
| `POST /dev/reset` | `{ seed?: "demo" \| "empty" }` | `{ ok }` | dev |

### 8.3 Foutcodes

| HTTP | Codes |
|---|---|
| 400 / 422 | `VALIDATION_FAILED`, `INVALID_DURATION`, `CEILING_EXCEEDED`, `GAME_LIMIT_EXCEEDED`, `ANNUAL_LIMIT_EXCEEDED`, `CONFIRMATION_REQUIRED`, `REASON_REQUIRED`, `DOCUMENT_REQUIRED`, `UNKNOWN_EVENT` |
| 401 | `AUTH_REQUIRED`, `LINK_INVALID`, `LINK_EXPIRED` |
| 403 | `FORBIDDEN`, `CSRF_INVALID`, `AGE_BELOW_MINIMUM`, `AGE_RESTRICTED`, `ACCOUNT_BLOCKED`, `INVITE_REQUIRED`, `COMPARE_OPT_IN_REQUIRED` |
| 404 | `NOT_FOUND`, `FEATURE_DISABLED`, `CARD_UNAVAILABLE`, `NOT_IN_SQUAD`, `NOT_ENROLLED` |
| 409 | `SESSION_ACTIVE`, `SESSION_CLOSED`, `SESSION_NOT_ABORTED`, `NONCE_INVALID`, `EARN_IN_REQUIRED`, `PHONE_NOT_VERIFIED`, `PHONE_IN_USE`, `WEEKLY_CAP`, `MONTHLY_CAP`, `OUT_OF_STOCK`, `INSUFFICIENT_POINTS`, `REFERRAL_SHARE_EXCEEDED`, `COVERAGE_INSUFFICIENT`, `PRICE_IMMUTABLE`, `IDEMPOTENCY_CONFLICT`, `ALREADY_IN_SQUAD`, `SQUAD_FULL`, `DUEL_ACTIVE`, `BELOFTE_ACTIVE`, `ALREADY_LINKED`, `SEATS_FULL`, `ENROLLMENT_CLOSED`, `SESSION_UNDER_REVIEW`, `ALREADY_REPORTED`, `ALREADY_APPEALED`, `APPEAL_WINDOW_CLOSED`, `FOUR_EYES_REQUIRED`, `SAME_REVIEWER`, `SAMPLE_REQUIRED`, `ENTRIES_CHANGED`, `PERIOD_LOCKED`, `TERMS_OUTDATED`, `OVERREACH_CONFIRM_REQUIRED`, `INVITE_MOMENT_NOT_ALLOWED`, `NAME_REJECTED` |
| 410 | `INVITE_INVALID`, `INVITE_EXPIRED`, `INVITE_EXHAUSTED`, `CODE_EXPIRED` |
| 429 | `RATE_LIMITED`, `TOO_MANY_ATTEMPTS` (met `Retry-After`) |
| 500 / 503 | `INTERNAL`, `MAINTENANCE` |

## 9. Web-app

### 9.1 Routes

| Route | Inhoud | Toegang | Release |
|---|---|---|---|
| `/` | Vandaag: dagdoel, squad live, startknop | student | R1 |
| `/welkom`, `/i/:token` | Landing en uitnodigingspreview | publiek | R1 |
| `/login`, `/auth/check-inbox` | Magic link aanvragen | publiek | R1 |
| `/onboarding/*` | Stappen uit spec §3.1, inclusief oefensessie | pre | R1 |
| `/focus` | Checklist, duurkeuze, lopende sessie, eindscherm, afbreekscherm | student | R1 |
| `/hoe-we-tellen` | Eerlijke claim, regels, oefensessie | publiek | R1 |
| `/punten`, `/punten/catalogus`, `/punten/geschiedenis` | Saldo in drie delen, catalogus, journaal | student | R1 |
| `/squad`, `/squad/nieuw`, `/squad/vergelijken` | Squad, aanmaken, opt-in vergelijking | student | R1 |
| `/duel` | Duel | student | R2 |
| `/vereniging`, `/vereniging/ranglijst` | Koppelen, ranglijst | student | R1 |
| `/challenges/:id` | Prestatiechallenge | student | R3 |
| `/belofte` | Aanbod, lopende Belofte, reflectie | student | R2 |
| `/kaart/:id`, `/v/:token` | Kaart maken; publieke verificatiepagina | student / publiek | R2 |
| `/kans` | Trekkingen, spelvoorwaarden (vlag) | 18+ | R3 |
| `/profiel`, `/profiel/privacy` | Instellingen, export, verwijderen | student | R1 |
| `/bestuur/:clubId/*` | Dashboardtabbladen uit spec §4.6 | bestuur | R1 |
| `/beheer/*` | Beheeromgeving (lui geladen bundel) | beheer | R1–R3 |

De router is React Router in data-modus; de beheer- en bestuursbundels laden lui, zodat de studentenbundel klein blijft voor het eerste bezoek via een WhatsApp-link.

### 9.2 State-management

Serverdata (saldo, squad, catalogus, ranglijst) loopt via TanStack Query met de getypeerde client; elke query heeft een sleutel per resource en de aanwezigheid pollt elke 30 seconden zolang het squadscherm of de focusweergave zichtbaar is (spec §4.4: polling, geen websockets). De sessie zelf staat niet in TanStack Query maar in een kleine store rond de toestandsmachine uit core (`useSyncExternalStore`), omdat ze moet blijven werken als het netwerk wegvalt en omdat haar overgangen deterministisch getest moeten kunnen worden. Formulieren gebruiken de zod-schema's uit contracts voor validatie in de browser. Er is geen globale state-bibliotheek nodig.

### 9.3 Offline-opslag

IndexedDB (via de kleine wrapper `idb`) heeft vier stores: `device` (de toestel-UUID), `active_session` (kop van de lopende sessie en de laatste nonce), `outbox` (gebeurtenissen, heartbeats en idempotente handelingen met hun sleutel, in volgorde) en `cache` (laatste squad- en saldogegevens voor de offline weergave). Persistente opslag wordt aangevraagd met `navigator.storage.persist()` na de eerste voltooide sessie. De outbox wordt geleegd bij `online`, bij elke heartbeat en bij het opstarten; er is geen afhankelijkheid van Background Sync, omdat die niet in alle browsers bestaat. `localStorage` wordt alleen gebruikt voor de taalkeuze en het laatste tabblad, met try/catch.

### 9.4 PWA-manifest en service worker

Het manifest heeft `name` "Rewarded", `lang` nl, `start_url` `/?bron=pwa`, `display` `standalone`, `orientation` `portrait`, kleuren uit de tokens en iconen van 192, 512 en maskable 512. De service worker (`vite-plugin-pwa`, modus `injectManifest`, code in `src/sw/`) precachet app-shell en vertalingen, laat `/api/*` altijd netwerk-only (een gecachet antwoord zou de nonce-keten breken) en toont een offline-pagina. Een nieuwe versie wordt nooit tijdens een lopende sessie geactiveerd: de app stuurt `SKIP_WAITING` pas als de toestandsmachine in `idle` staat. Webpush valt onder Could in R2 (spec §8) en wordt pas gebouwd na een test op een echte iPhone.

### 9.5 Wake Lock en Page Visibility

Beide API's zitten achter adapters in `src/platform/`, met een interface die de tests kunnen vervangen.

| Adapter | Gedrag |
|---|---|
| `visibility.ts` | Leest `document.visibilityState`, luistert naar `visibilitychange`, `pagehide`, `pageshow`, `blur`, `focus`; geeft gebeurtenissen met `performance.now()` door aan de machine |
| `wakelock.ts` | Vraagt `navigator.wakeLock.request('screen')` aan bij start en na elke terugkeer naar `visible`; meldt `acquired`, `denied`, `released`, `unsupported`; bij vrijgave terwijl de pagina zichtbaar is: waarschuwing en één nieuwe poging per 10 seconden (spec §4.1) |
| `clock.ts` | `monoNow()` en `wallNow()`; nooit `Date.now()` voor duur |
| `tabLock.ts` | Web Locks en `BroadcastChannel` voor de eigenaartab (§4.4); terugval zonder Web Locks: `BroadcastChannel`-handdruk |
| `beacon.ts` | `sendBeacon` met CSRF-token in de body; terugval `fetch(..., { keepalive: true })` |

De sessieweergave is een donker scherm met resterende tijd en de squad (spec §3.2). Zonder Wake Lock toont de app de tekst uit spec §3.2 stap 3. Vóór 2 december wordt het gedrag getest op minstens één iPhone (Safari en Home Screen-app) en twee Android-toestellen (spec §4.1); die test is handwerk en staat als acceptatiecriterium in WP-8.

### 9.6 i18n en toegankelijkheid

i18n gebruikt `i18next` met `react-i18next` en ICU-meervoud; Nederlands is standaard, Engels tweede taal. Vertaalbestanden staan per feature (`i18n/nl/focus.json`), zodat werkpakketten niet in elkaars bestanden schrijven. Afbreek-, fout- en heuristiekcodes hebben vaste sleutels die ook support gebruikt (spec §4.1). Een test eist elke sleutel in beide talen en een sleutel voor elke code uit contracts; een lintregel weert verboden woorden ("bewezen", "verdien geld", "winnen" buiten trekkingen). Tijden worden getoond in Europe/Amsterdam.

Toegankelijkheid volgt WCAG 2.2 AA. Concreet: alle interactieve elementen zijn met het toetsenbord bereikbaar en minstens 44 × 44 px; het donkere sessiescherm haalt contrast 4,5:1; de timer kondigt via `aria-live="polite"` alleen hele minuten aan, niet elke seconde; animaties respecteren `prefers-reduced-motion`; formulieren hebben labels en foutmeldingen die aan het veld gekoppeld zijn; de afbreekuitleg is tekst, geen kleur alleen. Playwright draait `@axe-core/playwright` op de hoofdroutes als onderdeel van de e2e-suite.

### 9.7 Designsysteem als tokens

Op 4 november bestaat `docs/research/06-ux-ontwerp.md` nog niet. De tokenstructuur is zo opgezet dat het ontwerp later past zonder componentcode te wijzigen. De bron is `apps/web/src/design/tokens.json` in twee lagen: primitieven (kleurschalen, maatstappen, lettertypen, radii, schaduwen, duur van animaties) en semantische tokens (`color.surface`, `color.surface-focus` voor het donkere sessiescherm, `color.text`, `color.accent`, `color.success`, `color.warning`, `space.1–8`, `radius.card`, `font.body`, `font.numeric`). Een klein buildscript zet het bestand om in `tokens.css` met CSS custom properties op `:root`, een donkere variant onder `prefers-color-scheme: dark` en `[data-theme]`, en een TypeScript-typebestand zodat componenten alleen bestaande tokens gebruiken. Componenten gebruiken uitsluitend semantische tokens. Zodra 06 er is, vult de ontwerper `tokens.json` en levert WP-7 de basiscomponenten (knop, kaart, lijstregel, voortgangsring, tijdweergave, melding) volgens de componentspecificatie daarin. Tot dan zijn de waarden neutrale placeholders die het contrast halen.

## 10. Beveiliging en AVG

### 10.1 Authenticatie

De magic-linkflow heeft vijf stappen. (1) `POST /auth/magic-link` maakt een token van 32 willekeurige bytes, bewaart alleen de SHA-256-hash (15 minuten geldig) en stuurt de link via de `Mailer`; in ontwikkeling naar console en dev-inbox, in productie via een nog te kiezen verwerker (open vraag 1). Het antwoord is altijd 202, zodat niet te zien is welke adressen bestaan. (2) De callback controleert hash, geldigheid en eenmalig gebruik, maakt een `auth_session` en zet de cookies. (3) Een nieuw adres krijgt een sessie in de toestand `pre` met alleen het e-mailadres. (4) De onboarding controleert de leeftijd; onder 16 verwijdert de server de pre-sessie en de magic-linkrij, zodat er niets van die persoon blijft (spec §3.1 stap 5). (5) Een geslaagde onboarding maakt de gebruiker en koppelt de sessie. Sessies verlopen na 30 dagen inactiviteit, beheersessies na 12 uur; uitloggen en blokkeren verwijderen alle sessies van het account.

### 10.2 Rate limiting

Een token-bucket in het geheugen van het API-proces, per sleutel (IP-hash, e-mailhash, gebruiker of sessie). Bij één API-proces in de pilot volstaat dat; meerdere processen vragen een gedeelde opslag (open vraag 9).

| Route | Limiet (**keuze**, aan te passen na de eerste pilotweek) |
|---|---|
| `POST /auth/magic-link` | 5 per uur per e-mail, 20 per uur per IP-hash |
| `POST /me/phone/start` / `confirm` | 3 per uur per gebruiker / 5 pogingen per code |
| `POST /sessions` | 12 per uur per gebruiker |
| `POST /sessions/:id/heartbeats` | 1 per 10 s per sessie |
| `POST /redemptions` | 10 per uur per gebruiker |
| `POST /events` | 120 per uur per gebruiker |
| Overige muterende routes | 60 per minuut per gebruiker |

### 10.3 CSRF, invoervalidatie en headers

CSRF-bescherming is drievoudig: SameSite=Lax op de sessiecookie, een double-submit-token in `X-CSRF-Token` en een controle van `Origin`. Alle invoer gaat door zod-schema's met strikte objecten (onbekende velden worden geweigerd), begrensde stringlengtes en enumeraties voor elke code. Vrije tekst (squadnaam, beroep, melding) wordt als tekst opgeslagen en nooit als HTML gerenderd; squadnamen gaan langs een woordenlijst en worden bij twijfel `pending` voor moderatie. SQL is altijd geparametriseerd. De API zet `Content-Security-Policy` (alleen eigen origin, geen inline scripts), `Referrer-Policy: same-origin`, `X-Content-Type-Options: nosniff` en `Permissions-Policy` die camera, microfoon en geolocatie uitzet. De verificatiepagina `/v/:token` heeft `X-Robots-Tag: noindex`.

### 10.4 Dataminimalisatie

| Gegeven | Vorm | Waarom |
|---|---|---|
| IP-adres | `HMAC-SHA256(ip, pepper_ip)`, nooit het adres zelf | H2, H7, H10, referraluitsluiting (spec §4.9) |
| Telefoonnummer | `HMAC-SHA256(E.164, pepper_phone)`; het nummer zelf alleen in geheugen tijdens verzending | Eén nummer per account, H8 |
| User agent | Klasse (`ios-safari`, `ios-standalone`, `android-chrome`, `desktop-chromium`, `desktop-firefox`, `desktop-safari`, `headless`, `other`) | H1, uitleg Wake Lock |
| Geboortedatum | Niet opgeslagen; alleen `age_band` en `turns_18_on` | Spec §4.10 |
| Events | `pseudonym` in plaats van `user_id` | Spec §7 |

De peppers staan in een lokaal bestand dat `tooling/scripts/peppers.ts` bij de eerste start genereert (`.data/peppers.json`, buiten git). Er zijn geen externe secrets nodig. Of een IP-hash onder de cookiebepaling valt, is een open vraag voor de jurist (spec open vraag 14, rapport 09 §7.3).

### 10.5 Grondslag en DPIA

De grondslag is de overeenkomst voor de kernfunctie en toestemming voor wat daarbuiten valt (rapport 02 §2.4). Een DPIA is vrijwel zeker verplicht, omdat we stelselmatig gedrag van een jonge doelgroep monitoren (rapport 02 §2.4, businessplan §8). De architectuur levert daarvoor een verwerkingsregister als bijlage in de repo (`docs/dpia/verwerkingen.md`, door WP-6 bij te houden): per tabel het doel, de categorie en de bewaartermijn.

### 10.6 Bewaartermijnen

De opschoning is stap 10 van de dagafsluiting en is idempotent. De termijnen zijn de werkhypothesen uit spec §4.10, vast te leggen in de DPIA.

| Gegeven | Termijn | Daarna |
|---|---|---|
| `ip_hash` en `ua_class` op sessies en registraties | 30 dagen | Kolom op NULL |
| `session_heartbeat`, `visibility_event` | 90 dagen | Samengevat in `session_summary`, ruwe rijen verwijderd |
| `auth_magic_link` | 24 uur | Verwijderd |
| `phone_verification` (codes) | 24 uur | Verwijderd; `phone_hash` blijft op de gebruiker |
| `idempotency_record` | 24 uur | Verwijderd |
| `auth_session` | Bij verloop | Verwijderd |
| Grootboek, verzilveringen, prijzen | Zolang het account bestaat; na verwijdering geanonimiseerd | Nodig voor budgetverantwoording aan partners |
| `audit_log` | **Open vraag** (voorstel: 2 jaar) | — |
| `event` | Pilotanalyse; na verwijdering van het account onkoppelbaar | `pseudonym` wordt gewist |

### 10.7 Export en verwijdering

`GET /me/export` levert één JSON-bestand met profiel, sessies met hun signalen (voor zover nog bewaard), journaal, verzilveringen, lidmaatschappen, Beloftes, kaarten, markeringen met besluiten en beroepen. Gegevens van anderen (namen van squadleden) staan er niet in, alleen verwijzingen. `DELETE /me` verwijdert het account na een bevestiging: punten vervallen met een `expire`-post (spec §4.2, na waarschuwing in de UI), lidmaatschappen sluiten, kaarten worden ingetrokken, persoonsgegevens worden gewist of op NULL gezet, het `pseudonym` wordt gewist zodat events onkoppelbaar worden, en grootboek- en verzilveringsrijen blijven bestaan met een geanonimiseerde eigenaar. Een open markering of beroep wordt gesloten met redencode `account_deleted`.

### 10.8 Menselijke herbeoordeling en audit

De architectuur maakt een geautomatiseerd negatief besluit onmogelijk (art. 22 AVG, rapport 02 §2.4; businessplan §4). Geen job of heuristiek kan een `reverse`, blokkade of afgekeurde prijs boeken; alleen routes onder `/admin/flags`, `/admin/appeals` en `/admin/prizes` kunnen dat, met beheerderssessie, redencode en auditregel in dezelfde transactie. De enige automatische uitkomst is het afbreken van een sessie op de vaste regels van spec §4.1, en die heeft de meldroute "Klopt dit niet?". Blokkade en uitslagpublicatie vragen een tweede beheerder; een beroep beslist een andere beheerder dan de eerste. Het auditlog is append-only (triggers), en elke inzage van sessiegegevens schrijft een regel met reden.

## 11. Teststrategie

| Laag | Gereedschap | Wat | Draait |
|---|---|---|---|
| Unit | Vitest op `packages/core` | Toestandsmachine, `evaluateSession`, grootboekregels, focusdag en zomertijd, doelbonus A en B, streak en joker, deelnamegraad en intensiteit, H1–H10, puntenprijs en plafonds, trekking, vesting, Belofte | Elke commit, < 10 s |
| Eigenschappen | `fast-check` in Vitest | Elke reeks boekingen sluit op nul; saldo = som; daglimiet nooit overschreden; trekking deterministisch en zonder bias; `evaluateSession` monotoon in tijd | Elke commit |
| Contract | Vitest op `packages/contracts` | Schema's accepteren voorbeelden en weigeren onbekende velden; elke foutcode heeft een i18n-sleutel | Elke commit |
| API-integratie | Vitest + Hono `app.request()`, SQLite `:memory:` per test, nep-`Clock`, nep-`Mailer` | Elke route met autorisatiematrix, foutcodes, idempotentie, gelijktijdige verzilveringen, dagafsluiting, privacyfilters (§6.4), auditregels, bewaartermijnen | Elke commit, < 60 s |
| Componenten | Vitest + Testing Library (jsdom) | Afbreekscherm per code, saldo in drie delen, overmoedrem, opt-in-schakelaars | Elke commit |
| End-to-end | Playwright met Chromium, `webServer` start api en web | Kernflows door de hele keten (tabel hieronder), axe-controle | Voor elke merge naar main en elke release |
| Handmatig op toestel | Checklist in `e2e/MANUAL.md` | Wake Lock en zichtbaarheid op iPhone (Safari, Home Screen) en twee Android-toestellen | Vóór R1 en na elke wijziging in `platform/` |

De end-to-endsuite simuleert zichtbaarheid en tijd zonder de productiecode te omzeilen. Een init-script (`page.addInitScript`) installeert in testmodus `window.__rwTest` met `setVisibility('hidden' | 'visible')`, dat de getter van `document.visibilityState` overschrijft en een echt `visibilitychange`-event afvuurt, en een nep-Wake Lock die op commando `acquired` of `released` meldt. Tijd loopt aan twee kanten gelijk op: Playwright's `page.clock` verzet de browserklok inclusief `performance.now()`, en `POST /dev/clock` verzet de serverklok met hetzelfde bedrag.

| Scenario | Verwachting |
|---|---|
| Registratie via squadlink: magic link uit `/dev/inbox`, geboortedatum 17 jaar, oefensessie | Account `16_17`, in squad, trekkingsroute bestaat niet |
| Registratie met geboortedatum 15 jaar | `AGE_BELOW_MINIMUM`, geen rij in `user`, magic-linkrij weg |
| Sessie van 25 minuten met klok vooruit in stappen van 30 s | `completed`, 25 punten beschikbaar, dagdoel gehaald, squad ziet "doel gehaald" |
| Dezelfde sessie, na 12 minuten `setVisibility('hidden')` | Afgebroken met `hidden`, uitleg "Je hield 12 minuten vol", 0 punten, streak intact |
| Netwerk 3 minuten offline (`context.setOffline`) met zichtbare pagina | `completed`, gemarkeerd H3 als het gat > 10% van de duur is |
| Netwerk 6 minuten offline | Client toont direct afbreking; server `heartbeat_gap` |
| Herladen tijdens sessie | `beforeunload`-dialoog; na herladen afbreekuitleg met code `hidden` |
| Tweede tabblad op hetzelfde toestel | "Je sessie loopt in een ander tabblad", geen tweede start |
| Tweede browsercontext (ander toestel) start sessie | Eerste sessie `second_session` |
| Standaard Playwright (`navigator.webdriver = true`) | Sessie `completed` maar gemarkeerd H1, punten in afwachting, beheerder geeft vrij in de wachtrij |
| `navigator.webdriver` overschreven op `false` | Ongemarkeerd voltooid: vastlegging dat H1 te omzeilen is (§4.6) |
| Verzilvering vóór 300 minuten, daarna na 300 minuten, daarna tweede in dezelfde week | `EARN_IN_REQUIRED`, dan voucher, dan `WEEKLY_CAP` |
| Dagafsluiting via `POST /dev/jobs/day_close/run` | `user_day`, `squad_day`, arm-B-lapse, ranglijstsnapshot |
| Bestuur opent dashboard | Alleen aggregaten, cijfers onder 5 leden onderdrukt |

**Seeddata.** `pnpm seed:demo` bouwt deterministisch (vaste PRNG-seed) een fictieve demo-omgeving: één stad "Demostad", drie fictieve studieverenigingen in één poule (zodat een poule geldig is), elk met een opgegeven ledental en code; 45 studenten, waarvan 36 in negen squads van drie tot vijf leden en negen solo; beide armen van beide factoren; 14 dagen aan sessies met een realistische mix van voltooid, afgebroken per code en een handvol gemarkeerde sessies (H3, H4, H9) in de wachtrij; één partner met een geboekt budget en documentverwijzing, drie catalogusitems met vouchercodes en weekvrijgave; een aanloopklassement en een prestatiechallenge; één duel; twee beheerders (zodat vier ogen te testen is) en één bestuurslid per vereniging. Alle namen en codes zijn fictief; de seed bevat geen echte vereniging of persoon. Een tweede seed, `empty`, maakt alleen de beheerders, voor de e2e-tests die vanaf nul beginnen.

## 12. Bouwplan in werkpakketten

Het plan is gebouwd op drie regels. Elk werkpakket bezit mappen en schrijft niet in die van een ander; gedeelde registratiepunten (modulelijst in `apps/api/src/app.ts`, router in `apps/web/src/app/routes.tsx`) maakt WP-0 op dag één met lege stubs voor elke module, zodat latere pakketten alleen hun eigen bestanden vullen. Migraties krijgen een nummerreeks per pakket, zodat er geen botsende bestandsnamen ontstaan. En de interfaces tussen pakketten (core-typen, contracts-schema's) worden op dag twee bevroren; een wijziging daarna loopt via de eigenaar van core of contracts met een korte notitie in de pull request.

| WP | Naam | Bezit (mappen) | Levert | Gebruikt | Acceptatiecriteria |
|---|---|---|---|---|---|
| WP-0 | Fundament | root (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, lint), `apps/api/src/app.ts`, `apps/web/src/app/routes.tsx`, lege modulestubs, `tooling/scripts/peppers.ts` | `pnpm dev`, `pnpm test`, `pnpm e2e`, `pnpm verify` werken op een schone checkout zonder internet na `pnpm install` | — | Schone checkout: install, build, lege tests en een lege Playwright-test slagen; driver-adapter kiest `better-sqlite3` of valt terug op `node:sqlite` |
| WP-1 | Core | `packages/core/**` | `params` v1, `time`, `session/machine`, `session/verify`, `ledger`, `goals`, `squads`, `challenges`, `fraud`, `draws`, `belofte`, `referral`, `catalog` | — | ≥ 95% regeldekking; elke regel uit spec §4.1, §4.2, §4.4–4.6, §5, §6.3 heeft minstens één test met de specparagraaf in de testnaam; eigenschapstests uit §11 slagen; geen import van Node- of DOM-API's (lintregel) |
| WP-2 | Contracts | `packages/contracts/**` | Zod-schema's voor alle routes in §8.2, foutcodes, eventtaxonomie uit spec §7.1, API-clientgenerator | `core`-typen | Elk endpoint uit §8.2 heeft request- en responseschema; schema's bevroren op dag 2 (tag `contracts-v1`) |
| WP-3 | API-basis | `apps/api/src/{db,platform,middleware,jobs/scheduler.ts}`, `modules/{auth,dev,events}`, migraties `0001–0099` (user, auth, device, admin, audit, event, job_run, idempotency, feature_flag, param_set) | Db-interface, migratierunner, auth met magic link en dev-inbox, CSRF, rate limit, idempotentie-middleware, foutafhandeling, auditwriter, dev-klok, scheduler | `core/time`, `contracts` | Integratietests voor de hele magic-linkflow inclusief onder-16-verwijdering; CSRF-weigering; auditlog weigert UPDATE en DELETE; jobs zijn idempotent per `run_key` |
| WP-4 | API sessies en punten | `modules/{sessions,points,catalog,redemptions,phone}`, migraties `0100–0199` | Sessieprotocol (§4), grootboek (§5), catalogus met dekking, verzilvering, telefoonverificatie | WP-3, `core/session`, `core/ledger`, `core/catalog` | Alle scenario's uit spec §4.1-tabellen als integratietest; 50 gelijktijdige verzilveringen leveren hoogstens één per week per gebruiker en nooit meer dan de voorraad; journaal sluit altijd op nul |
| WP-5 | API sociaal | `modules/{squads,duels,invites,clubs,challenges,leaderboards,belofte,cards,referral}`, `jobs/day_close/{goals,squads,belofte,challenges}.ts`, migraties `0200–0299` | Squads, aanwezigheid, vergelijking, duels, verenigingen, ranglijst, prestatiechallenges, Belofte, kaarten met SVG-render, referral achter vlag | WP-3, WP-4 (`user_day`-schrijver), `core/*` | Privacytest §6.4 slaagt op alle sociale routes; streak, joker, pauze en vakantiepauze kloppen met spec §4.4; deelnamegraad volgens §6.2 op seeddata nagerekend |
| WP-6 | API beheer, fraude, trekkingen, privacy | `modules/{admin,fraud,draws,privacy,kpi}`, `jobs/day_close/{heuristics,retention}.ts`, `jobs/week_start.ts`, migraties `0300–0399`, `docs/dpia/verwerkingen.md` | Wachtrij, besluiten, beroep, vier ogen, outages, heuristiek-batches, trekkingen met commit-reveal, export, verwijdering, bewaartermijnen, KPI-query's uit spec §7.2 | WP-3, WP-4, `core/fraud`, `core/draws` | Geen route buiten `/admin` kan een negatief besluit boeken (test); `draw-verify` reproduceert elke trekking; export bevat geen gegevens van anderen; opschoning laat geen ruwe signalen ouder dan 90 dagen achter |
| WP-7 | Web-shell | `apps/web/src/{app,design,i18n/*/common.json,lib/api,sw}`, `apps/web/public` | Layout, router, providers, tokens, basiscomponenten, i18n-opzet met lintregels, getypeerde client, manifest, service worker | `contracts` | Installeerbaar (Lighthouse PWA-criteria lokaal); app-shell laadt offline; axe zonder ernstige fouten op de shell |
| WP-8 | Web focus-engine | `apps/web/src/{platform,features/focus,features/onboarding}`, `i18n/*/focus.json`, `i18n/*/onboarding.json` | Adapters (§9.5), sessie-store, focusweergave, eind- en afbreekschermen, onboarding met oefensessie, outbox, test-hooks `__rwTest` | `core/session`, WP-7, `contracts` | E2E-scenario's voor sessie, afbreken, offline, herladen en dubbele tab slagen; handmatige toesteltest (§11) afgevinkt |
| WP-9 | Web features | `apps/web/src/features/{points,squads,duels,club,challenges,belofte,cards,profile,draws}`, bijbehorende i18n-bestanden | Alle studentenschermen behalve focus en onboarding | WP-7, `contracts` | Copy volgens spec (punten nooit tijdens de sessie; kans als getal; geen punten in uitnodigingen); componenttests per scherm |
| WP-10 | Web bestuur en beheer | `apps/web/src/features/{board,admin}` | Bestuursdashboard, beheeromgeving uit spec §4.11 | WP-7, `contracts` | Beheerder kan op seeddata een markering vrijgeven, een item publiceren en een uitslag met vier ogen definitief maken |
| WP-11 | Seed en e2e | `tooling/seed/**`, `e2e/**` | Demo- en lege seed, Playwright-config, alle scenario's uit §11, handmatige checklist | Alles | `pnpm seed:demo && pnpm e2e` slaagt lokaal zonder netwerk |

**Volgorde.**

| Fase | Wanneer (**aanname**: start 5 november) | Pakketten | Klaar als |
|---|---|---|---|
| A. Fundament en interfaces | Dag 1–2 | WP-0; WP-1 en WP-2 leveren eerst typen en schema's, implementatie volgt | `contracts-v1` en de core-typen zijn getagd; stubs bestaan |
| B. Core volledig, api en web parallel | Dag 3–14 | WP-1 (implementatie), WP-3 → WP-4, WP-5 en WP-6 parallel; WP-7 → WP-8, WP-9 en WP-10 parallel; WP-11 begint met de seed | Integratietests per API-module groen; web-schermen tegen een mock-client uit contracts |
| C. Integratie en e2e | Dag 15–22 | WP-11 met alle eigenaren; handmatige toesteltest | E2E-suite groen; toesteltest afgevinkt; seed draait |
| D. Stabiliseren R1 | Dag 23–27 (tot 1 december) | Alleen fixes | Release-checklist R1 |

R2-onderdelen (Belofte, duels, kaarten, modus zonder punten) en R3-onderdelen (prestatiechallenge, prijsperiode, referral, trekkingen) zitten in dezelfde pakketten maar achter vlaggen; de vlaggen gaan aan op 16 december en 5 januari. De schrapvolgorde bij tijdnood is die van spec §8; focus-engine, grootboek, squads, events en de fraudewachtrij schuiven nooit.

## 13. Na de MVP

De verificatieladder (businessplan §4, rapport 09 §8) bepaalt wat er na de pilot verandert. De architectuur houdt daar op vijf punten al rekening mee.

**Native wrapper.** Trede 2 is een native app op de voorgrond met attestatie. Voorstel: de web-app verpakken met een cross-platform-wrapper (bijvoorbeeld Capacitor) en native onderdelen als plugins schrijven; rapport 09 §8 schat 8–12 weken voor iOS en Android. Dat kan omdat alle platformafhankelijkheid achter de adapters in `src/platform/` zit: native adapters vervangen de webversies, machine en protocol blijven gelijk (open vraag 15).

**Screen Time en UsageStats.** Op iOS beloont Rewarded een actieve blokkade, geen gemeten niet-gebruik, en een drempel-callback is aanleiding voor controle, geen automatisch verlies (rapport 09 §1.2, §8). Android stuurt alleen "sessie schoon ja/nee" plus de gebeurtenissen rond begin en einde (rapport 09 §2.1, §7.3). Het schema heeft `verification_level` op de sessie en krijgt een tabel `session_evidence` (`session_id`, `kind`, `payload`) voor het bewijs per trede; `evaluateSession` en de plafonds in `core/params` zijn al per niveau opgezet.

**Attestatie.** `device` heeft de velden `attestation_kind` en `attestation_ref` al voor App Attest en Play Integrity. Plafonds per toestel en per persoon worden een extra controle in de verzilveringstransactie. Omdat App Attest-sleutels een herinstallatie niet overleven en DeviceCheck-bits eerst in productie getest moeten worden (rapport 09 §7.2), rust het plafond per persoon op telefoonnummer en later identiteit.

**Betalingen.** Plus krijgt een eigen abonnementstabel, raakt het puntengrootboek niet en is nooit gekoppeld aan trekkingen (businessplan §5, §8). De inzetlaag komt pas na advocatenopinie, Ksa-toets, acceptatie door een betaaldienstverlener en native verificatie, als kaartreservering zonder eigen saldo; verbeurde inzet gaat volledig naar een goed doel. Er bestaat geen boekingsregel die punten in euro's omzet en die komt er ook niet. Het pool-model komt in geen fase terug.

**Schaal.** SQLite met WAL volstaat voor de pilot (**inschatting**: enkele honderden gelijktijdige sessies geven enkele heartbeats per seconde). Bij groei vervangt een Postgres-adapter de `Db`-interface; de SQL blijft daarom standaard, en rate limiting en scheduler gaan naar gedeelde opslag.

## 14. Open vragen en risico's

De lijst is gerangschikt op urgentie. "Besluit" betekent dat de founder kiest; "jurist" dat het in de advocatenopinie of DPIA hoort; "risico" dat de architectuur het beheerst maar niet wegneemt.

| # | Onderwerp | Soort | Wat er speelt | Voorstel of beheersing |
|---|---|---|---|---|
| 1 | Hosting, mailer, sms, back-up | Open, blokkerend voor 2 december | De MVP draait lokaal; waar de pilot draait en wie e-mail en sms levert, is niet besloten | Eén kleine EU-gehoste server met dagelijkse versleutelde back-up; EU-verwerkers met verwerkersovereenkomst; vermelden in de DPIA |
| 2 | Herladen als afbreking | Besluit | De spec telt `pagehide` als afbreken, dus ook per ongeluk herladen | Volgen, met `beforeunload`-waarschuwing en detail `reload`; na de pilot op data beslissen of een uitzondering (pagina zichtbaar gebleven, gat < 90 s) de bewust geopende fraudeweg waard is |
| 3 | `better-sqlite3` in de bouwomgeving | Risico | De native build kan falen zonder toegang tot prebuilt binaries | Terugval op `node:sqlite` achter de `Db`-interface; WP-0 test beide op dag één |
| 4 | Definitie "actief lid" | Besluit | De spec definieert het voor de intensiteit niet | Gekoppeld lid met ≥ 1 voltooide, niet-afgekeurde sessie in de challengeweek (§6.2) |
| 5 | Gelijke stand in de ranglijst | Besluit | Een gedeelde eerste plaats vraagt een tweede gedekte hoofdprijs | Eerst intensiteit, dan gedeelde plaats; vooraf in de challengevoorwaarden |
| 6 | H1 is te omzeilen | Risico, geaccepteerd | Wie `navigator.webdriver` overschrijft, haalt een ongemarkeerde sessie; de e2e-suite legt dat vast | Plafonds, inverdienperiode, telefoonverificatie en vertraagde levering zijn de echte verdediging (spec §6.1, rapport 09 §3.3); boven 5% fraude gaan beloningen omlaag (businessplan §9) |
| 7 | Seedkennis bij trekkingen | Risico, jurist | Rewarded kent de seed vóór de deelname; commit-reveal bewijst alleen dat ze niet achteraf gekozen is | Vier ogen, auditregels, uitsluiting teamaccounts; externe beacon na de MVP; voorleggen in de advocatenopinie |
| 8 | Gebufferde logs zijn getuigenis van de client | Risico | Een gemanipuleerde client kan een dekkend log tot vijf minuten verzinnen | Begrensd tot gaten ≤ 5 min, boven 10% van de duur gemarkeerd (H3); kalibratie is een werkhypothese (spec open vraag 11) |
| 9 | Eén API-proces | Aanname | Rate limits, scheduler en sweep draaien in het geheugen van één proces | Jobs zijn idempotent via `job_run`; bij een tweede proces rate limits naar gedeelde opslag |
| 10 | iOS-gedrag in het veld | Aanname | Wake Lock en zichtbaarheid in de Home Screen-app vanaf iOS 18.4 komen uit compatibiliteitsdata (rapport 09 §3.1, C7); aandeel oudere iOS-versies onbekend | Handmatige toesteltest vóór R1; zonder Wake Lock eerlijke uitleg dat het scherm uit kan gaan |
| 11 | Zomertijd en dagrand | Risico, klein | De dagrand van 04:00 ligt in een wisselnacht anders | `Intl`-tijdzonedata en tests voor 29 maart en 25 oktober; in de pilot valt geen wissel |
| 12 | Bewaartermijn auditlog | Jurist | Niet in de spec | Twee jaar, vast te leggen in de DPIA |
| 13 | Leeftijdscontrole bij 18+-prijzen | Open (spec open vraag 8) | Controle zonder kopie van een identiteitsbewijs | Alleen uitkomst, datum en beheerder opslaan; werkwijze besluiten vóór R3 |
| 14 | Cookiebepaling en IP-hash | Jurist (spec open vraag 14) | Valt de IP-hash eronder, dan vragen H2, H7, H10 en de referraluitsluiting mogelijk toestemming | Uitkomst afwachten; zonder die heuristieken stijgt het fraude-risico |
| 15 | Wrapper of volledig native | Open, na de pilot | Niet onderzocht of Screen Time-extensies en UsageStats-verwerking in een wrapper passen | Uitzoeken bij de planning van trede 2 (hoofdstuk 13) |
| 16 | Tijdpad | Risico | Twaalf werkpakketten in vier weken met twee à drie ontwikkelaars (spec open vraag 2) | Vlaggen en de schrapvolgorde van spec §8 zijn de buffer; uiterlijk 25 november melden aan de founder of R1 op 2 december haalbaar is |
