"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { BUILDINGS } from "@/lib/game/constants/buildings";
import { TROOPS, TROOPS_BY_FACTION } from "@/lib/game/constants/troops";
import type { Faction } from "@/lib/game/constants/troops";
import { TroopPortrait } from "@/components/Portrait";

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

type Tab = "RESOURCES" | "BUILDINGS" | "BARRACKS" | "ARMIES" | "MARKET";

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
  const [tab, setTab] = useState<Tab>("RESOURCES");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  // clock drives real-time countdown re-renders
  const [, setClock] = useState(Date.now());
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");

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

  const RESOURCES_DISPLAY = [
    { key: "wood",   label: "Madera",  rate: village.woodRate,  cap: village.warehouseCap, color: "text-emerald-500", icon: "🌲" },
    { key: "stone",  label: "Piedra",  rate: village.stoneRate, cap: village.warehouseCap, color: "text-stone-300",   icon: "⛏" },
    { key: "iron",   label: "Hierro",  rate: village.ironRate,  cap: village.warehouseCap, color: "text-orange-400",  icon: "⚒" },
    { key: "grain",  label: "Grano",   rate: village.grainRate, cap: village.granaryCap,   color: "text-yellow-400",  icon: "🌾" },
    { key: "straw",  label: "Paja",    rate: Math.floor(village.grainRate * 0.4), cap: village.granaryCap, color: "text-amber-300", icon: "🪶" },
    { key: "adobe",  label: "Adobe",   rate: 0, cap: village.warehouseCap, color: "text-red-300",    icon: "🧱" },
    { key: "silver", label: "Plata",   rate: 0, cap: village.warehouseCap, color: "text-sky-300",    icon: "🪙" },
    { key: "gold",   label: "Oro",     rate: 0, cap: village.warehouseCap, color: "text-gold-bright",icon: "💰" },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col">

      {/* HEADER */}
      <header className="banner px-4 py-2 flex items-center justify-between border-b-2 border-bronze flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/game/${id}`} className="text-parchment-aged hover:text-gold-bright text-sm italic">← Mapa</Link>
          <span className="text-xl">🏰</span>
          {renaming ? (
            <div className="flex items-center gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                className="bg-wood border border-bronze text-parchment px-2 py-0.5 font-display text-sm rounded-sm w-40"
                onKeyDown={e => { if (e.key === "Enter") rename(); if (e.key === "Escape") setRenaming(false); }}
                autoFocus />
              <button onClick={rename} className="text-xs btn-medieval py-0.5 px-2">✓</button>
              <button onClick={() => setRenaming(false)} className="text-xs text-parchment-aged hover:text-parchment">✕</button>
            </div>
          ) : (
            <button onClick={() => { setNewName(village.name); setRenaming(true); }}
              className="font-display title-gold text-lg hover:opacity-80 text-left">
              {village.name} <span className="text-bronze text-xs">✎</span>
            </button>
          )}
          <span className="text-xs text-parchment-aged italic">{faction}</span>
        </div>
        {msg && (
          <p className={`text-sm italic ${msg.ok ? "text-gold-bright" : "text-blood-bright"}`}>{msg.text}</p>
        )}
      </header>

      {/* RESOURCE BAR */}
      <div className="bg-[#1e100a] border-b-2 border-bronze/60 px-4 py-2 flex flex-wrap gap-4">
        {RESOURCES_DISPLAY.map(r => {
          const value = res[r.key as keyof typeof res];
          const pct = Math.min(100, (value / r.cap) * 100);
          return (
            <div key={r.key} className="flex items-center gap-1.5">
              <span className="text-lg">{r.icon}</span>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className={`font-display font-bold ${r.color}`}>{value}</span>
                  {r.rate > 0 && <span className="text-[10px] text-parchment-dark">+{r.rate}</span>}
                </div>
                <div className="w-14 bg-stone-800 rounded-full h-1 mt-0.5">
                  <div className={`h-1 rounded-full transition-all ${pct > 90 ? "bg-red-500" : "bg-bronze"}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUEUE STRIP — real-time countdowns */}
      {(village.buildQueues.length > 0 || village.trainQueues.length > 0) && (
        <div className="bg-[#241710] border-b border-bronze/40 px-4 py-1.5 flex gap-4 flex-wrap text-xs">
          {village.buildQueues.map(q => (
            <span key={q.id} className="flex items-center gap-1.5 text-gold-pale">
              🏗 <span className="font-display">{BUILDINGS[q.buildingType as keyof typeof BUILDINGS]?.name ?? q.buildingType} Nv.{q.targetLevel}</span>
              <span className="text-parchment-dark font-bold">{timeLeft(q.endsAt)}</span>
            </span>
          ))}
          {village.trainQueues.map(q => (
            <span key={q.id} className="flex items-center gap-1.5 text-parchment-aged">
              ⚔ <span className="font-display">{TROOPS[q.troopType]?.name ?? q.troopType} ×{q.count}</span>
              <span className="text-parchment-dark font-bold">{timeLeft(q.endsAt)}</span>
            </span>
          ))}
        </div>
      )}

      {/* TABS */}
      <div className="border-b-2 border-bronze flex overflow-x-auto flex-shrink-0">
        {(["RESOURCES", "BUILDINGS", "BARRACKS", "ARMIES", "MARKET"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-display uppercase tracking-wider whitespace-nowrap transition-colors flex-shrink-0 ${
              tab === t ? "text-gold-bright border-b-4 border-gold bg-[#2c1d10]" : "text-parchment-aged hover:text-parchment"
            }`}>
            {t === "RESOURCES" ? "📜 Recursos"
              : t === "BUILDINGS" ? "🏗 Edificios"
              : t === "BARRACKS" ? "⚔ Cuartel"
              : t === "ARMIES" ? "🛡 Huestes"
              : `🪙 Mercado${!hasMarket ? " 🔒" : ""}`}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full">

        {/* ── RESOURCES ── */}
        {tab === "RESOURCES" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RESOURCES_DISPLAY.map(r => {
                const value = res[r.key as keyof typeof res];
                const pct = Math.min(100, (value / r.cap) * 100);
                return (
                  <div key={r.key} className="parchment p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{r.icon}</span>
                      <p className={`text-3xl font-bold font-display ${r.color}`}>{value}</p>
                    </div>
                    <p className="text-sm text-ink-soft">{r.label}</p>
                    <div className="w-full bg-stone-300/20 rounded-full h-1.5 mt-2">
                      <div className={`h-1.5 rounded-full transition-all ${pct > 90 ? "bg-red-600" : "bg-bronze"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-ink-soft mt-1">{value}/{r.cap}{r.rate > 0 ? ` (+${r.rate}/tick)` : ""}</p>
                  </div>
                );
              })}
            </div>
            <div className="parchment p-4 space-y-1.5 text-sm">
              <h3 className="font-display text-ink">📜 Cadena de producción</h3>
              <p className="text-ink-soft">Los campos producen <strong>paja</strong> (40% del ratio de grano) automáticamente.</p>
              <p className="text-ink-soft">El exceso de paja se convierte lentamente en <strong>adobe</strong>, material de construcción básico.</p>
              <p className="text-ink-soft">La <strong>plata</strong> puede gastarse en el Mercado para comprar cualquier recurso.</p>
            </div>
          </div>
        )}

        {/* ── BUILDINGS ── */}
        {tab === "BUILDINGS" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(BUILDINGS).map(def => {
              const existing = village.buildings.find(b => b.type === def.key);
              const level = existing?.level ?? 0;
              const inQueue = village.buildQueues.find(q => q.buildingType === def.key);
              const lvlDef = level < def.maxLevel ? def.levels[level] : null;
              const canAfford = lvlDef
                ? res.wood >= (lvlDef.cost.wood || 0) && res.stone >= (lvlDef.cost.stone || 0)
                  && res.iron >= (lvlDef.cost.iron || 0) && res.adobe >= (lvlDef.cost.adobe || 0)
                  && res.silver >= (lvlDef.cost.silver || 0)
                : false;

              return (
                <div key={def.key} className="parchment p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-ink text-sm">{def.name}</h3>
                        {level > 0 && (
                          <span className="text-[10px] bg-bronze/30 border border-bronze/50 text-gold-pale px-1.5 rounded-sm font-display flex-shrink-0">
                            Nv.{level}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-stone-300/20 rounded-full h-1 mt-1">
                        <div className="h-1 rounded-full bg-bronze" style={{ width: `${(level / def.maxLevel) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {inQueue ? (
                        <div className="text-center">
                          <span className="text-xs text-blood font-bold font-display">{timeLeft(inQueue.endsAt)}</span>
                          <p className="text-[9px] text-parchment-dark">construyendo Nv.{inQueue.targetLevel}</p>
                        </div>
                      ) : level < def.maxLevel ? (
                        <button onClick={() => doAction("BUILD", { buildingType: def.key })}
                          disabled={!canAfford} className="btn-medieval text-xs py-1 px-2">
                          {canAfford ? "Construir" : "Sin recursos"}
                        </button>
                      ) : (
                        <span className="text-xs text-gold-bright font-display">✓ Máx</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-ink-soft italic">{def.description}</p>
                  {lvlDef && !inQueue && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {lvlDef.cost.adobe  > 0 && <span className={res.adobe  >= lvlDef.cost.adobe  ? "text-emerald-600" : "text-blood"}>🧱 {lvlDef.cost.adobe}</span>}
                      {lvlDef.cost.wood   > 0 && <span className={res.wood   >= lvlDef.cost.wood   ? "text-emerald-600" : "text-blood"}>🌲 {lvlDef.cost.wood}</span>}
                      {lvlDef.cost.stone  > 0 && <span className={res.stone  >= lvlDef.cost.stone  ? "text-emerald-600" : "text-blood"}>⛏ {lvlDef.cost.stone}</span>}
                      {lvlDef.cost.iron   > 0 && <span className={res.iron   >= lvlDef.cost.iron   ? "text-emerald-600" : "text-blood"}>⚒ {lvlDef.cost.iron}</span>}
                      {lvlDef.cost.silver > 0 && <span className={res.silver >= lvlDef.cost.silver ? "text-emerald-600" : "text-blood"}>🪙 {lvlDef.cost.silver}</span>}
                      <span className="text-parchment-dark">⏳ {Math.floor(lvlDef.time / 60)}m</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── BARRACKS ── */}
        {tab === "BARRACKS" && (
          <div className="space-y-3">
            {TROOPS_BY_FACTION[faction].map(key => {
              const troop = TROOPS[key];
              if (!troop) return null;
              const roleColor = {
                OFF:     "text-blood-bright bg-blood/10 border-blood/30",
                DEF:     "text-blue-300 bg-blue-950/20 border-blue-800/30",
                SPY:     "text-purple-400 bg-purple-950/20 border-purple-800/30",
                SIEGE:   "text-orange-400 bg-orange-950/20 border-orange-800/30",
                SPECIAL: "text-gold bg-amber-950/20 border-amber-700/30",
              }[troop.role];

              return (
                <div key={key} className="parchment p-3">
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0">
                      <TroopPortrait troopType={key} size="lg" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-display text-ink text-sm leading-tight">{troop.name}</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-sm px-1 ${roleColor}`}>
                            {troop.role}
                          </span>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {[1, 5, 10, 50].map(n => (
                            <button key={n}
                              onClick={() => doAction("TRAIN", { troopType: key, count: n })}
                              className="text-[10px] px-2 py-0.5 btn-medieval whitespace-nowrap">
                              +{n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-ink-soft italic mb-1 line-clamp-2">{troop.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-ink-soft font-display mb-1">
                        <span title="Ataque">⚔ {troop.attack}</span>
                        <span title="Defensa">🛡 {troop.defense}</span>
                        <span title="Velocidad">💨 {troop.speed}</span>
                        <span title="Grano/tick">🌾 {troop.grainCost}</span>
                        <span title="Tiempo por unidad">⏳ {troop.trainTime}s</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {Object.entries(troop.cost).filter(([, v]) => v > 0).map(([k, v]) => {
                          const icons: Record<string, string> = { wood:"🌲", stone:"⛏", iron:"⚒", grain:"🌾", silver:"🪙" };
                          const current = res[k as keyof typeof res] ?? 0;
                          return (
                            <span key={k} className={current >= v ? "text-emerald-400" : "text-blood"}>
                              {icons[k] ?? k} {v}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ARMIES ── */}
        {tab === "ARMIES" && (
          <div className="space-y-3">
            {armies.length === 0 && (
              <div className="parchment p-8 text-center space-y-2">
                <p className="text-ink italic">No hay huestes en esta aldea.</p>
                <p className="text-ink-soft text-sm">Recluta tropas en el Cuartel; aparecerán aquí al terminar.</p>
              </div>
            )}
            {armies.map(army => (
              <div key={army.id} className="parchment-dark p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-display ${army.owner === "PLAYER" ? "text-gold-bright" : "text-blood-bright"}`}>
                    {army.owner === "PLAYER" ? "⚔ Tu hueste" : "☠ Hueste enemiga"}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-parchment-aged">
                    <div className="flex items-center gap-1">
                      <div className="w-16 bg-stone-900 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${army.stamina > 60 ? "bg-emerald-500" : army.stamina > 30 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${army.stamina}%` }} />
                      </div>
                      <span>{army.stamina}%</span>
                    </div>
                    {army.isMoving   && <span className="text-blue-300">🚶 En marcha</span>}
                    {army.isResting  && <span className="text-emerald-300">💤 Descansando</span>}
                    {army.isForaging && <span className="text-yellow-300">🌾 Forrajeando</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {army.troops.map(t => {
                    const def = TROOPS[t.type];
                    return (
                      <div key={t.type} className="stat-box text-xs">
                        <p className="font-display text-parchment">{def?.name ?? t.type}</p>
                        <p className="text-gold-pale text-lg font-bold font-display">{t.count}</p>
                        {def && <p className="text-parchment-dark">⚔{def.attack} 🛡{def.defense}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MARKET ── */}
        {tab === "MARKET" && (
          <div className="space-y-4">
            {!hasMarket ? (
              <div className="parchment p-8 text-center space-y-3">
                <div className="text-5xl">🔒</div>
                <h2 className="font-display text-ink text-xl">Mercado no construido</h2>
                <p className="text-ink-soft text-sm">Construye un <strong>Mercado</strong> en la pestaña de Edificios para poder comerciar.</p>
                <button onClick={() => setTab("BUILDINGS")} className="btn-medieval">🏗 Ir a edificios</button>
              </div>
            ) : (
              <>
                <div className="parchment p-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-ink text-lg">🪙 Mercado</h2>
                    <p className="text-ink-soft text-sm">Compra recursos con plata a precio fijo.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-soft">Plata disponible</p>
                    <p className="font-display text-2xl text-sky-300">{village.silver}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(TRADE_RATES).map(([resource, rate]) => {
                    const current = res[resource as keyof typeof res] ?? 0;
                    return (
                      <div key={resource} className="parchment p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{rate.icon}</span>
                            <div>
                              <h3 className="font-display text-ink">{rate.label}</h3>
                              <p className="text-xs text-ink-soft">{rate.silverCost} 🪙 por unidad</p>
                            </div>
                          </div>
                          <span className="text-xs text-parchment-aged">Actual: <strong className="text-gold-bright">{current}</strong></span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {TRADE_AMOUNTS.map(amt => {
                            const cost = rate.silverCost * amt;
                            const canBuy = village.silver >= cost;
                            return (
                              <button key={amt}
                                onClick={() => doAction("TRADE", { resource, amount: amt })}
                                disabled={!canBuy}
                                className={`btn-medieval text-xs py-1 px-2 ${!canBuy ? "opacity-40" : ""}`}>
                                +{amt} <span className="opacity-60 ml-1">({cost}🪙)</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="parchment p-4 text-sm text-ink-soft space-y-1">
                  <h3 className="font-display text-ink">📜 Nota del mercader</h3>
                  <p>Precios fijos establecidos por los gremios medievales. El hierro vale el doble por su escasez.</p>
                  <p>La plata se acumula lentamente; el oro es moneda de élite para diplomacia futura.</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
