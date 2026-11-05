# Rewarded — Pitch (v2, 5 november 2026, herzien na pitchronde 1)

*Voor het kritische team. Onderbouwing: `docs/01-businessplan.md`, `docs/02-productplan.md`, de rapporten in `docs/research/` en de besluiten van de founder in `docs/pitch/ronde-1-founder-reactie.md`. Wat hieronder "aanname" heet, is nog niet getoetst; rekensommen zijn van het strategieteam.*

## In één zin

Rewarded laat studenten samen hun telefoon wegleggen en beloont hun focustijd met status in hun squad en vereniging en met verdiende beloningen, betaald door instellingen die belang hebben bij hun studiesucces.

## Wat er sinds ronde 1 veranderde

1. **De pilot is een verkennende pilot met één redelijk gepowerde vergelijking** (doelbonus arm A tegenover B tijdens het seizoen) en een voorgeregistreerde nawerkingsmeting in de tentamenperiode van april 2027. Het lanceringsbesluit op 19 januari, op data tot en met 18 januari 04:00, gaat over operationele maten; het bedrijfsbesluit over het gedragseffect en de volgende financieringsstap valt na april.
2. **De pilot toetst of iemand betaalt.** Vóór 19 januari: minstens drie getekende intentieverklaringen van budgethouders met prijs en seats, en tien tot vijftien vastgelegde budgethoudergesprekken. Niet gehaald betekent "geen aangetoonde betaler", geen draai naar werkgevers.
3. **De inzetlaag en de trekkingen gaan uit deze ronde en uit de bouw.** Verdiende prijzen blijven.

## Het probleem

Studenten verliezen in de weken voor hun tentamens de strijd met hun telefoon en weten dat zelf. Focus-apps bestaan al tien jaar (Forest tientallen miljoenen downloads, Opal naar eigen zeggen miljoenen omzet), maar de categorie houdt gebruikers slecht vast: dertig dagen na installatie is doorgaans minder dan tien procent nog actief. Niet omdat de apps slecht zijn, maar omdat de motivatie alleen van de gebruiker zelf moet komen, precies op het moment dat die het zwakst is. De pijn is seizoensgebonden: ze zit in de tentamenperiodes, niet het hele jaar.

## Het inzicht

Het idee "beloond worden voor telefoonvrije tijd" is al geprobeerd. Hold bereikte in Noorwegen naar eigen zeggen veertig procent van de studenten en Pocket Points zat op meer dan tweehonderd Amerikaanse campussen. Beide zakten weg. Ons onderzoek (rapport 01) wijst drie structurele oorzaken aan, en Rewarded is ontworpen om alle drie te vermijden:

1. **Niemand wilde de beloning duurzaam betalen.** Een student die zijn telefoon weglegt, ziet geen advertenties; merken betalen daar weinig voor (Sweatcoin haalt naar schatting zeven dollarcent per gebruiker per jaar op). Wij hebben geen gesponsorde vertoningen. Beloningen komen uit contracten met instellingen en, alleen bij getekende omzet, uit sponsorchallenges. Het beloningsbudget is altijd een afgeleide van geboekte omzet of van het begrensde acquisitiebudget van de gratis laag.
2. **Beloning en verificatie liepen niet gelijk op.** Zodra er iets te halen is, wordt valsspelen rationeel; StickK zag van 650.000 dollar aan inzet maar 50.000 verbeurd. Bij ons bepaalt de bewijssterkte het beloningsplafond, in vier treden van "pagina zichtbaar in de browser" tot native blokkade met apparaatattestatie en menselijke steekproeven. Op het web zijn er alleen punten en kleine verdiende prijzen, nooit geld.
3. **Het effect verdween zodra de beloning stopte.** Dat is geen productfout maar een eigenschap van geldprikkels (rapport 08: van 54 interventies had acht procent na afloop nog meetbaar effect). Onze hypothese is dat een beloning die als steiger afbouwt naar squads, streaks en een zelfgekozen Belofte het effect wél vasthoudt. Dat is nog niet aangetoond; de pilot toetst het verkennend, met de meting in april 2027.

## De oplossing

