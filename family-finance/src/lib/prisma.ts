import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient. En desarrollo Next.js recarga módulos en caliente,
 * por lo que reutilizamos la instancia global para no agotar el pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
