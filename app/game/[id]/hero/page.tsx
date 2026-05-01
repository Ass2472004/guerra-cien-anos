"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";

interface HeroData {
  id: string; name: string; faction: string;
  level: number; xp: number; xpNext: number; hp: number; maxHp: number;
  fightingStrength: number; attackBonus: number; defenseBonus: number; resourceBonus: number;
  skillPoints: number;
  isAlive: boolean; revivesAt: string | null;
  isOnAdventure: boolean; adventureEndsAt: string | null;
  armyId: string | null;
  equipment: Array<{ id: string; slot: string; item: string; tier: number; bonusJson: string }>;
}

interface HeroDef { name: string; title: string; ability: string; abilityDesc: string; historical: string; }

const SLOTS = [
  { key: "HELMET", icon: "🪖", name: "Yelmo" },
  { key: "ARMOR",  icon: "🛡", name: "Armadura" },
  { key: "WEAPON", icon: "⚔", name: "Arma" },
  { key: "SHIELD", icon: "🔰", name: "Escudo" },
  { key: "HORSE",  icon: "🐎", name: "Corcel" },
  { key: "BOOTS",  icon: "👢", name: "Botas" },
];

function timeLeft(endsAt: string | null) {
  if (!endsAt) return "";
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Listo";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}m ${s}s`;
}

