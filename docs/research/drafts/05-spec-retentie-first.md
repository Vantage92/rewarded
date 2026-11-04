# Rewarded — Productspecificatie web-MVP, variant "retentie eerst"

*Rol: productmanager. Datum: 4 november 2026. Status: concept voor de jury van fase 2. Bindend kader: `docs/01-businessplan.md`. Bewijs: `docs/research/08-gedragswetenschap.md` (verder: rapport 08), `09-verificatietechniek.md` (rapport 09), `02-businessmodel-juridisch-unit-economics.md` (rapport 02), `03-viral-en-tractie.md` (rapport 03).*

## Samenvatting: wat deze variant anders doet

1. Het product is ontworpen rond één moment: week drie, als de nieuwigheid weg is en de beloning gewoon is geworden. Elke functie moet aantonen wat ze daar doet.
2. De beloning is een **steiger in drie fasen**: Opstap (dag 0–7), Ritme (dag 8–13) en Belofte (vanaf dag 14). Vanaf dan, en zeker na het seizoen, draagt een zelfgekozen, sociaal commitment het gedrag, niet de punten.
3. Punten volgen een vaste ratio per geverifieerde minuut en worden direct bij het einde van de sessie bijgeschreven. Het enige wat afbouwt is een vooraf aangekondigde **seizoensbonus** voor gehaalde dagdoelen. Die stopt met het einde van de blokchallenge, en dat stopmoment gebruiken we als meetpunt voor nawerking.
4. De gebruiker kiest zijn eigen dagdoel. De app remt overmoed in week één en geeft competentiefeedback in plaats van loonstrookjes.
5. De squad is de standaardeenheid, niet de solo-gebruiker. Streaks vergeven (rustdag-joker, terugkombonus, streak op de helft van de squad), zodat één gemiste dag geen afhaakmoment wordt.
6. De pilot heeft een 2×2-ontwerp, gerandomiseerd per squad: gewone bijschrijving tegenover een slinkend weekbudget, en wel of geen Belofte-aanbod op dag 14.
7. Inzet, geld en native verificatie vallen buiten de MVP. De Belofte zonder geld is de opstap naar de latere inzetlaag én de meting van de vraag ernaar.

---

## 1. Doel van de MVP en succescriteria

De web-MVP moet in de gesloten pilot (2 december 2026 – 18 januari 2027) één vraag beantwoorden: blijven studenten focussen als de beloning gewoon wordt, omdat hun squad en hun eigen belofte het overnemen? Het businessplan noemt de overgang van beloning naar zelfgekozen commitment de centrale pilothypothese (§4, ontwerpprincipes). Volgens rapport 08 had in Milkman e.a. 2021 8% van 54 interventies na afloop nog effect, en bleef in Allcott e.a. 2022 na de bonus ongeveer een derde over. De enige veldaanwijzing dat het anders kan, is de commitmentarm van Royer e.a. 2015, één experiment. Een product dat alleen minuten oplevert zolang de punten lopen, is dus geen succes. De steiger ziet er per gebruiker zo uit:

| Fase | Wanneer | Wat draagt het gedrag | Wat de app doet |
|---|---|---|---|
| Opstap | Dag 0–7 | Nieuwigheid, directe punten, squad | Klein dagdoel, eerste sessie binnen 24 uur, squad compleet maken |
| Ritme | Dag 8–13 | Dagdoel, squadstreak, seizoensbonus | Doel bijstellen op basis van werkelijk gedrag, terugkombonus na een misser |
| Belofte | Vanaf dag 14 | Zelfgekozen commitment met de squad als getuige | Belofte-aanbod (in de aanbodarm), reflectie na twee weken |
| Na het seizoen | Vanaf 19 januari 2027 | Squad, streak, Belofte; ratio blijft, bonus stopt | Meting van nawerking |

De go/no-go-criteria van het businessplan zijn leidend; de productcriteria voor week drie zijn het oordeel over deze variant.

| Criterium | Drempel | Bron | Rol |
|---|---|---|---|
| Activatie (eerste voltooide sessie ≥ 25 min binnen 24 uur na aanmelding) | ≥ 60% | Businessplan §6 | Go/no-go |
| D7 | ≥ 25% | Businessplan §6 | Go/no-go |
| D30, gecorrigeerd voor de kerstvakantie | ≥ 12% | Businessplan §6 | Go/no-go |
| Aandeel wekelijks actieven in een squad | ≥ 40% | Businessplan §6 | Go/no-go |
| K-factor in de pilotcohort | ≥ 0,3 | Businessplan §6 | Go/no-go |
| Gemarkeerde sessies | < 5% | Businessplan §6 | Go/no-go |
| Beloningskosten binnen het geboekte budget | 100% gedekt | Businessplan §5 | Go/no-go |
| D7 squadleden tegenover solo | Duidelijk hoger (richtwaarde 1,5×, rapport 03) | Businessplan §9 | Kill-criterium voor de sociale loop |
| W3-retentie: actief op ≥ 2 dagen in dag 15–21 | ≥ 30% van de activeerden | Deze variant, **aanname** | Productcriterium |
| Afbouwcurve: focusminuten per actieve gebruiker in week 3–4 tegenover week 1–2 | ≥ 80% | Deze variant, **aanname** | Productcriterium |
| Belofte-overname: aandeel dat een aangeboden Belofte aangaat | ≥ 35% | Deze variant, **aanname** | Productcriterium |
| Nawerking: focusminuten per actieve gebruiker in de twee weken na het einde van de seizoensbonus tegenover de twee weken ervoor | ≥ 70% | Deze variant, **aanname** | Productcriterium |

De drempels voor week drie zijn eigen inschattingen zonder publieke benchmark. We leggen ze vóór de pilot vast.

## 2. Gebruikers en hun taken

**De student (16+).** Hbo- of wo-student voor de tentamens. Taak: een studieblok zonder telefoon afmaken, zien dat het lukt en een ritme vasthouden. Hij wil geen gedoe, geen schuldgevoel en niet het gevoel dat hij betaald wordt om te studeren. 16- en 17-jarigen: hetzelfde, zonder trekkingen.

**Het squadlid.** Dezelfde student in een groep van drie tot zes vrienden. Taken: zien wie nu focust, meedoen, de squadstreak beschermen, uitnodigen en uitdagen. Rapport 03 noemt de squad de groeimotor; hier is ze ook de retentiemotor, omdat de reden om terug te komen bij de vriend ligt die wacht.

**Het verenigingsbestuur.** Meestal de commissaris onderwijs. Taken: aanmelden voor de blokchallenge, leden mobiliseren, de stand volgen, de collectieve prijs claimen. Alleen geaggregeerde cijfers; individuele monitoring is uitgesloten (businessplan §8).

**De beheerder van Rewarded.** Teamlid. Taken: challenges opzetten, catalogus vullen binnen het geboekte budget, partners en trekkingen beheren, gemarkeerde sessies en beroepen beoordelen.

## 3. Kernflows stap voor stap

De flows beschrijven wat de gebruiker doet en ziet. Regels en parameters staan in hoofdstuk 4 en 5.

### 3.1 Onboarding en leeftijdscheck

