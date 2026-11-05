# 06 — UX-ontwerp web-MVP

*Rol: productontwerper (UX en UI). Versie 1.0, 4 november 2026. Bindend kader: `docs/01-businessplan.md` (verder: businessplan). Functionele basis: `docs/research/05-productspecificatie.md` (verder: spec); elke regel, drempel en eventnaam in dit document komt daaruit. Bewijs: rapport 08 (gedragswetenschap, §7 ontwerpimplicaties) en rapport 09 (verificatietechniek). Toon en woordkeuze: rapport 04 (boodschap en positionering, §5 tone of voice en §10 "Dit zeggen we nooit"). Mockups: `docs/research/mockups/rewarded-mockups.html`. Alle namen, aantallen en partners in voorbeelden en mockups zijn fictief.*

---

## Samenvatting

1. De interface draait om één handeling: een sessie starten en de telefoon omdraaien. Al het andere (squad, vereniging, beloningen) staat in dienst van die handeling en komt in die volgorde in beeld: eerst focus, dan de squad, dan pas punten.
2. Vijf tabs onderaan: Focus, Squad, Vereniging, Beloningen, Ik. Op de laptop worden ze een zijbalk. Tijdens een sessie verdwijnt alle navigatie. Het bestuursdashboard is een aparte omgeving voor bestuursaccounts, ontworpen voor laptopbreedte.
3. Een afgebroken sessie is een gewone gebeurtenis met een reden, een tijdstip en een korte weg terug, geen mislukking. De uitleg gebruikt de vaste afbreekcodes uit spec 4.1, en "Klopt dit niet?" staat altijd binnen één tik.
4. Punten worden direct na de sessie bijgeschreven en zichtbaar in hetzelfde scherm, maar onder de competentiefeedback en de squad. Tijdens de sessie staan er geen punten in beeld. Nergens staat een eurowaarde.
5. Verdiend en verloot zijn visueel twee families: verdiende prijzen in de merkkleur met het label "Verdiend", verlote prijzen in een aparte, rustige kleur met het label "Kans", de kans als getal, 18+ en de spelvoorwaarden. Trekkingen bestaan voor 16- en 17-jarigen niet, ook niet als uitgeschakelde knop.
6. Het designsysteem heeft één tokenset in licht en donker, met contrastwaarden boven WCAG 2.2 AA. Het sessiescherm is altijd donker en bijna zwart. Beweging is rustig: geen confetti, geen tellers die oplopen, geen draaiende wielen.
7. Open punten voor de founder en de jurist staan in hoofdstuk 7; de belangrijkste zijn de weergave van arm B (slinkend weekbudget) en hoe zichtbaar live aanwezigheid standaard moet zijn.

---

## 1. Ontwerpprincipes

De principes hieronder zijn geen smaak. Elk volgt uit een besluit in het businessplan of uit het bewijs in rapport 08, en elk heeft een toets die een ontwerper of reviewer op een scherm kan toepassen. Een scherm dat een principe schendt, gaat niet naar de bouw.

**P1. Focus, dan squad, dan beloning.** De volgorde op elk scherm volgt de positionering uit rapport 04 §5, regel 1: de beloning komt het laatst. Op het eindscherm van een sessie staat eerst wat je deed ("Je dagdoel is gehaald"), dan wie van je squad er ook zat, en pas daarna de punten. Die volgorde is ook een bewijsvraag. Informatieve, competentiegerichte feedback verhoogde in Deci e.a. (1999) de vrijwillige voortzetting, terwijl verwachte, aan deelname gekoppelde materiële beloningen die juist verlaagden (rapport 08 §2 en §7, implicatie 7). Punten mogen er zijn, maar als bevestiging, niet als loon. Toets: staat er een puntengetal boven de eerste vouw van een scherm dat niet het tabblad Beloningen is, dan is het scherm fout.

**P2. Direct bijschrijven, zichtbaar in hetzelfde moment.** Beloningen werken vooral als ze direct volgen (Levitt e.a. 2016, rapport 08 §3 en §7, implicatie 2). De server schrijft de punten bij bij het einde van de sessie (spec 4.2), en de interface laat dat in hetzelfde scherm zien: "+50 punten bijgeschreven", met de inverdienvoortgang eronder. Geen "je punten verschijnen binnen 24 uur", geen weekafrekening. De enige uitzondering is een gemarkeerde sessie: dan staan de punten zichtbaar *in afwachting*, met de reden en de verwachte doorlooptijd (spec 6.4). Ook dat is een directe terugkoppeling, alleen een eerlijke.

**P3. Geen punten tijdens de sessie.** Het sessiescherm toont resterende tijd, wie van je squad ook focust en één knop Stoppen. Geen oplopende puntenteller. Die zou van de sessie betaald werk maken (Gneezy e.a. 2011, rapport 08 §7, implicatie 7; spec 3.2). Het scherm is donker, bijna leeg en verandert hooguit eens per minuut, omdat de telefoon met het scherm naar beneden ligt en niemand ernaar kijkt.

**P4. Eerlijke uitleg bij afgebroken sessies.** De web-MVP bewijst alleen dat Rewarded zichtbaar op één browser stond (businessplan §4, verificatieladder trede 1; rapport 09 §3.3). Dat betekent dat eerlijke studenten sessies verliezen door een inkomend gesprek, een lege batterij of wegvallende wifi. Het ontwerp behandelt dat als een feit met een reden: het tijdstip van stoppen, de duur die je volhield, de vaste reden in gewone taal (spec 4.1, afbreekcodes) en waarom die tijd geen punten oplevert ("we kunnen alleen tijd belonen die we kunnen zien"). Daarna drie wegen: opnieuw, korter, of melden. Een gebroken reeks leidt tot meer terugval dan het gedrag verklaart, zeker bij zelfverwijt, en een herstelmogelijkheid dempt dat (Silverman en Barasch 2023, rapport 08 §4). We geven dus geen punten voor afgebroken tijd, maar maken de weg terug zo kort mogelijk en zeggen erbij dat de squadstreak niet breekt.

**P5. Geen dark patterns.** De founder brief sluit ze uit, en rapport 04 §10 noemt de vormen die in deze categorie voor de hand liggen. Concreet: geen kunstmatige schaarste ("nog maar 2 plekken"), geen "bijna op" tenzij er echt minder dan 10% voorraad is (spec 4.3), geen streakverlies als bangmakerij, geen schuldtaal bij stoppen, geen vooraf aangevinkte opt-ins, geen verstopte uitschrijf- of stopknop, geen bevestigingsknop die "Nee, ik wil niet focussen" heet, geen meldingen die op een tijdstip komen dat de gebruiker niet koos, en maximaal één e-mailherinnering per dag (spec 8). Stoppen met een Belofte kost één tik (spec 4.12). De verliesarm B mag feitelijk zijn ("je weekbudget is nu 100"), nooit dreigend ("je verliest punten!") (spec 5).

**P6. Vergelijking alleen in de squad, en opt-in.** Openbare individuele ranglijsten kunnen goed presterende studenten ontmoedigen (Bursztyn en Jensen 2015: −24%, rapport 08 §6), terwijl competitie in kleine teams wel werkt (Patel e.a. 2019). Het ontwerp kent daarom twee vormen van vergelijking en geen derde. Binnen de squad zie je wie focust en wie zijn dagdoel haalde; minuten vergelijken staat standaard uit en toont alleen leden die het ook aanzetten (spec 4.4). Daarbuiten zie je alleen verenigingen, geaggregeerd op deelnamegraad, nooit totalen en nooit een persoon (spec 4.6). Een duel is de enige individuele vergelijking met iemand buiten de squad, en accepteren is de opt-in (spec 4.5). Toets: verschijnt een naam naast een getal buiten de squad of het eigen duel, dan is het scherm fout.

**P7. Status vóór geld.** De gratis laag werkt met punten en status, nooit met centen per uur (businessplan §4; Gneezy en Rustichini 2000 en Deci e.a. 1999 in rapport 08 §2). Visueel betekent dit dat squadstreak, dagdoel en verenigingspositie het meeste gewicht krijgen, en dat punten nooit worden omgerekend naar euro's. De catalogus noemt per item de financier en de puntenprijs, niet de winkelwaarde. Een bedrag in euro's staat alleen in de spelvoorwaarden van een trekking, omdat de Gedragscode daar om een prijsomschrijving vraagt (spec 4.7), en in het bestuursdashboard bij het plafond van de verenigingsprijs.

