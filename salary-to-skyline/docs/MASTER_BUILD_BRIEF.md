# SALARY TO SKYLINE
## Mobile life, property, and business simulation — master build brief

**Version:** 1.0 • **Prepared:** 15 September 2026 • **Owner:** Abdulla Almulla

**Status:** Build specification and testable product hypotheses. This is not an implemented game, a verified market forecast, or a guarantee of commercial success. All names are working placeholders pending clearance. All monetary values, job requirements, lending conditions, market behaviors, and progression targets below are fictional game-design assumptions unless explicitly identified as external reference material.

**Player promise:** Start with a rented room. Make choices about education, work, spending, and investment. Buy your first property, survive the obligations, and build a life and an empire you can see.

**One-line pitch:** A charming, Dubai-inspired life simulator in which your next apartment, promotion, off-plan payment, and dream car all compete for the same money.

---

## 1. Instructions to Claude: build the game, not just its menus

Act as a senior Godot engineer working from an owned product vision. Deliver small, playable increments with evidence. Do not replace the requested experience with a dashboard, an idle clicker, a city-builder in which the player acts as mayor, a web prototype presented as a mobile game, or a set of nonfunctional screens.

Read `CLAUDE.md`, this brief, `ECONOMY_SPEC.md`, and `BUILD_PLAN_AND_ACCEPTANCE.md` before implementation. Treat the documented milestone boundary as scope. Read `SOURCES_AND_ASSUMPTIONS.md` before importing factual claims or third-party assets. `starter_balance.json` contains illustrative fixtures, not a complete content database or validated balance.

Inspect the existing repository before changing it. Preserve useful work, existing user decisions, and unrelated projects. When no repository exists, initialize one self-contained Godot project in the user-approved workspace. Do not create cloud services, buy assets, submit an app, change paid products, publish builds, send emails, or merge into a protected branch without the owner's permission.

The first implementation assignment is M0: prove the toolchain and a minimal local monthly simulation. Continue through the staged plan only at its stated gates. A successful compile is not a playable-game acceptance test. Label all mock purchase services, placeholder art, and unexecuted device tests honestly.

Product success is a hypothesis to test. Never report the game as addictive, balanced, commercially validated, or ready for release because the code runs.

## 2. Non-negotiable product decisions

| Decision | Required interpretation |
|---|---|
| Genre | Single-player life-and-property empire simulation with strategic management and light narrative. |
| Setting | An original modern Gulf coastal city inspired by the structure and atmosphere of Dubai. No real districts, developers, banks, universities, companies, vehicle brands, or signature landmarks in shipped content. |
| Technology | Godot 4.x stable, typed GDScript, 2D. Pin the engine and matching export templates after the mobile dependency spike. No beta engine by default. |
| Presentation | Original isometric pixel-art world plus modern, high-resolution financial UI. Inspiration is not permission to copy Kairosoft's assets or distinctive interface. |
| Device | Portrait-first iPhone and Android phones. Test safe areas, tall and compact displays, touch input, and interruption recovery. |
| Time | One normal simulation turn is one month. The player advances time. No real-world construction timers, offline bills, energy refills, or mandatory calendar-day gates. |
| Length | A substantial first life arc should support roughly a week of regular engagement. Target 6–9 active hours as an initial hypothesis, not a guarantee or forced duration. |
| Economy | Jobs, education, experience, living expenses, ready/off-plan/fractional property, rentals, debt, fictional crypto, businesses, cars, and lifestyle spending are connected. |
| Ownership | A unit and its containing building are different entities. Owning one apartment does not mean owning the entire tower. |
| Commercial model | Meaningful free introduction, then a complete permanent campaign unlock. Test pricing. No sales of cash, loan relief, better investment returns, or time acceleration. |
| Network | Core gameplay and existing saves work offline. No mandatory login. Purchases and optional later services can require connectivity. |
| Language | English and Arabic product intent. Architect localization immediately; require human Arabic and right-to-left review before advertising Arabic support. |
| Safety and integrity | All money and investments inside the game are simulated. No real assets, wallets, exchanges, cash-out, betting, or investment recommendations. |

Default engine candidate observed in official sources on the preparation date is Godot 4.7.2 stable. Reconfirm plugin compatibility and pin the exact working version at M0; do not blindly upgrade an existing working project. Source details are in the source register.

## 3. Who the game is for

Design initially for adults and older teenagers who enjoy tycoon games, personal progression, cozy management, and aspirational city life. The audience definition is a hypothesis; final age ratings come from accurate platform questionnaires and the shipped content, not this document.

The interface must be understandable without knowing how a mortgage works. It should still reward a player who learns to read costs, commitments, and market signals. Players should be able to favor different identities: stable professional, patient landlord, careful renovator, entrepreneur, or lifestyle-focused investor.

The game should feel exciting to someone who does not know Dubai. Local familiarity should add recognition, not be required to decode the interface. Explain specialized concepts at the point of use. Do not make legal terminology or regional stereotypes the entertainment.

## 4. The real appeal: five connected promises

**A visible life:** Income changes the room you live in, the car you use, the office you run, and the assets highlighted on the map. A balance sheet alone does not deliver the fantasy.

**Interesting trade-offs:** An attractive car may delay a deposit. A degree may increase later opportunities but cost money now. An off-plan discount may require a payment you cannot safely fund. There is rarely one universal best action.

**A city worth understanding:** Future supply, employment, infrastructure, building quality, and asking prices create opportunities. News should connect to actual simulation changes, not decorate a random price generator.

