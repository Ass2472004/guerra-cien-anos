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

function CombatBar({ attack, defense }: { attack: number; defense: number }) {
  const total = attack + defense || 1;
  const atkPct = Math.round((attack / total) * 100);
  const defPct = 100 - atkPct;
  return (
    <div className="space-y-1">
      <div className="flex text-[10px] justify-between text-parchment-dark">
        <span>⚔ Ataque: {attack}</span>
        <span>🛡 Defensa: {defense}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden border border-bronze/30">
        <div
          className="bg-gradient-to-r from-blood to-red-500 transition-all"
          style={{ width: `${atkPct}%` }}
        />
        <div
          className="bg-gradient-to-r from-blue-700 to-blue-500 flex-1 transition-all"
        />
      </div>
      <div className="flex text-[10px] justify-between">
        <span className="text-red-300">{atkPct}% ataque</span>
        <span className="text-blue-300">{defPct}% defensa</span>
      </div>
    </div>
  );
}

function LossesBlock({ losses, label, isPlayer }: { losses: Record<string, number>; label: string; isPlayer: boolean }) {
  const entries = Object.entries(losses).filter(([, v]) => v > 0);
  return (
    <div>
      <p className={`text-[10px] uppercase tracking-wider mb-1 ${isPlayer ? "text-amber-300" : "text-blue-300"}`}>{label}</p>
      {entries.length === 0 ? (
        <p className="text-[10px] text-parchment-dark italic">Sin bajas</p>
      ) : (
        entries.map(([type, count]) => (
          <p key={type} className="text-xs text-blood-bright flex items-center gap-1">
            <span>−{count}</span>
            <span className="text-parchment-aged">{TROOPS[type]?.name ?? type}</span>
          </p>
        ))
      )}
    </div>
  );
}

export default function BattlesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = () => fetch(`/api/game/${id}/battles`).then(r => r.json()).then(d => setBattles(d.battles ?? []));
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [id]);

  const wins = battles.filter(b => {
    const r = b.result;
    return (r.isAttackerPlayer && r.attackerWins) || (!r.isAttackerPlayer && !r.attackerWins);
  }).length;
  const losses = battles.length - wins;

  return (
    <div className="min-h-screen">
      <header className="banner px-4 py-3 flex items-center gap-3 flex-wrap">
        <Link href={`/game/${id}`} className="text-parchment-aged hover:text-gold-bright text-sm italic">← Volver al mapa</Link>
        <span className="text-2xl">📜</span>
        <h1 className="font-display title-gold text-lg">Crónicas de batalla</h1>
        {battles.length > 0 && (
          <div className="ml-auto flex gap-4 text-sm">
            <span className="text-emerald-400 font-display">🏆 {wins} victorias</span>
            <span className="text-blood-bright font-display">💀 {losses} derrotas</span>
          </div>
        )}
      </header>

      {/* Win rate bar */}
      {battles.length > 0 && (
        <div className="bg-[#130c06] border-b border-bronze/40 px-4 py-2 flex items-center gap-3">
          <span className="text-[10px] text-parchment-dark uppercase tracking-wider">Efectividad</span>
          <div className="flex-1 h-2 bg-stone-900 rounded-full overflow-hidden border border-bronze/20">
            <div
              className="h-full bg-gradient-to-r from-emerald-800 to-emerald-500 rounded-full"
              style={{ width: `${(wins / battles.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-emerald-400">{Math.round((wins / battles.length) * 100)}%</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 space-y-3">
        {battles.length === 0 && (
          <div className="parchment p-10 text-center space-y-3">
            <div className="text-5xl">⚔</div>
            <p className="font-display text-ink text-xl">Ninguna batalla registrada</p>
            <p className="text-ink-soft text-sm italic">Mueve tus huestes contra enemigos y el cronista anotará cada choque de acero.</p>
          </div>
        )}

        {battles.map(b => {
          const r = b.result;
          const playerWon = (r.isAttackerPlayer && r.attackerWins) || (!r.isAttackerPlayer && !r.attackerWins);
          const isExpanded = expanded === b.id;
          const totalAttackerLosses = Object.values(r.attackerLosses).reduce((a, b) => a + b, 0);
          const totalDefenderLosses = Object.values(r.defenderLosses).reduce((a, b) => a + b, 0);

          return (
            <div
              key={b.id}
              className={`parchment overflow-hidden border-l-8 ${playerWon ? "border-l-emerald-700" : "border-l-blood"}`}
            >
              {/* Header row — always visible */}
              <button
                className="w-full text-left p-4 hover:bg-black/10 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : b.id)}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{playerWon ? "🏆" : "💀"}</span>
                    <div>
                      <p className="font-display text-ink text-sm">
                        {playerWon ? "Victoria" : "Derrota"}
                        {r.villageName && <span className="text-bronze"> — {r.villageName}</span>}
                      </p>
                      <p className="text-[10px] text-ink-soft">
                        Casilla ({r.tileX},{r.tileY}) · {r.isAttackerPlayer ? "Atacaste" : "Fuiste atacado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    {r.conquered && playerWon && (
                      <span className="text-xs text-gold-bright font-display border border-gold/40 px-2 py-0.5 rounded-sm">⚔ Conquistada</span>
                    )}
                    <div className="text-right">
                      <p className="text-[10px] text-ink-soft">{new Date(b.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</p>
                      <p className="text-[10px] text-parchment-dark">
                        {totalAttackerLosses + totalDefenderLosses > 0 ? `${totalAttackerLosses + totalDefenderLosses} bajas totales` : "Sin bajas"}
                      </p>
                    </div>
                    <span className="text-parchment-dark text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Mini combat bar — always visible */}
                <div className="mt-3">
                  <CombatBar attack={r.attackerAttack} defense={r.defenderDefense} />
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-bronze/40 space-y-4 pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <LossesBlock
                      losses={r.attackerLosses}
                      label={`Atacante ${r.isAttackerPlayer ? "(Tú)" : "(Rival)"}`}
                      isPlayer={r.isAttackerPlayer}
                    />
                    <LossesBlock
                      losses={r.defenderLosses}
                      label={`Defensor ${r.isAttackerPlayer ? "(Rival)" : "(Tú)"}`}
                      isPlayer={!r.isAttackerPlayer}
                    />
                  </div>
                  <blockquote className="text-xs text-ink-soft italic border-l-2 border-bronze pl-3 py-1">
                    «{r.report}»
                  </blockquote>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
