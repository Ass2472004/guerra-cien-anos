// ─── FACCIONES DEL MUNDO NAHKOR ──────────────────────────────────────────────
// PORTADORES — Los portadores de espadas Nahkor. Oscuridad y poder místico.
// IMPERIO    — El Imperio Matriarcal. Disciplina, dragones y orden.
// FEDERACION — La Federación de Rha'miras. Mercaderes, marineros y mercenarios.

export type TroopRole = "OFF" | "DEF" | "SPY" | "SIEGE" | "SPECIAL";
export type Faction = "PORTADORES" | "IMPERIO" | "FEDERACION";

export interface TroopDef {
  key: string;
  name: string;
  faction: Faction;
  role: TroopRole;
  attack: number;
  defense: number;
  speed: number;      // tiles por tick
  carry: number;      // capacidad de carga
  grainCost: number;  // grano por tick de mantenimiento
  cost: { wood: number; stone: number; iron: number; grain: number; silver: number };
  trainTime: number;  // segundos en entrenar 1 unidad
  description: string;
}

export const TROOPS: Record<string, TroopDef> = {

  // ─── PORTADORES ──────────────────────────────────────────────────────────────
  // Expertos en la oscuridad, espionaje y poder de las espadas Nahkor.
  LANCERO_OSCURO: {
    key: "LANCERO_OSCURO", name: "Lancero de la Oscuridad", faction: "PORTADORES", role: "DEF",
    attack: 8, defense: 22, speed: 2, carry: 30, grainCost: 1,
    cost: { wood: 40, stone: 0, iron: 10, grain: 20, silver: 0 },
    trainTime: 60, description: "Infantería básica curtida en los días de Nahkor. Combate bien en la oscuridad.",
  },
  GUERRERO_SOMBRA: {
    key: "GUERRERO_SOMBRA", name: "Guerrero Sombra", faction: "PORTADORES", role: "DEF",
    attack: 15, defense: 48, speed: 2, carry: 25, grainCost: 1,
    cost: { wood: 60, stone: 20, iron: 30, grain: 30, silver: 0 },
    trainTime: 90, description: "Portador de escudo oscuro. La oscuridad les hace imprevisibles.",
  },
  ARQUERO_NAHKOR: {
    key: "ARQUERO_NAHKOR", name: "Arquero Nahkor", faction: "PORTADORES", role: "DEF",
    attack: 30, defense: 38, speed: 2, carry: 30, grainCost: 1,
    cost: { wood: 80, stone: 0, iron: 45, grain: 35, silver: 5 },
    trainTime: 110, description: "Arquero entrenado para disparar en la oscuridad de los días sin luz.",
  },
  FLECHA_KOR: {
    key: "FLECHA_KOR", name: "Flecha de Kor", faction: "PORTADORES", role: "OFF",
    attack: 72, defense: 18, speed: 3, carry: 50, grainCost: 1,
    cost: { wood: 100, stone: 0, iron: 40, grain: 50, silver: 0 },
    trainTime: 130, description: "Arquero de élite que canaliza la luz de Kor en cada disparo. Devastador.",
  },
  ESPÍA_OSCURO: {
    key: "ESPÍA_OSCURO", name: "Espía de la Oscuridad", faction: "PORTADORES", role: "SPY",
    attack: 5, defense: 10, speed: 8, carry: 20, grainCost: 1,
    cost: { wood: 30, stone: 0, iron: 20, grain: 60, silver: 5 },
    trainTime: 80, description: "Se mueve durante la Nahkor sin ser visto. El mejor espía del mundo.",
  },
  JINETE_OSCURO: {
    key: "JINETE_OSCURO", name: "Jinete Oscuro", faction: "PORTADORES", role: "OFF",
    attack: 60, defense: 28, speed: 6, carry: 45, grainCost: 2,
    cost: { wood: 50, stone: 0, iron: 60, grain: 85, silver: 10 },
    trainTime: 160, description: "Caballería que elude la visión del enemigo. Veloz y letal.",
  },
  PORTADOR_NOVICIO: {
    key: "PORTADOR_NOVICIO", name: "Portador Novicio", faction: "PORTADORES", role: "OFF",
    attack: 82, defense: 48, speed: 2, carry: 60, grainCost: 2,
    cost: { wood: 80, stone: 40, iron: 100, grain: 70, silver: 0 },
    trainTime: 200, description: "Primer portador de una espada Nahkor. Su hoja oscila entre el negro y el carmesí.",
  },
  PORTADOR_MAESTRO: {
    key: "PORTADOR_MAESTRO", name: "Portador Maestro", faction: "PORTADORES", role: "OFF",
    attack: 115, defense: 62, speed: 5, carry: 80, grainCost: 3,
    cost: { wood: 100, stone: 50, iron: 130, grain: 100, silver: 20 },
    trainTime: 300, description: "Un portador cuya espada ya se ha fusionado con su alma. Casi inmortal.",
  },
  INFILTRADOR_SOMBRA: {
    key: "INFILTRADOR_SOMBRA", name: "Infiltrador Sombra", faction: "PORTADORES", role: "SPY",
    attack: 8, defense: 12, speed: 7, carry: 20, grainCost: 1,
    cost: { wood: 30, stone: 0, iron: 20, grain: 50, silver: 20 },
    trainTime: 90, description: "Especialista en cortar líneas de suministro. Invisible en la Nahkor.",
  },
  INGENIERO_OSCURO: {
    key: "INGENIERO_OSCURO", name: "Ingeniero de Asedio", faction: "PORTADORES", role: "SIEGE",
    attack: 30, defense: 15, speed: 1, carry: 20, grainCost: 2,
    cost: { wood: 150, stone: 100, iron: 80, grain: 60, silver: 10 },
    trainTime: 400, description: "Desmonta murallas usando el conocimiento de los días oscuros.",
  },
  CATAPULTA_KOR: {
    key: "CATAPULTA_KOR", name: "Catapulta de Kor", faction: "PORTADORES", role: "SIEGE",
    attack: 200, defense: 10, speed: 1, carry: 0, grainCost: 3,
    cost: { wood: 300, stone: 200, iron: 150, grain: 100, silver: 20 },
    trainTime: 600, description: "Proyecta fragmentos de roca impregnados con la oscuridad de la Nahkor.",
  },

  // ─── IMPERIO ──────────────────────────────────────────────────────────────────
  // El Imperio Matriarcal regido por la espada de la nada. Disciplina y dragones.
  SOLDADO_IMPERIAL: {
    key: "SOLDADO_IMPERIAL", name: "Soldado Imperial", faction: "IMPERIO", role: "DEF",
    attack: 10, defense: 22, speed: 2, carry: 30, grainCost: 1,
    cost: { wood: 40, stone: 0, iron: 10, grain: 20, silver: 0 },
    trainTime: 60, description: "La infantería estándar del Imperio. Disciplinada y leal a la Emperatriz.",
  },
  LANCERA_IMPERIAL: {
    key: "LANCERA_IMPERIAL", name: "Lancera Imperial", faction: "IMPERIO", role: "DEF",
    attack: 12, defense: 55, speed: 2, carry: 25, grainCost: 1,
    cost: { wood: 70, stone: 20, iron: 35, grain: 30, silver: 0 },
    trainTime: 90, description: "Lancera de la guardia imperial. Rompe las cargas de caballería.",
  },
  JINETE_IMPERIAL: {
    key: "JINETE_IMPERIAL", name: "Jinete Imperial", faction: "IMPERIO", role: "OFF",
    attack: 55, defense: 32, speed: 5, carry: 50, grainCost: 2,
    cost: { wood: 60, stone: 0, iron: 70, grain: 90, silver: 0 },
    trainTime: 180, description: "Caballería de hostigamiento del Imperio. Hija de los viejos jinetes de dragón.",
  },
  ARQUERA_IMPERIAL: {
    key: "ARQUERA_IMPERIAL", name: "Arquera Imperial", faction: "IMPERIO", role: "OFF",
    attack: 68, defense: 22, speed: 2, carry: 40, grainCost: 1,
    cost: { wood: 90, stone: 0, iron: 55, grain: 40, silver: 15 },
    trainTime: 140, description: "Arquera de élite entrenada bajo la luz de Kor. Precisión mortal.",
  },
  ESPÍA_IMPERIAL: {
    key: "ESPÍA_IMPERIAL", name: "Espía Imperial", faction: "IMPERIO", role: "SPY",
    attack: 8, defense: 12, speed: 7, carry: 20, grainCost: 1,
    cost: { wood: 30, stone: 0, iron: 20, grain: 50, silver: 20 },
    trainTime: 90, description: "Agente de la Emperatriz. Penetra en las cortes rivales sin dejar rastro.",
  },
  GUARDIA_EMPERATRIZ: {
    key: "GUARDIA_EMPERATRIZ", name: "Guardia de la Emperatriz", faction: "IMPERIO", role: "DEF",
    attack: 30, defense: 42, speed: 4, carry: 45, grainCost: 2,
    cost: { wood: 60, stone: 0, iron: 50, grain: 70, silver: 0 },
    trainTime: 150, description: "La guardia personal de la familia imperial. Devota y formidable.",
  },
  SOLDADO_ELITE: {
    key: "SOLDADO_ELITE", name: "Soldado de Élite", faction: "IMPERIO", role: "OFF",
    attack: 88, defense: 48, speed: 2, carry: 60, grainCost: 2,
    cost: { wood: 80, stone: 40, iron: 110, grain: 70, silver: 0 },
    trainTime: 210, description: "Soldado imperial de primera línea. Entrenado desde la infancia.",
  },
  JINETE_DRAGON: {
    key: "JINETE_DRAGON", name: "Jinete de Dragón", faction: "IMPERIO", role: "OFF",
    attack: 122, defense: 68, speed: 5, carry: 80, grainCost: 3,
    cost: { wood: 110, stone: 60, iron: 140, grain: 110, silver: 25 },
    trainTime: 320, description: "Los varones de la familia imperial se convierten en jinetes de dragón. Devastadores.",
  },
  EXPLORADORA_IMPERIAL: {
    key: "EXPLORADORA_IMPERIAL", name: "Exploradora Imperial", faction: "IMPERIO", role: "SPY",
    attack: 5, defense: 10, speed: 8, carry: 20, grainCost: 1,
    cost: { wood: 30, stone: 0, iron: 20, grain: 60, silver: 5 },
    trainTime: 80, description: "Exploradora rápida del Imperio. Mapea territorio enemigo.",
  },
  INGENIERO_IMPERIAL: {
    key: "INGENIERO_IMPERIAL", name: "Ingeniero Imperial", faction: "IMPERIO", role: "SIEGE",
    attack: 35, defense: 15, speed: 1, carry: 20, grainCost: 2,
    cost: { wood: 140, stone: 100, iron: 90, grain: 60, silver: 10 },
    trainTime: 380, description: "Especialista imperial en derribo de murallas y asedios.",
  },
  GUIVERNO_ASEDIO: {
    key: "GUIVERNO_ASEDIO", name: "Guiverno de Asedio", faction: "IMPERIO", role: "SIEGE",
    attack: 225, defense: 12, speed: 1, carry: 0, grainCost: 3,
    cost: { wood: 200, stone: 300, iron: 250, grain: 100, silver: 50 },
    trainTime: 700, description: "Un guiverno entrenado para destruir fortalezas con su aliento de fuego.",
  },

  // ─── FEDERACION ──────────────────────────────────────────────────────────────
  // La Federación de ciudades marinas Rha'miras. Mercaderes, marineros y mercenarios.
  MARINERO_COMBATE: {
    key: "MARINERO_COMBATE", name: "Marinero de Combate", faction: "FEDERACION", role: "DEF",
    attack: 9, defense: 20, speed: 2, carry: 30, grainCost: 1,
    cost: { wood: 40, stone: 0, iron: 10, grain: 20, silver: 0 },
    trainTime: 60, description: "Marinero endurecido por los mares. Sabe pelear tanto en tierra como en agua.",
  },
  GUARDIAN_PUERTO: {
    key: "GUARDIAN_PUERTO", name: "Guardián del Puerto", faction: "FEDERACION", role: "DEF",
    attack: 10, defense: 62, speed: 2, carry: 20, grainCost: 1,
    cost: { wood: 90, stone: 30, iron: 40, grain: 30, silver: 0 },
    trainTime: 100, description: "Defensor de los puertos mercantiles. Su gran escudo cubre a los ballesteros.",
  },
  BALLESTERO_MAR: {
    key: "BALLESTERO_MAR", name: "Ballestero del Mar", faction: "FEDERACION", role: "OFF",
    attack: 58, defense: 32, speed: 2, carry: 40, grainCost: 1,
    cost: { wood: 75, stone: 0, iron: 50, grain: 35, silver: 5 },
    trainTime: 115, description: "Ballestero mercenario versátil. La Federación los exporta a toda guerra.",
  },
  MERCENARIO_MERXIAS: {
    key: "MERCENARIO_MERXIAS", name: "Mercenario de Merxias", faction: "FEDERACION", role: "OFF",
    attack: 68, defense: 28, speed: 4, carry: 45, grainCost: 1,
    cost: { wood: 80, stone: 0, iron: 45, grain: 45, silver: 0 },
    trainTime: 130, description: "Mercenario de las islas de Merxias. Rápido, brutal y barato en emboscadas.",
  },
  JINETE_MERCANTE: {
    key: "JINETE_MERCANTE", name: "Jinete Mercante", faction: "FEDERACION", role: "OFF",
    attack: 62, defense: 24, speed: 7, carry: 55, grainCost: 2,
    cost: { wood: 55, stone: 0, iron: 65, grain: 95, silver: 0 },
    trainTime: 170, description: "Caballería ligera de las rutas comerciales. El más veloz del mundo conocido.",
  },
  ESPADA_ALQUILER: {
    key: "ESPADA_ALQUILER", name: "Espada de Alquiler", faction: "FEDERACION", role: "OFF",
    attack: 78, defense: 28, speed: 5, carry: 50, grainCost: 2,
    cost: { wood: 80, stone: 0, iron: 80, grain: 100, silver: 10 },
    trainTime: 220, description: "Mercenario de élite que combate por quien mejor paga. Único de la Federación.",
  },
  SOLDADO_MERCADO: {
    key: "SOLDADO_MERCADO", name: "Soldado de Mercado", faction: "FEDERACION", role: "OFF",
    attack: 92, defense: 50, speed: 4, carry: 65, grainCost: 2,
    cost: { wood: 85, stone: 45, iron: 115, grain: 75, silver: 0 },
    trainTime: 220, description: "Soldado profesional de los senados de la Federación.",
  },
  SENADOR_ARMADO: {
    key: "SENADOR_ARMADO", name: "Guardia del Senado", faction: "FEDERACION", role: "DEF",
    attack: 72, defense: 98, speed: 4, carry: 70, grainCost: 3,
    cost: { wood: 120, stone: 80, iron: 150, grain: 120, silver: 30 },
    trainTime: 380, description: "La élite de la Federación. Defensa inquebrantable respaldada por el oro de Merxias.",
  },
  ESPÍA_COMERCIO: {
    key: "ESPÍA_COMERCIO", name: "Espía Comercial", faction: "FEDERACION", role: "SPY",
    attack: 10, defense: 15, speed: 8, carry: 25, grainCost: 1,
    cost: { wood: 35, stone: 0, iron: 25, grain: 55, silver: 10 },
    trainTime: 80, description: "Agente comercial disfrazado de mercader. Infiltrado y silencioso.",
  },
  ARIETE_NAVAL: {
    key: "ARIETE_NAVAL", name: "Ariete Naval", faction: "FEDERACION", role: "SIEGE",
    attack: 185, defense: 10, speed: 1, carry: 0, grainCost: 3,
    cost: { wood: 180, stone: 250, iron: 200, grain: 90, silver: 40 },
    trainTime: 650, description: "Ariete construido con madera de los bosques del Mar Allende.",
  },
  CANONERO_MIRAS: {
    key: "CANONERO_MIRAS", name: "Cañonero de Miras", faction: "FEDERACION", role: "SPECIAL",
    attack: 42, defense: 38, speed: 3, carry: 60, grainCost: 1,
    cost: { wood: 100, stone: 0, iron: 50, grain: 50, silver: 20 },
    trainTime: 160, description: "La flota de Rha'miras que domina el Mar Allende. Bonus en ríos y costas.",
  },
};