1. De student opent een uitnodigingslink (squad, vereniging, referral of wachtlijst). Wie via een squad komt, ziet eerst de squad.
2. Aanmelden met e-mail of magic link. Het telefoonnummer volgt pas bij de eerste verzilvering (rapport 09, trede 1).
3. Geboortedatum invullen. Onder de 16: geen account, met uitleg. 16 of 17: gratis laag; trekkingen zijn onzichtbaar. 18+: alles. De leeftijd is zelf opgegeven; bij het claimen van een trekkingsprijs controleren we haar met een identiteitsbewijs.
4. De claim van de app in één scherm, letterlijk de eerlijke claim uit rapport 09 §3.3: "Rewarded telt je focustijd zolang de app zichtbaar op je scherm openstaat. Ga je naar een andere app of tabblad, of gaat je scherm uit, dan stopt de sessie."
5. Dagdoel kiezen, met de overmoedrem uit 4.1 (voorstel 50 minuten in week één).
6. Optioneel: installeren als PWA, meldingen toestaan en "Niet storen" aanzetten, omdat een inkomend gesprek de sessie afbreekt.
7. Een oefensessie van één minuut laat zien wat er gebeurt als je het scherm verlaat.

### 3.2 Eerste focussessie

1. Kies 25, 50 of 90 minuten (de eerste keer staat 25 klaar) en "telefoon" of "laptop". Telefoon: Wake Lock aan, "leg je telefoon met het scherm naar beneden, liefst aan de lader". Laptop: "laat dit tabblad actief in een zichtbaar venster; werken in een ander venster mag".
2. De server opent de sessie in servertijd.
3. Tijdens de sessie: resterende tijd en wie van de squad ook focust. Geen punten in beeld; die framen de sessie als werk voor loon (Gneezy e.a. 2011, rapport 08 §2).
4. Einde: de server valideert en schrijft de punten direct bij (Levitt e.a. 2016: vertraagd belonen deed het effect verdwijnen). Het eindscherm toont eerst competentiefeedback ("je eerste 25 minuten; je dagdoel is half"), dan de squad, dan de punten. Informatieve feedback verhoogde in Deci e.a. 1999 juist de vrijwillige voortzetting.

### 3.3 Sessie afgebroken

1. De pagina wordt verborgen of de heartbeat valt weg (definitie in 4.1). De sessie eindigt; er komen geen punten.
2. Bij terugkeer, zonder verwijt: "Je sessie stopte om 14:32 omdat Rewarded niet meer zichtbaar was. Je hield 18 minuten vol." Die minuten zijn informatie, geen punten.
3. Twee knoppen: "Opnieuw beginnen" en "Kortere sessie". Het dagdoel en, als die nog te redden is, de streak staan erbij. Na de derde afbreking op een dag stelt de app een kortere sessie en "Niet storen" voor.

Een gebroken reeks leidt tot meer terugval dan het gedrag verklaart, vooral bij zelfverwijt; een herstelmogelijkheid dempt dat (Silverman en Barasch 2023, rapport 08 §4). Punten voor een afgebroken sessie mogen niet; de weg terug kort maken wel.

### 3.4 Punten en catalogus

1. Het saldo is gesplitst in *beschikbaar*, *in controle* en *referral, nog niet vrij*.
2. De catalogus toont per beloning een vaste puntenprijs, de financierende partner en de voorraad. Vóór het einde van de inverdienperiode staat bovenaan hoeveel focustijd er nog nodig is.
3. Verzilveren: beloning kiezen, telefoonnummer eenmalig bevestigen, voucher direct in de app en per e-mail. Bij het weekplafond staat wanneer het weer opengaat.

### 3.5 Squad aanmaken en uitnodigen

1. Naam kiezen, optioneel koppelen aan een vereniging, uitnodigen via WhatsApp of een gekopieerde link. Dit is een van de weinige momenten waarop de app om uitnodigen vraagt (rapport 03).
2. Vanaf drie leden is de squad actief; tot dan staat er "nog 1 vriend nodig" en kan de maker solo focussen.
3. Elk lid kiest of zijn minuten zichtbaar zijn voor de squad.

### 3.6 Duel

Een gebruiker daagt één vriend uit voor 3, 5 of 7 dagen. De vriend accepteert of weigert met één tik. Beiden zien dagelijks de stand; aan het eind volgen een uitslag en een badge.

### 3.7 Verenigingschallenge en bestuursdashboard

1. De beheerder maakt de blokchallenge aan; het bestuur krijgt een beheerlink, vult het ledental in en deelt een verenigingslink.
2. Een student koppelt zich via die link. Vanaf dan telt zijn geverifieerde focustijd mee.
3. De openbare ranglijst toont alleen verenigingen; het bestuur ziet geaggregeerde cijfers. Na afloop verifieert de beheerder de uitslag en claimt het bestuur de collectieve prijs.

### 3.8 Verdiende prijs

De beheerder publiceert een prestatie ("elke dag van de tentamenweek minstens twee uur"). De gebruiker schrijft zich in en ziet zijn voortgang per dag. Wie de prestatie haalt, wordt na verificatie winnaar en claimt de prijs. De app zegt "verdiend", nooit "gewonnen".

### 3.9 Verlote prijs (18+, spelvoorwaarden)

Alleen voor 18-plussers, als rustige kaart onder de catalogus. Wie zijn weekdoel haalt, heeft automatisch één lot. De kaart toont prijs, aantal deelnemers, trekkingsdatum, "dit is een kans, geen beloning" en de spelvoorwaarden. Na de trekking ziet iedereen het aantal deelnemers; er is geen "bijna gewonnen".

### 3.10 Deelbare bewijskaart

Na een voltooide sessie of streakmijlpaal kan de gebruiker met een knop (geen pop-up) een kaart maken met voornaam, focusuren, streak en optioneel squadnaam, en een QR naar de geverifieerde sessie. Delen levert niets op.

### 3.11 Referral

De gebruiker deelt zijn link, die ook in squad- en duelluitnodigingen zit. De genodigde ziet wie hem uitnodigde. Beide krijgen referralpunten met status "nog niet vrij"; die komen vrij zodra de genodigde de vestingdrempel haalt (4.10).

---

## 4. Functionele specificatie per module

### 4.1 Focus-engine

**Sessielengtes en pauzes.** 25, 50 of 90 minuten (businessplan §4). Geen pauze binnen een sessie: een pauze is een venster waarin de pagina verborgen mag zijn, en dat ondermijnt de enige claim die de web-MVP kan doen. Wel een **ketting**: wie binnen 10 minuten na een voltooide sessie een nieuwe start, bouwt een blok op dat in de statistieken als geheel telt.

**Dagdoel.** Zelf gekozen in stappen van 25 minuten. Voorstel in week één: 50 minuten; boven 150 minuten vraagt de app een bevestiging ("begin liever klein, je kunt na een week ophogen"). Na elke week stelt de app een doel voor op basis van wat werkelijk lukte. Nieuwe voornemers zijn overmoedig (Carrera e.a. 2018; Acland en Levy 2015) en een onhaalbaar doel ontmoedigt zwakkere studenten (Leuven e.a. 2010); zelf kiezen beperkt verdringing (rapport 08 §1.3, §2, §3.2).

