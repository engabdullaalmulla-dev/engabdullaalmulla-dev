import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { cardName, POWER_LABEL, spokenRank } from '../../../shared/cards';
import type { GameAction } from '../../../shared/types';
import { actingPlayer, faceOf, type PlayerView, type TableView } from '../../../shared/view';
import { BurnMeter } from '../components/BurnMeter';
import { Button } from '../components/Button';
import { FeltTable } from '../components/FeltTable';
import { Opponent } from '../components/Opponent';
import { Piles } from '../components/Piles';
import { PlayingCard, type CardHighlight } from '../components/PlayingCard';
import { click, slam, tap, thud } from '../haptics';
import { AnchoredCard } from '../motion/AnchoredCard';
import { anchorKeys, AnchorProvider, useAnchor } from '../motion/anchors';
import { MotionLayer, useFlights } from '../motion/MotionLayer';
import { useTableMotion, type MotionHints, type TableEvent } from '../motion/useTableMotion';
import { play, primeSound } from '../sound';
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

/** What each thing that happens on the table sounds and feels like. */
function announce(event: TableEvent): void {
  switch (event) {
    case 'deal':
      play('deal');
      break;
    case 'draw':
      play('draw');
      click();
      break;
    case 'throw':
    case 'place':
      play('throw');
      thud();
      break;
    case 'burn':
      play('burn');
      slam();
      break;
    case 'penalty':
      play('land');
      thud();
      break;
    case 'swap':
      play('throw');
      tap();
      break;
    case 'knock':
      play('knock');
      slam();
      break;
    case 'round_over':
      play('chime');
      break;
  }
}

/**
 * The table. Wrapped so that everything inside shares one set of anchors —
 * the map of where each pile and slot is, which is what lets cards fly.
 */
export function GameScreen(props: Props) {
  useEffect(() => {
    primeSound();
  }, []);

  return (
    <AnchorProvider>
      <Table {...props} />
    </AnchorProvider>
  );
}

