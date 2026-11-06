# Review: correctheid tegenover de spec

Reviewer: onafhankelijk, lens "correctheid tegenover de spec" (spec §4.1, §4.2, §4.4, §4.6, §5, §6.3). Datum: 5 november 2026.

Werkwijze: ik heb de code van `packages/core` en `apps/api` gelezen naast de spec. Waar een bevinding van gedrag afhangt, heb ik dat nagespeeld met tijdelijke Vitest-scenario's op de WP-4-harness (echte routes, echte database). Die scenario's heb ik daarna weer verwijderd. `pnpm -F @rewarded/core test` geeft 391/391 groen. In `pnpm -F @rewarded/api test` slagen alle eigen tests. Eén test faalt: `test/zz-sec-probe-tmp.test.ts`, een tijdelijk bestand van een andere reviewer, dus niet van de codebase.

Ernst: **blocker** = fout gedrag in de kernflow of schending van een harde randvoorwaarde; **major** = fout gedrag buiten de kernflow of een ontbrekende regel; **minor** = klein.

## Bevindingen

### 1. Blocker: de bonus- en rustarm worden niet per focusdag bepaald, en een squad-aansluiting werkt direct in plaats van vanaf de eerstvolgende maandag

- **Bestand:** `apps/api/src/modules/points/context.ts:122-134` (`defaultArms`) en `apps/api/src/db/services/experiments.ts:156-183` (`armsFor`)
- **Wat er fout is:**
  - `defaultArms` negeert de focusdag. Het neemt als eenheid de squad waar de gebruiker *nu* lid van is en leest daarvan de armen.
  - `armsFor` past wissels toe op `this.today()`, niet op de dag die geboekt wordt.
- **Gevolg 1:** wie op woensdag bij een squad komt, krijgt meteen de bonusarm van die squad. De `arm_switch` met `effective_from_day` = volgende maandag verandert daar niets aan, omdat de squad-eenheid die arm al geeft. Spec §5 Toewijzing en §4.13 zeggen: "vanaf de eerstvolgende maandag".
- **Gevolg 2:** elke herberekening van een oudere dag gebruikt de armen van vandaag. Dat geldt voor een vlagbesluit, een `restore`, een beroep en een dagafsluiting na een wissel. Ook `arm_b_stopped` werkt daardoor met terugwerkende kracht op al geboekte B-dagen.
- **Waarom dat ernstig is:** het grootboek en de experimentanalyse (eerst toegewezen arm, §7.3) raken uit elkaar.
- **Tests die iets anders testen:**
  - `apps/api/test/wp3/experiments-events.test.ts:79` ("switchArm from join takes effect from the next Monday") test de wissel op een **solo**-eenheid. Na een aansluiting is de eenheid in productie de squad.
  - De WP-4-harness (`apps/api/test/wp4/harness.ts:81`) vervangt `pointsContext.arms` door een vaste map. Geen enkele puntentest raakt dus de echte armbepaling.
- **Fix:**
  - Geef `arms(db, userId, day)` een echte dagresolutie: kies de eenheid van het lidmaatschap dat op `day` geldt, met `effective_from_day` van de join-wissel, en zet `armsFor` op `day` in plaats van `today()`.
  - Voeg een integratietest toe: een solo A-lid sluit woensdag aan bij een B-squad; woensdag tot en met zondag blijven A, en maandag wordt het B.

### 2. Major: een arm-B-weekbudget bij een instroom midden in de week van een bestaande gebruiker blijft deels eeuwig "in afwachting"

- **Bestand:** `apps/api/src/modules/points/ledger.ts:184` (`ensureWeekGrant`)
- **Wat er fout is:** het budget wordt berekend vanaf `max(registratiedag, maandag)`. Is iemand pas op donderdag in arm B (door bevinding 1 of doordat de vlag `arm_b` midweeks aangaat), dan wordt toch 140 geboekt. Alleen donderdag tot en met zondag krijgen een secure of lapse.
- **Nagespeeld:** gebruiker 30 dagen oud, eerste B-dag donderdag 10 december, sessie van 25 minuten en dagafsluitingen tot en met zondag. Resultaat: `pending_goal_budget = 60` blijft staan.
- **Waarom dat fout is:**
  - Spec §5 zegt bij instroom midweeks "20 × resterende dagen".
  - Spec §4.2 zegt dat de verplichting altijd controleerbaar moet zijn.
  - De student ziet 60 punten "in afwachting" die nooit vrijkomen.
- **Fix:** reken het budget vanaf de eerste focusdag van de week waarop de gebruiker in arm B zit, niet vanaf de registratiedag. Laat daarnaast bij de weekafsluiting de rest van `pending_goal_budget` vervallen (`goal_budget_lapse` met reden `week_end`) als vangnet.

### 3. Major: een dagdoel kan voor de nog niet afgesloten dag van gisteren worden verlaagd

