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
    select: { faction: true, nobilityTitle: true, nobilityXp: true },
  });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  const playerVillages = await prisma.village.count({
    where: { gameId: id, owner: "PLAYER" },
  });

  return NextResponse.json({
    nobilityTitle: game.nobilityTitle,
    nobilityXp: game.nobilityXp,
    playerVillages,
    faction: game.faction,
  });
}
