import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HEROES, ITEMS } from "@/lib/game/constants/heroes";
import { addPrestige, updateNobilityTitle } from "@/lib/game/engine/nobility";
import { PRESTIGE_ADVENTURE } from "@/lib/game/constants/nobility";

// ─── Adventure types ─────────────────────────────────────────────────────────
export const ADVENTURE_TYPES = {
  RUINS: {
    key: "RUINS", name: "Ruinas antiguas", icon: "🏚",
    desc: "Explora vestigios de civilizaciones extintas. Alta probabilidad de equipo.",
    durationMin: 5, xpMin: 40, xpMax: 90, itemChance: 0.70, silverReward: 0,
    needsTile: "RUINS" as const,
  },
  DUNGEON: {
    key: "DUNGEON", name: "Mazmorra olvidada", icon: "⛏",
    desc: "Desciende a las profundidades. Riesgo alto, recompensa alta.",
    durationMin: 8, xpMin: 80, xpMax: 160, itemChance: 0.50, silverReward: 0,
    needsTile: null,
  },
  BANDIT_CAMP: {
    key: "BANDIT_CAMP", name: "Campamento bandido", icon: "🗡",
    desc: "Asalta un nido de forajidos y reclama su botín en plata.",
    durationMin: 6, xpMin: 60, xpMax: 100, itemChance: 0.30, silverReward: 80,
    needsTile: null,
  },
  TOURNAMENT: {
    key: "TOURNAMENT", name: "Torneo de caballeros", icon: "⚔",
    desc: "Demuestra tu valía ante la nobleza. Gran XP y prestigio.",
    durationMin: 10, xpMin: 120, xpMax: 200, itemChance: 0.40, silverReward: 0,
    needsTile: null,
  },
  TRADE_CARAVAN: {
    key: "TRADE_CARAVAN", name: "Caravana comercial", icon: "🏺",
    desc: "Escolta a comerciantes a través de territorios peligrosos. Rápido y rentable.",
    durationMin: 4, xpMin: 30, xpMax: 60, itemChance: 0.20, silverReward: 120,
    needsTile: null,
  },
} as const;

export type AdventureType = keyof typeof ADVENTURE_TYPES;

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

  return NextResponse.json({ hero, def, items: ITEMS, adventureTypes: ADVENTURE_TYPES });
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

    const adventureTypeKey = (payload?.adventureType ?? "RUINS") as AdventureType;
    const def = ADVENTURE_TYPES[adventureTypeKey] ?? ADVENTURE_TYPES.RUINS;

    // RUINS type needs an actual ruins tile
    let adventureTileId: string | null = null;
    if (def.needsTile) {
      const tiles = await prisma.tile.findMany({
        where: { gameId: id, type: def.needsTile, visibility: { in: ["VISIBLE", "FOG"] } },
      });
      if (tiles.length === 0) return NextResponse.json({ error: "No hay ruinas exploradas en el mapa" }, { status: 400 });
      adventureTileId = tiles[Math.floor(Math.random() * tiles.length)].id;
    }

    const duration = def.durationMin * 60 * 1000;
    await prisma.hero.update({
      where: { id: hero.id },
      data: {
        isOnAdventure: true,
        adventureEndsAt: new Date(Date.now() + duration),
        adventureTileId,
      },
    });
    return NextResponse.json({ ok: true, eta: duration / 1000, adventureType: def.key, name: def.name });
  }

  if (action === "COMPLETE_ADVENTURE") {
    if (!hero.isOnAdventure || !hero.adventureEndsAt || hero.adventureEndsAt > new Date()) {
      return NextResponse.json({ error: "Aventura no terminada" }, { status: 400 });
    }

    // Determine which adventure was being done (we store adventureTileId; use a heuristic)
    // We'll give a generous reward set based on duration
    const elapsed = Date.now() - (new Date(hero.adventureEndsAt).getTime());
    const wasLong = elapsed < 5 * 60 * 1000; // if ends very recently it was a short mission

    const xpReward = 50 + Math.floor(Math.random() * 130);
    const itemKeys = Object.keys(ITEMS);
    const rewardItem = Math.random() < 0.55 ? itemKeys[Math.floor(Math.random() * itemKeys.length)] : null;
    const silverReward = Math.random() < 0.4 ? 40 + Math.floor(Math.random() * 80) : 0;

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

    // Silver reward → add to player's first village
    if (silverReward > 0) {
      const playerVillage = await prisma.village.findFirst({ where: { gameId: id, owner: "PLAYER" } });
      if (playerVillage) {
        await prisma.village.update({
          where: { id: playerVillage.id },
          data: { silver: Math.min(playerVillage.silver + silverReward, playerVillage.warehouseCap) },
        });
      }
    }

    // Award equipment
    if (rewardItem) {
      const itemDef = ITEMS[rewardItem];
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

    await addPrestige(id, PRESTIGE_ADVENTURE);
    await updateNobilityTitle(id);

    return NextResponse.json({ ok: true, xpReward, item: rewardItem, silverReward: silverReward > 0 ? silverReward : null });
  }

  return NextResponse.json({ error: "Accion desconocida" }, { status: 400 });
}