Vier onderdelen in de web-MVP, uitgewerkt in `docs/02-productplan.md`:

1. **Focus-engine.** Sessies van 25, 50 of 90 minuten. In de web-MVP loopt een sessie alleen zolang Rewarded zichtbaar op het scherm staat: telefoon met het scherm naar beneden, Wake Lock houdt het scherm aan. Wie de app verlaat, ziet eerlijk waarom de sessie stopte. Batterij en iOS-gedrag meten we per platform in de toesteltest.
2. **Dagdoel, weekprestatie en punten.** Het zelfgekozen dagdoel en de weekprestatie staan voorop; minuutpunten tegen een vaste, gepubliceerde ratio zijn bijzaak, met een plafond van 300 minuten per dag. Punten zijn inwisselbaar in een vooraf gefinancierde catalogus, bij voorkeur met collectieve of symbolische beloningen in plaats van koffievouchers. Geen cash-out, geen variabele koersen; eerste verzilvering na vijf uur geverifieerde focus plus een wachttijd van zeven dagen.
3. **Squads, duels en verenigingen.** Drie tot zes vrienden zien live wie focust en bouwen een squadstreak op, met een herstelroute zonder punten. Duels worden gewonnen op gehaalde dagdoelen. Verenigingen strijden op deelnamegraad, met een ledental uit een externe bron dat openbaar op de ranglijst staat. Individuele vergelijking blijft binnen de squad.
4. **Verdiende prijzen en de Belofte.** Prijzen op prestatie, met verificatie van winnaars en een uitslag die pas definitief is na een steekproef. De Belofte: de gebruiker belooft zichzelf dagen en minuten, met zijn squad als getuige en zonder punten. In de vroege arm krijgt hij dat aanbod bij de aangekondigde stop van de doelbonus (op 11 januari 2027, een week vóór de stop), in de late arm pas na april.

Trekkingen worden niet gebouwd; ze zijn een optie na toetsing. De inzetlaag (een opt-in commitment contract waarbij verbeurde inzet volledig naar een goed doel gaat) is visie, pas na native verificatie en een volgende ronde. Rewarded verdient nooit aan falen.

Het product is gespecificeerd tot op regel- en parameterniveau (`docs/research/05-productspecificatie.md`), met een UX-ontwerp, mockups en een architectuur waarin de server de scheidsrechter is. Drie releases vóór de lancering (2 december, 16 december, 5 januari). De MVP wordt gebouwd met AI-ondersteunde ontwikkeling: de founder bouwt R1–R3 in november en december zelf, met een freelance senior engineer voor de toesteltest en een onafhankelijke codereview als de eigen middelen dat toelaten. Die bouw valt vóór de begroting van deze ronde, die in januari 2027 begint.

**Deelnemersbescherming.** De pilot is een gerandomiseerd experiment op jongeren in hun drukste weken. Deelname is geïnformeerd, met opt-out zonder verlies van punten. 16- en 17-jarigen zitten in arm A, buiten de rustperiode-arm, met live aanwezigheid standaard uit. Een korte welzijnsmeting (stress, slaap, ervaren squaddruk, intrinsieke motivatie) loopt bij instroom, bij de reflectie en eind januari; vooraf vastgelegde schadesignalen leiden tot een zacht bericht met hulpbronnen, en arm B stopt bij een vooraf vastgelegd verschil. Een tentamendag schort het dagdoel op. Geen marketing op sociale schaamte. We vragen een lichte ethische toets aan via een partneruniversiteit.

## Waarom nu

- **Instellingen erkennen de telefoon als probleem.** Yondr haalde volgens GovSpend $19 miljoen omzet bij Amerikaanse scholen in 2025, met een meer dan tienvoudige groei sinds 2021. Het grootste geld in "telefoon weg" komt van instellingen, en daar richten wij ons op.
- **"Study with me" is een bestaande cultuur op TikTok.** We hoeven het ritueel niet uit te vinden, alleen het meedoen mogelijk te maken.
- **De native API's bestaan.** De iOS Screen Time-API's en Android UsageStats maken verificatie mogelijk die er in de tijd van Hold niet was. Opal gebruikt ze al; voor ons zijn ze de volgende trede van de verificatieladder.

