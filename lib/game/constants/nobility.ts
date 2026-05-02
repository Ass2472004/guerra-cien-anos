export type NobilityTitle = "LORD" | "BARON" | "COUNT" | "DUKE" | "KING";

export interface NobilityDef {
  key: NobilityTitle;
  label: string;
  labelEs: string;
  icon: string;
  minVillages: number;
  minPrestige: number;
  productionBonus: number;  // % added to all resource production
  attackBonus: number;      // % added to army attack
  defenseBonus: number;     // % added to army defense
  recruitBonus: number;     // % reduction in training time
  description: string;
}

export const NOBILITY: Record<NobilityTitle, NobilityDef> = {
  LORD: {
    key: "LORD",
    label: "Lord",
    labelEs: "Señor",
    icon: "🏡",
    minVillages: 0,
    minPrestige: 0,
    productionBonus: 0,
    attackBonus: 0,
    defenseBonus: 0,
    recruitBonus: 0,
    description: "Un noble menor que ha tomado las riendas de sus primeras tierras.",
  },
  BARON: {
    key: "BARON",
    label: "Baron",
    labelEs: "Barón",
    icon: "🏰",
    minVillages: 2,
    minPrestige: 200,
    productionBonus: 5,
    attackBonus: 0,
    defenseBonus: 5,
    recruitBonus: 5,
    description: "Señor de varias aldeas. Su fama crece y sus hombres le siguen con fervor.",
  },
  COUNT: {
    key: "COUNT",
    label: "Count",
    labelEs: "Conde",
    icon: "⚜",
    minVillages: 4,
    minPrestige: 600,
    productionBonus: 10,
    attackBonus: 5,
    defenseBonus: 10,
    recruitBonus: 10,
    description: "Gobernante de un condado entero. Su nombre resuena en las cortes de Europa.",
  },
  DUKE: {
    key: "DUKE",
    label: "Duke",
    labelEs: "Duque",
    icon: "👑",
    minVillages: 7,
    minPrestige: 1500,
    productionBonus: 15,
    attackBonus: 10,
    defenseBonus: 15,
    recruitBonus: 15,
    description: "Un gran duque que controla vastas provincias. La corona le debe lealtad.",
  },
  KING: {
    key: "KING",
    label: "King",
    labelEs: "Rey",
    icon: "⚔👑",
    minVillages: 10,
    minPrestige: 3000,
    productionBonus: 25,
    attackBonus: 20,
    defenseBonus: 20,
    recruitBonus: 20,
    description: "Rey ungido de la guerra. Europa se arrodilla ante tu estandarte.",
  },
};

export const NOBILITY_ORDER: NobilityTitle[] = ["LORD", "BARON", "COUNT", "DUKE", "KING"];

/** Determine the title a player earns given their village count and prestige */
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

/** Prestige gained per event */
export const PRESTIGE_VILLAGE_CAPTURED = 150;
export const PRESTIGE_BATTLE_WON       = 80;
export const PRESTIGE_BATTLE_DEFENDED  = 50;
export const PRESTIGE_ADVENTURE        = 10;
