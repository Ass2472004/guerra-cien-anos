import { prisma } from "@/lib/db";
import { TROOPS } from "../constants/troops";
import { resolveCombat, heroXpFromBattle, checkLevelUp } from "./combat";
import { NOBILITY, computeTitle } from "../constants/nobility";
import { addPrestige } from "./nobility";
import { PRESTIGE_BATTLE_WON, PRESTIGE_BATTLE_DEFENDED, PRESTIGE_VILLAGE_CAPTURED } from "../constants/nobility";

// After army movement, resolve any combat encounters at tiles where
// player and rival armies (or rival armies on player villages) coincide.
export async function resolveTileEncounters(gameId: string) {
  const tiles = await prisma.tile.findMany({
    where: { gameId },
    include: {
      village: true,
      camp: true,
    },
  });

  const reports: any[] = [];

  for (const tile of tiles) {
    const armies = await prisma.army.findMany({
      where: { gameId, tileId: tile.id },
      include: { troops: true },
    });

    if (armies.length < 2) continue;

    const playerArmies = armies.filter(a => a.owner === "PLAYER");
    const rivalArmies  = armies.filter(a => a.owner === "AI_RIVAL");

    if (playerArmies.length === 0 || rivalArmies.length === 0) continue;

    // Combine armies on each side into one combat side
    const combineSide = (sideArmies: typeof armies) => {
      const combined: Record<string, { type: string; faction: string; count: number }> = {};
      for (const a of sideArmies) {
        for (const t of a.troops) {
          if (!combined[t.type]) combined[t.type] = { type: t.type, faction: t.faction, count: 0 };
          combined[t.type].count += t.count;
        }
      }
      return Object.values(combined);
    };

    const isAttackerPlayer = playerArmies.some(a => a.isMoving === false && a.targetTileId === null) === false;
    const attackerArmies = isAttackerPlayer ? playerArmies : rivalArmies;
    const defenderArmies = isAttackerPlayer ? rivalArmies : playerArmies;

    const attackerTroops = combineSide(attackerArmies);
    const defenderTroops = combineSide(defenderArmies);

    const totalAtk = attackerTroops.reduce((s, t) => s + t.count, 0);
    const totalDef = defenderTroops.reduce((s, t) => s + t.count, 0);
    if (totalAtk === 0 || totalDef === 0) continue;

    // Get hero ability if hero is in attacker army
    const hero = await prisma.hero.findFirst({ where: { gameId, isAlive: true } });
    const heroAbility = hero?.armyId && attackerArmies.some(a => a.id === hero.armyId)
      ? "LLUVIA_DE_FLECHAS" // could lookup HEROES[faction].ability
      : null;

    // Wall bonus if defending in own village
    const wallBonus = (tile.village && tile.village.owner === (isAttackerPlayer ? "AI_RIVAL" : "PLAYER"))
      ? tile.village.wallLevel * 7 : 0;

    // Nobility combat bonuses for player side
    const game = await prisma.game.findUniqueOrThrow({ where: { id: gameId }, select: { nobilityTitle: true, nobilityXp: true } });
    const nobilityDef = NOBILITY[game.nobilityTitle as keyof typeof NOBILITY];
    const playerAtkBonus = (isAttackerPlayer ? nobilityDef.attackBonus : 0) + (hero ? hero.attackBonus : 0);
    const playerDefBonus = (!isAttackerPlayer ? nobilityDef.defenseBonus : 0) + (hero ? hero.defenseBonus : 0);

    const result = resolveCombat(
      { army: { id: "atk", troops: attackerTroops as any } as any, heroAbility, attackBonusPct: isAttackerPlayer ? playerAtkBonus : 0 },
      { army: { id: "def", troops: defenderTroops as any } as any, wallBonus, defenseBonusPct: isAttackerPlayer ? 0 : playerDefBonus },
    );

    // Apply losses to actual armies (proportionally)
    const applyLosses = async (sideArmies: typeof armies, lossMap: Record<string, number>) => {
      for (const a of sideArmies) {
        for (const troop of a.troops) {
          const totalSideOfType = sideArmies.flatMap(x => x.troops).filter(x => x.type === troop.type).reduce((s, x) => s + x.count, 0);
          if (totalSideOfType === 0) continue;
          const armyShare = troop.count / totalSideOfType;
          const lossesForThis = Math.ceil((lossMap[troop.type] ?? 0) * armyShare);
          const newCount = Math.max(0, troop.count - lossesForThis);
          if (newCount === 0) {
            await prisma.armyTroop.delete({ where: { id: troop.id } });
          } else {
            await prisma.armyTroop.update({ where: { id: troop.id }, data: { count: newCount } });
          }
        }
      }
      // Delete empty armies
      for (const a of sideArmies) {
        const remainingTroops = await prisma.armyTroop.count({ where: { armyId: a.id } });
        if (remainingTroops === 0) {
          await prisma.army.delete({ where: { id: a.id } });
        }
      }
    };

    await applyLosses(attackerArmies, result.attackerLosses);
    await applyLosses(defenderArmies, result.defenderLosses);

    // Hero XP if hero participated and won
    if (hero && hero.armyId) {
      const heroSide = isAttackerPlayer ? attackerArmies : defenderArmies;
      const heroInBattle = heroSide.some(a => a.id === hero.armyId);
      const heroSideWon = (isAttackerPlayer && result.attackerWins) || (!isAttackerPlayer && !result.attackerWins);
      if (heroInBattle && heroSideWon) {
        const enemyTotal = isAttackerPlayer
          ? Object.values(result.defenderLosses).reduce((s, n) => s + n, 0)
          : Object.values(result.attackerLosses).reduce((s, n) => s + n, 0);
        const xpGain = heroXpFromBattle(enemyTotal);
        const newXp = hero.xp + xpGain;
        const lvlUp = checkLevelUp(newXp, hero.xpNext, hero.level);
        await prisma.hero.update({
          where: { id: hero.id },
          data: {
            xp: newXp - (hero.xpNext * (lvlUp.newLevel - hero.level === 0 ? 0 : 1)),
            level: lvlUp.newLevel,
            xpNext: lvlUp.newXpNext,
            skillPoints: hero.skillPoints + lvlUp.skillPoints,
          },
        });
      }
      if (heroInBattle && !heroSideWon) {
        // Hero takes damage
        const dmg = Math.min(hero.hp, 30 + Math.floor(Math.random() * 30));
        const newHp = Math.max(0, hero.hp - dmg);
        await prisma.hero.update({
          where: { id: hero.id },
          data: {
            hp: newHp,
            isAlive: newHp > 0,
            revivesAt: newHp === 0 ? new Date(Date.now() + 30 * 60 * 1000) : null,
          },
        });
      }
    }

    // If attacker won and tile has rival village, transfer ownership
    if (result.attackerWins && tile.village) {
      const villageOwnerSide = tile.village.owner;
      const newOwner = isAttackerPlayer ? "PLAYER" : "AI_RIVAL";
      if (villageOwnerSide !== newOwner) {
        await prisma.village.update({
          where: { id: tile.village.id },
          data: { owner: newOwner, loyalty: 30 },
        });
        // Player earns prestige for capturing a village
        if (isAttackerPlayer) await addPrestige(gameId, PRESTIGE_VILLAGE_CAPTURED);
      }
    }

    // Award battle prestige to player
    if (isAttackerPlayer && result.attackerWins) await addPrestige(gameId, PRESTIGE_BATTLE_WON);
    if (!isAttackerPlayer && !result.attackerWins) await addPrestige(gameId, PRESTIGE_BATTLE_DEFENDED);

    // Save battle report
    const battle = await prisma.battle.create({
      data: {
        gameId, tileId: tile.id,
        attackerId: attackerArmies[0]?.id ?? "",
        defenderId: defenderArmies[0]?.id ?? null,
        type: "ATTACK",
        resultJson: JSON.stringify({
          isAttackerPlayer,
          tileX: tile.x, tileY: tile.y,
          attackerWins: result.attackerWins,
          attackerAttack: result.attackerAttack,
          defenderDefense: result.defenderDefense,
          attackerLosses: result.attackerLosses,
          defenderLosses: result.defenderLosses,
          report: result.report,
          villageName: tile.village?.name ?? null,
          conquered: result.attackerWins && tile.village !== null,
        }),
      },
    });
    reports.push(battle);
  }

  return reports;
}
