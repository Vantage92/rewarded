# Pitchronde 1 — Beoordeling jurist en fraude-expert

*Beoordelaar: jurist (kansspelrecht, consumentenrecht, AVG, betaaldiensten) en fraude-expert. Onafhankelijk van het team dat de plannen schreef. Datum: 4 november 2026. Gelezen: `docs/pitch/pitch.md`, `docs/01-businessplan.md`, `docs/02-productplan.md`, `docs/pitch/README.md`, `docs/research/02-businessmodel-juridisch-unit-economics.md` en `docs/research/09-verificatietechniek.md` volledig, en uit `docs/research/07-architectuur.md` het domeinmodel (§3), het sessieprotocol (§4), het puntenmodel (§5), de ranglijstberekening (§6), de trekkingen (§7) en beveiliging en AVG (§10). Waar nodig ook `docs/research/05-productspecificatie.md` (§3.1, §3.8–3.11, §4.2–4.10, §6, §7.3, §9). Dit is geen formeel juridisch advies; het vervangt de geplande advocatenopinie niet.*

## Oordeel: GO MET VOORWAARDEN

Het juridische fundament is beter dan ik bij een pre-seed-plan gewend ben. De gevaarlijke modellen zijn weggelaten (pool, abonnement dat een pot vult). De trekkingen staan achter een vlag. Geld komt pas na native verificatie. Er is geen cash-out en geen vrij besteedbaar tegoed, en dat is in de database afgedwongen. Negatieve besluiten neemt altijd een mens, met vier ogen en beroep. Daarover hoeven we niet te twisten.

Het zwakke punt is de fraude, en dan niet waar het team zoekt. Het team bewaakt fraude met de catalogus en de trekkingen. De echte prikkel in deze pilot is de **verenigingsprijs met campusrivaliteit**, en precies daar staan de detectiemiddelen uit: de uitzondering voor campus- en mobiele netwerken zet H2, H7 en H10 buiten werking, en het ledental is zelfopgave. Daar komt bij dat de go/no-go-maat voor fraude ("gemarkeerde sessies < 5%") meet hoeveel we vinden, niet hoeveel er gebeurt. Met de huidige heuristieken is een laag getal geen bewijs van weinig fraude. Daarmee is het fraudecriterium van de pilot ongeldig, en zonder reparatie zijn ook de ranglijst en de deelnamegraad onbetrouwbaar.

Juridisch zijn er twee dingen die vóór de eerste gebruiker rond moeten zijn: de DPIA, met een juiste grondslag per verwerking, en de gebruiks- en challengevoorwaarden. Beide zijn gepland, maar de plannen behandelen ze als papierwerk naast de bouw. Op een aantal punten moeten ze de bouw juist veranderen. Ik geef GO MET VOORWAARDEN als de zes must-fixes hieronder worden opgelost. Geen ervan vraagt een ander product. Wel vragen ze een paar ontwerpwijzigingen en een harde planning tot 2 december.

## Scoretabel

| Criterium | Score | Motivering (vanuit mijn rol) |
|---|---|---|
| Probleem en doelgroep | 7 | Afgebakend en eerlijk. De keuze voor 16+ in de gratis laag is juridisch houdbaar: zonder toestemming als grondslag geldt art. 8 AVG niet, en art. 5 UAVG legt de grens voor ouderlijke toestemming op zestien jaar (gecontroleerd in de BWB, toestand vanaf 1 september 2026). Minderjarigen in een gerandomiseerd beloningsexperiment vragen wel extra zorg (must-fix 5). |
| Oplossing en gedragseffect | 6 | Buiten mijn vakgebied. Wel relevant: de eerlijke claim ("telt zolang de app zichtbaar openstaat") is goed, en de lintregel tegen het woord "bewezen" ook. De pitch zelf gebruikt "bewezen focus" drie keer (should-fix 1). |
| Beloningsmodel | 5 | Legaal opgezet: vaste ratio, geen cash-out, verdiende prijzen zonder kansbepaling, trekkingen uit. Uitlegbaar. Economisch gedekt door de dekkingsregel. Niet fraudebestendig waar het telt: de verenigingsprijs en de detectie (must-fix 1–3). |
| Groei | 5 | Juist geen beloning op delen, referral pas na vesting, nooit in geld (art. 1a Wok). Maar ambassadeurs worden betaald per gebruiker die op dag 7 actief is. Dat is betalen per account dat een browsertab open heeft, en dus een prikkel om nepaccounts te maken (must-fix 3). |
| Unit economics | 5 | De kansspelbelasting is correct verwerkt: 37,8% en 100/62,2, gecontroleerd in art. 5 Wet KSB, toestand 2026-01-01. De vrijstelling van art. 4 en de samentelling van prijzen per trekking (art. 4 lid 2) zijn niet uitgewerkt. Fraudeverlies is in de pilot niet begroot. Voor de inzetlaag ontbreken btw en giftenaftrek, en die kunnen "100% naar een goed doel" onbetaalbaar maken (should-fix 7). |
| Verdediging | 5 | Compliance-by-design (grootboek, dekkingsregel, vier ogen, aantoonbaar eerlijke loting) is moeilijk na te bouwen voor een snelle kopie, en verenigingsrelaties zijn een kanaal. Geen van beide is een juridische drempel voor een grote speler. |
| Uitvoerbaarheid | 5 | Een advocatenopinie, DPIA, verwerkersovereenkomsten, gebruiks-, challenge- en spelvoorwaarden, een Ksa-voorlegging en een beoordeling van arm B, allemaal tussen 4 en 25 november of 2 december, naast een bouw met twee à drie ontwikkelaars. Dat lukt alleen met een benoemde eigenaar en een terugvalregel per punt (must-fix 6). |
| Risico's | 6 | De showstoppers zijn benoemd en gekoppeld aan poorten. Maar enkele poorten hebben geen standaarduitkomst: wat gebeurt er als de Ksa niet antwoordt, of als de opinie op 2 december niet binnen is? Het grootste operationele risico, fraude rond de verenigingsprijs, staat niet in de risicotabel. |

