// Classifies a chord quality string into a high-level category used for
// scale recommendations and functional analysis.
// Also contains display-symbol swaps (Δ / ø) and inversion detection.

export function categorizeChord(quality, alterations) {
  if (quality === "°7") return "dim7";
  if (quality === "°") return "dim";
  if (/m7♭5|m13♭5/.test(quality)) return "halfDim";
  if (/^mMaj/.test(quality)) return "mMaj";
  if (quality === "+") return "aug";
  if (quality === "5") return "power";

  if (/^maj/.test(quality)) {
    if (quality.includes("sus")) return "majSus";
    return "maj";
  }
  if (/^m6/.test(quality)) return "m6";
  if (/^m\d|^m$/.test(quality)) {
    if (quality === "m") return "mTriad";
    return "m7";
  }
  if (quality === "sus4" || quality === "sus2") return "sus";
  if (quality === "maj7sus2" || quality === "maj7sus4") return "majSus";
  if (/sus/.test(quality)) return "domSus";
  if (quality === "6" || quality === "6/9") return "major6";

  if (/^7|^9|^11|^13/.test(quality)) {
    const has_s11 = alterations.includes("♯11") || quality.includes("♯11");
    const has_b9  = alterations.includes("♭9")  || quality.includes("♭9");
    const has_s9  = alterations.includes("♯9")  || quality.includes("♯9");
    const has_s5  = alterations.includes("♯5")  || quality.includes("♯5");
    const has_b5  = alterations.includes("♭5")  || quality.includes("♭5");
    const has_b13 = alterations.includes("♭13") || quality.includes("♭13");

    if (has_b9 || has_s9 || has_b13) return "domAlt";
    if (has_s5 && has_b5) return "domAlt";
    if (has_s5) return "domSharp5";
    if (has_b5) return "domFlat5";
    if (has_s11) return "domSharp11";
    return "dom";
  }
  return "majTriad";
}

// Swap maj → Δ and m7♭5 → ø7 in a displayed quality
export function applySymbolPreferences(qualityDisplay, useTriangle, useHalfDimSymbol) {
  let q = qualityDisplay;
  if (useTriangle) {
    q = q.replace(/mMaj/g, "mΔ");
    q = q.replace(/maj/g, "Δ");
  }
  if (useHalfDimSymbol) {
    q = q.replace(/m7♭5/g, "ø7").replace(/m13♭5/g, "ø13");
  }
  return q;
}

// Label a chord's inversion from its bass interval.
// Non-chord-tone basses (9, 11, 13, etc.) return null.
export function detectInversion(bassInterval) {
  if (bassInterval === "R") return "Root position";
  if (bassInterval === "3" || bassInterval === "♭3") return "1st inversion";
  if (bassInterval === "5" || bassInterval === "♯5" || bassInterval === "♭5")
    return "2nd inversion";
  if (bassInterval === "♭7" || bassInterval === "Δ7") return "3rd inversion";
  return null;
}