**Zichtbaarheid.** De sessie loopt zolang `document.visibilityState` `visible` is. De gebeurtenissen `visibilitychange` naar `hidden` en `pagehide` beëindigen de sessie. Op een laptop blijft een actief tabblad `visible` zolang het venster niet geminimaliseerd is, ook als een ander venster de focus heeft (rapport 09 §3.2); werken in een ander venster mag dus. `blur` en `focus` loggen we als zwak fraudesignaal; ze beëindigen niets.

**Wake Lock.** Bij de start vraagt de app een Screen Wake Lock aan; na elke terugkeer naar `visible` opnieuw (MDN, rapport 09 §3.1). Wordt de lock geweigerd of vrijgegeven (lage batterij, energiebesparing), dan waarschuwt de app en probeert ze het opnieuw; de sessie loopt door zolang het scherm aan blijft. Zonder ondersteuning adviseert de app de automatische vergrendeling tijdelijk langer te zetten. Ondersteuning volgens rapport 09: Chrome 84+, Firefox 126+, Safari macOS 16.4+, Safari iOS volledig vanaf 18.4, ook als geïnstalleerde webapp; te testen op echte toestellen.

**Tijdstempels.** Alle tijd komt van de server. De client stuurt elke 30 seconden een heartbeat met de laatst ontvangen nonce, de zichtbaarheidsstatus en een monotone klokwaarde (`performance.now()`). De server antwoordt met een nieuwe nonce. Verstreken tijd is servertijd van start tot het laatste geldige signaal; een achtergrondtimer telt nooit (businessplan §4; rapport 09 §3.2).

**Offline.** Een netwerkgat tot 5 minuten is toegestaan als de client bij herverbinding een aaneengesloten zichtbaarheidslog laat zien en de monotone klok binnen 5 seconden met de servertijd overeenkomt. Een langer gat markeert de sessie ("in controle") in plaats van haar af te breken: wifi in de UB heeft de student niet in de hand.

**Wat telt als afgebroken.** (a) De pagina werd verborgen of gesloten vóór de geplande eindtijd; (b) de heartbeat viel langer dan 90 seconden weg zonder offline-log; (c) de gebruiker stopte zelf. Bij (c) vraagt de app "wil je stoppen?" en registreert ze het als *zelf gestopt*: geen punten, maar ook geen fraudesignaal. **Voltooid** is een sessie als de servertijd tot het laatste geldige signaal minstens de geplande lengte is, zonder afbreking.

**Eén sessie tegelijk** per account, door de server afgedwongen (rapport 09 §3.3). **Uitleg:** elke afbreking en markering krijgt een reden in gewone taal uit een vaste lijst codes (businessplan §4), zodat we de codes ook kunnen tellen.

| Randgeval | Gedrag | Reden |
|---|---|---|
| Inkomend gesprek | Afgebroken (pagina verborgen) | Technisch niet te onderscheiden van een app openen; preventie via "Niet storen" in de onboarding |
| Melding bovenin het scherm | Loopt door (pagina blijft zichtbaar) | Geen visibility-wijziging |
| Batterij leeg of toestel uit | Afgebroken op laatste heartbeat | Geen signaal |
| Gebruiker zet klok van toestel vooruit | Geen effect | Servertijd |
| Twee tabbladen met Rewarded | Tweede tabblad kan geen sessie starten | Eén actieve sessie per account |
| Sessie over middernacht | Telt voor de dag waarop ze eindigt | Eenvoudig en voorspelbaar |
| Pagina zichtbaar maar laptop dichtgeklapt | Afgebroken (scherm uit is `hidden`) | MDN |

### 4.2 Puntengrootboek

Een append-only boekhouding: elke mutatie is een regel met type, bedrag, status en verwijzing. Saldo's zijn afgeleid. Zo is de verplichting per gebruiker altijd controleerbaar (businessplan §5).

**Ratio.** 1 focuspunt per geverifieerde minuut in een voltooide sessie. Vast en gepubliceerd, zonder variabele wisselkoers. "Een punt per minuut" is uitlegbaar en noemt geen euro-waarde; kleine geldbedragen per minuut vallen volgens rapport 08 in de gevarenzone van "pay enough or don't pay at all", en punten zonder geldwaarde zijn daar de aanbevolen uitweg (§7, toelichting).

**Statussen.** *Beschikbaar*, *in controle* (gemarkeerde sessie), *nog niet vrij* (referral), *verzilverd*, *vervallen*, *teruggedraaid* (na afgewezen beroep).

**Inverdienperiode.** De eerste verzilvering kan pas na 300 geverifieerde minuten (vijf uur, businessplan §4). Referralpunten tellen daar niet voor.

**Plafonds.** Per dag maximaal 300 punten uit sessies (vijf uur), per week maximaal 1.500 punten in totaal, inclusief bonussen. Het dagplafond ligt onder het challengeplafond van 8 uur, omdat punten waarde hebben. Minuten boven het puntenplafond tellen wel voor dagdoel en challenge. Vesting van referralpunten: zie 4.10.

**Vervaldatum.** 12 maanden na bijschrijving, oudste eerst, met bericht 30 dagen vooraf. Vervallen punten vallen terug in het budget van de partner. Juridische houdbaarheid: open vraag.

**Seizoensbonus.** Tijdens de blokchallenge krijgt wie zijn dagdoel haalt 25 punten extra, direct bij het halen ervan. De bonus is vooraf aangekondigd met begin- en einddatum; daarna blijft de ratio gewoon gelden. Zo bouwt de beloning af zonder dat de ratio verandert. In de verliesarm krijgt de bonus een andere vorm (hoofdstuk 5).

**Terugkombonus.** De eerste voltooide sessie na een of meer gemiste dagen levert 15 punten extra op, maximaal één keer per week. Milkman e.a. 2021 vond een kleine bonus voor terugkomen na een gemiste training de sterkste interventie tijdens de looptijd (rapport 08 §1.3); nawerking is niet aangetoond.

### 4.3 Catalogus en verzilvering

**Budgetdekking.** Een beloning komt pas in de catalogus als de partner haar heeft betaald of contractueel heeft toegezegd en het bedrag is geboekt. Het beloningsbudget is een vast percentage van de geboekte omzet; rapport 02 §5.2 rekent met maximaal 20% van de geboekte sponsoromzet voor beloningen die Rewarded zelf financiert. Partnerbeloningen zijn één op één gedekt: wat de partner financiert, staat in de voorraad.

**Dekkingsregel.** Per week berekent het systeem het maximale verzilveringsvolume: het aantal gebruikers dat de inverdienperiode heeft gehaald, maal het weekplafond van één verzilvering. Ligt de gedekte voorraad daaronder, dan krijgt de beheerder een alarm. Puntenprijzen veranderen niet tijdens een seizoen; schaarste uit zich in "uitverkocht" met een aanvuldatum. De catalogus zegt eerlijk: "Punten geven toegang tot de catalogus zolang de voorraad strekt."

