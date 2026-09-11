# Marble Ultimate Football

A football tournament simulator where national teams are marbles. You pick the
nations you care about, pick a competition, watch the draw, and then watch your
nations play their way through an authentic tournament — with every scoreline
produced by marbles actually going in.

Working title. Naming options are in [docs/01-concept.md](docs/01-concept.md).

**Playable prototype:** `prototype/` — open `prototype/index.html` from any static
server. Three complete, verified competitions — **Road to Glory** (Asian qualification,
the inter-confederation play-off and the World Cup finals as one 334-match
campaign), the World Cup finals on their own, and Asian qualification on its
own — **twenty-five distinct arenas**, penalty
shoot-outs, save/resume, an authentic mode and an arcade mode. Every nation is a
**flag marble** identified by its FIFA trigramme. Real marble physics, not
pre-recorded animation: every scoreline is counted from marbles crossing a goal
line, and a match takes **45–55 seconds** to watch.

---

## What is here

| | |
|---|---|
| [docs/01-concept.md](docs/01-concept.md) | The concept, the naming shortlist, the core loop, the acceptance test |
| [docs/02-match-mechanic.md](docs/02-match-mechanic.md) | How a football fixture becomes a marble contest, and how marble events become a scoreline |
| [docs/03-arenas.md](docs/03-arenas.md) | All 25 arenas, escalation by tier, procedural variation, and how they are calibrated |
| [docs/04-competition-rulesets.md](docs/04-competition-rulesets.md) | The ruleset method, the two encoded editions, sources and flags |
| [docs/05-architecture.md](docs/05-architecture.md) | Tournament engine, marble simulation, determinism, save format |
| [docs/06-ux-and-screens.md](docs/06-ux-and-screens.md) | User journey and the five screens |
| [docs/07-modes-and-monetisation.md](docs/07-modes-and-monetisation.md) | Authentic vs arcade, free vs premium, the iOS product model |
| [docs/08-fairness-and-testing.md](docs/08-fairness-and-testing.md) | The fairness argument and the measurements that back it |
| [docs/09-release-scope.md](docs/09-release-scope.md) | First release scope, what is deliberately out, and the order after that |
| [docs/10-rights.md](docs/10-rights.md) | What is original, what needs rights review before publication |
| [docs/11-ios-release.md](docs/11-ios-release.md) | The route to the App Store: which architecture, what is missing, what Apple will ask |

## Running the prototype

```bash
cd prototype
npx http-server -p 8123 .      # or any static server
open http://127.0.0.1:8123/index.html
```

It needs no build step, no network and no account. Everything is ES modules and
a `<canvas>`.

## Building the iOS app

```bash
cd app
npm install
npm run build        # assembles www/ from prototype and checks it is offline
npm run add:ios      # generates the Xcode project (once, needs a Mac)
npm run ios          # sync and open Xcode
```

The web bundle is 345 KB and makes **zero network requests** — fonts are bundled,
nothing is fetched, and the build fails if that ever stops being true. See
[app/README.md](app/README.md) and [docs/11-ios-release.md](docs/11-ios-release.md).

## Running the tests

```bash
cd prototype
node tools/validate.mjs 400         # simulation: determinism, balance, scoreline shape
node tools/tournament-test.mjs 40   # tournament: draw constraints, brackets, campaigns
```

`validate.mjs` proves each of the 25 arenas is exactly 180°-symmetric in its
colliders, fields, hazards and spawns, then plays thousands of matches and checks
that neither end of the pitch is worth anything, that scorelines look like
football, that every match finishes inside 60 seconds, and that watching a match
and skipping it give the same result. The symmetry check earned its place
immediately: it caught a three-armed turnstile that was quietly worth 65% of
results to one end.

```bash
node tools/calibrate.mjs 200 --write    # re-tune every arena's scoring rate
```

`calibrate.mjs` binary-searches each arena's forward drive until it hits its
target goals-per-match, then writes `src/sim/tuning.js`. Twenty-five arenas
cannot be hand-tuned one at a time and stay consistent; this is how they do.

`tournament-test.mjs` plays whole campaigns and checks the draw obeys its
constraints, the bracket is wired correctly, all 495 possible third-place
combinations can be assigned to valid slots, and a save file resumes identically.
