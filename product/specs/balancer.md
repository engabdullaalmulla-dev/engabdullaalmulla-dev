# D2 — The balancer

**The one thing to get right:** a rating that is correct and a team sheet that feels wrong still loses you the player. The balancer is judged every single week, in about four seconds, by fourteen people standing on a pitch. It is the most frequently-tested surface in the product.

Gap: **G06** — *teams are picked by eye, thirty seconds before kick-off.* A 6–1 first half is the most common bad experience in pickup football, and neither incumbent has any mechanism against it.

Reads from `ranking.md`. Writes nothing back to it except the one signal in §7.

---

## 1. Two objectives, and they are not the same thing

| Objective | Measured by | Who notices |
|---|---|---|
| The game is actually close | Final goal difference | Everyone, afterwards |
| The sheet **looks** fair | Nothing, until someone complains | Everyone, immediately |

A split can be mathematically perfect and still read as a stitch-up — the two best players together, four mates on one side, or the identical teams as last Thursday. Optimising only the first objective produces a balancer that is right and disliked.

There is a third objective nobody asks for and everybody feels the absence of:

| Objective | Measured by |
|---|---|
| The teams are **different from last week** | Pair-repetition rate |

A pure balance optimiser is deterministic. Run it on the same twelve regulars every Thursday and it returns the same split every Thursday, because that split is optimal. Six months of playing with the identical five people is how a weekly game dies.

---

## 2. When it runs

**At check-in close, from who actually arrived.** Not at booking. This is the whole point of D2 — a sheet built from the booking list is a sheet built from a guess, and the two names who didn't turn up are exactly the ones that break it.

That collides with O6, the 18:00 team-sheet drop in WhatsApp, which is a retention ritual and worth keeping. Resolution:

| Time | What goes out | Labelled |
|---|---|---|
| 18:00 | **Provisional sides** from the booking list | "Provisional — confirmed at check-in" |
| Check-in close | **Final sides**, with changes highlighted | "Final" |

Never publish a provisional sheet unlabelled. A sheet that silently changes between 18:00 and kick-off costs more trust than no sheet at all.

**Late drops after the final sheet.** Re-solve with a **stickiness penalty** (§4) so the sheet does not reshuffle wholesale. People have already read it and found their name.

---

## 3. Don't be clever — enumerate

For pickup-sized games the entire search space is small enough to evaluate exhaustively.

| Players | Distinct splits | Verdict |
|---|---:|---|
| 10 (5-a-side) | 126 | Instant |
| 14 (7-a-side) | 1,716 | Instant |
| 20 | 92,378 | Milliseconds |
| 22 (11-a-side) | 352,716 | Well under a second |

**Enumerate every legal split up to 22 players and take the lowest cost.** Above 22, seed with a snake draft and run 2-opt swaps to convergence.

This matters more than it looks. An exhaustive search is **provably optimal for the stated cost function, perfectly reproducible, and explainable** — when a player asks why they are on this side, there is a real answer rather than the output of a heuristic nobody can reconstruct. Almost every team-balancer in the wild reaches for a greedy draft and inherits its blind spots for no reason at all.

---

## 4. The cost function

All terms in rating points, so they are directly commensurable. Lowest total wins.

```
cost =  1.0 × |mean_A   − mean_B|          how even the sides are on average
     +  0.5 × |best_A   − best_B|          "have they got the best player?"
     +  0.3 × |spread_A − spread_B|        top-heavy vs. even
     +  4   × pairs_repeated               variety
     −  15  × crew_pairs_honoured          keeping mates together (max 2 per side)
     +  8   × players_moved                stickiness, re-solves only
```

**Hard constraints** — a split violating any of these is not evaluated at all:

- Sides equal in size, or differing by one when the count is odd (§6).
- **The top two rated players are never on the same side.** This is the single most visible unfairness on a team sheet, and it is worth a hard rule even in the case where the top six are within ten points of each other and splitting them is arbitrary. Simple and explainable beats subtle.
- One declared keeper per side, when exactly two are declared (§5).
- No crew of three or more entirely on one side.

**Why each soft term earns its place:**

**Mean** is the base unit and the thing everyone assumes the balancer does.

**Best player** exists because players do not read a team sheet as a mean. They scan for the strongest name and decide from there. Two sides on an identical mean where one holds the best player on the pitch will be called unfair, and in small-sided football they will usually be right — one dominant individual is a far larger share of a seven-a-side than of a league team.

