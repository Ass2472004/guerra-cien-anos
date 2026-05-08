"use client";
import { BUILDINGS } from "@/lib/game/constants/buildings";
import { BuildingIcon } from "./NhIcons";

// Color ring per building category (matches design spec)
const TYPE_RING: Record<string, string> = {
  civic:    "var(--nh-gold)",
  military: "#d97142",
  defense:  "#3a7bd9",
  resource: "#6db866",
  storage:  "#e8c84a",
  economy:  "#22d3ee",
};

// Map our building types → design categories
const TYPE_CATEGORY: Record<string, string> = {
  MAIN_HALL:      "civic",
  RESIDENCE:      "civic",
  CHAPEL:         "civic",
  EMBASSY:        "civic",
  TAVERN:         "economy",
  MARKET:         "economy",
  WAREHOUSE:      "storage",
  GRANARY:        "storage",
  BARRACKS:       "military",
  STABLES:        "military",
  FORGE:          "military",
  SIEGE_WORKSHOP: "military",
  RALLY_POINT:    "military",
  WALLS:          "defense",
  WATCHTOWER:     "defense",
  SAWMILL:        "resource",
  QUARRY:         "resource",
  IRON_MINE:      "resource",
  FIELDS:         "resource",
};

export function BuildingSlot({
  type,
  level,
  inProgress,
  queuePct,
  onClick,
  size = 64,
  selected = false,
  showLabel = false,
}: {
  type: string;
  level: number;
  inProgress?: boolean;
  queuePct?: number;          // 0–100, shown as progress bar below slot
  onClick?: () => void;
  size?: number;
  selected?: boolean;
  showLabel?: boolean;
}) {
  const def = BUILDINGS[type as keyof typeof BUILDINGS];
  const cat = TYPE_CATEGORY[type] ?? "civic";
  const ring = TYPE_RING[cat] ?? "var(--nh-accent)";
  const isEmpty = level === 0;
  const iconSize = Math.floor(size * 0.58);

  return (
    <button
      onClick={onClick}
      className={`nh-slot${isEmpty ? " is-empty" : ""}${inProgress ? " is-building" : ""}${selected ? " is-selected-ring" : ""}`}
      style={{
        "--ring": ring,
        width: size,
        height: size,
      } as React.CSSProperties}
      title={def?.name ?? type}
    >
      <div className="nh-slot-art" style={{ padding: size > 80 ? 18 : 10 }}>
        <BuildingIcon type={type} size={iconSize} c={ring} />
      </div>

      {/* Level badge */}
      {level > 0 && (
        <span
          className="nh-slot-level"
          style={{
            fontSize: size > 80 ? 12 : 9,
            width: size > 80 ? 22 : 16,
            height: size > 80 ? 22 : 16,
          }}
        >
          {level}
        </span>
      )}

      {/* Build progress bar */}
      {typeof queuePct === "number" && (
        <span className="nh-slot-progress">
          <i style={{ width: `${queuePct}%` }} />
        </span>
      )}
    </button>
  );
}
