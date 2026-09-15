# Economy specification and reference fixtures

**Version 1.0 — fictional simulation rules.** These are engineering definitions and initial balancing assumptions, not Dubai market data, bank offers, legal rules, investment advice, or a validated profitable strategy. Do not silently translate these assumptions into claims about real life.

This document is authoritative for formulas, account semantics, and transaction sequencing. The master brief is authoritative for product intent. Any conflict must be recorded and resolved before implementation rather than guessed around.

## E1. Units, precision, and money API

In-game currency is **virtual dirhams**, shown as `VDh` in English, with a reviewed Arabic equivalent. Explain on first use that it has no cash value. The real-money store uses the platform's localized actual currency/price, visually separated from VDh.

Store money in signed 64-bit integer minor units in memory: VDh 1.00 = 100 minor units. Use decimal strings in JSON for money, large IDs/counters where necessary, and RNG state. Reject malformed, non-finite, out-of-range, and unexpectedly signed values before conversion. In-game valid-value limits must leave headroom for multiplication and summation; do not depend on overflow wrapping.

Annual nominal interest rates are integer basis points (`500` = 5%). Allocation ratios also use basis points unless a documented higher precision is necessary. Fractional holdings use integer share units with a fixed scale. Money multiplication/division must specify rounding: half away from zero for signed monetary results, implemented and tested without first converting authoritative balances to an imprecise floating-point representation.

An amortization formula may be evaluated using controlled high-precision/validated numerical calculation at quote creation, then rounded once into the scheduled minor-unit payment. Every subsequent interest/principal posting uses the documented integer rounding sequence. Validate quote results against the independent fixtures here. Never derive the loan balance by multiplying an approximate displayed payment by elapsed months.

Expose a small money API: safe addition/subtraction, ratio multiplication with checked intermediates, formatting, percentage calculation, nonnegative allocation with remainder, and decimal-string serialization. Reject impossible configuration instead of substituting zero.

## E2. Accounts and the four visible totals

Use an append-only transaction journal plus current balances; a lightweight double-entry implementation is preferred for reliability. Each entry has transaction ID, command ID, entity ID, simulation month, account, signed amount/debit-credit semantics, source reason, and related asset/contract IDs. The same command must not post twice. Balance each transaction in the chosen ledger convention.

Required account families: operating cash; refundable tenant-deposit cash; voluntary reserve allocations; receivables; ready property at cost; off-plan prepayments; financial holdings; vehicles/equipment; mortgage/education/business debt; tenant-deposit liabilities; advance-rent liabilities; due bills/arrears; revenue/expense categories; valuation adjustments; and owner capital/transfers.

**Spendable cash** = owned liquid cash minus refundable restricted deposits, unearned-rent reserve under the game's chosen reserve policy, and voluntary earmarked amounts. Do not deduct the same reserved amount twice when it appears in multiple UI groups. Voluntary reserves remain the player's asset and can be released with a warning. Refundable deposits cannot fund a car purchase.

**Normal monthly surplus** is a labeled forward estimate: recurring expected income minus operating expenses, debt service, and selected essential living expenses. Show assumptions. It is not necessarily this month's cash movement because annual rent and major purchases are lumpy.

**Net worth** uses the selected asset-value convention minus recognized debt and liabilities. A second view can show conservative liquidation value. Display off-plan carrying value and future commitments separately as below. Do not mix book values for some assets with optimistic gross future values for others without labeling them.

**Upcoming commitments** show dated obligations, including future off-plan installments not yet recognized as due debt. A positive net worth must never hide an unfunded near-term payment.

The player overview consolidates all wholly owned player businesses. Internal rent, owner contributions, and withdrawals cancel on consolidation. Separate business detail screens can still show each entity's own economics.

## E3. Monthly boundary and transaction ordering

Let state S(m) represent the start of simulated month m. The player can perform validated immediate commands or schedule boundary actions. Each committed immediate action increments the state revision and saves. A quote includes the revision and expiry, preventing completion against stale funds or an already-sold asset.

`AdvanceMonth` creates a proposed S(m+1) without mutating the live state. Use this sequence consistently:

1. Validate outstanding mandatory decisions, current commitments, account state, and command uniqueness. Resolve the player's selected schedule for month m.
2. Earn existing employment income and study/job progress for m. A new role selected at the boundary is active next month unless an explicit starting fixture says otherwise. Commission rules are predefined and seeded.
3. Accrue rent for leases active during m, recognize the appropriate portion of existing advance rent, and collect contractual receipts due in m. Do not accrue rent on units that only settle at this boundary.
4. Resolve current business operations and actual property operating costs for m. Record receivables/arrears where a contractual payment fails; never silently set a bill to paid.
5. Resolve scheduled personal expenses and interest/principal payments due for m. Insufficient cash enters a documented recovery/arrears path; it is not an arithmetic crash or infinite block.
6. Progress construction and activate milestone invoices. Apply approved purchase/sale/assignment/loan settlements, ensuring financing, cost coverage, ownership, and liabilities transfer together. A closing completed here is rentable from m+1.
7. Update market state, finite supply, listings, and eligible future events. Public market/news updates refer to the same underlying changes. Do not pay appreciation as income.
8. Set next-month calendar, schedules, forecasts, and relevant notices. Check all invariants and persist S(m+1) atomically before displaying the recap.