- **Bestand:** `apps/api/src/modules/points/context.ts:146-151` (`goalFor`), samen met `apps/api/src/modules/points/index.ts:156-160`
- **Wat er fout is:** `goalFor` vertrouwt alleen een *afgesloten* `user_day`. Voor alle andere dagen leest het het huidige profiel. Een tweede doelwijziging tussen 04:00 en de dagafsluiting om 05:45 schrijft de uitstaande wijziging naar `daily_goal_min`. Daarna rekent de dagafsluiting van gisteren met dat nieuwe doel.
- **Nagespeeld:**
  - Doel 120, woensdag om 21:00 een sessie van 25 minuten.
  - Woensdag zet de gebruiker het doel op 25 (geldt vanaf donderdag).
  - Donderdag om 04:20 zet hij het op 50.
  - Resultaat: de dagafsluiting van woensdag geeft `goal_min 25`, `goal_met 1` en +20 doelbonus.
- **Waarom dat fout is:** spec §4.4 zegt: "wijziging geldt vanaf de volgende dag — niemand verlaagt op het laatste moment om de streak te redden". Hier gebeurt precies dat, met bonus en squadstreak.
- **Fix:** sla de doelgeschiedenis op (wijziging plus `effective_from`) en bepaal het doel met de al bestaande, ongebruikte `goalForDay` uit `packages/core/src/goals/index.ts:20`. Of: leg `goal_min` vast in `user_day` bij het eerste schrijven van de dag en gebruik die waarde ook als de dag nog niet is afgesloten.

### 4. Major: `restore_session` gooit H1, H3 en H4 weg en zet de punten direct op beschikbaar

- **Bestand:** `apps/api/src/modules/sessions/engine.ts:240-244`
- **Wat er fout is:** bij een herstel wordt `flags: []` en `review_status = 'none'` geschreven. De vlaggen uit `v.flags` worden nooit via `flags.raise` gemeld.
- **Nagespeeld:** een sessie met `webdriver: true` breekt af op `heartbeat_gap`. Daarna volgen een storing en een herstel. Resultaat: `flag_codes: []` en 25 punten direct beschikbaar, zonder H1.
- **Waarom dat fout is:** spec §6.3 en §6.4 zeggen dat gemarkeerde sessies tot het besluit *in afwachting* blijven. Een herstel na een storing omzeilt dat.
- **Fix:** voer in `restore` dezelfde stap uit als in `complete`. Neem `v.flags` over, schrijf `flag_codes`, zet `review_status = 'pending'` als er vlaggen zijn, en roep `flags.raise` aan vóór `reconcileDay`.

### 5. Major: afbreekcode `late_end` komt in de praktijk nooit voor; de sweep geeft `heartbeat_gap`

- **Bestand:** `packages/core/src/session/verify.ts:180-183`
- **Wat er fout is:** zonder eindbericht breekt de sweep op het moment "gepland einde + 10 min" altijd af met `heartbeat_gap` op het laatste contact. Dat gebeurt ook als alle gaten binnen de sessie in orde waren. De sweep draait elke minuut, dus een eindbericht dat later dan 10 minuten binnenkomt, vindt de sessie al gesloten.
- **Nagespeeld:** het laatste heartbeat valt 30 seconden vóór het einde, de sweep draait na 10,5 minuten. Resultaat: `heartbeat_gap` op 24,5 minuten, en het latere eindbericht krijgt `SESSION_CLOSED`.
- **Waarom dat fout is:** spec §4.1 legt de code `late_end` vast ("We kregen je einde te laat binnen") voor precies dit geval. De student ziet nu de verkeerde vaste copy, en support werkt met de verkeerde code.
- **Test die iets anders test:** `apps/api/test/wp4-sessions.test.ts:171` test `late_end` alleen met de opmerking "The sweep would close it first". Daarmee bevestigt de test een pad dat in productie niet bestaat.
- **Fix:** geef in de tak `now >= plannedEnd + graceMs` `late_end` terug (met `at = plannedEnd`) als het laatste segment tot het geplande einde de gaatregels haalt (gat tot het einde ≤ `gap_ok_s`, of gedekt). Gebruik `heartbeat_gap` alleen als er echt een ongedekt gat was.

### 6. Major: H1 detecteert geen headless user agent

- **Bestanden:** `packages/core/src/fraud/rules.ts:50`, `packages/core/src/session/verify.ts:191` en `packages/contracts/src/common.ts:36`
- **Wat er fout is:**
  - `h1HeadlessUaClasses: ['headless']` verwijst naar een UA-klasse die niet bestaat. `UaClass` kent alleen `ios_safari`, `ios_webview`, `android_chrome`, `android_webview`, `desktop` en `other`.
  - `uaClassOf` in `apps/api/src/platform/ua.ts` maakt van "HeadlessChrome" gewoon `desktop`.
  - `h1()` wordt nergens in productie aangeroepen. `flagsFor` kijkt alleen naar `session.webdriver`.
