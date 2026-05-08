"use client";
import type { ReactElement } from "react";

// ─────────────────────────────────────────────────────────────
// NhIcons — geometric SVG icon library for Nahkor
// Per Claude Design spec: simple geometric shapes only,
// faction colour via `c` prop (currentColor by default)
// ─────────────────────────────────────────────────────────────

type IconProps = { c?: string; size?: number };

function Art({ children, viewBox = "0 0 64 64", size = 40 }: { children: ReactElement | ReactElement[]; viewBox?: string; size?: number }) {
  return (
    <svg viewBox={viewBox} width={size} height={size} style={{ display: "block" }}>
      {children}
    </svg>
  );
}

// ── Building icons ────────────────────────────────────────────

export function IconMainHall({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <polygon points="32,8 52,20 52,46 32,58 12,46 12,20" fill={c} opacity=".22" />
      <polygon points="32,14 46,22 46,46 32,54 18,46 18,22" fill={c} opacity=".55" stroke={c} strokeWidth="1.2" />
      <polygon points="32,8 38,16 26,16" fill={c} />
      <rect x="28" y="36" width="8" height="14" fill="#2a1d10" stroke={c} strokeWidth="1" />
      <circle cx="32" cy="28" r="3" fill={c} />
    </Art>
  );
}

export function IconGranary({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <ellipse cx="32" cy="44" rx="20" ry="14" fill={c} opacity=".25" />
      <path d="M12,44 L12,30 Q32,8 52,30 L52,44 Z" fill={c} opacity=".5" stroke={c} strokeWidth="1.2" />
      <path d="M18,44 L18,32 Q32,18 46,32 L46,44 Z" fill="none" stroke={c} strokeWidth="1" opacity=".7" />
      <rect x="29" y="38" width="6" height="10" fill="#2a1d10" stroke={c} strokeWidth=".8" />
    </Art>
  );
}

export function IconBarracks({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <rect x="12" y="22" width="40" height="32" fill={c} opacity=".22" />
      <polygon points="10,24 32,10 54,24" fill={c} opacity=".5" stroke={c} strokeWidth="1.2" />
      <rect x="14" y="24" width="36" height="28" fill="none" stroke={c} strokeWidth="1.2" />
      <line x1="22" y1="32" x2="42" y2="46" stroke={c} strokeWidth="1.5" />
      <line x1="42" y1="32" x2="22" y2="46" stroke={c} strokeWidth="1.5" />
      <circle cx="32" cy="39" r="2.2" fill={c} />
    </Art>
  );
}

export function IconWorkshop({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <rect x="12" y="28" width="40" height="26" fill={c} opacity=".22" />
      <polygon points="12,28 32,16 52,28" fill={c} opacity=".5" stroke={c} strokeWidth="1.2" />
      <rect x="22" y="36" width="20" height="3" fill={c} />
      <polygon points="20,39 44,39 40,46 24,46" fill={c} opacity=".7" />
      <rect x="29" y="46" width="6" height="6" fill={c} />
    </Art>
  );
}

export function IconWall({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <rect x="8" y="32" width="48" height="20" fill={c} opacity=".25" stroke={c} strokeWidth="1.2" />
      <rect x="8" y="26" width="6" height="6" fill={c} opacity=".7" />
      <rect x="20" y="26" width="6" height="6" fill={c} opacity=".7" />
      <rect x="32" y="26" width="6" height="6" fill={c} opacity=".7" />
      <rect x="44" y="26" width="6" height="6" fill={c} opacity=".7" />
      <line x1="20" y1="32" x2="20" y2="52" stroke={c} strokeWidth=".6" opacity=".5" />
      <line x1="32" y1="32" x2="32" y2="52" stroke={c} strokeWidth=".6" opacity=".5" />
      <line x1="44" y1="32" x2="44" y2="52" stroke={c} strokeWidth=".6" opacity=".5" />
    </Art>
  );
}

export function IconMarket({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <polygon points="10,24 54,24 50,30 14,30" fill={c} opacity=".55" />
      <rect x="14" y="30" width="36" height="22" fill={c} opacity=".22" stroke={c} strokeWidth="1" />
      <line x1="22" y1="30" x2="22" y2="52" stroke={c} strokeWidth=".7" opacity=".6" />
      <line x1="32" y1="30" x2="32" y2="52" stroke={c} strokeWidth=".7" opacity=".6" />
      <line x1="42" y1="30" x2="42" y2="52" stroke={c} strokeWidth=".7" opacity=".6" />
      <circle cx="32" cy="40" r="4" fill={c} />
    </Art>
  );
}

