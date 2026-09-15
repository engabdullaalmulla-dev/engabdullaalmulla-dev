# Package verification

Prepared 15 September 2026. These checks apply to the **documents and illustrative data only**.

A Python verification run completed 143 assertions successfully. The checks covered JSON parsing, lossless decimal-string money fields, four independently recalculated amortization fixtures with explicit rounding order, opening-path cash arithmetic, off-plan payment reconciliation, rent/cash-flow/advance-rent calculations, refinance identity, sample entity references, document presence, Markdown code-fence structure, and 60 unique acceptance-test IDs.

The package is not a Godot project. No Godot game tests, engine/plugin compatibility test, phone export, purchase sandbox run, multi-seed economy simulation, human playtest, or revenue experiment has been executed by this package verification. Those remain Claude/team deliverables under the build plan.

Key arithmetic results:

| Check | Result |
|---|---:|
| 12-month work cash, no other events | VDh 44,000 |
| Funded full-time university cash after 36 months, before other events | VDh 12,800 |
| Corresponding university debt drawn | VDh 54,000 |
| Work-study cash after 48 months, before other events | VDh 16,400 |
| Mortgage: 480,000 at 5%, 300 months | VDh 2,806.03 monthly |
| Mortgage: 224,000 at 5%, 300 months | VDh 1,309.48 monthly |
| Education reference: 50,000 at 8%, 120 months | VDh 606.64 monthly |
| Example property expected monthly cash after debt | VDh 468.97 |
| Off-plan stage total | 100% |
| Required acceptance cases | 60 |

`MANIFEST.sha256` lists hashes for the other files in the ZIP. The ZIP itself was reopened and checked for structural integrity when generated. No source course PDFs, images, font files, external assets, or credentials are redistributed.
