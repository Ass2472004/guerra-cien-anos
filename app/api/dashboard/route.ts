import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const userId = (session.user as any).id;

  const games = await prisma.game.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true, faction: true, status: true, tick: true,
      nobilityTitle: true, nobilityXp: true,
      createdAt: true, updatedAt: true,
    },
  });

  const enriched = await Promise.all(games.map(async g => {
    const [playerVillages, rivalVillages, totalTroopsAgg, lastEvent] = await Promise.all([
      prisma.village.count({ where: { gameId: g.id, owner: "PLAYER" } }),
      prisma.village.count({ where: { gameId: g.id, owner: "AI_RIVAL" } }),
      prisma.armyTroop.aggregate({
        where: { army: { gameId: g.id, owner: "PLAYER" } },
        _sum: { count: true },
      }),
      prisma.gameEvent.findFirst({
        where: { gameId: g.id },
        orderBy: { createdAt: "desc" },
        select: { type: true, title: true },
      }),
    ]);
    return {
      ...g,
      playerVillages,
      rivalVillages,
      totalTroops: totalTroopsAgg._sum.count ?? 0,
      lastEvent,
    };
  }));

  return NextResponse.json({ games: enriched, userName: session.user.name ?? session.user.email });
}
