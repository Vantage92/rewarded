# Technische verificatie van focus en fraudebestendigheid

*Rewarded, rol: technisch architect (mobiele platforms en anti-fraude). Versie 2, 4 november 2026, herzien na verificatie door drie sceptici (zie Verificatie).*

## Samenvatting

1. Een web-MVP kan één ding eerlijk bewijzen: deze pagina stond zichtbaar op het scherm van één browser, van tijdstip A tot tijdstip B. Dat de telefoon niet gebruikt is, kan de web-MVP niet bewijzen. Het bewijs is ook goedkoop te vervalsen met een tweede apparaat, een emulator of een headless browser.
2. De technische randvoorwaarde in `docs/pitch/README.md` klopt op de kern. Eén detail is verouderd: sinds iOS 18.4 werkt Wake Lock volgens MDN ook in geïnstalleerde webapps.
3. Op iOS krijgt een app via de Screen Time API **geen** gebruiksduur van andere apps als data. Die cijfers blijven opgesloten in een rapport-extensie die niet mag netwerken. Bruikbaar zijn wel blokkades (ManagedSettings) en drempel-callbacks (DeviceActivityMonitor). Een beloning moet op die mechanismen rusten, niet op meting. De blokkade is daarbij de stevigste basis: drempel-callbacks gaan op iOS 26.x en iOS 27 volgens ontwikkelaars soms onterecht direct af, en Apple heeft daar nog geen bevestigde oplossing voor.
4. Android geeft via `UsageStatsManager` en de permissie `PACKAGE_USAGE_STATS` wél gebeurtenissen per app en scherm. Dat is het sterkste meetbare signaal van alle platforms. Het is ook privacygevoelig, en het Play-beleid hiervoor heb ik niet kunnen verifiëren.
5. App Attest en Play Integrity bewijzen dat er een echte app op een echt toestel draait. Ze bewijzen niet dat er een mens achter zit en ook niet dat die mens gefocust was.
6. Advies: koppel de beloning aan de bewijssterkte met een ladder van vier treden, en betaal **geen** geld uit voor bewijs uit alleen de web-MVP. De vierde trede (eigen inzet en geldprijzen) vraagt native code, attestatie, plafonds per toestel en steekproeven door mensen.

## Leeswijzer en betrouwbaarheid

Labels: **[Feit]** met bron-URL, **[Inschatting]** voor mijn redenering op basis van bronnen, **[Speculatie]** voor een hypothese, en **niet geverifieerd** als ik geen primaire bron kon openen.

Werkwijze: de documentatie van Apple heb ik gelezen via de JSON-bron van developer.apple.com, die van Android via developer.android.com. MDN-tekst en browsercompatibiliteit kwamen uit de officiële GitHub-repositories van MDN (`mdn/content`, `mdn/browser-compat-data`). Ik verwijs naar de leesbare MDN-pagina's. In deze sessie waren support.google.com, apps.apple.com, developer.chrome.com en de helpsites van concurrenten geblokkeerd. Voor het Play-beleid, de App Store-beschrijvingen en de werkwijze van concurrenten moest ik daarom op zoekresultaatsamenvattingen leunen. Dat staat er telkens bij. Controleer die punten voordat ze extern gebruikt worden.

---

## 1. iOS: de Screen Time API

### 1.1 Entitlement en aanvraag

**[Feit]** Een app die Family Controls gebruikt, heeft de entitlement `com.apple.developer.family-controls` nodig. Vóór distributie moet de Account Holder van het ontwikkelaarsaccount die aanvragen via een formulier van Apple of via het tabblad Capability Requests in Certificates, Identifiers & Profiles. Elke Screen Time-extensie (Device Activity Monitor, Device Activity Report, Shield Action, Shield Configuration) vraagt een eigen aanvraag. Apple beoordeelt de app en toont na goedkeuring de status "Assigned". (https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement) **[Niet geverifieerd]** Volgens één zoeksamenvatting melden ontwikkelaars inmiddels dat Apple de entitlement op teamniveau toekent, voor alle bundle ID's tegelijk. Als dat klopt, weegt de aanvraag per extensie in de praktijk minder zwaar. Ik heb geen bron gevonden die dat bevestigt.

