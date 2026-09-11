import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { LeaderboardRow, PublicUser, UserStats } from '../../../shared/protocol';
import { api } from '../../net/api';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  user: PublicUser | null;
  stats: UserStats | null;
  onBack: () => void;
}

export function ProfileScreen({ user, stats, onBack }: Props) {
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
        <Text style={styles.back}>← BACK</Text>
      </Pressable>

      <Text style={styles.name}>{user?.name ?? 'You'}</Text>

      {stats ? (
        <>
          <View style={styles.grid}>
            <Stat value={String(stats.matches)} label="MATCHES" />
            <Stat value={String(stats.wins)} label="WON" tone="good" />
            <Stat value={`${winRate}%`} label="WIN RATE" />
            <Stat value={String(stats.rounds)} label="ROUNDS" />
            <Stat value={String(stats.roundWins)} label="ROUNDS WON" />
            <Stat
              value={stats.bestRound == null ? '—' : String(stats.bestRound)}
              label="BEST PILE"
              tone="ember"
            />
          </View>

          <View style={styles.lines}>
            <Line
              label="Knocks"
              value={`${stats.knocksStuck} of ${stats.knocks} stuck${stats.knocks ? ` · ${knockRate}%` : ''}`}
            />
            <Line label="Cards burned" value={String(stats.burns)} />
            <Line label="Misfires" value={String(stats.misfires)} />
            <Line label="Ash outs" value={String(stats.ashOuts)} />
            <Line label="Points taken" value={String(stats.totalPoints)} />
          </View>
        </>
      ) : (
        <Text style={styles.empty}>No record yet. Play a match online.</Text>
      )}

      <Text style={styles.sectionTitle}>LEADERBOARD</Text>
      {board == null ? (
        <ActivityIndicator color={colors.ember} />
      ) : board.length === 0 ? (
        <Text style={styles.empty}>Nobody has finished enough matches yet.</Text>
      ) : (
        <View style={styles.lines}>
          {board.map((row, index) => (
            <View key={row.name} style={styles.boardRow}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Text
                style={[styles.boardName, row.name === user?.name && styles.boardYou]}
                numberOfLines={1}
              >
                {row.name}
              </Text>
              <Text style={styles.boardStat}>{Math.round(row.winRate * 100)}%</Text>
              <Text style={styles.boardStat}>{row.matches}</Text>
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
          tone === 'ember' && { color: colors.ember },
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
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: space(3.5),
    gap: 2,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { ...typography.label, fontSize: 8, color: colors.textFaint },

  lines: { backgroundColor: colors.panel, borderRadius: radius.md, paddingHorizontal: space(3.5) },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.feltEdge,
  },
  lineLabel: { ...typography.body, color: colors.textMuted },
  lineValue: { ...typography.body, color: colors.text, fontWeight: '700' },

  sectionTitle: { ...typography.label, fontSize: 9, color: colors.ember },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    paddingVertical: space(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.feltEdge,
  },
  rank: { ...typography.small, color: colors.textFaint, width: 18 },
  boardName: { ...typography.body, color: colors.textMuted, flex: 1 },
  boardYou: { color: colors.ember, fontWeight: '800' },
  boardStat: { ...typography.small, color: colors.text, width: 44, textAlign: 'right' },
});
