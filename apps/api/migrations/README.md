# Migraties

Platte SQL-bestanden, zonder ORM, toegepast door `apps/api/src/db/migrate.ts` (`pnpm db:migrate`, en bij elke start van de API).

- Bestandsnaam: `NNNN_korte_naam.sql` (vier cijfers, kleine letters en `_`). Andere `.sql`-namen geven een fout.
- Elk bestand draait in één transactie en wordt vastgelegd in `schema_migration` met een SHA-256-checksum.
- Een toegepaste migratie wijzig je nooit; de runner weigert een gewijzigde checksum. Schrijf een nieuwe migratie.
- Een foreign key wijst altijd naar een tabel uit dezelfde of een eerdere reeks.

## Nummerreeksen per werkpakket (architectuur §12.3)

| Reeks | Eigenaar | Tabellen |
|---|---|---|
| `0001–0079` | WP-3 API-basis | `user`, `auth_magic_link`, `auth_daily_stat`, `auth_session`, `admin`, `admin_mfa`, `device`, `invite`, `waitlist_entry`, `audit_log`, `event`, `event_pending`, `job_run`, `idempotency_record`, `feature_flag`, `param_set`, `vacation_pause`, `outage`, `experiment_assignment`, `arm_switch` |
| `0080–0099` | WP-6 Fraude en beheer | `fraud_flag`, `appeal` |
| `0100–0199` | WP-4 Sessies en punten | `focus_session`, `session_heartbeat`, `visibility_event`, `session_summary`, `user_day`, `ledger_account`, `ledger_account_owner`, `journal_entry`, `posting`, `partner`, `partner_budget`, `budget_allocation`, `reward`, `reward_voucher`, `redemption`, `phone_verification` |
| `0200–0299` | WP-5 Sociaal | `squad`, `squad_membership`, `squad_day`, `duel`, `club`, `club_board_member`, `club_membership`, `challenge`, `challenge_enrollment`, `challenge_score`, `belofte`, `belofte_offer`, `card`, `referral`, `reminder_log` |
| `0300–0399` | WP-6 Trekkingen en privacy | `fraud_flag_session`, `blocked_phone_hash`, `prize`, `prize_delivery_contact`, `draw_game`, `draw`, `draw_opt_in`, `draw_entry`, `support_ticket` |

WP-0 levert nog geen migraties; alleen de tabel `schema_migration` van de runner zelf bestaat.
