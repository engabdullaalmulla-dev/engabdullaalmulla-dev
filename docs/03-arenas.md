# 3. Arenas

## The principle

"Harder" means a **more demanding environment**, never a worse marble. Every
escalation lever in this game acts on the pitch: more moving parts, faster
cycles, tighter keepers, live hazards. None of them act on a nation.

Every arena is built from the same components — walls, rails, bumpers, rotors,
sliding doors, keepers, hazards — so a player who has learned to read one arena
can read the next one. What changes is which components dominate and how fast
they move.

## The six head-to-head arenas

| Arena | Tier | What makes it entertaining | How it reads | Goals/match |
|---|---|---|---|---|
| **Spin Gate** | 1 | Three-armed rotors sweep the pitch and fling marbles into new lanes | You can see an arm coming and know the marble is about to be redirected | 2.4 |
| **Pinball Stadium** | 1 | Live bumpers and slingshot rails inject speed; chances come in bursts | Every bumper hit is a visible re-launch toward somebody's goal | 2.6 |
| **Channel Run** | 1 | Doors in two cross-pitch walls open and close; routes appear and vanish | A marble held up on a closing door while the opponent breaks clear | 2.9 |
| **Crumble Pitch** | 2 | The surface itself dissolves in patches; the danger is underfoot | Dashed circles are about to open; solid black ones already have | 2.7 |
| **Knockout Bowl** | 2 | Both marbles trapped in a turning ring, escaping through a moving gap | Constant contact, then a sudden release and a clear run | 2.5 |
| **The Grand Arena** | 3 | Finals only. Rotors, live bumpers, slingshots, a hazard and the tightest keepers in the game | Everything at once; the goal is genuinely hard to reach | 2.0 |

Plus two special formats:

- **Penalty Challenge** — decides tied knockout ties. One marble, one keeper.
- **Survival Bowl** — the arcade multi-marble format: many nations in one bowl,
  knocked out gradually until one is left. Designed and scheduled for 1.0; not in
  the prototype (see [09](09-release-scope.md)).

Goals per match are measured, not aimed at: see
[08](08-fairness-and-testing.md).

## Escalation across a tournament

| Stage | Arena pool | Tension |
|---|---|---|
| Group stage | Spin Gate, Pinball Stadium, Channel Run | 0.15 |
| Round of 32 / 16 | + Crumble Pitch | 0.4–0.6 |
| Quarter- and semi-finals | Knockout Bowl, Crumble Pitch, Pinball | 0.7–0.9 |
| Final | The Grand Arena, always | 1.0 |

Early rounds stay on tier 1 so that the *rules* are learned before the pitch
starts misbehaving. The final always gets the Grand Arena, gold-themed, so it
feels like a different night.

`tension` scales keeper width, cycle speed, rotor speed and obstacle count. Every
one of those is applied to the arena, symmetrically, and affects both nations
identically.

## Handcrafted templates, controlled procedural variation

Each arena is a hand-authored template with seeded variation applied to:

- obstacle positions (±3–5 units from their authored spot),
- rotor start angles and door phases,
- keeper phase at each end (drawn independently, from the same distribution),
- hazard opening schedules,
- launch angles and speeds at every kick-off and restart.

Everything the variation touches is added in **180°-rotational pairs** about the
arena centre, so no amount of variation can make one end better than the other.
See `pair()` and `solo()` in `src/sim/arenas.js`.

### Layout validation

A generated layout that cannot be won, or never ends, is a shipping-blocking bug,
so the test harness treats it as one. `tools/validate.mjs` plays hundreds of
matches per arena and asserts:

- **every match terminates** — a match that ran past its guard would be reported
  as `unresolved` rather than given an invented scoreline. None has.
- **every knockout tie resolves** — through extra time and penalties if needed.
- **both ends produce chances** — the side-bias check would fail long before an
  arena became one-way.
- **no absurd scoreline** — a 15-goal match means something is broken, not that
  someone had a good day.
- **watch time inside 45–90s at 1×.**

An arena that fails any of these does not ship. The stuck-marble case is handled
in the simulation rather than left to validation: a marble below 10 u/s for more
than 0.85s is nudged toward the goal it is attacking, so play cannot settle.
