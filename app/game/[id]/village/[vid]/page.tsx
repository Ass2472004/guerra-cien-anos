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

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  async function doAction(action: string, payload: object) {
    const res = await fetch(`/api/game/${id}/village/${vid}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const d = await res.json().catch(() => ({}));
    setMsg(d.error ?? d.message ?? (d.ok ? "Hecho." : "Error"));
    if (d.ok) load();
    setTimeout(() => setMsg(""), 3500);
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center title-gold font-display text-2xl">Cargando aldea…</div>;
  const { village, armies } = data;
  const faction = (village.faction ?? "ENGLAND") as Faction;

  const res = { wood: village.wood, stone: village.stone, iron: village.iron, grain: village.grain, straw: village.straw, adobe: village.adobe, silver: village.silver, gold: village.gold };

  return (
    <div className="min-h-screen">
      <header className="banner px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/game/${id}`} className="text-parchment-aged hover:text-gold-bright text-sm italic">← Volver al mapa</Link>
          <span className="text-2xl">🏰</span>
          <h1 className="font-display text-xl title-gold">{village.name}</h1>
          <span className="text-xs text-parchment-aged italic">{faction}</span>
        </div>
        {msg && <p className="text-sm text-gold-bright italic">{msg}</p>}
      </header>

      <div className="bg-[#241710] border-b-2 border-bronze px-4 py-2 flex flex-wrap gap-4 text-sm">
        {([
          { key: "wood",   label: "Madera",  rate: village.woodRate,  color: "text-emerald-400", icon: "🌲" },
          { key: "stone",  label: "Piedra",  rate: village.stoneRate, color: "text-stone-300",   icon: "⛏" },
          { key: "iron",   label: "Hierro",  rate: village.ironRate,  color: "text-orange-400",  icon: "⚒" },
          { key: "grain",  label: "Grano",   rate: village.grainRate, color: "text-yellow-400",  icon: "🌾" },
          { key: "straw",  label: "Paja",    rate: Math.floor(village.grainRate * 0.4), color: "text-amber-300", icon: "🪶" },
          { key: "adobe",  label: "Adobe",   rate: 0, color: "text-red-300",  icon: "🧱" },
          { key: "silver", label: "Plata",   rate: 0, color: "text-sky-300",  icon: "🪙" },
          { key: "gold",   label: "Oro",     rate: 0, color: "text-gold-bright", icon: "💰" },
        ] as const).map(r => (
          <div key={r.key} className="flex items-center gap-1.5">
            <span>{r.icon}</span>
            <div>
              <div className={`font-bold font-display ${r.color}`}>{res[r.key as keyof typeof res]}</div>
              <div className="text-xs text-parchment-dark">{r.label} {r.rate > 0 ? `+${r.rate}` : ""}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b-2 border-bronze flex">
        {(["RESOURCES","BUILDINGS","BARRACKS","ARMIES"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 text-sm font-display uppercase tracking-wider transition-colors ${tab === t ? "text-gold-bright border-b-4 border-gold bg-[#2c1d10]" : "text-parchment-aged hover:text-parchment"}`}
          >
            {t === "RESOURCES" ? "📜 Recursos" : t === "BUILDINGS" ? "🏗 Edificios" : t === "BARRACKS" ? "⚔ Cuartel" : "🛡 Huestes"}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-5xl mx-auto">
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
                <div key={def.key} className="parchment p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-ink text-base">{def.name}</h3>
                      <p className="text-xs text-ink-soft italic">Nivel {level}/{def.maxLevel}</p>
                    </div>
                    {level < def.maxLevel && !inQueue && (
                      <button onClick={() => doAction("BUILD", { buildingType: def.key })} disabled={!canAfford} className="btn-medieval text-xs">
                        Construir
                      </button>
                    )}
                    {inQueue && (
                      <span className="text-xs text-blood font-display">{timeLeft(inQueue.endsAt)}</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft italic">{def.description}</p>
                  {lvlDef && (
                    <p className="text-xs text-ink-soft">
                      {[
                        lvlDef.cost.adobe > 0 && `🧱 ${lvlDef.cost.adobe}`,
                        lvlDef.cost.wood > 0 && `🌲 ${lvlDef.cost.wood}`,
                        lvlDef.cost.stone > 0 && `⛏ ${lvlDef.cost.stone}`,
                        lvlDef.cost.iron > 0 && `⚒ ${lvlDef.cost.iron}`,
                        lvlDef.cost.silver > 0 && `🪙 ${lvlDef.cost.silver}`,
                      ].filter(Boolean).join(" · ")}
                      {" · ⏳ "}{Math.floor(lvlDef.time / 60)}m
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "BARRACKS" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TROOPS_BY_FACTION[faction].map(key => {
              const troop = TROOPS[key];
              if (!troop) return null;
              const roleColor = { OFF: "text-blood-bright", DEF: "text-royal-blue", SPY: "text-purple-700", SIEGE: "text-orange-700", SPECIAL: "text-gold" }[troop.role];
              return (
                <div key={key} className="parchment p-3 flex gap-3 items-start">
                  <img
                    src={`/troops/${key}.png`}
                    alt={troop.name}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    className="w-24 h-24 object-cover rounded-sm border-2 border-bronze flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-ink leading-tight">{troop.name}</h3>
                        <span className={`text-xs font-bold uppercase tracking-wider ${roleColor}`}>{troop.role}</span>
                      </div>
                      <button onClick={() => doAction("TRAIN", { troopType: key, count: 10 })} className="btn-medieval text-xs">
                        +10
                      </button>
                    </div>
                    <p className="text-xs text-ink-soft italic">{troop.description}</p>
                    <div className="flex gap-3 text-xs text-ink-soft font-display">
                      <span>⚔ {troop.attack}</span>
                      <span>🛡 {troop.defense}</span>
                      <span>💨 {troop.speed}</span>
                      <span>🌾 {troop.grainCost}</span>
                    </div>
                    <p className="text-xs text-ink-soft">
                      {Object.entries(troop.cost).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k}`).join(" · ")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "ARMIES" && (
          <div className="space-y-3">
            {armies.length === 0 && <p className="text-parchment-aged italic text-center py-8">No hay huestes en esta aldea.</p>}
            {armies.map(army => (
              <div key={army.id} className="parchment-dark p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-display ${army.owner === "PLAYER" ? "text-gold-bright" : "text-blood-bright"}`}>
                    {army.owner === "PLAYER" ? "⚔ Tu hueste" : "☠ Hueste enemiga"}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-parchment-aged">
                    <span>Stamina {army.stamina}%</span>
                    {army.isMoving && <span className="text-blue-300">En marcha</span>}
                    {army.isResting && <span className="text-emerald-300">Descansando</span>}
                    {army.isForaging && <span className="text-yellow-300">Forrajeando</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {army.troops.map(t => {
                    const def = TROOPS[t.type];
                    return (
                      <div key={t.type} className="stat-box text-xs">
                        <p className="font-display text-parchment">{def?.name ?? t.type}</p>
                        <p className="text-gold-pale">{t.count} unidades</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "RESOURCES" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Madera", icon: "🌲", value: village.wood, rate: village.woodRate, cap: village.warehouseCap },
                { label: "Piedra", icon: "⛏", value: village.stone, rate: village.stoneRate, cap: village.warehouseCap },
                { label: "Hierro", icon: "⚒", value: village.iron, rate: village.ironRate, cap: village.warehouseCap },
                { label: "Grano", icon: "🌾", value: village.grain, rate: village.grainRate, cap: village.granaryCap },
                { label: "Paja", icon: "🪶", value: village.straw, rate: Math.floor(village.grainRate * 0.4), cap: village.granaryCap },
                { label: "Adobe", icon: "🧱", value: village.adobe, rate: 0, cap: village.warehouseCap },
                { label: "Plata", icon: "🪙", value: village.silver, rate: 0, cap: village.warehouseCap },
                { label: "Oro", icon: "💰", value: village.gold, rate: 0, cap: village.warehouseCap },
              ].map(r => (
                <div key={r.label} className="parchment p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{r.icon}</span>
                    <p className="text-3xl font-bold font-display text-ink">{r.value}</p>
                  </div>
                  <p className="text-sm text-ink-soft mt-1">{r.label}</p>
                  <div className="w-full bg-stone-300 rounded-full h-1 mt-2">
                    <div className="h-1 rounded-full bg-bronze" style={{ width: `${Math.min(100, (r.value / r.cap) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-ink-soft mt-1">{r.value}/{r.cap} {r.rate > 0 ? `(+${r.rate})` : ""}</p>
                </div>
              ))}
            </div>
            <div className="parchment p-4 space-y-1 text-sm">
              <h3 className="font-display text-ink">📜 Sobre los recursos</h3>
              <p className="text-ink-soft">Los campos de grano producen <strong>paja</strong> automáticamente (40% del ratio).</p>
              <p className="text-ink-soft">La paja se convierte lentamente en <strong>adobe</strong>, material básico para construir.</p>
              <p className="text-ink-soft"><strong>Madera + piedra</strong> levantan estructuras de mayor envergadura.</p>
              <p className="text-ink-soft"><strong>Plata y oro</strong> son la moneda de comercio y diplomacia.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
