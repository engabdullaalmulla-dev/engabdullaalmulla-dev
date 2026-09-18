import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, NativeModules, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { requireOptionalNativeModule } from 'expo';
import * as Haptics from 'expo-haptics';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { HTML } from './src/webapp/html.js';
import SaveBridge from './src/saveBridge';
import PurchaseBridge from './src/purchaseBridge';

// Expo Go and the web preview cannot purchase. Only the compiled iOS module can.
const Purchases = Platform.OS === 'ios' ? requireOptionalNativeModule('CafePurchases') : null;

// A stable secure origin gives local saves a persistent partition. No request is made to it.
const ORIGIN = 'https://app.cafelife.local/';
const COPY = {
  en: { loading: 'Opening your café…', error: 'Your café could not open. Your saved game is still on this device.', retry: 'Try again', export: 'Export your café' },
  ar: { loading: 'جارٍ فتح مقهاك…', error: 'تعذّر فتح المقهى. لا تزال لعبتك المحفوظة على هذا الجهاز.', retry: 'حاول مجددًا', export: 'تصدير مقهاك' },
};
const PALETTES = {
  light: { backgroundColor: '#f8f3e9', ink: '#30443b', accent: '#1f6259' },
  dark: { backgroundColor: '#18251f', ink: '#f2eee2', accent: '#b2d6b8' },
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
  const [theme, setTheme] = useState('light');
  const fileBusy = useRef(false);
  const lastHaptic = useRef(0);
  const purchaseController = useRef(null);
  if (!purchaseController.current) {
    purchaseController.current = PurchaseBridge.createController(Purchases, detail => {
      web.current?.injectJavaScript(PurchaseBridge.resultScript(detail));
    });
  }
  const copy = COPY[language];
  const palette = PALETTES[theme];

  const recover = useCallback(() => {
    setReady(false); setError(false); setKey(value => value + 1);
  }, []);

  useEffect(() => {
    const purchases = Purchases?.addListener('onEntitlementChange', detail => purchaseController.current.update(detail));
    const listener = AppState.addEventListener('change', state => {
      web.current?.injectJavaScript(`window.CafeAudio?.${state === 'active' ? 'resume' : 'stop'}(); true;`);
      if (state === 'active') void purchaseController.current.request({ type: 'purchaseStatus', requestId: 'native-update' });
    });
    return () => { listener.remove(); purchases?.remove(); };
  }, []);

  const fileRequest = useCallback(async data => {
    const reply = result => web.current?.injectJavaScript(SaveBridge.resultScript(result));
    if (fileBusy.current) { reply(SaveBridge.errorResult(data, { code: 'busy' })); return; }
    fileBusy.current = true;
    const io = {
      sharingAvailable: () => Sharing.isAvailableAsync(),
      write: (name, text) => {
        const folder = new Directory(Paths.cache, 'cafelife-exports');
        folder.create({ intermediates: true, idempotent: true });
        const file = new File(folder, name);
        file.create({ overwrite: true });
        file.write(text);
        return file;
      },
      share: file => Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: copy.export }),
      pick: () => DocumentPicker.getDocumentAsync({ type: '*/*', multiple: false, copyToCacheDirectory: true, base64: false }),
      size: asset => new File(asset.uri).size,
      read: asset => new File(asset.uri).text(),
      remove: asset => {
        // Remove temporary app-cache copies only. A player's original file is never deleted.
        if (!asset.uri.startsWith(Paths.cache.uri)) return;
        try { const file = new File(asset.uri); if (file.exists) file.delete(); } catch (_) { /* OS cache cleanup can finish later. */ }
      },
    };
    try {
      reply(await (data.type === 'exportSave' ? SaveBridge.exportSaveFile(data, io) : SaveBridge.pickSaveFile(data, io)));
    } catch (error) { reply(SaveBridge.errorResult(data, error)); }
    finally { fileBusy.current = false; }
  }, [copy.export]);

  const message = useCallback(event => {
    const purchase = PurchaseBridge.parseMessage(event.nativeEvent.data);
    if (purchase) { void purchaseController.current.request(purchase); return; }
    const data = SaveBridge.parseMessage(event.nativeEvent.data);
    if (!data) return;
    if (data.type === 'language') setLanguage(data.language);
    if (data.type === 'appearance') setTheme(data.theme);
    // The web UI requests purchaseStatus once at startup; ready is emitted on
    // every render and must never trigger another catalogue request.
    if (data.type === 'ready') { setReady(true); setError(false); }
    if (data.type === 'exportSave' || data.type === 'pickSave') { void fileRequest(data); return; }
    if (data.type === 'haptic' && AppState.currentState === 'active' && Date.now() - lastHaptic.current > 70) {
      lastHaptic.current = Date.now();
      const effect = Platform.OS === 'android'
        ? Haptics.performAndroidHapticsAsync(data.style === 'success' ? Haptics.AndroidHaptics.Confirm : Haptics.AndroidHaptics.Virtual_Key)
        : data.style === 'success'
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      // Silent fallback on simulators, unsupported hardware or system haptics disabled.
      void effect.catch(() => {});
    }
  }, [fileRequest]);

  return (
    <View style={[styles.root, { backgroundColor: palette.backgroundColor }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={palette.backgroundColor} />
      <WebView
        key={key}
        ref={web}
        originWhitelist={['https://app.cafelife.local', 'about:blank']}
        source={{ html: HTML, baseUrl: ORIGIN }}
        style={[styles.web, { backgroundColor: palette.backgroundColor }]}
        containerStyle={[styles.web, { backgroundColor: palette.backgroundColor }]}
        bounces={false}
        overScrollMode="never"
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        domStorageEnabled
        javaScriptEnabled
        injectedJavaScriptBeforeContentLoaded={`window.CAFE_NATIVE_LANGUAGE=${JSON.stringify(language)};window.CAFE_NATIVE_CAPABILITIES={saveFiles:true,haptics:true,purchases:${Boolean(Purchases)}};true;`}
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
        <View style={[styles.cover, { backgroundColor: palette.backgroundColor }]} pointerEvents="none" accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={palette.accent} accessibilityLabel={copy.loading} />
          <Text style={[styles.msg, { color: palette.ink }, language === 'ar' && styles.arabic]}>{copy.loading}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={[styles.cover, { backgroundColor: palette.backgroundColor }]} accessibilityViewIsModal>
          <Text style={[styles.msg, { color: palette.ink }, language === 'ar' && styles.arabic]} accessibilityRole="alert">{copy.error}</Text>
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
