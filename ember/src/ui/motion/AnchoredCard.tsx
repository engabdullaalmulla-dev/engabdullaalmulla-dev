import React from 'react';
import { View } from 'react-native';

import { PlayingCard } from '../components/PlayingCard';
import { useAnchor } from './anchors';

type CardProps = React.ComponentProps<typeof PlayingCard>;

/**
 * A card that knows where it is, so other cards can fly to and from it.
 * Wrapping is what lets the anchor hook live outside a loop.
 */
export function AnchoredCard({ anchorKey, ...card }: CardProps & { anchorKey: string }) {
  const anchor = useAnchor(anchorKey);
  return (
    <View {...anchor}>
      <PlayingCard {...card} />
    </View>
  );
}
