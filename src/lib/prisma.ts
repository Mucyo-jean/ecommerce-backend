import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

// Single shared Prisma client instance (prevents connection pool exhaustion
// during hot-reload in development).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ['error'] : ['query', 'warn', 'error'],
  });

if (!env.isProd) {
  globalForPrisma.prisma = prisma;
}