**Spread** separates two sides that a mean cannot. 1400/1400/1100/1100 and 1250/1250/1250/1250 have the same average and are not the same game.

**Repetition** counts pairs who were on the same side in three or more of their last four shared games. Four points per pair is deliberately small — it never overrides balance, it only breaks ties, which is exactly enough to stop the optimiser converging on a fixed split. This makes the balancer deterministic *given history* while the sheet still changes week to week, because the history changes week to week.

**Crew affinity** is a bonus, not a constraint, and it is capped. Pairs who booked together are kept together most weeks. **Crews of three or more get split, and are told so at booking** — four friends occupying 80% of one side in a ten-player game ruins the night for the other five, and finding that out at the pitch is worse than reading it at checkout.

**Stickiness** only applies when re-solving after a late drop. Eight points per player moved means a one-player dropout moves one or two names, not the whole sheet.

### Starting weights are guesses

Every number above is a defensible starting point and nothing more. They are isolated as single parameters for the same reason the ranking weights are: to be tuned against real goal differences rather than argued about now. See B4.

---

## 5. Ratings the balancer should not trust

### Uncertainty shrinkage

A player two games in has a rating, but not a reliable one. Feeding it in at face value lets one badly-seeded newcomer wreck the split. Shrink every rating toward the group mean in proportion to its uncertainty:

```
rating_used = mean_group + (rating − mean_group) × confidence
```

| Games played | Confidence |
|---|---:|
| 0 (self-declared only) | 0.3 |
| 1–5 | 0.5 |
| 6–20 | 0.8 |
| 21+ | 1.0 |

A brand-new player who self-declared "I play regularly" is therefore treated as *slightly* above or below the group rather than confidently placed. This is the same uncertainty band the ranking spec widens after eight weeks' absence — one concept, used twice.

### Cold start — the balancer must work before ratings exist

At launch nobody has a rating. Every mean gap is zero, the cost function is degenerate, and the balancer reduces to keeper placement, crew splitting and variety, with ties broken on a seeded shuffle.

**That is a correct and acceptable outcome, and it must be implemented deliberately rather than discovered.** R2 ships ratings; the balancer has to be useful in the weeks before they converge, and a system that divides by zero or returns the booking order on day one is a launch bug, not an edge case.

---

## 6. The awkward cases, spelled out

### Keepers

Keepers are scarce, and getting this wrong is worse than getting the mean wrong.

| Declared keepers | Rule |
|---|---|
| 2 | One per side. **Hard constraint.** |
| 1 | That side carries a handicap in the balance; the other side rotates an outfield player in goal. |
| 0 | Rotating keeper both sides. Keeping is excluded from the balance entirely. |
| 3+ | Two start, the rest play out and rotate. |

A keeper's rating is rated almost entirely on the host read (see `ranking.md` §Keepers), so it is the least reliable rating on the sheet in a player's first few games. Shrink keeper ratings one confidence band harder than outfield.

### Odd numbers

One side plays with an extra outfield player, and that side takes a handicap in the balance sized at roughly one player's worth of the group mean. The extra player is **the highest-reliability player on the sheet who has not taken the extra in the last three games** — a small, visible reward that costs nothing.

Alternative, where the venue and format allow: a rolling sub. Host's choice, remembered per slot.

### The crowd that will not split

Some nights the people who turned up cannot be made even. Six strong players and eight weak ones has no good answer.

**Say so.** If the best achievable mean gap exceeds 40 points — roughly a third of a tier — the host sees:

> *Tonight's crowd doesn't split evenly. Closest we can get is a third of a level. Consider a rolling sub, or ask whether anyone wants to swap at half time.*

An honest "this one is lopsided and here is why" costs far less than a bad sheet presented with a confident green tick. The balancer's credibility comes from being right about its own limits.

---

## 7. Half time (D3)

Past a **three-goal gap at half time**, the host is prompted — never the app acting on its own.

- The app proposes the **single swap** that most reduces the projected gap. One player each way, not a reshuffle.
- **Never the keeper.** Never the same player two weeks running.
- The host can decline, and declining must be a one-tap, no-friction path. Most hosts will decline most of the time and that is fine.
- Opt-in per venue and per slot. Some groups find mid-game swaps normal; some find them humiliating. Remember the answer.

