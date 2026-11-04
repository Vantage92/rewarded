# Juryrapport fase 2 — productspecificatie web-MVP (jurylid 1)

*Rewarded, 4 november 2026. Beoordeeld: `05-spec-mvp-first.md`, `05-spec-retentie-first.md` en `05-spec-groei-first.md`. Kader: `docs/01-businessplan.md` (bindend), `docs/00-founder-brief.md`, `docs/pitch/README.md`, rapport 08 (samenvatting en §7–8) en rapport 09 (samenvatting, §3 en §8). Ik heb geen van de drie varianten geschreven en ken het oordeel van jurylid 2 niet.*

## Oordeel in het kort

**Winnaar: MVP-first.** Het is de enige variant die een klein team op 2 december met een werkend meetinstrument de pilot in kan sturen, en de enige waarvan het meetplan de go/no-go-criteria zonder vertroebeling oplevert. De variant is ook juridisch de schoonste. Ze heeft één groot gat: de centrale pilothypothese uit het businessplan (§4, de overgang van beloning naar zelfgekozen commitment) wordt niet gemeten. Dat gat dicht je het best met de Belofte uit retentie-first, in afgeslankte vorm. Daarnaast moet MVP-first drie scope-afwijkingen van §10 aan de founder voorleggen in plaats van ze zelf te beslissen, en een aantal regels aanscherpen.

Retentie-first en groei-first eindigen gelijk op 56 punten, om verschillende redenen. Retentie-first heeft het beste gedragsontwerp, maar te veel scope voor vier weken en een meetplan met een vertekende nawerkingsmeting. Groei-first heeft de beste groeimechanica en de zorgvuldigste behandeling van trekkingen, maar laat een sessie doorlopen terwijl de pagina verborgen is (struikelmoment, geplande pauzes). Dat raakt de kern van de web-verificatie en is maar gedeeltelijk als voorstel aan de founder gemarkeerd.

## Scores

| Criterium | MVP-first | Retentie-first | Groei-first |
|---|---|---|---|
| 1. Trouw aan besluiten en randvoorwaarden | 8 | 8 | 6 |
| 2. Juridische houdbaarheid | 9 | 7 | 8 |
| 3. Gebruik van het gedragsbewijs | 6 | 9 | 5 |
| 4. Bewijsbaarheid pilotcriteria via meetplan | 9 | 6 | 7 |
| 5. Bouwbaarheid als web-MVP door klein team | 9 | 4 | 6 |
| 6. Groei zonder de verkeerde gebruikers | 6 | 7 | 9 |
| 7. Eerlijkheid naar de gebruiker | 9 | 8 | 7 |
| 8. Helderheid en volledigheid als bouwdocument | 9 | 7 | 8 |
| **Totaal (max. 80)** | **65** | **56** | **56** |

## Motivering per variant

### MVP-first (65)

**1. Trouw (8).** Alle harde randvoorwaarden houden stand: vaste ratio van 1 punt per minuut die niet varieert, punten direct bij het einde van de sessie, inverdienperiode van 300 minuten, geen pool, een duel zonder punten (§4.5, met de juiste redenering over samenspanning), alleen geaggregeerde verenigingscijfers, 16+ met een 18+-vlag en de inzetlaag buiten de MVP. De verliesarm is zo ontworpen dat de vaste ratio intact blijft: alleen een doelbonus verschilt, en die staat "in afwachting" (§5). Dat is de netste uitwerking van de drie. Twee punten gaan eraf. (a) Drie onderdelen uit de MVP-scope van §10 gaan niet mee in de pilot: spelvoorwaarden voor trekkingen, deelbare bewijskaarten en, uit §6, referral. Dat staat open als voorstel, wat correct is, maar een productspec mag de scope niet zelf verkleinen. (b) De centrale pilothypothese (businessplan §4: "de overgang van beloning naar zelfgekozen commitment ... is de centrale pilothypothese, niet een aanname") heeft geen functie en geen meting.

