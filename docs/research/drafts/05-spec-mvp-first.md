# Productspecificatie web-MVP — variant "MVP-first"

*Rewarded, rol: productmanager. Concept voor de jury, 4 november 2026. Bindend kader: `docs/01-businessplan.md`. Bewijs: `docs/research/02`, `03`, `08`, `09`. Getallen die niet uit die documenten komen, zijn als werkhypothese of aanname gemarkeerd.*

## Samenvatting: wat deze variant anders doet

1. Ze bouwt alleen wat nodig is om de zeven go/no-go-criteria van de gesloten pilot (2 december 2026 – 18 januari 2027) te meten, en levert dat in twee releases: R1 op 2 december (vier weken vanaf vandaag), R2 op 5 januari, vóór de tentamenweken.
2. Elke functie is gekoppeld aan een criterium. Wat aan geen criterium hangt, gaat naar de publieke lancering (R3, 19 januari) of later, met de reden erbij.
3. Geschrapt voor de pilot: verlote prijzen (de Ksa-toets is nog niet gedaan en geen criterium hangt eraan), referralpunten (die vertroebelen de meting of K uit squads komt), deelbare bewijskaarten (in een gesloten pilot leveren publieke posts geen pilotactivaties op), puntvervaldatum (die gaat pas na 12 maanden in) en partnerportalen. Hun spec staat er wel in, zodat R3 zonder nieuw ontwerp kan.
4. Afwijking van het businessplan (§10): spelvoorwaarden voor trekkingen gaan niet mee in de pilot-MVP. Dit is een voorstel aan de founder, geen besluit.
5. De verliesframing-arm ontwerp ik zo dat de vaste ratio per minuut voor iedereen gelijk blijft. Alleen de doelbonus verschilt, als winst of als slinkend budget.
6. De verenigingsranglijst rekent in de pilot op deelnamegraad, omdat die meet wat de go-criteria meten.
7. Bijna alles wat aanvoelt als "realtime" werkt met polling, en alle analyse loopt via een eigen eventtabel met SQL, zonder externe analytics-SDK.

---

## 1. Doel van de MVP en succescriteria

De web-MVP heeft één doel: in zeven weken pilot een betrouwbaar ja of nee opleveren op de vraag of squads en verenigingsrivaliteit studenten laten terugkomen naar geverifieerde focussessies, en of dat kan zonder dat fraude of beloningskosten ontsporen. De MVP is een meetinstrument met een product eromheen. Een functie hoort erin als een criterium zonder die functie niet te meten is of het gemeten gedrag niet kan ontstaan. De rest schuift door.

De tijd is de harde grens. Vandaag is het 4 november; de pilot start op 2 december. Ik ga uit van een team van twee à drie ontwikkelaars en één ontwerper (**aanname**; rapport 09 rekent met 2 à 3 ontwikkelaars en schat trede 0 op 2–4 weken bouwen). R1 moet daarom klein genoeg zijn om in vier weken te bouwen en te testen op echte toestellen. R2 voegt toe wat pas in januari nodig is: de blokchallenge en het bestuursdashboard.

| Go/no-go-criterium pilot (businessplan §6) | Drempel | Wat in de MVP dit criterium mogelijk maakt | Release |
|---|---|---|---|
| Activatie | ≥ 60% | Onboarding in minder dan twee minuten, eerste sessie van 25 minuten als standaard, eventlog van registratie en eerste voltooide sessie | R1 |
| D7 | ≥ 25% | Geverifieerde sessies met servertijd, dagdoel, squadstreak, herinneringen via e-mail | R1 |
| D30, gecorrigeerd voor kerstvakantie | ≥ 12% | Als D7, plus de vakantiepauze in de beheeromgeving en de blokchallenge in januari | R1 + R2 |
| Aandeel actieven in een squad | ≥ 40% | Squad aanmaken, uitnodigingslink, live aanwezigheid, squadstreak | R1 |
| K-factor | ≥ 0,3 | Uitnodigingslinks met attributie (squad, duel), toegang tot de gesloten pilot via uitnodiging | R1 (squad), R2 (duel) |
| Gemarkeerde sessies | < 5% | Signaallogging, vaste heuristieken, fraudewachtrij | R1 |
| Beloningskosten binnen budget | binnen budget | Grootboek, catalogus met vooraf gefinancierde voorraad, verzilvering met voorraadcontrole | R1 |
| Beslisregel §9: D7 squadleden hoger dan solo | duidelijk hoger | Squadstatus per gebruiker per dag in de events | R1 |
| Beslisregel §9: fraude > 5% | ≤ 5% | Uitkomst van de menselijke herbeoordeling, niet alleen markeringen | R1 |

Twee eerlijke kanttekeningen. Het budgetcriterium wordt in dit ontwerp per constructie gehaald, omdat er nooit meer verzilverd kan worden dan er vooraf gefinancierde voorraad is. De informatieve meting is daarom de kostprijs per actieve gebruiker en hoe snel de voorraad op is. En het fraudecriterium meet markeringen, die afhangen van onze eigen heuristieken. Die leggen we vóór 2 december vast en passen we tijdens de pilot niet aan om onder de 5% te blijven. Naast het aandeel markeringen rapporteren we het aandeel sessies dat na herbeoordeling is afgekeurd.

## 2. Gebruikers en hun taken

**Student (16+).** Wil zijn telefoon laten liggen en daar iets voor terugzien. Taken: registreren, een sessie afmaken, zien wat hij opbouwt, een beloning kiezen. Hij komt bijna altijd binnen via een vereniging of een vriend, dus onboarding begint met een code of link, niet met een leeg scherm.

**Squadlid.** Een student in een squad van drie tot zes. Extra taken: zien wie nu focust, de squadstreak bewaken, vrienden uitnodigen en, opt-in, minuten vergelijken. Zijn kernvraag is "doen de anderen mee?", niet "hoeveel punten heb ik?".

**Verenigingsbestuur.** Meestal de commissaris onderwijs. Taken: de code verspreiden, de stand volgen, leden aansporen, de collectieve prijs ontvangen. Het bestuur ziet alleen aggregaten; individuele monitoring is uitgesloten (businessplan §8).

**Beheerder van Rewarded.** Een of twee teamleden. Taken: verenigingen, challenges en voucherpartijen invoeren, markeringen en beroepen beoordelen, de vakantiepauze instellen, KPI-query's draaien. De beheeromgeving is een intern hulpmiddel, functioneel en zonder ontwerpwerk boven bruikbaarheid.

## 3. Kernflows stap voor stap

### 3.1 Onboarding en leeftijdscheck (R1)

