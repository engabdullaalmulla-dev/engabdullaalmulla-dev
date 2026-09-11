# 6. User journey and screens

## Visual direction

A polished sports broadcast wrapped around a physics toy. Deep stadium-night
ground, a pitch that looks like a pitch, a scoreboard with real typographic
authority, and restrained celebration — a flash, a whistle, a haptic pulse, not
confetti.

- **Palette.** Near-black `#070b0f` ground with panels lifting to `#141d25`;
  pitch greens per arena theme; one accent, `#3fe08c`, reserved *exclusively* for
  "this is a nation you follow"; gold `#f3c451` for trophies and premium only.
  Semantic red and amber are separate from the accent.
- **Type.** Saira Condensed for broadcast furniture — scoreboard, clock, team
  codes, table headers — and IBM Plex Sans for everything you actually read.
  Tabular numerals everywhere digits line up.
- **Committed single theme.** A stadium at night is a dark room; the app paints
  its own ground explicitly rather than inheriting one.

What it deliberately is not: casino styling, gradient-heavy menus, or a
statistics dashboard. There are no gigantic KPI tiles, because the numbers that
matter here are a scoreline and a league position.

## Marbles and three-letter codes

Each nation's marble carries its **national flag** under glass, drawn
procedurally so it stays crisp from a 19px list row to a 60px marble in the
arena. Because a 3:2 flag cropped to a circle loses its outer thirds, the flag is
squashed to 1.36:1 first — vertical tricolours and hoist bands stay visible and
the distortion is small enough not to read as wrong.

Every nation is identified by its **FIFA trigramme**: USA, GER, NED, KSA, CIV,
COD, PLE. The code is the primary identifier in the UI — a boxed chip in every
fixture row, group table, bracket tie, nation cell and result — with the full
name as supporting text. On the scoreboard and on the marble itself only the code
appears, because at that size a code is legible and a name is not.

## Following is never signalled by colour alone

Every followed nation carries **three** cues: a green outline ring on the marble,
a `★` prefix on the name, and priority ordering in every list; its code chip is
outlined too. In the live arena the marble gets an outline ring *and* a labelled
code plate. Accessibility settings cover sound, haptics and reduced motion;
reduced motion removes trails, sparks, ripples and the goal flash, and changes no
result.

## The five screens

### 1. Play and setup

Continue a saved campaign, or choose a competition. Each competition card shows
its edition, entrant count, category, ruleset version, source count and flag
count. Tapping **Ruleset & sources** opens the sheet with every source link and
every flag in plain language, *before* you commit.

Then mode (Authentic / Arcade, each with a one-line explanation of what it
actually changes) and nation selection: a searchable grid of marbles, up to six.
In a qualification competition each nation shows the round it enters at, and the
note under the grid spells it out: *"Nepal enters at the first round."*

### 2. Draw ceremony

Four pots, twelve group cells, and one line of commentary per placement. Hosts go
first and the line says why: *"Mexico is placed at A1 as a host — hosts are not
drawn."* Then each ball, with the reason the placement was valid: *"No other
African team here"*, *"Europe may have two teams in a group; this makes two."*
Your nations get a heavier cue — a pulse, a haptic, a higher tone.

It accelerates as it goes, and **Skip to the groups** is always available. In a
qualification competition the ceremony becomes a tie reveal instead.

### 3. Tournament journey

The default screen. Header carries the round and progress (`Group stage · 18/72
played`) plus the arcade life count when relevant.

A **Next match** card names the fixture, the arena, and opens it. Under it, three
tabs:

- **Fixtures** — by matchday, your nations first, the next match outlined. Any
  fixture in the current wave can be tapped to watch that one instead. A line
  tells you the truth about the rest: *"23 other matches in this round will be
  simulated at the same time."*
- **Tables / Path** — full group tables with qualification bands (top two green,
  third blue where third place can still qualify), and the separating criterion
  named under any table a tiebreaker decided. In knockout rounds this becomes
  each followed nation's route so far.
- **Bracket** — horizontally scrolling, round by round, your ties outlined,
  aggregate and penalty scores shown where they applied.

### 4. Live arena and result

Every match opens with an **arena card**: the arena's number, its name, and its
one rule ("The surface gives way in patches. Lose the floor, lose the attack.").
It clears after two and a half seconds. Nine arenas therefore read as nine
different challenges rather than one pitch redecorated.

Scoreboard, live clock, arena name. The canvas fills the screen in portrait.
Under it a commentary ticker, then controls: **1× / 2× / 4× / camera / skip**.

The arena is **directly interactive**, and none of it can touch a result:

- **Tap a marble** to lock the camera onto it; tap it again to zoom back out.
  The camera button shows the code of whoever you are following.
- **Drag to pan, pinch or scroll to zoom** anywhere on the pitch, up to 4×.
- **Tap empty pitch to cheer** — a crowd ripple, a swell of noise, a haptic tick.
- **Tap a goal in the ticker** to see it again: the match rewinds to two seconds
  before that goal, plays it through, and returns to live. It is re-simulated
  from the same seed, so it is the same goal, frame for frame.

All of that is camera and decoration. The simulation is stepped by a function
that never reads any of it, which is why a match watched zoomed in on one marble
produces exactly the score of a match that was skipped.

A goal produces a white flash in the scoring nation's colour, a two-note cue, a
haptic pulse and a ticker line. A shoot-out switches to the penalty picture:
one marble, one keeper, a scorecard filling in green and red.

The result screen leads with the score and both marbles, then the thing the whole
design exists for — **the consequence, in plain language**:

> **Japan — Through as group winner.**
> **Saudi Arabia — Eliminated on aggregate.**
> **Uzbekistan — Out of the top two, but third place could still be enough.**

Then **Replay** (the same match again, event for event — the copy says it cannot
change the result) and **Continue**. If the round finished, a round summary
follows: who qualified, who of yours is out, and the next tie previewed.

### 5. Collection and settings

Trophy cabinet, with arcade wins labelled `arcade` and authentic wins labelled
`authentic` — they are not the same achievement and the cabinet does not pretend
they are. Campaign history. The premium panel. Accessibility settings. Build
information with the simulation version and a ruleset sheet per competition.

## When your nations are eliminated

The journey screen says it directly — *"Every nation you were following is out"* —
and offers exactly three things: **keep watching**, **follow another nation**
(any nation still in, added without erasing your history), or **start a new
campaign**. In arcade mode with a life remaining, a fourth option appears, with
its cost and its honesty stated: a retry restores the round and simulates it
again with new seeds.

## Progression and saving

Autosave after every match. Resume is the first thing on the home screen.
Auto-advance moves to the next match without a tap; turning it off returns you to
the journey screen after each result.
