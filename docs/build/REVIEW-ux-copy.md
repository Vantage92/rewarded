# REVIEW — UX en copy tegenover de ontwerpprincipes

*Onafhankelijke review, 5 november 2026. Lens: de tien principes uit `docs/research/06-ux-ontwerp.md` hoofdstuk 1 en hun toetsen, de copy uit §6.2, i18n NL/EN, toegankelijkheid en de mockups (`docs/research/mockups/rewarded-mockups.html`). Ik heb geen code gewijzigd. Een tijdelijke API-test voor bevinding 1 heb ik weer verwijderd.*

## Wat ik heb gedraaid

- `pnpm verify`: groen (80 testbestanden, 1151 tests).
- `pnpm -F @rewarded/web test` (362 groen), `lint:i18n` (0 issues), `test:pwa` (10 groen, axe inbegrepen).
- Eigen scripts: NL/EN-pariteit en variabelen per sleutel (geen gaten), letterlijke `t()`-sleutels in de code tegenover de catalogi (geen ontbrekende sleutel), WCAG-contrast van de sessie- en eindschermtokens.
- Een tijdelijke API-test: een 16_17-gebruiker die `GET /challenges` doet terwijl er een challenge met een 18+-prijs gepubliceerd is.

## Wat goed is

- Geen punten op F3 en geen oplopende teller. De timer toont minuten en pas in de laatste minuut seconden. Het eindsignaal staat standaard aan en het witte eindscherm toont geen punten.
- F6 heeft per afbreekcode de copy uit §6.2. "Klopt dit niet?" is een secundaire knop bij `heartbeat_gap` en `late_end`, en de meldtekst belooft per code niet meer dan spec 6.4.
- De woorden "bewezen" en "proven" komen in geen enkele catalogus voor. Trekkingen hebben geen route (`/kans` geeft 404) en geen tab. De catalogus filtert 18+-items op de server. Het duel naar buiten bestaat niet voor 16_17.
- De verenigingsranglijst toont alleen verenigingen op deelnamegraad. Minuten vergelijken is opt-in aan twee kanten. De deelkaart heeft geen punten of bedragen en zegt wat ze niet bewijst.
- NL en EN zijn volledig gelijk. `html lang` volgt de taal. Er is een focusring, een skiplink en `aria-current` op de tabs, en de bewegingen worden kort bij reduced motion. De contrastparen zijn in orde: focusring op het sessiescherm 3,10:1, `session-muted` 6,67:1.

## Bevindingen

