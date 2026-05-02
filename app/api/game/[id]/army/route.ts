import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findPath } from "@/lib/game/engine/supply";
import { TROOPS } from "@/lib/game/constants/troops";
import { conductSpyMission } from "@/lib/game/engine/spy";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;

  const armies = await prisma.army.findMany({
    where: { game: { id, userId }, owner: "PLAYER" },
    include: { troops: true, supplyLine: true },
  });
  return NextResponse.json({ armies });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { action, payload } = await req.json();
  const userId = (session.user as any).id;

  const game = await prisma.game.findUnique({ where: { id, userId } });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  if (action === "MOVE") {
    const { armyId, targetX, targetY } = payload as { armyId: string; targetX: number; targetY: number };
    const army = await prisma.army.findFirst({ where: { id: armyId, gameId: id, owner: "PLAYER" }, include: { troops: true } });
    if (!army) return NextResponse.json({ error: "Ejercito no encontrado" }, { status: 404 });
    if (army.isMoving) return NextResponse.json({ error: "El ejercito ya esta en marcha" }, { status: 400 });

    const fromTile = await prisma.tile.findUnique({ where: { id: army.tileId! } });
    const toTile   = await prisma.tile.findFirst({ where: { gameId: id, x: targetX, y: targetY } });
    if (!fromTile || !toTile) return NextResponse.json({ error: "Casilla no encontrada" }, { status: 404 });
    if (toTile.type === "MOUNTAIN") return NextResponse.json({ error: "No puedes mover tropas a montanas" }, { status: 400 });

    const minSpeed = army.troops.reduce((min: number, t: any) => Math.min(min, TROOPS[t.type]?.speed ?? 2), 99);
    const staminaPenalty = army.stamina < 30 ? 0.5 : 1;
    const path = findPath(fromTile.x, fromTile.y, targetX, targetY, new Set(), game.mapWidth, game.mapHeight);
    if (!path) return NextResponse.json({ error: "Ruta bloqueada" }, { status: 400 });

    const secondsPerStep = Math.round(60 / (minSpeed * staminaPenalty));
    await prisma.army.update({
      where: { id: armyId },
      data: {
        isMoving: true, isResting: false, isForaging: false,
        targetTileId: toTile.id,
        pathJson: JSON.stringify(path),
        arrivesAt: new Date(Date.now() + path.length * secondsPerStep * 1000),
      },
    });
    return NextResponse.json({ ok: true, eta: path.length * secondsPerStep });
  }

  if (action === "MERGE") {
    const { armyFromId, armyIntoId } = payload as { armyFromId: string; armyIntoId: string };
    const from = await prisma.army.findFirst({ where: { id: armyFromId, gameId: id, owner: "PLAYER" }, include: { troops: true } });
    const into = await prisma.army.findFirst({ where: { id: armyIntoId, gameId: id, owner: "PLAYER" }, include: { troops: true } });
    if (!from || !into) return NextResponse.json({ error: "Ejercitos no encontrados" }, { status: 404 });
    if (from.tileId !== into.tileId) return NextResponse.json({ error: "Deben estar en la misma casilla" }, { status: 400 });

    for (const troop of from.troops) {
      const existing = into.troops.find((t: any) => t.type === troop.type);
      if (existing) {
        await prisma.armyTroop.update({ where: { id: existing.id }, data: { count: existing.count + troop.count } });
      } else {
        await prisma.armyTroop.create({ data: { armyId: armyIntoId, type: troop.type, faction: troop.faction, count: troop.count } });
      }
    }
    await prisma.army.delete({ where: { id: armyFromId } });
    return NextResponse.json({ ok: true });
  }

  if (action === "REST") {
    const { armyId } = payload as { armyId: string };
    const army = await prisma.army.findFirst({ where: { id: armyId, gameId: id, owner: "PLAYER" } });
    if (!army) return NextResponse.json({ error: "Ejercito no encontrado" }, { status: 404 });
    await prisma.army.update({ where: { id: armyId }, data: { isResting: !army.isResting, isForaging: false, isMoving: false } });
    return NextResponse.json({ ok: true, isResting: !army.isResting });
  }

  if (action === "FORAGE") {
    const { armyId } = payload as { armyId: string };
    const army = await prisma.army.findFirst({ where: { id: armyId, gameId: id, owner: "PLAYER" } });
    if (!army) return NextResponse.json({ error: "Ejercito no encontrado" }, { status: 404 });
    await prisma.army.update({ where: { id: armyId }, data: { isForaging: !army.isForaging, isResting: false, isMoving: false } });
    return NextResponse.json({ ok: true, isForaging: !army.isForaging });
  }

  if (action === "INFILTRATE") {
    const { armyId, targetVillageId } = payload as { armyId: string; targetVillageId: string };
    const result = await conductSpyMission(id, armyId, targetVillageId);
    return NextResponse.json(result);
  }

  if (action === "TRIBUTE") {
    // Pay silver to convert a neutral village diplomatically
    const { armyId, targetVillageId } = payload as { armyId: string; targetVillageId: string };

    const army = await prisma.army.findFirst({ where: { id: armyId, gameId: id, owner: "PLAYER" } });
    if (!army) return NextResponse.json({ error: "Ejército no encontrado" }, { status: 404 });

    const targetVillage = await prisma.village.findFirst({ where: { id: targetVillageId, gameId: id } });
    if (!targetVillage) return NextResponse.json({ error: "Aldea no encontrada" }, { status: 404 });
    if (targetVillage.owner !== "AI_NEUTRAL") return NextResponse.json({ error: "Solo puedes tributar aldeas neutrales" }, { status: 400 });
    if (army.tileId !== targetVillage.tileId) return NextResponse.json({ error: "El ejército debe estar en la misma casilla" }, { status: 400 });

    // Cost scales with loyalty (loyal villages are harder to buy)
    const silverCost = Math.round(targetVillage.loyalty * 2.5);

    // Deduct from player's main village
    const playerVillage = await prisma.village.findFirst({ where: { gameId: id, owner: "PLAYER" } });
    if (!playerVillage) return NextResponse.json({ error: "Sin aldeas propias" }, { status: 400 });
    if (playerVillage.silver < silverCost) {
      return NextResponse.json({ error: `Necesitas ${silverCost} 🪙 plata (tienes ${playerVillage.silver})` }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.village.update({
        where: { id: playerVillage.id },
        data: { silver: playerVillage.silver - silverCost },
      }),
      prisma.village.update({
        where: { id: targetVillageId },
        data: { owner: "PLAYER", faction: game.faction, loyalty: 55 },
      }),
      prisma.gameEvent.create({
        data: {
          gameId: id,
          type: "DISCOVERY",
          title: `${targetVillage.name} se une al reino`,
          description: `Mediante el pago de ${silverCost} monedas de plata, ${targetVillage.name} ha jurado lealtad a tu estandarte sin que corra sangre.`,
          affectedId: targetVillageId,
          effectJson: JSON.stringify({ silver: -silverCost }),
        },
      }),
    ]);

    return NextResponse.json({ ok: true, silverCost, villageName: targetVillage.name });
  }

  return NextResponse.json({ error: "Accion desconocida" }, { status: 400 });
}
