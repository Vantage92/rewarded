# Rewarded — Privacyverklaring (concept voor de advocaat)

*Concept van het juridische team, stand 5 november 2026, versie 0.4 (ronde 3). **Dit is geen juridisch advies.** Dit is een concepttekst die de advocaat en de opsteller van de DPIA nog moeten beoordelen. Hij geldt pas als de DPIA is ondertekend (uiterlijk 1 december 2026, vóór de eerste uitnodiging; founder-reactie ronde 1, J5) en de founder hem vaststelt. Gebaseerd op `docs/pitch/ronde-1-jurist.md` (must-fix 5 en should-fix 4 en 5), `docs/pitch/ronde-2-jurist.md` (should-fix 1, 2, 4, 5, 6, 8 en 9), de besluiten in `docs/pitch/ronde-1-founder-reactie.md` (J5, JS4, JS5, G4, GS3, en de aanvulling van 5 november) en `docs/pitch/ronde-2-founder-reactie.md` (besluiten 1–3; J1, J2, J4, J5, J6, J8, J9; G4; MF3, MF5), `docs/pitch/ronde-3-jurist.md` (should-fix 1, 3, 5, 6, 7 en 8) en `docs/pitch/ronde-3-founder-reactie.md` (jurist: alle should-fixes; gedragswetenschapper MF3, S1, S2 en S3), `docs/research/05-productspecificatie.md` §4.10 en §6, en `docs/research/07-architectuur.md` §10.4–10.7.*

*Leeswijzer. De tekst richt zich tot de gebruiker en is geschreven voor een student van 17. Een privacyverklaring moet kloppen met wat de app echt doet; waar de bouw nog moet veranderen om dit waar te maken, staat dat in de bijlage. Markeringen: **aanname**, **voorstel**, **werkhypothese**, **niet geverifieerd**, **vraag advocaat** (genummerd zoals in `vragen-advocatenopinie.md`). Tussen vierkante haken staat wat nog moet worden ingevuld. "Het aprilvenster" is de tentamenperiode van je instelling in het voorjaar van 2027 (gebruiksvoorwaarden §1.5).*

---

## In het kort

- We verzamelen zo weinig mogelijk: wanneer je sessies begonnen en stopten, of de app zichtbaar was, je squad en je vereniging. Geen locatie, geen camera, geen contacten, geen externe analyse- of advertentiediensten.
- Je geboortedatum bewaren we niet, alleen of je 16–17 of 18+ bent.
- Je vereniging ziet nooit iets over jou als persoon, alleen groepscijfers van minstens 5 leden.
- Je kunt je gegevens altijd inzien, downloaden en verwijderen in de app.
- Een computer beslist nooit zelf dat je punten kwijtraakt of dat je account wordt geblokkeerd; dat doet altijd een mens.
- Je kunt altijd weer punten gaan verdienen of uit het onderzoek stappen, zonder punten te verliezen.

## 1. Wie is verantwoordelijk

1.1 Verantwoordelijk voor je gegevens is [naam rechtspersoon, rechtsvorm, KvK-nummer, adres: **in te vullen**] ("Rewarded", "wij"). [De rechtspersoon moet vóór 18 november 2026 bestaan. Zonder rechtspersoon is de founder zelf verwerkingsverantwoordelijke, en moeten de verwerkersovereenkomsten en verenigingsovereenkomsten op zijn naam worden getekend. Actie founder, founder-reactie ronde 2, J6.]

1.2 Vragen over privacy: [privacy-e-mailadres: **in te vullen**]. [**Functionaris gegevensbescherming (FG).** De jurist acht een FG in de pilot (honderden tot 1.500 gebruikers) waarschijnlijk nog niet verplicht (art. 37 lid 1 sub b AVG; ronde 2, antwoord op vraag 8i, **niet geverifieerd** in de primaire tekst). Omdat de kern van Rewarded stelselmatige monitoring van gedrag van jongeren is, beoordelen we dat opnieuw bij de uitbreiding naar meer verenigingen en bij het eerste betaalde contract met een instelling. Dat herbeoordelingsmoment staat in de DPIA. Bron: founder-reactie ronde 2, J9. **Vraag advocaat** 8i.]

1.3 Voor de verenigingschallenge bepaalt je vereniging mee wat er gebeurt (zij doet mee, werft leden met een code en krijgt een dashboard). Daarom kan de vereniging voor dat deel samen met ons verantwoordelijk zijn. Hoe we dat hebben verdeeld, staat in §6.3. [**Vraag advocaat** 10.]

## 2. Welke gegevens we verwerken, waarvoor, op welke grond en hoe lang

**De grondslagen in gewone taal.**

- *Overeenkomst* (art. 6 lid 1 sub b AVG): we hebben het gegeven nodig om de app te laten werken zoals in de gebruiksvoorwaarden staat.
- *Gerechtvaardigd belang* (art. 6 lid 1 sub f AVG): we hebben een goede reden die niet strikt nodig is voor de app zelf, zoals fraude tegengaan of het onderzoek. We hebben schriftelijk afgewogen of die reden zwaarder weegt dan jouw privacy, met extra aandacht voor 16- en 17-jarigen. Die afweging staat in de DPIA. Je kunt bezwaar maken (§5).
- *Toestemming* (art. 6 lid 1 sub a AVG): alleen als je zelf iets extra's aanzet. Je kunt je toestemming altijd intrekken.
- *Gezondheidsgegevens* (art. 9 AVG): gegevens over hoe je je voelt (stress, slaap, ervaren druk) zijn waarschijnlijk gezondheidsgegevens. Die mogen we alleen verwerken met een extra wettelijke uitzondering. Waar dat speelt, staat het in de tabel.

[Bron: founder-reactie ronde 1, J5: overeenkomst alleen voor account, sessie, punten en verzilvering; gerechtvaardigd belang met belangenafweging voor experiment, eventlog en fraude. Telefoonverificatie en vragenlijsten vallen voorlopig onder gerechtvaardigd belang (aanvulling founder-reactie 5 november).]

### 2.1 Je account en de app

