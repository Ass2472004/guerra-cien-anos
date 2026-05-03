// Títulos de nobleza del Mundo Nahkor
// El sistema se basa en el control de aldeas y el prestigio acumulado

export type NobilityTitle = "LORD" | "BARON" | "COUNT" | "DUKE" | "KING";

export interface NobilityDef {
  key: NobilityTitle;
  label: string;
  labelEs: string;
  icon: string;
  minVillages: number;
  minPrestige: number;
  productionBonus: number;
  attackBonus: number;
  defenseBonus: number;
  recruitBonus: number;
  description: string;
}

export const NOBILITY: Record<NobilityTitle, NobilityDef> = {
  LORD: {
    key: "LORD",
    label: "Vasallo",
    labelEs: "Vasallo",
    icon: "🏡",
    minVillages: 0,
    minPrestige: 0,
    productionBonus: 0,
    attackBonus: 0,
    defenseBonus: 0,
    recruitBonus: 0,
    description: "Un señor menor que ha tomado las riendas de sus primeras tierras en el mundo de Nahkor.",
  },
  BARON: {
    key: "BARON",
    label: "Señor Nahkor",
    labelEs: "Señor Nahkor",
    icon: "🏰",
    minVillages: 2,
    minPrestige: 200,
    productionBonus: 5,
    attackBonus: 0,
    defenseBonus: 5,
    recruitBonus: 5,
    description: "Dueño de varias aldeas. Su nombre comienza a resonar entre los portadores de espadas.",
  },
  COUNT: {
    key: "COUNT",
    label: "Maestro Oscuro",
    labelEs: "Maestro Oscuro",
    icon: "⚜",
    minVillages: 4,
    minPrestige: 600,
    productionBonus: 10,
    attackBonus: 5,
    defenseBonus: 10,
    recruitBonus: 10,
    description: "Gobernante de un dominio entero. Las espadas Nahkor le reconocen como maestro.",
  },
  DUKE: {
    key: "DUKE",
    label: "Gran Portador",
    labelEs: "Gran Portador",
    icon: "👑",
    minVillages: 7,
    minPrestige: 1500,
    productionBonus: 15,
    attackBonus: 10,
    defenseBonus: 15,
    recruitBonus: 15,
    description: "Un gran portador que controla vastas regiones. El Imperio le debe pleitesía.",
  },
  KING: {
    key: "KING",
    label: "Portador de las 256",
    labelEs: "Portador de las 256",
    icon: "⚔👑",
    minVillages: 10,
    minPrestige: 3000,
    productionBonus: 25,
    attackBonus: 20,
    defenseBonus: 20,
    recruitBonus: 20,
    description: "El más alto título. Heredero de las 256 espadas de la oscuridad. El mundo de Nahkor se arrodilla.",
  },
};

export const NOBILITY_ORDER: NobilityTitle[] = ["LORD", "BARON", "COUNT", "DUKE", "KING"];

export function computeTitle(villages: number, prestige: number): NobilityTitle {
  let result: NobilityTitle = "LORD";
  for (const key of NOBILITY_ORDER) {
    const def = NOBILITY[key];
    if (villages >= def.minVillages && prestige >= def.minPrestige) {
      result = key;
    }
  }
  return result;
}

export const PRESTIGE_VILLAGE_CAPTURED = 150;
export const PRESTIGE_BATTLE_WON       = 80;
export const PRESTIGE_BATTLE_DEFENDED  = 50;
export const PRESTIGE_ADVENTURE        = 10;