function Table({ view, dispatch, yourMemory, assist, onQuit, banner, clock }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const youId = view.youId;
  const you = view.players.find((player) => player.id === youId) as PlayerView;
  const rivals = view.players.filter((player) => player.id !== youId);
  const seat = actingPlayer(view);
  const yourTurn = seat.id === youId;
  const showdown = view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER';

  const reveal = view.reveal;
  const revealIsYours = !!reveal && (reveal.viewerId === youId || reveal.viewerId === '*');

  /* ---------------------------------------------------------------- */
  /* how big everything is                                             */
  /* ---------------------------------------------------------------- */

  const columns = you.slots.length > 4 ? 3 : 2;
  const gutter = space(2.5);
  const across = Math.min(screenWidth - space(8), 420);
  const byHeight = screenHeight >= 820 ? 104 : screenHeight >= 740 ? 94 : screenHeight >= 670 ? 82 : 70;
  const handCardWidth = Math.floor(Math.min((across - gutter * (columns - 1)) / columns, byHeight));
  const handWidth = handCardWidth * columns + gutter * (columns - 1);
  const pileWidth = Math.round(handCardWidth * 0.74);

  const widestPile = Math.max(4, ...view.players.map((player) => player.slots.length));
  const perRow = rivals.length > 2 ? 2 : rivals.length;
  const panelWidth = (screenWidth - space(6) - space(2) * (perRow - 1)) / perRow;
  const rivalCardWidth = Math.max(
    15,
    Math.floor(Math.min(34, (panelWidth - space(5) - 6 - 4 * (widestPile - 1)) / widestPile)),
  );

  /* ---------------------------------------------------------------- */
  /* motion                                                            */
  /* ---------------------------------------------------------------- */

  const flights = useFlights();
  const hints = useRef<MotionHints>({});
  const motion = useTableMotion({ view, controller: flights, hints, onEvent: announce });

  // A card that lands on the pile should be heard landing, not just thrown.
  const onLand = useCallback(
    (toKey?: string) => {
      motion.onLanded(toKey);
      if (toKey === anchorKeys.discard) play('land');
    },
    [motion],
  );

  /* ---------------------------------------------------------------- */
  /* what can be tapped right now                                      */
  /* ---------------------------------------------------------------- */

  const liveSlots = (player: PlayerView) =>
    player.slots.map((slot, index) => (slot.kind === 'burned' ? -1 : index)).filter((i) => i >= 0);

  const yourTargets = useMemo(() => {
    if (showdown) return [];
    if (view.phase === 'OPENING_PEEK') {
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

  /* ---------------------------------------------------------------- */
  /* acting                                                            */
  /* ---------------------------------------------------------------- */

  const pressYourCard = (slot: number) => {
    if (view.phase === 'OPENING_PEEK') {
      click();
      dispatch({ type: 'OPENING_PEEK', playerId: youId, slot });
      return;
    }
    if (view.phase === 'BURN_WINDOW') {
      dispatch({ type: 'BURN', playerId: youId, slot });
      return;
    }
    if (view.phase === 'HOLDING') {
      // Remembered so the card can be flown into the slot you actually chose.
      hints.current.placeSlot = slot;
      dispatch({ type: 'PLACE', slot });
      return;
    }
    if (view.phase === 'POWER') {
      tap();
      dispatch({ type: 'POWER_TARGET', playerId: youId, slot });
    }
  };

  const pressRivalCard = (playerId: string, slot: number) => {
    if (view.phase === 'POWER') {
      tap();
      dispatch({ type: 'POWER_TARGET', playerId, slot });
    }
  };

  /* ---------------------------------------------------------------- */

  const prompt = buildPrompt(view, yourTurn, revealIsYours);
  const trayCard =
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
    <FeltTable>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Leave game" onPress={onQuit} hitSlop={12}>
            <Text style={styles.quit}>← LEAVE</Text>
          </Pressable>
          <Text style={styles.round}>ROUND {view.round}</Text>
          <Text style={[styles.target, clock != null && styles.clock]}>
            {clock != null ? `${clock}s` : `TO ${view.config.targetScore}`}
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

        <View style={styles.middle}>
        <View style={styles.table}>
          <Piles
            stockCount={view.stockCount}
            discardTop={motion.discardTop}
            width={pileWidth}
            live={yourTurn && view.phase === 'TURN_START' && !reveal}
            onDrawStock={() => dispatch({ type: 'DRAW_STOCK' })}
            onDrawDiscard={() => dispatch({ type: 'DRAW_DISCARD' })}
          />

          <Tray card={trayCard} width={pileWidth} label={revealIsYours ? 'REMEMBER' : 'IN HAND'} />
        </View>

        <View style={styles.say}>
          <Text style={styles.prompt} numberOfLines={2}>
            {prompt.title}
          </Text>
          {prompt.detail ? <Text style={styles.detail}>{prompt.detail}</Text> : null}
          {view.phase === 'BURN_WINDOW' && view.burn ? (
            <BurnMeter closesAt={view.burn.closesAt} totalMs={view.config.burnWindowMs} />
          ) : null}
        </View>
        </View>

        <View style={styles.youWrap}>
          <View style={[styles.youHeader, { width: handWidth }]}>
            <Text style={[styles.youName, yourTurn && !showdown && styles.youNameActive]}>
              {you.name.toUpperCase()}
            </Text>
            {view.knockerId === youId ? <Text style={styles.knockBadge}>KNOCKED</Text> : null}
            <Text style={styles.youScore}>{you.matchScore}</Text>
          </View>

          <View style={[styles.hand, { width: handWidth, gap: gutter }]}>
            {you.slots.map((slot, index) => {
              const targetable = yourTargets.includes(index);
              const highlight: CardHighlight = targetable
                ? view.phase === 'BURN_WINDOW'
                  ? 'burn'
                  : 'target'
                : 'none';
              return (
                <AnchoredCard
                  key={`you-${index}`}
                  anchorKey={anchorKeys.slot(youId, index)}
                  card={slot.kind === 'face' ? slot.card : null}
                  burned={slot.kind === 'burned'}
                  faceUp={slot.kind === 'face'}
                  seen={assist && !!yourMemory[`${youId}:${index}`]}
                  width={handCardWidth}
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

        <Text numberOfLines={1} style={[styles.feed, logTone(lastLog?.kind)]}>
          {lastLog ? lastLog.text : ' '}
        </Text>
      </View>

      <MotionLayer controller={flights} onLand={(flight) => onLand(flight.toKey)} />
    </FeltTable>
  );
}

/* ------------------------------------------------------------------ */

/** The card in your hand, or the one you are being shown. */
function Tray({ card, width, label }: { card: ReturnType<typeof faceOf>; width: number; label: string }) {
  // The anchor lives on the space, not on the card, so a card can be dealt
  // into an empty hand.
  const anchor = useAnchor(anchorKeys.hand);
  return (
    <View style={[styles.tray, { width: width + space(2) }]}>
      <View {...anchor} style={{ width, height: width * 1.45 }}>
        {card ? <PlayingCard card={card} faceUp width={width} /> : null}
      </View>
      <Text style={[styles.trayLabel, !card && styles.trayLabelHidden]}>{label}</Text>
    </View>
  );
}

function logTone(kind?: 'info' | 'good' | 'bad' | 'hot') {
  if (kind === 'good') return { color: colors.good };
  if (kind === 'bad') return { color: colors.bad };
  if (kind === 'hot') return { color: colors.goldSoft };
  return null;
}

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
        label={looksLeft > 0 ? 'DONE LOOKING' : 'GOT IT'}
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
        tone={view.knockerId ? 'quiet' : 'gold'}
        disabled={!!view.knockerId}
        onPress={() => dispatch({ type: 'KNOCK' })}
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
              label={POWER_LABEL[power].toUpperCase()}
              onPress={() => dispatch({ type: 'THROW', usePower: true })}
              style={styles.controlButton}
            />
            <Button
              label="THROW"
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

/**
 * A few words, not a paragraph. What you can do is shown by what is lit up;
 * this only says what is going on.
 */
function buildPrompt(
  view: TableView,
  yourTurn: boolean,
  revealIsYours: boolean,
): { title: string; detail?: string } {
  const seat = actingPlayer(view);
  const first = (name: string) => name.split(' ')[0];

  if (view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER') {
    return { title: 'Cards on the table' };
  }

  if (view.phase === 'OPENING_PEEK') {
    const left = view.openingPeeksLeft;
    if (left <= 0) {
      return revealIsYours
        ? { title: 'Remember them' }
        : { title: 'Waiting for the table' };
    }
    return {
      title: left === 2 ? 'Look at two of yours' : 'One more look',
      detail: 'You will not see them again',
    };
  }

  if (revealIsYours && view.reveal?.viewerId === '*') return { title: 'Everyone saw that' };

  if (view.phase === 'BURN_WINDOW') {
    return { title: view.discardTop ? `Burn ${spokenRank(view.discardTop.rank)}?` : 'Burn?' };
  }

  if (view.phase === 'POWER' && view.power) {
    const { kind, picked } = view.power;
    if (!yourTurn) return { title: `${first(seat.name)} — ${POWER_LABEL[kind]}` };
    if (kind === 'SWAP') {
      return picked.length === 0
        ? { title: 'Give away which?' }
        : { title: 'And take which?' };
    }
    if (kind === 'LOOK_SWAP') {
      return picked.length === 0 ? { title: 'Look at whose?' } : { title: 'Take it?' };
    }
    if (kind === 'PEEK') return { title: 'Look at one of yours' };
    if (kind === 'SPY') return { title: 'Look at one of theirs' };
    return { title: 'Who takes a card?' };
  }

  if (!yourTurn) return { title: `${first(seat.name)}…` };

  if (view.phase === 'TURN_START') {
    return { title: view.knockerId ? 'Last turn' : 'Your move' };
  }

  const held = faceOf(view.held);
  if (view.phase === 'HOLDING' && held) {
    return view.heldFromDiscard
      ? { title: 'Swap it in' }
      : { title: `You drew ${cardName(held)}` };
  }

  return { title: ' ' };
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space(3), gap: space(1.5) },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quit: { ...typography.label, fontSize: 9, color: colors.textFaint },
  round: { ...typography.label, fontSize: 10, color: colors.goldFaint },
  target: { ...typography.label, fontSize: 9, color: colors.textFaint },
  clock: { color: colors.ember },

  banner: {
    backgroundColor: '#0E241CCC',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
  },
  bannerBad: { borderColor: colors.bad },
  bannerText: { ...typography.small, fontSize: 11, color: colors.text, textAlign: 'center' },

  rivals: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },

  middle: { flex: 1, justifyContent: 'center', gap: space(2) },
  table: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: space(2),
    paddingVertical: space(1),
  },
  tray: { alignItems: 'center', gap: space(1) },
  trayLabel: { ...typography.label, fontSize: 8, color: colors.goldFaint },
  trayLabelHidden: { opacity: 0 },

  say: { alignItems: 'center', gap: space(1), minHeight: 46, justifyContent: 'center' },
  prompt: { ...typography.heading, fontSize: 22, color: colors.text, textAlign: 'center' },
  detail: { ...typography.small, fontSize: 11, color: colors.textFaint, textAlign: 'center' },

  youWrap: { alignItems: 'center', gap: space(1.5) },
  youHeader: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  youName: { ...typography.label, fontSize: 10, color: colors.textFaint },
  youNameActive: { color: colors.goldSoft },
  youScore: { ...typography.numeral, fontSize: 14, color: colors.text, marginLeft: 'auto' },
  knockBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.feltEdge,
    backgroundColor: colors.gold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  hand: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },

  controls: { minHeight: 54, justifyContent: 'center' },
  controlRow: { flexDirection: 'row', gap: space(2) },
  controlButton: { flex: 1 },
  controlSpacer: { height: 48 },

  feed: {
    ...typography.small,
    fontSize: 10,
    color: colors.textFaint,
    textAlign: 'center',
    paddingBottom: space(1),
  },
});
