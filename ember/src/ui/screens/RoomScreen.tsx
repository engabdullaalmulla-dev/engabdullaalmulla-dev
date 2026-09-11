import React from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import type { PublicUser, RoomView } from '../../../shared/protocol';
import type { Difficulty } from '../../../shared/types';
import { Button } from '../components/Button';
import { Flame } from '../components/Flame';
import { tap } from '../haptics';
import { DIFFICULTIES, DIFFICULTY_LABEL } from '../labels';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  room: RoomView;
  user: PublicUser | null;
  error: string | null;
  onAddBot: (difficulty: Difficulty) => void;
  onRemoveSeat: (seatId: string) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function RoomScreen({ room, user, error, onAddBot, onRemoveSeat, onStart, onLeave }: Props) {
  const isHost = user?.id === room.hostId;
  const canStart = isHost && room.seats.length >= 3;
  const free = room.maxSeats - room.seats.length;

  const invite = () => {
    tap();
    void Share.share({
      message: `Sit down at my EMBER table. Room code: ${room.code}`,
    }).catch(() => {
      // Sharing is a convenience; the code is on screen either way.
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable accessibilityRole="button" onPress={onLeave} hitSlop={12}>
        <Text style={styles.back}>← LEAVE TABLE</Text>
      </Pressable>

      {room.isPrivate ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Room code ${room.code.split('').join(' ')}`} onPress={invite}>
          <View style={styles.codeCard}>
            <Flame size={22} />
            <Text style={styles.codeLabel}>ROOM CODE</Text>
            <Text style={styles.code}>{room.code}</Text>
            <Text style={styles.codeHint}>Tap to send it to someone.</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.codeCard}>
          <Flame size={22} />
          <Text style={styles.codeLabel}>PUBLIC TABLE</Text>
          <Text style={styles.codeHint}>Anyone looking for a game can sit down here.</Text>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.seats}>
        <Text style={styles.sectionTitle}>
          AT THE TABLE · {room.seats.length}/{room.maxSeats}
        </Text>

        {room.seats.map((seat) => (
          <View key={seat.id} style={styles.seat}>
            <View style={[styles.seatDot, seat.isBot && styles.seatDotBot, !seat.connected && styles.seatDotAway]} />
            <Text style={styles.seatName} numberOfLines={1}>
              {seat.name}
              {seat.id === user?.id ? ' (you)' : ''}
            </Text>
            {seat.id === room.hostId ? <Text style={styles.tag}>HOST</Text> : null}
            {seat.isBot ? (
              <Text style={styles.tag}>{DIFFICULTY_LABEL[seat.difficulty].toUpperCase()}</Text>
            ) : null}
            {!seat.connected ? <Text style={[styles.tag, styles.away]}>AWAY</Text> : null}
            {isHost && seat.isBot ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${seat.name}`}
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
            <Text style={styles.seatEmptyText}>Empty seat</Text>
          </View>
        ))}
      </View>

      {isHost ? (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>ADD A BOT</Text>
          <View style={styles.botRow}>
            {DIFFICULTIES.map((difficulty) => (
              <Button
                key={difficulty}
                label={DIFFICULTY_LABEL[difficulty].toUpperCase()}
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
            label={canStart ? 'DEAL' : 'THREE PLAYERS TO START'}
            onPress={onStart}
            disabled={!canStart}
          />
        ) : (
          <Text style={styles.waiting}>Waiting for the host to deal…</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space(5), gap: space(4), flexGrow: 1 },
  back: { ...typography.label, fontSize: 10, color: colors.textFaint },

  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(5),
    alignItems: 'center',
    gap: space(1.5),
  },
  codeLabel: { ...typography.label, fontSize: 9, color: colors.textFaint },
  code: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: 8 },
  codeHint: { ...typography.small, fontSize: 11, color: colors.textFaint, textAlign: 'center' },

  error: { ...typography.small, color: colors.bad },

  seats: { gap: space(2) },
  sectionTitle: { ...typography.label, fontSize: 9, color: colors.ember },
  seat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    backgroundColor: colors.surface,
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
    color: colors.bg,
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
