import React, { useCallback, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { Card } from '../../../shared/types';
import { PlayingCard } from '../components/PlayingCard';
import { colors, shadow } from '../theme';
import { useOriginAnchor, type Rect } from './anchors';

/** One card, in the air, on its way from somewhere to somewhere else. */
export interface Flight {
  id: string;
  from: Rect;
  to: Rect;
  /** The card to draw. Null flies a card face down. */
  card: Card | null;
  faceUp: boolean;
  /** Turn the card over as it travels — a throw landing face up. */
  flip?: boolean;
  durationMs?: number;
  delayMs?: number;
  /** How high the card lifts off the felt on its way. */
  arc?: number;
  /** A burned card leaves the table rather than landing on it. */
  vanish?: boolean;
  /** What a card does on a blind swap. */
  spin?: boolean;
  /** The anchor it is heading for, so the table can hold off drawing it. */
  toKey?: string;
}

/** A flash of fire where a card just left the table. */
export interface Burst {
  id: string;
  rect: Rect;
}

export interface FlightController {
  flights: Flight[];
  bursts: Burst[];
  burst: (rect: Rect) => void;
  fly: (flight: Omit<Flight, 'id'> & { id?: string }) => void;
  land: (id: string) => void;
  /** True while a card is on its way to this place. */
  isFlyingTo: (key: string) => boolean;
  clear: () => void;
}

let sequence = 0;

/**
 * Holds the cards currently in the air. Flights are queued by whatever noticed
 * the table change, and removed once they land.
 */
export function useFlights(): FlightController {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);

  const burst = useCallback((rect: Rect) => {
    const id = `burst-${(sequence += 1)}`;
    setBursts((current) => [...current, { id, rect }]);
    setTimeout(() => setBursts((current) => current.filter((entry) => entry.id !== id)), 840);
  }, []);

  const fly = useCallback((flight: Omit<Flight, 'id'> & { id?: string }) => {
    const id = flight.id ?? `flight-${(sequence += 1)}`;
    setFlights((current) => [...current, { ...flight, id }]);
  }, []);

  const land = useCallback((id: string) => {
    setFlights((current) => current.filter((flight) => flight.id !== id));
  }, []);

  const isFlyingTo = useCallback(
    (key: string) => flights.some((flight) => flight.toKey === key),
    [flights],
  );

  const clear = useCallback(() => {
    setFlights([]);
    setBursts([]);
  }, []);

  return { flights, bursts, burst, fly, land, isFlyingTo, clear };
}

interface Props {
  controller: FlightController;
  /** Told when a flight lands, so the table can catch up. */
  onLand?: (flight: Flight) => void;
}

export function MotionLayer({ controller, onLand }: Props) {
  const origin = useOriginAnchor();

  return (
    <View {...origin} pointerEvents="none" style={styles.layer}>
      {controller.flights.map((flight) => (
        <FlyingCard
          key={flight.id}
          flight={flight}
          onDone={() => {
            onLand?.(flight);
            controller.land(flight.id);
          }}
        />
      ))}

      {controller.bursts.map((entry) => (
        <EmberBurst key={entry.id} rect={entry.rect} />
      ))}
    </View>
  );
}

/** The flare a card leaves behind when it is burned out of a pile. */
function EmberBurst({ rect }: { rect: Rect }) {
  const grow = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(grow, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [grow]);

  const size = Math.max(rect.width, rect.height) * 0.9;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: rect.x + rect.width / 2 - size / 2,
        top: rect.y + rect.height / 2 - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: colors.coral,
        opacity: grow.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.9, 0] }),
        transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.9] }) }],
      }}
    />
  );
}

function FlyingCard({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const width = flight.to.width || flight.from.width || 60;
  const scaleFrom = (flight.from.width || width) / width;

  React.useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: flight.durationMs ?? 460,
      delay: flight.delayMs ?? 0,
      easing: Easing.bezier(0.25, 0.9, 0.3, 1),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arc = flight.arc ?? 0;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [flight.from.x, flight.to.x],
  });
  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [flight.from.y, flight.to.y] }),
    // A card thrown across a table rises before it settles.
    progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -arc, 0] }),
  );
  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [scaleFrom, Math.max(scaleFrom, 1) * 1.04, flight.vanish ? 1.25 : 1],
  });
  const opacity = flight.vanish
    ? progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 1, 0] })
    : 1;
  const rotate = flight.spin
    ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
    : '0deg';

  // A card that turns over mid-flight: shown face down for the first half.
  const [faceUp, setFaceUp] = useState(flight.flip ? false : flight.faceUp);
  React.useEffect(() => {
    if (!flight.flip) return;
    const timer = setTimeout(
      () => setFaceUp(flight.faceUp),
      (flight.delayMs ?? 0) + (flight.durationMs ?? 460) * 0.35,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        shadow.flying,
        {
          width,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }, { rotate }],
        },
      ]}
    >
      <PlayingCard card={flight.card} faceUp={faceUp} width={width} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, zIndex: 50 },
  card: { position: 'absolute', top: 0, left: 0 },
});