**Stories players can explain:** “I skipped the car, bought the overlooked studio, and used the rent to build a business” is more memorable than “my income increased by 4%.”

**Respect for time:** The game pauses when you leave. You can accelerate uneventful simulated periods. Success comes from choices, not logging in at the correct real-world hour.

These are design goals, not proven retention mechanisms. The playtest plan specifies how to evaluate them.

## 5. The primary loop and the long-term loop

The minute-to-minute loop is **notice an opportunity or obligation → compare options → make a consequential decision → advance the simulation → understand the result**.

The medium-term loop is **improve earning capacity → protect cash reserves → acquire an asset → manage its income and risks → reinvest or enjoy the gains**.

The campaign loop is **establish independence → buy a first property → construct a resilient portfolio → add a business → earn a sustainable lifestyle → decide what kind of empire to build next**.

Every major decision should communicate four things: what it costs now, what it commits later, its likely benefit, and its uncertainty. The interface must never show future appreciation as guaranteed income.

Not every month needs a dramatic event. It does need either an interesting decision, a useful change in progress, or an obvious reason to skip ahead. Repeated empty turn confirmations are not engagement.

## 6. Opening: the first ten minutes

Open with a brief skippable view from a modest room across the city. A few distant buildings carry dream pins: “My own apartment,” “A business,” “A waterfront home.” Do not open with a giant account-creation funnel or a purchasable starter pack.

| Approximate active time | Experience | What the player should understand |
|---|---|---|
| 0:00–0:40 | Choose avatar, preferred display name, and a dream. Start a fresh life. | This is my character and my future. |
| 0:40–2:00 | Choose work, university with a visible funding plan, or part-time work plus university. | Time, education, and money are connected. |
| 2:00–3:30 | See essential expenses; make one optional spending choice. | Salary is not spare cash. |
| 3:30–5:00 | Tap a nearby building, inspect two units, and bookmark one. | I can own actual units in this city. |
| 5:00–7:00 | Advance the first month; receive a salary or study progress; see the spending consequence. | Time advances when I choose and the math is understandable. |
| 7:00–10:00 | Research a district and make a small, optional fictional fractional investment or build a saving plan. | Property participation can start before a full-unit deposit. |

A fractional purchase is not mandatory, a guaranteed winner, or a tutorial subsidy. A cautious saver must remain a legitimate opening strategy. Do not give a free apartment to compensate for slow progression.

All three starts need a solvent default budget. Show a funded university plan before enrollment; do not let a new player accidentally sign up for several years of unaffordable living costs with no explanation. The prototype can use a prepared “First Purchase” test save for the investment loop, but it must clearly distinguish that from Fresh Start.

Teach one concept at a time. At the first property, the headline is “Cash needed now” and “Expected cash after costs.” Yield formulas are optional detail. The player can reopen every explanation later.

## 7. Calendar, focus, and the week-long arc

Use `month_index` as the authoritative simulation clock. Character age, academic progress, job experience, contracts, construction, and economic events derive from it. Wall-clock date affects neither wealth nor obligations.

At the start of a month, the player can browse, compare, budget, respond to due matters, and schedule discretionary activities. Pressing **Advance Month** shows a preview, resolves the month atomically, then summarizes material changes.

Optional **Advance to next important event** can simulate up to a configurable 12 months, one committed month at a time. It must stop before an unfunded payment, employment decision, lease action, construction milestone, relevant watchlist trigger, or other configured intervention. Never use one animation to conceal skipped decisions.

### Focus is planning capacity, not mobile energy

A starting model gives 100 focus units each simulated month. Full-time work occupies 55; full-time study 65; part-time work 25. Combinations exceeding capacity are not selectable. Small strategic activities can use 10–20 remaining focus: training, networking, inspecting a unit, or negotiating a renovation.

Browsing, ordinary bookkeeping, repaying bills, crisis recovery, accessibility settings, and confirming an already-agreed transaction are always free. Focus never refills with real time and cannot be purchased. Routine work is automatic once selected. The player is not forced to repeatedly tap “go to work.”

Test this abstraction early. Replace it with a simpler schedule if players perceive it as artificial energy rather than a clear limit on simultaneous commitments. Do not entrench it in monetization.

### Campaign pacing hypotheses

Target a first whole-property decision in roughly 45–90 active minutes on a sensible work route; the university route may arrive later in simulated years but should remain rewarding throughout. Target the initial independence/empire milestone in approximately 120–240 simulated months and 6–9 active hours. These ranges are balancing hypotheses, not promises.

At roughly 50–80 active minutes per day split across short sessions, that supports an approximately week-long experience. A dedicated player can finish sooner. No forced calendar gating should prevent it.

Never claim the campaign takes a week merely because a timer exists. Record active playtime, meaningful decisions, empty turns, and voluntary returns during testing.

## 8. First-week experience target

| Session cluster, not unlock day | Main progression | The fresh strategic question |
|---|---|---|
| 1 | Work/study, budget, first savings, city discovery | What kind of future am I choosing? |
| 2 | Qualification or promotion, research, fractional holdings | How do I grow earning capacity without losing flexibility? |
| 3 | Ready property versus off-plan; financing and cash reserve | Which opportunity can I actually afford? |
| 4 | Tenant, operating expenses, construction commitments | Should I stabilize or expand? |
| 5 | A market change or personal setback | Is my strategy resilient, and how do I recover? |
| 6 | First business, delegation, lifestyle upgrade | Can my assets work without consuming all my attention? |
| 7 | A personally chosen independence milestone and recap | Did I create a better life or just a fragile balance sheet? |

