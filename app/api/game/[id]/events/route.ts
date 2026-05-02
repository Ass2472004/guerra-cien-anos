import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;

  const game = await prisma.game.findUnique({ where: { id, userId }, select: { id: true } });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  const events = await prisma.gameEvent.findMany({
    where: { gameId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ events });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  if (action === "MARK_ALL_READ") {
    await prisma.gameEvent.updateMany({
      where: { gameId: id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
}
