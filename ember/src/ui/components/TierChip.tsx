import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { Tier } from '../../../shared/progress';
import { useLanguage } from '../../i18n';
import { colors, radius, space, type as typography } from '../theme';

/**
 * A rank, as a small warm chip. The colours run from cold ash up to a full
 * burn, so the ladder reads at a glance without anyone learning the names.
 */

export const TIER_TINT: Record<Tier, string> = {
  ash: '#8A8377',
  spark: '#C9922F',
  ember: colors.coral,
  blaze: colors.coralDeep,
  inferno: '#96301A',
};

export function TierChip({
  tier,
  points,
  small,
  style,
}: {
  tier: Tier;
  points?: number;
  small?: boolean;
  style?: ViewStyle;
}) {
  const { t, n } = useLanguage();
  const tint = TIER_TINT[tier];

  return (
    <View
      style={[
        styles.chip,
        small && styles.chipSmall,
        { backgroundColor: `${tint}1A`, borderColor: `${tint}4D` },
        style,
      ]}
    >
      <View style={[styles.dot, small && styles.dotSmall, { backgroundColor: tint }]} />
      <Text style={[styles.label, small && styles.labelSmall, { color: tint }]}>
        {t.rank.tier[tier]}
      </Text>
      {points != null ? (
        <Text style={[styles.points, small && styles.labelSmall, { color: tint }]}>
          {t.rank.points(n(points))}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space(1.5),
    paddingVertical: space(1),
    paddingHorizontal: space(2.5),
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipSmall: { paddingVertical: 2, paddingHorizontal: space(1.5), gap: space(1) },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotSmall: { width: 5, height: 5, borderRadius: 3 },
  label: { ...typography.label, fontSize: 10 },
  labelSmall: { fontSize: 8 },
  points: { ...typography.numeral, fontSize: 11 },
});