| # | Ernst | Bestand:regel | Kort |
|---|---|---|---|
| 1 | blocker | apps/api/src/modules/challenges/index.ts:125 | 18+-challenges en `value_cents` gaan naar 16_17 |
| 2 | blocker | apps/api/migrations/0001_identity.sql:27 | Herinneringsmails staan standaard aan |
| 3 | blocker | apps/api/src/modules/reminders/logic.ts:77 | De afmeldlink in de mail geeft een 404 |
| 4 | blocker | apps/web/src/i18n/nl/focus.json:124 | "Je ziet de status bij Ik, Meldingen": die plek bestaat niet, beroep ook niet |
| 5 | blocker | apps/web/src/app/routes.tsx:27 | QR en poster van de vereniging (`/c/:code`) komen op een placeholder uit |
| 6 | blocker | apps/web/src/features/onboarding/steps/ConsentStep.tsx:33 | Akkoord zonder link naar de voorwaarden en de privacyverklaring; datum bonusstop ontbreekt |
| 7 | blocker | apps/web/src/features/focus/HomeScreen.tsx:106 | De Bonusregel ontbreekt op F1 en F5 (H-A) |
| 8 | major | apps/api/src/jobs/reminders.ts:14 | Herinnering op een vast tijdstip, mail bij een gehaald doel, framing |
| 9 | major | apps/web/src/features/focus/views/CompletedView.tsx:64 | Gemarkeerde sessie zonder reden |
| 10 | major | apps/web/src/features/focus/views/CompletedView.tsx:42 | F5 zonder squadblok, squaddag en "Maak een kaart" |
| 11 | major | apps/web/src/features/focus/HomeScreen.tsx:51 | De noemer "X van Y focussen nu" op F1 klopt niet |
| 12 | major | apps/web/src/design/ThemeSwitch.tsx:13 | De taalkeuze wordt niet op de server bewaard |
| 13 | major | apps/web/src/features/focus/HomeScreen.tsx:58 | F1 mist joker, tentamendag, streak en verenigingsregel |
| 14 | minor | apps/web/src/features/focus/views/AbortedView.tsx:56 | F6 herhaalt het tijdstip en mist het overzicht uit mockup 08 |
| 15 | minor | apps/web/src/features/profile/SubScreens.tsx:155 | Het Plus-scherm toont de referral-tekst |
| 16 | minor | apps/web/src/features/focus/views/EndSignalView.tsx:7 | Laptop: de tabtitel "Sessie klaar · Rewarded" ontbreekt |
| 17 | minor | apps/web/src/features/focus/views/PrepareView.tsx:39 | F2 mist de regel "sessie op een ander toestel" |
| 18 | minor | apps/web/src/i18n/lint.ts:1 | De i18n-lint dekt mailteksten en `.ts`-copy niet; README zegt "bewezen" |
| 19 | minor | apps/web/src/features/focus/views/RunningView.tsx:51 | Op F3 staan stippen in plaats van avatars |

### 1. blocker — 18+-challenges en eurowaarde gaan naar 16_17 (principes P10 en P7)

`challenges.list` (`apps/api/src/modules/challenges/index.ts:125-145`) filtert niet op leeftijd. De route geeft elke challenge terug, met de titel, `prize.description` en `prize.value_cents`. Alleen `enroll` weigert met `AGE_RESTRICTED` (regel 154).

**Gecontroleerd:** een 16_17-gebruiker krijgt de prestatiechallenge met een 18+-boekenbon in `GET /challenges`. De web-app zet de titel in V1 (`ClubScreen.tsx:84-91`) en de prijsomschrijving in V1 en in het challengescherm (`ClubScreen.tsx:70-73`, `ChallengeScreen.tsx:52-54`). Dat is een 18+-element in de DOM voor 16_17, en een eurowaarde (`value_cents`) in de payload van de student.

**Fix:**
- Laat in `challenges.list` en `challenges.get` challenges weg die een prijs hebben met `min_age_band = '18_plus'` wanneer `ageBand !== '18_plus'`.
- Haal `value_cents` uit `PrizeSummary` in `packages/contracts/src/challenges.ts:20`. Alleen beheer en bestuur hebben het plafond nodig.
- Voeg een API-test toe die het lege resultaat voor 16_17 vastlegt.

### 2. blocker — Herinneringsmails staan standaard aan (principe P5)

De kolom staat op `email_reminders INTEGER NOT NULL DEFAULT 1` (`apps/api/migrations/0001_identity.sql:27`). De registratie (`apps/api/src/modules/auth/index.ts:273`) zet de waarde niet. Met de vlag `reminders` aan (de demo-seed zet hem aan, `tooling/seed/demo.ts:206`) krijgt dus iedereen elke dag een mail zonder dat hij die koos. In P1 staat de schakelaar daardoor vooraf aan. P5 en §5.5 zeggen: herinneringen standaard uit, nooit vooraf aan.

**Fix:** maak een migratie met `DEFAULT 0` en zet bestaande gebruikers zonder `reminder_settings_changed`-event op 0. Voeg een test toe: na registratie geldt `settings.email_reminders === false`.

### 3. blocker — De afmeldlink in de herinneringsmail werkt niet (principe P5, §4.9 stap 2)

