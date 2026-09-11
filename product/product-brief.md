# Matchday — Product Brief

**Owner:** Product · **Status:** Draft for review · **Last updated:** 11 September 2026
**Source of truth for strategy:** [`research/celebreak-vs-stranger-soccer.md`](../research/celebreak-vs-stranger-soccer.md) · **Designs:** [`design/`](../design/)

---

## 1. The one-line read

CeleBreak and Stranger Soccer sell *access to a game*, which is a commodity — anyone can rent a pitch and post a link. Matchday sells **a fair game and people worth seeing again**, and gives you your money back when you can't make it. We win one district of Dubai completely, then the next.

---

## 2. Problem

Adult amateur football is badly served by both incumbents in ways they cannot cheaply fix.

| What's broken | Evidence | Gap |
|---|---|---|
| You pay 2–3× what the pitch costs, per head | Stranger Soccer slots reported at ~S$17–25 where DIY is ~S$6–10; Plei runs US games at $6 | G01 |
| Cancel late and your money is simply taken | CeleBreak forfeits credits inside 15h. A reviewer: "predatory… causes games to have an uneven number of players quite often" | G02 |
| Money goes in and can't come out | Both run prepaid credit wallets; refunds return credits, not cash | G03 |
| Levels are self-declared and unenforced | Both let you pick your own tier; nothing verifies or corrects it. "Games are usually not much fun, unbalanced" | G05 |
| Teams are picked by eye, thirty seconds before kick-off | A 6–1 first half is the most common bad experience in pickup football; neither platform prevents it | G06 |
| No-shows are punished with money, not consequences | Confiscating the fee is the only lever either pulls | G07 |
| An empty spot stays empty | No live waitlist market — the platform is paid for the seat *and* the game plays uneven | G08 |
| You play with strangers and never see them again | "No sense of community at all" | G10 |
| Nothing is at stake | No table, no season, nothing that makes next Thursday matter more than this one | G11 |
| Independent organisers are treated as rivals | Every city has dozens already running games in WhatsApp groups | G13 |

The one-sentence version: **the incumbents' cancellation policies make money by keeping the seat empty, which is the same thing as making the game worse.** That conflict is the opening.

---

## 3. Who it is for

| Who | The job they're hiring us for | What they'll judge us on |
|---|---|---|
| **The regular** — plays weekly, has a level, knows a few faces | "Give me a good game every Thursday without organising it" | Whether the game is even, and whether it runs |
| **The newcomer** — landed in Dubai this year, knows nobody | "Get me into football and into a group of people" | Whether anyone talked to them, and whether they're placed right |
| **The returner / beginner** — hasn't played in years, nervous | "Let me play without embarrassing myself" | Whether the level was honest |
| **The host** — already runs a weekly game from a group chat | "Take the admin and the chasing-for-money off me" | Whether it saves them time and whether they play free |
| **The venue** — commercial pitch with dead midweek hours | "Fill hours I currently sell to nobody" | Utilisation and payment reliability |
| **The corporate buyer** — HR/wellness budget, 40 staff | "Run a recurring thing for my team that I don't manage" | One invoice, no chasing |

**Beachhead:** one district of Dubai, 3–5 pitches, two levels, three fixed weekly kick-offs. Liquidity here is per-pitch, per-timeslot, per-level — never city-wide. Every plan in this document holds that line.

---

## 4. Why us, why now

**What we can do that they structurally can't.** CeleBreak staffs a paid organiser at every kick-off, so its cost base scales linearly with games — public employee reviews describe repeated layoffs and an intern-heavy org. Stranger Soccer buys inventory wholesale and expands by franchise, and its release notes have been "bug fixes" for release after release. Both carry full inventory risk at near-retail rates, which is *why* their refund policies are punitive: an empty seat is a straight loss.

If we take off-peak inventory on revenue share instead of renting it, our downside on a half-empty game collapses to near zero — and **that is what buys the ability to refund in cash, which they cannot match without breaking their own economics.**

