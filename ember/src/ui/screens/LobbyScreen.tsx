import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { PublicUser } from '../../../shared/protocol';
import type { ConnectionStatus, QueueState } from '../../net/useOnline';
import { Button } from '../components/Button';
import { Wordmark } from '../components/Wordmark';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  user: PublicUser | null;
  status: ConnectionStatus;
  queue: QueueState | null;
  error: string | null;
  onQuickMatch: () => void;
  onCancelQueue: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onProfile: () => void;
  onSignOut: () => void;
  onBack: () => void;
}

const STATUS_TEXT: Record<ConnectionStatus, string> = {
  idle: 'Not connected',
  connecting: 'Connecting…',
  online: 'Connected',
  reconnecting: 'Reconnecting…',
  failed: 'Cannot reach the server',
};

export function LobbyScreen({
  user,
  status,
  queue,
  error,
  onQuickMatch,
  onCancelQueue,
  onCreateRoom,
  onJoinRoom,
  onProfile,
  onSignOut,
  onBack,
}: Props) {
  const [code, setCode] = useState('');
  const live = status === 'online';

  if (queue) {
    return (
      <View style={styles.queue}>
        <ActivityIndicator color={colors.ember} size="large" />
        <Text style={styles.queueTitle}>Looking for players…</Text>
        <Text style={styles.queueDetail}>
          {queue.waiting === 1
            ? 'You are first at the table.'
            : `${queue.waiting} waiting.`}{' '}
          {queue.startsInMs != null
            ? 'If nobody else turns up, bots will fill the empty seats.'
            : ''}
        </Text>
        <Button label="CANCEL" tone="ghost" onPress={onCancelQueue} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>
        <View style={[styles.dot, live && styles.dotLive, status === 'failed' && styles.dotDead]} />
        <Text style={styles.status}>{STATUS_TEXT[status]}</Text>
      </View>

      <View style={styles.hero}>
        <Wordmark size={32} />
        <Text style={styles.greeting}>{user ? `Playing as ${user.name}.` : 'Online.'}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>PLAY ANYONE</Text>
        <Text style={styles.blockText}>
          Join the next table that needs players. Empty seats fill with bots if nobody turns up.
        </Text>
        <Button label="QUICK MATCH" onPress={onQuickMatch} disabled={!live} />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>PLAY YOUR FRIENDS</Text>
        <Text style={styles.blockText}>
          Start a private table and share the code. Nobody without it can sit down.
        </Text>
        <Button label="CREATE A PRIVATE TABLE" tone="ghost" onPress={onCreateRoom} disabled={!live} />

        <View style={styles.joinRow}>
          <TextInput
            value={code}
            onChangeText={(next) => setCode(next.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="CODE"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={styles.codeInput}
            accessibilityLabel="Room code"
          />
          <Button
            label="JOIN"
            onPress={() => {
              onJoinRoom(code);
              setCode('');
            }}
            disabled={!live || code.length < 6}
            style={styles.joinButton}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="YOUR RECORD" tone="ghost" onPress={onProfile} small style={styles.footerButton} />
        <Button label="SIGN OUT" tone="quiet" onPress={onSignOut} small style={styles.footerButton} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space(5), gap: space(4), flexGrow: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  back: { ...typography.label, fontSize: 10, color: colors.textFaint, flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textFaint },
  dotLive: { backgroundColor: colors.good },
  dotDead: { backgroundColor: colors.bad },
  status: { ...typography.small, fontSize: 11, color: colors.textFaint },

  hero: { gap: space(1) },
  greeting: { ...typography.body, color: colors.textMuted },
  error: { ...typography.small, color: colors.bad, lineHeight: 18 },

  block: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    gap: space(3),
  },
  blockTitle: { ...typography.label, fontSize: 9, color: colors.ember },
  blockText: { ...typography.small, color: colors.textMuted, lineHeight: 18 },

  joinRow: { flexDirection: 'row', gap: space(2) },
  codeInput: {
    flex: 1,
    backgroundColor: colors.feltEdge,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space(4),
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    minHeight: 48,
  },
  joinButton: { minWidth: 96 },

  footer: { flexDirection: 'row', gap: space(2) },
  footerButton: { flex: 1 },

  queue: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(4), padding: space(6) },
  queueTitle: { ...typography.heading, color: colors.text },
  queueDetail: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
