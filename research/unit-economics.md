# Matchday — Unit Economics

**Question:** is the business model sustainable and profitable?
**Answer:** profitable per game, plausible as a city operator, not venture-scale on the available evidence.
**Live model:** [Matchday Unit Economics](https://claude.ai/code/artifact/14699702-e825-497f-b16d-55785c1cd47b) · **Strategy:** [competitive teardown](celebreak-vs-stranger-soccer.md)

---

## 1. Inputs

| Input | Value | Source |
|---|---|---|
| Format | 7-a-side, 14 places | — |
| Price per place | AED 45 | Set just under CeleBreak's AED 59 in Dubai |
| Pitch, 7-a-side, per hour | AED 250–300 | Dubai market rates observed Sep 2026 (Ace Sports Academy AED 300, AED 250 on a monthly deal; Sama Sports AED 250) |
| Pitch, 5-a-side, per hour | AED 197–500 | Ahdaaf AED 197; Koora Dome AED 400 off-peak / AED 500 evening |
| Staffed organiser | AED 100/game | ~2 hours including setup. **Assumption.** |
| Venue revenue share | 35% of takings | **Assumption — the single most important one. Untested.** |
| Host fee | AED 5/head, host plays free | **Assumption.** |
| Payment processing | 2.9% + AED 1 per transaction | Typical UAE card rates. **Assumption.** |
| Equipment | AED 10/game operated, AED 5 host-run | Bibs, balls, amortised |

Everything marked *assumption* is an input, not a finding. Q1, Q2 and Q7 in the [product brief](../product/product-brief.md) exist to replace them with measured numbers.

---

## 2. The finding that matters

Two cost structures, same price, same pitch.

### Rent the pitch + pay an organiser *(what the incumbents do)*

Fixed cost per game = pitch 300 + organiser 100 + equipment 10 = **AED 410**, incurred whether or not anyone turns up.

| Places sold | Fill | Revenue | Contribution | Margin |
|---:|---:|---:|---:|---:|
| 14 | 100% | 630 | **+188** | 30% |
| 12 | 86% | 540 | **+102** | 19% |
| 10 | 71% | 450 | **+17** | 4% |
| 8 | 57% | 360 | **−68** | loss |

**Break-even: 10 of 14 places — 69% fill.**

### Revenue share + community host *(what we'd do)*

No fixed cost. Venue takes 35% of takings; host takes AED 5 a head and plays free.

| Places sold | Fill | Revenue | Contribution | Margin |
|---:|---:|---:|---:|---:|
| 14 | 100% | 630 | **+302** | 48% |
| 12 | 86% | 540 | **+258** | 48% |
| 10 | 71% | 450 | **+215** | 48% |
| 8 | 57% | 360 | **+171** | 47% |

**Break-even: one place.** Margin is essentially fill-invariant.

### Why this is the whole argument

On a fixed-cost base, an empty shirt is a straight loss — so confiscating the fee of someone who cancels late *is* where the margin comes from. CeleBreak's 15-hour credit forfeiture is not greed, it is arithmetic. It also makes their games play uneven, which their own reviewers noticed (G02).

Revenue share converts a fixed-cost business with a 69% break-even into a variable-cost business with effectively none. **That is what pays for the cash refund guarantee** — and why the incumbents cannot match it without breaking themselves. The refund promise is a consequence of the venue contract, not a marketing decision.

---

## 2b. What a refund actually costs

The refund guarantee is only credible if it is unconditional, and it can be — because a refunded seat does **not** cost AED 45.

| Line | Effect on a reversed booking |
|---|---|
| Place price | −45 revenue |
| Venue share (35%) | +15.75 — reverses with the booking |
| Host fee (AED 5/head) | +5 — paid on attendance, never goes out |
| Payment processing | **−2.31 real cash, not returned by the processor** |
| **Net economic cost** | **≈ AED 24** — the AED 21.95 of contribution foregone, plus the fee |

| Scenario | Unresold refunds/game | Cost/game | % of contribution |
|---|---:|---:|---:|
| Mature — waitlist exists | ~0.6 seats | ~AED 14 | 5% |
| Launch — no waitlist at all | ~2.4 seats | ~AED 58 | 22% |

Worst case is survivable, and in absolute terms at launch it is roughly AED 760 a week across 20 games. **The cost falls as waitlists appear, so the guarantee is cheapest exactly where it is most needed.**

The residual risk is behavioural, not financial — speculative booking and casual cancelling — and is handled by the reliability score, never by keeping money.

**Contract risk:** this holds only if the venue takes a share of *collected* revenue. A minimum guarantee per slot breaks it, because refunded seats would still cost the floor. Negotiate share-of-collected with the lowest possible floor; that clause matters more than the percentage.

---

## 3. Does it scale?

At 48% contribution margin and AED 45 a place, reaching **AED 10M of revenue from games alone** requires roughly:

- 231,000 places sold per year
- ≈ 19,250 games at 12 places each
- ≈ **370 games per week, in one city**

For scale: Stranger Soccer has run ~100,000 games since 2017 — roughly **210 a week** — as the clear market leader in Singapore after nine years.

So games cover the operating base. They do not produce the profit.

| Line | Why it matters | Rough shape |
|---|---|---|
| **Membership** | Recurring, and decoupled from pitch-hours. Also creates the sunk-cost reason to play on a night someone can't be bothered, which lifts fill rate | 1,000 × AED 199/mo ≈ AED 2.4M/yr |
| **Corporate** | One contract = 40 players, off-peak, invoiced, near-zero CAC. Fills the hours rev-share is cheapest in | 25 accounts × AED 10k/mo ≈ AED 3M/yr |
| **Host-run take rate** | Lower per game, but scales without headcount. Decides operator vs. platform | 150 games/wk × AED 50 ≈ AED 390k/yr |
| **Operated games** | Prove density, hold venue relationships, generate rating data | 100 games/wk × AED 258 ≈ AED 1.3M/yr |

---

## 4. LTV and CAC

| | |
|---|---|
| Play rate | 3 games/month × AED 45 = AED 135/mo revenue |
| Contribution | ~AED 66/mo at 48% |
| Average life | 8 months *(assumption — validate against week-12 repeat)* |
| **Lifetime contribution** | **≈ AED 500** |
| CAC ceiling at 3 games | ≈ AED 190 |
| **LTV / CAC** | **≈ 2.7×** |

Healthy is 3×+. This clears only if acquisition is mostly referral, touchline conversion and host-imported rosters. **Paid acquisition does not work at this order value** — which is why N2, N4 and N5 in the backlog are P0 and there is no paid-media line anywhere in the plan.

---

## 5. What the category evidence says

| Company | Position | Reading |
|---|---|---|
| **CeleBreak** (2014) | ~$3.3M raised over six small rounds; revenue reported under $1M; stated goal of lifting Barcelona alone from €800k to €2M | Eleven years without finding leverage. The staffed-organiser cost base is why. |
| **Plei** | ~600k players across 38 regions; targeting a first institutional round (~$8M Series A) | The largest player base in the category, and user scale has not converted into revenue scale. |
| **Stranger Soccer** (2017) | ~100k games lifetime, ~40k users, bootstrapped. One third-party estimator lists $5.8M revenue / 36 staff | **That figure does not reconcile** with ~210 games/week at ~S$18–20 net per place, which points nearer S$2–3M. Algorithmic revenue estimates are not filed accounts. |

**A decade, several funded attempts, nobody past roughly $10M.** Low order value, liquidity that does not transfer between cities, and every new city is a fresh operations build.

The thing that could change this verdict is the platform layer — host tools, venue software, payments take — applied to games you do not run. That is a different company from the one the designs imply, and nobody has proved it.

---

## 6. Kill criteria

Any one of these and the plan stops.

1. **Venues won't do revenue share.** You inherit the incumbents' cost structure with a weaker brand and no scale, and everything above collapses. *This is the first phone call, in week one, before any product work.*
2. **Fill stalls under 70% after twelve weeks on proven slots.** If you can't fill timeslots the incumbents already sell out, the problem is you, not the market.
3. **Blended CAC above ~AED 190.** LTV/CAC drops below 2.7× and the model stops clearing.
4. **Fewer than five hosts by week twelve.** You are an operations business forever, with the ceiling CeleBreak has been hitting since 2014.

---

## 7. Honest framing

This is **a very good mid-sized regional business with a possible platform option attached** — not a rocket. A mature single city on these numbers plausibly reaches AED 8–15M revenue at 15–25% EBITDA, carried by membership and corporate rather than by games.

That is not a reason not to build it. It is a reason not to raise against the wrong story.

---

*Pitch rates are Dubai market prices observed September 2026. Competitor funding, revenue and game-count figures come from public company profiles, app-store listings and third-party estimators as summarised in the competitive teardown — directional, not audited. The Stranger Soccer revenue estimate is flagged above as not reconciling with its own game count. Every other figure is an assumption that can be changed, not a finding.*
