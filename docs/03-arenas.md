# 3. Arenas

## The principle

"Harder" means a **more demanding environment**, never a worse marble. Every
escalation lever in this game acts on the pitch: more moving parts, faster
cycles, tighter keepers, live hazards. None of them act on a nation.

Every arena is built from the same components — walls, rails, bumpers, rotors,
sliding doors, keepers, hazards — so a player who has learned to read one arena
can read the next one. What changes is which components dominate and how fast
they move.

## The twenty-five head-to-head arenas

Every match opens with an arena card naming the challenge and its one rule, and
every arena has its own palette as well as its own mechanic — so twenty-five
arenas read as twenty-five different games rather than one pitch with the
furniture moved around.

They are built from one shared kit — walls, rails, bumpers, rotors, gated doors,
keepers, hazards, force fields — so a player who has learned to read one arena
can read the next. What changes is which component *leads*.

### Tier 1 — learn the rules here

| # | Arena | Mechanic | How it reads |
|---|---|---|---|
| 01 | **Spin Gate** | Rotating arms sweep the pitch | You see an arm coming and know the marble is about to be redirected |
| 02 | **Pinball Stadium** | Live bumpers and slingshot rails | Every bumper hit is a visible re-launch toward somebody's goal |
| 03 | **Channel Run** | Gated doors in two cross-pitch walls | A marble held up on a closing door while the opponent breaks clear |
| 04 | **Slalom** | Staggered posts force a weave | The cleanest-looking arena; you watch a run being earned |
| 05 | **Bumper Forest** | A thicket of small live pegs | No big obstacle, a hundred small decisions |
| 06 | **Bounce Chamber** | Live walls, almost no furniture | Long flat ricochets, end to end |
| 07 | **Carousel** | Six bumpers ride a turntable | The whole middle of the pitch sweeps sideways |

### Tier 2 — the pitch starts moving with you

| # | Arena | Mechanic | How it reads |
|---|---|---|---|
| 08 | **Tide Arena** | Heavy bars sweep the length of the pitch | You see the wall coming and who is on the wrong side |
| 09 | **Crumble Pitch** | The floor dissolves in patches | Dashed circles are about to open; black ones already have |
| 10 | **Crossfire** | Four long diagonals with a hole at the centre | Every route is a deflection |
| 11 | **Hourglass** | The pitch pinches to a neck at halfway | Everything queues for the middle |
| 12 | **Shutter Grid** | A chequerboard of blinking panels | The usable pitch changes every second and a half |
| 13 | **Conveyor Lanes** | Belts run up one wing, down the other | The lane you take decides the attack |
| 14 | **Catapult Alley** | Every rail is a launcher | Hit one and you are fired at goal |

### Tier 3 — the pitch starts making decisions for you

| # | Arena | Mechanic | How it reads |
|---|---|---|---|
| 15 | **Split Decision** | A dividing wall crossed only by a turning gate | Nobody attacks until they get through, and you watch them queue |
| 16 | **Spiral Vault** | Two interleaved spiral walls | What goes into the middle comes out somewhere else |
| 17 | **Iris Gate** | A ring around the centre that opens and shuts | Being inside when it closes costs the attack |
| 18 | **Twin Rings** | Two counter-turning rings off each shoulder | Thread the gap or go the long way |
| 19 | **Pendulum Row** | Long arms swinging from the side walls | Slow, heavy, and always arriving late |
| 20 | **Minefield** | Fast-blinking hazards scattered across the pitch | Tense, never cruel: it costs the attack, never the tie |
| 21 | **Gravity Wells** | Four permanent attractors | Marbles are slung round them like satellites |
| 22 | **The Drum** | A wide turning drum with inward paddles | Slow and grinding; a 1-0 here feels earned |

### Tier 4 and the final

| # | Arena | Mechanic | How it reads |
|---|---|---|---|
| 23 | **Magnet Drift** | Pulsing attractor and repulsor fields | Marching rings show each field's radius and direction |
| 24 | **Knockout Bowl** | Both marbles trapped in a turning ring | Constant contact, then a sudden release |
| 25 | **The Grand Arena** | Finals only — every mechanism at once | The goal is genuinely hard to reach |

Plus two special formats:

- **Penalty Challenge** — decides tied knockout ties. One marble, one keeper.
- **Survival Bowl** — the arcade multi-marble format: many nations in one bowl,
  knocked out gradually until one is left. Designed and scheduled for 1.0; not in
  the prototype (see [09](09-release-scope.md)).

## How twenty-five arenas are kept in tune

Hand-tuning twenty-five arenas one at a time does not stay consistent, so it is
automated. Forward drive — how hard each marble pushes toward the end it attacks —
is monotone in goals-per-match, so `tools/calibrate.mjs` binary-searches it per
arena until each lands on the scoring rate its design calls for, then writes
`src/sim/tuning.js`.

Drive is a property of the **arena**. It applies identically to both marbles, so
calibrating twenty-five arenas never touches the fairness argument.

The calibrator also reports arenas that cannot reach their target by drive alone,
and that report is the design feedback loop. On the first run it found five:

| Arena | What it said | What it meant |
|---|---|---|
| **Spiral Vault** | 0.00 goals at any drive | 1.9 turns of solid wall sealed the middle of the pitch. Cut to 1.15 turns with a gap punched through every fifth panel. |
| **Hourglass** | 5.39 against a target of 2.4 | The neck was firing marbles straight at the far goal. Added a deflector beyond it and tightened the keeper. |
| **Slalom** | 4.44 at the lowest drive it could use | The weave delivered marbles at an open mouth. Added two posts guarding each goal. |
| **Pendulum Row** | 4.67 | Two arms left the pitch wide open between sweeps. Added two more and a slow centre bar. |
| **Twin Rings** | 2.80 against 2.3 | Mild — tightened the mouth and keeper. |

A sixth finding was subtler and changed the simulation rather than an arena: the
anti-stall nudge was aimed tightly at goal, which put a floor under *every*
arena's scoring rate and took the tuning knob away from the designer. It is now a
loose-ball scramble aimed only broadly up-pitch.

## Escalation across a tournament

| Stage | Arena pool | Tension |
|---|---|---|
| Group stage | Tier 1 (7 arenas) | 0.15 |
| First knockout rounds | Tiers 1–2 (14 arenas) | 0.4–0.6 |
| Middle rounds | Tiers 2–3 (15 arenas) | 0.6–0.8 |
| Quarter- and semi-finals | Tiers 3–4 (10 arenas) | 0.8–0.95 |
| Final | The Grand Arena, always | 1.0 |

A World Cup campaign is seven matches for your nation out of twenty-five
arenas, so no two runs look alike and the pool you are drawing from visibly
narrows as the rounds get later.

Early rounds stay on tier 1 so that the *rules* are learned before the pitch
starts misbehaving. The final always gets the Grand Arena, gold-themed, so it
feels like a different night. The collection screen carries an **arena index**
listing all twenty-five by tier with how many times you have played each — a map
of what is in the game, not a lockbox, and nothing in it is purchasable.

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
than 0.85s is nudged broadly up-pitch, so play cannot settle.
