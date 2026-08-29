'use client';

/**
 * Resursee Studio Web Audio Engine (Ultra-Reliable High-Fidelity Mechanical Thock)
 *
 * Robust zero-latency audio engine engineered to overcome browser autoplay policies,
 * suspension states, and rapid hovering transitions.
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
let isSoundEnabled = true;
let isUnlocked = false;

// Active voice gains for smooth cross-fading
const activeVoiceGains: GainNode[] = [];

/**
 * Initialize / retrieve AudioContext with automatic unlock and resume handlers
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioContextClass) {
      audioCtx = new AudioContextClass({ latencyHint: 'interactive' });

      // Master dynamics compressor (smooth limiter to prevent clipping)
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-3, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(4, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(6, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.001, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.025, audioCtx.currentTime);

      // Master output gain
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(1.15, audioCtx.currentTime);

      masterCompressor.connect(masterGain);
      masterGain.connect(audioCtx.destination);
    }
  }

  // Always attempt to resume if suspended
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Warm up and unlock browser audio hardware permanently on first interaction
 */
export function unlockAudioEngine() {
  if (isUnlocked && audioCtx && audioCtx.state === 'running') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      isUnlocked = true;
    }).catch(() => {});
  } else if (ctx.state === 'running') {
    isUnlocked = true;
  }

  // Play an inaudible 1-sample buffer to force the browser audio pipeline to spin up
  try {
    const silentBuffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(ctx.destination);
    source.start(0);
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
 * Synthesizes a punchy, tactile mechanical keyboard "thock"
 * @param pitchMultiplier - pitch scaling factor (0.8 = deep thock, 1.2 = light switch click)
 * @param volume - audible loudness (0.2 - 0.4)
 */
export function playThock(pitchMultiplier = 1.0, volume = 0.32) {
  if (!isSoundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx || !masterCompressor) return;

    // If suspended, resume and play immediately upon resolution
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        executeThockSynthesis(ctx, pitchMultiplier, volume);
      }).catch(() => {});
      return;
    }

    executeThockSynthesis(ctx, pitchMultiplier, volume);
  } catch {
    // Fail silently without blocking UI
  }
}

function executeThockSynthesis(ctx: AudioContext, pitchMultiplier: number, volume: number) {
  try {
    const now = ctx.currentTime;

    // Smoothly fade out previous voice to prevent voice stacking and digital distortion
    while (activeVoiceGains.length > 0) {
      const prevGain = activeVoiceGains.pop();
      if (prevGain) {
        try {
          prevGain.gain.cancelScheduledValues(now);
          prevGain.gain.setValueAtTime(prevGain.gain.value, now);
          prevGain.gain.linearRampToValueAtTime(0.0001, now + 0.003);
        } catch {
          // ignore
        }
      }
    }

    // Voice Gain Node
    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(1.0, now);
    voiceGain.connect(masterCompressor!);
    activeVoiceGains.push(voiceGain);

    setTimeout(() => {
      const idx = activeVoiceGains.indexOf(voiceGain);
      if (idx !== -1) activeVoiceGains.splice(idx, 1);
    }, 60);

    // Natural micro-pitch variation (±3%)
    const randomPitch = 1 + (Math.random() * 0.06 - 0.03);
    const scale = pitchMultiplier * randomPitch;

    // --- 1. Deep Mechanical Bottom-Out Thump (Triangle wave) ---
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const oscFilter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    const startFreq = 260 * scale;
    const endFreq = 65 * scale;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + 0.036);

    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(650, now);
    oscFilter.Q.setValueAtTime(2.0, now);

    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(volume * 1.25, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    oscGain.gain.linearRampToValueAtTime(0, now + 0.043);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(voiceGain);

    osc.start(now);
    osc.stop(now + 0.045);

    // --- 2. Keycap Stem Click (Noise transient tap) ---
    const noiseLength = Math.floor(ctx.sampleRate * 0.005); // 5ms
    const noiseBuf = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);

    for (let i = 0; i < noiseLength; i++) {
      const progress = i / noiseLength;
      noiseData[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * progress) * (1 - progress);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1300 * scale, now);
    noiseFilter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);
    noiseGain.gain.linearRampToValueAtTime(0, now + 0.012);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(voiceGain);

    noise.start(now);
    noise.stop(now + 0.015);

    // --- 3. Sub-Acoustic Body Resonance (Sine wave) ---
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(125 * scale, now);
    subOsc.frequency.exponentialRampToValueAtTime(45 * scale, now + 0.032);

    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(volume * 0.95, now + 0.002);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    subGain.gain.linearRampToValueAtTime(0, now + 0.038);

    subOsc.connect(subGain);
    subGain.connect(voiceGain);

    subOsc.start(now);
    subOsc.stop(now + 0.04);
  } catch {
    // Ignore audio rendering errors
  }
}

/**
 * Soft tick for smaller tags, links, and pill items
 */
export function playSoftClick(volume = 0.22) {
  playThock(1.28, volume);
}

/**
 * Deep, heavy mechanical thock for large cards, buttons, and search inputs
 */
export function playDeepThock(volume = 0.35) {
  playThock(0.85, volume);
}
