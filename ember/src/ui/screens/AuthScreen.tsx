import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLanguage } from '../../i18n';
import { LTR } from '../ltr';
import { api, ApiError, SERVER_URL, type AuthResponse } from '../../net/api';
import { Button } from '../components/Button';
import { Wordmark } from '../components/Wordmark';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  onSignedIn: (result: AuthResponse) => void;
  onBack: () => void;
}

export function AuthScreen({ onSignedIn, onBack }: Props) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === 'login' ? await api.login(name, password) : await api.register(name, password);
      onSignedIn(result);
    } catch (problem) {
      // The server names what went wrong; the wording is ours, in your language.
      setError(
        problem instanceof ApiError
          ? t.errors[problem.code] ?? t.errors.server_error
          : t.errors.server_error,
      );
    } finally {
      setBusy(false);
    }
  };

  const ready = name.trim().length >= 3 && password.length >= 8 && !busy;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>{t.common.backArrow} {t.common.back}</Text>
        </Pressable>

        <View style={styles.hero}>
          <Wordmark size={34} />
          <Text style={styles.tagline}>
            {mode === 'login' ? t.auth.signInTitle : t.auth.registerTitle}
          </Text>
        </View>

        <View style={styles.form}>
          <Field
            label={t.auth.name}
            value={name}
            onChange={setName}
            placeholder={t.auth.namePlaceholder}
            autoComplete="username"
            maxLength={16}
          />
          <Field
            label={t.auth.password}
            value={password}
            onChange={setPassword}
            placeholder={t.auth.passwordPlaceholder}
            secure
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            maxLength={200}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label={busy ? t.auth.oneMoment : mode === 'login' ? t.auth.signIn : t.auth.createAccount}
            onPress={() => void submit()}
            disabled={!ready}
          />
          {busy ? <ActivityIndicator color={colors.coral} /> : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
          >
            <Text style={styles.switch}>
              {mode === 'login' ? t.auth.switchToRegister : t.auth.switchToSignIn}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footnote}>{t.auth.privacy}</Text>
        <Text {...LTR} style={styles.server}>
          {SERVER_URL}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure,
  autoComplete,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  autoComplete?: 'username' | 'current-password' | 'new-password';
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
        maxLength={maxLength}
        style={styles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { padding: space(6), gap: space(5), flexGrow: 1, justifyContent: 'center' },
  back: { ...typography.label, fontSize: 10, color: colors.textFaint },
  hero: { gap: space(2) },
  tagline: { ...typography.body, color: colors.textMuted },
  form: { gap: space(3) },
  field: { gap: space(1.5) },
  fieldLabel: { ...typography.label, fontSize: 9, color: colors.textFaint },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
    color: colors.text,
    fontSize: 16,
  },
  error: { ...typography.small, color: colors.bad, lineHeight: 18 },
  switch: { ...typography.small, color: colors.coral, textAlign: 'center' },
  footnote: { ...typography.small, fontSize: 11, color: colors.textFaint, lineHeight: 17 },
  server: {
    ...typography.small,
    fontSize: 10,
    color: colors.line,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
});
