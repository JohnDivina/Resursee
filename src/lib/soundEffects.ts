'use client';

/**
 * Resursee Web Audio Sound Engine (Original Mechanical Thock Formulation)
 *
 * Synthesizes deep, crisp mechanical keyboard "thock" tactile audio effects
 * with zero external assets, organic pitch randomization, and zero-latency playback.
 */

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let masterGain: GainNode | null = null;
let isSoundEnabled = true;

// Active voice gains to smoothly fade out overlapping notes during fast sweeps
const activeVoiceGains: GainNode[] = [];

/**
 * Initialize or resume AudioContext lazily on user gesture
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }

  return audioCtx;
}

// Generate small noise buffer for the tactile keycap collision transient
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;

  const bufferSize = Math.floor(ctx.sampleRate * 0.008); // 8ms transient noise
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
 * Force unlock AudioContext on any user gesture (pointer/click/touch/key)
 */
export function unlockAudioEngine() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

/**
 * Play the original rich, satisfying mechanical switch "Thock"
 * @param pitchMultiplier - fine-tune base frequency (0.88 = deeper, 1.35 = higher)
 * @param volume - master volume (0.22 - 0.32 is loud & punchy)
 */
export function playThock(pitchMultiplier = 1.0, volume = 0.24) {
  if (!isSoundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        executeOriginalThock(ctx, pitchMultiplier, volume);
      }).catch(() => {});
      return;
    }

    executeOriginalThock(ctx, pitchMultiplier, volume);
  } catch {
    // Fail silently if audio isn't supported or allowed yet
  }
}

function executeOriginalThock(ctx: AudioContext, pitchMultiplier: number, volume: number) {
  try {
    const now = ctx.currentTime;

    // Smoothly fade out previous voice to prevent voice stacking and digital distortion
    while (activeVoiceGains.length > 0) {
      const prevGain = activeVoiceGains.pop();
      if (prevGain) {
        try {
          prevGain.gain.cancelScheduledValues(now);
          prevGain.gain.setValueAtTime(prevGain.gain.value, now);
          prevGain.gain.linearRampToValueAtTime(0.00001, now + 0.004);
        } catch {
          // ignore
        }
      }
    }

    // Voice Master Gain Node
    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(1.0, now);
    voiceGain.connect(masterGain || ctx.destination);
    activeVoiceGains.push(voiceGain);

    setTimeout(() => {
      const idx = activeVoiceGains.indexOf(voiceGain);
      if (idx !== -1) activeVoiceGains.splice(idx, 1);
    }, 60);

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
    oscGain.gain.linearRampToValueAtTime(volume * 1.2, now + 0.003);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

    // Lowpass Filter to warm up the bottom end
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(500, now);
    lowFilter.Q.setValueAtTime(1.5, now);

    osc.connect(lowFilter);
    lowFilter.connect(oscGain);
    oscGain.connect(voiceGain);

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
    noiseGain.connect(voiceGain);

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
    subGain.connect(voiceGain);

    subOsc.start(now);
    subOsc.stop(now + 0.045);
  } catch {
    // Fail silently if audio isn't supported
  }
}

/**
 * Higher-pitch tactile tick for smaller interactive elements (pills, badges, pagination dots)
 */
export function playSoftClick(volume = 0.16) {
  playThock(1.35, volume);
}

/**
 * Deep bass thock for major interactive elements (cards, major action buttons, search bar)
 */
export function playDeepThock(volume = 0.28) {
  playThock(0.88, volume);
}
