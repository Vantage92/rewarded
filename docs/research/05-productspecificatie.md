# Rewarded — Productspecificatie web-MVP

*Rol: hoofd product. Versie 1.3, 5 november 2026, herzien na pitchronde 3 volgens de bindende besluiten van de founder (`docs/pitch/ronde-3-founder-reactie.md`, gedateerd 5 november), die voorgaan op die na pitchronde 2 (`docs/pitch/ronde-2-founder-reactie.md`) en pitchronde 1 (`docs/pitch/ronde-1-founder-reactie.md`, inclusief de aanvulling na de samenhangcontrole; wijzigingslog onderaan). Maten, drempels, de kalenderregel en de beslisregels van de pilot staan in de concept-voorregistratie `docs/pilot/voorregistratie.md`; bij verschil geldt die. Bouwdocument voor de gesloten pilot (vanaf 2 december 2026, uiterlijk 9 december, anders vanaf 4 januari 2027 volgens de schuifregel in voorregistratie §3.5, met data per vereniging volgens de kalenderregel, 4.13) en de gecontroleerde uitbreiding na het lanceringsbesluit. Bindend kader: `docs/01-businessplan.md` (verder: businessplan). Basis: variant MVP-first (`drafts/05-spec-mvp-first.md`), door beide juryleden als winnaar gekozen, aangevuld met onderdelen uit Retentie-first en Groei-first volgens `drafts/05-jury-1.md` en `drafts/05-jury-2.md`. Bewijs: rapporten 02, 03, 08 en 09 in `docs/research/`. Een getal dat niet uit die bronnen komt, staat er als **werkhypothese** (een keuze die we toetsen) of **aanname** (iets wat we niet weten). Hoofdstuk 10 verantwoordt de keuzes.*

---

## 1. Doel van de MVP en succescriteria

De pilot is een **verkennende pilot met één redelijk gepowerde vergelijking** (businessplan §1, besluit 1 na ronde 1). Ze beantwoordt drie vragen op twee momenten. Na de laatste tentamenweek van het laatst eindigende pilotcohort (besluit 1 na ronde 2; werkhypothese niet vóór 8 februari 2027, **aanname**) de operationele vraag voor het lanceringsbesluit: komen studenten op gang en terug, blijven fraude en kosten binnen de perken, en worden deelnemers beschermd? Daarna volgt geen open lancering maar een gecontroleerde uitbreiding op uitnodiging (besluit 2 na ronde 2). Tijdens het seizoen de ene gepowerde vergelijking: halen studenten met een slinkend weekbudget (arm B) vaker hun dagdoel dan met gewone bijschrijving (arm A)? En na het aprilvenster van 2027, verkennend, de centrale hypothese: blijft het gedrag deels staan als de doelbonus stopt, omdat een zelfgekozen commitment het overneemt? Volgens rapport 08 had van 54 interventies in Milkman e.a. (2021) 8% na afloop nog effect, en het enige veldbewijs dat een commitmentaanbod effect behoudt, is Royer e.a. (2015), één experiment met een zelfgefinancierd contract dat bij het einde van de prikkel werd aangeboden (rapport 08 §7, implicatie 8). Dat een zachte vorm zonder geld ook werkt, is een hypothese. Daarvoor bouwen we de Belofte, die in de vroege arm bij de aangekondigde stop van de doelbonus wordt aangeboden, en een rustperiode-arm waarin de helft van de squads vanaf de bonusstop van de eigen kalender tot en met haar aprilvenster geen punten verdient (besluit 3 na ronde 2; onder voorbehoud van de advocaat). Die rustperiode-arm is de steigertoets: een non-inferioriteitstoets met marge δ en vier vooraf benoemde uitkomsten (steiger ondersteund, afhankelijkheid, verdringing, onbeslist), die via voorwaarde (f) de omvang van de tweede tranche bepaalt (besluit founder na ronde 3, G-MF1; voorregistratie §4). Het lanceringsbesluit hangt niet af van die hypothese; het bedrijfsbesluit valt na het aprilvenster, op bindende voorwaarden in getallen (voorregistratie §6.1). De ene gepowerde vergelijking (H2) draagt geen bedrijfsbesluit, en arm B is daarom de eerste factor die vervalt als er geschrapt moet worden (besluit founder na ronde 3, G-MF3; 8).

Een functie hoort in de MVP als een van die vragen zonder haar niet te beantwoorden is, als het gemeten gedrag zonder haar niet kan ontstaan, of als ze deelnemers aan het experiment beschermt. De tijd is de harde grens: de pilot start over vier weken. De begroting rekent in tranche 1 met twee bouwrollen (een full-stack engineer en een ontwerper in deeltijd), met AI-ondersteunde ontwikkeling; de senior engineer native (eerst Android UsageStats, daarna iOS) komt pas bij tranche 2, en niet zolang de native bouw is uitgesteld (businessplan §10, voorwaarde f; **aanname**: de mensen zijn nog te werven; rapport 09 §8 schat de eerste twee treden op 2–4 plus 2–3 weken). Die rollen gelden voor de begroting vanaf januari 2027; R1–R3 in november en december bouwt de founder zelf met AI-ondersteunde ontwikkeling, met een freelance senior engineer voor de toesteltest en een bredere codereview als de eigen middelen dat toelaten. De onafhankelijke review van de experiment- en grootboekcode vóór de A/A-controle is verplicht (besluit founder, G-S12). Zolang er minder dan drie bouwers zijn, gelden ten minste de extra schrappingen voor twee ontwikkelaars (architectuur §12.4). Daarom zijn er vier releases, en na 5 januari bouwen we geen nieuwe modules meer. **Schuifregel** (besluit founder na ronde 3, G-MF3 en investeerder MF2): de pilot start pas als DPIA, voorregistratie, kalenderregel in de code, bevriezing met onafhankelijke review, A/A-controle en het minimum aan eigen middelen voor de vier poorten er zijn; dat is uiterlijk 9 december (go/no-go-cohort tot en met 13 december), anders op 4 januari 2027 met een verkort seizoen, waarbij R1–R3 samen live gaan (voorregistratie §3.5).

| Release | Datum | Inhoud | Waarom dan |
|---|---|---|---|
| R1 | 2 december 2026 (uiterlijk 9 december) | Tentamenkalender per vereniging (per faculteit waar die verschilt) als enige bron van de pilotdata, met de kalenderregel en de standaardkalender voor eenheden zonder vereniging (4.13), onboarding met leeftijdscheck, geïnformeerde deelname, instroomvragenlijst, wekelijkse welzijnsmeting en oefensessie, focus-engine met nachtregel, grootboek met doelbonus in twee armen en puntenplafond van 300 minuten, tentamendag, catalogus met wachttijd, vast vrijgaveschema en voorraad naast gerechtigden, telefoonverificatie met nummertype, instellingsmail, squads met herstelroute en hersamenstelling, uitnodigingsobject met squadprompt-experiment, meldknop squadnamen, verenigingscode met plafond en externe ledentalbron, promotiekit, bestuursdashboard, aanloopklassement, eventlog, experimenttoewijzing met seed, fraudewachtrij met meldroute, H12 op overlap over de sessieduur, wekelijkse steekproef met het uitbreidingscohort als eigen stratum, schadesignalen per code met schadegrens, weekitems per leeftijdsklasse, vakantiepauze, nepdeur Plus (alleen web); instellingsanker uniek per adres met HMAC (in R1 als dat haalbaar is, uiterlijk in R2; live vóór 4 januari) | Alles wat vanaf dag één gemeten of beschermd moet worden; de koude start heeft in december een instrument nodig |
| R2 | 16 december 2026 | De Belofte (eerste aanbod op T − 6 van de vroegst eindigende kalender, met hernieuwingsaanbod en het tweede aanbod op A-start − 7 in de vroege arm), duels op gehaalde dagdoelen, deelbare bewijskaart (Should), modus zonder punten (Should), competentiefeedback (Should), pilotreflectie en na-seizoensvragenlijst met motivatie-items, herbevestiging van bestaande instellingsankers | Tweede en derde uitnodigingsmoment vóór de kerst; de Belofte moet klaar zijn ruim vóór het eerste aanbod |
| R3 | 5 januari 2027 | Prijsperiode Blokk-challenge per kalender met instellingsanker en winnaarssteekproef, individuele prestatiechallenge, referral achter een vlag, rustperiode-arm tot en met het aprilvenster achter een vlag, met de aparte uitweg, het herhaalbericht op A-start, de arm per persoon vanaf T − 6, persoonlijk doorlopende punten voor minderjarigen en het uitbreidingscohort in een rustsquad, en de bewakingsregel (aan vóór de eerste bonusstop als de advocaat akkoord geeft), aprilchallenge op deelnamegraad, gerichte ambassadeurssteekproef | Tentamenweken; referral pas na de meetperiode voor K uit squads |
| Lanceringsbesluit en uitbreiding | Na de laatste tentamenweek van het laatste pilotcohort | Geen nieuwe modules; uitbreiding op uitnodiging met MAU-grens en wachtlijst, eigen voorraad voor het uitbreidingscohort; kaart-QR naar de wachtlijst | Stabiliseren, niet bouwen |

De trekkingsmodule wordt niet gebouwd (businessplan §1, besluit 3 na ronde 1). Het datamodel en de vlag `draws` mogen als lege plek blijven; er is geen route, scherm of job.

| Criterium | Drempel | Bron | Wat de MVP levert | Release |
|---|---|---|---|---|
| Activatie | ≥ 60% | Businessplan §7 | Onboarding onder twee minuten, eerste sessie van 25 minuten, oefensessie | R1 |
| D7 van het go/no-go-cohort (registratie vanaf de startdatum tot en met 13 december), minstens één sessie op dag 6–8, op kalenderdata | ≥ 25% als vaste lat, hoogstens één herhaling in de zone 15–25%; **stopregel** < 15% | Businessplan §7; voorregistratie §5 | Servertijd, dagdoel, squadstreak, live aanwezigheid, e-mailherinnering | R1 |
| Geschat aandeel frauduleuze accounts (onafhankelijke steekproef) | Bovengrens van het 95%-interval < 5%, één grens in pilot en uitbreiding; gerapporteerd als ondergrens | Businessplan §9; voorregistratie §7 | Wekelijkse willekeurige steekproef van 30 accounts, gestratificeerd per vereniging; lichte controle met criteria per oordeel; markeringen alleen als wachtrijlast | R1 |
| Kosten in de pilot | Binnen het pilottotaal: €1.500 voor de gesloten pilot, daarna de posten voor het onderzoekscohort (werkhypotheses; voorregistratie §5.4). De weekmaat (≤ €0,06 per wekelijks actieve gebruiker per week, **aanname**) geldt pas vanaf de uitbreiding | Businessplan §6, §7 | Gescheiden budgetposten, vast vrijgaveschema, voorraadcontrole, europlafonds, kostenquery per post | R1 |
| Deelnemersbescherming | Geen stopregel of bewakingsregel geraakt; absolute schadegrens: S1–S4 bij minder dan 2% van de wekelijks actieven (werkhypothese tot de ijking, per code gerapporteerd) | Founder G4, G-S7, G-S1, G-S5; voorregistratie §8 | Geïnformeerde deelname, wekelijkse welzijnsmeting, schadesignalen, stopregel arm B, bewakingsregel rustarm | R1 |
| Gehaalde dagdoelen tijdens het seizoen, arm B tegenover A (H2) | Volgt uit de poweranalyse | Voorregistratie §4 | Doelbonus in twee armen, toewijzing met seed | R1 |
| Squadeffect via encouragement design (H1) | Volgt uit de poweranalyse; verkennend | Voorregistratie §4 | Squadprompt-experiment bij solo-gebruikers | R1 |
| Nawerking in april 2027 (H3) | Verkennend; H3b als non-inferioriteitstoets (δ werkhypothese 10 procentpunten) met gevoeligheidstoets en Holm; vier uitkomsten bepalen (f) | Businessplan §5, §10; rapport 08 H-B, H-C; voorregistratie §4 | De Belofte bij de stop van de doelbonus en vóór A, rustperiode-arm, randomisering per squad, kalender per faculteit met herkansingsdagen | R2, R3 |
| D30 buiten de tentamenweken (gemeten in het na-seizoensvenster N van de eigen kalender) | **Stopregel** < 6% (geen tweede tranche en geen opschaling; bedrijfsbesluit) | Businessplan §7; voorregistratie §6.1 | Eventlog, kalender per vereniging en kalendertijd per cohort | R1 |
| Voorwaarden (c) en (d) voor de tweede tranche | Januari-actieven: ≥ 2 sessiedagen in T − 13 tot en met T − 7; beslissen op de doorlopende arm, de rustarm apart (G-MF2). (c) ≥ 20% met ≥ 2 sessiedagen per week in 1–14 februari, of in N van de eigen kalender als dat venster overlapt met de laatste tentamenweek of de herkansingen; (d) ≥ 25% terug in het aprilvenster, zonder herkansingsdagen, ook gerapporteerd voor deelnemers zonder vereniging (voorregistratie §6.1) | Businessplan §10; voorregistratie §6.1 | Eventlog en kalender per vereniging | R1 |

Vier kanttekeningen houden de meting eerlijk. Het oude budgetcriterium werd per constructie gehaald, omdat er nooit meer verzilverd kan worden dan er gedekte voorraad is; de weekmaat van ronde 1 faalde juist per constructie, omdat de pilotprijzen in één of twee prijsweken vallen (gedragswetenschapper ronde 2). Daarom is de maat in de pilot het pilottotaal met een vast vrijgaveschema, en de weekmaat pas een maat voor de uitbreiding. Het aandeel gemarkeerde sessies hangt af van onze eigen heuristieken en meet detectie, niet fraude; daarom is de go/no-go-maat de onafhankelijke steekproef, en het aandeel markeringen alleen de wachtrijlast. De ruwe vergelijking van D7 tussen squad en solo meet vooral zelfselectie en is beschrijvend, geen go/no-go. En de nawerkingshypothesen heten verkennend zolang de poweranalyse geen plausibel kleinste detecteerbaar effect oplevert. Alle definities, drempels, kalenderdata en de randomisatieseed staan in de voorregistratie, die de founder vóór 2 december vastlegt.

## 2. Gebruikers en hun taken

**Student (16+).** Een hbo- of wo-student voor zijn tentamens die zijn telefoon niet kan laten liggen. Hij wil een studieblok afmaken, zien dat het lukte en een ritme vasthouden, zonder het gevoel dat hij voor centen studeert. Hij komt binnen via een vriend of vereniging, of buiten verenigingen (een deel van de pilot stroomt bewust zo in). 16- en 17-jarigen zitten standaard in arm A, vallen buiten de rustperiode-arm, hebben live aanwezigheid standaard uit en duelleren alleen binnen hun squad.

**Squadlid.** Dezelfde student in een squad van drie tot zes. Zijn kernvraag is "doen de anderen mee?", niet "hoeveel punten heb ik?".

**Verenigingsbestuur.** Twee à drie bestuursleden, meestal de commissaris onderwijs. In de koude start de belangrijkste verspreider; het dashboard is daarom vooral een wervingsinstrument. Individuele monitoring is uitgesloten (businessplan §9). De vereniging tekent een korte overeenkomst die haar rol vastlegt, met de regel dat ze geen herleiding probeert en geen ledenlijst uploadt.

**Beheerder van Rewarded.** De founder plus een pilotbeheerder (10–15 uur per week vanaf 2 december, freelance of student-assistent; eigen middelen tot en met december, tranche 1 vanaf januari; businessplan §10) voor beheer, steekproef en fraudewachtrij, en later een of twee teamleden (**aanname**). De pilotbeheerder is geen lid van een deelnemende vereniging, geen ambassadeur en geen deelnemer, en meldt per steekproefitem een persoonlijk belang (besluit founder na ronde 3, jurist should-fix 6; geheimhoudingsverklaring pilotbeheerder). Elk besluit met gevolgen voor punten of prijzen neemt een mens; elke inzage in sessiegegevens wordt gelogd.

| Rol | Belangrijkste taken | Wat de rol nooit ziet of kan |
|---|---|---|
| Student | Sessie starten, uitleg lezen, dagdoel kiezen, punten verzilveren, kaart maken | Sessies of minuten van anderen buiten de eigen squad of het eigen duel |
| Squadlid | Uitnodigen, aanwezigheid zien, streak bewaken, opt-in minuten vergelijken, Belofte doen, duel | Een openbare individuele ranglijst; punten van anderen |
| Bestuur | Aanmelden, overeenkomst tekenen, ledentalbron aanleveren, werven met de promotiekit, stand volgen, prijs ontvangen | Namen, uren of sessies van leden; wie niet meedoet; een export; berichten aan leden; een ledenlijst uploaden |
| Beheerder | Verenigingen, challenges, partners, catalogus, budget, fraudewachtrij, steekproeven, eerste verzilveringen, schadesignalen, beroep, vakantiepauze, KPI-query's | Sessiegegevens inzien zonder reden en zonder logregel |

## 3. Kernflows stap voor stap

### 3.1 Onboarding en leeftijdscheck (R1)

1. Binnenkomst via een squad-, duel- of verenigingslink, een QR uit de promotiekit of een wachtlijstuitnodiging. In de gesloten pilot geeft alleen zo'n uitnodiging toegang; de bron wordt als eerste vastgelegd.
2. Bij een persoonlijke uitnodiging staat de uitnodiger bovenaan. De belofte gaat over focus en samen; beloningen staan in één regel eronder: "Na vijf uur focus kun je punten inwisselen bij partners. Geen geld."
3. De eerlijke claim uit rapport 09 §3.3, letterlijk: "Rewarded telt je focustijd zolang de app zichtbaar op je scherm openstaat. Ga je naar een andere app of tabblad, of gaat je scherm uit, dan stopt de sessie."
4. E-mail met magic link, zonder wachtwoord; voornaam verplicht, achternaam optioneel. Het adres wordt voor de uniekheidscontrole genormaliseerd (plus-adressen weg, punten weg bij providers die ze negeren) en als hash naast het echte adres bewaard; een tweede account op hetzelfde genormaliseerde adres kan niet.
5. Geboortedatum. Onder 16: "Rewarded is er vanaf 16 jaar", en er wordt niets opgeslagen. Anders bewaart de server alleen de leeftijdsklasse en de datum van 18 worden (4.10). Voor `16_17` staat live aanwezigheid daarna standaard uit, met de schakelaar op dit scherm.
6. Geïnformeerde deelname, vóór het akkoord, in gewone taal: de pilot vergelijkt door loting twee bonusregels, twee momenten voor de Belofte, een uitnodiging om een squad te vormen en (onder voorbehoud van de advocaat) een rustperiode zonder nieuwe punten vanaf het einde van de tentamenweken van je instelling tot en met de tentamenperiode van april, die ook in tentamenweken kan vallen; de doelbonus stopt aan het einde van de laatste tentamenweek van je instelling, met de datum erbij (4.13); de catalogus is schaars en toont per week de voorraad naast het aantal studenten dat mag verzilveren; vanaf de dag waarop je je groep hoort, hoort die groep bij jou, ook als je van squad wisselt; uit de rustperiode stappen kan altijd en laat je in het onderzoek; afmelden voor het onderzoek kan altijd in Ik, zonder verlies van punten (4.10).
7. Akkoord met voorwaarden en privacyverklaring: welke signalen we loggen en waarom.
8. Korte instroomvragenlijst, overslaanbaar en zonder punten (7.4): welzijn, studietijd en telefoonafleiding, en of de student Forest of Opal gebruikt of gebruikte. Vóór de welzijnsitems staat een aparte toestemmingsvraag, omdat die items gezondheidsgegevens kunnen zijn (art. 9 AVG; besluit founder 5 november, definitief na vraag advocaat 9). Wie geen toestemming geeft, slaat de welzijnsitems over en krijgt de rest. Wie toestemming geeft, krijgt vanaf de tweede focusweek ook de wekelijkse meting van twee items (3.14). **16- en 17-jarigen** krijgen wekelijks alleen de vragen over studietijd en afleiding, niet over stress en ervaren druk, zolang de advocaat vraag 9a niet positief heeft beantwoord (besluit founder na ronde 3, jurist should-fix 8: stilte is de voorzichtige kant; dit vervangt het besluit uit ronde 2). De beslissing valt één keer, vóór de eerste uitnodiging, zodat de regel tijdens de pilot niet verandert (voorstel juridisch team, gebruiksvoorwaarden §6.9). De app kiest de weekitems daarom per leeftijdsklasse, met een parameter `weekly_items_16_17` (`study_only` standaard, `wellbeing` alleen na een positief antwoord op 9a). Of de welzijnsitems op de vaste momenten voor 16- en 17-jarigen dezelfde beperking krijgen, heeft de founder niet besloten (open vraag 27). Voor de stopregel van arm B verandert dat niets: 16- en 17-jarigen zitten altijd in arm A en tellen niet mee in de analyse van de doelbonus (7.3), dus ook niet voor het minimum van 40 antwoorden per arm (voorregistratie §8.3).
9. Dagdoel kiezen (25, 50, 90 of 120 minuten, standaard 25), met de overmoedrem uit 4.4.
10. Tip "Niet storen": een inkomend gesprek of het openen van een melding stopt de sessie.
11. Oefensessie van één minuut: "Start, en ga dan even naar een andere app." Zo ziet de student wat een afbreking is.
12. "Start je eerste sessie van 25 minuten." Wie via een squadlink kwam, ziet zijn squad erboven. Een solo-gebruiker in de arm "sterke squadprompt" ziet op dag 1, 2 en 3 bovenaan de kaart uit 3.5.

### 3.2 Eerste focussessie (R1)

1. Eenmalige checklist: telefoon met het scherm naar beneden, liefst aan de lader; op de laptop het tabblad open in een zichtbaar venster.
2. Keuze 25, 50 of 90 minuten. De server opent de sessie in servertijd en geeft een nonce terug.
3. De client vraagt een Wake Lock aan. Lukt dat niet: "Je scherm kan vanzelf uitgaan. Zet automatisch vergrendelen tijdelijk uit, anders stopt je sessie."
4. Tijdens de sessie: donker scherm, resterende tijd, wie van de squad ook focust, één knop Stoppen. Geen punten in beeld: die maken van de sessie werk voor loon (Gneezy e.a. 2011, rapport 08 §7 implicatie 7).
5. Einde: de server valideert (4.1) en schrijft de punten direct bij (Levitt e.a. 2016). Het eindscherm toont eerst het dagdoel en de weekprestatie ("Je dagdoel is gehaald. Deze week 3 van de 7 dagen."), dan de squad, en pas onderaan, klein, de punten en de inverdienvoortgang. Is de focusduur gestegen, dan staat onder het dagdoel één regel competentiefeedback ("Je focusduur steeg van 25 naar 40 minuten"; Should, 4.14). Informatieve feedback verhoogde in Deci e.a. (1999) de vrijwillige voortzetting; het gewicht ligt op het zelfgekozen doel, niet op het stukloon per minuut (rapport 08 §7; founder GS1).
6. Startte de sessie tussen 01:00 en 04:00, dan toont het eindscherm een rustig signaal ("Het is laat. Deze sessie telt, maar zonder doelbonus. Slaap telt ook."), zonder verwijt (4.2).
7. Onderaan, zonder pop-up, vanaf R2: "Maak een kaart".

### 3.3 Sessie afgebroken (R1)

1. De server sluit de sessie op het eerste afbreeksignaal uit 4.1.
2. Bij terugkeer, zonder verwijt: "Je sessie stopte om 14:32 omdat Rewarded niet meer zichtbaar was. Je hield 18 minuten vol. Afgebroken sessies leveren geen punten op: we kunnen alleen tijd belonen die we kunnen zien."
3. Knoppen: "Opnieuw beginnen", "Kortere sessie" (na een afgebroken sessie van 50 of 90 minuten) en "Klopt dit niet?". Die laatste zet een melding in de fraudewachtrij (6.4) en staat extra duidelijk bij een afbreking door een heartbeatgat, omdat daar een automatisch signaal punten kost.
4. Na de derde afbreking op een dag stelt de app een kortere sessie en "Niet storen" voor. Een afgebroken sessie breekt de squadstreak niet; alleen een gemist dagdoel telt. De squad ziet geen "gefaald".

Een gebroken reeks leidt tot meer terugval dan het gedrag verklaart, en een herstelmogelijkheid dempt dat (Silverman en Barasch 2023, rapport 08 §4). Punten voor een afgebroken sessie mogen niet; de weg terug kort maken wel.

### 3.4 Punten en catalogus (R1)