**Voorraad en vouchers.** Per beloning: voorraad, puntenprijs, partner, geldigheid en vouchertype (code, QR of link), vooraf in batches geüpload. Verzilvering reserveert een code, schrijft af en levert direct; bij een mislukte levering gaat alles terug.

**Randgevallen.** Een ongebruikte, verlopen voucher gaat alleen terug in punten als de partner instemt, en dat staat bij de beloning. Is een verzilvering betaald met punten uit een later afgekeurde sessie, dan blijft de voucher geldig en wordt het saldo negatief; bij herhaling volgt een menselijke beoordeling.

### 4.4 Squads

**Grootte.** 3 tot 6 leden (businessplan §4). Onder drie actieve leden geen squadstreak; de app vraagt hooguit één keer per week iemand toe te voegen (rapport 03).

**Live aanwezigheid.** Het startscherm toont als eerste wie nu focust en hoe lang nog: "Sem en Noor focussen nu. Doe mee." Een melding daarvan is opt-in en komt maximaal één keer per dag. Een lid kan zijn aanwezigheid verbergen.

**Squadstreak.** Een squaddag telt als minstens de helft van de actieve leden (naar boven afgerond) die dag zijn dagdoel haalt of een joker inzet. Een streak die op het zwakste lid rust, gaat het snelst dood; rapport 03 noemt squads die door één afhaker doodslaan als risico. Mijlpalen na 7, 14 en 21 dagen geven een badge en 50 punten per lid dat op die dag zijn eigen dagdoel haalde.

**Automatische pauze.** Na 7 dagen zonder voltooide sessie gaat een lid automatisch op pauze (businessplan §4). Hij telt niet mee voor de streak; één voltooide sessie haalt hem terug ("Welkom terug, je squad staat op dag 12").

**Rustdag-joker.** Eén per lid per kalenderweek, automatisch ingezet op de eerste gemiste dag. Eén dag missen schaadt gewoontevorming niet (Lally e.a. 2010, rapport 08 §4), dus de straf ervoor is nul.

**Individuele vergelijking.** Alleen binnen de squad en alleen als de leden het aanzetten. Er bestaat geen individuele ranglijst buiten de squad (businessplan §4, op basis van Bursztyn en Jensen 2015: −24% bij een openbare ranglijst).

### 4.5 Duels

Een duel is tussen twee gebruikers en duurt 3, 5 of 7 dagen. De standaardmaatstaf is het aantal dagen waarop elk zijn eigen dagdoel haalt. Dat is eerlijk tussen een doel van 50 en een van 150 minuten en beloont consistentie. Minuten (met dagplafond) kan als beide spelers dat kiezen. Bij gelijkspel winnen beiden. De winnaar krijgt een badge, geen punten: punten in een duel nodigen uit tot samenspanning en komen te dicht bij een pool. Patel e.a. 2019 vond dat competitie in kleine verbanden het enige sociale ontwerp was dat in de follow-up significant bleef (rapport 08 §6). Per gebruiker zijn maximaal drie duels tegelijk actief.

### 4.6 Verenigingschallenge

**Maatstaf.** Twee openbare ranglijsten per challenge, beide geaggregeerd per vereniging: (1) **gemiddelde geverifieerde focustijd per actief lid**, waarbij een actief lid gekoppeld is en in de challengeperiode minstens één voltooide sessie heeft; (2) **deelnamegraad**, het aandeel actieve leden ten opzichte van het door het bestuur opgegeven ledental. De beheerder kiest per challenge welke lijst de prijs bepaalt; de pilotstandaard is het gemiddelde per actief lid, met als voorwaarde minstens 15 actieve leden. De tweede lijst houdt de eerste eerlijk: met alleen het gemiddelde loont het om weinig, fanatieke leden te hebben. Totalen tonen we nooit (businessplan §4).

**Plafond per lid per dag.** 8 uur (werkhypothese uit het businessplan). Minuten daarboven tellen niet mee. De rustdag-joker geldt ook hier: een lid dat een joker inzet, telt die dag niet mee in de noemer.

**Bestuursdashboard.** Gekoppelde en actieve leden, gemiddelde focustijd per actief lid per dag en week, deelnamegraad, aantal squads, positie op beide lijsten en voortgang naar de prijs. Geen namen bij minuten, geen export van persoonsgegevens, geen uitsplitsing onder vijf personen. Het bestuur kan leden maximaal twee berichten per week sturen.

**Collectieve prijs.** Verdiend, nooit verloot (businessplan §6). Twee soorten: een **drempelprijs** voor elke vereniging die een vooraf vastgesteld gemiddelde haalt, en een **topprijs** voor de nummer één. De drempelprijs is de belangrijkste, zodat de onderkant niet afhaakt. Demotivatie onderaan is volgens rapport 08 plausibel maar alleen secundair onderbouwd; de drempelprijs is een voorzorgsmaatregel. Uitslagen zijn pas definitief na verificatie (4.8).

**Einde van het seizoen** op 18 januari 2027: seizoensbonus en collectieve prijs stoppen, squads, streaks en Beloften lopen door. Daar zien we wat overblijft als de prikkel stopt.

### 4.7 De Belofte (kern van deze variant)

De Belofte is een zelfgekozen commitment zonder geld. Ze wordt op dag 14 aangeboden aan gebruikers in de aanbodarm, of eerder als de gebruiker in de eerste twee weken op minstens acht dagen zijn dagdoel haalde.

**Inhoud.** De gebruiker kiest zelf: hoeveel dagen per week (3 tot 7), hoeveel minuten per dag (stappen van 25), voor hoe lang (twee weken, verlengbaar) en wie het mag zien (de squad, één vriend of niemand). De app stelt een waarde voor op basis van wat hij in de afgelopen twee weken werkelijk deed, niet op basis van zijn ambitie.

**Werking.** De getuigen zien de Belofte en per dag of ze gehaald is. Na twee weken volgt een reflectie met de keuze verlengen, aanpassen of stoppen; stoppen is één tik zonder schuldtaal. Aan de Belofte hangen geen extra punten.

**Waarom zonder punten.** Een beloonde Belofte is weer een prikkel die moet doorlopen. Rapport 08 adviseert de beloningsfase te ontwerpen als opstap naar zelfbinding (Royer e.a. 2015; Allcott e.a. 2022) en noemt zelfgekozen commitment als omstandigheid waarin beloningen minder verdringen (§2). In de termen van Bryan, Karlan en Nelson 2010 is de Belofte een zacht commitment, met psychologische in plaats van financiële kosten. Royer e.a. testten een zelfgefinancierd contract; dat de zachte vorm ook werkt, is een **hypothese**.

**Brug naar de inzetlaag.** Bij de reflectie krijgen 18-plussers één vrijblijvende vraag: "Zou je bij je volgende Belofte een bedrag inzetten dat naar een goed doel gaat als je hem niet haalt?" Er is geen betaalfunctie. Het antwoord is een eerste indicatie voor H-C (rapport 08 §7).

### 4.8 Prijzen

**Verdiend tegenover verloot.** Andere plek, ander woord, andere kleur. Verdiende prijzen heten "verdiend"; verlote prijzen heten "kans" en staan nooit op het startscherm.

