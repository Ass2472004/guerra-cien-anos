import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hashed } });

  return NextResponse.json({ id: user.id, email: user.email });
}
