"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { NOBILITY, NOBILITY_ORDER, computeTitle, type NobilityTitle } from "@/lib/game/constants/nobility";

interface NobilityData {
  nobilityTitle: string;
  nobilityXp: number;
  playerVillages: number;
  faction: string;
}

export default function NobilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<NobilityData | null>(null);

  useEffect(() => {
    fetch(`/api/game/${id}/nobility`).then(r => r.json()).then(setData);
  }, [id]);

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center title-gold font-display text-2xl">
      Consultando pergaminos heráldicos…
    </div>
  );

  const currentTitle = data.nobilityTitle as NobilityTitle;
  const currentIdx = NOBILITY_ORDER.indexOf(currentTitle);

  return (
    <div className="min-h-screen">
      <header className="banner px-4 py-3 flex items-center gap-3">
        <Link href={`/game/${id}`} className="text-parchment-aged hover:text-gold-bright text-sm italic">← Volver al mapa</Link>
        <span className="text-2xl">👑</span>
        <h1 className="font-display title-gold text-lg">Nobleza y Títulos</h1>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Current title prominent display */}
        <div className="parchment p-6 text-center space-y-3">
          <p className="text-sm text-parchment-aged uppercase tracking-widest font-display">Tu rango actual</p>
          <div className="text-6xl">{NOBILITY[currentTitle].icon}</div>
          <h2 className="font-display text-4xl title-gold">{NOBILITY[currentTitle].labelEs}</h2>
          <p className="text-lg italic text-parchment-dark">{NOBILITY[currentTitle].label}</p>
          <p className="text-parchment-aged text-sm italic max-w-md mx-auto">{NOBILITY[currentTitle].description}</p>
          <div className="border-t border-bronze pt-3 flex justify-center gap-8 text-sm">
            <div>
              <p className="text-parchment-aged text-xs uppercase tracking-wider">Prestigio</p>
              <p className="font-display text-gold-bright text-2xl">{data.nobilityXp}</p>
            </div>
            <div>
              <p className="text-parchment-aged text-xs uppercase tracking-wider">Aldeas controladas</p>
              <p className="font-display text-gold-bright text-2xl">{data.playerVillages}</p>
            </div>
          </div>
        </div>

        {/* Bonuses */}
        <div className="parchment p-5 space-y-3">
          <h2 className="font-display text-ink text-lg">⚜ Privilegios del rango</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Producción de recursos", value: NOBILITY[currentTitle].productionBonus, color: "text-emerald-600", icon: "🌾", unit: "%" },
              { label: "Bonus de ataque", value: NOBILITY[currentTitle].attackBonus, color: "text-red-700", icon: "⚔", unit: "%" },
              { label: "Bonus de defensa", value: NOBILITY[currentTitle].defenseBonus, color: "text-blue-700", icon: "🛡", unit: "%" },
              { label: "Velocidad de reclutamiento", value: NOBILITY[currentTitle].recruitBonus, color: "text-amber-700", icon: "⏩", unit: "%" },
            ].map(b => (
              <div key={b.label} className="stat-box">
                <p className="text-xs text-ink-soft uppercase tracking-wider">{b.icon} {b.label}</p>
                <p className={`font-display text-2xl ${b.value > 0 ? b.color : "text-parchment-dark"}`}>
                  {b.value > 0 ? `+${b.value}${b.unit}` : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Title progression ladder */}
        <div className="parchment-dark p-5 space-y-4">
          <h2 className="font-display text-gold-bright text-lg">📜 Escala nobiliaria</h2>
          <div className="space-y-3">
            {NOBILITY_ORDER.map((key, idx) => {
              const nd = NOBILITY[key];
              const isCurrentOrPast = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              const canReach = data.playerVillages >= nd.minVillages && data.nobilityXp >= nd.minPrestige;

              return (
                <div key={key} className={`p-4 rounded border-2 transition-all ${
                  isCurrent
                    ? "border-gold bg-amber-950/50"
                    : isCurrentOrPast
                    ? "border-bronze/60 bg-wood/30 opacity-80"
                    : canReach
                    ? "border-emerald-700 bg-emerald-950/20"
                    : "border-stone-700 bg-stone-950/30 opacity-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{nd.icon}</span>
                      <div>
                        <p className={`font-display ${isCurrent ? "text-gold-bright" : isCurrentOrPast ? "text-parchment" : "text-parchment-aged"}`}>
                          {nd.labelEs} {isCurrent && "← Tu título"}
                        </p>
                        <p className="text-xs text-parchment-aged italic">{nd.label}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-gold-bright font-display text-xs border border-gold px-2 py-0.5 rounded-sm">ACTUAL</span>
                    )}
                    {!isCurrent && canReach && idx > currentIdx && (
                      <span className="text-emerald-400 font-display text-xs border border-emerald-700 px-2 py-0.5 rounded-sm">DISPONIBLE</span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-parchment-aged">
                    <span>🏰 {nd.minVillages} aldeas mínimas</span>
                    <span>⭐ {nd.minPrestige} prestigio</span>
                  </div>
                  {(nd.productionBonus > 0 || nd.attackBonus > 0 || nd.defenseBonus > 0) && (
                    <div className="mt-2 flex gap-3 text-xs">
                      {nd.productionBonus > 0 && <span className="text-emerald-400">+{nd.productionBonus}% prod</span>}
                      {nd.attackBonus > 0 && <span className="text-red-400">+{nd.attackBonus}% atk</span>}
                      {nd.defenseBonus > 0 && <span className="text-blue-400">+{nd.defenseBonus}% def</span>}
                      {nd.recruitBonus > 0 && <span className="text-amber-400">−{nd.recruitBonus}% recl</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* How to earn prestige */}
        <div className="parchment p-5 space-y-2">
          <h2 className="font-display text-ink">⭐ Cómo ganar prestigio</h2>
          <ul className="space-y-1 text-sm text-ink-soft">
            <li>⚔ <strong>Victoria en batalla:</strong> +80 prestigio</li>
            <li>🛡 <strong>Defender una aldea con éxito:</strong> +50 prestigio</li>
            <li>🏰 <strong>Capturar una aldea enemiga:</strong> +150 prestigio</li>
            <li>🗺 <strong>Completar una aventura heroica:</strong> +10 prestigio</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