**Three things that compound and can't be bought:**
1. The **level-rating dataset** — it takes as many games to build as you have played.
2. **Signed off-peak venue terms** — right-of-first-refusal on dead hours.
3. **Host relationships** — the people who already own the player relationships.

---

## 5. Product principles

1. **The game running is the product.** Reliability beats features. A cancelled game undoes a month of acquisition.
2. **Never trap money.** Cash-refundable, always, advertised in as many words. This is a trust position, not a payments detail.
3. **Levels are earned, never claimed.** Everything downstream — teams, matchmaking, progression — reads from one honest number.
4. **Behaviour is managed with standing, not fines.** People respond to status far more than to small penalties.
5. **Treat organisers as supply, not competition.** Every game we don't have to staff is margin and reach.
6. **Go deep before wide.** New formats on existing pitches before new districts; new districts before new cities.

---

## 6. Scope by release

### R0 — Prove one slot · weeks 0–4 · *no app*
A booking page, a payment link and a WhatsApp group. Everything else manual. Week-by-week detail, the dataset schema and the kill criteria are in `specs/r0-runbook.md`.
- **Goal:** the same weekly game sells out three weeks running.
- **Exit criteria:** 3 consecutive sell-outs on one fixed slot · a venue arrangement the economics survive · week-1 → week-2 return above a third. Not signups. Not downloads.
- **Explicitly out:** native app, ratings, host tools, anything automated.
- **Why:** we must know the fill rate before anyone writes app code — and the results paperwork (C8, M6) is the only output of this phase that cannot be reconstructed later.

### R1 — The app you can book on · weeks 4–12
- **Goal:** three fixed weekly slots at 70%+ fill, refund guarantee live and used.
- **Ships:** browse and book, card payment, cash-refundable wallet, **spot resale with full refund**, waitlist, check-in, host tools v1, admin console.
- **Explicitly out:** earned ratings, highlights, crews, memberships.

### R2 — The loop · weeks 12–20
- **Goal:** week-12 repeat ≥ 40%, no-show < 8%.
- **Ships:** earned level rating (`specs/ranking.md`), auto team balancing at check-in (`specs/balancer.md`), post-match voting, reliability score and its consequences, score entry.
- **Explicitly out:** anything that doesn't move repeat or no-shows.

### R3 — Reasons to come back · weeks 20–32
- **Goal:** 2.5+ games per player per month, host-run share ≥ 30%.
- **Ships:** shareable player card, crews, highlights pilot at two venues, women's / over-35 / beginner formats, membership tiers.

### R4 — Platform · weeks 32+
- **Goal:** host-run share ≥ 50%, second district live, first corporate accounts.
- **Ships:** venue console, corporate accounts and invoicing, multi-city passport, insurance attach, Arabic localisation.

---

## 7. Feature list

Priority: **P0** blocks the release · **P1** ships in it · **P2** is the first thing cut.
Metrics: **FR** fill rate · **RPT** week-12 repeat · **FREQ** games/player/month · **NS** no-show rate · **HOST** host-run share · **CAC** payback in games.

### A · Discovery & booking
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| A1 | Tonight view — hero fixture + quieter list | — | P0 | R1 | FR |
| A2 | Filter by level, time, venue, format | G05 | P1 | R1 | FR |
| A3 | Game detail — squad, who's playing, venue info | G10 | P0 | R1 | FR |
| A4 | Book a place with card / Apple Pay / Google Pay | — | P0 | R1 | FR |
| A5 | Join waitlist when full | G08 | P0 | R1 | FR |
| A6 | Countdown to kick-off | — | P2 | R1 | FR |
| A7 | Directions, gate, parking, what to bring | — | P1 | R1 | NS |
| A8 | Standing booking — "every Thursday" | G11 | P1 | R3 | FREQ |
| A9 | Invite a friend to a specific game | G10 | P1 | R3 | CAC |
| A10 | Calendar sync | — | P2 | R3 | NS |
| A11 | **"Three of your crew are in" push when someone you play with books** | G10 | P0 | R2 | FR |
| A12 | Streak-at-risk nudge — only when they have a live streak | G11 | P2 | R3 | FREQ |

