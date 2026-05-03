"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HEROES } from "@/lib/game/constants/heroes";

const FACTIONS = [
  {
    key: "PORTADORES" as const,
    crest: "🌑",
    name: "Los Portadores",
    subtitle: "Espadas de la Oscuridad",
    motto: "Nah·Kor — Ausencia de luz",
    accent: "border-violet-800 hover:border-violet-500",
    select: "ring-violet-500",
    gradient: "from-violet-950/60 to-black/40",
    desc: "Los portadores de espadas Nahkor son fragmentos de divinidad. Su filo intangible adopta el color de su alma. Combaten con el poder de la oscuridad y la fusión progresiva con sus armas.",
    strengths: [
      "Portador Maestro — casi inmortal en combate",
      "Flecha de Kor — arquero devastador",
      "Espía Oscuro — invisible en la Nahkor",
    ],
    color: "text-violet-300",
  },
  {
    key: "IMPERIO" as const,
    crest: "👑",
    name: "El Imperio",
    subtitle: "Matriarcado de Rha'en",
    motto: "Loados sean los Cuatro",
    accent: "border-amber-700 hover:border-amber-500",
    select: "ring-amber-500",
    gradient: "from-amber-950/60 to-black/40",
    desc: "El Imperio Matriarcal gobernado por la espada de la nada. Sus jinetes de dragón son temidos en todo el mundo conocido. Disciplina, orden y lealtad a la Emperatriz.",
    strengths: [
      "Jinete de Dragón — caballería suprema",
      "Guiverno de Asedio — destruye murallas",
      "Guardia de la Emperatriz — defensa élite",
    ],
    color: "text-amber-300",
  },
  {
    key: "FEDERACION" as const,
    crest: "⚓",
    name: "La Federación",
    subtitle: "Ciudades Marinas de Rha'miras",
    motto: "Tanto monta el oro como la sangre",
    accent: "border-teal-700 hover:border-teal-500",
    select: "ring-teal-500",
    gradient: "from-teal-950/60 to-black/40",
    desc: "La Federación de ciudades marinas gobierna el comercio del Mar Allende. Sus mercenarios de Merxias son los más baratos y los jinetes mercantes los más rápidos del mundo conocido.",
    strengths: [
      "Jinete Mercante — el más veloz del mapa",
      "Mercenario de Merxias — élite de choque",
      "Espía Comercial — infiltración en cortes",
    ],
    color: "text-teal-300",
  },
];

export default function SelectFactionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"PORTADORES" | "IMPERIO" | "FEDERACION" | null>(null);
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
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Cabecera */}
        <div className="text-center space-y-4">
          <div className="text-6xl">🌑</div>
          <h1 className="font-display text-4xl title-gold">Mundo Nahkor</h1>
          <p className="text-parchment-aged italic text-lg">Crónicas del mundo sin luz</p>
          <p className="text-ink-soft text-sm max-w-2xl mx-auto">
            Un mundo orbitado por cuatro lunas, donde los días de oscuridad —la Nahkor— moldean el destino de las naciones.
            Las espadas oscuras consumen almas. Los dragones dominan el cielo. El oro de las islas de Merxias compra más que la sangre.
          </p>
        </div>

        {/* Identidad noble */}
        <div className="parchment p-6 max-w-2xl mx-auto">
          <h2 className="font-display text-base text-ink mb-4 flex items-center gap-2">
            <span>👑</span> Tu identidad en Nahkor
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink-soft mb-1 font-display">Nombre del noble</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Ej: Fritz el Desterrado"
                className="w-full"
                maxLength={40}
              />
              <p className="text-[10px] text-ink-soft mt-1 italic">Así te conocerán aliados y enemigos</p>
            </div>
            <div>
              <label className="block text-sm text-ink-soft mb-1 font-display">Nombre de la Casa</label>
              <input
                type="text"
                value={houseName}
                onChange={e => setHouseName(e.target.value)}
                placeholder="Ej: Casa de Sangre Nocturna"
                className="w-full"
                maxLength={40}
              />
              <p className="text-[10px] text-ink-soft mt-1 italic">Tu linaje, tu legado en el mundo</p>
            </div>
          </div>
        </div>

        {/* Tarjetas de facción */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FACTIONS.map(f => {
            const hero = HEROES[f.key];
            const isSelected = selected === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setSelected(f.key)}
                className={`text-left transition-all ${isSelected ? `ring-4 ${f.select} scale-[1.02]` : "hover:scale-[1.01]"} parchment p-5 space-y-4 overflow-hidden border-l-4 ${f.accent}`}
              >
                {/* Cabecera facción */}
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{f.crest}</span>
                  <div className="flex-1">
                    <h2 className="font-display text-xl text-ink leading-tight">{f.name}</h2>
                    <p className={`text-xs font-display ${f.color}`}>{f.subtitle}</p>
                    <p className="text-[10px] italic text-ink-soft mt-0.5">«{f.motto}»</p>
                  </div>
                  {isSelected && (
                    <span className="text-xs bg-bronze/20 border border-bronze/40 text-bronze px-2 py-0.5 rounded-sm font-display flex-shrink-0">
                      ✓ Elegido
                    </span>
                  )}
                </div>

                {/* Descripción */}
                <div className="border-t border-bronze/40 pt-3">
                  <p className="text-sm text-ink leading-relaxed">{f.desc}</p>
                </div>

                {/* Fortalezas */}
                <div className="space-y-1.5">
                  {f.strengths.map(s => (
                    <p key={s} className="text-xs text-ink-soft flex items-start gap-1.5">
                      <span className={`${f.color} mt-0.5 flex-shrink-0`}>✦</span> {s}
                    </p>
                  ))}
                </div>

                {/* Héroe */}
                <div className="border border-bronze/40 rounded p-3 flex gap-3 bg-black/10">
                  <div className="w-14 h-14 rounded border border-bronze/40 bg-stone-900 flex items-center justify-center flex-shrink-0 text-2xl">
                    {f.key === "PORTADORES" ? "🗡" : f.key === "IMPERIO" ? "🐉" : "⚓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-ink leading-tight truncate">{hero.name}</p>
                    <p className="text-[10px] italic text-ink-soft leading-tight">{hero.title}</p>
                    <p className="text-[10px] text-ink mt-1 leading-tight line-clamp-2">{hero.abilityDesc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-blood-bright text-center italic">{error}</p>}

        {/* Botón de inicio */}
        <div className="flex justify-center">
          <button
            onClick={startGame}
            disabled={!selected || loading || !playerName.trim() || !houseName.trim()}
            className="btn-medieval text-lg px-14 py-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Forjando el destino…" : "🌑 Iniciar crónica en Nahkor"}
          </button>
        </div>

        {/* Lore footer */}
        <div className="text-center text-[10px] text-ink-soft italic border-t border-bronze/20 pt-4">
          «Este mundo tiene decenios de miles de años. Los Catalizadores del Origen crearon todo lo que existe.
          Las espadas Nahkor son fragmentos de divinidad. Solo los puros de corazón sobreviven a la Gran Inundación.»
          <br/>— Teontélos, pasaje 4º
        </div>

      </div>
    </main>
  );
}
