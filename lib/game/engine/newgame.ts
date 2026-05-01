import { prisma } from "@/lib/db";
import { generateMap } from "./mapgen";
import { HEROES } from "../constants/heroes";
import { BUILDINGS } from "../constants/buildings";
import type { Faction } from "../constants/troops";

const MAP_W = 20;
const MAP_H = 20;
const STARTING_VISION = 3;

export async function createNewGame(userId: string, faction: Faction) {
  const { tiles, villages } = generateMap(MAP_W, MAP_H, faction);

  const game = await prisma.game.create({
    data: { userId, faction, mapWidth: MAP_W, mapHeight: MAP_H },
  });

  // Create all tiles
  const tileRecords = await Promise.all(
    tiles.map(t =>
      prisma.tile.create({
        data: {
          gameId: game.id,
          x: t.x, y: t.y,
          type: t.type,
          bonus: JSON.stringify(t.bonus),
          visibility: "HIDDEN",
        },
      })
    )
  );

  const tileMap = new Map(tileRecords.map(t => [`${t.x},${t.y}`, t]));

  // Create villages
  for (const v of villages) {
    const tile = tileMap.get(`${v.x},${v.y}`);
    if (!tile) continue;

    const isPlayer = v.owner === "PLAYER";
    const isRival  = v.owner === "AI_RIVAL";

    const village = await prisma.village.create({
      data: {
        gameId: game.id,
        tileId: tile.id,
        name: v.name,
        owner: v.owner,
        faction: v.faction,
        // Starter resources
        wood:   isPlayer ? 500 : isRival ? 500 : 100,
        stone:  isPlayer ? 500 : isRival ? 500 : 80,
        iron:   isPlayer ? 200 : isRival ? 200 : 50,
        grain:  isPlayer ? 600 : isRival ? 600 : 150,
        straw:  isPlayer ? 300 : isRival ? 300 : 75,
        adobe:  isPlayer ? 150 : isRival ? 150 : 30,
        silver: 0,
        gold:   0,
        woodRate:  isPlayer || isRival ? 10 : 5,
        stoneRate: isPlayer || isRival ? 8  : 4,
        ironRate:  isPlayer || isRival ? 6  : 3,
        grainRate: isPlayer || isRival ? 14 : 7,
      },
    });

    // Give player and rival starter buildings
    if (isPlayer || isRival) {
      await prisma.building.createMany({
        data: [
          { villageId: village.id, type: "MAIN_HALL",    level: 1 },
          { villageId: village.id, type: "WAREHOUSE",    level: 1 },
          { villageId: village.id, type: "GRANARY",      level: 1 },
          { villageId: village.id, type: "RALLY_POINT",  level: 1 },
          { villageId: village.id, type: "BARRACKS",     level: 1 },
          { villageId: village.id, type: "WATCHTOWER",   level: 1 },
        ],
      });

      // Starter garrison army
      const armyFaction = v.faction ?? "ENGLAND";
      const infType = isPlayer ? (faction === "ENGLAND" ? "LEVY" : faction === "FRANCE" ? "PIETAILLE" : "PEON") : "PIETAILLE";
      const rangedType = isPlayer ? (faction === "ENGLAND" ? "LONGBOWMAN" : faction === "FRANCE" ? "FRANC_ARCHER" : "BALLESTERO_SPA") : "FRANC_ARCHER";
      const garrison = await prisma.army.create({
        data: {
          gameId: game.id,
          owner: isPlayer ? "PLAYER" : "AI_RIVAL",
          faction: armyFaction,
          tileId: tile.id,
          name: "Guarnición",
          stamina: 100,
        },
      });
      await prisma.armyTroop.createMany({
        data: [
          { armyId: garrison.id, type: infType, faction: armyFaction, count: 50 },
          { armyId: garrison.id, type: rangedType, faction: armyFaction, count: 20 },
        ],
      });
    }
  }

  // Create hero for player
  const heroDef = HEROES[faction];
  await prisma.hero.create({
    data: {
      gameId: game.id,
      name: heroDef.name,
      faction,
      level: 1, xp: 0, xpNext: 100,
      hp: heroDef.baseStats.hp,
      maxHp: heroDef.baseStats.hp,
      fightingStrength: heroDef.baseStats.fightingStrength,
    },
  });

  // Set player village tiles visible
  const playerVillage = villages.find(v => v.owner === "PLAYER")!;
  const visibleKeys = new Set<string>();
  for (let dy = -STARTING_VISION; dy <= STARTING_VISION; dy++) {
    for (let dx = -STARTING_VISION; dx <= STARTING_VISION; dx++) {
      const tx = playerVillage.x + dx;
      const ty = playerVillage.y + dy;
      if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
        visibleKeys.add(`${tx},${ty}`);
      }
    }
  }

  await prisma.tile.updateMany({
    where: { gameId: game.id, id: { in: [...visibleKeys].map(k => tileMap.get(k)?.id).filter(Boolean) as string[] } },
    data: { visibility: "VISIBLE" },
  });

  return game;
}