## Must-fix

### 1. Het fraudecriterium van de pilot meet detectie, niet fraude

**Wat.** De go/no-go is "gemarkeerde sessies < 5%; afgekeurd na herbeoordeling ≤ 5%" (productplan §8, pitch fase-tabel). Bij "fraude boven 5%" gaan de beloningen omlaag (businessplan §9). Maar de markeringen komen uit H1–H10, en die zijn grotendeels te omzeilen of staan bewust uit:

- H1 (`navigator.webdriver`) is met één regel te overschrijven. De architectuur legt dat zelf vast: de e2e-suite controleert dat een headless browser met overschreven `webdriver` een ongemarkeerde sessie haalt (07 §4.6).
- H2 (meer dan 3 accounts per IP-hash), H7 (nep-squad) en H10 (verenigingsgolf) slaan netklassen `campus` en `mobile_cgnat` over (07 §4.5, productplan §10). Wie in de UB op eduroam zit of zijn telefoon als hotspot gebruikt, valt buiten alle drie.
- H9 (claimvertraging) is te omzeilen met een script dat na het einde direct een `pointerdown` stuurt.
- H5 en H6 vangen alleen extremen (480 minuten drie dagen achter elkaar, nachtsessies).

Een laag aandeel markeringen is dus even goed verklaarbaar door weinig fraude als door weinig detectie. Het criterium kan de pilot niet laten zakken op fraude, en de geplande publicatie "hoeveel sessies onterecht beloond" (spec §6.5) heeft geen meetbron.

**Waarom must-fix.** Dit maakt een van de vier go/no-go-criteria ongeldig. De andere criteria (D7 per arm, squad tegenover solo, deelnamegraad, K) worden even vatbaar voor vertekening door nepaccounts, en de pilot kan dat niet zien.

**Oplossingsrichting.**
- Neem een onafhankelijke fraudeschatting op naast de markeringen: een willekeurige steekproef van bijvoorbeeld 30 actieve accounts per week, gestratificeerd per vereniging. De controle is licht: is het e-mailadres van een instelling, is het telefoontype mobiel, zijn er sessiepatronen, en volgt er een kort contact met de vraag om de squad of de vereniging te bevestigen. Rapporteer het geschatte aandeel met een betrouwbaarheidsinterval, en maak dat de go/no-go-maat. Het aandeel markeringen blijft een maat voor de wachtrijlast.
- Laat vóór 25 november een red-team (twee mensen, één dag) met een headless browser, een hotspot en e-mailaliassen proberen tien accounts door de inverdienperiode en één verenigingsweek te krijgen. Leg vast wat lukte. Neem de uitkomst op in de voorregistratie.
- Zet in de voorregistratie dat de KPI's ook worden gerapporteerd zonder de accounts die de steekproef als verdacht aanmerkt (een gevoeligheidsanalyse).

### 2. De verenigingsprijs is de grootste fraudeprikkel en heeft de zwakste controles

**Wat.** De collectieve prijs is hooguit €150 plus €75 in natura. Maar de prikkel is status in een rivaliteit die het product bewust opstookt (businessplan §6: "vereniging tegen vereniging, daarna stad tegen stad"). Bij beloningsplatforms zie ik het steeds weer: groepsprijzen met een publieke ranglijst lokken meer manipulatie uit dan individuele prijzen van dezelfde waarde, omdat het bestuur de fraude kan organiseren en het als "voor de club" voelt. De zwakke plekken:

