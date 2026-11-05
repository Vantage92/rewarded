# Pitchronde 1 — Beoordeling gedragswetenschapper en productveteraan

*Beoordelaar: gedragswetenschapper (veldexperimenten met prikkels) en productveteraan. Datum: 4 november 2026. Ronde 1 van maximaal 3; er zijn geen eerdere beoordelingen.*

*Gelezen: `docs/pitch/pitch.md`, `docs/01-businessplan.md`, `docs/02-productplan.md`, `docs/pitch/README.md`, `docs/research/08-gedragswetenschap.md` (volledig), `docs/research/05-productspecificatie.md` (hoofdstukken 1, 3.4–3.12, 4.2–4.6, 4.12, 5, 7, 8, 9, 10) en ter controle van de pilotomvang en benchmarks delen van `docs/research/03-viral-en-tractie.md`. Ik heb geen eigen webonderzoek gedaan; waar ik naar studies verwijs, steun ik op rapport 08, dat door drie sceptici is geverifieerd. Mijn bezwaren gaan vooral over de vraag of het ontwerp doet wat het bewijs zegt en of de pilot meet wat hij belooft te meten. Rekenvoorbeelden zijn als inschatting gemarkeerd.*

---

## Oordeel: GO MET VOORWAARDEN

Dit is het zorgvuldigste plan voor een beloningsapp dat ik in deze categorie heb gezien. Het team leest het bewijs eerlijk: het weet dat geldprikkels wegzakken, het kiest inputs boven outputs, het houdt individuele vergelijking klein en opt-in, het heeft geen pool en het verdient niet aan falen. Dat is meer dan de meeste concurrenten.

Toch meet de pilot zoals hij nu is ontworpen niet wat de pitch zegt dat hij meet. De kernbelofte van het bedrijf is dat de beloning een steiger is naar squads, streaks en zelfgekozen commitment. Die belofte valt in deze pilot niet te weerleggen:

- de beloning stopt nooit, want de ratio van 1 punt per minuut loopt door;
- de Belofte wordt midden in de prikkelperiode aangeboden en niet op het moment dat de prikkel afloopt;
- het nawerkingsvenster ligt in de twee weken na de tentamens, valt samen met de publieke lancering en komt na het lanceringsbesluit;
- de belangrijkste go/no-go-maat voor de sociale loop (D7 van squadleden tegenover solo) wordt vooral door zelfselectie bepaald.

Bouwen kan doorgaan. Bijna alles wat hieronder staat, is een wijziging in het pilotontwerp en de voorregistratie, niet in de code. Die wijzigingen moeten wel vóór 2 december vastliggen, want daarna kunnen ze niet meer. Zonder de must-fixes levert de pilot data op die aan beide kanten verkeerd gelezen worden: een "go" die de seizoensvraag naar focus meet, of een "geen nawerking" die een vloereffect na de tentamens meet.

---

## Scoretabel

