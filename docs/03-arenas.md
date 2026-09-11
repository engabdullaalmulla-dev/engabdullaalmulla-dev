# 3. Arenas

## The principle

"Harder" means a **more demanding environment**, never a worse marble. Every
escalation lever in this game acts on the pitch: more moving parts, faster
cycles, tighter keepers, live hazards. None of them act on a nation.

Every arena is built from the same components — walls, rails, bumpers, rotors,
sliding doors, keepers, hazards — so a player who has learned to read one arena
can read the next one. What changes is which components dominate and how fast
they move.

## The nine head-to-head arenas

Every match opens with an arena card naming the challenge and its one rule, so
nine arenas read as nine different games rather than one pitch with the furniture
moved around.

| Arena | Tier | What makes it entertaining | How it reads | Goals/match |
|---|---|---|---|---|
| **Spin Gate** | 1 | Three-armed rotors sweep the pitch and fling marbles into new lanes | You can see an arm coming and know the marble is about to be redirected | 2.2 |
| **Pinball Stadium** | 1 | Live bumpers and slingshot rails inject speed; chances come in bursts | Every bumper hit is a visible re-launch toward somebody's goal | 2.8 |
| **Channel Run** | 1 | Doors in two cross-pitch walls open and close; routes appear and vanish | A marble held up on a closing door while the opponent breaks clear | 2.8 |
| **Tide Arena** | 2 | Two heavy bars sweep the length of the pitch like pistons, compressing play and releasing it | You can see the wall coming and see which marble is on the wrong side | 2.2 |
| **Crumble Pitch** | 2 | The surface itself dissolves in patches; the danger is underfoot | Dashed circles are about to open; solid black ones already have | 2.9 |
| **Split Decision** | 2 | A wall divides the pitch and the only way across is a four-armed turnstile in the middle | Nobody attacks until they get through the gate, and you watch them queue | 2.7 |
| **Magnet Drift** | 3 | Pulsing attractor and repulsor fields bend the marbles' routes with nothing touching them | Marching rings show each field's radius and whether it is pulling or pushing | 2.6 |
| **Knockout Bowl** | 3 | Both marbles trapped in a turning ring, escaping through a moving gap | Constant contact, then a sudden release and a clear run | 2.2 |
| **The Grand Arena** | 4 | Finals only. Rotors, live bumpers, slingshots, a hazard and the tightest keepers in the game | Everything at once; the goal is genuinely hard to reach | 1.9 |

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
| Group stage | Spin Gate, Pinball Stadium, Channel Run, Tide Arena | 0.15 |
| First knockout rounds | + Crumble Pitch | 0.4–0.6 |
| Middle rounds | Crumble Pitch, Split Decision, Tide Arena, Knockout Bowl | 0.6–0.8 |
| Quarter- and semi-finals | Knockout Bowl, Magnet Drift, Split Decision | 0.8–0.95 |
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
- force-field strengths and pulse schedules,
- rotor start angles and door phases,
- keeper phase at each end (drawn independently, from the same distribution),
- hazard opening schedules,
- launch angles and speeds at every kick-off and restart.

Everything the variation touches is added in **180°-rotational pairs** about the
arena centre, so no amount of variation can make one end better than the other.
See `pair()`, `solo()` and `fieldPair()` in `src/sim/arenas.js`.

`solo()` is the sharp edge here: it is only valid for a shape that is already its
own 180° twin. Split Decision originally used a **three**-armed turnstile on the
centre line, which is not, and it produced a measurable 35/65 split in favour of
one end. The structural symmetry test in `tools/validate.mjs` catches exactly
this, and a four-armed turnstile fixed it. See
[08](08-fairness-and-testing.md).

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
