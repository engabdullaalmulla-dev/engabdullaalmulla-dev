import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Board, BoardScope, LeaderboardRow } from '../../../shared/protocol';
import { useLanguage } from '../../i18n';
import { api } from '../../net/api';
import { Mark } from '../components/Mark';
import { TierChip } from '../components/TierChip';
import { tap } from '../haptics';
import { colors, radius, space, type as typography } from '../theme';

/**
 * Two boards: the season, which is what the ranks are made of, and all time,
 * which is what the win rate is made of. Your own row is pinned to the foot of
 * whichever one you are looking at, so you never have to go hunting for it.
 */
export function RankingsScreen({
  userId,
  token,
  onBack,
}: {
  userId?: string | null;
  token?: string | null;
  onBack: () => void;
}) {
  const { t, n } = useLanguage();
  const [scope, setScope] = useState<BoardScope>('season');
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setBoard(null);
    setFailed(false);
    api
      .rankings(scope, token)
      .then((result) => {
        if (alive) setBoard(result);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [scope, token]);

  const days = board ? Math.max(0, Math.ceil((board.endsAt - Date.now()) / 86_400_000)) : 0;
  const rows = board?.rows ?? [];
  const youListed = rows.some((row) => row.userId === userId);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
        <Text style={styles.back}>
          {t.common.backArrow} {t.common.back}
        </Text>
      </Pressable>

      <Text style={styles.title}>{t.rank.title}</Text>

      <View style={styles.tabs}>
        {(['season', 'allTime'] as BoardScope[]).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: scope === option }}
            onPress={() => {
              tap();
              setScope(option);
            }}
            style={[styles.tab, scope === option && styles.tabOn]}
          >
            <Text style={[styles.tabText, scope === option && styles.tabTextOn]}>
              {option === 'season' ? t.rank.season : t.rank.allTime}
            </Text>
          </Pressable>
        ))}
      </View>

      {scope === 'season' && board ? (
        <Text style={styles.hint}>
          {days <= 1 ? t.rank.seasonEndsToday : t.rank.seasonEnds(n(days))}
        </Text>
      ) : null}

      <View style={styles.headRow}>
        <Text style={[styles.headCell, styles.placeCell]} />
        <Text style={[styles.headCell, styles.nameCell]}>{t.rank.columnPlayer}</Text>
        <Text style={[styles.headCell, styles.valueCell]}>
          {scope === 'season' ? t.rank.columnPoints : t.rank.columnWinRate}
        </Text>
        <Text style={[styles.headCell, styles.valueCell]}>{t.rank.columnPlayed}</Text>
      </View>

      {board == null && !failed ? (
        <ActivityIndicator color={colors.coral} />
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>
          {scope === 'season' ? t.rank.empty : t.rank.emptyAllTime}
        </Text>
      ) : (
        <View style={styles.table}>
          {rows.map((row, index) => (
            <Row
              key={row.userId}
              row={row}
              place={index + 1}
              scope={scope}
              you={row.userId === userId}
            />
          ))}
        </View>
      )}

      {board?.you && !youListed ? (
        <>
          <Text style={styles.hint}>{t.rank.you}</Text>
          <View style={styles.table}>
            <Row row={board.you} place={board.you.place} scope={scope} you />
          </View>
        </>
      ) : null}

      {board && !board.you && scope === 'season' ? (
        <Text style={styles.hint}>{t.rank.unrankedHint}</Text>
      ) : null}
    </ScrollView>
  );
}

function Row({
  row,
  place,
  scope,
  you,
}: {
  row: LeaderboardRow;
  place: number;
  scope: BoardScope;
  you: boolean;
}) {
  const { n } = useLanguage();
  return (
    <View style={[styles.row, you && styles.rowYou]}>
      <Text style={[styles.place, styles.placeCell, place <= 3 && styles.podium]}>{n(place)}</Text>
      <View style={[styles.nameCell, styles.who]}>
        <Mark avatar={row.avatar} seed={row.userId} size={26} />
        <View style={styles.whoText}>
          <Text style={[styles.name, you && styles.nameYou]} numberOfLines={1}>
            {row.name}
          </Text>
          {scope === 'season' ? <TierChip tier={row.tier} small /> : null}
        </View>
      </View>
      <Text style={[styles.value, styles.valueCell]}>
        {scope === 'season' ? n(row.points) : `${n(Math.round(row.winRate * 100))}%`}
      </Text>
      <Text style={[styles.value, styles.valueCell, styles.muted]}>{n(row.matches)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space(5), gap: space(3) },
  back: { ...typography.label, fontSize: 10, color: colors.textFaint },
  title: { ...typography.heading, fontSize: 24, color: colors.text },
  hint: { ...typography.small, fontSize: 11, color: colors.textFaint, lineHeight: 17 },
  empty: { ...typography.body, color: colors.textFaint },

  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.paperShade,
    borderRadius: radius.pill,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: space(2), borderRadius: radius.pill, alignItems: 'center' },
  tabOn: { backgroundColor: colors.surfaceRaised },
  tabText: { ...typography.label, fontSize: 10, color: colors.textFaint },
  tabTextOn: { color: colors.text },

  headRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  headCell: { ...typography.label, fontSize: 8, color: colors.textFaint },
  placeCell: { width: 26 },
  nameCell: { flex: 1 },
  valueCell: { width: 58, textAlign: 'end' as 'right' },

  table: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space(3),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    paddingVertical: space(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.paperEdge,
  },
  rowYou: { backgroundColor: colors.coralWash },
  place: { ...typography.numeral, fontSize: 13, color: colors.textFaint },
  podium: { color: colors.coralDeep },
  who: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  whoText: { flexShrink: 1, gap: 2 },
  name: { ...typography.small, fontSize: 14, color: colors.text },
  nameYou: { fontWeight: '800', color: colors.coralDeep },
  value: { ...typography.numeral, fontSize: 14, color: colors.text },
  muted: { color: colors.textFaint },
});
