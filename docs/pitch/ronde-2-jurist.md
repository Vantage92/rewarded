# Pitchronde 2 — Beoordeling jurist en fraude-expert

*Beoordelaar: jurist (kansspelrecht, consumentenrecht, AVG, betaaldiensten) en fraude-expert. Onafhankelijk van het team dat de plannen schreef. Datum: 4 november 2026 (de stukken dragen 5 november). Gelezen: `docs/pitch/pitch.md` (v2), `docs/01-businessplan.md` (v2), `docs/02-productplan.md` (v2), `docs/pitch/README.md`, alle `docs/pitch/ronde-1-*.md`, `docs/research/02-businessmodel-juridisch-unit-economics.md` en `docs/research/09-verificatietechniek.md` volledig, uit `docs/research/07-architectuur.md` §3 (domeinmodel), §4 (sessieprotocol en heuristieken), §5.2–5.3 (verzilvering en dekking), §6 (ranglijst, steekproef), §7 (trekkingen) en §10 (beveiliging en AVG). Om te toetsen of mijn must-fixes echt zijn opgelost ook: `docs/juridisch/gebruiksvoorwaarden.md` en `challengevoorwaarden.md` volledig, `vragen-advocatenopinie.md` (vragen 1–3, 8–10 en het overzicht), `docs/pilot/voorregistratie.md` (§5, §7, §8) en de passages over de rustperiode en ambassadeurs in `docs/research/05-productspecificatie.md`. Dit is geen formeel juridisch advies en vervangt de advocatenopinie niet.*

## Oordeel: GO

Alle zes must-fixes uit ronde 1 zijn opgelost, in de plannen én in de bouw- en juridische documenten die eronder liggen. Het team heeft niet alleen de woorden overgenomen. De oplossingen zitten in het datamodel (`prize_eligible`, `email_norm_hash`, `anchor_only`, `first_redeem_after`, `phone_line_type`, `CHECK` zonder `drawn`-route), in de voorregistratie (steekproef met interval, red-teamdag, drempels op de seed) en in vijf conceptdocumenten plus een vragenlijst voor de advocaat met per vraag een standaarduitkomst als het antwoord niet op tijd komt. Dat laatste is precies wat ik in ronde 1 miste: elke juridische poort valt nu bij twijfel of stilte naar de voorzichtige kant. Een mislukte opinie levert dus een kleinere pilot op, geen onrechtmatige.

Ik zie geen nieuw probleem dat de pilot ongeldig, het bedrijf onhoudbaar of het product juridisch of ethisch onhoudbaar maakt en dat ik in ronde 1 redelijkerwijs niet kon zien. Daarom GO, zonder must-fixes. Dat is geen vrijbrief. Hieronder staan twaalf should-fixes. Drie daarvan wil ik vóór de prijsperiode van 4 januari opgelost zien, omdat ze anders het grootste reputatierisico van deze pilot open laten:

- samenspanning met echte leden en hun accounts (should-fix 1);
- de voorwaarden waaronder de rustperiode-arm houdbaar is (should-fix 2);
- het woord "geverifieerd" in de verkoop aan instellingen (should-fix 3).

Mijn GO veronderstelt dat de gates echt worden gehandhaafd. Geen ondertekende DPIA betekent geen uitnodigingen. Geen positieve opinie vóór 2 december betekent geen hoofdprijs. Geen antwoord over arm B of de rustperiode vóór 25 november betekent dat die arm vervalt. Valt een van die regels onder tijdsdruk om, dan vervalt mijn oordeel.

## Uit de vorige ronde

