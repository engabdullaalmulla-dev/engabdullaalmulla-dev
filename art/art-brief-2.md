# Café Life — art brief 2

**Give this whole file to an image-generating AI. Everything it needs is here.**

This is the **second** set. Forty-one assets already exist and ship. **Ninety-five** more are
listed below (ninety-six entries — one of them, A-12, is deliberately not generated). Read §2 before generating anything — the hard part of this set is not the
prompts, it is matching art that already exists.

---

## 1. What art can and cannot fix

Be clear about this before spending an afternoon on it.

Driving the game for thirty simulated years showed the ceiling is **systemic, not
artistic**: seats, board slots and recipes all max out around year twelve and the next
eighteen years are flat. No quantity of new pictures changes that. More dishes do not make
year twenty interesting.

**But two of the gaps below are real blockers that no system can work around:**

**Fittings (§A).** The game's core reward loop is *buy a thing, see it appear in your café*.
There are currently **zero** assets for this — the prototype puts emoji in the room. Thirty-two
objects turn the shop from a stat screen into the thing people actually play a tycoon game
for. **This is the highest-value art in this document.**

**People ageing (§B).** This is a game where you run a café for forty years and then your
daughter runs it. A regular met at 25 must visibly be 55 later. A child who came in with her
mother must grow up and order for herself. Nothing but art can do this, and without it the
generational frame is just a number changing on a screen.

Everything after §B is breadth, and breadth is worth having, but those two are the ones that
buy longevity.

---

## 2. How to work — read this before generating anything

### The anchor is no longer a prompt, it is the existing art

Last time the anchor was one latte you generated first. This time the anchor is **the
forty-one assets already in the game**. New art that does not match them is worse than no new
art, because a mismatched set reads as broken rather than as incomplete.

**Before each batch, upload the reference images and say:**

> *"Match the exact style, camera angle, lighting direction, level of detail and background of
> these images. Same hand-painted glossy look, same warm key light from the upper left, same
> plain flat grey background."*

| Generating | Upload as reference |
|---|---|
| Fittings (§A) | `latte.png`, `m_espresso.png`, `m_oven.png` |
| People (§B) | The two or three existing portraits nearest in age and dress |
| **Aged portraits (§B2)** | **The original portrait of that exact person, and nothing else** |
| Rooms (§C) and branches (§D) | `room_day.png`, `room_evening.png` |
| Dishes (§E) | `latte.png`, `karak.png`, `luqaimat.png` |

Stay in one conversation per section. If the style drifts, re-upload and say *"match this."*

### Order of work

1. **§A fittings first.** Most valuable, and objects are where generators are most reliable.
2. **§C rooms**, because §A objects have to sit in them believably.
3. **§E dishes**, easy wins, same recipe as last time.
4. **§D branches.**
5. **§B people last** — faces are where generators are least consistent, and the ageing
   pass in §B2 is the hardest thing in this document. Come to it with a working rhythm.

### Judge them as a row, never one at a time

Fittings appear in the room at **40–70 px**. Portraits at **40–72 px**. Before accepting
anything, shrink the whole batch to that size and look at them together. Anything you cannot
identify at that size needs a bolder silhouette and must be regenerated, not accepted.

---

## 3. Output requirements — apply to every image

| Requirement | Value |
|---|---|
| Aspect ratio | Square 1:1, except rooms and branches (marked) |
| Resolution | 1024 × 1024 minimum |
| Background | **Plain flat neutral grey.** No gradient, no scene, no surface |
| Subject | **One object only.** No duplicates, no side props, no hands |
| Framing | Centred, filling about 80% of the frame, clear margin all round |
| Camera | Three-quarter view from **30 degrees above** — identical for every object |
| Light | Single warm key from **upper left**, soft cool fill from lower right |
| Shadow | One soft contact shadow beneath. Nothing else |
| Text | **None.** No labels, no brand names, no writing |

---

## 4. The stems

Do not edit these between assets. If you improve one halfway through, everything before it
must be regenerated.

**Object stem** — §A fittings, §E dishes:

```
mobile casual game asset, hand-painted digital illustration, glossy stylised realism, rich
saturated colour, soft airbrushed shading with crisp specular highlights, subtle dark outline,
appetising and clean, three-quarter view from 30 degrees above, single warm key light from the
upper left with a soft cool fill from the lower right, one soft contact shadow beneath, object
centred and filling 80 percent of the frame, plain flat neutral grey background, no text, no
labels, no logo, no hands, no props
```