**P8. Geen bedragen delen, geen beloning op delen.** De deelbare kaart toont voornaam, duur of uren en streak; nooit punten, bedragen, beloningen, trekkingen of ranglijstposities (spec 4.8). Delen levert niets op en dat staat ook op het deelscherm. Het groeiargument is sociaal (businessplan §6: deelbaar bewijs is de versterker, niet de motor), en de kaart moet dat dragen zonder geld.

**P9. Zeg wat we zien, en niet meer.** "Geverifieerd" betekent alleen dat Rewarded zichtbaar en actief op het scherm stond (rapport 04 §2). Het woord "bewezen" staat nergens in de app (spec 6.1). De definitie staat binnen één tik van elke plek waar het woord voorkomt, en de verificatiepagina achter de QR zegt ook wat ze níét bewijst. In laptopmodus beloven we geen "telefoon weg", want daar zien we de telefoon niet.

**P10. Leeftijd bepaalt wat bestaat, niet wat grijs is.** De gratis laag is 16+, trekkingen en later de inzet zijn 18+ (businessplan §3). Voor `16_17` worden trekkingsonderdelen niet getoond, ook niet als uitgeschakelde kaart of teaser. Een grijze "Kans op"-kaart voor een 17-jarige zou een verleiding zijn die de Gedragscode juist wil vermijden (rapport 04 §10).

| Principe | Bron | Ontwerpgevolg | Toets |
|---|---|---|---|
| P1 Focus, squad, beloning | Rapport 04 §5; rapport 08 §7.7 | Volgorde op eindscherm en home | Geen puntengetal boven de vouw buiten Beloningen |
| P2 Direct bijschrijven | Levitt e.a. 2016 (rapport 08 §7.2); spec 4.2 | Punten in het eindscherm; *in afwachting* met reden | Geen uitgestelde bijschrijving zonder reden |
| P3 Geen punten in de sessie | Gneezy e.a. 2011 (rapport 08 §7.7); spec 3.2 | Donker sessiescherm met tijd en squad | Nul punten in het sessiescherm |
| P4 Eerlijke afbreking | Businessplan §4; spec 3.3, 4.1; Silverman en Barasch 2023 | Reden, tijdstip, duur, drie acties | Elke afbreking heeft een code en "Klopt dit niet?" |
| P5 Geen dark patterns | Founder brief; rapport 04 §10 | Geen schaarste, geen schuldtaal, één tik stoppen | Checklist in 6.3 |
| P6 Vergelijken in de squad | Bursztyn en Jensen 2015; Patel e.a. 2019; spec 4.4–4.6 | Opt-in minuten; ranglijst alleen verenigingen | Geen naam plus getal buiten squad of duel |
| P7 Status vóór geld | Businessplan §4; rapport 08 §2 | Streak en dagdoel prominent; geen euro's | Geen eurowaarde bij punten |
| P8 Geen bedragen delen | Businessplan §6; spec 4.8 | Kaart zonder punten; "delen levert niets op" | Kaartvelden uit de vaste lijst |
| P9 Zeg wat we zien | Rapport 04 §2; rapport 09 §3.3; spec 6.1 | Definitie binnen één tik; verificatiepagina met grenzen | "Bewezen" komt niet voor |
| P10 Leeftijd bepaalt wat bestaat | Businessplan §3; spec 3.9 | Trekkingen onzichtbaar voor `16_17` | Geen 18+-element in de DOM voor `16_17` |

---

## 2. Informatiearchitectuur en navigatie

### 2.1 Structuur

Rewarded is een mobile-first Progressive Web App die ook op de laptop werkt (businessplan §10). De structuur heeft drie lagen. De studentenapp met vijf tabs is voor iedereen. Het bestuursdashboard is een aparte omgeving onder `/bestuur`, alleen voor bestuursaccounts en ontworpen voor laptopbreedte, omdat bestuursleden het in vergaderingen en bij het maken van posts gebruiken. De beheeromgeving van Rewarded valt buiten dit document: die is functioneel en intern (spec 4.11), en krijgt het designsysteem zonder eigen schermontwerp.

De vijf tabs volgen de taken uit spec 2, in volgorde van belang:

| Tab | Label | Kernvraag van de gebruiker | Hoofdscherm |
|---|---|---|---|
| 1 | Focus | "Ga ik nu zitten?" | F1 Home met sessiestart |
| 2 | Squad | "Doen de anderen mee?" | Q1 Squad-overzicht |
| 3 | Vereniging | "Hoe staan we ervoor?" | V1 Verenigingschallenge |
| 4 | Beloningen | "Wat kan ik met mijn punten?" | B1 Saldo en catalogus |
| 5 | Ik | "Wat weet Rewarded van mij en hoe stel ik het in?" | P1 Profiel |

Beloningen staat bewust op plek vier, niet in het midden. Wie nog niet bij een vereniging hoort, ziet in tab 3 een leeg scherm met de uitleg hoe je met een code of QR lid wordt; de tab verdwijnt niet, omdat de vereniging de koude start draagt (businessplan §3). In de modus zonder punten (spec 4.10, Could) verdwijnt tab 4 en schuiven de andere op; de punten lopen in het grootboek door.

### 2.2 Navigatiepatronen

**Onderste tabbalk (telefoon).** Vijf items met icoon en label, altijd beide; hoogte 64 px plus de veilige zone van het toestel. Het actieve item krijgt de merkkleur en een gevulde variant van het icoon, niet alleen een kleurverschil (WCAG 1.4.1). Badges zijn spaarzaam: alleen een stip op Squad als iemand je uitnodigde voor een duel of als er een Belofte-reflectie klaarstaat. Geen rode tellers.

**Zijbalk (laptop, vanaf 960 px).** Dezelfde vijf items verticaal links, met de inhoud in een kolom van maximaal 720 px breed. Op de laptop toont het sessiescherm een rustige variant met de tekst "Laat dit tabblad open in een zichtbaar venster" in plaats van de omdraai-instructie (rapport 04 §2, laptopmodus).

**Sessiemodus.** Zodra een sessie loopt, verdwijnen tabbalk en zijbalk. Het enige uitgangspunt is Stoppen. Dat voorkomt dat iemand per ongeluk naar een ander scherm tikt en het voorkomt ook de vraag "telt het als ik even naar mijn squad kijk?": de squad staat in het sessiescherm zelf.

**Bottom sheets en modalen.** Een bottom sheet voor keuzes die bij het huidige scherm horen (uitnodigen, verzilveren, "Klopt dit niet?"). Een modaal alleen voor een bevestiging met gevolgen (stoppen met een sessie, account verwijderen). Nooit een modaal dat vanzelf opent om iets te verkopen.

**Diepe links.** Drie soorten links komen van buiten en hebben elk een eigen landingsscherm: `/i/{invite}` voor squad- en duelinvites (O1 met de uitnodiger bovenaan), `/c/{code}` voor verenigingscodes en QR's (O1 met de vereniging bovenaan, of V2 als je al een account hebt), en `/v/{token}` voor de publieke verificatiepagina van een kaart (K2). In de gesloten pilot geeft alleen een uitnodiging toegang (spec 3.1).

### 2.3 Plaatsing van inhoud

| Inhoud | Plek | Niet op |
|---|---|---|
| Sessiestart | F1, bovenaan, één primaire knop | — |
| Live aanwezigheid squad | F1 (strook), F3 (sessie), Q1 (volledig) | V1, kaarten |
| Squadstreak | F1, Q1, F5 | Ranglijst |
| Punten en inverdienvoortgang | B1; F5 onder de squad | F3, F1 boven de vouw, kaarten |
| Verenigingsranglijst | V1 | F1 (alleen positie in één regel) |
| Verdiende prijzen | V1 (collectief), V3 (individueel) | Kaarten |
| Verlote prijzen | B5, onder de catalogus, alleen `18_plus` na opt-in | Home, kaarten, uitnodigingen, promotiekit (spec 4.7) |
| "Hoe we tellen" | F9, link vanuit F2, F3-voorbereiding, F6, O2, P1 | — |
| Alle voorwaarden | P3, link vanuit O6, B1, B5 | — |

