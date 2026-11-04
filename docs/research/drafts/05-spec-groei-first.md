# Productspecificatie web-MVP — variant "groei-first"

*Rewarded, rol: productmanager. Concept voor de jury, 4 november 2026. Bindend kader: `docs/01-businessplan.md`. Bewijs: `docs/research/02`, `03`, `08` en `09`. Getallen die niet uit die documenten komen, staan er als **werkhypothese** of **aanname** bij. Een werkhypothese is een keuze die we in de pilot toetsen. Een aanname is iets wat we niet weten.*

## Samenvatting: wat deze variant anders doet

1. Elke module wordt beoordeeld op wat ze bijdraagt aan de drie groeiloops uit rapport 03: squads en duels als motor, de verenigingschallenge als koude start en deelbare bewijskaarten als versterker. Referral is een versneller met punten die pas na vesting vrijkomen. Geen enkele beloning hangt aan delen of uitnodigen als handeling.
2. We meten K per bron (squad, duel, vereniging, kaart, referral), zodat de pilot laat zien welke loop werkt en niet alleen dat er groei is. Referral gaat daarom pas op 16 december aan, twee weken na de pilotstart.
3. Een squaduitnodiging is een toegangsbewijs: wie via een vriend komt, slaat de wachtlijst over. Dat is de belangrijkste hefboom, en ze kost niets.
4. De verenigingsranglijst rekent op deelnamegraad, in poules naar grootte, met drempelprijzen naast de poulewinnaar. Het bestuursdashboard is in de eerste plaats een wervingsinstrument (promotiekit, QR, trend), zonder gegevens over individuele leden.
5. Bewijskaarten tonen uren, streaks en squad, nooit punten, beloningen of bedragen. Een kaart levert geen referralpunten op. De QR leidt naar een verificatiepagina die eerlijk zegt wat we bewijzen.
6. Trekkingen komen nergens in een groei-uiting voor: niet op kaarten, niet in uitnodigingen, niet in de promotiekit. Zo trekken ze geen beloningsjagers aan.
7. Frictie zit zo laat mogelijk. Registreren gaat in minder dan een minuut, telefoonverificatie pas bij de eerste verzilvering. Een duel heeft geen inzet in punten. Wel kun je een sociale inzet kiezen, zoals "de verliezer kookt".

---

## 1. Doel van de MVP en succescriteria

De web-MVP moet in de gesloten pilot (2 december 2026 tot 18 januari 2027) aantonen dat studenten via vrienden en vereniging blijven terugkomen naar geverifieerde focussessies, zonder geld als lokmiddel, zonder ontsporende fraude en binnen een budget dat uit geboekte omzet volgt. Het businessplan (§9) noemt de belangrijkste reden om van koers te veranderen: is de D7 van squadleden niet hoger dan die van solo-gebruikers, dan is de sociale loop niet echt. Deze variant zet dat criterium in het midden.

De MVP heeft daarom twee taken: het gedrag mogelijk maken waarop de go/no-go-criteria rusten (samen focussen, uitnodigen, een vereniging die werft), en dat gedrag zo meten dat we per loop kunnen zeggen of hij werkt. Wat geen van beide doet, krijgt een lagere prioriteit (hoofdstuk 8). Het pre-launch-criterium (≥ 1.500 aanmeldingen, ≥ 25% met een vriend) meet de landingspagina; de MVP neemt die koppelingen over, zodat vrienden in hetzelfde cohort binnenkomen met een squadvoorstel.

| Go/no-go pilot (businessplan §6) | Drempel | Wat de MVP levert om het te halen | Hoe we het meten (hoofdstuk 7) |
|---|---|---|---|
| Activatie | ≥ 60% | Registratie in minder dan een minuut, standaardsessie van 25 minuten, uitnodiging van een vriend als startpunt | `account_created` → eerste `session_completed` (≥ 25 min) binnen 24 uur |
| D7 | ≥ 25% | Squad met live aanwezigheid, dagdoel, squadstreak, duel | ≥ 1 `session_completed` op dag 7 |
| D30 | ≥ 12%, gecorrigeerd voor de kerstvakantie | Verenigingschallenge in januari, vakantiestand voor squads | Idem op dag 30; kerstdagen apart gemarkeerd |
| Aandeel actieven in een squad | ≥ 40% | Squad-first onboarding (experimentarm), uitnodigen als toegangsbewijs | Wekelijks actieven met actief squadlidmaatschap of lopend duel |
| K-factor | ≥ 0,3 | Uitnodigen bij squad, duel en vereniging; kaarten; referral vanaf 16 december | Uitnodigingen × conversie naar activatie, per cyclus van 7 dagen, per bron |
| Gemarkeerde sessies | < 5% (gezond < 3%) | Heuristieken uit hoofdstuk 6, uitleg bij elke afkeuring | `session_flagged` / `session_completed` |
| Beloningskosten binnen budget | Binnen geboekt budget | Puntengrootboek met dekkingscontrole, weekplafond als afgeleide van budget | Verzilverde waarde ten opzichte van gereserveerd budget |

Daarnaast gebruiken we de kwaliteitssignalen uit rapport 03 §4 als alarmbel, niet als go/no-go: D7 squad tegenover solo (gezond rond 1,5×), organische uitnodigingen (≥ 0,5 per actieve gebruiker per maand) en beloningsjagers (< 20% van de cohort). Het zijn inschattingen zonder publieke benchmark.

## 2. Gebruikers en hun taken

**De student (solo).** Hbo- of wo-student van 16 jaar of ouder, in de weken voor de tentamens. Komt via een vriend, vereniging, ambassadeur of kaart. Zijn taken: snel een sessie starten die telt, begrijpen waarom een sessie wel of niet telde, en zien dat hij vooruitgaat. Hij wil niet het gevoel krijgen dat hij voor centen studeert (rapport 08, "pay enough or don't pay at all").

**Het squadlid.** Dezelfde student in een groep van drie tot zes vrienden. Zijn taken: uitnodigen zonder te spammen, zien wie er nu focust, samen de streak in leven houden en een slechte dag opvangen zonder de groep te laten vallen. Het risico is ongezonde druk in de tentamenweek (rapport 03, loop A). Daarom bestaan de joker, de automatische pauze en het dagplafond.

**Het verenigingsbestuur.** Twee à drie bestuursleden, meestal de commissaris onderwijs of extern. Hun taken: aanmelden, werven in eigen kanalen, de stand volgen, de collectieve prijs binnenhalen en erover vertellen. Ze zien niet wat individuele leden doen; het businessplan (§8) sluit individuele monitoring door een instelling uit. In de koude start is het bestuur de belangrijkste verspreider, dus het dashboard is vooral een wervingsinstrument.

**De beheerder van Rewarded.** In de pilot de founder plus één operations-medewerker (**aanname**). Richt verenigingen, challenges, catalogus en budget in, voert trekkingen uit als ze zijn vrijgegeven en handelt fraude en beroepen af, altijd met menselijke herbeoordeling bij gevolgen voor beloningen.

Twee bijrollen zonder eigen interface: de **campusambassadeur** (persoonlijke code voor attributie, vergoeding per gebruiker die na zeven dagen nog actief is, businessplan §6) en de **partner** (financiert catalogus of prijs, krijgt alleen aggregaten).

