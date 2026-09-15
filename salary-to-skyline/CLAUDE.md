# CLAUDE.md — Salary to Skyline

## Product contract

Build a portrait, offline-first, single-player mobile life-and-property empire simulator. Use an original Gulf city inspired by Dubai, with no real companies, districts, branded cars, copied landmarks, or Kairosoft assets. Work, university, experience, expenses, ready/off-plan/fractional real estate, rent, debt, fictional crypto, businesses, cars, and visible lifestyle progression belong to one connected economy.

Use Godot 4.x stable and typed GDScript. The current candidate noted in this pack is 4.7.2 stable; verify dependencies and pin the working engine/export-template version. Do not switch technology without an evidenced problem and owner approval.

One turn is one player-advanced simulated month. No real-world timers, offline debt penalties, energy refill, forced ad, paid money, paid better returns, or real-money bailout. The initial week-long arc is a pacing target, not a forced seven-day wait. All investments are fictional, with no wallets, actual crypto, real assets, cash-out, or runtime market feeds.

## Read order and authority

Read `MASTER_BUILD_BRIEF.md`, then `ECONOMY_SPEC.md`, then `BUILD_PLAN_AND_ACCEPTANCE.md`. Consult `PLAYTEST_AND_LAUNCH.md`, `SOURCES_AND_ASSUMPTIONS.md`, and `starter_balance.json` for the relevant work.

The owner's explicit product decisions and master brief govern the experience. The economy spec governs monetary semantics and sequence. The acceptance plan governs tests and milestone gates. Starter data is illustrative and does not override either. Record any conflict before implementation; do not silently invent a third interpretation.

If given the combined brief only, reconstruct its marked file sections into this working layout before coding. This pack is specifications and fixtures, not a prebuilt Godot project.

## Implementation discipline

Inspect the repository first. Preserve existing work and unrelated files. Implement one vertical slice at a time. Keep domain logic independent of scene nodes and presentation. Use validated commands, state revisions, deterministic named RNG streams, stable data IDs, and a versioned journal/save model. No direct cash mutation from UI.

Money uses integer minor units, controlled rounding, and lossless serialized values. Ownership, contracts, bank debt, tenant liabilities, and cash must reconcile. A rented unit is not its building; a booked off-plan contract is not a finished rental; borrowed money is not profit.

Create a project-level headless test runner and regression fixtures. Never claim unexecuted tests passed. Do not use mocked purchase success as production commerce. Do not change a test merely because it exposes a defect. Keep placeholders and blockers explicit.

Do not overengineer an agent organization, backend, multiplayer service, runtime language model, real-time physics city, or full open world. A normal backlog and one implementation stream are enough initially.

## First assignment

Implement M0 only, then report evidence and the next small slice. Inspect the environment; record engine/export/plugin versions; create a minimal portrait app; implement money, monthly salary/expenses, and snapshot save/load; run the reference arithmetic and round-trip tests; and investigate actual iOS/Android export/purchase compatibility. Do not start with a large map or a store catalog.

A missing owner signing credential can be reported while local work proceeds. It must not be misrepresented as a tested device export or a completed store integration.

## Permission boundary

No paid asset purchase, external service/account creation, analytics deployment, live product creation, ad spending, public posting, email, protected-branch merge, or store submission without owner approval. Do not ask about every routine local edit within an authorized milestone.

Owner review is required at the M2 gameplay/art gate and before paid pilot or publication. Engine changes, monetization changes, and removal of core requested systems require explicit approval.

## Status reporting

Report milestone/commit, what is actually playable, commands and exact results, screenshots/gameplay evidence, device/store coverage, open defects, owner-only blockers, and the next concrete step. Never promise commercial success from code completeness.