| Wat | Welke gegevens | Waarvoor | Grondslag | Hoe lang |
|---|---|---|---|---|
| Account | E-mailadres, voornaam, achternaam (als je die invult), leeftijdsklasse (16–17 of 18+), datum waarop je 18 wordt (alleen bij 16–17), dagdoel, je instellingen | Je account laten werken | Overeenkomst | Zolang je account bestaat |
| Leeftijdscheck | Geboortedatum, alleen even in het geheugen | Bepalen of je mag meedoen en wat je ziet | Overeenkomst | Niet bewaard. Onder 16 wissen we alles wat je had ingevuld |
| Kalender van je vereniging | Welke tentamenkalender bij jou hoort: in een squad die van de vereniging van je squad (zonder vereniging: die van de vereniging van de maker van de squad); solo die van je vereniging; zonder vereniging de standaardkalender met vaste data. De kalender van een vereniging volgt haar instelling, en de faculteit waar die verschilt | De juiste data voor jou gebruiken: stop van de doelbonus, Belofte-aanbod, rustperiode, aprilchallenge | Overeenkomst | Zolang je account bestaat [Bron: founder-reactie ronde 2, besluit 1 en J11; ronde 3, G-MF3 en G-S6 (gebruiksvoorwaarden §1.5). De kalender hangt aan de vereniging, niet aan je instellingsmail; we gebruiken je instellingsmail dus niet meer om je kalender te bepalen] |
| Inloggen | Een versleutelde (gehashte) versie van je inloglink en code; je inlogsessie | Inloggen zonder wachtwoord | Overeenkomst | Inloglink en code 24 uur; inlogsessie tot ze verloopt (30 dagen zonder gebruik) |
| Focussessies | Start, einde en duur volgens onze server; signalen elke 30 seconden; wanneer de app zichtbaar of onzichtbaar werd; of het scherm aan bleef; het soort browser of toestel (bijvoorbeeld "iPhone, Safari"); verschil tussen de klok van je toestel en onze klok | Bepalen of een sessie telt, en je uitleggen waarom ze stopte | Overeenkomst | Ruwe signalen 90 dagen, daarna alleen een samenvatting per sessie. De sessie zelf zolang je account bestaat |
| Punten | Elke bijschrijving en afschrijving, met reden | Je saldo bijhouden | Overeenkomst | Zie §7: na verwijdering blijven de boekingen bestaan, maar zijn ze aan niemand meer te koppelen |
| Verzilveren | Welke beloning, wanneer, welke code, uit welke voorraad (onderzoekscohort of uitbreidingscohort) | Je beloning leveren, verantwoording aan partners | Overeenkomst | Zolang nodig voor de verantwoording aan partners [**open**: fiscale bewaarplicht, architectuur open vraag 12]. Na verwijdering zonder koppeling aan jou |
| Squad, aanwezigheid, duels | Je squad, wie erin zit, of je nu focust (als je dat aan hebt), streaks, duels | De squadfuncties laten werken | Overeenkomst | Zolang je account bestaat; zie §7 bij verwijdering |
| Vereniging | Dat je gekoppeld bent aan een vereniging en via welke code | Meedoen aan de verenigingschallenge | Overeenkomst | Zolang je account bestaat; na verwijdering blijft alleen een lege plek zodat de telling klopt |
| Belofte | Wat je jezelf belooft, of je het haalt, je reflectie, of je een hernieuwing hebt aangenomen | De Belofte laten werken | Overeenkomst | Zolang je account bestaat |
| Deelbare kaarten | De kaart die je zelf maakt | Je kaart tonen | Overeenkomst | Zolang je account bestaat; ingetrokken kaarten 30 dagen |
| Herinneringsmail | Of je hem wilt, en wanneer hij is verstuurd | Je dagelijkse herinnering | Overeenkomst (je kunt hem uitzetten) | Verzendlog 30 dagen |
| Referral en ambassadeurscode | Wie wie heeft uitgenodigd, via welke ambassadeurscode je binnenkwam, of de referral is vrijgekomen | Referralpunten; de vergoeding van de ambassadeur berekenen (die ziet alleen aantallen, nooit wie, §6.4) | Overeenkomst (referral); gerechtvaardigd belang (ambassadeurstelling) | Zolang je account bestaat |
| Hulp en support | Je vraag en ons antwoord | Je helpen | Overeenkomst | Tekst 90 dagen na afhandeling, daarna alleen het onderwerp |
| Supportlabel "welzijn" | Dat een supportbericht over hoe het met je gaat, het label "welzijn" kreeg | Je persoonlijk antwoorden met hulpbronnen | Gerechtvaardigd belang, **plus een uitzondering van art. 9 lid 2 AVG**, omdat dit label waarschijnlijk een gezondheidsgegeven is. Welke uitzondering, kiezen de onderzoeker en de advocaat [**vraag advocaat** 9b] | De tekst 90 dagen na afhandeling. Alleen het teamlid dat antwoordt ziet het label. Voor het onderzoek telt alleen het aantal labels per groep, nooit wie [Bron: jurist ronde 2, should-fix 8; founder-reactie ronde 2, J8] |

### 2.2 Fraude tegengaan en eerlijke challenges

