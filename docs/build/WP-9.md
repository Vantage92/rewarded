# WP-9 Web features voor studenten — bouwrapport

*5 november 2026. Bouwer WP-9. Niet gecommit; dat doet de orchestrator. Bronnen: productplan §0–§4, spec §3.4–3.12, §4.2–4.10, §4.12, §8; UX §1, §2, §3.4–3.7, §4.4–4.10, §6; architectuur §2, §9, §11, §12.*

## Wat af is

Alle schermen werken tegen de getypeerde client. Elke feature heeft een `mock.ts` voor de mock-modus (`VITE_API_MODE=mock` of `?api=mock`).

**Gedeelde bouwstenen** staan in `features/profile/kit.tsx` en `kit.css`:
- `Screen`: steeds één h1;
- `Skeleton` en `ErrorNote`: de toestanden uit UX §3.1;
- `useMe`: zet ook de modus zonder punten in de shell;
- `useTrack`: client-events, fouten worden ingeslikt;
- `idempotencyKey`, `formatDate` (Europe/Amsterdam) en `DayDots`.

Web Share met terugval naar kopiëren staat in `features/cards/share.ts`.

**Beloningen** (`/punten`, `/punten/catalogus`, `/punten/geschiedenis`, `/punten/bonusregel`):
- **B1, saldo en catalogus**:
  - het saldo in drie delen; de regel "in afwachting" noemt in arm B ook het weekbudget, en referral staat er alleen met de vlag aan;
  - de inverdienvoortgang met "Nog 88 minuten focus…", de wachttijd met datum en de copy voor het weekplafond;
  - de disclaimer en "Deze week 40 beloningen voor 120 studenten…";
  - collectieve beloningen bovenaan;
  - "Vandaag op. Morgen komt er weer een deel bij." of "Deze week op.";
  - elke uitgeschakelde knop heeft een reden; er staat nergens een eurowaarde.
- **B2, verzilveren**: wat er afgaat en wat er overblijft, een `Idempotency-Key`, en copy per blokkeerreden: inverdien, wachttijd, week, maand met de datum, voorraad, saldo en referral-aandeel.
- **B3, telefoonverificatie**: na `PHONE_NOT_VERIFIED`, met `autocomplete="one-time-code"` en de copy voor VoIP-nummers en nummers die al in gebruik zijn.
- **B4, voucher**: kopiëren en "Werkt niet". De lijst "Je codes" staat er ook.
- **Verder**: het journaal met paginering, B7 Bonusregel met de tekst uit spec §5 "Transparantie", de modus zonder punten en het event `catalog_viewed`.

**Squad** (`/squad`, `/squad/nieuw`, `/squad/vergelijken`):
- **Q1, squadoverzicht**:
  - streak, "in opbouw" ("Nog 2 vrienden nodig"), "bevroren" onder 3 actieve leden en streakherstel met de oude lengte;
  - de squaddag over de actieve leden: de helft naar boven afgerond, minstens 2;
  - leden op pauze apart, en de joker in één regel;
  - aanwezigheid met polling elke 30 seconden, zonder namen ("1 van 3 focussen nu", "Iemand focust nu (nog 32 minuten)"), en het event `presence_viewed`;
  - de Belofte-regels van jezelf en van getuigen, met Q7 als sheet (event `belofte_witness_viewed`);
  - minuten vergelijken alleen met opt-in;
  - "Naam melden" met een reden, en een squad verlaten met een modal.
- **Q2 en Q3**:
  - de zichtbaarheidsregel staat boven de knop;
  - de uitnodigingstekst noemt geen punten of prijzen;
  - Web Share, en anders alleen kopiëren; het event `invite_share_opened`;
  - "Nodig uit" verdwijnt bij zes leden.
- **Voor F1 (WP-8)**: het component `SquadStrip`.

**Duel** (`/duel`):
- uitslag op gehaalde dagen: stippen per dag, "Jij 2, Sem 1", geen minuten;
- open, verlopen, controle en uitslag, met een privébadge en revanche;
- de duellink bestaat alleen voor 18+; voor `16_17` staat er alleen de route via de squad, en geen knop in de DOM.

**Vereniging**:
- **V1** (`/vereniging`, `/vereniging/ranglijst`):
  - leeg met "Code invoeren";
  - de ranglijst toont alleen verenigingen, per poule, met deelnamegraad, intensiteit, ledental met de soort bron, "Doet mee om de eer…" en "Voorlopig";
  - de eigen vereniging is gemarkeerd met `aria-current`;
  - de periode is een aanloopklassement of een prijsperiode; prijzen krijgen "Verdiend";
  - "Hoe rekenen we?" en de oproep om een anker te bevestigen;
  - het event `leaderboard_viewed`, en ontkoppelen.