**2. Juridisch (9).** Zonder trekkingen in de pilot verdwijnt het grootste kansspelrisico tot de Ksa-voorlegging klaar is. De tabel verdiend tegenover verloot (§4.7) is correct, met kansspelbelasting via brutering (×100/62,2, rapport 02), de limiet van €4.500 en 18+ voor verlote prijzen. Er is geen cash-out en een negatief saldo wordt nooit in geld teruggevorderd. Mensen beslissen over fraude, met beroep bij een tweede beheerder. Er is geen export voor het bestuur. Wat ontbreekt: een expliciet europlafond voor verdiende individuele prijzen op trede 1. De spec spreekt alleen van een "vaste prijs per winnaar".

**3. Gedragsbewijs (6).** De keuzes die er zijn, kloppen: directe bijschrijving (Levitt e.a. 2016), verliesframing zonder eigen geld als aparte arm (Patel e.a. 2016), een automatische joker en een streak die bij een afgebroken sessie niet breekt (Silverman en Barasch 2023), en een uitkomstmaat die bij Patel past. Maar de variant laat de sterkste ontwerpimplicaties uit rapport 08 §7 liggen: een commitmentaanbod na de introductieperiode (implicatie 8, Royer e.a. 2015), informatieve competentiefeedback en een modus zonder punten tegen verdringing (implicatie 7) en een rem op overmoedige doelen (Carrera e.a. 2018). Dat de gebruiker zijn dagdoel zelf kiest, is goed, maar is het enige element tegen verdringing.

**4. Meetplan (9).** Het sterkste van de drie. Elke functie hangt aan een criterium (§1). Heuristieken liggen vóór 2 december vast en worden niet bijgesteld om onder de 5% te blijven. Afgekeurde sessies tellen nergens mee, teamaccounts zijn uitgesloten en de K-definitie sluit wachtlijst- en verenigingscodes uit als virale aanwas. Het squadaandeel telt alleen echte squads van drie of meer, en de variant benoemt eerlijk dat het budgetcriterium per constructie wordt gehaald, met kosten per actieve gebruiker als informatieve maat. Zwakke plekken: een lid dat later bij een squad komt, wisselt van arm, en de analyseregel daarvoor ontbreekt. De D30-correctie is nog een voorstel.

**5. Bouwbaarheid (9).** Twee releases (R1 op 2 december, R2 op 5 januari), polling in plaats van websockets, een eigen eventtabel met opgeslagen SQL, vouchers per CSV, een functionele beheeromgeving en een expliciete schrapvolgorde bij tijdnood. De teamaanname (2–3 ontwikkelaars) sluit aan op rapport 09 §8 (trede 0–1: 2–4 plus 2–3 weken). Dit is realistisch.

**6. Groei (6).** Uitnodigen als toegangsbewijs, squad- en duellinks met attributie en geen beloning op delen: de motor uit businessplan §6 is er. Dat er geen referral in de pilot zit, is goed beargumenteerd (de meting of K uit squads komt). Maar zonder kaarten, zonder aanloopklassement in december (de ranglijst komt pas met R2) en zonder wervingsinstrumenten voor het bestuur leunt K ≥ 0,3 op één loop. Het bestuursdashboard is een rapportage, geen wervingsinstrument.

**7. Eerlijkheid (9).** De eerlijke claim uit rapport 09 §3.3 staat letterlijk in de onboarding. "Bewezen" komt nergens in de app voor, er is één vaste copytabel voor afbreekredenen die ook support gebruikt, beide armregels staan op de uitlegpagina en de wekelijkse voorraad wordt eerlijk getoond ("deze week op"). Een gemarkeerde sessie breekt de streak niet voordat een mens heeft gekeken. Een punt eraf: een afbreking door een heartbeatgat (wifi weg zonder gebufferde zichtbaarheid) is een automatische beslissing die punten kost, zonder meldroute.

**8. Helderheid (9).** Parameters, mutatietypen, randgevallen (account verwijderen, terugtrekkende partner, twee toestellen, vertrekkende squadmaker) en definities zijn precies genoeg om direct te bouwen.

### Retentie-first (56)

**1. Trouw (8).** De volledige §10-scope zit erin, inclusief kaarten en een trekkingsmodule die uit te schakelen is. De variant is de enige die de centrale pilothypothese bouwt en meet (de Belofte, §4.7), met de seizoensbonus als vooraf aangekondigde steiger die afbouwt zonder de ratio te veranderen. Dat is precies wat businessplan §2 en §4 vragen. Minpunten: het squadaandeel telt een lopend duel mee, terwijl het criterium "in een squad" zegt. De noemer van de deelnamegraad is het ledental dat het bestuur zelf opgeeft, en dat is niet te controleren.

