# Backlog

One active implementation slice at a time. Milestone definitions live in `BUILD_PLAN_AND_ACCEPTANCE.md`;
this file tracks what is done, what is next, and why.

## Done — M0 (foundation and mobile spike)

| Ticket | State |
|---|---|
| SYS-001 inspect repository, record decisions | done — `docs/decisions/` |
| SYS-002 pin engine, import/export settings, commands | done — 4.7.2.stable, `tools/` |
| SIM-001 money, calendar, IDs, command revision checks | done — reference fixtures pass |
| SIM-002 snapshot, journal, save validation and recovery | done — interrupted/corrupted save tested |
| SIM-003 monthly salary/essentials and pure recap | done — 12/36/48-month fixtures reconcile |
| PLATFORM-001 native billing/share compatibility spike | done as a **spike**: Android export and Gradle path verified, iOS gate documented, no billing integrated |

## Next — M1 proposal: "a life you can live for a year"

The smallest increment that makes the life loop worth playing before any property system exists. Nothing here
requires new art beyond one room vignette, and every item ends in a test.

| Ticket | Deliverable | Done means |
|---|---|---|
| UX-001 | Portrait shell refinements: a room/city vignette that changes with your housing, readable at phone sizes | Touch targets and text verified at 720×1280 and on a narrow device profile; no financial control under a safe-area inset |
| LIFE-001 | Work route: job definitions, eligibility from experience and qualifications, real vacancies, applications with visible reasons | A job pays only while active; opening a screen grants nothing; a rejection explains itself and offers a next step |
| LIFE-002 | Study routes: enrolment with a funded plan shown before commitment, graduation, education debt entering repayment after the grace period | The funded route completes solvently in a simulation; education debt appears in commitments with its repayment start |
| LIFE-003 | Focus actually spent: work/study consume capacity, a small number of optional actions compete for the rest | Over-committing is not selectable; bills and recovery remain free actions |
| SIM-004 | Smart advance (up to 12 months, one committed month at a time) that stops before anything needing a decision | Stops before an unfunded commitment; no animation hides a skipped decision |
| SIM-005 | Recovery flow surfaced in the UI: warning before a shortfall, options, no dead end | A deliberately insolvent save can act and continue; no infinite modal |

**M1 exit evidence:** a fresh life on each of the three routes played through 12+ simulated months with the
save reloaded mid-run; the full test suite green; screenshots; and one honest note on what still feels thin.

## Then — M2 (the gate that matters)

Two districts, two ready units, one off-plan project, offers, financing, closing, a tenant, one recoverable
setback, and the first visual change to the world when you own something. **The owner reviews M2 before any
expansion.** The question at that gate is not "does it compute" but "was choosing, buying and living with the
first apartment worth the three years of saving?"

Design intent to carry into M2, from the owner's direction:
* the choice between the two units must be genuinely arguable, not one obviously better;
* closing should be a moment — cash needed, fees, what is left afterwards, and a visible change;
* the month after buying should be harder, and survivable.

## Deferred, deliberately

Six districts, careers beyond the first ladder, businesses, fictional crypto, cars and home catalogue, market
model and Future Map, fractional holdings, narrative arcs, share card, localisation, analytics. All are in the
brief and none are cancelled — they follow the accepted order, after the first-property loop is proved.
