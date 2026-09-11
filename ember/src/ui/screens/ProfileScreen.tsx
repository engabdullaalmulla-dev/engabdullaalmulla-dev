import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { LeaderboardRow, PublicUser, UserStats } from '../../../shared/protocol';
import { useLanguage } from '../../i18n';
import { api } from '../../net/api';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  user: PublicUser | null;
  stats: UserStats | null;
  onBack: () => void;
}

export function ProfileScreen({ user, stats, onBack }: Props) {
  const { t, n } = useLanguage();
  const [board, setBoard] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .leaderboard()
      .then((result) => {
        if (alive) setBoard(result.rows);
      })
      .catch(() => {
        if (alive) setBoard([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const winRate = stats && stats.matches ? Math.round((stats.wins / stats.matches) * 100) : 0;
  const knockRate = stats && stats.knocks ? Math.round((stats.knocksStuck / stats.knocks) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
        <Text style={styles.back}>{t.common.backArrow} {t.common.back}</Text>
      </Pressable>

      <Text style={styles.name}>{user?.name ?? t.common.you}</Text>

      {stats ? (
        <>
          <View style={styles.grid}>
            <Stat value={n(stats.matches)} label={t.profile.matches} />
            <Stat value={n(stats.wins)} label={t.profile.won} tone="good" />
            <Stat value={`${n(winRate)}%`} label={t.profile.winRate} />
            <Stat value={n(stats.rounds)} label={t.profile.rounds} />
            <Stat value={n(stats.roundWins)} label={t.profile.roundsWon} />
            <Stat
              value={stats.bestRound == null ? t.profile.none : n(stats.bestRound)}
              label={t.profile.bestPile}
              tone="ember"
            />
          </View>

          <View style={styles.lines}>
            <Line
              label={t.profile.knocks}
              value={t.profile.knocksValue(
                n(stats.knocksStuck),
                n(stats.knocks),
                stats.knocks ? n(knockRate) : '',
              )}
            />
            <Line label={t.profile.cardsBurned} value={n(stats.burns)} />
            <Line label={t.profile.misfires} value={n(stats.misfires)} />
            <Line label={t.profile.ashOuts} value={n(stats.ashOuts)} />
            <Line label={t.profile.pointsTaken} value={n(stats.totalPoints)} />
          </View>
        </>
      ) : (
        <Text style={styles.empty}>{t.profile.noRecord}</Text>
      )}

      <Text style={styles.sectionTitle}>{t.profile.leaderboard}</Text>
      {board == null ? (
        <ActivityIndicator color={colors.coral} />
      ) : board.length === 0 ? (
        <Text style={styles.empty}>{t.profile.noLeaders}</Text>
      ) : (
        <View style={styles.lines}>
          {board.map((row, index) => (
            <View key={row.name} style={styles.boardRow}>
              <Text style={styles.rank}>{n(index + 1)}</Text>
              <Text
                style={[styles.boardName, row.name === user?.name && styles.boardYou]}
                numberOfLines={1}
              >
                {row.name}
              </Text>
              <Text style={styles.boardStat}>{n(Math.round(row.winRate * 100))}%</Text>
              <Text style={styles.boardStat}>{n(row.matches)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: 'good' | 'ember' }) {
  return (
    <View style={styles.stat}>
      <Text
        style={[
          styles.statValue,
          tone === 'good' && { color: colors.good },
          tone === 'ember' && { color: colors.coral },
        ]}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.line}>
    <Text style={styles.lineLabel}>{label}</Text>
    <Text style={styles.lineValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { padding: space(5), gap: space(4) },
  back: { ...typography.label, fontSize: 10, color: colors.textFaint },
  name: { ...typography.heading, fontSize: 28, color: colors.text },
  empty: { ...typography.body, color: colors.textFaint },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  stat: {
    // Three to a row, all the same size, however long the number is.
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 88,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space(3.5),
    gap: 2,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { ...typography.label, fontSize: 8, color: colors.textFaint },

  lines: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space(3.5) },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.paperEdge,
  },
  lineLabel: { ...typography.body, color: colors.textMuted },
  lineValue: { ...typography.body, color: colors.text, fontWeight: '700' },

  sectionTitle: { ...typography.label, fontSize: 9, color: colors.coral },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    paddingVertical: space(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.paperEdge,
  },
  rank: { ...typography.small, color: colors.textFaint, width: 18 },
  boardName: { ...typography.body, color: colors.textMuted, flex: 1 },
  boardYou: { color: colors.coral, fontWeight: '800' },
  boardStat: { ...typography.small, color: colors.text, width: 44, textAlign: 'right' },
});
