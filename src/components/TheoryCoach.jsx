// Theory coach — the analytical panel shown below the identified chord.
// Bundles three insights a jazz guitarist actually uses mid-practice:
//   · Function — Roman numeral / secondary / subV label in the active key
//   · Substitutions — ii-V prep and tritone sub, for any dominant
//   · Compatible scales — with the actual notes to play over this chord

import { spellNote } from "../theory/spelling.js";

export function TheoryCoach({ result, coach, keyPC, scaleType }) {
  if (!coach) return null;
  const hasFunction = coach.function !== null;
  const hasSubs = coach.tritoneSub || coach.relatedII;

  // Color-code the function badge by type so the eye learns diatonic vs
  // secondary vs borrowed at a glance.
  const functionColor =
    {
      diatonic: "#4a5f3e",
      secondary: "#7a5a2e",
      substitution: "#6b1f2e",
      borrowed: "#3e5566",
    }[coach.function?.type] || "#6b5b4a";

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[#1a0f08]/15" />
        <span className="text-[10px] tracking-[0.35em] uppercase text-[#6b1f2e]">
          Theory Coach
        </span>
        <span className="h-px flex-1 bg-[#1a0f08]/15" />
      </div>

      {(hasFunction || result.inversion || result.rootless) && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {hasFunction && (
            <div
              className="flex items-baseline gap-2 border-l-2 pl-3 py-0.5"
              style={{ borderColor: functionColor }}
            >
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#8a7560]">
                In {spellNote(keyPC, keyPC, scaleType)}
              </span>
              <span
                className="text-xl font-bold"
                style={{
                  fontFamily: "'Fraunces', serif",
                  color: functionColor,
                }}
              >
                {coach.function.label}
              </span>
              <span className="text-[10px] italic text-[#6b5b4a]">
                · {coach.function.type}
              </span>
            </div>
          )}
          {result.inversion && result.inversion !== "Root position" && (
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#6b1f2e] border border-[#6b1f2e]/40 px-2 py-1">
              {result.inversion}
            </span>
          )}
          {result.rootless && (
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#6b1f2e] border border-[#6b1f2e]/40 px-2 py-1">
              Rootless
            </span>
          )}
        </div>
      )}

      {hasSubs && (
        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#6b5b4a] mb-2">
            Substitutions
          </p>
          <div className="flex flex-wrap gap-2">
            {coach.relatedII && (
              <div className="border border-[#1a0f08]/30 bg-[#f2e8d5] px-3 py-1.5">
                <div className="text-[9px] tracking-widest uppercase text-[#8a7560]">
                  Related ii
                </div>
                <div
                  className="text-base font-bold"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {coach.relatedII} → {result.name.split("/")[0]}
                </div>
              </div>
            )}
            {coach.tritoneSub && (
              <div className="border border-[#1a0f08]/30 bg-[#f2e8d5] px-3 py-1.5">
                <div className="text-[9px] tracking-widest uppercase text-[#8a7560]">
                  Tritone sub
                </div>
                <div
                  className="text-base font-bold"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {coach.tritoneSub}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {coach.scales.length > 0 && (
        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#6b5b4a] mb-2">
            Compatible Scales
          </p>
          <div className="space-y-2">
            {coach.scales.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-l-2 border-[#1a0f08]/20 hover:border-[#6b1f2e] pl-3 py-1 transition-colors"
              >
                <div className="flex-shrink-0 min-w-[120px]">
                  <div
                    className="text-sm font-bold"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {s.name}
                  </div>
                  <div className="text-[10px] italic text-[#8a7560]">
                    {s.mood}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 flex-1">
                  {s.notes.map((n, idx) => (
                    <span
                      key={idx}
                      className={`px-1.5 py-0.5 text-xs border ${
                        idx === 0
                          ? "bg-[#6b1f2e] text-[#fbf4e3] border-[#6b1f2e] font-semibold"
                          : "bg-[#f2e8d5] border-[#1a0f08]/25 text-[#1a0f08]"
                      }`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
