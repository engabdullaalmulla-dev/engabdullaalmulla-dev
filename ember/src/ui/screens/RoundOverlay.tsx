import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HUMAN_ID, playerById } from '../../game/engine';
import type { GameState } from '../../game/types';
import { Button } from '../components/Button';
import { colors, radius, shadow, space, type as typography } from '../theme';

interface Props {
  state: GameState;
  onNextRound: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function RoundOverlay({ state, onNextRound, onPlayAgain, onHome }: Props) {
  const result = state.result;
  if (!result) return null;
  const matchOver = state.phase === 'MATCH_OVER';
  const winner = playerById(state, result.winnerId);

  const headline = matchOver
    ? state.matchWinnerId === HUMAN_ID
      ? 'You win the match.'
      : `${playerById(state, state.matchWinnerId ?? '')?.name} wins the match.`
    : result.ashOutId
      ? `${playerById(state, result.ashOutId)?.name} burned out the whole pile.`
      : result.knockerId
        ? result.knockSucceeded
          ? `${playerById(state, result.knockerId)?.name} knocked and made it stick.`
          : `${playerById(state, result.knockerId)?.name} knocked and paid for it.`
        : `${winner?.name} takes the round.`;

  const ordered = [...state.players].sort((a, b) => a.matchScore - b.matchScore);

  return (
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        <Text style={styles.eyebrow}>{matchOver ? 'MATCH OVER' : `ROUND ${state.round}`}</Text>
        <Text style={styles.headline}>{headline}</Text>

        <View style={styles.table}>
          <View style={styles.rowHead}>
            <Text style={[styles.cellName, styles.headText]}>PLAYER</Text>
            <Text style={[styles.cellNum, styles.headText]}>PILE</Text>
            <Text style={[styles.cellNum, styles.headText]}>ROUND</Text>
            <Text style={[styles.cellNum, styles.headText]}>TOTAL</Text>
          </View>

          {ordered.map((player) => {
            const scored = result.scored[player.id];
            const isYou = player.id === HUMAN_ID;
            return (
              <View key={player.id} style={styles.row}>
                <Text style={[styles.cellName, isYou && styles.you]} numberOfLines={1}>
                  {player.name}
                  {player.id === result.knockerId ? '  ·  knocked' : ''}
                </Text>
                <Text style={styles.cellNum}>{result.totals[player.id]}</Text>
                <Text
                  style={[
                    styles.cellNum,
                    scored === 0 ? { color: colors.good } : scored >= 20 ? { color: colors.bad } : null,
                  ]}
                >
                  +{scored}
                </Text>
                <Text style={[styles.cellNum, styles.total]}>{player.matchScore}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.footnote}>
          {matchOver
            ? 'Lowest total wins.'
            : `First to ${state.config.targetScore} ends the match — and the lowest score wins it.`}
        </Text>

        {matchOver ? (
          <View style={styles.buttons}>
            <Button label="PLAY AGAIN" onPress={onPlayAgain} style={styles.button} />
            <Button label="HOME" tone="ghost" onPress={onHome} style={styles.button} />
          </View>
        ) : (
          <Button label="NEXT ROUND" onPress={onNextRound} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8,6,5,0.82)',
    justifyContent: 'flex-end',
    padding: space(4),
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    gap: space(2.5),
    ...shadow.card,
  },
  eyebrow: { ...typography.label, fontSize: 10, color: colors.ember },
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
