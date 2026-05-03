"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NOBILITY } from "@/lib/game/constants/nobility";
import type { NobilityTitle } from "@/lib/game/constants/nobility";

interface GameCard {
  id: string; faction: string; status: string; tick: number;
  nobilityTitle: string; nobilityXp: number;
  createdAt: string; updatedAt: string;
  playerVillages: number; rivalVillages: number; totalTroops: number;
  lastEvent: { type: string; title: string } | null;
}

const FACTION_INFO: Record<string, { name: string; icon: string; color: string; bg: string }> = {
  PORTADORES: { name: "Los Portadores",  icon: "🌑", color: "text-violet-300", bg: "border-violet-800/60 bg-violet-950/20" },
  IMPERIO:    { name: "El Imperio",      icon: "👑", color: "text-amber-300",  bg: "border-amber-800/60 bg-amber-950/20"  },
  FEDERACION: { name: "La Federación",   icon: "⚓", color: "text-teal-300",   bg: "border-teal-800/60 bg-teal-950/20"   },
};

const EVENT_ICONS: Record<string, string> = {
  GOOD_HARVEST: "🌾", DROUGHT: "☀", PLAGUE: "☠", TOURNAMENT: "⚔", DISCOVERY: "💎",
  BANDITS: "🗡", FIRE: "🔥", REINFORCEMENTS: "🛡", REBELLION: "⚡", HOLY_RELIC: "✝",
  MERCENARY: "⚔", FLOOD: "🌊", TREACHERY: "🕵", SIEGE_WEAPON_FOUND: "⚙", VICTORY: "👑",
};

function GameStatusBadge({ status }: { status: string }) {
  if (status === "WON") return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-900/60 border border-amber-600 text-amber-300 font-display">👑 Victoria</span>;
  if (status === "LOST") return <span className="px-2 py-0.5 text-xs rounded-full bg-red-950/60 border border-red-700 text-red-300 font-display">💀 Derrota</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-300 font-display">⚔ En campaña</span>;
}

