# Review beveiliging, fraude en privacy

*Onafhankelijke review, 5 november 2026. Lens: auth en CSRF, idempotentie en nonce-keten, klok en gebufferde logs, dubbele verzilvering, autorisatie per route, dataminimalisatie, verwijdering en export, injectie, dev-routes, en of een websessie tot geld kan leiden. Ik heb de code gelezen en `pnpm verify` gedraaid (groen). Bevindingen 1 t/m 5 en 7 heb ik daarnaast met een tijdelijk probe-script tegen de echte app gecontroleerd (`wp6Harness`, alle modules en migraties). Het script heb ik daarna verwijderd. `pnpm e2e` heb ik niet gedraaid.*

## Bevindingen

### 1. Blocker: `POST /admin/mfa/verify` heeft geen rate limit, dus de tweede factor is te brute-forcen
- **Bestand:** `apps/api/src/modules/admin/index.ts:81-89`, `apps/api/src/middleware/rateLimit.ts:83`
- **Wat er fout is:** `RATE_LIMITS.mfaVerify` (5 per 15 minuten, architectuur §10.2) bestaat wel, maar wordt nergens gebruikt. Alleen de standaardlimiet van 60 per minuut geldt, en `verifyMfa` telt geen mislukte pogingen. Ik heb het getest met 40 foute codes achter elkaar: alle 40 gaven `MFA_INVALID` en geen enkele `RATE_LIMITED`. Wie de mailbox van een beheerder overneemt, kan dus ongeveer 86.000 codes per dag proberen. Bij een venster van ±1 stap is de kans op een treffer dan ruim 20% per dag. Daarmee is §10.8 ("wie alleen de mailbox overneemt, heeft nog geen beheerrechten") niet waar.
- **Fix:** geef de mount `{ allowWithoutMfa: true, rateLimits: [RATE_LIMITS.mfaVerify] }`. Leg mislukte pogingen ook vast in `admin_mfa` (`failed_attempts`, `locked_until`), zodat de grens een herstart van het proces overleeft. Voeg een test toe die bij de zesde poging `RATE_LIMITED` verwacht.

### 2. Blocker: een geblokkeerd account kan geen beroep instellen, en ook niet exporteren of verwijderen
- **Bestand:** `apps/api/src/middleware/auth.ts:80-83`, `apps/api/src/modules/auth/index.ts:79`, `apps/api/src/modules/fraud/index.ts:29`
- **Wat er fout is:** `loadSession` verwijdert alle sessies van een account dat niet `active` is en geeft dan `none` terug. `login()` weigert met `ACCOUNT_BLOCKED`. `POST /appeals`, `GET /me/export` en `DELETE /me` vragen allemaal `student`. Getest: een geblokkeerde gebruiker krijgt op alle drie `401 AUTH_REQUIRED`. Spec §6.5 en businessplan §4 (art. 22 AVG) eisen beroep binnen 14 dagen na een blokkade. De code kent `object_type = 'block'`, maar niemand kan het gebruiken. De web-app heeft ook geen pad voor `ACCOUNT_BLOCKED`. Ook de AVG-rechten op inzage en verwijdering zijn voor deze groep niet uit te oefenen.
- **Fix:** laat een geblokkeerde gebruiker na de magic link inloggen in een beperkte sessie (`kind: 'blocked'`). Die sessie mag alleen bij `POST /appeals` (type `block`), `GET /appeals/mine`, `GET /me/export` en `DELETE /me`. Toon een scherm "Je account is geblokkeerd" met de beroepsknop. Voeg een e2e-scenario toe: blokkeren, inloggen, beroep, gegrond, account weer actief.

