# Local StoreKit integration checks

`CafeLifePremium.storekit` is an **Xcode-only test catalogue**. It does not create a product in App Store Connect, accept money or unlock a production install. Its AED 19.99 price and English/Arabic product descriptions are fixtures. The production app always displays Apple's current `Product.displayPrice`.

The XCTest suite runs the exact authored `CafePurchaseStore.swift` in a minimal simulator host, using Apple's StoreKitTest runtime. It covers verified purchases, a fresh native entitlement reader, restore with/without ownership, refunds delivered through transaction updates, Ask to Buy approval, cancelled purchases, catalogue failure with cached ownership, and verification failure. No external billing service or game-save entitlement stub is involved.

## Run

Requirements: Xcode, an installed iOS 17-or-newer simulator and the `xcodeproj` Ruby gem (included with CocoaPods). Run these from the repository root and choose a fresh output directory:

```sh
ruby native/tests/storekit/create-project.rb /tmp/cafelife-storekit-qa
xcrun simctl list devices available
xcodebuild -project /tmp/cafelife-storekit-qa/CafeStoreKitTests.xcodeproj \
  -scheme CafeStoreKitTests -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath /tmp/cafelife-storekit-qa-derived \
  -resultBundlePath /tmp/cafelife-storekit-qa.xcresult \
  -test-timeouts-enabled YES -default-test-execution-time-allowance 15 \
  -maximum-test-execution-time-allowance 20 CODE_SIGN_IDENTITY=- test
```

Replace the simulator name with an installed device. With Homebrew CocoaPods, expose its bundled gems if ordinary Ruby cannot find `xcodeproj`:

```sh
GEM_HOME="$(brew --prefix cocoapods)/libexec" ruby native/tests/storekit/create-project.rb /tmp/cafelife-storekit-qa
```

The generated simulator host uses local ad-hoc signing and the normal `get-task-allow` development entitlement; no Apple Developer identity is required. StoreKitTest requires this signed host even though an ordinary compile can be unsigned.

The generator writes only to the new output directory. It references the actual service source and copies the `.storekit` fixture only into the test bundle. It never modifies a generated Expo `ios/` directory or an App Store product. Reusing a result-bundle path requires choosing a different path for the next test run.

Passing local tests does not verify signed App Store sandbox receipts, production catalogue availability, real-device offline relaunch, the app's full purchase UI, family purchase settings, or App Store review. Complete those checks using a signed development/TestFlight app and the configured non-consumable before sale.

## Verified result

On 18 September 2026, all nine tests passed with zero failures on the iOS 26.5 simulator using Xcode 26.6. The full Expo app also compiled and linked the production module for arm64 and x86_64 simulators.

The tests exposed a real propagation gap after a verified purchase: Apple's native entitlement sequence could briefly be empty. Production now keeps the actual verified transaction in native memory until the cache catches up, while verified refunds still clear access. The test asserts that an immediate status refresh never publishes a false lock, then waits for the observable verified cache entry (with a five-second deadline) before testing a fresh reader. Fixture resets likewise wait for observable empty transaction/cache state. There are no arbitrary sleeps used to claim a pass or gameplay waits added to the app.