## Concurrentie en verdediging

Opal heeft "Social Sessions" (vrienden blokkeren samen apps en zien wie de sessie verlaat) en Forest heeft "Plant Together" (verlaat één iemand de app, dan sterft de boom van de hele groep). Beide functies hebben we via zoekresultaten gezien; de pagina's zelf zijn niet geopend. Beide apps zijn native, verifiëren sterker dan wij op het web en hebben veel meer bereik. "Wij hebben squads" is dus geen verdediging.

Onze verdediging:

1. **De institutionele relatie.** Geverifieerde studie-inzet als geaggregeerde data voor een faculteit of studentenwelzijn, een verwerkersovereenkomst en DPIA die klaarliggen, en een verenigingsnetwerk per stad met een eigen netwerkeffect. Dat is verkoop- en compliancewerk dat een consumentenapp niet doet.
2. **Gemeten nawerking.** Laat de pilot in april 2027 zien dat studenten blijven focussen na het einde van de doelbonus, dan hebben wij een resultaat dat Opal en Forest niet hebben. Lukt dat niet, dan rust de verdediging alleen op de institutionele relatie, en dat zeggen we dan.

In de pilot meten we hoeveel deelnemers Forest of Opal gebruiken of gebruikten, en waarom ze Rewarded ernaast of in plaats daarvan gebruiken.

## Markt, wedge en go-to-market

We beginnen met de **blokchallenge**: hbo- en wo-studenten in de tentamenperiode van januari 2027, via studieverenigingen in twee steden (werkhypothese Utrecht en Groningen). Verenigingen strijden op deelnamegraad om een collectieve prijs die ze verdienen; het bestuur krijgt een dashboard; leden vormen squads. Een vereniging telt als "schriftelijk toegezegd" met ledental (met bron), een promotieverplichting (kanalen, data) en een contactpersoon in het bestuur. Minstens één vereniging heeft een bestuur dat niet zelf heeft aangedrongen, en een deel van de pilot stroomt buiten verenigingen in; alle uitkomsten rapporteren we per instroomkanaal.

**De betaler** is niet de student en zelden de vereniging: 500 seats kosten bij onze prijshypothese €18.000 per jaar, wat een vereniging zelden zelf opbrengt. De waarschijnlijke betalers zijn een faculteit, studentenwelzijn of een werkgever die via een vereniging sponsort.

**Marktomvang.** Bij €36 per seat per jaar (hypothese) is het theoretische plafond in Nederland (773.270 hbo- en wo-studenten, CBS) ongeveer €27,8 miljoen per jaar, en in de EU27 en het VK samen (circa 22 miljoen) ongeveer €790 miljoen (rekensommen). €1 miljoen ARR vraagt ongeveer 27.800 seats, 3,6% van alle Nederlandse studenten. De SAM van onderaf (aantal verenigingen en leden in Utrecht en Groningen, deel actief in de tentamenperiode) vraagt de founder vóór 1 december op; tot dan staat er geen getal. De SOM voor de komende 15 maanden is het financierbare punt: ≥ 2.500 seats, ongeveer €90.000 ARR.

**Route.** We kiezen institutionele SaaS voor instellingen in de EU en het VK, met verenigingen als kanaal. Daarin zit een spanning: wij claimen inputs (focustijd, gehaalde dagdoelen), instellingen willen uitkomsten (studiesucces, minder uitval). We vragen daarom nu al naar geaggregeerde studievoortgang achteraf en meten zelfgerapporteerde studietijd en afleiding vóór en na; op langere termijn bouwen we geaggregeerde uitkomstdata op, nooit op persoonsniveau. Vlaanderen en het VK vallen buiten deze ronde.

**Seizoen.** Werkhypothese (aanname, per instelling te bevestigen): vier tentamenperiodes per studiejaar, samen ongeveer twaalf weken. Gebruik en omzet modelleren we over het studiejaar; retentie rapporteren we altijd ook op kalendertijd.

## Plan en go/no-go