1. De student opent een squad-, duel- of verenigingslink, of voert een verenigingscode in. In de gesloten pilot geeft alleen zo'n link of een wachtlijstuitnodiging toegang.
2. Het eerste scherm geeft de belofte en de eerlijke claim: "Je focustijd telt zolang Rewarded zichtbaar op je scherm openstaat. Ga je naar een andere app of tab, of gaat je scherm uit, dan stopt de sessie" (rapport 09, §3.3).
3. Inloggen met e-mail en magic link, zonder wachtwoord. Voornaam verplicht, achternaam optioneel.
4. Geboortedatum. Onder 16: registratie geweigerd, zonder opgeslagen gegevens. 16–17: account zonder 18+-onderdelen. Vanaf 18: vlag `is_18_plus`, in de pilot alleen bewaard. Het is zelfopgave; bij prijzen volgt controle (§4.7).
5. Akkoord met voorwaarden en privacyverklaring, waarin staat welke signalen we loggen (§6).
6. Via een verenigingslink wordt de student lid van die vereniging; via een squadlink van de squad en, na bevestiging, van de vereniging van de uitnodiger.
7. Dagdoel kiezen: 25, 50, 90 of 120 minuten; standaard 25.
8. Het laatste scherm is de sessiestart: "Start je eerste sessie van 25 minuten."

### 3.2 Eerste focussessie (R1)

1. Eenmalige checklist: "Telefoon: scherm naar beneden, oplader erin als het kan. Laptop: dit tabblad open laten."
2. De student kiest 25, 50 of 90 minuten. De server maakt de sessie aan met servertijd als start en geeft een nonce terug; een tweede actieve sessie op het account wordt geweigerd.
3. De client vraagt een Wake Lock aan. Lukt dat niet op een telefoon, dan meldt de app: "Je scherm kan vanzelf uitgaan. Zet automatisch vergrendelen tijdelijk uit, anders stopt je sessie."
4. Het scherm toont een donkere timer, de squadaanwezigheid ("Sanne en Joris focussen nu") en één knop: Stoppen. Elke 30 seconden gaat er een heartbeat met nonce naar de server.
5. Bij het einde controleert de server de sessie (§4.1) en schrijft direct punten bij. Het scherm toont minuten, punten, dagdoel, squadstreak en de inverdienvoortgang ("Nog 3 uur en 35 minuten tot je eerste beloning").

### 3.3 Sessie afgebroken (R1)

1. De pagina wordt verborgen (andere app of tab, scherm vergrendeld of uit). De client logt `visibility_hidden` en stuurt dat direct door.
2. De server sluit de sessie als afgebroken op het eerste van drie signalen: het verborgen-event, een heartbeatgat zonder zichtbaarheidsinformatie, of Stoppen.
3. Bij terugkeer: "Je sessie is gestopt na 31 minuten omdat Rewarded niet meer op je scherm stond. Afgebroken sessies leveren geen punten op. We kunnen alleen tijd belonen die we kunnen zien." Met de knop Opnieuw beginnen.
4. Stoppen vraagt eerst om bevestiging. Een afgebroken sessie breekt de squadstreak niet; alleen een gemist dagdoel telt (§4.4).

### 3.4 Punten en catalogus (R1)

1. Het tabblad Beloningen toont het saldo ("beschikbaar" en "in afwachting"), de inverdienvoortgang en de catalogus met per item puntenprijs, financier, voorraad ("nog 34 van 100") en voorwaarden.
2. Onder 300 geverifieerde minuten is Verzilveren uitgeschakeld, met de resterende tijd erbij.
3. Bij de eerste verzilvering verifieert de student één telefoonnummer per sms (rapport 09, trede 1).
4. De server controleert in één transactie saldo, weeklimiet, voorraad en budget, boekt af en reserveert een vouchercode, die in de app en per e-mail verschijnt.

### 3.5 Squad aanmaken en uitnodigen (R1)

1. Startscherm: "Focus samen. Squads houden het beter vol." Knop Squad maken; de student kiest een naam.
2. Hij krijgt een uitnodigingslink, deelbaar via WhatsApp met de Web Share API (kopiëren als terugval).
3. Tot drie leden is de squad "in opbouw", zonder streak: "Nog 2 vrienden nodig."
4. De genodigde doorloopt 3.1 en landt in de squad; de uitnodiger krijgt een melding.
5. Het squadscherm toont leden, wie nu focust (elke 30 seconden bijgewerkt), per lid of het dagdoel vandaag gehaald is, en de streak. Minuten vergelijken staat standaard uit en is per lid aan te zetten; wie het aanzet, ziet alleen de minuten van leden die het ook aanzetten. Een student zit in de pilot in één squad.

### 3.6 Duel (R2)

1. Daag uit vanaf een squadlid of met een nieuwe link; een duel duurt 7 dagen.
2. De tegenstander accepteert (een nieuwe gebruiker doorloopt eerst 3.1). Accepteren is de opt-in voor de vergelijking.
3. Beide zien dagelijks elkaars geverifieerde minuten, met het plafond van 480 per dag. Wie na 7 dagen de meeste minuten heeft, krijgt een badge. Er staan geen punten op het spel (§4.5).

### 3.7 Verenigingschallenge en bestuursdashboard (aanmelding R1, ranglijst R2)

1. De beheerder maakt de vereniging aan (code, bestuursaccount) en een challenge met data en collectieve prijs.
2. Vanaf R1 sluiten leden zich aan met de code, zodat hun sessies vanaf dag één meetellen.
3. Vanaf R2 zien leden de ranglijst van verenigingen op deelnamegraad, zonder individuele namen.
4. Het bestuur ziet op zijn dashboard alleen aggregaten per week (§4.6).
5. Na afloop volgt de winnaarsverificatie (§4.7) en daarna de toekenning in de app.

### 3.8 Verdiende individuele prijs (R2)

1. De beheerder maakt een prestatiechallenge aan ("elke dag van de tentamenweek minstens 120 minuten"), met een vaste prijs per winnaar en evenveel plaatsen als er vooraf gefinancierde prijzen zijn.
2. Inschrijven kan vóór de start, tot de plaatsen vol zijn. Wie meedoet, weet dus dat hij de prijs krijgt als hij de prestatie levert: geen race, geen loting.
3. De app toont de voortgang per dag; na afloop volgen winnaarsverificatie en levering.

### 3.9 Verlote prijs, 18+ met spelvoorwaarden (niet in de pilot; spec voor R3)

