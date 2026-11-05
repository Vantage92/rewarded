# Rewarded — Voorregistratie gesloten pilot 2026/'27 (concept)

*Concept van het productteam, 5 november 2026 (bijgewerkt na de aanvulling van de founder na de samenhangcontrole). Vast te leggen door de founder vóór 2 december 2026; na vastlegging wijzigt niets meer zonder een gedateerde, gemotiveerde wijzigingsregel onderaan (en dan rapporteren we beide versies). Bindend kader: de besluiten van de founder na pitchronde 1 (`docs/pitch/ronde-1-founder-reactie.md`), het businessplan (`docs/01-businessplan.md` §7) en het productplan (`docs/02-productplan.md` §8). Regels en parameters: `docs/research/05-productspecificatie.md` (verder: spec). Bij verschil tussen dit document en een ander document over maten, drempels en beslisregels geldt dit document.*

*Markering. **[in te vullen]** betekent dat een getal pas na de poweranalyse, de red-teamdag of een bevestiging van een vereniging bekend is; we vullen het in vóór 2 december. **Werkhypothese** is een voorstel van het productteam of het strategieteam dat de founder hier bevestigt of verandert. **Aanname** is iets wat we niet weten. Er staat geen getal in dat niet uit een bron, een besluit van de founder of een benoemde werkhypothese komt.*

---

## 1. Wat deze pilot is, en wat niet

Dit is een **verkennende pilot met één redelijk gepowerde vergelijking**: de doelbonus in arm A (gewone bijschrijving) tegenover arm B (slinkend weekbudget), gemeten als gehaalde dagdoelen tijdens het seizoen. Daarnaast meten we voorgeregistreerd, maar verkennend, de nawerking in de tentamenperiode van april 2027 en het squadeffect via een encouragement design.

Twee besluiten hangen aan deze pilot, op verschillende momenten:

| Besluit | Wanneer | Waarop |
|---|---|---|
| **Lanceringsbesluit** (operationeel) | 19 januari 2027, op data tot en met 18 januari 04:00; lancering dezelfde dag | Activatie, fraude, kosten, D7 van het go/no-go-cohort, deelnemersbescherming (§5) |
| **Bedrijfsbesluit** (gedragseffect, tweede tranche, native app, volgende financieringsstap) | Na de nawerkingsmeting van april 2027 (werkhypothese: mei 2027) | Nawerking, na-seizoensmaten, squadeffect, commercieel criterium (§6) |

Het lanceringsbesluit hangt **niet** af van de nawerkingshypothese. Zo staat het ook in de pitch en het productplan.

Een hypothese waarvan het kleinste detecteerbare effect (MDE) volgens de poweranalyse groter is dan plausibel, heet **verkennend**: we rapporteren effect en betrouwbaarheidsinterval, en er hangt geen besluit aan. De poweranalyse bepaalt dus hoe we een uitkomst lezen, niet of we randomiseren. De pitch gebruikt letterlijk de formuleringen uit §4.

## 2. Populaties en cohorten

| Groep | Definitie | Gebruikt voor |
|---|---|---|
| Experimentpopulatie | Accounts die zich in de gesloten pilot registreren (2 december 2026 – 17 januari 2027), niet `is_team`, niet afgemeld voor het onderzoek (§8.1) | Alle experimentele vergelijkingen |
| **Go/no-go-cohort** | Experimentpopulatie met registratie op 2 tot en met 13 december 2026 | D7 en D30 in het lanceringsbesluit en de stopregel |
| Late instromers | Registratie 14 december – 17 januari | ITT-analyse, apart gerapporteerd |
| Lanceringsgebruikers | Registratie vanaf 19 januari 2027 | Niet in de experimenten (werkhypothese: ze verdienen punten volgens de ratio, ook in een squad met de rustperiode); alleen de operationele maten van de lancering |
| 16- en 17-jarigen | `age_band = 16_17` op de dag van toewijzing | Altijd arm A en buiten de rustperiode-arm; wel in de Belofte- en encouragement-factor; buiten de analyse van doelbonus en rustperiode |

**Kalender van het go/no-go-cohort.** Dag 0 is de registratiedag. De vakantiepauze is 21 december 2026 – 3 januari 2027 (werkhypothese, spec §5).

| Registratie | D7 (kalender) | D30 (kalender) | D30 (vakantiedagen overgeslagen) |
|---|---|---|---|
| 2 december | 9 december | 1 januari (vakantiepauze) | 15 januari (tentamenweken) |
| 6 december | 13 december | 5 januari (tentamenweken) | 19 januari |
| 9 december | 16 december | 8 januari (tentamenweken) | 22 januari |
| 13 december | 20 december | 12 januari (tentamenweken) | 26 januari |

