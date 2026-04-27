// Storage adapter — talks to localStorage today, but the public API is
// designed so that a future Firestore/IndexedDB driver could replace it
// without changing any caller. All methods are async (Promise-returning)
// even though localStorage is synchronous, to keep the migration path easy.

const KEY_SONGS = "changes:songs:v1";
const KEY_META = "changes:meta:v1";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY_SONGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Library read failed:", err);
    return [];
  }
}

function writeAll(songs) {
  try {
    localStorage.setItem(KEY_SONGS, JSON.stringify(songs));
    localStorage.setItem(
      KEY_META,
      JSON.stringify({ updatedAt: new Date().toISOString(), count: songs.length })
    );
    return true;
  } catch (err) {
    console.error("Library write failed:", err);
    return false;
  }
}

// ---- Public API ----

export async function listSongs() {
  return readAll();
}

export async function getSong(id) {
  return readAll().find((s) => s.id === id) || null;
}

export async function saveSong(song) {
  const songs = readAll();
  const idx = songs.findIndex((s) => s.id === song.id);
  const now = new Date().toISOString();
  const stamped = {
    ...song,
    updatedAt: now,
    createdAt: song.createdAt || now,
  };
  if (idx >= 0) songs[idx] = stamped;
  else songs.push(stamped);
  writeAll(songs);
  return stamped;
}

export async function deleteSong(id) {
  const songs = readAll().filter((s) => s.id !== id);
  return writeAll(songs);
}

// Quick-save just a progression. If no songId is provided, creates a new
// "Untitled sketch" song to hold it. This is what the sequencer's
// "save this progression" button calls.
export async function quickSaveProgression(progression, songId = null) {
  const songs = readAll();
  let target;
  if (songId) {
    target = songs.find((s) => s.id === songId);
  }
  if (!target) {
    target = newSong({ title: "Untitled sketch", status: "Idea" });
    songs.push(target);
  }
  target.progressions = target.progressions || [];
  target.progressions.push(progression);
  target.updatedAt = new Date().toISOString();
  writeAll(songs);
  return { song: target, progression };
}

// Bulk export/import for backup
export async function exportLibrary() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    songs: readAll(),
  };
}

export async function importLibrary(data, mode = "merge") {
  if (!data || !Array.isArray(data.songs)) {
    throw new Error("Invalid library file");
  }
  if (mode === "replace") {
    writeAll(data.songs);
    return data.songs.length;
  }
  // merge: keep existing, add by id (incoming wins on conflict)
  const existing = readAll();
  const map = new Map(existing.map((s) => [s.id, s]));
  data.songs.forEach((s) => map.set(s.id, s));
  const merged = [...map.values()];
  writeAll(merged);
  return data.songs.length;
}

// ---- Factories ----

export function newSong(partial = {}) {
  const now = new Date().toISOString();
  return {
    id: cryptoId(),
    title: "Untitled",
    key: null,            // pitch class 0–11, or null
    keyName: null,        // displayed key name e.g. "C", "Bb"
    scaleType: "major",   // "major" | "melodicMinor"
    status: "Idea",       // "Idea" | "Sketch" | "Demo" | "Finished"
    bpm: null,
    instrument: "Jazz Guitar",
    genre: null,
    tags: [],
    progressions: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function newProgression(partial = {}) {
  return {
    id: cryptoId(),
    label: "",            // "Verse", "Chorus", "Bridge", or free text
    chords: [],           // array of chord-name strings, e.g. ["Dm7","G7","Cmaj7"]
    voicings: [],         // optional: array of frets[] arrays parallel to chords
    romanAuto: [],        // computed by analyzeProgression()
    romanOverride: [],    // sparse array; user-edited romans take precedence
    notes: "",
    ...partial,
  };
}

// Crypto-safe id when available, fallback to a timestamp+random for older browsers
function cryptoId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