| Moment | Datum | Maten | Besluit |
|---|---|---|---|
| Start pilot | 1–2 dec 2026 | ≥ 1.500 aanmeldingen, ≥ 25% met een vriend; ≥ 5 verenigingen schriftelijk toegezegd; focus-hook minstens even goed als geld-hook; DPIA ondertekend, voorregistratie en A/A-controle klaar | Zonder DPIA of voorregistratie geen uitnodigingen. Werkhypothese bij 3–4 verenigingen: kleinere pilot; bij minder dan 3: geen pilot in januari, wedge herzien |
| Lanceringsbesluit (operationeel) | 19 jan 2027, op data tot en met 18 jan 04:00 | Activatie ≥ 60%; D7 van het go/no-go-cohort (registratie 2–13 december) ≥ 25%, definitieve drempel per kanaal uit de encouragement-controle; geschatte fraude uit de onafhankelijke steekproef < 5%, met betrouwbaarheidsinterval; kosten per wekelijks actieve gebruiker per week onder een plafond in euro's (werkhypothese €0,06, afgeleid uit €0,25 per MAU per maand, inclusief pilotprijzen; aanname); deelnemersbescherming zonder geraakte stopregel | **Stopregel: D7 < 15% = geen lancering en geen tweede tranche** |
| Commercieel criterium | vóór 19 jan 2027 | ≥ 3 getekende intentieverklaringen met prijs en seats; 10–15 vastgelegde budgethoudergesprekken (functie, naam van het budget, omvang, toekenningsmoment) | Niet gehaald = geen aangetoonde betaler; geen draai naar werkgevers |
| Publieke lancering NL | 19 jan – 2 feb 2027 | ≥ 5.000 geactiveerde gebruikers, D7 ≥ 20%, ≥ 50% organische aanwas, kosten per geactiveerde gebruiker < €5 in betaalde kanalen, geen kanaal met geschatte fraude boven 10% | Kanaal boven de fraudegrens stopt |
| Bedrijfsbesluit | na april 2027 (werkhypothese mei) | Nawerking in de tentamenperiode van april; na-seizoensmaten; squadeffect via encouragement design; arm A tegenover B; squadoverleving; K van gebruiker aan gebruiker; welzijn; contracten; D30 buiten de tentamenweken (go/no-go-cohort, gemeten 1–14 februari) | **Stopregel: D30 buiten de tentamenweken < 6% = geen tweede tranche en geen opschaling.** Verder: tweede tranche, native app, volgende stap; drempels uit de voorregistratie |

De precieze maten, analyse-eenheden, kleinste detecteerbare effecten en kalenderdata per cohort staan in de voorregistratie (`docs/pilot/voorregistratie.md`, vóór 2 december); bij verschil geldt de voorregistratie. Generieke appbenchmarks (rapport 03) zijn achtergrond, geen go/no-go.

## Verdienmodel en unit economics

| Bron | Mechanisme | Rekensom (strategieteam, op kostenposten uit rapport 02) |
|---|---|---|
| B2B2C: faculteiten, studentenwelzijn, werkgevers via verenigingen | Seats per jaar, met challenge, dashboard, geaggregeerde rapportage en een beloningsbudget van 30% in de prijs | Hypothese €36 per seat per jaar; marge ongeveer €17,82 per seat per jaar (ca. 50%) zonder trekkingen. Met het seizoensprofiel (aanname: 30% actief in de tentamenperiode, 8% daarbuiten) ongeveer €120 omzet en €59 marge per in de tentamenperiode actieve student per jaar |
| Gratis laag | Punten, status, kleine catalogus | Geen omzet; een acquisitiekostenpost voor B2B2C en Plus met een plafond van €0,25 per maandelijks actieve gebruiker per maand. Eigen beloningen, inclusief de pilotprijzen en de catalogus van de gesloten pilot (werkhypothese €1.500), zijn de sluitpost onder dat plafond. Als go/no-go-maat in de pilot: ongeveer €0,06 per wekelijks actieve gebruiker per week (rekensom uit het maandplafond) |
| Sponsorchallenges | Een partij betaalt per voltooide challenge (schatting €1–3) | Alleen bij getekende omzet; niet in het basismodel |
| Rewarded Plus | Abonnement; blokkering komt pas met native | Niet in het basismodel; in de web-MVP een nepdeur ("Plus komt eraan, €2,99") als interessemeting |