| Wat | Welke gegevens | Waarvoor | Grondslag | Hoe lang |
|---|---|---|---|---|
| Telefoonnummer | Gehashte versie van je mobiele nummer; bij het versturen van de sms-code ook het nummer zelf, alleen even in het geheugen | Eén nummer per account; voorwaarde voor je eerste verzilvering | Gerechtvaardigd belang (fraude tegengaan) [Voorlopig besluit founder (5 november), gelijk aan het verwerkingsregister in architectuur §10.5; definitief na **vraag advocaat** 8b] | Zolang je account bestaat |
| Nummertypecontrole | Je nummer gaat naar onze sms-verwerker, die controleert of het een mobiel nummer is | Geen virtuele of internetnummers | Gerechtvaardigd belang | Bij ons: alleen de uitkomst. Bij de verwerker: [**in te vullen** na keuze verwerker] |
| Uniek e-mailadres | Een gehashte versie van de "kern" van je e-mailadres (zonder het deel na een plusteken en, bij providers die ze negeren, zonder punten) | Voorkomen dat één persoon met aliassen meerdere accounts maakt | Gerechtvaardigd belang | Zolang je account bestaat |
| Instellingsmail (identiteitsanker en instellingsanker) | Een vinkje "bevestigd", het domein (bijvoorbeeld "uu.nl") en een **versleutelde vingerafdruk van het adres** (een HMAC: een code die we met een geheime sleutel uit het adres maken en die niet terug te rekenen is naar het adres zonder die sleutel). Niet het adres zelf. In een steekproef vragen we je het adres opnieuw te bevestigen met een code; dan vergelijken we de vingerafdruk, en ook dan bewaren we het adres niet | Zorgen dat één instellingsadres maar één account kan bevestigen; meetellen in de verenigingschallenge (identiteitsanker, samen met het telefoonnummer); toegang tot het gereserveerde deel van de voorraad en meetellen voor de vergoeding van ambassadeurs (instellingsanker); contact in de steekproef via een adres dat een fraudeur niet zelf beheert | Gerechtvaardigd belang (fraude tegengaan). Zonder vingerafdruk werkt het anker niet: dan kan één adres tientallen accounts verankeren. De vingerafdruk is dus nodig en in verhouding; zo staat het in de DPIA | Zolang je account bestaat. Na verwijdering gewist, behalve na een bevestigde blokkade: dan 2 jaar (zie "Geblokkeerde nummers en adressen") [Bron: jurist ronde 3, should-fix 1; founder-reactie ronde 3, jurist: HMAC per adres vóór 4 januari 2027, alleen HMAC en domein bewaard. Herbevestiging in de steekproef: jurist ronde 2, should-fix 4. De termijn na een blokkade is een **voorstel** naar analogie van het geblokkeerde telefoonnummer; de jurist schrijft "net als `blocked_phone_hash`, alleen bij een bevestigde blokkade"] |
| Netwerk | Een gehashte versie van je IP-adres en de soort netwerk (campus, mobiel, anders); nooit het adres zelf | Fraudesignalen, misbruik van inloggen tegengaan | Gerechtvaardigd belang | 30 dagen |
| Toestel-id en soort toestel | Een willekeurig nummer dat de app in de opslag van je browser zet, en het soort browser of toestel | Zien of meerdere accounts op één toestel zitten, of tegelijk vanaf hetzelfde netwerk en soort toestel focussen (alleen als signaal voor een mens, heuristiek H12); in een prijssteekproef het toestel van je sessies vergelijken met dat van je registratie en inloggen | Gerechtvaardigd belang. Voor het opslaan op je toestel geldt art. 11.7a Telecommunicatiewet; we gaan ervan uit dat de uitzondering voor wat strikt nodig is voor de dienst geldt [**niet geverifieerd**; **vraag advocaat** 8f] | Bij de sessie 30 dagen; het toestel zelf 180 dagen na laatste gebruik [Bron: founder-reactie ronde 2, J1] |
| Fraudesignalen en markeringen | Welke signaal afging, het besluit, wie besliste | Valsspelen tegengaan; menselijke beoordeling | Gerechtvaardigd belang | Het bewijs tot na de beroepstermijn, daarna alleen codes; de markering zelf 2 jaar na het besluit |
| Beroep | Je uitleg, het besluit en de motivering | Een eerlijk beroep | Gerechtvaardigd belang | Je uitleg 90 dagen na het besluit; uitkomst en motivering 2 jaar |
| Wekelijkse steekproef, prijssteekproef en ambassadeurssteekproef | Of je account in een steekproef zat (in de wekelijkse steekproef ook of je bij het uitbreidingscohort hoort, dat als aparte groep wordt getrokken), de uitkomst van de lichte controle, je antwoord als we je een bericht sturen, en in een prijssteekproef of ambassadeurssteekproef de uitkomst van de toestelvergelijking en van een oefensessie van één minuut | Een eerlijke schatting van hoeveel fraude er is; een eerlijke uitslag van de verenigingschallenge; vóór elke uitbetaling aan een ambassadeur controleren of de accounts die via zijn code meetellen echt zijn (vijf accounts per ambassadeur, of allemaal als het er minder zijn) | Gerechtvaardigd belang | [**Voorstel**: uitkomst 2 jaar, net als een markering; je antwoord 90 dagen. De ambassadeur ziet nooit wie in de steekproef zat. Bron: jurist ronde 3, should-fix 5 en 7; founder-reactie ronde 3, jurist] |
| Winnaarscontrole | Je naam en adres voor levering; bij 18+-prijzen een leeftijdscontrole **zonder kopie van je identiteitsbewijs en zonder BSN** | Prijs leveren, controleren dat de winnaar echt is | Overeenkomst (levering); gerechtvaardigd belang (controle) | Contactgegevens 30 dagen na levering; van de leeftijdscontrole alleen de uitkomst |
| Geblokkeerde nummers en adressen | De gehashte versie van het nummer en de vingerafdruk van het instellingsadres van een geblokkeerd account | Voorkomen dat iemand na een blokkade met hetzelfde nummer of instellingsadres opnieuw begint | Gerechtvaardigd belang | 2 jaar na de blokkade, **ook als het account intussen is verwijderd** [voor het instellingsadres: **voorstel**, ronde 3] |
| Meldingen van squadnamen | Je melding en wat we ermee deden | Ongepaste squadnamen weghalen | Wettelijke plicht (art. 16 DSA) [**niet geverifieerd**] | [**Voorstel**: 1 jaar] |
| Auditlog | Welke medewerker wat deed met welk account; het account alleen als versleutelde code | Verantwoording en controle op medewerkers | Gerechtvaardigd belang | 2 jaar |
| Technische logs | Foutmeldingen zonder persoonsgegevens; nooit je IP-adres, e-mailadres of telefoonnummer | Beveiliging en storingen | Gerechtvaardigd belang | 14 dagen |

### 2.3 Het onderzoek in de pilot

