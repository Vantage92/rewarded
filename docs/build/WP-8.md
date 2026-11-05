# WP-8 Web focus-engine, onboarding en wachtlijst — bouwrapport

*5 november 2026. Eigenaar: WP-8. Bronnen: spec §3.1–3.3, §4.1, §8; UX §3.2, §3.3, §4.1–4.3, §6; architectuur §4, §9, §11; productplan §4.*

## Wat af is

**Platform-adapters** (`apps/web/src/platform/`, architectuur §9.5):

| Bestand | Wat het doet |
|---|---|
| `clock.ts` | Monotone klok (`performance.now()`) voor elke duur, wandklok alleen voor `client_ts`, en een `Timers`-interface. |
| `visibility.ts` | `visibilitychange`, `pagehide`/`pageshow` (met `persisted`), `blur`/`focus` met monotone tijd, en het navigatietype (`reload`). |
| `wakelock.ts` | Aanvraag bij de start en na elke terugkeer naar `visible`. Bij vrijgave terwijl de pagina zichtbaar is: status `released` en elke 10 s een nieuwe poging. De status is `acquired`, `denied`, `released` of `unsupported`. |
| `tabLock.ts` | Web Locks (`rw-session-owner`) met een `BroadcastChannel`. Zonder Web Locks volgt een handdruk over het kanaal. |
| `storage.ts` | IndexedDB met de stores `device`, `active_session`, `outbox` en `cache`. Er is een geheugenvariant als terugval en voor tests, plus `navigator.storage.persist()` na de eerste voltooide sessie. |
| `outbox.ts` | Gebeurtenissen en gebufferde heartbeats per sessie, op volgorde en persistent. Verwijderd wordt precies wat bevestigd is. |
| `transport.ts` | Herhalingen met 1, 2, 4 en 8 s, daarna elke 10 s, en offline na drie mislukte pogingen (core `retry.ts`). Een API-fout is een definitief antwoord; `RATE_LIMITED`, `INTERNAL` en `MAINTENANCE` worden herhaald. Verder `kick()`, `cancel()` en UUID's als Idempotency-Key. |
| `beacon.ts` | `sendBeacon` met het CSRF-token in de body; terugval `fetch(..., { keepalive: true })`. |
| `device.ts` | `ua_class` volgens de enum van contracts, `standalone` en `webdriver`. |
| `signal.ts` | Eindtoon via een AudioContext die bij de tik op [Begin] wordt ontgrendeld, plus een trilling. |
| `testHooks.ts` | `window.__rwTest` met `setVisibility`, een nep-Wake Lock (`setMode`, `release`, `state`) en een snapshot van de sessie. De hooks gaan alleen aan in een dev- of testbuild met `window.__RW_TEST__ = true`. De productiebundel bevat ze niet: `grep __rwTest dist/assets/*` geeft 0. |

**Sessie-store** (`features/focus/session/store.ts`, met `context.tsx` voor `useSyncExternalStore`). De store draait op de reducer van `core/session/machine.ts` en voert de effecten uit:

- **Start:** tab-lock, `client_device_id` en `device_id` per gebruiker, en `POST /sessions`. De Idempotency-Key wordt eerst bewaard. `resumed` wordt herkend.
- **Heartbeats** elke 30 s. Een nieuwe `seq` gaat pas uit na een antwoord. Zolang er een open verzoek is, komen de waarnemingen als gebufferde heartbeats in de outbox. Na herstel komt eerst de herhaling, dan `seq + 1` met de outbox.
- **Offline:** `GAP_LIMIT` na 5 minuten zonder bevestiging, met een eigen timer. De afbreking verschijnt meteen op het scherm, als lokale inschatting gemarkeerd. Het openstaande verzoek haalt daarna de uitspraak van de server op.
- **`hidden`/`pagehide`:** de beacon gaat direct; bij terugkeer volgen `return_after_abort` en het ophalen van de uitspraak.
- **Herladen:** een `beforeunload`-waarschuwing. Na het herladen herstelt de store de sessie uit IndexedDB. De `pagehide` gaat alsnog mee, ook als de IndexedDB-schrijfactie niet af was: daarvoor staat er een synchrone markering in `sessionStorage`.
- **Einde en stoppen:** het einde met het eindsignaal en `signal_played`, de eerste aanraking (`first_interaction_after_end` voor H9), en het scherm nog 10 minuten aan. Stoppen gaat met bevestiging. `SESSION_CLOSED` krijgt de uitspraak uit `details.verdict`, `NONCE_INVALID` een hervatting op hetzelfde toestel.
- **Client-events:** `wakelock_state`, `signal_played`, `return_after_abort` en `abort_recovery`.
- **Service worker:** `canActivateUpdate()` voor de `canActivate` van `sw-register.ts`.