| # | Must-fix ronde 1 | Status | Toelichting |
|---|---|---|---|
| J1 | Het fraudecriterium meet detectie, niet fraude | **Opgelost** | De go/no-go-maat is nu een wekelijkse willekeurige, gestratificeerde steekproef van 30 accounts, met een 95%-interval (voorregistratie §7.1). Markeringen meten alleen de wachtrijlast. Er komt een red-teamdag vóór 25 november, en elke KPI wordt ook gerapporteerd zonder de verdachte accounts. Resterende punten bij de beslisregel en het bereik van de lichte controle staan in should-fix 1 en 4. |
| J2 | De verenigingsprijs is de grootste fraudeprikkel | **Opgelost** | Het ledental komt uit een externe bron, wordt vastgezet en staat openbaar. Zonder bron dingt een vereniging niet mee naar de hoofdprijs (`prize_eligible`). In de teller telt alleen wie een identiteitsanker heeft. E-mailadressen worden genormaliseerd. Bij elke winnaar en drempelvereniging komt een verplichte steekproef van 20. Campus- en CGNAT-adressen krijgen hogere drempels in plaats van te worden overgeslagen. Diskwalificatie gaat met hoor en wederhoor en beroep bij een externe beoordelaar (challengevoorwaarden A8–A10), met de terugvalvariant "alleen drempelprijzen" als de opinie er niet is. Het anker verplaatst de fraude wel: van nepidentiteiten naar echte leden die hun account laten bespelen (should-fix 1). |
| J3 | Meervoudige accounts in catalogus, referral en ambassadeurs | **Opgelost** | Alleen mobiele nummers (`lookupLineType`). H11 per toestel bij verzilvering. Zeven dagen wachttijd met een menselijke blik. Vrijgave gespreid over de week, deels gereserveerd voor het instellingsanker. Ambassadeurs worden betaald op dag 14, alleen voor gebruikers met minstens vijf sessies, instellingsanker en zonder verdenking, met een plafond van 40 per ambassadeur per maand, uitbetaling na de steekproef en geen bestuurslid als ambassadeur. Referral vest pas na de wachttijd en niet op hetzelfde toestel. De ambassadeursrelatie zelf heeft nog geen contract (should-fix 5). |
| J4 | Trekkingen: geen standaarduitkomst, pitch zei iets anders | **Opgelost** | De module wordt niet gebouwd. `draws` staat altijd uit en heeft geen route. In productplan, businessplan, architectuur §7 en de gebruiksvoorwaarden (§10.1) staat "stilte is nee". De pitch noemt trekkingen een optie na toetsing, en de unit economics rekenen zonder trekkingen. Een eventuele structuur is één promotioneel spel per jaar, met de fiscalist op art. 4 Wet KSB. |
| J5 | De DPIA moet de bouw veranderen en vóór de verwerking af zijn | **Opgelost in plan; uitvoering open** | Er is per verwerking een grondslag (architectuur §10.5, privacyverklaring §2). Live aanwezigheid staat standaard uit voor `16_17`, minderjarigen zitten in arm A en buiten de rustperiode, `squad_id` wordt bij verwijdering vervangen (§10.7, met een test), en er is een verenigingsovereenkomst zonder ledenlijst (`agreement_ref` verplicht). De DPIA-light komt "deze week" en de volledige DPIA is een harde poort vóór de eerste uitnodiging. Op 4 november kan ik dat nog niet controleren. Dat is een uitvoeringspunt, geen ontwerppunt. |
| J6 | De voorwaarden bestaan niet | **Opgelost** | Gebruiksvoorwaarden, challengevoorwaarden, spelvoorwaardensjabloon, privacyverklaring, verenigingsovereenkomst en een vragenlijst voor de advocaat liggen er, met de inhoud die ik vroeg. De bedingen die de rechter toetst hebben een termijn van 30 dagen en een opzegrecht (§13). Een definitieve uitslag volgt pas na steekproef en beroep (A10). Twee kleine onjuistheden en één ontbrekende partij staan in should-fix 2, 6 en 11. |

Should-fixes uit ronde 1:

- **Volledig opgelost:** JS2 (voor arm A/B: gelijke maximale bonus, ook op de tentamendag, gebruiksvoorwaarden §6.2 en §6.11), JS3, JS4, JS5, JS6, JS9, JS10 en JS11.
- **JS1 deels opgelost.** "Bewezen" is weg. Waar het stond, staat nu vaak "geverifieerd", en dat maakt dezelfde claim (should-fix 3).
- **JS7 en JS8:** genoteerd voor later; dat volstaat in deze ronde.

## Wat mij gevraagd is: arm B en de rustperiode-arm

De founder heeft beide armen aan "de jurist" voorgelegd (productplan §4, founder-reactie G1). Hier is mijn oordeel. Het is geen opinie, maar wel iets wat de advocaat kan gebruiken.

