# Rewarded — Privacyverklaring (concept voor de advocaat)

*Concept van het juridische team, stand 5 november 2026, versie 0.2. **Dit is geen juridisch advies.** Dit is een concepttekst die de advocaat en de opsteller van de DPIA nog moeten beoordelen. Hij geldt pas als de DPIA is ondertekend (uiterlijk 1 december 2026, vóór de eerste uitnodiging; founder-reactie J5) en de founder hem vaststelt. Gebaseerd op `docs/pitch/ronde-1-jurist.md` (must-fix 5 en should-fix 4 en 5), de besluiten in `docs/pitch/ronde-1-founder-reactie.md` (J5, JS4, JS5, G4, GS3, en de aanvulling van 5 november), `docs/research/05-productspecificatie.md` §4.10 en §6, en `docs/research/07-architectuur.md` §10.4–10.7.*

*Leeswijzer. De tekst richt zich tot de gebruiker en is geschreven voor een student van 17. Een privacyverklaring moet kloppen met wat de app echt doet; waar de bouw nog moet veranderen om dit waar te maken, staat dat in de bijlage. Markeringen: **aanname**, **voorstel**, **werkhypothese**, **niet geverifieerd**, **vraag advocaat** (genummerd zoals in `vragen-advocatenopinie.md`). Tussen vierkante haken staat wat nog moet worden ingevuld.*

---

## In het kort

- We verzamelen zo weinig mogelijk: wanneer je sessies begonnen en stopten, of de app zichtbaar was, je squad en je vereniging. Geen locatie, geen camera, geen contacten, geen externe analyse- of advertentiediensten.
- Je geboortedatum bewaren we niet, alleen of je 16–17 of 18+ bent.
- Je vereniging ziet nooit iets over jou als persoon, alleen groepscijfers van minstens 5 leden.
- Je kunt je gegevens altijd inzien, downloaden en verwijderen in de app.
- Een computer beslist nooit zelf dat je punten kwijtraakt of dat je account wordt geblokkeerd; dat doet altijd een mens.
- Je kunt altijd uit het onderzoek stappen zonder punten te verliezen.

## 1. Wie is verantwoordelijk

1.1 Verantwoordelijk voor je gegevens is [naam rechtspersoon, rechtsvorm, KvK-nummer, adres: **in te vullen**] ("Rewarded", "wij").

1.2 Vragen over privacy: [privacy-e-mailadres: **in te vullen**]. [**Open**: of Rewarded een functionaris gegevensbescherming moet aanstellen (art. 37 AVG). Bij stelselmatige monitoring op grote schaal kan dat verplicht zijn; in de pilot (honderden gebruikers) waarschijnlijk niet. **Niet geverifieerd**; **vraag advocaat** 8.]

1.3 Voor de verenigingschallenge bepaalt je vereniging mee wat er gebeurt (zij doet mee, werft leden met een code en krijgt een dashboard). Daarom kan de vereniging voor dat deel samen met ons verantwoordelijk zijn. Hoe we dat hebben verdeeld, staat in §6.3. [**Vraag advocaat** 10.]

## 2. Welke gegevens we verwerken, waarvoor, op welke grond en hoe lang

**De grondslagen in gewone taal.**

- *Overeenkomst* (art. 6 lid 1 sub b AVG): we hebben het gegeven nodig om de app te laten werken zoals in de gebruiksvoorwaarden staat.
- *Gerechtvaardigd belang* (art. 6 lid 1 sub f AVG): we hebben een goede reden die niet strikt nodig is voor de app zelf, zoals fraude tegengaan of het onderzoek. We hebben schriftelijk afgewogen of die reden zwaarder weegt dan jouw privacy, met extra aandacht voor 16- en 17-jarigen. Die afweging staat in de DPIA. Je kunt bezwaar maken (§5).
- *Toestemming* (art. 6 lid 1 sub a AVG): alleen als je zelf iets extra's aanzet. Je kunt je toestemming altijd intrekken.

