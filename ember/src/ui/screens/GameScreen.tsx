import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { GameAction } from '../../../shared/types';
import { useLanguage, type Language } from '../../i18n';
import { actingPlayer, faceOf, type PlayerView, type TableView } from '../../../shared/view';
import { BurnMeter } from '../components/BurnMeter';
import { Button } from '../components/Button';
import { FeltTable } from '../components/FeltTable';
import { Say } from '../components/Say';
import { Score } from '../components/Score';
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
  const language = useLanguage();
  const { t, n, line } = language;
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

  // A window is identified by when it closes, so a new one is a new alarm.
  const burnWindow = view.phase === 'BURN_WINDOW' ? (view.burn?.closesAt ?? 0) : 0;
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!burnWindow) {
      setArmed(false);
      return;
    }
    // The window opens the instant you throw, which put it under your own
    // finger: a second tap meant for the card you just played landed as a
    // burn. Nothing is burnable for a beat, which is also long enough for the
    // alarm to register as an alarm.
    play('alert');
    slam();
    setArmed(false);
    const timer = setTimeout(() => setArmed(true), 420);
    return () => clearTimeout(timer);
  }, [burnWindow]);

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
    if (view.phase === 'BURN_WINDOW') {
      if (!armed || view.burn?.attempted.includes(youId) || reveal) return [];
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
  }, [view, you, yourTurn, reveal, showdown, youId, armed]);

  const rivalsTargetable = useMemo(() => {
    // Anyone's card can be burned, not just your own — which is the whole
    // reason for remembering what a rival is holding.
    if (view.phase === 'BURN_WINDOW') {
      return armed && !view.burn?.attempted.includes(youId) && !reveal;
    }
    if (!yourTurn || reveal || view.phase !== 'POWER' || !view.power) return false;
    const { kind, picked } = view.power;
    if (kind === 'SPY' || kind === 'EMBER') return true;
    if (kind === 'SWAP' && picked.length === 1) return true;
    if (kind === 'LOOK_SWAP' && picked.length === 0) return true;
    return false;
  }, [view, yourTurn, reveal, youId, armed]);

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
      dispatch({ type: 'BURN', playerId: youId, ownerId: youId, slot });
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
    if (view.phase === 'BURN_WINDOW') {
      dispatch({ type: 'BURN', playerId: youId, ownerId: playerId, slot });
      return;
    }
    if (view.phase === 'POWER') {
      tap();
      dispatch({ type: 'POWER_TARGET', playerId, slot });
    }
  };

  /* ---------------------------------------------------------------- */

  const prompt = buildPrompt(view, yourTurn, revealIsYours, language);
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.table.leaveGame}
            onPress={onQuit}
            hitSlop={12}
          >
            <Text style={styles.quit}>{t.common.backArrow} {t.common.leave}</Text>
          </Pressable>
          <Text style={styles.round}>{t.common.round(n(view.round))}</Text>
          <Text style={[styles.target, clock != null && styles.clock]}>
            {clock != null
              ? t.common.seconds(n(clock))
              : t.common.toScore(n(view.config.targetScore))}
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
              burning={view.phase === 'BURN_WINDOW'}
              inFlight={(index) => flights.isFlyingTo(anchorKeys.slot(player.id, index))}
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

          <Tray
            card={trayCard}
            width={pileWidth}
            label={revealIsYours ? t.table.remember : t.table.inHand}
            inFlight={flights.isFlyingTo(anchorKeys.hand)}
          />
        </View>

        <View style={styles.say}>
          <Say text={prompt.title} style={styles.prompt} numberOfLines={2} />
          <Say text={prompt.detail ?? ' '} style={styles.detail} numberOfLines={1} />
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
            {view.knockerId === youId ? (
              <Text style={styles.knockBadge}>{t.table.knocked}</Text>
            ) : null}
            <Score value={n(you.matchScore)} style={styles.youScore} />
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
                  inFlight={flights.isFlyingTo(anchorKeys.slot(youId, index))}
                  onPress={targetable ? () => pressYourCard(index) : undefined}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.controls}>
          <Controls
            view={view}
            dispatch={dispatch}
            yourTurn={yourTurn}
            revealIsYours={revealIsYours}
            language={language}
          />
        </View>

        <Text numberOfLines={1} style={[styles.feed, logTone(lastLog?.kind)]}>
          {lastLog ? line(lastLog, youId) : ' '}
        </Text>
      </View>

      {burnWindow ? <BurnFrame /> : null}

      <MotionLayer controller={flights} onLand={(flight) => onLand(flight.toKey)} />
    </FeltTable>
  );
}

/* ------------------------------------------------------------------ */

/** The table edge, lit while a burn is on the table. */
function BurnFrame() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 360, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 360, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    beat.start();
    return () => beat.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.burnFrame,
        { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.95] }) },
      ]}
    />
  );
}