**Arm B (slinkend weekbudget).** Ik zie geen oneerlijke handelspraktijk. Er is geen inleg en geen eigen geld. De verwachte en de maximale bonus zijn gelijk aan arm A, ook op een tentamendag. De regel staat in feitelijke taal bij elke mutatie en de stopdatum ligt vast. Voor een agressieve praktijk (art. 6:193h BW: intimidatie, dwang of ongepaste beïnvloeding) ontbreekt de druk, en de deelnemer kan uit het onderzoek stappen. Dat 16- en 17-jarigen in arm A zitten, is verstandig, maar volgens mij niet verplicht. Voorwaarde: geen aftellers of urgentie-copy rond het vervallen budget. Laat een test in `core` bewijzen dat het maximum per week in A en B gelijk is. Een belangrijk risico zit niet in het recht maar in de planning (zie vraag 2 hieronder): zonder antwoord van de advocaat op 25 november vervalt arm B, en daarmee de enige gepowerde vergelijking.

**Rustperiode-arm.** Het argument van de founder klopt niet, de uitkomst wel. "Geen beloningsregel maar een onderzoeksconditie" is een etiket. Voor de Wok en voor art. 6:233 BW telt het effect, en het effect is dat het lot bepaalt of je tien weken lang inwisselbare punten kunt verdienen. Zonder meer zou dat precies de spanning met JS2 zijn die ik in ronde 1 wilde voorkomen. Wat de arm wél houdbaar maakt, is iets anders: wie uit het onderzoek stapt, verdient vanaf de volgende focusdag weer punten (gebruiksvoorwaarden §6.8). De deelnemer beslist dus zelf, zonder verlies, of hij in de rustperiode blijft. Daarmee is er geen kansbepaling waarop hij geen overwegende invloed heeft. De regel staat vóór het akkoord in de onboarding (voorregistratie §8.1) en de groep is een week vóór de start zichtbaar (11 januari). Daarmee voldoet de arm aan de informatieplicht. Mijn oordeel: houdbaar, onder de drie voorwaarden in should-fix 2. Zonder werkende en vindbare uitstapmogelijkheid zou ik de arm niet verdedigen.

## Scoretabel

| Criterium | Ronde 1 | Ronde 2 | Motivering (vanuit mijn rol) |
|---|---|---|---|
| Probleem en doelgroep | 7 | 7 | Ongewijzigd en houdbaar. De 16+-grens is juridisch goed onderbouwd (art. 5 UAVG, gecontroleerd in ronde 1), en de extra bescherming van 16- en 17-jarigen is nu consequent doorgevoerd: arm A, geen rustperiode, aanwezigheid uit, duels alleen binnen de squad (gebruiksvoorwaarden §6.7, `duel.in_squad`-invariant). |
| Oplossing en gedragseffect | 6 | 6 | Buiten mijn vak. De eerlijke claim staat letterlijk in de voorwaarden (§3.1–3.2). Maar "geverifieerde focus" en "geverifieerde studie-inzet" in pitch en businessplan beloven meer dan een zichtbaar tabblad (should-fix 3). |
| Beloningsmodel | 5 | 7 | Legaal: vaste ratio, geen cash-out, soortregel in de database, geen trekkingen, terugvalvariant voor de rangprijs. Uitlegbaar. Economisch begrensd door de dekkingsregel en de eigen post van €1.500. Fraudebestendig tegen nepidentiteiten. Nog niet tegen echte leden die hun account laten bespelen (should-fix 1). |
| Groei | 5 | 7 | De ambassadeursregel is nu fraudebestendig en referral is goed afgeschermd. Er is geen ambassadeurscontract (leeftijd, reclame-identificatie, fiscaal), en de ambassadeurs zijn de enige geldstroom naar studenten in dit plan (should-fix 5). |
| Unit economics | 5 | 6 | Geen kansspelbelasting meer: art. 3 lid 2 Wet KSB rekent alleen prijzen van kansspelen. Fraudeverlies is door de dekkingsregel begrensd tot het budget. Maar met €1.500 voor alles blijft er na de verenigingsprijzen weinig catalogus over, en "verdiende beloningen" mag geen lege belofte worden (should-fix 10). |
| Verdediging | 5 | 5 | Compliance-by-design is werk dat een kopie niet snel doet, maar het is geen juridische drempel. Als de verdediging rust op "geverifieerde studie-inzet" voor instellingen, is de claim die de verdediging draagt juist de zwakste (should-fix 3). |
| Uitvoerbaarheid | 5 | 6 | Het juridische werk tussen 4 november en 2 december is nog steeds zwaar: vijf documenten, opinie, DPIA, verwerkersovereenkomsten en externe ledentallen, voor een founder die zelf bouwt en de advocaat voorschiet. Het verschil met ronde 1 is dat elke vraag nu een standaarduitkomst heeft. Er is nog geen rechtspersoon in de stukken (should-fix 6) en geen offerte van een advocaat. |
| Risico's | 6 | 8 | Fraude rond de verenigingsprijs, deelnemersbescherming en de AVG staan in de risicotabel en hebben een poort. Wat ontbreekt: samenspanning met echte leden (1), het claimrisico in B2B (3) en de schaarste in de catalogus (10). |