1. Alleen zichtbaar bij `is_18_plus`; voor 16- en 17-jarigen bestaat het onderdeel niet.
2. Deelname is automatisch en gratis voor wie het weekdoel haalde. Er is geen aankoop, abonnement of extra lot.
3. De kaart heet "Kans op" en toont prijs, aantal prijzen, het aantal deelnemers van vorige keer, trekkingsdatum en de spelvoorwaarden: Rewarded als organisator, periode, voorwaarden, kansspelbelasting voor rekening van Rewarded.
4. De trekking draait in de beheeromgeving met een vastgelegd willekeurig proces; daarna volgt de winnaarsverificatie inclusief leeftijd.

### 3.10 Deelbare bewijskaart (niet in de pilot; spec voor R3)

1. Na een voltooide sessie of streak: Deel je kaart. De eerste keer vraagt de app om toestemming; standaard staat het uit.
2. De kaart toont voornaam, duur, streak en squadnaam; achternaam, vereniging en instelling alleen als de gebruiker die aanzet. Nooit bedragen of punten.
3. Een QR-code leidt naar een openbare pagina van de sessie met datum, duur en verificatietrede ("zichtbaar op het scherm"). Delen levert niets op.

### 3.11 Referral (niet in de pilot; spec voor R3)

1. Elke gebruiker heeft een persoonlijke link; squad- en duellinks tellen ook.
2. Na registratie krijgen beide accounts referralpunten "in afwachting". Die komen vrij als de genodigde binnen 7 dagen drie sessies van minstens 25 minuten voltooit (businessplan §6), en vervallen anders. Verder gelden de regels van §4.2.

## 4. Functionele specificatie per module

### 4.1 Focus-engine

**Sessielengtes.** 25, 50 en 90 minuten (businessplan §4). Er komen geen vrije lengtes bij; dat houdt analyse en uitleg eenvoudig.

**Zichtbaarheid.** De sessie loopt alleen zolang `document.visibilityState === "visible"`. Het eerste `visibilitychange` naar `hidden` beëindigt de sessie als afgebroken. Er is geen terugkeervenster: het businessplan laat de sessie stoppen zodra je het scherm verlaat, en een venster opent een fraudeweg (even snel appen). We loggen wel hoe lang de pagina verborgen was als de gebruiker terugkomt, zodat we na de pilot onderbouwd over een kort venster kunnen beslissen (open vraag 3). Op de laptop zijn `blur` en `focus` alleen een zwak extra signaal, omdat een zichtbaar tabblad naast een ander venster `visible` blijft (rapport 09, §3.2).

**Wake Lock.** Aanvragen bij de start. Bij een `release` terwijl de pagina zichtbaar is (lage batterij, energiebesparing) toont de app een waarschuwing en logt het event. Volgens de compatibiliteitsdata werkt Wake Lock op iOS volledig vanaf 18.4, ook als Home Screen-app, maar dat is geen veldtest (rapport 09, §3.1–3.2). Vóór R1 testen we daarom op een iPhone (Safari en Home Screen-app) en twee Android-toestellen.

**Tijdstempels.** Verstreken tijd is `server_end − server_start`; de klok van de client telt niet voor punten (rapport 09, §3.2). De client meldt het einde als zijn monotone klok de duur bereikt; de server accepteert dat bij een serververstreken tijd van minstens de duur min 30 seconden.

**Heartbeat.** Elke 30 seconden, met een nonce die de server bij elke beat vernieuwt. Wifi in een bibliotheek valt soms weg, dus de client buffert de zichtbaarheidsstatus en stuurt die bij herstel na. Was de pagina steeds zichtbaar en zijn de gaten samen kleiner dan 10% van de duur, dan telt de sessie. Boven 10% telt ze gemarkeerd (§6). Zonder zichtbaarheidsinformatie na een gat is ze afgebroken.

**Pauzeregels.** Geen pauze binnen een sessie: een pauze betekent de pagina verlaten, en dat is op het web niet te controleren. Wie pauze wil, rondt af en start een nieuwe sessie. Geen criterium hangt aan pauzeren; retentie en activatie hangen aan voltooide sessies.

**Wat telt als afgebroken.** (a) Het verborgen-event, (b) een heartbeatgat zonder zichtbaarheidsinformatie, (c) Stoppen door de gebruiker, (d) een tweede sessie die op hetzelfde account start (de eerste stopt), (e) een einde dat de server meer dan 10 minuten na de geplande eindtijd ontvangt zonder heartbeats ertussen. Een afgebroken sessie levert geen punten op en telt niet voor het dagdoel, de streak of de challenge.

**Uitleg.** Elke afgebroken sessie toont de reden in gewone taal en de tijd tot het stoppen, uit één vaste copytabel die ook support gebruikt (zie 3.3).

### 4.2 Puntengrootboek

Het grootboek is een append-only tabel met mutaties (type, bedrag, status, bron, tijdstempel). Saldi zijn afgeleid, nooit opgeslagen als los veld. Mutatietypen: `earn_session`, `earn_goal_bonus`, `goal_budget_grant`, `goal_budget_deduct`, `earn_prize`, `redeem`, `reverse` (na fraudebesluit), en later `referral_pending`, `referral_vest` en `expire`. Statussen: `pending`, `available`, `reversed`.

**Ratio.** 1 focuspunt per geverifieerde minuut van een voltooide sessie. Die ratio is vast, staat op de uitlegpagina en wordt in de pilot niet gevarieerd. Bijschrijven gebeurt direct bij het einde van de sessie (Levitt e.a. 2016, via businessplan §4).

**Daglimiet op verdienen.** Maximaal 480 minuten per dag tellen voor punten, dagdoel en challenge (werkhypothese 8 uur, businessplan §4). De dag loopt van 04:00 tot 04:00 Amsterdamse tijd (**aanname**: studenten werken laat); een sessie hoort bij haar startdag.

**Inverdienperiode.** De eerste verzilvering kan pas na 300 geverifieerde minuten (5 uur, businessplan §4). Gemarkeerde minuten tellen pas mee na goedkeuring.

**Weekplafond.** Eén verzilvering per account per week (vanaf maandag 04:00). Een apart weekmaximum in punten is overbodig: dat begrenst de daglimiet al.

**Vesting van referralpunten (R3).** `referral_pending` wordt `available` als de genodigde binnen 7 × 24 uur 3 voltooide sessies van minstens 25 minuten heeft, anders `expire`. Hoogstens de helft van een puntenprijs mag uit referralpunten komen; maximaal 5 gevestigde referrals per maand (werkhypothesen).

**Vervaldatum.** Punten vervallen 12 maanden na de laatste voltooide sessie (werkhypothese). De regel staat in de voorwaarden maar wordt niet gebouwd: het eerste verval valt op zijn vroegst in december 2027.

