// Enharmonic spelling — chooses sharp or flat names based on the active key.
// Jazz convention: G/D/A/E/B/F# major all use sharp names; others flat.

export const FLAT_NAMES  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
export const SHARP_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

// Legacy alias — default to flat spelling when no key is selected
export const NOTE_NAMES = FLAT_NAMES;

// Sharp-preferring major keys, indexed by pitch class of the tonic
const SHARP_MAJOR_PCS = new Set([7, 2, 9, 4, 11, 6]); // G, D, A, E, B, F#

export function getKeySpellingPref(keyPC, scaleType) {
  if (keyPC === null || keyPC === undefined) return "flat";
  // A melodic-minor key shares its key signature with the relative major
  // (a minor third above)
  const relMajor = scaleType === "melodicMinor" ? (keyPC + 3) % 12 : keyPC;
  return SHARP_MAJOR_PCS.has(relMajor) ? "sharp" : "flat";
}

export function spellNote(pc, keyPC, scaleType) {
  return getKeySpellingPref(keyPC, scaleType) === "sharp"
    ? SHARP_NAMES[pc]
    : FLAT_NAMES[pc];
}
