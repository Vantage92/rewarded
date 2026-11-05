# Pitchronde 3: beoordeling door de gedragswetenschapper en productveteraan

*Beoordelaar: gedragswetenschapper (veldexperimenten met prikkels) en productveteraan. Datum: 4 november 2026. Ronde 3 van maximaal 3.*

*Gelezen: `docs/pitch/pitch.md` (v3), `docs/01-businessplan.md` (v3), `docs/02-productplan.md` (v3), `docs/pitch/README.md`, alle bestanden `docs/pitch/ronde-1-*.md` en `ronde-2-*.md`, `docs/pilot/voorregistratie.md` (concept ronde 2), `docs/research/08-gedragswetenschap.md` (volledig) en uit `docs/research/05-productspecificatie.md` de hoofdstukken 3.4–3.5, 3.12–3.16, 4.2–4.5, 4.12–4.14, 5, 6.6–6.7 en 7.2–7.4. Daarnaast heb ik gekeken of de bouw de besluiten uitvoert: `packages/core/src/params/v1.ts` en de modules in `packages/core/src/` (stand van commit 645313b). Waar ik naar studies verwijs, steun ik op rapport 08, dat door drie sceptici is geverifieerd. Eén feitelijke controle heb ik zelf gedaan, op de kalender van de Universiteit Utrecht. Daarbij heb ik alleen zoekresultaten gezien: de pagina's van students.uu.nl waren in deze sessie niet geopend, dus ik markeer die data zo. Rekenvoorbeelden zijn inschattingen.*

---

## Oordeel: GO MET VOORWAARDEN

De vier must-fixes uit ronde 2 zijn in het ontwerp opgelost. Bij de kalender en de stopregel ontbreken nog parameters, maar die hebben een eigenaar en een datum.

- De kalenderregel per instelling is goed uitgewerkt, met T, N en A per instelling.
- De rustperiode loopt nu door tot en met het aprilvenster. De lekken via nieuwe gebruikers en samenvoegingen zijn dicht.
- De kostenmaat is een pilottotaal met een vast vrijgaveschema. "Weekvrijgave verlagen" is uitdrukkelijk verboden.
- De stopregel voor arm B rust op een wekelijkse meting.

Dat is serieus werk, en ik herhaal het hieronder niet.

Wat overblijft, zit niet meer in het pilotontwerp. Het zit in twee andere dingen.

1. **De besluitregels die in ronde 2 aan de pilot zijn gehangen.** Op aandringen van de investeerder hangen er nu bindende voorwaarden aan de tweede tranche: (c), (d) en (f). Die lezen het experiment op twee punten verkeerd:
   - De regel voor een "nulresultaat op H3" straft precies de uitkomst die de steigerhypothese voorspelt, en kan een uitkomst die de steiger weerlegt als succes tellen.
   - (c) en (d) worden gemeten op een groep waarvan de helft door het experiment zelf geen punten krijgt, en die geselecteerd is in de week waarin de behandeling begint.
2. **De afstand tussen plan en bouw.** Vier weken vóór de start bevat de code van `packages/core` nog de vaste data uit ronde 1. Op de parameters en de tijdlaag na zijn de modules lege stubs. Er is ook geen regel voor wat er met het experiment gebeurt als de start schuift.

Alle drie de must-fixes zijn op te lossen vóór 2 december: twee in de voorregistratie, één in het bouwplan. Geen ervan vraagt een nieuwe architectuur. Bouwen en de pilot draaien vind ik verantwoord, mits ze zijn opgelost. Zonder must-fix 1 levert de pilot een uitkomst op die het bedrijfsbesluit verkeerd om kan sturen. Dat is erger dan geen uitkomst.

---

## Scoretabel