**Verdiende prijzen.** Alleen op prestatie met een vooraf gepubliceerde drempel, maximaal één per persoon per week. Een plafond van €10 per persoon per maand is een **werkhypothese**; rapport 09 noemt voor web plus identiteit "centen tot enkele euro's per week".

**Winnaarsverificatie.** Alleen winnaars worden grondig gecontroleerd, wat goedkoop is (rapport 02 §4): geverifieerd telefoonnummer, sessielog zonder openstaande markeringen, geen toestel- of IP-overlap met andere accounts, en een menselijke beoordeling. Bij verenigingsprijzen kijkt de beheerder ook naar de spreiding van minuten over leden. Geen camera, geen locatie.

**Verlote prijzen.** Gratis, 18+, één lot per gehaald weekdoel, Rewarded als organisator, spelvoorwaarden in de app (organisator, looptijd, prijs, winnaarsbepaling, bekendmaking, klachtenadres). Elk spel blijft onder €4.500 of binnen de jaarlimiet van de Gedragscode (rapport 02). Leeftijd en identiteit controleren we bij het claimen. Accepteert de Kansspelautoriteit de reeks kleine spellen niet, dan gaat de module uit (businessplan §9).

**Kansspelbelasting.** De beheeromgeving toont bij elke trekking de prijswaarde, de kansspelbelasting van 37,8% die Rewarded als organisator draagt (bij brutering: prijs × 100/62,2, rapport 02 §5.1) en de totale kostenpost, en trekt die van het beloningsbudget af voordat de trekking gepubliceerd kan worden.

### 4.9 Deelbare kaarten

Opt-in per kaart; standaard alleen de voornaam, achternaam en instelling alleen als de gebruiker ze aanzet. Inhoud: focusuren, streak, optioneel squadnaam en "geverifieerd: Rewarded stond zichtbaar op het scherm". Geen punten of bedragen (businessplan §6). De QR leidt naar een openbare sessiepagina met een niet te raden token (datum, duur, verificatieniveau), die verdwijnt als de kaart wordt ingetrokken. Een sessie in controle krijgt geen kaart. Delen levert niets op.

### 4.10 Referral

Beide partijen krijgen 100 punten met status *nog niet vrij*. Die komen vrij zodra de genodigde binnen zeven dagen na aanmelding drie voltooide sessies van minstens 25 minuten heeft gedaan (businessplan §6). Anders vervallen ze. Maximaal vijf vrijgekomen referrals per maand; hoogstens de helft van een verzilvering mag uit referralpunten bestaan. Nooit geld, nooit uit inzet (art. 1a Wok). Delen beide accounts een toestel- of IP-cluster, dan beslist een mens over vrijgave.

### 4.11 Profiel, privacy en leeftijd

**Profiel.** Voornaam, optioneel achternaam, instelling en vereniging, dagdoel, geboortedatum (onzichtbaar voor anderen), meldingen, zichtbaarheid in de squad.

**Modus zonder punten.** Punten en catalogus zijn te verbergen. Rapport 08 adviseert intrinsiek gemotiveerden zo'n modus te bieden (§7, toelichting); wie hem kiest en blijft, laat ons bovendien zien dat de squad zonder punten kan dragen.

**Privacy.** Minimale verwerking (businessplan §8): sessietijdstempels, zichtbaarheidsgebeurtenissen, squadlidmaatschap; geen locatie, camera of sensoren. IP-adressen 30 dagen, daarna gehasht (**aanname**, vast te leggen in de DPIA die vóór de pilot nodig is, rapport 09 §7.3). Inzien, exporteren en verwijderen kan in de app.

**Leeftijd.** Zie 3.1. De jurist bevestigt de verwerkingsgrondslag voor 16- en 17-jarigen.

### 4.12 Beheeromgeving

| Onderdeel | Functies | Regels |
|---|---|---|
| Challenges | Aanmaken, periode, verenigingen, maatstaf, plafonds, drempel- en topprijs, publiceren, afsluiten, uitslag verifiëren | Prijzen kunnen niet gepubliceerd worden zonder gekoppeld budget |
| Catalogus | Beloningen, puntenprijs, voorraad, vouchers uploaden, geldigheid, partner | Dekkingsalarm; puntenprijs vast per seizoen |
| Partners | Contract, geboekt bedrag, beloningsbudget, rapportage | Partners krijgen alleen geaggregeerde data |
| Trekkingen | Prijs, looptijd, spelvoorwaarden, kansspelbelasting, trekking met vastgelegde willekeur, winnaar verifiëren | KSB zichtbaar als kostenpost; 18+-filter; limiet per spel |
| Fraudewachtrij | Gemarkeerde sessies, signalen, reden, beslissing, beroep | Elke beslissing met gevolgen voor beloningen door een mens; vierogenprincipe bij accountblokkade |
| Budgetoverzicht | Geboekte omzet, beloningsbudget, uitgegeven, openstaande verplichting, verwachte verzilvering | Beloningsbudget = afgeleide van geboekte omzet |
| Experimenten | Arm per squad of solo-gebruiker, vergrendeld na toewijzing | Toewijzing niet zichtbaar voor de gebruiker; uitleg in de voorwaarden |

---

## 5. Puntenmodel en parameters

| Parameter | Waarde | Reden | In de pilot gevarieerd? |
|---|---|---|---|
| Ratio | 1 punt per geverifieerde minuut in een voltooide sessie | Vast, gepubliceerd, uitlegbaar; geen euro-associatie (rapport 08 §7) | Nee |
| Sessielengtes | 25 / 50 / 90 min | Businessplan §4 | Nee |
| Afgebroken sessie | 0 punten | Businessplan §4 | Nee |
| Pauze binnen sessie | Geen; ketting tussen sessies ≤ 10 min | Behoud van het enige bewijs dat web kan leveren (rapport 09 §3.3) | Nee |
| Dagdoel | Zelf gekozen, stappen van 25 min; voorstel week 1: 50 min; > 150 min met bevestiging | Autonomie (Deci e.a. 1999); overmoed (Carrera e.a. 2018) | Nee |
| Seizoensbonus dagdoel, winstarm | +25 punten per gehaald dagdoel, direct | Doelgebonden in plaats van stukloon (rapport 08 §7, toelichting) | Ja, arm W |
| Seizoensbonus dagdoel, verliesarm | Maandag 175 punten weekbudget (7 × 25); per gemist dagdoel −25; per gehaald dagdoel 25 direct veiliggesteld | Patel e.a. 2016: verliesframing 0,30 → 0,45 doeldagen tijdens de prikkel | Ja, arm V |
| Einde seizoensbonus | 18 januari 2027, vooraf aangekondigd | Afbouw zonder ratio te wijzigen; meetpunt voor nawerking | Nee |
| Terugkombonus | +15 punten, eerste voltooide sessie na een gemiste dag, max. 1× per week | Milkman e.a. 2021 (tijdens interventie) | Nee |
| Rustdag-joker | 1 per week, automatisch | Lally e.a. 2010; Silverman en Barasch 2023 | Nee |
| Squadstreakmijlpaal | 7 / 14 / 21 dagen: badge + 50 punten per lid dat die dag zijn doel haalde | Sociale commitment zichtbaar maken (Patel e.a. 2019) | Nee |
| Dagplafond punten uit sessies | 300 | Fraude begrensd; gezondheid | Nee |
| Weekplafond punten totaal | 1.500 | Begrenst verplichting per gebruiker | Nee |
| Inverdienperiode | 300 geverifieerde minuten | Businessplan §4 | Nee |
| Weekplafond verzilvering | 1 verzilvering en max. 1.200 punten per week | Businessplan §4; begrenst het verzilveringsvolume | Nee |
| Referral | 100 punten per partij; vrij na 3 sessies ≥ 25 min binnen 7 dagen; max. 5 per maand; max. 50% van een verzilvering | Businessplan §6 | Nee |
| Vervaldatum | 12 maanden na bijschrijving, bericht 30 dagen vooraf | Begrenst verplichting; open juridische vraag | Nee |
| Lot in trekking | 1 per persoon per gehaald weekdoel (≥ 5 van 7 dagen, joker telt) | Kans losgekoppeld van minuten | Nee |
| Challengeplafond | 8 uur per lid per dag | Businessplan §4 (werkhypothese) | Nee |
| Squadpauze | Na 7 dagen zonder voltooide sessie | Businessplan §4 | Nee |
| Belofte-aanbod | Dag 14 (of eerder bij ≥ 8 gehaalde dagdoelen) | Royer e.a. 2015 | Ja, arm B tegenover geen aanbod |