---

## 3. Scherminventaris

### 3.1 Gemeenschappelijke toestanden

Elk scherm heeft dezelfde vijf toestanden, met een vast patroon zodat de bouwers ze niet per scherm hoeven te ontwerpen. Per scherm hieronder staat alleen wat afwijkt.

| Toestand | Patroon | Copyvoorbeeld |
|---|---|---|
| Leeg | Illustratieloze lege kaart met één zin wat hier komt en één actie | "Nog geen squad. Squads houden het beter vol." [Squad maken] |
| Laden | Skeletblokken in de vorm van de inhoud; geen draaiende loader langer dan 1 s zichtbaar; geen geanimeerde glans bij reduced motion | — |
| Fout | Inline melding boven de inhoud met wat er misging en wat je kunt doen; laatst bekende gegevens blijven staan | "Dit konden we niet ophalen. Je gegevens zijn veilig. [Opnieuw]" |
| Sessie afgebroken | Banner bovenaan F1 bij terugkeer, tot de gebruiker F6 opent of wegtikt; op elk ander scherm dezelfde banner | "Je sessie stopte om 14:32. [Bekijk waarom]" |
| Offline | Grijze strook onder de statusbalk; acties die de server nodig hebben zijn uitgeschakeld met reden; een lopende sessie buffert (spec 4.1) | "Geen verbinding. Je sessie loopt door en we sturen alles na zodra je weer online bent." |

De offline-toestand verdient één toelichting. Tijdens een sessie is een kort netwerkgat normaal (bibliotheekwifi), en de client buffert zichtbaarheid en heartbeats (spec 4.1). Het sessiescherm toont dan geen alarm, alleen een klein icoon in de hoek. Pas als het gat de grens van 90 seconden passeert, verschijnt een rustige regel: "Geen verbinding. Blijf op dit scherm; we sturen je sessie na." De beslissing valt op de server, en de uitkomst komt bij terugkeer in F5 of F6.

### 3.2 Onboarding

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| O1 | Welkom | Binnenkomst via link; vertrouwen en belofte | Uitnodiger of vereniging bovenaan; kernbelofte; één regel beloning ("Na vijf uur focus kun je punten inwisselen bij partners. Geen geld."); 16+ | [Doe mee], "Hoe telt Rewarded?" | Verlopen of volle link: "Deze uitnodiging is niet meer geldig. Vraag [naam] om een nieuwe." Geen link in de pilot: wachtlijst | `invite_link_opened` (server) |
| O2 | Hoe we tellen (kort) | Eerlijke claim vooraf | Letterlijke claim uit spec 3.1 stap 3; telefoonmodus en laptopmodus in twee regels | [Begrepen] | — | — |
| O3 | E-mail | Account zonder wachtwoord | E-mail, voornaam, achternaam optioneel | [Stuur link] | Fout adres inline; te vaak: "Probeer het over een minuut opnieuw." | — |
| O4 | Check je mail | Magic link | Adres, tijd geldigheid, opnieuw versturen na 30 s | [Opnieuw sturen], [Ander adres] | Link verlopen: terug naar O3 met uitleg | — |
| O5 | Leeftijdscheck | Leeftijdsklasse bepalen | Geboortedatum (dag, maand, jaar als drie velden met numeriek toetsenbord); uitleg: "We bewaren alleen of je 16–17 of 18+ bent." | [Verder] | Onder 16: O5b "Rewarded is er vanaf 16 jaar", niets opgeslagen, geen terugknop naar een ander jaar binnen de sessie | — |
| O6 | Voorwaarden en privacy | Geïnformeerd akkoord | Welke signalen we loggen; pilot met groepen en verschillende bonusregels; doelbonus stopt 18 januari 2027; links naar P3 en privacyverklaring | Twee aparte, niet vooraf aangevinkte vinkjes; [Akkoord] | — | `account_created`, `experiment_assigned` |
| O7 | Dagdoel | Zelfgekozen doel | 25 / 50 / 90 / 120, standaard 25; "Begin liever klein" bij 90 of 120 | Keuze, [Verder] | Bevestigingssheet bij 90/120 (overmoedrem, spec 4.4) | `daily_goal_set` |
| O8 | Niet storen | Afbreken voorkomen | Waarom: een gesprek of een geopende melding stopt de sessie; korte instructie per platform | [Ik zet het aan], [Later] | — | — |
| O9 | Oefensessie | Laten voelen wat afbreken is | Eén minuut; "Start, en ga dan even naar een andere app." Daarna de uitleg zoals in F6, met de opmerking dat oefenen nergens meetelt | [Start oefening], [Overslaan] | Gebruiker gaat niet weg: "Goed volgehouden. Zo voelt een volle minuut." | `practice_completed` |
| O10 | Eerste sessie | Activatie | Squad erboven als via squadlink; "Start je eerste sessie van 25 minuten." | [Start] → F2 | — | — |

### 3.3 Focus

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| F1 | Home | Sessie starten | Dagdoelring (minuten vandaag van doel); squadstrook met live aanwezigheid; duurkeuze 25/50/90; primaire knop; squadstreak; één regel verenigingspositie | [Start focussessie], duurkeuze, tik op squadstrook → Q1 | Leeg (geen squad): strook wordt "Focus samen: maak een squad"; arm A of B regel onder de ring (zie 6.2); Belofte-aanbod als kaart onder de knop | `presence_viewed` |
| F2 | Voorbereiden | Klaar voor de sessie | Eenmalige checklist (scherm omlaag, liefst aan de lader; laptop: tabblad zichtbaar); gekozen duur | [Begin], "Hoe we tellen" | Wake Lock niet beschikbaar: waarschuwing uit spec 3.2 stap 3 vóór de start; tweede sessie actief elders: "Je hebt een sessie op een ander toestel. Starten stopt die." | `session_started`, `wakelock_state` |
| F3 | Sessie lopend | Rustig volhouden | Donker; resterende tijd groot; voortgangsring dun; "Leg je telefoon omgekeerd neer"; squadleden die nu focussen (avatars, max. 6); kleine Wake Lock-status | [Stoppen] (lang indrukken of modaal) | Wake Lock vrijgegeven: rustige regel "Je scherm kan uitgaan. Tik om aan te houden."; offline: icoon, na 90 s regel; laptop: andere instructie | `wakelock_state`, `heartbeat_gap`, `visibility_hidden` |
| F4 | Stoppen? | Bevestiging | "Stoppen? De minuten tot nu leveren geen punten op. Je squadstreak breekt hier niet door." | [Doorgaan] (primair), [Stoppen] (secundair) | — | `session_aborted` (reden `user_stop`) |
| F5 | Sessie voltooid | Competentie, squad, beloning | 1. Competentieregel ("50 minuten. Je dagdoel is gehaald."); 2. Squad: wie er ook zat, streakstatus; 3. "+50 punten bijgeschreven", inverdienvoortgang; 4. Bonusregel volgens arm; 5. "Maak een kaart" als tekstlink onderaan | [Nog een sessie], [Klaar], "Maak een kaart" | Gemarkeerd: punten *in afwachting* met reden en "meestal binnen 3 werkdagen", geen kaartlink; daglimiet bereikt: "Je zit op 8 uur vandaag. Meer telt vandaag niet mee." | `session_completed`, `daily_goal_met`, `goal_bonus_booked` |
| F6 | Sessie afgebroken | Uitleg en weg terug | Tijdstip, duur volgehouden, reden per code, waarom geen punten, streakstatus | [Opnieuw beginnen], [Kortere sessie] (na 50/90), "Klopt dit niet?" | Derde afbreking vandaag: voorstel kortere sessie en Niet storen; `heartbeat_gap`: "Klopt dit niet?" als secundaire knop in plaats van link | `session_aborted`, `return_after_abort`, `abort_recovery` |
| F7 | Klopt dit niet? | Melding naar de wachtrij | Sheet met keuze (gesprek, wifi weg, scherm ging uit, iets anders) en optioneel veld; verwachting: "Een mens kijkt ernaar, meestal binnen 3 werkdagen." | [Versturen] | Verstuurd: toast | `abort_report_submitted` |
| F8 | Sessiedetail | Status van één sessie | Tijden, status, reden, besluit met redencode, beroep binnen 14 dagen | [Beroep instellen] | Afgekeurd: reden in gewone taal en beroepsknop; beroep loopt: status | `appeal_submitted` |
| F9 | Hoe we tellen | Volledige uitleg | Eerlijke claim; regels uit spec 4.1 in gewone taal; afbreekcodes; wat we niet zien; oefensessie | [Oefen een minuut] | — | `practice_completed` |

