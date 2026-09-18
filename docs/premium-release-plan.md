# Café Life — premium release contract

Confirmed by the owner on 18 September 2026: the first **in-game year** is free; **AED 19.99 once** unlocks the remaining game. This is not a subscription or a twelve-month real-time trial.

## What the purchase promises

The free opening runs from 1 January through 31 December 1994. The player controls time and can serve, delegate or advance to stories immediately. The last day's trading and rewards settle before asking to continue into the following year. The first generation's free-year stories remain accessible. There are no advertisements, energy payments, consumable boosts or recurring charges.

The full-game purchase continues the same café into later years and family generations. It applies across the player's cafés. A game export contains progress, never purchase ownership. Apple verifies the non-consumable purchase; Restore Purchases restores access, while save-file import restores café progress. Neither operation is a substitute for the other.

After the free year, the player can inspect and export the café, open saved cafés, or begin another free café. Cancelling a purchase, waiting for Ask to Buy, a store outage or a refund must never erase progress or possessions. Without a valid entitlement, advancing paid chapters is unavailable. Existing purchased ownership comes from StoreKit's signed on-device cache so catalogue availability cannot block an owner's offline gameplay.

The private browser development preview remains freely playable and cannot take money. It says this explicitly. The native release must not contain a developer unlock or derive ownership from localStorage, an imported save, an arbitrary price string or a JavaScript caller-supplied flag.

## Work implemented in build 8

- Customer service now records family visits, enjoyed dishes, bond levels and permanent milestone memories. A matching choice changes the relationship; a different choice does not erase prior progress. Delegation uses the same resolver and can earn the same relationship progress.
- Earlier story choices open different later situations. Future chapters test the selected answer rather than merely checking that the prior scene was completed.
- Personal scenes can recognise remembered service. These are optional bonuses, not requirements to continue the main game.
- First-year closure and second-year scenes provide new authored situations after the free opening; alternative paths are counted separately from scenes encountered in one playthrough.
- People pages show remembered welcomes and dishes. The café's visible visitors now follow the service queue or rotate by game day.
- The access boundary handles manual service, delegation, skips, succession and imported later-year saves without deleting progress.
- Native StoreKit 2 handles product loading, verified ownership, purchase, restoration, cancellation, pending approval, transaction updates and refunds. The checkout uses Apple's localized price. The planned UAE price is not used as a fake product response.
- English and Arabic purchase explanations, restore controls, relationship presentation and new content are implemented.
- Nine local Apple StoreKit integration tests pass against the production Swift service, including delayed entitlement-cache propagation and refunds; both iOS simulator architectures compile. These results do not replace signed-device App Store sandbox tests.

## What still determines whether this is worth selling

The concrete gameplay sequence and examples are in [the product fun plan](product-fun-plan.md); the matching outside-test protocol is in [playtest.md](playtest.md). These planned features are not part of build 8.

### Play value — release gate, not a content-count claim

Run an uncoached first-session test and an unrestricted seven-real-day playtest before calling this a premium finished game. A test harness cannot establish enjoyment or willingness to pay.

Use eight first-time players for the opening. Target at least six understanding and completing their first service without coaching, and at least six explaining a decision and its later consequence. Record the actual time, where they hesitate and why they stop. These are proposed internal gates, not industry benchmarks.

Then recruit a small consenting group for seven elapsed days. No reminders, attendance rewards, timed chapters or analytics are added to the app. Use voluntary diaries and interviews. Count a week-return only at or after 168 hours from first play. Ask whether the exact tested build is worth AED 19.99, what they wanted to return for, and what became repetitive. Finishing rapidly is allowed. If later play is exhausted or uninteresting, add new decisions and consequences rather than slowing the player.

The service interaction is still dish selection, not a complete drink-making minigame. Rooms are still three arrangements, not free furniture placement. Venues still share operational assets, and inheritance still uses a small fixed heir set. These are deliberate remaining scope limits, not completed features. Prioritise stronger service variety, café personalisation and later-generation situations if testing exposes them as reasons not to buy.

### Commercial release gates

1. Configure a non-consumable in App Store Connect for the actual Café Life app using product ID `com.almulla.cafelife.fullgame`. Confirm the UAE storefront price point is AED 19.99 and configure other storefront prices deliberately. The code displays Apple's returned price.
2. Complete required account agreements, tax and banking details through the owner's Apple account. Do not put private account identifiers or credentials in this public repository.
3. Exercise sandbox purchase, cancelled purchase, Ask to Buy approval, restoration, reinstall/new-device restoration, refund, failed verification and offline relaunch on the signed app. A successful simulator compilation alone does not establish these behaviours.
4. Validate save upgrade/migration, interrupted service, file sharing, cold launch, background audio, mute behaviour, process recovery, Arabic/RTL, VoiceOver and all text sizes on actual iPhones.
5. Publish the revised privacy policy before releasing the purchase-enabled app. The historic claim that the whole app makes no network requests is no longer accurate: native Apple purchase services are an explicit exception. Gameplay and the WebView remain offline, with no analytics or developer account.
6. Finish English and Arabic App Store descriptions, support/privacy links, age rating, current-device screenshots, purchase review screenshot and reviewer notes. Describe the free year as game time everywhere.
7. Upload and test the signed TestFlight build, resolve findings, then submit the app and its first purchase for Apple's review. Neither the app nor the purchase has been submitted by this development work.

## Primary implementation references

- [Apple App Review Guidelines, in-app purchase](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase): digital full-game unlocks and restoration requirements.
- [Apple, current entitlements](https://developer.apple.com/documentation/storekit/transaction/currententitlements): verified non-consumable access and refunded/revoked transactions.
- [Apple, in-app purchase pricing](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-a-price-for-an-in-app-purchase): storefront pricing configuration.

Checked 18 September 2026. The free year is a content boundary within a simulation, not a real-time free trial offer.
