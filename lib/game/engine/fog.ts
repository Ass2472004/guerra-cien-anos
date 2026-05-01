import { prisma } from "@/lib/db";

// Update tile visibility based on player villages, armies, and watchtower buildings
export async function updateFogOfWar(gameId: string) {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    include: {
      tiles: true,
      villages: { where: { owner: "PLAYER" }, include: { tile: true, buildings: true } },
      armies:   { where: { owner: "PLAYER" }, select: { tileId: true } },
    },
  });

  const visibleSet = new Set<string>();
  const fogSet = new Set<string>();

  // Player villages: vision = 3 + watchtower bonus
  for (const v of game.villages) {
    const watchtower = v.buildings.find(b => b.type === "WATCHTOWER");
    const vision = 3 + Math.ceil((watchtower?.level ?? 0) / 2);
    addCircle(visibleSet, fogSet, v.tile.x, v.tile.y, vision, game.mapWidth, game.mapHeight);
  }

  // Player armies: vision = 2
  for (const a of game.armies) {
    if (!a.tileId) continue;
    const t = game.tiles.find(t => t.id === a.tileId);
    if (!t) continue;
    addCircle(visibleSet, fogSet, t.x, t.y, 2, game.mapWidth, game.mapHeight);
  }

  // Update tiles in batches
  const visibleIds: string[] = [];
  const fogIds: string[] = [];
  for (const t of game.tiles) {
    const key = `${t.x},${t.y}`;
    if (visibleSet.has(key)) {
      visibleIds.push(t.id);
    } else if (fogSet.has(key) || t.visibility !== "HIDDEN") {
      fogIds.push(t.id);
    }
  }

  if (visibleIds.length > 0) {
    await prisma.tile.updateMany({ where: { id: { in: visibleIds } }, data: { visibility: "VISIBLE" } });
  }
  if (fogIds.length > 0) {
    await prisma.tile.updateMany({ where: { id: { in: fogIds } }, data: { visibility: "FOG" } });
  }
}

function addCircle(visible: Set<string>, fog: Set<string>, cx: number, cy: number, radius: number, w: number, h: number) {
  for (let dy = -radius - 1; dy <= radius + 1; dy++) {
    for (let dx = -radius - 1; dx <= radius + 1; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const tx = cx + dx;
      const ty = cy + dy;
      if (tx < 0 || tx >= w || ty < 0 || ty >= h) continue;
      const key = `${tx},${ty}`;
      if (dist <= radius) visible.add(key);
      else if (dist <= radius + 1) fog.add(key);
    }
  }
}