### 3. Major: een beheerder kan elke afgebroken sessie herstellen met "appeal_upheld" terwijl er geen beroep is; markeringen vallen daarbij weg
- **Bestand:** `apps/api/src/modules/sessions/engine.ts:233-246`, `apps/api/src/modules/sessions/index.ts:283-295`
- **Wat er fout is:** `restore` accepteert `appeal_upheld` voor elke sessie met `heartbeat_gap` of `late_end`, ook als die opnieuw beoordeeld nog steeds `aborted` uitkomt. Er wordt niet gekeken of er een gegrond beroep (`appeal.outcome = 'upheld'`) bij hoort. Getest: zonder enige rij in `appeal` gaf het herstel `200` met `completed`. Eén beheerder kan zo punten toekennen, zonder vier ogen. Daarnaast zet `restore` `flags: []` en `review_status = 'none'`, ook als de nieuwe beoordeling H1, H3 of H4 oplevert. Een nagekomen, verzonnen gebufferd log bij `late_log` ontloopt zo de H3-markering (gedekt gat > 10%) en de wachtrij.
- **Fix:** sta `appeal_upheld` alleen toe als er een `appeal` met `outcome = 'upheld'` bestaat voor een markering of sessie van precies deze sessie, en neem het `appeal_id` op in de body. Gebruik de flags uit de nieuwe beoordeling (`v.flags`): roep `flags.raise` aan en zet `review_status = 'pending'` als die niet leeg zijn, net als in `complete()`.

### 4. Major: een beheerder kan over zijn eigen markeringen en sessies beslissen
- **Bestand:** `apps/api/src/modules/fraud/lib/flags.ts:115-127`, `apps/api/src/modules/fraud/lib/appeals.ts:94-104`, `apps/api/src/modules/sessions/engine.ts:227`
- **Wat er fout is:** een beheerder is ook een `user` en kan sessies draaien en verzilveren. Toch vergelijkt `decide`, `decideAppeal` noch `restore` de actor met de eigenaar van de markering, het beroep of de sessie. Getest: een beheerder gaf de H5-markering op zijn eigen sessie vrij (`200`, `released`) en herstelde daarna zijn eigen afgebroken sessie (`200`, `completed`, zie bevinding 3).
- **Fix:** weiger met `SAME_REVIEWER` als `adminActor(user_id van het onderwerp) === actor`. Doe dat in `decide`, `confirmBlock`, `decideAppeal`, `restore`, `prizes.verify` en `samples.judge`. Overweeg daarnaast om `is_team`-accounts uit te sluiten van verzilvering en prijzen.

### 5. Major: het client-IP komt uit het linkerdeel van `X-Forwarded-For` en is daarmee te vervalsen
- **Bestand:** `apps/api/src/middleware/request.ts:29-35`
- **Wat er fout is:** met `TRUST_PROXY=1` neemt `clientIp` het eerste element van `X-Forwarded-For`. Een reverse proxy die de header aanvult (nginx met `$proxy_add_x_forwarded_for`) laat dat element staan zoals de client het stuurde. Getest: bij `X-Forwarded-For: 10.9.9.9, 198.51.100.7` geeft `clientIp` `10.9.9.9`. Met een andere waarde per verzoek omzeilt een aanvaller de IP-limieten op `magic-link` en `waitlist`. Hij ontloopt ook H2, H7, H10 en H12, die op `ip_hash` sleutelen, en kan een campusadres opgeven om de hogere drempel `*_shared_threshold` en de limieten van 200 of 300 te krijgen. Staat `TRUST_PROXY` in productie juist uit (de standaard in `server.prod.ts`), dan delen alle gebruikers het IP van de proxy, met het omgekeerde effect.
- **Fix:** neem het adres dat de eigen proxy heeft toegevoegd: het meest rechtse element, of het element op een ingestelde positie met `TRUST_PROXY_HOPS=n`. Weiger bij het starten van `server.prod.ts` als `TRUST_PROXY` niet expliciet gezet is. Voeg een test toe met een vervalst eerste element.

