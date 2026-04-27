// Library tab — manages saved songs and their progressions.
// Loads from localStorage on mount and again whenever an external save
// happens (sequencer’s quick-save).

import { useState, useEffect, useMemo } from “react”;
import {
listSongs,
saveSong,
deleteSong,
newSong,
newProgression,
exportLibrary,
importLibrary,
} from “../data/library.js”;
import {
analyzeProgression,
mergeRomans,
transposeChords,
} from “../theory/progression.js”;
import { spellNote, FLAT_NAMES, SHARP_NAMES } from “../theory/spelling.js”;

const STATUS_OPTIONS = [“Idea”, “Sketch”, “Demo”, “Finished”];
const STATUS_COLORS = {
Idea: “#8a7560”,
Sketch: “#7a5a2e”,
Demo: “#b7410e”,
Finished: “#4a5f3e”,
};
const PROGRESSION_LABELS = [“Intro”, “Verse”, “Chorus”, “Bridge”, “Outro”, “Solo”];

export function LibraryTab({ refreshKey, onLoadProgression }) {
const [songs, setSongs] = useState([]);
const [search, setSearch] = useState(””);
const [statusFilter, setStatusFilter] = useState(“all”);
const [expandedId, setExpandedId] = useState(null);
const [editingId, setEditingId] = useState(null);

// Reload whenever this component is shown or refreshKey changes
useEffect(() => {
listSongs().then(setSongs);
}, [refreshKey]);

// Filter & search
const filtered = useMemo(() => {
let list = songs;
if (statusFilter !== “all”) {
list = list.filter((s) => s.status === statusFilter);
}
if (search.trim()) {
const q = search.toLowerCase();
list = list.filter((s) => {
if (s.title.toLowerCase().includes(q)) return true;
if (s.tags?.some((t) => t.toLowerCase().includes(q))) return true;
// Search inside chord names
return s.progressions?.some((p) =>
p.chords?.some((c) => c.toLowerCase().includes(q))
);
});
}
return […list].sort(
(a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
);
}, [songs, search, statusFilter]);

const reload = async () => setSongs(await listSongs());

const handleAddSong = async () => {
await saveSong(newSong({ title: “New song” }));
reload();
};

const handleDelete = async (id) => {
if (!confirm(“정말 삭제할까요?”)) return;
await deleteSong(id);
if (expandedId === id) setExpandedId(null);
reload();
};

const handleExport = async () => {
const data = await exportLibrary();
const blob = new Blob([JSON.stringify(data, null, 2)], {
type: “application/json”,
});
const url = URL.createObjectURL(blob);
const a = document.createElement(“a”);
a.href = url;
a.download = `changes-library-${new Date().toISOString().slice(0, 10)}.json`;
a.click();
URL.revokeObjectURL(url);
};

const handleImport = async (e) => {
const file = e.target.files?.[0];
if (!file) return;
try {
const text = await file.text();
const data = JSON.parse(text);
const mode = confirm(“기존 라이브러리에 병합할까요?\n취소하면 전체 교체됩니다.”)
? “merge”
: “replace”;
const count = await importLibrary(data, mode);
alert(`${count}개 곡을 ${mode === "merge" ? "병합" : "교체"}했습니다.`);
reload();
} catch (err) {
alert(“파일을 읽을 수 없습니다: “ + err.message);
}
e.target.value = “”; // allow re-importing same file
};

return (
<div className="space-y-5">
{/* Header */}
<div className="flex flex-wrap items-center justify-between gap-3">
<div>
<p className="text-[10px] tracking-[0.35em] uppercase text-[#6b1f2e]">
Album Library
</p>
<p className="text-sm text-[#6b5b4a] italic mt-1">
저장된 곡 {songs.length}개 · 코드 진행 라이브러리
</p>
</div>
<div className="flex gap-2">
<button
onClick={handleAddSong}
className=“px-3 py-1.5 border border-[#1a0f08] bg-[#1a0f08] text-[#fbf4e3] hover:bg-[#6b1f2e] text-xs tracking-widest uppercase transition-colors”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
+ 새 곡
</button>
<button
onClick={handleExport}
disabled={songs.length === 0}
className=“px-3 py-1.5 border border-[#1a0f08]/40 hover:border-[#1a0f08] disabled:opacity-30 text-xs tracking-widest uppercase”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
⬇ 내보내기
</button>
<label
className=“px-3 py-1.5 border border-[#1a0f08]/40 hover:border-[#1a0f08] text-xs tracking-widest uppercase cursor-pointer”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
⬆ 가져오기
<input
type="file"
accept="application/json"
onChange={handleImport}
className="hidden"
/>
</label>
</div>
</div>

```
  {/* Search + filter bar */}
  <div className="bg-[#fbf4e3] border border-[#1a0f08]/30 p-3 flex flex-wrap items-center gap-2">
    <input
      type="text"
      placeholder="곡 제목, 태그, 코드 검색…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="flex-1 min-w-[180px] bg-transparent border-b border-[#1a0f08]/40 focus:border-[#b7410e] outline-none px-1 py-1 text-sm"
      style={{ fontFamily: "'Fraunces', serif" }}
    />
    <div className="flex gap-1">
      <FilterChip
        label="All"
        active={statusFilter === "all"}
        onClick={() => setStatusFilter("all")}
      />
      {STATUS_OPTIONS.map((s) => (
        <FilterChip
          key={s}
          label={s}
          color={STATUS_COLORS[s]}
          active={statusFilter === s}
          onClick={() => setStatusFilter(s)}
        />
      ))}
    </div>
  </div>

  {/* Song list */}
  {filtered.length === 0 ? (
    <div className="relative">
      <div className="absolute inset-0 bg-[#1a0f08] translate-x-1.5 translate-y-1.5" />
      <div className="relative bg-[#fbf4e3] border border-[#1a0f08] p-12 text-center">
        <p
          className="text-xl italic text-[#6b5b4a]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {songs.length === 0 ? "라이브러리가 비어있어요" : "검색 결과 없음"}
        </p>
        {songs.length === 0 && (
          <p className="mt-3 text-sm text-[#8a7560]">
            "+ 새 곡" 버튼으로 시작하거나, 시퀀서에서 진행을 만들고 저장하세요.
          </p>
        )}
      </div>
    </div>
  ) : (
    <div className="space-y-3">
      {filtered.map((song) => (
        <SongCard
          key={song.id}
          song={song}
          expanded={expandedId === song.id}
          editing={editingId === song.id}
          onToggleExpand={() =>
            setExpandedId(expandedId === song.id ? null : song.id)
          }
          onEdit={() => setEditingId(song.id)}
          onCancelEdit={() => setEditingId(null)}
          onSave={async (updated) => {
            await saveSong(updated);
            setEditingId(null);
            reload();
          }}
          onDelete={() => handleDelete(song.id)}
          onLoadProgression={onLoadProgression}
        />
      ))}
    </div>
  )}
</div>
```

);
}

// =====================================================================
// FilterChip — small status filter pill
// =====================================================================
function FilterChip({ label, active, color, onClick }) {
return (
<button
onClick={onClick}
className={`px-2 py-1 border text-[11px] tracking-widest uppercase transition-all ${ active ? "bg-[#1a0f08] text-[#fbf4e3] border-[#1a0f08]" : "bg-transparent border-[#1a0f08]/30 hover:border-[#1a0f08]" }`}
style={{
fontFamily: “‘Fraunces’, serif”,
…(active && color ? { background: color, borderColor: color } : {}),
}}
>
{label}
</button>
);
}

// =====================================================================
// SongCard — collapsed summary + expanded details + edit mode
// =====================================================================
function SongCard({
song,
expanded,
editing,
onToggleExpand,
onEdit,
onCancelEdit,
onSave,
onDelete,
onLoadProgression,
}) {
if (editing) {
return <SongEditor song={song} onSave={onSave} onCancel={onCancelEdit} />;
}

const total = song.progressions?.length || 0;

return (
<div className="relative">
<div className="absolute inset-0 bg-[#1a0f08] translate-x-1 translate-y-1" />
<div className="relative bg-[#fbf4e3] border border-[#1a0f08] p-4">
{/* Header row */}
<div className="flex items-start justify-between gap-3 cursor-pointer" onClick={onToggleExpand}>
<div className="flex-1 min-w-0">
<div className="flex items-baseline gap-3 flex-wrap">
<h3
className=“text-2xl font-bold leading-tight”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
{song.title}
</h3>
<span
className=“text-[10px] tracking-widest uppercase px-2 py-0.5 text-[#fbf4e3]”
style={{
background: STATUS_COLORS[song.status] || “#6b5b4a”,
fontFamily: “‘Fraunces’, serif”,
}}
>
{song.status}
</span>
{song.keyName && (
<span
className=“text-xs tracking-widest uppercase text-[#6b5b4a]”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
Key: {song.keyName} {song.scaleType === “melodicMinor” ? “min” : “maj”}
</span>
)}
{song.bpm && (
<span
className=“text-xs text-[#6b5b4a]”
style={{ fontFamily: “‘JetBrains Mono’, monospace” }}
>
{song.bpm} bpm
</span>
)}
</div>
<div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#8a7560]">
<span>{total}개 진행</span>
{song.tags?.length > 0 && (
<>
<span>·</span>
{song.tags.map((t) => (
<span
key={t}
className="px-1.5 border border-[#1a0f08]/20"
>
{t}
</span>
))}
</>
)}
</div>
</div>
<div className="flex gap-1 shrink-0">
<button
onClick={(e) => { e.stopPropagation(); onEdit(); }}
className=“text-[10px] tracking-widest uppercase px-2 py-1 border border-[#1a0f08]/40 hover:bg-[#1a0f08] hover:text-[#fbf4e3] transition-all”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
편집
</button>
<button
onClick={(e) => { e.stopPropagation(); onDelete(); }}
className=“text-[10px] tracking-widest uppercase px-2 py-1 border border-[#6b1f2e]/40 hover:bg-[#6b1f2e] hover:text-[#fbf4e3] transition-all”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
삭제
</button>
</div>
</div>

```
    {/* Expanded body */}
    {expanded && (
      <div className="mt-4 pt-4 border-t border-[#1a0f08]/15 space-y-3">
        {song.notes && (
          <p
            className="text-sm italic text-[#6b5b4a]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {song.notes}
          </p>
        )}
        {(song.progressions || []).length === 0 ? (
          <p className="text-sm text-[#8a7560] italic">
            아직 저장된 진행이 없어요. 편집을 눌러 추가하거나, 시퀀서에서 만들어 저장하세요.
          </p>
        ) : (
          song.progressions.map((p) => (
            <ProgressionRow
              key={p.id}
              progression={p}
              song={song}
              onLoad={onLoadProgression}
            />
          ))
        )}
      </div>
    )}
  </div>
</div>
```

);
}

// =====================================================================
// ProgressionRow — chord row with auto-romans + transpose
// =====================================================================
function ProgressionRow({ progression, song, onLoad }) {
const [transposeTo, setTransposeTo] = useState(null);

const displayChords = useMemo(() => {
if (transposeTo === null || song.key === null || song.key === undefined) {
return progression.chords;
}
return transposeChords(progression.chords, song.key, transposeTo, false);
}, [progression.chords, song.key, transposeTo]);

const displayKey = transposeTo !== null ? transposeTo : song.key;

// Romans always reflect the displayed (possibly transposed) progression
const romanAuto = useMemo(
() => analyzeProgression(displayChords, displayKey, song.scaleType),
[displayChords, displayKey, song.scaleType]
);
const romans = mergeRomans(romanAuto, progression.romanOverride);

return (
<div className="border-l-2 border-[#1a0f08]/20 pl-3 py-1">
<div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
<span
className=“text-[10px] tracking-widest uppercase text-[#6b1f2e]”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
{progression.label || “Untitled”}
</span>
{song.key !== null && song.key !== undefined && (
<select
value={transposeTo === null ? “” : transposeTo}
onChange={(e) =>
setTransposeTo(e.target.value === “” ? null : Number(e.target.value))
}
className=“text-[10px] bg-transparent border border-[#1a0f08]/30 px-1 py-0.5”
style={{ fontFamily: “‘Fraunces’, serif” }}
onClick={(e) => e.stopPropagation()}
>
<option value="">원조</option>
{FLAT_NAMES.map((n, pc) => (
<option key={pc} value={pc}>
→ {n}
</option>
))}
</select>
)}
{onLoad && (
<button
onClick={() => onLoad({ …progression, chords: displayChords })}
className=“text-[10px] tracking-widest uppercase text-[#6b5b4a] hover:text-[#6b1f2e] border-b border-[#6b5b4a]/40 hover:border-[#6b1f2e]”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
→ 시퀀서로 불러오기
</button>
)}
</div>
<div className="flex flex-wrap gap-1.5">
{displayChords.map((chord, i) => (
<div key={i} className="text-center">
<div
className=“text-base font-bold border border-[#1a0f08]/30 bg-[#f2e8d5] px-2 py-1 min-w-[50px]”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
{chord}
</div>
{romans[i] && (
<div
className=“text-[10px] italic text-[#6b1f2e] mt-0.5”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
{romans[i]}
</div>
)}
</div>
))}
</div>
</div>
);
}

// =====================================================================
// SongEditor — full edit form
// =====================================================================
function SongEditor({ song, onSave, onCancel }) {
const [draft, setDraft] = useState({ …song });

const update = (patch) => setDraft((d) => ({ …d, …patch }));

const updateProgression = (idx, patch) => {
const next = […draft.progressions];
next[idx] = { …next[idx], …patch };
update({ progressions: next });
};

const addProgression = () => {
update({
progressions: […(draft.progressions || []), newProgression({ label: “Verse” })],
});
};

const removeProgression = (idx) => {
update({
progressions: draft.progressions.filter((_, i) => i !== idx),
});
};

return (
<div className="relative">
<div className="absolute inset-0 bg-[#1a0f08] translate-x-1 translate-y-1" />
<div className="relative bg-[#fbf4e3] border-2 border-[#6b1f2e] p-4 space-y-4">
<p
className=“text-[10px] tracking-[0.35em] uppercase text-[#6b1f2e]”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
편집 중
</p>

```
    {/* Title + status */}
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <Label>제목</Label>
        <input
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          className="w-full bg-transparent border-b-2 border-[#1a0f08]/40 focus:border-[#b7410e] outline-none py-1 text-xl font-bold"
          style={{ fontFamily: "'Fraunces', serif" }}
        />
      </div>
      <div>
        <Label>상태</Label>
        <select
          value={draft.status}
          onChange={(e) => update({ status: e.target.value })}
          className="bg-transparent border border-[#1a0f08]/40 px-2 py-1 text-sm"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>

    {/* Key, scale, bpm, instrument */}
    <div className="flex flex-wrap gap-3">
      <div>
        <Label>Key</Label>
        <select
          value={draft.key === null || draft.key === undefined ? "" : draft.key}
          onChange={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value);
            update({
              key: v,
              keyName: v === null ? null : FLAT_NAMES[v],
            });
          }}
          className="bg-transparent border border-[#1a0f08]/40 px-2 py-1 text-sm"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          <option value="">—</option>
          {FLAT_NAMES.map((n, pc) => (
            <option key={pc} value={pc}>{n}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Scale</Label>
        <select
          value={draft.scaleType}
          onChange={(e) => update({ scaleType: e.target.value })}
          className="bg-transparent border border-[#1a0f08]/40 px-2 py-1 text-sm"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          <option value="major">Major</option>
          <option value="melodicMinor">Melodic minor</option>
        </select>
      </div>
      <div>
        <Label>BPM</Label>
        <input
          type="number"
          value={draft.bpm || ""}
          onChange={(e) =>
            update({ bpm: e.target.value === "" ? null : Number(e.target.value) })
          }
          className="w-20 bg-transparent border border-[#1a0f08]/40 px-2 py-1 text-sm"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
      </div>
      <div className="flex-1 min-w-[140px]">
        <Label>악기</Label>
        <input
          value={draft.instrument || ""}
          onChange={(e) => update({ instrument: e.target.value })}
          className="w-full bg-transparent border border-[#1a0f08]/40 px-2 py-1 text-sm"
          style={{ fontFamily: "'Fraunces', serif" }}
        />
      </div>
    </div>

    {/* Tags */}
    <div>
      <Label>태그 (쉼표로 구분)</Label>
      <input
        value={(draft.tags || []).join(", ")}
        onChange={(e) =>
          update({
            tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
          })
        }
        placeholder="ballad, modal, acoustic"
        className="w-full bg-transparent border border-[#1a0f08]/40 px-2 py-1 text-sm"
        style={{ fontFamily: "'Fraunces', serif" }}
      />
    </div>

    {/* Notes */}
    <div>
      <Label>노트</Label>
      <textarea
        value={draft.notes || ""}
        onChange={(e) => update({ notes: e.target.value })}
        rows={2}
        className="w-full bg-transparent border border-[#1a0f08]/40 px-2 py-1 text-sm resize-y"
        style={{ fontFamily: "'Fraunces', serif" }}
      />
    </div>

    {/* Progressions */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>진행</Label>
        <button
          onClick={addProgression}
          className="text-[10px] tracking-widest uppercase px-2 py-1 border border-[#1a0f08]/40 hover:bg-[#1a0f08] hover:text-[#fbf4e3]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          + 진행 추가
        </button>
      </div>
      <div className="space-y-3">
        {(draft.progressions || []).map((p, idx) => (
          <ProgressionEditor
            key={p.id}
            progression={p}
            song={draft}
            onChange={(patch) => updateProgression(idx, patch)}
            onRemove={() => removeProgression(idx)}
          />
        ))}
      </div>
    </div>

    {/* Action buttons */}
    <div className="flex gap-2 justify-end pt-3 border-t border-[#1a0f08]/15">
      <button
        onClick={onCancel}
        className="px-4 py-2 border border-[#1a0f08]/40 hover:bg-[#1a0f08] hover:text-[#fbf4e3] text-xs tracking-widest uppercase"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        취소
      </button>
      <button
        onClick={() => onSave(draft)}
        className="px-4 py-2 border border-[#1a0f08] bg-[#1a0f08] text-[#fbf4e3] hover:bg-[#6b1f2e] text-xs tracking-widest uppercase"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        저장
      </button>
    </div>
  </div>
</div>
```

);
}

function ProgressionEditor({ progression, song, onChange, onRemove }) {
// Keep raw text in local state so the user can freely type spaces.
// We only parse into chords[] on blur (when the field loses focus).
// This also prevents the cursor jumping on every keystroke.
const [rawText, setRawText] = useState(progression.chords.join(” “));

// If the parent updates chords from outside (e.g. after save/reload),
// sync back into local text — but only when not actively editing.
const [focused, setFocused] = useState(false);
useEffect(() => {
if (!focused) {
setRawText(progression.chords.join(” “));
}
}, [progression.chords, focused]);

const commitChords = (text) => {
const chords = text.trim().split(/\s+/).filter(Boolean);
onChange({ chords, romanOverride: [] });
};

// Live romans — update in real time as the user types, so they see
// analysis appear chord-by-chord while still in the field.
const liveChords = rawText.trim().split(/\s+/).filter(Boolean);
const romans = useMemo(
() => analyzeProgression(liveChords, song.key, song.scaleType),
// eslint-disable-next-line react-hooks/exhaustive-deps
[rawText, song.key, song.scaleType]
);
const merged = mergeRomans(romans, progression.romanOverride);

return (
<div className="border border-[#1a0f08]/30 bg-[#f2e8d5] p-3 space-y-2">
<div className="flex items-center gap-2 flex-wrap">
<select
value={PROGRESSION_LABELS.includes(progression.label) ? progression.label : “_custom”}
onChange={(e) => {
if (e.target.value !== “_custom”) onChange({ label: e.target.value });
}}
className=“bg-transparent border border-[#1a0f08]/40 px-2 py-0.5 text-xs”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
{PROGRESSION_LABELS.map((l) => (
<option key={l} value={l}>{l}</option>
))}
<option value="_custom">Custom…</option>
</select>
<input
value={progression.label}
onChange={(e) => onChange({ label: e.target.value })}
placeholder=“Label”
className=“flex-1 min-w-[100px] bg-transparent border-b border-[#1a0f08]/30 px-1 py-0.5 text-xs”
style={{ fontFamily: “‘Fraunces’, serif” }}
/>
<button
onClick={onRemove}
className=“text-[10px] px-2 py-0.5 border border-[#6b1f2e]/40 hover:bg-[#6b1f2e] hover:text-[#fbf4e3]”
style={{ fontFamily: “‘Fraunces’, serif” }}
>
×
</button>
</div>
<div>
<Label small>코드 (공백으로 구분)</Label>
<input
value={rawText}
onChange={(e) => setRawText(e.target.value)}
onFocus={() => setFocused(true)}
onBlur={(e) => {
setFocused(false);
commitChords(e.target.value);
}}
placeholder=“Dm7 G7 Cmaj7”
className=“w-full bg-transparent border-b border-[#1a0f08]/30 px-1 py-0.5 text-base”
style={{ fontFamily: “‘JetBrains Mono’, monospace” }}
/>
</div>
{merged.some((r) => r) && (
<div className=“text-[11px] text-[#6b1f2e] italic” style={{ fontFamily: “‘Fraunces’, serif” }}>
분석: {merged.map((r, i) => r || “?”).join(”  ·  “)}
</div>
)}
</div>
);
}

function Label({ children, small }) {
return (
<p
className={`tracking-widest uppercase text-[#6b5b4a] ${ small ? "text-[9px] mb-0.5" : "text-[10px] mb-1" }`}
>
{children}
</p>
);
}
