# M0 — Foundation and mobile spike: evidence report

**Project:** Salary to Skyline (working title, not a cleared brand)
**Branch:** `claude/salary-skyline-m0-hugxrw` · **Build:** `0.0.1-m0`
**Date:** 15 September 2026
**Scope executed:** M0 only. No property, market, business, crypto, city map or backend work was started.

Everything below separates **what was executed here**, **what is a mock or placeholder**, and **what is
blocked on the owner**. Nothing in this report is evidence that the game is fun, balanced or commercially
viable; M0 cannot produce that evidence and does not claim to.

---

## 1. What is actually playable

Run the project and you can play this loop today, in portrait:

The screen is a room in a city, not an account: an isometric pixel-art room fills the top half, and the
numbers sit beneath it. The first attempt at this interface was a stack of finance-app cards and was thrown
away; the direction that replaced it is recorded in `docs/decisions/0005-visual-direction.md`.

1. **Choose one of three lives** from the owner's fixture data — work now, funded university, or part-time
   work plus study. Each card shows its real opening cash, monthly income, tuition and essentials before you
   commit, and the university card shows that its loan draw is debt rather than income.
2. **Read your position**: spendable cash, estimated monthly surplus with its assumptions listed, book net
   worth, and dated commitments for the months ahead.
3. **Make a decision with a cost**: put money aside into a first-home fund (which leaves spendable cash but
   stays yours), release it again with the trade-off spelled out, or spend on one of three optional purchases.
4. **Advance a month**: a preview shows exactly what will be earned, borrowed and owed; confirming resolves the
   month atomically and a recap shows what changed and why.
5. **Close and reopen**: the game resumes at the same month with the same cash, the same fund and the same
   journal. Time never moves on its own.

The first-home fund exists because the first apartment has to feel like a target long before it is reachable:
the studio from the fixture data costs VDh 280,000, which needs **VDh 72,800 in cash at closing** (20% deposit
plus 6% fictional acquisition costs, computed from the content file, not hard-coded). On the "work now" route
that is roughly three years of saving every dirham of surplus. The screen says so plainly, and it says that
buying is not implemented yet. **You cannot buy property at M0** — that is the M2 slice.

Screenshots (captured from the running build, `docs/evidence/screenshots/`):

| File | Screen |
|---|---|
| `01_choose_a_life.png` | Choose a life — three routes written as lives, not spec sheets |
| `02_the_room.png` | The room — one number, one sentence, the fund, one action |
| `03_month_note.png` | The month ahead — what you earn, borrow, owe |
| `04_month_recap.png` | The month after — what you kept |
| `05_ledger_sheet.png` | The ledger — every figure, one tap away |
| `06_set_aside.png` | Setting money aside toward the studio |

Screenshots prove the screens render and the numbers displayed match the engine. They prove nothing about
financial correctness (the tests do that) and nothing about how this feels on a real phone.

---

## 2. Commands executed, and their exact results

All commands run on Linux x86_64, headless, with the pinned engine.

```
$ Godot_v4.7.2-stable_linux.x86_64 --version
4.7.2.stable.official.ed1daf0bf

$ tools/run_tests.sh
Salary to Skyline — headless test run
  engine         : 4.7.2-stable (official)
  build          : ed1daf0bf001b61586d9930840f2f1394092c079
  rules version  : 0.1.0-m0
  content version: 0.1.0-m0
  save schema    : 1
  content seed   : 20260915

  [ok  ] test_amortization.gd                          5 test(s)
  [ok  ] test_calendar_ids_rng.gd                      5 test(s)
  [ok  ] test_commerce.gd                              6 test(s)
  [ok  ] test_ledger.gd                                6 test(s)
  [ok  ] test_money.gd                                 7 test(s)
  [ok  ] test_commands.gd                              7 test(s)
  [ok  ] test_month_flow.gd                            8 test(s)
  [ok  ] test_save_load.gd                             7 test(s)

files: 8   tests: 51   assertions: 1196   failures: 0   time: 385 ms
RESULT: PASS
exit status 0
```

