import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 确保 DATABASE_URL 环境变量已设置
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://root:123456@localhost:3306/realestate_etf';
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

