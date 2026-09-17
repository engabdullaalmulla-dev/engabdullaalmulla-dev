# Getting Café Life onto TestFlight

> **Read this first: the pipeline in `.github/workflows/ios-testflight.yml` is the wrong
> shape for this account.**
>
> `marble-ultimate-football` has already shipped to TestFlight — build 28, with an Apple
> readback of `VALID` / `IN_BETA_TESTING`. Its route is **Expo + EAS**, not Capacitor +
> `xcodebuild` + `altool`, and `docs/11-ios-release.md` in that repository is authoritative.
>
> That route is better in every way that matters here. **EAS manages the signing**, so none
> of the certificate, `.p12`, provisioning-profile or keychain machinery below is needed —
> and it builds on Expo's servers, so no Mac is needed either. Where this document asks for
> eight secrets, that route asks for an `eas login`.
>
> **What already exists on that account** (in `marble-ultimate-football/native/eas.json` and
> `app.json`, which is a private repository — deliberately not copied here, because this one
> is public):
>
> - an Apple Team ID, under `submit.production.ios.appleTeamId`
> - an Expo account owner, under `expo.owner`
> - the bundle convention `com.almulla.<slug>` — which `app/capacitor.config.json` already
>   matches with `com.almulla.cafelife`
> - EAS build profiles `development` / `preview` / `testflight` / `production`, where
>   `testflight` extends production signing on its own update channel
>
> **The one thing that does not transfer.** That game embeds itself as a single HTML string
> (`native/src/webapp/html.js`, 1.26 MB) because a WebView given `source={{ html }}` has no
> origin and cannot fetch siblings. Café Life is **7.6 MB of PNG sprites**, which base64
> encodes to about 10 MB in one JavaScript string. The sprites have to be bundled assets
> loaded over `file://` or through `expo-asset` instead. That is a solved problem, but it is
> a different mechanism and it has not been built or tested here.
>
> **The Expo shell now exists**, in [`native/`](../native/), mirroring that architecture.
> `native/README.md` is the build route. In short: `npm run webapp`, the release gate, then
> `eas build --platform ios --profile testflight`.
>
> ### What a second shipped app confirms
>
> `kabatin` is a second Expo app on this account that has gone to internal TestFlight, and it
> agrees with `marble-ultimate-football` on the parts that matter. Both are private
> repositories; the identifiers below stay in them and are deliberately not copied here.
>
> - **`ITSAppUsesNonExemptEncryption: false`** in `ios.infoPlist`. Both set it. Without it
>   every upload stops in App Store Connect on the export-compliance question before it can
>   reach a tester. `native/app.json` already has it.
> - **`autoIncrement: true`** on the production profile. Both set it. Apple rejects a build
>   number it has already seen, so the second upload fails without it. Already set here.
> - **The `.p8` is never committed.** Both repositories are clean of `.p8`, `.p12` and
>   `.mobileprovision`. `kabatin` points `eas submit` at a key kept outside the repository in
>   the operator's home directory. That is the convention to follow — and it means `eas
>   submit` is run from your own machine, not from CI.
> - **Bundle convention.** The games use `com.almulla.<slug>`; the Barmajja products use
>   `com.barmajja.<slug>`. `com.almulla.cafelife` follows the games.
> - **The Expo `owner` is not one house value** — the two apps sit under different Expo
>   accounts. Which one Café Life belongs to is yours to pick at `eas init`.
>
> **`channel` was removed from `native/eas.json`.** Both shipped apps depend on
> `expo-updates`, which is what makes an EAS channel mean anything; Café Life does not, and
> has no over-the-air update need. With the package absent, EAS only warns
> (`runBuildAndSubmit.js:407` — a `log.warn`, not a throw), so the keys were never going to
> fail a build. They were inert, so they are gone rather than dragging in a dependency for a
> feature nobody asked for.
>
> ### The build would have failed on the first attempt
>
> Checking the two shipped apps turned up a blocker that had nothing to do with credentials.
> `native/src/webapp/html.js` — the whole 3.4 MB game — was git-ignored, and `native/App.js`
> imports it on line 4.
>
> EAS resolves its upload root with `git rev-parse --show-toplevel` and ships the **tracked**
> files from there (so `tools/`, `prototype/` and `art/` do travel, even though the project
> root is `native/`). Its git client consults `.easignore` only to *delete* files from that
> clone — `vcs/clients/git.js`, "`.easignore` exists, deleting files that should be ignored"
> — so it cannot add an ignored file back. The bundle would simply not have arrived, and
> Metro would have failed to resolve the import before signing was even reached.
>
> The bundle is now tracked. Verified by reconstructing the upload from tracked files alone
> and resolving `App.js`'s import against it.
>
> `marble-ultimate-football` avoids this from the other side, with an `eas-build-post-install`
> hook that rebuilds its bundle on the server. That does not port directly: this bundle is
> built by `tools/build-native.py`, which imports Pillow, and an EAS macOS runner has none.
> Worth doing later — a server-side rebuild makes a stale bundle impossible — but not as an
> untested change standing between here and a first build.
>
> ### Neither shipped app builds from CI
>
> There is no `EXPO_TOKEN` and no `eas build` in any workflow in either repository.
> `marble-ultimate-football` has one workflow, `release-checks.yml`, and it runs tests.
> `kabatin` has no workflows at all. Both are built from the operator's own machine, and
> `kabatin` points `eas submit` at a signing key in a home directory, so submission is local
> too. There is no CI route to inherit — `eas build` from your machine is the house route.
>
> `docs/11-ios-release.md` in that repository also requires physical-device checks against the
> actual candidate before submitting: a full run and relaunch, background/foreground and
> memory-pressure recovery, offline launch, and VoiceOver, text size and reduced motion. The
> harness cannot prove any of those.

> ### The missing piece is not in this repository
>
> App Store Connect will not take a build without a **privacy policy URL**, and external
> TestFlight testing needs a **support URL** too. The house pattern is a page pair on
> `barmajja.com`, served from the `barmajja` repository — for the other game, at
> `/games/marble-ultimate-football/privacy.html` and `/support.html`, with support reaching
> `info@barmajja.com`. Its Pages workflow assembles a `dist/` and refuses to deploy if
> anything private lands in it.
>
> **Café Life's pair is written** and waiting on a commit in that repository, on the branch
> `claude/cafe-life-store-pages`. Once it reaches `main` (a push to `main` there is a
> production deploy), the two URLs to give App Store Connect are:
>
> - `https://www.barmajja.com/games/cafe-life/privacy.html`
> - `https://www.barmajja.com/games/cafe-life/support.html`
>
> **The policy makes a claim this repository has to keep true.** It states that the app makes
> no network requests of any kind, and says so as verified fact rather than intent, on the
> strength of `tools/check-native.js` failing the build on a single attempted request. So that
> gate is not optional tidiness any more — if anything ever makes the app reach the network,
> the privacy page has to change *before* that build is distributed. The page commits us to
> that in writing.
>
> Two things the pages state plainly, because a policy describing a feature the build lacks is
> what a review rejects: this build has **no in-app reset** (`NEW()` exists but nothing calls
> it after a save loads), so reinstalling is how a player starts over; and there are no
> purchases of any kind.
>
> The Capacitor pipeline and its eight secrets are kept below for reference. They are not the
> route to take.
---

