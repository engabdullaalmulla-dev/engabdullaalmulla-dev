import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { HTML } from './src/webapp/html.js';

// The origin the game runs on. It is never fetched from -- every sprite, style and font is
// already inside HTML, which is the whole point of tools/build-native.py -- but it has to be
// a real https URL rather than empty, and that is not cosmetic:
//
//   An empty baseUrl is not "no origin", it is a null opaque origin. localStorage on a null
//   origin has no persistent partition, so a dynasty is written, reads back perfectly all
//   session, and is gone on the next launch. This game keeps everything in localStorage --
//   thirty years of a café, the cookbook, who you have met -- so that failure would look
//   like the save system being broken rather than like an origin problem.
//
//   A null origin is also not a secure context, so navigator.share and navigator.clipboard
//   do not exist.
//
// Learned from marble-ultimate-football/native/App.js, which had both reported from a device.
const ORIGIN = 'https://app.cafelife.local/';

export default function App() {
  const web = useRef(null);
  const [key, setKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  // iOS can kill the web content process under memory pressure and Android can lose the
  // render process. Either way the view is left blank, so it is rebuilt from scratch; the
  // save is on disk under the origin above, so the café comes back as it was.
  const recover = useCallback(() => {
    setReady(false);
    setError(null);
    setKey(k => k + 1);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#171310" />
      <WebView
        key={key}
        ref={web}
        originWhitelist={['*']}
        source={{ html: HTML, baseUrl: ORIGIN }}
        style={styles.web}
        containerStyle={styles.web}
        // The game scrolls its own panes and owns its safe-area insets in CSS.
        bounces={false}
        overScrollMode="never"
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        // Saves live here. Without this the dynasty does not survive a relaunch.
        domStorageEnabled
        javaScriptEnabled
        // Nothing in the bundle is remote, so nothing should ever navigate.
        onShouldStartLoadWithRequest={req =>
          req.url === 'about:blank' || req.url.startsWith(ORIGIN)}
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => setReady(true)}
        onError={e => setError(e?.nativeEvent?.description ?? 'The café would not open.')}
        onContentProcessDidTerminate={recover}
        onRenderProcessGone={recover}
        // A long-press selection marquee over the room reads as a bug on a phone.
        {...(Platform.OS === 'ios' ? { allowsLinkPreview: false } : {})}
      />

      {!ready && !error ? (
        <View style={styles.cover} pointerEvents="none">
          <ActivityIndicator size="large" color="#F2A03D" />
        </View>
      ) : null}

      {error ? (
        <View style={styles.cover}>
          <Text style={styles.msg}>{error}</Text>
          <Pressable style={styles.btn} onPress={recover} accessibilityRole="button">
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#171310' },
  web: { flex: 1, backgroundColor: '#171310' },
  cover: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#171310', padding: 24, gap: 18,
  },
  msg: { color: '#D9C9B6', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  btn: { backgroundColor: '#F2A03D', borderRadius: 13, paddingVertical: 14, paddingHorizontal: 28 },
  btnText: { color: '#0E0B09', fontSize: 16, fontWeight: '800' },
});
