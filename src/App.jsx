// Top-level orchestration. Holds all cross-tab state (voicings saved for
// comparison, sequence, preferences) and wires callbacks down.

import { useState, useMemo, useRef, useEffect } from "react";

import { useAudio } from "./hooks/useAudio.js";

import { identifyChord } from "./theory/identify.js";
import { spellNote } from "./theory/spelling.js";
import { suggestScales } from "./theory/scales.js";
import {
  getTritoneSub,
  getRelatedII,
  getFunction,
} from "./theory/functions.js";
import {
  SCALE_TYPES,
  KEYS,
  diatonicChords,
  isInKey,
} from "./theory/diatonic.js";

import { LIBRARY } from "./data/voicings.js";

import { ToggleChip } from "./components/ToggleChip.jsx";
import { InteractiveFretboard } from "./components/InteractiveFretboard.jsx";
import { ResultDisplay } from "./components/ResultDisplay.jsx";
import { TheoryCoach } from "./components/TheoryCoach.jsx";
import { MiniDiagram } from "./components/MiniDiagram.jsx";
import { CompareTab } from "./components/CompareTab.jsx";
import { SequencerTab } from "./components/SequencerTab.jsx";

export default function App() {
  // Fretboard state
  const [frets, setFrets] = useState([null, null, null, null, null, null]);
  const [startFret, setStartFret] = useState(1);

  // Top-level navigation
  const [tab, setTab] = useState("identify"); // identify | compare | sequencer

  // Key + scale context used for spelling, function analysis, and diatonic filters
  const [diatonicKeyPC, setDiatonicKeyPC] = useState(null);
  const [diatonicScale, setDiatonicScale] = useState("major");

  // Theory display preferences
  const [useTriangle, setUseTriangle] = useState(false);
  const [useHalfDimSymbol, setUseHalfDimSymbol] = useState(false);
  const [colorByInterval, setColorByInterval] = useState(true);
  const [guideTonesMode, setGuideTonesMode] = useState(false);
  const [showTheoryCoach, setShowTheoryCoach] = useState(true);

  // Saved voicings (compare tab)
  const [savedVoicings, setSavedVoicings] = useState([]);

  // Sequencer state
  const [sequence, setSequence] = useState([]);
  const [tempo, setTempo] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const playTimeoutRef = useRef(null);

  const audio = useAudio();

  // The primary identification, recomputed whenever any relevant input changes
  const result = useMemo(
    () =>
      identifyChord(frets, {
        keyPC: diatonicKeyPC,
        scaleType: diatonicScale,
        useTriangle,
        useHalfDimSymbol,
      }),
    [frets, diatonicKeyPC, diatonicScale, useTriangle, useHalfDimSymbol]
  );

  // Theory coach data — only meaningful when we actually have a chord
  const coach = useMemo(() => {
    if (result.type !== "chord") return null;
    return {
      scales: suggestScales(
        result.category,
        result.rootPC,
        diatonicKeyPC,
        diatonicScale
      ),
      tritoneSub: getTritoneSub(
        result.rootPC,
        result.category,
        diatonicKeyPC,
        diatonicScale
      ),
      relatedII: getRelatedII(
        result.rootPC,
        result.category,
        diatonicKeyPC,
        diatonicScale
      ),
      function: getFunction(
        result.rootPC,
        result.category,
        diatonicKeyPC,
        diatonicScale
      ),
    };
  }, [result, diatonicKeyPC, diatonicScale]);

  // Diatonic highlight set shown as ghost dots on the fretboard
  const highlights = useMemo(() => {
    if (diatonicKeyPC === null) return null;
    const scaleNotes = SCALE_TYPES[diatonicScale].intervals.map(
      (iv) => (diatonicKeyPC + iv) % 12
    );
    const set = new Set(scaleNotes);
    set.rootPC = diatonicKeyPC;
    return set;
  }, [diatonicKeyPC, diatonicScale]);

  // Diatonic chord suggestions displayed as a strip under the result
  const diatonicSuggestions = useMemo(() => {
    if (diatonicKeyPC === null) return null;
    return diatonicChords(
      diatonicKeyPC,
      diatonicScale,
      useTriangle,
      useHalfDimSymbol
    );
  }, [diatonicKeyPC, diatonicScale, useTriangle, useHalfDimSymbol]);

  // Map "stringIdx-fret" → interval label so the fretboard can color dots
  const chordIntervalMap = useMemo(() => {
    if (result.type !== "chord") return null;
    const m = new Map();
    result.intervals.forEach((iv) =>
      m.set(`${iv.stringIdx}-${iv.fret}`, iv.interval)
    );
    return m;
  }, [result]);

  // Filter the voicing library to only show in-key shapes (when a key is set)
  const filteredLibrary = useMemo(() => {
    if (diatonicKeyPC === null) return LIBRARY;
    return LIBRARY.filter((v) => isInKey(v.frets, diatonicKeyPC, diatonicScale));
  }, [diatonicKeyPC, diatonicScale]);

  // ---- Actions ----

  const clearAll = () => {
    setFrets([null, null, null, null, null, null]);
    setStartFret(1);
  };

  // When loading a voicing, auto-scroll the fretboard window to frame it
  const loadVoicing = (v) => {
    setFrets(v.frets);
    const fretted = v.frets.filter((f) => f !== null && f > 0);
    if (fretted.length > 0) {
      const minF = Math.min(...fretted);
      const maxF = Math.max(...fretted);
      if (maxF > 7 || minF > 3) setStartFret(Math.max(1, minF));
      else setStartFret(1);
    } else setStartFret(1);
  };

  const saveCurrentVoicing = () => {
    if (result.type !== "chord") return;
    setSavedVoicings((prev) => [
      ...prev,
      { frets: [...frets], name: result.name, id: Date.now() },
    ]);
  };

  const removeSaved = (id) =>
    setSavedVoicings((prev) => prev.filter((v) => v.id !== id));

  const addToSequence = () => {
    if (result.type !== "chord") return;
    setSequence((prev) => [
      ...prev,
      { frets: [...frets], name: result.name, id: Date.now() },
    ]);
  };

  const removeFromSequence = (id) =>
    setSequence((prev) => prev.filter((v) => v.id !== id));

  // Sequencer playback loop — runs only while isPlaying
  useEffect(() => {
    if (!isPlaying) {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      setCurrentStep(-1);
      return;
    }
    if (sequence.length === 0) {
      setIsPlaying(false);
      return;
    }

    let step = 0;
    const beatMs = (60 / tempo) * 1000 * 2; // two beats per chord

    const playStep = () => {
      setCurrentStep(step);
      audio.playChord(sequence[step].frets, true);
      step = (step + 1) % sequence.length;
      playTimeoutRef.current = setTimeout(playStep, beatMs);
    };
    playStep();

    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, [isPlaying, sequence, tempo, audio]);

  const onPlayString = (freq) => audio.playNote(freq, 0, 1.2, 0.12);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "radial-gradient(ellipse at top, #f8f0dc 0%, #eadfc5 55%, #d9c299 100%)",
        fontFamily: "'Fraunces', 'EB Garamond', Georgia, serif",
        color: "#1a0f08",
      }}
    >
      {/* Subtle noise grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.07] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3 text-[#6b1f2e]">
            <span className="h-px w-10 bg-current opacity-60" />
            <span className="text-[10px] tracking-[0.4em] uppercase">
              Jazz Workshop · Mk II
            </span>
            <span className="h-px w-10 bg-current opacity-60" />
          </div>
          <h1
            className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            <em className="italic font-normal text-[#6b1f2e]">Changes</em>
          </h1>
          <p className="mt-3 text-[#6b5b4a] text-sm md:text-base italic max-w-md mx-auto">
            탭하고 · 끌고 · 비교하고 · 들어보고 · 진행을 만드세요
          </p>
        </header>

        {/* Tab nav */}
        <nav className="flex justify-center gap-0 mb-8 border-b border-[#1a0f08]/20">
          {[
            { key: "identify", label: "식별" },
            { key: "compare", label: "보이싱 비교" },
            { key: "sequencer", label: "진행 시퀀서" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm tracking-[0.2em] uppercase transition-all relative ${
                tab === t.key
                  ? "text-[#1a0f08] font-semibold"
                  : "text-[#8a7560] hover:text-[#1a0f08]"
              }`}
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-[#b7410e]" />
              )}
            </button>
          ))}
        </nav>

        {/* Diatonic Key Bar */}
        <div className="mb-6">
          <div className="bg-[#fbf4e3] border border-[#1a0f08]/30 p-3">
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#6b5b4a] mr-1">
                Key:
              </span>
              <button
                onClick={() => setDiatonicKeyPC(null)}
                className={`text-xs px-2.5 py-1 border transition-all ${
                  diatonicKeyPC === null
                    ? "bg-[#1a0f08] text-[#fbf4e3] border-[#1a0f08]"
                    : "bg-transparent border-[#1a0f08]/40 hover:border-[#1a0f08]"
                }`}
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Off
              </button>
              {KEYS.map((note, pc) => (
                <button
                  key={pc}
                  onClick={() => setDiatonicKeyPC(pc)}
                  className={`text-xs w-8 h-7 border transition-all ${
                    diatonicKeyPC === pc
                      ? "bg-[#b7410e] text-[#fbf4e3] border-[#b7410e]"
                      : "bg-transparent border-[#1a0f08]/40 hover:border-[#1a0f08]"
                  }`}
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {note}
                </button>
              ))}
              <span className="text-[#1a0f08]/30 mx-1">|</span>
              <select
                value={diatonicScale}
                onChange={(e) => setDiatonicScale(e.target.value)}
                disabled={diatonicKeyPC === null}
                className="text-xs bg-transparent border border-[#1a0f08]/40 px-2 py-1 disabled:opacity-40"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                <option value="major">Major</option>
                <option value="melodicMinor">Melodic minor</option>
              </select>
            </div>
            {diatonicKeyPC !== null && (
              <p className="text-[10px] tracking-widest uppercase text-[#8a7560] text-center mt-2 italic">
                프렛보드에 다이어토닉 노트가 보이고, 라이브러리는 키 안의 보이싱만 표시됩니다
              </p>
            )}
          </div>
        </div>

        {/* Theory Preferences Toolbar */}
        <div className="mb-6 bg-[#fbf4e3]/60 border border-[#1a0f08]/25 p-3">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#6b5b4a] mr-1">
              표기·시각화:
            </span>
            <ToggleChip
              label="Δ maj"
              active={useTriangle}
              onClick={() => setUseTriangle(!useTriangle)}
            />
            <ToggleChip
              label="ø m7♭5"
              active={useHalfDimSymbol}
              onClick={() => setUseHalfDimSymbol(!useHalfDimSymbol)}
            />
            <span className="text-[#1a0f08]/20">|</span>
            <ToggleChip
              label="컬러 코드톤"
              active={colorByInterval}
              onClick={() => setColorByInterval(!colorByInterval)}
            />
            <ToggleChip
              label="가이드톤 (3·7)"
              active={guideTonesMode}
              onClick={() => setGuideTonesMode(!guideTonesMode)}
            />
            <span className="text-[#1a0f08]/20">|</span>
            <ToggleChip
              label="이론 코치"
              active={showTheoryCoach}
              onClick={() => setShowTheoryCoach(!showTheoryCoach)}
            />
          </div>
        </div>

        {/* === IDENTIFY TAB === */}
        {tab === "identify" && (
          <>
            <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-start">
              {/* Fretboard card */}
              <div className="relative">
                <div className="absolute inset-0 bg-[#1a0f08] translate-x-1.5 translate-y-1.5 rounded-[2px]" />
                <div className="relative bg-[#fbf4e3] border border-[#1a0f08] p-5 md:p-6 rounded-[2px]">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className="text-[10px] tracking-[0.3em] uppercase text-[#6b5b4a]">
                      Fretboard
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => audio.playChord(frets, true)}
                        disabled={result.type !== "chord"}
                        className="text-xs tracking-wider uppercase text-[#6b1f2e] hover:text-[#1a0f08] disabled:opacity-30 transition-colors border-b border-[#6b1f2e] hover:border-[#1a0f08]"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        ▶ Strum
                      </button>
                      <button
                        onClick={clearAll}
                        className="text-xs tracking-wider uppercase text-[#6b1f2e] hover:text-[#1a0f08] transition-colors border-b border-[#6b1f2e] hover:border-[#1a0f08]"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <InteractiveFretboard
                    frets={frets}
                    onChange={setFrets}
                    startFret={startFret}
                    setStartFret={setStartFret}
                    highlights={highlights}
                    diatonicMode={diatonicKeyPC !== null}
                    onPlayString={onPlayString}
                    chordIntervals={chordIntervalMap}
                    colorByInterval={colorByInterval}
                    guideTonesMode={guideTonesMode}
                  />
                  <div className="mt-4 pt-3 border-t border-[#1a0f08]/15 text-[10px] tracking-widest uppercase text-[#8a7560] text-center">
                    {frets.map((f) => (f === null ? "x" : String(f))).join("-")}
                  </div>
                </div>
              </div>

              {/* Result card */}
              <div className="relative">
                <div className="absolute inset-0 bg-[#1a0f08] translate-x-1.5 translate-y-1.5 rounded-[2px]" />
                <div className="relative bg-[#fbf4e3] border border-[#1a0f08] p-6 md:p-8 rounded-[2px] min-h-[340px]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] tracking-[0.35em] uppercase text-[#6b1f2e]">
                      Chord
                    </p>
                    {result.type === "chord" && (
                      <div className="flex gap-2">
                        <button
                          onClick={saveCurrentVoicing}
                          className="text-[10px] tracking-widest uppercase text-[#6b5b4a] hover:text-[#6b1f2e] border-b border-[#6b5b4a]/40 hover:border-[#6b1f2e]"
                          style={{ fontFamily: "'Fraunces', serif" }}
                        >
                          + 비교에 저장
                        </button>
                        <button
                          onClick={addToSequence}
                          className="text-[10px] tracking-widest uppercase text-[#6b5b4a] hover:text-[#6b1f2e] border-b border-[#6b5b4a]/40 hover:border-[#6b1f2e]"
                          style={{ fontFamily: "'Fraunces', serif" }}
                        >
                          + 진행에 추가
                        </button>
                      </div>
                    )}
                  </div>
                  <ResultDisplay result={result} />
                  {showTheoryCoach && coach && result.type === "chord" && (
                    <TheoryCoach
                      result={result}
                      coach={coach}
                      keyPC={diatonicKeyPC}
                      scaleType={diatonicScale}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Diatonic suggestion strip */}
            {diatonicSuggestions && (
              <div className="mt-8 bg-[#fbf4e3]/60 border border-[#1a0f08]/30 p-4">
                <p className="text-[10px] tracking-[0.35em] uppercase text-[#6b1f2e] mb-3 text-center">
                  Diatonic chords in {spellNote(diatonicKeyPC, diatonicKeyPC, diatonicScale)}{" "}
                  {diatonicScale === "major" ? "major" : "melodic minor"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {diatonicSuggestions.map((c) => (
                    <div
                      key={c.degree}
                      className="text-center px-3 py-1.5 border border-[#1a0f08]/30 bg-[#fbf4e3]"
                    >
                      <div
                        className="text-[9px] tracking-widest uppercase text-[#8a7560] italic"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        {c.roman}
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        {c.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Library */}
            <section className="mt-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px flex-1 bg-[#1a0f08]/20" />
                <h2
                  className="text-xs tracking-[0.35em] uppercase text-[#6b5b4a]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Voicing Library{" "}
                  {diatonicKeyPC !== null && `· filtered (${filteredLibrary.length})`}
                </h2>
                <span className="h-px flex-1 bg-[#1a0f08]/20" />
              </div>
              {filteredLibrary.length === 0 ? (
                <p className="text-center text-[#8a7560] italic">
                  이 키에 맞는 보이싱이 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {filteredLibrary.map((v, i) => {
                    // Identify each library voicing with the same flags the user selected
                    const detected = identifyChord(v.frets, {
                      keyPC: diatonicKeyPC,
                      scaleType: diatonicScale,
                      useTriangle,
                      useHalfDimSymbol,
                    });
                    const displayName =
                      detected?.type === "chord" ? detected.name : "—";
                    return (
                      <button
                        key={i}
                        onClick={() => loadVoicing(v)}
                        className="group bg-[#fbf4e3] border border-[#1a0f08]/40 hover:border-[#6b1f2e] hover:bg-[#f5e9c9] transition-all p-3"
                      >
                        <p
                          className="text-sm font-bold text-left mb-1 truncate"
                          style={{ fontFamily: "'Fraunces', serif" }}
                        >
                          {displayName}
                        </p>
                        <p className="text-[9px] tracking-widest uppercase text-[#8a7560] mb-2 truncate">
                          {v.shape}
                        </p>
                        <div className="flex justify-center">
                          <MiniDiagram frets={v.frets} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* === COMPARE TAB === */}
        {tab === "compare" && (
          <CompareTab
            saved={savedVoicings}
            onLoad={loadVoicing}
            onPlay={(f) => audio.playChord(f, true)}
            onRemove={removeSaved}
            current={
              result.type === "chord" ? { frets, name: result.name } : null
            }
            onSaveCurrent={saveCurrentVoicing}
            setTab={setTab}
          />
        )}

        {/* === SEQUENCER TAB === */}
        {tab === "sequencer" && (
          <SequencerTab
            sequence={sequence}
            currentStep={currentStep}
            tempo={tempo}
            setTempo={setTempo}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onRemove={removeFromSequence}
            onLoad={(v) => {
              loadVoicing(v);
              setTab("identify");
            }}
            onClear={() => setSequence([])}
            currentChord={result.type === "chord" ? result.name : null}
            onAddCurrent={addToSequence}
            setTab={setTab}
          />
        )}

        <footer className="mt-16 pt-6 border-t border-[#1a0f08]/20 text-center text-[10px] tracking-[0.3em] uppercase text-[#8a7560] space-y-1">
          <p>Standard tuning · E A D G B e</p>
          <p>× Mute · ○ Open · R 9 3 11 5 13 ♭7 Δ7</p>
        </footer>
      </div>
    </div>
  );
}
