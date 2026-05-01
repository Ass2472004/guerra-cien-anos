import type { Faction } from "./troops";

export interface HeroDef {
  faction: Faction;
  name: string;
  title: string;
  ability: string;
  abilityDesc: string;
  // Which troop type gets the faction bonus
  abilityTroop: string | null;
  abilityBonus: number; // % bonus
  baseStats: { fightingStrength: number; hp: number };
  historical: string;
}

export const HEROES: Record<Faction, HeroDef> = {
  ENGLAND: {
    faction: "ENGLAND",
    name: "Eduardo de Woodstock",
    title: "El Príncipe Negro",
    ability: "LLUVIA_DE_FLECHAS",
    abilityDesc: "+50% ataque a LONGBOWMAN cuando el héroe lidera el ejército.",
    abilityTroop: "LONGBOWMAN",
    abilityBonus: 50,
    baseStats: { fightingStrength: 50, hp: 120 },
    historical: "Venció en Crécy (1346) y Poitiers (1356). El más temido de su era.",
  },
  FRANCE: {
    faction: "FRANCE",
    name: "Juana de Arco",
    title: "La Doncella de Orléans",
    ability: "INSPIRACION_DIVINA",
    abilityDesc: "+30% defensa a TODAS las tropas cuando el héroe defiende la aldea.",
    abilityTroop: null,
    abilityBonus: 30,
    baseStats: { fightingStrength: 40, hp: 100 },
    historical: "Levantó el asedio de Orléans (1429) y coronó a Carlos VII en Reims.",
  },
  SPAIN: {
    faction: "SPAIN",
    name: "Álvaro de Luna",
    title: "Condestable de Castilla",
    ability: "MANIOBRA_JINETE",
    abilityDesc: "JINETE y caballería se mueven un 25% más rápido cuando el héroe lidera.",
    abilityTroop: "JINETE",
    abilityBonus: 25,
    baseStats: { fightingStrength: 45, hp: 110 },
    historical: "El hombre más poderoso de Castilla durante décadas. Estratega brillante.",
  },
};

export const HERO_ABILITIES = {
  LLUVIA_DE_FLECHAS: "LLUVIA_DE_FLECHAS",
  INSPIRACION_DIVINA: "INSPIRACION_DIVINA",
  MANIOBRA_JINETE: "MANIOBRA_JINETE",
} as const;

// Equipment slot definitions
export type EquipSlot = "HELMET" | "ARMOR" | "WEAPON" | "SHIELD" | "HORSE" | "BOOTS";

export interface ItemDef {
  key: string;
  name: string;
  slot: EquipSlot;
  tier: 1 | 2 | 3;
  bonuses: Partial<{
    fightingStrength: number;
    attackBonus: number;
    defenseBonus: number;
    resourceBonus: number;
    speed: number;
    hp: number;
    xpBonus: number;
  }>;
}

export const ITEMS: Record<string, ItemDef> = {
  // ─── HELMETS ─────────────────────────────────────────
  HELMET_IRON_T1:   { key: "HELMET_IRON_T1",   name: "Casco de hierro",    slot: "HELMET", tier: 1, bonuses: { fightingStrength: 5, hp: 10 } },
  HELMET_STEEL_T2:  { key: "HELMET_STEEL_T2",  name: "Casco de acero",     slot: "HELMET", tier: 2, bonuses: { fightingStrength: 12, hp: 25 } },
  HELMET_CROWN_T3:  { key: "HELMET_CROWN_T3",  name: "Corona de guerra",   slot: "HELMET", tier: 3, bonuses: { fightingStrength: 25, hp: 50, xpBonus: 10 } },
  // ─── ARMOR ───────────────────────────────────────────
  ARMOR_LEATHER_T1: { key: "ARMOR_LEATHER_T1", name: "Cota de cuero",      slot: "ARMOR",  tier: 1, bonuses: { defenseBonus: 5, hp: 15 } },
  ARMOR_CHAIN_T2:   { key: "ARMOR_CHAIN_T2",   name: "Cota de malla",      slot: "ARMOR",  tier: 2, bonuses: { defenseBonus: 12, hp: 30 } },
  ARMOR_PLATE_T3:   { key: "ARMOR_PLATE_T3",   name: "Armadura de placas", slot: "ARMOR",  tier: 3, bonuses: { defenseBonus: 25, hp: 60 } },
  // ─── WEAPONS ─────────────────────────────────────────
  WEAPON_SWORD_T1:  { key: "WEAPON_SWORD_T1",  name: "Espada de hierro",   slot: "WEAPON", tier: 1, bonuses: { attackBonus: 6, fightingStrength: 4 } },
  WEAPON_LANCE_T2:  { key: "WEAPON_LANCE_T2",  name: "Lanza de guerra",    slot: "WEAPON", tier: 2, bonuses: { attackBonus: 15, fightingStrength: 8 } },
  WEAPON_GREATSWORD_T3: { key: "WEAPON_GREATSWORD_T3", name: "Mandoble", slot: "WEAPON", tier: 3, bonuses: { attackBonus: 30, fightingStrength: 15 } },
  // ─── SHIELDS ─────────────────────────────────────────
  SHIELD_WOOD_T1:   { key: "SHIELD_WOOD_T1",   name: "Escudo de madera",   slot: "SHIELD", tier: 1, bonuses: { defenseBonus: 4 } },
  SHIELD_IRON_T2:   { key: "SHIELD_IRON_T2",   name: "Escudo de hierro",   slot: "SHIELD", tier: 2, bonuses: { defenseBonus: 10 } },
  SHIELD_STEEL_T3:  { key: "SHIELD_STEEL_T3",  name: "Escudo de acero",    slot: "SHIELD", tier: 3, bonuses: { defenseBonus: 22 } },
  // ─── HORSES ──────────────────────────────────────────
  HORSE_ROUNCEY_T1: { key: "HORSE_ROUNCEY_T1", name: "Roncín",             slot: "HORSE",  tier: 1, bonuses: { speed: 1 } },
  HORSE_DESTRIER_T2:{ key: "HORSE_DESTRIER_T2",name: "Destrero",           slot: "HORSE",  tier: 2, bonuses: { speed: 2, attackBonus: 5 } },
  HORSE_WARHORSE_T3:{ key: "HORSE_WARHORSE_T3",name: "Corcel de guerra",   slot: "HORSE",  tier: 3, bonuses: { speed: 4, attackBonus: 10, defenseBonus: 5 } },
  // ─── BOOTS ───────────────────────────────────────────
  BOOTS_LEATHER_T1: { key: "BOOTS_LEATHER_T1", name: "Botas de cuero",     slot: "BOOTS",  tier: 1, bonuses: { speed: 1, resourceBonus: 3 } },
  BOOTS_IRON_T2:    { key: "BOOTS_IRON_T2",    name: "Botas reforzadas",   slot: "BOOTS",  tier: 2, bonuses: { speed: 1, resourceBonus: 8 } },
  BOOTS_STEEL_T3:   { key: "BOOTS_STEEL_T3",   name: "Botas de guerra",    slot: "BOOTS",  tier: 3, bonuses: { speed: 2, resourceBonus: 15 } },
};
