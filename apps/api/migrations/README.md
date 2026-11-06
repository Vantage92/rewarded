# Migraties

Platte SQL-bestanden, zonder ORM, toegepast door `apps/api/src/db/migrate.ts` (`pnpm db:migrate`, en bij elke start van de API).

- Bestandsnaam: `NNNN_korte_naam.sql` (vier cijfers, kleine letters en `_`). Andere `.sql`-namen geven een fout.
- Elk bestand draait in één transactie en wordt vastgelegd in `schema_migration` met een SHA-256-checksum.
- Een toegepaste migratie wijzig je nooit; de runner weigert een gewijzigde checksum. Schrijf een nieuwe migratie.
- Een foreign key wijst altijd naar een tabel uit dezelfde of een eerdere reeks.

## Nummerreeksen per werkpakket (architectuur §12.3)

| Reeks | Eigenaar | Tabellen |
|---|---|---|
| `0001–0079` | WP-3 API-basis (integratie: `0010_user_round3` met `rest_arm_fixed`, `rest_exit_source` en nieuwe redenen in `arm_switch`) | `user`, `auth_magic_link`, `auth_daily_stat`, `auth_session`, `admin`, `admin_mfa`, `device`, `invite`, `waitlist_entry`, `audit_log`, `event`, `event_pending`, `job_run`, `idempotency_record`, `feature_flag`, `param_set`, `vacation_pause`, `outage`, `experiment_assignment`, `arm_switch` |
| `0080–0099` | WP-6 Fraude en beheer | `fraud_flag`, `appeal` |
| `0100–0199` | WP-4 Sessies en punten (integratie: `0130_session_seq_offset`) | `focus_session`, `session_heartbeat`, `visibility_event`, `session_summary`, `user_day`, `ledger_account`, `ledger_account_owner`, `journal_entry`, `posting`, `partner`, `partner_budget`, `budget_allocation`, `reward`, `reward_voucher`, `redemption`, `phone_verification` |
| `0200–0299` | WP-5 Sociaal (integratie: `0210_exam_calendar_round3` met `is_default`, `a_resit_days` en het aprilledental; `0211_default_calendar`) | `exam_calendar`, `squad`, `squad_membership`, `squad_day`, `duel`, `club`, `club_board_member`, `club_membership`, `challenge`, `challenge_enrollment`, `challenge_score`, `belofte`, `belofte_offer`, `card`, `referral`, `reminder_log` |
| `0300–0399` | WP-6 Trekkingen en privacy | `fraud_flag_session`, `blocked_phone_hash`, `blocked_institution_hash`, `prize`, `prize_delivery_contact`, `support_ticket` (geen trekkingstabellen: productplan §0c.3) |

`POST /dev/reset` leegt alle tabellen en zet daarna de datarijen van de migraties terug (systeemrekeningen uit 0110, standaardkalender uit 0211; `src/db/migration-rows.ts`).