**2. Juridisch (7).** Verdiend en verloot zijn goed gescheiden, de kansspelbelasting gaat als kostenpost van het budget af en het plafond van €10 per persoon per maand voor verdiende prijzen is voorzichtig. Maar de trekkingsmodule is een must en gaat pas uit "als de Ksa de reeks niet accepteert" (§4.8). Dat ze pas aan mag ná voorlegging aan de Kansspelautoriteit (businessplan §8), staat er niet. Ook de vervaldatum, de verliesarm als mogelijke oneerlijke handelspraktijk en de experimenttoewijzing bij 16- en 17-jarigen staan nog open voor de jurist. Dat die vragen benoemd zijn, is goed; ze zijn alleen niet opgelost.

**3. Gedragsbewijs (9).** Veruit het best. De variant gebruikt rapport 08 waar het sterk is en zwakt af waar het dun is: geen punten in beeld tijdens de sessie (Gneezy e.a. 2011), eerst competentiefeedback en dan punten (Deci e.a. 1999), een overmoedrem (Carrera e.a.; Acland en Levy), een terugkombonus met de kanttekening dat nawerking niet is aangetoond (Milkman e.a. 2021), duels op gehaalde dagdoelen in plaats van minuten, een modus zonder punten en de Belofte als zacht commitment. Dat de zachte vorm werkt, noemt de variant terecht een hypothese.

**4. Meetplan (6).** Rijk, maar met fouten die de uitkomst vertekenen. (a) De nawerking (19 januari–1 februari tegenover 5–18 januari) valt samen met het einde van de tentamenperiode en de publieke lancering. Een daling meet dan vooral dat de tentamens voorbij zijn. Alleen het verschil tussen de armen is te gebruiken, en de drempel van 70% niet. (b) De noemer van gemarkeerde sessies, `session_completed + session_flagged`, telt gemarkeerde voltooide sessies mogelijk dubbel. (c) Heuristieken worden "in pilotweek één gekalibreerd", zonder regel die verhindert dat de lat wordt verlegd. (d) Referral zit vanaf dag één in K, waardoor de vraag uit §9 (is de sociale loop echt?) troebel wordt. (e) Een 2×2-ontwerp met een paar tientallen squads per cel geeft hooguit richting, en dat zegt de variant zelf ook. (f) Wie na begin januari instroomt, bereikt dag 14 niet vóór 18 januari, en W3 valt voor het eerste cohort in de kerstvakantie, zonder correctie.

**5. Bouwbaarheid (4).** Veertien musts, waaronder de Belofte, twee ranglijsten, de trekkingsmodule, kaarten, duels, een budgetoverzicht en twee experimentfactoren. Er is geen releaseplan, geen teamaanname en geen schrapvolgorde, terwijl er vier weken tot de pilot zijn. Dit document haalt 2 december niet zonder harde keuzes, en die keuzes staan er niet in.

**6. Groei (7).** Squads als retentie- én groeimotor, kaarten zonder bedragen, referral met vesting en menselijke controle bij clusters. Solide, maar zonder eigen instrumenten voor de koude start via verenigingen. Het bestuur mag leden twee berichten per week sturen: dat is een nieuwe kanaalfunctie zonder privacy- of spamregels.

**7. Eerlijkheid (8).** Sterke punten: een oefensessie van één minuut die laat zien wat afbreken is, uitleg zonder verwijt ("je hield 18 minuten vol"), een knop "Kortere sessie", de mededeling dat punten toegang geven "zolang de voorraad strekt" en stoppen met een Belofte in één tik. Minpunt: de experimenttoewijzing is "niet zichtbaar voor de gebruiker", met alleen uitleg in de voorwaarden. Dat schuurt met "geen dark patterns", zeker voor de verliesarm. Ook de stapeling van seizoens-, terugkom- en mijlpaalbonussen maakt het puntenmodel lastig uit te leggen.

