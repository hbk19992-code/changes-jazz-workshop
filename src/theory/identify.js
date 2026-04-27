// Any-chord namer: given a fret array, find the most compact jazz name.
// Works for any combination of notes — extensions, alterations, additions,
// omissions, slash bass, rootless voicings — never returns "unknown".

import { OPEN_STRINGS, INTERVAL_LABELS, sortAlterations } from "../constants.js";
import { spellNote } from "./spelling.js";
import {
  categorizeChord,
  applySymbolPreferences,
  detectInversion,
} from "./category.js";

// Interpret a set of pitch classes as a chord with a given root.
// Returns the quality + alterations + additions + omissions + score.
function interpretRoot(rootPC, pcs) {
  const iset = new Set(pcs.map((pc) => (pc - rootPC + 12) % 12));
  const h = {
    R: iset.has(0),   b9: iset.has(1),   n9: iset.has(2),
    b3: iset.has(3),  n3: iset.has(4),   n11: iset.has(5),
    b5: iset.has(6),  n5: iset.has(7),   s5: iset.has(8),
    n13: iset.has(9), b7: iset.has(10),  M7: iset.has(11),
  };

  let quality = "";
  let alterations = [];
  const additions = [];
  const omissions = [];
  let score = 0;

  const hasMajThird = h.n3;
  const hasMinThird = h.b3;
  const hasThird = hasMajThird || hasMinThird;
  const hasSharp9 = hasMajThird && hasMinThird;
  const hasSeventh = h.M7 || h.b7;

  // ---- No third: sus / power / bare ----
  if (!hasThird) {
    const hasSus4 = h.n11;
    const hasSus2 = h.n9 && !h.n11;

    if (hasSus4) {
      if (h.M7) quality = "maj7sus4";
      else if (h.b7) quality = "7sus4";
      else quality = "sus4";
      if (h.n9) additions.push("9");
      if (h.n13) {
        if (h.b7) {
          quality = "13sus4";
          const idx = additions.indexOf("9");
          if (idx >= 0) additions.splice(idx, 1);
        } else additions.push("13");
      }
      if (h.b9) alterations.push("♭9");
      if (h.b5) alterations.push("♭5");
      if (h.s5) alterations.push("♯5");
    } else if (hasSus2) {
      if (h.M7) quality = "maj7sus2";
      else if (h.b7) quality = "7sus2";
      else quality = "sus2";
      if (h.n13) additions.push("13");
      if (h.b9) alterations.push("♭9");
      if (h.b5) alterations.push("♭5");
      if (h.s5) alterations.push("♯5");
    } else {
      if (h.n5 && !hasSeventh && !h.n13 && !h.b5 && !h.s5 && !h.b9) {
        quality = "5";
      } else {
        if (h.M7) quality = "maj7";
        else if (h.b7) quality = "7";
        else if (h.n13) quality = "6";
        else quality = "";
        omissions.push("3");
        score += 2;
        if (h.b9) alterations.push("♭9");
        if (h.b5) alterations.push("♭5");
        if (h.s5) alterations.push("♯5");
      }
    }
  }

  // ---- Minor third only ----
  else if (hasMinThird && !hasMajThird) {
    const isDim7 =
      h.b5 && h.n13 && !hasSeventh && !h.n5 && !h.n9 && !h.n11;
    if (isDim7) quality = "°7";
    else if (h.b5 && h.b7) {
      if (h.n13 && h.n9) quality = "m13♭5";
      else quality = "m7♭5";
      if (h.n9 && quality === "m7♭5") additions.push("9");
      if (h.n11 && !quality.includes("11")) additions.push("11");
      if (h.n13 && !quality.includes("13")) additions.push("13");
    } else if (h.b5 && h.M7) {
      quality = "mMaj7";
      alterations.push("♭5");
    } else if (h.b5 && !hasSeventh) {
      if (h.n13) {
        quality = "°";
        additions.push("13");
      } else quality = "°";
    } else if (h.M7) {
      if (h.n13 && h.n9) quality = "mMaj13";
      else if (h.n9) quality = "mMaj9";
      else {
        quality = "mMaj7";
        if (h.n13) additions.push("13");
        if (h.n11) additions.push("11");
      }
    } else if (h.b7) {
      const has9 = h.n9,
        has11 = h.n11,
        has13 = h.n13;
      if (has13) quality = "m13";
      else if (has11 && has9) quality = "m11";
      else if (has9) quality = "m9";
      else quality = "m7";
      if (!has9 && has11 && quality === "m7") additions.push("11");
      if (has11 && quality === "m9") additions.push("11");
      if (has11 && quality === "m13") additions.push("11");
    } else if (h.n13) {
      if (h.n9) quality = "m6/9";
      else quality = "m6";
      if (h.n11 && quality === "m6") additions.push("11");
    } else {
      quality = "m";
      if (h.n9) additions.push("9");
      if (h.n11) additions.push("11");
    }

    if (h.b9) alterations.push("♭9");
    if (h.b5 && !quality.includes("♭5") && !quality.includes("°"))
      alterations.push("♭5");
    if (h.s5) alterations.push("♯5");
  }

  // ---- Major third (possibly with m3 = ♯9) ----
  else {
    const has_n5 = h.n5;
    const has_b5 = h.b5 && !has_n5;
    const has_s5 = h.s5 && !has_n5;
    const has_sharp11 = h.b5 && has_n5;
    const has_b13 = h.s5 && has_n5;

    if (h.M7) {
      if (h.n13) quality = "maj13";
      else if (h.n9) quality = "maj9";
      else quality = "maj7";
      if (quality === "maj7" && h.n11) additions.push("11");
      if (quality === "maj9" && h.n11) additions.push("11");
      if (quality === "maj13" && h.n11) additions.push("11");
      if (has_sharp11) alterations.push("♯11");
      if (has_b5) alterations.push("♭5");
      if (has_s5) alterations.push("♯5");
      if (has_b13) alterations.push("♭13");
    } else if (h.b7) {
      if (has_s5) {
        if (h.n9 && h.n13) quality = "13♯5";
        else if (h.n9) quality = "9♯5";
        else quality = "7♯5";
      } else if (has_b5) {
        if (h.n9) quality = "9♭5";
        else quality = "7♭5";
      } else {
        if (h.n13) quality = "13";
        else if (h.n11 && h.n9) quality = "11";
        else if (h.n9) quality = "9";
        else quality = "7";
        if (quality === "9" && h.n11) additions.push("11");
        if (quality === "13" && h.n11) additions.push("11");
      }
      if (h.b9) alterations.push("♭9");
      if (hasSharp9) alterations.push("♯9");
      if (has_sharp11) alterations.push("♯11");
      if (has_b13) alterations.push("♭13");
    } else if (h.n13) {
      if (h.n9) quality = "6/9";
      else quality = "6";
      if (h.n11) additions.push("11");
      if (has_sharp11) alterations.push("♯11");
      if (has_b5) alterations.push("♭5");
      if (has_s5 || has_b13) alterations.push("♯5");
      if (h.b9) alterations.push("♭9");
      if (hasSharp9) alterations.push("♯9");
    } else {
      if (has_s5) quality = "+";
      else quality = "";
      if (has_b5) alterations.push("♭5");
      if (has_sharp11) alterations.push("♯11");
      if (has_b13) alterations.push("♭13");
      if (h.n9 && h.n11) {
        additions.push("9");
        additions.push("11");
      } else if (h.n9) additions.push("9");
      else if (h.n11) additions.push("11");
      if (h.b9) alterations.push("♭9");
      if (hasSharp9) alterations.push("♯9");
    }
  }

  alterations = sortAlterations(alterations);

  // Centralized "no 5" — only for bare triads
  const hasExplicitFifth = h.n5 || h.b5 || h.s5;
  const hasExtensionOrSeventh =
    h.M7 || h.b7 || h.n13 || h.n9 || h.n11;
  const qualityHasFifthInfo = /[♯♭]5|°|\+/.test(quality);
  if (
    !hasExplicitFifth &&
    !hasExtensionOrSeventh &&
    !qualityHasFifthInfo &&
    quality !== "5"
  ) {
    omissions.push("5");
  }

  // Score — simpler = lower score = preferred
  score += alterations.length * 1.5;
  score += additions.length * 2;
  omissions.forEach((o) => {
    if (o === "5") score += 0.5;
    else if (o === "3") score += 2.5;
    else score += 2;
  });
  if (hasSharp9) score += 0.5;

  return { rootPC, quality, alterations, additions, omissions, score };
}

