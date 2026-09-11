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
import type { ErrorCode } from '../../../shared/protocol';
import { useLanguage } from '../../i18n';
import type { ConnectionStatus, QueueState } from '../../net/useOnline';
import { Button } from '../components/Button';
import { Wordmark } from '../components/Wordmark';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  user: PublicUser | null;
  status: ConnectionStatus;
  queue: QueueState | null;
  error: ErrorCode | null;
  onQuickMatch: () => void;
  onCancelQueue: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onProfile: () => void;
  onSignOut: () => void;
  onBack: () => void;
}

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
  const { t, n } = useLanguage();
  const [code, setCode] = useState('');
  const live = status === 'online';

  if (queue) {
    return (
      <View style={styles.queue}>
        <ActivityIndicator color={colors.ember} size="large" />
        <Text style={styles.queueTitle}>{t.lobby.lookingForPlayers}</Text>
        <Text style={styles.queueDetail}>
          {queue.waiting === 1 ? t.lobby.firstAtTable : t.lobby.waitingCount(n(queue.waiting))}{' '}
          {queue.startsInMs != null ? t.lobby.botsWillFill : ''}
        </Text>
        <Button label={t.common.cancel} tone="ghost" onPress={onCancelQueue} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>{t.common.backArrow} {t.common.back}</Text>
        </Pressable>
        <View style={[styles.dot, live && styles.dotLive, status === 'failed' && styles.dotDead]} />
        <Text style={styles.status}>{t.lobby.status[status]}</Text>
      </View>

      <View style={styles.hero}>
        <Wordmark size={32} />
        <Text style={styles.greeting}>
          {user ? t.lobby.playingAs(user.name) : t.lobby.online}
        </Text>
      </View>

      {error ? <Text style={styles.error}>{t.errors[error] ?? t.errors.server_error}</Text> : null}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{t.lobby.playAnyone}</Text>
        <Text style={styles.blockText}>{t.lobby.playAnyoneBlurb}</Text>
        <Button label={t.lobby.quickMatch} onPress={onQuickMatch} disabled={!live} />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{t.lobby.playFriends}</Text>
        <Text style={styles.blockText}>{t.lobby.playFriendsBlurb}</Text>
        <Button label={t.lobby.createPrivate} tone="ghost" onPress={onCreateRoom} disabled={!live} />

        <View style={styles.joinRow}>
          <TextInput
            value={code}
            onChangeText={(next) => setCode(next.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder={t.lobby.code}
            placeholderTextColor={colors.textFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={styles.codeInput}
            accessibilityLabel={t.lobby.roomCode}
          />
          <Button
            label={t.lobby.join}
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
        <Button label={t.lobby.yourRecord} tone="ghost" onPress={onProfile} small style={styles.footerButton} />
        <Button label={t.lobby.signOut} tone="quiet" onPress={onSignOut} small style={styles.footerButton} />
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