Gevolg dat we hier vastleggen: **D7 van het hele go/no-go-cohort valt vóór de vakantiepauze en is op 18 januari bekend.** D30 valt voor dit cohort in de vakantiepauze of in de tentamenweken (werkhypothese prijsperiode 4–17 januari), en meet daar vooral de tentamenkalender. We rapporteren D30 daarom altijd op kalendertijd én met overgeslagen vakantiedagen, en we gebruiken voor de stopregel een D30 **buiten de tentamenweken**, gemeten in 1–14 februari (§5.2), die pas na 14 februari bekend is.

## 3. Kalender van de pilot

Tentamenperiodes verschillen per instelling. Elke datum met "per vereniging" wordt vóór 2 december schriftelijk bevestigd door de vereniging of de instelling **[in te vullen per vereniging]**.

| Datum | Wat |
|---|---|
| Vóór 25 november 2026 | Poweranalyse (statisticus); red-teamdag (§7.3); oordeel jurist over arm B en de rustperiode-arm; toesteltest; stopregel arm B en welzijnsgrens vastgesteld (§8.3; founder met statisticus en onderzoeker) |
| Vóór 1 december 2026 | DPIA ondertekend; jaarkalenders van de pilotinstellingen opgevraagd (founder) |
| Vóór 2 december 2026 | Deze voorregistratie vastgelegd; A/A-controle afgerond (§9.3); randomisatieseed vastgelegd (§9.2); hogere drempels voor campus en CGNAT op de seed vastgelegd (§7.4) |
| 2 december 2026 | Start gesloten pilot (R1); start doelbonus; start registratievenster go/no-go-cohort |
| 13 december 2026 | Einde registratievenster go/no-go-cohort |
| 21 december 2026 – 3 januari 2027 | Vakantiepauze (doelbonus, streaks, Belofte-dagen en pauzetellers bevroren) |
| 4–17 januari 2027 | Prijsperiode Blokk-challenge (werkhypothese; per vereniging) |
| Maandag 11 januari 2027 | Belofte-aanbod in de vroege arm, voor iedereen op dezelfde dag (besluit founder, 5 november; niet per vereniging); aankondiging van de stop van de doelbonus; uiterlijk dan bekendmaking van de rustperiode-groep |
| 11–17 januari 2027 | Laatste tentamenweek (werkhypothese; per vereniging); venster voor de januari-actieven (H3, secundair) |
| Maandag 18 januari 2027, 04:00 | Stop doelbonus; einde van de data voor het lanceringsbesluit |
| 18–24 januari 2027 | Pilotreflectie met de vraag over de bonusregel en welzijnsmeting 2 |
| 19 januari 2027 | Lanceringsbesluit; publieke lancering in Nederland; eerste dag van de rustperiode in de rustperiode-arm (tot en met 31 maart) |
| 25–31 januari 2027 | Welzijnsmeting 3 en zelfrapportage "na" (werkhypothese voor "eind januari") |
| 1–14 februari 2027 | Secundair venster na het seizoen (§4, H3); meetvenster D30 buiten de tentamenweken (§5.2) |
| Maart 2027 | Secundair venster (§4, H3) |
| 25–31 maart 2027 | Secundaire maat: terugkeer in de week vóór de aprilchallenge (§4, H3) |
| 1 april 2027 | Einde rustperiode: iedereen verdient weer punten |
| Tentamenperiode april 2027 **[in te vullen per vereniging]** | Primaire nawerkingsmeting (§4, H3); aprilchallenge voor iedereen |
| Na het aprilvenster | Belofte-aanbod in de late arm (§4, H3) |
| Mei 2027 (werkhypothese) | Bedrijfsbesluit |
| Uiterlijk 15 juni 2027 | Ruwe events samengevat (spec §4.10, DPIA) |

## 4. Hypotheses

Per hypothese: één primaire maat, de analyse-eenheid, het kleinste detecteerbare effect en de beslisregel. De MDE's vult de statisticus in na de poweranalyse op 300–800 gebruikers (aantal uit rapport 03 §5; **aanname** tot de wachtlijst het bevestigt).

### H1 — Squadeffect (encouragement design)

