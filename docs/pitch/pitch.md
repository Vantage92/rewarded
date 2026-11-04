# Rewarded — Pitch (v1, 4 november 2026)

*Voor het kritische team. Onderbouwing: `docs/01-businessplan.md`, `docs/02-productplan.md` en de rapporten in `docs/research/`. Wat hieronder "aanname" heet, is nog niet getoetst.*

## In één zin

Rewarded laat studenten samen hun telefoon wegleggen en beloont bewezen focus: eerst met status in hun squad en vereniging, dan met verdiende beloningen van partners die belang hebben bij hun studiesucces, later met een eigen inzet die ze terugverdienen door hun weekdoel te halen.

## Het probleem

Studenten verliezen in de weken voor hun tentamens de strijd met hun telefoon en weten dat zelf. Focus-apps bestaan al tien jaar (Forest tientallen miljoenen downloads, Opal naar eigen zeggen miljoenen omzet), maar de categorie houdt gebruikers slecht vast: dertig dagen na installatie is doorgaans minder dan tien procent nog actief. Niet omdat de apps slecht zijn, maar omdat de motivatie alleen van de gebruiker zelf moet komen, precies op het moment dat die het zwakst is.

## Het inzicht

Het idee "beloond worden voor telefoonvrije tijd" is al geprobeerd. Hold bereikte in Noorwegen naar eigen zeggen veertig procent van de studenten en Pocket Points zat op meer dan tweehonderd Amerikaanse campussen. Beide zakten weg. Ons onderzoek (rapport 01) wijst drie structurele oorzaken aan, en Rewarded is ontworpen om alle drie te vermijden:

1. **Niemand wilde de beloning duurzaam betalen.** Een student die zijn telefoon weglegt, ziet geen advertenties; merken betalen daar weinig voor (Sweatcoin haalt naar schatting zeven dollarcent per gebruiker per jaar op). Wij financieren beloningen uit partijen met een direct belang bij studiesucces of bij toegang tot studenten (verenigingen, faculteiten, werkgevers) en uit vooraf geboekte challenges. Het beloningsbudget is altijd een afgeleide van geboekte omzet.
2. **Beloning en verificatie liepen niet gelijk op.** Zodra er iets te halen is, wordt valsspelen rationeel; StickK zag van 650.000 dollar aan inzet maar 50.000 verbeurd. Bij ons bepaalt de bewijssterkte het beloningsplafond, in vier treden van "pagina zichtbaar in de browser" tot native blokkade met apparaatattestatie en menselijke steekproeven. Geld komt pas bij trede vier.
3. **Het effect verdween zodra de beloning stopte.** Dat is geen productfout maar een eigenschap van geldprikkels (rapport 08: van 54 interventies had acht procent na afloop nog meetbaar effect). Rewarded gebruikt de beloning als steiger naar iets wat wél blijft: een squad van vrienden die elkaar vasthoudt, een streak, en later een zelfgekozen inzet.

## De oplossing

Vijf onderdelen, uitgewerkt in `docs/02-productplan.md`:

1. **Focus-engine.** Sessies van 25, 50 of 90 minuten. In de web-MVP loopt een sessie alleen zolang Rewarded zichtbaar op het scherm staat: telefoon met het scherm naar beneden, Wake Lock houdt het scherm aan. Wie de app verlaat, ziet eerlijk waarom de sessie stopte.
2. **Focuspunten.** Vaste, gepubliceerde ratio, direct bijgeschreven bij het einde van de sessie, inwisselbaar in een catalogus die partners vooraf hebben gefinancierd. Geen cash-out, geen variabele koersen, eerste verzilvering na vijf uur bewezen focus.
3. **Squads, duels en verenigingen.** Drie tot zes vrienden zien live wie focust en bouwen een squadstreak op. Verenigingen strijden op gemiddelde geverifieerde focustijd per actief lid, met een plafond per dag. Individuele vergelijking blijft binnen de squad.
4. **Prijzen.** Verdiende prijzen op prestatie, met verificatie van winnaars, en daarnaast kleine gratis trekkingen (18+, Rewarded als organisator, spelvoorwaarden, kansspelbelasting ingecalculeerd). We noemen het eerste verdiend en het tweede eerlijk een kans.
5. **Inzet (later).** Een opt-in commitment contract: €5 tot €50 op een weekdoel; haal je het, dan vervalt de kaartreservering; haal je het niet, dan gaat het bedrag naar een goed doel naar keuze. Rewarded verdient nooit aan falen. Pas na advocatenopinie, toets door de Kansspelautoriteit en native verificatie.