function formatQualityDisplay(quality, alterations, additions, omissions) {
  const totalMods = alterations.length + additions.length + omissions.length;
  if (totalMods === 0) return quality;
  const qualityHasAlteration = /[♯♭]/.test(quality);
  if (
    alterations.length === 1 &&
    additions.length === 0 &&
    omissions.length === 0 &&
    !qualityHasAlteration
  ) {
    return quality + alterations[0];
  }
  const parts = [
    ...alterations,
    ...additions.map((a) => "add" + a),
    ...omissions.map((o) => "no" + o),
  ];
  return quality + "(" + parts.join(",") + ")";
}

export function identifyChord(frets, opts = {}) {
  const {
    keyPC = null,
    scaleType = "major",
    useTriangle = false,
    useHalfDimSymbol = false,
  } = opts;
  const _spell = (pc) => spellNote(pc, keyPC, scaleType);

  const played = [];
  for (let i = 0; i < 6; i++) {
    const f = frets[i];
    if (f !== null && f !== undefined) {
      played.push({
        stringIdx: i,
        fret: f,
        pc: (OPEN_STRINGS[i] + f) % 12,
      });
    }
  }
  if (played.length === 0) return { type: "empty" };
  if (played.length === 1)
    return { type: "single", noteName: _spell(played[0].pc) };

  const playedPCs = new Set(played.map((p) => p.pc));
  const pcSet = [...playedPCs];
  const bassPC = played[0].pc;

  const candidates = [];
  for (let root = 0; root < 12; root++) {
    const r = interpretRoot(root, pcSet);
    const isPlayed = playedPCs.has(root);
    let finalScore = r.score;
    if (!isPlayed) finalScore += 5;
    if (root === bassPC) finalScore -= 1.5;
    r.rootless = !isPlayed;
    r.finalScore = finalScore;
    r.qualityDisplay = formatQualityDisplay(
      r.quality,
      r.alterations,
      r.additions,
      r.omissions
    );
    r.qualityDisplayStyled = applySymbolPreferences(
      r.qualityDisplay,
      useTriangle,
      useHalfDimSymbol
    );
    candidates.push(r);
  }
  candidates.sort((a, b) => a.finalScore - b.finalScore);
  const best = candidates[0];

  const isSlash = bassPC !== best.rootPC;
  const displayName =
    _spell(best.rootPC) +
    best.qualityDisplayStyled +
    (isSlash ? "/" + _spell(bassPC) : "");

  const intervals = played.map((p) => ({
    stringIdx: p.stringIdx,
    fret: p.fret,
    noteName: _spell(p.pc),
    interval: INTERVAL_LABELS[(p.pc - best.rootPC + 12) % 12] || "?",
  }));

  const bassInterval = INTERVAL_LABELS[(bassPC - best.rootPC + 12) % 12] || "?";
  const inversion = detectInversion(bassInterval);
  const category = categorizeChord(best.quality, best.alterations);

  const alts = [];
  const seen = new Set([displayName]);
  for (let i = 1; i < candidates.length && alts.length < 3; i++) {
    const c = candidates[i];
    if (c.finalScore > best.finalScore + 4) break;
    const altSlash = bassPC !== c.rootPC;
    const altName =
      _spell(c.rootPC) +
      c.qualityDisplayStyled +
      (altSlash ? "/" + _spell(bassPC) : "");
    if (!seen.has(altName)) {
      alts.push(altName);
      seen.add(altName);
    }
  }

  return {
    type: "chord",
    name: displayName,
    rootName: _spell(best.rootPC),
    qualityDisplay: best.qualityDisplayStyled,
    qualityRaw: best.qualityDisplay,
    rootPC: best.rootPC,
    bassPC,
    isSlash,
    rootless: best.rootless,
    bassName: _spell(bassPC),
    bassInterval,
    inversion,
    category,
    notes: pcSet.map((pc) => _spell(pc)),
    intervals,
    alternates: alts,
  };
}
