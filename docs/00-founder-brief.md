# Rewarded — Founder brief (v0, 4 november 2026)

## Het idee in één zin

Rewarded is een focus-app die je beloont voor bewezen focus: je legt je telefoon weg, doet een focussessie en verdient daarmee geld, prijzen of andere beloningen.

## Startpunt

Dit is een werkidee van de oprichter. De repository is leeg; dit document is het vertrekpunt voor het hele team. Alles hieronder zijn hypotheses van de founder, geen vastgestelde feiten. Het team mag ze onderuit halen, maar moet dan zeggen waarom en wat ervoor in de plaats komt.

## Waarom dit zou kunnen werken

1. Focus-apps (Forest, Opal, Freedom) hebben bewezen vraag maar slechte retentie: de motivatie is intrinsiek en vervliegt.
2. Geld is de meest deelbare beloning die er is. "Ik word betaald om te studeren" is een zin die mensen aan elkaar doorvertellen.
3. Gedragswetenschap: verliesaversie (eigen inzet die je kwijtraakt) verandert gedrag sterker dan een beloning, maar minder mensen durven eraan te beginnen. Een beloning zonder risico heeft hoge adoptie maar zwakker effect. We hebben vermoedelijk beide lagen nodig.

## Hypotheses van de founder (te toetsen)

- H1. Doelgroep eerst: studenten 18–25 in Nederland. Daarna knowledge workers en andere EU/UK-markten.
- H2. Er zijn drie realistische geldbronnen voor beloningen: (a) de eigen inzet van gebruikers (commitment contracts), (b) sponsors en merken (Hold-model, Sweatcoin-model), (c) werkgevers en onderwijsinstellingen (B2B2C). Een abonnement dat een prijzenpot vult is juridisch riskant (kansspel) en waarschijnlijk niet houdbaar.
- H3. Het product heeft twee lagen: een gratis beloningslaag (punten voor bewezen focus, inwisselbaar voor beloningen en gratis deelname aan prijstrekkingen) en een opt-in inzetlaag (je zet €5–€50 in op een weekdoel; haal je het, dan krijg je het terug plus eventueel een deel van de inzet van wie faalde).
- H4. Verificatie van focus is de kern van het bedrijf. Zodra er geld in het spel is, wordt valsspelen rationeel. De verificatie moet beter zijn naarmate de beloning hoger is.
- H5. Viraliteit komt uit vier bronnen: geld (deelbaar), sociale druk (duels, squads), campusrivaliteit (ranglijsten per universiteit) en bestaande "study with me"-cultuur op TikTok.
- H6. De werknaam "Rewarded" blijft, tenzij het team een beter alternatief met argumenten aandraagt.

## Harde randvoorwaarden

- Juridisch (NL): Wet op de kansspelen en toezicht door de Kansspelautoriteit; Gedragscode promotionele kansspelen; consumentenrecht; AVG; geen gelden van gebruikers aanhouden zonder vergunning (PSD2/e-money).
- Platforms: App Store Review Guidelines en Google Play-beleid rond geldprijzen, wedstrijden en loterijen.
- Geen gokmechaniek: inzet begrensd, geen "chase your losses", 18+ voor de inzetlaag, duidelijke afkoelperiodes.
- De unit economics van de gratis beloningslaag moeten vanaf dag één kloppen; we kunnen geen beloningen uitkeren die niet gedekt zijn.
- Eerlijkheid naar gebruikers: beloningen zijn verdiend, niet "gewonnen"; geen dark patterns.

## Vragen aan het team

Strategieteam (fase 1):
1. Markt en concurrentie: wie heeft dit al geprobeerd (Hold, Forfeit, StepBet, Sweatcoin, Forest, Opal, Focusmate, Flora, Brick, Beeminder, StickK), wat werkte, wat niet, en waarom? Hoe groot is de markt echt?
2. Businessmodel, juridisch en unit economics: welk beloningsmodel is in Nederland legaal, door de app stores toegestaan, fraudebestendig genoeg en economisch sluitend? Laat per model de rekensom zien.
3. Viraliteit en tractie: welke groeiloops en kanalen passen bij dit product, en hoe ziet een plan voor de eerste 90 dagen eruit, met meetbare doelen?

Fase 2 (na besluit over het model): boodschap en positionering; productspecificatie; UX-ontwerp; technische architectuur.

## Besluitproces

- De founder beslist na elke fase en legt besluiten vast in `docs/01-businessplan.md` en `docs/02-productplan.md`.
- Een kritisch team (investeerder, gedragswetenschapper, jurist/fraude-expert) beoordeelt de pitch. Elke ronde eindigt in GO, GO MET VOORWAARDEN of NO-GO per beoordelaar. Maximaal drie rondes.
- Daarna bouwen we.

## Scope van de build (voorlopig)

Web-first MVP als Progressive Web App die op de telefoon werkt: focus-engine (sessie loopt alleen terwijl Rewarded op het scherm staat, met Wake Lock zodat de telefoon met het scherm naar beneden op tafel kan liggen), beloningsgrootboek, challenges, squads, ranglijsten. Native verificatie via Screen Time / UsageStats is de volgende stap, niet de eerste.