The game unlocks complexity through knowledge and progression, not elapsed real days. Enable continued play after the milestone. Do not reset wealth or erase the character unless the player explicitly chooses a new life.

## 9. Life, education, and career system

Fresh Start begins at age 18 with a modest fictional balance and access to basic housing. Gender, skin tone, clothing, and cultural identity do not change salaries, lending eligibility, education success, or tenant quality. Avoid importing real residency, nationality, or immigration restrictions into the simulation.

Implement three starts with different cash/time trade-offs. University programs initially cover technology, business, and built-environment studies. An ordinary degree takes 36 simulated months; a work-and-study pace may take 48. These durations and funding arrangements are simplified game rules.

Define job eligibility from qualifications, relevant completed experience, skill requirements, and vacancies. Graduation does not award an executive position. A junior employee can progress through experience, certifications, and opportunities without a degree becoming mandatory for every route.

Start with four career families: technology, commercial/sales, operations, and construction/property support. Each needs at least three meaningful stages before public launch. A sales role may include uncertain commissions; underwriting uses conservative recurring income, not the largest bonus. A construction role can improve inspection quality, not secretly increase all property values.

Applications resolve through clear criteria plus bounded, seeded uncertainty where useful. Show rejection reasons and a next step. Do not make a player submit the same application ten times in one month to reroll acceptance.

A university funding package can combine savings, a disclosed stipend, scholarship, part-time income, and an education loan. Loan drawdowns are debt, not salary. Offer a safe default and explain higher-risk choices. Starter data is fictional and must be tuned through solvency tests.

Keep a compact life budget: housing, transport, essentials/utilities, tuition, debt service, and optional lifestyle categories. Avoid hourly eating, sleeping, bathroom, or commute-control mechanics. A simple wellbeing rating can influence a small, capped part of performance and unlock cosmetic or narrative satisfaction. It must not become a punitive maintenance bar.

## 10. The city and the Future Map

The city is a world the player participates in, not a blank board the player controls. Most buildings, employers, and infrastructure belong to other parties. Buying a plot eventually allows a limited development project; it does not grant citywide planning powers.

Use six original working districts:

| District | Identity | Economic personality |
|---|---|---|
| Old Quay | Older mixed-use streets and apartments | Lower entry prices, repair exposure, established demand. |
| Harbor Loop | Waterfront towers and leisure amenities | Higher prices and charges, demand sensitive to the scenario. |
| Garden Ring | Family apartments, schools, and townhouses | Household demand and competing residential supply matter. |
| Dune Estates | Villas and low-density communities | Larger commitments, fewer comparable transactions. |
| Southgate Works | Employment, logistics, and emerging housing | Demand linked to employer expansion and transport. |
| Reef Arc | Premium coastal homes and boutiques | Prestige and discretionary demand; not automatically better returns. |

Launch the vertical slice with two districts and a compact map. Add the other four only after the purchase/rental loop is accepted.

### Future Map is a signature system

A map overlay shows proposed, funded, under-construction, operational, delayed, and cancelled developments. Include employment centers, transport links, amenities, and competing housing supply. Each has published evidence, uncertainty, and a causal impact model.

The player can see that an area has a proposed employment center, but a proposal is not a guarantee. A funded project is a stronger signal. By the time construction is obvious, some expected benefit should already be reflected in prices. There must not be a permanent “read news, buy, receive free appreciation” exploit.

Show data such as supply pipeline, occupancy trend, comparable sale ranges, and rent trend. Avoid magic labels saying “this will rise 30%.” A projected uplift is a scenario range, never secret knowledge of a predetermined exact outcome.

Use consistent world simulation: new supply can pressure rents; better employment access can support demand; higher financing costs can reduce purchasing capacity. The economy specification defines a bounded first model. A city report should explain observed changes using the actual simulation factors.

## 11. Property discovery and comparison

A property listing includes an original illustration or unit thumbnail, building and district, unit type, area, condition, occupancy status, asking price, estimated transaction costs, service charges, rent range, financing assumptions, and confidence in the estimate.

Require a clear distinction between asking prices and completed comparable sales. The user's course supports comparative-property analysis and gross/net yield distinctions; it is reference material, not a price feed. Never copy course arithmetic without independently checking it.

Provide a two- or three-property comparison view. The default comparison highlights required cash, forecast cash flow, liquidity, workload, condition, and commitments. An “Explain differences” view uses deterministic templates derived from the numbers, not a runtime language model.

Listings come from a seeded city supply pool. Inspecting an existing listing does not reroll its defects, price, or seller. Watchlists persist. A list can refresh with a new simulated month, not unlimited reopening.

The player can negotiate a price or completion timing within a bounded process. Sellers have hidden reservation thresholds and visible motivations, not infinitely exploitable random discounts. A justified offer can reference comparable sales or repairs. No mandatory reflex-based minigame should decide a major financial outcome.

## 12. Ready-property transaction lifecycle

Implement the states `listed → offer_pending → accepted → financing_review → reserved → settled`, plus `rejected`, `expired`, and `cancelled` outcomes. An accepted offer is not ownership. Only a completed atomic settlement transfers the unit.

Before confirmation, show purchase price, buyer cash contribution, mortgage principal, fees, required reserve, and expected ongoing obligations. Financing must be approved for this unit and quote. The player cannot spend a loan as unrestricted income when it is being disbursed directly into a purchase.