export default function DashboardPage() {
  const [data, setData] = useState<{ games: GameCard[]; userName: string } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-5xl animate-pulse">🌑</div>
      </div>
    );
  }

  const activeGames = data.games.filter(g => g.status === "PLAYING");
  const finishedGames = data.games.filter(g => g.status !== "PLAYING");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="banner px-6 py-4 flex items-center justify-between border-b-2 border-bronze">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌑</span>
          <div>
            <h1 className="font-display title-gold text-2xl">Mundo Nahkor</h1>
            <p className="text-parchment-aged text-xs italic">Salve, {data.userName}</p>
          </div>
        </div>
        <Link href="/select-faction" className="btn-medieval px-6 py-2">
          ⚔ Nueva campaña
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Active Games */}
        <section className="space-y-4">
          <h2 className="font-display title-gold text-xl flex items-center gap-2">
            ⚔ Campañas activas
            {activeGames.length > 0 && (
              <span className="text-sm text-parchment-dark font-sans font-normal">({activeGames.length})</span>
            )}
          </h2>

          {activeGames.length === 0 && (
            <div className="parchment p-8 text-center space-y-3">
              <div className="text-5xl">🏰</div>
              <p className="font-display text-ink text-lg">Ninguna campaña activa</p>
              <p className="text-ink-soft text-sm italic">Elige tu facción y comienza a forjar tu legado en Nahkor.</p>
              <Link href="/select-faction" className="btn-medieval inline-block mt-2">⚔ Comenzar campaña</Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGames.map(game => {
              const fi = FACTION_INFO[game.faction] ?? FACTION_INFO.PORTADORES;
              const nd = NOBILITY[game.nobilityTitle as NobilityTitle];
              const victoryPct = Math.min(100, (game.playerVillages / 15) * 100);
              return (
                <Link key={game.id} href={`/game/${game.id}`}
                  className={`block parchment-dark border-2 ${fi.bg} p-5 space-y-4 hover:brightness-110 transition-all group rounded-sm`}>
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={`/factions/${game.faction.toLowerCase()}.png`}
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        alt={fi.name}
                        className="w-12 h-12 object-cover border-2 border-bronze rounded-sm flex-shrink-0"
                      />
                      <div>
                        <p className={`font-display text-lg ${fi.color}`}>{fi.icon} {fi.name}</p>
                        {nd && <p className="text-gold-pale text-xs">{nd.icon} {nd.labelEs} · {game.nobilityXp} prestigio</p>}
                      </div>
                    </div>
                    <GameStatusBadge status={game.status} />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/20 rounded p-2">
                      <p className="font-display text-amber-400 text-lg">{game.playerVillages}</p>
                      <p className="text-[10px] text-parchment-dark">Aldeas</p>
                    </div>
                    <div className="bg-black/20 rounded p-2">
                      <p className="font-display text-blue-300 text-lg">{game.totalTroops}</p>
                      <p className="text-[10px] text-parchment-dark">Tropas</p>
                    </div>
                    <div className="bg-black/20 rounded p-2">
                      <p className="font-display text-parchment text-lg">{game.tick}</p>
                      <p className="text-[10px] text-parchment-dark">Años</p>
                    </div>
                  </div>

                  {/* Victory progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-parchment-dark">
                      <span>Progreso de conquista</span>
                      <span>{game.playerVillages}/15 aldeas</span>
                    </div>
                    <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-bronze/30">
                      <div
                        className="h-full bg-gradient-to-r from-amber-800 to-amber-500 rounded-full transition-all"
                        style={{ width: `${victoryPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Last event */}
                  {game.lastEvent && (
                    <p className="text-[10px] text-parchment-dark italic border-t border-bronze/30 pt-2">
                      {EVENT_ICONS[game.lastEvent.type] ?? "📜"} {game.lastEvent.title}
                    </p>
                  )}

                  <div className="text-center text-xs text-parchment-aged group-hover:text-gold-pale transition-colors">
                    Continuar campaña →
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Finished Games */}
        {finishedGames.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-parchment-dark text-lg">📜 Crónicas pasadas</h2>
            <div className="space-y-2">
              {finishedGames.map(game => {
                const fi = FACTION_INFO[game.faction] ?? FACTION_INFO.PORTADORES;
                return (
                  <Link key={game.id} href={`/game/${game.id}/events`}
                    className="flex items-center gap-4 parchment-dark border border-bronze/30 p-3 rounded-sm hover:brightness-105 transition-all opacity-70 hover:opacity-100">
                    <img
                      src={`/factions/${game.faction.toLowerCase()}.png`}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      alt={fi.name}
                      className="w-10 h-10 object-cover border border-bronze rounded-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-parchment-aged text-sm">{fi.icon} {fi.name}</p>
                      <p className="text-xs text-parchment-dark">{game.playerVillages} aldeas · {game.tick} años</p>
                    </div>
                    <GameStatusBadge status={game.status} />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* How to play */}
        <section className="parchment p-6 space-y-4">
          <h2 className="font-display text-ink text-lg">📖 Cómo jugar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-ink-soft">
            <div className="space-y-1">
              <p className="font-display text-ink text-sm">🏰 Conquista</p>
              <p>Mueve tus ejércitos a aldeas enemigas o neutrales para conquistarlas. Necesitas 15 aldeas para dominar el mundo Nahkor.</p>
            </div>
            <div className="space-y-1">
              <p className="font-display text-ink text-sm">💰 Diplomacia</p>
              <p>Paga tributo en plata para convertir aldeas neutrales sin derramar sangre. La plata mueve más que la espada Nahkor.</p>
            </div>
            <div className="space-y-1">
              <p className="font-display text-ink text-sm">⚔ Nobleza</p>
              <p>Gana prestigio en batalla para ascender de Vasallo a Portador de las 256. Cada título añade bonificaciones de producción y combate.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
