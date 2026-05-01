import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processTick } from "@/lib/game/engine/resources";
import { updateSupplyLines, processForaging, processArmyMovement } from "@/lib/game/engine/supply";
import { processNeutralAI, processRivalAI } from "@/lib/game/engine/ai";
import { resolveTileEncounters } from "@/lib/game/engine/battle";
import { updateFogOfWar } from "@/lib/game/engine/fog";
import { prisma } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;

  const game = await prisma.game.findUnique({ where: { id, userId } });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  // 1) Move armies
  await processArmyMovement(id);

  // 2) Resolve encounters (combat) at tiles
  const reports = await resolveTileEncounters(id);

  // 3) Process resources / queues
  await processTick(id);

  // 4) Foraging
  await processForaging(id);

  // 5) Supply lines
  await updateSupplyLines(id);

  // 6) AI actions
  await processNeutralAI(id);
  await processRivalAI(id);

  // 7) Update fog of war
  await updateFogOfWar(id);

  // 8) Hero revival check
  await prisma.hero.updateMany({
    where: { gameId: id, isAlive: false, revivesAt: { lte: new Date() } },
    data: { isAlive: true, hp: 100, revivesAt: null },
  });

  return NextResponse.json({ ok: true, tick: game.tick + 1, battles: reports.length });
}
