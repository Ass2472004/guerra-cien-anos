export type TroopRole = "OFF" | "DEF" | "SPY" | "SIEGE" | "SPECIAL";
export type Faction = "ENGLAND" | "FRANCE" | "SPAIN";

export interface TroopDef {
  key: string;
  name: string;
  faction: Faction;
  role: TroopRole;
  attack: number;
  defense: number;
  speed: number;      // tiles per tick
  carry: number;      // resource carry capacity
  grainCost: number;  // grain per tick upkeep
  cost: { wood: number; stone: number; iron: number; grain: number; silver: number };
  trainTime: number;  // seconds to train 1 unit
  description: string;
}

export const TROOPS: Record<string, TroopDef> = {
  // ─── ENGLAND ─────────────────────────────────────────────────────────────
  LEVY: {
    key: "LEVY", name: "Leva", faction: "ENGLAND", role: "DEF",
    attack: 8, defense: 20, speed: 2, carry: 30, grainCost: 1,
    cost: { wood: 40, stone: 0, iron: 10, grain: 20, silver: 0 },
    trainTime: 60, description: "Milicia rural, barata y débil.",
  },
  WELSH_SPEARMAN: {
    key: "WELSH_SPEARMAN", name: "Lancero galés", faction: "ENGLAND", role: "DEF",
    attack: 15, defense: 45, speed: 2, carry: 25, grainCost: 1,
    cost: { wood: 60, stone: 20, iron: 30, grain: 30, silver: 0 },
    trainTime: 90, description: "Sólida defensa anti-caballería.",
  },
  SERGEANT_ENG: {
    key: "SERGEANT_ENG", name: "Sargento", faction: "ENGLAND", role: "DEF",
    attack: 25, defense: 35, speed: 2, carry: 40, grainCost: 1,
    cost: { wood: 70, stone: 10, iron: 40, grain: 40, silver: 0 },
    trainTime: 100, description: "Infantería media versátil.",
  },
  CROSSBOWMAN_ENG: {
    key: "CROSSBOWMAN_ENG", name: "Ballestero", faction: "ENGLAND", role: "DEF",
    attack: 30, defense: 40, speed: 2, carry: 30, grainCost: 1,
    cost: { wood: 80, stone: 0, iron: 50, grain: 35, silver: 5 },
    trainTime: 110, description: "Fuego de hostigamiento a distancia.",
  },
  LONGBOWMAN: {
    key: "LONGBOWMAN", name: "Arquero largo", faction: "ENGLAND", role: "OFF",
    attack: 70, defense: 20, speed: 3, carry: 50, grainCost: 1,
    cost: { wood: 100, stone: 0, iron: 40, grain: 50, silver: 0 },
    trainTime: 130, description: "La joya inglesa. Devastador en Crécy y Agincourt.",
  },
  HOBELAR: {
    key: "HOBELAR", name: "Hobelar", faction: "ENGLAND", role: "SPY",
    attack: 20, defense: 25, speed: 6, carry: 40, grainCost: 2,
    cost: { wood: 50, stone: 0, iron: 60, grain: 80, silver: 10 },
    trainTime: 150, description: "Caballería ligera rápida, ideal para espionaje.",
  },
  MAN_AT_ARMS_ENG: {
    key: "MAN_AT_ARMS_ENG", name: "Hombre de armas", faction: "ENGLAND", role: "OFF",
    attack: 80, defense: 50, speed: 2, carry: 60, grainCost: 2,
    cost: { wood: 80, stone: 40, iron: 100, grain: 70, silver: 0 },
    trainTime: 200, description: "Caballero desmontado, potencia de choque.",
  },
  KNIGHT_ENG: {
    key: "KNIGHT_ENG", name: "Caballero", faction: "ENGLAND", role: "OFF",
    attack: 110, defense: 60, speed: 5, carry: 80, grainCost: 3,
    cost: { wood: 100, stone: 50, iron: 130, grain: 100, silver: 20 },
    trainTime: 300, description: "Caballería pesada. Carga aplastante.",
  },
  SCOUT_ENG: {
    key: "SCOUT_ENG", name: "Scout", faction: "ENGLAND", role: "SPY",
    attack: 5, defense: 10, speed: 8, carry: 20, grainCost: 1,
    cost: { wood: 30, stone: 0, iron: 20, grain: 60, silver: 5 },
    trainTime: 80, description: "Espía a caballo, muy rápido.",
  },
  ENGINEER_ENG: {
    key: "ENGINEER_ENG", name: "Ingeniero de asedio", faction: "ENGLAND", role: "SIEGE",
    attack: 30, defense: 15, speed: 1, carry: 20, grainCost: 2,
    cost: { wood: 150, stone: 100, iron: 80, grain: 60, silver: 10 },
    trainTime: 400, description: "Daña murallas enemigas.",
  },
  TREBUCHET_ENG: {
    key: "TREBUCHET_ENG", name: "Trebuchet", faction: "ENGLAND", role: "SIEGE",
    attack: 200, defense: 10, speed: 1, carry: 0, grainCost: 3,
    cost: { wood: 300, stone: 200, iron: 150, grain: 100, silver: 20 },
    trainTime: 600, description: "Destruye edificios enemigos con gran alcance.",
  },

  // ─── FRANCE ──────────────────────────────────────────────────────────────
  PIETAILLE: {
    key: "PIETAILLE", name: "Piétaille", faction: "FRANCE", role: "DEF",
    attack: 10, defense: 22, speed: 2, carry: 30, grainCost: 1,
    cost: { wood: 40, stone: 0, iron: 10, grain: 20, silver: 0 },
    trainTime: 60, description: "Infantería de leva francesa.",
  },
  PIKEMAN_FRA: {
    key: "PIKEMAN_FRA", name: "Piquero", faction: "FRANCE", role: "DEF",
    attack: 12, defense: 55, speed: 2, carry: 25, grainCost: 1,
    cost: { wood: 70, stone: 20, iron: 35, grain: 30, silver: 0 },
    trainTime: 90, description: "Rompe cargas de caballería.",
  },
  MOUNTED_SERGEANT: {
    key: "MOUNTED_SERGEANT", name: "Sargento montado", faction: "FRANCE", role: "DEF",
    attack: 30, defense: 40, speed: 4, carry: 45, grainCost: 2,
    cost: { wood: 60, stone: 0, iron: 50, grain: 70, silver: 0 },
    trainTime: 150, description: "Infantería media a caballo.",
  },
  GENOESE_CROSSBOWMAN: {
    key: "GENOESE_CROSSBOWMAN", name: "Ballestero genovés", faction: "FRANCE", role: "OFF",
    attack: 65, defense: 25, speed: 2, carry: 40, grainCost: 1,
    cost: { wood: 90, stone: 0, iron: 55, grain: 40, silver: 15 },
    trainTime: 140, description: "Mercenarios genoveses. Precisión mortal.",
  },
  FRANC_ARCHER: {
    key: "FRANC_ARCHER", name: "Franc-archer", faction: "FRANCE", role: "OFF",
    attack: 50, defense: 15, speed: 3, carry: 40, grainCost: 1,
    cost: { wood: 70, stone: 0, iron: 30, grain: 35, silver: 0 },
    trainTime: 100, description: "Arqueros libres de Carlos VII. Baratos y ágiles.",
  },
  MAN_AT_ARMS_FRA: {
    key: "MAN_AT_ARMS_FRA", name: "Hombre de armas", faction: "FRANCE", role: "OFF",
    attack: 85, defense: 45, speed: 2, carry: 60, grainCost: 2,
    cost: { wood: 80, stone: 40, iron: 110, grain: 70, silver: 0 },
    trainTime: 210, description: "Infantería pesada francesa.",
  },
  LIGHT_HORSEMAN_FRA: {
    key: "LIGHT_HORSEMAN_FRA", name: "Jinete ligero", faction: "FRANCE", role: "OFF",
    attack: 55, defense: 30, speed: 5, carry: 50, grainCost: 2,
    cost: { wood: 60, stone: 0, iron: 70, grain: 90, silver: 0 },
    trainTime: 180, description: "Caballería rápida de hostigamiento.",
  },
  CHEVALIER: {
    key: "CHEVALIER", name: "Chevalier", faction: "FRANCE", role: "OFF",
    attack: 120, defense: 70, speed: 5, carry: 80, grainCost: 3,
    cost: { wood: 110, stone: 60, iron: 140, grain: 110, silver: 25 },
    trainTime: 320, description: "La élite francesa. Caballero pesado devastador.",
  },
  COURT_SPY: {
    key: "COURT_SPY", name: "Espía de corte", faction: "FRANCE", role: "SPY",
    attack: 8, defense: 12, speed: 7, carry: 20, grainCost: 1,
    cost: { wood: 30, stone: 0, iron: 20, grain: 50, silver: 20 },
    trainTime: 90, description: "Espía político. Alto sigilo.",
  },
  BOMBARD_BUREAU: {
    key: "BOMBARD_BUREAU", name: "Bombarda de Bureau", faction: "FRANCE", role: "SIEGE",
    attack: 220, defense: 10, speed: 1, carry: 0, grainCost: 3,
    cost: { wood: 200, stone: 300, iron: 250, grain: 100, silver: 50 },
    trainTime: 700, description: "Artillería de Jean Bureau. Arrasó fortalezas inglesas.",
  },
  SIEGE_ENGINEER_FRA: {
    key: "SIEGE_ENGINEER_FRA", name: "Ingeniero de asedio", faction: "FRANCE", role: "SIEGE",
    attack: 35, defense: 15, speed: 1, carry: 20, grainCost: 2,
    cost: { wood: 140, stone: 100, iron: 90, grain: 60, silver: 10 },
    trainTime: 380, description: "Especialista en derribo de murallas.",
  },

  // ─── SPAIN ───────────────────────────────────────────────────────────────
  PEON: {
    key: "PEON", name: "Peón", faction: "SPAIN", role: "DEF",
    attack: 9, defense: 18, speed: 2, carry: 30, grainCost: 1,
    cost: { wood: 40, stone: 0, iron: 10, grain: 20, silver: 0 },
    trainTime: 60, description: "Infantería básica castellana.",
  },
  ALMOGAVAR: {
    key: "ALMOGAVAR", name: "Almogávar", faction: "SPAIN", role: "OFF",
    attack: 65, defense: 30, speed: 4, carry: 45, grainCost: 1,
    cost: { wood: 80, stone: 0, iron: 45, grain: 45, silver: 0 },
    trainTime: 130, description: "Élite de choque. Rápidos y brutales en emboscadas.",
  },
  BALLESTERO_SPA: {
    key: "BALLESTERO_SPA", name: "Ballestero", faction: "SPAIN", role: "OFF",
    attack: 55, defense: 35, speed: 2, carry: 40, grainCost: 1,
    cost: { wood: 75, stone: 0, iron: 50, grain: 35, silver: 5 },
    trainTime: 115, description: "Ballestero castellano versátil.",
  },
  PAVESERO: {
    key: "PAVESERO", name: "Pavesero", faction: "SPAIN", role: "DEF",
    attack: 10, defense: 60, speed: 2, carry: 20, grainCost: 1,
    cost: { wood: 90, stone: 30, iron: 40, grain: 30, silver: 0 },
    trainTime: 100, description: "Escudo grande. Protege a los ballesteros.",
  },
  JINETE: {
    key: "JINETE", name: "Jinete", faction: "SPAIN", role: "OFF",
    attack: 60, defense: 25, speed: 7, carry: 55, grainCost: 2,
    cost: { wood: 55, stone: 0, iron: 65, grain: 95, silver: 0 },
    trainTime: 170, description: "Caballería ligera con tácticas moriscas. Rapidísimo.",
  },
  MOUNTED_CROSSBOWMAN: {
    key: "MOUNTED_CROSSBOWMAN", name: "Ballestero a caballo", faction: "SPAIN", role: "OFF",
    attack: 75, defense: 30, speed: 5, carry: 50, grainCost: 2,
    cost: { wood: 80, stone: 0, iron: 80, grain: 100, silver: 10 },
    trainTime: 220, description: "Fuego de ballesta desde el caballo. Único de España.",
  },
  MAN_AT_ARMS_SPA: {
    key: "MAN_AT_ARMS_SPA", name: "Hombre de armas", faction: "SPAIN", role: "OFF",
    attack: 90, defense: 50, speed: 4, carry: 65, grainCost: 2,
    cost: { wood: 85, stone: 45, iron: 115, grain: 75, silver: 0 },
    trainTime: 220, description: "Caballería pesada castellana.",
  },
  KNIGHT_SANTIAGO: {
    key: "KNIGHT_SANTIAGO", name: "Caballero de Santiago", faction: "SPAIN", role: "DEF",
    attack: 70, defense: 100, speed: 4, carry: 70, grainCost: 3,
    cost: { wood: 120, stone: 80, iron: 150, grain: 120, silver: 30 },
    trainTime: 380, description: "Orden Militar. Defensa élite con fe inquebrantable.",
  },
  ALMOGAVAR_SPY: {
    key: "ALMOGAVAR_SPY", name: "Espía almogávar", faction: "SPAIN", role: "SPY",
    attack: 10, defense: 15, speed: 8, carry: 25, grainCost: 1,
    cost: { wood: 35, stone: 0, iron: 25, grain: 55, silver: 10 },
    trainTime: 80, description: "Infiltrador rápido y silencioso.",
  },
  LOMBARD_SPA: {
    key: "LOMBARD_SPA", name: "Lombarda", faction: "SPAIN", role: "SIEGE",
    attack: 180, defense: 10, speed: 1, carry: 0, grainCost: 3,
    cost: { wood: 180, stone: 250, iron: 200, grain: 90, silver: 40 },
    trainTime: 650, description: "Artillería temprana castellana.",
  },
  CASTILIAN_SAILOR: {
    key: "CASTILIAN_SAILOR", name: "Marinero de Castilla", faction: "SPAIN", role: "SPECIAL",
    attack: 40, defense: 40, speed: 3, carry: 60, grainCost: 1,
    cost: { wood: 100, stone: 0, iron: 50, grain: 50, silver: 20 },
    trainTime: 160, description: "Flota que destruyó a Inglaterra en La Rochelle (1372). Bonus en costas.",
  },
};

export const TROOPS_BY_FACTION: Record<Faction, string[]> = {
  ENGLAND: [
    "LEVY","WELSH_SPEARMAN","SERGEANT_ENG","CROSSBOWMAN_ENG","LONGBOWMAN",
    "HOBELAR","MAN_AT_ARMS_ENG","KNIGHT_ENG","SCOUT_ENG","ENGINEER_ENG","TREBUCHET_ENG",
  ],
  FRANCE: [
    "PIETAILLE","PIKEMAN_FRA","MOUNTED_SERGEANT","GENOESE_CROSSBOWMAN","FRANC_ARCHER",
    "MAN_AT_ARMS_FRA","LIGHT_HORSEMAN_FRA","CHEVALIER","COURT_SPY","BOMBARD_BUREAU","SIEGE_ENGINEER_FRA",
  ],
  SPAIN: [
    "PEON","ALMOGAVAR","BALLESTERO_SPA","PAVESERO","JINETE","MOUNTED_CROSSBOWMAN",
    "MAN_AT_ARMS_SPA","KNIGHT_SANTIAGO","ALMOGAVAR_SPY","LOMBARD_SPA","CASTILIAN_SAILOR",
  ],
};
