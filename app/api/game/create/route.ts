import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNewGame } from "@/lib/game/engine/newgame";
import type { Faction } from "@/lib/game/constants/troops";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { faction, playerName, houseName } = await req.json() as {
    faction: Faction;
    playerName?: string;
    houseName?: string;
  };

  if (!["PORTADORES", "IMPERIO", "FEDERACION"].includes(faction)) {
    return NextResponse.json({ error: "Facción inválida" }, { status: 400 });
  }

  const game = await createNewGame(
    (session.user as any).id,
    faction,
    playerName?.trim() || "",
    houseName?.trim() || "",
  );
  return NextResponse.json({ gameId: game.id });
}