| Criterium | Score | Motivering |
|---|---|---|
| Probleem en doelgroep | 7 | Echt en goed afgebakend: tentamenweken, studieverenigingen, twee steden. Het nadeel is dat het een **seizoensbehoefte** is. Tussen tentamenperiodes zakt de vraag bij alle gebruikers tegelijk weg. De plannen behandelen dat als storing (kerstcorrectie), terwijl het de basisvorm van de retentiecurve van deze doelgroep is. |
| Oplossing en gedragseffect | 4 | Het bewijs (rapport 08) ondersteunt meer focusgedrag *zolang* de prikkel loopt. Dat het na week drie blijft staan, is de centrale claim. Het product test dat niet zuiver (must-fix 1) en meet uitsluitend de beloonde handeling zelf: geverifieerde minuten in de app. Of de student minder afgeleid is of meer studeert, wordt nergens gemeten. |
| Beloningsmodel | 5 | Vanuit gedrag gezien: verstandig begrensd (geen geld, direct, plafonds, inverdienperiode). Maar de kern is een lineair stukloon per minuut, wat rapport 08 juist afraadt (§7, toelichting), en de catalogus maakt een uurloon in centen zichtbaar (should-fix 1). Of het model legaal is, laat ik aan de jurist. |
| Groei | 5 | Squads als motor zijn plausibel. De pilotcohort is echter een gecureerde wachtlijst met voorrang voor squads, geworven via verenigingen tijdens tentamens. Een K ≥ 0,3 en een squadaandeel ≥ 40% in die groep zeggen weinig over de lancering. Squads vallen ook gecorreleerd uiteen: na het laatste tentamen stopt de hele squad tegelijk. |
| Unit economics | 5 | Buiten mijn kern. Gedragsmatig valt op dat de gratis laag (ca. €0,19 marge) een beloning moet blijven betalen waarvan het plan zelf zegt dat die moet afbouwen. Het scenario waarin de catalogus krimpt en de retentie meekrimpt, is niet doorgerekend en wordt niet getest. |
| Verdediging | 4 | Het gedragsmechanisme (squad, streak, belofte, verenigingsranglijst) is in een kwartaal na te bouwen door Forest, Opal of een studieplatform. Wat verdedigbaar zou zijn, is bewezen nawerking en de verenigingsrelaties. Het eerste levert deze pilot niet. |
| Uitvoerbaarheid | 5 | R1 over vier weken met een 2×2-toewijzing, armwisselregels, vakantiepauze, fraudewachtrij en een volledige eventtaxonomie is krap. Het risico is niet dat functies wegvallen (de schrapvolgorde is goed), maar dat de experimentinfrastructuur onder tijdsdruk stil fouten maakt in toewijzing of logging. Er is geen dry-run of A/A-controle gepland. |
| Risico's | 5 | Juridische en fraude-showstoppers zijn goed benoemd. Gedragsmatige en ethische risico's ontbreken in de risicotabel: druk in de tentamenweek, nachtwerk, minderjarigen in een gerandomiseerd verliesexperiment, studenten die er slechter van worden. Bij "het effect zakt weg na de beloning" staat als maatregel dat het "de kern is en wordt gemeten". Dat is geen maatregel, en het wordt nu niet zuiver gemeten. |

---

## Implementeert het product de ontwerpprincipes, of benoemt het ze alleen?

| # | Principe uit rapport 08 §7 | Status | Opmerking |
|---|---|---|---|
| 1 | Beloon inputs, geen outputs | **Geïmplementeerd** | Geverifieerde minuten, geen cijfers. |
| 2 | Direct belonen | **Geïmplementeerd** | Bijschrijving bij het einde van de sessie, ook in arm B. |
| 3 | Geen kleine geldbedragen; punten zonder geldwaarde | **Half** | Punten tonen geen eurowaarde, maar de catalogus met items ≤ €5 en een vaste puntenprijs maakt de omrekening triviaal. Een koffie van €3 voor een paar honderd punten is voor een student een uurloon in centen: precies de gevarenzone uit Gneezy en Rustichini. De euro verbergen voorkomt de mentale omrekening niet. |
| 4 | Terugkombonus na een misser, streak met herstel | **Half** | De joker (automatisch, één per week) dempt een breuk. De terugkombonus uit Milkman 2021 is bewust geschrapt (spec 10.4). Na de tweede misser in een week breekt de streak zonder herstelroute, terwijl Silverman en Barasch juist herstel aanbevelen. |
| 5 | Inzet opt-in, beloning als standaard | **Geïmplementeerd** | Inzet buiten de MVP; alleen een interessevraag. |
| 6 | Verliesframing zonder eigen geld | **Geïmplementeerd als arm** | Correct nagebouwd met gelijke verwachte waarde. Patel 2016 werkte met dollars en vond geen nawerking. De pitch belooft dat de arm "beter vasthoudt", maar dat voorspelt het bewijs niet. |
| 7 | Verdringing voorkomen: zelfgekozen doel, competentiefeedback, modus zonder geld | **Grotendeels benoemd** | Het dagdoel is zelfgekozen (goed). De "modus zonder punten" is Could (spec §8) en kan dus wegvallen. Competentiefeedback zoals "je focusduur steeg van 25 naar 40 minuten" staat niet als functie in de spec. H-E (verdringing) wordt niet gemeten: geen korte SDT-schaal, geen meting buiten de app. |
| 8 | Effect behouden: na een introductieperiode commitment aanbieden | **Benoemd, verkeerd getimed** | Royer e.a. boden het contract aan *bij het einde* van de prikkel. Rewarded biedt de Belofte aan op dag 14, terwijl de doelbonus nog vijf weken doorloopt. Zie must-fix 1. |
| 9 | Kleine teams, geen openbare individuele ranglijst | **Geïmplementeerd** | Met één kanttekening: duels op minuten tot 480 per dag belonen volume en niet regelmaat (should-fix 4). |
| 10 | Geen cognitieve claims | **Geïmplementeerd** | — |
| — | Minimaal 8 weken interventie en 8 weken follow-up (rapport 08, hypotheses) | **Niet geïmplementeerd** | Effectief zijn er vijf actieve weken (2–20 december, 4–18 januari) met twee weken kerst ertussen, en een nawerkingsvenster voor de Belofte van twee weken. Voor gewoontevorming noemt Lally e.a. gemiddeld 66 dagen. |
| — | Lineair stukloon per minuut vermijden; belonen als bevestiging van een zelfgekozen weekdoel | **Tegengesteld geïmplementeerd** | Rapport 08 §7: "beloon inputs, maar koppel ze aan een zelfgekozen weekdoel in plaats van aan een lineair stukloon per minuut". Het product maakt juist 1 punt per minuut tot de bindende kern en het enige wat na het seizoen overblijft. |

