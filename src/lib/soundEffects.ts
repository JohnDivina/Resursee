'use client';

/**
 * Resursee Studio Audio Engine (Bulletproof Mechanical Thock Synthesizer)
 *
 * Combines low-latency Web Audio API real-time synthesis with instant-ready
 * pre-rendered PCM buffers to guarantee 100% reliable audible playback on all browsers.
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isSoundEnabled = true;
let hasUnlocked = false;

// Pre-rendered AudioBuffers for instantaneous zero-latency playback
let preRenderedThockBuffer: AudioBuffer | null = null;
let preRenderedDeepThockBuffer: AudioBuffer | null = null;
let preRenderedClickBuffer: AudioBuffer | null = null;

/**
 * Get or create the master AudioContext
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        audioCtx = new AudioContextClass({ latencyHint: 'interactive' });
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);

        // Pre-render acoustic switch buffers
        generatePreRenderedBuffers(audioCtx);
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

/**
 * Pre-synthesizes high-fidelity PCM audio buffers into memory for zero-delay playback
 */
function generatePreRenderedBuffers(ctx: AudioContext) {
  try {
    preRenderedThockBuffer = createThockBuffer(ctx, 1.0, 0.085);
    preRenderedDeepThockBuffer = createThockBuffer(ctx, 0.78, 0.095);
    preRenderedClickBuffer = createThockBuffer(ctx, 1.35, 0.065);
  } catch {
    // ignore
  }
}

function createThockBuffer(ctx: AudioContext, pitchScale: number, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate || 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-t * (40 / pitchScale));

    // 1. Bottom-out mechanical switch drop
    const freq = 240 * pitchScale * Math.exp(-t * 28) + 55 * pitchScale;
    const thump = Math.sin(2 * Math.PI * freq * t) * decay;

    // 2. Keycap stem snap transient
    const noiseDecay = Math.exp(-t * 160);
    const noise = (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * (1350 * pitchScale) * t) * noiseDecay;

    // 3. Acoustic body resonance
    const body = Math.sin(2 * Math.PI * (80 * pitchScale) * t) * Math.exp(-t * 30);

    const sample = (thump * 0.65 + noise * 0.35 + body * 0.4) * 0.85;
    data[i] = Math.max(-1, Math.min(1, sample));
  }

  return buffer;
}

/**
 * Force unlock AudioContext on any user gesture (pointer/click/touch/key)
 */
export function unlockAudioEngine() {
  if (hasUnlocked && audioCtx && audioCtx.state === 'running') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        hasUnlocked = true;
      }).catch(() => {});
    } else {
      hasUnlocked = true;
    }
  } catch {
    // ignore
  }
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
 * Play a rich tactile mechanical "Thock"
 * @param pitchMultiplier - pitch scaling (1.0 = standard, 0.8 = deep thock, 1.3 = soft click)
 * @param volume - volume level (0.2 to 0.6)
 */
export function playThock(pitchMultiplier = 1.0, volume = 0.38) {
  if (!isSoundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // If context is still suspended, try resuming and play
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        triggerPlayback(ctx, pitchMultiplier, volume);
      }).catch(() => {});
      return;
    }

    triggerPlayback(ctx, pitchMultiplier, volume);
  } catch {
    // Ignore audio rendering errors
  }
}

function triggerPlayback(ctx: AudioContext, pitchMultiplier: number, volume: number) {
  try {
    // Method 1: Use Pre-rendered Buffer with playbackRate for zero latency
    let bufferToUse = preRenderedThockBuffer;
    if (pitchMultiplier <= 0.85) bufferToUse = preRenderedDeepThockBuffer;
    else if (pitchMultiplier >= 1.25) bufferToUse = preRenderedClickBuffer;

    if (!bufferToUse) {
      generatePreRenderedBuffers(ctx);
      bufferToUse = preRenderedThockBuffer;
    }

    if (bufferToUse) {
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = bufferToUse;
      // Slight pitch variation (±2%)
      source.playbackRate.value = pitchMultiplier * (1 + (Math.random() * 0.04 - 0.02));

      // Instant attack, clean volume
      gainNode.gain.setValueAtTime(volume * 1.3, ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(ctx.currentTime);
      return;
    }

    // Method 2: Fallback Real-time Synthesis
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(55 * pitchMultiplier, now + 0.04);

    // Instant attack at t=now, exponential decay
    gain.gain.setValueAtTime(volume * 1.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Fail silently
  }
}

/**
 * Soft tick for pills, small badges, and tags
 */
export function playSoftClick(volume = 0.28) {
  playThock(1.3, volume);
}

/**
 * Deep heavy mechanical thock for large cards, buttons, and search inputs
 */
export function playDeepThock(volume = 0.42) {
  playThock(0.8, volume);
}
