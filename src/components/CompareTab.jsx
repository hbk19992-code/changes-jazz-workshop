// Comparison workspace — groups saved voicings by their chord name so the
// player can A/B different shapes of the same chord.

import { MiniDiagram } from "./MiniDiagram.jsx";

export function CompareTab({
  saved,
  onLoad,
  onPlay,
  onRemove,
  current,
  onSaveCurrent,
  setTab,
}) {
  if (saved.length === 0 && !current) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-[#1a0f08] translate-x-1.5 translate-y-1.5" />
        <div className="relative bg-[#fbf4e3] border border-[#1a0f08] p-12 text-center">
          <p
            className="text-2xl italic text-[#6b5b4a]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            저장된 보이싱이 없어요
          </p>
          <p className="mt-3 text-sm text-[#8a7560]">
            식별 탭에서 코드를 만들고 "+ 비교에 저장"을 눌러보세요.
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
    );
  }

  // Group saved voicings by chord name so alternate shapes sit next to each other
  const groups = saved.reduce((acc, v) => {
    if (!acc[v.name]) acc[v.name] = [];
    acc[v.name].push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#6b1f2e]">
            Comparison Workspace
          </p>
          <p className="text-sm text-[#6b5b4a] italic mt-1">
            저장된 보이싱 {saved.length}개 · 같은 코드끼리 묶여서 표시됩니다
          </p>
        </div>
        {current && (
          <button
            onClick={onSaveCurrent}
            className="px-4 py-2 border border-[#1a0f08] bg-[#fbf4e3] hover:bg-[#ead79f] text-xs tracking-widest uppercase transition-colors"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            현재 코드 저장 ({current.name})
          </button>
        )}
      </div>

      {Object.keys(groups).length === 0 ? (
        <p className="text-center text-[#8a7560] italic py-8">
          아직 비교할 보이싱이 없습니다.
        </p>
      ) : (
        Object.entries(groups).map(([name, voicings]) => (
          <div key={name} className="relative">
            <div className="absolute inset-0 bg-[#1a0f08] translate-x-1 translate-y-1" />
            <div className="relative bg-[#fbf4e3] border border-[#1a0f08] p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h3
                  className="text-3xl font-black"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {name.split("/")[0]}
                  {name.includes("/") && (
                    <>
                      <span className="text-[#6b1f2e] font-normal">/</span>
                      <span className="text-[#6b1f2e] italic">
                        {name.split("/")[1]}
                      </span>
                    </>
                  )}
                </h3>
                <span className="text-xs text-[#8a7560] tracking-widest uppercase">
                  {voicings.length}개 보이싱
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {voicings.map((v) => (
                  <div
                    key={v.id}
                    className="bg-[#f2e8d5] border border-[#1a0f08]/30 p-3 group relative"
                  >
                    <div className="flex justify-center mb-2">
                      <MiniDiagram frets={v.frets} />
                    </div>
                    <div className="text-[9px] tracking-widest uppercase text-[#8a7560] text-center mb-2">
                      {v.frets.map((f) => (f === null ? "x" : String(f))).join("-")}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onPlay(v.frets)}
                        className="flex-1 text-[10px] py-1 border border-[#1a0f08]/40 hover:bg-[#1a0f08] hover:text-[#fbf4e3] transition-all"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => onLoad(v)}
                        className="flex-1 text-[10px] py-1 border border-[#1a0f08]/40 hover:bg-[#1a0f08] hover:text-[#fbf4e3] transition-all"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        편집
                      </button>
                      <button
                        onClick={() => onRemove(v.id)}
                        className="text-[10px] py-1 px-1.5 border border-[#1a0f08]/40 hover:bg-[#6b1f2e] hover:text-[#fbf4e3] transition-all"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
