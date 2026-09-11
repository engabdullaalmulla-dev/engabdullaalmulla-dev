# iOS shell

Wraps the prototype in a native iOS app. The web bundle it loads is fully
offline — no CDN, no fonts fetched, no remote content of any kind.

The prototype in `../prototype` stays the single source of truth. This directory
adds only the shell and the build step.

## What you need

- A Mac with **Xcode 15+** and Command Line Tools
- **Node 18+**
- **CocoaPods** (`sudo gem install cocoapods`)
- An **Apple Developer Program** membership to put it on a device or the store

None of that exists in the environment this was built in, so everything below is
written to be run by you, not by me.

## First time

```bash
cd app
npm install
npm run build        # assembles www/ from ../prototype and checks it is offline
npm run add:ios      # generates the Xcode project in app/ios (once)
npm run ios          # syncs and opens Xcode
```

Then in Xcode: pick your team under **Signing & Capabilities**, choose a device
or simulator, and hit run.

## Every time after that

```bash
npm run ios          # rebuild www/, sync into the native project, open Xcode
```

`app/ios` and `app/www` are generated and git-ignored. The only things committed
here are the config, the build script and the bundled fonts.

## What `npm run build` does

1. Copies `../prototype/src` and `../prototype/styles.css` into `www/`.
2. Copies the bundled Latin font subsets into `www/assets/fonts`.
3. Writes an `index.html` with the iOS viewport and status-bar meta tags, and
   with the Google Fonts stylesheet swapped for the bundled one.
4. **Asserts the bundle makes no outbound requests.** If any file would fetch
   from the network at runtime, the build fails and names the file. The core
   game has to work in aeroplane mode, and a stray CDN link would break it
   silently in exactly the situation nobody tests.

Source links in the ruleset sheet (fifa.com, wikipedia.org) are allowed: they
are links a player may tap, never fetched by the app.

## Settings worth knowing

`capacitor.config.json`:

- `appId` — `com.almulla.marblenations`. Change it before you create the App
  Store record; it cannot be changed afterwards.
- `backgroundColor` `#070b0f` — matches the app's own ground so there is no
  white flash on launch or during rotation.
- `scrollEnabled: false` — the app manages its own scrolling; without this the
  whole web view rubber-bands and the arena drifts under your finger.
- `limitsNavigationsToAppBoundDomains: true` — the web view is not allowed to
  navigate anywhere. Belt and braces with the offline assertion above.

## What is not done yet

See [../docs/11-ios-release.md](../docs/11-ios-release.md) for the full route to
submission. The short version: app icon, launch screen, StoreKit, the rights
review, and an accessibility pass.
