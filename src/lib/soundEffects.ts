'use client';

/**
 * Resursee 3D Spatial Mechanical Thock Sound Engine
 *
 * Inspired by DomoDomo (domodomo.site).
 * Synthesizes deep, creamy mechanical keyboard "thock" tactile audio effects
 * with real-time Left/Right 3D binaural stereo panning based on cursor and screen positions,
 * organic micro-pitch variance (±3%), and zero-latency Web Audio playback.
 * Hardened against browser autoplay policies and Safari WebKit restrictions.
 */

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let noiseBufferSampleRate: number | null = null;
let masterGain: GainNode | null = null;
let isSoundEnabled = true;
let isHardwareUnlocked = false;
let currentSpatialPan = 0; // -0.85 (hard left) to +0.85 (hard right)

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
      masterGain.gain.setValueAtTime(0.42, audioCtx.currentTime);
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

/**
 * Update the global 3D spatial audio pan (-0.85 to +0.85)
 */
export function setSpatialPan(pan: number) {
  currentSpatialPan = Math.max(-0.85, Math.min(0.85, pan));
}

export function getSpatialPan(): number {
  return currentSpatialPan;
}

/**
 * Calculate spatial stereo pan (-0.85 to +0.85) from mouse horizontal clientX coordinate
 */
export function calculatePanFromClientX(clientX?: number): number {
  if (typeof window === 'undefined' || !clientX || window.innerWidth <= 0) return 0;
  const ratio = clientX / window.innerWidth;
  return Math.max(-0.85, Math.min(0.85, (ratio - 0.5) * 1.7));
}

/**
 * Calculate spatial stereo pan (-0.85 to +0.85) from an element bounding box and/or clientX
 */
export function calculatePanFromElement(element?: Element | null, clientX?: number): number {
  if (typeof window === 'undefined') return 0;
  if (clientX !== undefined && clientX > 0 && window.innerWidth > 0) {
    const ratio = clientX / window.innerWidth;
    return Math.max(-0.85, Math.min(0.85, (ratio - 0.5) * 1.7));
  }
  if (element && typeof element.getBoundingClientRect === 'function' && window.innerWidth > 0) {
    const rect = element.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const ratio = midX / window.innerWidth;
    return Math.max(-0.85, Math.min(0.85, (ratio - 0.5) * 1.7));
  }
  return currentSpatialPan;
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
 * Play the rich, satisfying mechanical switch "Thock" with 3D Spatial Stereo Panning
 * @param pitchMultiplier - fine-tune base frequency (0.88 = deeper, 1.35 = higher)
 * @param volume - master volume (0.22 - 0.42 is loud & punchy)
 * @param pan - spatial stereo position (-0.85 left ear to +0.85 right ear, defaults to current cursor position)
 * @returns boolean - true if audio was dispatched, false if blocked or muted
 */
export function playThock(pitchMultiplier = 1.0, volume = 0.35, pan?: number): boolean {
  if (!isSoundEnabled) return false;

  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    // If suspended or interrupted, resume immediately and play the thock as soon as resumed
    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      ctx.resume().then(() => {
        warmupHardware(ctx);
        if (ctx.state === 'running') {
          executeSpatialThock(ctx, pitchMultiplier, volume, pan);
        }
      }).catch(() => {});
      return true;
    }

    if (ctx.state === 'running') {
      executeSpatialThock(ctx, pitchMultiplier, volume, pan);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function executeSpatialThock(
  ctx: AudioContext,
  pitchMultiplier: number,
  volume: number,
  pan?: number
) {
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

    // Determine target spatial pan (-0.85 to +0.85)
    const targetPan = pan !== undefined
      ? Math.max(-0.85, Math.min(0.85, pan))
      : currentSpatialPan;

    // Voice Master Gain Node
    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(1.0, now);

    // 3D Spatial Stereo Panner (DomoDomo style)
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(targetPan, now);
      voiceGain.connect(panner);
      panner.connect(masterGain || ctx.destination);
    } else {
      voiceGain.connect(masterGain || ctx.destination);
    }

    activeVoiceGains.push(voiceGain);

    setTimeout(() => {
      const idx = activeVoiceGains.indexOf(voiceGain);
      if (idx !== -1) activeVoiceGains.splice(idx, 1);
      try {
        voiceGain.disconnect();
      } catch {
        // ignore
      }
    }, 85);

    // Organic micro-pitch variance (±3% acoustic shift to prevent ear fatigue)
    const microPitchShift = 1 + (Math.random() - 0.5) * 0.06;
    const scale = pitchMultiplier * microPitchShift;

    // --- 1. Low-End Body Thump (Creamy mechanical bottom-out) ---
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'triangle';
    const startFreq = 205 * scale;
    const endFreq = 28 * scale;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + 0.048);

    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(volume * 1.25, now + 0.003);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.052);

    // Resonant Lowpass Filter (DomoDomo Q=3.2 signature resonance)
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(650, now);
    lowFilter.Q.setValueAtTime(3.2, now);

    osc.connect(lowFilter);
    lowFilter.connect(oscGain);
    oscGain.connect(voiceGain);

    osc.start(now);
    osc.stop(now + 0.055);

    // --- 2. Keycap Stem Impact Transient (Crisp tactile tap) ---
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(950 * scale, now);
    noiseFilter.Q.setValueAtTime(2.2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(voiceGain);

    noise.start(now);
    noise.stop(now + 0.02);

    // --- 3. Sub-Acoustic Body Thud (Chest resonance) ---
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(115 * scale, now);
    subOsc.frequency.exponentialRampToValueAtTime(38 * scale, now + 0.04);

    subGain.gain.setValueAtTime(volume * 0.85, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    subOsc.connect(subGain);
    subGain.connect(voiceGain);

    subOsc.start(now);
    subOsc.stop(now + 0.05);
  } catch {
    // Fail silently if audio isn't supported
  }
}

/**
 * Higher-pitch tactile tick for smaller interactive elements (pills, badges, pagination dots)
 */
export function playSoftClick(volume = 0.28, pan?: number): boolean {
  return playThock(1.35, volume, pan);
}

/**
 * Deep bass thock for major interactive elements (cards, major action buttons, search bar)
 */
export function playDeepThock(volume = 0.42, pan?: number): boolean {
  return playThock(0.88, volume, pan);
}
