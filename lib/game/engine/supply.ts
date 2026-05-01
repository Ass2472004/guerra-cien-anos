import { prisma } from "@/lib/db";

// Manhattan + diagonal distance between two points
export function tileDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

// Simple BFS pathfinding on the grid
export function findPath(
  sx: number, sy: number,
  tx: number, ty: number,
  blockedSet: Set<string>,
  width: number, height: number
): Array<{ x: number; y: number }> | null {
  if (sx === tx && sy === ty) return [];
  const key = (x: number, y: number) => `${x},${y}`;
  const queue: Array<{ x: number; y: number; path: Array<{ x: number; y: number }> }> = [{ x: sx, y: sy, path: [] }];
  const visited = new Set<string>([key(sx, sy)]);
  const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const [dx, dy] of dirs) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;
      const k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (visited.has(k) || blockedSet.has(k)) continue;
      const newPath = [...curr.path, { x: nx, y: ny }];
      if (nx === tx && ny === ty) return newPath;
      visited.add(k);
      queue.push({ x: nx, y: ny, path: newPath });
    }
  }
  return null; // no path found (supply line cut)
}

// Check and update supply lines for a game
export async function updateSupplyLines(gameId: string) {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    include: {
      tiles: true,
      villages: { include: { tile: true } },
      armies: {
        where: { owner: "PLAYER" },
        include: { supplyLine: true, troops: true },
      },
      camps: { include: { tile: true } },
    },
  });

  // Build set of tiles occupied by enemy armies (block supply)
  const enemyTiles = new Set<string>();
  const enemyArmies = await prisma.army.findMany({ where: { gameId, owner: "AI_RIVAL" } });
  for (const a of enemyArmies) {
    if (a.tileId) {
      const tile = game.tiles.find(t => t.id === a.tileId);
      if (tile) enemyTiles.add(`${tile.x},${tile.y}`);
    }
  }

  const playerVillages = game.villages.filter(v => v.owner === "PLAYER");
  if (playerVillages.length === 0) return;

  for (const army of game.armies) {
    if (!army.tileId) continue;
    const armyTile = game.tiles.find(t => t.id === army.tileId);
    if (!armyTile) continue;

    // Find nearest player village
    let nearest = playerVillages[0];
    let minDist = Infinity;
    for (const v of playerVillages) {
      const d = tileDistance(armyTile.x, armyTile.y, v.tile.x, v.tile.y);
      if (d < minDist) { minDist = d; nearest = v; }
    }

    const path = findPath(
      armyTile.x, armyTile.y,
      nearest.tile.x, nearest.tile.y,
      enemyTiles,
      game.mapWidth, game.mapHeight
    );

    const isCut = path === null;

    // Upsert supply line
    if (army.supplyLineId) {
      await prisma.supplyLine.update({
        where: { id: army.supplyLineId },
        data: { isCut, isActive: !isCut, pathJson: JSON.stringify(path ?? []) },
      });
    } else {
      const sl = await prisma.supplyLine.create({
        data: {
          gameId,
          sourceId: nearest.id,
          pathJson: JSON.stringify(path ?? []),
          isCut,
          isActive: !isCut,
        },
      });
      await prisma.army.update({ where: { id: army.id }, data: { supplyLineId: sl.id } });
    }
  }
}

// Foraging: army collects grain from the tile it's standing on
export async function processForaging(gameId: string) {
  const armies = await prisma.army.findMany({
    where: { gameId, isForaging: true, isMoving: false },
    include: { troops: true },
  });

  for (const army of armies) {
    if (!army.tileId) continue;
    const tile = await prisma.tile.findUnique({ where: { id: army.tileId } });
    if (!tile) continue;

    const bonus = JSON.parse(tile.bonus || "{}") as Record<string, number>;
    const baseForage = 20 + (bonus.grain ?? 0);

    // Diminishing returns: less foraging the more troops you have
    const totalTroops = army.troops.reduce((s, t) => s + t.count, 0);
    const forageAmount = Math.max(5, Math.floor(baseForage - totalTroops * 0.05));

    await prisma.army.update({
      where: { id: army.id },
      data: { carriedGrain: Math.min(army.carriedGrain + forageAmount, 500) },
    });
  }
}

// Move army one step along its path
export async function processArmyMovement(gameId: string) {
  const now = new Date();
  const movingArmies = await prisma.army.findMany({
    where: { gameId, isMoving: true, arrivesAt: { lte: now } },
  });

  for (const army of movingArmies) {
    const path = JSON.parse(army.pathJson || "[]") as Array<{ x: number; y: number }>;
    if (path.length === 0) {
      await prisma.army.update({ where: { id: army.id }, data: { isMoving: false, pathJson: "[]", arrivesAt: null, targetTileId: null } });
      continue;
    }

    const nextStep = path[0];
    const remainingPath = path.slice(1);
    const nextTile = await prisma.tile.findFirst({ where: { gameId, x: nextStep.x, y: nextStep.y } });
    if (!nextTile) continue;

    const isArrived = remainingPath.length === 0;

    await prisma.army.update({
      where: { id: army.id },
      data: {
        tileId: nextTile.id,
        pathJson: JSON.stringify(remainingPath),
        isMoving: !isArrived,
        arrivesAt: isArrived ? null : army.arrivesAt,
        targetTileId: isArrived ? null : army.targetTileId,
      },
    });

    // Update ArmyPosition
    await prisma.armyPosition.deleteMany({ where: { armyId: army.id } });
    await prisma.armyPosition.create({ data: { armyId: army.id, tileId: nextTile.id } });
  }
}
