// Lightweight WebAudio engine.
// Synthesises a warm plucked tone by summing a triangle + two sine partials.
// No external samples → works offline and ships zero kB of audio.

import { useRef, useCallback } from "react";
import { STRING_FREQS } from "../constants.js";

export function useAudio() {
  const ctxRef = useRef(null);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    // iOS and Chrome autoplay policy: must resume after user gesture
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playNote = useCallback(
    (freq, when = 0, duration = 1.4, gain = 0.18) => {
      const ctx = ensureCtx();
      if (!ctx) return;
      const t0 = ctx.currentTime + when;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, t0);
      masterGain.gain.linearRampToValueAtTime(gain, t0 + 0.005);
      masterGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2500;
      lp.Q.value = 0.7;

      masterGain.connect(lp).connect(ctx.destination);

      [
        { mult: 1, amp: 1.0,  type: "triangle" },
        { mult: 2, amp: 0.35, type: "sine" },
        { mult: 3, amp: 0.12, type: "sine" },
      ].forEach(({ mult, amp, type }) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq * mult;
        const g = ctx.createGain();
        g.gain.value = amp;
        osc.connect(g).connect(masterGain);
        osc.start(t0);
        osc.stop(t0 + duration + 0.1);
      });
    },
    [ensureCtx]
  );

  const playChord = useCallback(
    (frets, strum = true) => {
      const ctx = ensureCtx();
      if (!ctx) return;
      const notes = [];
      for (let i = 0; i < 6; i++) {
        const f = frets[i];
        if (f !== null && f !== undefined) {
          const freq = STRING_FREQS[i] * Math.pow(2, f / 12);
          notes.push(freq);
        }
      }
      const strumDelay = strum ? 0.035 : 0;
      notes.forEach((f, idx) => playNote(f, idx * strumDelay, 1.6, 0.14));
    },
    [ensureCtx, playNote]
  );

  return { playNote, playChord, ensureCtx };
}
