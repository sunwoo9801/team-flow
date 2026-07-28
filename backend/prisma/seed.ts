import 'dotenv/config';
import { PrismaClient, AuthProvider, MemberRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.card.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.inviteToken.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password1234!', 10);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@teamflow.dev',
      name: 'Alice Kim',
      password: hashedPassword,
      provider: AuthProvider.local,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@teamflow.dev',
      name: 'Bob Lee',
      password: hashedPassword,
      provider: AuthProvider.local,
    },
  });

  console.log('✅ 유저 생성:', alice.email, bob.email);

  const workspace = await prisma.workspace.create({
    data: {
      name: 'TeamFlow Dev',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: MemberRole.admin },
          { userId: bob.id, role: MemberRole.member },
        ],
      },
    },
  });

  console.log('✅ 워크스페이스 생성:', workspace.name);

  const board = await prisma.board.create({
    data: { title: 'Sprint 1', workspaceId: workspace.id },
  });

  console.log('✅ 보드 생성:', board.title);

  const [colTodo, colInProgress, colDone] = await Promise.all([
    prisma.column.create({
      data: { title: 'Todo', position: 1.0, boardId: board.id },
    }),
    prisma.column.create({
      data: { title: 'In Progress', position: 2.0, boardId: board.id },
    }),
    prisma.column.create({
      data: { title: 'Done', position: 3.0, boardId: board.id },
    }),
  ]);

  console.log('✅ 컬럼 생성: Todo / In Progress / Done');

  await Promise.all([
    prisma.card.create({
      data: {
        title: '프로젝트 초기 세팅',
        description: '모노레포 구조, Docker, CI 파이프라인 설정',
        position: 1.0,
        columnId: colDone.id,
        assignees: { create: { userId: alice.id } },
      },
    }),
    prisma.card.create({
      data: {
        title: 'DB 스키마 설계',
        description: 'Prisma 7 기반 ERD 설계 및 마이그레이션',
        position: 2.0,
        columnId: colDone.id,
        assignees: { create: { userId: alice.id } },
      },
    }),
    prisma.card.create({
      data: {
        title: 'JWT 인증 구현',
        description: 'Access Token + Refresh Token 전략',
        position: 1.0,
        columnId: colInProgress.id,
        assignees: { create: { userId: bob.id } },
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.card.create({
      data: {
        title: '보드 CRUD API',
        description: 'Board, Column, Card REST API 엔드포인트',
        position: 1.0,
        columnId: colTodo.id,
        assignees: { create: { userId: bob.id } },
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.card.create({
      data: {
        title: '실시간 Socket.io 연동',
        description: '카드 이동 시 실시간 동기화',
        position: 2.0,
        columnId: colTodo.id,
        assignees: { create: { userId: alice.id } },
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ 카드 5개 생성 완료');
  console.log('\n🎉 Seed 완료!');
  console.log('alice@teamflow.dev / password1234!');
  console.log('bob@teamflow.dev   / password1234!');
}

main()
  .catch((err) => {
    console.error('❌ Seed 실패:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
