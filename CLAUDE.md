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

**The authored game is `prototype/cafelife.html` plus `prototype/game/*.js`.** The daily
rebuild separates deterministic rules, bilingual content and audio from the presentation.
Build tools inline those local scripts, fonts and artwork into the same offline native
document. Generated playable artefacts must never be hand-edited. Node tests exercise the
same authored rules used by the game; no duplicate simulation economy is permitted.

```
prototype/cafelife.html          authored UI, with prototype/game/*.js
  ├── tools/build-native.py  ->  native/src/webapp/html.js   (one embedded string, for the app)
  └── tools/build-web.py     ->  dist/, app/www/, site/      (all three git-ignored)
```

Older prototypes (`prototype/cafe.html`, `frenzy.html`) follow a different convention — they
are authored *without* the `doctype/html/head/body` wrapper so they can be pasted into an
artifact, and `prototype/build.sh` wraps them into `*.local.html`. **`cafelife.html` does not
follow that convention**; it is a complete document. Do not run `build.sh` against it.

## Commands

No root `package.json`. Python tools need Pillow. The engine tests have no external JS
dependencies; the full browser release gate uses the Playwright dev dependency in `native/`.

```bash
# rebuild the bundles after changing the game
python3 tools/build-native.py        # -> native/src/webapp/html.js   (the app)
python3 tools/build-web.py           # -> dist/, app/www/, site/      (web + PWA)

# deterministic game checks (no browser)
node tools/test-engine.cjs
node tools/check-localization.cjs
node tools/check-native.js --static

# complete release gate — includes browser checks
node tools/check-native.js

# the iOS app
cd native && npm install
npm run webapp                       # regenerate the bundle
npm run build:testflight             # needs eas login + eas init first
```

The tools resolve paths from their own location, so they run from any directory. That was
not always true: `npm run webapp` executes from `native/`, and relative paths broke it.

### The release gate is not optional

`tools/check-native.js` asserts three things that have each failed before: the bundle fetches
**nothing** at runtime, all 140 sprites decode, and a dynasty survives a reload at a real
https origin. The privacy policy published at `barmajja.com/games/cafe-life/privacy.html`
states the no-network claim **as verified fact on the strength of this gate**. If anything ever
makes the app reach the network, that page has to change before the build ships — and no
analytics may be added, not even temporarily for a playtest.

## Architecture of the daily rebuild (build 6)

The sections below supersede the watched-day / monthly waiting model from build 5. The
canonical HTML loads local modules which the build tools embed into one offline document:

- `prototype/game/content.js`: authored English/Arabic catalogues, stories and choices.
- `prototype/game/engine.js`: shared deterministic game rules, no DOM or clocks.
- `prototype/game/audio.js`: original procedural music and sound effects; gesture-unlocked.
- `prototype/game/i18n.js`: English/Arabic interface strings.
- `prototype/game/ui.js` and `styles.css`: presentation, persistence and interaction.

**Time and continuity.** Plan a day, open immediately, serve individual guests or delegate
instantly, then read the day's result and continue. Gameplay must never depend on a wall
clock. The real calendar and UAE seasons remain. Decisions cannot require waiting for
research, construction, staff or energy. Optional manual service and instant delegation
must share the exact same simulation and settlement rules.

**Economy and permanent progress.** No forced bankruptcy, repossession, automatic debt,
passive cash loss or succession haircut. Daily operating costs reduce that day's take-home,
floored at zero. Only explicit purchases spend saved cash. Owned capabilities persist.

**Saves.** New saves use `cafelife_daily_6`, with `cafelife_daily_6_backup` for recovery.
`CafeEngine.exportSave` and `importSave` share versioned validation. The legacy
`cafelife_mgmt_2` save must be preserved when migrating. Validate imported data before
writing either current or backup saves; never overwrite a usable save with malformed data.

**Audio.** `CafeAudio` has `unlock`, `configure`, `play`, `stop` and `resume`. Music and
sound effects have independent switches. Native lifecycle and document visibility suspend
sound. All sound is synthesised locally; there are no audio downloads or tracking calls.

**Locales.** The whole interface and content support English and Arabic. Arabic uses RTL
layout and local system fonts; no remote font fallback is allowed. Native loading/retry and
installed app names are translated as well. The UI informs the shell with a language message.

## Measuring changes

`node tools/test-engine.cjs` exercises the actual authored engine, including daily income,
manual/delegated parity, zero-cash continuity, the calendar, saves and permanent progress.
`node tools/check-localization.cjs` checks English/Arabic pairs, interpolation placeholders,
UI lookup keys and translated installed-app metadata. The old `tools/sim.js` targets the retired build-5 globals and must not be used to measure
the rebuilt game's economy.

`node tools/check-native.js --static` checks bundled JavaScript, source freshness, all image
payloads, offline resource restrictions and engine save roundtrips without starting a browser.
The default `node tools/check-native.js` additionally performs the browser release gate at the
native https origin, decodes all sprites and verifies a saved Arabic dynasty survives reload.
Install that gate's browser once with `cd native && npm install && npm run check:setup`.
`npm run build:testflight` rebuilds the bundle and requires the engine and full release gate.

A static pass alone is not a browser pass. For visual or interactive changes, inspect English
and Arabic in a browser and test the real app on iPhone, including audio, VoiceOver and larger
text. Save migration, gesture-unlocked audio and lifecycle recovery require device validation.

## The iOS route

Expo + EAS, in `native/`. `app/` is an abandoned Capacitor attempt and
`.github/workflows/ios-testflight.yml` is its abandoned pipeline — neither is the route;
`docs/testflight.md` explains why and carries the working commands.

`native/src/webapp/html.js` is **committed deliberately**. EAS ships the tracked files from
`git rev-parse --show-toplevel`, and `.easignore` only ever *deletes* from that clone — so an
ignored bundle simply never arrives and Metro fails to resolve `App.js`'s import.

`.github/workflows/pages.yml` publishes the installable PWA so a playtest need not wait on an
Apple account.

## Docs that are load-bearing

- `docs/testflight.md` — the shipping route, the house conventions, and what each was learned from
- `docs/playtest.md` — who to send the game to, what to say (nothing), what to ask
- `art/art-brief-2.md`, `art/pipeline/` — how sprites are cut and aged

Several older docs (`docs/cafe-life.md`, `design-spec.md`, `requirements.md`) still describe
the pre-rewrite season-based game and are stale.
