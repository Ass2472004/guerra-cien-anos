import { prisma } from "@/lib/db";

const STRAW_RATIO = 0.4; // grano -> paja bonus ratio
const ADOBE_PER_STRAW = 0.5; // straw auto-converts to adobe slowly

export async function processTick(gameId: string) {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    include: {
      villages: { include: { buildings: true } },
      armies: { include: { troops: true } },
    },
  });

  const now = new Date();
  const minutesSinceLastTick = (now.getTime() - game.lastTick.getTime()) / 60000;
  if (minutesSinceLastTick < 1) return; // throttle: max 1 tick per minute

  const updates: Promise<unknown>[] = [];

  for (const village of game.villages) {
    if (village.owner !== "PLAYER" && village.owner !== "AI_RIVAL") continue; // neutral villages don't produce

    const heroBonus = 1; // will be modified by hero resourceBonus attribute
    const wood  = Math.min(village.wood  + village.woodRate  * heroBonus, village.warehouseCap);
    const stone = Math.min(village.stone + village.stoneRate * heroBonus, village.warehouseCap);
    const iron  = Math.min(village.iron  + village.ironRate  * heroBonus, village.warehouseCap);
    const grain = Math.min(village.grain + village.grainRate * heroBonus, village.granaryCap);
    const straw = Math.min(village.straw + Math.floor(village.grainRate * STRAW_RATIO) * heroBonus, village.granaryCap);
    const silver = Math.min(village.silver + village.silverRate, village.warehouseCap);
    const gold   = Math.min(village.gold   + village.goldRate,   village.warehouseCap);

    // Slow auto-conversion: straw -> adobe (1 per 2 straw above threshold)
    const excessStraw = Math.max(0, village.straw - 100);
    const newAdobe = Math.min(village.adobe + Math.floor(excessStraw * ADOBE_PER_STRAW / 10), village.warehouseCap);

    updates.push(
      prisma.village.update({
        where: { id: village.id },
        data: { wood, stone, iron, grain, straw, adobe: newAdobe, silver, gold },
      })
    );
  }

  // Process army supply consumption
  for (const army of game.armies) {
    const totalGrainUpkeep = army.troops.reduce((sum, t) => {
      return sum + (t.count * 1); // base 1 grain per troop per tick — real cost in TROOPS constant
    }, 0);

    let newCarriedGrain = army.carriedGrain - totalGrainUpkeep;
    let newStamina = army.stamina;

    if (newCarriedGrain < 0) {
      // Starving: stamina penalty
      newCarriedGrain = 0;
      newStamina = Math.max(0, army.stamina - 10);
    } else if (army.isResting) {
      newStamina = Math.min(100, army.stamina + 20);
    } else if (army.isMoving) {
      newStamina = Math.max(0, army.stamina - 5);
    }

    updates.push(
      prisma.army.update({
        where: { id: army.id },
        data: { carriedGrain: Math.max(0, newCarriedGrain), stamina: newStamina },
      })
    );
  }

  // Process build queues
  const completedBuilds = await prisma.buildQueue.findMany({
    where: { village: { gameId }, endsAt: { lte: now } },
    include: { village: true },
  });

  for (const item of completedBuilds) {
    const existing = await prisma.building.findFirst({
      where: { villageId: item.villageId, type: item.buildingType },
    });
    if (existing) {
      updates.push(prisma.building.update({ where: { id: existing.id }, data: { level: item.targetLevel } }));
    } else {
      updates.push(prisma.building.create({ data: { villageId: item.villageId, type: item.buildingType, level: item.targetLevel } }));
    }
    updates.push(prisma.buildQueue.delete({ where: { id: item.id } }));
  }

  // Process train queues
  const completedTrains = await prisma.trainQueue.findMany({
    where: { village: { gameId }, endsAt: { lte: now } },
  });

  for (const item of completedTrains) {
    // Find army in village tile or create new one
    const village = await prisma.village.findUniqueOrThrow({ where: { id: item.villageId }, include: { tile: true } });
    let army = await prisma.army.findFirst({ where: { gameId, tileId: village.tile.id, owner: "PLAYER", isMoving: false } });

    if (!army) {
      army = await prisma.army.create({
        data: {
          gameId, owner: "PLAYER", faction: village.faction ?? "ENGLAND",
          tileId: village.tile.id, name: "Ejército",
        },
      });
    }

    const existingTroop = await prisma.armyTroop.findFirst({ where: { armyId: army.id, type: item.troopType } });
    if (existingTroop) {
      updates.push(prisma.armyTroop.update({ where: { id: existingTroop.id }, data: { count: existingTroop.count + item.count } }));
    } else {
      updates.push(prisma.armyTroop.create({ data: { armyId: army.id, type: item.troopType, faction: item.faction, count: item.count } }));
    }
    updates.push(prisma.trainQueue.delete({ where: { id: item.id } }));
  }

  // Update game tick counter
  updates.push(prisma.game.update({ where: { id: gameId }, data: { tick: game.tick + 1, lastTick: now } }));

  await Promise.all(updates);
}
