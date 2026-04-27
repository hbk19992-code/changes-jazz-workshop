// Big visual readout of the currently-identified chord. Splits the name
// into root / quality / parens / bass so each component can use a different
// font size (the parens block with add/no modifiers tends to be long).

import { Fragment } from "react";

export function ResultDisplay({ result }) {
  if (result.type === "empty") {
    return (
      <div className="py-12 text-center">
        <p
          className="text-2xl italic text-[#6b5b4a]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          아직 아무 음도 없어요
        </p>
        <p className="mt-3 text-sm text-[#8a7560]">
          프렛을 탭하거나 ○를 눌러 개방현을 추가하세요.
        </p>
      </div>
    );
  }

  if (result.type === "single") {
    return (
      <div>
        <p className="text-xs tracking-widest uppercase text-[#6b5b4a] mb-2">
          Single Note
        </p>
        <h2
          className="text-7xl md:text-8xl font-black leading-none"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {result.noteName}
        </h2>
        <p className="mt-6 text-sm text-[#6b5b4a] italic">
          두 음 이상이 필요해요.
        </p>
      </div>
    );
  }

  // The identifier now always names something, but leave a safety branch.
  if (result.type === "unknown") {
    return (
      <div>
        <p className="text-xs tracking-widest uppercase text-[#6b1f2e] mb-2">
          판별 불가
        </p>
        <h2
          className="text-3xl md:text-4xl font-black leading-tight mb-4"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Unidentified
        </h2>
        <div className="flex flex-wrap gap-2">
          {result.notes.map((n) => (
            <span
              key={n}
              className="px-3 py-1 border border-[#1a0f08]/40 text-sm font-semibold bg-[#f2e8d5]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Split displayName into its visual parts
  const [mainPart, bassPart] = result.name.split("/");
  const rootMatch = mainPart.match(/^([A-G][b#♭♯]?)(.*)$/);
  const rootText = rootMatch ? rootMatch[1] : mainPart;
  const qualityText = rootMatch ? rootMatch[2] : "";
  const parenMatch = qualityText.match(/^(.*?)(\(.+\))$/);
  const qualityMain = parenMatch ? parenMatch[1] : qualityText;
  const qualityParen = parenMatch ? parenMatch[2] : "";

  return (
    <div>
      <div
        className="flex items-baseline flex-wrap gap-x-1"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        <h2 className="text-6xl md:text-7xl font-black leading-[0.95] tracking-tighter">
          {rootText}
        </h2>
        {qualityMain && (
          <span className="text-3xl md:text-4xl font-bold leading-none">
            {qualityMain}
          </span>
        )}
        {qualityParen && (
          <span className="text-xl md:text-2xl font-semibold text-[#6b1f2e] leading-none">
            {qualityParen}
          </span>
        )}
        {result.isSlash && (
          <>
            <span className="text-4xl md:text-5xl text-[#6b1f2e] font-normal leading-none">
              /
            </span>
            <span className="text-4xl md:text-5xl text-[#6b1f2e] italic leading-none">
              {bassPart}
            </span>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs tracking-widest uppercase text-[#6b1f2e]">
        {result.isSlash && <span>Slash · Bass = {result.bassName}</span>}
        {result.rootless && <span>Rootless voicing</span>}
      </div>

      <div className="mt-7">
        <p className="text-[10px] tracking-[0.35em] uppercase text-[#6b5b4a] mb-3">
          Intervals (low → high)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {result.intervals.map((iv, idx) => (
            <div
              key={idx}
              className="border border-[#1a0f08] bg-[#f2e8d5] px-2 py-1 text-center min-w-[42px]"
            >
              <div
                className="text-[10px] text-[#8a7560]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {iv.noteName}
              </div>
              <div
                className="text-sm font-bold text-[#6b1f2e]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {iv.interval}
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.alternates.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[#1a0f08]/15">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#6b5b4a] mb-2">
            Other readings
          </p>
          <div className="flex flex-wrap gap-x-2 gap-y-1 items-baseline">
            {result.alternates.map((alt, i) => (
              <Fragment key={alt}>
                {i > 0 && <span className="text-[#8a7560] text-xs">·</span>}
                <span
                  className="text-sm text-[#6b5b4a] italic"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {alt}
                </span>
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