The runner was also proved to fail loudly: a deliberately failing probe test produced
`files: 9  tests: 52  assertions: 1197  failures: 1`, `RESULT: FAIL`, **exit status 1**, and was then removed.

```
$ tools/export_android.sh          # prebuilt template
Signed
APK: build/android/salary-to-skyline-m0-debug.apk   (57,973,648 bytes)
sha256 41c511e1514eae3140db78d95301ff8598c4b94077f749bca18530d6fcab14f3

$ apksigner verify --print-certs <apk>
Verifies · v2 scheme: true · v3 scheme: true · Signer #1 DN: CN=Android Debug, O=Android, C=US

$ aapt2 dump badging <apk>
package: name='dev.salaryskyline.m0' versionCode='1' versionName='0.0.1-m0'
minSdkVersion:'24'  targetSdkVersion:'36'  application-label:'Salary to Skyline'
lib/arm64-v8a/libgodot_android.so, lib/armeabi-v7a/libgodot_android.so
```

```
$ # with gradle_build/use_gradle_build=true and the Gradle build template installed
$ Godot ... --export-debug "Android" build/android/gradle-...apk
exit status 0 · 163,669,592 bytes · apksigner: Verifies (v2)
sha256 24119a7e04e168324e63ad3c68418d57fe5f9571fc620fe359339ae625373a2d
```

```
$ Godot ... --export-debug "iOS" build/ios/SalaryToSkyline.ipa
# with no team id:
ERROR: Cannot export project with preset "iOS" due to configuration errors:
App Store Team ID not specified.
# with a placeholder team id (removed again afterwards):
Creating SalaryToSkyline.xcodeproj, SalaryToSkyline.xcframework, MoltenVK.xcframework, ...
WARNING: Xcode Build: .ipa can only be built on macOS. Leaving Xcode project without building the package.
exit status 0 (completed with warnings)
```

APK hashes are specific to that build run (archives embed timestamps); they identify these artefacts, they are
not reproducible-build claims. The APKs are **not** committed — `build/` is ignored.

---

## 3. Acceptance cases covered so far

From `BUILD_PLAN_AND_ACCEPTANCE.md` §B3. "Covered" means an automated test asserts it in this build.

| Case | State | Where |
|---|---|---|
| T01 salary/essentials 12 months → 44,000 | **covered** | `test_month_flow.gd` |
| T02 reopening/pausing never pays extra salary | **covered** | `test_month_flow.gd` |
| T03 replayed command ID cannot duplicate | **covered** | `test_ledger.gd`, `test_commands.gd` |
| T04 stale revision fails without partial mutation | **covered** | `test_commands.gd` |
| T05 minor units round-trip, incl. 9007199254740993 | **covered** | `test_money.gd` |
| T06 rejects overflow, bad strings, impossible ratios, non-finite | **covered** | `test_money.gd` |
| T07 MORT-A/B, EDU-A, ZERO-A rounding order | **covered** | `test_amortization.gd` |
| T08 final payment settles exactly | **covered** | `test_amortization.gd` |
| T09 principal is not duplicated as an expense | **covered** | `test_amortization.gd` |
| T32 repeated preview leaves state and RNG unchanged | **covered** | `test_month_flow.gd` |
| T33 interrupted commit recovers prior or complete state | **covered** | `test_save_load.gd` |
| T34 corrupted newest save recovers the backup with a notice | **covered** | `test_save_load.gd` |
| T35 migration | **partial** — an unknown schema version is refused with a message; no migration exists yet | `test_save_load.gd` |
| T36 imported saves cannot instantiate scripts; invalid/oversized fail safely | **covered** | `test_save_load.gd` |
| T37 missing cache or debug switch cannot grant a paid product | **covered** | `test_commerce.gd` |
| T40 inactivity causes no wealth change | **covered** (incl. a static check that no simulation file reads a clock) | `test_month_flow.gd` |
| T38, T39 purchase/restore/refund in sandbox | **not started** — needs store accounts and a device | — |
| T10–T31, T41–T60 | **not applicable yet** — property, rent, off-plan, market, business, localisation, devices and human playtesting are later milestones | — |

Beyond the catalogue, the suite also covers the arrears/recovery path, the funded-university and work-study
fixtures (36 and 48 months), earmarked-vs-spendable cash, allocation with remainders, and journal tampering.

