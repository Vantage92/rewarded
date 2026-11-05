# Rewarded — Sleutelbeheer (concept)

*WP-6, 5 november 2026, versie 0.1. Hoort bij de DPIA (`verwerkingen.md`) en architectuur §10.9. Dit beschrijft wat de bouw nu doet; de DPIA legt het vast.*

## Welke geheimen er zijn

| Geheim | Waarvoor | Waar het nu staat | Stand |
|---|---|---|---|
| `pepper_ip` | HMAC van IP-adressen (H2, H7, H10, H12, rate limiting) | Geheimenmap buiten de repo en buiten `.data/` (`pnpm secrets:init`) | Gebouwd (WP-3) |
| `pepper_phone` | HMAC van telefoonnummers (één nummer per account, H8, `blocked_phone_hash`) | Idem | Gebouwd (WP-3) |
| `pepper_email` | `email_norm_hash` (één account per adres) | Idem | Gebouwd (WP-3) |
| `pepper_audit` | Verwijzingen naar personen in het auditlog; afgeleide seed voor de steekproef als de experimentseed ontbreekt | Idem | Gebouwd (WP-3) |
| `pepper_inst` | HMAC van het instellingsadres (`institution_email_hash`) | **Nog niet**: de Hasher kent dit doel niet. De code gebruikt nu `pepper_email` met de scheider `inst|` | Open; vóór 4 januari 2027 omzetten (WP-3 voegt het doel toe, WP-6 wisselt `institutionHash`). Omzetten betekent opnieuw bevestigen van bestaande ankers |
| TOTP-sleutel | Versleuteling van de TOTP-geheimen in `admin_mfa` | Geheimenmap | Gebouwd (WP-3) |
| Experimentseed | Toewijzing (voorregistratie §9.2) en de steekproeftrekking (§7.1) | Geheimenmap; in de voorregistratie alleen de hash | Gebouwd (WP-3); de steekproef leest de seed uit de toewijzingsservice |

## Regels

1. De geheimen staan nooit in de database of in `.data/`; de databasebackup bevat ze niet. De geheimenmap krijgt een eigen versleutelde backup met een sleutel die alleen de founder en één teamlid hebben (architectuur §10.9).
2. Rotatie alleen na een incident. Na rotatie van `pepper_ip` of `pepper_phone` verliezen H2, H7, H8, H10, H12 en de referraluitsluiting hun historie; `blocked_phone_hash` en `blocked_institution_hash` worden dan onbruikbaar en moeten opnieuw worden opgebouwd.
3. Wie de seed heeft, kan elke steekproef narekenen (`verifyStoredSample`); de seed geeft geen toegang tot persoonsgegevens.
4. De IPv4-ruimte, de Nederlandse mobiele nummers en de vorm van instellingsadressen zijn klein genoeg om alle hashes uit te rekenen als iemand de pepper heeft. Daarom staan de peppers niet naast de database.

## Open

- `pepper_inst` (zie boven).
- Wie de tweede sleutel van de geheimenbackup heeft: **in te vullen** door de founder.