**8. Helderheid (7).** Goede randgevallentabel bij de focus-engine. Maar er zijn naast elkaar een dagplafond van 300 punten, een weekplafond van 1.500, een verzilveringsplafond van 1.200 en een challengeplafond van 8 uur, en hoe die op elkaar inwerken staat er niet. Een sessie over middernacht telt voor de einddag, terwijl de bonus "direct bij het halen" valt; dat kan bij de dagafsluiting botsen.

### Groei-first (56)

**1. Trouw (6).** Op groei en beloning is de variant zeer trouw: geen beloning op uitnodigen (de squadbonus uit rapport 03 is bewust omgezet naar een beloning voor een volle squadweek), geen punten in een duel als "pool in het klein", geen trekkingen in groei-uitingen en referral met vesting. Maar §3.3 en §4.1 laten de sessie doorlopen terwijl de pagina tot 60 seconden verborgen is (struikelmoment), en tijdens geplande pauzes van 5 minuten "mag de pagina verborgen zijn". Businessplan §4: "Verlaat je het scherm, dan stopt de sessie en krijg je geen punten." Het struikelmoment is als voorstel gemarkeerd, de pauze niet. Daarnaast wordt de verliesarm per gebruiker gerandomiseerd, waardoor squadgenoten verschillende regels zien.

**2. Juridisch (8).** De beste uitwerking van de trekkingen: een feature flag die pas aangaat na de advocatenopinie én de Ksa-voorlegging, 18+ met aparte opt-in, de kans als getal, een seed-hash die vóór de sluiting wordt gepubliceerd, de jaarlimiet afgedwongen en de belasting correct als kostenpost. Er wordt alleen een leeftijdsklasse bewaard, geen geboortedatum. Minpunten: de deterministische volgorde bij meer kandidaten dan prijzen ("tijdstip van het halen") maakt van een prestatieprijs een race, die de jurist nog moet toetsen. En het struikelmoment verzwakt de verdediging dat een punt een geverifieerde minuut is.

**3. Gedragsbewijs (5).** Direct belonen, verliesframing en een zelfgekozen dagdoel zijn er, maar rapport 08 wordt vooral als randvoorwaarde gebruikt. Er is geen commitmentstap, geen competentiefeedback en geen modus zonder punten. Dat "eerder afronden" overmoed opvangt, is een goede vondst, maar zwakt de vaste sessielengtes af.

**4. Meetplan (7).** K per bron (squad, duel, club, kaart, persoonlijk) en referral twee weken later aan is precies wat §9 nodig heeft. Kwaliteit per kanaal en een maat voor beloningsjagers zijn waardevol. Maar de K-formule in §7.2 klopt zo niet ("/ actieve uitnodigers, gedeeld door het aantal actieve gebruikers"). Analytische events vragen toestemming, waardoor de meting van uitnodigingen gaten krijgt. De kerstcorrectie bij D30 is alleen "apart gerapporteerd", zonder definitie. En randomisering per gebruiker binnen squads geeft besmetting, wat de variant zelf ook erkent.

**5. Bouwbaarheid (6).** Er is een releaseplan (R1/R2/R3) en een redelijke indeling in Must en Should. Maar het struikelmoment, de geplande pauzes, het claimvenster, poules, het aanloopklassement, de promotiekit, stad tegen stad, partner-API's en een auditlog maken R1 zwaar, en de live aanwezigheid ververst elke 15 seconden.

**6. Groei (9).** Het beste groeiontwerp: uitnodigen als toegangsbewijs, vier vaste uitnodigingsmomenten zonder pop-ups, sociale inzet in duels ("de verliezer kookt"), een aanloopklassement in december, poules naar grootte, drempelprijzen, een promotiekit met QR per bron en "wat je wel en niet belooft", een lidmaatschapscode met een plafond van 1,1× het ledental, en kaarten zonder punten of beloningen. De verkeerde gebruikers blijven buiten doordat trekkingen nergens in een groei-uiting voorkomen.

**7. Eerlijkheid (7).** Goede elementen: een verificatiepagina die zegt wat ze níet bewijst, een link "Klopt dit niet?" bij elke afbreking, "bijna op" alleen bij echte schaarste en een publicatie na de pilot van onterecht afgewezen en onterecht beloonde sessies. Maar het struikelmoment en de pauzes maken de regel die de gebruiker te zien krijgt ("wissel je van app, dan stopt de sessie") onwaar. En squadgenoten in verschillende armen zien verschillende bonusregels zonder te weten waarom.

