"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { BUILDINGS } from "@/lib/game/constants/buildings";
import { TROOPS, TROOPS_BY_FACTION } from "@/lib/game/constants/troops";
import type { Faction } from "@/lib/game/constants/troops";
import { TroopPortrait, FactionCrest } from "@/components/Portrait";
import { BuildingSlot } from "@/components/BuildingSlot";
import { BUILDING_ICONS, BUILDING_COLORS } from "@/lib/game/constants/buildingIcons";

interface VillageData {
  id: string; name: string; owner: string; faction: string | null;
  wood: number; stone: number; iron: number; grain: number; straw: number; adobe: number; silver: number; gold: number;
  woodRate: number; stoneRate: number; ironRate: number; grainRate: number;
  warehouseCap: number; granaryCap: number; wallLevel: number;
  buildings: Array<{ id: string; type: string; level: number }>;
  buildQueues: Array<{ id: string; buildingType: string; targetLevel: number; endsAt: string }>;
  trainQueues: Array<{ id: string; troopType: string; count: number; endsAt: string }>;
}
interface ArmyData {
  id: string; owner: string; stamina: number; isResting: boolean; isMoving: boolean; isForaging: boolean;
  troops: Array<{ type: string; faction: string; count: number }>;
}

type Tab = "VIEW" | "BUILDINGS" | "BARRACKS" | "ARMIES" | "MARKET";

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "✓ Listo";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

const TRADE_RATES: Record<string, { icon: string; silverCost: number; label: string }> = {
  wood:  { icon: "🌲", silverCost: 2, label: "Madera" },
  stone: { icon: "⛏", silverCost: 2, label: "Piedra" },
  iron:  { icon: "⚒", silverCost: 4, label: "Hierro" },
  grain: { icon: "🌾", silverCost: 1, label: "Grano" },
  adobe: { icon: "🧱", silverCost: 3, label: "Adobe" },
};
const TRADE_AMOUNTS = [50, 100, 250, 500];

