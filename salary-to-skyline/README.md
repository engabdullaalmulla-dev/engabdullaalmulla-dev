# Salary to Skyline — M0 build

Portrait, offline-first, single-player life-and-property simulator set in an original Gulf coastal city.
**Working title. All money in the game is simulated and has no cash value.**

This directory is the Godot project. The specification it is built from lives in `docs/`
(`MASTER_BUILD_BRIEF.md`, `ECONOMY_SPEC.md`, `BUILD_PLAN_AND_ACCEPTANCE.md`) and the persistent project rules
are in `CLAUDE.md`.

## Status

**M0 — foundation and mobile spike.** What is playable, what is mocked, and what is blocked is recorded in
`docs/evidence/M0_REPORT.md`. Short version: you can start one of three lives, budget, set money aside toward a
first apartment, advance months and reload; you cannot yet buy property — that is M2.

## Requirements

* Godot **4.7.2 stable** (official build `ed1daf0bf`). `tools/fetch_godot.sh` downloads and checksums it.
* For Android export: JDK 17+ and Android SDK platform-tools, build-tools 35.0.1, platform 35.

## Commands

```sh
export GODOT=/path/to/Godot_v4.7.2-stable_linux.x86_64

"$GODOT" --headless --path . --import          # import a clean checkout
tools/run_tests.sh                              # full suite; exits nonzero on failure
tools/run_tests.sh --filter=money               # one area
"$GODOT" --path .                               # play it
tools/export_android.sh                         # signed debug APK (needs the SDK + a keystore)
```

## Layout

```
game/core/          money, calendar, IDs, RNG streams, accounts, ledger, commands, amortization, game state
game/simulation/    content loading, monthly engine, application service
game/persistence/   versioned atomic saves with backup recovery
game/presentation/  portrait shell (reads state, issues commands, never writes a balance)
game/platform/      store/share adapter interfaces and a clearly-labelled mock
content/balance/    the owner's fictional starter fixtures
tests/              headless runner, unit and integration suites
docs/               specification, decision records, evidence
tools/              reproducible engine fetch, test and export scripts
```

## Rules this code holds itself to

* One turn is one player-advanced simulated month. No wall-clock time reaches the simulation — a test asserts
  that no simulation file reads a clock.
* Money is integer minor units with controlled rounding, serialized as decimal strings.
* Every money-changing action is a validated command with a unique ID and an expected state revision; a replay
  or a stale action changes nothing.
* Borrowed money is debt, not income. Money set aside is still yours, and is never deducted twice.
* Unexecuted tests, mocks and placeholders are labelled as such, everywhere.
