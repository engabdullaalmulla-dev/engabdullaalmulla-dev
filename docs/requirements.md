# Café Rush — Product Requirements Document

**Version** 1.0 (draft for build)
**Owner** Product
**Date** 2026-09-15
**Status** Approved for implementation, pending the two playtest gates in §13

**Source documents this PRD builds on and must not contradict:**
`docs/target-player.md`, `docs/art-plan.md`, `docs/rush-pivot.md`,
`docs/engine-decision.md`, `docs/vertical-slice.md`, `prototype/frenzy.html`.

Everything in §4, §5 and §7 marked *(built)* is already implemented in
`prototype/frenzy.html` and the numbers here are read off that file. Everything marked
*(new)* is v1.0 work.

---

## 1. Product summary, vision and pitch

### One-sentence pitch

> **Café Rush is a ninety-second cooking rush on a struggling UAE shopping street, where
> the skill is having the milk steamed before the latte is ordered — bought once, for a
> few dirhams, with no timers, no gems and no ads.**

### Product summary

Café Rush is a premium real-time time-management game for portrait-orientation phones.
The player runs a small café on a quiet shopping street. Each shift is 90 seconds against
an earnings target in AED. Two mechanical layers run at once:

- **Machines cook *ingredients*** on independent background timers into per-machine stock
  bins. Cooking is not instant: a shot is 2.2 s, a pastry is 4.0 s, dough is 5.0 s.
- **Dishes are *assembled* from that stock** onto a plate. Assembly is instant.

Because assembly is instant and cooking is not, the core skill is **stock anticipation**:
holding the right ingredients before the order that needs them walks in. Starting a pastry
when the croissant order lands is already too late. This is the mechanic
`docs/art-plan.md` identified as the one genuinely missing from the first prototype, and
it is the whole game.

Between shifts the player spends banked AED on an upgrade tree. After the first chapter an
**Endless Rush** mode opens: one continuous shift that ramps every 25 seconds until three
customers walk out.

### Vision statement

> A cooking rush that respects the person playing it. Café Rush takes the pacing of the
> Dash games — the genre this player already said they liked — and removes the free-to-play
> scaffolding that genre is normally built to sell: the energy timers, the premium
> currency, the friend-gating, the forced ads, the daily-login guilt. In their place we put
> the only two things that legitimately make a game last: **systems deep enough to reward
> optimisation**, and **enough of them to keep finding new ones**. One price. One café. No
> obligations. Open it on a Tuesday six months from now and it is exactly where you left
> it, and there is still a run you have not beaten.

### What the product is not

It is not a cozy game. `docs/target-player.md` corrects that reading explicitly: the
reference player liked the fast one. What they rejected was the monetisation and the
length, not the pace.

---

## 2. Target player and anti-requirements

### 2.1 The player

The entire target definition comes from one source, and it should be described honestly
as what it is. Per `docs/target-player.md`:

> Source: r/CozyGamers, "Mobile game with no ads/no time requirement?", u/Francl27, ~2
> years old, archived. 16 upvotes, 26 comments. One person describing what they want, with
> a couple of dozen people agreeing or suggesting. **That is a hypothesis generator, not
> market validation.**

We design to it literally, and we treat every number derived from it as a hypothesis to be
falsified in playtest (§13), not as a fact.

**Primary player — "the lapsed Dash player."** Plays story, cooking, farming, building and
tycoon games. Played the Dash series and liked it. Finished it and was disappointed that it
ended. Plays a few hours a week and wants to be able to not play for a fortnight without
losing anything. Will pay money, at the scale of "a few bucks", specifically to avoid ads.

**Secondary player — "the Kairosoft buyer."** From the most-upvoted reply in the same
thread: someone who owns roughly five Kairosoft titles — premium-priced pixel-art
management sims. Different person from the poster, so weighted lower, but it points at a
real pattern: **this audience buys paid games outright, and buys them repeatedly from a
developer they trust.** That is our commercial thesis and our reason to build for a
sequel, not just a launch.

### 2.2 The headline requirement

From the post, quoted in `docs/target-player.md`:

> "would like something that lasts a while (like I liked the dash series but they were
> finished pretty fast)"

**LONGEVITY is the headline feature of this product.** It is the most-stated want in the
source, and it is named as the specific failure of the closest existing product. A
seven-day campaign is exactly the thing this player already complained about. §7 is the
section that answers this, and if §7 fails, the product fails regardless of §5.

### 2.3 Anti-requirements — what Café Rush must never do

These are hard constraints. Each traces to a specific line in the source. **A feature that
violates one of these is rejected without a trade-off discussion, including if it would
make money.**

| # | Anti-requirement | The line it comes from | Why it is absolute |
|---|---|---|---|
| A1 | **No energy system, no stamina, no lives that regenerate over real time.** The player may replay any shift immediately, any number of times, forever. | "don't want… wait 4 hours for something to build" | The stated first complaint. A 90-second shift behind an energy meter is the exact insult. |
| A2 | **No build queues or real-time waits of any kind.** Every upgrade applies the instant it is bought. Nothing "completes in 2h". | Same line | The upgrade shop in `frenzy.html` already works this way and must stay that way. |
| A3 | **No premium/hard currency.** One currency: AED, earned by playing. It cannot be bought. | "or… use special currency or bonuses to actually be able to beat a level" | |
| A4 | **Difficulty may never be paywalled.** No purchase, watched ad, or consumable may make a shift easier, extend a timer, skip a day, or raise earnings. | Same line | This is the constraint that kills the entire frenzy-genre monetisation playbook, which is the point. |
| A5 | **No social gating.** No friend invites, no "ask 3 friends to unlock", no team/guild requirement, no share-to-continue. | "none of those 'need friends to advance' game either" | |
| A6 | **No forced ads. No ads at all, of any kind, in any build.** Not interstitial, not banner, not rewarded, not "optional" rewarded. | "No forced ads please." + "Don't mind paying a few bucks to avoid ads" | The player's stated willingness to pay is explicitly payment *in exchange for* the absence of ads. Shipping a rewarded-ad button breaks the deal we took their money on. |
| A7 | **No daily-login rewards, no login streaks, no limited-time events, no expiring content, no FOMO of any kind.** Anything that can be earned today can be earned in six months, identically. | "something I can play a few hours a week without feeling that I have to play" | |
| A8 | **No push notifications that ask the player to come back.** Notifications are off by default and the only permitted category is a local reminder the player explicitly sets themselves. | Same line | |
| A9 | **No online requirement.** The game is fully playable in aeroplane mode forever after install. No account, no login, no server dependency for progression. | Implied by A5 + A7; also the offline requirement in §9 | |
| A10 | **No leaderboard that is the primary longevity hook.** Personal bests are the unit of competition. Global leaderboards, if ever added, are opt-in and cosmetic. | "without feeling that I have to play" | |

**Corollary on accessibility (see §10):** because A4 forbids paywalling difficulty, it also
forbids paywalling the *easing* of difficulty. The Relaxed Timing assist is free, always
available, and earns full progression and full stars.

---

## 3. Goals and non-goals for v1.0

### 3.1 Goals

| # | Goal | Measure of success |
|---|---|---|
| G1 | **Prove the two-layer loop is fun before spending on art.** | ≥ 6 of 8 playtesters start a slow ingredient before any order requires it, by day 3. (`docs/rush-pivot.md`, test 1.) |
| G2 | **Deliver longevity without retention mechanics.** | A playtester, asked unprompted after finishing, names something they still want to do in the game. Median 3-star completion ≥ 10 h. |
| G3 | **Ship a complete, finishable campaign.** | 30 days, a defined ending, credits, and a post-campaign mode that does not require new content. |
| G4 | **Honour every anti-requirement in §2.3 in the shipped binary.** | Store listing declares no ads and no IAP beyond the single unlock. Binary contains no ad SDK. |
| G5 | **Ship at a price and an art budget that can actually recoup.** | Total art + audio spend ≤ USD 4,900 (§8). Break-even on art ≤ 1,000 sales. |
| G6 | **Ship in English and Arabic, RTL-correct.** | 100% string coverage in both; layout mirrors; no clipped or reversed Arabic glyphs at any supported width. |
| G7 | **Be genuinely good on a five-year-old phone.** | 60 fps sustained on the §9 baseline device; install ≤ 80 MB. |

### 3.2 Non-goals for v1.0

| # | Non-goal | Why, and when it might return |
|---|---|---|
| N1 | **Painted character art and character animation.** | `docs/art-plan.md` prices these at USD 300–900 *each* and calls them the single biggest line after the UI kit. Cut entirely for v1.0; customers are flat head sprites. Revisit only if v1.0 recoups. |
| N2 | **A decoration / café-customisation system.** | The most expensive thing per unit of proven value (`docs/vertical-slice.md`). It is an art pipeline, not a mechanic. Deferred to v2.0. |
| N3 | **Multiple cafés / multiple venues.** | One café, one street. v2.0. |
| N4 | **Cloud save, accounts, cross-device sync.** | Adds a server dependency that conflicts with A9's spirit. v1.1 via first-party iCloud / Play Games Saved Games only. |
| N5 | **Global leaderboards, multiplayer, any social feature.** | A5, A10. |
| N6 | **Landscape or tablet-optimised layout.** | Portrait only. The prototype's 520 px max-width column letterboxes acceptably on tablets. v1.2 at the earliest. |
| N7 | **A branching narrative or dialogue system.** | The story layer in v1.0 is six named regulars with a one-line intro card each. `docs/rush-pivot.md`: story belongs in the calm moments, not in the 90 seconds. |
| N8 | **Steam / Switch / desktop.** | Affects the engine decision (`docs/engine-decision.md`) and is explicitly out. |
| N9 | **Live-ops, seasons, battle passes.** | A7. Permanently out of this product. |
| N10 | **Voice acting.** | Cost with no proven return, and doubles with Arabic localisation. |

---

## 4. Core loop

Three nested loops. Timings are exact and match `prototype/frenzy.html` unless marked
*(new)*.

### 4.1 The moment-to-moment loop — 1 to 6 seconds

1. **t+0.0 s — Read the floor.** 3–6 seats (§7.3), each showing a customer's current dish,
   its ingredient icons, and a patience bar draining in real time. The plate strip sits
   above the machine grid.
