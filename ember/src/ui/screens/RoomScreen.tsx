import React from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import type { PublicUser, RoomView } from '../../../shared/protocol';
import type { Difficulty } from '../../../shared/types';
import { Button } from '../components/Button';
import { Flame } from '../components/Flame';
import type { ErrorCode } from '../../../shared/protocol';
import { useLanguage } from '../../i18n';
import { LTR } from '../ltr';
import { tap } from '../haptics';
import { DIFFICULTIES } from '../labels';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  room: RoomView;
  user: PublicUser | null;
  error: ErrorCode | null;
  onAddBot: (difficulty: Difficulty) => void;
  onRemoveSeat: (seatId: string) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function RoomScreen({ room, user, error, onAddBot, onRemoveSeat, onStart, onLeave }: Props) {
  const { t, n } = useLanguage();
  const isHost = user?.id === room.hostId;
  const canStart = isHost && room.seats.length >= 3;
  const free = room.maxSeats - room.seats.length;

  const invite = () => {
    tap();
    void Share.share({ message: t.room.invite(room.code) }).catch(() => {
      // Sharing is a convenience; the code is on screen either way.
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable accessibilityRole="button" onPress={onLeave} hitSlop={12}>
        <Text style={styles.back}>{t.common.backArrow} {t.common.leaveTable}</Text>
      </Pressable>

      {room.isPrivate ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Room code ${room.code.split('').join(' ')}`} onPress={invite}>
          <View style={styles.codeCard}>
            <Flame size={22} />
            <Text style={styles.codeLabel}>{t.room.roomCode}</Text>
            <Text {...LTR} style={styles.code}>
              {room.code}
            </Text>
            <Text style={styles.codeHint}>{t.room.tapToSend}</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.codeCard}>
          <Flame size={22} />
          <Text style={styles.codeLabel}>{t.room.publicTable}</Text>
          <Text style={styles.codeHint}>{t.room.publicBlurb}</Text>
        </View>
      )}

      {error ? <Text style={styles.error}>{t.errors[error] ?? t.errors.server_error}</Text> : null}

      <View style={styles.seats}>
        <Text style={styles.sectionTitle}>
          {t.room.atTable(n(room.seats.length), n(room.maxSeats))}
        </Text>

        {room.seats.map((seat) => (
          <View key={seat.id} style={styles.seat}>
            <View style={[styles.seatDot, seat.isBot && styles.seatDotBot, !seat.connected && styles.seatDotAway]} />
            <Text style={styles.seatName} numberOfLines={1}>
              {seat.name}
              {seat.id === user?.id ? t.room.youSuffix : ''}
            </Text>
            {seat.id === room.hostId ? <Text style={styles.tag}>{t.room.host}</Text> : null}
            {seat.isBot ? (
              <Text style={styles.tag}>{t.difficulty[seat.difficulty].toUpperCase()}</Text>
            ) : null}
            {!seat.connected ? <Text style={[styles.tag, styles.away]}>{t.room.away}</Text> : null}
            {isHost && seat.isBot ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.room.remove(seat.name)}
                onPress={() => {
                  tap();
                  onRemoveSeat(seat.id);
                }}
                hitSlop={10}
              >
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        {Array.from({ length: Math.max(0, free) }).map((_, index) => (
          <View key={`free-${index}`} style={[styles.seat, styles.seatEmpty]}>
            <Text style={styles.seatEmptyText}>{t.room.emptySeat}</Text>
          </View>
        ))}
      </View>

      {isHost ? (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>{t.room.addBot}</Text>
          <View style={styles.botRow}>
            {DIFFICULTIES.map((difficulty) => (
              <Button
                key={difficulty}
                label={t.difficulty[difficulty].toUpperCase()}
                tone="ghost"
                small
                disabled={free <= 0}
                onPress={() => onAddBot(difficulty)}
                style={styles.botButton}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        {isHost ? (
          <Button
            label={canStart ? t.room.deal : t.room.needThree}
            onPress={onStart}
            disabled={!canStart}
          />
        ) : (
          <Text style={styles.waiting}>{t.room.waitingForHost}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space(5), gap: space(4), flexGrow: 1 },
  back: { ...typography.label, fontSize: 10, color: colors.textFaint },

  codeCard: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(5),
    alignItems: 'center',
    gap: space(1.5),
  },
  codeLabel: { ...typography.label, fontSize: 9, color: colors.textFaint },
  // A room code is read out and typed in character by character, so it keeps
  // its own direction whatever language the app is in.
  code: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: 8, writingDirection: 'ltr' },
  codeHint: { ...typography.small, fontSize: 11, color: colors.textFaint, textAlign: 'center' },

  error: { ...typography.small, color: colors.bad },

  seats: { gap: space(2) },
  sectionTitle: { ...typography.label, fontSize: 9, color: colors.ember },
  seat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    paddingVertical: space(3),
    paddingHorizontal: space(3.5),
  },
  seatEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line },
  seatEmptyText: { ...typography.small, color: colors.textFaint },
  seatDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.good },
  seatDotBot: { backgroundColor: colors.ember },
  seatDotAway: { backgroundColor: colors.textFaint },
  seatName: { ...typography.body, color: colors.text, flex: 1 },
  tag: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.feltDeep,
    backgroundColor: colors.textMuted,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  away: { backgroundColor: colors.textFaint },
  remove: { color: colors.textFaint, fontSize: 16, paddingHorizontal: space(1) },

  block: { gap: space(2) },
  botRow: { flexDirection: 'row', gap: space(2) },
  botButton: { flex: 1, paddingHorizontal: space(1) },

  actions: { marginTop: 'auto', gap: space(2) },
  waiting: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
