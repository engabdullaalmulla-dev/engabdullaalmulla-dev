# Café Rush — art generation brief

**Give this whole file to an image-generating AI (ChatGPT, Gemini, Midjourney, or similar).
Everything it needs is here. Work through it top to bottom.**

---

## 1. What you are making

Art for **Café Rush**, a mobile cooking game set in a small café on a shopping street in the
United Arab Emirates. The player takes orders, makes drinks and pastries from ingredients,
and serves customers against a clock.

There are **41 assets**: 8 ingredients, 12 finished dishes, 12 customer portraits, 6 machines
and 3 room backgrounds.

**The target look** is the painted casual-mobile style of games like Cooking Fever and
Cooking Craze: glossy, appetising, hand-painted digital illustration with rich colour, soft
airbrushed shading and crisp specular highlights. Warm and inviting, not photographic and
not flat vector.

**Critical:** these 41 images must look like **one artist made all of them in one sitting**.
A single asset that looks great alone but sits at a different angle, scale or light direction
ruins the whole set. Consistency matters more than any individual image being beautiful.

---

## 2. How to work — read this before generating anything

Follow this order exactly. Generating assets in a random order is how sets fall apart.

### Step 1 — Make the anchor, and only the anchor

Generate **the Latte** (asset D-03) and nothing else. Iterate on it until it is genuinely
good. Every other asset will be matched to this one image, so time spent here pays back
forty times over.

Do not move on until the anchor is right.

### Step 2 — Keep the anchor in view for everything after

This is the step that actually creates consistency:

- **In ChatGPT or Gemini:** stay in the **same conversation** for all 41 assets. Before each
  new prompt, add this line: *"Match the exact style, camera angle, lighting direction,
  level of detail and background of the latte image you generated earlier."* If the chat gets
  long or the style drifts, re-upload the anchor image and say *"match this."*
- **In Midjourney:** upload the anchor, then append `--sref <url> --sw 100` to every prompt.
- **In Stable Diffusion / ComfyUI:** IP-Adapter with the anchor as reference at ~0.6 weight,
  and a fixed seed.

### Step 3 — Generate the whole set in one session

Image models change over time. A set made across three weeks will not match a set made in one
afternoon, even with identical prompts.

### Step 4 — Judge them as a row, never one at a time

Before accepting anything, put all twelve dishes side by side and shrink them to about 60
pixels wide. In the game they are shown at **34 pixels**, and inside order chips at **20
pixels**. Anything you cannot identify at that size needs a simpler, bolder silhouette — and
must be regenerated, not just accepted.

### Step 5 — Food first, faces last

Faces are where image generators are least consistent. Do all 26 food, machine and room assets
first. Come to the customers with a working set already in hand.

---

## 3. Output requirements — apply to every image

| Requirement | Value |
|---|---|
| Aspect ratio | Square, 1:1 (except the three wide room plates, marked below) |
| Resolution | As large as the tool allows; 1024 × 1024 minimum |
| Background | **Plain flat neutral grey.** No gradient, no scene, no table, no surface |
| Subject | **One object only.** No duplicates, no side props, no cutlery, no hands |
| Framing | Object centred, filling about 80% of the frame, with clear margin on all sides |
| Camera | Three-quarter view from **30 degrees above** — identical for every food asset |
| Light | Single warm key from the **upper left**, soft cool fill from the lower right |
| Shadow | One soft contact shadow directly beneath the object. Nothing else |
| Text | **None.** No labels, no brand names, no writing of any kind |

**Why grey and not transparent:** image generators are unreliable at producing true
transparency. Flat grey with no gradient keys out cleanly afterwards and stops the model
inventing a background scene.

---

## 4. The style stem

Every food, machine and room prompt below is **this block, followed by the subject line**.
Do not edit this block between assets. If you improve it halfway through, you must regenerate
everything that came before.

```
mobile casual game asset, hand-painted digital illustration, glossy stylised realism, rich
saturated colour, soft airbrushed shading with crisp specular highlights, subtle dark outline,
appetising and clean, three-quarter view from 30 degrees above, single warm key light from the
upper left with a soft cool fill from the lower right, one soft contact shadow beneath, object
centred and filling 80 percent of the frame, plain flat neutral grey background, no text, no
labels, no logo, no hands, no props
```

**Negative prompt** (for tools that take one — Stable Diffusion, Flux; Midjourney users put
this after `--no`):