**Randgevallen.** Bij verwijdering van het account vervallen de punten, na een waarschuwing. Een afgekeurde sessie levert een `reverse` op; een negatief saldo wordt verrekend met toekomstige punten, nooit teruggevorderd in geld. Gelijktijdige verzilvering op twee toestellen voorkomt een rijvergrendeling per account.

### 4.3 Catalogus en verzilvering

**Budgetdekking.** Een item bestaat alleen als een partij met direct belang (vereniging, faculteit, partner) de voorraad heeft betaald of schriftelijk toegezegd, vastgelegd in de beheeromgeving. Zonder ingevoerde codes is een item niet te publiceren. De som van `kostprijs × voorraad` is het beloningsbudget dat uit geboekte omzet volgt (businessplan §5); een ongedekte verplichting kan niet ontstaan.

**Puntenprijs.** Eén keer vóór de pilot vastgesteld en daarna vast, want een variabele wisselkoers is uitgesloten. Rekenregel: `puntenprijs = kostprijs ÷ budgetwaarde per punt`, met budgetwaarde = pilotbudget ÷ verwachte geverifieerde minuten (een teamaanname). De app publiceert puntenprijzen, nooit een eurowaarde per punt.

**Uitgifte per week.** Om te voorkomen dat de eerste week alles opmaakt, geeft de beheerder voorraad per week vrij (bijvoorbeeld een zevende per pilotweek). De app toont de voorraad van deze week eerlijk, ook als die nul is: "Deze week op; maandag komen er 15 bij."

**Vouchers.** Unieke codes per CSV-import, na reservering aan één account gekoppeld. Fysieke items (een koffiekaart van de vereniging) lopen via een code die de student daar laat zien. Geen partner-API's: geen criterium hangt eraan en een CSV kost een middag.

**Randgevallen.** Trekt een partner zich terug, dan blijven betaalde codes geldig; anders gaat het item offline en worden niet-geleverde verzilveringen teruggeboekt. Bij een ongeldige code geeft de beheerder een nieuwe uit of boekt de punten terug.

### 4.4 Squads

**Omvang.** Minimaal 3 en maximaal 6 actieve leden. Onder de 3 is de squad "in opbouw": geen streak, wel aanwezigheid.

**Live aanwezigheid.** "Focust nu" bij een lopende sessie, elke 30 seconden opgehaald (polling). Geen websockets: voor geen criterium maakt een halve minuut vertraging verschil.

**Dagdoel.** Per lid zelf gekozen (25, 50, 90 of 120 minuten) en alleen te wijzigen met ingang van de volgende dag. Zo kan niemand op het laatste moment het doel verlagen om de streak te redden.

**Squadstreak.** Een squaddag slaagt als elk actief lid zijn dagdoel haalt of op die dag een joker gebruikt. De streak telt opeenvolgende geslaagde dagen. Dagen in een door de beheerder ingestelde vakantiepauze tellen niet en breken niets.

**Rustdag-joker.** Elk lid heeft één joker per week. Die wordt automatisch ingezet bij het eerste gemiste dagdoel van die week en is niet op te sparen. Automatisch, omdat een handmatige keuze frictie toevoegt en het herstel van een streak volgens Silverman en Barasch (2023) terugval dempt (rapport 08). De joker beschermt alleen de squadstreak, niet de doelbonus (§5).

**Automatische pauze.** Een lid zonder voltooide sessie in 7 opeenvolgende dagen gaat op pauze. Het telt dan niet mee voor de streak en de squad ziet "op pauze". Bij de eerstvolgende voltooide sessie is het lid weer actief, vanaf de volgende dag. Zakt de squad door pauzes onder de 3 actieve leden, dan bevriest de streak in plaats van te breken.

**Randgevallen.** Een lid dat vertrekt, telt vanaf de volgende dag niet meer mee. Als de maker vertrekt, gaat het beheer naar het langst zittende lid. Een squad met nul actieve leden gedurende 14 dagen wordt gearchiveerd.

### 4.5 Duels

Twee spelers, 7 dagen, op geverifieerde minuten met het dagplafond van 480. Er staan geen punten of prijzen op het spel; de winnaar krijgt alleen een badge. Ik koppel er geen punten aan omdat een puntenbeloning tussen twee vrienden een directe prikkel tot samenspanning geeft, en omdat het duel in deze MVP er is voor het uitnodigingsmoment (K), niet voor de beloning. Bij gelijke stand is het gelijkspel. Een speler met een gemarkeerde sessie in de duelperiode krijgt pas na de herbeoordeling een uitslag. Per speler loopt maximaal één duel tegelijk.

### 4.6 Verenigingschallenge

**Ranglijstmaatstaf.** De pilot rangschikt op deelnamegraad: het aandeel van de in Rewarded aangesloten leden dat in de challengeweek op minstens 3 dagen het dagdoel haalde. Het businessplan staat gemiddelde focustijd per actief lid of deelnamegraad toe. Ik kies deelnamegraad omdat die het gedrag beloont dat de go-criteria meten: leden die terugkomen. Een gemiddelde per actief lid beloont een kleine kern van harde werkers en geeft het bestuur er geen belang bij om twijfelaars mee te krijgen. Het gemiddelde staat wel op het dashboard, als tweede cijfer.

**Noemer en randgevallen.** De noemer is het aantal leden dat bij het begin van de challengeweek aangesloten was. Wie tijdens de week vertrekt, blijft in de noemer, zodat het bestuur geen inactieve leden kan wegsturen. Er doen alleen verenigingen mee met minstens 15 aangesloten leden (werkhypothese). Het ledental van de vereniging zelf gebruiken we niet: dat kunnen we niet controleren.

**Plafond.** 480 minuten per lid per dag. De rustdag-joker telt niet als gehaald dagdoel voor de challenge, maar wel voor de squadstreak.

**Bestuursdashboard.** Alleen aggregaten, per week en voor de hele challenge. Een cijfer is pas zichtbaar bij minstens 5 leden in de groep. Er zijn geen namen, geen lijsten van leden en geen tijdstippen. Een export bestaat niet in de pilot.

**Collectieve prijs.** Vooraf vastgelegd per challenge, met financier en waarde, en verdiend op de ranglijst of op een drempel die vooraf is bekendgemaakt. Ze wordt nooit verloot. De toekenning volgt na de winnaarsverificatie (§4.7).

### 4.7 Prijzen: verdiend tegenover verloot