- **V2** (`/vereniging/koppelen?code=…&bron=…`): koppelen, of een koppeling in afwachting, met de privacyregel.

**Prestatiechallenge** (`/challenges/:id`): vaste plaatsen, inschrijven met idempotentie, "vol" met reden, de voortgang per dag, de status (behaald, gecontroleerd, afgekeurd met beroep) en "Verdiend". Er staat geen eurowaarde en geen kanstaal.

**De Belofte** (`/belofte`):
- het aanbod per trigger, met het event `belofte_offered`;
- de keuzes vooraf ingevuld met het voorstel, en wat getuigen zien;
- zonder squad geen getuigen;
- stoppen met één tik;
- de reflectie ("9 van 12 dagen") met verlengen, aanpassen of stoppen;
- de inzetvraag alleen voor 18+;
- "Er hangen geen punten aan."

**Kaart**:
- **K1** (`/kaart/:id?soort=…`):
  - voornaam en streak staan standaard aan, de focustijd staat er altijd op;
  - de squadnaam alleen met de instelling, anders uit met een reden;
  - formaat 9:16 of vierkant;
  - een voorbeeld uit de server-SVG;
  - de rasterizer (`cards/rasterize.ts`, SVG naar canvas naar PNG) voor Web Share met bestand, en "Opslaan" als download;
  - intrekken, `SESSION_UNDER_REVIEW` en het event `card_share_opened`.
- **K2** (`/v/:token`): de bare-chrome en de meta `noindex`. De tekst zegt wat de kaart niet bewijst, met datum en duur maar zonder kloktijden; verder "niet meer beschikbaar" en "Focus ook".

**Ik**:
- **P1** (`/profiel`):
  - gegevens en dagdoel, geldig vanaf morgen, met de overmoedrem "Begin liever klein";
  - de schakelaars: vergelijken, stille modus (met de minderjarigenregel), squadnaam op kaarten, de modus zonder punten (vlag) en de mailherinnering (vlag);
  - "Meedoen aan het onderzoek" apart, met bevestiging;
  - de instellingsmail met de vingerafdruk-copy en `INSTITUTION_EMAIL_IN_USE`;
  - thema en taal, en links.
- **P2** (`/profiel/privacy`): exporteren als JSON-download, en verwijderen met "VERWIJDER" en een waarschuwing over de punten.
- **P3** (`/profiel/voorwaarden`).
- **R1** (`/profiel/link`, alleen met de vlag `referral`).
- **B8 Plus** (`/profiel/plus`, alleen met de vlag `plus_door`): de enige plek met een eurobedrag.

**Trekkingen** zijn niet gebouwd. `features/draws/routes.tsx` exporteert `[]` als lege plek, dus `/kans` is voor iedereen een onbekende pagina.

**i18n**: `{nl,en}/{points,squads,duels,club,challenges,belofte,cards,profile}.json`. Er is geen `draws.json`.

## Verificatie

- `pnpm -F @rewarded/web test`: 14 bestanden, 280 tests, waarvan **279 geslaagd en 1 gefaald**. De gefaalde test is `test/shell.test.tsx > shows the placeholder for /kans` (WP-0/WP-7, zie bekende problemen). Alle 131 nieuwe WP-9-tests slagen:
  - `test/wp9-points` (20);
  - `wp9-squads` (18);
  - `wp9-social` (21: duel, vereniging, challenge, Belofte);
  - `wp9-cards-profile` (27, inclusief trekkingen);
  - `wp9-copy` (32: pariteit, verboden woorden, geen hardcoded tekst, elke `t()`-sleutel in beide talen, geen punten in uitnodigingen, € alleen bij Plus, geen kans of verloot);
  - `wp9-a11y` (13 schermen met axe zonder ernstige of kritieke fouten, één h1).
- `pnpm -F @rewarded/web typecheck`: geslaagd.
- `pnpm -F @rewarded/web build`: geslaagd.
- `pnpm -F @rewarded/web lint:i18n`: 0 meldingen.
- `npx oxlint --deny-warnings` op de WP-9-features en -tests: 0 meldingen.
- Handmatig gecontroleerd met screenshots in Chromium (mock-modus) van `/punten`, `/squad`, `/vereniging`, `/belofte` en `/profiel`.

