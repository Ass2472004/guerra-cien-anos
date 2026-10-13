// Ilustraciones 3/4 de edificios para la vista de aldea.
// Estilo: trazo marrón oscuro redondeado, luz cálida desde la izquierda,
// cara lateral en sombra. Todo vectorial, sin assets externos.
import type { ReactElement } from "react";

const INK = "#3b2412";
const SW = 1.6;

const C = {
  plaster: "#f1dfb4", plasterS: "#cdb07c",
  timber: "#6b4423",
  stone: "#c8bda6", stoneS: "#968a72",
  roofRed: "#c9573b", roofRedS: "#93371f",
  thatch: "#e0b257", thatchS: "#a97b2c",
  roofBlue: "#4f78ad", roofBlueS: "#33557f",
  roofSlate: "#6d6f7a", roofSlateS: "#4a4b55",
  plank: "#b0753e", plankS: "#7d4f27",
  dark: "#2a180b",
  glow: "#ffcf6b",
  leaf: "#6fa043", leafS: "#4b7a2a",
  gold: "#f2c14e",
};

type P = { children?: React.ReactNode };
// Helper (función, no componente) para grupos con trazo de tinta
const g = ({ key, ...props }: React.SVGProps<SVGGElement> & P & { key?: React.Key }) => (
  <g key={key} stroke={INK} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round" {...props} />
);

// Casa 3/4 genérica: fachada + lateral en sombra + tejado a dos aguas
function House({
  x, base, w, h, d = 16, wall = C.plaster, wallS = C.plasterS,
  roof = C.roofRed, roofS = C.roofRedS, rh = 18, door = true, windows = 1, timber = false,
}: {
  x: number; base: number; w: number; h: number; d?: number;
  wall?: string; wallS?: string; roof?: string; roofS?: string; rh?: number;
  door?: boolean; windows?: number; timber?: boolean;
}) {
  const top = base - h;
  const dy = d * 0.5;
  return g({
    children: (
      <>
        {/* lateral */}
        <path d={`M${x + w} ${base} L${x + w + d} ${base - dy} L${x + w + d} ${top - dy} L${x + w} ${top} Z`} fill={wallS} />
        {/* fachada */}
        <rect x={x} y={top} width={w} height={h} fill={wall} />
        {timber && (
          <path d={`M${x} ${top + h * 0.45} H${x + w} M${x + w * 0.25} ${top} V${base} M${x + w * 0.75} ${top} V${base}`} stroke={C.timber} strokeWidth={2} fill="none" />
        )}
        {/* tejado lateral */}
        <path d={`M${x + w / 2} ${top - rh} L${x + w / 2 + d} ${top - rh - dy} L${x + w + d + 3} ${top - dy + 2} L${x + w + 3} ${top + 2} Z`} fill={roofS} />
        {/* hastial */}
        <path d={`M${x - 3} ${top + 2} L${x + w / 2} ${top - rh} L${x + w + 3} ${top + 2} Z`} fill={roof} />
        {door && <path d={`M${x + w / 2 - 5} ${base} V${base - 11} Q${x + w / 2} ${base - 16} ${x + w / 2 + 5} ${base - 11} V${base} Z`} fill={C.dark} />}
        {Array.from({ length: windows }, (_, i) => {
          const wx = x + (w / (windows + 1)) * (i + 1) - 3;
          return <rect key={i} x={wx} y={top + 6} width={6} height={6} rx={1} fill={C.glow} />;
        })}
      </>
    ),
  });
}

function Tower({ cx, base, w, h, roof = C.roofRed, roofS = C.roofRedS, body = C.stone, bodyS = C.stoneS, rh = 22 }: {
  cx: number; base: number; w: number; h: number; roof?: string; roofS?: string; body?: string; bodyS?: string; rh?: number;
}) {
  const x = cx - w / 2;
  const top = base - h;
  return g({
    children: (
      <>
        <path d={`M${x} ${top} V${base} Q${cx} ${base + 5} ${x + w} ${base} V${top} Z`} fill={body} />
        <path d={`M${cx + w * 0.15} ${top} V${base + 2.5} Q${x + w * 0.85} ${base + 2} ${x + w} ${base} V${top} Z`} fill={bodyS} stroke="none" />
        <path d={`M${x} ${top} V${base} Q${cx} ${base + 5} ${x + w} ${base} V${top}`} fill="none" />
        <path d={`M${x - 4} ${top + 1} L${cx} ${top - rh} L${x + w + 4} ${top + 1} Q${cx} ${top + 6} ${x - 4} ${top + 1} Z`} fill={roof} />
        <path d={`M${cx} ${top - rh} L${x + w + 4} ${top + 1} Q${cx + w * 0.4} ${top + 5} ${cx + 2} ${top + 4} Z`} fill={roofS} stroke="none" />
        <rect x={cx - 2.5} y={top + 8} width={5} height={8} rx={2.5} fill={C.glow} />
      </>
    ),
  });
}