| Kenmerk | Verdiende prijs | Verlote prijs |
|---|---|---|
| In de pilot | Ja (collectief R2, individueel R2) | Nee; vanaf R3 na Ksa-voorlegging |
| Basis | Prestatie: drempel of rang, vooraf bekend | Kans onder wie het doel haalde |
| Leeftijd | 16+ | 18+, onderdeel onzichtbaar voor jongeren |
| Taal in de app | "Verdiend", "behaald" | "Kans op", met het aantal prijzen |
| Kosten | Prijswaarde | Prijswaarde × 100/62,2 (kansspelbelasting 37,8%, rapport 02 §5.1) |
| Juridisch kader | Geen kansbepaling; toetsen in de advocatenopinie | Gedragscode promotionele kansspelen; elk spel ≤ €4.500 of binnen de jaarlimiet |

**Winnaarsverificatie.** Voor elke prijs boven een catalogusitem, dus alle verdiende prijzen in de pilot: (1) alle sessies in de challengeperiode zijn niet gemarkeerd, of na herbeoordeling goedgekeurd; (2) het telefoonnummer is geverifieerd; (3) voor een individuele prijs een korte bevestiging per e-mail met de naam voor levering; (4) voor 18+-prijzen later een leeftijdscheck met een identiteitsbewijs dat niet wordt opgeslagen (open vraag 7). Bij een collectieve prijs controleert de beheerder het aandeel gemarkeerde sessies van de vereniging. Boven 10% volgt eerst een steekproef van 20 accounts (werkhypothese) voordat de prijs wordt toegekend.

**Kansspelbelasting als kostenpost.** In de beheeromgeving toont elk verloot spel bij het aanmaken de brutokosten inclusief belasting en controleert het tegen de limiet van €4.500. In de pilot is dit veld er niet; het komt met R3.

### 4.8 Deelbare kaarten (R3)

Opt-in per kaart, op de server gegenereerd als verticale afbeelding, met de inhoud uit 3.10. De QR-code verwijst naar `/s/{willekeurige_id}`. Delen levert niets op. Geschrapt voor de pilot: in een gesloten pilot leidt een openbare post naar de wachtlijst, niet naar een pilotactivatie, dus hangt er geen criterium aan.

### 4.9 Referral (R3)

Regels in 4.2 en §5. Nooit in geld, nooit uit inzet. Geschrapt voor de pilot: §9 van het businessplan vraagt of de sociale loop echt is. Een puntenbeloning per uitnodiging zou K opdrijven met precies de prikkel die we niet willen meten.

### 4.10 Profiel, privacy en leeftijd

Het profiel bevat voornaam, optionele achternaam, e-mail, geboortedatum, dagdoel, squad, vereniging en de schakelaar "minuten vergelijken in squad". De leeftijdsvlag bepaalt of 18+-onderdelen bestaan. We verwerken alleen sessietijdstempels, zichtbaarheidsgebeurtenissen, Wake Lock-status, lidmaatschappen, een gehasht IP-adres en de user agent (businessplan §8, rapport 09 §7.3); geen locatie, geen camera, geen verdere fingerprinting. IP-hashes en user agents bewaren we 30 dagen (werkhypothese). Account verwijderen kan in het profiel; events blijven gepseudonimiseerd voor de pilotanalyse. Er is geen externe analytics-SDK, wat een verwerker in de DPIA scheelt.

### 4.11 Beheeromgeving

| Onderdeel | Functie in de pilot | Release |
|---|---|---|
| Verenigingen | Aanmaken, code genereren, bestuursaccount uitnodigen | R1 |
| Challenges | Collectieve en individuele prestatiechallenges met datum, prijs, financier en plaatsen | R2 |
| Catalogus en partners | Partnerrecord (naam, contact, toezegging), item met kostprijs en puntenprijs, CSV-import van codes, weekvrijgave | R1 |
| Fraudewachtrij | Lijst gemarkeerde sessies met signalen, besluit goedkeuren of afkeuren met redencode, beroepen | R1 |
| Vakantiepauze | Periode instellen waarin streaks en pauzetellers bevriezen | R1 |
| Gebruikers | Zoeken op e-mail, leeftijdsvlag, account blokkeren, verwijderen | R1 |
| KPI-overzicht | Opgeslagen SQL-query's per KPI (§7), geen eigen dashboardontwerp | R1 |
| Trekkingen met spelvoorwaarden en belastingberekening | — | R3 |

**Menselijke herbeoordeling.** Geen enkel besluit dat punten of een prijs kost, wordt automatisch genomen. Heuristieken markeren alleen; een mens beslist. Elk besluit krijgt een redencode uit een vaste lijst, en de student ziet die reden in gewone taal.

## 5. Puntenmodel en parameters

| Parameter | Waarde in de pilot | Reden | Gevarieerd in de pilot? |
|---|---|---|---|
| Sessielengtes | 25, 50, 90 min | Businessplan §4 | Nee |
| Ratio | 1 punt per geverifieerde minuut van een voltooide sessie | Vast en uit te leggen in één zin | Nee (vaste ratio is bindend) |
| Afgebroken sessie | 0 punten | Businessplan §4 | Nee |
| Moment van bijschrijven | Direct bij het einde van de sessie | Levitt e.a. 2016 (businessplan §4) | Nee |
| Daglimiet op verdienen | 480 min per dag | Werkhypothese 8 uur, businessplan §4 | Nee |
| Grens van de dag | 04:00 Europe/Amsterdam | Aanname over studieritme | Nee |
| Dagdoel | 25 / 50 / 90 / 120 min, keuze gebruiker, standaard 25 | Laagdrempelig voor activatie | Nee |
| Doelbonus, controlearm | +20 punten per gehaald dagdoel, direct bijgeschreven (max. 140 per week) | Winstframing; gelijke verwachte waarde als de verliesarm | **Ja: arm A** |
| Doelbonus, verliesarm | Op maandag 140 punten "weekbudget" in afwachting; −20 per gemist dagdoel; restant beschikbaar op zondag 04:00 | Patel e.a. 2016 (rapport 08): verliesframing zonder eigen geld | **Ja: arm B** |
| Inverdienperiode | 300 geverifieerde minuten vóór de eerste verzilvering | Businessplan §4 | Nee |
| Weekplafond verzilvering | 1 verzilvering per week | Kosten per persoon begrenzen (rapport 03) | Nee |
| Telefoonverificatie | Bij de eerste verzilvering, 1 nummer per account | Rapport 09, trede 1 | Nee |
| Puntenprijs catalogus | Kostprijs ÷ budgetwaarde per punt, vast vóór de pilot | Geen variabele wisselkoers; budget volgt uit geboekte omzet | Nee |
| Uitgifte voorraad | Per pilotweek vrijgegeven | Eerste week mag niet alles opmaken | Nee |
| Rustdag-joker | 1 per lid per week, automatisch | Businessplan §4; Silverman en Barasch 2023 (rapport 08) | Nee |
| Automatische pauze | Na 7 dagen zonder voltooide sessie | Businessplan §4 | Nee |
| Squadomvang | 3–6 | Businessplan §4 | Nee |
| Referralpunten | 250 per partij, vesting 3 sessies ≥ 25 min in 7 dagen, max. 5 per maand, max. 50% van een puntenprijs | Businessplan §6; werkhypothese | Niet in de pilot (R3) |
| Vervaldatum | 12 maanden na de laatste voltooide sessie | Werkhypothese; geen effect binnen de pilot | Nee (niet gebouwd) |
| Minimum ledental challenge | 15 aangesloten leden | Werkhypothese; kleine groepen schommelen te sterk | Nee |
| Bonus bij gemarkeerde sessie | In afwachting tot het besluit | §6 | Nee |

