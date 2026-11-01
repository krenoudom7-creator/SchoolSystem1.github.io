/**
 * Synthesizes a natural, pleasant bell chime using the browser Web Audio API.
 * ដំណើរការសំឡេងរោទ៍កណ្ដឹងធម្មជាតិ និងទាក់ទាញដោយមិនបាច់ទាញយក file សំឡេងពីក្រៅ
 */
export function playBellChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Helper for pure sine chime tones
    const playTone = (freq: number, start: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Bright, crisp resonant bell chord (E6, B6, E7 harmonics)
    playTone(1318.51, now, 0.75, 0.18);
    playTone(1975.53, now + 0.06, 0.9, 0.12);
    playTone(2637.02, now + 0.12, 1.1, 0.08);
  } catch {
    // Audio context may be restricted before initial user gesture
  }
}
