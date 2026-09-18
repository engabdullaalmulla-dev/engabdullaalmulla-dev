# Build 9 hosting keepsakes

Created 18 September 2026 with the built-in `image_gen` tool using the `imagegen`
skill. These are new AI-generated raster illustrations, not modified stock art.
Existing `f_dallah.png` and `room_evening.png` were inspected for the game's warm
painted treatment. No existing game asset was overwritten.

All six source PNGs are 1254 × 1254 pixels in RGBA format. Inspection confirmed
real transparency (alpha extrema 0–255), intact silhouettes, no visible lettering,
and the intended keepsake subjects. The normal game build may resize and encode
these sources for the embedded app. Keep the source alpha channel.

| Source | Subject | Source bytes |
| --- | --- | ---: |
| `sprites/host_photo.png` | Fictional café reunion group in a wood frame | 2,053,498 |
| `sprites/host_picnic.png` | Woven hamper, cloth, brass thermos and cups | 2,202,529 |
| `sprites/host_menu.png` | Wordless illustrated cup and flavour menu | 2,323,276 |
| `sprites/host_recipe.png` | Open illustrated recipe notebook | 1,871,196 |
| `sprites/host_landscape.png` | Neighbourhood watercolor with a bicycle | 1,903,431 |
| `sprites/host_sketch.png` | Cheerful shared boat sketch on a display board | 2,233,989 |

## Prompt set

Every new image used `Use case: stylized-concept`, requested a single transparent
PNG keepsake sprite for a premium cozy Emirati café life mobile game, and asked
for a polished hand-painted 2D treatment with warm light, cream, ochre, moss green,
walnut and muted terracotta. The composition requested a centered isolated object,
square canvas, a clean silhouette, generous transparent margin, no surrounding
environment or floor plane, and no words, letters, numbers, logo or watermark.
Legibility at approximately 80 pixels was requested.

Asset-specific prompts:

- **Photo:** A standing walnut wooden picture frame containing a warm painted
  reunion group portrait: six fictional adult friends of varied ages gathered at
  a café table, including an Emirati man in a white kandura and a woman with a
  cream headscarf. Friendly non-identifying simplified faces, a largely
  front-facing frame with slight three-quarter depth, no extra loose objects.
- **Picnic:** A woven date-palm picnic hamper with cream and moss checked cloth
  folded over the edge, a brass-coloured insulated coffee flask and two tiny
  cream cups visibly nestled inside. Clear three-quarter view and recognisable
  handle; avoid overly intricate clutter.
- **Menu:** A walnut-framed cream paper menu with three rows made only of
  watercolor illustrations of little cups, a golden dallah, cardamom pods,
  saffron blossom and ornamental dots. No writing or fake glyphs.
- **Recipe:** A small open notebook with cream pages, moss cloth hardback cover
  and terracotta ribbon bookmark, in gentle three-quarter overhead view. Pages
  show watercolor drawings of a cup, cardamom, saffron and a brass dallah, with
  ornamental lines but no words or fake glyphs.
- **Landscape:** A landscape-proportioned walnut frame around a treasured loose
  watercolor of a 1990s UAE neighbourhood shopping street. Sand-coloured
  low-rise buildings, shaded arches, unlettered café, date palm, flower pots and
  golden morning light; no skyscrapers.
- **Sketch (initial):** A framed playful community café sketch, with an arched
  window, round table, two mismatched chairs, brass coffee pot and cups, in loose
  pencil or charcoal outlines and watercolor patches.

Two final edits used `Use case: precise-object-edit` with the generated local PNGs
as references. The final landscape prompt added a small moss-green bicycle leaned
against the café wall *within* the painting, preserving the frame, palette,
composition and outside transparency. The final sketch prompt replaced the
interior café drawing with a cheerful shared **boat** sketch: cream paper, a little
wooden dhow on blue-green waves, one lopsided ochre triangular sail, funny round
portholes, happy sun, lively imperfect charcoal lines, moss/ochre/terracotta
accents and a small wood clip. It preserved the warm walnut frame, square
composition and genuine transparent outer background. These edits match the
authored hosting souvenirs. The initial landscape and café-sketch variants are
not game assets.

## Review limits

These checks establish asset contents and format. Final room placement and
small-screen legibility still need to be reviewed in the actual game layout.
No image editor or programmatic painting was used; files were copied unchanged
from the built-in generator's output. Image metadata and alpha were read only.