**[Feit]** Voor gebruik door een volwassene op het eigen toestel bestaat een individuele autorisatie: de gebruiker keurt goed met Face ID of Touch ID. Bij kinderen keurt een ouder uit dezelfde Family Sharing-groep goed. De autorisatie kan later wijzigen of worden ingetrokken. (https://developer.apple.com/documentation/familycontrols/authorizationcenter)

**[Feit, secundair]** Apple publiceert geen behandeltermijn. Op de Apple-forums melden individuele ontwikkelaars lange wachttijden. In mei 2026 wachtte iemand naar eigen zeggen al zes weken tot bijna twee maanden zonder enige reactie, ook niet via Developer Support (https://developer.apple.com/forums/thread/827666). Een ander had op 2 juni 2026 aangevraagd en na vier dagen nog niets gehoord (https://developer.apple.com/forums/thread/829398). Zoekresultaten noemen meer draadjes met drie tot vier weken of langer (onder meer 827132 en 826340, niet volledig gelezen). Dat zijn ervaringen van individuen, geen beleid. **[Inschatting]** Vraag de entitlement dus aan zodra er een Apple-account en een bundle ID zijn, lang voordat de native app af is.

**[Feit]** Richtlijn 4.10 van de App Review Guidelines verbiedt "monetize ... Apple services and technologies, such as ... Screen Time APIs" (https://developer.apple.com/app-store/review/guidelines/). **[Inschatting]** Opal en vergelijkbare apps vragen gewoon een abonnement. Het verbod lijkt dus te gaan over het doorverkopen van de API-functie zelf, niet over een product dat de API gebruikt. Rewarded koppelt geld direct aan Screen Time-signalen. Leg de opzet daarom vóór indiening voor aan iemand met ervaring met App Review: dit is een reëel afwijzingsrisico.

### 1.2 Wat een app wel en niet kan lezen

| Onderdeel | Wat het doet | Kan Rewarded de gegevens naar de server sturen? | Bron |
|---|---|---|---|
| FamilyControls (`AuthorizationCenter`, `FamilyActivitySelection`) | Autorisatie; de gebruiker kiest apps, categorieën en domeinen in een systeemkiezer | Alleen ondoorzichtige tokens, geen app-namen | https://developer.apple.com/documentation/familycontrols/familyactivityselection |
| ManagedSettings | Apps of categorieën afschermen ("shield"), instellingen beperken | Niet van toepassing: het is een handeling, geen meting | https://developer.apple.com/documentation/managedsettings |
| DeviceActivity (`DeviceActivityCenter`, `DeviceActivityMonitor`) | Schema's en drempels; het systeem roept de extensie aan bij het begin en einde van een interval en bij `eventDidReachThreshold` | Ja, het feit dát een drempel is bereikt. De extensie zelf mag mogelijk niet netwerken (**niet geverifieerd**); de hoofdapp kan het doorsturen | https://developer.apple.com/documentation/deviceactivity/deviceactivitycenter |
| DeviceActivityReport (rapport-extensie) | Toont gebruiksduur per app of categorie als SwiftUI-weergave | **Nee.** Draait in een sandbox zonder netwerk die gevoelige inhoud niet buiten de extensie laat | https://developer.apple.com/documentation/deviceactivity/deviceactivityreport |

**[Feit]** Apple schrijft over de rapport-extensie: "To protect the user's privacy, your extension runs in a sandbox. This sandbox prevents your extension from making network requests or moving sensitive content outside the extension's address space." (https://developer.apple.com/documentation/deviceactivity/deviceactivityreport). Een DTS-engineer van Apple bevestigt op het forum dat dit opzet is: de extensie draait in een sandbox met alleen leesrechten. Een ontwikkelaar probeerde het dagtotaal voor een ranglijst naar de hoofdapp te krijgen, via App Groups, gedeelde UserDefaults, een bestand in een gedeelde container en CFPreferences. Niets daarvan werkte. Het antwoord van Apple noemt App Groups niet bij naam, maar de uitleg over de sandbox met alleen leesrechten dekt alle vier de routes (https://developer.apple.com/forums/thread/817516). De hoofdapp krijgt via DeviceActivityMonitor wel drempel-callbacks. Dat is een signaal, geen gebruiksduur als data. **[Feit]** `ApplicationToken` en `FamilyActivitySelection` bevatten ondoorzichtige waarden zonder toegang tot persoonsgegevens (https://developer.apple.com/documentation/managedsettings/applicationtoken).

**[Feit]** DeviceActivity meet hoe lang een app, categorie of webdomein vooraan op het scherm staat (https://developer.apple.com/documentation/deviceactivity/deviceactivityevent).

**Wat dit betekent voor "telefoon niet gebruikt".** **[Inschatting]** Rewarded kan op iOS geen schermtijd uitlezen en die belonen. Er zijn twee bruikbare constructies:

1. **Blokkeren in plaats van meten.** Tijdens de sessie schermt ManagedSettings de door de gebruiker gekozen apps af. De beloning hoort dan bij "de sessie liep met blokkade actief en werd niet afgebroken". Dat is wat Opal, Jomo en Brick verkopen.
2. **Drempel als verklikker.** Plan een `DeviceActivitySchedule` voor de sessie met een `DeviceActivityEvent` op de geselecteerde apps of categorieën en een lage drempel, bijvoorbeeld één minuut. Komt er een threshold-callback, dan is er tijdens de sessie gebruikt en vervalt de beloning. Drie kanttekeningen:
   - **[Feit, forum]** Volgens een Apple-engineer telt de drempel het gebruik vanaf de `intervalStart` van het schema. Een schema dat om 00:00 begint, telt dus het gebruik van eerder die dag mee en kan direct bij de start afgaan (https://developer.apple.com/forums/thread/727970, 2023). Dat is gedocumenteerd gedrag, geen fout. Laat het schema daarom precies bij het begin van de sessie starten.
   - **[Feit, forum]** Daarnaast bestaat er een echte fout. Sinds iOS 26 gaat `eventDidReachThreshold` soms binnen enkele seconden af, ook met `includesPastActivity = false`. Ontwikkelaars melden dit op iOS 26.0 tot en met 26.2 (bèta), 26.4.2, 26.5, 26.6 en in augustus 2026 ook op iOS 27. Eén ontwikkelaar ziet enkele honderden te vroege callbacks per dag in zijn analytics. Een DTS-engineer van Apple bevestigt dat het team de fout kent (FB18061981), maar er is geen bevestigde oplossing (https://developer.apple.com/forums/thread/808470). Ook dubbel afgaan voor dezelfde drempel is gemeld, in meer dan de helft van de gevallen bij één ontwikkelaar; iOS-versie onbekend, geen reactie van Apple (https://developer.apple.com/forums/thread/741133, 2023). Dat callbacks helemaal niet afgaan, wordt in die draadjes alleen terloops genoemd; daar heb ik geen eigen bron voor gelezen (**niet geverifieerd**).
   - **[Inschatting]** Dit werkt in twee richtingen. Een callback bewijst niet langer zeker gebruik: op iOS 26.x en 27 kan hij onterecht komen. Behandel een callback daarom als signaal om te controleren (bijvoorbeeld de lokaal bijgehouden sessietijd naast het moment van de callback leggen, zoals een ontwikkelaar in 808470 voorstelt), niet als automatisch verlies van de inzet. En het uitblijven van een callback bewijst geen niet-gebruik. Voor een geldbeloning is deze constructie dus alleen bruikbaar naast de blokkade van constructie 1, met bezwaar en menselijke beoordeling.

**[Inschatting]** Een groot zwak punt: de gebruiker kan Screen Time-toegang voor de app met Face ID intrekken. Opal-gebruikers melden precies dat (https://community.opal.so/t/how-do-we-prevent-turning-off-screen-time-access/488, secundair). Rewarded moet de autorisatiestatus daarom vóór en na elke sessie controleren. Intrekken tijdens een sessie telt als afbreken.

### 1.3 Hoe concurrenten het op iOS doen

| App | Mechanisme volgens eigen uitleg of beschrijving | Wat het bewijst | Bron en status |
|---|---|---|---|
| **Opal** | Bouwde de dienst met iOS 16 opnieuw op ManagedSettings; daarvoor een VPN | Blokkade actief; geen bewijs van niet-gebruik | TechCrunch https://techcrunch.com/?p=2396771 ; Opal-help (zoeksamenvatting) https://help.opalapp.com/v3/why-do-you-need-to-grant-screen-time-api-access |
| **one sec** | Shortcuts-automatiseringen detecteren het openen van een doel-app en tonen een interventie; Screen Time API voor harde afscherming | Openmoment van specifieke apps (via Shortcuts), afscherming | Eigen tutorial https://tutorials.one-sec.app/en/articles/10336706 ; blog https://one-sec.app/blog/introducing-one-sec-2.0 (zoeksamenvatting) |
| **Jomo** | Volgens de App Store-beschrijving de Screen Time API voor blokkeren; claimt geen zicht op gebruikte apps | Blokkade | https://apps.apple.com/app/id1609960918 (zoeksamenvatting) |
| **Brick** | Fysieke NFC-tag: tikken schakelt een blokkade via Screen Time in of uit; vijf noodontgrendelingen per toestel | Fysieke handeling bij de tag; blokkade | Reviews https://www.irishtimes.com/technology/consumer-tech/review/2025/11/13/brick-review-this-simple-device-helped-me-halve-my-screen-time ; eigen documentatie **niet geverifieerd** |
| **Forest** | "Staying off your phone grows a tree", vroeg vertrekken laat hem verwelken; Allow Lists vanaf iOS 16 blokkeren apps die niet op de lijst staan; op iOS 15 en lager verwelkt de boom zodra je Forest verlaat | Voorgrondtijd van Forest zelf; vanaf iOS 16 ook een blokkade | App Store https://apps.apple.com/us/app/id866450515 (zoeksamenvatting) |

**Forest: "app verlaten = boom sterft".** **[Inschatting]** De oorspronkelijke iOS-methode is voorgronddetectie: gaat Forest naar de achtergrond, dan is de sessie mislukt. Daar zitten vier beperkingen aan. (a) Forest ziet niet wat je daarna doet. Een melding wegvegen, het bedieningspaneel openen of de camera starten vanaf het slotscherm wordt verschillend behandeld, en dat is moeilijk te onderscheiden van echt afhaken. (b) Het scherm vergrendelen moet toegestaan zijn, anders kan niemand de telefoon wegleggen. Een iOS-app kan vergrendeling alleen indirect herkennen, bijvoorbeeld via `protectedDataWillBecomeUnavailableNotification`. Die werkt alleen als er een toegangscode is ingesteld (https://developer.apple.com/documentation/uikit/uiapplication/protecteddatawillbecomeunavailablenotification). Hoe Forest dit precies doet, is **niet geverifieerd**. (c) Een tweede apparaat, zoals een iPad of laptop, valt buiten beeld. (d) Bij een virtuele boom is valsspelen goedkoop en onschuldig. Bij geld wordt het een businessmodel. De Allow List vanaf iOS 16 maakt van Forest een blokkade-app, met dezelfde grenzen als Opal.

---

## 2. Android

### 2.1 UsageStatsManager en `PACKAGE_USAGE_STATS`

**[Feit]** `UsageStatsManager` geeft gebruiksgeschiedenis en statistieken. Voor de meeste methoden is `android.permission.PACKAGE_USAGE_STATS` nodig. De gebruiker moet die permissie zelf aanzetten in Instellingen (`Settings.ACTION_USAGE_ACCESS_SETTINGS`); het is geen gewone runtime-prompt. Methoden die alleen de eigen app betreffen, zoals `queryEventsForSelf`, hebben de permissie niet nodig (https://developer.android.com/reference/android/app/usage/UsageStatsManager ; https://developer.android.com/reference/android/Manifest.permission#PACKAGE_USAGE_STATS). Twee beperkingen uit dezelfde referentie: het systeem bewaart gebeurtenissen maar een paar dagen ("Events are only kept by the system for a few days"), en sinds Android 11 (R) geeft `queryEvents` `null` terug zolang het toestel vergrendeld is.

**[Feit]** `UsageEvents.Event` kent onder meer `ACTIVITY_RESUMED`, `ACTIVITY_STOPPED`, `SCREEN_INTERACTIVE`, `SCREEN_NON_INTERACTIVE`, `KEYGUARD_SHOWN`, `KEYGUARD_HIDDEN`, `DEVICE_STARTUP` en `DEVICE_SHUTDOWN` (https://developer.android.com/reference/android/app/usage/UsageEvents.Event). `ACTIVITY_RESUMED` en `ACTIVITY_STOPPED` bestaan vanaf API 29; oudere versies gebruiken `MOVE_TO_FOREGROUND` en `MOVE_TO_BACKGROUND`. De scherm- en keyguard-gebeurtenissen bestaan vanaf API 28.

**[Inschatting]** Daarmee kan een Android-app achteraf een tijdlijn opbouwen: scherm uit om 14:00, geen `SCREEN_INTERACTIVE` of `KEYGUARD_HIDDEN` tot 14:50, geen andere app op de voorgrond. Dat komt het dichtst bij een echt bewijs van "telefoon niet gebruikt", en de app hoeft niet actief te draaien tijdens de sessie. De app moet de tijdlijn wel kort na de sessie opbouwen, na ontgrendeling, omdat het systeem de gebeurtenissen maar enkele dagen bewaart en ze bij een vergrendeld toestel niet teruggeeft. De verwerking kan op het toestel blijven: de app stuurt alleen "sessie schoon: ja/nee" plus de gebeurtenissen rond begin en einde naar de server, niet de volledige gebruiksgeschiedenis. De gaten: op een geroot toestel kan het besturingssysteem liegen, en een tweede toestel blijft buiten beeld.

**Google Play-beleid.** **[Niet geverifieerd]** Ik kon geen Play-beleidstekst openen waarin `PACKAGE_USAGE_STATS` als beperkte permissie met een declaratieformulier staat. Wel geldt het algemene beleid voor gevoelige permissies: toegang moet nodig zijn voor de kernfunctionaliteit uit de Play-vermelding en vraagt een opvallende melding in de app vóór de toestemming (https://support.google.com/googleplay/android-developer/answer/16558241, zoeksamenvatting). Zoekfragmenten van de beleidspagina "Permissions and APIs that Access Sensitive Information" ondersteunen die lijn: toegang alleen voor functies die "currently implemented and promoted in your Google Play listing" zijn, en een melding die "must be presented in-app right before the permission or capability is requested". Geen van de drie controles kon support.google.com openen. Dat ik geen declaratieformulier voor `PACKAGE_USAGE_STATS` vond, bewijst niet dat het niet bestaat. Controleer vóór de Android-bouw de beleidspagina's zelf en in Play Console de sectie App content / gevoelige permissies. **[Inschatting]** Een focus-app die gebruik meet, valt daar duidelijk onder: schermtijd meten is precies de kernfunctie.

### 2.2 Accessibility Services en Device Admin

**[Feit, zoeksamenvatting van de Play Console-helppagina]** Alleen diensten die mensen met een beperking helpen, mogen `isAccessibilityTool` declareren. Andere apps moeten een declaratie invullen in Play Console en vóór gebruik een opvallende melding met actieve toestemming tonen. Het beleid verbiedt gebruik van de Accessibility API om "autonomously initiate, plan, and execute actions". Misleidend gebruik kan leiden tot schorsing van de app of van het ontwikkelaarsaccount (https://support.google.com/googleplay/android-developer/answer/10964491). **[Inschatting]** Voor Rewarded is Accessibility niet nodig, want UsageStats is genoeg om te meten. Accessibility vergroot het beoordelingsrisico en de privacy-impact (de dienst kan scherminhoud lezen), dus vermijden.

**[Feit]** Vanaf Android 9 zijn sommige Device Admin-beleidsregels verouderd; Google raadt migratie aan (https://developer.android.com/work/device-admin). **[Inschatting]** Device Admin is bedoeld voor enterprise-beheer en niet geschikt om een consumentenapp onverwijderbaar te maken.

### 2.3 Hold en Sweatcoin op Android

**Hold.** **[Feit, pers 2018]** Studenten verdienen punten (genoemd: 10 punten per 20 minuten tussen 7:00 en 23:00) zolang ze hun telefoon niet gebruiken. "Hold's technology can detect" interactie, maar hoe wordt niet uitgelegd (https://www.techspot.com/community/topics/this-app-rewards-students-with-discounts-for-not-looking-at-their-phones.244855/ ; https://www.irishnews.com/magazine/technology/2018/03/01/news/new-app-hold-gives-university-students-rewards-for-not-looking-at-their-phones-1267611/). De technische methode en de huidige status zijn **niet geverifieerd**. **[Inschatting]** Hold keerde kleine kortingen uit. Met zulke beloningen is grootschalige fraude niet rendabel, en de beloningshoogte was zelf de fraudebeheersing.

**Sweatcoin.** **[Feit, eigen helppagina]** Het algoritme vergelijkt de stappen met locatie, snelheid, consistentie, richting en versnelling. Zonder GPS-data worden stappen niet omgezet. Bekende valspeelpatronen zoals schudden worden herkend en handmatig gecontroleerd. Gemiddeld wordt ongeveer 65% van de stappen geverifieerd (https://help.sweatco.in/hc/en-us/articles/360012752551-How-does-Sweatcoin-s-step-counting-algorithm-work ; https://sweatco.in/verification-algorithm). Daarnaast geldt één account per telefoonnummer of toestel, tellen meerdere eigen accounts niet als referrals, en mag Sweatcoin frauduleus verkregen munten vernietigen en accounts blokkeren (https://help.sweatco.in/hc/en-us/articles/14488035587729-Why-are-my-invites-not-counting ; https://sweatco.in/tnc-us). Of Sweatcoin Play Integrity gebruikt, is **niet geverifieerd**. **[Inschatting]** De les: Sweatcoin weigert bewust een derde van het echte gedrag om fraude buiten te houden, en zegt dat ook openlijk. Rewarded moet een vergelijkbare afweging tussen onterecht afgewezen en onterecht beloonde sessies maken en die publiceren.

---

## 3. Web en PWA

### 3.1 Wat de API's doen

**[Feit]** Page Visibility: `hidden` betekent dat de inhoud niet zichtbaar is, "either due to the document's tab being in the background or part of a window that is minimized, or because the device's screen is off". Browsers knijpen timers in achtergrondtabbladen af. In Chrome gebeurt dat na 10 seconden en zwaarder ("intensive throttling", sinds Chrome 88) na 5 minuten onzichtbaarheid en 30 seconden stilte, mits de timerketen minstens 5 diep is en WebRTC niet actief is. Timers lopen dan nog één keer per minuut. Firefox voor Android kent een minimale timeout van 15 minuten en kan tabbladen helemaal uitladen. Tabbladen die geluid afspelen, worden niet afgeknepen (https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API ; https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout).

**[Feit]** Screen Wake Lock: alleen zichtbare, actieve documenten kunnen een wake lock krijgen. Het systeem geeft de lock vrij als het document niet meer actief of zichtbaar is, of bij een lage batterij en in energiebesparingsmodus. Na een `visibilitychange` moet de app de lock opnieuw aanvragen (https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

| Browser | Screen Wake Lock | Opmerking | Bron |
|---|---|---|---|
| Chrome desktop en Android, Edge, Samsung Internet, Android WebView | vanaf Chrome 84 | — | https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json |
| Firefox desktop en Android | vanaf 126 | — | idem |
| Safari macOS | vanaf 16.4 | — | idem |
| Safari iOS en iPadOS | volledig vanaf 18.4 | Van 16.4 tot 18.4 gedeeltelijk: werkte niet in standalone Home Screen Web Apps (WebKit-bug 254545) | idem ; https://bugs.webkit.org/show_bug.cgi?id=254545 (bugnummer uit de BCD-notitie; de bug zelf kon ik niet openen) |

### 3.2 Toets van de randvoorwaarde in `docs/pitch/README.md`

| Bewering in README | Oordeel | Toelichting |
|---|---|---|
| Een vergrendeld scherm geldt als "verborgen" | **Bevestigd** | MDN noemt "the device's screen is off" expliciet |
| Achtergrondtimers worden beperkt | **Bevestigd** | Afknijpen per browser verschilt (zie 3.1) |
| Wake Lock vervalt zodra de pagina verborgen is | **Bevestigd** | Wake Lock ook opnieuw aanvragen bij terugkeer |
| Een sessie kan niet doorlopen met de telefoon op slot | **Bevestigd** (als ontwerpkeuze) | Technisch kan een pagina met audio blijven draaien, maar dat is precies het gedrag dat we niet willen belonen |
| Tijd berekenen uit tijdstempels | **Bevestigd, met aanvulling** | Servertijd gebruiken, niet de klok van de client: die is te manipuleren |
| "iOS 18.4+ in Safari, beperkt in geïnstalleerde webapps op iOS" | **Gedeeltelijk verouderd** | Volgens MDN-compatdata gold de beperking voor 16.4 tot 18.4; vanaf 18.4 volledig, ook als Home Screen Web App. Formulering aanpassen naar "vóór iOS 18.4 werkte Wake Lock niet in geïnstalleerde webapps". BCD is compatibiliteitsdata, geen veldtest: test op een echt toestel |

**[Inschatting]** Ontbrekend in de README: "zichtbaar" is iets anders dan "aandacht". Op desktop blijft een tabblad volgens MDN `visible` zolang het venster niet geminimaliseerd en het tabblad actief is, ook als een ander venster de focus heeft. `blur`/`focus` geeft daar een zwakker extra signaal. Op een telefoon is het sterker: wie een andere app opent, maakt Rewarded verborgen.

### 3.3 Wat een web-MVP eerlijk kan claimen

**[Inschatting]** De eerlijke claim is: *"Je sessie telt zolang Rewarded zichtbaar op je scherm openstaat. Ga je naar een andere app of tabblad, of gaat je scherm uit, dan stopt de sessie."* Dat is een bewijs van **zelfdiscipline op één apparaat**, geen bewijs van focus. Het meet niet of de gebruiker een tweede telefoon, tablet of laptop gebruikt, of hij aan het werk is, en zelfs niet of er een mens bij is. Voor fraudeurs is het goedkoop: een oude telefoon aan de lader met de pagina open, een desktopbrowser met tien profielen, of Puppeteer/Playwright. Daarbij is de zichtbaarheidsstatus van een headless browser door de aanvaller zelf te bepalen (**[Inschatting]**, algemeen bekend gedrag van automatiseringstools; niet per tool geverifieerd).

Op het web bestaat geen device-attestatie zoals App Attest of Play Integrity. Wat wel kan: rate limits per account, IP-adres en browserfingerprint; één actieve sessie per account, door de server afgedwongen; een heartbeat met een door de server uitgegeven nonce; botdetectie via een CAPTCHA-dienst bij het claimen. Het effect van zulke diensten tegen gerichte fraude is **niet geverifieerd**.

---

## 4. Desktop: extensies en actief venster

**[Feit, zoeksamenvatting van Chrome-documentatie en Chromium-bron]** De extensie-API `chrome.idle` kent de toestanden `active`, `idle` en `locked`. De standaarddrempel is 60 seconden; de Chromium-schemadefinitie vermeldt een minimum van 15 seconden. `locked` wordt gemeld als het scherm vergrendeld is of de schermbeveiliging aangaat (https://developer.chrome.com/docs/extensions/reference/api/idle ; https://chromium.googlesource.com/chromium/src/+/841c14b4ca8818f08890157ba159e331a1995453/extensions/common/api/idle.json). Met de permissies `tabs` en een domeinlijst kan een extensie zien welk domein actief is en afleidende sites blokkeren, zoals bekende blokkers doen. Details van Manifest V3 heb ik **niet geverifieerd** (developer.chrome.com was niet te openen).

**[Feit]** Op macOS geeft `NSWorkspace.frontmostApplication` de app die toetsenbordinvoer ontvangt (https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication). Dat vensternamen of scherminhoud extra macOS-permissies vragen, zoals Screen Recording, is **niet geverifieerd** in deze sessie.

**[Inschatting]** De laptop is voor studenten het werkapparaat en de telefoon de afleiding. Een desktopcomponent (extensie of kleine native app) bewijst "werk-app of whitelist-domein op de voorgrond en recente invoer". Dat is een **positief** signaal ("aan het werk"), terwijl de telefoon alleen een **negatief** signaal levert ("niet gebruikt"). Samen zijn ze sterker dan elk apart. Een realistische combinatie: telefoon op Android met UsageStats-tijdlijn, of op iOS met blokkade, plus een laptop-extensie die productieve voorgrondtijd meet. Fraude met een muis-jiggler of autoclicker blijft mogelijk. Daarom zijn `idle`-signalen bewijs van invoer, niet van denkwerk. Privacy: domeinen en appnamen zijn gevoelig, dus lokaal classificeren ("whitelist ja/nee") en geen browsegeschiedenis versturen.

---

## 5. Hardware en sensoren

| Signaal | Web | Native | Betrouwbaarheid bij geldbeloning |
|---|---|---|---|
| NFC-tag (Brick, Unpluq) | Web NFC (`NDEFReader`) alleen in Chrome voor Android vanaf 89; niet op iOS of desktop (https://github.com/mdn/browser-compat-data/blob/main/api/NDEFReader.json) | iOS via Core NFC, Android via NFC-API's | Bewijst een tik op een object. Goedkope tags zijn te klonen of te kopen; tikken bij start en einde bewijst niet dat de telefoon ertussen weg lag |
| Accelerometer / oriëntatie (scherm omlaag) | `DeviceOrientationEvent`/`DeviceMotionEvent` breed beschikbaar; op iOS vanaf 14.5 `requestPermission()` nodig; de Generic Sensor `Accelerometer` niet in Safari of Firefox (BCD: https://github.com/mdn/browser-compat-data/tree/main/api) | Volledig, plus `CMMotionActivityManager` op iOS (stilstaand, lopend) (https://developer.apple.com/documentation/coremotion/cmmotionactivitymanager) | Signaal "lag stil met scherm omlaag" is nuttig tegen oppakken, maar een telefoon op een standaard of tafel is niet te onderscheiden van een fraudeur die hem daar neerlegt |
| Lichtsensor | `AmbientLightSensor` alleen achter een vlag in Chrome; niet in Safari of Firefox | Android: ja; iOS: geen publieke API (**niet geverifieerd**) | Laag: makkelijk te manipuleren |
| Nabijheidssensor | Geen bruikbare standaard-API (**niet geverifieerd** in BCD) | iOS en Android: ja, voor de eigen app op de voorgrond | Laag |

**[Inschatting]** Brick en Unpluq gebruiken NFC als **wrijving**, niet als **bewijs**: de tag ligt in een andere kamer, zodat ontgrendelen moeite kost. Brick geeft vijf noodontgrendelingen per toestel en koppelt die aan het account (zoeksamenvatting van reviews; eigen documentatie **niet geverifieerd**). Bij Unpluq is iOS-ondersteuning volgens bronnen onduidelijk (https://androidworld.nl/reviews/unpluq-tag/, zoeksamenvatting). Voor Rewarded zijn sensoren hoogstens een extra signaal in een risicoscore, nooit de grondslag voor een geldbetaling. Op het web vraagt elk sensorsignaal op iOS een toestemmingsprompt en loopt het alleen zolang de pagina zichtbaar is. Het voegt dus weinig toe aan wat Page Visibility al geeft.

---

## 6. Menselijke en sociale verificatie

| Methode | Hoe het werkt | Kosten en schaal | Fraudebestendigheid | Bron |
|---|---|---|---|---|
| **Focusmate** | Camera verplicht; je wordt gekoppeld aan een partner, deelt je doel en werkt 25, 50 of 75 minuten zichtbaar | Kosten liggen bij de gebruikers (wederzijds toezicht); gratis laag met 3 sessies per week | Bewijst aanwezigheid aan een bureau, niet wat er op een tweede scherm gebeurt; samenspanning tussen partners mogelijk | https://www.focusmate.com/faq ; https://support.focusmate.com/en/articles/4044438-what-do-i-need-to-start-using-focusmate |
| **Forfeit** | Gebruiker zet geld in en levert foto-, timelapse- of GPS-bewijs; AI beoordeelt, randgevallen en bezwaren gaan naar een mens (eigen site is hierover niet consistent) | Menselijke beoordeling kost per geval; AI-eerst om te schalen | Foto's zijn te ensceneren; een verse opname uit de app is sterker dan een upload uit de galerij | https://www.forfeit.app/ (zoeksamenvatting) |
| **Steekproef** | Willekeurig een deel van de sessies met hoge inzet laten onderbouwen (foto van werkplek, korte samenvatting, of achteraf de UsageStats-tijdlijn tonen) | Kosten alleen per steekproef; schaalt met fraudedruk | Ontmoedigt systematische fraude als sancties echt zijn (beloning terug, account dicht) | [Inschatting] |
| **Sociaal (squads)** | Squadleden zien elkaars sessies en kunnen er bezwaar tegen maken | Bijna gratis | Zwak bij samenspanning; sterk tegen opscheppen | [Inschatting] |

**[Inschatting]** Menselijke beoordeling is de enige methode die het doel echt toetst ("was je aan het werk?"). Ze kost wel per sessie. Als één beoordeling een paar minuten werk kost, is ze alleen rendabel voor de inzetlaag en de geldprijzen. Daar is het bedrag per beslissing groot genoeg, en het levert ook de menselijke tussenkomst op die de AVG bij geautomatiseerde besluiten vraagt (zie 7.3). Een cameraverplichting zoals bij Focusmate past slecht bij "leg je telefoon weg" en zorgt voor een zware AVG-last. Ik raad die niet aan als standaard.

---

## 7. Fraude op economisch niveau

### 7.1 Aanvalsvormen

| Aanval | Werkt tegen web-MVP | Werkt tegen native + attestatie | Maatregel |
|---|---|---|---|
| Emulator / virtuele machine | Ja | Grotendeels nee: Play Integrity onderscheidt `MEETS_DEVICE_INTEGRITY` van een leeg oordeel en (alleen voor Google Play Games op pc) `MEETS_VIRTUAL_INTEGRITY` | Attestatie verplicht voor uitbetalingstreden |
| Meerdere accounts | Ja, goedkoop | Beperkt: één toestel kan meerdere installaties hebben | Plafond per toestel (DeviceCheck-bits, Play `deviceRecall`), uitbetaling per geverifieerde identiteit (IBAN, één per persoon) |
| Geautomatiseerde taps / scripts | Ja | Deels: `appAccessRiskVerdict` signaleert apps die het scherm opnemen, overlays tonen of het toestel besturen | Geen beloning voor taps; beloning voor afwezigheid van gebruik |
| Device farm (veel echte goedkope telefoons) | Ja | **Ja**: attestatie slaagt op echte toestellen | Plafonds per toestel en per persoon, KYC bij uitbetaling, `recentDeviceActivity`, anomaliedetectie |
| Geroot of gejailbreakt toestel dat het OS laat liegen | n.v.t. | Deels: Play Integrity geeft leeg oordeel bij tekenen van rooting; Apple waarschuwt dat een aangepast OS App Attest kan omzeilen | Aanvullende signalen, steekproeven |
| Referral-fraude (zelf-uitnodigen) | Ja | Ja | Referral-beloning pas na eigen bewezen sessies, nooit in geld (zie `03-viral-en-tractie.md`) |

### 7.2 Device-attestatie: wat het wel en niet bewijst

**[Feit] Apple App Attest.** De app maakt een sleutel in de Secure Enclave, Apple certificeert die als behorend bij een geldige instantie van de app, en daarna ondertekent de app serververzoeken. Apple schrijft: "A compromised version of your app running on a genuine, unmodified Apple device can't create valid assertions. However, an attacker that modifies the device's operating system might bypass restrictions." Apple biedt een fraudemetriek: een benaderd aantal unieke attestaties voor de app op een toestel (https://developer.apple.com/documentation/devicecheck/assessing-fraud-risk). "Not all devices can use the App Attest service", dus een fallback is nodig. Van de extensies worden alleen Action-, extensible SSO- en watchOS-extensies ondersteund (https://developer.apple.com/documentation/devicecheck/establishing-your-app-s-integrity). **[Inschatting]** De Screen Time-extensies vallen daar dus buiten: attestatie moet in de hoofdapp gebeuren, niet in de DeviceActivityMonitor-extensie. **[Feit]** App Attest-sleutels overleven een herinstallatie, een toestelmigratie of een herstel uit back-up niet (volgens de Apple-documentatie over App Attest, zoals de sceptici die lazen).

**[Feit] DeviceCheck** (`DCDevice`) geeft de server toegang tot "two per-device binary digits (bits)", die Apple per toestel bewaart en die de ontwikkelaar zelf moet resetten, bijvoorbeeld als een toestel wordt verkocht (https://developer.apple.com/documentation/devicecheck/dcdevice). Het voorbeeld is "dit toestel heeft al een welkomstbonus gehad". **[Niet geverifieerd in primaire bron]** Dat de bits een herinstallatie overleven, staat niet expliciet in de huidige documentatie. Het volgt uit het ontwerp (opslag bij Apple per toestel) en uit berichtgeving rond WWDC 2017 (https://gizmodo.com/apple-rolls-out-new-feature-that-permanently-associates-1795906443, secundair). Een forumdraad meldt "Bit State Not Found" na herinstallatie in de ontwikkelomgeving (https://developer.apple.com/forums/thread/128746). Test het gedrag daarom in de productieomgeving voordat het plafond per toestel erop rust. Apple zelf: "No single policy can eliminate all fraud" (https://developer.apple.com/documentation/devicecheck).

**[Feit] Google Play Integrity.** Het API levert de oordelen `appIntegrity` (ongewijzigd binair bestand dat Play herkent), `deviceIntegrity` (echt, gecertificeerd Android-toestel) en `accountDetails`. Optioneel komen daar `MEETS_STRONG_INTEGRITY`, `appAccessRiskVerdict`, `playProtectVerdict`, `recentDeviceActivity` (niveaus 1 tot 4 op basis van het aantal tokenverzoeken per uur) en `deviceRecall` (bèta) bij. Standaard zijn 10.000 verzoeken per dag toegestaan, opgeteld over alle installaties; meer kan op aanvraag. De niveaus van `recentDeviceActivity` zijn volgens Google benaderingen (standaardverzoeken per app per uur: tot 10, 11–25, 26–50, meer dan 50). `deviceRecall` geeft drie bits per toestel. Op Android 13 en hoger komen de optionele labels alleen terug voor apps die via Play gelicentieerd zijn. Google adviseert het API te gebruiken "alongside other signals ... and not as your sole anti-abuse mechanism" (https://developer.android.com/google/play/integrity/overview ; https://developer.android.com/google/play/integrity/verdicts).

**[Inschatting]** Attestatie bewijst *wie de klant is* (onze app, echt toestel), niet *wat er gebeurde* (focus). Het maakt emulatoren en gemodificeerde apps duur, maar doet niets tegen device farms van echte toestellen en niets tegen een tweede telefoon in de andere hand. Tegen farms helpt alleen economie: plafonds per toestel en per geverifieerd persoon, zodat een extra telefoon meer kost dan hij oplevert.

### 7.3 AVG per methode

Bron: AVG, Verordening (EU) 2016/679 (https://eur-lex.europa.eu/eli/reg/2016/679/oj). De artikelverwijzingen zijn feit. De toepassing op Rewarded is **[Inschatting]** en moet door de jurist worden getoetst.

| Methode | Welke data | Bijzondere categorie (art. 9)? | Minimalisatie (art. 5 lid 1 sub c) |
|---|---|---|---|
| Web-sessie | Account, tijdstempels, IP, browserkenmerken | Nee | Geen fingerprinting verder dan nodig voor fraude; IP kort bewaren |
| iOS Screen Time | Rewarded ontvangt alleen "drempel bereikt ja/nee" en autorisatiestatus | Nee; Apple houdt de gegevens op het toestel | Sterk: platform dwingt minimalisatie af |
| Android UsageStats | Potentieel volledige app-gebruiksgeschiedenis | Kan indirect gezondheid, geloof of seksuele voorkeur onthullen (gebruik van gezondheids-, religieuze of datingapps) | Op toestel verwerken; alleen sessieoordeel en grensgebeurtenissen versturen; geen appnamen |
| Desktop-extensie | Actieve domeinen/apps | Idem als UsageStats | Lokaal classificeren; geen URL's versturen |
| Sensoren | Beweging, oriëntatie | Nee, tenzij afgeleid naar gezondheid | Alleen samenvatting per sessie |
| Camera / foto | Beeld van persoon en omgeving, mogelijk derden | Biometrisch alleen bij verwerking voor unieke identificatie (art. 4 lid 14, art. 9); geen gezichtsherkenning gebruiken | Alleen bij steekproef; kort bewaren; geen training |
| Attestatie | Attestatietokens, toestelbits | Nee | Geen extra identifiers bewaren |
| KYC bij uitbetaling | Naam, IBAN, mogelijk ID | Nee (ID-nummer wel extra beschermd in NL, **niet geverifieerd** voor deze context) | Alleen vanaf uitbetalingsdrempel |

**[Inschatting]** Twee AVG-punten wegen zwaar. (1) Bij de inzetlaag besluit Rewarded geautomatiseerd of iemand zijn inzet kwijtraakt. Dat kan onder art. 22 vallen (besluit met aanzienlijk effect). Bied daarom altijd bezwaar met menselijke beoordeling, zoals Forfeit doet. (2) Stelselmatig gedrag monitoren met een beloning eraan maakt een DPIA (art. 35) zeer waarschijnlijk nodig. Daarnaast vraagt het uitlezen van gegevens van het toestel van de gebruiker mogelijk toestemming onder de Telecommunicatiewet (cookiebepaling, ePrivacy). Dat heb ik **niet geverifieerd**; leg het voor aan de jurist.

---

## 8. Aanbevolen verificatieladder

De bouwinspanning is een **[Inschatting]** voor een team van 2 à 3 ontwikkelaars en exclusief de wachttijd voor de Apple-entitlement.

| Trede | Beloningsniveau | Wat het bewijst | Wat het niet bewijst | Bouwinspanning | Restrisico |
|---|---|---|---|---|---|
| **0. Web-sessie zichtbaar** | Alleen punten, streaks, ranglijst; geen geld; harde dagplafonds | Pagina was zichtbaar op één browser in tijdvak A–B (servertijd, heartbeat-nonce) | Geen gebruik van andere apparaten; mens aanwezig; geen emulator | Laag (2–4 weken, onderdeel van de MVP) | Hoog, maar de schade is begrensd zolang punten weinig waard zijn |
| **1. Web + identiteit + plafonds** | Punten inwisselbaar voor kleine, door sponsors gedekte beloningen (centen tot enkele euro's per week) | Als trede 0, plus één geverifieerd telefoonnummer per account, één actieve sessie per account, anomaliedetectie | Idem; device farms van oude telefoons blijven lonen bij te hoge plafonds | Laag tot middel (+2–3 weken) | Middel; beheersen met plafond per persoon en vertraagde uitbetaling (bijv. 14 dagen) |
| **2. Native voorgrond + attestatie** | Middelhoge beloningen, gratis deelname aan prijstrekkingen | Echte app op echt toestel (App Attest / Play Integrity), app op voorgrond of scherm vergrendeld, toestelplafond (DeviceCheck / `deviceRecall`) | Gebruik van een tweede apparaat; device farms van echte toestellen; focus zelf | Middel (8–12 weken voor iOS + Android, bijvoorbeeld cross-platform) | Middel |
| **3. Screen Time / UsageStats + attestatie + steekproeven** | Eigen inzet (€5–€50) en geldprijzen | Android: tijdlijn zonder schermgebruik of zonder afleidende apps; iOS: blokkade actief, autorisatie niet ingetrokken, en een drempel-callback alleen als aanleiding voor controle (niet als automatisch verlies, vanwege de fout in iOS 26.x/27); plus menselijke steekproef en KYC bij uitbetaling | Tweede apparaat; dat de tijd nuttig besteed is; op iOS geen hard bewijs van niet-gebruik (alleen afwezigheid van een callback, en callbacks zijn op iOS 26.x/27 onbetrouwbaar) | Hoog (+8–12 weken bovenop trede 2, plus entitlement-traject van mogelijk weken tot maanden, DPIA en beoordelingsproces) | Laag tot middel; restrisico vooral bij samenspanning en tweede apparaten |

Toelichting en regels die voor alle treden gelden:

- **Bewijs bepaalt het plafond.** Een sessie krijgt de beloning van de hoogste trede waarvan ze het bewijs levert. Een websessie telt dus nooit mee voor een inzetdoel. **[Inschatting]**
- **De onzekerheid bij iOS hoort in de productkeuze.** Belonen op iOS betekent belonen voor een *actieve blokkade*, niet voor *gemeten niet-gebruik*. Communiceer dat ook zo ("Rewarded blokkeert je afleiders; houd vol, dan verdien je"). **[Inschatting]**
- **Android is technisch het sterkste platform, iOS commercieel het belangrijkste.** Dat Nederlandse studenten vooral iOS gebruiken is aannemelijk, maar het aandeel heb ik **niet geverifieerd**. **[Speculatie]** Begin native daarom met iOS-blokkade voor de vraag en Android-UsageStats voor de hoogste bewijssterkte.
- **Laptop als tweede bewijsbron.** Een extensie met `chrome.idle` en een domeinwhitelist kan vanaf trede 2 een sessie "productief" maken. Dat dekt de werkkant af die telefoonsignalen niet zien. **[Inschatting]**
- **Fraude economisch onrendabel maken.** Plafonds per toestel en per geverifieerd persoon, vertraagde uitbetaling, referral-beloningen niet in geld, en een openbare afweging tussen onterecht afgewezen en onterecht beloonde sessies (zoals Sweatcoins "65%"). **[Inschatting]**

**Wat een web-MVP vandaag eerlijk kan claimen:** "Rewarded telt je focustijd zolang de app zichtbaar op je scherm openstaat. Wissel je van app of tabblad of gaat je scherm uit, dan stopt de sessie." Niet claimen: "we weten dat je je telefoon niet gebruikte", "bewezen focus" in de zin van verificatie, of iets dat een geldbedrag rechtvaardigt.

**Wat native vereist:** bewijs dat andere apps niet gebruikt zijn (Android UsageStats) of geblokkeerd waren (iOS ManagedSettings/DeviceActivity), device-attestatie tegen emulatoren en aangepaste apps, plafonds per toestel die een herinstallatie overleven (op iOS via DeviceCheck-bits; dat gedrag eerst testen, zie 7.2), en sessies die doorlopen met het scherm uit. Dat laatste kan het web per definitie niet: daar beëindigt een uitgeschakeld scherm de sessie.

## Bronnen (primair, geopend)

- Apple: https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement ; https://developer.apple.com/documentation/familycontrols ; https://developer.apple.com/documentation/familycontrols/authorizationcenter ; https://developer.apple.com/documentation/familycontrols/familyactivityselection ; https://developer.apple.com/documentation/managedsettings ; https://developer.apple.com/documentation/deviceactivity ; https://developer.apple.com/documentation/deviceactivity/deviceactivityreport ; https://developer.apple.com/documentation/deviceactivity/deviceactivitycenter ; https://developer.apple.com/documentation/deviceactivity/deviceactivityevent ; https://developer.apple.com/documentation/devicecheck ; https://developer.apple.com/documentation/devicecheck/establishing-your-app-s-integrity ; https://developer.apple.com/documentation/devicecheck/assessing-fraud-risk ; https://developer.apple.com/documentation/devicecheck/dcdevice ; https://developer.apple.com/app-store/review/guidelines/ ; https://developer.apple.com/forums/thread/817516 ; https://developer.apple.com/forums/thread/808470 ; https://developer.apple.com/forums/thread/827666 ; https://developer.apple.com/forums/thread/741133 ; https://developer.apple.com/forums/thread/727970
- Android: https://developer.android.com/reference/android/app/usage/UsageStatsManager ; https://developer.android.com/reference/android/app/usage/UsageEvents.Event ; https://developer.android.com/reference/android/Manifest.permission ; https://developer.android.com/work/device-admin ; https://developer.android.com/google/play/integrity/overview ; https://developer.android.com/google/play/integrity/verdicts
- Web: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API ; https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API ; https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout ; https://github.com/mdn/browser-compat-data (WakeLock, NDEFReader, AmbientLightSensor, Accelerometer, DeviceOrientationEvent, DeviceMotionEvent) ; https://bugs.webkit.org/show_bug.cgi?id=254545
- Recht: https://eur-lex.europa.eu/eli/reg/2016/679/oj

Secundaire bronnen (zoeksamenvattingen, niet volledig gelezen) staan inline bij de betreffende bewering.

## Verificatie

Op 4 november 2026 hebben drie onafhankelijke sceptici de tien zwaarstwegende claims gecontroleerd: een bron-check, een actualiteits-check en een reikwijdte-check. Bij een onderlinge tegenspraak (C4) heb ik de bronnen zelf nagelezen. support.google.com, bugs.webkit.org en developer.mozilla.org waren in die sessie niet bereikbaar. MDN is gelezen via `mdn/content` en `mdn/browser-compat-data`.

| # | Claim | Oordeel van de sceptici | Wat is aangepast |
|---|---|---|---|
| C1 | De rapport-extensie draait in een sandbox zonder netwerk; het dagtotaal is niet via App Groups naar de hoofdapp te krijgen (1.2, Samenvatting 3) | Houdt stand (3×) | Nuance toegevoegd: het antwoord van Apple noemt App Groups niet bij naam, maar dekt ze wel. Drempel-callbacks zijn een signaal, geen gebruiksduur als data |
| C2 | Richtlijn 4.10 verbiedt het te gelde maken van onder meer de Screen Time API's (1.1) | Houdt stand (3×) | Geen wijziging. De toepassing op het model van Rewarded blijft een interpretatievraag |
| C3 | Entitlement, aanvraag door de Account Holder, aparte aanvraag per extensie; goedkeuring duurt "weken tot maanden" (1.1) | Verzwakt (2×), houdt stand (1×) | Het documentatiedeel blijft staan. Het wachttijdbewijs is vervangen door draad 827666 (zes weken tot bijna twee maanden); 829398 staat er nu bij als voorbeeld van vier dagen zonder reactie. De melding dat Apple de entitlement op teamniveau toekent, staat erbij als niet geverifieerd |
| C4 | Callbacks gaan niet af, gaan dubbel af of direct bij de start af, "ook op iOS 26.x" (1.2, constructie 2) | Weerlegd (1×), verzwakt (2×) | Herschreven. Direct afgaan bij een schema vanaf 00:00 is gedocumenteerd gedrag (727970). De fout in iOS 26.x en 27 is nu onderbouwd met draad 808470, die ik zelf heb nagelezen (FB18061981, geen bevestigde oplossing). Dubbel afgaan heeft nu een bron (741133, 2023). Niet afgaan staat als niet geverifieerd. Ontwerpgevolg: een callback geldt als aanleiding voor controle, niet als automatisch verlies. Samenvatting 3 en trede 3 zijn daarop aangepast |
| C5 | UsageStatsManager, `PACKAGE_USAGE_STATS` via Instellingen, de genoemde gebeurtenistypen (2.1) | Houdt stand (3×) | Aangevuld: API-niveaus (ACTIVITY_* vanaf 29), gebeurtenissen blijven maar enkele dagen bewaard, `queryEvents` geeft `null` bij een vergrendeld toestel. Daaruit volgt: de tijdlijn kort na de sessie opbouwen |
| C6 | Geen declaratieformulier voor `PACKAGE_USAGE_STATS` gevonden; het algemene beleid voor gevoelige permissies geldt (2.1) | Verzwakt (3×), niet te verifiëren | Label "niet geverifieerd" blijft. Zoekfragmenten van het beleid zijn toegevoegd, met het advies om de beleidspagina's en Play Console te controleren vóór de Android-bouw |
| C7 | Wake Lock in Safari iOS volledig vanaf 18.4, daarvoor niet in Home Screen Web Apps (3.1, 3.2, Samenvatting 2) | Houdt stand (3×) | Toegevoegd dat de WebKit-bug zelf niet geopend is en dat BCD geen veldtest is |
| C8 | Page Visibility, afknijpen van timers in Chrome, audio-uitzondering, Wake Lock alleen voor zichtbare documenten (3.1) | Houdt stand (3×) | De voorwaarden voor intensive throttling zijn aangevuld: een timerketen van minstens 5, geen actieve WebRTC, en daarna één keer per minuut |
| C9 | Citaat over App Attest, beperkingen voor extensies en toestellen, DeviceCheck-bits overleven een herinstallatie (7.2) | Verzwakt (3×) | Het citaat staat nu bij de juiste bron (assessing-fraud-risk). De ondersteunde extensietypen staan erbij, met de gevolgtrekking dat Screen Time-extensies niet kunnen attesteren. Dat de bits een herinstallatie overleven, is gemarkeerd als niet geverifieerd in een primaire bron, met het advies om dit in productie te testen. Toegevoegd: App Attest-sleutels overleven een herinstallatie niet |
| C10 | Oordelen van Play Integrity, optionele labels, 10.000 verzoeken per dag, "not as your sole anti-abuse mechanism" (7.2) | Houdt stand (3×) | Preciezer gemaakt: de 10.000 geldt voor alle installaties samen en kan omhoog. Toegevoegd: de drempels van de niveaus, `deviceRecall` met drie bits, en de licentievoorwaarde voor de labels op Android 13 en hoger |