Kort gezegd: de vorm van het bewijs is overgenomen (input, direct, klein verband, opt-in), maar op de twee punten die over verdringing en nawerking gaan, de structuur van de beloning en het moment van het commitmentaanbod, wijkt het ontwerp af van wat het eigen rapport aanbeveelt.

---

## Must-fix

### 1. De centrale hypothese (beloning als steiger naar commitment) is in dit ontwerp niet toetsbaar

**Wat er staat.** Pitch: "na een week zonder beloning blijft minstens een derde van het effect staan". Productplan §8 en spec 7.3: de Belofte vroeg (dag 14) tegenover laat (1 februari), gemeten als geverifieerde minuten per week in 18–31 januari. De doelbonus stopt op 18 januari; daarna "blijft alleen de ratio" (spec 4.2).

**Waarom dit de pilot ongeldig maakt.**

- **Er is geen week zonder beloning.** Na 18 januari loopt 1 punt per minuut gewoon door, inclusief catalogus. Wat stopt, is alleen de doelbonus van 20 punten per dag. Wat je meet, is het effect van het wegvallen van een bonus bovenop een doorlopende beloning, niet het afbouwen van de steiger.
- **"Een derde van het effect" vraagt een controlegroep zonder prikkel.** Allcott e.a. 2022, waar de "een derde" vandaan komt, vergeleek met een groep zonder bonus. Rewarded heeft geen arm zonder beloning; de modus zonder punten is zelfgekozen en Could. Het "effect" waarvan een derde moet blijven staan, is dus niet gedefinieerd.
- **De Belofte komt op het verkeerde moment.** Voor het cohort van begin december valt dag 14 rond 16 december. De Belofte loopt 14 dagen exclusief vakantiepauze: ruwweg 16–20 december plus 4–12 januari. Ze eindigt dus vóór de doelbonus stopt, en ruim vóór het meetvenster. Het mechanisme van Royer e.a. (commitment als overname bij het einde van de prikkel) wordt niet getest. Getest wordt "ooit in december een belofte gedaan" tegenover "nog niet".
- **Het meetvenster valt in een vloer.** Op 18 januari zijn bij de meeste deelnemers de tentamens voorbij en is het hun eigen reden om te focussen kwijt. In beide armen zakken de minuten naar bijna nul; een verschil tussen armen wordt dan statistisch onzichtbaar. Tegelijk start op 19 januari de lancering, met nieuwe gebruikers in bestaande squads en communicatie die het gedrag verstoort. Het tussen-armen-ontwerp vangt gemeenschappelijke schokken op, maar niet het vloereffect.
- **Het resultaat komt na het besluit dat het moet informeren.** De go/no-go voor de lancering valt op 18 januari. H-B wordt gemeten van 18 tot 31 januari. De "kern van de pilot" (productplan §1) speelt dus geen rol in het lanceringsbesluit.
- **Power (inschatting).** 300–800 gebruikers, waarvan een deel in squads van 3–6 en geclusterd toegewezen. Bij 500 gebruikers en ruwweg 300 toewijzingseenheden ligt het kleinste detecteerbare verschil tussen twee armen rond 0,3–0,4 SD op eenheidsniveau, en hoger bij scheve minutenverdelingen met veel nullen. Nawerking van een zachte commitment zonder geld zal, als ze bestaat, veel kleiner zijn. De spec zegt zelf "richting, geen bewijs". De pitch verkoopt het als "vooraf geregistreerd 2×2-experiment" waarbij "elke hypothese een experimentarm heeft".

