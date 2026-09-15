# Build plan, acceptance gates, and delivery contract

**This is staged implementation scope, not a promised calendar schedule.** One owner-approved milestone at a time. The evidence log distinguishes code implemented, automated checks passed, human playtest findings, and mobile/store steps not executed.

## B1. Milestone map

| Milestone | Deliverable | Exit evidence | Do not build yet |
|---|---|---|---|
| M0 — Foundation and mobile spike | Inspected/initialized repository; pinned engine/templates; minimal portrait app; money/calendaring and test harness; snapshot save/load; store/share adapter interfaces; mobile feasibility notes. | A reproducible local build; 12-month salary/expense fixture; money serialization tests; real-device basic export where access permits; known missing signing/store credentials explicitly reported. | Full city, large art catalog, businesses, analytics SDK, live backend. |
| M1 — A playable life | Work/study starts; a solvent funding plan; essentials; focus schedule; forecast/month recap; persistent progress; an early original room/city vignette. | Fresh Start works through work and university paths; a player can explain spending; interruption/save tests; no job/degree progression from UI animation or wall time. | Six districts, elaborate contacts, crypto trading. |
| M2 — First-property vertical slice | Two districts; two ready-property alternatives; one off-plan project; offers/financing; ownership; rent/costs; handover; one recoverable setback; first visual transformation. | A player can buy, rent, inspect cash flow, save/reload, and sell; another prepared test path completes off-plan and a funding-gap recovery. At least 5–8 observed first-time testers and recorded findings. | A full six-district release, many business types, paid acquisition. |
| M3 — A reliable strategy game | Market/Future Map; full contract/rent cadence; fractional investment; long-run progression; portfolio grouping; funded university balance; headless policy simulations. | At least 100 seeds × 240 simulated months with invariants and reproducible traces; route/pacing analysis; no unexplained universal winning investment. | New content to hide a weak first-property loop. |
| M4 — Complete initial life arc | Initial six districts, four careers, three study families, initial businesses, fictional crypto, home/car catalog, stories, delegation, earned ending and continuation. | All advertised v1 systems reachable; original art consistent; meaningful decisions through the first arc; no placeholder “coming soon” advertised as complete. | New cities, ranked multiplayer, real trading, full 3D, generation simulation. |
| M5 — Release candidate | Verified mobile purchases/restores, save migrations, English/Arabic review, accessibility, device performance, share card, accurate privacy/rating/store material. | Sandbox commerce matrix, interruption tests, human localization review, target-device measurements, rights register, complete store submission checklist. | Wider public release without owner approval. |
| M6 — Soft launch and decision | Limited user-approved pilot; instrumented cohort and revenue analysis; issue resolution; release recommendation. | Actual player behavior, cohort denominators, conversion, receipts/acquisition economics, crashes/save issues; owner go/no-go. | Automatic ad-spend scaling or a “hit” claim from a small sample. |

M0 must investigate the full iOS/Android dependency path early, including native purchase integration. A missing owner credential can be reported without blocking unrelated local work, but it remains an unresolved platform gate. Complete purchase/restore sandbox proof no later than M3; do not postpone discovering an incompatible billing adapter until the entire content build is complete.

After M2, the owner explicitly reviews whether the property loop is enjoyable and whether the art direction works. After M5, the owner explicitly authorizes the pilot. Local implementation between accepted gates can proceed only within the agreed milestone authorization.

## B2. Initial ticket sequence

Use a simple backlog, one active implementation slice, and a regression test after each material change. A large multi-agent organization is unnecessary.

| ID | Ticket | Depends on | Done means |
|---|---|---|---|
| SYS-001 | Inspect repository and record decisions | Owner workspace | No destructive changes; framework/export constraints recorded. |
| SYS-002 | Pin engine, import/export settings, and execution commands | SYS-001 | Clean checkout imports; exact versions documented. |
| SIM-001 | Money, calendar, IDs, command revision checks | SYS-002 | Reference fixtures and duplicate-command checks pass. |
| SIM-002 | State snapshot, journal, save validation and recovery | SIM-001 | Interrupted save never loads partial money mutation. |
| SIM-003 | Monthly salary/essentials and pure recap | SIM-002 | 12 months reconcile exactly; no wall-time income. |
| UX-001 | Portrait shell and coherent room/city vignette | SYS-002 | Usable touch navigation, text readable on phone. |
| LIFE-001 | Work route and career prerequisites | SIM-003 | Jobs pay only when active; repeated UI access grants nothing. |
| LIFE-002 | Solvent study and work-study routes | LIFE-001 | Budget and education debt remain explicit through graduation. |
| PROP-001 | Building/unit definitions and listing comparison | SIM-003 | Distinct building/unit ownership; values and assumptions clear. |
| PROP-002 | Offers, underwriting, and atomic closing | PROP-001 | Cash, title, fees, debt all settle once. |
| RENT-001 | Monthly lease, vacancy, charges, deposit | PROP-002 | Rent/expenses/liabilities reconcile. |
| PLAN-001 | Off-plan contract and milestones | PROP-002 | No rent before handover; all payments total the contract. |
| LOOP-001 | Vertical-slice event, recovery, and visual rewards | RENT-001, PLAN-001 | First-time testers can complete and explain the loop. |
| PLATFORM-001 | Native billing/share compatibility spike | SYS-002 | Exact dependency tested or blocker documented; no fake production purchase. |