### 3.4 Squad

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| Q1 | Squad-overzicht | Doen de anderen mee? | Squadnaam, streak, vandaag (geslaagd als de helft haalt); leden met status: focust nu (nog x min), dagdoel gehaald, nog niet, op pauze, stille modus niet zichtbaar; optioneel minuten bij wie vergelijken aanzette | [Nodig uit] (alleen op toegestane momenten), [Daag uit voor duel], tik op lid | In opbouw (1–2 leden): "Nog 2 vrienden nodig", geen streak; streak bevroren door pauzes: uitleg; vakantiepauze: "De streak staat stil tot 4 januari." | `presence_viewed`, `squad_day_evaluated` (server) |
| Q2 | Squad maken | Squad starten | "Focus samen. Squads houden het beter vol."; naam (gemodereerd); vereniging optioneel | [Maak squad] | Naam afgekeurd: "Kies een andere naam." | `squad_created`, `experiment_assigned` |
| Q3 | Uitnodigen | Link delen | Sheet met voorgestelde tekst (rapport 04 §9, zonder punten of prijzen); geldigheid 7 dagen, max. 5; preview van de link | [Deel via WhatsApp] (Web Share API), [Kopieer link] | Web Share niet beschikbaar: alleen kopiëren; geen vrije plek: knop niet zichtbaar | `invite_created`, `invite_share_opened` |
| Q4 | Duel | Uitdagen en volgen | Tegenstander, 7 dagen, dagelijkse minuten van beiden, dagplafond; "Er staan geen punten op het spel." | [Daag uit], [Accepteer], [Revanche] | Wacht op acceptatie (48 u); gemarkeerde sessie: "Uitslag volgt na de controle." | `duel_created`, `duel_accepted`, `duel_finished`, `invite_created` |
| Q5 | Belofte | Zelfgekozen commitment | Aanbod (dag 14); keuzes dagen/minuten/getuigen; voorstel op basis van werkelijk gedrag; "Er hangen geen punten aan." | [Beloof het], [Niet nu] | Lopend: dagen gehaald; stoppen met één tik | `belofte_offered`, `belofte_made`, `belofte_stopped` |
| Q6 | Belofte-reflectie | Afronden | "Je haalde je Belofte op 9 van 12 dagen."; 18+: één vrijblijvende vraag over inzet voor een goed doel | [Verlengen], [Aanpassen], [Stoppen] | — | `belofte_reflection` |

### 3.5 Vereniging

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| V1 | Verenigingschallenge | Hoe staan we ervoor? | Periode (aanloopklassement zonder prijs, of prijsperiode); poule; ranglijst van verenigingen op deelnamegraad, intensiteit als tweede cijfer; eigen vereniging gemarkeerd; afstand tot drempelprijs; hoofd- en drempelprijs met financier en "Verdiend, niet verloot" | Tik op prijs → voorwaarden; "Hoe rekenen we?" | Geen vereniging: leeg met [Code invoeren]; onder 15 leden: "Jullie stand verschijnt vanaf 15 gekoppelde leden."; stand voorlopig tot fraudecontrole: label "Voorlopig" | `leaderboard_viewed` |
| V2 | Lid worden | Koppelen aan vereniging | Code invoeren of QR scannen; welke vereniging; "Je vereniging ziet alleen groepscijfers, nooit jouw uren." | [Koppel] | Codeplafond bereikt: "Je koppeling wordt even nagekeken." | `vereniging_joined`, `code_cap_reached` |
| V3 | Prestatiechallenge | Individuele verdiende prijs | Prestatie (bijv. elke dag van de tentamenweek 120 minuten), plaatsen, financier, voortgang per dag, "Verdiend, niet verloot. Winnaars controleren we vóór uitreiking." | [Schrijf je in] | Vol: "Alle plaatsen zijn vergeven." Afgerond: status verificatie en levering, of reden en beroep | `challenge_enrolled`, `prize_awarded` |

### 3.6 Beloningen

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| B1 | Saldo en catalogus | Wat kan ik ermee? | Saldo in drie delen (beschikbaar, in afwachting, referral nog niet vrij); inverdienvoortgang; disclaimer uit spec 3.4 stap 2; items met puntenprijs, financier, voorraad deze week | Tik op item → B2; "Waarom zie ik dit?" bij bonus | Voor 300 minuten: alle Verzilveren-knoppen uit met resterende tijd; weekplafond: "Maandag kun je weer verzilveren."; voorraad nul: "Deze week op; maandag komen er 15 bij."; geen gedekt budget: "De catalogus opent zodra partners hun beloningen hebben vastgelegd." | `catalog_viewed` |
| B2 | Item en verzilveren | Bewuste keuze | Sheet: item, voorwaarden, financier, punten die afgaan, saldo daarna | [Verzilver voor x punten] | Geblokkeerd met reden per code; voorraad op tijdens afrekenen: niets afgeschreven | `redemption_completed`, `redemption_blocked` |
| B3 | Telefoon verifiëren | Eenmalige sms bij eerste verzilvering | Waarom (één account per persoon), wat we bewaren (gehasht nummer) | [Stuur code], code-invoer | Nummer al in gebruik: neutrale uitleg en meldroute | — |
| B4 | Voucher | Code gebruiken | Code, geldigheid, hoe gebruiken; ook per e-mail | [Kopieer], "Werkt niet" | "Werkt niet" → binnen twee werkdagen nieuwe code of punten terug | — |
| B5 | Kans op (18+) | Gratis trekking, eerlijk | Prijs, aantal prijzen, kans als getal, trekkingsdatum, seed-hash, deelnamevoorwaarde (weekdoel), spelvoorwaarden, kansspelbelasting voor rekening van Rewarded; label 18+ | [Doe mee] (aparte opt-in), "Spelvoorwaarden" | Niet getoond voor `16_17`; vlag uit: niet getoond; weekdoel niet gehaald: "Haal je weekdoel en je doet volgende week mee." | `draw_opt_in`, `draw_entry` |
| B6 | Trekkingsuitslag | Transparantie achteraf | Aantal deelnemers, winnaars (zonder namen), seed, controle | — | Niet gewonnen: neutraal, zonder "bijna" | `draw_executed` (server) |
| B7 | Bonusregel | Uitleg arm | Tekst uit spec 5 ("Waarom zie ik dit?") en einde seizoen | — | — | — |

### 3.7 Kaart en profiel

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| K1 | Kaart maken | Opt-in delen | Voorbeeld 9:16 of vierkant; velden voornaam, duur of uren, streak standaard; schakelaars achternaam, instelling, vereniging, squadnaam (als alle leden toestaan); "Delen levert niets op." | [Delen], [Opslaan], formaat | Sessie in afwachting: geen kaart; squadnaam niet toegestaan: schakelaar uit met reden | `card_created`, `card_share_opened` |
| K2 | Verificatiepagina | Publiek bewijs met grenzen | Kaart; tekst uit spec 4.8; "Focus ook" | [Focus ook] → wachtlijst of registratie | Ingetrokken of afgekeurd: "Deze kaart is niet meer beschikbaar." | `verify_page_viewed` |
| P1 | Ik | Instellingen | Naam, dagdoel (wijziging vanaf morgen), squad, vereniging; schakelaars minuten vergelijken, stille modus, squadnaam op kaarten, modus zonder punten | Bewerken | Doelvoorstel na 7 dagen als kaart | `compare_optin_changed`, `no_points_mode_changed`, `goal_suggestion_shown`, `goal_suggestion_accepted` |
| P2 | Privacy en gegevens | Inzage en controle | Wat we loggen, bewaartermijnen, download, verwijderen (met waarschuwing over punten) | [Download], [Verwijder account] | — | — |
| P3 | Alle voorwaarden | Eén pagina | Ratio, inverdienperiode, weekplafond, catalogusbeschikbaarheid, seizoen doelbonus, verificatie, spelvoorwaarden (alleen 18+) | — | — | — |
| P4 | Meldingen en beroepen | Status | Lijst van meldingen en beroepen met status | Tik → F8 | Leeg: "Je hebt niets gemeld." | — |

