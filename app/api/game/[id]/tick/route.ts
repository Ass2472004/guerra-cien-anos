import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processTick } from "@/lib/game/engine/resources";
import { updateSupplyLines, processForaging, processArmyMovement } from "@/lib/game/engine/supply";
import { processNeutralAI, processRivalAI } from "@/lib/game/engine/ai";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const game = await prisma.game.findUnique({ where: { id, userId: session.user.id } });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  // Sequential tick processing
  await processArmyMovement(id);
  await processTick(id);
  await processForaging(id);
  await updateSupplyLines(id);
  await processNeutralAI(id);
  await processRivalAI(id);

  return NextResponse.json({ ok: true, tick: game.tick + 1 });
}