| Wat | Welke gegevens | Waarvoor | Grondslag | Hoe lang |
|---|---|---|---|---|
| Groepsindeling | In welke groep jij of je squad zit (doelbonus A of B, Belofte vroeg of laat, rustperiode ja of nee, squadduwtje ja of nee), wisselingen, of je bij het onderzoek of bij het uitbreidingscohort hoort, of je in een rustsquad zelf punten verdient (16 of 17 jaar, of uitbreidingscohort), en of je hebt gekozen voor "Ik wil weer punten verdienen" (ook door over te stappen naar een squad die punten verdient) of "Uit het onderzoek stappen" | Het onderzoek: welke regels helpen om te blijven focussen; per groep rapporteren hoeveel mensen weer punten zijn gaan verdienen of uitstapten, en hoeveel rustsquads leden hebben die zelf punten verdienen | Gerechtvaardigd belang | Tot na de analyse van het aprilvenster (zie hieronder) [Bron: founder-reactie ronde 2, besluit 3 en J2; ronde 3, G-S2 en jurist should-fix 3] |
| Gebeurtenissenlog | Wat er in de app gebeurt (sessie gestart, dagdoel gehaald, squad gemaakt, …), gekoppeld aan een pseudoniem in plaats van je naam of account | Meten of de pilot werkt, per groep, per instroomkanaal en per instelling | Gerechtvaardigd belang | **Ruwe gebeurtenissen tot na de nawerkingsmeting in het aprilvenster**, daarna samengevat tot weekcijfers per groep zonder pseudoniem. [**Voorstel**: uiterlijk 15 juni 2027 (architectuur §10.6). Te toetsen zodra de aprilvensters per instelling vastliggen; valt een venster later, dan moet deze datum in de DPIA mee schuiven. Bron: founder-reactie ronde 1, JS5] |
| Zorgsignalen | Patronen zoals veel nachtsessies of meer dan 6 uur per dag op meerdere dagen, en een scherpe daling na een gebroken streak | Je een rustig bericht met hulp sturen; een groep stoppen als die er slechter van wordt, ook de rustperiodegroep (gebruiksvoorwaarden §6.10); vóór de uitbreiding kijken of het aantal signalen in alle groepen samen onder een vooraf vastgelegde grens blijft | Gerechtvaardigd belang. Dit is profilering zonder rechtsgevolg: een signaal kost je nooit punten en leidt nooit tot een besluit over je account. De belangenafweging staat in de DPIA [Bron: jurist ronde 2, should-fix 8; founder-reactie ronde 2, J8 en G-S7] | Als het gebeurtenissenlog |
| Vragenlijsten op vaste momenten | Je antwoorden over stress, slaap, ervaren druk van je squad, motivatie (ook in het na-seizoensvenster en na het aprilvenster, met de vraag of je ook zonder Rewarded studeerde), en je studietijd en afleiding vóór en na [ronde 3, G-S3] | Het onderzoek, en zien of de app je niet schaadt | **Gerechtvaardigd belang**, vrijwillig en altijd over te slaan. Voor de vragen over stress, slaap en ervaren druk vragen we je daarnaast apart om toestemming, omdat dat gezondheidsgegevens kunnen zijn (art. 9 lid 2 sub a AVG). [Voorlopig besluit founder (5 november); definitief na **vraag advocaat** 9a] | [**Voorstel**: tot na de analyse van het aprilvenster, daarna alleen groepscijfers] |
| Wekelijkse twee vragen | Elke week vanaf je tweede week: hoe gestrest je je voelt en hoeveel druk je ervaart. Ben je 16 of 17: twee vragen over je studietijd en afleiding (§6.1.3) | Tot de stop van de doelbonus: een groep snel kunnen stoppen als die er slechter van wordt (stopregel). Daarna alleen de twee groepen van de rustperiode vergelijken en per groep rapporteren; de rustperiodegroep bewaken we op de schadesignalen (gebruiksvoorwaarden §6.10), niet op deze vragen | Als hierboven: gerechtvaardigd belang, met aparte toestemming voor de vragen over stress en druk omdat het gezondheidsgegevens kunnen zijn. Geef je die toestemming niet, dan vragen we het je niet en tel je als "ontbrekend" in de analyse. De vragen over studietijd en afleiding zijn geen gezondheidsgegevens [**aanname**] en vragen geen aparte toestemming; je kunt ze altijd overslaan [Bron: founder-reactie ronde 2, G4; ronde 3, jurist should-fix 8 en G-S1] | Als hierboven |
| Wachtlijst | E-mailadres, of je met een vriend kwam, welke tekst je zag | Je uitnodigen, en de wachtlijsttest | Toestemming | Uitgenodigd: 30 dagen na de uitnodiging. Niet uitgenodigd: tot je wordt uitgenodigd of je afmeldt, hoogstens [**voorstel**: 12 maanden]. Afmelden: direct. [Ronde 2: er komt geen open lancering; de wachtlijst blijft bestaan voor de gecontroleerde uitbreiding op uitnodiging. Founder-reactie ronde 2, besluit 2 en S1] |
| Belangstelling voor Plus | Dat je je hebt opgegeven voor bericht over Plus | Meten of er belangstelling is; je een bericht sturen als Plus er komt | Toestemming | Tot Plus er is of je je afmeldt [**voorstel**: hoogstens 12 maanden] |

**Wat we nooit verwerken.** Locatie, camera, microfoon, contacten, welke andere apps je gebruikt, je cijfers of studieresultaten, je BSN, een kopie van je identiteitsbewijs. We gebruiken geen externe analyse- of advertentiediensten en verkopen nooit gegevens.

## 3. Pseudonimiseren: wat het wel en niet betekent

3.1 Waar we kunnen, vervangen we wie je bent door een code: je IP-adres, telefoonnummer, de kern van je e-mailadres en je instellingsadres bewaren we als hash (een soort vingerafdruk), en in het gebeurtenissenlog sta je onder een pseudoniem in plaats van met je account. Voor het instellingsadres gebruiken we een eigen geheime sleutel, apart van die voor de andere hashes. [Ronde 3: jurist should-fix 1 ("`HMAC(genormaliseerd adres, pepper_inst)`").]

3.2 Dat heet **pseudonimiseren**, niet anonimiseren. Met de geheime sleutel die we gebruiken, of door gegevens te combineren, kan een pseudoniem soms toch naar jou leiden. Daarom behandelen we deze gegevens als persoonsgegevens, met dezelfde rechten en bewaartermijnen. De geheime sleutels bewaren we apart van de database, en maar twee mensen kunnen erbij. [Architectuur §10.4 en §10.9; jurist ronde 1, must-fix 5.]

## 4. Met wie we gegevens delen

