let audio: AudioContext | null = null;

function context() {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audio) audio = new Ctx();
  return audio;
}

export function unlockAudio() {
  const ctx = context();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(ctx: AudioContext, freq: number, when: number, duration: number, peak: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

export function playChime() {
  try {
    const ctx = context();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime + 0.02;
    tone(ctx, 329.63, now, 0.7, 0.025);
    tone(ctx, 659.25, now, 0.55, 0.05);
    tone(ctx, 880, now + 0.16, 0.7, 0.04);
  } catch {
    /* autoplay or audio graph failures stay silent */
  }
}
