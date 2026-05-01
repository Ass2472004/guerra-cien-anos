"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HEROES } from "@/lib/game/constants/heroes";

const FACTIONS = [
  {
    key: "ENGLAND" as const,
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    name: "Inglaterra",
    color: "border-red-600 hover:border-red-400",
    accent: "text-red-400",
    bg: "hover:bg-red-950/30",
    desc: "El arco largo inglés es la fuerza más temida de Europa. Tus arqueros largos diezmarán cualquier ejército en campo abierto.",
    strengths: ["Arqueros largos (OFF suprema)", "Rápida exploración (Hobelar)", "Ingeniería de asedio avanzada"],
  },
  {
    key: "FRANCE" as const,
    flag: "🇫🇷",
    name: "Francia",
    color: "border-blue-600 hover:border-blue-400",
    accent: "text-blue-400",
    bg: "hover:bg-blue-950/30",
    desc: "Los Chevaliers franceses son la élite de la caballería europea. Apoyados por la artillería de Bureau, ninguna muralla resiste.",
    strengths: ["Chevaliers (mejor caballería)", "Bombarda de Bureau (mejor asedio)", "Ballesteros genoveses (OFF a distancia)"],
  },
  {
    key: "SPAIN" as const,
    flag: "🇪🇸",
    name: "España",
    color: "border-yellow-600 hover:border-yellow-400",
    accent: "text-yellow-400",
    bg: "hover:bg-yellow-950/30",
    desc: "La caballería ligera Jinete y los Almogávares hacen de España el maestro de la guerra de guerrillas y la velocidad.",
    strengths: ["Jinetes (más rápida del mapa)", "Almogávares (choque élite)", "Caballeros de Santiago (DEF élite)"],
  },
];

export default function SelectFactionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"ENGLAND" | "FRANCE" | "SPAIN" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startGame() {
    if (!selected) return;
    setLoading(true); setError("");
    const res = await fetch("/api/game/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faction: selected }),
    });
    setLoading(false);
    if (!res.ok) { setError("Error al crear la partida"); return; }
    const { gameId } = await res.json();
    router.push(`/game/${gameId}`);
  }

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-amber-400">Elige tu facción</h1>
          <p className="text-stone-400">Tu elección determina tus tropas, tu héroe y tu estrategia.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FACTIONS.map(f => {
            const hero = HEROES[f.key];
            const isSelected = selected === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setSelected(f.key)}
                className={`text-left p-6 rounded-xl border-2 transition-all space-y-4 ${f.color} ${f.bg} ${isSelected ? "ring-2 ring-amber-400" : "border-stone-700"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{f.flag}</span>
                  <div>
                    <h2 className={`text-xl font-bold ${f.accent}`}>{f.name}</h2>
                    <p className="text-xs text-stone-400">Héroe: {hero.name}</p>
                  </div>
                </div>
                <p className="text-sm text-stone-300">{f.desc}</p>
                <div className="space-y-1">
                  {f.strengths.map(s => (
                    <p key={s} className="text-xs text-stone-400 flex items-center gap-1">
                      <span className="text-amber-500">▸</span> {s}
                    </p>
                  ))}
                </div>
                <div className="mt-2 p-3 bg-stone-900/60 rounded text-xs space-y-1">
                  <p className={`font-semibold ${f.accent}`}>{hero.title}</p>
                  <p className="text-stone-400">{hero.abilityDesc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-center">{error}</p>}

        <div className="flex justify-center">
          <button
            onClick={startGame}
            disabled={!selected || loading}
            className="px-12 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generando mundo…" : "Comenzar campaña"}
          </button>
        </div>
      </div>
    </main>
  );
}