1. **Ledental is zelfopgave** (spec §4.6: "opgegeven door het bestuur met bron, plausibiliteit gecontroleerd"). De noemer is `max(opgegeven ledental, gekoppelde leden)`. Een bestuur dat 400 leden heeft maar er 120 opgeeft en alleen de fanatiekelingen laat koppelen, verdubbelt of verdrievoudigt zijn deelnamegraad en komt ook nog in een kleinere poule (de poules zijn ingedeeld op opgegeven ledental). De beveiliging "noemer kan niet krimpen door weinig leden te koppelen" werkt alleen als het opgegeven getal klopt. Het codeplafond van 1,1 × het opgegeven ledental remt dit niet; het beperkt alleen het opblazen.
2. **Geen identiteitsanker per meegeteld lid.** Telefoonverificatie komt pas bij de eerste verzilvering (productplan §3). Om in de teller van de deelnamegraad te komen, hoeft een lid alleen drie dagen zijn dagdoel van minimaal 25 minuten te halen: 75 minuten een zichtbare tab per week. Met e-mailaliassen (plus-adressen en Gmail-punten worden niet genormaliseerd; 07 §3.1 noemt alleen "uniek, lowercase") en een headless browser op eduroam zijn twintig extra "leden" een avond werk voor één bestuurslid.
3. **De steekproef start alleen bij veel markeringen.** Een steekproef van 20 accounts komt er pas als meer dan 10% van de sessies van een vereniging gemarkeerd is (07 §6.2, spec §4.7). Door punt 1 van must-fix 1 wordt dat juist bij georganiseerde clubfraude niet gehaald.
4. **Kwalificatie onder de Wok.** Ik deel de lijn van het team dat een prijs op een vooraf bekende drempel (drempelprijs) of op eigen prestatie geen kansspel is. Bij de hoofdprijs hangt de uitslag ook af van de prestaties van andere verenigingen. Volgens ABRvS 13 januari 2021 (ECLI:NL:RVS:2021:2, geciteerd in rapport 02) is beslissend of de deelnemers "in het algemeen overwegende invloed" hebben. Bij een prestatiewedstrijd tussen groepen is dat verdedigbaar, net als bij sport. Maar als de uitslag in de praktijk afhangt van technische afbrekingen die de deelnemer niet beheerst (Wake Lock die vervalt, een inkomend gesprek, iOS-gedrag in de Home Screen-app), en die verschillen per toestel en per vereniging, dan geeft dat een advocaat iets om op te letten. De opinie moet dit expliciet beoordelen. Er moet ook een terugvalvariant klaarliggen: alleen drempelprijzen, geen rangprijs.

**Waarom must-fix.** Gemanipuleerde deelnamegraden maken de wedge-uitkomst ongeldig ("welke vereniging focust het meest"). Ze vertekenen D7, het squadaandeel en K, omdat nepleden ook in squads gaan. En ze leveren het voorspelbaarste reputatieverhaal op dat deze pilot kan krijgen: "Blokk-challenge gewonnen met nepaccounts" in een universiteitsblad, precies het kanaal dat het team voor de dataverhalen wil gebruiken.

**Oplossingsrichting.**
- **Ledental extern en openbaar.** Neem het ledental over uit een bron die het bestuur niet zelf maakt: de opgave aan de instelling voor de erkenning of de bestuursbeurs, of een bevestiging van de faculteit. Leg het vast vóór het aanloopklassement. Toon het naast elke vereniging op de ranglijst: rivaliserende besturen kennen elkaars omvang en zijn de goedkoopste controleurs. Een vereniging zonder externe bron doet mee aan het klassement, maar niet om de hoofdprijs.
- **Identiteitsanker voor de teller.** Laat in de prijsperiode alleen leden in de teller tellen die een e-mailadres van een hbo- of wo-instelling hebben bevestigd (domeinlijst van de pilotinstellingen; geen extra persoonsgegevens, alleen een vinkje en het domein) of een geverifieerd mobiel nummer. Leden zonder anker blijven in de noemer. Zo loont nepleden toevoegen niet.
- **Normaliseer e-mailadressen** bij registratie (plus-adressen weg, punten weg bij providers die ze negeren) voor de uniekheidscontrole. Bewaar het genormaliseerde adres als hash naast het echte.
- **Verplichte steekproef bij elke prijswinnaar**, los van het aandeel markeringen: bij elke hoofdprijswinnaar en elke vereniging die de drempel haalt, een steekproef van 20 meegetelde leden (of allemaal bij minder dan 20), met de lichte controle uit must-fix 1.
- **Campusuitzondering aanscherpen voor H10 en H7.** Laat campus- en CGNAT-adressen niet volledig wegvallen. Tel ze met een hogere drempel, en leg die drempel vóór 2 december op de seed vast. Het team koos voor overslaan omdat een hogere drempel "een getal vraagt dat we niet kunnen onderbouwen" (07 §4.5). Maar overslaan is ook een getal, namelijk oneindig. Een red-teamtest (must-fix 1) levert het getal.
- **In de challengevoorwaarden** (must-fix 6): diskwalificatie van een vereniging bij aangetoonde georganiseerde manipulatie, met hoor en wederhoor van het bestuur; prijs naar de volgende plaats; de definitieve uitslag pas na de steekproef.

### 3. Meervoudige accounts in de catalogus, referral en ambassadeurs: de plafonds dekken het niet alleen

**Wat.** De plafonds (€5 per item, €15 per persoon per maand, één verzilvering per week) begrenzen de schade per account. Ze begrenzen niet het aantal accounts. Het enige anker voor de verzilvering is één geverifieerd telefoonnummer per account. Wat ontbreekt:

