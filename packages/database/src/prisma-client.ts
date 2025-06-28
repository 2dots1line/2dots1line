import { PrismaClient } from '@prisma/client';

// Re-export Prisma types for use in repositories
export { PrismaClient, Prisma } from '@prisma/client';
export * from '@prisma/client';

// This pattern prevents creating multiple PrismaClient instances in development
// due to hot-reloading.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 