### 6. Major: toestel-id's blijven onbeperkt bewaard; `focus_session.device_id` wordt nooit leeggemaakt
- **Bestand:** `apps/api/src/modules/fraud/lib/retention.ts:33-38`, `apps/api/migrations/0100_sessions.sql` (`device_id NOT NULL`)
- **Wat er fout is:** §10.6 zegt: `focus_session.device_id` op NULL 30 dagen na de sessie, en `device` weg 180 dagen na `last_seen_at`. De retentie verwijdert een `device` alleen als er geen sessie naar verwijst. `device_id` op de sessie is `NOT NULL` en wordt nooit leeggemaakt. Getest: een toestel dat sinds 1 januari 2026 niet meer gezien is, met een sessie van die dag, staat er op 3 december 2026 na `runRetention` nog met `client_device_id`. Voor iedereen die ooit een sessie deed, blijft het toestel-id dus zolang het account bestaat. Dat botst met de DPIA (art. 11.7a Tw).
- **Fix:** maak met een migratie `focus_session.device_id` nullable, of verplaats het naar een aparte koppeltabel. Zet het in de retentie na 30 dagen op NULL en verwijder daarna `device` op `last_seen_at`. Breid `wp6-retention.test.ts` uit met dit scenario.

### 7. Major: `GET /squads/mine` toont dagdoel en pauze van leden in stille modus
- **Bestand:** `apps/api/src/modules/squads/index.ts:50-68`
- **Wat er fout is:** `squadMine` geeft voor elk lid `first_name`, `paused` en `goal_met_today` terug, zonder op `silent_mode` te filteren. Volgens architectuur §6.4 ontbreken leden in stille modus in het overzicht (focust nu, dagdoel gehaald, pauze). UX §146 zegt dat hun status verborgen is en dat ze alleen in de noemer tellen. Voor `16_17` staat stille modus standaard aan. Squadgenoten zien dus elke dag per minderjarige of die zijn doel haalde.
- **Fix:** geef voor leden met `silent_mode = 1` alleen `first_name` en `status: 'silent'` terug, zonder `goal_met_today` of `paused`. Geef de squadtelling ("2 van 3") apart als aggregaat. Neem `squads.mine` op in de privacytest over de sociale routes.

### 8. Major: het bestuursdashboard toont de lopende week en die verandert dagelijks
- **Bestand:** `apps/api/src/jobs/day_close/08-challenge-scores.ts:20-22`, `apps/api/src/modules/clubs/index.ts:87-108`, `apps/api/src/modules/clubs/stats.ts:76-117`
- **Wat er fout is:** de dagafsluiting schrijft elke dag `club_week_stat` voor de lopende week met de data tot die dag. `boardFromStats` toont de laatste rij (`stats[stats.length - 1]`), en dat is die onvolledige week. Een bestuur dat dagelijks kijkt, ziet Werving en Kwaliteit (gekoppeld, verankerd, sessies, aandeel gemarkeerd) dus per dag veranderen. Dat is regel 1 van §6.4 (weekcijfers in plaats van dagcijfers), en die regel staat er juist tegen verschilaanvallen. Het verschil wordt vergeleken met de vorige volledige week, dus vroeg in de week is het verschil bijna altijd ≥ 5 en wordt het cijfer getoond. Daarnaast past `pending_admin` (regel 92) alleen afronding toe en niet de verschilregel 3.
- **Fix:** toon op de tabbladen Werving, Prijs en Kwaliteit alleen afgesloten weken (`week_start < huidige week`). Pas `weeklyCountSeries` ook toe op `pending`. Voeg een privacytest toe waarin één koppeling op dinsdag in de lopende week niet zichtbaar wordt.

### 9. Major: de uitbetaling aan ambassadeurs telt sessies die nog in afwachting zijn, en accounts met open markeringen
- **Bestand:** `apps/api/src/modules/admin/ambassadors.ts:61-75`
- **Wat er fout is:** `countedUsers` telt sessies met `review_status <> 'rejected'`, dus ook `pending`. `suspectUserIds` sluit alleen accounts uit die in een steekproef als verdacht zijn beoordeeld. Een cluster met een open H2-, H7-, H10- of H12-markering, of met gemarkeerde sessies, telt mee voor een echte geldbetaling (€ 5 per gebruiker). Elders geldt dat gemarkeerde minuten pas na vrijgave meetellen: `earnInMinutes` gebruikt `('none', 'released')` (architectuur §5.2). Dit is het enige pad waarin websessies tot geld leiden, dus daar hoort de strengste regel bij.
- **Fix:** gebruik `review_status IN ('none', 'released')` en sluit accounts uit met een open `fraud_flag` (account of sessie). Bereken `counted` niet opnieuw bij `proposed` en `recorded`, maar bevries het bij het trekken van de steekproef, zodat er na de steekproef geen ongecontroleerde accounts bij komen.

