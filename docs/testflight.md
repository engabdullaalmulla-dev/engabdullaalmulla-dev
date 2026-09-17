# Getting Café Life onto TestFlight

The repository builds and uploads the app itself. What it cannot do is *be you at Apple* —
eight secrets have to come from your developer account, and no CI can generate them. This is
the list, in the order it is least annoying to do them.

The workflow is `.github/workflows/ios-testflight.yml`. It runs on a pushed tag (`v0.2.0`) or
from **Actions → iOS · TestFlight → Run workflow**. Its first step checks all eight secrets
exist and stops with a list of what is missing, rather than failing later inside `xcodebuild`
with something unreadable.

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
