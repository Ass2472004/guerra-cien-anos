import { prisma } from "@/lib/db";
import { TROOPS_BY_FACTION } from "../constants/troops";
import { tileDistance, findPath } from "./supply";
import type { Faction } from "../constants/troops";

// ─── NEUTRAL AI ──────────────────────────────────────────────────────────────
// Neutral villages: passive, defend only. Generate small garrison based on village level.

export async function processNeutralAI(gameId: string) {
  const game = await prisma.game.findUniqueOrThrow({ where: { id: gameId }, include: { tiles: true } });
  const neutralVillages = await prisma.village.findMany({
    where: { gameId, owner: "AI_NEUTRAL" },
    include: { tile: true },
  });

  for (const village of neutralVillages) {
    // Check if village has a garrison army
    const garrison = await prisma.army.findFirst({
      where: { gameId, tileId: village.tile.id, owner: "AI_RIVAL" },
      include: { troops: true },
    });

    // If no garrison, create a small one
    if (!garrison) {
      const neutralFaction: Faction = "ENGLAND"; // neutral garrison uses generic troops
      const army = await prisma.army.create({
        data: {
          gameId, owner: "AI_RIVAL", faction: neutralFaction,
          tileId: village.tile.id, name: `Guardia de ${village.name}`,
          stamina: 100,
        },
      });
      // Small garrison: 20 levy infantry
      await prisma.armyTroop.create({ data: { armyId: army.id, type: "LEVY", faction: neutralFaction, count: 20 } });
    }
  }
}

// ─── RIVAL AI ────────────────────────────────────────────────────────────────
// Rival AI acts as a full player: builds, trains, attacks.

const AI_PHASES = ["BUILD", "TRAIN", "EXPAND", "ATTACK"] as const;

export async function processRivalAI(gameId: string) {
  const game = await prisma.game.findUniqueOrThrow({ where: { id: gameId } });
  const rivalVillages = await prisma.village.findMany({
    where: { gameId, owner: "AI_RIVAL" },
    include: { buildings: true, tile: true, trainQueues: true, buildQueues: true },
  });

  if (rivalVillages.length === 0) return;

  const tick = game.tick;
  // Rotate AI priorities by tick
  const phase = AI_PHASES[tick % AI_PHASES.length];

  for (const village of rivalVillages) {
    if (phase === "BUILD") await aiQueueBuilding(gameId, village);
    if (phase === "TRAIN") await aiQueueTroops(gameId, village);
    if (phase === "EXPAND") await aiExpand(gameId, village, game.mapWidth, game.mapHeight);
    if (phase === "ATTACK") await aiAttack(gameId, village, game.mapWidth, game.mapHeight);
  }
}

async function aiQueueBuilding(gameId: string, village: Awaited<ReturnType<typeof prisma.village.findMany>>[0] & { buildings: any[]; buildQueues: any[] }) {
  if (village.buildQueues.length > 0) return; // already building

  // Priority: Main Hall → Barracks → Walls → Watchtower → Stables
  const priority = ["MAIN_HALL", "BARRACKS", "WALLS", "WATCHTOWER", "STABLES", "GRANARY", "WAREHOUSE"];
  for (const bType of priority) {
    const existing = village.buildings.find((b: any) => b.type === bType);
    const level = existing?.level ?? 0;
    if (level < 5) {
      const duration = 120 + level * 60; // seconds
      await prisma.buildQueue.create({
        data: {
          villageId: village.id,
          buildingType: bType,
          targetLevel: level + 1,
          endsAt: new Date(Date.now() + duration * 1000),
          position: 0,
        },
      });

      // Consume resources
      const stoneCost = 60 + level * 40;
      const woodCost  = 50 + level * 30;
      await prisma.village.update({
        where: { id: village.id },
        data: {
          stone: Math.max(0, village.stone - stoneCost),
          wood:  Math.max(0, village.wood  - woodCost),
        },
      });
      break;
    }
  }
}