## Before any of the secrets

1. **Apple Developer Program** — 99 USD a year, at developer.apple.com. Everything below needs
   it. Enrolment as an organisation can take days; as an individual it is usually same-day.
2. **Register the bundle ID.** Certificates, IDs & Profiles → Identifiers → **+** → App IDs →
   App. Use **`com.almulla.cafelife`**, or pick your own and change `appId` in
   `app/capacitor.config.json` to match. They must be identical.
3. **Create the app record.** App Store Connect → Apps → **+** → New App. Platform iOS, the
   bundle ID from step 2, SKU anything, name *Café Life* (Apple will ask for a different one
   if it is taken).

---

## The eight secrets

Add each at **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Where it comes from |
|---|---|
| `APPLE_TEAM_ID` | developer.apple.com → Membership. Ten characters, like `A1B2C3D4E5`. |
| `BUILD_CERTIFICATE_BASE64` | An **Apple Distribution** certificate as a `.p12`, base64'd. See below. |
| `P12_PASSWORD` | The password you set when exporting that `.p12`. |
| `PROVISIONING_PROFILE_BASE64` | An **App Store** provisioning profile for the bundle ID, base64'd. |
| `KEYCHAIN_PASSWORD` | Any string you invent. It only unlocks a temporary keychain on the runner. |
| `APPSTORE_API_KEY_ID` | App Store Connect → Users and Access → Integrations → App Store Connect API. |
| `APPSTORE_API_ISSUER_ID` | The same page, above the key list. |
| `APPSTORE_API_PRIVATE_KEY` | The `.p8` file that page downloads **once**. Paste the whole text, `-----BEGIN` line included. |

### The certificate

On a Mac, in Keychain Access → Certificate Assistant → Request a Certificate From a Certificate
Authority. Save to disk. Upload that request at developer.apple.com → Certificates → **+** →
**Apple Distribution**. Download the `.cer`, double-click to install, then in Keychain Access
right-click the certificate → **Export** → `.p12`, and set a password — that password is
`P12_PASSWORD`.

Then:

```
base64 -i Certificates.p12 | pbcopy        # paste as BUILD_CERTIFICATE_BASE64
```

### The provisioning profile

developer.apple.com → Profiles → **+** → **App Store Connect** → your bundle ID → the
distribution certificate you just made. Download, then:

```
base64 -i CafeLife_AppStore.mobileprovision | pbcopy    # PROVISIONING_PROFILE_BASE64
```

The API key wants **App Manager** access to upload builds.

---

## Then

```
git tag v0.1.0 && git push origin v0.1.0
```

or run it by hand from the Actions tab. About fifteen minutes: it builds the web game,
generates the Xcode project with Capacitor, signs, archives, exports and uploads. The `.ipa` is
kept on the run as an artifact either way, so a signing failure still leaves you something to
look at.

The build then has to **finish processing in App Store Connect** — usually five to thirty
minutes — before it appears in TestFlight. The first build of a new app also needs export
compliance answered once (the game uses no encryption beyond HTTPS, so: no).

Internal testers (up to 100, on your team) get it immediately. External testers need a first
build to pass **Beta App Review**, which takes a day or so; later builds usually go straight
through.

---

## What the build actually is

A Capacitor shell around the same HTML game the web build runs — `tools/build-web.py` produces
`dist/` for the artifact and `app/www/` as a whole document for the native shell, from one
source. `app/ios/` is **not** in the repository: it is regenerated from
`app/capacitor.config.json` on every run, so there is no Xcode project drifting out of sync
with the game.

The version number comes from the tag (`v0.2.0` → `0.2.0`) and the build number is the
workflow run number, which always increases — Apple rejects a build number it has seen before.