**De verliesarm in detail.** In arm V ziet de gebruiker op maandag: "Je weekbudget: 175 punten. Elke dag dat je je doel haalt, zet je 25 punten veilig." Haalt hij zijn dagdoel, dan gaat 25 meteen naar zijn beschikbare saldo; directe bijschrijving blijft dus gelden. Mist hij een dag zonder joker, dan ziet hij "−25, je budget is nu 150". Het budget is geen verplichting in het grootboek; alleen veiliggestelde punten worden geboekt. Arm W ziet: "Haal je doel vandaag: +25." De verwachte waarde is gelijk, zoals in Patel e.a. 2016. De taal in arm V blijft feitelijk, zonder schaamte. Patel vond na 13 weken in geen arm nog effect; de verliesarm test dus het effect tijdens het seizoen, niet de nawerking.

**Het 2×2-ontwerp.** Armen W en V kruisen we met wel of geen Belofte-aanbod. We randomiseren per squad, omdat squadleden elkaar beïnvloeden; solo-gebruikers randomiseren we individueel en analyseren we apart. Bij een cohort van 300–800 gebruikers (rapport 03) zijn er waarschijnlijk enkele tientallen squads per cel: te weinig om kleine effecten aan te tonen. We registreren ontwerp en analyses vooraf, rapporteren effectgroottes met betrouwbaarheidsintervallen en lezen de uitkomst als richting, niet als bewijs. Rapport 08 vraagt 8 weken interventie en 8 weken follow-up; de pilot duurt bijna 7 weken, dus de follow-up loopt door in semester 2.

---

## 6. Anti-fraude in de web-MVP

**Wat de web-MVP eerlijk claimt.** "Rewarded telt je focustijd zolang de app zichtbaar op je scherm openstaat. Wissel je van app of tabblad of gaat je scherm uit, dan stopt de sessie." Niet: "we weten dat je je telefoon niet gebruikte" of "bewezen focus" (rapport 09 §8). De zin staat in de onboarding, bij afbrekingen, achter de QR en in de voorwaarden. We claimen minder afleiding en meer studietijd, geen cognitieve winst (rapport 08 §5).

**Wat we accepteren.** Een tweede apparaat, een oude telefoon aan de lader of een headless browser zijn met web-verificatie niet uit te sluiten (rapport 09 §3.3). We beperken de schade economisch: geen cash-out, plafonds, inverdienperiode en alleen kleine verdiende prijzen, zodat fraude nauwelijks loont.

| Signaal | Hoe gelogd | Bewaartermijn |
|---|---|---|
| Start, einde, afbreking (servertijd) | Per sessie | Looptijd account |
| Heartbeats met nonce, gaten | Per sessie, samengevat | 90 dagen detail, daarna samenvatting |
| `visibilitychange`, `pagehide`, `blur`/`focus` | Tijdstempel en type | 90 dagen |
| Wake Lock verkregen, geweigerd, vrijgegeven | Tijdstempel en reden | 90 dagen |
| Monotone klok tegenover servertijd | Afwijking per heartbeat | 90 dagen |
| Apparaattype, browser, versie, `navigator.webdriver` | Per sessie | 90 dagen |
| IP-adres | Per sessie | 30 dagen, daarna gehashte cluster |
| Beperkte browserkenmerken voor clustering | Hash | 90 dagen |
| Accountgegevens: aanmeldmoment, telefoon geverifieerd, referrer | Per account | Looptijd account |

**Heuristieken die een sessie markeren.** Een markering is een vraag, geen oordeel. (1) `navigator.webdriver` waar of andere automatiseringskenmerken. (2) Meer dan drie accounts met sessies vanaf hetzelfde browsercluster binnen 24 uur. (3) Een account dat sessies maakt op meer dan 7 uur per dag, drie dagen achter elkaar. (4) Sessies van verschillende accounts die op dezelfde seconde starten en eindigen. (5) Afwijking tussen monotone klok en servertijd groter dan 5 seconden. (6) Offline-gat langer dan 5 minuten. (7) Referralketens waarin genodigden binnen een uur na aanmelding exact de vestingdrempel halen en daarna stoppen. (8) Een squad of vereniging met een uitschieter boven het 99e percentiel van de verdeling. De drempels zijn **aannames**, te kalibreren in pilotweek één op het aandeel eerlijke sessies dat ze onterecht raken.

**Wat er met gemarkeerde sessies gebeurt.** De punten gaan naar *in controle*. De minuten tellen voorlopig voor dagdoel en streak, zodat een vals alarm geen streak breekt, maar niet voor de challenge. De gebruiker ziet de reden en de doorlooptijd (streefwaarde 5 werkdagen). Een beheerder keurt goed, wijst af of onderzoekt het account; een blokkade vraagt twee beoordelaars.

**Beroep.** Binnen 14 dagen na afwijzing, in de app, met een korte toelichting. Een andere beheerder beslist binnen 5 werkdagen, gemotiveerd (businessplan §4; art. 22 AVG, rapport 09 §7.3).

**Kill-criterium.** Ligt het aandeel gemarkeerde sessies boven 5%, dan gaan de beloningen in de gratis laag omlaag tot native verificatie er is (businessplan §9).

---

## 7. Meetplan

**Eventtaxonomie.** Elk event heeft standaard `user_id` (gepseudonimiseerd), `ts_server`, `arm_framing` (W/V), `arm_belofte` (B/geen), `squad_id` (indien), `days_since_signup`, `device_type` en `app_installed` (PWA ja/nee).

