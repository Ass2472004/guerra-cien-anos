import { prisma } from "@/lib/db";
import { TROOPS } from "../constants/troops";

// ─── SPY MISSION ─────────────────────────────────────────────────────────────

export interface SpyMissionResult {
  success: boolean;
  detected: boolean;
  spiesLost: number;
  report?: {
    villageName: string;
    owner: string;
    resources: Record<string, number>;
    buildings: Array<{ type: string; level: number }>;
    garrison: Array<{ type: string; count: number }>;
    wallLevel: number;
  };
  message: string;
}

export async function conductSpyMission(
  gameId: string,
  armyId: string,
  targetVillageId: string
): Promise<SpyMissionResult> {
  const army = await prisma.army.findFirst({
    where: { id: armyId, gameId, owner: "PLAYER" },
    include: { troops: true },
  });
  if (!army) return { success: false, detected: false, spiesLost: 0, message: "Ejército no encontrado." };

  // Collect spy units
  const spyTroops = army.troops.filter(t => TROOPS[t.type]?.role === "SPY");
  const spyCount = spyTroops.reduce((s, t) => s + t.count, 0);
  if (spyCount === 0) return { success: false, detected: false, spiesLost: 0, message: "No tienes unidades de espionaje en este ejército." };

  const target = await prisma.village.findFirst({
    where: { id: targetVillageId, gameId },
    include: {
      buildings: true,
      tile: { include: { armies: { include: { army: { include: { troops: true } } } } } },
    },
  });
  if (!target) return { success: false, detected: false, spiesLost: 0, message: "Aldea no encontrada." };

  // Defender watchtower level
  const watchtower = target.buildings.find(b => b.type === "WATCHTOWER");
  const watchLevel = watchtower?.level ?? 0;

  // Success formula: spies give advantage, watchtower and enemy spies hamper
  const successChance = Math.min(0.95, Math.max(0.1, 0.4 + (spyCount * 0.08) - (watchLevel * 0.1)));
  const success = Math.random() < successChance;

  if (!success) {
    const detected = Math.random() < (0.3 + watchLevel * 0.1);
    const spiesLost = detected ? Math.max(1, Math.floor(spyCount * 0.3)) : 0;

    // Lose spies if detected
    if (spiesLost > 0) {
      for (const st of spyTroops) {
        const lose = Math.min(st.count, Math.ceil(spiesLost * (st.count / spyCount)));
        const newCount = Math.max(0, st.count - lose);
        if (newCount === 0) {
          await prisma.armyTroop.delete({ where: { id: st.id } });
        } else {
          await prisma.armyTroop.update({ where: { id: st.id }, data: { count: newCount } });
        }
      }
    }

    return {
      success: false,
      detected,
      spiesLost,
      message: detected
        ? `¡Espionaje descubierto! ${spiesLost} espías capturados.`
        : "La misión fracasó. Los espías escaparon sin información.",
    };
  }

  // Gather garrison troops from armies on that tile
  const garrison: Array<{ type: string; count: number }> = [];
  for (const ap of target.tile.armies) {
    for (const t of ap.army.troops) {
      const existing = garrison.find(g => g.type === t.type);
      if (existing) existing.count += t.count;
      else garrison.push({ type: t.type, count: t.count });
    }
  }

  const report = {
    villageName: target.name,
    owner: target.owner,
    resources: {
      wood:   target.wood,
      stone:  target.stone,
      iron:   target.iron,
      grain:  target.grain,
      silver: target.silver,
      gold:   target.gold,
    },
    buildings: target.buildings.map(b => ({ type: b.type, level: b.level })),
    garrison,
    wallLevel: target.wallLevel,
  };

  // Save spy report
  await prisma.spyReport.create({
    data: {
      gameId,
      tileId: target.tileId,
      success: true,
      reportJson: JSON.stringify(report),
    },
  });

  return {
    success: true,
    detected: false,
    spiesLost: 0,
    report,
    message: `¡Misión exitosa! Información obtenida sobre ${target.name}.`,
  };
}

// ─── OASIS CONTROL BONUS ─────────────────────────────────────────────────────
// If a player army is foraging on an oasis tile, it gains extra resources

const OASIS_BONUSES: Record<string, Record<string, number>> = {
  OASIS_FOREST:   { wood: 25 },
  OASIS_STONE:    { stone: 20 },
  OASIS_IRON:     { iron: 15 },
  OASIS_GRAIN:    { grain: 30, straw: 12 },
  DEPOSIT_SILVER: { silver: 10 },
  DEPOSIT_GOLD:   { gold: 5 },
};

export async function processOasisBonuses(gameId: string) {
  const armies = await prisma.army.findMany({
    where: { gameId, owner: "PLAYER", isForaging: true, tileId: { not: null } },
    include: { troops: true },
  });

  for (const army of armies) {
    if (!army.tileId) continue;
    const tile = await prisma.tile.findUnique({ where: { id: army.tileId } });
    if (!tile) continue;

    const bonus = OASIS_BONUSES[tile.type];
    if (!bonus) continue;

    // Apply bonus to the army's carried supplies (grain) or closest player village
    const playerVillage = await prisma.village.findFirst({
      where: { gameId, owner: "PLAYER" },
      orderBy: { id: "asc" },
    });
    if (!playerVillage) continue;

    const update: Record<string, number> = {};
    for (const [res, amount] of Object.entries(bonus)) {
      if (res === "grain" || res === "straw") {
        update[res] = Math.min((playerVillage as any)[res] + amount, playerVillage.granaryCap);
      } else {
        update[res] = Math.min((playerVillage as any)[res] + amount, playerVillage.warehouseCap);
      }
    }

    await prisma.village.update({ where: { id: playerVillage.id }, data: update });
  }
}