export function IconSawmill({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <rect x="14" y="30" width="36" height="22" fill={c} opacity=".22" stroke={c} strokeWidth="1" />
      <polygon points="14,30 32,18 50,30" fill={c} opacity=".5" />
      <circle cx="22" cy="44" r="3" fill="none" stroke={c} strokeWidth="1" />
      <circle cx="30" cy="44" r="3" fill="none" stroke={c} strokeWidth="1" />
      <circle cx="38" cy="44" r="3" fill="none" stroke={c} strokeWidth="1" />
    </Art>
  );
}

export function IconQuarry({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <polygon points="32,12 50,30 44,52 20,52 14,30" fill={c} opacity=".25" stroke={c} strokeWidth="1.2" />
      <polygon points="32,20 42,32 38,46 26,46 22,32" fill={c} opacity=".55" />
      <polygon points="32,28 36,36 28,36" fill={c} />
    </Art>
  );
}

export function IconIronMine({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <path d="M14,52 L20,28 L32,16 L44,28 L50,52 Z" fill={c} opacity=".25" stroke={c} strokeWidth="1.2" />
      <polygon points="26,40 32,28 38,40 34,44 30,44" fill={c} />
      <line x1="32" y1="44" x2="32" y2="52" stroke={c} strokeWidth="1.5" />
    </Art>
  );
}

export function IconField({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <rect x="10" y="34" width="44" height="18" fill={c} opacity=".22" stroke={c} strokeWidth="1" />
      <line x1="10" y1="40" x2="54" y2="40" stroke={c} strokeWidth=".7" opacity=".7" />
      <line x1="10" y1="46" x2="54" y2="46" stroke={c} strokeWidth=".7" opacity=".7" />
      <line x1="32" y1="14" x2="32" y2="34" stroke={c} strokeWidth="1.5" />
      <line x1="28" y1="20" x2="36" y2="20" stroke={c} strokeWidth="1.5" />
      <line x1="26" y1="26" x2="38" y2="26" stroke={c} strokeWidth="1.5" />
    </Art>
  );
}

export function IconStable({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <rect x="10" y="32" width="44" height="20" fill={c} opacity=".22" stroke={c} strokeWidth="1" />
      <polygon points="8,32 32,18 56,32" fill={c} opacity=".5" />
      <rect x="20" y="38" width="10" height="14" fill="#2a1d10" stroke={c} strokeWidth=".7" />
      <rect x="34" y="38" width="10" height="14" fill="#2a1d10" stroke={c} strokeWidth=".7" />
    </Art>
  );
}

export function IconTower({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <rect x="22" y="20" width="20" height="34" fill={c} opacity=".25" stroke={c} strokeWidth="1.2" />
      <polygon points="20,20 44,20 32,8" fill={c} opacity=".7" />
      <rect x="22" y="14" width="3" height="6" fill={c} />
      <rect x="29" y="14" width="3" height="6" fill={c} />
      <rect x="36" y="14" width="3" height="6" fill={c} />
      <circle cx="32" cy="34" r="3" fill="none" stroke={c} strokeWidth="1" />
    </Art>
  );
}

export function IconEmbassy({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art size={size}>
      <polygon points="32,10 52,28 52,52 12,52 12,28" fill={c} opacity=".22" stroke={c} strokeWidth="1.2" />
      <polygon points="32,18 44,30 44,46 20,46 20,30" fill={c} opacity=".5" />
      <rect x="29" y="22" width="6" height="14" fill={c} />
      <polygon points="35,22 41,26 35,30" fill={c} />
    </Art>
  );
}

// ── Troop icons ───────────────────────────────────────────────

export function IconSwordsman({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art viewBox="0 0 40 40" size={size}>
      <circle cx="20" cy="14" r="5" fill={c} opacity=".55" />
      <polygon points="20,20 28,30 24,36 16,36 12,30" fill={c} opacity=".7" />
      <line x1="20" y1="6" x2="20" y2="26" stroke={c} strokeWidth="1.4" />
      <line x1="16" y1="10" x2="24" y2="10" stroke={c} strokeWidth="1.4" />
    </Art>
  );
}