## Must-fix

Geen. Het oordeel GO vraagt geen voorwaarden die de pilot ongeldig of het product onhoudbaar zouden maken als ze ontbreken. De gates die de founder zelf heeft gezet (DPIA, opinie, standaarduitkomsten) behandel ik als onderdeel van het plan, niet als open punten.

## Should-fix

1. **Samenspanning met echte leden: het anker verplaatst de fraude, het stopt haar niet.** (Vóór de prijsperiode van 4 januari; hoogste prioriteit. Dit had ik in ronde 1 al scherper moeten maken.)
   - *Wat.* Met het identiteitsanker loont een nepaccount niet meer. Het goedkoopste alternatief voor een bestuur is nu: echte leden met hun eigen instellingsmail of telefoon laten registreren en hun sessies laten draaien door één bestuurslid. Op desktop blijft een tabblad volgens rapport 09 §3.2 `visible` zolang het venster niet geminimaliseerd is. Eén laptop met zes browserprofielen in zes vensters naast elkaar draait dus zes accounts tegelijk, elk met een eigen `client_device_id`.
   - *Wat de controles zien.* H7 en H10 kijken naar registraties, en die gebeurden echt en verspreid. H2 krijgt op eduroam een hogere drempel, die juist hoog genoeg moet zijn voor twintig eerlijke studenten achter één UB-adres (architectuur §4.5). De lichte controle in de steekproef vraagt per e-mail om de vereniging en squad te bevestigen. Dat doet het echte lid gewoon.
   - *Gevolg.* Zowel de verplichte prijssteekproef als de onafhankelijke fraudeschatting zijn blind voor deze vorm.
   - *Oplossingsrichting.*
     - Een heuristiek H12 "gelijktijdige sessies": accounts met overlappende sessies vanaf dezelfde `ip_hash` en dezelfde `ua_class`, met starttijden binnen twee minuten, vooral desktop. Die markeert, ook op campusadressen.
     - In de prijssteekproef: vergelijk het toestel en de `ua_class` van de sessies met die van inloggen en registratie, en vraag een steekproeflid om vanaf de eigen telefoon één oefensessie te starten.
     - Neem in het red-teamscenario (voorregistratie §7.3) expliciet "zes echte accounts, één laptop, eduroam" op.
     - Zet in challengevoorwaarden A9.1 letterlijk: "sessies laten draaien voor een ander lid, ook met diens toestemming".
