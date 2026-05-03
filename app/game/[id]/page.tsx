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
interface RecentEvent {
  id: string; type: string; title: string; description: string;
  isRead: boolean; createdAt: string; affectedId: string | null;
}
interface MapData {
  width: number; height: number; faction: string; tick: number;
  status: string; statusReason: string | null;
  nobilityTitle: string; nobilityXp: number;
  tiles: Tile[]; armies: ArmyOnMap[];
  hero: { tileId: string | null; isOnAdventure: boolean; isAlive: boolean; hp: number; maxHp: number; level: number } | null;
  playerResources: PlayerResources | null;
  stats: { playerVillages: number; rivalVillages: number; totalBattles: number; totalTroops: number };
  recentEvents: RecentEvent[];
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
const EVENT_ICONS: Record<string, string> = {
  GOOD_HARVEST: "🌾", DROUGHT: "☀", PLAGUE: "☠", TOURNAMENT: "⚔", DISCOVERY: "💎",
  BANDITS: "🗡", FIRE: "🔥", REINFORCEMENTS: "🛡", REBELLION: "⚡", HOLY_RELIC: "✝",
  MERCENARY: "⚔", FLOOD: "🌊", TREACHERY: "🕵", SIEGE_WEAPON_FOUND: "⚙", VICTORY: "👑",
  NAHKOR_DIAS: "🌑", CATALIZADOR: "⚗", GUIVERNO_AVISTADO: "🐉",
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

const ZOOM_SIZES = [28, 36, 48, 60] as const;
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
  const [spyLoading, setSpyLoading] = useState(false);
  const [tributeLoading, setTributeLoading] = useState(false);
  const toastId = useRef(0);

  const tileSize = ZOOM_SIZES[zoomIdx];

  const showToast = useCallback((msg: string, type: "info" | "warn" | "win" = "info") => {
    const tid = ++toastId.current;
    setToasts(prev => [...prev, { id: tid, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), 4500);
  }, []);

  const loadMap = useCallback(async () => {
    const res = await fetch(`/api/game/${id}/map`);
    if (res.ok) setMapData(await res.json());
  }, [id]);

  useEffect(() => { loadMap(); }, [loadMap]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/game/${id}/tick`, { method: "POST" });
      const data = await res.json();
      if (data.battles > 0) showToast(`⚔ ${data.battles} batalla(s) resuelta(s)`, "warn");
      if (data.event) showToast(`${EVENT_ICONS[data.event.type] ?? "📜"} ${data.event.title}`, "info");
      if (data.verdict === "WON") showToast("👑 ¡Victoria!", "win");
      if (data.verdict === "LOST") showToast("💀 Derrota…", "warn");
      loadMap();
    }, 30000);
    return () => clearInterval(interval);
  }, [id, loadMap, showToast]);

  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  void clock;

  async function manualTick() {
    setTicking(true);
    const res = await fetch(`/api/game/${id}/tick`, { method: "POST" });
    const data = await res.json();
    if (data.battles > 0) showToast(`⚔ ${data.battles} batalla(s) resuelta(s)`, "warn");
    if (data.event) showToast(`${EVENT_ICONS[data.event.type] ?? "📜"} ${data.event.title}`);
    if (data.verdict === "WON") showToast("👑 ¡Victoria!", "win");
    if (data.verdict === "LOST") showToast("💀 Derrota…", "warn");
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

  async function tributeMission(armyId: string, targetVillageId: string) {
    setTributeLoading(true);
    const res = await fetch(`/api/game/${id}/army`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "TRIBUTE", payload: { armyId, targetVillageId } }),
    });
    const d = await res.json();
    setTributeLoading(false);
    if (!res.ok) { showToast(d.error ?? "Error al negociar", "warn"); return; }
    showToast(`💰 ${d.villageName} se une al reino (−${d.silverCost} 🪙)`, "win");
    setSelected(null); loadMap();
  }

  async function spyMission(armyId: string, targetVillageId: string) {
    setSpyLoading(true);
    const res = await fetch(`/api/game/${id}/army`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "INFILTRATE", payload: { armyId, targetVillageId } }),
    });
    const d = await res.json();
    setSpyLoading(false);
    if (!res.ok) { showToast(d.error ?? "Misión fracasada", "warn"); return; }
    showToast(d.success ? "🕵 Misión exitosa — inteligencia obtenida" : "🕵 Agente capturado — misión fracasada", d.success ? "win" : "warn");
    loadMap();
  }

  if (!mapData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-5xl animate-pulse">🌑</div>
        <p className="title-gold font-display text-2xl">Cargando el mundo Nahkor…</p>
      </div>
    );
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const isGameOver = mapData.status === "WON" || mapData.status === "LOST";
  const tileMap = new Map(mapData.tiles.map(t => [`${t.x},${t.y}`, t]));
  const armiesByTile = new Map<string, ArmyOnMap[]>();
  for (const a of mapData.armies) {
    const existing = armiesByTile.get(a.tileId) ?? [];
    existing.push(a);
    armiesByTile.set(a.tileId, existing);
  }
  const armiesOnSelectedTile = selected ? (armiesByTile.get(selected.id) ?? []) : [];
  const playerArmiesOnSelected = armiesOnSelectedTile.filter(a => a.owner === "PLAYER");
  const rivalArmiesOnSelected  = armiesOnSelectedTile.filter(a => a.owner === "AI_RIVAL");
  void rivalArmiesOnSelected;

  const nd = NOBILITY[mapData.nobilityTitle as NobilityTitle];
  const nextNobilityIdx = nd ? NOBILITY_ORDER.indexOf(mapData.nobilityTitle as NobilityTitle) + 1 : -1;
  const nextNd = nextNobilityIdx >= 0 && nextNobilityIdx < NOBILITY_ORDER.length ? NOBILITY[NOBILITY_ORDER[nextNobilityIdx]] : null;

  const pr = mapData.playerResources;
  const stats = mapData.stats ?? { playerVillages: 0, rivalVillages: 0, totalBattles: 0, totalTroops: 0 };
  const unreadEvents = (mapData.recentEvents ?? []).filter(e => !e.isRead).length;
  const factionIcon = mapData.faction === "PORTADORES" ? "🌑" : mapData.faction === "IMPERIO" ? "👑" : "⚓";

  const spyEligibleArmy = selected?.village?.owner === "AI_RIVAL"
    ? playerArmiesOnSelected.find(a => a.troops.some(t => ["ESPÍA_OSCURO","ESPÍA_IMPERIAL","ESPÍA_COMERCIO","INFILTRADOR_SOMBRA"].includes(t.type)))
    : null;
  const tributeEligibleArmy = selected?.village?.owner === "AI_NEUTRAL"
    ? (playerArmiesOnSelected.length > 0 ? playerArmiesOnSelected[0] : null)
    : null;
  const tributeCost = selected?.village ? Math.round(selected.village.loyalty * 2.5) : 0;

  const movingArmies = mapData.armies.filter(a => a.owner === "PLAYER" && a.isMoving);

  // ── Resources config ─────────────────────────────────────────────────────────
  const resources = pr ? [
    { icon: "🌲", val: pr.wood,   rate: pr.woodRate,                  cap: pr.warehouseCap, color: "#4ade80",  label: "Madera"  },
    { icon: "⛏",  val: pr.stone,  rate: pr.stoneRate,                 cap: pr.warehouseCap, color: "#94a3b8",  label: "Piedra"  },
    { icon: "⚒",  val: pr.iron,   rate: pr.ironRate,                  cap: pr.warehouseCap, color: "#fb923c",  label: "Hierro"  },
    { icon: "🌾", val: pr.grain,  rate: pr.grainRate,                 cap: pr.granaryCap,   color: "#facc15",  label: "Grano"   },
    { icon: "🪶", val: pr.straw,  rate: Math.floor(pr.grainRate*0.4), cap: pr.granaryCap,   color: "#fbbf24",  label: "Paja"    },
    { icon: "🧱", val: pr.adobe,  rate: 0,                            cap: pr.warehouseCap, color: "#f87171",  label: "Adobe"   },
  ] : [];

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: "#0f0904" }}>

      {/* ── GAME OVER OVERLAY ───────────────────────────────────────────── */}
      {isGameOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="parchment max-w-md w-full mx-4 p-8 text-center space-y-5 border-4 border-gold/60 shadow-2xl">
            <div className="text-7xl">{mapData.status === "WON" ? "👑" : "💀"}</div>
            <h1 className="font-display title-gold text-3xl">
              {mapData.status === "WON" ? "¡Victoria!" : "Derrota"}
            </h1>
            <p className="text-ink-soft italic text-sm leading-relaxed">
              {mapData.statusReason ?? (mapData.status === "WON"
                ? "Has dominado el mundo Nahkor y forjado tu legado en las crónicas oscuras."
                : "Tu facción ha caído. Las crónicas recordarán tu valentía.")}
            </p>
            <div className="grid grid-cols-3 gap-3 text-center py-2">
              {[
                { v: stats.playerVillages, l: "aldeas" },
                { v: stats.totalBattles,   l: "batallas" },
                { v: mapData.tick,         l: "años" },
              ].map(s => (
                <div key={s.l} className="parchment-dark rounded p-2">
                  <p className="font-display text-gold-bright text-xl">{s.v}</p>
                  <p className="text-ink-soft text-xs">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard" className="btn-medieval px-6 py-2 text-sm">🏠 Inicio</Link>
              <Link href={`/game/${id}/events`} className="btn-blood px-6 py-2 text-sm">📜 Crónica</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP NAVIGATION BAR ──────────────────────────────────────────── */}
      <header
        className="flex items-stretch border-b-2 border-bronze flex-shrink-0"
        style={{ height: 52, background: "linear-gradient(180deg, #3d2510 0%, #1f140a 100%)" }}
      >
        {/* Faction portrait */}
        <div className="w-14 flex items-center justify-center border-r border-bronze/50 flex-shrink-0 relative bg-[#150d05]">
          <div className="w-10 h-10 rounded-full border-2 border-gold/50 bg-stone-900 flex items-center justify-center text-xl leading-none">
            {factionIcon}
          </div>
          {mapData.hero && (
            <span className="absolute bottom-1 right-0.5 bg-gold text-ink text-[8px] font-display font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {mapData.hero.level}
            </span>
          )}
        </div>

        {/* Icon nav buttons */}
        <nav className="flex items-stretch flex-1 overflow-x-auto">
          {pr && (
            <Link href={`/game/${id}/village/${pr.id}`} className="nav-icon-btn">
              <span className="text-base leading-none">🏠</span>
              <span>Aldea</span>
            </Link>
          )}
          <div className="nav-icon-btn active">
            <span className="text-base leading-none">🗺</span>
            <span>Mapa</span>
          </div>
          <Link href={`/game/${id}/hero`} className="nav-icon-btn">
            <span className="text-base leading-none">⚔</span>
            <span>Héroe</span>
          </Link>
          <Link href={`/game/${id}/nobility`} className="nav-icon-btn">
            <span className="text-base leading-none">👑</span>
            <span>Nobleza</span>
          </Link>
          <Link href={`/game/${id}/battles`} className="nav-icon-btn">
            <span className="text-base leading-none">🗡</span>
            <span>Batallas</span>
          </Link>
          <Link href={`/game/${id}/events`} className="nav-icon-btn relative">
            <span className="text-base leading-none">📜</span>
            <span>Sucesos</span>
            {unreadEvents > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {unreadEvents}
              </span>
            )}
          </Link>
        </nav>

        {/* Right: currencies + advance button */}
        <div className="flex items-center gap-4 px-4 border-l border-bronze/50 flex-shrink-0">
          {pr && (
            <>
              <div className="text-center leading-none">
                <p className="font-display text-gold-bright text-sm font-bold">{pr.silver}</p>
                <p className="text-[9px] text-parchment-dark mt-0.5">🪙 Plata</p>
              </div>
              <div className="text-center leading-none">
                <p className="font-display text-amber-400 text-sm font-bold">{pr.gold}</p>
                <p className="text-[9px] text-parchment-dark mt-0.5">💰 Oro</p>
              </div>
            </>
          )}
          <div className="text-center leading-none">
            <p className="text-parchment-dark text-[9px]">AÑO</p>
            <p className="font-display text-gold-bright text-sm font-bold">{mapData.tick}</p>
          </div>
          <button
            onClick={manualTick} disabled={ticking}
            className="btn-medieval text-xs px-3 py-1.5 disabled:opacity-50 whitespace-nowrap"
          >
            {ticking ? "⏳" : "⏩ Avanzar"}
          </button>
        </div>
      </header>

      {/* ── RESOURCE BAR ────────────────────────────────────────────────── */}
      {pr && (
        <div
          className="flex items-center gap-1 px-2 py-1.5 flex-shrink-0 flex-wrap border-b border-bronze/40"
          style={{ background: "#150e06" }}
        >
          {resources.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-1.5 rounded px-2 py-1 flex-1 min-w-[80px] border border-bronze/25"
              style={{ background: "#251508" }}
            >
              <span className="text-sm leading-none flex-shrink-0">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-display font-bold text-xs leading-none" style={{ color: r.color }}>
                    {r.val}
                  </span>
                  {r.rate > 0 && (
                    <span className="text-[9px] text-stone-600 leading-none whitespace-nowrap">+{r.rate}/h</span>
                  )}
                </div>
                <div className="h-1 bg-stone-900 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (r.val / r.cap) * 100)}%`, background: r.color, opacity: 0.6 }}
                  />
                </div>
              </div>
            </div>
          ))}
          {pr && (
            <Link
              href={`/game/${id}/village/${pr.id}`}
              className="ml-auto text-[10px] text-gold-bright hover:underline italic whitespace-nowrap hidden xl:block px-2"
            >
              {pr.name} →
            </Link>
          )}
        </div>
      )}

      {/* ── VICTORY PROGRESS BAR ────────────────────────────────────────── */}
      {mapData.status === "PLAYING" && (
        <div
          className="flex items-center gap-3 px-3 py-1 flex-shrink-0 border-b border-bronze/30"
          style={{ background: "#0f0904" }}
        >
          <span className="text-[9px] text-parchment-dark font-display uppercase tracking-wider whitespace-nowrap">
            Conquista
          </span>
          <div className="flex-1 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-bronze/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-900 to-amber-500 transition-all"
              style={{ width: `${Math.min(100, (stats.playerVillages / 15) * 100)}%` }}
            />
          </div>
          <span className="text-[9px] text-amber-400 font-display whitespace-nowrap">
            {stats.playerVillages}/15 aldeas
          </span>
        </div>
      )}

      {/* ── MOVE MODE BANNER ────────────────────────────────────────────── */}
      {moveMode && (
        <div className="bg-amber-900/90 border-b-2 border-gold text-parchment px-4 py-1.5 text-sm flex items-center justify-between flex-shrink-0">
          <span className="font-display">🎯 Selecciona el destino del ejército en el mapa</span>
          <button onClick={() => { setMoveMode(false); setSelectedArmyId(null); }} className="underline italic text-xs">
            Cancelar
          </button>
        </div>
      )}

      {/* ── MAIN 3-COLUMN LAYOUT ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
        <aside
          className="w-52 xl:w-56 flex-shrink-0 border-r border-bronze/35 flex flex-col overflow-y-auto gap-2 p-2"
          style={{ background: "#110a04" }}
        >

          {/* Info Box — recent events */}
          <div className="trav-panel">
            <div className="trav-panel-header">
              <span>Info Box</span>
              {unreadEvents > 0 && (
                <span className="text-red-400 text-[10px]">{unreadEvents}× ✉</span>
              )}
            </div>
            <div className="p-2 space-y-1.5">
              {(mapData.recentEvents ?? []).length === 0 ? (
                <p className="text-[10px] text-stone-600 italic text-center py-2">Sin sucesos recientes</p>
              ) : (
                (mapData.recentEvents ?? []).slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className={`text-[10px] p-1.5 rounded border ${
                      !ev.isRead
                        ? "border-amber-800/40 bg-amber-950/20"
                        : "border-stone-800/30 opacity-50"
                    }`}
                  >
                    <p className="text-parchment-aged font-semibold truncate">
                      {EVENT_ICONS[ev.type] ?? "📜"} {ev.title}
                    </p>
                    <p className="text-stone-500 leading-tight line-clamp-2 mt-0.5">{ev.description}</p>
                  </div>
                ))
              )}
              <Link
                href={`/game/${id}/events`}
                className="block text-center text-[9px] text-gold-bright hover:underline italic"
              >
                Ver crónica completa →
              </Link>
            </div>
          </div>

          {/* Armies in march */}
          {movingArmies.length > 0 && (
            <div className="trav-panel">
              <div className="trav-panel-header">En Marcha</div>
              <div className="p-2 space-y-1.5">
                {movingArmies.map(a => (
                  <div key={a.id} className="text-[10px] bg-blue-950/25 border border-blue-800/35 rounded p-1.5">
                    <p className="text-blue-300">🚶 {a.troops.reduce((s, t) => s + t.count, 0)} tropas</p>
                    <p className="text-blue-400 font-bold">{timeLeftStr(a.arrivesAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="trav-panel mt-auto">
            <div className="trav-panel-header">Leyenda</div>
            <div className="p-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-parchment-dark">
              {Object.entries(TILE_ICONS).filter(([, v]) => v).map(([type, icon]) => (
                <span key={type}>{icon} {TILE_LABEL[type as TileType]}</span>
              ))}
              <span className="text-amber-400">⚔ Tu ejército</span>
              <span className="text-red-400">☠ Enemigo</span>
            </div>
          </div>

        </aside>

        {/* ── MAP ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-3 relative">

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
            <button
              onClick={() => setZoomIdx(Math.min(3, zoomIdx + 1) as ZoomIdx)}
              className="w-7 h-7 bg-[#2c1d10] border border-bronze text-gold-bright font-bold rounded-sm text-sm hover:bg-wood"
            >+</button>
            <button
              onClick={() => setZoomIdx(Math.max(0, zoomIdx - 1) as ZoomIdx)}
              className="w-7 h-7 bg-[#2c1d10] border border-bronze text-gold-bright font-bold rounded-sm text-sm hover:bg-wood"
            >−</button>
          </div>

          <div
            className="inline-grid gap-px bg-[#0a0603] p-1 border-2 border-bronze rounded-sm shadow-[0_0_24px_rgba(0,0,0,0.9)]"
            style={{ gridTemplateColumns: `repeat(${mapData.width}, ${tileSize}px)` }}
          >
            {Array.from({ length: mapData.height }, (_, y) =>
              Array.from({ length: mapData.width }, (_, x) => {
                const tile = tileMap.get(`${x},${y}`);
                if (!tile) return <div key={`${x},${y}`} style={{ width: tileSize, height: tileSize }} className="bg-stone-950" />;

                const isHidden = tile.visibility === "HIDDEN";
                const isFog    = tile.visibility === "FOG";
                const isSelected = selected?.id === tile.id;
                const armiesHere   = armiesByTile.get(tile.id) ?? [];
                const playerArmies = armiesHere.filter(a => a.owner === "PLAYER");
                const rivalArmies  = armiesHere.filter(a => a.owner === "AI_RIVAL");
                const villageOwner = tile.village?.owner;

                const borderCls =
                  villageOwner === "PLAYER"    ? "ring-2 ring-amber-400" :
                  villageOwner === "AI_RIVAL"  ? "ring-2 ring-red-600"   :
                  villageOwner === "AI_NEUTRAL"? "ring-1 ring-stone-500/60" : "";

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
                      isHidden ? "bg-stone-950" : isFog
                        ? `${TILE_BG[tile.type]} opacity-35`
                        : `${TILE_BG[tile.type]} ${TILE_BORDER[tile.type]}`,
                      isSelected ? "ring-2 ring-gold-bright z-10 brightness-125" : "",
                      moveMode && !isHidden && tile.type !== "MOUNTAIN"
                        ? "hover:ring-2 hover:ring-blue-400 cursor-crosshair hover:brightness-110"
                        : "hover:brightness-110 cursor-pointer",
                      borderCls,
                    ].filter(Boolean).join(" ")}
                    title={isHidden ? "Territorio desconocido" : `${TILE_LABEL[tile.type]}${tile.village ? ` — ${tile.village.name}` : ""} (${x},${y})`}
                  >
                    {!isHidden && (
                      <>
                        {tileSize >= 36 && <span className="text-sm leading-none">{TILE_ICONS[tile.type]}</span>}
                        {tileSize < 36 && tile.type !== "PLAIN" && <span className="text-[10px] leading-none">{TILE_ICONS[tile.type]}</span>}
                        {playerArmies.length > 0 && (
                          <span className="absolute top-0 right-0 bg-amber-600/90 text-[8px] font-bold px-0.5 leading-tight text-white">
                            {tileSize >= 48 ? `⚔${playerArmies.length > 1 ? playerArmies.length : ""}` : "⚔"}
                          </span>
                        )}
                        {rivalArmies.length > 0 && (
                          <span className="absolute bottom-0 right-0 bg-red-800/90 text-[8px] font-bold px-0.5 leading-tight text-white">
                            {tileSize >= 48 ? `☠${rivalArmies.length > 1 ? rivalArmies.length : ""}` : "☠"}
                          </span>
                        )}
                        {tileSize >= 60 && tile.village && (
                          <span className="absolute bottom-0 left-0 right-0 text-[7px] text-center bg-black/50 text-parchment leading-tight truncate px-0.5">
                            {tile.village.name}
                          </span>
                        )}
                      </>
                    )}
                    {isHidden && <span className="text-stone-800 text-xs">▓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ───────────────────────────────────────────── */}
        <aside
          className="w-68 xl:w-72 flex-shrink-0 border-l border-bronze/35 flex flex-col overflow-y-auto gap-2 p-2"
          style={{ background: "#110a04" }}
        >

          {/* Commander panel */}
          <div className="trav-panel">
            <div className="trav-panel-header">Comandante</div>
            <div className="p-3 space-y-2">
              {nd && (
                <div className="flex items-center gap-2">
                  <span className="text-base">{nd.icon}</span>
                  <div>
                    <p className="font-display text-gold-bright text-xs">{nd.labelEs}</p>
                    <p className="text-[9px] text-stone-500">⭐ {mapData.nobilityXp} prestigio</p>
                  </div>
                </div>
              )}
              {nextNd && (
                <p className="text-[9px] text-stone-600 italic">
                  → {nextNd.labelEs} en {nextNd.minPrestige - mapData.nobilityXp} prestigio más
                </p>
              )}
              {pr && (
                <div className="border-t border-bronze/30 pt-2 space-y-0.5">
                  <p className="font-display text-parchment text-xs">{pr.name}</p>
                  <Link
                    href={`/game/${id}/village/${pr.id}`}
                    className="text-gold-bright text-[10px] hover:underline flex items-center gap-1"
                  >
                    🏰 Gobernar aldea →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Villages panel */}
          <div className="trav-panel">
            <div className="trav-panel-header">
              <span>Aldeas {stats.playerVillages}/15</span>
              <span className="text-stone-600 text-[9px]">{stats.rivalVillages} rivales</span>
            </div>
            <div className="p-2 space-y-2">
              {/* Conquest progress */}
              <div>
                <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-bronze/20">
                  <div
                    className="h-full bg-gradient-to-r from-amber-900 to-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats.playerVillages / 15) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-stone-600 mt-0.5 text-right">{stats.playerVillages} / 15 para la victoria</p>
              </div>
              {pr && (
                <div className="flex items-center justify-between text-[10px] py-1 px-2 bg-amber-950/20 border border-amber-800/30 rounded">
                  <span className="text-parchment-aged">{pr.name}</span>
                  <Link href={`/game/${id}/village/${pr.id}`} className="text-gold-bright hover:underline">→</Link>
                </div>
              )}
              {/* Mini stats row */}
              <div className="grid grid-cols-3 gap-1 text-center">
                {[
                  { v: stats.playerVillages, l: "Aldeas",   c: "text-amber-400" },
                  { v: stats.totalTroops,    l: "Tropas",   c: "text-blue-300"  },
                  { v: stats.totalBattles,   l: "Batallas", c: "text-stone-400" },
                ].map(s => (
                  <div key={s.l} className="bg-stone-900/50 rounded p-1.5">
                    <p className={`font-display text-sm font-bold ${s.c}`}>{s.v}</p>
                    <p className="text-[9px] text-stone-600">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hero panel */}
          {mapData.hero && (
            <div className="trav-panel">
              <div className="trav-panel-header">
                <span>Héroe Nv.{mapData.hero.level}</span>
                <Link href={`/game/${id}/hero`} className="text-[9px] text-gold-bright hover:underline">
                  Gestionar →
                </Link>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded border-2 border-gold/40 bg-stone-900 flex items-center justify-center text-xl flex-shrink-0">
                    {mapData.faction === "PORTADORES" ? "🗡" : mapData.faction === "IMPERIO" ? "🐉" : "⚓"}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-stone-900 rounded-full h-2 border border-red-900/40 overflow-hidden">
                        <div
                          className="bg-blood-bright h-full rounded-full transition-all"
                          style={{ width: `${(mapData.hero.hp / mapData.hero.maxHp) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-parchment-dark whitespace-nowrap">
                        {mapData.hero.hp}/{mapData.hero.maxHp}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500">HP</p>
                  </div>
                </div>
                {mapData.hero.isOnAdventure && (
                  <p className="text-[10px] text-gold-bright italic mt-2">🗺 En aventura…</p>
                )}
                {!mapData.hero.isAlive && (
                  <p className="text-[10px] text-blood-bright italic mt-2">💀 Caído — reviviendo…</p>
                )}
              </div>
            </div>
          )}

          {/* Selected tile panel */}
          {selected && (
            <div className="trav-panel">
              <div className="trav-panel-header">
                <span>{TILE_ICONS[selected.type]} {TILE_LABEL[selected.type].toUpperCase()}</span>
                <button
                  onClick={() => setSelected(null)}
                  className="text-stone-600 hover:text-parchment text-xs font-bold"
                >✕</button>
              </div>
              <div className="p-3 space-y-3">

                {/* Coordinates & bonus */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-stone-500">({selected.x}, {selected.y})</span>
                  {Object.entries(selected.bonus).length > 0 && (
                    <span className="text-emerald-400 italic">
                      {Object.entries(selected.bonus).map(([k, v]) => `+${v}% ${k}`).join(", ")}
                    </span>
                  )}
                </div>

                {/* Village info */}
                {selected.village && (
                  <div className={`p-2.5 rounded border space-y-1.5 ${
                    selected.village.owner === "PLAYER"     ? "border-amber-700/50 bg-amber-950/25" :
                    selected.village.owner === "AI_RIVAL"   ? "border-red-700/50 bg-red-950/25" :
                    "border-stone-700/50 bg-stone-900/25"
                  }`}>
                    <p className="font-display text-parchment text-sm">{selected.village.name}</p>
                    <p className={`text-xs font-bold ${
                      selected.village.owner === "PLAYER"   ? "text-amber-300" :
                      selected.village.owner === "AI_RIVAL" ? "text-red-300" : "text-stone-400"
                    }`}>
                      {selected.village.owner === "PLAYER"     ? "🏆 Tu dominio" :
                       selected.village.owner === "AI_RIVAL"   ? "⚔ Territorio enemigo" :
                       "○ Aldea neutral"}
                    </p>
                    <p className="text-[10px] text-stone-500">Lealtad: {selected.village.loyalty}%</p>

                    {selected.village.owner === "PLAYER" && (
                      <Link
                        href={`/game/${id}/village/${selected.village.id}`}
                        className="block text-center btn-medieval text-xs py-1 mt-1"
                      >
                        🏰 Gobernar
                      </Link>
                    )}

                    {tributeEligibleArmy && (
                      <button
                        onClick={() => tributeMission(tributeEligibleArmy.id, selected.village!.id)}
                        disabled={tributeLoading}
                        className="w-full mt-1 text-xs px-3 py-1.5 rounded bg-amber-900/40 hover:bg-amber-800 border border-amber-700/50 text-amber-200 disabled:opacity-50 font-display"
                      >
                        {tributeLoading ? "⏳ Negociando…" : `💰 Tributo (${tributeCost} 🪙)`}
                      </button>
                    )}

                    {spyEligibleArmy && (
                      <button
                        onClick={() => spyMission(spyEligibleArmy.id, selected.village!.id)}
                        disabled={spyLoading}
                        className="w-full mt-1 text-xs px-3 py-1.5 rounded bg-purple-900/50 hover:bg-purple-800 border border-purple-700/50 text-purple-200 disabled:opacity-50 font-display"
                      >
                        {spyLoading ? "⏳ Infiltrando…" : "🕵 Espionaje"}
                      </button>
                    )}
                  </div>
                )}

                {/* Armies on tile */}
                {armiesOnSelectedTile.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] text-gold-bright font-display uppercase tracking-wider border-t border-bronze/30 pt-2">
                      Ejércitos aquí
                    </p>
                    {armiesOnSelectedTile.map(a => {
                      const total = a.troops.reduce((s, t) => s + t.count, 0);
                      const isMovingNow = a.isMoving && a.arrivesAt;
                      return (
                        <div key={a.id} className={`p-2 rounded border ${
                          a.owner === "PLAYER" ? "bg-amber-950/30 border-amber-700/50" : "bg-red-950/30 border-red-800/50"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-display text-xs ${a.owner === "PLAYER" ? "text-amber-300" : "text-red-300"}`}>
                              {a.owner === "PLAYER" ? "⚔ Tu hueste" : "☠ Enemigo"}
                              {total > 0 && <span className="text-stone-500 ml-1">({total})</span>}
                            </p>
                          </div>

                          {/* Stamina */}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="flex-1 bg-stone-900 rounded-full h-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${a.stamina > 60 ? "bg-emerald-500" : a.stamina > 30 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${a.stamina}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-stone-600">{a.stamina}%</span>
                          </div>

                          <p className="text-[9px] text-stone-500 italic mb-1.5">
                            {isMovingNow ? `🚶 ${timeLeftStr(a.arrivesAt)}` :
                             a.isResting  ? "💤 Descansando" :
                             a.isForaging ? "🌾 Forrajeando" : "⛺ Acampada"}
                          </p>

                          {a.troops.length > 0 && (
                            <div className="space-y-0.5 mb-2">
                              {a.troops.map(t => (
                                <div key={t.type} className="flex justify-between text-[9px]">
                                  <span className="text-stone-500">{TROOPS[t.type]?.name ?? t.type}</span>
                                  <span className="text-parchment-aged font-bold">{t.count}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {a.owner === "PLAYER" && !a.isMoving && (
                            <div className="flex gap-1 flex-wrap">
                              <button
                                onClick={() => { setSelectedArmyId(a.id); setMoveMode(true); }}
                                className="text-[9px] px-2 py-0.5 rounded bg-blue-900/50 hover:bg-blue-800 border border-blue-700/50 text-blue-200"
                              >🎯 Mover</button>
                              <button
                                onClick={() => armyAction(a.id, "REST")}
                                className="text-[9px] px-2 py-0.5 rounded bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-700/50 text-emerald-200"
                              >{a.isResting ? "▶ Reanudar" : "💤 Descansar"}</button>
                              <button
                                onClick={() => armyAction(a.id, "FORAGE")}
                                className="text-[9px] px-2 py-0.5 rounded bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-700/50 text-yellow-200"
                              >{a.isForaging ? "✕ Detener" : "🌾 Forrajear"}</button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {playerArmiesOnSelected.length >= 2 && (
                      <button
                        onClick={() => mergeArmies(playerArmiesOnSelected[1].id, playerArmiesOnSelected[0].id)}
                        className="w-full btn-medieval text-xs py-1"
                      >⚔ Unir huestes</button>
                    )}
                  </div>
                )}

                {armiesOnSelectedTile.length === 0 && !selected.village && (
                  <p className="text-[10px] text-stone-600 italic text-center py-1">
                    Sin ejércitos ni asentamientos.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* No selection hint */}
          {!selected && (
            <p className="text-[10px] text-stone-700 italic text-center py-4 px-2">
              Haz clic en una casilla del mapa para explorar sus secretos.
            </p>
          )}

        </aside>
      </div>

      {/* ── TOAST STACK ─────────────────────────────────────────────────── */}
      <div className="fixed top-16 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2 font-display text-sm rounded-sm border shadow-lg animate-fade-in ${
              t.type === "win"  ? "parchment border-gold text-ink" :
              t.type === "warn" ? "bg-blood-dark border-blood text-parchment" :
              "parchment border-bronze text-ink"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>

    </div>
  );
}
