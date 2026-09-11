# D8 — Fixture nights

**One line:** on a handful of big-match nights a season, the two sides are named after the two teams actually playing that evening.

**Why:** it turns the 18:00 team sheet (O6) from a logistics message into an event. *"Team sheet's out — I'm Madrid tonight."* Moves FREQ. Closes part of G11 (nothing is at stake).
**Priority:** P1 · **Release:** R2 · **Build:** under a day.

---

## Don't build the integration

You do not need a fixtures API for this. There are perhaps **fifteen to twenty nights a season** that anyone cares about, and a person picking them beats an API, because the API cannot tell you which fixture *your* players care about. A Clásico matters. A midweek Bundesliga game does not.

So: a table of curated nights, filled in by a human once a month. A text field on the game record. That is the whole feature.

If this works and you later want it automated, that is a separate decision with its own evidence. Do not pre-build it.

---

## The rules

**1. Rarity is the mechanic.** If every Thursday is a themed night, no night is. Cap it at roughly one a fortnight in season. This is the same discipline as the sunbursts in the design system — the big panels only land because most screens don't have one.

**2. The name is cosmetic. It must never touch team balancing.** Sides are still drawn from the ratings of whoever checked in (D2). The naming layer renames the output; it never influences it. If this rule is ever bent — letting people pick a side, seeding by supporter — the balancing is compromised and the whole product regresses.

**3. Bibs are physical truth; names bend to fit.** You own a real set of bibs in a real colour. Assign the fixture team whose kit is closest to the bib you actually have — Whites are already Madrid — and let the other side take the away team. Never promise a kit you can't put on a person.

**4. Banter is the point.** A Madrid fan being told they're Barça tonight is the feature working, not a bug. No opt-out, no supporter preference, no profile setting — see positioning rule 3, ship no setting you could infer.

---

## What the player sees

| Surface | Ordinary night | Fixture night |
|---|---|---|
| Team sheet in app | Greens / Whites | **Madrid / Barça** |
| WhatsApp 18:00 drop | "Team sheet's out" | "Team sheet's out — Clásico night" |
| Pitch view (design/TeamSheet) | Greens / Whites labels | Fixture names in the same two label positions |
| Post-match scoreline | Greens 6–5 Whites | **Madrid 6–5 Barça** |

Nothing else changes. No new screen, no new tab, no banner.

---

## Acceptance criteria

- [ ] An admin can mark a date as a fixture night and enter two team names, from a list or free text.
- [ ] On a marked date, every surface listing the two sides uses the fixture names — app team sheet, WhatsApp message, pitch view, full-time scoreline, and any clip captions.
- [ ] On an unmarked date, everything reads Greens / Whites. No residue.
- [ ] Team assignment is byte-for-byte identical with the naming layer on and off, given the same checked-in players. **Test this explicitly.**
- [ ] The side matching the physical bib colour is the one an admin can pin; the other takes the remaining name.
- [ ] If the real fixture is postponed or cancelled after the night is marked, an admin can clear it and every surface reverts to Greens / Whites — including a team sheet already sent, which gets a correction message.
- [ ] If two big matches fall on the same night, the admin picks one. The system never guesses.
- [ ] A game created after the team sheet has gone out still picks up the fixture names.
- [ ] Names are capped in length so they don't break the pitch view or the WhatsApp line.

---

## Explicitly not doing

| Not building | Why |
|---|---|
| A fixtures API integration | Fifteen nights a season is a spreadsheet. Revisit only with evidence. |
| Live scores anywhere | Licensing cost to ship a worse version of an app every player already has. |
| Letting players pick a side | Breaks balancing, which is the product. |
| Club badges or kit graphics | Trademark exposure. Names only — text, not marks. |
| Themed nights every week | Kills the mechanic it depends on. |

---

## The one legal note

Use **team names as plain text**, not club badges, crests or kit designs. Naming the two teams playing tonight is descriptive; reproducing their marks is not. If this ever grows into merchandise, artwork or anything promoted as an official tie-in, it needs advice first.

---

## Ops habit that costs nothing

Even without this feature: **don't schedule a kick-off against a Clásico or a big Champions League night.** You will stand on an empty pitch. Check the fixture list when you set the week's slots.