[Bron: founder-reactie J5: overeenkomst alleen voor account, sessie, punten en verzilvering; gerechtvaardigd belang met belangenafweging voor experiment, eventlog en fraude. Dit vervangt "toestemming voor de rest" uit architectuur 1.1; architectuur 1.2 §10.5 volgt deze indeling. Telefoonverificatie en vragenlijsten vallen voorlopig onder gerechtvaardigd belang (aanvulling founder-reactie 5 november).]

### 2.1 Je account en de app

| Wat | Welke gegevens | Waarvoor | Grondslag | Hoe lang |
|---|---|---|---|---|
| Account | E-mailadres, voornaam, achternaam (als je die invult), leeftijdsklasse (16–17 of 18+), datum waarop je 18 wordt (alleen bij 16–17), dagdoel, je instellingen | Je account laten werken | Overeenkomst | Zolang je account bestaat |
| Leeftijdscheck | Geboortedatum, alleen even in het geheugen | Bepalen of je mag meedoen en wat je ziet | Overeenkomst | Niet bewaard. Onder 16 wissen we alles wat je had ingevuld |
| Inloggen | Een versleutelde (gehashte) versie van je inloglink en code; je inlogsessie | Inloggen zonder wachtwoord | Overeenkomst | Inloglink en code 24 uur; inlogsessie tot ze verloopt (30 dagen zonder gebruik) |
| Focussessies | Start, einde en duur volgens onze server; signalen elke 30 seconden; wanneer de app zichtbaar of onzichtbaar werd; of het scherm aan bleef; het soort browser of toestel (bijvoorbeeld "iPhone, Safari"); verschil tussen de klok van je toestel en onze klok | Bepalen of een sessie telt, en je uitleggen waarom ze stopte | Overeenkomst | Ruwe signalen 90 dagen, daarna alleen een samenvatting per sessie. De sessie zelf zolang je account bestaat |
| Punten | Elke bijschrijving en afschrijving, met reden | Je saldo bijhouden | Overeenkomst | Zie §7: na verwijdering blijven de boekingen bestaan, maar zijn ze aan niemand meer te koppelen |
| Verzilveren | Welke beloning, wanneer, welke code | Je beloning leveren, verantwoording aan partners | Overeenkomst | Zolang nodig voor de verantwoording aan partners [**open**: fiscale bewaarplicht, architectuur open vraag 12]. Na verwijdering zonder koppeling aan jou |
| Squad, aanwezigheid, duels | Je squad, wie erin zit, of je nu focust (als je dat aan hebt), streaks, duels | De squadfuncties laten werken | Overeenkomst | Zolang je account bestaat; zie §7 bij verwijdering |
| Vereniging | Dat je gekoppeld bent aan een vereniging en via welke code | Meedoen aan de verenigingschallenge | Overeenkomst | Zolang je account bestaat; na verwijdering blijft alleen een lege plek zodat de telling klopt |
| Belofte | Wat je jezelf belooft, of je het haalt, je reflectie | De Belofte laten werken | Overeenkomst | Zolang je account bestaat |
| Deelbare kaarten | De kaart die je zelf maakt | Je kaart tonen | Overeenkomst | Zolang je account bestaat; ingetrokken kaarten 30 dagen |
| Herinneringsmail | Of je hem wilt, en wanneer hij is verstuurd | Je dagelijkse herinnering | Overeenkomst (je kunt hem uitzetten) | Verzendlog 30 dagen |
| Referral | Wie wie heeft uitgenodigd, of de referral is vrijgekomen | Referralpunten | Overeenkomst | Zolang je account bestaat |
| Hulp en support | Je vraag en ons antwoord | Je helpen | Overeenkomst | Tekst 90 dagen na afhandeling, daarna alleen het onderwerp |

### 2.2 Fraude tegengaan en eerlijke challenges