| Event | Eigenschappen | Wanneer |
|---|---|---|
| `signup_started` | `source` (squad, vereniging, referral, wachtlijst), `invite_id` | Opent aanmeldflow |
| `signup_completed` | `age_band` (16–17, 18+), `source` | Account aangemaakt |
| `age_blocked` | — | Geboortedatum < 16 |
| `daily_goal_set` | `minutes`, `previous_minutes`, `prompted_by` (onboarding, reflectie, zelf) | Dagdoel gekozen of gewijzigd |
| `pwa_installed` | — | Installatie gedetecteerd |
| `push_permission` | `granted` | Na toestemmingsvraag |
| `session_started` | `planned_min`, `device_type`, `wakelock_supported`, `chain_index` | Server opent sessie |
| `wakelock_event` | `type` (acquired, denied, released), `reason` | Bij elke wijziging |
| `session_completed` | `planned_min`, `verified_min`, `points` | Server valideert voltooiing |
| `session_aborted` | `reason_code` (hidden, heartbeat_gap, user_stop), `elapsed_min` | Afbreking vastgesteld |
| `abort_recovery` | `action` (restart, shorter, leave), `seconds_to_action` | Keuze na afbreking |
| `session_flagged` | `heuristic_codes` | Markering gezet |
| `flag_resolved` | `outcome`, `hours_to_resolve` | Beheerder beslist |
| `appeal_submitted` / `appeal_resolved` | `outcome` | Beroep |
| `daily_goal_met` | `goal_min`, `verified_min` | Dagdoel gehaald |
| `daily_goal_missed` | `joker_used` | Dag afgesloten zonder doel |
| `points_credited` | `type` (session, bonus_goal, comeback, streak, referral), `amount`, `status` | Elke grootboekregel |
| `weekly_budget_shown` / `weekly_budget_reduced` | `remaining` | Alleen arm V |
| `catalog_viewed` | `eligible` (inverdienperiode gehaald) | Catalogus geopend |
| `reward_redeemed` | `reward_id`, `points`, `partner_id` | Verzilvering |
| `squad_created` / `squad_joined` / `squad_left` | `squad_size` | Wijziging lidmaatschap |
| `squad_invite_sent` / `squad_invite_accepted` | `channel` | Uitnodiging |
| `presence_viewed` | `members_live` | App geopend met live leden |
| `joined_live_session` | `members_live` | Sessie gestart terwijl een squadlid live is |
| `squad_streak_day` | `streak_len`, `share_met` | Squaddag afgesloten |
| `squad_streak_broken` | `streak_len` | Streak eindigt |
| `member_auto_paused` / `member_unpaused` | `days_inactive` | Pauzeregel |
| `duel_created` / `duel_accepted` / `duel_finished` | `length_days`, `metric`, `result` | Duel |
| `club_linked` | `club_id` | Koppeling vereniging |
| `belofte_offered` | `trigger` (dag14, vroeg) | Aanbod getoond |
| `belofte_made` | `days_per_week`, `min_per_day`, `visibility`, `vs_history_ratio` | Belofte aangegaan |
| `belofte_day_result` | `met` | Per dag |
| `belofte_reflection` | `action` (verlengen, aanpassen, stoppen), `stake_interest` (ja, nee, weet niet; alleen 18+) | Na twee weken |
| `no_points_mode` | `on` | Modus zonder punten aan of uit |
| `draw_entry` | `draw_id` | Lot toegekend |
| `prize_earned` / `prize_verified` | `prize_id`, `type` | Verdiende prijs |
| `card_created` / `card_shared` / `card_qr_scanned` | `card_type`, `fields_shown` | Bewijskaart |
| `referral_link_shared` / `referral_signup` / `referral_vested` / `referral_expired` | `referrer_id` | Referral |

**KPI's en hoe ze uit events volgen.**

| KPI | Definitie uit events |
|---|---|
| Activatie | Aandeel `signup_completed` met een `session_completed` (`planned_min` ≥ 25) binnen 24 uur |
| D1 / D7 / D30 | Aandeel van de cohort met ≥ 1 `session_completed` op dag N na aanmelding (definitie rapport 03). Voor D30 tellen we vakantiedagen 21 december – 4 januari niet mee (dag N wordt "studiedag N"); het voorstel moet de founder bevestigen |
| W3-retentie | Aandeel activeerden met `session_completed` op ≥ 2 verschillende dagen in dag 15–21 |
| Squad-aandeel | Aandeel wekelijks actieven met een actief lidmaatschap (`squad_joined` zonder `squad_left`) of een lopend duel |
| D7 squad tegenover solo | D7 voor gebruikers die binnen 48 uur na aanmelding in een squad zaten, tegenover de rest |
| K-factor | (`squad_invite_accepted` + `referral_signup` die tot activatie leiden) / activeerden, per cyclus van 7 dagen |
| Gemarkeerde sessies | `session_flagged` / (`session_completed` + `session_flagged`) |
| Beloningskosten binnen budget | Som kostprijs van `reward_redeemed`, `prize_verified` en trekkingen inclusief KSB, tegenover geboekt beloningsbudget |
| Afbouwcurve | Gemiddelde `verified_min` per actieve gebruiker per week, week 3–4 gedeeld door week 1–2 |
| Belofte-overname | `belofte_made` / `belofte_offered` |
| Belofte-houdbaarheid | Aandeel `belofte_day_result` met `met` = waar; aandeel reflecties met verlengen |
| Nawerking | `verified_min` per gebruiker in 19 januari – 1 februari gedeeld door 5 – 18 januari, per arm |
| Herstel na afbreking | Aandeel `session_aborted` gevolgd door `session_completed` dezelfde dag |
| Herstel na gebroken streak | Aandeel `squad_streak_broken` gevolgd door een nieuwe `squad_streak_day` binnen 3 dagen |
| Interesse in inzet | Aandeel `stake_interest` = ja onder 18+ reflecties (indicatie H-C) |

**Experimentarmen en hypotheses.**

| Arm | Toetst | Primaire maat | Bewijs |
|---|---|---|---|
| W tegenover V | H-A: verliesgeframed weekbudget geeft meer geverifieerde focusminuten dan dezelfde bonus als winst | Gehaalde dagdoelen en focusminuten per week tijdens het seizoen | Patel e.a. 2016 |
| B tegenover geen aanbod | H-B: effect blijft na het einde van de seizoensbonus beter behouden met een commitmentaanbod | Nawerking (focusminuten na 18 januari) | Royer e.a. 2015; Allcott e.a. 2022 |
| Interactie | Werkt de Belofte beter na een verliesgeframed seizoen of na een winstgeframed? | Nawerking per cel | Geen; verkennend |
| Beschrijvend: squad tegenover solo | Is de sociale loop echt? | D7, W3 | Businessplan §9 |
| Beschrijvend: modus zonder punten | Blijven gebruikers zonder punten? | W3, nawerking | Rapport 08 §7 |

Daarnaast verzamelen we in week 1 en week 5 een korte vragenlijst over intrinsieke motivatie (enkele items uit een SDT-schaal, rapport 08 H-E) en vragen we aan het einde zelfgerapporteerde studietijd buiten de app. H-G (studieresultaten) kunnen we in de pilot niet toetsen zonder instelling; dat is een open vraag.