### 10. Major: de inlogmail gaat naar het getypte adres, maar het inloggen gebeurt op het genormaliseerde adres
- **Bestand:** `apps/api/src/modules/auth/index.ts:139-173`, `apps/api/src/modules/auth/index.ts:73-80`
- **Wat er fout is:** `magic-link` zoekt het account op met `normalizeEmail` (plus-deel weg, punten weg bij gmail). De mail met token en code gaat naar het adres zoals het getypt is, en `login()` opent het bestaande account. Wie bij een provider zonder plus-adressering (of met een catch-all) de mailbox `slachtoffer+x@domein` heeft, logt dus in op het account van `slachtoffer@domein`. De normalisatie is bedoeld voor uniekheid, niet als bewijs van eigendom van de mailbox.
- **Fix:** stuur de inlogmail voor een bestaand account altijd naar `user.email` (het opgeslagen adres) en sla dat adres ook op in `auth_magic_link.email`. Alleen voor een nieuw adres zonder account gebruik je het getypte adres.

### 11. Minor: de verzilvering wordt pas na de mail idempotent opgeslagen
- **Bestand:** `apps/api/src/modules/redemptions/index.ts:196-217`, `apps/api/src/middleware/route.ts:106`
- **Wat er fout is:** de transactie commit eerst, dan wacht de handler op `mailer.send`. Pas daarna schrijft `mount` het idempotentierecord. Een herhaling met dezelfde `Idempotency-Key` tijdens een trage mail, of na een crash in dat venster, krijgt `WEEKLY_CAP` in plaats van het opgeslagen antwoord. Er wordt niet dubbel verzilverd (de weeklimiet en `BEGIN IMMEDIATE` houden dat tegen), maar de student ziet een fout terwijl zijn punten weg zijn.
- **Fix:** roep `saveIdempotentResponse(db, c, …)` aan binnen de verzilveringstransactie, met het antwoord van 201, en stuur de mail daarna.

### 12. Minor: de web-app heeft geen uitlogknop
- **Bestand:** `apps/web/src` (geen gebruik van `POST /auth/logout`); de route staat in `apps/api/src/modules/auth/index.ts:211-218`
- **Wat er fout is:** de sessie loopt 30 dagen door bij elk gebruik. Op een gedeelde computer in de bibliotheek kan een student zijn sessie niet beëindigen, en de volgende gebruiker ziet saldo, voucher-codes en squad.
- **Fix:** zet "Uitloggen" in P1 (Ik). Dat roept `/auth/logout` aan en leegt de IndexedDB-stores `active_session`, `outbox` en `cache`.

### 13. Minor: de export bevat de signalen van sessies niet
- **Bestand:** `apps/api/src/modules/points/privacy.ts:40-46`
- **Wat er fout is:** §10.7 noemt "sessies met hun signalen (voor zover nog bewaard)". De exporter levert alleen kolommen van `focus_session`, en niet `session_heartbeat`, `visibility_event` of `session_summary`. Dat zijn persoonsgegevens die we 90 dagen bewaren (art. 15 AVG).
- **Fix:** voeg per sessie `heartbeats` (seq, soort, `server_recv_at`, zichtbaarheid) en `events` (soort, `mono_ms`) toe, en daarna de samenvatting uit `session_summary`.

### 14. Minor: bij `DELETE /me` gaat het beheer van een squad niet over naar het langst zittende lid
- **Bestand:** `apps/api/src/modules/squads/lib/privacy.ts:13`
- **Wat er fout is:** de eraser zet `squad.admin_user_id` op NULL. §10.7 en spec §4.4 zeggen dat het beheer naar het langst zittende lid gaat. Zonder beheerder blijven beheerhandelingen van de squad (naam, uitnodigen) hangen.
- **Fix:** kies voor het leegmaken `SELECT user_id FROM squad_membership WHERE squad_id = ? AND left_at IS NULL AND user_id <> ? ORDER BY joined_at LIMIT 1` en zet dat lid als beheerder.

