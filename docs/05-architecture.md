# 5. Architecture

Three layers, and the boundaries between them are the design.

```
              ┌───────────────────────────────────────────┐
              │  Presentation   canvas renderer, screens  │   reads only
              ├───────────────────────────────────────────┤
              │  Tournament     campaign, draw, standings │   competition rulesets
              ├───────────────────────────────────────────┤
              │  Simulation     physics, arenas, match    │   pure, deterministic
              └───────────────────────────────────────────┘
```

Nothing in the presentation layer can write to the simulation. That single rule
is what makes "watching, accelerating or skipping must produce the same outcome"
true by construction instead of by testing.

## Layer 1 — Simulation

`src/core/` and `src/sim/`. Pure functions of `(seed, arena, rules)`. No DOM, no
clock, no `Math.random`, no I/O. Runs identically in Node and in a browser, which
is how the test harness plays thousands of matches per run.

**Determinism is engineered, not assumed.**

- **No `Math.random` anywhere.** Every random decision comes from a `mulberry32`
  stream seeded from the campaign seed through a labelled fork
  (`rng.fork('arena')`, `seedFor(seed, roundId, fixtureId)`).
- **No `Math.sin`, `cos`, `atan2`, `hypot`, or `pow` in the simulation.** Those
  are implementation-defined in ECMAScript and may differ between engines. The
  simulation uses `dsin` / `dcos` from `src/core/dmath.js`: an odd polynomial to
  x¹³ built only from `+ - * /`, which IEEE-754 requires to be exact. Measured
  maximum error against `Math.sin` is 6.6 × 10⁻¹⁰ across |x| ≤ 100 — orders of
  magnitude below the smallest distance the physics resolves. `Math.sqrt` is
  used freely because the spec does require it to be correctly rounded.
- **Fixed timestep, 1/120 s.** No variable-dt integration, so frame rate cannot
  reach the result.

**The physics** is a small rigid-circle world: marbles against line segments and
circular bumpers, each optionally *kinematic* (rotating about a point, or
oscillating along an axis) or *gated* (solid for part of a cycle). Moving parts
carry surface velocity into the collision impulse, which is how a rotor arm
actually flings a marble. Two relaxation passes per step; a conservative bounding
circle per collider culls most pairs before any trigonometry runs. Roughly 11 ms
per full match in Node.

**The match** is a state machine stepped one tick at a time:

```js
const m = createMatch(cfg);   // cfg = { teams, arenaId, tension, seed, rules, tie }
step(m);                      // one 1/120s tick  — the renderer calls this
runToEnd(m);                  // loop until finished — "skip" calls this
resultOf(m);                  // → { score, aggregate, pens, winner, decidedBy, events, ... }
```

The renderer calls `step` at wall-clock pace; 4× calls it four times as often;
skip calls `runToEnd`. Same function, same result. The test suite asserts this
directly.

## Layer 2 — Tournament

`src/engine/` plus one module per competition edition in
`src/data/competitions/`.

- **`draw.js`** — constrained draw by randomised backtracking with forward
  checking (confederation caps and minima, fixed host slots, bracket-pathway
  separation). Records every placement in order so the ceremony can replay it.
- **`standings.js`** — tables, and a **configurable tiebreaker chain**. Steps are
  strings the ruleset supplies (`'pts'`, `'gd'`, `'h2h:pts'`, `'fairplay'`,
  `'lots'`), resolved recursively: a block of tied teams is re-sorted by the next
  step that separates it. The step that actually did the separating is recorded
  on the row, which is where the UI's "separated on head-to-head goal difference"
  comes from.
- **`campaign.js`** — campaign state, fixture generation, arena assignment, the
  group-scenario solver behind the plain-language consequence lines, and
  `advance()`, which hands control to the competition module at every round
  boundary.
- **Competition modules** own their own structure: `start()` builds the first
  round, `advance()` reads the completed round and builds the next one. Each is
  explicit code for one edition, with `sources` and `flags` attached.

**Consequence lines** ("Still in contention", "Eliminated — cannot finish in the
top three") come from enumerating every remaining permutation of the team's own
group — at most 3⁶ = 729 outcomes — and checking whether they can still finish
top two, and whether they must. That is how a broadcast talks about
qualification, and it is cheap enough to run after every match.

## Layer 3 — Presentation

`src/ui/` and `src/app.js`. A canvas renderer that reads the world and draws it,
and a screen router. The renderer holds exactly one piece of state the simulation
does not: marble trails, which are appended by the render loop and are never read
back.

Camera mode, speed, reduced motion, sound, haptics and ad breaks all live here,
and none of them can reach a result.

## Save format

A campaign save is **seeds and results**, not frames:

```jsonc
{
  "v": 3,                     // save schema
  "simVersion": "1.1.0",      // simulation build
  "rulesetVersion": "2026.1",  // competition edition ruleset
  "seed": 3846044938,
  "mode": "authentic",
  "followed": ["JPN", "KSA"],
  "rounds": [ { "id": "group", "groups": {...},
                "fixtures": [ { "id": "g-A-1-01", "teams": ["MEX","EGY"],
                                "arenaId": "rotor", "seed": 2145734516,
                                "result": { "score": [1,2], "events": [...] } } ] } ],
  "meta": { "drawSteps": [...], "tables": {...}, "thirdRanking": [...] }
}
```

Any completed match can be re-created exactly from `(campaign seed, round id,
fixture id)`, which is what **Replay** does. All three versions are stored so
that a save made under an older simulation can be recognised: existing results
stay valid, and the player is told that future matches would run under a
different build rather than being quietly given a different game.

Autosave fires after every match. Resuming is the default action on the home
screen.

## Replay vs Retry

These are different operations and the app never blurs them.

|  | **Replay** | **Retry** (arcade only) |
|---|---|---|
| What it does | Re-runs the same match from the same seed | Restores the tournament to the start of a round and simulates it again with **new seeds** |
| Can the result change? | No, ever | Yes — it is a fresh attempt |
| Cost | Free, any number of times | One life |
| Available in authentic mode | Yes | No |

## Why no external dependencies

No engine, no physics library, no framework. Three reasons: a third-party physics
library is a determinism risk we cannot audit; the whole simulation is about
4 KB of maths that we need to be able to reason about precisely; and the core
game has to run offline with no install-time downloads.

## Porting to a shipping app

The prototype is JavaScript so it can be played immediately. The layering is what
ports, not the language:

- **Simulation → Swift** (iOS first). It is arithmetic over structs, ~600 lines,
  and the polynomial trig moves across unchanged. Port it against a golden-file
  test: the same seeds must produce the same scores as the JS build.
- **Tournament → Swift**, same shape; competition modules stay data-plus-code
  per edition.
- **Presentation → SpriteKit or Metal**, with SwiftUI for the screens.
- Android later shares the simulation and tournament layers through a common
  core rather than reimplementing them a third time.
