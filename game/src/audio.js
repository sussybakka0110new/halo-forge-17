// Synthesised sound only: no audio files, no network, no autoplay. The context is created on the
// first key press or click, so a staged screenshot never makes noise.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (muted) return null;
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') context.resume();
    return context;
  }

  function tone(frequency, duration, type, volume, glide = 1) {
    const ctx = ensure();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * glide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }

  const sounds = {
    fire: () => tone(720, 0.09, 'triangle', 0.045, 1.7),
    hit: () => tone(320, 0.12, 'sawtooth', 0.05, 0.45),
    kill: () => tone(540, 0.16, 'triangle', 0.06, 1.9),
    leak: () => tone(180, 0.34, 'sawtooth', 0.09, 0.35),
    clear: () => {
      tone(523, 0.16, 'sine', 0.07, 1);
      setTimeout(() => tone(784, 0.22, 'sine', 0.07, 1), 110);
    },
    upgrade: () => tone(660, 0.2, 'triangle', 0.07, 1.5),
    over: () => tone(220, 0.5, 'sawtooth', 0.08, 0.4),
    win: () => {
      tone(523, 0.2, 'sine', 0.07, 1);
      setTimeout(() => tone(659, 0.2, 'sine', 0.07, 1), 120);
      setTimeout(() => tone(1046, 0.4, 'sine', 0.08, 1), 240);
    },
  };

  return {
    play(name) {
      if (!muted && sounds[name]) sounds[name]();
    },
    toggle() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
  };
}
