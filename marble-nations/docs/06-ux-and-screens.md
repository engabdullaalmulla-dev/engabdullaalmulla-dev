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

## Following is never signalled by colour alone

Every followed nation carries **three** cues: a green outline ring on the marble,
a `★` prefix on the name, and priority ordering in every list. In the live arena
the marble gets an outline ring *and* a labelled code chip. Accessibility
settings cover sound, haptics and reduced motion; reduced motion removes trails,
sparks and the goal flash and changes no result.

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

Scoreboard, live clock, arena name. The canvas fills the screen in portrait.
Under it a commentary ticker, then controls: **1× / 2× / 4× / camera / skip**.
Camera toggles between the whole pitch and a close tracking shot — a pure render
choice.

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
