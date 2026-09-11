# R0 — Prove one slot

**Weeks 0–4 · no app · no code**

**Exit criterion:** three consecutive sell-outs on one fixed weekly slot. Not signups. Not downloads. Not a waitlist.

The point of R0 is not to launch small. It is to find out three things that decide whether any of the rest is worth building: **does one slot sell out, will a venue do revenue share, and do people come back the following week.** All three are answerable in four weeks with a spreadsheet, and none of them is answerable from a deck.

---

## 1. What exists in R0

| Thing | What it actually is |
|---|---|
| The booking page | A form and a hosted payment link |
| The game | One venue, one day, one time, recurring |
| The community | One WhatsApp group |
| The refund guarantee | A person, in the group, doing it by hand |
| The rating system | A host with a pen |
| The dataset | Three tabs in one spreadsheet (§4) |

**Explicitly out:** native app, published levels, reliability scores, automated resale, team balancing, player profiles, second slot, second venue, second city.

### One slot means one

The exit criterion is about *one* slot selling out three times. Two half-full slots is not the same signal as one full one, and it is the single most common way this phase gets fudged. A slot that fills is a repeatable unit; two that don't are a marketing problem you cannot diagnose.

### Prepaid only

No cash at the pitch, no "pay me later". Not because of the money — because **pay-at-pitch destroys the only signal R0 exists to collect.** A booking that costs nothing until you show up is not a sale, and a game that "fills" on unpaid promises tells you nothing about fill rate, no-shows or willingness to pay. Every downstream number in `unit-economics.md` assumes prepayment.

---

## 2. Week by week

### Week 0 — before anyone plays

**The venue conversation is the most important hour of this phase.** Per `unit-economics.md`, the entire margin structure turns on it: a fixed-rate pitch means break-even at 10 of 14 places, while revenue share means break-even at roughly one. Ask in this order:

1. **Off-peak revenue share** — a split of what we take, on a slot they currently sell to nobody. This is the ask. It converts a fixed-cost business into a variable-cost one and it is what pays for the refund guarantee.
2. **Failing that, a fixed rate low enough to break even at 10 of 14.** Do the arithmetic in front of them.
3. **Failing that, walk.** A venue that will do neither is telling you the answer to Q2, and Q2 is a kill criterion.

Also in week 0:

- Lock the slot. Same day, same time, every week, indefinitely. The recurrence is the product.
- Set the price. Incumbent is AED 59 in Dubai; the model assumes AED 45. **Pick one and hold it for all four weeks** — with three or four games there is no A/B test here, and varying it destroys the comparison you do have.
- Stand up the booking page, the payment link, the WhatsApp group and the spreadsheet. Half a day, total.
- Write the refund promise down, in the group description and on the booking page, in the words you intend to keep: *can't make it? tell us and we'll offer your place on. If it fills, you get your money back in cash.*
- Recruit the first fourteen by hand. Personally. This does not scale and is not supposed to.

### Week 1 — the first game

Run it. Record everything in §4. Post photos in the group the same night, within an hour.

The host does the three-tap read on paper: **who played above their level, who looked off, who was where you'd expect.** Two to four names. This is C8 and it is the most valuable thing produced in R0.

### Week 2 — the only number that matters this week

**How many of week 1 came back?** This is the earliest retention signal available anywhere in the business and it arrives seven days in. Below a third and something is wrong with the product, not the marketing.

Run the refund guarantee properly the first time someone drops out. Post the spot, fill it, refund them, and do it visibly in the group. **The first time a player watches someone else get their money back is worth more than any amount of describing it.**

### Week 3 — the third game

If weeks 1 and 2 filled, this is the one that completes the exit criterion. If they didn't, this is the week to find out why — ask five people who booked once and didn't return, individually, by message.

### Week 4 — decide

Against the criteria in §5. Then either open a second slot at the same venue or stop.

---

## 3. Running the guarantee by hand

The cash-refund promise is the wedge (`positioning.md`) and the hardest thing to operate. Prove it manually before automating it, because R1 builds it into software and software built on an unvalidated flow is expensive to unwind.

**The flow, as executed by a person:**

1. Player messages: can't make it.
2. Post in the group: *"One place open for tonight, AED 45, first to say yes."*
3. Someone claims it and pays.
4. Refund the original player, in full, same day.
5. Record both sides of it in the Appearances tab.

**If it doesn't fill**, the money isn't returned — but it counts against nothing in R0, because reliability scores don't exist yet. Say that plainly rather than implying a consequence you have no system to apply.

**What a refunded seat actually costs you** — from `unit-economics.md` §2b: **about AED 24, not AED 45.** The venue share reverses, the host is paid on attendance, and the only real cash out is roughly AED 2.31 of processor fee. Know this number before the first refund, because the instinct to hedge on the promise comes from mistakenly believing it costs full price.