**Oplossingsrichting.**

1. Bied de Belofte in de vroege arm aan **bij de aangekondigde stop van de doelbonus** (bijvoorbeeld 11–17 januari, of in de laatste tentamenweek per vereniging), niet op dag 14. Dan test je het Royer-mechanisme.
2. Verplaats de primaire nawerkingsmaat naar een venster met **echte vraag naar focus**: de volgende tentamenperiode (april 2027 bij de meeste instellingen; per vereniging bevestigen). Laat het late aanbod tot na dat venster wachten, of houd een echte controle-arm aan die het aanbod pas na april krijgt. Februari tot en met maart is secundair.
3. Hernoem pitchhypothese 3 tot wat werkelijk wordt getest ("na het einde van de doelbonus"), of voeg een arm toe waarin de catalogus aantoonbaar krimpt of de ratio afbouwt. Een gerandomiseerde, aangekondigde afbouw van de ratio naar nul na het seizoen voor de helft van de squads is de enige manier om "steiger" te toetsen.
4. Laat de poweranalyse (vóór 25 november) een kleinste detecteerbaar effect per hypothese opleveren en zet dat in de voorregistratie. Is dat effect groter dan plausibel, dan heet de hypothese in de pitch "verkennend" en hangt er geen beslissing aan.
5. Koppel het lanceringsbesluit van 19 januari los van H-B en zeg dat expliciet. Of verschuif het besluit over de vervolgstap (fundraising, native app, inzetlaag) naar na de april-meting.

### 2. De vier pitchhypotheses en het meetplan zeggen niet hetzelfde, en hypothese 1 meet vooral selectie

**Wat er staat.**

| Pitch | Meetplan (spec 7.2–7.3) | Probleem |
|---|---|---|
| (1) Squadleden hebben een duidelijk hogere D7 dan solo-gebruikers | D7 van wie op dag 0–2 in een actieve squad zat ÷ D7 van de rest, ≥ 1,5×; de spec noemt het zelf "geen causaal bewijs" | Een go/no-go op een maat waarvan het team weet dat ze niet causaal is. Genodigden komen binnen met een vriend die wacht. Makers "in opbouw" tellen als solo. Wie via een vereniging en een squad komt, is al gemotiveerder. 1,5× wordt vrijwel zeker gehaald, of de squad nu werkt of niet. |
| (2) Een slinkend puntenbudget **houdt beter vast** | Primaire maat: aandeel gebruikersdagen met een gehaald dagdoel *tijdens het seizoen* | De pitch claimt retentie, het meetplan meet inzet tijdens de prikkel. Patel 2016 vond na afloop in geen enkele arm nog effect. |
| (3) Na een week zonder beloning blijft ≥ 1/3 van het effect staan | Minuten in 18–31 januari, Belofte vroeg tegenover laat | Zie must-fix 1: andere factor, geen controle, geen week zonder beloning. |
| (4) < 5% gemarkeerde sessies | < 5% gemarkeerd | Klopt, maar het is een fraudemaat en geen gedragshypothese. |