**Focusschermen** (`features/focus/`):

| Scherm | Inhoud |
|---|---|
| F1 Vandaag (index-route) | Dagdoelring en week uit `/me/today`, squadaanwezigheid via een poll van 30 s, duurkeuze 25/50/90 met de laatst gekozen duur, nachtregel en dagrandregel, en een banner na een afbreking. |
| F2 `/focus` | Eenmalige checklist, schakelaar voor de toon, waarschuwing zonder Wake Lock en [Begin]. |
| F3 | Donker scherm met resterende tijd (minuten, seconden pas in de laatste minuut) en een dunne ring. De hint "Leg je telefoon omgekeerd neer" staat 5 s groot, daarna klein. Verder stippen voor squadleden die focussen, de Wake Lock-status met "Tik om aan te houden", een offline-icoon en na 90 s de offline-regel. Er staan geen punten in beeld. |
| F4 | Stoppen met bevestiging; [Doorgaan] is primair. |
| F3e | Wit eindscherm "Sessie klaar." / "Draai je telefoon om." |
| F5 | Eerst het dagdoel en de week, dan de squadstreak, dan klein de punten (of "wordt nagekeken"), het puntenplafond, het nachtsignaal en de inverdienbalk. In de modus zonder punten verdwijnt het puntenblok. |
| F6 | Tijdstip in Europe/Amsterdam en de volgehouden minuten. De copy per vaste code staat in UX §6.2. Daaronder [Opnieuw beginnen] en [Kortere sessie] (na 50 of 90). "Klopt dit niet?" is een knop bij `heartbeat_gap` en `late_end`, anders een tekstlink. Bij de derde afbreking op een dag staat er een voorstel. |
| F7 | Sheet per code met keuzes en `POST /sessions/:id/report`. Bij `ALREADY_REPORTED` toont de sheet de status. |
| F9 `/hoe-we-tellen` | Uitleg en de oefensessie. |
| Ander tabblad | "Je sessie loopt in een ander tabblad", zonder start en zonder heartbeats. |

**Onboarding** (`features/onboarding/`). De eerste drie schermen hebben de kale chrome.

- **O1** `/welkom`, `/i/:token`, `/onboarding`: uitnodiger via `invites.preview`, belofte, eerlijke claim, de regel over beloning, de zichtbaarheidsregel bij een squadlink en 16+. Een verlopen link geeft een eigen melding. Zonder uitnodiging verwijst het scherm naar de wachtlijst. In een in-app browser staat een regel over de eigen browser.
- **O2:** de claim.
- **O3** `/onboarding/email` en `/login`: magic link aanvragen met de uitnodiging.
- **O4** `/auth/check-inbox`: code van 6 cijfers met `inputmode="numeric"` en `autocomplete="one-time-code"`. Opnieuw sturen kan na 30 s, met de reden naast de knop.
- **`/auth/bevestig#t=…`:** het token komt uit het fragment en wordt pas verbruikt bij de tik op "Inloggen".
- **O5:** drie velden. Onder 16 eerst een bevestiging; daarna O5b en is er niets bewaard. De geboortedatum staat alleen in het geheugen.
- **O5a:** stille modus voor 16_17.
- **O6:** pilot- en onderzoeksuitleg, signalen, en twee aparte vinkjes die niet vooraf aanstaan. [Akkoord] heeft de reden ernaast.
- **O7:** dagdoel 25/50/90/120 met de overmoedrem via `needsOverreachConfirm` uit core. Daarna `POST /onboarding` en `invites.accept` als er een token is.
- **O8:** tip "Niet storen" per platform, met de grens van 5 minuten.
- **O9:** oefensessie van 1 minuut via hetzelfde protocol, met het label "Oefening".
- **O10:** eerste sessie.

