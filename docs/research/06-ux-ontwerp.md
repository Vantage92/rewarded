# 06 — UX-ontwerp web-MVP

*Rol: productontwerper (UX en UI). Versie 1.4, 5 november 2026, herzien na een kritische tegenlezing en na pitchronde 1, 2 en 3 volgens de bindende besluiten van de founder (`docs/pitch/ronde-3-founder-reactie.md`, gedateerd 5 november, die voorgaan op `docs/pitch/ronde-2-founder-reactie.md` en `docs/pitch/ronde-1-founder-reactie.md`; wijzigingslog aan het einde). Data in de copy die per instelling verschillen, staan als [datum]; de app vult ze uit de tentamenkalender van de vereniging of faculteit in, en zonder vereniging uit de standaardkalender (spec 4.13). Bindend kader: `docs/01-businessplan.md` (verder: businessplan). Functionele basis: `docs/research/05-productspecificatie.md` (verder: spec); elke regel, drempel en eventnaam in dit document komt daaruit, tenzij er uitdrukkelijk "voorstel aan de spec" bij staat. Bewijs: rapport 08 (gedragswetenschap, §7 ontwerpimplicaties) en rapport 09 (verificatietechniek). Toon en woordkeuze: rapport 04 (boodschap en positionering, §5 tone of voice en §10 "Dit zeggen we nooit"). Techniek: rapport 07 (architectuur). Mockups: `docs/research/mockups/rewarded-mockups.html`. Alle namen, aantallen en partners in voorbeelden en mockups zijn fictief.*

*Naamgeving: ontwerpprincipes heten in dit document altijd "principe P1" tot "principe P10"; schermen in de groep Profiel heten P1 tot P5. Waar verwarring kan ontstaan, staat het woord "principe" of "scherm" erbij.*

---

## Samenvatting

1. De interface draait om één handeling: een sessie starten en de telefoon omdraaien. Al het andere (squad, vereniging, beloningen) staat in dienst van die handeling en komt in die volgorde in beeld: eerst focus, dan de squad, dan pas punten. Een puntengetal is nooit het eerste of grootste element op een scherm buiten Beloningen.
2. Vijf tabs onderaan: Focus, Squad, Vereniging, Beloningen, Ik. Op de laptop worden ze een zijbalk. Tijdens een sessie verdwijnt alle navigatie. Het bestuursdashboard is een aparte omgeving met vijf tabbladen, ontworpen voor laptopbreedte.
3. Een afgebroken sessie is een gewone gebeurtenis met een reden, een tijdstip en een korte weg terug, geen mislukking. Elke afbreekcode heeft eigen copy, en "Klopt dit niet?" belooft per code alleen wat de wachtrij kan waarmaken.
4. Elke sessie eindigt met een eindsignaal dat standaard aan staat: een zachte toon en een helder eindscherm. Zonder signaal draaien eerlijke studenten hun telefoon te laat om, en dan meet heuristiek H9 een UX-fout in plaats van fraude.
5. Het dagdoel en de weekprestatie ("deze week 3 van de 7 dagen") staan voorop; punten worden direct na de sessie bijgeschreven, maar klein en onderaan, onder het dagdoel en de squad. Minuutpunten zijn bijzaak (founder GS1). De doelbonus van beide pilotarmen staat in één component, de Bonusregel, met dezelfde plek, grootte en stijl, zodat de armen alleen in framing verschillen.
6. Er is één prijsfamilie: verdiend, in de merkkleur met "Verdiend". Trekkingen worden niet gebouwd (founder J4 en S9); er is geen kans-kleur, geen scherm en geen schakelaar meer.
7. De squad ziet wat het businessplan toestaat, en de student weet dat vooraf: één regel bij binnenkomst en bij het maken van een squad zegt wat squadleden van je zien. De rustdag-joker, de Belofte met getuigen en de duelbadge hebben nu een interface.
8. Herinneringen staan standaard uit, komen alleen op een tijd die de student koos en hebben een eigen scherm (P5). Referral heeft een eigen scherm met de vesting als voortgang en zonder "nodig uit en verdien"-taal.
9. De mockups zijn een semantische referentie (knoppen, schakelaars, keuzerondjes, `aria-current`) en dragen op elk scherm de markering "Fictief". Open punten voor de founder, de jurist en de bouwers staan in hoofdstuk 7, elk met eigenaar en datum.
10. Deelnemersbescherming heeft een interface (founder G4): een eerlijke uitleg van het onderzoek met afmelden zonder verlies van punten, korte overslaanbare vragenlijsten, een tentamendag, een rustig signaal bij sessies na 01:00, een rustige kaart met hulpbronnen bij een schadesignaal, en voor 16- en 17-jarigen live aanwezigheid standaard uit en wekelijks alleen vragen over studietijd en afleiding. Geen copy speelt op sociale schaamte.
11. Na ronde 3: de uitweg uit de rustperiode komt op de eerste dag van het aprilvenster één keer terug, in dezelfde woorden en zonder aandringen (F11); wie bij een rustsquad aansluit, ziet vooraf wat dat voor hem betekent (Q9); bij de instellingsmail staat dat we een versleutelde vingerafdruk bewaren, zodat één adres maar één account kan bevestigen (P1); de vroege Belofte-arm krijgt een week vóór het aprilvenster een tweede aanbod (Q5).

---

## 1. Ontwerpprincipes

De principes hieronder zijn geen smaak. Elk volgt uit een besluit in het businessplan of uit het bewijs in rapport 08, en elk heeft een toets die een ontwerper of reviewer op een scherm kan toepassen. Een scherm dat een principe schendt, gaat niet naar de bouw.

**P1. Focus, dan squad, dan beloning.** De volgorde op elk scherm volgt de positionering uit rapport 04 §5, regel 1: de beloning komt het laatst. Op het eindscherm van een sessie staat eerst wat je deed ("Je dagdoel is gehaald"), dan wie van je squad er ook zat, en pas daarna de punten. Die volgorde is ook een bewijsvraag. Informatieve, competentiegerichte feedback verhoogde in Deci e.a. (1999) de vrijwillige voortzetting, terwijl verwachte, aan deelname gekoppelde materiële beloningen die juist verlaagden (rapport 08 §2 en §7, implicatie 7). Punten mogen er zijn, maar als bevestiging, niet als loon. Toets: buiten het tabblad Beloningen is een puntengetal nooit het eerste of grootste element van een scherm. Op F5 staat het na competentie en squad, in een kleinere stijl dan de kop; op F1 staat een puntengetal alleen in de component Bonusregel (§5.5).

**P2. Direct bijschrijven, zichtbaar in hetzelfde moment.** Beloningen werken vooral als ze direct volgen (Levitt e.a. 2016, rapport 08 §3 en §7, implicatie 2). De server schrijft de punten bij bij het einde van de sessie (spec 4.2), en de interface laat dat in hetzelfde scherm zien: "+50 punten bijgeschreven", met de inverdienvoortgang eronder. Geen "je punten verschijnen binnen 24 uur", geen weekafrekening. De enige uitzondering is een gemarkeerde sessie: dan staan de punten zichtbaar als "Wordt nagekeken", met de reden en de verwachte doorlooptijd (spec 6.4). Ook dat is een directe terugkoppeling, alleen een eerlijke.

**P3. Geen punten tijdens de sessie.** Het sessiescherm toont resterende tijd, wie van je squad ook focust en één knop Stoppen. Geen oplopende puntenteller. Die zou van de sessie betaald werk maken (Gneezy e.a. 2011, rapport 08 §7, implicatie 7; spec 3.2). Het scherm is donker, bijna leeg en verandert hooguit eens per minuut, omdat de telefoon met het scherm naar beneden ligt en niemand ernaar kijkt. De enige uitzondering is het einde: dan geeft de app een eindsignaal (§4.2), omdat de student anders niet merkt dat de sessie klaar is.

**P4. Eerlijke uitleg bij afgebroken sessies, vooraf en achteraf.** De web-MVP bewijst alleen dat Rewarded zichtbaar op één browser stond (businessplan §4, verificatieladder trede 1; rapport 09 §3.3). Dat betekent dat eerlijke studenten sessies verliezen door een inkomend gesprek, een lege batterij of wegvallende wifi. Het ontwerp behandelt dat als een feit met een reden: het tijdstip van stoppen, de duur die je volhield, de vaste reden in gewone taal (spec 4.1, afbreekcodes) en waarom die tijd geen punten oplevert ("we kunnen alleen tijd belonen die we kunnen zien"). Daarna drie wegen: opnieuw, korter, of melden. Een gebroken reeks leidt tot meer terugval dan het gedrag verklaart, zeker bij zelfverwijt, en een herstelmogelijkheid dempt dat (Silverman en Barasch 2023, rapport 08 §4). We geven dus geen punten voor afgebroken tijd, maar maken de weg terug zo kort mogelijk en zeggen erbij dat de squadstreak niet breekt. Eerlijk betekent ook: geen belofte die het systeem niet waarmaakt. De regels die een sessie afbreken (ook de grens van 5 minuten zonder verbinding) staan vooraf in O8 en F9, en "Klopt dit niet?" belooft alleen herstel waar de wachtrij kan herstellen (spec 6.4).

**P5. Geen dark patterns.** De founder brief sluit ze uit, en rapport 04 §10 noemt de vormen die in deze categorie voor de hand liggen. Concreet: geen kunstmatige schaarste ("nog maar 2 plekken"), geen "bijna op" tenzij er echt minder dan 10% voorraad is (spec 4.3), geen streakverlies als bangmakerij, geen schuldtaal bij stoppen, geen vooraf aangevinkte opt-ins, geen verstopte uitschrijf- of stopknop, geen bevestigingsknop die "Nee, ik wil niet focussen" heet, geen meldingen of e-mails op een tijdstip dat de gebruiker niet koos, en maximaal één e-mailherinnering per dag (spec 8). Herinneringen staan standaard uit en hebben een eigen scherm (scherm P5); elke mail heeft een uitschrijflink. Stoppen met een Belofte kost één tik (spec 4.12). De verliesarm B mag feitelijk zijn ("je weekbudget is nu 100"), nooit dreigend ("je verliest punten!") (spec 5).

**P6. Vergelijking alleen in de squad, en opt-in.** Openbare individuele ranglijsten kunnen goed presterende studenten ontmoedigen (Bursztyn en Jensen 2015: −24%, rapport 08 §6), terwijl competitie in kleine teams wel werkt (Patel e.a. 2019). Het ontwerp kent daarom twee vormen van vergelijking en geen derde. Binnen de squad zie je wie focust en wie zijn dagdoel haalde; minuten vergelijken staat standaard uit en toont alleen leden die het ook aanzetten (spec 4.4). Wie lid wordt van een squad, leest vooraf in één regel wat squadleden van hem zien (O1, Q2); dat maakt het lidmaatschap een geïnformeerde keuze. Daarbuiten zie je alleen verenigingen, geaggregeerd op deelnamegraad, nooit totalen en nooit een persoon (spec 4.6). Een duel met iemand buiten de squad is opt-in door acceptatie (spec 4.5), maar valt alleen onder de randvoorwaarde als de founder dat op 25 november bevestigt (spec 10.5). Tot dan ontwerp ik het duel onder voorbehoud, met een terugvaloptie: alleen duels binnen de squad (§3.4, Q4). Toets: verschijnt een naam naast een getal buiten de squad of het eigen duel, dan is het scherm fout.

**P7. Status vóór geld.** De gratis laag werkt met punten en status, nooit met centen per uur (businessplan §4; Gneezy en Rustichini 2000 en Deci e.a. 1999 in rapport 08 §2). Visueel betekent dit dat squadstreak, dagdoel en verenigingspositie het meeste gewicht krijgen, en dat punten nooit worden omgerekend naar euro's. De catalogus noemt per item de financier en de puntenprijs, niet de winkelwaarde. Een bedrag in euro's staat alleen bij de nepdeur voor Plus (B8, een abonnementsprijs, geen puntwaarde) en in het bestuursdashboard bij het plafond van de verenigingsprijs.

**P8. Geen bedragen delen, geen beloning op delen.** De deelbare kaart toont standaard voornaam, duur of uren en streak; nooit punten, bedragen, beloningen, badges uit duels of ranglijstposities (spec 4.8). Delen levert niets op en dat staat ook op het deelscherm. Referralpunten komen uit de geverifieerde focus van de genodigde, nooit uit het delen zelf (spec 4.9), en het referralscherm zegt dat ook. Het groeiargument is sociaal (businessplan §6: deelbaar bewijs is de versterker, niet de motor), en de kaart moet dat dragen zonder geld.

**P9. Zeg wat we zien, en niet meer.** "Geverifieerd" betekent alleen dat Rewarded zichtbaar en actief op het scherm stond (rapport 04 §2). Het woord "bewezen" staat nergens in de app (spec 6.1). De definitie staat binnen één tik van elke plek waar het woord voorkomt, en de verificatiepagina achter de QR zegt ook wat ze níét bewijst. In laptopmodus beloven we geen "telefoon weg", want daar zien we de telefoon niet; ook O1 toont op een desktop een andere kop. Hetzelfde geldt voor wat we over de gebruiker bewaren: de privacytekst bij de leeftijdscheck zegt precies wat de server opslaat (§3.2, O5).

**P10. Leeftijd bepaalt wat bestaat, niet wat grijs is.** De gratis laag is 16+; 18+-prijzen van een financier, duels buiten de squad en later de inzet zijn 18+ (businessplan §3). Trekkingen worden niet gebouwd. Voor `16_17` worden 18+-onderdelen niet getoond, ook niet als uitgeschakelde kaart, teaser of aankondiging. Dat geldt ook voor schermen die iedereen ziet vóórdat de leeftijd bekend is: O1 tot en met O10, mails, uitnodigingen en de promotiekit noemen geen 18+-prijzen. Een grijze "Kans op"-kaart of een zin "sommige onderdelen zijn 18+" voor een 17-jarige zou een verleiding zijn die de Gedragscode juist wil vermijden (rapport 04 §10). De overgang van `16_17` naar `18_plus` op de dag dat iemand 18 wordt, levert geen melding, mail, badge of toast op (§4.7).

| Principe | Bron | Ontwerpgevolg | Toets |
|---|---|---|---|
| P1 Focus, squad, beloning | Rapport 04 §5; rapport 08 §7.7 | Volgorde op eindscherm en home; Bonusregel als enige puntenregel op F1 | Buiten Beloningen is een puntengetal nooit het eerste of grootste element; op F1 alleen in de Bonusregel |
| P2 Direct bijschrijven | Levitt e.a. 2016 (rapport 08 §7.2); spec 4.2 | Punten in het eindscherm; "Wordt nagekeken" met reden | Geen uitgestelde bijschrijving zonder reden |
| P3 Geen punten in de sessie | Gneezy e.a. 2011 (rapport 08 §7.7); spec 3.2 | Donker sessiescherm met tijd en squad; eindsignaal standaard aan | Nul punten in het sessiescherm; elke sessie heeft een eindsignaal |
| P4 Eerlijke afbreking | Businessplan §4; spec 3.3, 4.1, 6.4; Silverman en Barasch 2023 | Reden, tijdstip, duur, drie acties; regels vooraf in O8 en F9 | Elke afbreking heeft een code, eigen copy en "Klopt dit niet?" dat niet meer belooft dan spec 6.4 |
| P5 Geen dark patterns | Founder brief; rapport 04 §10; spec 8 | Geen schaarste, geen schuldtaal, één tik stoppen; herinneringen opt-in | Checklist in 6.3 |
| P6 Vergelijken in de squad | Bursztyn en Jensen 2015; Patel e.a. 2019; spec 4.4–4.6, 10.5 | Zichtbaarheidsregel vóór lidmaatschap; opt-in minuten; ranglijst alleen verenigingen; duel buiten squad onder voorbehoud | Geen naam plus getal buiten squad of duel |
| P7 Status vóór geld | Businessplan §4; rapport 08 §2 | Streak en dagdoel prominent; geen euro's | Geen eurowaarde bij punten |
| P8 Geen bedragen delen | Businessplan §6; spec 4.8, 4.9 | Kaart zonder punten; "delen levert niets op" | Kaartvelden uit de vaste lijst |
| P9 Zeg wat we zien | Rapport 04 §2; rapport 09 §3.3; spec 4.10, 6.1 | Definitie binnen één tik; verificatiepagina met grenzen; privacytekst klopt met de opslag | "Bewezen" komt niet voor; elke privacyzin is waar voor de opslag in spec 4.10 |
| P10 Leeftijd bepaalt wat bestaat | Businessplan §3; spec 3.6, 4.4 | 18+-onderdelen onzichtbaar voor `16_17` en op elk scherm vóór de leeftijdscheck; aanwezigheid standaard uit voor `16_17` | Geen 18+-element in de DOM voor `16_17`; geen tekst over trekkingen of 18+-prijzen op een scherm dat `16_17` kan zien |

---

## 2. Informatiearchitectuur en navigatie

### 2.1 Structuur

Rewarded is een mobile-first Progressive Web App die ook op de laptop werkt (businessplan §10). De structuur heeft drie lagen. De studentenapp met vijf tabs is voor iedereen. Het bestuursdashboard is een aparte omgeving onder `/bestuur`, alleen voor bestuursaccounts en ontworpen voor laptopbreedte, omdat bestuursleden het in vergaderingen en bij het maken van posts gebruiken. De beheeromgeving van Rewarded valt buiten dit document: die is functioneel en intern (spec 4.11), en krijgt het designsysteem zonder eigen schermontwerp. Wel legt dit document de gebruikerscopy vast die bij een besluit uit de beheeromgeving hoort (§6.2).

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

**Onderste tabbalk (telefoon).** Vijf items met icoon en label, altijd beide; hoogte 64 px plus de veilige zone van het toestel. Het actieve item krijgt de merkkleur, een gevulde variant van het icoon en een balkje van 3 px boven het icoon, zodat de status niet alleen van kleur afhangt (WCAG 1.4.1). In de code is de tabbalk een `nav` met links, en het actieve item draagt `aria-current="page"`. Badges zijn spaarzaam: alleen een stip op Squad als iemand je uitnodigde voor een duel of als er een Belofte-reflectie klaarstaat. Geen rode tellers.