### 3.8 Bestuursdashboard

Het dashboard is een wervingsinstrument (spec 2) en toont alleen aggregaten, met een cijfer pas bij minstens 5 leden in de groep, zonder namen, lijsten, tijdstippen of export (spec 4.6). Het ontwerp maakt die grens zichtbaar in plaats van haar te verstoppen: bovenaan staat permanent "Je ziet groepscijfers. Wie wat doet, zie je niet, en wij ook niet zonder reden."

| ID | Tab | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|
| D1 | Stand | Positie in de poule, deelnamegraad, intensiteit, afstand tot de vereniging erboven en tot de drempel; "Voorlopig" tot fraudecontrole | — | Onder 15 leden: "Jullie stand verschijnt vanaf 15 gekoppelde leden." | `club_dashboard_viewed` |
| D2 | Werving | Gekoppelde en actieve leden per dag (staafjes), aandeel in een squad, aantal squads, koppelingen per QR-bron | — | Groep onder 5: "Te klein om te tonen" | `club_dashboard_viewed` |
| D3 | Promotiekit | Teksten, storysjabloon, poster met QR per bron, dia, "wat je wel en niet belooft" | [Download] per asset | — | `promo_kit_downloaded` |
| D4 | Prijs | Status hoofd- en drempelprijs, financier, levering, verenigingskaart na afloop | [Maak verenigingskaart] | Geen prijsbudget: "Er is (nog) geen prijs; de challenge loopt om de eer." | `club_dashboard_viewed` |
| D5 | Kwaliteit | Aandeel gemarkeerde sessies met uitleg | — | — | `club_dashboard_viewed` |

---

## 4. Kernflows

Elke flow is een stappenreeks met schermverwijzingen. Waar de spec de logica vastlegt, verwijs ik ernaar; hier staat wat de gebruiker ziet en doet.

### 4.1 Onboarding met leeftijdscheck (activatie onder twee minuten)

1. De student opent een squadlink in WhatsApp → **O1** met de uitnodiger bovenaan ("Sanne nodigt je uit voor squad UB-ochtendploeg"). `invite_link_opened` op de server.
2. Tik "Hoe telt Rewarded?" of [Doe mee] → **O2** met de eerlijke claim. Dit scherm is niet over te slaan, omdat het de verwachting zet die F6 later moet waarmaken.
3. **O3** e-mail en voornaam → **O4** magic link. De link opent in dezelfde browser; opent hij in een andere browser of de geïnstalleerde app, dan gaat de flow verder op dat toestel.
4. **O5** geboortedatum. Onder 16 → **O5b**, einde. 16–17 → klasse `16_17`; 18+ → `18_plus`. De gebruiker ziet hier geen verschil; dat komt pas in B1 en B5.
5. **O6** akkoord, met twee aparte vinkjes (voorwaarden; privacyverklaring). `account_created`, `experiment_assigned`.
6. **O7** dagdoel, standaard 25. Bij 90 of 120 een sheet "Begin liever klein? Je kunt je doel later verhogen." `daily_goal_set`.
7. **O8** Niet storen → **O9** oefensessie van één minuut, met de uitnodiging om bewust weg te gaan. Wie dat doet, ziet een F6-achtig scherm met het label "Oefening". `practice_completed`.
8. **O10** "Start je eerste sessie van 25 minuten", met de squad erboven → flow 4.2.

Het doel van onder twee minuten (spec 1) is haalbaar omdat O2, O8 en O9 kort zijn en geen invoer vragen; O9 is over te slaan, de rest niet.

### 4.2 Focussessie: start, lopend, voltooid

1. **F1**: duur kiezen (standaard het laatst gekozen), [Start focussessie].
2. **F2**: eerste keer de checklist; daarna alleen de duur en [Begin]. De server opent de sessie; `session_started`. De client vraagt Wake Lock aan; `wakelock_state`. Lukt dat niet, dan eerst de waarschuwing.
3. **F3**: het scherm wordt donker. De tekst "Leg je telefoon omgekeerd neer" staat vijf seconden groot en zakt dan naar een kleine regel onder de timer. Resterende tijd in minuten (seconden pas in de laatste minuut), dunne voortgangsring, avatars van squadleden die nu focussen. Geen punten. De helderheid van het scherm kunnen we niet regelen; het ontwerp gebruikt donkere tinten om licht en batterij te sparen.
4. Halverwege niets. Geen meldingen, geen aanmoediging, geen geluid.
5. Einde: een zachte toon is uit te zetten en staat standaard uit; de gebruiker draait de telefoon om en ziet **F5**. De server valideert en schrijft bij; `session_completed`, eventueel `daily_goal_met` en `goal_bonus_booked`.
6. **F5** in vaste volgorde: competentie ("50 minuten. Je dagdoel is gehaald." of "50 minuten. Nog 40 tot je dagdoel."), squad ("Mila en Daan zaten er ook. Squadstreak: dag 6."), punten ("+50 punten bijgeschreven", inverdienvoortgang "212 van 300 minuten"), bonusregel van de arm, en onderaan de tekstlink "Maak een kaart".

### 4.3 Focussessie afgebroken

1. Tijdens **F3** wordt de pagina verborgen (`hidden`), bijvoorbeeld door een inkomend gesprek. De server sluit de sessie op het eerste afbreeksignaal; `visibility_hidden`, `session_aborted`.
2. Bij terugkeer verschijnt direct **F6** in plaats van F3; `return_after_abort`. Kopregel: "Je sessie stopte om 14:32." Daaronder de reden per code, de volgehouden duur, de zin over punten en de streakstatus.
3. Keuze: [Opnieuw beginnen] → F2 met dezelfde duur; [Kortere sessie] → F2 met de volgende kortere duur; "Klopt dit niet?" → **F7**. `abort_recovery` legt de keuze vast; wegtikken telt als "weg".
4. Bij de derde afbreking op een dag staat bovenaan F6 één voorstel: "Lukt het vandaag niet lang? Probeer 25 minuten met Niet storen aan."
5. Wie later naar Q1 gaat, ziet zichzelf niet als "gefaald"; de squad ziet alleen of het dagdoel gehaald is.

### 4.4 Squad maken en uitnodigen via WhatsApp

1. **Q1** leeg → [Maak squad] → **Q2** naam en optioneel vereniging; `squad_created`.
2. Direct daarna **Q3** als sheet: voorgestelde tekst, [Deel via WhatsApp]. De Web Share API opent het systeemdeelmenu; WhatsApp is de eerste keuze in de copy, niet in de techniek. `invite_created`, `invite_share_opened`.
3. Terug in **Q1** "in opbouw": "Nog 2 vrienden nodig. Je focust intussen gewoon." De maker kan solo sessies doen.
4. De genodigde doorloopt flow 4.1 en landt in Q1; `squad_joined`. Bij het derde lid: een rustige toast "Jullie squad is compleet. De streak begint morgen."; `squad_became_active`.
5. Nieuwe uitnodigingsmomenten komen alleen terug op de momenten uit spec 4.4; daarbuiten is de knop [Nodig uit] niet zichtbaar.

### 4.5 Verenigingschallenge en bestuursdashboard

