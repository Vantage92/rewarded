# 02 — Businessmodel, juridische haalbaarheid en unit economics

*Strategieteam Rewarded, rol: businessmodel, juridisch (NL/EU/app stores), unit economics. Stand: 4 november 2026. Dit is geen juridisch advies. Waar staat "advocaat" of "Ksa raadplegen", is dat een voorwaarde voordat er gebouwd wordt.*

## Samenvatting

1. Bij lancering kan alleen een **gratis beloningslaag** zonder vergunning: punten voor bewezen focus, gefinancierd door sponsors (C), plus kleine gratis prijstrekkingen volgens de Gedragscode promotionele kansspelen (D).
2. Een **commitment contract** waarbij je je eigen inzet verliest (A) is waarschijnlijk geen kansspel, omdat de gebruiker zelf "overwegende invloed" heeft op de uitkomst. Het is wel juridisch en financieel kwetsbaar. Dit model komt pas na een advocatenopinie en Ksa-toetsing, en alleen via autoriseren en pas afschrijven bij falen. Nooit via een eigen saldo.
3. Het **pool-model** (B), dat de founder brief in H3 voorstelt ("deel van de inzet van wie faalde"), is het zwakste model. Het heeft het hoogste kansspel- en PSD2-risico, het hoogste app-store-risico, en het stort economisch al in bij ongeveer 15% valsspelers. Advies: niet bouwen.
4. Een **abonnement dat een prijzenpot vult** (F) is vrijwel zeker een kansspel met inleg, en daarvoor bestaat voor een commercieel bedrijf geen vergunningsroute. Hierin geef ik de founder gelijk.
5. **B2B2C** (E) heeft de beste marge per gebruiker en is het meest robuust tegen fraude. Het hoort binnen 12 maanden de primaire betaalde omzetbron te zijn, niet de derde.
6. De gratis laag levert in het basisscenario ongeveer €0,19 contributiemarge per actieve gebruiker per maand op. Met **betaalde acquisitie is dat niet terug te verdienen** (payback >5 jaar). De groei moet dus organisch komen.
7. Showstoppers die we vóór de bouw moeten uitsluiten: Ksa-kwalificatie van de inzetlaag, een PSD2-vergunningsplicht, weigering door de PSP of de app store, en het ontbreken van getekende sponsor-intenties.

---

## 1. Methode en betrouwbaarheid

Labels in dit document: **[F]** = feit met bron; **[I]** = onderbouwde inschatting; **[S]** = speculatie of aanname. "Niet geverifieerd" betekent dat ik de bewering niet in een primaire bron heb kunnen controleren.

Beperking van deze sessie: het netwerk blokkeerde wetten.overheid.nl, kansspelautoriteit.nl, support.google.com, play.google.com, stripe.com en mollie.com. Wetteksten heb ik daarom via de officiële BWB-repository gelezen, met de nl-gov-data-tools. De Gedragscode heb ik gelezen via het WODC-rapport *Spelen met reclame* (2024), dat op open.overheid.nl staat. De Apple-richtlijnen heb ik rechtstreeks gelezen. Google Play-beleid en PSP-tarieven komen uit secundaire bronnen en zijn als zodanig gemarkeerd. Voordat er een besluit valt, moet iemand ze opnieuw controleren op de primaire pagina's.

## 2. Juridisch kader

### 2.1 Wet op de kansspelen (Wok)

**Huidige versie.** De geldende toestand van de Wok (BWBR0002469) loopt vanaf 12 februari 2025, zonder einddatum [F: BWB-registry, `https://repository.officiele-overheidspublicaties.nl/bwb/BWBR0002469/2025-02-12_0/xml/BWBR0002469_2025-02-12_0.xml`].

**Artikel 1, eerste lid** begint met: *"Behoudens het in Titel Va van deze wet bepaalde is het verboden:"* [F: BWB, toestand 2025-02-12]. De BWB-tool geeft de onderdelen niet terug. De formulering van **onderdeel a** is daarom geverifieerd via secundaire weergaven die woordelijk overeenkomen: het verbod om *"gelegenheid te geven om mede te dingen naar prijzen of premies, indien de aanwijzing der winnaars geschiedt door enige kansbepaling waarop de deelnemers in het algemeen geen overwegende invloed kunnen uitoefenen, tenzij daarvoor ingevolge deze wet vergunning is verleend"* [F: oorspronkelijke tekst Stb. 1964, 483, `https://zoek.officielebekendmakingen.nl/stb-1964-483.pdf`; dezelfde weergave in ABRvS 13 januari 2021, ECLI:NL:RVS:2021:2, `https://www.raadvanstate.nl/@123942/202001415-1-a3/`].

Drie elementen tellen: (1) een prijs of premie; (2) de winnaars worden aangewezen door een kansbepaling; (3) de deelnemers hebben daar "in het algemeen geen overwegende invloed" op. **Inleg is géén vereiste.** Ook een gratis trekking is dus een kansspel [F: WODC/Dialogic 2024, p. 31 noot 57: "Er is in de definitie van kansspelen in de wet geen inzetvereiste opgenomen"].

Hoe de rechter toetst:
- De Raad van State besliste dat meer kennis bij deelnemers aan een sportpoolspel nog geen overwegende invloed oplevert, omdat de uitkomst afhangt van factoren buiten hun invloed [F: ECLI:NL:RVS:2021:2].
- Het Hof Amsterdam oordeelde in 2016 dat poker een kansspel is, ondanks het behendigheidselement [F: `https://www.bijzonderstrafrecht.nl/home/hof-poker-is-een-kansspel`].

