// Iconos visuales para cada tropa del mundo Nahkor

export const TROOP_ICONS: Record<string, string> = {
  // PORTADORES — oscuridad y espadas Nahkor
  LANCERO_OSCURO:     "🗡",
  GUERRERO_SOMBRA:    "🛡",
  ARQUERO_NAHKOR:     "🏹",
  FLECHA_KOR:         "🎯",
  ESPÍA_OSCURO:       "🥷",
  JINETE_OSCURO:      "🐺",
  PORTADOR_NOVICIO:   "⚔",
  PORTADOR_MAESTRO:   "🌑",
  INFILTRADOR_SOMBRA: "👤",
  INGENIERO_OSCURO:   "⚙",
  CATAPULTA_KOR:      "🪨",

  // IMPERIO — disciplina, dragones, orden
  SOLDADO_IMPERIAL:    "⚔",
  LANCERA_IMPERIAL:    "🗡",
  JINETE_IMPERIAL:     "🐎",
  ARQUERA_IMPERIAL:    "🏹",
  ESPÍA_IMPERIAL:      "🕵",
  GUARDIA_EMPERATRIZ:  "👑",
  SOLDADO_ELITE:       "🛡",
  JINETE_DRAGON:       "🐉",
  EXPLORADORA_IMPERIAL:"🦅",
  INGENIERO_IMPERIAL:  "🔨",
  GUIVERNO_ASEDIO:     "🐲",

  // FEDERACION — comercio, mar, mercenarios
  MARINERO_COMBATE: "⚓",
  GUARDIAN_PUERTO:  "🛡",
  BALLESTERO_MAR:   "🏹",
  MERCENARIO_MERXIAS:"💰",
  JINETE_MERCANTE:  "🐎",
  ESPADA_ALQUILER:  "⚔",
  SOLDADO_MERCADO:  "🪙",
  SENADOR_ARMADO:   "📜",
  ESPÍA_COMERCIO:   "🕵",
  ARIETE_NAVAL:     "🚢",
  CANONERO_MIRAS:   "💥",
};

// Color de rol para anillos / fondos
export const ROLE_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
  OFF:     { ring: "#dc2626", bg: "from-red-950 to-red-800",       text: "text-red-300" },
  DEF:     { ring: "#2563eb", bg: "from-blue-950 to-blue-800",     text: "text-blue-300" },
  SPY:     { ring: "#7c3aed", bg: "from-purple-950 to-purple-800", text: "text-purple-300" },
  SIEGE:   { ring: "#ea580c", bg: "from-orange-950 to-orange-800", text: "text-orange-300" },
  SPECIAL: { ring: "#d9a847", bg: "from-amber-950 to-amber-800",   text: "text-amber-300" },
};

// Colores por facción (gradiente de fondo del retrato)
export const FACTION_VISUALS: Record<string, { gradient: string; ring: string; accent: string; emoji: string; flag: string; }> = {
  PORTADORES: {
    gradient: "linear-gradient(135deg, #1a0820 0%, #4a1a3a 50%, #1a0820 100%)",
    ring: "#9333ea",
    accent: "text-violet-300",
    emoji: "🌑",
    flag: "🏴",
  },
  IMPERIO: {
    gradient: "linear-gradient(135deg, #2a1a05 0%, #b8862f 50%, #2a1a05 100%)",
    ring: "#d9a847",
    accent: "text-amber-300",
    emoji: "👑",
    flag: "🟨",
  },
  FEDERACION: {
    gradient: "linear-gradient(135deg, #042f3a 0%, #0e7490 50%, #042f3a 100%)",
    ring: "#22d3ee",
    accent: "text-teal-300",
    emoji: "⚓",
    flag: "🟦",
  },
};
