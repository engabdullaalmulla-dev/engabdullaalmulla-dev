# Café Life one-time iOS unlock

This local Expo module supplies StoreKit 2 ownership for the full game. The first in-game year is enforced by the authored game access layer. Game saves contain no purchase entitlement.

The proposed non-consumable product identifier is `com.almulla.cafelife.fullgame`. It is source configuration, **not evidence of a configured or approved App Store product**. The intended UAE price is AED 19.99 once; set the actual supported price point, territories and localisations in App Store Connect. The app displays `Product.displayPrice` returned by Apple and never constructs a checkout price itself. No subscription, app account, RevenueCat or analytics are used.

The module is linked from `native/modules` during Expo prebuild/EAS builds. It cannot be added through an over-the-air JavaScript change and is unavailable in Expo Go, Android and the browser preview. Those surfaces never simulate a purchase.

## Entitlement rules

- Read `Transaction.currentEntitlements` and accept only verified, unrevoked, non-consumable transactions for the exact product.
- StoreKit's signed on-device transaction cache is the offline authority. No JavaScript storage boolean or saved-game field unlocks the app.
- Immediately after a verified purchase, retain that actual native transaction in memory until Apple’s entitlement cache catches up. A foreground refresh must not briefly relock the game during this propagation gap. Verified revocations clear that temporary proof. No save, JavaScript flag or persistent Boolean participates.
- Refresh on launch and foreground. Listen to `Transaction.updates` for deferred purchases, refunds and revocations; finish verified transactions after providing the result.
- Show pending and cancelled purchases without granting access. A store catalogue failure does not remove a verified existing entitlement.
- Call `AppStore.sync()` only after the player's explicit Restore Purchases action, because it may prompt for App Store credentials.
- Entitlement changes only alter permission to advance beyond the free year. The native module never writes, resets or removes a café save or earned upgrade.

## Web bridge

Requests are bounded JSON messages to the existing React Native WebView bridge:

```js
{ type: 'purchaseStatus' | 'purchaseFullGame' | 'restorePurchases', requestId: 'unique-id' }
```

Responses are `cafe-purchase-result` DOM events with:

```js
{
  type, requestId,
  status: 'ready' | 'purchased' | 'restored' | 'pending' | 'cancelled' | 'error' | 'unavailable',
  productId: 'com.almulla.cafelife.fullgame',
  entitled: boolean,
  verified: boolean,
  available: boolean,
  localizedPrice: string | null,
  error: 'busy' | 'failed' | 'unavailable' | 'productUnavailable' | 'storeUnavailable'
       | 'paymentsDisabled' | 'verificationFailed' // optional
}
```

Only `entitled === true && verified === true` grants access. The injected capability `CAFE_NATIVE_CAPABILITIES.purchases` reports whether this compiled iOS module is present. Updates not associated with a tapped button use `type: 'purchaseStatus', requestId: 'native-update'`. `restored` can legitimately return `entitled: false`; the interface must say that no purchase was found, not that a purchase succeeded. There is no developer unlock command.

## Checks before release

`node native/tests/purchaseBridge.cjs` exercises boundary validation, localized prices, product identity, verified ownership, cancellation/pending, empty restoration, sheet serialization, errors, refunds and callback escaping. These tests use explicit native doubles; they are **not** StoreKit sandbox purchase evidence.

Build 8 verification on 18 September 2026: all 14 purchase bridge checks passed, the local module was discovered by Expo autolinking, and an isolated Expo prebuild plus CocoaPods install and unsigned Xcode Debug build succeeded for both arm64 and x86_64 iOS simulators. All nine Apple StoreKitTest integration cases also passed against the production Swift service using a locally signed simulator host and no-money test transactions. They cover immediate refresh continuity, purchase/cache propagation, restore, refund, pending approval, cancellation, catalogue failure and invalid signatures. These results verify local native behavior, not a live App Store Connect product, a sandbox-server transaction or a signed physical-device release.

Before charging players, complete App Store Connect setup, the current paid-app agreements and required banking/tax information, the non-consumable's English/Arabic metadata and review screenshot, and attach it to the app version for review. Verify the actual UAE price and other territories' localized prices in the store. Update the published privacy policy to describe Apple's purchase/restore network processing while retaining the offline/no-analytics gameplay claims.

Run the following on a signed development/TestFlight build with Apple's sandbox:

1. Fresh install: first in-game year playable, owned state starts unknown until verified, and no product means no actionable buy button.
2. Cancel the Apple confirmation sheet: no charge, entitlement or lost café state.
3. Complete purchase: unlock exactly once; continue the existing café beyond year one.
4. Ask to Buy/pending: no premature unlock; approval via transaction updates unlocks without losing progress.
5. Reinstall/second device: correct App Store account restores ownership; empty restoration is clearly explained.
6. Airplane mode after verification and process termination: owned play continues; new purchases show a useful unavailable state.
7. Refund/revoke in sandbox: future paid progression stops, saves and earned capabilities remain available to inspect/export.
8. Disabled payments, cancelled authentication, unavailable product and interrupted network: retry/restore works without duplicate sheets.
9. English/Arabic system sheets and app copy, VoiceOver reading order, text scaling, real-device lifecycle and audio interruptions.

Authoritative references: [current entitlements](https://developer.apple.com/documentation/storekit/transaction/currententitlements), [purchase](https://developer.apple.com/documentation/storekit/product/purchase(options:)), [restore/sync](https://developer.apple.com/documentation/storekit/appstore/sync()), [transaction updates](https://developer.apple.com/documentation/storekit/transaction/updates).
