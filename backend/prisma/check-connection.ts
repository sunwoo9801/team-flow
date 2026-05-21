import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

async function checkConnection() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW()`;
    console.log('✅ DB 연결 성공:', result[0].now);

    const counts = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.board.count(),
      prisma.column.count(),
      prisma.card.count(),
    ]);
    console.log('📊 테이블 레코드 수:', {
      users: counts[0],
      workspaces: counts[1],
      boards: counts[2],
      columns: counts[3],
      cards: counts[4],
    });
  } catch (error) {
    console.error('❌ DB 연결 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