De lijn is dus: zodra een toevalselement de winnaar bepaalt, wint "kans" het van "kunde".

**Artikel 1a** schaart ook het piramidespel onder het verbod: *"een gelegenheid waarbij deelnemers een goed afgeven of een verplichting aangaan teneinde daaruit een voordeel te verwerven dat geheel of ten dele afhankelijk is van de afgifte van een goed of het aangaan van een verplichting door latere deelnemers"* [F: art. 1a lid 2 Wok, BWB 2025-02-12]. Dat raakt referral-bonussen die betaald worden uit inzet van nieuwe deelnemers.

**Artikel 3 lid 1.** Een vergunning voor een gelegenheid in de zin van art. 1 onder a kan alleen worden verleend *"indien deze gelegenheid wordt opengesteld uitsluitend ten einde met de opbrengst daarvan enig algemeen belang te dienen"*. Bij prijzen tot €4.500 verleent het college van B&W die vergunning, daarboven de raad van bestuur van de Ksa [F: art. 3 lid 1 Wok]. Een commercieel bedrijf met winstoogmerk heeft dus **geen vergunningsroute** voor een eigen loterij. De vergunningen voor kansspelen op afstand (Titel Va, sinds 1 oktober 2021) zijn bedoeld voor casino- en wedaanbieders. Ze zijn praktisch en reputationeel geen optie voor een focus-app [I].

**De Kansspelautoriteit (Ksa)** is de toezichthouder. Ze ziet toe op vergunninghouders, treedt op tegen illegaal aanbod en handhaaft sinds 2009 ook de Gedragscode promotionele kansspelen [F: WODC 2024, §3.1.2 en §3.2.1].

### 2.2 Gedragscode promotionele kansspelen 2014

De Gedragscode is een **gedoogkader zonder wettelijke basis**. Wie eraan voldoet, hoeft geen vergunning te hebben. Wie er niet aan voldoet, valt terug op het verbod van art. 1 [F: WODC 2024, §3.2.3, met een citaat uit de toelichting op de Gedragscode: "De wet maakt daarbij geen onderscheid tussen kansspelen met of zonder inleg … Aan deze vergunningsplicht hoeft niet te worden voldaan als promotionele kansspelen voldoen aan de voorwaarden die zijn gesteld in deze gedragscode"]. Ik heb geen versie gevonden die na 2014 is gewijzigd. De WODC-studie (maart 2024) noemt de versie van 2014 de huidige [F]. Of er in 2025–2026 een herziening is aangekondigd: **niet geverifieerd**.

| Voorwaarde (Gedragscode 2014) | Inhoud | Bron |
|---|---|---|
| Definitie (art. 1) | "het, bij wijze van promotie, geven van gelegenheid om mee te dingen naar prijzen of premies, waarbij de aanwijzing van de winnaars geschiedt door enige kansbepaling…" Er moet een organisatie, product of dienst worden gepromoot | WODC 2024 noot 47–48 |
| Frequentie (art. 2) | Maximaal één promotioneel kansspel per jaar per product, dienst of organisatie, met maximaal 20 trekkingen | WODC 2024 noot 50 |
| Kosten (art. 3) | Alleen communicatiekosten van maximaal €0,45. Andere kosten gelden als inleg, en dan is het spel zonder vergunning verboden | WODC 2024 noot 52 |
| Prijzenpot | Maximaal €100.000 totaal; het spel moet tijdelijk zijn | WODC 2024 §3.2.2 |
| Vermelding (art. 5) | Het gepromote product of de organisatie moet bij elke oproep tot deelname worden genoemd | WODC 2024 noot 49 |
| Minderjarigen (art. 6) | "Grote zorgvuldigheid en terughoudendheid" en toestemming van een ouder | WODC 2024 noot 53 |
| Spelvoorwaarden (art. 7) | Gratis en eenvoudig raadpleegbaar; informatie over aanbieder, prijzen en trekkingen. Winkansen hoeven niet vermeld te worden | WODC 2024 noot 54 |
| Klein spel (art. 8) | Bij een totale prijzenpot ≤ €4.500 gelden de frequentie- en trekkingslimieten niet, en zijn geen spelvoorwaarden nodig | WODC 2024 noot 51, 55 |

**Kansspelbelasting.** Het tarief is sinds 1 januari 2026 37,8%. Als de organisator de belasting voor zijn rekening neemt, wordt de prijs voor de berekening vermenigvuldigd met 100/62,2. Effectief kost dat ongeveer 60,8% van de prijswaarde bovenop de prijs [F: art. 5 Wet op de kansspelbelasting, BWBR0002359, toestand 2026-01-01]. De vrijstellingsdrempel voor kleine prijzen is **niet geverifieerd**: een oudere Belastingdienst-folder noemt €454, het actuele bedrag voor 2026 heb ik niet gevonden.

**Betekenis voor Rewarded.** Wekelijkse trekkingen zijn alleen toegestaan als elk spel valt onder het "kleine" regime (≤ €4.500 per spel). Anders gelden de limieten van één spel per jaar en twintig trekkingen. Of het opdelen in veel kleine spellen voor één en dezelfde app door de Ksa wordt geaccepteerd, is een open vraag. De WODC-studie meldt dat smaakvarianten als afzonderlijke producten gelden, waardoor het aantal spellen in de praktijk onbeperkt is. De Ksa zelf vindt dat de Gedragscode "het vergunningenstelsel volledig ondermijnt" [F: WODC 2024 §3.2.2 en §3.4.4]. Op dat randje bouwen is een risico: **Ksa raadplegen**.