Niet in het model: gesponsorde vertoningen, trekkingen en de inzetlaag (bij volledige donatie een kostenpost). Nooit: het pool-model en een abonnement dat een prijzenpot vult.

Wat de rekensom eerlijk laat zien: is in de tentamenperiode maar 12% van de seats actief, dan betaalt een klant ongeveer €300 per actieve student per jaar, en dat verlengt een inkoper waarschijnlijk niet. Daarom toetsen we in de budgethoudergesprekken ook een prijs per actieve student per tentamenperiode. En de eerste vijf contracten verdienen hun verkoopkosten niet in het eerste jaar terug (ongeveer €25,50 per seat aan verkoopkosten met ons eigen team, terugverdientijd ongeveer 17 maanden); het bedrijf hangt aan verlengingen.

## Groei

Squads en duels zijn de motor: wie via een vriend komt, heeft een reden om terug te komen die niet om geld draait. Of dat zo is, toetsen we met een encouragement design (een gerandomiseerde squadprompt voor solo-gebruikers); de ruwe vergelijking tussen squad en solo is alleen beschrijvend. Campusrivaliteit is de koude start, deelbare bewijskaarten met uren en streaks (nooit bedragen) zijn de versterker. Referrals belonen we in punten die pas vrijkomen na drie sessies van de genodigde en na de wachttijd op zijn eerste verzilvering. Ambassadeurs worden betaald per gebruiker die op dag 14 minstens vijf sessies en een instellingsanker (bevestigde instellingsmail) heeft en niet verdacht is in de steekproef, met een plafond (werkhypothese €5 per gebruiker, hoogstens 40 per ambassadeur per maand) en uitbetaling na de steekproef. K rapporteren we alleen uit uitnodigingen van gebruiker aan gebruiker. We delen geen bedragen, zetten geen beloning op delen en zijn afwezig op cashback- en "verdien geld"-platforms.

## Wat het bewijs zegt en wat we toetsen

Het bewijs draagt het mechanisme en begrenst het. Beloningen voor inputs zijn de veilige keuze; outputbeloningen pakten voor zwakkere studenten negatief uit. Beloningen moeten direct volgen. Kleine geldbedragen en een zichtbaar stukloon kunnen slechter werken dan niets, dus de gratis laag werkt met punten en status, en dagdoel en weekprestatie staan voorop. Openbare individuele ranglijsten kunnen averechts werken, dus vergelijking blijft in de squad.

De pilot is een **verkennende pilot met één redelijk gepowerde vergelijking**. Wat we toetsen, letterlijk in de formuleringen en de nummering van de voorregistratie (§4):

- **H1 — Squadeffect.** "Solo-gebruikers die een sterke uitnodiging krijgen om een squad te vormen, vormen vaker een squad en zijn vaker op dag 7 actief."
- **H2 — Meer gehaalde dagdoelen tijdens het seizoen.** "Meer gehaalde dagdoelen tijdens het seizoen met een slinkend weekbudget (arm B) dan met gewone bijschrijving (arm A)." We claimen daarmee geen betere retentie. Dit is de ene redelijk gepowerde vergelijking.
- **H3 — Nawerking na het einde van de doelbonus (verkennend).** "Na het einde van de doelbonus focussen studenten in de volgende tentamenperiode vaker als ze bij de aankondiging van de stop van de bonus een Belofte aangeboden kregen (H3a), en als ze na het seizoen gewoon punten bleven verdienen of juist niet (H3b, zie richting)." H3 is verkennend tot de poweranalyse anders laat zien.
- **H4 — Fraude blijft beheersbaar (operationeel).** "Het geschatte aandeel frauduleuze accounts uit de onafhankelijke steekproef blijft onder 5%."