| Wat | Welke gegevens | Waarvoor | Grondslag | Hoe lang |
|---|---|---|---|---|
| Telefoonnummer | Gehashte versie van je mobiele nummer; bij het versturen van de sms-code ook het nummer zelf, alleen even in het geheugen | Eén nummer per account; voorwaarde voor je eerste verzilvering | Gerechtvaardigd belang (fraude tegengaan) [Voorlopig besluit founder (5 november), gelijk aan het verwerkingsregister in architectuur §10.5; definitief na **vraag advocaat** 8b: of dit onder overeenkomst valt omdat het een voorwaarde voor verzilvering is] | Zolang je account bestaat |
| Nummertypecontrole | Je nummer gaat naar onze sms-verwerker, die controleert of het een mobiel nummer is | Geen virtuele of internetnummers | Gerechtvaardigd belang | Bij ons: alleen de uitkomst. Bij de verwerker: [**in te vullen** na keuze verwerker] |
| Uniek e-mailadres | Een gehashte versie van de "kern" van je e-mailadres (zonder het deel na een plusteken en, bij providers die ze negeren, zonder punten) | Voorkomen dat één persoon met aliassen meerdere accounts maakt | Gerechtvaardigd belang | Zolang je account bestaat |
| Instellingsmail (identiteitsanker en instellingsanker) | Alleen een vinkje "bevestigd" en het domein (bijvoorbeeld "uu.nl"); niet het adres zelf en geen hash ervan | Meetellen in de verenigingschallenge (identiteitsanker, samen met het telefoonnummer); toegang tot het gereserveerde deel van de voorraad en meetellen voor de vergoeding van ambassadeurs (instellingsanker) | Gerechtvaardigd belang | Zolang je account bestaat |
| Netwerk | Een gehashte versie van je IP-adres en de soort netwerk (campus, mobiel, anders); nooit het adres zelf | Fraudesignalen, misbruik van inloggen tegengaan | Gerechtvaardigd belang | 30 dagen |
| Toestel-id | Een willekeurig nummer dat de app in de opslag van je browser zet | Zien of meerdere accounts op één toestel zitten (alleen als signaal voor een mens) | Gerechtvaardigd belang. Voor het opslaan op je toestel geldt art. 11.7a Telecommunicatiewet; we gaan ervan uit dat de uitzondering voor wat strikt nodig is voor de dienst geldt [**niet geverifieerd**; **vraag advocaat** 8] | Bij de sessie 30 dagen; het toestel zelf 180 dagen na laatste gebruik |
| Fraudesignalen en markeringen | Welke signaal afging, het besluit, wie besliste | Valsspelen tegengaan; menselijke beoordeling | Gerechtvaardigd belang | Het bewijs tot na de beroepstermijn, daarna alleen codes; de markering zelf 2 jaar na het besluit |
| Beroep | Je uitleg, het besluit en de motivering | Een eerlijk beroep | Gerechtvaardigd belang | Je uitleg 90 dagen na het besluit; uitkomst en motivering 2 jaar |
| Wekelijkse steekproef | Of je account in de steekproef zat, de uitkomst van de lichte controle, je antwoord als we je een bericht sturen | Een eerlijke schatting van hoeveel fraude er is | Gerechtvaardigd belang | [**Voorstel**: uitkomst 2 jaar, net als een markering; je antwoord 90 dagen] |
| Winnaarscontrole | Je naam en adres voor levering; bij 18+-prijzen een leeftijdscontrole **zonder kopie van je identiteitsbewijs en zonder BSN** | Prijs leveren, controleren dat de winnaar echt is | Overeenkomst (levering); gerechtvaardigd belang (controle) | Contactgegevens 30 dagen na levering; van de leeftijdscontrole alleen de uitkomst |
| Geblokkeerde nummers | De gehashte versie van het nummer van een geblokkeerd account | Voorkomen dat iemand na een blokkade met hetzelfde nummer opnieuw begint | Gerechtvaardigd belang | 2 jaar na de blokkade, **ook als het account intussen is verwijderd** |
| Meldingen van squadnamen | Je melding en wat we ermee deden | Ongepaste squadnamen weghalen | Wettelijke plicht (art. 16 DSA) [**niet geverifieerd**] | [**Voorstel**: 1 jaar] |
| Auditlog | Welke medewerker wat deed met welk account; het account alleen als versleutelde code | Verantwoording en controle op medewerkers | Gerechtvaardigd belang | 2 jaar |
| Technische logs | Foutmeldingen zonder persoonsgegevens; nooit je IP-adres, e-mailadres of telefoonnummer | Beveiliging en storingen | Gerechtvaardigd belang | 14 dagen |