- **Waarom dat fout is:** spec §6.3 H1 zegt: "of de user agent noemt een headless browser".
- **Test die iets anders test:** `packages/core/test/wp6-fraud.test.ts:111` test `uaClass: 'headless'`, een invoer die nooit voorkomt.
- **Fix:** laat de server de ruwe `User-Agent` bij de start toetsen (`/Headless|PhantomJS|Puppeteer|Playwright/`). Bewaar het resultaat als `ua_headless` of als UA-klasse `headless` in de contracten, en laat `flagsFor` `h1()` gebruiken.

### 7. Major: H12 en H6 hangen latere sessies van dezelfde week niet meer aan de vlag

- **Bestand:** `apps/api/src/modules/fraud/lib/batch.ts:98`, met dedupsleutels in `packages/core/src/fraud/heuristics.ts` (`H12:${week}:${ip}:${ua}` en `H6:${userId}:${week}`)
- **Wat er fout is:** de dagafsluiting draait H12 en H6 over de week tot dan toe. Bij de eerste treffer, bijvoorbeeld woensdag, ontstaat de vlag. Op de volgende dagen en bij de weekafsluiting bestaat de dedupsleutel al, en `persistFindings` slaat de bevinding dan over. Sessies van donderdag tot en met zondag van dezelfde groep worden dus niet `pending` en worden direct beschikbaar geboekt.
- **Waarom dat fout is:** spec §6.3 en §6.4 zeggen dat gemarkeerde sessies *in afwachting* staan tot het besluit.
- **Fix:** koppel bij een bestaande dedupsleutel de nieuwe `sessionIds` alsnog aan die vlag (`INSERT OR IGNORE INTO fraud_flag_session`) en zet ze op `pending` zolang de vlag open is. Een alternatief is een dedupsleutel per dag.

### 8. Minor: de intensiteit van de challenge telt geboekte punten in plaats van gecapte geverifieerde minuten

- **Bestand:** `packages/core/src/challenges/index.ts:114`
- **Wat er fout is:** de intensiteit gebruikt `countedMinFinal`, de minuten waarvoor punten zijn geboekt. In de rustperiode-arm is dat 0, omdat `allocateCap` daar niets boekt.
- **Waarom dat fout is:**
  - Spec §4.6 definieert de intensiteit als "gemiddelde gecapte geverifieerde minuten per actief lid per dag (plafond 300)".
  - De aprilchallenge moet "voor beide rustperiode-armen gelijk" zijn, en intensiteit is de tweede sorteersleutel in `rankPools`.
- **Fix:** geef in `memberDays` `min(verifiedMin van finale sessies, 300)` mee en reken de intensiteit daarover, los van de puntenboeking.

### 9. Minor: `rest_period.first_day` in v1 wijkt af van T + 1

- **Bestand:** `packages/core/src/params/v1.ts:69`
- **Wat er fout is:** v1 zegt `first_day: '2027-01-19'`, maar de standaardkalender heeft T = 17 januari. De rustperiode begint dus op T + 1 = 18 januari (spec §4.2, §4.13). `calendarDates` rekent goed, maar de terugvalwaarde in `earnArmFor` en `isRestPeriodDay` leest de oude datum.
- **Fix:** verwijder `rest_period.first_day` uit de parameters, zoals spec §4.13 vraagt ("geen vaste data meer"). Zolang die er nog staat: zet hem op `2027-01-18`, en maak `restPeriod` in `EarnArmInput` verplicht.

## Gecontroleerd en in orde

- Gatregels uit spec §4.1:
  - ≤ 90 s telt;
  - een gat ≤ 5 min met dekkend log telt;
  - een gat > 5 min wordt afgebroken;
  - `hidden` in een gat breekt af op het tijdstip van `hidden`;
  - bij een storing gaat de sessie naar review;
  - H3 bij > 10 % gedekte gaten.
- Einde ≥ duur − 30 s, `second_session` en `user_stop`.
- Nachtregel 01:00–04:00 (wel punten, geen doelbonus, ook geen secure in arm B).
- Dagplafond 300 met minuten daarboven voor het dagdoel.
- Tentamendag:
  - stil vervallen in arm B;
  - in arm A alleen een bonus bij een gehaald doel;
  - telt niet mee voor de deelnamegraad;
  - hoogstens 3 per week.
- Inverdienperiode op sessieminuten zonder open of afgekeurde vlag.
- Wachttijd van 7 dagen en 1 verzilvering per week vanaf maandag 04:00.
- Squadstreak met ceil(½) en minimaal 2, joker 1 per week, bevriezen onder 3 actieve leden, herstel na 2 dagen.
- Automatische pauze na 7 dagen, terug vanaf de dag na de sessie.
- Noemer van de deelnamegraad max(ledental, gekoppeld bij het begin van de week); het anker telt tot het einde van de week.
- H2, H5, H9 en H10 volgens de drempels.
