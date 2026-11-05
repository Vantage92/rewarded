# Rewarded — Spelvoorwaarden promotioneel kansspel (sjabloon, niet in gebruik)

*Sjabloon van het juridische team, stand 4 november 2026, versie 0.3 (ronde 2). **Dit is geen juridisch advies.** Dit sjabloon is alleen bedoeld voor het geval dat trekkingen ooit aangaan. **Trekkingen staan uit en de trekkingsmodule wordt niet gebouwd** (founder-reactie, besluit 3, S9 en J4). Gebaseerd op `docs/pitch/ronde-1-jurist.md` (must-fix 4 en 6), `docs/pitch/ronde-2-jurist.md` (J4 opgelost; should-fix 6 en 12), `docs/pitch/ronde-2-founder-reactie.md` (J6, J12), `docs/research/02-businessmodel-juridisch-unit-economics.md` (§2.1, §2.2, §2.6) en `docs/research/05-productspecificatie.md` (versie 1.1, §3.9).*

## Voordat dit sjabloon ooit wordt gebruikt

Dit sjabloon mag pas worden ingevuld en gepubliceerd als **alle** onderstaande voorwaarden schriftelijk vastliggen. Dat is de beslisregel uit de founder-reactie (J4): **geen schriftelijke advocatenopinie plus geen expliciete, schriftelijke reactie van de Kansspelautoriteit betekent dat trekkingen uit blijven. Stilte is nee.**

| # | Voorwaarde | Status op 4 november 2026 |
|---|---|---|
| 1 | Schriftelijke advocatenopinie over de gekozen structuur (**vraag advocaat** 12) | Niet aangevraagd voor trekkingen; staat in de vragenlijst |
| 2 | Expliciete, schriftelijke reactie van de Kansspelautoriteit op de voorgelegde structuur | Niet voorgelegd. De Ksa geeft voor zover bekend geen bindende rulings op promotionele kansspelen (**niet geverifieerd**, jurist must-fix 4) |
| 3 | Toets door de fiscalist van de vrijstelling in art. 4 Wet op de kansspelbelasting en de samentelling van prijzen in art. 4 lid 2 op de gekozen structuur | Niet gedaan. Het bedrag van de vrijstelling in art. 4 lid 1 is **niet geverifieerd** (jurist, verificatie en beperkingen) |
| 4 | Besluit van de founder | Niet genomen; trekkingen zijn buiten deze ronde |
| 5 | Trekkingsmodule gebouwd en getest (commit-reveal, beacon, terugvalregel, reservewinnaars) | Niet gebouwd; alleen een lege plek in datamodel en vlag. De jurist bevestigde in ronde 2 dat `draws` altijd uit staat en geen route heeft |
| 6 | Rechtspersoon die organisator kan zijn | Nog niet opgericht; actie founder vóór 18 november 2026 (founder-reactie ronde 2, J6) |
| 7 | Google Play-beleid voor prijzen en kansspelen primair gelezen, als er een Android-app komt | Niet gedaan; in geen enkele sessie primair gelezen (jurist ronde 2, should-fix 12) |

**Structuur die dit sjabloon aanneemt.** Eén promotioneel kansspel per jaar voor Rewarded, met **hoogstens twintig trekkingen** en een **totale prijzenpot onder €100.000**, volgens art. 2 van de Gedragscode promotionele kansspelen 2014 zoals weergegeven in WODC 2024 (rapport 02 §2.2). **Niet** een reeks kleine spellen van hoogstens €4.500 elk: de jurist wijst die af omdat de Ksa zo'n opdeling volgens WODC als ondermijning van het vergunningenstelsel ziet. De Gedragscode staat niet in de BWB en is in deze sessies alleen via WODC 2024 gelezen (**niet geverifieerd** in de primaire tekst).

**Wat dit sjabloon niet oplost.** Het risico dat trekkingen in de app een "zelfstandige activiteit" worden in plaats van een promotie van de focus-dienst (rapport 02 §2.2; jurist must-fix 4). Dat is een ontwerpvraag: trekkingen staan nooit op het startscherm, in uitnodigingen, op kaarten of in de promotiekit. [Spec 1.1 bouwt geen trekkingen (§3.9) en legt deze regel daarom nog niet vast; als de module ooit komt, neemt het productteam hem op.]

