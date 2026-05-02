"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HEROES } from "@/lib/game/constants/heroes";

const FACTIONS = [
  {
    key: "ENGLAND" as const,
    crest: "🦁",
    name: "Inglaterra",
    motto: "Dieu et mon droit",
    accent: "border-red-700 hover:border-red-500",
    select: "ring-red-500",
    desc: "El arco largo inglés es el azote de Europa. Tus arqueros diezmarán a cualquier ejército antes de que pueda cargar.",
    strengths: ["Arquero largo (OFF letal)", "Hobelar — exploración rápida", "Trebuchets devastadores"],
  },
  {
    key: "FRANCE" as const,
    crest: "⚜",
    name: "Francia",
    motto: "Montjoie Saint-Denis",
    accent: "border-blue-700 hover:border-blue-500",
    select: "ring-blue-500",
    desc: "Los Chevaliers cargan con la furia de mil tormentas. La bombarda de Bureau hará temblar las murallas inglesas.",
    strengths: ["Chevaliers — caballería suprema", "Bombarda de Bureau (asedio)", "Ballestero genovés"],
  },
  {
    key: "SPAIN" as const,
    crest: "🛡",
    name: "Castilla",
    motto: "Tanto monta",
    accent: "border-yellow-700 hover:border-yellow-500",
    select: "ring-yellow-500",
    desc: "El Jinete y el Almogávar dominan la guerra de movimiento. Donde la velocidad y la astucia mandan, Castilla vence.",
    strengths: ["Jinete (la más rápida)", "Almogávar — choque élite", "Caballeros de Santiago"],
  },
];

export default function SelectFactionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"ENGLAND" | "FRANCE" | "SPAIN" | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [houseName, setHouseName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startGame() {
    if (!selected) return;
    if (!playerName.trim()) { setError("Escribe el nombre de tu noble"); return; }
    if (!houseName.trim()) { setError("Escribe el nombre de tu casa"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/game/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faction: selected, playerName: playerName.trim(), houseName: houseName.trim() }),
    });
    setLoading(false);
    if (!res.ok) { setError("Error al crear la partida"); return; }
    const { gameId } = await res.json();
    router.push(`/game/${gameId}`);
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="text-5xl">⚜</div>
          <h1 className="font-display text-4xl title-gold">Elige tu reino</h1>
          <p className="text-parchment-aged italic">Tu juramento de hoy decide el destino de Europa.</p>
        </div>

        {/* Noble identity */}
        <div className="parchment p-6 max-w-2xl mx-auto">
          <h2 className="font-display text-lg text-ink mb-4 flex items-center gap-2">
            <span>👑</span> Tu identidad noble
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-soft mb-1 font-display">Nombre del noble</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Ej: Eduardo de Woodstock"
                className="w-full"
                maxLength={40}
              />
              <p className="text-[10px] text-ink-soft mt-1 italic">Así te conocerán tus súbditos y enemigos</p>
            </div>
            <div>
              <label className="block text-sm text-ink-soft mb-1 font-display">Nombre de la casa</label>
              <input
                type="text"
                value={houseName}
                onChange={e => setHouseName(e.target.value)}
                placeholder="Ej: Casa Plantagenet"
                className="w-full"
                maxLength={40}
              />
              <p className="text-[10px] text-ink-soft mt-1 italic">Tu linaje, tu legado</p>
            </div>
          </div>
        </div>

        {/* Faction cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FACTIONS.map(f => {
            const hero = HEROES[f.key];
            const isSelected = selected === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setSelected(f.key)}
                className={`text-left transition-all ${isSelected ? `ring-4 ${f.select}` : ""} parchment p-5 space-y-3 hover:scale-[1.02] overflow-hidden`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`/factions/${f.key.toLowerCase()}.png`}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    alt={f.name}
                    className="w-16 h-16 object-cover rounded-sm border-2 border-bronze"
                  />
                  <div>
                    <h2 className="font-display text-2xl text-ink">{f.name}</h2>
                    <p className="text-xs italic text-ink-soft">«{f.motto}»</p>
                  </div>
                  <span className="ml-auto text-3xl">{f.crest}</span>
                </div>
                <div className="border-t border-bronze pt-3">
                  <p className="text-sm text-ink">{f.desc}</p>
                </div>
                <div className="space-y-1">
                  {f.strengths.map(s => (
                    <p key={s} className="text-xs text-ink-soft flex items-center gap-1">
                      <span className="text-bronze">✦</span> {s}
                    </p>
                  ))}
                </div>
                <div className="mt-3 p-3 border border-bronze rounded flex gap-3">
                  <img
                    src={`/heroes/${f.key.toLowerCase()}.png`}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    alt={hero.name}
                    className="w-20 h-20 object-cover rounded-sm border border-bronze flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-display text-sm text-ink leading-tight">{hero.name}</p>
                    <p className="text-xs italic text-ink-soft">{hero.title}</p>
                    <p className="text-xs text-ink mt-1 leading-tight">{hero.abilityDesc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-blood-bright text-center italic">{error}</p>}

        <div className="flex justify-center">
          <button
            onClick={startGame}
            disabled={!selected || loading || !playerName.trim() || !houseName.trim()}
            className="btn-medieval text-lg px-12 py-4"
          >
            {loading ? "Forjando el reino…" : "⚔ Iniciar campaña"}
          </button>
        </div>
      </div>
    </main>
  );
}
