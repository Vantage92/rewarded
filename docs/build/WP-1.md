# WP-1 — Core-regie, parameters, tijd en de typen van sessie en grootboek

*Bouwrapport, 5 november 2026.*

## Wat af is

- **Parameterset v1** (`packages/core/src/params/`): `schema.ts` (zod, strikte objecten, consistentieregels zoals gelijke weekmaxima arm A/B volgens JS2, standaarddoel in de opties, geen geld op niveau 1), `v1.ts` (alle waarden met bronparagraaf), `index.ts` (`PARAMS_V1` gevalideerd en diep bevroren, `parseParams`, `paramsByVersion`, `levelParams` per verificatieniveau, `maxSessionMin`, `dayCloseOffsetMin`, kleine afgeleiden). Bevat elke parameter uit spec §5, plus `end_grace_min`, sweepmarge, netklassen (lege CIDR-lijst, open vraag 17), de drie hogere drempels H2/H7/H10 als `null` tot de red-teamdag, seizoen, vakantiepauze, rustperiode, H1–H11, S1–S4, steekproef, bestuur, beroep, ambassadeurs en de europlafonds per niveau.
- **Tijd** (`packages/core/src/time/`): eigen Europe/Amsterdam-rekenwerk volgens de EU-regel (zonder Intl, zodat client en server gelijk rekenen; in de test tegen Intl gecontroleerd voor elk uur van 2026–2028), focusdag 04:00, `focusDayStart/End`, `closeAt` (05:45, ook in beide zomertijdnachten), weeksleutel (maandag) met weken van 167 en 169 uur, `monthKeyOf`, nachtregel, lokale vensters, seizoen/vakantie/rustperiode, dagrekenen, werkdagen, `Clock` en `FixedClock`.
- **Core-typen**: `session/types.ts` (PlannedMin, SessionStatus, AbortReason, ReviewStatus, ClosedBy, RestoreReason, SessionState, machine-eventnamen, Heartbeat, VisibilityEvent, EndReport, OutageWindow, SessionHeader, EvaluateSessionInput, SessionMetrics, SessionVerdict/Verdict) en `ledger/types.ts` (rekeningsoorten, AccountRef, RuleId met `RULE_ACCOUNTS` uit tabel 5.1, Cause, PostingDraft, JournalEntryDraft, Entry, Posting, Balances, UserDay, DaySession, BookedDay, ReconcileDayInput/Result, armen).
- **Service-interfaces met fakes**: `apps/api/src/services/{ledger,userDay,sessions}.ts`. Fakes dwingen af: nul-som, unieke idempotentiesleutels (zelfde inhoud = "al gedaan", andere inhoud = `KEY_CONFLICT`), toegestane rekeningen per regel, redencode bij `adjust`/`expire`, unieke (gebruiker, dag) met oplopende `rev`, daglimiet 300, één actieve sessie per gebruiker, oefensessie ⇔ 1 minuut, focusdag en nachtregel uit `server_start_at`, aborted → completed alleen via `restore`.
- **Lintregels voor core**: `packages/core/.oxlintrc.json` (genest, erft de root) verbiedt Node-built-ins, `node:*`, UI/HTTP/opslag/contracts-imports, DOM-globals, timers, `performance`, `crypto`, `Date.now()` en `Math.random()` in `packages/core/src`. Getest met een test die oxlint op probe-bestanden draait.

## Verificatie

- `pnpm -F @rewarded/core test`: 4 testbestanden + WP-0-test, 244 tests groen.
- `pnpm typecheck`: core, contracts, api en web groen.
- `npx vitest run --project api`: 60 tests groen (waarvan 22 voor de fakes).
- `npx oxlint --deny-warnings packages/core apps/api`: schoon.
- `pnpm test` (hele repo op het moment van draaien): 20 bestanden, 357 tests groen.

## Niet gedaan

- `core/experiments` (architectuur §12.1 rekent het tot WP-1, de opdracht niet): niet gebouwd; de parameters ervoor staan wel in v1.
- `session/index.ts` en `ledger/index.ts` (eigendom WP-4) exporteren de typen nog niet; zie interface-notities.

## Interface-notities

- `packages/core/package.json`: script `"test": "vitest run"` toegevoegd, anders doet `pnpm -F @rewarded/core test` niets.
- Core-typen zijn niet via `@rewarded/core/session` of `@rewarded/core/ledger` bereikbaar zolang WP-4 in die `index.ts` geen `export * from './types.ts'` zet. De services importeren daarom tijdelijk relatief (`../../../../packages/core/src/...`).
- `apps/api/src/services/index.ts` (`Services`) is niet aangepast; de eigenaar moet `ledger`, `userDays` en `sessions` toevoegen.
- Uitbreidingen op de signaturen uit §12.2 (achterwaarts te gebruiken): `LedgerService.post` geeft `{ entry, created }`; `PostArgs` is vastgelegd; `UserDayRepository.put(tx, row)` toegevoegd (de architectuur zegt dat `user_day` alleen via de repository geschreven wordt); `SessionRepository.get(id)` toegevoegd; `restore` geeft `{ restored, session }`; `finalMinutes` geeft per dag een rij in plaats van één getal. `ReconcileDayInput` heeft extra `userId` en `week` (nodig voor de sleutels). `Tx` = `Db` binnen `db.transaction`.
- `RULE_ACCOUNTS.expire` laat beide richtingen toe, omdat een negatief saldo (spec §4.2) bij verwijdering ook op nul moet.
- Met de geneste config geldt de core-override in de root-`.oxlintrc.json` (WP-0) niet meer voor core; de geneste config is nu de bron.

## Tegenspraak in de documenten

- Architectuur §12.1 noemt "Parameterset v2" en rekent `experiments` tot WP-1; de opdracht noemt v1 en geeft `experiments` niet in eigendom. Versie 1 aangehouden.
- Spec §7.1 noemt 04:00 voor `daily_goal_met`/`squad_day_evaluated`; architectuur §6.1 zet de dagafsluiting op 05:45. `closeAt` volgt de architectuur, de focusdag blijft 04:00 (geen strijd met productplan §10).
- Spec §4.6 geeft voor het aanloopklassement alleen "tot de vakantiepauze"; `warmup_until` = 2026-12-20 is daaruit afgeleid.
- `month_key`: architectuur §5.2 zegt kalendermaand in Europe/Amsterdam (niet de focusdag). Zo gebouwd; om 02:00 op de 1e valt een verzilvering dus in de nieuwe maand, terwijl de focusdag nog de vorige is.

## Bekende problemen

- `h2/h7/h10_shared_threshold` zijn `null` tot de red-teamdag; WP-6 moet dat als blokkade voor de release behandelen.
- `addWorkdays` kent geen feestdagen.
- De lintregel kan `new Date()` zonder argument (leest de klok) niet onderscheiden van `new Date(x)`; dat moet in review gecontroleerd worden.
- Weekvrijgave, armen en drempels zijn werkhypothesen uit de spec; wijziging = nieuwe parameterversie.