export default function HeroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ hero: HeroData; def: HeroDef; items: any } | null>(null);
  const [allocation, setAllocation] = useState({ fightingStrength: 0, attackBonus: 0, defenseBonus: 0, resourceBonus: 0 });
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch(`/api/game/${id}/hero`);
    if (res.ok) setData(await res.json());
  }
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  async function call(action: string, payload: any = {}) {
    const res = await fetch(`/api/game/${id}/hero`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const d = await res.json();
    if (d.xpReward) setMsg(`Aventura: +${d.xpReward} XP${d.item ? ` y obtenido: ${d.item.replaceAll("_", " ")}` : ""}`);
    else setMsg(d.error ?? (d.ok ? "Hecho." : "Error"));
    if (d.ok || d.xpReward) load();
    setTimeout(() => setMsg(""), 4500);
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center title-gold font-display text-2xl">Convocando al héroe…</div>;
  const { hero, def } = data;
  const totalAllocated = allocation.fightingStrength + allocation.attackBonus + allocation.defenseBonus + allocation.resourceBonus;

  return (
    <div className="min-h-screen">
      <header className="banner px-4 py-3 flex items-center gap-3">
        <Link href={`/game/${id}`} className="text-parchment-aged hover:text-gold-bright text-sm italic">← Volver al mapa</Link>
        <span className="text-2xl">⚔</span>
        <h1 className="font-display title-gold text-lg">{def.name}</h1>
        <span className="text-xs italic text-parchment-aged">{def.title}</span>
        {msg && <p className="ml-auto text-sm text-gold-bright italic">{msg}</p>}
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="parchment p-5 flex gap-4">
          <img
            src={`/heroes/${hero.faction.toLowerCase()}.png`}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            alt={def.name}
            className="w-32 h-32 object-cover rounded-sm border-2 border-bronze flex-shrink-0"
          />
          <div className="flex-1 space-y-3">
            <p className="text-ink-soft italic text-sm">«{def.historical}»</p>
            <div className="border-2 border-bronze p-3 bg-amber-100/40">
              <p className="text-ink font-display text-sm">⚜ {def.ability.replace(/_/g, " ")}</p>
              <p className="text-ink-soft text-sm mt-1">{def.abilityDesc}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-box">
            <p className="text-xs text-parchment-aged uppercase tracking-wider">Nivel</p>
            <p className="text-3xl font-display text-gold-bright">{hero.level}</p>
            <div className="w-full bg-stone-900 rounded-full h-1 mt-1 border border-bronze">
              <div className="bg-gold-bright h-full rounded-full" style={{ width: `${(hero.xp / hero.xpNext) * 100}%` }} />
            </div>
            <p className="text-xs text-parchment-dark">{hero.xp}/{hero.xpNext} XP</p>
          </div>
          <div className="stat-box">
            <p className="text-xs text-parchment-aged uppercase tracking-wider">Vida</p>
            <p className="text-3xl font-display text-blood-bright">{hero.hp}/{hero.maxHp}</p>
            {!hero.isAlive && <p className="text-xs text-blood-bright italic">Reviviendo… {timeLeft(hero.revivesAt)}</p>}
          </div>
          <div className="stat-box">
            <p className="text-xs text-parchment-aged uppercase tracking-wider">Fuerza</p>
            <p className="text-3xl font-display text-orange-300">{hero.fightingStrength}</p>
          </div>
          <div className="stat-box">
            <p className="text-xs text-parchment-aged uppercase tracking-wider">Puntos</p>
            <p className="text-3xl font-display text-gold-pale">{hero.skillPoints}</p>
          </div>
        </div>

        {hero.skillPoints > 0 && (
          <div className="parchment p-4 space-y-3">
            <h2 className="font-display text-ink">📜 Distribuir puntos ({hero.skillPoints})</h2>
            {([
              { key: "fightingStrength", label: "Fuerza de combate" },
              { key: "attackBonus", label: "Bonus de ataque (%)" },
              { key: "defenseBonus", label: "Bonus de defensa (%)" },
              { key: "resourceBonus", label: "Bonus de recursos (%)" },
            ] as const).map(s => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-44 text-sm text-ink">{s.label}</span>
                <button onClick={() => setAllocation({ ...allocation, [s.key]: Math.max(0, allocation[s.key] - 1) })} className="w-8 h-8 rounded-sm border border-bronze bg-wood-light text-parchment hover:bg-wood">−</button>
                <span className="w-8 text-center font-bold font-display text-ink">{allocation[s.key]}</span>
                <button onClick={() => totalAllocated < hero.skillPoints && setAllocation({ ...allocation, [s.key]: allocation[s.key] + 1 })} disabled={totalAllocated >= hero.skillPoints} className="w-8 h-8 rounded-sm border border-bronze bg-wood-light text-parchment hover:bg-wood disabled:opacity-40">+</button>
              </div>
            ))}
            <button
              onClick={async () => { await call("ALLOCATE", allocation); setAllocation({ fightingStrength: 0, attackBonus: 0, defenseBonus: 0, resourceBonus: 0 }); }}
              disabled={totalAllocated === 0}
              className="btn-medieval"
            >
              Aplicar
            </button>
          </div>
        )}

        <div className="parchment-dark p-4 space-y-3">
          <h2 className="font-display text-gold-bright">⚔ Equipamiento</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SLOTS.map(slot => {
              const eq = hero.equipment.find(e => e.slot === slot.key);
              const itemDef = eq ? data.items[eq.item] : null;
              return (
                <div key={slot.key} className={`p-3 rounded border-2 ${eq ? "bg-[#3a2818] border-gold" : "bg-wood-dark/40 border-bronze border-dashed"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{slot.icon}</span>
                    <div>
                      <p className="text-xs text-parchment-aged uppercase tracking-wider">{slot.name}</p>
                      <p className="font-display text-sm text-parchment">{itemDef?.name ?? "—"}</p>
                    </div>
                  </div>
                  {eq && (
                    <p className="text-xs text-gold-pale mt-1">
                      Tier {eq.tier} · {Object.entries(JSON.parse(eq.bonusJson)).map(([k, v]) => `+${v} ${k}`).join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="parchment p-4 space-y-3">
          <h2 className="font-display text-ink">🗺 Aventuras</h2>
          {hero.isOnAdventure ? (
            <div>
              <p className="text-ink-soft italic">El héroe explora antiguas ruinas…</p>
              <p className="text-ink text-sm mt-1">Termina en: <strong>{timeLeft(hero.adventureEndsAt)}</strong></p>
              {hero.adventureEndsAt && new Date(hero.adventureEndsAt) <= new Date() && (
                <button onClick={() => call("COMPLETE_ADVENTURE")} className="btn-medieval mt-2">🎁 Recoger recompensa</button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-ink-soft text-sm italic">Envía al héroe a explorar ruinas en busca de objetos y experiencia (≈5 minutos).</p>
              <button onClick={() => call("ADVENTURE")} disabled={!hero.isAlive} className="btn-medieval mt-2">🗺 Iniciar aventura</button>
            </div>
          )}
        </div>

        <div className="parchment p-4 space-y-2">
          <h2 className="font-display text-ink">🛡 Hueste asignada</h2>
          {hero.armyId ? (
            <div className="flex items-center justify-between">
              <p className="text-ink-soft text-sm italic">El héroe lidera el ejército {hero.armyId.slice(0, 8)}…</p>
              <button onClick={() => call("ASSIGN_ARMY", { armyId: null })} className="btn-blood text-xs">Dejar ejército</button>
            </div>
          ) : (
            <p className="text-ink-soft text-sm italic">El héroe está en el castillo. Asígnalo a una hueste para dirigir las tropas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