### 15. Minor: de kaart-SVG wordt `inline` geserveerd in plaats van als bijlage
- **Bestand:** `apps/api/src/modules/cards/svg.ts:75`
- **Wat er fout is:** §10.3 schrijft `Content-Disposition: attachment` voor. Met `CSP sandbox`, `script-src 'none'` en het escapen (dat klopt: `escapeXml` en geen `foreignObject`) is er nu geen XSS. Maar de tweede verdedigingslaag uit de architectuur ontbreekt.
- **Fix:** zet `attachment; filename="rewarded-kaart.svg"`, of leg de afwijking met reden vast in de architectuur.

### 16. Minor: productie start stil met `APP_ORIGIN=http://localhost:5173` en zonder `Secure`-cookies
- **Bestand:** `apps/api/src/server.prod.ts:30`, `apps/api/src/middleware/context.ts:66-74`
- **Wat er fout is:** ontbreekt `APP_ORIGIN`, dan start de productiebundel toch. De Origin-controle faalt dan voor elke mutatie (veilig, maar de app werkt niet), en `secureCookies` staat uit.
- **Fix:** laat `server.prod.ts` weigeren te starten zonder `APP_ORIGIN` met `https://`. Zet `secureCookies` in productie altijd aan.

### 17. Minor: de afmeldlink voor herinneringen bevat het ruwe `user_id`
- **Bestand:** `apps/api/src/modules/reminders/logic.ts:16-18`
- **Wat er fout is:** het token is `${userId}_${mac}`. Daarmee belandt het interne id in mail, in de URL en in de toegangslogs van de proxy. §10.4 en §10.7 houden ruwe id's juist uit logs en verwijzingen.
- **Fix:** gebruik een willekeurig token per gebruiker (kolom `reminder_unsubscribe_token`), of `HMAC(user_id)` als sleutel met een opzoekkolom, zoals bij de wachtlijst.

## Gecontroleerd zonder bevinding

- **CSRF.** De CSRF-controle werkt met double-submit, Origin en SameSite=Lax. De beacon-route controleert het token in de body.
- **Sessiecookie.** Alleen de SHA-256 van de cookie wordt opgeslagen. Een beheersessie verloopt na 12 uur.
- **Nonce-keten en heartbeats.** Herhalingen krijgen het opgeslagen antwoord, een onbekende nonce geeft `NONCE_INVALID`, en de rate limit geldt alleen voor een nieuwe `seq`.
- **Klok en gebufferde logs.** De server beslist op zijn eigen klok, gebufferde heartbeats tellen nooit als contact, en een gat groter dan 300 s breekt altijd af.
- **Dubbele verzilvering.** Weeklimiet en voorraad worden in één `BEGIN IMMEDIATE`-transactie gecontroleerd.
- **Routes van een eigenaar.** Op alle routes met `owner` (sessies, kaarten, Beloftes, verzilveringen) controleert de handler de eigenaar. Duels buiten de squad zijn alleen mogelijk tussen 18-plussers.
- **Bestuur.** Bestuursroutes controleren `club_board_member`. De ranglijst bevat geen kolom per lid.
- **Logging.** De logger werkt met een allowlist, zonder bodies en zonder IP. Een stacktrace wordt gelogd zonder de eerste regel.
- **Geboortedatum.** De geboortedatum wordt niet opgeslagen. Onder 16 wordt alles van die persoon gewist.
- **SQL.** Alle SQL is geparametriseerd. Waar kolomnamen in de query staan, komen ze uit vaste lijsten.
- **Dev-routes.** `modules.gen.ts` bevat geen `dev`, en de test van de productiebundel draait.
- **Geld.** Geen tabel kent geld als soort beloning (CHECK op `reward.kind` en `prize.reward_kind`), en `cost_cents` is ten hoogste 500. Het enige geldpad zijn de uitbetalingen aan ambassadeurs, buiten de app (zie bevinding 9).
