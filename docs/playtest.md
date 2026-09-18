# Café Life — test whether people want another day

Updated for build 8 and the proposed hosting redesign, 18 September 2026. The current build passes automated rules and local StoreKit checks. These do not establish enjoyment, accessibility on a real phone or willingness to pay.

Use the exact build under test and record its commit. Keep current-build findings separate from proposed features in [the product plan](product-fun-plan.md). Do not describe proposed hosting, placement or venue features as already playable.

## First session

Recruit eight people outside the team, including Arabic-first players and at least two who do not usually play management games. Do not send invitations without the owner's explicit instruction. Ask for consent to observe or record their feedback; no analytics or tracking are added to the game.

Give them the private preview or a signed TestFlight build they are authorised to access. The current phone preview is owner-private and cannot simply be sent to outside testers without arranging appropriate access. Do not silently publish it or widen its audience.

Suggested invitation once access is ready:

> Here is a café game I am making. Please try it without instructions for up to ten minutes, or stop earlier whenever you want. Tell me where you stopped, what you were trying to do, and what made you want to continue or leave.

Do not coach them through the opening. Record the time to their first meaningful action, first completed day and first visible change they chose. Record confusion before explaining anything.

Ask afterwards:

1. What were you trying to make or achieve?
2. Which decision changed what happened? Show me the consequence.
3. Did you choose a different approach the next time? Why?
4. Which person, recipe or part of the café felt like yours?
5. Where did the game become repetitive, unclear or slow?
6. What specifically would you do if you opened it again?
7. Would you pay AED 19.99 once for this exact game after its free in-game year? What is missing at that price?

A proposed internal opening gate is at least six of eight completing a day without help, explaining a consequence, and naming a next goal. Separately note whether they deliberately replay an activity differently. These thresholds are product decision aids, not statistical proof.

## Seven real days, with unrestricted play

After the opening is understandable, run a voluntary diary/interview test covering at least 168 hours from each person's first play. Players may play for as long or as little as they want. Do not send return reminders, reward attendance or lock activities until tomorrow. Count a day-seven return only at or after the 168-hour point.

Ask players to make a brief note when they choose to play: approximate session length, what brought them back, what they did, and why they stopped. An end-of-test interview can collect those notes. This is explicit user feedback outside the game, not hidden analytics. Do not collect personal details unnecessary for the test.

Report actual participant counts, returns on separate days, activities repeated voluntarily, where novelty ran out, confusion and willingness to pay. Distinguish “played again” from “wanted to see a new consequence.” Include people who stopped. Avoid presenting a small convenience sample as a guaranteed retention rate.

If players exhaust the interesting decisions in one sitting, add different worthwhile activities and consequences. Do not stretch prices or impose waits to make the duration look longer.

## The purchase boundary

Tell testers truthfully that the browser development preview cannot take money. Use a signed sandbox/TestFlight build for the real Apple flows. Check that they understand:

- The first year means in-game 1994, not twelve real months.
- The full game is one purchase, not a subscription.
- Their café remains saved if they cancel or cannot buy.
- Restore Purchases restores access; a café save file restores progress.

See [the release plan](premium-release-plan.md) and native StoreKit test notes for the transaction cases. Never ask testers to spend real money as part of an unannounced purchase test.

## Physical iPhone checks

Test cold launch, background/process recovery, large text, VoiceOver order and labels, Arabic/RTL, save-file sharing, mute/interruption behaviour, music/effects controls and haptics on actual supported phones. The browser preview cannot verify those native behaviours.

## Turning feedback into changes

Prioritise repeated observed problems over a long feature wish list. A person who stops tapping matters more than a polite “looks nice.” Preserve findings before fixing them, so the next build can be compared with the same opening task.

Do not add analytics. The privacy update for Apple purchase services does not authorise gameplay tracking. Keep play-value evidence separate from automated correctness and compilation evidence.
