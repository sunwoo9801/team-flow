import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardActionType, Prisma } from '@prisma/client';

export interface CreateActivityDto {
  cardId: string;
  userId: string;
  actionType: CardActionType;
  metadata?: Record<string, unknown>;
}

export interface ActivityCursorDto {
  cardId: string;
  cursor?: string;
  limit?: number;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateActivityDto) {
    return this.prisma.cardActivity.create({
      data: {
        cardId: dto.cardId,
        userId: dto.userId,
        actionType: dto.actionType,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findByCard(dto: ActivityCursorDto) {
    const limit = dto.limit ?? 20;

    const activities = await this.prisma.cardActivity.findMany({
      where: { cardId: dto.cardId },
      take: limit + 1,
      ...(dto.cursor
        ? {
            cursor: { id: dto.cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const hasNextPage = activities.length > limit;
    const items = hasNextPage ? activities.slice(0, limit) : activities;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }

  async logCardCreated(cardId: string, userId: string, title: string) {
    return this.create({
      cardId,
      userId,
      actionType: CardActionType.CARD_CREATED,
      metadata: { after: { title } },
    });
  }

  async logCardUpdated(
    cardId: string,
    userId: string,
    field: string,
    before: unknown,
    after: unknown,
  ) {
    const actionMap: Record<string, CardActionType> = {
      title: CardActionType.CARD_TITLE_UPDATED,
      description: CardActionType.CARD_DESCRIPTION_UPDATED,
      priority: CardActionType.CARD_PRIORITY_CHANGED,
      dueDate: CardActionType.CARD_DUE_DATE_CHANGED,
    };

    const actionType = actionMap[field];
    if (!actionType) return null;

    return this.create({
      cardId,
      userId,
      actionType,
      metadata: { field, before, after },
    });
  }

  async logCardMoved(
    cardId: string,
    userId: string,
    fromColumnId: string,
    toColumnId: string,
  ) {
    return this.create({
      cardId,
      userId,
      actionType: CardActionType.CARD_MOVED,
      metadata: {
        before: { columnId: fromColumnId },
        after: { columnId: toColumnId },
      },
    });
  }
}