`sendReminders` linkt naar `/herinneringen/uit#t=…` (`apps/api/src/modules/reminders/logic.ts:77`). De web-app heeft geen route met dat pad; geen `features/*/routes.tsx` claimt het, dus de link toont "Pagina niet gevonden". De afmeldlink van de wachtlijstmail (`/afmelden`, `apps/api/src/modules/waitlist/mail.ts:30`) komt uit op de placeholder "Dit scherm komt in een volgend werkpakket (WP-9)" (`apps/web/src/app/routes.tsx:33`). Uitschrijven met één klik zonder in te loggen kan daardoor nergens.

**Fix:** bouw `/herinneringen/uit` en `/afmelden`. De pagina leest het token uit de hash, post het naar `reminders.unsubscribe` of `waitlist.unsubscribe` en toont "Je krijgt geen herinneringen meer." in NL en EN. Voeg een e2e-test toe die de link uit de dev-inbox volgt.

### 4. blocker — "Klopt dit niet?" belooft een statusplek die niet bestaat (principe P4, spec 6.4)

Na het melden zegt de toast "Je melding is binnen. Je ziet de status bij Ik, Meldingen." (`apps/web/src/i18n/nl/focus.json:124-125`, ook EN). Die plek bestaat niet:

- Ik heeft geen sectie Meldingen (`profile.json` heeft geen sleutel ervoor).
- Er is geen scherm voor besluiten (F8, mockup 12 "Sessiedetail met besluit en beroep").
- De web-app gebruikt `appeals.create` nergens.

De student ziet dus nooit het besluit met de redencode (§6.2-tabel F8) en kan niet binnen 14 dagen in beroep. Dat is precies wat de P4-toets uitsluit: copy die meer belooft dan het systeem waarmaakt. De copy verwijst ook naar "Hulp" (`points.json` `phone.in_use`), maar `/hulp` is een placeholder.

**Fix:**
- Bouw in Ik een lijst "Meldingen" met de eigen meldingen, markeringen en besluiten. De copy per redencode komt uit §6.2 en de knop [Beroep instellen] roept `appeals.create` aan. Daarvoor is een studentroute voor de eigen flags nodig.
- Zolang die er niet is: verander de toast in "Je melding is binnen. We mailen je het besluit, meestal binnen 3 werkdagen." en laat de verwijzing naar Ik weg.

### 5. blocker — De QR en de poster van de vereniging komen op een placeholder uit (kernflow vereniging, §2.2 diepe links)

De promokit bouwt `${appOrigin}/c/${join_code}?bron=…` (`apps/api/src/modules/clubs/index.ts:201`). In de web-app is `c/:code` alleen een placeholder (`apps/web/src/app/routes.tsx:27`) met de interne tekst "Dit scherm komt in een volgend werkpakket (WP-8)" (`common.json` `placeholder.coming`). Elke QR, poster en story van een bestuur werkt daardoor niet. De e2e omzeilt dit via `/vereniging/koppelen?code=`. Dezelfde placeholder staat op `/hulp`, `/afmelden` en `/vragen/:moment`.

**Fix:**
- Laat de feature club de route `c/:code` exporteren. Met een account stuurt die door naar `/vereniging/koppelen?code=:code&bron=…` (V2), zonder account naar O1 met de vereniging bovenaan.
- Voeg een e2e-test toe die de URL uit `board.promoKit` opent.
- Toon nooit een werkpakketnummer aan studenten: de placeholder wordt een gewone 404 of een rustige "Deze pagina is er nog niet".

### 6. blocker — Akkoord zonder toegang tot de tekst waarmee je akkoord gaat (O6, spec 3.1 stap 6–7)

`ConsentStep.tsx:33-40` toont twee vinkjes: "Ik ga akkoord met de gebruiksvoorwaarden" en "Ik heb de privacyverklaring gelezen". Er staat geen link bij. De sleutels `consent.terms_link` en `consent.privacy_link` bestaan, maar geen enkel bestand gebruikt ze. O6 vraagt om "links naar P3 en privacyverklaring". Een akkoord op het lezen van een tekst die niet te openen is, is geen geïnformeerd akkoord, ook niet voor 16- en 17-jarigen.