2. **t+0.3 s — Start a cook.** Tap `+` on a machine. The machine begins cooking one unit of
   its ingredient into its own bin. Cook time = `base × 0.82^speedLevel`. Base times:
   Ice 0.9 s, Syrup 1.0 s, Date paste 1.4 s *(new)*, Milk 2.0 s, Shot 2.2 s, Tea 2.6 s,
   Pastry 4.0 s, Dough 5.0 s *(new)*. A machine can run 1–4 cooks at once (slots upgrade).
   **The tap is rejected if all the machine's slots are busy, or if `stock + cooking ≥
   bin capacity`.** A rejected tap plays the squash animation and nothing else.
3. **t+0.9 s to t+5.0 s — The cook resolves on its own.** When the timer fills, one unit
   drops into the bin. The player does nothing; this is the background layer.
4. **t+1.5 s — Pull stock onto the plate.** Tap the *body* of a bin (not the `+`) to move
   one unit from its stock to the plate. Plate holds 3 items base, up to 5 with the Counter
   upgrade *(new)*. Rejected if the bin is empty or the plate is full.
5. **t+2.0 s — The plate resolves.** The plate's contents are matched, as an unordered
   multiset, against every unlocked dish recipe. On a match the plate turns green and names
   the dish. If a seated customer is waiting for that exact dish, the plate reads "ready"
   and that seat is outlined green.
6. **t+2.2 s — Serve.** Tap the seat. If that customer has an unfulfilled order matching the
   plated dish, the order is marked done and **the plate is emptied**.
7. **Repeat from 1.** A failed assembly is undone with the scrape button, which empties the
   plate and increments the shift's `scraped` counter.

**The designed pressure:** the plate is a single shared buffer. Committing a shot to the
plate for a latte means it is not available for the espresso that lands one second later.
Committing three wrong items means a scrape. And a full bin blocks the `+`, so starting the
wrong machine costs the slot you needed — this is the constraint `docs/rush-pivot.md`
identifies as the one that is easy to leave out and must not be.

### 4.2 The shift loop — 90 seconds

| Time | What happens |
|---|---|
| **−** | **Intro card.** Day number, target in AED, shift length, seat count, orders per customer, the unlocked menu with each dish's recipe and price (newly unlocked dish highlighted amber), the three star thresholds *(new)*, and — chapters 2–5 — a one-line note on the new verb *(new)*. Player taps **Start shift**. No timer on this screen. |
| **t = 0.0 s** | Shift begins. All bins empty. Plate empty. All seats empty. Clock bar starts draining. |
| **t = 0.8 s** | First customer spawns into a random free seat. |
| **t = 0.8 s → 90 s** | Customers spawn every `spawn × (0.75 + rand×0.5)` seconds into a random free seat. **If every seat is occupied, no customer spawns and no customer is lost** — seats are the throughput cap. Each customer carries 1–3 dishes (§7.2), a patience timer, and a name/colour from the pool. |
| **any t** | A customer whose patience reaches zero **walks out**: the seat clears, `walkouts++`, and the streak resets to 0. |
| **any t** | Serving a customer's *final* dish pays out and clears the seat. Partial service of a multi-dish customer pays nothing yet but preserves their patience timer. |
| **t = 90.0 s** | Shift ends immediately. Customers still seated are neither served nor counted as walkouts. |
| **+** | **Result card.** Taken / Target / Served / Walked out / Scraped / Best streak / stars earned. |

**Payout formula** *(built, unchanged)* — on completing a customer's last dish:

```
pay    = sum of the prices of all that customer's dishes
frac   = remaining patience / starting patience        (0.0 … 1.0)
streak = streak + 1                                    (incremented before the tip)
tip    = pay × (0.10 + 0.40 × frac) × (1 + min(streak, cap) × 0.05)
total  = round(pay + tip)
```

`cap` is 10 base, raised to 15 and 20 by the Loyalty Card upgrade *(new)*. At `frac = 0.7`
and a streak of 10 the payout multiplier is **×1.57** — so speed and an unbroken streak are
worth more than half again the menu price. This is the game's entire reward gradient and it
is the reason patience, not the target, is the real difficulty dial in the late campaign.

### 4.3 The day loop — 3 to 6 minutes

1. **Intro card** → **90-second shift** → **result card**.
2. **If `taken ≥ target`:** the money is **banked** into persistent cash and the player
   advances to the **Upgrade Shop**.
3. **If `taken < target`:** nothing is banked. The result card shows a targeted coaching
   line and a **Try day N again** button that returns straight to the intro card. There is
   no penalty, no cost, no wait, no limit on retries (A1).
4. **Upgrade Shop.** Banked AED is spent on any combination of the 8 upgrade lines (§7.3).
   Purchases apply instantly and permanently. Nothing here is timed, randomised, or
   purchasable with real money (A2, A3, A4).
5. **Open day N+1** → back to 1.

### 4.4 The campaign loop — 4 to 6 hours

30 days in 5 chapters of 6. Each chapter unlocks new dishes, new ingredients, and **a new
verb** (§7.4). Day 6 ends the free chapter and is the paywall (§8). Day 30 ends the
campaign with a closing card and credits, after which every day remains replayable for
stars and Endless Rush remains open forever.

---

## 5. Features

Acceptance criteria are written to be directly testable. Values in `code font` are exact.

---

### F1 — Shift gameplay

> **As a player, I want ninety seconds of overlapping pressure, so that the game tests my
> attention rather than my reaction time.**

**Acceptance criteria**

1. A shift lasts exactly `90.0` simulated seconds and ends the frame `t ≥ 90.0`.
2. The simulation advances on a per-frame delta clamped to `≤ 0.05 s`, so a frame hitch
   cannot skip a cook completion or a walkout.
3. The HUD shows, at all times: day number, AED taken so far, the day's target, and — when
   streak ≥ 2 — the current streak. All numbers use tabular figures.
4. A clock bar drains left-to-right over the 90 s and turns red below 20% remaining.
5. A goal bar fills green to `min(100%, taken / target)`.
6. Backgrounding the app (`visibilitychange` / `NOTIFICATION_APPLICATION_FOCUS_OUT`)
   **pauses the simulation within one frame**. Returning resumes from the same simulated
   time with no elapsed-time catch-up. A player who takes a phone call does not lose a run.
7. An explicit pause control is available during a shift. Pausing shows a menu with Resume,
   Restart Shift and Quit to Café. Restart and Quit both forfeit the run with no penalty.
8. No input during a shift may open a dialog, a store, or any screen the player did not
   explicitly request.
9. Frame rate stays ≥ 58 fps on the §9 baseline device with 6 seats occupied, 8 machines
   with all slots cooking, and 3 simultaneous particle bursts.

---

### F2 — Ingredients and machines

> **As a player, I want machines that cook on their own clocks, so that planning ahead is
> the skill being tested.**

**Acceptance criteria**

1. Eight ingredients exist, each with one machine and one bin. Base cook times are exactly:
   `Ice 0.9`, `Syrup 1.0`, `Date paste 1.4`, `Milk 2.0`, `Shot 2.2`, `Tea 2.6`,
   `Pastry 4.0`, `Dough 5.0` seconds.
2. Effective cook time = `base × 0.82 ^ speedLevel`, `speedLevel ∈ 0…4`. At level 4, Dough
   is `5.0 × 0.82⁴ = 2.26 s` and Ice is `0.41 s`.
3. A machine has `slots ∈ 1…4` concurrent cooks. Each running cook renders its own progress
   bar within the machine tile.
4. Tapping `+` starts one cook. It is **rejected** (no state change, squash animation
   plays) if `runningCooks ≥ slots` **or** `stock + runningCooks ≥ binCapacity`.
5. A cook completes when its elapsed time `≥` effective cook time; one unit is added to that
   bin's stock. Bin stock is capped at `binCapacity` (`3…6`).
6. Bin stock is displayed as discrete pips, one per capacity unit, filled amber. Capacity is
   legible at a glance without counting.
7. A machine whose bin is at capacity renders visibly "full" and its `+` renders disabled.
8. **Ingredient bins unlock implicitly.** A machine is live on day *d* if and only if some
   dish unlocked by day *d* requires it. Locked machines render at 30% opacity with a lock
   glyph and are not focusable.
9. **Hold-to-queue** *(new)*: pressing and holding `+` for `≥ 0.35 s` starts cooks
   repeatedly at `0.18 s` intervals until the machine is full or the press ends. This is a
   tap-cost reduction, not a speed increase; it must not let a player exceed the slot or
   capacity limits in AC 4.
10. All bins start every shift **empty**. Stock does not carry between shifts.

---

### F3 — Dishes and assembly

> **As a player, I want to assemble dishes instantly from stock I already have, so that the
> penalty for bad planning lands before the order does, not during it.**

**Acceptance criteria**

1. Twelve dishes exist. Each has a name, an AED price, an unordered ingredient list of 1–4
   items, and an unlock day. The full table is §6.2 and is data, not code.
2. Tapping a bin's body moves one unit from stock to the plate. Rejected if `stock = 0` or
   `plate is full`.
3. Plate capacity is `3` base, `4` and `5` via the Counter upgrade.
4. After every plate change, the plate's contents are matched **as an unordered multiset**
   against every dish whose unlock day `≤` current day. At most one dish can match.
5. On a match the plate renders solid-green-bordered and displays the dish name.
6. If a match exists **and** at least one seated customer has an unfulfilled order for that
   dish, the plate renders "ready" and every such seat renders with a green outline. If a
   match exists but nobody wants it, the dish name renders dimmed — the player is told they
   have made something nobody ordered, before they try to serve it.
7. A plate holding items that match no dish renders neutral. There is no error state and no
   penalty until the player scrapes.
8. The scrape control empties the plate and increments `scraped` by the number of items
   discarded. It is disabled when the plate is empty.
9. Assembly resolves in the same frame as the tap. There is no assembly animation that
   delays playability; visual travel of the item from bin to plate is decorative and
   non-blocking.
10. Locked dishes (unlock day > current day) never match, even if the player holds their
    exact ingredients.

---

### F4 — Customers, patience and walkouts

> **As a player, I want several customers waiting at once with their own clocks, so that I
> have to decide who to serve first.**

**Acceptance criteria**

1. Customers spawn into a **random free seat**. If no seat is free, no spawn occurs and no
   customer is lost. Seats are the throughput cap.
2. The next spawn is scheduled at `spawn × (0.75 + rand × 0.5)` seconds. The first spawn of
   every shift is at `t = 0.8 s`.
3. A customer carries `1 … maxDishes` dishes, each drawn independently with replacement from
   the day's unlocked pool. `maxDishes` is 1 on days 1–3, 2 on days 4–18, 3 on days 19–30.
4. Starting patience = `basePatience × (1 + chairs × 0.15) × (1 + (totalIngredients − 1) ×
   0.35)`, where `totalIngredients` is summed across all of that customer's dishes. A
   four-ingredient order therefore gets meaningfully longer than a one-ingredient order.
5. The patience bar drains linearly in real time and changes state at 55% (amber) and 25%
   (red). **Each state also changes the bar's fill pattern**, not only its colour (§10).
6. A customer at patience `≤ 0` **walks out**: the seat clears immediately, `walkouts++`,
   and the streak resets to `0`. A "walked out" float rises from the seat.
7. A customer displays: a coloured head sprite, their first initial, the name of their
   *current* dish, that dish's ingredient icons, the patience bar, and — for multi-dish
   orders — an "n of m" counter.
8. Serving a non-final dish marks it done and advances the display to the next dish. It
   does **not** reset or extend the patience timer.
9. Tapping a seat when the plate does not hold a dish that customer wants does nothing: no
   penalty, no animation lock, no state change.
10. Customers seated when the clock expires are discarded silently. They are not walkouts
    and do not affect stars.

---

### F5 — Tipping and streaks

> **As a player, I want serving fast and serving continuously to pay more, so that there is
> a reason to be excellent rather than merely sufficient.**

**Acceptance criteria**

1. Payment occurs only when a customer's **final** dish is served.
2. `pay` = sum of the prices of all that customer's dishes.
3. `frac` = remaining patience ÷ starting patience, clamped to `[0, 1]`.
4. The streak increments **before** the tip is computed.
5. `tip = pay × (0.10 + 0.40 × frac) × (1 + min(streak, cap) × 0.05)`, where `cap` = 10 / 15
   / 20 by Loyalty Card level.
6. `total = round(pay + tip)` and is added to the shift's takings.
7. A rising float shows `+total` at the seat, coloured green when `frac > 0.5`, amber
   otherwise — so the player learns the speed gradient without reading a formula.
8. The streak resets to `0` on any walkout and on no other event. Scraping a plate does not
   break a streak.
9. The streak is displayed only at `≥ 2` and the best streak of the run is shown on the
   result card. The all-time best streak persists in the save.
10. A regular customer (§F13) served at `frac ≥ 0.6` pays `tip × 2`. This is the only
    modifier that stacks multiplicatively on the tip.

---

### F6 — Day targets, fail and retry

> **As a player, I want a target I can just barely miss, and I want to retry it right now
> without being punished.**

**Acceptance criteria**

1. Each day has a target in AED, derived by the formula in §7.1 — never hand-written.
2. The target is shown on the intro card, in the HUD, and as a goal bar during the shift.
3. `taken ≥ target` is a **pass**: the full amount taken is banked to persistent cash, and
   the player proceeds to the Upgrade Shop.
4. `taken < target` is a **fail**: **nothing is banked**, the day does not advance, and no
   upgrade is lost, refunded or reset.
5. A fail may be retried **immediately and without limit**. There is no cost, no cooldown,
   no energy, no ad, and no "skip this level" offer (A1, A4, A6).
6. The fail card shows one targeted coaching line chosen from the run's own statistics:
   - `walkouts > served × 0.3` → the walkout coaching line about keeping bins stocked in
     the quiet moments.
   - `scraped ≥ 6` → a line about the plate being a shared buffer.
   - `peak bin-full rejections ≥ 8` → a line about starting the wrong machine costing the
     slot you needed.
   - otherwise → the default "an empty bin is a customer you cannot serve" line.
7. After **three** consecutive fails on the same day, the card additionally offers
   **Relaxed Timing** (§F11) as a one-tap toggle, described as an accessibility setting and
   never as a purchase, a boost, or a consumable.
8. The pass/fail evaluation uses the exact integer AED taken. There is no rounding in the
   player's favour and no "so close!" grace band.

---

### F7 — The upgrade shop

> **As a player, I want permanent, instant improvements that I have to choose between, so
> that my café is the result of my decisions.**

**Acceptance criteria**

1. The shop appears after every passed day and shows current banked cash at the top.
2. Eight upgrade lines exist, priced exactly as §7.3. Every purchase is **instant and
   permanent**. No build time, no cooldown (A2).
3. Upgrade rows for ingredients are shown only for ingredients unlocked by the current day.
4. A row shows an icon, the line name, a **concrete before → after description** using real
   numbers (`"2.2s → 1.8s"`, `"3 seats → 4 seats"`), and the cost. Never a vague adjective.
5. A row the player cannot afford renders its cost dimmed and disabled. A maxed line renders
   `MAX` in green.
6. Purchasing deducts cash, applies the effect, saves, and re-renders the shop in place —
   the player never leaves the screen to buy.
7. Nothing in this screen may be bought with real money, gems, or any currency other than
   AED earned by playing (A3).
8. There is no randomness: no loot boxes, no gacha, no "mystery upgrade" (A3, A4).
9. No upgrade is ever removed, expired, rented, or rebalanced downward in a live update.
10. The shop has a **Start over** control that resets all progress, behind a two-step
    confirmation naming exactly what will be lost.
11. **A single campaign cannot buy the whole tree.** A player clearing all 30 days at 115%
    of target banks ≈ 28,300 AED against a tree costing 44,760 AED (§7.3). Verified by
    automated playthrough before release.

---

### F8 — Endless Rush

> **As a player, I want a mode with no ending, so that finishing the campaign is not the
> end of the game.**

**Acceptance criteria**

1. Endless Rush unlocks permanently on completing **day 6** and is reachable from the café
   screen at any time thereafter.
2. There is no target and no closing time. Difficulty steps every `25` seconds into the next
   wave.
3. Wave *w* parameters: `spawn = max(0.9, 3.0 − (w−1) × 0.22)`,
   `maxDishes = 1` for `w < 4` else `2` (and `3` from `w ≥ 12` *(new)*),
   `basePatience = max(7.0, 18 − (w−1) × 0.9)`.
4. The run ends when **3 customers have walked out**. Remaining lives are shown as the goal
   bar, which turns red at one life.
5. The full menu and all owned upgrades are active in Endless regardless of campaign day.
6. **All AED taken in an Endless run is banked, win or lose.** An Endless run is never
   wasted, and the result card says so. This is the anti-grind guarantee: the mode is a
   legitimate route to funding upgrades, not a side attraction.
7. The personal best is stored as `{ AED, wave reached }` and shown on the café screen and
   on the result card. Beating it shows "New best".
8. The best is stored **separately per assist mode** (standard / relaxed). A relaxed best is
   labelled as such and never overwrites a standard best.
9. There is no global leaderboard and no social sharing prompt (A5, A10).
10. Endless is behind the paywall (§8); the free build shows it as a locked entry with a
    plain description of what it is.

---

### F9 — Save and persistence

> **As a player, I want to put the game down for two months and find it exactly where I
> left it.**

**Acceptance criteria**

1. The save is a single versioned JSON document in the platform's app-private storage.
2. It persists: current day, banked cash, seats, chairs, bin capacity, plate capacity, every
   ingredient's speed and slot levels, loyalty/signboard levels, purchase state, per-day
   star records, best streak, best Endless result per mode, settings, locale, tutorial-seen
   flags, and a schema version.
3. The game saves after **every** state change that costs the player something: shift pass,
   upgrade purchase, day advance, settings change, star record improvement. Never only on
   quit.
4. Writes are **atomic**: write to a temp file, fsync, rename. A kill mid-write can never
   produce a corrupt save.
5. One rolling backup of the previous good save is kept. On a parse failure the game loads
   the backup and tells the player it did so.
6. On an unrecoverable failure the game starts a new save and **tells the player plainly**,
   rather than silently presenting an empty café.
7. Loading a save from an older schema version migrates forward. Loading a newer one refuses
   and keeps the file untouched.
8. Progress never depends on a network call (A9).
9. Deleting and reinstalling loses local progress in v1.0; this is stated in the settings
   screen. Cloud backup lands in v1.1 (§12).
10. The entitlement (§8) is restored from the platform receipt, not from the save file, so a
    reinstall never re-charges the player.

---

### F10 — Settings

> **As a player, I want to control how the game sounds, feels and reads, without hunting.**

**Acceptance criteria**

1. Settings are reachable from the café screen and from the in-shift pause menu.
2. Provides: Music volume (0–100), SFX volume (0–100), Haptics (off / light / full),
   Screen shake (off / reduced / full), Reduced motion (on/off), Language (English /
   العربية / follow system), Numerals (Western / Eastern Arabic), Colour-blind mode
   (off / deuteranopia / protanopia / tritanopia), High contrast (on/off),
   Left-handed layout (on/off), Relaxed Timing (on/off), Larger text (on/off),
   Analytics (opt-in, **default off**), Restore purchase, Credits, Privacy policy,
   Start over.
3. Every setting applies immediately and persists. No setting requires a restart.
4. No setting is purchasable, gated, or presented as a reward.
5. Setting music and SFX to 0 fully releases the audio device; the game never holds an audio
   session it is not using.
6. **Start over** requires a two-step confirmation that names exactly what is destroyed, and
   never destroys the purchase entitlement.

---

### F11 — Accessibility

> **As a player with a motor, visual or cognitive difference, I want to play the whole game,
> not a reduced version of it.**

**Acceptance criteria**

1. **Relaxed Timing** multiplies every customer's starting patience by `1.5` and extends the
   shift to `120 s`, with targets scaled by the same 120/90 ratio so the *rate* required is
   unchanged. It is free, always available, and **earns full progression and all three
   stars** (A4 corollary). Records set in Relaxed are labelled.
2. Every interactive target is `≥ 48 × 48` density-independent pixels, with `≥ 8 dp`
   between adjacent targets.
3. No information is conveyed by colour alone. Patience uses colour **and** a fill pattern
   (solid → hatched → cross-hatched). The "ready" plate uses colour **and** a border weight
   change **and** the dish name. Bin pips use fill **and** count.
4. Three colour-blind palettes are selectable and applied to every game-state colour.
5. A high-contrast mode raises all text and border contrast to WCAG AA (4.5:1 body,
   3:1 large) against its background.
6. Reduced motion removes all non-essential animation — floats, squash-and-stretch,
   particles, screen shake — while preserving every state change as a static visual
   difference. The prototype already honours `prefers-reduced-motion`; the shipped game
   honours the OS setting **and** an in-game override.
7. Larger text scales all UI text by `1.25×` without clipping or overlap at the narrowest
   supported width.
8. Left-handed layout mirrors the machine grid and plate controls horizontally.
9. Every screen outside the 90-second shift is fully navigable by the platform screen reader
   (VoiceOver / TalkBack) with meaningful labels. In-shift screen-reader support is **not**
   claimed for v1.0 and this is stated honestly in the store listing rather than faked.
10. No flashing content exceeds 3 flashes per second.
11. Haptics can be fully disabled and are never the sole feedback for any event.

---

### F12 — Onboarding and tutorial

> **As a new player, I want to understand the two-layer idea in under a minute, and then be
> left alone.**

**Acceptance criteria**

1. First launch shows the day 1 intro card with a **How it works** panel stating, in three
   short paragraphs: `+` starts a cook that resolves in the background; tap a bin to plate
   an item and a green plate means a dish; **assembly is instant, cooking is not — keep bins
   stocked before the orders land.**
2. Day 1 runs on **two dishes and three machines** so the first shift cannot be confusing.
3. During day 1 only, three contextual coach marks appear, each dismissed by performing the
   action, each timing out after 6 s: (a) on the first `+`, (b) on the first full bin,
   (c) on the first green plate.
4. No coach mark blocks input or pauses the shift. The player can ignore the tutorial and
   still pass day 1.
5. The tutorial never repeats after day 1 unless the player re-runs it from Settings.
6. Each chapter's new verb (§7.4) is introduced on that chapter's first intro card in **one
   sentence**, plus a single in-shift coach mark on first occurrence.
7. There is no forced tutorial level, no "tap here" hand-holding through a scripted sequence,
   and no un-skippable cutscene.
8. The intro card always lists every unlocked dish with its full recipe and price, so the
   player never has to memorise anything (this is the recall-burden lesson from
   `docs/vertical-slice.md`, applied to a rush game).

---

### F13 — Regulars *(new, Chapter 2 verb)*

> **As a player, I want a few customers I recognise, so that the street feels like a place.**

**Acceptance criteria**

1. Six named regulars exist, each with a fixed name, head sprite, colour, one preferred
   dish, and three one-line story beats.
2. From day 7, a regular may spawn in place of a generic customer at a `20%` chance per
   spawn, at most one instance of each regular seated at once.
3. A regular always orders their preferred dish as their first dish.
4. Serving a regular at `frac ≥ 0.6` doubles the tip (F5 AC10) and shows a distinct float.
5. A regular's story beat advances on their 3rd, 6th and 10th satisfied service, cumulative
   across the campaign.
6. Beats are shown **only on the intro card or the shop screen** — never during the
   90 seconds (`docs/rush-pivot.md`).
7. Regulars are cosmetic-plus-tip. No regular's story gates progression, and missing one
   costs nothing permanent (A7).
8. Regular progress persists in the save and is shown on a simple "the street" list screen.

---

### F14 — Star ratings *(new)*

> **As a player who has finished the campaign, I want a reason to play day 12 again.**

**Acceptance criteria**

1. Every campaign day awards 0–3 stars, stored as the **best ever achieved** for that day.
2. Thresholds, all three shown on the intro card before the shift:
   - **1 star** — `taken ≥ target`.
   - **2 stars** — `taken ≥ ceiling × (share + 0.08)` **and** `walkouts ≤ 1`.
   - **3 stars** — `taken ≥ ceiling × (share + 0.15)` **and** `walkouts = 0`.
   (`ceiling` and `share` are the §7.1 quantities, so star bars scale with the same honest
   model as the target.)
3. Stars are visible per day on a campaign map screen and summed in a 0–90 total.
4. Any completed day is replayable from the map at any time, with the player's *current*
   upgrades. Replaying can only improve a star record, never reduce it.
5. Stars unlock nothing and buy nothing. They are a record, not a currency (A3).
6. Star totals of 30, 60 and 90 each show a one-off congratulation card and nothing else.

---

## 6. Content inventory for v1.0

### 6.1 Ingredients — 8

Six are built; two are new. Cook time is the design's primary difficulty texture: the
spread from 0.9 s to 5.0 s is what makes pre-cooking a skill.

| # | Ingredient | Icon | Base cook | Status | Role |
|---|---|---|---|---|---|
| 1 | Ice | 🧊 | 0.9 s | built | Cheap filler; near-free to hold |
| 2 | Syrup | 🍯 | 1.0 s | built | Cheap filler |
| 3 | Date paste | 🌴 | 1.4 s | **new** | Mid-cheap; the local flavour note |
| 4 | Milk | 🥛 | 2.0 s | built | The workhorse — appears in 6 of 12 dishes |
| 5 | Shot | ☕ | 2.2 s | built | The workhorse |
| 6 | Tea | 🫖 | 2.6 s | built | Slow-ish |
| 7 | Pastry | 🥐 | 4.0 s | built | Slow — the chapter-1 planning lesson |
| 8 | Dough | 🫓 | 5.0 s | **new** | Slowest in the game — the chapter-2 planning lesson |

**Cut:** every other ingredient. Eight machines is already the practical limit of a 3-column
portrait grid at a 48 dp touch target, and each additional sprite costs USD 25–80
(`docs/art-plan.md`).

### 6.2 Dishes — 12

Six are built; six are new. Prices are chosen for **AED-per-tap**, not flavour: a dish costs
`2 × ingredients + 1` taps to deliver, and the late campaign is tap-bound (§7.1).

| # | Dish | Price | Recipe | Taps | AED/tap | Unlock | Status |
|---|---|---|---|---|---|---|---|
| 1 | Espresso | 12 | Shot | 3 | 4.00 | Day 1 | built |
| 2 | Mint tea | 10 | Tea + Syrup | 5 | 2.00 | Day 1 | built |
| 3 | Latte | 20 | Shot + Milk | 5 | 4.00 | Day 2 | built |
| 4 | Karak chai | 16 | Tea + Milk + Syrup | 7 | 2.29 | Day 3 | built |
| 5 | Almond croissant | 18 | Pastry + Syrup | 5 | 3.60 | Day 4 | built |
| 6 | Iced latte | 26 | Shot + Milk + Ice | 7 | 3.71 | Day 5 | built |
| 7 | Date shake | 24 | Milk + Date paste + Ice | 7 | 3.43 | Day 7 | **new** |
| 8 | Luqaimat | 22 | Dough + Syrup | 5 | 4.40 | Day 9 | **new** |
| 9 | Regag roll | 26 | Dough + Date paste | 5 | 5.20 | Day 11 | **new** |
| 10 | Saffron karak | 34 | Tea + Milk + Syrup + Date paste | 9 | 3.78 | Day 14 | **new** |
| 11 | Affogato | 30 | Shot + Date paste + Ice | 7 | 4.29 | Day 17 | **new** |
| 12 | Cardamom cortado | 30 | Shot + Milk + Syrup | 7 | 4.29 | Day 21 | **new** |

Note the deliberate shape: **Mint tea (2.00 AED/tap) is the worst dish in the game and stays
on the menu forever.** Late-campaign skill includes recognising that a mint tea order is
worth less than the eight seconds it costs, and sometimes letting one walk. That is a
decision, which is what §4 exists to create.

**Cut:** food-as-a-meal (sandwiches, breakfast plates), any dish requiring a new machine, and
any dish with a 5+ ingredient recipe (the plate caps at 5 and a 5-item recipe would leave no
buffer).

### 6.3 Days — 30, in 5 chapters of 6

| Chapter | Days | Name | Unlocks | New verb |
|---|---|---|---|---|
| 1 | 1–6 | Opening the shutters | Dishes 1–6, machines 1–6 | — (the base loop) **← free build ends here** |
| 2 | 7–12 | Regulars | Date paste, Dough, dishes 7–9 | **Regulars** (F13) |
| 3 | 13–18 | Freshness | Dishes 10–11 | **Spoilage** (§7.4) |
| 4 | 19–24 | Second thoughts | 3-dish orders | **Mind-changers** (§7.4) |
| 5 | 25–30 | The street at its busiest | Dish 12 | **Breakdowns** (§7.4) |

**Cut:** any day count above 30. The honest ceiling model (§7.1) stops producing meaningfully
harder *targets* around day 21; days 21–30 get harder through patience and verbs instead.
Beyond day 30 the design has nothing new to say, and padding it would reproduce exactly the
"finished pretty fast, then repetitive" failure we are trying to avoid. Length past day 30
comes from stars and Endless, not from more days.

### 6.4 Upgrade lines — 8

Full costs in §7.3. Lines: Machine speed (per ingredient), Machine slots (per ingredient),
Seats, Comfier chairs, Bigger bins, **Longer counter** *(new)*, **Signboard** *(new)*,
**Loyalty card** *(new)*.

**Cut:** any upgrade that adds a new machine type, any cosmetic-only upgrade (that is the
decoration system, N2), and any upgrade with a random outcome.

### 6.5 Customers — 24 names × 12 colours, plus 6 regulars

| Item | v1.0 count | Notes |
|---|---|---|
| Generic first names | **24** | Extends the 12 in the prototype: Rami, Noor, Dana, Samir, Aisha, Khalid, Mona, Yusuf, Salma, Tarek, Hana, Omar + 12 more, reviewed by a native Emirati/Levantine speaker for plausibility on a Dubai shopping street. |
| Head/avatar colours | **12** | Extends the 8 hues in the prototype. |
| Generic visual variations | **288** | 24 × 12. Enough that repeats within one 90-second shift are rare. |
| Head sprites | **12** | Flat, non-animated, style-consistent. Paired with the 24 names arbitrarily. |
| Named regulars | **6** | Fixed name + sprite + colour + preferred dish + 3 story beats = 18 lines of writing total. |

**Cut:** painted characters with idle and reaction animations (N1 — the largest single art
line in `docs/art-plan.md` after the UI kit), per-customer dialogue, customer portraits,
customer moods beyond the patience bar.

### 6.6 Audio — 32 assets

24 SFX (tap, cook start, cook complete, plate add, plate match, serve, payout, walkout,
scrape, bin full, streak tiers ×3, upgrade purchase, day pass, day fail, wave up, life lost,
UI ×5) + 2 music loops (café, rush) + 4 stingers. **Library-licensed**, per the
USD 50–200 line in `docs/art-plan.md`. `docs/art-plan.md` calls sound "the single highest
return per unit of effort" — it is in scope and it is cheap.

### 6.7 Summary of what is cut from v1.0

Painted/animated characters · decoration and café customisation · a second venue · dialogue
system · cloud save · leaderboards · landscape/tablet layout · any dish or ingredient beyond
the tables above · any day beyond 30 · voice acting · desktop or console.

---

## 7. Progression and economy

### 7.1 How targets scale — and the finding that changes the formula

The prototype derives targets rather than hand-drawing them, which is correct
(`docs/rush-pivot.md`). It computes a ceiling of what a day can physically produce and asks
for a rising share of it:

```
ceiling = (90 / spawn) × ((1 + maxDishes) / 2) × avgPrice × 1.5
target  = round10( ceiling × share )
```

**Finding (verified by calculation against `frenzy.html`, and the single most important
number in this document): that ceiling is not physically reachable past about day 7,
because it ignores how fast a human can tap.**

Delivering a dish costs `2 × ingredients + 1` taps (a `+` and a bin-tap per ingredient, plus
a serve). Across the six prototype dishes the mean is **3.27 AED per tap** before tips, and
tips average roughly ×1.35. At a *generous* sustained **3.0 taps per second for 90 seconds**:

| Sustained tap rate | Taps in a shift | Realistic max takings |
|---|---|---|
| 2.5 /s | 225 | ≈ 990 AED |
| **3.0 /s** | **270** | **≈ 1,190 AED** |
| 3.5 /s | 315 | ≈ 1,390 AED |
| 4.0 /s | 360 | ≈ 1,590 AED |

The prototype's day 7 target is **1,140** — right at that wall. Its day 8 (1,260), day 9
(1,420) and day 10 (1,630) targets are **above what a human can physically produce**, and
from day 11 the formula flattens entirely (spawn floors at 1.5 s, patience at 11 s, share
caps at 0.72, average price stops rising at day 5) — so every day from 11 onward is day 10
repeated. The prototype is honest for seven days and then is not. Both facts had to be fixed
before a 30-day campaign could be specified.

**v1.0 formula** — add a second ceiling and take the lower:

```
TAPS_PER_SEC = 3.0            # conservative; validated in playtest (§13 R2)
TIP_MULT     = 1.35

