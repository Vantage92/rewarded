# Rewarded — Productspecificatie web-MVP

*Rol: hoofd product. Versie 1.0, 4 november 2026. Bouwdocument voor de gesloten pilot (2 december 2026 – 18 januari 2027) en de publieke lancering (19 januari 2027). Bindend kader: `docs/01-businessplan.md` (verder: businessplan). Basis: variant MVP-first (`drafts/05-spec-mvp-first.md`), door beide juryleden als winnaar gekozen, aangevuld met onderdelen uit Retentie-first en Groei-first volgens `drafts/05-jury-1.md` en `drafts/05-jury-2.md`. Bewijs: rapporten 02, 03, 08 en 09 in `docs/research/`. Een getal dat niet uit die bronnen komt, staat er als **werkhypothese** (een keuze die we toetsen) of **aanname** (iets wat we niet weten). Hoofdstuk 10 verantwoordt de keuzes.*

---

## 1. Doel van de MVP en succescriteria

De web-MVP moet in zeven weken pilot twee vragen beantwoorden. De eerste is de go/no-go-vraag uit businessplan §6: laten squads en verenigingsrivaliteit studenten terugkomen naar geverifieerde focussessies, zonder dat fraude of beloningskosten ontsporen? De tweede is de centrale pilothypothese uit §4: blijft het gedrag deels staan als de beloning stopt, omdat een zelfgekozen commitment het overneemt? Volgens rapport 08 had van 54 interventies in Milkman e.a. (2021) 8% na afloop nog effect, en het enige veldbewijs dat een commitmentaanbod effect behoudt, is Royer e.a. (2015), één experiment met een zelfgefinancierd contract (rapport 08 §7, implicatie 8). Dat een zachte vorm zonder geld ook werkt, is een hypothese. Daarvoor bouwen we de Belofte en stopt de doelbonus op een vooraf aangekondigde datum.