async function aiQueueTroops(gameId: string, village: any) {
  if (village.trainQueues.length > 0) return;
  const faction = (village.faction ?? "FRANCE") as Faction;
  const troops = TROOPS_BY_FACTION[faction];

  // AI trains 60% DEF, 40% OFF split
  const defTroops = troops.filter(k => ["DEF","SPY"].some(r => require("../constants/troops").TROOPS[k]?.role === r));
  const offTroops = troops.filter(k => require("../constants/troops").TROOPS[k]?.role === "OFF");

  const pick = Math.random() < 0.6 ? defTroops : offTroops;
  if (pick.length === 0) return;
  const type = pick[Math.floor(Math.random() * pick.length)];
  const count = 5 + Math.floor(Math.random() * 10);

  await prisma.trainQueue.create({
    data: {
      villageId: village.id,
      troopType: type,
      faction,
      count,
      endsAt: new Date(Date.now() + 300 * 1000),
      position: 0,
    },
  });
}

async function aiExpand(gameId: string, village: any, mapWidth: number, mapHeight: number) {
  // Find nearest unclaimed village to expand to
  const allTiles = await prisma.tile.findMany({ where: { gameId, type: "VILLAGE" }, include: { village: true } });
  const neutralTiles = allTiles.filter(t => t.village?.owner === "AI_NEUTRAL");
  if (neutralTiles.length === 0) return;

  // Sort by distance from this village
  const vt = village.tile;
  neutralTiles.sort((a, b) => tileDistance(a.x, a.y, vt.x, vt.y) - tileDistance(b.x, b.y, vt.x, vt.y));
  const target = neutralTiles[0];

  // Get rival armies near this village
  const armies = await prisma.army.findMany({
    where: { gameId, owner: "AI_RIVAL", tileId: village.tile.id, isMoving: false },
    include: { troops: true },
  });

  if (armies.length === 0) return;
  const army = armies[0];
  const totalTroops = army.troops.reduce((s: number, t: any) => s + t.count, 0);
  if (totalTroops < 30) return; // don't expand with tiny armies

  const path = findPath(vt.x, vt.y, target.x, target.y, new Set(), mapWidth, mapHeight);
  if (!path || path.length === 0) return;

  const travelTime = path.length * 60 * 1000; // 60s per step
  await prisma.army.update({
    where: { id: army.id },
    data: {
      isMoving: true,
      targetTileId: target.id,
      pathJson: JSON.stringify(path),
      arrivesAt: new Date(Date.now() + travelTime),
    },
  });
}

async function aiAttack(gameId: string, village: any, mapWidth: number, mapHeight: number) {
  const playerVillages = await prisma.village.findMany({
    where: { gameId, owner: "PLAYER" },
    include: { tile: true },
  });
  if (playerVillages.length === 0) return;

  const armies = await prisma.army.findMany({
    where: { gameId, owner: "AI_RIVAL", tileId: village.tile.id, isMoving: false },
    include: { troops: true },
  });
  if (armies.length === 0) return;

  const army = armies[0];
  const totalTroops = army.troops.reduce((s: number, t: any) => s + t.count, 0);
  if (totalTroops < 50) return; // only attack with meaningful force

  // Pick nearest player village
  const vt = village.tile;
  const target = playerVillages.sort((a, b) =>
    tileDistance(a.tile.x, a.tile.y, vt.x, vt.y) - tileDistance(b.tile.x, b.tile.y, vt.x, vt.y)
  )[0];

  // Only attack if close enough
  if (tileDistance(vt.x, vt.y, target.tile.x, target.tile.y) > 10) return;

  const path = findPath(vt.x, vt.y, target.tile.x, target.tile.y, new Set(), mapWidth, mapHeight);
  if (!path) return;

  const travelTime = path.length * 60 * 1000;
  await prisma.army.update({
    where: { id: army.id },
    data: {
      isMoving: true,
      targetTileId: target.tile.id,
      pathJson: JSON.stringify(path),
      arrivesAt: new Date(Date.now() + travelTime),
    },
  });
}
