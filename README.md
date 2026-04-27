# Changes — Jazz Chord Workshop

An interactive jazz chord identifier, voicing workshop, and progression sequencer
for guitarists. Tap notes on a fretboard, get the chord name (with jazz-correct
spelling and alterations), see recommended scales and substitutions, and build
chord progressions you can actually hear.

## Features

- **Tap-to-identify** — place notes anywhere on the fretboard, get a jazz-standard
  name. Handles any combination: extensions, alterations, additions, omissions,
  slash bass, rootless voicings.
- **Drag-scroll fretboard** — drag up or down to shift the visible window through
  the neck, up to fret 21.
- **Theory coach** — with a key selected: Roman-numeral analysis, secondary
  dominants, tritone sub, related ii, recommended scales with their actual notes.
- **Interval coloring** — dots color-coded by their role in the chord (R, 3, ♭7,
  extensions). Guide-tones mode fades everything except 3 and 7.
- **Enharmonic spelling** — sharp keys spell sharp, flat keys spell flat. Δ and ø
  symbol toggles for Real Book style.
- **Voicing library** — 20 curated drop-2, drop-3, shell, and altered voicings,
  filterable to a key.
- **Compare workspace** — save multiple voicings of the same chord and A/B them.
- **Progression sequencer** — build a chord loop with tempo control and real
  audio playback.
- **Album library** — save songs with chord progressions, key, status (Idea →
  Sketch → Demo → Finished), tags, BPM, notes. Auto Roman-numeral analysis,
  on-the-fly transposition, search, JSON export/import. Stored locally in the
  browser (`localStorage`) — no account needed.

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

## Project structure

```
src/
  main.jsx                      Vite entry
  App.jsx                       Top-level orchestration
  index.css                     Tailwind base
  constants.js                  Shared constants (tuning, intervals, colors)

  theory/
    spelling.js                 Enharmonic sharp/flat names
    identify.js                 Any-chord namer (the core algorithm)
    category.js                 Category classification, symbol swaps, inversion
    scales.js                   Scale database + recommendations
    functions.js                Roman numerals, tritone sub, related ii
    diatonic.js                 Diatonic chord generation, key filtering
    progression.js              Chord-name parsing, progression analysis, transposition

  data/
    voicings.js                 Curated voicing library (read-only)
    library.js                  Local song/progression repository (localStorage)

  hooks/
    useAudio.js                 WebAudio pluck synthesizer

  components/
    ToggleChip.jsx              Small on/off pill
    MiniDiagram.jsx             Non-interactive mini fretboard
    InteractiveFretboard.jsx    The tappable fretboard
    TheoryCoach.jsx             Scales, subs, function display
    ResultDisplay.jsx           Big chord-name readout
    CompareTab.jsx              Compare workspace
    SequencerTab.jsx            Step sequencer
    LibraryTab.jsx              Album library — songs, progressions, transposition
```

## How the chord naming works

Rather than matching against a fixed template library, the identifier treats
every possible root (all 12 pitch classes) as a hypothesis and builds the most
compact jazz name from the intervals present. It scores each hypothesis by
complexity (fewer alterations / additions / omissions = better), gives
played-bass roots a small bonus, and picks the lowest-scoring result. If the
bass isn't the root, the name gets a `/bass` suffix; if the root isn't played,
the result is tagged as a rootless voicing.

This means any combination of 2–6 notes gets a valid name, even unusual
voicings — Bill Evans rootless shapes, quartal stacks, altered dominants with
two tensions, inversions.

## Library data model

Songs are stored with the following shape:

```js
{
  id: "uuid",
  title: "Blue in Green",
  key: 0,                     // pitch class 0–11, or null
  keyName: "C",
  scaleType: "major",         // "major" | "melodicMinor"
  status: "Sketch",           // "Idea" | "Sketch" | "Demo" | "Finished"
  bpm: 80,
  instrument: "Jazz Guitar",
  tags: ["ballad", "modal"],
  notes: "Free-form text...",
  progressions: [
    {
      id: "uuid",
      label: "Verse",
      chords: ["Dm7", "G7", "Cmaj7"],
      voicings: [[null,5,7,5,6,null], ...],   // optional, parallel to chords
      romanOverride: [],                       // sparse user edits
    }
  ],
  createdAt, updatedAt
}
```

Romans are *computed* from chord names + key on every render via
`analyzeProgression()`. This means transposing is free — the same auto-romans
work for any key. User edits go into `romanOverride` (sparse array — only set
where overridden), so the auto-derived label survives if chords change.

The storage layer (`data/library.js`) is a thin async-Promise API on top of
`localStorage`. Swapping it for IndexedDB or Firestore later only requires
changing that one file.

## Tech stack

- React 18 + Vite 6
- Tailwind CSS 3 for styling
- Web Audio API for playback (no sample files)
- No external UI library — every component is hand-built SVG or Tailwind

## License

MIT — do whatever you want with it.