### B · Money & trust *(the wedge)*
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| B1 | Card payment + wallet top-up | — | P0 | R1 | FR |
| B2 | **Cash-refundable wallet** — never credit-locked | G03 | P0 | R1 | RPT |
| B3 | **Unconditional cash refund when cancelled >24h out** | G02 G03 | P0 | R1 | RPT |
| B4 | **Spot auto-lists to waitlist on cancel; cash refund either way** | G02 G08 | P0 | R1 | FR RPT |
| B5 | Late release (<24h) refunds only if it resells; otherwise forfeits and costs reliability | G02 G07 | P0 | R1 | NS |
| B5a | No-show without cancelling — the only case that forfeits | G07 | P0 | R1 | NS |
| B5b | Cross-game waitlist — "any Tier-4 game, Thursday evening" | G08 | P1 | R2 | FR |
| B5c | Spend earned free-game credits on released seats first | G08 | P2 | R3 | FR |
| B6 | Transparent pricing — no fee at checkout that wasn't on the card | G01 | P0 | R1 | RPT |
| B7 | Receipts and payment history | — | P1 | R1 | — |
| B8 | Membership tiers — games/month, off-peak, priority | G01 | P1 | R3 | FREQ |
| B9 | Public refund policy page, written in plain English | G02 | P1 | R1 | CAC |
| B10 | **Move me to another game this week instead of refunding** | G02 | P1 | R2 | RPT |
| B11 | Dynamic off-peak pricing | G04 | P2 | R4 | FR |

### C · Level & matchmaking *(the moat)*
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| C1 | Onboarding self-assessment to seed a level | G05 | P0 | R2 | RPT |
| C2 | **Earned rating — opponents, your own rating, the result** | G05 | P0 | R2 | RPT |
| C3 | Fast correction inside first three games | G05 | P0 | R2 | RPT |
| C4 | Show a coarse tier, never the raw number | G05 | P1 | R2 | RPT |
| C5 | Surface games at the player's level by default | G05 | P1 | R2 | FR |
| C6 | Sandbagging / smurf detection and flagging | G05 | P2 | R4 | RPT |
| C7 | Rating portability between cities | G20 | P1 | R4 | RPT |
| C8 | Collect match results from game one — *even on paper* | G05 | P0 | **R0** | — |
| C9 | Host calibration — weight each host's read by their track record | G05 | P1 | R3 | RPT |
| C10 | Margin of victory, capped — only on a host-confirmed score | G05 | P2 | R3 | RPT |

> **C8 is the single most important row in this document.** The dataset cannot be bought and starts accruing the day we begin. It ships in R0, before any software.

### D · The game itself
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| D1 | Check-in (QR at the pitch) | G07 | P0 | R1 | NS |
| D2 | **Auto team balancing from who actually checked in** | G06 | P0 | R2 | RPT |
| D3 | Half-time rebalance prompt past a 3-goal gap — proposed, never applied | G06 | P2 | R2 | RPT |
| D4 | Pitch / formation view with shirt numbers | G06 | P1 | R2 | RPT |
| D5 | Bib and shirt-number assignment | G06 | P1 | R2 | — |
| D6 | Score entry (host or any player, with confirmation) | G11 | P0 | R2 | — |
| D7 | Goal and assist attribution | G11 | P1 | R3 | FREQ |
| D8 | **Sides named after the night's real fixture, on big-match nights only** | G11 | P1 | R2 | FREQ |
| D9 | Exhaustive-search balancer — every legal split scored, not a greedy draft | G06 | P0 | R2 | RPT |
| D10 | Variety — pair history so the same split never repeats week on week | G06 | P1 | R2 | RPT |
| D11 | Minimum-change re-solve when someone drops after the sheet is out | G06 | P1 | R2 | NS |
| D12 | "Why am I on this side?" — one line, on tap, never names anyone weaker | G06 | P2 | R2 | RPT |
| D13 | The balancer says when it **can't** balance tonight's crowd | G06 | P1 | R2 | RPT |