1. Saldo in drie delen: *beschikbaar*, *in afwachting* (gemarkeerde sessie of weekbudget arm B) en *referral, nog niet vrij*; daaronder de inverdienvoortgang.
2. Catalogus met per item puntenprijs, financier, voorraad van deze week en voorwaarden, en bovenaan per week de vrijgegeven voorraad naast het aantal studenten dat mag verzilveren ("Deze week 40 beloningen voor 120 studenten die mogen verzilveren"; founder J10). Bovenaan: "Punten geven toegang tot de catalogus zolang de voorraad strekt. Punten zijn geen geld en geven geen recht op een bepaalde beloning."
3. Onder 300 geverifieerde minuten is Verzilveren uitgeschakeld, met de resterende tijd erbij. Daarna volgt een wachttijd van 7 dagen op de eerste verzilvering, waarin een beheerder kort meekijkt (4.3): "Je eerste verzilvering kan vanaf [datum]. We kijken kort mee, zoals bij iedereen."
4. Bij de eerste verzilvering verifieert de student één mobiel telefoonnummer per sms (rapport 09 §8); de sms-verwerker controleert het nummertype, virtuele en VoIP-nummers worden geweigerd.
5. De server controleert in één transactie saldo, week- en maandplafond, voorraad en dekking, schrijft af en reserveert een vouchercode (in de app en per e-mail).
6. Bij een plafond: "Maandag kun je weer verzilveren. Je punten blijven staan." Is de voorraad van vandaag op: "Vandaag op. Morgen komt er weer een deel van de weekvoorraad bij."

### 3.5 Squad aanmaken en uitnodigen (R1)

1. "Focus samen. Squads houden het beter vol." De student kiest een naam (gemodereerd) en optioneel zijn vereniging.
2. Hij krijgt een uitnodigingslink (4.4), te delen via WhatsApp met de Web Share API. De voorgestelde tekst gaat over focus en samen en noemt geen punten of prijzen, ook niet in de linkvoorvertoning.
3. De genodigde slaat de wachtlijst over, doorloopt 3.1 en landt in de squad.
4. Tot drie leden is de squad "in opbouw" ("Nog 2 vrienden nodig"); de maker focust intussen solo.
5. Het squadscherm toont leden, wie nu focust, wie zijn dagdoel haalde, wie op pauze staat en de streak. Bij een squadnaam staat een meldknop ("Naam melden"); een melding gaat naar de moderatie (`name_status`) (art. 16 DSA; founder JS11).
6. **Squadprompt-experiment.** Solo-gebruikers (geregistreerd zonder squad- of duellink en op dag 0 niet in een squad) worden bij registratie geloot naar de sterke squadprompt of de standaardflow (5, toewijzing). In de sterke arm staat op dag 1, 2 en 3 bovenaan Focus een kaart "Focus samen met 2 vrienden" met een kant-en-klare link en voorgestelde WhatsApp-tekst; wegtikken kan, de kaart komt de volgende dag terug tot en met dag 3. De standaardflow heeft alleen de gewone ingang op het squadtabblad. Er is geen contactimport en geen vriendensuggestie.
7. **Squad uit elkaar.** Heeft een squad binnen een tentamenperiode van haar kalender (4.13) 7 dagen achter elkaar minder dan 2 actieve leden (lid met een voltooide sessie in die 7 dagen), dan krijgen de overgebleven leden een route om opnieuw samen te stellen (nieuwe uitnodigingslink, bestaande squad) of samen te voegen met een andere squad van dezelfde vereniging en dezelfde rustperiode-arm die ook onder de 2 actieven zit en zelf om samenvoegen vraagt (4.4). Buiten de tentamenperiodes is de route gepauzeerd, zodat een seizoensdip niet als falen voelt (founder G-S6).

### 3.6 Duel (R2)

1. Uitdagen vanaf een squadlid, of met een duellink als beide spelers 18+ zijn. Een 16- of 17-jarige ziet de duellink niet en kan alleen een squadlid uitdagen (founder JS3).
2. De tegenstander accepteert binnen 48 uur; accepteren is de opt-in voor de vergelijking. Een nieuwe gebruiker doorloopt eerst 3.1; is hij `16_17`, dan vervalt een duellink van buiten de squad.
3. Zeven dagen lang zien beiden dagelijks of de ander zijn dagdoel haalde, en het aantal gehaalde dagdoelen. Wie de meeste dagdoelen haalt, wint een badge; gelijk is gelijkspel. Daarna revanche of samen een squad. Minuten zijn geen criterium (founder GS4).

### 3.7 Verenigingschallenge en bestuursdashboard (R1, prijsperiode R3)

1. Na een schriftelijke toezegging (ledental met bron, promotieverplichting met kanalen en data, contactpersoon in het bestuur; businessplan §3) en een getekende korte overeenkomst over de rol van de vereniging maakt de beheerder de vereniging aan. Het ledental komt uit een externe bron (opgave aan de instelling voor de erkenning of de bestuursbeurs, of een bevestiging van de faculteit) en wordt vóór het aanloopklassement vastgelegd. Zonder externe bron doet de vereniging mee aan het klassement, maar niet om de hoofdprijs.
2. Het bestuur krijgt een lidmaatschapscode, een QR per kanaal en de promotiekit.
3. Een lid scant de QR of voert de code in; zijn sessies tellen vanaf dat moment.
4. Tot de vakantiepauze loopt een aanloopklassement zonder prijs; in de twee focusweken die eindigen op T van de eigen kalender de prijsperiode (4.6); in het aprilvenster de aprilchallenge voor het onderzoekscohort, met collectieve prijzen op deelnamegraad en voor beide rustperiode-armen gelijk. Vóór de bekendmaking van de aprilchallenge vraagt Rewarded zelf bij elke vereniging het actuele externe ledental op; dat is geen keuze van de vereniging (besluit founder na ronde 3, jurist should-fix 7; challengevoorwaarden A14.3).
5. Leden zien de ranglijst van verenigingen met het ledental en de bron ernaast; het bestuur ziet aggregaten (4.6).
6. Na fraudecontrole, de verplichte steekproef van 20 meegetelde leden en winnaarsverificatie wordt de uitslag definitief en bekendgemaakt (4.6, 4.7).

### 3.8 Verdiende prijs (R3)

1. De beheerder maakt een prestatiechallenge aan ("elke dag van de tentamenweek minstens 120 minuten") met een vaste prijs per winnaar en evenveel plaatsen als er gefinancierde prijzen zijn.
2. Inschrijven kan vóór de start, tot de plaatsen vol zijn: wie de prestatie levert, krijgt de prijs. Geen race, geen loting.
3. Voortgang per dag, met "Verdiend". Na afloop winnaarsverificatie en levering, of een reden en beroep.

### 3.9 Verlote prijs: niet gebouwd

Trekkingen worden niet gebouwd (businessplan §1, besluit 3; founder J4 en S9). Er is geen flow, scherm, route of job. Komen ze ooit, dan alleen na een schriftelijke advocatenopinie én een expliciete schriftelijke reactie van de Kansspelautoriteit (stilte is nee), als één promotioneel spel per jaar met hooguit twintig trekkingen en een pot onder €100.000, met de spelvoorwaarden uit het sjabloon in `docs/juridisch/`. De vlag `draws` en de lege plek in het datamodel blijven (architectuur §7).

### 3.10 Deelbare bewijskaart (R2, Should)

1. Na een voltooide sessie, mijlpaal of gewonnen duel: "Maak een kaart". Delen staat standaard uit.
2. Inhoud volgens 4.8; nooit punten, bedragen of beloningen.
3. De QR opent de verificatiepagina; "Focus ook" leidt naar de wachtlijst met voorrang, ook tijdens de uitbreiding (die loopt alleen op uitnodiging). Delen levert niets op.

### 3.11 Referral (R3, vlag)

1. Vanaf 5 januari, na besluit van de founder, heeft elke gebruiker een persoonlijke link; squad- en duellinks tellen dan ook als referral.
2. Beide accounts krijgen punten met de status *nog niet vrij*. De uitnodiger ziet alleen "Joris: 2 van 3 sessies".
3. Vesting volgens 4.9: drie sessies in zeven dagen én de wachttijd op de eerste verzilvering van de genodigde voorbij; zonder vesting vervallen de punten stil.

### 3.12 De Belofte (R2)

Deze flow maakt de centrale pilothypothese verkennend meetbaar (10.3; voorregistratie H3a).

1. In de arm "vroeg" ziet de gebruiker het aanbod bij de aangekondigde stop van de doelbonus: op focusdag T − 6 van zijn kalender, zeven dagen vóór de bonusstop (besluit 1 na ronde 2; het besluit uit ronde 1 om dat voor iedereen op 11 januari te doen, is vervallen): "Op [datum] stopt de doelbonus. Wil je jezelf iets beloven voor de komende twee weken?" In de arm "laat" komt hetzelfde aanbod op de dag na het aprilvenster (voorregistratie §3.1). Dit volgt Royer e.a. (2015): het commitment wordt aangeboden op het moment dat de prikkel afloopt. De vroege arm krijgt daarnaast een **tweede aanbod** op focusdag A-start − 7, met dezelfde tekst voor iedereen in die arm, zodat er in het aprilvenster een Belofte kan lopen (besluit founder na ronde 3, G-S10; het moment is een voorstel productteam): "Volgende week beginnen je tentamens. Wil je jezelf iets beloven voor de komende twee weken?"
2. Hij kiest dagen per week, minuten per dag en getuigen (de squad of niemand). De app stelt een waarde voor op basis van wat hij werkelijk deed.
3. De getuigen zien de Belofte en per dag of ze gehaald is. Er hangen geen punten aan.
4. Na 14 dagen een reflectie ("Je haalde je Belofte op 9 van 12 dagen"): verlengen, aanpassen of stoppen. In de vroege arm is dat een vooraf vastgelegd hernieuwingsaanbod: één keer, voor nog eens 14 dagen, met dezelfde tekst voor iedereen (founder G-S4). Stoppen kan altijd met één tik, zonder schuldtaal.
5. Bij de reflectie krijgen 18-plussers één vrijblijvende vraag: "Zou je bij een volgende Belofte een bedrag inzetten dat naar een goed doel gaat als je hem niet haalt?" Er is geen betaalfunctie; het antwoord indiceert H-C (rapport 08 §7).

### 3.13 Tentamendag (R1)

1. Op Focus en in de dagdoelkaart staat "Vandaag heb ik een tentamen". Aanzetten kan voor vandaag of een latere dag, tot het einde van de focusdag (04:00), hoogstens 3 keer per kalenderweek (**werkhypothese**).
2. Op een tentamendag is het dagdoel opgeschort, zonder joker: de dag breekt geen squadstreak en telt niet als gemist; de joker blijft over. Haalt de student zijn doel toch, dan telt het gewoon, ook voor de doelbonus.
3. In arm B valt de 20 van die dag stil uit het weekbudget, zonder "−20"-melding: "Tentamendag: telt niet mee. Succes." In arm A is er die dag alleen een bonus als het doel gehaald is. Zo blijven de armen gelijk in verwachte waarde (5).
4. Voor de deelnamegraad en duels telt een tentamendag niet als gehaald dagdoel.

### 3.14 Pilotreflectie en vragenlijsten (R1, R2)

1. Instroom (3.1 stap 8), pilotreflectie (focusdagen T + 1 tot en met T + 7 van de eigen kalender), na-seizoensmeting (in het na-seizoensvenster N) en de meting na het aprilvenster (A-einde + 1 tot en met A-einde + 7): een korte vragenlijst van hoogstens één scherm, altijd overslaanbaar, zonder punten. In N en na A staan daarin ook een korte meting van intrinsieke motivatie en één vraag naar niet-beloond studeren ("Studeerde je deze week ook zonder Rewarded?"), per arm geanalyseerd (besluit founder na ronde 3, G-S3). Daarnaast vanaf de tweede focusweek elke week twee items als kaart bij de eerste keer dat de app in die week opent, overslaanbaar, zonder punten, niet in de vakantiepauze, tot en met het aprilvenster (voorregistratie §8.3–8.4): voor 18-plussers stress en ervaren druk, voor 16- en 17-jarigen studietijd en afleiding (3.1 stap 8). De stopregel van arm B rust op deze meting tot en met de bonusstop. Items volgens 7.4. De welzijnsitems verschijnen alleen bij wie de aparte toestemming uit 3.1 stap 8 gaf; die toestemming is in Ik in te trekken.
2. De pilotreflectie bevat één vraag over de bonusregel: "Hoe voelde de bonusregel die je had?" (vijf antwoordopties en een vrij veld), per arm geanalyseerd (founder GS8).

### 3.15 Schadesignaal (R1)

1. De dagafsluiting toetst de signalen S1–S4 uit 6.6.
2. Bij een signaal ziet de student de volgende keer dat hij de app opent één rustige kaart, geen pop-up en geen mail: "Je hebt de laatste tijd veel en laat gefocust. Goed bezig is ook goed slapen. Wil je met iemand praten? [Hulp bij jouw instelling]". De link toont de hulpbronnen van de eigen instelling (studentenpsycholoog, studentendecaan) zoals de beheerder die per instelling heeft vastgelegd. Hoogstens één kaart per signaal per 14 dagen. Er is geen sanctie en niemand anders ziet het.

### 3.16 Rustperiode (R3, vlag, onder voorbehoud van de advocaat)

1. In de voorwaarden staat vanaf de eerste dag dat de helft van de squads door loting vanaf het einde van de laatste tentamenweek van haar kalender tot en met de tentamenperiode van april geen nieuwe punten verdient, dat de rustperiode in tentamenweken kan vallen, dat daarna iedereen weer punten verdient, dat verdiende punten inwisselbaar blijven, en hoe je eruit stapt (besluit 3 na ronde 2). Dat de groep bepaalt of je punten verdient, staat er eerlijk (founder J2).
2. Uiterlijk op T − 6 van zijn kalender ziet elke gebruiker in welke groep zijn squad zit. Vanaf dat moment hoort de groep **bij de persoon**: een latere overstap naar een andere squad verandert hem niet (besluit founder na ronde 3, G-S2). In de rustgroep noemt het bericht in dezelfde zin de uitweg: "Van [T + 1] tot en met [einde aprilvenster] verdient jouw squad geen nieuwe punten; wil je toch punten verdienen, tik dan op Ik wil weer punten verdienen, dan verdien je vanaf morgen weer en blijf je gewoon in het onderzoek. Je punten blijven staan en zijn in te wisselen. Focussen telt gewoon voor je dagdoel, je streak en je squad."
3. Op de focusdagen T + 1 tot en met het einde van het aprilvenster van de kalender boekt het grootboek voor leden van de rustgroep geen `earn_session`; sessies, dagdoel, streak, Belofte en ranglijst lopen door. Vanaf de dag na het aprilvenster verdienen ze gewoon punten. **Persoonlijk doorlopende punten** in een rustsquad krijgen: 16- en 17-jarigen (G-S2), leden van het uitbreidingscohort (jurist should-fix 3), wie zich voor het onderzoek afmeldde en wie uit de rustperiode stapte. Referralpunten zijn ook nieuwe punten: wie in de rustperiode zit, krijgt een referral pas gevestigd na het aprilvenster van zijn kalender, of vanaf de focusdag na zijn rustuitstap (4.9; gebruiksvoorwaarden §11.2; besluit 3 na ronde 2).
4. **Uit de rustperiode stappen** (de knop "Ik wil weer punten verdienen", in het bericht zelf, in het herhaalbericht van stap 6 en in Ik › Onderzoek) is één keuze met een bevestiging die de gevolgen uitlegt: vanaf de volgende focusdag weer punten, geen weg terug naar de rustperiode, de gebruiker blijft in het onderzoek en in de analyse op toewijzing (event `rest_period_exit`). Het staat los van afmelden voor het onderzoek (4.10). **Een overstap** van een lid van de rustgroep naar een squad die doorlopend verdient, na T − 6, telt als deze keuze (`rest_period_exit` met bron `squad_switch`); het aansluitscherm zegt dat vóór de bevestiging (besluit founder na ronde 3, G-S2; gebruiksvoorwaarden §6.4). Uitstap rapporteren we per arm als uitkomst, met de bron apart (voorregistratie §4, H3b).
5. **Nieuwe leden in een rustsquad.** Wie uit het uitbreidingscohort (4.13) bij een squad in de rustgroep komt, verdient zelf gewoon punten en ziet dat vóór hij aansluit; hij krijgt geen toewijzing (besluit founder na ronde 3, jurist should-fix 3; dit vervangt de squadregel uit ronde 2). Wie uit de experimentpopulatie vóór T − 6 bij een squad komt, neemt haar rustperiode-arm over vanaf de eerstvolgende maandag; wie na T − 6 komt, houdt zijn eigen groep (stap 2). Samenvoegen kan alleen binnen dezelfde rustperiode-arm (4.4).
6. **Herhaalbericht in april** (besluit founder na ronde 3, jurist should-fix 4). Op focusdag A-start van de kalender toont de app iedereen in de rustgroep die nog niet uitstapte **één keer** hetzelfde bericht als in stap 2, in dezelfde woorden en met dezelfde knop "Ik wil weer punten verdienen". Geen herinneringsreeks, geen mail, geen aandringen. Het bericht is een vast onderdeel van de behandeling en staat in de voorregistratie (§8.1).
7. **Aprilchallenge.** In het aprilvenster loopt voor het onderzoekscohort een verenigingschallenge met collectieve prijzen op deelnamegraad, voor beide armen gelijk. Zolang de rustperiode loopt (T + 1 tot en met het einde van het aprilvenster van de kalender), zijn er voor het onderzoekscohort in geen van beide armen individuele prestatiechallenges met een prijs; het uitbreidingscohort kan wel meedoen, uit zijn eigen voorraad (challengevoorwaarden B7; voorstel, ter bevestiging door de founder, voorregistratie open punt 13). Zo verschillen de armen tot na het venster alleen in individuele punten (besluit 3 na ronde 2).
8. **Bewakingsregel** (besluit founder na ronde 3, G-S1). Elke maandag van T + 1 tot en met A-einde vergelijkt de weekafsluiting de schadesignalen S1–S4 in de rustgroep met die in de doorlopende groep (6.6; voorregistratie §8.3). Bij overschrijding gaat de vlag `rest_period` uit en verdient iedereen vanaf de volgende focusdag weer punten.
9. Geeft de advocaat geen akkoord (vraag 3), dan gaat de vlag niet aan, vervalt de arm en verdient iedereen doorlopend punten. De tekst in de voorwaarden en de aankondiging vallen dan weg vóór de start.

## 4. Functionele specificatie per module

### 4.1 Focus-engine

**Zichtbaarheid en pauze.** De sessie loopt alleen zolang `document.visibilityState === "visible"`. Er is geen terugkeervenster en geen pauze binnen een sessie: businessplan §4 laat de sessie stoppen zodra je het scherm verlaat, en een venster of pauze opent een fraudeweg die het web niet kan controleren. Wie pauze wil, rondt af en start opnieuw. We loggen wel hoe lang de pagina verborgen was als de gebruiker terugkomt, zodat de founder na de pilot op data over een kort venster kan beslissen (open vraag 9). Op de laptop blijft een zichtbaar tabblad naast een ander venster `visible` (rapport 09 §3.2): werken in een ander venster mag, en `blur` en `focus` zijn alleen een zwak signaal.

**Wake Lock en tijd.** De client vraagt de lock aan bij de start en na elke terugkeer naar `visible`. Wordt hij vrijgegeven terwijl de pagina zichtbaar is (lage batterij, energiebesparing), dan waarschuwt de app en probeert hij opnieuw; de sessie loopt door zolang het scherm aan is. Volgens de compatibiliteitsdata werkt Wake Lock vanaf Chrome 84, Firefox 126, Safari macOS 16.4 en volledig op iOS vanaf 18.4, ook als Home Screen-app (rapport 09 §3.1). Dat is geen veldtest; vóór 2 december testen we op minstens één iPhone (Safari en Home Screen-app) en twee Android-toestellen. Verstreken tijd is `server_end − server_start`; de klok van de client telt niet voor punten.

| Parameter | Waarde |
|---|---|
| Sessielengtes | 25, 50, 90 minuten (businessplan §4); geen vrije lengtes |
| Oefensessie | 1 minuut, alleen in de onboarding en op de pagina "Hoe we tellen"; telt nergens mee |
| Eén sessie tegelijk | Per account, door de server afgedwongen; een start op een tweede toestel beëindigt de eerste (`second_session`) |
| Heartbeat | Elke 30 s, met de laatst ontvangen nonce, zichtbaarheidsstatus en monotone klok (`performance.now()`); de server antwoordt met een nieuwe nonce |
| Einde | De client meldt het einde als de monotone klok de duur bereikt; de server accepteert bij een serververstreken tijd ≥ duur − 30 s |
| Claimvertraging | Seconden van het einde tot de eerste aanraking of terugkeer naar `visible`; alleen signaal (H9), houdt punten niet tegen |

**Heartbeatgaten.** Wifi in een bibliotheek valt soms weg, dus de client buffert zijn zichtbaarheidsgebeurtenissen en heartbeats met monotone tijd en stuurt die bij herstel na. De server beslist pas als de client terug is of als de geplande eindtijd plus 10 minuten zonder herstel verstreken is.

| Situatie | Gevolg |
|---|---|
| Interval tussen heartbeats ≤ 90 s | Telt (normaal netwerkgedrag) |
| Gat > 90 s en ≤ 5 min, met een gebufferd log dat het hele gat dekt: geen `hidden`, buffered heartbeats op tijd, monotone klok binnen 5 s van de serververstreken tijd | Telt |
| Som van gedekte gaten > 10% van de geplande duur | Telt, maar gemarkeerd (H3) |
| Gat > 5 min, ook met log | Afgebroken op de laatste geldige heartbeat (`heartbeat_gap`) |
| Gat > 90 s zonder dekkend log | Afgebroken op de laatste geldige heartbeat (`heartbeat_gap`), met meldroute |
| Log toont `hidden` in het gat | Afgebroken op het tijdstip van `hidden` |

Het maximum van 5 minuten komt uit Retentie-first en is een **werkhypothese**.

**Wat telt als afgebroken.** Elke reden heeft een vaste code en copy, die ook support gebruikt. Een afgebroken sessie levert geen punten op en telt niet voor dagdoel, streak, duel, challenge of Belofte. Voltooid is een sessie die het geplande einde haalt zonder afbreekreden.

| Code | Reden | Kern van de uitleg |
|---|---|---|
| `hidden` | `visibilitychange` naar `hidden` of `pagehide` vóór het einde | "Rewarded stond niet meer op je scherm." |
| `heartbeat_gap` | Gat zonder dekkend log, of gat > 5 minuten | "We kregen een tijd geen signaal van je toestel." |
| `user_stop` | Stoppen na bevestiging | "Je stopte zelf." Geen fraudesignaal |
| `second_session` | Sessie gestart op een ander toestel | "Je startte een sessie op een ander toestel." |
| `late_end` | Einde > 10 minuten na de geplande eindtijd zonder heartbeats ertussen | "We kregen je einde te laat binnen." |

| Randgeval | Gedrag | Reden |
|---|---|---|
| Inkomend gesprek | Afgebroken (`hidden`) | Niet te onderscheiden van een app openen; preventie via "Niet storen" |
| Melding bovenin zonder openen | Loopt door | Geen zichtbaarheidswijziging |
| Batterij leeg of toestel uit | Afgebroken op de laatste heartbeat | Geen signaal |
| Klok van het toestel vooruitgezet | Geen effect op de duur; afwijking > 5 min markeert (H4) | Servertijd |
| Twee tabbladen | Het tweede kan geen sessie starten | Eén sessie per account |
| Laptop dichtgeklapt of venster geminimaliseerd | Afgebroken (`hidden`) | MDN, rapport 09 §3.1 |
| Sessie over 04:00 | Telt voor de startdag | Eén dagrand |
| Sessie gestart tussen 01:00 en 04:00 | Telt voor punten, dagdoel en streak, maar levert geen doelbonus op; rustig signaal op het eindscherm (4.2) | Nachtwerk niet als norm (founder GS9) |
| Storing aan onze kant | Sessies met een gat in de storingsperiode gaan naar de wachtrij en worden hersteld | Onze fout, niet die van de student |

**Uitleg.** Elke afgebroken of gemarkeerde sessie toont de reden in gewone taal en de tijd tot het stoppen. De pagina "Hoe we tellen" geeft de eerlijke claim, deze regels en wat we niet kunnen zien (een tweede apparaat, of je echt leert).

### 4.2 Puntengrootboek

Het grootboek is een append-only tabel met mutaties (type, bedrag, status, bron, tijdstempel, verwijzing). Saldi zijn afgeleid, nooit los opgeslagen, zodat de verplichting per gebruiker altijd controleerbaar is (businessplan §5). Statussen: *in afwachting*, *beschikbaar*, *nog niet vrij*, *verzilverd*, *vervallen*, *teruggedraaid*.

