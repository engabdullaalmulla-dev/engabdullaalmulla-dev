import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AVATAR_COLOURS,
  AVATAR_SHAPES,
  badges,
  badgesEarned,
  standing,
  titleFor,
  type AvatarColour,
  type AvatarShape,
} from '../../../shared/progress';
import type { PublicUser, RankState, UserStats } from '../../../shared/protocol';
import { useLanguage } from '../../i18n';
import { Button } from '../components/Button';
import { Mark, MARK_COLOURS } from '../components/Mark';
import { TierChip } from '../components/TierChip';
import { tap } from '../haptics';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  user: PublicUser | null;
  stats: UserStats | null;
  rank: RankState | null;
  onBack: () => void;
  onRankings: () => void;
  /** Saves a new mark. Resolves to the stored value so the screen can settle. */
  onChooseMark: (shape: AvatarShape, colour: AvatarColour) => void;
}

/**
 * Who you are at this table: the mark beside your name, the title your own
 * habits earned you, where you stand this season, and the record behind it.
 */
export function ProfileScreen({ user, stats, rank, onBack, onRankings, onChooseMark }: Props) {
  const { t, n } = useLanguage();
  const [picking, setPicking] = useState(false);

  const winRate = stats && stats.matches ? Math.round((stats.wins / stats.matches) * 100) : 0;
  const knockRate = stats && stats.knocks ? Math.round((stats.knocksStuck / stats.knocks) * 100) : 0;
  const earned = stats ? badgesEarned(stats) : 0;
  const shelf = stats ? badges(stats) : [];
  const ladder = rank ? standing(rank.points) : null;
  const daysLeft = rank ? Math.max(0, Math.ceil((rank.endsAt - Date.now()) / 86_400_000)) : 0;

  const [shape, colour] = (user?.avatar ?? '').split(':');

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
        <Text style={styles.back}>
          {t.common.backArrow} {t.common.back}
        </Text>
      </Pressable>

      {/* ---- who you are ------------------------------------------- */}
      <View style={styles.hero}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.profile.yourMark}
          onPress={() => {
            tap();
            setPicking((open) => !open);
          }}
        >
          <Mark avatar={user?.avatar} seed={user?.id ?? user?.name ?? ''} size={62} />
        </Pressable>
        <View style={styles.heroText}>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name ?? t.common.you}
          </Text>
          {stats ? <Text style={styles.title}>{t.profile.title[titleFor(stats)]}</Text> : null}
        </View>
      </View>

      {picking ? (
        <View style={styles.picker}>
          <Text style={styles.sectionTitle}>{t.profile.yourMark}</Text>
          <Text style={styles.hint}>{t.profile.markHint}</Text>
          <View style={styles.markRow}>
            {AVATAR_SHAPES.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={t.profile.shape[option]}
                accessibilityState={{ selected: option === shape }}
                onPress={() => onChooseMark(option, (colour as AvatarColour) || 'coral')}
                style={[styles.markCell, option === shape && styles.markCellOn]}
              >
                <Mark
                  avatar={`${option}:${colour || 'coral'}`}
                  seed={option}
                  size={34}
                />
              </Pressable>
            ))}
          </View>
          <View style={styles.markRow}>
            {AVATAR_COLOURS.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={t.profile.colour[option]}
                accessibilityState={{ selected: option === colour }}
                onPress={() => onChooseMark((shape as AvatarShape) || 'flame', option)}
                style={[styles.swatchCell, option === colour && styles.markCellOn]}
              >
                <View style={[styles.swatch, { backgroundColor: MARK_COLOURS[option] }]} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* ---- where you stand --------------------------------------- */}
      {rank && ladder ? (
        <View style={styles.rankCard}>
          <View style={styles.rankHead}>
            <TierChip tier={rank.tier} points={rank.points} />
            <Text style={styles.place}>
              {rank.place != null ? t.rank.place(n(rank.place)) : t.rank.unranked}
            </Text>
          </View>
          <Text style={styles.blurb}>{t.rank.tierBlurb[rank.tier]}</Text>

          <View style={styles.meterTrack}>
            <View
              style={[
                styles.meterFill,
                { width: `${Math.round(Math.min(1, Math.max(0, ladder.fraction)) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.hint}>
            {ladder.next
              ? t.rank.toNext(n(ladder.toGo ?? 0), t.rank.tier[ladder.next])
              : t.rank.atTheTop}
          </Text>
          <Text style={styles.hint}>
            {daysLeft <= 1 ? t.rank.seasonEndsToday : t.rank.seasonEnds(n(daysLeft))}
          </Text>
          <Button label={t.profile.seeRankings} tone="ghost" small onPress={onRankings} />
        </View>
      ) : null}

      {/* ---- the record -------------------------------------------- */}
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

          {/* ---- badges ---------------------------------------------- */}
          <View style={styles.badgeHead}>
            <Text style={styles.sectionTitle}>{t.profile.badges}</Text>
            <Text style={styles.badgeCount}>
              {t.profile.badgesEarned(n(earned), n(shelf.length))}
            </Text>
          </View>
          <View style={styles.shelf}>
            {shelf.map((badge) => (
              <View key={badge.id} style={[styles.badge, !badge.earned && styles.badgeLocked]}>
                <Text style={[styles.badgeName, !badge.earned && styles.lockedText]}>
                  {t.profile.badge[badge.id]}
                </Text>
                <Text style={styles.badgeHint} numberOfLines={2}>
                  {t.profile.badgeHint[badge.id]}
                </Text>
                <Text style={[styles.badgeProgress, badge.earned && styles.badgeDone]}>
                  {badge.earned ? '✓' : `${n(badge.have)} / ${n(badge.need)}`}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.empty}>{t.profile.noRecord}</Text>
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
  empty: { ...typography.body, color: colors.textFaint },
  hint: { ...typography.small, fontSize: 11, color: colors.textFaint, lineHeight: 17 },

  hero: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  heroText: { flex: 1, gap: 2 },
  name: { ...typography.heading, fontSize: 26, color: colors.text },
  title: { ...typography.small, fontSize: 13, color: colors.coralDeep },

  picker: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    gap: space(2),
  },
  markRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  markCell: {
    padding: space(1),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  markCellOn: { borderColor: colors.coral, backgroundColor: colors.coralWash },
  swatchCell: {
    padding: space(1.5),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  swatch: { width: 28, height: 28, borderRadius: 14 },

  rankCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    gap: space(2),
  },
  rankHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  place: { ...typography.numeral, fontSize: 16, color: colors.text },
  blurb: { ...typography.small, fontSize: 12, color: colors.textMuted },
  meterTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.paperShade,
    overflow: 'hidden',
  },
  meterFill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.coral },

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

  sectionTitle: { ...typography.label, fontSize: 9, color: colors.coralDeep },
  badgeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeCount: { ...typography.numeral, fontSize: 12, color: colors.textFaint },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  badge: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 140,
    gap: 3,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(3),
  },
  badgeLocked: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  badgeName: { ...typography.small, fontSize: 13, color: colors.text, fontWeight: '700' },
  lockedText: { color: colors.textMuted },
  badgeHint: { ...typography.small, fontSize: 10, color: colors.textFaint, lineHeight: 14 },
  badgeProgress: { ...typography.numeral, fontSize: 11, color: colors.textFaint },
  badgeDone: { color: colors.good, fontSize: 13 },
});