### E · Reliability & behaviour
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| E1 | **Reliability score — visible and earned** | G07 | P0 | R2 | NS |
| E2 | No-show and late-cancel tracking | G07 | P0 | R2 | NS |
| E3 | Graduated access gating on oversubscribed games | G07 | P1 | R2 | NS |
| E4 | Rewards — priority booking, free game every tenth | G07 | P1 | R2 | RPT |
| E5 | Report a player / conduct flow | — | P1 | R2 | — |
| E6 | Block list — never placed in the same game | — | P2 | R3 | RPT |

### F · Community
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| F1 | Player profiles | G10 | P1 | R2 | RPT |
| F2 | **Crews — auto-suggested after three shared games** | G10 | P0 | R3 | RPT |
| F3 | Book as a crew, adjacent places held | G10 | P1 | R3 | FREQ |
| F4 | Crew chat | G10 | P2 | R3 | RPT |
| F5 | Follow a player | G10 | P2 | R3 | RPT |
| F6 | Head-to-head record | G11 | P2 | R3 | FREQ |
| F7 | **Nemesis — the player whose side you can't beat, surfaced before you book** | G11 | P1 | R3 | FREQ |
| F8 | Status visible on the team sheet — streak, reliability, milestones | G07 | P2 | R3 | NS |

### G · Progress & occasion
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| G4 | Your upcoming games | — | P1 | R2 | NS |
| G5 | Man of the match voting | G05 G11 | P0 | R2 | RPT |
| G6 | Trophies and milestones | G11 | P1 | R3 | RPT |
| G7 | **Shareable player card** | G10 G11 | P1 | R3 | CAC |
| G8 | **Unfinished business — the same two sides offered a rematch next week** | G10 G11 | P1 | R3 | FREQ |
| G9 | Your season in review — shareable wrap at season end | G11 | P1 | R3 | CAC |
| G10 | Venue leaderboard — top scorer at this pitch this month | G11 | P2 | R3 | FREQ |

### H · Media
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| H1 | Fixed-camera integration at anchor venues | G09 | P0 | R3 | RPT CAC |
| H2 | Auto-clipped highlights per player | G09 | P0 | R3 | RPT |
| H3 | Clip delivery + push within 90 minutes | G09 | P1 | R3 | RPT |
| H4 | Share to WhatsApp / Instagram | G09 | P1 | R3 | CAC |
| H5 | Watermark with venue and booking link | G09 | P1 | R3 | CAC |
| H6 | **Goal of the week — voted from the week's clips** | G09 G11 | P1 | R3 | CAC |

> H1 needs a camera and a venue agreement before a line of code. Start with **one rented camera at two venues** and prove the retention lift before buying anything.

### I · Host tools *(the leverage)*
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| I1 | Host application and onboarding | G13 | P0 | R1 | HOST |
| I2 | Create and schedule a game | G13 | P0 | R1 | HOST |
| I3 | Roster management | G13 | P0 | R1 | HOST |
| I4 | Collect payments — we take a cut, host never chases cash | G13 G14 | P0 | R1 | HOST |
| I5 | Tick players in | G07 | P0 | R1 | NS |
| I6 | Automatic no-show flagging | G07 | P1 | R2 | NS |
| I7 | Host payout + host plays free | G13 G14 | P0 | R1 | HOST |
| I8 | Host reputation and rating | G13 | P2 | R3 | HOST |
| I9 | Import an existing WhatsApp group roster | G13 | P1 | R2 | HOST CAC |
| I10 | **Host read — three taps at full time, never seen by players** | G05 | P0 | R2 | RPT |

### J · Venue
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| J1 | Venue console — calendar and utilisation | G16 | P0 | R4 | FR |
| J2 | Off-peak revenue-share terms in-product | G04 G16 | P0 | R4 | FR |
| J3 | Dynamic pricing on dead hours | G04 | P1 | R4 | FR |
| J4 | Automated venue payouts | G16 | P0 | R4 | — |
| J5 | Right-of-first-refusal scheduling | G16 | P1 | R4 | FR |

