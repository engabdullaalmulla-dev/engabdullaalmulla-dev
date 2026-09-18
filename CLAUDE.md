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

**The authored game is `prototype/cafelife.html` plus `prototype/game/*.js` and `styles.css`.** The daily
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
node tools/test-hosting.cjs
node tools/test-access.cjs
node tools/test-persistence.cjs
node native/tests/saveBridge.cjs
node native/tests/purchaseBridge.cjs
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

`tools/check-native.js` asserts three things that have each failed before: the embedded game fetches
**nothing** at runtime, all 146 sprites decode, and a dynasty survives a reload at a real
https origin. The privacy policy published at `barmajja.com/games/cafe-life/privacy.html`
states the no-network claim **as verified fact on the strength of this gate**. If anything ever
makes the app reach the network, that page has to change before the build ships — and no
analytics may be added, not even temporarily for a playtest. Build 8 adds native StoreKit
purchases outside the offline WebView. Publish `docs/privacy-purchase-update.md` with the
existing publisher details before release; the public policy has not yet been updated.

## Architecture of the daily rebuild (build 9)

The sections below supersede the watched-day / monthly waiting model from build 5. The
canonical HTML loads local modules which the build tools embed into one offline document:

- `prototype/game/content.js`: authored English/Arabic catalogues, stories and choices.
- `prototype/game/engine.js`: shared deterministic game rules, no DOM or clocks.
- `prototype/game/audio.js`: original procedural music and sound effects; gesture-unlocked.
- `prototype/game/i18n.js`: English/Arabic interface strings.
- `prototype/game/persistence.js`: validated local saves, recovery, the saved-café library and replacement transactions.
- `prototype/game/access.js`: first in-game year boundary, separate from café saves and native ownership.
- `prototype/game/ui.js` and `styles.css`: presentation and interaction.

These are seven authored JavaScript modules. The native shell's file-sharing bridge is separate
in `native/src/saveBridge.js`; it returns chosen text for review and never applies a save itself.

**Time and continuity.** Plan a day, open immediately, serve individual guests or delegate
instantly, then read the day's result and continue. Gameplay must never depend on a wall
clock. The real calendar and UAE seasons remain. Decisions cannot require waiting for
research, construction, staff or energy. Optional manual service and instant delegation
must share the exact same simulation and settlement rules.

**Daily briefs and content.** A morning offers three optional, deterministic briefs chosen
from eight kinds: warm, cool, familiar, sharing, variety, regular, room and supplier. A brief
uses the plan at opening; completion and its reward settle once with that same trading day.
Its keepsake stamp survives saves and succession. Offers rotate by played date, never by
real-world waiting. The authored story inventory is 38 character scenes and 47 street
events, with 188 choices across 85 scenes. Alternative branches count separately; a single
café cannot encounter all alternatives. See `docs/build8-content-notes.md`. Recurring templates are not additional scenes.

**Economy and permanent progress.** No forced bankruptcy, repossession, automatic debt,
passive cash loss or succession haircut. Daily operating costs reduce that day's take-home,
floored at zero. Only explicit purchases spend saved cash. Owned capabilities persist.

**Relationships and decisions.** Each regular remembers visits, enjoyed dishes and a
permanent bond. Manual and delegated service use the same preference resolver. Choice and
relationship prerequisites can open different later scenes; optional bond scenes never
block normal play. Relationships do not decay across time or succession.

**Full-game access.** The first in-game year (1994) is free. The planned unlock is AED 19.99
once, with the real price supplied by StoreKit. `access.js` guards advancement and succession
without altering the save. Native StoreKit 2 verifies the non-consumable
`com.almulla.cafelife.fullgame`; this product still needs App Store Connect configuration.
The browser is an explicitly labelled unrestricted development preview and cannot charge.
Never infer ownership from a save, localStorage or caller-supplied flags. Native purchase and
restore calls are the only deliberate network exception; no analytics or accounts.

**Saves.** New saves use `cafelife_daily_6`, with `cafelife_daily_6_backup` for recovery.
`CafeEngine.exportSave` and `importSave` share versioned validation. The legacy
`cafelife_mgmt_2` save must be preserved when migrating. Validate imported data before
writing either current or backup saves; never overwrite a usable save with malformed data.
Build 9 retains the version-6 save format and upgrades older compatible saves with unselected
brief offers, an empty keepsake collection and empty relationship records where absent. `cafelife_daily_6_library` stores explicit café snapshots; opening a
snapshot, importing a save or beginning another café first preserves the active café there.
The separate `cafelife_daily_6_before_restore` archive also remains available for export.
Storage failures must leave the current in-memory café available and display an export route.
File imports are reviewed before restoration. Native picker/share requests have bounded
payloads and must only remove temporary app-cache copies, never a player's original file.

**Audio.** `CafeAudio` has `unlock`, `configure`, `play`, `stop` and `resume`. Music and
sound effects have independent switches. Native lifecycle and document visibility suspend
sound. All sound is synthesised locally; there are no audio downloads or tracking calls.

**Locales.** The whole interface and content support English and Arabic. Arabic uses RTL
layout and local system fonts; no remote font fallback is allowed. Native loading/retry and
installed app names are translated as well. The UI informs the shell with a language message.

## Measuring changes