Businessplan §9 en de pitch zeggen: "geen hogere D7 bij squadleden: de sociale loop is niet echt". Omgekeerd volgt uit een hogere D7 níét dat de sociale loop echt is. Dat is de asymmetrie die de founder moet zien: de toets kan alleen vals positief uitvallen.

**Waarom must-fix.** Een pilot met een go/no-go op een maat die per constructie slaagt, plus claims die niet bij de gemeten maat horen, is als bewijs voor investeerders en verenigingen niet geldig.

**Oplossingsrichting.**

- Schrijf in de voorregistratie per pitchhypothese één primaire maat, de analyse-eenheid, het kleinste detecteerbare effect en de beslisregel. Laat de pitch exact die woorden gebruiken.
- Maak de squadtoets causaler zonder squads te verbieden. Bijvoorbeeld een *encouragement design*: randomiseer per solo-gebruiker of hij op dag 1–3 een sterke, persoonlijke squadprompt krijgt (met een kant-en-klare link en een vriendensuggestie) of de standaardflow. Analyseer D7 en W3 op de toewijzing (ITT en IV). Daarnaast een binnen-persoonsanalyse: minuten in de week vóór en na het actief worden van iemands squad, met de tentamenkalender als covariaat.
- Gebruik de ruwe vergelijking tussen squad en solo alleen beschrijvend en niet als go/no-go.
- Herformuleer hypothese 2 als "meer gehaalde dagdoelen tijdens het seizoen". Retentie wordt een secundaire maat zonder claim.

### 3. De retentiedrempels meten de tentamenkalender, niet het product, en zijn voor de meeste cohorten niet op tijd meetbaar

**Wat er staat.** D7 ≥ 25%, D30 ≥ 12% (kerstgecorrigeerd: 21 december – 3 januari telt niet), benchmarks uit generieke appcategorieën (rapport 03: Health & Fitness 8,5%, Productivity 9,6% D30). Go/no-go op 18 januari.

**Waarom must-fix.**

- **De kerstcorrectie schuift D30 de prijsperiode in.** Voor iemand die op 2 december registreert, is "dag 30" na het overslaan van 14 vakantiedagen kalenderdag 44: ongeveer 15 januari. Dat is midden in de prijsperiode van de Blokk-challenge (4–17 januari), in de tentamenweken en vlak voor het einde van de doelbonus. D30 meet op dat moment de piek van de eigen motivatie van de student plus alle prikkels tegelijk. Dat is het gunstigst denkbare meetmoment, en het zegt niets over wat er na week drie gebeurt zonder externe druk.
- **De maat is voor de meeste cohorten niet beschikbaar op 18 januari.** Alleen wie in de eerste dagen van december registreert, heeft vóór 18 januari een gecorrigeerde D30. Wie op 9 december instroomt, bereikt die pas eind januari. De go/no-go rust dus op een klein vroeg cohort, dat ook het meest gemotiveerd is.
- **De benchmark past niet.** Generieke D30-cijfers gaan over organische installaties zonder vriendengroep, vereniging, prijs of tentamen. Een gecureerde wachtlijstcohort met squadvoorrang die in de tentamenweken via het bestuur instroomt, hoort veel hoger te scoren. "Onze lat ligt bewust hoger" is dus geen strengere lat, maar mogelijk een lagere.
- **Week drie wordt nauwelijks waargenomen.** Er zijn drie actieve weken in december en twee in januari, met twee weken pauze ertussen. "Na de nieuwigheid" bestaat in deze pilot nauwelijks.

**Oplossingsrichting.**

