import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { Difficulty } from './src/game/types';
import { GameScreen } from './src/ui/screens/GameScreen';
import { HomeScreen, type Settings } from './src/ui/screens/HomeScreen';
import { RoundOverlay } from './src/ui/screens/RoundOverlay';
import { RulesScreen } from './src/ui/screens/RulesScreen';
import { colors } from './src/ui/theme';
import { useEmber } from './src/ui/useEmber';

const BOT_NAMES = ['Rashid', 'Noura', 'Salem', 'Maitha'];

type Screen = 'home' | 'rules' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [settings, setSettings] = useState<Settings>({
    rivals: 2,
    difficulty: 'normal',
    assist: false,
  });
  // Bumping this remounts the table, which is what starts a fresh match.
  const [matchId, setMatchId] = useState(0);

  const play = useCallback(() => {
    setMatchId((id) => id + 1);
    setScreen('game');
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {screen === 'home' ? (
            <HomeScreen
              settings={settings}
              onChange={setSettings}
              onPlay={play}
              onRules={() => setScreen('rules')}
            />
          ) : null}

          {screen === 'rules' ? <RulesScreen onBack={() => setScreen('home')} /> : null}

          {screen === 'game' ? (
            <Table
              key={matchId}
              rivals={settings.rivals}
              difficulty={settings.difficulty}
              assist={settings.assist}
              onHome={() => setScreen('home')}
              onPlayAgain={play}
            />
          ) : null}
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

function Table({
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
  const { state, dispatch, yourMemory } = useEmber({
    bots: BOT_NAMES.slice(0, rivals).map((name) => ({ name, difficulty })),
  });

  const finished = state.phase === 'ROUND_OVER' || state.phase === 'MATCH_OVER';

  return (
    <View style={styles.table}>
      <GameScreen
        state={state}
        dispatch={dispatch}
        yourMemory={yourMemory as Record<string, unknown>}
        assist={assist}
        onQuit={onHome}
      />
      {finished ? (
        <RoundOverlay
          state={state}
          onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
          onPlayAgain={onPlayAgain}
          onHome={onHome}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  table: { flex: 1 },
});