spawn(d)        = max(1.40, 3.50 − (d−1) × 0.11)
maxDishes(d)    = 1 if d < 4 ; 2 if d < 19 ; else 3
basePatience(d) = max(10.0, 20.0 − (d−1) × 0.35)
share(d)        = min(0.74, 0.50 + (d−1) × 0.012)

avgPrice(d)     = mean price of dishes unlocked by day d
avgPerTap(d)    = mean of price / (2 × ingredients + 1) over those dishes

ceilingSpawn(d) = (90 / spawn) × ((1 + maxDishes) / 2) × avgPrice × 1.5
ceilingTap(d)   = TAPS_PER_SEC × 90 × avgPerTap × TIP_MULT
ceiling(d)      = min(ceilingSpawn, ceilingTap)
target(d)       = round10( ceiling × share )
```

Resulting curve (computed, not estimated):

| Day | Target | Spawn | Max dishes | Patience | Share | Binding limit |
|---|---|---|---|---|---|---|
| 1 | 210 | 3.50 | 1 | 20.0 | 0.500 | spawn |
| 2 | 290 | 3.39 | 1 | 19.6 | 0.512 | spawn |
| 3 | 310 | 3.28 | 1 | 19.3 | 0.524 | spawn |
| 4 | 520 | 3.17 | 2 | 18.9 | 0.536 | spawn |
| 5 | 620 | 3.06 | 2 | 18.6 | 0.548 | spawn |
| **6** | **650** | 2.95 | 2 | 18.3 | 0.560 | spawn | **← free build ends** |
| 7 | 690 | 2.84 | 2 | 17.9 | 0.572 | **tap** |
| 9 | 740 | 2.62 | 2 | 17.2 | 0.596 | tap |
| 12 | 840 | 2.29 | 2 | 16.1 | 0.632 | tap |
| 15 | 890 | 1.96 | 2 | 15.1 | 0.668 | tap |
| 18 | 950 | 1.63 | 2 | 14.1 | 0.704 | tap |
| 21 | 1,010 | 1.40 | 3 | 13.0 | 0.740 | tap |
| 24 | 1,010 | 1.40 | 3 | 12.0 | 0.740 | tap |
| 27 | 1,010 | 1.40 | 3 | 10.9 | 0.740 | tap |
| 30 | 1,010 | 1.40 | 3 | 10.0 | 0.740 | tap |

Sum of all 30 targets: **24,590 AED**.

**Read the last ten rows carefully, because they are a deliberate design decision.** From
day 21 the money target stops rising at 1,010 AED, because that is 74% of what a human can
physically produce and pushing further would make the game a test of finger speed. Days
21–30 get harder anyway: **patience falls from 13.0 s to 10.0 s** while the target holds,
and chapters 4 and 5 add verbs. The player is asked for the same money with progressively
less slack, against progressively weirder conditions. That is the difference between
difficulty and punishment, and it is the answer to `docs/rush-pivot.md`'s question about day
six feeling like day two with a faster clock.

*(Assumption, flagged: `TAPS_PER_SEC = 3.0` is an engineering estimate, not a measurement.
§11 instruments actual tap rate, and §13 R2 commits to re-deriving the whole curve from real
data before release. Every number in the table above is one constant away from being
re-generated.)*

### 7.2 Endless Rush scaling

Unchanged from the prototype except the 3-dish step. Waves last 25 s; the run ends at 3
walkouts.

| Wave | Starts at | Spawn | Max dishes | Patience |
|---|---|---|---|---|
| 1 | 0:00 | 3.00 | 1 | 18.0 |
| 4 | 1:15 | 2.34 | 2 | 15.3 |
| 8 | 2:55 | 1.46 | 2 | 11.7 |
| 11 | 4:10 | 0.90 (floor) | 2 | 9.0 |
| 12 | 4:35 | 0.90 | **3** | 8.1 |
| 14 | 5:25 | 0.90 | 3 | 7.0 (floor) |
| 15+ | 5:50+ | 0.90 | 3 | 7.0 |

From wave 15 nothing gets harder, because nothing needs to: with 7.0 s of patience and a
customer every 0.9 s, the wall is patience falling below the time an order takes to cook,
exactly as the prototype README describes. A run reaching wave 15 is already an outlier.
**Assumption:** a good player tops out around wave 12–16 (5–7 minutes). Validate in playtest.

### 7.3 Upgrade costs

Early costs are carried over unchanged from the prototype so its playtested early-game
tuning survives. Later tiers are new.

| Line | Levels | Costs (AED) | Effect per level | Line total | × instances | Total |
|---|---|---|---|---|---|---|
| Machine speed | 4 | 90 / 180 / 320 / 620 / 1,240 → **5 steps** | cook time × 0.82 | 2,450 | 8 ingredients | **19,600** |
| Machine slots | 3 | 150 / 300 / 600 | +1 concurrent cook (1→4) | 1,050 | 8 ingredients | **8,400** |
| Seats | 3 | 260 / 520 / 1,040 | +1 seat (3→6) | — | 1 | **1,820** |
| Comfier chairs | 3 | 220 / 440 / 880 | +15% patience each (max +45%) | — | 1 | **1,540** |
| Bigger bins | 3 | 200 / 400 / 800 | +1 stock per bin (3→6) | — | 1 | **1,400** |
| Longer counter *(new)* | 2 | 900 / 2,400 | +1 plate slot (3→5) | — | 1 | **3,300** |
| Signboard *(new)* | 3 | 700 / 1,400 / 2,800 | spawn interval × 0.92 (more customers, more pressure) | — | 1 | **4,900** |
| Loyalty card *(new)* | 2 | 1,200 / 2,600 | streak tip cap 10 → 15 → 20 | — | 1 | **3,800** |
| | | | | | **Tree total** | **44,760** |

**Scaling rule:** within a line, each step is `≈ 2×` the previous. Across lines, cost is
proportional to how much of the tap budget the upgrade saves — Signboard and Loyalty Card
raise the earnings ceiling itself and are priced accordingly.

**The economy is deliberately unsolvable in one pass.** A player clearing all 30 days at 115%
of target banks ≈ **28,300 AED** against a **44,760 AED** tree — about **63%**. Two players
finishing the campaign will have measurably different cafés. That is the Kairosoft route from
`docs/target-player.md`: replay value from optimisation rather than from new assets.

**Non-obvious trade-offs the costs are tuned to create** — these are the "deep interlocking
systems" the longevity argument rests on, and each must be verified to be a real dilemma in
playtest:

- **Signboard vs. Chairs.** Signboard raises throughput and therefore income; Chairs raise
  patience and therefore the tip fraction. Buying Signboard without Chairs raises income and
  walkout risk together.
- **Speed vs. Slots.** Speed lowers latency (better for reacting); Slots raise throughput
  (better for stockpiling). A Dough-speed build and a Dough-slots build play differently.
- **Bins vs. Counter.** Bigger bins let you stockpile before a rush; a longer counter lets
  you pre-assemble across dishes. Both cost taps to exploit.
- **Loyalty card is worthless without zero walkouts,** so it is a build that commits you to a
  defensive playstyle — and it is the only route to 3-starring the late days.

### 7.4 The new verbs (the anti-sameness mechanism)

`docs/rush-pivot.md`: *"Frenzy games die of sameness, not difficulty. If day six feels like
day two with bigger numbers, the answer is a new verb, not a faster clock."* Each verb is
code and data only — **zero additional art cost** — which is why longevity is delivered this
way rather than by authoring more days.

| Chapter | Verb | Specification | What it invalidates |
|---|---|---|---|
| 2 (d7) | **Regulars** | F13. 20% spawn chance, fixed preferred dish, ×2 tip at `frac ≥ 0.6`. | "serve whoever is reddest" — now some seats are worth more |
| 3 (d13) | **Spoilage** | Each unit of *fresh* stock (Shot, Milk, Tea, Ice) carries an 18 s freshness timer. On expiry the unit is removed and `scraped++`. Dry goods (Syrup, Pastry, Date paste, Dough) never spoil. Pips within 4 s of expiry render hollow. | **Stockpile-everything, the current dominant strategy.** Forces stock to be *timed*, not merely held |
| 4 (d19) | **Mind-changers** | 20% of customers swap one unfulfilled dish for a different unlocked dish, once, at 50% patience, with a 1.5 s telegraph. The old dish, if already plated, is now wrong. | "plan the whole shift at t=0" |
| 5 (d25) | **Breakdowns** | Once per shift, telegraphed 10 s ahead, two random machines go out of order for 20 s. Orders continue and may need them. | "react to orders" — you must buffer *before* the window |

All four verbs are **also active in Endless Rush** from wave 4, 7, 10 and 13 respectively, so
Endless is a compressed replay of the whole campaign's vocabulary and not just a fast day 6.

### 7.5 Session length and time to complete

| Measure | Value | Basis |
|---|---|---|
| Shortest meaningful session | **~2 min** | One intro card + one 90 s shift + one result card. The game is designed so a single shift is a complete unit — a bus stop is enough. |
| Typical session | **12–20 min** | 3–6 shifts including retries and shop time. |
| Mean attempts per day | **~1.8** | Assumption; instrumented by §11 `day_attempts`. |
| First campaign clear | **4–6 hours** | 30 days × 1.8 attempts × 90 s = ~81 min of shift time, plus ~100% overhead for intro/result/shop/browsing, plus learning time. |
| All 90 stars | **10–15 hours** | ~60 additional targeted replays plus build experimentation. |
| Endless Rush | **Unbounded** | Personal-best chasing. |
| **Total designed content** | **≥ 15 hours before the endless mode is the only thing left** | |

For comparison the current 7-day prototype is roughly 25 minutes of content. The
`docs/vertical-slice.md` build was similar. **Neither was a credible answer to "lasts a
while"; 15 hours plus an endless mode is.**

### 7.6 How LONGEVITY is delivered without retention mechanics

The requirement and the anti-requirements are in direct tension: longevity normally comes
from daily rewards, energy, events and FOMO, all of which are banned by §2.3.
`docs/target-player.md` names the four routes that remain. v1.0 takes all four, weighted by
cost per hour of play delivered:

| Route (from `docs/target-player.md`) | How v1.0 uses it | Hours delivered | Cost |
|---|---|---|---|
| **1. Systems that outlive their content** *(primary)* | An upgrade tree a single campaign can only buy 63% of, with four genuine build trade-offs (§7.3), plus a star system that rewards optimising an *already-cleared* day with a *different* build. | ~8 h | Code + a spreadsheet |
| **2. An endless mode** *(primary)* | F8, with all four verbs phased in, banked earnings so a run is never wasted, and per-mode personal bests. | Unbounded | Already built |
| **3. Many short, differently-constrained levels** *(secondary)* | 30 days rather than 7, with chapter-specific constraints. Deliberately **not** pushed further — this is the expensive route per unit of value, and it is what expansion packs are for (§12). | ~5 h | Data authoring |
| **4. New verbs, not bigger numbers** *(primary)* | Four verbs across chapters 2–5 (§7.4), each invalidating a strategy the player had settled into. | Multiplies 1 and 3 | Code only |

**The explicit anti-FOMO guarantee, which appears in the store listing and in Settings:**

> Nothing in Café Rush expires. There is no daily reward, no streak to keep, no event you
> can miss and no notification asking you to come back. Everything the game contains is
> available to you on the day you buy it and on any day after that. Play it for four hours
> this week and none next month; it will be exactly where you left it.

---

## 8. Monetisation

### 8.1 The call

**Café Rush is a free download containing the complete first chapter, with a single
non-consumable in-app purchase — "Café Rush — the whole café" — at AED 24.99 / USD 6.99 that
unlocks everything permanently. There is no other purchase, no currency, no subscription and
no advertising of any kind, ever.**

### 8.2 Why this model and not the alternatives

| Model | Verdict | Reasoning |
|---|---|---|
| Free-to-play with energy/gems | **Forbidden** | A1, A3, A4. This is the model the target player wrote the post to complain about. It is also the only model that pays for the reference screenshot's art (`docs/art-plan.md`), which is precisely why we are not building that art. |
| Free with rewarded ads | **Forbidden** | A6. The player's willingness to pay is explicitly *in exchange for* no ads. |
| Paid up front at AED 29.99–39.99 | **Rejected** | `docs/target-player.md` is explicit: that is USD 8–11, "above what this specific reference player signalled, and against a different mental model." |
| Paid up front at AED 24.99 | **Rejected, narrowly** | The price is right; the *shape* is wrong. A paid-only listing from an unknown solo developer gives a prospective buyer no way to find out whether the two-layer loop clicks for them, and the loop is unusual enough that a screenshot cannot explain it. |
| **Free chapter + one unlock at AED 24.99** | **Chosen** | Matches both the price signal and the mental model in the source — "don't mind paying a few bucks to avoid ads" frames the purchase as *removing something from a free game*. It lets the loop sell itself. It satisfies every anti-requirement. And it is the only model where a player can verify the no-ads promise before paying for it. |

**On the price specifically.** `docs/target-player.md` puts the stated signal at USD 3–7
(AED 11–26) and immediately qualifies it: the top-comment Kairosoft buyer "shows the
audience pays more than 'a few bucks' when the value is legible", but "the price should be
tested as its own question rather than assumed from the post." AED 24.99 (≈ USD 6.80) is at
the **top of the stated band and below the previous plan**, which is the defensible place to
start. It is a launch price, not a permanent one — §13 Q1 commits to testing it.

### 8.3 What is free and what is paid

| | Free | Paid (AED 24.99) |
|---|---|---|
| Campaign days | **1–6** (Chapter 1) | 7–30 |
| Dishes | 6 of 12 | all 12 |
| Ingredients | 6 of 8 | all 8 |
| Upgrade lines | Speed, Slots, Seats, Chairs, Bins (capped at the levels day 6 can afford) | all 8, all levels |
| Endless Rush | locked (visible, described) | **unlocked** |
| Star ratings | days 1–6 (18 stars) | all 90 |
| Regulars, spoilage, mind-changers, breakdowns | — | all |
| Ads | none | none |
| Other purchases | none | none |
| Settings, accessibility, both languages | **all of it** | all of it |

**Free is ~30 minutes of play — the same size as the entire current prototype.** It is a
complete, satisfying, winnable chapter with a proper ending card, not a crippled demo.

### 8.4 Where the paywall sits, and why exactly there

**At the end of day 6, on the result card of a *passed* day.**

`docs/vertical-slice.md` argues the wall should be "at a moment someone actually wants to pay
past", not an arbitrary day count. Day 6 is that moment for three reasons:

1. It is the last day of the base loop. Day 7 introduces **two new machines, three new
   dishes, and the first new verb** — so the offer is legibly "there is more game", not "more
   of the same game".
2. It is where **Endless Rush** unlocks. The single most compelling thing we can put behind
   the wall is the mode with no ending, for a player whose complaint was that games end.
3. By day 6 the player has bought upgrades, formed a build, and has banked cash they cannot
   yet spend — an unspent balance is a much better motivator than a locked door.

**Paywall conduct rules, binding on implementation:**

- The paywall screen appears **exactly once per session**, on the day-6 result card, and is
  dismissible with a clearly-labelled full-size button.
- After dismissal, the purchase lives in one permanent, non-blinking "Unlock the full café"
  row on the café screen. No pop-ups, no interstitials, no badge counts, no nagging.
- The screen states the price, states that it is a one-time purchase, and states — in the
  same type size as the price — that there are no ads, no other purchases, no subscription
  and no currency.
- Free players keep every day-1–6 star and every upgrade. Purchasing continues the same save;
  it never restarts anything.
- **Restore Purchases** is in Settings, always, on both platforms.
- No discount countdowns, no "offer expires" timers, no launch-week urgency (A7).

### 8.5 The art-budget arithmetic

`docs/art-plan.md` states the problem plainly: at AED 30 with a 30% store cut you net about
AED 21, so a AED 40,000 art budget needs **~1,900 sales to pay for the art alone** — before
time, marketing or engine. Its recommendation is route 1 (match the art to premium
economics) or route 3 (stage it). **We take route 1, and we take it seriously enough to cut
the two most expensive line items.**

At AED 24.99 the net after a 30% store cut is **AED 17.49** (**AED 20.82** on Apple's Small
Business Program / Google's first-USD-1M 15% tier, which a first title qualifies for — we
plan on the conservative 30% figure).

**v1.0 art and audio budget — capped at USD 4,900:**

| Line | Count | Unit (USD, from `docs/art-plan.md`) | Total |
|---|---|---|---|
| Ingredient sprites | 8 | 50 | 400 |
| Dish sprites | 12 | 50 | 600 |
| Machine / bin sprites + states | 8 | 60 | 480 |
| Customer head sprites (flat, unanimated) | 12 | 45 | 540 |
| Café background (one room) | 1 | 500 | 500 |
| UI kit (buttons, panels, bars, icons, coin/star) | 1 | 1,500 | 1,500 |
| SFX library licence + 2 music loops | 1 | 400 | 400 |
| Contingency (15%) | | | 660 |
| **Total** | | | **≈ USD 4,880 ≈ AED 17,930** |

**Break-even on art: ≈ 1,025 sales** at the conservative net, ≈ 860 at the small-business
rate. Against `docs/art-plan.md`'s 1,900-sale figure for a *slice* at the reference quality,
that is a materially different business.

**What made it different — the two cuts:**

1. **No painted characters, no character animation.** `docs/art-plan.md` prices these at
   USD 300–900 *each* with animation sets. Cutting both characters saves USD 600–1,800 and,
   more importantly, removes the largest source of style drift. Customers are flat head
   sprites on the seat cards the prototype already has.
2. **The UI kit is the single largest remaining line and it is not cut — it is constrained.**
   `docs/art-plan.md`: *"it is invisible until you try to make one, and it is often the
   largest single cost."* The grey-box UI in `frenzy.html` is already a complete, shipped
   layout: HUD, bars, seat cards, plate strip, machine grid, shop rows, result cards. The
   brief to the artist is therefore *re-skin this exact component set*, not *design a UI* —
   which is the difference between USD 1,500 and USD 3,000.

**The sequencing rule from `docs/art-plan.md` is a hard gate, restated here as a
requirement:** *commission nothing until the loop is proven.* The order is (1) playtest
grey-box, (2) juice pass — squash and stretch, tweened item travel, particles, sound,
haptics, anticipation — which is free and closes most of the perceived gap, (3) lock the
design, (4) paid style test of one ingredient, one dish, one head and one button from two or
three artists, (5) commission. **No art purchase order is raised before §13 gate R1 passes.**

### 8.6 Expansion strategy (post-v1.0, stated here because it is the business model)

The Kairosoft buyer in `docs/target-player.md` "owns about five of them" — the pattern is
repeat purchase from a trusted developer. Café Rush's commercial plan is therefore **one
game plus honest paid expansions**, each a self-contained content pack at AED 14.99, never a
currency, never a season pass, never required to finish what you already own (§12).

---

## 9. Platform and technical requirements

### 9.1 Engine

**Godot 4, per `docs/engine-decision.md`**, on the stated rule: sole engineer for the next
twelve months → Godot. Non-goals N3, N8 and N9 remove the three conditions that would flip
it to Unity (hiring, console/Steam, live-ops).

Two consequences carried forward from that document:

1. **Budget one week for billing**, not one day. Godot's IAP path relies on plugins and the
   iOS side needs attention. With a single non-consumable product (§8) this is the minimum
   possible billing surface, which is a further argument for the model chosen.
2. **Simulation stays separate from presentation.** `ING`, `DISHES`, `dayCfg`, `waveCfg` and
   the `*_COST` arrays ship as data resources, not code. Re-tuning after playtest must be a
   spreadsheet job and every balance number in this document must be changeable without a
   programmer.

### 9.2 Target devices

| | Minimum | Baseline for performance budget | Reference |
|---|---|---|---|
| iOS | iOS 15, iPhone 8 | **iPhone SE (2nd gen, 2020)** | iPhone 13 |
| Android | Android 8.0 (API 26), 2 GB RAM | **Snapdragon 680 / 4 GB class (2021 mid-range)** | Pixel 6a |

*Assumption:* this cohort matches a player who buys premium games and keeps a phone for four
years. Revisit against store install data post-launch.

### 9.3 Orientation and layout

- **Portrait only.** No landscape, no rotation lock toggle, no auto-rotate.
- Content column max width **520 dp**, centred, matching the prototype. Wider screens
  letterbox with the background colour.
- Supported aspect ratios **16:9 to 21:9**; safe-area insets respected on notched and
  punch-hole devices, and on the gesture bar.
- The machine grid sits in the bottom third (thumb zone); order tickets sit at the top. The
  empty band between them is the counter, and is where the café art goes.
- No interactive control may sit within 24 dp of the bottom edge (gesture-bar conflict) or
  under a notch.

### 9.4 Offline behaviour

1. **The game is fully functional in aeroplane mode, permanently, after first install** (A9).
2. No network call is required to launch, play, progress, save, or access purchased content.
3. Purchase and restore are the **only** network operations. Both fail gracefully with a
   plain message and a retry, and neither blocks play of the free chapter.
4. The purchase entitlement is cached locally after first validation. A player who buys the
   game and then goes offline for a year keeps the game.
5. Analytics (§11) queue locally and are dropped after 7 days if never uploaded. Analytics
   failure is never visible to the player and never blocks anything.

### 9.5 Save

Per F9. Additionally:

- Location: `user://` (iOS app container, Android internal app storage). Excluded from
  device backup? **No — included**, so a device migration carries progress.
