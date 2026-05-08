"use client";
import { BUILDING_ICONS, BUILDING_COLORS } from "@/lib/game/constants/buildingIcons";
import { BUILDINGS } from "@/lib/game/constants/buildings";
import { BuildingIllustration } from "./BuildingIllustration";

export function BuildingSlot({
  type, level, inProgress, onClick, size = 64,
}: {
  type: string;
  level: number;
  inProgress?: boolean;
  onClick?: () => void;
  size?: number;
}) {
  const def = BUILDINGS[type as keyof typeof BUILDINGS];
  const icon = BUILDING_ICONS[type] ?? "🏗";
  const color = BUILDING_COLORS[type] ?? BUILDING_COLORS.MAIN_HALL;
  const isEmpty = level === 0;
  const innerSize = Math.floor(size * 0.85);

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-1 transition-all hover:scale-110 active:scale-95"
      title={def?.name ?? type}
    >
      <div
        className="relative rounded-full flex items-center justify-center transition-all group-hover:brightness-125"
        style={{
          width: size, height: size,
          background: isEmpty
            ? "radial-gradient(circle, rgba(110,80,40,0.18) 0%, rgba(40,28,15,0.35) 70%)"
            : `radial-gradient(circle at 30% 30%, ${color.ring}55, transparent 60%), linear-gradient(135deg, #3a2818 0%, #150d05 100%)`,
          border: `2px solid ${isEmpty ? "rgba(139,90,43,0.35)" : color.ring}`,
          boxShadow: isEmpty
            ? "inset 0 -4px 8px rgba(0,0,0,0.4)"
            : `0 0 16px ${color.ring}66, inset 0 -6px 12px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.12)`,
        }}
      >
        <div
          style={{
            filter: isEmpty ? "grayscale(1) brightness(0.35)" : undefined,
            opacity: isEmpty ? 0.35 : 1,
            transition: "all 0.2s",
          }}
        >
          {isEmpty ? (
            <span style={{ fontSize: size * 0.35 }}>{icon}</span>
          ) : (
            <BuildingIllustration type={type} size={innerSize} />
          )}
        </div>

        {/* Level badge */}
        {level > 0 && !inProgress && (
          <span
            className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-400 to-amber-700 text-stone-950 text-[10px] font-display font-extrabold rounded-full border-2 border-stone-900 leading-none flex items-center justify-center"
            style={{ width: 22, height: 22, boxShadow: "0 2px 4px rgba(0,0,0,0.6)" }}
          >
            {level}
          </span>
        )}

        {/* In progress overlay */}
        {inProgress && (
          <span
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm border-2 border-amber-500 animate-pulse"
          >
            <span className="text-2xl">🏗</span>
          </span>
        )}
      </div>

      {/* Label */}
      <span className={`text-[10px] font-display tracking-wider text-center max-w-[80px] leading-tight ${isEmpty ? "text-stone-600" : "text-parchment-aged"}`}>
        {def?.name?.split(" ").slice(0, 2).join(" ") ?? type}
      </span>
    </button>
  );
}
