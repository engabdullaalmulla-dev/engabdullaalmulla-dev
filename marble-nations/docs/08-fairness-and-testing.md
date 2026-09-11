# 8. Randomness, fairness and testing

## The claim

**Every nation has identical physical capabilities, and neither end of the pitch
is worth anything.** A nation from pot 4 wins the World Cup as often as a nation
from pot 1. Following a nation does not help it. Watching, fast-forwarding or
skipping a match cannot change it.

This is not a hope about tuning. It is a property of how the arenas are built,
and it is then measured.

## Why it is true by construction

Every head-to-head arena satisfies three conditions:

1. **Zero gravity, overhead view.** Gravity has a direction and a portrait pitch
   has two ends; any gravity arena inherently favours one end.
2. **Exact 180° rotational symmetry.** The map `(x, y) → (W − x, H − y)` sends the
   collider set to itself and swaps the two goals. Every obstacle is added
   through `pair()` — which appends the shape and its rotated twin — or through
   `solo()`, which is only used for shapes that are already their own twin
   (a centred even-armed rotor, a centred bumper). Rotation and oscillation
   transform correctly under that map: a rotation about `c` becomes the same
   rotation about the image of `c`, and an oscillation along `d` becomes one
   along `−d`.
3. **Every per-side random quantity is drawn i.i.d. from one distribution** —
   launch angle, launch speed, keeper phase at each end, restart impulse.

Conditions 2 and 3 together make the match **exchangeable** in its two teams:
swapping the labels gives a configuration of exactly the same probability.
Therefore `P(A wins) = P(B wins)`, exactly, for every arena and every tension.

The only dynamic adjustment anywhere in the simulation is the **restart to the
conceding side** — a 16% stronger launch for whoever just conceded. It applies to
whichever side is behind, is stated in the UI, and preserves exchangeability.

Team strength is not a variable. There is no rating, form, FIFA ranking or
"famous team" multiplier reaching the physics. Seeding decides who is drawn into
which group and nothing else.

## What is measured

`node tools/validate.mjs 400` — 400 group matches and 250 knockout ties per
arena, roughly 4,000 matches per run.

### Side bias

| Arena | Top wins | Bottom wins | Draws | z |
|---|---|---|---|---|
| Spin Gate | 145 | 143 | 112 | 0.12 |
| Pinball Stadium | 147 | 140 | 113 | 0.41 |
| Channel Run | 161 | 149 | 90 | 0.68 |
| Crumble Pitch | 126 | 167 | 107 | 2.40 |
| Knockout Bowl | 158 | 146 | 96 | 0.69 |
| The Grand Arena | 125 | 138 | 137 | 0.80 |

Crumble Pitch's 2.40 is the one worth a second look, since with six arenas one
z above 2 is roughly what chance produces. Re-run at 2,500 matches on an
independent seed base: **975 / 943 / 582 draws, z = 0.73.** It was sampling
noise, as the symmetry argument says it has to be.

Knockout ties are checked separately: every one resolves, and the winner is
unbiased across all six arenas.

### Scoreline shape

Pooled across 2,400 matches:

```
1-0  17.6%   2-1  17.2%   1-1  13.6%   2-0  10.8%
3-1   7.7%   0-0   7.0%   2-2   5.7%   3-0   5.4%
```

Mean goals per match 2.03 (Grand Arena) to 2.86 (Channel Run); real World Cup
football runs around 2.7. Draw rate 22.5%–34.3%; World Cup group stages run
around 24%.

### Termination, stuck marbles and ambiguity

- **Every match terminates.** A match that hit its guard would be reported
  `unresolved` rather than given an invented scoreline. Across every run to date,
  none has.
- **Every knockout tie resolves**, through extra time and penalties.
- **No marble can stall**: below 10 u/s for 0.85s, it is nudged toward the goal
  it is attacking — identically for both sides.
- **No ambiguous scoring**: the defending marble is physically barred from the
  goal it defends, so own goals cannot occur and no goal is ever unattributable.

### Starting positions

Kick-off and restart placements are exact 180° images of one another
(`{x: CX−8, y: CY+10}` and `{x: CX+8, y: CY−10}`), and every launch impulse is
drawn from the same distribution for both marbles.

## Tournament-level fairness

`node tools/tournament-test.mjs 40` plays 40 complete World Cup campaigns
(4,160 matches) and 10 complete AFC qualifying campaigns (2,260 matches).

**Champions by draw pot, 40 campaigns:** pot 1 → 10, pot 2 → 10, pot 3 → 11,
pot 4 → 9. Expected 10 each. The most frequent champion in the run was Haiti,
with three.

**AFC:** of 80 direct qualifiers across 10 campaigns, **30 started in the first
round** — the qualifying journey does not lock lower-seeded nations out.

## Structural integrity

| Check | Result |
|---|---|
| Draw honours host placement, confederation caps and minima, and bracket-pathway separation | pass, 40/40 campaigns |
| 104 matches per World Cup campaign | pass |
| Bracket rounds complete and correctly sized (16 / 8 / 4 / 2 / 2) | pass |
| No nation appears twice in any round | pass |
| Group winners and the eight best thirds all reach the round of 32 | pass |
| **All 495 possible combinations of qualifying third-place groups can be assigned to valid slots** | pass, 495/495 |
| A save file reloaded mid-campaign finishes identically | pass |
| AFC: exactly 8 direct qualifiers, play-off representative distinct and not counted as qualified | pass |

The 495 check is the same 495 combinations FIFA publishes in Annex C, and it is
the test that proves the constraint solver can never paint itself into a corner
mid-tournament.

## Determinism

| Check | Result |
|---|---|
| Same seed → byte-identical result object | pass |
| Match stepped one tick at a time (as the renderer does) → identical to `runToEnd` | pass |

The second is the one that matters commercially: it is the guarantee that a
player who skips a match, or whose phone drops to 20 fps, or who sees an ad
between rounds, gets exactly the result they would have got otherwise.

## What is deliberately not manipulated

- No outcome is nudged to sell a retry. An arcade retry re-simulates with new
  seeds and is explicitly described in the app as "a fresh attempt, not a
  guaranteed win".
- No nation gets an advantage for being selected, for being famous, or for being
  close to elimination.
- No difficulty curve touches a nation. Tension raises keeper width, cycle speed
  and obstacle count — symmetrically, on the arena.