/** The card in your hand, or the one you are being shown. */
function Tray({
  card,
  width,
  label,
  inFlight,
}: {
  card: ReturnType<typeof faceOf>;
  width: number;
  label: string;
  inFlight?: boolean;
}) {
  // The anchor lives on the space, not on the card, so a card can be dealt
  // into an empty hand.
  const anchor = useAnchor(anchorKeys.hand);
  return (
    <View style={[styles.tray, { width: width + space(2) }]}>
      <View {...anchor} style={{ width, height: width * 1.45 }}>
        {card ? <PlayingCard card={card} faceUp width={width} inFlight={inFlight} /> : null}
      </View>
      <Text style={[styles.trayLabel, (!card || inFlight) && styles.trayLabelHidden]}>{label}</Text>
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
  language,
}: {
  view: TableView;
  dispatch: (action: GameAction) => void;
  yourTurn: boolean;
  revealIsYours: boolean;
  language: Language;
}) {
  const { t } = language;
  if (revealIsYours && view.reveal?.viewerId === view.youId) {
    const looksLeft = view.phase === 'OPENING_PEEK' ? view.openingPeeksLeft : 0;
    return (
      <Button
        label={looksLeft > 0 ? t.common.doneLooking : t.common.gotIt}
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
        label={view.knockerId ? t.table.alreadyKnocked : t.table.knock}
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
              label={t.powers[power].name.toUpperCase()}
              onPress={() => dispatch({ type: 'THROW', usePower: true })}
              style={styles.controlButton}
            />
            <Button
              label={t.table.justThrow}
              tone="ghost"
              onPress={() => dispatch({ type: 'THROW', usePower: false })}
              style={styles.controlButton}
            />
          </>
        ) : (
          <Button
            label={t.table.throwIt}
            tone="ghost"
            onPress={() => dispatch({ type: 'THROW', usePower: false })}
            style={styles.controlButton}
          />
        )}
      </View>
    );
  }

  if (view.phase === 'POWER' && view.power?.kind === 'LOOK_SWAP' && view.power.picked.length === 1) {
    return (
      <Button label={t.table.leaveIt} tone="ghost" onPress={() => dispatch({ type: 'POWER_DECLINE' })} />
    );
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
  { t, card }: Language,
): { title: string; detail?: string } {
  const seat = actingPlayer(view);
  const first = (name: string) => name.split(' ')[0];

  if (view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER') {
    return { title: t.table.cardsOnTable };
  }

  if (view.phase === 'OPENING_PEEK') {
    const left = view.openingPeeksLeft;
    if (left <= 0) {
      return revealIsYours
        ? { title: t.table.rememberThem }
        : { title: t.table.waitingForTable };
    }
    return {
      title: left === 2 ? t.table.lookAtTwo : t.table.oneMoreLook,
      detail: t.table.youWillNotSeeAgain,
    };
  }

  if (revealIsYours && view.reveal?.viewerId === '*') return { title: t.table.everyoneSaw };

  if (view.phase === 'BURN_WINDOW') {
    return {
      title: view.discardTop
        ? t.table.burnRank(t.cards.spoken(view.discardTop.rank))
        : t.table.burnPlain,
      // The one prompt that earns its second line: this is the only tap in
      // the game that can cost you something.
      detail: t.table.burnHint,
    };
  }

  if (view.phase === 'POWER' && view.power) {
    const { kind, picked } = view.power;
    if (!yourTurn) return { title: t.table.usingPower(first(seat.name), t.powers[kind].name) };
    if (kind === 'SWAP') {
      return picked.length === 0
        ? { title: t.table.giveAwayWhich }
        : { title: t.table.andTakeWhich };
    }
    if (kind === 'LOOK_SWAP') {
      return picked.length === 0 ? { title: t.table.lookAtWhose } : { title: t.table.takeIt };
    }
    if (kind === 'PEEK') return { title: t.table.lookAtOneOfYours };
    if (kind === 'SPY') return { title: t.table.lookAtOneOfTheirs };
    return { title: t.table.whoTakesCard };
  }

  if (!yourTurn) return { title: t.table.thinking(first(seat.name)) };

  if (view.phase === 'TURN_START') {
    return { title: view.knockerId ? t.table.lastTurn : t.table.yourMove };
  }

  const held = faceOf(view.held);
  if (view.phase === 'HOLDING' && held) {
    return view.heldFromDiscard ? { title: t.table.swapItIn } : { title: t.table.drew(card(held)) };
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

  say: { alignItems: 'center', gap: space(1), minHeight: 66, justifyContent: 'center' },
  prompt: { ...typography.heading, fontSize: 22, color: colors.text, textAlign: 'center' },
  promptBurn: { color: colors.ember },
  detail: { ...typography.small, fontSize: 11, color: colors.textFaint, textAlign: 'center' },

  youWrap: { alignItems: 'center', gap: space(1.5) },
  youHeader: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  youName: { ...typography.label, fontSize: 10, color: colors.textFaint },
  youNameActive: { color: colors.goldSoft },
  youScore: { ...typography.numeral, fontSize: 14, color: colors.text, marginStart: 'auto' },
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

  burnFrame: {
    ...StyleSheet.absoluteFill,
    borderWidth: 4,
    borderColor: colors.ember,
    borderRadius: radius.md,
    pointerEvents: 'none',
  },
  feed: {
    ...typography.small,
    fontSize: 10,
    color: colors.textFaint,
    textAlign: 'center',
    paddingBottom: space(1),
  },
});