- Geen controle op het nummertype. Virtuele en VoIP-nummers die sms ontvangen, kosten centen. Bij Nederlandse prepaid-simkaarten is registratie, voor zover ik weet, niet verplicht (**niet geverifieerd** in deze sessie). Een fraudeur met twintig nummers, twintig aliassen en een VPS of hotspot haalt twintig keer €15 per maand. Dat is weinig geld, maar de vouchervoorraad wordt **wekelijks en beperkt** vrijgegeven (spec §4.3). Fraudeurs, die om maandag 04:00 klaarstaan, nemen de voorraad weg voor de eerlijke studenten die "Deze week op" zien. Dat is het mechanisme waardoor beloningsplatforms leeglopen: niet het verlies in euro's, maar eerlijke gebruikers die afhaken omdat er nooit iets is.
- Er is geen menselijke of vertraagde stap tussen inverdienperiode en eerste verzilvering. Een prijs wordt na 14 dagen geleverd, een voucher direct.
- **Ambassadeurs worden betaald per gebruiker die op dag 7 actief is** (businessplan §6). Op het web is "actief" een open tab. Dit is een betaling per account met een directe geldprikkel buiten de plafonds, en is in mijn ervaring de snelst groeiende fraudebron in campusprogramma's.
- **Referral** (vanaf 5 januari): 150 punten voor beide partijen, vesting na drie sessies van 25 minuten in 7 dagen, wat met een script triviaal is. Het maximum van vijf per maand en de helft uit eigen punten zijn goed. De uitsluiting van "zelfde IP-hash binnen 24 uur" werkt niet bij campus en CGNAT, waar de spec die uitsluiting juist uitzondert.

**Waarom must-fix.** Ongecontroleerde accounts maken de beloningskosten per echte gebruiker onvoorspelbaar ("beloningskosten binnen budget" is een go/no-go). Ze laten de catalogus voor eerlijke studenten leeg. En de ambassadeursbetaling is geld dat direct naar fraude kan stromen.

**Oplossingsrichting.**
- Een nummertypecontrole bij de sms-verwerker (alleen mobiele nummers, geen VoIP of virtuele nummers), en hoogstens één verzilverend account per `client_device_id` per week, als signaal voor de wachtrij en niet als automatische weigering.
- Een **wachttijd van 7 dagen op de eerste verzilvering** na het halen van de inverdienperiode, in die tijd een lichte menselijke blik op nieuwe verzilveraars (in de pilot gaat het om honderden, niet tienduizenden). Daarna vervalt de wachttijd.
- Een deel van de weekvoorraad gereserveerd voor accounts met een anker van een instelling (must-fix 2), of de vrijgave over de week verspreiden in plaats van in één keer op maandag 04:00.
- **Ambassadeurs niet betalen per account op dag 7** maar per gebruiker die op dag 14 minstens vijf sessies heeft, een anker van een instelling heeft en niet in de steekproef verdacht is. Met een plafond per ambassadeur en uitbetaling pas na de steekproef. Geen ambassadeur mag zelf bestuurslid zijn van een vereniging die om de prijs meedoet.
- Referral: vesting pas na de wachttijd van de eerste verzilvering, en niet als genodigde en uitnodiger hetzelfde `client_device_id` hebben.

### 4. Gratis trekkingen: de standaarduitkomst ontbreekt, en de pitch zegt iets anders dan het plan

**Wat.** Het productplan laat trekkingen uit tot er een advocatenopinie, een "positieve voorlegging" bij de Ksa en een besluit van de founder zijn. De pitch zegt: "Alles wat bij de lancering live gaat, kan zonder vergunning: … gratis trekkingen onder de Gedragscode promotionele kansspelen" en noemt de trekkingen een van de vijf onderdelen. Drie problemen:

1. De Ksa geeft, voor zover ik weet, geen bindende voorafgaande rulings op promotionele kansspelen. De Gedragscode is een gedoogkader zonder wettelijke basis (rapport 02 §2.2, via WODC 2024; de Gedragscode zelf staat niet in de BWB, mijn zoekopdracht daar gaf nul resultaten). Een "positieve voorlegging" kan dus heel lang uitblijven of informeel en voorwaardelijk zijn. Het plan zegt niet wat er dan gebeurt.
2. De opdeling in een reeks kleine spellen van hooguit €4.500 voor één app is precies wat de Ksa volgens WODC "het vergunningenstelsel volledig ondermijnt" vindt. Met wekelijkse trekkingen als vast onderdeel van de app ligt ook het risico van een "zelfstandige activiteit" voor de hand.
3. Voor de kwalificatie (weekdoel op vijf van zeven dagen) geldt het web-bewijs van trede 1. Nepaccounts verdunnen dus de kans van eerlijke deelnemers. De verificatie bij de winnaar beschermt de prijs, niet de kansverdeling.

**Waarom must-fix.** Als een investeerder of partner de pitch leest, lijken trekkingen een vast onderdeel dat juridisch al rond is. Dat is het niet. Bouw je businesscase of je partnergesprekken daarop, dan is dat onhoudbaar als de Ksa nee zegt of niets zegt. Als de vlag om tijdsdruk toch aangaat zonder opinie, is dat juridisch onhoudbaar (art. 1 onder a Wok; een gratis trekking is een kansspel, rapport 02 §2.1).

