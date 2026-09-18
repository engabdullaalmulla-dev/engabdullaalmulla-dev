# Café Life — native shell

The iPhone app embeds the complete offline game in a React Native WebView. Build 6 is version 1.1 and supports English and Arabic. The authored source is `../prototype/cafelife.html` plus `../prototype/game/`; `src/webapp/html.js` is generated and committed for remote builds.

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

`webapp` embeds five game modules, CSS, local fonts, 140 painted sprites, the app icon and logo. The release gate checks the source fingerprint, offline resource restrictions and saves. Its full mode additionally uses Chromium to decode all artwork and verify an Arabic save survives relaunch at the native origin. `check:static` deliberately omits that browser step.

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

The new save slot is `cafelife_daily_6`; the old `cafelife_mgmt_2` slot remains untouched. The game supports validated import, export, automatic recovery and a separate pre-restore archive. See [the rebuild handoff](../docs/rebuild-build6.md) for migration details and content scope.

Music and effects are original, generated locally with Web Audio after a user gesture, and independently switchable. The native lifecycle pauses audio in the background. Text, direction, dates, native loading/recovery and installed-app names support English and Arabic. The game includes text scaling, reduced motion and appearance controls. iOS haptics are not implemented; Android uses short supported vibrations.

## Evidence for this build

On 18 September 2026, the 21 engine checks, bilingual validation and static native release gate passed. The actual embedded web build was exercised through the browser in English and Arabic, including a 320-pixel viewport at extra-large text, service/delegation, stories, the workshop, room purchases, export/import, reload and succession. No console errors or broken images were observed in the screens tested.

Expo successfully compiled the iOS Hermes bundle: 588 modules, approximately 12 MB. This establishes JavaScript packaging, not a signed iOS archive or physical-device operation. The standalone Chromium release gate was not run during this rebuild; browser interaction was checked separately. Physical-iPhone sound, mute/interruption behaviour, VoiceOver, cold launch and process recovery still require device testing before release. Seven-real-day engagement requires outside playtesting and is not proven by the automated checks.