| Mutatietype | Betekenis | Release |
|---|---|---|
| `earn_session` | 1 punt per geverifieerde minuut van een voltooide sessie | R1 |
| `goal_bonus` | Arm A: +20 per gehaald dagdoel | R1 |
| `goal_budget_grant` / `goal_budget_secure` / `goal_budget_lapse` | Arm B: weekbudget *in afwachting*; 20 naar *beschikbaar* per gehaald dagdoel; 20 vervalt per gemist dagdoel | R1 |
| `redeem` | Verzilvering | R1 |
| `release_flag` / `reverse` | Vrijgave of terugdraaiing na een besluit over een gemarkeerde sessie | R1 |
| `adjust` | Correctie door een beheerder na een melding of beroep, met redencode | R1 |
| `referral_pending` / `referral_vest` / `referral_lapse` | Referral | R3 |
| `expire` | Verval | Niet gebouwd |

| Regel | Waarde |
|---|---|
| Ratio | 1 punt per geverifieerde minuut, vast en gepubliceerd; direct bijgeschreven; nergens een eurowaarde per punt |
| Puntenplafond | 300 geverifieerde minuten per dag voor punten en voor de intensiteit van de challenge (founder G4); minuten daarboven tellen voor het dagdoel (maximaal 120) en worden gelogd voor de schadesignalen (6.6), maar leveren geen punten op |
| Dagrand | 04:00–04:00 Europe/Amsterdam (**aanname**: studenten werken laat); een sessie hoort bij haar startdag |
| Nachtregel | Een sessie die tussen 01:00 en 04:00 start, telt voor punten, dagdoel, streak en Belofte, maar niet voor de doelbonus: in arm A geen +20, in arm B wordt de 20 niet veiliggesteld als het doel alleen dankzij zulke sessies gehaald is (founder GS9) |
| Tentamendag | Hoogstens 3 per kalenderweek (**werkhypothese**); dagdoel opgeschort zonder joker (3.13) |
| Inverdienperiode | 300 geverifieerde minuten vóór de eerste verzilvering; gemarkeerde minuten pas na vrijgave; bonus- en referralpunten tellen niet |
| Wachttijd eerste verzilvering | 7 dagen vanaf het halen van de inverdienperiode, met een lichte menselijke blik op de nieuwe verzilveraar; daarna vervalt de wachttijd (founder J3) |
| Weekplafond | 1 verzilvering per week vanaf maandag 04:00, plus de europlafonds uit 4.3 |
| Seizoen doelbonus | Focusdagen vanaf de startdatum (2 december 2026, uiterlijk 9 december, anders 4 januari 2027; voorregistratie §3.5) tot en met T van de eigen kalender (bonusstop om 04:00 op T + 1, 4.13), niet in de vakantiepauze; vermeld in de voorwaarden, op de uitlegpagina en bij elke bonusmutatie, met de datum |
| Rustperiode | Voor leden van de rustgroep geen `earn_session` op de focusdagen T + 1 tot en met het einde van het aprilvenster van de kalender; daarna weer; vanaf T − 6 hoort de groep bij de persoon; persoonlijk doorlopend voor 16- en 17-jarigen, het uitbreidingscohort, afmelders en wie uit de rustperiode stapte (ook via een overstap); verdiende punten blijven inwisselbaar (3.16) |
| Vervaldatum | 12 maanden na de laatste voltooide sessie, bericht 30 dagen vooraf (werkhypothese); in de voorwaarden, niet gebouwd: eerste verval op zijn vroegst december 2027 |
| Negatief saldo | Na een afgekeurde sessie verrekend met toekomstige punten, nooit in geld teruggevorderd; een verstrekte voucher blijft geldig |
| Account verwijderen | Punten vervallen, na een waarschuwing |
| Gelijktijdige verzilvering | Rijvergrendeling per account |

Na het seizoen blijft in de doorlopende arm alleen de ratio, en in de rustperiode-arm niets nieuws. Zo bouwt de beloning af zonder dat de ratio verandert. Wat stopt, is in beide armen de doelbonus; alleen de rustperiode-arm toetst een periode zonder nieuwe beloning (7.3).

### 4.3 Catalogus en verzilvering

**Budgetdekking.** Het beloningsbudget is een afgeleide van geboekte omzet (businessplan §1 besluit 2, §5). Geboekt betekent gefactureerd, of vastgelegd in een getekend contract met bedrag en datum; een toezegging zonder contract telt niet. De beheerder legt per partner de documentverwijzing vast. Het budget bestaat uit (a) wat een partner rechtstreeks voor beloningen financiert, één op één gedekt; (b) een vast percentage van de overige geboekte omzet: werkhypothese hoogstens 20% van de geboekte sponsoromzet (rapport 02 §5.2), en bij B2B2C-contracten het beloningsbudget van 30% van de prijs (businessplan §6); en (c) **eigen budget Rewarded**: de begrotingspost "pilotprijzen en catalogus" binnen het plafond van de gratis laag (werkhypothese €1.500 voor de gesloten pilot), met als documentverwijzing het besluit van de founder (`docs/pitch/ronde-1-founder-reactie.md`, aanvulling 5 november). Ook (c) is één op één gedekt: er komt niets in de catalogus dat de post niet dekt. Een item is niet te publiceren zolang `kostprijs × voorraad` niet binnen het vrije budget valt.

**Verplichting naast budget.** Uitstaande punten zijn geen schuld in euro's, maar wel een verwachting. De beheeromgeving toont dagelijks per gebruiker en in totaal de uitstaande beschikbare punten, hun waarde tegen de budgetwaarde per punt, de gedekte voorraadwaarde en de dekkingsgraad. Het wekelijkse dekkingsalarm gaat af als het aantal gebruikers voorbij de inverdienperiode, maal één verzilvering, groter is dan de vrijgegeven voorraad van de komende week. Puntenprijzen veranderen dan niet, en in de pilot ook het vrijgaveschema niet: de catalogus zegt eerlijk "deze week op". Extra voorraad mag alleen uit getekende partnerbijdragen komen en dan voor alle armen gelijk; "weekvrijgave verlagen" is tijdens het experiment geen toegestaan besluit (founder G3).

**Gescheiden posten en vast vrijgaveschema (founder G3, MF5).** De eigen budgetten van Rewarded zijn drie posten met elk een eigen voorraad: (1) de gesloten pilot, €1.500, voor de experimentpopulatie tot en met de bonusstop van de eigen kalender; (2) het onderzoekscohort na het seizoen, €4.000 catalogus februari tot en met april en €2.500 aprilchallenge; (3) de gratis laag van de uitbreiding, voor het uitbreidingscohort (werkhypotheses, businessplan §6). Een voucher hoort bij één post (`pool`), en een gebruiker ziet en verzilvert alleen de voorraad van zijn eigen groep. Per post liggen de voorraad per week en de puntenprijzen vóór 2 december vast in de voorregistratie (§5.4), gelijk voor alle armen; in de doorlopende arm blijven puntwaarde en schema gelijk tot en met het aprilvenster. Niet-verzilverde vouchers blijven in dezelfde post beschikbaar. Intern publiceren we bij de prijslijst de budgetwaarde per punt, punten per euro kostprijs en het aantal focusuren per goedkoopste item.

| Regel | Waarde |
|---|---|
| Puntenprijs | `kostprijs ÷ budgetwaarde per punt`, afgerond op 50; `budgetwaarde per punt = beloningsbudget ÷ verwachte geverifieerde minuten` (teamaanname); vast zolang het item bestaat; prijslijst uiterlijk 25 november |
| Weekvrijgave | Voorraad per pilotweek volgens het vaste vrijgaveschema van de post, gespreid over de week vrijgegeven (werkhypothese: elke dag om 04:00 een zevende deel) in plaats van in één keer op maandag; een deel is gereserveerd voor accounts met een instellingsanker, dat wil zeggen een bevestigde instellingsmail (werkhypothese: de helft; een geverifieerd mobiel nummer volstaat hier niet, want elke verzilveraar heeft dat al); de app toont ook nul ("Vandaag op; morgen komt er weer een deel bij"); "bijna op" alleen onder 10% echte voorraad; bovenaan de vrijgegeven voorraad van de week naast het aantal studenten dat mag verzilveren |
| Soort beloning | Bij voorkeur collectief, ervaringsgericht of symbolisch (iets met de squad of de vereniging, toegang, een workshop) in plaats van koffievouchers, zodat geen uurloon in centen zichtbaar wordt (founder GS1) |
| Partnerverklaring | Maakt het onderscheid tussen een voucher of korting voor één product of dienst (toegestaan) en tegoed voor een assortiment (uitgesloten) (founder JS6) |
| Eerste verzilvering | Na de wachttijd van 7 dagen; in de wachttijd ziet een beheerder de nieuwe verzilveraar in een lijst met sessiepatroon, anker en nummertype, en kan hij een markering openen; geen automatische weigering |
| Vouchers | Unieke codes per CSV-import, na reservering aan één account gekoppeld; fysieke items via een code die de student bij de vereniging laat zien; geen partner-API's |
| Voorraad op tijdens afrekenen | Niets afgeschreven |
| Kapotte code | Via "Werkt niet" binnen twee werkdagen een nieuwe code of de punten terug |
| Partner trekt zich terug | Verstrekte codes blijven geldig; item offline; niet-geleverde verzilveringen teruggeboekt |

**Europlafonds op trede 1.** Rapport 09 §8 noemt voor web plus identiteit "centen tot enkele euro's per week" en het businessplan (besluit 5) staat op deze trede alleen kleine prijzen toe. Rapport 09 verdeelt de web-MVP over trede 0 en 1; het businessplan voegt die samen tot trede 1. De beheeromgeving dwingt deze werkhypothesen af:

| Plafond | Waarde | Afgedwongen bij |
|---|---|---|
| Kostprijs per catalogusitem | ≤ €5 | Publiceren van een item |
| Waarde per individuele verdiende prijs | ≤ €10 | Aanmaken van een prestatiechallenge |
| Per persoon per kalendermaand, catalogus en individuele prijzen samen | ≤ €15 | Verzilvering en toekenning |
| Hoofdprijs per poule | ≤ €150, in natura | Aanmaken van de challenge |
| Drempelprijs per vereniging | ≤ €75, in natura | Aanmaken van de challenge |

Geen enkele beloning op trede 1 is geld of vrij besteedbaar tegoed.

### 4.4 Squads

| Regel | Waarde | Reden |
|---|---|---|
| Omvang | 3–6 actieve leden; met 1–2 "in opbouw": aanwezigheid, geen streak | Businessplan §4 |
| Lidmaatschap | Eén squad per student in de pilot | "Squad of solo" scherp meetbaar |
| Uitnodigingslink | Object met bron `squad`, maker, 7 dagen geldig, max. 5 gebruikers | Attributie voor K (Groei-first) |
| Uitnodigingsmomenten | Alleen bij aanmaken, bij een vrije plek (max. 1× per week), bij aansluiten bij de verenigingschallenge, en na 7 dagen "in opbouw" één keer een nieuwe link of een duel | Geen spam, geen beloning op uitnodigen |
| Live aanwezigheid | "Focust nu (nog 32 min)", polling elke 30 s; stille modus verbergt het lid, dat wel meetelt; voor `16_17` staat de stille modus standaard aan (live aanwezigheid uit), met de schakelaar in de onboarding | Een halve minuut vertraging hindert geen criterium; privacy standaard voor minderjarigen (founder J5) |
| Minuten vergelijken | Standaard uit; wie het aanzet, ziet alleen leden die het ook aanzetten | Businessplan §4; Bursztyn en Jensen 2015 |
| Dagdoel | 25 / 50 / 90 / 120 min; wijziging geldt vanaf de volgende dag | Niemand verlaagt op het laatste moment om de streak te redden |
| Overmoedrem | In de eerste 7 dagen vraagt 90 of 120 om bevestiging ("Begin liever klein"); na 7 dagen een voorstel: de hoogste doelwaarde die niet boven de mediaan ligt van de geverifieerde minuten op actieve dagen, minimaal 25 | Carrera e.a. 2018; Leuven e.a. 2010 (rapport 08) |
| Squadstreak | Een squaddag slaagt als minstens de helft van de actieve leden (naar boven afgerond, min. 2) zijn dagdoel haalt of een joker gebruikt | Rapport 03: squads die door één afhaker uiteenvallen (werkhypothese) |
| Rustdag-joker | 1 per lid per week, automatisch bij het eerste gemiste dagdoel, niet op te sparen; beschermt alleen de streak; een tentamendag (3.13) gebruikt geen joker | Businessplan §5; Silverman en Barasch 2023 |
| Streakherstel | Breekt de streak, dan herstelt hij tot de oude lengte als de squad de twee squaddagen direct na de gebroken dag allebei haalt ("Pak je streak terug met twee dagen op rij"); één herstel per breuk; geen punten | Silverman en Barasch 2023; founder GS5 |
| Automatische pauze | Na 7 dagen zonder voltooide sessie; neutraal getoond ("Joris staat op pauze"); terug bij de volgende sessie, actief vanaf de dag erna | Businessplan §4 |
| Onder 3 actieve leden door pauzes | Streak bevriest in plaats van te breken | Niet straffen voor andermans pauze |
| Vakantiepauze | Dagen tellen niet en breken niets | Kerstdip |
| Lid vertrekt / maker vertrekt | Telt vanaf de volgende dag niet mee / beheer naar het langst zittende lid | — |
| Squad uit elkaar | Binnen een tentamenperiode van de kalender (4.13) 7 dagen achter elkaar < 2 actieve leden: route om opnieuw samen te stellen (nieuwe link) of samen te voegen met een andere squad van dezelfde vereniging en **dezelfde rustperiode-arm** die ook < 2 actieven heeft en zelf om samenvoegen vraagt; de samengevoegde squad houdt de experimentarmen van de grootste squad, en de wissel wordt gelogd (`arm_switched`). Buiten de tentamenperiodes is de route gepauzeerd | Founder GS2; besluit 3 en G-S6 na ronde 2 |
| Overstap na T − 6 | Een lid van de rustgroep dat na T − 6 overstapt naar een squad die doorlopend verdient, verdient vanaf de volgende focusdag weer punten; dat telt als `rest_period_exit` (bron `squad_switch`), en het aansluitscherm zegt dat vooraf. Een lid van de doorlopende groep dat na T − 6 bij een rustsquad komt, houdt zijn doorlopende punten. De bonus- en Belofte-arm wisselen zoals in 5 (toewijzing) | Founder G-S2 na ronde 3 |
| Kalender | De squad volgt de tentamenkalender van haar vereniging, zonder vereniging die van de vereniging van de maker, en anders de standaardkalender (4.13); iedereen in de squad ziet dezelfde data | Besluit 1 na ronde 2; G-MF3 na ronde 3 |
| Squadnaam | Gemodereerd (`name_status`); meldknop voor iedereen die de naam ziet | Art. 16 DSA; founder JS11 |
| Archief | Na 14 dagen zonder actieve leden | — |

### 4.5 Duels

Twee spelers, 7 dagen vanaf de volgende dag 04:00, op **gehaalde dagdoelen** (`goal_met_final`; een joker of tentamendag telt niet als gehaald). Wie op de meeste dagen zijn dagdoel haalt, wint een badge; er staan geen punten of prijzen op het spel. Minuten zijn geen criterium: duels op volume belonen marathonsessies in de tentamenweek (founder GS4). Een puntenoverdracht van verliezer naar winnaar is het pool-model in het klein (businessplan besluit 3) en een directe prikkel tot samenspanning. Het duel is er voor het uitnodigingsmoment en voor competitie in een klein verband (Patel e.a. 2019, rapport 08 §6). De duellink is een uitnodigingsobject met bron `duel`, één gebruiker en 48 uur geldig. Gelijke stand is gelijkspel. Een speler met een gemarkeerde sessie in de duelperiode krijgt pas na het besluit een uitslag. Per speler loopt één duel tegelijk. Binnen de squad kan iedereen duelleren; een duel met een niet-squadlid kan alleen als beide spelers `18_plus` zijn (founder JS3). De duelpartner ziet per dag gehaald of niet en het aantal gehaalde dagen, geen minuten.

### 4.6 Verenigingschallenge

De ranglijst rekent op deelnamegraad, een van de twee opties uit businessplan §4. Met alleen gekoppelde leden in de noemer, zoals in MVP-first, zou een vereniging hoger scoren door alleen fanatieke leden te laten aansluiten. Met het opgegeven ledental in de noemer loont het om ook twijfelaars te werven, en daar draait de koude start op (rapport 03, loop B). Het gemiddelde per actief lid komt ernaast als tweede cijfer, zonder prijs. Totalen tonen we nooit.

| Regel | Waarde | Reden |
|---|---|---|
| Deelnamegraad per week | Gekoppelde leden met ≥ 3 dagen dagdoel gehaald in de challengeweek ÷ max(ledental, gekoppelde leden bij het begin van de week) | Noemer kan niet krimpen door weinig leden te koppelen (Groei-first) |
| Identiteitsanker in de prijsperiode | In de prijsweken telt een lid alleen in de teller met een identiteitsanker: een bevestigd e-mailadres van een hbo- of wo-instelling (domeinlijst van de pilotinstellingen; opgeslagen: vinkje, domein en een HMAC van het adres, uniek per adres, 4.10) of een geverifieerd mobiel nummer; leden zonder anker blijven in de noemer. **Per week:** het anker telt in elke prijsweek waarvan het einde (maandag 04:00) na het moment van bevestigen ligt, dus ook in de week waarin het lid het bevestigt, maar niet terug in eerdere weken; toevoegen kan tot het einde van de prijsperiode (challengevoorwaarden A4.3; founder J11). Het instellingsanker (alleen de bevestigde instellingsmail) is een apart begrip voor de gereserveerde voorraad (4.3) en de ambassadeurs (4.9) | Nepleden toevoegen loont niet (founder J2) |
| Vertrek tijdens de week | Blijft in de noemer | Geen leden wegsturen |
| Intensiteit | Gemiddelde gecapte geverifieerde minuten per actief lid per dag (plafond 300); geen prijs | Tweede cijfer |
| Ledental | Uit een externe bron: de opgave aan de instelling voor de erkenning of de bestuursbeurs, of een bevestiging van de faculteit; vastgelegd vóór het aanloopklassement; openbaar naast elke vereniging op de ranglijst, met de soort bron. Zonder externe bron: wel in het klassement, niet om de hoofdprijs | Rivaliserende besturen zijn de goedkoopste controleurs (founder J2) |
| Codeplafond | Hoogstens 1,1 × het ledental; daarboven gaan koppelingen naar de beheerder | Geen niet-leden koppelen |
| Poules | Ledental < 150, 150–500, > 500 (**aanname**, rapport 03 §7); minstens 3 verenigingen per poule, anders samengevoegd met de naastgelegen poule | Vergelijkbare groepen |
| Minimum | 15 gekoppelde leden (werkhypothese) | Kleine groepen schommelen te sterk |
| Plafond | 300 minuten per lid per dag; een joker of tentamendag telt niet als gehaald dagdoel | Founder G4 |
| Aanloopklassement | Vanaf R1 (uiterlijk 9 december) tot de vakantiepauze, zonder prijs | Wervingsreden in december |
| Prijsperiode | De twee focusweken die eindigen op T van de kalender van de vereniging; score = gemiddelde van de twee weken; poules bij voorkeur per kalender, anders vergelijkt de ranglijst scores over elk eigen venster (voorstel productteam, voorregistratie §3.4) | Besluit 1 na ronde 2 |
| Aprilchallenge | In het aprilvenster van de kalender, voor het onderzoekscohort: collectieve prijzen op deelnamegraad, voor beide rustperiode-armen gelijk, uit de post aprilchallenge (€2.500, werkhypothese). Het ledental: vóór de bekendmaking vraagt Rewarded zelf bij elke vereniging het actuele externe getal op (beheertaak per vereniging); zonder actueel getal blijft het januarigetal (challengevoorwaarden A14.3) | Besluit 3 na ronde 2; founder MF5; jurist should-fix 7 na ronde 3 |
| Prestatiechallenges in de rustperiode | Van T + 1 tot en met het einde van het aprilvenster van de kalender geen individuele prestatiechallenges met een prijs voor het onderzoekscohort, in geen van beide armen; het uitbreidingscohort wel, uit zijn eigen voorraad (voorstel, ter bevestiging door de founder) | Challengevoorwaarden B7; besluit 3 na ronde 2 |
| Hoofdprijs | Per poule de winnaar met een extern ledental, ≤ €150 in natura | Verdiend, nooit verloot (businessplan §5) |
| Drempelprijs | Elke vereniging die de vooraf bekendgemaakte drempel haalt (werkhypothese: gemiddelde deelnamegraad ≥ 25%), ≤ €75 in natura | Onderkant haakt niet af; demotivatie onderaan is plausibel maar secundair onderbouwd (rapport 08) |
| Terugvalvariant | Alleen drempelprijzen, geen rangprijs; één parameter, klaar voor als de advocatenopinie de rangprijs onder de Wok afwijst | Founder J2 |
| Verplichte steekproef | Bij elke hoofdprijswinnaar en elke vereniging die de drempel haalt: 20 meegetelde leden (of allemaal bij minder dan 20) met de lichte controle uit 6.7, los van het aandeel markeringen, plus een toestelvergelijking (toestel en user-agentklasse van de sessies tegen die van registratie en inloggen) en een oefensessie van één minuut vanaf de eigen telefoon van het steekproeflid; niet reageren betekent hier niet in de teller tellen | Founder J2; J1 na ronde 2 |
| Diskwalificatie | Bij aangetoonde georganiseerde manipulatie, na hoor en wederhoor van het bestuur; de prijs gaat naar de volgende plaats; geregeld in de challengevoorwaarden (`docs/juridisch/`) | Founder J2, J6 |
| Uitslag | Pas definitief na fraudecontrole, de verplichte steekproef en winnaarsverificatie (4.7); vier ogen bij publicatie | — |

**Bestuursdashboard.** Alleen aggregaten; een cijfer is pas zichtbaar bij minstens 5 leden in de groep; geen namen, lijsten, tijdstippen of export; geen berichten aan leden. Tijd heet "focustijd die telde (Rewarded zichtbaar op het scherm)", en bij elk cijfer staat het verificatieniveau ("niveau 1: Rewarded zichtbaar op het scherm van één browser"). "Geverifieerd", "verified" en "geverifieerde studie-inzet" staan nergens in B2B-copy of dashboards; alleen de gedefinieerde term "geverifieerde minuut" met de link naar "Hoe we tellen" mag (lintregel; founder J3).

| Tabblad | Inhoud |
|---|---|
| Stand | Positie in de poule, deelnamegraad, intensiteit, afstand tot de vereniging erboven en tot de drempel; dagelijks ververst, definitief na de fraudecontrole en de steekproef |
| Werving | Gekoppelde en actieve leden per week, afgerond op 5, aandeel leden in een squad, aandeel met een instellingsanker, aantal squads, koppelingen per QR-bron |
| Promotiekit | Teksten, storysjabloon, poster met QR per bron, dia en "wat je wel en niet belooft"; geen bedragen, trekkingen of individuele beloningen |
| Prijs | Status van hoofd- en drempelprijs, financier, levering; na afloop een deelbare verenigingskaart |
| Kwaliteit | Aandeel gemarkeerde sessies van de vereniging, met de uitleg dat die pas na vrijgave meetellen |

### 4.7 Verdiende prijzen

Er is in de pilot één prijsfamilie: verdiend. Trekkingen worden niet gebouwd (3.9).

| Kenmerk | Verdiende prijs |
|---|---|
| In de pilot | Ja, collectief en individueel, vanaf R3 |
| Basis | Prestatie: drempel of rang, vooraf bekend; individueel met vaste plaatsen; maatstaf voor verenigingen is de deelnamegraad |
| Leeftijd | 16+ (tenzij de financier 18+ eist) |
| Taal | "Verdiend", "behaald"; nooit "kans" of "win" |
| Plek | Bij de challenge |
| Grens | Europlafonds uit 4.3 |
| Kosten | Prijswaarde |
| Kader | Geen kansbepaling; de advocatenopinie beoordeelt de rangprijs onder de Wok expliciet; terugvalvariant met alleen drempelprijzen (4.6) |

**Winnaarsverificatie.** Voor elke prijs: (1) alle sessies in de periode zijn niet gemarkeerd of na herbeoordeling vrijgegeven; (2) er is een identiteitsanker: het telefoonnummer is geverifieerd of de instellingsmail bevestigd; (3) geen IP-hash-, telefoon- of toesteloverlap met andere winnende accounts; (4) een menselijke beoordeling; (5) bij een individuele prijs een bevestiging per e-mail met de naam voor levering; (6) bij 18+-prijzen een leeftijdscontrole zonder kopie van een identiteitsbewijs en zonder BSN: alleen uitkomst, datum en controleur worden opgeslagen (open vraag 8). Bij een collectieve prijs herberekent de beheerder de uitslag zonder gemarkeerde sessies (ook H12) en volgt altijd de verplichte steekproef van 20 meegetelde leden met toestelvergelijking en oefensessie (4.6); bij clusters een gesprek met het bestuur met hoor en wederhoor. De uitslag is pas definitief na de steekproef. Levering na 14 dagen (rapport 09 §8: vertraagde uitbetaling).