| Rol | Belangrijkste taken in de MVP | Wat de rol nooit ziet of kan |
|---|---|---|
| Student | Sessie starten, uitleg lezen, punten verzilveren, kaart maken | Andermans sessies buiten de eigen squad of het eigen duel |
| Squadlid | Uitnodigen, live aanwezigheid, streak, joker, duel | Een openbare individuele ranglijst; punten van anderen |
| Bestuur | Aanmelden, werven, dashboard, promotiekit, prijs | Namen, sessies of uren van individuele leden; wie niet meedoet |
| Beheerder | Challenges, catalogus, budget, partners, trekkingen, fraudewachtrij, beroep | Sessies inzien zonder reden (elke inzage wordt gelogd) |

## 3. Kernflows stap voor stap

### 3.1 Onboarding en leeftijdscheck

1. Binnenkomst via uitnodigingslink, verenigings-QR, kaart, ambassadeurscode of wachtlijstuitnodiging. De bron wordt als eerste vastgelegd.
2. Bij een uitnodiging staat de uitnodiger bovenaan: "Sanne nodigt je uit voor squad Bieb 3e verdieping." De belofte gaat over focus en samen; beloningen staan in één regel eronder: "Na vijf uur focus kun je punten inwisselen bij partners. Geen geld, wel een bonus."
3. Registreren met e-mail en magische link (of Google/Apple als dat haalbaar is), zonder wachtwoord.
4. Geboortedatum. Onder 16: "Rewarded is er vanaf 16 jaar", en we bewaren niets. Bij 16–17 krijgt het account de vlag `minor` en verschijnen trekkingen nergens. Vanaf 18 worden trekkingen pas zichtbaar na een aparte opt-in. Bij winnaars volgt een leeftijdscontrole.
5. Weergavenaam: voornaam plus initiaal.
6. De focusregel op één scherm: "Je sessie telt zolang Rewarded zichtbaar op je scherm staat. Leg je telefoon met het scherm naar beneden neer, of laat het tabblad op je laptop open. Wissel je van app of gaat je scherm uit, dan stopt de sessie."
7. Dagdoel kiezen: 25, 50, 100 of 150 minuten, standaard 50.
8. In arm A van het uitnodigingsexperiment (§7.3) volgt nu "Wie focust er met je mee?" (squad maken of overslaan); in arm B pas na de eerste voltooide sessie. Wie via een squadlink kwam, slaat deze stap over.
9. Meldingen vragen we pas als er een squad is; analytische cookies zijn een aparte keuze.

### 3.2 Eerste focussessie

1. Eén grote knop: "Start 25 minuten" (50 en 90 zijn ook te kiezen).
2. De app vraagt een Wake Lock aan. Lukt dat niet, of staat batterijbesparing aan, dan zegt de app vóór de start dat het scherm kan uitgaan (rapport 09, §3.1).
3. De server legt de begintijd vast; de client stuurt elke 30 seconden een heartbeat met een servernonce.
4. Donker scherm met timer en de squadleden die nu focussen. Telefoon met het scherm naar beneden.
5. Aan het eind: "Klaar. 25 minuten telt." De gebruiker tikt binnen 15 minuten op "Opslaan"; punten worden direct bijgeschreven (Levitt e.a. 2016, rapport 08), met de voortgang naar het dagdoel en het squadmoment.
6. Pas daarna, onderaan, het vrijblijvende aanbod om een kaart te maken.

### 3.3 Sessie afgebroken

1. Bij `visibilitychange` naar `hidden` stopt de klok direct; de server legt het tijdstip vast.
2. Is de gebruiker binnen 60 seconden terug en is het struikelmoment van de sessie nog niet gebruikt, dan loopt de sessie door; de 60 seconden tellen niet mee. Dit is een voorstel aan de founder (hoofdstuk 9).
3. Anders is de sessie afgebroken: geen punten, telt niet voor streak, duel of challenge.
4. Het scherm legt uit: "Sessie gestopt om 14:32. Rewarded was niet meer zichtbaar, omdat je van app wisselde of je scherm uitging. Deze sessie levert geen punten op. Wat helpt: zet niet storen aan." Daaronder "Opnieuw starten" en "Klopt dit niet?" (een melding, geen beroep, want er is geen besluit).
5. "Eerder afronden" na ≥ 25 netto minuten in een sessie van 50 of 90 minuten telt de netto minuten. Overmoedige doelen worden zo niet bestraft (rapport 08, §7).
6. De squad ziet geen "gefaald", alleen dat "focust nu" verdwijnt.

### 3.4 Punten en catalogus

1. Het saldo staat in drie delen: beschikbaar, in controle en gebonden (referral), met de voortgang naar de inverdiendrempel ("3 uur 10 van 5 uur").
2. De catalogus toont alleen gedekte beloningen, met voorraad en betalende partner.
3. Bij de eerste verzilvering verifieert de gebruiker eenmalig zijn telefoonnummer (rapport 09, trede 1). Voucher direct in de app; fysieke prijzen via vereniging of partner.
4. Bij het weekplafond: "Maandag kun je weer verzilveren. Je punten blijven staan." Geen aanbod om het plafond te verhogen.

### 3.5 Squad aanmaken en uitnodigen

1. Naam kiezen (gemodereerd) en eventueel een vaste studietijd.
2. Eén link per squad, zeven dagen geldig, voor maximaal vijf genodigden. WhatsApp opent met een aanpasbare tekst: "Ik focus de komende weken met Rewarded. Doe je mee in onze squad Bieb 3e verdieping? Je ziet live wie er studeert en we houden samen een streak vol." Geen punten of prijzen, ook niet in de linkpreview.
3. Een genodigde slaat de wachtlijst over: de link is zijn toegangsbewijs.
4. Tot drie leden heet de squad "in opbouw"; de oprichter focust intussen solo. Na zeven dagen met minder dan drie leden stelt de app een duel voor, of één keer een nieuwe link.
5. Daarna komt een uitnodigingsvoorstel alleen bij een vrije plek (vertrek of meer dan 14 dagen pauze), hooguit één keer per week.

### 3.6 Duel

1. Uitdagen: een squadgenoot, eerdere duelpartner of nieuwe persoon via een link.
2. Duur 3 of 7 dagen, en een sociale inzet uit een vaste lijst ("de verliezer kookt", "haalt koffie", "de winnaar kiest de playlist", of geen). Geen punten, geen geld, geen vrij tekstveld.
3. Accepteren binnen 48 uur, anders vervalt het duel. Beide spelers zien de stand per dag.
4. De winnaar krijgt een badge; beiden de voltooiingsbonus bij het minimum (§4.6). Daarna: revanche of samen een squad.

### 3.7 Verenigingschallenge en bestuursdashboard

1. Na een schriftelijke toezegging maakt de beheerder de vereniging aan en nodigt twee à drie bestuursleden uit.
2. Het bestuur vult het ledenaantal in met een bron (jaarverslag of ALV-stuk) en kiest eventueel subgroepen (jaarlagen, commissies), die pas zichtbaar zijn vanaf vijf actieve leden.
3. Het bestuur krijgt een lidmaatschapscode, QR's per kanaal en de promotiekit.
4. Een lid scant de QR en is gekoppeld; nieuwe gebruikers doorlopen §3.1 met de vereniging al ingevuld.
5. In december loopt een aanloopklassement zonder prijs, als wervingsreden; in januari de prijsperiode.
6. Het dashboard toont dagelijks stand, trend en afstand tot de volgende drempel ("nog 12 actieve leden tot 25%").
7. De uitslag wordt pas na de fraudecontrole (§6) vastgesteld en bekendgemaakt, met een deelbare verenigingskaart.

### 3.8 Verdiende prijs

