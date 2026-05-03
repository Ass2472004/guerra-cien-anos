import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Borra partidas con facciones obsoletas (ENGLAND/FRANCE/SPAIN) del usuario actual.
// El usuario debe llamar a este endpoint o crear una nueva partida.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;

  const oldFactions = ["ENGLAND", "FRANCE", "SPAIN"];
  const result = await prisma.game.deleteMany({
    where: { userId, faction: { in: oldFactions } },
  });
  return NextResponse.json({ deleted: result.count });
}