`node tools/test-engine.cjs` exercises the actual authored engine, including daily income,
manual/delegated parity, zero-cash continuity, the calendar, saves and permanent progress.
`node tools/test-persistence.cjs` checks snapshot restoration, invalid replacements, quota
failures and recovery. `node native/tests/saveBridge.cjs` checks the native file-message
contract, payload bounds, cancellation, exact text preservation and temporary-file cleanup.
`node tools/check-localization.cjs` checks English/Arabic pairs, interpolation placeholders,
UI lookup keys and translated installed-app metadata. The old `tools/sim.js` targets the retired build-5 globals and must not be used to measure
the rebuilt game's economy. Measure it through the engine itself instead: `dispatch` is pure,
so a delegated year (`CLOSE_DAY` then `NEXT_DAY`, 365 times) runs headless in about a second.

`node tools/check-native.js --static` checks bundled JavaScript, source freshness, all image
payloads, offline resource restrictions and engine save roundtrips without starting a browser.
The default `node tools/check-native.js` additionally performs the browser release gate at the
native https origin, decodes all sprites and verifies a saved Arabic dynasty survives reload.
Install that gate's browser once with `cd native && npm install && npm run check:setup`.
`npm run build:testflight` rebuilds the bundle and requires the engine and full release gate.
The package scripts also require persistence, native bridge and localization checks.

A static pass alone is not a browser pass. For visual or interactive changes, inspect English
and Arabic in a browser and test the real app on iPhone, including audio, VoiceOver and larger
text. Save migration, gesture-unlocked audio and lifecycle recovery require device validation.

## The iOS route

Expo + EAS, in `native/`. `app/` is an abandoned Capacitor attempt and
`.github/workflows/ios-testflight.yml` is its abandoned pipeline — neither is the route;
`docs/testflight.md` explains why and carries the working commands.

Build 9 uses app version `1.1`, iOS build number `9`, Expo SDK 57 (`~57.0.24`), React 19.2.3
and React Native 0.86.3. Native file selection, sharing and haptics use the matching Expo
modules. Native haptics now have supported iOS and Android paths with a silent fallback.

`native/src/webapp/html.js` is **committed deliberately**. EAS archives the *working tree* from
the repository root minus whatever is ignored — not only the tracked files: build 3 carried a
build number that existed only in an uncommitted `app.json`. So an ignored bundle never
arrives and Metro fails to resolve `App.js`'s import.

**`.easignore` at the repository root replaces every `.gitignore` for EAS** — while it exists,
none of them are read. It excludes all but `native/` and restates `native/.gitignore`. Keep the
restated `native/ios/` anchored: unanchored, it would also drop
`native/modules/cafe-purchases/ios/`, the StoreKit module. Measure the upload after editing it
(32 files, about 8 MB); unmeasured, it once went to 829 MB, and once to 444 MB because an inline
`# comment` became part of a pattern — this syntax has no inline comments.

**Building and uploading.** Build on the Mac with `eas build --local` (the Expo free plan's
monthly cloud builds run out; `npm run build:testflight` builds in the cloud), then upload
with `xcrun altool --upload-app … --p8-file-path …`, not `eas submit`. The Apple team is at its
limit of three distribution certificates: reuse one, never create one. The signing details
(Expo owner, project id) live in the operator's local `native/app.json` and are never committed
here. The user-level `apple-release` agent holds the rest; `docs/testflight.md` has the detail.

**Before any purchase-enabled build reaches testers:** the non-consumable
`com.almulla.cafelife.fullgame` must exist in App Store Connect, and the live privacy page must
be replaced with `docs/privacy-purchase-update.md` — it still says the app has no purchases.

`.github/workflows/pages.yml` publishes the installable PWA so a playtest need not wait on an
Apple account.

## Agents

Three project agents in `.claude/agents/`: **`release-checker`** (the gates, and inspecting a
built `.ipa` — including why the game looks missing from the Hermes bundle when it is not),
**`design-reviewer`** (render and look, in English and Arabic) and **`economy-analyst`** (measures
the economy through the engine's own `dispatch`). Building, signing and uploading is
**`apple-release`**, a user-level agent on the operator's Mac, because its constraints — the
Apple team's certificate limit, the shared Expo build quota, one Mac — are shared with the
other apps. The watched-day design they were first written against is preserved on the
`claude/build5-record` branch, which is what shipped as TestFlight build 5.

## Docs that are load-bearing

- `docs/testflight.md` — the shipping route, the house conventions, and what each was learned from
- `docs/playtest.md` — who to send the game to, what to say (nothing), what to ask
- `docs/build9-handoff.md` — current build scope, test evidence and remaining release checks
  (`docs/build8-handoff.md` for the purchase work before it)
- `docs/premium-release-plan.md` — purchase contract and remaining commercial/play-value gates
- `art/art-brief-2.md`, `art/pipeline/` — how sprites are cut and aged

Several older docs (`docs/cafe-life.md`, `design-spec.md`, `requirements.md`) still describe
the pre-rewrite season-based game and are stale.

## Build 9 hosting contract

`hosting` is an additive version-6 save field. Three optional occasions have two approaches each, exactly three guests with frozen familiar/discovery/sharing intentions, six permanent decorative objects and wall/shelf/corner positions. `PREPARE_OCCASION` uses owned recipes and a free room arrangement; it spends nothing. Manual and delegated service share the same resolver, rewards and relationship rules. No extra hosting cash bonus, timer or attendance requirement exists. Earned objects remain through saves and succession; replaced displays return to the collection. Old story choices migrate only represented objects.

The first-year access boundary settles the last hosted day once and permits viewing, arranging and exporting the earned keepsake. It blocks the next trading day until native ownership is verified. Hosting does not grant entitlement. `hostingText` adapts current participants to descendant families, while earned memory text remains frozen. See [build 9 handoff](docs/build9-handoff.md) for scope and verification; later projects, separate venue operations and deeper successors remain planned.
