# Café Life build 8 — premium groundwork

18 September 2026. Branch: `codex/cafe-life-daily-rebuild`. App version 1.1; iOS build 8. This is a development build, not an App Store-ready release.

## Commercial contract

The first **in-game year**, 1 January–31 December 1994, is free. The owner selected **AED 19.99 once** to unlock later years and generations. No subscription, ads, energy payments, wall-clock waits or consumable boosts. StoreKit supplies the actual checkout price; the product and intended UAE price still need App Store Connect configuration.

The last free day's trade settles once before the continuation screen. A declined, pending or failed purchase preserves the café. Viewing, exporting and keeping saves remains available. Native ownership comes only from verified Apple transactions, separate from game saves. Restoring a purchase restores access; importing a café restores its progress. The private browser preview is explicitly unrestricted and cannot take money.

## Implemented

- Regulars remember visits, dishes they enjoyed and permanent relationship milestones. Manual and delegated service share the same resolver. Matching their usual or taste improves the bond without removing capabilities for a different choice.
- Customer profiles show bond, visits, last served dish, remembered preferences and milestone memories. Visible café visitors follow service or rotate by game date.
- Earlier choices open different later scenes. Optional relationship scenes recognise repeated service without blocking daily play.
- 29 new scenes and 58 bilingual choices; total 85 authored scenes / 188 choices. These totals include mutually exclusive branches. A chosen second-year path encounters nine added scenes, not every alternative. See [content notes](build8-content-notes.md).
- A separate access module guards skips, manual advancement, succession and imported later-year saves. Older version-6 saves remain compatible and gain empty relationship records where absent.
- A local Expo/Swift StoreKit 2 module implements catalogue loading, verified purchase, pending approval, cancellation, restoration, transaction updates and refunds. Signed on-device ownership is read before requesting the catalogue. Expo Go/browser cannot manufacture ownership.
- Purchase and relationship screens in English and Arabic; real localized checkout prices only when the native store reports an available product. Existing sound, music, icon and logo remain integrated.
- Draft bilingual privacy replacement and App Store submission copy. Neither has been published or submitted.

## Verification

Passed deterministic suites:

- 36 shared-engine checks, including branching, relationships, manual/delegated parity, migration, no-loss succession and thirty years of finite operation.
- 6 access checks, including exactly 365 settled free days, partial last-day service, clipped skips, imported saves, unverified flags and succession.
- 6 persistence checks, 13 native save-bridge checks and 14 native purchase-bridge checks.
- Localization: 1,419 English/Arabic text pairs, 209 literal interface keys, matching placeholders and native names.
- UI JavaScript syntax and independent review of the access/purchase UI. Review fixes retained late purchase/restore callbacks, refreshed paid screens on entitlement changes, and escaped user-authored recipe text.

Interactive browser checks used the actual UI at phone sizes:

- Served a regular and confirmed the dish and visit appeared on their profile.
- Imported a synthetic day-365 save through the file picker, settled the final day, and reached the continuation screen without an extra day's earnings or save replacement.
- Checked native-unavailable purchase presentation: no functional buy button or invented checkout price; export/library remain available.
- Checked the separately labelled browser preview.
- Arabic/RTL at 320 pixels and extra-large text: no horizontal overflow on purchase or customer screens, persistent language/text settings after reload, and visible permanent bond memories.

Build/package verification:

- Native and web documents rebuilt with seven local modules, 140 sprites and fingerprint `cafe-life-fd4e7a25d2cd0e2a`; the documents are identical and each embedded module exactly matches source.
- Static offline/source-freshness gate passed. The final embedded game loaded and displayed working service artwork without horizontal overflow. A browser gallery of the exact bundled payloads decoded all 140 sprites plus the icon and logo (142/142).
- Expo packaged the current iOS JavaScript bundle successfully (618 modules).
- The final native Expo app compiled for both arm64 and x86_64 simulator architectures with the local StoreKit module. This was an unsigned compile, not a signed distribution.
- All 9 actual Apple StoreKitTest integration tests passed, with 0 failures, against the authored production Swift service in a locally signed simulator host. Coverage includes purchase, immediate refresh, fresh native ownership reader, restoration, pending approval, cancellation, refunds, catalogue failure and invalid verification. A verified transaction stays in native memory while Apple’s entitlement cache catches up; verified revocation clears that temporary authority. No entitlement is read from a game save or persistent Boolean.
- The successful local result is `/tmp/cafelife-storekit8-verified-tests.xcresult`, with the final native compile log at `/tmp/cafelife-native-build8-final-xcode.log`. These are local no-money StoreKit tests, not App Store sandbox or physical-device evidence.
- Imported markup-like custom recipe text rendered literally on its customer profile, with no interpreted HTML element.

The standalone Chromium/native-origin gate has not been executed in this session; static checks and browser UI checks are distinct evidence. Physical-device checks remain required.

The owner-private [phone preview](https://cafe-life-phone-preview.eng-abdulla-almulla.chatgpt.site) has been updated with this web build. It is a development preview, not an Apple purchase test.

## Still required before sale

See [the full premium release plan](premium-release-plan.md) for acceptance criteria and sequencing.

1. Prove the opening is understandable and fun with first-time players; run an unrestricted seven-real-day playtest. Automated tests cannot prove engagement or willingness to pay.
2. Improve service variety, café personalisation and later-generation content based on that evidence. Current service is dish selection; rooms have three arrangements, venues share operational assets, and heirs use a small fixed set. There is no walking avatar or free furniture placement.
3. Create the non-consumable for this app, confirm pricing, and complete the owner's Apple account requirements. No account agreement or financial setup was changed.
4. Verify signed-device sandbox purchases, pending/cancelled/failed transactions, restoration after reinstall/on another device, refunds and offline relaunch.
5. Test actual iPhone sound/interruption/mute behaviour, haptics, VoiceOver, all text sizes, Arabic, save sharing and process recovery.
6. Publish the revised privacy policy; finish real-device screenshots, App Store metadata and reviewer instructions, then test a signed TestFlight build and submit the app plus its first purchase.

No paid transaction, product creation, signed IPA, TestFlight release or App Review submission was made. The published privacy policy remains unchanged. There is no evidence yet that this build sustains interest for a real week.