2. **De rustperiode-arm is alleen houdbaar onder drie voorwaarden.**
   1. Het bericht dat iemand in de rustperiode zit (`rest_period_notice_shown`, uiterlijk 11 januari) noemt in dezelfde zin hoe je eruit stapt en dat je dan weer punten verdient. De route Ik › Onderzoek alleen is te verstopt. Wie een nadeel oplegt en de uitweg verbergt, komt in de buurt van een misleidende omissie (art. 6:193d BW).
   2. Gebruiksvoorwaarden §6.1 zegt: "welke groep je krijgt, bepaalt nooit of je een prijs wint". Dat is juist voor prijzen, maar met de rustperiode bepaalt de groep wel of je punten verdient. Formuleer dat eerlijk.
   3. Scheid "uit de rustperiode stappen" van "uit het onderzoek stappen". Nu valt wie punten wil terugkrijgen buiten de analyse, en art. 21 AVG laat dat na een bezwaar ook niet anders toe. Daardoor wordt H3b geheid scheef: wie om punten geeft, vertrekt. Biedt een aparte keuze "ik wil weer punten verdienen" die het onderzoek niet beëindigt en waarvan de gevolgen vooraf zijn uitgelegd, dan blijft de juridische uitweg bestaan en kan de analyse op toewijzing (ITT) door. Wie volledig bezwaar maakt, kan dat nog steeds.

   Leg in de voorregistratie vooraf vast vanaf welk verschil in uitstappers tussen de armen H3b niet te interpreteren is. En leg uit in de squad dat een nieuw lid na 19 januari wel punten verdient (lanceringsgebruikers, voorregistratie §2).
3. **"Geverifieerd" is het nieuwe "bewezen", en in de verkoop aan instellingen is dat riskanter.**
   - *Wat.* De pitch spreekt van "vijf uur geverifieerde focus" en, als kern van de verdediging, van "geverifieerde studie-inzet als geaggregeerde data voor een faculteit". De web-MVP verifieert dat een pagina zichtbaar was, niet dat er gestudeerd is (rapport 09 §3.3, gebruiksvoorwaarden §3.2).
   - *Waarom het ertoe doet.* Tegenover consumenten is dit misleidend als het zonder uitleg in copy belandt (art. 6:193c BW). Tegenover een faculteit valt het onder misleidende reclame tussen professionals (art. 6:194 BW). Het verhaal "universiteit betaalt voor studiedata die een open tabblad meten" schrijft zich vanzelf.
   - *Oplossingsrichting.* Breid de lintregel uit naar "geverifieerd" en "verified" in alle uitingen behalve de gedefinieerde term "geverifieerde minuut" met de link naar "Hoe we tellen". Schrijf in pitch en B2B-materiaal: "getelde focustijd (Rewarded zichtbaar op het scherm)", met het verificatieniveau bij elk cijfer dat een instelling krijgt.
4. **De fraudeschatting: scherpere beslisregel, en zeggen wat ze niet ziet.**
   - De drempel is in de voorregistratie de *puntschatting* < 5% (§5.1); de pitch zegt "< 5%, met betrouwbaarheidsinterval". Met ongeveer 180 accounts in zes weken kan een puntschatting van 4% samengaan met een bovengrens van ruim 7%.
   - *Oplossingsrichting.*
     - Kies vooraf: de bovengrens van het interval onder een vastgesteld getal, of de puntschatting met een tweede drempel voor de bovengrens.
     - Leg per oordeel ("verdacht", "frauduleus") de criteria vast, zodat de beoordelaar niet per week een andere lat legt.
     - Stuur het contactbericht naar het bevestigde instellingsadres als dat er is, niet naar het accountadres dat een fraudeur zelf beheert.
     - Rapporteer de schatting als ondergrens, naast de uitkomst van de red-teamdag.
5. **Ambassadeurs hebben een contract nodig.** Dit is de enige plek waar Rewarded geld aan studenten betaalt: tot €200 per ambassadeur per maand, buiten de app. Leg schriftelijk vast:
   - 18+;
   - een opdrachtomschrijving zonder geldclaims ("verdien geld met studeren" is verboden);
   - een herkenbaarheidsplicht bij elke promotie (verborgen reclame is misleidend, art. 6:193c en 6:193g BW; volg de Reclamecode Social Media & Influencer Marketing; die code heb ik in deze sessie niet nagelezen);
   - geen bestuurslid van een deelnemende vereniging;
   - uitbetaling na de steekproef;
   - terugvordering bij vastgestelde fraude.

   Laat de fiscalist de behandeling bepalen (loonheffing of opgaaf van uitbetalingen aan derden; **niet geverifieerd** welke route hier geldt).
