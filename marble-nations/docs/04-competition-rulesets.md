# 4. Competitions and authentic rules

## The method

A competition in this app is **an explicit, versioned ruleset module for one
edition**, researched against published sources, with its uncertainties recorded
in the ruleset itself. There is no generic tournament builder and no shared
"continental cup" template, because continental cups are not the same as each
other and pretending otherwise is exactly the failure mode to avoid.

Each module carries:

```js
meta = {
  id, name, edition, rulesetVersion,   // '2026.1'
  status,                              // 'playable' — nothing else appears in the picker
  points, groupTiebreakers, thirdTiebreakers, knockout,
  sources: [ {label, url}, ... ],      // what we read
  flags:   [ {id, level, text}, ... ], // what we could not confirm, or left out
}
```

`flags` is the important field. Every flag is shown to the player in the app's
ruleset sheet, reachable from the competition card before they start and from
settings at any time. Levels in use: `derived`, `partly-verified`,
`approximate`, `not-modelled`, `out-of-scope`.

A competition that has not been researched does not appear at all. There is no
half-finished competition presented as playable.

## 4.1 FIFA World Cup 2026 — finals (`wc2026`, ruleset 2026.1)

**Format.** 48 teams, 12 groups of four, 104 matches. Top two in each group plus
the **eight best third-placed teams** advance to a round of 32, then round of 16,
quarter-finals, semi-finals, third-place play-off and final.

**Field.** The actual 48 finalists of this edition: the 42 teams allocated to
pots on the FIFA ranking of 19 November 2025, plus the six play-off winners
(Bosnia and Herzegovina, Czechia, Sweden, Türkiye through the UEFA path; DR Congo
and Iraq through the FIFA Play-off Tournament). Qualification is not re-run — this
competition *is* the finals tournament.

**Draw.** Not a shuffle. A constrained draw, solved by randomised backtracking
with forward checking, honouring:

- hosts placed rather than drawn: **Mexico A1, Canada B1, United States D1**;
- at most one team per confederation per group, **except UEFA**, which has at
  least one and at most two in every group;
- the four highest-ranked teams (Spain, Argentina, France, England) in four
  different bracket **quarters**, and the top two in different **halves**, so
  they cannot meet before the semi-finals and the top two not before the final;
- within-group positions fixed by pot rather than drawn.

The draw ceremony shows each placement and says *why* it was valid.

**Group tiebreakers**, in the order the regulations put them:
points → goal difference → goals scored → head-to-head points → head-to-head goal
difference → head-to-head goals → fair play → drawing of lots.
Whichever step actually separated two teams is recorded and shown under the table
("KSA separated on head-to-head goal difference").

**Knockout bracket.** The published, predetermined structure — not a fresh draw.
Round of 32 slots are fixed by group position (2A v 2B, 1F v 2C, 1C v 2F, and so
on), and the eight third-placed teams may only occupy slots their group is
permitted to fill. Winners feed forward on the published links through to
match 104.

**Deciding procedure.** Extra time, then penalties. Single leg.

### Flags on this ruleset

| Level | What |
|---|---|
| `derived` | Third-placed teams are matched to their round-of-32 slots by constraint solving, not from FIFA's published Annex C table. Every assignment is valid under the published slot constraints, and the test suite verifies that **all 495 possible combinations** of qualifying groups can be matched — but a specific pairing may differ from the official table. |
| `not-modelled` | Fair-play points sit in the tiebreaker chain where the regulations put them, but marble matches produce no cards, so that step can never separate anybody. Ties reaching it fall through to a drawing of lots, and the app says so. |
| `partly-verified` | The published within-group position pattern for groups A, D, G and J is implemented; the other eight use pot order as a placeholder. It affects fixture order and nothing else. |
| `out-of-scope` | Host cities, kick-off times, travel and rest days. There is no home advantage anywhere in the simulation. |

## 4.2 AFC qualification for the 2026 World Cup (`afcq2026`, ruleset 2026.1)

This is the priority competition after the finals, and it is implemented in full
— all five rounds, all 46 entrants, 226 matches.

| Round | Teams | Format | Advance |
|---|---|---|---|
| First | 20 (seeds 27–46) | Ten two-legged ties | 10 winners |
| Second | 36 (seeds 1–26 + 10 winners) | Nine groups of four, home and away | Winners + runners-up (18) |
| Third | 18 | Three groups of six, home and away | **Top two qualify for the World Cup** (6); 3rd and 4th drop down |
| Fourth | 6 | Two groups of three, single matches at a centralised venue | **Winners qualify** (2); runners-up drop down |
| Fifth | 2 | One two-legged tie | Winner reaches the **inter-confederation play-off** |

**Eight direct places, and a ninth that is not a place at all.** The app is
explicit about this everywhere it comes up: a campaign that wins the fifth round
ends with *"Reached the inter-confederation play-off. Not qualified — one more
tournament stands in the way, and it is outside this ruleset."* Reaching the
play-off is never shown as qualification, never counted among the eight, and
never puts a trophy in the cabinet.

**Tiebreakers differ from FIFA's**, and that is the point of encoding rulesets
per edition rather than sharing one: AFC competition regulations settle level
teams on the results **between them** before overall goal difference —
head-to-head points → head-to-head GD → head-to-head goals → overall GD → overall
goals → wins → fair play → lots. Two teams level on points can go through in the
opposite order here than they would at a World Cup. The engine takes the chain
from the ruleset, so both are correct at once.

**Entry stage.** Seeds 27–46 enter at the first round; seeds 1–26 enter at the
second. The setup screen tells you which, per nation, before you start.

### Flags on this ruleset

| Level | What |
|---|---|
| `approximate` | The 1–46 seeding order approximates the FIFA ranking used for the real draws. It decides which 20 nations start in the first round and how pots are filled. **This is the one part of this ruleset not confirmed against a primary source and it is the first thing to replace before release.** |
| `out-of-scope` | The inter-confederation play-off tournament itself: its other five entrants come from outside the AFC and are edition-specific. |
| `out-of-scope` | The first two rounds also doubled as 2027 Asian Cup qualification. That consequence is shown as information; no Asian Cup campaign is generated. |
| `partly-verified` | Fourth round modelled as two centralised single round-robin groups of three, which matches the published format. Which nation hosts is not modelled — and there is no home advantage regardless. |

## Sources

**World Cup 2026**
- [FIFA — how the 48-team World Cup 26 works](https://www.fifa.com/en/articles/article-fifa-world-cup-2026-mexico-canada-usa-new-format-tournament-football-soccer)
- [FIFA — Final Draw procedures and pots](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/procedures-pots-final-draw)
- [FIFA — knockout stage match schedule and bracket](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/knockout-stage-match-schedule-bracket)
- [Wikipedia — 2026 FIFA World Cup draw](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_draw)
- [Wikipedia — 2026 FIFA World Cup knockout stage](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage)

**AFC qualification 2026**
- [Wikipedia — 2026 FIFA World Cup qualification (AFC)](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_qualification_(AFC))
- [Wikipedia — AFC second round](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_qualification_%E2%80%93_AFC_second_round)
- [Wikipedia — AFC third round](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_qualification_%E2%80%93_AFC_third_round)

**Before release, every one of these must be re-sourced to the governing body's
own regulations document and its amendments.** Encyclopaedia and press sources
were adequate to build and verify the structure; they are not adequate to ship a
claim of authenticity. The `sources` array and `rulesetVersion` exist so that
this upgrade is a tracked change and not a silent one.
