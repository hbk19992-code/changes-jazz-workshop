// The tappable fretboard.
// Click/tap a cell to toggle a note. Drag the empty neck area to shift
// position. Mouse wheel and ↑/↓ buttons also shift position.
// When coloring is on, each dot shows its chord-function role (R, 3, ♭7…).

import { useRef, useEffect } from "react";
import {
  OPEN_STRINGS,
  STRING_FREQS,
  INTERVAL_COLORS,
  GUIDE_TONES,
} from "../constants.js";

const NOTE_NAMES_FLAT = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

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
  const NUM_VISIBLE = 8;
  const MAX_START = 17;
  const endFret = startFret + NUM_VISIBLE - 1;

  // Larger canvas → easier desktop click targets
  const W = 360;
  const padLeft = 44;
  const padRight = 28;
  const topMute = 18;
  const topOpen = 44;
  const neckTop = 78;
  const fretHeight = 50;
  const stringGap = (W - padLeft - padRight) / 5;
  const neckBottom = neckTop + NUM_VISIBLE * fretHeight;
  const H = neckBottom + 28;

  const stringX = (i) => padLeft + i * stringGap;

  // Drag state in a ref so pointer moves don't cause re-renders
  const dragRef = useRef({
    active: false,
    startY: 0,
    startX: 0,
    startFret: 1,
    moved: false,
    pointerId: null,
  });
  const svgRef = useRef(null);

  // Pixel threshold before a touch counts as a drag rather than a tap.
  // Smaller = more responsive but more false drags. 6px feels right on iOS.
  const DRAG_THRESHOLD = 6;

  // Wheel scrolling — natural for desktop
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      setStartFret((prev) => Math.max(1, Math.min(MAX_START, prev + dir)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setStartFret]);

  // Drag handlers — used by both the empty-neck background AND tap zones.
  // The "moved" flag lets handleFretClick decide whether to swallow the click.
  const startDrag = (e) => {
    dragRef.current = {
      active: true,
      startY: e.clientY,
      startX: e.clientX,
      startFret,
      moved: false,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const moveDrag = (e) => {
    if (!dragRef.current.active) return;
    const dy = e.clientY - dragRef.current.startY;
    const dx = e.clientX - dragRef.current.startX;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < DRAG_THRESHOLD) return; // not a drag yet, just a hold

    dragRef.current.moved = true;
    const fretDelta = Math.round(-dy / 32);
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
    { label: "5fr", fret: 5 },
    { label: "7fr", fret: 7 },
    { label: "9fr", fret: 9 },
    { label: "12fr", fret: 12 },
    { label: "15fr", fret: 15 },
  ];

  return (
    <div className="flex flex-col items-center select-none">
      {/* Position controls */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setStartFret(Math.max(1, startFret - 1))}
          disabled={startFret <= 1}
          className="w-9 h-9 border border-[#1a0f08] bg-[#fbf4e3] hover:bg-[#ead79f] active:bg-[#d9c299] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-base font-semibold"
          style={{ fontFamily: "'Fraunces', serif" }}
          title="한 칸 위로"
        >↑</button>
        <span
          className="tracking-widest text-[#6b5b4a] italic min-w-[88px] text-center text-sm"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {startFret}–{endFret} fr
        </span>
        <button
          onClick={() => setStartFret(Math.min(MAX_START, startFret + 1))}
          disabled={startFret >= MAX_START}
          className="w-9 h-9 border border-[#1a0f08] bg-[#fbf4e3] hover:bg-[#ead79f] active:bg-[#d9c299] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-base font-semibold"
          style={{ fontFamily: "'Fraunces', serif" }}
          title="한 칸 아래로"
        >↓</button>
      </div>

      {/* Quick position jumps */}
      <div className="flex items-center gap-1 mb-2 flex-wrap justify-center">
        {positions.map((p) => (
          <button
            key={p.fret}
            onClick={() => setStartFret(p.fret)}
            className={`px-2 py-0.5 text-[10px] tracking-widest uppercase border transition-colors ${
              startFret === p.fret
                ? "bg-[#1a0f08] text-[#fbf4e3] border-[#1a0f08]"
                : "bg-transparent border-[#1a0f08]/30 hover:border-[#1a0f08] text-[#6b5b4a]"
            }`}
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="text-[9px] tracking-[0.25em] uppercase text-[#8a7560] mb-1 italic">
        탭/클릭으로 음 추가 · 위아래로 끌어 이동 · 휠 스크롤
      </p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[420px]"
        style={{ touchAction: "none" }}
      >
        {/* String labels */}
        {["E", "A", "D", "G", "B", "e"].map((label, i) => (
          <text
            key={i}
            x={stringX(i)}
            y={11}
            textAnchor="middle"
            fontSize={11}
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
          const openKey = `${i}-0`;
          const iv = chordIntervals?.get?.(openKey) || null;
          const openFill =
            isOpen && colorByInterval && iv
              ? INTERVAL_COLORS[iv] || "#b7410e"
              : isOpen
              ? "#b7410e"
              : "transparent";

          return (
            <g key={i}>
              <g onClick={() => setString(i, null)} style={{ cursor: "pointer" }}>
                <rect
                  x={x - 13}
                  y={topMute - 9}
                  width={26}
                  height={18}
                  fill={isMuted ? "#1a0f08" : "transparent"}
                  stroke="#1a0f08"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={topMute + 5}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={700}
                  fill={isMuted ? "#f2e8d5" : "#1a0f08"}
                  fontFamily="'Fraunces', serif"
                  pointerEvents="none"
                >×</text>
              </g>
              <g onClick={() => setString(i, 0)} style={{ cursor: "pointer" }}>
                <rect
                  x={x - 13}
                  y={topOpen - 9}
                  width={26}
                  height={18}
                  fill={openFill}
                  stroke="#1a0f08"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={topOpen + 5}
                  textAnchor="middle"
                  fontSize={isOpen && colorByInterval && iv ? 10 : 12}
                  fontWeight={700}
                  fill={isOpen ? "#fbf4e3" : "#1a0f08"}
                  fontFamily="'Fraunces', serif"
                  pointerEvents="none"
                >
                  {isOpen && colorByInterval && iv ? iv : "○"}
                </text>
              </g>
            </g>
          );
        })}

        {/* Drag-scroll background — invisible, behind tap zones */}
        <rect
          x={padLeft}
          y={neckTop}
          width={stringGap * 5}
          height={NUM_VISIBLE * fretHeight}
          fill="transparent"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          style={{ cursor: "grab" }}
        />

        {/* Nut */}
        {startFret === 1 && (
          <rect
            x={padLeft - 3}
            y={neckTop - 5}
            width={stringGap * 5 + 6}
            height={5}
            fill="#1a0f08"
          />
        )}
        {startFret > 1 && (
          <text
            x={padLeft - 12}
            y={neckTop + fretHeight / 2 + 4}
            textAnchor="end"
            fontSize={13}
            fill="#6b5b4a"
            fontFamily="'Fraunces', serif"
            fontStyle="italic"
            fontWeight={600}
          >{startFret}fr</text>
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
            strokeWidth={i === 0 && startFret === 1 ? 0 : 1.2}
          />
        ))}

        {/* Fret numbers down the right side */}
        {Array.from({ length: NUM_VISIBLE }).map((_, i) => {
          const absFret = startFret + i;
          return (
            <text
              key={`fnum-${i}`}
              x={W - padRight + 6}
              y={neckTop + i * fretHeight + fretHeight / 2 + 4}
              textAnchor="start"
              fontSize={9}
              fill="#8a7560"
              fontFamily="'JetBrains Mono', monospace"
            >
              {absFret}
            </text>
          );
        })}

        {/* Position inlays */}
        {Array.from({ length: NUM_VISIBLE }).map((_, i) => {
          const absFret = startFret + i;
          const cy = neckTop + i * fretHeight + fretHeight / 2;
          if (doubleInlayFrets.has(absFret)) {
            return (
              <g key={i} opacity={0.4}>
                <circle cx={padLeft + stringGap * 1.5} cy={cy} r={5} fill="#1a0f08" />
                <circle cx={padLeft + stringGap * 3.5} cy={cy} r={5} fill="#1a0f08" />
              </g>
            );
          }
          if (inlayFrets.has(absFret)) {
            return (
              <circle
                key={i}
                cx={padLeft + stringGap * 2.5}
                cy={cy}
                r={5}
                fill="#1a0f08"
                opacity={0.35}
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
            strokeWidth={i < 3 ? 1.8 : 1.1}
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
              if (frets[sIdx] === absFret) return null;
              const cy = neckTop + fIdx * fretHeight + fretHeight / 2;
              const isRoot = highlights.rootPC === pc;
              return (
                <circle
                  key={`ghost-${sIdx}-${fIdx}`}
                  cx={stringX(sIdx)}
                  cy={cy}
                  r={10}
                  fill={isRoot ? "#b7410e" : "#fbf4e3"}
                  stroke={isRoot ? "#1a0f08" : "#8a7560"}
                  strokeWidth={1}
                  opacity={0.55}
                  pointerEvents="none"
                />
              );
            })
          )}

        {/* Tap zones — handle both clicks AND drags so the fretboard can be
            scrolled by dragging anywhere, not just empty space */}
        {Array.from({ length: 6 }).flatMap((_, sIdx) =>
          Array.from({ length: NUM_VISIBLE }).map((_, fIdx) => (
            <rect
              key={`cell-${sIdx}-${fIdx}`}
              x={stringX(sIdx) - stringGap / 2}
              y={neckTop + fIdx * fretHeight}
              width={stringGap}
              height={fretHeight}
              fill="transparent"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClick={() => handleFretClick(sIdx, startFret + fIdx)}
              style={{ cursor: "pointer", touchAction: "none" }}
            />
          ))
        )}

        {/* Placed dots */}
        {frets.map((f, i) => {
          if (f === null || f === undefined) return null;
          if (f === 0) return null;
          if (f < startFret || f > endFret) return null;
          const cy = neckTop + (f - startFret) * fretHeight + fretHeight / 2;

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
          const radius = isRoot ? 16 : 15;
          const pc = cellPC(i, f);
          const noteName = NOTE_NAMES_FLAT[pc];

          return (
            <g key={i} pointerEvents="none" opacity={opacity}>
              <circle
                cx={stringX(i)}
                cy={cy}
                r={radius}
                fill={fillColor}
                stroke={isRoot ? "#1a0f08" : "#b7410e"}
                strokeWidth={isRoot ? 2.4 : 1.6}
              />
              <text
                x={stringX(i)}
                y={cy + 4}
                textAnchor="middle"
                fontSize={11}
                fill="#f2e8d5"
                fontFamily="'Fraunces', serif"
                fontWeight={700}
              >
                {intervalLabel && colorByInterval ? intervalLabel : noteName}
              </text>
            </g>
          );
        })}

        {/* Off-screen markers */}
        {frets.map((f, i) => {
          if (f === null || f === undefined || f === 0) return null;
          if (f >= startFret && f <= endFret) return null;
          const direction = f < startFret ? "up" : "down";
          const y = direction === "up" ? neckTop - 3 : neckBottom + 14;
          return (
            <text
              key={`off-${i}`}
              x={stringX(i)}
              y={y}
              textAnchor="middle"
              fontSize={10}
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
