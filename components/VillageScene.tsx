// Paisaje ilustrado de fondo para la vista de aldea (estilo juego de navegador).
// Capas: cielo → montañas lejanas → colinas → pradera → río → camino → empalizada → árboles → grano.

const TREES: [number, number, number][] = [
  [60, 250, 1.1], [110, 270, 0.9], [150, 240, 1], [880, 250, 1.1], [930, 280, 0.9], [960, 235, 1],
  [40, 470, 1.3], [95, 520, 1.1], [70, 575, 1.2], [930, 470, 1.2], [965, 540, 1.3], [900, 585, 1.1],
  [210, 590, 1], [800, 595, 1.05], [500, 600, 0.9], [330, 225, 0.8], [690, 222, 0.8],
];

const STAKES = Array.from({ length: 120 }, (_, i) => {
  const a = (i / 120) * Math.PI * 2;
  return { x: 500 + Math.cos(a) * 445, y: 395 + Math.sin(a) * 200, i };
}).filter(s => !(s.y > 520 && Math.abs(s.x - 500) < 40)) // hueco = puerta sur
  .sort((a, b) => a.y - b.y);

const TREES_SORTED = [...TREES].sort((a, b) => a[1] - b[1]);

function SceneTree({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke="#3b2412" strokeWidth={1.6} strokeLinejoin="round">
      <ellipse cx={4} cy={2} rx={20} ry={6} fill="rgba(40,60,20,0.25)" stroke="none" />
      <rect x={-3} y={-14} width={6} height={16} fill="#6b4423" />
      <path d="M0 -58 C26 -54 28 -16 0 -14 C-28 -16 -26 -54 0 -58 Z" fill="#6fa043" />
      <path d="M6 -50 C20 -42 18 -22 3 -18" fill="none" stroke="#4b7a2a" strokeWidth={5} strokeLinecap="round" />
      <circle cx={-8} cy={-42} r={4} fill="#8fc25a" stroke="none" />
    </g>
  );
}

export function VillageScene({ name }: { name: string }) {
  return (
    <div className="vscene" aria-hidden>
      <svg viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" className="vscene-svg">
        <defs>
          <linearGradient id="vs-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a9d3ea" />
            <stop offset="1" stopColor="#f5e7c3" />
          </linearGradient>
          <linearGradient id="vs-meadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a8c76c" />
            <stop offset="1" stopColor="#86ad52" />
          </linearGradient>
          <radialGradient id="vs-sun" cx="0.82" cy="0.12" r="0.35">
            <stop offset="0" stopColor="#fff6d6" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vs-yard" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#c7c27e" />
            <stop offset="0.75" stopColor="#b2c172" />
            <stop offset="1" stopColor="#a3bf6a" />
          </radialGradient>
          <filter id="vs-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={3} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer><feFuncA type="linear" slope="0.09" /></feComponentTransfer>
          </filter>
          <filter id="vs-wobble">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={4} />
            <feDisplacementMap in="SourceGraphic" scale={6} />
          </filter>
        </defs>

        {/* cielo y sol */}
        <rect width="1000" height="640" fill="url(#vs-sky)" />
        <rect width="1000" height="640" fill="url(#vs-sun)" />

        {/* nubes (se desplazan despacio) */}
        <g className="vscene-clouds" fill="#fffaf0" opacity={0.9}>
          <path d="M120 70 q20 -26 48 -10 q22 -18 44 4 q26 -2 26 18 H112 q-12 -12 8 -12 Z" />
          <path d="M560 50 q16 -20 38 -8 q18 -14 36 2 q22 0 20 14 H552 q-10 -8 8 -8 Z" />
          <path d="M1140 90 q18 -22 42 -8 q20 -16 40 4 q24 0 22 16 H1132 q-10 -10 8 -12 Z" />
        </g>

        {/* montañas lejanas */}
        <path d="M0 200 L90 120 L160 170 L250 95 L340 165 L420 130 L520 185 L610 110 L700 160 L790 100 L880 150 L1000 115 V260 H0 Z" fill="#a9bccb" />
        <path d="M250 95 L280 120 L262 118 L250 130 L238 116 L222 120 Z M790 100 L818 124 L800 121 L790 132 L778 120 L764 124 Z" fill="#f4f1ea" />

        {/* colinas */}
        <path d="M0 250 Q160 175 330 230 T680 220 T1000 225 V330 H0 Z" fill="#94b862" filter="url(#vs-wobble)" />
        <path d="M0 290 Q220 240 480 285 T1000 270 V360 H0 Z" fill="#8bb05a" />

        {/* pradera */}
        <rect y="300" width="1000" height="340" fill="url(#vs-meadow)" />
        {/* manchas de hierba */}
        {[[180, 360], [820, 380], [300, 600], [700, 610], [120, 420], [880, 430]].map(([x, y]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={60} ry={14} fill="#9ec266" opacity={0.7} />
        ))}

        {/* río */}
        <path d="M-20 560 C120 520 160 610 300 640 L250 660 C140 640 100 580 -20 600 Z" fill="#6eb1d6" stroke="#3b2412" strokeWidth={1.6} />
        <path d="M30 568 q20 -6 40 0 M160 600 q20 -6 40 0" stroke="#d9f0fb" strokeWidth={2.5} fill="none" strokeLinecap="round" />

        {/* recinto interior */}
        <ellipse cx="500" cy="395" rx="430" ry="188" fill="url(#vs-yard)" />
        {/* camino circular y camino a la puerta */}
        <ellipse cx="500" cy="395" rx="300" ry="128" fill="none" stroke="#dcc08a" strokeWidth={26} />
        <ellipse cx="500" cy="395" rx="300" ry="128" fill="none" stroke="#c9a96e" strokeWidth={2} strokeDasharray="2 14" />
        <path d="M480 520 C470 570 440 610 430 650 H570 C560 610 530 570 520 520 Z" fill="#dcc08a" />

        {/* empalizada (estacas ordenadas por profundidad) */}
        <g stroke="#3b2412" strokeWidth={1.4} strokeLinejoin="round">
          {STAKES.map(s => (
            <path key={s.i} d={`M${s.x - 5} ${s.y} V${s.y - 18} L${s.x} ${s.y - 24} L${s.x + 5} ${s.y - 18} V${s.y} Z`} fill={s.y > 395 ? "#a0693a" : "#8a5a2b"} />
          ))}
        </g>

        {/* árboles */}
        {TREES_SORTED.map(([x, y, s]) => <SceneTree key={`${x}-${y}`} x={x} y={y} s={s} />)}

        {/* grano de papel */}
        <rect width="1000" height="640" filter="url(#vs-grain)" />
      </svg>

      {/* letrero de madera con el nombre */}
      <div className="vscene-sign"><span>{name}</span></div>
    </div>
  );
}
