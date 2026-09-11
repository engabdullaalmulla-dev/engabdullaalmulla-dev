import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CHEEKY_PHRASES,
  EMOJI,
  KIND_PHRASES,
  type ExpressionId,
  type PhraseId,
} from '../../../shared/expressions';
import { useLanguage } from '../../i18n';
import { tap } from '../haptics';
import { asDir } from '../ltr';
import { colors, radius, shadow, space, type as typography } from '../theme';
import { Mark } from './Mark';

/**
 * The one way to talk to the table.
 *
 * Eight faces and eight lines, and no way to type anything — which is the
 * point. Nothing here needs translating at the far end either: a phrase
 * crosses as an id and arrives in whatever language the other phone is
 * reading.
 */

export interface TraySeat {
  id: string;
  name: string;
  avatar?: string;
}

export function ExpressionTray({
  seats,
  onSend,
  disabled,
}: {
  /** Everyone who can be thrown something, yourself excluded. */
  seats: TraySeat[];
  onSend: (id: ExpressionId, targetId: string | null) => void;
  disabled?: boolean;
}) {
  const { t, rtl } = useLanguage();
  const [open, setOpen] = useState(false);
  const [aim, setAim] = useState<string | null>(null);

  const send = (id: ExpressionId) => {
    tap();
    onSend(id, aim);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.express.open}
        disabled={disabled}
        onPress={() => {
          tap();
          setOpen(true);
        }}
        style={({ pressed }) => [styles.opener, pressed && styles.pressed, disabled && styles.off]}
      >
        <Text allowFontScaling={false} style={styles.openerGlyph}>
          🙂
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Stops a tap inside the sheet from closing it. */}
          <Pressable {...asDir(rtl)} style={styles.sheet} onPress={() => {}}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetBody}
            >
            <Text style={styles.title}>{t.express.title}</Text>

            {seats.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.aimRow}
              >
                <Aim label={t.express.everyone} on={aim === null} onPress={() => setAim(null)} />
                {seats.map((seat) => (
                  <Aim
                    key={seat.id}
                    label={seat.name}
                    avatar={seat.avatar}
                    seed={seat.id}
                    on={aim === seat.id}
                    onPress={() => setAim(aim === seat.id ? null : seat.id)}
                  />
                ))}
              </ScrollView>
            ) : null}

            <Text style={styles.section}>{t.express.emoji}</Text>
            {aim === null && seats.length > 0 ? (
              <Text style={styles.hint}>{t.express.aimHint}</Text>
            ) : null}
            <View style={styles.emojiGrid}>
              {EMOJI.map((entry) => (
                <Pressable
                  key={entry.id}
                  accessibilityRole="button"
                  accessibilityLabel={entry.id}
                  onPress={() => send(entry.id)}
                  style={({ pressed }) => [styles.emoji, pressed && styles.pressed]}
                >
                  <Text allowFontScaling={false} style={styles.emojiGlyph}>
                    {entry.glyph}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.section}>{t.express.kind}</Text>
            <Phrases ids={KIND_PHRASES} onSend={send} />

            <Text style={styles.section}>{t.express.cheeky}</Text>
            <Phrases ids={CHEEKY_PHRASES} onSend={send} cheeky />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Phrases({
  ids,
  onSend,
  cheeky,
}: {
  ids: readonly PhraseId[];
  onSend: (id: ExpressionId) => void;
  cheeky?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <View style={styles.phrases}>
      {ids.map((id) => (
        <Pressable
          key={id}
          accessibilityRole="button"
          onPress={() => onSend(id)}
          style={({ pressed }) => [
            styles.phrase,
            cheeky && styles.phraseCheeky,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.phraseText, cheeky && styles.phraseTextCheeky]}>
            {t.express.phrase[id]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Aim({
  label,
  avatar,
  seed,
  on,
  onPress,
}: {
  label: string;
  avatar?: string;
  seed?: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.aim, on && styles.aimOn, pressed && styles.pressed]}
    >
      {seed ? <Mark avatar={avatar} seed={seed} size={20} /> : null}
      <Text style={[styles.aimText, on && styles.aimTextOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opener: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.card,
  },
  openerGlyph: { fontSize: 20, lineHeight: undefined },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  off: { opacity: 0.35 },

  backdrop: { flex: 1, backgroundColor: '#EDE2D4CC', justifyContent: 'flex-end', padding: space(3) },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    maxWidth: 480,
    width: '100%',
    maxHeight: '82%',
    alignSelf: 'center',
    ...shadow.card,
  },
  sheetBody: { padding: space(4), gap: space(2) },
  title: { ...typography.heading, fontSize: 17, color: colors.text },
  section: { ...typography.label, fontSize: 9, color: colors.textFaint, marginTop: space(1) },
  hint: { ...typography.small, fontSize: 11, color: colors.textFaint, marginTop: -space(1) },

  aimRow: { gap: space(2), paddingVertical: space(1) },
  aim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(1.5),
    paddingVertical: space(1.5),
    paddingHorizontal: space(3),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperLight,
    maxWidth: 150,
  },
  aimOn: { borderColor: colors.coral, backgroundColor: colors.coralWash },
  aimText: { ...typography.small, fontSize: 12, color: colors.textMuted, flexShrink: 1 },
  aimTextOn: { color: colors.coralDeep },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), justifyContent: 'center' },
  emoji: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperLight,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emojiGlyph: { fontSize: 28, lineHeight: undefined },

  phrases: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  phrase: {
    paddingVertical: space(2),
    paddingHorizontal: space(3),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperLight,
  },
  phraseCheeky: { borderColor: colors.coralSoft, backgroundColor: colors.coralWash },
  phraseText: { ...typography.small, fontSize: 13, color: colors.text },
  phraseTextCheeky: { color: colors.coralDeep },
});
