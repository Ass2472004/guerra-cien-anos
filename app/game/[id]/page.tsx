"use client";
import { useEffect, useState, useCallback, use, useRef } from "react";
import Link from "next/link";
import { NOBILITY, NOBILITY_ORDER, type NobilityTitle } from "@/lib/game/constants/nobility";
import { TROOPS } from "@/lib/game/constants/troops";

type TileVisibility = "HIDDEN" | "FOG" | "VISIBLE";
type TileType = "PLAIN" | "VILLAGE" | "OASIS_FOREST" | "OASIS_STONE" | "OASIS_IRON"
  | "OASIS_GRAIN" | "DEPOSIT_SILVER" | "DEPOSIT_GOLD" | "RUINS" | "RIVER" | "MOUNTAIN" | "CAMP";

interface ArmyTroop { type: string; count: number; faction: string; }
interface Tile {
  id: string; x: number; y: number;
  type: TileType; visibility: TileVisibility;
  bonus: Record<string, number>;
  village?: { id: string; name: string; owner: string; faction: string | null; loyalty: number } | null;
  camp?: { id: string; owner: string; level: true } | null;
}
interface ArmyOnMap {
  id: string; tileId: string; owner: string; faction: string;
  stamina: number; isMoving: boolean; isResting: boolean; isForaging: boolean;
  arrivesAt: string | null; carriedGrain: number;
  troops: ArmyTroop[];
}
interface PlayerResources {
  id: string; name: string;
  wood: number; stone: number; iron: number; grain: number;
  straw: number; adobe: number; silver: number; gold: number;
  woodRate: number; stoneRate: number; ironRate: number; grainRate: number;
  warehouseCap: number; granaryCap: number;
}
interface MapData {
  width: number; height: number; faction: string; tick: number;
  nobilityTitle: string; nobilityXp: number;
  tiles: Tile[]; armies: ArmyOnMap[];
  hero: { tileId: string | null; isOnAdventure: boolean; isAlive: boolean; hp: number; maxHp: number; level: number } | null;
  playerResources: PlayerResources | null;
}

const TILE_BG: Record<TileType, string> = {
  PLAIN:          "bg-[#3d4f2c]",
  VILLAGE:        "bg-[#7a4a1f]",
  OASIS_FOREST:   "bg-[#1d3a1a]",
  OASIS_STONE:    "bg-[#52524a]",
  OASIS_IRON:     "bg-[#4a3024]",
  OASIS_GRAIN:    "bg-[#8a6a1f]",
  DEPOSIT_SILVER: "bg-[#6a6a60]",
  DEPOSIT_GOLD:   "bg-[#a07820]",
  RUINS:          "bg-[#3a2818]",
  RIVER:          "bg-[#1e3a58]",
  MOUNTAIN:       "bg-[#4a3c30]",
  CAMP:           "bg-[#5d2828]",
};

const TILE_BORDER: Record<TileType, string> = {
  PLAIN: "", VILLAGE: "border border-[#5a3510]", OASIS_FOREST: "border border-[#2a5a25]",
  OASIS_STONE: "border border-[#7a7a70]", OASIS_IRON: "border border-[#6a4030]",
  OASIS_GRAIN: "border border-[#aa8a2f]", DEPOSIT_SILVER: "border border-[#9a9a90]",
  DEPOSIT_GOLD: "border border-[#c09030]", RUINS: "border border-[#5a4030]",
  RIVER: "border border-[#2e5a80]", MOUNTAIN: "border border-[#6a5a4a]", CAMP: "border border-[#8a3838]",
};

const TILE_ICONS: Record<TileType, string> = {
  PLAIN: "", VILLAGE: "🏰", OASIS_FOREST: "🌲", OASIS_STONE: "⛏",
  OASIS_IRON: "⚒", OASIS_GRAIN: "🌾", DEPOSIT_SILVER: "🪙",
  DEPOSIT_GOLD: "💰", RUINS: "🏚", RIVER: "🌊", MOUNTAIN: "⛰", CAMP: "⛺",
};

const TILE_LABEL: Record<TileType, string> = {
  PLAIN: "Llanura", VILLAGE: "Aldea", OASIS_FOREST: "Bosque",
  OASIS_STONE: "Cantera", OASIS_IRON: "Mina de hierro", OASIS_GRAIN: "Campo de grano",
  DEPOSIT_SILVER: "Depósito de plata", DEPOSIT_GOLD: "Depósito de oro",
  RUINS: "Ruinas", RIVER: "Río", MOUNTAIN: "Montaña", CAMP: "Campamento",
};

