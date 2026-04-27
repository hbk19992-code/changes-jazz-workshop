// Compact non-interactive fretboard diagram used in library/compare/sequencer
// thumbnails. Auto-scales the visible window so high-position voicings still
// render inside the same box.

export function MiniDiagram({ frets }) {
  const nonZero = frets.filter((f) => f !== null && f > 0);
  const minFret = nonZero.length ? Math.min(...nonZero) : 1;
  const maxFret = nonZero.length ? Math.max(...nonZero) : 1;
  const startFret = maxFret > 4 ? minFret : 1;
  const numFrets = 4;

  const W = 90,
    H = 110;
  const pad = 10,
    top = 22;
  const sGap = (W - pad * 2) / 5;
  const fGap = (H - top - 12) / numFrets;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block">
      {startFret === 1 ? (
        <rect x={pad - 1} y={top - 3} width={W - pad * 2 + 2} height={3} fill="#1a0f08" />
      ) : (
        <text
          x={pad - 4}
          y={top + fGap / 2 + 3}
          textAnchor="end"
          fontSize={8}
          fill="#6b5b4a"
          fontStyle="italic"
          fontFamily="'Fraunces', serif"
        >
          {startFret}
        </text>
      )}

      {Array.from({ length: numFrets + 1 }).map((_, i) => (
        <line
          key={i}
          x1={pad}
          y1={top + i * fGap}
          x2={W - pad}
          y2={top + i * fGap}
          stroke="#8a7560"
          strokeWidth={0.8}
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={i}
          x1={pad + i * sGap}
          y1={top}
          x2={pad + i * sGap}
          y2={top + numFrets * fGap}
          stroke="#8a7560"
          strokeWidth={0.6}
        />
      ))}

      {frets.map((f, i) => {
        const x = pad + i * sGap;
        if (f === null)
          return (
            <g key={i} stroke="#6b5b4a" strokeWidth={1} strokeLinecap="round">
              <line x1={x - 2.5} y1={top - 8} x2={x + 2.5} y2={top - 3} />
              <line x1={x - 2.5} y1={top - 3} x2={x + 2.5} y2={top - 8} />
            </g>
          );
        if (f === 0)
          return (
            <circle
              key={i}
              cx={x}
              cy={top - 5}
              r={2.5}
              fill="none"
              stroke="#6b5b4a"
              strokeWidth={1}
            />
          );
        const fIdx = f - startFret;
        if (fIdx < 0 || fIdx >= numFrets) return null;
        return (
          <circle
            key={i}
            cx={x}
            cy={top + fIdx * fGap + fGap / 2}
            r={3.5}
            fill="#1a0f08"
          />
        );
      })}
    </svg>
  );
}
