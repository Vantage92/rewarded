# Pitchrondes: proces en beoordelingskader

## Proces

1. De founder schrijft de pitch (`docs/pitch/pitch.md`) op basis van `docs/01-businessplan.md` en `docs/02-productplan.md`.
2. Drie onafhankelijke beoordelaars lezen de pitch én de onderliggende documenten en schrijven elk een beoordeling (`docs/pitch/ronde-N-<rol>.md`):
   - Investeerder (seed/pre-seed, consumentenapps): markt, defensibiliteit, unit economics, team-uitvoerbaarheid, waarom nu.
   - Gedragswetenschapper en productveteraan: verandert dit gedrag echt, retentie, verdringing van intrinsieke motivatie, wat gebeurt er na de nieuwigheid.
   - Jurist en fraude-expert: kansspelwetgeving, app-storebeleid, AVG, betalingen, manipulatie en fraude, reputatierisico.
3. Elke beoordeling eindigt met een oordeel: GO, GO MET VOORWAARDEN of NO-GO, een score per criterium (1–10) en een geordende lijst van must-fix punten.
4. De founder antwoordt per punt (overnemen, aanpassen, afwijzen met reden) in `docs/pitch/ronde-N-founder-reactie.md` en laat het team de plannen herzien.
5. Een ronde is geslaagd als alle drie GO geven, of GO MET VOORWAARDEN zonder must-fix punten. Maximaal drie rondes; daarna beslist de founder.

## Criteria

| Criterium | Vraag |
|---|---|
| Probleem en doelgroep | Is het probleem echt, urgent en afgebakend voor de gekozen groep? |
| Oplossing en gedragseffect | Verandert het product aantoonbaar gedrag, ook na week drie? |
| Beloningsmodel | Is het legaal, uitlegbaar, fraudebestendig en economisch sluitend? |
| Groei | Zijn de groeiloops geloofwaardig en trekken ze de juiste gebruikers? |
| Unit economics | Klopt de rekensom per gebruiker bij realistische aannames? |
| Verdediging | Waarom wint een kopie van een grotere speler niet? |
| Uitvoerbaarheid | Kan een klein team dit bouwen en opereren in 6–12 maanden? |
| Risico's | Zijn de showstoppers benoemd en is er een plan om ze uit te sluiten? |

## Technische randvoorwaarde voor de MVP (vastgesteld 4 november 2026)

Op mobiele browsers geldt een vergrendeld scherm als "verborgen" (Page Visibility API), timers in de achtergrond worden beperkt en een Wake Lock vervalt zodra de pagina verborgen is. Een websessie kan dus niet doorlopen met de telefoon op slot. De focus-engine van de web-MVP werkt daarom als volgt: de sessie loopt alleen zolang Rewarded zichtbaar op het scherm staat (telefoon met het scherm naar beneden op tafel, Wake Lock houdt het scherm aan; of de laptop met het tabblad open), de verstreken tijd wordt berekend uit tijdstempels, en een verborgen pagina beëindigt de sessie. Volledige verificatie van telefoongebruik vereist een native app (Screen Time / UsageStats) en is een latere stap. Bronnen: MDN Page Visibility API; Chrome Developers, Stay awake with the Screen Wake Lock API; web-features explorer, Screen wake lock (Chrome 84+, iOS 18.4+ in Safari, beperkt in geïnstalleerde webapps op iOS).