1. De beheerder publiceert criterium, aantal, waarde, partner en periode, bijvoorbeeld "elke dag van de tentamenweek minstens twee uur".
2. De gebruiker ziet de voortgang, met de tekst "Verdiend, niet verloot".
3. Zijn er meer kandidaten dan prijzen, dan beslist een vooraf gepubliceerde volgorde op prestatie: gehaalde dagen, dan gecapte minuten, dan het tijdstip van het halen. Er wordt nooit geloot.
4. Verificatie (§4.9) en uitkering na 14 dagen; bij afwijzing een reden en beroep.

### 3.9 Verlote prijs (18+, spelvoorwaarden)

1. Alleen voor 18+ met opt-in, achter een feature flag die pas aangaat na de advocatenopinie en het voorleggen aan de Kansspelautoriteit (businessplan §8).
2. Wie zijn weekdoel haalt, doet gratis mee; los van Plus of betaling.
3. Het scherm toont spelvoorwaarden, prijzen en de kans als getal, bijvoorbeeld: "Vorige week 412 deelnemers voor 3 prijzen, ongeveer 1 op 137" (illustratieve getallen).
4. Trekking met een controleerbare toevalsgenerator, verificatie van leeftijd, identiteit en sessies (§4.9).
5. Trekkingen komen niet op kaarten, in uitnodigingen of in de promotiekit.

### 3.10 Deelbare bewijskaart

1. Aanleidingen: einde van een sessie (alleen onderaan), mijlpaal (10, 25, 50, 100 uur), squadweek, gewonnen duel, verenigingsuitslag.
2. Standaard: voornaam, uren, streak, en de squadnaam als alle leden dat toestaan. Achternaam, instelling en vereniging staan standaard uit.
3. Story (9:16) of vierkant, met verificatiecode en QR. Delen via de Web Share API of opslaan; wij loggen alleen dat het deelmenu openging.
4. De QR opent `/v/<code>` op ons domein: datum, netto duur, "trede 1: Rewarded stond zichtbaar op het scherm" en een knop "Focus ook" naar de wachtlijst met voorrang.

### 3.11 Referral

1. Vanaf 16 december heeft elke gebruiker een persoonlijke link; squad- en dueluitnodigingen tellen ook als referral.
2. Een nieuwe registratie start de vesting: drie tellende sessies van ≥ 25 minuten binnen zeven dagen. De uitnodiger ziet alleen "Joris: 2 van 3".
3. Bij vesting krijgen beiden gebonden referralpunten (§4.11). Zonder vesting vervalt de referral stil.

## 4. Functionele specificatie per module

### 4.1 Focus-engine

De server is de bron van waarheid voor de tijd: de client geeft gebeurtenissen door, de server rekent. Netto tijd is de som van de intervallen waarin de pagina zichtbaar was en heartbeats op tijd binnenkwamen. Op de laptop telt een sessie zolang het tabblad zichtbaar is (gesplitst scherm mag). Een `blur` stopt de sessie niet maar wordt gelogd; rapport 09 (§3.2) noemt het een zwak signaal, en wie in een ander venster werkt, kan legitiem studeren.

| Regel | Waarde | Toelichting |
|---|---|---|
| Sessielengtes | 25, 50, 90 minuten | Businessplan §4 |
| Wat telt | Sessie voltooid na het geplande einde, of eerder afgerond na ≥ 25 netto minuten | Netto minuten |
| Claimvenster | 15 minuten na het geplande einde | Daarna telt de sessie tot het geplande einde, maar staat ze in controle (§6) |
| Heartbeat | Elke 30 s, met nonce van de server; > 90 s zonder heartbeat telt niet | Rapport 09, §3.3 |
| Struikelmoment | 1 per sessie, maximaal 60 s, telt niet mee | Werkhypothese, voorstel aan de founder |
| Geplande pauze | 25 min: geen; 50 min: 1 × 5 min; 90 min: 2 × 5 min; via de knop, telt niet mee | Werkhypothese; tijdens een pauze mag de pagina verborgen zijn |
| Afgebroken | Verborgen > 60 s, of verborgen na gebruik van het struikelmoment, of handmatig gestopt vóór 25 netto minuten, of pauze overschreden | Geen punten, telt nergens mee |
| Gelijktijdige sessies | 1 per account, afgedwongen door de server | Een tweede start beëindigt de eerste niet, maar wordt geweigerd |
| Wake Lock | Aanvragen bij de start en opnieuw bij `visibilitychange` naar `visible` | Niet ondersteund: waarschuwing, geen blokkade |
| Ondersteunde browsers | Wake Lock: Chrome 84+, Firefox 126+, Safari 16.4+ (macOS), iOS 18.4+ | Compatibiliteitsdata, geen veldtest; testen op echte toestellen (rapport 09, §3.1) |

De uitleg hoort bij de functie: elke afgebroken sessie toont reden en tijdstip, en de pagina "Hoe we tellen" geeft de eerlijke claim uit rapport 09 (§8) plus wat we niet weten (tweede apparaat, echt leren). Sweatcoin laat zien dat strenger tellen dan je uitlegt negatieve mond-tot-mondreclame oplevert (rapport 03, §1); voor een groei-first product is dat de duurste fout.

### 4.2 Puntengrootboek

Het grootboek is append-only. Elke regel heeft een type (`earn_session`, `earn_goal`, `earn_squad`, `earn_duel`, `earn_referral`, `budget_grant`, `budget_deduct`, `redeem`, `expire`, `reverse`), een status (beschikbaar, in controle, gebonden, vervallen) en een bronverwijzing; het saldo is altijd afgeleid. De verplichting (uitstaande punten × puntwaarde) staat dagelijks naast het geboekte budget (businessplan §5).

De ratio is vast en gepubliceerd: 1 punt per netto geverifieerde minuut. Bijstelbaar is alleen het weekplafond voor verzilvering, dat met de formule uit hoofdstuk 5 uit het geboekte budget volgt en een week vooraf wordt aangekondigd. Een slechter budget betekent dus een lager plafond, geen ongedekte belofte. Punten zijn geen geld en geven geen recht op een bepaalde beloning; dat staat in gewone taal op het puntentabblad.

| Regel | Waarde |
|---|---|
| Inverdienperiode | 300 netto minuten (5 uur) uit sessies vóór de eerste verzilvering; referral- en bonuspunten tellen niet mee |
| Dagplafond op verdienen | 480 sessiepunten per dag (8 uur), gelijk aan het plafond per lid per dag; daarboven tellen minuten wel voor de eigen statistiek, maar niet voor punten of ranglijsten |
| Weekplafond op verzilvering | Volgt uit het budget (hoofdstuk 5); werkhypothese 600 punten per week |
| Vervaldatum | 12 maanden na bijschrijving, op volgorde van oudste eerst; melding 30 dagen vooraf |
| Terugboeking | Alleen na een fraudebesluit met menselijke herbeoordeling; met reden |

### 4.3 Catalogus en verzilvering

Een catalogusitem gaat pas live als voorraad × inkoopwaarde gedekt is door een budgetreservering van partner of challenge; anders weigert de beheeromgeving. Prijs in punten = inkoopwaarde / puntwaarde, afgerond op 50. Vouchercodes worden vooraf geüpload of via een partner-API opgehaald en zijn één keer uitgeefbaar; een uitgegeven voucher wordt na een later fraudebesluit niet teruggenomen, wel wordt het account beperkt. Geen verrassingsbeloningen, loot boxes of variabele prijzen; "bijna op" alleen onder 10% echte voorraad. Is de voorraad op tijdens het afrekenen, dan wordt niets afgeschreven; een kapotte voucher levert via "Werkt niet" binnen twee werkdagen een nieuwe code of de punten terug.

### 4.4 Squads