| Onderdeel | Inhoud |
|---|---|
| Formulering voor de pitch | "Solo-gebruikers die een sterke uitnodiging krijgen om een squad te vormen, vormen vaker een squad en zijn vaker op dag 7 actief." |
| Toewijzing | Solo-gebruikers (registratie zonder squad- of duellink en op dag 0 niet in een squad) op dag 0 geloot 50/50: **sterke squadprompt** (op dag 1, 2 en 3 een prominente kaart "Focus samen" met een kant-en-klare WhatsApp-link en voorgestelde tekst) of **standaardflow** (de gewone ingang naar een squad) |
| Primaire maat | D7: aandeel met ≥ 1 goedgekeurde, voltooide sessie van ≥ 25 minuten op dag 7, op toewijzing (ITT) |
| Eerste stap (voor IV) | Aandeel dat op dag 7 lid is van een actieve squad (≥ 3 actieve leden) |
| Analyse-eenheid | Solo-gebruiker |
| Analyse | ITT op D7; IV-schatting van het effect van squadlidmaatschap met de toewijzing als instrument; binnen-persoonsanalyse van sessiedagen in de 7 dagen vóór en na het actief worden van de eigen squad, met de tentamenkalender als covariaat |
| Secundair | W3 (≥ 2 sessiedagen in dag 15–21, vakantiedagen overgeslagen), squadoverleving, K van gebruiker aan gebruiker |
| MDE | **[in te vullen na de poweranalyse]** |
| Beslisregel | Effect op D7 groter dan nul met het 95%-interval boven nul: "de squadprompt verhoogt retentie", input voor het bedrijfsbesluit. Interval rond nul: "de sociale loop is niet aangetoond; de productloop gaat voor groei" (businessplan §12). MDE groter dan plausibel: verkennend, geen besluit |
| Wat géén go/no-go is | De ruwe vergelijking squad tegenover solo (D7 van wie op dag 0–2 in een actieve squad zat, gedeeld door de rest). Die rapporteren we beschrijvend; ze meet vooral zelfselectie |

### H2 — Meer gehaalde dagdoelen tijdens het seizoen (doelbonus A tegenover B)

Dit is de ene redelijk gepowerde vergelijking.

| Onderdeel | Inhoud |
|---|---|
| Formulering voor de pitch | "Meer gehaalde dagdoelen tijdens het seizoen met een slinkend weekbudget (arm B) dan met gewone bijschrijving (arm A)." We claimen daarmee geen betere retentie. |
| Toewijzing | Per squad bij aanmaken, solo per persoon bij registratie; 16- en 17-jarigen altijd arm A |
| Primaire maat | Aandeel gebruikersdagen met een gehaald dagdoel (`goal_met_final`) tijdens het seizoen (focusdagen 2 december – 17 januari, zonder vakantiepauze), per gebruiker vanaf de registratiedag; tentamendagen (spec §4.4) tellen als niet-gehaald en worden in een gevoeligheidsanalyse weggelaten |
| Analyse-eenheid | Toewijzingseenheid (squad of solo); standaardfouten geclusterd op die eenheid |
| Analyse | ITT op de eerst toegewezen arm; wisselaars apart en als gevoeligheidsanalyse zonder hen; 16- en 17-jarigen buiten de analyse |
| Secundair | Focusminuten per week, D7, sessiedagen per week, reflectievraag "hoe voelde de bonusregel" per arm (§8.4) |
| MDE | **[in te vullen na de poweranalyse]** |
| Beslisregel | Arm B significant hoger: arm B wordt de standaardregel voor een volgend seizoen, mits geen stopregel voor deelnemersbescherming geraakt is (§8.3). Geen verschil of arm A hoger: arm A blijft standaard. De uitkomst draagt het lanceringsbesluit niet |

### H3 — Nawerking na het einde van de doelbonus (verkennend)