Tweede risico: de 2008-evaluatie constateerde dat promotionele kansspelen als **zelfstandige activiteit** werden aangeboden (belspellen), en dat valt buiten de code [F: WODC 2024 §3.2.1]. Als trekkingen de kern van Rewarded worden in plaats van een promotie van de focus-dienst, verschuift het risico.

### 2.3 Consumentenrecht

- **Oneerlijke handelspraktijken** (art. 6:193a e.v. BW, toezicht ACM): claims als "word betaald om te studeren" moeten de werkelijke verdiensten weerspiegelen. Gemiddelde en mediane verdiensten publiceren voorkomt misleiding [I].
- **Herroepingsrecht** bij diensten op afstand (14 dagen): bij een inzet of een abonnement moet de gebruiker uitdrukkelijk instemmen met directe uitvoering. Hoe dit uitpakt voor een week-inzet die "verloren" is binnen de herroepingstermijn, is **niet geverifieerd**: advocaat.
- **Spel en weddenschap** (art. 7A:1825 BW): naar mijn beste weten geeft een schuld uit spel of weddenschap geen rechtsvordering. Ik heb de actuele tekst in deze sessie **niet kunnen verifiëren**. Als een rechter een inzetcontract als weddenschap kwalificeert, is een verbeurde inzet mogelijk niet afdwingbaar. Dat is nog een reden om af te schrijven via autorisatie en niet via een vordering [I].
- **BTW** op verbeurde inzetten: is het een vergoeding voor een dienst (21%) of een boete of schadevergoeding (buiten de BTW)? **Niet geverifieerd**: fiscalist. Bij 21% BTW daalt de omzet in model A met 17%.

### 2.4 AVG op hoofdlijnen

- **Grondslag**: overeenkomst voor de kernfunctie, toestemming voor marketing en sponsor-targeting. Sponsors krijgen geaggregeerde data, geen profielen [I].
- **DPIA** is vrijwel zeker verplicht (art. 35 AVG): het gaat om stelselmatige monitoring van gedrag (schermgebruik, eventueel locatie of camera voor verificatie) bij een jonge doelgroep [I].
- **Geautomatiseerde besluiten** (art. 22 AVG): een automatische fraudebeslissing waardoor iemand geld verliest of een beloning misloopt, heeft een "aanmerkelijk" effect. Ingebouwde menselijke herbeoordeling is dus nodig [I].
- **Leeftijd**: in Nederland geldt toestemming van een ouder onder 16 jaar voor diensten van de informatiemaatschappij op basis van toestemming (UAVG). Het exacte artikel is **niet geverifieerd**. Advies: 18+ voor de hele geldlaag, en 16+ voor de gratis laag, zonder trekkingen onder 18 vanwege art. 6 van de Gedragscode.

### 2.5 Financiële regelgeving (PSD2/e-geld)

- **Gelden van gebruikers aanhouden** of doorsturen naar derden (andere gebruikers, goede doelen) kan een betaaldienst zijn waarvoor een DNB-vergunning nodig is. De uitzondering voor de handelsagent geldt volgens de EBA alleen als het platform namens één partij handelt, niet namens beide [F, secundair: EBA Q&A 2020_5355 zoals geciteerd in `https://www.epravo.sk/top/clanky/psd3-a-digitalne-platformy-koniec-vynimky-pre-komercnych-agentov-6563.html`; Clifford Chance 2017]. De Nederlandse uitvoeringspraktijk van DNB: **niet geverifieerd**.
- **Ontwerp dat het risico vermijdt** [I]:
  - Model A: Rewarded is zelf de begunstigde van een betaling voor zijn eigen dienst (de verbeurde inzet is omzet van Rewarded). De donatie aan een goed doel is een eigen gift van Rewarded, geen doorgeleiding.
  - Model B: geld van verliezers gaat naar winnaars. Dat is functioneel geldtransmissie tussen gebruikers. Het vereist dan een licentie of een volledig door de PSP gereguleerde marketplace-structuur.
- **Autorisatie en pas afschrijven bij falen**: bij kaartbetalingen kan een bedrag worden "gereserveerd" en later worden afgeschreven. Een reservering voor online kaartbetalingen vervalt doorgaans na ongeveer 7 dagen [F, secundair; Stripe-documentatie **niet in deze sessie geverifieerd**]. Een weekdoel past daar net binnen.
  - **iDEAL kent geen autorisatie**: het is een directe overboeking. Daar moet je dus vooraf innen en bij succes terugbetalen, en dan houdt Rewarded het geld feitelijk tijdelijk aan [I].
  - SEPA-incasso pas bij falen lijkt aantrekkelijk, maar de consument kan een Core-incasso tot 8 weken onvoorwaardelijk laten terugboeken. Gefrustreerde verliezers doen dat. Bron: SEPA-rulebook, **niet geverifieerd in deze sessie**.
