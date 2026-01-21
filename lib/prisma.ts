import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DATABASE_URL이 없으면 기본값 사용
let databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// PostgreSQL Connection Pooler 사용 시 pgbouncer 파라미터 추가 (Supabase 최적화)
if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
  // Supabase pooler 사용 시 설정
  const params = new URLSearchParams();
  params.set('pgbouncer', 'true');
  params.set('connection_limit', '1'); // Serverless 환경에서는 1로 설정
  params.set('connect_timeout', '30'); // 연결 타임아웃 증가
  params.set('pool_timeout', '30'); // 풀 타임아웃 증가

  if (!databaseUrl.includes('?')) {
    databaseUrl = `${databaseUrl}?${params.toString()}`;
  } else {
    // 기존 파라미터가 있으면 pgbouncer만 확인
    if (!databaseUrl.includes('pgbouncer=true')) {
      databaseUrl = `${databaseUrl}&${params.toString()}`;
    }
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


