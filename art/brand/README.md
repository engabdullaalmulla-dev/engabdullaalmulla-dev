# Café Life brand assets

Created on 18 September 2026 for the daily café rebuild. The icon and matching standalone
mark are original generations made with the built-in ImageGen tool for this project. The
standalone mark was generated using the icon as its visual reference. The prompts below are
preserved verbatim from those generation requests.

## Delivered files

| File | Format and purpose |
| --- | --- |
| `../../native/assets/icon.png` | Final 1024 × 1024 RGB PNG, fully opaque, for the iOS app icon. The square artwork is unmasked; iOS applies its own corner shape. |
| `icon-original.png` | Preserved 1254 × 1254 RGB source generation before preparation of the final app icon. |
| `logo.png` | Matching 1254 × 1254 RGBA standalone mark with a transparent background. |
| `logo-en.svg` | 1000 × 300 English lockup: embedded logo image and editable “Café Life” text, using Georgia with a serif fallback. |
| `logo-ar.svg` | 1000 × 300 Arabic lockup: embedded logo image and editable “حياة المقهى” text, using Tahoma, Arial and sans-serif fallbacks. |

The SVG lockups are self-contained: their mark is an embedded raster image and their
wordmark is editable SVG text. They are not an all-vector tracing of the generated mark.
Their text uses local fonts; they request no remote resources. The game build embeds the
icon and transparent mark into its offline document through `window.BRAND_DATA`.

## Original generation sources

These local generation-cache paths record provenance. The delivered copies above are the
repository assets; builds do not depend on a user's generation cache.

- Icon: `~/.codex/generated_images/01a0b454-3289-7171-be95-4952a0014fd2/exec-2377086e-09f5-4c28-be94-c0dcbe2542ef.png`
- Matching transparent mark: `~/.codex/generated_images/01a0b454-3289-7171-be95-4952a0014fd2/exec-44d20973-8c93-48c6-af37-2a8e97aa90f2.png`

## Icon generation prompt

> Use case: logo-brand. Asset type: final iOS app icon for Café Life, a warm premium UAE neighbourhood café and family-life game. Create one square 1024x1024 full-bleed app icon, with no rounded external mask (iOS adds it). A beautifully stylized warm ivory ceramic coffee cup on a tiny golden saucer, the handle subtly heart-shaped, two elegant curls of steam suggesting a welcoming arched doorway above it. Deep garden teal background, cream, soft honey-gold and a tiny terracotta accent. Sophisticated gently dimensional illustrated enamel/painted finish, clean silhouettes readable at 40 pixels, friendly and premium, lovely soft light. The cup is the dominant centre object with generous safe margins, no busy scene, no people, no text, no letters, no border, no watermark, no coffee-chain resemblance. The graphic should communicate a place to belong and an inviting cup, not a coffee delivery company. Full square opaque background.

## Matching mark generation prompt

Use the generated icon above as the reference image.

> Use case: logo-brand. Create the matching standalone logo mark for this Café Life app icon, with a genuinely transparent background. Preserve the recognisable cup with a heart-shaped handle and the steam arch above it. Simplify to an elegant, clean, vector-like emblem, garden teal cup silhouette/outline with warm honey-gold steam and tiny terracotta detail; flat high-quality shapes, no photorealistic shading, no saucer detail clutter. Generous padding. The mark must read on a cream background and at small app header size. No text, no letters, no background, no square tile, no border, no watermark. It is the matching visual brand mark of the supplied reference, not a different symbol.

Generative output can vary between runs. Preserve the supplied source files when the exact
current appearance is required. Future icon exports should remain square, 1024 × 1024 and
opaque; keep the standalone mark transparent and retain the English and Arabic wordmarks.