| Onderdeel | Inhoud |
|---|---|
| Formulering voor de pitch | "Na het einde van de doelbonus focussen studenten in de volgende tentamenperiode vaker als ze bij de aankondiging van de stop van de bonus een Belofte aangeboden kregen (H3a), en als ze na het seizoen gewoon punten bleven verdienen of juist niet (H3b, zie richting)." H3 is verkennend tot de poweranalyse anders laat zien. |
| H3a: factor Belofte | **Vroeg**: aanbod op maandag 11 januari 2027, een week vóór de stop van de doelbonus op 18 januari 04:00, voor iedereen in de vroege arm op dezelfde dag (besluit founder, 5 november; niet per vereniging). **Laat**: aanbod pas na het aprilvenster. De Belofte raakt geen punten |
| H3b: factor rustperiode | **Rustperiode**: van 19 januari tot en met 31 maart 2027 verdient de squad geen punten; vanaf 1 april verdient iedereen weer punten, en de aprilchallenge loopt voor iedereen in de tentamenperiode per instelling (besluit founder, 5 november). Verdiende punten blijven inwisselbaar. **Doorlopend**: de squad verdient punten volgens de vaste ratio. Vanaf de eerste dag aangekondigd in de voorwaarden; de toewijzing wordt uiterlijk op 11 januari 2027 aan de gebruiker getoond. De rustperiode is geen beloningsregel maar een vooraf aangekondigde onderzoeksconditie met opt-out zonder verlies van punten; de eis dat geen arm een hogere maximale beloning oplevert (JS2) geldt voor de bonusarmen A en B (besluit founder, 5 november). Alleen als de advocaat geen kanselement of oneerlijke handelspraktijk ziet (vraag 3b); anders vervalt H3b en verdient iedereen doorlopend |
| Richting H3b | Tweezijdig. "Beloning als steiger" voorspelt dat de rustperiode-arm in april niet slechter scoort; een verdringingseffect zou hem beter laten scoren, een afhankelijkheid van de beloning slechter |
| Toewijzing | Beide factoren per squad of solo, onafhankelijk geloot; 16- en 17-jarigen buiten de rustperiode-arm |
| Primaire maat | Gemiddeld aantal sessiedagen per week in het aprilvenster (sessiedag: ≥ 1 goedgekeurde, voltooide sessie van ≥ 25 minuten) **[venster in te vullen per vereniging]** |
| Analyse-eenheid | Toewijzingseenheid (squad of solo); geclusterd |
| Analyse | ITT tussen armen, niet vóór tegenover na; zero-inflated verdeling verwacht, dus ook het aandeel met ≥ 1 sessiedag in het venster |
| Secundair | (1) Aandeel van de januari-actieven (≥ 2 sessiedagen in 11–17 januari) met ≥ 2 sessiedagen per week in 1–14 februari; (2) terugkeer in de week vóór de aprilchallenge, 25–31 maart (aandeel met ≥ 1 sessiedag in 25–31 maart onder wie in 1–24 maart geen sessie had; de maat "terugkeer zonder nieuwe challenge" is vervallen, besluit founder 5 november; definitie voorstel productteam); (3) sessiedagen per week in maart; (4) Belofte-overname en -naleving, ook naar squadstatus; (5) welzijnsmeting en zelfrapportage (§8.4) |
| MDE | **[in te vullen na de poweranalyse]** |
| Beslisregel | Verkennend tenzij de MDE plausibel is. Een effect in de vroege Belofte-arm of de rustperiode-arm met het interval boven nul is input voor het bedrijfsbesluit ("gemeten nawerking", businessplan §4). Geen effect: de verdediging rust alleen op de institutionele relatie, en dat zeggen we tegen investeerders en klanten (businessplan §12) |

### H4 — Fraude blijft beheersbaar (operationeel)

Formulering voor de pitch: "Het geschatte aandeel frauduleuze accounts uit de onafhankelijke steekproef blijft onder 5%." Primaire maat: het geschatte aandeel frauduleuze accounts uit de onafhankelijke steekproef (§7.1), met 95%-interval. Het aandeel gemarkeerde sessies is een maat voor de wachtrijlast, geen go/no-go. Beslisregel in §5.

## 5. Lanceringsbesluit op 19 januari 2027 (data tot en met 18 januari 04:00)

### 5.1 Maten en drempels

| Maat | Definitie | Drempel |
|---|---|---|
| Activatie | Accounts met een goedgekeurde sessie van ≥ 25 minuten binnen 24 uur na registratie, gedeeld door alle registraties (experimentpopulatie); de oefensessie telt niet | ≥ 60% |
| D7 go/no-go-cohort | Aandeel van het go/no-go-cohort met ≥ 1 goedgekeurde sessie op dag 7 | ≥ 25%; definitieve drempel per kanaal afgeleid uit de encouragement-controle (de D7 van de standaardflow) **[in te vullen vóór 2 december]** |
| Geschatte fraude | Onafhankelijke steekproef (§7.1), cumulatief tot en met week 6 | Puntschatting < 5% |
| Kosten per wekelijks actieve gebruiker per week | (Kostprijs verzilveringen + verdiende prijzen + verenigingsprijzen) ÷ (gebruikers met ≥ 1 goedgekeurde sessie in die week), per week | Werkhypothese ≤ €0,06, afgeleid uit het maandplafond van €0,25 per maandelijks actieve gebruiker (businessplan §6; besluit founder 5 november; **aanname**) |
| Deelnemersbescherming | Geen stopregel uit §8.3 geraakt | Geen |

