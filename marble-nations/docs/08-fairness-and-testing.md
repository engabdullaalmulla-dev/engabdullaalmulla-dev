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

Force fields, added for Magnet Drift, obey rule 2 like everything else: they are
placed through `fieldPair()`, which appends the field and its rotated twin.

Conditions 2 and 3 together make the match **exchangeable** in its two teams:
swapping the labels gives a configuration of exactly the same probability.
Therefore `P(A wins) = P(B wins)`, exactly, for every arena and every tension.

The only dynamic adjustment anywhere in the simulation is the **restart to the
conceding side** — a 16% stronger launch for whoever just conceded. It applies to
whichever side is behind, is stated in the UI, and preserves exchangeability.

Team strength is not a variable. There is no rating, form, FIFA ranking or
"famous team" multiplier reaching the physics. Seeding decides who is drawn into
which group and nothing else.

## The test that proves it, and the bug it found

Waiting for a win-rate to drift is a bad way to find an unfair arena: a real 55/45
edge needs thousands of matches to separate from noise. So the symmetry claim is
checked **structurally**. `tools/validate.mjs` builds every arena at twelve
different seeds, maps every collider, force field, hazard and spawn point through
`(x, y) → (W − x, H − y)`, and asserts the result is the same multiset it started
with.

That test immediately caught a live bug. **Split Decision's turnstile originally
had three arms.** An odd-armed rotor sitting on the centre of the pitch is *not*
its own 180° twin — it maps onto itself only under 120° rotations — so one end of
the pitch was getting a systematically friendlier gate. The statistical check saw
it too, as a 35/65 split, but the structural test named the exact collider on the
first seed. A four-armed turnstile fixed it: re-run at 2,000 matches, **784 / 750
/ 466 draws, z = 0.87.**

That is the whole argument for having the test. It is in the suite permanently,
and it is the reason `solo()` — which adds a shape without a twin — is only ever
valid for a shape that is already symmetric.

Keeper phases are excluded from the comparison: they are drawn i.i.d. per end by
design, and an i.i.d. draw preserves exchangeability without preserving instance
symmetry.

## What is measured

`node tools/validate.mjs 400` — 400 group matches and 250 knockout ties per
arena, roughly 6,000 matches per run.

### Side bias

| Arena | Goals/match | Draws | Top wins | Bottom wins | z |
|---|---|---|---|---|---|
| Spin Gate | 2.21 | 29.0% | 152 | 132 | 1.31 |
| Pinball Stadium | 2.86 | 25.0% | 161 | 139 | 1.15 |
| Channel Run | 2.79 | 22.8% | 175 | 154 | 1.31 |
| Tide Arena | 2.35 | 26.8% | 171 | 142 | 1.69 |
| Crumble Pitch | 2.95 | 24.0% | 150 | 154 | 0.23 |
| Split Decision | 2.63 | 19.8% | 149 | 172 | 1.28 |
| Magnet Drift | 3.05 | 22.5% | 146 | 164 | 1.02 |
| Knockout Bowl | 2.19 | 25.8% | 148 | 149 | 0.06 |
| The Grand Arena | 2.01 | 29.8% | 154 | 127 | 1.61 |

Every one inside |z| < 2.6, with no arena showing a consistent direction.
Knockout ties are checked separately: every one resolves, and the winner is
unbiased in all nine arenas.

### Scoreline shape

Pooled across all nine arenas:

```
2-1  17.8%   1-0  15.8%   1-1  14.3%   2-0  13.2%
3-1   6.9%   3-0   6.7%   2-2   6.6%   0-0   4.9%
```

Mean goals per match 2.01 (Grand Arena) to 3.05 (Magnet Drift); real World Cup
football runs around 2.7. Draw rate 19.8%–29.8%; World Cup group stages run
around 24%.

### Watch time

45.6–46.7 seconds mean at 1× across all nine arenas, 53s worst case in normal
time — inside the 45–60 second target. Extra time and a shoot-out extend a
knockout tie, which is what they are for.

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

**Champions by draw pot, 40 campaigns:** pot 1 → 8, pot 2 → 13, pot 3 → 9,
pot 4 → 10. Expected 10 each. The most frequent champion in the run was Algeria,
with four; Croatia won three.

**AFC:** of 80 direct qualifiers across 10 campaigns, **29 started in the first
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
| Every arena 180° symmetric in colliders, fields, hazards and spawns | pass, 9/9 arenas × 12 seeds |

The second is the one that matters commercially: it is the guarantee that a
player who skips a match, or whose phone drops to 20 fps, or who sees an ad
between rounds, or who spends the whole match zoomed in on one marble, gets
exactly the result they would have got otherwise. The live arena is interactive —
tap to follow a marble, drag to pan, pinch to zoom, tap to cheer, tap a goal to
see it again — and every one of those runs in the presentation layer, which has
no write path into the simulation.

## What is deliberately not manipulated

- No outcome is nudged to sell a retry. An arcade retry re-simulates with new
  seeds and is explicitly described in the app as "a fresh attempt, not a
  guaranteed win".
- No nation gets an advantage for being selected, for being famous, or for being
  close to elimination.
- No difficulty curve touches a nation. Tension raises keeper width, cycle speed
  and obstacle count — symmetrically, on the arena.
