# Café Life — make running the café worth coming back to

Product plan, updated 18 September 2026 for build 9. The first hosting slice is now implemented: three occasions, six approaches, six painted permanent keepsakes and three room display positions. The sections below retain the larger product roadmap; they are not a claim that the whole plan is complete. The first in-game year stays free, with the intended AED 19.99 one-time full-game unlock. No real-time waits, energy, ads, lost abilities or attendance obligations.

## Implemented in build 9

- Mariam's reunion, the illustrated tasting and Noor's neighbourhood exhibition each offer two approaches. Invitations do not expire, preparation uses owned dishes, and every approach can be completed from a new café with no cash. Ordinary trading remains available.
- Hosted days have three guests with familiar, discovery and sharing intentions. The chosen approach changes the guest mix, suggested menu and layout, service requests, reactions and outcome. Discovery can add an enjoyed recipe to a guest's remembered preferences. Serving remains dish selection; pouring and plating gestures are later work.
- Each approach awards its own painted keepsake. The reunion photograph, picnic hamper, illustrated menu, recipe notebook, neighbourhood watercolor and shared boat sketch remain owned across saves and succession. Repeat hosting does not duplicate an object or award an extra cash bonus.
- Owned keepsakes can be placed or rearranged immediately in the wall, shelf or gathering-corner position and appear in the café scene. Replacing an object returns it to the collection. These are three defined positions, not free furniture placement. Four represented earlier story rewards migrate into the collection without inventing completed occasions or visits.
- The closing screen presents the selected approach, guest responses, keepsake and an immediately available next invitation before the accounts. Manual service and instant or partial delegation share the same resolver and produce the same outcome for the same decisions. English and Arabic content and controls are implemented.

The deterministic checks cover all six approaches, zero-cash continuity, delegation parity, interrupted-service saves, permanent collections, migration and malformed-save rejection. Build 9 has 90 passing JavaScript checks; localization checks cover 1,531 English/Arabic pairs and 249 literal UI keys. These checks establish behavior and content coverage, not enjoyment, physical-device accessibility or seven-day replay value. Updated private-preview publication is tracked separately from source implementation.

## The problem to solve

The build 8 baseline had four guests, with the usual dish worth more relationship progress than a liked dish or a different one. The interface revealed those matches. Once understood, this became an obvious-answer sequence. The top bond arrived after ten usual orders. Ordinary trade is already resolved from the opening plan, so extra tapping cannot change its financial result. Build 9 adds hosted intentions and visible consequences; outside playtests must establish whether that creates worthwhile decisions.

Daily briefs offer useful direction, but can become a checklist satisfied by the same broad menu. All twenty catalogue recipes become available by game day 27. Story branches now exist, but their outcomes mostly change cash, identity, recipes and text memories. A photograph, sign or garden described in a story generally never appears in the room. Later venues share operational assets and generations reuse event templates.

The improvement should make the player say: “I chose what sort of day to host, the people responded, and my café looks different because of it.”

## Hosting and visible ownership: initial slice and expansion

Build 9 connects the initial reunion, illustrated tasting and neighbourhood exhibition from the morning invitation through planning, guest moments, a visible keepsake and a follow-up invitation. Each has two authored approaches. Test whether players deliberately replay these initial occasions before expanding to six patterns.

The six-pattern target is below. The first three have an implemented hosting loop; their broader ambitions, such as deeper recipe-book feedback, remain subject to the roadmap. The final three patterns are not implemented. These are authored patterns with alternatives, not a claim of hundreds of unique days.

| Occasion | Approach one | Approach two | What must actually differ |
| --- | --- | --- | --- |
| Reunion | Shared breakfast | Takeaway picnic | Guests' service requests, useful menu qualities, gathering presentation and souvenir. |
| Illustrated tasting | Familiar recipes with new pairings | Introduce a house creation | Which guests contribute feedback, what the recipe book records and the next tasting invitation. |
| Neighbourhood exhibition | Quiet viewing with a cup | A shared drawing table | Visitor mix, seating use, interaction prompts and the displayed work. |
| Musician's set | A listening corner | A sing-along gathering | Room staging, guest requests, locally generated musical variation and the recorded memory. |
| Neighbourhood breakfast | A family sharing table | A counter for people heading to work | Serving situations, useful dishes, room activity and the follow-up request. |
| Takeaway picnic | A familiar family hamper | A discovery selection | Pairing decisions, customer reactions, a takeaway display and the next request. |

Occasions are invitations the player can select, revisit or leave for later. They do not expire. Ordinary trade is always available. An occasion must offer a viable approach with the player's existing resources. There is no required stock purchase, depleted ingredient, construction timer or real-world deadline. Start with equal reward budgets and different outcomes; do not make one occasion the permanent best money farm.

### A better service interaction

Use three short kinds of guest moment:

- A familiar welcome: remember what matters to this guest today.
- A recommendation: choose which of two tastes to explore and observe the result.
- A pairing or gathering: put together something that suits different people sharing a table.

The interaction changes a later observable state: an enjoyed recipe, a gathering request, a displayed keepsake, or a specific follow-up. A different answer can create a different successful day. Avoid presenting one glowing correct answer and two inferior choices everywhere.

Add brief, gesture-driven pouring/plating feedback where it makes the interaction pleasant. It must never require reaction speed or repeated work to earn normal progression. Every drag gesture has a tap-based accessible equivalent. Animations can be skipped or reduced. Avoid long modal dialogue between each guest.

Delegation follows the player's selected hosting approach and service intention through the same resolver. It receives the same outcomes for the same decisions. Manual play is a way to enjoy the scene; it must not become mandatory grinding for exclusive rewards, bonds or money.