export default function VillagePage({ params }: { params: Promise<{ id: string; vid: string }> }) {
  const { id, vid } = use(params);
  const [data, setData] = useState<{ village: VillageData; armies: ArmyData[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("VIEW");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [, setClock] = useState(Date.now());
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/game/${id}/village/${vid}`);
      if (res.ok) {
        setData(await res.json());
        setLoadError(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setLoadError(`${res.status}: ${d.error ?? "Error al cargar la aldea"}`);
      }
    } catch (e: any) {
      setLoadError(`Red: ${e.message ?? "error de red"}`);
    }
  }

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [id, vid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(t); }, []);

  async function doAction(action: string, payload: object) {
    const res = await fetch(`/api/game/${id}/village/${vid}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const d = await res.json().catch(() => ({}));
    const text = d.error ?? d.message ?? (d.ok ? "Hecho." : "Error");
    setMsg({ text, ok: d.ok ?? false });
    if (d.ok) load();
    setTimeout(() => setMsg(null), 4000);
  }

  async function rename() {
    await doAction("RENAME", { name: newName });
    setRenaming(false);
  }

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      {loadError ? (
        <>
          <div className="text-5xl">⚠</div>
          <p className="title-gold font-display text-2xl">No se puede cargar la aldea</p>
          <p className="text-blood-bright text-sm font-mono bg-stone-900/60 px-3 py-2 rounded border border-bronze/40 max-w-lg text-center">{loadError}</p>
          <div className="flex gap-3">
            <button onClick={load} className="btn-medieval text-sm">↻ Reintentar</button>
            <Link href={`/game/${id}`} className="btn-blood text-sm">← Volver al mapa</Link>
            <Link href="/dashboard" className="btn-medieval text-sm">🏠 Inicio</Link>
          </div>
        </>
      ) : (
        <>
          <div className="text-5xl animate-pulse">🏰</div>
          <p className="title-gold font-display text-2xl">Cargando aldea…</p>
        </>
      )}
    </div>
  );

  const { village, armies } = data;
  const faction = (village.faction ?? "PORTADORES") as Faction;
  const hasMarket = village.buildings.some(b => b.type === "MARKET");

  const res = {
    wood: village.wood, stone: village.stone, iron: village.iron,
    grain: village.grain, straw: village.straw, adobe: village.adobe,
    silver: village.silver, gold: village.gold,
  };

  // Resource bar config (compact)
  const RES_BAR = [
    { key: "wood",   icon: "🌲", val: village.wood,   rate: village.woodRate,                  cap: village.warehouseCap, color: "#4ade80" },
    { key: "stone",  icon: "⛏", val: village.stone,  rate: village.stoneRate,                 cap: village.warehouseCap, color: "#94a3b8" },
    { key: "iron",   icon: "⚒", val: village.iron,   rate: village.ironRate,                  cap: village.warehouseCap, color: "#fb923c" },
    { key: "grain",  icon: "🌾", val: village.grain,  rate: village.grainRate,                 cap: village.granaryCap,   color: "#facc15" },
    { key: "straw",  icon: "🪶", val: village.straw,  rate: Math.floor(village.grainRate*0.4), cap: village.granaryCap,   color: "#fbbf24" },
    { key: "adobe",  icon: "🧱", val: village.adobe,  rate: 0,                                 cap: village.warehouseCap, color: "#f87171" },
    { key: "silver", icon: "🪙", val: village.silver, rate: 0,                                 cap: village.warehouseCap, color: "#7dd3fc" },
    { key: "gold",   icon: "💰", val: village.gold,   rate: 0,                                 cap: village.warehouseCap, color: "#fde047" },
  ];

  // Building positions for circular layout (Travian-style)
  const buildingDefs = Object.values(BUILDINGS);
  // Center: MAIN_HALL. Surrounding ring: rest of buildings.
  const mainHall = buildingDefs.find(b => b.key === "MAIN_HALL");
  const otherBuildings = buildingDefs.filter(b => b.key !== "MAIN_HALL");

  function getBuildingState(type: string) {
    const existing = village.buildings.find(b => b.type === type);
    const inQueue = village.buildQueues.find(q => q.buildingType === type);
    return { level: existing?.level ?? 0, inQueue };
  }

  // Selected building details
  const selDef = selectedBuilding ? BUILDINGS[selectedBuilding as keyof typeof BUILDINGS] : null;
  const selState = selectedBuilding ? getBuildingState(selectedBuilding) : null;
  const selLvlDef = selDef && selState && selState.level < selDef.maxLevel ? selDef.levels[selState.level] : null;
  const canAffordSel = selLvlDef ? (
    res.wood   >= (selLvlDef.cost.wood   || 0) &&
    res.stone  >= (selLvlDef.cost.stone  || 0) &&
    res.iron   >= (selLvlDef.cost.iron   || 0) &&
    res.adobe  >= (selLvlDef.cost.adobe  || 0) &&
    res.silver >= (selLvlDef.cost.silver || 0)
  ) : false;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0f0904" }}>

      {/* ── TOP HEADER ──────────────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-4 py-2 border-b-2 border-bronze flex-shrink-0"
        style={{ background: "linear-gradient(180deg, #3d2510 0%, #1f140a 100%)" }}
      >
        <Link href={`/game/${id}`} className="text-parchment-aged hover:text-gold-bright text-sm italic flex-shrink-0">
          ← Mapa
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <FactionCrest faction={faction} size="sm" />
        </div>
        {renaming ? (
          <div className="flex items-center gap-2">
            <input
              value={newName} onChange={e => setNewName(e.target.value)}
              className="bg-wood border border-bronze text-parchment px-2 py-0.5 font-display text-sm rounded-sm w-44"
              onKeyDown={e => { if (e.key === "Enter") rename(); if (e.key === "Escape") setRenaming(false); }}
              autoFocus
            />
            <button onClick={rename} className="text-xs btn-medieval py-0.5 px-2">✓</button>
            <button onClick={() => setRenaming(false)} className="text-xs text-parchment-aged hover:text-parchment">✕</button>
          </div>
        ) : (
          <button
            onClick={() => { setNewName(village.name); setRenaming(true); }}
            className="font-display title-gold text-lg hover:opacity-80 text-left flex items-center gap-1.5"
          >
            🏰 {village.name} <span className="text-bronze text-xs">✎</span>
          </button>
        )}
        {msg && (
          <p className={`ml-auto text-sm italic font-display ${msg.ok ? "text-gold-bright" : "text-blood-bright"}`}>
            {msg.text}
          </p>
        )}
      </header>

      {/* ── COMPACT RESOURCE BAR ────────────────────────────────── */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 flex-shrink-0 flex-wrap border-b border-bronze/40"
        style={{ background: "#150e06" }}
      >
        {RES_BAR.map((r) => {
          const pct = Math.min(100, (r.val / r.cap) * 100);
          return (
            <div
              key={r.key}
              className="res-cell flex items-center gap-1.5 flex-1 min-w-[78px]"
              title={`${r.key}: ${r.val} / ${r.cap}${r.rate > 0 ? ` · +${r.rate}/h` : ""}`}
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-sm"
                style={{
                  background: `radial-gradient(circle, ${r.color}33 0%, transparent 70%)`,
                  border: `1px solid ${r.color}55`,
                }}
              >{r.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-display font-bold text-xs leading-none" style={{ color: r.color, textShadow: `0 0 6px ${r.color}55` }}>
                    {r.val}
                  </span>
                  {r.rate > 0 && <span className="text-[9px] text-stone-500 leading-none">+{r.rate}/h</span>}
                </div>
                <div className="h-1 bg-stone-950 rounded-full overflow-hidden mt-0.5 border border-stone-900/80">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${r.color}88, ${r.color})`,
                      boxShadow: `0 0 4px ${r.color}88`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── QUEUE STRIP ─────────────────────────────────────────── */}
      {(village.buildQueues.length > 0 || village.trainQueues.length > 0) && (
        <div className="flex gap-3 px-3 py-1.5 flex-shrink-0 flex-wrap border-b border-bronze/30" style={{ background: "#1a0f06" }}>
          {village.buildQueues.map(q => {
            const def = BUILDINGS[q.buildingType as keyof typeof BUILDINGS];
            const icon = BUILDING_ICONS[q.buildingType] ?? "🏗";
            return (
              <div key={q.id} className="flex items-center gap-1.5 text-xs bg-amber-950/30 border border-amber-800/40 rounded px-2 py-1">
                <span>{icon}</span>
                <span className="font-display text-parchment-aged">{def?.name ?? q.buildingType}</span>
                <span className="stat-badge">Nv.{q.targetLevel}</span>
                <span className="text-amber-400 font-bold font-display">{timeLeft(q.endsAt)}</span>
              </div>
            );
          })}
          {village.trainQueues.map(q => (
            <div key={q.id} className="flex items-center gap-1.5 text-xs bg-red-950/30 border border-red-800/40 rounded px-2 py-1">
              <TroopPortrait troopType={q.troopType} size="xs" />
              <span className="font-display text-parchment-aged">×{q.count}</span>
              <span className="text-red-400 font-bold font-display">{timeLeft(q.endsAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── TABS ────────────────────────────────────────────────── */}
      <div className="border-b-2 border-bronze flex overflow-x-auto flex-shrink-0" style={{ background: "#0d0703" }}>
        {([
          { key: "VIEW",      icon: "🏘", label: "Vista" },
          { key: "BUILDINGS", icon: "🏗", label: "Edificios" },
          { key: "BARRACKS",  icon: "⚔", label: "Cuartel" },
          { key: "ARMIES",    icon: "🛡", label: "Huestes" },
          { key: "MARKET",    icon: "🪙", label: hasMarket ? "Mercado" : "Mercado 🔒" },
        ] as { key: Tab; icon: string; label: string }[]).map(t => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-display uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
              tab === t.key
                ? "text-gold-bright border-b-4 border-gold bg-[#2c1d10]"
                : "text-parchment-dark hover:text-parchment-aged hover:bg-[#1f1409]"
            }`}
          >
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto relative">

        {/* ╔═══ VISTA — visual village layout ════════════════════╗ */}
        {tab === "VIEW" && (
          <div className="p-4 flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto">

            {/* Visual village canvas */}
            <div className="flex-1 trav-panel overflow-hidden relative" style={{ minHeight: 460 }}>
              <div className="trav-panel-header">
                <span>🏘 Plano de la aldea</span>
                <span className="text-stone-500 text-[10px]">
                  {village.buildings.length} / {Object.keys(BUILDINGS).length} edificios
                </span>
              </div>

              {/* Background landscape */}
              <div
                className="absolute inset-x-0 top-8 bottom-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(ellipse at center, rgba(58,40,24,0.4) 0%, transparent 70%),
                    radial-gradient(circle at 50% 60%, rgba(184,134,47,0.08) 0%, transparent 50%)
                  `,
                }}
              />

              {/* Center: Main Hall */}
              {mainHall && (
                <div className="relative pt-10 pb-4 flex flex-col items-center">
                  <div className="hero-frame">
                    <BuildingSlot
                      type={mainHall.key}
                      level={getBuildingState(mainHall.key).level}
                      inProgress={!!getBuildingState(mainHall.key).inQueue}
                      onClick={() => { setSelectedBuilding(mainHall.key); setTab("BUILDINGS"); }}
                      size={96}
                    />
                  </div>
                </div>
              )}

              {/* Inner ring of buildings */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 px-4 pb-4 relative z-10">
                {otherBuildings.map(def => {
                  const st = getBuildingState(def.key);
                  return (
                    <div key={def.key} className="flex justify-center">
                      <BuildingSlot
                        type={def.key}
                        level={st.level}
                        inProgress={!!st.inQueue}
                        onClick={() => { setSelectedBuilding(def.key); setTab("BUILDINGS"); }}
                        size={64}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side panel: village summary */}
            <div className="lg:w-80 flex-shrink-0 space-y-3">

              <div className="trav-panel">
                <div className="trav-panel-header">Resumen</div>
                <div className="p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Población</span>
                    <span className="text-parchment-aged font-display">{village.buildings.reduce((s, b) => s + b.level, 0) * 10}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Edificios construidos</span>
                    <span className="text-parchment-aged font-display">{village.buildings.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Cola de construcción</span>
                    <span className="text-amber-400 font-display">{village.buildQueues.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Cola de tropas</span>
                    <span className="text-red-400 font-display">{village.trainQueues.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Murallas</span>
                    <span className="text-stone-300 font-display">Nv.{village.wallLevel ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Production rates */}
              <div className="trav-panel">
                <div className="trav-panel-header">Producción / hora</div>
                <div className="p-3 space-y-1.5 text-xs">
                  {[
                    { icon: "🌲", label: "Madera", val: village.woodRate, color: "#4ade80" },
                    { icon: "⛏", label: "Piedra", val: village.stoneRate, color: "#94a3b8" },
                    { icon: "⚒", label: "Hierro", val: village.ironRate, color: "#fb923c" },
                    { icon: "🌾", label: "Grano", val: village.grainRate, color: "#facc15" },
                  ].map(p => (
                    <div key={p.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-stone-400">
                        <span>{p.icon}</span> {p.label}
                      </span>
                      <span className="font-display font-bold" style={{ color: p.color }}>+{p.val}/h</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Production chain */}
              <div className="trav-panel">
                <div className="trav-panel-header">Cadena de producción</div>
                <div className="p-3 space-y-1.5 text-[11px] text-stone-500 leading-relaxed">
                  <p>Los campos producen <strong className="text-amber-300">paja</strong> (40% del ratio de grano) automáticamente.</p>
                  <p>El exceso de paja se convierte en <strong className="text-red-300">adobe</strong>, material básico de construcción.</p>
                  <p>La <strong className="text-sky-300">plata</strong> se gasta en el Mercado para comprar recursos.</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ╔═══ EDIFICIOS — building grid + selected detail ══════╗ */}
        {tab === "BUILDINGS" && (
          <div className="p-4 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Grid of buildings */}
            <div className="lg:col-span-2 trav-panel">
              <div className="trav-panel-header">
                <span>🏗 Edificios disponibles</span>
                <span className="text-stone-500 text-[10px]">{village.buildings.length} / {Object.keys(BUILDINGS).length}</span>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.values(BUILDINGS).map(def => {
                  const st = getBuildingState(def.key);
                  const isSelected = selectedBuilding === def.key;
                  const colorRing = BUILDING_COLORS[def.key]?.ring ?? "#8b5a2b";
                  return (
                    <button
                      key={def.key}
                      onClick={() => setSelectedBuilding(def.key)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded transition-all ${
                        isSelected ? "bg-amber-950/40 ring-2" : "hover:bg-stone-900/50"
                      }`}
                      style={isSelected ? { boxShadow: `0 0 12px ${colorRing}88` } : undefined}
                    >
                      <BuildingSlot
                        type={def.key}
                        level={st.level}
                        inProgress={!!st.inQueue}
                        size={56}
                      />
                      <div className="text-center">
                        <p className="text-[10px] text-parchment-aged truncate max-w-[80px]">{def.name}</p>
                        {st.inQueue && (
                          <p className="text-[9px] text-amber-400 font-display">{timeLeft(st.inQueue.endsAt)}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            <div className="trav-panel self-start">
              <div className="trav-panel-header">
                {selDef ? selDef.name : "Detalle"}
              </div>
              <div className="p-3 space-y-3">
                {!selDef && (
                  <p className="text-xs text-stone-500 italic text-center py-6">
                    Selecciona un edificio para ver detalles, costes y construir.
                  </p>
                )}
                {selDef && selState && (
                  <>
                    <div className="flex items-center gap-3">
                      <BuildingSlot
                        type={selDef.key}
                        level={selState.level}
                        inProgress={!!selState.inQueue}
                        size={72}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-stone-500 uppercase tracking-wider">Nivel</p>
                        <p className="font-display text-2xl text-gold-bright">{selState.level} <span className="text-stone-600 text-sm">/ {selDef.maxLevel}</span></p>
                        <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden border border-bronze/30 mt-1">
                          <div className="h-full bg-gradient-to-r from-amber-700 to-amber-400 rounded-full" style={{ width: `${(selState.level / selDef.maxLevel) * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-400 italic leading-relaxed">{selDef.description}</p>

                    {selState.inQueue ? (
                      <div className="border border-amber-800/40 bg-amber-950/30 rounded p-2 text-center">
                        <p className="text-[10px] text-stone-500 uppercase">Construyendo</p>
                        <p className="font-display text-amber-300 text-base">Nv.{selState.inQueue.targetLevel}</p>
                        <p className="font-display text-amber-400 text-sm font-bold">{timeLeft(selState.inQueue.endsAt)}</p>
                      </div>
                    ) : selState.level < selDef.maxLevel && selLvlDef ? (
                      <>
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-stone-500 uppercase tracking-wider">Coste para Nv.{selState.level + 1}</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { k: "wood",   icon: "🌲", v: selLvlDef.cost.wood   },
                              { k: "stone",  icon: "⛏", v: selLvlDef.cost.stone  },
                              { k: "iron",   icon: "⚒", v: selLvlDef.cost.iron   },
                              { k: "adobe",  icon: "🧱", v: selLvlDef.cost.adobe  },
                              { k: "silver", icon: "🪙", v: selLvlDef.cost.silver },
                            ].filter(c => c.v > 0).map(c => {
                              const have = res[c.k as keyof typeof res] ?? 0;
                              const ok = have >= c.v;
                              return (
                                <div key={c.k} className={`flex items-center justify-between text-xs px-2 py-1 rounded border ${ok ? "border-emerald-700/40 bg-emerald-950/20" : "border-red-700/40 bg-red-950/20"}`}>
                                  <span>{c.icon}</span>
                                  <span className={`font-display font-bold ${ok ? "text-emerald-300" : "text-red-300"}`}>
                                    {c.v}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-stone-500 text-center">⏳ {Math.ceil(selLvlDef.time / 60)} min</p>
                        </div>
                        <button
                          onClick={() => doAction("BUILD", { buildingType: selDef.key })}
                          disabled={!canAffordSel}
                          className={`w-full btn-medieval text-sm py-2 ${!canAffordSel ? "opacity-40" : ""}`}
                        >
                          {selState.level === 0 ? "🏗 Construir" : `⬆ Mejorar a Nv.${selState.level + 1}`}
                        </button>
                      </>
                    ) : (
                      <p className="text-center text-emerald-400 font-display text-sm py-2">✓ Nivel máximo alcanzado</p>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ╔═══ CUARTEL ════════════════════════════════════════════╗ */}
        {tab === "BARRACKS" && (
          <div className="p-4 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TROOPS_BY_FACTION[faction].map(key => {
                const troop = TROOPS[key];
                if (!troop) return null;
                const totalCost = (n: number) => Object.entries(troop.cost).filter(([, v]) => v > 0)
                  .map(([k, v]) => ({ k, v: v * n }));
                return (
                  <div key={key} className="trav-panel">
                    <div className="p-3 flex gap-3">
                      <div className="flex-shrink-0">
                        <TroopPortrait troopType={key} size="lg" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-display text-parchment-aged text-sm leading-tight">{troop.name}</h3>
                            <span className="stat-badge">{troop.role}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-stone-500 italic line-clamp-2">{troop.description}</p>
                        <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                          <div className="bg-red-950/30 border border-red-800/30 rounded px-1 py-0.5">
                            <p className="text-stone-500 text-[9px]">ATK</p>
                            <p className="text-red-300 font-display font-bold">{troop.attack}</p>
                          </div>
                          <div className="bg-blue-950/30 border border-blue-800/30 rounded px-1 py-0.5">
                            <p className="text-stone-500 text-[9px]">DEF</p>
                            <p className="text-blue-300 font-display font-bold">{troop.defense}</p>
                          </div>
                          <div className="bg-cyan-950/30 border border-cyan-800/30 rounded px-1 py-0.5">
                            <p className="text-stone-500 text-[9px]">VEL</p>
                            <p className="text-cyan-300 font-display font-bold">{troop.speed}</p>
                          </div>
                          <div className="bg-amber-950/30 border border-amber-800/30 rounded px-1 py-0.5">
                            <p className="text-stone-500 text-[9px]">⏳</p>
                            <p className="text-amber-300 font-display font-bold">{troop.trainTime}s</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {Object.entries(troop.cost).filter(([, v]) => v > 0).map(([k, v]) => {
                            const icons: Record<string, string> = { wood: "🌲", stone: "⛏", iron: "⚒", grain: "🌾", silver: "🪙" };
                            const current = res[k as keyof typeof res] ?? 0;
                            const ok = current >= v;
                            return (
                              <span key={k} className={`px-1.5 py-0.5 rounded border ${ok ? "border-emerald-700/40 text-emerald-300 bg-emerald-950/20" : "border-red-700/40 text-red-300 bg-red-950/20"}`}>
                                {icons[k] ?? k} {v}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex gap-1 pt-1">
                          {[1, 5, 10, 50].map(n => {
                            const costs = totalCost(n);
                            const canAfford = costs.every(({ k, v }) => (res[k as keyof typeof res] ?? 0) >= v);
                            return (
                              <button
                                key={n}
                                onClick={() => doAction("TRAIN", { troopType: key, count: n })}
                                disabled={!canAfford}
                                className={`flex-1 text-[10px] py-1 rounded border font-display transition-all ${
                                  canAfford
                                    ? "border-amber-700/50 text-amber-200 bg-amber-950/30 hover:bg-amber-900/50"
                                    : "border-stone-800/40 text-stone-600 bg-stone-950/30 cursor-not-allowed"
                                }`}
                              >
                                +{n}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ╔═══ HUESTES ════════════════════════════════════════════╗ */}
        {tab === "ARMIES" && (
          <div className="p-4 max-w-5xl mx-auto space-y-3">
            {armies.length === 0 && (
              <div className="trav-panel">
                <div className="p-8 text-center space-y-2">
                  <div className="text-5xl">⚔</div>
                  <p className="font-display text-parchment-aged">No hay huestes en esta aldea.</p>
                  <p className="text-stone-500 text-sm">Recluta tropas en el Cuartel; aparecerán aquí al terminar.</p>
                </div>
              </div>
            )}
            {armies.map(army => (
              <div key={army.id} className="trav-panel">
                <div className="trav-panel-header">
                  <span className={army.owner === "PLAYER" ? "text-gold-bright" : "text-blood-bright"}>
                    {army.owner === "PLAYER" ? "⚔ Tu hueste" : "☠ Hueste enemiga"}
                  </span>
                  <div className="flex items-center gap-2">
                    {army.isMoving && <span className="stat-badge text-blue-300">🚶 En marcha</span>}
                    {army.isResting && <span className="stat-badge text-emerald-300">💤 Descansando</span>}
                    {army.isForaging && <span className="stat-badge text-yellow-300">🌾 Forrajeando</span>}
                  </div>
                </div>
                <div className="p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 text-xs">Estamina</span>
                    <div className="flex-1 bg-stone-900 rounded-full h-2 overflow-hidden border border-bronze/20">
                      <div
                        className={`h-full rounded-full ${army.stamina > 60 ? "bg-emerald-500" : army.stamina > 30 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${army.stamina}%` }}
                      />
                    </div>
                    <span className="text-xs text-parchment-aged font-display">{army.stamina}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {army.troops.map(t => (
                      <div key={t.type} className="flex items-center gap-2 bg-stone-950/50 border border-bronze/20 rounded p-2">
                        <TroopPortrait troopType={t.type} size="sm" count={t.count} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-parchment-aged truncate">{TROOPS[t.type]?.name ?? t.type}</p>
                          {TROOPS[t.type] && (
                            <p className="text-[9px] text-stone-500">⚔{TROOPS[t.type].attack} 🛡{TROOPS[t.type].defense}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ╔═══ MERCADO ════════════════════════════════════════════╗ */}
        {tab === "MARKET" && (
          <div className="p-4 max-w-4xl mx-auto space-y-3">
            {!hasMarket ? (
              <div className="trav-panel">
                <div className="p-8 text-center space-y-3">
                  <div className="text-5xl">🔒</div>
                  <h2 className="font-display title-gold text-xl">Mercado no construido</h2>
                  <p className="text-stone-500 text-sm">Construye un <strong className="text-gold-bright">Mercado</strong> en la pestaña de Edificios para comerciar.</p>
                  <button onClick={() => setTab("BUILDINGS")} className="btn-medieval">🏗 Ir a edificios</button>
                </div>
              </div>
            ) : (
              <>
                <div className="trav-panel">
                  <div className="trav-panel-header">🪙 Mercado de Nahkor</div>
                  <div className="p-3 flex items-center justify-between">
                    <p className="text-stone-500 text-xs">Compra recursos con plata a precio fijo de gremios.</p>
                    <div className="text-right">
                      <p className="text-[10px] text-stone-500 uppercase">Plata</p>
                      <p className="font-display text-2xl text-sky-300" style={{ textShadow: "0 0 8px rgba(125,211,252,0.4)" }}>{village.silver}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(TRADE_RATES).map(([resource, rate]) => {
                    const current = res[resource as keyof typeof res] ?? 0;
                    return (
                      <div key={resource} className="trav-panel">
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded bg-stone-900/60 border border-bronze/40 flex items-center justify-center text-xl">
                                {rate.icon}
                              </div>
                              <div>
                                <h3 className="font-display text-parchment-aged">{rate.label}</h3>
                                <p className="text-[10px] text-stone-500">{rate.silverCost} 🪙 / unidad</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-stone-500">Tienes</p>
                              <p className="font-display text-gold-bright font-bold">{current}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {TRADE_AMOUNTS.map(amt => {
                              const cost = rate.silverCost * amt;
                              const canBuy = village.silver >= cost;
                              return (
                                <button
                                  key={amt}
                                  onClick={() => doAction("TRADE", { resource, amount: amt })}
                                  disabled={!canBuy}
                                  className={`text-[10px] py-1 rounded border font-display transition-all ${
                                    canBuy
                                      ? "border-amber-700/50 text-amber-200 bg-amber-950/30 hover:bg-amber-900/50"
                                      : "border-stone-800/40 text-stone-600 bg-stone-950/30 cursor-not-allowed"
                                  }`}
                                >
                                  +{amt}
                                  <span className="block text-[9px] text-stone-500">{cost}🪙</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
