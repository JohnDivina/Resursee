'use client';

/**
 * Resursee Web Audio Sound Engine
 * Synthesizes deep, crisp mechanical keyboard "thock" tactile audio effects
 * with zero external assets, zero network latency, and organic pitch randomization.
 */

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let isSoundEnabled = true;

// Initialize or resume AudioContext lazily on user gesture
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// Generate small noise buffer for the tactile keycap collision transient
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;

  const bufferSize = ctx.sampleRate * 0.008; // 8ms transient noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Decaying white noise
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
  }

  noiseBuffer = buffer;
  return buffer;
}

export function setSoundEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('resursee-sound-enabled', enabled ? '1' : '0');
  }
}

export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('resursee-sound-enabled');
  if (saved === null) return true;
  return saved === '1';
}

/**
 * Play a rich, satisfying mechanical switch "Thock"
 * @param pitchMultiplier - fine-tune base frequency (0.8 = deeper, 1.2 = higher)
 * @param volume - master volume (0.05 - 0.2 is pleasant)
 */
export function playThock(pitchMultiplier = 1, volume = 0.08) {
  if (!isSoundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Organic micro pitch variation (±4%)
    const randomVariation = 1 + (Math.random() * 0.08 - 0.04);
    const scale = pitchMultiplier * randomVariation;

    // --- 1. Low-End Body Thump (Deep Bottom-out) ---
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'triangle'; // Richer harmonics than pure sine for a woody mechanical thock
    const startFreq = 220 * scale;
    const endFreq = 65 * scale;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + 0.045);

    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(volume * 1.2, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

    // Filter to warm up the bottom end
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(500, now);
    lowFilter.Q.setValueAtTime(1.5, now);

    osc.connect(lowFilter);
    lowFilter.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);

    // --- 2. Keycap Stem Impact Transient (The crisp initial tactile tap) ---
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(950 * scale, now);
    noiseFilter.Q.setValueAtTime(2.2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.02);

    // --- 3. Sub-Acoustic Body Thud ---
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110 * scale, now);
    subOsc.frequency.exponentialRampToValueAtTime(45 * scale, now + 0.035);

    subGain.gain.setValueAtTime(volume * 0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.045);
  } catch (err) {
    // Fail silently if audio isn't supported or allowed yet
  }
}

/**
 * Higher-pitch tactile tick for smaller interactive elements (pills, badges, pagination dots)
 */
export function playSoftClick(volume = 0.06) {
  playThock(1.35, volume);
}

/**
 * Deep bass thock for major interactive elements (cards, major action buttons, search bar)
 */
export function playDeepThock(volume = 0.1) {
  playThock(0.88, volume);
}
