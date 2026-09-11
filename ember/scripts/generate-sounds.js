/**
 * Makes EMBER's sound effects from arithmetic — no sample packs, no licences,
 * and anyone can change how the burn sounds by editing a line here.
 *
 *   node scripts/generate-sounds.js
 *
 * Writes 22.05 kHz mono WAVs into assets/sfx/.
 */

const fs = require('node:fs');
const path = require('node:path');

const RATE = 22050;

/* ---- building blocks ---------------------------------------------- */

function silence(seconds) {
  return new Float32Array(Math.round(seconds * RATE));
}

/** Deterministic noise, so every run produces the same files. */
function makeNoise(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state / 2147483648) - 1;
  };
}

/** A one-pole low pass: turns white noise into something with a body. */
function lowPass(samples, cutoff) {
  const alpha = Math.min(1, (2 * Math.PI * cutoff) / RATE);
  let last = 0;
  for (let i = 0; i < samples.length; i++) {
    last += alpha * (samples[i] - last);
    samples[i] = last;
  }
  return samples;
}

/** A one-pole high pass, for the bite in a snap. */
function highPass(samples, cutoff) {
  const alpha = Math.min(1, (2 * Math.PI * cutoff) / RATE);
  let last = 0;
  let previous = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = samples[i];
    last = alpha * (last + value - previous);
    previous = value;
    samples[i] = last;
  }
  return samples;
}

function mix(into, part, atSeconds, gain = 1) {
  const offset = Math.round(atSeconds * RATE);
  for (let i = 0; i < part.length; i++) {
    const at = offset + i;
    if (at >= 0 && at < into.length) into[at] += part[i] * gain;
  }
  return into;
}

/** Noise shaped by an attack and a decay — the basis of every card sound. */
function noiseBurst({ seconds, attack = 0.002, decay = 0.06, cutoff = 6000, highCut = 0, seed = 1 }) {
  const out = silence(seconds);
  const noise = makeNoise(seed);
  for (let i = 0; i < out.length; i++) out[i] = noise();
  if (cutoff) lowPass(out, cutoff);
  if (highCut) highPass(out, highCut);
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const rise = attack > 0 ? Math.min(1, t / attack) : 1;
    out[i] *= rise * Math.exp(-t / decay);
  }
  return out;
}

/** A tone with a decay, optionally bending in pitch. */
function tone({ seconds, frequency, endFrequency = frequency, decay = 0.15, shape = Math.sin }) {
  const out = silence(seconds);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const progress = i / out.length;
    const hz = frequency + (endFrequency - frequency) * progress;
    phase += (2 * Math.PI * hz) / RATE;
    out[i] = shape(phase) * Math.exp(-t / decay);
  }
  return out;
}