**Geen trekking tijdens een onderzoek met groepen.** [**Voorstel**, nieuw in ronde 2.] Zolang er een onderzoek loopt waarin het lot bepaalt welke regels iemand krijgt (gebruiksvoorwaarden §6, tot en met het aprilvenster), organiseert Rewarded geen trekking. Een kansprijs naast een rustperiode zonder punten maakt de vraag of de toewijzing een kansbepaling is (vraag advocaat 3b) alleen maar lastiger.

*Leeswijzer. Hieronder staat de tekst zoals een deelnemer hem zou lezen, in gewone taal. Tussen vierkante haken staat wat per spel moet worden ingevuld. Markeringen: **aanname**, **voorstel**, **niet geverifieerd**, **vraag advocaat**.*

---

## Spelvoorwaarden [naam van het spel] [jaar]

### Waar het over gaat, in vijf regels

1. Dit is een kansspel: of je wint, hangt van het lot af, niet van hoe goed je focust.
2. Je moet 18 jaar of ouder zijn.
3. Meedoen is gratis. Je hoeft niets te kopen en geen abonnement te hebben.
4. Je doet alleen mee als je dat zelf apart aanzet.
5. Apple is geen sponsor en is er niet bij betrokken.

### 1. Organisator

1.1 De organisator van dit spel is [naam rechtspersoon, rechtsvorm, KvK-nummer, adres] ("Rewarded"). Rewarded organiseert het spel in eigen naam om de focus-app Rewarded te promoten.

1.2 Een partner kan een prijs leveren, maar is nooit organisator. [Apple 5.3.1: "Sweepstakes and contests must be sponsored by the developer of the app."]

1.3 **Apple is geen sponsor van dit spel en is er op geen enkele manier bij betrokken.** [Apple 5.3.2, letterlijk in rapport 02 §2.6: "Official rules for sweepstakes, contests, and raffles must be presented in the app and make clear that Apple is not a sponsor or involved in the activity in any manner." Voor een Android-versie: dezelfde zin voor Google, als het Play-beleid dat vraagt; dat beleid is **niet geverifieerd** op de primaire pagina en moet vóór de Android-bouw primair worden gelezen (jurist ronde 2, should-fix 12; voorwaarde 7).]

### 2. Looptijd en trekkingen

2.1 Het spel loopt van [startdatum en -tijd] tot en met [einddatum en -tijd], Nederlandse tijd.

2.2 Er zijn [aantal, hoogstens 20] trekkingen, op [data]. Per trekking staat hieronder welke periode meetelt.

| Trekking | Periode die meetelt | Sluiting deelname | Datum trekking | Prijzen |
|---|---|---|---|---|
| [1] | [ma 04:00 – ma 04:00] | [datum, tijd] | [datum] | [aantal × omschrijving, waarde] |
| … | … | … | … | … |

2.3 Dit is het enige promotionele kansspel dat Rewarded in [jaar] organiseert.

### 3. Wie mag meedoen

3.1 Je mag meedoen als je:

- **18 jaar of ouder** bent;
- een Rewarded-account hebt dat niet geblokkeerd is;
- dit spel apart hebt aangezet onder [plek in de app]; en
- in de periode van een trekking je weekdoel hebt gehaald: op minstens 5 van de 7 dagen je dagdoel, waarbij een rustdag-joker niet telt.

3.2 Voor 16- en 17-jarigen bestaat dit spel niet. Ze zien het niet in de app. [De Gedragscode vraagt bij minderjarigen "grote zorgvuldigheid en terughoudendheid" en toestemming van een ouder (art. 6, via WODC 2024; **niet geverifieerd** in de primaire tekst). Het team kiest daarom voor 18+ zonder uitzondering.]

3.3 Medewerkers van Rewarded, hun teamaccounts en de mensen die de trekking uitvoeren, doen niet mee.

3.4 Je doet mee met één lot per trekking. Je kunt geen extra loten krijgen.

### 4. Meedoen is gratis

4.1 Meedoen kost niets. Je hoeft niets te kopen. Meedoen is **niet gekoppeld aan Rewarded Plus**, aan een andere betaling of aan het inwisselen van punten. Met Plus heb je geen grotere kans.

