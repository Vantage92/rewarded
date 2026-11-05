# Rewarded — Pitch (v3, 4 november 2026, herzien na pitchronde 2)

*Voor het kritische team. Onderbouwing: `docs/01-businessplan.md` (v3), `docs/02-productplan.md`, de rapporten in `docs/research/` en de besluiten van de founder in `docs/pitch/ronde-1-founder-reactie.md` en `docs/pitch/ronde-2-founder-reactie.md`. Wat hieronder "aanname" heet, is nog niet getoetst; rekensommen zijn van het strategieteam; wat alleen via zoekresultaten is gezien, staat zo gemarkeerd.*

## In één zin

Rewarded laat studenten samen hun telefoon wegleggen en beloont hun focustijd met status in hun squad en vereniging en met verdiende beloningen, betaald door instellingen die belang hebben bij hun studiesucces.

## Wat er sinds ronde 2 veranderde

1. **De pilotkalender is per instelling.** De doelbonus stopt aan het einde van de laatste tentamenweek van de eigen instelling, het Belofte-aanbod komt zeven dagen eerder, het na-seizoensvenster ligt na de herkansingen. Het lanceringsbesluit valt pas als het laatste pilotcohort zijn tentamenweek heeft afgerond. De kalenders worden uiterlijk 18 november bevestigd.
2. **Geen open lancering in januari, maar een gecontroleerde uitbreiding** naar meer verenigingen, op uitnodiging, tot wat het budget draagt (werkhypothese: hoogstens 3.000 maandelijks actieve gebruikers in semester 2; daarboven een wachtlijst).
3. **De rustperiode loopt door tot en met het aprilvenster**, zodat de steigerhypothese in een periode met echte vraag wordt getoetst. De aprilchallenge is voor beide armen gelijk.
4. **Tranche 2 heeft bindende, positieve voorwaarden in getallen**, waaronder een getekende opdracht vóór 1 mei 2027. Contracten zijn per tentamenperiode, de herhaalorder is de maat, de iOS-engineer komt pas bij tranche 2 en er is zes maanden runway na het financierbare punt.

## Wat er sinds ronde 1 veranderde (stand na ronde 2)

1. **De pilot is een verkennende pilot met één redelijk gepowerde vergelijking** (doelbonus arm A tegenover B tijdens het seizoen) en een voorgeregistreerde nawerkingsmeting in de tentamenperiode van april 2027. Het lanceringsbesluit gaat over operationele maten; het bedrijfsbesluit over het gedragseffect en de tweede tranche valt na april.
2. **De pilot toetst of iemand betaalt.** Vóór 19 januari: minstens drie getekende intentieverklaringen van budgethouders, elk met minstens €8 per seat per tentamenperiode (of €24 per seat per jaar) en minstens 150 seats, en tien tot vijftien vastgelegde budgethoudergesprekken. Niet gehaald betekent "geen aangetoonde betaler", geen draai naar werkgevers.
3. **De inzetlaag en de trekkingen gaan uit deze ronde en uit de bouw.** Verdiende prijzen blijven.

## Het probleem

Studenten verliezen in de weken voor hun tentamens de strijd met hun telefoon en weten dat zelf. Focus-apps bestaan al tien jaar (Forest tientallen miljoenen downloads, Opal naar eigen zeggen miljoenen omzet), maar de categorie houdt gebruikers slecht vast: dertig dagen na installatie is doorgaans minder dan tien procent nog actief. Niet omdat de apps slecht zijn, maar omdat de motivatie alleen van de gebruiker zelf moet komen, precies op het moment dat die het zwakst is. De pijn is seizoensgebonden: ze zit in de tentamenperiodes, niet het hele jaar, en die periodes verschillen per instelling.

## Het inzicht

Het idee "beloond worden voor telefoonvrije tijd" is al geprobeerd. Hold bereikte in Noorwegen naar eigen zeggen veertig procent van de studenten en Pocket Points zat op meer dan tweehonderd Amerikaanse campussen. Beide zakten weg. Ons onderzoek (rapport 01) wijst drie structurele oorzaken aan, en Rewarded is ontworpen om alle drie te vermijden:

1. **Niemand wilde de beloning duurzaam betalen.** Een student die zijn telefoon weglegt, ziet geen advertenties; merken betalen daar weinig voor (Sweatcoin haalt naar schatting zeven dollarcent per gebruiker per jaar op). Wij hebben geen gesponsorde vertoningen. Beloningen komen uit contracten met instellingen en, alleen bij getekende omzet, uit sponsorchallenges. Het beloningsbudget is altijd een afgeleide van geboekte omzet of van een begrensde, vooraf begrote post.
2. **Beloning en verificatie liepen niet gelijk op.** Zodra er iets te halen is, wordt valsspelen rationeel; StickK zag van 650.000 dollar aan inzet maar 50.000 verbeurd. Bij ons bepaalt de bewijssterkte het beloningsplafond, in vier treden van "pagina zichtbaar in de browser" tot native blokkade met apparaatattestatie en menselijke steekproeven. Op het web zijn er alleen punten en kleine verdiende prijzen, nooit geld.
3. **Het effect verdween zodra de beloning stopte.** Dat is geen productfout maar een eigenschap van geldprikkels (rapport 08: van 54 interventies had acht procent na afloop nog meetbaar effect). Onze hypothese is dat een beloning die als steiger afbouwt naar squads, streaks en een zelfgekozen Belofte het effect wél vasthoudt. Dat is nog niet aangetoond; de pilot toetst het verkennend, met de meting in april 2027.

## De oplossing

Vier onderdelen in de web-MVP, uitgewerkt in `docs/02-productplan.md`:

1. **Focus-engine.** Sessies van 25, 50 of 90 minuten. In de web-MVP loopt een sessie alleen zolang Rewarded zichtbaar op het scherm staat: telefoon met het scherm naar beneden, Wake Lock houdt het scherm aan. Wie de app verlaat, ziet eerlijk waarom de sessie stopte. Batterij en iOS-gedrag meten we per platform in de toesteltest.
2. **Dagdoel, weekprestatie en punten.** Het zelfgekozen dagdoel en de weekprestatie staan voorop; minuutpunten tegen een vaste, gepubliceerde ratio zijn bijzaak, met een plafond van 300 minuten per dag. Punten zijn inwisselbaar in een vooraf gefinancierde catalogus, bij voorkeur met collectieve of symbolische beloningen in plaats van koffievouchers. In de pilot liggen het vrijgaveschema en de puntenprijzen vooraf vast, gelijk voor alle armen, en de catalogus toont de voorraad naast het aantal studenten dat mag verzilveren. Geen cash-out, geen variabele koersen; eerste verzilvering na vijf uur getelde focus plus een wachttijd van zeven dagen.
3. **Squads, duels en verenigingen.** Drie tot zes vrienden zien live wie focust en bouwen een squadstreak op, met een herstelroute zonder punten. Duels worden gewonnen op gehaalde dagdoelen. Verenigingen strijden op deelnamegraad, met een ledental uit een externe bron dat openbaar op de ranglijst staat. Individuele vergelijking blijft binnen de squad. Buiten de tentamenperiodes pauzeert de route om een uiteengevallen squad opnieuw samen te stellen.
4. **Verdiende prijzen en de Belofte.** Prijzen op prestatie, met verificatie van winnaars en een uitslag die pas definitief is na een steekproef. De Belofte: de gebruiker belooft zichzelf dagen en minuten, met zijn squad als getuige en zonder punten. In de vroege arm krijgt hij dat aanbod zeven dagen vóór de stop van de doelbonus van zijn instelling, met een hernieuwingsaanbod bij de reflectie; in de late arm pas na april.

Trekkingen worden niet gebouwd; ze zijn een optie na toetsing. De inzetlaag (een opt-in commitment contract waarbij verbeurde inzet volledig naar een goed doel gaat) is visie, pas na native verificatie en een volgende ronde. Rewarded verdient nooit aan falen.

Het product is gespecificeerd tot op regel- en parameterniveau (`docs/research/05-productspecificatie.md`), met een UX-ontwerp, mockups en een architectuur waarin de server de scheidsrechter is; elke vereniging krijgt de tentamenkalender van haar instelling als parameter. Drie releases vóór het lanceringsbesluit (2 december, 16 december, 5 januari). De MVP wordt gebouwd met AI-ondersteunde ontwikkeling: de founder bouwt R1–R3 in november en december zelf. De toewijzings- en grootboekcode wordt vóór de A/A-controle bevroren en onafhankelijk gereviewd; een freelance senior engineer voor de toesteltest komt er als de eigen middelen dat toelaten. Die bouw valt vóór de begroting van deze ronde, die in januari 2027 begint.

**Deelnemersbescherming.** De pilot is een gerandomiseerd experiment op jongeren in hun drukste weken. Deelname is geïnformeerd, met opt-out zonder verlies van punten. 16- en 17-jarigen zitten in arm A, buiten de rustperiode-arm, met live aanwezigheid standaard uit. Een korte welzijnsmeting loopt bij instroom, bij de reflectie en na het seizoen, en vanaf week 2 meten we bij iedereen wekelijks twee items (stress, ervaren druk). Arm B stopt op die meting of op de schadesignalen, met een vooraf vastgelegde correctie voor herhaald kijken en een minimum van 40 deelnemers per arm. Vóór de uitbreiding geldt een absolute schadegrens (werkhypothese: schadesignalen bij minder dan 2% van de wekelijks actieven). Een tentamendag schort het dagdoel op. Geen marketing op sociale schaamte. We vragen een lichte ethische toets aan via een partneruniversiteit.

## Waarom nu

- **Instellingen erkennen de telefoon als probleem.** Yondr haalde volgens GovSpend $19 miljoen omzet bij Amerikaanse scholen in 2025, met een meer dan tienvoudige groei sinds 2021. Het grootste geld in "telefoon weg" komt van instellingen, en daar richten wij ons op.
- **"Study with me" is een bestaande cultuur op TikTok.** We hoeven het ritueel niet uit te vinden, alleen het meedoen mogelijk te maken.
- **De native API's bestaan.** De iOS Screen Time-API's en Android UsageStats maken verificatie mogelijk die er in de tijd van Hold niet was. Opal gebruikt ze al; voor ons zijn ze de volgende trede van de verificatieladder.

## Concurrentie en verdediging

- **Opal** heeft "Social Sessions" (vrienden blokkeren samen apps en zien wie de sessie verlaat) en **Forest** heeft "Plant Together" (verlaat één iemand de app, dan sterft de boom van de hele groep). Beide functies hebben we via zoekresultaten gezien; de pagina's zelf zijn niet geopend.
- **Opal for Schools.** Volgens zoekresultaten lanceerde Opal in september 2025 een aanbod voor scholen (eerste school Harvard-Westlake, Los Angeles): appblokkering, meldingen over naleving voor de school, optioneel beloningen en geanonimiseerde ranglijsten. Amerikaans voortgezet onderwijs; een aanbod voor universiteiten of Nederland is niet gevonden. Pagina's niet geopend, bronnen promotioneel.
- **Zelfbouw.** Een universiteit of een leverancier van studentenwelzijn kan een timer met een ranglijst per vereniging zelf inbouwen, en een vereniging kan een WhatsApp-challenge organiseren.

Opal en Forest zijn native, verifiëren sterker dan wij op het web en hebben veel meer bereik. "Wij hebben squads" is dus geen verdediging, en "verkoop- en compliancewerk dat een consumentenapp niet doet" ook niet: Opal verkoopt al aan instellingen, en een DPIA is voor een B2B-leverancier een minimumeis. Wat wel van ons kan zijn:

1. **Het verenigingsnetwerk per stad als kanaal.** Wij komen binnen via de studievereniging, een kanaal waar Opal for Schools (voor zover wij weten) niet zit. Elke vereniging die meedoet, maakt de ranglijst voor de andere verenigingen in de stad waardevoller.
2. **De rivaliteit tussen verenigingen.** Een gedeelde ranglijst op deelnamegraad, een gedeelde prijs en stad tegen stad: een sociale dynamiek die een instellingsapp of een WhatsApp-groep niet heeft. Of die mensen vasthoudt, meten we.
3. **Een eventueel gemeten nawerking.** Laat de pilot in april 2027 zien dat studenten blijven focussen na het einde van de doelbonus, dan hebben wij een resultaat dat Opal en Forest niet hebben. Lukt dat niet, dan rust de verdediging alleen op het kanaal en de rivaliteit, en dat zeggen we dan.

In elk budgethoudergesprek vragen we naar Opal for Schools, naar zelfbouw en naar het WhatsApp-alternatief, en leggen we de antwoorden vast. In de pilot meten we hoeveel deelnemers Forest of Opal gebruiken of gebruikten, en waarom ze Rewarded ernaast of in plaats daarvan gebruiken.

## Markt, wedge en go-to-market

We beginnen met de **blokchallenge**: hbo- en wo-studenten in de tentamenperiode van januari en februari 2027, per instelling volgens haar eigen kalender, via studieverenigingen in twee steden (werkhypothese Utrecht en Groningen). Verenigingen strijden op deelnamegraad om een collectieve prijs die ze verdienen; het bestuur krijgt een dashboard; leden vormen squads. Een vereniging telt als "schriftelijk toegezegd" met ledental (met bron), een promotieverplichting (kanalen, data), een contactpersoon in het bestuur en de tentamenkalender van haar instelling. We kiezen verenigingen waarvan de kalender bij de kalenderregel past en zeggen dat expliciet. Minstens één vereniging heeft een bestuur dat niet zelf heeft aangedrongen, en een deel van de pilot stroomt buiten verenigingen in; alle uitkomsten rapporteren we per instroomkanaal.

**De betaler** is niet de student en zelden de vereniging: 500 seats kosten bij onze prijshypothese €18.000 per jaar, wat een vereniging zelden zelf opbrengt. De waarschijnlijke betalers zijn een faculteit, studentenwelzijn of een werkgever die via een vereniging sponsort.

**Marktomvang.** Bij €36 per seat per jaar (hypothese) is het theoretische plafond in Nederland (773.270 hbo- en wo-studenten, CBS) ongeveer €27,8 miljoen per jaar (rekensom). €1 miljoen ARR vraagt ongeveer 27.800 seats, 3,6% van alle Nederlandse studenten. De SAM van onderaf (aantal verenigingen en leden in Utrecht en Groningen, deel actief in de tentamenperiode) vraagt de founder vóór 1 december op; tot dan staat er geen getal. De SOM voor de komende 15 maanden is het financierbare punt: ≥ 2.500 seats, ongeveer €90.000 geannualiseerd.

**Pad naar een bedrijf van betekenis.** Het kanaal is de verenigingscultuur, niet het aantal studenten. Landen met een verenigingskanaal: Nederland, Vlaanderen, het Verenigd Koninkrijk (societies) en Duitsland (Fachschaften); dat het kanaal daar net zo werkt, is een aanname. €5 miljoen ARR vraagt bij €36 per seat ongeveer 139.000 seats, ongeveer 280 contracten van 500 seats; bij €24 per seat ongeveer 208.000 seats en 420 contracten (rekensommen). 139.000 seats is ongeveer 18% van alle Nederlandse hbo- en wo-studenten, het hele jaar betaald. In Nederland alleen is dat niet realistisch; het vraagt minstens één tweede land. Zonder tweede land is het realistische beeld een Nederlandse tool van €1–3 miljoen ARR, en dat zeggen we zo. Vlaanderen, het VK en Duitsland vallen buiten deze ronde.

**Route.** We kiezen institutionele SaaS voor instellingen in landen met een verenigingskanaal, met verenigingen als kanaal. Daarin zit een spanning: wij claimen inputs (getelde focustijd, gehaalde dagdoelen), instellingen willen uitkomsten (studiesucces, minder uitval). We vragen daarom in elk budgethoudergesprek of een instelling op inputs alleen zou verlengen, vragen nu al naar geaggregeerde studievoortgang achteraf en meten zelfgerapporteerde studietijd en afleiding vóór en na. Richting instellingen heet wat wij meten "focustijd die telde (Rewarded zichtbaar op het scherm)", met het verificatieniveau bij elk cijfer; geen "geverifieerde studie-inzet".

**Seizoen.** Werkhypothese voor het model (aanname): vier tentamenperiodes per studiejaar, samen ongeveer twaalf weken. In de pilot geldt de kalender per instelling. Retentie rapporteren we altijd ook op kalendertijd.

## Plan en go/no-go

