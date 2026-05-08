"use client";
import { useEffect, useState, useCallback, use, useRef } from "react";
import Link from "next/link";
import { NOBILITY, NOBILITY_ORDER, type NobilityTitle } from "@/lib/game/constants/nobility";
import { TROOPS } from "@/lib/game/constants/troops";
import { FACTION_VISUALS } from "@/lib/game/constants/troopIcons";
import { HeroPortrait } from "@/components/Portrait";
import {
  FactionEmblem, PanelCorners,
  GlyphVillage, GlyphMap, GlyphHero, GlyphNobility, GlyphBattles, GlyphEvents,
  TroopIcon,
} from "@/components/NhIcons";

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

// ── Tile type → nh-tile variant ───────────────────────────────────────────────
const TILE_CLASS: Record<TileType, string> = {
  PLAIN:          "is-plains",
  VILLAGE:        "is-village",
  OASIS_FOREST:   "is-forest",
  OASIS_STONE:    "is-mountain",
  OASIS_IRON:     "is-mountain",
  OASIS_GRAIN:    "is-oasis",
  DEPOSIT_SILVER: "is-deposit",
  DEPOSIT_GOLD:   "is-deposit",
  RUINS:          "is-ruins",
  RIVER:          "is-river",
  MOUNTAIN:       "is-mountain",
  CAMP:           "is-ruins",
};

// ── Tile glyphs (small emoji inside tile) ─────────────────────────────────────
const TILE_GLYPH: Record<TileType, string> = {
  PLAIN: "", VILLAGE: "⬡", OASIS_FOREST: "♣", OASIS_STONE: "◆",
  OASIS_IRON: "⬟", OASIS_GRAIN: "⊛", DEPOSIT_SILVER: "◇",
  DEPOSIT_GOLD: "◈", RUINS: "⌘", RIVER: "≈", MOUNTAIN: "▲", CAMP: "△",
};

const TILE_LABEL: Record<TileType, string> = {
  PLAIN: "Llanura", VILLAGE: "Aldea", OASIS_FOREST: "Bosque",
  OASIS_STONE: "Cantera", OASIS_IRON: "Mina de hierro", OASIS_GRAIN: "Campo de grano",
  DEPOSIT_SILVER: "Depósito de plata", DEPOSIT_GOLD: "Depósito de oro",
  RUINS: "Ruinas", RIVER: "Río", MOUNTAIN: "Montaña", CAMP: "Campamento",
};