- Format: JSON, `schema_version` integer, human-readable for support.
- Size budget: < 64 KB.
- Write latency budget: < 16 ms on the baseline device, off the frame-critical path.

### 9.6 Performance budget

| Metric | Budget | Measured how |
|---|---|---|
| Frame rate, in shift | **60 fps sustained**, ≥ 58 fps 99th-percentile, on the baseline device at worst case (6 seats, 8 machines × 4 slots, 3 particle bursts) | In-engine frame profiler, automated 90 s bot run |
| Frame rate, menus | 60 fps, throttled to 30 fps when idle > 5 s to save battery | |
| Input latency | **≤ 50 ms** tap to visual response. This is a game about tapping; it is a correctness requirement, not a polish one. | High-speed capture |
| Peak RAM | **≤ 250 MB** on the baseline device | Platform profiler |
| Cold start to playable | **≤ 3.0 s** on the baseline device | Stopwatch, 5 runs, median |
| Install size | **≤ 80 MB** download on both stores | Store console |
| Battery | ≤ 8% drain per 30 min of active play on the baseline device | Measured over 3 × 30 min sessions |
| Thermals | No sustained-performance throttle within 30 min of continuous play | |
| Crash-free sessions | **≥ 99.5%** | Platform crash reporting |

`docs/engine-decision.md` notes a 2D Godot game ships around 30–60 MB; the 80 MB budget
leaves ~20–50 MB for art, audio and two locales, which the §8.5 asset list fits comfortably.

