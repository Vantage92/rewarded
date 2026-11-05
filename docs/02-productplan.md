# Rewarded — Productplan v1 (besluiten van de founder)

*Stand: 5 november 2026. Dit document vat samen wat we bouwen en legt mijn besluiten vast op de open punten van het productteam. De details staan in de onderliggende documenten: `docs/research/05-productspecificatie.md` (bouwdocument met alle regels, parameters en randgevallen), `docs/research/06-ux-ontwerp.md` met de mockups in `docs/research/mockups/rewarded-mockups.html`, `docs/research/07-architectuur.md` (stack, datamodel, API, sessieprotocol, bouwplan) en `docs/research/04-boodschap-en-positionering.md` (boodschap, naam, copy). Bindend kader blijft `docs/01-businessplan.md`.*

## 1. Wat we bouwen, in één alinea

Een Progressive Web App voor de telefoon (ook bruikbaar op de laptop) waarin een student een focussessie van 25, 50 of 90 minuten start, de telefoon met het scherm naar beneden legt en pas weer opneemt als de sessie klaar is. De sessie telt alleen zolang Rewarded zichtbaar op het scherm staat; verlaat je het scherm, dan stopt de sessie en legt de app uit waarom. Voltooide minuten leveren direct punten op tegen een vaste ratio, inwisselbaar in een catalogus die partners vooraf hebben gefinancierd. De student zit in een squad van drie tot zes vrienden die live zien wie focust en samen een streak opbouwen, en via zijn studievereniging in de Blokk-challenge: welke vereniging haalt in de tentamenweken de hoogste deelnamegraad? Na twee weken krijgt hij het aanbod om zichzelf iets te beloven voor de volgende twee weken, met zijn squad als getuige. Dat laatste is de kern van de pilot: of gedrag blijft staan als de beloning afbouwt.

## 2. Hoe het productteam tot de spec kwam

Drie onafhankelijke specificaties (MVP-first, retentie-first, groei-first) zijn door twee onafhankelijke juryleden gescoord. Beiden kozen MVP-first als basis (65 en 62 punten), met de opdracht om de Belofte en de nawerkingsmeting uit retentie-first en de uitnodigings- en verenigingsmechanismen uit groei-first erin te enten. De definitieve spec doet dat en verantwoordt per onderdeel waar het vandaan komt. Het UX-ontwerp en de architectuur zijn daarna op die spec geschreven en elk door een kritische tegenlezer beoordeeld en herzien.

## 3. De vijf onderdelen en wat ze in de MVP doen

| Onderdeel | Wat de MVP doet | Wat bewust niet |
|---|---|---|
| Focus-engine | Sessies van 25/50/90 minuten; sessie loopt alleen bij zichtbare pagina; Wake Lock houdt het scherm aan; servertijd bepaalt de duur; heartbeat elke 30 seconden met nonce; gebufferde logs overbruggen wifi-gaten tot 5 minuten; vaste afbreekcodes met uitleg in gewone taal; "Klopt dit niet?" naar een wachtrij met menselijke beoordeling; oefensessie van één minuut in de onboarding | Geen pauze binnen een sessie, geen terugkeervenster, geen vrije sessielengtes (allemaal fraudewegen die het web niet kan controleren); besluit over een terugkeervenster na de pilot op data |
| Punten en catalogus | 1 punt per geverifieerde minuut, direct bijgeschreven; daglimiet 480 minuten; inverdienperiode 300 minuten; één verzilvering per week; europlafonds (item ≤ €5, individuele prijs ≤ €10, per persoon per maand ≤ €15); catalogus alleen met vooraf gedekt budget en wekelijkse voorraadvrijgave; telefoonverificatie bij de eerste verzilvering; doelbonus van 20 punten per gehaald dagdoel in twee experimentarmen (winst tegenover slinkend weekbudget), die op 18 januari 2027 aangekondigd stopt | Geen cash-out, geen eurowaarde bij punten, geen variabele koers, geen punten tijdens de sessie in beeld, geen stapeling van bonussen |
| Squads, duels, verenigingen | Squads van 3–6 met uitnodigingslink (WhatsApp), live aanwezigheid, dagdoel met overmoedrem, squadstreak die slaagt als de helft van de actieve leden het dagdoel haalt, rustdag-joker, automatische pauze na 7 dagen; duels van 7 dagen om een badge; verenigingscode met plafond, ranglijst op deelnamegraad in poules naar ledental, bestuursdashboard met alleen aggregaten vanaf 5 leden | Geen openbare individuele ranglijst; minuten vergelijken alleen opt-in binnen de squad; geen export of berichten voor het bestuur; geen punten in duels |
| Prijzen | Verdiende prijzen: collectieve hoofdprijs per poule (≤ €150 in natura) en drempelprijs (≤ €75) in de tentamenweken, individuele prestatiechallenges met vaste plaatsen (≤ €10); winnaarsverificatie met menselijke beoordeling en levering na 14 dagen. Verlote prijzen: module met spelvoorwaarden, 18+, aparte opt-in, kans als getal, commit-reveal-loting; gebouwd, maar de vlag staat uit | Trekkingen gaan pas aan na advocatenopinie, voorlegging aan de Kansspelautoriteit en mijn besluit; voor 16- en 17-jarigen bestaan ze niet, ook niet als grijze kaart |
| De Belofte en de inzetlaag | De Belofte: na 14 dagen (of 8 gehaalde dagdoelen) kiest de gebruiker dagen per week en minuten per dag voor de komende twee weken, met de squad als getuige; geen punten; reflectie na 14 dagen; 18-plussers krijgen één vraag naar interesse in een inzet voor een goed doel | De inzetlaag zelf (kaartreservering, goed doel) valt buiten de MVP en komt pas na juridische toetsing en native verificatie |