- Leg de go/no-go-cohort vast (bijvoorbeeld registratie 2–13 december) met een kalender per cohort waarop dag 7 en dag 30 werkelijk vallen, en rapporteer retentie altijd op kalendertijd naast relatieve dagen.
- Voeg een **na-seizoensmaat** toe die de vraag van de founder echt beantwoordt: het aandeel van de in januari actieve gebruikers dat in 1–14 februari (geen tentamens, geen bonus, geen prijs) nog ≥ 2 dagen per week een sessie doet, en het aandeel dat in de april-tentamenperiode terugkomt zonder nieuwe challenge. Dat zijn de echte maten voor "na week drie".
- Leid de drempels af van een passende vergelijking. Bijvoorbeeld de squad-encouragement-controle uit must-fix 2, of een vooraf vastgelegde ondergrens per kanaal. Generieke appbenchmarks horen niet in de go/no-go.
- Maak expliciet dat de lancering van 19 januari een besluit op operationele maten is (activatie, fraude, kosten, D7 van het vroege cohort), en dat het bedrijfsbesluit over het gedragseffect na de na-seizoensmaat valt.

### 4. Er is geen bescherming voor de deelnemers aan een gerandomiseerd gedragsexperiment in de tentamenweken: geen welzijnsmeting, geen stopregel, en 16–17-jarigen in de verliesarm

**Wat er staat.** Een 2×2-experiment met een verliesarm, live aanwezigheid standaard aan (ook voor 16- en 17-jarigen, productplan §10), squadleden die zien wie zijn dagdoel niet haalde, streaks, een dagrand om 04:00 "omdat studenten laat werken", punten en duels tot 480 minuten per dag, een dagelijkse herinneringsmail. Welzijn, stress en slaap komen in geen enkel document als meting of risico voor; de enige open vraag over minderjarigen is juridisch (spec open vraag 5, UX open vraag 6). Rapport 03 noemt zelf "sociale druk die ongezond wordt in de tentamenweek" als risico van loop A, en stelt contentideeën voor als "POV: je squad ziet dat jij als enige niet aan het studeren bent".

**Waarom must-fix.** Dit is een veldexperiment op jongeren, deels minderjarig, in hun meest stressvolle weken, waarin één arm bewust verliesaversie aanspreekt en het sociale ontwerp zichtbaar maakt wie achterblijft. Het bewijs zegt expliciet dat prikkels voor sommigen averechts uitpakken (Leuven e.a. 2010: zwakkere studenten; Bursztyn en Jensen 2015: sociale druk). Rapport 08 noemt gokgevoelige, financieel gestreste en overmoedige gebruikers. Zonder meting weet je na de pilot niet of je studenten schaadt. Een investeerder, een universiteit of een journalist die daarnaar vraagt, krijgt dan geen antwoord. Dat maakt het product ethisch onhoudbaar zodra het groeit, en de pilot ethisch ondeugdelijk als experiment.

**Oplossingsrichting.**

1. **Geïnformeerde deelname aan het experiment.** Een korte, eerlijke uitleg dat de pilot twee bonusregels en twee momenten voor de Belofte vergelijkt, met de mogelijkheid tot opt-out zonder verlies van punten. Zet 16- en 17-jarigen standaard in arm A, of sluit ze uit van het experiment (wel van de app), tenzij de jurist en een onafhankelijke ethische toets anders adviseren. Overweeg een lichte toets door een ethische commissie van een partneruniversiteit; dat helpt ook bij publicatie en bij instellingen als klant.
2. **Welzijnsmeting.** Een korte vragenlijst bij instroom, bij de Belofte-reflectie en eind januari: twee à drie items over stress, slaap en ervaren druk van de squad, plus één item over intrinsieke motivatie (gebruik een kort gevalideerd instrument; laat de keuze aan een onderzoeker). Hiermee is ook H-E deels te meten.
3. **Vooraf vastgelegde schadesignalen en een stopregel.** Bijvoorbeeld sessies tussen 01:00 en 04:00 op meerdere dagen achter elkaar, meer dan 6 uur per dag op meerdere dagen, een scherpe daling na een gebroken streak, of supportberichten met een welzijnslabel. Bij een signaal: een zacht bericht met hulpbronnen (studentenpsycholoog van de instelling), geen sanctie. Leg vast bij welk verschil tussen armen arm B stopt.
4. **Ontwerpaanpassingen die geen data kosten.** Een "tentamendag" die het dagdoel zonder joker opschort (op een tentamendag studeer je niet thuis, en arm B verliest nu punten op precies die dag). Een lager puntenplafond per dag (bijvoorbeeld 300 minuten) dan de 480 die nu ook voor punten en duels geldt. Live aanwezigheid voor 16- en 17-jarigen standaard uit. Geen marketing die op sociale schaamte speelt.
5. Zet deze risico's met de maatregelen in de risicotabel van de pitch.