Bij H3: de vroege arm krijgt het Belofte-aanbod op 11 januari 2027, de late arm na april; in de rustperiode-arm (H3b) verdient de helft van de squads van 19 januari tot en met 31 maart 2027 geen punten, onder voorbehoud van de advocaat. De primaire maat ligt in de tentamenperiode van april 2027.

De poweranalyse levert per hypothese het kleinste detecteerbare effect. Is dat groter dan plausibel, dan heet de hypothese verkennend en hangt er geen besluit aan.

## Juridisch en risico's

Wat bij de lancering live gaat, kan zonder vergunning: punten en catalogus (vaste ratio, geen cash-out) en verdiende prijzen op deelnamegraad (geen kansbepaling; de advocatenopinie beoordeelt de rangprijs expliciet, met een terugvalvariant met alleen drempelprijzen). Trekkingen worden niet gebouwd; als ze ooit komen, geldt "stilte is nee": zonder schriftelijke opinie en expliciete schriftelijke reactie van de Kansspelautoriteit blijven ze uit. De DPIA is ondertekend vóór de eerste uitnodiging (uiterlijk 1 december), met per verwerking een grondslag. Gebruiksvoorwaarden, challengevoorwaarden, een spelvoorwaardensjabloon, een privacyverklaring en een overeenkomst met verenigingen liggen uiterlijk 18 november in concept bij de advocaat.

| Risico | Hoe we het uitsluiten of begrenzen |
|---|---|
| Niemand betaalt | Commercieel criterium vóór 19 januari; niet gehaald = geen aangetoonde betaler, geen draai naar werkgevers |
| Verkoop duurt twee keer zo lang | 18 maanden runway zonder omzet; tranches; verlenging in het financierbare punt |
| Opal of Forest kopieert de verenigingschallenge | Institutionele relatie en gemeten nawerking; in de pilot meten waarom deelnemers Rewarded ernaast of in plaats daarvan gebruiken |
| Fraude rond de verenigingsprijs | Extern en openbaar ledental, identiteitsanker (instellingsmail of mobiel nummer) voor de teller, e-mailnormalisatie, verplichte steekproef bij winnaars, hogere drempels voor campus- en CGNAT-netwerken, diskwalificatie met hoor en wederhoor; uitslag pas definitief na de steekproef |
| Meervoudige accounts in catalogus, referral en ambassadeurs | Alleen mobiele nummers, wachttijd van zeven dagen op de eerste verzilvering, gespreide weekvoorraad, ambassadeursregel, referral-vesting; red-teamdag vóór 25 november |
| Deelnemers worden er slechter van | Geïnformeerde deelname met opt-out, welzijnsmeting, schadesignalen en stopregel voor arm B, minderjarigen in arm A met aanwezigheid uit, tentamendag, plafond van 300 minuten per dag, geen schaamte-marketing, lichte ethische toets |
| Het effect zakt weg na de beloning | Verkennend getoetst in april 2027; het bedrijfsbesluit valt pas daarna |
| De pilot meet de tentamenkalender | Go/no-go-cohort met kalenderdata, retentie op kalendertijd, na-seizoensmaten |
| Fraude met webverificatie | Geen geld op trede 1; beloningen omlaag bij geschatte fraude boven 5%; native verificatie later |
| Webverificatie in de praktijk | Batterij en iOS-gedrag per platform in de toesteltest |
| Apple-richtlijn 4.10 en Family Controls-entitlement | Entitlement aanvragen bij oprichting van het ontwikkelaarsaccount; ontwerp vooraf voorleggen |
| Beloningsjagers | Boodschap leidt met focus en samen; inverdienperiode en wachttijd; per kanaal sturen op kwaliteit |

## Team en vraag