## Waarom nu

- Scholen zijn sinds 2024 telefoonvrij; de generatie die nu gaat studeren kent het mechanisme en mist het in de collegebanken en de bibliotheek.
- "Study with me" is een bestaande cultuur op TikTok; we hoeven het ritueel niet uit te vinden, alleen het meedoen mogelijk te maken.
- Opal laat zien dat studenten betalen voor een focusproduct dat werkt; Focus Friend (740.000 downloads in weken) laat zien dat creator-distributie in deze categorie goedkoop bereik oplevert.
- De iOS Screen Time-API's en Android UsageStats maken verificatie mogelijk die er in de tijd van Hold niet was; AI-beoordeling van bewijs (Forfeit) maakt een inzetlaag operationeel haalbaar.

## Wedge en go-to-market

We beginnen niet met "studenten in Nederland" maar met de **blokchallenge**: hbo- en wo-studenten in de tentamenperiode van januari 2027, via studieverenigingen in twee steden (werkhypothese Utrecht en Groningen). Verenigingen strijden om een collectieve prijs die ze verdienen op prestatie; het bestuur krijgt een dashboard; leden vormen squads. De tentamenperiode is een begrensde meetperiode met een helder succescriterium.

| Fase | Periode | Go/no-go |
|---|---|---|
| Wachtlijst en pre-launch | 4 nov – 1 dec 2026 | ≥ 1.500 aanmeldingen, ≥ 25% met een vriend; ≥ 5 verenigingen schriftelijk toegezegd; de focus-hook scoort minstens even goed als de geld-hook |
| Gesloten pilot | 2 dec 2026 – 18 jan 2027 | Activatie ≥ 60%, D7 ≥ 25%, D30 ≥ 12%, ≥ 40% van de actieven in een squad, K ≥ 0,3, gemarkeerde sessies < 5%, beloningskosten binnen budget |
| Publieke lancering NL | 19 jan – 2 feb 2027 | ≥ 5.000 geactiveerde gebruikers, D7 ≥ 20%, ≥ 50% organische aanwas, kosten per geactiveerde gebruiker < €5 in betaalde kanalen |

Daarna Vlaanderen, het VK en Duitsland, met per land een nieuwe kansspeltoets. Nederland (773.270 ingeschrevenen in het hoger onderwijs) is de testmarkt; de EU27 (circa 19 miljoen) en het VK (2,9 miljoen) zijn de markt.

## Verdienmodel

| Bron | Mechanisme | Marge per gebruiker per maand (rapport 02) |
|---|---|---|
| B2B2C: verenigingen, faculteiten, studentenwelzijn, werkgevers | Challengepakketten en seats, beloningsbudget in de prijs | ca. €1,16 per seat; verkoop verdient zich in circa 9 maanden terug; primaire omzet binnen 12 maanden |
| Sponsorchallenges | Merk betaalt per voltooide challenge (schatting €1–3), vooraf geboekt | Aanvulling, nooit fundament |
| Rewarded Plus | Abonnement voor statistieken, thema's, uitgebreide squads en de inzetfunctie; nooit gekoppeld aan trekkingskansen | Te valideren; categoriebenchmark 2,9% download naar betaald |
| Gratis laag | Punten en kleine trekkingen | ca. €0,19 in het basisscenario: betaalde acquisitie is uitgesloten, groei moet organisch |

Niet gebouwd: het pool-model (inzet van wie faalt naar wie slaagt) en een abonnement dat een prijzenpot vult. Het eerste is het hoogste kansspel-, betaaldienst- en fraude-risico in één en valt om bij circa vijftien procent valsspelers; het tweede is inleg voor een kans, en daar bestaat voor een commercieel bedrijf geen vergunningsroute voor.

## Groei

Squads en duels zijn de motor: wie via een vriend komt, heeft een reden om terug te komen die niet om geld draait. Campusrivaliteit is de koude start. Deelbare bewijskaarten met uren en streaks (nooit bedragen) zijn de versterker. Referrals belonen we in punten die pas vrijkomen na drie bewezen sessies van de genodigde. We delen geen bedragen, zetten geen beloning op delen en zijn afwezig op cashback- en "verdien geld"-platforms. Per kanaal sturen we op D7 en squad-aandeel, niet op installaties.

## Wat het bewijs zegt en wat we toetsen