---

## Should-fix

1. **Stukloon per minuut en het zichtbare uurloon.** Het ontwerp wijkt af van rapport 08 §7. Overweeg punten primair te koppelen aan het zelfgekozen dagdoel en de weekprestatie, met minuutpunten als bijzaak. Kies cataloguspuntprijzen en items zo dat een uurloon niet salient is: collectieve, ervaringsgerichte of symbolische beloningen (verenigingsprijs, toegang, iets met de squad) eerder dan een koffievoucher per vijf uur. Test op de wachtlijst of studenten de omrekening spontaan maken.
2. **Squad uit elkaar: wat dan?** De regels voor pauze, bevriezen en archiveren zijn netjes, maar de student met een dode squad zit formeel nog in een squad (één squad per student) en heeft geen route naar een nieuwe. De getuigen van de Belofte zijn dezelfde squad. Gecorreleerd uiteenvallen na het laatste tentamen ondermijnt precies de overgang die de pitch belooft. Voeg toe: squadoverleving als vooraf vastgelegde KPI (aandeel squads met ≥ 2 actieve leden in week 4 en week 8), een route naar opnieuw samenstellen of samenvoegen na 7 dagen met minder dan 2 actieven, en een analyse van Belofte-naleving naar squadstatus.
3. **De uitkomst is de beloonde handeling zelf.** Alle uitkomsten zijn geverifieerde minuten in de app. Wie de app verlaat maar zonder telefoon studeert, telt als verval; wie de app laat lopen zonder te studeren, telt als succes. Meet minstens zelfgerapporteerde studietijd en telefoonafleiding vóór en na (rapport 08, H-G) en vraag verenigingen of instellingen of geaggregeerde studievoortgang achteraf mogelijk is.
4. **Duels op volume.** Duels op minuten tot 480 per dag belonen marathonsessies in de tentamenweek. Laat duels winnen op gehaalde dagdoelen of op regelmaat (de spec wees dat af als "geen criterium", maar het is een welzijnscriterium).
5. **Streakherstel en terugkombonus.** Laat de beste bevinding uit Milkman 2021 niet volledig vallen. Een niet-puntgebonden herstelroute ("pak de streak terug met twee dagen op rij") past bij Silverman en Barasch zonder nieuwe bonusstapeling.
6. **Modus zonder punten van Could naar Should**, en meet wie hem kiest. Het is de enige ontwerpmaatregel voor de intrinsiek gemotiveerde student, en die is in Leuven e.a. en Deci e.a. precies de groep die risico loopt.
7. **Selectie via verenigingen.** Rapporteer alle uitkomsten per instroomkanaal (vereniging, squaduitnodiging, ambassadeur, wachtlijst) en per vereniging. Zorg dat minstens een deel van de pilot buiten verenigingen instroomt, anders is de pilot een studie naar gemotiveerde verenigingsleden met een collectieve prijs. Let erop dat de verenigingsprijs en de ranglijst voor beide armen gelijk zijn: dat is zo, maar het zijn wel krachtige extra prikkels die de gemeten nawerking na 17 januari mede bepalen (de prijs stopt tegelijk met de bonus).
8. **De verliesarm bewaakt zichzelf niet.** Een weekbudget dat elke maandag opnieuw staat, op punten met vage waarde, met wekelijkse "−20"-meldingen: verwacht een klein effect en een mogelijk negatieve beleving. Neem in de reflectie een vraag op over hoe de bonusregel voelde, per arm.
9. **Dagrand 04:00.** Het ontwerp accommodeert nachtwerk als norm. Laat sessies na 01:00 wel tellen, maar zonder doelbonus, en geef een rustig signaal.
10. **Test de experimentinfrastructuur.** Draai vóór 2 december een A/A-controle of een gesimuleerde cohort door de toewijzing, de armwissels en de KPI-query's, en leg de randomisatieseed vast in de voorregistratie.
11. **De pitch overclaimt.** "Elke hypothese heeft een experimentarm" en "vooraf geregistreerd 2×2-experiment" wekken de indruk van een toets. Met 300–800 gebruikers is het een verkennende pilot met één redelijk gepowerde vergelijking (arm A tegenover B op dagdoelen tijdens het seizoen). Zeg dat zo.