| Wie | Wat ze krijgen | Waarom |
|---|---|---|
| Medewerkers van Rewarded, onder wie de pilotbeheerder | Alleen wat nodig is voor hun taak (steekproef, fraudewachtrij, support); elke inzage van sessiegegevens staat in het auditlog | De pilot beheren. De pilotbeheerder tekent een geheimhoudingsverklaring (`geheimhoudingsverklaring-pilotbeheerder.md`). Hij is geen lid van een deelnemende vereniging, geen ambassadeur en geen deelnemer, en meldt per item als hij een persoonlijk belang heeft; dan doet iemand anders dat item. [Bron: founder-reactie ronde 2, MF3; ronde 3, jurist should-fix 6. **Vraag advocaat** 8k: als de pilotbeheerder freelance werkt, of die dan verwerker is en een verwerkersovereenkomst nodig heeft] |
| Hostingpartij (server in de EU) | Alles, versleuteld opgeslagen | Verwerker: de app draaien. [**In te vullen** na keuze] |
| E-maildienst (EU) | Je e-mailadres en de inhoud van de mail | Verwerker: inloglinks en berichten versturen. [**In te vullen**] |
| Sms-dienst (EU) | Je telefoonnummer | Verwerker: sms-code versturen, nummertype controleren. [**In te vullen**] |
| Je squad | Je voornaam, of je focust (als je dat aan hebt), streak, en je minuten alleen als jullie allebei vergelijken aanzetten | De squadfuncties |
| Je duelpartner | Je voornaam en hoeveel dagdoelen je haalde in het duel | Het duel |
| Je vereniging | **Alleen groepscijfers**, en pas als er minstens 5 leden in de groep zitten. Nooit je naam, je cijfers, tijdstippen of een lijst | De challenge en het dashboard |
| De ambassadeur via wiens code je kwam | **Alleen aantallen** (hoeveel gebruikers via zijn code meetellen voor zijn vergoeding), nooit wie | Zijn vergoeding (`ambassadeursovereenkomst.md`) |
| De hogeschool of universiteit | Niets over jou. We vragen hen alleen het ledental van je vereniging en de tentamenkalender te bevestigen | De challenge eerlijk maken, de juiste data gebruiken |
| Partners | Geen gegevens over jou. Een vouchercode koppelen we zelf aan je account. [**Aanname**: als een partner een fysieke prijs per post levert, krijgt die partner alleen naam en adres voor de levering; dat staat dan bij de prijs] | Je beloning |
| Externe beoordelaar | Alleen wat nodig is voor een beroep na een bevestigde blokkade of een diskwalificatie; met geheimhouding | Een onafhankelijk beroep |
| Onafhankelijke analist | Alleen gepseudonimiseerde gegevens voor de analyse | Een analyse door iemand die geen belang heeft bij de uitkomst. [**Aanname**: de analist werkt als verwerker met een verwerkersovereenkomst; naam en rol volgen. Founder-reactie ronde 2, G-S11] |
| Toezichthouders of politie | Alleen als de wet ons daartoe verplicht | Wettelijke plicht |

**Doorgifte buiten Europa.** We kiezen verwerkers in de EU, met een verwerkersovereenkomst. We controleren dat zij geen subverwerkers buiten de Europese Economische Ruimte gebruiken zonder passende waarborgen (art. 44 en verder AVG). [Bron: founder-reactie ronde 1, JS4. **Open**: de keuze van de verwerkers en die controle moeten vóór 1 december in de DPIA staan.]

## 5. Je rechten

Je kunt:

- **inzien en downloaden** wat we van je hebben: in de app onder Ik › Mijn gegevens (één bestand);
- **laten verbeteren** wat niet klopt: in je profiel, of via [privacy-e-mailadres];
- **verwijderen**: in de app onder Ik › Account verwijderen (zie §7);
- **beperking vragen**: dat we je gegevens tijdelijk niet gebruiken, bijvoorbeeld terwijl we een klacht onderzoeken;
- **bezwaar maken** tegen wat we op grond van gerechtvaardigd belang doen;
- **je toestemming intrekken** voor wat op toestemming rust (de welzijnsvragen, ook de wekelijkse, de wachtlijst, het Plus-bericht), zonder gevolgen voor de rest van de app;
- **je gegevens meenemen** (overdraagbaarheid) in het downloadbestand;
- een **klacht indienen** bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl). We horen het liever eerst zelf.

**Weer punten verdienen is iets anders dan bezwaar.** Onder Ik › Onderzoek staan twee knoppen (gebruiksvoorwaarden §6.8):

- *"Ik wil weer punten verdienen"* (alleen in de rustperiode). Je verdient vanaf de volgende focusdag weer punten. Je blijft in het onderzoek: we gebruiken je gegevens verder voor de analyse, in de groep waarin je geloot was. Dit is geen bezwaar; je kunt daarna nog steeds bezwaar maken.
- *"Uit het onderzoek stappen"*. Dit is bezwaar tegen het onderzoek (art. 21 AVG). Je verliest geen punten, je krijgt de standaardregels, en we gebruiken je gegevens vanaf dan niet meer voor de analyse. Gegevens die we al hadden, gebruiken we niet meer voor de analyse als je dat vraagt [**voorstel**; **vraag advocaat** 8e: of we gegevens van vóór de bezwaarmaking mogen houden voor de geldigheid van het onderzoek (art. 21 en art. 89 AVG)].

Bezwaar tegen fraudecontrole kun je maken, maar die stopt alleen als je belang zwaarder weegt; zonder fraudecontrole kun je niet verzilveren of meedoen om prijzen.

[Bron: jurist ronde 2, should-fix 2, punt 3; founder-reactie ronde 2, J2.]

We reageren op een verzoek binnen een maand.

## 6. Bijzondere onderwerpen

### 6.1 16 en 17 jaar

6.1.1 Je kunt Rewarded gebruiken vanaf 16 jaar zonder toestemming van je ouders. We vragen geen toestemming als grondslag voor de app zelf, en in Nederland ligt de grens voor ouderlijke toestemming op 16 jaar (art. 8 AVG en art. 5 UAVG; de jurist controleerde art. 5 lid 1 UAVG in de BWB, toestand 1 september 2026).

6.1.2 Omdat je jonger bent dan 18, beschermen we je extra:

- je live aanwezigheid in de squad staat **standaard uit**;
- je zit altijd in doelbonusgroep A en nooit in de rustperiodegroep;
- duels kun je alleen binnen je eigen squad spelen;
- trekkingen en inzetten bestaan voor jou niet;
- in de belangenafweging voor het onderzoek en de fraudecontrole hebben we apart naar jouw leeftijdsgroep gekeken.

6.1.3 **De wekelijkse vragen.** Ben je 16 of 17, dan gaan de wekelijkse twee vragen voor jou over je studietijd en afleiding, niet over stress en druk. Dat blijft zo tijdens de hele pilot, tenzij de advocaat vóór de eerste uitnodiging bevestigt dat je als 16- of 17-jarige zelf uitdrukkelijke toestemming kunt geven voor vragen over hoe je je voelt (gezondheidsgegevens, art. 9 lid 2 sub a AVG). Dan krijg je dezelfde vragen als iedereen, met dezelfde aparte toestemming, en staat dat hier vóór de eerste uitnodiging. Zonder dat antwoord kiezen we de voorzichtige kant. [Bron: jurist ronde 3, should-fix 8: de grens van 16 jaar in art. 5 UAVG gaat over toestemming als grondslag onder art. 6; of een 16-jarige zelf uitdrukkelijke toestemming kan geven onder art. 9 lid 2 sub a, is **niet geverifieerd**. Founder-reactie ronde 3, jurist: "weekitems voor 16- en 17-jarigen alleen over studietijd en afleiding zolang vraag 9a niet positief is beantwoord". Dit draait de standaard uit ronde 2 (G4: "voor iedereen") om. **Vraag advocaat** 9a.]

