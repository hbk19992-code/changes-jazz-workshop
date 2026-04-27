// Scale database and per-category recommendations.
// Used by the Theory Coach to suggest what to play over each chord.

import { spellNote } from "./spelling.js";

export const SCALE_DB = {
  ionian:      { name: "Ionian",           intervals: [0,2,4,5,7,9,11],   mood: "natural major" },
  lydian:      { name: "Lydian",           intervals: [0,2,4,6,7,9,11],   mood: "brighter, ♯11" },
  majPent:     { name: "Major pentatonic", intervals: [0,2,4,7,9],        mood: "safe, sparse" },
  mixolydian:  { name: "Mixolydian",       intervals: [0,2,4,5,7,9,10],   mood: "default dominant" },
  lydDom:      { name: "Lydian ♭7",        intervals: [0,2,4,6,7,9,10],   mood: "bright dominant, ♯11" },
  altered:     { name: "Altered",          intervals: [0,1,3,4,6,8,10],   mood: "tension, resolution to I" },
  hwDim:       { name: "HW diminished",    intervals: [0,1,3,4,6,7,9,10], mood: "♭9/♯9/♯11/13" },
  wholeTone:   { name: "Whole tone",       intervals: [0,2,4,6,8,10],     mood: "dreamy, augmented" },
  dorian:      { name: "Dorian",           intervals: [0,2,3,5,7,9,10],   mood: "ii of major" },
  aeolian:     { name: "Aeolian",          intervals: [0,2,3,5,7,8,10],   mood: "natural minor" },
  phrygian:    { name: "Phrygian",         intervals: [0,1,3,5,7,8,10],   mood: "dark, ♭9" },
  melMin:      { name: "Melodic minor",    intervals: [0,2,3,5,7,9,11],   mood: "jazz minor" },
  harmMin:     { name: "Harmonic minor",   intervals: [0,2,3,5,7,8,11],   mood: "classical minor" },
  locrian:     { name: "Locrian",          intervals: [0,1,3,5,6,8,10],   mood: "half-dim default" },
  locrianNat2: { name: "Locrian ♮2",       intervals: [0,2,3,5,6,8,10],   mood: "modern half-dim" },
  whDim:       { name: "WH diminished",    intervals: [0,2,3,5,6,8,9,11], mood: "symmetric for °7" },
  augmented:   { name: "Augmented",        intervals: [0,3,4,7,8,11],     mood: "symmetric for +" },
};

// Maps each chord category (from categorizeChord) to a ranked list of scales.
export const SCALE_RECS = {
  maj:        ["ionian", "lydian", "majPent"],
  major6:     ["ionian", "lydian", "majPent"],
  majTriad:   ["ionian", "lydian", "majPent"],
  majSus:     ["ionian", "lydian"],
  dom:        ["mixolydian", "lydDom"],
  domSharp11: ["lydDom"],
  domSharp5:  ["wholeTone", "altered"],
  domFlat5:   ["wholeTone", "lydDom"],
  domAlt:     ["altered", "hwDim"],
  domSus:     ["mixolydian"],
  m7:         ["dorian", "aeolian", "phrygian"],
  m6:         ["melMin", "dorian"],
  mTriad:     ["dorian", "aeolian"],
  halfDim:    ["locrianNat2", "locrian"],
  dim:        ["locrian"],
  dim7:       ["whDim"],
  mMaj:       ["melMin", "harmMin"],
  aug:        ["wholeTone", "augmented"],
  sus:        ["mixolydian", "ionian"],
  power:      ["mixolydian", "majPent"],
};

export function suggestScales(category, rootPC, keyPC, scaleType) {
  const keys = SCALE_RECS[category] || SCALE_RECS.majTriad;
  return keys.map((k) => {
    const s = SCALE_DB[k];
    return {
      name: s.name,
      mood: s.mood,
      notes: s.intervals.map((iv) =>
        spellNote((rootPC + iv) % 12, keyPC, scaleType)
      ),
    };
  });
}
