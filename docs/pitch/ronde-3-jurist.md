# Pitchronde 3 — Beoordeling jurist en fraude-expert

*Beoordelaar: jurist (kansspelrecht, consumentenrecht, AVG, betaaldiensten) en fraude-expert. Onafhankelijk van het team dat de plannen schreef. Datum: 4 november 2026 (de stukken dragen 5 november). Ronde 3 van 3.*

*Gelezen: `docs/pitch/pitch.md` (v3), `docs/01-businessplan.md` (v3), `docs/02-productplan.md` (v3), `docs/pitch/README.md`, alle `ronde-1-*.md` en `ronde-2-*.md`, `docs/research/02-businessmodel-juridisch-unit-economics.md` en `docs/research/09-verificatietechniek.md` volledig, en uit `docs/research/07-architectuur.md` §3 (domeinmodel), §4 (sessieprotocol en heuristieken), §5, §6 (ranglijst en steekproef), §7 (trekkingen), §10 (beveiliging en AVG) en open vraag 26. Om na te gaan of de should-fixes uit ronde 2 echt zijn verwerkt, las ik ook: `docs/juridisch/ambassadeursovereenkomst.md` volledig, `challengevoorwaarden.md` A3–A14 en B7, `gebruiksvoorwaarden.md` §6–§9, `vragen-advocatenopinie.md` §1, vragen 2 en 3 en het overzicht, en `docs/pilot/voorregistratie.md` §7 en §11.*

*Dit is geen formeel juridisch advies en het vervangt de advocatenopinie niet.*

## Oordeel: GO

In ronde 2 gaf ik GO zonder must-fixes. Van mijn twaalf should-fixes zijn er tien in de plannen, de voorwaarden en het datamodel verwerkt, en goed. De andere twee (rechtspersoon, vragen 2 en 3 naar de advocaat) zijn acties met een datum die ik op 4 november nog niet kan controleren. De wijzigingen na ronde 2 heb ik juridisch opnieuw getoetst: de rustperiode tot en met april, de gecontroleerde uitbreiding, de aprilchallenge en de kalender per instelling. Geen daarvan maakt de pilot ongeldig of het product juridisch onhoudbaar, zolang de poorten die de founder zelf zette blijven staan. Mijn oordeel blijft dus GO.

Ik moet wel iets rechtzetten. Het identiteitsanker is de kern van de oplossing van J2 (ronde 1). Maar één instellingsmailadres kan een onbeperkt aantal accounts verankeren, want Rewarded bewaart van dat adres alleen het domein (architectuur open vraag 26: "Restrisico: één instellingsadres kan meer dan één account verankeren"). Dat stond er in ronde 2 ook al. Ik had het toen moeten zien en heb het gemist. Daarom maak ik er volgens de regels van deze ronde geen must-fix van. Het is wel de belangrijkste should-fix, en mijn GO hangt eraan (zie "Wat GO breekt"). De oplossing kost een middag werk.

## Uit de vorige ronde

In ronde 2 had ik geen must-fixes. De should-fixes:

