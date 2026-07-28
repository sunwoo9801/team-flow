import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { CardActionType } from '@prisma/client';

const BURNDOWN_DAYS = 14;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,

    @Inject(BoardService)
    private readonly boardService: BoardService,
  ) {}

  async getBoardDashboard(userId: string, boardId: string) {
    const board = await this.boardService.findOne(userId, boardId);
    const allCards = board.columns.flatMap(col => col.cards.map(card => ({ ...card, col })));

    // ── 컬럼별 카드 분포 ──
    const columnDistribution = board.columns.map(col => ({
      columnId: col.id,
      title: col.title,
      count: col.cards.length,
    }));

    // ── 담당자별 카드 분포 (다중 담당자 — 카드 1개가 담당자 여러 명의 카운트에 각각 반영) ──
    const assigneeMap = new Map<string, { name: string; count: number }>();
    let unassignedCount = 0;
    for (const card of allCards) {
      if (card.assignees.length > 0) {
        for (const { user } of card.assignees) {
          const entry = assigneeMap.get(user.id);
          if (entry) entry.count += 1;
          else assigneeMap.set(user.id, { name: user.name, count: 1 });
        }
      } else {
        unassignedCount += 1;
      }
    }
    const assigneeDistribution = [
      ...Array.from(assigneeMap.values()),
      ...(unassignedCount > 0 ? [{ name: '미배정', count: unassignedCount }] : []),
    ];

    // ── 번다운 (마지막 컬럼 = 완료 기준) ──
    const doneColumn = board.columns[board.columns.length - 1] ?? null;
    const doneCardIds = doneColumn ? doneColumn.cards.map(c => c.id) : [];

    const completedAtMap = new Map<string, Date>();
    if (doneColumn && doneCardIds.length > 0) {
      const moveActivities = await this.prisma.cardActivity.findMany({
        where: {
          actionType: CardActionType.CARD_MOVED,
          cardId: { in: doneCardIds },
          metadata: {
            path: ['after', 'columnId'],
            equals: doneColumn.id,
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { cardId: true, createdAt: true },
      });
      for (const activity of moveActivities) {
        if (!completedAtMap.has(activity.cardId)) {
          completedAtMap.set(activity.cardId, activity.createdAt);
        }
      }
      // 완료 컬럼에서 생성되어 이동 기록이 없는 카드는 생성일을 완료일로 간주
      for (const card of doneColumn.cards) {
        if (!completedAtMap.has(card.id)) {
          completedAtMap.set(card.id, card.createdAt);
        }
      }
    }

    const today = startOfDay(new Date());
    const days: { date: string; opened: number; completed: number; remaining: number }[] = [];
    for (let i = BURNDOWN_DAYS - 1; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);

      let opened = 0;
      let completed = 0;
      for (const card of allCards) {
        if (card.createdAt <= endOfDay) opened += 1;
        const completedAt = completedAtMap.get(card.id);
        if (completedAt && completedAt <= endOfDay) completed += 1;
      }

      days.push({
        date: day.toISOString().slice(0, 10),
        opened,
        completed,
        remaining: opened - completed,
      });
    }

    return {
      totalCards: allCards.length,
      columnDistribution,
      assigneeDistribution,
      burndown: {
        doneColumnTitle: doneColumn?.title ?? null,
        days,
      },
    };
  }
}
