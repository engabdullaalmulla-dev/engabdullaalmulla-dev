# Which engine for Little Street Café

## The decision behind the decision

Do not pick an engine this month.

The brief already names the real risk — "making something attractive but mechanically
repetitive" — and already names the right first test: find out whether players enjoy
serving and making business decisions *before* spending on decoration assets. That test
does not need an engine. It needs a loop a stranger can play on their phone.

`prototype/` is that loop. Run it, watch five to eight people play it, and only then
commit to an engine. An engine choice made after the loop is proven is a reversible
technical decision; one made before it is a bet on a design you have not validated.

## The recommendation: Godot 4

For a solo developer shipping a premium 2D mobile game, Godot 4 is the better default.

**Language fit.** GDScript is Python-shaped — indentation-scoped, dynamically typed,
with optional static hints. Coming from Python and TypeScript, it is the shortest path
from "I know what I want" to "it runs on my phone". Unity means C# plus its component
lifecycle, which is a real month before you are fluent.

**Cost and policy risk.** Godot is MIT licensed: no seat fee, no revenue share, no
per-install anything, ever. Unity Personal is free below a revenue threshold and Pro is
a per-seat annual subscription. Unity withdrew the 2023 Runtime Fee in September 2024,
so the specific threat is gone — but a premium game with a multi-year tail is exactly
the shape of product that suffers when licensing terms move, and you should price that
risk rather than ignore it.

**The game does not stress any engine.** Sprites, tweens, a UI layer, a deterministic
state machine and a save file. There is no physics, no 3D, no netcode, no shader work.
Nothing here is a reason to accept Unity's overhead.

**Build size.** A 2D Godot game ships around 30–60 MB; the practical Unity floor is
roughly double that. On mobile, install size measurably affects conversion, and it
affects a paid install more than a free one.

**2D is first-class.** Godot's 2D renderer is native, not a flattened 3D scene. Pixel
alignment, 2D lighting and canvas layers behave the way you expect.

## When to choose Unity 6 instead

Pick Unity if any of these is true:

- **You expect to hire or contract.** The Unity talent pool is several times larger.
  This is the single strongest argument and it outweighs everything above.
- **You want the Asset Store.** Cozy 2D kits, Spine, DOTween, and — importantly —
  in-app purchase, analytics and localisation as solved, supported packages.
- **A Steam or Switch version is in the plan.** Godot exports to desktop fine; console
  requires third-party porting houses. Unity's path is better trodden.
- **You anticipate live-ops.** Not in this design, but if the bakery and bookstore
  expansions grow into a content pipeline, Unity's tooling is ahead.

**The rule:** sole engineer for the next twelve months → Godot. Expecting to hire, or
planning a console/Steam release → Unity. Both ship this game; the difference is who is
working on it and where it goes next.

## What I would rule out

**React Native or Flutter + Flame**, despite your React Native experience. The game
*looks* UI-shaped — lists, cards, a state machine — and for the first month that
impression holds. Then you need sprite atlases, skeletal animation for customers, an
audio mixer, tween polish, and a decoration system where the player drags and places
objects. Every one of those is free in an engine and hand-built in an app framework.
The decoration system is your monetisation hook; do not build it on a layout engine
designed for scrolling forms.

**Honourable mention: Defold.** Tiny builds, excellent mobile 2D, Lua. Genuinely good
for exactly this game. Smaller community is the only real objection, and it is enough
to keep it third.

## The one real friction in Godot

Separate paid expansions mean Google Play Billing and StoreKit. Unity ships Unity IAP
in the box. Godot relies on plugins, and the iOS side in particular needs attention.
Budget roughly a week for billing in Godot against a day in Unity. That is not enough
to flip the recommendation, but it belongs in the schedule rather than in a surprise.

## Architecture advice that applies either way

Keep the simulation separate from the presentation.

Recipes, customers, story beats, prices and upgrade costs belong in data files, not in
code. The prototype is written this way on purpose: `RECIPES`, `REGULARS` and
`UPGRADES` are plain objects, and every rule reads from them. Two consequences —

1. **Tuning becomes a spreadsheet job, not a programming job.** You will re-tune the
   economy dozens of times after playtests. Each round should be a number change.
2. **The engine becomes swappable.** If the data and rules are portable, an engine
   change costs you the rendering layer, not the game.

This is also what makes the prototype worth more than a throwaway: the balance numbers
you arrive at through playtesting carry over to whichever engine you pick.
