"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { TROOPS } from "@/lib/game/constants/troops";

interface Battle {
  id: string; tileId: string; type: string; createdAt: string;
  result: {
    isAttackerPlayer: boolean;
    tileX: number; tileY: number;
    attackerWins: boolean;
    attackerAttack: number;
    defenderDefense: number;
    attackerLosses: Record<string, number>;
    defenderLosses: Record<string, number>;
    report: string;
    villageName: string | null;
    conquered: boolean;
  };
}

export default function BattlesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [battles, setBattles] = useState<Battle[]>([]);

  useEffect(() => {
    const load = () => fetch(`/api/game/${id}/battles`).then(r => r.json()).then(d => setBattles(d.battles ?? []));
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [id]);

  return (
    <div className="min-h-screen">
      <header className="banner px-4 py-3 flex items-center gap-3">
        <Link href={`/game/${id}`} className="text-parchment-aged hover:text-gold-bright text-sm italic">← Volver al mapa</Link>
        <span className="text-2xl">📜</span>
        <h1 className="font-display title-gold text-lg">Crónicas de batalla</h1>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-3">
        {battles.length === 0 && (
          <div className="parchment p-8 text-center">
            <p className="text-ink italic">Aún no se ha derramado sangre.</p>
            <p className="text-ink-soft text-sm mt-2">Mueve tus huestes contra enemigos para que el cronista anote las batallas.</p>
          </div>
        )}
        {battles.map(b => {
          const r = b.result;
          const playerWon = (r.isAttackerPlayer && r.attackerWins) || (!r.isAttackerPlayer && !r.attackerWins);
          return (
            <div key={b.id} className={`parchment p-5 ${playerWon ? "border-l-8 border-l-emerald-700" : "border-l-8 border-l-blood-bright"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-ink">
                  {playerWon ? "🏆 Victoria" : "💀 Derrota"} en ({r.tileX},{r.tileY})
                  {r.villageName && ` — ${r.villageName}`}
                </h3>
                <span className="text-xs text-ink-soft italic">{new Date(b.createdAt).toLocaleString()}</span>
              </div>
              {r.conquered && playerWon && (
                <p className="text-blood font-display mb-2">⚔ ¡Has conquistado esta plaza!</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border-r border-bronze pr-3">
                  <p className="text-ink-soft text-xs uppercase tracking-wider">Atacante {r.isAttackerPlayer ? "(tú)" : "(rival)"}</p>
                  <p className="text-blood font-display">⚔ {r.attackerAttack}</p>
                  <p className="text-ink-soft text-xs mt-1 italic">Bajas:</p>
                  {Object.entries(r.attackerLosses).filter(([, v]) => v > 0).map(([type, count]) => (
                    <p key={type} className="text-xs text-blood">−{count} {TROOPS[type]?.name ?? type}</p>
                  ))}
                  {Object.values(r.attackerLosses).every(v => v === 0) && <p className="text-xs text-ink-soft italic">Sin bajas</p>}
                </div>
                <div>
                  <p className="text-ink-soft text-xs uppercase tracking-wider">Defensor {r.isAttackerPlayer ? "(rival)" : "(tú)"}</p>
                  <p className="text-royal-blue font-display">🛡 {r.defenderDefense}</p>
                  <p className="text-ink-soft text-xs mt-1 italic">Bajas:</p>
                  {Object.entries(r.defenderLosses).filter(([, v]) => v > 0).map(([type, count]) => (
                    <p key={type} className="text-xs text-blood">−{count} {TROOPS[type]?.name ?? type}</p>
                  ))}
                  {Object.values(r.defenderLosses).every(v => v === 0) && <p className="text-xs text-ink-soft italic">Sin bajas</p>}
                </div>
              </div>
              <p className="text-xs text-ink-soft mt-3 italic border-t border-bronze pt-2">«{r.report}»</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