Daarnaast: onboarding met magic link en leeftijdsklasse (16+, 18+; geboortedatum wordt niet bewaard), deelbare bewijskaart met QR naar een verificatiepagina die ook zegt wat ze niet bewijst, referral in punten met vesting achter een vlag (vanaf 5 januari), eventlog met de volledige KPI-set, fraudeheuristieken H1–H10 met wachtrij, beroep en auditlog, vakantiepauze, en een beheeromgeving voor verenigingen, challenges, partners, budget, catalogus en trekkingen.

## 4. Mijn besluiten op de open punten

| Punt | Besluit |
|---|---|
| Trekkingsmodule bouwen in R3 met de vlag uit | Akkoord. De module bestaat zodat we snel kunnen schakelen; aan alleen na advocatenopinie, Ksa-voorlegging en mijn besluit. |
| Deelbare kaarten als Should in R2 | Akkoord, met schuifruimte naar R3. |
| Referral vanaf 5 januari achter een vlag | Akkoord. Eerst meten we K uit squads zonder referral (2 december – 3 januari). |
| Duels met een niet-squadlid | Toegestaan: accepteren is de opt-in, twee personen, geen openbare ranglijst. Dit valt binnen "individuele vergelijking alleen opt-in". |
| Belofte gerandomiseerd per squad (vroeg tegenover 1 februari) | Akkoord. Zonder controle-arm is nawerking niet te vergelijken; iedereen krijgt het aanbod, de late arm op 1 februari. |
| Europlafonds op trede 1 | Akkoord als werkhypothese, onder voorbehoud van de jurist. |
| Kerstcorrectie en drempels | Vakantiepauze 21 december – 3 januari telt niet mee bij D30 en W3; D7 van squadleden "duidelijk hoger" is ≥ 1,5× solo. Dit gaat vóór 2 december in de voorregistratie en schuift daarna niet. |
| K-factor in de go/no-go | Over de hele pilot, met K zonder referral ernaast. Haalt alleen K met referral de 0,3, dan is dat een signaal en geen go. |
| Terugkeervenster | Niet in de pilot; besluit na de pilot op data over afbrekingen en meldingen. |
| Herladen van de pagina | Telt als afbreking, met een waarschuwing vooraf; na de pilot heroverwegen op data. |
| "Actief lid" in de intensiteitsmaat | Gekoppeld lid met minstens één voltooide, niet-afgekeurde sessie in de challengeweek. |
| Gelijke stand in de verenigingsranglijst | Eerst intensiteit, dan gedeelde plaats; vooraf in de challengevoorwaarden. |
| Onbesteed beloningsbudget | Gaat door naar de catalogus of de verenigingsprijs van de volgende periode, nooit naar Rewarded. Dit staat vanaf nu ook in het businessplan; daarmee mogen we zeggen dat we niet aan falen verdienen. |
| Wie betaalt de verenigingsprijzen in de gratis pilot | Rewarded zelf, uit de budgetpost "eigen bijdrage aan beloningen", binnen de plafonds: hoogstens €150 hoofdprijs en €75 drempelprijs per vereniging, in natura. Getekende partnerbijdragen komen daar bovenop. |
| Bestuursdashboard | Alleen aggregaten vanaf 5 leden; geen cijfers per lid, geen export, geen berichten aan leden. |
| Naam | Rewarded blijft, met vaste ondertitel "focus samen" (NL) en "study squads" (EN). Een merkengemachtigde toetst Rewarded, Blokk, Lock In en Facedown vóór 1 december in de klassen 9, 35, 41 en 42. Beslisregel: is Rewarded alleen als beeldmerk te registreren of in klasse 35 geblokkeerd, en scoort een alternatief op de wachtlijst minstens gelijk, dan wisselen we vóór 19 januari 2027. De januarichallenge heet de Blokk-challenge. |
| Taglines | NL: "Telefoon weg. Squad aan." als actieregel; "Focus loont." blijft kandidaat-merkregel en wordt op de wachtlijst getoetst op geldassociatie. EN: "Phones down. Squad up." met "Focus pays off" als tweede regel. "Focus pays" vervalt. |
| Wachtlijsttest | De focus-hook ("Telefoon weg. Squad aan.") tegen een eerlijke geld-hook ("Word beloond voor je focusuren."), 50/50 per bezoeker, primaire maat aanmeldingen per bezoeker, secundair aandeel met een vriend en later D7 per arm; beslisregel: focus minstens gelijk op aanmeldingen en hoger op squad-aandeel. |
| Verliesarm B | Mag alleen in feitelijke taal ("je weekbudget is nu 100"), met de armregel bij elke mutatie; de jurist toetst de arm vóór 25 november op oneerlijke handelspraktijk. Negatief oordeel: arm B vervalt en iedereen krijgt arm A. |
| Hosting en verwerkers voor de pilot | Eén kleine server in de EU met dagelijkse versleutelde back-up; EU-verwerkers voor e-mail en sms met verwerkersovereenkomst; vastleggen in de DPIA. Buiten de bouw in deze repository. |