### 9.7 Store requirements

| Requirement | Detail |
|---|---|
| iOS | iOS 15+, universal binary, App Store Small Business Program enrolled |
| Android | API 26 min, target API 35, Android App Bundle, Play Billing Library 7+ |
| Age rating | 4+ / PEGI 3 / ESRB Everyone. No gambling, no loot boxes, no user content, no chat. |
| Privacy | Apple nutrition label: **Data Not Collected** by default; analytics opt-in is declared as "Diagnostics — not linked to you". No IDFA, **no ATT prompt**, no third-party advertising or attribution SDK in the binary. |
| Play Data Safety | Matches the above. No data shared with third parties. |
| Store listing must state | "No ads. No in-app currency. One purchase unlocks everything." |
| Screenshots | 6 per platform, 2 must show the free chapter, 1 must show the Arabic build |
| Territories | Worldwide. Pricing tiers set from the AED 24.99 / USD 6.99 anchor. |
| In-app purchase | Exactly one non-consumable SKU: `cafe_rush_full`. Any future expansion is a separate non-consumable. |

---

## 10. Accessibility and localisation

### 10.1 Accessibility

Full acceptance criteria are F11. The governing principle, which follows from A4: **the
assists are free, complete, and earn everything.** A game that paywalls difficulty is
forbidden by the research; a game that paywalls or penalises accessibility is the same
failure wearing a different hat.

