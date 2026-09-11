import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import type { TableView } from '../../../shared/view';
import { useLanguage } from '../../i18n';
import { Button } from '../components/Button';
import { colors, radius, shadow, space, type as typography } from '../theme';

interface Props {
  view: TableView;
  onNextRound: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
  /** Online: the server advances on its own, so the button only hurries it. */
  waitingOn?: string | null;
  canAdvance?: boolean;
}

export function RoundOverlay({
  view,
  onNextRound,
  onPlayAgain,
  onHome,
  waitingOn,
  canAdvance = true,
}: Props) {
  const { t, n } = useLanguage();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [rise]);

  const result = view.result;
  if (!result) return null;
  const matchOver = view.phase === 'MATCH_OVER';
  const named = (id: string | null | undefined) =>
    view.players.find((player) => player.id === id)?.name ?? '';
  const winner = view.players.find((player) => player.id === result.winnerId);

  const headline = matchOver
    ? view.matchWinnerId === view.youId
      ? t.overlay.youWin
      : t.overlay.someoneWins(named(view.matchWinnerId))
    : result.ashOutId
      ? t.overlay.ashedOut(named(result.ashOutId))
      : result.knockerId
        ? result.knockSucceeded
          ? t.overlay.knockStuck(named(result.knockerId))
          : t.overlay.knockPaid(named(result.knockerId))
        : t.overlay.takesRound(winner?.name ?? '');

  const ordered = [...view.players].sort((a, b) => a.matchScore - b.matchScore);

  return (
    <Animated.View style={[styles.backdrop, { opacity: rise }]}>
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [
              { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) },
            ],
          },
        ]}
      >
        <Text style={styles.eyebrow}>
          {matchOver ? t.overlay.matchOver : t.overlay.roundNumber(n(view.round))}
        </Text>
        <Text style={styles.headline}>{headline}</Text>

        <View style={styles.table}>
          <View style={styles.rowHead}>
            <Text style={[styles.cellName, styles.headText]}>{t.overlay.player}</Text>
            <Text style={[styles.cellNum, styles.headText]}>{t.overlay.pilePoints}</Text>
            <Text style={[styles.cellNum, styles.headText]}>{t.overlay.roundPoints}</Text>
            <Text style={[styles.cellNum, styles.headText]}>{t.overlay.total}</Text>
          </View>

          {ordered.map((player) => {
            const scored = result.scored[player.id];
            const isYou = player.id === view.youId;
            return (
              <View key={player.id} style={styles.row}>
                <Text style={[styles.cellName, isYou && styles.you]} numberOfLines={1}>
                  {player.name}
                  {player.id === result.knockerId ? `  ·  ${t.overlay.knockedTag}` : ''}
                </Text>
                <Text style={styles.cellNum}>{n(result.totals[player.id])}</Text>
                <Text
                  style={[
                    styles.cellNum,
                    scored === 0 ? { color: colors.good } : scored >= 20 ? { color: colors.bad } : null,
                  ]}
                >
                  +{n(scored)}
                </Text>
                <Text style={[styles.cellNum, styles.total]}>{n(player.matchScore)}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.footnote}>
          {waitingOn
            ? waitingOn
            : matchOver
              ? t.overlay.lowestWins
              : t.overlay.firstTo(n(view.config.targetScore))}
        </Text>

        {matchOver ? (
          <View style={styles.buttons}>
            <Button label={t.overlay.playAgain} onPress={onPlayAgain} style={styles.button} />
            <Button label={t.overlay.home} tone="ghost" onPress={onHome} style={styles.button} />
          </View>
        ) : (
          <Button label={t.overlay.nextRound} onPress={onNextRound} disabled={!canAdvance} />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#05100C8C',
    justifyContent: 'flex-end',
    padding: space(4),
  },
  sheet: {
    backgroundColor: '#0B2019F7',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    gap: space(2.5),
    ...shadow.card,
  },
  eyebrow: { ...typography.label, fontSize: 10, color: colors.gold },
  headline: { ...typography.heading, fontSize: 19, color: colors.text, lineHeight: 25 },
  table: { gap: space(1.5) },
  rowHead: { flexDirection: 'row', paddingBottom: space(1), borderBottomWidth: 1, borderBottomColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center' },
  headText: { ...typography.label, fontSize: 9, color: colors.textFaint },
  cellName: { flex: 1, ...typography.body, color: colors.textMuted },
  you: { color: colors.text, fontWeight: '800' },
  cellNum: { width: 54, textAlign: 'right', ...typography.body, color: colors.textMuted },
  total: { color: colors.text, fontWeight: '800' },
  footnote: { ...typography.small, fontSize: 11, color: colors.textFaint },
  buttons: { flexDirection: 'row', gap: space(2) },
  button: { flex: 1 },
});