Daarnaast mist de pilottekst de datum. §6.2 zegt "De doelbonus stopt aan het einde van de laatste tentamenweek van je instelling, op [datum]", maar `onboarding.json:95` stopt na "instelling.". B7 (`points.json:110`) zegt "Dat zie je vooraf", maar toont de datum ook niet, terwijl `GET /me` hem in `calendar` levert.

**Fix:**
- Zet bij beide vinkjes een link die opent zonder de onboarding te verliezen, als sheet of in een nieuw tabblad, naar dezelfde tekst als `/profiel/voorwaarden` en `/profiel/privacy`.
- Geef `consent.pilot` en `bonus.season` een `{date}` uit de kalender (bonusstop). Valt die nog niet te bepalen, gebruik dan de standaardkalender.

### 7. blocker — De Bonusregel ontbreekt op F1 en F5 (principe P1, §5.5, mockups 04, 05, 10 en 11)

F1 heeft onder de startknop (`HomeScreen.tsx:106-110`) geen Bonusregel. F5 (`CompletedView.tsx:62-77`) heeft geen Bonusregel als laatste regel van het puntenblok. De arm-tekst staat alleen op B7 (`/punten/bonusregel`). De twee armen van H-A verschillen volgens spec 7.3 alleen in deze framing, op dezelfde plek en in dezelfde grootte. Zonder de component krijgt niemand de behandeling te zien: arm B ziet zijn weekbudget nergens in de kernflow, en de meting van H-A meet dan niets.

**Fix:**
- Maak een component `BonusRule` in `design/components`, gevoed door `me.today.bonus_rule`, met de teksten uit §6.2 "Bonusregel (F1, F5)". Arm B heeft voor F1 en F5 het resterende weekbudget nodig; voeg dat veld toe aan `TodayResponse`.
- Zet de component direct onder [Start focussessie] en als laatste regel van het puntenblok op F5, met de link "Waarom zie ik dit?".
- Bij `none` en in de modus zonder punten toont de component niets.

### 8. major — Herinneringen: vast tijdstip, mail bij een gehaald doel, andere mailcopy (P5, §4.9, §6.2)

- **Vast tijdstip.** De job draait op `params.time.reminder_at` (19:30) voor iedereen (`apps/api/src/jobs/reminders.ts:14`). P5 zegt: "geen meldingen of e-mails op een tijdstip dat de gebruiker niet koos". P5 (het scherm) met tijd en dagen bestaat niet: Ik heeft alleen een schakelaar.
- **Mail bij een gehaald doel.** `kind` wordt `streak_at_risk` als de squad nog leden nodig heeft, ook als het eigen dagdoel al gehaald is (`logic.ts:68`). De schakelaar belooft "alleen als je dagdoel nog open staat" (`profile.json` `settings.reminders_desc`).
- **Andere copy.** De mail (`logic.ts:45-53`) wijkt af van §6.2. Het onderwerp "Je squad focust vandaag" past niet bij de inhoud, er is streakdruk ("heeft vandaag nog een paar gehaalde doelen nodig") en de voet "Je krijgt deze mail omdat je een herinnering aanzette" ontbreekt.

**Fix:**
- Sla per gebruiker een tijd (stappen van 15 minuten) en dagen op, en laat de job per kwartier draaien voor wie op dat moment aan de beurt is. Bouw P5.
- Stuur niets als `d.goalMet` waar is.
- Gebruik letterlijk de mailcopy uit §6.2, in NL en EN.

### 9. major — Een gemarkeerde sessie staat zonder reden in F5 (principe P2, §6.2 "Gemarkeerd")

`CompletedView.tsx:64` toont `completed.points_pending`: "Deze sessie wordt nagekeken. Je punten komen vrij…". §6.2 en de F5-rij vragen de reden erbij: "(reden: een groot deel van de tijd kregen we geen signaal)". `EndSessionResponse` (`packages/contracts/src/sessions.ts:111-123`) heeft alleen `flagged: boolean`. De kernflow-e2e (H1, gemarkeerd) laat dus precies deze copy zonder reden zien.

