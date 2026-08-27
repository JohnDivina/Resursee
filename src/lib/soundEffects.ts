'use client';

/**
 * Resursee Studio Web Audio Engine
 * High-fidelity, zero-crack mechanical keyboard "thock" synthesizer.
 *
 * Features:
 * - Master Dynamics Compressor + Soft Limiter (prevents digital clipping & crackling on rapid multi-hovers)
 * - Anti-pop Cosine & Linear Fade Envelopes (zero DC offsets or abrupt oscillator cutoffs)
 * - Single-voice Polyphony Management (smooth voice stealing with 3ms crossfade)
 * - Auto-Unlock on any pointer movement, scroll, or gesture
 * - Natural acoustic micro-pitch variation (±4%)
 */

let audioCtx: AudioContext | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
let masterGain: GainNode | null = null;
let dcBlocker: BiquadFilterNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let isSoundEnabled = true;

// Active voice gain nodes to smoothly fade out on rapid overlapping hovers
const activeVoiceGains: GainNode[] = [];

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioContextClass) {
      audioCtx = new AudioContextClass({ latencyHint: 'interactive' });

      // 1. DC Blocker (Highpass at 25Hz to eliminate any sub-bass DC offset clicks)
      dcBlocker = audioCtx.createBiquadFilter();
      dcBlocker.type = 'highpass';
      dcBlocker.frequency.setValueAtTime(25, audioCtx.currentTime);

      // 2. Dynamics Compressor (Soft Limiter to eliminate cracking/distortion on overlapping hovers)
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-6, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(8, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(12, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.002, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.04, audioCtx.currentTime);

      // 3. Master Gain
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

      // Chain: Voice -> DC Blocker -> Compressor -> Master Gain -> Destination
      dcBlocker.connect(masterCompressor);
      masterCompressor.connect(masterGain);
      masterGain.connect(audioCtx.destination);
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// Generate smoothed noise buffer for tactile keycap collision (no harsh transients)
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;

  const length = Math.floor(ctx.sampleRate * 0.006); // 6ms
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const progress = i / length;
    // Windowed decay curve (Hanning window shape) to prevent boundary clicks
    const windowFactor = Math.sin(Math.PI * progress);
    data[i] = (Math.random() * 2 - 1) * windowFactor * Math.exp(-progress * 3);
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
 * Play a rich, punchy, tactile mechanical keyboard "Thock"
 * @param pitchMultiplier - pitch modifier (0.85 = deep thock, 1.2 = light tick)
 * @param volume - audible loudness (0.22 - 0.32 is loud & punchy)
 */
export function playThock(pitchMultiplier = 1, volume = 0.26) {
  if (!isSoundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx || !dcBlocker) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Smoothly fade out previous voice to prevent voice stacking and audio pops
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
    voiceGain.connect(dcBlocker);
    activeVoiceGains.push(voiceGain);

    // Clean up voice after duration
    setTimeout(() => {
      const idx = activeVoiceGains.indexOf(voiceGain);
      if (idx !== -1) activeVoiceGains.splice(idx, 1);
    }, 70);

    // Organic micro-pitch variation (±4%)
    const randomPitch = 1 + (Math.random() * 0.08 - 0.04);
    const scale = pitchMultiplier * randomPitch;

    // --- 1. Deep Mechanical Bottom-Out Thump (Triangle + Lowpass) ---
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const oscFilter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    const startFreq = 230 * scale;
    const endFreq = 70 * scale;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + 0.038);

    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(550, now);
    oscFilter.Q.setValueAtTime(1.8, now);

    // Smooth envelope: instant attack -> natural exponential decay -> zero
    oscGain.gain.setValueAtTime(0.00001, now);
    oscGain.gain.linearRampToValueAtTime(volume * 1.1, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);
    oscGain.gain.linearRampToValueAtTime(0, now + 0.045);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(voiceGain);

    osc.start(now);
    osc.stop(now + 0.048);

    // --- 2. Keycap Stem Tactile Click (Filtered noise tap) ---
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1100 * scale, now);
    noiseFilter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
    noiseGain.gain.linearRampToValueAtTime(0, now + 0.015);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(voiceGain);

    noise.start(now);
    noise.stop(now + 0.018);

    // --- 3. Deep Sub-Acoustic Body (Sine) ---
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(115 * scale, now);
    subOsc.frequency.exponentialRampToValueAtTime(50 * scale, now + 0.035);

    subGain.gain.setValueAtTime(0.00001, now);
    subGain.gain.linearRampToValueAtTime(volume * 0.85, now + 0.002);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
    subGain.gain.linearRampToValueAtTime(0, now + 0.042);

    subOsc.connect(subGain);
    subGain.connect(voiceGain);

    subOsc.start(now);
    subOsc.stop(now + 0.045);
  } catch {
    // Fail silently
  }
}

/**
 * Soft tick for smaller tags and pill items
 */
export function playSoftClick(volume = 0.18) {
  playThock(1.3, volume);
}

/**
 * Deep, heavy mechanical thock for large cards, modals, and search inputs
 */
export function playDeepThock(volume = 0.28) {
  playThock(0.88, volume);
}
