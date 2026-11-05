# WP-2 — Contracts, foutcodes, eventtaxonomie, API-client en service-interfaces

*Stand: 5 november 2026. Bouwer WP-2. Niet gecommit; dat doet de orchestrator.*

## Wat af is

- **Routeregister** (`packages/contracts/src/routes.ts`): alle 134 endpoints uit architectuur §8.2 (129 in het hoofdregister, 5 dev-routes apart) als `RouteDef` met methode, pad, autorisatie, zod-schema's voor path-params, query, body en response, successtatus, foutcodes, `Idempotency-Key` en specverwijzing. De vijf dev-routes staan apart in `@rewarded/contracts/dev`, zodat de productiebundel ze niet bevat (§10.3).
- **Schema's per module** in `packages/contracts/src/<module>.ts` (auth, waitlist, sessions, points, phone, catalog, redemptions, invites, squads, duels, clubs, leaderboards, challenges, belofte, cards, referral, reminders, surveys, events, fraud, privacy, kpi, support, admin, dev, draws leeg). Alle objecten zijn `strictObject`; per schema een afgeleid type.
- **Foutcodes** (`errors.ts`): alle 83 codes uit §8.3 plus `CODE_INVALID` (84), elk met precies één eigenaarsmodule en HTTP-status; `messageKey()` geeft `errors.<module>.<code>`; `errorBody()`, `ApiErrorBodySchema` en `DomainError`.
- **Eventtaxonomie** (`events.ts`): 89 namen, alle events uit spec §7.1 plus `signal_played`, `reminder_scheduled`, `reminder_settings_changed`, `reminder_sent`, `reminder_opened`, `belofte_witness_viewed` en `draw_opt_out` (retired). Per event bron (server/client), strikt props-schema en specverwijzing. `ClientEventRequest` voor `POST /events` neemt alleen actieve client-events aan.
- **API-client** (`client.ts`): `createApiClient({ fetch, csrfToken })` met getypeerde `call(routeId, { params, query, body, idempotencyKey })`. Hij valideert requests en responses en zet fouten om in `ApiClientError` met `is(code)`.
- **Mock-client** (`mock.ts`, `examples.ts`): `createMockApiClient(handlers)` valideert elk request en elke response tegen de contracts en antwoordt standaard met voorbeelden voor de studentenflows. `mockError(code)` geeft het juiste contractfoutantwoord.
- **Service-interfaces met fakes** (`apps/api/src/services/`): `AuditWriter`, `EventWriter`, `ExperimentService`, `FlagService`, `PrizeService` en `PrivacyService`, plus het type `Services`, `createServices(overrides)` en `createFakeServices()`. De fakes dwingen de invarianten af: vier ogen bij blokkade en bij het stoppen van arm B, geen besluit zonder beheerder, europlafonds voor prijzen, leeftijdscontrole bij 18+, uitzonderingen voor minderjarigen en afmelders, een append-only audit, en events alleen uit de taxonomie.
- **Platform** (`apps/api/src/platform/{log,net,beacon,ports}.ts`): `Logger` met allowlist (`sanitizeLogFields`, `JsonLineLogger`, `MemoryLogger`), `NetClassifier` (`CidrNetClassifier` voor IPv4 en IPv6 met de langste prefix, `DevNetClassifier`) en `Beacon` (`DevBeacon`, `UnconfiguredBeacon`), geëxporteerd via een eigen index `ports.ts`.

## Verificatie

- `pnpm -F @rewarded/contracts test`: 4 bestanden, 33 tests, groen.
- `pnpm test` (hele workspace): 22 bestanden, 375 tests, groen, inclusief de productiebundeltest.
- `pnpm typecheck`: groen voor core, contracts, api en web. `pnpm lint`: groen.

De tests dragen de specparagraaf in hun naam. Ze controleren:

- dat het register exact de endpoints uit §8.2 bevat, met een handgeschreven lijst in `test/endpoints.ts`;
- met een schema-walker dat elk object in params, query, body en response onbekende velden weigert;
- dat voorbeelden slagen en mét een extra veld falen;
- `practice ⇔ planned_min = 1`;
- de foutcodes tegen de tabel in §8.3, met hun HTTP-klasse en een eigenaar per code;
- dat elke code aan minstens één route hangt;
- de taxonomie tegen spec §7.1 en de UX-toevoegingen;
- de client, de mock, de fakes, de log-allowlist en de netklassen.

## Tegenspraak tussen documenten (en wat ik koos)

