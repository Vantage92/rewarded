# Handmatige toesteltest

*Architectuur §11 (laag "Handmatig op toestel") en §9.5. Draaien vóór R1 en na elke wijziging in `apps/web/src/platform/` of in de inlogflow. De geautomatiseerde suite (`pnpm e2e`) draait alleen in Chromium op Linux. Playwright-WebKit is daar niet hetzelfde als Safari op een iPhone, en in de bouwcontainer staat WebKit niet in de cache.*

## Voorbereiding

1. Draai `pnpm seed:demo` en daarna `pnpm dev`. Zet de klok op de demo met `POST /api/v1/dev/clock {"set":"2026-12-16T09:00:00Z"}`. Of doe `POST /api/v1/dev/reset {"seed":"demo"}` op de draaiende server; dan loopt de klok vanaf de demotijd gewoon door.
2. Maak de dev-server bereikbaar voor de toestellen. Gebruik daarvoor hetzelfde wifi-netwerk en `vite --host`, of een tunnel met https. Wake Lock en de service worker werken alleen in een veilige context: https of localhost.
3. Log in met een demo-account (zie de uitvoer van `pnpm seed:demo`). De code staat in `GET /api/v1/dev/inbox?to=<adres>`.
4. Noteer per toestel het model, de OS-versie, de browserversie en de datum.

| Toestel | Varianten |
|---|---|
| iPhone (recente iOS) | Safari-tabblad **en** Home Screen-app (Deel → Zet op beginscherm) |
| Android-toestel 1 (Pixel of vergelijkbaar, Chrome) | browsertabblad **en** geïnstalleerde PWA |
| Android-toestel 2 (andere fabrikant, bijvoorbeeld Samsung Internet of Chrome op One UI) | browsertabblad |

## Checklist per toestel

Vul per regel in: ✓ (werkt zoals verwacht), ✗ (wijkt af, met een korte omschrijving) of n.v.t.

### Wake Lock en zichtbaarheid (spec §4.1, architectuur §9.5)

- [ ] Een sessie van 25 minuten met het scherm aan en de telefoon plat op tafel. Het scherm gaat niet uit en de sessie voltooit. Het eindsignaal klinkt of trilt.
- [ ] Tijdens een sessie het scherm uitzetten met de aan-uitknop. De sessie breekt af met de uitleg voor `hidden`.
- [ ] Tijdens een sessie naar een andere app gaan en binnen 5 seconden terugkomen. De sessie breekt af met `hidden`; er is geen pauze en geen terugkeervenster.
- [ ] Een melding van een andere app over de sessie heen laten verschijnen, zonder erop te tikken. Noteer wat er gebeurt; de spec verwacht dat de sessie doorloopt zolang de pagina zichtbaar blijft.
- [ ] Het bedieningspaneel of meldingencentrum even openen en weer sluiten. Noteer of de pagina `hidden` meldt.
- [ ] Wake Lock wordt vrijgegeven door de batterijbesparing (zet die aan tijdens een sessie). De app vraagt opnieuw en het scherm blijft aan, of de app toont de melding over het scherm.
- [ ] Herladen tijdens een sessie. Eerst verschijnt de waarschuwing; na herladen zie je de afbreekuitleg met `hidden`.
- [ ] Een tweede tabblad met de app openen tijdens een sessie. Je ziet "Je sessie loopt in een ander tabblad" en er komt geen tweede start.

### Netwerk (spec §4.1, architectuur §4.7)

- [ ] Vliegtuigmodus 2–3 minuten tijdens een zichtbare sessie. De sessie loopt door (offlinestrook) en wordt na herstel voltooid en gemarkeerd met H3 (zie de beheerwachtrij).
- [ ] Vliegtuigmodus 6 minuten. De app toont direct een afbreking; daarna geeft de server `heartbeat_gap`.
- [ ] Wisselen van wifi naar mobiele data tijdens een sessie. De sessie loopt door.

### Inloggen in de Home Screen-app (spec §3.1, architectuur §10.1)

- [ ] In de Home Screen-app (iPhone) of PWA (Android) een inloglink aanvragen. De link in de mail opent in Safari of Chrome, niet in de app. Vul daarom de **code** in de app in; daarna ben je in de app ingelogd.
- [ ] De link openen in de mailapp-preview, zonder op "Inloggen" te tikken, en daarna de code gebruiken. De code werkt nog (een scanner verbruikt niets).
- [ ] Na 15 minuten is de code verlopen en zie je de melding voor `CODE_EXPIRED`.

### Link vanuit de in-app browser van Instagram (spec §3.1 O1)

- [ ] Een uitnodigingslink (`/i/<token>`) in een Instagram-DM of -bio zetten en openen. De in-app browser toont de welkomstpagina, met de tip om de link in je eigen browser te openen; de uitnodiging blijft staan.
- [ ] Doorgaan in de in-app browser tot "Check je mail" en dan met de code verder in Safari of Chrome. De uitnodiging en de squad kloppen.

### Kaart delen als PNG (spec §4.8, architectuur §9.5)

- [ ] Na een voltooide sessie een kaart maken (formaat 9:16 en vierkant). Het deelmenu opent met een PNG-bestand, niet met een link of SVG.
- [ ] Delen naar WhatsApp en naar Instagram Stories. Het beeld is scherp, de tekst leesbaar en er staan geen punten op.
- [ ] Zonder Web Share met bestanden (oudere browser): "Opslaan" downloadt een PNG.
- [ ] De verificatielink op de kaart openen in een privévenster. Je ziet datum en duur zonder kloktijden, met `noindex`.

### Installatie en offline (architectuur §9.4)

- [ ] Installeren als app (Android: installatieprompt of menu; iPhone: Zet op beginscherm). Icoon, naam en themakleur kloppen.
- [ ] De geïnstalleerde app offline openen. De app-shell laadt, je ziet de offlinestrook en er staat geen oude data als "actueel".
- [ ] Na een nieuwe versie (deploy) wordt de update pas actief buiten een sessie.

## Resultaten

| Datum | Tester | Toestel en browser | Afwijkingen (regel en omschrijving) | Issue |
|---|---|---|---|---|
| | | | | |

Een afwijking bij Wake Lock, zichtbaarheid of inloggen blokkeert R1. Leg die vast als issue bij de eigenaar van `platform/` (WP-8) of de inlogflow (WP-3/WP-8).
