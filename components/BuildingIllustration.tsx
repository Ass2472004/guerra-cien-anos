// Ilustraciones SVG inline para cada edificio
// Cada edificio devuelve un SVG estilizado en colores medievales
import type { ReactElement } from "react";

interface IllustrationProps {
  size?: number;
  level?: number;
}

const sharedDefs = (
  <defs>
    <linearGradient id="stoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#9a8a76" />
      <stop offset="100%" stopColor="#5a4d3a" />
    </linearGradient>
    <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#8b5a2b" />
      <stop offset="100%" stopColor="#3a2818" />
    </linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#a52a2a" />
      <stop offset="100%" stopColor="#4a0f0f" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#d9a847" />
      <stop offset="100%" stopColor="#b8862f" />
    </linearGradient>
  </defs>
);

const SVG: Record<string, (p: IllustrationProps) => ReactElement> = {
  MAIN_HALL: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      {/* Base */}
      <rect x="10" y="36" width="44" height="22" fill="url(#stoneGrad)" stroke="#2a1a0c" strokeWidth="0.5" />
      {/* Door */}
      <rect x="28" y="44" width="8" height="14" fill="#2a1a0c" />
      <path d="M 28 44 L 32 40 L 36 44 Z" fill="#2a1a0c" />
      {/* Towers */}
      <rect x="6" y="22" width="10" height="36" fill="url(#stoneGrad)" stroke="#2a1a0c" strokeWidth="0.5" />
      <rect x="48" y="22" width="10" height="36" fill="url(#stoneGrad)" stroke="#2a1a0c" strokeWidth="0.5" />
      {/* Tower battlements */}
      <path d="M 6 22 L 6 18 L 8 18 L 8 20 L 10 20 L 10 18 L 12 18 L 12 20 L 14 20 L 14 18 L 16 18 L 16 22 Z" fill="url(#stoneGrad)" />
      <path d="M 48 22 L 48 18 L 50 18 L 50 20 L 52 20 L 52 18 L 54 18 L 54 20 L 56 20 L 56 18 L 58 18 L 58 22 Z" fill="url(#stoneGrad)" />
      {/* Center roof */}
      <path d="M 10 36 L 32 16 L 54 36 Z" fill="url(#roofGrad)" stroke="#2a1a0c" strokeWidth="0.5" />
      {/* Banner */}
      <path d="M 32 16 L 32 26 L 38 23 L 32 20" fill="url(#goldGrad)" />
      {/* Windows */}
      <rect x="8" y="32" width="2" height="4" fill="#1a0f06" />
      <rect x="12" y="32" width="2" height="4" fill="#1a0f06" />
      <rect x="50" y="32" width="2" height="4" fill="#1a0f06" />
      <rect x="54" y="32" width="2" height="4" fill="#1a0f06" />
    </svg>
  ),
  WAREHOUSE: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="8" y="34" width="48" height="24" fill="url(#woodGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <path d="M 6 34 L 32 14 L 58 34 Z" fill="url(#roofGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <rect x="14" y="40" width="6" height="6" fill="#3a2818" stroke="#1a0f06" strokeWidth="0.4" />
      <rect x="22" y="40" width="6" height="6" fill="#3a2818" stroke="#1a0f06" strokeWidth="0.4" />
      <rect x="36" y="40" width="6" height="6" fill="#3a2818" stroke="#1a0f06" strokeWidth="0.4" />
      <rect x="44" y="40" width="6" height="6" fill="#3a2818" stroke="#1a0f06" strokeWidth="0.4" />
      <rect x="28" y="46" width="8" height="12" fill="#1a0f06" />
    </svg>
  ),
  GRANARY: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <ellipse cx="32" cy="58" rx="22" ry="4" fill="#2a1a0c" />
      <path d="M 14 58 L 14 30 Q 32 18, 50 30 L 50 58 Z" fill="url(#woodGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <path d="M 14 30 Q 32 18, 50 30 Q 50 26, 32 14 Q 14 26, 14 30 Z" fill="url(#roofGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <rect x="29" y="46" width="6" height="12" fill="#1a0f06" />
      <circle cx="32" cy="36" r="2" fill="#facc15" />
      <text x="32" y="40" fontSize="8" fill="#facc15" textAnchor="middle">🌾</text>
    </svg>
  ),
  MARKET: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="10" y="38" width="44" height="20" fill="url(#woodGrad)" />
      <path d="M 8 38 L 32 22 L 56 38 Z" fill="url(#roofGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <rect x="14" y="42" width="36" height="3" fill="#5a3510" />
      <circle cx="20" cy="50" r="3" fill="url(#goldGrad)" />
      <circle cx="32" cy="50" r="3" fill="url(#goldGrad)" />
      <circle cx="44" cy="50" r="3" fill="url(#goldGrad)" />
    </svg>
  ),
  FORGE: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="10" y="36" width="44" height="22" fill="url(#stoneGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <path d="M 8 36 L 32 18 L 56 36 Z" fill="#3a2818" stroke="#1a0f06" strokeWidth="0.5" />
      <rect x="36" y="14" width="6" height="22" fill="url(#stoneGrad)" />
      {/* Fire glow */}
      <circle cx="22" cy="46" r="6" fill="#ea580c" opacity="0.8" />
      <circle cx="22" cy="46" r="3" fill="#facc15" />
      <rect x="20" y="44" width="4" height="6" fill="#1a0f06" />
      <rect x="38" y="44" width="3" height="14" fill="#1a0f06" />
    </svg>
  ),
  BARRACKS: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="8" y="32" width="48" height="26" fill="url(#stoneGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <path d="M 6 32 L 32 14 L 58 32 Z" fill="url(#roofGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <rect x="28" y="42" width="8" height="16" fill="#1a0f06" />
      {/* Crossed swords */}
      <line x1="14" y1="38" x2="22" y2="46" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <line x1="22" y1="38" x2="14" y2="46" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <line x1="42" y1="38" x2="50" y2="46" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <line x1="50" y1="38" x2="42" y2="46" stroke="url(#goldGrad)" strokeWidth="1.5" />
    </svg>
  ),
  STABLES: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="8" y="36" width="48" height="22" fill="url(#woodGrad)" />
      <path d="M 6 36 L 32 22 L 58 36 Z" fill="url(#roofGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <rect x="14" y="42" width="8" height="16" fill="#1a0f06" />
      <rect x="28" y="42" width="8" height="16" fill="#1a0f06" />
      <rect x="42" y="42" width="8" height="16" fill="#1a0f06" />
      {/* Hay */}
      <path d="M 16 40 L 18 38 M 18 40 L 20 38 M 30 40 L 32 38 M 32 40 L 34 38 M 44 40 L 46 38 M 46 40 L 48 38" stroke="#facc15" strokeWidth="0.6" />
    </svg>
  ),
  SIEGE_WORKSHOP: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="6" y="36" width="52" height="22" fill="url(#woodGrad)" />
      <path d="M 4 36 L 32 18 L 60 36 Z" fill="#3a2818" stroke="#1a0f06" strokeWidth="0.5" />
      {/* Catapult */}
      <line x1="20" y1="48" x2="38" y2="32" stroke="#5a3510" strokeWidth="2" />
      <circle cx="38" cy="32" r="4" fill="url(#stoneGrad)" />
      <line x1="20" y1="48" x2="14" y2="58" stroke="#3a2818" strokeWidth="3" />
      <circle cx="14" cy="56" r="3" fill="#1a0f06" />
      <circle cx="44" cy="56" r="3" fill="#1a0f06" />
      <line x1="14" y1="56" x2="44" y2="56" stroke="#3a2818" strokeWidth="2" />
    </svg>
  ),
  WATCHTOWER: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="22" y="22" width="20" height="36" fill="url(#stoneGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      {/* Battlements */}
      <path d="M 22 22 L 22 18 L 24 18 L 24 20 L 28 20 L 28 18 L 30 18 L 30 20 L 34 20 L 34 18 L 36 18 L 36 20 L 40 20 L 40 18 L 42 18 L 42 22 Z" fill="url(#stoneGrad)" />
      {/* Roof */}
      <path d="M 20 22 L 32 8 L 44 22 Z" fill="url(#roofGrad)" />
      {/* Flag */}
      <line x1="32" y1="8" x2="32" y2="2" stroke="#1a0f06" strokeWidth="0.5" />
      <path d="M 32 2 L 38 4 L 32 6" fill="url(#goldGrad)" />
      {/* Door + window */}
      <rect x="29" y="46" width="6" height="12" fill="#1a0f06" />
      <rect x="29" y="32" width="6" height="6" fill="#facc15" opacity="0.4" />
    </svg>
  ),
  TAVERN: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="10" y="34" width="44" height="24" fill="url(#woodGrad)" />
      <path d="M 8 34 L 32 18 L 56 34 Z" fill="url(#roofGrad)" />
      <rect x="28" y="42" width="8" height="16" fill="#1a0f06" />
      <rect x="14" y="40" width="8" height="6" fill="#facc15" opacity="0.5" stroke="#5a3510" strokeWidth="0.5" />
      <rect x="42" y="40" width="8" height="6" fill="#facc15" opacity="0.5" stroke="#5a3510" strokeWidth="0.5" />
      {/* Sign */}
      <rect x="28" y="22" width="8" height="6" fill="url(#goldGrad)" stroke="#1a0f06" strokeWidth="0.5" />
    </svg>
  ),
  CHAPEL: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="14" y="32" width="36" height="26" fill="url(#stoneGrad)" />
      <path d="M 12 32 L 32 12 L 52 32 Z" fill="url(#roofGrad)" />
      <rect x="29" y="46" width="6" height="12" fill="#1a0f06" />
      {/* Stained glass */}
      <ellipse cx="32" cy="36" rx="3" ry="6" fill="#7c3aed" opacity="0.7" />
      {/* Octahedron symbol (Nahkor) */}
      <path d="M 32 4 L 36 8 L 32 12 L 28 8 Z" fill="url(#goldGrad)" />
    </svg>
  ),
  WALLS: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="2" y="32" width="60" height="22" fill="url(#stoneGrad)" stroke="#1a0f06" strokeWidth="0.4" />
      {/* Battlements */}
      <path d="M 2 32 L 2 26 L 8 26 L 8 30 L 14 30 L 14 26 L 20 26 L 20 30 L 26 30 L 26 26 L 32 26 L 32 30 L 38 30 L 38 26 L 44 26 L 44 30 L 50 30 L 50 26 L 56 26 L 56 30 L 62 30 L 62 26 L 62 32 Z" fill="url(#stoneGrad)" stroke="#1a0f06" strokeWidth="0.4" />
      {/* Stone seams */}
      <line x1="14" y1="32" x2="14" y2="54" stroke="#3a2818" strokeWidth="0.4" />
      <line x1="32" y1="32" x2="32" y2="54" stroke="#3a2818" strokeWidth="0.4" />
      <line x1="50" y1="32" x2="50" y2="54" stroke="#3a2818" strokeWidth="0.4" />
      <line x1="2" y1="40" x2="62" y2="40" stroke="#3a2818" strokeWidth="0.4" />
      <line x1="2" y1="48" x2="62" y2="48" stroke="#3a2818" strokeWidth="0.4" />
    </svg>
  ),
  RALLY_POINT: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      {/* Ground */}
      <ellipse cx="32" cy="56" rx="20" ry="3" fill="#2a1a0c" />
      {/* Pole */}
      <rect x="31" y="14" width="2" height="44" fill="#3a2818" />
      {/* Banner */}
      <path d="M 33 14 L 50 18 L 33 22 Z" fill="url(#roofGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      <path d="M 33 24 L 46 28 L 33 32 Z" fill="url(#goldGrad)" stroke="#1a0f06" strokeWidth="0.5" />
      {/* Drum */}
      <ellipse cx="32" cy="52" rx="10" ry="3" fill="url(#woodGrad)" />
      <rect x="22" y="48" width="20" height="6" fill="url(#woodGrad)" />
    </svg>
  ),
  RESIDENCE: ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
      {sharedDefs}
      <rect x="14" y="34" width="36" height="24" fill="url(#stoneGrad)" />
      <path d="M 12 34 L 32 16 L 52 34 Z" fill="url(#roofGrad)" />
      <rect x="29" y="46" width="6" height="12" fill="#1a0f06" />
      <rect x="20" y="40" width="5" height="5" fill="#facc15" opacity="0.5" />
      <rect x="39" y="40" width="5" height="5" fill="#facc15" opacity="0.5" />
      {/* Crown */}
      <path d="M 28 22 L 30 18 L 32 22 L 34 18 L 36 22 L 36 24 L 28 24 Z" fill="url(#goldGrad)" stroke="#1a0f06" strokeWidth="0.4" />
    </svg>
  ),
};

export function BuildingIllustration({ type, size = 64 }: { type: string; size?: number }) {
  const Comp = SVG[type];
  if (!Comp) {
    return (
      <div style={{ width: size, height: size, fontSize: size * 0.5 }} className="flex items-center justify-center">
        🏗
      </div>
    );
  }
  return <Comp size={size} />;
}