### 4.8 Deelbare kaarten (R2, Should)

| Regel | Waarde |
|---|---|
| Delen | Opt-in per kaart, op initiatief van de gebruiker; delen levert niets op, ook geen referralpunten |
| Formaat | Op de server gegenereerd, 9:16 of vierkant, via de Web Share API of opslaan |
| Standaard op de kaart | Voornaam, duur of uren, streak |
| Alleen als aangezet | Achternaam, instelling, vereniging; squadnaam alleen als alle leden het toestaan |
| Nooit | Punten, bedragen, beloningen, trekkingen, individuele ranglijstposities |
| QR | Naar `/v/{token}` met een niet te raden token; pagina `noindex`, toont niet meer dan de kaart |
| Tekst op de verificatiepagina | "Deze sessie stond zichtbaar op het scherm van één browser, van 14:02 tot 14:52. Dat bewijst niet dat er geen ander apparaat gebruikt is en ook niet wat er geleerd is." (rapport 09 §8) |
| Intrekken | Door de gebruiker; de QR toont "niet meer beschikbaar"; bij afkeuring van de sessie verdwijnt de pagina; geen kaart voor een sessie in afwachting |
| Logging | Alleen kaart gemaakt, deelmenu geopend, pagina bekeken |
| Video | Buiten de MVP: geen camera (businessplan §8) |

### 4.9 Referral (R3, vlag)

| Regel | Waarde | Reden |
|---|---|---|
| Start | 5 januari 2027, achter een vlag, na besluit van de founder | K uit squads eerst zonder referral meten (2 december – 3 januari) |
| Punten | 150 voor uitnodiger en genodigde (werkhypothese, ongeveer 2,5 uur focus) | Merkbaar, onder de inverdienperiode |
| Vesting | Genodigde doet binnen 7 × 24 uur 3 voltooide, niet afgekeurde sessies van ≥ 25 min, én de wachttijd op zijn eerste verzilvering (inverdienperiode plus 7 dagen) is voorbij | Businessplan §7; founder J3 |
| Na vesting | Hoogstens 50% van een puntenprijs uit referralpunten | "Alleen samen met eigen punten" |
| Maximum | 5 gevestigde referrals per uitnodiger per kalendermaand | Businessplan §6 |
| Inverdienperiode | Telt niet mee | 4.2 |
| Rustperiode | Zit de uitnodiger of de genodigde op de vestingsdag in de rustperiode (`earnArm = rest`, 3.16), dan vest zijn deel pas op de dag na het aprilvenster van zijn squad, of op de focusdag na zijn rustuitstap; de referral vervalt daardoor niet. Voor de andere partij vest het deel gewoon | Referralpunten zijn nieuwe punten; besluit 3 na ronde 2; gebruiksvoorwaarden §11.2 |
| Uitsluiting | Zelfde `client_device_id` als de uitnodiger: geen vesting. Zelfde IP-hash binnen 24 uur (campus en mobiel CGNAT met een hogere drempel, 6.3) of zelfde telefoonnummer: vesting pas na menselijke beoordeling | Rapport 09 §7.1; founder J3 |
| Ambassadeurscodes | Attributie, geen referralpunten. De KPI-query telt per ambassadeur de gebruikers die op dag 14 minstens vijf voltooide sessies hebben, een instellingsanker (bevestigde instellingsmail) hebben en niet verdacht zijn in de steekproef; plafond per ambassadeur (werkhypothese van de founder: €5 per gebruiker die aan die eisen voldoet, hoogstens 40 per ambassadeur per maand); uitbetaling buiten de app, pas na een **gerichte steekproef van vijf meegetelde accounts per ambassadeur** (of alle bij minder dan vijf) met de lichte controle plus de toestelvergelijking, vóór elke uitbetaling (besluit founder na ronde 3, jurist should-fix 7; voorregistratie §7.4); geen uitbetaling zolang het instellingsanker niet uniek is per adres, en geen betaalde ambassadeurs zonder fiscale route en getekende overeenkomst (businessplan §9); een ambassadeur mag geen bestuurslid zijn van een deelnemende vereniging (de beheerder controleert dat bij het aanmaken van de code) | Businessplan §7, §9; founder J3; jurist ronde 3 |
| Nooit | Geld, inzet, beloning voor delen | Art. 1a Wok (piramide) |

### 4.10 Profiel, privacy en leeftijd

**Profiel.** Voornaam, optionele achternaam, e-mail, leeftijdsklasse, dagdoel, squad, vereniging, instellingsmail (bevestigd ja/nee en domein) en de schakelaars voor minuten vergelijken, stille modus, squadnaam op kaarten, de modus zonder punten (Should) en "Meedoen aan het onderzoek". In de modus zonder punten zijn punten, catalogus en bonusmeldingen verborgen, maar lopen de punten door in het grootboek, zodat niemand iets verliest. Rapport 08 §7 raadt zo'n modus aan voor intrinsiek gemotiveerden, en wie hem kiest en blijft, laat zien of de squad zonder punten draagt; we meten wie hem kiest (founder GS6).

**Afmelden voor het onderzoek.** Met één schakelaar, zonder verlies van punten. Vanaf de volgende focusdag krijgt de gebruiker arm A, doorlopende punten en, als hij het nog niet kreeg, het Belofte-aanbod op T − 6 van zijn kalender, en valt hij buiten de analyse; zijn squad houdt haar armen. De afmelding wordt per arm gerapporteerd. Weer aanmelden kan niet tijdens de pilot (de toewijzing zou dan niet meer willekeurig zijn). Wie alleen weer punten wil verdienen, hoeft zich niet af te melden: daarvoor is de aparte keuze "Ik wil weer punten verdienen" (3.16 stap 4), die het onderzoek niet beëindigt (founder J2).

**Instellingsmail.** De student kan een e-mailadres van een hbo- of wo-instelling uit de domeinlijst toevoegen; de server stuurt een code, en na bevestiging bewaart hij het vinkje, het domein en `institution_email_hash = HMAC(genormaliseerd adres, pepper_inst)`, met een **unieke index**: één adres kan maar één account bevestigen (besluit founder na ronde 3, jurist should-fix 1; dit vervangt het besluit van 5 november "geen hash", open vraag 17). Het adres zelf wordt na de bevestiging niet bewaard. Is het adres al door een ander account bevestigd, dan weigert de server met `INSTITUTION_EMAIL_IN_USE` en kan de student via Hulp een mens laten kijken. Normalisatie: kleine letters en het plus-deel weg, zoals bij het accountadres (3.1 stap 4; keuze productteam, zodat aliassen van één instellingsadres niet als twee adressen tellen). Live vóór 4 januari 2027, het begin van de vroegste mogelijke prijsperiode. Wie vóór de invoering al een instellingsmail bevestigde, vraagt de app die vóór 4 januari opnieuw te bevestigen; zonder herbevestiging vervalt het instellingsanker, niet het telefoonnummer (voorstel juridisch team, gebruiksvoorwaarden §8.4). Bij `DELETE /me` wordt de HMAC gewist; na een bevestigde blokkade blijft ze 2 jaar bewaard, zoals `blocked_phone_hash` (voorstel juridisch team). De grondslag is gerechtvaardigd belang (fraudebestrijding), met de belangenafweging in de DPIA: zonder HMAC werkt het anker niet, dus dataminimalisatie vraagt haar juist (jurist ronde 3).

**Leeftijd.** We bewaren de leeftijdsklasse (`16_17` of `18_plus`) en voor 16- en 17-jarigen de datum waarop iemand 18 wordt; op die dag wisselt de klasse. De geboortedatum zelf bewaren we niet. De leeftijd is zelfopgave en wordt bij 18+-prijzen gecontroleerd.

**Gegevens.** Alleen sessietijdstempels, zichtbaarheidsgebeurtenissen, Wake Lock-status, heartbeats, lidmaatschappen, gehasht IP, user agent, een toestel-id in IndexedDB, vanaf de eerste verzilvering een gehasht telefoonnummer met nummertype, het instellingsanker (vinkje, domein en HMAC van het adres), antwoorden op de korte vragenlijsten en de schadesignalen (businessplan §9; rapport 09 §7.3). Geen locatie, camera of verdere fingerprinting, geen kopie van een identiteitsbewijs, en geen externe analytics-SDK.

**Supportlabel "welzijn" en profilering (founder J8, J9 na ronde 2).** Het label "welzijn" (S4) behandelen we als gezondheidsgegeven: de onderzoeker en de advocaat kiezen de uitzondering van art. 9 lid 2 AVG; alleen het teamlid dat antwoordt ziet het label; het telt alleen als aantal per arm; de tekst gaat na 90 dagen weg. De schadesignalen S1–S3 zijn profilering zonder rechtsgevolg en staan met de belangenafweging in de DPIA. De plicht tot een functionaris gegevensbescherming beoordelen we opnieuw bij de start van de uitbreiding en bij het eerste B2B-contract (DPIA-checklist; aanzet met het verwerkingsregister in `docs/dpia/verwerkingen.md`).

**Grondslagen (in de DPIA, founder J5).** Overeenkomst (art. 6 lid 1 sub b AVG) alleen voor account, sessie, punten en verzilvering. Gerechtvaardigd belang (sub f) met een schriftelijke belangenafweging, met aandacht voor 16- en 17-jarigen, voor het experiment (toewijzing, vragenlijsten, schadesignalen), het eventlog en de fraudebestrijding (heuristieken, steekproef, toestel-id, telefoonverificatie, `blocked_phone_hash`). Telefoonverificatie en vragenlijsten vallen voorlopig onder sub f; de welzijnsitems kunnen gezondheidsgegevens zijn (art. 9 AVG) en vragen dan een aanvullende uitzondering: voorlopig een aparte toestemming (3.1 stap 8). Definitief na de advocatenopinie (vragen 8b en 9; besluit founder, 5 november). De DPIA-light voor de wachtlijst komt deze week; de volledige DPIA is ondertekend vóór de eerste uitnodiging, uiterlijk 1 december. Toestel-id en Telecommunicatiewet (art. 11.7a), het ontbreken van een kopie van een identiteitsbewijs en de bewaring van `blocked_phone_hash` staan erin.

**Bewaartermijnen** (vast te leggen in de DPIA): IP-hash en user agent 30 dagen; ruwe heartbeats en zichtbaarheidsgebeurtenissen 90 dagen, daarna een samenvatting per sessie; auditlog 2 jaar; ruwe events tot na de nawerkingsmeting van april 2027 en dan samengevat, uiterlijk 15 juni 2027 (founder JS5). Inzien, downloaden en verwijderen kan in het profiel. Bij verwijdering wordt ook het squad-id in de events van die gebruiker vervangen door een willekeurig id, zodat events niet via een squad van drie tot zes leden herleidbaar zijn (founder J5). De verwerkers zitten in de EU, zonder subverwerkers buiten de EER zonder passende waarborgen; de sms-verwerker levert ook de nummertypecontrole (founder JS4).

**Verenigingen.** Een korte overeenkomst per vereniging legt de rol vast (gezamenlijke verantwoordelijkheid waar dat zo is), met de regel dat de vereniging geen herleiding probeert en geen ledenlijst uploadt. Zonder getekende overeenkomst geen code en geen dashboard.

### 4.11 Beheeromgeving

| Onderdeel | Functie | Waarborg | Release |
|---|---|---|---|
| Verenigingen | Aanmaken, ledental met externe bron (soort en documentverwijzing), poule, code met plafond, bestuursaccounts, verwijzing naar de getekende overeenkomst, promotiekit, hulpbronnen van de instelling; taak "extern ledental opvragen" per vereniging vóór de bekendmaking van de aprilchallenge | Plafond 1,1 × ledental; zonder overeenkomst geen code; zonder externe bron geen hoofdprijs; het aprilledental vraagt Rewarded zelf op | R1 (taak april in R3) |
| Challenges | Aanloopklassement, prijsperiode, hoofd- en drempelprijs, terugvalvariant, prestatiechallenges met plaatsen, verplichte steekproef, diskwalificatie | Niet te publiceren zonder dekking of boven de europlafonds; uitslag pas na steekproef en fraudecontrole, vier ogen | R1 / R3 |
| Partners en budget | Partner, factuur of contract met documentverwijzing, geboekt bedrag, beloningsbudget, verplichting, dekkingsgraad; eigen budget Rewarded (post "pilotprijzen en catalogus") met documentverwijzing naar het founderbesluit | Alleen geboekte omzet of eigen budget Rewarded met documentverwijzing (4.3); wekelijks dekkingsalarm | R1 |
| Catalogus | Items met kostprijs, soort en puntenprijs, partnerverklaring, CSV-import, gespreide vrijgave en reservering voor accounts met een anker | Kostprijs ≤ €5 | R1 |
| Eerste verzilveringen | Lijst van accounts in de wachttijd met sessiepatroon, anker, nummertype en toesteloverlap (H11) | Alleen kijken en een markering openen; geen automatische weigering | R1 |
| Steekproef | Wekelijkse willekeurige selectie van 30 accounts (6.7), met het uitbreidingscohort als eigen stratum vanaf het lanceringsbesluit, controlelijst, criteria per oordeel, contactverzoek via het instellingsadres met HMAC-vergelijking, oordeel met redencode, schatting met interval; prijssteekproef met toestelvergelijking en oefensessie; ambassadeurssteekproef van vijf accounts vóór elke uitbetaling (4.9) | Selectie reproduceerbaar uit de seed; oordeel door een mens (de pilotbeheerder, met een tweede beoordelaar); per item een knop "Ik heb een belang" die het item overdraagt aan de tweede beoordelaar, met logregel (jurist should-fix 6) | R1 (ambassadeurs R3) |
| Schadesignalen | Aantal signalen per week, per arm en per code, zonder namen; stopregeltelling arm B op de wekelijkse welzijnsmeting en de signalen; bewakingsregel rustarm op de signalen van T + 1 tot en met A-einde; absolute schadegrens over alle armen, per code naast elkaar, met de beoordelingscriteria van de onderzoeker; supportlabel "welzijn" | Geen inzage per persoon behalve bij een supportbericht; het label alleen voor het teamlid dat antwoordt | R1 (bewakingsregel R3) |
| Ambassadeurs | Codes, controle op bestuurslidmaatschap, telling volgens 4.9, gerichte steekproef per ambassadeur | Uitbetaling pas na de gerichte steekproef; geblokkeerd zolang `institution_email_hash` niet live is | R1 (steekproef R3) |
| Fraudewachtrij | Gemarkeerde sessies, meldingen "Klopt dit niet?", gemelde squadnamen, besluit met redencode, beroepen | Elk besluit door een mens; beroep bij een tweede beheerder; blokkade met vier ogen | R1 |
| Vakantiepauze | Periode waarin streaks, pauzetellers, Belofte-dagen en doelbonus bevriezen | Wijziging alleen met logregel | R1 |
| Tentamenkalenders | Per vereniging, en per faculteit waar die verschilt, T, N, A, de herkansingsdagen in A en de tentamenperiodes (4.13), met bron en datum van controle; de standaardkalender voor eenheden zonder vereniging | Vastgelegd vóór 2 december, daarna alleen met besluit van de founder en logregel; zonder bevestigde kalender geen code | R1 |
| Uitbreiding | Uitgenodigde verenigingen, MAU-grens (werkhypothese 3.000), wachtlijst daarboven | Alleen op uitnodiging; geen open registratie | Lanceringsbesluit |
| Gebruikers | Zoeken, leeftijdsklasse, blokkeren, verwijderen, teamvlag | Elke inzage gelogd | R1 |
| Experimenten | Toewijzing per squad of solo voor vier factoren uit de vastgelegde seed, vergrendeld; stopknop arm B en uitknop rustarm (met besluit founder) | Geen wijziging zonder logregel | R1 |
| Auditlog | Elke inzage van sessiegegevens en elk besluit: wie, wanneer, waarom | Niet te wijzigen of te verwijderen | R1 |
| KPI-overzicht | Opgeslagen SQL-query's (hoofdstuk 7), per instroomkanaal en per vereniging, ook zonder verdachte accounts | Teamaccounts uitgesloten | R1 |

Heuristieken markeren alleen; een mens beslist. Elk besluit krijgt een redencode uit een vaste lijst, en de student ziet die reden in gewone taal.

### 4.12 De Belofte (R2)

| Regel | Waarde |
|---|---|
| Aanbod | Automatisch per gebruiker volgens de arm: vroeg (op focusdag T − 6 van de eigen kalender, zeven dagen vóór de bonusstop, en een tweede aanbod op A-start − 7; G-S10 na ronde 3) of laat (de eerste dag na het aprilvenster, voorregistratie §3.1). Wie bij het uitbreidingscohort hoort, valt buiten het experiment en krijgt het aanbod op dag 14. Na het eigen aanbod kan de gebruiker zelf een nieuwe Belofte starten; vóór het aanbod niet (anders lekt de late arm) |
| Keuzes | Dagen per week 3–7; minuten per dag 25 / 50 / 90 / 120; getuigen: de squad of niemand |
| Voorstel | Wat de gebruiker in de afgelopen 14 dagen werkelijk haalde, naar beneden afgerond op de vaste waarden |
| Looptijd | 14 dagen; dagen in de vakantiepauze tellen niet |
| Belofte-dag gehaald | Geverifieerde minuten die dag ≥ beloofde minuten; een gemarkeerde sessie telt voorlopig, na afkeuring niet |
| Beloning | Geen punten, badges of prijzen |
| Reflectie | Na 14 dagen: verlengen, aanpassen of stoppen; in de vroege arm als vooraf vastgelegd hernieuwingsaanbod, één keer, voor 14 dagen (founder G-S4); 18+ krijgt één vraag naar interesse in inzet |
| Dosis | Dagen onder een lopende Belofte per gebruiker, gerapporteerd per arm |
| Stoppen | Altijd, met één tik; getuigen zien "Belofte gestopt", zonder oordeel |
| Squad verlaten | De Belofte loopt door zonder getuigen |
| Modus zonder punten | Zelfde aanbod |

Een beloonde Belofte is weer een prikkel die moet doorlopen. In de termen van rapport 08 is dit een zacht commitment, met sociale in plaats van financiële kosten; dat het werkt, is de hypothese die we toetsen.

### 4.13 Tentamenkalender per vereniging en de kalenderregel (R1)

Besluit 1 na ronde 2, aangescherpt na ronde 3 (G-MF3): de **tentamenkalender per vereniging is de bron van T, N en A**. Alle data van de pilot volgen uit die kalender, niet uit vaste data in de parameters. Vaste data staan alleen nog in de **standaardkalender** voor eenheden zonder vereniging. De beheerder legt per vereniging een kalender vast, en waar de tentamenweken per faculteit verschillen een kalender per faculteit (G-S6); bron: de primaire pagina van de instelling of faculteit, met datum van controle, en de schriftelijke bevestiging van de vereniging. De founder bevestigt de kalenders uiterlijk 18 november. Een vereniging zonder bevestigde kalender krijgt geen code.

| Gegeven | Betekenis |
|---|---|
| T | De zondag waarmee de laatste reguliere tentamenweek (maandag tot en met zondag) van de tentamenperiode in januari of februari 2027 eindigt. Zo is de bonusstop om 04:00 op T + 1 altijd een maandag, en vallen de bonusstop en het einde van de prijsperiode (twee weken van maandag 04:00 tot maandag 04:00, 4.6) samen (besluit 1 na ronde 2: bonusstop aan het einde van de laatste tentamenweek) |
| N | Na-seizoensvenster: de eerste twee volle weken (maandag tot en met zondag) na T zonder tentamens of herkansingen van die periode (voorstel productteam) |
| A | Aprilvenster: de tentamenperiode in het voorjaar van 2027 volgens de kalender van de faculteit, eerste tot en met laatste tentamendag (G-S6) |
| Herkansingsdagen in A | Dagen in A die de faculteitskalender aanwijst als herkansing van een eerdere periode; ze vallen buiten de nawerkingsmaat (H3 en voorwaarde d) en worden apart gerapporteerd; voor de rustperiode, de aprilchallenge en het herhaalbericht veranderen ze niets (G-S6) |
| Tentamenperiodes | De periodes waarin de hersamenstelroute aan staat: van de start van de pilot tot en met T, en het aprilvenster met de week ervoor (werkhypothese productteam) |

| Moment | Regel |
|---|---|
| Doelbonusseizoen | Startdatum (2 december, uiterlijk 9 december, anders 4 januari; voorregistratie §3.5) tot en met T, zonder vakantiepauze; bonusstop 04:00 op T + 1 |
| Prijsperiode | T − 13 tot en met T |
| Januari-actieven (definitievenster) | T − 13 tot en met T − 7 (G-MF2) |
| Aankondiging stop, Belofte-aanbod vroeg, bekendmaking rustperiode; vanaf hier rustperiode-arm per persoon | T − 6 |
| Rustperiode | T + 1 tot en met het einde van A |
| Gevoeligheidsvenster steigertoets | T + 1 tot en met T + 14 (voorstel productteam; voorregistratie §4) |
| Pilotreflectie | T + 1 tot en met T + 7 |
| Na-seizoensmeting met motivatie-items, D30 buiten de tentamenweken | N |
| Tweede Belofte-aanbod vroeg | A-start − 7 (G-S10; moment voorstel productteam) |
| Herhaalbericht rustperiode | A-start, één keer (jurist should-fix 4) |
| Meting na A met motivatie-items | A-einde + 1 tot en met A-einde + 7 (voorstel productteam) |
| Belofte-aanbod laat | Dag na het einde van A |

**Welke kalender iemand volgt.** De toewijzingseenheid bepaalt de kalender: een squad volgt haar vereniging, zonder vereniging de vereniging van de maker; een solo-gebruiker zijn eigen vereniging; een eenheid zonder vereniging volgt de **standaardkalender** (G-MF3; dit vervangt het voorstel uit ronde 2 met de instelling van de instellingsmail en de laatst eindigende pilotkalender). De data van de standaardkalender legt de founder vóór 2 december vast; werkhypothese productteam, gelijk aan de aanname van het juridische team: de data van de laatst eindigende pilotkalender (voorregistratie §3.1; gebruiksvoorwaarden §1.5). Wie later bij een squad komt, neemt met de bonusarm ook de kalender van de squad over vanaf de eerstvolgende maandag; de rustperiode-arm alleen vóór T − 6 (5, toewijzing).

**Experimentpopulatie en uitbreidingscohort.** Wie zich registreert tot en met T van zijn kalender, hoort bij de experimentpopulatie; wie daarna registreert of via de uitbreiding binnenkomt, bij het uitbreidingscohort: geen toewijzing, punten volgens de ratio (ook in een rustsquad, persoonlijk doorlopend; jurist should-fix 3 na ronde 3), het Belofte-aanbod op dag 14, de voorraad uit de post gratis laag (4.3) (founder G-S14).

**Lanceringsbesluit.** Valt na T van de laatst eindigende pilotkalender (werkhypothese: niet vóór 8 februari 2027, **aanname**). Daarna opent de uitbreiding op uitnodiging, tot hoogstens 3.000 maandelijks actieve gebruikers met volledige beloningen (werkhypothese); daarboven gaan nieuwe aanmeldingen naar de wachtlijst (besluit 2 na ronde 2).

**In de code.** De parameterset bevat geen vaste data meer voor het seizoen, de bonusstop, het Belofte-aanbod, de rustperiode, de prijsperiode of de registratiegrens; `core/calendar` rekent ze per kalender uit (architectuur §3.4, §12.5). Alleen de vakantiepauze en het aanloopklassement (tot de vakantiepauze) zijn voor iedereen gelijk, en de standaardkalender is een kalender als de andere, met de vlag `is_default`.

### 4.14 Competentiefeedback (R2, Should)

Op het eindscherm (3.2) en bij de weekprestatie één regel: "Je focusduur steeg van X naar Y minuten." X is de mediaan van de geverifieerde minuten op actieve dagen in de eerste 7 dagen na de registratie, Y die mediaan over de afgelopen 7 dagen; de regel verschijnt alleen als Y minstens 10 minuten hoger is dan X, hoogstens één keer per week, en nooit tijdens de sessie (werkhypothesen productteam). Geen punten, geen vergelijking met anderen. Informatieve feedback over competentie verhoogde in Deci e.a. (1999) de vrijwillige voortzetting (rapport 08 §7; founder G-S13).

## 5. Puntenmodel en parameters

