# 0002 — Money, ledger and command model

**Status:** accepted at M0 · **Date:** 2026-09-15 · **Tickets:** SIM-001, SIM-003

## Money

Authoritative amounts are **signed 64-bit integer minor units** (VDh 1.00 = 100). No authoritative balance is
ever converted to float. `game/core/money.gd` is the only place money arithmetic happens and every checked
operation returns `{ok, value}` or `{ok:false, code, message}` — a rejected operation never substitutes zero.

* Rounding for any division or ratio is **half away from zero**, implemented on integers.
* `LIMIT_MINOR = 1e17` bounds every in-game amount, leaving ~92× headroom under `INT64_MAX`; multiplication is
  overflow-checked *before* the product is computed, never by detecting a wrap afterwards.
* Serialization is a decimal string. This is not a style preference: Godot's JSON parser returns every number as
  a float, so `9007199254740993` minor units (the fixture in `starter_balance.json`) would lose its last digit.
  `tests/unit/test_money.gd` asserts both the correct string path and the lossy JSON-number path.
* `Amortization` evaluates the annuity factor once in double precision, rounds once into minor units, and then
  works in pure integers. A quote whose unrounded payment sits within 1e-6 of a `.5` boundary is **refused**
  rather than guessed, and principals above 9e12 minor units are refused as beyond precision-safe evaluation.
  MORT-A, MORT-B, EDU-A and ZERO-A all reproduce the spec's values, including EDU-A, which only matches when
  the documented order (rounded payment − rounded interest) is used.

## Ledger

`game/core/ledger.gd` is an append-only double-entry journal with running balances, stored **debit-positive**
so every transaction sums to zero and `is_balanced()` is a real invariant checked after every month.

* A rejected transaction writes nothing: accounts, amounts and the resulting balance range are all validated
  before the first balance is touched.
* `applied_commands` makes a command ID post at most once. Commands with no financial effect (an
  `AdvanceMonth` in a month with nothing owed) are registered through `register_command()` so they are
  still un-replayable.
* Restricted cash lives in its own accounts (`asset_cash_restricted_deposits`, `asset_cash_reserve_earmarked`).
  Spendable cash is therefore simply the operating-cash balance, which structurally prevents the
  "deducted twice in two UI groups" error the economy spec warns about.

## Commands

Every money-changing action is a `Command` with a unique runtime ID and the `expected_revision` the player was
looking at. `GameEngine.execute()` refuses a stale revision or a replayed ID before anything mutates, and
persists after each success. The UI holds no path to a balance.

`MonthEngine.advance()` builds the proposed S(m+1) on a deep clone and returns it; `preview()` runs the same
code with `commit=false`. That is why a preview cannot disagree with the month it previews, and why running a
preview twice changes neither state nor any random stream.