### 5.2 Stopregel en besluit per uitkomst

| Uitkomst | Besluit |
|---|---|
| D7 go/no-go-cohort < 15% | Geen lancering en geen tweede tranche (stopregel) |
| D30 buiten de tentamenweken < 6% | Geen tweede tranche en geen opschaling (stopregel; besluit founder, 5 november). Definitie: aandeel van het go/no-go-cohort met ≥ 1 goedgekeurde sessie in 1–14 februari 2027, een venster buiten de tentamenweken dat voor het hele cohort na dag 30 ligt (eerder voorstel productteam: 18–31 januari). Deze maat is pas na 14 februari bekend en weegt dus in het bedrijfsbesluit, niet in het lanceringsbesluit |
| D7 tussen 15% en 25% (werkhypothese) | Lancering uitgesteld; productloop eerst repareren en opnieuw meten |
| Geschatte fraude ≥ 5% | Beloningen in de gratis laag omlaag tot native verificatie er is (voorstel: europlafonds en weekvrijgave halveren); geen lancering in het kanaal met de hoogste geschatte fraude |
| Activatie < 60% | Lancering uitgesteld tot de onboarding is aangepast en een nieuw cohort ≥ 60% haalt |
| Kosten boven het plafond | Weekvrijgave verlagen tot onder het plafond; geen nieuwe catalogusitems zonder geboekte dekking |
| Een stopregel uit §8.3 geraakt | Arm B stopt; geen lancering totdat de founder en de onderzoeker het signaal hebben beoordeeld |

### 5.3 Commercieel criterium (businessplan §7, besluit 2)

Vóór 19 januari 2027: ≥ 3 getekende intentieverklaringen van budgethouders met prijs en seats voor semester 2 of studiejaar 2027/'28, en 10–15 vastgelegde budgethoudergesprekken (functie, naam van het budget, omvang, toekenningsmoment). Niet gehaald: "geen aangetoonde betaler", geen draai naar werkgevers, en de voorwaarde voor de tweede tranche is niet vervuld. Dit criterium is geen productmaat; het staat hier zodat alle beslisregels op één plek staan.

## 6. Bedrijfsbesluit na april 2027

Primair: H3 (nawerking). Daarnaast: H1, H2, squadoverleving, K van gebruiker aan gebruiker, de welzijnsmeting, de D30 buiten de tentamenweken (§5.2) en of de intentieverklaringen contracten worden. Drempels en richtingen staan in §4 en §5; een verkennende hypothese draagt geen besluit. Het besluit gaat over de tweede tranche, de native app en de volgende financieringsstap.

## 7. Fraude

### 7.1 Onafhankelijke steekproef

| Onderdeel | Inhoud |
|---|---|
| Steekproef | Elke maandag 30 accounts, willekeurig getrokken uit de accounts met ≥ 1 voltooide sessie in de afgelopen week, gestratificeerd per vereniging (plus een stratum "geen vereniging"), proportioneel naar het aantal actieve accounts, minstens één per stratum met ≥ 5 actieve accounts |
| Trekking | Met de randomisatieseed (§9.2) en het weeknummer, zodat elke steekproef achteraf te reproduceren is |
| Lichte controle | (1) Bevestigd instellingsmailadres of geverifieerd mobiel nummer; (2) nummertype mobiel; (3) sessiepatroon (tijden, duur, claimvertraging, toestel); (4) kort contact per e-mail met de vraag om de squad of de vereniging te bevestigen. Oordeel per account: "geen aanwijzing", "verdacht", "frauduleus", door een mens, met redencode |
| Gevolg voor de student | Een oordeel "verdacht" of "frauduleus" leidt tot een normale beoordeling in de fraudewachtrij met beroep (spec §6.4–6.5); de steekproef zelf boekt niets |
| Schatting | Aandeel "frauduleus" (en apart "frauduleus of verdacht") met 95%-interval, gewogen naar de strata, per week en cumulatief |
| Gevoeligheidsanalyse | Alle KPI's en alle hypotheses ook zonder de accounts die de steekproef als verdacht of frauduleus aanmerkt |
| Wachtrijlast | Aandeel gemarkeerde sessies en doorlooptijd van besluiten, per week; geen go/no-go |

### 7.2 Verplichte steekproef bij prijzen

Bij elke hoofdprijswinnaar en bij elke vereniging die de drempel haalt: een steekproef van 20 meegetelde leden (of allemaal bij minder dan 20), met dezelfde lichte controle. De uitslag is pas definitief na deze steekproef (spec §4.6–4.7).