**De experimentarm.** Het businessplan vraagt om een arm "wekelijks puntenbudget dat slinkt bij gemiste dagdoelen" tegenover gewone bijschrijving. Letterlijk opgevat, met alle punten als weekbudget, verdwijnt de vaste ratio per minuut, en die is bindend. Daarom zijn de minuutpunten in beide armen gelijk en verschilt alleen een kleine doelbonus in framing: in arm A verdien je 20 punten per gehaald dagdoel, in arm B staan op maandag 140 punten klaar die per gemist dagdoel met 20 slinken. Verwachte waarde en kosten zijn gelijk; het enige verschil is winst tegenover verlies. Beide regels staan op de uitlegpagina, zodat niemand ongemerkt in een verliesframing zit. Het weekbudget staat "in afwachting" en wordt pas na de week verzilverbaar, dus Rewarded trekt nooit iets in uit een beschikbaar saldo. De joker beschermt de bonus niet.

**Toewijzing.** Per squad bij het aanmaken, en voor solo-gebruikers per persoon bij registratie, 50/50. Wie later bij een squad komt, neemt vanaf de eerstvolgende maandag de arm van de squad over. Zo ziet niemand in dezelfde squad een andere regel. De primaire uitkomst is het aandeel dagen met een gehaald dagdoel (de uitkomstmaat van Patel e.a. 2016); secundair D7 en D30.

Met 300 tot 800 pilotgebruikers (rapport 03) is de uitkomst richtinggevend, geen bewijs (open vraag 5).

## 6. Anti-fraude in de web-MVP

**Wat de web-MVP eerlijk claimt.** "Rewarded telt je focustijd zolang de app zichtbaar op je scherm openstaat. Wissel je van app of tabblad of gaat je scherm uit, dan stopt de sessie." Dat is een bewijs van zelfdiscipline op één apparaat, geen bewijs van focus en geen bewijs dat de telefoon niet gebruikt is (rapport 09, §3.3 en §8). "Bewezen" staat nergens in de app; "geverifieerde minuut" betekent alleen: voldoet aan §4.1. Een websessie rechtvaardigt punten en kleine verdiende prijzen, nooit geld. Een tweede telefoon, een oude telefoon aan de lader of een headless browser sluiten we niet uit; we maken ze onrendabel met daglimiet, weekplafond, telefoonverificatie en wekelijkse voorraadvrijgave.

**Signalen die we loggen per sessie.** Servertijd van start, heartbeats en einde; de nonce-keten; zichtbaarheidsgebeurtenissen met clienttijd en monotone tijd; Wake Lock aangevraagd, verkregen, geweigerd of vrijgegeven; `blur` en `focus` op de desktop; user agent en `navigator.webdriver`; gehasht IP; standalone of browser; het verschil tussen client- en serverklok bij de start. Per account: de registratiebron (uitnodigingslink, verenigingscode, wachtlijst), het aantal accounts per IP-hash en per telefoonnummer, en verzilveringen.

**Heuristieken die markeren.** Deze lijst ligt vast vóór 2 december.

| Code | Heuristiek | Waarom |
|---|---|---|
| H1 | `navigator.webdriver` is waar, of de user agent noemt een headless browser | Automatisering (rapport 09, §3.3) |
| H2 | Meer dan 3 accounts met voltooide sessies vanaf dezelfde IP-hash binnen 24 uur, buiten bekende campusnetwerken | Meerdere accounts (rapport 09, §7.1) |
| H3 | Heartbeatgaten samen meer dan 10% van de sessieduur | Onvolledig bewijs |
| H4 | Klokafwijking tussen client en server van meer dan 5 minuten | Mogelijke manipulatie |
| H5 | De daglimiet van 480 minuten 3 dagen achter elkaar gehaald | Onwaarschijnlijk patroon; plafond-optimalisatie |
| H6 | Sessies zonder onderbreking tussen 01:00 en 06:00 op meer dan 2 nachten per week | Telefoon aan de lader met de pagina open |
| H7 | Een squad waarvan alle leden binnen 10 minuten vanaf dezelfde IP-hash zijn geregistreerd | Nep-squad (vertekent ook het squadcriterium) |
| H8 | Een telefoonnummer dat eerder op een geblokkeerd account stond | Herhaling |

De drempels zijn werkhypothesen zonder externe benchmark. Campusnetwerken (eduroam en de bibliotheekwifi van de pilotsteden) staan op een uitzonderingslijst voor H2, anders markeren we een hele bibliotheek.

**Wat er met een gemarkeerde sessie gebeurt.** De sessie telt voor de streak en het dagdoel. We willen een eerlijke student niet laten lijden onder een vals positief voordat een mens heeft gekeken. De punten staan wel "in afwachting" en tellen niet voor de inverdienperiode, verzilvering of prijzen. De student ziet: "Deze sessie wordt nagekeken (reden: …). Je punten komen vrij zodra dat klaar is, meestal binnen 3 werkdagen." Een beheerder beslist binnen 3 werkdagen: goedkeuren (punten beschikbaar) of afkeuren (punten teruggedraaid, reden in gewone taal). Bij afkeuring telt de sessie met terugwerkende kracht niet meer voor de streak. Zeker bij H1, H7 of H8 blokkeert de beheerder het account, na eigen beoordeling.

**Beroep.** Binnen 14 dagen na een afkeuring, via een knop bij de sessie met een vrij tekstveld. Een andere beheerder dan de eerste beslist binnen 5 werkdagen. Het besluit is definitief binnen de pilot en wordt met een reden teruggekoppeld. Aantal en uitkomst van beroepen zijn een KPI voor de kwaliteit van de heuristieken.

## 7. Meetplan

**Infrastructuur.** Eén tabel `events` (id, naam, user_id, tijd server, eigenschappen als JSON, release, arm). Productevents en grootboekmutaties staan apart, maar zijn te koppelen via `session_id`. KPI's zijn opgeslagen SQL-query's. Elke maandag draait de beheerder het weekrapport.