Early versions settle on the next simulation boundary, with no same-month rent for a newly completed purchase. State that rule on the closing preview. Later prorated settlement is optional; do not introduce partial-month accounting until the monthly engine is stable.

Existing occupied properties carry their lease and relevant deposit/advance-rent obligations into settlement. A tenant does not disappear because the player bought or sold the home. Price adjustments must reconcile prepaid rent and other transferred balances.

Ownership can be personal residence, long-term rental, renovation, vacant held asset, or listed for sale. Each has an explicit state. A unit cannot be fully rented and personally occupied simultaneously.

## 13. Off-plan is a strategic commitment, not a discounted instant building

Off-plan listings have an original developer, project registration status under fictional city rules, a plot/building, expected completion window, staged payment plan, quality indicators, assignment conditions, and delay/default risks.

An illustrative plan is 20% on booking, four 10% construction payments, and 40% at handover. Other plans can follow after the base state machine works. Percentages must sum to 100% and each installment has a defined trigger. Elapsed time and achieved construction milestones are different triggers.

Money paid before title is recorded as a contractual investment/prepayment, not an owned ready building producing rent. Future unpaid commitments are visible in a forward calendar. Use conservative pre-handover valuation as defined in `ECONOMY_SPEC.md`.

At booking, run a cash forecast and a downside scenario. At each construction stage, show progress and any changed handover projection. The developer does not get a fresh random reliability score whenever the screen opens.

Handover requires physical completion, the required payment, financing approval where needed, and satisfaction of the fictional completion conditions. A bridge from off-plan to mortgage is not automatically guaranteed. A bank can value the finished unit below contract price, creating a visible funding gap.

After handover, a short defects/snags decision can affect cost and readiness. Any inspection minigame is optional, accessible, and offers no secret perfect-investment advantage.

Early resale is assignment of the contract, not sale of a finished property. The new buyer must accept remaining obligations, meet assignment rules, and pay an agreed transfer amount. Sale proceeds are not the full imagined finished-unit value while the old owner keeps all unpaid installments off the books.

Default and project cancellation need distinct outcomes. Show notices, cure paths, possible restructuring, and any recovery delay. Do not import real legal percentages or claim a refund is legally guaranteed. All relevant rules are fictional and explained before commitment.

## 14. Rental management and tenant life

Start with long-term residential leases. Short-term visitor accommodation is deferred until the core lease model works; it introduces a different operating business, not simply a higher rent multiplier.

The player chooses an asking rent, furnishing level, and a management approach. Asking above market can reduce inquiry probability and lengthen vacancy. A lower offer can reduce uncertainty. Tenant profiles show relevant contractual facts and preferences, not protected-characteristic-based risk scoring.

A lease stores duration, rent, payment cadence, deposit, start/end month, renewal state, and any arrears. Support monthly, quarterly, and annual payment schedules before public launch. Cash timing differs from earned rental income. Tenant security deposits are refundable liabilities, not income.

Use plain-language renewal rules. Rent changes happen at a permitted renewal under the game's fictional cap, not every month of an existing contract. Vacancy is real absence of a lease; do not also deduct a forecast vacancy allowance as a second actual expense.

Maintenance can be routine, scheduled, or event-driven. A player can reserve cash for it, but setting money aside is not itself a second expense. Serious repairs can remove a unit from rentable stock until complete. Warn before unnecessary repeated deterioration rather than forcing constant check-ins.

At a modest portfolio size, offer a manager with transparent recurring fees and rules. The manager handles routine renewals and repairs within the owner's budget but asks before commitments beyond authority. Delegation becomes a strategic purchase, not a paid feature gate.

## 15. Finance, debt, and understandable dashboards

The top-level finance summary shows four separate values: spendable cash, normal monthly surplus, net worth, and upcoming commitments. A tap reveals restricted balances, forecasts, and calculation assumptions.

Do not label gross rent as passive profit. Do not count borrowed money, security deposits, or a sale of an existing asset as newly earned operating income. Separate unrealized valuation changes from cash and realized results.

Mortgages use a defined amortization model, rate schedule, loan-to-value policy, affordability policy, and current balance. Principal repayment changes cash and debt, not operating profit; interest is a financing cost. Calculate using tested money helpers and rounding rules.

Banks evaluate reliable income, current debt, the particular asset, cash contribution, and reserves. In the first release, lending rules are simplified fictional parameters shared by all characters. No real banking affiliation or promise is implied.

Refinancing pays off the old debt and replaces it with the new debt plus fees. Released equity increases cash and leverage, not net worth by itself. Eliminate repeat-refinance and valuation-pumping exploits.

Provide a 12-month commitment calendar with an extended off-plan view to handover. Flag the earliest funding gap under stated assumptions. The projection is not a guarantee; show salary, vacancy, and rate sensitivities where applicable.

Debt and missed payments should generate recovery decisions. Avoid an endless state where the player cannot advance, cannot act, and cannot restart safely. See the recovery system below.

## 16. Fractional property and fictional crypto

Fractional property provides a small-ticket entry to a managed rental asset. The player owns economic units, not control of an apartment. Model distributions after costs, fees, asset valuation, and limited liquidity. Buying a small share does not grant access to the whole building's rent.

Use fully fictional instruments with no real token logos or names. Cryptocurrency-like assets are a separate optional high-volatility category. They have bid/ask spread or trading fees, limited same-period liquidity, and no guaranteed return. They do not pay property rent simply because their interface uses tokens.

No real-time market feeds, connected wallets, blockchain minting, trading leverage, options, paid coins, or cash-out. These systems exist inside the local simulation only. Do not encourage financial speculation in advertising.