| Parameter | Waarde | Reden | Gevarieerd in de pilot? |
|---|---|---|---|
| Sessielengtes | 25 / 50 / 90 min | Businessplan §4 | Nee |
| Oefensessie | 1 min, 0 punten | Regel begrijpelijk maken (Retentie-first) | Nee |
| Ratio | 1 punt per geverifieerde minuut van een voltooide sessie | Vast, in één zin uit te leggen | Nee (bindend) |
| Afgebroken sessie | 0 punten | Businessplan §4 | Nee |
| Bijschrijven | Direct bij het einde van de sessie | Levitt e.a. 2016 | Nee |
| Punten tijdens de sessie | Niet in beeld | Gneezy e.a. 2011 (rapport 08 §7) | Nee |
| Puntenplafond per dag | 300 min | Founder G4; voorheen 480 | Nee |
| Dagrand | 04:00 Europe/Amsterdam | Aanname | Nee |
| Nachtregel | Sessies gestart 01:00–04:00: wel punten, geen doelbonus, rustig signaal | Founder GS9 | Nee |
| Tentamendag | Dagdoel opgeschort zonder joker; max. 3 per week | Founder G4; werkhypothese | Nee |
| Dagdoel | 25 / 50 / 90 / 120, standaard 25; bevestiging bij 90 of 120 in week 1; voorstel na 7 dagen | Carrera e.a. 2018; rapport 08 §7 | Nee |
| Doelbonus arm A (winst) | +20 per gehaald dagdoel, direct beschikbaar; max. 140 per week | Winstframing, gelijke verwachte waarde | **Ja** (16- en 17-jarigen altijd A) |
| Doelbonus arm B (slinkend weekbudget) | Maandag 04:00 140 punten *in afwachting* (bij instroom midden in de week 20 × resterende dagen); per gehaald dagdoel 20 direct *beschikbaar*; per gemist dagdoel vervalt 20; een tentamendag valt stil uit het budget | Patel e.a. 2016 (rapport 08 §7 implicatie 6) | **Ja** |
| Joker en doelbonus | Joker beschermt de doelbonus in geen van beide armen | Armen gelijk houden | Nee |
| Tentamenkalender | Per vereniging, en per faculteit waar die verschilt, T, N, A, herkansingsdagen in A en tentamenperiodes (4.13); de enige bron van de pilotdata; standaardkalender voor eenheden zonder vereniging | Besluit 1 na ronde 2; G-MF3 en G-S6 na ronde 3 | Nee (parameter per vereniging) |
| Seizoen doelbonus | Startdatum (2 december, uiterlijk 9 december, anders 4 januari; schuifregel) tot en met T van de eigen kalender (bonusstop 04:00 op T + 1), niet in de vakantiepauze; vooraf aangekondigd | Afbouw zonder ratio te wijzigen; start nawerkingsmeting | Nee |
| Vakantiepauze | 21 december 2026 – 3 januari 2027 (werkhypothese; rapport 03: circa 20 december – 4 januari) | Kerstdip apart houden | Nee |
| Inverdienperiode | 300 geverifieerde minuten | Businessplan §5 | Nee |
| Wachttijd eerste verzilvering | 7 dagen na de inverdienperiode, met een lichte menselijke blik | Founder J3 | Nee |
| Weekplafond verzilvering | 1 per week | Kosten per persoon begrenzen | Nee |
| Europlafonds | Item ≤ €5; individuele prijs ≤ €10; per persoon per maand ≤ €15; hoofdprijs ≤ €150; drempelprijs ≤ €75 | Rapport 09 §8; businessplan besluit 5 | Nee |
| Telefoonverificatie | Bij de eerste verzilvering, 1 mobiel nummer per account, nummertypecontrole bij de sms-verwerker | Rapport 09 §8; founder J3 | Nee |
| Puntenprijs | Kostprijs ÷ budgetwaarde per punt, afgerond op 50, vast | Geen variabele wisselkoers | Nee |
| Voorraad | Per pilotweek volgens een vast vrijgaveschema per post (gesloten pilot, onderzoekscohort, uitbreiding), gelijk voor alle armen, gespreid over de week vrijgegeven (werkhypothese: dagelijks een zevende), deels gereserveerd voor accounts met een instellingsanker (werkhypothese: de helft); schema en puntenprijzen in de voorregistratie §5.4 | Eerste week mag niet alles opmaken; fraudeurs nemen de voorraad niet weg (founder J3); behandeling verandert niet tijdens het experiment (founder G3) | Nee |
| Wekelijkse welzijnsmeting | Twee items vanaf de tweede focusweek, achter de welzijnstoestemming, overslaanbaar, zonder punten: 18+ stress en ervaren druk; 16- en 17-jarigen studietijd en afleiding zolang vraag 9a niet positief is beantwoord (`weekly_items_16_17`) | Stopregel arm B (founder G4); jurist should-fix 8 na ronde 3 | Nee |
| Rustdag-joker | 1 per lid per week, automatisch | Businessplan §5; Silverman en Barasch 2023 | Nee |
| Streakherstel | Twee geslaagde squaddagen direct na de breuk herstellen de oude streak; één keer per breuk; geen punten | Founder GS5 | Nee |
| Squadstreak | Helft van de actieve leden (naar boven, min. 2) | Rapport 03, risico loop A | Nee |
| Automatische pauze | Na 7 dagen zonder voltooide sessie | Businessplan §5 | Nee |
| Hersamenstellen | Na 7 dagen met < 2 actieve leden, alleen binnen de tentamenperiodes; samenvoegen alleen binnen dezelfde rustperiode-arm | Founder GS2; G-S6 en besluit 3 na ronde 2 | Nee |
| Squadomvang | 3–6 | Businessplan §5 | Nee |
| Live aanwezigheid | Standaard aan voor `18_plus`, uit voor `16_17` | Founder G4, J5 | Nee |
| Duel | 7 dagen, gehaalde dagdoelen, badge; buiten de squad alleen tussen 18-plussers | Geen pool in het klein; founder GS4, JS3 | Nee |
| Referral | 150 per partij; vesting 3 × ≥ 25 min in 7 dagen én na de wachttijd van de eerste verzilvering; niet bij hetzelfde toestel-id; max. 5 per maand; max. 50% van een puntenprijs; in de rustperiode vest het deel van die partij pas na het aprilvenster of na de rustuitstap (4.9) | Businessplan §7; founder J3; werkhypothese | Aan/uit in de tijd (vanaf 5 januari) |
| Vervaldatum | 12 maanden na de laatste voltooide sessie | Werkhypothese; niet gebouwd | Nee |
| Belofte-aanbod | Vroeg (op T − 6, zeven dagen vóór de bonusstop van de eigen kalender, met één hernieuwingsaanbod bij de reflectie en een tweede aanbod op A-start − 7) tegenover laat (dag na het aprilvenster) | Royer e.a. 2015 (rapport 08 §7 implicatie 8); besluit 1 na ronde 2, G-S4; G-S10 na ronde 3 | **Ja** |
| Rustperiode | Van T + 1 tot en met het einde van het aprilvenster geen nieuwe punten tegenover doorlopende punten; daarna voor iedereen punten; arm per persoon vanaf T − 6; aparte uitweg die in het onderzoek houdt, herhaald op A-start; overstap telt als uitstap; bewakingsregel | Besluit 3 na ronde 2; G-S1, G-S2 en jurist should-fix 4 na ronde 3; onder voorbehoud van de advocaat | **Ja** (16- en 17-jarigen en het uitbreidingscohort altijd persoonlijk doorlopend) |
| Squadprompt | Sterke prompt op dag 1–3 tegenover standaardflow, alleen solo-gebruikers | Founder G2 | **Ja** |
| Minimum challenge | 15 gekoppelde leden | Werkhypothese | Nee |
| Drempel collectieve prijs | Gemiddelde deelnamegraad ≥ 25% | Werkhypothese | Nee |
| Gemarkeerde sessie | Punten *in afwachting* tot het besluit | Hoofdstuk 6 | Nee |

**De verliesarm.** Businessplan §4 vraagt om een arm "wekelijks puntenbudget dat slinkt bij gemiste dagdoelen" tegenover gewone bijschrijving. Letterlijk opgevat verdwijnt de vaste ratio per minuut, en die is bindend. Daarom zijn de minuutpunten in beide armen gelijk en verschilt alleen een kleine doelbonus in framing. Arm A ziet: "Haal je doel vandaag: +20." Arm B ziet op maandag: "Je weekbudget: 140 punten. Elke dag dat je je doel haalt, zet je er 20 veilig." Een gehaald doel zet de 20 direct op *beschikbaar*, zodat de beloning ook in arm B direct volgt; een gemist doel toont "−20, je weekbudget is nu 100". Verwachte waarde en kosten zijn gelijk, zoals in Patel e.a. (2016). Rewarded trekt nooit iets in uit een beschikbaar saldo, en de taal blijft feitelijk ("Vandaag je doel halen houdt je weekbudget op 100", niet "Je verliest punten!").

**Transparantie.** Bij elke bonusmutatie toont de app de armregel met een link "Waarom zie ik dit?": "In de pilot werken we met twee bonusregels die evenveel opleveren. Jouw squad heeft de regel 'weekbudget'; de andere is 'per gehaald doel +20'. Je minuutpunten zijn voor iedereen gelijk." De advocaat (vraag 2, direct verstuurd) toetst de verliesarm vóór 25 november op oneerlijke handelspraktijk en dark pattern (open vraag 5); valt die toets negatief uit, of is er vóór 25 november geen antwoord, dan vervalt arm B en krijgt iedereen arm A. De advocaat bevestigt ook dat geen bonusarm een hogere maximale beloning kan opleveren dan de andere en dat de Belofte-arm geen punten raakt (founder JS2). Die eis geldt voor de bonusarmen A en B. Voor de rustperiode-arm oordeelde de jurist in ronde 2 dat het etiket "onderzoeksconditie" de arm niet houdbaar maakt, maar de uitweg wel: wie weer punten wil, kan dat zelf kiezen, zonder verlies en zonder uit het onderzoek te stappen (3.16 stap 4). De advocaat beoordeelt de arm opnieuw, nu met de rustperiode tot en met het aprilvenster (vraag 3, nu al verstuurd). Valt die toets negatief uit, dan vervalt de rustperiode-arm en verdient iedereen doorlopend punten (3.16 stap 9). Arm B stopt ook bij de stopregel voor deelnemersbescherming (6.6).

**Toewijzing.** Vier factoren worden onafhankelijk toegewezen, 50/50: doelbonus (A/B), Belofte (vroeg/laat) en rustperiode (rust/doorlopend) per squad bij het aanmaken en voor solo-gebruikers per persoon bij registratie; de squadprompt (sterk/standaard) alleen voor solo-gebruikers bij registratie. Geloot in blokken van 4 per vereniging en instroomkanaal, deterministisch uit een vooraf vastgelegde seed (voorregistratie §9). 16- en 17-jarigen krijgen altijd arm A en doorlopende punten, ook in een squad met arm B of de rustperiode; de bonusregel en de punten zijn persoonlijk, dus squadleden zien geen verschil. Wie later bij een squad komt, neemt vanaf de eerstvolgende maandag de bonusarm van de squad over; de rustperiode-arm alleen als hij vóór T − 6 van de kalender aansluit, want vanaf T − 6 hoort de rustperiode-arm bij de persoon (besluit founder na ronde 3, G-S2); de Belofte-arm alleen als zijn eigen aanbod nog niet getoond is. Een lid van de rustgroep dat na T − 6 overstapt naar een doorlopende squad, stapt daarmee uit de rustperiode (`rest_period_exit`, bron `squad_switch`, 3.16 stap 4). Zo zien squadleden na T − 6 soms een andere puntenregel bij elkaar dan vóór T − 6; squadleden zien geen punten van elkaar, dus dat blijft onzichtbaar, en we rapporteren het aandeel gemengde rustsquads (voorregistratie §10). Elke wissel wordt gelogd (`arm_switched`); de analyse gebeurt op de eerst toegewezen arm (7.3). Samenvoegen kan alleen binnen dezelfde rustperiode-arm. Wie zich na T van zijn kalender registreert, valt buiten het experiment (uitbreidingscohort, 4.13).

**Vóór 2 december** (of vóór de startdatum volgens de schuifregel) staan de vaste data niet meer in de parameters, worden de toewijzings-, kalender- en grootboekcode bevroren en onafhankelijk gereviewd, en draait daarna een A/A-controle met een gesimuleerd cohort op die bevroren code en de echte KPI-query's, door de toewijzing, de armwissels, overstappen na T − 6, samenvoegingen, de vakantiepauze, tentamendagen, **ten minste twee kalenders met een verschillende T** plus de standaardkalender, de rustperiode, het herhaalbericht en de rustuitstap (founder GS10, G-S12; G-MF3 na ronde 3; voorregistratie §9.3).

## 6. Anti-fraude in de web-MVP

### 6.1 Wat de web-MVP eerlijk claimt

"Rewarded telt je focustijd zolang de app zichtbaar op je scherm openstaat. Wissel je van app of tabblad of gaat je scherm uit, dan stopt de sessie." Dat is een aanwijzing van zelfdiscipline op één apparaat, geen bewijs van focus en geen bewijs dat de telefoon niet gebruikt is (rapport 09 §3.3 en §8). "Bewezen" staat nergens in de app; "geverifieerde minuut" betekent alleen: voldoet aan 4.1. Een tweede telefoon, een oude telefoon aan de lader of een headless browser sluiten we niet uit. We maken ze onrendabel met het puntenplafond, het weekplafond, de europlafonds, telefoonverificatie met nummertypecontrole, de wachttijd op de eerste verzilvering, gespreide voorraadvrijgave en vertraagde levering van prijzen. Een websessie rechtvaardigt punten en kleine verdiende prijzen, nooit geld (businessplan besluit 5). Ligt de bovengrens van het interval van het geschatte aandeel frauduleuze accounts uit de onafhankelijke steekproef (6.7) op of boven 5%, dan gaan de beloningen in de gratis laag van de uitbreiding omlaag tot native verificatie er is (businessplan §9); mijn voorstel is dan de europlafonds en de vrijgave voor het uitbreidingscohort te halveren. Het vrijgaveschema van het onderzoekscohort blijft vast.

### 6.2 Signalen die we loggen

Per sessie: servertijd van start, heartbeats en einde; de nonce-keten; zichtbaarheidsgebeurtenissen met client- en monotone tijd; gebufferde logs na een gat; Wake Lock aangevraagd, verkregen, geweigerd of vrijgegeven; `blur` en `focus` op de desktop; user agent en `navigator.webdriver`; standalone of browser; gehasht IP met netklasse; het toestel-id; het verschil tussen client- en serverklok; de claimvertraging. Per account: de bron van de registratie (uitnodigingsobject, verenigingscode, wachtlijst, ambassadeur), de hash van het genormaliseerde e-mailadres, het aantal accounts per IP-hash, per telefoonnummer en per toestel-id, het nummertype, het instellingsanker, en verzilveringen.

### 6.3 Heuristieken

Deze lijst ligt vast vóór 2 december. De drempels zijn werkhypothesen zonder externe benchmark. H12 is na ronde 2 toegevoegd: het identiteitsanker verplaatst de fraude van nepidentiteiten naar echte leden die hun account laten bespelen, bijvoorbeeld zes browserprofielen op één laptop (founder J1). Na ronde 3 kijkt H12 naar overlap over de hele sessieduur in plaats van gelijke starttijden: wie zes profielen om de drie minuten start, ontliep de oude definitie volledig (besluit founder na ronde 3, jurist should-fix 2). Campus- en mobiele CGNAT-adressen (netklassen, architectuur §4.5) worden bij H2, H7 en H10 niet overgeslagen maar met een hogere drempel geteld; die drempels volgen uit de red-teamdag en liggen vóór 2 december op de seed vast (founder J2; voorregistratie §7.4). Markeringen meten detectie, niet fraude: het aandeel markeringen is een maat voor de wachtrijlast, de go/no-go-maat is de steekproef (6.7).

| Code | Heuristiek | Waarom |
|---|---|---|
| H1 | `navigator.webdriver` is waar, of de user agent noemt een headless browser | Automatisering (rapport 09 §3.3) |
| H2 | Meer dan 3 accounts met voltooide sessies vanaf dezelfde IP-hash binnen 24 uur; voor `campus` en `mobile_cgnat` geldt een hogere drempel **[uit de red-teamdag]** | Meerdere accounts (rapport 09 §7.1) |
| H3 | Som van gedekte heartbeatgaten groter dan 10% van de geplande duur (4.1) | Onvolledig bewijs |
| H4 | Klokafwijking tussen client en server van meer dan 5 minuten | Mogelijke manipulatie |
| H5 | Meer dan 480 geverifieerde minuten op een dag, 3 dagen achter elkaar (de punten stoppen bij 300, de minuten worden verder gemeten) | Onwaarschijnlijk patroon |
| H6 | Sessies zonder onderbreking tussen 01:00 en 06:00 op meer dan 2 nachten per week | Telefoon aan de lader |
| H7 | Een squad waarvan alle leden binnen 10 minuten vanaf dezelfde IP-hash zijn geregistreerd; bij `campus` en `mobile_cgnat` met een hogere drempel **[uit de red-teamdag]** | Nep-squad; vertekent ook het squadcriterium |
| H8 | Een telefoonnummer dat eerder op een geblokkeerd account stond | Herhaling |
| H9 | Meer dan 80% van de voltooide sessies in een week met een claimvertraging van meer dan 15 minuten | Onbeheerd toestel (Groei-first) |
| H10 | Meer dan 20 nieuwe gekoppelde leden van één vereniging in 48 uur, waarvan meer dan de helft op hoogstens 3 IP-hashes; `campus` en `mobile_cgnat` tellen mee met een hogere drempel **[uit de red-teamdag]** | Telefoons laten meedraaien (rapport 03, loop B) |
| H11 | Meer dan één account dat in dezelfde week verzilvert vanaf hetzelfde `client_device_id` | Meervoudige accounts in de catalogus (founder J3); signaal voor de wachtrij, geen automatische weigering |
| H12 | Gelijktijdige sessies: het aantal accounts met tegelijk lopende sessies vanaf dezelfde IP-hash en dezelfde user-agentklasse, gemeten op **overlap over de hele sessieduur**, ongeacht wanneer ze startten. Werkhypothese (voorstel jurist ronde 3): ≥ 3 accounts met ≥ 40 minuten overlap op ≥ 2 dagen per week, met het `desktop-*`-deel apart geteld (studenten in de UB zitten vooral op telefoons met wisselende `ua_class`); markeert ook op `campus`, met de drempel **[uit de red-teamdag]**; live vóór 4 januari | Echte ledenaccounts die door één persoon worden bespeeld (founder J1; jurist should-fix 2 na ronde 3) |

Een heuristiek die tijdens de pilot aantoonbaar kapot is (bijvoorbeeld een campusnetwerk dat in de netklassen ontbreekt), passen we alleen aan met een besluit van de founder en een logregel. We rapporteren dan beide cijfers, met en zonder de aanpassing.

### 6.4 Wat er met gemarkeerde sessies en meldingen gebeurt

Een gemarkeerde sessie telt voorlopig voor het dagdoel, de squadstreak en de Belofte: een eerlijke student mag niet lijden onder een vals positief voordat een mens heeft gekeken. De punten staan *in afwachting* en tellen niet voor de inverdienperiode, verzilvering, het duel, de challenge of prijzen. De student ziet: "Deze sessie wordt nagekeken (reden: …). Je punten komen vrij zodra dat klaar is, meestal binnen 3 werkdagen." De exacte drempel noemen we niet. Een beheerder beslist binnen 3 werkdagen: vrijgeven of afkeuren, met een redencode. Bij afkeuring telt de sessie met terugwerkende kracht nergens meer mee. Bij H1, H7 of H8 kan de beheerder het account blokkeren; een blokkade vraagt een tweede beoordelaar.

Een melding via "Klopt dit niet?" of een gemelde squadnaam komt in dezelfde wachtrij. De beheerder kan de sessie herstellen als voltooid als er objectief bewijs is: een storing aan onze kant in die periode, of een gebufferd log dat alsnog binnenkwam en aan de regels van 4.1 voldoet. Zonder zulk bewijs blijft de afbreking staan, met uitleg. Het aantal meldingen per afbreekcode is input voor de beslissing over een terugkeervenster na de pilot.

### 6.5 Beroep

Binnen 14 dagen na een afkeuring, terugboeking of blokkade, via een knop bij de sessie met een vrij tekstveld. Een andere beheerder dan de eerste beslist binnen 5 werkdagen, gemotiveerd (businessplan §4; art. 22 AVG, rapport 09 §7.3). Bij een gegrond beroep komen de punten terug en telt de sessie alsnog, ook voor een challenge-uitslag die nog niet definitief is. Een definitieve uitslag wordt niet herzien; dat staat vooraf in de voorwaarden. Aantal en uitkomst van beroepen zijn de maat voor valse positieven. Na de pilot publiceren we hoeveel sessies onterecht zijn afgekeurd, en uit de steekproef (6.7) een schatting met interval van hoeveel accounts onterecht beloond zijn (rapport 09 §8). De definitieve-uitslagregel geldt alleen met deze werkende beroepsprocedure ervoor (founder J6).

### 6.6 Schadesignalen en stopregel (founder G4)

| Code | Signaal (werkhypothese) | Reactie |
|---|---|---|
| S1 | Sessies gestart tussen 01:00 en 04:00 op ≥ 3 nachten binnen 7 dagen | Rustige kaart met hulpbronnen van de eigen instelling (3.15) |
| S2 | Meer dan 360 geverifieerde minuten per dag op ≥ 3 dagen binnen 7 dagen | Idem |
| S3 | Na een gebroken squadstreak van ≥ 7 dagen geen voltooide sessie in 7 dagen, terwijl de student in de 7 dagen ervoor op ≥ 5 dagen focuste | Idem |
| S4 | Supportbericht met het label "welzijn" | Persoonlijk antwoord met hulpbronnen |

Schadesignalen zijn geen fraudesignalen: ze kosten geen punten, ze zijn alleen voor de student zelf zichtbaar en voor het team alleen als telling per arm en per code. **Stopregel:** arm B stopt (iedereen arm A vanaf de volgende maandag) bij een vooraf vastgelegd verschil tussen de armen op de wekelijkse meting van twee items (3.14) of in het aandeel gebruikers met een signaal; met een vooraf vastgelegde correctie voor herhaald kijken, een minimum van 40 deelnemers per arm voor het welzijnscriterium en weigeraars als ontbrekend met een gevoeligheidsanalyse. De grenzen en de toetsmethode staan in de voorregistratie §8.3, met de founder, de statisticus en de onderzoeker als eigenaar (uiterlijk 25 november). **Bewakingsregel voor de rustarm** (besluit founder na ronde 3, G-S1): van T + 1 tot en met A-einde vergelijkt de weekafsluiting elke maandag de schadesignalen S1–S4 in de rustgroep met die in de doorlopende groep; werkhypothese productteam voor de grens, naar analogie van criterium 2 van arm B: het aandeel gebruikers met een signaal is in de rustgroep meer dan twee keer dat van de doorlopende groep, met de correctie voor herhaald kijken van de statisticus (voorregistratie §8.3). Bij overschrijding gaat de vlag `rest_period` uit en verdient iedereen vanaf de volgende focusdag weer punten. **Absolute schadegrens:** S1–S4 bij 2% of meer van de wekelijks actieven betekent geen uitbreiding vóór beoordeling door de onderzoeker (werkhypothese founder, G-S7, tot de ijking). Na ronde 3 rapporteren we S1–S4 per code naast elkaar, niet alleen opgeteld, en beoordeelt de onderzoeker volgens vooraf vastgelegde criteria: trend over minstens twee weken, verdeling per arm en kalender, per code met S4 apart, samenvallen met tentamenweken, en of dezelfde personen terugkomen (voorstel productteam; voorregistratie §8.3; G-S5). S1–S3 zijn profilering zonder rechtsgevolg en staan in de DPIA; S4 is een gezondheidsgegeven (4.10).

### 6.7 Onafhankelijke fraudeschatting (founder J1)

Elke maandag trekt de server met de seed en het weeknummer 30 accounts uit de accounts met een voltooide sessie in de afgelopen week, gestratificeerd per vereniging (plus "geen vereniging" en, vanaf het lanceringsbesluit, het uitbreidingscohort als eigen stratum; jurist should-fix 5 na ronde 3). Een beheerder (de pilotbeheerder, die geen lid is van een deelnemende vereniging, geen ambassadeur en geen deelnemer, en per item een belang meldt; jurist should-fix 6) doet per account een lichte controle: identiteitsanker (instellingsmail of mobiel nummer bevestigd), nummertype, sessiepatroon (ook H12), en een kort contact met de vraag om squad of vereniging te bevestigen. Heeft het account een instellingsanker, dan loopt het contact via het instellingsadres: omdat we dat adres niet bewaren, vraagt de app de student het opnieuw te bevestigen met een code, en moet de HMAC van het ingevulde adres gelijk zijn aan de opgeslagen HMAC (founder J4; na ronde 3 HMAC in plaats van alleen het domein, jurist should-fix 1). Het oordeel ("geen aanwijzing", "verdacht", "frauduleus") volgt de vooraf vastgelegde criteria per oordeel (voorregistratie §7.2) en krijgt een redencode; verdacht of frauduleus leidt tot een normale beoordeling in de wachtrij met beroep, de steekproef zelf boekt niets. De schatting (gewogen, met 95%-interval) is de go/no-go-maat voor fraude: de bovengrens van het interval moet onder 5% liggen, in de pilot en in elk kanaal van de uitbreiding (één fraudegrens; jurist should-fix 5), en we rapporteren de schatting als ondergrens van de werkelijke fraude. Alle KPI's worden ook gerapporteerd zonder de accounts die de steekproef verdacht vindt. Dezelfde controle geldt voor de verplichte steekproef van 20 leden bij prijswinnaars (4.6).