Een gebruiker zit in hooguit één squad, zodat "squad of solo" scherp meetbaar blijft (open vraag 7). Live aanwezigheid ververst elke 15 seconden: "focust nu (nog 32 min)", "vandaag gehaald", "op pauze" of niets. In stille modus telt een lid mee zonder live zichtbaar te zijn.

| Regel | Waarde | Reden |
|---|---|---|
| Grootte | 3–6 leden; "in opbouw" met 1–2 | Businessplan §4 |
| Squaddag gehaald | Minstens de helft van de actieve leden haalt zijn dagdoel, met een minimum van 2 | Werkhypothese: alle leden is te kwetsbaar, één lid is geen squad |
| Squadstreak | Aaneengesloten gehaalde squaddagen; weekenddagen tellen alleen als de squad ze in de instellingen aanzet | Werkhypothese |
| Rustdag-joker | 1 per squad per week, automatisch ingezet op de eerste gemiste dag | Businessplan §4; automatisch, zodat niemand de schuld krijgt |
| Automatische pauze | Na 7 dagen zonder voltooide sessie; telt niet meer mee in "actieve leden"; komt terug bij de volgende sessie | Businessplan §4 |
| Melding pauze | Alleen neutraal: "Joris staat op pauze" | Geen schaamte, geen dark pattern |
| Vakantiestand | Eén keer per squad, 7–14 dagen: de streak staat stil en niemand wordt gepauzeerd | Werkhypothese, voor de kerstvakantie (rapport 03, §5) |
| Squadbonus | 50 punten per lid per volle squadweek (5 squaddagen in een week) | Werkhypothese; beloont samen focussen, niet het compleet maken van de squad |
| Meldingen | Hooguit 1 per dag per squad; opt-in | Rapport 03 (risico op spam) |

Rapport 03 stelt een squadbonus voor bij het compleet maken van een squad. Dat neem ik niet over: het is een beloning op uitnodigen. Hier hangt de bonus aan een volle squadweek, dus aan samen focussen.

### 4.5 Uitnodigen en toegang (dwarsdoorsnede)

Drie loops hangen aan uitnodigen, dus het krijgt eigen regels. Elke uitnodiging is een object met bron (`squad`, `duel`, `club`, `personal`), maker, geldigheid en maximum aantal gebruikers; dat levert de attributie voor K.

- Het systeem stelt een uitnodiging alleen voor op vier momenten: squad aanmaken, duel starten, een vrije squadplek (hooguit één keer per week) en aansluiten bij een verenigingschallenge ("neem je squad mee"). Er zijn geen pop-ups na sessies, geen herinneringen om uit te nodigen en geen beloning voor het versturen.
- Een uitnodigingstekst gaat over focus en samen. Punten, catalogus en prijzen staan er niet in. Testen we varianten van de tekst, dan alleen binnen die grens.
- Een squad- of duellink is een toegangsbewijs voor de gesloten pilot. Een persoonlijke link na 16 december geeft voorrang op de wachtlijst, maar geen directe toegang. Zo blijft de pilotomvang (300–800 gebruikers, rapport 03, §5) beheersbaar.
- Een verenigingscode geeft toegang aan leden, tot het plafond van §4.7.
- We importeren geen contacten en we lezen geen adresboek uit.

### 4.6 Duels

| Regel | Waarde |
|---|---|
| Deelnemers | 2; per gebruiker hooguit 2 lopende duels |
| Duur | 3 of 7 dagen, start de volgende ochtend om 06:00 |
| Score | Netto geverifieerde minuten, gecapt op 480 per dag; bij gelijke stand: aantal dagen met gehaald dagdoel |
| Wat telt | Alleen voltooide, niet-gemarkeerde sessies; gemarkeerde sessies tellen pas na vrijgave |
| Voltooiingsbonus | 25 punten per speler die minstens 3 sessies deed (bij 3 dagen: 2), ongeacht de uitslag |
| Inzet | Alleen sociaal, uit een vaste lijst; nooit punten of geld |
| Winnaar | Badge en vermelding in de duelgeschiedenis |

Geen puntinzet is een bewuste keuze: een transfer van verliezer naar winnaar is het pool-model in het klein (businessplan, besluit 3). De sociale inzet levert de content-hook uit rapport 03 ("de verliezer kookt") zonder waardeoverdracht.

### 4.7 Verenigingschallenge

Rapport 03 noemt dit het beste kanaal voor de koude start, met als risico's dat grote verenigingen altijd winnen en dat telefoons "meedraaien". Van de twee opties in het businessplan kiest deze variant deelnamegraad als hoofdklassement: rangschikken op gemiddelde per actief lid ontmoedigt een bestuur om lichte gebruikers te werven, terwijl juist die werving de koude start maakt. Het gemiddelde per actief lid verschijnt als tweede klassement, "intensiteit", zonder prijs.

| Regel | Waarde | Reden |
|---|---|---|
| Actief lid | Gekoppeld lid met minstens 2 tellende sessies van ≥ 25 min in de challengeweek | Werkhypothese; drempel laag genoeg voor werving, hoog genoeg tegen nepleden |
| Deelnamegraad | Actieve leden / max(opgegeven ledenaantal, gekoppelde leden) | De noemer kan niet kleiner zijn dan het aantal aangemelde leden |
| Intensiteit | Gemiddelde gecapte geverifieerde focusminuten per actief lid per dag | Tweede klassement, geen prijs |
| Plafond per lid per dag | 480 minuten | Businessplan §4 (werkhypothese 8 uur) |
| Rustdag-joker | 1 per lid per week: een gemiste dag telt niet als nul voor de intensiteit | Businessplan §4 |
| Poules | Naar ledenaantal: < 150, 150–500, > 500 | Aanname; kleine, vergelijkbare groepen (Duolingo-leagues, rapport 03, §1) |
| Lidmaatschapscode | Per week vernieuwd; maximaal 1,1 × het opgegeven ledenaantal | Zonder namenlijst tegen het koppelen van niet-leden |
| Openbaar | Ranglijst per poule en per stad, alleen verenigingsnamen en geaggregeerde cijfers | Businessplan §4 |
| Aanloopklassement | 2 december tot de start van de prijsperiode; geen prijs | Wervingsreden voor het bestuur in december |
| Prijsperiode | Werkhypothese: 5 tot en met 18 januari 2027 | Tentamendata per instelling **niet geverifieerd** (rapport 03, §5) |

**Collectieve prijs.** Beide soorten zijn verdiend. De poulewinnaar krijgt de hoofdprijs; elke vereniging die de drempel haalt (werkhypothese: deelnamegraad ≥ 25% en intensiteit ≥ 60 minuten per dag) krijgt een drempelprijs. Zo is de challenge niet na een week beslist voor iedereen behalve de koploper. Het aantal verenigingen ligt vooraf vast, dus de maximale prijskost is vooraf te dekken. Zolang de verificatie op trede 1 staat, blijven prijzen klein (rapport 03, §6): werkhypothese hoofdprijs ≤ €250 en drempelprijs ≤ €100, in natura. De jurist toetst de structuur nog.

**Bestuursdashboard.** Het dashboard is mobile-first en heeft vier tabbladen:

| Tabblad | Inhoud | Regels |
|---|---|---|
| Stand | Positie in de poule en de stad, deelnamegraad, intensiteit, afstand tot de vereniging erboven en tot de volgende drempel | Ververst elk uur; definitief na de fraudecontrole |
| Werving | Aangemelde en actieve leden per dag, aandeel leden in een squad, aantal squads binnen de vereniging, scans per QR-bron (poster, story, WhatsApp) | Alleen aantallen; subgroepen pas vanaf 5 actieve leden |
| Promotiekit | Teksten, storysjabloon, poster met QR per bron, dia, "wat je wel en niet belooft" | Teksten noemen geen bedragen, geen trekkingen en geen individuele beloningen |
| Prijs | Status van hoofd- en drempelprijs, partner, levering | Na afloop een deelbare verenigingskaart |

