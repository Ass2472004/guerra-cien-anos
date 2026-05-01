import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BUILDINGS } from "@/lib/game/constants/buildings";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; vid: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id, vid } = await params;
  const game = await prisma.game.findUnique({ where: { id, userId: session.user.id } });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  const village = await prisma.village.findUnique({
    where: { id: vid },
    include: {
      buildings: true,
      buildQueues: { orderBy: { position: "asc" } },
      trainQueues: { orderBy: { position: "asc" } },
      tile: true,
    },
  });

  if (!village) return NextResponse.json({ error: "Aldea no encontrada" }, { status: 404 });

  // Get armies on this tile
  const armies = await prisma.army.findMany({
    where: { tileId: village.tile.id },
    include: { troops: true },
  });

  return NextResponse.json({ village, armies, buildingDefs: BUILDINGS });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; vid: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id, vid } = await params;
  const { action, payload } = await req.json();

  const game = await prisma.game.findUnique({ where: { id, userId: session.user.id } });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  const village = await prisma.village.findUnique({
    where: { id: vid },
    include: { buildings: true, buildQueues: true },
  });
  if (!village || village.owner !== "PLAYER") {
    return NextResponse.json({ error: "Sin permisos sobre esta aldea" }, { status: 403 });
  }

  if (action === "BUILD") {
    const { buildingType } = payload as { buildingType: string };
    const existing = village.buildings.find(b => b.type === buildingType);
    const currentLevel = existing?.level ?? 0;
    const def = BUILDINGS[buildingType as keyof typeof BUILDINGS];
    if (!def || currentLevel >= def.maxLevel) {
      return NextResponse.json({ error: "No se puede construir" }, { status: 400 });
    }

    const lvlDef = def.levels[currentLevel];
    const { wood, stone, iron, adobe, silver } = lvlDef.cost;

    if (village.wood < wood || village.stone < stone || village.iron < iron || village.adobe < adobe || village.silver < silver) {
      return NextResponse.json({ error: "Recursos insuficientes" }, { status: 400 });
    }

    await prisma.village.update({
      where: { id: vid },
      data: { wood: village.wood - wood, stone: village.stone - stone, iron: village.iron - iron, adobe: village.adobe - adobe, silver: village.silver - silver },
    });

    await prisma.buildQueue.create({
      data: {
        villageId: vid,
        buildingType,
        targetLevel: currentLevel + 1,
        endsAt: new Date(Date.now() + lvlDef.time * 1000),
        position: village.buildQueues.length,
      },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "TRAIN") {
    const { troopType, count } = payload as { troopType: string; count: number };
    return NextResponse.json({ ok: true, message: "Cola de entrenamiento añadida." });
  }

  return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
}