**Laptop (vanaf 960 px).** Dezelfde vijf items verticaal in een zijbalk links van 232 px, met de inhoud in een kolom van maximaal 720 px breed. F1 zet de dagdoelring en de duurkeuze naast elkaar in plaats van onder elkaar; de squadstrook wordt een kolom rechts van de inhoud (alleen boven 1200 px; daaronder blijft hij een strook). Bottom sheets worden gecentreerde panelen van 480 px. Het sessiescherm toont een rustige variant met de tekst "Laat dit tabblad open in een zichtbaar venster. Je telefoon leg je zelf weg." in plaats van de omdraai-instructie (rapport 04 §2, laptopmodus), en het eindsignaal is daar alleen de toon plus een titelwijziging van het tabblad ("Sessie klaar · Rewarded"). Een mockup van de laptopvariant staat in de prioriteitenlijst (§3.0).

**Sessiemodus.** Zodra een sessie loopt, verdwijnen tabbalk en zijbalk. Het enige uitgangspunt is Stoppen. Dat voorkomt dat iemand per ongeluk naar een ander scherm tikt en het voorkomt ook de vraag "telt het als ik even naar mijn squad kijk?": de squad staat in het sessiescherm zelf.

**Bottom sheets en modalen.** Een bottom sheet voor keuzes die bij het huidige scherm horen (uitnodigen, verzilveren, "Klopt dit niet?", herinnering kiezen). Een modaal alleen voor een bevestiging met gevolgen (stoppen met een sessie, account verwijderen). Nooit een modaal dat vanzelf opent om iets te verkopen.

**Diepe links.** Drie soorten links komen van buiten en hebben elk een eigen landingsscherm: `/i/{invite}` voor squad- en duelinvites (O1 met de uitnodiger bovenaan), `/c/{code}` voor verenigingscodes en QR's (O1 met de vereniging bovenaan, of V2 als je al een account hebt), en `/v/{token}` voor de publieke verificatiepagina van een kaart (K2). In de gesloten pilot geeft alleen een uitnodiging toegang (spec 3.1). De uitnodiging hangt aan de aanvraag van de magic link op de server (rapport 07, tabel `auth_magic_link` met `invite_token`), niet aan de opslag van de browser. Opent de link uit de mail in een andere browser of in de Home Screen-app, dan weet de server nog steeds bij welke squad de student hoort (§4.1).

### 2.3 Plaatsing van inhoud

| Inhoud | Plek | Niet op |
|---|---|---|
| Sessiestart | F1, bovenaan, één primaire knop | — |
| Live aanwezigheid squad | F1 (strook), F3 (sessie), Q1 (volledig) | V1, kaarten |
| Wat de squad van je ziet | O1 bij een squadlink, Q2 vóór [Maak squad], P1 bij stille modus | — |
| Squadstreak en jokerstatus | F1, Q1, F5 | Ranglijst, kaarten (alleen streak) |
| Belofte | Q1 (eigen regel en per getuige), Q5, Q6, Q7 | F5, kaarten, Beloningen |
| Punten en inverdienvoortgang | B1; F5 na competentie en squad | F3, F1 (behalve de Bonusregel), kaarten |
| Bonusregel van de arm | F1 direct onder de startknop; F5 als laatste regel van het puntenblok; B7 uitleg | F3, Q1, kaarten, mails |
| Verenigingsranglijst | V1 | F1 (alleen positie in één regel) |
| Verdiende prijzen | V1 (collectief), V3 (individueel) | Kaarten |
| Verlote prijzen | B5, onder de catalogus, alleen `18_plus` en vlag aan | O1–O10, home, kaarten, uitnodigingen, mails, promotiekit (spec 4.7) |
| Duelbadge | Q4 na afloop, P1 onder "Badges" (alleen voor jezelf zichtbaar) | Kaarten, Q1, ranglijsten |
| Referral | R1, B1 (saldoregel), B2 (verdeling) | Kaarten, uitnodigingstekst van Q3 |
| Herinneringen | P5, O10 [Later vandaag], één voorstel op F1 na de eerste sessie | F3, F5 |
| "Hoe we tellen" | F9, link vanuit F2, F3-voorbereiding, F6, O2, O8, P1 | — |
| Alle voorwaarden | P3, link vanuit O6, B1, B5 | — |

---

## 3. Scherminventaris

### 3.0 Prioriteit van de schermen

De inventaris telt ongeveer vijftig schermen. Niet elk scherm is even belangrijk voor de pilot. De volgorde hieronder volgt wat de go/no-go-maten (businessplan §6) en de rechtsbescherming (spec 4.11, 6.4, 6.5) dragen. Wat in de eerste rij staat, is in versie 1.1 van de mockups uitgewerkt.

| Prioriteit | Schermen | Status mockup | Waarom deze volgorde |
|---|---|---|---|
| 1 (gereed in v1.1) | O1, O5, O6, F1 arm A en B, F3 met eindscherm, F5 arm A en B, F6, F7, F8, Q1, Q5, Q6, V1, B1/B2, B5, K1, D2 | Gereed | Activatie, gemarkeerde sessies, H-A en H-B, akkoord van 16–17-jarigen, beroep |
| 2 (vóór 25 november) | O4 met code, O8, O10 met [Later vandaag], F2 met eindsignaal en terugvalinstructie, F9, Q7, P5 met mailcopy, B3, B4, laptopvariant van F1, F3 en F5 | Te maken door de ontwerper | Activatie via mail en webviews, herinneringen (spec 8, Should R1), iOS-test |
| 3 (vóór R2) | Q4 met duelbadge, P1–P4, K2 | Te maken | Duels en kaarten zijn R2 |
| 4 (vóór R3) | R1, V3, D3–D5, rustperiode in B7, F1 en F5 met de uitweg, P6 | Te maken | Referral, prestatiechallenge en rustperiode-arm zijn R3 |
| 1b (vóór 25 november, na ronde 1) | O5a, O6 met onderzoeksuitleg, O6b, F1 met weekprestatie, tentamendag en squadprompt, F5 met punten onderaan, F10, H1, Q4 op dagdoelen, Q8, V1 met ledental, B8 | Deels in de mockups v1.2 (F1, F5, O6, V1, F10 op plek 18, Belofte-aanbod); de rest te maken | Deelnemersbescherming en de experimentarmen moeten vanaf 2 december werken |

### 3.1 Gemeenschappelijke toestanden en regels

Elk scherm heeft dezelfde vijf toestanden, met een vast patroon zodat de bouwers ze niet per scherm hoeven te ontwerpen. Per scherm hieronder staat alleen wat afwijkt.

| Toestand | Patroon | Copyvoorbeeld |
|---|---|---|
| Leeg | Illustratieloze lege kaart met één zin wat hier komt en één actie | "Nog geen squad. Squads houden het beter vol." [Squad maken] |
| Laden | Skeletblokken in de vorm van de inhoud; geen draaiende loader langer dan 1 s zichtbaar; geen geanimeerde glans bij reduced motion | — |
| Fout | Inline melding boven de inhoud met wat er misging en wat je kunt doen; laatst bekende gegevens blijven staan | "Dit konden we niet ophalen. Je gegevens zijn veilig. [Opnieuw]" |
| Sessie afgebroken | Banner bovenaan F1 bij terugkeer, tot de gebruiker F6 opent of wegtikt; op elk ander scherm dezelfde banner | "Je sessie stopte om 14:32. [Bekijk waarom]" |
| Offline, buiten een sessie | Grijze strook onder de statusbalk; acties die de server nodig hebben zijn uitgeschakeld met reden. De strook belooft niets over sessies | "Geen verbinding. Wat de server nodig heeft, staat even uit." |

**Offline tijdens een sessie.** Tijdens een sessie is een kort netwerkgat normaal (bibliotheekwifi), en de client buffert zichtbaarheid en heartbeats (spec 4.1). Het sessiescherm toont dan geen alarm, alleen een klein icoon in de hoek. Pas als het gat de grens van 90 seconden passeert, verschijnt een rustige regel: "Geen verbinding. Blijf op dit scherm. Is de verbinding langer dan 5 minuten weg, dan stopt de sessie op het laatste moment dat we je zagen." Die zin is waar voor elke uitkomst uit de gatregels van spec 4.1: een gedekt gat tot 5 minuten telt, een gat van meer dan 5 minuten breekt de sessie af op de laatste geldige heartbeat (`heartbeat_gap`). De beslissing valt op de server, en de uitkomst komt bij terugkeer in F5 of F6. Dezelfde grens staat vooraf in O8 en F9, zodat de student haar niet pas achteraf ontdekt (principe P4).

**Dagrand.** Een dag loopt van 04:00 tot 04:00 (spec 4.2, **aanname** in de spec). Tussen 00:00 en 04:00 zegt F1 boven de dagdoelring: "Je dag loopt tot 04:00. Deze sessie telt voor dinsdag." De dagnaam is die van de startdag. Dezelfde zin staat in F9 en bij het dagdoel in P1.

**Squadnoemer.** Overal waar een aantal squadleden wordt genoemd ("2 van 3 focussen nu", "2 van 3 haalden hun dagdoel"), is de noemer het aantal actieve leden volgens spec 4.4. Leden op pauze tellen niet mee en staan apart onder "Op pauze". Een lid in stille modus telt wel mee in de noemer, maar niet in "focussen nu", omdat zijn status verborgen is.

### 3.2 Onboarding

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| O1 | Welkom | Binnenkomst via link; vertrouwen en belofte | Uitnodiger of vereniging bovenaan; kernbelofte; eerlijke claim; één regel beloning ("Na vijf uur focus kun je punten inwisselen bij partners. Geen geld."); bij een squadlink de zichtbaarheidsregel (§6.2); 16+ | [Doe mee], "Hoe telt Rewarded?" | Desktop: kop "Focus samen met je squad." met de laptopregel uit §2.2 in plaats van "Telefoon weg"; verlopen of volle link: "Deze uitnodiging is niet meer geldig. Vraag [naam] om een nieuwe."; geen link in de pilot: wachtlijst; geopend in een in-app browser (Instagram, WhatsApp): de flow werkt daar, met onder de knop "Liever in je eigen browser? Open de link daar; je uitnodiging blijft staan." | `invite_link_opened` (server) |
| O2 | Hoe we tellen (kort) | Eerlijke claim vooraf | Letterlijke claim uit spec 3.1 stap 3; telefoonmodus en laptopmodus in twee regels | [Begrepen] | — | — |
| O3 | E-mail | Account zonder wachtwoord | E-mail, voornaam, achternaam optioneel | [Stuur link] | Fout adres inline; te vaak: "Probeer het over een minuut opnieuw." | — |
| O4 | Check je mail | Magic link of code | Adres; "Tik op de link in de mail, of typ hier de code van 6 cijfers uit dezelfde mail"; één invoerveld met `inputmode="numeric"` en `autocomplete="one-time-code"`; geldigheid 15 minuten (rapport 07); opnieuw versturen na 30 s | [Ga verder] (met code), [Opnieuw sturen], [Ander adres] | Link of code verlopen: terug naar O3 met uitleg; code fout: "Deze code klopt niet. Controleer de mail of vraag een nieuwe." (geen telling van pogingen in beeld; de server begrenst) | — |
| O5 | Leeftijdscheck | Leeftijdsklasse bepalen | Geboortedatum (dag, maand, jaar als drie velden met numeriek toetsenbord); "Rewarded is er vanaf 16 jaar. We vragen je geboortedatum om te bepalen welke onderdelen je ziet."; privacyregel: "We bewaren of je 16–17 of 18+ bent. Ben je jonger dan 18, dan bewaren we ook de dag waarop je 18 wordt, zodat je dan automatisch overstapt." | [Verder] | Datum onder 16: eerst een bevestiging "Volgens deze datum ben je 15. Klopt dat?" [Ja, dat klopt] [Datum aanpassen]; na bevestiging O5b "Rewarded is er vanaf 16 jaar", niets opgeslagen, geen terugknop naar een ander jaar binnen de sessie | — |
| O5a | Wat je squad ziet (alleen `16_17`) | Privacy standaard voor minderjarigen | "Je squad ziet standaard niet wanneer jij focust. Wil je dat wel, zet het hier aan. Je kunt het altijd veranderen in Ik." | Schakelaar "Laat mijn squad zien wanneer ik focus" (standaard uit), [Verder] | — | `compare_optin_changed` (stille modus) |
| O6 | Onderzoek, voorwaarden en privacy | Geïnformeerde deelname en akkoord | Eerst de onderzoeksuitleg in gewone taal (§6.2): de pilot vergelijkt door loting twee bonusregels die evenveel opleveren, twee momenten voor de Belofte, een uitnodiging om een squad te vormen en, onder voorbehoud, een rustperiode zonder nieuwe punten vanaf het einde van de tentamenweken van je instelling tot en met de tentamenperiode van april (die ook in tentamenweken kan vallen); de doelbonus stopt aan het einde van je laatste tentamenweek, met de datum erbij; vanaf de dag dat je je groep hoort, hoort die groep bij jou, ook als je van squad wisselt; de catalogus is schaars; uit de rustperiode stappen kan altijd en houdt je in het onderzoek; afmelden voor het onderzoek kan altijd in Ik, zonder verlies van punten; stoppen en verwijderen kan altijd. Daarna welke signalen we loggen; links naar P3 en privacyverklaring. Dezelfde tekst voor `16_17` en `18_plus`, met voor `16_17` één regel: "Jij krijgt altijd de gewone bonusregel en blijft punten verdienen, ook in een squad die een tijd geen punten verdient." | Twee aparte, niet vooraf aangevinkte vinkjes (voorwaarden; privacyverklaring); [Akkoord] pas actief als beide aan staan, met de reden ernaast | — | `account_created`, `experiment_assigned` |
| O6b | Korte vragenlijst | Welzijn en uitgangspunt meten (spec 7.4) | Eén scherm met de items van de onderzoeker (stress, slaap, ervaren squaddruk, intrinsieke motivatie), studietijd en telefoonafleiding, en "Gebruik je Forest of Opal, of deed je dat eerder? Waarom probeer je Rewarded?"; "Overslaan kan. Er hangen geen punten aan." | [Verder], [Overslaan] | — | `survey_answered`, `survey_skipped` |
| O7 | Dagdoel | Zelfgekozen doel | 25 / 50 / 90 / 120, standaard 25; "Begin liever klein" bij 90 of 120 | Keuze, [Verder] | Bevestigingssheet bij 90/120 (overmoedrem, spec 4.4) | `daily_goal_set` |
| O8 | Niet storen | Afbreken voorkomen | Waarom: een gesprek of een geopende melding stopt de sessie; korte instructie per platform; één regel over verbinding: "Valt de verbinding langer dan 5 minuten weg, dan stopt je sessie." | [Ik zet het aan], [Later] | — | — |
| O9 | Oefensessie | Laten voelen wat afbreken is | Eén minuut; "Start, en ga dan even naar een andere app." Daarna de uitleg zoals in F6, met de opmerking dat oefenen nergens meetelt. De oefensessie speelt het eindsignaal af, zodat de student het kent | [Start oefening], [Overslaan] | Gebruiker gaat niet weg: "Goed volgehouden. Zo klinkt en voelt het einde van een sessie." | `practice_completed` |
| O10 | Eerste sessie | Activatie | Squad erboven als via squadlink; "Start je eerste sessie van 25 minuten." | [Start] → F2, [Later vandaag] → sheet met tijdkeuze voor één herinnering | Gekozen tijd ligt na 04:00 de volgende ochtend: niet aangeboden (alleen tijden binnen de huidige dag) | `reminder_scheduled` (voorstel aan de spec) |

O5 noemt geen 18+-prijzen (principe P10). De controle van de leeftijd bij 18+-prijzen (zonder kopie van een identiteitsbewijs) staat alleen in V3 bij een prestatiechallenge waarvan de financier 18+ eist (spec 4.7); zo'n challenge is alleen zichtbaar voor `18_plus`.