| # | Should-fix ronde 2 | Status | Toelichting |
|---|---|---|---|
| 1 | Samenspanning met echte leden: zes accounts op één laptop | **Grotendeels opgelost** | Verwerkt in: H12, de toestelvergelijking en de oefensessie in de prijssteekproef, het red-teamscenario (voorregistratie §7.4), de letterlijke diskwalificatiegrond (challengevoorwaarden A9.1) en het verbod (gebruiksvoorwaarden §8.1). Wat overblijft: H12 is zo gedefinieerd dat het te omzeilen is (should-fix 2). Dat komt door mijn eigen voorstel. |
| 2 | Voorwaarden voor de rustperiode-arm | **Opgelost** | De uitweg staat in het bericht zelf (gebruiksvoorwaarden §6.4). "Weer punten verdienen" en "uit het onderzoek stappen" zijn gescheiden (§6.8, `rest_exit_at`). §6.1 zegt nu eerlijk dat het lot bepaalt of je punten verdient. De drempel voor differentiële uitstap staat als open punt bij de statisticus (voorregistratie §11.5). |
| 3 | "Geverifieerd" in B2B | **Opgelost** | "Focustijd die telde (Rewarded zichtbaar op het scherm)" staat in pitch, businessplan §8 en het dashboard. `verification_level` is verplicht in het responseschema. Er is een lintregel. |
| 4 | Fraudebeslisregel | **Opgelost** | De bovengrens van het 95%-interval moet onder 5% liggen. Er zijn criteria per oordeel (voorregistratie §7.2). De schatting wordt gerapporteerd als ondergrens. Contact loopt via herbevestiging van het instellingsadres. Eén inconsistentie in de uitbreiding staat in should-fix 5. |
| 5 | Ambassadeurscontract | **Opgelost in concept** | Het concept bevat alles wat ik vroeg: 18+, geen geldclaims, herkenbare reclame, geen bestuurslid, uitbetaling na de steekproef, terugvordering met hoor en wederhoor, en de fiscale route als open vraag 14b. De voorwaarde "niet verdacht in de steekproef" is in de praktijk vrijwel nooit getoetst (should-fix 1). |
| 6 | Rechtspersoon vóór 18 november | **Gepland, niet te controleren** | Staat als harde voorwaarde in het businessplan (§9) en de pitch. Er is nog geen offerte van de advocaat. |
| 7 | Vragen 2 en 3 nu naar de advocaat | **Gepland, niet te controleren** | Als DIRECT gemarkeerd, met zending 1 voorgesteld voor 6 november. Valt de rechtspersoon later, dan gaat de zending op naam van de founder. Dat is verstandig. |
| 8 | Supportlabel welzijn als gezondheidsgegeven | **Opgelost** | Art. 9 lid 2 met een te kiezen uitzondering, toegang alleen voor `assigned_to`, tekst weg na 90 dagen. S1–S3 staan als profilering in de DPIA-aanzet. |
| 9 | FG-plicht herbeoordelen | **Opgelost** | Bij de start van de uitbreiding en bij het eerste B2B-contract, opgenomen in de DPIA-checklist. |
| 10 | Catalogusschaarste | **Opgelost** | De catalogus toont de voorraad naast het aantal gerechtigden (`eligible_users`). De schaarste staat in de onboarding. Er zijn aparte posten voor februari–april. Het voorbehoud bij A7 (gedeelde eerste plaats) staat eerlijk in de tekst. |
| 11 | Kleine tekstpunten | **Opgelost** | Het anker per week staat in A4.3, spec en architectuur. §8.3 en A8.3 zijn gelijkgetrokken. |
| 12 | App stores later | **Opgelost** | De Plus-nepdeur bestaat alleen op het web (de vlag `plus_door` zit niet in een app-build). Het Google Play-beleid wordt vóór de Android-bouw gelezen. |

## Wat ik toetste aan de wijzigingen na ronde 2

**Rustperiode tot en met het aprilvenster (vraag 3f aan de advocaat).** Mijn oordeel uit ronde 2 blijft staan, ook bij de langere duur. Wat de arm houdbaar maakt, is niet de lengte maar de uitweg zonder verlies, met één tik, die het onderzoek niet beëindigt. Daarmee is er geen kansbepaling waarop de deelnemer geen overwegende invloed heeft (art. 1 onder a Wok). En de uitweg is eerlijk uitgelegd, dus het is ook geen misleidende omissie (art. 6:193d BW).

De langere duur vraagt wel twee dingen:

1. Het bericht dat iemand in de rustperiode zit, komt zeven dagen vóór de start. De aprilweken liggen daarna tien tot twaalf weken verder. Herhaal de uitweg daarom aan het begin van het aprilvenster, in dezelfde feitelijke taal en zonder aandringen (should-fix 4).
2. Het uitbreidingscohort hoort niet in de rustperiode (should-fix 3).

**Aprilchallenge.** Juridisch gelijk aan de januarichallenge: verdiend op deelnamegraad, voor beide armen gelijk (A4.7, A14.4), met dezelfde terugvalvariant (A13). Eén zwak punt in A14.3 staat in should-fix 7.

**Kansspelbelasting.** Zonder trekkingen speelt ze geen rol. Art. 3 Wet KSB rekent alleen prijzen van kansspelen (gecontroleerd in ronde 2). Bij de controle stuitte ik op een verschil. Rapport 02 noemt 37,8% vanaf 1 januari 2026. De BWB-tool gaf mij voor art. 5 Wet KSB alleen de toestand van 1 januari 2025: "De belasting bedraagt 34,2 percent", factor 100/65,8. Ik kon niet nagaan of er een latere toestand bestaat. Dat is irrelevant zolang trekkingen uit staan, maar het percentage in rapport 02 is dus **niet door mij bevestigd**. Laat de fiscalist het controleren als trekkingen ooit terugkomen.

