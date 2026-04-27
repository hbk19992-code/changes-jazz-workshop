// Simple linear step sequencer for the chord progression the user is
// building. Plays each chord for two beats at the chosen tempo and loops.
// Highlights the currently-sounding step.

import { MiniDiagram } from "./MiniDiagram.jsx";

export function SequencerTab({
  sequence,
  currentStep,
  tempo,
  setTempo,
  isPlaying,
  setIsPlaying,
  onRemove,
  onLoad,
  onClear,
  currentChord,
  onAddCurrent,
  setTab,
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#6b1f2e]">
            Progression Sequencer
          </p>
          <p className="text-sm text-[#6b5b4a] italic mt-1">
            식별 탭에서 만든 코드를 추가하고, 재생하세요
          </p>
        </div>
        {currentChord && (
          <button
            onClick={onAddCurrent}
            className="px-4 py-2 border border-[#1a0f08] bg-[#fbf4e3] hover:bg-[#ead79f] text-xs tracking-widest uppercase transition-colors"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            + 추가 ({currentChord})
          </button>
        )}
      </div>

      {/* Transport */}
      <div className="relative">
        <div className="absolute inset-0 bg-[#1a0f08] translate-x-1 translate-y-1" />
        <div className="relative bg-[#fbf4e3] border border-[#1a0f08] p-4 flex flex-wrap items-center gap-4 justify-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={sequence.length === 0}
            className="px-6 py-2 border border-[#1a0f08] bg-[#1a0f08] text-[#fbf4e3] hover:bg-[#6b1f2e] disabled:opacity-30 transition-colors text-sm tracking-widest uppercase"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {isPlaying ? "■ 정지" : "▶ 재생"}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs tracking-widest uppercase text-[#6b5b4a]">
              Tempo
            </span>
            <input
              type="range"
              min={40}
              max={180}
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="w-32 accent-[#b7410e]"
            />
            <span
              className="text-sm font-bold w-14"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {tempo} bpm
            </span>
          </div>
          {sequence.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs tracking-widest uppercase text-[#6b1f2e] hover:text-[#1a0f08] border-b border-[#6b1f2e] hover:border-[#1a0f08]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              비우기
            </button>
          )}
        </div>
      </div>

      {/* Sequence display */}
      {sequence.length === 0 ? (
        <div className="relative">
          <div className="absolute inset-0 bg-[#1a0f08] translate-x-1.5 translate-y-1.5" />
          <div className="relative bg-[#fbf4e3] border border-[#1a0f08] p-12 text-center">
            <p
              className="text-xl italic text-[#6b5b4a]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              비어있는 진행
            </p>
            <p className="mt-3 text-sm text-[#8a7560]">
              식별 탭에서 코드를 만들고 "+ 진행에 추가"를 눌러서 시작하세요.
            </p>
            <button
              onClick={() => setTab("identify")}
              className="mt-6 px-5 py-2 border border-[#1a0f08] bg-[#1a0f08] text-[#fbf4e3] text-xs tracking-widest uppercase hover:bg-[#6b1f2e] transition-colors"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              식별 탭으로
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-0 bg-[#1a0f08] translate-x-1.5 translate-y-1.5" />
          <div className="relative bg-[#fbf4e3] border border-[#1a0f08] p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sequence.map((v, idx) => (
                <div
                  key={v.id}
                  className={`relative p-3 border transition-all ${
                    currentStep === idx
                      ? "bg-[#b7410e] border-[#1a0f08] scale-105 shadow-lg"
                      : "bg-[#f2e8d5] border-[#1a0f08]/30"
                  }`}
                >
                  <div
                    className="text-[10px] tracking-widest uppercase mb-1"
                    style={{
                      color: currentStep === idx ? "#fbf4e3" : "#8a7560",
                      fontFamily: "'Fraunces', serif",
                    }}
                  >
                    {idx + 1} / {sequence.length}
                  </div>
                  <div
                    className="text-lg font-bold mb-2"
                    style={{
                      color: currentStep === idx ? "#fbf4e3" : "#1a0f08",
                      fontFamily: "'Fraunces', serif",
                    }}
                  >
                    {v.name}
                  </div>
                  <div className="flex justify-center mb-2">
                    <MiniDiagram frets={v.frets} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onLoad(v)}
                      className="flex-1 text-[10px] py-1 border border-[#1a0f08]/40 hover:bg-[#1a0f08] hover:text-[#fbf4e3] transition-all"
                      style={{
                        fontFamily: "'Fraunces', serif",
                        color: currentStep === idx ? "#fbf4e3" : "#1a0f08",
                      }}
                    >
                      편집
                    </button>
                    <button
                      onClick={() => onRemove(v.id)}
                      className="text-[10px] py-1 px-1.5 border border-[#1a0f08]/40 hover:bg-[#6b1f2e] hover:text-[#fbf4e3] transition-all"
                      style={{
                        fontFamily: "'Fraunces', serif",
                        color: currentStep === idx ? "#fbf4e3" : "#1a0f08",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
