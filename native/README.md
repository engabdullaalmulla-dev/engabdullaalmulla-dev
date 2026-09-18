# native/ — the Expo shell

The shipping iOS app. It presents the game in a `react-native-webview`;
[`../prototype/cafelife.html`](../prototype/cafelife.html) stays the only copy of the game.

This mirrors the architecture of `marble-ultimate-football/native/`, which has delivered
TestFlight builds from this account, rather than the Capacitor + `xcodebuild` route in
[`../app/`](../app/). EAS manages the signing, so no certificates or provisioning profiles
are handled by hand. It builds on Expo's servers or, with `--local`, on a Mac — which is how
both marble and the first Café Life build actually shipped. See `../docs/testflight.md`.

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
`testflight` and `production`.

`submit.production.ios` is deliberately empty. `ascAppId` and `appleTeamId` live under
`submit`, not `build`, so neither blocks a TestFlight build — and `eas submit` prompts for
both when you are logged in and writes them back itself. Fake placeholders would be worse
than nothing, because they would be sent to a real submission. The team id is also already in
use by the other game, and this repository is public.

## What has been checked here, and what has not

`expo-doctor` passes all 21 checks, and `npx expo export --platform ios` bundles the app —
588 modules, an 8.3MB Hermes bundle — so `App.js` compiles, every import resolves, and Metro
handles the 3.4MB embedded game without complaint.

Not checked: `eas build` itself, the signing, and the app running on a device. Those need the
Expo and Apple accounts. They are the first real test of this.

## Why the whole game is one string

A WebView given `source={{ html }}` has no origin and cannot fetch siblings, so everything
lives in the string: the markup, the styles, the three font families as data URIs, and all
140 sprites as WebP. `../tools/build-native.py` builds it and asserts the result contains no
outbound URL at all.

WebP rather than PNG because the sprites are 7.5MB as PNG, which base64 encodes to 10MB in a
single JavaScript module; the same images are 2.1MB as WebP at a quality that does not read
as lossy. WebP has been supported in WKWebView since iOS 14 and this targets iOS 15.

`src/webapp/html.js` is generated. Do not edit it — edit `prototype/cafelife.html` or the art
and run `npm run webapp`.

**It is committed, deliberately, and it must stay committed.** It used to be git-ignored, which
would have broken `eas build` on the very first attempt. EAS archives the working tree from
the repository root, minus whatever is ignored, so an ignored bundle never arrives — and
`App.js` imports this one on line 4. Metro would have failed to resolve it and the build would
have died before signing. (An earlier version of this said EAS ships only *tracked* files.
It ships the working tree: the first build carried a build number that existed only in an
uncommitted `app.json`.)

The root `.easignore` decides what is ignored, and while it exists **no `.gitignore` is read
at all**. It excludes everything but `native/` and restates `native/.gitignore` — without that
restatement `native/node_modules` would ship again.

Marble avoids the same trap from the other direction, with an `eas-build-post-install` hook
that regenerates its bundle on the build server. That does not port cleanly here: this
bundle is built by `tools/build-native.py`, which needs Pillow, and an EAS macOS runner has no
Pillow. Regenerating on the server is the tidier end state — it makes a stale bundle
impossible — but it needs a working `pip install` on the runner, so it is a change to make
*after* a build has gone through, not before. Until then the cost is a 3.4 MB blob in history
each time the game or the art changes, and `npm run build:testflight` regenerates it
immediately before building so what ships is never stale.

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