**Fix:** voeg `flag_reason` toe aan `EndSessionResponse`, als vaste code per heuristiekgroep, zoals de redencodes uit §6.2: geen signaal, geautomatiseerde browser, patroon. Neem de reden in de copy op met een variabele, NL en EN. De exacte drempel blijft weg.

### 10. major — F5 slaat de squad over (principe P1, mockups 10 en 11)

F5 toont alleen "Squadstreak: dag N." (`CompletedView.tsx:56-60`). Wat ontbreekt:

- wie er ook zat ("Mila en Daan zaten er ook.");
- de squaddag ("Squaddag: 2 van 3 actieve leden");
- de tekstlink "Maak een kaart";
- de inverdienregel uit de mockup ("nog 38 minuten tot je eerste verzilvering").

Daardoor is de volgorde competentie, squad, beloning maar half uitgevoerd, en is een kaart na een sessie niet te maken.

**Fix:** voeg aan F5 een squadblok toe dat `squads.presence` en `squads.mine` gebruikt (namen van leden die in dezelfde periode focusten, squaddag op de actieve noemer). Zet de link `/kaart/nieuw?soort=session&id=…` onderaan, maar niet bij een gemarkeerde sessie. Laat de waarde van de voortgangsbalk "nog N minuten tot je eerste verzilvering" zeggen.

### 11. major — De noemer van "X van Y focussen nu" op F1 klopt niet (§3.1 "Squadnoemer", spec 4.4)

`HomeScreen.tsx:51` neemt `total = presence.data.members.length`. `squads.presence` (`apps/api/src/modules/squads/index.ts:145-155`) telt leden op pauze mee (`openMembers` filtert niet op pauze) en laat leden in stille modus helemaal weg. De UX-regel is omgekeerd: pauze telt niet, stille modus wel. Met 3 actieve leden, 1 op pauze en 1 in stille modus staat er dus "1 van 3" waar "1 van 4" hoort, en de noemer wijkt af van Q1. Q1 rekent wel goed via `squads.mine`.

**Fix:** neem de noemer uit `squads.mine` (actieve leden, niet op pauze), zoals Q1 doet. Of laat `squads.presence` een veld `active_count` teruggeven volgens spec 4.4.

### 12. major — De taalkeuze blijft in de browser (i18n)

`LanguageSwitch` (`apps/web/src/design/ThemeSwitch.tsx:13-16`) zet de taal alleen in `localStorage`. `SettingsPatch.locale` bestaat (`packages/contracts/src/auth.ts:102`), maar de web-app gebruikt het niet. De server leest `user.locale` voor de catalogustitels (`catalog/index.ts:136`), de challengetitels, de herinneringsmails en de beslismails. Wie in Ik naar English wisselt, ziet daarom een Engelse interface met Nederlandse beloningen en krijgt Nederlandse mail. Op een nieuw toestel start de app in het Nederlands, ook als `me.locale` `en` is.

**Fix:**
- `setLocale` stuurt ook `PATCH /me/settings {locale}` en invalideert de queries `catalog.list` en `challenges.list`.
- Bij het laden van `me` neemt de `I18nProvider` `me.locale` over als er geen keuze in de browser staat.

### 13. major — F1 mist vijf vaste onderdelen (§3.3 F1, mockup 04)

F1 (`HomeScreen.tsx:58-118`) heeft dagdoel, week, squadstrook, duur en de startknop. Wat ontbreekt:

- de jokerstatus ("Joker deze week: nog over."; `today.joker_available` is er al);
- de tekstlink "Vandaag heb ik een tentamen" naar F10 (er is geen route; `today.exam_day` wordt niet gelezen);
- de squadstreak;
- de regel met de verenigingspositie;
- het herinneringsvoorstel na de eerste sessie.