**Character stem** — §B:

```
mobile casual game character portrait, hand-painted digital illustration, glossy stylised
realism, warm friendly face, large expressive eyes, soft airbrushed skin shading, gentle smile,
head and shoulders only, facing forward, single warm key light from the upper left, plain flat
neutral grey background, no text, no logo, no hands
```

**Scene stem** — §C rooms, §D branches. This is the object stem with the centring clause
removed:

```
mobile casual game background plate, hand-painted digital illustration, glossy stylised
realism, rich saturated colour, soft airbrushed shading with crisp specular highlights, single
warm key light from the upper left, warm and inviting, no people, no text, no labels, no logo
```

**Negative prompt** (Stable Diffusion / Flux; Midjourney after `--no`):

```
photograph, photorealistic, 3d render, cgi, low quality, blurry, watermark, signature, text,
letters, numbers, logo, hands, fingers, busy background, gradient background, drop shadow,
harsh rim light, flat vector, cel shading, outline sketch, duplicate objects, cropped,
off-centre
```

---

## §A — Fittings · 32 assets

Everything a player can buy, so it can appear in the room the moment they buy it. These are
the most valuable assets in this document.

Each must read as **one silhouette at 50 px**. A bookshelf crowded with forty tiny objects
becomes a grey rectangle; a bookshelf with six bold shapes still reads.

### Seating — 6

| # | Name | Subject line |
|---|---|---|
| F-01 | Wooden stool | a simple round wooden bar stool with three splayed legs, worn honey-coloured wood |
| F-02 | Padded stool | an upholstered bar stool with a tan leather seat and a black metal footrest |
| F-03 | Small table | a small round café table with a dark wood top and a single cast iron pedestal base |
| F-04 | Large table | a rectangular wooden café table for four with square tapered legs, warm oak |
| F-05 | Corner banquette | a padded corner bench seat in deep terracotta fabric with button tufting and a wooden base |
| F-06 | Outdoor set | a small round metal bistro table with two folding chairs, painted dark green, seen as one group |

### The counter front — 5

| # | Name | Subject line |
|---|---|---|
| F-07 | Pastry case | a curved glass countertop pastry display case with two brass-edged shelves, empty and lit from within |
| F-08 | Menu board | a freestanding wooden A-frame chalkboard, the slate surface blank and softly dusty |
| F-09 | Till | a vintage brass and enamel cash register with round keys and a pull lever |
| F-10 | Cup shelf | a small wooden wall shelf stacked with neat rows of white porcelain cups and saucers, shown on its own as a floating object with **no wall behind it and no shadow cast onto the background** |
| F-11 | Water station | a tall glass water dispenser with a brass tap on a small wooden stand, a stack of glasses beside it |

### Equipment — 6

These extend the six machines that already exist. Match `m_espresso.png` exactly.

| # | Name | Subject line |
|---|---|---|
| F-12 | Coffee grinder | a chrome and black conical burr coffee grinder with a glass bean hopper on top |
| F-13 | Blender | a heavy countertop blender with a thick glass jug and a brushed steel base |
| F-14 | Dallah set | a traditional Arabic brass coffee dallah with a long curved spout, beside three small **plain undecorated white** handleless finjan cups with a single thin gold rim and **no crest, emblem, badge or pattern of any kind on them** |
| F-15 | Citrus juicer | a cast metal manual citrus press with a long lever arm, painted deep red |
| F-16 | Sahlab urn | a polished steel heated drinks urn with a brass tap and a domed lid, gently steaming |
| F-17 | Saj griddle | a domed black cast iron saj griddle on a low burner, used for thin regag bread |

**Anything wall-mounted — F-10, F-19, F-23 — must be drawn floating, with no wall and no
shadow cast onto the backdrop.** Saying "no wall" is not enough on its own; say **floating in
empty space**, which is the phrasing that works. F-18 passes without it only because a pendant
hangs on a cord in mid-air rather than against a surface. The cut keys out a flat grey by flooding in from the edges, so
a shadow on the wall is not background: it survives as a grey slab welded to the object. F-10
came back this way and had to be redone.

### Atmosphere — 8

