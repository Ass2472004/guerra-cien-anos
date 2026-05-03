// Iconos visuales para cada edificio
export const BUILDING_ICONS: Record<string, string> = {
  MAIN_HALL:        "🏛",
  WAREHOUSE:        "📦",
  GRANARY:          "🌾",
  MARKET:           "🪙",
  FORGE:            "🔨",
  BARRACKS:         "⚔",
  STABLES:          "🐎",
  SIEGE_WORKSHOP:   "⚙",
  WATCHTOWER:       "🗼",
  TAVERN:           "🍺",
  CHAPEL:           "✦",
  WALLS:            "🧱",
  RALLY_POINT:      "🚩",
  RESIDENCE:        "🏘",
};

// Color de "categoría" del edificio
export const BUILDING_COLORS: Record<string, { ring: string; bg: string }> = {
  MAIN_HALL:      { ring: "#d9a847", bg: "from-amber-950 to-amber-800" },
  WAREHOUSE:      { ring: "#8b5a2b", bg: "from-amber-950 to-stone-800" },
  GRANARY:        { ring: "#facc15", bg: "from-yellow-950 to-yellow-800" },
  MARKET:         { ring: "#22d3ee", bg: "from-cyan-950 to-cyan-800" },
  FORGE:          { ring: "#fb923c", bg: "from-orange-950 to-orange-800" },
  BARRACKS:       { ring: "#dc2626", bg: "from-red-950 to-red-800" },
  STABLES:        { ring: "#a16207", bg: "from-amber-950 to-amber-700" },
  SIEGE_WORKSHOP: { ring: "#7c3aed", bg: "from-purple-950 to-purple-800" },
  WATCHTOWER:     { ring: "#94a3b8", bg: "from-stone-900 to-stone-700" },
  TAVERN:         { ring: "#a16207", bg: "from-amber-950 to-amber-800" },
  CHAPEL:         { ring: "#e9d094", bg: "from-amber-900 to-amber-700" },
  WALLS:          { ring: "#78716c", bg: "from-stone-900 to-stone-700" },
  RALLY_POINT:    { ring: "#dc2626", bg: "from-red-950 to-red-700" },
  RESIDENCE:      { ring: "#9333ea", bg: "from-purple-950 to-purple-800" },
};
