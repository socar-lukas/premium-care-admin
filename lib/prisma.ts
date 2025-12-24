import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DATABASE_URL이 없으면 기본값 사용
let databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// PostgreSQL Connection Pooler 사용 시 pgbouncer 파라미터 추가
if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
  // 이미 pgbouncer 파라미터가 없으면 추가
  if (!databaseUrl.includes('pgbouncer=true') && !databaseUrl.includes('?')) {
    databaseUrl = `${databaseUrl}?pgbouncer=true&connect_timeout=10`;
  } else if (!databaseUrl.includes('pgbouncer=true')) {
    databaseUrl = `${databaseUrl}&pgbouncer=true&connect_timeout=10`;
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