Het dashboard toont geen namen, geen individuele uren en geen lijst van wie niet meedoet. Wel het percentage gemarkeerde sessies van de vereniging, met de uitleg dat die pas na vrijgave meetellen: fraude wordt zichtbaar zonder dat het bestuur individuen kan aanwijzen. Export alleen als CSV met dezelfde aggregaten. De rol van de vereniging onder de AVG is een open vraag.

### 4.8 Stad tegen stad

Zodra twee steden meedoen, toont de openbare pagina een stadsscore: het gemiddelde van de deelnamegraad van de deelnemende verenigingen in de stad, ongewogen. Er is geen prijs. Het is een verhaal voor de universiteitsbladen (rapport 03, kanaal pers). Dit is een should voor de pilot.

### 4.9 Prijzen: verdiend en verloot

| Kenmerk | Verdiende prijs | Verlote prijs |
|---|---|---|
| Wie krijgt hem | Iedereen die het criterium haalt, tot het gepubliceerde aantal, in een deterministische volgorde op prestatie | Een of meer winnaars uit de deelnemers die hun weekdoel haalden |
| Leeftijd | 16+ (collectief) of 16+ (individueel, tenzij de partner 18+ eist) | 18+, opt-in |
| Voorwaarde | Prestatie, geverifieerd | Weekdoel; geen betaling, geen Plus |
| Communicatie | "Verdiend" | "Kans", met het aantal deelnemers van vorige week |
| Grens | Werkhypothese ≤ €50 per individuele prijs, ≤ €250 collectief, op trede 1 | Elk spel ≤ €4.500 of binnen de jaarlimiet (€100.000, één spel, twintig trekkingen) |
| Status | Live in de pilot na juridische check van de prijsstructuur | Feature flag uit tot de advocatenopinie en het voorleggen aan de Ksa |

**Winnaarsverificatie.** Een individuele winnaar doorloopt: (1) menselijke controle van de sessies op de signalen uit hoofdstuk 6; (2) geverifieerd telefoonnummer; (3) botcontrole bij het claimen; (4) bij trekkingen en prijzen boven €50 een leeftijds- en identiteitscontrole met een document dat direct daarna wordt verwijderd. Uitkering na 14 dagen (rapport 09, trede 1). Bij een collectieve prijs wordt de uitslag zonder gemarkeerde sessies herberekend; bij clusters op weinig apparaten volgt een gesprek met het bestuur.

**Kansspelbelasting.** De beheeromgeving toont per spel de kansspelbelasting als kostenpost: prijswaarde × 37,8/62,2 ≈ 0,608 × prijswaarde, omdat de organisator betaalt (rapport 02, §5.1). Een spel met €300 aan prijzen kost dus ongeveer €482. Jaarlimiet en aantal trekkingen worden opgeteld en overschrijding geweigerd. De seed van de toevalsgenerator wordt vóór sluiting als hash gepubliceerd en na de trekking zelf, zodat manipulatie achteraf te controleren is.

### 4.10 Deelbare kaarten

De kaart laat focus zien, geen beloning. Rapport 03 (§2C) waarschuwt dat "€0,60 voor drie uur studeren" een meme tegen ons is; deze variant gaat verder en laat ook ontgrendelde beloningen en het puntensaldo weg, omdat die precies de beloningsjager aantrekken.

| Regel | Waarde |
|---|---|
| Delen | Altijd opt-in, op initiatief van de gebruiker |
| Standaard op de kaart | Voornaam, uren of duur, streak, squadnaam (als alle leden dat toestaan), Rewarded-logo |
| Standaard uit | Achternaam, instelling, vereniging |
| Nooit op de kaart | Punten, bedragen, beloningen, trekkingen, ranglijstposities van individuen |
| Verificatie | Korte code en QR naar `/v/<code>`, een pagina met datum, netto duur, trede ("pagina zichtbaar") en wat dat niet bewijst |
| Beloning | Geen, ook geen referralpunten voor aanmeldingen via de kaart |
| Attributie | De bron `card` wordt gelogd voor de meting van K, zonder gevolg voor punten |
| Intrekken | De gebruiker kan een verificatiepagina offline halen; de QR toont dan "niet meer beschikbaar" |

De verificatiepagina toont niet meer dan de kaart en is `noindex`. Verticale timelapse-video is een could: de MVP gebruikt geen camera (businessplan §8).

### 4.11 Referral

| Regel | Waarde | Reden |
|---|---|---|
| Start | 16 december 2026 | K uit squads eerst zonder referral meten |
| Wie krijgt punten | Uitnodiger en genodigde, elk 150 | Werkhypothese; ongeveer 2,5 uur focus |
| Vestingvoorwaarde | Genodigde doet binnen 7 dagen na registratie 3 tellende sessies van ≥ 25 min | Businessplan §6 |
| Status voor vesting | Niet zichtbaar in het saldo; alleen "onderweg" in het uitnodigingsoverzicht | Geen belofte die nog niet verdiend is |
| Na vesting | Gebonden: per verzilvering hooguit 50% uit referralpunten | "Alleen te verzilveren samen met eigen punten" |
| Maximum | 5 gevestigde referrals per uitnodiger per maand | Businessplan §6 |
| Uitsluiting | Zelfde apparaatkenmerk of zelfde telefoonnummer als de uitnodiger; ambassadeurscodes geven geen referralpunten aan het ambassadeursaccount | Rapport 09, §7.1 |
| Inverdienperiode | Referralpunten tellen niet mee voor de 5 uur | Zie §4.2 |
| Vervaldatum | 12 maanden, zoals alle punten | — |
| Inzet | Nooit, ook niet later in de inzetlaag | Art. 1a Wok, piramide (businessplan §6) |

### 4.12 Profiel, privacy en leeftijd

Het profiel bevat weergavenaam, avatar (initialen of icoon, geen foto), dagdoel, vereniging (optioneel), deelinstellingen, stille modus en leeftijdsklasse (`16_17` of `18_plus`, met de datum van 18 worden; de geboortedatum zelf bewaren we niet). Verwerking blijft minimaal (businessplan §8): sessietijdstempels, zichtbaarheidsgebeurtenissen, squadlidmaatschap en voor fraude een gehasht apparaatkenmerk en ingekort IP. Werkhypothese bewaartermijnen: IP 30 dagen, ruwe heartbeats 90 dagen. Download en verwijderen zijn selfservice; verwijderen anonimiseert ook de bijdrage aan verenigingscijfers. Een DPIA is vóór de pilot verplicht.

### 4.13 Beheeromgeving

| Onderdeel | Functies | Waarborg |
|---|---|---|
| Verenigingen en challenges | Aanmaken, poules, perioden, codes, prijzen, uitslag vaststellen | Uitslag pas na fraudecontrole; vier ogen bij publicatie |
| Catalogus | Items, voorraad, vouchercodes, prijs in punten | Publiceren alleen bij volledige budgetdekking |
| Partners en budget | Contract, geboekt bedrag, reservering per item of challenge, verplichting tegenover budget | Waarschuwing als de verplichting boven 80% van het vrije budget komt |
| Trekkingen | Spel, prijzen, KSB-kostenpost, jaarlimiet, seed-hash, trekking, winnaars | Feature flag; spel ≤ €4.500 afgedwongen |
| Fraudewachtrij | Gemarkeerde sessies met signalen, besluit met redencode, beroep | Een besluit met gevolgen voor beloningen alleen door een mens; beroep bij een tweede persoon |
| Experimenten | Toewijzing, armen, bevriezing | Geen wijziging van armen tijdens de pilot zonder logregel |
| Auditlog | Elke inzage van sessiegegevens en elk besluit | Niet te verwijderen |