export const TROOPS_BY_FACTION: Record<Faction, string[]> = {
  PORTADORES: [
    "LANCERO_OSCURO","GUERRERO_SOMBRA","ARQUERO_NAHKOR","FLECHA_KOR",
    "ESPÍA_OSCURO","JINETE_OSCURO","PORTADOR_NOVICIO","PORTADOR_MAESTRO",
    "INFILTRADOR_SOMBRA","INGENIERO_OSCURO","CATAPULTA_KOR",
  ],
  IMPERIO: [
    "SOLDADO_IMPERIAL","LANCERA_IMPERIAL","JINETE_IMPERIAL","ARQUERA_IMPERIAL",
    "ESPÍA_IMPERIAL","GUARDIA_EMPERATRIZ","SOLDADO_ELITE","JINETE_DRAGON",
    "EXPLORADORA_IMPERIAL","INGENIERO_IMPERIAL","GUIVERNO_ASEDIO",
  ],
  FEDERACION: [
    "MARINERO_COMBATE","GUARDIAN_PUERTO","BALLESTERO_MAR","MERCENARIO_MERXIAS",
    "JINETE_MERCANTE","ESPADA_ALQUILER","SOLDADO_MERCADO","SENADOR_ARMADO",
    "ESPÍA_COMERCIO","ARIETE_NAVAL","CANONERO_MIRAS",
  ],
};