### 7.3 Red-teamdag (vóór 25 november 2026)

Twee mensen, één dag, op de stagingomgeving met de pilotparameters. Opdracht: tien accounts door de inverdienperiode en één verenigingsweek krijgen met een headless browser (ook met overschreven `navigator.webdriver`), een hotspot en e-mailaliassen (plus-adressen en Gmail-punten). Vastleggen per account: wat lukte, welke heuristiek of controle het zag, hoeveel tijd het kostte. **Uitkomst [in te vullen na de red-teamdag]**, met de wijzigingen die eruit volgen.

### 7.4 Drempels voor campus en mobiel CGNAT

Campus- en CGNAT-adressen worden bij H2, H7 en H10 niet overgeslagen maar met een hogere drempel geteld. **Drempels [in te vullen na de red-teamdag]**, vóór 2 december op de seed vastgelegd (een gesimuleerde UB-NAT met twintig eerlijke studenten mag niet markeren; het red-teamscenario wel).

## 8. Deelnemersbescherming

### 8.1 Geïnformeerde deelname

In de onboarding staat vóór het akkoord een korte uitleg: de pilot vergelijkt twee bonusregels, twee momenten voor de Belofte, een uitnodiging om een squad te vormen en (als de jurist de arm toestaat) een rustperiode zonder nieuwe punten van 19 januari tot en met 31 maart 2027; de toewijzing gebeurt door loting; de doelbonus stopt op 18 januari 2027. Afmelden voor het onderzoek kan altijd in Ik, zonder verlies van punten. Wie zich afmeldt, krijgt vanaf de volgende focusdag arm A, doorlopende punten en het Belofte-aanbod bij de stop van de doelbonus (op 11 januari 2027), en valt vanaf de afmelding buiten de analyse; de afmelding zelf rapporteren we per arm.

### 8.2 Minderjarigen

16- en 17-jarigen: standaard arm A, buiten de rustperiode-arm, live aanwezigheid standaard uit, duels alleen binnen de eigen squad.

### 8.3 Schadesignalen en stopregel

| Code | Signaal (werkhypothese voor "meerdere dagen") | Reactie |
|---|---|---|
| S1 | Sessies gestart tussen 01:00 en 04:00 op ≥ 3 nachten binnen 7 dagen | Zacht bericht met hulpbronnen van de eigen instelling (studentenpsycholoog, studentendecaan); geen sanctie |
| S2 | Meer dan 360 geverifieerde minuten per dag op ≥ 3 dagen binnen 7 dagen | Idem |
| S3 | Na een gebroken squadstreak van ≥ 7 dagen: geen voltooide sessie in de 7 dagen erna, terwijl de student in de 7 dagen ervoor op ≥ 5 dagen een sessie deed | Idem |
| S4 | Supportbericht met het label "welzijn" | Persoonlijk antwoord door een teamlid, met hulpbronnen |

Hoogstens één bericht per signaal per 14 dagen. Signalen worden per arm geteld, zonder dat het bericht van de arm afhangt.

**Stopregel voor arm B.** Eigenaar: de founder, met de statisticus en de onderzoeker; vast te stellen uiterlijk 25 november 2026. **Werkhypothese** (besluit founder, 5 november): arm B stopt (iedereen arm A vanaf de volgende maandag) als de wekelijkse welzijnsscore (stress en ervaren druk) twee weken achter elkaar minstens een halve standaarddeviatie slechter is dan in arm A, of als het aandeel schadesignalen in arm B meer dan twee keer dat van arm A is (lezing productteam: het aandeel gebruikers met ≥ 1 signaal S1–S4 per week). Toetsmoment: elke maandag vanaf week 2, met een correctie voor herhaald kijken **[methode in te vullen door de statisticus, uiterlijk 25 november]**. Let op: de welzijnsmeting in §8.4 is niet wekelijks (instroom, 18–24 januari, 25–31 januari). Voor het welzijnscriterium is dus een korte wekelijkse meting nodig, of de grens moet op de meetmomenten worden toegepast; besluit van de eigenaar, uiterlijk 25 november (open punt 6).

### 8.4 Vragenlijsten

Kort, overslaanbaar, zonder punten of andere beloning (zodat beantwoorden niet van de arm afhangt). Het welzijnsinstrument kiest een onderzoeker **[in te vullen: instrument en items]**. Grondslag voorlopig gerechtvaardigd belang; de welzijnsitems kunnen gezondheidsgegevens zijn (art. 9 AVG) en staan daarom achter een aparte toestemmingsvraag (besluit founder, 5 november; definitief na vraag advocaat 9). Wie geen toestemming geeft, krijgt de overige items. In de welzijnsanalyse en in het welzijnscriterium van §8.3 telt hij als ontbrekend; het aandeel weigeraars rapporteren we per arm (voorstel productteam).