## 5. Puntenmodel en parameters

Het budget bepaalt het weekplafond, niet de ratio. De formule:

> weekplafond (punten) = geboekt beloningsbudget voor de periode / (puntwaarde × verwachte verzilveraars per week × aantal weken)

Illustratie, met alle getallen als werkhypothese: met een puntwaarde van €0,002, 300 verzilveraars per week (de helft van een pilot van 600, het midden van 300–800 uit rapport 03) en 6 weken komt een weekplafond van 600 punten (€1,20 per persoon per week) neer op een maximaal risico van €2.160. Dat bedrag moet geboekt zijn voordat de catalogus opengaat. Rapport 03 begroot €1.500–€4.000 voor verenigingsprijzen en borrels. Rapport 02 gaat uit van hooguit 20% van de geboekte sponsoromzet als eigen bijdrage. Is er minder geboekt, dan daalt het plafond, en dat wordt een week vooraf aangekondigd. Het echte risico ligt lager, omdat de inverdienperiode en de voorraad verzilvering beperken. Maar we rekenen met het maximum.

| Parameter | Waarde | Reden | Varieert in de pilot? |
|---|---|---|---|
| Ratio | 1 punt per netto geverifieerde minuut | Vast en gepubliceerd (businessplan §4); input, geen output (rapport 08) | Nee |
| Sessielengtes | 25 / 50 / 90 min | Businessplan §4 | Nee |
| Dagplafond verdienen | 480 sessiepunten | Plafond 8 uur per dag | Nee |
| Dagdoel | 25 / 50 / 100 / 150 min, standaard 50 | Zelfgekozen doel beperkt verdringing (rapport 08, §7) | Nee |
| Weekdoel | 5 gehaalde dagdoelen in een week (ma–zo) | Ruimte voor rust | Nee |
| Doelbonus, arm W (winst) | +50 punten per gehaalde dag, hooguit 250 per week | Gelijke verwachte waarde als arm V | **Ja** |
| Weekbudget, arm V (verlies) | Maandag 250 punten "dit weekbudget is van jou"; −50 per gemiste dag vanaf de derde gemiste dag; definitief bijgeschreven op zondag 23:59 | Patel e.a. 2016 (rapport 08, §1.2 en §7) | **Ja** |
| Inverdienperiode | 300 netto minuten | Businessplan §4 | Nee |
| Weekplafond verzilvering | 600 punten (afgeleid, zie formule) | Budget als afgeleide | Alleen via het budget, nooit per arm |
| Puntwaarde (intern) | €0,002 | Werkhypothese; vast vóór de pilot | Nee |
| Squadbonus | 50 punten per lid per volle squadweek | Samen focussen belonen | Nee |
| Duelbonus | 25 punten bij voltooiing | Meedoen, niet winnen | Nee |
| Referral | 150 + 150, vesting 3 × 25 min in 7 dagen, max 5 per maand, 50% gebonden | Businessplan §6 | Aan/uit in de tijd (vanaf 16 december) |
| Vervaldatum | 12 maanden | Verplichting begrenzen | Nee |
| Struikelmoment | 1 × 60 s per sessie | Voorstel, zie §3.3 | Nee (open vraag) |
| Claimvenster | 15 min | Tegen onbeheerde toestellen | Nee |
| Uitnodigingsmoment | Arm A: squadvoorstel in de onboarding; arm B: na de eerste voltooide sessie | Groeilens | **Ja** |

**De verliesframing-arm in detail.** In arm V verschijnt op maandag om 06:00 een weekbudget van 250 punten, zichtbaar als "jouw weekbudget" maar nog niet verzilverbaar. Twee gemiste dagen per week zijn vrij (zeven dagen, doel vijf); elke verdere gemiste dag kost 50. Op zondag om 23:59 wordt het restant bijgeschreven. In beide armen is de uitkomst dus 50 × min(5, gehaalde dagen). In arm W komt er per gehaalde dag 50 bij, tot 250 per week. Sessiepunten zijn in beide armen gelijk. Het verschil zit alleen in de presentatie van de doelbonus. Het grootboek reserveert in beide armen 250 punten per gebruiker per week. De rustdag-joker geldt niet voor dit budget, anders zijn de armen niet gelijk. Het gaat om eigen punten, nooit om eigen geld, en dat staat er ook bij. De tekst in arm V mag niet beschuldigend zijn. Wel: "Vandaag je doel halen houdt je weekbudget op 250." Niet: "Je verliest punten!"

## 6. Anti-fraude in de web-MVP

**Wat we eerlijk claimen.** Een web-MVP bewijst alleen dat de pagina zichtbaar was op één browser tussen A en B, en dat is goedkoop te vervalsen met een tweede apparaat, een emulator of een headless browser (rapport 09). Daarom geen geld, kleine prijzen en harde plafonds. App, verificatiepagina en promotiekit gebruiken dezelfde zin: "Rewarded telt je focustijd zolang de app zichtbaar op je scherm openstaat." Nooit "bewezen focus" als verificatieclaim, nooit "we weten dat je je telefoon niet gebruikte".

**Wat we loggen.** Per sessie: servertijdstempels van start, einde, heartbeats en claim; zichtbaarheidsgebeurtenissen; aanvraag en vrijgave van de Wake Lock; `blur` en `focus` op desktop; nonce-fouten; het verschil tussen de klok van de client en de servertijd; user agent; de vlag `navigator.webdriver`; een gehasht apparaatkenmerk (zo weinig mogelijk eigenschappen, alleen voor fraude); een ingekort IP-adres. Per account: telefoonnummer (gehasht, vanaf de eerste verzilvering), uitnodigingsrelaties en verenigingskoppeling.

| Heuristiek | Wanneer markeren | Waarom |
|---|---|---|
| F1 Meerdere accounts per apparaat | > 2 accounts met hetzelfde apparaatkenmerk die in dezelfde week sessies doen | Meerdere accounts zijn goedkoop op het web (rapport 09, §7.1) |
| F2 Synchrone sessies | ≥ 3 accounts op hetzelfde ingekorte IP met starttijden binnen 60 s, drie keer in een week | Patroon van een device farm |
| F3 Automatisering | `navigator.webdriver` waar, of bekende kenmerken van een headless browser | Scripts en headless browsers |
| F4 Heartbeat-anomalie | > 2 nonce-fouten per sessie, of een klokverschil van meer dan 120 s | Gemanipuleerde client |
| F5 Plafondjagen | Drie dagen achter elkaar ≥ 450 minuten | Onrealistisch in de tentamenweek, of een onbeheerd toestel |
| F6 Claim op het laatste moment | > 80% van de sessies in een week pas geclaimd na meer dan 12 min | Onbeheerde toestellen |
| F7 Referralcluster | Genodigden met het apparaatkenmerk of IP van de uitnodiger, of een ring van uitnodigingen | Zelf-uitnodigen (rapport 03, §2) |
| F8 Verenigingspiek | Een stijging van > 20 actieve leden in 48 uur, waarvan > 50% op ≤ 3 apparaatkenmerken of IP's | "Telefoons laten meedraaien" (rapport 03, loop B) |
| F9 Desktop zonder aandacht | `blur` > 90% van de sessieduur, vijf sessies achter elkaar | Zwak signaal; alleen markeren in combinatie met een ander signaal |

