import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const dbUrl = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
  // PrismaLibSql accepts either a libsql Client or a Config object
  const adapter = new PrismaLibSql({ url: dbUrl.startsWith("file:") ? dbUrl.replace("file:", "file://") : dbUrl });
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