**Wachtlijst** (`features/waitlist/`): `/wachtlijst` en `/wachtlijst/groep/:token`.

- **Hero per arm:** F ("Telefoon weg. Squad aan.") of G ("Word beloond voor je focusuren." met "Geen geld. Punten voor partnerbeloningen." direct in beeld). De rest van de pagina is gelijk.
- **A/B-hook** (`hook.ts`): 50/50 per bezoeker en vast voor herhaalbezoeken. `?hook=F|G` is voor QA en tests. Verder UTM, `?bron=` voor de bron, en een `HookReporter`-naad voor blootstelling en aanmelding.
- **Formulier:** e-mail, vereniging (optioneel) en toestemming. De aanmelding gaat met Idempotency-Key en `consent_version` `privacy-0.3`, en met een `group_token` bij een groepslink.

**i18n:** `i18n/{nl,en}/{focus,onboarding,waitlist}.json`. `lint:i18n` geeft 0 meldingen; er staat geen "bewezen" of "win" in. "Geverifieerd" uit rapport 04 is vervangen, zie de tegenspraak hieronder.

## Verificatie

- **`pnpm -F @rewarded/web typecheck`:** groen.
- **`npx tsc -p tsconfig.json`** (root, met e2e): groen.
- **`pnpm -F @rewarded/web test`:** 17 bestanden, 324 tests, waarvan 321 groen. Mijn drie bestanden (44 tests) zijn allemaal groen:
  - `test/wp8-store.test.ts` (12): voltooid met de klok vooruit, hidden na 12 minuten, 3 minuten offline (H3), 6 minuten offline, twee gedropte heartbeat-antwoorden, gedropte start, end en stop, herladen (ook met een verloren IndexedDB-schrijfactie), tweede tabblad, Wake Lock-herhaling en oefensessie;
  - `test/wp8-components.test.tsx` (23): het afbreekscherm per code (alle vijf), de meldsheet, de derde afbreking, de onbevestigde uitspraak, de oefening, de overmoedrem (25/50 direct, 90/120 met de sheet, "Kies 25", geen rem na 7 dagen), inloggen met code, de 30 s voor opnieuw sturen, het token uit het fragment, de leeftijd onder 16 met O5b, en de wachtlijsthook met de aanmelding;
  - `test/wp8-platform.test.ts` (9): backoffschema, definitieve API-fout, kick en cancel, de outbox na herladen, Wake Lock, test-hooks en `ua_class`.
- **De 3 rode tests** staan in `test/shell.test.tsx` en horen bij andere pakketten: `/kans` (draws), en `/bestuur` en `/beheer` (de namespaces `board:` en `admin:` ontbreken nog). De placeholdertests van WP-0 voor mijn routes (`/`, `/wachtlijst`, `/onboarding/start`, `/focus`, `/login` en de shell-placeholders) blijven groen, en axe op `/` en `/login` ook.
- **`npx playwright test -c e2e/focus/playwright.config.ts`:** 15 van 15 groen, twee keer achter elkaar. De specs zijn:
  - voltooid met de klok vooruit (met H1 door de standaard `webdriver`), en ongemarkeerd met `webdriver=false`;
  - stoppen met bevestiging;
  - hidden na 12 minuten;
  - Wake Lock-vrijgave en een nieuwe aanvraag;
  - 3 minuten offline (voltooid, H3) en 6 minuten offline (lokaal direct afgebroken, daarna `heartbeat_gap` van de server);
  - herladen (`beforeunload`, daarna hidden);
  - tweede tabblad;
  - gedropte antwoorden op start, twee heartbeats, end en stop;
  - inloggen met code door de onboarding, en de oefensessie.