| Moment | Inhoud |
|---|---|
| Instroom (na het akkoord) | Welzijn 1 (stress, slaap, ervaren squaddruk, intrinsieke motivatie); zelfgerapporteerde studietijd en telefoonafleiding ("vóór"); gebruik nu of eerder van Forest of Opal, en zo ja waarom Rewarded ernaast of in plaats daarvan |
| Pilotreflectie, 18–24 januari | Welzijn 2; "Hoe voelde de bonusregel?" (per arm geanalyseerd) |
| Eind januari, 25–31 januari | Welzijn 3; studietijd en telefoonafleiding ("na") |
| Belofte-reflectie | Naleving, verlengen of stoppen; 18+: interesse in een inzet voor een goed doel (H-C, signaal) |
| Na het aprilvenster | Studietijd en telefoonafleiding (tweede "na"); vraag naar geaggregeerde studievoortgang loopt via verenigingen en instellingen, niet via de student |

### 8.5 Overige ontwerpmaatregelen (geen meting, wel vastgelegd)

Tentamendag die het dagdoel zonder joker opschort; puntenplafond van 300 minuten per dag (dagdoel maximaal 120); sessies na 01:00 tellen, maar zonder doelbonus en met een rustig signaal; geen marketing die op sociale schaamte speelt; lichte ethische toets via een partneruniversiteit **[status in te vullen]**.

## 9. Toewijzing en randomisatie

### 9.1 Factoren

| Factor | Armen | Eenheid | Strata (blokken van 4) | Uitzonderingen |
|---|---|---|---|---|
| Doelbonus | A / B | Squad bij aanmaken; solo bij registratie | Vereniging × instroomkanaal | 16- en 17-jarigen altijd A |
| Belofte | Vroeg / laat | Idem | Idem | — |
| Rustperiode | Rust / doorlopend | Idem | Idem | 16- en 17-jarigen altijd doorlopend; vervalt zonder oordeel van de jurist |
| Squadprompt | Sterk / standaard | Solo-gebruiker bij registratie | Instroomkanaal | Alleen solo |

Elke factor wordt onafhankelijk geloot. Wie later bij een squad komt, neemt de bonus- en rustperiode-arm van de squad over vanaf de eerstvolgende maandag, en de Belofte-arm alleen als het eigen aanbod nog niet getoond is (`arm_switched`). De analyse gebruikt de eerst toegewezen arm.

### 9.2 Seedprocedure

1. Vóór 2 december genereert de founder een seed van 32 willekeurige bytes op een apart toestel, in het bijzijn van een tweede persoon.
2. De SHA-256-hash van de seed komt in deze voorregistratie: **[in te vullen]**. De seed zelf gaat in de geheimenmap van de server (architectuur §10.9), niet in de repository.
3. De toewijzing is deterministisch: `arm = f(HMAC-SHA256(seed, factor ‖ stratum ‖ bloknummer))`, met een willekeurige permutatie van twee A's en twee B's per blok. Dezelfde seed geeft dezelfde toewijzing; de A/A-controle draait met een andere testseed.
4. Na het bedrijfsbesluit publiceren we de seed, zodat een derde de toewijzing kan narekenen.

### 9.3 A/A-controle

