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

const TILE_BG: Record<TileType, string> = {
  PLAIN:          "bg-[#3d4f2c]",
  VILLAGE:        "bg-[#7a4a1f]",
  OASIS_FOREST:   "bg-[#1d3a1a]",
  OASIS_STONE:    "bg-[#52524a]",
  OASIS_IRON:     "bg-[#4a3024]",
  OASIS_GRAIN:    "bg-[#8a6a1f]",
  DEPOSIT_SILVER: "bg-[#7c7c70]",
  DEPOSIT_GOLD:   "bg-[#a07820]",
  RUINS:          "bg-[#3a2818]",
  RIVER:          "bg-[#2a4868]",
  MOUNTAIN:       "bg-[#5a4a3a]",
  CAMP:           "bg-[#5d2828]",
};

const TILE_ICONS: Record<TileType, string> = {
  PLAIN: "", VILLAGE: "🏰", OASIS_FOREST: "🌲", OASIS_STONE: "⛏",
  OASIS_IRON: "⚒", OASIS_GRAIN: "🌾", DEPOSIT_SILVER: "🪙",
  DEPOSIT_GOLD: "💰", RUINS: "🏚", RIVER: "🌊", MOUNTAIN: "⛰", CAMP: "⛺",
};

const FACTION_BORDER: Record<string, string> = {
  PLAYER: "ring-2 ring-amber-400",
  AI_RIVAL: "ring-2 ring-red-500",
  AI_NEUTRAL: "ring-1 ring-stone-400",
};

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [selectedArmyId, setSelectedArmyId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [ticking, setTicking] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const loadMap = useCallback(async () => {
    const res = await fetch(`/api/game/${id}/map`);
    if (res.ok) setMapData(await res.json());
  }, [id]);

  useEffect(() => { loadMap(); }, [loadMap]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/game/${id}/tick`, { method: "POST" });
      const data = await res.json();
      if (data.battles && data.battles > 0) showToast(`⚔ ${data.battles} batalla(s) resueltas`);
      loadMap();
    }, 30000);
    return () => clearInterval(interval);
  }, [id, loadMap]);

  async function manualTick() {
    setTicking(true);
    const res = await fetch(`/api/game/${id}/tick`, { method: "POST" });
    const data = await res.json();
    if (data.battles && data.battles > 0) showToast(`⚔ ${data.battles} batalla(s) resueltas`);
    await loadMap();
    setTicking(false);
  }

  async function moveArmy(targetX: number, targetY: number) {
    if (!selectedArmyId) return;
    const res = await fetch(`/api/game/${id}/army`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MOVE", payload: { armyId: selectedArmyId, targetX, targetY } }),
    });
    const data = await res.json();
    if (!res.ok) showToast(data.error ?? "Error al mover");
    else showToast(`Marcha iniciada (ETA ${data.eta}s)`);
    setMoveMode(false);
    setSelectedArmyId(null);
    loadMap();
  }

  async function armyAction(armyId: string, action: "REST" | "FORAGE") {
    const res = await fetch(`/api/game/${id}/army`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: { armyId } }),
    });
    if (res.ok) { showToast(action === "REST" ? "Estado de descanso cambiado" : "Forrajeo cambiado"); loadMap(); }
  }

  if (!mapData) {
    return <div className="min-h-screen flex items-center justify-center title-gold text-2xl font-display">Cargando reino…</div>;
  }

  const tileMap = new Map(mapData.tiles.map(t => [`${t.x},${t.y}`, t]));
  const armiesByTile = new Map<string, ArmyOnMap[]>();
  for (const a of mapData.armies) {
    const existing = armiesByTile.get(a.tileId) ?? [];
    existing.push(a);
    armiesByTile.set(a.tileId, existing);
  }
  const armiesOnSelectedTile = selected ? (armiesByTile.get(selected.id) ?? []) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="banner px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚜</span>
          <h1 className="font-display title-gold text-lg md:text-xl">Guerra de los Cien Años</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden md:inline text-parchment-aged">Año {mapData.tick}</span>
          <span className="hidden md:inline text-gold-pale">Reino: <strong>{mapData.faction}</strong></span>
          <Link href={`/game/${id}/hero`} className="btn-medieval text-xs">⚔ Héroe</Link>
          <Link href={`/game/${id}/battles`} className="btn-blood text-xs">📜 Crónicas</Link>
          <button onClick={manualTick} disabled={ticking} className="btn-medieval text-xs">
            {ticking ? "⏳" : "⏩ Avanzar"}
          </button>
        </div>
      </header>

      {toast && (
        <div className="fixed top-20 right-4 parchment px-4 py-2 z-50 font-display">
          {toast}
        </div>
      )}

      {moveMode && (
        <div className="bg-amber-900/80 border-b-2 border-gold text-parchment px-4 py-2 text-sm flex items-center justify-between">
          <span className="font-display">🎯 Selecciona una casilla destino para mover el ejército</span>
          <button onClick={() => { setMoveMode(false); setSelectedArmyId(null); }} className="underline italic">Cancelar</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          <div className="inline-grid gap-px bg-[#1f140a] p-1 border-2 border-bronze rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.6)]" style={{ gridTemplateColumns: `repeat(${mapData.width}, 2.25rem)` }}>
            {Array.from({ length: mapData.height }, (_, y) =>
              Array.from({ length: mapData.width }, (_, x) => {
                const tile = tileMap.get(`${x},${y}`);
                if (!tile) return <div key={`${x},${y}`} className="w-9 h-9 bg-stone-950" />;

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
                    onClick={() => {
                      if (moveMode && !isHidden && tile.type !== "MOUNTAIN") moveArmy(x, y);
                      else setSelected(isHidden ? null : tile);
                    }}
                    className={[
                      "w-9 h-9 flex items-center justify-center text-sm relative transition-all",
                      isHidden ? "bg-stone-950" : isFog ? `${TILE_BG[tile.type]} opacity-40` : TILE_BG[tile.type],
                      isSelected ? "ring-2 ring-gold-bright z-10" : "",
                      moveMode && !isHidden ? "hover:ring-2 hover:ring-blue-400 cursor-crosshair" : "",
                      villageOwner ? FACTION_BORDER[villageOwner] ?? "" : "",
                    ].join(" ")}
                    title={isHidden ? "?" : `${tile.type} (${x},${y})`}
                  >
                    {!isHidden && (
                      <>
                        <span>{TILE_ICONS[tile.type]}</span>
                        {playerArmy && <span className="absolute top-0 right-0 text-[10px]">⚔</span>}
                        {rivalArmy && <span className="absolute bottom-0 right-0 text-[10px]">☠</span>}
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <aside className="w-80 parchment-dark p-4 overflow-y-auto space-y-3 border-l-2 border-bronze">
          {mapData.hero && (
            <div className="stat-box space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-gold-bright text-sm">⚔ HÉROE — Nv. {mapData.hero.level}</h2>
                <Link href={`/game/${id}/hero`} className="text-xs text-gold-pale hover:underline italic">Detalles →</Link>
              </div>
              <div className="w-full bg-stone-900 rounded-full h-1.5 border border-bronze">
                <div className="bg-blood-bright h-full rounded-full" style={{ width: `${(mapData.hero.hp / mapData.hero.maxHp) * 100}%` }} />
              </div>
              <p className="text-xs text-parchment-aged">{mapData.hero.hp}/{mapData.hero.maxHp} HP</p>
              {mapData.hero.isOnAdventure && <p className="text-xs text-gold-bright italic">⚔ En aventura…</p>}
              {!mapData.hero.isAlive && <p className="text-xs text-blood-bright italic">💀 Caído — reviviendo…</p>}
            </div>
          )}

          {selected && (
            <div className="stat-box space-y-2">
              <h2 className="font-display text-gold-bright text-sm">
                {selected.type.replace(/_/g, " ")} ({selected.x},{selected.y})
              </h2>
              {Object.entries(selected.bonus).length > 0 && (
                <p className="text-xs text-emerald-300 italic">
                  Bonus: {Object.entries(selected.bonus).map(([k, v]) => `+${v}% ${k}`).join(", ")}
                </p>
              )}
              {selected.village && (
                <div className="space-y-1 text-sm">
                  <p className="font-display text-parchment">{selected.village.name}</p>
                  <p className="text-xs text-parchment-aged italic">
                    {selected.village.owner === "PLAYER" ? "Tu dominio" : selected.village.owner === "AI_RIVAL" ? "Enemigo" : "Neutral"}
                  </p>
                  {selected.village.owner === "PLAYER" && (
                    <Link href={`/game/${id}/village/${selected.village.id}`} className="block mt-2 text-center btn-medieval text-xs py-1">
                      🏰 Gobernar
                    </Link>
                  )}
                </div>
              )}
              {selected.camp && (
                <p className="text-xs text-parchment-aged">⛺ Campamento Nv. {selected.camp.level}</p>
              )}

              {armiesOnSelectedTile.length > 0 && (
                <div className="mt-2 space-y-2 pt-2 border-t border-bronze">
                  <p className="text-xs text-gold-bright font-display uppercase tracking-wider">Ejércitos</p>
                  {armiesOnSelectedTile.map(a => (
                    <div key={a.id} className={`p-2 rounded text-xs border ${a.owner === "PLAYER" ? "bg-amber-950/40 border-amber-700" : "bg-red-950/40 border-red-800"}`}>
                      <p className={`font-display ${a.owner === "PLAYER" ? "text-amber-300" : "text-red-300"}`}>
                        {a.owner === "PLAYER" ? "⚔ Tu hueste" : "☠ Hueste enemiga"}
                      </p>
                      <p className="text-parchment-aged">Stamina: {a.stamina}% · {a.faction}</p>
                      <p className="text-parchment-dark italic">
                        {a.isMoving ? "🚶 En marcha" : a.isResting ? "💤 Descansando" : a.isForaging ? "🌾 Forrajeando" : "Acampada"}
                      </p>
                      {a.owner === "PLAYER" && !a.isMoving && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          <button onClick={() => { setSelectedArmyId(a.id); setMoveMode(true); }} className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-blue-100">
                            🎯 Mover
                          </button>
                          <button onClick={() => armyAction(a.id, "REST")} className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700 text-emerald-100">
                            💤 {a.isResting ? "Detener" : "Descansar"}
                          </button>
                          <button onClick={() => armyAction(a.id, "FORAGE")} className="px-2 py-0.5 rounded bg-yellow-900/60 hover:bg-yellow-800 border border-yellow-700 text-yellow-100">
                            🌾 {a.isForaging ? "Detener" : "Forrajear"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!selected && (
            <p className="text-parchment-aged text-sm italic text-center px-2 py-4">Haz clic en una casilla visible para conocer sus secretos.</p>
          )}

          <div className="pt-2 border-t border-bronze">
            <h2 className="text-gold-bright font-display text-xs uppercase tracking-wider mb-1">Leyenda</h2>
            <div className="grid grid-cols-2 gap-1 text-xs text-parchment-aged">
              {Object.entries(TILE_ICONS).filter(([, v]) => v).map(([type, icon]) => (
                <span key={type}>{icon} {type.replace("_", " ").toLowerCase()}</span>
              ))}
              <span>⚔ Tu ejército</span>
              <span>☠ Enemigo</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
