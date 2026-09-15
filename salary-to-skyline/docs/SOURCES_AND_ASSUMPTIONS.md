# Sources, assumptions, and reuse boundaries

**Checked:** 15 September 2026. Current engine/platform policies can change; recheck at implementation and submission. External sources support the narrow facts below, not the game's commercial potential. The design, working names, salaries, fictional fees, credit limits, prices, probabilities, thresholds, and content scope are original proposals.

## Uploaded course material actually consulted

**C1 — Real Estate Brokerage Course_material_IEREI Day 4, PDF pages 18–21.** Reviewed the distinction between gross and net rental yield and examples of vacancy, management, service charges, repair, and acquisition costs. Used as conceptual input for property comparison and forecast-versus-actual accounting. No course screenshot, proprietary slide art, or official form is included in the shipped-game proposal.

**C2 — Same Day 4 PDF, pages 22–25.** Reviewed comparative market analysis and adjustments for differences between units. Used to inspire comparable-property views, not as a real pricing database. The example on PDF page 25 has an internal arithmetic inconsistency: a displayed total of 20,370,000 and count of 5 do not produce the displayed average of 3,395,000; that average would use a divisor of 6. Therefore, course exercises must not be imported as unquestioned executable truth.

**C3 — Day 2 - Legal Presentation-IEREI, PDF pages 8–12.** Reviewed the topics of off-plan registration, project-specific escrow, staged payments, buyer/developer default, and handover issues. Used for structural inspiration only. No legal percentages, deadlines, or rights from the slides are presented as the game's current legal obligations.

The user's third course PDF was available in the conversation but was not required for the particular source checks above. This pack does not claim a new line-by-line review of every course page. PDF page numbers refer to the file position, not the printed slide labels. Original course documents are not redistributed in this pack.

## Public primary-source register

**S1 — Godot official release archive.** Shows 4.7.2 as stable, dated 18 August 2026, on the checked date. Used only as the initial engine candidate; plugin compatibility still needs a local spike.
https://godotengine.org/download/archive/

**S2 — Godot: exporting for iOS.** Documents the iOS export/toolchain process and requirements, including macOS/Xcode. Supports the requirement to verify real native export rather than treating a desktop build as iPhone evidence.
https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_ios.html

**S3 — Godot: exporting for Android.** Source for platform-specific setup and export validation. The pack does not assume all third-party plugins work with the chosen engine.
https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html

**S4 — Godot: JSON class.** Documents JSON number conversion and parsing behavior. Supports lossless string serialization of authoritative integer money rather than relying on JSON numeric round-trips.
https://docs.godotengine.org/en/stable/classes/class_json.html

**S5 — Godot: saving games.** General reference for serialization/persistence. The pack's atomic commit, backup, validation, and migration requirements are additional project design requirements, not a claim that the tutorial implements them.
https://docs.godotengine.org/en/stable/tutorials/io/saving_games.html

**S6 — Godot: random number generation.** Describes seeded generators and separate generator instances. Supports deterministic within-version testing and separate saved streams.
https://docs.godotengine.org/en/stable/tutorials/math/random_number_generation.html

**S7 — Godot: internationalizing games.** Reference for localization, bidirectional text, and UI considerations. Actual Arabic quality still requires human review.
https://docs.godotengine.org/en/stable/tutorials/i18n/internationalizing_games.html

**S8 — Godot: command-line tutorial.** Reference for headless execution, scripts, imports, and exports. The proposed test scripts are work to implement, not existing files in this package.
https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html

**S9 — Godot: using TileMaps.** Reference for the 2D map implementation. The art style, pixel scale, and performance targets in the brief are project proposals.
https://docs.godotengine.org/en/stable/tutorials/2d/using_tilemaps.html

**S10 — Apple: In-App Purchase.** Documents purchase management and a restore mechanism for restorable products. Supports the permanent-unlock/restore test requirement, not any particular Godot plugin.
https://developer.apple.com/in-app-purchase/

**S11 — Apple: App Review Guidelines.** Current review, digital-purchase, privacy, and related requirements must be reviewed for the actual release markets and final content. A fictional-money label is not a guarantee of approval.
https://developer.apple.com/app-store/review/guidelines/

**S12 — Google Play: Payments policy.** Reference for digital-content purchases and relevant platform rules. Use the applicable current terms and actual distribution route; do not infer a universal external-payment rule.
https://support.google.com/googleplay/android-developer/answer/9858738

**S13 — Apple: Small Business Program.** An eligible enrolled developer can receive a reduced 15% commission under the program's conditions. Used solely for a clearly labeled arithmetic scenario, not an assumption of the owner's eligibility or all-world net receipts.
https://developer.apple.com/app-store/small-business-program/

**S14 — Dubai Land Department: Register Project.** Describes registering a development and opening escrow for off-plan sales. Supports broad structural inspiration; the game uses fictional institutions and conditions.
https://dubailand.gov.ae/en/eservices/register-project/

**S15 — Dubai Land Department: Dubai REST.** Describes property/tenancy services and indices. Supports the idea that transaction, rental, service-charge, and project information are distinct concepts; no real dataset or branding is imported.
https://dubailand.gov.ae/en/eservices/dubai-rest/

## What has not been established

No demand survey, competitor-exclusivity finding, trademark clearance, development quote, final legal review, actual retention result, Godot build, billing-plugin compatibility proof, device test, complete economic balance run, or launch forecast has been performed by producing these documents.

The first-arc length, price tests, retention gates, content counts, and market rules are hypotheses to validate. Exact job salaries, tuition, mortgage rates, fees, and rental figures in this pack are fictional tuning values, not Dubai recommendations. Simulated crypto is not a real investment feature.

## Rights and naming

“Kairosoft-inspired” is an internal artistic reference, not a license or co-brand. Create original sprites, interface structure, characters, and landmarks. Working district, business, instrument, and game names are not cleared. Do not ship a close misspelling of a real company or reproduce copyrighted course/competitor imagery. Keep a rights manifest and obtain review of the final brand and store presentation before publication.