**Oplossingsrichting.**
- Leg de beslisregel vast: **geen schriftelijke opinie plus geen expliciete, schriftelijke reactie van de Ksa = de vlag blijft uit**. Stilte is nee. Zet dat in het productplan.
- Pas de pitch aan: trekkingen zijn een optie na toetsing, geen onderdeel van de lancering, en het verdienmodel en de unit economics van de gratis laag (die €0,08 prijzenpot en €0,05 KSB bevatten) worden ook zonder trekkingen doorgerekend.
- Kies vóór de voorlegging de veiligste structuur: liever één promotioneel spel per jaar met hooguit twintig trekkingen en een pot onder €100.000 (Gedragscode art. 2, zoals weergegeven in WODC 2024), dan een reeks kleine spellen. Dat is ook het verhaal dat je aan de Ksa kunt vertellen.
- Laat de fiscalist de vrijstelling van **art. 4 Wet KSB** en de samentelling van **art. 4 lid 2** (alle prijzen van dezelfde schuldenaar die op dezelfde toevallige gebeurtenis vallen, gelden als één prijs) op de gekozen structuur toepassen. Ik kon in de BWB (toestand 2026-01-01) vaststellen dat art. 4 bestaat en dat lid 2 zo luidt; de onderdelen van lid 1, met het bedrag van de vrijstelling, gaf de tool niet terug (**niet geverifieerd**). Rapport 02 rekent elke prijs met de volle 60,8% opslag. Dat is voorzichtig, maar misschien te duur.

### 5. De DPIA moet de bouw veranderen, niet alleen beschrijven, en moet af zijn vóór de eerste verwerking

**Wat.** Art. 35 AVG vraagt een DPIA *voorafgaand* aan de verwerking. Het plan zet hem "vóór 2 december", maar de wachtlijst verwerkt al sinds 4 november, en de A/B-toewijzing van de wachtlijsttest vanaf de eigen pagina. Inhoudelijk zie ik vier punten die de DPIA moet oplossen en die nu verkeerd of open staan:

1. **Grondslag.** 07 §10.5 noemt "overeenkomst voor de kernfunctie, toestemming voor de rest". De gerandomiseerde toewijzing aan armen (A/B, vroeg/laat), het eventlog voor de KPI-analyse en de fraudeheuristieken zijn niet noodzakelijk voor het uitvoeren van de overeenkomst in de zin van art. 6 lid 1 sub b AVG. De EDPB legt die grond strikt uit, en verbetering van de dienst en analyse vallen er in de regel niet onder. Toestemming past ook slecht, omdat weigeren de pilot ongeldig maakt. De houdbare grond is **gerechtvaardigd belang** (sub f), met een schriftelijke belangenafweging die rekening houdt met 16- en 17-jarigen.
2. **Minderjarigen in het experiment.** 16- en 17-jarigen krijgen dezelfde live aanwezigheid, standaard aan (productplan §10), en worden net als iedereen aan de verliesarm toegewezen. Dat de aanwezigheid alleen voor de eigen squad zichtbaar is, maakt het verdedigbaar onder art. 25 lid 2. Maar voor een minderjarige is "privacy standaard aan" de veiliger keuze, met de schakelaar in de onboarding. Of 16- en 17-jarigen in arm B mogen, hangt af van de beoordeling op oneerlijke handelspraktijk (open vraag 5 van de spec). Als het oordeel twijfelachtig is: stratificeer op leeftijdsklasse en zet 16- en 17-jarigen in arm A. Dat kost een klein stukje power, maar bespaart een ethisch verhaal.
3. **Verwijdering is minder volledig dan beloofd.** 07 §10.7 zegt dat events na `DELETE /me` "aan geen andere rij meer te koppelen" zijn. Maar `event` heeft een eigen kolom `squad_id` (07 §3.5), die bij verwijdering niet wordt gewist. Een squad heeft drie tot zes leden; met tijdstempels en arm is een individu daarin vaak te herleiden. Dan zijn het gepseudonimiseerde persoonsgegevens, geen anonieme data, en vraagt bewaren na verwijdering een grond (art. 17 lid 3 AVG, of art. 89 met waarborgen). Wis of vervang `squad_id` bij verwijdering, of neem de onderzoeksuitzondering expliciet op in DPIA en privacyverklaring.
4. **Rol van de vereniging.** Open vraag 14. Als het bestuur bepaalt dat er een challenge komt, leden werft met een code en een dashboard krijgt, bepaalt het mee over het doel. Dat wijst eerder op gezamenlijke verantwoordelijkheid (art. 26 AVG) dan op "ontvanger van aggregaten". Leg de rol vast in een korte overeenkomst per vereniging, met de regel dat de vereniging geen enkele poging doet tot herleiding en geen ledenlijst uploadt.

Kleinere punten voor de DPIA, geen must-fix op zich: de `client_device_id` in IndexedDB is opslag van informatie op de randapparatuur (art. 11.7a Telecommunicatiewet, gecontroleerd in de BWB). Ik verwacht dat de uitzondering in lid 3 voor wat strikt noodzakelijk is voor de gevraagde dienst geldt voor de sessie- en fraudefunctie. Maar die onderdelen gaf de tool niet terug, dus: **niet geverifieerd**, en vastleggen. Bij de leeftijdscontrole van winnaars van 18+-prijzen geen kopie van een identiteitsbewijs maken en het BSN niet verwerken. `blocked_phone_hash` na verwijdering (twee jaar) uitleggen in de privacyverklaring. En het hashen van telefoonnummers en IP-adressen is pseudonimisering, geen anonimisering, wat de architectuur zelf ook erkent (07 §10.4).