**Red-teamdag (vóór 25 november).** Twee mensen proberen een dag lang met een headless browser, een hotspot en e-mailaliassen tien accounts door de inverdienperiode en een verenigingsweek te krijgen, en daarnaast zes echte accounts op één laptop op eduroam te laten draaien, tegelijk en gespreid gestart (founder J1; jurist should-fix 2), en tien accounts met één instellingsadres te verankeren (jurist should-fix 1). De uitkomst gaat in de voorregistratie en bepaalt de hogere drempels voor campus en CGNAT en de drempel van H12.

## 7. Meetplan

**Infrastructuur.** Eén tabel `events` (id, naam, `user_id` gepseudonimiseerd, servertijd, eigenschappen als JSON, release, `arm_bonus`, `arm_belofte`, `arm_rest`, `arm_prompt`, `squad_id`, `channel`, `calendar_id`, `cohort` (experiment/uitbreiding)). Grootboekmutaties en auditlog staan in eigen tabellen, te koppelen via `session_id` of `user_id`. KPI's zijn opgeslagen SQL-query's; de beheerder draait elke maandag het weekrapport, altijd per instroomkanaal en per vereniging, op kalendertijd naast relatieve dagen, en ook zonder de accounts die de steekproef verdacht vindt. Accounts van het team krijgen vooraf een vlag en tellen nergens mee. Afgekeurde sessies tellen nergens mee. Wie zich voor het onderzoek afmeldde, telt vanaf de afmelding niet mee in de experimentele analyses.

### 7.1 Eventtaxonomie

| Event | Eigenschappen | Wanneer |
|---|---|---|
| `invite_created` | invite_id, bron (squad/duel/club/personal), maker, max_uses, geldig_tot | Link of QR gemaakt |
| `invite_share_opened` | invite_id, kanaal (whatsapp/systeem/kopie) | Deelmenu geopend |
| `invite_link_opened` | invite_id, nieuwe_bezoeker | Op de server, vóór registratie |
| `account_created` | bron, invite_id, vereniging_id, qr_bron, age_band | Na akkoord met de voorwaarden |
| `experiment_assigned` | arm_bonus (A/B), arm_belofte (vroeg/laat), arm_rest (rust/doorlopend), arm_prompt (sterk/standaard/nvt), eenheid (squad/solo), blok, age_band | Bij registratie of squad aanmaken |
| `research_opt_out` | dag | Afmelding voor het onderzoek |
| `rest_period_exit` | dag, bron (bericht/herhaalbericht/profiel/squad_switch) | Uit de rustperiode gestapt, ook via een overstap na T − 6; blijft in het onderzoek |
| `survey_answered` / `survey_skipped` | moment (instroom/wekelijks/reflectie/na_seizoen/april), week, itemset (welzijn/studie_afleiding/motivatie), items (alleen codes) | Vragenlijst |
| `competence_feedback_shown` | van_min, naar_min | Competentiefeedback (Should) |
| `belofte_renewal_offered` | — | Hernieuwingsaanbod bij de reflectie (vroege arm) |
| `squad_prompt_shown` / `squad_prompt_used` | dag (1–3) | Squadprompt-experiment |
| `exam_day_set` | datum | Tentamendag aangezet |
| `late_session_signal_shown` | session_id | Sessie gestart 01:00–04:00 |
| `harm_signal_raised` / `harm_card_viewed` / `harm_help_opened` | code (S1–S4) | Schadesignaal |
| `streak_recovered` | squad_id, lengte | Herstel na twee dagen op rij |
| `squad_regroup_offered` / `squad_merged` | squad_id | Hersamenstellen of samenvoegen |
| `squad_name_reported` | squad_id | Meldknop |
| `institution_email_verified` / `institution_email_rejected` | domein; bij weigering reden (`in_use`/`domain`) | Instellingsanker; weigering bij een adres dat al bij een ander account hoort |
| `institution_email_reconfirmed` | aanleiding (steekproef/invoering_hmac) | Herbevestiging van het instellingsadres |
| `first_redemption_hold_started` / `first_redemption_hold_ended` | dagen | Wachttijd eerste verzilvering |
| `sample_drawn` / `sample_judged` | week, soort (wekelijks/prijs/ambassadeur), stratum, oordeel, criterium | Steekproef (beheer) |
| `sample_interest_declared` | sample_id | Pilotbeheerder meldt een belang; item naar de tweede beoordelaar |
| `sample_contact_reconfirmed` | kanaal (instelling/account) | Contact in de steekproef bevestigd |
| `plus_interest` | — | Nepdeur Plus |
| `rest_period_notice_shown` | arm_rest, moment (t_min_6/april) | Bekendmaking rustperiode op T − 6 en het herhaalbericht op A-start |
| `rest_period_flag_off` | reden (bewakingsregel/advocaat/founder) | Rustarm gestopt |
| `arm_switched` | factor, van, naar, reden | Lid neemt arm van squad over |
| `practice_completed` | — | Oefensessie afgerond |
| `daily_goal_set` | minuten, bron (onboarding/voorstel/zelf), overmoed_bevestigd | Doel gekozen of gewijzigd |
| `goal_suggestion_shown` / `goal_suggestion_accepted` | voorgesteld, huidig | Na 7 dagen |
| `session_started` | session_id, duur_gepland, device_class, standalone, wakelock_supported | Server maakt sessie aan |
| `wakelock_state` | session_id, status (acquired/denied/released) | Bij elke wijziging |
| `heartbeat_gap` | session_id, gap_s, log_geleverd, log_geldig | Bij herstel of afsluiting |
| `visibility_hidden` | session_id, verstreken_s | Pagina verborgen |
| `session_completed` | session_id, minuten, punten, flagged, flag_codes, claim_delay_s | Server keurt einde goed |
| `session_aborted` | session_id, reden (code 4.1), verstreken_s | Server sluit af |
| `abort_recovery` | session_id, actie (opnieuw/korter/weg), seconden_tot_actie | Keuze na afbreking |
| `return_after_abort` | session_id, hidden_duur_s | Terugkeer na `hidden` |
| `abort_report_submitted` | session_id, reden_gebruiker | "Klopt dit niet?" |
| `daily_goal_met` / `daily_goal_missed` | datum, minuten, joker_gebruikt | Dagafsluiting om 05:45 (over focusdag D, dagrand 04:00; productplan §10, architectuur §6.1) |
| `goal_bonus_booked` | arm, mutatie, week | Grootboekmutatie doelbonus |
| `squad_created` / `squad_joined` / `squad_left` | squad_id, invite_id, ledental_na | Lidmaatschap |
| `squad_became_active` | squad_id | Derde lid erbij |
| `squad_day_evaluated` | squad_id, datum, geslaagd, actieve_leden, jokers, streak | 05:45 (over focusdag D, dagrand 04:00) |
| `member_paused` / `member_resumed` | squad_id, dagen_inactief | Pauzeregel |
| `presence_viewed` | leden_live | App geopend met live leden |
| `compare_optin_changed` | aan/uit | Schakelaar |
| `duel_created` / `duel_accepted` / `duel_finished` | duel_id, invite_id, uitslag | Duel |
| `vereniging_joined` | vereniging_id, qr_bron | Koppeling |
| `code_cap_reached` | vereniging_id | Plafond 1,1× bereikt |
| `club_dashboard_viewed` / `promo_kit_downloaded` | vereniging_id, tab of asset | Bestuur |
| `leaderboard_viewed` | poule, periode | Ranglijst bekeken |
| `challenge_enrolled` | challenge_id | Inschrijving prestatiechallenge |
| `belofte_offered` | trigger (vroeg/vroeg_2/laat/buiten_experiment), squadstatus | Aanbod getoond (`vroeg_2`: het tweede aanbod op A-start − 7) |
| `belofte_made` | dagen_per_week, min_per_dag, getuigen, verhouding_tot_historie | Belofte aangegaan |
| `belofte_day_result` | gehaald | Dagafsluiting |
| `belofte_reflection` | actie (verlengen/aanpassen/stoppen), stake_interest (ja/nee/weet niet; alleen 18+) | Na 14 dagen |
| `belofte_stopped` | dag | Tussentijds gestopt |
| `catalog_viewed` | items_zichtbaar, saldo, inverdiend | Tabblad Beloningen |
| `redemption_completed` | item_id, punten, kostprijs, financier_id | Verzilvering |
| `redemption_blocked` | reden (inverdien/week/maand/voorraad/saldo/dekking) | Geweigerd; met reden `voorraad` de bron van de KPI "gerechtigden zonder verzilvering" |
| `catalog_empty_seen` | week, pool | Een gerechtigde opent Beloningen terwijl de vrijgegeven voorraad van vandaag op is |
| `coverage_alert` | tekort_eur, week | Dekkingsalarm |
| `flag_reviewed` | session_id, besluit, redencode, doorlooptijd_u | Beheerder beslist |
| `appeal_submitted` / `appeal_decided` | object_id, uitkomst | Beroep |
| `prize_awarded` | prize_id, type, waarde_eur | Na winnaarsverificatie |
| `no_points_mode_changed` | aan/uit | Should |
| `card_created` / `card_share_opened` / `verify_page_viewed` | card_id, aanleiding, velden_aan | Kaart |
| `referral_pending_created` / `referral_vested` / `referral_lapsed` | invite_id, sessies | Referral |
| `support_labeled` | label (uitbetalen/focus/vrienden/techniek/welzijn) | Supportbericht gelabeld |

### 7.2 Pilot-KPI's

| KPI | Drempel | Berekening uit events |
|---|---|---|
| Activatie | ≥ 60% | Accounts met `session_completed` (≥ 25 min, niet afgekeurd) binnen 24 uur na `account_created`, gedeeld door alle `account_created` (rapport 03). De oefensessie telt niet |
| D7 go/no-go-cohort | ≥ 25% als vaste lat, hoogstens één herhaling in 15–25%; stopregel < 15% | Registratie vanaf de startdatum tot en met 13 december (januarivariant: 4–10 januari); aandeel met ≥ 1 goedgekeurde `session_completed` op dag 6, 7 of 8 (G-S8 na ronde 3); altijd met de kalenderdata van het venster per registratiedag; de D7 van de standaardflow van H1 per kanaal alleen gerapporteerd |
| D30 (beschrijvend) en D30 buiten de tentamenweken | Stopregel < 6% voor de tweede (geen tweede tranche en geen opschaling): aandeel van het go/no-go-cohort met ≥ 1 goedgekeurde sessie in het na-seizoensvenster N van de eigen kalender (voorregistratie §6.1) | D30 op kalendertijd én met overgeslagen vakantiedagen, beide met de kalenderdatum |
| Januari-actieven, voorwaarden (c) en (d) | (c) ≥ 20%; (d) ≥ 25%, beide op de doorlopende arm | Januari-actieven: ≥ 2 sessiedagen in T − 13 tot en met T − 7 (G-MF2 na ronde 3); noemer en teller alleen de doorlopende arm, de rustarm in een aparte regel; (c) aandeel met ≥ 2 sessiedagen in elk van de weken 1–7 en 8–14 februari, of in elk van de twee weken van N voor een kalender waarbij 1–14 februari overlapt met T − 6 tot en met T of met de herkansingen van die periode (voorregistratie §6.1); (d) aandeel met ≥ 1 sessiedag in A zonder de herkansingsdagen, ook apart voor deelnemers zonder vereniging (voorregistratie §6.1) |
| Geschatte fraude | Bovengrens van het 95%-interval < 5%, in de pilot en per kanaal in de uitbreiding | Steekproef (6.7): gewogen aandeel "frauduleus" per week en cumulatief, voor onderzoekscohort en uitbreidingscohort apart en samen, gerapporteerd als ondergrens |
| Kosten in de pilot | Binnen het pilottotaal per post (€1.500 gesloten pilot; €4.000 en €2.500 onderzoekscohort; werkhypotheses) | Kostprijs van `redemption_completed` + `prize_awarded` per post, cumulatief; plus de weken waarin de voorraad op was |
| Kosten in de uitbreiding | ≤ €0,06 per wekelijks actieve gebruiker per week (werkhypothese, aanname) | Idem voor de post gratis laag, gedeeld door gebruikers van het uitbreidingscohort met ≥ 1 goedgekeurde sessie in die week |
| Absolute schadegrens | < 2% per week (werkhypothese tot de ijking) | Gebruikers met ≥ 1 `harm_signal_raised` in de week, gedeeld door gebruikers met ≥ 1 goedgekeurde sessie in die week, over alle armen; ook per code S1–S4 naast elkaar |
| Bewakingsregel rustarm | Voorregistratie §8.3 | Per week van T + 1 tot en met A-einde: aandeel gebruikers met ≥ 1 `harm_signal_raised` in de rustgroep tegenover de doorlopende groep, per code |
| Aandeel actieven in een squad | geen drempel (gezond ≥ 40%, businessplan §7) | Per week: gebruikers met ≥ 1 `session_completed` die lid zijn van een squad na `squad_became_active`, gedeeld door alle gebruikers met ≥ 1 `session_completed`. Duels tellen niet; "squad of duel" rapporteren we apart |
| Squadoverleving | geen drempel; KPI | Aandeel squads met ≥ 2 actieve leden in week 4 en week 8 na `squad_became_active` |
| Reactivering van squads | geen drempel; KPI (founder G-S6; per rustperiode-arm, G-S11 na ronde 3) | Aandeel squads met ≥ 2 actieve leden in A, onder de squads met ≥ 2 actieve leden in T − 13 tot en met T, per rustperiode-arm |
| Deelnamegraad per vereniging | geen drempel; naast de 30% actieve seats (founder G-S3) | Gekoppelde leden met ≥ 2 sessiedagen per week, gedeeld door het externe ledental, in de laatste tentamenweek en in A. Een rapportagemaat (KPI), niet de challengescore van 4.6 (≥ 3 dagen dagdoel met identiteitsanker, gedeeld door max(ledental, gekoppelde leden)) |
| Uitstap per arm | Drempel voor differentiële uitstap in de voorregistratie §4 | `rest_period_exit` (per bron, ook `squad_switch`) en `research_opt_out` per arm, apart en samen; uitstap in de week na het herhaalbericht apart |
| Gemengde rustsquads | geen drempel | Aandeel rustsquads met leden die persoonlijk doorlopend verdienen (16- en 17-jarigen, uitbreidingscohort, afmelders, uitstappers); H3b ook zonder die squads |
| Gerechtigden zonder verzilvering | geen drempel (founder G-S4 na ronde 3) | Per week, per arm en per post: gerechtigden (voorbij inverdienperiode en wachttijd, weekplafond nog vrij) met `redemption_blocked` reden `voorraad` of `catalog_empty_seen` en geen `redemption_completed` in die week, gedeeld door alle gerechtigden van die week |
| K uit uitnodigingen van gebruiker aan gebruiker | geen go/no-go | Geactiveerde accounts met een invite_id van een pilotgebruiker met bron squad, duel of personal, gedeeld door geactiveerde pilotgebruikers in dezelfde periode. Wachtlijst, verenigingscode, ambassadeurscode en kaart tellen niet. Per bron en apart voor 2 december – 3 januari (zonder referral) |
| Gemarkeerde sessies (wachtrijlast) | geen drempel | `session_completed` met flagged = waar, gedeeld door alle `session_completed`; plus doorlooptijd van besluiten |
| Afgekeurd na herbeoordeling | geen drempel | Afgekeurde sessies gedeeld door alle `session_completed`, per bron en per vereniging |
| D7 squad tegenover solo (beschrijvend) | geen go/no-go | D7 van accounts die op dag 0–2 in een actieve squad zaten, gedeeld door D7 van de rest. Zelfselectie: geen causaal bewijs |
| Schadesignalen per arm | Stopregel voorregistratie §8.3 | `harm_signal_raised` per code en per arm, per week |
| Kwaliteit per kanaal | geen kanaal < 50% van het gemiddelde (rapport 03) | D7, D30 en squadaandeel per bron en per vereniging |
| Beloningsjagers (signaal) | geen drempel | Aandeel met `redemption_completed` en daarna 14 dagen geen sessie; aandeel met `catalog_viewed` vóór de eerste sessie en geen D7; aandeel supportberichten met label "uitbetalen" |
| W3-retentie | geen drempel | Activeerden met `session_completed` op ≥ 2 dagen in dag 15–21, vakantiepauze overgeslagen |
| Belofte-overname | geen drempel | `belofte_made` gedeeld door `belofte_offered`, per arm_bonus |
| Belofte-naleving | geen drempel | Aandeel `belofte_day_result` gehaald; aandeel reflecties met verlengen |
| Nawerking (H3) | verkennend; H3b via (f) | Primair binair: aandeel met ≥ 1 sessiedag in A zonder de herkansingsdagen, vergeleken tussen Belofte-armen (H3a) en tussen rustperiode-armen (H3b, non-inferioriteit met marge δ), met instroomactiviteit als covariaat en Holm over H3a en H3b (7.3); gevoeligheidstoets: sessiedagen per week in T + 1 tot en met T + 14 per rustperiode-arm; secundair sessiedagen per week in A, N en de tussenperiode, motivatie-items in N en na A |
| Belofte-dosis | geen drempel | Dagen onder een lopende Belofte per gebruiker, per arm |
| Interesse in inzet (H-C) | geen drempel | Aandeel `stake_interest` = ja onder 18+-reflecties |
| Herstel na afbreking | geen drempel | Aandeel `session_aborted` gevolgd door `session_completed` dezelfde dag, per `abort_recovery`-actie |
| Modus zonder punten | geen drempel | Wie hem kiest (`no_points_mode_changed`), en hun retentie |
| Interesse in Plus | < 5% van de D30-actieven: Plus verdwijnt als bron uit de pitch (founder S7) | D30-actieven met `plus_interest`, gedeeld door de D30-actieven (go/no-go-cohort met een sessie op dag 30 of in N; voorregistratie §6.2); secundair `plus_interest` gedeeld door gebruikers die de nepdeur zagen |
| Forest en Opal | geen drempel | Aandeel dat bij instroom Forest of Opal gebruikt of gebruikte, en de redenen |

### 7.3 Experimentarmen en analyse

| Factor | Armen | Toetst | Primaire maat | Secundair |
|---|---|---|---|---|
| Doelbonus (H2) | A winst tegenover B slinkend weekbudget | Meer gehaalde dagdoelen tijdens het seizoen; de ene redelijk gepowerde vergelijking | Aandeel gebruikersdagen met `goal_met_final` tijdens het seizoen | Focusminuten per week, D7, sessiedagen, reflectievraag over de bonusregel |
| Squadprompt (H1) | Sterk tegenover standaard, solo-gebruikers | Causaal squadeffect (encouragement design) | D7 op toewijzing (ITT); IV met squadlidmaatschap op dag 7 | W3, squadoverleving, binnen-persoonsanalyse rond het actief worden van de squad |
| Belofte-aanbod (H3a) | Vroeg (T − 6, met hernieuwingsaanbod en een tweede aanbod op A-start − 7) tegenover laat (na A) | Nawerking met een commitmentaanbod op het moment dat de prikkel afloopt (Royer e.a. 2015); bepaalt de omvang van tranche 2 niet | Aandeel met ≥ 1 sessiedag in A zonder herkansingsdagen (binair), Holm met H3b | Sessiedagen per week in A, N en de tussenperiode, overname, naleving en hernieuwing naar squadstatus, dosis (ook in A) |
| Rustperiode (H3b) | Geen nieuwe punten van T + 1 tot en met het einde van A tegenover doorlopend; arm per persoon vanaf T − 6; aprilchallenge gelijk | De steigertoets: non-inferioriteit met marge δ (werkhypothese 10 procentpunten), gevoeligheidstoets in T + 1 tot en met T + 14, vier uitkomsten die (f) bepalen; onder voorbehoud van de advocaat | Aandeel met ≥ 1 sessiedag in A zonder herkansingsdagen (binair), Holm met H3a | Sessiedagen per week in A, N en de tussenperiode, terugkeer in de week vóór A, motivatie-items en niet-beloond studeren in N en na A, welzijn, uitstap per arm, reactivering van squads |
| Interactie Belofte × rustperiode | Vier cellen | Verkennend, vooraf vastgelegd en vooraf als niet-informatief benoemd (founder G-S5; G-S9 na ronde 3) | Als H3 | — |
| Beschrijvend | Referral uit (2 december – 3 januari) tegenover aan (vanaf 5 januari) | Draagt de sociale loop zonder punten? | K per bron | — |
| Beschrijvend | Squad tegenover solo; modus zonder punten | Rapport 08 §7 | D7, W3 | — |

**Analyseregels.** Ontwerp, maten, analyse-eenheden, kleinste detecteerbare effecten en beslisregels staan in de voorregistratie, vóór 2 december vastgelegd. Analyse op de eerst toegewezen arm (intention to treat); bij H1 is de ITT het hoofdresultaat en de IV een bovengrens; de kalender is een stratum. Wisselaars (`arm_switched`) rapporteren we apart, en als gevoeligheidsanalyse ook zonder hen. Standaardfouten clusteren op de toewijzingseenheid (squad of solo). We rapporteren effectgroottes met betrouwbaarheidsintervallen. 16- en 17-jarigen tellen niet mee in de analyse van doelbonus en rustperiode. Een statisticus doet vóór 25 november een poweranalyse op 300–800 gebruikers die per hypothese het kleinste detecteerbare effect levert, met clustering op squads, de uitsluitingen en de halve noemer van (c) en (d) (G-S9 na ronde 3); is dat groter dan plausibel, dan heet de hypothese verkennend en hangt er geen besluit aan, behalve H3b via (f). De statisticus stelt ook δ, de gevoeligheidsgrens en de Holm-uitwerking vast (voorregistratie §4.0). **De vier uitkomsten van de steigertoets** (voorregistratie §4, in deze rangorde, lezing productteam): verdringing (ondergrens van het interval van rust min doorlopend boven 0) → volle tranche met een kleinere beloningslaag; afhankelijkheid (bovengrens onder 0) → €180.000 en native uitgesteld; steiger ondersteund (ondergrens boven −δ en gevoeligheidstoets gehaald) → volle tranche; onbeslist (al het andere, ook als H3b vervalt) → €180.000 met alleen Android UsageStats. Alle uitkomsten per instroomkanaal en per vereniging, en ook zonder de accounts die de steekproef verdacht vindt.

**Herkansingen.** Dagen in A die de faculteitskalender als herkansing van een eerdere periode aanwijst, vallen buiten de nawerkingsmaat (H3 en voorwaarde d) en worden apart gerapporteerd (G-S6 na ronde 3; 4.13).

**Nawerking.** We vergelijken tussen armen, niet vóór en na de bonusstop: rond die datum eindigen de tentamens en begint de uitbreiding, en elke voor-na-vergelijking meet vooral dat. Na de tentamenweken zakt de vraag naar focus in beide armen naar een vloer, waarin een verschil onzichtbaar wordt. De primaire nawerkingsmaat ligt daarom in de volgende periode met echte vraag naar focus: het aprilvenster van de eigen kalender. Omdat de rustperiode tot en met dat venster doorloopt en de aprilchallenge voor beide armen gelijk is, verschillen de armen daar alleen in individuele punten (besluit 3 na ronde 2). Het na-seizoensvenster en de tussenperiode zijn secundair. Het aprilvenster is schoon voor de Belofte, omdat de late arm pas daarna een aanbod krijgt. Wie na T van zijn kalender instroomt, valt buiten het experiment.

**Kwalitatief.** Supportberichten krijgen een label. Zo zien we het signaal uit businessplan §7: praten gebruikers over focus en vrienden, of vooral over wanneer ze kunnen uitbetalen? Het label "welzijn" is schadesignaal S4.

### 7.4 Vragenlijsten

Kort, altijd overslaanbaar, zonder punten. Het welzijnsinstrument kiest een onderzoeker (founder G4); de items staan in de voorregistratie §8.4. De welzijnsitems staan achter de aparte toestemming uit 3.1 stap 8; hoe weigeraars meetellen, staat in de voorregistratie §8.4.