Prevent price rerolls by changing screens or repeatedly loading the same save. Purchases and sales at the same quote should lose the spread, not manufacture money. Market updates happen on the simulated calendar and respect the saved seed.

Crypto is optional breadth for v1, not the center of the game. The full campaign must remain enjoyable and winnable without it. Add it after ready/off-plan/rental systems, and do not let one lucky token dominate every other career and property decision.

## 17. Businesses: growth beyond being a landlord

For initial public release, implement three connected business types: a maintenance service, a furnishing business, and a neighborhood café. Additional sectors such as vehicle rental, property management for third parties, hospitality, and development are post-launch scope unless capacity is proven.

Each business has premises, setup cost, working cash, staff, capacity, demand, quality, operating costs, manager status, and a few strategic choices. The shared simulation engine should support them without pretending their economics are identical.

A maintenance company can service the player's properties, but materials and labor still cost money. A café's revenue depends on customers and capacity, not on buying the highest decoration tier. Furnishing orders depend on completed housing and quality/reputation.

Paying rent from one player-owned company to another is an internal transfer, not new consolidated empire income. Show entity views separately and eliminate internal transactions in the overall summary.

Working personally in a business consumes focus. It is self-employment, not passive income. A manager costs money and can reduce performance risk; only income after replacing the owner's required labor qualifies toward the financial-independence metric.

Business expansion should compete with buying another property. Neither should be an automatic superior return in all scenarios. Underfunded inventory, wages, and repairs are visible operating risks. Do not build a full supply-chain game inside the first release.

## 18. Cars, home, and aspirational spending

Let the player live in a modest room, a studio, a family apartment, a townhouse, and eventually a premium residence. Home upgrades can improve appearance, comfort, and some modest schedule convenience. A personal residence produces no rent while occupied by the player.

Use original vehicle designs and fictional manufacturers. Launch with a small catalog: practical compact, used sedan, family SUV, premium sedan, sports coupe, and a top-tier collectible. Model purchase price, running cost, resale/depreciation, and financing where supported. Avoid guaranteeing appreciation for luxury purchases.

Provide a home-view and garage-view vignette, not a driving game. Furniture and layout presets create expression without requiring a full interior-construction engine. Lifestyle purchases should remain attractive even when not financially optimal.

Choose a dream at the start and permit changing it. Examples: comfortable debt-light life, own a waterfront apartment, run a neighborhood business, become a diversified landlord. The player's ideal life is not always the most expensive mansion.

No paid cosmetic should secretly improve credit, rent, career success, or market forecasting. Do not make happiness purchasable only with real money.

## 19. Narrative, relationships, and fair setbacks

Use a small cast of original recurring characters: a career mentor, broker, cautious friend, developer representative, contractor, banker, and tenant or business regular. They bring context and continuity, not mandatory chat maintenance.

Contacts gain trust through relevant completed interactions. Trust can create an introduction or provide better information, but cannot guarantee profit. Avoid an infinite free-discount ladder. Cosmetic character selection does not change economic treatment.

Events are authored templates with eligibility, timing, cooldown, choices, immediate effects, delayed effects, and explanation. Use a seeded director that limits repetition and respects existing obligations. Do not use a paid runtime language model to invent contracts or financial outcomes.

Three launch-quality story arcs matter more than hundreds of interchangeable notifications. Suggested arcs: an area whose employment project is delayed and later resolved; a first off-plan purchase with a recoverable handover surprise; a modest business whose owner must choose quality versus rapid expansion.

Offer bounded uncertainty with visible evidence. The game can surprise a player, but it should not routinely reveal a hidden fatal condition that no inspection, forecast, or choice could have affected.

Avoid casual eviction-as-entertainment, tenant harassment, fraud tutorials, bribery mechanics, and discriminatory screening. A commercial choice can be difficult without turning vulnerable characters into disposable objects.

## 20. Recovery should be playable

When a shortfall is approaching, warn the player with amount, due month, and assumptions. Suggested responses include postponing discretionary spending, accepting a lower rent, selling a liquid holding, taking work, restructuring where the fictional contract allows it, or selling an asset.

If obligations cannot be met, enter a guided recovery state that preserves agency. Record arrears, charge only disclosed game fees, pause restricted new borrowing, and offer a transparent restructuring or asset-sale path. Time can continue after the player selects an available response; failure cannot freeze the game forever.

An optional restart or new-life slot is always available but never the only response to one modest mistake. Do not sell a real-money bailout or make recovery humiliating.

A recovery story should be worth sharing: “I sold the car, stabilized the rent, and saved the apartment.” That is a design goal to test, not permission to secretly force every player into a crisis.

## 21. Mastery, milestones, and completion

Use a small milestone ladder: first savings goal, first qualification/promotion, first investment, first unit, first tenant, first completed handover, first profitable business, diversified income, and chosen lifestyle goal.

Milestones celebrate behavior and show progress; they should not generate unexplained giant cash awards. Any bonus must have an explicit source and be included in balance tests. Prefer visual unlocks, new scenario access, and additional planning tools unlocked through learning.

The first campaign ending is a recap, not a shutdown. A proposed independence goal requires recurring non-salary income to cover essential lifestyle costs with a margin, a cash reserve, no unresolved arrears, a survivable forward commitment calendar, and a chosen personal goal. Use trailing performance and forward stresses, not one unusually profitable month.