1. Het bestuur ontvangt van de beheerder een account en logt in op `/bestuur` → **D1** leeg ("Nog geen leden gekoppeld") → **D3** promotiekit met QR per kanaal.
2. Een lid scant de QR → `/c/{code}`. Zonder account: O1 met de vereniging bovenaan en dan flow 4.1. Met account: **V2** [Koppel]; `vereniging_joined`.
3. Het lid ziet **V1**: aanloopklassement tot de vakantiepauze, label "Zonder prijs, om de eer"; vanaf de prijsperiode de prijzen met financier en "Verdiend, niet verloot".
4. Het bestuur volgt **D2** werving en **D1** stand; cijfers verschijnen bij minstens 5 leden in een groep en de stand vanaf 15 gekoppelde leden.
5. Na de prijsperiode: "Voorlopig" tot fraudecontrole en winnaarsverificatie, daarna "Definitief" en in **D4** de verenigingskaart.

### 4.6 Verzilveren

1. **B1**: saldo en inverdienvoortgang. Onder 300 minuten zijn de knoppen uit, met "Nog 88 minuten focus, dan kun je verzilveren." `catalog_viewed`.
2. Na 300 minuten: tik op item → **B2** met wat afgaat en wat overblijft.
3. Eerste keer: **B3** sms-verificatie.
4. [Verzilver] → server controleert saldo, plafonds, voorraad en dekking → **B4** voucher; `redemption_completed`. Of een reden per code; `redemption_blocked`.
5. Toast: "Je code staat ook in je mail." Bij het weekplafond: "Maandag kun je weer verzilveren. Je punten blijven staan."

### 4.7 Verlote prijs met spelvoorwaarden en 18+

1. Alleen als de vlag aan staat (na advocatenopinie, Ksa-voorlegging en besluit founder, spec 3.9) en alleen voor `18_plus`.
2. Onder de catalogus in **B1** een rustige kaart in de kans-kleur: "Kans op [prijs]. Gratis voor wie zijn weekdoel haalt. 18+." Nooit op F1, kaarten of in uitnodigingen.
3. Tik → **B5**: prijs, aantal prijzen, kans als getal (fictief voorbeeld: "vorige trekking: 3 prijzen, 412 deelnemers, kans ongeveer 1 op 137"), trekkingsdatum, seed-hash, spelvoorwaarden, kansspelbelasting voor rekening van Rewarded.
4. [Doe mee] is een aparte opt-in, één keer; `draw_opt_in`. Wie het weekdoel haalt, doet automatisch mee; `draw_entry`.
5. Na de trekking **B6** met deelnemers en seed; geen "bijna gewonnen", geen animatie van een trekking.

### 4.8 Deelbare kaart

1. Vanuit **F5** (of een mijlpaal of gewonnen duel) de tekstlink "Maak een kaart" → **K1**.
2. Voorbeeld met standaardvelden; schakelaars voor extra velden; "Delen levert niets op." `card_created`.
3. [Delen] → systeemdeelmenu; `card_share_opened`. Of [Opslaan].
4. Wie de QR scant, opent **K2** met de kaart en de grenstekst uit spec 4.8; `verify_page_viewed`. [Focus ook] leidt in de pilot naar de wachtlijst met voorrang.

---

## 5. Designsysteem

### 5.1 Karakter

Rewarded moet eruitzien als een bibliotheek om half negen 's ochtends: rustig, licht, een beetje warm, en serieus genoeg dat een bestuur het durft te delen. De merkkleur is een diep mosgroen, omdat groen bij focus en "verder" hoort zonder de felheid van een casino of fintech. Verlote prijzen krijgen een eigen gedempt violet, zodat "kans" nooit op "verdiend" lijkt. Het sessiescherm is altijd donker, ook in het lichte thema, omdat het met het scherm naar beneden ligt en zo min mogelijk licht mag geven.

### 5.2 Kleurtokens

De gebruiker kiest licht, donker of systeem (standaard systeem). Contrastwaarden zijn berekend met de WCAG-formule voor relatieve luminantie. Normale tekst vraagt 4,5:1, grote tekst en niet-tekstuele elementen 3:1 (WCAG 2.2, 1.4.3 en 1.4.11). Decoratieve scheidingslijnen (`border`) hoeven geen 3:1; randen van invoervelden en schakelaars gebruiken `border-strong`.

