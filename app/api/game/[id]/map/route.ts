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
        select: { id: true, tileId: true, owner: true, faction: true, stamina: true, isMoving: true, isResting: true, isForaging: true },
      },
      hero: { select: { tileId: true, isOnAdventure: true, isAlive: true, hp: true, maxHp: true, level: true } },
    },
  });

  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  return NextResponse.json({
    width: game.mapWidth,
    height: game.mapHeight,
    faction: game.faction,
    tick: game.tick,
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
  });
}
