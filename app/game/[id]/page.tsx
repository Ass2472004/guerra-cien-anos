"use client";
import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

type TileVisibility = "HIDDEN" | "FOG" | "VISIBLE";
type TileType = "PLAIN" | "VILLAGE" | "OASIS_FOREST" | "OASIS_STONE" | "OASIS_IRON"
  | "OASIS_GRAIN" | "DEPOSIT_SILVER" | "DEPOSIT_GOLD" | "RUINS" | "RIVER" | "MOUNTAIN" | "CAMP";

interface Tile {
  id: string; x: number; y: number;
  type: TileType; visibility: TileVisibility;
  bonus: Record<string, number>;
  village?: { id: string; name: string; owner: string; faction: string | null; loyalty: number } | null;
  camp?: { id: string; owner: string; level: number } | null;
}
interface ArmyOnMap {
  id: string; tileId: string; owner: string; faction: string;
  stamina: number; isMoving: boolean; isResting: boolean; isForaging: boolean;
}
interface MapData {
  width: number; height: number; faction: string; tick: number;
  tiles: Tile[]; armies: ArmyOnMap[];
  hero: { tileId: string | null; isOnAdventure: boolean; isAlive: boolean; hp: number; maxHp: number; level: number } | null;
}

const TILE_COLORS: Record<TileType, string> = {
  PLAIN:          "bg-green-900",
  VILLAGE:        "bg-amber-900",
  OASIS_FOREST:   "bg-emerald-800",
  OASIS_STONE:    "bg-slate-700",
  OASIS_IRON:     "bg-orange-900",
  OASIS_GRAIN:    "bg-yellow-800",
  DEPOSIT_SILVER: "bg-slate-500",
  DEPOSIT_GOLD:   "bg-yellow-600",
  RUINS:          "bg-stone-700",
  RIVER:          "bg-blue-800",
  MOUNTAIN:       "bg-stone-600",
  CAMP:           "bg-red-900",
};

const TILE_ICONS: Record<TileType, string> = {
  PLAIN: "", VILLAGE: "🏘", OASIS_FOREST: "🌲", OASIS_STONE: "⛏",
  OASIS_IRON: "⚒", OASIS_GRAIN: "🌾", DEPOSIT_SILVER: "🪙",
  DEPOSIT_GOLD: "💰", RUINS: "🏚", RIVER: "🌊", MOUNTAIN: "⛰", CAMP: "⛺",
};