- **Hoe doen anderen het?** Forfeit: de gebruiker verliest de inzet als het bewijs ontbreekt, met menselijke verificatie en beroep; volgens een derde bron is er geen abonnement en betaal je alleen bij falen. Tegelijk toont een andere listing Pro- en Premium-abonnementen via IAP. Het exacte betaalmechanisme (autorisatie of directe afschrijving) heb ik **niet geverifieerd** [F, secundair: `https://apps.apple.com/us/app/id1633125787`, `https://www.toolmage.com/en/tool/forfeit/`]. StepBet/DietBet: deelnemers storten een inzet in een pot, winnaars verdelen de inzet van wie faalt, en de apps hebben App Store-rating 17+ met "Frequent/Intense Contests" [F, secundair: `https://apps.apple.com/bg/app/id532353287`]. De fee of het rake-percentage is **niet geverifieerd**. StepBet en DietBet zijn inmiddels verkocht aan Appex [F: `https://support.waybetter.app/hc/en-us/articles/19582162879251`].
- **Punten zijn geen e-geld** zolang ze gratis worden uitgegeven (niet "bij ontvangst van geldmiddelen") en niet inwisselbaar zijn voor contant geld [I; EMD2-definitie niet in deze sessie gelezen]. Inwisselbaar maken voor geld of voor een openbare cadeaukaart die overal bruikbaar is, verandert dat beeld.
- **PSP-acceptatie**: Stripe en Mollie hebben lijsten van verboden en beperkte activiteiten, waarop gokken, wedstrijden met geldprijzen en "games of skill" doorgaans staan. Hun actuele beleid voor commitment- en poolproducten is **niet geverifieerd**. Dit is een harde voorafgaande check.

### 2.6 App stores

**Apple** (App Store Review Guidelines, laatst bijgewerkt 16 oktober 2026 [F: `https://developer.apple.com/app-store/review/guidelines/`]), sectie 5.3 letterlijk:
- *5.3.1 "Sweepstakes and contests must be sponsored by the developer of the app."*
- *5.3.2 "Official rules for sweepstakes, contests, and raffles must be presented in the app and make clear that Apple is not a sponsor or involved in the activity in any manner."*
- *5.3.3 "Apps may not use in-app purchase to purchase credit or currency for use in conjunction with real money gaming of any kind."*
- *5.3.4 "Apps that offer real money gaming (such as sports betting, poker, casino games, horse racing) or lotteries must have necessary licensing and permissions in the locations where the app is used, must be geo-restricted to those locations, and must be free on the App Store. … Lottery apps must have consideration, chance, and a prize."*

Verder geldt 3.1.1: functionaliteit ontgrendelen vereist in-app purchase. En 3.2.2(x): apps "may otherwise incentivize users to take specific actions within apps" [F].

Gevolgen:
- Trekkingen moeten in naam van Rewarded worden georganiseerd. Een merk mag prijzen leveren, maar niet als organisator optreden.
- De spelregels moeten in de app staan, met de verklaring dat Apple er niet bij betrokken is.
- Een premium-abonnement loopt via IAP. Inzetten mogen nooit via IAP lopen (5.3.3).
- Een pool-model loopt het risico als "real money gaming" te worden gezien, en dan is een vergunning nodig (5.3.4).

**Google Play** (de primaire pagina was niet bereikbaar; alles hieronder is **secundair, niet geverifieerd** op `https://support.google.com/googleplay/android-developer/answer/9877032`):
- Real-money gambling is alleen toegestaan met een vergunning en een aanvraag per land. Nederland zou op de lijst "allowed with limitations" staan.
- Andere real-money games en contests met inzet of echte prijzen zijn in het algemeen niet toegestaan, behalve in pilots.
- "Gamified loyalty programs" zijn toegestaan. Voor non-game apps mogen ze kansgebaseerde elementen bevatten, mits de winkansen, deadlines en het aantal winnaars worden vermeld. Er mag geen deelnamefee zijn.
- Sinds oktober 2025 vallen "real-world rewards"-games onder het gokbeleid [secundair: `https://igamingexpert.com/news/business/google-sweepstake-policies-2025/`].

Gevolg: modellen C en D passen waarschijnlijk. Model A is twijfelachtig. Model B is waarschijnlijk niet toegestaan zonder vergunning.

De PWA-strategie uit de brief omzeilt de app-review bij de start. Dat is een tijdelijk voordeel, geen juridische oplossing: de Wok geldt ongeacht het distributiekanaal.

## 3. Beoordeling per beloningsmodel