### K · Corporate
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| K1 | Corporate account + seat management | — | P0 | R4 | FR |
| K2 | Bulk booking and invoicing | — | P0 | R4 | FR |
| K3 | Company league | G11 | P1 | R4 | FREQ |
| K4 | Participation reporting for HR | — | P2 | R4 | — |

### L · Formats & inclusion
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| L1 | Women's games | G12 | P0 | R3 | FR |
| L2 | Mixed games | G12 | P1 | R3 | FR |
| L3 | Over-35 games | G12 | P1 | R3 | FR |
| L4 | True-beginner games with a different onboarding | G12 | P0 | R3 | RPT |
| L5 | Format-specific conduct rules and moderation | G12 | P1 | R3 | RPT |
| L6 | **Keeper programme — play free, priority booking, named on the sheet** | G06 | P0 | R2 | FR RPT |

### M · Ops & admin
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| M1 | Admin console — games, refunds, disputes | — | P0 | R1 | — |
| M2 | Same-hour support response, published | G18 | P1 | R1 | RPT |
| M3 | Weather / venue-failure cancellation flow with automatic refunds | G02 | P0 | R1 | RPT |
| M4 | Underwriting cap — max guaranteed games per venue per month | Risk | P0 | R1 | — |
| M5 | Chargeback and fraud handling | — | P1 | R2 | — |
| M6 | **The R0 results spreadsheet — three tabs, filled the same night** | G05 | P0 | **R0** | — |
| M7 | Manual resale-and-refund flow run by hand in WhatsApp | G02 | P0 | **R0** | RPT |
| M8 | Goal difference recorded and reportable as a distribution | G06 | P0 | **R0** | RPT |