### 3.3 Focus

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| F1 | Home | Sessie starten | Dagdoelring (minuten vandaag van doel) met daaronder de weekprestatie ("Deze week: 3 van de 7 dagen"); squadstrook met live aanwezigheid ("2 van 3 focussen nu"); jokerstatus in één regel; tekstlink "Vandaag heb ik een tentamen"; duurkeuze 25/50/90; primaire knop; direct daaronder de Bonusregel (§5.5); squadstreak; één regel verenigingspositie | [Start focussessie], duurkeuze, tik op squadstrook → Q1, "Vandaag heb ik een tentamen" → F10 | Leeg (geen squad): strook wordt "Focus samen: maak een squad"; sterke squadprompt (dag 1–3, alleen in die arm): kaart bovenaan met kant-en-klare link (§4.4); schadesignaal: rustige kaart H1 bovenaan; vragenlijst open: kaart S1 onder de Bonusregel; tussen 01:00 en 04:00 de nachtregel ("Een sessie nu telt, maar zonder doelbonus."); tussen 00:00 en 04:00 de dagrandregel; na de eerste voltooide sessie één keer een voorstel voor een herinnering (§4.9); Belofte-aanbod als kaart onder de Bonusregel; modus zonder punten: geen Bonusregel | `presence_viewed` |
| F2 | Voorbereiden | Klaar voor de sessie | Eenmalige checklist (scherm omlaag, liefst aan de lader; laptop: tabblad zichtbaar); gekozen duur; regel "Aan het einde hoor je een zachte toon" met schakelaar | [Begin] (ontgrendelt de audio), "Hoe we tellen" | Wake Lock niet beschikbaar: waarschuwing uit spec 3.2 stap 3 vóór de start; tweede sessie actief elders: "Je hebt een sessie op een ander toestel. Starten stopt die."; terugvalinstructie per toesteltype (§4.2) als de vlag daarvoor aan staat | `session_started`, `wakelock_state` |
| F3 | Sessie lopend | Rustig volhouden | Donker; resterende tijd groot; voortgangsring dun; "Leg je telefoon omgekeerd neer"; squadleden die nu focussen (avatars, max. 6); kleine Wake Lock-status | [Stoppen] (één tik opent F4; lang indrukken is een snelkoppeling) | Wake Lock vrijgegeven: rustige regel "Je scherm kan uitgaan. Tik om aan te houden."; offline: icoon, na 90 s de regel uit §3.1; laptop: andere instructie; einde: eindscherm (zie onder) | `wakelock_state`, `heartbeat_gap`, `visibility_hidden` |
| F3e | Eindscherm | Merken dat de sessie klaar is | Volledig wit vlak met donkere tekst "Sessie klaar." en "Draai je telefoon om."; zachte toon als die aan staat; op Android ook een korte trilling als het toestel dat ondersteunt en de toon aan staat | Elke aanraking of terugkeer naar zichtbaar → F5 | Toon uit: alleen het witte vlak; Wake Lock houdt het scherm na het einde nog 10 minuten aan (werkhypothese), daarna mag het scherm uit; laptop: toon en tabbladtitel | `session_completed` met `signal_played` (voorstel aan de spec) |
| F4 | Stoppen? | Bevestiging | "Stoppen? De minuten tot nu leveren geen punten op. Je squadstreak breekt hier niet door." | [Doorgaan] (primair), [Stoppen] (secundair) | — | `session_aborted` (reden `user_stop`) |
| F5 | Sessie voltooid | Dagdoel, squad, dan pas punten | 1. Dagdoel en weekprestatie ("50 minuten. Je dagdoel is gehaald. Deze week 4 van de 7 dagen."), met daaronder alleen bij een stijging de competentiefeedback ("Je focusduur steeg van 25 naar 40 minuten."; Should, spec 4.14); 2. Squad: wie er ook zat, streakstatus, "Squaddag: 2 van 3 actieve leden"; 3. "+50 punten" klein in `body-s`, inverdienvoortgang; 4. Bonusregel als laatste regel van het puntenblok; 5. "Maak een kaart" als tekstlink onderaan | [Nog een sessie], [Klaar], "Maak een kaart" | Gemarkeerd: punten als "Wordt nagekeken" met reden en "meestal binnen 3 werkdagen", geen kaartlink; puntenplafond bereikt: "Je zit op 5 uur vandaag. Meer focus telt voor je dagdoel, maar levert vandaag geen punten meer op. Rust telt ook."; sessie gestart tussen 01:00 en 04:00: "Het is laat. Deze sessie telt, maar zonder doelbonus. Slaap telt ook."; rustperiode-arm, vanaf de bonusstop tot en met het aprilvenster van je instelling: blok 3 wordt "Je squad verdient tot en met [einde aprilvenster] geen nieuwe punten. Je dagdoel en je streak tellen gewoon."; modus zonder punten: blok 3 en 4 vervallen, de rest blijft gelijk | `session_completed`, `daily_goal_met`, `goal_bonus_booked` |
| F6 | Sessie afgebroken | Uitleg en weg terug | Tijdstip, duur volgehouden, reden per code (§6.2), waarom geen punten, streakstatus | [Opnieuw beginnen], [Kortere sessie] (na 50/90), "Klopt dit niet?" | Derde afbreking vandaag: voorstel kortere sessie en Niet storen; `heartbeat_gap` en `late_end`: "Klopt dit niet?" als secundaire knop in plaats van tekstlink | `session_aborted`, `return_after_abort`, `abort_recovery` |
| F7 | Klopt dit niet? | Melding naar de wachtrij, met een eerlijke verwachting | Sheet afhankelijk van de afbreekcode (§4.3 en §6.2): bij `hidden`, `user_stop` en `second_session` de uitleg dat dit niet terug te draaien is en waarvoor de melding wel dient; bij `heartbeat_gap` en `late_end` de belofte "Een mens kijkt of we je sessie kunnen herstellen, meestal binnen 3 werkdagen."; keuzelijst passend bij de code en een optioneel tekstveld | [Versturen] | Verstuurd: toast "Je melding is binnen. Je ziet de status bij Ik, Meldingen."; al gemeld: status in plaats van formulier | `abort_report_submitted` |
| F8 | Sessiedetail | Status van één sessie | Datum, start en einde, status, reden, besluit met de reden in gewone taal (§6.2, redencodes), wie besliste (rol, geen naam), beroep binnen 14 dagen met de einddatum erbij | [Beroep instellen] | Afgekeurd: reden in gewone taal en beroepsknop; beroep loopt: "Een andere beoordelaar kijkt ernaar, uiterlijk [datum]."; beroep beslist: uitkomst met motivering; na 14 dagen: "De termijn voor beroep is voorbij." | `appeal_submitted` |
| F10 | Tentamendag | Dagdoel opschorten zonder joker (spec 3.13) | Sheet: "Tentamen vandaag? Dan telt je dagdoel vandaag niet mee. Je streak breekt niet en je joker blijft over." ; welke dag (vandaag of later deze week); hoeveel tentamendagen je deze week nog hebt (max. 3) | [Zet aan], [Annuleer] | Maximum bereikt: "Je hebt deze week al 3 tentamendagen. Succes met de rest." ; arm B: geen "−20"-melding op een tentamendag | `exam_day_set` |
| F11 | Herhaalbericht rustperiode | De uitweg één keer herhalen aan het begin van het aprilvenster (spec 3.16 stap 6; jurist should-fix 4 na ronde 3) | Kaart bovenaan F1 op de eerste dag van het aprilvenster van je kalender, alleen in de rustgroep en alleen als je niet al uitstapte; dezelfde tekst als het rustperiodebericht in B7 (§6.2) | [Ik wil weer punten verdienen] → P6, [Sluiten] | Eén keer; na sluiten niet opnieuw; geen mail of melding | `rest_period_notice_shown` (moment april) |
| H1 | Hulpkaart | Schadesignaal (spec 3.15) | Rustige kaart, geen pop-up: "Je hebt de laatste tijd veel en laat gefocust. Goed bezig is ook goed slapen. Wil je met iemand praten?"; link naar de hulpbronnen van je eigen instelling | [Hulp bij jouw instelling], [Sluiten] | Hoogstens één keer per signaal per 14 dagen; niemand anders ziet de kaart | `harm_card_viewed`, `harm_help_opened` |
| S1 | Vragenlijst | Pilotreflectie en eind januari (spec 3.14) | Zelfde vorm als O6b; bij de reflectie de vraag "Hoe voelde de bonusregel die je had?"; eind januari studietijd en telefoonafleiding | [Verstuur], [Overslaan] | — | `survey_answered`, `survey_skipped` |
| F9 | Hoe we tellen | Volledige uitleg | Eerlijke claim; regels uit spec 4.1 in gewone taal, inclusief de grens van 5 minuten zonder verbinding en de dagrand om 04:00; afbreekcodes; wat we niet zien; wat "Klopt dit niet?" wel en niet kan herstellen; oefensessie | [Oefen een minuut] | — | `practice_completed` |

### 3.4 Squad

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| Q1 | Squad-overzicht | Doen de anderen mee? | Squadnaam, streak; vandaag: "2 van 3 actieve leden haalden hun dagdoel" en of de squaddag geslaagd is (minstens de helft van de actieve leden, naar boven afgerond, min. 2); leden met status: focust nu (nog x min), dagdoel gehaald, joker ingezet, nog niet, stille modus; per lid met een Belofte en de squad als getuige de regel "Belofte: 3 van 5 dagen deze week"; daaronder apart "Op pauze" met de gepauzeerde leden; jokerstatus van jezelf; optioneel minuten bij wie vergelijken aanzette | [Nodig uit] (alleen op toegestane momenten), [Daag uit voor duel], tik op lid → Q7 als dat lid een Belofte heeft | In opbouw (1–2 leden): "Nog 2 vrienden nodig", geen streak; streak bevroren door pauzes: "Jullie zijn met minder dan 3 actieve leden. De streak staat stil tot er weer 3 zijn."; vakantiepauze: "De streak staat stil tot 4 januari."; streak net gebroken: "Pak je streak terug met twee dagen op rij." met twee lege stippen; 7 dagen minder dan 2 actieven: kaart → Q8; bij de squadnaam het menu "Naam melden" | `presence_viewed`, `squad_day_evaluated` (server), `streak_recovered`, `squad_name_reported` |
| Q2 | Squad maken | Squad starten | "Focus samen. Squads houden het beter vol."; naam (gemodereerd); vereniging optioneel; vlak boven de knop de zichtbaarheidsregel (§6.2) | [Maak squad] | Naam afgekeurd: "Kies een andere naam." | `squad_created`, `experiment_assigned` |
| Q3 | Uitnodigen | Link delen | Sheet met voorgestelde tekst (rapport 04 §9, zonder punten of prijzen); geldigheid 7 dagen, max. 5; preview van de link | [Deel via WhatsApp] (Web Share API), [Kopieer link] | Web Share niet beschikbaar: alleen kopiëren; geen vrije plek: knop niet zichtbaar | `invite_created`, `invite_share_opened` |
| Q4 | Duel | Uitdagen en volgen | Tegenstander, 7 dagen, per dag een stip "dagdoel gehaald" voor beiden en het aantal gehaalde dagen ("Jij 4, Sam 3"); geen minuten; "Wie de meeste dagen zijn dagdoel haalt, wint. Er staan geen punten op het spel."; na afloop de duelbadge (§5.6) bij de winnaar, "Gelijkspel" bij gelijke stand | [Daag uit], [Accepteer], [Revanche] | Wacht op acceptatie (48 u); gemarkeerde sessie: "Uitslag volgt na de controle."; `16_17` of tegenstander `16_17`: alleen squadleden als tegenstander, geen duellink (founder JS3) | `duel_created`, `duel_accepted`, `duel_finished`, `invite_created` |
| Q5 | Belofte maken | Zelfgekozen commitment | Aanbod (arm vroeg: bij de aangekondigde stop van de doelbonus, zeven dagen vóór de bonusstop van je instelling, en nog één keer een week vóór de tentamenperiode van april; arm laat: na de tentamenperiode van april); keuzes dagen per week (3–7), minuten per dag (25/50/90/120), getuigen (de squad of niemand); voorstel op basis van wat je de afgelopen 14 dagen echt deed; uitleg wat getuigen zien; "Er hangen geen punten aan." | [Beloof het], [Niet nu] | Geen squad: getuigen alleen "niemand"; lopend: dagen gehaald en stoppen met één tik | `belofte_offered`, `belofte_made`, `belofte_stopped` |
| Q6 | Belofte-reflectie | Afronden | "Je haalde je Belofte op 9 van 12 dagen."; per dag een rustige rij van stippen (gehaald / niet gehaald / vakantiepauze), zonder rood; 18+: één vrijblijvende vraag over inzet voor een goed doel, met "Weet ik niet" als gelijkwaardige keuze | [Verlengen], [Aanpassen], [Stoppen] | Gemarkeerde sessie nog in behandeling: dag als "voorlopig gehaald" | `belofte_reflection` |
| Q8 | Squad opnieuw samenstellen | Een dode squad een route geven (spec 3.5 stap 7) | Alleen binnen een tentamenperiode van je instelling: "Jullie squad is een week stil. Wil je hem nieuw leven inblazen?"; nieuwe uitnodigingslink; of samenvoegen met een andere squad van je vereniging die ook stil is, daar zelf om vroeg en in dezelfde rustperiodegroep zit (de app toont alleen die squads) | [Nodig opnieuw uit], [Samenvoegen], [Laat zo] | Geen squad om mee samen te voegen: alleen opnieuw uitnodigen; buiten de tentamenperiodes verschijnt Q8 niet (een stille squad na de tentamens is normaal, founder G-S6) | `squad_regroup_offered`, `squad_merged` |
| Q9 | Aansluiten bij een squad in de rustperiode | Vooraf weten wat aansluiten voor je punten betekent (spec 3.16 stap 4 en 5; G-S2 en jurist should-fix 3 na ronde 3) | Sheet vóór de bevestiging, met een van drie teksten uit §6.2: uitbreidingscohort of `16_17` ("Jij verdient gewoon punten"), deelnemer uit de doorlopende groep ("Jij houdt je eigen groep"), of deelnemer uit de rustgroep die overstapt naar een squad die punten verdient ("Dat telt als 'Ik wil weer punten verdienen'") | [Doe mee] of [Overstappen], [Annuleer] | Vóór T − 6 neemt een deelnemer de groep van de squad over; dan de gewone uitleg uit B7 | `squad_joined`, bij overstap `rest_period_exit` (bron `squad_switch`) |
| Q7 | Belofte van een squadlid | Getuige zijn | Sheet: "Mila beloofde 5 dagen per week 50 minuten, tot 18 december."; de dagen tot nu als stippen; geen minuten, geen punten | [Sluiten] | Belofte gestopt: "Mila heeft haar Belofte gestopt." zonder datum van falen of oordeel; Belofte afgerond: "Mila rondde haar Belofte af." | `belofte_witness_viewed` (voorstel aan de spec) |

**Rustdag-joker.** Elk lid heeft één joker per week, die automatisch wordt ingezet bij het eerste gemiste dagdoel en alleen de streak beschermt (spec 4.4). Een herstelmogelijkheid werkt alleen als de gebruiker ervan weet (Silverman en Barasch 2023, rapport 08 §4). Daarom staat de status op F1 en Q1 in één regel ("Joker deze week: nog over" of "Joker ingezet voor dinsdag. Je telde mee voor de squaddag."), en de eerste keer dat de app opent na een dag waarop de joker is ingezet, verschijnt een rustige toast (§6.2). Op Q1 staat bij een lid met een ingezette joker de chip "Joker" in neutraal grijs, nooit in amber of rood. De joker beschermt de doelbonus niet (spec 5); dat staat in de toast en in B7, niet op F1.

**Belofte en getuigen.** De Belofte maakt de centrale pilothypothese H-B meetbaar (spec 3.12, 7.3). Haar mechanisme is sociaal: de getuigen zien de Belofte en per dag of ze gehaald is (spec 3.12 stap 3). Zonder zichtbaarheid zijn er geen sociale kosten en meet de pilot iets anders dan H-B. Q1 toont daarom per lid met een Belofte één regel, en Q7 de dagen. Wat getuigen zien, staat vooraf in Q5 bij de keuze "getuigen". De weergave is feitelijk en zonder ranglijst: geen vergelijking tussen Beloftes, geen minuten, geen kleur die falen benadrukt.

**Duel en badge.** Het duel is een uitnodigingsmoment en competitie in klein verband (spec 4.5; Patel e.a. 2019). Na ronde 1 wint wie de meeste dagen zijn dagdoel haalt, niet wie de meeste minuten maakt (founder GS4), en een duel met een niet-squadlid kan alleen tussen 18-plussers (founder JS3). Voor `16_17` opent [Daag uit voor duel] een keuze uit squadleden en bestaat de duellink naar buiten niet. De winnaar krijgt een badge (spec 3.6). Die staat in Q4 bij de uitslag en in P1 onder "Badges", met de zin "Alleen jij ziet je badges." Hij staat niet op kaarten (spec 4.8 noemt hem niet onder de velden), niet in Q1 en niet bij een ranglijst.

### 3.5 Vereniging

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| V1 | Verenigingschallenge | Hoe staan we ervoor? | Periode (aanloopklassement zonder prijs, of prijsperiode); poule; ranglijst van verenigingen op deelnamegraad, met naast elke vereniging het ledental en de soort bron ("312 leden · opgave aan de instelling"), intensiteit als tweede cijfer; eigen vereniging gemarkeerd; afstand tot drempelprijs; hoofd- en drempelprijs, elk met financier en "Verdiend" | Tik op prijs → voorwaarden; "Hoe rekenen we?" (met de regel dat in de prijsweken alleen leden met een bevestigd instellingsmailadres of mobiel nummer meetellen); [Bevestig je instellingsmail] als de student nog geen anker heeft | Geen vereniging: leeg met [Code invoeren]; onder 15 leden: "Jullie stand verschijnt vanaf 15 gekoppelde leden."; vereniging zonder externe ledentalbron: "Doet mee om de eer, niet om de hoofdprijs."; stand voorlopig tot fraudecontrole en steekproef: label "Voorlopig" | `leaderboard_viewed` |
| V2 | Lid worden | Koppelen aan vereniging | Code invoeren of QR scannen; welke vereniging; "Je vereniging ziet alleen groepscijfers, nooit jouw uren." | [Koppel] | Codeplafond bereikt: "Je koppeling wordt even nagekeken." | `vereniging_joined`, `code_cap_reached` |
| V3 | Prestatiechallenge | Individuele verdiende prijs | Prestatie (bijv. elke dag van de tentamenweek 120 minuten), plaatsen, financier, voortgang per dag, "Verdiend. Winnaars controleren we vóór uitreiking." | [Schrijf je in] | Vol: "Alle plaatsen zijn vergeven." Afgerond: status verificatie en levering, of reden en beroep; financier eist 18+: alleen zichtbaar voor `18_plus`, met de uitleg over de leeftijdscontrole bij winnaars | `challenge_enrolled`, `prize_awarded` |