6. **Zet de rechtspersoon neer vóór 18 november.** Gebruiksvoorwaarden §1.1, privacyverklaring §1.1 en challengevoorwaarden "Organisator" staan nog op "in te vullen". Zonder rechtspersoon is de founder zelf verwerkingsverantwoordelijke, organisator en aansprakelijk. Verwerkersovereenkomsten, verenigingsovereenkomsten en de opdracht aan de advocaat moeten op naam van de entiteit worden getekend. Vraag tegelijk de offerte van de advocaat op.
7. **Stuur vragen 2 en 3 nu al, niet op 18 november.** De enige gepowerde vergelijking (arm B) en de enige zuivere steigertoets (rustperiode) vervallen als de advocaat binnen zeven dagen niet antwoordt. Dat is een goede standaardregel, maar een onnodig risico. Deze twee vragen hangen niet aan de andere concepten. Stuur §6 van de gebruiksvoorwaarden met vragen 2 en 3 deze week, en mijn oordeel hierboven als achtergrond.
8. **Het label "welzijn" in support is een gezondheidsgegeven.** Mijn antwoord op vraag 9b: ja, waarschijnlijk wel (art. 4 lid 15 AVG). De aparte toestemming voor de vragenlijst dekt dat niet.
   - *Oplossingsrichting.* Behandel S4 als verwerking onder art. 9 lid 2 (de onderzoeker en de advocaat kiezen de uitzondering). Alleen het teamlid dat antwoordt ziet het label. Geen koppeling aan de arm behalve als telling, en de tekst gaat na 90 dagen weg, zoals al voorzien (architectuur §10.6).
   - De schadesignalen S1–S3 zijn profilering zonder rechtsgevolg. Dat is aanvaardbaar, maar het hoort met de belangenafweging in de DPIA.
9. **Toets de plicht tot een functionaris gegevensbescherming opnieuw bij de lancering.** Mijn antwoord op vraag 8i: bij 1.500 pilotgebruikers is art. 37 lid 1 sub b AVG waarschijnlijk nog niet aan de orde. Maar de kernactiviteit is stelselmatige monitoring van gedrag van jongeren, en bij de publieke lancering (≥ 5.000) en een B2B2C-model kan dat kantelen. Leg in de DPIA een herbeoordelingsmoment vast op 19 januari en bij het eerste contract. Een externe FG is goedkoop en helpt in de verkoop aan instellingen.
10. **Wees eerlijk over hoe schaars de catalogus is.**
    - *Rekensom* (werkhypothesen uit het productplan: drie poules, tien verenigingen): 3 × €150 hoofdprijs + 10 × €75 drempelprijs = €1.200. Bij een gedeelde eerste plaats komt er een extra hoofdprijs bij (challengevoorwaarden A7). Van de €1.500 blijft dan ongeveer €300 over: zo'n 60 vouchers van €5 voor de hele gesloten pilot.
    - *Gevolg.* Dat is juridisch in orde zolang het niet anders wordt voorgesteld. Maar wie op de wachtlijst "word beloond" las en zeven weken "Deze week op" ziet, voelt zich misleid, en daar loopt een beloningsplatform op leeg.
    - *Oplossingsrichting.* Toon per week de vrijgegeven voorraad naast het aantal studenten dat mag verzilveren (het dekkingsalarm bestaat al, architectuur §5.3). Noem de schaarste in de onboarding en in de promotiekit. Of verschuif budget van de hoofdprijs naar de catalogus.
11. **Kleine tekstpunten in de voorwaarden.**
    - Gebruiksvoorwaarden §1.4 noemt registratie "vanaf 19 januari" buiten het onderzoek; spec §5 zegt "na 17 januari". Kies één datum.
    - Challengevoorwaarden A4.3 ("anker telt per week vanaf het moment van bevestigen") staat als aanname en moet in de spec.
    - Gebruiksvoorwaarden §8.3 (niet reageren op de steekproef heeft geen gevolg) is juist voor de wekelijkse steekproef. Zet erbij dat het in de prijssteekproef wel betekent dat je niet in de teller telt (A8.3), zodat de twee teksten elkaar niet tegenspreken.
12. **App-storeregels voor later, nu al noteren.** Naast wat er staat (5.3.1–5.3.2 met de Apple-zin in de challengevoorwaarden, 3.1.1 voor Plus, 4.10 voor Screen Time):
    - Een nepdeur voor een abonnement dat niet bestaat, hoort niet in een ingediende app-build. Apple 2.1 vraagt complete apps; ik heb de huidige tekst in deze sessie niet nagelezen.
    - Het Google Play-beleid voor contests met prijzen in natura en voor `PACKAGE_USAGE_STATS` is in geen enkele sessie primair gelezen. Doe dat vóór de Android-bouw, niet erna.