**Wok art. 1.** De tool gaf opnieuw alleen de aanhef van lid 1 (toestand 2022-10-01, "Behoudens het in Titel Va van deze wet bepaalde is het verboden:"), zonder de onderdelen. De tekst van onderdeel a heb ik dus weer niet primair gelezen. Ik ga uit van de weergave in rapport 02, die op Stb. 1964, 483 en ECLI:NL:RVS:2021:2 rust.

## Scoretabel

| Criterium | R1 | R2 | R3 | Motivering (vanuit mijn rol) |
|---|---|---|---|---|
| Probleem en doelgroep | 7 | 7 | 7 | Ongewijzigd. De bescherming van 16- en 17-jarigen is consequent doorgevoerd, ook in de nieuwe onderdelen: geen rustperiode, en de weekitems alleen met aparte toestemming. |
| Oplossing en gedragseffect | 6 | 6 | 6 | Buiten mijn vak. Er wordt niet meer overclaimd: de claim in de voorwaarden (§3) en die in de B2B-copy zijn nu gelijk. |
| Beloningsmodel | 5 | 7 | 7 | Legaal en uitlegbaar: geen cash-out, de soortregel staat in de database, geen trekkingen, en arm A en B hebben hetzelfde maximum. Geen 8, omdat het anker dat de verenigingsprijs en de ambassadeursvergoeding moet beschermen niet uniek is (should-fix 1). |
| Groei | 5 | 7 | 7 | Uitbreiding alleen op uitnodiging verkleint het fraude- en reputatierisico flink. Het ambassadeurscontract ligt er. Zolang het anker niet uniek is, is de ambassadeursvergoeding de makkelijkste plek om geld weg te halen. |
| Unit economics | 5 | 6 | 6 | De posten zijn gescheiden en begrensd, en de dekkingsregel dwingt ze af. Fraudeverlies blijft binnen het budget. Geen nieuw juridisch punt. |
| Verdediging | 5 | 5 | 5 | Compliance is geen gracht (de pitch zegt dat nu zelf). De eerlijke B2B-claim helpt in de verkoop, maar is geen drempel voor een concurrent. |
| Uitvoerbaarheid | 5 | 6 | 6 | Tussen 4 november en 2 december moeten zes concepten, twee zendingen, de DPIA, de red-teamdag, de rechtspersoon en de kalenders af. Dat is zwaar, maar elke vraag heeft een standaarduitkomst. Er is nog geen offerte van de advocaat en de bedragen staan in invulkaders. |
| Risico's | 6 | 8 | 8 | Alle juridische showstoppers hebben een poort met een standaarduitkomst. Nog niet benoemd: het niet-unieke anker, de onafhankelijkheid van de pilotbeheerder, en dat het uitbreidingscohort in een experimentele conditie belandt. |

## Must-fix

Geen. Er is geen nieuw punt dat ik in ronde 2 redelijkerwijs niet kon zien en dat de pilot ongeldig of het product onhoudbaar maakt. Het zwaarste punt (should-fix 1) kon ik in ronde 2 zien. Ik zet het daarom bovenaan de should-fixes en koppel mijn GO eraan.

## Should-fix

**1. Maak het identiteits- en instellingsanker uniek per adres.** Vóór 4 januari; hoogste prioriteit.

- *Wat er mis is.* Van de instellingsmail bewaart Rewarded alleen `institution_domain` en `institution_verified_at`, geen hash (architectuur §10.4 en open vraag 26; productplan §4). Eén student met één @uu.nl-adres kan dus tien of veertig accounts met losse Gmail-adressen verankeren.
- *Wat erdoor openligt.*
  - **De teller van de verenigingsprijs.** Het identiteitsanker was mijn oplossing voor J2.
  - **De ambassadeursvergoeding.** Het instellingsanker is daar verplicht, het bedrag is tot €200 per maand, en het is de enige geldstroom naar studenten.
  - **De gereserveerde voorraad** (`anchor_only`). De telefoonverificatie bij verzilvering beperkt die schade wel.