### N · Growth
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| N1 | First game free | G01 | P0 | R1 | CAC |
| N2 | Two-sided referral — both get a free game | G10 | P0 | R2 | CAC |
| N3 | App-store and search presence for the category, city by city | G15 | P1 | R1 | CAC |
| N4 | Newcomer channels — relocation, co-living, universities, gyms | G20 | P1 | R1 | CAC |
| N5 | Organiser recruitment pipeline (incl. the incumbents' organisers) | G13 G14 | P0 | R1 | HOST |
| N6 | Guest pass — members bring someone free once a month | G10 | P1 | R3 | CAC |
| N7 | "Sign a player" — free game once your referral plays their second | G10 | P1 | R2 | CAC |

### O · Platform
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| O1 | Multi-city support | G20 | P0 | R4 | — |
| O2 | Portable player passport | G20 | P0 | R4 | RPT |
| O3 | Group accident insurance attached to membership | G19 | P1 | R4 | RPT |
| O4 | Arabic localisation | — | P1 | R4 | CAC |
| O5 | Notifications — reminders, waitlist hits, clips, team sheets | G07 | P0 | R1 | NS |
| O6 | **Team sheet drops in WhatsApp at 18:00 — a fixed ritual** | G10 | P0 | R2 | NS FREQ |
| O7 | Matchday bot inside an existing WhatsApp group | G13 | P1 | R3 | HOST CAC |

### P · Staying power *(Dubai-specific)*
| ID | Feature | Gap | Pri | Rel | Moves |
|---|---|---|---|---|---|
| P1 | **Summer mode — indoor and dawn slots, shorter games, May–Sep** | G12 | P0 | R3 | RPT |
| P2 | Heat and weather-aware rescheduling, with automatic refunds | G02 | P1 | R3 | RPT |
| P3 | Lapse detection — reach out at three missed weeks, not thirteen | G07 | P1 | R3 | RPT |
| P4 | Win-back offer tuned to why they stopped | G07 | P2 | R4 | RPT |

**Count:** 127 features. The bottom third is cuttable and R1 still ships something coherent.

---

## 8. Non-goals

| We are not building | Why |
|---|---|
| A social feed | We are not competing for attention; we are competing for Thursday evenings. |
| Public pitch block-booking | Singapore reviewers accuse Stranger Soccer of taking slots from locals — a regulatory and PR exposure we decline to buy (G17). |
| Coaching, training plans, drills | Different job, different buyer, drains focus from liquidity. |
| Other sports | Not until football is dense in two districts. Every sport restarts the liquidity problem from zero. |
| Owning venues | Capital-intensive; contracts give most of the benefit. |
| A native app in R0 | A booking page and a WhatsApp group run twenty games a week. Build after the fill rate is known. |
| Gamified streak-badge sprawl | Streaks and badges without a real level system are cosmetic — that's precisely what CeleBreak shipped instead of fixing matchmaking (G11). |

---

## 9. Success metrics

| Metric | Target | Why it's the one that matters |
|---|---|---|
| **Fill rate** | 85%+ | Master metric. Sets margin *and* game quality simultaneously. Below 70% nothing else saves the unit. |
| **Week-12 repeat** | 40%+ | The number an investor should ask for first. |
| **Games / player / month** | 2.5–4 | Frequency, not headcount. 400 players at three a month beats 4,000 at one. |
| **No-show rate** | <5% | Direct proxy for whether the reliability system works. Every no-show damages nine other people's evening. |
| **Host-run share** | >50% | The line between an operations business and a platform. |
| **CAC payback** | ≤3 games | Measured in games, not months. |

**Review cadence:** fill rate and no-shows weekly; repeat, frequency and host share monthly; CAC payback per cohort.

---

## 10. Risks

| Risk | Mitigation | Early-warning signal |
|---|---|---|
| **Venue supply is the real constraint**, not demand | Test in week one, before any product work. Sign off-peak ROFR rather than exclusivity — far easier to get | Fewer than 3 venues signed by week 3 |
| **This is an ops business wearing an app** | Budget operators before engineers. Expect bibs in car boots and 6pm host cancellations | Engineering headcount exceeding ops headcount |
| **Generosity is expensive at low fill** | M4 underwriting cap: fixed number of guaranteed games per venue per month | Underwriting spend rising while fill rate is flat |
| **Liquidity can't be bought city-wide** | Hold the district discipline. Marketing spend across a whole city produces nobody | Acquisition rising while per-slot fill is flat |
| **Incumbent price response** | Our cost base is structurally lower; they cannot match the refund guarantee without breaking their margin | A matching refund policy announced by either |
| **Rating system rejected as unfair** | Coarse tiers, fast correction, transparent appeals. Never show the raw number | Complaint volume on placement; drop-off after game one |
| **Host channel doesn't convert** | Hosts play free and earn per head. If it stalls, the whole platform thesis weakens | Fewer than 5 hosts signed by week 12 |

---

## 11. Open questions

Every bracketed number below must be replaced with a measured one before the release that depends on it.

| # | Question | Owner | Needed by |
|---|---|---|---|
| Q1 | `[NEEDS VALIDATION]` What per-head price clears at 85% fill in our district? Incumbent is AED 59 in Dubai | Commercial | R0 exit |
| Q2 | `[NEEDS VALIDATION]` Will venues accept off-peak revenue share, and at what split? | Commercial | Week 3 |
| Q3 | `[NEEDS VALIDATION]` Actual CAC by channel — referral vs. newcomer channels vs. touchline conversion | Growth | R1 exit |
| Q4 | `[NEEDS VALIDATION]` Fixed-camera cost per venue and the retention lift it actually produces | Product | R3 entry |
| Q5 | `[NEEDS VALIDATION]` Group accident insurance premium per player per month in the UAE | Commercial | R4 entry |
| Q6 | How many games does the rating need before placement is trustworthy? | Product | R2 entry |
| Q7 | Payment provider and whether instant cash refunds are feasible at our volume | Engineering | R1 entry |
| Q8 | Which district? Named, with its pitches and their current midweek utilisation | Commercial | Week 1 |
| Q9 | Does the resale refund create a gaming loophole (book-to-hold, release for profit)? | Product | R1 entry |
| Q10 | Legal review of insurance attach and liability at partner venues | Legal | R4 entry |

---

*Figures attributed to CeleBreak and Stranger Soccer come from public app-store listings, help-centre pages, company profiles and user reviews as summarised in the competitive teardown. They are directional, not audited. Review quotations are individual opinions.*