De schadekaart (G4) en de vragenlijstkaart staan als "niet gedaan" in INTEGRATIE. Die tel ik hier niet mee, maar ze zitten ook niet in de web-app.

**Fix:** voeg de onderdelen toe in de volgorde van mockup 04, met copy uit §6.2. Bouw F10 als sheet die `ExamDayParams` gebruikt.

### 14. minor — F6 herhaalt het tijdstip en mist het overzicht uit mockup 08

De kop zegt "Je sessie stopte om 14:32." (`AbortedView.tsx:56`), en de body begint bij `hidden` en `heartbeat_gap` opnieuw met "Je sessie stopte om 14:32 omdat…" (`focus.json` `aborted.hidden`). Mockup 08 laat de herhaling weg. Ook ontbreken:

- het overzicht "Volgehouden 18 van 50 min / Reden / Squadstreak: loopt nog · dag 6" (bij `heartbeat_gap` en `late_end` staat de streakstatus nergens);
- de Niet storen-tip;
- de duur op de knop ("Kortere sessie (25 min)").

**Fix:** laat in de body de eerste zin weg als de kop het tijdstip al noemt; de body begint dan bij de reden. Voeg de definitielijst uit de mockup toe en zet de duur op de knop met `{minutes}`.

### 15. minor — Het Plus-scherm toont de referral-tekst

Met `plus_door` uit toont `PlusScreen` "De persoonlijke link staat nu niet aan." (`SubScreens.tsx:155`, sleutel `profile:referral.off`). Dat is de tekst van het referralscherm.

**Fix:** maak een eigen sleutel `points:plus.off` ("Plus staat nu niet aan.") in NL en EN.

### 16. minor — Laptop: geen titelwijziging bij het einde (§2.2)

Op de laptop is het eindsignaal "de toon plus een titelwijziging van het tabblad ('Sessie klaar · Rewarded')". Nergens in `apps/web/src` wordt `document.title` gezet.

**Fix:** zet in `EndSignalView` `document.title = t('focus:end_signal.tab_title')` en zet de titel terug bij F5. Voeg de sleutel toe in NL en EN.

### 17. minor — F2 mist de waarschuwing voor een tweede sessie elders (§3.3 F2)

De F2-rij vraagt "Je hebt een sessie op een ander toestel. Starten stopt die." wanneer er elders een sessie loopt. `PrepareView.tsx` toont alleen de wake-lock-waarschuwing. De student ontdekt het pas achteraf als `second_session` op het andere toestel.

**Fix:** lees `sessions.active` vóór [Begin] en toon de regel als die een sessie van een ander toestel teruggeeft.

### 18. minor — De i18n-lint mist mailteksten en losse `.ts`-copy

`lint.ts` toetst alleen JSON-catalogi en JSX-tekst. De mailteksten staan als letterlijke strings in de API (`reminders/logic.ts:45-53`, `waitlist/mail.ts`) en vallen buiten de lint voor verboden woorden en voor NL/EN-pariteit. De README opent met "Focus-app die je beloont voor bewezen focus." De regel dat "bewezen" nergens voorkomt, geldt voor de app, maar de README is de eerste tekst die partners en bouwers lezen.

**Fix:**
- Breng de mailcopy onder in catalogi (`apps/api/src/i18n/*` of contracts) en laat de lint ze meelezen.
- Verander de README in "Focus-app die je beloont voor focus die we zien."

### 19. minor — Op F3 staan stippen in plaats van avatars (§3.3 F3)

`RunningView.tsx:51-56` toont tot zes anonieme stippen met `role="img"` en een label. De UX-rij en mockup 06 noemen avatars van de squadleden die nu focussen. Er is wel een reden voor de stippen: `squads.presence` geeft bewust geen namen. Dan klopt de UX-tekst niet met het contract, en dat moet één van de twee bijstellen.

**Fix:** leg het besluit vast in §3.3 (stippen, geen namen tijdens de sessie), of geef presence binnen de squad de initiaal mee en toon die avatars.