| Area | Requirement |
|---|---|
| Motor | Relaxed Timing (patience ×1.5, 120 s shift, targets scaled by the same ratio). Hold-to-queue reduces sustained tap load. All targets ≥ 48 dp with ≥ 8 dp separation. Left-handed mirror. Pause always available. No double-tap, long-press-only, swipe or multi-touch gesture is required to play. |
| Vision | Three colour-blind palettes. High-contrast mode at WCAG AA. Larger text at 1.25×. **No state is conveyed by colour alone** — patience adds a fill pattern, the ready plate adds border weight and the dish name, bin pips add count. |
| Vestibular / photosensitive | Reduced motion honouring the OS setting plus an in-game override; screen shake off/reduced/full; nothing flashes more than 3×/second. |
| Hearing | No information is audio-only. Every audio cue has a visual equivalent. |
| Cognitive | The intro card always lists every recipe and price — nothing must be memorised. Star thresholds are stated before the shift, not after. Fail coaching is specific and drawn from the player's own run. No hidden systems. |
| Screen reader | All non-shift screens fully labelled for VoiceOver/TalkBack. In-shift screen-reader play is **not** supported in v1.0 and is stated honestly in the listing rather than claimed. |

### 10.2 Localisation

**v1.0 ships English (en) and Arabic (ar-AE).** The game is set in the UAE and priced in AED;
shipping it English-only would be a strange product. *Assumption: ~320 translatable strings.*

