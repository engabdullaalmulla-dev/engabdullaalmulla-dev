import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, NativeModules, Platform, Pressable, StatusBar, StyleSheet, Text, Vibration, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { HTML } from './src/webapp/html.js';

// A stable secure origin gives local saves a persistent partition. No request is made to it.
const ORIGIN = 'https://app.cafelife.local/';
const COPY = {
  en: { loading: 'Opening your café…', error: 'Your café could not open. Your saved game is still on this device.', retry: 'Try again' },
  ar: { loading: 'جارٍ فتح مقهاك…', error: 'تعذّر فتح المقهى. لا تزال لعبتك المحفوظة على هذا الجهاز.', retry: 'حاول مجددًا' },
};
function deviceLanguage() {
  const settings = NativeModules.SettingsManager?.settings;
  const locale = settings?.AppleLanguages?.[0] || settings?.AppleLocale
    || NativeModules.I18nManager?.localeIdentifier || Intl.DateTimeFormat().resolvedOptions().locale;
  return /^ar(?:[-_]|$)/i.test(locale || '') ? 'ar' : 'en';
}

export default function App() {
  const web = useRef(null);
  const [key, setKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [language, setLanguage] = useState(deviceLanguage);
  const copy = COPY[language];

  const recover = useCallback(() => {
    setReady(false); setError(false); setKey(value => value + 1);
  }, []);

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      web.current?.injectJavaScript(`window.CafeAudio?.${state === 'active' ? 'resume' : 'stop'}(); true;`);
    });
    return () => listener.remove();
  }, []);

  const message = useCallback(event => {
    let data;
    try { data = JSON.parse(event.nativeEvent.data); } catch (_) { return; }
    if (data.type === 'language' && (data.language === 'en' || data.language === 'ar')) setLanguage(data.language);
    if (data.type === 'ready') { setReady(true); setError(false); }
    // Android permits short, unobtrusive vibrations. iOS's generic vibration is much longer,
    // so we leave it silent instead of turning a light tap into a phone-call buzz.
    if (data.type === 'haptic' && Platform.OS === 'android') {
      Vibration.vibrate(data.style === 'success' ? [0, 10, 35, 10] : 8);
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f3e9" />
      <WebView
        key={key}
        ref={web}
        originWhitelist={['https://app.cafelife.local', 'about:blank']}
        source={{ html: HTML, baseUrl: ORIGIN }}
        style={styles.web}
        containerStyle={styles.web}
        bounces={false}
        overScrollMode="never"
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        domStorageEnabled
        javaScriptEnabled
        injectedJavaScriptBeforeContentLoaded={`window.CAFE_NATIVE_LANGUAGE=${JSON.stringify(language)}; true;`}
        onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url === ORIGIN || request.url.startsWith(ORIGIN + '#')}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction
        onMessage={message}
        onLoadEnd={() => setReady(true)}
        onError={() => { setError(true); setReady(false); }}
        onHttpError={() => { setError(true); setReady(false); }}
        onContentProcessDidTerminate={recover}
        onRenderProcessGone={recover}
        {...(Platform.OS === 'ios' ? { allowsLinkPreview: false } : {})}
      />
      {!ready && !error ? (
        <View style={styles.cover} pointerEvents="none" accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color="#1f6259" accessibilityLabel={copy.loading} />
          <Text style={[styles.msg, language === 'ar' && styles.arabic]}>{copy.loading}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.cover} accessibilityViewIsModal>
          <Text style={[styles.msg, language === 'ar' && styles.arabic]} accessibilityRole="alert">{copy.error}</Text>
          <Pressable style={styles.btn} onPress={recover} accessibilityRole="button" accessibilityLabel={copy.retry}>
            <Text style={styles.btnText}>{copy.retry}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f3e9' },
  web: { flex: 1, backgroundColor: '#f8f3e9' },
  cover: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f3e9', padding: 28, gap: 18 },
  msg: { color: '#30443b', fontSize: 17, textAlign: 'center', lineHeight: 27 },
  arabic: { writingDirection: 'rtl' },
  btn: { backgroundColor: '#1f6259', borderRadius: 16, minHeight: 52, paddingVertical: 15, paddingHorizontal: 32 },
  btnText: { color: '#ffffff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
});