### 2.3 Het onderzoek in de pilot

| Wat | Welke gegevens | Waarvoor | Grondslag | Hoe lang |
|---|---|---|---|---|
| Groepsindeling | In welke groep jij of je squad zit (doelbonus A of B, Belofte vroeg of laat, rustperiode ja of nee, squadduwtje ja of nee) en wisselingen | Het onderzoek: welke regels helpen om te blijven focussen | Gerechtvaardigd belang | Tot na de analyse van de aprilmeting (zie hieronder) |
| Gebeurtenissenlog | Wat er in de app gebeurt (sessie gestart, dagdoel gehaald, squad gemaakt, …), gekoppeld aan een pseudoniem in plaats van je naam of account | Meten of de pilot werkt, per groep en per instroomkanaal | Gerechtvaardigd belang | **Ruwe gebeurtenissen tot na de nawerkingsmeting van april 2027**, daarna samengevat tot weekcijfers per groep zonder pseudoniem. [**Voorstel**: uiterlijk 15 juni 2027 (architectuur §10.6), vast te leggen in de DPIA zodra de aprilperiode per vereniging bekend is. Bron: founder-reactie JS5] |
| Zorgsignalen | Patronen zoals veel nachtsessies of meer dan 6 uur per dag op meerdere dagen | Je een rustig bericht met hulp sturen; een groep stoppen als die er slechter van wordt | Gerechtvaardigd belang | Als het gebeurtenissenlog |
| Vragenlijsten | Je antwoorden over stress, slaap, ervaren druk van je squad, motivatie, en je studietijd en afleiding vóór en na | Het onderzoek, en zien of de app je niet schaadt | **Gerechtvaardigd belang**, vrijwillig en altijd over te slaan. Voor de vragen over stress, slaap en ervaren druk vragen we je daarnaast apart om toestemming, omdat dat gezondheidsgegevens kunnen zijn (art. 9 AVG). [Voorlopig besluit founder (5 november), in lijn met J5; definitief na **vraag advocaat** 9. Het juridische team stelde eerder toestemming als grondslag voor de hele vragenlijst voor.] | [**Voorstel**: tot na de analyse van de aprilmeting, daarna alleen groepscijfers] |
| Wachtlijst | E-mailadres, of je met een vriend kwam, welke tekst je zag | Je uitnodigen, en de wachtlijsttest | Toestemming | Uitgenodigd: 30 dagen na de uitnodiging; niet uitgenodigd: 30 dagen na de publieke lancering; afmelden: direct |
| Belangstelling voor Plus | Dat je je hebt opgegeven voor bericht over Plus | Meten of er belangstelling is; je een bericht sturen als Plus er komt | Toestemming | Tot Plus er is of je je afmeldt [**voorstel**: hoogstens 12 maanden] |

**Wat we nooit verwerken.** Locatie, camera, microfoon, contacten, welke andere apps je gebruikt, je cijfers of studieresultaten, je BSN, een kopie van je identiteitsbewijs. We gebruiken geen externe analyse- of advertentiediensten en verkopen nooit gegevens.

## 3. Pseudonimiseren: wat het wel en niet betekent

