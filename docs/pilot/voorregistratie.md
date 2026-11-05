# Rewarded — Voorregistratie gesloten pilot 2026/'27 (concept, ronde 2)

*Concept van het productteam, 5 november 2026, herzien na pitchronde 2. Vast te leggen door de founder vóór 2 december 2026; na vastlegging wijzigt niets meer zonder een gedateerde, gemotiveerde wijzigingsregel onderaan (en dan rapporteren we beide versies). Bindend kader: de besluiten van de founder na pitchronde 2 (`docs/pitch/ronde-2-founder-reactie.md`), die voorgaan op die na pitchronde 1 (`docs/pitch/ronde-1-founder-reactie.md`), het businessplan (`docs/01-businessplan.md` §7 en §10) en het productplan (`docs/02-productplan.md` §8). Regels en parameters: `docs/research/05-productspecificatie.md` (verder: spec); techniek: `docs/research/07-architectuur.md` (verder: architectuur). Bij verschil tussen dit document en een ander document over maten, drempels en beslisregels geldt dit document; de voorwaarden voor de tweede tranche staan hier in dezelfde getallen als in het businessplan.*

*Markering. **[in te vullen]** betekent dat een getal of naam pas na de poweranalyse, de red-teamdag, de prijslijst of een bevestiging van een instelling of vereniging bekend is; we vullen het in vóór 2 december, tenzij er een andere datum staat. **Werkhypothese** is een voorstel van de founder, het productteam of het strategieteam dat de founder hier bevestigt of verandert; waar het een voorstel van het productteam is, staat dat erbij. **Aanname** is iets wat we niet weten. Er staat geen getal in dat niet uit een bron, een besluit van de founder of een benoemde werkhypothese komt.*

---

## 1. Wat deze pilot is, en wat niet

Dit is een **verkennende pilot met één redelijk gepowerde vergelijking**: de doelbonus in arm A (gewone bijschrijving) tegenover arm B (slinkend weekbudget), gemeten als gehaalde dagdoelen tijdens het seizoen. Daarnaast meten we voorgeregistreerd, maar verkennend, de nawerking in de tentamenperiode van april 2027 (Belofte vroeg tegenover laat, en een rustperiode-arm die tot en met het aprilvenster loopt) en het squadeffect via een encouragement design.

Alle data van de pilot volgen een **kalenderregel per instelling** (§3), niet één datum voor iedereen (besluit 1 na ronde 2). De tentamenperiodes van de pilotinstellingen verschillen; een vaste datum zou per stad iets anders meten.

Twee besluiten hangen aan deze pilot, op verschillende momenten:

| Besluit | Wanneer | Waarop |
|---|---|---|
| **Lanceringsbesluit** (operationeel) | Na de laatste tentamenweek van het laatst eindigende pilotcohort (§3.2); werkhypothese: niet vóór 8 februari 2027 als de zoekresultaten voor Utrecht kloppen (**aanname**) | Activatie, fraude, kosten binnen het pilottotaal, D7 van het go/no-go-cohort, deelnemersbescherming en schadegrens (§5). Daarna volgt een gecontroleerde uitbreiding op uitnodiging, geen open lancering (besluit 2 na ronde 2) |
| **Bedrijfsbesluit** (tweede tranche, omvang, native app) | Na het aprilvenster van alle pilotinstellingen (werkhypothese: mei 2027) | De bindende voorwaarden (a)–(f) in getallen (§6.1), de stopregels, en de verkennende uitkomsten (§6.2) |

Het lanceringsbesluit hangt **niet** af van de nawerkingshypothese. **H2 draagt geen bedrijfsbesluit**: het bedrijfsbesluit rust op de bindende voorwaarden, de stopregels en de verkennende uitkomsten (besluit founder, G-S10). Zo staat het ook in de pitch, het businessplan en het productplan.

Een hypothese waarvan het kleinste detecteerbare effect (MDE) volgens de poweranalyse groter is dan plausibel, heet **verkennend**: we rapporteren effect en betrouwbaarheidsinterval, en er hangt geen besluit aan, behalve waar §6.1 dat expliciet vastlegt (voorwaarde f). De poweranalyse bepaalt hoe we een uitkomst lezen, niet of we randomiseren. De pitch gebruikt letterlijk de formuleringen uit §4.

## 2. Populaties en cohorten

| Groep | Definitie | Gebruikt voor |
|---|---|---|
| Experimentpopulatie | Accounts die zich in de gesloten pilot registreren vanaf 2 december 2026 tot en met de laatste focusdag van het doelbonusseizoen van hun eigen kalender (§3.1), niet `is_team` en niet afgemeld voor het onderzoek (§8.1) | Alle experimentele vergelijkingen |
| **Go/no-go-cohort** | Experimentpopulatie met registratie op 2 tot en met 13 december 2026 | D7 en D30 in het lanceringsbesluit, de stopregels en voorwaarde (e) |
| Late instromers | Experimentpopulatie met registratie vanaf 14 december | ITT-analyse, apart gerapporteerd |
| **Januari-actieven** | Experimentpopulatie met ≥ 2 sessiedagen in de laatste tentamenweek van de eigen kalender (focusdagen T − 6 tot en met T, §3.1) | Voorwaarden (c) en (d), H3 secundair |
| **Uitbreidingscohort** | Wie zich registreert ná de laatste tentamenweek van de eigen kalender, en iedereen die via de gecontroleerde uitbreiding binnenkomt (besluit founder, G-S14) | Niet in de experimenten; alleen de operationele maten van de uitbreiding. Wie bij een squad in de rustperiode-arm komt, volgt de squadregel en verdient tot na het aprilvenster van die squad geen punten (§4, H3b); dat ziet hij vóór het aansluiten |
| 16- en 17-jarigen | `age_band = 16_17` op de dag van toewijzing | Altijd arm A en buiten de rustperiode-arm; wel in de Belofte- en encouragement-factor; buiten de analyse van doelbonus en rustperiode |

Daarmee is het oude open punt "registratie op 18 januari" gesloten: er is geen dag meer zonder regel. Wie op de dag na zijn laatste tentamenweek registreert, hoort bij het uitbreidingscohort.

**Kalender van het go/no-go-cohort.** Dag 0 is de registratiedag. De vakantiepauze is 21 december 2026 – 3 januari 2027 (werkhypothese, spec §5).

| Registratie | D7 (kalender) | D30 (kalender) |
|---|---|---|
| 2 december | 9 december | 1 januari (vakantiepauze) |
| 6 december | 13 december | 5 januari |
| 9 december | 16 december | 8 januari |
| 13 december | 20 december | 12 januari |

Gevolg dat we hier vastleggen: **D7 van het hele go/no-go-cohort valt vóór de vakantiepauze** en is lang vóór het lanceringsbesluit bekend. D30 op kalendertijd valt voor dit cohort in de vakantiepauze of in de blok- en tentamenweken en meet daar vooral de tentamenkalender. We rapporteren D30 daarom altijd op kalendertijd én met overgeslagen vakantiedagen, en gebruiken voor de stopregel de D30 **buiten de tentamenweken**, gemeten in het na-seizoensvenster van de eigen instelling (§3.1), dat voor het hele cohort na dag 30 ligt.

## 3. Kalender van de pilot

### 3.1 De kalenderregel per instelling

Het systeem krijgt per vereniging een tentamenkalender als parameter (architectuur §3.4, `exam_calendar`). Een squad volgt de kalender van haar vereniging (zonder vereniging: die van de maker); een solo-gebruiker die van zijn eigen vereniging. Een solo-gebruiker zonder vereniging volgt de kalender van de instelling van zijn bevestigde instellingsmail, en anders de laatst eindigende pilotkalender (voorstel productteam). Zo ziet iedereen in een squad dezelfde data, en valt de kalender samen met de toewijzingseenheid.

Per kalender liggen vier data vast, bevestigd op de primaire pagina's van de instelling (ook per faculteit waar die verschillen) en schriftelijk door de vereniging:

| Symbool | Betekenis |
|---|---|
| **T** | De zondag waarmee de laatste reguliere tentamenweek (maandag tot en met zondag) van de tentamenperiode in januari of februari 2027 eindigt; zo is de bonusstop om 04:00 op T + 1 altijd een maandag en valt ze samen met het einde van de prijsperiode (§3.4) |
| **N** | Na-seizoensvenster: de eerste twee volle weken (maandag tot en met zondag) na T waarin de instelling geen tentamens of herkansingen van die periode heeft (voorstel productteam voor "na de herkansingen") |
| **A** | Aprilvenster: de tentamenperiode in het voorjaar van 2027 (verder: april), van de eerste tot en met de laatste tentamendag; A-start en A-einde |
| **Tussenperiode** | Weken tussen het einde van N en A-start |

Daaruit volgt de regel (besluit founder, besluit 1 na ronde 2, uitgewerkt door het productteam):

| Moment | Regel |
|---|---|
| Doelbonusseizoen | Focusdagen 2 december 2026 tot en met T, zonder de vakantiepauze |
| Aankondiging stop doelbonus, Belofte-aanbod vroege arm, bekendmaking rustperiode-groep | Focusdag T − 6, zeven dagen vóór de bonusstop |
| Bonusstop | 04:00 op focusdag T + 1 |
| Rustperiode (rustperiode-arm) | Focusdagen T + 1 tot en met A-einde: geen nieuwe punten; vanaf A-einde + 1 verdient iedereen weer punten |
| Pilotreflectie en welzijnsmeting 2 | Focusdagen T + 1 tot en met T + 7 |
| D30 buiten de tentamenweken, secundaire na-seizoensmaten, welzijnsmeting 3 | N |
| Aprilchallenge en primaire nawerkingsmeting | A, voor beide rustperiode-armen gelijk |
| Belofte-aanbod late arm | Focusdag A-einde + 1 |

### 3.2 De pilotkalenders

**[In te vullen per instelling, bevestigd uiterlijk 18 november 2026 door de founder.]** We kiezen pilotverenigingen waarvan de kalender bij de regel past, en zeggen hier expliciet welke kalenders de pilot dekt (besluit founder, G1). Een vereniging zonder bevestigde kalender doet niet mee.

| Instelling (faculteit) | T | N | A | Venster (c) (§6.1) | Bron (primaire pagina, datum gecontroleerd) | Verenigingen |
|---|---|---|---|---|---|---|
| Universiteit Utrecht **[faculteit in te vullen]** | [in te vullen] | [in te vullen] | [in te vullen] | [1–14 februari of N] | [in te vullen] | [in te vullen] |
| Rijksuniversiteit Groningen **[faculteit in te vullen]** | [in te vullen] | [in te vullen] | [in te vullen] | [1–14 februari of N] | [in te vullen] | [in te vullen] |
| [hbo-instelling, in te vullen] | [in te vullen] | [in te vullen] | [in te vullen] | [1–14 februari of N] | [in te vullen] | [in te vullen] |