### 3.6 Beloningen

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| B1 | Saldo en catalogus | Wat kan ik ermee? | Saldo met "Beschikbaar" groot en daaronder apart: "Weekbudget (nog niet veilig)" (alleen arm B), "Wordt nagekeken" (gemarkeerde sessies), "Referral, nog niet vrij" (alleen als de referralvlag aan staat); inverdienvoortgang; disclaimer uit spec 3.4 stap 2; bovenaan de voorraad van deze week naast het aantal studenten dat mag verzilveren ("Deze week 40 beloningen voor 120 studenten die mogen verzilveren"); items met puntenprijs, financier, voorraad deze week | Tik op item → B2; "Waarom zie ik dit?" bij het weekbudget → B7; tik op "Wordt nagekeken" → lijst van sessies → F8 | Voor 300 minuten: alle Verzilveren-knoppen uit met resterende tijd; weekplafond: "Maandag kun je weer verzilveren."; voorraad nul: "Deze week op." of, alleen als de weekvrijgave al gedekt in de beheeromgeving staat, "Vandaag op. Morgen komt er weer een deel bij." (vrijgave gespreid over de week); wachttijd na de inverdienperiode: "Je eerste verzilvering kan vanaf [datum]. We kijken kort mee, zoals bij iedereen."; geen gedekt budget: "De catalogus opent zodra partners hun beloningen hebben vastgelegd."; collectieve en symbolische beloningen (iets met de squad of de vereniging) staan bovenaan; rustperiode-arm: saldo blijft inwisselbaar | `catalog_viewed` |
| B2 | Item en verzilveren | Bewuste keuze | Sheet: item, voorwaarden, financier, punten die afgaan, saldo daarna; als er referralpunten zijn: "300 punten: 200 uit eigen punten, 100 uit referralpunten (hoogstens de helft)" | [Verzilver voor x punten] | Geblokkeerd met copy per reden (§6.2: inverdien, week, maand, voorraad, saldo, dekking); voorraad op tijdens afrekenen: niets afgeschreven | `redemption_completed`, `redemption_blocked` |
| B3 | Telefoon verifiëren | Eenmalige sms bij eerste verzilvering | Waarom (één account per persoon), wat we bewaren (gehasht nummer en dat het een mobiel nummer is) | [Stuur code], code-invoer met `autocomplete="one-time-code"` | Nummer al in gebruik: neutrale uitleg en meldroute; geen mobiel nummer: "Dit nummer kunnen we niet gebruiken. Gebruik het nummer van je eigen mobiele telefoon." | — |
| B4 | Voucher | Code gebruiken | Code, geldigheid, hoe gebruiken; ook per e-mail | [Kopieer], "Werkt niet" | "Werkt niet" → binnen twee werkdagen nieuwe code of punten terug | — |
| B5, B6 | (Vervallen) Trekkingen | — | Trekkingen worden niet gebouwd (founder J4, S9) | — | — | — |
| B7 | Bonusregel | Uitleg arm | Tekst uit spec 5 ("Waarom zie ik dit?"), einde seizoen met de datum van je instelling, dat de joker de doelbonus niet beschermt, dat sessies na 01:00 geen doelbonus opleveren en wat een tentamendag doet; na de bekendmaking (uiterlijk zeven dagen vóór de bonusstop) ook de rustperiode-regel van je squad met de uitweg in dezelfde zin | [Ik wil weer punten verdienen] (rustgroep) → P6 | — | `rest_period_notice_shown` |
| B8 | Plus (nepdeur) | Interesse meten (founder S3) | "Plus komt eraan, €2,99 per maand. Wil je bericht als het zover is?"; één regel dat Plus nu niets doet | [Laat het me weten], [Nee] | — | `plus_interest` |

### 3.7 Kaart, profiel en referral

| ID | Scherm | Doel | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|---|
| K1 | Kaart maken | Opt-in delen | Voorbeeld 9:16 of vierkant; focustijd vast; schakelaars voornaam en streak (standaard aan, spec 4.8), achternaam, instelling, vereniging, squadnaam (als alle leden toestaan); "Delen levert niets op." | [Delen], [Opslaan], formaat | Sessie in afwachting: geen kaart; squadnaam niet toegestaan: schakelaar uit met reden | `card_created`, `card_share_opened` |
| K2 | Verificatiepagina | Publiek bewijs met grenzen | Kaart; tekst uit spec 4.8 met datum en duur, zonder kloktijden (voorstel aan de spec, §6.2); "Focus ook" | [Focus ook] → wachtlijst of registratie | Ingetrokken of afgekeurd: "Deze kaart is niet meer beschikbaar." | `verify_page_viewed` |
| P1 | Ik | Instellingen | Naam, dagdoel (wijziging vanaf morgen; dagrandregel), squad, vereniging; schakelaars minuten vergelijken, stille modus, squadnaam op kaarten, modus zonder punten; "Onderzoek" met twee gescheiden keuzes: in de rustgroep "Ik wil weer punten verdienen" (→ P6; je blijft in het onderzoek) en "Meedoen aan het onderzoek" (afmelden zonder verlies van punten, met bevestiging en de uitleg dat opnieuw aanmelden tijdens de pilot niet kan); instellingsmail bevestigen ("Studeer je aan een hogeschool of universiteit? Bevestig je mailadres van de instelling. We bewaren dat je het bevestigde, het domein en een versleutelde vingerafdruk van het adres, zodat één adres maar één account kan bevestigen. Het adres zelf bewaren we niet."; bij `INSTITUTION_EMAIL_IN_USE`: "Dit adres is al door een ander account bevestigd. Klopt dat niet? Vraag het via Hulp; een mens kijkt ernaar."; vóór 4 januari voor wie het al eerder bevestigde: kaart "Bevestig je instellingsadres nog één keer"); link naar Herinneringen (P5), Meldingen en beroepen (P4), Privacy (P2), Alle voorwaarden (P3); "Badges"; "Plus" (B8) | Bewerken | Doelvoorstel na 7 dagen als kaart; `16_17`: stille modus staat standaard aan; steekproefcontact: kaart "Bevestig je instellingsadres" met code (spec 6.7) | `compare_optin_changed`, `no_points_mode_changed`, `goal_suggestion_shown`, `goal_suggestion_accepted`, `research_opt_out`, `rest_period_exit`, `institution_email_verified`, `institution_email_rejected`, `institution_email_reconfirmed`, `sample_contact_reconfirmed` |
| P6 | Ik wil weer punten verdienen | Uit de rustperiode stappen zonder uit het onderzoek te stappen (spec 3.16 stap 4) | "Vanaf morgen verdien je weer punten. Je blijft in het onderzoek en je squad blijft in haar groep. Terug naar de rustperiode kan daarna niet." Dezelfde bevestiging volgt uit F11 (het herhaalbericht) | [Ik wil weer punten verdienen], [Annuleer] | Na de keuze in B7: "Je verdient weer punten sinds [datum]." | `rest_period_exit` (met bron) |
| P7 | Wekelijkse vraag | Twee items, vanaf de tweede focusweek (spec 3.14) | Kaart op F1 bij de eerste keer openen in de week: "Twee korte vragen over deze week." met de twee items van de onderzoeker: voor 18-plussers stress en ervaren druk; voor `16_17` studietijd en afleiding, zolang de advocaat vraag 9a niet positief heeft beantwoord (spec 3.1 stap 8); "Overslaan" even groot als "Verstuur" | [Verstuur], [Overslaan] | Alleen met welzijnstoestemming; niet in de vakantiepauze; geen punten | `survey_answered`, `survey_skipped` |
| P8 | Korte vragenlijst na het seizoen en na april | Motivatie en niet-beloond studeren meten (spec 3.14, G-S3) | Eén scherm in N en na het aprilvenster, met naast studietijd en afleiding een paar items van de onderzoeker over waarom je focust en één vraag: "Studeerde je deze week ook zonder Rewarded?" [Ja] [Nee] [Weet ik niet]; "Overslaan" even groot als "Verstuur" | [Verstuur], [Overslaan] | Geen punten; dezelfde vragen in beide groepen | `survey_answered`, `survey_skipped` |
| P2 | Privacy en gegevens | Inzage en controle | Wat we loggen, bewaartermijnen, wat we over leeftijd bewaren (zelfde zin als O5), download, verwijderen (met waarschuwing over punten) | [Download], [Verwijder account] | — | — |
| P3 | Alle voorwaarden | Eén pagina | Ratio, puntenplafond van 300 minuten per dag, inverdienperiode en wachttijd, weekplafond, catalogusbeschikbaarheid, seizoen doelbonus, nachtregel, tentamendag, rustperiode (onder voorbehoud), verificatie, challengevoorwaarden | — | — | — |
| P4 | Meldingen en beroepen | Status | Lijst van meldingen en beroepen met status en datum van het verwachte besluit | Tik → F8 | Leeg: "Je hebt niets gemeld." | — |
| P5 | Herinneringen | Zelf kiezen wanneer Rewarded iets stuurt | Schakelaar "Herinnering per e-mail" (standaard uit); tijdkiezer in stappen van 15 minuten; dagen (standaard alle); "Hoogstens één mail per dag, alleen als je dagdoel nog open staat."; voorbeeld van de mail | Schakelaar, tijd, dagen, [Bewaar] | Webpush (spec 8, Could R2): pas na de iOS-test, met dezelfde regels | `reminder_settings_changed` (voorstel aan de spec) |
| R1 | Persoonlijke link (R3, vlag) | Referral uitleggen en volgen | Eigen link; uitleg (§6.2): punten komen pas vrij als je vriend binnen 7 dagen drie sessies van 25 minuten deed, voor jullie allebei, geen geld, delen zelf levert niets op, hoogstens de helft van een beloning uit referralpunten, hoogstens 5 per maand; per genodigde de voortgang ("Joris: 2 van 3 sessies, nog 3 dagen") | [Deel je link], [Kopieer link] | Vlag uit: scherm bestaat niet; vesting verlopen: rij wordt "Niet vrijgekomen" zonder melding (spec 3.11: verval is stil); maximum bereikt: "Deze maand komen er geen referralpunten meer bij. Samen focussen kan gewoon." | `invite_created` (bron personal), `referral_pending_created`, `referral_vested`, `referral_lapsed` |

### 3.8 Bestuursdashboard

Het dashboard is een wervingsinstrument (spec 2) en toont alleen aggregaten, met een cijfer pas bij minstens 5 leden in de groep, zonder namen, lijsten, tijdstippen of export (spec 4.6). Tijd heet hier altijd "focustijd die telde (Rewarded zichtbaar op het scherm)", en bij elk cijfer staat het verificatieniveau als kleine regel ("Niveau 1: Rewarded zichtbaar op het scherm van één browser"); "geverifieerd" en "geverifieerde studie-inzet" staan nergens op het dashboard (founder J3, lintregel). Het ontwerp maakt die grens zichtbaar in plaats van haar te verstoppen: bovenaan staat permanent "Je ziet groepscijfers. Wie wat doet, zie je niet, en wij ook niet zonder reden." De navigatie heeft vijf tabbladen, D1 tot en met D5, gelijk aan spec 4.6. Boven elk tabblad staat een kopregel met de stand (positie en deelnamegraad), zodat het bestuur die niet hoeft te zoeken.

| ID | Tab | Inhoud | Acties | Afwijkende toestanden | Events |
|---|---|---|---|---|---|
| D1 | Stand | Positie in de poule, deelnamegraad, intensiteit, afstand tot de vereniging erboven en tot de drempel, het eigen ledental met bron zoals op de ranglijst; "Voorlopig" tot fraudecontrole en steekproef | — | Onder 15 leden: "Jullie stand verschijnt vanaf 15 gekoppelde leden." | `club_dashboard_viewed` |
| D2 | Werving | Gekoppelde en actieve leden per week (staafjes), aandeel in een squad, aandeel met een bevestigd instellingsmailadres of mobiel nummer, aantal squads, koppelingen per QR-bron; alle aantallen afgerond op een veelvoud van 5, met "afgerond op vijftallen" bij de grafiek | — | Groep onder 5: "Te klein om te tonen" | `club_dashboard_viewed` |
| D3 | Promotiekit | Teksten, storysjabloon, poster met QR per bron, dia, "wat je wel en niet belooft" | [Download] per asset | — | `promo_kit_downloaded` |
| D4 | Prijs | Status hoofd- en drempelprijs, financier, levering, verenigingskaart na afloop | [Maak verenigingskaart] | Geen prijsbudget: "Er is (nog) geen prijs; de challenge loopt om de eer." | `club_dashboard_viewed` |
| D5 | Kwaliteit | Aandeel gemarkeerde sessies met uitleg | — | — | `club_dashboard_viewed` |

De afronding en de weekcijfers in D2 volgen het besluit van de founder (productplan §10) en spec 4.6. Met exacte dagcijfers en kennis van buitenaf ("Joris zat gisteren niet in de UB") kan een bestuurslid door verschilberekening afleiden wie actief was.

---

## 4. Kernflows

Elke flow is een stappenreeks met schermverwijzingen. Waar de spec de logica vastlegt, verwijs ik ernaar; hier staat wat de gebruiker ziet en doet.

### 4.1 Onboarding met leeftijdscheck (activatie onder twee minuten)

1. De student opent een squadlink in WhatsApp → **O1** met de uitnodiger bovenaan ("Sanne nodigt je uit voor squad UB-ochtendploeg") en de zichtbaarheidsregel. `invite_link_opened` op de server.
2. Tik "Hoe telt Rewarded?" of [Doe mee] → **O2** met de eerlijke claim. Dit scherm is niet over te slaan, omdat het de verwachting zet die F6 later moet waarmaken.
3. **O3** e-mail en voornaam → **O4**. De server bewaart de uitnodiging bij de aanvraag van de magic link (rapport 07, `auth_magic_link.invite_token`), niet in de browser. De mail bevat de link én een code van 6 cijfers met dezelfde geldigheid. Opent de link in een andere browsercontext (een Home Screen-app op iOS heeft een eigen opslag, los van Safari; een in-app browser van Instagram of WhatsApp is weer een andere context), dan gaat de flow daar verder met dezelfde uitnodiging. Wie in O4 wil blijven, typt de code over; kopiëren en plakken werkt, dus dit is geen cognitieve toets in de zin van WCAG 3.3.8. De code is een voorstel aan de architectuur (§7, vraag 8).
4. **O5** geboortedatum. Een datum onder 16 vraagt eerst om bevestiging; na bevestiging → **O5b**, einde, niets opgeslagen. 16–17 → klasse `16_17`; 18+ → `18_plus`. Voor `16_17` volgt O5a (stille modus standaard aan); verder ziet de gebruiker hier geen verschil, en O5 noemt geen 18+-prijzen.
5. **O6** akkoord, met twee aparte vinkjes (voorwaarden; privacyverklaring) en de pilotuitleg. `account_created`, `experiment_assigned`.
6. **O7** dagdoel, standaard 25. Bij 90 of 120 een sheet "Begin liever klein? Je kunt je doel later verhogen." `daily_goal_set`.
7. **O8** Niet storen, met de regel over 5 minuten zonder verbinding → **O9** oefensessie van één minuut, met de uitnodiging om bewust weg te gaan. Wie dat doet, ziet een F6-achtig scherm met het label "Oefening". Wie blijft, hoort en ziet het eindsignaal. `practice_completed`.
8. **O10** "Start je eerste sessie van 25 minuten", met de squad erboven → flow 4.2. Wie nu geen 25 minuten heeft, kiest [Later vandaag] en een tijd voor één herinnering; de mail komt alleen als er dan nog geen sessie is, en valt binnen het activatievenster van 24 uur (spec 7.2).

Het doel van onder twee minuten (spec 1) is haalbaar omdat O2, O8 en O9 kort zijn en geen invoer vragen; O9 is over te slaan, de rest niet.

### 4.2 Focussessie: start, lopend, voltooid

1. **F1**: duur kiezen (standaard het laatst gekozen), [Start focussessie].
2. **F2**: eerste keer de checklist en de regel over het eindsignaal; daarna alleen de duur, de signaalschakelaar en [Begin]. De tik op [Begin] ontgrendelt de `AudioContext` (browsers spelen geluid pas af na een gebruikersgebaar) en laadt de toon. De server opent de sessie; `session_started`. De client vraagt Wake Lock aan; `wakelock_state`. Lukt dat niet, dan eerst de waarschuwing.
3. **F3**: het scherm wordt donker. De tekst "Leg je telefoon omgekeerd neer" staat vijf seconden groot en zakt dan naar een kleine regel onder de timer. Resterende tijd in minuten (seconden pas in de laatste minuut), dunne voortgangsring, avatars van squadleden die nu focussen. Geen punten. De helderheid van het scherm kunnen we niet regelen; het ontwerp gebruikt donkere tinten om licht en batterij te sparen.
4. Halverwege niets. Geen meldingen, geen aanmoediging, geen geluid. Schermlezers krijgen standaard alleen het einde te horen; een aankondiging elke 5 minuten is een instelling in F2 (§5.8), omdat een telefoon in de bibliotheek anders hardop kan gaan praten.
5. Einde: het scherm springt naar **F3e**, een volledig wit vlak met "Sessie klaar. Draai je telefoon om.", zodat het licht onder de telefoon uit valt. Tegelijk klinkt een korte, zachte toon; die staat standaard aan en is in F2 uit te zetten. Op Android trilt het toestel kort als de Vibration API beschikbaar is en de toon aan staat. Het signaal is voor elke sessie hetzelfde, staat los van punten en komt vóór F5; het is dus geen beloningssignaal in de zin van §5.7. De client meldt in de eindmelding of het signaal is afgespeeld; de server legt dat vast als `signal_played` in `session_completed` (voorstel aan de spec 7.1). De server valideert en schrijft bij; `session_completed`, eventueel `daily_goal_met` en `goal_bonus_booked`.
6. De student draait de telefoon om en tikt → **F5** in vaste volgorde: competentie ("50 minuten. Je dagdoel is gehaald." of "50 minuten. Nog 40 tot je dagdoel."), squad ("Mila en Daan zaten er ook. Squadstreak: dag 6." en "Squaddag: 2 van 3 actieve leden"), punten ("+50 punten bijgeschreven", inverdienvoortgang "212 van 300 minuten"), de Bonusregel van de arm, en onderaan de tekstlink "Maak een kaart".

**Waarom het eindsignaal standaard aan staat.** Spec 4.1 meet de claimvertraging: de seconden van het einde tot de eerste aanraking of terugkeer. Heuristiek H9 markeert een gebruiker die in een week bij meer dan 80% van de voltooide sessies meer dan 15 minuten vertraging heeft (spec 6.3). Ligt de telefoon met het scherm naar beneden en is er geen signaal, dan merkt een eerlijke student het einde niet en draait hij de telefoon pas om als hij zelf klaar is. Zonder signaal maakt het ontwerp eerlijke studenten dus systematisch verdacht. Dat drijft "gemarkeerde sessies < 5%" (businessplan §6) en de werklast van de wachtrij op, en dan is fraude niet meer te onderscheiden van een UX-effect. De toon alleen is niet genoeg: op iOS kan de stille-modusschakelaar geluid uit de browser dempen, en Safari op iOS ondersteunt de Vibration API niet. Beide punten staan niet in de onderzoeksrapporten en zijn te bevestigen in de toesteltest. Daarom komt er een visueel signaal bij: het witte eindscherm.