| Token | Gebruik | Licht | Donker | Contrast licht | Contrast donker |
|---|---|---|---|---|---|
| `bg` | Pagina-achtergrond | #F7F6F2 | #0E1114 | — | — |
| `surface` | Kaarten, sheets | #FFFFFF | #171B20 | — | — |
| `surface-2` | Ingezette vlakken, uitgeschakelde knoppen | #EFEDE7 | #20262D | — | — |
| `text` | Hoofdtekst | #1B1F24 | #E8EAED | 15,3 op bg; 16,6 op surface | 15,7 op bg; 14,4 op surface |
| `text-muted` | Secundaire tekst | #535B64 | #A3ABB5 | 6,4 op bg; 6,9 op surface | 8,2 op bg; 7,5 op surface |
| `text-disabled` | Uitgeschakelde labels (met reden ernaast) | #62686F | #8A929C | 4,8 op surface-2 | 4,9 op surface-2 |
| `primary` | Primaire knop, actieve tab, voortgang | #2B5A4E | #7FC4AE | 7,3 op bg | 9,4 op bg |
| `on-primary` | Tekst op primaire knop | #FFFFFF | #0E1114 | 7,9 op primary | 9,4 op primary |
| `primary-soft` / `primary-text` | Labels "Verdiend", gehaald | #DCEBE5 / #2B5A4E | #1E3530 / #9ED6C3 | 6,4 | 8,0 |
| `live` | "Focust nu", live stip | #1D6B52 | #6FD3AE | 6,4 op surface | 9,6 op surface |
| `pause-soft` / `pause-text` | Afgebroken, op pauze, in afwachting (neutraal, geen rood) | #FBEFD6 / #7A4E00 | #3A2E14 / #F2C46B | 6,3 | 8,2 |
| `kans-soft` / `kans` | Alleen verlote prijzen | #ECE9F7 / #574A92 | #2A2545 / #B9AEF0 | 6,3 | 7,2 |
| `danger` | Alleen destructieve acties (account verwijderen) | #A3322A | #F08A80 | 6,9 op surface | 7,1 op surface |
| `border` | Decoratieve scheiding | #D9D6CE | #2C333B | n.v.t. | n.v.t. |
| `border-strong` | Invoervelden, schakelaars, ongekozen segment | #7D848C | #6E7782 | 3,8 op surface | 3,8 op surface |
| `focus-ring` | Toetsenbordfocus, 2 px plus 2 px ruimte | #1F4FD1 | #8FB2FF | 6,3 op bg | 9,0 op bg |
| `session-bg` | Sessiescherm (beide thema's) | #000000 | #000000 | — | — |
| `session-text` / `session-muted` | Timer / regels in de sessie | #C9CED4 / #8A929C | idem | 13,3 / 6,7 | 13,3 / 6,7 |

Drie kleurregels. Rood bestaat alleen voor destructieve acties; een afgebroken sessie is amber-neutraal, geen fout. Kleur draagt nooit alleen betekenis: elke status heeft ook een woord of icoon. En de kans-kleur verschijnt uitsluitend in B5, B6 en de kaart in B1.

### 5.3 Typografie

Systeemfonts, zodat de PWA snel laadt en zonder externe bron werkt: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Cijfers in timer, saldo en ranglijst gebruiken `font-variant-numeric: tabular-nums`, zodat ze niet verspringen. Tekst schaalt mee met de systeeminstelling (rem-eenheden); de layout moet bij 200% tekstgrootte bruikbaar blijven (WCAG 1.4.4).

| Stijl | Grootte / regelhoogte | Gewicht | Gebruik |
|---|---|---|---|
| `display` | 64 / 72 | 300 | Timer in F3 |
| `title-l` | 28 / 34 | 700 | Kop van een scherm |
| `title-m` | 22 / 28 | 650 | Kop van een kaart, competentieregel F5 |
| `body-l` | 17 / 24 | 400 | Hoofdtekst, uitleg F6 |
| `body` | 15 / 22 | 400 | Lijsten, beschrijvingen |
| `label` | 13 / 18 | 600 | Knoplabels klein, chips, tablabels (12 px minimaal) |
| `caption` | 12 / 16 | 400 | Voorwaarden, bronvermelding |

### 5.4 Spacing, raster en vorm

Een raster van 4 px met de stappen 4, 8, 12, 16, 24, 32, 48. Zijmarge op de telefoon 16 px, tussen kaarten 12 px, binnen een kaart 16 px. Hoekradius: 12 px voor kaarten, 999 px voor knoppen en chips, 20 px voor de bovenrand van een bottom sheet. Schaduwen zijn minimaal (één zachte schaduw voor sheets); diepte komt uit vlakkleur, niet uit glans.

### 5.5 Componenten

| Component | Varianten | Regels |
|---|---|---|
| Knop | Primair (gevuld `primary`), secundair (rand `border-strong`), tekstlink, destructief (`danger`, alleen met modaal) | Minimaal 48 px hoog; één primaire knop per scherm; label is een werkwoord ("Start focussessie", niet "OK"); uitgeschakeld altijd met de reden in tekst ernaast |
| Kaart | Standaard, gemarkeerd (eigen vereniging), status (amber), kans (violet, alleen B1/B5) | Kop, inhoud, maximaal één actie; geen hele kaart als knop als er ook een knop in staat |
| Timer | Sessie (display, `session-text`), compact (F1, titel-m) | Minuten, seconden alleen in de laatste minuut; `aria-live` alleen elke 5 minuten |
| Voortgangsring | Dagdoel (F1), sessie (F3), inverdien (B1 als balk) | Dun (6 px); geen pulserende rand; altijd met getal in tekst ("212 van 300 min") |
| Lijst | Squadleden, catalogus, meldingen | Rij ≥ 56 px; avatar met initialen, nooit een foto in de pilot; status als woord plus icoon |
| Ranglijst | Verenigingen | Positie, naam vereniging, deelnamegraad (groot), intensiteit (klein); eigen vereniging met rand; geen pijlen die stijgen of dalen animeren; geen personen |
| Toast | Informatief | Onderaan boven de tabbalk, 4 s, `role="status"`; nooit voor een fout die actie vraagt; nooit tijdens een sessie |
| Modaal | Bevestiging met gevolg | Titel als vraag, twee knoppen, de veilige keuze primair; sluiten met Esc en buitenkant tik; focus gevangen |
| Bottom sheet | Uitnodigen, verzilveren, melden, overmoedrem | Sleepgreep, sluitknop, maximaal 90% hoogte; op de laptop een gecentreerd paneel |
| Segment | Duurkeuze 25/50/90, dagdoel | Gekozen segment gevuld, ongekozen met `border-strong`; `role="radiogroup"` |
| Chip / label | "Verdiend", "Kans · 18+", "Voorlopig", "In afwachting", "Op pauze" | Altijd tekst; kleurfamilie volgens 5.2 |
| Banner | Afgebroken, offline, vakantiepauze | Volle breedte onder de kop; sluitbaar behalve offline |

### 5.6 Iconen

Lijniconen van 24 px op een raster van 24, lijndikte 1,75 px, afgeronde uiteinden; de actieve tab gebruikt de gevulde variant. Eén metafoor per begrip: een telefoon met het scherm omlaag voor sessie, drie hoofden voor squad, een vlag voor vereniging, een cadeaudoos zonder strik-animatie voor beloningen, een cirkel met persoon voor Ik, een kleine vlam voor streak (rustig getekend, niet geanimeerd), een klavertje voor kans. Geen muntjes, geldzakken, diamanten of sterrenregens: die staan voor geld en geluk, niet voor focus.

### 5.7 Beweging

Beweging bevestigt wat er gebeurde en houdt de gebruiker in de context; ze beloont niet. Overgangen duren 150–250 ms met een uitlopende curve (`cubic-bezier(.2,.7,.2,1)`). Een sheet schuift omhoog, een scherm faded. Wat niet mag: confetti, oplopende puntentellers, draaiende wielen of rollen, schuddende knoppen, pulserende "claim"-knoppen, geluiden bij punten, haptische pieken bij beloningen, en animaties die de spanning van een trekking nabootsen. Dat zijn de signalen van variabele beloning en slotmachines, en die passen niet bij een product dat geen loot boxes kent (businessplan §4). In F5 verschijnen de drie blokken na elkaar met 120 ms vertraging, zodat de volgorde (competentie, squad, punten) ook in de tijd klopt. Met `prefers-reduced-motion: reduce` vallen alle verplaatsingen weg en blijft alleen een fade van 100 ms of niets.

### 5.8 Toegankelijkheid

Het doel is WCAG 2.2 AA voor alle schermen in de studentenapp en het bestuursdashboard.

- **Contrast**: zie 5.2; alle tekstparen ≥ 4,5:1, niet-tekstuele elementen ≥ 3:1.
- **Aanraakdoelen**: minimaal 48 × 48 px voor alles wat je bedient, ruim boven het minimum van 24 × 24 px uit WCAG 2.2 (2.5.8). De Stoppen-knop in F3 is 56 px hoog en staat niet direct naast een andere knop.
- **Schermlezers**: elk scherm heeft één `h1`; tabbalk als `nav` met `aria-current="page"`; de timer kondigt niet elke seconde aan maar elke 5 minuten en bij het einde (`aria-live="polite"`); live aanwezigheid krijgt een samenvattende tekst ("2 van 4 squadleden focussen nu"); de voortgangsring heeft `role="progressbar"` met waarde en tekst. Iconen zonder tekst hebben een `aria-label`, decoratieve iconen `aria-hidden`.
- **Toetsenbord**: volledige bediening op de laptop, zichtbare `focus-ring`, geen focus die onder een sticky element verdwijnt (2.4.11); Esc sluit sheets en modalen.
- **Gebaren**: geen actie alleen via vegen of lang indrukken; Stoppen kan lang indrukken en heeft altijd ook een modaal met knoppen (2.5.1, 2.5.7).
- **Taal en tijd**: `lang="nl"`; geen tijdslimiet op invoer behalve de magic link, met opnieuw versturen; de sessie zelf is een tijdslimiet die de gebruiker kiest.
- **Authenticatie**: magic link zonder puzzel of wachtwoord (3.3.8).
- **Reduced motion en tekstgrootte**: zie 5.7 en 5.3.
- **Kleurenblindheid**: groen, amber en violet zijn altijd met tekst gecombineerd.

---

## 6. Microcopy

### 6.1 Regels

De toon komt uit rapport 04 §5: praat als een studiegenoot, kort en droog, zonder druk. Voor de interface voeg ik daar zes werkregels aan toe.

1. **Feit, reden, weg terug.** Bij elke tegenvaller drie zinnen: wat er gebeurde (met tijd en getal), waarom, en wat je nu kunt doen. Geen bijvoeglijke naamwoorden over de gebruiker.
2. **Jij-vorm, actief, tegenwoordige tijd.** "Je sessie stopte", niet "Uw sessie werd beëindigd".
3. **Werkwoorden op knoppen.** "Opnieuw beginnen", "Verzilver voor 300 punten". Nooit "OK", "Ja" of een knop die de gebruiker voor zijn keuze laat schamen.
4. **Getallen zijn echt of gemarkeerd.** Geen voorbeeldopbrengsten; resterende tijd en voorraad altijd als getal. Nooit een eurowaarde bij punten.
5. **Verdiend heet verdiend, kans heet kans.** Bij verdiende prijzen "verdiend" of "behaald", bij trekkingen "kans op", met de kans als getal (rapport 04 §5, regel 3).
6. **Geen woorden uit de nee-lijst.** "Bewezen", "win" (bij iets verdiends), "verdien geld", "gefaald", "mis het niet", "nog maar", "gratis geld". De volledige lijst staat in rapport 04 §10.

### 6.2 Voorbeelden voor de belangrijkste momenten

| Moment | Copy | Waarom zo |
|---|---|---|
| Sessie loopt (F3) | "Leg je telefoon omgekeerd neer. Wij houden de tijd bij." Laptop: "Laat dit tabblad open in een zichtbaar venster. Je telefoon leg je zelf weg." | Instructie, geen beloning; laptopmodus belooft niets over de telefoon (rapport 04 §2) |
| Afgebroken, `hidden` (F6) | "Je sessie stopte om 14:32 omdat Rewarded niet meer op je scherm stond. Je hield 18 minuten vol. Afgebroken sessies leveren geen punten op: we kunnen alleen tijd belonen die we kunnen zien. Je squadstreak loopt nog." | Letterlijk uit spec 3.3, plus de streakzin (Silverman en Barasch 2023) |
| Afgebroken, `heartbeat_gap` | "Je sessie stopte om 14:32 omdat we een tijd geen signaal van je toestel kregen. Dat kan aan de wifi liggen. Klopt dit niet? Laat het ons weten; een mens kijkt ernaar." | Automatisch signaal kost punten, dus de meldroute staat vooraan (spec 3.3) |
| Afgebroken, `user_stop` | "Je stopte na 18 minuten. Ook goed om te weten: 25 minuten is genoeg voor je dagdoel." | Geen fraudesignaal, geen verwijt |
| Afgebroken, `second_session` | "Je startte een sessie op een ander toestel, dus deze is gestopt. Er loopt er één tegelijk." | Vaste code, gewone taal |
| Derde afbreking | "Lukt het vandaag niet lang? Probeer 25 minuten met Niet storen aan." | Voorstel uit spec 3.3 stap 4 |
| Stoppen-modaal | "Stoppen? De minuten tot nu leveren geen punten op. Je squadstreak breekt hier niet door." [Doorgaan] [Stoppen] | Feitelijk, geen schuld; de veilige keuze is primair maar Stoppen blijft gewoon zichtbaar |
| Voltooid (F5) | "50 minuten. Je dagdoel is gehaald." / "Mila en Daan zaten er ook." / "+50 punten bijgeschreven." | Competentie, squad, beloning (P1) |
| Gemarkeerd | "Deze sessie wordt nagekeken (reden: een groot deel van de tijd kregen we geen signaal). Je punten komen vrij zodra dat klaar is, meestal binnen 3 werkdagen." | Spec 6.4; de exacte drempel noemen we niet |
| Eerste verzilvering nog niet mogelijk (B1) | "Nog 88 minuten focus, dan kun je verzilveren. Je punten staan al klaar." | Resterende tijd als getal; de inverdienperiode is een feit, geen hindernis |
| Inverdienperiode, uitleg | "Je eerste verzilvering kan na vijf uur focus. Zo blijft de catalogus er voor mensen die echt zitten." | Reden in één zin, zonder fraude-verwijt |
| Weekplafond | "Maandag kun je weer verzilveren. Je punten blijven staan." | Spec 3.4 stap 6 |
| Voorraad nul | "Deze week op. Maandag komen er 15 bij." | Echte voorraad, geen "bijna op" (spec 4.3) |
| Catalogus nog niet gedekt | "De catalogus opent zodra partners hun beloningen hebben vastgelegd. Je punten tellen al." | Budget is afgeleid van geboekte omzet (businessplan besluit 2) |
| Arm A | "Haal je doel vandaag: +20." | Spec 5 |
| Arm B, maandag | "Je weekbudget: 140 punten. Elke dag dat je je doel haalt, zet je er 20 veilig." | Spec 5 |
| Arm B, gemist doel | "Je weekbudget is nu 100. Vandaag je doel halen zet er 20 veilig." | Feitelijk, geen "je verliest" (spec 5) |
| Trekking (B5) | "Kans op [prijs]. Haalde je je weekdoel? Dan doe je gratis mee. Vorige trekking: 3 prijzen, 412 deelnemers: een kans van ongeveer 1 op 137. Trekking op maandag 11 januari. 18+. Spelvoorwaarden." | Rapport 04 §5 regel 3; kans als getal (spec 3.9); de cijfers hier zijn fictief |
| Trekking, niet gewonnen | "De trekking van 11 januari is geweest. 412 mensen deden mee; jij zat er deze keer niet bij." | Geen "bijna", geen nieuwe prikkel |
| Verdiende prijs (V3) | "Haal elke dag van de tentamenweek 120 minuten en je verdient [beloning], gefinancierd door [partner]. 20 plaatsen. Verdiend, niet verloot. Winnaars controleren we vóór uitreiking." | Rapport 04 §5 regel 3 |
| Kaart (K1) | "Je kaart toont je voornaam, je focustijd en je streak. Delen levert niets op; het is gewoon leuk." | Spec 4.8 |
| Belofte stoppen | "Belofte gestopt. Je squad ziet alleen dat hij gestopt is." | Geen schuldtaal (spec 4.12) |
| Dashboardkop | "Je ziet groepscijfers. Wie wat doet, zie je niet, en wij ook niet zonder reden." | Spec 4.6, 4.11 |

### 6.3 Checklist voor elke schermtekst

Staat de beloning na focus en squad? Is elk getal echt of als fictief gemarkeerd? Staat er een eurowaarde bij punten? Staat "kans" alleen bij een trekking en "verdiend" alleen bij een prestatie? Is er een woord dat schaamte, schaarste of urgentie oproept? Is elke uitgeschakelde knop voorzien van een reden? Een nee op de eerste twee vragen of een ja op de laatste vier houdt de tekst tegen.

---

## 7. Open vragen

1. **Weergave van arm B (jurist, vóór 25 november).** Spec 5 en open vraag 5 van de spec laten de jurist toetsen of het slinkende weekbudget een dark pattern is. Ik heb de copy feitelijk gehouden, maar of een zichtbaar dalend getal ("nu 100") al te veel druk geeft, is een ontwerpvraag die we met vijf studenten willen testen vóór de pilot. Valt de toets negatief uit, dan verdwijnt het weekbudgetblok uit F1 en F5.
2. **Live aanwezigheid standaard aan of uit.** Spec 4.4 heeft een stille modus; rapport 04 §9 vraagt dat live status per persoon uit te zetten is. Ik kies standaard aan binnen de squad, omdat "zien wie er zit" de kern van de squadbelofte is, en stille modus op één tik in P1 en Q1. De founder bevestigt dit; bij 16- en 17-jarigen kan de jurist anders adviseren (aanname: geen extra regel nodig).
3. **Sessiescherm op iOS (test vóór 2 december).** Of Wake Lock in Safari en in de Home Screen-app op echte toestellen werkt, is alleen bekend uit compatibiliteitsdata (spec open vraag 10; rapport 09 §3.1). Als het scherm toch dimt of uitgaat, moet F2 een andere instructie geven. Ook onbekend: hoe donker een volledig zwart scherm met grijze tekst er met het scherm omlaag voor de gebruiker uitziet bij het omdraaien.
4. **Lang indrukken voor Stoppen.** Lang indrukken voorkomt per ongeluk stoppen, maar is voor een deel van de gebruikers lastig. Voorstel: één tik opent het modaal (F4); lang indrukken is een snelkoppeling. Te testen.
5. **Toon bij `16_17`.** Moet de copy voor 16- en 17-jarigen anders zijn dan voor ouderen, behalve het weglaten van trekkingen? Mijn aanname: nee, want de doelgroep is hbo/wo en de toon is al zonder druk.
6. **Kans als getal vóór de eerste trekking.** Bij de eerste trekking is er geen vorige trekking. Wat tonen we dan als kans: het aantal prijzen en "het aantal deelnemers maken we na sluiting bekend"? Te beslissen met de jurist bij het opstellen van de spelvoorwaarden.
7. **Naam en merkkleur.** De naam is een open punt tot de merkentoets (rapport 04 §3). Het designsysteem gebruikt geen woordmerk in componenten, zodat een naamswissel alleen het logo en de teksten raakt.
8. **Illustraties.** Ik heb bewust geen illustraties ontworpen voor lege toestanden. Als tests laten zien dat lege schermen kaal aanvoelen, is een kleine set lijntekeningen in de stijl van 5.6 een optie na de pilot.
9. **Installatie-uitleg PWA.** Spec 8 heeft een Could voor installatie-uitleg. Waar die in de flow hoort (na de eerste voltooide sessie of in F2) hangt af van de iOS-test in vraag 3.
10. **Bestuursdashboard op de telefoon.** Ontworpen voor laptopbreedte. Uit het werk met besturen moet blijken of ze het vooral op de telefoon openen; dan krijgen D1 en D3 een eenkoloms variant.
