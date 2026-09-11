import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

/**
 * Where everything on the table is.
 *
 * Cards can only fly from one place to another if something knows where those
 * places are, so every pile and every slot measures itself once it has been
 * laid out and files the result here under a name.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const anchorKeys = {
  stock: 'stock',
  discard: 'discard',
  hand: 'hand',
  slot: (playerId: string, index: number) => `slot:${playerId}:${index}`,
  seat: (playerId: string) => `seat:${playerId}`,
};

class AnchorStore {
  private rects = new Map<string, Rect>();
  /** The motion layer's own position, so window coordinates can be made local. */
  private origin: Rect = { x: 0, y: 0, width: 0, height: 0 };

  set(key: string, rect: Rect): void {
    this.rects.set(key, rect);
  }

  setOrigin(rect: Rect): void {
    this.origin = rect;
  }

  /** In the motion layer's coordinates, which is where flights are drawn. */
  get(key: string): Rect | undefined {
    const rect = this.rects.get(key);
    if (!rect) return undefined;
    return {
      x: rect.x - this.origin.x,
      y: rect.y - this.origin.y,
      width: rect.width,
      height: rect.height,
    };
  }

  /** Falls back down a list, so a missing slot can borrow its seat. */
  first(...keys: Array<string | undefined>): Rect | undefined {
    for (const key of keys) {
      if (!key) continue;
      const rect = this.get(key);
      if (rect) return rect;
    }
    return undefined;
  }

  forget(prefix: string): void {
    for (const key of [...this.rects.keys()]) {
      if (key.startsWith(prefix)) this.rects.delete(key);
    }
  }
}

/**
 * Asks a view where it is. React Native answers through measureInWindow; on
 * the web the node can also be asked directly, which is both faster and one
 * less thing to go wrong.
 */
function measureInto(node: unknown, keep: (rect: Rect) => void): void {
  if (!node) return;
  const candidate = node as {
    measureInWindow?: (callback: (x: number, y: number, w: number, h: number) => void) => void;
    getBoundingClientRect?: () => { left: number; top: number; width: number; height: number };
  };

  if (typeof candidate.getBoundingClientRect === 'function') {
    const box = candidate.getBoundingClientRect();
    if (box.width > 0 || box.height > 0) {
      keep({ x: box.left, y: box.top, width: box.width, height: box.height });
    }
    return;
  }

  candidate.measureInWindow?.((x, y, width, height) => {
    if (width > 0 || height > 0) keep({ x, y, width, height });
  });
}

const AnchorContext = createContext<AnchorStore | null>(null);

export function AnchorProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => new AnchorStore(), []);
  return <AnchorContext.Provider value={store}>{children}</AnchorContext.Provider>;
}

export function useAnchors(): AnchorStore {
  const store = useContext(AnchorContext);
  if (!store) throw new Error('useAnchors must be used inside an AnchorProvider');
  return store;
}

/**
 * Marks a view as somewhere cards can come from or go to. Spread the result
 * onto the view: `<View {...useAnchor('stock')} />`.
 */
export function useAnchor(key: string) {
  const store = useAnchors();
  const ref = useRef<View | null>(null);

  const measure = useCallback(() => {
    // A frame's grace: on the web the element is not placed until the browser
    // has done its own layout pass.
    requestAnimationFrame(() => {
      measureInto(ref.current, (rect) => store.set(key, rect));
    });
  }, [key, store]);

  const onLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      measure();
    },
    [measure],
  );

  return { ref, onLayout, collapsable: false as const };
}

/** The layer flights are drawn into. Everything else is measured against it. */
export function useOriginAnchor() {
  const store = useAnchors();
  const ref = useRef<View | null>(null);

  const onLayout = useCallback(() => {
    requestAnimationFrame(() => {
      measureInto(ref.current, (rect) => store.setOrigin(rect));
    });
  }, [store]);

  return { ref, onLayout, collapsable: false as const };
}
