# 11. Getting this on the App Store

An honest account of what exists, what does not, and what the route looks like.

## Where the project actually is

What exists is a **complete, playable, offline game**: three verified
competitions, twenty-five arenas, save/resume, two modes, and a test suite that
holds the simulation to account. It runs as a web bundle.

What does not exist is anything Apple-facing: no app icon, no launch screen, no
StoreKit integration, no App Store record, no signing identity. None of it could
be built in the environment this was made in — there is no Mac, no Xcode and no
Apple account here. Everything in this document is yours to run.

## Two routes to an iOS binary

### Route A — wrap the existing bundle (recommended for v1)

Capacitor puts the web bundle inside a native app: native launch, native icon,
native haptics, native in-app purchase, everything on-device. Scaffolding for
this is already in [`../app`](../app), and `npm run build` already produces a
345 KB bundle that has been verified to make **zero** network requests.

**Why it is a reasonable choice here, not a shortcut**

- The game is genuinely offline and self-contained. There is no website it is a
  wrapper around; the simulation runs on the device.
- Performance is not close to the limit. A full 46-second match simulates in
  about 11 ms headless; at 1× the renderer has a ~120 Hz fixed-step world of at
  most a few dozen colliders to draw. WKWebView handles that comfortably.
- The whole thing is 345 KB before the shell. It launches instantly.

**The real risk: App Store Review Guideline 4.2 (minimum functionality).** Apple
rejects apps that are thin wrappers around a website. The defence here is
substantive rather than cosmetic, and should be stated in the review notes:
the app ships all content on-device, works in aeroplane mode, has no web
counterpart, and uses native haptics and native purchase. Games built this way
do ship. It is still a risk worth knowing about before you spend the $99.

Also relevant: **2.5.2** forbids downloading executable code. Capacitor bundles
everything at build time and `limitsNavigationsToAppBoundDomains` stops the web
view navigating anywhere, so this is satisfied — and the offline assertion in
the build script is what keeps it satisfied as the project grows.

### Route B — port the simulation to Swift

The plan already sketched in [05-architecture.md](05-architecture.md). The
layering was designed for it: the simulation is arithmetic over structs, about
600 lines, with no DOM and no I/O, and the deterministic trigonometry ports
across unchanged.

Port it **against a golden-file test**: dump a few thousand `(seed, arenaId,
score)` triples from the JavaScript build and require the Swift build to
reproduce every one. If it does, the two are the same game.

This is the better long-term answer and it is not the thing to do first.

### Recommendation

Ship v1 on Route A. Move the simulation to Swift when profiling on real devices
says it is needed, or when the renderer wants Metal — not before. Route A gets
the acceptance test in front of real players, which is the only thing that tells
you whether any of this is worth porting.

## What has to be built before you can submit

| | Work | Notes |
|---|---|---|
| ☐ | **App icon** | 1024×1024, no transparency, no rounded corners. A single glass marble is the obvious mark. |
| ☐ | **Launch screen** | A storyboard on `#070b0f` so there is no white flash. |
| ☐ | **StoreKit 2** | One non-consumable, per [07-modes-and-monetisation.md](07-modes-and-monetisation.md). Needs all the states designed there: success, cancel, failure, **restore**, deferred (Ask to Buy), and offline entitlement verification. |
| ☐ | **Ads, or not** | Simplest first release is **premium-only or free with no ads at all**: it removes an SDK, a privacy disclosure and an ATT prompt from v1. Ads can come in 1.1 once retention is known. |
| ☐ | **Rights review** | [10-rights.md](10-rights.md) — competition naming is the blocker. Do this *before* the App Store record, because it may change the app's name. |
| ☐ | **Accessibility pass** | VoiceOver on every screen, Dynamic Type, and verification that the follow cues read without colour. Reduced motion is already wired. |
| ☐ | **Device testing** | Smallest (iPhone SE, 375 pt) and largest current iPhone, plus an older device for frame rate. The layout is already verified at 393 pt. |

## App Store Connect specifics

- **Privacy nutrition label: "Data Not Collected".** The app has no accounts, no
  analytics, no network calls and no third-party SDKs. Keep it that way for v1;
  it is a genuine selling point and it makes the submission trivial.
- **No ATT prompt** is needed while there is no tracking.
- **Export compliance**: no encryption beyond HTTPS, so set
  `ITSAppUsesNonExemptEncryption = false` in `Info.plist`.
- **Age rating**: there is no gambling, no simulated gambling, no wagering, no
  loot box and no purchasable random reward anywhere in the design, and there
  should never be. Expect 4+.
- **Review notes**: say plainly that all content is on-device and the app works
  with no network. That is the 4.2 answer.
- **Screenshots**: the live arena, a group table, the draw ceremony and the
  trophy screen carry the idea in four frames.

## Cost and time, roughly

- Apple Developer Program: **$99/year**.
- Route A to a TestFlight build: **days**, most of it icon, StoreKit and signing.
- Rights review: unknown, and it is the long pole. Start it first.

## What to do first

1. Create the repo and push (done, if you are reading this there).
2. Start the rights review. It can change the app's name, so nothing downstream
   of a name should happen before it.
3. On a Mac: `cd app && npm install && npm run build && npm run add:ios`, and get
   it running on your own phone. Play a full Road to Glory campaign on a real
   device before building anything else.
4. Then icon, launch screen, StoreKit, TestFlight.
