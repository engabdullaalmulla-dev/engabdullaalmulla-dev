# Matchday — Positioning & USPs

**Question:** how do I stay profitable and competitive at once, and what actually makes us different?
**Published version:** [Matchday Positioning](https://claude.ai/code/artifact/d275299a-13c8-4a56-a501-fdc5d5887853)
**Depends on:** [competitive teardown](../research/celebreak-vs-stranger-soccer.md) · [unit economics](../research/unit-economics.md)

---

## 1. The trap to avoid

**"Better app" is not a differentiator in this category.**

CeleBreak already out-ships Stranger Soccer comprehensively — profile verification, organiser filters, weekly streaks, player-of-the-match voting, a stats tab, all in recent releases. Stranger Soccer has shipped "bug fixes and performance improvements" release after release. CeleBreak still reports revenue under $1M after eleven years.

Product velocity did not beat the cost structure. A tech founder's failure mode here is a beautiful app losing to whoever signs the venues.

The useful question is not *how do I build a better app*. It is **which technology creates advantage that compounds and costs nothing per game.**

---

## 2. The rule that resolves "profitable AND competitive"

> **Every advantage must cost nothing extra per game, or actively reduce cost.**

| | Their differentiator | Ours |
|---|---|---|
| What it is | A staffed organiser at every kick-off | Matching, balancing, refunds, reputation |
| Marginal cost | **~AED 100 per game, forever** | **≈ AED 0** — compute costs the same at 10 games/week or 400 |
| Consequence | Headcount scales linearly with games; margin stays thin; late cancellations get confiscated to cover it | Host model *removes* the organiser wage entirely |

This is why we can undercut on price *and* out-differentiate at the same time. It isn't cleverness, it's the cost base.

---

## 3. The five USPs, ranked by how hard they are to copy

### 1. The level you play at is earned, not claimed
> *"We put you in the right game on night one, and we're right by your third."*

Both incumbents let you pick your own tier and never check it. Ours moves with real results and peer votes, corrects fast, and everything downstream reads from it. **The only asset here that compounds — it takes as many games to build as you have played, and cannot be bought.** The purest technology advantage on the list.
`Marginal cost: compute` · `Gap G05` · `Copy time: years`

### 2. Twenty-four hours' free cancellation — refunded in cash
> *"Cancel by this time tomorrow and the money's back on your card. Later than that, we'll offer your place on."*

CeleBreak gives you a 15-hour cutoff, returns **credits** rather than cash, and makes no attempt to refill the shirt — so the seat stays empty and the game plays uneven. We give a full day of no-questions cancellation, refund to the card, and actively offer the place on after that.

**The principle: you pay when the game is actually damaged.** If the place resells, nobody was hurt and nothing is charged. If it doesn't, nine other people play a man short — that is real harm, and it costs.

| When | Money | Reliability |
|---|---|---|
| More than 24h before kick-off | **Cash back, automatic** — no waitlist involved | No cost |
| Inside 24h, place resells | **Cash back** | No cost — no harm done |
| Inside 24h, place doesn't resell | **No refund** | Counts against you |
| No-show, never told us | No refund | Counts heavily |

**What this costs.** A refunded seat is about AED 24, not AED 45 — under revenue share the venue's share reverses with the booking, the host is paid on attendance so that fee never goes out, and the only cash genuinely lost is the processor's ~AED 2.31, which isn't returned. Because only the >24h window is unconditional, the exposure is roughly **AED 9 a game, about 3% of contribution** — and it barely moves at launch, because late cancellations cost nothing whether a waitlist exists or not.

**Two cheap ways to make the resale work more often** — which is now directly in the player's interest as well as ours: make the waitlist *cross-game* ("notify me for any Tier-4 game on a Thursday evening") so scattered city-wide demand pools instead of sitting in separate queues; and **spend earned free-game credits on released seats first**, redeeming a liability you already owe into a filled shirt.

**Watch for one perverse incentive.** Resale is least likely on quiet slots, so the player who books an unpopular game carries the most risk — exactly the slot you're trying to build. If fill on new slots stalls, the cheap fix is to guarantee resale below a fill threshold rather than to soften the policy everywhere.

**Negotiate against this:** the arithmetic holds only on a share of *collected* revenue. A minimum guarantee per slot breaks it, because refunded seats would still cost the floor. That clause is worth more than the headline percentage.

`Marginal cost: ~AED 9 per game` · `Gaps G02 G03 G08` · `Copy time: needs a new cost base`

### 3. Your organiser keeps their game — and stops chasing money
> *"Bring your WhatsApp group. Keep your players. Play for free."*

Both incumbents compete with the people already running weekly games. We hand them roster tools, payments, attendance and no-show flagging, and take a cut. **The only feature with negative marginal cost** — it removes the organiser wage and buys distribution simultaneously.
`Marginal cost: negative` · `Gaps G13 G14` · `Copy time: cannibalises them`

### 4. The teams are already picked when you arrive
> *"Two even sides, drawn from who actually turned up."*

Generated at check-in from the ratings of people physically present, not people who booked. A 6–1 first half is the most common bad experience in amateur football and neither competitor has any mechanism against it. **The only USP a player feels in the first ninety seconds.**
`Marginal cost: compute` · `Gap G06` · `Copy time: needs #1 first`

### 5. Your record travels with you
> *"Land in a new city, play the right game that night."*

Both incumbents are multi-country and in both you restart from zero. In a population as transient as Dubai's that is most of the addressable market — and it cuts both ways, because leavers stay valuable. **Pure software, zero marginal cost, and a local insight nobody in Barcelona or Singapore is prioritising.**
`Marginal cost: zero` · `Gap G20` · `Copy time: needs #1 first`

---

## 4. More tech, less app

One tap on **Take a shirt** fans out to six systems — rating engine, team balancer, payments, waitlist ledger, reliability, venue ledger — plus a WhatsApp confirmation. The player sees one line: *You're in. Shirt 8.*

**Sophistication that reaches the surface as a screen, a setting or a choice is a failure. It should reach the surface as an absence of work.**

### Five rules for staying simple

1. **Every piece of intelligence removes a decision — it never adds a screen.** If a feature makes the player choose something they didn't have to choose before, it has failed regardless of how clever it is.
2. **Show the conclusion, never the computation.** "Level 4", not a rating number or how it moved. Exposing the machinery invites arguments about the machinery.
3. **Ship no setting you could infer.** No position picker, no notification matrix, no skill slider. A settings screen is usually a decision you declined to make on the user's behalf.
4. **One primary action per screen, and it's why they opened the app.** They came to play football on Thursday.
5. **The integration goes where the person already is.** In the Gulf that's WhatsApp, not a push notification into an app they opened twice last month.

---

## 5. Integrations worth having

**Local advantage — a foreign competitor won't prioritise these:**

| Integration | Why |
|---|---|
| **WhatsApp Business API** | Confirmations, team sheets at 18:00, waitlist offers, host group import, "can't make it?" as a reply. Dominant channel in the region; neither incumbent uses it properly. Highest-leverage integration on this list. |
| **UAE Pass** | Verified sign-up. Real trust signal for women's games, beginner sessions and corporate. *Confirm private-sector eligibility before committing.* |

**Standard, but they compound:**

| Integration | Why |
|---|---|
| Apple & Google Wallet | The game as a pass with check-in QR on the lock screen. Removes "open the app at the gate". |
| Apple Pay / Google Pay | At AED 45 and weekly frequency, checkout friction hits conversion directly. |
| Calendar | Standing Thursday where they plan their week. |
| Fixed-camera systems (Veo, Pixellot, Fanaty) | Auto-highlights. Rent one camera at two venues and prove the retention lift first. |
| Apple Health / Strava | The game logs as a real activity — brand exposure to a fitness audience you didn't pay for. |
| Slack & Teams | Corporate games where the company already talks. Only once corporate revenue is real. |

---

## 6. What to actually say

| Line | Audience |
|---|---|
| "The only cost of pulling out is telling us. Cancel and the money goes back to your card — not a wallet." | A player burned by CeleBreak. The sharpest thing you can say, because they can't say it back. |
| "You'll be in the right game on your first night, and we'll be right by your third." | A newcomer. Answers the fear that actually stops people booking. |
| "Bring your group. Keep your players. Play for free and stop chasing people for money." | An organiser. The highest-leverage conversation in the business. |
| "We'll fill your Tuesday afternoons. You keep a share, we carry the risk." | A venue. Lead with their dead hours, never with your app. |
| "Forty of your staff, one invoice, nobody in your team has to organise it." | A corporate buyer. They're buying the absence of admin, not football culture. |

---

*Competitor characterisations come from public listings, release notes, company profiles and reviews as summarised in the teardown — directional, not audited. All marginal-cost claims follow the revenue-share model in the unit economics analysis and hold only if venues accept revenue share — untested, and kill criterion one. UAE Pass eligibility for private-sector consumer apps has not been verified.*
