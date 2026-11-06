# Eind-QA web-MVP

*5 november 2026. De app draaide met `pnpm dev` op de demo-seed. Ik liep de flow door met Playwright in Chromium (headless, `@playwright/test` 1.63). Studentschermen staan op 390×844 met deviceScaleFactor 2. Het bestuursdashboard en de beheeromgeving staan op 1280×800, ook met deviceScaleFactor 2. De screenshots staan in `docs/build/screenshots/`. De twee scripts staan als tekst in `docs/build/qa-scripts/` (buiten de lint en de typecheck).*

## Samenvatting

De kernflow werkt van begin tot eind in de echte app tegen de echte API. Ik vond één blokkerende fout: de eerste login vanuit een verse browser mislukte. Die heb ik met een kleine wijziging opgelost (zie "Gevonden en opgelost"). De harde randvoorwaarden houden stand in de werkende app. Wat overblijft, zijn UX-afwijkingen (vooral: een bestuurslid kan zijn dashboard niet vanuit de app openen) en dingen die ik in deze omgeving niet kon testen.

## 1. Schone verificatie

| Commando | Uitkomst (eerste run, vóór de fix) | Na de fix |
|---|---|---|
| `pnpm install` | exit 0; 24 API-modules en 62 tokens gegenereerd | — |
| `pnpm verify` | exit 0; 86 bestanden, **1170 tests groen**; oxlint `--deny-warnings` zonder meldingen | exit 0; 86 bestanden, **1171 tests groen** (één test erbij) |
| `pnpm build` | exit 0; API-bundel en web met service worker (30 precache-items, 1047 KiB) | exit 0 |
| `pnpm seed:demo` | exit 0, 13,3 s; 45 studenten, 9 squads, 3 verenigingen, 578 sessies, red team 10, wachtlijst 20 | exit 0, 13,2 s (opnieuw gedraaid om de QA-data weg te halen) |
| `pnpm e2e` | exit 0; **60 geslaagd, 11 overgeslagen** (`fixme` in `later.spec.ts`), 0 gefaald, 2,1 min | exit 0; 60 geslaagd, 11 overgeslagen, 0 gefaald |

Mijn eerste versie van de fix (eerst een GET om het cookie te halen) liet `e2e/focus/session-complete.spec.ts` falen. Die spec draait op een fake zonder `rw_csrf`, dus bij elke POST kwam er een extra request bij. De definitieve versie probeert alleen na een 403 `CSRF_INVALID` nog één keer; daarmee is alles weer groen.

## 2. Doorloop van de kernflow

De demoklok stond op 16 december 2026, in het seizoen van de demokalender. Een beheerder (Anna, via de API) nodigde de wachtlijst uit. Twee nieuwe adressen stonden daarop: een volwassene (Lotte) en een 17-jarige (Mees). Het script zet `navigator.webdriver` op `false`, zoals in een gewone telefoonbrowser. Anders markeert H1 elke sessie; dat geval dekt de e2e al.

