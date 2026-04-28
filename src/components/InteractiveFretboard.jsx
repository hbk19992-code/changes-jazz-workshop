// Realistic horizontal fretboard. Looks like a slice of an actual guitar
// neck, with rosewood, brass frets, pearl inlays, and shadowed strings.
//
// Click/tap a cell to toggle. Drag horizontally or use the wheel to shift
// the visible window. ↑/↓ arrow buttons + position-jump chips also work.

import { useRef, useEffect } from "react";
import {
  OPEN_STRINGS,
  STRING_FREQS,
  INTERVAL_COLORS,
  GUIDE_TONES,
} from "../constants.js";

const NOTE_NAMES_FLAT = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

// Equal-tempered fret distances. fret n sits at scale * (1 - 1/2^(n/12))
// We pre-compute relative positions for frets 1..24 along a unit-length neck.
const FRET_POSITIONS_UNIT = Array.from({ length: 25 }, (_, n) =>
  n === 0 ? 0 : 1 - Math.pow(2, -n / 12)
);

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
  const NUM_VISIBLE = 5;
  const MAX_START = 20;
  const endFret = startFret + NUM_VISIBLE - 1;

  // viewBox 600 × 520 — proportionally taller so string gaps don't collapse
  // when the container is narrow (mobile). Net effect: each string gap is
  // big enough that dots clearly separate from each other.
  const W = 600;
  const H = 520;
  const padLeft = 80;
  const padRight = 36;
  const neckTop = 50;
  const neckBottom = 470;
  const neckH = neckBottom - neckTop;
  // 6 strings, evenly spaced. With margin = half-gap on both top and bottom,
  // the layout is perfectly symmetric and string spacing is uniform.
  const stringGap = neckH / 6;
  const stringTop = neckTop + stringGap / 2;

  // Compute the visible fret window's positions.
  // We treat the visible window as one "scale-length unit" but offset by the
  // starting fret's position. Multiplying by a scale factor stretches it
  // across the available width. This gives realistic narrowing.
  const visibleW = W - padLeft - padRight;
  const fromUnit = FRET_POSITIONS_UNIT[startFret - 1];
  const toUnit = FRET_POSITIONS_UNIT[startFret + NUM_VISIBLE - 1];
  const unitSpan = toUnit - fromUnit;

  const fretX = (absFret) => {
    const u = FRET_POSITIONS_UNIT[absFret];
    return padLeft + ((u - fromUnit) / unitSpan) * visibleW;
  };

  // String Y position (high e top, low E bottom - standard tab view)
  const stringY = (i) => stringTop + (5 - i) * stringGap;

  // Note dot is centered between (fret-1) and (fret) lines
  const dotX = (absFret) => {
    if (absFret === 0) return padLeft - 36; // open string column left of nut
    const x1 = absFret === 1 ? padLeft + 6 : fretX(absFret - 1);
    const x2 = fretX(absFret);
    return (x1 + x2) / 2;
  };

  // –– Drag state ––
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startFret: 1,
    moved: false,
  });
  const svgRef = useRef(null);
  const DRAG_THRESHOLD = 6;
  const DRAG_PIXELS_PER_FRET = 80; // wider cells → longer drag per fret

  // –– Wheel scroll (both horizontal and vertical wheels move position) ––
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const dir = delta > 0 ? 1 : -1;
      setStartFret((prev) => Math.max(1, Math.min(MAX_START, prev + dir)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setStartFret]);

  const startDrag = (e) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startFret,
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const moveDrag = (e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < DRAG_THRESHOLD) return;
    dragRef.current.moved = true;
    // Drag right → reveal lower frets (move backward); drag left → higher frets
    const fretDelta = Math.round(-dx / DRAG_PIXELS_PER_FRET);
    const next = Math.max(
      1,
      Math.min(MAX_START, dragRef.current.startFret + fretDelta)
    );
    if (next !== startFret) setStartFret(next);
  };
  const endDrag = (e) => {
    dragRef.current.active = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // –– Note placement ––
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

  const handleFretClick = (i, absoluteFret) => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    if (frets[i] === absoluteFret) setString(i, null);
    else setString(i, absoluteFret);
  };

  const inlayFrets = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
  const doubleInlayFrets = new Set([12, 24]);
  const cellPC = (sIdx, absFret) => (OPEN_STRINGS[sIdx] + absFret) % 12;

  const positions = [
    { label: "Nut", fret: 1 },
    { label: "3fr", fret: 3 },
    { label: "5fr", fret: 5 },
    { label: "7fr", fret: 7 },
    { label: "9fr", fret: 9 },
    { label: "12fr", fret: 12 },
  ];

  return (
    <div className="flex flex-col items-stretch select-none w-full">
      {/* Top control row */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStartFret(Math.max(1, startFret - 1))}
            disabled={startFret <= 1}
            className="w-8 h-8 border border-[#1a0f08] bg-[#fbf4e3] hover:bg-[#ead79f] active:bg-[#d9c299] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            style={{ fontFamily: "'Fraunces', serif" }}
          >←</button>
          <span
            className="tracking-widest text-[#6b5b4a] italic min-w-[78px] text-center text-xs"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {startFret}–{endFret} fr
          </span>
          <button
            onClick={() => setStartFret(Math.min(MAX_START, startFret + 1))}
            disabled={startFret >= MAX_START}
            className="w-8 h-8 border border-[#1a0f08] bg-[#fbf4e3] hover:bg-[#ead79f] active:bg-[#d9c299] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            style={{ fontFamily: "'Fraunces', serif" }}
          >→</button>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {positions.map((p) => (
            <button
              key={p.fret}
              onClick={() => setStartFret(p.fret)}
              className={`px-2 py-0.5 text-[10px] tracking-widest uppercase border transition-colors ${ startFret === p.fret ? "bg-[#1a0f08] text-[#fbf4e3] border-[#1a0f08]" : "bg-transparent border-[#1a0f08]/30 hover:border-[#1a0f08] text-[#6b5b4a]" }`}
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[9px] tracking-[0.25em] uppercase text-[#8a7560] mb-2 italic text-center">
        탭/클릭으로 음 추가 · 좌우로 끌어 이동 · 휠 스크롤
      </p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ touchAction: "none", userSelect: "none" }}
      >
        <defs>
          <radialGradient id="rosewood" cx="0.5" cy="0.5" r="0.7">
            <stop offset="0" stopColor="#8a5a36" />
            <stop offset="0.6" stopColor="#6a4226" />
            <stop offset="1" stopColor="#3d2614" />
          </radialGradient>
          <linearGradient id="metalString" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffbe8" />
            <stop offset="0.5" stopColor="#f0d8a0" />
            <stop offset="1" stopColor="#b8965e" />
          </linearGradient>
          <linearGradient id="bassString" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0d8a8" />
            <stop offset="0.5" stopColor="#b89868" />
            <stop offset="1" stopColor="#6e5634" />
          </linearGradient>
          <linearGradient id="brassFret" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff4cc" />
            <stop offset="0.4" stopColor="#e0bc7a" />
            <stop offset="1" stopColor="#9a7a44" />
          </linearGradient>
          <filter id="dotShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.7" />
            <feOffset dx="0" dy="1.5" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.55" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Drag/scroll background catches all pointer events not on tap zones */}
        <rect
          x={padLeft}
          y={neckTop}
          width={W - padLeft - padRight}
          height={neckH}
          fill="transparent"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ cursor: "grab" }}
        />

        {/* Fingerboard */}
        <rect
          x={padLeft}
          y={neckTop}
          width={W - padLeft - padRight}
          height={neckH}
          fill="url(#rosewood)"
          rx="2"
          pointerEvents="none"
        />

        {/* Wood grain streaks */}
        <g opacity={0.35} pointerEvents="none">
          {[0.18, 0.42, 0.66, 0.86].map((yFrac, i) => {
            const yLine = neckTop + neckH * yFrac;
            return (
              <path
                key={i}
                d={`M${padLeft},${yLine} Q${padLeft + visibleW / 3},${yLine - 1} ${
                  padLeft + visibleW / 2
                },${yLine + 1} T${W - padRight},${yLine}`}
                stroke={i % 2 ? "#2a160a" : "#1a0d05"}
                strokeWidth={0.5}
                fill="none"
              />
            );
          })}
        </g>

        {/* Nut (only when at the start of the neck) */}
        {startFret === 1 && (
          <g pointerEvents="none">
            <rect
              x={padLeft - 2}
              y={neckTop - 2}
              width={9}
              height={neckH + 4}
              fill="#f8efd4"
              stroke="#1a0f08"
              strokeWidth={0.8}
            />
            <rect x={padLeft - 1} y={neckTop - 1} width={2.5} height={neckH + 2} fill="#fffbe8" opacity={0.6} />
          </g>
        )}
        {startFret > 1 && (
          <text
            x={padLeft - 10}
            y={neckTop + neckH / 2 + 5}
            textAnchor="end"
            fontSize={13}
            fill="#6b5b4a"
            fontFamily="'Fraunces', serif"
            fontStyle="italic"
            fontWeight={600}
            pointerEvents="none"
          >
            {startFret}fr
          </text>
        )}

        {/* Frets (Safari Bug Fix: line 대신 rect 사용) */}
        {Array.from({ length: NUM_VISIBLE }).map((_, i) => {
          const absFret = startFret + i;
          const x = fretX(absFret);
          return (
            <g key={absFret} pointerEvents="none">
              <rect x={x - 2.25} y={neckTop} width={4.5} height={neckH} fill="#3a2510" />
              <rect x={x - 1.5} y={neckTop} width={3} height={neckH} fill="url(#brassFret)" />
            </g>
          );
        })}

        {/* Pearl inlays */}
        {Array.from({ length: NUM_VISIBLE }).map((_, i) => {
          const absFret = startFret + i;
          const cx = dotX(absFret);
          const cy = neckTop + neckH / 2;
          if (doubleInlayFrets.has(absFret)) {
            return (
              <g key={absFret} pointerEvents="none">
                <circle cx={cx} cy={neckTop + neckH * 0.3} r={7} fill="#e8dcbe" />
                <circle cx={cx - 1.5} cy={neckTop + neckH * 0.3 - 2.5} r={2} fill="#fffce8" opacity={0.7} />
                <circle cx={cx} cy={neckTop + neckH * 0.7} r={7} fill="#e8dcbe" />
                <circle cx={cx - 1.5} cy={neckTop + neckH * 0.7 - 2.5} r={2} fill="#fffce8" opacity={0.7} />
              </g>
            );
          }
          if (inlayFrets.has(absFret)) {
            return (
              <g key={absFret} pointerEvents="none">
                <circle cx={cx} cy={cy} r={8} fill="#e8dcbe" />
                <circle cx={cx - 1.5} cy={cy - 3} r={2.2} fill="#fffce8" opacity={0.7} />
              </g>
            );
          }
          return null;
        })}

        {/* Strings Shadows (Safari Bug Fix: line 대신 rect 사용) */}
        <g pointerEvents="none" opacity={0.4}>
          {[5.2, 4.4, 3.6, 2.8, 2.2, 1.6].map((sw, i) => (
            <rect
              key={`sh-${i}`}
              x={padLeft}
              y={stringY(i) - sw / 2 + 1.5}
              width={visibleW}
              height={sw}
              fill="#1a0d05"
            />
          ))}
        </g>

        {/* Actual Strings (Safari Bug Fix: line 대신 rect 사용) */}
        <g pointerEvents="none">
          {[5.2, 4.4, 3.6].map((sw, i) => (
            <rect
              key={`str-${i}`}
              x={padLeft}
              y={stringY(i) - sw / 2}
              width={visibleW}
              height={sw}
              fill="url(#bassString)"
            />
          ))}
          {[2.8, 2.2, 1.6].map((sw, i) => (
            <rect
              key={`str-${i + 3}`}
              x={padLeft}
              y={stringY(i + 3) - sw / 2}
              width={visibleW}
              height={sw}
              fill="url(#metalString)"
            />
          ))}
        </g>

        {/* String labels left of nut */}
        {["E", "A", "D", "G", "B", "e"].map((label, i) => (
          <text
            key={i}
            x={padLeft - 16}
            y={stringY(i) + 4}
            textAnchor="end"
            fontSize={13}
            fill="#6b5b4a"
            fontFamily="'Fraunces', serif"
            fontStyle="italic"
            pointerEvents="none"
          >
            {label}
          </text>
        ))}

        {/* Mute (×) and Open (○) toggles in left margin */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const val = frets[i];
          const isMuted = val === null || val === undefined;
          const isOpen = val === 0;
          const y = stringY(i);
          const openKey = `${i}-0`;
          const iv = chordIntervals?.get?.(openKey) || null;

          // Single column at x=30 — toggles between × ↔ ○ ↔ blank
          // Click cycles; for clarity we show the active state as a colored circle/×
          if (isMuted) {
            return (
              <g key={i} onClick={() => setString(i, 0)} style={{ cursor: "pointer" }}>
                <text
                  x={36}
                  y={y + 7}
                  textAnchor="middle"
                  fontSize={22}
                  fill="#6b1f2e"
                  fontWeight={700}
                  fontFamily="'Fraunces', serif"
                >
                  ×
                </text>
                <rect x={22} y={y - 14} width={28} height={28} fill="transparent" />
              </g>
            );
          }
          if (isOpen) {
            const fillColor =
              colorByInterval && iv
                ? INTERVAL_COLORS[iv] || "#b7410e"
                : "transparent";
            return (
              <g key={i} onClick={() => setString(i, null)} style={{ cursor: "pointer" }}>
                <circle
                  cx={36}
                  cy={y}
                  r={14}
                  fill={fillColor}
                  stroke="#1a0f08"
                  strokeWidth={2}
                />
                {colorByInterval && iv && (
                  <text
                    x={36}
                    y={y + 5}
                    textAnchor="middle"
                    fontSize={iv.length > 1 ? 11 : 13}
                    fill="#fbf4e3"
                    fontWeight={700}
                    fontFamily="'Fraunces', serif"
                  >
                    {iv}
                  </text>
                )}
              </g>
            );
          }
          // Fretted — show small × that lets the user mute again
          return (
            <g
              key={i}
              onClick={() => setString(i, null)}
              style={{ cursor: "pointer" }}
              className="opacity-25 hover:opacity-80 transition-opacity"
            >
              <text
                x={36}
                y={y + 5}
                textAnchor="middle"
                fontSize={14}
                fill="#8a7560"
                fontFamily="'Fraunces', serif"
              >
                ×
              </text>
              <rect x={22} y={y - 14} width={28} height={28} fill="transparent" />
            </g>
          );
        })}

        {/* Diatonic ghost dots */}
        {diatonicMode &&
          highlights &&
          Array.from({ length: 6 }).flatMap((_, sIdx) =>
            Array.from({ length: NUM_VISIBLE }).map((_, fIdx) => {
              const absFret = startFret + fIdx;
              const pc = cellPC(sIdx, absFret);
              if (!highlights.has(pc)) return null;
              if (frets[sIdx] === absFret) return null;
              const cx = dotX(absFret);
              const cy = stringY(sIdx);
              const isRoot = highlights.rootPC === pc;
              return (
                <circle
                  key={`ghost-${sIdx}-${fIdx}`}
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill={isRoot ? "#b7410e" : "#fbf4e3"}
                  stroke={isRoot ? "#1a0f08" : "#8a7560"}
                  strokeWidth={1.2}
                  opacity={0.55}
                  pointerEvents="none"
                />
              );
            })
          )}

        {/* Tap zones — invisible per-cell click targets that ALSO accept drag */}
        {Array.from({ length: 6 }).flatMap((_, sIdx) =>
          Array.from({ length: NUM_VISIBLE }).map((_, fIdx) => {
            const absFret = startFret + fIdx;
            const cellLeft = absFret === startFret
              ? (startFret === 1 ? padLeft + 5 : padLeft)
              : fretX(absFret - 1);
            const cellRight = fretX(absFret);
            const cellW = Math.max(0, cellRight - cellLeft);
            return (
              <rect
                key={`cell-${sIdx}-${fIdx}`}
                x={cellLeft}
                y={stringY(sIdx) - stringGap / 2}
                width={cellW}
                height={stringGap}
                fill="transparent"
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onClick={() => handleFretClick(sIdx, absFret)}
                style={{ cursor: "pointer", touchAction: "none" }}
              />
            );
          })
        )}

        {/* Placed dots — fretted notes (skip 0 = open, drawn in left margin) */}
        {frets.map((f, i) => {
          if (f === null || f === undefined || f === 0) return null;
          if (f < startFret || f > endFret) return null;
          const cx = dotX(f);
          const cy = stringY(i);

          const key = `${i}-${f}`;
          const intervalLabel = chordIntervals?.get?.(key) || null;
          const isGuideTone = intervalLabel && GUIDE_TONES.has(intervalLabel);
          const isRoot = intervalLabel === "R";

          const fillColor =
            colorByInterval && intervalLabel
              ? INTERVAL_COLORS[intervalLabel] || "#1a0f08"
              : "#1a0f08";

          const opacity =
            guideTonesMode && intervalLabel && !isGuideTone && !isRoot ? 0.28 : 1;

          const radius = isRoot ? 21 : 19;
          const pc = cellPC(i, f);
          const noteName = NOTE_NAMES_FLAT[pc];
          const label = colorByInterval && intervalLabel ? intervalLabel : noteName;
          const fontSize = label.length > 1 ? 14 : 16;

          return (
            <g key={i} pointerEvents="none" opacity={opacity} filter="url(#dotShadow)">
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={fillColor}
                stroke={isRoot ? "#1a0f08" : "#b7410e"}
                strokeWidth={isRoot ? 2.4 : 2}
              />
              <text
                x={cx}
                y={cy + 5.5}
                textAnchor="middle"
                fontSize={fontSize}
                fill="#fbf4e3"
                fontFamily="'Fraunces', serif"
                fontWeight={700}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Off-screen markers */}
        {frets.map((f, i) => {
          if (f === null || f === undefined || f === 0) return null;
          if (f >= startFret && f <= endFret) return null;
          const direction = f < startFret ? "left" : "right";
          const x = direction === "left" ? padLeft + 6 : W - padRight - 14;
          return (
            <text
              key={`off-${i}`}
              x={x}
              y={stringY(i) + 4}
              textAnchor={direction === "left" ? "start" : "end"}
              fontSize={11}
              fill="#fff8d8"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={700}
              pointerEvents="none"
            >
              {direction === "left" ? `←${f}` : `${f}→`}
            </text>
          );
        })}

        {/* Fret numbers below */}
        {Array.from({ length: NUM_VISIBLE }).map((_, i) => {
          const absFret = startFret + i;
          const cx = dotX(absFret);
          return (
            <text
              key={`fnum-${absFret}`}
              x={cx}
              y={H - 14}
              textAnchor="middle"
              fontSize={11}
              fill="#6b5b4a"
              fontFamily="'JetBrains Mono', monospace"
              pointerEvents="none"
            >
              {absFret}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