## 5. Architectuur in het kort

Eén repository met pnpm-workspaces. `packages/core` bevat alle regels als pure TypeScript zonder I/O (sessie-toestandsmachine en verifier, grootboek, dagdoel en doelbonus, squadstreak, deelnamegraad, heuristieken, loting, Belofte, referral, catalogus) en wordt door client en server gedeeld. `packages/contracts` bevat de API-schema's (zod), foutcodes en de eventtaxonomie en wordt vroeg bevroren zodat API en web parallel gebouwd kunnen worden. `apps/api` is een Hono-API op Node 22 met SQLite (better-sqlite3, terugval op de ingebouwde SQLite van Node), platte SQL-migraties, jobs om 04:00 (dagafsluiting, weekstart, opschoning), magic-link-auth met dev-inbox, CSRF, rate limiting, idempotentie en een onveranderbaar auditlog. `apps/web` is een Vite/React-PWA met platform-adapters voor Page Visibility, Wake Lock, monotone klok en een outbox in IndexedDB, i18n NL/EN, en het designsysteem als tokens. Tijd, willekeur, e-mail en sms zijn interfaces met een productie- en een testimplementatie, zodat alles zonder internet te testen is. Tests: Vitest op core (regel per specparagraaf), integratietests op de API, Playwright door de hele keten inclusief een gesimuleerde afgebroken sessie, en een deterministische demo-seed met een vereniging en squads.

De server is de scheidsrechter: duur, punten, streaks en ranglijsten komen uit servertijd en vastgelegde gebeurtenissen; de klok van de client telt nooit. Elke sessie draagt verificatieniveau 1, en de plafonds in core zijn per niveau gedefinieerd, zodat een websessie technisch nooit tot geld kan leiden. Dat is de verificatieladder uit het businessplan in code.

## 6. Ontwerp in het kort

