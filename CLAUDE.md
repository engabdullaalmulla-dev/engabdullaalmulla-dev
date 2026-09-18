# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

`engabdullaalmulla-dev/engabdullaalmulla-dev` is a **GitHub profile repository** — `README.md`
is the profile page and has nothing to do with the code. Almost everything else here is one
project: **Café Life**, a café management game for iOS.

The repository is **public**. `marble-ultimate-football`, `kabatin` and `barmajja` are private
repositories on the same account carrying the shipping conventions this project follows, and
their identifiers (Apple Team ID, App Store Connect app ids, Expo account owners, key ids)
**must not be copied into this one**. `docs/testflight.md` describes them without naming them;
keep it that way.

## The one rule that shapes everything

**`prototype/cafelife.html` is the only copy of the game.** It is a single self-contained
HTML document — markup, CSS and the whole engine in one `<script>`. Every other playable
artefact in the repository is generated from it, and none of them should ever be hand-edited:

```
prototype/cafelife.html          the game — edit this
  ├── tools/build-native.py  ->  native/src/webapp/html.js   (one 3.5MB string, for the app)
  └── tools/build-web.py     ->  dist/, app/www/, site/      (all three git-ignored)
```

Older prototypes (`prototype/cafe.html`, `frenzy.html`) follow a different convention — they
are authored *without* the `doctype/html/head/body` wrapper so they can be pasted into an
artifact, and `prototype/build.sh` wraps them into `*.local.html`. **`cafelife.html` does not
follow that convention**; it is a complete document. Do not run `build.sh` against it.

## Commands

No root `package.json`. Python tools need Pillow; JS tools need Playwright resolvable —
in this environment that means `NODE_PATH=/opt/node22/lib/node_modules`.

```bash
# rebuild the bundles after changing the game
python3 tools/build-native.py        # -> native/src/webapp/html.js   (the app)
python3 tools/build-web.py           # -> dist/, app/www/, site/      (web + PWA)

# the release gate — run before any build is worth shipping
NODE_PATH=/opt/node22/lib/node_modules node tools/check-native.js

# the economy bot: [years] [runs] [policy: saver|good|greedy]
NODE_PATH=/opt/node22/lib/node_modules node tools/sim.js 40 4 saver

# the iOS app
cd native && npm install
npm run webapp                       # regenerate the bundle
npm run build:testflight             # needs eas login + eas init first
```

All four tools resolve paths from their own location, so they run from any directory. That was
not always true: `npm run webapp` executes from `native/`, and relative paths broke it.

### The release gate is not optional

`tools/check-native.js` asserts three things that have each failed before: the bundle fetches
**nothing** at runtime, all 140 sprites decode, and a dynasty survives a reload at a real
https origin. The privacy policy published at `barmajja.com/games/cafe-life/privacy.html`
states the no-network claim **as verified fact on the strength of this gate**. If anything ever
makes the app reach the network, that page has to change before the build ships — and no
analytics may be added, not even temporarily for a playtest.

## Architecture of the game itself

Reading `prototype/cafelife.html` top to bottom is the fastest way in; it is ordered
data → helpers → screens → boot. The parts that are not obvious from one screen:

**Time.** A trading **day** is what the player watches: ten hours, 07:00–17:00, at 2.4s an
hour, so a day runs 24 seconds. The day is driven by *the clock*, not the queue — `tock()`
advances a fixed ten-minute slice and serves whoever is due in it (`SV.at` holds each
arrival's time, laid out with a morning rush and an evening). A **month** is the accounting
period and the spending round. The calendar is the **real** calendar from 1 January 1994:
real month lengths, the real leap rule, real weekdays.

**`MONTH_SCALE` vs `monthDays()` are not interchangeable.** `MONTH_SCALE` (30) is a fixed
economic constant for anything priced against a month of trade; `monthDays()` is the real
length of the month in hand. Using `monthDays()` for a price makes a stool cost less in
February, which is a bug, not a season.

**`settleMonth()` / `monthScreen()` are deliberately separate.** `settleMonth()` does the
arithmetic and returns what happened (including `notable`); `monthScreen()` draws it. That
split is what lets `runUntil()` settle months in a loop until something wants the player.

**Saves.** One `localStorage` key (`cafelife_mgmt_2`), and `rehydrate()` backfills any field
missing from an older save by diffing against `NEW()`. Add new state to `NEW()` and it is
covered; name fields individually and old saves will crash. Bump the key only when the shape
changes incompatibly.

**Two long-standing failure modes to watch for.** Both runaways this game has had were
geometric series that looked fine locally: inventions priced off other inventions, and a
`visitsFor` that returned a season's worth of cups per customer after the unit became a day.
Anything that multiplies a persistent value — `foot`, `rentCut`, prices — needs a clamp.

## Measuring changes

**Do not tune the economy by reading the code.** `tools/sim.js` plays hundreds of years and
prints the curve, when each unlock became affordable versus when it was bought, overdrafts and
repossessions. It was once broken and silent — reporting "never" for nearly every unlock while
looking like a result — so if its output seems implausible, suspect the bot before the game.

For anything visual or interactive, drive it in a browser rather than trusting the diff. Faults
found only that way include: a month reporting 172 served with 234 "of those", a day summary
headed with tomorrow's date, a double-tap running two days at once, and ten seconds of empty
room at the start of a day.

## The iOS route

Expo + EAS, in `native/`. `app/` is an abandoned Capacitor attempt and
`.github/workflows/ios-testflight.yml` is its abandoned pipeline — neither is the route;
`docs/testflight.md` explains why and carries the working commands.

`native/src/webapp/html.js` is **committed deliberately**. EAS archives the working tree from
the repository root minus whatever is ignored, so an ignored bundle never arrives and Metro
fails to resolve `App.js`'s import.

**`.easignore` at the repository root replaces every `.gitignore` for EAS** — while it exists,
none of them are read. It excludes all but `native/` and restates `native/.gitignore`. Adding
anything the app needs outside `native/`, or dropping the restated `native/node_modules/`, is
how the upload goes back to 829 MB or loses a file silently.

Builds run on this Mac with `eas build --local` (the free plan's monthly cloud builds can run
out). A new app's *first* build cannot be non-interactive, and the Apple team is at its limit
of three distribution certificates — reuse one, never create one. `docs/testflight.md` has the
detail, including signing in to Apple with the API key rather than an Apple ID.

`.github/workflows/pages.yml` publishes the installable PWA so a playtest need not wait on an
Apple account.

## Agents

Three project agents in `.claude/agents/`, each built from something that was done by hand or
went wrong: **`release-checker`** (the gates, and inspecting a built `.ipa` — including why the
game looks missing from the Hermes bundle when it is not), **`design-reviewer`** (render and
look; four defects here were only ever caught by a screenshot) and **`economy-analyst`** (owns
`tools/sim.js` and the runaway). Building and signing for TestFlight is **`apple-release`**, a
user-level agent on the operator's Mac, because its constraints — the Apple team's certificate
limit, the shared Expo build quota, one Mac — are shared with the other apps.

## Docs that are load-bearing

- `docs/testflight.md` — the shipping route, the house conventions, and what each was learned from
- `docs/playtest.md` — who to send the game to, what to say (nothing), what to ask
- `art/art-brief-2.md`, `art/pipeline/` — how sprites are cut and aged

Several older docs (`docs/cafe-life.md`, `design-spec.md`, `requirements.md`) still describe
the pre-rewrite season-based game and are stale.