Aanleiding, geen bron: volgens zoekresultaten van de gedragswetenschapper (pagina's niet geopend) loopt periode 2 van de Universiteit Utrecht van 16 november 2026 tot en met 7 februari 2027, met data die per faculteit verschillen, en begint de tentamenperiode van een faculteit van de Rijksuniversiteit Groningen op maandag 18 januari 2027. Kloppen die, dan ligt T voor Utrecht rond 7 februari en voor Groningen eind januari, en valt het lanceringsbesluit niet vóór 8 februari (**aanname**).

### 3.3 Vaste data en termijnen

| Datum | Wat |
|---|---|
| Deze week (vanaf 4 november 2026) | Vragen 2 en 3 naar de advocaat ("direct"), inclusief de rustperiode tot en met het aprilvenster en het mogelijke samenvallen met tentamenweken (founder J7, G-S8) |
| Uiterlijk 18 november 2026 | Tentamenkalenders van de pilotinstellingen bevestigd op de primaire pagina's (founder) |
| Vóór 25 november 2026 | Poweranalyse en schatting van het aantal solo-gebruikers (statisticus); correctiemethode voor herhaald kijken en drempel voor differentiële uitstap (statisticus); red-teamdag (§7.4); oordeel advocaat over arm B en de rustperiode-arm; toesteltest; stopregel arm B, minimum-n en welzijnsgrens vastgesteld (§8.3; founder met statisticus en onderzoeker); prijslijst en vrijgaveschema (§5.4); gesprek met Hold, uitkomst vastgelegd (§11) |
| Vóór 1 december 2026 | DPIA ondertekend; pilotbeheerder geworven (businessplan §10) |
| Vóór 2 december 2026 | Toewijzings- en grootboekcode bevroren en onafhankelijk gereviewd; A/A-controle op de bevroren code en de echte KPI-query's (§9.3); randomisatieseed vastgelegd (§9.2); hogere drempels voor campus en CGNAT en drempels van H12 op de seed (§7.5); deze voorregistratie vastgelegd |
| 2 december 2026 | Start gesloten pilot (R1); start doelbonus; start registratievenster go/no-go-cohort |
| 13 december 2026 | Einde registratievenster go/no-go-cohort |
| 21 december 2026 – 3 januari 2027 | Vakantiepauze (doelbonus, streaks, Belofte-dagen en pauzetellers bevroren) |
| Vóór 19 januari 2027 | Commercieel criterium (§5.3) |
| Per kalender, volgens §3.1 | Prijsperiode Blokk-challenge (§3.4), Belofte-aanbod, bonusstop, rustperiode, reflectie, N, A |
| Dag na T van de laatst eindigende kalender | Lanceringsbesluit (§5) |
| Vóór 1 mei 2027 | Voorwaarde (a): minstens één getekende opdracht (§6.1) |
| Na A van alle kalenders (werkhypothese: mei 2027) | Bedrijfsbesluit (§6) |
| Uiterlijk 15 juni 2027 | Ruwe events samengevat (spec §4.10, DPIA) |

### 3.4 Prijsperiode van de Blokk-challenge

De prijsperiode van een vereniging is de twee focusweken die eindigen op T van haar kalender; de score is het gemiddelde van de twee weken (voorstel productteam; was 4–17 januari voor iedereen). Verenigingen in één poule worden bij voorkeur ingedeeld op dezelfde kalender; lukt dat niet, dan vergelijkt de ranglijst scores over elk eigen venster, en dat staat vooraf in de challengevoorwaarden (open punt 3). Het aanloopklassement zonder prijs loopt tot de vakantiepauze, voor iedereen gelijk.

## 4. Hypotheses

Per hypothese: één primaire maat, de analyse-eenheid, het kleinste detecteerbare effect en de beslisregel. De MDE's vult de statisticus in na de poweranalyse op 300–800 gebruikers (aantal uit rapport 03 §5; **aanname** tot de wachtlijst het bevestigt).

### H1 — Squadeffect (encouragement design)

| Onderdeel | Inhoud |
|---|---|
| Formulering voor de pitch | "Solo-gebruikers die een sterke uitnodiging krijgen om een squad te vormen, vormen vaker een squad en zijn vaker op dag 7 actief." |
| Toewijzing | Solo-gebruikers (registratie zonder squad- of duellink en op dag 0 niet in een squad) op dag 0 geloot 50/50: **sterke squadprompt** (op dag 1, 2 en 3 een prominente kaart "Focus samen" met een kant-en-klare WhatsApp-link en voorgestelde tekst) of **standaardflow** (de gewone ingang naar een squad) |
| Primaire maat | D7: aandeel met ≥ 1 goedgekeurde, voltooide sessie van ≥ 25 minuten op dag 7, op toewijzing |
| Hoofdresultaat | **ITT**-schatting op D7 (besluit founder, G-S1) |
| IV | Effect van squadlidmaatschap (lid op dag 7 van een actieve squad, ≥ 3 actieve leden), met de toewijzing als instrument, gerapporteerd als **bovengrens**: de kaart kan D7 ook direct verhogen als herinnering, wat de exclusierestrictie schendt |
| Verwachte omvang | Vooraf geschat aantal solo-gebruikers **[in te vullen door de statisticus, vóór 25 november]**. Ligt dat zo laag dat geen plausibel effect detecteerbaar is (de gedragswetenschapper noemt 100–200 als zone), dan is H1 beschrijvend |
| Analyse-eenheid | Solo-gebruiker |
| Verdere analyse | Binnen-persoonsanalyse van sessiedagen in de 7 dagen vóór en na het actief worden van de eigen squad, met de tentamenkalender als covariaat |
| Secundair | W3 (≥ 2 sessiedagen in dag 15–21, vakantiedagen overgeslagen), squadoverleving, K van gebruiker aan gebruiker |
| MDE | **[in te vullen na de poweranalyse]** |
| Beslisregel | ITT-effect op D7 met het 95%-interval boven nul: "de squadprompt verhoogt retentie", input voor het bedrijfsbesluit. Interval rond nul: "de sociale loop is niet aangetoond; de productloop gaat voor groei" (businessplan §12). MDE groter dan plausibel: verkennend, geen besluit |
| Wat géén go/no-go is | De ruwe vergelijking squad tegenover solo; die rapporteren we beschrijvend, ze meet vooral zelfselectie |

### H2 — Meer gehaalde dagdoelen tijdens het seizoen (doelbonus A tegenover B)

Dit is de ene redelijk gepowerde vergelijking. Ze draagt geen bedrijfsbesluit.

| Onderdeel | Inhoud |
|---|---|
| Formulering voor de pitch | "Meer gehaalde dagdoelen tijdens het seizoen met een slinkend weekbudget (arm B) dan met gewone bijschrijving (arm A)." We claimen daarmee geen betere retentie. |
| Toewijzing | Per squad bij aanmaken, solo per persoon bij registratie; 16- en 17-jarigen altijd arm A |
| Primaire maat | Aandeel gebruikersdagen met een gehaald dagdoel (`goal_met_final`) tijdens het doelbonusseizoen van de eigen kalender (§3.1), per gebruiker vanaf de registratiedag; tentamendagen (spec §3.13) tellen als niet-gehaald en worden in een gevoeligheidsanalyse weggelaten |
| Analyse-eenheid | Toewijzingseenheid (squad of solo); standaardfouten geclusterd op die eenheid |
| Analyse | ITT op de eerst toegewezen arm; kalender als stratum; wisselaars apart en als gevoeligheidsanalyse zonder hen; 16- en 17-jarigen buiten de analyse |
| Secundair | Focusminuten per week, D7, sessiedagen per week, reflectievraag "hoe voelde de bonusregel" per arm (§8.4), wekelijkse welzijnsitems per arm |
| MDE | **[in te vullen na de poweranalyse]** |
| Beslisregel | Arm B significant hoger: arm B wordt de standaardregel voor een volgend seizoen, mits geen stopregel voor deelnemersbescherming geraakt is (§8.3). Geen verschil of arm A hoger: arm A blijft standaard. De uitkomst draagt het lanceringsbesluit en het bedrijfsbesluit niet |

### H3 — Nawerking na het einde van de doelbonus (verkennend)

| Onderdeel | Inhoud |
|---|---|
| Formulering voor de pitch | "Na het einde van de doelbonus focussen studenten in de volgende tentamenperiode vaker als ze bij de aankondiging van de stop van de bonus een Belofte aangeboden kregen (H3a), en als ze tot en met die tentamenperiode punten bleven verdienen of juist niet (H3b, zie richting)." H3 is verkennend tot de poweranalyse anders laat zien. |
| H3a: factor Belofte | **Vroeg**: aanbod op focusdag T − 6 van de eigen kalender, zeven dagen vóór de bonusstop. **Laat**: aanbod op A-einde + 1. Bij de reflectie na 14 dagen krijgt de vroege arm één vooraf vastgelegd **hernieuwingsaanbod** voor nog eens 14 dagen (besluit founder, G-S4). De Belofte raakt geen punten |
| H3b: factor rustperiode | **Rustperiode**: van T + 1 tot en met A-einde verdient de eenheid geen nieuwe punten; daarna verdient iedereen weer (besluit 3 na ronde 2). **Doorlopend**: de eenheid verdient punten volgens de vaste ratio, met dezelfde puntwaarde en hetzelfde vrijgaveschema tot en met A (§5.4). Verdiende punten blijven in beide armen inwisselbaar. De **aprilchallenge is voor beide armen gelijk**: collectieve prijzen op deelnamegraad, geen punten. Van T + 1 tot en met A-einde zijn er voor het onderzoekscohort in geen van beide armen individuele prestatiechallenges met een prijs, zodat het contrast beperkt blijft tot individuele punten (challengevoorwaarden B7; **voorstel**, ter bevestiging door de founder, open punt 13). Alleen als de advocaat de arm toestaat (vraag 3); anders vervalt H3b en verdient iedereen doorlopend |
| Uitweg | Het rustperiodebericht noemt in dezelfde zin hoe je uit de rustperiode stapt en dat je dan weer punten verdient (founder J2). **Uit de rustperiode stappen** is een aparte keuze: vanaf de volgende focusdag weer punten, de gebruiker blijft in het onderzoek en in de analyse op toewijzing. **Uit het onderzoek stappen** blijft daarnaast bestaan (§8.1) |
| Lekken gedicht | Uitbreidingscohort in een rustsquad volgt de squadregel (§2); samenvoegen kan alleen binnen dezelfde rustperiode-arm (spec §4.4); afmelders tellen in ITT op hun eerst toegewezen arm |
| Richting H3b | Tweezijdig. "Beloning als steiger" voorspelt dat de rustperiode-arm in A niet slechter scoort; een verdringingseffect zou hem beter laten scoren, een afhankelijkheid van de beloning slechter |
| Toewijzing | Beide factoren per squad of solo, onafhankelijk geloot; 16- en 17-jarigen buiten de rustperiode-arm |
| Primaire maat | **Binair**: aandeel met ≥ 1 sessiedag in A (sessiedag: ≥ 1 goedgekeurde, voltooide sessie van ≥ 25 minuten), met instroomactiviteit (sessiedagen in de eerste 7 dagen na registratie) als covariaat (besluit founder, G-S9) |
| Analyse-eenheid | Toewijzingseenheid (squad of solo); geclusterd; kalender als stratum |
| Analyse | ITT tussen armen, niet vóór tegenover na |
| Secundair | (1) Sessiedagen per week in A; (2) aandeel januari-actieven met ≥ 2 sessiedagen per week in N; (3) sessiedagen per week in de tussenperiode; (4) terugkeer in de week vóór A-start (aandeel met ≥ 1 sessiedag in die week onder wie in de 21 dagen daarvoor geen sessie had); (5) Belofte-overname, -naleving en -hernieuwing, ook naar squadstatus, en de **dosis** per gebruiker (dagen onder een lopende Belofte); (6) welzijn en zelfrapportage (§8.4); (7) **uitstap per arm** als uitkomst: uit de rustperiode stappen en uit het onderzoek stappen, apart en samen (besluit 3) |
| Verkennend, vooraf vastgelegd | De **interactie** tussen Belofte vroeg en rustperiode (de cel die het meest op Royer e.a. 2015 lijkt), alleen als verkennende analyse; ze wordt niet achteraf als vondst gepresenteerd (besluit founder, G-S5) |
| Differentiële uitstap | Is het verschil in uitstap tussen de rustperiode-arm (rustuitstap plus afmelding) en de doorlopende arm (afmelding) groter dan **[in te vullen door de statisticus, vóór 25 november; werkhypothese productteam: 15 procentpunt]**, dan is H3b niet te interpreteren en rapporteren we alleen beschrijvend. Gevoeligheidsanalyse met uitstappers als "niet actief" (founder J2) |
| MDE | **[in te vullen na de poweranalyse]** |
| Beslisregel | Verkennend tenzij de MDE plausibel is. Een effect in de vroege Belofte-arm of de rustperiode-arm met het interval boven nul is input voor het bedrijfsbesluit ("gemeten nawerking", businessplan §4). **Een nulresultaat op H3** (geen detecteerbaar verschil in A, §6.1 voorwaarde f) beperkt tranche 2 en stelt de native bouw uit; de verdediging rust dan alleen op het verenigingskanaal en de rivaliteit, en dat zeggen we tegen investeerders en klanten (businessplan §12) |

### H4 — Fraude blijft beheersbaar (operationeel)

Formulering voor de pitch: "Het geschatte aandeel frauduleuze accounts uit de onafhankelijke steekproef blijft onder 5%, ook aan de bovenkant van het betrouwbaarheidsinterval." Primaire maat: het geschatte aandeel frauduleuze accounts uit de onafhankelijke steekproef (§7.1), met 95%-interval. Beslisregel op de **bovengrens** van dat interval (§5.1; founder J4). Het aandeel gemarkeerde sessies is een maat voor de wachtrijlast, geen go/no-go. De schatting rapporteren we als ondergrens van de werkelijke fraude, naast de uitkomst van de red-teamdag: ze ziet alleen wat de lichte controle kan zien.

## 5. Lanceringsbesluit (na de laatste tentamenweek van het laatst eindigende pilotcohort)

### 5.1 Maten en drempels

| Maat | Definitie | Drempel |
|---|---|---|
| Activatie | Accounts met een goedgekeurde sessie van ≥ 25 minuten binnen 24 uur na registratie, gedeeld door alle registraties (experimentpopulatie); de oefensessie telt niet | ≥ 60% |
| D7 go/no-go-cohort | Aandeel van het go/no-go-cohort met ≥ 1 goedgekeurde sessie op dag 7 | **≥ 25%, vaste lat** (besluit founder, MF1e, G-S2). De encouragement-vergelijking per kanaal (D7 van de standaardflow) rapporteren we, als drempel gebruiken we haar niet |
| Geschatte fraude | Onafhankelijke steekproef (§7.1), cumulatief tot en met het lanceringsbesluit | **Bovengrens van het 95%-interval < 5%** |
| Kosten | Kosten van verzilveringen, verdiende prijzen en verenigingsprijzen van de gesloten pilot, tegen de post | **Binnen het pilottotaal van €1.500** (werkhypothese; besluit founder, G3). De weekmaat geldt in de pilot niet (§5.4) |
| Deelnemersbescherming | Geen stopregel uit §8.3 geraakt | Geen |
| Absolute schadegrens | Per week: gebruikers met ≥ 1 schadesignaal S1–S4, gedeeld door gebruikers met ≥ 1 goedgekeurde sessie in die week, over beide armen | **< 2% in elke pilotweek** (werkhypothese founder, G-S7) |

### 5.2 Stopregels en besluit per uitkomst

| Uitkomst | Besluit |
|---|---|
| D7 go/no-go-cohort < 15% | **Stopregel:** geen uitbreiding en geen tweede tranche |
| D7 tussen 15% en 25% | **Hoogstens één herhaling**: de productloop wordt gerepareerd en een nieuw cohort (registratievenster van 12 dagen, uitnodiging via de wachtlijst in de pilotsteden) wordt gemeten met dezelfde definities; de herhaling valt buiten de experimenten (voorstel productteam). Haalt de herhaling geen 25%, dan geldt de stopregel. Geen tweede herhaling |
| Bovengrens geschatte fraude ≥ 5% | Geen uitbreiding in het kanaal met de hoogste geschatte fraude; de beloningen in de gratis laag van de **uitbreiding** omlaag tot native verificatie er is (voorstel: europlafonds en vrijgave voor nieuwe gebruikers halveren). Het vrijgaveschema van het onderzoekscohort blijft vast |
| Activatie < 60% | Uitbreiding uitgesteld tot de onboarding is aangepast en een nieuw cohort ≥ 60% haalt |
| Kosten boven het pilottotaal | Geen nieuwe catalogusitems zonder geboekte dekking; de prijzen van een volgende challenge omlaag. **"Weekvrijgave verlagen" is tijdens het experiment geen toegestaan besluit**: het zou de behandeling midden in de meting veranderen (besluit founder, G3) |
| Een stopregel uit §8.3 geraakt | Arm B stopt; geen uitbreiding totdat de founder en de onderzoeker het signaal hebben beoordeeld |
| Schadegrens ≥ 2% in een week | Geen uitbreiding vóór beoordeling door de onderzoeker; de grens geldt ook tijdens de uitbreiding |

### 5.3 Commercieel criterium (businessplan §7, besluit 2 na ronde 1, MF1b)

Vóór 19 januari 2027: ≥ 3 getekende intentieverklaringen van budgethouders, die elk een prijs van minstens €8 per seat per tentamenperiode (of €24 per seat per jaar) en minstens 150 seats noemen, met minstens één betaler die niet afhangt van een aandringend bestuur; en 10–15 budgethoudergesprekken vastgelegd volgens de gespreksleidraad van het businessplan §7, elk met het **toekenningsmoment** van het budget (een gesprek zonder toekenningsmoment telt niet). Niet gehaald: "geen aangetoonde betaler", geen draai naar werkgevers, en voorwaarde (b) voor de tweede tranche is niet vervuld. Dit criterium is geen productmaat; het staat hier zodat alle beslisregels op één plek staan.

### 5.4 Kosten, vrijgaveschema en puntenprijzen (besluit founder, G3 en MF5)

De pilot meet "beloning", geen "punten als score". Daarom liggen de economie en de beschikbaarheid van beloningen vooraf vast en veranderen ze niet tijdens het experiment.

| Post | Voor wie | Bedrag | Regel |
|---|---|---|---|
| Pilotprijzen en catalogus gesloten pilot | Experimentpopulatie, tot en met de bonusstop van de eigen kalender | €1.500 (werkhypothese) | Voorgefinancierd; vast vrijgaveschema; buiten de weekmaat |
| Catalogus onderzoekscohort februari tot en met april | Experimentpopulatie | €4.000 (werkhypothese) | Eigen voorraad, gescheiden van die voor nieuwe gebruikers |
| Aprilchallenge onderzoekscohort | Verenigingen van de experimentpopulatie | €2.500 (werkhypothese) | Collectieve prijzen op deelnamegraad, voor beide rustperiode-armen gelijk |
| Gratis laag van de uitbreiding | Uitbreidingscohort | Binnen de post gratis laag (businessplan §10) | Eigen voorraad; weekmaat ≤ €0,06 per wekelijks actieve gebruiker per week (werkhypothese, **aanname**), alleen vanaf de uitbreiding |

**Vast vrijgaveschema.** Per post de voorraad per week (aantal vouchers per item, gespreid over de week, het deel dat gereserveerd is voor het instellingsanker) en de puntenprijzen: **[in te vullen bij de prijslijst, uiterlijk 25 november, en vóór 2 december hier vastgelegd]**. Het schema is gelijk voor alle armen en hangt niet af van tussentijdse kosten. In de doorlopende arm blijven de puntwaarde en het vrijgaveschema gelijk tot en met A (besluit founder, MF5). Niet-verzilverde vouchers van een week blijven in dezelfde post beschikbaar; het schema wordt niet verlaagd en niet verhoogd (voorstel productteam). De catalogus toont per week de vrijgegeven voorraad naast het aantal studenten dat mag verzilveren, en de schaarste staat vooraf in de onboarding (founder J10).

**Impliciete waarde per punt.** Bij de prijslijst publiceren we intern: de budgetwaarde per punt (spec §4.3), het aantal punten per euro kostprijs en het aantal focusuren dat het goedkoopste item kost **[in te vullen bij de prijslijst]**. Op de wachtlijst toetsen we of studenten de omrekening naar een uurloon spontaan maken.

## 6. Bedrijfsbesluit na het aprilvenster

### 6.1 Bindende voorwaarden voor de tweede tranche (besluit founder, MF1)

Dezelfde getallen als in het businessplan §10. Tranche 2 komt alleen vrij als **alle** voorwaarden (a)–(e) gehaald zijn en geen stopregel geraakt is (D7, D30, deelnemersbescherming); (f) bepaalt de omvang. Er staat geen "werkhypothese" bij deze voorwaarden.

| | Voorwaarde | Meting |
|---|---|---|
| **(a)** | Minstens één intentieverklaring is vóór 1 mei 2027 omgezet in een getekende opdracht | Getekend document met datum |
| **(b)** | Elke intentieverklaring noemt een prijs van minstens €8 per seat per tentamenperiode (of €24 per seat per jaar) en minstens 150 seats; minstens één betaler hangt niet af van een aandringend bestuur | §5.3 |
| **(c)** | Minstens 20% van de januari-actieven (§2) heeft in 1–14 februari 2027 minstens twee sessiedagen per week. Overlapt 1–14 februari voor een kalender met de laatste tentamenweek (T − 6 tot en met T) of met de herkansingen van die periode, dan is het venster voor die kalender N | Aandeel januari-actieven met ≥ 2 sessiedagen in elk van de twee weken van het venster van de eigen kalender. Uitwerking van besluit 1 op (c), zie open punt 2; welk venster per kalender geldt, staat in §3.2 |
| **(d)** | Minstens 25% van de januari-actieven keert in het aprilvenster terug | Aandeel januari-actieven met ≥ 1 sessiedag in A van de eigen kalender |
| **(e)** | D7 van het go/no-go-cohort ≥ 25% als vaste lat, met hoogstens één herhaling in de zone 15–25% | §5.1 en §5.2; de encouragement-vergelijking wordt gerapporteerd, niet als drempel gebruikt |
| **(f)** | Bij een nulresultaat op H3 (geen detecteerbaar verschil in A) wordt tranche 2 beperkt tot €180.000 voor B2B2C en wordt de native bouw uitgesteld tot er bewijs is | "Nulresultaat": in de vroege Belofte-arm en in de rustperiode-arm ligt het 95%-interval van de primaire H3-maat rond nul, of H3b is vervallen en H3a ligt rond nul (lezing productteam, te bevestigen door de founder) |

**Stopregel D30.** D30 buiten de tentamenweken: aandeel van het go/no-go-cohort met ≥ 1 goedgekeurde sessie in N van de eigen kalender. **Onder 6% betekent geen tweede tranche en geen opschaling.**

### 6.2 Verkennende uitkomsten en overige vooraf vastgelegde regels

Primair verkennend: H3 (nawerking in A). Daarnaast: H1, H2, squadoverleving, **reactivering van squads in de volgende tentamenperiode** (aandeel squads met ≥ 2 actieve leden in A, onder de squads die in de laatste tentamenweek van hun kalender ≥ 2 actieve leden hadden; G-S6), **deelnamegraad per vereniging** (§10), K van gebruiker aan gebruiker, de welzijnsmeting en de uitstap per arm. Een verkennende hypothese draagt geen besluit, behalve via (f).

| Vooraf vastgelegd | Regel |
|---|---|
| **Actieve seat** (besluit founder, S5) | Een seat met minstens twee sessiedagen per week in de tentamenperiode. Dezelfde definitie in dashboard, contract en deze voorregistratie. In de pilot is de nabije maat de deelnamegraad per vereniging (§10), naast de 30% uit het financierbare punt |
| **Plus-nepdeur** (besluit founder, S7) | Schrijft minder dan 5% van de D30-actieven (go/no-go-cohort met een sessie op dag 30 of in N) zich in via de nepdeur, dan verdwijnt Plus als bron uit de pitch |

## 7. Fraude

### 7.1 Onafhankelijke steekproef

| Onderdeel | Inhoud |
|---|---|
| Steekproef | Elke maandag 30 accounts, willekeurig getrokken uit de accounts met ≥ 1 voltooide sessie in de afgelopen week, gestratificeerd per vereniging (plus een stratum "geen vereniging"), proportioneel naar het aantal actieve accounts, minstens één per stratum met ≥ 5 actieve accounts |
| Uitvoering | De pilotbeheerder (businessplan §10), met de founder als tweede beoordelaar |
| Trekking | Met de randomisatieseed (§9.2) en het weeknummer, zodat elke steekproef achteraf te reproduceren is |
| Lichte controle | (1) Bevestigd instellingsmailadres of geverifieerd mobiel nummer; (2) nummertype mobiel; (3) sessiepatroon (tijden, duur, claimvertraging, toestel, H12); (4) kort contact met de vraag om squad of vereniging te bevestigen, **via het instellingsadres als het account een instellingsanker heeft**: omdat we dat adres niet bewaren, vraagt de app de student het adres opnieuw te bevestigen met een code, en moet het domein gelijk zijn aan het opgeslagen domein (uitwerking productteam, founder J4); anders via het accountadres |
| Criteria per oordeel | Zie §7.2; door een mens, met redencode |
| Gevolg voor de student | Een oordeel "verdacht" of "frauduleus" leidt tot een normale beoordeling in de fraudewachtrij met beroep (spec §6.4–6.5); de steekproef zelf boekt niets |
| Schatting | Aandeel "frauduleus" (en apart "frauduleus of verdacht") met 95%-interval, gewogen naar de strata, per week en cumulatief; gerapporteerd als ondergrens |
| Gevoeligheidsanalyse | Alle KPI's en alle hypotheses ook zonder de accounts die de steekproef als verdacht of frauduleus aanmerkt |
| Wachtrijlast | Aandeel gemarkeerde sessies en doorlooptijd van besluiten, per week; geen go/no-go |

### 7.2 Criteria per oordeel (founder J4)

Vastgelegd zodat de beoordelaar niet per week een andere lat legt. Voorstel productteam; de founder bevestigt vóór 2 december.

| Oordeel | Criteria (één volstaat, tenzij anders vermeld) |
|---|---|
| Geen aanwijzing | Anker bevestigd of contact bevestigt squad of vereniging, en geen van de criteria hieronder |
| Verdacht | Geen anker én geen reactie op het contact binnen 7 dagen; of een open markering H2, H7, H9, H10, H11 of H12 in de week; of het sessiepatroon wijkt sterk af (nachtpatroon H6, claimvertraging H9) zonder verklaring |
| Frauduleus | Twee of meer van: anker gedeeld met een ander account (zelfde telefoonhash of instellingsdomein met een overlappend patroon), H12 met een account dat al frauduleus is, contact ontkent lidmaatschap van de opgegeven squad of vereniging, toestel of user-agentklasse van de sessies wijkt af van die van registratie en inloggen; of een bevestigde blokkade |

### 7.3 Verplichte steekproef bij prijzen

Bij elke hoofdprijswinnaar en bij elke vereniging die de drempel haalt: een steekproef van 20 meegetelde leden (of allemaal bij minder dan 20), met dezelfde lichte controle, plus twee stappen (founder J1): **(1) toestelvergelijking**: het toestel en de user-agentklasse van de sessies in de prijsperiode worden vergeleken met die van registratie en inloggen; **(2) oefensessie op de eigen telefoon**: het steekproeflid start vanaf de eigen telefoon één oefensessie van één minuut, die alleen als controle telt. In de prijssteekproef betekent niet reageren dat het lid niet in de teller telt (challengevoorwaarden A8.3); in de wekelijkse steekproef heeft niet reageren geen gevolg. De uitslag is pas definitief na deze steekproef (spec §4.6–4.7).

### 7.4 Red-teamdag (vóór 25 november 2026)

Twee mensen, één dag, op de stagingomgeving met de pilotparameters. Opdracht: tien accounts door de inverdienperiode en één verenigingsweek krijgen met een headless browser (ook met overschreven `navigator.webdriver`), een hotspot en e-mailaliassen (plus-adressen en Gmail-punten), en daarnaast **zes echte accounts op één laptop op eduroam** (zes browserprofielen in zes zichtbare vensters, één bestuurslid dat de sessies laat draaien; founder J1). Vastleggen per account: wat lukte, welke heuristiek of controle het zag, hoeveel tijd het kostte. **Uitkomst [in te vullen na de red-teamdag]**, met de wijzigingen die eruit volgen.

### 7.5 Drempels voor campus, mobiel CGNAT en H12

Campus- en CGNAT-adressen worden bij H2, H7 en H10 niet overgeslagen maar met een hogere drempel geteld. **H12** (gelijktijdige sessies: accounts met overlappende sessies vanaf dezelfde IP-hash en dezelfde user-agentklasse, met starttijden binnen twee minuten; founder J1) markeert ook op campusadressen. **Drempels [in te vullen na de red-teamdag; werkhypothese productteam voor H12: ≥ 3 accounts]**, vóór 2 december op de seed vastgelegd: een gesimuleerde UB-NAT met twintig eerlijke studenten mag niet markeren, het red-teamscenario met tien accounts achter een hotspot en het scenario met zes accounts op één laptop wel.

## 8. Deelnemersbescherming

### 8.1 Geïnformeerde deelname

In de onboarding staat vóór het akkoord een korte uitleg: de pilot vergelijkt door loting twee bonusregels, twee momenten voor de Belofte, een uitnodiging om een squad te vormen en (als de advocaat de arm toestaat) een rustperiode zonder nieuwe punten vanaf het einde van de tentamenweken van je instelling tot en met de tentamenperiode van april; de rustperiode kan ook in tentamenweken vallen (founder G-S8); de doelbonus stopt aan het einde van de laatste tentamenweek van je instelling, op een datum die de app noemt; de catalogus is schaars, en de app toont per week de voorraad naast het aantal studenten dat mag verzilveren.

Er zijn twee uitwegen, apart uitgelegd (founder J2):

- **Uit de rustperiode stappen** ("Ik wil weer punten verdienen"): kan altijd, staat in het rustperiodebericht zelf, en geldt vanaf de volgende focusdag. Je blijft in het onderzoek; de keuze rapporteren we per arm.
- **Uit het onderzoek stappen**: kan altijd in Ik, zonder verlies van punten. Je krijgt vanaf de volgende focusdag arm A en doorlopende punten, en het Belofte-aanbod op T − 6 van je kalender als je dat nog niet kreeg, en je valt vanaf de afmelding buiten de analyse. Wie volledig bezwaar maakt (art. 21 AVG), kan dat zo doen. De afmelding rapporteren we per arm.

### 8.2 Minderjarigen

16- en 17-jarigen: standaard arm A, buiten de rustperiode-arm, live aanwezigheid standaard uit, duels alleen binnen de eigen squad. De welzijnsitems en de wekelijkse meting van twee items krijgen zij net als iedereen, als ze de aparte welzijnstoestemming geven (founder G4: "vanaf week 2, voor iedereen"). Het voorstel van het juridische team om hun alleen de vragen over studietijd en afleiding te stellen (privacyverklaring §6.1.3), gaat alleen in als de advocaat dat bij vraag 9a vraagt; dan staat dat hier vóór de vastlegging.

### 8.3 Schadesignalen en stopregel

| Code | Signaal (werkhypothese voor "meerdere dagen") | Reactie |
|---|---|---|
| S1 | Sessies gestart tussen 01:00 en 04:00 op ≥ 3 nachten binnen 7 dagen | Zacht bericht met hulpbronnen van de eigen instelling (studentenpsycholoog, studentendecaan); geen sanctie |
| S2 | Meer dan 360 geverifieerde minuten per dag op ≥ 3 dagen binnen 7 dagen | Idem |
| S3 | Na een gebroken squadstreak van ≥ 7 dagen: geen voltooide sessie in de 7 dagen erna, terwijl de student in de 7 dagen ervoor op ≥ 5 dagen een sessie deed | Idem |
| S4 | Supportbericht met het label "welzijn" | Persoonlijk antwoord door een teamlid, met hulpbronnen |

Hoogstens één bericht per signaal per 14 dagen. Signalen worden per arm geteld, zonder dat het bericht van de arm afhangt. S1–S3 zijn profilering zonder rechtsgevolg en staan met de belangenafweging in de DPIA; het label "welzijn" (S4) behandelen we als gezondheidsgegeven (founder J8, §8.4).

**Stopregel voor arm B** (besluit founder, G4). Eigenaar: de founder, met de statisticus en de onderzoeker; vast te stellen uiterlijk 25 november 2026.

| Onderdeel | Inhoud |
|---|---|
| Meting | Wekelijkse meting van twee items (stress, ervaren druk), vanaf de tweede focusweek van de gebruiker, voor iedereen die de welzijnstoestemming gaf, ook 16- en 17-jarigen (founder G4; §8.2), overslaanbaar en zonder punten (§8.4) |
| Criterium 1 (welzijn) | Werkhypothese founder: de wekelijkse score is twee weken achter elkaar minstens een halve standaarddeviatie slechter in arm B dan in arm A |
| Criterium 2 (schade) | Het aandeel gebruikers met ≥ 1 signaal S1–S4 in een week is in arm B meer dan twee keer dat van arm A |
| Toetsmoment | Elke maandag vanaf week 2, tot en met de bonusstop van de laatst eindigende kalender |
| Correctie voor herhaald kijken | **[methode in te vullen door de statisticus, uiterlijk 25 november]**, vooraf vastgelegd per kijkmoment |
| Minimum | Criterium 1 wordt alleen getoetst in een week met minstens 40 antwoorden per arm, zonder de antwoorden van 16- en 17-jarigen, die altijd in arm A zitten en buiten de analyse van de doelbonus vallen (§2; lezing eindredactie, te bevestigen door de statisticus); de uitkomst van vraag 9a verandert dit minimum dus niet; in een week daaronder rust de regel op criterium 2 en de schadesignalen (lezing productteam van het minimum van 40 per arm) |
| Weigeraars | Wie geen welzijnstoestemming geeft of een week overslaat, telt als ontbrekend; gevoeligheidsanalyse op de ontbrekende waarden **[methode door de statisticus]**; het aandeel weigeraars rapporteren we per arm |
| Gevolg | Arm B stopt: iedereen arm A vanaf de volgende maandag (`arm_switch` met reden `arm_b_stopped`) |

**Absolute schadegrens** (G-S7): zie §5.1. Ze vergelijkt geen armen maar telt schade die in beide armen optreedt.

### 8.4 Vragenlijsten

Kort, overslaanbaar, zonder punten of andere beloning (zodat beantwoorden niet van de arm afhangt). Het welzijnsinstrument kiest een onderzoeker **[in te vullen: instrument en items]**. Grondslag voorlopig gerechtvaardigd belang; de welzijnsitems kunnen gezondheidsgegevens zijn (art. 9 AVG) en staan daarom achter een aparte toestemmingsvraag (definitief na vraag advocaat 9). Wie geen toestemming geeft, krijgt de overige items. De toestemmingsvraag geldt voor iedereen, ook voor 16- en 17-jarigen (§8.2).

| Moment | Inhoud |
|---|---|
| Instroom (na het akkoord) | Welzijn 1 (stress, slaap, ervaren squaddruk, intrinsieke motivatie); zelfgerapporteerde studietijd en telefoonafleiding ("vóór"); gebruik nu of eerder van Forest of Opal, en zo ja waarom Rewarded ernaast of in plaats daarvan |
| **Wekelijks, vanaf de tweede focusweek** | Twee items: stress en ervaren druk (§8.3). Tot en met de bonusstop van de eigen kalender voor de stopregel; daarna tot en met A-einde voor de rapportage per rustperiode-arm (voorstel productteam). Niet in de vakantiepauze |
| Pilotreflectie, T + 1 tot en met T + 7 | Welzijn 2; "Hoe voelde de bonusregel?" (per arm geanalyseerd) |
| Na-seizoensmeting, in N | Welzijn 3; studietijd en telefoonafleiding ("na") |
| Belofte-reflectie | Naleving, hernieuwen, aanpassen of stoppen; 18+: interesse in een inzet voor een goed doel (H-C, signaal) |
| Na A | Studietijd en telefoonafleiding (tweede "na"); vraag naar geaggregeerde studievoortgang loopt via verenigingen en instellingen, niet via de student |

### 8.5 Overige ontwerpmaatregelen (geen meting, wel vastgelegd)

Tentamendag die het dagdoel zonder joker opschort; puntenplafond van 300 minuten per dag (dagdoel maximaal 120); sessies na 01:00 tellen, maar zonder doelbonus en met een rustig signaal; hersamenstelroute gepauzeerd buiten de tentamenperiodes, zodat een seizoensdip niet als falen voelt (G-S6); geen marketing die op sociale schaamte speelt; lichte ethische toets via een partneruniversiteit **[status in te vullen]**.

## 9. Toewijzing en randomisatie

### 9.1 Factoren

| Factor | Armen | Eenheid | Strata (blokken van 4) | Uitzonderingen |
|---|---|---|---|---|
| Doelbonus | A / B | Squad bij aanmaken; solo bij registratie | Vereniging × instroomkanaal (de vereniging bepaalt de kalender) | 16- en 17-jarigen altijd A |
| Belofte | Vroeg / laat | Idem | Idem | — |
| Rustperiode | Rust / doorlopend | Idem | Idem | 16- en 17-jarigen altijd doorlopend; vervalt zonder oordeel van de advocaat |
| Squadprompt | Sterk / standaard | Solo-gebruiker bij registratie | Instroomkanaal | Alleen solo |

Elke factor wordt onafhankelijk geloot. Wie in de experimentpopulatie later bij een squad komt, neemt de bonus- en rustperiode-arm van de squad over vanaf de eerstvolgende maandag, en de Belofte-arm alleen als het eigen aanbod nog niet getoond is (`arm_switched`). Samenvoegen kan alleen tussen squads met dezelfde rustperiode-arm. De analyse gebruikt de eerst toegewezen arm. Wie uit de rustperiode stapt, blijft op zijn toegewezen arm in de analyse.

### 9.2 Seedprocedure

1. Vóór 2 december genereert de founder een seed van 32 willekeurige bytes op een apart toestel, in het bijzijn van een tweede persoon.
2. De SHA-256-hash van de seed komt in deze voorregistratie: **[in te vullen]**. De seed zelf gaat in de geheimenmap van de server (architectuur §10.9), niet in de repository.
3. De toewijzing is deterministisch: `arm = f(HMAC-SHA256(seed, factor ‖ stratum ‖ bloknummer))`, met een willekeurige permutatie van twee A's en twee B's per blok. Dezelfde seed geeft dezelfde toewijzing; de A/A-controle draait met een andere testseed.
4. Na het bedrijfsbesluit publiceren we de seed, zodat een derde de toewijzing kan narekenen.

### 9.3 Codebevriezing, review en A/A-controle

Vóór de A/A-controle worden de toewijzings- en grootboekcode (`packages/core` experimenten, grootboek en `reconcileDay`, met de bijbehorende API-modules en KPI-query's) **bevroren** en door een onafhankelijke reviewer gelezen (besluit founder, G-S12) **[reviewer in te vullen]**. Daarna draait de A/A-controle **op de bevroren code en de echte KPI-query's**, niet op een simulatie ernaast, met een gesimuleerd cohort (werkhypothese: 800 fictieve gebruikers, verdeeld over squads, solo's, verenigingen met verschillende kalenders, kanalen en leeftijdsklassen) door toewijzing, armwissels, samenvoegingen, vakantiepauze, tentamendagen, bonusstop en rustperiode per kalender, rustuitstap en alle KPI-query's. Controle: de verdeling over armen per stratum, geen 16- of 17-jarige in arm B of de rustperiode, armwissels gelogd, samenvoegen alleen binnen de rustarm, de data per kalender volgens §3.1, en geen significant verschil tussen armen op een maat waar per constructie geen verschil kan zijn. Een wijziging aan de bevroren code na de A/A-controle vraagt een nieuwe review en een nieuwe A/A-run. **Uitkomst [in te vullen]**.

## 10. Rapportage

- Alle uitkomsten per instroomkanaal (vereniging, squaduitnodiging, ambassadeur, wachtlijst, overig), per vereniging en per kalender; minstens één vereniging waarvan het bestuur niet zelf om de challenge vroeg, als referentie.
- **Deelnamegraad per vereniging** in de laatste tentamenweek en in A: leden met ≥ 2 sessiedagen per week, gedeeld door het externe ledental, naast de 30% actieve seats uit het financierbare punt (G-S3).
- Retentie altijd op kalendertijd naast relatieve dagen.
- K alleen uit uitnodigingen van gebruiker aan gebruiker (squad, duel, persoonlijke link), zonder wachtlijst, verenigingscode, ambassadeurscode of kaart.
- Squadoverleving (≥ 2 actieve leden in week 4 en week 8 na aanmaken) en reactivering van squads in A (§6.2).
- Uitstap per arm: uit de rustperiode en uit het onderzoek.
- Belofte-dosis per gebruiker.
- Wie de modus zonder punten kiest, en hun retentie.
- Teamaccounts tellen nergens mee; afgekeurde sessies ook niet.
- In elk cijfer voor een instelling of bestuur heet de tijd "focustijd die telde (Rewarded zichtbaar op het scherm)", met het verificatieniveau erbij (founder J3).
- De analyse draait een **onafhankelijke analist**. Profiel: onafhankelijk onderzoeker, niet betaald naar uitkomst, zonder belang bij het slagen van de pilot (bijvoorbeeld de statisticus van de poweranalyse of iemand van de partneruniversiteit van de ethische toets) **[naam in te vullen vóór 2 december]**. De analist krijgt pas na vastlegging van deze voorregistratie toegang tot uitkomstdata.

## 11. Open punten vóór vastlegging

1. **Kalenders per instelling** (founder, uiterlijk 18 november). T, N en A per instelling en faculteit op de primaire pagina's; welke verenigingen passen; welke kalenders de pilot dekt (§3.2).
2. **Venster van voorwaarde (c)** (uitgewerkt in §6.1). Het besluit noemt 1–14 februari; besluit 1 maakt de pilotkalender per instelling en legt de na-seizoensmaten na de herkansingen. Ligt T voor een instelling rond 7 februari (volgens zoekresultaten mogelijk in Utrecht), dan valt de definitieweek van de januari-actieven (T − 6 tot en met T) samen met week 1 van (c), en meet (c) daar de tentamenkalender. Daarom meet (c) voor een kalender waarbij 1–14 februari overlapt met de laatste tentamenweek of de herkansingen in N; het getal (20%, twee sessiedagen per week, twee weken) blijft. Dit is de uitwerking van besluit 1 door de eindredactie, volgens het eerdere voorstel van het productteam; de founder legt het met deze voorregistratie vast vóór 2 december, met per kalender het venster in §3.2.
3. **Prijsperiode en poules per kalender** (§3.4). Bevestigen, en in de challengevoorwaarden opnemen (juridisch team).
4. **Vrijgaveschema, puntenprijzen en impliciete waarde per punt** (§5.4), uiterlijk 25 november.
5. **Drempel voor differentiële uitstap** (§4, H3b) en **correctiemethode en ontbrekende waarden** (§8.3): statisticus, uiterlijk 25 november.
6. **Aantal solo-gebruikers** (§4, H1): schatting door de statisticus vóór 25 november.
7. **Onafhankelijke analist en reviewer** (§9.3, §10): namen vóór 2 december.
8. **Gesprek met Hold** (founder, vóór 25 november): vastleggen wat het oplevert over monetisatie en retentie en wat het aan de drempels hier verandert; elke wijziging komt als gedateerde regel in het wijzigingslog.
9. **Advocaat, vragen 2 en 3** (founder, "direct"). Zonder antwoord vóór 25 november vervalt arm B respectievelijk de rustperiode-arm, en dat staat dan hier. Vraag 3 bevat nu de rustperiode tot en met het aprilvenster, het mogelijke samenvallen met tentamenweken, de squadregel voor het uitbreidingscohort en de gescheiden uitweg.
10. **Kalender voor eenheden zonder vereniging** (§3.1): voorstel productteam bevestigen.
11. **Lezing van "nulresultaat op H3"** (§6.1, voorwaarde f) en **opzet van de D7-herhaling** (§5.2): voorstellen productteam bevestigen.
12. **Criteria per fraudeoordeel** (§7.2) en **drempels H12** (§7.5): bevestigen na de red-teamdag.
13. **Geen prestatiechallenges in de hele rustperiode** (§4, H3b): voorstel om challengevoorwaarden B7 te volgen (T + 1 tot en met A-einde, beide armen) in plaats van alleen A; bevestiging founder. Wijst de founder het af, dan geldt de regel alleen in A en passen B7 en de spec mee aan.
14. **Welzijnsitems voor 16- en 17-jarigen** (§8.2): uitkomst van vraag advocaat 9a verwerken vóór de vastlegging; zonder bezwaar van de advocaat blijft het besluit van de founder (voor iedereen met aparte toestemming).

## Wijzigingslog

**Ronde 1 — 5 november 2026.** Eerste concept, opgesteld door het productteam volgens `docs/pitch/ronde-1-founder-reactie.md` (M4, G1–G4, GS2, GS3, GS7, GS8, GS10, GS11, J1, J2, S10). Bevat per hypothese primaire maat, analyse-eenheid, MDE (in te vullen), beslisregel en stopregel; go/no-go-cohort; kalender; fraudesteekproef; seedprocedure en A/A-controle.

**Ronde 1, eindredactie — 5 november 2026.** Bijgewerkt volgens de aanvulling van de founder na de samenhangcontrole: lanceringsbesluit op 19 januari 2027; D30 buiten de tentamenweken in 1–14 februari; kostenplafond €0,06 per wekelijks actieve gebruiker per week; Belofte-aanbod op 11 januari voor iedereen; rustperiode van 19 januari tot en met 31 maart; stopregel arm B met werkhypothese; welzijnsitems achter een aparte toestemming; open punten 5 en 6.

**Ronde 2 — 5 november 2026.** Herzien door het productteam volgens de bindende besluiten in `docs/pitch/ronde-2-founder-reactie.md`, gelijk met het businessplan v3.

- Kalenderregel per instelling in plaats van vaste data (besluit 1, G1): T, N en A per kalender; bonusstop aan het einde van de laatste tentamenweek, Belofte-aanbod zeven dagen eerder, rustperiode vanaf de bonusstop, reflectie in de week erna, na-seizoensmaten en D30 in N; tentamenkalender per vereniging als parameter; kalenders bevestigd uiterlijk 18 november; prijsperiode per kalender (§1, §2, §3, §4, §6). Lanceringsbesluit na de laatste tentamenweek van het laatst eindigende pilotcohort, gevolgd door een gecontroleerde uitbreiding; "publieke lancering" en "lanceringsgebruikers" vervangen door "uitbreiding" en "uitbreidingscohort" (besluit 2, S1).
- Rustperiode tot en met het aprilvenster, aprilchallenge voor beide armen gelijk op deelnamegraad, squadregel voor het uitbreidingscohort, samenvoegen binnen de arm, gescheiden uitweg uit de rustperiode en uit het onderzoek met de uitweg in het bericht zelf, uitstap per arm als uitkomst, drempel voor differentiële uitstap (besluit 3, G2, J2). De secundaire maat "terugkeer in 25–31 maart" is algemeen gemaakt naar de week vóór A-start.
- Bindende voorwaarden (a)–(f) voor de tweede tranche in getallen; D7 ≥ 25% als vaste lat met hoogstens één herhaling; encouragement-vergelijking alleen gerapporteerd; commercieel criterium met ondergrens voor prijs en seats, onafhankelijke betaler en toekenningsmoment; januari-actieven gedefinieerd (MF1, G-S2). Botsing tussen voorwaarde (c) en de kalenderregel als open punt 2.
- Kostenmaat in de pilot als pilottotaal; aparte posten voor catalogus februari–april (€4.000) en aprilchallenge (€2.500), gescheiden van de voorraad voor nieuwe gebruikers; vast vrijgaveschema en vaste puntenprijzen voor alle armen; puntwaarde in de doorlopende arm vast tot en met A; impliciete waarde per punt intern; weekmaat pas vanaf de uitbreiding; "weekvrijgave verlagen" niet toegestaan (G3, MF5, J10).
- Stopregel arm B op een wekelijkse meting van twee items vanaf week 2 plus de schadesignalen, met correctie voor herhaald kijken, minimum van 40 per arm en weigeraars als ontbrekend met gevoeligheidsanalyse; open punt 6 van ronde 1 gesloten (G4). Absolute schadegrens van 2% (G-S7).
- H1 met ITT als hoofdresultaat en IV als bovengrens, schatting van het aantal solo-gebruikers (G-S1); H3 primair binair met instroomactiviteit als covariaat (G-S9); Belofte-hernieuwing bij de reflectie en dosis (G-S4); interactie Belofte en rustperiode als verkennend (G-S5); reactivering van squads en pauze van de hersamenstelroute (G-S6); deelnamegraad per vereniging (G-S3); H2 draagt geen bedrijfsbesluit (G-S10); onafhankelijke analist met profiel (G-S11); codebevriezing en onafhankelijke review vóór de A/A-controle op de echte code (G-S12); uitbreidingscohort, open punt 5 van ronde 1 gesloten (G-S14).
- Fraude: beslisregel op de bovengrens van het interval, criteria per oordeel, contact via het instellingsadres, schatting als ondergrens (J4); H12, toestelvergelijking en oefensessie in de prijssteekproef, red-teamscenario met zes accounts op één laptop (J1); S1–S3 als profilering en S4 als gezondheidsgegeven (J8).
- Actieve seat en Plus-drempel van 5% vooraf vastgelegd (S5, S7); Hold-gesprek als open punt (S4).
- Nieuwe voorstellen van het productteam, als zodanig gemarkeerd: definitie van N, kalender voor eenheden zonder vereniging, prijsperiode per kalender, geen individuele prestatiechallenges in A voor het onderzoekscohort, opzet van de D7-herhaling, lezing van het nulresultaat bij (f), criteria per fraudeoordeel, werkhypothesen 15 procentpunt (differentiële uitstap) en ≥ 3 accounts (H12), wekelijkse meting na de bonusstop tot en met A.

**Ronde 2, eindredactie — 5 november 2026.** Gelijkgetrokken met de spec (versie 1.2), de juridische concepten en de besluiten in `docs/pitch/ronde-2-founder-reactie.md` na een onafhankelijke samenhangcontrole. Kopregel en ronde-2-log gedateerd op 5 november, de datum van de founder-reactie.

- §3.1: T is de zondag waarmee de laatste reguliere tentamenweek eindigt, zodat de bonusstop om 04:00 op T + 1 een maandag is en samenvalt met het einde van de prijsperiode (besluit 1).
- §6.1 (b): "Elke meetellende intentieverklaring" wordt "Elke intentieverklaring", in de woorden van de founder (MF1b); een verklaring onder de ondergrens laat (b) dus falen.
- §6.1 (c), §3.2 en open punt 2: venster per kalender uitgewerkt volgens besluit 1: 1–14 februari, of N als dat venster overlapt met de laatste tentamenweek of de herkansingen; het getal blijft; nieuwe kolom "Venster (c)" in de pilotkalenders.
- §4 H3b en open punt 13: geen individuele prestatiechallenges voor het onderzoekscohort in de hele rustperiode, zoals challengevoorwaarden B7; **voorstel**, ter bevestiging door de founder.
- §8.2, §8.3, §8.4 en open punt 14: welzijnsitems en wekelijkse meting ook voor 16- en 17-jarigen met aparte toestemming (G4); de uitsluiting uit privacyverklaring §6.1.3 alleen na vraag advocaat 9a; antwoorden van 16- en 17-jarigen tellen niet voor het minimum van 40 per arm (lezing eindredactie, te bevestigen door de statisticus).
