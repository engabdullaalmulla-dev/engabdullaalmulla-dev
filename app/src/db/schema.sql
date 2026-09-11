-- Matchday — initial schema (Postgres)
--
-- The first three tables are the R0 spreadsheet's three tabs, promoted. That
-- continuity is deliberate: the importer in src/import/ reads the sheet
-- directly, so the app launches with real history instead of an empty
-- database, and the rating model can be back-tested before anyone trusts it.
--
-- The one decision here that is expensive to undo is rating_events.

-- ---------------------------------------------------------------------------
-- Tab 2 — Players
-- ---------------------------------------------------------------------------

create table players (
  id                  uuid primary key default gen_random_uuid(),
  -- Phone, not email. This runs on WhatsApp; the number is both the login and
  -- the notification channel.
  phone               text unique not null,
  name                text not null,
  first_game_date     date,
  -- What they said at signup. Kept forever, never overwritten by the earned
  -- rating — it is the only evidence of how badly people rate themselves (Z3).
  self_declared_level smallint check (self_declared_level between 1 and 7),
  position_pref       text,
  is_keeper           boolean not null default false,
  -- How they found us. Becomes CAC by channel and cannot be reconstructed later.
  source              text,
  created_at          timestamptz not null default now()
);

-- Derived, and rebuildable from rating_events at any time. This is a cache.
create table player_ratings (
  player_id     uuid primary key references players(id) on delete cascade,
  rating        numeric(8,3) not null,
  games_played  integer not null default 0,
  -- Set only by a sustained drop past the buffer; see shouldDemote().
  tier          smallint not null,
  games_below_boundary smallint not null default 0,
  updated_at    timestamptz not null default now()
);

create table reliability (
  player_id       uuid primary key references players(id) on delete cascade,
  booked          integer not null default 0,
  attended        integer not null default 0,
  current_streak  integer not null default 0,
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tab 1 — Games
-- ---------------------------------------------------------------------------

create table venues (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  district text not null,
  -- Fixed rate or revenue share. The whole margin structure turns on this.
  deal     text not null check (deal in ('fixed', 'revenue_share')),
  fixed_cost_aed   numeric(10,2),
  revenue_share_pct numeric(5,2)
);

create table games (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references venues(id),
  -- Recurrence is the product; a slot is what sells out, not a one-off game.
  slot_id       uuid,
  kickoff       timestamptz not null,
  format        text not null,           -- '5-a-side' | '7-a-side' | '11-a-side'
  places        smallint not null,
  price_aed     numeric(10,2) not null,
  level_band    int4range,

  -- Three different numbers. They stay three.
  booked_count      smallint not null default 0,
  checked_in_count  smallint not null default 0,

  score_a       smallint,
  score_b       smallint,
  -- Margin of victory only counts on a host-confirmed score.
  score_confirmed_by_host boolean not null default false,

  host_id       uuid references players(id),
  -- The host's own one-word call, collected from R0 onward. This is the
  -- baseline the balancer is later judged against, and it is uncollectable
  -- after the fact.
  teams_felt    text check (teams_felt in ('even', 'close', 'lopsided')),
  rebalanced_at_half_time boolean not null default false,

  cost_aed      numeric(10,2),
  revenue_aed   numeric(10,2),
  refunded_aed  numeric(10,2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now()
);

create index games_kickoff_idx on games (kickoff desc);

-- ---------------------------------------------------------------------------
-- Tab 3 — Appearances. One row per player per game; the table that compounds.
-- ---------------------------------------------------------------------------

create table appearances (
  game_id     uuid not null references games(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  side        char(1) check (side in ('A', 'B')),

  -- Both, separately. The gap between them is the no-show rate, and the
  -- balancer must read the second one, never the first.
  booked      boolean not null default false,
  showed      boolean not null default false,

  -- The three taps. Never shown to players, never shown back to the host.
  host_read   text check (host_read in ('above', 'level', 'below')),
  peer_votes  smallint not null default 0,

  paid_aed      numeric(10,2) not null default 0,
  refunded_aed  numeric(10,2) not null default 0,

  primary key (game_id, player_id)
);

create index appearances_player_idx on appearances (player_id);

-- ---------------------------------------------------------------------------
-- The decision that is expensive to undo
-- ---------------------------------------------------------------------------

-- Append-only. Never updated, never deleted.
--
-- ranking.md's open questions R6 and R7 both say to tune the weights against
-- the first 500 games. That is only possible if every rating movement keeps
-- the INPUTS that produced it, so the whole history can be replayed under new
-- weights. Storing only players.rating would make the model permanently
-- un-retunable — you would have to throw the history away to change your mind.
--
-- player_ratings above is a cache of the fold over this table.
create table rating_events (
  id            bigserial primary key,
  game_id       uuid not null references games(id) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,

  rating_before numeric(8,3) not null,
  rating_after  numeric(8,3) not null,
  delta         numeric(8,3) not null,

  -- Everything the model saw, so the event can be recomputed from scratch.
  expected              numeric(6,4) not null,
  expected_own_rating   numeric(6,4) not null,
  expected_from_side    numeric(6,4) not null,
  k_factor              numeric(6,2) not null,
  margin_multiplier     numeric(6,4) not null,
  modifier              numeric(6,4) not null,
  own_side_mean         numeric(8,3) not null,
  opponent_side_mean    numeric(8,3) not null,
  host_weight_used      numeric(4,3) not null default 0,

  -- Which build of the weights produced this. Bump on every weight change so
  -- old events stay explainable and A/B comparisons are possible.
  weights_version text not null,
  reasons         text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create index rating_events_player_idx on rating_events (player_id, id);
create unique index rating_events_once_per_game on rating_events (game_id, player_id);

-- ---------------------------------------------------------------------------
-- Balancer support
-- ---------------------------------------------------------------------------

-- What the balancer actually chose, and why. Kept so "why am I on this side?"
-- survives a weights change, and so blowout rate can be traced back to the
-- split that produced it.
create table team_assignments (
  game_id        uuid primary key references games(id) on delete cascade,
  side_a         uuid[] not null,
  side_b         uuid[] not null,
  mean_gap       numeric(8,3) not null,
  cost           numeric(10,3) not null,
  unbalanceable  boolean not null default false,
  reasons        text[] not null default '{}',
  splits_evaluated integer not null,
  -- 'provisional' at 18:00 from the booking list, 'final' at check-in close.
  -- A sheet that silently changes between the two costs more trust than no
  -- sheet at all, so the state is stored rather than inferred.
  state          text not null check (state in ('provisional', 'final')),
  weights_version text not null,
  created_at     timestamptz not null default now()
);

-- Pair history feeds the variety term. Without it the balancer is
-- deterministic and hands the same regulars the same split every week.
create view pair_history as
select
  least(a.player_id, b.player_id)    as player_a,
  greatest(a.player_id, b.player_id) as player_b,
  count(*) filter (where a.side = b.side) as same_side_games,
  count(*)                                as shared_games
from appearances a
join appearances b
  on a.game_id = b.game_id
 and a.player_id < b.player_id
where a.showed and b.showed
group by 1, 2;