### Let the player make the room their own

Add three clearly visible display positions: wall, shelf and gathering corner. Earn souvenir families from the played occasions, with distinct variants where the two approaches produce different objects. Examples include a reunion photograph, an illustrated menu, a guest sketch and a musician's keepsake.

Place or rearrange an owned object immediately. Keep all unused objects in an inventory. Show the chosen object in the main café scene and let the player tap it to revisit its memory or related activity. Existing story choices that already earned a represented object should receive the appropriate object during migration.

This is constrained room customisation, not a claim of free furniture placement. Separate decorative taste from economic optimisation so players can make a room they like. New art must fit the painted café, remain legible on a phone and work in RTL. Do not represent a new object only with a text counter or an unrelated sprite.

### Make each day's result explain the consequence

Lead the closing screen with three things:

1. What the player chose.
2. What changed in the people, recipe or room.
3. A concrete next activity they can begin immediately.

Keep the accounts available, but the emotional result should be visible before the ledger. The next activity is an invitation, not an obligation or a lock. Save midway through service and restore it exactly.

## A sample short session

The following two-minute timing is a design target, not a measured result.

- Enter the café and see Mariam's reunion invitation and Noor's exhibition idea. Choose the reunion; Noor's invitation stays available.
- Choose a shared breakfast instead of a picnic. Put suitable recipes on the board and choose the gathering setup. The room visibly responds.
- Handle a few short guest moments, or select the hosting intention and delegate. One guest wants comfort; another would like to try the house recipe. Their reactions reflect the choices.
- Receive a reunion keepsake, place it on the wall and see it remain in the café.
- Read the particular follow-up, then continue immediately, try the exhibition, run an ordinary day or leave with everything saved.

The first session should reach a visible, player-chosen change quickly. Target first meaningful action within 30 seconds, a complete short day within roughly two minutes and first personalisation within three minutes. Measure those targets without coaching rather than lengthening the tutorial to explain a confusing interface.

## What follows once the short session works

### Recipes with a purpose

Turn the recipe workshop into experimentation with legible taste feedback. Different people should explain what they enjoyed about a creation. Let the player choose a signature recipe and see it on the café's actual board, in relevant occasions and in customers' remembered preferences.

Avoid treating every ingredient permutation as a unique authored experience. Do not stretch progression by delaying existing recipes or taking them away. New equipment should enable a new interaction or occasion, not only a percentage bonus.

### Projects that the player can pursue now

Add a small project board with optional goals such as a house tasting menu, a neighbourhood exhibition or a courtyard gathering. Each has several different playable steps and a visible final result. Explain the first step and provide a route that uses owned capabilities. A player may finish steps in one sitting, change projects or keep trading. Never require logging in tomorrow or completing an unrelated repetitive task.

A completed project should leave behind something useful or expressive: a room object, a new hosting option, a distinct recipe presentation or a relationship chapter. Cash is a resource, not the sole reason to continue.

### Venues and generations with different decisions

Give each venue its own saved menu, room arrangement, occasion preferences and neighbourhood projects. Switching should feel like entering a different café. Preserve shared recipes, earned capabilities and the whole estate; do not turn additional locations into overdue chores.

Give successors new interests and situations that respond to the inherited café. An artistic heir should introduce a different project from a cook. Keep past creations and memories. Do not count renaming the same regular or replaying the same story template as new authored content.

These are later development slices. They should not delay testing whether the new basic day is fun.

## The paid game must add worthwhile play

The free year must contain a complete enjoyable version of the loop: meaningful hosting choices, a house creation, a visible personalised room and a consequence that returns. It must not be a lengthy tutorial or an intentionally frustrating sample.

Later years should introduce deeper projects, distinct venue operation and successor situations. They must give the player new things to create and decide. Simply moving the existing calendar past 1994 is insufficient as the central reason to pay.

Keep one purchase, clear native pricing, Restore Purchases and preserved progress at the boundary. The browser remains an explicitly labelled free development preview.

## Order of work and acceptance

1. **Hosting prototype — implemented in build 9:** three occasions, two approaches each, intention-based dish selection, delegation parity, three display positions and visible consequence-based results. Deterministic save, migration, continuity and parity checks pass. Complete physical-device checks for English/Arabic, reduced motion, audio and accessibility controls.
2. **Uncoached opening test:** eight outside players, including Arabic-first players and people who do not normally play management games. Observe the exact point they lose interest. Look for players choosing a different approach on replay and explaining what changed without prompting.
3. **Expand proven systems:** the other three occasion patterns, recipe feedback, projects, and then venue/successor depth. Add variety where testing reveals repetition. Do not use longer prices, timers or grind to disguise exhausted content.
4. **Unrestricted week test:** voluntary play across at least 168 elapsed hours, using diaries/interviews and no gameplay analytics or return reminders. Measure actual returns, repeated activities, session length, reasons to stop and willingness to pay for the exact tested build. Six occasion patterns alone are not evidence of a week's entertainment.
5. **Commercial/device work:** configure the intended Apple product and price, perform signed-device sandbox tests, check audio/VoiceOver/RTL/saves, publish the revised privacy policy and real screenshots, run TestFlight, then submit. See `premium-release-plan.md`.

For the opening, a proposed internal gate is at least six of eight players completing a day without help, explaining a consequence, and naming something they want to do next. Track deliberately replaying a different approach as separate evidence, not just tapping Continue. These are small-sample product decisions, not statistical proof or industry benchmarks.

A real week cannot be manufactured without restricting play. The aim is enough variety, ownership and curiosity that people choose to return. If testers exhaust the fun quickly, add worthwhile activities and consequences; keep their freedom to play immediately.