**A rebalanced game scores at half K.** The sides that finished are not the sides that were rated, so the result carries less information about either. This is the balancer's only write back into `ranking.md`.

---

## 8. Making it feel fair

Correctness is necessary and not sufficient. Four seconds with the sheet decides this.

**Show the balance, don't assert it.** The team sheet carries a meter, not a badge — `design/TeamSheet.dc.html`. "DEAD EVEN" when the gap is under 10 points; the real gap in tier-fractions when it is not. A balancer that says "balanced!" on a night it knows is lopsided burns the meter permanently.

**One line of reasoning per sheet**, in plain words:

> *Both sides within 0.2 of a level. The two strongest players are split. Keepers one each.*

**"Why am I on this side?"** — on tap, for the player only:

> *You're with Omar because you booked together. The two strongest players are always split, and you're one of them tonight.*

Three rules for this surface:

1. **Never show another player's rating or tier.** The sheet is the most tempting place in the app to leak it and the most damaging. Same rule as the ranking spec.
2. **Never explain a placement by naming someone as the weak one.** "We split the strongest players" is sayable. "We put you with Omar to carry him" is not, and is the same fact.
3. **The meter must be able to say the sides are uneven.** See above.

---

## 9. How we know it works

The balancer has an objective scoreboard that costs nothing to collect, which is rare:

| Metric | Target | Why |
|---|---|---|
| Median absolute goal difference | **≤ 2** | The game was a game |
| Share of games finishing 4+ goals apart | **< 20%** | Blowouts are the churn event |
| Pair repetition — same two players, same side, 3 of last 4 | **< 25%** | Variety is actually happening |
| Mean rating gap at kick-off | **≤ 15 points in 90% of games** | The optimiser is finding good splits |

The first two are the real ones and they are free — they fall straight out of C8's score records, from game one, before any of this is built. **A blowout rate measured on paper during R0 is the baseline this feature is later judged against**, and it cannot be reconstructed after the fact.

The one thing not to do is ask "were the teams fair?" after every game. It converts a mild feeling into a stated grievance and trains people to look for unfairness. Ask it occasionally, at most monthly, and weight the answer below the goal-difference data.

---

## Acceptance criteria

- [ ] Teams are computed from **checked-in** players, never from the booking list.
- [ ] A provisional sheet is visibly labelled provisional; a final sheet highlights what changed since it.
- [ ] Up to 22 players the solver enumerates every legal split; the returned split is the global minimum of the cost function.
- [ ] Same inputs and same history produce the same teams, every time.
- [ ] The same twelve regulars playing four consecutive weeks do **not** receive the same split twice.
- [ ] The top two rated players are never on the same side.
- [ ] With exactly two declared keepers, each side gets one.
- [ ] With zero ratings in the system, the balancer returns a legal, crew-respecting, varied split and does not error.
- [ ] A crew of four is never placed wholly on one side, and sees that rule at booking, not at the pitch.
- [ ] A single late drop after the final sheet moves at most two players.
- [ ] A night that cannot be balanced within 40 points tells the host so, in words, before kick-off.
- [ ] An odd count gives the extra player to the highest-reliability player who has not had it in three games.
- [ ] The balance meter can and does display "uneven" — a test fixture of six strong and eight weak players must not show a positive balance state.
- [ ] No player's rating or tier is visible to any other player anywhere on the team sheet.
- [ ] No placement explanation names another player as weaker.
- [ ] A half-time swap is proposed, never applied automatically, and is declinable in one tap.
- [ ] A game that was rebalanced at half time scores at half K.
- [ ] Goal difference is recorded for every game and reportable as a distribution, not just a mean.

---

## Open questions

| # | Question | Needed by |
|---|---|---|
| B1 | Is the 0.5 weight on best-player gap right? It is the term most likely to be under-weighted — perceived fairness may need it above the mean term. Tune on the first 200 games. | R2 exit |
| B2 | Does mid-game rebalancing help or humiliate? Run it at one slot only in R2 and compare repeat rate against a slot without it. | R3 entry |
| B3 | Do players actually want to be with their crew more than they want an even game? These conflict, and the answer decides the 15-point bonus. | R3 entry |
| B4 | What blowout rate does the manual R0 baseline show? Everything in §9 is judged against it, and it is only collectable now. | R0 exit |
| B5 | Is shrinking new players toward the mean enough, or does a genuinely strong newcomer wreck sheets for their first five games regardless? | R2 exit |
