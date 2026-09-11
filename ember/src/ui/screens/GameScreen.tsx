import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { cardName, POWER_HINT, POWER_LABEL, spokenRank } from '../../../shared/cards';
import type { GameAction } from '../../../shared/types';
import { actingPlayer, faceOf, type PlayerView, type TableView } from '../../../shared/view';
import { BurnMeter } from '../components/BurnMeter';
import { Button } from '../components/Button';
import { Opponent } from '../components/Opponent';
import { Piles } from '../components/Piles';
import { PlayingCard, type CardHighlight } from '../components/PlayingCard';
import { slam, thud } from '../haptics';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  view: TableView;
  dispatch: (action: GameAction) => void;
  /** Cards you have been shown this round, for Assist mode's markers. */
  yourMemory: Record<string, unknown>;
  assist: boolean;
  onQuit: () => void;
  /** Online only: a line about the connection, shown above the table. */
  banner?: { text: string; tone: 'info' | 'bad' } | null;
  /** Online only: seconds left on your turn clock. */
  clock?: number | null;
}

export function GameScreen({ view, dispatch, yourMemory, assist, onQuit, banner, clock }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const youId = view.youId;
  const you = view.players.find((player) => player.id === youId) as PlayerView;
  const rivals = view.players.filter((player) => player.id !== youId);
  const seat = actingPlayer(view);
  const yourTurn = seat.id === youId;
  const showdown = view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER';

  const reveal = view.reveal;
  const revealIsYours = !!reveal && (reveal.viewerId === youId || reveal.viewerId === '*');

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
  const widestPile = Math.max(4, ...view.players.map((player) => player.slots.length));
  const perRow = rivals.length > 2 ? 2 : rivals.length;
  const panelWidth = (screenWidth - space(8) - space(2) * (perRow - 1)) / perRow;
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

  const liveSlots = (player: PlayerView) =>
    player.slots.map((slot, index) => (slot.kind === 'burned' ? -1 : index)).filter((i) => i >= 0);

  const yourTargets = useMemo(() => {
    if (showdown) return [];
    if (view.phase === 'OPENING_PEEK') {
      // You keep picking while looks remain, so both cards can be up at once.
      if (view.openingPeeksLeft <= 0) return [];
      const shown = reveal?.targets.map((target) => target.slot) ?? [];
      return liveSlots(you).filter((slot) => !shown.includes(slot));
    }
    if (view.phase === 'BURN_WINDOW' && !view.burn?.attempted.includes(youId) && !reveal) {
      return liveSlots(you);
    }
    if (!yourTurn || reveal) return [];
    if (view.phase === 'HOLDING') return liveSlots(you);
    if (view.phase === 'POWER' && view.power) {
      const { kind, picked } = view.power;
      if (kind === 'PEEK') return liveSlots(you);
      if (kind === 'SWAP' && picked.length === 0) return liveSlots(you);
      if (kind === 'LOOK_SWAP' && picked.length === 1) return liveSlots(you);
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, you, yourTurn, reveal, showdown, youId]);

  const rivalsTargetable = useMemo(() => {
    if (!yourTurn || reveal || view.phase !== 'POWER' || !view.power) return false;
    const { kind, picked } = view.power;
    if (kind === 'SPY' || kind === 'EMBER') return true;
    if (kind === 'SWAP' && picked.length === 1) return true;
    if (kind === 'LOOK_SWAP' && picked.length === 0) return true;
    return false;
  }, [view, yourTurn, reveal]);

  const seenSlot = (slot: number) => assist && !!yourMemory[`${youId}:${slot}`];

  /* ---------------------------------------------------------------- */
  /* actions                                                           */
  /* ---------------------------------------------------------------- */

  const pressYourCard = (slot: number) => {
    if (view.phase === 'OPENING_PEEK') {
      dispatch({ type: 'OPENING_PEEK', playerId: youId, slot });
      return;
    }
    if (view.phase === 'BURN_WINDOW') {
      slam();
      dispatch({ type: 'BURN', playerId: youId, slot });
      return;
    }
    if (view.phase === 'HOLDING') {
      thud();
      dispatch({ type: 'PLACE', slot });
      return;
    }
    if (view.phase === 'POWER') dispatch({ type: 'POWER_TARGET', playerId: youId, slot });
  };

  const pressRivalCard = (playerId: string, slot: number) => {
    if (view.phase === 'POWER') dispatch({ type: 'POWER_TARGET', playerId, slot });
  };

  /* ---------------------------------------------------------------- */

  const prompt = buildPrompt(view, yourTurn, revealIsYours);
  const trayCard =
    // During the opening look the cards are already face-up in your own grid,
    // so the tray would only be showing you the same card twice.
    revealIsYours && reveal && reveal.reason !== 'opening'
      ? faceOf(
          view.players.find((player) => player.id === reveal.targets[0].playerId)?.slots[
            reveal.targets[0].slot
          ],
        )
      : yourTurn
        ? faceOf(view.held)
        : null;

  const lastLog = view.log.length ? view.log[view.log.length - 1] : null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Leave game" onPress={onQuit} hitSlop={12}>
          <Text style={styles.quit}>← LEAVE</Text>
        </Pressable>
        <Text style={styles.round}>ROUND {view.round}</Text>
        <Text style={styles.target}>
          {clock != null && yourTurn ? `${clock}s` : `TO ${view.config.targetScore}`}
        </Text>
      </View>

      {banner ? (
        <View style={[styles.banner, banner.tone === 'bad' && styles.bannerBad]}>
          <Text style={styles.bannerText} numberOfLines={1}>
            {banner.text}
          </Text>
        </View>
      ) : null}

      <View style={styles.rivals}>
        {rivals.map((player) => (
          <Opponent
            key={player.id}
            player={player}
            active={seat.id === player.id && !showdown}
            knocked={view.knockerId === player.id}
            cardWidth={rivalCardWidth}
            targetable={rivalsTargetable ? liveSlots(player) : []}
            onPressSlot={(slot) => pressRivalCard(player.id, slot)}
          />
        ))}
      </View>

      <View style={styles.table}>
        <View style={styles.tray}>
          {trayCard ? (
            <View style={styles.trayCard}>
              <PlayingCard card={trayCard} faceUp width={pileWidth} />
              <Text style={styles.trayLabel}>{revealIsYours ? 'MEMORISE' : 'IN HAND'}</Text>
            </View>
          ) : null}

          <View style={[styles.trayText, !trayCard && styles.trayTextAlone]}>
            <Text style={[styles.prompt, short && styles.promptShort]}>{prompt.title}</Text>
            {prompt.detail ? <Text style={styles.promptDetail}>{prompt.detail}</Text> : null}
            {view.phase === 'BURN_WINDOW' && view.burn ? (
              <BurnMeter closesAt={view.burn.closesAt} totalMs={view.config.burnWindowMs} />
            ) : null}
          </View>
        </View>

        <Piles
          stockCount={view.stockCount}
          discardTop={view.discardTop}
          width={pileWidth}
          live={yourTurn && view.phase === 'TURN_START' && !reveal ? 'both' : 'none'}
          onDrawStock={() => dispatch({ type: 'DRAW_STOCK' })}
          onDrawDiscard={() => dispatch({ type: 'DRAW_DISCARD' })}
        />
      </View>

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

      <View style={styles.youWrap}>
        <View style={styles.youHeader}>
          <Text style={[styles.youName, yourTurn && !showdown && { color: colors.ember }]}>
            {you.name.toUpperCase()}
          </Text>
          {view.knockerId === youId ? <Text style={styles.knockBadge}>KNOCKED</Text> : null}
          <Text style={styles.youScore}>{you.matchScore} pts</Text>
        </View>

        <View style={[styles.grid, { width: gridWidth }]}>
          {you.slots.map((slot, index) => {
            const targetable = yourTargets.includes(index);
            const highlight: CardHighlight = targetable
              ? view.phase === 'BURN_WINDOW'
                ? 'burn'
                : 'target'
              : 'none';
            return (
              <PlayingCard
                key={`you-${index}`}
                card={slot.kind === 'face' ? slot.card : null}
                burned={slot.kind === 'burned'}
                faceUp={slot.kind === 'face'}
                seen={seenSlot(index)}
                width={yourCardWidth}
                highlight={highlight}
                onPress={targetable ? () => pressYourCard(index) : undefined}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.controls}>
        <Controls view={view} dispatch={dispatch} yourTurn={yourTurn} revealIsYours={revealIsYours} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

function Controls({
  view,
  dispatch,
  yourTurn,
  revealIsYours,
}: {
  view: TableView;
  dispatch: (action: GameAction) => void;
  yourTurn: boolean;
  revealIsYours: boolean;
}) {
  if (revealIsYours && view.reveal?.viewerId === view.youId) {
    const looksLeft = view.phase === 'OPENING_PEEK' ? view.openingPeeksLeft : 0;
    return (
      <Button
        label={looksLeft > 0 ? `DONE — ${looksLeft} LOOK LEFT` : 'GOT IT'}
        tone={looksLeft > 0 ? 'ghost' : 'ember'}
        onPress={() => dispatch({ type: 'ACK_REVEAL', playerId: view.youId })}
      />
    );
  }

  if (!yourTurn || view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER') {
    return <View style={styles.controlSpacer} />;
  }

  if (view.phase === 'TURN_START') {
    return (
      <Button
        label={view.knockerId ? 'ALREADY KNOCKED' : 'KNOCK'}
        tone={view.knockerId ? 'quiet' : 'ghost'}
        disabled={!!view.knockerId}
        onPress={() => {
          slam();
          dispatch({ type: 'KNOCK' });
        }}
      />
    );
  }

  const held = faceOf(view.held);
  if (view.phase === 'HOLDING' && held && !view.heldFromDiscard) {
    const power = held.power;
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

  if (view.phase === 'POWER' && view.power?.kind === 'LOOK_SWAP' && view.power.picked.length === 1) {
    return <Button label="LEAVE IT" tone="ghost" onPress={() => dispatch({ type: 'POWER_DECLINE' })} />;
  }

  return <View style={styles.controlSpacer} />;
}

/* ------------------------------------------------------------------ */

function buildPrompt(
  view: TableView,
  yourTurn: boolean,
  revealIsYours: boolean,
): { title: string; detail?: string } {
  const seat = actingPlayer(view);

  if (view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER') {
    const yours = view.result?.totals[view.youId];
    return { title: 'Cards on the table.', detail: yours != null ? `Your pile: ${yours}.` : undefined };
  }

  if (view.phase === 'OPENING_PEEK') {
    const left = view.openingPeeksLeft;
    if (left <= 0) {
      return revealIsYours
        ? { title: 'Remember these two.', detail: 'You will not see them again.' }
        : { title: 'Waiting for the table…', detail: 'Everyone is memorising their cards.' };
    }
    if (revealIsYours) return { title: 'One more look.', detail: 'Tap another card, or stop here.' };
    return { title: `Choose ${left} card${left === 1 ? '' : 's'} to look at.`, detail: 'Tap your own cards.' };
  }

  if (revealIsYours && view.reveal?.viewerId === '*') {
    return { title: 'Misfire — everyone saw that.' };
  }

  if (view.phase === 'BURN_WINDOW') {
    return {
      title: view.discardTop ? `Burn ${spokenRank(view.discardTop.rank)}?` : 'Burn?',
      detail: 'Tap a matching card of yours. Wrong guess costs you one.',
    };
  }

  if (view.phase === 'POWER' && view.power) {
    const { kind, picked } = view.power;
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
    if (view.phase === 'HOLDING') return { title: `${seat.name} is deciding…` };
    return { title: `${seat.name} is thinking…` };
  }

  if (view.phase === 'TURN_START') {
    return {
      title: 'Your move.',
      detail: view.knockerId ? 'Last turn before the reveal.' : 'Draw from the stock or take the discard.',
    };
  }

  const held = faceOf(view.held);
  if (view.phase === 'HOLDING' && held) {
    return view.heldFromDiscard
      ? { title: `You took ${cardName(held)}.`, detail: 'Tap one of your cards to replace it.' }
      : { title: `You drew ${cardName(held)}.`, detail: 'Tap a card to swap it in, or throw it.' };
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

  banner: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
  },
  bannerBad: { backgroundColor: colors.bad },
  bannerText: { ...typography.small, fontSize: 11, color: colors.text, textAlign: 'center' },

  rivals: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },

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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3), justifyContent: 'center' },

  controls: { minHeight: 56, justifyContent: 'center', paddingBottom: space(1) },
  controlRow: { flexDirection: 'row', gap: space(2) },
  controlButton: { flex: 1 },
  controlSpacer: { height: 48 },
});