**Limits of this evidence.** Headless tests say nothing about iPhone or Android usability, frame rate, battery,
Arabic rendering or whether any of this is enjoyable. No human has played this build.

---

## 4. What is real, what is a mock, what is a placeholder

**Real, implemented and tested**

* Money API (integer minor units, half-away-from-zero, checked overflow, decimal-string serialization).
* Amortization quote/schedule matching all four reference fixtures.
* Double-entry journal with command idempotency and an enforced balance invariant.
* Monthly engine: salary, stipend, education draw as debt, essentials, tuition, arrears and recovery,
  progress counters, deterministic preview, recap.
* Command layer with state revisions and all-or-nothing execution.
* Atomic save/load with verification-before-promotion, backup recovery, checksum, strict import validation.
* Portrait UI shell over that engine.
* Android export (both paths) and iOS Xcode-project generation.

**Explicitly mocked**

* `MockStoreAdapter` — a mock. No store, no receipt, no real price. It refuses to work outside a debug build.
  No purchase evidence of any kind exists.
* `ShareAdapter` — an interface only; sharing is not implemented and nothing leaves the device.

**Explicitly placeholder**

* The skyline vignette is procedural code-drawn art standing in for the original isometric pixel art. It is not
  the art direction and should not be judged as such.
* The app icon (`assets/branding/icon.svg`) is a placeholder mark.
* All names, amounts, jobs, prices and lending rules come from the pack's illustrative fixtures. They are
  fictional design assumptions, not Dubai data and not validated balance.
* `dev.salaryskyline.m0` is a local development package name, not a reserved identifier.

**Not started at all**: districts and city map, listings, offers, mortgages as a playable system, rentals,
off-plan contracts, market model, businesses, crypto, cars, homes, events, Arabic/localisation, audio,
accessibility review, analytics.

---

## 5. Open defects and known gaps

1. Save-file atomicity is verified on Linux only. `DirAccess.rename_absolute` semantics on iOS and Android are
   unverified; a device test is required before any claim of crash-safety on phones.
2. The month engine implements steps 1, 2, 5 and 8 of the economy spec's monthly sequence. Steps 3–4, 6 and 7
   are marked in code as later milestones; they are absent, not stubbed with fake behaviour.
3. `Amortization.quote` refuses principals above 9e12 minor units and payments that land on a rounding
   boundary. That is deliberate, but it means a future very large loan product needs a higher-precision path.
4. No focus *spending* system exists yet — focus is displayed from the content file, not consumed by choices.
5. There is no localisation. `TextServerAdvanced` is enabled so Arabic is possible; no Arabic string exists and
   no Arabic support should be advertised.
6. Godot's Android exporter prints `Could not find version of build tools that matches Target SDK, using
   35.0.1` on every export. The build succeeds; this is worth re-checking when the target SDK is fixed for
   release.

---

## 6. Owner decisions and credentials required

Nothing below was attempted, and none of it should be actioned without the owner.

| # | Needed | Why it blocks |
|---|---|---|
| 1 | Apple Developer account, Team ID, certificates, provisioning profiles, macOS + Xcode | No `.ipa`, no device install, no App Store path |
| 2 | Google Play Console account, release keystore, app entry | No release APK/AAB, no billing product |
| 3 | Approval of product IDs and pricing | No store product may be created; AED 29.99 vs 39.99 remains an untested hypothesis |
| 4 | Physical target devices (one modern, one lower-end) | Performance targets (T53), interruption behaviour and phone readability cannot be measured |
| 5 | Arabic reviewer | Arabic support cannot be claimed without human review |
| 6 | 5–8 first-time playtesters for the M2 gate | The property loop cannot be judged from code |
| 7 | Decision on the final name/brand | "Salary to Skyline" is a working title and is not cleared |

No money was spent, no account was created, no service was provisioned, nothing was published, and monetization
was not changed.

---

## 7. Proposed next milestone

See `docs/BACKLOG.md`. In short: **M1 — a life you can live for a year**, kept deliberately small, then the
M2 first-property slice that the owner reviews.