Only after LOOP-001 acceptance should the team expand careers, regions, business catalogs, or the full market. Tests and mobile work run alongside gameplay rather than becoming a final cleanup stage.

## B3. Required test catalog

Priority **P0** means data integrity, financial correctness, or severe user-impact blocker. **P1** means required behavior/usability. **P2** means polish or a tunable hypothesis. “Manual” tests still need evidence, not a checkmark inferred from code.

| ID | Priority | Test and expected result |
|---|---|---|
| T01 | P0 | Salary 5,200 and essentials 3,200 over 12 months from 20,000 yields 44,000, with no other events. |
| T02 | P0 | Reopening a screen, pausing, resuming, or changing device time never pays an extra salary. |
| T03 | P0 | Replaying the same command ID cannot duplicate a purchase, loan, refund, or salary. |
| T04 | P0 | A stale quote/state revision fails safely without partial mutation. |
| T05 | P0 | In-memory minor units serialize and deserialize exactly, including 9,007,199,254,740,993 minor units as a decimal string. |
| T06 | P0 | Money arithmetic rejects overflow, invalid strings, impossible ratios, and non-finite input. |
| T07 | P0 | Mortgage fixtures MORT-A, MORT-B, EDU-A, ZERO-A match the stated rounding order. |
| T08 | P0 | Final loan payment settles exactly; no negative balance or residual minor unit. |
| T09 | P0 | Principal reduces cash and debt; it is not duplicated as an operating expense. |
| T10 | P0 | A ready closing debits cash/fees and creates title/debt once, all or nothing. |
| T11 | P0 | One apartment purchase does not transfer its building or neighboring units. |
| T12 | P0 | Newly settled property begins rental eligibility next month under the base monthly convention. |
| T13 | P0 | No rent is earned before off-plan handover and readiness. |
| T14 | P0 | An off-plan payment plan sums to 100%; installment amounts reconcile to price including rounding remainder. |
| T15 | P0 | A construction milestone invoice activates once; an elapsed month cannot substitute for an unmet milestone. |
| T16 | P0 | An 800,000 contract with 160,000 paid shows 160,000 carrying value and 640,000 commitments, not 800,000 free net worth. |
| T17 | P0 | Completed construction with failed handover financing remains an unsettled contract with actionable notice. |
| T18 | P0 | Assignment changes contract holder/remaining commitment once and pays only agreed net transfer proceeds. |
| T19 | P0 | Default and project cancellation have different configured outcomes; no invented immediate refund. |
| T20 | P0 | A sale transfers title and appropriate lease/deposit/advance-rent balances while settling secured debt. |
| T21 | P0 | A 54,000 annual rent receipt recognizes 4,500 in the first earned month and retains 49,500 as unearned liability. |
| T22 | P0 | A 2,250 refundable deposit changes cash and liability equally; net worth and income do not increase. |
| T23 | P0 | An actually vacant month has no rent; forecast vacancy is not additionally deducted as an actual invoice. |
| T24 | P0 | Earmarking a maintenance reserve is not an expense; its repair invoice posts only once. |
| T25 | P0 | Rent cannot increase in an active fixed contract through repeatedly editing the listing. |
| T26 | P0 | Personal residence and full rental occupancy are mutually exclusive for one unit. |
| T27 | P0 | Refinancing 400,000 into 450,000 with 5,000 fees creates 45,000 cash, 50,000 more debt, and 5,000 lower net worth absent revaluation. |
| T28 | P0 | Intercompany rent/contributions cancel in the consolidated empire view. |
| T29 | P0 | Business income counted as passive subtracts the cost of replacing owner labor. |
| T30 | P0 | Same-quote fictional crypto/fraction buy-sell cannot profit after spread/fees. |
| T31 | P0 | Reloading and opening quotes do not reroll market/defect outcomes; decorative RNG has no economic effect. |
| T32 | P0 | Repeated advance-preview leaves authoritative state and random streams unchanged. |
| T33 | P0 | Force-close during a monthly commit recovers either prior or complete next state, not half a turn. |
| T34 | P0 | Corrupted newest save recovers a known-good previous save with a clear notice. |
| T35 | P0 | Content/save migration preserves ownership, balances, loans, and contracts; removed definitions have a documented migration. |
| T36 | P0 | Imported saves cannot instantiate arbitrary scripts/resources; invalid IDs and oversized content fail safely. |
| T37 | P0 | Missing entitlement cache or a debug switch cannot grant a live real-money product. |
| T38 | P0 | Purchase success, pending, cancelled, failed, restored, refund/revocation where surfaced, and reinstall behave correctly in sandbox. |
| T39 | P0 | A verified unlock survives offline play under the documented policy; a cancelled purchase spends no virtual funds. |
| T40 | P0 | App inactivity causes no missed payment, wealth change, lost streak, or construction deadline. |
| T41 | P1 | Default work, funded university, and work-study routes can progress without an involuntary opening soft lock. |
| T42 | P1 | Degree completion and promotions require relevant elapsed simulated progress and prerequisites. |
| T43 | P1 | Exceeding monthly focus capacity prevents the schedule, but essential bills and recovery remain actionable. |
| T44 | P1 | Smart advance stops before an unfunded commitment, chosen watchlist event, or required decision. |
| T45 | P1 | A genuinely insolvent state offers recovery/restart and can progress after a valid response; no infinite modal loop. |
| T46 | P1 | Market/news explanations reference the same factor changes; an asking-price edit does not become a comparable sale. |
| T47 | P1 | A property forecast exposes assumptions, distinguishes asking from sold comps, and separates cash, return, and valuation. |
| T48 | P1 | Color-blind and reduced-motion use remains understandable; financial actions are not dependent on reflex minigames. |
| T49 | P1 | English and Arabic text, minus signs, decimals, dates, mixed direction, safe areas, and larger text pass human phone review. |
| T50 | P1 | Sharing requires explicit action, permits preview/cancel, exposes no private account data, and labels finances as simulation. |
| T51 | P1 | A paid campaign can finish and continue without crypto, without a degree-only route, and without buying extra products. |
| T52 | P1 | A free route reaches a meaningful consequence before its clearly explained paywall; current save is preserved. |
| T53 | P1 | Target-device frame, month-resolution, memory, resume, and thermal results are measured and recorded. |
| T54 | P1 | All content names/assets/audio/fonts have a rights record; no real property/company identity leaks into shipped content. |
| T55 | P1 | Policy simulation reports route viability, first-property time, failure reasons, and exact reproducible seeds. |
| T56 | P2 | At least 5–8 new testers can explain their last property choice without developer coaching; record failures. |
| T57 | P2 | Visual ownership/home/car progress is recognizable in a brief screenshot/side-by-side review. |
| T58 | P2 | Routine portfolio management remains usable when holdings grow; no requirement to open every unit monthly. |
| T59 | P2 | At least three materially different strategies are chosen in human tests; no claim of balance from agent runs alone. |
| T60 | P2 | First-arc pacing is measured as active time and decisions, not inferred from simulated years or forced waiting. |

