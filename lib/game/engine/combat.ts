import { TROOPS } from "../constants/troops";
import { HEROES } from "../constants/heroes";
interface ArmyTroop { type: string; count: number; faction: string; }
interface Army { id: string; troops: ArmyTroop[]; }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Village { id: string; }

interface CombatArmy {
  army: Army & { troops: ArmyTroop[] };
  heroAbility?: string | null;
  wallBonus?: number;
  chapelBonus?: number;
  attackBonusPct?: number;   // % extra attack (nobility + hero)
  defenseBonusPct?: number;  // % extra defense (nobility + hero)
}

export interface CombatResult {
  attackerWins: boolean;
  attackerLosses: Record<string, number>;
  defenderLosses: Record<string, number>;
  attackerAttack: number;
  defenderDefense: number;
  loot?: Record<string, number>;
  wallDamage?: number;
  report: string;
}

function totalAttack(army: CombatArmy): number {
  let attack = 0;
  for (const t of army.army.troops) {
    const def = TROOPS[t.type];
    if (!def) continue;
    let unitAttack = def.attack * t.count;

    // Hero faction ability bonus
    if (army.heroAbility === "LLUVIA_DE_FLECHAS" && t.type === "LONGBOWMAN") {
      unitAttack *= 1.5;
    }
    attack += unitAttack;
  }
  // Nobility + hero attack bonus
  const attackMultiplier = 1 + (army.attackBonusPct ?? 0) / 100;
  return Math.round(attack * attackMultiplier);
}

function totalDefense(army: CombatArmy): number {
  let defense = 0;
  for (const t of army.army.troops) {
    const def = TROOPS[t.type];
    if (!def) continue;
    let unitDef = def.defense * t.count;

    // Hero faction ability bonus (Juana de Arco)
    if (army.heroAbility === "INSPIRACION_DIVINA") {
      unitDef *= 1.3;
    }
    defense += unitDef;
  }

  // Wall bonus (multiplier)
  const wallMultiplier = 1 + (army.wallBonus ?? 0) / 100;
  // Chapel bonus
  const chapelMultiplier = 1 + (army.chapelBonus ?? 0) / 100;
  // Nobility + hero defense bonus
  const nobilityMultiplier = 1 + (army.defenseBonusPct ?? 0) / 100;

  return Math.round(defense * wallMultiplier * chapelMultiplier * nobilityMultiplier);
}

export function resolveCombat(
  attacker: CombatArmy,
  defender: CombatArmy,
  isRaid = false
): CombatResult {
  const attackPower = totalAttack(attacker);
  const defensePower = totalDefense(defender);

  const ratio = attackPower / Math.max(1, defensePower);
  const attackerWins = ratio >= 1;

  // Loss calculation: loser loses more, winner loses proportionally
  const attackerLosses: Record<string, number> = {};
  const defenderLosses: Record<string, number> = {};

  if (attackerWins) {
    // Attacker wins: defender loses all, attacker loses ratio-based %
    const attackerLossPct = Math.min(0.9, 1 / (ratio * ratio));
    for (const t of attacker.army.troops) {
      attackerLosses[t.type] = Math.ceil(t.count * attackerLossPct);
    }
    for (const t of defender.army.troops) {
      defenderLosses[t.type] = t.count; // total wipe
    }
  } else {
    // Defender wins
    const defenderLossPct = Math.min(0.9, ratio * ratio);
    for (const t of attacker.army.troops) {
      attackerLosses[t.type] = t.count; // total wipe
    }
    for (const t of defender.army.troops) {
      defenderLosses[t.type] = Math.ceil(t.count * defenderLossPct);
    }
  }

  // Siege: wall damage
  let wallDamage = 0;
  if (attackerWins) {
    const siegeTroops = attacker.army.troops.filter(t => TROOPS[t.type]?.role === "SIEGE");
    wallDamage = siegeTroops.reduce((s, t) => s + t.count * 2, 0);
  }

  const report = attackerWins
    ? `Victoria del atacante. Ratio ${ratio.toFixed(2)}:1.`
    : `Victoria del defensor. Ratio ${ratio.toFixed(2)}:1.`;

  return {
    attackerWins,
    attackerLosses,
    defenderLosses,
    attackerAttack: attackPower,
    defenderDefense: defensePower,
    wallDamage,
    report,
  };
}

// Spy mission: success depends on attacker spy count vs defender watchtower level
export function resolveSpy(
  spyCount: number,
  watchtowerLevel: number,
  ownSpyCount: number
): { success: boolean; detected: boolean; report: string } {
  const successChance = Math.min(0.95, (spyCount * 20) / Math.max(1, watchtowerLevel * 5 + ownSpyCount * 10));
  const success = Math.random() < successChance;
  const detected = !success && Math.random() < 0.4;
  return {
    success,
    detected,
    report: success ? "Espionaje exitoso." : detected ? "¡Espía capturado!" : "Espionaje fallido.",
  };
}

// XP gained by hero from a battle
export function heroXpFromBattle(enemiesKilled: number, grainPerUnit = 1): number {
  return enemiesKilled * grainPerUnit;
}

// Level up check
export function checkLevelUp(xp: number, xpNext: number, level: number): { newLevel: number; newXpNext: number; skillPoints: number } {
  let newLevel = level;
  let newXpNext = xpNext;
  let skillPoints = 0;
  while (xp >= newXpNext) {
    xp -= newXpNext;
    newLevel++;
    skillPoints += 4;
    newXpNext = Math.floor(newXpNext * 1.4);
  }
  return { newLevel, newXpNext, skillPoints };
}