4.2 Je betaalt hoogstens de gewone kosten van je eigen internetverbinding. [Gedragscode art. 3: alleen communicatiekosten van hoogstens €0,45 zijn toegestaan; rapport 02 §2.2, via WODC 2024.]

4.3 Je punten veranderen niet door mee te doen, te winnen of te verliezen.

### 5. Prijzen

5.1 De prijzen staan in de tabel in §2.2, met omschrijving en waarde. De totale waarde van alle prijzen in dit spel is [bedrag; moet onder €100.000 blijven].

5.2 Prijzen zijn nooit geld, nooit vrij besteedbaar tegoed en niet om te wisselen voor geld.

5.3 **Kansspelbelasting** betaalt Rewarded. Jij betaalt niets. [Art. 5 Wet op de kansspelbelasting, toestand 1 januari 2026: tarief 37,8%; neemt de organisator de belasting voor zijn rekening, dan wordt de prijs vermenigvuldigd met 100/62,2 (rapport 02 §2.2, door de jurist in de BWB bevestigd). Of en hoe de vrijstelling van art. 4 van toepassing is en hoe art. 4 lid 2 de prijzen samentelt: fiscalist, voorwaarde 3.]

### 6. Hoe de winnaars worden bepaald

6.1 Per trekking kiest een computerprogramma de winnaars willekeurig uit alle deelnemers die aan §3 voldoen. Iedere deelnemer heeft dezelfde kans. De app toont vóór de trekking de kans als getal ("1 op [x], bij [y] deelnemers op dit moment"), en na de trekking het werkelijke aantal deelnemers.

6.2 **Zo kun je controleren dat de trekking eerlijk is (commit-reveal).**

1. Vóór de sluiting van de deelname publiceren we in de app een vingerafdruk (hash) van een geheim getal (de seed).
2. Na de sluiting nemen we een openbaar willekeurig getal van een externe bron (de beacon), dat pas na de sluiting bekend wordt: [naam en adres van de beacon].
3. Het programma combineert de seed en het beacongetal en bepaalt zo de winnaars, in een vaste volgorde.
4. Na de trekking publiceren we de seed, het beacongetal, de lijst met deelnamecodes en de methode. Iedereen kan dan narekenen dat de seed past bij de vingerafdruk en dat de uitslag klopt.

6.3 **Terugvalregel.** Is het beacongetal [binnen x uur] na de sluiting niet beschikbaar, dan gebruiken we [de eerstvolgende beschikbare waarde van dezelfde beacon / een vooraf genoemde tweede bron]. We maken dat dan bekend. [**Vraag advocaat** 12: of deze methode en terugvalregel volstaan; productplan §10.]

6.4 **Reservewinnaars.** Per trekking trekt het programma ook [aantal] reservewinnaars, in volgorde. Een reservewinnaar krijgt de prijs als een winnaar niet aan de voorwaarden blijkt te voldoen (§7) of niet op tijd reageert (§8.2).

### 7. Controle van winnaars

7.1 Voordat je de prijs krijgt, controleren we:

- dat alle sessies die meetelden voor je weekdoel niet zijn afgekeurd;
- dat je telefoonnummer is bevestigd;
- dat er geen overlap is in netwerk of telefoonnummer met andere winnende accounts;
- dat je 18 of ouder bent, **zonder een kopie van je identiteitsbewijs te bewaren en zonder je BSN** [**vraag advocaat** 8];
- dat een medewerker heeft gekeken.

7.2 Voldoe je niet aan de voorwaarden, dan gaat de prijs naar de eerste reservewinnaar. Je krijgt de reden en kunt binnen 14 dagen in beroep, zoals in de gebruiksvoorwaarden §8.6.

### 8. Bekendmaking en levering

8.1 Winnaars krijgen binnen [x werkdagen] na de trekking een bericht in de app en per e-mail. We maken de winnaars niet met naam openbaar, tenzij je daar apart toestemming voor geeft.

8.2 Reageer je niet binnen [**voorstel**: 14 dagen] op het bericht, dan gaat de prijs naar de eerste reservewinnaar.

8.3 De prijs wordt geleverd binnen [termijn] na de controle. Je contactgegevens voor de levering bewaren we tot 30 dagen na levering.

8.4 Na elke trekking publiceren we in de app: het aantal deelnemers, het aantal prijzen, de seed en het beacongetal.

### 9. Je gegevens