The player can continue the same life with larger acquisitions or start a new scenario. Post-launch scenarios can include a supply boom, high financing costs, a career-first challenge, and a business-focused start. No forced prestige reset, inherited paid power, or permanent punishment for a failed life.

Do not expand to hundreds of properties through hundreds of repetitive clicks. Bulk management, portfolio grouping, meaningful delegation, and selective alerts must arrive as scale grows.

## 22. Sharing that comes from the game

Implement an optional local “My Empire” share card before designing multiplayer. It can show a before/after home, owned map highlights, simulated years elapsed, net worth, recurring cash flow, reserve, chosen goal, and two or three meaningful decisions.

The player previews and explicitly shares using the native share sheet. Hide the display name by default or offer an obvious toggle. Do not auto-post, scrape contacts, require an account, or upload financial-style game data to a public profile.

A dramatic screenshot must not imply the player made real money. Include “Simulation” on shared financial cards.

Later, share scenario codes containing a seed and rules version so friends can try the same starting conditions independently. Offline results are unverified; do not attach ranked prizes, trust claims, or real rewards. Competitive leaderboards and public user-generated content require a separate security/moderation scope and are not launch requirements.

For v1, generate a still-image recap first. Native video export is optional later scope; marketing can record real gameplay without building a recording/editing system into the app.

## 23. Visual direction: the miniature city must be desirable

Use original isometric pixel art with consistent perspective, tile geometry, character scale, lighting, and palette. Reference the charm and readable density of classic management games; do not imitate a particular developer's sprites, menus, typefaces, or signature assets.

Proposed world direction: warm stone, sand, shaded courtyards, turquoise water, planted streets, glass accents, construction cranes, small cars, and a skyline that grows through actual simulated development. These are art proposals, not prescribed licensed references.

Prototype a 64×32 logical-pixel diamond ground tile and a small original character scale. Validate on actual phones before commissioning a large asset set. Building height and footprint must be documented; tall towers need tap targets and selection behavior that do not obscure neighboring units.

Use a low-resolution world viewport with controlled nearest-neighbor scaling and a separate high-resolution UI layer. Allow map pan and discrete tested zoom levels; avoid shimmering fractional zoom. UI text must never be baked into pixel art.

The avatar needs idle, walking, and a few celebration/context animations, not a full simulation of every resident. Decorative pedestrians and cars are pooled presentation objects. Removing them for performance cannot change prices or gameplay.

A primary residence changes visually. Rental occupancy lights or a subtle badge can show portfolio progress without implying whole-building ownership. Construction needs distinguishable stages: foundation, structure, exterior, complete. The first accepted slice must include original art in enough of these places to judge the fantasy.

Maintain an asset register with creator/source, license, commercial use rights, attribution requirements, dimensions, and status. Temporary assets remain visibly marked in internal builds. No downloaded commercial-game sprites. No unlicensed music or vehicle likenesses.

## 24. Interface and screen contract

Use five primary areas: **Life, City, Portfolio, Money, Inbox**. Home and garage are reached from Life; businesses are reached from Portfolio. Do not create nine crowded navigation tabs because the feature list is large.

| Screen | Primary action | Essential information | Required difficult state |
|---|---|---|---|
| New Life | Choose start | Route costs, time, funding | Unfunded university plan explains its gap. |
| Life overview | Choose work/study action | Current role, progress, monthly essentials | Unemployed character sees concrete next actions. |
| City | Explore/watch a unit | Districts, ownership highlights, future overlay | No matching listing offers filters, not a dead end. |
| Listing | Compare or offer | Price, cash needed, forecast, risk | Ineligible financing is explained before reservation. |
| Comparison | Select a candidate | Same assumptions across alternatives | Missing comparables lower confidence visibly. |
| Mortgage quote | Accept financing | Rate, term, fees, monthly payment | Stress/valuation gap is explicit. |
| Off-plan commitment | Review or pay | Paid, remaining, next trigger, handover | Delay/default status has actionable choices. |
| Lease | Set or renew terms | Rent, cadence, deposit, expiry | Vacancy/arrears have different explanations. |
| Portfolio | Inspect/delegate | Asset state, net cash flow, commitments | Empty portfolio points to a first goal. |
| Money | Plan reserve | Cash, liabilities, projections, transactions | Negative forecast highlights the earliest gap. |
| Business | Make operating choice | Demand, capacity, costs, manager | Working-capital shortage is understandable. |
| Home/garage | Personalize/buy | Appearance, ownership/running cost | A purchase preview shows the savings trade-off. |
| Inbox | Resolve a decision | Why now, choices, effects | No expired prompt can spend money twice. |
| Month preview | Advance or revise | Expected cash, obligations, decisions | A critical unresolved choice blocks with a reason. |
| Month recap | Continue or inspect | Material changes and causes | No-change month offers smart advance. |
| My Empire | Preview/share | Visual progress and honest metrics | Cancelled share returns without changing state. |
| Store | Unlock campaign | Localized real price and exact content | Pending, cancelled, restored, and failed purchase states. |
| Settings | Adjust experience | Language, motion, sound, saves, privacy | Reset requires clear confirmation and preserves entitlements. |

Default to clear high-resolution typography and spacious cards. Every major confirmation distinguishes real purchase currency from fictional game money. Use text and icons as well as color for warnings. Design for approximately 44–48 logical-unit touch targets as a project usability target, then verify platform-specific rendering and accessibility.

Explain computations in plain language: “The apartment earns rent, but its loan and building costs leave a smaller monthly surplus.” Details can expose the full calculation. Number formatting, minus signs, currency labels, percentages, and Arabic mixed-direction text require specific test cases.