- **`npx playwright test -c e2e/playwright.config.ts`** (root, met de echte API en `shell.spec`): 16 van 16 groen.
- **`pnpm -F @rewarded/web build`:** geslaagd. De hoofdbundel is boven 500 kB; die waarschuwing bestond al (WP-7).
- **`npx oxlint --deny-warnings`** op mijn mappen en tests: 0 meldingen. **`pnpm -F @rewarded/web lint:i18n`:** 0.

## Tegenspraak in de documenten

1. **"Geverifieerd" op de wachtlijst.** Rapport 04 §9 (blok 2 en 3) gebruikt "Geverifieerd" en "geverifieerde focus". Het productplan (§4, bestuursdashboard en boodschap) gebruikt "focustijd die telde" en weert "geverifieerd". Het productplan gaat voor: de copy zegt "focustijd die telt".
2. **"Ongewijzigd" herhalen.** Architectuur §4.7 zegt dat een openstaand verzoek ongewijzigd herhaald wordt. De verifier (§4.3 stap 3, core `gapCovered`) vergelijkt de monotone tijd van een contact met de ontvangsttijd van dat contact (5 s tolerantie). Een heartbeat die na 3 minuten offline met de oude `mono_ms` aankomt, maakt van elk gedekt gat een `heartbeat_gap`. Ik herhaal daarom met dezelfde nonce, `seq` en meegestuurde items; alleen `mono_ms`, `client_ts`, zichtbaarheid en Wake Lock worden per poging ververst, en items die sindsdien in de outbox kwamen gaan mee. Bij een einde dat na een verbindingsverlies herhaald wordt, geldt hetzelfde voor de klokvelden. De server herkent een herhaling alleen op (nonce, `seq`) (`classifyHeartbeat`), dus de idempotentie blijft staan. Na herstel stuurt de client de items opnieuw mee met `seq + 1`, omdat een herhaling uit de cache haar body niet leest.
3. **Stoppen tijdens offline.** De machine uit core negeert `USER_STOP` in `running_offline`, terwijl UX F3/F4 de knop Stoppen altijd toont. De store zet de stop in de wachtrij en verstuurt die bij `NET_BACK`; het scherm zegt "Je sessie stopt zodra er weer verbinding is". `SERVER_ABORT` in `running_offline` wordt ook genegeerd; de store stuurt eerst `NET_BACK`.
4. **`localStorage`.** Architectuur §9.3 staat het alleen toe voor taal en laatste tabblad. Rapport 04 §6 wil de arm van de hooktest "vast voor herhaalbezoeken". De arm staat daarom in `localStorage` (met try/catch). De checklistvlag en de laatst gekozen duur staan in de IndexedDB-store `cache`.
5. **Voornaam bij O3.** UX O3 vraagt voornaam en e-mail, maar `MagicLinkRequest` heeft geen naam. De naam staat in `sessionStorage` en wordt bij O5 opnieuw gevraagd als de link in een andere browsercontext opent.
6. **Keuzelijst in F7.** UX §4.3 heeft een keuzelijst, maar `SessionReportRequest` kent alleen vrije tekst. De keuze gaat als vaste prefix mee (`[wifi] …`). Daardoor schrijft de server bij `abort_report_submitted` altijd `met_tekst`.
7. **Eigenaar van `/`.** WP-0 noemde WP-9, het WP-7-rapport WP-8 (F1). Ik heb de index-route genomen.

## Interface-notities