A mandatory choice with no selected response can stop the preview. A chosen default/restructuring route must permit progress. Preview can reveal expected salary, contractual amounts, and scenario ranges but not exact future hidden random prices or event outcomes. Running preview twice cannot advance RNG or give a new outcome.

Automatic multi-month advance executes this same operation one month at a time, saving at each boundary and stopping before required intervention. It is not a second simplified economy implementation.

## E4. Ready property and cash needed

For a purchase:

```text
accepted_valuation_basis = min(purchase_price, lender_valuation)
maximum_asset_loan = accepted_valuation_basis * permitted_LTV
approved_loan = min(requested_loan, maximum_asset_loan, affordability_limit)
cash_purchase_component = purchase_price - approved_loan
cash_needed_now = cash_purchase_component + acquisition_fees + initial_work
recommended_additional_reserve = configured essential/carrying-cost months
```

The reserve recommendation is not an extra government fee. Fees are explicit fictional configuration, never an unexplained hard-coded “Dubai tax.” Loan origination fees and acquisition costs cannot appear twice in both transaction and loan calculations.

Sample fixture: price 600,000; loan 480,000; combined illustrative acquisition costs 36,000; no immediate renovation. Closing consumes 156,000 player cash and creates a 600,000 ready-property asset plus 480,000 debt. Acquisition costs are a separately tracked sunk cost for investment performance. Valuation does not automatically increase by the fee amount. Absent market movement, net worth declines by those fees.

A personal residence has occupancy expense effects but zero external rental income. Selling a residence forces a valid next housing arrangement; it cannot remove essential expenses through an undefined state.

## E5. Mortgage amortization and underwriting

For principal P, nominal annual rate a, monthly rate r = a/12, and n remaining months:

```text
scheduled_payment = P * r / (1 - (1 + r)^(-n))
when r == 0: scheduled_payment = P / n
interest_m = round(opening_principal_m * r)
principal_paid_m = min(opening_principal_m, rounded_payment - interest_m)
closing_principal_m = opening_principal_m - principal_paid_m
```

A configuration producing a negative principal payment needs an explicitly supported product; disallow it in v1. The final payment is adjusted to settle the exact remaining balance plus final interest. No residual penny balance or negative debt. A variable rate resets at defined months and recalculates the remaining payment; never change it without notice.

### Independent reference values

| Fixture | Principal | Nominal annual rate | Term | Rounded monthly payment | Month-1 interest | Month-1 principal paid | Month-1 closing principal |
|---|---:|---:|---:|---:|---:|---:|---:|
| MORT-A | 480,000.00 | 5% | 300 | 2,806.03 | 2,000.00 | 806.03 | 479,193.97 |
| MORT-B | 224,000.00 | 5% | 300 | 1,309.48 | 933.33 | 376.15 | 223,623.85 |
| EDU-A | 50,000.00 | 8% | 120 | 606.64 | 333.33 | 273.31 | 49,726.69 |
| ZERO-A | 12,000.00 | 0% | 12 | 1,000.00 | 0.00 | 1,000.00 | 11,000.00 |

The education fixture illustrates why rounding order matters: use rounded payment minus rounded interest, not a separately rounded difference between their unrounded theoretical values.

Proposed initial fictional underwriting: maximum total scheduled debt service 35% of reliable monthly income; income includes recurring salary plus 70% of eligible, documented trailing net rental income after operating expenses and before debt service. Do not subtract existing mortgage payments inside eligible rental income and then again inside the debt-service numerator. Require history before rent qualifies. Volatile crypto gains and hoped-for off-plan rent do not qualify. Variable commissions use a conservative trailing rule. Student lending is a separate disclosed product, not the same salary test.

These values are balancing knobs, not claims about UAE lending. Affordability warnings supplement formal approval; being approved is not a promise that a deal is safe.

## E6. Rental income: forecast versus actual

A property's forecast must separate these concepts:

```text
potential_annual_rent = scheduled_monthly_rent * 12
effective_forecast_rent = potential_annual_rent * (1 - forecast_vacancy_fraction)
forecast_NOI = effective_forecast_rent - property_operating_costs
forecast_cash_after_debt = forecast_NOI - scheduled_annual_debt_service
gross_yield_on_price = potential_annual_rent / purchase_price
net_yield_on_price = forecast_NOI / purchase_price
net_yield_on_total_cost = forecast_NOI / total_acquisition_cost
cash_on_cash_before_tax = forecast_cash_after_debt / cash_invested_at_acquisition
```

Name the denominator. NOI excludes mortgage interest/principal and personal living expenses. Cash after debt includes both principal and interest payments. Actual records use actual tenancy and invoices, not the vacancy assumption. Taxes are omitted from this simplified v1 unless an explicit fictional tax model is later added; do not label the result real-world after-tax profit.

Reference RENT-A: price 600,000; annual contractual rent 54,000; forecast vacancy 5%; annual service charges 7,200; maintenance estimate 3,000; management 1,800. Effective rent = 51,300; NOI = 39,300; monthly forecast NOI = 3,275. With MORT-A, monthly estimated cash after debt = 468.97; annual forecast cash after debt = 5,627.64. Gross yield on price = 9%; net yield on price = 6.55%; net yield on total acquisition cost of 636,000 is about 6.1792%. Cash-on-cash on 156,000 is about 3.6075%.

When a unit is actually occupied for all 12 months with those operating costs and no bad debt, actual NOI is 42,000, not 39,300. When it is vacant, do not post a negative “vacancy expense” as well as failing to collect rent.

### Payment cadence and liabilities

An annual rent receipt of 54,000 at commencement is cash received and initially advance-rent liability, not 54,000 of earned profit on day one. Recognize 4,500 each active month; after the first earned month the remaining liability is 49,500. Under the default player-protection policy, unearned rent is earmarked and released as earned. This is a game policy, not a statement of Dubai law.

A refundable 2,250 security deposit increases restricted cash and a deposit liability equally. It does not increase net worth. Refund it or settle an expressly documented deduction at the end of tenancy. Transfers on sale must reconcile both sides.

Management contracts may charge a percentage or fixed fee but not both unless explicitly stated. A maintenance reserve allocation is an internal earmark; the repair invoice is the expense. Reserve consumption is not a second invoice.

## E7. Off-plan investment, valuation, and handover

Represent the pre-title purchase as an `OffPlanContract`, not a ready unit owned and rentable by the player. Fields include contract price, paid principal, fees paid, invoice schedule, remaining commitments, project stage, assignment conditions, notices, and handover status.

Default pre-handover carrying value = paid principal minus recognized impairment. Potential assignment proceeds can be shown as a separate estimated range after unpaid obligations and fees; do not count them as spendable cash or silently use a finished-unit gross valuation as current net worth.

For an 800,000 contract with 20/40/40 schedule: booking is 160,000; four construction installments are 80,000 each; handover amount is 320,000. After booking, record 160,000 invested in the contract and 640,000 future commitments. Do not record an 800,000 owned asset with no matching obligation.

A milestone invoice activates only once its specified trigger occurs. Completion reaching 25%, 50%, 75%, and 100% can trigger the four 10% construction payments in the example; the final construction payment and the 40% handover amount can be due together. Show that concentration on the calendar before booking. Completion does not auto-debit the same invoice on every subsequent month.

At handover, reconcile all due invoices, financing, contract conversion, title/ownership, fees, and readiness in one transaction. If physical completion occurs but funding fails, keep the correct completed-but-unsettled contract state; do not grant rent or erase commitments.

For assignment, the contract specifies cash paid by the new buyer to the old buyer and the remaining commitment the new buyer assumes. The old buyer receives only the agreed transfer cash less their fees/due settlements. They do not receive gross final-unit price while transferring nothing. The underlying contract has exactly one current buyer.

Cancellation recovery cannot exceed what the fictional contract and actual payments permit. Recovery can be receivable pending resolution, not immediate cash. Buyer default and developer cancellation are different event types with different configured rules. No imported real-world legal guarantees.

## E8. Sale, refinancing, and accounting identity

Ready-property sale proceeds:

```text
cash_to_seller = agreed_sale_price
                 - sale_costs
                 - secured_loan_payoff
                 +/- explicit settlement adjustments
```

Remove ownership and debt in the same atomic settlement. Historical investment performance uses original cash flows and sale proceeds; do not also count the full historical valuation gain a second time in realized profit. A buyer may require several simulated months to emerge. Listing at a huge price does not set the asset's independent appraisal.

Refinance example: replace 400,000 debt with 450,000 debt and pay 5,000 fees. Cash increases by 45,000, debt increases by 50,000, and net worth decreases by 5,000 absent valuation movement. It does not create 45,000 profit. Cooldowns, underwriting, and independent valuations prevent repeat-loop abuse.