**Wat er met een gemarkeerde sessie gebeurt.** Punten worden bijgeschreven als "in controle". De sessie telt mee voor de squadstreak (sociaal, weinig waard), maar pas na vrijgave voor challenge, duel en prijzen. De gebruiker ziet een begrijpelijke reden ("we zagen meerdere accounts op dit apparaat") zonder de exacte drempel. Een beheerder beslist binnen 72 uur (vrijgeven, afkeuren, account beperken); zonder besluit volgt vrijgave, behalve bij F3, waar eerst een mens kijkt. Elke afkeuring krijgt een redencode en uitleg.

**Beroep.** Tegen elke afkeuring, terugboeking of beperking kan de gebruiker in de app in beroep. Een andere beheerder beslist binnen vijf werkdagen, gemotiveerd. Bij een gegrond beroep komen de punten terug en telt de sessie alsnog, ook voor een challenge-uitslag die nog niet definitief is; een definitieve uitslag wordt niet herzien, en dat staat vooraf in de voorwaarden.

**Pilotgrenzen.** Boven 5% gemarkeerd geldt de no-go, en gaan de beloningen in de gratis laag omlaag tot er native verificatie is (businessplan §9). Na de pilot publiceren we hoeveel sessies onterecht zijn afgekeurd en onterecht beloond (rapport 09, §8).

## 7. Meetplan

### 7.1 Eventtaxonomie

Alle events komen in een eigen eventtabel met `event_name`, `user_id` (gepseudonimiseerd), `ts_server`, `arm_invite`, `arm_goal`, `acq_source` en de eigenschappen hieronder. Analytische events vragen toestemming. Events die nodig zijn voor de dienst en de fraudebestrijding (sessies, grootboek) worden gegrond op uitvoering van de overeenkomst en gerechtvaardigd belang. Dat moet de DPIA nog bevestigen.

| Event | Eigenschappen | Wanneer |
|---|---|---|
| `landing_viewed` | `acq_source`, `invite_id`, `club_id` | Eerste paginaweergave |
| `account_created` | `age_band`, `acq_source`, `invite_id`, `invite_type` | Na de magische link |
| `experiment_assigned` | `arm_invite`, `arm_goal` | Direct na `account_created` |
| `goal_set` | `daily_goal_min` | Onboarding of wijziging |
| `session_started` | `session_id`, `planned_min`, `device_class`, `wakelock_supported` | Start |
| `session_visibility_hidden` | `session_id`, `elapsed_net_s` | Pagina verborgen |
| `session_resumed` | `session_id`, `gap_s`, `type` (struikel/pauze) | Terug binnen het venster |
| `session_paused` | `session_id`, `pause_no` | Pauzeknop |
| `wakelock_changed` | `session_id`, `state`, `reason` | Aanvraag of vrijgave |
| `session_completed` | `session_id`, `net_min`, `ended_by` (timer/eerder), `claim_delay_s` | Claim |
| `session_aborted` | `session_id`, `net_min`, `reason` | Afbreken |
| `session_flagged` | `session_id`, `rules[]` | Heuristiek slaat aan |
| `flag_resolved` | `session_id`, `decision`, `reason_code`, `reviewer_role` | Besluit |
| `appeal_filed` / `appeal_resolved` | `object_id`, `decision` | Beroep |
| `points_credited` | `entry_type`, `amount`, `status` | Grootboekregel |
| `day_goal_met` | `date`, `arm_goal` | Dagdoel gehaald |
| `week_budget_changed` | `delta`, `remaining` | Arm V, per gemiste dag |
| `redemption_completed` | `item_id`, `points`, `value_eur`, `partner_id` | Verzilvering |
| `squad_created` | `squad_id`, `trigger` (onboarding/na sessie/later) | Aanmaken |
| `invite_created` | `invite_id`, `invite_type`, `max_uses` | Link gemaakt |
| `invite_share_opened` | `invite_id`, `channel` (whatsapp/system/copy) | Deelmenu geopend |
| `invite_link_opened` | `invite_id`, `is_new_visitor` | Op de server, bij het openen van de link |
| `invite_accepted` | `invite_id`, `invitee_id` | Genodigde registreert of sluit aan |
| `squad_member_status` | `squad_id`, `status` (actief/pauze/vertrokken) | Wijziging |
| `squad_day_evaluated` | `squad_id`, `met`, `joker_used`, `active_members` | Dagelijks 23:59 |
| `duel_created` / `duel_accepted` / `duel_finished` | `duel_id`, `length_d`, `stake_type`, `winner` | Duelverloop |
| `club_joined` | `club_id`, `qr_source` | Koppeling |
| `club_dashboard_viewed` | `club_id`, `tab` | Bestuur |
| `promo_kit_downloaded` | `club_id`, `asset` | Bestuur |
| `card_created` / `card_share_opened` | `card_id`, `trigger`, `fields_on[]` | Kaart |
| `verify_page_viewed` | `card_id`, `is_new_visitor` | QR of link geopend |
| `referral_vesting_started` / `referral_vested` / `referral_lapsed` | `invite_id`, `sessions_done` | Referral |
| `draw_opt_in` / `draw_executed` / `prize_awarded` / `prize_verified` | `game_id`, `prize_value_eur`, `ksb_eur` | Prijzen |

### 7.2 KPI's uit events

| KPI | Berekening uit events |
|---|---|
| Activatie | Aandeel `account_created` met een `session_completed` (net_min ≥ 25) binnen 24 uur |
| D1 / D7 / D30 | Aandeel van de cohort met ≥ 1 `session_completed` op dag N (dag 0 = registratie); kerstvakantiedagen gemarkeerd en apart gerapporteerd |
| Squad-aandeel | Wekelijks actieven met `squad_member_status` actief in een squad van ≥ 3 of een lopend duel / alle wekelijks actieven |
| D7 squad tegenover solo | D7 van wie op dag 7 in een squad zat, gedeeld door D7 van solo-gebruikers; ook per arm |
| K-factor | Per cyclus van 7 dagen: (`invite_accepted` met activatie binnen 7 dagen) / actieve uitnodigers, gedeeld door het aantal actieve gebruikers. Dat is gelijk aan uitnodigingen per gebruiker × conversie. Per bron: squad, duel, club, card, personal |
| Organische uitnodigingen | `invite_share_opened` per wekelijks actieve gebruiker per maand |
| Gemarkeerde sessies | `session_flagged` / `session_completed`, per kanaal, per vereniging en per uitnodigingscluster |
| Beloningskosten | Som `value_eur` van `redemption_completed` plus prijzen plus KSB, tegenover het geboekte budget |
| Kwaliteit per kanaal | D30 en squad-aandeel per `acq_source`; alarm bij < 50% van het gemiddelde |
| Beloningsjagers | Aandeel van de cohort met precies één sessie binnen 24 uur na een catalogus- of prijsaankondiging en daarna geen sessie meer |
| Verenigingsdeelname | Per club: actieve leden / noemer (§4.7), dagelijks |

### 7.3 Experimentarmen

Er zijn twee factoren, onafhankelijk gerandomiseerd bij registratie en gestratificeerd naar vereniging:

1. **Doelbonus: winst (W) tegenover slinkend weekbudget (V).** Toetst H-A uit rapport 08: meer geverifieerde focusminuten per week bij verliesframing. Primaire uitkomst: netto minuten per week. Secundair: D30. Squadgenoten kunnen in verschillende armen zitten. Dat geeft besmetting, die we accepteren omdat randomisering per squad te weinig eenheden oplevert (zie open vragen).
2. **Uitnodigingsmoment: squadvoorstel in de onboarding (A) tegenover na de eerste sessie (B).** Primaire uitkomst: squad-aandeel op dag 7. Secundair: activatie, omdat een vroeg voorstel de eerste sessie kan vertragen. Wie via een squaduitnodiging binnenkomt, valt buiten dit experiment, maar telt wel mee in factor 1.