## Vragen die ik in de partnervergadering zou stellen

1. Hoe ziet de pilot een bestuurslid dat op eduroam zes echte ledenaccounts op één laptop laat draaien? Welke heuristiek, welke steekproefvraag, en wat zei de red-teamdag erover?
2. De enige gepowerde vergelijking vervalt als de advocaat niet binnen zeven dagen antwoordt. Is er al een kantoor, een offerte en een datum?
3. Op wiens naam worden op 18 november de verwerkersovereenkomsten en de verenigingsovereenkomsten getekend?
4. Wat zegt de verkoper tegen een faculteit die vraagt wat "geverifieerde studie-inzet" precies meet?
5. Hoeveel studenten in de rustperiode-arm verwacht je dat uitstappen, en vanaf welk verschil tussen de armen is H3b niet meer te lezen?
6. Hoeveel catalogusvouchers zijn er per week voor hoeveel studenten die mogen verzilveren, en wat ziet een student daarvan?
7. Wie is aansprakelijk als een ambassadeur op TikTok "verdien geld met studeren" zegt? Staat er een herkenbaarheidsplicht in zijn contract?
8. Bij welk aantal gebruikers of welk contract beoordeel je opnieuw of een functionaris gegevensbescherming verplicht is?
9. Is de puntschatting van de fraude onder 5% genoeg om te lanceren als de bovengrens van het interval op 8% ligt?

## Wat mij overtuigt om GO te houden (en wat het zou breken)

GO blijft staan als vóór 2 december blijkt:

- dat er een rechtspersoon is en een getekende opdracht aan de advocaat;
- dat de DPIA ondertekend is vóór de eerste uitnodiging;
- dat de red-teamdag het scenario met echte accounts op één laptop heeft getest, met een heuristiek of steekproefstap die het ziet;
- dat het rustperiodebericht de uitweg noemt.

GO vervalt als een van de door de founder gezette poorten onder tijdsdruk wordt omgezet:

- uitnodigingen zonder ondertekende DPIA;
- een hoofdprijs zonder positieve opinie;
- arm B of de rustperiode zonder antwoord;
- of "geverifieerde studie-inzet" in materiaal voor instellingen zonder vermelding van het verificatieniveau.

## Verificatie en beperkingen

- **Gecontroleerd met de nl-gov-data-tools (BWB).**
  - Art. 3 Wet op de kansspelbelasting (BWBR0002359; de tool gaf toestand 2025-01-01, laatste wijziging van het artikel 2021-10-01). Lid 2: "Onder prijzen worden verstaan alle goederen waaraan in het economische verkeer waarde kan worden toegekend, welke aan de deelnemers van de kansspelen uit hoofde van hun deelneming toevallen". Lid 3: prijzen in natura worden in aanmerking genomen naar hun waarde in het economische verkeer. Gevolg: verdiende prijzen zonder kansbepaling vallen buiten de kansspelbelasting. Wordt de rangprijs toch als kansspel gezien, dan telt de waarde in natura.
  - Art. 1 lid 1 Wok (BWBR0002469, toestand 2022-10-01): opnieuw alleen de aanhef. De onderdelen gaf de tool ook nu niet terug.
- **Niet te verifiëren in deze sessie.**
  - De onderdelen van art. 1 lid 1 Wet KSB en art. 3 lid 1 Wet KSB. Het is dus niet gecontroleerd of de Wet KSB naast kansspelen ook andere prijsvragen raakt. De fiscalist moet dat voor de verenigingschallenge bevestigen.
  - Directe toegang tot `repository.officiele-overheidspublicaties.nl` was via de proxy geblokkeerd (403).
- **Uit vakkennis, niet nagelezen:** art. 6:193c, 6:193d, 6:193g, 6:193h en 6:194 BW, art. 4 lid 15, 21 en 37 AVG, de Reclamecode Social Media & Influencer Marketing, Apple-richtlijn 2.1 en het Google Play-beleid.