| Criterium | R1 | R2 | R3 | Motivering |
|---|---|---|---|---|
| Probleem en doelgroep | 7 | 7 | 7 | Het probleem is echt, seizoensgebonden en goed afgebakend. Het model en de pilotkalender erkennen het seizoen nu allebei. Eén kalenderdetail moet nog worden uitgezocht (should-fix 6). |
| Oplossing en gedragseffect | 4 | 5 | 5 | Het ontwerp kan nu in principe laten zien of beloning als steiger werkt: rustarm tegenover doorlopend, gemeten in een periode met echte vraag. Maar de beslisregel leest het resultaat verkeerd om (must-fix 1). Er is geen manipulatiecontrole die laat zien dat punten überhaupt iets doen. En de verdringingsvraag wordt alleen in gedrag gemeten, niet in motivatie (should-fix 3). |
| Beloningsmodel | 5 | 5 | 6 | De kostenmaat is opgelost, het vrijgaveschema ligt vast en punten tonen geen eurowaarde. De pilotbeloning is schaars (inschatting: enkele euro's per gebruiker over het hele seizoen), maar dat ligt in dezelfde orde als het beloningsbudget van het B2B-model (€10,80 per seat per jaar). Dat is eerlijk. De impliciete waarde per punt is nog niet berekend (should-fix 4). |
| Groei | 5 | 5 | 5 | ITT is het hoofdresultaat, reactivering van squads is een KPI en de hersamenstelroute pauzeert buiten het seizoen. Het aantal solo-gebruikers is nog niet geschat. Waarschijnlijk blijft H1 beschrijvend. |
| Unit economics | 5 | 5 | 5 | Buiten mijn kern. De deelnamegraad per vereniging staat nu naast de 30% actieve seats. Dat is de juiste vergelijking. |
| Verdediging | 4 | 4 | 4 | De sectie is eerlijk. Gemeten nawerking is de enige pijler die van de pilot afhangt, en juist die pijler wordt door must-fix 1 verkeerd gelezen. |
| Uitvoerbaarheid | 5 | 4 | 3 | Lager dan in ronde 2. Dit is de eerste ronde waarin ik de code kon zien. `params/v1.ts` bevat de bonusstop van 18 januari, de rustperiode van 19 januari tot en met 31 maart, het Belofte-aanbod van 11 januari en de registratiegrens van 17 januari, allemaal besluiten die in ronde 2 zijn vervallen. Squads, grootboek, Belofte, catalogus, fraude, uitdagingen en experimenttoewijzing zijn stubs van twee regels. Vóór 2 december moeten R1 met vier factoren, de kalenderregel, een codebevriezing, een onafhankelijke review en een A/A-controle af zijn, door één bouwer. Er is geen regel voor een vertraagde start (must-fix 3). |
| Risico's | 5 | 6 | 6 | Gedrags- en ethische risico's zijn nu volledig benoemd, met stopregel, schadegrens en tentamendag. Twee gaten: de rustarm (tien à twaalf weken zonder punten, deels in tentamenweken) heeft geen eigen bewakingsregel (should-fix 1), en de schadegrens van 2% is niet geijkt op normaal tentamengedrag (should-fix 5). |

---

## Wat uit ronde 2 is opgelost

| # | Must-fix ronde 2 | Status | Toelichting |
|---|---|---|---|
| 1 | Vaste pilotdata passen niet bij de tentamenkalenders | **In het ontwerp opgelost; niet in de code** | Er is een kalenderregel met T, N en A per instelling, toegepast in voorregistratie §3.1, spec §4.13 en architectuur. Het lanceringsbesluit valt na de laatst eindigende T. Strata en kalender vallen samen met de toewijzingseenheid. Dat is wat ik vroeg. De kalenders zelf zijn nog niet bevestigd (18 november), en de code werkt nog met de vaste ronde-1-data. Dat laatste is een nieuw punt (must-fix 3). |
| 2 | Rustperiode eindigt vóór de aprilmeting en lekt | **Opgelost** | De rustperiode loopt van T + 1 tot en met het einde van A. De aprilchallenge is gelijk voor beide armen, en geen van beide armen heeft prestatiechallenges met een prijs (voorstel, open punt 13: bevestigen). Nieuwe gebruikers in een rustsquad volgen de squadregel, samenvoegen kan alleen binnen de arm, de uitweg staat los van afmelden, uitstap wordt per arm gerapporteerd en er komt een drempel voor differentiële uitstap. Twee kleine restlekken staan onder should-fix 2. |
| 3 | Kostenmaat onverenigbaar met de pilotpost | **Opgelost** | De maat is nu een pilottotaal per post. Vrijgaveschema en puntenprijzen liggen vast en zijn gelijk voor alle armen. Een verlaging tijdens het experiment is uitgesloten, ook bij een fraude-overschrijding: het schema van het onderzoekscohort blijft vast. De weekmaat geldt pas in de uitbreiding. |
| 4 | Stopregel arm B niet uitvoerbaar | **In het ontwerp opgelost; parameters open** | Er is een wekelijkse meting van twee items vanaf week 2, een minimum van 40 per arm zonder 16- en 17-jarigen, een terugval op de schadesignalen, weigeraars als ontbrekend en een toetsmoment per maandag. De correctiemethode en het welzijnscriterium zijn nog een werkhypothese, met de statisticus als eigenaar en 25 november als termijn. Ik accepteer dat als procespunt. Het blijft een voorwaarde voor de vastlegging op 2 december. |
| Should-fixes 1–14 | | **Overgenomen** | ITT/IV, D7 als vaste lat (de afwijking van mijn voorstel is beargumenteerd en die redenering klopt: een doelpaal die je na de data invult, is erger), deelnamegraad, Belofte-hernieuwing en dosis, interactie als verkennend, pauze van de hersamenstelling, reactiverings-KPI, schadegrens, binaire H3, "H2 draagt geen bedrijfsbesluit", analistenprofiel, codebevriezing in het plan, competentiefeedback als Should, uitbreidingscohort. |

### Implementeert het product de ontwerpprincipes? (stand ronde 3)

| Principe (rapport 08 §7) | R2 | R3 |
|---|---|---|
| Inputs belonen, direct belonen | Geïmplementeerd in de spec | Geïmplementeerd in de spec; in de code nog niet (grootboek is een stub) |
| Geen kleine geldbedragen, geen zichtbaar stukloon | Half | **Grotendeels.** De kostenmaat is opgelost en er staat geen euro in beeld. Het uurloon per goedkoopste item is nog niet berekend (should-fix 4) |
| Terugkombonus, streak met herstel | Geïmplementeerd | Geïmplementeerd in de spec |
| Verdringing voorkomen | Grotendeels | **Grotendeels.** Competentiefeedback is Should, de modus zonder punten is Should. Of er verdringing optreedt, wordt alleen in gedrag gemeten; intrinsieke motivatie alleen bij instroom (should-fix 3) |
| Commitment bij het einde van de prikkel (Royer e.a.) | Geïmplementeerd | Geïmplementeerd in de spec (T − 6 per kalender); in de code nog 11 januari |
| Ruim twee maanden herhaling (Lally e.a.) | Niet te implementeren, eerlijk verkennend | Ongewijzigd: 14 plus 14 dagen Belofte, meting ongeveer acht tot tien weken later |
| Kleine teams, geen openbare individuele ranglijst | Geïmplementeerd | Geïmplementeerd |

---

## Must-fix

### 1. De beslisregel voor H3 en voorwaarde (f) lezen de steigertoets verkeerd om

**Wat er staat.**

- Voorregistratie §4, H3b: "'Beloning als steiger' voorspelt dat de rustperiode-arm in A niet slechter scoort; een verdringingseffect zou hem beter laten scoren, een afhankelijkheid van de beloning slechter."
- Voorwaarde (f), §6.1: een **nulresultaat** is "in de vroege Belofte-arm en in de rustperiode-arm ligt het 95%-interval van de primaire H3-maat rond nul". Bij een nulresultaat wordt tranche 2 beperkt tot €180.000 en wordt de native bouw uitgesteld.
- H3-beslisregel: "Een effect in de vroege Belofte-arm of de rustperiode-arm met het interval boven nul is input voor het bedrijfsbesluit ('gemeten nawerking')."
- Businessplan §12: "Geen nawerking in april in de vroege Belofte-arm of de rustperiode-arm".

**Waarom dit het bedrijfsbesluit ongeldig maakt.**

- **De uitkomst die de steiger bevestigt, telt als mislukking.** De steigerhypothese voorspelt geen verschil: de rustarm doet het in april even goed als de doorlopende arm. Volgens (f) is precies dat een "nulresultaat". Tranche 2 wordt dan kleiner en de native bouw wordt uitgesteld. De pilot kan de kernclaim dus niet winnen.
- **De uitkomst die de steiger weerlegt, telt als succes.** Scoort de rustarm in april significant slechter (afhankelijkheid van punten), dan ligt het interval niet rond nul. Het is dan formeel geen nulresultaat, dus volgt de volle tranche met native bouw, op een resultaat dat zegt dat het gedrag verdwijnt zodra de punten stoppen. En scoort de rustarm significant beter, dan heet dat volgens de eigen richtingtekst verdringing, maar volgens de beslisregel "gemeten nawerking" en een pijler van de verdediging.
- **Geen gevoeligheidstoets.** "De rustarm scoort niet slechter" betekent alleen iets als punten in de doorlopende arm aantoonbaar iets doen. Dat is de eis van *assay sensitivity* uit non-inferioriteitsonderzoek. Met een schaarse catalogus en een binaire maat (≥ 1 sessiedag in A) is het goed mogelijk dat punten in april geen meetbaar verschil maken, zoals Patel e.a. 2016 voor een winstbeloning van $1,40 per dag niet beter dan controle vonden (rapport 08 §1.2). Dan is "geen verschil" geen bewijs voor de steiger, maar voor een zwakke prikkel. Geen enkele arm meet dat nu: H2 vergelijkt twee framings van dezelfde bonus, niet punten tegenover geen punten.
- **Meervoudig toetsen.** "Een effect in de Belofte-arm **of** de rustarm" geeft bij twee toetsen op 5% bijna 10% kans op een vals "effect". Met een poweranalyse die H3 waarschijnlijk verkennend noemt, is een toevallige vondst in één arm de meest waarschijnlijke weg naar volle financiering.

**Oplossingsrichting** (in de voorregistratie, vóór 2 december).

1. **Formuleer H3b als non-inferioriteit** met een vooraf vastgelegde marge δ, bijvoorbeeld "de rustarm ligt in A niet meer dan δ procentpunt onder de doorlopende arm". De statisticus kiest δ, met een motivering in termen van wat voor een betaler ertoe doet.
2. **Leg vier uitkomsten vast, elk met een eigen gevolg voor (f):**
   - **steiger ondersteund:** de ondergrens van het interval ligt boven −δ én de gevoeligheidstoets is gehaald;
   - **afhankelijkheid:** de bovengrens ligt onder nul. Dat telt als negatief resultaat, net als een nulresultaat of zwaarder;
   - **verdringing:** de rustarm scoort significant beter. Dat is geen pijler van de verdediging maar een signaal tegen het beloningsmodel;
   - **onbeslist:** al het andere. Dat valt onder (f).
3. **Voeg een gevoeligheidstoets toe die vooraf vastligt:** het verschil tussen de armen in N of in de eerste twee weken na T + 1, wanneer de punten net wegvallen. Is daar geen verschil met een interval dat een vooraf gekozen minimum uitsluit, dan is H3b in april niet interpreteerbaar als steigertoets en rapporteren we het als zodanig.
4. **Leg vooraf vast hoe H3a en H3b samen tellen** (bijvoorbeeld Holm, of één primaire toets en één secundaire). Schrijf (f) en businessplan §12 opnieuw in deze termen. Laat de investeerder deze lezing vóór 2 december zien, want dit raakt zijn voorwaarde.

### 2. De bindende voorwaarden (c) en (d) meten een experimenteel gemanipuleerde groep, geselecteerd in de week waarin de behandeling begint

**Wat er staat.**

- Januari-actieven zijn deelnemers met "≥ 2 sessiedagen in T − 6 tot en met T" (voorregistratie §2).
- Op T − 6 gebeurt tegelijk dit (§3.1): de stop van de doelbonus wordt aangekondigd, de vroege arm krijgt het Belofte-aanbod en elke squad hoort of ze in de rustgroep zit ("Van [T + 1] tot en met [einde aprilvenster] verdient jouw squad geen nieuwe punten").
- (c): ≥ 20% van de januari-actieven heeft ≥ 2 sessiedagen per week in 1–14 februari of in N.
- (d): ≥ 25% keert terug in A.
- In N en in A verdient de helft van de eenheden per constructie geen punten.

Beide voorwaarden zijn bindend voor €360.000. Toen ik ze in ronde 2 kon zien, waren het nog voorstellen in de founderreactie. De definitie van januari-actieven was er toen al, maar hing nog niet aan een bindend besluit.

**Waarom dit het bedrijfsbesluit ongeldig maakt.**

- **De drempel hangt af van de loting, niet alleen van het product.** Doen punten ertoe, dan drukt de rustarm (c) en (d) omlaag. Het bedrijf zakt dan voor een drempel omdat het zichzelf een experiment oplegde. Doen ze er niet toe, dan maakt het niet uit. Maar dat weet je pas achteraf, en de drempels van 20% en 25% zijn zonder deze correctie gekozen. De Belofte-arm voegt een tweede manipulatie toe.
- **De noemer is na de behandeling geselecteerd.** Wie in de laatste tentamenweek "januari-actief" wordt, hangt af van het Belofte-aanbod (een belofte van dagen per week verhoogt waarschijnlijk juist de sessiedagen in die week) en van het rustbericht (frustratie of afhaken). Selecteren op een uitkomst na de behandeling geeft vertekening in elke analyse die januari-actieven als noemer gebruikt: (c), (d) en H3-secundair (2).

**Oplossingsrichting.**

1. Definieer januari-actieven op het venster **vóór** de aankondiging: T − 13 tot en met T − 7, de eerste week van de prijsperiode. Er is dan nog geen behandeling, maar wel echte vraag.
2. Leg vast op welke groep (c) en (d) beslissen. Mijn voorkeur is de **doorlopende arm**, omdat dat het product is dat verkocht wordt, met de rustarm apart gerapporteerd. Als alternatief: gepoold, maar met een vooraf berekende ondergrens voor het effect van de rustarm en drempels die daarop zijn aangepast. Wie de doorlopende arm kiest, moet weten dat de noemer halveert. Laat de statisticus het interval rond 20% en 25% bij die omvang uitrekenen.
3. Zet dezelfde keuze in businessplan §10, de pitch en de voorregistratie, en laat de investeerder haar bevestigen.

### 3. De bouw voert de besluiten van ronde 2 nog niet uit, en er is geen regel voor een vertraagde start

**Wat er staat.**

- R1 op 2 december bevat onder meer de kalenderregel, vier gelote factoren, de wekelijkse meting, schadesignalen, H1–H12 en de steekproef.
- Vóór 2 december: codebevriezing, onafhankelijke review en A/A-controle op de bevroren code. Zonder die stappen geen uitnodigingen, "liever later starten".

In `packages/core/src/params/v1.ts` (gewijzigd op 5 november) staat:

- `season: { first_day: '2026-12-02', last_day: '2027-01-17' }`
- `rest_period: { first_day: '2027-01-19', last_day: '2027-03-31' }`
- `early_offer_day: '2027-01-11'`
- `registration_last_day: '2027-01-17'`
- een prijsperiode van 4 tot en met 17 januari

Er is geen kalenderobject per vereniging. De modules `squads`, `ledger`, `belofte`, `catalog`, `fraud`, `challenges`, `goals` en `session` zijn stubs van twee regels (`export {}`).

**Waarom dit de pilot ongeldig kan maken.**

- **Het plan bestaat op papier, de code volgt ronde 1.** Wordt de kalenderregel onder tijdsdruk vervangen door vaste data, dan meet de pilot opnieuw per stad iets anders: de fout uit ronde 2. De A/A-controle vangt dat alleen als ze uitdrukkelijk de data per kalender toetst. Dat staat er wel (§9.3), maar dan moet de code eerst bestaan.
- **Een vertraging breekt het ontwerp.** Het go/no-go-cohort (registratie 2–13 december) is zo gekozen dat D7 vóór de vakantiepauze van 21 december valt. Start de pilot op 9 december, dan halveert het registratievenster. Start ze op 16 december, dan valt D7 van vrijwel het hele cohort in de vakantie, en dan meet de stopregel van het bedrijf de kerst. De voorregistratie zegt niet wat er gebeurt als de start schuift. Gezien de bouwstand acht ik een schuif waarschijnlijk (inschatting).

**Oplossingsrichting.**

1. Maak van `exam_calendar` per vereniging de eerste taak van WP-1, en haal alle vaste data uit `params/v1.ts`. De A/A-controle toetst expliciet twee kalenders met een verschillende T.
2. Leg in de voorregistratie een **schuifregel** vast:
   - een uiterste startdatum (voorstel: 9 december, met het go/no-go-cohort op registratie van 9 tot en met 13 december, zodat D7 uiterlijk op 20 december valt);
   - wat er gebeurt bij een latere start. Voorstel: D7-cohort in januari, registratie vanaf 4 januari, met een D7 die in de blokweken valt en een eigen drempel. Of geen experiment in deze tentamenperiode en een pilot in de aprilperiode.
3. Leg een **schrapvolgorde voor de factoren** vast, voor als niet alles af is. Mijn advies: schrap eerst arm B (H2). H2 draagt volgens de eigen pitch geen besluit, maar vraagt in R1 het meeste extra grootboekwerk, de stopregel, een juridische toets (vraag 2) en het minimum van 40 per arm. De Belofte (R2) en de rustarm (R3) dragen via (f) wél een besluit, en de squadprompt is goedkoop. Liever drie factoren goed dan vier fout.

---

## Should-fix

1. **De rustarm heeft geen bewakingsregel.** Tien à twaalf weken zonder nieuwe punten, inclusief de aprilentamens, is een grotere ingreep dan de framing van arm B. Toch heeft alleen arm B een stopregel. De wekelijkse twee items lopen tot en met A, maar alleen "voor de rapportage". Pas criterium 2 (schadesignalen per arm) ook toe op rust tegenover doorlopend, van T + 1 tot en met A-einde, met als gevolg dat de vlag uitgaat. De uitweg met één tik maakt de ingreep licht, maar een regel kost niets.
2. **Twee restlekken in de rustarm.**
   - 16- en 17-jarigen in een rustsquad verdienen wel punten terwijl hun squadgenoten dat niet doen. Squadleden zien geen punten van elkaar, maar dit is hetzelfde eerlijkheidsprobleem als bij de lanceringsgebruikers in ronde 2.
   - Een lid van een rustsquad kan na T − 6 overstappen naar een doorlopende squad en neemt dan "vanaf de eerstvolgende maandag" diens arm over (spec §5, toewijzing). Dat is een uitstap die niet als `rest_period_exit` wordt geteld, waardoor de maat voor differentiële uitstap te laag uitvalt.

   Oplossing: zet de rust-arm per persoon vast vanaf T − 6 (een overstap verandert hem niet), of tel een overstap als rustuitstap. Sluit squads met een minderjarige uit van de rustloting, of rapporteer ze apart.
3. **Verdringing wordt niet in motivatie gemeten.** Intrinsieke motivatie staat alleen in de instroommeting. Welzijn 2 (T + 1 tot en met T + 7), welzijn 3 (N) en de meting na A noemen haar niet. De verdringingsrichting van H3b kun je dan alleen uit gedrag afleiden, en dat is precies de dubbelzinnige lezing uit must-fix 1. Neem één of twee items intrinsieke motivatie op in N en na A, per arm (H-E uit rapport 08), plus één vraag naar niet-beloond studeren ("studeerde je deze week ook zonder Rewarded?").
4. **Bereken de impliciete puntwaarde nu, niet op 25 november.** Ruwe inschatting: van €1.500 gaan bij vijf verenigingen ongeveer €600–700 naar verenigingsprijzen. Er blijft ruwweg €800–900 aan catalogus over voor 300–800 gebruikers over zes à negen actieve weken. Dat is één voucher van €3 per twee à drie gerechtigden, over het hele seizoen. Dat is verdedigbaar, en het lijkt op het B2B-budget. Maar het betekent dat "Vandaag op" de normale ervaring wordt. Toets op de wachtlijst niet alleen of studenten aan een uurloon denken, maar ook hoe ze schaarste beleven. Rapporteer per arm hoeveel gerechtigden een week niets konden verzilveren.
5. **De schadegrens van 2% is niet geijkt.** S1 (drie nachtstarts in zeven dagen) en S2 (meer dan zes uur op drie dagen) zijn in de tentamenweken waarschijnlijk normaal gedrag voor een deel van de ijverige studenten. Met 100–300 wekelijks actieven is 2% twee tot zes mensen. De grens gaat dan vooral af op ruis en seizoen. Leg vast wat de onderzoeker beoordeelt als de grens afgaat (trend, per arm, S4 apart), en rapporteer S1–S4 per code naast elkaar in plaats van opgeteld.
6. **De aprilkalender van Utrecht kan herkansingen bevatten.** Volgens zoekresultaten (pagina's niet geopend) loopt periode 3 van de Universiteit Utrecht van 8 februari tot en met 25 april 2027, met per opleiding een eerder einde. Diergeneeskunde plant de herkansingen van periode 2 op 19–23 april 2027. Dan bevat A in Utrecht deels herkansingen van januari. Wie een herkansing heeft, is daar juist actief, onafhankelijk van de steiger. Definieer A per faculteit als "tentamens van periode 3", en rapporteer de herkansingsweek apart of neem haar op als covariaat. In Utrecht valt N bovendien in de eerste weken van periode 3, met colleges. Dat is prima, maar zeg het.
7. **Voorwaarde (c) botst met het eigen seizoensontwerp.** Het product pauzeert de hersamenstelroute buiten het seizoen "zodat een seizoensdip niet als falen voelt". Het model rekent met 8% actieve seats buiten de tentamenperiode. Toch eist een bindende voorwaarde dat 20% van de januari-actieven in N twee dagen per week focust. Laat de investeerder bewust kiezen of hij buitenseizoensgebruik als bedrijfsmaat wil. Anders meet (c) het seizoen in plaats van het product. Reactivering in A, zoals (d) en de squad-KPI, is de maat die bij dit bedrijf past.
8. **D7 op één kalenderdag.** "≥ 1 sessie op dag 7" hangt sterk af van de weekdag van registratie, omdat studenten in het weekend minder studeren. Met registraties in twee weken krijgt het cohort een willekeurige weekdagmix. Rapporteer D7 per registratieweekdag, en overweeg als lat "≥ 1 sessie op dag 6–8". Dat legt de drempel van 25% niet opnieuw open, maar maakt haar minder toevallig.
9. **De power met vier factoren.** De poweranalyse moet per factor rekenen met clustering op squads en met de uitsluitingen: 16- en 17-jarigen tellen niet mee voor bonus en rust, en de rustarm halveert de groep voor (c) en (d) uit must-fix 2. Zeg vooraf dat de interactie Belofte × rust bij deze omvang vrijwel zeker niets oplevert.
10. **De dosis van de Belofte blijft zwak.** 14 plus 14 dagen, met de meting zes tot tien weken later. Dat is eerlijk verkennend. Overweeg een tweede, vooraf vastgelegd aanbod in de week vóór A in de vroege arm. Dan heb je in A een lopende Belofte, wat dichter bij Lally e.a. ligt. Leg de keuze vóór 2 december vast; laten zoals het is mag ook.
11. **Squads in de rustarm in februari en maart.** De Belofte loopt "zonder getuigen" door als de squad uit elkaar valt, en de hersamenstelling is gepauzeerd. Rapporteer de reactivering in A per rustarm. Daar ligt de echte vraag of squads de overgang naar commitment dragen: komt een squad zonder punten terug als de tentamens terugkomen?

---

## Vragen die ik in de partnervergadering zou stellen

1. Stel: in april scoort de rustarm precies even goed als de doorlopende arm. Is dat in jullie eigen regels een succes of een "nulresultaat"? En wat gebeurt er dan met de tweede tranche?
2. Stel: de rustarm scoort significant slechter. Krijgt het bedrijf dan volgens (f) de volle tranche met native bouw?
3. Hoe weten jullie in april dat punten in de doorlopende arm überhaupt iets doen?
4. Op welke groep beslissen (c) en (d): de hele pilot, of alleen het product zoals jullie het verkopen? Hoeveel lager valt (d) uit als punten ertoe doen en de helft ze niet krijgt?
5. Waarom worden de januari-actieven bepaald in de week waarin de helft van de squads hoort dat ze tot mei geen punten meer krijgen?
6. Vandaag staan in de code nog 11 januari, 18 januari en 31 maart. Wanneer staat de kalenderregel erin, en wie heeft dat gecontroleerd?
7. Wat is de laatste dag waarop jullie kunnen starten zonder dat D7 in de kerstvakantie valt? Wat doen jullie als die dag gemist wordt?
8. Als er één factor uit moet, welke is dat, en waarom niet arm B, die geen besluit draagt?
9. Hoeveel focusuren kost het goedkoopste catalogusitem, en hoeveel gerechtigden kunnen in een gemiddelde week niets verzilveren?
10. Wat beschermt de rustarm in de aprilentamens, behalve de uitweg?
11. Liggen er in Utrecht herkansingen van januari in het aprilvenster, en hoe houden jullie die uit de nawerkingsmaat?

## Wat mij zou overtuigen

- **Vóór 2 december:**
  - een vastgelegde voorregistratie met H3b als non-inferioriteitstoets met marge, een gevoeligheidstoets, vier vooraf benoemde uitkomsten met hun gevolg voor (f), en een regel voor meervoudig toetsen;
  - januari-actieven gedefinieerd vóór T − 6, en (c) en (d) op een vooraf gekozen groep, met de bevestiging van de investeerder;
  - een schuifregel met een uiterste startdatum en een schrapvolgorde voor de factoren;
  - een A/A-controle op bevroren code die aantoonbaar twee kalenders met een verschillende T verwerkt, met de uitkomst ingevuld in §9.3.
- **Na de pilot:**
  - een verschil tussen de armen kort na T + 1, dat laat zien dat punten iets doen;
  - in april een rustarm waarvan de ondergrens boven −δ ligt;
  - reactivering van squads in A, ook in de rustarm;
  - een deelnamegraad per vereniging die richting de 30% gaat.

  Dan heeft dit bedrijf iets wat Opal en Forest niet hebben. Zonder die resultaten blijft het een goed ontworpen focus-app met een verenigingskanaal. Dat is ook iets, maar het is een ander verhaal voor de investeerder.

---

*Bronnen voor de kalendercontrole (alleen zoekresultaten gezien; de pagina's zelf zijn in deze sessie niet geopend): [students.uu.nl, jaarkalender bètawetenschappen](https://students.uu.nl/beta/praktische-informatie/jaarkalender) (periode 3: 8 februari t/m 25 april 2027); [students.uu.nl, jaarkalender Diergeneeskunde bachelor](https://students.uu.nl/dgk/diergeneeskunde-ba/mijn-studie/jaarkalender) (periode 3 t/m 16 april 2027; herkansingen periode 2: 19 t/m 23 april 2027); [students.uu.nl, jaarkalender Literatuurwetenschap](https://students.uu.nl/gw/literatuurwetenschap/mijn-studie/jaarkalender) (19–23 april onderwijsvrij). Vóór vastlegging controleren op de primaire pagina's per faculteit. De bevindingen over de code komen uit `packages/core/src/params/v1.ts` en de modulebestanden in `packages/core/src/` in deze repository.*