| Event | Eigenschappen | Wanneer |
|---|---|---|
| `invite_link_opened` | invite_id, type (squad/duel/vereniging), inviter_id | Link geopend, vóór registratie |
| `account_created` | bron, invite_id, vereniging_id, age_band (16–17/18+), arm | Na akkoord met de voorwaarden |
| `daily_goal_set` | minuten, eerste_keer | Doel gekozen of gewijzigd |
| `session_started` | session_id, duur_gepland, device_class, standalone, wakelock_supported | Server maakt de sessie aan |
| `wakelock_state` | session_id, status (acquired/denied/released) | Bij elke wijziging |
| `visibility_hidden` | session_id, verstreken_s | Pagina verborgen |
| `session_completed` | session_id, minuten, punten, flagged, flag_codes | Server keurt het einde goed |
| `session_aborted` | session_id, reden, verstreken_s | Server sluit af als afgebroken |
| `return_after_abort` | session_id, hidden_duur_s | Gebruiker komt terug na afbreken |
| `daily_goal_met` | datum, minuten | Eerste keer per dag dat het doel gehaald is |
| `goal_bonus_booked` | arm, mutatie (+20 / −20 / grant 140), week | Bij grootboekmutatie van de doelbonus |
| `squad_created` | squad_id, arm | Squad aangemaakt |
| `squad_invite_sent` | squad_id, kanaal (share/copy) | Deelknop gebruikt |
| `squad_joined` | squad_id, invite_id, ledental_na | Lid toegevoegd |
| `squad_became_active` | squad_id | Derde lid erbij |
| `squad_day_evaluated` | squad_id, datum, geslaagd, joker_gebruikt, streak | 04:00 dagafsluiting |
| `member_paused` / `member_resumed` | squad_id | Automatische pauze of terugkeer |
| `compare_optin_changed` | aan/uit | Schakelaar gewijzigd |
| `duel_created` / `duel_accepted` / `duel_finished` | duel_id, invite_id, uitslag | Duelstappen |
| `vereniging_joined` | vereniging_id, bron | Aansluiting |
| `challenge_enrolled` | challenge_id | Inschrijving prestatiechallenge |
| `catalog_viewed` | items_zichtbaar, saldo, inverdiend | Tabblad Beloningen geopend |
| `redemption_completed` | item_id, punten, kostprijs, financier_id | Verzilvering gelukt |
| `redemption_blocked` | reden (inverdien/weeklimiet/voorraad/saldo) | Verzilvering geweigerd |
| `flag_reviewed` | session_id, besluit, redencode, doorlooptijd_u | Beheerder beslist |
| `appeal_submitted` / `appeal_decided` | session_id, uitkomst | Beroep |
| `prize_awarded` | prize_id, type (collectief/individueel), waarde | Na winnaarsverificatie |
| `dashboard_viewed` | vereniging_id | Bestuur opent het dashboard |

**De pilot-KPI's.** Definities volgen rapport 03 tenzij anders vermeld.

| KPI | Drempel | Berekening uit events |
|---|---|---|
| Activatie | ≥ 60% | Accounts met `session_completed` (minuten ≥ 25, niet afgekeurd) binnen 24 uur na `account_created` ÷ alle `account_created` |
| D7 / D30 | ≥ 25% / ≥ 12% | Cohort per registratieweek; aandeel met ≥ 1 goedgekeurde `session_completed` op dag N. Correctie voor de kerstvakantie: dagen in de vakantiepauze tellen niet mee bij het tellen tot N (voorstel; open vraag 4) |
| Aandeel actieven in een squad | ≥ 40% | Per week: gebruikers met ≥ 1 `session_completed` die die week lid zijn van een squad met `squad_became_active` ÷ alle gebruikers met ≥ 1 `session_completed` |
| K-factor | ≥ 0,3 | Geactiveerde accounts met een invite_id van een pilotgebruiker ÷ geactiveerde pilotgebruikers die in dezelfde periode konden uitnodigen; per twee weken en voor de hele pilot. Wachtlijst- en verenigingscodes tellen niet als virale aanwas |
| Gemarkeerde sessies | < 5% | `session_completed` met flagged = waar ÷ alle `session_completed`; daarnaast het aandeel afgekeurd na `flag_reviewed` |
| Beloningskosten | binnen budget | Som kostprijs van `redemption_completed` + `prize_awarded` ÷ geboekt budget; plus kosten per actieve gebruiker per week en de week waarin de voorraad op was |
| D7 squad tegenover solo | squad duidelijk hoger | D7 voor accounts die op dag 0–2 in een actieve squad zaten tegenover accounts die dat niet deden. Let op: zelfselectie, dus geen causaal bewijs |
| Fraude na herbeoordeling | ≤ 5% (§9) | Afgekeurde sessies ÷ alle `session_completed`, per bron en per vereniging |

Twee meetregels houden de cijfers eerlijk. Sessies die na herbeoordeling zijn afgekeurd, tellen nergens mee: niet voor activatie, niet voor retentie, niet voor squadcijfers. En accounts van het team en de beheerders worden vooraf uitgesloten met een vlag.

**De experimentarmen.** Er is één experiment: doelbonus als winst (A) tegenover slinkend weekbudget (B), toegewezen per squad of solo-gebruiker (§5). De arm wordt meegeschreven in `account_created`, `squad_created` en `goal_bonus_booked`. Primaire maat: het aandeel gebruikersdagen met `daily_goal_met`, per arm. Secundair: D7, D30 en het aandeel squads. Een tweede experiment voeg ik niet toe: elke extra arm deelt de kleine groepen verder op.

**Kwalitatief.** Supportberichten krijgen een label ("uitbetalen", "focus", "vrienden", "techniek"). Zo zien we het signaal uit businessplan §6: praten gebruikers over focus en vrienden, of over wanneer ze kunnen uitbetalen?

## 8. Scope