export function IconArcher({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art viewBox="0 0 40 40" size={size}>
      <circle cx="20" cy="14" r="5" fill={c} opacity=".55" />
      <path d="M10,12 Q20,30 30,12" fill="none" stroke={c} strokeWidth="1.4" />
      <line x1="10" y1="12" x2="30" y2="12" stroke={c} strokeWidth=".8" opacity=".5" />
      <line x1="20" y1="12" x2="32" y2="20" stroke={c} strokeWidth="1.2" />
    </Art>
  );
}

export function IconKnight({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art viewBox="0 0 40 40" size={size}>
      <polygon points="20,6 30,14 30,30 20,36 10,30 10,14" fill={c} opacity=".35" stroke={c} strokeWidth="1.2" />
      <polygon points="20,12 26,16 26,28 20,32 14,28 14,16" fill={c} opacity=".7" />
      <rect x="18" y="18" width="4" height="10" fill="#2a1d10" />
    </Art>
  );
}

export function IconSpy({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art viewBox="0 0 40 40" size={size}>
      <circle cx="20" cy="20" r="14" fill="none" stroke={c} strokeWidth="1.2" opacity=".4" />
      <circle cx="20" cy="20" r="6" fill={c} opacity=".7" />
      <circle cx="20" cy="20" r="2" fill="#2a1d10" />
    </Art>
  );
}

export function IconCatapult({ c = "currentColor", size = 40 }: IconProps) {
  return (
    <Art viewBox="0 0 40 40" size={size}>
      <line x1="6" y1="30" x2="34" y2="14" stroke={c} strokeWidth="2" />
      <circle cx="34" cy="14" r="4" fill={c} />
      <polygon points="6,30 14,30 10,36" fill={c} opacity=".7" />
      <circle cx="14" cy="34" r="2" fill={c} />
      <circle cx="26" cy="34" r="2" fill={c} />
    </Art>
  );
}

// ── Faction emblems ───────────────────────────────────────────

export function FactionEmblem({ faction, size = 40 }: { faction: string; size?: number }) {
  const f = faction?.toLowerCase();
  const c = "var(--nh-accent-bright)";

  if (f === "portadores") {
    // Eye of the bearer
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} style={{ display: "block" }}>
        <path d="M4,20 Q20,8 36,20 Q20,32 4,20 Z" fill="none" stroke={c} strokeWidth="1.5" />
        <circle cx="20" cy="20" r="5" fill={c} />
        <circle cx="20" cy="20" r="1.5" fill="#2a1d10" />
      </svg>
    );
  }
  if (f === "federacion") {
    // Triple peak
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} style={{ display: "block" }}>
        <polygon points="20,6 30,28 10,28" fill="none" stroke={c} strokeWidth="1.5" />
        <polygon points="20,14 26,26 14,26" fill={c} opacity=".7" />
      </svg>
    );
  }
  // Imperio — hexagonal crest
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} style={{ display: "block" }}>
      <polygon points="20,6 32,12 32,24 20,34 8,24 8,12" fill="none" stroke={c} strokeWidth="1.5" />
      <polygon points="20,14 26,18 26,24 20,28 14,24 14,18" fill={c} />
    </svg>
  );
}

// ── Resource glyphs ───────────────────────────────────────────

const RESOURCE_GLYPH: Record<string, string> = {
  wood: "🌲", stone: "◆", iron: "◇", grain: "✦",
  straw: "∼", adobe: "▢", silver: "◯", gold: "✶",
};
export function ResourceGlyph({ kind }: { kind: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(0,0,0,0.65)", lineHeight: 1 }}>
      {RESOURCE_GLYPH[kind] ?? "·"}
    </span>
  );
}

// ── Panel corner flourish ─────────────────────────────────────

export function PanelCorner() {
  return (
    <svg viewBox="0 0 12 12" style={{ display: "block", width: "100%", height: "100%" }}>
      <path d="M0,0 L5,0 M0,0 L0,5 M0,0 L4,4" stroke="var(--nh-gold)" strokeWidth="1.2" fill="none" />
      <circle cx="0.5" cy="0.5" r="1" fill="var(--nh-gold)" />
    </svg>
  );
}