Transfer checks apply to vehicle sales, businesses, and fractional holdings as well. Currency or asset quantity cannot be created by cancelling and reopening an action.

## E9. Market model: a bounded, interpretable starting point

Use district-level latent conditions rather than simulating a full real housing market. Monthly demand, vacancy, supply completions, employment access, amenity changes, financing conditions, and market sentiment drive separate rent and sale-value indices. Update these consistently before producing news explanations.

A starting implementation can use dimensionless normalized factors and bounded monthly adjustments:

```text
rent_pressure = w_jobs * jobs_change
              + w_access * access_change
              - w_supply * completed_supply_ratio
              - w_vacancy * vacancy_gap
rent_index_next = rent_index * (1 + clamp(rent_pressure + seeded_noise, -rent_cap, rent_cap))

price_pressure = w_rent * rent_trend
               - w_rates * financing_cost_change
               + w_confidence * sentiment
               + w_expectation * new_information_about_future_projects
price_index_next = price_index * (1 + clamp(price_pressure + seeded_noise, -price_cap, price_cap))
```

Initial normal monthly caps might be 1% for rent and 2% for prices, with separately authored stress scenarios allowing larger moves. These are game parameters, not market estimates. Do not set all weights to maximum or guarantee positive drift. Calibrate through multi-seed distributions, not a single winning run.

A property's appraisal derives from district index, type, area, condition, and comparable completed transactions. Its asking price is a seller decision. Cap the influence of the player's own transactions on comparables so tiny self-generated trades cannot inflate the entire market.

Transport/job announcements reveal information gradually. Some expectation is already priced in. Cancellation or delay changes expected benefits. New housing supply must affect the same district state that forecasts use. Prevent announcement exploitation through exact future-price disclosure.

Rental inquiry probability should decline as asking rent exceeds the applicable market range, but exact probabilities need testing. Repair quality and furnishing preferences affect the relevant tenant segment, not universal demand. No demographic discrimination.

## E10. Jobs, spending, and business balance

All sample values are starting knobs. A work start might earn 5,200/month with 3,200 essential spending and 20,000 savings. A relevant promotion can raise earning capacity but needs prerequisites and an opening. A first studio example at 280,000 with a 224,000 loan and 16,800 fees requires 72,800 closing cash, before a recommended reserve. It is a target to save toward, not an opening entitlement.

A university path must include an explicit cash-flow plan over its full duration. A part-time study plan cannot exceed the focus capacity. A full-time funding package can use a stipend and a capped loan; its debt balance, interest/grace period, and repayment start are visible. Simulate the funded default path to completion before offering it in onboarding.

Business revenue is limited by demand and service capacity, then reduced by actual operating costs. Buying upgrades cannot instantly multiply both demand and capacity without cause. A player-managed business consumes focus; delegated earnings subtract manager pay. Intercompany transfers cancel in the consolidated view.

Car depreciation and holding costs create a consumption trade-off. A collectible can have bounded uncertain resale value, but the base game must not require speculation in vehicles. Self-occupied homes reduce external rent costs but retain their own carrying and debt costs.

## E11. Independence and scoring

A candidate first-arc criterion: trailing-12-month recurring, managed, non-salary cash generation covers 125% of essential personal living costs; six months of defined essential/carrying/debt costs remain in a liquid reserve; no unresolved arrears; next-12-month committed payments are fundable under a disclosed stress; and one chosen personal goal is achieved.

Income excludes asset sales, debt proceeds, unrealized gains, and owner labor that has not been replaced by paid management. Do not count the same debt cost in both the cash-generation numerator and personal-expense denominator. Display precisely what is included.

Milestone thresholds can be adjusted after observing reasonable play. An engaging campaign should not require extraordinary investment luck or an undocumented exploit. High net worth alone is an alternative achievement, not proof of independence.

## E12. Balance experiments Claude must implement

Run deterministic policy simulations before broad release: salary/savings-only, university-first, prudent ready-property investor, highly leveraged buyer, off-plan-heavy buyer, balanced property/business owner, and crypto-only speculator. These are diagnostic policies, not substitutes for human players.

For every policy and seed, record cash, net worth, debt, arrears, asset counts, commitments, time to first unit, independence timing, biggest drawdown, and reason for failure. Start with at least 100 seeds × 240 months; expand if the tests are fast enough. Reproduce any failure from its seed, version, and action trace.

Flag guaranteed arbitrage, unbounded growth, silent negative balances, universally dominant routes, impossible university completion, and first-property delays beyond the pacing target. Do not assume every risky strategy must win or force every route to the same outcome. Ensure at least several plausible strategies are viable across meaningful variation.

Reference arithmetic fixtures in this pack were independently recalculated. No Godot build, multi-seed balance run, retention experiment, or mobile test has been performed by this document's preparation.