Vijf tabs (Focus, Squad, Vereniging, Beloningen, Ik), op de laptop een zijbalk. Op elk scherm komt eerst focus, dan de squad, dan pas punten; tijdens de sessie staan er geen punten in beeld en is het scherm bijna zwart. Een afgebroken sessie is een gebeurtenis met reden, tijdstip en een korte weg terug, geen mislukking. Verdiende en verlote prijzen zijn twee visuele families, en trekkingen bestaan voor 16- en 17-jarigen niet in de interface. Eén tokenset in licht en donker, contrast boven WCAG 2.2 AA, rustige beweging zonder confetti of tellers. De mockups tonen elf telefoonschermen en het bestuursdashboard; alle namen en aantallen erin zijn fictief.

## 7. Releases en bouwscope

| Release | Datum | Inhoud |
|---|---|---|
| R1 | 2 december 2026 | Onboarding met leeftijdscheck en oefensessie, focus-engine, grootboek met doelbonus in twee armen, catalogus, squads, uitnodigingen, verenigingscode met plafond, promotiekit, bestuursdashboard, aanloopklassement, eventlog, fraudewachtrij met meldroute, vakantiepauze |
| R2 | 16 december 2026 | De Belofte, duels, deelbare bewijskaart |
| R3 | 5 januari 2027 | Prijsperiode Blokk-challenge, individuele prestatiechallenge, referral achter een vlag, trekkingsmodule achter een vlag die uit staat |
| Lancering | 19 januari 2027 | Geen nieuwe modules |

Bij tijdnood schrappen we in de volgorde van de spec; focus-engine, grootboek, squads, events en de fraudewachtrij schuiven nooit. Liever een week later starten dan een pilot zonder meting.

**Wat er in deze sessie gebouwd wordt.** De werkpakketten uit de architectuur (WP-0 tot en met WP-11) in drie golven: eerst fundament, core en contracts; dan API en web parallel; dan seed, end-to-end-tests en integratie. Doel: een werkende MVP die lokaal draait met `pnpm dev`, met de volledige R1-scope, de Belofte en duels uit R2, de kaart, en de R3-modules achter vlaggen voor zover de tijd het toelaat. Alles wat na de bouw open blijft, staat in de README met de reden.

## 8. Wat de pilot moet bewijzen

| Vraag | Meting | Drempel |
|---|---|---|
| Komen studenten terug? | Activatie, D7, D30 (kerst gecorrigeerd), W3 | ≥ 60%, ≥ 25%, ≥ 12% |
| Draagt de squad de retentie? | Aandeel actieven in een squad; D7 squad tegenover solo | ≥ 40%; ≥ 1,5× |
| Groeit het vanzelf? | K-factor per bron, met en zonder referral | ≥ 0,3 |
| Blijft fraude beheersbaar? | Gemarkeerde sessies; afgekeurd na herbeoordeling | < 5%; ≤ 5% |
| Kloppen de kosten? | Beloningskosten tegenover geboekt budget; kosten per actieve gebruiker per week | Binnen budget |
| Werkt verliesframing? (H-A) | Aandeel gebruikersdagen met gehaald dagdoel, arm A tegenover B | Richting, geen drempel |
| Blijft het effect staan? (H-B) | Geverifieerde minuten per week 18–31 januari, Belofte vroeg tegenover laat | Richting, geen drempel |
| Is er vraag naar inzet? (H-C) | Aandeel 18-plussers dat bij de reflectie interesse toont | Signaal |

Ontwerp, maten en analyses worden vóór 2 december voorgeregistreerd; een statisticus doet vóór 25 november een poweranalyse. Teamaccounts tellen nergens mee.

## 9. Wat vóór 2 december buiten de bouw geregeld moet zijn

Advocatenopinie over verdiende prijzen op deelnamegraad, de verliesarm, "zolang de voorraad strekt" en de vervaldatum; voorlegging van de trekkingsstructuur aan de Kansspelautoriteit; DPIA inclusief de rol van de vereniging en de bewaartermijnen; verwerkersovereenkomsten voor e-mail en sms; getekende partnerbijdragen of mijn eigen pilotbudget als dekking van de catalogus; toesteltest van Wake Lock en zichtbaarheid op minstens één iPhone (Safari en Home Screen-app) en twee Android-toestellen; de merkentoets; de voorregistratie; en de bevestiging van de tentamenweken per vereniging.