| Model | Kansspel? (Wok art. 1 onder a) | Overige risico's | App stores | Oordeel |
|---|---|---|---|---|
| **A. Commitment contract** (eigen inzet; bij falen naar goed doel of bedrijf) | Waarschijnlijk niet: er is geen loting en de gebruiker heeft overwegende invloed op het eigen resultaat [I]. Risico: als verificatiefouten of willekeur de uitkomst bepalen ("de sensor faalde"), schuift het richting kans | PSD2 bij doorgeleiding; afdwingbaarheid (7A:1825 BW, niet geverifieerd); BTW; herroepingsrecht; perverse prikkel als het bedrijf aan falen verdient | Apple: geen IAP voor de inzet; mogelijk extra review. Google: onzeker | **Toegestaan onder voorwaarden**: 18+; maximale inzet; alleen autorisatie met afschrijving bij falen; verbeurde inzet is omzet van Rewarded met een vast deel als eigen donatie; menselijk beroep; vooraf advocaat en Ksa-toets |
| **B. Pool** (inzet van wie faalt naar wie slaagt, met fee) | Grijs tot hoog risico. Of je wint hangt van jezelf af, maar *hoeveel* hangt af van anderen, en de prijs wordt gefinancierd uit inleg van medespelers. Bij een "dagelijkse kans"- of loot-element wordt het een kansspel [I] | Geldtransmissie tussen gebruikers (PSD2); piramide-risico bij referral-bonus uit inzet (art. 1a); fraude stort het model in (§4) | Apple 5.3.4 en Google waarschijnlijk "real money contest" | **Niet toegestaan zonder vergunning en/of advies, en niet doen** |
| **C. Gesponsorde beloningen** (punten en vouchers) | Nee, zolang punten vast zijn per verdiende prestatie (geen loting) | Misleidende claims; AVG bij sponsor-targeting; e-geld als punten in geld inwisselbaar worden | Apple 3.2.2(x) staat prikkels toe; Google loyalty-beleid: vaste ratio | **Toegestaan**, met vaste en gepubliceerde wisselkoersen, geen cash-out, en een sponsor-budget vooraf gedekt |
| **D. Gratis trekkingen** onder wie het doel haalde | Ja, het is een kansspel, maar toegestaan onder de Gedragscode | Limieten (€100k per jaar, 1 per jaar met max. 20 trekkingen, of klein ≤ €4.500); kansspelbelasting 37,8%; minderjarigen; "zelfstandige activiteit"-risico; botst met "verdiend, niet gewonnen" | Apple 5.3.1/5.3.2 (Rewarded als sponsor, regels in de app); Google: winkansen en aantal winnaars vermelden | **Toegestaan onder voorwaarden**: echt gratis (ook geen betaald abonnement als voorwaarde); 18+; spelvoorwaarden; elk spel ≤ €4.500 of binnen de jaarlimiet; KSB ingecalculeerd |
| **E. B2B2C** (werkgever of instelling betaalt programma en beloningen) | Nee bij vaste beloningen. Trekkingen binnen het programma vallen weer onder D | Verwerkersovereenkomst; arbeidsrecht en monitoring van werknemers (OR-instemming, niet geverifieerd); fiscale behandeling van beloningen als loon (werkkostenregeling, niet geverifieerd) | Geen bijzonder risico | **Toegestaan**, met DPIA per klant en vrijwillige deelname |
| **F. Abonnement dat (deels) een prijzenpot vult** | Ja, en met inleg: een betaling die toegang geeft tot de kans geldt als inleg (Gedragscode art. 3). Een vergunning kan alleen voor een "algemeen belang" (art. 3 Wok) | Strafrechtelijk risico (Wok); Ksa-handhaving | Apple 5.3.4 (loterij: "consideration, chance, and a prize") | **Niet toegestaan.** Alleen houdbaar als de trekking ook voor niet-betalers volledig gratis open staat en de pot niet uit abonnementsgeld wordt gecommuniceerd. Ook dan grijs: advocaat |

## 4. Fraude als economisch probleem

H4 van de founder klopt: zodra er geld te halen is, wordt valsspelen rationeel. De vraag is hoe elk model reageert als 5%, 15% of 30% van de gebruikers valsspeelt.

Voor de pool-rekensom gebruik ik een illustratie [S]: 100 deelnemers, inzet €20, natuurlijk faalpercentage 25%, fee 10% van de totale inleg (€200) uit de verliezerspot. Valsspelers zijn gebruikers die eigenlijk zouden falen maar succes faken.

| Fraude | A. Commitment (opbrengst t.o.v. basis) | B. Pool: bonus per eerlijke winnaar | C. Sponsor | D. Trekking | E. B2B2C | F. Abonnementspot |
|---|---|---|---|---|---|---|
| 0% | 100% | €4,00 (20% rendement) | — | — | — | — |
| 5% | −5% verbeurde inzet; geen kasuitstroom | €2,50 (12,5%) | ~5% "makegoods" aan sponsors; binnen gangbare ad-fraud-tolerantie [I] | Winkans eerlijke gebruiker −5%; kosten gelijk | Beloningsbudget per seat begrensd; effect beperkt | Kansverdunning; fraude kost een abonnement en remt zichzelf |
| 15% | −15%; het gedragseffect van het product erodeert | €0,00 (pot = fee) | Sponsors eisen korting; CPA-prijs daalt | Winkans −15%; KYC alleen bij winnaars | Programma-meting onbetrouwbaar; risico bij verlenging | idem |
| 30% | −30%; verlies van geloofwaardigheid | Negatief: de fee is niet gedekt, eerlijke winnaars krijgen niets, verliezers haken af | Sponsors vertrekken | Winkans −30%; kosten nog steeds vast | Contractverlies waarschijnlijk | idem (juridisch al uitgesloten) |
| **Robuustheid** | **Robuust in kas** (valsspelers bedriegen vooral zichzelf) | **Stort in bij ~15%** | **Matig** (afhankelijk van meetbaarheid) | **Meest robuust** (vaste pot, alleen winnaars verifiëren) | **Robuust** (SSO-identiteit, vast budget) | n.v.t. |

Conclusie [I]: verificatiekosten moeten schalen met het bedrag dat per gebruiker op het spel staat.
- **Model D** heeft een vaste pot. Je verifieert alleen de handvol winnaars grondig (identiteit, sessielogs), wat goedkoop is.
- **Model B** verdeelt geld tussen gebruikers. Elke valse winnaar steelt dan direct van eerlijke spelers, en verificatie moet bij *iedereen* waterdicht zijn.

De PWA-verificatie uit de buildscope (app op het scherm plus Wake Lock) is goed genoeg voor punten en trekkingen. Voor geldinzet is ze niet goed genoeg [I]. Native Screen Time/UsageStats of device-attestatie is een voorwaarde vóór model A.

## 5. Unit economics

### 5.1 Geverifieerde en gemarkeerde input

