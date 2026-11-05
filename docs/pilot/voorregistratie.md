# Rewarded — Voorregistratie gesloten pilot 2026/'27 (concept, ronde 3)

*Concept van het productteam, 5 november 2026, herzien na pitchronde 3 en gedateerd op de datum van de founder-reactie van ronde 3. Vast te leggen door de founder vóór 2 december 2026; na vastlegging wijzigt niets meer zonder een gedateerde, gemotiveerde wijzigingsregel onderaan (en dan rapporteren we beide versies). Bindend kader: de besluiten van de founder na pitchronde 3 (`docs/pitch/ronde-3-founder-reactie.md`), die voorgaan op die na pitchronde 2 (`docs/pitch/ronde-2-founder-reactie.md`) en pitchronde 1 (`docs/pitch/ronde-1-founder-reactie.md`), het businessplan v4 (`docs/01-businessplan.md` §7 en §10) en het productplan (`docs/02-productplan.md` §8). Regels en parameters: `docs/research/05-productspecificatie.md` (verder: spec); techniek: `docs/research/07-architectuur.md` (verder: architectuur). Bij verschil tussen dit document en een ander document over maten, drempels en beslisregels geldt dit document; de voorwaarden voor de tweede tranche staan hier in dezelfde getallen als in het businessplan.*

*Markering. **[in te vullen]** betekent dat een getal of naam pas na de poweranalyse, de red-teamdag, de prijslijst of een bevestiging van een instelling of vereniging bekend is; we vullen het in vóór 2 december, tenzij er een andere datum staat. **Werkhypothese** is een voorstel van de founder, het productteam of het strategieteam dat de founder hier bevestigt of verandert; waar het een voorstel van het productteam is, staat dat erbij. **Aanname** is iets wat we niet weten. **Lezing productteam** is onze uitwerking van een besluit dat de founder niet tot in detail beschreef; de founder bevestigt die vóór de vastlegging. Er staat geen getal in dat niet uit een bron, een besluit van de founder of een benoemde werkhypothese komt.*

*Wie bevestigt wat vóór 2 december. De founder legt dit document vast. De statisticus stelt de marge δ, de gevoeligheidsgrens, de Holm-uitwerking, de correctie voor herhaald kijken en de intervallen bij (c) en (d) vast. De investeerder bevestigt de lezing van (c), (d) en (f), omdat die zijn voorwaarden raken (besluit founder na ronde 3, G-MF1 en G-MF2). De onderzoeker kiest het welzijnsinstrument, de motivatie-items en de beoordelingscriteria bij de schadegrens.*

---

## 1. Wat deze pilot is, en wat niet

Dit is een **verkennende pilot met één redelijk gepowerde vergelijking**: de doelbonus in arm A (gewone bijschrijving) tegenover arm B (slinkend weekbudget), gemeten als gehaalde dagdoelen tijdens het seizoen. Daarnaast meten we voorgeregistreerd, maar verkennend, de nawerking in de tentamenperiode van april 2027: de Belofte vroeg tegenover laat (H3a), en de **steigertoets** (H3b): een rustperiode-arm die tot en met het aprilvenster geen nieuwe punten verdient, tegenover een arm die doorlopend punten verdient. Het squadeffect meten we via een encouragement design.

De steigertoets is een **non-inferioriteitstoets** met vier vooraf benoemde uitkomsten (§4, H3b). "Beloning als steiger" voorspelt dat het gedrag blijft staan als de punten rusten, dus dat de rustarm niet slechter scoort. Een uitkomst "geen verschil" is daarom geen mislukking, mits een gevoeligheidstoets laat zien dat punten in de doorlopende arm iets doen. De term "nulresultaat" gebruiken we niet meer (besluit founder na ronde 3, G-MF1).

Alle data van de pilot volgen de **tentamenkalender per vereniging** (§3): die is de bron van T, N en A. Vaste data bestaan alleen nog als standaardkalender voor eenheden zonder vereniging (besluit founder na ronde 3, G-MF3).

Twee besluiten hangen aan deze pilot, op verschillende momenten:

| Besluit | Wanneer | Waarop |
|---|---|---|
| **Lanceringsbesluit** (operationeel) | Na de laatste tentamenweek van het laatst eindigende pilotcohort (§3.2); werkhypothese: niet vóór 8 februari 2027 als de zoekresultaten voor Utrecht kloppen (**aanname**) | Activatie, fraude, kosten binnen het pilottotaal, D7 van het go/no-go-cohort, deelnemersbescherming en schadegrens (§5). Daarna volgt een gecontroleerde uitbreiding op uitnodiging, geen open lancering (besluit 2 na ronde 2) |
| **Bedrijfsbesluit** (tweede tranche, omvang, native app) | Na het aprilvenster van alle pilotinstellingen (werkhypothese: mei 2027) | De bindende voorwaarden (a)–(e) in getallen, de stopregels, en de steigertoets die via (f) de omvang van tranche 2 bepaalt (§6.1) |

Het lanceringsbesluit hangt **niet** af van de nawerkingshypothese. **H2 draagt geen bedrijfsbesluit**: het bedrijfsbesluit rust op de bindende voorwaarden, de stopregels en de uitkomst van de steigertoets (besluit founder, G-S10 na ronde 2). **H3a bepaalt de omvang van tranche 2 niet**; na de Holm-correctie is het een verkennend resultaat (lezing strategieteam in businessplan §10, hier vastgelegd).

Een hypothese waarvan het kleinste detecteerbare effect (MDE) volgens de poweranalyse groter is dan plausibel, heet **verkennend**: we rapporteren effect en betrouwbaarheidsinterval, en er hangt geen besluit aan, behalve waar §6.1 dat expliciet vastlegt (voorwaarde f). De poweranalyse bepaalt hoe we een uitkomst lezen, niet of we randomiseren. De pitch gebruikt letterlijk de formuleringen uit §4.

## 2. Populaties en cohorten

| Groep | Definitie | Gebruikt voor |
|---|---|---|
| Experimentpopulatie | Accounts die zich in de gesloten pilot registreren vanaf de startdatum S (§3.5; standaard 2 december 2026) tot en met T van hun eigen kalender (§3.1), niet `is_team` en niet afgemeld voor het onderzoek (§8.1) | Alle experimentele vergelijkingen |
| **Go/no-go-cohort** | Experimentpopulatie met registratie op S tot en met 13 december 2026 (bij een start op 2 december: 2–13 december; bij de uiterste start op 9 december: 9–13 december; §3.5) | D7 en D30 in het lanceringsbesluit, de stopregels en voorwaarde (e) |
| Late instromers | Experimentpopulatie met registratie na het go/no-go-venster | ITT-analyse, apart gerapporteerd |
| **Januari-actieven** | Experimentpopulatie met ≥ 2 sessiedagen in de focusdagen **T − 13 tot en met T − 7** van de eigen kalender: de eerste week van de prijsperiode, vóór de aankondiging van de bonusstop, het Belofte-aanbod en de bekendmaking van de rustperiode-groep op T − 6 (besluit founder na ronde 3, G-MF2) | Voorwaarden (c) en (d), H3 secundair |
| **Uitbreidingscohort** | Wie zich registreert ná T van de eigen kalender, en iedereen die via de gecontroleerde uitbreiding binnenkomt (besluit founder, G-S14 na ronde 2) | Niet in de experimenten; alleen de operationele maten van de uitbreiding. Wie bij een squad in de rustperiode-arm komt, verdient **persoonlijk doorlopend punten** (besluit founder na ronde 3, jurist should-fix 3); dat ziet hij vóór het aansluiten |
| 16- en 17-jarigen | `age_band = 16_17` op de dag van toewijzing | Altijd arm A en buiten de rustperiode-arm (in een rustsquad persoonlijk doorlopende punten, besluit founder na ronde 3, G-S2); wel in de Belofte- en encouragement-factor; buiten de analyse van doelbonus en rustperiode; wekelijks alleen vragen over studietijd en afleiding zolang vraag 9a niet positief is beantwoord (§8.2) |

Er is geen dag zonder regel: wie op de dag na T van zijn kalender registreert, hoort bij het uitbreidingscohort.

**Waarom de januari-actieven op T − 13 tot en met T − 7.** In ronde 2 lag het venster op T − 6 tot en met T. Op T − 6 gebeurt de behandeling: de stop van de doelbonus wordt aangekondigd, de vroege arm krijgt het Belofte-aanbod en elke squad hoort of ze in de rustgroep zit. Selecteren op activiteit in die week geeft vertekening in elke analyse met de januari-actieven als noemer (gedragswetenschapper ronde 3, must-fix 2). De week ervoor is de eerste week van de prijsperiode (§3.4): er is echte vraag, maar nog geen behandeling.

**Kalender van het go/no-go-cohort.** Dag 0 is de registratiedag. **D7 is minstens één goedgekeurde sessie op dag 6, 7 of 8** (besluit founder na ronde 3, G-S8). De vakantiepauze is 21 december 2026 – 3 januari 2027 (werkhypothese, spec §5).

| Registratie | D7-venster (dag 6–8, kalender) | D30 (kalender) |
|---|---|---|
| 2 december | 8–10 december | 1 januari (vakantiepauze) |
| 6 december | 12–14 december | 5 januari |
| 9 december | 15–17 december | 8 januari |
| 13 december | 19–21 december (21 december is de eerste dag van de vakantiepauze) | 12 januari |

Gevolg dat we hier vastleggen: het D7-venster van het hele go/no-go-cohort ligt vóór de vakantiepauze, met als enige uitzondering dag 8 van wie op 13 december registreert. De vakantiepauze bevriest streaks en doelbonus, niet het tellen van sessies, dus een sessie op 21 december telt gewoon voor D7. D30 op kalendertijd valt voor dit cohort in de vakantiepauze of in de blok- en tentamenweken en meet daar vooral de tentamenkalender. We rapporteren D30 daarom altijd op kalendertijd én met overgeslagen vakantiedagen, en gebruiken voor de stopregel de D30 **buiten de tentamenweken**, gemeten in het na-seizoensvenster van de eigen kalender (§3.1), dat voor het hele cohort na dag 30 ligt. Bij de januarivariant van de schuifregel gelden andere data (§3.5).

## 3. Kalender van de pilot

### 3.1 De kalenderregel per vereniging

**Bron.** De tentamenkalender per vereniging is de bron van T, N en A (besluit founder na ronde 3, G-MF3; architectuur §3.4, `exam_calendar`). Waar de kalender per faculteit verschilt, legt de beheerder per faculteit een kalender vast en hangt de vereniging aan de kalender van haar faculteit (besluit founder na ronde 3, G-S6). Er staan geen vaste data voor bonusstop, Belofte-aanbod, rustperiode, prijsperiode of registratiegrens meer in de parameters; die volgen uit de kalender.

**Welke kalender een eenheid volgt.** Een squad volgt de kalender van haar vereniging; heeft de squad geen vereniging, dan die van de vereniging van de maker. Een solo-gebruiker volgt de kalender van zijn vereniging. Een eenheid zonder vereniging volgt de **standaardkalender**: de enige plek waar nog vaste data staan (besluit founder na ronde 3, G-MF3). De data van de standaardkalender maakt Rewarded vóór de start bekend **[in te vullen vóór 2 december]**; werkhypothese productteam, gelijk aan de aanname van het juridische team (gebruiksvoorwaarden §1.5): de data van de laatst eindigende pilotkalender. Dit vervangt het voorstel uit ronde 2 (kalender van de instelling van de instellingsmail, anders de laatst eindigende pilotkalender). Zo ziet iedereen in een squad dezelfde data, en valt de kalender samen met de toewijzingseenheid.

Per kalender liggen deze data vast, bevestigd op de primaire pagina's van de instelling of faculteit en schriftelijk door de vereniging:

| Symbool | Betekenis |
|---|---|
| **T** | De zondag waarmee de laatste reguliere tentamenweek (maandag tot en met zondag) van de tentamenperiode in januari of februari 2027 eindigt; zo is de bonusstop om 04:00 op T + 1 altijd een maandag en valt ze samen met het einde van de prijsperiode (§3.4) |
| **N** | Na-seizoensvenster: de eerste twee volle weken (maandag tot en met zondag) na T waarin de instelling of faculteit geen tentamens of herkansingen van die periode heeft (voorstel productteam uit ronde 2, bevestiging founder open) |
| **A** | Aprilvenster: de tentamenperiode in het voorjaar van 2027 volgens de kalender van de faculteit, van de eerste tot en met de laatste tentamendag van die periode; A-start en A-einde |
| **Herkansingsdagen in A** | Dagen binnen A die de faculteitskalender aanwijst als herkansing van een eerdere periode. Ze vallen **buiten de nawerkingsmaat** (besluit founder na ronde 3, G-S6): ze tellen niet als dag van A in H3 en in voorwaarde (d), en we rapporteren ze apart. Voor de rustperiode, de aprilchallenge en het herhaalbericht verandert er niets |
| **Tussenperiode** | Weken tussen het einde van N en A-start |

Aanleiding voor de herkansingsregel, geen bron: volgens zoekresultaten van de gedragswetenschapper (pagina's niet geopend) plant Diergeneeskunde in Utrecht de herkansingen van periode 2 op 19–23 april 2027. Wie een herkansing heeft, is in die dagen actief, onafhankelijk van de steiger.

Daaruit volgt de regel (besluit founder, besluit 1 na ronde 2 en G-MF3 na ronde 3, uitgewerkt door het productteam):

| Moment | Regel |
|---|---|
| Doelbonusseizoen | Focusdagen S (§3.5) tot en met T, zonder de vakantiepauze |
| Prijsperiode Blokk-challenge | Focusdagen T − 13 tot en met T (§3.4) |
| Januari-actieven (definitievenster) | Focusdagen T − 13 tot en met T − 7 |
| Aankondiging stop doelbonus, Belofte-aanbod vroege arm, bekendmaking rustperiode-groep | Focusdag T − 6, zeven dagen vóór de bonusstop. Vanaf deze dag ligt de rustperiode-arm **per persoon** vast (§4, H3b) |
| Bonusstop | 04:00 op focusdag T + 1 |
| Rustperiode (rustperiode-arm) | Focusdagen T + 1 tot en met A-einde: geen nieuwe punten; vanaf A-einde + 1 verdient iedereen weer punten |
| Gevoeligheidsvenster steigertoets | Focusdagen T + 1 tot en met T + 14 (§4, H3b) |
| Bewakingsregel rustarm | Elke maandag van T + 1 tot en met A-einde (§8.3) |
| Pilotreflectie en welzijnsmeting 2 | Focusdagen T + 1 tot en met T + 7 |
| D30 buiten de tentamenweken, secundaire na-seizoensmaten, welzijnsmeting 3 met motivatie-items | N |
| Tweede Belofte-aanbod vroege arm | Focusdag A-start − 7 (§4, H3a) |
| Herhaalbericht met de uitweg uit de rustperiode | Focusdag A-start, één keer (§8.1) |
| Aprilchallenge en primaire nawerkingsmeting | A, voor beide rustperiode-armen gelijk; herkansingsdagen buiten de nawerkingsmaat |
| Meting na A met motivatie-items | Focusdagen A-einde + 1 tot en met A-einde + 7 (voorstel productteam) |
| Belofte-aanbod late arm | Focusdag A-einde + 1 |

### 3.2 De pilotkalenders

**[In te vullen per instelling en per faculteit waar die verschilt, bevestigd uiterlijk 18 november 2026 door de founder.]** We kiezen pilotverenigingen waarvan de kalender bij de regel past, en zeggen hier expliciet welke kalenders de pilot dekt (besluit founder, G1 na ronde 2). Een vereniging zonder bevestigde kalender krijgt geen code.

| Instelling (faculteit) | T | N | A | Herkansingsdagen in A | Venster (c) (§6.1) | Bron (primaire pagina, datum gecontroleerd) | Verenigingen |
|---|---|---|---|---|---|---|---|
| Universiteit Utrecht **[faculteit in te vullen]** | [in te vullen] | [in te vullen] | [in te vullen] | [in te vullen] | [1–14 februari of N] | [in te vullen] | [in te vullen] |
| Rijksuniversiteit Groningen **[faculteit in te vullen]** | [in te vullen] | [in te vullen] | [in te vullen] | [in te vullen] | [1–14 februari of N] | [in te vullen] | [in te vullen] |
| [hbo-instelling, in te vullen] | [in te vullen] | [in te vullen] | [in te vullen] | [in te vullen] | [1–14 februari of N] | [in te vullen] | [in te vullen] |
| Standaardkalender (eenheden zonder vereniging) | [in te vullen] | [in te vullen] | [in te vullen] | — | [1–14 februari of N] | Besluit founder | — |

Aanleiding, geen bron: volgens zoekresultaten van de gedragswetenschapper (pagina's niet geopend) loopt periode 2 van de Universiteit Utrecht van 16 november 2026 tot en met 7 februari 2027, met data die per faculteit verschillen, begint de tentamenperiode van een faculteit van de Rijksuniversiteit Groningen op maandag 18 januari 2027, en loopt periode 3 in Utrecht tot en met 25 april 2027, per opleiding met een eerder einde. Kloppen die, dan ligt T voor Utrecht rond 7 februari en voor Groningen eind januari, en valt het lanceringsbesluit niet vóór 8 februari (**aanname**). In Utrecht valt N dan in de eerste weken van periode 3, met colleges; dat rapporteren we zo.

### 3.3 Vaste data en termijnen

| Datum | Wat |
|---|---|
| Deze week (vanaf 4 november 2026) | Vragen 2 en 3 naar de advocaat ("direct"), inclusief de rustperiode tot en met het aprilvenster en het mogelijke samenvallen met tentamenweken (founder J7, G-S8) |
| Uiterlijk 18 november 2026 | Tentamenkalenders van de pilotinstellingen bevestigd op de primaire pagina's, per faculteit waar ze verschillen (founder); minimum aan eigen middelen voor de vier poorten beschikbaar (werkhypothese €12.000; businessplan §10), anders schuift de start (§3.5) |
| Vóór 25 november 2026 | Poweranalyse met de opdracht uit §4.0 (statisticus); marge δ, gevoeligheidsgrens en Holm-uitwerking (statisticus, §4); correctiemethode voor herhaald kijken en drempel voor differentiële uitstap (statisticus); red-teamdag met de scenario's uit §7.5; oordeel advocaat over arm B en de rustperiode-arm; toesteltest; stopregel arm B, minimum-n en welzijnsgrens vastgesteld (§8.3; founder met statisticus en onderzoeker); prijslijst, vrijgaveschema en impliciete puntwaarde (§5.4); gesprek met Hold, uitkomst vastgelegd (businessplan §7; §11) |
| Vóór 1 december 2026 | DPIA ondertekend; pilotbeheerder geworven, zonder belang bij een deelnemende vereniging (§7.1); antwoord advocaat op vraag 9a (§8.2) |
| Vóór 2 december 2026 | Vaste data uit de parameters gehaald en de kalenderregel in de code (architectuur §12.5); toewijzings- en grootboekcode bevroren en onafhankelijk gereviewd; A/A-controle op de bevroren code en de echte KPI-query's, met twee kalenders met een verschillende T (§9.3); randomisatieseed vastgelegd (§9.2); hogere drempels voor campus en CGNAT en drempels van H12 op de seed (§7.6); de investeerder bevestigt de lezing van (c), (d) en (f); deze voorregistratie vastgelegd |
| 2 december 2026 (uiterlijk 9 december; §3.5) | Start gesloten pilot (R1); start doelbonus; start registratievenster go/no-go-cohort |
| 13 december 2026 | Einde registratievenster go/no-go-cohort |
| 21 december 2026 – 3 januari 2027 | Vakantiepauze (doelbonus, streaks, Belofte-dagen en pauzetellers bevroren) |
| Vóór 4 januari 2027 | Instellingsanker uniek per adres (HMAC, alleen HMAC en domein bewaard) en H12 op overlap over de hele sessieduur live (§7) |
| Vóór 19 januari 2027 | Commercieel criterium (§5.3) |
| Per kalender, volgens §3.1 | Prijsperiode, januari-actieven, Belofte-aanbod, bonusstop, rustperiode, gevoeligheidsvenster, reflectie, N, tweede Belofte-aanbod, herhaalbericht, A |
| Dag na T van de laatst eindigende kalender | Lanceringsbesluit (§5) |
| Vóór de bekendmaking van de aprilchallenge | Rewarded vraagt per vereniging zelf het actuele externe ledental op (challengevoorwaarden A14.3) |
| Vóór 1 mei 2027 | Voorwaarde (a) (§6.1) |
| 1 mei – 1 september 2027 | Variant "te laat maar echt" (§6.1) |
| Na A van alle kalenders (werkhypothese: mei 2027) | Bedrijfsbesluit (§6) |
| Uiterlijk 15 juni 2027 | Ruwe events samengevat (spec §4.10, DPIA) |

### 3.4 Prijsperiode van de Blokk-challenge

De prijsperiode van een vereniging is de twee focusweken die eindigen op T van haar kalender (T − 13 tot en met T); de score is het gemiddelde van de twee weken (voorstel productteam uit ronde 2). Verenigingen in één poule worden bij voorkeur ingedeeld op dezelfde kalender; lukt dat niet, dan vergelijkt de ranglijst scores over elk eigen venster, en dat staat vooraf in de challengevoorwaarden. Het aanloopklassement zonder prijs loopt van de start tot de vakantiepauze, voor iedereen gelijk.

### 3.5 Schuifregel en schrapvolgorde (besluit founder na ronde 3, G-MF3 en investeerder MF2)

**Wanneer de start schuift.** De pilot start pas als de poorten dicht zijn: DPIA ondertekend, voorregistratie vastgelegd, kalenderregel in de code, toewijzings- en grootboekcode bevroren en onafhankelijk gereviewd, A/A-controle groen, en het minimum aan eigen middelen voor de vier poorten aanwezig (businessplan §10). Een poort wordt nooit omgezet om de datum te halen.

| Situatie | Regel |
|---|---|
| Alle poorten dicht op 2 december | Start op S = 2 december; go/no-go-cohort registratie 2–13 december |
| Een poort open op 2 december, dicht vóór of op 9 december | Start op de eerste dag S waarop alle poorten dicht zijn, uiterlijk 9 december; go/no-go-cohort registratie S tot en met 13 december, zodat het D7-venster van het cohort uiterlijk op 21 december ligt (§2) |
| Een poort open op 9 december | **Januarivariant**: de pilot start op maandag 4 januari 2027 met een verkort seizoen |

**De januarivariant** (besluit founder: start 4 januari met een verkort seizoen; de uitwerking hieronder is een **voorstel productteam**, ter bevestiging door de founder vóór 2 december, zodat de regel er ligt voordat bekend is of hij nodig is):

- Doelbonusseizoen: focusdagen 4 januari tot en met T van de eigen kalender; er valt geen vakantiepauze in.
- Go/no-go-cohort: registratie 4 tot en met 10 januari 2027 (**voorstel**); D7-venster dag 6–8, dus 10–18 januari. De lat blijft 25%, met dezelfde stopregel en hoogstens één herhaling (§5.2): het besluit van de founder noemt geen andere drempel. Het D7-venster valt dan in blok- en tentamenweken; dat rapporteren we zo.
- Aanloopklassement: vervalt. De prijsperiode blijft T − 13 tot en met T en wordt niet ingekort. Ligt T − 13 vóór 4 januari, dan doet een vereniging met die kalender in januari niet om een prijs mee en alleen aan de aprilchallenge; het verkorte seizoen geldt voor de doelbonus, niet voor de prijs. Reden: een korter venster bij een rangprijs maakt de vergelijking tussen verenigingen scheef. Dit is dezelfde regel als in challengevoorwaarden A2 en vervangt het eerdere voorstel om de score over de weken te tellen die er zijn (**voorstel productteam**, ter bevestiging door de founder vóór 2 december; de founder besloot alleen "4 januari met een verkort seizoen").
- Releases: R1, R2 en R3 starten samen op 4 januari; de vlag `rest_period` gaat alleen aan na akkoord van de advocaat, vóór de eerste bonusstop.
- Een kalender waarbij het seizoen korter wordt dan **[in te vullen door de founder met de statisticus: minimumduur van het seizoen per kalender]** doet niet mee aan H2; de andere factoren lopen door.
- D30 buiten de tentamenweken blijft gemeten in N van de eigen kalender.

**Schrapvolgorde van de factoren.** Is bij de bevriezing niet alles af, dan schrappen we eerst **arm B (H2)**: die draagt geen besluit, maar vraagt het meeste extra grootboekwerk, de stopregel, een juridische toets (vraag 2) en het minimum van 40 per arm (besluit founder na ronde 3, G-MF3). Iedereen krijgt dan arm A. Een verdere schrapping (Belofte, rustperiode-arm of squadprompt) gebeurt alleen met een gedateerd besluit van de founder in het wijzigingslog van dit document, vóór de start; de Belofte en de rustperiode-arm dragen via (f) wél een besluit. Geen factor wordt ná de start geschrapt, behalve via een stopregel (§8.3) of het oordeel van de advocaat.

## 4. Hypotheses

Per hypothese: één primaire maat, de analyse-eenheid, het kleinste detecteerbare effect en de beslisregel. De MDE's vult de statisticus in na de poweranalyse op 300–800 gebruikers (aantal uit rapport 03 §5; **aanname** tot de wachtlijst het bevestigt).

### 4.0 Opdracht aan de statisticus (vóór 25 november)

Besluit founder na ronde 3 (G-S9), aangevuld met de opdrachten uit G-MF1 en G-MF2:

1. Poweranalyse per factor met clustering op de toewijzingseenheid (squad of solo), met de uitsluitingen: 16- en 17-jarigen tellen niet mee voor doelbonus en rustperiode, en de doorlopende arm halveert de noemer voor (c) en (d).
2. De intervallen rond 20% (c) en 25% (d) bij de omvang van de januari-actieven in de doorlopende arm.
3. De marge δ voor H3b (werkhypothese founder: 10 procentpunten op de binaire maat), met een motivering in termen van wat voor een betaler ertoe doet.
4. De gevoeligheidsgrens: het minimumverschil dat het interval in het gevoeligheidsvenster moet uitsluiten.
5. De uitwerking van de Holm-correctie over H3a en H3b.
6. De correctie voor herhaald kijken bij de stopregel van arm B en de bewakingsregel van de rustarm (§8.3), en de drempel voor differentiële uitstap.
7. Het verwachte aantal solo-gebruikers (H1).

Vooraf vastgelegd: de **interactie Belofte × rustperiode is bij deze omvang niet-informatief**. We rapporteren haar als verkennende analyse en presenteren haar niet achteraf als vondst (besluit founder na ronde 3, G-S9).

### H1 — Squadeffect (encouragement design)

| Onderdeel | Inhoud |
|---|---|
| Formulering voor de pitch | "Solo-gebruikers die een sterke uitnodiging krijgen om een squad te vormen, vormen vaker een squad en zijn vaker op dag 7 actief." "Op dag 7" is in de maat het venster dag 6–8 (hieronder) |
| Toewijzing | Solo-gebruikers (registratie zonder squad- of duellink en op dag 0 niet in een squad) op dag 0 geloot 50/50: **sterke squadprompt** (op dag 1, 2 en 3 een prominente kaart "Focus samen" met een kant-en-klare WhatsApp-link en voorgestelde tekst) of **standaardflow** (de gewone ingang naar een squad) |
| Primaire maat | D7: aandeel met ≥ 1 goedgekeurde, voltooide sessie van ≥ 25 minuten op dag 6, 7 of 8, op toewijzing (besluit founder na ronde 3, G-S8) |
| Hoofdresultaat | **ITT**-schatting op D7 (besluit founder, G-S1 na ronde 2) |
| IV | Effect van squadlidmaatschap (lid op dag 7 van een actieve squad, ≥ 3 actieve leden), met de toewijzing als instrument, gerapporteerd als **bovengrens**: de kaart kan D7 ook direct verhogen als herinnering, wat de exclusierestrictie schendt |
| Verwachte omvang | Vooraf geschat aantal solo-gebruikers **[in te vullen door de statisticus, vóór 25 november]**. Ligt dat zo laag dat geen plausibel effect detecteerbaar is (de gedragswetenschapper noemt 100–200 als zone), dan is H1 beschrijvend |
| Analyse-eenheid | Solo-gebruiker |
| Verdere analyse | Binnen-persoonsanalyse van sessiedagen in de 7 dagen vóór en na het actief worden van de eigen squad, met de tentamenkalender als covariaat |
| Secundair | W3 (≥ 2 sessiedagen in dag 15–21, vakantiedagen overgeslagen), squadoverleving, K van gebruiker aan gebruiker |
| MDE | **[in te vullen na de poweranalyse]** |
| Beslisregel | ITT-effect op D7 met het 95%-interval boven nul: "de squadprompt verhoogt retentie", input voor het bedrijfsbesluit. Interval rond nul: "de sociale loop is niet aangetoond; de productloop gaat voor groei" (businessplan §12). MDE groter dan plausibel: verkennend, geen besluit |
| Wat géén go/no-go is | De ruwe vergelijking squad tegenover solo; die rapporteren we beschrijvend, ze meet vooral zelfselectie |

### H2 — Meer gehaalde dagdoelen tijdens het seizoen (doelbonus A tegenover B)

Dit is de ene redelijk gepowerde vergelijking. Ze draagt geen bedrijfsbesluit, en arm B is de eerste factor die vervalt als er geschrapt moet worden (§3.5).

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
| Formulering voor de pitch | "Na het einde van de doelbonus focussen studenten in de volgende tentamenperiode vaker als ze bij de aankondiging van de stop van de bonus een Belofte aangeboden kregen (H3a), en als ze tot en met die tentamenperiode punten bleven verdienen of juist niet (H3b, zie richting)." H3 is verkennend tot de poweranalyse anders laat zien. De "richting" van H3b is sinds ronde 3 de non-inferioriteitstoets met vier uitkomsten hieronder, zoals de pitch die onder "Hoe we de steigertoets lezen" uitlegt |
| Primaire maat (H3a en H3b) | **Binair**: aandeel met ≥ 1 sessiedag in A (sessiedag: ≥ 1 goedgekeurde, voltooide sessie van ≥ 25 minuten), **zonder de herkansingsdagen in A** (§3.1), met instroomactiviteit (sessiedagen in de eerste 7 dagen na registratie) als covariaat (besluit founder, G-S9 na ronde 2; G-S6 na ronde 3) |
| Analyse-eenheid | Toewijzingseenheid (squad of solo); geclusterd; kalender als stratum |
| Analyse | ITT tussen armen, niet vóór tegenover na |
| Meervoudig toetsen | H3a en H3b worden samen met **Holm** gecorrigeerd, met een familiewijze α van 5% (besluit founder na ronde 3, G-MF1). De precieze uitwerking (welke toets per hypothese, eenzijdig of tweezijdig) legt de statisticus vóór 25 november vast **[in te vullen]**. Werkhypothese productteam: H3a tweezijdig (vroeg tegenover laat); H3b de non-inferioriteitstoets hieronder, met het interval voor de uitkomsten "afhankelijkheid" en "verdringing" op hetzelfde Holm-niveau |
| Interactie | Belofte vroeg × rustperiode, alleen verkennend en vooraf als niet-informatief benoemd (§4.0) |

**H3a — factor Belofte.**

| Onderdeel | Inhoud |
|---|---|
| Armen | **Vroeg**: aanbod op focusdag T − 6 van de eigen kalender, zeven dagen vóór de bonusstop; bij de reflectie na 14 dagen één vooraf vastgelegd **hernieuwingsaanbod** voor nog eens 14 dagen (G-S4 na ronde 2); en een **tweede aanbod** op focusdag A-start − 7, met dezelfde tekst voor iedereen in de vroege arm, zodat in A een Belofte kan lopen (besluit founder na ronde 3, G-S10; het moment A-start − 7 is een **voorstel productteam**, in lijn met "in de week vóór het aprilvenster" in gebruiksvoorwaarden §6.3). **Laat**: aanbod op A-einde + 1. De Belofte raakt geen punten |
| Secundair | Belofte-overname, -naleving en -hernieuwing, ook naar squadstatus; overname van het tweede aanbod; de **dosis** per gebruiker (dagen onder een lopende Belofte), apart voor de dagen in A |
| MDE | **[in te vullen na de poweranalyse]** |
| Beslisregel | Verkennend tenzij de MDE plausibel is. Een effect met het Holm-gecorrigeerde interval boven nul rapporteren we als "nawerking met een Belofte"; het bepaalt de omvang van tranche 2 niet (§1) |

**H3b — factor rustperiode: de steigertoets.**

| Onderdeel | Inhoud |
|---|---|
| Armen | **Rustperiode**: van T + 1 tot en met A-einde verdient de eenheid geen nieuwe punten; daarna verdient iedereen weer (besluit 3 na ronde 2). **Doorlopend**: punten volgens de vaste ratio, met dezelfde puntwaarde en hetzelfde vrijgaveschema tot en met A (§5.4). Verdiende punten blijven in beide armen inwisselbaar. De **aprilchallenge is voor beide armen gelijk**: collectieve prijzen op deelnamegraad, geen punten. Van T + 1 tot en met A-einde zijn er voor het onderzoekscohort in geen van beide armen individuele prestatiechallenges met een prijs (challengevoorwaarden B7; **voorstel**, ter bevestiging door de founder, open punt 13). Alleen als de advocaat de arm toestaat (vraag 3); anders vervalt H3b en verdient iedereen doorlopend |
| Arm per persoon vanaf T − 6 | Vanaf de bekendmaking op T − 6 ligt de rustperiode-arm vast **per persoon**. Een overstap naar een squad met een andere arm verandert de arm niet. Stapt een lid van de rustarm over naar een doorlopende squad, dan **telt dat als uitstap uit de rustperiode** (`rest_period_exit`, bron `squad_switch`): vanaf de volgende focusdag weer punten, in de analyse op de toegewezen arm (besluit founder na ronde 3, G-S2) |
| Wie in een rustsquad persoonlijk doorlopend verdient | 16- en 17-jarigen (G-S2), leden van het uitbreidingscohort (jurist should-fix 3), wie zich afmeldde voor het onderzoek, en wie uit de rustperiode stapte. Het aandeel rustsquads met zulke leden rapporteren we, en in een gevoeligheidsanalyse laten we die squads weg (voorstel jurist ronde 3, should-fix 3) |
| Uitweg | Het rustperiodebericht op T − 6 noemt in dezelfde zin hoe je uit de rustperiode stapt en dat je dan weer punten verdient (founder J2). Op focusdag A-start tonen we **één keer** hetzelfde bericht, in dezelfde feitelijke taal en met dezelfde knop "Ik wil weer punten verdienen", zonder herinneringsreeks en zonder aandringen (besluit founder na ronde 3, jurist should-fix 4). Dat herhaalbericht is een vast onderdeel van de behandeling in de rustarm. **Uit de rustperiode stappen** is een aparte keuze: vanaf de volgende focusdag weer punten, de gebruiker blijft in het onderzoek en in de analyse op toewijzing. **Uit het onderzoek stappen** blijft daarnaast bestaan (§8.1) |
| Lekken gedicht | Samenvoegen kan alleen binnen dezelfde rustperiode-arm (spec §4.4); overstap telt als uitstap; afmelders tellen in ITT op hun eerst toegewezen arm |
| Toewijzing | Per squad of solo, onafhankelijk van de andere factoren geloot; 16- en 17-jarigen buiten de rustperiode-arm |
| **Non-inferioriteit** | Verschil Δ = (aandeel rustarm) − (aandeel doorlopende arm) op de primaire maat. Marge **δ = 10 procentpunten** (werkhypothese founder; de statisticus stelt δ vast, §4.0). H0: Δ ≤ −δ; H1: Δ > −δ |
| **Gevoeligheidstoets** | "De rustarm scoort niet slechter" betekent alleen iets als punten in de doorlopende arm aantoonbaar iets doen. Daarom vooraf: in het **gevoeligheidsvenster T + 1 tot en met T + 14** (de eerste twee weken na de bonusstop, als de punten in de rustarm net wegvallen) vergelijken we de sessiedagen per week tussen de armen. De toets is gehaald als de doorlopende arm hoger scoort en het interval een verschil van **[in te vullen door de statisticus: minimum]** uitsluit. Venster en maat zijn een **voorstel productteam**: de founder noemde "N of de eerste twee weken na T + 1"; we kiezen de twee weken na T + 1 omdat het contrast daar het zuiverst is, en rapporteren N als gevoeligheidsanalyse. De founder bevestigt de keuze vóór de vastlegging |
| **Vier uitkomsten** | Zie de tabel hieronder. Elke uitkomst heeft een vast gevolg voor (f) (§6.1) |
| Secundair | (1) Sessiedagen per week in A; (2) aandeel januari-actieven met ≥ 2 sessiedagen per week in N; (3) sessiedagen per week in de tussenperiode; (4) terugkeer in de week vóór A-start (aandeel met ≥ 1 sessiedag in die week onder wie in de 21 dagen daarvoor geen sessie had); (5) intrinsieke motivatie en niet-beloond studeren in N en na A, per arm (§8.4); (6) welzijn en zelfrapportage (§8.4); (7) **uitstap per arm** als uitkomst: uit de rustperiode stappen (ook via een overstap) en uit het onderzoek stappen, apart en samen; (8) reactivering van squads in A per rustperiode-arm (§6.2); (9) de herkansingsdagen in A apart |
| Differentiële uitstap | Is het verschil in uitstap tussen de rustperiode-arm (rustuitstap, ook via een overstap, plus afmelding) en de doorlopende arm (afmelding) groter dan **[in te vullen door de statisticus, vóór 25 november; werkhypothese productteam: 15 procentpunt]**, dan is H3b niet te interpreteren en rapporteren we alleen beschrijvend; de uitkomst is dan "onbeslist". Gevoeligheidsanalyse met uitstappers als "niet actief" (founder J2) |
| MDE | **[in te vullen na de poweranalyse]** |

**De vier uitkomsten van de steigertoets** (besluit founder na ronde 3, G-MF1; de rangorde bij overlap is een **lezing productteam**):

| Rangorde | Uitkomst | Wanneer (Holm-gecorrigeerd interval van Δ) | Gevolg voor (f) |
|---|---|---|---|
| 1 | **Verdringing** | De rustarm scoort significant beter: de ondergrens van het interval ligt boven 0 | Volle tranche met een kleinere beloningslaag; geen pijler van de verdediging, wel een signaal tegen het beloningsmodel. Hoeveel kleiner de beloningslaag wordt: **[in te vullen door de founder vóór 2 december]** (businessplan §10, open punt) |
| 2 | **Afhankelijkheid** | De rustarm scoort significant slechter: de bovengrens van het interval ligt onder 0 | Tranche beperkt tot €180.000 (scenario 4) en native uitgesteld, ook de Android-stap |
| 3 | **Steiger ondersteund** | De rustarm is niet slechter binnen δ (de ondergrens ligt boven −δ) **en** de gevoeligheidstoets is gehaald | Volle tranche (€360.000); native volgens plan, eerst Android UsageStats, daarna iOS |
| 4 | **Onbeslist** | Al het andere: ook als de gevoeligheidstoets niet gehaald is, als de differentiële uitstap boven de drempel ligt, of als de ondergrens onder −δ ligt zonder dat de bovengrens onder 0 ligt | Beperkte tranche (€180.000, scenario 4); als eerste native stap alleen Android UsageStats (lezing strategieteam in businessplan §10; de founder bevestigt) |

Waarom een rangorde: de founder beschreef de uitkomsten in woorden, en twee kunnen tegelijk waar zijn. Een ondergrens boven 0 ligt ook boven −δ (verdringing en "niet slechter"); een bovengrens onder 0 kan samengaan met een ondergrens boven −δ (significant slechter, maar binnen de marge). De founder noemt "rustarm significant slechter" afhankelijkheid en "rustarm beter" verdringing; die gaan daarom voor. Afhankelijkheid en verdringing vragen geen gevoeligheidstoets: een significant verschil laat al zien dat punten iets doen.

**Als H3b vervalt** (geen akkoord van de advocaat, of de arm stopt via de bewakingsregel, §8.3): dan is er geen steigertoets. Lezing productteam, ter bevestiging door de founder en de investeerder: dat valt onder "al het andere", dus **onbeslist**, met de beperkte tranche. Stopt de arm via de bewakingsregel, dan rapporteren we H3b beschrijvend tot het moment van stoppen.

### H4 — Fraude blijft beheersbaar (operationeel)

Formulering voor de pitch: "Het geschatte aandeel frauduleuze accounts uit de onafhankelijke steekproef blijft onder 5%, ook aan de bovenkant van het betrouwbaarheidsinterval." Primaire maat: het geschatte aandeel frauduleuze accounts uit de onafhankelijke steekproef (§7.1), met 95%-interval. Beslisregel op de **bovengrens** van dat interval (§5.1; founder J4). Er is **één fraudegrens**, in de pilot en in de uitbreiding: de bovengrens moet onder 5% liggen (besluit founder na ronde 3, jurist should-fix 5; §7.7). Het aandeel gemarkeerde sessies is een maat voor de wachtrijlast, geen go/no-go. De schatting rapporteren we als ondergrens van de werkelijke fraude, naast de uitkomst van de red-teamdag: ze ziet alleen wat de lichte controle kan zien.

## 5. Lanceringsbesluit (na de laatste tentamenweek van het laatst eindigende pilotcohort)

### 5.1 Maten en drempels

| Maat | Definitie | Drempel |
|---|---|---|
| Activatie | Accounts met een goedgekeurde sessie van ≥ 25 minuten binnen 24 uur na registratie, gedeeld door alle registraties (experimentpopulatie); de oefensessie telt niet | ≥ 60% |
| D7 go/no-go-cohort | Aandeel van het go/no-go-cohort met ≥ 1 goedgekeurde sessie op dag 6, 7 of 8 (besluit founder na ronde 3, G-S8) | **≥ 25%, vaste lat** (besluit founder, MF1e en G-S2 na ronde 2). De drempel verandert niet door de nieuwe definitie. De encouragement-vergelijking per kanaal (D7 van de standaardflow) rapporteren we, als drempel gebruiken we haar niet |
| Geschatte fraude | Onafhankelijke steekproef (§7.1), cumulatief tot en met het lanceringsbesluit | **Bovengrens van het 95%-interval < 5%** (§7.7) |
| Kosten | Kosten van verzilveringen, verdiende prijzen en verenigingsprijzen van de gesloten pilot, tegen de post | **Binnen het pilottotaal van €1.500** (werkhypothese; besluit founder, G3). De weekmaat geldt in de pilot niet (§5.4) |
| Deelnemersbescherming | Geen stopregel of bewakingsregel uit §8.3 geraakt | Geen |
| Absolute schadegrens | Per week: gebruikers met ≥ 1 schadesignaal S1–S4, gedeeld door gebruikers met ≥ 1 goedgekeurde sessie in die week, over beide armen; **per code naast elkaar gerapporteerd** (besluit founder na ronde 3, G-S5) | **< 2% in elke pilotweek**, werkhypothese tot de ijking (§8.3) |

### 5.2 Stopregels en besluit per uitkomst

| Uitkomst | Besluit |
|---|---|
| D7 go/no-go-cohort < 15% | **Stopregel:** geen uitbreiding en geen tweede tranche |
| D7 tussen 15% en 25% | **Hoogstens één herhaling**: de productloop wordt gerepareerd en een nieuw cohort (registratievenster van 12 dagen, uitnodiging via de wachtlijst in de pilotsteden) wordt gemeten met dezelfde definities; de herhaling valt buiten de experimenten (voorstel productteam). Haalt de herhaling geen 25%, dan geldt de stopregel. Geen tweede herhaling |
| Bovengrens geschatte fraude ≥ 5% | Geen uitbreiding in het kanaal met de hoogste geschatte fraude; de beloningen in de gratis laag van de **uitbreiding** omlaag tot native verificatie er is (voorstel: europlafonds en vrijgave voor nieuwe gebruikers halveren). Het vrijgaveschema van het onderzoekscohort blijft vast |
| Activatie < 60% | Uitbreiding uitgesteld tot de onboarding is aangepast en een nieuw cohort ≥ 60% haalt |
| Kosten boven het pilottotaal | Geen nieuwe catalogusitems zonder geboekte dekking; de prijzen van een volgende challenge omlaag. **"Weekvrijgave verlagen" is tijdens het experiment geen toegestaan besluit**: het zou de behandeling midden in de meting veranderen (besluit founder, G3) |
| De stopregel van arm B geraakt (§8.3) | Arm B stopt; geen uitbreiding totdat de founder en de onderzoeker het signaal hebben beoordeeld |
| De bewakingsregel van de rustarm geraakt (§8.3) | De vlag `rest_period` gaat uit; iedereen verdient vanaf de volgende focusdag weer punten; H3b wordt beschrijvend (§4) |
| Schadegrens ≥ 2% in een week | Geen uitbreiding vóór beoordeling door de onderzoeker volgens de vooraf vastgelegde criteria (§8.3); de grens geldt ook tijdens de uitbreiding |

### 5.3 Commercieel criterium (businessplan §7, besluit 2 na ronde 1, MF1b na ronde 2)

Vóór 19 januari 2027: ≥ 3 getekende intentieverklaringen van budgethouders, die elk een prijs van minstens €8 per seat per tentamenperiode (of €24 per seat per jaar) en minstens 150 seats noemen, met minstens één betaler die niet afhangt van een aandringend bestuur; en 10–15 budgethoudergesprekken vastgelegd volgens de gespreksleidraad van het businessplan §7, elk met het **toekenningsmoment** van het budget (een gesprek zonder toekenningsmoment telt niet). Niet gehaald: "geen aangetoonde betaler", geen draai naar werkgevers, en voorwaarde (b) voor de tweede tranche is niet vervuld. Dit criterium is geen productmaat; het staat hier zodat alle beslisregels op één plek staan.

### 5.4 Kosten, vrijgaveschema, puntenprijzen en schaarste (besluit founder, G3 en MF5 na ronde 2; G-S4 na ronde 3)

De pilot meet "beloning", geen "punten als score". Daarom liggen de economie en de beschikbaarheid van beloningen vooraf vast en veranderen ze niet tijdens het experiment.

| Post | Voor wie | Bedrag | Regel |
|---|---|---|---|
| Pilotprijzen en catalogus gesloten pilot | Experimentpopulatie, tot en met de bonusstop van de eigen kalender | €1.500 (werkhypothese) | Voorgefinancierd; vast vrijgaveschema; buiten de weekmaat |
| Catalogus onderzoekscohort februari tot en met april | Experimentpopulatie | €4.000 (werkhypothese) | Eigen voorraad, gescheiden van die voor nieuwe gebruikers |
| Aprilchallenge onderzoekscohort | Verenigingen van de experimentpopulatie | €2.500 (werkhypothese) | Collectieve prijzen op deelnamegraad, voor beide rustperiode-armen gelijk |
| Gratis laag van de uitbreiding | Uitbreidingscohort | Binnen de post gratis laag (businessplan §10) | Eigen voorraad; weekmaat ≤ €0,06 per wekelijks actieve gebruiker per week (werkhypothese, **aanname**), alleen vanaf de uitbreiding |

**Vast vrijgaveschema.** Per post de voorraad per week (aantal vouchers per item, gespreid over de week, het deel dat gereserveerd is voor het instellingsanker) en de puntenprijzen: **[in te vullen bij de prijslijst, uiterlijk 25 november, en vóór 2 december hier vastgelegd]**. Het schema is gelijk voor alle armen en hangt niet af van tussentijdse kosten. In de doorlopende arm blijven de puntwaarde en het vrijgaveschema gelijk tot en met A (besluit founder, MF5). Niet-verzilverde vouchers van een week blijven in dezelfde post beschikbaar; het schema wordt niet verlaagd en niet verhoogd (voorstel productteam). De catalogus toont per week de vrijgegeven voorraad naast het aantal studenten dat mag verzilveren, en de schaarste staat vooraf in de onboarding (founder J10).

**Impliciete waarde per punt en schaarste** (besluit founder na ronde 3, G-S4: "nu berekenen en per arm rapporteren hoeveel gerechtigden niets konden verzilveren"). De berekening volgt deze regels; de getallen zijn pas definitief met de prijslijst:

| Grootheid | Formule | Stand 5 november (eindredactie ronde 3) |
|---|---|---|
| Budgetwaarde per punt | Beloningsbudget van de post ÷ verwachte geverifieerde minuten in de post (spec §4.3) | **[in te vullen bij de prijslijst]**: de verwachte minuten zijn een teamaanname die nog niet is gemaakt |
| Punten per euro kostprijs | 1 ÷ budgetwaarde per punt | Idem |
| Focusuren per goedkoopste item | Puntenprijs van het goedkoopste item ÷ 60 (1 punt per geverifieerde minuut) | Idem |
| Verenigingsprijzen uit de post | Aantal poules × €150 (hoofdprijs) + aantal verenigingen × €75 (drempelprijs), in het duurste geval dat elke vereniging de drempel haalt (challengevoorwaarden A6) | **Rekensom productteam.** De pilot neemt vijf verenigingen aan (de go/no-go-ondergrens, businessplan §7; **werkhypothese**). Met minstens drie verenigingen per poule (challengevoorwaarden A5.2) is dat één poule: €150 + 5 × €75 = **€525**. Bij een gedeelde eerste plaats (A7, voorstel) €675. Ter vergelijking: bij tien verenigingen in drie poules €1.200 (de rekensom van de jurist in ronde 2) |
| Beloningswaarde per gerechtigde over het seizoen | (€1.500 − verenigingsprijzen) ÷ aantal gerechtigden | **Rekensom productteam.** Bij vijf verenigingen blijft **€975** aan catalogus (€825 bij een gedeelde eerste plaats). Voor 300–800 gebruikers (**aanname**, §4) is dat ongeveer €1,20 tot €3,25 per gebruiker over het hele seizoen (€975 ÷ 800 tot €975 ÷ 300). Bij tien verenigingen in drie poules blijft €300, ongeveer €0,40 tot €1,00 per gebruiker. Individuele prestatieprijzen (challengevoorwaarden deel B) gaan er nog af als ze in de gesloten pilot uit deze post komen **[in te vullen bij de prijslijst]**. Het getal geldt voor het aantal verenigingen dat op 1 december schriftelijk heeft toegezegd; komen er meer, dan rekenen we met dezelfde formule opnieuw vóór de vastlegging. Dit getal nemen de gebruiksvoorwaarden (§5.5) en de challengevoorwaarden (A7) over. Hoe dan ook is "Vandaag op" de normale ervaring |
| **Gerechtigden zonder verzilvering** | Per week en per arm: gerechtigden (voorbij inverdienperiode en wachttijd, weekplafond nog vrij) die die week geen voucher konden verzilveren omdat de voorraad op was, gedeeld door alle gerechtigden van die week | Gerapporteerd per arm, per post en per kalender (§10); geen drempel |

Op de wachtlijst toetsen we niet alleen of studenten de omrekening naar een uurloon spontaan maken, maar ook hoe ze schaarste beleven (gedragswetenschapper ronde 3, should-fix 4; de vraag staat in de wachtlijsttest van het productplan §4).

## 6. Bedrijfsbesluit na het aprilvenster

### 6.1 Bindende voorwaarden voor de tweede tranche (besluit founder, MF1 na ronde 2, herzien na ronde 3)

Dezelfde getallen als in het businessplan §10. Tranche 2 komt alleen vrij als **alle** voorwaarden (a)–(e) gehaald zijn en geen stopregel geraakt is (D7, D30, deelnemersbescherming); (f) bepaalt de omvang. Er staat geen "werkhypothese" bij deze voorwaarden, behalve bij δ (§4).

| | Voorwaarde | Meting |
|---|---|---|
| **(a)** | Vóór 1 mei 2027 is er minstens één getekende opdracht van minstens **€4.000 opdrachtwaarde of minstens 500 seats**, bij een betaler die niet afhangt van een aandringend bestuur; of er zijn **twee getekende opdrachten** (besluit founder na ronde 3, investeerder S1). **Variant "te laat maar echt"**: een opdracht die tussen 1 mei en 1 september 2027 wordt getekend, telt voor een beperkte tranche 2 (€180.000, scenario 4), mits (b)–(e) gehaald zijn (besluit founder na ronde 3, investeerder S3; lezing strategieteam: met dezelfde ondergrens als (a)). Is er op 1 september 2027 geen getekende opdracht, dan geen tweede tranche | Getekend document met datum en opdrachtwaarde of seats |
| **(b)** | Elke intentieverklaring noemt een prijs van minstens €8 per seat per tentamenperiode (of €24 per seat per jaar) en minstens 150 seats; minstens één betaler hangt niet af van een aandringend bestuur | §5.3 |
| **(c)** | Minstens 20% van de januari-actieven (§2) **in de doorlopende arm** heeft in 1–14 februari 2027 minstens twee sessiedagen per week. Overlapt 1–14 februari voor een kalender met de laatste tentamenweek (T − 6 tot en met T) of met de herkansingen van die periode, dan is het venster voor die kalender N; het getal blijft. De rustarm rapporteren we apart (besluit founder na ronde 3, G-MF2). (c) vraagt gebruik buiten het seizoen. Dat is een **bewuste keuze van de investeerder**, terwijl het product de hersamenstelroute buiten het seizoen pauzeert en het model buiten de tentamenperiode met 8% actieve seats rekent (besluit founder na ronde 3, G-S7) | Aandeel januari-actieven in de doorlopende arm met ≥ 2 sessiedagen in elk van de twee weken van het venster van de eigen kalender; welk venster per kalender geldt, staat in §3.2 |
| **(d)** | Minstens 25% van de januari-actieven **in de doorlopende arm** keert in het aprilvenster terug. De rustarm rapporteren we apart (G-MF2). We rapporteren (d) ook voor deelnemers zonder vereniging, zodat zichtbaar is hoeveel de aprilchallenge en de promotie door besturen bijdragen (besluit founder na ronde 3, investeerder S5) | Aandeel januari-actieven in de doorlopende arm met ≥ 1 sessiedag in A van de eigen kalender, zonder de herkansingsdagen (§3.1) |
| | Bij (c) en (d): de doorlopende arm halveert de noemer. De statisticus rekent de intervallen rond 20% en 25% bij die omvang uit (§4.0), en de investeerder bevestigt vóór 2 december dat (c) en (d) op de doorlopende arm beslissen. Vervalt de rustperiode-arm, dan is de doorlopende arm iedereen (lezing productteam) | |
| **(e)** | D7 van het go/no-go-cohort (minstens één sessie op dag 6–8) ≥ 25% als vaste lat, met hoogstens één herhaling in de zone 15–25% | §5.1 en §5.2; de encouragement-vergelijking wordt gerapporteerd, niet als drempel gebruikt |
| **(f)** | De uitkomst van de steigertoets (H3b, §4) bepaalt de omvang van tranche 2: **verdringing** → volle tranche met een kleinere beloningslaag; **afhankelijkheid** → €180.000 en native uitgesteld, ook de Android-stap; **steiger ondersteund** → volle tranche, native volgens plan (eerst Android UsageStats); **onbeslist** → €180.000, als eerste native stap alleen Android UsageStats. H3a bepaalt de omvang niet. De investeerder bevestigt deze lezing vóór 2 december (besluit founder na ronde 3, G-MF1) | Tabel "De vier uitkomsten van de steigertoets" in §4; de beperkte tranche heeft de begroting van scenario 4 in het businessplan §10 |

**Stopregel D30.** D30 buiten de tentamenweken: aandeel van het go/no-go-cohort met ≥ 1 goedgekeurde sessie in N van de eigen kalender. **Onder 6% betekent geen tweede tranche en geen opschaling.**

**Hold-gesprek.** De founder vraagt vóór 25 november 2026 een oud-medewerker of founder van Hold waarom instellingen niet betaalden (besluit founder na ronde 3, investeerder S8). Verandert de uitkomst iets aan (a) of (b), dan komt dat vóór de vastlegging als gedateerde regel in het wijzigingslog, met de reden **[in te vullen door de founder]**; tot dan gelden (a) en (b) zoals hierboven.

### 6.2 Verkennende uitkomsten en overige vooraf vastgelegde regels

Primair verkennend: H3 (nawerking in A). Daarnaast: H1, H2, squadoverleving, **reactivering van squads in de volgende tentamenperiode** (aandeel squads met ≥ 2 actieve leden in A, onder de squads die in T − 13 tot en met T van hun kalender ≥ 2 actieve leden hadden), **per rustperiode-arm** als KPI (besluit founder na ronde 3, G-S11), **deelnamegraad per vereniging** (§10), K van gebruiker aan gebruiker, de welzijnsmeting, de motivatie-items en de uitstap per arm. Een verkennende hypothese draagt geen besluit, behalve H3b via (f).

| Vooraf vastgelegd | Regel |
|---|---|
| **Actieve seat** (besluit founder, S5 na ronde 2) | Een seat met minstens twee sessiedagen per week in de tentamenperiode. Dezelfde definitie in dashboard, contract en deze voorregistratie. In de pilot is de nabije maat de deelnamegraad per vereniging (§10), naast de 30% uit het financierbare punt |
| **Plus-nepdeur** (besluit founder, S7 na ronde 2) | Schrijft minder dan 5% van de D30-actieven (go/no-go-cohort met een sessie op dag 30 of in N) zich in via de nepdeur, dan verdwijnt Plus als bron uit de pitch |

## 7. Fraude

### 7.1 Onafhankelijke steekproef

| Onderdeel | Inhoud |
|---|---|
| Steekproef | Elke maandag 30 accounts, willekeurig getrokken uit de accounts met ≥ 1 voltooide sessie in de afgelopen week, gestratificeerd per vereniging, plus een stratum "geen vereniging" en, vanaf het lanceringsbesluit, **het uitbreidingscohort als eigen stratum** (besluit founder na ronde 3, jurist should-fix 5), proportioneel naar het aantal actieve accounts, minstens één per stratum met ≥ 5 actieve accounts |
| Uitvoering | De pilotbeheerder (businessplan §10), met de founder als tweede beoordelaar. De pilotbeheerder is **geen lid van een deelnemende vereniging, geen ambassadeur en geen deelnemer**, en meldt per steekproefitem een persoonlijk belang; dat item gaat dan naar de tweede beoordelaar (besluit founder na ronde 3, jurist should-fix 6; geheimhoudingsverklaring pilotbeheerder) |
| Trekking | Met de randomisatieseed (§9.2) en het weeknummer, zodat elke steekproef achteraf te reproduceren is |
| Lichte controle | (1) Bevestigd instellingsmailadres of geverifieerd mobiel nummer; (2) nummertype mobiel; (3) sessiepatroon (tijden, duur, claimvertraging, toestel, H12); (4) kort contact met de vraag om squad of vereniging te bevestigen, **via het instellingsadres als het account een instellingsanker heeft**: de app vraagt de student het adres opnieuw te bevestigen met een code, en de HMAC van het ingevulde adres moet gelijk zijn aan de opgeslagen HMAC (§7.8); anders via het accountadres |
| Criteria per oordeel | Zie §7.2; door een mens, met redencode |
| Gevolg voor de student | Een oordeel "verdacht" of "frauduleus" leidt tot een normale beoordeling in de fraudewachtrij met beroep (spec §6.4–6.5); de steekproef zelf boekt niets |
| Schatting | Aandeel "frauduleus" (en apart "frauduleus of verdacht") met 95%-interval, gewogen naar de strata, per week en cumulatief, voor het onderzoekscohort en het uitbreidingscohort apart en samen; gerapporteerd als ondergrens |
| Gevoeligheidsanalyse | Alle KPI's en alle hypotheses ook zonder de accounts die de steekproef als verdacht of frauduleus aanmerkt |
| Wachtrijlast | Aandeel gemarkeerde sessies en doorlooptijd van besluiten, per week; geen go/no-go |

### 7.2 Criteria per oordeel (founder J4 na ronde 2)

Vastgelegd zodat de beoordelaar niet per week een andere lat legt. Voorstel productteam; de founder bevestigt vóór 2 december.

| Oordeel | Criteria (één volstaat, tenzij anders vermeld) |
|---|---|
| Geen aanwijzing | Anker bevestigd of contact bevestigt squad of vereniging, en geen van de criteria hieronder |
| Verdacht | Geen anker én geen reactie op het contact binnen 7 dagen; of een open markering H2, H7, H9, H10, H11 of H12 in de week; of het sessiepatroon wijkt sterk af (nachtpatroon H6, claimvertraging H9) zonder verklaring; of een geweigerde poging om een instellingsadres te bevestigen dat al bij een ander account hoort (`INSTITUTION_EMAIL_IN_USE`) |
| Frauduleus | Twee of meer van: telefoonhash gedeeld met een ander account, H12 met een account dat al frauduleus is, contact ontkent lidmaatschap van de opgegeven squad of vereniging, toestel of user-agentklasse van de sessies wijkt af van die van registratie en inloggen, de herbevestiging geeft een ander instellingsadres dan het verankerde (HMAC ongelijk); of een bevestigde blokkade |

Ronde 3: het criterium "instellingsdomein met een overlappend patroon" vervalt; alle studenten van één instelling delen het domein (jurist ronde 3, should-fix 1). Met de HMAC per adres kan één adres maar één account verankeren, en ziet de herbevestiging of het hetzelfde adres is.

### 7.3 Verplichte steekproef bij prijzen

Bij elke hoofdprijswinnaar en bij elke vereniging die de drempel haalt: een steekproef van 20 meegetelde leden (of allemaal bij minder dan 20), met dezelfde lichte controle, plus twee stappen (founder J1 na ronde 2): **(1) toestelvergelijking**: het toestel en de user-agentklasse van de sessies in de prijsperiode worden vergeleken met die van registratie en inloggen; **(2) oefensessie op de eigen telefoon**: het steekproeflid start vanaf de eigen telefoon één oefensessie van één minuut, die alleen als controle telt. In de prijssteekproef betekent niet reageren dat het lid niet in de teller telt (challengevoorwaarden A8.3); in de wekelijkse steekproef heeft niet reageren geen gevolg. De uitslag is pas definitief na deze steekproef (spec §4.6–4.7).

### 7.4 Gerichte steekproef vóór elke ambassadeursuitbetaling (besluit founder na ronde 3, jurist should-fix 7)

Vóór elke uitbetaling trekt de beheeromgeving per ambassadeur vijf meegetelde accounts (of alle, bij minder dan vijf), met de seed en de maand, en controleert de pilotbeheerder die met de lichte controle uit §7.1 plus de toestelvergelijking uit §7.3. Een account met oordeel "verdacht" of "frauduleus" telt niet mee voor de vergoeding. Er is **geen uitbetaling zolang het instellingsanker niet uniek is per adres** (§7.8; oordeel jurist ronde 3), en geen betaalde ambassadeurs zonder fiscale route en getekende overeenkomst (businessplan §9). Deze steekproef telt niet mee in de schatting van §7.1.

### 7.5 Red-teamdag (vóór 25 november 2026)

Twee mensen, één dag, op de stagingomgeving met de pilotparameters. Opdracht: tien accounts door de inverdienperiode en één verenigingsweek krijgen met een headless browser (ook met overschreven `navigator.webdriver`), een hotspot en e-mailaliassen (plus-adressen en Gmail-punten), en daarnaast:

- **zes echte accounts op één laptop op eduroam** (zes browserprofielen in zes zichtbare vensters, één bestuurslid dat de sessies laat draaien; founder J1), één keer tegelijk gestart en één keer **gespreid gestart**, om de drie minuten (besluit founder na ronde 3, jurist should-fix 2);
- **één instellingsadres voor tien accounts** (besluit founder na ronde 3, jurist should-fix 1).

Vastleggen per account: wat lukte, welke heuristiek of controle het zag, hoeveel tijd het kostte. **Uitkomst [in te vullen na de red-teamdag]**, met de wijzigingen die eruit volgen.

### 7.6 Drempels voor campus, mobiel CGNAT en H12

Campus- en CGNAT-adressen worden bij H2, H7 en H10 niet overgeslagen maar met een hogere drempel geteld. **H12** (gelijktijdige sessies) kijkt sinds ronde 3 naar **overlap over de hele sessieduur**, niet naar gelijke starttijden (besluit founder na ronde 3, jurist should-fix 2): het aantal accounts met tegelijk lopende sessies vanaf dezelfde IP-hash en dezelfde user-agentklasse, ongeacht wanneer ze startten. Werkhypothese (voorstel jurist, overgenomen door het productteam): **minstens 3 accounts met minstens 40 minuten overlap op minstens 2 dagen per week**, met het `desktop-*`-deel apart geteld. H12 markeert ook op campusadressen. **Drempels [in te vullen na de red-teamdag]**, vóór 2 december op de seed vastgelegd: een gesimuleerde UB-NAT met twintig eerlijke studenten mag niet markeren, het red-teamscenario met tien accounts achter een hotspot en de scenario's met zes accounts op één laptop, tegelijk en gespreid gestart, wel. H12 op overlap is uiterlijk 4 januari live (§3.3).

### 7.7 Eén fraudegrens (besluit founder na ronde 3, jurist should-fix 5)

In de pilot en in de uitbreiding geldt dezelfde regel: de **bovengrens van het 95%-interval** van het geschatte aandeel frauduleuze accounts moet onder 5% liggen. In de pilot is dat een drempel in het lanceringsbesluit (§5.1); in de uitbreiding stopt een kanaal als de bovengrens van de schatting voor dat kanaal 5% of meer is. De eerdere grens van 10% voor de uitbreiding vervalt.

### 7.8 Instellingsanker uniek per adres (besluit founder na ronde 3, jurist should-fix 1)

Van een bevestigd instellingsadres bewaren we het domein en `institution_email_hash = HMAC(genormaliseerd adres, pepper_inst)`, met een unieke index: één adres kan maar één account bevestigen. Het adres zelf bewaren we niet (spec §4.10; architectuur §10.4). Dit is vóór 4 januari 2027 live, het begin van de vroegste mogelijke prijsperiode. Voorstel juridisch team (gebruiksvoorwaarden §8.4), overgenomen door het productteam: een instellingsanker dat vóór de invoering is bevestigd, telt vanaf 4 januari alleen nog als het lid het opnieuw heeft bevestigd; zonder herbevestiging vervalt het instellingsanker (niet het telefoonnummer). Bij verwijdering van het account wordt de HMAC gewist; na een bevestigde blokkade blijft ze 2 jaar bewaard (voorstel juridisch team). De grondslag (gerechtvaardigd belang, fraudebestrijding) staat in de DPIA.

## 8. Deelnemersbescherming

### 8.1 Geïnformeerde deelname

In de onboarding staat vóór het akkoord een korte uitleg: de pilot vergelijkt door loting twee bonusregels, twee momenten voor de Belofte, een uitnodiging om een squad te vormen en (als de advocaat de arm toestaat) een rustperiode zonder nieuwe punten vanaf het einde van de tentamenweken van je instelling tot en met de tentamenperiode van april; de rustperiode kan ook in tentamenweken vallen (founder G-S8); vanaf de dag waarop je je groep hoort, hoort die groep bij jou, ook als je van squad wisselt; de doelbonus stopt aan het einde van de laatste tentamenweek van je instelling, op een datum die de app noemt; de catalogus is schaars, en de app toont per week de voorraad naast het aantal studenten dat mag verzilveren.

Er zijn twee uitwegen, apart uitgelegd (founder J2):

- **Uit de rustperiode stappen** ("Ik wil weer punten verdienen"): kan altijd, staat in het rustperiodebericht zelf en in het herhaalbericht op de eerste dag van A, en geldt vanaf de volgende focusdag. Je blijft in het onderzoek; de keuze rapporteren we per arm. Een overstap naar een squad die gewoon punten verdient, telt als deze keuze (§4, H3b).
- **Uit het onderzoek stappen**: kan altijd in Ik, zonder verlies van punten. Je krijgt vanaf de volgende focusdag arm A en doorlopende punten, en het Belofte-aanbod op T − 6 van je kalender als je dat nog niet kreeg, en je valt vanaf de afmelding buiten de analyse. Wie volledig bezwaar maakt (art. 21 AVG), kan dat zo doen. De afmelding rapporteren we per arm.

**Herhaalbericht in april** (besluit founder na ronde 3, jurist should-fix 4). Op focusdag A-start ziet iedereen in de rustarm die nog niet uitstapte één keer het rustperiodebericht opnieuw, met dezelfde woorden en dezelfde knop. Er volgt geen herinnering, en de copy dringt niet aan. Het bericht is een vast onderdeel van de behandeling; we loggen dat het getoond is (`rest_period_notice_shown`, moment `april`) en rapporteren de uitstap in de week erna per kalender.

### 8.2 Minderjarigen

16- en 17-jarigen: standaard arm A, buiten de rustperiode-arm (in een rustsquad persoonlijk doorlopende punten), live aanwezigheid standaard uit, duels alleen binnen de eigen squad.

**Wekelijkse items** (besluit founder na ronde 3, jurist should-fix 8). Zolang de advocaat vraag 9a niet positief heeft beantwoord, krijgen 16- en 17-jarigen wekelijks alleen de vragen over **studietijd en afleiding**, niet over stress en ervaren druk: stilte is de voorzichtige kant. Voorstel juridisch team, overgenomen door het productteam: de beslissing valt één keer, vóór de eerste uitnodiging, zodat de regel tijdens de pilot niet verandert (gebruiksvoorwaarden §6.9). Dit vervangt het besluit uit ronde 2 ("voor iedereen met aparte toestemming"). Of de welzijnsitems op de **vaste momenten** (instroom, reflectie, N) voor 16- en 17-jarigen dezelfde beperking krijgen, heeft de founder niet besloten (open punt 14). Voor de stopregel van arm B verandert dit niets: 16- en 17-jarigen zitten altijd in arm A en tellen niet mee voor het minimum van 40 antwoorden per arm (§8.3).

### 8.3 Schadesignalen, stopregel, bewakingsregel en schadegrens

| Code | Signaal (werkhypothese voor "meerdere dagen") | Reactie |
|---|---|---|
| S1 | Sessies gestart tussen 01:00 en 04:00 op ≥ 3 nachten binnen 7 dagen | Zacht bericht met hulpbronnen van de eigen instelling (studentenpsycholoog, studentendecaan); geen sanctie |
| S2 | Meer dan 360 geverifieerde minuten per dag op ≥ 3 dagen binnen 7 dagen | Idem |
| S3 | Na een gebroken squadstreak van ≥ 7 dagen: geen voltooide sessie in de 7 dagen erna, terwijl de student in de 7 dagen ervoor op ≥ 5 dagen een sessie deed | Idem |
| S4 | Supportbericht met het label "welzijn" | Persoonlijk antwoord door een teamlid, met hulpbronnen |

Hoogstens één bericht per signaal per 14 dagen. Signalen worden per arm en **per code** geteld en gerapporteerd, zonder dat het bericht van de arm afhangt. S1–S3 zijn profilering zonder rechtsgevolg en staan met de belangenafweging in de DPIA; het label "welzijn" (S4) behandelen we als gezondheidsgegeven (founder J8, §8.4).

**Stopregel voor arm B** (besluit founder, G4 na ronde 2). Eigenaar: de founder, met de statisticus en de onderzoeker; vast te stellen uiterlijk 25 november 2026.

| Onderdeel | Inhoud |
|---|---|
| Meting | Wekelijkse meting van twee items (stress, ervaren druk), vanaf de tweede focusweek van de gebruiker, voor iedereen van 18 jaar of ouder die de welzijnstoestemming gaf (§8.2), overslaanbaar en zonder punten (§8.4) |
| Criterium 1 (welzijn) | Werkhypothese founder: de wekelijkse score is twee weken achter elkaar minstens een halve standaarddeviatie slechter in arm B dan in arm A |
| Criterium 2 (schade) | Het aandeel gebruikers met ≥ 1 signaal S1–S4 in een week is in arm B meer dan twee keer dat van arm A |
| Toetsmoment | Elke maandag vanaf week 2, tot en met de bonusstop van de laatst eindigende kalender |
| Correctie voor herhaald kijken | **[methode in te vullen door de statisticus, uiterlijk 25 november]**, vooraf vastgelegd per kijkmoment |
| Minimum | Criterium 1 wordt alleen getoetst in een week met minstens 40 antwoorden per arm; 16- en 17-jarigen zitten altijd in arm A en vallen buiten de analyse van de doelbonus (§2). In een week daaronder rust de regel op criterium 2 en de schadesignalen (lezing productteam van het minimum van 40 per arm) |
| Weigeraars | Wie geen welzijnstoestemming geeft of een week overslaat, telt als ontbrekend; gevoeligheidsanalyse op de ontbrekende waarden **[methode door de statisticus]**; het aandeel weigeraars rapporteren we per arm |
| Gevolg | Arm B stopt: iedereen arm A vanaf de volgende maandag (`arm_switch` met reden `arm_b_stopped`) |

**Bewakingsregel voor de rustarm** (besluit founder na ronde 3, G-S1). Eigenaar: de founder, met de statisticus en de onderzoeker; vast te stellen uiterlijk 25 november 2026.

| Onderdeel | Inhoud |
|---|---|
| Maat | Schadesignalen S1–S4 in de rustarm tegenover de doorlopende arm, van T + 1 tot en met A-einde |
| Criterium | Werkhypothese productteam, naar analogie van criterium 2 van arm B: het aandeel gebruikers met ≥ 1 signaal S1–S4 in een week is in de rustarm meer dan twee keer dat van de doorlopende arm |
| Toetsmoment | Elke maandag van T + 1 tot en met A-einde van de laatst eindigende kalender; per kalender in de eigen periode |
| Correctie voor herhaald kijken | **[in te vullen door de statisticus]**, zoals bij arm B |
| Rapportage | De wekelijkse twee items per rustperiode-arm, zonder dat ze de regel dragen (het besluit van de founder noemt de schadesignalen) |
| Gevolg | De vlag `rest_period` gaat uit: iedereen verdient vanaf de volgende focusdag weer punten; geen uitbreiding van de arm totdat de founder en de onderzoeker het signaal hebben beoordeeld; H3b wordt beschrijvend (§4) |

**Absolute schadegrens** (besluit founder, G-S7 na ronde 2; herzien na ronde 3, G-S5). Ze vergelijkt geen armen maar telt schade die in alle armen optreedt (§5.1). **Werkhypothese 2% tot de ijking.** De ijking (welk aandeel S1 en S2 in tentamenweken normaal is) doet de onderzoeker **[methode en moment in te vullen door de onderzoeker, vóór 2 december]**. S1–S4 rapporteren we per code naast elkaar, niet alleen opgeteld. Gaat de grens af, dan beoordeelt de onderzoeker volgens deze criteria (voorstel productteam; de onderzoeker stelt ze vast):

1. de trend over minstens twee weken, niet één week;
2. de verdeling per arm (doelbonus en rustperiode) en per kalender;
3. per code, met S4 apart (een supportbericht is een ander signaal dan een tijdpatroon);
4. of de stijging samenvalt met tentamenweken van de eigen kalender;
5. of dezelfde personen terugkomen of steeds nieuwe.

De uitkomst (doorgaan, doorgaan met maatregel, of geen uitbreiding) legt de onderzoeker schriftelijk vast met de criteria waarop ze rust.

### 8.4 Vragenlijsten

Kort, overslaanbaar, zonder punten of andere beloning (zodat beantwoorden niet van de arm afhangt). Het welzijnsinstrument en de motivatie-items kiest een onderzoeker **[in te vullen: instrument en items]**. Grondslag voorlopig gerechtvaardigd belang; de welzijnsitems kunnen gezondheidsgegevens zijn (art. 9 AVG) en staan daarom achter een aparte toestemmingsvraag (definitief na vraag advocaat 9). Wie geen toestemming geeft, krijgt de overige items.

| Moment | Inhoud |
|---|---|
| Instroom (na het akkoord) | Welzijn 1 (stress, slaap, ervaren squaddruk, intrinsieke motivatie); zelfgerapporteerde studietijd en telefoonafleiding ("vóór"); gebruik nu of eerder van Forest of Opal, en zo ja waarom Rewarded ernaast of in plaats daarvan |
| **Wekelijks, vanaf de tweede focusweek** | 18+: twee items, stress en ervaren druk (§8.3). 16- en 17-jarigen: alleen studietijd en afleiding, tenzij vraag 9a vóór de eerste uitnodiging positief is beantwoord (§8.2). Tot en met de bonusstop van de eigen kalender voor de stopregel; daarna tot en met A-einde voor de rapportage per rustperiode-arm. Niet in de vakantiepauze |
| Pilotreflectie, T + 1 tot en met T + 7 | Welzijn 2; "Hoe voelde de bonusregel?" (per arm geanalyseerd) |
| Na-seizoensmeting, in N | Welzijn 3; studietijd en telefoonafleiding ("na"); **een korte meting van intrinsieke motivatie** en **één vraag naar niet-beloond studeren** ("Studeerde je deze week ook zonder Rewarded?"), per arm geanalyseerd (besluit founder na ronde 3, G-S3) |
| Belofte-reflectie | Naleving, hernieuwen, aanpassen of stoppen; 18+: interesse in een inzet voor een goed doel (H-C, signaal) |
| Na A (A-einde + 1 tot en met A-einde + 7) | Studietijd en telefoonafleiding (tweede "na"); **dezelfde motivatie-items en de vraag naar niet-beloond studeren**, per arm (G-S3); vraag naar geaggregeerde studievoortgang loopt via verenigingen en instellingen, niet via de student |

Waarom de motivatie-items: zonder meting in motivatie is de verdringingsrichting van H3b alleen uit gedrag af te leiden, en dat is de dubbelzinnige lezing die de vier uitkomsten willen voorkomen (gedragswetenschapper ronde 3, should-fix 3).

### 8.5 Overige ontwerpmaatregelen (geen meting, wel vastgelegd)

Tentamendag die het dagdoel zonder joker opschort; puntenplafond van 300 minuten per dag (dagdoel maximaal 120); sessies na 01:00 tellen, maar zonder doelbonus en met een rustig signaal; hersamenstelroute gepauzeerd buiten de tentamenperiodes, zodat een seizoensdip niet als falen voelt (G-S6 na ronde 2); geen marketing die op sociale schaamte speelt; lichte ethische toets via een partneruniversiteit **[status in te vullen]**.

## 9. Toewijzing en randomisatie

### 9.1 Factoren

| Factor | Armen | Eenheid | Strata (blokken van 4) | Uitzonderingen |
|---|---|---|---|---|
| Doelbonus | A / B | Squad bij aanmaken; solo bij registratie | Vereniging × instroomkanaal (de vereniging bepaalt de kalender) | 16- en 17-jarigen altijd A; vervalt als eerste bij schrappen (§3.5) of zonder oordeel van de advocaat |
| Belofte | Vroeg / laat | Idem | Idem | — |
| Rustperiode | Rust / doorlopend | Idem | Idem | 16- en 17-jarigen altijd doorlopend; vervalt zonder oordeel van de advocaat |
| Squadprompt | Sterk / standaard | Solo-gebruiker bij registratie | Instroomkanaal | Alleen solo |

Elke factor wordt onafhankelijk geloot. Wie in de experimentpopulatie later bij een squad komt, neemt de bonusarm van de squad over vanaf de eerstvolgende maandag, de Belofte-arm alleen als het eigen aanbod nog niet getoond is, en de rustperiode-arm alleen **vóór T − 6** van de kalender; vanaf T − 6 ligt de rustperiode-arm per persoon vast (§4, H3b). Elke wissel wordt gelogd (`arm_switched`). Samenvoegen kan alleen tussen squads met dezelfde rustperiode-arm. De analyse gebruikt de eerst toegewezen arm. Wie uit de rustperiode stapt, ook via een overstap, blijft op zijn toegewezen arm in de analyse. Het uitbreidingscohort krijgt geen toewijzing.

### 9.2 Seedprocedure

1. Vóór 2 december genereert de founder een seed van 32 willekeurige bytes op een apart toestel, in het bijzijn van een tweede persoon.
2. De SHA-256-hash van de seed komt in deze voorregistratie: **[in te vullen]**. De seed zelf gaat in de geheimenmap van de server (architectuur §10.9), niet in de repository.
3. De toewijzing is deterministisch: `arm = f(HMAC-SHA256(seed, factor ‖ stratum ‖ bloknummer))`, met een willekeurige permutatie van twee A's en twee B's per blok. Dezelfde seed geeft dezelfde toewijzing; de A/A-controle draait met een andere testseed.
4. Na het bedrijfsbesluit publiceren we de seed, zodat een derde de toewijzing kan narekenen.

### 9.3 Kalenderregel in de code, codebevriezing, review en A/A-controle

**Kalenderregel in de code** (besluit founder na ronde 3, G-MF3). Volgens de gedragswetenschapper (ronde 3) bevatte `packages/core/src/params/v1.ts` op 5 november nog de vaste data uit ronde 1 (seizoen tot en met 17 januari, rustperiode 19 januari tot en met 31 maart, Belofte-aanbod 11 januari, registratiegrens 17 januari, prijsperiode 4–17 januari), zonder kalenderobject per vereniging. Vóór de bevriezing staan die data niet meer in de parameters, rekent `core/calendar` alle afgeleide data uit `exam_calendar` per vereniging of faculteit, en staan vaste data alleen nog in de standaardkalender voor eenheden zonder vereniging. Dit gaat in de integratiegolf en in de onafhankelijke review (architectuur §12.5).

**Bevriezing en review.** Vóór de A/A-controle worden de toewijzings- en grootboekcode (`packages/core` experimenten, kalender, grootboek en `reconcileDay`, met de bijbehorende API-modules en KPI-query's) **bevroren** en door een onafhankelijke reviewer gelezen (besluit founder, G-S12 na ronde 2) **[reviewer in te vullen]**. De review controleert ook dat geen vaste kalenderdatum buiten de standaardkalender in de code staat.

**A/A-controle.** Daarna draait de A/A-controle **op de bevroren code en de echte KPI-query's**, niet op een simulatie ernaast, met een gesimuleerd cohort (werkhypothese: 800 fictieve gebruikers, verdeeld over squads, solo's, verenigingen op **ten minste twee kalenders met een verschillende T** (besluit founder na ronde 3, G-MF3) en de standaardkalender, kanalen en leeftijdsklassen) door toewijzing, armwissels, samenvoegingen, overstappen na T − 6, vakantiepauze, tentamendagen, bonusstop en rustperiode per kalender, het herhaalbericht, rustuitstap, het uitbreidingscohort in een rustsquad en alle KPI-query's. Controle: de verdeling over armen per stratum; geen 16- of 17-jarige in arm B of de rustperiode; geen `earn_session`-weigering voor een minderjarige of een lid van het uitbreidingscohort in een rustsquad; armwissels gelogd; samenvoegen alleen binnen de rustarm; een overstap na T − 6 als `rest_period_exit`; de data per kalender volgens §3.1, voor beide waarden van T nagerekend; januari-actieven op T − 13 tot en met T − 7; en geen significant verschil tussen armen op een maat waar per constructie geen verschil kan zijn. Een wijziging aan de bevroren code na de A/A-controle vraagt een nieuwe review en een nieuwe A/A-run. **Uitkomst [in te vullen]**.

## 10. Rapportage

- Alle uitkomsten per instroomkanaal (vereniging, squaduitnodiging, ambassadeur, wachtlijst, overig), per vereniging en per kalender; minstens één vereniging waarvan het bestuur niet zelf om de challenge vroeg, als referentie.
- **Deelnamegraad per vereniging** in de laatste tentamenweek en in A: leden met ≥ 2 sessiedagen per week, gedeeld door het externe ledental, naast de 30% actieve seats uit het financierbare punt (G-S3 na ronde 2). Het externe ledental voor A vraagt Rewarded zelf op (challengevoorwaarden A14.3). Dit is een rapportagemaat (KPI) en een andere maat dan de challengescore op de ranglijst, die ook deelnamegraad heet: die telt per week gekoppelde leden met ≥ 3 dagen dagdoel gehaald én een identiteitsanker, gedeeld door het hoogste van ledental en gekoppelde leden (challengevoorwaarden A4.1; spec §4.6).
- Retentie altijd op kalendertijd naast relatieve dagen; D7 op dag 6–8 (G-S8: de founder koos dag 6–8 in plaats van D7 per registratieweekdag).
- (c) en (d) op de doorlopende arm, de rustarm apart; (d) ook voor deelnemers zonder vereniging.
- K alleen uit uitnodigingen van gebruiker aan gebruiker (squad, duel, persoonlijke link), zonder wachtlijst, verenigingscode, ambassadeurscode of kaart.
- Squadoverleving (≥ 2 actieve leden in week 4 en week 8 na aanmaken) en reactivering van squads in A per rustperiode-arm (§6.2).
- Uitstap per arm: uit de rustperiode (apart: via het bericht, het herhaalbericht, het profiel of een overstap) en uit het onderzoek.
- Het aandeel rustsquads met leden die persoonlijk doorlopend verdienen (minderjarigen, uitbreidingscohort, afmelders, uitstappers), en H3b ook zonder die squads.
- Belofte-dosis per gebruiker, apart voor de dagen in A.
- Schadesignalen per code en per arm; de wekelijkse items per arm.
- Gerechtigden zonder verzilvering per week, per arm en per post (§5.4).
- Wie de modus zonder punten kiest, en hun retentie.
- Teamaccounts tellen nergens mee; afgekeurde sessies ook niet.
- In elk cijfer voor een instelling of bestuur heet de tijd "focustijd die telde (Rewarded zichtbaar op het scherm)", met het verificatieniveau erbij (founder J3).
- De analyse draait een **onafhankelijke analist**. Profiel: onafhankelijk onderzoeker, niet betaald naar uitkomst, zonder belang bij het slagen van de pilot (bijvoorbeeld de statisticus van de poweranalyse of iemand van de partneruniversiteit van de ethische toets) **[naam in te vullen vóór 2 december]**. De analist krijgt pas na vastlegging van deze voorregistratie toegang tot uitkomstdata.

## 11. Open punten vóór vastlegging

1. **Kalenders per vereniging en faculteit** (founder, uiterlijk 18 november). T, N, A en de herkansingsdagen in A op de primaire pagina's; welke verenigingen passen; welke kalenders de pilot dekt (§3.2).
2. **Standaardkalender** (founder, vóór 2 december). De data voor eenheden zonder vereniging; werkhypothese productteam: die van de laatst eindigende pilotkalender (§3.1).
3. **Venster van voorwaarde (c)** (§6.1). Het getal blijft; per kalender 1–14 februari of N, in §3.2. Uitwerking uit ronde 2, bevestiging founder.
4. **Prijsperiode en poules per kalender** (§3.4), en de prijsperiode in de januarivariant (§3.5). Bevestigen, en in de challengevoorwaarden opnemen (juridisch team).
5. **Vrijgaveschema, puntenprijzen en impliciete waarde per punt** (§5.4), uiterlijk 25 november.
6. **Opdracht aan de statisticus** (§4.0), uiterlijk 25 november: δ, gevoeligheidsgrens, Holm-uitwerking, correctie voor herhaald kijken (arm B en rustarm), ontbrekende waarden, drempel voor differentiële uitstap, intervallen bij (c) en (d), aantal solo-gebruikers.
7. **Gevoeligheidsvenster** (§4, H3b): voorstel productteam T + 1 tot en met T + 14 met N als gevoeligheidsanalyse; bevestiging founder.
8. **Rangorde van de vier uitkomsten** en **H3b vervallen = onbeslist** (§4): lezing productteam; bevestiging founder en investeerder vóór 2 december, samen met de lezing van (c), (d) en (f).
9. **Kleinere beloningslaag bij verdringing** (§4, §6.1): hoeveel kleiner; founder, vóór 2 december.
10. **Januarivariant van de schuifregel** (§3.5): de uitwerking van het productteam (cohortvenster 4–10 januari, aanloopklassement vervalt, minimumduur van het seizoen per kalender); bevestiging founder vóór 2 december.
11. **Onafhankelijke analist en reviewer** (§9.3, §10): namen vóór 2 december.
12. **Gesprek met Hold** (founder, vóór 25 november): uitkomst en gevolg voor (a) en (b) (§6.1); elke wijziging komt als gedateerde regel in het wijzigingslog.
13. **Geen prestatiechallenges in de hele rustperiode** (§4, H3b): voorstel om challengevoorwaarden B7 te volgen (T + 1 tot en met A-einde, beide armen) in plaats van alleen A; bevestiging founder. Wijst de founder het af, dan geldt de regel alleen in A en passen B7 en de spec mee aan.
14. **Welzijnsitems op de vaste momenten voor 16- en 17-jarigen** (§8.2): de founder besliste over de weekitems, niet over de vaste momenten (gebruiksvoorwaarden §6.9, vraag advocaat 9e). Besluit founder vóór de vastlegging.
15. **Advocaat, vragen 2, 3 en 9a** (founder, "direct"). Zonder antwoord vóór 25 november vervalt arm B respectievelijk de rustperiode-arm, en dat staat dan hier. Zonder positief antwoord op 9a vóór de eerste uitnodiging krijgen 16- en 17-jarigen wekelijks alleen de vragen over studietijd en afleiding.
16. **Criteria per fraudeoordeel** (§7.2) en **drempels H12** (§7.6): bevestigen na de red-teamdag.
17. **Bewakingsregel rustarm en beoordelingscriteria schadegrens** (§8.3): het criterium (werkhypothese productteam) en de ijking; founder met statisticus en onderzoeker.
18. **N, de definitie van het na-seizoensvenster** (§3.1): voorstel productteam uit ronde 2, nog te bevestigen door de founder.
19. **Opzet van de D7-herhaling** (§5.2): voorstel productteam, bevestiging founder.

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

**Ronde 3 — 5 november 2026.** Herzien door het productteam volgens de bindende besluiten in `docs/pitch/ronde-3-founder-reactie.md` (de founder-reactie draagt de datum 5 november), gelijk met het businessplan v4, het productplan v4, de spec (versie 1.3), het UX-ontwerp (versie 1.4) en de architectuur (versie 1.4).

- §1, §4 H3b, §6.1 (f): H3b als non-inferioriteitstoets met marge δ (werkhypothese 10 procentpunten op de binaire maat; de statisticus stelt vast), een gevoeligheidstoets in T + 1 tot en met T + 14 met N als gevoeligheidsanalyse (voorstel productteam), Holm over H3a en H3b, en vier uitkomsten met een vast gevolg voor (f); "nulresultaat" vervallen; rangorde bij overlap en "H3b vervallen = onbeslist" als lezing productteam; H3a bepaalt de omvang van tranche 2 niet (G-MF1, investeerder MF1).
- §2, §3.1, §6.1: januari-actieven op T − 13 tot en met T − 7; (c) en (d) beslissen op de doorlopende arm, de rustarm apart; intervallen door de statisticus, bevestiging door de investeerder (G-MF2).
- §1, §3.1, §3.2, §9.3: tentamenkalender per vereniging (per faculteit waar die verschilt) als bron van T, N en A; standaardkalender voor eenheden zonder vereniging als enige plek met vaste data (vervangt de kalender van de instellingsmail); vaste data uit de parameters; A/A-controle met twee kalenders met een verschillende T; review controleert de kalenderregel (G-MF3).
- Nieuwe §3.5: schuifregel (uiterste start 9 december, go/no-go-cohort tot 13 december; anders 4 januari met een verkort seizoen, uitgewerkt als voorstel productteam) en schrapvolgorde (eerst arm B) (G-MF3, investeerder MF2).
- §2, §4 H3b, §9.1: rustperiode-arm per persoon vast vanaf T − 6; overstap naar een doorlopende squad telt als `rest_period_exit`; 16- en 17-jarigen en het uitbreidingscohort in een rustsquad verdienen persoonlijk doorlopend; aandeel gemengde rustsquads en gevoeligheidsanalyse zonder hen (G-S2, jurist should-fix 3).
- §8.3: bewakingsregel voor de rustarm op de schadesignalen van T + 1 tot en met A-einde, met het criterium als werkhypothese productteam; de vlag gaat uit bij overschrijding (G-S1). Schadegrens per code gerapporteerd, met beoordelingscriteria (voorstel productteam) en 2% als werkhypothese tot de ijking (G-S5).
- §8.4: korte meting van intrinsieke motivatie en een vraag naar niet-beloond studeren in N en na A, per arm (G-S3).
- §5.4, §10: impliciete puntwaarde met formules, de inschatting van de gedragswetenschapper en een rekensom op die inschatting; nieuwe maat "gerechtigden zonder verzilvering" per arm (G-S4).
- §3.1, §4, §6.1: A per faculteit; herkansingsdagen in A buiten de nawerkingsmaat en apart gerapporteerd (G-S6). (c) als bewuste keuze van de investeerder benoemd (G-S7).
- §2, §4 H1, §5.1, §6.1 (e): D7 op dag 6–8; de lat van 25% blijft; D7 ook per registratieweekdag (G-S8).
- §4.0: opdracht aan de statisticus met clustering, uitsluitingen en halve noemer; interactie vooraf als niet-informatief benoemd (G-S9).
- §3.1, §4 H3a: tweede Belofte-aanbod in de vroege arm op A-start − 7 (moment als voorstel productteam) (G-S10). §6.2: reactivering van squads in A per rustperiode-arm als KPI (G-S11).
- §6.1 (a): ≥ €4.000 opdrachtwaarde of ≥ 500 seats bij een onafhankelijke betaler, of twee getekende opdrachten; variant "te laat maar echt" tussen 1 mei en 1 september 2027 voor een beperkte tranche (investeerder S1, S3). (d) ook voor deelnemers zonder vereniging (S5). Hold-gesprek met gevolg voor (a) en (b) (S8).
- §7: instellingsanker uniek per adres met HMAC vóór 4 januari, herbevestiging van bestaande ankers (voorstel juridisch team), contact in de steekproef via HMAC-vergelijking, criterium "instellingsdomein met overlappend patroon" vervangen (§7.1, §7.2, §7.8); H12 op overlap over de hele sessieduur met de werkhypothese van de jurist en het gespreide scenario (§7.5, §7.6); één fraudegrens en het uitbreidingscohort als eigen stratum (§7.1, §7.7); pilotbeheerder onafhankelijk, met melding van een belang per item (§7.1); gerichte steekproef van vijf accounts per ambassadeur vóór elke uitbetaling, geen uitbetaling zolang het anker niet uniek is (§7.4); red-teamscenario "één instellingsadres, tien accounts" (§7.5) (jurist should-fix 1, 2, 5, 6, 7).
- §8.1, §4 H3b: de uitweg "Ik wil weer punten verdienen" één keer herhaald op de eerste dag van A, als vast onderdeel van de behandeling (jurist should-fix 4).
- §8.2, §8.4: weekitems voor 16- en 17-jarigen alleen over studietijd en afleiding zolang vraag 9a niet positief is beantwoord, met één beslismoment vóór de eerste uitnodiging (voorstel juridisch team); vervangt het besluit uit ronde 2; de vaste momenten als open punt 14 (jurist should-fix 8).
- §3.3: nieuwe termijnen (eigen middelen 18 november, pilotbeheerder en vraag 9a vóór 1 december, HMAC en H12 vóór 4 januari, extern ledental vóór de aprilchallenge, "te laat maar echt").
- §11: open punten herschreven; nieuwe punten 2, 6–10, 14 en 17. Het bestand bestond al sinds ronde 1; de map `docs/pilot/` hoefde niet te worden aangemaakt.

**Ronde 3, eindredactie — 5 november 2026.** Gelijkgetrokken met het businessplan v4, de pitch, de spec (versie 1.3) en de juridische concepten na een onafhankelijke samenhangcontrole, volgens `docs/pitch/ronde-3-founder-reactie.md`. Kopregel en ronde-3-log gedateerd op 5 november, de datum van de founder-reactie.

- §3.5, januarivariant: één regel voor de prijsperiode. Geen ingekorte prijsperiode: ligt T − 13 vóór 4 januari, dan doet de vereniging in januari niet om een prijs mee en alleen aan de aprilchallenge; het verkorte seizoen geldt voor de doelbonus. Gelijk met challengevoorwaarden A2; voorstel productteam, bevestiging founder vóór 2 december (G-MF3; open punt 4).
- §5.4: de rekensom voor de schaarste nu gemaakt, zoals de founder vroeg ("nu berekenen", G-S4): bij vijf verenigingen in één poule ten hoogste €525 aan verenigingsprijzen en €975 aan catalogus, ongeveer €1,20 tot €3,25 per gebruiker over het seizoen; ter vergelijking €300 bij tien verenigingen in drie poules. Dit vervangt de inschatting van de gedragswetenschapper en het verschil met de rekensom van de jurist; de gebruiksvoorwaarden §5.5 en de challengevoorwaarden A7 nemen dit getal over. De budgetwaarde per punt en de focusuren per goedkoopste item blijven **[in te vullen bij de prijslijst]**: ze vragen de verwachte geverifieerde minuten en de puntenprijzen, en die bestaan nog niet.
- §4 H1, §5.1 en §10: "D7 ook per registratieweekdag" geschrapt; de founder koos dag 6–8 in plaats daarvan (G-S8).
- §10: de deelnamegraad per vereniging (KPI) uitdrukkelijk onderscheiden van de challengescore uit challengevoorwaarden A4.1.