| Moment | Inhoud |
|---|---|
| Instroom | Welzijn (stress, slaap, ervaren squaddruk, intrinsieke motivatie); zelfgerapporteerde studietijd en telefoonafleiding ("vóór"); gebruik van Forest of Opal en waarom Rewarded ernaast of in plaats daarvan |
| Wekelijks, vanaf de tweede focusweek | 18+: twee items, stress en ervaren druk (stopregel arm B tot en met de bonusstop; daarna tot en met A voor de rapportage per rustperiode-arm). 16- en 17-jarigen: studietijd en afleiding, tenzij vraag 9a vóór de eerste uitnodiging positief is beantwoord (3.1 stap 8) |
| Pilotreflectie (T + 1 tot en met T + 7) | Welzijn; hoe voelde de bonusregel (per arm) |
| Na-seizoensmeting (N) | Welzijn; studietijd en telefoonafleiding ("na"); korte meting van intrinsieke motivatie en één vraag naar niet-beloond studeren, per arm (G-S3 na ronde 3) |
| Na het aprilvenster (A-einde + 1 tot en met A-einde + 7) | Studietijd en telefoonafleiding; dezelfde motivatie-items en de vraag naar niet-beloond studeren, per arm |

## 8. Scope

| Prioriteit | Onderdeel | Release | Motivatie |
|---|---|---|---|
| Must | Onboarding met magic link, e-mailnormalisatie, leeftijdsklasse (16+, 18+), toegang via uitnodiging, geïnformeerde deelname, oefensessie, tip "Niet storen" | R1 | Activatie; 16+ is bindend; afbreken voorkomen; deelnemersbescherming |
| Must | Focus-engine: 3 lengtes, zichtbaarheid, Wake Lock, servertijd, heartbeat met gatregels, afbreekcodes, nachtregel, "Kortere sessie", "Klopt dit niet?" | R1 | Alle retentiecriteria; fraude; menselijke herbeoordeling |
| Must | Grootboek met vaste ratio, puntenplafond 300, inverdienperiode met wachttijd, weekplafond, doelbonus in twee armen met seizoenseinde, tentamendag | R1 | Kosten; de ene gepowerde vergelijking; deelnemersbescherming |
| Must | Catalogus met geboekte dekking, europlafonds, partnerverklaring, CSV-voorraad, gespreide vrijgave met reservering, telefoonverificatie met nummertype, dekkingsalarm, verplichting naast budget | R1 | Kosten per actieve gebruiker; fraude (businessplan §6, §9) |
| Must | Squads met uitnodigingsobject, aanwezigheid via polling (uit voor `16_17`), dagdoel met overmoedrem, streak met herstel, joker, automatische pauze, hersamenstellen, meldknop squadnaam | R1 | Squadaandeel, squadoverleving, K; DSA |
| Must | Verenigingscode met plafond, externe ledentalbron, verenigingsovereenkomst, instellingsanker, promotiekit, bestuursdashboard | R1 | Koude start (businessplan §3); fraude rond de verenigingsprijs |
| Must | Tentamenkalender per vereniging (per faculteit waar die verschilt) als enige bron van de pilotdata, met herkansingsdagen, standaardkalender en de kalenderregel (4.13); geen vaste data in de parameters | R1 | Alle data van de pilot (besluit 1 na ronde 2; G-MF3 na ronde 3) |
| Must | Eventlog, KPI-query's per kanaal en per kalender, experimenttoewijzing met seed voor vier factoren, `arm_switched`, afmelding voor het onderzoek, codebevriezing met onafhankelijke review, A/A-controle op de bevroren code | R1 | Alle criteria; voorregistratie |
| Must | Fraudesignalen, H1–H12 (H12 op overlap over de sessieduur), wachtrij, beroep, auditlog, wekelijkse steekproef met criteria per oordeel, het uitbreidingscohort als eigen stratum, melding van een belang door de pilotbeheerder en contact via het instellingsadres, lijst eerste verzilveringen | R1 | Onafhankelijke fraudeschatting; bindende herbeoordeling |
| Must | Instellingsanker uniek per adres (`institution_email_hash` met unieke index) en herbevestiging van bestaande ankers | R1 als haalbaar, uiterlijk R2; live vóór 4 januari | Teller van de verenigingsprijs, gereserveerde voorraad en ambassadeursvergoeding (jurist should-fix 1 na ronde 3) |
| Must | Vragenlijst bij instroom, wekelijkse meting van twee items per leeftijdsklasse, schadesignalen S1–S4 met kaart en hulpbronnen, stopregeltelling, schadegrens per code, stopknop arm B | R1 | Deelnemersbescherming (founder G4, G-S7; jurist should-fix 8 en G-S5 na ronde 3) |
| Must | Squadprompt-experiment voor solo-gebruikers | R1 | Causaal squadeffect (founder G2) |
| Must | Vakantiepauze | R1 | Kerstdip apart houden |
| Must | De Belofte met aanbod volgens arm (ook het tweede aanbod op A-start − 7), getuigen, reflectie en vraag naar inzet | R2 | Centrale pilothypothese |
| Must | Pilotreflectie, na-seizoensvragenlijst en meting na A, met de motivatie-items | R2 | Welzijn, bonusregel en verdringing per arm (G-S3) |
| Must | Prijsperiode Blokk-challenge met poules, drempel- en hoofdprijs, instellingsanker in de teller, verplichte steekproef, terugvalvariant, winnaarsverificatie | R3 | Wedge; fraude rond de verenigingsprijs |
| Must | Rustperiode-arm tot en met het aprilvenster achter een vlag, met de uitweg "Ik wil weer punten verdienen", het herhaalbericht op A-start, de arm per persoon vanaf T − 6 met de overstap als uitstap, persoonlijk doorlopende punten voor minderjarigen en het uitbreidingscohort, samenvoegen binnen de arm en de bewakingsregel; aprilchallenge op deelnamegraad met het extern ledental dat Rewarded zelf opvraagt | R3 (aan vóór de eerste bonusstop) | Steigertoets H3b, onder voorbehoud van de advocaat |
| Must | Gerichte ambassadeurssteekproef vóór elke uitbetaling | R3 (vóór de eerste uitbetaling) | Ambassadeursvergoeding (jurist should-fix 7 na ronde 3) |
| Must | Gescheiden voorraadposten met vast vrijgaveschema en voorraad naast gerechtigden | R1 (post onderzoekscohort vóór de eerste bonusstop) | Kostenmaat als pilottotaal (founder G3, MF5, J10) |
| Must | Uitbreiding op uitnodiging met MAU-grens en wachtlijst | Lanceringsbesluit | Besluit 2 na ronde 2 |
| Should | Aanloopklassement in december | R1 (uiterlijk 9 december) | Wervingsreden vóór de kerst |
| Should | Duels op gehaalde dagdoelen | R2 | Tweede uitnodigingsmoment; hergebruikt de squadlink |
| Should | Deelbare bewijskaart met verificatiepagina | R2 | Versterker; in de pilot vooral wachtlijstvoorrang |
| Should | Modus zonder punten | R2 | Tegen verdringing; we meten wie hem kiest (founder GS6) |
| Should | Competentiefeedback ("je focusduur steeg van X naar Y") | R2 | Tegen verdringing (founder G-S13; 4.14) |
| Should | Individuele prestatiechallenge met vaste plaatsen | R3 | Retentie in de tentamenweken |
| Should | Referral achter een vlag | R3 | Versneller, na de meetperiode van K uit squads |
| Should | E-mailherinnering (dagdoel of streak in gevaar, max. 1 per dag) | R1 | D7 |
| Should | Nepdeur Plus ("Plus komt eraan, €2,99"), alleen op het web, nooit in een app-build | R1 | Interessemeting (founder S3); drempel 5% van de D30-actieven (S7 na ronde 2) |
| Could | Minuten vergelijken in de squad (opt-in) | R1 | Gevraagd door de squadlogica; geen criterium |
| Could | Installatie-uitleg voor de PWA; webpush in geïnstalleerde webapps | R2 | Wake Lock en meldingen; iOS-gedrag eerst testen |
| Won't (deze ronde) | Trekkingsmodule | — | Niet gebouwd (businessplan besluit 3); datamodel en vlag als lege plek |
| Won't (pilot) | Terugkeervenster, pauze binnen een sessie, vrije sessielengtes | — | Strijdig met businessplan §4; extra fraudewegen |
| Won't (pilot) | Websockets, partner-API's, partnerportaal, export voor het bestuur, berichten van het bestuur aan leden | Na de pilot | Geen criterium; botst met het verbod op individuele monitoring |
| Won't (pilot) | Puntvervaldatum, stad tegen stad, verticale video | Later | Geen effect binnen de pilot of camera nodig |
| Won't (nooit) | Openbare individuele ranglijsten, cash-out, loot boxes, variabele wisselkoers, beloning op delen, pool-model, contactimport | — | Harde randvoorwaarden |

**Schrapvolgorde van de experimentfactoren** (besluit founder na ronde 3, G-MF3). Is bij de bevriezing niet alles af, dan vervalt eerst arm B (H2): iedereen krijgt arm A. Een verdere schrapping van een factor gebeurt alleen met een gedateerd besluit van de founder in de voorregistratie, vóór de start (voorregistratie §3.5). **Schuifregel:** liever later starten dan zonder poorten: uiterlijk 9 december, anders 4 januari met een verkort seizoen.

**Volgorde bij tijdnood.** Loopt R1 uit, dan schrappen of verschuiven we in deze volgorde: de Could-items, de nepdeur Plus, de e-mailherinnering, het aanloopklassement (naar 9 december), het vergelijken van minuten. Loopt R2 uit: eerst de competentiefeedback, dan de kaart (naar R3), dan duels (naar R3), dan de modus zonder punten (naar R3). De Belofte moet uiterlijk drie dagen vóór het eerste aanbod (T − 6 van de vroegst eindigende kalender) klaar zijn. Loopt R3 uit: eerst referral (naar na het lanceringsbesluit), dan de prestatiechallenge. De rustperiode-arm moet aan kunnen vóór de eerste bonusstop; lukt dat niet, dan vervalt de arm (en dat staat dan in de voorregistratie). Focus-engine, grootboek, squads, events, experimenttoewijzing, kalenderregel, fraudewachtrij, steekproef, deelnemersbescherming en de review van de experiment- en grootboekcode schuiven nooit. Liever een week later starten dan een pilot zonder meting of zonder bescherming.

**Na de pilot.** In de volgorde van de verificatieladder (businessplan §5, rapport 09 §8), met als eerste native stap de kleinste: (1) een Android-app op de voorgrond met Play Integrity en de gebruikstijdlijn via UsageStats (trede 2 en 3 op Android, vóór iOS; besluit founder na ronde 3, investeerder S7), wat catalogusbeloningen tot een plafond per toestel en per persoon en grotere verdiende prijzen rechtvaardigt; het Google Play-beleid voor `PACKAGE_USAGE_STATS` lezen we vóór de bouw op de primaire pagina; (2) daarna iOS met App Attest en de blokkade via de Screen Time-API's; de Family Controls-entitlement vragen we aan zodra het ontwikkelaarsaccount bestaat. Of en hoe ver deze stappen gaan, hangt af van de steigertoets via (f): bij afhankelijkheid geen native bouw, bij onbeslist alleen Android UsageStats (voorregistratie §6.1); (3) Rewarded Plus na native verificatie (in de web-MVP alleen de nepdeur); (4) de inzetlaag als commitment contract blijft visie, buiten deze ronde, pas na native verificatie, juridische toetsing en een volgende financieringsronde. Of de Belofte in april nawerking laat zien en of 18-plussers interesse in inzet tonen, is input voor dat besluit. Trekkingen komen alleen terug na een schriftelijke opinie en een expliciete schriftelijke reactie van de Kansspelautoriteit (stilte is nee). Het pool-model komt in geen enkele fase terug.

## 9. Open vragen en aannames

1. **Drempels en kalender (besloten na ronde 2, aangescherpt na ronde 3).** In de voorregistratie: go/no-go-cohort, D7 op dag 6–8 ≥ 25% als vaste lat met hoogstens één herhaling, stopregels, kalenderregel per vereniging, D30 buiten de tentamenweken in het na-seizoensvenster, januari-actieven op T − 13 tot en met T − 7, bindende voorwaarden (a)–(e) en de vier uitkomsten van de steigertoets voor (f). Het venster van voorwaarde (c) volgt de kalenderregel: 1–14 februari, of N van de eigen kalender als 1–14 februari overlapt met de laatste tentamenweek of de herkansingen (voorregistratie §6.1 en open punt 2; uitwerking van besluit 1). Open: de kalenders zelf (founder, uiterlijk 18 november). Achteraf schuiven is uitgesloten.
2. **Team en bouwtijd (aanname).** In tranche 1 twee bouwrollen, nog te werven, met AI-ondersteunde ontwikkeling, vanaf januari 2027; de native rol pas bij tranche 2. R1–R3 bouwt de founder in november en december zelf (besluit founder, 5 november); daarom geldt de schrapvolgorde uit hoofdstuk 8, met ten minste de extra schrappingen voor twee ontwikkelaars uit architectuur §12.4.
3. **Pilotbudget (besloten na ronde 2).** Rewarded betaalt de gesloten pilot uit de post "pilotprijzen en catalogus" (werkhypothese €1.500) en het onderzoekscohort na het seizoen uit €4.000 catalogus en €2.500 aprilchallenge (werkhypotheses). Open: het vrijgaveschema en de prijslijst (uiterlijk 25 november), en wat er daarnaast aan partnerbijdragen geboekt is.
4. **Poweranalyse (open, vóór 25 november).** Levert per hypothese het kleinste detecteerbare effect; met 300–800 gebruikers en toewijzing per squad verwacht ik alleen voor H2 een plausibel MDE (**inschatting**).
5. **Verliesarm en rustperiode-arm (advocaat, vragen 2 en 3, nu al verstuurd; antwoord vóór 25 november).** De jurist oordeelde in ronde 2: arm B is geen oneerlijke handelspraktijk zonder aftellers of urgentie-copy; de rustperiode-arm is houdbaar onder drie voorwaarden (uitweg in het bericht, eerlijke tekst over wat de groep bepaalt, rustuitstap gescheiden van onderzoeksuitstap), die deze spec uitwerkt (3.16). De advocaat beoordeelt nu de rustperiode tot en met het aprilvenster, ook in tentamenweken. Zonder akkoord vervalt de arm.
6. **Prijzen op deelnamegraad en europlafonds (jurist).** Geldt een collectieve prijs op deelnamegraad als prestatie, ook de rangprijs onder de Wok? Passen de plafonds uit 4.3 bij "kleine verdiende prijzen"? Zo niet: terugvalvariant met alleen drempelprijzen.
7. **Vervaldatum en "zolang de voorraad strekt" (jurist).** Houdbaar onder het consumentenrecht?
8. **Leeftijdscontrole bij winnaars (open).** Zonder kopie van een identiteitsbewijs en zonder BSN (founder J5); de werkwijze (bijvoorbeeld inzage bij overhandiging van de prijs) besluiten vóór R3.
9. **Terugkeervenster (open, na de pilot).** Zonder venster breekt een inkomend gesprek de sessie af. `return_after_abort`, `abort_recovery` en de meldingen laten zien hoe vaak dat gebeurt.
10. **iOS in het veld (aanname).** Wake Lock en Page Visibility in de Home Screen-app vanaf iOS 18.4, en webpush in geïnstalleerde webapps, zijn alleen bekend uit compatibiliteitsdata (rapport 09 §3.1). Testen op echte toestellen vóór 2 december; het aandeel oudere iOS-versies in de pilot is onbekend.
11. **Gatregel (werkhypothese).** Het maximum van 5 minuten voor een gebufferd log en de 10% van H3 zijn niet extern onderbouwd; evaluatie op `heartbeat_gap` en meldingen.
12. **Squadstreak op de helft (werkhypothese).** Vergevingsgezind genoeg om squads niet te laten uiteenvallen, streng genoeg om betekenis te hebben?
13. **Ledental (opgelost).** Alleen een externe bron (opgave aan de instelling, bestuursbeurs, bevestiging van de faculteit); een jaarverslag of ALV-stuk van het bestuur zelf volstaat niet voor de hoofdprijs.
14. **Verwerkingsrol van de vereniging (jurist).** Vastgelegd in een korte overeenkomst per vereniging (gezamenlijke verantwoordelijkheid waar dat zo is). Open: valt de IP-hash of het toestel-id onder art. 11.7a Telecommunicatiewet (rapport 09 §7.3, niet geverifieerd)? In de DPIA.
15. **Zachte commitment (hypothese).** Dat een Belofte zonder geld een deel van het effect van Royer e.a. (2015) heeft, is niet aangetoond. Dat is wat de pilot verkennend toetst.
16. **Tentamenperiodes (besloten na ronde 2; data open).** Kalender per vereniging (4.13); bevestiging uiterlijk 18 november. Het besluit uit ronde 1 om het Belofte-aanbod voor iedereen op 11 januari te doen, is vervallen.
17. **Sleutelhash van het instellingsadres (besloten na ronde 3).** HMAC van het genormaliseerde adres met een unieke index, vóór 4 januari; alleen HMAC en domein bewaard (jurist should-fix 1; dit vervangt het besluit van 5 november "geen hash"). Open: herbevestiging van bestaande ankers en de bewaring van 2 jaar na een blokkade zijn voorstellen van het juridische team (4.10).
18. **Einde rustperiode en aprilchallenge (besloten na ronde 2).** Rustperiode van T + 1 tot en met het einde van het aprilvenster; aprilchallenge voor beide armen gelijk op deelnamegraad; daarna punten voor iedereen. De secundaire maat terugkeer in 25–31 maart wordt terugkeer in de week vóór het aprilvenster.
19. **Tentamendag (werkhypothese).** Hoogstens 3 per week; is dat genoeg in een week met vier tentamens, en te weinig om als joker te misbruiken? Evaluatie op `exam_day_set`.
20. **Plafond per ambassadeur en drempels S1–S3 (founder, vóór 2 december).** Plafond per ambassadeur: werkhypothese van de founder (€5 per gebruiker, hoogstens 40 per ambassadeur per maand). De drempels van de schadesignalen zijn werkhypothesen voor "meerdere dagen"; de stopregel voor arm B ligt bij de founder, de statisticus en de onderzoeker (uiterlijk 25 november).
21. **Standaardkalender en het na-seizoensvenster.** Eenheden zonder vereniging volgen de standaardkalender (besluit founder na ronde 3, G-MF3); de data legt de founder vóór 2 december vast (werkhypothese productteam: die van de laatst eindigende pilotkalender). N als de eerste twee volle weken zonder tentamens of herkansingen na T blijft een voorstel productteam; bevestiging founder vóór 2 december.
22. **Prijsperiode en poules per kalender (voorstel productteam).** Twee weken eindigend op T; poules bij voorkeur per kalender. In de challengevoorwaarden (juridisch team).
23. **H12 op overlap en de user-agentklasse (werkhypothese).** Na ronde 3 op overlap over de sessieduur (≥ 3 accounts, ≥ 40 minuten overlap, ≥ 2 dagen per week, `desktop-*` apart; voorstel jurist). Is de user-agentklasse fijn genoeg om zes profielen op één laptop te onderscheiden van twintig studenten in de UB? Drempel na de red-teamdag, met het gespreide scenario.
24. **Competentiefeedback (werkhypothese).** Mediaan eerste 7 dagen tegenover de afgelopen 7 dagen, vanaf 10 minuten stijging; evaluatie op `competence_feedback_shown`.
25. **Uitbreiding (werkhypothese).** MAU-grens van 3.000 met volledige beloningen; wat er boven de grens gebeurt met squads waarvan een lid op de wachtlijst staat (voorstel: een squadlink van een bestaande gebruiker gaat voor op de wachtlijst zolang de grens niet bereikt is).
26. **Geen prestatiechallenges in de hele rustperiode (voorstel, founder).** Challengevoorwaarden B7 geldt van T + 1 tot en met het einde van het aprilvenster, niet alleen in het aprilvenster; zo verschillen de armen alleen in individuele punten (3.16 stap 7, 4.6). Bevestiging founder vóór 2 december (voorregistratie open punt 13); wijst de founder het af, dan geldt de regel alleen in het aprilvenster en passen challengevoorwaarden B7 en deze spec mee aan.
27. **Welzijnsitems voor 16- en 17-jarigen (besloten na ronde 3 voor de weekitems; advocaat 9a).** Wekelijks krijgen 16- en 17-jarigen alleen de vragen over studietijd en afleiding, tenzij de advocaat vraag 9a vóór de eerste uitnodiging positief beantwoordt (jurist should-fix 8). Open: of de welzijnsitems op de vaste momenten dezelfde beperking krijgen; de founder besliste dat niet (gebruiksvoorwaarden §6.9, vraag advocaat 9e; voorregistratie open punt 14).
28. **Januarivariant van de schuifregel (voorstel productteam).** Cohortvenster 4–10 januari, aanloopklassement vervalt, minimumduur van het seizoen per kalender open (voorregistratie §3.5). Bevestiging founder vóór 2 december.
29. **Bewakingsregel rustarm (werkhypothese productteam).** Grens naar analogie van criterium 2 van arm B; correctie door de statisticus (voorregistratie §8.3).
30. **Gevoeligheidsvenster en momenten (voorstel productteam).** Gevoeligheidstoets in T + 1 tot en met T + 14 met N als gevoeligheidsanalyse; tweede Belofte-aanbod op A-start − 7; meting na A in A-einde + 1 tot en met A-einde + 7. Bevestiging founder vóór 2 december.
31. **Impliciete puntwaarde (open tot de prijslijst).** De budgetwaarde per punt vraagt de verwachte geverifieerde minuten per post, een teamaanname die er nog niet is; tot de prijslijst (25 november) staat alleen de inschatting van de gedragswetenschapper in de voorregistratie (§5.4).

## 10. Beslissingen en afwijkingen

### 10.1 Uitgangspunt

Beide juryleden kozen MVP-first als winnaar (65 en 62 punten), dus de structuur, de releasekalender en de kern komen daaruit: de strenge sessieregel zonder venster, de verliesarm die de ratio intact laat, het duel zonder punten, polling, een eigen eventtabel en een functionele beheeromgeving. Waar de juryleden verschilden, heb ik gekozen en dat hieronder gemotiveerd.

### 10.2 Wat uit welke variant komt

| Onderdeel | Uit | Waar |
|---|---|---|
| Structuur, releases, focus-engine, grootboek, verliesarm met gelijke verwachte waarde, duel zonder punten, heuristieken H1–H8, KPI-definities, schrapvolgorde | MVP-first | Overal |
| De Belofte, afgeslankt (zonder punten, squad als getuige, reflectie, vraag naar inzet voor 18+) | Retentie-first | 3.12, 4.12 |
| Aangekondigd einde van de doelbonus, nawerkingsmaat, W3 | Retentie-first | 4.2, 7.2 |
| Oefensessie, "Niet storen", "Kortere sessie", tabel met randgevallen | Retentie-first | 3.1, 3.3, 4.1 |
| Competentiefeedback vóór punten, geen punten tijdens de sessie, overmoedrem, doelvoorstel na een week | Retentie-first | 3.2, 4.4 |
| "Zolang de voorraad strekt", dekkingsalarm | Retentie-first | 3.4, 4.3 |
| Arm B die per gehaald doel direct veiligstelt | Retentie-first | 5 |
| Modus zonder punten (Could) | Retentie-first | 4.10 |
| Squadstreak op de helft van de actieve leden | Retentie-first en Groei-first | 4.4 |
| Uitnodigingsobject met bron, K per bron, kwaliteit per kanaal, beloningsjagers | Groei-first | 3.5, 7 |
| Noemer max(opgegeven, gekoppeld), codeplafond 1,1×, poules, drempelprijs, aanloopklassement, promotiekit | Groei-first | 3.7, 4.6 |
| Trekkingen achter een vlag, aparte opt-in, kans als getal, seed-hash, jaarlimiet (na ronde 1 niet gebouwd) | Groei-first | 3.9 |
| Leeftijdsklasse en datum van 18 in plaats van geboortedatum; auditlog; verificatiepagina die zegt wat ze niet bewijst | Groei-first | 4.8, 4.10, 4.11 |
| Claimvertraging als signaal (H9), verenigingspiek (H10), "Klopt dit niet?" | Groei-first | 4.1, 6 |

### 10.3 Must-fixes van de jury en hoe ze zijn opgelost