---

## 8. Scope

| Prioriteit | Onderdeel | Motivatie |
|---|---|---|
| **Must** | Focus-engine met zichtbaarheid, Wake Lock, servertijd, heartbeat, eenduidige afbreekuitleg | Het enige bewijs dat de web-MVP levert; businessplan §10 |
| Must | Puntengrootboek met ratio, inverdienperiode, plafonds, statussen, verval | Verplichting per gebruiker controleerbaar; businessplan §5 |
| Must | Zelfgekozen dagdoel met overmoedrem | Basis voor bonus, streak, duel en Belofte |
| Must | Squads met live aanwezigheid, squadstreak, joker, auto-pauze | Motor van retentie en groei; kill-criterium squad tegenover solo |
| Must | Seizoensbonus in twee armen (W/V) en experimenttoewijzing per squad | Expliciete pilotarm uit het businessplan |
| Must | Belofte met aanbod op dag 14 en reflectie | Centrale pilothypothese |
| Must | Verenigingschallenge, twee ranglijsten, bestuursdashboard, collectieve prijs | Wedge (businessplan §3) |
| Must | Catalogus met budgetdekking en vouchers | Businessplan §10 |
| Must | Leeftijdscheck en 16+/18+-logica | Harde randvoorwaarde |
| Must | Beheeromgeving: challenges, catalogus, partners, fraudewachtrij met beroep | Zonder menselijke herbeoordeling geen beloningen |
| Must | Eventtaxonomie en KPI-dashboard | Zonder meting geen go/no-go |
| Must | Duels | In de MVP-scope van het businessplan (§10); competitie in kleine verbanden bleef in de follow-up significant (Patel e.a. 2019) |
| Must | Deelbare bewijskaart met QR | In de MVP-scope (§10); versterker van de groei, geen motor (§6) |
| Must | Spelvoorwaarden en module voor verlote prijzen, uit te schakelen | In de MVP-scope (§10); secundair en afhankelijk van de Kansspelautoriteit, dus als laatste must gebouwd en met één schakelaar uit te zetten |
| **Should** | Referral met vesting | Draagt bij aan K ≥ 0,3, maar squads leveren de meeste uitnodigingen al |
| Should | Terugkombonus | Goedkoop, onderbouwd tijdens de looptijd (Milkman e.a. 2021) |
| Should | Modus zonder punten | Bescherming tegen verdringing en meetinstrument |
| Should | Verdiende individuele prijzen | Waardevol in de tentamenweek, maar handmatig te beheren |
| **Could** | Pushmeldingen voor live squad | Sterke trigger, maar ondersteuning in geïnstalleerde webapps op iOS moet nog getest worden |
| Could | Ketting-statistieken en weekreflectie met competentiefeedback | Verfijning van feedback |
| Could | Enquêtevraag naar interesse in inzet | Goedkoop; alleen bruikbaar als de Belofte loopt |
| **Won't (MVP)** | Inzetlaag, betalingen aan gebruikers, geldprijzen | Businessplan §10; vereist native verificatie en juridische toetsing |
| Won't | Native verificatie, sensoren, camera, locatie | Rapport 09: geen meerwaarde op het web of te zware AVG-last |
| Won't | Openbare individuele ranglijsten | Businessplan §4; Bursztyn en Jensen 2015 |
| Won't | Beloning op delen, loot boxes, variabele wisselkoers, cash-out | Harde randvoorwaarden |
| Won't | Rewarded Plus | Pas vanaf semester 2 (businessplan §5) |

**Na de pilot.** (1) *Native verificatie*: iOS-app met actieve blokkade via de Screen Time-API's en Android-app met UsageStats, met App Attest en Play Integrity (rapport 09, treden 2 en 3). De Family Controls-entitlement vragen we aan zodra het ontwikkelaarsaccount bestaat. (2) *Inzetlaag*: alleen als de Belofte in de pilot een meetbaar behoud laat zien en de enquête interesse toont, en pas na advocatenopinie, Ksa-toets, acceptatie door de betaaldienstverlener en native verificatie. De inzetlaag wordt dan de harde vorm van de Belofte: dezelfde flow, met een bedrag dat bij falen naar een goed doel gaat. (3) *Plus*: statistieken, thema's, uitgebreide squads en later de inzetfunctie, nooit gekoppeld aan trekkingskansen.

---

## 9. Open vragen en aannames

**Aannames die de pilot toetst.**
- Een sociale Belofte zonder geld heeft een deel van het behoudende effect dat Royer e.a. 2015 vond met een zelfgefinancierd contract. Dat is de kernaanname van deze variant; direct bewijs ervoor ontbreekt.
- Een seizoensbonus van 25 punten is groot genoeg om verlies te laten voelen en klein genoeg om niet als loon te voelen.
- De drempels voor W3, afbouwcurve, Belofte-overname en nawerking zijn eigen inschattingen.
- Squadstreak op "minstens de helft van de actieve leden" is vergevingsgezind genoeg om squads niet te laten doodslaan en streng genoeg om betekenis te hebben.
- De fraudeheuristieken raken weinig eerlijke gebruikers. Kalibratie in week één.

**Open vragen voor de jurist.**
- Vervaldatum van punten na 12 maanden en de mededeling "zolang de voorraad strekt": houdbaar onder het consumentenrecht?
- Is de verliesgeframede arm een oneerlijke handelspraktijk of een dark pattern als de verwachte waarde gelijk is en de uitleg in de voorwaarden staat?
- Grondslag voor verwerking bij 16- en 17-jarigen, en of de toewijzing aan experimentarmen extra informatie of toestemming vraagt.
- Plafond voor individuele verdiende prijzen op het web.
- Accepteert de Kansspelautoriteit een reeks kleine trekkingen (rapport 02 §8)?

**Open vragen voor techniek en ontwerp.**
- Gedrag van Wake Lock en Page Visibility op echte iOS- en Android-toestellen in geïnstalleerde webapps (rapport 09 noemt de compatibiliteitsdata, geen veldtest).
- Ondersteuning van webpushmeldingen in geïnstalleerde webapps op iOS: te verifiëren voordat de meldingen een must worden.
- Hoe vaak breekt een eerlijke sessie af door een inkomend gesprek? Bij hoge aantallen is een kort herstelvenster na de pilot te overwegen, binnen de regel dat afgebroken sessies geen punten geven.
- Zijn laptopsessies evenveel waard? Op de laptop zegt zichtbaarheid niets over de telefoon. In de MVP tellen ze gelijk; we meten afbraak en markeringen per apparaattype.

**Open vragen voor de founder.**
- Bevestiging van de D30-correctie voor de kerstvakantie (studiedagen in plaats van kalenderdagen).
- Is de pilot groot genoeg voor 2×2, of kiezen we één factor? Mijn voorkeur: beide behouden en de uitkomsten als richting lezen.
- Kan een faculteit geanonimiseerde studieresultaten leveren voor H-G? Zonder dat zeggen we alleen dat studenten meer focustijd registreren, niet dat ze beter studeren.
- Puntenprijzen in de catalogus leggen we vast zodra de eerste partnerbeloningen geboekt zijn.
