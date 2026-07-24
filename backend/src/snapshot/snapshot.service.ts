import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { BoardGateway } from '../gateway/board.gateway';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import type { SnapshotData } from './snapshot.types';

@Injectable()
export class SnapshotService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,

    @Inject(BoardService)
    private readonly boardService: BoardService,

    @Inject(BoardGateway)
    private readonly gateway: BoardGateway,
  ) {}

  async create(userId: string, boardId: string, dto: CreateSnapshotDto) {
    const board = await this.boardService.findOne(userId, boardId);

    const data: SnapshotData = {
      columns: board.columns.map(col => ({
        id: col.id,
        title: col.title,
        position: col.position,
        cards: col.cards.map(card => ({
          id: card.id,
          title: card.title,
          description: card.description,
          position: card.position,
          dueDate: card.dueDate ? card.dueDate.toISOString() : null,
          assigneeId: card.assigneeId,
          labelIds: card.labels?.map(l => l.id) ?? [],
        })),
      })),
    };

    return this.prisma.boardSnapshot.create({
      data: {
        boardId,
        userId,
        label: dto.label,
        data: data as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        label: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async findByBoard(userId: string, boardId: string) {
    await this.boardService.findOne(userId, boardId);
    return this.prisma.boardSnapshot.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async remove(userId: string, snapshotId: string) {
    const snapshot = await this.findSnapshot(snapshotId);
    await this.boardService.findOne(userId, snapshot.boardId);
    await this.prisma.boardSnapshot.delete({ where: { id: snapshotId } });
  }

  async restore(userId: string, snapshotId: string) {
    const snapshot = await this.findSnapshot(snapshotId);
    const board = await this.boardService.findOne(userId, snapshot.boardId);
    const data = snapshot.data as unknown as SnapshotData;

    const assigneeIds = [
      ...new Set(
        data.columns.flatMap(col => col.cards.map(c => c.assigneeId).filter((id): id is string => !!id)),
      ),
    ];
    const existingUsers = new Set(
      (
        await this.prisma.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true },
        })
      ).map(u => u.id),
    );
    const existingLabels = new Set(
      (
        await this.prisma.label.findMany({
          where: { boardId: board.id },
          select: { id: true },
        })
      ).map(l => l.id),
    );

    const snapshotColumnIds = data.columns.map(c => c.id);

    await this.prisma.$transaction(async tx => {
      // 스냅샷 이후 새로 생긴 컬럼 제거 (카드/댓글/첨부파일 등도 함께 삭제됨 — 복원의 의도된 동작)
      await tx.column.deleteMany({
        where: { boardId: board.id, id: { notIn: snapshotColumnIds } },
      });

      for (const col of data.columns) {
        await tx.column.upsert({
          where: { id: col.id },
          update: { title: col.title, position: col.position },
          create: { id: col.id, title: col.title, position: col.position, boardId: board.id },
        });

        const snapshotCardIds = col.cards.map(c => c.id);
        await tx.card.deleteMany({
          where: { columnId: col.id, id: { notIn: snapshotCardIds } },
        });

        for (const card of col.cards) {
          const assigneeId =
            card.assigneeId && existingUsers.has(card.assigneeId) ? card.assigneeId : null;
          const labelIds = card.labelIds.filter(id => existingLabels.has(id));
          const dueDate = card.dueDate ? new Date(card.dueDate) : null;

          await tx.card.upsert({
            where: { id: card.id },
            update: {
              title: card.title,
              description: card.description,
              position: card.position,
              dueDate,
              assigneeId,
              columnId: col.id,
              labels: { set: labelIds.map(id => ({ id })) },
            },
            create: {
              id: card.id,
              title: card.title,
              description: card.description,
              position: card.position,
              dueDate,
              assigneeId,
              columnId: col.id,
              labels: { connect: labelIds.map(id => ({ id })) },
            },
          });
        }
      }
    });

    this.gateway.broadcastToBoard(board.id, {
      type: 'board:restored',
      payload: { boardId: board.id },
      userId,
    });

    return { restored: true };
  }

  private async findSnapshot(snapshotId: string) {
    const snapshot = await this.prisma.boardSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot) throw new NotFoundException('스냅샷을 찾을 수 없습니다.');
    return snapshot;
  }
}