| # | Name | Subject line |
|---|---|---|
| F-18 | Pendant lamp | a single brass pendant lamp with a ribbed amber glass shade, hanging from a short cord, lit |
| F-19 | Wall lamp | a small brass wall sconce with a frosted glass globe, warm light glowing, **floating in empty space with no wall, no mounting surface and no shadow falling on the background** |
| F-20 | Rug | a flat woven kilim rug in terracotta, cream and deep teal geometric bands, seen from above at an angle |
| F-21 | Small plant | a small potted trailing pothos in a plain terracotta pot, **hand-painted game art and not a photograph**, standing on nothing with no shelf or table surface under it |
| F-22 | Large plant | a tall potted monstera with four broad glossy leaves in a woven basket planter |
| F-23 | Framed pictures | a cluster of three small framed pictures in mismatched brass and dark wood frames, the images soft and abstract, **floating in empty space with no wall behind them and no shadow falling on the background** |
| F-24 | Bookshelf | a short open wooden bookshelf with a handful of worn books and one small brass ornament |
| F-25 | Radio | a small vintage tabletop radio in cream bakelite with a gold mesh speaker grille and two round dials |

### Climate and back of house — 4

| # | Name | Subject line |
|---|---|---|
| F-26 | Air conditioner | a wall-mounted white split air conditioning unit with horizontal vanes, clean and modern |
| F-27 | Heater | a small freestanding oil-filled column radiator in cream enamel |
| F-28 | Fridge | a compact stainless steel under-counter refrigerator with a single door and a brushed handle |
| F-29 | Sink station | a double stainless steel commercial sink with a tall swan-neck mixer tap |

### Outside — 3

| # | Name | Subject line |
|---|---|---|
| F-30 | Awning | a folded fabric shop awning in wide terracotta and cream stripes with a scalloped edge, on a metal frame |
| F-31 | Painted sign | a blank hanging shop sign board in dark painted wood with a brass frame and two chain links, **no writing on it** |
| F-32 | Planter box | a long wooden street planter box filled with low green shrubs and small white flowers |

---

## §B — People · 23 assets (12 to generate)

The forever engine. Twelve portraits exist; this takes the street to twenty-four faces, ages
the existing twelve, and adds the six children who grow up across generations.

### §B1 — Twelve more regulars · C-13 to C-24

A Dubai shopping street. Depict everyone warmly and respectfully — these are people the
player grows fond of over decades, not caricatures. Use the **character stem**.

| # | Name | Subject line |
|---|---|---|
| C-13 | Taxi driver | a man in his fifties with a thick grey moustache and a lined kind face, a pale blue collared shirt |
| C-14 | Nurse | a woman in her thirties with dark hair tied back tightly, warm brown skin, pale green medical scrubs |
| C-15 | Builder | a man in his forties with a weathered tanned face and short black hair, a high-visibility orange vest over a grey shirt |
| C-16 | Fishmonger | a stocky man in his fifties with a shaved head and a broad grin, a navy apron over a white shirt |
| C-17 | Lawyer | a woman in her forties with sleek shoulder-length black hair and small gold earrings, a charcoal blazer |
| C-18 | Art student | a young person in their twenties with cropped bleached hair and a nose ring, a paint-flecked denim jacket |
| C-19 | Imam | a serene man in his sixties with a full white beard and a white embroidered kufi cap, a grey thobe |
| C-20 | Gym owner | a broad-shouldered woman in her thirties with a high ponytail and freckles, a black athletic zip top |
| C-21 | Tailor | an older South Asian man in his sixties with round wire spectacles and neat white hair, a beige waistcoat with a tape measure round his neck |
| C-22 | Flight attendant | a poised woman in her twenties with hair in a neat chignon, a deep red uniform jacket and a small scarf |
| C-23 | Musician | a man in his thirties with long dark hair tied back and a short beard, a faded black band t-shirt |
| C-24 | Retired teacher | a woman in her seventies with short silver curls and bright attentive eyes, a soft blue cardigan and reading glasses on a chain, **hand-painted game art and not a photograph**, matching the other portraits in this set |

### §B2 — The same twelve, thirty years older · A-01 to A-12

> **Only six of these are ever drawn.** `faceArt` reaches for an `_old` portrait only for a
> **regular** — `REG_FACE` names six of them: p3, p4, p5, p6, p9, p11. Everyone else in the
> cast is a walk-in, a different person every service, so there is nobody for thirty years to
> happen to. The other five rows below are marked *not drawn*: pleasant to have, but no part
> of the game is waiting on them.
>
> **This batch is finished.** All eleven are generated; `art/sprites/PLACEHOLDERS.json` is an
> empty list, which is how the pipeline records "nothing left to replace". `art/pipeline/age.py`
> still derives a hair-greying stand-in and stays in the tree for any character added later —
> it reads acceptably at the 40 px a service row draws and visibly as a filter at the 150 px a
> story screen reaches, so it is a scaffold, never a shipped asset.
>