- *Waarom de controles dit niet zien.* De voorgestelde controle "de steekproef controleert de instellingsmail" ziet hergebruik niet. De fraudeur bevestigt bij herbevestiging telkens hetzelfde adres, en omdat er niets bewaard wordt, ziet niemand dat het hetzelfde adres is. Het criterium "instellingsdomein met een overlappend patroon" (voorregistratie §7.2) helpt niet: alle Utrechtse studenten delen uu.nl.
- *Oplossingsrichting.*
  - Bewaar `institution_email_hash = HMAC(genormaliseerd adres, pepper_inst)` met een unieke index: één adres, één account. Dat is dezelfde vorm als `email_norm_hash` en `phone_hash`.
  - Voor de AVG is dit pseudonimisering, met gerechtvaardigd belang (fraudebestrijding). Het is noodzakelijk en proportioneel: zonder hash werkt het anker niet. Dataminimalisatie (art. 5 lid 1 sub c AVG) verbiedt het dus niet, maar vraagt het juist. Leg het zo vast in de DPIA.
  - Bewaartermijn: zolang het account bestaat. Daarna net als `blocked_phone_hash`, alleen bij een bevestigde blokkade.
  - Pas open vraag 26, privacyverklaring §8.4 en gebruiksvoorwaarden §8.4 aan ("we bewaren een versleutelde vingerafdruk van het adres, zodat één adres maar één account kan bevestigen").
  - Neem in het red-teamscenario op: "één instellingsadres, tien accounts".

**2. H12 meet het verkeerde: gelijktijdigheid, niet gelijke starttijden.**

- *Wat er mis is.* H12 markeert overlappende sessies per (`ip_hash`, `ua_class`) als ze binnen 120 seconden starten (architectuur §4.5, voorregistratie §7.5). Dat tijdvenster kwam uit mijn eigen voorstel in ronde 2, en het is te smal. Wie zes profielen op één laptop draait, start ze om de drie minuten en ontloopt H12 volledig.
- *Oplossingsrichting.*
  - Laat H12 kijken naar het aantal accounts met tegelijk lopende sessies vanaf dezelfde `ip_hash` en `ua_class`, over de hele duur van de sessies, ongeacht wanneer ze startten. Een maat die werkt: minstens 3 accounts met minstens 40 minuten overlap op minstens 2 dagen per week.
  - Kijk daarbij naar het `desktop-*`-deel apart. Twintig studenten in de UB zitten vooral op telefoons met wisselende `ua_class`.
  - Pas de tekst in challengevoorwaarden A8.2 punt 5 en gebruiksvoorwaarden §8.2 aan ("vrijwel tegelijk beginnen" wordt "tegelijk lopen").
  - Laat de red-teamdag ook het gespreide scenario draaien.

**3. Het uitbreidingscohort hoort niet in een experimentele conditie.**

- *Wat er mis is.* Wie na de start bij een rustsquad komt, ook iemand die niet aan het onderzoek meedoet, verdient tot na april geen punten (gebruiksvoorwaarden §6.4; vraag 3e). Juridisch is dat met de uitweg nog te verdedigen. Ethisch en onder de AVG niet.
- *Waarom.* Deze persoon heeft niet ingestemd met deelname aan een gerandomiseerd onderzoek. Toch krijgt hij een nadeel dat alleen voor de meting bestaat, en zijn gedrag beïnvloedt een experimentele eenheid. Het mechanisme om dat te voorkomen bestaat al: minderjarigen krijgen persoonlijk `continue` (architectuur §3.4).
- *Oplossingsrichting.* Geef leden uit het uitbreidingscohort in een rustsquad persoonlijk doorlopende punten. Rapporteer het aandeel van zulke gemengde squads, en sluit ze in een gevoeligheidsanalyse uit. Dat is goedkoper dan wachten op het antwoord van de advocaat op 3e.

**4. Herhaal de uitweg aan het begin van het aprilvenster.** Het rustperiodebericht komt zeven dagen vóór de start. Het aprilvenster begint tien tot twaalf weken later. Toon aan het begin van het aprilvenster één keer hetzelfde feitelijke bericht met de knop "Ik wil weer punten verdienen". Geen herinneringsreeks en geen aandringen; dat zou de analyse sturen. Leg vooraf in de voorregistratie vast dat dit bericht er komt en wanneer, zodat het een vast onderdeel van de behandeling is. Zo zegt niemand in april dat hij de uitweg niet kende, juist in de weken waarin hij de app het meest nodig had.

**5. Eén fraudegrens, niet twee.**

