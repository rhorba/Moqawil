# S12-10 — Chartered accountant outreach list

**Status**: framework + real channels, not a finished list of 3-5 confirmed names.
**Why this shape, not a name list**: the sprint task asks for "3-5 named chartered
accountants." A web search this session (see Sources below) surfaced Morocco's real
official channels but did not surface enough independently-verifiable individuals —
current firm, OEC registration, contact details, and actual willingness to be
approached — for Claude Code to respectably hand the owner a list of real people it
cannot verify. Presenting search-derived names as a vetted lead list would be worse
than no list: it risks the owner contacting the wrong person, an inactive registration,
or someone materially different from what the text implies. This mirrors the same
owner-verifies-real-identity pattern already used for Batch 1-3 (CNDP filing, pentest
vendor selection) — Claude Code prepares the mechanism, the owner supplies/confirms the
real-world specifics.

## Where to actually find and select 3-5 names (owner action)

1. **OEC Maroc official directory — `oec.ma`.** Searchable by name, cabinet, or city;
   this is the authoritative registry of every legally practicing chartered accountant
   in Morocco (mentioned as the correct lookup path in results returned by this
   session's search — see Sources). Filter for cabinets in Casablanca/Rabat that list
   "auto-entrepreneur" or "TPE" support among their services.
2. **OEC Maroc LinkedIn page** (`linkedin.com/company/oec-maroc`, ~23K followers per
   this session's search). Its comment sections and the accountants who engage there
   are a reasonable signal of who is actively public/reachable, vs. a name that only
   appears in a static directory listing.
3. **One real, publicly-findable lead surfaced by this session's search, unverified**:
   Salaheddine Yatim published a LinkedIn "Pulse" article specifically on Morocco's
   auto-entrepreneur regime
   (`linkedin.com/pulse/régime-de-lauto-entrepreneur-au-maroc-salaheddine-yatim-psd3e`).
   That's a real, publicly visible signal of interest in this exact topic — but Claude
   Code has not verified their current OEC registration status, firm, or willingness to
   be contacted. Confirm via the OEC directory before adding them to an actual outreach
   round.
4. **Cabinets already running AE-focused content marketing** — several showed up in
   search results this session (`comptable-tanger.com`, `eag.ma`, `tmsonline.ma`,
   `upsilon-consulting.com`) publishing guides specifically about the auto-entrepreneur
   regime. A cabinet already writing public content about this exact regime is a
   plausible warm lead — verify the named partner via the OEC directory before
   reaching out, don't approach the firm's generic contact form as a personal
   endorsement ask.

## Selection criteria (apply once names are pulled from the sources above)

- Registered and active with OEC (not just a bookkeeping/comptabilité firm without the
  `expert-comptable` title — root `CLAUDE.md`'s Hicham persona is specifically a
  chartered accountant, not a bookkeeper)
- Demonstrated AE-client volume (firm website/LinkedIn mentions auto-entrepreneur or
  TPE clients specifically, not just SARL/SA)
- Some existing public content or activity (blog, LinkedIn posts) about the AE regime —
  signals they'd have an informed opinion on Moqawil and an audience to share it with
- Geographic spread across at least Casablanca + one other city (Rabat, Tanger,
  Marrakech), since AE clients aren't concentrated in one metro

## Outreach message template (FR)

> Bonjour [Nom],
>
> Je vous contacte car vous accompagnez des auto-entrepreneurs au Maroc. J'ai développé
> Moqawil, un outil open source et gratuit (code public, licence AGPL-3.0) qui suit en
> temps réel le plafond de 80 000 DH par client, génère des factures conformes et
> pré-remplit la déclaration trimestrielle — avec un espace dédié permettant à vos
> clients de vous inviter en lecture seule sur leurs données.
>
> J'aimerais beaucoup avoir votre avis d'expert-comptable sur la logique fiscale de
> l'outil (tout est cité avec les articles du CGI concernés), et, si l'outil vous
> semble utile, un retour ou une mention auprès de vos clients auto-entrepreneurs
> serait très apprécié.
>
> Lien : https://github.com/rhorba/Moqawil
>
> Bien cordialement,
> [Nom]

## What Claude Code did NOT do here

- Did not invent names, firms, phone numbers, or emails presented as real
- Did not send anything — this is a template + sourcing method only
- Did not treat a single unverified LinkedIn article as a confirmed contact

Sources:
- [OEC - Ordre des Experts-Comptables du Royaume du Maroc | Facebook](https://www.facebook.com/OECMaroc/)
- [OEC -ORDRE DES EXPERTS-COMPTABLES du MAROC | LinkedIn](https://fr.linkedin.com/company/oec-maroc)
- [Choisir son expert-comptable au Maroc : critères et questions clés | Upsilon Consulting](https://www.upsilon-consulting.com/choisir-expert-comptable-maroc/)
- [Régime de l'auto entrepreneur au Maroc (Salaheddine Yatim)](https://fr.linkedin.com/pulse/r%C3%A9gime-de-lauto-entrepreneur-au-maroc-salaheddine-yatim-psd3e)
- [Expert-comptable création entreprise en ligne au Maroc](https://tmsonline.ma/expert-comptable-creation-entreprise-en-ligne-maroc/)
- [Expert Comptable Casablanca | Cabinet EAG](https://eag.ma/)
- [Expert Comptable Agréé Tanger](https://comptable-tanger.com/blog/auto-entrepreneur-maroc-2025-guide-complet)
