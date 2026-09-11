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

import { api, ApiError, SERVER_URL, type AuthResponse } from '../../net/api';
import { Button } from '../components/Button';
import { Wordmark } from '../components/Wordmark';
import { colors, radius, space, type as typography } from '../theme';

interface Props {
  onSignedIn: (result: AuthResponse) => void;
  onBack: () => void;
}

export function AuthScreen({ onSignedIn, onBack }: Props) {
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
      setError(problem instanceof ApiError ? problem.message : 'Something went wrong.');
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
          <Text style={styles.back}>← BACK</Text>
        </Pressable>

        <View style={styles.hero}>
          <Wordmark size={34} />
          <Text style={styles.tagline}>
            {mode === 'login' ? 'Sign in to play online.' : 'Pick a name and a password.'}
          </Text>
        </View>

        <View style={styles.form}>
          <Field
            label="NAME"
            value={name}
            onChange={setName}
            placeholder="Abdulla"
            autoComplete="username"
            maxLength={16}
          />
          <Field
            label="PASSWORD"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            secure
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            maxLength={200}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label={busy ? 'ONE MOMENT…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            onPress={() => void submit()}
            disabled={!ready}
          />
          {busy ? <ActivityIndicator color={colors.ember} /> : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
          >
            <Text style={styles.switch}>
              {mode === 'login' ? 'No account yet? Create one.' : 'Already playing? Sign in.'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footnote}>
          EMBER keeps a name and a password and nothing else — no email, no address book, no
          tracking. There is no way to reset a password you forget, so choose one you will
          remember.
        </Text>
        <Text style={styles.server}>{SERVER_URL}</Text>
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
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
    color: colors.text,
    fontSize: 16,
  },
  error: { ...typography.small, color: colors.bad, lineHeight: 18 },
  switch: { ...typography.small, color: colors.ember, textAlign: 'center' },
  footnote: { ...typography.small, fontSize: 11, color: colors.textFaint, lineHeight: 17 },
  server: { ...typography.small, fontSize: 10, color: colors.line, textAlign: 'center' },
});