3.1 Waar we kunnen, vervangen we wie je bent door een code: je IP-adres, telefoonnummer en de kern van je e-mailadres bewaren we als hash (een soort vingerafdruk), en in het gebeurtenissenlog sta je onder een pseudoniem in plaats van met je account.

3.2 Dat heet **pseudonimiseren**, niet anonimiseren. Met de geheime sleutel die we gebruiken, of door gegevens te combineren, kan een pseudoniem soms toch naar jou leiden. Daarom behandelen we deze gegevens als persoonsgegevens, met dezelfde rechten en bewaartermijnen. De geheime sleutels bewaren we apart van de database, en maar twee mensen kunnen erbij. [Architectuur §10.4 en §10.9; jurist must-fix 5.]

## 4. Met wie we gegevens delen

| Wie | Wat ze krijgen | Waarom |
|---|---|---|
| Hostingpartij (server in de EU) | Alles, versleuteld opgeslagen | Verwerker: de app draaien. [**In te vullen** na keuze] |
| E-maildienst (EU) | Je e-mailadres en de inhoud van de mail | Verwerker: inloglinks en berichten versturen. [**In te vullen**] |
| Sms-dienst (EU) | Je telefoonnummer | Verwerker: sms-code versturen, nummertype controleren. [**In te vullen**] |
| Je squad | Je voornaam, of je focust (als je dat aan hebt), streak, en je minuten alleen als jullie allebei vergelijken aanzetten | De squadfuncties |
| Je duelpartner | Je voornaam en hoeveel dagdoelen je haalde in het duel | Het duel |
| Je vereniging | **Alleen groepscijfers**, en pas als er minstens 5 leden in de groep zitten. Nooit je naam, je cijfers, tijdstippen of een lijst | De challenge en het dashboard |
| De hogeschool of universiteit | Niets over jou. We vragen hen alleen het ledental van je vereniging te bevestigen | De challenge eerlijk maken |
| Partners | Geen gegevens over jou. Een vouchercode koppelen we zelf aan je account. [**Aanname**: als een partner een fysieke prijs per post levert, krijgt die partner alleen naam en adres voor de levering; dat staat dan bij de prijs] | Je beloning |
| Externe beoordelaar | Alleen wat nodig is voor een beroep na een bevestigde blokkade of een diskwalificatie; met geheimhouding | Een onafhankelijk beroep |
| Toezichthouders of politie | Alleen als de wet ons daartoe verplicht | Wettelijke plicht |

**Doorgifte buiten Europa.** We kiezen verwerkers in de EU, met een verwerkersovereenkomst. We controleren dat zij geen subverwerkers buiten de Europese Economische Ruimte gebruiken zonder passende waarborgen (art. 44 en verder AVG). [Bron: founder-reactie JS4. **Open**: de keuze van de verwerkers en die controle moeten vóór 1 december in de DPIA staan.]

## 5. Je rechten

Je kunt:

- **inzien en downloaden** wat we van je hebben: in de app onder Ik › Mijn gegevens (één bestand);
- **laten verbeteren** wat niet klopt: in je profiel, of via [privacy-e-mailadres];
- **verwijderen**: in de app onder Ik › Account verwijderen (zie §7);
- **beperking vragen**: dat we je gegevens tijdelijk niet gebruiken, bijvoorbeeld terwijl we een klacht onderzoeken;
- **bezwaar maken** tegen wat we op grond van gerechtvaardigd belang doen. **Uit het onderzoek stappen** kan altijd met één knop (Ik › Onderzoek). Je verliest dan geen punten, je krijgt de standaardregels, en we gebruiken je gegevens vanaf dan niet meer voor de analyse. Gegevens die we al hadden, gebruiken we niet meer voor de analyse als je dat vraagt [**voorstel**; **vraag advocaat** 8: of we gegevens van vóór de bezwaarmaking mogen houden voor de geldigheid van het onderzoek (art. 21 en art. 89 AVG)]. Bezwaar tegen fraudecontrole kun je maken, maar die stopt alleen als je belang zwaarder weegt; zonder fraudecontrole kun je niet verzilveren of meedoen om prijzen;
- **je toestemming intrekken** voor wat op toestemming rust (de welzijnsvragen in de vragenlijsten, wachtlijst, Plus-bericht), zonder gevolgen voor de rest van de app;
- **je gegevens meenemen** (overdraagbaarheid) in het downloadbestand;
- een **klacht indienen** bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl). We horen het liever eerst zelf.

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

