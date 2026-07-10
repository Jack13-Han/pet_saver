/**
 * audioManager.js - Web Audio API synthesizer for Pet Saver
 * Plays game-style sound effects using pure browser synthesis (no audio files needed).
 * Checks localStorage notification_preferences.sound_effects before playing.
 */

function isSoundEnabled() {
  try {
    const prefs = JSON.parse(localStorage.getItem("notification_preferences") || "{}");
    return prefs.sound_effects !== false; // default on if not set
  } catch {
    return true;
  }
}

function getAudioContext() {
  if (!window.__petSaverAudioCtx) {
    window.__petSaverAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window.__petSaverAudioCtx;
}

/**
 * Plays a retro arcade coin chime sound on saving.
 */
export function playCoinSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const freqs = [880, 1320];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.18, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.18);
    });
  } catch {}
}

/**
 * Plays a soft bubble pop for pet care actions.
 */
export function playCareSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {}
}

/**
 * Plays a happy victory fanfare for achievement unlocks and goal completions.
 */
export function playFanfareSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const melody = [523, 659, 784, 1047]; // C5 E5 G5 C6
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.22, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.22);
    });
  } catch {}
}

/**
 * Plays a soft warning buzz for streak alerts.
 */
export function playWarningSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    [0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now + offset);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.12, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  } catch {}
}