const FACTION_COLORS: Record<string, string> = {
  PLAYER: "border-2 border-amber-400",
  AI_RIVAL: "border-2 border-red-500",
  AI_NEUTRAL: "border border-stone-500",
};

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [ticking, setTicking] = useState(false);

  const loadMap = useCallback(async () => {
    const res = await fetch(`/api/game/${id}/map`);
    if (res.ok) setMapData(await res.json());
  }, [id]);

  useEffect(() => { loadMap(); }, [loadMap]);

  // Auto-tick every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetch(`/api/game/${id}/tick`, { method: "POST" });
      loadMap();
    }, 60000);
    return () => clearInterval(interval);
  }, [id, loadMap]);

  async function manualTick() {
    setTicking(true);
    await fetch(`/api/game/${id}/tick`, { method: "POST" });
    await loadMap();
    setTicking(false);
  }

  if (!mapData) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-950 text-amber-400 text-xl">Cargando mapa…</div>;
  }

  const tileMap = new Map(mapData.tiles.map(t => [`${t.x},${t.y}`, t]));
  const armiesByTile = new Map<string, ArmyOnMap[]>();
  for (const a of mapData.armies) {
    const existing = armiesByTile.get(a.tileId) ?? [];
    existing.push(a);
    armiesByTile.set(a.tileId, existing);
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-4 py-2 flex items-center justify-between">
        <h1 className="text-amber-400 font-bold text-lg">Guerra de los Cien Años</h1>
        <div className="flex items-center gap-4 text-sm text-stone-400">
          <span>Tick: {mapData.tick}</span>
          <span>Facción: <span className="text-amber-400 font-semibold">{mapData.faction}</span></span>
          <button
            onClick={manualTick}
            disabled={ticking}
            className="px-3 py-1 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50 text-stone-200 transition-colors"
          >
            {ticking ? "⏳" : "⏩ Tick"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 overflow-auto p-4">
          <div
            className="inline-grid gap-px bg-stone-800"
            style={{ gridTemplateColumns: `repeat(${mapData.width}, 2rem)` }}
          >
            {Array.from({ length: mapData.height }, (_, y) =>
              Array.from({ length: mapData.width }, (_, x) => {
                const tile = tileMap.get(`${x},${y}`);
                if (!tile) return <div key={`${x},${y}`} className="w-8 h-8 bg-stone-900" />;

                const isHidden = tile.visibility === "HIDDEN";
                const isFog = tile.visibility === "FOG";
                const isSelected = selected?.id === tile.id;
                const armiesHere = armiesByTile.get(tile.id) ?? [];
                const playerArmy = armiesHere.find(a => a.owner === "PLAYER");
                const rivalArmy = armiesHere.find(a => a.owner === "AI_RIVAL");
                const villageOwner = tile.village?.owner;

                return (
                  <button
                    key={`${x},${y}`}
                    onClick={() => setSelected(isHidden ? null : tile)}
                    className={[
                      "w-8 h-8 flex items-center justify-center text-xs relative transition-all",
                      isHidden ? "bg-stone-950" : isFog ? `${TILE_COLORS[tile.type]} opacity-40` : TILE_COLORS[tile.type],
                      isSelected ? "ring-2 ring-amber-400 z-10" : "",
                      villageOwner ? FACTION_COLORS[villageOwner] ?? "" : "",
                    ].join(" ")}
                    title={isHidden ? "?" : `${tile.type} (${x},${y})`}
                  >
                    {!isHidden && (
                      <>
                        <span>{TILE_ICONS[tile.type]}</span>
                        {playerArmy && <span className="absolute top-0 right-0 text-[8px]">🟡</span>}
                        {rivalArmy && <span className="absolute bottom-0 right-0 text-[8px]">🔴</span>}
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-72 bg-stone-900 border-l border-stone-800 p-4 overflow-y-auto space-y-4">
          {/* Legend */}
          <div>
            <h2 className="text-amber-400 font-semibold mb-2">Leyenda</h2>
            <div className="grid grid-cols-2 gap-1 text-xs text-stone-400">
              {Object.entries(TILE_ICONS).filter(([,v]) => v).map(([type, icon]) => (
                <span key={type}>{icon} {type.replace("_", " ").toLowerCase()}</span>
              ))}
              <span>🟡 Tu ejército</span>
              <span>🔴 Ejército rival</span>
            </div>
          </div>

          {/* Hero */}
          {mapData.hero && (
            <div className="bg-stone-800 rounded p-3 space-y-1">
              <h2 className="text-amber-400 font-semibold">Héroe — Nv. {mapData.hero.level}</h2>
              <div className="w-full bg-stone-700 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(mapData.hero.hp / mapData.hero.maxHp) * 100}%` }}
                />
              </div>
              <p className="text-xs text-stone-400">{mapData.hero.hp}/{mapData.hero.maxHp} HP</p>
              {mapData.hero.isOnAdventure && <p className="text-xs text-amber-400">En aventura…</p>}
              {!mapData.hero.isAlive && <p className="text-xs text-red-400">Muerto — reviviendo…</p>}
            </div>
          )}

          {/* Selected tile info */}
          {selected && (
            <div className="bg-stone-800 rounded p-3 space-y-2">
              <h2 className="text-amber-400 font-semibold">
                {selected.type.replace(/_/g, " ")} ({selected.x},{selected.y})
              </h2>
              {Object.entries(selected.bonus).length > 0 && (
                <p className="text-xs text-green-400">
                  Bonus: {Object.entries(selected.bonus).map(([k,v]) => `+${v}% ${k}`).join(", ")}
                </p>
              )}
              {selected.village && (
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{selected.village.name}</p>
                  <p className="text-xs text-stone-400">
                    Dueño: <span className={selected.village.owner === "PLAYER" ? "text-amber-400" : selected.village.owner === "AI_RIVAL" ? "text-red-400" : "text-stone-300"}>{selected.village.owner}</span>
                  </p>
                  {selected.village.owner === "PLAYER" && (
                    <Link
                      href={`/game/${id}/village/${selected.village.id}`}
                      className="block mt-2 text-center py-1 rounded bg-amber-700 hover:bg-amber-600 text-sm transition-colors"
                    >
                      Gestionar aldea
                    </Link>
                  )}
                </div>
              )}
              {selected.camp && (
                <p className="text-xs text-stone-400">Campamento Nv. {selected.camp.level} — {selected.camp.owner}</p>
              )}
            </div>
          )}

          {!selected && (
            <p className="text-stone-500 text-sm">Haz clic en una casilla visible para ver detalles.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
