import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BUILDINGS } from "@/lib/game/constants/buildings";
import { TROOPS } from "@/lib/game/constants/troops";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; vid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id, vid } = await params;
  const userId = (session.user as any).id;

  const game = await prisma.game.findUnique({ where: { id, userId } });
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

  const armies = await prisma.army.findMany({
    where: { tileId: village.tile.id },
    include: { troops: true },
  });

  return NextResponse.json({ village, armies });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; vid: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id, vid } = await params;
  const { action, payload } = await req.json();
  const userId = (session.user as any).id;

  const game = await prisma.game.findUnique({ where: { id, userId } });
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
    const existing = village.buildings.find((b: any) => b.type === buildingType);
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
        villageId: vid, buildingType,
        targetLevel: currentLevel + 1,
        endsAt: new Date(Date.now() + lvlDef.time * 1000),
        position: village.buildQueues.length,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "TRAIN") {
    const { troopType, count } = payload as { troopType: string; count: number };
    const troopDef = TROOPS[troopType];
    if (!troopDef) return NextResponse.json({ error: "Tipo de tropa desconocido" }, { status: 400 });

    // Check resources
    const c = troopDef.cost;
    const needed = {
      wood:   c.wood   * count,
      stone:  c.stone  * count,
      iron:   c.iron   * count,
      grain:  c.grain  * count,
      silver: c.silver * count,
    };
    if (village.wood < needed.wood || village.stone < needed.stone || village.iron < needed.iron ||
        village.grain < needed.grain || village.silver < needed.silver) {
      return NextResponse.json({ error: "Recursos insuficientes para reclutar" }, { status: 400 });
    }

    // Deduct resources
    await prisma.village.update({
      where: { id: vid },
      data: {
        wood:   village.wood   - needed.wood,
        stone:  village.stone  - needed.stone,
        iron:   village.iron   - needed.iron,
        grain:  village.grain  - needed.grain,
        silver: village.silver - needed.silver,
      },
    });

    // Use real trainTime from constants (seconds per unit * count, with nobility discount later)
    const totalTrainSeconds = troopDef.trainTime * count;
    await prisma.trainQueue.create({
      data: {
        villageId: vid, troopType,
        faction: village.faction ?? game.faction,
        count,
        endsAt: new Date(Date.now() + totalTrainSeconds * 1000),
        position: 0,
      },
    });
    return NextResponse.json({ ok: true, message: `${count} ${troopDef.name} en entrenamiento (${Math.ceil(totalTrainSeconds / 60)}min).` });
  }

  // TRADE: spend silver/gold to buy resources
  if (action === "TRADE") {
    const { resource, amount } = payload as { resource: string; amount: number };
    const hasMarket = village.buildings.some((b: any) => b.type === "MARKET");
    if (!hasMarket) return NextResponse.json({ error: "Necesitas un Mercado" }, { status: 400 });

    const TRADE_RATES: Record<string, { silverCost: number; cap: string }> = {
      wood:  { silverCost: 2, cap: "warehouseCap" },
      stone: { silverCost: 2, cap: "warehouseCap" },
      iron:  { silverCost: 4, cap: "warehouseCap" },
      grain: { silverCost: 1, cap: "granaryCap" },
      adobe: { silverCost: 3, cap: "warehouseCap" },
    };

    const rate = TRADE_RATES[resource];
    if (!rate) return NextResponse.json({ error: "Recurso no comerciable" }, { status: 400 });

    const totalCost = rate.silverCost * amount;
    if (village.silver < totalCost) {
      return NextResponse.json({ error: `Necesitas ${totalCost} plata` }, { status: 400 });
    }

    const cap = (village as any)[rate.cap] as number;
    const current = (village as any)[resource] as number ?? 0;
    const actual = Math.min(amount, cap - current);
    if (actual <= 0) return NextResponse.json({ error: "Almacén lleno" }, { status: 400 });

    const actualCost = rate.silverCost * actual;
    await prisma.village.update({
      where: { id: vid },
      data: { silver: village.silver - actualCost, [resource]: current + actual },
    });
    return NextResponse.json({ ok: true, message: `Comprado: ${actual} ${resource} por ${actualCost} plata.` });
  }

  // RENAME village
  if (action === "RENAME") {
    const { name } = payload as { name: string };
    if (!name || name.length < 2 || name.length > 30) {
      return NextResponse.json({ error: "Nombre inválido (2-30 caracteres)" }, { status: 400 });
    }
    await prisma.village.update({ where: { id: vid }, data: { name: name.trim() } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Accion desconocida" }, { status: 400 });
}
