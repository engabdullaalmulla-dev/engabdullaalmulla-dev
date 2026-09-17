# native/ — the Expo shell

The shipping iOS app. It presents the game in a `react-native-webview`;
[`../prototype/cafelife.html`](../prototype/cafelife.html) stays the only copy of the game.

This mirrors the architecture of `marble-ultimate-football/native/`, which has delivered
TestFlight builds from this account, rather than the Capacitor + `xcodebuild` route in
[`../app/`](../app/). EAS manages the signing and builds on Expo's servers, so no
certificates, provisioning profiles or Mac are needed.

## Build and ship

```bash
cd native
npm install
npm run webapp            # regenerate src/webapp/html.js from the prototype
node ../tools/check-native.js   # the release gate, below
npx eas-cli login         # once
npx eas-cli init          # once — writes the project id and update url into app.json
npx eas-cli build --platform ios --profile testflight
npx eas-cli submit --platform ios --profile production
```

`eas.json` carries the same four profiles the other game uses: `development`, `preview`,
`testflight` and `production`. Two values in `submit.production.ios` are placeholders —
`ascAppId` is the App Store Connect app's id, created with the app record, and `appleTeamId`
is the account's team. Both are already in use by the other game and are deliberately not
copied into this repository, which is public.

## Why the whole game is one string

A WebView given `source={{ html }}` has no origin and cannot fetch siblings, so everything
lives in the string: the markup, the styles, the three font families as data URIs, and all
140 sprites as WebP. `../tools/build-native.py` builds it and asserts the result contains no
outbound URL at all.

WebP rather than PNG because the sprites are 7.5MB as PNG, which base64 encodes to 10MB in a
single JavaScript module; the same images are 2.1MB as WebP at a quality that does not read
as lossy. WebP has been supported in WKWebView since iOS 14 and this targets iOS 15.

`src/webapp/html.js` is generated and git-ignored. Do not edit it.

## The origin is not cosmetic

`App.js` loads the bundle at `https://app.cafelife.local/`. Nothing is ever fetched from it.
It is a real origin because an empty `baseUrl` is not "no origin" — it is a null, opaque one,
and `localStorage` on a null origin has no persistent partition. A dynasty would be written,
read back perfectly all session, and be gone on the next launch. This game keeps everything
there: thirty years of a café, the cookbook, who you have met. It would look like the save
system being broken.

That failure was reported from a device on the other game. `tools/check-native.js` checks the
save survives a relaunch so it cannot come back.

## The release gate

```bash
node ../tools/check-native.js
```

Loads the bundle at the real origin and fails if the bundle fetches anything at runtime, if
any of the 140 sprites is missing or will not decode, if the page is not a secure context, or
if a saved dynasty does not survive a reload.