function timeLeftStr(endsAt: string | null) {
  if (!endsAt) return "";
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "¡Listo!";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

const ZOOM_SIZES = [32, 40, 52, 64] as const;
type ZoomIdx = 0 | 1 | 2 | 3;

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [selectedArmyId, setSelectedArmyId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [ticking, setTicking] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "info" | "warn" | "win" }[]>([]);
  const [zoomIdx, setZoomIdx] = useState<ZoomIdx>(1);
  const [clock, setClock] = useState(Date.now());
  const toastId = useRef(0);

  const tileSize = ZOOM_SIZES[zoomIdx];

  const showToast = useCallback((msg: string, type: "info" | "warn" | "win" = "info") => {
    const tid = ++toastId.current;
    setToasts(prev => [...prev, { id: tid, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), 4000);
  }, []);

  const loadMap = useCallback(async () => {
    const res = await fetch(`/api/game/${id}/map`);
    if (res.ok) setMapData(await res.json());
  }, [id]);

  // Initial load
  useEffect(() => { loadMap(); }, [loadMap]);

  // Auto-tick every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/game/${id}/tick`, { method: "POST" });
      const data = await res.json();
      if (data.battles > 0) showToast(`⚔ ${data.battles} batalla(s) resuelta(s)`, "warn");
      loadMap();
    }, 30000);
    return () => clearInterval(interval);
  }, [id, loadMap, showToast]);

  // Clock ticker for countdowns (every second)
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function manualTick() {
    setTicking(true);
    const res = await fetch(`/api/game/${id}/tick`, { method: "POST" });
    const data = await res.json();
    if (data.battles > 0) showToast(`⚔ ${data.battles} batalla(s) resuelta(s)`, "warn");
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
    if (!res.ok) showToast(data.error ?? "Error al mover", "warn");
    else {
      const m = Math.floor(data.eta / 60), s = data.eta % 60;
      showToast(`🚶 Marcha iniciada — llega en ${m}m ${s}s`);
    }
    setMoveMode(false); setSelectedArmyId(null);
    loadMap();
  }

  async function armyAction(armyId: string, action: "REST" | "FORAGE") {
    const res = await fetch(`/api/game/${id}/army`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: { armyId } }),
    });
    const d = await res.json();
    if (res.ok) { showToast(action === "REST" ? (d.isResting ? "💤 Descansando" : "Descanso cancelado") : (d.isForaging ? "🌾 Forrajeando" : "Forrajeo cancelado")); loadMap(); }
    else showToast(d.error ?? "Error", "warn");
  }

  async function mergeArmies(fromId: string, intoId: string) {
    const res = await fetch(`/api/game/${id}/army`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MERGE", payload: { armyFromId: fromId, armyIntoId: intoId } }),
    });
    if (res.ok) { showToast("⚔ Ejércitos unidos", "win"); loadMap(); }
    else { const d = await res.json(); showToast(d.error ?? "Error al unir", "warn"); }
  }

  if (!mapData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-5xl animate-pulse">⚜</div>
        <p className="title-gold font-display text-2xl">Cargando reino…</p>
      </div>
    );
  }

  const tileMap = new Map(mapData.tiles.map(t => [`${t.x},${t.y}`, t]));
  const armiesByTile = new Map<string, ArmyOnMap[]>();
  for (const a of mapData.armies) {
    const existing = armiesByTile.get(a.tileId) ?? [];
    existing.push(a);
    armiesByTile.set(a.tileId, existing);
  }
  const armiesOnSelectedTile = selected ? (armiesByTile.get(selected.id) ?? []) : [];
  const playerArmiesOnSelected = armiesOnSelectedTile.filter(a => a.owner === "PLAYER");
  const rivalArmiesOnSelected = armiesOnSelectedTile.filter(a => a.owner === "AI_RIVAL");

  const nd = NOBILITY[mapData.nobilityTitle as NobilityTitle];
  const nextNobilityIdx = nd ? NOBILITY_ORDER.indexOf(mapData.nobilityTitle as NobilityTitle) + 1 : -1;
  const nextNd = nextNobilityIdx >= 0 && nextNobilityIdx < NOBILITY_ORDER.length ? NOBILITY[NOBILITY_ORDER[nextNobilityIdx]] : null;

  const pr = mapData.playerResources;

  return (
    <div className="min-h-screen flex flex-col bg-stone-950">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="banner px-3 py-2 flex items-center justify-between gap-2 border-b-2 border-bronze flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚜</span>
          <h1 className="font-display title-gold text-base md:text-lg hidden sm:block">Guerra de los Cien Años</h1>
          {nd && (
            <span className="font-display text-gold-bright border border-gold/60 px-2 py-0.5 rounded-sm text-xs">
              {nd.icon} {nd.labelEs}
            </span>
          )}
          <span className="text-parchment-dark text-xs hidden md:inline">Año {mapData.tick}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Link href={`/game/${id}/hero`} className="btn-medieval text-xs py-1 px-2">⚔ Héroe</Link>
          <Link href={`/game/${id}/nobility`} className="btn-medieval text-xs py-1 px-2">👑 Nobleza</Link>
          <Link href={`/game/${id}/battles`} className="btn-blood text-xs py-1 px-2">📜 Crónicas</Link>
          <button onClick={manualTick} disabled={ticking}
            className="btn-medieval text-xs py-1 px-2 disabled:opacity-50">
            {ticking ? "⏳" : "⏩ Avanzar"}
          </button>
        </div>
      </header>

      {/* ── RESOURCE BAR ───────────────────────────────────────── */}
      {pr && (
        <div className="bg-[#1e100a] border-b-2 border-bronze/60 px-3 py-1.5 flex flex-wrap gap-3 items-center flex-shrink-0">
          {([
            { key: "wood",   icon: "🌲", val: pr.wood,   rate: pr.woodRate,  cap: pr.warehouseCap, color: "text-emerald-400" },
            { key: "stone",  icon: "⛏", val: pr.stone,  rate: pr.stoneRate, cap: pr.warehouseCap, color: "text-stone-300" },
            { key: "iron",   icon: "⚒", val: pr.iron,   rate: pr.ironRate,  cap: pr.warehouseCap, color: "text-orange-300" },
            { key: "grain",  icon: "🌾", val: pr.grain,  rate: pr.grainRate, cap: pr.granaryCap,   color: "text-yellow-300" },
            { key: "straw",  icon: "🪶", val: pr.straw,  rate: Math.floor(pr.grainRate * 0.4), cap: pr.granaryCap, color: "text-amber-300" },
            { key: "adobe",  icon: "🧱", val: pr.adobe,  rate: 0, cap: pr.warehouseCap, color: "text-red-300" },
            { key: "silver", icon: "🪙", val: pr.silver, rate: 0, cap: pr.warehouseCap, color: "text-sky-300" },
            { key: "gold",   icon: "💰", val: pr.gold,   rate: 0, cap: pr.warehouseCap, color: "text-gold-bright" },
          ] as const).map(r => (
            <div key={r.key} className="flex items-center gap-1 group relative">
              <span className="text-sm">{r.icon}</span>
              <div>
                <span className={`font-display font-bold text-sm ${r.color}`}>{r.val}</span>
                {r.rate > 0 && <span className="text-parchment-dark text-[10px] ml-0.5">+{r.rate}</span>}
              </div>
              {/* Mini progress bar */}
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-current rounded-full transition-all" style={{ width: `${Math.min(100, (r.val / r.cap) * 100)}%` }} />
              </div>
            </div>
          ))}
          <div className="ml-auto text-[10px] text-parchment-dark italic hidden lg:block">
            {pr.name}
            {" · "}
            <Link href={`/game/${id}/village/${pr.id}`} className="underline hover:text-gold-pale">Gobernar →</Link>
          </div>
        </div>
      )}

      {/* ── MOVE MODE BANNER ───────────────────────────────────── */}
      {moveMode && (
        <div className="bg-amber-900/90 border-b-2 border-gold text-parchment px-4 py-1.5 text-sm flex items-center justify-between flex-shrink-0">
          <span className="font-display">🎯 Selecciona el destino del ejército en el mapa</span>
          <button onClick={() => { setMoveMode(false); setSelectedArmyId(null); }} className="underline italic text-xs">Cancelar</button>
        </div>
      )}

      {/* ── MAIN LAYOUT ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* MAP */}
        <div className="flex-1 overflow-auto p-3 relative">
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
            <button onClick={() => setZoomIdx(Math.min(3, zoomIdx + 1) as ZoomIdx)}
              className="w-7 h-7 bg-[#2c1d10] border border-bronze text-gold-bright font-bold rounded-sm text-sm hover:bg-wood">+</button>
            <button onClick={() => setZoomIdx(Math.max(0, zoomIdx - 1) as ZoomIdx)}
              className="w-7 h-7 bg-[#2c1d10] border border-bronze text-gold-bright font-bold rounded-sm text-sm hover:bg-wood">−</button>
          </div>

          <div
            className="inline-grid gap-px bg-[#0f0a05] p-1 border-2 border-bronze rounded-sm shadow-[0_0_24px_rgba(0,0,0,0.8)]"
            style={{ gridTemplateColumns: `repeat(${mapData.width}, ${tileSize}px)` }}
          >
            {Array.from({ length: mapData.height }, (_, y) =>
              Array.from({ length: mapData.width }, (_, x) => {
                const tile = tileMap.get(`${x},${y}`);
                if (!tile) return <div key={`${x},${y}`} style={{ width: tileSize, height: tileSize }} className="bg-stone-950" />;

                const isHidden = tile.visibility === "HIDDEN";
                const isFog = tile.visibility === "FOG";
                const isSelected = selected?.id === tile.id;
                const armiesHere = armiesByTile.get(tile.id) ?? [];
                const playerArmies = armiesHere.filter(a => a.owner === "PLAYER");
                const rivalArmies  = armiesHere.filter(a => a.owner === "AI_RIVAL");
                const villageOwner = tile.village?.owner;

                const borderCls = villageOwner === "PLAYER"
                  ? "ring-2 ring-amber-400"
                  : villageOwner === "AI_RIVAL"
                  ? "ring-2 ring-red-600"
                  : villageOwner === "AI_NEUTRAL"
                  ? "ring-1 ring-stone-500/60"
                  : "";

                return (
                  <button
                    key={`${x},${y}`}
                    onClick={() => {
                      if (moveMode && !isHidden && tile.type !== "MOUNTAIN") moveArmy(x, y);
                      else setSelected(isHidden ? null : tile);
                    }}
                    style={{ width: tileSize, height: tileSize }}
                    className={[
                      "flex items-center justify-center relative transition-all overflow-hidden",
                      isHidden ? "bg-stone-950" : isFog ? `${TILE_BG[tile.type]} opacity-35` : `${TILE_BG[tile.type]} ${TILE_BORDER[tile.type]}`,
                      isSelected ? "ring-2 ring-gold-bright z-10 brightness-125" : "",
                      moveMode && !isHidden && tile.type !== "MOUNTAIN" ? "hover:ring-2 hover:ring-blue-400 cursor-crosshair hover:brightness-110" : "hover:brightness-110 cursor-pointer",
                      borderCls,
                    ].filter(Boolean).join(" ")}
                    title={isHidden ? "Territorio desconocido" : `${TILE_LABEL[tile.type]}${tile.village ? ` — ${tile.village.name}` : ""} (${x},${y})`}
                  >
                    {!isHidden && (
                      <>
                        {tileSize >= 40 && <span className="text-sm leading-none">{TILE_ICONS[tile.type]}</span>}
                        {tileSize < 40 && tile.type !== "PLAIN" && <span className="text-[10px] leading-none">{TILE_ICONS[tile.type]}</span>}

                        {/* Army indicators */}
                        {playerArmies.length > 0 && (
                          <span className="absolute top-0 right-0 bg-amber-600/90 text-[9px] font-bold px-0.5 leading-tight text-white">
                            {tileSize >= 52 ? `⚔${playerArmies.length > 1 ? playerArmies.length : ""}` : "⚔"}
                          </span>
                        )}
                        {rivalArmies.length > 0 && (
                          <span className="absolute bottom-0 right-0 bg-red-800/90 text-[9px] font-bold px-0.5 leading-tight text-white">
                            {tileSize >= 52 ? `☠${rivalArmies.length > 1 ? rivalArmies.length : ""}` : "☠"}
                          </span>
                        )}

                        {/* Village name at large zoom */}
                        {tileSize >= 64 && tile.village && (
                          <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/50 text-parchment leading-tight truncate px-0.5">
                            {tile.village.name}
                          </span>
                        )}
                      </>
                    )}
                    {isHidden && <span className="text-stone-700 text-xs">▓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── SIDEBAR ──────────────────────────────────────────── */}
        <aside className="w-72 xl:w-80 parchment-dark flex flex-col overflow-y-auto border-l-2 border-bronze flex-shrink-0">

          {/* Hero mini-panel */}
          {mapData.hero && (
            <div className="px-3 py-2 border-b border-bronze/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-display text-gold-bright text-xs">⚔ HÉROE Nv.{mapData.hero.level}</span>
                <Link href={`/game/${id}/hero`} className="text-[10px] text-parchment-aged hover:underline">Gestionar →</Link>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-stone-900 rounded-full h-1.5 border border-bronze/40 overflow-hidden">
                  <div className="bg-blood-bright h-full rounded-full transition-all"
                    style={{ width: `${(mapData.hero.hp / mapData.hero.maxHp) * 100}%` }} />
                </div>
                <span className="text-[10px] text-parchment-aged whitespace-nowrap">{mapData.hero.hp}/{mapData.hero.maxHp} HP</span>
              </div>
              {mapData.hero.isOnAdventure && <p className="text-[10px] text-gold-bright italic">🗺 En aventura…</p>}
              {!mapData.hero.isAlive && <p className="text-[10px] text-blood-bright italic">💀 Caído — reviviendo…</p>}
            </div>
          )}

          {/* Nobility mini-panel */}
          {nd && (
            <div className="px-3 py-2 border-b border-bronze/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-display text-gold-bright text-xs">{nd.icon} {nd.labelEs}</span>
                <Link href={`/game/${id}/nobility`} className="text-[10px] text-parchment-aged hover:underline">Ver escala →</Link>
              </div>
              <div className="flex gap-2 text-[10px] text-parchment-aged">
                <span>⭐ {mapData.nobilityXp} prestigio</span>
                {nextNd && <span className="text-parchment-dark">→ {nextNd.labelEs}: {nextNd.minPrestige - mapData.nobilityXp} más</span>}
              </div>
            </div>
          )}

          {/* Selected tile panel */}
          {selected ? (
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {/* Tile info */}
              <div className="space-y-1">
                <h2 className="font-display text-gold-bright text-sm flex items-center gap-1">
                  <span>{TILE_ICONS[selected.type]}</span>
                  <span>{TILE_LABEL[selected.type]}</span>
                  <span className="text-parchment-dark text-xs">({selected.x},{selected.y})</span>
                </h2>
                {Object.entries(selected.bonus).length > 0 && (
                  <p className="text-xs text-emerald-300 italic">
                    Bonus: {Object.entries(selected.bonus).map(([k, v]) => `+${v}% ${k}`).join(", ")}
                  </p>
                )}
              </div>

              {/* Village info */}
              {selected.village && (
                <div className={`p-3 rounded border-2 space-y-1.5 ${
                  selected.village.owner === "PLAYER" ? "border-amber-600 bg-amber-950/30" :
                  selected.village.owner === "AI_RIVAL" ? "border-red-700 bg-red-950/30" :
                  "border-stone-600 bg-stone-900/30"
                }`}>
                  <p className="font-display text-parchment text-sm">{selected.village.name}</p>
                  <p className={`text-xs font-bold ${
                    selected.village.owner === "PLAYER" ? "text-amber-300" :
                    selected.village.owner === "AI_RIVAL" ? "text-red-300" :
                    "text-stone-400"
                  }`}>
                    {selected.village.owner === "PLAYER" ? "🏆 Tu dominio"
                      : selected.village.owner === "AI_RIVAL" ? "⚔ Territorio enemigo"
                      : "○ Aldea neutral"}
                  </p>
                  <p className="text-xs text-parchment-aged">Lealtad: {selected.village.loyalty}%</p>
                  {selected.village.owner === "PLAYER" && (
                    <Link href={`/game/${id}/village/${selected.village.id}`}
                      className="block text-center btn-medieval text-xs py-1 mt-1">
                      🏰 Gobernar aldea
                    </Link>
                  )}
                </div>
              )}

              {/* Armies on tile */}
              {armiesOnSelectedTile.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gold-bright font-display uppercase tracking-wider border-t border-bronze/40 pt-2">
                    Ejércitos en esta casilla
                  </p>

                  {armiesOnSelectedTile.map(a => {
                    const totalTroops = a.troops.reduce((s, t) => s + t.count, 0);
                    const isMovingNow = a.isMoving && a.arrivesAt;
                    return (
                      <div key={a.id} className={`p-2.5 rounded border ${
                        a.owner === "PLAYER"
                          ? "bg-amber-950/40 border-amber-700/60"
                          : "bg-red-950/40 border-red-800/60"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-display text-xs ${a.owner === "PLAYER" ? "text-amber-300" : "text-red-300"}`}>
                            {a.owner === "PLAYER" ? "⚔ Tu hueste" : "☠ Enemigo"}
                            {totalTroops > 0 && <span className="text-parchment-dark ml-1">({totalTroops} unidades)</span>}
                          </p>
                          <span className="text-[10px] text-parchment-aged">{a.faction}</span>
                        </div>

                        {/* Stamina bar */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="flex-1 bg-stone-900 rounded-full h-1 overflow-hidden">
                            <div className={`h-full rounded-full ${a.stamina > 60 ? "bg-emerald-500" : a.stamina > 30 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${a.stamina}%` }} />
                          </div>
                          <span className="text-[10px] text-parchment-dark whitespace-nowrap">{a.stamina}% stamina</span>
                        </div>

                        {/* Status */}
                        <p className="text-[10px] text-parchment-aged italic mb-1">
                          {isMovingNow ? `🚶 Marchando — llega en ${timeLeftStr(a.arrivesAt)}`
                            : a.isResting ? "💤 Descansando"
                            : a.isForaging ? "🌾 Forrajeando"
                            : "⛺ Acampada"}
                        </p>

                        {/* Troop breakdown */}
                        {a.troops.length > 0 && (
                          <div className="space-y-0.5 mb-2">
                            {a.troops.map(t => (
                              <div key={t.type} className="flex justify-between text-[10px]">
                                <span className="text-parchment-aged">{TROOPS[t.type]?.name ?? t.type}</span>
                                <span className="text-parchment font-bold">{t.count}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Player army actions */}
                        {a.owner === "PLAYER" && !a.isMoving && (
                          <div className="flex gap-1 flex-wrap">
                            <button onClick={() => { setSelectedArmyId(a.id); setMoveMode(true); }}
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 border border-blue-700/60 text-blue-200">
                              🎯 Mover
                            </button>
                            <button onClick={() => armyAction(a.id, "REST")}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-200">
                              {a.isResting ? "▶ Reanudar" : "💤 Descansar"}
                            </button>
                            <button onClick={() => armyAction(a.id, "FORAGE")}
                              className="text-[10px] px-2 py-0.5 rounded bg-yellow-900/60 hover:bg-yellow-800 border border-yellow-700/60 text-yellow-200">
                              {a.isForaging ? "✕ Detener" : "🌾 Forrajear"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Merge button: 2+ player armies on same tile */}
                  {playerArmiesOnSelected.length >= 2 && (
                    <button
                      onClick={() => mergeArmies(playerArmiesOnSelected[1].id, playerArmiesOnSelected[0].id)}
                      className="w-full btn-medieval text-xs py-1">
                      ⚔ Unir huestes
                    </button>
                  )}
                </div>
              )}

              {armiesOnSelectedTile.length === 0 && (
                <p className="text-xs text-parchment-dark italic text-center py-2">Sin ejércitos en esta casilla.</p>
              )}
            </div>
          ) : (
            <div className="flex-1 p-3">
              <p className="text-parchment-aged text-sm italic text-center py-6">
                Haz clic en una casilla<br />para explorar sus secretos.
              </p>

              {/* Moving armies countdown */}
              {mapData.armies.filter(a => a.owner === "PLAYER" && a.isMoving).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gold-bright font-display uppercase tracking-wider border-t border-bronze/40 pt-2">
                    Huestes en marcha
                  </p>
                  {mapData.armies.filter(a => a.owner === "PLAYER" && a.isMoving).map(a => (
                    <div key={a.id} className="text-xs bg-blue-950/30 border border-blue-800/40 rounded p-2">
                      <p className="text-blue-200">🚶 {a.troops.reduce((s, t) => s + t.count, 0)} unidades</p>
                      <p className="text-blue-300 font-bold">{timeLeftStr(a.arrivesAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="px-3 py-2 border-t border-bronze/50 flex-shrink-0">
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-parchment-dark">
              {Object.entries(TILE_ICONS).filter(([, v]) => v).map(([type, icon]) => (
                <span key={type}>{icon} {TILE_LABEL[type as TileType]}</span>
              ))}
              <span className="text-amber-300">⚔ Tu ejército</span>
              <span className="text-red-400">☠ Enemigo</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── TOAST STACK ────────────────────────────────────────── */}
      <div className="fixed top-16 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 font-display text-sm rounded-sm border shadow-lg animate-fade-in ${
            t.type === "win" ? "parchment border-gold text-ink" :
            t.type === "warn" ? "bg-blood-dark border-blood text-parchment" :
            "parchment border-bronze text-ink"
          }`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