| Moment | Datum | Maten | Besluit |
|---|---|---|---|
| Start pilot | 1–2 dec 2026 | ≥ 1.500 aanmeldingen, ≥ 25% met een vriend; ≥ 5 verenigingen schriftelijk toegezegd, met tentamenkalender; focus-hook minstens even goed als geld-hook; rechtspersoon, DPIA ondertekend, voorregistratie, bevroren en gereviewde experimentcode, A/A-controle klaar | Zonder DPIA, voorregistratie of codereview geen uitnodigingen. Werkhypothese bij 3–4 verenigingen: kleinere pilot; bij minder dan 3: geen pilot in januari, wedge herzien. Te weinig eigen middelen: pilot in één stad |
| Commercieel criterium | vóór 19 jan 2027 | ≥ 3 getekende intentieverklaringen, elk ≥ €8 per seat per tentamenperiode (of ≥ €24 per jaar) en ≥ 150 seats, minstens één bij een betaler die niet afhangt van een aandringend bestuur; 10–15 budgethoudergesprekken met verplicht toekenningsmoment | Niet gehaald = geen aangetoonde betaler; geen draai naar werkgevers |
| Lanceringsbesluit (operationeel) | Na de laatste tentamenweek van het laatste pilotcohort (werkhypothese: niet vóór 8 februari 2027 als de Utrechtse kalender klopt; aanname) | Activatie ≥ 60%; D7 van het go/no-go-cohort (registratie 2–13 december) ≥ 25% als vaste lat; geschatte fraude uit de onafhankelijke steekproef met de bovengrens van het interval onder 5%; kosten binnen het pilottotaal (€1.500); geen stopregel voor deelnemersbescherming geraakt; schadesignalen bij minder dan 2% van de wekelijks actieven | **Stopregel: D7 < 15% = geen uitbreiding en geen tweede tranche.** Tussen 15% en 25%: hoogstens één herhaling; daarna geldt de stopregel. De encouragement-vergelijking rapporteren we, als drempel gebruiken we haar niet |
| Gecontroleerde uitbreiding | Na het lanceringsbesluit, semester 2 | Nieuwe verenigingen op uitnodiging; hoogstens 3.000 MAU met volledige beloningen (werkhypothese), daarboven een wachtlijst; kosten ≤ €0,06 per wekelijks actieve gebruiker per week (aanname); geen kanaal met geschatte fraude boven 10% | Kanaal boven de fraudegrens stopt; boven 3.000 MAU wachtlijst |
| Bedrijfsbesluit | na het aprilvenster (werkhypothese mei 2027) | Bindende voorwaarden voor tranche 2 (zie "Team en vraag"); nawerking in april (verkennend); squadeffect; arm A tegenover B; reactivering van squads; deelnamegraad per vereniging; welzijn; D30 buiten de tentamenweken van de eigen instelling | **Stopregel: D30 buiten de tentamenweken < 6% = geen tweede tranche en geen opschaling.** Alle voorwaarden (a)–(e) gehaald: tweede tranche; bij een nulresultaat op H3 een kleinere tranche zonder native bouw |

De precieze maten, analyse-eenheden, kleinste detecteerbare effecten, de kalenderregel en het vrijgaveschema staan in de voorregistratie (`docs/pilot/voorregistratie.md`, vóór 2 december); bij verschil geldt de voorregistratie. Een onafhankelijke analist (onafhankelijk onderzoeker, niet betaald naar uitkomst; naam volgt) draait de analyse. Generieke appbenchmarks (rapport 03) zijn achtergrond, geen go/no-go.

## Verdienmodel en unit economics

| Bron | Mechanisme | Rekensom (strategieteam, op kostenposten uit rapport 02) |
|---|---|---|
| B2B2C: faculteiten, studentenwelzijn, werkgevers via verenigingen | Seats per tentamenperiode of semester, met challenge, dashboard, geaggregeerde rapportage en een beloningsbudget van 30% in de prijs | Hypothese €36 per seat per jaar, ca. €9 per seat per tentamenperiode; marge ongeveer €17,82 per seat per jaar (ca. 50%), bij de ondergrens van €24 ongeveer €9,96 (ca. 41%). Met het seizoensprofiel (aanname: 30% actief in de tentamenperiode, 8% daarbuiten) ongeveer €120 omzet en €59 marge per in de tentamenperiode actieve student per jaar |
| Gratis laag | Punten, status, kleine catalogus | Geen omzet; een acquisitiekostenpost met een plafond van €0,25 per maandelijks actieve gebruiker per maand. De uitbreiding blijft binnen wat de post draagt (3.000 MAU in semester 2 kosten ten hoogste ca. €4.500) |
| Beloningen voor het onderzoekscohort | Gesloten pilot €1.500; daarna catalogus februari–april €4.000 en aprilchallenge €2.500 (werkhypotheses) | Aparte posten, gescheiden van de voorraad voor nieuwe gebruikers; vast vrijgaveschema en vaste puntenprijzen tot en met het aprilvenster. In de pilot is de kostenmaat het pilottotaal; de weekmaat (ca. €0,06 per wekelijks actieve gebruiker per week) geldt pas vanaf de uitbreiding |
| Sponsorchallenges | Een partij betaalt per voltooide challenge (schatting €1–3) | Alleen bij getekende omzet; niet in het basismodel |
| Rewarded Plus | Abonnement; blokkering komt pas met native | Niet in het basismodel; in de web-MVP een nepdeur ("Plus komt eraan, €2,99"), nooit in een app-build. Schrijft minder dan 5% van de D30-actieven zich in, dan verdwijnt Plus als bron uit deze pitch |

Niet in het model: gesponsorde vertoningen, trekkingen en de inzetlaag (bij volledige donatie een kostenpost). Nooit: het pool-model en een abonnement dat een prijzenpot vult.

**Actieve seat:** een seat met minstens twee sessiedagen per week in de tentamenperiode; dezelfde definitie in dashboard, contract en voorregistratie.

Wat de rekensom eerlijk laat zien: is in de tentamenperiode maar 12% van de seats actief, dan betaalt een klant ongeveer €300 per actieve student per jaar, en dan bestelt een inkoper waarschijnlijk niet opnieuw. Daarom toetsen we in de budgethoudergesprekken ook een prijs per actieve student per tentamenperiode, met als referentie voor een ander product dat Yondr ongeveer $30 per leerling rekent (rapport 01, niet geverifieerd). De eerste vijf contracten verdienen hun verkoopkosten niet in het eerste jaar terug (ongeveer €22,50 per seat tot het financierbare punt met ons eigen team, terugverdientijd ongeveer 15 maanden); het bedrijf hangt aan herhaalorders. Daarom verkopen we per tentamenperiode: dan kan een klant vóór maart 2028 opnieuw bestellen.

