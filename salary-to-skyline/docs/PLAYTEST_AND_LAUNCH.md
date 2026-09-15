# Player research, commercial tests, and launch plan

All numerical thresholds here are proposed internal gates, not sourced market averages or validated predictions. There is no reliable way to guarantee a hit. The objective is to learn cheaply whether this particular experience deserves further investment.

## P1. Prototype research: test enjoyment before scale

Recruit 5–8 initial participants who have played management, life-simulation, or tycoon games. Include people familiar with Dubai and people who are not. Do not recruit only friends who are invested in being encouraging.

Use a 20–30-minute session. Let them start unaided, then give a prepared first-purchase state when necessary to test the investment loop without waiting for savings. Record which start they actually used; never confuse a prepared rich test save with natural progression.

Observe where they hesitate, what they compare, why they choose, what they expect to happen, and whether they choose to play another month when told they can stop. Afterwards, ask what felt satisfying, what felt like work, what surprised them unfairly, and what they would do next.

Ask about their last actual mobile-game purchase and the reason they bought it. A hypothetical “yes, I would buy this” is weaker evidence than a later purchase. Do not lead with “Isn't this addictive?” or tell them the desired answer.

A useful early pass is not universal praise. It is players understanding the central choice, forming their own goals, and finding another decision they want to make. Repeated confusion or boredom is a reason to redesign before adding content.

## P2. Longitudinal alpha

After the slice is repaired, invite roughly 30–50 people to play naturally for a week. Give no required daily assignment and no prize for repeated play. Compensating an interview, where appropriate, should not depend on session count, a positive review, or spending.

Measure the three starts separately. Observe whether university players remain interested during qualification, whether work-first players find their first unit at an acceptable pace, and whether a market setback leads to meaningful recovery or abandonment.

Ask for a short end-of-week account: their best decision, worst decision, next goal, and what would make them stop. That yields design evidence beyond a retention percentage. This sample can reveal severe issues; it cannot precisely estimate global revenue or retention.

## P3. Optional telemetry with clear limits

Instrument only after choosing an owner-approved, appropriate privacy design. Local anonymous logs for testing are sufficient initially. Gameplay must work with analytics disabled or unavailable. No contacts, real financial data, location, personal income, wallet addresses, advertising identifier, or background tracking is needed.

Suggested events: `first_open`, `life_started`, `route_selected`, `month_committed`, `listing_compared`, `first_investment`, `property_purchased`, `offplan_booked`, `handover_completed`, `first_rent_earned`, `shortfall_forecast`, `recovery_selected`, `business_opened`, `milestone_earned`, `campaign_completed`, `new_life_started`, `paywall_viewed`, `purchase_verified`, `share_previewed`, and `share_completed_where_observable`.

Event properties can include build/rules version, anonymous test/session ID, route, simulated month, elapsed active time, and broad scenario category. Avoid copying every player-entered name or detailed ledger into analytics. Minimize retention, disclose collection accurately, and honor opt-out. Native share systems may not confirm actual public posting; a share-sheet completion is not proven social publication.

Use real event timestamps for analytics only, separate from the game calendar. Handle offline uploads and duplicate event IDs without double-counting. Do not require constant connectivity to measure or play.

## P4. Metric definitions and provisional gates

| Measure | Definition | Initial decision hypothesis |
|---|---|---|
| Tutorial completion | Completed core opening / eligible first-open players, with explicit eligibility exclusions | Aim for at least 75%; inspect route and device differences. |
| D1 return | First-open players returning 24–48 hours after first open | Investigate a target around 35%+, not a promise. |
| D7 return | First-open players returning 168–192 hours after first open | Investigate around 15%+, alongside completion/satisfaction. |
| First-property pacing | Active minutes and simulated months to first whole unit, segmented by route | Work-route hypothesis 45–90 active minutes; study-route quality measured separately. |
| Meaningful decisions | Decisions with a distinct economic/life consequence, not repeated Next clicks | Identify long empty stretches; do not reward extra taps as success. |
| Purchase conversion | Verified unique campaign purchasers / all valid eligible first-open players | Test actual willingness to pay; do not report only paywall viewers as “install conversion.” |
| Paywall conversion | Verified purchasers / unique paywall viewers | Separate funnel diagnostic, not a replacement for the metric above. |
| Net receipts per acquired user | Actual store-adjusted revenue for a cohort / attributable acquired users | Must justify acquisition cost and ongoing costs before scaling. |
| Campaign completion | Players completing earned first arc / relevant start cohort | Interpret with active playtime and post-completion satisfaction. |
| Save integrity | Confirmed lost/corrupt progress incidents | Any reproducible loss is a release blocker until resolved. |