## Tegenspraak in de documenten (en wat ik koos)

1. **Trekkingen.** De opdracht vraagt een kans-scherm voor 18+ met spelvoorwaarden, de kans als getal en een opt-out. Productplan §0c.3 en §4, spec §3.9 ("geen flow, scherm, route of job") en UX §4.7 zeggen: niet bouwen. Het productplan gaat voor, dus er is geen scherm. Daardoor faalt de placeholdertest `/kans` van WP-0.
2. **Eigendom van `survey`, tentamendag, schadekaart en rustperiode.** Architectuur §12.1 geeft die aan WP-9, maar de opdracht niet. Ik heb ze niet gebouwd, ook niet P6 "Ik wil weer punten verdienen" en Q9.
3. **Saldo-onderdelen.** UX B1 vraagt aparte regels voor "Weekbudget (nog niet veilig)" en "Wordt nagekeken". Het contract kent één `pending`. Ik toon één regel, met een label per arm.
4. **"Kans" en "loting".** Spec §3.8 zegt "geen race, geen loting", maar UX §6.1 regel 5 wil geen kanstaal. Ik schrijf "Geen race: elke plaats heeft een prijs."
5. **Gelijkspel.** De Engelse "draw" (gelijkspel) botst met de lintregel tegen trekkingstaal. Ik gebruik "tie".

## Interface-notities

- **Bevroren lagen niet gewijzigd** (core, contracts, services). Gedeelde bestanden zijn niet bewerkt.
- **Tests staan in `apps/web/test/wp9-*.test.*` en `test/wp9/helpers.tsx`.** Dat zijn nieuwe bestanden buiten `features/`, omdat de vitest-config alleen `test/**` draait (net als WP-2 deed).
- **Contractgaten**, omdat er geen route of veld voor bestaat:
  - `SquadMember` heeft geen `member_ref` en presence heeft geen naam, dus een `16_17` kan niet zelf een squadlid uitdagen (`duels.create` zonder ref geeft `AGE_RESTRICTED`). Nodig: `member_ref` in `SquadMember`;
  - er is geen route voor `rest_period_exit` (P6, Q9);
  - `BelofteOffer` heeft geen datum van de bonusstop en onderscheidt het tweede vroege aanbod niet. De copy is daarom generiek ("De doelbonus stopt binnenkort.");
  - `SquadMember` heeft geen joker per lid en geen stille modus per lid;
  - er zijn geen route en velden voor badges in P1 en geen tijdkiezer voor herinneringen (P5); alleen de schakelaar staat er;
  - Q8 (hersamenstellen of samenvoegen) en de vakantiepauze-status van een squad staan niet in `squads.mine`;
  - na een reflectie blijft `beloftes.current` op `completed`, waardoor de reflectie terugkomt. Nodig: een `reflected`-status of `next_offer`.
- **Voor WP-8:**
  - `SquadStrip` is te gebruiken in de home (F1);
  - de modus zonder punten wordt nu alleen gezet door schermen die `useMe()` aanroepen. De home zou dat ook moeten doen.
- **Mock-modus:** feature-mocks voor `points.balance`, `catalog.list`, `squads.presence`, `squads.beloftes`, `challenges.list`, `leaderboards.get`, de Belofte (in geheugen), challenge-progress en `cards.image`.

## Niet gedaan

- Het kans-scherm (zie tegenspraak 1).
- Vanwege de contractgaten hierboven: P5 Herinneringen met tijd en dagen, Q8 Hersamenstellen, Q9 en P6 Rustperiode, badges in P1, en het squadlid kiezen voor een duel (`16_17`).
- Bonusregel-varianten per moment (F1/F5) en de joker-toast: die horen bij de focusweergave van WP-8.

## Bekende problemen

- **`test/shell.test.tsx` "shows the placeholder for /kans" faalt.** Die test (WP-0/WP-7) verwacht een h1 "Kans" op `/kans`. Een skip toevoegen kan niet zonder hun bestand te bewerken. Oplossing voor de eigenaar: haal `['/kans', 'Kans']` uit de `it.each`, of verwacht "Pagina niet gevonden".
- **De hoofdbundel is 783 kB.** Een deel daarvan komt van parallelle WP-8-features; splitsen per route (lazy) is een vervolgstap.
- **Inhoud die later verschijnt.** Onderdelen die van `/me` afhangen (inzetvraag, duellink, schakelaars) verschijnen pas als `/me` geladen is.