## Groei

Squads en duels zijn de motor: wie via een vriend komt, heeft een reden om terug te komen die niet om geld draait. Of dat zo is, toetsen we met een encouragement design (een gerandomiseerde squadprompt voor solo-gebruikers), met de ITT-schatting als hoofdresultaat en de IV-schatting als bovengrens; de ruwe vergelijking tussen squad en solo is alleen beschrijvend. Voor een seizoensproduct is de belangrijkste KPI de reactivering van squads in de volgende tentamenperiode. Verenigingsrivaliteit is de koude start, deelbare bewijskaarten met uren en streaks (nooit bedragen) zijn de versterker. Na het lanceringsbesluit groeien we alleen via uitnodiging van nieuwe verenigingen, tot wat het budget draagt. Referrals belonen we in punten die pas vrijkomen na drie sessies van de genodigde en na de wachttijd op zijn eerste verzilvering. Ambassadeurs werken met een contract (18+, geen geldclaims, herkenbare reclame) en worden betaald per gebruiker die op dag 14 minstens vijf sessies en een instellingsanker heeft en niet verdacht is in de steekproef, met een plafond (werkhypothese €5 per gebruiker, hoogstens 40 per ambassadeur per maand) en uitbetaling na de steekproef. K rapporteren we alleen uit uitnodigingen van gebruiker aan gebruiker. We delen geen bedragen, zetten geen beloning op delen en zijn afwezig op cashback- en "verdien geld"-platforms.

## Wat het bewijs zegt en wat we toetsen

Het bewijs draagt het mechanisme en begrenst het. Beloningen voor inputs zijn de veilige keuze; outputbeloningen pakten voor zwakkere studenten negatief uit. Beloningen moeten direct volgen. Kleine geldbedragen en een zichtbaar stukloon kunnen slechter werken dan niets, dus de gratis laag werkt met punten en status, dagdoel en weekprestatie staan voorop, en de impliciete waarde per punt publiceren we intern. Openbare individuele ranglijsten kunnen averechts werken, dus vergelijking blijft in de squad.

De pilot is een **verkennende pilot met één redelijk gepowerde vergelijking**. Wat we toetsen, letterlijk in de formuleringen en de nummering van de voorregistratie (§4):

- **H1 — Squadeffect.** "Solo-gebruikers die een sterke uitnodiging krijgen om een squad te vormen, vormen vaker een squad en zijn vaker op dag 7 actief."
- **H2 — Meer gehaalde dagdoelen tijdens het seizoen.** "Meer gehaalde dagdoelen tijdens het seizoen met een slinkend weekbudget (arm B) dan met gewone bijschrijving (arm A)." We claimen daarmee geen betere retentie. Dit is de ene redelijk gepowerde vergelijking.
- **H3 — Nawerking na het einde van de doelbonus (verkennend).** "Na het einde van de doelbonus focussen studenten in de volgende tentamenperiode vaker als ze bij de aankondiging van de stop van de bonus een Belofte aangeboden kregen (H3a), en als ze na het seizoen gewoon punten bleven verdienen of juist niet (H3b, zie richting)." H3 is verkennend tot de poweranalyse anders laat zien.
- **H4 — Fraude blijft beheersbaar (operationeel).** "Het geschatte aandeel frauduleuze accounts uit de onafhankelijke steekproef blijft onder 5%."

**H2 draagt geen bedrijfsbesluit.** Het bedrijfsbesluit rust op de bindende voorwaarden voor tranche 2, de stopregels en de verkennende uitkomsten (H3 en het squadeffect).

Bij H3: de vroege arm krijgt het Belofte-aanbod zeven dagen vóór de bonusstop van de eigen instelling, de late arm na april. In de rustperiode-arm (H3b) verdient de helft van de squads vanaf de bonusstop van de eigen instelling tot en met het aprilvenster geen punten; de aprilchallenge, met collectieve prijzen op deelnamegraad, is voor beide armen gelijk; daarna verdient iedereen weer. Wie uit de rustperiode stapt, verdient weer punten zonder uit het onderzoek te stappen; uitstappen rapporteren we per arm als uitkomst. Dit alles onder voorbehoud van de advocaat. De primaire maat ligt in de tentamenperiode van april 2027 en is binair: minstens één sessiedag in het aprilvenster.

De poweranalyse levert per hypothese het kleinste detecteerbare effect. Is dat groter dan plausibel, dan heet de hypothese verkennend en hangt er geen besluit aan.

## Juridisch en risico's

Wat in de pilot en de uitbreiding live gaat, kan zonder vergunning: punten en catalogus (vaste ratio, geen cash-out) en verdiende prijzen op deelnamegraad (geen kansbepaling; de advocatenopinie beoordeelt de rangprijs expliciet, met een terugvalvariant met alleen drempelprijzen). Trekkingen worden niet gebouwd; als ze ooit komen, geldt "stilte is nee". De rechtspersoon staat er vóór 18 november; alle overeenkomsten worden op haar naam getekend. De DPIA is ondertekend vóór de eerste uitnodiging (uiterlijk 1 december), met per verwerking een grondslag. De vragen over arm B en de rustperiode gaan nu al naar de advocaat; zonder antwoord vervalt de arm. Gebruiksvoorwaarden, challengevoorwaarden, een spelvoorwaardensjabloon, een privacyverklaring, een overeenkomst met verenigingen en een ambassadeurscontract liggen uiterlijk 18 november in concept bij de advocaat.

