# Café Life build 9 — a café full of your moments

18 September 2026. Branch: `codex/cafe-life-daily-rebuild`. Version 1.1, iOS build 9. This is a tested development build, not a finished premium release.

## Implemented gameplay

- Three optional occasions: Mariam’s reunion, the illustrated tasting and Noor’s neighbourhood exhibition. Each has two approaches, for six authored hosting days. All are available immediately and can be replayed or ignored.
- Each approach selects three guests with familiar, discovery or sharing requests. Requests, recommendations and opening finances freeze when service starts. Matching different intentions earns equal relationship progress; recommendations can broaden remembered preferences.
- Free preparation suggests owned recipes and a room arrangement. It never spends money. Players may edit the plan, host manually, delegate immediately or run an ordinary day. A manual recommendation sequence and delegation produce the same result; manual choice of a different dish may produce a different remembered response.
- Six newly painted permanent keepsakes: reunion photograph, picnic hamper, illustrated menu, tasting notes, street landscape and a shared boat sketch. Display any owned object on the wall, shelf or gathering corner, change it immediately or put it away without losing it. The objects appear in the main café and open their story when tapped. These are three fixed positions, not free furniture placement or a walking avatar.
- Closing leads with the chosen approach, guests’ actual dish responses and the earned keepsake. A particular next occasion is one tap away. The accounts remain below. Replaying gives no duplicate object, first memory or special cash reward.
- English/Arabic text, RTL, small-phone layouts and reduced-motion handling. Brief cup feedback, existing original music and sound effects, and the existing redesigned brand remain integrated. A browser check exposed and fixed inherited dark-mode text colours.
- Additive version-6 save migration preserves old cafés, partial ordinary days and permanent progress. Existing story choices receive only the represented keepsake they already earned. Active occasion copy follows retired regulars’ families; earned memory text stays fixed at its original date.

## Commercial contract preserved

The first in-game year, 1994, remains free. The intended unlock is AED 19.99 once; native StoreKit supplies the actual configured checkout price. The final free hosted day settles once, including its keepsake. Players may still arrange and export it; an extra trading day requires verified Apple ownership. Hosting/save data cannot grant an entitlement. The private browser preview remains explicitly unrestricted and cannot charge.

## Verification completed

- 90 deterministic JavaScript checks: 36 engine, 13 hosting, eight access, six persistence, 13 native save bridge and 14 native purchase bridge.
- All six approaches tested from a new zero-cash café, manual/instant/partial delegation parity, frozen service, repeat rewards, rearrangement, older-save migration, succession, malformed imports, and final-free-day preservation and advancement guards.
- 1,531 English/Arabic text pairs and 249 literal interface keys validated, including placeholders. UI syntax and whitespace checks passed.
- Independent review found and fixed stale feedback across café replacement, a mismatched keepsake follow-up link and original-name text after retirement. An additional pure-template review exercised 192 renders across both languages, approaches and founding/later generations.
- Actual browser interaction at 393×852: reunion selection, free preparation, three different guest requests, response feedback, close, reward and visible photograph placement. Custom recipe markup remained literal text.
- Actual browser interaction at 320×740 with Arabic, extra-large text, dark mode and reduced motion: hosted result, immediate next occasion, instant tasting delegation, two visible saved objects and exhibition completion. Inspected pages had no horizontal overflow; reduced motion suppressed confetti.
- Reloaded the completed save in the final embedded game and completed the next exhibition. No browser console errors or warnings were recorded. All 146 sprites plus icon and logo decoded successfully (148/148) from the final payload.
- Expo exported the current iOS JavaScript bundle successfully (618 modules) to `/tmp/cafelife-build9-ios-export`.
- Native and web documents rebuilt with fingerprint `cafe-life-83ef11eed4ea0ce8`. The documents match exactly and all seven embedded scripts match their authored source. Static offline/source-freshness checks passed.

The standalone Chromium/native-origin release gate was not run in this session; the static checks and browser interaction above are separate evidence. Build 8’s successful unsigned native compile and nine local Apple StoreKitTest cases are prior evidence for the unchanged native purchase module, not new Build 9 device testing.

The owner-private [phone preview](https://cafe-life-phone-preview.eng-abdulla-almulla.chatgpt.site) was updated successfully with this exact web document. It is a browser development preview, not a TestFlight or Apple purchase test.

## Remaining product and release work

This completes the first hosting/personalisation slice in [the product fun plan](product-fun-plan.md). It does not implement all the later projects, independently configured venues or deeper successor situations. Three replayable occasions are not proof of one real week of enjoyment.

Next: run the documented uncoached opening test with outside English/Arabic players, improve the repeated choices based on evidence, expand the proven systems, and conduct a voluntary seven-real-day playtest. The owner-private phone preview is not automatically accessible to outside testers.

Before sale, configure the intended App Store product/price, finish signed-device purchase and restoration tests, physical iPhone audio/haptics/VoiceOver/save recovery, real screenshots, revised public privacy policy, signed TestFlight and App Review. No actual purchase, App Store product creation, signed IPA or submission was performed. See [premium release plan](premium-release-plan.md).
