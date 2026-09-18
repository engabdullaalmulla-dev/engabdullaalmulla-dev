# Café Life — native shell

The iPhone app embeds the complete offline game in a React Native WebView. Build 8 is version 1.1 and supports English and Arabic. The authored source is `../prototype/cafelife.html` plus `../prototype/game/`; `src/webapp/html.js` is generated and committed for remote builds.

The current package uses Expo SDK 57 (`~57.0.24`), React 19.2.3, React Native 0.86.3 and React Native WebView 13.16.1. Expo Document Picker, File System, Sharing and Haptics provide the native save-file and tactile-feedback paths. The configured iOS build number is `8`.

## Develop and verify

Use Node, Python 3 with Pillow, and the native dependencies:

```sh
cd native
npm ci
npm run webapp
npm run check:static
npm run check:setup
npm run check
npm start
```

`webapp` embeds seven game modules: content, engine, audio, interface strings, persistence, access and UI. It also embeds CSS, local fonts, 140 painted sprites, the app icon and logo. The release gate checks the source fingerprint, offline resource restrictions and saves. Its full mode additionally uses Chromium to decode all artwork and verify an Arabic save survives relaunch at the native origin. `check:static` deliberately omits that browser step. Both check scripts also run the engine, access, persistence, native save/purchase-bridge and localization suites.

To compile the iOS JavaScript bundle without signing:

```sh
npx expo export --platform ios
```

For an authorised TestFlight release, configure this app's Expo/Apple project and use:

```sh
npm run build:testflight
npm run submit
```

These are release actions; the local rebuild has not submitted or distributed an app. `eas.json` retains the development, preview, testflight and production profiles. Do not copy another app's private account identifiers into this public repository.

## Offline resources and saves

`App.js` loads the embedded HTML with the stable base origin `https://app.cafelife.local/`. That address is never fetched. Keeping the same origin preserves the WebView's local storage across relaunches and upgrades. The WebView Content Security Policy forbids network connections. Native StoreKit purchase and restore services are the explicit network exception. Publish the revised privacy wording before releasing this build. Expo updates are disabled.

The active save slot remains `cafelife_daily_6`; the old `cafelife_mgmt_2` slot remains untouched. Build 8 keeps the version-6 save format and accepts older compatible saves. The game supports validated import, export, automatic recovery, a pre-restore archive and a saved-café snapshot library. Restoring another save or beginning another café first preserves the active café in that library. Snapshot removal is explicit and does not remove the active café.

On iPhone, export opens the native share sheet and import uses the native document picker. The picker returns text for review; restoration occurs only when the player chooses it. The bridge checks JSON and size bounds, keeps the original text intact, and cleans only temporary app-cache files. The browser downloads a save file, with text copy/paste retained as a fallback. See [the build 8 handoff](../docs/build8-handoff.md) for the current implementation; [the build 6 handoff](../docs/rebuild-build6.md) remains a historical record.

Music and effects are original, generated locally with Web Audio after a user gesture, and independently switchable. The native lifecycle pauses audio in the background. Text, direction, dates, native loading/recovery and installed-app names support English and Arabic. The game includes text scaling, reduced motion and appearance controls. Native haptics use Expo Haptics on supported iOS and Android devices, respect the game's setting, and silently fall back when unavailable.

Daily play now includes three optional morning briefs drawn from eight kinds. They use the opening plan and settle with the day's result; eight collectible stamp kinds persist across generations. Content includes 38 character scenes and 47 street events: 85 authored scenes with 188 choices, including mutually exclusive branches. Regulars now remember visits and enjoyed dishes; choices open different later scenes. Briefs and stories do not introduce real-world waiting.

## Full-game purchase

The first in-game year is free. A non-consumable unlock continues the same café beyond 1994, with AED 19.99 as the owner's intended UAE storefront price. The actual checkout displays StoreKit's localized price. The browser preview remains unrestricted and cannot charge.

The local Expo module in `modules/cafe-purchases` uses StoreKit 2; `src/purchaseBridge.js` validates the WebView contract. StoreKit's verified transactions alone confer access. The proposed product `com.almulla.cafelife.fullgame` must be configured for this app in App Store Connect before real purchases can work. Expo Go does not contain this native module. A compiled iOS build is required. Restore Purchases restores ownership; save import restores progress.

See [the module notes](modules/cafe-purchases/README.md), [StoreKit test instructions](tests/storekit/README.md), and [the premium release plan](../docs/premium-release-plan.md).

## Evidence for this build

See [the build 8 handoff](../docs/build8-handoff.md) for completed tests and their limits. Compilation and local tests do not replace signed-device sandbox transactions or physical iPhone checks. Actual file sharing, haptics, sound, mute/interruption behaviour, VoiceOver, cold launch and process recovery still require device testing. Seven-real-day engagement requires outside playtesting and is not proven by automated checks or content counts. No App Store product, signed IPA, TestFlight distribution or App Review submission was created by this build.
