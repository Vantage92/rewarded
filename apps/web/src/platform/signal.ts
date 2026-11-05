// End signal (UX §4.2 step 5, F3e): a short soft tone and, on Android, a short vibration when the
// tone is on. The tap on [Begin] unlocks the AudioContext, because browsers only play sound after a
// user gesture. The result goes into the end report as `signal_played`.

export interface EndSignal {
  /** Call inside the [Begin] tap: creates/resumes the AudioContext. */
  unlock(): void;
  /** Plays the tone (and vibration). Resolves with what actually happened. */
  play(tone: boolean): Promise<{ played: boolean; vibrated: boolean }>;
}

type AudioCtor = typeof AudioContext;

export function createEndSignal(): EndSignal {
  let ctx: AudioContext | null = null;
  const Ctor = (): AudioCtor | undefined =>
    typeof window === 'undefined' ? undefined : (window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioCtor }).webkitAudioContext);
  return {
    unlock() {
      try {
        const C = Ctor();
        if (!C) return;
        ctx ??= new C();
        if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
      } catch {
        ctx = null;
      }
    },
    async play(tone) {
      let played = false;
      let vibrated = false;
      if (tone && ctx) {
        try {
          if (ctx.state === 'suspended') await ctx.resume();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 660;
          const t = ctx.currentTime;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.2, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 1.3);
          played = ctx.state === 'running';
        } catch {
          played = false;
        }
      }
      if (tone && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          vibrated = navigator.vibrate(200);
        } catch {
          vibrated = false;
        }
      }
      return { played, vibrated };
    },
  };
}