| Requirement | Detail |
|---|---|
| Source of truth | All player-visible text in translation resources. **Zero hard-coded strings**, including debug and error text. |
| Arabic quality | Translated and reviewed by a native Gulf-Arabic speaker, not machine-translated. Dish names use the local term where one exists (كرك, لقيمات, رقاق) rather than a transliteration of the English. |
| **RTL layout** | The whole UI mirrors for Arabic: the HUD order, the machine grid reading order, the plate strip, the shop rows, progress-bar fill direction, and every back/forward affordance. Built on the engine's layout-direction support, not by hand-flipping scenes. |
| Text shaping | Arabic requires contextual glyph shaping and bidirectional text. Godot's TextServer Advanced (HarfBuzz + ICU) is a **required** build feature. |
| Fonts | Bricolage Grotesque and DM Mono (the prototype's faces) have **no Arabic coverage**. Arabic ships with **IBM Plex Sans Arabic** (display) and **IBM Plex Mono Arabic** or a Noto fallback (numerals), both open-licensed. Latin and Arabic faces must be optically matched for weight so neither build looks like the afterthought. |
| Numerals | Western Arabic digits (0–9) by default — the common convention on UAE receipts and menus — with an Eastern Arabic digits (٠–٩) toggle in Settings. Currency renders as `24 د.إ` in Arabic and `24 AED` in English. |
| Expansion | Layout must tolerate **+35%** string length without clipping, truncation or reflow breakage, verified with a pseudo-locale in CI. |
| Store | Listing, screenshots and description localised for both. The Arabic screenshots must show the Arabic build. |
| Not in v1.0 | Any third language. If v1.0 recoups, the next two are decided by store data, not by guess. |

---

## 11. Analytics

**Governing constraints:** analytics are **opt-in and default off** (§F10). The binary
contains no third-party advertising or attribution SDK (§9.7). Events are anonymous,
device-scoped, non-identifying, and queue offline. Nothing here is used to drive a retention
mechanic, because there are none (A7) — analytics exist to answer the design questions the
source documents pose, and to price the game correctly.

### 11.1 Events

| Event | Key properties | The question it answers |
|---|---|---|
| `app_open` | days_since_last_open, total_sessions | **"What would make you open it again next week?"** — `docs/target-player.md`'s falsification test, measured rather than asked. If the days-since-last-open distribution has no second hump, the longevity claim is false. |
| `session_end` | duration_s, shifts_played, screens_visited | Is the ~12–20 min session estimate (§7.5) right? |
| `shift_start` | day, mode(campaign/endless/replay), attempt_n, relaxed, upgrade_state_hash | Baseline for everything below |
| `shift_end` | day, mode, passed, taken, target, served, walkouts, scraped, best_streak, stars, time_of_first_walkout | The core balance table. `taken/target` distribution per day is the difficulty curve, measured. |
| `day_attempts` | day, attempts_before_pass | **Where is the game too hard?** Any day with a median > 3 is mis-tuned. |
| `precook` | day, ingredient, lead_time_s | **`docs/rush-pivot.md` test 1: "Do they start slow items early?"** A cook started when no seated customer needs that ingredient. If the share of players with ≥ 1 precook by day 3 is below 75%, cook times are not separated enough and the core skill is not being taught. **This is the single most important event in the game.** |
| `bin_full_block` | day, ingredient, t | **`docs/rush-pivot.md` test 2: "Does the counter limit ever bite?"** If most shifts record zero, the constraint is too loose and spawn rate should rise or bin capacity shrink. |
| `plate_full_block` | day, t | Same question, for the plate |
| `scrape` | day, items, t | Is the plate a real commitment, or is scraping free? |
| `walkout` | day, dish, patience_at_spawn, seats_occupied, t | Which orders are actually unservable at this difficulty? |
| `tap_rate` | shift_id, taps, duration_s, p50_rate, peak_rate | **Validates `TAPS_PER_SEC = 3.0` (§7.1), the assumption the entire late-campaign target curve rests on.** If the observed p50 sustained rate is below 2.6/s, the curve is re-derived before release. |
| `dish_served` / `dish_ignored` | dish, day, frac_at_serve | Is Mint tea being correctly abandoned in the late game (§6.2)? Is any dish dead content? |
| `upgrade_purchase` | line, level, day, cash_before | **Which builds do people actually make?** If ≥ 80% of players buy the same first four upgrades, §7.3's trade-offs are not real and the costs are wrong. |
| `upgrade_tree_state` | on day 30 pass: full tree snapshot | Verifies the "63% of the tree" claim empirically |
| `campaign_complete` | total_hours, total_attempts, stars, elapsed_days_real_time | **Did we fix "finished pretty fast"?** Median hours to complete vs. the 4–6 h estimate. |
| `star_earned` | day, stars, attempt_n, upgrade_state_hash | Is the star system a real second life, or does everyone stop at 1 star? |
| `endless_run` | waves, duration_s, taken, new_best, relaxed | Does Endless have legs past the campaign — the cheapest longevity test in `docs/target-player.md` |
| `chapter_verb_first_seen` / `_mastered` | chapter, verb, attempts_to_pass | Does each new verb land as novelty or as frustration? A verb that adds > 2 attempts to its introductory day is mis-tuned. |
| `paywall_view` | day, session_n, dismissed_or_purchased | Conversion, and whether day 6 is the right wall |
| `purchase` | price_tier, locale, hours_played_before | **What does a buyer look like?** Hours-before-purchase tells us whether the free chapter is the right length. |
| `restore_purchase` | success | Support |
| `setting_changed` | setting, value | Which accessibility options are actually used — and whether Relaxed Timing is being used as an assist or as a difficulty escape (compare against `day_attempts`) |
| `locale` | app_locale, device_locale, numerals | Was Arabic worth it? Decides language 3 and 4. |
| `error` | code, context | Save failures, billing failures, crashes |

### 11.2 What we deliberately do not track

No advertising identifier, no cross-app tracking, no device fingerprint, no location, no
contacts, no email, no user-generated content, no session recording, no A/B test that varies
*difficulty* between players (A4 — the game must be the same game for everyone).

---

## 12. Release plan

| Release | Timing *(assumption, solo dev)* | Scope | Price |
|---|---|---|---|
| **0.9 — Playtest build** | Now → +3 weeks | Grey-box `frenzy.html` extended: 30 days, 8 ingredients, 12 dishes, all 4 verbs, stars, revised target curve (§7.1), tap-rate instrumentation. **No art.** Delivered to 8 testers. This build exists to pass or fail §13 gate R1. | — |
| **0.95 — Juice build** | +3 → +5 weeks | The `docs/art-plan.md` juice pass, still grey-box: squash-and-stretch on every tap, tweened travel from bin to plate, particles (steam, coin burst), 24 SFX + 2 loops, haptics, anticipation and reward beats. Costs nothing but code and closes most of the perceived gap. Re-tested with 4 fresh testers. | — |
| **0.99 — Art + loc** | +5 → +13 weeks | Godot port, §8.5 art commissioned *only after R1 passes*, Arabic + RTL, full accessibility set, billing, save hardening, store assets. Closed beta (TestFlight / Play internal) with 25 testers. | — |
| **v1.0 — Launch** | +14 weeks | Everything in this PRD. 30 days, 8 ingredients, 12 dishes, 8 upgrade lines, 4 verbs, 90 stars, Endless Rush, en + ar. | Free chapter 1 + **AED 24.99** unlock |
| **v1.1 — "Keep your café"** | +6 weeks post-launch | Cloud backup (iCloud / Play Games Saved Games only — no account, no server). **Second Street**: a New Game+ that restarts the 30 days with upgrades kept, all four verbs active from day 1, and a separate star track. Two accessibility additions chosen from launch feedback. Balance patch driven by §11 data. | Free update |
| **v1.2 — "Night Shift"** *(first expansion)* | +14 weeks post-launch | 10 new days (31–40), 3 new ingredients, 5 new dishes, one new verb (**the queue** — customers who wait outside before seating, so the seat cap becomes a management decision), an Endless variant. Route 3 from `docs/target-player.md`: many short differently-constrained levels, which is exactly what an expansion is for. | **AED 14.99**, standalone, never required to finish v1.0 |
| **v1.3 — "The Specials Book"** | +22 weeks | A library of ~40 hand-authored one-off challenge shifts with fixed constraints (one machine broken; espresso only; 45 seconds; triple patience, triple target). Deterministic seeds, **all permanently available, none timed, none expiring** (A7). The cheapest possible content per hour of play. | Free update |
| **v2.0 — Second café** | +12 months | A second venue on the street with its own machines, menu and campaign. Only if v1.0 + v1.2 recoup, per `docs/art-plan.md` route 3: "use the revenue and the proof to fund the next one's art." | New purchase |

**Release discipline:** no live-ops, no seasons, no rotating content, no server. Every
release is a complete thing the player owns forever the moment they install it.

---

## 13. Open questions and risks

### 13.1 Risks

| # | Risk | Severity | Proposed resolution |
|---|---|---|---|
| **R1** | **The two-layer loop is not fun, or stops being fun around day 6.** `docs/rush-pivot.md`: frenzy games die of sameness. If the assembly layer does not click, every sprite commissioned against it is worthless and unrefundable. | **Critical** | **Hard gate before any art spend.** Ship 0.9 to 8 testers. Pass conditions: (a) ≥ 6 of 8 precook a slow ingredient before day 3 (`precook` event); (b) ≥ 6 of 8 reach day 12 unprompted; (c) ≥ 5 of 8 name something they still want to do when asked after they stop. Fail any one → the design changes before a purchase order is raised. |
| **R2** | **The late campaign is a test of finger speed, not attention.** From day 7 the target is bound by the human tap ceiling (§7.1), not by the simulation. If real sustained tap rates are below the assumed 3.0/s, days 15–30 are unwinnable; if the game rewards frantic tapping, it also becomes an RSI and accessibility problem. | **High** | Instrument `tap_rate` from build 0.9. Re-derive `TAPS_PER_SEC` from the observed p50 of the top quartile of testers and regenerate the entire curve — this is a one-constant change by design. Additionally, ship **hold-to-queue** (F2 AC9) and verify it cuts median taps per shift by ≥ 15%. If the mode still reads as a speed test, cut days 25–30 rather than ship a finger-endurance game. |
| **R3** | **Premium conversion is unproven for an unknown solo developer.** The whole model rests on ~1,025 sales to cover art alone (§8.5) and on one Reddit thread's price signal. `docs/target-player.md` explicitly warns that Cooking Fever's 100M is a free-install number that does not transfer to willingness to pay. | **High** | Do not bet the art budget on it. Take `docs/art-plan.md` route 3 literally: the §8.5 budget is capped at USD 4,900, which is a *recoverable* bet, not a five-figure one. Then measure: soft-launch in 2–3 small English-speaking markets for 4 weeks before the worldwide push, watch `paywall_view → purchase` conversion, and test AED 19.99 against AED 24.99 as a **regional price difference**, never as a time-limited discount (A7). Decide the worldwide price from that data. |
| **R4** | **The art comes back inconsistent or wrong, and it is not refundable.** | High | Follow `docs/art-plan.md`'s sequence exactly: paid style test of one ingredient, one dish, one head and one button from 2–3 artists before committing. Brief the artist to **re-skin the existing grey-box component set** rather than design a UI (§8.5). Cap the commission at the §8.5 table with a 15% contingency and no scope creep. |
| **R5** | **The upgrade economy solves out.** If a player can buy everything by day 20, §7.3's trade-offs evaporate and with them the primary longevity route. | High | Automated bot playthrough as a release gate: a perfect-play bot must finish day 30 having bought ≤ 70% of the tree. Verify `upgrade_purchase` diversity in beta — if ≥ 80% of players buy the same first four upgrades, raise the cost of those four and re-run. |
| **R6** | **Spoilage (chapter 3) reads as punishment rather than as a new decision.** It takes away a strategy the player spent 12 days learning. | Medium | Telegraph it hard (hollow pips 4 s before expiry), restrict it to 4 of 8 ingredients, introduce it on a day with a below-curve target, and watch `chapter_verb_first_seen → _mastered`. If day 13 takes > 2 extra attempts on median, extend the freshness window from 18 s to 24 s. The verb is data; the fix is a number. |
| **R7** | **Arabic/RTL is underestimated.** Mirroring a real-time game UI touches layout, animation direction, bar fills and the font stack. It is the kind of work that is 80% done for a month. | Medium | Build RTL support **from day one of the Godot port**, not as a pass at the end. Run the whole game in a pseudo-RTL locale in CI from the first week. Budget 2 weeks explicitly, and treat Arabic as a launch requirement (§3 G6), not a stretch goal — a UAE-set, AED-priced game shipping English-only is a worse outcome than a two-week delay. |
| **R8** | **Save loss on a premium title.** No cloud in v1.0 (N4). A player who loses 12 hours to a reinstall is a refund and a one-star review. | Medium | Atomic writes plus a rolling backup (F9). Include the save in device backup so a phone migration carries it. State the limitation plainly in Settings. Ship cloud backup in v1.1, six weeks after launch, as the first post-launch feature. |
| **R9** | **Godot billing takes longer than planned.** `docs/engine-decision.md` budgets a week against Unity's day, and the iOS side "needs attention". | Medium | The single-SKU model (§8) is the smallest possible billing surface. Spike billing in week 1 of the port, not week 10, on a throwaway branch with a real sandbox purchase on both stores. If it exceeds 2 weeks, ship v1.0 as paid-up-front at AED 24.99 with no free chapter and add the free chapter in v1.1 — a scope change, not a redesign. |
| **R10** | **We are designing for one archived Reddit post.** `docs/target-player.md` says so itself: a hypothesis generator, not market validation. | Medium | Treat every constraint in §2.3 as permanent (they cost nothing and they are all defensible on their own merits) but treat every *number* — price, campaign length, session length — as a hypothesis with an instrumented test in §11. The 8-tester playtest is the first real data this project will ever have; do not launch before it. |
| **R11** | **Discoverability.** A premium game with no ads, no virality and no live-ops has no growth loop by construction. | Medium | Accepted, not solved. The free chapter *is* the growth loop, and it is the reason the model is free-plus-unlock rather than paid-up-front (§8.2). Beyond that: the transformation screenshot, a genre-specific press and creator list, and the r/CozyGamers-adjacent communities the source post came from — approached as a participant, not an advertiser. |

### 13.2 Open questions

| # | Question | How it gets resolved | By when |
|---|---|---|---|
| **Q1** | **AED 24.99 or AED 19.99?** The source signals USD 3–7; the Kairosoft comment suggests more is possible when value is legible. | Soft-launch price test across regions (R3). Also, per `docs/target-player.md`: hand a tester the build, and **after** they stop, ask what they would pay — *do not lead with a number*. | Before worldwide launch |
| **Q2** | **Should Endless Rush be free rather than paid?** It is the strongest longevity hook and therefore both the best reason to buy and the best demonstration that the game lasts. | A/B the *store listing*, not the product: run the soft launch with Endless behind the wall, and if conversion is below 3%, ship a free Endless capped at wave 6 as a taster in v1.0.1. Never cap it for paying players. | Soft launch |
| **Q3** | **Is 30 days the right campaign length, or is 20 days plus deeper systems better?** Days 21–30 hold the target flat and vary only patience and verbs. | `shift_end` and `campaign_complete` by day. If completion rate collapses after day 20, or if `taken/target` distributions from day 21 show no learning curve, cut to 24 days and move the remaining content into v1.2. | Beta |
| **Q4** | **Are flat, unanimated customer heads enough, or does the café read as lifeless without character art?** This is the single largest cut in §8.5 and the largest reversible decision in the product. | Do the juice pass first (build 0.95). `docs/art-plan.md` is explicit that most of the prototype-to-game gap is feel, not art. Judge the question on the juiced grey-box, then commission one head sprite as part of the paid style test and put it in front of the same testers. | Before art commission |
| **Q5** | **Does the counter/plate limit of 3 actually bite?** `docs/rush-pivot.md` specifies 4–6 counter slots; the prototype ships a 3-item plate. We have reconciled these as 3 base upgradeable to 5, but the constraint may be in the wrong place entirely. | `plate_full_block` and `bin_full_block` in build 0.9. If the median shift records zero of both, the constraint is decorative — raise spawn rate or shrink bin capacity until it bites, as `docs/rush-pivot.md` instructs. | Playtest R1 |
| **Q6** | **Godot or Unity, finally?** `docs/engine-decision.md` says the rule is: sole engineer → Godot; expecting to hire, or planning console/Steam → Unity. | Answer one question honestly before the port starts: **is there any intention to hire or contract an engineer in the next twelve months, or to ship on Steam or Switch?** If yes to either, the decision flips to Unity and §9.1's billing week becomes a day. If no, Godot, and this PRD stands as written. | Before the port begins |
| **Q7** | **Should Relaxed Timing earn full stars?** F11 says yes, on the principle that A4 forbids paywalling difficulty and the same logic forbids penalising an accessibility assist. But a 3-star record set at 1.5× patience is not the same achievement. | Ship it earning full stars, tagged in the save and displayed with a small marker on the map. Watch `setting_changed` against `day_attempts`: if Relaxed is being toggled on for a single hard day and off again, it is functioning as a difficulty escape rather than an assist, and the honest fix is to make the standard curve easier — not to take the assist away. | Beta |
| **Q8** | **Do the 6 regulars carry the story layer, or do they need dialogue?** `docs/vertical-slice.md` found the regulars were the most distinctive thing in the calm design; `docs/rush-pivot.md` says they survive the pivot but belong in the calm moments. | Write 18 lines. Put them on the intro and shop cards. In playtest, wait for a tester to mention a regular by name unprompted — the same tell `docs/vertical-slice.md` proposed. If nobody does by day 15, the regulars are a tip modifier and should be described as one, not as a story. | Playtest R1 |

---

## Appendix A — Prototype constants this PRD is built on

Read directly from `prototype/frenzy.html` as of 2026-09-15. Anything marked *changed* is
superseded by this document; everything else ships as-is.

| Constant | Prototype value | v1.0 |
|---|---|---|
| `DAYLEN` | 90 | 90 (120 in Relaxed) |
| `WAVE` | 25 | 25 |
| `LIVES` | 3 | 3 |
| Ingredients | 6 | **8** *(changed)* |
| Dishes | 6 | **12** *(changed)* |
| Days | unbounded, menu stops at day 5 | **30, 5 chapters** *(changed)* |
| Cook-time multiplier per speed level | `0.82` | `0.82` |
| Speed levels | 3 | **5** *(changed)* |
| `SPEED_COST` | `[90, 180, 320]` | `[90, 180, 320, 620, 1240]` *(changed)* |
| Slots per machine | 1 → 3 | **1 → 4** *(changed)* |
| `SLOT_COST` | `[150, 300]` | `[150, 300, 600]` *(changed)* |
| Seats | 3 → 5 | **3 → 6** *(changed)* |
| `SEAT_COST` | `[260, 520]` | `[260, 520, 1040]` *(changed)* |
| Chairs | 0 → 2, +15% patience each | **0 → 3** *(changed)* |
| `CHAIR_COST` | `[220, 440]` | `[220, 440, 880]` *(changed)* |
| Bin capacity | 3 → 5 | **3 → 6** *(changed)* |
| `BIN_COST` | `[200, 400]` | `[200, 400, 800]` *(changed)* |
| Plate capacity | 3, fixed | **3 → 5 (Counter line)** *(changed)* |
| Streak tip cap | `min(streak, 10)` | **10 → 20 (Loyalty line)** *(changed)* |
| Tip formula | `pay × (0.10 + 0.40×frac) × (1 + min(streak,cap)×0.05)` | unchanged |
| Spawn jitter | `spawn × (0.75 + rand×0.5)` | unchanged |
| First spawn | `0.8 s` | unchanged |
| Patience formula | `base × (1 + chairs×0.15) × (1 + (steps−1)×0.35)` | unchanged |
| Target formula | `ceilingSpawn × share` | **`min(ceilingSpawn, ceilingTap) × share`** *(changed — see §7.1)* |
| `share` | `min(0.72, 0.50 + (d−1)×0.04)` | `min(0.74, 0.50 + (d−1)×0.012)` *(changed)* |
| Save key | `rush_save2` (localStorage) | versioned JSON in `user://` *(changed)* |
| Pause on background | yes | yes |
| `prefers-reduced-motion` | honoured | honoured + in-game override |
