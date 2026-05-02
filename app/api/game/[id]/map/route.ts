import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;

  const game = await prisma.game.findUnique({
    where: { id, userId },
    include: {
      tiles: {
        include: {
          village: { select: { id: true, name: true, owner: true, faction: true, loyalty: true } },
          camp: { select: { id: true, owner: true, level: true } },
        },
      },
      armies: {
        where: { tileId: { not: null } },
        select: {
          id: true, tileId: true, owner: true, faction: true,
          stamina: true, isMoving: true, isResting: true, isForaging: true,
          arrivesAt: true, carriedGrain: true,
          troops: { select: { type: true, count: true, faction: true } },
        },
      },
      hero: { select: { tileId: true, isOnAdventure: true, isAlive: true, hp: true, maxHp: true, level: true } },
    },
  });

  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  // Player village resources summary (first player village)
  const playerVillage = await prisma.village.findFirst({
    where: { gameId: id, owner: "PLAYER" },
    select: {
      id: true, name: true,
      wood: true, stone: true, iron: true, grain: true,
      straw: true, adobe: true, silver: true, gold: true,
      woodRate: true, stoneRate: true, ironRate: true, grainRate: true,
      warehouseCap: true, granaryCap: true,
    },
  });

  // Stats
  const [playerVillages, rivalVillages, totalBattles, totalTroops] = await Promise.all([
    prisma.village.count({ where: { gameId: id, owner: "PLAYER" } }),
    prisma.village.count({ where: { gameId: id, owner: "AI_RIVAL" } }),
    prisma.battle.count({ where: { gameId: id } }),
    prisma.armyTroop.aggregate({
      where: { army: { gameId: id, owner: "PLAYER" } },
      _sum: { count: true },
    }),
  ]);

  // Recent unread events (last 5)
  const recentEvents = await prisma.gameEvent.findMany({
    where: { gameId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, type: true, title: true, description: true, isRead: true, createdAt: true, affectedId: true },
  });

  return NextResponse.json({
    width: game.mapWidth,
    height: game.mapHeight,
    faction: game.faction,
    tick: game.tick,
    status: game.status,
    statusReason: game.statusReason,
    nobilityTitle: game.nobilityTitle,
    nobilityXp: game.nobilityXp,
    tiles: game.tiles.map(t => ({
      id: t.id, x: t.x, y: t.y,
      type: t.type,
      visibility: t.visibility,
      bonus: JSON.parse(t.bonus || "{}"),
      village: t.village,
      camp: t.camp,
    })),
    armies: game.armies,
    hero: game.hero,
    playerResources: playerVillage,
    stats: {
      playerVillages,
      rivalVillages,
      totalBattles,
      totalTroops: totalTroops._sum.count ?? 0,
    },
    recentEvents,
  });
}
