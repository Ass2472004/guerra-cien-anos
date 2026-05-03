import type { Faction } from "./troops";

export interface HeroDef {
  faction: Faction;
  name: string;
  title: string;
  ability: string;
  abilityDesc: string;
  abilityTroop: string | null;
  abilityBonus: number; // % bonus
  baseStats: { fightingStrength: number; hp: number };
  lore: string;
}

export const HEROES: Record<Faction, HeroDef> = {
  PORTADORES: {
    faction: "PORTADORES",
    name: "Fritz",
    title: "El Hijo Desterrado — Portador de Sangre Nocturna",
    ability: "SANGRE_NOCTURNA",
    abilityDesc: "+50% ataque a PORTADOR_NOVICIO y PORTADOR_MAESTRO cuando Fritz lidera el ejército. Su espada Nahkor gotea oscuridad.",
    abilityTroop: "PORTADOR_NOVICIO",
    abilityBonus: 50,
    baseStats: { fightingStrength: 50, hp: 120 },
    lore: "Luchó en la Batalla de los Falsos Emperadores con harapos y una lanza roma. Sobrevivió para tomar la espada Nahkor 'Sangre Nocturna' de su enemigo caído. Su filo negro gotea oscuridad y su portador ralentiza el envejecimiento.",
  },
  IMPERIO: {
    faction: "IMPERIO",
    name: "Shirin",
    title: "Hija de Jinetes — Comandante Imperial",
    ability: "CARGA_IMPERIAL",
    abilityDesc: "+30% defensa a TODAS las tropas cuando Shirin defiende una aldea. Su caballo blanco inspira a los suyos.",
    abilityTroop: null,
    abilityBonus: 30,
    baseStats: { fightingStrength: 42, hp: 105 },
    lore: "Jinete de casta noble, protegió al cuarto Príncipe en la Batalla de los Falsos Emperadores. Su caballo blanco como el algodón de los campos de Rha'Kesh se convirtió en leyenda. Ahora comanda las fuerzas imperiales bajo el estandarte de la Emperatriz.",
  },
  FEDERACION: {
    faction: "FEDERACION",
    name: "Almenth",
    title: "Senador de las Islas — Estratega de Rha'miras",
    ability: "RUTAS_COMERCIALES",
    abilityDesc: "Los MERCENARIO_MERXIAS y JINETE_MERCANTE se mueven un 25% más rápido cuando Almenth lidera. Nacido en los puertos, conoce todos los caminos.",
    abilityTroop: "MERCENARIO_MERXIAS",
    abilityBonus: 25,
    baseStats: { fightingStrength: 44, hp: 108 },
    lore: "Superviviente de la Batalla de los Falsos Emperadores. Creció lejos de una espada hasta que la guerra le encontró. Piel pálida y cabello negro, sin herida alguna tras la batalla. Ascendió al senado de Rha'miras, la federación de ciudades marinas donde la plata compra más que la sangre.",
  },
};

export const HERO_ABILITIES = {
  SANGRE_NOCTURNA:   "SANGRE_NOCTURNA",
  CARGA_IMPERIAL:    "CARGA_IMPERIAL",
  RUTAS_COMERCIALES: "RUTAS_COMERCIALES",
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
  // ─── YELMOS ─────────────────────────────────────────────────────────────────
  HELMET_IRON_T1:   { key: "HELMET_IRON_T1",   name: "Yelmo de hierro",        slot: "HELMET", tier: 1, bonuses: { fightingStrength: 5, hp: 10 } },
  HELMET_STEEL_T2:  { key: "HELMET_STEEL_T2",  name: "Yelmo de acero",         slot: "HELMET", tier: 2, bonuses: { fightingStrength: 12, hp: 25 } },
  HELMET_CROWN_T3:  { key: "HELMET_CROWN_T3",  name: "Corona de la Oscuridad", slot: "HELMET", tier: 3, bonuses: { fightingStrength: 25, hp: 50, xpBonus: 10 } },
  // ─── ARMADURA ───────────────────────────────────────────────────────────────
  ARMOR_LEATHER_T1: { key: "ARMOR_LEATHER_T1", name: "Túnica de cuero",        slot: "ARMOR",  tier: 1, bonuses: { defenseBonus: 5, hp: 15 } },
  ARMOR_CHAIN_T2:   { key: "ARMOR_CHAIN_T2",   name: "Cota de escamas",        slot: "ARMOR",  tier: 2, bonuses: { defenseBonus: 12, hp: 30 } },
  ARMOR_PLATE_T3:   { key: "ARMOR_PLATE_T3",   name: "Armadura Imperial",      slot: "ARMOR",  tier: 3, bonuses: { defenseBonus: 25, hp: 60 } },
  // ─── ARMAS ──────────────────────────────────────────────────────────────────
  WEAPON_SWORD_T1:  { key: "WEAPON_SWORD_T1",  name: "Espada mellada",         slot: "WEAPON", tier: 1, bonuses: { attackBonus: 6, fightingStrength: 4 } },
  WEAPON_LANCE_T2:  { key: "WEAPON_LANCE_T2",  name: "Lanza de guerra",        slot: "WEAPON", tier: 2, bonuses: { attackBonus: 15, fightingStrength: 8 } },
  WEAPON_GREATSWORD_T3: { key: "WEAPON_GREATSWORD_T3", name: "Espada Nahkor (Fragmento)", slot: "WEAPON", tier: 3, bonuses: { attackBonus: 30, fightingStrength: 15 } },
  // ─── ESCUDOS ────────────────────────────────────────────────────────────────
  SHIELD_WOOD_T1:   { key: "SHIELD_WOOD_T1",   name: "Escudo de madera",       slot: "SHIELD", tier: 1, bonuses: { defenseBonus: 4 } },
  SHIELD_IRON_T2:   { key: "SHIELD_IRON_T2",   name: "Escudo oscuro",          slot: "SHIELD", tier: 2, bonuses: { defenseBonus: 10 } },
  SHIELD_STEEL_T3:  { key: "SHIELD_STEEL_T3",  name: "Escudo de la Nada",      slot: "SHIELD", tier: 3, bonuses: { defenseBonus: 22 } },
  // ─── MONTURAS ───────────────────────────────────────────────────────────────
  HORSE_ROUNCEY_T1: { key: "HORSE_ROUNCEY_T1", name: "Caballo bayo",           slot: "HORSE",  tier: 1, bonuses: { speed: 1 } },
  HORSE_DESTRIER_T2:{ key: "HORSE_DESTRIER_T2",name: "Caballo negro",          slot: "HORSE",  tier: 2, bonuses: { speed: 2, attackBonus: 5 } },
  HORSE_WARHORSE_T3:{ key: "HORSE_WARHORSE_T3",name: "Caballo blanco perlino", slot: "HORSE",  tier: 3, bonuses: { speed: 4, attackBonus: 10, defenseBonus: 5 } },
  // ─── BOTAS ──────────────────────────────────────────────────────────────────
  BOOTS_LEATHER_T1: { key: "BOOTS_LEATHER_T1", name: "Botas de viajero",       slot: "BOOTS",  tier: 1, bonuses: { speed: 1, resourceBonus: 3 } },
  BOOTS_IRON_T2:    { key: "BOOTS_IRON_T2",    name: "Botas reforzadas",       slot: "BOOTS",  tier: 2, bonuses: { speed: 1, resourceBonus: 8 } },
  BOOTS_STEEL_T3:   { key: "BOOTS_STEEL_T3",   name: "Botas del Portador",     slot: "BOOTS",  tier: 3, bonuses: { speed: 2, resourceBonus: 15 } },
};