**The hardest and most important batch in this document.** These are not new people. Each is
the *same person* from the existing set, three decades on, so a player who met them in 1998
recognises them in 2028.

**Method — do these one at a time:**

1. Upload **only** the original portrait for that person.
2. Prompt: *"The same person as this image, thirty years older. Keep the same face shape, eye
   colour, skin tone, nose and smile. Age it naturally: greying or thinning hair, deeper lines
   around the eyes and mouth, slightly softer jaw. Same clothing style, worn a little more
   plainly. Identical art style, lighting, framing and plain grey background."*
3. Put the two side by side. If a stranger could not tell they are the same person, regenerate.

| # | Ages | From | Drawn? | State |
|---|---|---|---|---|
| A-01 | Young man with curls → a man in his fifties | `p1.png` | not drawn | done |
| A-02 | Woman with auburn bob → a woman in her sixties, hair faded to sandy grey | `p2.png` | not drawn | done |
| A-03 | Emirati man → a man in his seventies, moustache white | `p3.png` | **khalid** | done |
| A-04 | Emirati woman → a woman in her sixties | `p4.png` | **aisha** | done |
| A-05 | Student → a woman in her fifties, the same round glasses | `p5.png` | **noor** | done |
| A-06 | Older man → a man in his eighties, frailer, still neat | `p6.png` | **haddad** | done |
| A-07 | Courier → a man in his fifties, the red cap long gone | `p7.png` | not drawn | done |
| A-08 | Older woman → a woman in her nineties, very lined, still warm | `p8.png` | not drawn | done |
| A-09 | Office worker → a woman in her seventies, hair fully silver | `p9.png` | **dana** | done |
| A-10 | Teenager → a man in his forties, the shyness gone | `p10.png` | not drawn | done, weakest of the set |
| A-11 | Shopkeeper → a man in his sixties, heavier, greying stubble | `p11.png` | **samir** | done |
| A-12 | Grandmother → *skip.* She does not get thirty more years. | — | — | — |

**A-12 is deliberately not generated.** In a game about a café that outlives people, one of the
twelve has to be the one who stops coming in, and the absence of the asset is the point.
Eleven images in this batch, not twelve.

> An A-12 was generated anyway and is held, unprocessed, at
> `art/raw-aged-held/grandmother-older.png`. It is a good image. It is out of the sprite set
> because the beat above is the reason the row says *skip*, and an asset sitting in
> `art/sprites` is an invitation to wire it up and lose that. `NAMES` only maps `a-01`..`a-11`,
> so the pipeline will not pick it up even by accident. Renaming it `a-12-*.png` and widening
> that range is all it would take to change the decision.

### The cast wears too few faces

Measured across all twenty-three portraits, comparing only the eyes-nose-mouth box with skin
tone and lighting normalised out: **p6, p13, p15, p19 and p21 are one man**, and **p4, p9,
p14, p17 and p22 are one woman.** p6/p13 scores 0.972 where two plainly different people
score around −0.35. Different hair, different clothes, same face.

For most games this would be a shrug. For this one it is close to fatal, because the premise
is that you come to know six people over thirty years — and that collapses the moment
haddad's face walks in as a taxi driver who orders once and leaves. **A face may be a
regular's or a stranger's, never both.**

The immediate repair is in `WALKIN`, which now excludes every portrait that collides with a
regular. The worst remaining score in the pool is 0.743, and that pair (p18 against p6) is a
false positive the eye rejects instantly — a bleached-blond young man with a nose ring against
a grey man with a moustache. The metric over-scores on brow and nose geometry, so it is a
shortlist for looking, never the verdict.

The real repair is more faces. C-25 and C-26 are the first two. **§B1b at the end of this
document has the other nine written out**, each with a named facial geometry — jaw, nose,
brow, eye spacing — instead of the job title and age that produced one man and one woman
re-dressed eleven times, plus the style-reference rule that five rejected photographs showed
was needed.

**Do not generate A-13.** p13 is haddad's face; ageing it would produce a second haddad.

### The bench — p13 to p23, now walk-ins

These eleven used to be drawn by nothing: `REG_FACE` named six people, `WALKIN` named six
more, and p13 upward appeared in neither. They are now in `WALKIN`, so the walk-in pool is
seventeen faces rather than six and the street stops looking like the same handful of people
all afternoon. Nothing else had to change — a walk-in needs no story and no name.

