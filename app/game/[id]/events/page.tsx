"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";

interface GameEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  affectedId: string | null;
  effectJson: string;
  isRead: boolean;
  createdAt: string;
}

const EVENT_ICONS: Record<string, string> = {
  GOOD_HARVEST: "🌾",
  DROUGHT: "☀",
  PLAGUE: "☠",
  TOURNAMENT: "⚔",
  DISCOVERY: "💎",
  BANDITS: "🗡",
  FIRE: "🔥",
  REINFORCEMENTS: "🛡",
  REBELLION: "⚡",
  HOLY_RELIC: "✝",
  MERCENARY: "⚔",
  FLOOD: "🌊",
  TREACHERY: "🕵",
  SIEGE_WEAPON_FOUND: "⚙",
  VICTORY: "👑",
};

const EVENT_COLORS: Record<string, string> = {
  GOOD_HARVEST: "border-l-emerald-500 bg-emerald-950/20",
  DROUGHT: "border-l-orange-500 bg-orange-950/20",
  PLAGUE: "border-l-purple-600 bg-purple-950/20",
  TOURNAMENT: "border-l-amber-500 bg-amber-950/20",
  DISCOVERY: "border-l-cyan-500 bg-cyan-950/20",
  BANDITS: "border-l-red-600 bg-red-950/20",
  FIRE: "border-l-red-500 bg-red-950/30",
  REINFORCEMENTS: "border-l-blue-500 bg-blue-950/20",
  REBELLION: "border-l-red-700 bg-red-950/20",
  HOLY_RELIC: "border-l-yellow-400 bg-yellow-950/20",
  MERCENARY: "border-l-stone-500 bg-stone-950/20",
  FLOOD: "border-l-blue-600 bg-blue-950/30",
  TREACHERY: "border-l-purple-500 bg-purple-950/20",
  SIEGE_WEAPON_FOUND: "border-l-stone-400 bg-stone-950/20",
  VICTORY: "border-l-gold bg-amber-950/30",
};

function formatEffect(json: string): string | null {
  try {
    const effect = JSON.parse(json);
    const entries = Object.entries(effect);
    if (entries.length === 0) return null;
    const icons: Record<string, string> = { wood:"🌲", stone:"⛏", iron:"⚒", grain:"🌾", straw:"🪶", adobe:"🧱", silver:"🪙", gold:"💰" };
    return entries.map(([k, v]) => {
      const n = v as number;
      return `${icons[k] ?? k} ${n > 0 ? `+${n}` : n}`;
    }).join("  ");
  } catch { return null; }
}

export default function EventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [events, setEvents] = useState<GameEvent[]>([]);

  useEffect(() => {
    fetch(`/api/game/${id}/events`).then(r => r.json()).then(d => setEvents(d.events ?? []));
    // Mark all read
    fetch(`/api/game/${id}/events`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_ALL_READ" }),
    });
  }, [id]);

  return (
    <div className="min-h-screen">
      <header className="banner px-4 py-3 flex items-center gap-3">
        <Link href={`/game/${id}`} className="text-parchment-aged hover:text-gold-bright text-sm italic">← Volver al mapa</Link>
        <span className="text-2xl">📜</span>
        <h1 className="font-display title-gold text-lg">Crónica de sucesos</h1>
        <span className="text-parchment-aged text-xs italic ml-auto">{events.length} eventos registrados</span>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-3">
        {events.length === 0 && (
          <div className="parchment p-10 text-center space-y-2">
            <div className="text-5xl">📜</div>
            <p className="font-display text-ink text-xl">La crónica está vacía</p>
            <p className="text-ink-soft text-sm italic">Los sucesos del reino aparecerán aquí conforme avance el tiempo.</p>
          </div>
        )}

        {events.map(ev => {
          const effect = formatEffect(ev.effectJson);
          const colorClass = EVENT_COLORS[ev.type] ?? "border-l-bronze bg-stone-950/20";
          const icon = EVENT_ICONS[ev.type] ?? "📜";
          return (
            <div key={ev.id} className={`parchment p-4 border-l-4 ${colorClass} space-y-2`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <h3 className="font-display text-ink">{ev.title}</h3>
                </div>
                <span className="text-xs text-ink-soft italic whitespace-nowrap flex-shrink-0">
                  {new Date(ev.createdAt).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-ink-soft text-sm italic leading-relaxed">{ev.description}</p>
              {effect && (
                <div className="flex items-center gap-2 pt-1 border-t border-bronze/30">
                  <span className="text-xs text-parchment-dark uppercase tracking-wider">Efecto:</span>
                  <span className="font-display text-sm text-gold-pale">{effect}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