function Flag({ x, y, color = "#c9573b" }: { x: number; y: number; color?: string }) {
  return (
    <g className="ba-flag" stroke={INK} strokeWidth={1.2} strokeLinejoin="round">
      <line x1={x} y1={y} x2={x} y2={y - 16} />
      <path d={`M${x} ${y - 16} Q${x + 7} ${y - 18} ${x + 13} ${y - 14} Q${x + 7} ${y - 11} ${x} ${y - 10} Z`} fill={color} />
    </g>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return g({
    children: (
      <>
        <rect x={x - 1.5 * s} y={y - 6 * s} width={3 * s} height={7 * s} fill={C.timber} />
        <path d={`M${x} ${y - 24 * s} C${x + 12 * s} ${y - 22 * s} ${x + 11 * s} ${y - 6 * s} ${x} ${y - 6 * s} C${x - 11 * s} ${y - 6 * s} ${x - 12 * s} ${y - 22 * s} ${x} ${y - 24 * s} Z`} fill={C.leaf} />
        <path d={`M${x + 2 * s} ${y - 21 * s} C${x + 9 * s} ${y - 17 * s} ${x + 8 * s} ${y - 9 * s} ${x + 1 * s} ${y - 7 * s}`} fill="none" stroke={C.leafS} strokeWidth={2.5 * s} />
      </>
    ),
  });
}

const ART: Record<string, () => ReactElement> = {
  MAIN_HALL: () => (
    <>
      <Tower cx={22} base={86} w={18} h={46} />
      <House x={30} base={88} w={52} h={34} d={18} wall={C.stone} wallS={C.stoneS} rh={24} windows={2} />
      <Tower cx={98} base={84} w={18} h={50} />
      <Flag x={56} y={30} color={C.gold} />
      <path d="M50 88 V76 Q56 69 62 76 V88" fill={C.dark} stroke={INK} strokeWidth={SW} />
    </>
  ),
  RESIDENCE: () => (
    <>
      <House x={20} base={88} w={56} h={30} d={20} timber windows={2} rh={22} />
      <Tower cx={92} base={86} w={14} h={40} roof={C.roofBlue} roofS={C.roofBlueS} />
    </>
  ),
  EMBASSY: () => (
    <>
      <House x={24} base={88} w={62} h={32} d={18} wall={C.stone} wallS={C.stoneS} roof={C.roofBlue} roofS={C.roofBlueS} windows={3} />
      <Flag x={55} y={36} color={C.roofBlue} />
    </>
  ),
  TAVERN: () => (
    <>
      <House x={22} base={88} w={56} h={28} d={18} timber roof={C.thatch} roofS={C.thatchS} windows={2} rh={20} />
      {g({ children: <><line x1={84} y1={62} x2={98} y2={62} /><rect x={90} y={64} width={12} height={9} rx={2} fill={C.gold} /></> })}
      <ellipse cx={30} cy={92} rx={6} ry={3} fill={C.plank} stroke={INK} strokeWidth={SW} />
    </>
  ),
  CHAPEL: () => (
    <>
      <House x={30} base={88} w={44} h={30} d={16} wall={C.stone} wallS={C.stoneS} roof={C.roofSlate} roofS={C.roofSlateS} windows={0} />
      <Tower cx={30} base={88} w={16} h={52} roof={C.roofSlate} roofS={C.roofSlateS} rh={28} body={C.stone} bodyS={C.stoneS} />
      <circle cx={52} cy={66} r={5} fill={C.glow} stroke={INK} strokeWidth={SW} />
    </>
  ),
  WAREHOUSE: () => (
    <>
      <House x={18} base={88} w={64} h={30} d={20} wall={C.plank} wallS={C.plankS} roof={C.roofRed} roofS={C.roofRedS} windows={0} door={false} rh={20} />
      {g({ children: <><rect x={38} y={68} width={24} height={20} fill={C.dark} /><path d="M38 68 L62 88 M62 68 L38 88" stroke={C.plank} /></> })}
      {g({ children: <><rect x={88} y={80} width={10} height={9} fill={C.plank} /><rect x={98} y={82} width={9} height={7} fill={C.plankS} /></> })}
    </>
  ),
  GRANARY: () => (
    <>
      <Tower cx={40} base={88} w={26} h={40} body={C.plaster} bodyS={C.plasterS} roof={C.thatch} roofS={C.thatchS} rh={20} />
      <Tower cx={72} base={88} w={22} h={32} body={C.plaster} bodyS={C.plasterS} roof={C.thatch} roofS={C.thatchS} rh={16} />
      {g({ children: <path d="M90 90 q6 -10 12 0 Z" fill={C.thatch} /> })}
    </>
  ),
  MARKET: () => (
    <>
      {[16, 52].map((x, i) => g({
        key: x,
        children: (
          <>
            <rect x={x + 2} y={70} width={30} height={18} fill={C.plank} />
            <path d={`M${x - 2} ${70} L${x + 6} ${56} H${x + 30} L${x + 38} ${70} Z`} fill={i ? C.roofBlue : C.roofRed} />
            <path d={`M${x + 10} 56 L${x + 6} 70 M${x + 22} 56 L${x + 22} 70`} stroke="#fff4dc" strokeWidth={2.4} />
            <circle cx={x + 10} cy={74} r={3} fill={C.gold} /><circle cx={x + 22} cy={75} r={3} fill={C.leaf} />
          </>
        ),
      }))}
      <Tree x={100} y={90} s={0.9} />
    </>
  ),
  FORGE: () => (
    <>
      <House x={20} base={88} w={56} h={28} d={18} wall={C.stone} wallS={C.stoneS} roof={C.roofSlate} roofS={C.roofSlateS} windows={0} door={false} />
      {g({ children: <><rect x={62} y={30} width={10} height={26} fill={C.stoneS} /><rect x={36} y={70} width={22} height={18} rx={3} fill="#ff8a3d" /></> })}
      <g className="ba-smoke" fill="#d9d2c4" opacity={0.8}>
        <circle cx={67} cy={24} r={5} /><circle cx={72} cy={15} r={6} /><circle cx={68} cy={5} r={5} />
      </g>
      {g({ children: <path d="M86 88 h16 l-3 -6 h-10 Z" fill="#5b5e66" /> })}
    </>
  ),
  BARRACKS: () => (
    <>
      <House x={14} base={88} w={70} h={26} d={18} timber wall={C.plaster} roof={C.roofRed} roofS={C.roofRedS} windows={3} rh={16} />
      {[22, 40, 58].map(x => g({ key: x, children: <path d={`M${x} 70 h10 v6 q-5 6 -10 0 Z`} fill={x === 40 ? C.roofBlue : C.roofRed} /> }))}
      <Flag x={100} y={88} />
    </>
  ),
  STABLES: () => (
    <>
      <House x={16} base={88} w={60} h={24} d={18} wall={C.plank} wallS={C.plankS} roof={C.thatch} roofS={C.thatchS} windows={0} rh={16} />
      {g({ children: <><path d="M32 88 V74 H44 V88 M50 88 V74 H62 V88" fill={C.dark} /><path d="M80 90 H108 M80 84 H108 M84 92 V80 M96 92 V80 M106 92 V80" fill="none" /></> })}
    </>
  ),
  SIEGE_WORKSHOP: () => (
    <>
      <House x={14} base={88} w={52} h={26} d={16} wall={C.plank} wallS={C.plankS} roof={C.roofSlate} roofS={C.roofSlateS} windows={0} />
      {g({ children: <><rect x={74} y={80} width={30} height={7} fill={C.plank} /><circle cx={79} cy={89} r={4} fill={C.plankS} /><circle cx={99} cy={89} r={4} fill={C.plankS} /><path d="M86 80 L104 56" strokeWidth={3} /><circle cx={104} cy={55} r={4} fill={C.stoneS} /></> })}
    </>
  ),
  RALLY_POINT: () => (
    <>
      {g({ children: <path d="M18 88 L38 58 L58 88 Z" fill="#efe2c4" /> })}
      {g({ children: <path d="M38 58 L58 88 H48 Z" fill="#cbb98f" stroke="none" /> })}
      {g({ children: <path d="M58 88 L76 64 L94 88 Z" fill={C.roofRed} /> })}
      <Flag x={100} y={88} color={C.gold} />
      <Flag x={38} y={58} />
    </>
  ),
  WALLS: () => (
    <>
      {g({ children: <path d="M8 88 V66 h8 v-5 h7 v5 h8 v-5 h7 v5 h8 v22 Z" fill={C.stone} /> })}
      {g({ children: <path d="M74 88 V66 h8 v-5 h7 v5 h8 v-5 h7 v5 h8 v22 Z" fill={C.stone} /> })}
      <Tower cx={60} base={88} w={26} h={40} body={C.stone} bodyS={C.stoneS} roof={C.roofRed} roofS={C.roofRedS} />
      <path d="M53 88 V76 Q60 69 67 76 V88 Z" fill={C.dark} stroke={INK} strokeWidth={SW} />
    </>
  ),
  WATCHTOWER: () => (
    <>
      {g({ children: <><path d="M46 88 L52 40 M74 88 L68 40 M48 70 L72 56 M48 56 L72 70" fill="none" strokeWidth={2.4} stroke={C.plankS} /><path d="M46 88 L52 40 M74 88 L68 40" fill="none" /></> })}
      {g({ children: <><rect x={44} y={30} width={32} height={12} fill={C.plank} /><path d="M40 31 L60 10 L80 31 Z" fill={C.roofRed} /></> })}
      <Flag x={60} y={10} color={C.gold} />
      <Tree x={92} y={90} s={0.8} />
    </>
  ),
  SAWMILL: () => (
    <>
      <House x={18} base={88} w={50} h={24} d={16} wall={C.plank} wallS={C.plankS} roof={C.thatch} roofS={C.thatchS} windows={0} />
      {g({ children: <><circle cx={78} cy={74} r={10} fill={C.stoneS} /><circle cx={78} cy={74} r={3} fill={C.dark} /></> })}
      {[0, 1, 2].map(i => g({ key: i, children: <ellipse cx={92 + (i % 2) * 6} cy={88 - i * 5} rx={9} ry={3} fill={C.plank} /> }))}
    </>
  ),
  QUARRY: () => (
    <>
      {g({ children: <path d="M10 88 L26 52 L44 60 L58 40 L80 56 L96 50 L110 88 Z" fill={C.stone} /> })}
      {g({ children: <path d="M58 40 L80 56 L96 50 L110 88 H70 Z" fill={C.stoneS} stroke="none" /> })}
      {g({ children: <><rect x={30} y={80} width={12} height={9} fill={C.stone} /><rect x={44} y={82} width={10} height={7} fill={C.stoneS} /></> })}
    </>
  ),
  IRON_MINE: () => (
    <>
      {g({ children: <path d="M8 88 Q30 40 60 42 Q92 44 112 88 Z" fill="#8a7a62" /> })}
      {g({ children: <><path d="M46 88 V68 Q60 56 74 68 V88 Z" fill={C.dark} /><path d="M44 88 V66 H76 V88" fill="none" stroke={C.plank} strokeWidth={3} /></> })}
      {g({ children: <><rect x={82} y={78} width={18} height={8} fill="#5b5e66" /><circle cx={86} cy={88} r={2.5} fill={C.dark} /><circle cx={96} cy={88} r={2.5} fill={C.dark} /><circle cx={90} cy={77} r={3} fill="#ff9060" /></> })}
    </>
  ),
  FIELDS: () => (
    <>
      {g({ children: <path d="M6 88 L30 60 H104 L114 88 Z" fill={C.thatch} /> })}
      {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${18 + i * 4} ${84 - i * 5} H${108 - i * 1}`} stroke={C.thatchS} strokeWidth={2} />)}
      <House x={74} base={66} w={18} h={10} d={8} rh={8} windows={0} door={false} />
    </>
  ),
};

/** Parcela vacía: tierra removida, estacas y cuerda */
function EmptyPlot() {
  return (
    <>
      <ellipse cx={60} cy={82} rx={42} ry={12} fill="#b98c55" stroke={INK} strokeWidth={SW} strokeDasharray="4 4" />
      {[22, 98, 40, 80].map((x, i) => (
        <line key={x} x1={x} y1={i < 2 ? 82 : 74} x2={x} y2={(i < 2 ? 82 : 74) - 12} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      ))}
      <path d="M22 72 Q40 66 40 64 M98 72 Q80 66 80 64" fill="none" stroke="#e8d7a8" strokeWidth={1.2} />
      <text x={60} y={86} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK} opacity={0.55}>+</text>
    </>
  );
}

/** Andamio superpuesto cuando el edificio está en construcción */
function Scaffold() {
  return (
    <g stroke="#7d4f27" strokeWidth={2} strokeLinecap="round" opacity={0.9}>
      <path d="M24 88 V40 M96 88 V40 M24 60 H96 M24 76 H96 M24 60 L48 76 M72 60 L96 76" fill="none" />
    </g>
  );
}

export function BuildingArt({
  type, size = 120, empty = false, building = false,
}: { type: string; size?: number; empty?: boolean; building?: boolean }) {
  const Art = ART[type];
  return (
    <svg viewBox="0 0 120 100" width={size} height={size * (100 / 120)} className="ba" aria-hidden>
      {/* sombra de contacto */}
      <ellipse cx={62} cy={90} rx={50} ry={8} fill="rgba(40,25,10,0.28)" />
      {empty || !Art ? <EmptyPlot /> : <Art />}
      {building && <Scaffold />}
    </svg>
  );
}
