// The tappable fretboard.
// Tap any cell to toggle a fretted note. Drag up/down to shift the visible
// window. When coloring is on, each dot shows its chord-function role.
//
// Props:
//   frets              — [e,A,D,G,B,e] fret values (null=mute, 0=open, >0=fret)
//   onChange(nextFrets)
//   startFret, setStartFret
//   highlights         — Set of pitch classes to ghost (diatonic mode);
//                        may also have .rootPC
//   diatonicMode       — when true, ghost dots render for in-scale notes
//   onPlayString(freq) — optional click-to-hear callback
//   chordIntervals     — Map "stringIdx-fret" → interval label ("R","3","♭7"...)
//   colorByInterval    — swap neck-dot color to the interval palette
//   guideTonesMode     — fade all non-3/7 dots for voicing-study focus

import { useRef } from "react";
import {
  OPEN_STRINGS,
  STRING_FREQS,
  INTERVAL_COLORS,
  GUIDE_TONES,
} from "../constants.js";

export function InteractiveFretboard({
  frets,
  onChange,
  startFret,
  setStartFret,
  highlights = null,
  diatonicMode = false,
  onPlayString,
  chordIntervals = null,
  colorByInterval = false,
  guideTonesMode = false,
}) {
  const NUM_VISIBLE = 7;
  const endFret = startFret + NUM_VISIBLE - 1;

  const W = 320;
  const padLeft = 38;
  const padRight = 22;
  const topMute = 16;
  const topOpen = 40;
  const neckTop = 72;
  const fretHeight = 46;
  const stringGap = (W - padLeft - padRight) / 5;
  const neckBottom = neckTop + NUM_VISIBLE * fretHeight;
  const H = neckBottom + 26;

  const stringX = (i) => padLeft + i * stringGap;

  // Drag-scroll state lives in a ref to avoid render churn on pointer moves.
  const dragRef = useRef({
    active: false,
    startY: 0,
    startFret: 1,
    didDrag: false,
  });

  const handlePointerDown = (e) => {
    if (e.target.dataset?.notap) return;
    dragRef.current = {
      active: true,
      startY: e.clientY,
      startFret,
      didDrag: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.active) return;
    const dy = e.clientY - dragRef.current.startY;
    const fretDelta = Math.round(-dy / 30); // drag down → lower frets
    if (Math.abs(fretDelta) >= 1) {
      const next = Math.max(
        1,
        Math.min(15, dragRef.current.startFret + fretDelta)
      );
      if (next !== startFret) {
        setStartFret(next);
        dragRef.current.didDrag = true;
      }
    }
  };

  const handlePointerUp = () => {
    // Short delay before clearing drag flag so the tap handler can check it
    setTimeout(() => {
      dragRef.current.active = false;
    }, 50);
  };

  const setString = (i, val) => {
    const next = [...frets];
    next[i] = val;
    onChange(next);
    if (val !== null && onPlayString) {
      const freq =
        val === 0 ? STRING_FREQS[i] : STRING_FREQS[i] * Math.pow(2, val / 12);
      onPlayString(freq);
    }
  };

  const handleFretTap = (i, absoluteFret) => {
    if (dragRef.current.didDrag) {
      dragRef.current.didDrag = false;
      return;
    }
    if (frets[i] === absoluteFret) setString(i, null);
    else setString(i, absoluteFret);
  };

  const inlayFrets = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
  const doubleInlayFrets = new Set([12, 24]);

  const cellPC = (sIdx, absFret) => (OPEN_STRINGS[sIdx] + absFret) % 12;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-center gap-2 mb-3 text-sm">
        <button
          onClick={() => setStartFret(Math.max(1, startFret - 1))}
          disabled={startFret <= 1}
          data-notap="1"
          className="w-8 h-8 border border-[#1a0f08] bg-[#fbf4e3] hover:bg-[#ead79f] disabled:opacity-30 transition-colors flex items-center justify-center"
        >
          ↑
        </button>
        <span className="tracking-widest text-[#6b5b4a] italic min-w-[78px] text-center">
          {startFret}–{endFret} fr
        </span>
        <button
          onClick={() => setStartFret(Math.min(15, startFret + 1))}
          disabled={startFret >= 15}
          data-notap="1"
          className="w-8 h-8 border border-[#1a0f08] bg-[#fbf4e3] hover:bg-[#ead79f] disabled:opacity-30 transition-colors flex items-center justify-center"
        >
          ↓
        </button>
      </div>
      <p className="text-[9px] tracking-[0.25em] uppercase text-[#8a7560] mb-2 italic">
        ↕ 프렛보드를 위아래로 끌면 포지션 이동
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[360px] touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: dragRef.current.active ? "grabbing" : "grab" }}
      >
        {/* String labels */}
        {["E", "A", "D", "G", "B", "e"].map((label, i) => (
          <text
            key={i}
            x={stringX(i)}
            y={10}
            textAnchor="middle"
            fontSize={10}
            fill="#8a7560"
            fontFamily="'Fraunces', serif"
            fontStyle="italic"
          >
            {label}
          </text>
        ))}

        {/* Mute / Open toggles */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const val = frets[i];
          const isMuted = val === null || val === undefined;
          const isOpen = val === 0;
          const x = stringX(i);
          return (
            <g key={i}>
              <g
                onClick={() => setString(i, null)}
                style={{ cursor: "pointer" }}
                data-notap="1"
              >
                <rect
                  x={x - 11}
                  y={topMute - 8}
                  width={22}
                  height={16}
                  fill={isMuted ? "#1a0f08" : "transparent"}
                  stroke="#1a0f08"
                  strokeWidth={1}
                  data-notap="1"
                />
                <text
                  x={x}
                  y={topMute + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill={isMuted ? "#f2e8d5" : "#1a0f08"}
                  fontFamily="'Fraunces', serif"
                  data-notap="1"
                >
                  ×
                </text>
              </g>
              <g
                onClick={() => setString(i, 0)}
                style={{ cursor: "pointer" }}
                data-notap="1"
              >
                {(() => {
                  const openKey = `${i}-0`;
                  const iv = chordIntervals?.get?.(openKey) || null;
                  const openFill =
                    isOpen && colorByInterval && iv
                      ? INTERVAL_COLORS[iv] || "#b7410e"
                      : isOpen
                      ? "#b7410e"
                      : "transparent";
                  return (
                    <>
                      <rect
                        x={x - 11}
                        y={topOpen - 8}
                        width={22}
                        height={16}
                        fill={openFill}
                        stroke="#1a0f08"
                        strokeWidth={1}
                        data-notap="1"
                      />
                      <text
                        x={x}
                        y={topOpen + 4}
                        textAnchor="middle"
                        fontSize={
                          isOpen && colorByInterval && iv ? 9 : 11
                        }
                        fontWeight={700}
                        fill={isOpen ? "#fbf4e3" : "#1a0f08"}
                        fontFamily="'Fraunces', serif"
                        data-notap="1"
                      >
                        {isOpen && colorByInterval && iv ? iv : "○"}
                      </text>
                    </>
                  );
                })()}
              </g>
            </g>
          );
        })}

        {/* Nut */}
        {startFret === 1 && (
          <rect
            x={padLeft - 2}
            y={neckTop - 4}
            width={stringGap * 5 + 4}
            height={4}
            fill="#1a0f08"
          />
        )}
        {startFret > 1 && (
          <text
            x={padLeft - 10}
            y={neckTop + fretHeight / 2 + 4}
            textAnchor="end"
            fontSize={12}
            fill="#6b5b4a"
            fontFamily="'Fraunces', serif"
            fontStyle="italic"
          >
            {startFret}fr
          </text>
        )}

        {/* Fret lines */}
        {Array.from({ length: NUM_VISIBLE + 1 }).map((_, i) => (
          <line
            key={i}
            x1={padLeft}
            y1={neckTop + i * fretHeight}
            x2={padLeft + stringGap * 5}
            y2={neckTop + i * fretHeight}
            stroke="#8a7560"
            strokeWidth={i === 0 && startFret === 1 ? 0 : 1}
          />
        ))}

        {/* Position inlays */}
        {Array.from({ length: NUM_VISIBLE }).map((_, i) => {
          const absFret = startFret + i;
          const cy = neckTop + i * fretHeight + fretHeight / 2;
          if (doubleInlayFrets.has(absFret)) {
            return (
              <g key={i} opacity={0.25}>
                <circle
                  cx={padLeft + stringGap * 1.5}
                  cy={cy}
                  r={4}
                  fill="#1a0f08"
                />
                <circle
                  cx={padLeft + stringGap * 3.5}
                  cy={cy}
                  r={4}
                  fill="#1a0f08"
                />
              </g>
            );
          }
          if (inlayFrets.has(absFret)) {
            return (
              <circle
                key={i}
                cx={padLeft + stringGap * 2.5}
                cy={cy}
                r={4}
                fill="#1a0f08"
                opacity={0.25}
              />
            );
          }
          return null;
        })}

        {/* Strings */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={i}
            x1={stringX(i)}
            y1={neckTop}
            x2={stringX(i)}
            y2={neckBottom}
            stroke="#8a7560"
            strokeWidth={i < 3 ? 1.6 : 1}
          />
        ))}

        {/* Diatonic ghost dots */}
        {diatonicMode &&
          highlights &&
          Array.from({ length: 6 }).flatMap((_, sIdx) =>
            Array.from({ length: NUM_VISIBLE }).map((_, fIdx) => {
              const absFret = startFret + fIdx;
              const pc = cellPC(sIdx, absFret);
              if (!highlights.has(pc)) return null;
              if (frets[sIdx] === absFret) return null; // hide if we already placed a dot here
              const cy = neckTop + fIdx * fretHeight + fretHeight / 2;
              const isRoot = highlights.rootPC === pc;
              return (
                <circle
                  key={`ghost-${sIdx}-${fIdx}`}
                  cx={stringX(sIdx)}
                  cy={cy}
                  r={9}
                  fill={isRoot ? "#b7410e" : "#fbf4e3"}
                  stroke={isRoot ? "#1a0f08" : "#8a7560"}
                  strokeWidth={1}
                  opacity={0.55}
                  pointerEvents="none"
                />
              );
            })
          )}

        {/* Invisible tap zones */}
        {Array.from({ length: 6 }).flatMap((_, sIdx) =>
          Array.from({ length: NUM_VISIBLE }).map((_, fIdx) => (
            <rect
              key={`cell-${sIdx}-${fIdx}`}
              x={stringX(sIdx) - stringGap / 2}
              y={neckTop + fIdx * fretHeight}
              width={stringGap}
              height={fretHeight}
              fill="transparent"
              onClick={() => handleFretTap(sIdx, startFret + fIdx)}
              style={{ cursor: "pointer" }}
            />
          ))
        )}

        {/* Placed dots */}
        {frets.map((f, i) => {
          if (f === null || f === undefined) return null;
          if (f === 0) return null; // open strings render via the ○ toggle only
          if (f < startFret || f > endFret) return null;
          const cy = neckTop + (f - startFret) * fretHeight + fretHeight / 2;

          const key = `${i}-${f}`;
          const intervalLabel = chordIntervals?.get?.(key) || null;
          const isGuideTone =
            intervalLabel && GUIDE_TONES.has(intervalLabel);
          const isRoot = intervalLabel === "R";

          const fillColor =
            colorByInterval && intervalLabel
              ? INTERVAL_COLORS[intervalLabel] || "#1a0f08"
              : "#1a0f08";

          const opacity =
            guideTonesMode && intervalLabel && !isGuideTone && !isRoot
              ? 0.28
              : 1;

          const radius = isRoot ? 14 : 13;

          return (
            <g key={i} pointerEvents="none" opacity={opacity}>
              <circle
                cx={stringX(i)}
                cy={cy}
                r={radius}
                fill={fillColor}
                stroke={isRoot ? "#1a0f08" : "#b7410e"}
                strokeWidth={isRoot ? 2.2 : 1.5}
              />
              <text
                x={stringX(i)}
                y={cy + 4}
                textAnchor="middle"
                fontSize={10}
                fill="#f2e8d5"
                fontFamily="'Fraunces', serif"
                fontWeight={600}
              >
                {intervalLabel && colorByInterval ? intervalLabel : f}
              </text>
            </g>
          );
        })}

        {/* Off-screen markers */}
        {frets.map((f, i) => {
          if (f === null || f === undefined || f === 0) return null;
          if (f >= startFret && f <= endFret) return null;
          const direction = f < startFret ? "up" : "down";
          const y = direction === "up" ? neckTop - 2 : neckBottom + 12;
          return (
            <text
              key={`off-${i}`}
              x={stringX(i)}
              y={y}
              textAnchor="middle"
              fontSize={9}
              fill="#b7410e"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={700}
            >
              {direction === "up" ? `↑${f}` : `↓${f}`}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