```
photograph, photorealistic, 3d render, cgi, low quality, blurry, watermark, signature, text,
letters, numbers, logo, hands, fingers, cutlery, table setting, busy background, gradient
background, drop shadow, harsh rim light, flat vector, cel shading, outline sketch, duplicate
objects, cropped, off-centre
```

---

## 5. Ingredients — 8 assets

These sit in the machine bins at 34px and in order chips at 20px. Silhouette clarity matters
more than detail.

| # | Name | Subject line (append to the style stem) |
|---|---|---|
| I-01 | Ice | a small cluster of three clear ice cubes, faceted and wet, catching light |
| I-02 | Syrup | a small glass squeeze bottle of golden amber date syrup with a narrow nozzle cap and one glossy drip at the tip |
| I-03 | Date paste | a small white ceramic bowl of glossy dark brown date paste with one whole medjool date resting beside it |
| I-04 | Milk | a polished stainless steel milk pitcher filled with white frothed milk, steam curling from the surface |
| I-05 | Shot | a single shot of espresso in a small white porcelain demitasse cup, thick golden crema on top, no saucer |
| I-06 | Tea | a slim waisted Gulf istikana tea glass filled with clear amber brewed tea |
| I-07 | Pastry | one plain golden butter croissant, crisp flaky laminated layers, freshly baked |
| I-08 | Dough | a smooth pale ball of raw bread dough resting on a lightly floured wooden board |

---

## 6. Dishes — 12 assets

What the customer orders. Each should read as visibly made from its ingredients — the karak is
the tea glass gone milky, the almond croissant is the plain pastry with drizzle added.

**D-03, the Latte, is the anchor. Generate it first.**

| # | Name | Subject line (append to the style stem) |
|---|---|---|
| D-01 | Espresso | a shot of espresso in a small white porcelain demitasse on a matching saucer, thick golden crema, a tiny silver spoon on the saucer |
| D-02 | Mint tea | a waisted Gulf istikana glass of clear amber tea with a fresh green mint sprig resting on the rim |
| **D-03** | **Latte — ANCHOR** | a latte in a wide white ceramic cup on a saucer, a clean white rosetta latte-art leaf in the foam |
| D-04 | Karak chai | a small waisted glass of milky tan karak chai, two green cardamom pods beside the base, faint steam |
| D-05 | Almond croissant | a golden croissant on a small white plate, white icing drizzled across it and toasted flaked almonds scattered on top |
| D-06 | Iced latte | a tall clear glass of iced latte, distinct layers of white milk below and brown espresso above, ice cubes visible, a red and white striped straw |
| D-07 | Date shake | a tall clear glass of thick creamy beige date milkshake, a swirl of whipped cream on top and one whole date on the rim |
| D-08 | Luqaimat | a small white bowl piled with golden crisp fried dough dumplings, glossy dark date syrup drizzled over them, a scatter of sesame seeds |
| D-09 | Regag roll | a thin crisp Emirati regag flatbread rolled into a cone on a small plate, dark date filling visible at the open end |
| D-10 | Saffron karak | a small waisted glass of rich golden-tan saffron karak chai, a few red saffron threads on the surface, a cardamom pod at the base |
| D-11 | Affogato | a short clear glass holding a scoop of white vanilla ice cream with dark espresso poured over it, melting at the edges |
| D-12 | Cardamom cortado | a small clear cortado glass with two distinct layers of espresso and steamed milk, a pinch of ground cardamom dusted on the foam |

---

## 7. Machines and room — 9 assets

The six machines sit in a grid at the bottom of the play screen. The three room plates are the
café itself — note the **wide aspect ratios**, which differ from everything else.

| # | Name | Aspect | Subject line |
|---|---|---|---|
| M-01 | Espresso machine | 1:1 | a compact chrome and black espresso machine seen from the front, one group head and a portafilter, red power light |
| M-02 | Kettle | 1:1 | a polished stainless steel stovetop tea kettle with a black handle, gently steaming |
| M-03 | Syrup dispenser | 1:1 | a countertop glass syrup dispenser with a brass pump top, filled with dark amber syrup |
| M-04 | Steamer | 1:1 | a chrome milk steaming wand and jug rest unit, a small pressure dial on the front |
| M-05 | Oven | 1:1 | a small stainless steel countertop bakery oven with a glass door, warm light glowing inside |
| M-06 | Ice well | 1:1 | a stainless steel countertop ice well filled with crushed ice, a metal scoop resting in it |
| R-01 | Counter surface | **16:5** | a warm polished wooden café counter top seen straight on, subtle grain, a brushed steel front edge, empty and clean, horizontal band composition |
| R-02 | Café, day | **16:9** | the interior of a small warm café seen from behind the counter, a window onto a sunlit shopping street, wooden shelves with cups and jars, tiled teal wall, soft daylight, no people, background plate for a game |
| R-03 | Café, evening | **16:9** | the same small warm café interior at dusk, the street outside dark blue with warm shop lights, pendant lamps lit inside, no people, background plate for a game |

