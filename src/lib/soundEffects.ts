'use client';

/**
 * Resursee Web Audio Sound Engine (Original Mechanical Thock Formulation)
 *
 * Synthesizes deep, crisp mechanical keyboard "thock" tactile audio effects
 * with zero external assets, organic pitch randomization, and zero-latency playback.
 * Hardened against browser autoplay policies, Safari WebKit restrictions, and context suspension.
 */

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let noiseBufferSampleRate: number | null = null;
let masterGain: GainNode | null = null;
let isSoundEnabled = true;
let isHardwareUnlocked = false;

// Active voice gains to smoothly fade out overlapping notes during fast sweeps
const activeVoiceGains: GainNode[] = [];

/**
 * Safe accessor for AudioContext. Recreates context if dead or closed.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const isDead = !audioCtx || audioCtx.state === 'closed';

    if (isDead) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return null;

      audioCtx = new AudioContextClass();
      noiseBuffer = null;
      noiseBufferSampleRate = null;
      isHardwareUnlocked = false;

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
  } catch {
    // ignore
  }

  return audioCtx;
}

/**
 * Check if the Web Audio engine is currently running and unblocked
 */
export function isAudioReady(): boolean {
  return !!audioCtx && audioCtx.state === 'running';
}

// Generate small noise buffer for the tactile keycap collision transient
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBufferSampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }

  const bufferSize = Math.floor(ctx.sampleRate * 0.008); // 8ms transient noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Decaying white noise
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
  }

  noiseBuffer = buffer;
  noiseBufferSampleRate = ctx.sampleRate;
  return buffer;
}

export function setSoundEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('resursee-sound-enabled', enabled ? '1' : '0');
    } catch {
      // ignore quota errors in private browsing
    }
  }
}

export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem('resursee-sound-enabled');
    if (saved === null) return true;
    return saved === '1';
  } catch {
    return true;
  }
}

/**
 * Force unlock AudioContext on any user gesture (pointer/click/touch/key).
 * Plays a 1-sample silent buffer to unlock the audio output hardware on WebKit/Safari.
 */
export function unlockAudioEngine(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    // Resume suspended or Safari-interrupted context
    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      ctx.resume().then(() => {
        warmupHardware(ctx);
      }).catch(() => {});
    } else if (ctx.state === 'running') {
      warmupHardware(ctx);
      return true;
    }
  } catch {
    // ignore
  }

  return isAudioReady();
}

function warmupHardware(ctx: AudioContext) {
  if (!isHardwareUnlocked && ctx.state === 'running') {
    try {
      const silentBuf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = silentBuf;
      src.connect(ctx.destination);
      src.start(0);
      isHardwareUnlocked = true;
    } catch {
      // ignore
    }
  }
}

/**
 * Play the original rich, satisfying mechanical switch "Thock"
 * @param pitchMultiplier - fine-tune base frequency (0.88 = deeper, 1.35 = higher)
 * @param volume - master volume (0.22 - 0.32 is loud & punchy)
 * @returns boolean - true if audio was dispatched, false if blocked or muted
 */
export function playThock(pitchMultiplier = 1.0, volume = 0.08): boolean {
  if (!isSoundEnabled) return false;

  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    // If suspended or interrupted, try to resume in background without queueing delayed audio
    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      ctx.resume().then(() => {
        warmupHardware(ctx);
      }).catch(() => {});
      return false;
    }

    if (ctx.state !== 'running') {
      return false;
    }

    executeOriginalThock(ctx, pitchMultiplier, volume);
    return true;
  } catch {
    return false;
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
      try {
        voiceGain.disconnect();
      } catch {
        // ignore
      }
    }, 80);

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
export function playSoftClick(volume = 0.05): boolean {
  return playThock(1.35, volume);
}

/**
 * Deep bass thock for major interactive elements (cards, major action buttons, search bar)
 */
export function playDeepThock(volume = 0.10): boolean {
  return playThock(0.88, volume);
}