| Risico | Hoe we het uitsluiten of begrenzen |
|---|---|
| Niemand betaalt, of alleen symbolisch | Commercieel criterium vóór 19 januari met ondergrens voor prijs en seats; getekende opdracht vóór 1 mei als voorwaarde voor tranche 2; geen draai naar werkgevers |
| Verkoop duurt twee keer zo lang | Contracten per tentamenperiode, herhaalorder als maat; 21 maanden runway zonder omzet, zes maanden na het financierbare punt; toekenningsmoment in elk budgethoudergesprek |
| Budgetten 2027/'28 al verdeeld (eerste omzet september 2028) | Derde scenario doorgerekend, met conclusie stoppen of overbruggen |
| Opal for Schools, zelfbouw of een WhatsApp-challenge | Verdediging via verenigingskanaal en rivaliteit; antwoorden van budgethouders vastgelegd |
| De founder is van november tot januari alleen | Capaciteitsplan in uren per week, pilotbeheerder vanaf 2 december; bij krapte schuift de bouwscope, niet de poorten |
| Eigen middelen vóór de ronde schieten tekort | Pilot in één stad; DPIA, opinie-poorten, steekproef en codereview vervallen nooit |
| De pilotkalender past niet bij de tentamens | Kalenderregel per instelling, kalenders bevestigd uiterlijk 18 november, lanceringsbesluit na de laatste tentamenweek |
| Fraude rond de verenigingsprijs | Extern en openbaar ledental, identiteitsanker (instellingsmail of mobiel nummer) voor de teller, e-mailnormalisatie, verplichte steekproef bij winnaars met toestelvergelijking en oefensessie, hogere drempels voor campus- en CGNAT-netwerken, diskwalificatie met hoor en wederhoor; uitslag pas definitief na de steekproef |
| Echte leden laten hun account bespelen (zes accounts op één laptop) | Heuristiek voor gelijktijdige sessies; red-teamscenario vóór 25 november; diskwalificatiegrond |
| Meervoudige accounts in catalogus, referral en ambassadeurs | Alleen mobiele nummers, wachttijd van zeven dagen op de eerste verzilvering, vast vrijgaveschema, ambassadeursregel en -contract, referral-vesting |
| Deelnemers worden er slechter van | Geïnformeerde deelname met opt-out, wekelijkse welzijnsmeting, schadesignalen, uitvoerbare stopregel voor arm B, absolute schadegrens vóór de uitbreiding, minderjarigen in arm A met aanwezigheid uit, tentamendag, plafond van 300 minuten per dag, geen schaamte-marketing, lichte ethische toets |
| Het effect zakt weg na de beloning | Verkennend getoetst in april 2027, rustperiode tot en met het aprilvenster; bij een nulresultaat een kleinere tweede tranche zonder native bouw |
| Catalogus is schaars | Gescheiden, begrote posten; voorraad naast gerechtigden; schaarste vooraf benoemd |
| "Geverifieerd" als overclaim richting instellingen | "Focustijd die telde", met het verificatieniveau bij elk cijfer |
| Fraude met webverificatie | Geen geld op trede 1; fraudebeslisregel op de bovengrens van het interval; native verificatie later |
| Webverificatie in de praktijk | Batterij en iOS-gedrag per platform in de toesteltest |
| Apple-richtlijn 4.10, Family Controls-entitlement, Google Play | Entitlement aanvragen bij oprichting van het ontwikkelaarsaccount; ontwerp vooraf voorleggen; geen Plus-nepdeur in een app-build; Google Play-beleid vóór de Android-bouw |
| Beloningsjagers | Boodschap leidt met focus en samen; uitbreiding op uitnodiging; inverdienperiode en wachttijd; per kanaal sturen op kwaliteit |

## De founder

*Invulkader. De founder vult dit zelf in; het team verzint hier niets. Ongeveer een halve pagina.*

- **Achtergrond:** [in te vullen door de founder]
- **Netwerk in studieverenigingen en instellingen in Utrecht en Groningen** (wie neemt de telefoon op): [in te vullen door de founder]
- **Eerdere ervaring in bouwen** (wat, met wie, met welk resultaat): [in te vullen door de founder]
- **Eerdere ervaring in verkopen** (aan wie, welke omvang): [in te vullen door de founder]
- **Waarom deze founder voor dit probleem:** [in te vullen door de founder]

**Capaciteit van november tot het lanceringsbesluit.** Tot januari 2027 doet de founder het werk grotendeels alleen. Daarom is er een capaciteitsplan in uren per week per taak (businessplan §10; schatting van het strategieteam, aanname, met urenregistratie vanaf 4 november). In de drukste weken (november) schat het team de founder op ongeveer 35–47 uur per week, waarvan ongeveer de helft AI-ondersteunde bouw; juridisch werk, gesprekken en pilotbeheer staan apart begroot. Vanaf 2 december neemt een **pilotbeheerder** (freelance of student-assistent, 10–15 uur per week, werkhypothese €1.500 per maand uit eigen middelen) het beheer, de fraudesteekproef en de fraudewachtrij over. Wordt het te veel, dan schuift eerst de bouwscope van R3, nooit de steekproef, de DPIA, de opinie-poorten of de codereview.

**Begroting vóór de ronde.** De kosten van november en december (pilotbeheerder, het deel van de pilotprijzen vóór januari, de advocaat, de rechtspersoon, de verplichte review van de experiment- en grootboekcode, eventueel een freelance engineer, de statisticus) komen uit eigen middelen van de founder. Bedrag: **[invulkader, door de founder in te vullen]**; de posten staan in businessplan §10. Schieten de eigen middelen tekort, dan draait de pilot in één stad.

## Team en vraag