| Input | Waarde | Status |
|---|---|---|
| Stripe, standaard EER-kaart | 1,5% + €0,25 | Secundair: Sellfy-calculator "gecontroleerd op Stripe's gepubliceerde prijzen, 12 oktober 2026" (`https://sellfy.com/nl/tools/stripe-kostencalculator/`). Een andere bron noemt €0,85 voor iDEAL. **Niet primair geverifieerd** |
| Stripe, iDEAL \| Wero | €0,29 per betaling | Idem |
| Mollie, iDEAL | €0,29 (één bron noemt €0,32) | Secundair: Telecompaper, Gekko-support. **Niet primair geverifieerd** |
| Mollie, kaarten | 1,8% + €0,25 | Secundair. **Niet primair geverifieerd** |
| Kosten chargeback | Aanname €15 | **[S]**; een concurrent noemt €7,50 voor Mollie |
| iDEAL chargebacks | Geen chargeback-mechanisme | Secundair (Mollie-materiaal) |
| Kansspelbelasting | 37,8%; ×100/62,2 als de organisator betaalt | **[F]** art. 5 Wet KSB |
| CPI West-Europa | iOS ~$3,40, Android ~$1,85 | Secundair aggregator, op basis van Adjust/AppsFlyer (`https://thesocialoutline.com/blog/mobile-app-cpi-benchmarks-2026`); niet primair |
| CPI Health & Fitness (Tier 1) | iOS $2–6, Android $1–3 | Secundair (admiral.media 2026) |
| Download → betaald, Health & Fitness | 2,9% mediaan | RevenueCat *State of Subscription Apps 2026* (`https://www.revenuecat.com/state-of-subscription-apps`), via een zoeksamenvatting |
| CPM Meta NL | $7–12 | Secundair (Adligator), methode onbekend. **Niet geverifieerd**; het DDMA-benchmarkrapport 2025 is niet gelezen |
| Student-verificatie (Student Beans) | Licentiefee + 8% commissie op geverifieerde transacties | Secundair, partnerpagina Student Beans |
| Hold | Merken betalen voor plaatsing in de rewards-marktplaats; 97% van de gebruikers via mond-tot-mond | Secundair (Liquid Barcodes case, Impakter) |

Sponsor-economie: ik vond geen publieke CPA voor een "geverifieerde focusactie". Een gesponsorde focus-challenge (een merk betaalt per gebruiker die bijvoorbeeld 5 uur focus haalt en de merkboodschap ziet) schat ik op **€1–€3 per voltooiing** [S]. Die schatting is afgeleid van de NL-CPM van $7–12 en de vaststelling dat een voltooide challenge meerdere vertoningen en een merkassociatie oplevert. Valideren met 5 sponsorgesprekken.

### 5.2 Model C+D: gratis laag, per maandelijks actieve gebruiker (MAU) per maand

| Post | Basis | Pessimistisch | Toelichting |
|---|---|---|---|
| Gesponsorde vertoningen | 40 × €6 CPM = €0,24 | 40 × €4 = €0,16 | [I] |
| Gesponsorde challenges (CPA) | 10% × €2,50 = €0,25 | 5% × €2,50 = €0,125 | [S] |
| Voucher- of affiliatecommissie | 4% × €2,00 = €0,08 | 2% × €2,00 = €0,04 | [S] |
| **Opbrengst** | **€0,57** | **€0,33** | |
| Beloningen die Rewarded zelf financiert | −€0,10 | −€0,10 | Regel: ≤ 20% van de geboekte sponsoromzet |
| Prijzenpot trekkingen | −€0,08 | −€0,08 | Bijv. €800 per maand per 10k MAU; elk spel ≤ €4.500 |
| Kansspelbelasting (organisator betaalt) | −€0,05 | −€0,05 | €0,08 × 0,608 |
| Fraudeverlies (15% / 30%) | −€0,05 | −€0,07 | Makegoods aan sponsors plus beloningen aan valsspelers |
| Uitkering vouchers en betaalkosten | −€0,01 | −€0,01 | Digitale vouchers; geen geldbetaling |
| Infra en verificatie | −€0,06 | −€0,06 | [S] |
| Support | −€0,03 | −€0,03 | [S] |
| **Contributiemarge** | **€0,19 (≈33%)** | **−€0,07** | |

**CAC en payback.**
- Een CPI van ~$3,40 (iOS, West-Europa) en een aanname van 25% van de installs die na twee maanden nog MAU is [S] geven een CAC per behouden MAU van ~$13–14.
- Bij €0,19 per maand is de payback **ruim 5 jaar**.
- Conclusie: betaalde acquisitie is voor de gratis laag uitgesloten. Groei moet komen uit campusambassadeurs, squads en "study with me"-content. Hold is het precedent, met 97% van de gebruikers via mond-tot-mond (secundair).
- Harde regel: **beloningsbudget = vast percentage van de vooraf geboekte sponsoromzet**. Dan is het pessimistische scenario een lagere beloning, geen verlies.

### 5.3 Model A: commitment contract, per actieve inzetter per maand

Aannames [S]: 4 weekcontracten per maand, gemiddelde inzet €10, natuurlijk faalpercentage 20%, autorisatie op de kaart en afschrijving alleen bij falen.

