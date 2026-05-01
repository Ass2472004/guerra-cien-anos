"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { BUILDINGS } from "@/lib/game/constants/buildings";
import { TROOPS, TROOPS_BY_FACTION } from "@/lib/game/constants/troops";
import type { Faction } from "@/lib/game/constants/troops";

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

type Tab = "RESOURCES" | "BUILDINGS" | "BARRACKS" | "ARMIES";

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Listo";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}m ${s}s`;
}

export default function VillagePage({ params }: { params: Promise<{ id: string; vid: string }> }) {
  const { id, vid } = use(params);
  const [data, setData] = useState<{ village: VillageData; armies: ArmyData[] } | null>(null);
  const [tab, setTab] = useState<Tab>("RESOURCES");
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch(`/api/game/${id}/village/${vid}`);
    if (res.ok) setData(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function doAction(action: string, payload: object) {
    const res = await fetch(`/api/game/${id}/village/${vid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const d = await res.json();
    setMsg(d.error ?? d.message ?? (d.ok ? "Hecho." : "Error"));
    if (d.ok) load();
    setTimeout(() => setMsg(""), 3000);
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-stone-950 text-amber-400">Cargando aldea…</div>;
  const { village, armies } = data;
  const faction = (village.faction ?? "ENGLAND") as Faction;

  const res = { wood: village.wood, stone: village.stone, iron: village.iron, grain: village.grain, straw: village.straw, adobe: village.adobe, silver: village.silver };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/game/${id}`} className="text-stone-400 hover:text-amber-400 transition-colors">← Mapa</Link>
          <h1 className="font-bold text-amber-400 text-lg">{village.name}</h1>
          <span className="text-xs text-stone-500">{faction}</span>
        </div>
        {msg && <p className="text-sm text-amber-400">{msg}</p>}
      </header>

      {/* Resource bar */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-2 flex flex-wrap gap-4 text-sm">
        {([
          { key: "wood",   label: "Madera",   rate: village.woodRate,  cap: village.warehouseCap, color: "text-green-400" },
          { key: "stone",  label: "Piedra",   rate: village.stoneRate, cap: village.warehouseCap, color: "text-slate-400" },
          { key: "iron",   label: "Hierro",   rate: village.ironRate,  cap: village.warehouseCap, color: "text-orange-400" },
          { key: "grain",  label: "Grano",    rate: village.grainRate, cap: village.granaryCap,   color: "text-yellow-400" },
          { key: "straw",  label: "Paja",     rate: Math.floor(village.grainRate * 0.4), cap: village.granaryCap, color: "text-amber-300" },
          { key: "adobe",  label: "Adobe",    rate: 0, cap: village.warehouseCap, color: "text-red-300" },
          { key: "silver", label: "Plata",    rate: 0, cap: village.warehouseCap, color: "text-sky-300" },
        ] as const).map(r => (
          <div key={r.key} className={`${r.color} flex flex-col items-center`}>
            <span className="font-semibold">{res[r.key as keyof typeof res]}</span>
            <span className="text-xs text-stone-500">{r.label} {r.rate > 0 ? `+${r.rate}/t` : ""}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-800 flex">
        {(["RESOURCES","BUILDINGS","BARRACKS","ARMIES"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${tab === t ? "text-amber-400 border-b-2 border-amber-400" : "text-stone-400 hover:text-stone-200"}`}
          >
            {t === "RESOURCES" ? "Recursos" : t === "BUILDINGS" ? "Edificios" : t === "BARRACKS" ? "Cuartel" : "Ejércitos"}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {/* BUILDINGS TAB */}
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
                : false;

              return (
                <div key={def.key} className="bg-stone-900 rounded-lg p-4 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-100">{def.name}</h3>
                      <p className="text-xs text-stone-500">Nivel {level}/{def.maxLevel}</p>
                    </div>
                    {level < def.maxLevel && !inQueue && (
                      <button
                        onClick={() => doAction("BUILD", { buildingType: def.key })}
                        disabled={!canAfford}
                        className="px-3 py-1 text-xs rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Construir
                      </button>
                    )}
                    {inQueue && (
                      <span className="text-xs text-amber-400">{timeLeft(inQueue.endsAt)}</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">{def.description}</p>
                  {lvlDef && (
                    <p className="text-xs text-stone-500">
                      Coste: {[
                        lvlDef.cost.adobe  > 0 && `${lvlDef.cost.adobe} Adobe`,
                        lvlDef.cost.wood   > 0 && `${lvlDef.cost.wood} Madera`,
                        lvlDef.cost.stone  > 0 && `${lvlDef.cost.stone} Piedra`,
                        lvlDef.cost.iron   > 0 && `${lvlDef.cost.iron} Hierro`,
                        lvlDef.cost.silver > 0 && `${lvlDef.cost.silver} Plata`,
                      ].filter(Boolean).join(" · ")}
                      {" · "}{Math.floor(lvlDef.time / 60)}m
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* BARRACKS TAB */}
        {tab === "BARRACKS" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TROOPS_BY_FACTION[faction].map(key => {
              const troop = TROOPS[key];
              if (!troop) return null;
              const roleColor = { OFF: "text-red-400", DEF: "text-blue-400", SPY: "text-purple-400", SIEGE: "text-orange-400", SPECIAL: "text-amber-400" }[troop.role];
              return (
                <div key={key} className="bg-stone-900 rounded-lg p-4 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-100">{troop.name}</h3>
                      <span className={`text-xs font-medium ${roleColor}`}>{troop.role}</span>
                    </div>
                    <button
                      onClick={() => doAction("TRAIN", { troopType: key, count: 10 })}
                      className="px-3 py-1 text-xs rounded bg-stone-700 hover:bg-stone-600 transition-colors"
                    >
                      +10
                    </button>
                  </div>
                  <p className="text-xs text-stone-400">{troop.description}</p>
                  <div className="flex gap-3 text-xs text-stone-500">
                    <span>⚔ {troop.attack}</span>
                    <span>🛡 {troop.defense}</span>
                    <span>💨 {troop.speed}</span>
                    <span>🌾 {troop.grainCost}/t</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    {Object.entries(troop.cost).filter(([,v]) => v > 0).map(([k,v]) => `${v} ${k}`).join(" · ")}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ARMIES TAB */}
        {tab === "ARMIES" && (
          <div className="space-y-3">
            {armies.length === 0 && <p className="text-stone-500">No hay ejércitos en esta aldea.</p>}
            {armies.map(army => (
              <div key={army.id} className="bg-stone-900 rounded-lg p-4 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${army.owner === "PLAYER" ? "text-amber-400" : "text-red-400"}`}>
                    {army.owner === "PLAYER" ? "Tu ejército" : "Ejército rival"}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <span>Stamina: {army.stamina}%</span>
                    {army.isMoving   && <span className="text-blue-400">En marcha</span>}
                    {army.isResting  && <span className="text-green-400">Descansando</span>}
                    {army.isForaging && <span className="text-yellow-400">Forrajeando</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {army.troops.map(t => {
                    const def = TROOPS[t.type];
                    const roleColor = { OFF: "text-red-300", DEF: "text-blue-300", SPY: "text-purple-300", SIEGE: "text-orange-300", SPECIAL: "text-amber-300" }[def?.role ?? "OFF"];
                    return (
                      <div key={t.type} className="bg-stone-800 rounded p-2 text-xs">
                        <p className="font-medium text-stone-200">{def?.name ?? t.type}</p>
                        <p className={`${roleColor}`}>{t.count} unidades</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESOURCES TAB */}
        {tab === "RESOURCES" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Madera", value: village.wood, rate: village.woodRate, cap: village.warehouseCap, color: "text-green-400" },
                { label: "Piedra", value: village.stone, rate: village.stoneRate, cap: village.warehouseCap, color: "text-slate-400" },
                { label: "Hierro", value: village.iron, rate: village.ironRate, cap: village.warehouseCap, color: "text-orange-400" },
                { label: "Grano", value: village.grain, rate: village.grainRate, cap: village.granaryCap, color: "text-yellow-400" },
                { label: "Paja", value: village.straw, rate: Math.floor(village.grainRate * 0.4), cap: village.granaryCap, color: "text-amber-300" },
                { label: "Adobe", value: village.adobe, rate: 0, cap: village.warehouseCap, color: "text-red-300" },
                { label: "Plata", value: village.silver, rate: 0, cap: village.warehouseCap, color: "text-sky-300" },
                { label: "Oro", value: village.gold, rate: 0, cap: village.warehouseCap, color: "text-yellow-500" },
              ].map(r => (
                <div key={r.label} className="bg-stone-900 rounded-lg p-4 border border-stone-800">
                  <p className={`text-2xl font-bold ${r.color}`}>{r.value}</p>
                  <p className="text-sm text-stone-400">{r.label}</p>
                  <div className="w-full bg-stone-700 rounded-full h-1 mt-2">
                    <div className={`h-1 rounded-full bg-current ${r.color}`} style={{ width: `${Math.min(100, (r.value / r.cap) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-stone-500 mt-1">{r.value}/{r.cap} {r.rate > 0 ? `(+${r.rate}/t)` : ""}</p>
                </div>
              ))}
            </div>
            <div className="bg-stone-900 rounded-lg p-4 border border-stone-800 text-sm space-y-1">
              <h3 className="text-amber-400 font-semibold">Sistema de recursos</h3>
              <p className="text-stone-400">Los campos de grano producen <span className="text-amber-300">Paja</span> automáticamente (40% del ratio de grano).</p>
              <p className="text-stone-400">La <span className="text-red-300">Paja</span> se convierte lentamente en <span className="text-red-300">Adobe</span> (material básico de construcción).</p>
              <p className="text-stone-400"><span className="text-green-400">Madera</span> + <span className="text-slate-400">Piedra</span> → construcciones avanzadas.</p>
              <p className="text-stone-400"><span className="text-sky-300">Plata</span> y <span className="text-yellow-500">Oro</span> → comercio y diplomacia.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