**Team.** Wij kunnen geen mensen verzinnen, dus eerlijk: de founder doet product en verkoop, en bouwt R1–R3 in november en december zelf met AI-ondersteunde ontwikkeling; die bouw valt vóór de begroting. Vanaf 2 december komt er een pilotbeheerder. Te werven vanaf januari 2027 zijn een full-stack engineer en een ontwerper in deeltijd, vanaf maand 4 een commerciële kracht in deeltijd. De senior engineer met native iOS-ervaring (Screen Time-API's) werven we pas bij tranche 2, vanaf juli 2027, en niet als de native bouw wordt uitgesteld. Een live product met fraudewachtrij en menselijke beoordeling vraagt naar onze schatting (aanname, in de pilot gemeten) 15–25 uur per week in de pilot; voor de uitbreiding herzien we die schatting op de gemeten uren. De investeerdersvoorwaarde "benoemde mensen" blijft open totdat ze er zijn.

**Financierbaar volgend punt** (werkhypothese, binnen 15 maanden, maart 2028): ≥ 5 betaalde contracten met in totaal ≥ 2.500 seats, ≥ 30% actieve seats in de tentamenperiode bij minstens twee klanten, en één herhaalorder (een tweede bestelling van dezelfde klant voor een volgende tentamenperiode of semester, niet de jaarverlenging). Daarna is er minstens zes maanden runway.

**Vraag: €560.000 pre-seed in twee tranches**, gelijk aan de begroting over 21 maanden.

| Post (21 maanden, aannames) | Bedrag |
|---|---|
| Team: founder, full-stack engineer, ontwerper 0,5 fte, commerciële kracht 0,5 fte vanaf maand 4, senior engineer native iOS vanaf maand 7 | €391.500 |
| Juridisch en fiscaal (bandbreedte €25.000–45.000, begroot op de bovenkant) | €45.000 |
| Onderzoek en meting (statisticus, welzijnsinstrument, ethische toets, onafhankelijke analist) | €8.000 |
| Campus, ambassadeurs, creators, kleine betaalde test | €50.000 |
| Gratis laag als acquisitiekostenpost (≤ €0,25 per MAU per maand), inclusief pilotprijzen en uitbreiding | €15.000 |
| Onderzoekscohort: aprilchallenge | €2.500 |
| Onderzoekscohort: catalogus februari–april | €4.000 |
| Infrastructuur, app-storeaccounts, tooling, verzekeringen | €21.000 |
| Buffer (ca. 4%) | €23.000 |
| **Totaal** | **€560.000** |

De begroting rekent met nul omzet en dekt 21 maanden, tot en met september 2028: zes maanden na het financierbare punt. Dat past binnen hetzelfde bedrag omdat de iOS-engineer pas bij tranche 2 begint; de buffer is daardoor dun (ca. 4%). Maand 1 is januari 2027 (aanname); de salarissen zijn aannames. Details in `docs/01-businessplan.md`, §10.

| Tranche | Bedrag | Dekt | Voorwaarde |
|---|---|---|---|
| 1 | €200.000 | Januari–juni 2027: pilot afronden, lanceringsbesluit, gecontroleerde uitbreiding, aprilchallenge en aprilmeting, juridische trajecten, eerste verkoop; geen native hire | Bij sluiting |
| 2 | €360.000 | Juli 2027–september 2028: native app (alleen als die niet is uitgesteld), verkoop aan instellingen per tentamenperiode, herhaalorders | Bindend: alle voorwaarden (a)–(e) gehaald, geen stopregel geraakt; (f) bepaalt de omvang |

**Voorwaarden voor tranche 2** (bindend, in dezelfde getallen in de voorregistratie):

- **(a)** Minstens één intentieverklaring is vóór 1 mei 2027 omgezet in een getekende opdracht.
- **(b)** Elke intentieverklaring noemt minstens €8 per seat per tentamenperiode (of €24 per seat per jaar) en minstens 150 seats; minstens één betaler hangt niet af van een aandringend bestuur.
- **(c)** Minstens 20% van de januari-actieven heeft in 1–14 februari minstens twee sessiedagen per week (valt dat venster bij een instelling nog in de tentamen- of herkansingsweken, dan bevestigt de founder vóór 2 december het na-seizoensvenster van die instelling).
- **(d)** Minstens 25% van de januari-actieven keert in het aprilvenster terug.
- **(e)** D7 van het go/no-go-cohort ≥ 25%, met hoogstens één herhaling in de zone 15–25%.
- **(f)** Bij een nulresultaat op H3 wordt tranche 2 beperkt tot €180.000 voor B2B2C en wordt de native bouw uitgesteld tot er bewijs is. Rekensom van het strategieteam: in dat geval loopt de runway tot ongeveer mei 2028, twee maanden na het punt in plaats van zes; er is dan ongeveer €75.000 extra besparing of een kleiner punt nodig (open punt founder).

**Drie scenario's** (nul omzet in de begroting):

| Scenario | Eerste omzet | Financierbaar punt in maart 2028 | Conclusie |
|---|---|---|---|
| Basis | Een tentamenperiode in semester 2 van 2026/'27 | Haalbaar | Volgende ronde ophalen, zes maanden runway |
| Verkoop twee keer zo lang | September 2027, per tentamenperiode | Haalbaar met een herhaalorder voor januari 2028 | Als basis, met minder marge in de tijd |
| Budgetten 2027/'28 al verdeeld | September 2028 | Niet haalbaar | Geen getekende opdracht vóór 1 mei 2027: geen tranche 2, **stoppen**. Wel een opdracht, maar met start in september 2028: **overbruggen** alleen als er vóór maart 2028 opdrachten voor 2028/'29 liggen voor ≥ 2.500 seats, anders stoppen (voorstel strategieteam; besluit founder) |

**Mijlpalen.** Deze week DPIA-light voor de wachtlijst en vragen 2 en 3 naar de advocaat; vóór 18 november rechtspersoon, tentamenkalenders bevestigd en juridische concepten bij de advocaat; vóór 25 november red-teamdag, poweranalyse, stopregel arm B en Hold-gesprek; vóór 1 december verenigingsgegevens, pilotbeheerder en ondertekende DPIA; vóór 2 december voorregistratie met tranche-2-voorwaarden, kalenderregel en vrijgaveschema; 2 december tot de laatste tentamenweek per instelling gesloten pilot; vóór 19 januari commercieel criterium; na de laatste tentamenweek van het laatste pilotcohort lanceringsbesluit en gecontroleerde uitbreiding; na de herkansingen per instelling meting D30 buiten de tentamenweken; april 2027 nawerkingsmeting; vóór 1 mei 2027 getekende opdracht; mei 2027 (werkhypothese) bedrijfsbesluit en tweede tranche; vanaf juli 2027 werving iOS-engineer (tenzij uitgesteld); studiejaar 2027/'28 contracten per tentamenperiode en een herhaalorder; maart 2028 financierbaar punt; september 2028 einde runway. Niet in deze ronde: inzetlaag, trekkingen, Vlaanderen, het VK en Duitsland.

## Wat ons van gedachten doet veranderen

D7 onder 15%, of na één herhaling nog onder 25%: geen uitbreiding en geen tweede tranche. D30 buiten de tentamenweken van de eigen instelling onder 6%: geen tweede tranche en geen opschaling. Een van de voorwaarden (a)–(e) niet gehaald, waaronder geen getekende opdracht vóór 1 mei 2027: geen tweede tranche, ook als geen stopregel geraakt is. Geen drie intentieverklaringen met ten minste €8 per seat per tentamenperiode en 150 seats vóór 19 januari: geen aangetoonde betaler, en we draaien niet naar werkgevers. Te weinig eigen middelen vóór de ronde: pilot in één stad. Geen effect van de squadprompt: de sociale loop is niet aangetoond en de productloop gaat voor groei. Geen nawerking in april: tranche 2 kleiner en zonder native bouw, en de verdediging rust alleen op het verenigingskanaal en de rivaliteit, en dat zeggen we. Bovengrens van de geschatte fraude op of boven vijf procent: geen uitbreiding in dat kanaal. Minder dan 30% actieve seats in de tentamenperiode bij de eerste klanten: de prijs per seat houdt geen stand en we schakelen over op een prijs per actieve student. Minder dan 5% van de D30-actieven schrijft zich in voor Plus: Plus verdwijnt uit deze pitch. Budgethouders kiezen voor Opal for Schools of zelfbouw: de route wordt herbeoordeeld. Een schadesignaal boven de vooraf vastgelegde grens: arm B stopt; schadesignalen bij 2% of meer van de wekelijks actieven: geen uitbreiding vóór beoordeling door de onderzoeker.

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

**Ronde 2 — 4 november 2026.** Herzien na pitchronde 2 volgens de bindende besluiten in `docs/pitch/ronde-2-founder-reactie.md`, gelijkgetrokken met `docs/01-businessplan.md` v3. Versie v3.

- Nieuwe sectie "Wat er sinds ronde 2 veranderde": kalender per instelling, gecontroleerde uitbreiding in plaats van een open lancering, rustperiode tot en met het aprilvenster, bindende tranche-2-voorwaarden (besluiten 1–3, MF1, MF2). De term "publieke lancering" is verdwenen (S1).
- Go/no-go-tabel herschreven: lanceringsbesluit na de laatste tentamenweek van het laatste pilotcohort, D7 ≥ 25% als vaste lat met hoogstens één herhaling, fraude op de bovengrens van het interval, kosten als pilottotaal, schadegrens; rij "Gecontroleerde uitbreiding" in plaats van de lancering; commercieel criterium met ondergrens voor prijs en seats (MF1, MF5, G3, G-S2, G-S7, J4).
- Tranche-2-voorwaarden (a)–(f) in getallen; contracten per tentamenperiode met de herhaalorder als maat; iOS-engineer naar tranche 2; begroting over 21 maanden met zes maanden runway na het punt en een buffer van ca. 4%; drie scenario's met conclusie bij eerste omzet in september 2028; rekensom voor geval (f) als open punt (MF1, MF2).
- Nieuwe sectie "De founder" met invulkader voor achtergrond, netwerk en ervaring in bouwen en verkopen, plus capaciteitsplan, pilotbeheerder en begroting vóór de ronde met terugval naar één stad (MF3).
- Concurrentie uitgebreid met Opal for Schools (via zoekresultaten, gemarkeerd) en zelfbouw; verdediging herformuleerd naar verenigingskanaal, rivaliteit en een eventueel gemeten nawerking (MF4).
- Aparte posten voor de aprilchallenge en de catalogus februari–april; vast vrijgaveschema; weekmaat pas vanaf de uitbreiding (MF5, G3).
- Pad naar een bedrijf van betekenis: landen met een verenigingskanaal en wat €5 miljoen ARR vraagt; de EU/VK-marktomvang verwijderd als argument (S3). Prijs per actieve student met de Yondr-referentie (S2); definitie actieve seat (S5); Plus-drempel van 5% (S7); verlengen op inputs als vraag (S8).
- "H2 draagt geen bedrijfsbesluit" letterlijk opgenomen (G-S10); hypothese-uitleg bijgewerkt naar Belofte zeven dagen vóór de bonusstop, rustperiode tot en met het aprilvenster, gescheiden uitstap, H3 primair binair (besluit 3, J2, G-S9); deelnemersbescherming met wekelijkse meting, stopregel met correctie en minimum-n (G4); ITT als hoofdresultaat, reactivering van squads, pauze van hersamenstelling (G-S1, G-S6); onafhankelijke analist (G-S11); codebevriezing en review (G-S12).
- Juridisch: rechtspersoon vóór 18 november en vragen 2 en 3 direct naar de advocaat (J6, J7); ambassadeurscontract (J5); "geverifieerd" vervangen door "getelde focus" en "focustijd die telde" (J3); samenspanning met één laptop in de risicotabel (J1); catalogusschaarste (J10); geen Plus-nepdeur in een app-build (J12).