const EVENT_ICONS: Record<string, string> = {
  GOOD_HARVEST: "⊛", DROUGHT: "☼", PLAGUE: "☠", TOURNAMENT: "⚔", DISCOVERY: "◈",
  BANDITS: "⚡", FIRE: "△", REINFORCEMENTS: "⬡", REBELLION: "⊗", HOLY_RELIC: "✦",
  MERCENARY: "⚔", FLOOD: "≈", TREACHERY: "◇", SIEGE_WEAPON_FOUND: "⬟", VICTORY: "◆",
  NAHKOR_DIAS: "⌾", CATALIZADOR: "⊕", GUIVERNO_AVISTADO: "⟡",
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

const ZOOM_SIZES = [24, 32, 44, 56] as const;
type ZoomIdx = 0 | 1 | 2 | 3;

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    try {
      const res = await fetch(`/api/game/${id}/map`);
      if (res.ok) {
        setMapData(await res.json());
        setLoadError(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setLoadError(`${res.status}: ${d.error ?? "Error al cargar el mapa"}`);
      }
    } catch (e: any) {
      setLoadError(`Red: ${e.message ?? "error de red"}`);
    }
  }, [id]);

  useEffect(() => { loadMap(); }, [loadMap]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/game/${id}/tick`, { method: "POST" });
      const data = await res.json();
      if (data.battles > 0) showToast(`⚔ ${data.battles} batalla(s) resuelta(s)`, "warn");
      if (data.event) showToast(`${EVENT_ICONS[data.event.type] ?? "◈"} ${data.event.title}`, "info");
      if (data.verdict === "WON") showToast("◆ ¡Victoria!", "win");
      if (data.verdict === "LOST") showToast("☠ Derrota…", "warn");
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
    if (data.event) showToast(`${EVENT_ICONS[data.event.type] ?? "◈"} ${data.event.title}`);
    if (data.verdict === "WON") showToast("◆ ¡Victoria!", "win");
    if (data.verdict === "LOST") showToast("☠ Derrota…", "warn");
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
      showToast(`▶ Marcha iniciada — llega en ${m}m ${s}s`);
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
    if (res.ok) {
      showToast(action === "REST"
        ? (d.isResting ? "— Descansando" : "Descanso cancelado")
        : (d.isForaging ? "⊛ Forrajeando" : "Forrajeo cancelado"));
      loadMap();
    } else showToast(d.error ?? "Error", "warn");
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
    showToast(`◈ ${d.villageName} se une al reino (−${d.silverCost} plata)`, "win");
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
    showToast(d.success
      ? "◇ Misión exitosa — inteligencia obtenida"
      : "◇ Agente capturado — misión fracasada",
      d.success ? "win" : "warn");
    loadMap();
  }

  // ── Loading / error state ─────────────────────────────────────────────────
  if (!mapData) {
    return (
      <div className="nh-frame min-h-screen flex flex-col items-center justify-center gap-5 p-6">
        {loadError ? (
          <>
            <div className="text-4xl text-[var(--nh-gold)]">⚠</div>
            <p className="font-display text-[var(--nh-parchment)] text-xl">No se puede cargar el mapa</p>
            <p className="text-red-400 text-xs font-mono bg-black/40 px-3 py-2 rounded border border-red-800/50 max-w-lg text-center">
              {loadError}
            </p>
            <div className="flex gap-3">
              <button onClick={loadMap} className="nh-btn">↻ Reintentar</button>
              <Link href="/dashboard" className="nh-btn is-primary">← Inicio</Link>
            </div>
          </>
        ) : (
          <>
            <div
              className="w-12 h-12 rounded-full animate-pulse"
              style={{ background: "radial-gradient(circle, var(--nh-accent-bright), var(--nh-accent))" }}
            />
            <p className="font-display text-[var(--nh-parchment)] text-xl tracking-widest">
              Cargando el mundo Nahkor…
            </p>
          </>
        )}
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const isGameOver = mapData.status === "WON" || mapData.status === "LOST";
  const factionLower = mapData.faction.toLowerCase();
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
  const nextNd = nextNobilityIdx >= 0 && nextNobilityIdx < NOBILITY_ORDER.length
    ? NOBILITY[NOBILITY_ORDER[nextNobilityIdx]] : null;

  const pr = mapData.playerResources;
  const stats = mapData.stats ?? { playerVillages: 0, rivalVillages: 0, totalBattles: 0, totalTroops: 0 };
  const unreadEvents = (mapData.recentEvents ?? []).filter(e => !e.isRead).length;
  const factionVis = FACTION_VISUALS[mapData.faction] ?? FACTION_VISUALS.PORTADORES;

  const spyEligibleArmy = selected?.village?.owner === "AI_RIVAL"
    ? playerArmiesOnSelected.find(a => a.troops.some(t =>
        ["ESPÍA_OSCURO","ESPÍA_IMPERIAL","ESPÍA_COMERCIO","INFILTRADOR_SOMBRA"].includes(t.type)))
    : null;
  const tributeEligibleArmy = selected?.village?.owner === "AI_NEUTRAL"
    ? (playerArmiesOnSelected.length > 0 ? playerArmiesOnSelected[0] : null)
    : null;
  const tributeCost = selected?.village ? Math.round(selected.village.loyalty * 2.5) : 0;
  const movingArmies = mapData.armies.filter(a => a.owner === "PLAYER" && a.isMoving);

  // ── Resource capsule config ───────────────────────────────────────────────
  const RES_CONFIG = pr ? [
    { key: "wood",  val: pr.wood,  rate: pr.woodRate,  cap: pr.warehouseCap, color: "var(--nh-r-wood)",  label: "Madera"  },
    { key: "stone", val: pr.stone, rate: pr.stoneRate, cap: pr.warehouseCap, color: "var(--nh-r-stone)", label: "Piedra"  },
    { key: "iron",  val: pr.iron,  rate: pr.ironRate,  cap: pr.warehouseCap, color: "var(--nh-r-iron)",  label: "Hierro"  },
    { key: "grain", val: pr.grain, rate: pr.grainRate, cap: pr.granaryCap,   color: "var(--nh-r-grain)", label: "Grano"   },
    { key: "straw", val: pr.straw, rate: Math.floor(pr.grainRate * 0.4), cap: pr.granaryCap,
      color: "#fbbf24", label: "Paja", secondary: true },
    { key: "adobe", val: pr.adobe, rate: 0,            cap: pr.warehouseCap, color: "#f87171",
      label: "Adobe", secondary: true },
  ] : [];

  return (
    <div className="nh-frame min-h-screen flex flex-col overflow-hidden" data-faction={factionLower}>

      {/* ── GAME OVER OVERLAY ───────────────────────────────────────────── */}
      {isGameOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="nh-panel max-w-md w-full mx-4 p-8 text-center space-y-5">
            <PanelCorners />
            <div
              className="text-5xl mx-auto w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "radial-gradient(circle, var(--nh-accent-bright)33, transparent)" }}
            >
              {mapData.status === "WON" ? "◆" : "☠"}
            </div>
            <h1 className="font-display text-[var(--nh-gold-bright)] text-3xl tracking-widest">
              {mapData.status === "WON" ? "¡Victoria!" : "Derrota"}
            </h1>
            <p className="text-[var(--nh-parchment-dim)] italic text-sm leading-relaxed">
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
                <div key={s.l} className="rounded p-2" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid var(--nh-bronze)" }}>
                  <p className="font-display text-[var(--nh-gold-bright)] text-xl">{s.v}</p>
                  <p className="text-[var(--nh-parchment-dim)] text-xs">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard" className="nh-btn">← Inicio</Link>
              <Link href={`/game/${id}/events`} className="nh-btn is-primary">◈ Crónica</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="nh-navbar flex-shrink-0">

        {/* Faction portrait */}
        <div className="flex items-center justify-center px-2 border-r flex-shrink-0"
          style={{ borderColor: "var(--nh-bronze)", minWidth: 52 }}>
          <div className="nh-portrait">
            <div className="nh-portrait-inner">
              <FactionEmblem faction={mapData.faction} size={22} />
            </div>
            {mapData.hero && (
              <span className="nh-portrait-level">{mapData.hero.level}</span>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-stretch flex-1 overflow-x-auto gap-0.5 px-1">
          {pr && (
            <Link href={`/game/${id}/village/${pr.id}`} className="nh-navlink">
              <span className="nh-navlink-glyph"><GlyphVillage /></span>
              <span>Aldea</span>
            </Link>
          )}
          <div className="nh-navlink is-active">
            <span className="nh-navlink-glyph"><GlyphMap /></span>
            <span>Mapa</span>
          </div>
          <Link href={`/game/${id}/hero`} className="nh-navlink">
            <span className="nh-navlink-glyph"><GlyphHero /></span>
            <span>Héroe</span>
          </Link>
          <Link href={`/game/${id}/nobility`} className="nh-navlink">
            <span className="nh-navlink-glyph"><GlyphNobility /></span>
            <span>Nobleza</span>
          </Link>
          <Link href={`/game/${id}/battles`} className="nh-navlink">
            <span className="nh-navlink-glyph"><GlyphBattles /></span>
            <span>Batallas</span>
          </Link>
          <Link href={`/game/${id}/events`} className="nh-navlink relative">
            <span className="nh-navlink-glyph"><GlyphEvents /></span>
            <span>Sucesos</span>
            {unreadEvents > 0 && (
              <span
                className="absolute top-1 right-1 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                style={{ background: "var(--nh-accent-bright)", color: "var(--nh-bg)" }}
              >
                {unreadEvents}
              </span>
            )}
          </Link>
        </nav>

        {/* Right: currencies + advance */}
        <div className="flex items-center gap-3 px-3 border-l flex-shrink-0"
          style={{ borderColor: "var(--nh-bronze)" }}>
          {pr && (
            <>
              <div className="text-center leading-none">
                <p className="font-display text-[var(--nh-gold-bright)] text-sm font-bold">{pr.silver}</p>
                <p className="text-[9px] text-[var(--nh-parchment-dim)]">◇ Plata</p>
              </div>
              <div className="text-center leading-none">
                <p className="font-display text-amber-300 text-sm font-bold">{pr.gold}</p>
                <p className="text-[9px] text-[var(--nh-parchment-dim)]">◈ Oro</p>
              </div>
            </>
          )}
          <div className="text-center leading-none">
            <p className="text-[var(--nh-parchment-dim)] text-[9px]">AÑO</p>
            <p className="font-display text-[var(--nh-gold-bright)] text-sm font-bold">{mapData.tick}</p>
          </div>
          <button
            onClick={manualTick} disabled={ticking}
            className="nh-btn text-xs px-3 py-1.5 whitespace-nowrap"
          >
            {ticking ? "…" : "⏩ Avanzar"}
          </button>
        </div>
      </header>

      {/* ── RESOURCE BAR ────────────────────────────────────────────────── */}
      {pr && (
        <div className="nh-resbar flex-shrink-0">
          {RES_CONFIG.map(r => (
            <div
              key={r.key}
              className={`nh-rescap${r.secondary ? " is-secondary" : ""}`}
              style={{ "--c": r.color } as React.CSSProperties}
              title={`${r.label}: ${r.val} / ${r.cap}${r.rate > 0 ? ` · +${r.rate}/h` : ""}`}
            >
              <div className="nh-rescap-icon" />
              <div className="nh-rescap-body">
                <span className="nh-rescap-value">{r.val}</span>
                {r.rate > 0 && <span className="nh-rescap-rate">+{r.rate}/h</span>}
                <span className="nh-rescap-label">{r.label}</span>
                <div className="nh-rescap-bar">
                  <i style={{ width: `${Math.min(100, (r.val / r.cap) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CONQUEST PROGRESS ───────────────────────────────────────────── */}
      {mapData.status === "PLAYING" && (
        <div
          className="flex items-center gap-3 px-3 py-1.5 flex-shrink-0 border-b"
          style={{ background: "var(--nh-bg-2)", borderColor: "var(--nh-bronze-dim)" }}
        >
          <span
            className="text-[9px] font-display uppercase tracking-wider whitespace-nowrap"
            style={{ color: "var(--nh-parchment-dim)" }}
          >
            Conquista
          </span>
          <div className="nh-bar flex-1">
            <i style={{ width: `${Math.min(100, (stats.playerVillages / 15) * 100)}%` }} />
          </div>
          <span
            className="text-[9px] font-display whitespace-nowrap"
            style={{ color: "var(--nh-accent-bright)" }}
          >
            {stats.playerVillages}/15 aldeas
          </span>
        </div>
      )}

      {/* ── MOVE MODE BANNER ────────────────────────────────────────────── */}
      {moveMode && (
        <div
          className="px-4 py-2 text-sm flex items-center justify-between flex-shrink-0 border-b"
          style={{
            background: "linear-gradient(90deg, var(--nh-bg-3), rgba(var(--nh-accent),0.1))",
            borderColor: "var(--nh-accent)",
            color: "var(--nh-parchment)",
          }}
        >
          <span className="font-display">◎ Selecciona el destino del ejército en el mapa</span>
          <button
            onClick={() => { setMoveMode(false); setSelectedArmyId(null); }}
            className="text-xs underline opacity-60 hover:opacity-100"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* ── MAIN 3-COLUMN LAYOUT ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
        <aside
          className="w-52 xl:w-56 flex-shrink-0 flex flex-col overflow-y-auto gap-2 p-2 border-r"
          style={{ background: "var(--nh-bg)", borderColor: "var(--nh-bronze-dim)" }}
        >

          {/* Info Box — recent events */}
          <div className="nh-panel">
            <PanelCorners />
            <div className="nh-panel-header">
              <span>Info Box</span>
              {unreadEvents > 0 && (
                <span style={{ color: "var(--nh-accent-bright)" }} className="text-[10px]">
                  {unreadEvents}×
                </span>
              )}
            </div>
            <div className="nh-panel-body space-y-1.5">
              {(mapData.recentEvents ?? []).length === 0 ? (
                <p className="text-[10px] italic text-center py-2"
                  style={{ color: "var(--nh-parchment-dim)" }}>
                  Sin sucesos recientes
                </p>
              ) : (
                (mapData.recentEvents ?? []).slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className="text-[10px] p-1.5 rounded border"
                    style={{
                      borderColor: !ev.isRead ? "var(--nh-bronze)" : "rgba(139,90,43,0.2)",
                      background: !ev.isRead ? "rgba(217,168,71,0.06)" : "transparent",
                      opacity: ev.isRead ? 0.55 : 1,
                    }}
                  >
                    <p
                      className="font-semibold truncate"
                      style={{ color: "var(--nh-parchment)" }}
                    >
                      {EVENT_ICONS[ev.type] ?? "◈"} {ev.title}
                    </p>
                    <p className="leading-tight line-clamp-2 mt-0.5"
                      style={{ color: "var(--nh-parchment-dim)" }}>
                      {ev.description}
                    </p>
                  </div>
                ))
              )}
              <Link
                href={`/game/${id}/events`}
                className="block text-center text-[9px] hover:underline italic"
                style={{ color: "var(--nh-gold-bright)" }}
              >
                Ver crónica completa →
              </Link>
            </div>
          </div>

          {/* Armies in march */}
          {movingArmies.length > 0 && (
            <div className="nh-panel">
              <PanelCorners />
              <div className="nh-panel-header">En Marcha</div>
              <div className="nh-panel-body space-y-1.5">
                {movingArmies.map(a => (
                  <div
                    key={a.id}
                    className="text-[10px] rounded p-1.5"
                    style={{ background: "rgba(58,123,217,0.12)", border: "1px solid rgba(58,123,217,0.3)" }}
                  >
                    <p style={{ color: "#93c5fd" }}>▶ {a.troops.reduce((s, t) => s + t.count, 0)} tropas</p>
                    <p className="font-bold" style={{ color: "#60a5fa" }}>{timeLeftStr(a.arrivesAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="nh-panel mt-auto">
            <PanelCorners />
            <div className="nh-panel-header">Leyenda</div>
            <div className="nh-panel-body grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]"
              style={{ color: "var(--nh-parchment-dim)" }}>
              {Object.entries(TILE_GLYPH).filter(([, v]) => v).map(([type, glyph]) => (
                <span key={type}>{glyph} {TILE_LABEL[type as TileType]}</span>
              ))}
              <span style={{ color: "var(--nh-accent-bright)" }}>⚔ Tu ejército</span>
              <span style={{ color: "#ff6b6b" }}>☠ Enemigo</span>
            </div>
          </div>

        </aside>

        {/* ── MAP ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-3 relative"
          style={{ background: "var(--nh-bg)" }}>

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
            <button
              onClick={() => setZoomIdx(Math.min(3, zoomIdx + 1) as ZoomIdx)}
              className="nh-btn w-8 h-8 p-0 font-bold text-base"
            >+</button>
            <button
              onClick={() => setZoomIdx(Math.max(0, zoomIdx - 1) as ZoomIdx)}
              className="nh-btn w-8 h-8 p-0 font-bold text-base"
            >−</button>
          </div>

          <div
            className="inline-grid gap-px p-1 rounded-sm"
            style={{
              gridTemplateColumns: `repeat(${mapData.width}, ${tileSize}px)`,
              background: "var(--nh-bg)",
              border: "2px solid var(--nh-bronze)",
              boxShadow: "0 0 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(217,168,71,0.1)",
            }}
          >
            {Array.from({ length: mapData.height }, (_, y) =>
              Array.from({ length: mapData.width }, (_, x) => {
                const tile = tileMap.get(`${x},${y}`);
                if (!tile) return (
                  <div
                    key={`${x},${y}`}
                    style={{ width: tileSize, height: tileSize, background: "var(--nh-bg)" }}
                  />
                );

                const isHidden = tile.visibility === "HIDDEN";
                const isFog    = tile.visibility === "FOG";
                const isSelected = selected?.id === tile.id;
                const armiesHere   = armiesByTile.get(tile.id) ?? [];
                const playerArmies = armiesHere.filter(a => a.owner === "PLAYER");
                const rivalArmies  = armiesHere.filter(a => a.owner === "AI_RIVAL");
                const villageOwner = tile.village?.owner;

                // Ownership ring via inline box-shadow (doesn't conflict with nh-tile hover)
                const ownerStyle: React.CSSProperties = villageOwner === "PLAYER"
                  ? { outline: "2px solid #fbbf24", outlineOffset: "-2px" }
                  : villageOwner === "AI_RIVAL"
                  ? { outline: "2px solid #ef4444", outlineOffset: "-2px" }
                  : villageOwner === "AI_NEUTRAL"
                  ? { outline: "1px solid rgba(148,163,184,0.4)", outlineOffset: "-1px" }
                  : {};

                return (
                  <button
                    key={`${x},${y}`}
                    onClick={() => {
                      if (moveMode && !isHidden && tile.type !== "MOUNTAIN") moveArmy(x, y);
                      else setSelected(isHidden ? null : tile);
                    }}
                    style={{
                      width: tileSize, height: tileSize,
                      opacity: isHidden ? 1 : isFog ? 0.3 : 1,
                      background: isHidden ? "var(--nh-bg)" : undefined,
                      cursor: moveMode && !isHidden && tile.type !== "MOUNTAIN"
                        ? "crosshair" : "pointer",
                      ...ownerStyle,
                    }}
                    className={[
                      "nh-tile",
                      isHidden ? "" : TILE_CLASS[tile.type],
                      isSelected ? "is-selected" : "",
                      moveMode && !isHidden && tile.type !== "MOUNTAIN"
                        ? "[&:hover]:brightness-125" : "",
                    ].filter(Boolean).join(" ")}
                    title={isHidden
                      ? "Territorio desconocido"
                      : `${TILE_LABEL[tile.type]}${tile.village ? ` — ${tile.village.name}` : ""} (${x},${y})`}
                  >
                    {!isHidden && (
                      <>
                        {tileSize >= 32 && TILE_GLYPH[tile.type] && (
                          <div className="nh-tile-glyph">{TILE_GLYPH[tile.type]}</div>
                        )}
                        {playerArmies.length > 0 && (
                          <div className="nh-tile-army">
                            ⚔{playerArmies.length > 1 ? playerArmies.length : ""}
                          </div>
                        )}
                        {rivalArmies.length > 0 && (
                          <div className="nh-tile-army nh-tile-enemy"
                            style={{ top: playerArmies.length > 0 ? 10 : 1 }}>
                            ☠{rivalArmies.length > 1 ? rivalArmies.length : ""}
                          </div>
                        )}
                        {villageOwner === "PLAYER" && <div className="nh-tile-mine" />}
                        {tileSize >= 56 && tile.village && (
                          <div
                            className="absolute bottom-0 left-0 right-0 text-[7px] text-center leading-tight truncate px-0.5"
                            style={{ background: "rgba(0,0,0,0.55)", color: "var(--nh-parchment-dim)", zIndex: 2 }}
                          >
                            {tile.village.name}
                          </div>
                        )}
                      </>
                    )}
                    {isHidden && (
                      <div className="nh-tile-glyph" style={{ opacity: 0.2 }}>▓</div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ───────────────────────────────────────────── */}
        <aside
          className="w-68 xl:w-72 flex-shrink-0 flex flex-col overflow-y-auto gap-2 p-2 border-l"
          style={{ background: "var(--nh-bg)", borderColor: "var(--nh-bronze-dim)" }}
        >

          {/* Commander panel */}
          <div className="nh-panel">
            <PanelCorners />
            <div className="nh-panel-header">Comandante</div>
            <div className="nh-panel-body space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="nh-portrait flex-shrink-0">
                  <div className="nh-portrait-inner">
                    <FactionEmblem faction={mapData.faction} size={20} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  {nd && (
                    <>
                      <p
                        className="font-display text-sm truncate"
                        style={{ color: factionVis.accent ? "var(--nh-accent-bright)" : "var(--nh-gold-bright)" }}
                      >
                        {nd.icon} {nd.labelEs}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--nh-parchment-dim)" }}>
                        ◈ {mapData.nobilityXp} prestigio
                      </p>
                    </>
                  )}
                </div>
              </div>
              {nextNd && (
                <div className="space-y-1">
                  <div className="nh-bar">
                    <i style={{ width: `${Math.min(100, (mapData.nobilityXp / nextNd.minPrestige) * 100)}%` }} />
                  </div>
                  <p className="text-[9px] italic" style={{ color: "var(--nh-parchment-dim)" }}>
                    → {nextNd.labelEs} en {nextNd.minPrestige - mapData.nobilityXp} más
                  </p>
                </div>
              )}
              <div
                className="h-px w-full"
                style={{ background: "linear-gradient(90deg, transparent, var(--nh-bronze), transparent)" }}
              />
              {pr && (
                <Link
                  href={`/game/${id}/village/${pr.id}`}
                  className="block rounded p-2 transition-colors"
                  style={{
                    background: "rgba(217,168,71,0.06)",
                    border: "1px solid var(--nh-bronze-dim)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(217,168,71,0.12)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(217,168,71,0.06)")}
                >
                  <p className="font-display text-xs" style={{ color: "var(--nh-parchment)" }}>
                    ⬡ {pr.name}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--nh-gold-bright)" }}>
                    Gobernar aldea →
                  </p>
                </Link>
              )}
            </div>
          </div>

          {/* Villages panel */}
          <div className="nh-panel">
            <PanelCorners />
            <div className="nh-panel-header">
              <span>Aldeas {stats.playerVillages}/15</span>
              <span className="text-[9px]" style={{ color: "var(--nh-parchment-dim)" }}>
                {stats.rivalVillages} rivales
              </span>
            </div>
            <div className="nh-panel-body space-y-2">
              <div className="nh-bar">
                <i style={{ width: `${Math.min(100, (stats.playerVillages / 15) * 100)}%` }} />
              </div>
              <p className="text-[9px] text-right" style={{ color: "var(--nh-parchment-dim)" }}>
                {stats.playerVillages} / 15 para la victoria
              </p>
              {pr && (
                <div
                  className="flex items-center justify-between text-[10px] py-1 px-2 rounded"
                  style={{ background: "rgba(217,168,71,0.06)", border: "1px solid var(--nh-bronze-dim)" }}
                >
                  <span style={{ color: "var(--nh-parchment)" }}>{pr.name}</span>
                  <Link
                    href={`/game/${id}/village/${pr.id}`}
                    style={{ color: "var(--nh-gold-bright)" }}
                    className="hover:underline"
                  >→</Link>
                </div>
              )}
              <div className="grid grid-cols-3 gap-1 text-center">
                {[
                  { v: stats.playerVillages, l: "Aldeas",   c: "var(--nh-accent-bright)" },
                  { v: stats.totalTroops,    l: "Tropas",   c: "#93c5fd" },
                  { v: stats.totalBattles,   l: "Batallas", c: "var(--nh-parchment-dim)" },
                ].map(s => (
                  <div
                    key={s.l}
                    className="rounded p-1.5"
                    style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(139,90,43,0.2)" }}
                  >
                    <p className="font-display text-sm font-bold" style={{ color: s.c }}>{s.v}</p>
                    <p className="text-[9px]" style={{ color: "var(--nh-parchment-dim)" }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hero panel */}
          {mapData.hero && (
            <div className="nh-panel">
              <PanelCorners />
              <div className="nh-panel-header">
                <span>⚔ Héroe</span>
                <Link
                  href={`/game/${id}/hero`}
                  className="text-[9px] hover:underline"
                  style={{ color: "var(--nh-gold-bright)" }}
                >
                  Gestionar →
                </Link>
              </div>
              <div className="nh-panel-body space-y-2">
                <HeroPortrait
                  faction={mapData.faction}
                  level={mapData.hero.level}
                  hp={mapData.hero.hp}
                  maxHp={mapData.hero.maxHp}
                  size="lg"
                  isAlive={mapData.hero.isAlive}
                  isOnAdventure={mapData.hero.isOnAdventure}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  {mapData.hero.isOnAdventure && (
                    <span
                      className="text-[9px] px-2 py-0.5 rounded font-display"
                      style={{ border: "1px solid var(--nh-bronze)", color: "var(--nh-parchment-dim)" }}
                    >
                      ⟡ En aventura
                    </span>
                  )}
                  {!mapData.hero.isAlive && (
                    <span
                      className="text-[9px] px-2 py-0.5 rounded font-display"
                      style={{ border: "1px solid #ef4444", color: "#f87171" }}
                    >
                      ☠ Caído
                    </span>
                  )}
                  {mapData.hero.isAlive && !mapData.hero.isOnAdventure && (
                    <span
                      className="text-[9px] px-2 py-0.5 rounded font-display"
                      style={{ border: "1px solid var(--nh-bronze)", color: "var(--nh-accent-bright)" }}
                    >
                      ⚔ Listo
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Selected tile panel */}
          {selected && (
            <div className="nh-panel">
              <PanelCorners />
              <div className="nh-panel-header">
                <span>{TILE_GLYPH[selected.type]} {TILE_LABEL[selected.type].toUpperCase()}</span>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs font-bold hover:opacity-100 opacity-50"
                  style={{ color: "var(--nh-parchment)" }}
                >✕</button>
              </div>
              <div className="nh-panel-body space-y-3">

                {/* Coordinates & bonus */}
                <div className="flex items-center justify-between text-[10px]">
                  <span style={{ color: "var(--nh-parchment-dim)" }}>({selected.x}, {selected.y})</span>
                  {Object.entries(selected.bonus).length > 0 && (
                    <span className="italic" style={{ color: "#6ee7b7" }}>
                      {Object.entries(selected.bonus).map(([k, v]) => `+${v}% ${k}`).join(", ")}
                    </span>
                  )}
                </div>

                {/* Village info */}
                {selected.village && (
                  <div
                    className="p-2.5 rounded border space-y-1.5"
                    style={{
                      borderColor: selected.village.owner === "PLAYER"
                        ? "rgba(251,191,36,0.5)"
                        : selected.village.owner === "AI_RIVAL"
                        ? "rgba(239,68,68,0.5)"
                        : "rgba(100,116,139,0.35)",
                      background: selected.village.owner === "PLAYER"
                        ? "rgba(217,168,71,0.07)"
                        : selected.village.owner === "AI_RIVAL"
                        ? "rgba(239,68,68,0.06)"
                        : "rgba(0,0,0,0.2)",
                    }}
                  >
                    <p className="font-display text-sm" style={{ color: "var(--nh-parchment)" }}>
                      {selected.village.name}
                    </p>
                    <p
                      className="text-xs font-bold"
                      style={{
                        color: selected.village.owner === "PLAYER"
                          ? "#fbbf24"
                          : selected.village.owner === "AI_RIVAL"
                          ? "#f87171"
                          : "var(--nh-parchment-dim)",
                      }}
                    >
                      {selected.village.owner === "PLAYER"     ? "◆ Tu dominio" :
                       selected.village.owner === "AI_RIVAL"   ? "⚔ Territorio enemigo" :
                       "◇ Aldea neutral"}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--nh-parchment-dim)" }}>
                      Lealtad: {selected.village.loyalty}%
                    </p>

                    {selected.village.owner === "PLAYER" && (
                      <Link
                        href={`/game/${id}/village/${selected.village.id}`}
                        className="nh-btn is-primary w-full text-xs py-1 text-center block mt-1"
                      >
                        ⬡ Gobernar
                      </Link>
                    )}

                    {tributeEligibleArmy && (
                      <button
                        onClick={() => tributeMission(tributeEligibleArmy.id, selected.village!.id)}
                        disabled={tributeLoading}
                        className="nh-btn w-full mt-1 text-xs py-1.5"
                      >
                        {tributeLoading ? "… Negociando" : `◈ Tributo (${tributeCost} plata)`}
                      </button>
                    )}

                    {spyEligibleArmy && (
                      <button
                        onClick={() => spyMission(spyEligibleArmy.id, selected.village!.id)}
                        disabled={spyLoading}
                        className="nh-btn w-full mt-1 text-xs py-1.5"
                        style={{ borderColor: "#7c3aed", color: "#c4b5fd" }}
                      >
                        {spyLoading ? "… Infiltrando" : "◇ Espionaje"}
                      </button>
                    )}
                  </div>
                )}

                {/* Armies on tile */}
                {armiesOnSelectedTile.length > 0 && (
                  <div className="space-y-2">
                    <p
                      className="text-[9px] font-display uppercase tracking-wider border-t pt-2"
                      style={{ color: "var(--nh-gold-bright)", borderColor: "var(--nh-bronze-dim)" }}
                    >
                      Ejércitos aquí
                    </p>
                    {armiesOnSelectedTile.map(a => {
                      const total = a.troops.reduce((s, t) => s + t.count, 0);
                      const isMovingNow = a.isMoving && a.arrivesAt;
                      return (
                        <div
                          key={a.id}
                          className="p-2 rounded border"
                          style={{
                            background: a.owner === "PLAYER"
                              ? "rgba(217,168,71,0.07)" : "rgba(239,68,68,0.07)",
                            borderColor: a.owner === "PLAYER"
                              ? "rgba(217,168,71,0.35)" : "rgba(239,68,68,0.35)",
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="font-display text-xs"
                              style={{
                                color: a.owner === "PLAYER" ? "#fbbf24" : "#f87171",
                              }}
                            >
                              {a.owner === "PLAYER" ? "⚔ Tu hueste" : "☠ Enemigo"}
                              {total > 0 && (
                                <span className="ml-1 opacity-60 text-[10px]">({total})</span>
                              )}
                            </p>
                          </div>

                          {/* Stamina bar */}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="nh-bar flex-1">
                              <i
                                style={{
                                  width: `${a.stamina}%`,
                                  background: a.stamina > 60
                                    ? "#4ade80" : a.stamina > 30 ? "#facc15" : "#f87171",
                                }}
                              />
                            </div>
                            <span className="text-[9px]" style={{ color: "var(--nh-parchment-dim)" }}>
                              {a.stamina}%
                            </span>
                          </div>

                          <p className="text-[9px] italic mb-1.5" style={{ color: "var(--nh-parchment-dim)" }}>
                            {isMovingNow ? `▶ ${timeLeftStr(a.arrivesAt)}` :
                             a.isResting  ? "— Descansando" :
                             a.isForaging ? "⊛ Forrajeando" : "△ Acampada"}
                          </p>

                          {/* Troop icons */}
                          {a.troops.length > 0 && (
                            <div
                              className="grid grid-cols-3 gap-1.5 mb-2 p-1.5 rounded"
                              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(139,90,43,0.2)" }}
                            >
                              {a.troops.map(t => (
                                <div
                                  key={t.type}
                                  className="flex flex-col items-center gap-0.5"
                                  title={`${TROOPS[t.type]?.name ?? t.type}: ${t.count}`}
                                >
                                  <div
                                    className="rounded-full flex items-center justify-center"
                                    style={{
                                      width: 28, height: 28,
                                      background: "rgba(0,0,0,0.4)",
                                      border: "1px solid var(--nh-bronze)",
                                    }}
                                  >
                                    <TroopIcon type={t.type} size={16} c="var(--nh-accent-bright)" />
                                  </div>
                                  <span className="text-[8px]" style={{ color: "var(--nh-parchment-dim)" }}>
                                    {t.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {a.owner === "PLAYER" && !a.isMoving && (
                            <div className="flex gap-1 flex-wrap">
                              <button
                                onClick={() => { setSelectedArmyId(a.id); setMoveMode(true); }}
                                className="nh-btn text-[9px] px-2 py-0.5"
                                style={{ borderColor: "#3b82f6", color: "#93c5fd" }}
                              >
                                ◎ Mover
                              </button>
                              <button
                                onClick={() => armyAction(a.id, "REST")}
                                className="nh-btn text-[9px] px-2 py-0.5"
                                style={{ borderColor: "#16a34a", color: "#86efac" }}
                              >
                                {a.isResting ? "▶ Reanudar" : "— Descansar"}
                              </button>
                              <button
                                onClick={() => armyAction(a.id, "FORAGE")}
                                className="nh-btn text-[9px] px-2 py-0.5"
                                style={{ borderColor: "#ca8a04", color: "#fde047" }}
                              >
                                {a.isForaging ? "✕ Detener" : "⊛ Forrajear"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {playerArmiesOnSelected.length >= 2 && (
                      <button
                        onClick={() => mergeArmies(playerArmiesOnSelected[1].id, playerArmiesOnSelected[0].id)}
                        className="nh-btn is-primary w-full text-xs py-1"
                      >
                        ⚔ Unir huestes
                      </button>
                    )}
                  </div>
                )}

                {armiesOnSelectedTile.length === 0 && !selected.village && (
                  <p className="text-[10px] italic text-center py-1"
                    style={{ color: "var(--nh-parchment-dim)" }}>
                    Sin ejércitos ni asentamientos.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* No selection hint */}
          {!selected && (
            <p className="text-[10px] italic text-center py-4 px-2"
              style={{ color: "rgba(139,90,43,0.5)" }}>
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
            className="px-4 py-2 font-display text-sm rounded-sm border shadow-lg"
            style={{
              background: t.type === "win"
                ? "var(--nh-bg-3)"
                : t.type === "warn"
                ? "rgba(127,29,29,0.95)"
                : "var(--nh-bg-2)",
              borderColor: t.type === "win"
                ? "var(--nh-gold)"
                : t.type === "warn"
                ? "#991b1b"
                : "var(--nh-bronze)",
              color: t.type === "warn" ? "var(--nh-parchment)" : "var(--nh-parchment)",
              boxShadow: t.type === "win"
                ? "0 0 16px var(--nh-accent-glow)"
                : "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>

    </div>
  );
}
