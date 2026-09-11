import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import type { ErrorCode, PublicUser } from '../../../shared/protocol';
import type { ConnectionStatus, TableState } from '../../net/useOnline';
import type { GameAction } from '../../../shared/types';
import { useLanguage } from '../../i18n';
import { GameScreen } from './GameScreen';
import { RoundOverlay } from './RoundOverlay';

interface Props {
  table: TableState;
  status: ConnectionStatus;
  user: PublicUser | null;
  error: ErrorCode | null;
  assist: boolean;
  yourMemory: Record<string, unknown>;
  onPlay: (action: GameAction) => void;
  onNextRound: () => void;
  onLeave: () => void;
}

/** Ticks once a second so a deadline can be shown as a countdown. */
function useSecondsUntil(deadline: number | null): number | null {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (deadline == null) {
      setSeconds(null);
      return;
    }
    const update = () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 500);
    return () => clearInterval(timer);
  }, [deadline]);

  return seconds;
}

export function OnlineTable({
  table,
  status,
  user,
  error,
  assist,
  yourMemory,
  onPlay,
  onNextRound,
  onLeave,
}: Props) {
  const { t, n } = useLanguage();
  const { view, clock, nextRoundAt } = table;
  const yours = clock && (clock.playerId === view.youId || clock.playerId === '*');
  const secondsLeft = useSecondsUntil(yours ? clock.endsAt : null);
  const untilNextRound = useSecondsUntil(nextRoundAt);

  const finished = view.phase === 'ROUND_OVER' || view.phase === 'MATCH_OVER';

  const banner =
    status === 'reconnecting' || status === 'connecting'
      ? { text: t.lobby.status.reconnecting, tone: 'bad' as const }
      : status === 'failed'
        ? { text: t.lobby.status.failed, tone: 'bad' as const }
        : error
          ? { text: t.errors[error] ?? t.errors.server_error, tone: 'bad' as const }
          : null;

  return (
    <View style={styles.flex}>
      <GameScreen
        view={view}
        dispatch={onPlay}
        yourMemory={yourMemory}
        assist={assist}
        onQuit={onLeave}
        banner={banner}
        clock={secondsLeft}
      />
      {finished ? (
        <RoundOverlay
          view={view}
          onNextRound={onNextRound}
          onPlayAgain={onLeave}
          onHome={onLeave}
          waitingOn={
            view.phase === 'ROUND_OVER' && untilNextRound != null
              ? t.overlay.nextRoundIn(n(untilNextRound))
              : null
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
