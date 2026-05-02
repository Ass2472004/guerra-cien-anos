import { prisma } from "@/lib/db";
import { computeTitle } from "../constants/nobility";

/**
 * Re-evaluate the player's nobility title based on current village count + prestige.
 * Called at the end of every tick.
 */
export async function updateNobilityTitle(gameId: string) {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    select: { id: true, nobilityTitle: true, nobilityXp: true },
  });

  const playerVillages = await prisma.village.count({
    where: { gameId, owner: "PLAYER" },
  });

  const newTitle = computeTitle(playerVillages, game.nobilityXp);

  if (newTitle !== game.nobilityTitle) {
    await prisma.game.update({
      where: { id: gameId },
      data: { nobilityTitle: newTitle },
    });
  }
}

/** Add prestige points (from battle wins, village captures, etc.) */
export async function addPrestige(gameId: string, amount: number) {
  await prisma.game.update({
    where: { id: gameId },
    data: { nobilityXp: { increment: amount } },
  });
}