**Afhankelijkheid voor H9.** H9 mag pas meetellen nadat het eindsignaal op de testtoestellen werkt, en dan alleen voor sessies met `signal_played` = waar of met een signaal dat de student zelf uitzette. Dat is een voorstel aan de spec (6.3 legt de heuristieken vóór 2 december vast); eigenaar en datum staan in §7, vraag 3.

**Terugvalinstructie per toesteltype.** De kerninstructie "Leg je telefoon omgekeerd neer" kan op sommige toestellen zelf de afbreking veroorzaken. Een aantal Android-toestellen heeft een zak- of omdraaimodus die via de nabijheidssensor het scherm dooft; dat geeft `hidden`. Dat is een **aanname** die niet in de onderzoeksrapporten staat. Klopt ze, dan breken eerlijke sessies op die toestellen standaard af, en worden activatie en D7 vooral een toestelmeting. Daarom: (1) de testmatrix vóór 2 december bevat minstens twee Android-merken met zo'n modus (§7, vraag 3); (2) `session_aborted` krijgt `device_class` en de laatste `wakelock_state` als eigenschap (voorstel aan de spec; `device_class` staat nu alleen in `session_started`), en het weekrapport toont afbrekingen per toesteltype; (3) F2 heeft een terugvalinstructie klaar die per toesteltype via een vlag aan te zetten is, zonder release (rapport 07 kent `feature_flag` en `param_set`): "Leg je telefoon met het scherm omhoog en zet de helderheid laag. Zo blijft Rewarded zichtbaar." Bij die instructie blijft F3 donker, en het witte eindscherm doet hetzelfde werk.

### 4.3 Focussessie afgebroken en melden

1. Tijdens **F3** wordt de pagina verborgen (`hidden`), bijvoorbeeld door een inkomend gesprek. De server sluit de sessie op het eerste afbreeksignaal; `visibility_hidden`, `session_aborted`.
2. Bij terugkeer verschijnt direct **F6** in plaats van F3; `return_after_abort`. Kopregel: "Je sessie stopte om 14:32." Daaronder de reden per code (§6.2), de volgehouden duur, de zin over punten en de streakstatus.
3. Keuze: [Opnieuw beginnen] → F2 met dezelfde duur; [Kortere sessie] → F2 met de volgende kortere duur; "Klopt dit niet?" → **F7**. `abort_recovery` legt de keuze vast; wegtikken telt als "weg".
4. **F7** hangt af van de code, omdat een beheerder volgens spec 6.4 een afbreking alleen kan herstellen bij objectief bewijs: een storing aan onze kant in die periode, of een gebufferd log dat alsnog binnenkwam en aan de regels van 4.1 voldoet. Bij `hidden` is dat bewijs er nooit; een inkomend gesprek is niet te onderscheiden van een geopende app (spec 4.1, randgevallen). Valse hoop op herstel geeft na een afwijzing juist het zelfverwijt dat principe P4 wil dempen (Silverman en Barasch 2023, rapport 08 §4). De regels per code:

| Code | Herstel mogelijk? | Kop van F7 | Keuzes in de lijst | Wat de melding doet |
|---|---|---|---|---|
| `hidden` | Nee (behalve bij een storing aan onze kant, die de beheerder zelf ziet) | "Een gesprek, een andere app of een scherm dat uitging kunnen we niet terugdraaien." | Gesprek; melding geopend; scherm ging vanzelf uit; iets anders | "Je melding helpt ons beslissen of er na de pilot een kort terugkeervenster komt." (spec 6.4, open vraag 9) |
| `user_stop` | Nee | "Je stopte zelf. Dat kunnen we niet terugdraaien." | Per ongeluk gestopt; iets anders | Idem; per ongeluk stoppen is input voor de vraag over lang indrukken (§7, vraag 9) |
| `second_session` | Nee, tenzij jij die andere sessie niet startte | "Er startte een sessie op een ander toestel. Was jij dat niet? Meld het, dan kijken we naar je account." | Ik startte geen andere sessie; iets anders | Bij "Ik startte geen andere sessie": een mens kijkt naar het account, meestal binnen 3 werkdagen |
| `heartbeat_gap` | Ja, bij een storing of een geldig gebufferd log | "Een mens kijkt of we je sessie kunnen herstellen, meestal binnen 3 werkdagen." | Wifi viel weg; batterij leeg; iets anders | Naar de wachtrij (spec 6.4) |
| `late_end` | Ja, bij een storing of een geldig gebufferd log | Idem | Geen verbinding aan het einde; iets anders | Naar de wachtrij |

5. Bij de derde afbreking op een dag staat bovenaan F6 één voorstel: "Lukt het vandaag niet lang? Probeer 25 minuten met Niet storen aan."
6. Wie later naar Q1 gaat, ziet zichzelf niet als "gefaald"; de squad ziet alleen of het dagdoel gehaald is.
7. De status van een melding staat in **P4** en **F8**. Een besluit draagt een redencode met copy in gewone taal (§6.2); een afkeuring kan binnen 14 dagen in beroep (spec 6.5).

### 4.4 Squad maken en uitnodigen via WhatsApp

1. **Q1** leeg → [Maak squad] → **Q2** naam en optioneel vereniging, met boven de knop de zichtbaarheidsregel; `squad_created`.
2. Direct daarna **Q3** als sheet: voorgestelde tekst, [Deel via WhatsApp]. De Web Share API opent het systeemdeelmenu; WhatsApp is de eerste keuze in de copy, niet in de techniek. `invite_created`, `invite_share_opened`.
3. Terug in **Q1** "in opbouw": "Nog 2 vrienden nodig. Je focust intussen gewoon." De maker kan solo sessies doen.
4. De genodigde doorloopt flow 4.1 en leest op O1 dezelfde zichtbaarheidsregel; hij landt in Q1; `squad_joined`. Bij het derde lid: een rustige toast "Jullie squad is compleet. De streak begint morgen."; `squad_became_active`.
5. Nieuwe uitnodigingsmomenten komen alleen terug op de momenten uit spec 4.4; daarbuiten is de knop [Nodig uit] niet zichtbaar.

De zichtbaarheidsregel staat vóór het lidmaatschap, omdat het businessplan individuele vergelijking alleen binnen de squad en opt-in toestaat (§4). Live aanwezigheid staat standaard aan (§7, vraag 2); dan moet de student vóór zijn ja weten wat dat betekent, en dat stille modus er is.

### 4.5 Verenigingschallenge en bestuursdashboard

1. Het bestuur ontvangt van de beheerder een account en logt in op `/bestuur` → **D1** leeg ("Nog geen leden gekoppeld") → **D3** promotiekit met QR per kanaal.
2. Een lid scant de QR → `/c/{code}`. Zonder account: O1 met de vereniging bovenaan en dan flow 4.1. Met account: **V2** [Koppel]; `vereniging_joined`.
3. Het lid ziet **V1**: aanloopklassement tot de vakantiepauze, label "Zonder prijs, om de eer"; vanaf de prijsperiode de prijzen met financier en "Verdiend".
4. Het bestuur volgt **D2** werving en **D1** stand; cijfers verschijnen bij minstens 5 leden in een groep, afgerond op vijftallen, en de stand vanaf 15 gekoppelde leden.
5. Na de prijsperiode: "Voorlopig" tot fraudecontrole en winnaarsverificatie, daarna "Definitief" en in **D4** de verenigingskaart.

### 4.6 Verzilveren

1. **B1**: saldo en inverdienvoortgang. Onder 300 minuten zijn de knoppen uit, met "Nog 88 minuten focus, dan kun je verzilveren." `catalog_viewed`.
2. Na 300 minuten: tik op item → **B2** met wat afgaat en wat overblijft, en bij referralpunten de verdeling.
3. Eerste keer: **B3** sms-verificatie.
4. [Verzilver] → server controleert saldo, plafonds, voorraad en dekking → **B4** voucher; `redemption_completed`. Of de copy bij de reden uit `redemption_blocked` (§6.2); er is dan niets afgeschreven.
5. Toast: "Je code staat ook in je mail." Bij het weekplafond: "Maandag kun je weer verzilveren. Je punten blijven staan."

### 4.7 Verlote prijs: vervallen

Trekkingen worden niet gebouwd (founder J4, S9). B5, B6, de kans-kleur en de schakelaar "Meedoen aan trekkingen" vervallen. Wat blijft: op de dag dat de klasse van `16_17` naar `18_plus` gaat (spec 4.10), komt er geen melding, mail, badge of toast; vanaf die dag gelden de gewone regels voor 18-plussers (live aanwezigheid blijft zoals de student hem had ingesteld, duels buiten de squad worden mogelijk).

### 4.8 Deelbare kaart

1. Vanuit **F5** (of een mijlpaal of gewonnen duel) de tekstlink "Maak een kaart" → **K1**.
2. Voorbeeld met standaardvelden; schakelaars voor de velden, ook voornaam en streak; "Delen levert niets op." `card_created`. Een kaart na een gewonnen duel toont je eigen focustijd, niet de uitslag of de badge.
3. [Delen] → systeemdeelmenu; `card_share_opened`. Of [Opslaan].
4. Wie de QR scant, opent **K2** met de kaart en de grenstekst met datum en duur; `verify_page_viewed`. [Focus ook] leidt in de pilot naar de wachtlijst met voorrang.

### 4.9 Herinneringen

1. Standaard stuurt Rewarded geen herinneringen. De eerste keer dat de student na zijn eerste voltooide sessie F1 opent, staat onder de Bonusregel één kaart: "Wil je een herinnering om 20:00, de tijd van je eerste sessie? Hoogstens één mail per dag, alleen als je dagdoel nog open staat." [Ja, om 20:00] [Andere tijd] [Nee, dank je]. Kiest hij niets, dan verdwijnt de kaart na drie dagen en komt niet terug.
2. In **P5** zet hij de herinnering aan of uit, kiest hij tijd en dagen, en ziet hij een voorbeeld van de mail. Elke mail heeft onderaan "Geen herinneringen meer" als link die met één klik uitzet, zonder in te loggen.
3. De server stuurt hoogstens één mail per dag (spec 8), alleen op de gekozen tijd, en niet als het dagdoel al gehaald is of als het lid op pauze staat. De vaste mailcopy staat in §6.2 en gebruikt geen verliesframing; ook de streakvariant uit spec 8 ("streak in gevaar") wordt een feitelijke squadregel zonder dreiging.
4. Events: `reminder_sent` en `reminder_opened` (voorstel aan de spec 7.1; nodig om het effect van de herinnering op D7 te kunnen lezen), naast `reminder_scheduled` voor [Later vandaag] in O10 en `reminder_settings_changed` in P5.

### 4.10 De Belofte

1. Het aanbod verschijnt volgens de arm (spec 4.12) als kaart op F1. Vroege arm, zeven dagen vóór de bonusstop van de eigen instelling: "Op [datum] stopt de doelbonus. Wil je jezelf iets beloven voor de komende twee weken?" Late arm, na de tentamenperiode van april: "Wil je jezelf iets beloven voor de komende twee weken?" [Bekijk] → **Q5**; `belofte_offered`.
2. **Q5**: dagen per week, minuten per dag, getuigen. Het voorstel staat al ingevuld met wat de student de afgelopen 14 dagen echt deed, naar beneden afgerond. Bij "De squad" staat: "Je squad ziet je Belofte en per dag of je hem haalde. Je minuten en punten zien ze niet." [Beloof het]; `belofte_made`.
3. Tijdens de looptijd: in Q1 een eigen regel ("Jouw Belofte: 3 van 5 dagen deze week") en bij elk ander lid met een Belofte dezelfde regel; tik → **Q7**. Stoppen kan in Q1 en Q5 met één tik; getuigen zien dan "Belofte gestopt"; `belofte_stopped`.
4. Na 14 dagen **Q6** met de uitkomst, de dagen als stippen en drie keuzes; in de vroege arm is de eerste keuze het vooraf vastgelegde hernieuwingsaanbod ("Nog twee weken?"), voor iedereen met dezelfde tekst; 18+ krijgt één vrijblijvende vraag; `belofte_renewal_offered`, `belofte_reflection`.

### 4.11 Referral (R3, achter een vlag)

1. Vanaf 5 januari, na besluit van de founder, heeft elke gebruiker in Ik een regel "Je persoonlijke link" → **R1** (spec 3.11).
2. R1 legt de regels uit vóór de deelknop (§6.2) en noemt geen punten in de deeltekst zelf; de voorgestelde tekst gaat over samen focussen, zoals Q3.
3. Per genodigde een rij met de vesting als voortgang ("Joris: 2 van 3 sessies, nog 3 dagen"). Gevestigd: "Joris: klaar. 150 punten voor jullie allebei, nu in Referral." Niet gevestigd: de rij wordt stil "Niet vrijgekomen" (spec 3.11), zonder melding en zonder verwijt. De 150 is de werkhypothese uit spec 4.9.
4. In **B1** staan referralpunten apart; in **B2** zie je de verdeling tussen eigen en referralpunten, met hoogstens de helft uit referralpunten (spec 4.9).

---

## 5. Designsysteem

### 5.1 Karakter

Rewarded moet eruitzien als een bibliotheek om half negen 's ochtends: rustig, licht, een beetje warm, en serieus genoeg dat een bestuur het durft te delen. De merkkleur is een diep mosgroen, omdat groen bij focus en "verder" hoort zonder de felheid van een casino of fintech. Verlote prijzen krijgen een eigen gedempt violet, zodat "kans" nooit op "verdiend" lijkt. Het sessiescherm is altijd donker, ook in het lichte thema, omdat het met het scherm naar beneden ligt en zo min mogelijk licht mag geven. Het eindscherm is het enige moment waarop het scherm bewust fel wordt.

### 5.2 Kleurtokens