| Prioriteit | Onderdeel | Release | Motivatie (criterium) |
|---|---|---|---|
| Must | Onboarding met magic link, leeftijdscheck (16+, vlag 18+), toegang via link of code | R1 | Activatie; 16+ is bindend |
| Must | Focus-engine: 3 lengtes, zichtbaarheid, Wake Lock, servertijd, heartbeat, uitleg bij afbreken | R1 | Alle retentiecriteria; fraude |
| Must | Grootboek met vaste ratio, daglimiet, inverdienperiode, weekplafond | R1 | Beloningskosten; inverdienperiode is bindend |
| Must | Catalogus met CSV-voorraad, weekvrijgave, verzilvering, telefoonverificatie | R1 | Beloningskosten binnen budget |
| Must | Squads: aanmaken, link, aanwezigheid via polling, dagdoel, streak, joker, automatische pauze | R1 | Squadaandeel; K; D7 squad tegenover solo |
| Must | Verenigingscode en aansluiting | R1 | Wedge; nodig voor attributie per vereniging |
| Must | Eventlog en KPI-query's | R1 | Alle criteria |
| Must | Fraudesignalen, heuristieken H1–H8, wachtrij, beroep | R1 | Gemarkeerde sessies < 5%; menselijke herbeoordeling is bindend |
| Must | Experimentarm doelbonus A/B | R1 | Bindende pilotopdracht (businessplan §4) |
| Must | Vakantiepauze | R1 | D30 gecorrigeerd voor de vakantie |
| Must | Verenigingsranglijst op deelnamegraad, bestuursdashboard, collectieve prijs | R2 | Wedge; D30 via de blokchallenge |
| Should | Duels | R2 | Tweede uitnodigingsmoment voor K; goedkoop omdat het de squadlink hergebruikt |
| Should | Individuele prestatiechallenge met vaste plaatsen | R2 | Retentie in de tentamenweken; niet nodig voor een criterium als de collectieve prijs er is |
| Should | E-mailherinneringen (dagdoel en streak in gevaar, max. 1 per dag) | R1 | D7; webpush schrap ik omdat het op iOS alleen werkt in een geïnstalleerde webapp (**aanname**, te controleren) |
| Could | Minuten vergelijken in de squad (opt-in) | R1 als er tijd is | Geen criterium; wel gevraagd door de squadlogica |
| Could | Installatie-uitleg voor de PWA ("zet op je beginscherm") | R1 | Kan Wake Lock-gedrag verbeteren; geen criterium |
| Won't (pilot) | Verlote prijzen, spelvoorwaarden en belastingberekening | R3 of later | Geen criterium; Ksa-voorlegging nog niet gedaan; afwijking van businessplan §10, ter beslissing van de founder |
| Won't (pilot) | Deelbare bewijskaarten met QR | R3 | Gesloten pilot: publieke posts leveren geen pilotactivaties op |
| Won't (pilot) | Referral in punten met vesting | R3 | Zou K vertekenen; §9 vraagt of de sociale loop zonder prikkel werkt |
| Won't (pilot) | Puntvervaldatum | Later | Eerste verval op zijn vroegst in december 2027 |
| Won't (pilot) | Realtime via websockets, pauze binnen een sessie, vrije sessielengtes | — | Geen criterium; extra fraudewegen of infrastructuur |
| Won't (pilot) | Partner-API's, partnerportaal, export voor het bestuur | Na de pilot | CSV volstaat; export botst met het verbod op individuele monitoring |
| Won't (pilot) | Openbare individuele ranglijsten | Nooit | Bindend verbod (businessplan §4) |

**Na de pilot.** R3 (19 januari, publieke lancering) voegt de deelbare kaarten en referral toe, en de verlote prijzen als de Ksa de reeks kleine spellen accepteert. Daarna komen, in de volgorde van de verificatieladder: (1) native apps met voorgrondverificatie en apparaatattestatie (App Attest, Play Integrity), wat grotere catalogusbeloningen per toestel rechtvaardigt; de Family Controls-entitlement wordt aangevraagd zodra het ontwikkelaarsaccount bestaat; (2) iOS-blokkade via Screen Time en Android UsageStats voor verenigingsprijzen met meer waarde; (3) Rewarded Plus vanaf semester 2, nooit gekoppeld aan trekkingskansen; (4) de inzetlaag als commitment contract, pas na de advocatenopinie, de toets door de Kansspelautoriteit, acceptatie door de betaaldienstverlener en native verificatie (businessplan §4 en §8; rapport 02 §7). Het pool-model komt in geen enkele fase terug.

**Volgorde bij tijdnood.** Loopt R1 uit, dan schrappen we in deze volgorde: de Could-items, de e-mailherinneringen, en daarna de squad-opt-in voor het vergelijken van minuten. Focus-engine, grootboek, squads, events en fraudewachtrij schuiven niet: zonder die onderdelen is geen criterium te meten. Liever een week later starten dan een pilot zonder meting.

## 9. Open vragen en aannames

1. **Team en bouwtijd (aanname).** Twee à drie ontwikkelaars en één ontwerper, vier weken tot R1. Klopt dat niet, dan schuift de pilotstart of krimpt R1 volgens de volgorde in §8.
2. **Pilotbudget (open).** Wat hebben verenigingen en partners schriftelijk toegezegd? Zonder dat getal geen puntenprijzen. Uiterste datum voor de prijslijst: 25 november.
3. **Terugkeervenster (open).** Zonder venster breekt een inkomende oproep de sessie af. `return_after_abort` meet hoe vaak dat gebeurt; daarna beslissen we, met de fraudeafweging erbij.
4. **Correctie voor de kerstvakantie (open).** Het businessplan noemt de correctie zonder definitie. Voorstel: dagen in de vakantiepauze (circa 20 december – 4 januari volgens rapport 03, per instelling verschillend) tellen niet mee bij D30. De founder legt dit vóór de pilot vast, niet erna.
5. **Statistische kracht (aanname).** Met 300 tot 800 gebruikers en toewijzing per squad zien we alleen een groot verschil tussen de armen.
6. **Deelnamegraad (keuze, ter toetsing).** Binnen de opties van het businessplan. De jurist bevestigt dat een prijs op deelnamegraad als prestatie geldt.
7. **Leeftijdscontrole bij winnaars (open).** Hoe controleren we leeftijd zonder kopieën van identiteitsbewijzen te bewaren? Nodig voor R3.
8. **iOS in het veld (aanname).** Wake Lock in de Home Screen-app vanaf iOS 18.4 bevestigen op echte toestellen vóór 2 december; het aandeel oudere iOS-versies in de pilot is onbekend. Ook dat webpush op iOS alleen in een geïnstalleerde webapp werkt, is nog te controleren.
9. **DPIA en verwerkers (randvoorwaarde).** DPIA en afspraken met verenigingen over geaggregeerde data zijn klaar vóór de pilot (businessplan §8). De smsdienst is een verwerker.
10. **Heuristieken (aanname).** H1–H8 hebben geen externe benchmark. Ze liggen vast tijdens de pilot en worden daarna geëvalueerd op valse positieven via de beroepen.
11. **Trekkingen naar R3 (besluit gevraagd).** Afwijking van businessplan §10; de founder beslist.
12. **Punten "in afwachting" (aanname).** Studenten accepteren dat punten van gemarkeerde sessies tot 3 werkdagen wachten. Supportlabels en beroepen laten zien of dat klopt.