**Their aged portraits are a separate matter.** p14 to p19 have generated `_old` art and
`NAMES` maps `a-13` to `a-24`, so any of them processes cleanly. But `faceArt` only reaches
for `_old` on a **regular**, and a walk-in is a different person every service — there is
nobody for the years to happen to. So the aged bench art sits ready and undrawn until one of
those people is promoted into `REG_FACE`, which means writing them a story: beats, and the
café-state gates those beats open on. That is a design decision about who the café's regulars
are, and the art no longer blocks it.

| In the walk-in pool | Cut — wears a regular's face | Aged art exists |
|---|---|---|
| p16 fishmonger, p18 art student, p20 gym, p23 musician, p25, p26 | p13 taxi, p14 nurse, p15 builder, p17 lawyer, p19 imam, p21 tailor, p22 cabin crew | all of p14–p23 |

The cut portraits and their aged versions stay in `art/sprites`. They are good art and cost
nothing to keep; they are simply unusable as strangers while they wear a regular's face.

**p24 does not exist yet.** C-24, the retired teacher, is the last portrait in the cast and has
now come back as a photograph twice. The second attempt is kept at
`art/raw-aged-held/c-24-REJECTED-photograph.png` so the next try has something to beat.

It is a good likeness of the brief — short silver curls, blue cardigan, reading glasses on a
chain — and it is still unusable, because it is a photograph of a real-looking person sitting
in a cast of painted ones. Zoomed to the eyes and cheek against any accepted portrait the
difference is not subtle: real pores and photographic depth of field on one side, smooth
gradient skin and drawn lashes on the other. Attaching an accepted portrait and asking for
*"the same painted style as this"* is a stronger instruction than any adjective, because the
phrase **hand-painted game art and not a photograph** is already in the prompt and did not
hold on its own.

### ~~§B3 — Six children · K-01 to K-06~~ — CUT

> **Cut, and not because a generator refused.** It did refuse, which is the guardrail working
> as designed: a close-up, realistically-shaded portrait of a six-year-old is exactly the shape
> of request image models block, and that is not something to engineer around.
>
> It turned out not to matter, because **the game never draws a child.** Every child in the
> design appears in the *text* of an adult's story beat, on a card showing the adult's face —
> Aisha watches Mariam grow from six to sixteen across four beats, and the face on all four is
> Aisha's. That is the better telling anyway: the story is a mother watching her daughter, so
> the mother is who you should be looking at.
>
> A child who grows up enough to become a regular in her own right is, by then, an adult
> portrait — generate her in §B1 as a young woman, with no child version ever needed.
>
> ~~The original six follow, kept only as a record of what was asked for.~~

### ~~Original K-01 to K-06~~

Children who appear young and grow into adults across a generation. Each one is the **child
version of an existing or new adult** — same face, same eyes, twenty-five years earlier.
Upload the adult portrait and ask for the child.

| # | Name | Subject line |
|---|---|---|
| K-01 | Girl, six | a cheerful girl of about six with dark hair in two short plaits and a bright yellow t-shirt, two front teeth missing |
| K-02 | Boy, seven | a boy of about seven with close-cropped black hair and large curious eyes, a striped green polo shirt |
| K-03 | Girl, eleven | a girl of about eleven with long dark hair and a serious, slightly wary expression, a plain school uniform |
| K-04 | Boy, twelve | a boy of about twelve with a mop of curly hair and a wide gap-toothed grin, a football shirt |
| K-05 | Girl, sixteen | a teenage girl of about sixteen with hair in a high bun and a confident level gaze, a denim jacket |
| K-06 | Boy, sixteen | a teenage boy of about sixteen, tall and thin with a first shadow of a moustache, a grey hoodie |

---

## §C — Room states · 10 assets

