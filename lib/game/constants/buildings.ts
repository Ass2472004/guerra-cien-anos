export type BuildingType =
  | "MAIN_HALL" | "WAREHOUSE" | "GRANARY" | "MARKET" | "FORGE"
  | "BARRACKS" | "STABLES" | "SIEGE_WORKSHOP" | "WATCHTOWER"
  | "TAVERN" | "CHAPEL" | "WALLS" | "RALLY_POINT" | "RESIDENCE";

export type BuildMaterial = "ADOBE" | "WOOD_STONE" | "IRON_STONE";

export interface BuildingLevel {
  cost: { wood: number; stone: number; iron: number; adobe: number; silver: number };
  time: number; // seconds
  bonus: Record<string, number>; // e.g. { warehouseCap: 500 }
}

export interface BuildingDef {
  key: BuildingType;
  name: string;
  description: string;
  maxLevel: number;
  // material tier: early = adobe, mid = wood+stone, late = iron+stone
  levels: BuildingLevel[];
}

function adobeLvl(lvl: number): BuildingLevel {
  const base = lvl * lvl;
  return {
    cost: { wood: 0, stone: 0, iron: 0, adobe: 60 + base * 20, silver: 0 },
    time: 60 + lvl * 30,
    bonus: {},
  };
}
function woodStoneLvl(lvl: number, bonus: Record<string, number> = {}): BuildingLevel {
  const b = lvl * lvl;
  return {
    cost: { wood: 80 + b * 30, stone: 60 + b * 25, iron: 0, adobe: 0, silver: 0 },
    time: 120 + lvl * 60,
    bonus,
  };
}
function ironStoneLvl(lvl: number, bonus: Record<string, number> = {}): BuildingLevel {
  const b = lvl * lvl;
  return {
    cost: { wood: 60 + b * 20, stone: 100 + b * 40, iron: 80 + b * 30, adobe: 0, silver: 0 },
    time: 300 + lvl * 120,
    bonus,
  };
}

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  MAIN_HALL: {
    key: "MAIN_HALL", name: "Sala Principal", maxLevel: 20,
    description: "El corazón de tu aldea. Sube su nivel para desbloquear el resto de construcciones.",
    levels: Array.from({ length: 20 }, (_, i) => {
      const l = i + 1;
      return {
        cost: { wood: l < 5 ? 0 : 50 * l, stone: l < 5 ? 0 : 40 * l, iron: l < 8 ? 0 : 30 * l, adobe: l < 5 ? 40 + l * 30 : 0, silver: 0 },
        time: 60 + l * 45,
        bonus: { unlockLevel: l },
      };
    }),
  },
  WAREHOUSE: {
    key: "WAREHOUSE", name: "Almacén", maxLevel: 20,
    description: "Aumenta la capacidad de madera, piedra, hierro y plata.",
    levels: Array.from({ length: 20 }, (_, i) => {
      const l = i + 1;
      return {
        cost: { wood: l < 4 ? 0 : 60 * l, stone: l < 4 ? 0 : 40 * l, iron: 0, adobe: l < 4 ? 50 + l * 25 : 0, silver: 0 },
        time: 60 + l * 30,
        bonus: { warehouseCap: l * 500 },
      };
    }),
  },
  GRANARY: {
    key: "GRANARY", name: "Granero", maxLevel: 20,
    description: "Aumenta la capacidad de grano, paja y adobe.",
    levels: Array.from({ length: 20 }, (_, i) => {
      const l = i + 1;
      return {
        cost: { wood: l < 4 ? 0 : 55 * l, stone: l < 4 ? 0 : 35 * l, iron: 0, adobe: l < 4 ? 45 + l * 25 : 0, silver: 0 },
        time: 60 + l * 30,
        bonus: { granaryCap: l * 500 },
      };
    }),
  },
  MARKET: {
    key: "MARKET", name: "Mercado", maxLevel: 10,
    description: "Comercia con aldeas aliadas usando plata y oro.",
    levels: Array.from({ length: 10 }, (_, i) => woodStoneLvl(i + 1, { tradeRoutes: i + 1 })),
  },
  FORGE: {
    key: "FORGE", name: "Forja", maxLevel: 15,
    description: "Mejora las estadísticas de tus tropas.",
    levels: Array.from({ length: 15 }, (_, i) => ironStoneLvl(i + 1, { troopUpgrade: i + 1 })),
  },
  BARRACKS: {
    key: "BARRACKS", name: "Cuartel", maxLevel: 15,
    description: "Entrena infantería. Cada nivel reduce el tiempo de entrenamiento.",
    levels: Array.from({ length: 15 }, (_, i) => {
      const l = i + 1;
      return {
        cost: { wood: l < 4 ? 0 : 70 * l, stone: l < 4 ? 0 : 50 * l, iron: l < 6 ? 0 : 40 * l, adobe: l < 4 ? 60 + l * 30 : 0, silver: 0 },
        time: 120 + l * 60,
        bonus: { trainSpeedBonus: l * 5 },
      };
    }),
  },
  STABLES: {
    key: "STABLES", name: "Cuadras", maxLevel: 15,
    description: "Entrena caballería. Requiere BARRACKS nivel 3.",
    levels: Array.from({ length: 15 }, (_, i) => woodStoneLvl(i + 1, { cavalryTrainBonus: (i + 1) * 5 })),
  },
  SIEGE_WORKSHOP: {
    key: "SIEGE_WORKSHOP", name: "Taller de asedio", maxLevel: 10,
    description: "Construye máquinas de guerra. Requiere MAIN_HALL nivel 10.",
    levels: Array.from({ length: 10 }, (_, i) => ironStoneLvl(i + 1)),
  },
  WATCHTOWER: {
    key: "WATCHTOWER", name: "Torre de vigilancia", maxLevel: 20,
    description: "Detecta espías enemigos. Amplía la visibilidad en el mapa.",
    levels: Array.from({ length: 20 }, (_, i) => {
      const l = i + 1;
      return {
        cost: { wood: l < 4 ? 0 : 45 * l, stone: l < 4 ? 0 : 65 * l, iron: 0, adobe: l < 4 ? 40 + l * 25 : 0, silver: 0 },
        time: 90 + l * 40,
        bonus: { visibility: Math.ceil(l / 2), spyDetection: l * 3 },
      };
    }),
  },
  TAVERN: {
    key: "TAVERN", name: "Taberna", maxLevel: 5,
    description: "Genera lealtad y sube moral de las tropas.",
    levels: Array.from({ length: 5 }, (_, i) => woodStoneLvl(i + 1, { moraleBonus: (i + 1) * 5 })),
  },
  CHAPEL: {
    key: "CHAPEL", name: "Capilla", maxLevel: 5,
    description: "Refuerzo espiritual. Bonus de defensa para tropas en aldea.",
    levels: Array.from({ length: 5 }, (_, i) => woodStoneLvl(i + 1, { defenseBonus: (i + 1) * 5 })),
  },
  WALLS: {
    key: "WALLS", name: "Murallas", maxLevel: 20,
    description: "Multiplica la defensa de todas las tropas en la aldea.",
    levels: Array.from({ length: 20 }, (_, i) => {
      const l = i + 1;
      return {
        cost: { wood: 0, stone: 100 + l * l * 20, iron: l < 8 ? 0 : 50 * l, adobe: l < 3 ? 80 + l * 40 : 0, silver: 0 },
        time: 180 + l * 90,
        bonus: { wallDefense: l * 7 },
      };
    }),
  },
  RALLY_POINT: {
    key: "RALLY_POINT", name: "Punto de reunión", maxLevel: 1,
    description: "Desde aquí envías y gestionas tus ejércitos.",
    levels: [adobeLvl(1)],
  },
  RESIDENCE: {
    key: "RESIDENCE", name: "Residencia", maxLevel: 10,
    description: "Aloja al héroe y permite fundar campamentos.",
    levels: Array.from({ length: 10 }, (_, i) => woodStoneLvl(i + 1, { heroSlots: 1 })),
  },
};

export const BUILDING_UNLOCK: Partial<Record<BuildingType, { building: BuildingType; level: number }>> = {
  STABLES:        { building: "BARRACKS", level: 3 },
  SIEGE_WORKSHOP: { building: "MAIN_HALL", level: 10 },
  MARKET:         { building: "WAREHOUSE", level: 2 },
  FORGE:          { building: "BARRACKS", level: 5 },
  CHAPEL:         { building: "RESIDENCE", level: 2 },
  RESIDENCE:      { building: "MAIN_HALL", level: 3 },
};