Een functie hoort in de MVP als een van die twee vragen zonder haar niet te beantwoorden is, of als het gemeten gedrag zonder haar niet kan ontstaan. De tijd is de harde grens: de pilot start over vier weken. Ik ga uit van twee à drie ontwikkelaars en één ontwerper (**aanname**; rapport 09 §8 schat de eerste twee treden voor zo'n team op 2–4 plus 2–3 weken). Daarom zijn er vier releases, en na 5 januari bouwen we geen nieuwe modules meer.

| Release | Datum | Inhoud | Waarom dan |
|---|---|---|---|
| R1 | 2 december 2026 | Onboarding met leeftijdscheck en oefensessie, focus-engine, grootboek met doelbonus in twee armen, catalogus, squads, uitnodigingsobject, verenigingscode met plafond, promotiekit, bestuursdashboard, aanloopklassement, eventlog, fraudewachtrij met meldroute, vakantiepauze | Alles wat vanaf dag één gemeten moet worden; de koude start heeft in december een instrument nodig |
| R2 | 16 december 2026 | De Belofte, duels, deelbare bewijskaart (Should) | Dag 14 van het eerste cohort; tweede en derde uitnodigingsmoment vóór de kerst |
| R3 | 5 januari 2027 | Prijsperiode blokchallenge, individuele prestatiechallenge, referral achter een vlag, trekkingsmodule met spelvoorwaarden achter een vlag die uit staat | Tentamenweken; referral pas na de meetperiode voor K uit squads |
| Lancering | 19 januari 2027 | Geen nieuwe modules; kaart-QR naar registratie; trekkingen alleen aan na advocatenopinie, Ksa-voorlegging en besluit van de founder | Stabiliseren, niet bouwen |

| Criterium | Drempel | Bron | Wat de MVP levert | Release |
|---|---|---|---|---|
| Activatie | ≥ 60% | Businessplan §6 | Onboarding onder twee minuten, eerste sessie van 25 minuten, oefensessie | R1 |
| D7 | ≥ 25% | Businessplan §6 | Servertijd, dagdoel, squadstreak, live aanwezigheid, e-mailherinnering | R1 |
| D30, gecorrigeerd voor de kerstvakantie | ≥ 12% | Businessplan §6 | Vakantiepauze, blokchallenge in januari | R1 + R3 |
| Aandeel actieven in een squad | ≥ 40% | Businessplan §6 | Squad aanmaken, uitnodiging als toegangsbewijs, squadstreak | R1 |
| K-factor | ≥ 0,3 | Businessplan §6 | Uitnodigingsobject met bron, K per bron | R1 (squad), R2 (duel, kaart), R3 (referral) |
| Gemarkeerde sessies | < 5% | Businessplan §6 | Signaallogging, vaste heuristieken, fraudewachtrij | R1 |
| Beloningskosten binnen budget | binnen budget | Businessplan §5–6 | Dekking uit geboekte omzet, voorraadcontrole, europlafonds | R1 |
| D7 squadleden hoger dan solo | voorstel ≥ 1,5× (rapport 03) | Businessplan §9 | Squadstatus per gebruiker per dag | R1 |
| Fraude na herbeoordeling | ≤ 5% | Businessplan §9 | Besluiten van de beheerder | R1 |
| Centrale hypothese: overname, naleving, nawerking | geen drempel; vooraf vastgelegde analyse | Businessplan §4; rapport 08 H-B, H-C | De Belofte, aangekondigd einde van de doelbonus, randomisering per squad | R2 |

Drie kanttekeningen houden de meting eerlijk. Het budgetcriterium wordt per constructie gehaald, omdat er nooit meer verzilverd kan worden dan er gedekte voorraad is; de informatieve maat is de kostprijs per actieve gebruiker per week. Het fraudecriterium hangt af van onze eigen heuristieken, dus die liggen vóór 2 december vast en veranderen niet om onder de 5% te blijven. En voor de Belofte zetten we geen drempel: het businessplan noemt er geen, en met 300 tot 800 pilotgebruikers (rapport 03 §5) geeft de vergelijking een richting, geen bewijs. Alle definities, drempels en de kerstcorrectie legt de founder vóór 2 december vast in een voorregistratie (10.5).

## 2. Gebruikers en hun taken

**Student (16+).** Een hbo- of wo-student voor zijn tentamens die zijn telefoon niet kan laten liggen. Hij wil een studieblok afmaken, zien dat het lukte en een ritme vasthouden, zonder het gevoel dat hij voor centen studeert. Hij komt binnen via een vriend of vereniging. Voor 16- en 17-jarigen bestaan trekkingen niet.

**Squadlid.** Dezelfde student in een squad van drie tot zes. Zijn kernvraag is "doen de anderen mee?", niet "hoeveel punten heb ik?".

**Verenigingsbestuur.** Twee à drie bestuursleden, meestal de commissaris onderwijs. In de koude start de belangrijkste verspreider; het dashboard is daarom vooral een wervingsinstrument. Individuele monitoring is uitgesloten (businessplan §8).

**Beheerder van Rewarded.** De founder plus een of twee teamleden (**aanname**). Elk besluit met gevolgen voor punten of prijzen neemt een mens; elke inzage in sessiegegevens wordt gelogd.

| Rol | Belangrijkste taken | Wat de rol nooit ziet of kan |
|---|---|---|
| Student | Sessie starten, uitleg lezen, dagdoel kiezen, punten verzilveren, kaart maken | Sessies of minuten van anderen buiten de eigen squad of het eigen duel |
| Squadlid | Uitnodigen, aanwezigheid zien, streak bewaken, opt-in minuten vergelijken, Belofte doen, duel | Een openbare individuele ranglijst; punten van anderen |
| Bestuur | Aanmelden, ledental opgeven, werven met de promotiekit, stand volgen, prijs ontvangen | Namen, uren of sessies van leden; wie niet meedoet; een export; berichten aan leden |
| Beheerder | Verenigingen, challenges, partners, catalogus, budget, fraudewachtrij, beroep, vakantiepauze, KPI-query's | Sessiegegevens inzien zonder reden en zonder logregel |

## 3. Kernflows stap voor stap

### 3.1 Onboarding en leeftijdscheck (R1)

1. Binnenkomst via een squad-, duel- of verenigingslink, een QR uit de promotiekit of een wachtlijstuitnodiging. In de gesloten pilot geeft alleen zo'n uitnodiging toegang; de bron wordt als eerste vastgelegd.
2. Bij een persoonlijke uitnodiging staat de uitnodiger bovenaan. De belofte gaat over focus en samen; beloningen staan in één regel eronder: "Na vijf uur focus kun je punten inwisselen bij partners. Geen geld."
3. De eerlijke claim uit rapport 09 §3.3, letterlijk: "Rewarded telt je focustijd zolang de app zichtbaar op je scherm openstaat. Ga je naar een andere app of tabblad, of gaat je scherm uit, dan stopt de sessie."
4. E-mail met magic link, zonder wachtwoord; voornaam verplicht, achternaam optioneel.
5. Geboortedatum. Onder 16: "Rewarded is er vanaf 16 jaar", en er wordt niets opgeslagen. Anders bewaart de server alleen de leeftijdsklasse en de datum van 18 worden (4.10).
6. Akkoord met voorwaarden en privacyverklaring: welke signalen we loggen, dat de pilot met vooraf toegewezen groepen met verschillende bonusregels werkt, en dat de doelbonus op 18 januari 2027 stopt.
7. Dagdoel kiezen (25, 50, 90 of 120 minuten, standaard 25), met de overmoedrem uit 4.4.
8. Tip "Niet storen": een inkomend gesprek of het openen van een melding stopt de sessie.
9. Oefensessie van één minuut: "Start, en ga dan even naar een andere app." Zo ziet de student wat een afbreking is.
10. "Start je eerste sessie van 25 minuten." Wie via een squadlink kwam, ziet zijn squad erboven.

### 3.2 Eerste focussessie (R1)

1. Eenmalige checklist: telefoon met het scherm naar beneden, liefst aan de lader; op de laptop het tabblad open in een zichtbaar venster.
2. Keuze 25, 50 of 90 minuten. De server opent de sessie in servertijd en geeft een nonce terug.
3. De client vraagt een Wake Lock aan. Lukt dat niet: "Je scherm kan vanzelf uitgaan. Zet automatisch vergrendelen tijdelijk uit, anders stopt je sessie."
4. Tijdens de sessie: donker scherm, resterende tijd, wie van de squad ook focust, één knop Stoppen. Geen punten in beeld: die maken van de sessie werk voor loon (Gneezy e.a. 2011, rapport 08 §7 implicatie 7).
5. Einde: de server valideert (4.1) en schrijft de punten direct bij (Levitt e.a. 2016). Het eindscherm toont eerst competentiefeedback ("Je eerste 25 minuten. Je dagdoel is gehaald."), dan de squad, dan de punten en de inverdienvoortgang. Informatieve feedback verhoogde in Deci e.a. (1999) de vrijwillige voortzetting.
6. Onderaan, zonder pop-up, vanaf R2: "Maak een kaart".

### 3.3 Sessie afgebroken (R1)

1. De server sluit de sessie op het eerste afbreeksignaal uit 4.1.
2. Bij terugkeer, zonder verwijt: "Je sessie stopte om 14:32 omdat Rewarded niet meer zichtbaar was. Je hield 18 minuten vol. Afgebroken sessies leveren geen punten op: we kunnen alleen tijd belonen die we kunnen zien."
3. Knoppen: "Opnieuw beginnen", "Kortere sessie" (na een afgebroken sessie van 50 of 90 minuten) en "Klopt dit niet?". Die laatste zet een melding in de fraudewachtrij (6.4) en staat extra duidelijk bij een afbreking door een heartbeatgat, omdat daar een automatisch signaal punten kost.
4. Na de derde afbreking op een dag stelt de app een kortere sessie en "Niet storen" voor. Een afgebroken sessie breekt de squadstreak niet; alleen een gemist dagdoel telt. De squad ziet geen "gefaald".

Een gebroken reeks leidt tot meer terugval dan het gedrag verklaart, en een herstelmogelijkheid dempt dat (Silverman en Barasch 2023, rapport 08 §4). Punten voor een afgebroken sessie mogen niet; de weg terug kort maken wel.

### 3.4 Punten en catalogus (R1)

1. Saldo in drie delen: *beschikbaar*, *in afwachting* (gemarkeerde sessie of weekbudget arm B) en *referral, nog niet vrij*; daaronder de inverdienvoortgang.
2. Catalogus met per item puntenprijs, financier, voorraad van deze week en voorwaarden. Bovenaan: "Punten geven toegang tot de catalogus zolang de voorraad strekt. Punten zijn geen geld en geven geen recht op een bepaalde beloning."
3. Onder 300 geverifieerde minuten is Verzilveren uitgeschakeld, met de resterende tijd erbij.
4. Bij de eerste verzilvering verifieert de student één telefoonnummer per sms (rapport 09 §8).
5. De server controleert in één transactie saldo, week- en maandplafond, voorraad en dekking, schrijft af en reserveert een vouchercode (in de app en per e-mail).
6. Bij een plafond: "Maandag kun je weer verzilveren. Je punten blijven staan."

### 3.5 Squad aanmaken en uitnodigen (R1)

1. "Focus samen. Squads houden het beter vol." De student kiest een naam (gemodereerd) en optioneel zijn vereniging.
2. Hij krijgt een uitnodigingslink (4.4), te delen via WhatsApp met de Web Share API. De voorgestelde tekst gaat over focus en samen en noemt geen punten of prijzen, ook niet in de linkvoorvertoning.
3. De genodigde slaat de wachtlijst over, doorloopt 3.1 en landt in de squad.
4. Tot drie leden is de squad "in opbouw" ("Nog 2 vrienden nodig"); de maker focust intussen solo.
5. Het squadscherm toont leden, wie nu focust, wie zijn dagdoel haalde, wie op pauze staat en de streak.

### 3.6 Duel (R2)

1. Uitdagen vanaf een squadlid of met een duellink.
2. De tegenstander accepteert binnen 48 uur; accepteren is de opt-in voor de vergelijking. Een nieuwe gebruiker doorloopt eerst 3.1.
3. Zeven dagen lang zien beiden dagelijks elkaars geverifieerde minuten. De winnaar krijgt een badge; daarna revanche of samen een squad.

### 3.7 Verenigingschallenge en bestuursdashboard (R1, prijsperiode R3)

1. Na een schriftelijke toezegging maakt de beheerder de vereniging aan; het bestuur geeft het ledental op met een bron.
2. Het bestuur krijgt een lidmaatschapscode, een QR per kanaal en de promotiekit.
3. Een lid scant de QR of voert de code in; zijn sessies tellen vanaf dat moment.
4. Tot de vakantiepauze loopt een aanloopklassement zonder prijs; in de tentamenweken de prijsperiode.
5. Leden zien de ranglijst van verenigingen; het bestuur ziet aggregaten (4.6).
6. Na fraudecontrole en winnaarsverificatie wordt de uitslag definitief en bekendgemaakt.

### 3.8 Verdiende prijs (R3)

1. De beheerder maakt een prestatiechallenge aan ("elke dag van de tentamenweek minstens 120 minuten") met een vaste prijs per winnaar en evenveel plaatsen als er gefinancierde prijzen zijn.
2. Inschrijven kan vóór de start, tot de plaatsen vol zijn: wie de prestatie levert, krijgt de prijs. Geen race, geen loting.
3. Voortgang per dag, met "Verdiend, niet verloot". Na afloop winnaarsverificatie en levering, of een reden en beroep.

### 3.9 Verlote prijs, 18+ met spelvoorwaarden (R3, vlag uit)

1. De module staat uit tot de advocatenopinie, een positieve Ksa-voorlegging (businessplan §8) en een besluit van de founder.
2. Alleen voor `18_plus`, na een aparte opt-in. Voor jongeren bestaat het onderdeel niet.
3. Gratis deelname voor wie zijn weekdoel haalde; geen aankoop, abonnement of extra lot.
4. Een rustige kaart "Kans op" onder de catalogus met prijs, aantal prijzen, de kans als getal, trekkingsdatum, seed-hash en spelvoorwaarden. Na de trekking: aantal deelnemers en seed. Geen "bijna gewonnen".

### 3.10 Deelbare bewijskaart (R2, Should)

1. Na een voltooide sessie, mijlpaal of gewonnen duel: "Maak een kaart". Delen staat standaard uit.
2. Inhoud volgens 4.8; nooit punten, bedragen, beloningen of trekkingen.
3. De QR opent de verificatiepagina; "Focus ook" leidt in de pilot naar de wachtlijst met voorrang, vanaf 19 januari naar registratie. Delen levert niets op.

### 3.11 Referral (R3, vlag)

1. Vanaf 5 januari, na besluit van de founder, heeft elke gebruiker een persoonlijke link; squad- en duellinks tellen dan ook als referral.
2. Beide accounts krijgen punten met de status *nog niet vrij*. De uitnodiger ziet alleen "Joris: 2 van 3 sessies".
3. Vesting volgens 4.9; zonder vesting vervallen de punten stil.

### 3.12 De Belofte (R2)

Deze flow staat niet in de lijst van het businessplan, maar maakt de centrale pilothypothese meetbaar (10.3).

1. In de arm "vroeg" ziet de gebruiker op dag 14, of eerder na 8 gehaalde dagdoelen: "Je hebt twee weken gefocust. Wil je jezelf iets beloven voor de komende twee weken?" In de arm "laat" komt hetzelfde aanbod op 1 februari 2027.
2. Hij kiest dagen per week, minuten per dag en getuigen (de squad of niemand). De app stelt een waarde voor op basis van wat hij werkelijk deed.
3. De getuigen zien de Belofte en per dag of ze gehaald is. Er hangen geen punten aan.
4. Na 14 dagen een reflectie ("Je haalde je Belofte op 9 van 12 dagen"): verlengen, aanpassen of stoppen. Stoppen kan altijd met één tik, zonder schuldtaal.
5. Bij de reflectie krijgen 18-plussers één vrijblijvende vraag: "Zou je bij een volgende Belofte een bedrag inzetten dat naar een goed doel gaat als je hem niet haalt?" Er is geen betaalfunctie; het antwoord indiceert H-C (rapport 08 §7).

## 4. Functionele specificatie per module

### 4.1 Focus-engine

**Zichtbaarheid en pauze.** De sessie loopt alleen zolang `document.visibilityState === "visible"`. Er is geen terugkeervenster en geen pauze binnen een sessie: businessplan §4 laat de sessie stoppen zodra je het scherm verlaat, en een venster of pauze opent een fraudeweg die het web niet kan controleren. Wie pauze wil, rondt af en start opnieuw. We loggen wel hoe lang de pagina verborgen was als de gebruiker terugkomt, zodat de founder na de pilot op data over een kort venster kan beslissen (open vraag 9). Op de laptop blijft een zichtbaar tabblad naast een ander venster `visible` (rapport 09 §3.2): werken in een ander venster mag, en `blur` en `focus` zijn alleen een zwak signaal.

**Wake Lock en tijd.** De client vraagt de lock aan bij de start en na elke terugkeer naar `visible`. Wordt hij vrijgegeven terwijl de pagina zichtbaar is (lage batterij, energiebesparing), dan waarschuwt de app en probeert hij opnieuw; de sessie loopt door zolang het scherm aan is. Volgens de compatibiliteitsdata werkt Wake Lock vanaf Chrome 84, Firefox 126, Safari macOS 16.4 en volledig op iOS vanaf 18.4, ook als Home Screen-app (rapport 09 §3.1). Dat is geen veldtest; vóór 2 december testen we op minstens één iPhone (Safari en Home Screen-app) en twee Android-toestellen. Verstreken tijd is `server_end − server_start`; de klok van de client telt niet voor punten.

| Parameter | Waarde |
|---|---|
| Sessielengtes | 25, 50, 90 minuten (businessplan §4); geen vrije lengtes |
| Oefensessie | 1 minuut, alleen in de onboarding en op de pagina "Hoe we tellen"; telt nergens mee |
| Eén sessie tegelijk | Per account, door de server afgedwongen; een start op een tweede toestel beëindigt de eerste (`second_session`) |
| Heartbeat | Elke 30 s, met de laatst ontvangen nonce, zichtbaarheidsstatus en monotone klok (`performance.now()`); de server antwoordt met een nieuwe nonce |
| Einde | De client meldt het einde als de monotone klok de duur bereikt; de server accepteert bij een serververstreken tijd ≥ duur − 30 s |
| Claimvertraging | Seconden van het einde tot de eerste aanraking of terugkeer naar `visible`; alleen signaal (H9), houdt punten niet tegen |

**Heartbeatgaten.** Wifi in een bibliotheek valt soms weg, dus de client buffert zijn zichtbaarheidsgebeurtenissen en heartbeats met monotone tijd en stuurt die bij herstel na. De server beslist pas als de client terug is of als de geplande eindtijd plus 10 minuten zonder herstel verstreken is.

| Situatie | Gevolg |
|---|---|
| Interval tussen heartbeats ≤ 90 s | Telt (normaal netwerkgedrag) |
| Gat > 90 s en ≤ 5 min, met een gebufferd log dat het hele gat dekt: geen `hidden`, buffered heartbeats op tijd, monotone klok binnen 5 s van de serververstreken tijd | Telt |
| Som van gedekte gaten > 10% van de geplande duur | Telt, maar gemarkeerd (H3) |
| Gat > 5 min, ook met log | Afgebroken op de laatste geldige heartbeat (`heartbeat_gap`) |
| Gat > 90 s zonder dekkend log | Afgebroken op de laatste geldige heartbeat (`heartbeat_gap`), met meldroute |
| Log toont `hidden` in het gat | Afgebroken op het tijdstip van `hidden` |

Het maximum van 5 minuten komt uit Retentie-first en is een **werkhypothese**.

**Wat telt als afgebroken.** Elke reden heeft een vaste code en copy, die ook support gebruikt. Een afgebroken sessie levert geen punten op en telt niet voor dagdoel, streak, duel, challenge of Belofte. Voltooid is een sessie die het geplande einde haalt zonder afbreekreden.

| Code | Reden | Kern van de uitleg |
|---|---|---|
| `hidden` | `visibilitychange` naar `hidden` of `pagehide` vóór het einde | "Rewarded stond niet meer op je scherm." |
| `heartbeat_gap` | Gat zonder dekkend log, of gat > 5 minuten | "We kregen een tijd geen signaal van je toestel." |
| `user_stop` | Stoppen na bevestiging | "Je stopte zelf." Geen fraudesignaal |
| `second_session` | Sessie gestart op een ander toestel | "Je startte een sessie op een ander toestel." |
| `late_end` | Einde > 10 minuten na de geplande eindtijd zonder heartbeats ertussen | "We kregen je einde te laat binnen." |

| Randgeval | Gedrag | Reden |
|---|---|---|
| Inkomend gesprek | Afgebroken (`hidden`) | Niet te onderscheiden van een app openen; preventie via "Niet storen" |
| Melding bovenin zonder openen | Loopt door | Geen zichtbaarheidswijziging |
| Batterij leeg of toestel uit | Afgebroken op de laatste heartbeat | Geen signaal |
| Klok van het toestel vooruitgezet | Geen effect op de duur; afwijking > 5 min markeert (H4) | Servertijd |
| Twee tabbladen | Het tweede kan geen sessie starten | Eén sessie per account |
| Laptop dichtgeklapt of venster geminimaliseerd | Afgebroken (`hidden`) | MDN, rapport 09 §3.1 |
| Sessie over 04:00 | Telt voor de startdag | Eén dagrand |
| Storing aan onze kant | Sessies met een gat in de storingsperiode gaan naar de wachtrij en worden hersteld | Onze fout, niet die van de student |

**Uitleg.** Elke afgebroken of gemarkeerde sessie toont de reden in gewone taal en de tijd tot het stoppen. De pagina "Hoe we tellen" geeft de eerlijke claim, deze regels en wat we niet kunnen zien (een tweede apparaat, of je echt leert).

### 4.2 Puntengrootboek

Het grootboek is een append-only tabel met mutaties (type, bedrag, status, bron, tijdstempel, verwijzing). Saldi zijn afgeleid, nooit los opgeslagen, zodat de verplichting per gebruiker altijd controleerbaar is (businessplan §5). Statussen: *in afwachting*, *beschikbaar*, *nog niet vrij*, *verzilverd*, *vervallen*, *teruggedraaid*.

| Mutatietype | Betekenis | Release |
|---|---|---|
| `earn_session` | 1 punt per geverifieerde minuut van een voltooide sessie | R1 |
| `goal_bonus` | Arm A: +20 per gehaald dagdoel | R1 |
| `goal_budget_grant` / `goal_budget_secure` / `goal_budget_lapse` | Arm B: weekbudget *in afwachting*; 20 naar *beschikbaar* per gehaald dagdoel; 20 vervalt per gemist dagdoel | R1 |
| `redeem` | Verzilvering | R1 |
| `release_flag` / `reverse` | Vrijgave of terugdraaiing na een besluit over een gemarkeerde sessie | R1 |
| `adjust` | Correctie door een beheerder na een melding of beroep, met redencode | R1 |
| `referral_pending` / `referral_vest` / `referral_lapse` | Referral | R3 |
| `expire` | Verval | Niet gebouwd |

| Regel | Waarde |
|---|---|
| Ratio | 1 punt per geverifieerde minuut, vast en gepubliceerd; direct bijgeschreven; nergens een eurowaarde per punt |
| Daglimiet | 480 minuten per dag voor punten, dagdoel, duel en challenge (werkhypothese 8 uur, businessplan §4) |
| Dagrand | 04:00–04:00 Europe/Amsterdam (**aanname**: studenten werken laat); een sessie hoort bij haar startdag |
| Inverdienperiode | 300 geverifieerde minuten vóór de eerste verzilvering; gemarkeerde minuten pas na vrijgave; bonus- en referralpunten tellen niet |
| Weekplafond | 1 verzilvering per week vanaf maandag 04:00, plus de europlafonds uit 4.3 |
| Seizoen doelbonus | 2 december – maandag 18 januari 2027 04:00, niet in de vakantiepauze; vermeld in de voorwaarden, op de uitlegpagina en bij elke bonusmutatie |
| Vervaldatum | 12 maanden na de laatste voltooide sessie, bericht 30 dagen vooraf (werkhypothese); in de voorwaarden, niet gebouwd: eerste verval op zijn vroegst december 2027 |
| Negatief saldo | Na een afgekeurde sessie verrekend met toekomstige punten, nooit in geld teruggevorderd; een verstrekte voucher blijft geldig |
| Account verwijderen | Punten vervallen, na een waarschuwing |
| Gelijktijdige verzilvering | Rijvergrendeling per account |

Na het seizoen blijft alleen de ratio. Zo bouwt de beloning af zonder dat de ratio verandert, en het stopmoment is het begin van de nawerkingsmeting (7.3).

### 4.3 Catalogus en verzilvering

**Budgetdekking.** Het beloningsbudget is een afgeleide van geboekte omzet (businessplan §1 besluit 2, §5). Geboekt betekent gefactureerd, of vastgelegd in een getekend contract met bedrag en datum; een toezegging zonder contract telt niet. De beheerder legt per partner de documentverwijzing vast. Het budget bestaat uit (a) wat een partner rechtstreeks voor beloningen financiert, één op één gedekt, en (b) een vast percentage van de overige geboekte omzet, werkhypothese hoogstens 20% van de geboekte sponsoromzet (rapport 02 §5.2). Een item is niet te publiceren zolang `kostprijs × voorraad` niet binnen het vrije budget valt.

**Verplichting naast budget.** Uitstaande punten zijn geen schuld in euro's, maar wel een verwachting. De beheeromgeving toont dagelijks per gebruiker en in totaal de uitstaande beschikbare punten, hun waarde tegen de budgetwaarde per punt, de gedekte voorraadwaarde en de dekkingsgraad. Het wekelijkse dekkingsalarm gaat af als het aantal gebruikers voorbij de inverdienperiode, maal één verzilvering, groter is dan de vrijgegeven voorraad van de komende week. Puntenprijzen veranderen dan niet: de beheerder geeft voorraad vrij als er budget is, of de catalogus zegt eerlijk "deze week op".

| Regel | Waarde |
|---|---|
| Puntenprijs | `kostprijs ÷ budgetwaarde per punt`, afgerond op 50; `budgetwaarde per punt = beloningsbudget ÷ verwachte geverifieerde minuten` (teamaanname); vast zolang het item bestaat; prijslijst uiterlijk 25 november |
| Weekvrijgave | Voorraad per pilotweek vrijgegeven; de app toont ook nul ("Deze week op; maandag komen er 15 bij"); "bijna op" alleen onder 10% echte voorraad |
| Vouchers | Unieke codes per CSV-import, na reservering aan één account gekoppeld; fysieke items via een code die de student bij de vereniging laat zien; geen partner-API's |
| Voorraad op tijdens afrekenen | Niets afgeschreven |
| Kapotte code | Via "Werkt niet" binnen twee werkdagen een nieuwe code of de punten terug |
| Partner trekt zich terug | Verstrekte codes blijven geldig; item offline; niet-geleverde verzilveringen teruggeboekt |

**Europlafonds op trede 1.** Rapport 09 §8 noemt voor web plus identiteit "centen tot enkele euro's per week" en het businessplan (besluit 5) staat op deze trede alleen kleine prijzen toe. Rapport 09 verdeelt de web-MVP over trede 0 en 1; het businessplan voegt die samen tot trede 1. De beheeromgeving dwingt deze werkhypothesen af:

| Plafond | Waarde | Afgedwongen bij |
|---|---|---|
| Kostprijs per catalogusitem | ≤ €5 | Publiceren van een item |
| Waarde per individuele verdiende prijs | ≤ €10 | Aanmaken van een prestatiechallenge |
| Per persoon per kalendermaand, catalogus en individuele prijzen samen | ≤ €15 | Verzilvering en toekenning |
| Hoofdprijs per poule | ≤ €150, in natura | Aanmaken van de challenge |
| Drempelprijs per vereniging | ≤ €75, in natura | Aanmaken van de challenge |

Geen enkele beloning op trede 1 is geld of vrij besteedbaar tegoed.

### 4.4 Squads

| Regel | Waarde | Reden |
|---|---|---|
| Omvang | 3–6 actieve leden; met 1–2 "in opbouw": aanwezigheid, geen streak | Businessplan §4 |
| Lidmaatschap | Eén squad per student in de pilot | "Squad of solo" scherp meetbaar |
| Uitnodigingslink | Object met bron `squad`, maker, 7 dagen geldig, max. 5 gebruikers | Attributie voor K (Groei-first) |
| Uitnodigingsmomenten | Alleen bij aanmaken, bij een vrije plek (max. 1× per week), bij aansluiten bij de verenigingschallenge, en na 7 dagen "in opbouw" één keer een nieuwe link of een duel | Geen spam, geen beloning op uitnodigen |
| Live aanwezigheid | "Focust nu (nog 32 min)", polling elke 30 s; stille modus verbergt het lid, dat wel meetelt | Een halve minuut vertraging hindert geen criterium |
| Minuten vergelijken | Standaard uit; wie het aanzet, ziet alleen leden die het ook aanzetten | Businessplan §4; Bursztyn en Jensen 2015 |
| Dagdoel | 25 / 50 / 90 / 120 min; wijziging geldt vanaf de volgende dag | Niemand verlaagt op het laatste moment om de streak te redden |
| Overmoedrem | In de eerste 7 dagen vraagt 90 of 120 om bevestiging ("Begin liever klein"); na 7 dagen een voorstel: de hoogste doelwaarde die niet boven de mediaan ligt van de geverifieerde minuten op actieve dagen, minimaal 25 | Carrera e.a. 2018; Leuven e.a. 2010 (rapport 08) |
| Squadstreak | Een squaddag slaagt als minstens de helft van de actieve leden (naar boven afgerond, min. 2) zijn dagdoel haalt of een joker gebruikt | Rapport 03: squads die door één afhaker uiteenvallen (werkhypothese) |
| Rustdag-joker | 1 per lid per week, automatisch bij het eerste gemiste dagdoel, niet op te sparen; beschermt alleen de streak | Businessplan §4; Silverman en Barasch 2023 |
| Automatische pauze | Na 7 dagen zonder voltooide sessie; neutraal getoond ("Joris staat op pauze"); terug bij de volgende sessie, actief vanaf de dag erna | Businessplan §4 |
| Onder 3 actieve leden door pauzes | Streak bevriest in plaats van te breken | Niet straffen voor andermans pauze |
| Vakantiepauze | Dagen tellen niet en breken niets | Kerstdip |
| Lid vertrekt / maker vertrekt | Telt vanaf de volgende dag niet mee / beheer naar het langst zittende lid | — |
| Archief | Na 14 dagen zonder actieve leden | — |

### 4.5 Duels

Twee spelers, 7 dagen vanaf de volgende dag 04:00, op geverifieerde minuten met het dagplafond van 480. De winnaar krijgt een badge; er staan geen punten of prijzen op het spel. Een puntenoverdracht van verliezer naar winnaar is het pool-model in het klein (businessplan besluit 3) en een directe prikkel tot samenspanning. Het duel is er voor het uitnodigingsmoment en voor competitie in een klein verband (Patel e.a. 2019, rapport 08 §6). De duellink is een uitnodigingsobject met bron `duel`, één gebruiker en 48 uur geldig. Gelijke stand is gelijkspel. Een speler met een gemarkeerde sessie in de duelperiode krijgt pas na het besluit een uitslag. Per speler loopt één duel tegelijk. Een duel met een niet-squadlid is individuele vergelijking buiten de squad, opt-in door acceptatie; de founder bevestigt dat dit binnen de randvoorwaarde valt (10.5).

### 4.6 Verenigingschallenge

De ranglijst rekent op deelnamegraad, een van de twee opties uit businessplan §4. Met alleen gekoppelde leden in de noemer, zoals in MVP-first, zou een vereniging hoger scoren door alleen fanatieke leden te laten aansluiten. Met het opgegeven ledental in de noemer loont het om ook twijfelaars te werven, en daar draait de koude start op (rapport 03, loop B). Het gemiddelde per actief lid komt ernaast als tweede cijfer, zonder prijs. Totalen tonen we nooit.

| Regel | Waarde | Reden |
|---|---|---|
| Deelnamegraad per week | Gekoppelde leden met ≥ 3 dagen dagdoel gehaald in de challengeweek ÷ max(opgegeven ledental, gekoppelde leden bij het begin van de week) | Noemer kan niet krimpen door weinig leden te koppelen (Groei-first) |
| Vertrek tijdens de week | Blijft in de noemer | Geen leden wegsturen |
| Intensiteit | Gemiddelde gecapte geverifieerde minuten per actief lid per dag; geen prijs | Tweede cijfer |
| Ledental | Opgegeven door het bestuur met bron (jaarverslag of ALV-stuk); plausibiliteit gecontroleerd door de beheerder | Niet te controleren zonder namenlijst |
| Codeplafond | Hoogstens 1,1 × het opgegeven ledental; daarboven gaan koppelingen naar de beheerder | Geen niet-leden koppelen |
| Poules | Opgegeven ledental < 150, 150–500, > 500 (**aanname**, rapport 03 §7); minstens 3 verenigingen per poule, anders samengevoegd met de naastgelegen poule | Vergelijkbare groepen |
| Minimum | 15 gekoppelde leden (werkhypothese) | Kleine groepen schommelen te sterk |
| Plafond | 480 minuten per lid per dag; een joker telt niet als gehaald dagdoel | Businessplan §4 |
| Aanloopklassement | Vanaf R1 (uiterlijk 9 december) tot de vakantiepauze, zonder prijs | Wervingsreden in december |
| Prijsperiode | Werkhypothese 4–10 en 11–17 januari 2027; score = gemiddelde van de twee weken | Tentamendata per instelling niet geverifieerd (rapport 03 §5) |
| Hoofdprijs | Per poule de winnaar, ≤ €150 in natura | Verdiend, nooit verloot (businessplan §6) |
| Drempelprijs | Elke vereniging die de vooraf bekendgemaakte drempel haalt (werkhypothese: gemiddelde deelnamegraad ≥ 25%), ≤ €75 in natura | Onderkant haakt niet af; demotivatie onderaan is plausibel maar secundair onderbouwd (rapport 08) |
| Uitslag | Pas na fraudecontrole en winnaarsverificatie (4.7); vier ogen bij publicatie | — |

**Bestuursdashboard.** Alleen aggregaten; een cijfer is pas zichtbaar bij minstens 5 leden in de groep; geen namen, lijsten, tijdstippen of export; geen berichten aan leden.

| Tabblad | Inhoud |
|---|---|
| Stand | Positie in de poule, deelnamegraad, intensiteit, afstand tot de vereniging erboven en tot de drempel; dagelijks ververst, definitief na de fraudecontrole |
| Werving | Gekoppelde en actieve leden per dag, aandeel leden in een squad, aantal squads, koppelingen per QR-bron |
| Promotiekit | Teksten, storysjabloon, poster met QR per bron, dia en "wat je wel en niet belooft"; geen bedragen, trekkingen of individuele beloningen |
| Prijs | Status van hoofd- en drempelprijs, financier, levering; na afloop een deelbare verenigingskaart |
| Kwaliteit | Aandeel gemarkeerde sessies van de vereniging, met de uitleg dat die pas na vrijgave meetellen |

### 4.7 Prijzen: verdiend tegenover verloot

| Kenmerk | Verdiende prijs | Verlote prijs |
|---|---|---|
| In de pilot | Ja, collectief en individueel, vanaf R3 | Gebouwd in R3, vlag uit tot advocatenopinie en Ksa-voorlegging |
| Basis | Prestatie: drempel of rang, vooraf bekend; individueel met vaste plaatsen | Kans onder wie het weekdoel haalde (dagdoel op ≥ 5 van 7 dagen, jokers tellen niet) |
| Leeftijd | 16+ (tenzij de financier 18+ eist) | 18+, aparte opt-in, onzichtbaar voor jongeren |
| Taal | "Verdiend", "behaald" | "Kans op", met de kans als getal |
| Plek | Bij de challenge | Onder de catalogus; nooit op het startscherm, op kaarten, in uitnodigingen of in de promotiekit |
| Grens | Europlafonds uit 4.3 | Elk spel ≤ €4.500 of binnen de jaarlimiet (één spel, twintig trekkingen, €100.000) |
| Kosten | Prijswaarde | Prijswaarde × 100/62,2: kansspelbelasting 37,8% voor rekening van Rewarded (rapport 02 §2.2, §5.1) |
| Kader | Geen kansbepaling; toetsen in de advocatenopinie | Gedragscode promotionele kansspelen; Rewarded als organisator (Apple 5.3.1, 5.3.2) |

**Winnaarsverificatie.** Voor elke prijs: (1) alle sessies in de periode zijn niet gemarkeerd of na herbeoordeling vrijgegeven; (2) het telefoonnummer is geverifieerd; (3) geen IP-hash- of telefoonoverlap met andere winnende accounts; (4) een menselijke beoordeling; (5) bij een individuele prijs een bevestiging per e-mail met de naam voor levering; (6) bij 18+-prijzen een leeftijdscontrole met een identiteitsbewijs dat niet wordt opgeslagen (open vraag 8). Bij een collectieve prijs herberekent de beheerder de uitslag zonder gemarkeerde sessies; boven 10% gemarkeerd volgt eerst een steekproef van 20 accounts (werkhypothese) en bij clusters een gesprek met het bestuur. Levering na 14 dagen (rapport 09 §8: vertraagde uitbetaling).

**Spelvoorwaarden en trekking.** In de app: organisator, looptijd, deelnamevoorwaarden, prijzen, winnaarsbepaling, bekendmaking, klachtenadres en kansspelbelasting voor rekening van Rewarded. Vóór de sluiting publiceert de app de hash van de seed, na de trekking de seed zelf. De beheeromgeving telt de waarde per spel en per jaar, weigert een spel boven €4.500 of boven de jaarlimiet, en toont bij elk spel de kansspelbelasting als kostenpost (prijswaarde × 37,8/62,2; een spel met €300 aan prijzen kost ongeveer €482). Die kosten gaan van het beloningsbudget af voordat de trekking gepubliceerd kan worden.

### 4.8 Deelbare kaarten (R2, Should)

| Regel | Waarde |
|---|---|
| Delen | Opt-in per kaart, op initiatief van de gebruiker; delen levert niets op, ook geen referralpunten |
| Formaat | Op de server gegenereerd, 9:16 of vierkant, via de Web Share API of opslaan |
| Standaard op de kaart | Voornaam, duur of uren, streak |
| Alleen als aangezet | Achternaam, instelling, vereniging; squadnaam alleen als alle leden het toestaan |
| Nooit | Punten, bedragen, beloningen, trekkingen, individuele ranglijstposities |
| QR | Naar `/v/{token}` met een niet te raden token; pagina `noindex`, toont niet meer dan de kaart |
| Tekst op de verificatiepagina | "Deze sessie stond zichtbaar op het scherm van één browser, van 14:02 tot 14:52. Dat bewijst niet dat er geen ander apparaat gebruikt is en ook niet wat er geleerd is." (rapport 09 §8) |
| Intrekken | Door de gebruiker; de QR toont "niet meer beschikbaar"; bij afkeuring van de sessie verdwijnt de pagina; geen kaart voor een sessie in afwachting |
| Logging | Alleen kaart gemaakt, deelmenu geopend, pagina bekeken |
| Video | Buiten de MVP: geen camera (businessplan §8) |

### 4.9 Referral (R3, vlag)

| Regel | Waarde | Reden |
|---|---|---|
| Start | 5 januari 2027, achter een vlag, na besluit van de founder | K uit squads eerst zonder referral meten (2 december – 3 januari) |
| Punten | 150 voor uitnodiger en genodigde (werkhypothese, ongeveer 2,5 uur focus) | Merkbaar, onder de inverdienperiode |
| Vesting | Genodigde doet binnen 7 × 24 uur 3 voltooide, niet afgekeurde sessies van ≥ 25 min | Businessplan §6 |
| Na vesting | Hoogstens 50% van een puntenprijs uit referralpunten | "Alleen samen met eigen punten" |
| Maximum | 5 gevestigde referrals per uitnodiger per kalendermaand | Businessplan §6 |
| Inverdienperiode | Telt niet mee | 4.2 |
| Uitsluiting | Zelfde IP-hash binnen 24 uur of zelfde telefoonnummer als de uitnodiger: vesting pas na menselijke beoordeling | Rapport 09 §7.1 |
| Ambassadeurscodes | Attributie, geen referralpunten | Ambassadeurs worden per actieve gebruiker op dag 7 betaald (businessplan §6) |
| Nooit | Geld, inzet, beloning voor delen | Art. 1a Wok (piramide) |

### 4.10 Profiel, privacy en leeftijd

**Profiel.** Voornaam, optionele achternaam, e-mail, leeftijdsklasse, dagdoel, squad, vereniging en de schakelaars voor minuten vergelijken, stille modus, squadnaam op kaarten en (Could) de modus zonder punten. In die modus zijn punten, catalogus en bonusmeldingen verborgen, maar lopen de punten door in het grootboek, zodat niemand iets verliest. Rapport 08 §7 raadt zo'n modus aan voor intrinsiek gemotiveerden, en wie hem kiest en blijft, laat zien of de squad zonder punten draagt.

**Leeftijd.** We bewaren de leeftijdsklasse (`16_17` of `18_plus`) en voor 16- en 17-jarigen de datum waarop iemand 18 wordt; op die dag wisselt de klasse. De geboortedatum zelf bewaren we niet. De leeftijd is zelfopgave en wordt bij 18+-prijzen gecontroleerd.

**Gegevens.** Alleen sessietijdstempels, zichtbaarheidsgebeurtenissen, Wake Lock-status, heartbeats, lidmaatschappen, gehasht IP, user agent en vanaf de eerste verzilvering een gehasht telefoonnummer (businessplan §8; rapport 09 §7.3). Geen locatie, camera of verdere fingerprinting, en geen externe analytics-SDK. Bewaartermijnen (werkhypothese, vast te leggen in de DPIA): IP-hash en user agent 30 dagen, ruwe heartbeats en zichtbaarheidsgebeurtenissen 90 dagen, daarna een samenvatting per sessie. Inzien, downloaden en verwijderen kan in het profiel; daarna blijven events gepseudonimiseerd voor de pilotanalyse. De DPIA en de afspraken met verenigingen over geaggregeerde data zijn klaar vóór 2 december. De smsdienst is een verwerker.

### 4.11 Beheeromgeving

| Onderdeel | Functie | Waarborg | Release |
|---|---|---|---|
| Verenigingen | Aanmaken, ledental met bron, poule, code met plafond, bestuursaccounts, promotiekit | Plafond 1,1 × ledental | R1 |
| Challenges | Aanloopklassement, prijsperiode, hoofd- en drempelprijs, prestatiechallenges met plaatsen | Niet te publiceren zonder dekking of boven de europlafonds; uitslag na fraudecontrole, vier ogen | R1 / R3 |
| Partners en budget | Partner, factuur of contract met documentverwijzing, geboekt bedrag, beloningsbudget, verplichting, dekkingsgraad | Alleen geboekte omzet; wekelijks dekkingsalarm | R1 |
| Catalogus | Items met kostprijs en puntenprijs, CSV-import, weekvrijgave | Kostprijs ≤ €5 | R1 |
| Fraudewachtrij | Gemarkeerde sessies, meldingen "Klopt dit niet?", besluit met redencode, beroepen | Elk besluit door een mens; beroep bij een tweede beheerder; blokkade met vier ogen | R1 |
| Vakantiepauze | Periode waarin streaks, pauzetellers, Belofte-dagen en doelbonus bevriezen | Wijziging alleen met logregel | R1 |
| Gebruikers | Zoeken, leeftijdsklasse, blokkeren, verwijderen, teamvlag | Elke inzage gelogd | R1 |
| Experimenten | Toewijzing per squad of solo, vergrendeld | Geen wijziging zonder logregel | R1 |
| Auditlog | Elke inzage van sessiegegevens en elk besluit: wie, wanneer, waarom | Niet te wijzigen of te verwijderen | R1 |
| KPI-overzicht | Opgeslagen SQL-query's (hoofdstuk 7) | Teamaccounts uitgesloten | R1 |
| Trekkingen | Spel, prijzen, spelvoorwaarden, KSB-kostenpost, jaarlimiet, seed-hash, trekking, winnaars | Vlag uit; spel ≤ €4.500 | R3 |

Heuristieken markeren alleen; een mens beslist. Elk besluit krijgt een redencode uit een vaste lijst, en de student ziet die reden in gewone taal.

### 4.12 De Belofte (R2)

| Regel | Waarde |
|---|---|
| Aanbod | Eén keer automatisch per gebruiker volgens de arm: vroeg (dag 14 na registratie, of eerder na 8 gehaalde dagdoelen; valt het in de vakantiepauze, dan de eerste dag erna; wie vóór 16 december in aanmerking kwam, krijgt het op 16 december) of laat (1 februari 2027). Daarna kan de gebruiker zelf een nieuwe Belofte starten |
| Keuzes | Dagen per week 3–7; minuten per dag 25 / 50 / 90 / 120; getuigen: de squad of niemand |
| Voorstel | Wat de gebruiker in de afgelopen 14 dagen werkelijk haalde, naar beneden afgerond op de vaste waarden |
| Looptijd | 14 dagen; dagen in de vakantiepauze tellen niet |
| Belofte-dag gehaald | Geverifieerde minuten die dag ≥ beloofde minuten; een gemarkeerde sessie telt voorlopig, na afkeuring niet |
| Beloning | Geen punten, badges of prijzen |
| Reflectie | Na 14 dagen: verlengen, aanpassen of stoppen; 18+ krijgt één vraag naar interesse in inzet |
| Stoppen | Altijd, met één tik; getuigen zien "Belofte gestopt", zonder oordeel |
| Squad verlaten | De Belofte loopt door zonder getuigen |
| Modus zonder punten | Zelfde aanbod |

Een beloonde Belofte is weer een prikkel die moet doorlopen. In de termen van rapport 08 is dit een zacht commitment, met sociale in plaats van financiële kosten; dat het werkt, is de hypothese die we toetsen.

## 5. Puntenmodel en parameters

| Parameter | Waarde | Reden | Gevarieerd in de pilot? |
|---|---|---|---|
| Sessielengtes | 25 / 50 / 90 min | Businessplan §4 | Nee |
| Oefensessie | 1 min, 0 punten | Regel begrijpelijk maken (Retentie-first) | Nee |
| Ratio | 1 punt per geverifieerde minuut van een voltooide sessie | Vast, in één zin uit te leggen | Nee (bindend) |
| Afgebroken sessie | 0 punten | Businessplan §4 | Nee |
| Bijschrijven | Direct bij het einde van de sessie | Levitt e.a. 2016 | Nee |
| Punten tijdens de sessie | Niet in beeld | Gneezy e.a. 2011 (rapport 08 §7) | Nee |
| Daglimiet | 480 min | Werkhypothese 8 uur, businessplan §4 | Nee |
| Dagrand | 04:00 Europe/Amsterdam | Aanname | Nee |
| Dagdoel | 25 / 50 / 90 / 120, standaard 25; bevestiging bij 90 of 120 in week 1; voorstel na 7 dagen | Carrera e.a. 2018; rapport 08 §7 | Nee |
| Doelbonus arm A (winst) | +20 per gehaald dagdoel, direct beschikbaar; max. 140 per week | Winstframing, gelijke verwachte waarde | **Ja** |
| Doelbonus arm B (slinkend weekbudget) | Maandag 04:00 140 punten *in afwachting* (bij instroom midden in de week 20 × resterende dagen); per gehaald dagdoel 20 direct *beschikbaar*; per gemist dagdoel vervalt 20 | Patel e.a. 2016 (rapport 08 §7 implicatie 6) | **Ja** |
| Joker en doelbonus | Joker beschermt de doelbonus in geen van beide armen | Armen gelijk houden | Nee |
| Seizoen doelbonus | 2 december – 18 januari 04:00, niet in de vakantiepauze; vooraf aangekondigd | Afbouw zonder ratio te wijzigen; start nawerkingsmeting | Nee |
| Vakantiepauze | 21 december 2026 – 3 januari 2027 (werkhypothese; rapport 03: circa 20 december – 4 januari) | Kerstdip apart houden | Nee |
| Inverdienperiode | 300 geverifieerde minuten | Businessplan §4 | Nee |
| Weekplafond verzilvering | 1 per week | Kosten per persoon begrenzen | Nee |
| Europlafonds | Item ≤ €5; individuele prijs ≤ €10; per persoon per maand ≤ €15; hoofdprijs ≤ €150; drempelprijs ≤ €75 | Rapport 09 §8; businessplan besluit 5 | Nee |
| Telefoonverificatie | Bij de eerste verzilvering, 1 nummer per account | Rapport 09 §8 | Nee |
| Puntenprijs | Kostprijs ÷ budgetwaarde per punt, afgerond op 50, vast | Geen variabele wisselkoers | Nee |
| Voorraad | Per pilotweek vrijgegeven | Eerste week mag niet alles opmaken | Nee |
| Rustdag-joker | 1 per lid per week, automatisch | Businessplan §4; Silverman en Barasch 2023 | Nee |
| Squadstreak | Helft van de actieve leden (naar boven, min. 2) | Rapport 03, risico loop A | Nee |
| Automatische pauze | Na 7 dagen zonder voltooide sessie | Businessplan §4 | Nee |
| Squadomvang | 3–6 | Businessplan §4 | Nee |
| Duel | 7 dagen, minuten met dagplafond, badge | Geen pool in het klein | Nee |
| Referral | 150 per partij; vesting 3 × ≥ 25 min in 7 dagen; max. 5 per maand; max. 50% van een puntenprijs | Businessplan §6; werkhypothese | Aan/uit in de tijd (vanaf 5 januari) |
| Vervaldatum | 12 maanden na de laatste voltooide sessie | Werkhypothese; niet gebouwd | Nee |
| Belofte-aanbod | Vroeg (dag 14 of 8 doeldagen) tegenover laat (1 februari) | Royer e.a. 2015 (rapport 08 §7 implicatie 8) | **Ja** |
| Minimum challenge | 15 gekoppelde leden | Werkhypothese | Nee |
| Drempel collectieve prijs | Gemiddelde deelnamegraad ≥ 25% | Werkhypothese | Nee |
| Gemarkeerde sessie | Punten *in afwachting* tot het besluit | Hoofdstuk 6 | Nee |

**De verliesarm.** Businessplan §4 vraagt om een arm "wekelijks puntenbudget dat slinkt bij gemiste dagdoelen" tegenover gewone bijschrijving. Letterlijk opgevat verdwijnt de vaste ratio per minuut, en die is bindend. Daarom zijn de minuutpunten in beide armen gelijk en verschilt alleen een kleine doelbonus in framing. Arm A ziet: "Haal je doel vandaag: +20." Arm B ziet op maandag: "Je weekbudget: 140 punten. Elke dag dat je je doel haalt, zet je er 20 veilig." Een gehaald doel zet de 20 direct op *beschikbaar*, zodat de beloning ook in arm B direct volgt; een gemist doel toont "−20, je weekbudget is nu 100". Verwachte waarde en kosten zijn gelijk, zoals in Patel e.a. (2016). Rewarded trekt nooit iets in uit een beschikbaar saldo, en de taal blijft feitelijk ("Vandaag je doel halen houdt je weekbudget op 100", niet "Je verliest punten!").

**Transparantie.** Bij elke bonusmutatie toont de app de armregel met een link "Waarom zie ik dit?": "In de pilot werken we met twee bonusregels die evenveel opleveren. Jouw squad heeft de regel 'weekbudget'; de andere is 'per gehaald doel +20'. Je minuutpunten zijn voor iedereen gelijk." De jurist toetst de verliesarm vóór 25 november op oneerlijke handelspraktijk en dark pattern (open vraag 5). Valt die toets negatief uit, dan vervalt arm B en krijgt iedereen arm A.

**Toewijzing.** Beide factoren worden onafhankelijk toegewezen, 50/50, in een 2×2-ontwerp: per squad bij het aanmaken, voor solo-gebruikers per persoon bij registratie, geloot in blokken van 4 per vereniging. Wie later bij een squad komt, neemt vanaf de eerstvolgende maandag de bonusarm van de squad over, zodat niemand in een squad een andere regel ziet; de Belofte-arm neemt hij alleen over als zijn eigen aanbod nog niet getoond is. Elke wissel wordt gelogd (`arm_switched`); de analyse gebeurt op de eerst toegewezen arm (7.3).

## 6. Anti-fraude in de web-MVP

### 6.1 Wat de web-MVP eerlijk claimt

"Rewarded telt je focustijd zolang de app zichtbaar op je scherm openstaat. Wissel je van app of tabblad of gaat je scherm uit, dan stopt de sessie." Dat is een bewijs van zelfdiscipline op één apparaat, geen bewijs van focus en geen bewijs dat de telefoon niet gebruikt is (rapport 09 §3.3 en §8). "Bewezen" staat nergens in de app; "geverifieerde minuut" betekent alleen: voldoet aan 4.1. Een tweede telefoon, een oude telefoon aan de lader of een headless browser sluiten we niet uit. We maken ze onrendabel met de daglimiet, het weekplafond, de europlafonds, telefoonverificatie, wekelijkse voorraadvrijgave en vertraagde levering van prijzen. Een websessie rechtvaardigt punten en kleine verdiende prijzen, nooit geld (businessplan besluit 5). Komt fraude na herbeoordeling boven 5%, dan gaan de beloningen in de gratis laag omlaag tot native verificatie er is (businessplan §9); mijn voorstel is dan de europlafonds en de weekvrijgave te halveren.

### 6.2 Signalen die we loggen

Per sessie: servertijd van start, heartbeats en einde; de nonce-keten; zichtbaarheidsgebeurtenissen met client- en monotone tijd; gebufferde logs na een gat; Wake Lock aangevraagd, verkregen, geweigerd of vrijgegeven; `blur` en `focus` op de desktop; user agent en `navigator.webdriver`; standalone of browser; gehasht IP; het verschil tussen client- en serverklok; de claimvertraging. Per account: de bron van de registratie (uitnodigingsobject, verenigingscode, wachtlijst), het aantal accounts per IP-hash en per telefoonnummer, en verzilveringen.

### 6.3 Heuristieken

Deze lijst ligt vast vóór 2 december. De drempels zijn werkhypothesen zonder externe benchmark.

| Code | Heuristiek | Waarom |
|---|---|---|
| H1 | `navigator.webdriver` is waar, of de user agent noemt een headless browser | Automatisering (rapport 09 §3.3) |
| H2 | Meer dan 3 accounts met voltooide sessies vanaf dezelfde IP-hash binnen 24 uur, buiten de uitzonderingslijst van campusnetwerken (eduroam, bibliotheekwifi van de pilotsteden) | Meerdere accounts (rapport 09 §7.1) |
| H3 | Som van gedekte heartbeatgaten groter dan 10% van de geplande duur (4.1) | Onvolledig bewijs |
| H4 | Klokafwijking tussen client en server van meer dan 5 minuten | Mogelijke manipulatie |
| H5 | De daglimiet van 480 minuten 3 dagen achter elkaar gehaald | Onwaarschijnlijk patroon |
| H6 | Sessies zonder onderbreking tussen 01:00 en 06:00 op meer dan 2 nachten per week | Telefoon aan de lader |
| H7 | Een squad waarvan alle leden binnen 10 minuten vanaf dezelfde IP-hash zijn geregistreerd | Nep-squad; vertekent ook het squadcriterium |
| H8 | Een telefoonnummer dat eerder op een geblokkeerd account stond | Herhaling |
| H9 | Meer dan 80% van de voltooide sessies in een week met een claimvertraging van meer dan 15 minuten | Onbeheerd toestel (Groei-first) |
| H10 | Meer dan 20 nieuwe gekoppelde leden van één vereniging in 48 uur, waarvan meer dan de helft op hoogstens 3 IP-hashes | Telefoons laten meedraaien (rapport 03, loop B) |

Een heuristiek die tijdens de pilot aantoonbaar kapot is (bijvoorbeeld een campusnetwerk dat op de uitzonderingslijst ontbreekt), passen we alleen aan met een besluit van de founder en een logregel. We rapporteren dan beide cijfers, met en zonder de aanpassing.

### 6.4 Wat er met gemarkeerde sessies en meldingen gebeurt

Een gemarkeerde sessie telt voorlopig voor het dagdoel, de squadstreak en de Belofte: een eerlijke student mag niet lijden onder een vals positief voordat een mens heeft gekeken. De punten staan *in afwachting* en tellen niet voor de inverdienperiode, verzilvering, het duel, de challenge of prijzen. De student ziet: "Deze sessie wordt nagekeken (reden: …). Je punten komen vrij zodra dat klaar is, meestal binnen 3 werkdagen." De exacte drempel noemen we niet. Een beheerder beslist binnen 3 werkdagen: vrijgeven of afkeuren, met een redencode. Bij afkeuring telt de sessie met terugwerkende kracht nergens meer mee. Bij H1, H7 of H8 kan de beheerder het account blokkeren; een blokkade vraagt een tweede beoordelaar.

Een melding via "Klopt dit niet?" komt in dezelfde wachtrij. De beheerder kan de sessie herstellen als voltooid als er objectief bewijs is: een storing aan onze kant in die periode, of een gebufferd log dat alsnog binnenkwam en aan de regels van 4.1 voldoet. Zonder zulk bewijs blijft de afbreking staan, met uitleg. Het aantal meldingen per afbreekcode is input voor de beslissing over een terugkeervenster na de pilot.

### 6.5 Beroep

Binnen 14 dagen na een afkeuring, terugboeking of blokkade, via een knop bij de sessie met een vrij tekstveld. Een andere beheerder dan de eerste beslist binnen 5 werkdagen, gemotiveerd (businessplan §4; art. 22 AVG, rapport 09 §7.3). Bij een gegrond beroep komen de punten terug en telt de sessie alsnog, ook voor een challenge-uitslag die nog niet definitief is. Een definitieve uitslag wordt niet herzien; dat staat vooraf in de voorwaarden. Aantal en uitkomst van beroepen zijn de maat voor valse positieven. Na de pilot publiceren we hoeveel sessies onterecht zijn afgekeurd en hoeveel onterecht beloond (rapport 09 §8).

## 7. Meetplan

**Infrastructuur.** Eén tabel `events` (id, naam, `user_id` gepseudonimiseerd, servertijd, eigenschappen als JSON, release, `arm_bonus`, `arm_belofte`, `squad_id`). Grootboekmutaties en auditlog staan in eigen tabellen, te koppelen via `session_id` of `user_id`. KPI's zijn opgeslagen SQL-query's; de beheerder draait elke maandag het weekrapport. Accounts van het team krijgen vooraf een vlag en tellen nergens mee. Afgekeurde sessies tellen nergens mee.

### 7.1 Eventtaxonomie

| Event | Eigenschappen | Wanneer |
|---|---|---|
| `invite_created` | invite_id, bron (squad/duel/club/personal), maker, max_uses, geldig_tot | Link of QR gemaakt |
| `invite_share_opened` | invite_id, kanaal (whatsapp/systeem/kopie) | Deelmenu geopend |
| `invite_link_opened` | invite_id, nieuwe_bezoeker | Op de server, vóór registratie |
| `account_created` | bron, invite_id, vereniging_id, qr_bron, age_band | Na akkoord met de voorwaarden |
| `experiment_assigned` | arm_bonus (A/B), arm_belofte (vroeg/laat), eenheid (squad/solo), blok | Bij registratie of squad aanmaken |
| `arm_switched` | factor, van, naar, reden | Lid neemt arm van squad over |
| `practice_completed` | — | Oefensessie afgerond |
| `daily_goal_set` | minuten, bron (onboarding/voorstel/zelf), overmoed_bevestigd | Doel gekozen of gewijzigd |
| `goal_suggestion_shown` / `goal_suggestion_accepted` | voorgesteld, huidig | Na 7 dagen |
| `session_started` | session_id, duur_gepland, device_class, standalone, wakelock_supported | Server maakt sessie aan |
| `wakelock_state` | session_id, status (acquired/denied/released) | Bij elke wijziging |
| `heartbeat_gap` | session_id, gap_s, log_geleverd, log_geldig | Bij herstel of afsluiting |
| `visibility_hidden` | session_id, verstreken_s | Pagina verborgen |
| `session_completed` | session_id, minuten, punten, flagged, flag_codes, claim_delay_s | Server keurt einde goed |
| `session_aborted` | session_id, reden (code 4.1), verstreken_s | Server sluit af |
| `abort_recovery` | session_id, actie (opnieuw/korter/weg), seconden_tot_actie | Keuze na afbreking |
| `return_after_abort` | session_id, hidden_duur_s | Terugkeer na `hidden` |
| `abort_report_submitted` | session_id, reden_gebruiker | "Klopt dit niet?" |
| `daily_goal_met` / `daily_goal_missed` | datum, minuten, joker_gebruikt | Dagafsluiting 04:00 |
| `goal_bonus_booked` | arm, mutatie, week | Grootboekmutatie doelbonus |
| `squad_created` / `squad_joined` / `squad_left` | squad_id, invite_id, ledental_na | Lidmaatschap |
| `squad_became_active` | squad_id | Derde lid erbij |
| `squad_day_evaluated` | squad_id, datum, geslaagd, actieve_leden, jokers, streak | 04:00 |
| `member_paused` / `member_resumed` | squad_id, dagen_inactief | Pauzeregel |
| `presence_viewed` | leden_live | App geopend met live leden |
| `compare_optin_changed` | aan/uit | Schakelaar |
| `duel_created` / `duel_accepted` / `duel_finished` | duel_id, invite_id, uitslag | Duel |
| `vereniging_joined` | vereniging_id, qr_bron | Koppeling |
| `code_cap_reached` | vereniging_id | Plafond 1,1× bereikt |
| `club_dashboard_viewed` / `promo_kit_downloaded` | vereniging_id, tab of asset | Bestuur |
| `leaderboard_viewed` | poule, periode | Ranglijst bekeken |
| `challenge_enrolled` | challenge_id | Inschrijving prestatiechallenge |
| `belofte_offered` | trigger (dag14/vroeg/laat) | Aanbod getoond |
| `belofte_made` | dagen_per_week, min_per_dag, getuigen, verhouding_tot_historie | Belofte aangegaan |
| `belofte_day_result` | gehaald | Dagafsluiting |
| `belofte_reflection` | actie (verlengen/aanpassen/stoppen), stake_interest (ja/nee/weet niet; alleen 18+) | Na 14 dagen |
| `belofte_stopped` | dag | Tussentijds gestopt |
| `catalog_viewed` | items_zichtbaar, saldo, inverdiend | Tabblad Beloningen |
| `redemption_completed` | item_id, punten, kostprijs, financier_id | Verzilvering |
| `redemption_blocked` | reden (inverdien/week/maand/voorraad/saldo/dekking) | Geweigerd |
| `coverage_alert` | tekort_eur, week | Dekkingsalarm |
| `flag_reviewed` | session_id, besluit, redencode, doorlooptijd_u | Beheerder beslist |
| `appeal_submitted` / `appeal_decided` | object_id, uitkomst | Beroep |
| `prize_awarded` | prize_id, type, waarde_eur | Na winnaarsverificatie |
| `no_points_mode_changed` | aan/uit | Could |
| `card_created` / `card_share_opened` / `verify_page_viewed` | card_id, aanleiding, velden_aan | Kaart |
| `referral_pending_created` / `referral_vested` / `referral_lapsed` | invite_id, sessies | Referral |
| `draw_opt_in` / `draw_entry` / `draw_executed` | game_id, waarde_eur, ksb_eur | Trekking |
| `support_labeled` | label (uitbetalen/focus/vrienden/techniek) | Supportbericht gelabeld |

### 7.2 Pilot-KPI's

| KPI | Drempel | Berekening uit events |
|---|---|---|
| Activatie | ≥ 60% | Accounts met `session_completed` (≥ 25 min, niet afgekeurd) binnen 24 uur na `account_created`, gedeeld door alle `account_created` (rapport 03). De oefensessie telt niet |
| D7 / D30 | ≥ 25% / ≥ 12% | Cohort per registratieweek; aandeel met ≥ 1 goedgekeurde `session_completed` op dag N (rapport 03). Correctie: dagen in de vakantiepauze tellen niet bij het tellen tot N (voorstel, besluit founder vóór 2 december) |
| Aandeel actieven in een squad | ≥ 40% | Per week: gebruikers met ≥ 1 `session_completed` die lid zijn van een squad na `squad_became_active`, gedeeld door alle gebruikers met ≥ 1 `session_completed`. Duels tellen niet; "squad of duel" rapporteren we apart |
| K-factor | ≥ 0,3 | Geactiveerde accounts met een invite_id van een pilotgebruiker, gedeeld door geactiveerde pilotgebruikers in dezelfde periode; per twee weken en voor de hele pilot. Wachtlijst, verenigingscode en ambassadeurscode tellen niet. Altijd ook per bron en apart voor 2 december – 3 januari (zonder referral) |
| Gemarkeerde sessies | < 5% | `session_completed` met flagged = waar, gedeeld door alle `session_completed` |
| Fraude na herbeoordeling | ≤ 5% | Afgekeurde sessies gedeeld door alle `session_completed`, per bron en per vereniging |
| Beloningskosten | binnen budget | Kostprijs van `redemption_completed` + `prize_awarded` (+ KSB) gedeeld door geboekt budget; plus kosten per actieve gebruiker per week en de week waarin de voorraad op was |
| D7 squad tegenover solo | voorstel ≥ 1,5× | D7 van accounts die op dag 0–2 in een actieve squad zaten, gedeeld door D7 van de rest. Zelfselectie: geen causaal bewijs |
| Kwaliteit per kanaal | geen kanaal < 50% van het gemiddelde (rapport 03) | D30 en squadaandeel per bron |
| Beloningsjagers (signaal) | geen drempel | Aandeel met `redemption_completed` en daarna 14 dagen geen sessie; aandeel met `catalog_viewed` vóór de eerste sessie en geen D7; aandeel supportberichten met label "uitbetalen" |
| W3-retentie | geen drempel | Activeerden met `session_completed` op ≥ 2 dagen in dag 15–21, vakantiepauze overgeslagen |
| Belofte-overname | geen drempel | `belofte_made` gedeeld door `belofte_offered`, per arm_bonus |
| Belofte-naleving | geen drempel | Aandeel `belofte_day_result` gehaald; aandeel reflecties met verlengen |
| Nawerking | geen drempel | Geverifieerde minuten per gebruiker per week in 18–31 januari, vergeleken tussen armen (7.3) |
| Interesse in inzet (H-C) | geen drempel | Aandeel `stake_interest` = ja onder 18+-reflecties |
| Herstel na afbreking | geen drempel | Aandeel `session_aborted` gevolgd door `session_completed` dezelfde dag, per `abort_recovery`-actie |

### 7.3 Experimentarmen en analyse

| Factor | Armen | Toetst | Primaire maat | Secundair |
|---|---|---|---|---|
| Doelbonus | A winst tegenover B slinkend weekbudget | H-A (rapport 08): verliesframing geeft meer focus tijdens de prikkel | Aandeel gebruikersdagen met `daily_goal_met` tijdens het seizoen | Focusminuten per week, D7, D30, nawerking |
| Belofte-aanbod | Vroeg (dag 14) tegenover laat (1 februari) | H-B (rapport 08): effect blijft beter behouden met een commitmentaanbod | Geverifieerde minuten per week in 18–31 januari | W3, overname, naleving; follow-up semester 2 |
| Beschrijvend | Referral uit (2 december – 3 januari) tegenover aan (vanaf 5 januari) | Draagt de sociale loop zonder punten? | K per bron | — |
| Beschrijvend | Squad tegenover solo; modus zonder punten | Businessplan §9; rapport 08 §7 | D7, W3 | — |

**Analyseregels.** Ontwerp, maten en analyses worden vóór 2 december voorgeregistreerd. Analyse op de eerst toegewezen arm (intention to treat). Wisselaars (`arm_switched`) rapporteren we apart, en als gevoeligheidsanalyse ook zonder hen. Standaardfouten clusteren op de toewijzingseenheid (squad of solo). We rapporteren effectgroottes met betrouwbaarheidsintervallen. Een statisticus doet vóór 25 november een poweranalyse op 300–800 gebruikers; die bepaalt of we de uitkomst als toets of als richting lezen, niet of we randomiseren.

**Nawerking.** We vergelijken tussen armen, niet vóór en na 18 januari: rond die datum eindigen de tentamens en begint de publieke lancering, en elke voor-na-vergelijking meet vooral dat. Het venster 18–31 januari is schoon voor de Belofte, omdat de late arm pas op 1 februari een aanbod krijgt. Voor de doelbonus loopt de follow-up door tot 8 weken na het seizoen (tot 15 maart 2027), zoals rapport 08 vraagt. Gebruikers die na 4 januari instromen, bereiken dag 14 pas na het seizoen; ze tellen mee in de ITT-analyse maar rapporteren we ook apart.

**Kwalitatief.** Supportberichten krijgen een label. Zo zien we het signaal uit businessplan §6: praten gebruikers over focus en vrienden, of vooral over wanneer ze kunnen uitbetalen?

## 8. Scope

| Prioriteit | Onderdeel | Release | Motivatie |
|---|---|---|---|
| Must | Onboarding met magic link, leeftijdsklasse (16+, 18+), toegang via uitnodiging, oefensessie, tip "Niet storen" | R1 | Activatie; 16+ is bindend; afbreken voorkomen |
| Must | Focus-engine: 3 lengtes, zichtbaarheid, Wake Lock, servertijd, heartbeat met gatregels, afbreekcodes, "Kortere sessie", "Klopt dit niet?" | R1 | Alle retentiecriteria; fraude; menselijke herbeoordeling |
| Must | Grootboek met vaste ratio, daglimiet, inverdienperiode, weekplafond, doelbonus in twee armen met seizoenseinde | R1 | Beloningskosten; bindende pilotarm |
| Must | Catalogus met geboekte dekking, europlafonds, CSV-voorraad, weekvrijgave, telefoonverificatie, dekkingsalarm, verplichting naast budget | R1 | Beloningskosten binnen budget; businessplan §5 |
| Must | Squads met uitnodigingsobject, aanwezigheid via polling, dagdoel met overmoedrem, streak, joker, automatische pauze | R1 | Squadaandeel, K, D7 squad tegenover solo |
| Must | Verenigingscode met plafond, ledental met bron, promotiekit, bestuursdashboard | R1 | Koude start (businessplan §3) |
| Must | Eventlog, KPI-query's, experimenttoewijzing met `arm_switched` | R1 | Alle criteria |
| Must | Fraudesignalen, H1–H10, wachtrij, beroep, auditlog | R1 | < 5%; bindende herbeoordeling |
| Must | Vakantiepauze | R1 | D30 gecorrigeerd |
| Must | De Belofte met aanbod, getuigen, reflectie en vraag naar inzet | R2 | Centrale pilothypothese |
| Must | Prijsperiode blokchallenge met poules, drempel- en hoofdprijs, winnaarsverificatie | R3 | Wedge; D30 via de tentamenweken |
| Should | Aanloopklassement in december | R1 (uiterlijk 9 december) | Wervingsreden vóór de kerst |
| Should | Duels | R2 | Tweede uitnodigingsmoment; hergebruikt de squadlink |
| Should | Deelbare bewijskaart met verificatiepagina | R2 | Versterker; in de pilot vooral wachtlijstvoorrang |
| Should | Individuele prestatiechallenge met vaste plaatsen | R3 | Retentie in de tentamenweken |
| Should | Referral achter een vlag | R3 | Versneller, na de meetperiode van K uit squads |
| Should | Trekkingsmodule met spelvoorwaarden, KSB-kostenpost, seed-hash, achter een vlag die uit staat | R3 | Businessplan §10; aan alleen na de toetsen |
| Should | E-mailherinnering (dagdoel of streak in gevaar, max. 1 per dag) | R1 | D7 |
| Could | Minuten vergelijken in de squad (opt-in) | R1 | Gevraagd door de squadlogica; geen criterium |
| Could | Modus zonder punten | R2 | Tegen verdringing; extra meting |
| Could | Installatie-uitleg voor de PWA; webpush in geïnstalleerde webapps | R2 | Wake Lock en meldingen; iOS-gedrag eerst testen |
| Won't (pilot) | Terugkeervenster, pauze binnen een sessie, vrije sessielengtes | — | Strijdig met businessplan §4; extra fraudewegen |
| Won't (pilot) | Websockets, partner-API's, partnerportaal, export voor het bestuur, berichten van het bestuur aan leden | Na de pilot | Geen criterium; botst met het verbod op individuele monitoring |
| Won't (pilot) | Puntvervaldatum, stad tegen stad, verticale video | Later | Geen effect binnen de pilot of camera nodig |
| Won't (nooit) | Openbare individuele ranglijsten, cash-out, loot boxes, variabele wisselkoers, beloning op delen, pool-model, contactimport | — | Harde randvoorwaarden |

**Volgorde bij tijdnood.** Loopt R1 uit, dan schrappen of verschuiven we in deze volgorde: de Could-items, de e-mailherinnering, het aanloopklassement (naar 9 december), het vergelijken van minuten. Loopt R2 uit: eerst de kaart (naar R3), dan duels (naar R3). De Belofte schuift niet, want zonder haar is de centrale hypothese niet te meten. Loopt R3 uit: eerst de trekkingsmodule (die toch uit staat), dan referral (naar 19 januari of later). Focus-engine, grootboek, squads, events en fraudewachtrij schuiven nooit. Liever een week later starten dan een pilot zonder meting.

**Na de pilot.** In de volgorde van de verificatieladder (businessplan §4, rapport 09 §8): (1) native apps met voorgrondverificatie en apparaatattestatie (App Attest, Play Integrity), wat catalogusbeloningen tot een plafond per toestel en per persoon rechtvaardigt; de Family Controls-entitlement vragen we aan zodra het ontwikkelaarsaccount bestaat; (2) iOS-blokkade via de Screen Time-API's en Android UsageStats voor grotere verdiende prijzen en verenigingsprijzen; (3) Rewarded Plus vanaf semester 2, nooit gekoppeld aan trekkingskansen; (4) de inzetlaag als commitment contract, als harde vorm van de Belofte, pas na advocatenopinie, Ksa-toets, acceptatie door de betaaldienstverlener en native verificatie. Of de Belofte in de pilot behoud laat zien en of 18-plussers interesse in inzet tonen, is input voor dat besluit. Het pool-model komt in geen enkele fase terug.

## 9. Open vragen en aannames

1. **Kerstcorrectie en drempels (besluit founder vóór 2 december).** Voorstel: dagen in de vakantiepauze (21 december – 3 januari) tellen niet bij D30 en W3; D7 squad tegenover solo "duidelijk hoger" = ≥ 1,5×. Achteraf schuiven is uitgesloten.
2. **Team en bouwtijd (aanname).** Twee à drie ontwikkelaars en één ontwerper. Klopt dat niet, dan geldt de schrapvolgorde uit hoofdstuk 8.
3. **Pilotbudget (open).** Wat is er vóór 25 november geboekt (gefactureerd of getekend)? Zonder dat getal geen puntenprijzen en geen catalogus; dan blijven status en verenigingsprijzen over.
4. **Poweranalyse (open, vóór 25 november).** Met 300–800 gebruikers en toewijzing per squad verwacht ik alleen grote verschillen te zien (**inschatting**).
5. **Verliesarm (jurist, vóór 25 november).** Is arm B, met gelijke verwachte waarde en de armregel bij elke mutatie, een oneerlijke handelspraktijk of dark pattern? En vraagt de toewijzing van 16- en 17-jarigen aan armen extra informatie of toestemming?
6. **Prijzen op deelnamegraad en europlafonds (jurist).** Geldt een collectieve prijs op deelnamegraad als prestatie? Passen de plafonds uit 4.3 bij "kleine verdiende prijzen"?
7. **Vervaldatum en "zolang de voorraad strekt" (jurist).** Houdbaar onder het consumentenrecht?
8. **Leeftijdscontrole bij winnaars (open).** Hoe controleren we 18+ zonder een kopie van een identiteitsbewijs te bewaren? Nodig voor R3.
9. **Terugkeervenster (open, na de pilot).** Zonder venster breekt een inkomend gesprek de sessie af. `return_after_abort`, `abort_recovery` en de meldingen laten zien hoe vaak dat gebeurt.
10. **iOS in het veld (aanname).** Wake Lock en Page Visibility in de Home Screen-app vanaf iOS 18.4, en webpush in geïnstalleerde webapps, zijn alleen bekend uit compatibiliteitsdata (rapport 09 §3.1). Testen op echte toestellen vóór 2 december; het aandeel oudere iOS-versies in de pilot is onbekend.
11. **Gatregel (werkhypothese).** Het maximum van 5 minuten voor een gebufferd log en de 10% van H3 zijn niet extern onderbouwd; evaluatie op `heartbeat_gap` en meldingen.
12. **Squadstreak op de helft (werkhypothese).** Vergevingsgezind genoeg om squads niet te laten uiteenvallen, streng genoeg om betekenis te hebben?
13. **Poules en ledental (aanname).** Volstaat een jaarverslag of ALV-stuk als bron voor het ledental?
14. **Verwerkingsrol van de vereniging (jurist).** Ontvanger van aggregaten, verwerker of gezamenlijk verantwoordelijke? En valt de IP-hash onder de cookiebepaling (rapport 09 §7.3, niet geverifieerd)?
15. **Zachte commitment (hypothese).** Dat een Belofte zonder geld een deel van het effect van Royer e.a. (2015) heeft, is niet aangetoond. Dat is precies wat de pilot toetst.
16. **Tentamenperiodes (open).** De prijsperiode van 4–17 januari moet per vereniging worden bevestigd.

## 10. Beslissingen en afwijkingen

### 10.1 Uitgangspunt

Beide juryleden kozen MVP-first als winnaar (65 en 62 punten), dus de structuur, de releasekalender en de kern komen daaruit: de strenge sessieregel zonder venster, de verliesarm die de ratio intact laat, het duel zonder punten, polling, een eigen eventtabel en een functionele beheeromgeving. Waar de juryleden verschilden, heb ik gekozen en dat hieronder gemotiveerd.

### 10.2 Wat uit welke variant komt

| Onderdeel | Uit | Waar |
|---|---|---|
| Structuur, releases, focus-engine, grootboek, verliesarm met gelijke verwachte waarde, duel zonder punten, heuristieken H1–H8, KPI-definities, schrapvolgorde | MVP-first | Overal |
| De Belofte, afgeslankt (zonder punten, squad als getuige, reflectie, vraag naar inzet voor 18+) | Retentie-first | 3.12, 4.12 |
| Aangekondigd einde van de doelbonus, nawerkingsmaat, W3 | Retentie-first | 4.2, 7.2 |
| Oefensessie, "Niet storen", "Kortere sessie", tabel met randgevallen | Retentie-first | 3.1, 3.3, 4.1 |
| Competentiefeedback vóór punten, geen punten tijdens de sessie, overmoedrem, doelvoorstel na een week | Retentie-first | 3.2, 4.4 |
| "Zolang de voorraad strekt", dekkingsalarm | Retentie-first | 3.4, 4.3 |
| Arm B die per gehaald doel direct veiligstelt | Retentie-first | 5 |
| Modus zonder punten (Could) | Retentie-first | 4.10 |
| Squadstreak op de helft van de actieve leden | Retentie-first en Groei-first | 4.4 |
| Uitnodigingsobject met bron, K per bron, kwaliteit per kanaal, beloningsjagers | Groei-first | 3.5, 7 |
| Noemer max(opgegeven, gekoppeld), codeplafond 1,1×, poules, drempelprijs, aanloopklassement, promotiekit | Groei-first | 3.7, 4.6 |
| Trekkingen achter een vlag, aparte opt-in, kans als getal, seed-hash, jaarlimiet | Groei-first | 3.9, 4.7 |
| Leeftijdsklasse en datum van 18 in plaats van geboortedatum; auditlog; verificatiepagina die zegt wat ze niet bewijst | Groei-first | 4.8, 4.10, 4.11 |
| Claimvertraging als signaal (H9), verenigingspiek (H10), "Klopt dit niet?" | Groei-first | 4.1, 6 |

### 10.3 Must-fixes van de jury en hoe ze zijn opgelost

| Must-fix | Jury | Oplossing |
|---|---|---|
| Centrale pilothypothese meetbaar maken; nawerking tussen armen | 1 en 2 | Belofte in R2, gerandomiseerd per squad met een laat aanbod als controle; venster 18–31 januari tussen armen (7.3) |
| Scope-afwijkingen van §10 en §6 voorleggen; haalbaar tijdpad R3 | 1 en 2 | Trekkingsmodule en spelvoorwaarden gebouwd in R3, vlag uit; kaarten Should in R2; referral R3 na meetperiode; na 5 januari geen nieuwe modules. Voorgelegd in 10.5 |
| Europlafond voor verdiende prijzen | 1 en 2 | Vijf plafonds in 4.3, gekoppeld aan rapport 09 §8 |
| Analyseregel voor armwisselingen | 1 | ITT, `arm_switched`, wisselaars apart (5, 7.3) |
| Meldroute bij technische afbrekingen | 1 | "Klopt dit niet?" naar de wachtrij (3.3, 6.4) |
| Kerstcorrectie en drempels vóór 2 december | 1 en 2 | Voorstel in open vraag 1, besluit in 10.5 |
| Verliesarm laten toetsen; armregel bij elke mutatie | 1 | Open vraag 5; transparantieregel in 5 |
| Uitstaande punten tegenover voorraad | 1 | Tekst in 3.4, verplichting en dekkingsgraad in 4.3 |
| Ranglijstnoemer en drempelprijs | 2 | 4.6 |
| Afbreekgrens bij heartbeatgat, maximum van het log, verhouding tot H3 | 2 | Tabel in 4.1 |
| Dekking op geboekte omzet | 2 | Gefactureerd of getekend contract (4.3) |
| Afbreken helpen voorkomen | 2 | Oefensessie, "Niet storen", "Kortere sessie" |
| Duels met niet-squadleden laten bevestigen | 2 | 10.5 |

### 10.4 Wat ik niet overnam, en waarom

**Belofte voor iedereen in plaats van gerandomiseerd (jury 2).** Jurylid 2 wilde de Belofte in R2 aan iedereen aanbieden en de randomisering uitstellen tot semester 2. Jurylid 1 wilde randomiseren als de poweranalyse dat toelaat. Ik randomiseer per squad, om drie redenen. Ten eerste vraagt de must-fix van beide juryleden om nawerking tussen armen te vergelijken, en zonder controle-arm is er geen vergelijking voor de Belofte. Ten tweede kost een tweede factor in een 2×2-ontwerp geen steekproefomvang voor de hoofdeffecten: elke factor wordt op alle squads geschat, zolang de interactie klein is. Het argument van MVP-first dat elke extra arm de groepen verder opdeelt, geldt voor de interactie, niet voor de hoofdeffecten. Ten derde krijgt iedereen het aanbod: de late arm op 1 februari. De poweranalyse bepaalt daardoor alleen hoe we de uitkomst lezen.

**Struikelmoment en geplande pauzes (Groei-first).** Een sessie die doorloopt terwijl de pagina verborgen is, is strijdig met businessplan §4 en maakt de eerlijke claim onwaar. Beide juryleden wezen dit af.

**Claimtik binnen 15 minuten als voorwaarde voor punten (Groei-first).** Jurylid 2 noemde de claimtik of het loggen van de vertraging. Ik log de vertraging en markeer bij een patroon (H9), maar houd punten niet tegen: een verplichte tik kost eerlijke sessies, en punten horen direct bij het einde te volgen.

**Terugkombonus, mijlpaalpunten, squadbonus en duelbonus (Retentie-first, Groei-first).** Jurylid 1 noemde de stapeling van bonussen lastig uit te leggen, en jurylid 2 zei dat de beloning zo weer op loon gaat lijken. Er is één bonus, de doelbonus van MVP-first in twee armen. Het seizoensidee van Retentie-first, een vooraf aangekondigd einde, heb ik daarop wel toegepast.

**Twee ranglijsten met prijs, berichten van het bestuur, stad tegen stad (Retentie-first, Groei-first).** Eén prijsmaatstaf houdt de challenge uitlegbaar. Berichten aan leden zijn een nieuwe verwerking zonder grondslag. Stad tegen stad hangt aan geen criterium.

**Randomisering per gebruiker binnen squads en het uitnodigingsexperiment (Groei-first).** Squadgenoten in verschillende armen besmetten de vergelijking en zien verschillende regels zonder te weten waarom. Een derde factor verkleint de cellen voor de interacties verder.

**Twee tot drie duels tegelijk, duels op gehaalde dagdoelen, sociale inzet (Retentie-first, Groei-first).** Eén duel tegelijk op minuten volgt MVP-first en houdt de uitslag eenvoudig. De sociale inzet ("de verliezer kookt") is sympathiek maar hangt aan geen criterium.

**Ledental van het bestuur als enige noemer (Retentie-first).** Niet te controleren; daarom de maximumregel met codeplafond.

**Eigen keuze die geen jurylid vroeg.** De squadstreak op de helft van de actieve leden in plaats van op alle leden. MVP-first liet de streak breken op het zwakste lid; met squads van drie tot zes en een tentamenperiode met ziekte en inhaaltentamens vind ik dat te kwetsbaar (rapport 03, risico loop A). Het is een werkhypothese.

### 10.5 Wat de founder moet beslissen

| Besluit | Voorstel | Uiterlijk |
|---|---|---|
| Trekkingen: module en spelvoorwaarden bouwen in R3, vlag uit tot advocatenopinie en Ksa-voorlegging | Akkoord; dit honoreert §10 zonder juridisch risico | 25 november |
| Deelbare kaarten als Should in R2, met schuifruimte naar R3 | Akkoord | 25 november |
| Referral vanaf 5 januari achter een vlag, na de meetperiode van K uit squads | Akkoord; of 19 januari als R3 krap wordt | 25 november |
| Duels met een niet-squadlid toestaan onder "individuele vergelijking alleen binnen de squad" | Toestaan: opt-in door acceptatie, twee personen, geen openbare ranglijst | 25 november |
| Belofte gerandomiseerd per squad (vroeg tegenover 1 februari) | Akkoord; zie 10.4 | 25 november |
| Europlafonds op trede 1 (4.3) | Akkoord als werkhypothese, onder voorbehoud van de jurist | 25 november |
| Kerstcorrectie D30 en alle drempels in de voorregistratie | Vakantiepauze 21 december – 3 januari overslaan; D7 squad ≥ 1,5× solo | 2 december |
| Gebruikt go/no-go K de hele pilot of alleen de periode zonder referral? | Hele pilot, met K zonder referral ernaast; haalt alleen K met referral de 0,3, dan meld ik dat als signaal | 2 december |
| Terugkeervenster | Niet in de pilot; besluit na de pilot op data | Februari 2027 |
