// Functional-harmony analysis: Roman numerals, secondary dominants,
// tritone substitution, and related ii (ii → V preparation).

import { spellNote } from "./spelling.js";

// All chord categories that behave as dominants
export const DOMINANT_CATEGORIES = new Set([
  "dom", "domAlt", "domSharp5", "domFlat5", "domSharp11", "domSus",
]);

// Tritone substitution: V7 → ♭II7 (down a tritone). E.g. G7 → Db7.
export function getTritoneSub(rootPC, category, keyPC, scaleType) {
  if (!DOMINANT_CATEGORIES.has(category)) return null;
  return spellNote((rootPC + 6) % 12, keyPC, scaleType) + "7";
}

// Related ii for any dominant: a perfect 5th above (= P4 below) → ii7 of V.
// G7 → Dm7 (Dm7-G7 is the ii-V that targets Cmaj7).
export function getRelatedII(rootPC, category, keyPC, scaleType) {
  if (!DOMINANT_CATEGORIES.has(category)) return null;
  return spellNote((rootPC + 7) % 12, keyPC, scaleType) + "m7";
}

// Degrees of a major key — each with valid qualities for a diatonic hit.
const MAJOR_DEGREES = [
  { iv: 0,  roman: "I",    qualities: ["maj", "major6", "majTriad"] },
  { iv: 2,  roman: "ii",   qualities: ["m7", "mTriad"] },
  { iv: 4,  roman: "iii",  qualities: ["m7", "mTriad"] },
  { iv: 5,  roman: "IV",   qualities: ["maj", "major6", "majTriad"] },
  {
    iv: 7,
    roman: "V",
    qualities: [
      "dom", "domSus", "domSharp5", "domFlat5",
      "domAlt", "domSharp11", "majTriad",
    ],
  },
  { iv: 9,  roman: "vi",   qualities: ["m7", "mTriad"] },
  { iv: 11, roman: "vii°", qualities: ["halfDim", "dim", "dim7"] },
];

const MELMIN_DEGREES = [
  { iv: 0,  roman: "i",     qualities: ["mMaj", "mTriad"] },
  { iv: 2,  roman: "ii",    qualities: ["m7", "mTriad"] },
  { iv: 3,  roman: "♭III+", qualities: ["aug"] },
  { iv: 5,  roman: "IV7",   qualities: ["dom", "domSharp11"] },
  {
    iv: 7,
    roman: "V7",
    qualities: ["dom", "domAlt", "domSharp5", "domFlat5"],
  },
  { iv: 9,  roman: "vi°",   qualities: ["halfDim"] },
  { iv: 11, roman: "vii°",  qualities: ["halfDim", "dim7"] },
];

// Attempt to label the chord's function inside the chosen key.
// Returns { label, type } where type ∈ diatonic | secondary | substitution | borrowed.
// Returns null when no key is active.
export function getFunction(rootPC, category, keyPC, scaleType) {
  if (keyPC === null || keyPC === undefined) return null;
  const iv = (rootPC - keyPC + 12) % 12;
  const degreeTable = scaleType === "melodicMinor" ? MELMIN_DEGREES : MAJOR_DEGREES;

  // Direct diatonic match
  const direct = degreeTable.find(
    (d) => d.iv === iv && d.qualities.includes(category)
  );
  if (direct) return { label: direct.roman, type: "diatonic" };

  // Secondary dominant — V7 of another diatonic degree
  if (DOMINANT_CATEGORIES.has(category)) {
    const targetIv = (rootPC + 5 - keyPC + 12) % 12;
    const target = degreeTable.find((d) => d.iv === targetIv);
    if (target && target.roman !== "I" && target.roman !== "i") {
      return { label: `V7/${target.roman}`, type: "secondary" };
    }
    // Tritone sub of V (lands a tritone away from the key's V)
    const ttIv = (rootPC + 6 - keyPC + 12) % 12;
    if (ttIv === 7) return { label: "♭II7 (subV)", type: "substitution" };
  }

  // Fallback: modal/borrowed degree label
  const modalRoman = {
    0:"I", 1:"♭II", 2:"II",  3:"♭III", 4:"III",   5:"IV",
    6:"♭V/♯IV", 7:"V", 8:"♭VI", 9:"VI", 10:"♭VII", 11:"VII",
  };
  return { label: modalRoman[iv], type: "borrowed" };
}