## 25. Sound, feedback, and emotional rewards

A purchase completion should have a short, satisfying confirmation and a visible ownership change. A first tenant can light the unit window and add a small key or welcome animation. A promotion can change a desk vignette. A completed construction project replaces the construction art.

Use restrained haptics and separate controls for music, effects, and vibration. Respect reduced-motion mode. Money animations must not run so long that routine management becomes tedious. Include skip/accelerate controls for recurring recaps.

Do not use casino-style near-misses, fake jackpots, or aggressive urgency around optional spending. The ambition is pride, discovery, and mastery—not panic.

## 26. Technical architecture

Use three layers: a deterministic simulation, a presentation client, and replaceable platform services. The simulation must run headlessly without loading the city. No salary logic inside sprite animation callbacks and no rent calculations inside UI labels.

Suggested project structure:

```text
project.godot
CLAUDE.md
game/
  core/          # Money, IDs, calendar, commands, results, RNG, journal
  simulation/    # Career, education, property, lease, credit, market, business
  persistence/   # Save schema, migrations, atomic snapshots, integrity checks
  presentation/  # World, screens, reusable controls, view models, localization
  platform/      # Store interface, platform adapters, share, optional analytics
content/
  balance/       # Versioned fictional parameters
  definitions/   # Districts, careers, assets, events, scenarios
  locales/       # Translation source files
assets/          # Licensed/original final assets, with a rights manifest
tests/
  unit/
  integration/
  fixtures/
  simulation/
docs/
  decisions/
  evidence/
```

Typed GDScript domain objects can extend `RefCounted` and avoid `Node` dependencies where feasible. Use data definitions with stable IDs and schema validation. Do not create one autoload singleton per feature; keep application composition explicit.

Every money-changing player action becomes a validated command with a unique action ID, an expected state revision, and an all-or-nothing result. Replaying the same action cannot execute it twice. The UI observes committed state and cannot mutate balances directly.

Use dedicated, saved random streams for market, careers, construction, and narrative. Decorative animations use a separate stream. The same saved state and commands should reproduce the same results under the same engine/rules version. Record version compatibility; do not promise identical random sequences across arbitrary engine changes.

No runtime language model, remote price feed, multiplayer server, or database service is needed for the launch loop. Optional analytics must fail safely and cannot block gameplay.

## 27. Persistence, correctness, and performance

Represent money as integer minor units in memory, with one tested money API. When using JSON, encode authoritative monetary integers and RNG state as validated decimal strings; Godot's JSON conversion does not preserve a separate integer type. Rates and quantities need explicit units and controlled rounding. See the economy specification for concrete tests.

Persist a versioned snapshot with game ID, state revision, content version, simulation version, month, player, holdings, contracts, journal summary, event history, and RNG streams. Keep a previous known-good save. Write to a temporary file, validate, then replace using a tested platform-specific atomic strategy. Do not claim an untested rename path is crash-proof.

Save after committed material actions and each completed month, not only when the app closes. Interruption mid-commit must load either the prior valid state or the fully committed state, never half a purchase. Content migrations cannot silently delete assets or duplicate debt.

Use explicit serialization rather than loading arbitrary scripts or resource paths from imported saves. Enforce size limits, valid IDs, allowed types, and money bounds. A checksum can detect accidental corruption; it does not make an editable offline save cheat-proof.

Provisional performance targets on documented target devices: cold resume under 3 seconds where practical; typical monthly resolution under 150 ms; stress portfolio resolution under 500 ms; map at 60 fps on the designated modern reference phone and a stable 30 fps fallback on the designated lower-end phone. These are engineering targets to benchmark, not claims already achieved.

Choose actual reference devices at M0, record OS/version, and adjust targets with evidence. Use presentation pooling and simulation aggregation before increasing hardware requirements. Test battery/thermal behavior over a 20-minute session. Do not attach a persistent physics body or active script to every fictional tenant.

## 28. Monetization: sell the complete experience

Default hypothesis: a substantial free Starter Chapter and a non-consumable Full Life unlock. Proposed UAE price test: AED 29.99 versus AED 39.99, with store-localized prices elsewhere. These are unvalidated prices, not promised platform tiers or revenue.

Define the free boundary by chapter/progression, not by a countdown that destroys a save. The demo must let a player experience the property decision and its rental or handover consequence, using route-appropriate pacing. Test its length before fixing the paywall. The university route must not hit the paywall before seeing why it is enjoyable.

At the boundary, explain exactly what unlocks. Preserve the current life. Permit reviewing the empire and replaying the free chapter; do not threaten losing an apartment unless the player pays. The paid game includes its advertised careers, ready/off-plan/rental systems, initial businesses, fictional investments, lifestyle catalog, and a complete ending/continuation loop.

No subscription at launch. No forced ads. No paid bailout, gems, energy, better mortgage, lucky draw, booster investment, randomized purchase, or “watch to avoid losing your property.” Future expansion hypotheses are AED 14.99–19.99 for genuinely new scenarios or mechanics, not repairs to an incomplete base game.

Implement native in-app purchase through a tested platform adapter. Price text comes from the store, not a hard-coded label. Handle success, pending approval, failure, cancellation, refund/revocation where surfaced, restore, reinstall, and device change. A previously verified entitlement should remain usable offline under a documented cache policy; no legitimate purchase may be replaced by a debug boolean.

All purchase and store-policy decisions require current platform review at release. Human owner approval is required for product IDs, pricing, live configuration, and submission. No assumption that a plugin listed online currently works with the pinned engine.