- *Wat er mis is.* De stukken noemen twee grenzen. Het lanceringsbesluit en "wat ons van gedachten doet veranderen" zeggen: een bovengrens van 5% of meer betekent geen uitbreiding in dat kanaal. De rij "Gecontroleerde uitbreiding" (pitch en businessplan §7) zegt: geen kanaal met geschatte fraude boven 10%.
- *Oplossingsrichting.* Kies één regel. Bijvoorbeeld: in de uitbreiding stopt een kanaal als de bovengrens 5% of meer is. Wordt het toch 10%, zeg dan of dat over de puntschatting gaat en waarom de lat lager mag. Leg ook vast dat het uitbreidingscohort een eigen stratum in de wekelijkse steekproef is. Anders wordt het onderzoekscohort met nieuwe accounts verdund.

**6. De pilotbeheerder moet onafhankelijk zijn.**

- *Wat er mis is.* De pilotbeheerder (freelance of student-assistent) doet de wekelijkse steekproef en de fraudewachtrij, en leest mee bij diskwalificatie (A9.2). Er staat nergens dat hij geen lid of bestuurslid is van een deelnemende vereniging. Voor ambassadeurs staat dat er wel. Een student-assistent die de steekproef doet voor zijn eigen vereniging maakt de belangrijkste go/no-go-maat besmettelijk, en de diskwalificatie aanvechtbaar.
- *Oplossingsrichting.* Leg vast: geen lid van een deelnemende vereniging, geen ambassadeur, geen deelnemer, en melding van belangenverstrengeling per item. Neem dat op in de geheimhoudingsverklaring of in de verwerkersovereenkomst (vraag 8k).

**7. Gerichte steekproef vóór de ambassadeursvergoeding.**

- *Wat er mis is.* De voorwaarde "niet verdacht in de steekproef" (ambassadeursovereenkomst §4.2) toetst bijna niets. De wekelijkse steekproef trekt 30 accounts uit honderden, dus de kans dat een account van een bepaalde ambassadeur erin zit, is klein.
- *Oplossingsrichting.* Trek vóór elke uitbetaling per ambassadeur een steekproef van vijf meegetelde accounts (of allemaal bij minder dan vijf), met dezelfde lichte controle plus de toestelvergelijking uit de prijssteekproef. Een tweede punt in dezelfde richting zit in challengevoorwaarden A14.3: daar kan een bestuur kiezen of het een nieuw extern ledental aanlevert. Het zal dat alleen doen als het getal lager is. Maak het daarom geen keuze van de vereniging: Rewarded vraagt vóór de aprilchallenge bij elke vereniging het actuele externe getal op.

**8. Wekelijkse welzijnsitems bij 16- en 17-jarigen: wacht echt op vraag 9a.**

- *Wat er mis is.* De twee weekitems (stress, ervaren druk) zijn waarschijnlijk gezondheidsgegevens (art. 4 lid 15 AVG). Ze lopen ongeveer vijf maanden.
- *Waarom.* De grens van 16 jaar in art. 5 UAVG gaat over toestemming als grondslag onder art. 6. Of een 16-jarige zelf uitdrukkelijke toestemming kan geven onder art. 9 lid 2 sub a, is voor dit doel **niet geverifieerd**. De advocaat moet het bevestigen.
- *Oplossingsrichting.* De standaardregel nu is "zonder bezwaar van de advocaat voor iedereen". Draai die om: zonder positief antwoord op 9a vóór 1 december krijgen 16- en 17-jarigen alleen de vragen over studietijd en afleiding. Zo is het bij elke andere poort ook geregeld: stilte is de voorzichtige kant.

**9. Kleinigheden.**

- De pitch noemt zes concepten bij de advocaat "uiterlijk 18 november". De vragenlijst stuurt het ambassadeurscontract ook in zending 2. Dat klopt. Maar §4.6 van dat contract laat de fiscale route open, en de standaarduitkomst ("geen betaalde ambassadeurs zonder fiscale route en getekende overeenkomst") staat alleen in de vragenlijst. Zet die regel ook in het businessplan §9.
- Het is goed dat de pitch de inzetlaag nog steeds "visie" noemt. Laat hem uit materiaal voor investeerders zolang er geen opinie, geen Ksa-toets, geen akkoord van de betaaldienstverlener en geen native verificatie zijn (rapport 02 §7).

## App-storeregels voor later

Er is niets nieuws. De punten uit ronde 2 staan in de plannen. Ze worden pas relevant met native:

- Apple 5.3.1–5.3.2: de organisator is Rewarded, en de regels staan in de app met de zin dat Apple er niets mee te maken heeft.
- Apple 4.10: geld gekoppeld aan Screen Time, eerst voorleggen.
- Apple 3.1.1: Plus via in-app purchase.
- Google Play: het beleid voor contests met prijzen in natura en `PACKAGE_USAGE_STATS`, op de primaire pagina's. Rapport 09 kon die niet openen, en ik ook niet.

## Wat beslist in de voorwaarden moet staan (stand ronde 3)

Gebruiksvoorwaarden en challengevoorwaarden dekken nu wat ik in ronde 1 vroeg. Na deze ronde komt erbij:

- het unieke anker (should-fix 1), in gebruiksvoorwaarden §8.4 en challengevoorwaarden A4.3;
- H12 als gelijktijdigheid (should-fix 2), in gebruiksvoorwaarden §8.2 en A8.2;
- doorlopende punten voor het uitbreidingscohort in een rustsquad (should-fix 3), in gebruiksvoorwaarden §6.4;
- het herhaalbericht in april (should-fix 4), in gebruiksvoorwaarden §6.4;
- de onafhankelijkheid van de pilotbeheerder (should-fix 6), in challengevoorwaarden algemeen punt 2 en A9.2.

## Vragen die ik in de partnervergadering zou stellen

1. Hoeveel accounts kan één @uu.nl-adres vandaag verankeren? En waarom is dat getal niet 1?
2. Wat ziet H12 als een bestuurslid zes profielen om de drie minuten start?
3. Is zending 1 met vragen 2 en 3 de deur uit? Naar welk kantoor, en met welke offerte?
4. Wie is de pilotbeheerder, en is die lid van een deelnemende vereniging?
5. Wat ziet een nieuw lid van een uitgenodigde vereniging dat in februari bij een rustsquad komt? En waarom zou die persoon in een experiment zitten waarmee hij niet heeft ingestemd?
6. Hoeveel deelnemers in de rustarm verwacht je dat in april de knop "weer punten verdienen" gebruiken, en vanaf welk aandeel is H3b niet meer te lezen?
7. Geldt in de uitbreiding 5% of 10% als fraudegrens per kanaal, en voor welke maat?
8. Hoeveel accounts van een ambassadeur zijn vóór de eerste uitbetaling echt gecontroleerd?

## Wat GO houdt en wat GO breekt

GO blijft staan als vóór de prijsperiode van 4 januari blijkt:

- dat het instellingsanker uniek is per adres (should-fix 1), en dat de red-teamdag het scenario "één adres, tien accounts" en het gespreide laptopscenario heeft getest;
- dat er een rechtspersoon is en een getekende opdracht aan de advocaat;
- dat de DPIA ondertekend is vóór de eerste uitnodiging;
- dat de pilotbeheerder geen belang heeft bij een deelnemende vereniging.

GO vervalt als:

- een door de founder gezette poort onder tijdsdruk wordt omgezet: uitnodigingen zonder DPIA, een hoofdprijs zonder positieve opinie, of arm B of de rustperiode zonder antwoord van de advocaat;
- of als de ambassadeursvergoeding wordt uitbetaald terwijl het anker niet uniek is.

## Verificatie en beperkingen

- **Gecontroleerd met de nl-gov-data-tools (BWB), deze sessie:**
  - Art. 1 Wok (BWBR0002469, toestand 2022-10-01): alleen de aanhef van lid 1 en de leden 2–3; de onderdelen van lid 1 gaf de tool niet terug.
  - Art. 5 Wet op de kansspelbelasting (BWBR0002359): de tool gaf alleen de toestand van 2025-01-01, met 34,2% en factor 100/65,8. Dat wijkt af van de 37,8% voor 2026 in rapport 02. Een latere toestand heb ik niet kunnen ophalen. Niet relevant zolang trekkingen uit staan.
- **Uit vakkennis, niet nagelezen:** art. 6:193c, 6:193d, 6:233 BW; art. 4 lid 15, 5, 9, 21 en 35 AVG; art. 5 UAVG (gecontroleerd in ronde 1); de toepassing van art. 9 lid 2 sub a op 16- en 17-jarigen.
- **Niet te controleren op 4 november:** of zending 1 naar de advocaat is verstuurd, of de rechtspersoon bestaat, en de uitkomst van de red-teamdag (voorregistratie §7.4 staat nog op "in te vullen").
