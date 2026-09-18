# Café Life — native shell

The iPhone app embeds the complete offline game in a React Native WebView. Build 7 is version 1.1 and supports English and Arabic. The authored source is `../prototype/cafelife.html` plus `../prototype/game/`; `src/webapp/html.js` is generated and committed for remote builds.

The current package uses Expo SDK 57 (`~57.0.24`), React 19.2.3, React Native 0.86.3 and React Native WebView 13.16.1. Expo Document Picker, File System, Sharing and Haptics provide the native save-file and tactile-feedback paths. The configured iOS build number is `7`.

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

`webapp` embeds six game modules: content, engine, audio, interface strings, persistence and UI. It also embeds CSS, local fonts, 140 painted sprites, the app icon and logo. The release gate checks the source fingerprint, offline resource restrictions and saves. Its full mode additionally uses Chromium to decode all artwork and verify an Arabic save survives relaunch at the native origin. `check:static` deliberately omits that browser step. Both check scripts also run the engine, persistence, native save-bridge and localization suites.

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

`App.js` loads the embedded HTML with the stable base origin `https://app.cafelife.local/`. That address is never fetched. Keeping the same origin preserves the WebView's local storage across relaunches and upgrades. The native Content Security Policy forbids network connections. Expo updates are disabled.

The active save slot remains `cafelife_daily_6`; the old `cafelife_mgmt_2` slot remains untouched. Build 7 keeps the version-6 save format and accepts older compatible saves. The game supports validated import, export, automatic recovery, a pre-restore archive and a saved-café snapshot library. Restoring another save or beginning another café first preserves the active café in that library. Snapshot removal is explicit and does not remove the active café.

On iPhone, export opens the native share sheet and import uses the native document picker. The picker returns text for review; restoration occurs only when the player chooses it. The bridge checks JSON and size bounds, keeps the original text intact, and cleans only temporary app-cache files. The browser downloads a save file, with text copy/paste retained as a fallback. See [the build 7 handoff](../docs/build7-handoff.md) for the current implementation; [the build 6 handoff](../docs/rebuild-build6.md) remains a historical record.

Music and effects are original, generated locally with Web Audio after a user gesture, and independently switchable. The native lifecycle pauses audio in the background. Text, direction, dates, native loading/recovery and installed-app names support English and Arabic. The game includes text scaling, reduced motion and appearance controls. Native haptics use Expo Haptics on supported iOS and Android devices, respect the game's setting, and silently fall back when unavailable.

Daily play now includes three optional morning briefs drawn from eight kinds. They use the opening plan and settle with the day's result; eight collectible stamp kinds persist across generations. Content includes 24 founding chapters and 32 street events: 56 authored scenes with 130 choices. Briefs and stories do not introduce real-world waiting.

## Evidence for this build

The build 7 source passed 28 engine checks, 6 persistence checks, 13 native bridge checks and localization validation of 1,092 English/Arabic pairs with 186 literal UI keys. These counts describe the source at the documentation check; the handoff records any later verification.

The rebuilt native/web bundles passed the source-fingerprint/static gate, and the embedded browser game was checked in English and Arabic. Expo packaged the iOS JavaScript bundle with 617 modules. See the build 7 handoff for the exact checks. No signed IPA or TestFlight distribution was produced. Actual iPhone file sharing, haptics, sound, mute/interruption behaviour, VoiceOver, cold launch and process recovery still require device testing. Seven-real-day engagement requires outside playtesting and is not proven by automated checks or content counts.
