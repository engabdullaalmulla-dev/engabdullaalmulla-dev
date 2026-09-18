/* Café Life · original, entirely local soundscape. No samples or network requests. */
(function (global) {
  'use strict';
  let ctx = null, master = null, musicBus = null, sfxBus = null;
  let unlocked = false, paused = false, timer = null, step = 0, nextNote = 0;
  let renewOnGesture = false;
  const settings = { music: true, sfx: true, haptics: true };
  const active = new Set();
  const notes = [0, 4, 7, 11, 7, 4, 2, 7, 0, 4, 9, 12, 11, 7, 4, 2];
  const roots = [48, 45, 53, 55];
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function setup() {
    if (ctx) return true;
    const Context = global.AudioContext || global.webkitAudioContext;
    if (!Context) return false;
    try {
      ctx = new Context();
      master = ctx.createGain(); master.gain.value = 0.32; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = settings.music ? 0.34 : 0;
      sfxBus = ctx.createGain(); sfxBus.gain.value = settings.sfx ? 0.65 : 0;
      musicBus.connect(master); sfxBus.connect(master);
      return true;
    } catch (_) { ctx = null; return false; }
  }

  function tone(frequency, at, duration, level, type, bus) {
    if (!ctx) return;
    const osc = ctx.createOscillator(), envelope = ctx.createGain();
    osc.type = type || 'sine'; osc.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.001, level), at + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(envelope); envelope.connect(bus || sfxBus);
    active.add(osc);
    osc.onended = () => { active.delete(osc); osc.disconnect(); envelope.disconnect(); };
    osc.start(at); osc.stop(at + duration + 0.025);
  }

  function noise(at, duration, level, frequency, bus) {
    if (!ctx) return;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), envelope = ctx.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = frequency;
    envelope.gain.setValueAtTime(level, at);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter); filter.connect(envelope); envelope.connect(bus || sfxBus);
    active.add(source);
    source.onended = () => { active.delete(source); source.disconnect(); filter.disconnect(); envelope.disconnect(); };
    source.start(at); source.stop(at + duration);
  }

  function schedule() {
    if (!ctx || paused || !settings.music || ctx.state !== 'running') return;
    // Scheduling only sound; no game action, resource, or day depends on this clock.
    while (nextNote < ctx.currentTime + 0.18) {
      const bar = Math.floor(step / 16), root = roots[bar % roots.length];
      const n = step % 16;
      tone(midi(root + 12 + notes[n]), nextNote, 0.72, n % 4 === 0 ? 0.16 : 0.11, 'sine', musicBus);
      if (n % 4 === 0) {
        tone(midi(root - 12), nextNote, 1.3, 0.12, 'sine', musicBus);
        tone(midi(root + 7), nextNote, 1.1, 0.038, 'triangle', musicBus);
      }
      if (n % 4 === 2) noise(nextNote, 0.055, 0.025, 1400, musicBus);
      step++; nextNote += 60 / 84 / 2;
    }
  }

  function startMusic() {
    if (!ctx || !unlocked || paused || !settings.music || timer) return;
    nextNote = ctx.currentTime + 0.035;
    schedule(); timer = global.setInterval(schedule, 90);
  }

  function stopMusic() {
    if (timer !== null) global.clearInterval(timer);
    timer = null;
  }

  function discardContext() {
    // Some WKWebView versions report a resumed context as running but produce silence.
    // Recreate it inside the next real gesture after an interruption, without delaying play.
    stopMusic();
    for (const node of active) { try { node.stop(); } catch (_) {} }
    active.clear();
    const previous = ctx;
    ctx = null; master = null; musicBus = null; sfxBus = null;
    if (previous && previous.state !== 'closed') {
      try { previous.close().catch(() => {}); } catch (_) {}
    }
  }

  async function unlock() {
    if (renewOnGesture || ctx?.state === 'closed' || ctx?.state === 'interrupted') {
      discardContext(); renewOnGesture = false;
    }
    if (!setup()) return false;
    unlocked = true;
    if (typeof document !== 'undefined' && document.hidden) return false;
    paused = false;
    try { if (ctx.state !== 'running') await ctx.resume(); } catch (_) { return false; }
    startMusic(); return true;
  }

  function configure(next) {
    for (const key of ['music', 'sfx', 'haptics']) if (typeof next?.[key] === 'boolean') settings[key] = next[key];
    if (ctx) {
      musicBus.gain.setTargetAtTime(settings.music ? 0.34 : 0, ctx.currentTime, 0.045);
      sfxBus.gain.setTargetAtTime(settings.sfx ? 0.65 : 0, ctx.currentTime, 0.02);
    }
    if (settings.music) startMusic(); else stopMusic();
    return { ...settings };
  }

  function haptic(name) {
    if (!settings.haptics || !['tap', 'serve', 'success', 'open'].includes(name)) return;
    try {
      if (global.ReactNativeWebView?.postMessage) {
        global.ReactNativeWebView.postMessage(JSON.stringify({ type: 'haptic', style: name === 'success' ? 'success' : 'tap' }));
      } else if (global.navigator?.vibrate) global.navigator.vibrate(name === 'success' ? [12, 35, 12] : 8);
    } catch (_) { /* Haptics are optional on unsupported devices. */ }
  }

  function play(name) {
    haptic(name);
    if (!ctx || !unlocked || paused || !settings.sfx || ctx.state !== 'running') return;
    const at = ctx.currentTime + 0.005;
    switch (name) {
      case 'pour': noise(at, 0.42, 0.16, 850); tone(360, at, 0.3, 0.035); break;
      case 'serve': tone(660, at, 0.14, 0.16); tone(880, at + 0.075, 0.28, 0.1); break;
      case 'success': [0, 4, 7, 12].forEach((n, i) => tone(midi(67 + n), at + i * 0.09, 0.44, 0.13)); break;
      case 'coins': [1047, 1319, 1568].forEach((n, i) => tone(n, at + i * 0.065, 0.19, 0.09)); break;
      case 'open': [523, 659, 784].forEach((n, i) => tone(n, at + i * 0.1, 0.42, 0.12)); break;
      case 'close': [784, 659, 523].forEach((n, i) => tone(n, at + i * 0.09, 0.35, 0.1)); break;
      case 'error': tone(220, at, 0.18, 0.07, 'triangle'); break;
      default: tone(520, at, 0.065, 0.075); break;
    }
  }

  function stop() {
    paused = true; renewOnGesture = true; stopMusic();
    for (const node of active) { try { node.stop(); } catch (_) {} }
    active.clear();
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  }

  function resume() {
    if (!unlocked || (typeof document !== 'undefined' && document.hidden)) return;
    paused = false;
    if (ctx) ctx.resume().then(startMusic).catch(() => {});
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : resume());
    global.addEventListener('pagehide', stop);
    global.addEventListener('pageshow', resume);
  }
  global.CafeAudio = Object.freeze({ unlock, configure, play, stop, resume });
})(typeof window !== 'undefined' ? window : globalThis);
