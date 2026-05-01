import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";
import { pathToFileURL } from "node:url";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function buildLibsqlUrl(rawUrl: string | undefined): string {
  if (!rawUrl) {
    const abs = path.join(process.cwd(), "prisma", "dev.db");
    return pathToFileURL(abs).href; // file:///C:/...
  }
  // Already a remote libsql/turso URL
  if (rawUrl.startsWith("libsql:") || rawUrl.startsWith("https:") || rawUrl.startsWith("http:")) return rawUrl;
  // Already a proper file:// URL
  if (rawUrl.startsWith("file://")) return rawUrl;
  // Relative file: URL — convert to absolute file://
  if (rawUrl.startsWith("file:")) {
    const relPath = rawUrl.replace(/^file:/, "");
    const abs = path.isAbsolute(relPath) ? relPath : path.join(process.cwd(), relPath);
    return pathToFileURL(abs).href;
  }
  // Plain path
  const abs = path.isAbsolute(rawUrl) ? rawUrl : path.join(process.cwd(), rawUrl);
  return pathToFileURL(abs).href;
}

function createPrisma() {
  const url = buildLibsqlUrl(process.env.DATABASE_URL);
  const authToken = process.env.LIBSQL_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