/** Keeps a sound inside its bounds without squashing the life out of it. */
function normalise(samples, peak = 0.85) {
  let loudest = 0;
  for (const value of samples) loudest = Math.max(loudest, Math.abs(value));
  if (loudest === 0) return samples;
  const gain = peak / loudest;
  for (let i = 0; i < samples.length; i++) {
    const scaled = samples[i] * gain;
    // A gentle knee, so nothing ever clips into a crackle of its own.
    samples[i] = Math.tanh(scaled * 1.2) * 0.92;
  }
  return samples;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/* ---- the sounds ---------------------------------------------------- */

/** A card sliding off the top of the stock. */
function draw() {
  const out = silence(0.18);
  mix(out, noiseBurst({ seconds: 0.16, attack: 0.012, decay: 0.055, cutoff: 3200, seed: 11 }), 0, 0.5);
  mix(out, noiseBurst({ seconds: 0.05, attack: 0.001, decay: 0.012, cutoff: 9000, highCut: 1800, seed: 12 }), 0.1, 0.35);
  return normalise(out, 0.4);
}

/** A card landing flat on the pile. */
function land() {
  const out = silence(0.22);
  mix(out, noiseBurst({ seconds: 0.09, attack: 0.001, decay: 0.02, cutoff: 11000, highCut: 900, seed: 21 }), 0, 0.75);
  mix(out, tone({ seconds: 0.14, frequency: 190, endFrequency: 120, decay: 0.035 }), 0.004, 0.35);
  return normalise(out, 0.52);
}

/** The card travelling before it lands. */
function throwCard() {
  const out = silence(0.34);
  const whoosh = noiseBurst({ seconds: 0.22, attack: 0.05, decay: 0.09, cutoff: 2400, seed: 31 });
  mix(out, whoosh, 0, 0.55);
  mix(out, land(), 0.16, 0.9);
  return normalise(out, 0.55);
}

/** Dealing: a run of cards off the deck. */
function deal() {
  const out = silence(0.75);
  for (let i = 0; i < 9; i++) {
    mix(
      out,
      noiseBurst({ seconds: 0.07, attack: 0.001, decay: 0.018, cutoff: 8000, highCut: 1200, seed: 41 + i }),
      i * 0.072,
      0.55 - i * 0.02,
    );
  }
  return normalise(out, 0.5);
}

/** A card going up in flames. */
function burn() {
  const out = silence(0.62);
  mix(out, tone({ seconds: 0.3, frequency: 320, endFrequency: 90, decay: 0.1 }), 0, 0.45);
  const crackle = silence(0.55);
  const noise = makeNoise(57);
  for (let i = 0; i < crackle.length; i++) {
    const t = i / RATE;
    // Sparse pops over a rushing bed: fire, roughly.
    const pop = noise() > 0.986 ? (noise() > 0 ? 1 : -1) : 0;
    crackle[i] = pop * Math.exp(-t / 0.35) + noise() * 0.22 * Math.exp(-t / 0.22);
  }
  highPass(crackle, 900);
  mix(out, crackle, 0.02, 0.8);
  mix(out, noiseBurst({ seconds: 0.25, attack: 0.03, decay: 0.1, cutoff: 1800, seed: 58 }), 0, 0.4);
  return normalise(out, 0.6);
}

/** Two knuckles on the table. */
function knock() {
  const out = silence(0.5);
  const rap = () => {
    const hit = silence(0.16);
    mix(hit, tone({ seconds: 0.14, frequency: 210, endFrequency: 130, decay: 0.035 }), 0, 0.9);
    mix(hit, noiseBurst({ seconds: 0.04, attack: 0.0005, decay: 0.008, cutoff: 6000, highCut: 700, seed: 71 }), 0, 0.7);
    return hit;
  };
  mix(out, rap(), 0);
  mix(out, rap(), 0.15, 0.9);
  return normalise(out, 0.65);
}

/** The turn of a card, face up. */
function flip() {
  const out = silence(0.12);
  mix(out, noiseBurst({ seconds: 0.06, attack: 0.001, decay: 0.014, cutoff: 9000, highCut: 1500, seed: 81 }), 0, 0.6);
  mix(out, tone({ seconds: 0.06, frequency: 900, endFrequency: 520, decay: 0.018 }), 0.002, 0.18);
  return normalise(out, 0.5);
}

/**
 * The burn window opening. Something has to say so, but it is a small struck
 * bell rather than an alarm — two notes rising, left to ring out.
 */
function alert() {
  const out = silence(0.75);
  for (const [at, hz, gain] of [
    [0, 587.33, 0.45],
    [0.1, 880, 0.4],
  ]) {
    mix(out, tone({ seconds: 0.62, frequency: hz, decay: 0.24 }), at, gain);
    // A touch of the octave above gives it the ring of struck metal.
    mix(out, tone({ seconds: 0.4, frequency: hz * 2, decay: 0.1 }), at, gain * 0.22);
  }
  return normalise(out, 0.55);
}

/** The end of a round: a small warm cadence, not a fanfare. */
function chime() {
  const out = silence(0.9);
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((hz, index) => {
    mix(out, tone({ seconds: 0.7, frequency: hz, decay: 0.26 }), index * 0.09, 0.42);
    mix(out, tone({ seconds: 0.5, frequency: hz * 2, decay: 0.12 }), index * 0.09, 0.12);
  });
  return normalise(out, 0.6);
}

/* ---- write them out ------------------------------------------------ */

const sounds = {
  deal: deal(),
  draw: draw(),
  throw: throwCard(),
  land: land(),
  burn: burn(),
  knock: knock(),
  alert: alert(),
  flip: flip(),
  chime: chime(),
};

const out = path.join(__dirname, '..', 'assets', 'sfx');
fs.mkdirSync(out, { recursive: true });

let total = 0;
for (const [name, samples] of Object.entries(sounds)) {
  const file = wav(samples);
  fs.writeFileSync(path.join(out, `${name}.wav`), file);
  total += file.length;
  console.log(`assets/sfx/${name}.wav — ${(file.length / 1024).toFixed(1)} KB`);
}
console.log(`\n${(total / 1024).toFixed(0)} KB of sound, all of it arithmetic`);