| # | Stap | Werkt | Wat ik zag | Afwijking van spec of UX |
|---|---|---|---|---|
| 1 | Uitnodiging openen (`/i/<token>`) | ja | Welkom-scherm. Er staat "telt je focustijd zolang de app zichtbaar op je scherm openstaat", "Geen geld." en "vanaf 16 jaar", met de knop **Doe mee**. Daarna het korte uitlegscherm met **Begrepen** en dan het e-mailadres. `student-01-uitnodiging`, `-02-hoe-het-werkt`, `-03-email` | geen |
| 2 | Inloggen met de code uit de dev-inbox | ja | "Check je mail". De mail "Je inloglink voor Rewarded" bevat link en code; de code van 6 cijfers werkt. `student-04-check-je-mail-code` | geen |
| 2b | Inloggen vanaf `/login` in een verse browser | **nee → opgelost** | De eerste klik op "Stuur link" gaf "Dat lukte niet. Probeer het opnieuw." (403 `CSRF_INVALID`, `missing_cookie`). Een tweede klik werkte wel. Na de fix werkt de eerste klik. | Blocker voor terugkerende gebruikers en voor bestuur en beheer, die niet via een uitnodiging binnenkomen |
| 3 | Onboarding met geboortedatum | ja | "Je geboortedatum" (dag, maand, jaar). Daarna "Onderzoek, voorwaarden en privacy" met twee losse vinkjes, dan het dagdoel (25 min) en "Niet storen". Bij de 17-jarige komt er "Wat je squad ziet" tussen (stille modus). `student-05` t/m `-09`, `minderjarig-05`, `-06` | De akkoordtekst is lang (twee alinea's over loting, rustperiode en Belofte); dat is inhoudelijk juist, maar wel veel tekst voor één mobiel scherm |
| 4 | Oefensessie | ja | "Start oefening", 1 minuut met de timer, dan "Sessie klaar. Draai je telefoon om." Na een tik: "Goed volgehouden … Oefenen telt nergens mee." Daarna "Je eerste sessie". In de database: `is_practice = 1`, 0 minuten, geen boeking. `student-10` t/m `-13` | geen |
| 5 | Sessie van 25 minuten (dev-klok in stappen van 30 s, pagina zichtbaar) | ja | Een donker scherm met een ring, "13 min", "Leg je telefoon omgekeerd neer", "Scherm blijft aan" en **Stoppen**. Er staan geen punten. `student-14` t/m `-16` | geen |
| 6 | Eindscherm met punten | ja | Eerst "25 minuten. Je dagdoel is gehaald." en "Deze week 1 van de 7 dagen.", daarna klein "+25 punten bijgeschreven.", "25 van 300 minuten" en "+20 bonus voor je gehaalde dagdoel. Waarom zie ik dit?". Database: `completed`, 25/25 min, `earn_session`. `student-17-eindscherm-punten` | geen (volgorde zoals UX F5: dagdoel eerst, punten klein) |
| 7 | Afgebroken sessie met uitleg (na 8 min 20 s `hidden`) | ja | "Je sessie stopte om 11:47 omdat Rewarded niet meer op je scherm stond. Je hield 8 minuten vol. Afgebroken sessies leveren geen punten op …". Er zijn twee knoppen: **Opnieuw beginnen** en "Klopt dit niet?". Die laatste opent een dialoog met de keuzes Gesprek, Melding geopend, Scherm ging vanzelf uit en Iets anders, plus "kunnen we niet terugdraaien". Database: `aborted`, `abort_reason = hidden`, 0 minuten, geen boeking. `student-18`, `-19` | De kop en de eerste zin herhalen allebei "Je sessie stopte om 11:47." (staat al als bekend in REPARATIE.md) |
| 8 | Vandaag, punten, geschiedenis | ja | Vandaag toont "25 van 25 minuten", de lengtekeuze, de bonusregel en het aanbod voor een herinnering. Punten: "45 punten" beschikbaar en "0" wordt nagekeken. Geschiedenis: Doelbonus +20 en Focussessie +25. `student-20` t/m `-22` | geen |
| 9 | Squad-overzicht | ja | Nieuwe student: "Nog geen squad … Squad maken". Demo-oprichter Sanne (De Uilen): squadstreak 2 dagen, "0 van 5 actieve leden haalden hun dagdoel, 3 nodig", joker, de leden met voornaam en "Nog niet", en de knoppen Nodig uit, Duel en Squad verlaten. `student-23-squad`, `demo-31-squad` | geen |
| 10 | Verenigingsranglijst | ja | Zonder vereniging: een lege staat met "Code invoeren". Als lid van Kompas: "Aanloopklassement: zonder prijs, om de eer", de poule tot 150 met Kompas, Ratio en Prisma, "Voorlopig" en "Hoe rekenen we?". `student-24`, `demo-32`, `demo-33` | `/vereniging/ranglijst` toont dezelfde pagina als `/vereniging`; er is geen apart ranglijstscherm. De deelnamegraad staat op 0% voor alle drie, terwijl er wel 8–15 min per actief lid staat. Dat klopt (de week begon maandag en het criterium is 3 dagen dagdoel), maar het oogt halverwege de week als een fout |
| 11 | Catalogus | ja | Een kaart met de catalogus en "Punten zijn geen geld en geven geen recht op een bepaalde beloning", "Deze week 20 beloningen voor 8 studenten", drie beloningen met een puntenprijs en de voorraad van vandaag. De knop **Verzilveren** is uitgeschakeld met "Nog 275 minuten focus". `student-25`, `demo-35` | `/punten/catalogus` toont de puntenpagina met de catalogus eronder en scrolt niet naar de catalogus |
| 12 | Profiel (Ik) | ja | Naam, de leeftijd als band ("18 jaar of ouder" of "16 of 17 jaar"), squad, vereniging, dagdoel, schakelaars (minuten vergelijken, stille modus, modus zonder punten, herinnering), meldingen, onderzoek en instellingsmail. `student-26`, `demo-36`, `minderjarig-63` | geen |
| 13 | Bestuursdashboard (1280×800, bestuurslid Sanne, Kompas) | deels | `/bestuur` zegt alleen "Open het dashboard van je vereniging via de link uit je uitnodigingsmail." (`bestuur-40`). Via `/bestuur/<clubId>` werkt alles: Stand, Werving, Promotiekit, Prijs en Kwaliteit, met "Je ziet groepscijfers. Wie wat doet, zie je niet". Het dashboard van een andere vereniging geeft "Dit dashboard is alleen voor het bestuur van deze vereniging." `bestuur-41` t/m `-46` | **Er is geen weg in de app van `/bestuur` (of van Vereniging) naar het eigen dashboard.** Wie de mail kwijt is, komt er niet. Verder: de kopregel "deelnamegraad 0%" volgt de lopende week (W51), terwijl W50 7% was |
| 14 | Beheerder geeft een markering vrij (1280×800, reviewer Chris) | ja | Login met de code, daarna "Tweede factor" met een TOTP-code. Het overzicht toont 12 open markeringen. De fraudewachtrij toont per kaart de heuristiek, het bewijs (`clock_skew_ms` 420000 en zo verder) en de geraakte sessies. Ik gaf de eerste kaart (H4) vrij met Vrijgeven, redencode "Geen bewijs voor misbruik" en een interne toelichting. `fraud_flag` ging van open=12/released=1 naar open=11/released=2, en het auditlog toont de inzage (`flags_viewed`); de regel van het besluit heb ik niet apart gecontroleerd. Ook KPI, Verenigingen, Tentamenkalenders, Auditlog en Vier ogen laden. `beheer-50` t/m `-64` | geen |
| 15 | 17-jarige (Mees, geboren 1 maart 2009) | ja | De onboarding voegt de stille-modusstap toe. Vandaag, Punten, Catalogus, Profiel ("16 of 17 jaar") en Vereniging werken. `/kans` geeft "Pagina niet gevonden". `minderjarig-60` t/m `-65` | geen |

Over de screenshots: op de lange full-page-screenshots staat de vaste onderbalk midden in de pagina (bijvoorbeeld `minderjarig-62-catalogus`). Dat komt door de manier van vastleggen, niet door de app.

## 3. Harde randvoorwaarden

| Randvoorwaarde | Uitkomst | Hoe gecontroleerd |
|---|---|---|
| Geen punten tijdens de sessie | **voldaan** | Na 1 en 12 minuten bevat de tekst van het sessiescherm het woord "punt" niet (`student-15`, `-16`). |
| Geen eurowaarde bij punten | **voldaan** | Op elk bezocht scherm zocht ik regels met "punt" en "€" of "euro"; er waren er geen. In de web-catalogi staat "€" alleen bij "Plus komt eraan, €2,99 per maand" (geen punten). |
| Trekkingen onzichtbaar voor een 17-jarige | **voldaan** | Trekkingen zijn niet gebouwd: `features/draws/routes.tsx` is leeg en `/kans` geeft 404. Op zes schermen van de 17-jarige kwam geen "trekking", "loting", "loterij", "kans" of "winnen" voor (de enige DOM-treffer was een CSS-commentaar "drawn inside it"). Kanttekening: de seed heeft alleen beloningen vanaf `16_17`, dus het weglaten van 18+-beloningen voor minderjarigen kon ik in de UI niet zien. Dat dekken de unit-tests uit de reparatie. |
| Bestuur ziet alleen aggregaten | **voldaan** | Op vijf tabbladen kwam geen van de 18 voornamen van Kompas-leden voor. De cijfers staan per week, afgerond op vijftallen, en kleine groepen tonen "Te klein om te tonen". Een andere vereniging wordt geweigerd. |
| Afgebroken sessie geeft 0 punten en een reden | **voldaan** | Het scherm noemt de reden ("niet meer op je scherm") en zegt "geen punten". In de database: `verified_min = 0`, `counted_min = 0`, `abort_reason = hidden` en geen `journal_entry`. |
| "bewezen" komt nergens voor | **voldaan** | Het woord stond op geen enkel bezocht scherm. In `apps/`, `packages/` en `tooling/` komt het alleen voor in de i18n-lint en in tests die het verbieden, en het staat niet in `apps/web/dist` of `apps/api/dist`. |

## Gevonden en opgelost

- **Eerste POST zonder CSRF-cookie** (`apps/web/src/lib/api/web.ts`). De server zet `rw_csrf` bij elke response, ook bij de 403. Een verse browser die op `/login` begint, doet als eerste een POST en kreeg dus `CSRF_INVALID`. De web-client probeert zo'n call nu één keer opnieuw met het cookie uit die 403, en alleen als er nog geen token was meegestuurd. In alle andere gevallen gaat er geen extra request uit. De afwijzing gebeurt in de middleware vóór de handler, dus de herhaling is veilig. Test: `apps/web/test/wp7-api.test.tsx` ("retries a mutation once …").

## Bekende problemen en afwijkingen (niet opgelost)

1. **Bestuur kan het eigen dashboard niet vanuit de app openen** (major, UX). `/bestuur` verwijst alleen naar de uitnodigingsmail. Voorstel: `GET /me` geeft de clubs terug waar de gebruiker bestuurder is, `/bestuur` linkt daarnaar, en Vereniging krijgt voor bestuursleden een link "Bestuursdashboard".
2. **De kop van de deelnamegraad volgt de lopende week** (minor). Halverwege de week staat er 0% met "Nog 25%", terwijl de vorige week 7% was. Voorstel: toon de laatste afgesloten week, of zet er "deze week tot nu toe" bij.
3. **Dubbele zin op het afbreekscherm F6** (minor, cosmetisch; stond al open in REPARATIE.md).
4. **`/punten/catalogus` en `/vereniging/ranglijst` hebben geen eigen scherm.** Ze tonen de bovenliggende pagina zonder naar het onderdeel te scrollen (minor).
5. **Dev-klok en TOTP.** Na `pnpm dev` loopt de klok op de echte tijd (november). De TOTP-stappen van de seed liggen in december, dus de replaybescherming weigert dan elke beheercode met `MFA_INVALID`, tot de klok op de demotijd staat. In `e2e/MANUAL.md` staat dat de klok na `POST /dev/reset` "gewoon doorloopt". Dat klopt niet: `DevClock.set` bevriest de klok, ook in de seed. Alleen een dev-kwestie, maar het verwart. De volgorde moet zijn: eerst de klok zetten, dan inloggen als beheerder.
6. **De akkoordtekst is lang** voor één mobiel scherm (inhoudelijk juist; UX-oordeel).

## Niet getest in deze QA

- Echte toestellen, Safari/WebKit, de echte Wake Lock, een uitgaand scherm en app-wissels (zie `e2e/MANUAL.md`). De zichtbaarheid is gesimuleerd met `__rwTest.setVisibility`.
- Offline en wegvallende heartbeats (die dekt de e2e op de fake), de kaart als PNG delen, en verzilveren (de nieuwe student zat onder de 300 minuten; de demo-student mag pas vanaf 17 december).
- De productiebundel in de browser (alleen gebouwd), Engelse copy, en een beheerder met de rol `admin` voor vier-ogenbesluiten.