De gebruiker kiest licht, donker of systeem (standaard systeem). Contrastwaarden zijn berekend met de WCAG-formule voor relatieve luminantie. Normale tekst vraagt 4,5:1, grote tekst en niet-tekstuele elementen 3:1 (WCAG 2.2, 1.4.3 en 1.4.11). Decoratieve scheidingslijnen (`border`) hoeven geen 3:1; randen van invoervelden en schakelaars gebruiken `border-strong`. Een hexwaarde buiten deze tabel hoort niet in de code of de mockups.

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
| `pause-soft` / `pause-text` | Afgebroken, wordt nagekeken, weekbudget (neutraal, geen rood) | #FBEFD6 / #7A4E00 | #3A2E14 / #F2C46B | 6,3 | 8,2 |
| `kans-soft` / `kans` | Alleen verlote prijzen | #ECE9F7 / #574A92 | #2A2545 / #B9AEF0 | 6,3 | 7,2 |
| `danger` | Alleen destructieve acties (account verwijderen) | #A3322A | #F08A80 | 6,9 op surface | 7,1 op surface |
| `border` | Decoratieve scheiding | #D9D6CE | #2C333B | n.v.t. | n.v.t. |
| `border-strong` | Invoervelden, schakelaars, ongekozen segment | #7D848C | #6E7782 | 3,8 op surface | 3,8 op surface |
| `focus-ring` | Toetsenbordfocus, 2 px plus 2 px ruimte | #1F4FD1 | #8FB2FF | 6,3 op bg | 9,0 op bg |
| `session-bg` | Sessiescherm (beide thema's) | #000000 | #000000 | — | — |
| `session-text` / `session-muted` | Timer / regels in de sessie | #C9CED4 / #8A929C | idem | 13,3 / 6,7 | 13,3 / 6,7 |
| `session-accent` | Voortgang van de ring in de sessie | #4E8F7B | idem | 5,5 op session-bg | 5,5 op session-bg |
| `session-track` | Spoor van de ring (decoratief) | #1A1E23 | idem | n.v.t. | n.v.t. |
| `session-surface` | Avatars en vlakken in de sessie | #20262D | idem | session-text 9,6 erop | idem |
| `end-bg` / `end-text` | Eindscherm F3e (beide thema's) | #FFFFFF / #1B1F24 | idem | 16,6 | 16,6 |
| `card-share-bg` | Achtergrond van de deelbare kaart | #1E3530 | idem | text-donker 10,8; primary-text-donker 8,0 | idem |
| `shadow-sheet` | Schaduw van sheets en de kaart | 0 6px 24px rgba(27,31,36,.10) | 0 6px 24px rgba(0,0,0,.40) | n.v.t. | n.v.t. |

Drie kleurregels. Rood bestaat alleen voor destructieve acties; een afgebroken sessie is amber-neutraal, geen fout. Kleur draagt nooit alleen betekenis: elke status heeft ook een woord of icoon. De kans-kleur uit versie 1.1 vervalt met de trekkingen.

### 5.3 Typografie

Systeemfonts, zodat de PWA snel laadt en zonder externe bron werkt: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Cijfers in timer, saldo en ranglijst gebruiken `font-variant-numeric: tabular-nums`, zodat ze niet verspringen. Tekst schaalt mee met de systeeminstelling (rem-eenheden); de layout moet bij 200% tekstgrootte bruikbaar blijven (WCAG 1.4.4).

| Stijl | Grootte / regelhoogte | Gewicht | Gebruik |
|---|---|---|---|
| `display` | 64 / 72 | 300 | Timer in F3, "Sessie klaar." in F3e |
| `title-l` | 28 / 34 | 700 | Kop van een scherm |
| `title-m` | 22 / 28 | 650 | Kop van een kaart |
| `body-l` | 17 / 24 | 400 (650 voor het puntengetal in F5) | Hoofdtekst, uitleg F6, punten in F5 |
| `body` | 15 / 22 | 400 | Lijsten, beschrijvingen, Bonusregel |
| `label` | 13 / 18 | 600 | Knoplabels klein, chips, tablabels (12 px minimaal) |
| `caption` | 12 / 16 | 400 | Voorwaarden, bronvermelding |

### 5.4 Spacing, raster en vorm

Een raster van 4 px met de stappen 4, 8, 12, 16, 24, 32, 48. Zijmarge op de telefoon 16 px, tussen kaarten 12 px, binnen een kaart 16 px. Hoekradius: 12 px voor kaarten, 999 px voor knoppen en chips, 20 px voor de bovenrand van een bottom sheet. Schaduwen zijn minimaal (`shadow-sheet` voor sheets); diepte komt uit vlakkleur, niet uit glans.

### 5.5 Componenten

| Component | Varianten | Regels |
|---|---|---|
| Knop | Primair (gevuld `primary`), secundair (rand `border-strong`), tekstlink, destructief (`danger`, alleen met modaal) | Altijd een `button` (of een `a` als hij naar een andere pagina gaat); minimaal 48 px hoog; één primaire knop per scherm; label is een werkwoord ("Start focussessie", niet "OK"); uitgeschakeld altijd met de reden in tekst ernaast |
| Tekstlink | Inline, losstaand | Losstaand: tikvlak minimaal 48 px hoog over de volle breedte van de kolom, ook als de tekst kort is ("Klopt dit niet?", "Hoe telt Rewarded?", "Maak een kaart") |
| Kaart | Standaard, gemarkeerd (eigen vereniging), status (amber), kans (violet, alleen B1/B5) | Kop, inhoud, maximaal één actie; geen hele kaart als knop als er ook een knop in staat |
| Bonusregel | Arm A, arm B | Eén component voor beide armen, met dezelfde plek, grootte en stijl: op F1 direct onder de primaire knop, op F5 als laatste regel van het puntenblok. Stijl `body` in `text-muted`, één of twee regels, links uitgelijnd, met de tekstlink "Waarom zie ik dit?" (→ B7). Geen eigen kaart, geen kleurvlak, geen icoon. Arm B krijgt geen weekbudgetblok op F1 of F5; het weekbudget als bedrag staat in B1. Copy in §6.2 |
| Timer | Sessie (display, `session-text`), compact (F1, title-m) | Minuten, seconden alleen in de laatste minuut; `aria-live` standaard alleen bij het einde, elke 5 minuten als instelling |
| Voortgangsring | Dagdoel (F1), sessie (F3), inverdien (B1 als balk) | Dun (6 px); geen pulserende rand; altijd met getal in tekst ("212 van 300 min"); `role="progressbar"` met naam, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` en `aria-valuetext` |
| Lijst | Squadleden, catalogus, meldingen | Rij ≥ 56 px; avatar met initialen, nooit een foto in de pilot; status als woord plus icoon |
| Ranglijst | Verenigingen | Positie, naam vereniging, deelnamegraad (groot), intensiteit (klein); eigen vereniging met rand; geen pijlen die stijgen of dalen animeren; geen personen |
| Toast | Informatief | Onderaan boven de tabbalk, 4 s, `role="status"`; nooit voor een fout die actie vraagt; nooit tijdens een sessie |
| Modaal | Bevestiging met gevolg | Titel als vraag, twee knoppen, de veilige keuze primair; sluiten met Esc en buitenkant tik; focus gevangen |
| Bottom sheet | Uitnodigen, verzilveren, melden, overmoedrem, herinnering | Sleepgreep, sluitknop, maximaal 90% hoogte; op de laptop een gecentreerd paneel |
| Segment | Duurkeuze 25/50/90, dagdoel | Gekozen segment gevuld, ongekozen met `border-strong`; container `role="radiogroup"` met naam, elk segment `role="radio"` met `aria-checked`; pijltjestoetsen verplaatsen de keuze |
| Schakelaar | Aan, uit, vergrendeld | `button` met `role="switch"` en `aria-checked`; tekstlabel links, gekoppeld met `aria-labelledby`; nooit vooraf aan als het een opt-in is (herinneringen, minuten vergelijken, aanwezigheid voor `16_17`) |
| Chip / label | "Verdiend", "Voorlopig", "Tentamendag", "Wordt nagekeken", "Op pauze", "Joker" | Altijd tekst; kleurfamilie volgens 5.2 |
| Banner | Afgebroken, offline, vakantiepauze | Volle breedte onder de kop; sluitbaar behalve offline |
| Badge "Fictief" | Alleen in mockups en pitchmateriaal | Op elk mockupscherm in de statusbalk, zodat een losse schermafbeelding de markering houdt (rapport 04 §5, regel 2) |

### 5.6 Iconen

Lijniconen van 24 px op een raster van 24, lijndikte 1,75 px, afgeronde uiteinden; de actieve tab gebruikt een gevulde variant. Eén metafoor per begrip: een telefoon met het scherm omlaag voor sessie, drie hoofden voor squad, een vlag voor vereniging, een cadeaudoos zonder strik-animatie voor beloningen, een cirkel met persoon voor Ik, een kleine vlam voor streak (rustig getekend, niet geanimeerd), een lot zonder sterren (rechthoek met twee inkepingen en een stippellijn) voor kans, een open cirkel met een streep voor de joker, een eenvoudig lint zonder sterren voor de duelbadge. Geen klavertjes, hoefijzers, muntjes, geldzakken, diamanten of sterrenregens: die staan voor geld en geluk, niet voor focus. Waar een icoon twijfel geeft, volstaat het tekstlabel ("Kans · 18+").

### 5.7 Beweging

Beweging bevestigt wat er gebeurde en houdt de gebruiker in de context; ze beloont niet. Overgangen duren 150–250 ms met een uitlopende curve (`cubic-bezier(.2,.7,.2,1)`). Een sheet schuift omhoog, een scherm faded. Wat niet mag: confetti, oplopende puntentellers, draaiende wielen of rollen, schuddende knoppen, pulserende "claim"-knoppen, geluiden bij punten, haptische pieken bij beloningen, en animaties die de spanning van een trekking nabootsen. Dat zijn de signalen van variabele beloning en slotmachines, en die passen niet bij een product dat geen loot boxes kent (businessplan §4). Het eindsignaal van een sessie (§4.2) valt daar niet onder: het is voor elke sessie hetzelfde, staat los van punten en klinkt vóór F5. In F5 verschijnen de drie blokken na elkaar met 120 ms vertraging, zodat de volgorde (competentie, squad, punten) ook in de tijd klopt. Met `prefers-reduced-motion: reduce` vallen alle verplaatsingen weg en blijft alleen een fade van 100 ms of niets.

### 5.8 Toegankelijkheid

Het doel is WCAG 2.2 AA voor alle schermen in de studentenapp en het bestuursdashboard. De mockups zijn een semantische referentie: ze gebruiken de elementen en rollen hieronder, en wat in de mockups toch afwijkt, wordt beslist door deze paragraaf en §5.5, niet door de mockup.

- **Contrast**: zie 5.2; alle tekstparen ≥ 4,5:1, niet-tekstuele elementen ≥ 3:1.
- **Aanraakdoelen**: minimaal 48 × 48 px voor alles wat je bedient, ruim boven het minimum van 24 × 24 px uit WCAG 2.2 (2.5.8). Dat geldt ook voor losse tekstlinks; de meldroute op F6 is dus niet kleiner dan de andere knoppen. De Stoppen-knop in F3 is 56 px hoog en staat niet direct naast een andere knop.
- **Schermlezers**: elk scherm heeft één `h1`; de tabbalk is een `nav` met `aria-current="page"` op het actieve item; de timer kondigt standaard alleen het einde aan (`aria-live="polite"`), en elke 5 minuten alleen als de gebruiker dat in F2 aanzet; live aanwezigheid krijgt een samenvattende tekst ("2 van 3 actieve squadleden focussen nu"); de voortgangsring heeft `role="progressbar"` met naam en waarden. Iconen zonder tekst hebben een `aria-label`, decoratieve iconen `aria-hidden="true"`. `role="img"` staat alleen op een decoratieve afbeelding met een samenvattende naam, nooit op een container met bedienbare elementen.
- **Toetsenbord**: volledige bediening op de laptop, zichtbare `focus-ring`, geen focus die onder een sticky element verdwijnt (2.4.11); Esc sluit sheets en modalen.
- **Gebaren**: geen actie alleen via vegen of lang indrukken; Stoppen opent met één tik het modaal en kan met lang indrukken sneller (2.5.1, 2.5.7).
- **Taal en tijd**: `lang="nl"`; geen tijdslimiet op invoer behalve de magic link en de code, met opnieuw versturen; de sessie zelf is een tijdslimiet die de gebruiker kiest.
- **Authenticatie**: magic link of code van 6 cijfers, zonder puzzel of wachtwoord; de code is te plakken en heeft `autocomplete="one-time-code"` (3.3.8).
- **Reduced motion en tekstgrootte**: zie 5.7 en 5.3.
- **Kleurenblindheid**: groen, amber en violet zijn altijd met tekst gecombineerd; de actieve tab heeft ook vorm (gevuld icoon en balkje).

**Snippets per component.** Bouwers nemen de structuur hieronder over; klassen en tokens komen uit 5.2 en 5.5.

```html
<!-- Knop -->
<button type="button" class="btn primary">Start focussessie</button>

<!-- Losse tekstlink met tikvlak van 48 px -->
<button type="button" class="link">Klopt dit niet?</button>

<!-- Segment -->
<div role="radiogroup" aria-label="Duur van de sessie" class="seg">
  <button type="button" role="radio" aria-checked="false">25 min</button>
  <button type="button" role="radio" aria-checked="true">50 min</button>
  <button type="button" role="radio" aria-checked="false">90 min</button>
</div>

<!-- Schakelaar -->
<span id="lbl-stil">Stille modus</span>
<button type="button" role="switch" aria-checked="false" aria-labelledby="lbl-stil" class="toggle"></button>

<!-- Tabbalk -->
<nav aria-label="Hoofdnavigatie" class="tabbar">
  <a href="/focus" class="tab on" aria-current="page"><svg aria-hidden="true"><use href="#i-focus-f"/></svg>Focus</a>
  <a href="/squad" class="tab"><svg aria-hidden="true"><use href="#i-squad"/></svg>Squad</a>
</nav>

<!-- Voortgangsring -->
<svg role="progressbar" aria-label="Dagdoel vandaag" aria-valuemin="0" aria-valuemax="50"
     aria-valuenow="25" aria-valuetext="25 van 50 minuten">…</svg>

<!-- Code uit de mail -->
<label for="code">Code uit de mail</label>
<input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6">
```

---

## 6. Microcopy

### 6.1 Regels

De toon komt uit rapport 04 §5: praat als een studiegenoot, kort en droog, zonder druk. Voor de interface voeg ik daar zes werkregels aan toe.

1. **Feit, reden, weg terug.** Bij elke tegenvaller drie zinnen: wat er gebeurde (met tijd en getal), waarom, en wat je nu kunt doen. Geen bijvoeglijke naamwoorden over de gebruiker.
2. **Jij-vorm, actief, tegenwoordige tijd.** "Je sessie stopte", niet "Uw sessie werd beëindigd".
3. **Werkwoorden op knoppen.** "Opnieuw beginnen", "Verzilver voor 300 punten". Nooit "OK", "Ja" of een knop die de gebruiker voor zijn keuze laat schamen.
4. **Getallen zijn echt of gemarkeerd.** Geen voorbeeldopbrengsten; resterende tijd en voorraad altijd als getal. Nooit een eurowaarde bij punten. Een aanvulling van voorraad noemen we alleen als die al gedekt in de beheeromgeving staat.
5. **Verdiend heet verdiend.** Bij verdiende prijzen "verdiend" of "behaald"; "kans" en "verloot" komen niet voor, want er zijn geen trekkingen (rapport 04 §5, regel 3). Geen copy die op sociale schaamte speelt ("jij bent de enige die…").
6. **Geen woorden uit de nee-lijst.** "Bewezen", "win" (bij iets verdiends, en nergens vóór de leeftijdscheck), "verdien geld", "gefaald", "mis het niet", "nog maar", "gratis geld", "alleen echte focus telt", "nodig uit en verdien". De volledige lijst staat in rapport 04 §10. Het woord "weekdoel" gebruiken we niet zolang de spec geen zelfgekozen weekdoel kent (rapport 04, open vragen); we schrijven "je dagdoel op 5 van de 7 dagen".

### 6.2 Copy per moment

**Sessie en einde**

| Moment | Copy | Waarom zo |
|---|---|---|
| Sessie loopt (F3) | "Leg je telefoon omgekeerd neer. Wij houden de tijd bij." Laptop: "Laat dit tabblad open in een zichtbaar venster. Je telefoon leg je zelf weg." | Instructie, geen beloning; laptopmodus belooft niets over de telefoon (rapport 04 §2) |
| Terugvalinstructie (F2, per toesteltype via vlag) | "Leg je telefoon met het scherm omhoog en zet de helderheid laag. Zo blijft Rewarded zichtbaar." | Voor toestellen waar omdraaien het scherm dooft (**aanname**, §4.2) |
| Eindsignaal (F2) | "Aan het einde hoor je een zachte toon en wordt je scherm wit, zodat je ziet dat je klaar bent." Schakelaar: "Toon aan het einde" | Zegt wat er gebeurt; uitzetten kan |
| Eindscherm (F3e) | "Sessie klaar." / "Draai je telefoon om." | Geen punten vóór F5 |
| Geen verbinding, tijdens de sessie | "Geen verbinding. Blijf op dit scherm. Is de verbinding langer dan 5 minuten weg, dan stopt de sessie op het laatste moment dat we je zagen." | Waar voor elke uitkomst van spec 4.1 |
| Geen verbinding, buiten een sessie | "Geen verbinding. Wat de server nodig heeft, staat even uit." | Belooft niets over sessies |
| Dagrand (F1, F9, P1) | "Je dag loopt tot 04:00. Deze sessie telt voor dinsdag." | Spec 4.2, dagrand |
| Voltooid (F5) | "50 minuten. Je dagdoel is gehaald." / "Mila en Daan zaten er ook." / "+50 punten bijgeschreven." | Competentie, squad, beloning (principe P1) |
| Voltooid, modus zonder punten | "50 minuten. Je dagdoel is gehaald." / "Mila en Daan zaten er ook." (geen puntenblok) | Spec 4.10; de uitleg dat punten op de achtergrond doorlopen staat bij de schakelaar in P1 |
| Gemarkeerd (F5) | "Deze sessie wordt nagekeken (reden: een groot deel van de tijd kregen we geen signaal). Je punten komen vrij zodra dat klaar is, meestal binnen 3 werkdagen." | Spec 6.4; de exacte drempel noemen we niet |
| Puntenplafond (F5) | "Je zit op 5 uur vandaag. Meer focus telt voor je dagdoel, maar levert vandaag geen punten meer op. Rust telt ook." | Spec 4.2; puntenplafond 300 minuten (ronde 1) |

**Afbreken (F6), alle vijf codes uit spec 4.1**

| Code | Copy | Waarom zo |
|---|---|---|
| `hidden` | "Je sessie stopte om 14:32 omdat Rewarded niet meer op je scherm stond. Je hield 18 minuten vol. Afgebroken sessies leveren geen punten op: we kunnen alleen tijd belonen die we kunnen zien. Je squadstreak loopt nog." | Letterlijk uit spec 3.3, plus de streakzin (Silverman en Barasch 2023) |
| `heartbeat_gap` | "Je sessie stopte om 14:32 omdat we langer dan toegestaan geen signaal van je toestel kregen. Dat kan aan de wifi liggen. Je hield 18 minuten vol. Klopt dit niet? Een mens kijkt of we je sessie kunnen herstellen." | Automatisch signaal kost punten, dus de meldroute staat vooraan (spec 3.3) |
| `user_stop` | "Je stopte na 18 minuten. Een sessie van 25 minuten telt ook mee voor je dagdoel." | Geen fraudesignaal, geen verwijt; klopt bij elk dagdoel |
| `second_session` | "Je startte een sessie op een ander toestel, dus deze is gestopt. Er loopt er één tegelijk." | Vaste code, gewone taal |
| `late_end` | "We kregen het einde van je sessie pas laat binnen, zonder signaal in de tussentijd. Daarom telt deze sessie niet. Klopt dit niet? Een mens kijkt of we hem kunnen herstellen." | Spec 4.1: einde > 10 minuten na de geplande eindtijd zonder heartbeats |
| Derde afbreking | "Lukt het vandaag niet lang? Probeer 25 minuten met Niet storen aan." | Voorstel uit spec 3.3 stap 4 |
| Stoppen-modaal (F4) | "Stoppen? De minuten tot nu leveren geen punten op. Je squadstreak breekt hier niet door." [Doorgaan] [Stoppen] | Feitelijk, geen schuld; de veilige keuze is primair maar Stoppen blijft gewoon zichtbaar |

**Melden (F7), per code**

| Code | Copy in de sheet | Toast na versturen |
|---|---|---|
| `hidden` | "Een gesprek, een andere app of een scherm dat uitging kunnen we niet terugdraaien: we zagen Rewarded niet meer op je scherm. Je melding helpt ons beslissen of er na de pilot een kort terugkeervenster komt." | "Dank je. Je melding telt mee voor die beslissing." |
| `user_stop` | "Je stopte zelf; dat kunnen we niet terugdraaien. Stopte je per ongeluk? Laat het weten, dan kijken we of de stopknop beter kan." | "Dank je. We kijken naar de stopknop." |
| `second_session` | "Er startte een sessie op een ander toestel. Was jij dat niet? Meld het, dan kijkt een mens naar je account, meestal binnen 3 werkdagen." | "Je melding is binnen. Je ziet de status bij Ik, Meldingen." |
| `heartbeat_gap`, `late_end` | "Een mens kijkt of we je sessie kunnen herstellen, meestal binnen 3 werkdagen. Dat kan als er bij ons een storing was of als je toestel alsnog een geldig log stuurde." | "Je melding is binnen. Je ziet de status bij Ik, Meldingen." |

**Besluiten na een melding, markering of beroep (F8, P4).** Spec 4.11 eist een redencode uit een vaste lijst die de student in gewone taal ziet, maar de lijst zelf staat nog niet in de spec. Hieronder mijn voorstel, af te stemmen met spec 4.11 (§7, vraag 7).

| Redencode (voorstel) | Wanneer | Copy voor de student |
|---|---|---|
| `release_ok` | Gemarkeerde sessie vrijgegeven | "We hebben je sessie nagekeken. Alles klopt; je punten zijn vrijgegeven." |
| `restore_outage` | Afbreking hersteld wegens storing | "Er was bij ons een storing op dat moment. Je sessie telt alsnog als voltooid." |
| `restore_log` | Afbreking hersteld met gebufferd log | "Je toestel stuurde alsnog een geldig log. Je sessie telt alsnog als voltooid." |
| `keep_hidden` | Melding afgewezen bij `hidden` | "Rewarded stond op dat moment niet op je scherm. Dat kunnen we niet herstellen. Je melding telt mee voor de vraag of er een terugkeervenster komt." |
| `keep_no_evidence` | Melding afgewezen zonder bewijs | "We vonden geen storing en geen log dat het gat dekt. Daarom blijft de afbreking staan. Je kunt binnen 14 dagen beroep instellen." |
| `reject_no_signal` | Gemarkeerde sessie afgekeurd: te veel tijd zonder signaal | "Voor een te groot deel van deze sessie kregen we geen signaal. Daarom telt hij niet. Je kunt binnen 14 dagen beroep instellen." |
| `reject_automation` | Afgekeurd na H1 | "Deze sessie liep in een browser die door software werd bestuurd. Daarom telt hij niet. Je kunt binnen 14 dagen beroep instellen." |
| `reject_multi_account` | Afgekeurd na H2, H7 of H8 | "Deze sessie hoort bij een patroon van meerdere accounts. Daarom telt hij niet. Je kunt binnen 14 dagen beroep instellen." |
| `reject_unattended` | Afgekeurd na H5, H6 of H9 | "Het patroon van deze sessies past bij een toestel dat zonder jou bleef draaien. Daarom tellen ze niet. Je kunt binnen 14 dagen beroep instellen." |
| `reject_clock` | Afgekeurd na H4 | "De klok van je toestel week sterk af van de onze. Daarom telt deze sessie niet. Je kunt binnen 14 dagen beroep instellen." |
| `appeal_upheld` | Beroep gegrond | "Een tweede beoordelaar gaf je gelijk. Je punten zijn terug en de sessie telt." |
| `appeal_denied` | Beroep ongegrond | "Een tweede beoordelaar keek opnieuw en kwam tot hetzelfde besluit: [motivering]." |

**Zichtbaarheid, leeftijd en akkoord**

| Moment | Copy | Waarom zo |
|---|---|---|
| Zichtbaarheidsregel (O1 bij een squadlink, Q2 vóór de knop) | "Je squad ziet of je nu focust, hoe lang je sessie nog loopt en of je je dagdoel haalde. Je focusminuten en punten zien ze niet, tenzij je zelf minuten vergelijken aanzet. Stille modus verbergt je status; je telt wel mee voor de squaddag." | Geïnformeerde opt-in (businessplan §4); elke zin klopt met Q1 en spec 4.4 |
| Leeftijd (O5) | "Rewarded is er vanaf 16 jaar. We vragen je geboortedatum om te bepalen welke onderdelen je ziet." | Geen 18+-prijzen of "win" vóór de leeftijdscheck (principe P10) |
| Privacy bij leeftijd (O5, P2) | "We bewaren of je 16–17 of 18+ bent. Ben je jonger dan 18, dan bewaren we ook de dag waarop je 18 wordt, zodat je dan automatisch overstapt." | Klopt met spec 4.10; de privacyverklaring zegt hetzelfde |
| Onder 16, bevestiging | "Volgens deze datum ben je 15. Klopt dat?" [Ja, dat klopt] [Datum aanpassen] | Voorkomt dat een tikfout iemand buitensluit |
| Onder 16 (O5b) | "Rewarded is er vanaf 16 jaar. We hebben niets van je bewaard." | Spec 3.1 stap 5 |
| Pilotuitleg (O6) | "Dit is een pilot. We testen twee bonusregels die evenveel opleveren; jouw squad krijgt er één, door loting. Je punten per minuut zijn voor iedereen gelijk. Sommige onderdelen krijg je op een ander moment dan anderen. De doelbonus stopt aan het einde van de laatste tentamenweek van je instelling, op [datum]. Je kunt altijd stoppen en je gegevens laten verwijderen." | Spec 3.1 stap 6; voor 16–17 dezelfde tekst, extra eisen bij de jurist (§7, vraag 6) |
| Opt-in kan pas met beide vinkjes (O6) | "Zet beide vinkjes aan om verder te gaan." | Uitgeschakelde knop met reden |

**Squad, joker, Belofte en duel**

| Moment | Copy | Waarom zo |
|---|---|---|
| Squaddag (Q1, F5) | "Vandaag: 2 van 3 actieve leden haalden hun dagdoel. De squaddag is geslaagd." | Noemer volgens spec 4.4 |
| Joker nog over (F1, Q1) | "Joker deze week: nog over." | Herstelmogelijkheid zichtbaar maken (Silverman en Barasch 2023) |
| Joker ingezet (F1, Q1) | "Joker ingezet voor dinsdag. Je telde mee voor de squaddag." | Feitelijk |
| Toast na inzet | "Je haalde dinsdag je dagdoel niet. Je joker van deze week is ingezet, dus je telde mee voor de squaddag. De doelbonus geldt niet voor die dag." | Spec 4.4 en 5; geen dreiging |
| Belofte-regel (Q1) | "Belofte: 3 van 5 dagen deze week." | Getuigen zien de Belofte per dag (spec 3.12) |
| Getuigen (Q5) | "Je squad ziet je Belofte en per dag of je hem haalde. Je minuten en punten zien ze niet. Er hangen geen punten aan." | Wat getuigen zien, staat vóór de keuze |
| Belofte gestopt, eigen scherm | "Belofte gestopt. Je squad ziet alleen dat hij gestopt is." | Geen schuldtaal (spec 4.12) |
| Belofte gestopt, getuige (Q7) | "Mila heeft haar Belofte gestopt." | Geen oordeel, geen dag van falen |
| Belofte-reflectie (Q6) | "Je haalde je Belofte op 9 van 12 dagen." 18+: "Zou je bij een volgende Belofte een bedrag inzetten dat naar een goed doel gaat als je hem niet haalt? Er is nu geen betaalfunctie; we vragen het alleen." [Ja] [Nee] [Weet ik niet] | Spec 3.12 stap 5 |
| Duel, voorbehoud (Q4) | "Daag een vriend uit voor zeven dagen. Er staan geen punten op het spel." | Duel buiten de squad onder voorbehoud van het besluit op 25 november |
| Duelbadge (Q4, P1) | "Duel gewonnen van Daan, week van 4 januari." / "Alleen jij ziet je badges." | Spec 3.6; geen openbare vergelijking |

**Beloningen, alle zes blokkeerredenen uit `redemption_blocked`**

| Reden | Copy | Waarom zo |
|---|---|---|
| `inverdien` | "Nog 88 minuten focus, dan kun je verzilveren. Je punten staan al klaar." | Resterende tijd als getal |
| `week` | "Je verzilverde deze week al iets. Maandag kun je weer verzilveren. Je punten blijven staan." | Spec 3.4 stap 6 |
| `maand` | "Je zit aan het maximum aan beloningen voor deze maand. Vanaf 1 februari kan het weer. Je punten blijven staan." | Europlafond (spec 4.3), zonder eurobedrag (principe P7) |
| `voorraad` | "Deze is net op. Er is niets afgeschreven." | Spec 4.3 |
| `saldo` | "Je hebt 250 beschikbare punten; dit kost 300. Punten in je weekbudget of die worden nagekeken, tellen nog niet mee." Bij referralpunten: "Hoogstens de helft mag uit referralpunten komen." | Legt de afwijking tussen saldo en beschikbaar uit |
| `dekking` | "Deze beloning is even niet beschikbaar: de partner heeft haar nog niet vastgelegd. Er is niets afgeschreven." | Budget volgt geboekte omzet (businessplan besluit 2) |
| Inverdienperiode, uitleg | "Je eerste verzilvering kan na vijf uur focus. Zo gaat de catalogus naar mensen die er een gewoonte van maken." | Reden zonder fraudeverwijt (rapport 04 §10) |
| Voorraad nul (B1) | "Deze week op." Alleen als de weekvrijgave al gedekt in de beheeromgeving staat: "Deze week op. Maandag komen er 15 bij." | Geen belofte van voorraad die niet gedekt is (spec 4.3) |
| Catalogus nog niet gedekt | "De catalogus opent zodra partners hun beloningen hebben vastgelegd. Je punten tellen al." | Budget is afgeleid van geboekte omzet |
| Saldo-onderdelen (B1) | "Beschikbaar" / "Weekbudget (nog niet veilig)" / "Wordt nagekeken" / "Referral, nog niet vrij" | Twee oorzaken van "in afwachting" uit elkaar (spec 3.4) |

**Bonusregel (F1, F5), beide armen in dezelfde component**

| Arm | F1 | F5 | Gemist doel (F1 de volgende dag) |
|---|---|---|---|
| A | "Dagdoel halen vandaag: +20 bonus." | "+20 bonus voor je gehaalde dagdoel." | "Dagdoel halen vandaag: +20 bonus." (geen verwijzing naar gisteren) |
| B | "Weekbudget: nog 100. Je dagdoel halen zet er vandaag 20 veilig." | "20 uit je weekbudget staan nu veilig. Nog 80 in je weekbudget." | "Je weekbudget is nu 100. Vandaag je doel halen zet er 20 veilig." |
| B, maandag | "Je weekbudget: 140 punten. Elke dag dat je je doel haalt, zet je er 20 veilig." | — | — |

Beide armen hebben dezelfde lengte (één of twee regels in `body`), dezelfde positie en dezelfde link "Waarom zie ik dit?". Zo verschillen ze alleen in framing (winst of verlies), wat H-A veronderstelt (spec 7.3), en niet in saillantie.

**Deelnemersbescherming en experiment (na ronde 1)**

| Moment | Copy | Waarom zo |
|---|---|---|
| Onderzoeksuitleg (O6) | "Rewarded is in deze pilot ook een onderzoek. Door loting krijg je een van twee bonusregels die evenveel opleveren, een van twee momenten voor de Belofte, soms een extra uitnodiging om een squad te maken, en mogelijk een rustperiode zonder nieuwe punten vanaf het einde van je tentamenweken tot en met de tentamenperiode van april; die kan ook in tentamenweken vallen. Wil je dan toch punten verdienen, dan kan dat altijd, en je blijft in het onderzoek. Je minuutpunten zijn voor iedereen gelijk. De catalogus is klein: je ziet elke week hoeveel beloningen er zijn voor hoeveel studenten. Afmelden voor het onderzoek kan altijd in Ik; je punten blijven." | Geïnformeerde deelname (founder G4, G-S8, J2, J10); de rustperiode-zinnen vervallen als de advocaat de arm niet toestaat |
| Afmelden (P1) | "Je doet niet meer mee aan het onderzoek. Vanaf morgen heb je de gewone bonusregel en verdien je gewoon punten. Je punten blijven staan." | Zonder verlies, zonder schuldtaal |
| Tentamendag (F10) | "Tentamen vandaag? Dan telt je dagdoel vandaag niet mee. Je streak breekt niet en je joker blijft over. Succes." | Spec 3.13 |
| Nachtregel (F1, F5) | "Het is laat. Deze sessie telt, maar zonder doelbonus. Slaap telt ook." | Founder GS9; rustig, geen verwijt |
| Puntenplafond (F5) | "Je zit op 5 uur vandaag. Meer focus telt voor je dagdoel, maar levert vandaag geen punten meer op. Rust telt ook." | Founder G4 |
| Hulpkaart (H1) | "Je hebt de laatste tijd veel en laat gefocust. Goed bezig is ook goed slapen. Wil je met iemand praten? Hulp bij jouw instelling." | Spec 3.15; geen diagnose, geen sanctie |
| Streakherstel (Q1) | "Pak je streak terug met twee dagen op rij." Gelukt: "Streak terug: 12 dagen." | Founder GS5 |
| Rustperiode (B7, F1) | "Van [datum] tot en met [einde aprilvenster] verdient jouw squad geen nieuwe punten; wil je toch punten verdienen, tik dan op Ik wil weer punten verdienen, dan verdien je vanaf morgen weer en blijf je gewoon in het onderzoek. Je punten blijven staan en zijn in te wisselen. Focussen telt gewoon voor je dagdoel, je streak en je squad." | Spec 3.16; uitweg in dezelfde zin (founder J2); vooraf aangekondigd |
| Herhaalbericht (F11, eerste dag van het aprilvenster) | Dezelfde tekst als "Rustperiode" hierboven, met dezelfde knop, één keer. Geen kop als "Herinnering", geen telling, geen mail | Jurist should-fix 4 na ronde 3; spec 3.16 stap 6; dezelfde woorden zodat het een vast onderdeel van de behandeling is |
| Aansluiten bij een rustsquad, uitbreidingscohort of `16_17` (Q9) | "Deze squad verdient tot en met [einde aprilvenster] geen nieuwe punten, omdat ze meedoet aan een onderzoek. Jij verdient gewoon punten." | Jurist should-fix 3 en G-S2 na ronde 3; vervangt de squadregel uit ronde 2 |
| Aansluiten bij een rustsquad, deelnemer na T − 6 in de doorlopende groep (Q9) | "Deze squad verdient tot en met [einde aprilvenster] geen nieuwe punten. Jij houdt je eigen groep en blijft gewoon punten verdienen." | G-S2; de groep hoort vanaf de bekendmaking bij de persoon |
| Overstappen uit de rustgroep naar een squad die punten verdient (Q9) | "Je zit in de groep die tot en met [einde aprilvenster] geen nieuwe punten verdient. Stap je over naar deze squad, dan verdien je vanaf morgen weer punten. Dat telt als 'Ik wil weer punten verdienen': je blijft in het onderzoek en verliest niets." [Overstappen] [Annuleer] | G-S2; gebruiksvoorwaarden §6.4; geen aandringen in beide richtingen |
| Tweede Belofte-aanbod (Q5, vroege arm) | "Volgende week beginnen je tentamens. Wil je jezelf iets beloven voor de komende twee weken?" | G-S10 na ronde 3; dezelfde tekst voor iedereen in de vroege arm |
| Vingerafdruk instellingsmail (P1) | "We bewaren dat je het bevestigde, het domein en een versleutelde vingerafdruk van het adres, zodat één adres maar één account kan bevestigen. Het adres zelf bewaren we niet." | Jurist should-fix 1 na ronde 3; dezelfde woorden als gebruiksvoorwaarden §8.4 |
| Competentiefeedback (F5, weekprestatie) | "Je focusduur steeg van 25 naar 40 minuten." | Spec 4.14 (Should); alleen bij een stijging, geen punten |
| Voorraad (B1) | "Deze week 40 beloningen voor 120 studenten die mogen verzilveren." | Spec 3.4 stap 2 (founder J10) |
| Squadprompt (F1, sterke arm) | "Focus samen met 2 vrienden. Squads houden het beter vol. Deel je link." | Geen punten, geen schaamte |
| Wachttijd (B1) | "Je eerste verzilvering kan vanaf [datum]. We kijken kort mee, zoals bij iedereen." | Founder J3; niet verdacht maken |

**Verdiende prijs, kaart, referral en herinneringen**

| Moment | Copy | Waarom zo |
|---|---|---|
| Verdiende prijs (V3) | "Haal elke dag van de tentamenweek 120 minuten en je verdient [beloning], gefinancierd door [partner]. 20 plaatsen. Verdiend. Winnaars controleren we vóór uitreiking." | Rapport 04 §5 regel 3 |
| Kaart (K1) | "Je kaart toont je focustijd, en als je dat wilt je voornaam en je streak. Delen levert niets op; het is gewoon leuk." | Spec 4.8 |
| Verificatiepagina (K2, voorstel aan spec 4.8) | "Deze sessie van 50 minuten op dinsdag 12 januari stond zichtbaar op het scherm van één browser. Dat bewijst niet dat er geen ander apparaat gebruikt is en ook niet wat er geleerd is." | Kloktijden met een voornaam kunnen het dagritme van een 16-jarige openbaar maken |
| Referral, uitleg (R1) | "Begint een vriend via jouw link en doet hij binnen 7 dagen drie sessies van 25 minuten? Dan krijgen jullie allebei 150 punten. Geen geld. Delen zelf levert niets op. Hoogstens de helft van een beloning kan uit referralpunten komen, en hoogstens 5 vrienden per maand tellen mee." | Spec 4.9; geen "nodig uit en verdien" |
| Referral, voortgang | "Joris: 2 van 3 sessies, nog 3 dagen." / "Joris: klaar. 150 punten voor jullie allebei." | Spec 3.11 stap 2 |
| Referral, verlopen (`referral_lapse`) | Rij: "Joris: niet vrijgekomen." Geen melding | Spec 3.11: verval is stil; geen verwijt naar jou of je vriend |
| Herinnering, voorstel (F1) | "Wil je een herinnering om 20:00, de tijd van je eerste sessie? Hoogstens één mail per dag, alleen als je dagdoel nog open staat." [Ja, om 20:00] [Andere tijd] [Nee, dank je] | Opt-in met bevestiging, standaard uit |
| Later vandaag (O10) | "Geen tijd nu? Kies wanneer we je één keer herinneren, vandaag nog." | Route terug binnen het activatievenster van 24 uur |
| Mail, dagdoel | Onderwerp: "Je dagdoel staat nog open." Tekst: "Het is 20:00, de tijd die je koos. Je dagdoel van 25 minuten staat nog open; je dag loopt tot 04:00. [Start een sessie]" Voet: "Je krijgt deze mail omdat je een herinnering aanzette. [Geen herinneringen meer]" | Geen verliesframing; uitschrijven in één klik |
| Mail, squad | Onderwerp: "Je squad is bezig vandaag." Tekst: "Mila en Daan haalden hun dagdoel al. Jij ook? [Start een sessie]" | Vervangt "streak in gevaar" uit spec 8; geen dreiging, alleen een feit |
| Mail, eerste sessie (O10) | Onderwerp: "Je eerste sessie." Tekst: "Je wilde vandaag om 19:00 beginnen. 25 minuten is genoeg. [Start je eerste sessie]" | Eén keer, binnen 24 uur |
| Dashboardkop | "Je ziet groepscijfers. Wie wat doet, zie je niet, en wij ook niet zonder reden." | Spec 4.6, 4.11 |

### 6.3 Checklist voor elke schermtekst

Staat de beloning na focus en squad? Is elk getal echt of als fictief gemarkeerd? Klopt elke zin over wat we bewaren of wat anderen zien met de spec? Staat er een eurowaarde bij punten? Staat "verdiend" alleen bij een prestatie, en staat "kans" nergens? Noemt deze tekst 18+-prijzen op een scherm dat `16_17` kan zien? Speelt de tekst op sociale schaamte (wie niet meedoet, wie achterblijft)? Belooft de tekst herstel, voorraad of een uitkomst die het systeem niet waarmaakt? Is er een woord dat schaamte, schaarste of urgentie oproept? Is elke uitgeschakelde knop voorzien van een reden? Een nee op de eerste drie vragen of een ja op een van de laatste zes houdt de tekst tegen; voor de laatste vraag is "nee" het foute antwoord.

---

## 7. Open vragen

Elke vraag heeft een eigenaar en een datum. "Ontwerper" ben ik; "spec" is de auteur van rapport 05; "architectuur" de auteur van rapport 07.

1. **Weergave van arm B (jurist, vóór 25 november).** Spec 5 en open vraag 5 van de spec laten de jurist toetsen of het slinkende weekbudget een dark pattern is. De Bonusregel houdt de copy feitelijk en gelijk van vorm aan arm A, maar of een zichtbaar dalend getal ("nog 100") al te veel druk geeft, test ik met vijf studenten vóór de pilot. Valt de juridische toets negatief uit, dan vervalt arm B en krijgt iedereen arm A (spec 5); de Bonusregel blijft dan staan met de tekst van arm A.
2. **Live aanwezigheid standaard aan of uit (besloten na ronde 1).** Standaard aan voor `18_plus`, standaard uit voor `16_17` met de schakelaar in O5a (founder G4, J5).
3. **Eindsignaal en toesteltest (ontwerper en frontend, test vóór 2 december; besluit over H9 door founder en spec, 2 december).** Te testen op minstens één iPhone (Safari en Home Screen-app, stille modus aan en uit) en drie Android-toestellen, waarvan minstens twee merken met een zak- of omdraaimodus, plus de webviews van Instagram en WhatsApp: speelt de toon af na ontgrendelen van de `AudioContext` bij [Begin]; dempt de stille modus haar; is het witte eindscherm onder een omgekeerde telefoon zichtbaar; dooft het omdraaien het scherm; werkt Wake Lock (spec open vraag 10; rapport 09 §3.1). Voorstel aan de spec: `signal_played` in `session_completed`, `device_class` en laatste `wakelock_state` in `session_aborted`, en H9 pas actief zodra het signaal op de testtoestellen werkt, alleen voor sessies met signaal. Werkt het signaal op iOS niet betrouwbaar, dan telt H9 voor iOS-sessies niet mee tot er een oplossing is.
4. **Privacy van de 18e verjaardag (jurist, vóór 25 november).** De copy in O5 volgt nu spec 4.10: wie jonger is dan 18, laat de dag van 18 worden achter, en daaruit volgt de geboortedatum exact. Dat is eerlijk gezegd, maar niet minimaal. Alternatief voor de jurist en de spec: bewaar alleen de eerste dag van de maand na de 18e verjaardag. Dan is de tekst "niet je geboortedatum" wel waar, en wisselt de klasse hoogstens een maand te laat (wat 18+-onderdelen alleen later toegankelijk maakt, nooit te vroeg). Kiest de jurist dat, dan passen O5, P2, de privacyverklaring en spec 4.10 tegelijk aan.
5. **Duel buiten de squad (besloten na ronde 1).** Alleen tussen 18-plussers, op gehaalde dagdoelen.
6. **Akkoord en experiment voor 16–17 (jurist, vóór 25 november).** 16- en 17-jarigen krijgen altijd arm A en doorlopende punten; volstaat de onderzoeksuitleg in O6 dan voor hen, of is extra informatie nodig? De uitleg noemt nu alle vier de factoren, ook de Belofte-arm.
7. **Redencodes voor besluiten (spec, vóór 25 november).** Mijn lijst in §6.2 is een voorstel; spec 4.11 moet de vaste lijst vastleggen, zodat beheeromgeving en copy dezelfde codes gebruiken.
8. **Code van 6 cijfers naast de magic link (architectuur, vóór 25 november).** De code hangt aan dezelfde rij als de link (rapport 07, `auth_magic_link`, 15 minuten geldig), met een eigen hash en een begrenzing van pogingen. Test in de matrix van vraag 3 ook: link uit de mail geopend in Safari terwijl de student in de Home Screen-app zit, en in de webviews van Instagram en WhatsApp.
9. **Lang indrukken voor Stoppen (ontwerper, test vóór 2 december).** Eén tik opent het modaal (F4); lang indrukken is een snelkoppeling. Meldingen "per ongeluk gestopt" in F7 zijn het signaal.
10. **Nieuwe events (spec, vóór 25 november).** Voorstel aan spec 7.1: `signal_played` (eigenschap), `reminder_scheduled`, `reminder_settings_changed`, `reminder_sent`, `reminder_opened`, `belofte_witness_viewed`, en `device_class` plus `wakelock_state` op `session_aborted`.
11. **Afwijkingen van de spec in het belang van privacy (spec en jurist, vóór 25 november).** K2 zonder kloktijden (spec 4.8 noemt "van 14:02 tot 14:52") en D2 afgerond op vijftallen (spec 4.6 noemt "per dag"). Beide zijn voorstellen; tot een besluit bouwen we de privacyvriendelijke variant.
12. **(Vervallen) Bevestiging per spel.** Trekkingen worden niet gebouwd.
13. **Toon bij `16_17`.** Moet de copy voor 16- en 17-jarigen anders zijn dan voor ouderen, behalve de regel over de gewone bonusregel in O6 en de stille modus? Mijn aanname: nee, want de doelgroep is hbo/wo en de toon is al zonder druk.
14. **(Vervallen) Kans als getal.** Trekkingen worden niet gebouwd.
19. **Hulpbronnen per instelling (founder, vóór 2 december).** De hulpkaart H1 linkt naar de hulpbronnen van de eigen instelling; die moeten per pilotinstelling worden verzameld en in de beheeromgeving staan. Zonder bron: een algemene tekst die naar de huisarts en de studentendecaan verwijst.
20. **Vragenlijst op één scherm (onderzoeker, vóór 2 december).** Of het gekozen welzijnsinstrument op één telefoonscherm past, hangt af van het aantal items; anders twee schermen, nooit meer. Dat geldt ook voor P8 met de motivatie-items.
21. **Herhaalbericht als kaart of als scherm (ontwerper, vóór R3).** F11 is een kaart bovenaan F1, zoals het eerste rustperiodebericht, niet een modaal; een modaal zou aandringen. Te toetsen met een of twee studenten of de kaart opvalt zonder te duwen.
22. **Weekitems voor `16_17` (advocaat 9a, vóór de eerste uitnodiging).** De kaart P7 toont de set die de app voor de leeftijdsklasse kiest; verandert de uitkomst van 9a, dan vóór de eerste uitnodiging en niet tijdens de pilot.
15. **Naam en merkkleur.** De naam is een open punt tot de merkentoets (rapport 04 §3). Het designsysteem gebruikt geen woordmerk in componenten, zodat een naamswissel alleen het logo en de teksten raakt.
16. **Illustraties.** Geen illustraties voor lege toestanden. Als tests laten zien dat lege schermen kaal aanvoelen, is een kleine set lijntekeningen in de stijl van 5.6 een optie na de pilot.
17. **Installatie-uitleg PWA en webpush.** Spec 8 heeft een Could voor installatie-uitleg en webpush. Waar de uitleg in de flow hoort (na de eerste voltooide sessie of in F2) hangt af van de test in vraag 3; webpush volgt dezelfde regels als de mail (scherm P5).
18. **Bestuursdashboard op de telefoon.** Ontworpen voor laptopbreedte. Uit het werk met besturen moet blijken of ze het vooral op de telefoon openen; dan krijgen D1 en D3 een eenkoloms variant.

---

## 8. Wijzigingslog

**4 november 2026, versie 1.1 (herziening na tegenlezing).**

- O5 en mockup 02: de zinnen over trekkingen en 18+-prijzen geschrapt; nieuwe tekst "Rewarded is er vanaf 16 jaar. We vragen je geboortedatum om te bepalen welke onderdelen je ziet." Principe P10 en de checklist in 6.3 uitgebreid met schermen vóór de leeftijdscheck.
- Privacytekst bij de leeftijd gecorrigeerd naar wat spec 4.10 bewaart (route a); route b (eerste dag van de maand na de 18e verjaardag) als open vraag aan de jurist.
- Eindsignaal toegevoegd: zachte toon standaard aan, wit eindscherm F3e, audio ontgrendeld bij [Begin], `signal_played` als voorstel, H9 afhankelijk van de toesteltest (open vraag 3).
- Toets van principe P1 herschreven; component Bonusregel gedefinieerd voor beide armen; F1 en F5 voor arm A en B als mockup; B1 splitst "in afwachting" in "Weekbudget (nog niet veilig)" en "Wordt nagekeken".
- Offline-copy beperkt tot wat spec 4.1 waarmaakt, met de grens van 5 minuten in de sessie, O8 en F9; de app-brede strook belooft niets over sessies.
- F7 per afbreekcode, met herstelbelofte alleen bij `heartbeat_gap`, `late_end` en storingen; copy voor alle vijf codes, alle zes blokkeerredenen en een voorstel voor redencodes van besluiten.
- Rustdag-joker, Belofte met getuigen (Q1, Q7), duelbadge en mockups van Q5 en Q6 toegevoegd.
- Herinneringen: scherm P5, voorstel na de eerste sessie, [Later vandaag] in O10, vaste mailcopy zonder verliesframing, nieuwe events als voorstel.
- Magic link: code van 6 cijfers in de mail, uitnodiging gebonden aan de serveraanvraag, webviews en iOS-PWA in de testmatrix.
- Referral: scherm R1, verdeling in B2, stille verval-status.
- Trekkingen: schakelaar "Meedoen aan trekkingen" in B5 en P1 met `draw_opt_out`; geen melding bij de 18e verjaardag; bevestiging per spel als open vraag.
- Zichtbaarheidsregel in O1 en Q2; duel buiten de squad onder voorbehoud, met terugvaloptie.
- Android-zakmodus als aanname met testplan, eigenschappen per afbreking en een terugvalinstructie achter een vlag.
- Mockups semantisch gemaakt (knoppen, keuzerondjes, schakelaars, `aria-current`, gevulde actieve tab, tikvlak van 48 px voor tekstlinks, geen `role="img"` op schermen); snippets per component in §5.8.
- Prioriteitentabel van de schermen (§3.0); mockups van O6, F7, F8, Q5, Q6 en arm A/B toegevoegd.
- Microcopy: `user_stop`, inverdienuitleg, "weekdoel" en voorraadaanvulling aangepast; klavertje vervangen door een lot.
- Squadnoemer op actieve leden, gepauzeerde leden apart.
- Tokens `session-accent`, `session-track`, `session-surface`, `end-bg`/`end-text`, `card-share-bg` en `shadow-sheet` toegevoegd; dashboard op vijf tabbladen; "Blokchallenge" gespeld zoals in het businessplan; financier bij de hoofdprijs; voornaam en streak op de kaart uitschakelbaar; badge "Fictief" op elk mockupscherm.
- K2 zonder kloktijden, D2 afgerond op vijftallen (beide voorstellen aan de spec), aria-live in F3 standaard alleen bij het einde, bevestiging bij een datum onder 16, laptopkop in O1.

**4 november 2026, versie 1.0.** Eerste versie.

**5 november 2026, versie 1.2 (ronde 1, na pitchronde 1).** Herzien volgens de bindende besluiten in `docs/pitch/ronde-1-founder-reactie.md`.

- Trekkingen vervallen (J4, S9): B5, B6, de kans-kleur, de schakelaar "Meedoen aan trekkingen", flow 4.7 en de trekkingscopy geschrapt; principe P10, de componenten en de checklist in 6.3 aangepast; "Verdiend, niet verloot" wordt "Verdiend".
- Dagdoel en weekprestatie voorop, punten klein en onderaan in F5; catalogus met collectieve en symbolische beloningen bovenaan (GS1).
- Deelnemersbescherming (G4, J5): O5a met live aanwezigheid standaard uit voor `16_17`; O6 met onderzoeksuitleg en afmelden zonder verlies van punten; O6b en S1 korte vragenlijsten; F10 tentamendag; H1 hulpkaart bij een schadesignaal; nachtregel en puntenplafond van 300 minuten in F1 en F5 (GS9); checklistvraag tegen schaamtecopy.
- Experiment (G1, G2): squadprompt als kaart op F1 in de sterke arm; Belofte-aanbod bij de stop van de doelbonus en na april (Q5, 4.10); rustperiode in F5 en B7 met bekendmaking.
- Squads (GS2, GS5, JS11): streakherstel in Q1, nieuw scherm Q8 voor hersamenstellen, meldknop voor squadnamen.
- Duels op gehaalde dagdoelen en buiten de squad alleen tussen 18-plussers (GS4, JS3).
- Vereniging (J2): ledental met soort bron naast elke vereniging in V1 en D1, regel over het instellingsanker, D2 per week met aandeel verankerde leden; instellingsmail in P1.
- Verzilvering (J3): wachttijd op de eerste verzilvering, gespreide vrijgave ("Vandaag op"), alleen mobiele nummers in B3.
- Nepdeur Plus als B8 (S3); prioriteitentabel uitgebreid met rij 1b; open vragen 2, 5, 6, 12–14 bijgewerkt, nieuwe vragen 19–20.

**5 november 2026, versie 1.2 (ronde 1, eindredactie).** Gelijkgetrokken met de aanvulling van de founder na de samenhangcontrole (`docs/pitch/ronde-1-founder-reactie.md`, 5 november) en spec 1.1.

- Belofte-aanbod in de vroege arm op 11 januari 2027 voor iedereen, niet per vereniging (Q5, flow 4.10) (G1).
- Rustperiode van 19 januari tot en met 31 maart 2027 in O6, F5, B7 en de microcopy; bekendmaking uiterlijk 11 januari (G1).

**Ronde 2 — 4 november 2026, versie 1.3.** Herzien volgens de bindende besluiten in `docs/pitch/ronde-2-founder-reactie.md` en spec 1.2.

- Data per instelling (besluit 1, G1): in O6, Q5, flow 4.10, B7 en de microcopy staan de bonusstop, het Belofte-aanbod en de rustperiode als [datum] uit de tentamenkalender van de vereniging; de vaste data 11, 18 en 19 januari en 31 maart vervallen.
- Rustperiode tot en met het aprilvenster met de uitweg in dezelfde zin; nieuw scherm P6 "Weer punten verdienen", gescheiden van afmelden in P1; squadregel voor het uitbreidingscohort als microcopy vóór het aansluiten; Q8 toont alleen squads in dezelfde rustperiodegroep (besluit 3, G2, G-S8, J2).
- Q8 alleen binnen de tentamenperiodes (G-S6); hernieuwingsaanbod in de Belofte-reflectie (G-S4); competentiefeedback in F5 en de weekprestatie (G-S13).
- Nieuw scherm P7 voor de wekelijkse vraag van twee items (G4).
- B1 toont de voorraad naast het aantal studenten dat mag verzilveren; schaarste in de onderzoeksuitleg (J10).
- Bestuursdashboard: "focustijd die telde (Rewarded zichtbaar op het scherm)" met het verificatieniveau bij elk cijfer; "geverifieerd" niet op het dashboard (J3).
- Steekproefcontact via een kaart "Bevestig je instellingsadres" in P1 (J4).

**Ronde 3 — 5 november 2026 (versie 1.4).** Herzien volgens de bindende besluiten in `docs/pitch/ronde-3-founder-reactie.md` (gedateerd 5 november), gelijk met de spec (versie 1.3), het productplan v4, de voorregistratie (ronde 3) en de architectuur (versie 1.4).

- Nieuw scherm F11: het herhaalbericht met de uitweg uit de rustperiode op de eerste dag van het aprilvenster, één keer, als kaart en niet als modaal (jurist should-fix 4).
- Nieuw scherm Q9: aansluiten bij een squad in de rustperiode, met drie teksten (uitbreidingscohort of `16_17` verdient zelf punten; deelnemer houdt zijn groep; overstap uit de rustgroep telt als "Weer punten verdienen"); de squadregel-copy uit ronde 2 vervalt (jurist should-fix 3, G-S2).
- O6: de groep hoort vanaf de bekendmaking bij de persoon; extra zin voor `16_17` (G-S2).
- P1: instellingsmail met de versleutelde vingerafdruk, de melding bij een adres dat al bij een ander account hoort en de herbevestiging vóór 4 januari (jurist should-fix 1).
- P7: weekitems per leeftijdsklasse, voor `16_17` studietijd en afleiding zolang vraag 9a niet positief is beantwoord (jurist should-fix 8). Nieuw scherm P8: korte vragenlijst met motivatie-items en niet-beloond studeren in N en na april (G-S3).
- Q5: tweede Belofte-aanbod in de vroege arm een week vóór het aprilvenster, met eigen copy (G-S10).
- §6.2: microcopy voor F11, Q9, het tweede Belofte-aanbod en de vingerafdruk.
- §7: open vragen 21 en 22.
- Data in de copy komen uit de kalender van de vereniging of faculteit, of uit de standaardkalender (G-MF3).
- Mockups versie 1.4: drie nieuwe schermen (F11, Q9 bij een overstap, P1 met de instellingsmail).

**Ronde 3, eindredactie — 5 november 2026 (versie 1.4).** Gelijkgetrokken met spec 3.16, de voorregistratie en de gebruiksvoorwaarden na een onafhankelijke samenhangcontrole, volgens `docs/pitch/ronde-3-founder-reactie.md`. Kopregel en ronde-3-log gedateerd op 5 november, de datum van de founder-reactie.

- B7, F11, Q9, P1, P6 en de microcopy in §6.2: de knoptekst van de uitweg is overal "Ik wil weer punten verdienen", in de woorden van het besluit van de founder en de voorregistratie (jurist should-fix 4). Het herhaalbericht in april gebruikt dezelfde knop.
- Mockups (schermen 21 en 22) met dezelfde knoptekst.
