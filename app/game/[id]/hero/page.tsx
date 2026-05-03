"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { HeroPortrait } from "@/components/Portrait";

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
interface HeroDef { name: string; title: string; ability: string; abilityDesc: string; lore?: string; historical?: string; }
interface AdventureDef {
  key: string; name: string; icon: string; desc: string;
  durationMin: number; xpMin: number; xpMax: number; itemChance: number; silverReward: number;
}

const SLOTS = [
  { key: "HELMET", icon: "🪖", name: "Yelmo" },
  { key: "ARMOR",  icon: "🛡", name: "Armadura" },
  { key: "WEAPON", icon: "⚔", name: "Arma" },
  { key: "SHIELD", icon: "🔰", name: "Escudo" },
  { key: "HORSE",  icon: "🐎", name: "Corcel" },
  { key: "BOOTS",  icon: "👢", name: "Botas" },
];

function timeLeft(endsAt: string | null): string {
  if (!endsAt) return "";
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "¡Listo!";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}m ${s}s`;
}

const STAT_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  fightingStrength: { icon: "⚔", label: "Fuerza de combate",    color: "text-orange-300" },
  attackBonus:      { icon: "🗡", label: "Bonus de ataque (%)",  color: "text-red-300" },
  defenseBonus:     { icon: "🛡", label: "Bonus de defensa (%)", color: "text-blue-300" },
  resourceBonus:    { icon: "🌾", label: "Bonus de recursos (%)", color: "text-emerald-300" },
};

export default function HeroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ hero: HeroData; def: HeroDef; items: any; adventureTypes: Record<string, AdventureDef> } | null>(null);
  const [allocation, setAllocation] = useState({ fightingStrength: 0, attackBonus: 0, defenseBonus: 0, resourceBonus: 0 });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedAdventure, setSelectedAdventure] = useState<string>("RUINS");
  const [, setClock] = useState(Date.now());

  async function load() {
    const res = await fetch(`/api/game/${id}/hero`);
    if (res.ok) setData(await res.json());
  }
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(t); }, []);

  async function call(action: string, payload: any = {}) {
    const res = await fetch(`/api/game/${id}/hero`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const d = await res.json();
    let text = d.error ?? "Error";
    let ok = false;
    if (d.xpReward !== undefined) {
      text = `+${d.xpReward} XP`;
      if (d.item) text += ` · Objeto: ${d.item.replace(/_/g, " ")}`;
      if (d.silverReward) text += ` · +${d.silverReward} 🪙 plata`;
      ok = true;
    } else if (d.ok) {
      text = action === "ADVENTURE" ? `${d.name ?? "Aventura"} iniciada — ${Math.floor((d.eta ?? 300) / 60)}m` : "Hecho.";
      ok = true;
    }
    setMsg({ text, ok });
    if (d.ok || d.xpReward !== undefined) load();
    setTimeout(() => setMsg(null), 5000);
  }

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center title-gold font-display text-2xl">
      Convocando al héroe…
    </div>
  );

  const { hero, def: rawDef, adventureTypes } = data;
  // Fallback if hero has stale faction or def is missing
  const def: HeroDef = rawDef ?? { name: hero.name ?? "Héroe", title: "", ability: "", abilityDesc: "" };
  const heroLore = def.lore ?? def.historical ?? "Un héroe del mundo Nahkor.";
  const totalAllocated = Object.values(allocation).reduce((a, b) => a + b, 0);
  const adventureReady = hero.isOnAdventure && hero.adventureEndsAt && new Date(hero.adventureEndsAt) <= new Date();
  const xpPct = Math.min(100, (hero.xp / hero.xpNext) * 100);

  return (
    <div className="min-h-screen">
      <header className="banner px-4 py-3 flex items-center gap-3">
        <Link href={`/game/${id}`} className="text-parchment-aged hover:text-gold-bright text-sm italic">← Volver al mapa</Link>
        <span className="text-2xl">⚔</span>
        <h1 className="font-display title-gold text-lg">{def.name}</h1>
        <span className="text-xs italic text-parchment-aged">{def.title}</span>
        {msg && (
          <p className={`ml-auto text-sm italic font-display ${msg.ok ? "text-gold-bright" : "text-blood-bright"}`}>{msg.text}</p>
        )}
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* Hero card */}
        <div className="parchment p-5 flex gap-5">
          <div className="flex-shrink-0">
            <HeroPortrait
              faction={hero.faction}
              level={hero.level}
              hp={hero.hp}
              maxHp={hero.maxHp}
              size="xl"
              isAlive={hero.isAlive}
              isOnAdventure={hero.isOnAdventure}
            />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-ink-soft italic text-sm leading-relaxed">«{heroLore}»</p>
            <div className="border-2 border-bronze p-3 bg-amber-100/40 rounded-sm">
              <p className="text-ink font-display text-sm">⚜ {(def.ability || "Habilidad").replace(/_/g, " ")}</p>
              <p className="text-ink-soft text-sm mt-1">{def.abilityDesc || "—"}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Level */}
          <div className="parchment-dark p-3 rounded border border-bronze/40 space-y-1">
            <p className="text-[10px] text-parchment-aged uppercase tracking-wider">Nivel</p>
            <p className="text-3xl font-display text-gold-bright">{hero.level}</p>
            <div className="w-full bg-stone-900 rounded-full h-1.5 border border-bronze/30 overflow-hidden">
              <div className="bg-gold-bright h-full rounded-full transition-all" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="text-[10px] text-parchment-dark">{hero.xp} / {hero.xpNext} XP</p>
          </div>
          {/* HP */}
          <div className="parchment-dark p-3 rounded border border-bronze/40 space-y-1">
            <p className="text-[10px] text-parchment-aged uppercase tracking-wider">Vida</p>
            <p className="text-3xl font-display text-blood-bright">{hero.hp}/{hero.maxHp}</p>
            {!hero.isAlive && <p className="text-[10px] text-blood-bright italic">💀 Reviviendo… {timeLeft(hero.revivesAt)}</p>}
          </div>
          {/* Strength */}
          <div className="parchment-dark p-3 rounded border border-bronze/40 space-y-1">
            <p className="text-[10px] text-parchment-aged uppercase tracking-wider">Fuerza</p>
            <p className="text-3xl font-display text-orange-300">{hero.fightingStrength}</p>
          </div>
          {/* Skill points */}
          <div className="parchment-dark p-3 rounded border border-bronze/40 space-y-1">
            <p className="text-[10px] text-parchment-aged uppercase tracking-wider">Puntos libres</p>
            <p className="text-3xl font-display text-gold-pale">{hero.skillPoints}</p>
          </div>
        </div>

        {/* Bonuses bar */}
        <div className="parchment p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["fightingStrength", "attackBonus", "defenseBonus", "resourceBonus"] as const).map(k => {
            const s = STAT_LABELS[k];
            return (
              <div key={k} className="text-center">
                <p className="text-xl">{s.icon}</p>
                <p className={`font-display text-lg font-bold ${s.color}`}>{(hero as any)[k]}{k !== "fightingStrength" ? "%" : ""}</p>
                <p className="text-[10px] text-ink-soft">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Skill point allocation */}
        {hero.skillPoints > 0 && (
          <div className="parchment p-4 space-y-3">
            <h2 className="font-display text-ink flex items-center gap-2">
              📜 Distribuir puntos
              <span className="text-gold-bright font-display">({hero.skillPoints - totalAllocated} restantes)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["fightingStrength", "attackBonus", "defenseBonus", "resourceBonus"] as const).map(k => {
                const s = STAT_LABELS[k];
                return (
                  <div key={k} className="flex items-center gap-3 parchment-dark p-2.5 rounded border border-bronze/30">
                    <span className="text-lg">{s.icon}</span>
                    <span className={`flex-1 text-sm ${s.color}`}>{s.label}</span>
                    <button onClick={() => setAllocation(a => ({ ...a, [k]: Math.max(0, a[k] - 1) }))}
                      className="w-7 h-7 rounded border border-bronze bg-wood-light text-parchment hover:bg-wood text-sm">−</button>
                    <span className="w-6 text-center font-bold font-display text-parchment">{allocation[k]}</span>
                    <button
                      onClick={() => totalAllocated < hero.skillPoints && setAllocation(a => ({ ...a, [k]: a[k] + 1 }))}
                      disabled={totalAllocated >= hero.skillPoints}
                      className="w-7 h-7 rounded border border-bronze bg-wood-light text-parchment hover:bg-wood text-sm disabled:opacity-30">+</button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={async () => { await call("ALLOCATE", allocation); setAllocation({ fightingStrength: 0, attackBonus: 0, defenseBonus: 0, resourceBonus: 0 }); }}
              disabled={totalAllocated === 0}
              className="btn-medieval disabled:opacity-40"
            >
              ✓ Aplicar ({totalAllocated} puntos)
            </button>
          </div>
        )}

        {/* Equipment */}
        <div className="parchment-dark p-4 space-y-3">
          <h2 className="font-display text-gold-bright">⚔ Equipamiento del héroe</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SLOTS.map(slot => {
              const eq = hero.equipment.find(e => e.slot === slot.key);
              const itemDef = eq ? data.items[eq.item] : null;
              return (
                <div key={slot.key} className={`p-3 rounded border-2 ${eq ? "bg-[#3a2818] border-gold/60" : "bg-wood-dark/30 border-bronze/30 border-dashed"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{slot.icon}</span>
                    <div>
                      <p className="text-[10px] text-parchment-aged uppercase tracking-wider">{slot.name}</p>
                      <p className="font-display text-sm text-parchment">{itemDef?.name ?? <span className="text-parchment-dark italic">Vacío</span>}</p>
                    </div>
                  </div>
                  {eq && (
                    <p className="text-[10px] text-gold-pale mt-1.5 border-t border-bronze/30 pt-1">
                      Tier {eq.tier} · {Object.entries(JSON.parse(eq.bonusJson)).map(([k, v]) => `+${v} ${k}`).join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Adventures */}
        <div className="parchment p-4 space-y-4">
          <h2 className="font-display text-ink">🗺 Misiones de aventura</h2>

          {hero.isOnAdventure ? (
            <div className="space-y-3">
              <div className="parchment-dark border border-bronze/50 p-4 rounded space-y-2">
                <p className="font-display text-gold-bright">En misión…</p>
                <p className="text-ink-soft text-sm italic">Tu héroe está en campo. Regresa en:</p>
                <p className="text-2xl font-display text-gold-bright">{timeLeft(hero.adventureEndsAt)}</p>
              </div>
              {adventureReady && (
                <button onClick={() => call("COMPLETE_ADVENTURE")} className="btn-medieval w-full">
                  🎁 Reclamar recompensas
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-ink-soft text-sm italic">Elige la misión y envía al héroe. Cada tipo ofrece recompensas distintas.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(adventureTypes).map(adv => {
                  const isSelected = selectedAdventure === adv.key;
                  return (
                    <button
                      key={adv.key}
                      onClick={() => setSelectedAdventure(adv.key)}
                      className={`text-left p-3 rounded border-2 transition-all ${isSelected ? "border-gold bg-amber-950/40" : "border-bronze/40 bg-wood-dark/20 hover:border-bronze/70"}`}
                    >
                      <p className="font-display text-sm text-parchment flex items-center gap-1.5">
                        <span className="text-base">{adv.icon}</span>
                        {adv.name}
                        <span className="text-[10px] text-parchment-dark ml-auto">{adv.durationMin} min</span>
                      </p>
                      <p className="text-[10px] text-ink-soft mt-1">{adv.desc}</p>
                      <div className="flex gap-3 mt-2 text-[10px]">
                        <span className="text-gold-pale">⭐ {adv.xpMin}–{adv.xpMax} XP</span>
                        {adv.itemChance > 0 && <span className="text-blue-300">🎒 {Math.round(adv.itemChance * 100)}% objeto</span>}
                        {adv.silverReward > 0 && <span className="text-sky-300">🪙 ~{adv.silverReward} plata</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => call("ADVENTURE", { adventureType: selectedAdventure })}
                disabled={!hero.isAlive}
                className="btn-medieval w-full disabled:opacity-40"
              >
                {adventureTypes[selectedAdventure]?.icon ?? "🗺"} Iniciar: {adventureTypes[selectedAdventure]?.name ?? "Aventura"}
              </button>
            </div>
          )}
        </div>

        {/* Army assignment */}
        <div className="parchment p-4 space-y-2">
          <h2 className="font-display text-ink">🛡 Hueste asignada</h2>
          {hero.armyId ? (
            <div className="flex items-center justify-between">
              <p className="text-ink-soft text-sm italic">El héroe lidera el ejército {hero.armyId.slice(0, 8)}…</p>
              <button onClick={() => call("ASSIGN_ARMY", { armyId: null })} className="btn-blood text-xs px-3 py-1">Dejar ejército</button>
            </div>
          ) : (
            <p className="text-ink-soft text-sm italic">El héroe espera en el castillo. Asígnalo a una hueste para aportar sus bonificaciones en combate.</p>
          )}
        </div>
      </div>
    </div>
  );
}