1. **`CODE_INVALID`** staat in §8.2 (inlogcode, telefoon, instellingsmail, verenigingscode) maar ontbreekt in §8.3. Ik heb de code toegevoegd: eigenaar `auth`, status 422.
2. **Heartbeat-body**: §8.2 zegt `events: VisibilityEvent[]`, §4.2 zegt dat ook gebufferde heartbeats meegaan. Ik koos §4.2. Heartbeats, de beacon-batch en het einde gebruiken dezelfde `OutboxItem`-union (`type: visibility | heartbeat`).
3. **`draw_opt_out`** (UX) tegenover het productplan §0.3, waarin trekkingen niet gebouwd worden. Het productplan gaat voor: het event staat als `retired` in de taxonomie, wordt nooit geaccepteerd en de naam blijft gereserveerd.
4. **`signal_played`**: UX noemt het een eigenschap van `session_completed`, de opdracht een event. Ik deed beide: een client-event en een optionele eigenschap. `session_aborted` kreeg `device_class` en `wakelock_state` (UX §7 vraag 10).
5. **`redemption_blocked.reden`**: spec §7.1 kent zes redenen, maar §8.2 heeft ook `FIRST_REDEEM_HOLD`, `PHONE_NOT_VERIFIED` en `REFERRAL_SHARE_EXCEEDED`. Ik heb `wachttijd`, `telefoon` en `referral_aandeel` toegevoegd.
6. **Eigenaarschap van services**: architectuur §12.1 en §12.2 leggen `services/{audit,events,experiments}` bij WP-3 en `services/{flags,prizes,privacy}` bij WP-6. De opdracht gaf de interfaces en fakes aan WP-2. De implementaties blijven bij WP-3 en WP-6.
7. **Contracts hangt af van core** voor typen zoals `AbortReason` (§2), maar core is nog een stub. De domeinunions staan nu als zod-enums in `contracts/common.ts`. Core kan ze later overnemen zonder dat het wire-formaat verandert.
8. **Gedeelde codes**: §12.3 noemt vier gedeelde codes in `errors/common`. Ik heb er ook `NOT_FOUND`, `FORBIDDEN`, `CSRF_INVALID`, `FEATURE_DISABLED`, `IDEMPOTENCY_CONFLICT` en `MAINTENANCE` neergezet, omdat die door middleware of meerdere modules komen. De eigenaar is WP-3.
9. **Logger**: §10.9 noemt `platform/logger.ts`, en dat pad ligt ook binnen WP-3. Om een botsing te voorkomen staat de interface in `platform/log.ts`.

## Keuzes waar de documenten niets vastleggen

**Modulekeuze voor routes zonder eigen stub:**

| Routes | Module |
|---|---|
| `/surveys/*` | nieuwe namespace `surveys` (WP-5) |
| dagdoel, tentamendagen, `/me/today` | `points` (WP-4) |
| instellingsmail | `fraud` (WP-6, het instellingsanker) |
| `/me/plus-interest` | `events` |
| `/admin/prizes`, welzijn, vakantiepauze, experimenten, feature-flags, ambassadeurs, audit | `admin` |
| beheerroutes van een domein | in dat domein (§8.2) |

**Paden en routes:**
- `POST …/decide` werd `POST /admin/clubs/:id/pending-links/decide`.
- `GET/POST/PATCH /admin/clubs[/:id]` werd vier routes.

**Waarden:**
- `ua_class` is een enum (`ios_safari`, `ios_webview`, `android_chrome`, `android_webview`, `desktop`, `other`).
- Dagdoel en Belofte-minuten zijn 25/50/90/120. Een Belofte heeft 3–7 dagen (spec §4.4, §4.12).
- Eventeigenschappen houden de Nederlandse namen uit spec §7.1. `abort_report_submitted.reden_gebruiker` legt alleen `met_tekst` of `zonder_tekst` vast, want vrije tekst hoort niet in events.

## Interface-notities

- `contracts/errors.ts`: `ApiErrorBody` is ongewijzigd. Nieuw zijn `DomainError`, `errorBody` en `messageKey`.
- `contracts/index.ts` exporteert de dev-routes niet meer; die importeer je uit `@rewarded/contracts/dev`. In `package.json` van contracts is het script `test` toegevoegd.
- `services/index.ts`: `createServices()` werkt nog zonder argumenten, dus `server.*.ts` en `test/helpers.ts` hoeven niet te veranderen. Het accepteert nu ook overrides. WP-4 voegt `ledger`, `userDay` en `sessions` toe met module-augmentatie van `Services` in een eigen bestand en geeft ze mee aan `createServices({...})`. Zo hoeft `index.ts` niet bewerkt te worden.
- `FlagService` heeft naast de signatuur uit §12.2 ook `confirmBlock`, `closeForDeletedAccount` en `get`. `PrizeService` heeft ook `proposeWinner` en `recordAgeCheck`. `PrivacyService` heeft ook `eraseUser`, `exportUser` en `registeredModules`. `ExperimentService` heeft ook `get`, `armsFor` en `switches`.
- De tests van de services en het platform staan als nieuwe bestanden in `apps/api/test/wp2-*.test.ts`, omdat de vitest-config van de API alleen `test/**` draait. Bestaande bestanden zijn niet aangeraakt.

## Bekende problemen en wat nog niet af is

- **Toewijzing in de fake**: `FakeExperimentService` wijst toe met een hash-placeholder. Die is niet gebalanceerd en vervangt `core/experiments` (WP-1) niet.
- **Rollback in de fake**: `FakeEventWriter` bootst een rollback alleen na met `mark`/`rollbackTo`. Echte transactiesemantiek komt van de implementatie van WP-3.
- **i18n**: de foutvertalingen (`i18n/<taal>/errors/<module>.json`) zijn van de API-pakketten en niet gemaakt. Er is ook geen test die per code de sleutel in het vertaalbestand zoekt, omdat die bestanden nog niet bestaan. WP-2 heeft geen UI-teksten.
- **Smalle beheerschema's**: §8.2 beschrijft ze maar vaag (budgetoverzicht, eerste verzilveringen, welzijnssamenvatting, KPI-tabel). De vorm is een redelijke keuze en moet door WP-6 en WP-10 bevestigd worden vóór de tag `contracts-v1`.
- **Beacon**: alleen de interface is er. Door het productplan wordt hij in de MVP niet gebruikt.
