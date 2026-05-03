"use client";
import { TROOPS } from "@/lib/game/constants/troops";
import { TROOP_ICONS, ROLE_COLORS, FACTION_VISUALS } from "@/lib/game/constants/troopIcons";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = { xs: 28, sm: 36, md: 48, lg: 64, xl: 96 };
const SIZE_FONT: Record<Size, string> = {
  xs: "text-sm", sm: "text-base", md: "text-xl", lg: "text-3xl", xl: "text-5xl",
};

// ──────────────────────────────────────────────────────────────────────
// TroopPortrait — retrato circular con anillo por rol y fondo por facción
// ──────────────────────────────────────────────────────────────────────
export function TroopPortrait({
  troopType, size = "md", count, showName = false,
}: {
  troopType: string;
  size?: Size;
  count?: number;
  showName?: boolean;
}) {
  const def = TROOPS[troopType];
  const icon = TROOP_ICONS[troopType] ?? "⚔";
  const role = ROLE_COLORS[def?.role ?? "OFF"];
  const fac = FACTION_VISUALS[def?.faction ?? "PORTADORES"];
  const px = SIZE_PX[size];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-shrink-0">
        <div
          className="rounded-full flex items-center justify-center shadow-lg"
          style={{
            width: px, height: px,
            background: fac.gradient,
            border: `2px solid ${role.ring}`,
            boxShadow: `0 0 8px ${role.ring}55, inset 0 -4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)`,
          }}
        >
          <span className={`${SIZE_FONT[size]} drop-shadow-lg`} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }}>
            {icon}
          </span>
        </div>
        {typeof count === "number" && count > 0 && (
          <span
            className="absolute -bottom-1 -right-1 bg-stone-900 text-parchment-aged text-[10px] font-display font-bold rounded-full px-1.5 py-0.5 border border-bronze leading-none"
            style={{ minWidth: 18 }}
          >
            {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
          </span>
        )}
      </div>
      {showName && def && (
        <div className="min-w-0">
          <p className="font-display text-xs text-parchment-aged truncate">{def.name}</p>
          <p className={`text-[9px] ${role.text} uppercase tracking-wider`}>{def.role}</p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// HeroPortrait — retrato grande de héroe con marco dorado decorativo
// ──────────────────────────────────────────────────────────────────────
export function HeroPortrait({
  faction, name, level, hp, maxHp, size = "lg", isAlive = true, isOnAdventure = false,
}: {
  faction: string;
  name?: string;
  level?: number;
  hp?: number;
  maxHp?: number;
  size?: Size;
  isAlive?: boolean;
  isOnAdventure?: boolean;
}) {
  const fac = FACTION_VISUALS[faction] ?? FACTION_VISUALS.PORTADORES;
  const px = SIZE_PX[size];

  // Hero glyph by faction
  const glyph = faction === "PORTADORES" ? "🗡" : faction === "IMPERIO" ? "🐉" : "⚓";

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        {/* Decorative outer ring */}
        <div
          className="rounded-full p-[3px]"
          style={{
            background: `conic-gradient(from 45deg, ${fac.ring}, #d9a847, ${fac.ring}, #b8862f, ${fac.ring})`,
            width: px + 6, height: px + 6,
            boxShadow: `0 0 16px ${fac.ring}88, 0 4px 12px rgba(0,0,0,0.6)`,
          }}
        >
          <div
            className="rounded-full flex items-center justify-center w-full h-full"
            style={{
              background: fac.gradient,
              border: "2px solid rgba(0,0,0,0.4)",
              boxShadow: "inset 0 -8px 16px rgba(0,0,0,0.6), inset 0 4px 8px rgba(255,255,255,0.08)",
              filter: !isAlive ? "grayscale(1) brightness(0.5)" : isOnAdventure ? "brightness(0.85)" : "none",
            }}
          >
            <span className={`${SIZE_FONT[size]} drop-shadow-lg`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9))" }}>
              {glyph}
            </span>
          </div>
        </div>

        {/* Level badge */}
        {typeof level === "number" && (
          <span
            className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-400 to-amber-700 text-stone-950 text-[10px] font-display font-extrabold rounded-full border-2 border-stone-900 leading-none flex items-center justify-center"
            style={{ width: 22, height: 22, boxShadow: "0 2px 6px rgba(0,0,0,0.6)" }}
          >
            {level}
          </span>
        )}

        {/* Faction flag corner */}
        <span
          className="absolute -top-1 -left-1 text-[10px] leading-none"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }}
        >
          {fac.emoji}
        </span>

        {/* Status overlays */}
        {!isAlive && (
          <span className="absolute inset-0 flex items-center justify-center text-2xl">💀</span>
        )}
        {isOnAdventure && isAlive && (
          <span className="absolute -top-2 -right-2 bg-gold-bright text-ink text-[10px] rounded-full w-5 h-5 flex items-center justify-center border border-stone-900">🗺</span>
        )}
      </div>

      {(name || typeof hp === "number") && (
        <div className="min-w-0 flex-1">
          {name && (
            <p className={`font-display text-sm truncate ${fac.accent}`}>
              {name} {level && <span className="text-stone-500 text-[10px]">Nv.{level}</span>}
            </p>
          )}
          {typeof hp === "number" && typeof maxHp === "number" && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex-1 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-red-900/50">
                <div
                  className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all"
                  style={{ width: `${(hp / maxHp) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-stone-500 whitespace-nowrap">{hp}/{maxHp}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// FactionCrest — escudo heráldico para mostrar facción
// ──────────────────────────────────────────────────────────────────────
export function FactionCrest({
  faction, size = "md", showName = false,
}: {
  faction: string;
  size?: Size;
  showName?: boolean;
}) {
  const fac = FACTION_VISUALS[faction] ?? FACTION_VISUALS.PORTADORES;
  const px = SIZE_PX[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-md flex-shrink-0"
        style={{
          width: px, height: px,
          background: fac.gradient,
          border: `2px solid ${fac.ring}`,
          boxShadow: `0 0 10px ${fac.ring}66, inset 0 -4px 8px rgba(0,0,0,0.5)`,
        }}
      >
        <span className={SIZE_FONT[size]} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }}>
          {fac.emoji}
        </span>
      </div>
      {showName && (
        <p className={`font-display text-sm ${fac.accent}`}>
          {faction === "PORTADORES" ? "Portadores" : faction === "IMPERIO" ? "Imperio" : "Federación"}
        </p>
      )}
    </div>
  );
}
