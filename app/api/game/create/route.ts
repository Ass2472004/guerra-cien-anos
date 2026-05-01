import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNewGame } from "@/lib/game/engine/newgame";
import type { Faction } from "@/lib/game/constants/troops";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { faction } = await req.json() as { faction: Faction };
  if (!["ENGLAND", "FRANCE", "SPAIN"].includes(faction)) {
    return NextResponse.json({ error: "Faccion invalida" }, { status: 400 });
  }

  const game = await createNewGame((session.user as any).id, faction);
  return NextResponse.json({ gameId: game.id });
}