**Team.** Wij kunnen geen mensen verzinnen, dus eerlijk: de founder doet product en verkoop, en bouwt R1–R3 in november en december zelf met AI-ondersteunde ontwikkeling (met een freelance senior engineer voor de toesteltest en een onafhankelijke codereview als de eigen middelen dat toelaten); die bouw valt vóór de begroting. Te werven zijn een senior engineer met native iOS-ervaring (Screen Time-API's), een full-stack engineer, een ontwerper in deeltijd en vanaf maand 4 een commerciële kracht in deeltijd. Budget en bouwplan rekenen vanaf januari 2027 met dezelfde drie bouwrollen. De MVP wordt met AI-ondersteunde ontwikkeling gebouwd. Een live product met fraudewachtrij en menselijke beoordeling vraagt naar onze schatting (aanname, in de pilot gemeten) 15–25 uur per week in de pilot en 25–40 uur per week na de lancering bij ongeveer 5.000 gebruikers. De investeerdersvoorwaarde "benoemde mensen" blijft open totdat ze er zijn.

**Financierbaar volgend punt** (werkhypothese, binnen 15 maanden): ≥ 5 betaalde contracten met in totaal ≥ 2.500 seats, ≥ 30% actieve seats in de tentamenperiode bij minstens twee klanten, en één verlenging of herhaalorder.

**Vraag: €560.000 pre-seed in twee tranches**, gelijk aan de begroting.

| Post (18 maanden, aannames) | Bedrag |
|---|---|
| Team: founder, senior engineer native iOS, full-stack engineer, ontwerper 0,5 fte, commerciële kracht 0,5 fte vanaf maand 4 | €370.500 |
| Juridisch en fiscaal (bandbreedte €25.000–45.000, begroot op de bovenkant) | €45.000 |
| Onderzoek en meting (statisticus, welzijnsinstrument, ethische toets) | €8.000 |
| Campus, ambassadeurs, creators, kleine betaalde test | €50.000 |
| Gratis laag als acquisitiekostenpost (≤ €0,25 per MAU per maand), inclusief pilotprijzen en catalogus | €15.000 |
| Infrastructuur, app-storeaccounts, tooling, verzekeringen | €18.000 |
| Buffer (ca. 10%) | €53.500 |
| **Totaal** | **€560.000** |

| Tranche | Bedrag | Dekt | Voorwaarde |
|---|---|---|---|
| 1 | €200.000 | Januari–juni 2027: pilot afronden, lancering, aprilmeting, juridische trajecten, eerste verkoop | Bij sluiting |
| 2 | €360.000 | Juli 2027–juni 2028: native app, verkoop aan instellingen, verlenging | Bedrijfsbesluit na april: stopregel niet geraakt, commercieel criterium gehaald (werkhypothese), beslisregels uit de voorregistratie |

De begroting rekent met nul omzet. In het scenario waarin verkoop twee keer zo lang duurt en de eerste omzet pas in september 2027 komt, dekt het bedrag 18 maanden, tot en met juni 2028: drie maanden na het financierbare punt. Maand 1 is januari 2027 (aanname); de salarissen zijn aannames. De bouw van R1–R3 in november en december 2026 valt buiten deze begroting. Details in `docs/01-businessplan.md`, §10.

**Mijlpalen.** Deze week DPIA-light voor de wachtlijst; 18 november juridische concepten bij de advocaat; vóór 25 november red-teamdag en poweranalyse; vóór 1 december verenigingsgegevens, gesprek met een oud-medewerker of founder van Hold en ondertekende DPIA; vóór 2 december voorregistratie; 2 december – 18 januari pilot; vóór 19 januari commercieel criterium; 19 januari lanceringsbesluit (op data tot en met 18 januari 04:00) en lancering NL; 1–14 februari meting D30 buiten de tentamenweken; april 2027 nawerkingsmeting; mei 2027 (werkhypothese) bedrijfsbesluit en tweede tranche; Q2–Q3 2027 native iOS-app (aanname: afhankelijk van werving en entitlement); studiejaar 2027/'28 eerste betaalde contracten; maart 2028 financierbaar punt. Niet in deze ronde: inzetlaag, trekkingen, Vlaanderen en het VK.

## Wat ons van gedachten doet veranderen

D7 onder 15%: geen lancering en geen tweede tranche. D30 buiten de tentamenweken onder 6%, gemeten in 1–14 februari: geen tweede tranche en geen opschaling. Geen drie intentieverklaringen vóór 19 januari: geen aangetoonde betaler, en we draaien niet naar werkgevers. Geen effect van de squadprompt: de sociale loop is niet aangetoond en de productloop gaat voor groei. Geen nawerking in april: de verdediging rust alleen op de institutionele relatie, en dat zeggen we. Geschatte fraude boven vijf procent: beloningen omlaag tot native verificatie er is. Minder dan 30% actieve seats in de tentamenperiode bij de eerste klanten: de prijs per seat houdt geen stand en we schakelen over op een prijs per actieve gebruiker. Een schadesignaal boven de vooraf vastgelegde grens: arm B stopt.

## Wijzigingslog

**Ronde 1 — 5 november 2026.** Herzien na pitchronde 1 volgens de bindende besluiten in `docs/pitch/ronde-1-founder-reactie.md`, gelijkgetrokken met `docs/01-businessplan.md` v2.

- De drie overkoepelende besluiten bovenaan (verkennende pilot, commercieel criterium, inzetlaag en trekkingen uit de ronde) (besluiten 1–3, GS11).
- Overclaimende formuleringen over focus en de verkeerde prijsmaatstaf verwijderd; verenigingen strijden op deelnamegraad (JS1).
- Trekkingen niet meer als onderdeel van de lancering; "stilte is nee" (J4, S9). Inzetlaag als visie (besluit 3, JS7).
- Unit economics herrekend: de oude margecijfers uit rapport 02 voor de gratis laag en B2B2C verdwenen; gratis laag als begrensde acquisitiekostenpost, B2B2C per seat en per actieve gebruiker met seizoensprofiel, Plus als nepdeur (M2, S3, S4).
- Commercieel go/no-go-criterium, betaler benoemd (M1); go/no-go met stopregel en scheiding tussen lanceringsbesluit en bedrijfsbesluit, onafhankelijke fraudeschatting, kosten per actieve gebruiker per week (M4, G3, J1).
- Hypotheses herschreven naar de voorregistratie: één gepowerde vergelijking, Belofte bij de stop van de doelbonus, nawerking in april, rustperiode-arm onder voorbehoud, encouragement design (G1, G2).
- Nieuwe secties over concurrentie en verdediging (M6) en deelnemersbescherming (G4); risicotabel uitgebreid met fraude rond de verenigingsprijs en deelnemersbescherming (J2, J3, G4).
- "Waarom nu" beperkt tot onderbouwde argumenten; Focus Friend, de mobieltjesafspraak en Forfeit geschrapt (S5).
- Markt van onderaf, route naar institutionele SaaS, seizoen, definitie van verenigingstoezeggingen, referentievereniging (S1, S2, S4, S7, S10).
- Team eerlijk beschreven met beheeruren; vraag van €400.000 (begroting €370.000) vervangen door €560.000 in twee tranches, gelijk aan de begroting, met commerciële rol, juridische bandbreedte en 18 maanden runway in het trage verkoopscenario (M3, M5, JS9).

**Ronde 1, eindredactie — 5 november 2026.** Gelijkgetrokken met de aanvulling van de founder na de samenhangcontrole (`docs/pitch/ronde-1-founder-reactie.md`, 5 november), het businessplan en de voorregistratie.

- Hypotheses in de nummering H1–H4 en letterlijk in de formuleringen van de voorregistratie §4; H2 heet "meer gehaalde dagdoelen tijdens het seizoen"; fraude als H4 (G2).
- Stopregel gesplitst: D7 onder 15% in het lanceringsbesluit; D30 buiten de tentamenweken onder 6%, gemeten in 1–14 februari, in het bedrijfsbesluit (geen tweede tranche en geen opschaling) (M4, G3).
- Lanceringsbesluit op 19 januari 2027, op data tot en met 18 januari 04:00.
- Kostenplafond: €0,25 per MAU per maand in het model, €0,06 per wekelijks actieve gebruiker per week als go/no-go-maat (werkhypothese, aanname); pilotprijzen en catalogus binnen de gratis laag (M2, M4).
- Bouw van R1–R3 door de founder vóór de begroting eerlijk benoemd (M5).
- Belofte-aanbod op 11 januari; rustperiode van 19 januari tot en met 31 maart; ambassadeurs op het instellingsanker met een plafond als werkhypothese (G1, J3).

