import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HEROES, ITEMS } from "@/lib/game/constants/heroes";
import { addPrestige, updateNobilityTitle } from "@/lib/game/engine/nobility";
import { PRESTIGE_ADVENTURE } from "@/lib/game/constants/nobility";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;

  const game = await prisma.game.findUnique({ where: { id, userId } });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  const hero = await prisma.hero.findUnique({
    where: { gameId: id },
    include: { equipment: true, army: { include: { troops: true } } },
  });
  if (!hero) return NextResponse.json({ error: "Heroe no encontrado" }, { status: 404 });

  const def = HEROES[hero.faction as keyof typeof HEROES];

  return NextResponse.json({ hero, def, items: ITEMS });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { action, payload } = await req.json();
  const userId = (session.user as any).id;

  const game = await prisma.game.findUnique({ where: { id, userId } });
  if (!game) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  const hero = await prisma.hero.findUnique({ where: { gameId: id } });
  if (!hero) return NextResponse.json({ error: "Heroe no encontrado" }, { status: 404 });

  if (action === "ALLOCATE") {
    const { fightingStrength = 0, attackBonus = 0, defenseBonus = 0, resourceBonus = 0 } = payload as Record<string, number>;
    const total = fightingStrength + attackBonus + defenseBonus + resourceBonus;
    if (total > hero.skillPoints || total < 0) {
      return NextResponse.json({ error: "Puntos invalidos" }, { status: 400 });
    }
    await prisma.hero.update({
      where: { id: hero.id },
      data: {
        fightingStrength: hero.fightingStrength + fightingStrength,
        attackBonus: hero.attackBonus + attackBonus,
        defenseBonus: hero.defenseBonus + defenseBonus,
        resourceBonus: hero.resourceBonus + resourceBonus,
        skillPoints: hero.skillPoints - total,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "ASSIGN_ARMY") {
    const { armyId } = payload as { armyId: string | null };
    if (armyId === null) {
      await prisma.hero.update({ where: { id: hero.id }, data: { armyId: null } });
      return NextResponse.json({ ok: true });
    }
    const army = await prisma.army.findFirst({ where: { id: armyId, gameId: id, owner: "PLAYER" } });
    if (!army) return NextResponse.json({ error: "Ejercito no encontrado" }, { status: 404 });
    await prisma.hero.update({ where: { id: hero.id }, data: { armyId } });
    return NextResponse.json({ ok: true });
  }

  if (action === "ADVENTURE") {
    if (hero.isOnAdventure) return NextResponse.json({ error: "Ya en aventura" }, { status: 400 });
    if (!hero.isAlive) return NextResponse.json({ error: "Heroe muerto" }, { status: 400 });
    // Find a RUINS tile within visible area
    const ruinTiles = await prisma.tile.findMany({
      where: { gameId: id, type: "RUINS", visibility: { in: ["VISIBLE", "FOG"] } },
    });
    if (ruinTiles.length === 0) return NextResponse.json({ error: "No hay ruinas exploradas" }, { status: 400 });
    const target = ruinTiles[Math.floor(Math.random() * ruinTiles.length)];
    const duration = 5 * 60 * 1000; // 5 minutes
    await prisma.hero.update({
      where: { id: hero.id },
      data: { isOnAdventure: true, adventureEndsAt: new Date(Date.now() + duration), adventureTileId: target.id },
    });
    return NextResponse.json({ ok: true, eta: duration / 1000 });
  }

  if (action === "COMPLETE_ADVENTURE") {
    if (!hero.isOnAdventure || !hero.adventureEndsAt || hero.adventureEndsAt > new Date()) {
      return NextResponse.json({ error: "Aventura no terminada" }, { status: 400 });
    }
    // Random rewards: XP + chance of item
    const xpReward = 50 + Math.floor(Math.random() * 100);
    const itemKeys = Object.keys(ITEMS);
    const rewardItem = Math.random() < 0.6 ? itemKeys[Math.floor(Math.random() * itemKeys.length)] : null;

    let newXp = hero.xp + xpReward;
    let newLevel = hero.level;
    let newXpNext = hero.xpNext;
    let newSp = hero.skillPoints;
    while (newXp >= newXpNext) {
      newXp -= newXpNext;
      newLevel++;
      newSp += 4;
      newXpNext = Math.floor(newXpNext * 1.4);
    }

    await prisma.hero.update({
      where: { id: hero.id },
      data: {
        isOnAdventure: false, adventureEndsAt: null, adventureTileId: null,
        xp: newXp, level: newLevel, xpNext: newXpNext, skillPoints: newSp,
      },
    });

    if (rewardItem) {
      const itemDef = ITEMS[rewardItem];
      // Check if slot already occupied → leave for player to manually replace later (here we auto-replace)
      const existing = await prisma.heroEquipment.findUnique({ where: { heroId_slot: { heroId: hero.id, slot: itemDef.slot } } });
      if (existing) {
        await prisma.heroEquipment.update({
          where: { id: existing.id },
          data: { item: itemDef.key, tier: itemDef.tier, bonusJson: JSON.stringify(itemDef.bonuses) },
        });
      } else {
        await prisma.heroEquipment.create({
          data: { heroId: hero.id, slot: itemDef.slot, item: itemDef.key, tier: itemDef.tier, bonusJson: JSON.stringify(itemDef.bonuses) },
        });
      }
    }

    // Award prestige for completing adventure
    await addPrestige(id, PRESTIGE_ADVENTURE);
    await updateNobilityTitle(id);

    return NextResponse.json({ ok: true, xpReward, item: rewardItem });
  }

  return NextResponse.json({ error: "Accion desconocida" }, { status: 400 });
}
