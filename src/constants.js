// Shared constants for the whole app.
// Pitch-class indices: 0=C, 1=Db/C#, 2=D, ..., 11=B

// Open-string pitch classes, low → high (E A D G B e)
export const OPEN_STRINGS = [4, 9, 2, 7, 11, 4];

// Frequencies (Hz) of the open strings, used for audio playback
export const STRING_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

// Interval labels for display. Index = semitones above root.
// Note: 8 is shown as ♭13 and 9 as 13 (jazz-standard naming for 6th/♭6th
// when they appear above a 7th).
export const INTERVAL_LABELS = {
  0: "R",
  1: "♭9",
  2: "9",
  3: "♭3",
  4: "3",
  5: "11",
  6: "♭5",
  7: "5",
  8: "♭13",
  9: "13",
  10: "♭7",
  11: "Δ7",
};

// Order in which alterations appear inside a chord symbol (e.g. 7(♭9,♯11,♭13))
export const ALT_SORT_ORDER = ["♭5", "♭9", "♯9", "♯11", "♯5", "♭13"];

export const sortAlterations = (alts) =>
  [...alts].sort(
    (a, b) => ALT_SORT_ORDER.indexOf(a) - ALT_SORT_ORDER.indexOf(b)
  );

// Visual colors for fretboard dots, indexed by interval label
export const INTERVAL_COLORS = {
  R: "#6b1f2e",
  3: "#b7410e",
  "♭3": "#b7410e",
  5: "#4a5f3e",
  "♭5": "#3e5566",
  "♯5": "#3e5566",
  "♭7": "#7a5a2e",
  "Δ7": "#7a5a2e",
  9: "#8c6b3f",
  "♭9": "#8c6b3f",
  "♯9": "#8c6b3f",
  11: "#8c6b3f",
  "♯11": "#8c6b3f",
  13: "#8c6b3f",
  "♭13": "#8c6b3f",
  "?": "#1a0f08",
};

// Intervals considered "guide tones" in jazz voicing theory — the 3 & 7
export const GUIDE_TONES = new Set(["3", "♭3", "♭7", "Δ7"]);
