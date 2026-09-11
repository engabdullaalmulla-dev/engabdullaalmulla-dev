import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { Difficulty } from './shared/types';
import { api, ONLINE_ENABLED, type AuthResponse } from './src/net/api';
import { useOnline } from './src/net/useOnline';
import { clearSession, loadSession, saveSession, type StoredSession } from './src/store/session';
import { AuthScreen } from './src/ui/screens/AuthScreen';
import { GameScreen } from './src/ui/screens/GameScreen';
import { HomeScreen, type Settings } from './src/ui/screens/HomeScreen';
import { LobbyScreen } from './src/ui/screens/LobbyScreen';
import { OnlineTable } from './src/ui/screens/OnlineTable';
import { ProfileScreen } from './src/ui/screens/ProfileScreen';
import { RoomScreen } from './src/ui/screens/RoomScreen';
import { RoundOverlay } from './src/ui/screens/RoundOverlay';
import { RulesScreen } from './src/ui/screens/RulesScreen';
import { FeltTable } from './src/ui/components/FeltTable';
import { colors } from './src/ui/theme';
import { useEmber } from './src/ui/useEmber';

const BOT_NAMES = ['Rashid', 'Noura', 'Salem', 'Maitha'];

type Screen = 'home' | 'rules' | 'auth' | 'lobby' | 'profile' | 'offline';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [settings, setSettings] = useState<Settings>({
    rivals: 2,
    difficulty: 'normal',
    assist: false,
  });
  // Bumping this remounts the offline table, which is what starts a fresh match.
  const [matchId, setMatchId] = useState(0);

  const [session, setSession] = useState<StoredSession | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let alive = true;
    void loadSession().then((stored) => {
      if (!alive) return;
      setSession(stored);
      setRestoring(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const online = useOnline(session?.token ?? null);

  // A session the server no longer accepts is worth forgetting locally too.
  useEffect(() => {
    if (online.status === 'failed' && session) {
      void clearSession();
      setSession(null);
      setScreen('auth');
    }
  }, [online.status, session]);

  const signedIn = useCallback((result: AuthResponse) => {
    const stored = { token: result.token, user: result.user };
    void saveSession(stored);
    setSession(stored);
    setScreen('lobby');
  }, []);

  const signOut = useCallback(() => {
    if (session) void api.logout(session.token).catch(() => undefined);
    void clearSession();
    setSession(null);
    setScreen('home');
  }, [session]);

  const playOffline = useCallback(() => {
    setMatchId((id) => id + 1);
    setScreen('offline');
  }, []);

  const goOnline = useCallback(() => {
    setScreen(session ? 'lobby' : 'auth');
  }, [session]);

  const leaveTable = useCallback(() => {
    online.leaveRoom();
    setScreen('lobby');
  }, [online]);

  /* ---------------------------------------------------------------- */

  const body = () => {
    if (restoring) {
      return (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.ember} />
        </View>
      );
    }

    // Whatever the app was showing, a live table takes precedence: it is where
    // other people are waiting on you.
    if (session && online.table && online.room && online.room.status !== 'lobby') {
      return (
        <OnlineTable
          table={online.table}
          status={online.status}
          user={online.user}
          error={online.error}
          assist={settings.assist}
          yourMemory={online.yourMemory}
          onPlay={online.play}
          onNextRound={online.nextRound}
          onLeave={leaveTable}
        />
      );
    }

    if (session && online.room) {
      return (
        <RoomScreen
          room={online.room}
          user={online.user}
          error={online.error}
          onAddBot={online.addBot}
          onRemoveSeat={online.removeSeat}
          onStart={online.startGame}
          onLeave={leaveTable}
        />
      );
    }

    switch (screen) {
      case 'auth':
        return <AuthScreen onSignedIn={signedIn} onBack={() => setScreen('home')} />;

      case 'lobby':
        return (
          <LobbyScreen
            user={online.user ?? session?.user ?? null}
            status={online.status}
            queue={online.queue}
            error={online.error}
            onQuickMatch={online.quickMatch}
            onCancelQueue={online.cancelQuickMatch}
            onCreateRoom={() => online.createRoom()}
            onJoinRoom={online.joinRoom}
            onProfile={() => setScreen('profile')}
            onSignOut={signOut}
            onBack={() => setScreen('home')}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            user={online.user ?? session?.user ?? null}
            stats={online.stats}
            onBack={() => setScreen('lobby')}
          />
        );

      case 'rules':
        return <RulesScreen onBack={() => setScreen('home')} />;

      case 'offline':
        return (
          <OfflineTable
            key={matchId}
            rivals={settings.rivals}
            difficulty={settings.difficulty}
            assist={settings.assist}
            onHome={() => setScreen('home')}
            onPlayAgain={playOffline}
          />
        );

      default:
        return (
          <HomeScreen
            settings={settings}
            onChange={setSettings}
            onPlay={playOffline}
            onPlayOnline={goOnline}
            onRules={() => setScreen('rules')}
            signedInAs={session?.user.name ?? null}
            onlineEnabled={ONLINE_ENABLED}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <FeltTable>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {/* A card table is a phone-shaped thing: on a wide screen it sits in
              the middle rather than stretching across the whole window. */}
          <View style={styles.column}>{body()}</View>
        </SafeAreaView>
      </FeltTable>
    </SafeAreaProvider>
  );
}

/** The offline table: the same rules, played against bots on this phone. */
function OfflineTable({
  rivals,
  difficulty,
  assist,
  onHome,
  onPlayAgain,
}: {
  rivals: number;
  difficulty: Difficulty;
  assist: boolean;
  onHome: () => void;
  onPlayAgain: () => void;
}) {
  const { view, dispatch, yourMemory } = useEmber({
    bots: BOT_NAMES.slice(0, rivals).map((name) => ({ name, difficulty })),
  });

  const finished = view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER';

  return (
    <View style={styles.safe}>
      <GameScreen
        view={view}
        dispatch={dispatch}
        yourMemory={yourMemory as Record<string, unknown>}
        assist={assist}
        onQuit={onHome}
      />
      {finished ? (
        <RoundOverlay
          view={view}
          onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
          onPlayAgain={onPlayAgain}
          onHome={onHome}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.feltDeep },
  safe: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