**8. Helderheid (8).** Regels en parameters staan overzichtelijk in tabellen, met een expliciete budgetformule en een uitgewerkt rekenvoorbeeld. Minpunten zijn de K-formule en de onduidelijke verhouding tussen struikelmoment, pauze en "afgebroken".

## Winnaar: MVP-first

MVP-first wint omdat ze het doel van de pilot het scherpst dient: in zeven weken een betrouwbaar ja of nee op de go/no-go-criteria, gebouwd door een klein team, zonder juridische open einden in productie. De andere twee varianten hebben betere ideeën op hun eigen terrein, maar beide brengen de pilot in gevaar: retentie-first door haar omvang, groei-first door een verificatieregel die het businessplan uitsluit. De ideeën hieronder passen in het raamwerk van MVP-first zonder de bouwbaarheid te breken.

## Te enten ideeën

| # | Idee | Uit | Reden |
|---|---|---|---|
| 1 | **De Belofte, afgeslankt:** een zelfgekozen commitment zonder punten, aangeboden op dag 14 (of eerder na ≥ 8 gehaalde dagdoelen), met de squad als getuige, een reflectie na twee weken en voor 18-plussers de vrijblijvende vraag naar interesse in inzet. Het aanbod per squad randomiseren als tweede factor, of, als de poweranalyse dat afraadt, het aanbod aan iedereen doen en beschrijvend meten. | Retentie-first §4.7 | Dicht het grootste gat: de centrale pilothypothese (businessplan §4; rapport 08 implicatie 8, Royer e.a. 2015). Bouwkosten zijn laag (een formulier, een dagstatus en een reflectiescherm). Het levert ook de eerste meting van H-C voor de inzetlaag. |
| 2 | Oefensessie van één minuut in de onboarding en een knop "Kortere sessie" na een afbreking, plus "Niet storen" als tip | Retentie-first §3.1, §3.3 | Goedkoop, maakt de strenge regel zonder terugkeervenster begrijpelijk en dempt afhaken door afbrekingen (Silverman en Barasch 2023) |
| 3 | Eerst competentiefeedback op het eindscherm, dan de squad en dan de punten; geen punten in beeld tijdens de sessie | Retentie-first §3.2 | Rapport 08 implicatie 7 tegen verdringing; alleen een kwestie van copy en volgorde |
| 4 | Overmoedrem: bevestiging bij een hoog dagdoel in week één en een doelvoorstel na een week op basis van werkelijk gedrag | Retentie-first §4.1 | Carrera e.a. 2018; Leuven e.a. 2010; geen nieuwe infrastructuur |
| 5 | Uitnodiging als object met bron, maker, geldigheid en maximum aantal gebruikers; K per bron rapporteren; kwaliteit per kanaal en een maat voor beloningsjagers | Groei-first §4.5, §7.2 | Versterkt de §9-vraag of de sociale loop echt is, en het signaal uit businessplan §6 ("praten ze over uitbetalen?") wordt kwantitatief |
| 6 | Wervingsinstrumenten voor het bestuur: promotiekit met QR per bron en "wat je wel en niet belooft", een aanloopklassement in december zonder prijs en een lidmaatschapscode met plafond | Groei-first §3.7, §4.7 | De koude start via verenigingen (businessplan §3) krijgt een instrument vóór januari; ondersteunt D7 en K zonder geld |
| 7 | Drempelprijs als standaard naast de winnaar, voor elke vereniging die een vooraf bekendgemaakte drempel haalt | Retentie-first §4.6; groei-first §4.7 | Voorkomt dat de onderkant afhaakt; is nog steeds verdiend en niet verloot |
| 8 | Specificatie voor R3-trekkingen: feature flag pas aan na de advocatenopinie en de Ksa-voorlegging, 18+ met aparte opt-in, kans als getal, vooraf gepubliceerde seed-hash en jaarlimiet afgedwongen | Groei-first §3.9, §4.9 | De sterkste juridische uitwerking; houdt de module secundair en controleerbaar |
| 9 | Alleen leeftijdsklasse en de datum waarop iemand 18 wordt bewaren, geen geboortedatum | Groei-first §4.12 | Dataminimalisatie (AVG, businessplan §8) zonder functieverlies |
| 10 | Een verificatiepagina achter de QR die ook zegt wat ze níet bewijst; een auditlog voor elke inzage van sessiegegevens door beheerders | Groei-first §4.10, §4.13 | Eerlijkheid (rapport 09 §8) en verantwoording bij de fraudewachtrij |
| 11 | De catalogustekst "Punten geven toegang tot de catalogus zolang de voorraad strekt" en een dekkingsalarm per week | Retentie-first §4.3 | MVP-first laat punten oplopen boven de voorraad; dat moet de gebruiker vooraf weten |
| 12 | Modus zonder punten (Could) | Retentie-first §4.11 | Bescherming van intrinsiek gemotiveerden (rapport 08 §7) en een goedkope extra meting |