## 29. Content scope: slice, v1, later

| System/content | Accepted vertical slice | Initial paid release target | Deferred |
|---|---|---|---|
| World | Two districts, compact original map | Six districts with distinct demand/supply | A second city or open world |
| Life | Work and one funded university path | Three starts, three degree families, four career ladders | Detailed family/generational simulation |
| Property | Ready and off-plan residential examples | Studio, apartment, townhouse/villa variants; diverse buildings | Skyscraper construction editor |
| Rentals | Monthly lease, vacancy, costs | Monthly/quarterly/annual receipts, renewal, managers | Short-term hospitality operation |
| Investments | Simple optional fraction or test fixture | A few fractional offerings and fictional crypto instruments | Real markets, leverage, blockchain |
| Business | One compact test business after core validation | Maintenance, furnishings, café | Hotels, car-rental fleet, developer mode |
| Lifestyle | Room, upgraded home, a car | Small home/furniture/vehicle catalog | Driving, free-roam interiors |
| Stories | Five events and one coherent arc | Around 40 authored templates with three substantial arcs | Hundreds of generated event texts |
| Social | Local still share-card prototype | Native optional share card | Public UGC, trading, ranked multiplayer |
| Commerce | Mock + early sandbox proof | Verified campaign unlock and restore | Subscription/live-ops economy |

Content counts are scope ceilings/initial targets, not proof of duration. A small varied economy can outperform a huge repetitive catalog. Do not silently remove the user's requested crypto, off-plan, education, or business intent; defer implementation in the documented order and make the v1 boundary explicit.

## 30. Development plan and stop conditions

M0 proves engine, local state, automated tests, and the mobile dependency path. M1 proves the life calendar and save integrity. M2 delivers the first enjoyable purchase/rent/off-plan slice. M3 proves economy and progression over long simulations. M4 brings the initial full-life content and polished art/UI. M5 proves purchase, localization, accessibility, device stability, and soft-launch readiness. M6 evaluates an instrumented pilot before wider spending or release.

Detailed deliverables and acceptance tests are in the companion plan. Do not present a promised launch date before M0/M2 establish implementation capacity and asset throughput. Report estimated remaining work with assumptions, not a fiction that one prompt replaces art production, mobile signing, and player testing.

Pause expansion when the first property is boring, players cannot explain their cash flow, the save system loses progress, or the university route is a dead end. Fix the core rather than adding cars or another business category.

## 31. Evidence, metrics, and the meaning of “a hit”

The owner wants a game players love and recommend. That outcome cannot be specified into existence. What can be specified is a disciplined process for discovering whether this game has that potential.

In early observed tests, watch whether players independently choose a goal, understand a trade-off, voluntarily play another month, and can describe a story from their own decisions. A compliment about the artwork is not evidence that the investment loop works.

Define D1 as a valid first-session cohort returning during the 24–48-hour window; D7 as returning during the 168–192-hour window. Report both with exact counts, platform/build, route, purchase status, and uncertainty. For a finite campaign, also report completion, active playtime, and voluntary new-life/continued play. A satisfied completer is not automatically a retention failure.

Initial internal soft-launch hypotheses: tutorial completion at least 75%; D1 around 35% or higher; D7 around 15% or higher; several percent of qualified new installers choosing the full unlock. These are chosen decision thresholds, not external industry benchmarks or evidence of likely success. Do not keep spending simply because one noisy cohort passes a threshold.

Track real net receipts and acquisition cost before scaling paid marketing. In a permanent-purchase model, a popular ad can still acquire unprofitable players. Do not confuse reach, installs, revenue, and profit.

## 32. Launch creative concepts based on real gameplay

Three proposed campaigns should demonstrate genuine decisions:

**The car or the apartment:** The player can buy an impressive car today or keep the deposit plan intact. Show both possible lives without falsely claiming either result is guaranteed.

**Rich on paper, broke next month:** The player owns several off-plan commitments but faces a handover gap. Show the calendar and a recovery decision, not a real-money bailout offer.

**The overlooked district:** A player investigates jobs, transport, and competing supply, buys selectively, and later sees the city change. Show a risk or alternative outcome as well as success.

Use original in-game footage and honest “simulation” labeling. Do not imply real investment returns, promise wealth, use real developer identities, or show fake gameplay. Test the creative's ability to attract players who enjoy the actual loop, not merely viewers of financial fantasy.

Ask for an optional review only after a positive earned milestone and never in return for a reward. Respect a dismissal. No manufactured testimonials or invented player feedback.

## 33. Completion criteria for the product

The first commercial version is complete only when a new player can start all advertised routes, manage life, evaluate investments, buy and sell, complete off-plan, manage rentals and loans, participate in fictional investments, establish the advertised businesses, buy lifestyle items, recover from common setbacks, and reach an earned milestone without a soft lock or real-time wait.

The journey must also look coherent, remain readable on target phones, survive interruption and updates, honor paid access, and run without constant network access. Every advertised feature must be reachable in the shipping build. No “coming soon” screen counts as an implemented system.

The final emotional test is simple: a player should be able to point to a place in the city and say, “I made a good decision to get that,” and then want to make the next decision.

---

**Companion documents:** `ECONOMY_SPEC.md`, `BUILD_PLAN_AND_ACCEPTANCE.md`, `PLAYTEST_AND_LAUNCH.md`, `SOURCES_AND_ASSUMPTIONS.md`, `starter_balance.json`, and `CLAUDE.md`.
