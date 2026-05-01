import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findPath } from "@/lib/game/engine/supply";
import { TROOPS } from "@/lib/game/constants/troops";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const armies = await prisma.army.findMany({
    where: { game: { id, userId: session.user.id }, owner: "PLAYER" },
    include: { troops: true, supplyLine: true },
  });
  return NextResponse.json({ armies });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { action, payload } = await req.json();

  const game = await prisma.game.findUnique({ where: { id, userId: session.user.id } });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  // MOVE: send army to target tile
  if (action === "MOVE") {
    const { armyId, targetX, targetY } = payload as { armyId: string; targetX: number; targetY: number };
    const army = await prisma.army.findFirst({ where: { id: armyId, gameId: id, owner: "PLAYER" }, include: { troops: true } });
    if (!army) return NextResponse.json({ error: "Ejército no encontrado" }, { status: 404 });
    if (army.isMoving) return NextResponse.json({ error: "El ejército ya está en marcha" }, { status: 400 });

    const fromTile = await prisma.tile.findUnique({ where: { id: army.tileId! } });
    const toTile   = await prisma.tile.findFirst({ where: { gameId: id, x: targetX, y: targetY } });
    if (!fromTile || !toTile) return NextResponse.json({ error: "Casilla no encontrada" }, { status: 404 });

    if (toTile.type === "MOUNTAIN") return NextResponse.json({ error: "No puedes mover tropas a montañas" }, { status: 400 });

    // Speed: slowest troop in army determines march speed
    const minSpeed = army.troops.reduce((min, t) => {
      const speed = TROOPS[t.type]?.speed ?? 2;
      return Math.min(min, speed);
    }, 99);
    const staminaPenalty = army.stamina < 30 ? 0.5 : 1;

    const path = findPath(fromTile.x, fromTile.y, targetX, targetY, new Set(), game.mapWidth, game.mapHeight);
    if (!path) return NextResponse.json({ error: "Ruta bloqueada" }, { status: 400 });

    const secondsPerStep = Math.round(60 / (minSpeed * staminaPenalty));
    const totalSeconds = path.length * secondsPerStep;

    await prisma.army.update({
      where: { id: armyId },
      data: {
        isMoving: true, isResting: false, isForaging: false,
        targetTileId: toTile.id,
        pathJson: JSON.stringify(path),
        arrivesAt: new Date(Date.now() + totalSeconds * 1000),
      },
    });
    return NextResponse.json({ ok: true, eta: totalSeconds });
  }

  // MERGE: combine two player armies on the same tile
  if (action === "MERGE") {
    const { armyFromId, armyIntoId } = payload as { armyFromId: string; armyIntoId: string };
    const from = await prisma.army.findFirst({ where: { id: armyFromId, gameId: id, owner: "PLAYER" }, include: { troops: true } });
    const into = await prisma.army.findFirst({ where: { id: armyIntoId, gameId: id, owner: "PLAYER" }, include: { troops: true } });
    if (!from || !into) return NextResponse.json({ error: "Ejércitos no encontrados" }, { status: 404 });
    if (from.tileId !== into.tileId) return NextResponse.json({ error: "Los ejércitos deben estar en la misma casilla" }, { status: 400 });

    for (const troop of from.troops) {
      const existing = into.troops.find(t => t.type === troop.type);
      if (existing) {
        await prisma.armyTroop.update({ where: { id: existing.id }, data: { count: existing.count + troop.count } });
      } else {
        await prisma.armyTroop.create({ data: { armyId: armyIntoId, type: troop.type, faction: troop.faction, count: troop.count } });
      }
    }
    await prisma.army.delete({ where: { id: armyFromId } });
    return NextResponse.json({ ok: true });
  }

  // REST: toggle resting on current tile / camp
  if (action === "REST") {
    const { armyId } = payload as { armyId: string };
    const army = await prisma.army.findFirst({ where: { id: armyId, gameId: id, owner: "PLAYER" } });
    if (!army) return NextResponse.json({ error: "Ejército no encontrado" }, { status: 404 });
    await prisma.army.update({ where: { id: armyId }, data: { isResting: !army.isResting, isForaging: false, isMoving: false } });
    return NextResponse.json({ ok: true, isResting: !army.isResting });
  }

  // FORAGE: toggle foraging
  if (action === "FORAGE") {
    const { armyId } = payload as { armyId: string };
    const army = await prisma.army.findFirst({ where: { id: armyId, gameId: id, owner: "PLAYER" } });
    if (!army) return NextResponse.json({ error: "Ejército no encontrado" }, { status: 404 });
    await prisma.army.update({ where: { id: armyId }, data: { isForaging: !army.isForaging, isResting: false, isMoving: false } });
    return NextResponse.json({ ok: true, isForaging: !army.isForaging });
  }

  return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
}
