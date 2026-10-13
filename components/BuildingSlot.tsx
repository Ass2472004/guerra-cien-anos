"use client";
import { BUILDINGS } from "@/lib/game/constants/buildings";
import { BuildingArt } from "./BuildingArt";

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
  queuePct?: number;          // 0–100, barra de progreso bajo el edificio
  onClick?: () => void;
  size?: number;
  selected?: boolean;
  showLabel?: boolean;
}) {
  const def = BUILDINGS[type as keyof typeof BUILDINGS];
  const isEmpty = level === 0;
  const name = def?.name ?? type;
  const small = size < 80;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`bslot${isEmpty ? " is-empty" : ""}${inProgress ? " is-building" : ""}${selected ? " is-selected" : ""}${showLabel ? " show-label" : ""}`}
      style={{ width: size * 1.2, height: size }}
      aria-label={isEmpty ? `${name}: construir` : `${name}, nivel ${level}`}
    >
      <span className="bslot-name">{name}</span>
      <BuildingArt type={type} size={size * 1.2} empty={isEmpty} building={!!inProgress} />

      {level > 0 && (
        <span className={`bslot-level${small ? " is-small" : ""}`}>{level}</span>
      )}

      {typeof queuePct === "number" && (
        <span className="bslot-progress"><i style={{ width: `${queuePct}%` }} /></span>
      )}
    </button>
  );
}
