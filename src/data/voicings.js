// Curated jazz voicings used in the Voicing Library panel.
// Every voicing has been verified by the chord identifier — their display
// names come from identifyChord(), not these labels.

// shape: visual category the voicing belongs to (Drop 2, Drop 3, Shell, etc.)
// family: the underlying chord type this voicing illustrates

export const LIBRARY = [
  // Cmaj7 family
  { frets: [null, 3, 5, 4, 5, null],      shape: "Drop 2", family: "maj7" },
  { frets: [8, null, 9, 9, 8, null],      shape: "Drop 3", family: "maj7" },
  { frets: [null, 3, 2, 4, null, null],   shape: "Shell",  family: "maj7" },
  { frets: [null, 3, 2, 4, 3, null],      shape: "maj9",   family: "maj7" },

  // Dm7 family
  { frets: [null, 5, 7, 5, 6, null],      shape: "Drop 2", family: "m7" },
  { frets: [10, null, 10, 10, 10, null],  shape: "Drop 3", family: "m7" },
  { frets: [null, 5, 3, 5, null, null],   shape: "Shell",  family: "m7" },
  { frets: [null, 5, 3, 5, 5, null],      shape: "m9",     family: "m7" },

  // G7 family
  { frets: [null, 10, 12, 10, 12, null],  shape: "Drop 2", family: "7" },
  { frets: [3, null, 3, 4, 3, null],      shape: "Drop 3", family: "7" },
  { frets: [3, null, 3, 4, null, null],   shape: "Shell",  family: "7" },
  { frets: [3, null, 3, 4, 5, null],      shape: "13th",   family: "7" },

  // Altered dominants
  { frets: [3, null, 3, 4, 4, null],      shape: "7♯5",    family: "alt" },
  { frets: [3, null, 3, 4, 2, null],      shape: "7♭5",    family: "alt" },
  { frets: [3, null, 3, 4, 6, null],      shape: "7♯9",    family: "alt" },

  // Half-dim & dim
  { frets: [null, 2, 3, 2, 3, null],      shape: "m7♭5",   family: "dim" },
  { frets: [null, 4, 5, 4, 4, null],      shape: "m7♭5",   family: "dim" },

  // Open jazz favorites
  { frets: [null, 3, 2, 0, 0, 0],         shape: "Open",   family: "maj7" }, // Cmaj7
  { frets: [null, null, 0, 2, 1, 1],      shape: "Open",   family: "m7" },   // Dm7
  { frets: [3, 2, 0, 0, 0, 1],            shape: "Open",   family: "7" },    // G7
];