Vóór 2 december draait een gesimuleerd cohort (werkhypothese: 800 fictieve gebruikers, verdeeld over squads, solo's, verenigingen, kanalen en leeftijdsklassen) door toewijzing, armwissels, vakantiepauze, tentamendagen en alle KPI-query's. Controle: de verdeling over armen per stratum, geen 16- of 17-jarige in arm B of de rustperiode, armwissels gelogd, en geen significant verschil tussen armen op een maat waar per constructie geen verschil kan zijn. **Uitkomst [in te vullen]**.

## 10. Rapportage

- Alle uitkomsten per instroomkanaal (vereniging, squaduitnodiging, ambassadeur, wachtlijst, overig) en per vereniging; minstens één vereniging waarvan het bestuur niet zelf om de challenge vroeg, als referentie.
- Retentie altijd op kalendertijd naast relatieve dagen.
- K alleen uit uitnodigingen van gebruiker aan gebruiker (squad, duel, persoonlijke link), zonder wachtlijst, verenigingscode, ambassadeurscode of kaart.
- Squadoverleving: aandeel squads met ≥ 2 actieve leden in week 4 en week 8 na aanmaken.
- Wie de modus zonder punten kiest, en hun retentie.
- Teamaccounts tellen nergens mee; afgekeurde sessies ook niet.
- De analyse draait iemand die niet verantwoordelijk is voor het slagen van de pilot **[in te vullen: wie]**.

## 11. Open punten vóór vastlegging

1. **Einde van de rustperiode en de aprilchallenge.** Besloten (founder, 5 november): de rustperiode loopt van 19 januari tot en met 31 maart 2027; vanaf 1 april verdient iedereen weer punten. De aprilmeting is de tentamenperiode per instelling, met de challenge voor iedereen. De maat "terugkeer zonder nieuwe challenge" vervalt; in de plaats komt terugkeer in 25–31 maart (H3, secundair).
2. **Rustperiode-arm en de vraag aan de advocaat (JS2).** Besloten (founder, 5 november): de eis uit JS2 geldt voor de bonusarmen A en B. De rustperiode is een vooraf aangekondigde onderzoeksconditie met opt-out zonder verlies van punten. De advocaat beoordeelt of er een kanselement of oneerlijke handelspraktijk in zit (vraag 3b); bij een negatief oordeel vervalt de arm.
3. **D30 buiten de tentamenweken.** Besloten (founder, 5 november): gemeten in 1–14 februari; onder 6% geen tweede tranche en geen opschaling (§5.2). Het lanceringsbesluit hangt alleen aan D7.
4. **Drempel D7 per kanaal.** Afleiden uit de standaardflow van H1, of een vooraf vastgelegde ondergrens per kanaal; besluit vóór 2 december.
5. **Instroom op 18 januari.** De experimentpopulatie loopt tot en met 17 januari, lanceringsgebruikers registreren vanaf 19 januari, en de founder noemt de onderzoeksperiode "voor wie vóór 19 januari instroomde". Wie op 18 januari registreert, valt nu in geen van beide groepen. Besluit founder vóór 2 december.
6. **Wekelijkse welzijnsscore.** De werkhypothese voor de stopregel van arm B (§8.3) gaat uit van een wekelijkse welzijnsscore, die het meetplan (§8.4) niet heeft. Besluit eigenaar (founder met statisticus en onderzoeker) uiterlijk 25 november.

## Wijzigingslog

**Ronde 1 — 5 november 2026.** Eerste concept, opgesteld door het productteam volgens `docs/pitch/ronde-1-founder-reactie.md` (M4, G1–G4, GS2, GS3, GS7, GS8, GS10, GS11, J1, J2, S10). Bevat per hypothese primaire maat, analyse-eenheid, MDE (in te vullen), beslisregel en stopregel; go/no-go-cohort; kalender; fraudesteekproef; seedprocedure en A/A-controle.

**Ronde 1, eindredactie — 5 november 2026.** Bijgewerkt volgens de aanvulling van de founder na de samenhangcontrole (`docs/pitch/ronde-1-founder-reactie.md`, 5 november).

- Lanceringsbesluit op 19 januari 2027, op data tot en met 18 januari 04:00 (§1, §3, §5).
- D30 buiten de tentamenweken gemeten in 1–14 februari (was voorstel 18–31 januari); onder 6% geen tweede tranche en geen opschaling (§2, §5.2; M4, G3). Open punt 3 gesloten.
- Kostenplafond €0,06 per wekelijks actieve gebruiker per week, afgeleid uit €0,25 per MAU per maand (§5.1; M2, M4); nieuwe werkhypothese, gemarkeerd als aanname.
- Belofte-aanbod in de vroege arm op 11 januari 2027 voor iedereen; rustperiode van 19 januari tot en met 31 maart 2027, iedereen weer punten vanaf 1 april, aprilchallenge voor iedereen; secundaire maat terugkeer in 25–31 maart (§3, §4 H3; G1). Open punten 1 en 2 gesloten.
- H4 kreeg een formulering voor de pitch; H3-zin verduidelijkt ("bij de aankondiging van de stop") (G2).
- Stopregel arm B: eigenaar, termijn en werkhypothese van de founder ingevuld; toetsmethode nog in te vullen (§8.3; G4).
- Welzijnsitems achter een aparte toestemmingsvraag, weigeraars als ontbrekend en per arm gerapporteerd (§8.4; J5).
- Afmelders: vanaf de volgende focusdag, met het vroege Belofte-aanbod (§8.1).
- Nieuwe open punten 5 (instroom op 18 januari) en 6 (wekelijkse welzijnsscore).