**Waarom must-fix.** Zonder juiste grondslag en zonder DPIA vooraf is de verwerking onrechtmatig, met een doelgroep van jongeren. Dat is juridisch onhoudbaar en, als een student, ouder of universiteitsblad het oppikt, ook reputationeel.

**Oplossingsrichting.** Een korte DPIA-light voor de wachtlijst, deze week. De volledige DPIA af en ondertekend vóór de eerste uitnodiging (uiterlijk 1 december), met per verwerking de grondslag (sub b alleen voor account, sessie, punten en verzilvering; sub f met belangenafweging voor experiment, eventlog en fraude). De vier ontwerpwijzigingen hierboven gaan in de bouw van R1 (aanwezigheid standaard uit voor `16_17`, stratificatie van arm B naar leeftijd als de jurist twijfelt, `squad_id` wissen bij verwijdering, overeenkomst met verenigingen).

### 6. De voorwaarden bestaan nog niet, en de plannen leunen er overal op

**Wat.** Twaalf keer of vaker verwijzen de plannen naar "staat vooraf in de voorwaarden": de definitieve uitslag die niet wordt herzien, de vervaldatum van punten, "zolang de voorraad strekt", de toewijzing aan armen, de stopdatum van de doelbonus, de diskwalificatie, de beacon-regel, het negatieve saldo. Geen van die documenten bestaat. De advocatenopinie moet op die teksten worden gegeven, niet op een beschrijving. En een aantal bedingen is pas houdbaar als het goed geformuleerd is: een beding dat Rewarded eenzijdig de catalogus of de ratio mag wijzigen, of dat een uitslag niet herzien wordt, toetst de rechter aan art. 6:233 en verder BW. Bij consumenten is "een definitieve uitslag wordt niet herzien" alleen redelijk met een werkende beroepsprocedure ervoor.

**Waarom must-fix.** Zonder voorwaarden is elke afkeuring, terugboeking of diskwalificatie een eenzijdige handeling zonder contractuele basis. Precies daar komen de geschillen bij een beloningsplatform terecht. De advocatenopinie die vóór 2 december klaar moet zijn, heeft deze teksten als invoer nodig.

**Oplossingsrichting.** Drie documenten, uiterlijk 18 november in concept naar de advocaat, met minimaal de volgende inhoud.

**Gebruiksvoorwaarden (iedereen, 16+):**
- Wat een sessie wel en niet bewijst (de eerlijke claim letterlijk); dat punten geen geld zijn, geen eigendom, niet overdraagbaar, niet in geld inwisselbaar en nooit worden teruggevorderd in geld.
- De vaste ratio en dat die niet daalt tijdens de pilot. Daglimiet, inverdienperiode, week- en maandplafonds, voorraadvrijgave en "deze week op", en dat er geen recht is op een specifiek item.
- De vervaldatum van punten met een bericht vooraf, en wat er bij accountverwijdering met punten gebeurt.
- Experiment: dat er groepen met verschillende bonusregels zijn, dat de verwachte waarde gelijk is, de stopdatum 18 januari 2027, en dat de toewijzing per squad gebeurt.
- Fraude: welke gedragingen verboden zijn (meer accounts, scripts, tweede toestel voor anderen, accounts voor anderen aanmaken), dat markeringen door een mens worden beoordeeld, de termijn van drie werkdagen, het beroep binnen 14 dagen bij een andere beoordelaar, en de derde beoordelaar bij een bevestigde blokkade.
- Mogelijke sancties (afkeuren, terugboeken, verrekenen met toekomstige punten, blokkeren), en dat een geleverde voucher geldig blijft.
- Aanpassing van de voorwaarden met een redelijke termijn en het recht om op te zeggen; klachtenroute; toepasselijk recht.

**Challengevoorwaarden (verenigingsprijs en prestatiechallenge):**
- Organisator (Rewarded), financier van de prijs, de prijs zelf en de waarde in natura, en dat het geen geld of vrij besteedbaar tegoed is.
- Maatstaf (deelnamegraad, met de definitie van teller en noemer), de bron van het ledental, de poule-indeling, het minimum van 15 leden, de periode en de tijdzone.
- Gelijke stand: eerst intensiteit, dan gedeelde plaats; **nooit loting**.
- Verificatie: de steekproef, het identiteitsanker, en dat de uitslag pas definitief is na de verificatie. Diskwalificatie bij georganiseerde manipulatie, met hoor en wederhoor, en wie de prijs dan krijgt.
- Prestatiechallenge: plaatsen op volgorde van inschrijving, geen race, geen loting; levering na 14 dagen.

**Spelvoorwaarden (alleen als de vlag ooit aangaat):** de onderdelen uit spec §4.7 (organisator, looptijd, deelnamevoorwaarden, prijzen, winnaarsbepaling, bekendmaking, klachtenadres, kansspelbelasting voor rekening van Rewarded) plus 18+, dat deelname gratis is en niet gekoppeld aan Plus of een aankoop, de commit-reveal- en beacon-regel met de terugvalregel, de reservewinnaars, en voor de app-versie de verklaring dat Apple geen sponsor is (Apple 5.3.2, letterlijk geciteerd in rapport 02).

## Should-fix