| Post | A1: verbeurde inzet 100% naar Rewarded | A2: 50% eigen donatie aan goed doel |
|---|---|---|
| Bruto verbeurde inzet (4 × €10 × 20%) | €8,00 | €8,00 |
| Fraudeverlies (15% van de falers faket succes) | −€1,20 | −€1,20 |
| Donatie aan goed doel | — | −€3,40 |
| Betaalkosten (0,8 afschrijving × (1,5% + €0,25)) | −€0,32 | −€0,32 |
| Kosten van niet-afgeschreven autorisaties | €0 (aanname, **niet geverifieerd**) | €0 |
| Chargebacks (3% van afschrijvingen × €15) | −€0,36 | −€0,36 |
| Menselijke beroepen en support | −€0,60 | −€0,60 |
| Infra en native verificatie | −€0,15 | −€0,15 |
| **Contributiemarge** | **€5,37** | **€1,97** |
| Gevoeligheid BTW 21% (indien verschuldigd) | −€1,18 | −€0,59 |
| Alternatief iDEAL (vooraf innen en terugstorten) | +€0,84 extra betaalkosten (4 × €0,29 − €0,32), plus terugbetaalkosten (onbekend) en het juridische probleem van aanhouden | idem |

Kanttekeningen:
- **A1 verdient aan het falen van de klant.** Dat is een belangenconflict: elke ontwerpkeuze die succes moeilijker maakt, verhoogt de omzet. De ACM en de pers zien dat als een dark pattern [I]. A2, of een vast tarief per contract met de volledige verbeurde inzet naar een goed doel, is geloofwaardiger.
- **Microtransacties werken niet.** Een fee van €0,50 per contract wordt voor 58% opgegeten door €0,29 iDEAL-kosten. Een vast tarief werkt alleen als abonnement.
- **CAC**: direct werven kost ongeveer CPI / 2,9% ≈ $100 per betalende gebruiker (afgeleid; secundair). Payback is ~19 maanden voor A1 en ~50 maanden voor A2. Inzetters moeten dus uit de gratis laag komen. Als 5–8% van de MAU een contract aangaat [S], ligt de marginale CAC bijna op nul.

### 5.4 Model E: B2B2C, per betaalde plek (seat) per maand

| Post | Bedrag | Status |
|---|---|---|
| Prijs per seat | €3,00 | [S]: geen benchmark gevonden; valideren in pilots |
| Beloningsbudget (in de prijs inbegrepen, begrensd) | −€0,90 | 30% [S] |
| Trekkingen plus kansspelbelasting | −€0,32 (€0,20 + €0,12) | [I] |
| Fraude (15% van de beloningen; SSO verlaagt dit) | −€0,14 | [I] |
| Betaalkosten (factuur via SEPA-overboeking) | ~€0 | [I] |
| Accountmanagement en support | −€0,40 | [S] |
| Infra | −€0,08 | [S] |
| **Contributiemarge** | **€1,16 (≈39%)** | |

CAC: met een geschatte €5.000 verkoopkosten per contract van 500 seats [S] kost een seat €10. De payback is dan ~9 maanden, met een jaarcontract als vangnet. Dit is het enige model waarin betaalde acquisitie (sales) zichzelf terugverdient. De verkoopcyclus bij universiteiten is lang en het budget ligt eerder bij studentenwelzijn dan bij onderwijs. De naam van het budget en de timing zijn **niet geverifieerd**.

## 6. Waar ik het oneens ben met de founder brief

1. **H3 "plus eventueel een deel van de inzet van wie faalde"**: niet doen. Het pool-element maakt van een verdedigbaar commitment-product een kansspel- en betaaldienstrisico, en het is economisch het meest fraudegevoelig (§4).
2. **H2 noemt B2B2C als derde bron.** Ik zou het de eerste betaalde bron maken. De gratis consumentenlaag is een groeimotor, geen winstmotor.
3. **"Unit economics van de gratis laag vanaf dag één sluitend"** is alleen haalbaar als beloningen een *afgeleide* zijn van geboekte sponsoromzet. Vaste beloningsbeloftes zijn dat niet.
4. **"Beloningen zijn verdiend, niet gewonnen"** botst met prijstrekkingen. Een trekking is per definitie gewonnen. Houd trekkingen klein en secundair, en communiceer ze eerlijk als kans. Dat is ook juridisch verstandig, vanwege het risico dat de trekking een "zelfstandige activiteit" wordt.
5. **De PWA met Wake Lock** volstaat voor punten, niet voor geld. De volgorde in de buildscope (native verificatie later) is te laat voor model A.

## 7. Aanbeveling

### (a) Lancering

- **C + D, gratis, 16+ (trekkingen 18+)**:
  - punten tegen een vaste, gepubliceerde ratio, inwisselbaar voor sponsor-vouchers;
  - maandelijkse trekking van ≤ €4.500 per spel onder gebruikers die hun doel haalden, met spelvoorwaarden en kansspelbelasting voor rekening van Rewarded;
  - beloningsbudget ≤ 20% van de geboekte sponsoromzet;
  - geen cash-out.