Always show numerator, denominator, time window, platform, build, route, traffic source, and uncertainty. Exclude test accounts/bots by a recorded rule, not because their behavior is inconvenient. Report uncertainty intervals and avoid strong decisions from a handful of returns or purchases.

At a finite 6–9-hour campaign, a player who finishes happily and does not return on day seven differs from someone who quits confused after two minutes. Track completion and voluntary continuation rather than stretching the game to improve one metric.

## P5. Paid pilot: scope and economics

Only run a pilot with a complete-enough product, approved budget, accurate store listing, purchase verification, and no known integrity blockers. Select audiences around interest and creative fit; do not claim a particular country is cheap or profitable without current evidence.

Use a small number of creative hypotheses from genuine gameplay. Compare audience behavior beyond installs: completed opening, first property, purchase, refund, and revenue. An ad featuring a villa may attract different users from an ad about career strategy. Neither is automatically better.

Illustrative single-unlock economics at 39.99 actual AED, assuming a 15% platform commission for an eligible enrolled program and excluding tax/refunds/adjustments:

| Install-to-purchase conversion assumption | Initial net revenue per install before other costs |
|---|---:|
| 3% | AED 1.02 |
| 5% | AED 1.70 |
| 8% | AED 2.72 |

At 29.99 and 5%, the equivalent is about AED 1.27. At 39.99, 5%, and a 30% fee assumption, it is about AED 1.40. These are calculations from assumptions, not forecasts. The Apple 15% program has eligibility/enrollment conditions; see the source register. Use actual store reports and applicable terms in the business model.

Acquisition below these values is not automatically profitable because development, assets, support, refunds, analytics, and other costs still exist. At a hypothetical AED 100,000 fixed build cost, 39.99 with an assumed 15% fee yields about 33.99 per purchase before other deductions, requiring roughly 2,942 purchases to recover that fixed amount alone. This is not a budget estimate for the project.

Do not attribute organic players to an ad merely because they arrived the same week. Use an agreed attribution design and compare paid cohorts separately. Do not extrapolate expansion revenue before there is evidence that people want an expansion.

## P6. What to improve depending on the evidence

High creative clicks but poor opening completion: investigate misleading positioning, slow onboarding, performance, and readability before more advertising.

Good opening but poor voluntary return: inspect whether choices remain interesting, first-property pacing, university downtime, and whether the city changes enough to feel rewarding.

Good returns but weak purchases: test demo boundary, full-game value clarity, price, trust, and restore reliability. Do not respond by making the free game miserable.

Good purchases but refunds/support issues: prioritize broken expectations, save loss, misleading content, localization, and stability.

Strong play and purchases but weak acquisition economics: limit paid scale; test honest creatives and channels, improve conversion carefully, or reduce production cost. Do not declare profitability from gross sales alone.

## P7. Go/no-go before wider release

A go decision needs owner approval, a meaningful set of real-player observations, all critical tests closed, purchase/restore evidence, no known save-loss issue, a coherent art/brand package with rights recorded, honest store claims, and a funding plan for support.

A pause decision is appropriate when the property loop is fundamentally dull, the university route cannot sustain play, a single exploit dominates, acquisition is uneconomic, or the product still depends on misleading advertising. Pause does not mean the idea is worthless; it means the current build has not earned further scale.

Set the next milestone from the evidence. Do not promise a hit, fabricate user enthusiasm, or use purchases to compensate for gameplay that is not enjoyable.