> **The street through the window is wrong in R-04, R-05 and R-06.** All three show pastel
> European townhouses, deciduous trees and a cast-iron lamppost. The game is set on a UAE
> shopping street and the menu is karak, luqaimat, regag and qahwa. The three are consistent
> with each other and usable, but the room is the most-seen image in the game and this is the
> one detail in it that contradicts the premise.
>
> **Every room prompt from here must carry this clause**, and R-04 to R-06 should be redone as
> a set, in one conversation, with R-04 attached so the geometry holds:
>
> *"the street outside the window is a UAE shopping street — low sand-coloured buildings, date
> palms, a hot white sky — not a European street, no deciduous trees, no pastel townhouses"*
>
> **UPDATE.** R-04 to R-07 have been redone and the street is right — palms, sand-coloured
> arched buildings, a hot white sky. But the redo also changed the interior: the counter is now
> a **teal-painted front with a pale marble top**, where R-09 to R-13 still have a **wood front
> and a wood top**. The counter is the largest object in the frame, so the set is split until
> R-09 to R-13 are regenerated from the new R-07. Attach `room_large` to every one of them.
>
> R-08 was rejected separately: legible English text baked in — a "A Quieter Place" sign and
> three book spines — plus 1536x1024 instead of 1672x941 and a photoreal rather than painted
> treatment. Text in a plate cannot be localised, and this game ships in Arabic.
>
> ~~**All ten plates are now generated and all ten carry the European street.**~~ That is at least
> uniform: it is one decision to make rather than a split set. Redoing them is ten images in
> one conversation with R-04 attached, and nothing in the game is blocked while they stand.



**16:9, scene stem, no people.** The same café at different stages of its life and different
times of day. R-04 matters most: it is the first thing a new player sees.

**Do R-04 before the rest of §A.** Found while placing the first fittings: the two room
plates that already exist are *fully furnished* — chairs, tables, a banquette, plants, all
painted in. You cannot lay a bought stool on top of a room that already has chairs, so the
build-from-scratch loop has no backdrop until the bare shop exists. R-04 is a dependency of
every asset in §A, not breadth.

| # | Name | Subject line |
|---|---|---|
| R-04 | **The bare shop** | an almost empty small shop unit, bare concrete floor, one plain wooden counter, two stools, a single small coffee machine, blank walls, a shuttered window, cold flat morning light, nothing on the shelves, faintly sad and full of potential |
| R-05 | Modest café | the same small shop a few years on, a few mismatched chairs and one small table, a handful of cups on a plain shelf, one potted plant, warm but still sparse |
| R-06 | Established café | the same café now comfortably furnished, tiled teal wall, full shelves of cups and jars, three tables, hanging pendant lamps, plants, warm and busy-looking |
| R-07 | The large café | the same café extended, a wide room with a long counter, many tables, a staircase rising at the back, generous and prosperous |
| R-08 | The back room | a small quiet back room of a café, one low table and a soft bench, a single lamp, a shelf of books, calm and away from the counter |
| R-09 | Night | the café interior late at night, chairs stacked on tables, one lamp left on over the counter, the street outside black and empty |
| R-10 | Rain | the café interior on a rare rainy evening, water running down the window, the street outside glossy with reflected light, warm inside |
| R-11 | Summer glare | the café interior at the height of summer, harsh white light flooding the window, the interior in cool shade, an air conditioner visible |
| R-12 | The nineteen-nineties | the same café interior styled for the late 1990s, a boxy television on a bracket, a wall telephone, patterned laminate counter, warmer and more cluttered |
| R-13 | The twenty-thirties | the same café interior decades later, cleaner lines, slim glass screens on the wall, the same wooden counter now visibly worn smooth, one original pendant lamp kept |

---

## §D — Branch exteriors · 6 assets

**16:9, scene stem, no people.** Each branch is a different street with a different character,
so that opening the fourth café feels like going somewhere rather than buying a number.

| # | Name | Subject line |
|---|---|---|
| B-01 | Jumeirah | the exterior of a small café on a quiet low-rise coastal street, pale stucco walls, bougainvillea, bright open sky, sea light |
| B-02 | Satwa | the exterior of a small café on a busy old shopping street, tangled shopfront signage and awnings, narrow pavement, tailors and grocers either side |
| B-03 | Deira | the exterior of a small café in a narrow souk alley, shaded by fabric canopies, spice sacks and brass shops nearby, dusty golden light |
| B-04 | Karama | the exterior of a small café in a low concrete apartment block, plain balconies above, parked cars, flat late afternoon light |
| B-05 | Mall unit | the frontage of a small café unit inside a polished shopping mall, glass balustrades and marble floors, cool even artificial light |
| B-06 | Airport kiosk | a compact café kiosk in an airport concourse, wide windows onto an apron, tall ceilings, cool blue-grey daylight |

---

## §E — Dishes · 12 assets

Object stem, same as the twelve that exist. Breadth for the menu, and the seasonal and
premium ends of it.

