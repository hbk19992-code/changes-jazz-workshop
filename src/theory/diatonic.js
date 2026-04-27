// Diatonic chord generation for a key + scale-type (major / melodic minor).
// Also provides isInKey() used by the library filter.

import { OPEN_STRINGS } from "../constants.js";
import { spellNote, NOTE_NAMES } from "./spelling.js";
import { applySymbolPreferences } from "./category.js";

export const KEYS = NOTE_NAMES;

export const SCALE_TYPES = {
  major: {
    intervals: [0, 2, 4, 5, 7, 9, 11],
    qualities: ["maj7", "m7", "m7", "maj7", "7", "m7", "m7♭5"],
    romans: ["Imaj7", "ii7", "iii7", "IVmaj7", "V7", "vi7", "vii°7"],
  },
  melodicMinor: {
    intervals: [0, 2, 3, 5, 7, 9, 11],
    qualities: ["mMaj7", "m7", "+", "7", "7", "m7♭5", "m7♭5"],
    romans: ["i mMaj7", "ii7", "♭III+", "IV7", "V7", "vi°", "vii°"],
  },
};

export function diatonicChords(keyPC, scaleType, useTriangle = false, useHalfDimSymbol = false) {
  const scale = SCALE_TYPES[scaleType];
  return scale.intervals.map((iv, i) => {
    const rootPC = (keyPC + iv) % 12;
    const rootName = spellNote(rootPC, keyPC, scaleType);
    const quality = scale.qualities[i];
    const styledQuality = applySymbolPreferences(quality, useTriangle, useHalfDimSymbol);
    const roman = applySymbolPreferences(scale.romans[i], useTriangle, useHalfDimSymbol);
    return {
      root: rootName,
      rootPC,
      quality: styledQuality,
      name: rootName + styledQuality,
      roman,
      degree: i + 1,
    };
  });
}

// True if every fretted note belongs to the selected scale.
export function isInKey(frets, keyPC, scaleType) {
  const scaleNotes = new Set(
    SCALE_TYPES[scaleType].intervals.map((iv) => (keyPC + iv) % 12)
  );
  for (let i = 0; i < 6; i++) {
    const f = frets[i];
    if (f !== null && f !== undefined) {
      const pc = (OPEN_STRINGS[i] + f) % 12;
      if (!scaleNotes.has(pc)) return false;
    }
  }
  return true;
}