## Must-fix in MVP-first

1. **De centrale pilothypothese meetbaar maken.** Bouw de afgeslankte Belofte (ent 1) uiterlijk in R2 en leg in het meetplan vast hoe overname, naleving en, in een follow-up in semester 2, nawerking worden gemeten. Vergelijk tussen de armen, niet vóór en na 18 januari, omdat het einde van de tentamens elke voor-na-vergelijking vertekent.
2. **De scope-afwijkingen van §10 aan de founder voorleggen vóór de prijslijst-deadline van 25 november.** Het gaat om de spelvoorwaarden voor trekkingen, de deelbare kaarten en referral. Voorstel: spelvoorwaarden en de trekkingsmodule achter een flag die uit staat tot de Ksa-voorlegging (zo wordt §10 gehonoreerd zonder juridisch risico), kaarten als Should in R2 met de QR naar de wachtlijst, en referral pas na een vastgelegde meetperiode voor K uit squads. Een productspec mag de scope niet eenzijdig verkleinen.
3. **Een plafond voor verdiende prijzen op trede 1:** een europlafond per prijs en per persoon per periode, en voor collectieve prijzen. Businessplan §1 besluit 5 en rapport 09 §8 staan op trede 1 alleen kleine prijzen toe, en de spec noemt nu geen grens.
4. **Analyseregel voor armwisselingen.** Wie later bij een squad komt, neemt nu de arm van de squad over. Leg vast dat de analyse op de eerst toegewezen arm gebeurt (intention to treat), log een event `arm_switched` en rapporteer de wisselaars apart. Anders is het enige experiment besmet.
5. **Meldroute bij technische afbrekingen.** Een afbreking door een heartbeatgat zonder zichtbaarheidsinformatie kost punten op basis van een automatisch signaal. Voeg een knop "Klopt dit niet?" toe die bij de fraudewachtrij terechtkomt, zodat een mens kan kijken. Dat past bij businessplan §4: elke afgekeurde sessie heeft een begrijpelijke reden, en beslissingen met gevolgen worden door een mens herbeoordeeld.
6. **De D30-kerstcorrectie en de pilotdrempels vóór 2 december vastleggen**, met een besluit van de founder. Nu is het een voorstel (open vraag 4). Zonder vaste definitie is het belangrijkste retentiecriterium achteraf te verschuiven.
7. **De verliesarm laten toetsen door de jurist** op oneerlijke handelspraktijk en dark pattern, en bij elke bonusmutatie de armregel in de app tonen, niet alleen op de uitlegpagina. Retentie-first stelt deze vraag terecht; MVP-first niet.
8. **De verhouding tussen uitstaande punten en voorraad uitleggen.** Punten kunnen de vooraf gefinancierde voorraad overstijgen. Neem de tekst "zolang de voorraad strekt" op in de catalogus en de voorwaarden, en registreer de verplichting per gebruiker naast het budget (businessplan §5, harde regel).

## Open vragen voor de founder

- Accepteert de founder dat trekkingen, kaarten en referral pas met R3 komen, of houdt hij vast aan §10? (Zie must-fix 2.)
- Gaat het Belofte-aanbod gerandomiseerd of beschrijvend de pilot in? Een poweranalyse vóór 25 november moet dat bepalen.
- Een terugkeervenster blijft buiten de MVP. MVP-first meet hoe vaak een eerlijke sessie afbreekt (`return_after_abort`). Groei-first stelt een venster van 60 seconden voor; dat beslist de founder na de pilot, op basis van die data.