| Must-fix | Jury | Oplossing |
|---|---|---|
| Centrale pilothypothese meetbaar maken; nawerking tussen armen | 1 en 2 | Belofte in R2, gerandomiseerd per squad met een laat aanbod als controle; na ronde 1: aanbod bij de stop van de doelbonus, primaire meting in april 2027, rustperiode-arm (7.3) |
| Scope-afwijkingen van §10 en §6 voorleggen; haalbaar tijdpad R3 | 1 en 2 | Kaarten Should in R2; referral R3 na meetperiode; na 5 januari geen nieuwe modules; trekkingsmodule na ronde 1 uit de bouw. Voorgelegd in 10.5 |
| Europlafond voor verdiende prijzen | 1 en 2 | Vijf plafonds in 4.3, gekoppeld aan rapport 09 §8 |
| Analyseregel voor armwisselingen | 1 | ITT, `arm_switched`, wisselaars apart (5, 7.3) |
| Meldroute bij technische afbrekingen | 1 | "Klopt dit niet?" naar de wachtrij (3.3, 6.4) |
| Kerstcorrectie en drempels vóór 2 december | 1 en 2 | Voorstel in open vraag 1, besluit in 10.5 |
| Verliesarm laten toetsen; armregel bij elke mutatie | 1 | Open vraag 5; transparantieregel in 5 |
| Uitstaande punten tegenover voorraad | 1 | Tekst in 3.4, verplichting en dekkingsgraad in 4.3 |
| Ranglijstnoemer en drempelprijs | 2 | 4.6 |
| Afbreekgrens bij heartbeatgat, maximum van het log, verhouding tot H3 | 2 | Tabel in 4.1 |
| Dekking op geboekte omzet | 2 | Gefactureerd of getekend contract (4.3) |
| Afbreken helpen voorkomen | 2 | Oefensessie, "Niet storen", "Kortere sessie" |
| Duels met niet-squadleden laten bevestigen | 2 | 10.5 |

### 10.4 Wat ik niet overnam, en waarom

**Belofte voor iedereen in plaats van gerandomiseerd (jury 2).** Jurylid 2 wilde de Belofte in R2 aan iedereen aanbieden en de randomisering uitstellen tot semester 2. Jurylid 1 wilde randomiseren als de poweranalyse dat toelaat. Ik randomiseer per squad, om drie redenen. Ten eerste vraagt de must-fix van beide juryleden om nawerking tussen armen te vergelijken, en zonder controle-arm is er geen vergelijking voor de Belofte. Ten tweede kost een tweede factor in een 2×2-ontwerp geen steekproefomvang voor de hoofdeffecten: elke factor wordt op alle squads geschat, zolang de interactie klein is. Het argument van MVP-first dat elke extra arm de groepen verder opdeelt, geldt voor de interactie, niet voor de hoofdeffecten. Ten derde krijgt iedereen het aanbod: na ronde 1 de late arm na de nawerkingsmeting van april 2027. De poweranalyse bepaalt daardoor alleen hoe we de uitkomst lezen.

**Struikelmoment en geplande pauzes (Groei-first).** Een sessie die doorloopt terwijl de pagina verborgen is, is strijdig met businessplan §4 en maakt de eerlijke claim onwaar. Beide juryleden wezen dit af.

**Claimtik binnen 15 minuten als voorwaarde voor punten (Groei-first).** Jurylid 2 noemde de claimtik of het loggen van de vertraging. Ik log de vertraging en markeer bij een patroon (H9), maar houd punten niet tegen: een verplichte tik kost eerlijke sessies, en punten horen direct bij het einde te volgen.

**Terugkombonus, mijlpaalpunten, squadbonus en duelbonus (Retentie-first, Groei-first).** Jurylid 1 noemde de stapeling van bonussen lastig uit te leggen, en jurylid 2 zei dat de beloning zo weer op loon gaat lijken. Er is één bonus, de doelbonus van MVP-first in twee armen. Het seizoensidee van Retentie-first, een vooraf aangekondigd einde, heb ik daarop wel toegepast.

**Twee ranglijsten met prijs, berichten van het bestuur, stad tegen stad (Retentie-first, Groei-first).** Eén prijsmaatstaf houdt de challenge uitlegbaar. Berichten aan leden zijn een nieuwe verwerking zonder grondslag. Stad tegen stad hangt aan geen criterium.

**Randomisering per gebruiker binnen squads en het uitnodigingsexperiment (Groei-first).** Squadgenoten in verschillende armen besmetten de vergelijking en zien verschillende regels zonder te weten waarom. Een derde factor verkleint de cellen voor de interacties verder.

**Twee tot drie duels tegelijk, sociale inzet (Retentie-first, Groei-first).** Eén duel tegelijk volgt MVP-first en houdt de uitslag eenvoudig. De sociale inzet ("de verliezer kookt") is sympathiek maar hangt aan geen criterium. Duels op gehaalde dagdoelen wees ik in versie 1.0 af als "geen criterium"; na ronde 1 zijn ze wel ingevoerd, omdat duels op minuten marathonsessies belonen en dat een welzijnscriterium is (founder GS4).

**Ledental van het bestuur als enige noemer (Retentie-first).** Niet te controleren; daarom de maximumregel met codeplafond.

**Eigen keuze die geen jurylid vroeg.** De squadstreak op de helft van de actieve leden in plaats van op alle leden. MVP-first liet de streak breken op het zwakste lid; met squads van drie tot zes en een tentamenperiode met ziekte en inhaaltentamens vind ik dat te kwetsbaar (rapport 03, risico loop A). Het is een werkhypothese.

### 10.5 Wat de founder moet beslissen

| Besluit | Stand na ronde 1 | Uiterlijk |
|---|---|---|
| Trekkingen | Niet bouwen; datamodel en vlag als lege plek; stilte is nee (besloten) | — |
| Deelbare kaarten als Should in R2, met schuifruimte naar R3 | Akkoord (besloten) | — |
| Referral vanaf 5 januari achter een vlag | Akkoord, met vesting na de wachttijd van de eerste verzilvering en niet bij hetzelfde toestel-id (besloten) | — |
| Duels met een niet-squadlid | Alleen tussen 18-plussers, op gehaalde dagdoelen (besloten) | — |
| Belofte gerandomiseerd per squad | Vroeg op T − 6 van de eigen kalender met hernieuwingsaanbod, tegenover laat na het aprilvenster (besloten na ronde 2) | — |
| Rustperiode-arm | Besloten na ronde 2, aangescherpt na ronde 3: van de bonusstop tot en met het aprilvenster per kalender, met aparte uitweg, herhaalbericht op A-start, arm per persoon vanaf T − 6, overstap als uitstap, persoonlijk doorlopende punten voor minderjarigen en het uitbreidingscohort, bewakingsregel; lezing als non-inferioriteit met vier uitkomsten; onder voorbehoud van de advocaat (open vraag 18) | Oordeel advocaat 25 november; δ, gevoeligheidsgrens en Holm door de statisticus 25 november |
| Kalenderregel per vereniging | Besloten na ronde 2, aangescherpt na ronde 3: kalender per vereniging (per faculteit waar die verschilt) als enige bron; standaardkalender voor eenheden zonder vereniging (4.13); kalenders en standaardkalender bevestigen | 18 november (kalenders), 2 december (standaardkalender) |
| Schuifregel en schrapvolgorde | Besloten na ronde 3: uiterlijk 9 december, anders 4 januari; eerst arm B; januarivariant als voorstel (open vraag 28) | 2 december |
| Uitbreiding in plaats van open lancering | Besloten na ronde 2: op uitnodiging, hoogstens 3.000 MAU (werkhypothese) | — |
| Europlafonds op trede 1 (4.3) | Akkoord als werkhypothese, onder voorbehoud van de jurist | 25 november |
| Drempels, kalender en seed in de voorregistratie | Concept in `docs/pilot/voorregistratie.md`; vastleggen | 2 december |
| Prestatiechallenges in de rustperiode (challengevoorwaarden B7) | Voorstel: voor het onderzoekscohort geen individuele prestatiechallenges met een prijs van T + 1 tot en met het aprilvenster, in beide armen (open vraag 26) | 2 december |
| K in de go/no-go | Geen go/no-go meer; alleen uitnodigingen van gebruiker aan gebruiker (besloten) | — |
| Plafond per ambassadeur, drempels S1–S3, tentamendagen per week | Werkhypothesen in deze spec (plafond per ambassadeur van de founder); getallen bevestigen | 2 december |
| Terugkeervenster | Niet in de pilot; besluit na de pilot op data | Februari 2027 |

## Wijzigingslog

**Ronde 1 — 5 november 2026 (versie 1.1).** Herzien volgens de bindende besluiten in `docs/pitch/ronde-1-founder-reactie.md`. Maten en beslisregels staan voortaan in `docs/pilot/voorregistratie.md`.

- §1: pilot als verkennende pilot met één redelijk gepowerde vergelijking; lanceringsbesluit op operationele maten, los van de nawerkingshypothese; criteriatabel herschreven met go/no-go-cohort, stopregel, onafhankelijke fraudeschatting, kosten per actieve gebruiker per week, deelnemersbescherming; teamomvang drie bouwrollen (G1, G3, M4, M5, J1, GS11).
- §3: geïnformeerde deelname, instroomvragenlijst, e-mailnormalisatie, live aanwezigheid uit voor `16_17` (G4, J2, J5); eindscherm met dagdoel en weekprestatie voorop en rustig nachtsignaal (GS1, GS9); wachttijd en nummertype bij verzilvering (J3); squadprompt-experiment, hersamenstellen, meldknop (G2, GS2, JS11); duels op dagdoelen en buiten de squad alleen 18+ (GS4, JS3); extern ledental en verenigingsovereenkomst (J2, J5); trekkingen niet gebouwd (J4, S9); Belofte bij de stop van de doelbonus en laat na april (G1); nieuwe flows 3.13 tentamendag, 3.14 vragenlijsten en reflectie, 3.15 schadesignaal, 3.16 rustperiode (G1, G4, GS8).
- §4: puntenplafond 300 minuten per dag (was 480), nachtregel, tentamendag, wachttijd, rustperiode (G1, G4, GS9, J3); gespreide vrijgave met reservering, collectieve en symbolische beloningen, partnerverklaring (GS1, J3, JS6); streakherstel en hersamenstellen (GS2, GS5); instellingsanker, steekproef van 20, diskwalificatie, terugvalvariant (J2); alleen verdiende prijzen, leeftijdscontrole zonder kopie (J4, J5); referral- en ambassadeursregels (J3); afmelden voor het onderzoek, instellingsmail, grondslagen, bewaartermijnen, squad-id bij verwijdering, verwerkers (G4, J5, JS4, JS5); beheeromgeving zonder trekkingen en met steekproef, eerste verzilveringen, schadesignalen en ambassadeurs.
- §5: parametertabel bijgewerkt; vier factoren met seed, 16- en 17-jarigen in arm A en doorlopend, A/A-controle (G1, G2, G4, GS10, JS2).
- §6: claim zonder "bewijs van zelfdiscipline"; hogere drempels voor campus en CGNAT in plaats van overslaan; H5 losgemaakt van het puntenplafond; nieuwe H11 (toestel-id bij verzilvering); nieuwe 6.6 schadesignalen en stopregel en 6.7 onafhankelijke fraudeschatting met red-teamdag (J1, J2, J3, G4).
- §7: events toegevoegd en trekkingsevents verwijderd; KPI's herschreven (go/no-go-cohort, D30 buiten de tentamenweken, squadoverleving, K van gebruiker aan gebruiker, markeringen als wachtrijlast); experimentarmen en analyseregels voor H1–H3; nawerking in april; nieuwe 7.4 vragenlijsten (G1–G3, GS2, GS3, GS7, M4, M6, S3).
- §8–§10: scope en schrapvolgorde bijgewerkt (modus zonder punten Should, trekkingen Won't); open vragen 1–20 bijgewerkt, met nieuwe open punten over de sleutelhash van het instellingsadres, het einde van de rustperiode en de spanning tussen de rustperiode-arm en JS2; besluitentabel naar de stand na ronde 1.
- Nieuwe werkhypothesen gemarkeerd: hoogstens 3 tentamendagen per week; vrijgave per dag een zevende en de helft gereserveerd voor accounts met een anker; drempels S1–S3; rustperiode-aankondiging op 11 januari.

**Ronde 1, eindredactie — 5 november 2026 (versie 1.1).** Gelijkgetrokken met de aanvulling van de founder na de samenhangcontrole (`docs/pitch/ronde-1-founder-reactie.md`, 5 november), de voorregistratie en de juridische concepten.

- §1: lanceringsbesluit op 19 januari 2027, op data tot en met 18 januari 04:00; kosten per wekelijks actieve gebruiker per week met werkhypothese €0,06 (aanname); D30 buiten de tentamenweken gemeten in 1–14 februari, stopregel voor tweede tranche en opschaling; bouw van R1–R3 door de founder (M2, M4, M5, G3).
- §3.1, §3.14, §4.10, §7.4: aparte toestemming voor de welzijnsitems; telefoonverificatie en vragenlijsten voorlopig onder sub f (J5).
- §3.12, §4.12, §5: Belofte-aanbod in de vroege arm op 11 januari voor iedereen, niet per vereniging (G1).
- §3.16, §4.2, §5, §7.3, §8: rustperiode op de focusdagen 19 januari tot en met 31 maart 2027, vanaf 1 april punten voor iedereen; secundaire maat terugkeer in 25–31 maart; JS2 geldt voor de bonusarmen (G1, JS2).
- §4.3, §4.11: budgetsoort "eigen budget Rewarded" (post "pilotprijzen en catalogus", werkhypothese €1.500) met documentverwijzing naar het founderbesluit; B2B2C-beloningsbudget van 30% naast de 20% voor sponsoren; reservering alleen voor het instellingsanker.
- §4.6, §4.7, §4.9, §4.10, §6.7: identiteitsanker en instellingsanker als twee begrippen; geen sleutelhash van het instellingsadres; plafond per ambassadeur als werkhypothese (J2, J3).
- §6.6: eigenaar en termijn van de stopregel voor arm B (G4).
- §9, §10.5: open vragen 1, 3, 5, 16, 17, 18 en 20 bijgewerkt naar de besluiten van 5 november.

**Ronde 2 — 5 november 2026 (versie 1.2).** Herzien volgens de bindende besluiten in `docs/pitch/ronde-2-founder-reactie.md`, gelijk met het businessplan v3, het productplan v3 en de voorregistratie (ronde 2).

- Kalenderregel per instelling: nieuwe 4.13 met tentamenkalender per vereniging (T, N, A, tentamenperiodes), welke kalender iemand volgt, experimentpopulatie tegenover uitbreidingscohort, lanceringsbesluit na de laatste tentamenweek van het laatste pilotcohort; doorgevoerd in §1, 3.1, 3.7, 3.12, 3.14, 3.16, 4.2, 4.4, 4.6, 4.12, §5, §7 (besluit 1, G1, G-S14).
- Gecontroleerde uitbreiding in plaats van een open lancering; releasetabel, kaart-QR en beheeromgeving aangepast (besluit 2, S1).
- Rustperiode tot en met het aprilvenster, aprilchallenge gelijk en zonder individuele prestatiechallenges, uitweg "Weer punten verdienen" in het bericht en gescheiden van afmelden, squadregel, samenvoegen binnen de arm, uitstap per arm; tekst over JS2 vervangen door het oordeel van de jurist (3.16, 4.4, 4.10, §5, §7; besluit 3, G2, J2).
- Kostenmaat als pilottotaal, drie gescheiden posten met eigen voorraad, vast vrijgaveschema, voorraad naast gerechtigden, impliciete waarde per punt intern, "weekvrijgave verlagen" niet toegestaan, weekmaat alleen voor de uitbreiding (§1, 3.4, 4.3, §5, §7.2; G3, MF5, J10).
- Wekelijkse welzijnsmeting van twee items, stopregel met correctie en minimum-n, absolute schadegrens (3.1, 3.14, 6.6, 7.2, 7.4; G4, G-S7).
- Criteria: D7 als vaste lat met één herhaling, fraude op de bovengrens van het interval en als ondergrens, D30 in N, voorwaarden (c) en (d); ITT en IV, H3 binair, Belofte-hernieuwing en dosis, interactie verkennend, reactivering van squads, deelnamegraad per vereniging (§1, 4.12, 7.2, 7.3; MF1, G-S1–S6, G-S9, G-S3).
- Hersamenstelroute gepauzeerd buiten de tentamenperiodes (3.5, 4.4, §5; G-S6); nieuwe 4.14 competentiefeedback als Should (G-S13).
- Fraude: H12, contact via het instellingsadres met herbevestiging, criteria per oordeel, toestelvergelijking en oefensessie in de prijssteekproef, red-teamscenario met één laptop (4.6, 4.7, 4.11, 6.3, 6.7; J1, J4).
- "Focustijd die telde" met verificatieniveau in het bestuursdashboard en de lintregel (4.6; J3); supportlabel welzijn als gezondheidsgegeven, S1–S3 als profilering, FG-herbeoordeling (4.10, 6.6; J8, J9); Plus-nepdeur alleen op het web (§8; J12).
- Bouw: twee bouwrollen in tranche 1, codebevriezing en verplichte review vóór de A/A-controle op de echte code (§1, §5, §8; MF2, G-S12); schrapvolgorde aangepast.
- Nieuwe open vragen 21–25; nieuwe werkhypothesen en voorstellen van het productteam gemarkeerd (definitie N, kalender zonder vereniging, prijsperiode per kalender, H12 ≥ 3 accounts, competentiefeedback, wekelijkse meting tot en met A).

**Ronde 2, eindredactie — 5 november 2026 (versie 1.2).** Gelijkgetrokken met de voorregistratie, de juridische concepten en de besluiten in `docs/pitch/ronde-2-founder-reactie.md` na een onafhankelijke samenhangcontrole. Kopregel en ronde-2-log gedateerd op 5 november, de datum van de founder-reactie.

- 4.13: T is de zondag waarmee de laatste reguliere tentamenweek eindigt, zodat de bonusstop (04:00 op T + 1) altijd een maandag is en samenvalt met het einde van de prijsperiode (besluit 1).
- §5 Transparantie: de verliesarm wordt getoetst door de advocaat (vraag 2, direct verstuurd), niet door de jurist; bij een negatief oordeel op vraag 3 vervalt de rustperiode-arm (niet arm B) en verdient iedereen doorlopend punten (J7, besluit 3).
- 3.16 stap 6, 4.6, open vraag 26, 10.5: geen individuele prestatiechallenges voor het onderzoekscohort in de hele rustperiode (T + 1 tot en met het aprilvenster), zoals challengevoorwaarden B7; **voorstel**, ter bevestiging door de founder.
- 3.16 stap 3, 4.9, §5: referral in de rustperiode vest pas na het aprilvenster of na de rustuitstap, zoals gebruiksvoorwaarden §11.2 (besluit 3).
- 4.6: het identiteitsanker telt per prijsweek vanaf het moment van bevestigen, ook in de week van bevestigen, niet terug (challengevoorwaarden A4.3; J11).
- 3.1 stap 8, 3.14, open vraag 27: wekelijkse meting en welzijnsitems ook voor 16- en 17-jarigen die de aparte toestemming geven (G4, "voor iedereen"); de uitsluiting uit privacyverklaring §6.1.3 alleen als de advocaat dat bij vraag 9a vraagt; geen gevolg voor het minimum van 40 per arm (lezing eindredactie).
- 7.1: `daily_goal_met`, `daily_goal_missed` en `squad_day_evaluated` om 05:45 over focusdag D (productplan §10; architectuur §6.1, §14 #22).
- 4.10: verwijzing naar de aanzet van het verwerkingsregister en de DPIA-checklist in `docs/dpia/verwerkingen.md` (J8, J9). Ronde-2-log: "publieke lancering" vervangen door "open lancering" (besluit 2).
- 7.2: KPI "Interesse in Plus" met drempel < 5% van de D30-actieven en de noemer uit voorregistratie §6.2; "gezien" als secundaire maat (S7).
- §1, 7.2, open vraag 1: venster van voorwaarde (c) per kalender: 1–14 februari, of N als dat venster overlapt met de laatste tentamenweek of de herkansingen (uitwerking van besluit 1, voorregistratie open punt 2).

**Ronde 3 — 5 november 2026 (versie 1.3).** Herzien volgens de bindende besluiten in `docs/pitch/ronde-3-founder-reactie.md` (gedateerd 5 november), gelijk met het businessplan v4, het productplan v4, de voorregistratie (ronde 3), het UX-ontwerp (versie 1.4) en de architectuur (versie 1.4).

- §1, 7.2, 7.3, open vraag 1: H3b als steigertoets met non-inferioriteit (δ werkhypothese 10 procentpunten), gevoeligheidstoets, Holm en vier uitkomsten die (f) bepalen; januari-actieven op T − 13 tot en met T − 7, (c) en (d) op de doorlopende arm; D7 op dag 6–8 (G-MF1, G-MF2, G-S8, G-S9).
- §1, 4.13, §5, §8: tentamenkalender per vereniging, per faculteit waar die verschilt, als enige bron van T, N en A; herkansingsdagen in A buiten de nawerkingsmaat; standaardkalender voor eenheden zonder vereniging (vervangt de kalender van de instellingsmail); geen vaste data meer in de parameters; A/A-controle met twee kalenders met een verschillende T (G-MF3, G-S6).
- §1, §8, 10.5: schuifregel (uiterlijk 9 december, anders 4 januari met een verkort seizoen) en schrapvolgorde (eerst arm B) (G-MF3, investeerder MF2).
- 3.16, 4.2, 4.4, §5, 7.1: rustperiode-arm per persoon vanaf T − 6; overstap na T − 6 als `rest_period_exit` met bron `squad_switch`; persoonlijk doorlopende punten voor 16- en 17-jarigen en het uitbreidingscohort in een rustsquad (vervangt de squadregel); herhaalbericht op A-start; bewakingsregel met de vlag uit bij overschrijding. De stappen van 3.16 zijn hernummerd (oude stap 6 is 7, oude stap 7 is 9) (G-S1, G-S2, jurist should-fix 3 en 4).
- 3.1 stap 8, 3.14, §5, 7.4, open vraag 27: weekitems voor 16- en 17-jarigen alleen over studietijd en afleiding zolang vraag 9a niet positief is beantwoord, met parameter `weekly_items_16_17`; motivatie-items en niet-beloond studeren in N en na A (jurist should-fix 8, G-S3).
- 3.12, 4.12, §5, 7.1: tweede Belofte-aanbod in de vroege arm op A-start − 7 (G-S10).
- 4.6, 4.10, 6.7, §8, open vraag 17: instellingsanker uniek per adres met `institution_email_hash` (HMAC, unieke index) vóór 4 januari, herbevestiging van bestaande ankers en bewaring na blokkade als voorstel juridisch team, contact in de steekproef via HMAC-vergelijking (jurist should-fix 1).
- 6.3, open vraag 23: H12 op overlap over de hele sessieduur met de werkhypothese van de jurist; red-teamdag met het gespreide scenario en één instellingsadres voor tien accounts (jurist should-fix 2).
- 6.6, 4.11, 7.2: schadesignalen per code; schadegrens 2% als werkhypothese tot de ijking, met beoordelingscriteria (voorstel productteam); bewakingsregel rustarm (G-S5, G-S1).
- 6.7, 4.11, 7.1, 7.2: één fraudegrens en het uitbreidingscohort als eigen stratum; pilotbeheerder onafhankelijk met melding van een belang per item; gerichte ambassadeurssteekproef van vijf accounts vóór elke uitbetaling, geen uitbetaling zolang het anker niet uniek is (4.9); Rewarded vraagt het externe ledental zelf op vóór de aprilchallenge (3.7, 4.6) (jurist should-fix 5, 6, 7).
- 7.1, 7.2: nieuwe events `institution_email_rejected`, `institution_email_reconfirmed`, `sample_interest_declared`, `rest_period_flag_off`, `catalog_empty_seen`; nieuwe KPI's gerechtigden zonder verzilvering, gemengde rustsquads, bewakingsregel; reactivering per rustperiode-arm (G-S4, G-S11).
- §8 "Na de pilot": Android UsageStats als eerste, kleinere native stap vóór iOS, afhankelijk van (f) (investeerder S7).
- De trekkingsmodule blijft uit de bouw; er verandert hier niets aan (3.9, §8).
- Nieuwe open vragen 28–31; nieuwe voorstellen van het productteam gemarkeerd (gevoeligheidsvenster, rangorde van de uitkomsten, januarivariant, bewakingsgrens, beoordelingscriteria schadegrens, momenten tweede Belofte-aanbod en meting na A, `weekly_items_16_17`).

**Ronde 3, eindredactie — 5 november 2026 (versie 1.3).** Gelijkgetrokken met het businessplan v4, het productplan v4, de voorregistratie (ronde 3) en de juridische concepten na een onafhankelijke samenhangcontrole, volgens `docs/pitch/ronde-3-founder-reactie.md`. Kopregel en ronde-3-log gedateerd op 5 november, de datum van de founder-reactie.

- §1: de native rol heet "senior engineer native (eerst Android UsageStats, daarna iOS)", vanaf tranche 2 en niet zolang de native bouw is uitgesteld (investeerder S7; businessplan §10).
- 3.16 stap 2, 4 en 6, 4.10 en §8: één letterlijke knoptekst voor de uitweg, "Ik wil weer punten verdienen", gelijk met de voorregistratie, de gebruiksvoorwaarden en het besluit van de founder (jurist should-fix 4). Het herhaalbericht gebruikt dezelfde knop.
- 7.2: D7 niet meer "per registratieweekdag"; de founder koos dag 6–8 in plaats daarvan (G-S8). De deelnamegraad per vereniging (KPI) uitdrukkelijk onderscheiden van de challengescore van 4.6.