Daarnaast is er een tijdsvergelijking: referral uit (2–15 december) tegenover aan (vanaf 16 december), met K per bron. Dat is geen gerandomiseerde vergelijking, omdat de kerst ertussen valt. We rapporteren het daarom beschrijvend. Een experiment op het hoofdklassement van de verenigingen (deelname of intensiteit) doen we niet: met vijf tot twintig verenigingen is er te weinig om te vergelijken.

## 8. Scope

| Prioriteit | Onderdeel | Motivatie |
|---|---|---|
| **Must** | Focus-engine met zichtbaarheid, Wake Lock, servertijd en heartbeat; afbreekuitleg | Kern van de belofte; zonder dit niets te meten |
| **Must** | Onboarding met leeftijdscheck (16+, 18+-vlag) | Businessplan §3 |
| **Must** | Puntengrootboek met vaste ratio, inverdienperiode, dag- en weekplafond, verplichting tegenover budget | Beloningskosten binnen budget |
| **Must** | Squads met live aanwezigheid, streak, joker, automatische pauze; uitnodigen als toegangsbewijs | Squad-aandeel, D7, K |
| **Must** | Duels zonder puntinzet | K, D7 |
| **Must** | Verenigingskoppeling, aanloopklassement, prijsperiode, bestuursdashboard met promotiekit | Koude start, D30 |
| **Must** | Catalogus met budgetdekking en vouchers | Beloningscondities toetsen |
| **Must** | Eventtabel, experimenttoewijzing, attributie per bron | Alle go/no-go-criteria |
| **Must** | Fraudewachtrij, redencodes en beroep | < 5% gemarkeerd; menselijke herbeoordeling |
| **Must** | Verliesframing-arm | Centrale pilothypothese (businessplan §4) |
| **Should** | Deelbare kaarten met verificatiepagina | Versterker; levert in een gesloten pilot vooral wachtlijstvoorrang op |
| **Should** | Referral met vesting (vanaf 16 december) | Versneller; los te meten |
| **Should** | Verdiende individuele prestatieprijzen | Tentamenweek; vraagt winnaarsverificatie |
| **Should** | Stad tegen stad, vakantiestand voor squads | Persverhaal; D30 over de kerst |
| **Should** | Spelvoorwaarden en trekkingsmodule achter een feature flag | Businessplan §10; aan alleen na de Ksa-toets |
| **Could** | Verticale timelapse-video, gezamenlijke "study with me"-sessie via QR, webpush buiten de squad, tweede squad per gebruiker | Groeiversterkers met hoge bouwkosten of een privacyvraag |
| **Won't (MVP)** | Inzetlaag, native verificatie, apparaatattestatie, betalingen aan gebruikers, Plus, cash-out, openbare individuele ranglijsten, beloning op delen, contactimport | Businessplan §10 en randvoorwaarden |

Releaseplan (werkhypothese): R1 op 2 december met alle musts behalve de prijsperiode. R2 op 16 december met kaarten en referral. R3 op 5 januari met de prijsperiode, prestatieprijzen en stad tegen stad. De trekkingsmodule wordt gebouwd, maar gaat pas aan na de toets.

**Na de pilot.** Native verificatie komt eerst: een native app met apparaatattestatie (trede 2), daarna de blokkade via de Screen Time-API's op iOS en UsageStats op Android (trede 3). Rapport 09 schat dat op 8–12 weken plus 8–12 weken, met daarbovenop de wachttijd voor de entitlement. Pas daarna kunnen verenigingsprijzen groter worden. De inzetlaag volgt na de advocatenopinie, de Ksa-toets, de schriftelijke acceptatie door de betaaldienstverlener en trede 3, zonder referralbonus en zonder koppeling aan squads tot de juridische toetsing. Plus (statistieken, thema's, uitgebreide squads) komt vanaf semester 2 en wordt nooit gekoppeld aan trekkingskansen. Voor de groei-loops na de pilot: stad tegen stad als vast format, Vlaanderen als tweede markt, en campusambassadeurs met een vergoeding per gebruiker die op dag 7 nog actief is.

## 9. Open vragen en aannames

1. **Struikelmoment.** Past een herstelvenster van 60 seconden bij "verlaat je het scherm, dan stopt de sessie"? De klok stopt, de sessie overleeft. Voorstel aan de founder; zonder venster verwacht ik meer afbrekingen door meldingen en dus meer negatieve mond-tot-mondreclame (**inschatting**).
2. **Hoofdklassement op deelnamegraad.** Dit is een keuze uit de twee opties in het businessplan. Ze maakt een vereniging gevoelig voor het opgegeven ledenaantal. Hoe controleren we dat ledenaantal zonder namenlijst? **Aanname:** jaarverslag of ALV-stuk volstaat in de pilot.
3. **Poulegrenzen** (< 150, 150–500, > 500) zijn een aanname. Het aantal studieverenigingen en hun grootte is **niet geverifieerd** (rapport 03, §7).
4. **Puntwaarde €0,002 en weekplafond 600** zijn werkhypotheses. Ze hangen af van het budget dat vóór 1 december geboekt wordt. Zonder geboekt budget gaat de catalogus niet open en blijven alleen status en verenigingsprijzen over.
5. **Prijsgrenzen op trede 1** (≤ €50 individueel, ≤ €250 collectief) zijn aannames. De jurist moet de prestatieprijzen en de deterministische volgorde bij meer kandidaten dan prijzen toetsen.
6. **Randomisering per gebruiker** binnen squads geeft besmetting tussen de armen. Bij 300–800 gebruikers en twee factoren is de onderscheidende kracht beperkt (**inschatting**). Een statisticus moet vóór de pilot een poweranalyse doen.
7. **Eén squad per gebruiker.** Studenten hebben een huis, een jaarclub en een vereniging. Eén squad maakt de meting schoon, maar kan de groei remmen.
8. **Verwerkingsrol van de vereniging.** Is het bestuur ontvanger van aggregaten, verwerker of gezamenlijk verantwoordelijke? Dat bepaalt de overeenkomst. Daarnaast de vraag uit rapport 09 (§7.3) of het apparaatkenmerk onder de cookiebepaling van de Telecommunicatiewet valt (**niet geverifieerd**).
9. **Webpush op iOS** voor geïnstalleerde webapps hebben we niet getoetst. De squadmeldingen rusten erop. Zonder webpush valt de live aanwezigheid terug op in-app.
10. **Effect van botdetectie en apparaatkenmerken** tegen gerichte fraude op het web is **niet geverifieerd** (rapport 09, §3.3). De drempels F1 tot en met F9 zijn inschattingen die we na week 1 bijstellen.
11. **Tentamenperiodes** per instelling in januari 2027 en de exacte prijsperiode moeten per vereniging worden vastgesteld.
12. **Kansspelstructuur van de trekkingen.** Accepteert de Ksa een reeks kleine spellen voor dezelfde app? Zonder dat blijft de feature flag uit en verdwijnen trekkingen uit de interface. Er gaat niets verloren in de groeiloops, omdat ze daar bewust niet in zitten.
13. **Kerstvakantie.** Hoe de D30-correctie precies werkt (dagen uitsluiten of de cohort verschuiven), moet vóór de pilot worden vastgelegd, zodat we de lat niet achteraf verschuiven.