For **R-01 to R-03 only**, drop *"object centred and filling 80 percent of the frame"* from the
style stem — these are scenes, not objects. Keep everything else identical.

---

## 8. Customers — 12 assets

These use a **different stem**, because the camera is front-on and the framing is a bust rather
than a three-quarter object. Generate these **last**.

Twelve heads serve the whole game, paired arbitrarily with twenty-four names. They appear at
about 40 pixels, so expression reads and fine detail does not.

The setting is a Dubai shopping street, so the mix below is deliberate. Depict everyone warmly
and respectfully — these are regulars the player grows fond of, not caricatures.

**Character stem:**

```
mobile casual game character portrait, hand-painted digital illustration, glossy stylised
realism, warm friendly face, large expressive eyes, soft airbrushed skin shading, gentle smile,
head and shoulders only, facing forward, single warm key light from the upper left, plain flat
neutral grey background, no text, no logo, no hands
```

| # | Name | Subject line (append to the character stem) |
|---|---|---|
| C-01 | Young man, curls | a young man in his twenties with short dark curls, light brown skin, a plain green zip jacket |
| C-02 | Woman, bob | a woman in her thirties with a short auburn bob, fair skin, a red top and a single string of pearls |
| C-03 | Emirati man | an Emirati man in his forties wearing a white kandura with a white ghutra and black agal, neat dark moustache |
| C-04 | Emirati woman | an Emirati woman in her thirties wearing a black abaya and a soft black shayla framing her face, warm smile |
| C-05 | Student | a young woman in her early twenties with long dark hair tied back and round glasses, a grey university hoodie |
| C-06 | Older man | a man in his fifties with greying hair and a full moustache, a navy suit jacket, white shirt and blue tie |
| C-07 | Courier | a young man in his twenties with a red cap worn backwards and a teal courier jacket, cheerful open expression |
| C-08 | Older woman | a woman in her sixties with a patterned soft headscarf and kind lined eyes, a warm mustard cardigan |
| C-09 | Office worker | a woman in her forties with dark hair in a low bun, olive skin, a crisp white blouse and a lanyard |
| C-10 | Teenager | a teenage boy with straight black hair and a grey hoodie, slightly shy half-smile |
| C-11 | Shopkeeper | a South Asian man in his thirties with short black hair and stubble, a plain blue work shirt with rolled sleeves |
| C-12 | Grandmother | an elderly woman with silver hair pinned up, deep smile lines, a soft lilac shawl over her shoulders |

---

## 9. Quality checklist — apply to every finished asset

Reject and regenerate if any of these fail:

- [ ] Background is flat, even grey with no scene, gradient or surface
- [ ] Exactly one object — no duplicates, no extra props
- [ ] Camera angle matches the anchor (30° above, three-quarter)
- [ ] Light comes from the upper left, same as the anchor
- [ ] Object occupies about 80% of the frame, centred
- [ ] No text, letters or logos anywhere in the image
- [ ] Identifiable when shrunk to 34 pixels
- [ ] Sits comfortably beside the anchor when placed side by side

---

## 10. If the style drifts

It will, especially after twenty or so images. When it does:

1. Re-upload the anchor and say *"match this image exactly — same style, camera, lighting and
   background."*
2. If drift persists, start a fresh conversation, upload the anchor as the first message, and
   continue from there.
3. Regenerate any asset that no longer sits beside the anchor. It is cheaper to redo three
   images now than to ship a set that looks assembled from three different games.

---

## 11. Delivering the files

Name each file by its asset ID and short name, lowercase, hyphenated:

```
i-01-ice.png        d-01-espresso.png       c-01-young-man-curls.png
i-02-syrup.png      d-02-mint-tea.png       c-02-woman-bob.png
...                 d-03-latte.png          ...
```

PNG, square, largest resolution available, grey background left in place — the background gets
removed in a later step, and a clean grey edge cuts out better than a bad automatic alpha.
