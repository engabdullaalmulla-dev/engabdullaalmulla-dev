# 0004 — Mobile export and purchase-integration path

**Status:** investigated at M0 · **Date:** 2026-09-15 · **Ticket:** PLATFORM-001

This records what was **executed** on the M0 build machine (Linux x86_64, headless), what was **read from
primary documentation**, and what remains **blocked** on the owner's credentials or hardware. Nothing here is
device evidence: no phone was available in this environment.

## Android — export executed successfully

Toolchain actually installed and used:

| Component | Version used |
|---|---|
| JDK | OpenJDK 21.0.10 (docs recommend 17; "higher versions are also supported") |
| Android SDK Platform | 35 |
| Android SDK Build-Tools | 35.0.1 |
| Android SDK Platform-Tools | 37.0.1 |
| Command-line tools | 13114758 |

NDK and CMake were **not** installed and were not needed for either export path below.

Two APKs were produced and signature-verified with `apksigner`:

| Path | Size | SHA-256 |
|---|---|---|
| Prebuilt template (`use_gradle_build=false`) | 57,730,891 B | *(recorded in the M0 report; rebuild to reproduce)* |
| Gradle build template (`use_gradle_build=true`) | 163,669,592 B | *(recorded in the M0 report)* |

Manifest of both: package `dev.salaryskyline.m0`, versionName `0.0.1-m0`, **minSdk 24, targetSdk 36**,
ABIs `arm64-v8a` and `armeabi-v7a`, label "Salary to Skyline".

Findings worth keeping:

* The export **fails** until `rendering/textures/vram_compression/import_etc2_astc=true` is set. Now set.
* Signing used a locally generated throwaway debug keystore. **No owner signing key exists or was used.**
  A release build needs the owner's release keystore, and that key must never live in this repository.
* `targetSdk` defaults to 36 from the template; Google Play's target-API requirement must be re-checked at
  submission time, not assumed from this note.
* The Gradle build path works with this toolchain. That matters because it is the prerequisite for any Android
  plugin, including billing.

## iOS — blocked on macOS, as documented

Executed on Linux: with an App Store Team ID present, `--export-debug "iOS"` **generates a complete Xcode
project** (`SalaryToSkyline.xcodeproj`, `.xcframework`s, `Info.plist`, entitlements, launch storyboard, `.pck`)
and then stops with the engine's own warning:

> `Xcode Build: .ipa can only be built on macOS. Leaving Xcode project without building the package.`

Without a Team ID the export refuses earlier: `App Store Team ID not specified.`

So the iOS gate is precise: project generation is cross-platform; **compiling, signing, installing on a device
and submitting all require macOS with Xcode, an Apple Developer account, a Team ID and provisioning profiles.**
A placeholder Team ID (`ABCDE12XYZ`) was used only to reach the next failure and was removed again; the
committed preset has an empty Team ID.

## Purchase integration — path identified, nothing integrated

Per the engine's own documentation ("Android in-app purchases"), the supported route is the first-party
**`GodotGooglePlayBilling`** Android plugin, compatible with Godot 4.2+, installed into `addons/` and
**requiring Gradle builds to be enabled** — the path verified above.

Not done, and not claimed:

* the plugin is **not** installed in this project;
* no product ID, no Play Console entry, no App Store Connect entry exists;
* no sandbox purchase, restore, cancellation or refund has been executed anywhere;
* for iOS, no StoreKit plugin has been verified against 4.7.2 — that verification needs a macOS machine and is
  an open risk, not a solved problem.

What exists instead is `game/platform/`: a `StoreAdapter` interface covering success / pending / cancelled /
failed / restored / revoked, a `MockStoreAdapter` that is clearly labelled a mock and **refuses to operate
outside a debug build**, and an `Entitlements` store that only honours a receipt a production adapter verified.
`tests/unit/test_commerce.gd` proves a mock or missing entitlement cannot unlock a paid product, and that
real-money flows never touch simulated money.

## Owner-only blockers

1. Apple Developer account, Team ID, signing certificates, provisioning profiles, and a macOS + Xcode machine.
2. Google Play Console account, an upload/release keystore, and an application entry.
3. Approval of product IDs and pricing before any store product exists (proposed tests AED 29.99 vs 39.99 are
   unvalidated hypotheses in the pack, not decisions this build made).
4. Physical target devices for T53 performance measurement and for any purchase sandbox evidence.