[Bron: founder-reactie G4, J5 en JS3.]

### 6.2 Geen besluiten door een computer

De app stopt een sessie automatisch volgens vaste, uitgelegde regels (bijvoorbeeld als je naar een andere app gaat). Daar kun je een melding over maken. Maar een besluit dat je punten afkeurt, terugdraait, je uitsluit van een prijs of je account blokkeert, neemt **altijd een mens**, en een blokkade altijd twee mensen. Je kunt altijd in beroep (gebruiksvoorwaarden §8.6). [Art. 22 AVG.]

### 6.3 De rol van je vereniging

[**Voorstel**, afhankelijk van **vraag advocaat** 10.] Voor de app zelf is Rewarded alleen verantwoordelijk. Voor de verenigingschallenge zijn Rewarded en je vereniging samen verantwoordelijk (art. 26 AVG), omdat de vereniging meebepaalt dat er een challenge is en leden werft. We hebben afgesproken:

- Rewarded doet alle verwerking en is jouw aanspreekpunt voor al je rechten;
- de vereniging krijgt alleen groepscijfers vanaf 5 leden;
- de vereniging probeert nooit te achterhalen wie achter een cijfer zit en uploadt geen ledenlijst;
- de kern van deze afspraak kun je opvragen bij [privacy-e-mailadres].

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
| Geblokkeerd telefoonnummer (alleen als je account was geblokkeerd) | Blijft 2 jaar bewaard als hash, zodat je niet opnieuw kunt beginnen met hetzelfde nummer |
| Auditlog | Blijft 2 jaar; bevat alleen een versleutelde code, nooit je naam, e-mailadres of pseudoniem |

7.2 **Waarom we gebeurtenissen houden na verwijdering.** Het onderzoek klopt alleen als iedereen die meedeed, in de cijfers blijft. Daarom houden we je gebeurtenissen, maar met een nieuw pseudoniem en zonder verwijzing naar je squad of andere rijen, tot ze na de aprilmeting worden samengevat. Omdat een squad klein is, is het denkbaar dat iemand je toch herkent; daarom behandelen we ook deze gegevens als persoonsgegevens, met waarborgen voor wetenschappelijk onderzoek. [Bron: founder-reactie J5. De grond om ze na verwijdering te bewaren (art. 17 lid 3 of art. 89 AVG) is **vraag advocaat** 8; de jurist noemt beide routes, het team kiest nog niet.]

7.3 Wil je dat ook je gebeurtenissen direct worden gewist, vraag het dan via [privacy-e-mailadres]. We wegen je verzoek af en laten je binnen een maand weten wat we doen.

## 8. Beveiliging

We versleutelen de verbinding en de back-ups, bewaren de geheime sleutels apart van de database, loggen nooit je IP-adres, e-mailadres of telefoonnummer, laten medewerkers inloggen met een tweede factor, en schrijven elke inzage van sessiegegevens door een medewerker in het auditlog. Bij een datalek dat risico voor je geeft, laten we het je weten. [Architectuur §10.]

## 9. Opslag op je toestel

De app bewaart op je toestel (in de opslag van je browser): je inlogsessie, een toestel-id, en sessiegegevens die nog niet naar de server zijn gestuurd als je wifi even wegvalt. We gebruiken geen trackingcookies en geen cookies van anderen. [Of de toestel-id en de gehashte IP-adressen onder de uitzondering van art. 11.7a lid 3 Telecommunicatiewet vallen: **niet geverifieerd**; **vraag advocaat** 8.]