---

## Vragen die ik in de partnervergadering zou stellen

1. Als op 31 januari blijkt dat de minuten in beide Belofte-armen naar bijna nul zijn gezakt, hoe weet je dan of de Belofte niet werkt of dat de tentamens voorbij zijn?
2. Wanneer stopt de beloning in jullie plan *echt*? Is er een scenario waarin een student geen punten meer verdient, en wat verwacht je dan?
3. Wat is volgens de poweranalyse het kleinste verschil in minuten per week dat je kunt zien tussen vroeg en laat, en is dat realistisch voor een belofte zonder geld?
4. Hoeveel gebruikers hebben op 18 januari een gecorrigeerde D30, en uit welke week komen ze?
5. Waarom zou een D7-verschil van 1,5× tussen squad en solo iets anders zijn dan het verschil tussen iemand die door een vriend is meegenomen en iemand die alleen kwam?
6. Wat gebeurt er in februari met een squad van vijf als vier leden hun laatste tentamen achter de rug hebben?
7. Hoe merk je dat een zwakkere student, die achter loopt en elke dag "−20" ziet terwijl zijn squad wel groen staat, er slechter van wordt? Wat doe je dan?
8. Waarom krijgen 16- en 17-jarigen standaard live aanwezigheid en een verliesarm? Wie heeft daar ethisch naar gekeken?
9. Hoeveel uur studie per dag vinden jullie gezond, en waarom belonen punten en duels dan tot acht uur?
10. Wat is de prijs in punten van het goedkoopste catalogusitem, en welk uurloon rekent een student daar zelf uit?
11. Als Forest morgen squads en een verenigingsranglijst toevoegt, welk gedragsresultaat uit deze pilot kun je laten zien dat zij niet hebben?
12. Wie draait de analyse, en is die persoon onafhankelijk van het team dat de pilot moet laten slagen?

## Wat mij zou overtuigen

- Een voorregistratie vóór 2 december waarin per hypothese één primaire maat, het kleinste detecteerbare effect, de analyse-eenheid en de beslisregel staan, en waarin de pitchclaims letterlijk overeenkomen met die maten.
- Een Belofte die wordt aangeboden op het moment dat de bonus stopt, met een nawerkingsmeting in een periode met echte vraag naar focus (april) en een controle die tot dan wacht. Liever nog daarnaast een gerandomiseerde, aangekondigde afbouw van de ratio voor een deel van de squads.
- Een causalere squadtoets (encouragement design of binnen-persoons) in plaats van de ruwe squad/solo-ratio als go/no-go.
- Een welzijnsmeting, vooraf vastgelegde schadesignalen met een stopregel, en een eerlijke deelname-uitleg, met 16- en 17-jarigen buiten de verliesarm.
- Over drie maanden: data die laat zien dat in februari, zonder tentamen, bonus of prijs, een substantieel deel van de januari-actieven nog wekelijks focust, en dat dat aandeel in de vroege Belofte-arm hoger ligt. Dat is het resultaat dat dit bedrijf verdedigbaar maakt. Het huidige ontwerp kan het niet opleveren.
