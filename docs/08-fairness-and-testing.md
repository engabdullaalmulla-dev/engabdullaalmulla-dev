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
checked **structurally**. `tools/validate.mjs` builds all twenty-five arenas at twelve
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

`node tools/validate.mjs 300` — 300 group matches and 250 knockout ties per
arena, about 14,000 matches and 228 assertions per run.

### Side bias

Twenty-five arenas, 300 group matches each. `z` is the two-sided binomial
statistic on decisive matches only; every one is inside the |z| < 2.6 threshold
and none shows a consistent direction.

| Arena | Goals/match | Draws | z |
|---|---|---|---|
| 01 Spin Gate | 2.46 | 25.0% | 0.33 |
| 02 Pinball Stadium | 2.82 | 24.3% | 0.20 |
| 03 Channel Run | 2.90 | 21.0% | 2.14 |
| 04 Slalom | 2.64 | 25.3% | 0.13 |
| 05 Bumper Forest | 2.55 | 28.3% | 1.30 |
| 06 Bounce Chamber | 2.62 | 26.7% | 0.54 |
| 07 Carousel | 2.79 | 22.3% | 0.72 |
| 08 Tide Arena | 2.20 | 25.3% | 0.40 |
| 09 Crumble Pitch | 2.80 | 22.7% | 0.00 |
| 10 Crossfire | 2.68 | 24.0% | 0.26 |
| 11 Hourglass | 2.04 | 30.0% | 1.93 |
| 12 Shutter Grid | 2.61 | 25.0% | 0.87 |
| 13 Conveyor Lanes | 2.89 | 30.3% | 2.14 |
| 14 Catapult Alley | 3.09 | 22.0% | 0.92 |
| 15 Split Decision | 2.71 | 24.7% | 1.06 |
| 16 Spiral Vault | 2.59 | 22.7% | 1.05 |
| 17 Iris Gate | 2.43 | 20.3% | 0.58 |
| 18 Twin Rings | 2.25 | 30.3% | 1.73 |
| 19 Pendulum Row | 2.21 | 25.7% | 1.00 |
| 20 Minefield | 2.77 | 25.3% | 0.27 |
| 21 Gravity Wells | 2.79 | 19.7% | 0.84 |
| 22 The Drum | 2.08 | 21.3% | 0.52 |
| 23 Magnet Drift | 2.86 | 27.0% | 0.74 |
| 24 Knockout Bowl | 2.08 | 29.3% | 0.00 |
| 25 The Grand Arena | 1.98 | 28.0% | 1.22 |

The largest deviation in this run was Channel Run at z = 2.14, which over
twenty-five arenas is roughly what chance produces — and the structural test
above rules out the thing a drifting z would be evidence of.

### Scoreline shape

Pooled across all nine arenas:

```
1-0  18.4%   2-1  18.1%   2-0  13.4%   1-1  13.2%
3-1   7.1%   3-0   6.7%   2-2   5.4%   0-0   5.4%
```

Mean goals per match 1.98 to 3.09 depending on arena, each landed on its own
target by the calibrator; real World Cup football runs around 2.7. Draw rates sit
between 19% and 31%; World Cup group stages run around 24%.

The highest scoreline seen anywhere is **12 goals**, which is exactly the real
World Cup record (Austria 7-5 Switzerland, 1954) and the ceiling the test
enforces. Bounce Chamber went past it on an earlier build and was tightened.

### Watch time

45.5–47 seconds mean at 1× across all twenty-five arenas, 59s worst case in
normal time — inside the 45–60 second target. Extra time and a shoot-out extend a
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

`node tools/tournament-test.mjs 30` plays 30 complete World Cup campaigns
(3,120 matches) and 8 complete AFC qualifying campaigns (1,808 matches).

**Champions by draw pot, 30 campaigns:** pot 1 → 7, pot 2 → 9, pot 3 → 5,
pot 4 → 9. Expected 7.5 each. The most frequent champion in the run was Colombia,
with four; Uzbekistan, Türkiye and the Netherlands won two each.

**AFC:** of 64 direct qualifiers across 8 campaigns, **16 started in the first
round** — the qualifying journey does not lock lower-seeded nations out.

## Structural integrity

| Check | Result |
|---|---|
| Draw honours host placement, confederation caps and minima, and bracket-pathway separation | pass, 30/30 campaigns |
| 104 matches per World Cup campaign | pass |
| Bracket rounds complete and correctly sized (16 / 8 / 4 / 2 / 2) | pass |
| No nation appears twice in any round | pass |
| Group winners and the eight best thirds all reach the round of 32 | pass |
| **All 495 possible combinations of qualifying third-place groups can be assigned to valid slots** | pass, 495/495 |
| A save file reloaded mid-campaign finishes identically | pass |
| AFC: exactly 8 direct qualifiers, play-off representative distinct and not counted as qualified | pass |
| Road to Glory: 334 matches across 12 rounds, ending with a champion | pass |
| Road to Glory: legs run qualifying → play-off → finals, each under its own tiebreakers | pass |
| Road to Glory: finals field is 48 unique nations built from **your** qualifiers — no nation reaches the finals on the strength of the real qualification | pass |
| Road to Glory: Asia sends nine to the finals only when its play-off representative actually won | pass |

The 495 check is the same 495 combinations FIFA publishes in Annex C, and it is
the test that proves the constraint solver can never paint itself into a corner
mid-tournament.

## Determinism

| Check | Result |
|---|---|
| Same seed → byte-identical result object | pass |
| Match stepped one tick at a time (as the renderer does) → identical to `runToEnd` | pass |
| Every arena 180° symmetric in colliders, fields, hazards and spawns | pass, 25/25 arenas × 12 seeds |

The second is the one that matters commercially: it is the guarantee that a
player who skips a match, or whose phone drops to 20 fps, or who sees an ad
between rounds, or who spends the whole match zoomed in on one marble, gets
exactly the result they would have got otherwise. The live arena is interactive —
tap to follow a marble, drag to pan, pinch to zoom, tap to cheer, tap a goal to
see it again — and every one of those runs in the presentation layer, which has
no write path into the simulation.

## Calibration is not a thumb on the scale

Twenty-five arenas are tuned by `tools/calibrate.mjs`, which binary-searches each
arena's forward drive until it hits its target goals-per-match. It is worth being
precise about what that does and does not touch:

- Drive is a property of the **arena**, applied identically to both marbles.
- The calibrator has no access to team identity. It runs every probe with two
  anonymous marbles, `A` and `B`.
- Changing drive changes how many goals a match contains. It cannot change who
  scores them, because the arena is symmetric and the launch draws are i.i.d.

Calibration is level design, not matchmaking.

## What is deliberately not manipulated

- No outcome is nudged to sell a retry. An arcade retry re-simulates with new
  seeds and is explicitly described in the app as "a fresh attempt, not a
  guaranteed win".
- No nation gets an advantage for being selected, for being famous, or for being
  close to elimination.
- No difficulty curve touches a nation. Tension raises keeper width, cycle speed
  and obstacle count — symmetrically, on the arena.