| # | Name | Subject line |
|---|---|---|
| D-13 | Adeni chai | a small clear glass of creamy pale Yemeni adeni chai with a dusting of cardamom, on a **plain undecorated white** saucer with no pattern, rim design or gilding |
| D-14 | Qahwa | a tiny **plain undecorated white** handleless porcelain finjan cup of pale golden Arabic coffee with **no palm motif, banding, crest or gilding on it**, two whole dates beside it |
| D-15 | Kunafa | a wedge of hot orange shredded kunafa pastry with soft white cheese pulling from the cut edge, drizzled with syrup |
| D-16 | Balaleet | a plate of sweet saffron vermicelli topped with a thin folded omelette, garnished with pistachio |
| D-17 | Chebab | a stack of three small saffron pancakes with date syrup and cream cheese, on a white plate |
| D-18 | Khameer bread | a warm round of golden khameer flatbread split and filled with date paste, on a wooden board |
| D-19 | Basbousa | a diamond-cut square of golden semolina cake soaked in syrup with an almond pressed into the top |
| D-20 | Jallab | a tall glass of dark jallab with crushed ice, pine nuts and raisins floating on top |
| D-21 | Rose lemonade | a tall frosted glass of pale pink rose lemonade with mint and a thin lemon slice |
| D-22 | Camel milk cappuccino | a wide ceramic cup of cappuccino with dense pale foam and a simple leaf pattern *(near-duplicate of `latte` by design — acceptable, see the checklist)* |
| D-23 | Sahlab | a warm cup of thick white sahlab dusted with cinnamon and chopped pistachio |
| D-24 | Date maamoul | three small pale shortbread maamoul biscuits with a pressed pattern, one broken open to show a dark date centre |

---

## §F — System objects · 5 assets

Object stem. Small things the interface leans on. Lowest priority — skip if you are tired.

| # | Name | Subject line |
|---|---|---|
| ~~S-01~~ | ~~Open sign~~ | **Cut.** This is the same object as F-31, which is already made. A duplicate in the original brief, spotted when both were generated side by side |
| S-02 | Ledger | a worn hardback accounts ledger lying closed, dark green cloth cover with a brass corner, **hand-painted game art and not a photograph**, square 1:1 |
| S-03 | Keys | a small ring of three worn brass door keys with a leather fob |
| S-04 | Cash box | an open metal cash tin with neatly stacked banknotes and loose coins |
| S-05 | Wall clock | a round wall clock with a plain cream face, brass rim and simple black hands |
| S-06 | Recipe card | a single blank recipe card, aged cream paper, **no writing on it**, **hand-painted game art and not a photograph**, square 1:1 |

---

## 6. Batches

Ninety-four images. Five per message for everything except the ageing pass, which is one at a
time — twenty-eight messages in all. Keep each batch inside one section so the reference
images stay constant.

| Batch | Assets | Notes |
|---|---|---|
| 1–7 | §A F-01 to F-32 | Reference: `latte.png`, `m_espresso.png`, `m_oven.png` |
| 8–9 | §C R-04 to R-13 | 16:9. Reference: `room_day.png`, `room_evening.png` |
| 10 | §D B-01 to B-06 | 16:9 |
| 11–13 | §E D-13 to D-24 | Reference the existing dishes |
| 14–16 | §B1 C-13 to C-24 | Character stem |
| 17–27 | §B2 A-01 to A-11 | **One image per message.** Upload only that person's original |
| 28 | §B3 K-01 to K-06 | Upload the adult, ask for the child |

---

## 7. Quality checklist — every finished asset

- [ ] Plain flat grey background, no gradient, no invented scene
- [ ] One object only, nothing extra in frame
- [ ] Light from upper left, one soft contact shadow beneath
- [ ] No text anywhere, including on signs and boards that are meant to be blank
- [ ] **All crockery is plain.** No emblem, crest, palm motif, coloured banding or gilding on any
      cup, saucer or plate. This is the single most repeated failure in the set — F-14, D-13 and
      D-14 all came back decorated, and F-14 carried the Saudi national emblem, a palm above
      crossed swords, in a game set in the UAE. Generators reach for ornate Gulf crockery on any
      prompt with regional character, and at 34px the decoration is noise whatever it depicts
- [ ] Readable as a silhouette at 50 px — shrink it and check
- [ ] **Dish silhouettes no longer need to be mutually distinct.** That rule came from the rush
      build, where a player triaged bins at 20 px against a clock. In the management sim every
      dish sprite is drawn beside its own name — on the board, in the shop and in the service
      row — so two similar dishes cost nothing. Measured at 20 px, the closest pair in the set is
      `iced` and `dateshake`, both of which already ship
