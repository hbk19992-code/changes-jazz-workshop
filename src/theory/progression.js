// Given a progression (array of chord-name strings) + key context,
// compute a Roman-numeral analysis using the existing function module.
// The user can override individual romans, but romanAuto is always recomputable
// from chords + key — so transposition stays trivial.

import { categorizeChord } from "../theory/category.js";
import { getFunction } from "../theory/functions.js";
import { FLAT_NAMES, SHARP_NAMES } from "../theory/spelling.js";

// Lookup tables for parsing chord names
const ROOT_TO_PC = (() => {
  const m = {};
  FLAT_NAMES.forEach((n, pc) => (m[n] = pc));
  SHARP_NAMES.forEach((n, pc) => (m[n] = pc));
  return m;
})();

// Parse a chord name like "Dm7", "Cmaj9", "G7♭9", "F#m7♭5", "Bb13", "C/E"
// → { rootPC, quality, bassPC?, alterations[] }
export function parseChordName(name) {
  if (!name) return null;
  const cleaned = name.trim().replace(/maj/i, "maj"); // normalize case
  const slashSplit = cleaned.split("/");
  const main = slashSplit[0];
  const bass = slashSplit[1];

  // Match root: A-G with optional accidental
  const rootMatch = main.match(/^([A-G])([b#♭♯])?(.*)$/);
  if (!rootMatch) return null;

  const noteLetter = rootMatch[1];
  const accidental = rootMatch[2] || "";
  const rest = rootMatch[3] || "";

  // Normalize accidentals to # or b
  const normAcc = accidental.replace(/♭/g, "b").replace(/♯/g, "#");
  const rootName = noteLetter + normAcc;
  const rootPC = ROOT_TO_PC[rootName];
  if (rootPC === undefined) return null;

  let bassPC = null;
  if (bass) {
    const bassMatch = bass.match(/^([A-G])([b#♭♯])?$/);
    if (bassMatch) {
      const bn = bassMatch[1] + (bassMatch[2] || "").replace(/♭/g, "b").replace(/♯/g, "#");
      bassPC = ROOT_TO_PC[bn];
    }
  }

  // Extract alterations from the quality string (anything in parens or trailing)
  const alterations = [];
  const altMatches = rest.matchAll(/[♭♯b#](5|9|11|13)/g);
  for (const m of altMatches) {
    const sym = m[0].replace(/b/, "♭").replace(/#/, "♯");
    alterations.push(sym);
  }

  // Strip Δ → maj and ø → m7♭5 so categorizeChord understands it.
  // ø7 already implies the 7, so collapse "m7♭57" → "m7♭5"; same for "13"
  let quality = rest.replace(/Δ/g, "maj").replace(/ø/g, "m7♭5");
  quality = quality.replace(/m7♭57(?!\d)/g, "m7♭5");  // ø7 → m7♭5
  quality = quality.replace(/m7♭513/g, "m13♭5");      // ø13 → m13♭5

  return { rootPC, quality, bassPC, alterations };
}

// Analyze a progression — returns array of roman labels parallel to input chords.
// Empty string for chords that can't be parsed or that fall outside the key.
export function analyzeProgression(chords, keyPC, scaleType = "major") {
  if (keyPC === null || keyPC === undefined) {
    // Without a key, just return empty placeholders — caller decides what to show
    return chords.map(() => "");
  }
  return chords.map((chordName) => {
    const parsed = parseChordName(chordName);
    if (!parsed) return "";
    const category = categorizeChord(parsed.quality, parsed.alterations);
    const fn = getFunction(parsed.rootPC, category, keyPC, scaleType);
    return fn ? fn.label : "";
  });
}

// Merge auto and override arrays: override wins where present
export function mergeRomans(romanAuto, romanOverride) {
  if (!romanOverride || romanOverride.length === 0) return romanAuto;
  return romanAuto.map((auto, i) => {
    const override = romanOverride[i];
    return override !== undefined && override !== null && override !== ""
      ? override
      : auto;
  });
}

// Transpose a chord-name array to a new key. Shifts every root by the
// interval between the old and new keys, preserves quality and bass.
export function transposeChords(chords, fromKeyPC, toKeyPC, useSharpSpelling = false) {
  if (fromKeyPC === null || toKeyPC === null) return chords;
  const shift = (toKeyPC - fromKeyPC + 12) % 12;
  const names = useSharpSpelling ? SHARP_NAMES : FLAT_NAMES;

  return chords.map((chordName) => {
    const parsed = parseChordName(chordName);
    if (!parsed) return chordName;
    const newRootPC = (parsed.rootPC + shift) % 12;
    let result = names[newRootPC] + parsed.quality;
    if (parsed.bassPC !== null) {
      const newBassPC = (parsed.bassPC + shift) % 12;
      result += "/" + names[newBassPC];
    }
    return result;
  });
}