All relevant P0 tests must pass before a wider pilot. Automated results do not substitute for T49, commerce sandbox evidence, or observed play. A discovered blocker stays open until a test demonstrates its fix; do not weaken an assertion merely to make the status green.

## B4. Execution interface to implement in the repository

M0 must create a repeatable project-level test entry point. A minimal headless GDScript runner is sufficient; an existing tested runner is acceptable after dependency/version review. Do not use the engine's own source-code test command as a substitute for game tests.

These are target commands **after the corresponding project and scripts exist**, not files already delivered by this brief:

```sh
godot --version
godot --headless --path . --editor --import
godot --headless --path . --script res://tests/test_runner.gd
godot --headless --path . --script res://tests/simulation/run_policies.gd -- --seeds=100 --months=240
```

Every runner must exit nonzero on failure and include the engine version, rules version, test counts, and deterministic seed where applicable. Export commands depend on actual presets and signing; document them only after verification.

## B5. Required milestone report

Keep each report useful and factual: milestone and commit; playable user flows completed; files materially changed; exact commands executed and outcomes; screenshots or actual gameplay evidence; device/store tests executed versus blocked; unresolved defects; next smallest deliverable; and any owner-only decision.

Do not claim a screenshot proves financial correctness, that headless tests prove iPhone usability, or that mocked billing proves a purchase. A test report must name its limitations.

## B6. Owner-only decisions and team needs

The owner approves final name/brand, art identity, asset spending, any change to monetization or supported platform, external service creation, paid acquisition budgets, live store products, publishing, and material changes to the no-wait/no-paid-bailout principles.

The implementation still needs consistent art, sound rights, native-platform testing, Arabic review, and human playtesting. These may be supplied by the owner or specialists; Claude must not invent completed work or substitute unrelated generated assets without review.

Maintain one short decisions log and one backlog. Do not spend the prototype phase building an elaborate autonomous-agent bureaucracy.