---

## 4. The dataset — C8

> **C8 is the single most important row in the product brief.** The dataset cannot be bought, and it starts accruing the day the first game is played.

By the time the rating system is built in R2, this gives you N games of host reads to **backfill and validate the model against** rather than launching it blind and finding out over three months. That is the entire argument for doing paperwork during a phase that has no software.

One spreadsheet. Three tabs. Nothing else.

### Tab 1 — Games

| Column | Notes |
|---|---|
| `game_id` | `2026-09-17-alquoz-2000` |
| `date`, `kickoff`, `venue`, `format` | 5-a-side / 7-a-side |
| `places`, `booked`, `checked_in` | Three different numbers. Keep them three. |
| `score_a`, `score_b` | Confirmed by the host, not shouted from the pitch |
| `teams_felt_fair` | `even` / `close` / `lopsided` — host's one-word call |
| `host` | Who ran it |
| `cost_aed`, `revenue_aed`, `refunded_aed` | The real per-game P&L |
| `notes` | Weather, a no-show, a ringer, anything odd |

### Tab 2 — Players

| Column | Notes |
|---|---|
| `player_id`, `name`, `whatsapp` | |
| `first_game_date` | Cohort anchor |
| `self_declared_level` | Seeds the rating in R2 — and lets you check, later, how badly people rate themselves |
| `position_pref` | **Especially keeper.** Keepers are the scarcest input in the balancer. |
| `source` | How they found us. This becomes CAC by channel and there is no way to reconstruct it afterwards. |

### Tab 3 — Appearances *(one row per player per game)*

This is the tab that compounds. The other two are context.

| Column | Notes |
|---|---|
| `game_id`, `player_id` | |
| `side` | A or B |
| `booked`, `showed` | Both, separately — the gap is the no-show rate |
| `host_read` | `above` / `level` / `below` / blank. The three taps, on paper. |
| `motm` | If a vote happened at all |
| `paid_aed`, `refunded_aed` | |

### Two rules about the spreadsheet

**Record checked-in, not booked.** Everywhere. The difference between the two lists is the no-show rate, the balancer's real input, and the thing that makes a team sheet wrong. If you only keep one list, keep the arrivals.

**Fill it in the same night.** Reconstructed-on-Sunday data is fiction, and this dataset's whole value is that it is contemporaneous.

---

## 5. What R0 answers, and what it cannot

### Exit criteria — all three

- [ ] Three consecutive sell-outs on the one fixed slot.
- [ ] A venue arrangement that makes the unit economics work — revenue share, or a fixed rate that clears at 10 of 14.
- [ ] Week-1 → week-2 return above one third.

### Kill criteria — any one

| Signal | What it means |
|---|---|
| Cannot fill 10 of 14 by game three | There is no demand at this price in this district. Not a marketing problem. |
| No venue will discuss revenue share, and fixed rates leave break-even implausible | Kill criterion #1 from `unit-economics.md`. The refund guarantee dies with it, and it is the wedge. |
| Week-1 → week-2 return below one third | People tried it and chose not to come back. Nothing downstream fixes that. |

### Deliberately not answerable in R0

Stating these up front stops them being claimed later on four games of evidence:

- **Whether the rating model works.** You are collecting its training data, not testing it.
- **CAC by channel.** Fourteen hand-recruited players is not a channel. It is a favour.
- **No-show rate at scale.** People who were personally invited by the founder turn up. That is not the steady state.
- **Whether community hosts work.** You are the host. That is R3's question (R5 in `ranking.md`).
- **The right price.** You picked one and held it, on purpose.

---

## 6. Two things people skip and regret

**The results paperwork.** It feels pointless during a phase with no software. It is the only irreplaceable output of R0 — the fill rate you can re-derive later from payments, the goal differences and host reads you cannot. A blowout-rate baseline from these four weeks is what the balancer gets judged against in R2 (`balancer.md` §9, B4), and it is uncollectable after the fact.

**Running the guarantee for real.** The temptation is to describe the promise in R0 and implement it in R1. But the first live refund is where you discover whether a spot actually resells inside the group, how fast, and what people say when it doesn't — which is precisely the risk the whole positioning rests on.

---

## Open questions

| # | Question | Needed by |
|---|---|---|
| Z1 | Which payment provider can be opened fastest for a UAE entity taking card payments at this size? `[NEEDS VALIDATION]` — decide in week 0, don't let it block the venue conversation. | Week 0 |
| Z2 | Does a spot actually resell inside a 14-person WhatsApp group, and how fast? The guarantee's cost model assumes it usually does. | Week 2 |
| Z3 | How far off is self-declared level from the host read? First real evidence for G05, available from game one. | R0 exit |
| Z4 | Is one weekly slot enough to hold a group together, or does a fortnight-long gap between someone's games lose them? | R0 exit |