Voor dit spel verwerken we: dat je het spel hebt aangezet, je deelnamecode per trekking, of je gewonnen hebt, en voor de levering je naam en adres. Je deelnamecode bewaren we tot 1 jaar na het einde van het spel, voor klachten en controle; daarna blijft alleen de codelijst zonder koppeling aan jou. Meer staat in de privacyverklaring. [Termijn: **keuze** van het juridische team, te toetsen door de advocaat. Architectuur 1.2 heeft geen trekkingstabellen meer (§7) en dus ook geen termijn daarvoor.]

### 10. Klachten

10.1 Klachten over dit spel stuur je naar [klachtenadres, e-mail]. We antwoorden binnen [**voorstel**: 10 werkdagen] inhoudelijk.

10.2 Kom je er met ons niet uit, dan kun je naar de bevoegde rechter in Nederland. Op dit spel is Nederlands recht van toepassing.

### 11. Spelen met mate

Dit spel is een kleine extra. Voel je dat je te veel met kans of winnen bezig bent, kijk dan op [verwijzing naar hulp, bijvoorbeeld de hulplijn die de advocaat of Ksa aanbeveelt; **in te vullen**].

### 12. Wijzigingen

Rewarded verandert deze spelvoorwaarden tijdens het spel niet ten nadele van de deelnemers, tenzij de wet of een toezichthouder dat vraagt. Dan maken we dat direct bekend en kun je je deelname stoppen.

---

## Bijlage voor de advocaat: herkomst per onderdeel

| Onderdeel (jurist must-fix 6; spec 1.1 §3.9) | Paragraaf |
|---|---|
| Organisator | §1 |
| Looptijd | §2 |
| Deelnamevoorwaarden; 18+ | §3 |
| Gratis, niet gekoppeld aan Plus of een aankoop | §4 |
| Prijzen; kansspelbelasting voor rekening van Rewarded | §5 |
| Winnaarsbepaling; commit-reveal- en beaconregel met terugvalregel; reservewinnaars | §6 |
| Bekendmaking | §8 |
| Klachtenadres | §10 |
| Verklaring dat Apple geen sponsor is (Apple 5.3.2) | §1.3 |
| Structuur: één spel per jaar, ≤ 20 trekkingen, pot < €100.000 (founder J4) | Voorafgaand, §2.3, §5.1 |

**Verhouding tot de bouwdocumenten.** Spec 1.1 (§3.9) en architectuur 1.2 (§7) bouwen geen trekkingen; de vlag `draws` en een lege plek in het datamodel blijven. Komen trekkingen ooit terug, dan volgens beide documenten alleen als één promotioneel spel per jaar met hooguit twintig trekkingen en een pot onder €100.000, zoals dit sjabloon. Een reeks kleine spellen van hoogstens €4.500 staat in geen enkel huidig document meer.

## Wijzigingslog

| Ronde | Datum | Wijziging |
|---|---|---|
| ronde 1 | 5 november 2026 | Eerste sjabloon, opgesteld na pitchronde 1 (jurist must-fix 4 en 6; founder-besluiten J4, J6, S9 en besluit 3). Niet in gebruik: trekkingen staan uit en de module wordt niet gebouwd. |
| ronde 1 (eindredactie) | 5 november 2026 | Verouderde verwijzingen naar spec §4.7, de beheeromgeving en architectuur §10.6 vervangen door de huidige stand (spec 1.1 §3.9, architectuur 1.2 §7: geen trekkingen in de bouw). Inhoud van het sjabloon ongewijzigd. Versie 0.2. |
| ronde 2 | 4 november 2026 | Herzien volgens `docs/pitch/ronde-2-founder-reactie.md` en `docs/pitch/ronde-2-jurist.md`. De jurist geeft J4 (trekkingen) als opgelost; het sjabloon blijft een sjabloon. Statustabel bijgewerkt en aangevuld met voorwaarde 6 (rechtspersoon, J6) en 7 (Google Play-beleid primair lezen vóór de Android-bouw, J12). Nieuw voorstel: geen trekking zolang er een onderzoek met geloote groepen loopt. §1.3 en §3.2 aangevuld met de bronverwijzingen. Inhoud van de spelvoorwaarden zelf (18+, gratis, Apple-verklaring, commit-reveal) ongewijzigd. Versie 0.3. |