## 10. Wijzigingen

Als we deze privacyverklaring veranderen, laten we je dat weten in de app. Bij een belangrijke wijziging (een nieuw doel of een nieuwe ontvanger) laten we het je vooraf weten per e-mail.

---

## Bijlage voor het team: wat er moet kloppen voordat deze tekst waar is

| # | Wat | Eigenaar | Uiterlijk | Bron |
|---|---|---|---|---|
| 1 | DPIA-light voor de wachtlijst | Founder | Deze week | Founder-reactie J5 |
| 2 | Volledige DPIA ondertekend, met per verwerking de grondslag uit §2 en de schriftelijke belangenafweging (met aandacht voor 16–17) | Founder, juridisch team | 1 december 2026 | J5 |
| 3 | `squad_id` in events wissen of vervangen bij verwijdering | Productteam | R1, 2 december 2026 | J5; geregeld in spec 1.1 §4.10 en architectuur 1.2 §10.7 en productplan §10; nog te bouwen |
| 4 | Aanwezigheid standaard uit voor `16_17`; 16–17 in arm A en buiten de rustperiode | Productteam | R1 | G4, J5; geregeld in productplan §10 (herzien na ronde 1) en spec 1.1 §4.4 en §5; nog te bouwen |
| 5 | Grondslagen in het verwerkingsregister (`docs/dpia/verwerkingen.md`) aanpassen: geen "toestemming voor de rest" | Productteam | 1 december 2026 | J5; architectuur §10.5 |
| 6 | Bewaartermijnen vastleggen: auditlog 2 jaar; ruwe events tot na april 2027 | Productteam, DPIA | 1 december 2026 | JS5; architectuur §10.6 |
| 7 | Verwerkers kiezen (hosting, e-mail, sms met nummertypecontrole) en subverwerkers buiten de EER controleren | Founder | 1 december 2026 | JS4 |
| 8 | Toestel-id en Telecommunicatiewet; geen kopie identiteitsbewijs; uitleg `blocked_phone_hash` | DPIA | 1 december 2026 | J5 |
| 9 | Vragenlijsten: voorlopig gerechtvaardigd belang; aparte toestemming voor de welzijnsvragen in de app (spec 1.1 §3.1 stap 8, architectuur 1.2 `wellbeing_consent_at`) | Juridisch team, productteam | Vóór de eerste vragenlijst | G4, GS3, aanvulling 5 november; vraag advocaat 9 |
| 10 | Opt-out van het onderzoek als knop, zonder puntverlies | Productteam | R1 | G4 |
| 11 | E-mailnormalisatie als hash naast het echte adres | Productteam | R1 | J2 |
| 12 | Opslag van uitkomsten van de wekelijkse steekproef en de winnaarssteekproef | Productteam | R1 | J1, J2 |

## Wijzigingslog

| Ronde | Datum | Wijziging |
|---|---|---|
| ronde 1 | 5 november 2026 | Eerste concept, opgesteld na pitchronde 1 (jurist must-fix 5 en 6, should-fix 4 en 5; founder-besluiten J1, J2, J5, J6, JS4, JS5, JS11, G4, GS3). Grondslag per verwerking volgens J5. Nog niet door de advocaat of in de DPIA beoordeeld. |
| ronde 1 (eindredactie) | 5 november 2026 | Gelijkgetrokken met de aanvulling van de founder van 5 november, spec 1.1 en architectuur 1.2: telefoonverificatie voorlopig gerechtvaardigd belang; vragenlijsten voorlopig gerechtvaardigd belang met aparte toestemming voor welzijnsvragen (art. 9); instellingsmail als identiteitsanker en instellingsanker, zonder hash; bijlage #3, #4 en #9 bijgewerkt naar de huidige bouwdocumenten. Versie 0.2. |
