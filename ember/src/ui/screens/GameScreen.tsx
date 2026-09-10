import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { cardName, POWER_HINT, POWER_LABEL, spokenRank } from '../../game/cards';
import { currentPlayer, HUMAN_ID, playerById, topDiscard } from '../../game/engine';
import type { GameAction, GameState, Player } from '../../game/types';
import { BurnMeter } from '../components/BurnMeter';
import { Button } from '../components/Button';
import { Opponent } from '../components/Opponent';
import { Piles } from '../components/Piles';
import { PlayingCard, type CardHighlight } from '../components/PlayingCard';
import { slam, thud } from '../haptics';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
  /** Cards you have been shown this round, for Assist mode's markers. */
  yourMemory: Record<string, unknown>;
  assist: boolean;
  onQuit: () => void;
}

export function GameScreen({ state, dispatch, yourMemory, assist, onQuit }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const you = playerById(state, HUMAN_ID) as Player;
  const rivals = state.players.filter((player) => player.id !== HUMAN_ID);
  const seat = currentPlayer(state);
  const yourTurn = seat.id === HUMAN_ID;
  const showdown = state.phase === 'ROUND_OVER' || state.phase === 'MATCH_OVER';

  const reveal = state.reveal;
  const revealIsYours = !!reveal && (reveal.viewerId === HUMAN_ID || reveal.viewerId === '*');

  const short = screenHeight < 760;
  const tiny = screenHeight < 660;

  // A four-card pile is always a 2x2 block; penalty cards spill into threes.
  const columns = you.slots.length > 4 ? 3 : 2;
  const available = Math.min(screenWidth - space(10), 340);
  const gutter = space(3);
  const yourCardWidth = Math.min(
    (available - gutter * (columns - 1)) / columns,
    tiny ? 58 : short ? 66 : 80,
  );
  const gridWidth = yourCardWidth * columns + gutter * (columns - 1);
  const pileWidth = tiny ? 50 : short ? 58 : 68;

  // Rivals' piles grow when they take penalty cards, so their cards shrink to
  // match rather than wrapping onto a second row.
  const widestPile = Math.max(4, ...state.players.map((player) => player.slots.length));
  const panelWidth = (screenWidth - space(8) - space(2) * (rivals.length - 1)) / rivals.length;
  const rivalCardWidth = Math.max(
    16,
    Math.floor(
      // The 6 covers the panel's borders and flexbox rounding; without it a
      // four-card pile lands a pixel over and wraps.
      Math.min(32, (panelWidth - space(5) - 6 - 4 * (widestPile - 1)) / widestPile),
    ),
  );

  /* ---------------------------------------------------------------- */
  /* what can be tapped right now                                      */
  /* ---------------------------------------------------------------- */

  const yourTargets = useMemo(() => {
    if (showdown) return [];
    if (state.phase === 'OPENING_PEEK') {
      // You keep picking while looks remain, so both cards can be up at once.
      const left = state.openingPeeksLeft[HUMAN_ID] ?? 0;
      if (left <= 0) return [];
      const shown = reveal?.targets.map((t) => t.slot) ?? [];
      return you.slots
        .map((card, slot) => (card && !shown.includes(slot) ? slot : -1))
        .filter((s) => s >= 0);
    }
    if (state.phase === 'BURN_WINDOW' && !state.burn?.attempted.includes(HUMAN_ID) && !reveal) {
      return you.slots.map((card, slot) => (card ? slot : -1)).filter((s) => s >= 0);
    }
    if (!yourTurn || reveal) return [];
    if (state.phase === 'HOLDING') {
      return you.slots.map((card, slot) => (card ? slot : -1)).filter((s) => s >= 0);
    }
    if (state.phase === 'POWER' && state.power) {
      const { kind, picked } = state.power;
      const own = you.slots.map((card, slot) => (card ? slot : -1)).filter((s) => s >= 0);
      if (kind === 'PEEK') return own;
      if (kind === 'SWAP' && picked.length === 0) return own;
      if (kind === 'LOOK_SWAP' && picked.length === 1) return own;
    }
    return [];
  }, [state, you, yourTurn, reveal, showdown]);

  const rivalTargets = useMemo(() => {
    if (!yourTurn || reveal || state.phase !== 'POWER' || !state.power) return [];
    const { kind, picked } = state.power;
    if (kind === 'SPY' || kind === 'EMBER') return ['all'];
    if (kind === 'SWAP' && picked.length === 1) return ['all'];
    if (kind === 'LOOK_SWAP' && picked.length === 0) return ['all'];
    return [];
  }, [state, yourTurn, reveal]);

  const revealedSlots = (playerId: string): number[] => {
    if (showdown) return state.players.find((p) => p.id === playerId)?.slots.map((_, i) => i) ?? [];
    if (!reveal || !revealIsYours) return [];
    return reveal.targets.filter((t) => t.playerId === playerId).map((t) => t.slot);
  };

  const seenSlot = (slot: number) => assist && !!yourMemory[`${HUMAN_ID}:${slot}`];

  /* ---------------------------------------------------------------- */
  /* actions                                                           */
  /* ---------------------------------------------------------------- */

  const pressYourCard = (slot: number) => {
    if (state.phase === 'OPENING_PEEK') {
      dispatch({ type: 'OPENING_PEEK', playerId: HUMAN_ID, slot });
      return;
    }
    if (state.phase === 'BURN_WINDOW') {
      slam();
      dispatch({ type: 'BURN', playerId: HUMAN_ID, slot });
      return;
    }
    if (state.phase === 'HOLDING') {
      thud();
      dispatch({ type: 'PLACE', slot });
      return;
    }
    if (state.phase === 'POWER') {
      dispatch({ type: 'POWER_TARGET', playerId: HUMAN_ID, slot });
    }
  };

  const pressRivalCard = (playerId: string, slot: number) => {
    if (state.phase === 'POWER') dispatch({ type: 'POWER_TARGET', playerId, slot });
  };

  /* ---------------------------------------------------------------- */
  /* words                                                             */
  /* ---------------------------------------------------------------- */

  const prompt = buildPrompt(state, yourTurn, revealIsYours);
  const held = state.held;
  // During the opening look the cards are already face-up in your own grid,
  // so the tray would only be showing you the same card twice.
  const trayCard =
    revealIsYours && reveal && reveal.reason !== 'opening'
      ? playerById(state, reveal.targets[0].playerId)?.slots[reveal.targets[0].slot] ?? null
      : yourTurn && held
        ? held
        : null;

  const lastLog = state.log.length ? state.log[state.log.length - 1] : null;

  return (
    <View style={styles.screen}>
      {/* header */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Leave game" onPress={onQuit} hitSlop={12}>
          <Text style={styles.quit}>← LEAVE</Text>
        </Pressable>
        <Text style={styles.round}>ROUND {state.round}</Text>
        <Text style={styles.target}>TO {state.config.targetScore}</Text>
      </View>

      {/* rivals */}
      <View style={styles.rivals}>
        {rivals.map((player) => (
          <Opponent
            key={player.id}
            player={player}
            active={seat.id === player.id && !showdown}
            knocked={state.knockerId === player.id}
            cardWidth={rivalCardWidth}
            targetable={
              rivalTargets.includes('all') ? player.slots.map((card, i) => (card ? i : -1)).filter((i) => i >= 0) : []
            }
            revealed={revealedSlots(player.id)}
            onPressSlot={(slot) => pressRivalCard(player.id, slot)}
          />
        ))}
      </View>

      {/* table */}
      <View style={styles.table}>
        <View style={styles.tray}>
          {trayCard ? (
            <View style={styles.trayCard}>
              <PlayingCard card={trayCard} faceUp width={pileWidth} />
              <Text style={styles.trayLabel}>
                {revealIsYours ? 'MEMORISE' : 'IN HAND'}
              </Text>
            </View>
          ) : null}

          <View style={[styles.trayText, !trayCard && styles.trayTextAlone]}>
            <Text style={[styles.prompt, short && styles.promptShort]}>{prompt.title}</Text>
            {prompt.detail ? <Text style={styles.promptDetail}>{prompt.detail}</Text> : null}
            {state.phase === 'BURN_WINDOW' && state.burn ? (
              <BurnMeter closesAt={state.burn.closesAt} totalMs={state.config.burnWindowMs} />
            ) : null}
          </View>
        </View>

        <Piles
          stockCount={state.stock.length}
          discardTop={topDiscard(state)}
          width={pileWidth}
          live={yourTurn && state.phase === 'TURN_START' && !reveal ? 'both' : 'none'}
          onDrawStock={() => dispatch({ type: 'DRAW_STOCK' })}
          onDrawDiscard={() => dispatch({ type: 'DRAW_DISCARD' })}
        />
      </View>

      {/* feed */}
      <View style={styles.feed}>
        <Text
          numberOfLines={1}
          style={[
            styles.feedText,
            lastLog?.kind === 'good' && { color: colors.good },
            lastLog?.kind === 'bad' && { color: colors.bad },
            lastLog?.kind === 'hot' && { color: colors.gold },
          ]}
        >
          {lastLog ? lastLog.text : ' '}
        </Text>
      </View>

      {/* your pile */}
      <View style={styles.youWrap}>
        <View style={styles.youHeader}>
          <Text style={[styles.youName, yourTurn && !showdown && { color: colors.ember }]}>
            {you.name.toUpperCase()}
          </Text>
          {state.knockerId === HUMAN_ID ? <Text style={styles.knockBadge}>KNOCKED</Text> : null}
          <Text style={styles.youScore}>{you.matchScore} pts</Text>
        </View>

        <View style={[styles.grid, { width: gridWidth }]}>
          {you.slots.map((card, slot) => {
            const targetable = yourTargets.includes(slot);
            const highlight: CardHighlight = targetable
              ? state.phase === 'BURN_WINDOW'
                ? 'burn'
                : 'target'
              : 'none';
            return (
              <PlayingCard
                key={`you-${slot}`}
                card={card}
                burned={!card}
                faceUp={revealedSlots(HUMAN_ID).includes(slot)}
                seen={seenSlot(slot)}
                width={yourCardWidth}
                highlight={highlight}
                onPress={targetable ? () => pressYourCard(slot) : undefined}
              />
            );
          })}
        </View>
      </View>

      {/* controls */}
      <View style={styles.controls}>
        <Controls state={state} dispatch={dispatch} yourTurn={yourTurn} revealIsYours={revealIsYours} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

function Controls({
  state,
  dispatch,
  yourTurn,
  revealIsYours,
}: {
  state: GameState;
  dispatch: (action: GameAction) => void;
  yourTurn: boolean;
  revealIsYours: boolean;
}) {
  if (revealIsYours && state.reveal?.viewerId === HUMAN_ID) {
    const looksLeft = state.phase === 'OPENING_PEEK' ? state.openingPeeksLeft[HUMAN_ID] ?? 0 : 0;
    return (
      <Button
        label={looksLeft > 0 ? `DONE — ${looksLeft} LOOK LEFT` : 'GOT IT'}
        tone={looksLeft > 0 ? 'ghost' : 'ember'}
        onPress={() => dispatch({ type: 'ACK_REVEAL' })}
      />
    );
  }

  if (!yourTurn || state.phase === 'ROUND_OVER' || state.phase === 'MATCH_OVER') {
    return <View style={styles.controlSpacer} />;
  }

  if (state.phase === 'TURN_START') {
    return (
      <Button
        label={state.knockerId ? 'ALREADY KNOCKED' : 'KNOCK'}
        tone={state.knockerId ? 'quiet' : 'ghost'}
        disabled={!!state.knockerId}
        onPress={() => {
          slam();
          dispatch({ type: 'KNOCK' });
        }}
      />
    );
  }

  if (state.phase === 'HOLDING' && state.held && !state.heldFromDiscard) {
    const power = state.held.power;
    return (
      <View style={styles.controlRow}>
        {power ? (
          <>
            <Button
              label={`USE ${POWER_LABEL[power].toUpperCase()}`}
              onPress={() => dispatch({ type: 'THROW', usePower: true })}
              style={styles.controlButton}
            />
            <Button
              label="JUST THROW"
              tone="ghost"
              onPress={() => dispatch({ type: 'THROW', usePower: false })}
              style={styles.controlButton}
            />
          </>
        ) : (
          <Button
            label="THROW IT"
            tone="ghost"
            onPress={() => dispatch({ type: 'THROW', usePower: false })}
            style={styles.controlButton}
          />
        )}
      </View>
    );
  }

  if (state.phase === 'POWER' && state.power?.kind === 'LOOK_SWAP' && state.power.picked.length === 1) {
    return <Button label="LEAVE IT" tone="ghost" onPress={() => dispatch({ type: 'POWER_DECLINE' })} />;
  }

  return <View style={styles.controlSpacer} />;
}

/* ------------------------------------------------------------------ */

function buildPrompt(
  state: GameState,
  yourTurn: boolean,
  revealIsYours: boolean,
): { title: string; detail?: string } {
  const seat = currentPlayer(state);

  if (state.phase === 'ROUND_OVER' || state.phase === 'MATCH_OVER') {
    const yours = state.result?.totals[HUMAN_ID];
    return { title: 'Cards on the table.', detail: yours != null ? `Your pile: ${yours}.` : undefined };
  }

  if (state.phase === 'OPENING_PEEK') {
    if (revealIsYours) return { title: 'Remember these two.', detail: 'You will not see them again.' };
    const left = state.openingPeeksLeft[HUMAN_ID] ?? 0;
    if (revealIsYours && left > 0) {
      return { title: 'One more look.', detail: 'Tap another card, or stop here.' };
    }
    return { title: `Choose ${left} card${left === 1 ? '' : 's'} to look at.`, detail: 'Tap your own cards.' };
  }

  if (revealIsYours && state.reveal?.viewerId === '*') {
    return { title: 'Misfire — everyone saw that.' };
  }

  if (state.phase === 'BURN_WINDOW') {
    const top = topDiscard(state);
    return {
      title: top ? `Burn ${spokenRank(top.rank)}?` : 'Burn?',
      detail: 'Tap a matching card of yours. Wrong guess costs you one.',
    };
  }

  if (state.phase === 'POWER' && state.power) {
    const { kind, picked } = state.power;
    if (!yourTurn) return { title: `${seat.name} is using ${POWER_LABEL[kind]}.` };
    if (kind === 'SWAP') {
      return picked.length === 0
        ? { title: 'Pick one of yours to give away.' }
        : { title: 'Now pick a card to take.', detail: 'Neither of you gets to look.' };
    }
    if (kind === 'LOOK_SWAP') {
      return picked.length === 0
        ? { title: "Pick a rival's card to look at." }
        : { title: 'Swap it in, or leave it.' };
    }
    return { title: POWER_LABEL[kind], detail: POWER_HINT[kind] };
  }

  if (!yourTurn) {
    if (state.phase === 'HOLDING') return { title: `${seat.name} is deciding…` };
    return { title: `${seat.name} is thinking…` };
  }

  if (state.phase === 'TURN_START') {
    return {
      title: 'Your move.',
      detail: state.knockerId ? 'Last turn before the reveal.' : 'Draw from the stock or take the discard.',
    };
  }

  if (state.phase === 'HOLDING' && state.held) {
    return state.heldFromDiscard
      ? { title: `You took ${cardName(state.held)}.`, detail: 'Tap one of your cards to replace it.' }
      : { title: `You drew ${cardName(state.held)}.`, detail: 'Tap a card to swap it in, or throw it.' };
  }

  return { title: ' ' };
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space(4), gap: space(2) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quit: { ...typography.label, fontSize: 10, color: colors.textFaint },
  round: { ...typography.label, fontSize: 11, color: colors.textMuted },
  target: { ...typography.label, fontSize: 10, color: colors.textFaint },

  rivals: { flexDirection: 'row', gap: space(2) },

  table: {
    flex: 1,
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(4),
    backgroundColor: colors.bgDeep,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space(4),
    paddingVertical: space(4),
  },
  tray: { flexDirection: 'row', alignItems: 'center', gap: space(3), alignSelf: 'stretch' },
  trayCard: { alignItems: 'center', gap: space(1) },
  trayLabel: { ...typography.label, fontSize: 8, color: colors.textFaint },
  trayText: { flex: 1, gap: space(1) },
  trayTextAlone: { alignItems: 'center' },
  prompt: { ...typography.heading, fontSize: 18, color: colors.text },
  promptShort: { fontSize: 16 },
  promptDetail: { ...typography.small, color: colors.textMuted, lineHeight: 17, textAlign: 'center' },

  feed: { minHeight: 18, justifyContent: 'center' },
  feedText: { ...typography.small, fontSize: 11, color: colors.textFaint, textAlign: 'center' },

  youWrap: { alignItems: 'center', gap: space(2) },
  youHeader: { flexDirection: 'row', alignItems: 'center', gap: space(2), alignSelf: 'stretch' },
  youName: { ...typography.label, fontSize: 11, color: colors.textMuted },
  youScore: { ...typography.small, color: colors.textFaint, marginLeft: 'auto' },
  knockBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.bg,
    backgroundColor: colors.gold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(3),
    justifyContent: 'center',
  },

  controls: { minHeight: 56, justifyContent: 'center', paddingBottom: space(1) },
  controlRow: { flexDirection: 'row', gap: space(2) },
  controlButton: { flex: 1 },
  controlSpacer: { height: 48 },
});