- **Bevroren lagen:** niets gewijzigd in `packages/core`, `packages/contracts` of `apps/api/src/services`.
- **Tests:** de testbestanden staan als nieuwe bestanden in `apps/web/test/wp8-*.ts(x)`, omdat de Vitest-config van web alleen `test/**` draait. Bestaande tests zijn niet aangeraakt.
- **De fake-API** (`e2e/focus/fake-api.ts`) importeert `core/session` (de echte verifier en de retry-regels) en `contracts/routes` via relatieve paden. Dat wijkt af van architectuur §2 ("e2e importeert geen productcode"), maar zo volgt de fake hetzelfde protocol als de server. Ook de store-tests in web gebruiken de fake.
- **Playwright:** `e2e/focus/playwright.config.ts` start alleen vite op poort 5174. De API zit achter `page.route`. De root-config pikt dezelfde specs ook op. Server- en browsertijd lopen gelijk via `page.clock` (gepauzeerd) en de monotone klok van de pagina.
- **Beacon:** `Content-Type: application/json` in een Blob, omdat de API geen `text/plain` parseert. Chromium laat een `sendBeacon` niet door `page.route` lopen. Met de fake gaat hij daarom naar de vite-proxy (ECONNREFUSED in de log, onschadelijk); de store haalt de uitspraak bij terugkeer zelf op.
- **Voor de orchestrator:** `main.tsx` registreert de service worker nog zonder `sw-register.ts`. De koppeling is `registerServiceWorker({ canActivate: canActivateUpdate })` met `canActivateUpdate` uit `features/focus/session/context.tsx`.
- **`setSessionUser(id)`** in de focuscontext bepaalt per gebruiker de cachesleutel van het `device_id`.

## Niet gedaan

- **F1:**
  - jokerstatus;
  - de link "Vandaag heb ik een tentamen" (F10);
  - de Bonusregel per arm;
  - de kaarten voor Belofte, schadesignaal, vragenlijst en squadprompt.

  Die componenten horen bij WP-9 (punten, squads, belofte en survey). F1 laat ze nu weg.
- **O6b** instroomvragenlijst (survey, WP-9): de onboarding slaat haar nu over.
- **O10 [Later vandaag]** met tijdkeuze en `reminder_scheduled`: er is geen herinneringsflow (WP-9). De knop gaat naar Vandaag.
- **De wachtlijstsurvey** op de bevestigingspagina (uurloon, "deze week op"): contracts hebben geen route ervoor.
- **Registratie van de wachtlijstarm:** contracts kennen geen veld voor `hook_arm` en `utm` op `POST /waitlist` en geen event voor de blootstelling. De `HookReporter` doet daarom nog niets, en de primaire maat (aanmeldingen per bezoeker per arm) is nog niet te meten. WP-2 en WP-3 moeten dat toevoegen, met toestemming voor de opslag per bezoeker (open vraag jurist, rapport 04 §6).
- **`c/:code`** (verenigingscode): de placeholder van WP-7 blijft staan.
- **Feature-mocks** (`features/*/mock.ts`) voor `?api=mock`: in de mockmodus geven de sessieroutes alleen statische voorbeelden.
- **WebKit-project en de handmatige toesteltest** (iPhone met Safari en Home Screen-app, twee Android-toestellen; `e2e/MANUAL.md`): niet gedaan. De browser zit niet in de cache en de test is handwerk. Dit staat als acceptatiecriterium van WP-8 in architectuur §9.5.

## Wat echte integratie nog vraagt

- **De specs tegen `apps/api`:** zonder `page.route`, met `POST /dev/clock` in de stap van `advance()`, de inlogcode uit `GET /dev/inbox` en een API-proces per worker (WP-11). De nonces, de limiet van 2 heartbeats per 20 s en de sweep moeten dan op de dev-klok lopen.
- **Een fout in WP-4 bij `resume`:** `sessions.start` zet `last_seq` bij een hervatting op 0, maar de primaire sleutel van `session_heartbeat` is (`session_id`, `seq`, `kind`). De online heartbeats 1…n na een hervatting vallen weg door `INSERT OR IGNORE` en tellen dan niet als contact. WP-4 moet `seq` laten doorlopen of de sleutel aanpassen.
- **Beacon:** de echte API moet de beacon met de CSRF in de body accepteren (`BODY_TOKEN_PATHS` bestaat) en `application/json` uit `sendBeacon` lezen.

## Bekende problemen

- De e2e-specs testen de webapp tegen een fake met de echte verifier, niet tegen de echte API.
- Een hervatte sessie na herladen tijdens `starting` gebruikt de wandklok om de resterende tijd te tonen. De punten raakt dat niet.
- Het tijdstip "stopte om" van een lokale inschatting komt uit de monotone tijd. Na de bevestiging toont het scherm de servertijd.
- 3 tests in `test/shell.test.tsx` van andere pakketten zijn rood (zie verificatie).