- **E als pilot**: 1–2 onderwijsinstellingen of studentenverenigingen, gratis of tegen kostprijs, om bewijs van effect en een referentie te verzamelen.
- Een premium-abonnement mag (statistieken, squads, thema's), maar mag **niet** gekoppeld zijn aan trekkingskansen.

### (b) Na 12 maanden

- **E** als primaire omzet: jaarcontracten per seat, beloningsbudget in de prijs.
- **A2** als opt-in, 18+, alleen als de onderstaande voorwaarden zijn vervuld:
  - maximale inzet €50 per week en een maandlimiet;
  - afkoelperiode na verlies; geen "verdubbelen";
  - native verificatie;
  - verbeurde inzet is omzet van Rewarded, waarvan een vast en gepubliceerd percentage als eigen donatie naar een goed doel gaat.
- **B en F**: niet bouwen.

### Harde voorwaarden en showstoppers, uit te sluiten vóór de bouw

| # | Showstopper | Hoe uitsluiten vóór de bouw | Eigenaar |
|---|---|---|---|
| 1 | De Ksa kwalificeert de inzetlaag (A) of de trekkingsstructuur (veel kleine spellen) als kansspel buiten de Gedragscode | Schriftelijke opinie van een kansspeladvocaat; voorleggen aan de Ksa met een concreet ontwerp | Founder + advocaat |
| 2 | PSD2-vergunningsplicht doordat Rewarded gelden van gebruikers aanhoudt of doorgeleidt | Betaalstroomdiagram laten toetsen door een financieel-regulatoir advocaat; alleen autorisatie met afschrijving bij falen; geen eigen saldo | Advocaat |
| 3 | De PSP (Stripe of Mollie) weigert het product op grond van het beleid voor beperkte activiteiten | Vooraf schriftelijke bevestiging van de PSP-compliance-afdeling voor model A | Founder |
| 4 | Afwijzing in de app store (Apple 5.3.4, Google real-money contests) | Model A eerst alleen in de PWA; ontwerp vooraf voorleggen via het App Review-contact; Google-beleid primair lezen | Product |
| 5 | Geen sponsorvraag, waardoor de gratis laag ongedekt is | ≥ 5 getekende intentieverklaringen met prijs per voltooide challenge vóór de lancering | Founder / sales |
| 6 | Fraude bij geldinzet niet onder ~5% te krijgen | Red-team-test van de verificatie; model A pas live met native signalen en menselijke beroepsprocedure | Tech |
| 7 | Verplichtingen voor BTW en kansspelbelasting onduidelijk | Fiscalist: BTW op verbeurde inzet, vrijstellingsdrempel KSB 2026 | Fiscalist |

## 8. Open vragen

- Accepteert de Ksa een reeks "kleine" promotionele spellen (≤ €4.500) voor dezelfde app, maand na maand?
- Is een verbeurde inzet in Nederland afdwingbaar en BTW-plichtig, en hoe verhoudt hij zich tot het herroepingsrecht?
- Actuele tekst van het Google Play-beleid voor non-game apps met kansgebaseerde beloningen, specifiek voor Nederland.
- Primaire tarieven van Stripe en Mollie, inclusief chargeback- en autorisatiekosten en het beleid voor beperkte activiteiten.
- Wat betaalt een merk werkelijk per geverifieerde studentenactie? Te testen in sponsorgesprekken.
- Status van PSD3/PSR en de herziene uitzondering voor handelsagenten (**niet geverifieerd** per november 2026).

## Bronnen

- Wet op de kansspelen, BWBR0002469, toestand 2025-02-12: `https://repository.officiele-overheidspublicaties.nl/bwb/BWBR0002469/2025-02-12_0/xml/BWBR0002469_2025-02-12_0.xml` (art. 1 aanhef, art. 1a, art. 3)
- Stb. 1964, 483: `https://zoek.officielebekendmakingen.nl/stb-1964-483.pdf`
- Wet op de kansspelbelasting, BWBR0002359, toestand 2026-01-01 (art. 5): `https://repository.officiele-overheidspublicaties.nl/bwb/BWBR0002359/2026-01-01_0/xml/BWBR0002359_2026-01-01_0.xml`
- Dialogic/WODC (2024), *Spelen met reclame*: `https://open.overheid.nl/documenten/dpc-ad743e9955f543ebf1915095b0f09248e49b0d12`
- ABRvS 13 januari 2021, ECLI:NL:RVS:2021:2: `https://www.raadvanstate.nl/@123942/202001415-1-a3/`
- Hof Amsterdam over poker: `https://www.bijzonderstrafrecht.nl/home/hof-poker-is-een-kansspel`
- Apple App Store Review Guidelines (bijgewerkt 16 oktober 2026): `https://developer.apple.com/app-store/review/guidelines/`
- Google Play Real-Money Gambling, Games, and Contests (niet bereikbaar, secundair benaderd): `https://support.google.com/googleplay/android-developer/answer/9877032`; `https://igamingexpert.com/news/business/google-sweepstake-policies-2025/`
- PSD2 en de uitzondering voor handelsagenten: `https://www.epravo.sk/top/clanky/psd3-a-digitalne-platformy-koniec-vynimky-pre-komercnych-agentov-6563.html`; `https://www.cliffordchance.com/briefings/2017/11/impact_of_psd2_ononlinemarketplacesoperatin.html`
- Tarieven: `https://sellfy.com/nl/tools/stripe-kostencalculator/`; `https://www.telecompaper.com/nieuws/mollie-verlaagt-transactietarieven--1131051`; `https://support.getgekko.com/en/support/solutions/articles/47001249982`
- Benchmarks: `https://www.revenuecat.com/state-of-subscription-apps`; `https://thesocialoutline.com/blog/mobile-app-cpi-benchmarks-2026`; `https://admiral.media/mobile-app-marketing-benchmarks-2026/`; `https://adligator.com/blog/meta-ads-cpm-by-country-benchmarks`; `https://partner.studentbeans.com/verification/student-verification/shopify/`
- Concurrenten: `https://apps.apple.com/us/app/id1633125787` (Forfeit); `https://apps.apple.com/bg/app/id532353287` (DietBet); `https://support.waybetter.app/hc/en-us/articles/19582162879251`; `https://liquidbarcodes.com/cases/reward-for-focusing-at-school` en `https://impakter.com/hold-app-help-students/` (Hold)
