# 10. Rights review

Nothing in this repository should be published without the review below. This
document exists so the review is a checklist rather than a discovery.

## Original, and safe to ship

| Asset | Status |
|---|---|
| All code | Original. No engine, no physics library, no framework, no third-party source. |
| Marble designs | Each marble carries its **national flag**, drawn under glass. Every flag is **drawn procedurally from our own vector specification** (`src/data/flags.js` + `flagdraw.js`) — no flag image, SVG or icon set from any third party is imported, traced or recoloured, so no third party holds copyright in the rendering we ship. Complex central charges (eagles, calligraphy, lions, temples) are stylised rather than reproduced: at the size a marble is drawn they resolve to a handful of pixels. No federation crest, badge or competition mark appears anywhere. |
| Arena art | Original, drawn procedurally on canvas from the arena geometry. |
| Trophy representation | A generic cup glyph. **No trophy likeness is reproduced.** The FIFA World Cup Trophy is protected as a three-dimensional mark and a design; the shipping app needs its own original trophy sculpt, which must not resemble it. |
| Audio | Synthesised at runtime from oscillators. No samples, no licensed audio. |
| Nation names | Country names are not licensable marks and are used descriptively. |
| Typography | Google Fonts (IBM Plex Sans, SIL OFL; Saira Condensed, SIL OFL) — both permit embedding and commercial use. Verify the licence text ships with the app. |

## Requires review before publication

| Item | Issue | Proposed handling |
|---|---|---|
| **Competition names** — "World Cup", "FIFA World Cup", "Asian Qualification", "AFC" | "FIFA" and "FIFA World Cup" are registered marks. "World Cup" is contested and jurisdiction-dependent. | Legal review in every target market. Default plan: rename in-app to original descriptive names (for example *World Finals 2026*, *Asian Road to 2026*) and use governing-body names **only** in the ruleset-sources sheet as attributed citations of public regulations. |
| **Confederation names and marks** — FIFA, AFC, UEFA, CAF, CONMEBOL, CONCACAF, OFC | Registered marks. | Text references in the sources sheet only. No logos, ever. |
| **Store listing and screenshots** | Must not imply endorsement, licence or affiliation. | A persistent in-app line — *"Not affiliated with or endorsed by any football governing body. Competition formats are described from published regulations; all results are simulated."* — on the ruleset sheet and in the store description. |
| **Source links** | Linking to public regulation pages is fine; reproducing regulation text at length is not. | Cite and link. Never paste regulation text into the app. |
| **Nation naming conventions** | Some names are politically sensitive and some are contested. | Use the governing body's own competition-entry spelling, which is what the data file does, and review the list with counsel for the target markets. |
| **Flag use, not flag copyright** | National flags are state symbols rather than third-party creative works, and our renderings are original. Several jurisdictions nonetheless regulate *how* a flag may be used commercially or depicted (proportions, defacement, distortion). Our marbles crop a flag to a circle and squash it horizontally to keep vertical designs visible, which is a depiction choice a regulator could take a view on. | Counsel review in the target markets, with a documented fallback: a settings toggle that swaps flag marbles for abstract colour marbles, and a per-nation override so a single problematic case can be changed without touching the rest. |
| **Stylised charges** | Where a flag's central emblem is simplified, the result is recognisable but not accurate. | Treat as an accuracy issue rather than a rights one, but review the shortlist of stylised flags before release and upgrade the ones that read poorly. |

## Standing rules for the team

1. Never import, trace, or recolour a third-party flag image, SVG or icon set.
   Flags are drawn from our own specification in `src/data/flags.js` or they do
   not ship.
2. Never reproduce a trophy likeness, a federation crest, or a competition logo.
3. Never claim or imply official status, endorsement, licence or partnership.
4. Never present a simulated result as a real one. Every result screen already
   carries the simulation version and seed.
5. Any new competition must record its sources at the point it is written, not
   afterwards.