6.1.4 **De vragen op vaste momenten.** De welzijnsvragen bij de start, de pilotreflectie en het na-seizoensvenster stellen we aan iedereen die er apart toestemming voor geeft, ook als je 16 of 17 bent. [**Open, ter beslissing door de founder**: de founder-reactie van ronde 3 beperkt alleen de weekitems. Dezelfde vraag over art. 9 lid 2 sub a speelt ook hier. **Voorstel** juridisch team: dezelfde voorzichtige regel als in §6.1.3, zodat er één regel is. **Vraag advocaat** 9e.]

[Bron: founder-reactie ronde 1, G4, J5 en JS3; ronde 2, G4; ronde 3, jurist.]

### 6.2 Geen besluiten door een computer

De app stopt een sessie automatisch volgens vaste, uitgelegde regels (bijvoorbeeld als je naar een andere app gaat). Daar kun je een melding over maken. Maar een besluit dat je punten afkeurt, terugdraait, je uitsluit van een prijs of je account blokkeert, neemt **altijd een mens**, en een blokkade altijd twee mensen. Je kunt altijd in beroep (gebruiksvoorwaarden §8.6). [Art. 22 AVG.]

### 6.3 De rol van je vereniging

[**Voorstel**, afhankelijk van **vraag advocaat** 10.] Voor de app zelf is Rewarded alleen verantwoordelijk. Voor de verenigingschallenge zijn Rewarded en je vereniging samen verantwoordelijk (art. 26 AVG), omdat de vereniging meebepaalt dat er een challenge is en leden werft. We hebben afgesproken:

- Rewarded doet alle verwerking en is jouw aanspreekpunt voor al je rechten;
- de vereniging krijgt alleen groepscijfers vanaf 5 leden;
- de vereniging probeert nooit te achterhalen wie achter een cijfer zit en uploadt geen ledenlijst;
- de kern van deze afspraak kun je opvragen bij [privacy-e-mailadres].

### 6.4 Als je ambassadeur bent

Ben je campusambassadeur van Rewarded, dan verwerken we daarnaast: je naam, e-mailadres, telefoonnummer, je ambassadeurscode, je rekeningnummer voor de vergoeding, en per maand het aantal gebruikers dat via jouw code meetelt. Grondslag: de overeenkomst met jou. Hoe lang: zolang de fiscale bewaarplicht dat vraagt [**niet geverifieerd**; de fiscalist bepaalt de termijn]. Als de fiscalist bepaalt dat over je vergoeding loonheffing moet worden ingehouden, hebben we wettelijk ook je BSN nodig [**niet geverifieerd**]. Je ziet nooit wie via jouw code binnenkwam, alleen aantallen. Meer staat in `ambassadeursovereenkomst.md`. [Bron: jurist ronde 2, should-fix 5; founder-reactie ronde 2, J5.]

## 7. Wat er gebeurt als je je account verwijdert

7.1 Je verwijdert je account in de app. Je krijgt eerst een waarschuwing dat je punten vervallen. Daarna:

| Gegevens | Wat er gebeurt |
|---|---|
| Je account, inloggegevens, telefoonnummer, toestel, instellingen | Gewist |
| Je sessies, signalen en samenvattingen | Gewist |
| Je squad- en verenigingslidmaatschap | Je naam wordt eraf gehaald; er blijft een lege plek zodat de telling van de squad en de vereniging klopt |
| Je Beloftes, kaarten, herinneringen, vragenlijstantwoorden | Gewist [**aanname** voor de vragenlijsten; zie hieronder] |
| Je punten | Vervallen; de boekingen blijven bestaan voor de boekhouding, maar zijn aan niemand meer te koppelen |
| Verzilveringen, prijzen | Je naam wordt eraf gehaald |
| Markeringen en beroepen | Je naam en je uitleg worden eraf gehaald; alleen codes blijven, voor de rapportage over valse markeringen |
| Gebeurtenissenlog | Je pseudoniem wordt vervangen door een nieuw, willekeurig pseudoniem. **Ook de verwijzing naar je squad wordt gewist of vervangen**, net als verwijzingen naar je sessies, uitnodigingen, kaarten, duels, verzilveringen en referrals. Zo zijn de gebeurtenissen niet meer naar jou of je squad terug te leiden |
| Vingerafdruk van je instellingsadres | Gewist, zodat het adres opnieuw kan worden gebruikt |
| Geblokkeerd telefoonnummer en instellingsadres (alleen als je account was geblokkeerd) | Blijven 2 jaar bewaard als hash, zodat je niet opnieuw kunt beginnen met hetzelfde nummer of adres [instellingsadres: **voorstel**, ronde 3] |
| Auditlog | Blijft 2 jaar; bevat alleen een versleutelde code, nooit je naam, e-mailadres of pseudoniem |

7.2 **Waarom we gebeurtenissen houden na verwijdering.** Het onderzoek klopt alleen als iedereen die meedeed, in de cijfers blijft. Daarom houden we je gebeurtenissen, maar met een nieuw pseudoniem en zonder verwijzing naar je squad of andere rijen, tot ze na het aprilvenster worden samengevat. Omdat een squad klein is, is het denkbaar dat iemand je toch herkent; daarom behandelen we ook deze gegevens als persoonsgegevens, met waarborgen voor wetenschappelijk onderzoek. [Bron: founder-reactie ronde 1, J5. De grond om ze na verwijdering te bewaren (art. 17 lid 3 of art. 89 AVG) is **vraag advocaat** 8d; de jurist noemt beide routes, het team kiest nog niet.]

7.3 Wil je dat ook je gebeurtenissen direct worden gewist, vraag het dan via [privacy-e-mailadres]. We wegen je verzoek af en laten je binnen een maand weten wat we doen.

## 8. Beveiliging

We versleutelen de verbinding en de back-ups, bewaren de geheime sleutels apart van de database, loggen nooit je IP-adres, e-mailadres of telefoonnummer, laten medewerkers inloggen met een tweede factor, en schrijven elke inzage van sessiegegevens door een medewerker in het auditlog. Bij een datalek dat risico voor je geeft, laten we het je weten. [Architectuur §10.]