Het bewijs draagt het mechanisme en begrenst het. Beloningen voor inputs (focusminuten) zijn de veilige keuze; outputbeloningen pakten voor zwakkere studenten negatief uit. Beloningen moeten direct volgen. Kleine geldbedragen kunnen slechter werken dan niets, dus de gratis laag werkt met punten en status. Openbare individuele ranglijsten kunnen averechts werken, dus vergelijking blijft in de squad. Deposits bereiken weinig mensen (13,7% acceptatie tegen 90% voor beloningen in Halpern e.a. 2015), dus inzet is opt-in en nooit de kern.

De pilot toetst vier hypotheses: (1) squadleden hebben een duidelijk hogere D7 dan solo-gebruikers; (2) een wekelijks puntenbudget dat slinkt bij gemiste dagdoelen houdt beter vast dan gewone bijschrijving; (3) na een week zonder beloning blijft minstens een derde van het effect staan; (4) minder dan vijf procent van de sessies wordt gemarkeerd. Elke hypothese heeft een experimentarm in het meetplan.

## Juridisch en risico's

Alles wat bij de lancering live gaat, kan zonder vergunning: punten en catalogus (vaste ratio, geen cash-out), verdiende prijzen (geen kansbepaling) en gratis trekkingen onder de Gedragscode promotionele kansspelen (echt gratis, 18+, spelvoorwaarden, elk spel ≤ €4.500 of binnen de jaarlimiet, kansspelbelasting 37,8%). De inzetlaag gaat pas live na advocatenopinie, toets door de Kansspelautoriteit, schriftelijke acceptatie door de betaaldienstverlener en fiscaal advies, en alleen als kaartreservering zonder eigen saldo. Een DPIA is verplicht en gepland.

| Risico | Hoe we het uitsluiten |
|---|---|
| De Kansspelautoriteit accepteert een reeks kleine trekkingen niet | Vooraf voorleggen; bij nee vervallen trekkingen en blijven verdiende prijzen |
| Geen verenigingen of partners | Vijf schriftelijke toezeggingen vóór 1 december, anders draaien we de wedge naar werkgevers |
| Fraude met web-verificatie | Geen geld op trede 1; beloningen omlaag bij > 5% gemarkeerde sessies; native verificatie in Q2 2027 |
| Beloningsjagers | Boodschap leidt met focus en samen; inverdienperiode; wachtlijst met voorrang voor squads; per kanaal sturen op kwaliteit |
| Apple-richtlijn 4.10 en Family Controls-entitlement | Entitlement aanvragen bij oprichting van het ontwikkelaarsaccount; ontwerp vooraf voorleggen |
| Het effect zakt weg na de beloning | De overgang naar squads, streaks en zelfgekozen inzet is de kern en wordt in de pilot gemeten |

## Team en vraag

Werkhypothese voor de eerste twaalf maanden (aanname, nog niet getoetst): een founder, twee engineers en een ontwerper/groeimedewerker in deeltijd. Vraag: **€400.000 pre-seed** voor twaalf maanden.

| Post | Bedrag (aanname) |
|---|---|
| Team (12 maanden) | €230.000 |
| Juridisch en fiscaal (kansspel, PSD2, DPIA, btw) | €25.000 |
| Campus, creators, verenigingsprijzen, kleine betaalde test | €40.000 |
| Eigen bijdrage aan beloningen gratis laag | €15.000 |
| Infrastructuur, app-storeaccounts, tooling, verzekeringen | €12.000 |
| Buffer | €48.000 |
| Totaal | €370.000 |

Mijlpalen: december 2026 go/no-go wachtlijst; januari 2027 pilot; februari 2027 lancering NL; Q2 2027 native app met Screen Time en UsageStats; Q3 2027 minstens drie betalende instellingen of verenigingen; Q4 2027 inzetlaag na juridische toetsing; 2028 Vlaanderen en het VK.

## Wat ons van gedachten doet veranderen

Minder dan vijf verenigingen vóór 1 december: de wedge is verkeerd, we kijken eerst naar werkgevers. Geen hogere D7 bij squadleden dan bij solo-gebruikers: de sociale loop is niet echt, we repareren de productloop voordat we lanceren. Geen partner die per voltooide challenge wil betalen: de catalogus krimpt, de gratis laag leunt op status, omzet komt uit B2B2C en Plus. Fraude boven vijf procent: beloningen omlaag tot native verificatie er is.