export function PanelCorners() {
  return (
    <>
      <span className="nh-corner tl"><PanelCorner /></span>
      <span className="nh-corner tr"><PanelCorner /></span>
      <span className="nh-corner bl"><PanelCorner /></span>
      <span className="nh-corner br"><PanelCorner /></span>
    </>
  );
}

// ── Nav glyphs (small SVG for navbar buttons) ─────────────────

export function GlyphVillage() {
  return <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,2 12,12 2,12" fill="none" stroke="currentColor" strokeWidth="1.4" /><rect x="6" y="9" width="2" height="3" fill="currentColor" /></svg>;
}
export function GlyphMap() {
  return <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 12,4 12,10 7,13 2,10 2,4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>;
}
export function GlyphHero() {
  return <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 13,7 7,13 1,7" fill="none" stroke="currentColor" strokeWidth="1.4" /><circle cx="7" cy="7" r="2" fill="currentColor" /></svg>;
}
export function GlyphNobility() {
  return <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2,10 L2,5 L5,8 L7,3 L9,8 L12,5 L12,10 Z" fill="none" stroke="currentColor" strokeWidth="1.4" /><line x1="2" y1="11.5" x2="12" y2="11.5" stroke="currentColor" strokeWidth="1.4" /></svg>;
}
export function GlyphBattles() {
  return <svg width="14" height="14" viewBox="0 0 14 14"><line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" strokeWidth="1.6" /><line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" strokeWidth="1.6" /></svg>;
}
export function GlyphEvents() {
  return <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="3" width="10" height="8" fill="none" stroke="currentColor" strokeWidth="1.4" /><line x1="4" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1" /><line x1="4" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1" /></svg>;
}

// ── Building icon lookup (by building type) ───────────────────

const BUILDING_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  MAIN_HALL:       IconMainHall,
  GRANARY:         IconGranary,
  BARRACKS:        IconBarracks,
  FORGE:           IconWorkshop,
  SIEGE_WORKSHOP:  IconWorkshop,
  WALLS:           IconWall,
  MARKET:          IconMarket,
  WAREHOUSE:       IconGranary,
  SAWMILL:         IconSawmill,
  QUARRY:          IconQuarry,
  IRON_MINE:       IconIronMine,
  FIELDS:          IconField,
  STABLES:         IconStable,
  WATCHTOWER:      IconTower,
  CHAPEL:          IconEmbassy,
  TAVERN:          IconMarket,
  RALLY_POINT:     IconTower,
  RESIDENCE:       IconMainHall,
  EMBASSY:         IconEmbassy,
};

export function BuildingIcon({ type, size = 40, c = "currentColor" }: { type: string; size?: number; c?: string }) {
  const Icon = BUILDING_ICONS[type];
  if (!Icon) {
    // fallback: plus sign
    return (
      <svg viewBox="0 0 40 40" width={size} height={size} style={{ display: "block", opacity: 0.5 }}>
        <line x1="20" y1="10" x2="20" y2="30" stroke={c} strokeWidth="2" />
        <line x1="10" y1="20" x2="30" y2="20" stroke={c} strokeWidth="2" />
      </svg>
    );
  }
  return <Icon c={c} size={size} />;
}

// Troop icon lookup
const TROOP_ICONS_MAP: Record<string, (props: IconProps) => ReactElement> = {
  LANCERO_OSCURO:    IconSwordsman,
  PORTADOR_MAESTRO:  IconSpy,
  ASEDIO_SOMBRA:     IconCatapult,
  JINETE_PORTADOR:   IconKnight,
  LEGIONARIO:        IconSwordsman,
  BALLESTERO_IMPERIO: IconArcher,
  CABALLERO_DORADO:  IconKnight,
  ARTILLERO_IMPERIAL: IconCatapult,
  EXPLORADOR_ALIANZA: IconArcher,
  GUARDABOSQUES:     IconSwordsman,
  RANGER_FEDERACION: IconArcher,
  CABALLERO_ALIADO:  IconKnight,
  CATAPULTA_ALIANZA: IconCatapult,
};

export function TroopIcon({ type, size = 40, c = "currentColor" }: { type: string; size?: number; c?: string }) {
  const Icon = TROOP_ICONS_MAP[type];
  if (!Icon) return <IconSwordsman c={c} size={size} />;
  return <Icon c={c} size={size} />;
}