1. **De pitch spreekt het plan en de eerlijke claim tegen.** "Beloont bewezen focus" (In één zin), "eerste verzilvering na vijf uur bewezen focus" (De oplossing, punt 2) en "Rewarded laat studenten … bewezen focus" botsen met de lintregel tegen "bewezen" en met rapport 09 §8 ("Niet claimen: … 'bewezen focus' in de zin van verificatie"). "Verenigingen strijden op gemiddelde geverifieerde focustijd per actief lid" (De oplossing, punt 3) is niet de prijsmaatstaf; dat is deelnamegraad (productplan §3). Corrigeer dit vóór de pitch naar buiten gaat. Komt "bewezen" in de wachtlijst, promotiekit of app-copy, dan wordt het een misleidende handelspraktijk (art. 6:193c BW) en daarmee een must-fix.
2. **Arm B en de randomisering bij de advocaat.** Naast de vraag over oneerlijke handelspraktijk: een gerandomiseerde toewijzing aan beloningsregels is geen "aanwijzing der winnaars", maar laat de advocaat bevestigen dat geen van beide armen een hogere maximale beloning kan opleveren dan de andere. Anders is er een kanselement in de waarde. Leg ook vast dat de "Belofte vroeg tegenover laat"-arm niets met punten doet (dat doet hij nu niet, en dat is goed).
3. **Live aanwezigheid en minuten bij duels met een niet-squadlid.** Acceptatie van het duel als opt-in is verdedigbaar. Maar bij 16- en 17-jarigen moet de duelpartner zien wie hij uitdaagt, en een 17-jarige mag niet zonder eigen keuze dagminuten delen met een onbekende. Overweeg duels buiten de squad alleen tussen 18-plussers, of met een expliciete bevestiging.
4. **Verwerkersovereenkomsten en doorgifte.** Sms- en e-mailverwerker in de EU, maar controleer dat er geen subverwerker buiten de EER zit zonder passende waarborgen (art. 44 en verder AVG). Bij de nummertypecontrole uit must-fix 3 komt er mogelijk een extra verwerker.
5. **Bewaartermijnen.** De meeste termijnen zijn redelijk en goed onderbouwd (07 §10.6). Twee punten: het auditlog heeft nog geen termijn ("open vraag", voorstel 2 jaar), en ruwe events tot 15 juni 2027 is ruim voor een pilot die op 18 januari eindigt. Motiveer dat in de DPIA met de nawerkingsmeting tot 15 maart en kies een kortere termijn als dat kan.
6. **Partnerkortingen in de catalogus.** Het plan wacht op de jurist voor "korting op een specifiek product". Mijn lijn: een korting of voucher voor één product of dienst van één partner valt binnen de uitsluiting voor beperkte netwerken (PSD2) en is geen e-geld. Een tegoed bij één partner voor zijn hele assortiment komt dicht bij winkeltegoed. De architectuur sluit dat al uit, en dat is terecht voorzichtig. Laat de partnerverklaring (`declaration_ref`) dit onderscheid expliciet maken.
7. **Inzetlaag (later, niet voor de pilot).** De poorten zijn goed. Wat nog ontbreekt:
   - Als verbeurde inzet omzet is van Rewarded en Rewarded daarna zelf doneert, is mogelijk btw verschuldigd op de omzet en is de giftenaftrek in de vennootschapsbelasting begrensd. Dan kost "100% naar een goed doel" meer dan 100%. Laat de fiscalist twee structuren vergelijken, waaronder een vast tarief per contract met donatie door de gebruiker zelf via een betaaldienstverlener van het goede doel.
   - Herroepingsrecht: de gebruiker moet uitdrukkelijk vragen om directe uitvoering en weten dat hij zijn recht verliest zodra de week is uitgevoerd.
   - Art. 7A:1825 BW (spel en weddenschap) is niet geverifieerd en hoort in de opinie.
   - Een kaartreservering van ongeveer 7 dagen voor een weekdoel laat geen marge voor beroep (rapport 02 §2.5). Kies een kortere doelperiode of afschrijving pas na de beroepstermijn.
   - Apple 4.10 (Screen Time-API's te gelde maken) blijft een reëel afwijzingsrisico. Het Google Play-beleid voor `PACKAGE_USAGE_STATS` en voor prijzen met een kanselement is in deze sessies nooit primair gelezen.
8. **App-storeregels voor later.** Plan nu al: trekkingen in naam van Rewarded met de regels in de app (Apple 5.3.1 en 5.3.2), geen IAP voor inzet (5.3.3), Plus wel via IAP (3.1.1), en accountverwijdering in de app (die is er al, `DELETE /me`). De PWA-route omzeilt de review, niet de Wok (rapport 02 §2.6). Dat staat goed in de stukken.
9. **Kosten van de juridische trajecten.** €25.000 voor kansspel, PSD2, DPIA en btw in twaalf maanden is krap als er een opinie, een Ksa-traject, drie sets voorwaarden en later een betaaldienstanalyse bij komen. Reken met een bandbreedte. De pitch telt overigens op tot €370.000 en vraagt €400.000; maak het verschil zichtbaar.
10. **Reputatie: "focus loont" en geldassociatie.** De wachtlijsttest met een geld-hook ("Word beloond voor je focusuren.") is eerlijk geformuleerd, maar zet tegelijk de toon. Laat in de geld-arm de regel "Geen geld. Punten voor partnerbeloningen." direct zichtbaar zijn, zodat de test niet zelf misleidend is.
11. **DSA.** Rewarded host beperkte inhoud van gebruikers (squadnamen, beroepsteksten). Een meldmogelijkheid voor ongepaste squadnamen (art. 16 DSA) is goedkoop; de moderatie van `name_status` is er al.

## Vragen die ik in de partnervergadering zou stellen

1. Wat gebeurt er op 2 december als de advocatenopinie over verdiende prijzen niet binnen is? Start de pilot dan zonder aanloopklassement, of met?
2. Wat doen we als de Ksa na de voorlegging niets of iets vaags terugzegt? Staat ergens dat stilte nee betekent?
3. Wie in het team is eigenaar van de DPIA, de verwerkersovereenkomsten en de drie sets voorwaarden, en wanneer ligt het eerste concept bij de advocaat?
4. Hoe weet je, op 18 januari, hoeveel procent van de meegetelde verenigingsleden een echte student was? Met welke meting, niet met welke markering?
5. Waar komt het ledental van elke vereniging vandaan, en wie anders dan het bestuur kan het bevestigen?
6. Waarom betaal je ambassadeurs per account dat op dag 7 actief is, terwijl "actief" op het web een open tab is? Wat is het plafond per ambassadeur?
7. Accepteert de sms-verwerker VoIP- en virtuele nummers? Wat kost het een fraudeur om twintig verzilverende accounts te maken, en wat levert het op tegen de wekelijkse voorraad?
8. Welke grondslag heb je voor de gerandomiseerde armtoewijzing van een 16-jarige, en wat zeg je tegen een ouder die belt?
9. Wat zou de Kansspelautoriteit zien als ze over een jaar naar de app kijkt: een focus-app met een promotie, of een app waarin de wekelijkse trekking de reden is om terug te komen?
10. Wat is je verhaal als een universiteitsblad schrijft dat een vereniging de Blokk-challenge won met nepaccounts? Wie belt de journalist, en wat staat er dan al in de challengevoorwaarden?
11. Hoe verhoudt "Rewarded verdient nooit aan falen" zich tot de inzetlaag als onderdeel van Plus? Het abonnement verdient niet aan falen, maar wel aan inzetters. Kun je dat uitleggen zonder dat het klinkt als een omweg?

## Wat mij zou overtuigen (naar GO)

- Een fraudemaat die niet afhangt van de eigen heuristieken (een steekproef met een betrouwbaarheidsinterval), vastgelegd in de voorregistratie, plus het verslag van één red-teamdag vóór 25 november.
- Voor de verenigingsprijs: een extern ledental per vereniging, openbaar op de ranglijst; een identiteitsanker (instellingsmail of mobiel nummer) voor de teller; een verplichte steekproef bij elke winnaar.
- Een nummertypecontrole bij telefoonverificatie, een wachttijd op de eerste verzilvering en een andere betaalregel voor ambassadeurs.
- Een beslisregel "stilte is nee" voor trekkingen, en een pitch die trekkingen als optie presenteert.
- Een ondertekende DPIA met een grondslag per verwerking vóór de eerste uitnodiging, met de vier ontwerpwijzigingen in R1.
- De drie sets voorwaarden in concept bij de advocaat uiterlijk 18 november, en de opinie die er uitdrukkelijk over gaat, inclusief de kwalificatie van de rangprijs en een terugvalvariant met alleen drempelprijzen.

Als dat er ligt, zie ik geen juridische of fraudetechnische reden om de pilot niet te draaien.

## Uit de vorige ronde

Dit is ronde 1; er zijn geen eerdere beoordelingen.

## Verificatie en beperkingen

- Gecontroleerd met de nl-gov-data-tools in de BWB: art. 5 Wet op de kansspelbelasting, toestand 2026-01-01: 37,8% en 100/62,2 (bevestigt rapport 02); art. 4 lid 2 Wet KSB (samentelling van prijzen per toevallige gebeurtenis). Art. 5 lid 1 UAVG, toestand 2026-09-01: toestemming van de wettelijk vertegenwoordiger onder zestien jaar als toestemming de grondslag is. Art. 11.7a Telecommunicatiewet, toestand 2026-07-01 (hoofdregel, en dat er uitzonderingen zijn in lid 3). Art. 1 lid 1 Wok, toestand 2022-10-01 (aanhef).
- Niet te lezen via de tool: de onderdelen (a, b, c …) van art. 1 lid 1 Wok, art. 4 lid 1 Wet KSB (bedrag van de vrijstelling) en art. 11.7a lid 3 Tw; de tool geeft alleen de genummerde leden terug. De Gedragscode promotionele kansspelen staat niet in de BWB (zoekopdracht: nul resultaten); ik volg de weergave van WODC 2024 in rapport 02. Directe toegang tot `repository.officiele-overheidspublicaties.nl` was in deze sessie via de proxy geblokkeerd (403).
- Niet geverifieerd: de praktijk van de Ksa bij voorleggingen, registratieplicht van prepaid-simkaarten in Nederland, het Google Play-beleid, en de EDPB-lijn over art. 6 lid 1 sub b (uit mijn vakkennis, niet in deze sessie nagelezen).