## 9. Opslag op je toestel

De app bewaart op je toestel (in de opslag van je browser): je inlogsessie, een toestel-id, en sessiegegevens die nog niet naar de server zijn gestuurd als je wifi even wegvalt. We gebruiken geen trackingcookies en geen cookies van anderen. [Of de toestel-id en de gehashte IP-adressen onder de uitzondering van art. 11.7a lid 3 Telecommunicatiewet vallen: **niet geverifieerd**; **vraag advocaat** 8f.]

## 10. Wijzigingen

Als we deze privacyverklaring veranderen, laten we je dat weten in de app. Bij een belangrijke wijziging (een nieuw doel of een nieuwe ontvanger) laten we het je vooraf weten per e-mail.

---

## Bijlage voor het team: wat er moet kloppen voordat deze tekst waar is

| # | Wat | Eigenaar | Uiterlijk | Bron |
|---|---|---|---|---|
| 1 | DPIA-light voor de wachtlijst | Founder | Deze week | Founder-reactie ronde 1, J5 |
| 2 | Volledige DPIA ondertekend, met per verwerking de grondslag uit §2 en de schriftelijke belangenafweging (met aandacht voor 16–17) | Founder, juridisch team | 1 december 2026 | J5 |
| 3 | `squad_id` in events wissen of vervangen bij verwijdering | Productteam | R1, 2 december 2026 | J5; spec §4.10, architectuur §10.7; nog te bouwen |
| 4 | Aanwezigheid standaard uit voor `16_17`; 16–17 in arm A en buiten de rustperiode | Productteam | R1 | G4, J5; nog te bouwen |
| 5 | Grondslagen in het verwerkingsregister (`docs/dpia/verwerkingen.md`) aanpassen: geen "toestemming voor de rest" | Productteam | 1 december 2026 | J5; architectuur §10.5 |
| 6 | Bewaartermijnen vastleggen: auditlog 2 jaar; ruwe events tot na het aprilvenster, met een einddatum die past bij de aprilvensters per instelling | Productteam, DPIA | 1 december 2026 | JS5; ronde 2, besluit 1 |
| 7 | Verwerkers kiezen (hosting, e-mail, sms met nummertypecontrole) en subverwerkers buiten de EER controleren | Founder | 1 december 2026 | JS4 |
| 8 | Toestel-id en Telecommunicatiewet; geen kopie identiteitsbewijs; uitleg `blocked_phone_hash` | DPIA | 1 december 2026 | J5 |
| 9 | Welzijnsvragen, ook de wekelijkse twee items: aparte toestemming in de app; weigeraars als ontbrekend; voor 16–17 de weekitems alleen over studietijd en afleiding tenzij vraag 9a vóór de eerste uitnodiging positief is beantwoord (§6.1.3; ronde 3, zie #21) | Juridisch team, productteam | Vóór de eerste vragenlijst | G4 (ronde 1 en 2); vraag advocaat 9 |
| 10 | Twee knoppen: "Ik wil weer punten verdienen" (blijft in de analyse) en "Uit het onderzoek stappen" (bezwaar, buiten de analyse) | Productteam | Vóór de rustperiode (R3) | Ronde 2, J2 |
| 11 | E-mailnormalisatie als hash naast het echte adres | Productteam | R1 | J2 (ronde 1) |
| 12 | Opslag van uitkomsten van de wekelijkse steekproef en de prijssteekproef, met toestelvergelijking en oefensessie; herbevestiging van de instellingsmail zonder het adres te bewaren | Productteam | R1 en R3 | J1, J2 (ronde 1); J1, J4 (ronde 2) |
| 13 | Supportlabel "welzijn" als gezondheidsgegeven: uitzondering van art. 9 lid 2 kiezen, alleen zichtbaar voor wie antwoordt; S1–S3 als profilering met belangenafweging in de DPIA | Onderzoeker, advocaat, DPIA | 1 december 2026 | Ronde 2, J8 |
| 14 | Herbeoordeling FG-plicht bij de uitbreiding en bij het eerste B2B-contract, als vast moment in de DPIA-checklist (aanzet in `docs/dpia/verwerkingen.md`) | Founder, DPIA | Bij de uitbreiding | Ronde 2, J9 |
| 15 | Koppeling van de tentamenkalender aan het account: een squad volgt haar vereniging, zonder vereniging de vereniging van de maker; solo volgt de eigen vereniging; anders de standaardkalender (spec §4.13, voorregistratie §3.1); de instellingsmail bepaalt de kalender niet meer; de data van de standaardkalender bevestigt de founder vóór 2 december | Productteam, founder | R1 | Ronde 2, besluit 1; ronde 3, G-MF3; voorregistratie open punt 2 |
| 16 | Geheimhoudingsverklaring pilotbeheerder; bij freelance werk mogelijk een verwerkersovereenkomst | Founder | Vóór 2 december 2026 | Ronde 2, MF3; vraag advocaat 8k |
| 17 | Gegevens van ambassadeurs (§6.4) in het verwerkingsregister, met de fiscale bewaartermijn | Founder, fiscalist | Vóór de eerste ambassadeur | Ronde 2, J5 |
| 18 | Twee voorraden (onderzoekscohort, uitbreidingscohort) bij verzilveringen vastleggen | Productteam | Vóór de uitbreiding | Ronde 2, MF5 |
| 19 | `institution_email_hash` als HMAC met eigen pepper en unieke index; bestaande instellingsankers opnieuw laten bevestigen; bewaring na blokkade; in de DPIA als pseudonimisering met gerechtvaardigd belang, noodzakelijk en proportioneel; in spec 1.3 vastgelegd (§4.10, §4.11) en in architectuur 1.4 (§10.4, §6.5, open vraag 26, §12.5); de DPIA-tekst volgt | Productteam, DPIA | Vóór 4 januari 2027 | Ronde 3, jurist should-fix 1; founder-reactie ronde 3 |
| 20 | Geheimhoudingsverklaring pilotbeheerder met de onafhankelijkheidseisen en de meldplicht per item (#16 aangevuld) | Founder | Vóór 2 december 2026 | Ronde 3, jurist should-fix 6 |
| 21 | Weekitems voor 16–17 alleen over studietijd en afleiding zolang vraag 9a niet positief is beantwoord (#9 aangepast); besluit founder over de vaste momenten (§6.1.4) | Productteam, founder | Vóór de eerste uitnodiging | Ronde 3, jurist should-fix 8 |
| 22 | Ambassadeurssteekproef (vijf accounts per ambassadeur vóór elke uitbetaling) en uitbreidingscohort als eigen stratum in de wekelijkse steekproef opslaan | Productteam | Vóór de eerste uitbetaling; R1 | Ronde 3, jurist should-fix 5 en 7 |
| 23 | Groepsindeling per persoon vanaf T − 6, overstap als `rest_period_exit`, persoonlijk doorlopende punten in een rustsquad (16–17, uitbreidingscohort) en de telling van gemengde squads | Productteam | R3 | Ronde 3, G-S2, jurist should-fix 3 |
| 24 | Bewaartermijn ruwe events toetsen aan het aprilvenster per faculteit (G-S6) en aan een eventuele latere start (schuifregel) | DPIA | 1 december 2026 | Ronde 3, G-MF3, G-S6 |

## Wijzigingslog

| Ronde | Datum | Wijziging |
|---|---|---|
| ronde 1 | 5 november 2026 | Eerste concept, opgesteld na pitchronde 1 (jurist must-fix 5 en 6, should-fix 4 en 5; founder-besluiten J1, J2, J5, J6, JS4, JS5, JS11, G4, GS3). Grondslag per verwerking volgens J5. Nog niet door de advocaat of in de DPIA beoordeeld. |
| ronde 1 (eindredactie) | 5 november 2026 | Gelijkgetrokken met de aanvulling van de founder van 5 november, spec 1.1 en architectuur 1.2. Versie 0.2. |
| ronde 2 | 5 november 2026 | Herzien volgens `docs/pitch/ronde-2-founder-reactie.md` en `docs/pitch/ronde-2-jurist.md`. §1.1 rechtspersoon als voorwaarde vóór 18 november (J6). §1.2 FG-plicht opnieuw beoordelen bij uitbreiding en eerste B2B-contract (J9). §2 art. 9 als aparte uitleg; nieuwe rijen voor de kalender van je instelling (besluit 1), het supportlabel "welzijn" als gezondheidsgegeven (J8), de wekelijkse twee vragen (G4) en de ambassadeurscode; zorgsignalen als profilering zonder rechtsgevolg (J8); toestel en soort toestel ook voor H12 en de toestelvergelijking (J1); herbevestiging instellingsmail in de steekproef (J4); groepsindeling met de keuze "weer punten verdienen" (J2); bewaartermijnen op het aprilvenster per instelling; wachtlijst zonder open lancering (besluit 2). §4 pilotbeheerder, ambassadeur en onafhankelijke analist als ontvangers (MF3, J5, G-S11). §5 "weer punten verdienen" gescheiden van bezwaar (J2). §6.1.3 voorstel voor 16–17 bij de welzijnsvragen (in de eindredactie van ronde 2 herzien). §6.4 gegevens van ambassadeurs (J5). Bijlage uitgebreid met #10 en #13–#18. Versie 0.3. |
| ronde 2 (eindredactie) | 5 november 2026 | Gelijkgetrokken met spec 1.2, de voorregistratie (ronde 2) en `docs/pitch/ronde-2-founder-reactie.md` na een onafhankelijke samenhangcontrole. §2.1 kalender van je instelling volgens spec §4.13 en voorregistratie §3.1, keuze bij aanmelding en aanname geschrapt, als **voorstel** tot de founder bevestigt (besluit 1, J11). §2.3 wachtlijst: "geen open lancering; de wachtlijst blijft bestaan voor de gecontroleerde uitbreiding op uitnodiging"; de oude term ook uit dit wijzigingslog gehaald (besluit 2, S1). §6.1.3: welzijnsvragen voor iedereen met aparte toestemming, ook 16–17 (G4); uitsluiting van 16–17 alleen als voorstel na vraag advocaat 9a. Bijlage #9, #14 en #15 bijgewerkt (DPIA-aanzet in `docs/dpia/verwerkingen.md`). Kopregel en ronde-2-regel gedateerd op 5 november, de datum van de founder-reactie. |
| ronde 3 | 5 november 2026 | Herzien volgens `docs/pitch/ronde-3-founder-reactie.md` (alle should-fixes van de jurist overgenomen) en `docs/pitch/ronde-3-jurist.md`. §2.1 kalender per vereniging, per faculteit waar die verschilt, standaardkalender zonder vereniging; de instellingsmail bepaalt de kalender niet meer (G-MF3, G-S6). §2.2 instellingsmail met een versleutelde vingerafdruk (HMAC) zodat één adres één account verankert, met grondslag, noodzaak en bewaartermijn; geblokkeerde adressen 2 jaar als voorstel (should-fix 1); ambassadeurssteekproef en uitbreidingscohort als aparte groep in de steekproef (should-fix 5 en 7). §2.3 groepsindeling met uitbreidingscohort, persoonlijk doorlopende punten en overstap als uitstap (should-fix 3, G-S2); zorgsignalen ook voor de rustperiodegroep (G-S1); motivatie-items in N en na A (G-S3); weekitems voor 16–17 over studietijd en afleiding (should-fix 8). §3.1 vingerafdruk van het instellingsadres met eigen sleutel. §4 onafhankelijkheid van de pilotbeheerder (should-fix 6). §6.1.3 omgekeerde standaard voor 16–17 bij de weekitems (should-fix 8); nieuwe §6.1.4 open punt voor de vaste momenten. §7 vingerafdruk bij verwijdering en blokkade. Bijlage #19–#24. Versie 0.4. |
| ronde 3 (eindredactie) | 5 november 2026 | Gelijkgetrokken met spec 1.3, architectuur 1.4, de voorregistratie (ronde 3) en de gebruiksvoorwaarden na een onafhankelijke samenhangcontrole, volgens `docs/pitch/ronde-3-founder-reactie.md`. Rij "Wekelijkse twee vragen": het doel na de bonusstop is alleen de vergelijking en de rapportage per groep; de bewaking van de rustperiodegroep rust op de schadesignalen (G-S1; voorregistratie §8.3, gebruiksvoorwaarden §6.10). Bijlage #15: de koppeling van de kalender volgt de vereniging (squad, maker, solo, anders de standaardkalender), niet meer de instellingsmail (G-MF3). Bijlage #19: de HMAC staat in spec 1.3 en architectuur 1.4; "aanpassen" vervalt. Kopregel en ronde-3-regel gedateerd op 5 november, de datum van de founder-reactie. |