- [ ] Sits convincingly beside the existing forty-one when viewed as a row
- [ ] **§B2 only:** recognisably the same person as the original

---

## 8. Delivering the files

Send them in the batches above. Name them by the reference in this document — `F-01`, `A-05`,
`R-04` — or just say which batch each message is; the pipeline in `art/pipeline/process.py`
cuts the grey background, trims, squares and exports the game sizes.

Assets that are meant to be blank — F-31, S-01, S-06 — will often come back with invented
writing on them. Regenerate rather than accepting; text baked into art cannot be translated
into Arabic later, and this game ships in both.

---

## §B1b — Nine faces, each one specific · C-13r to C-28

**Why this section exists.** §B1 asked for a job title and an age — *"a taxi driver in his
fifties"* — and a generator given that will hand back its default face for that description
every time. It did: five characters came back as one man and five as one woman. This section
replaces the job-title prompt with a **named facial geometry** per person, because a face is
the only thing here that has to be unrepeatable.

**Two rules before any prompt below.**

1. **Attach `p1.png` or `p3.png` and open with:** *"Match the art style of the attached image
   exactly — hand-painted stylised game art, smooth skin, no photographic skin texture, no
   depth of field."* Five images this session came back as photographs with the words
   *hand-painted game art and not a photograph* already in the prompt. The adjective does not
   hold; a reference image does. The four rejects are kept in `art/raw-aged-held/` as
   examples of exactly what not to return.
2. **Never send two of these in one conversation.** Shared context is what makes two faces
   converge.

**Close every prompt with:** *"Plain flat neutral grey background, head and shoulders,
three-quarter view from slightly above, single warm key light from upper left, square 1:1,
no text of any kind."*

| # | Replaces | The face — this is the part that must not be reused |
|---|---|---|
| C-13r | p13 taxi | **Long narrow face, deep-set close-set eyes under a heavy single brow ridge, a long straight nose with a slight bump at the bridge, hollow cheeks, a thin mouth.** Late fifties, deeply weathered brown skin, cropped grey hair receding at the temples, clean-shaven. Wiry, not heavy. |
| C-14r | p14 nurse | **Round full face, wide-set large eyes, short upturned nose, high round cheeks, a small full mouth, a soft undefined jaw.** Late thirties, warm mid-brown skin, black hair pulled into a low tight bun, no fringe. A small dark mole below the left eye. |
| C-15r | p15 builder | **Broad square face, small eyes set wide, a flat broad nose that has been broken once, a heavy square jaw, thick neck.** Forties, dark tanned skin, black hair shaved close to the skull, thick black moustache only. |
| C-17r | p17 lawyer | **Narrow angular face, high sharp cheekbones, straight fine brows, almond eyes set close, a thin aquiline nose, a pointed chin.** Fifties, pale olive skin, black hair in a sharp chin-length bob with a centre parting. |
| C-19r | p19 imam | **Wide face with a broad forehead, heavy-lidded gentle eyes set far apart, a short broad nose, a wide mouth.** Seventies, very dark brown skin, a full white beard and no moustache, round wire glasses. |
| C-21r | p21 tailor | **Small delicate face, a pointed chin, a small thin nose, arched brows, deep laugh lines from nose to mouth.** Sixties, light brown skin, fine white hair swept back from a high forehead, a neat white pencil moustache. Slight build. |
| C-22r | p22 cabin crew | **Heart-shaped face, a wide forehead narrowing to a small chin, very large round eyes, a short straight nose, a wide expressive mouth with a gap between the front teeth.** Thirties, deep brown skin, black hair in a high sleek ponytail. |
| C-27 | new | **Emirati man, fifties. Square face, a strong straight nose, thick straight brows almost meeting, a close-trimmed grey beard, deep-set dark eyes.** White kandura and ghutra with a black agal. *Not* p3's face — p3 is narrower with a moustache only. |
| C-28 | new | **Young man, nineteen. Long oval face, a high forehead, wide-set dark eyes, a long straight nose, a sparse first moustache, prominent ears.** Loose dark curls, olive skin, grey hoodie. *Not* p1's face — p1 is rounder with tighter curls and a broader nose. |

**Check before accepting.** Put the new face beside the regular it must not resemble — C-13r,
C-15r, C-19r and C-21r against **p6 haddad**; C-14r against **p4 aisha**; C-17r and C-22r
against **p9 dana**; C-27 against **p3 khalid**; C-28 against **p1**. If you hesitate for even
a moment about whether they are the same person, regenerate. That hesitation is the whole
defect this section exists to fix.
