import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { BoardGateway } from '../gateway/board.gateway';
import { ActivityService } from '../activity/activity.service';
import { NotificationService } from '../notification/notification.service';
import { parseMentionedUserIds } from '../notification/mention.parser';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';

@Injectable()
export class CardService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,

    @Inject(BoardService)
    private readonly boardService: BoardService,

    @Inject(BoardGateway)
    private readonly gateway: BoardGateway,

    private readonly activityService: ActivityService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, columnId: string, dto: CreateCardDto) {
    const col = await this.findColumnWithBoard(columnId);
    const board = await this.boardService.findOne(userId, col.boardId);
    const last = await this.prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
    });
    const position = last ? last.position + 1.0 : 1.0;
    const card = await this.prisma.card.create({
      data: {
        title: dto.title,
        description: dto.description,
        position,
        columnId,
        assigneeId: dto.assigneeId ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    await this.activityService.logCardCreated(card.id, userId, card.title);

    this.gateway.broadcastToBoard(board.id, {
      type: 'card:created',
      payload: card,
      userId,
    });

    if (dto.assigneeId && dto.assigneeId !== userId) {
      const actor = await this.prisma.user.findUnique({ where: { id: userId } });
      const notification = await this.notificationService.create({
        userId: dto.assigneeId,
        actorId: userId,
        type: 'CARD_ASSIGNED',
        message: `${actor?.name ?? '누군가'}님이 회원님을 카드 담당자로 지정했습니다.`,
        link: `/workspace/${board.workspaceId}/board/${board.id}?card=${card.id}`,
        cardId: card.id,
      });
      this.gateway.emitToUser(dto.assigneeId, 'notification', notification);
    }

    return card;
  }

  async findAll(columnId: string) {
    return this.prisma.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findOne(cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
    if (!card) throw new NotFoundException('카드를 찾을 수 없습니다.');
    return card;
  }

  async update(userId: string, cardId: string, dto: UpdateCardDto) {
    const existing = await this.findCard(cardId);
    const col = await this.findColumnWithBoard(existing.columnId);
    const board = await this.boardService.findOne(userId, col.boardId);

    const updated = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    const trackableFields = [
      'title',
      'description',
      'assigneeId',
      'dueDate',
    ] as const;
    for (const field of trackableFields) {
      if (
        dto[field] !== undefined &&
        dto[field] !== (existing as Record<string, unknown>)[field]
      ) {
        await this.activityService.logCardUpdated(
          cardId,
          userId,
          field,
          (existing as Record<string, unknown>)[field],
          dto[field],
        );
      }
    }

    if (
      dto.assigneeId &&
      dto.assigneeId !== existing.assigneeId &&
      dto.assigneeId !== userId
    ) {
      const actor = await this.prisma.user.findUnique({ where: { id: userId } });
      const notification = await this.notificationService.create({
        userId: dto.assigneeId,
        actorId: userId,
        type: 'CARD_ASSIGNED',
        message: `${actor?.name ?? '누군가'}님이 회원님을 카드 담당자로 지정했습니다.`,
        link: `/workspace/${board.workspaceId}/board/${board.id}?card=${cardId}`,
        cardId,
      });
      this.gateway.emitToUser(dto.assigneeId, 'notification', notification);
    }

    if (dto.description) {
      const mentionedIds = parseMentionedUserIds(dto.description);
      if (mentionedIds.length > 0) {
        const actor = await this.prisma.user.findUnique({ where: { id: userId } });
        const notifications = await this.notificationService.createMentionNotifications(
          mentionedIds,
          userId,
          cardId,
          board.id,
          board.workspaceId,
          actor?.name ?? '누군가',
        );
        for (const n of notifications) {
          this.gateway.emitToUser(n.userId, 'notification', n);
        }
      }
    }

    this.gateway.broadcastToBoard(board.id, {
      type: 'card:updated',
      payload: updated,
      userId,
    });
    return updated;
  }

  async move(userId: string, cardId: string, dto: MoveCardDto) {
    const card = await this.findCard(cardId);
    const col = await this.findColumnWithBoard(card.columnId);
    const board = await this.boardService.findOne(userId, col.boardId);
    const fromColumnId = card.columnId;

    const moved = await this.prisma.card.update({
      where: { id: cardId },
      data: { columnId: dto.columnId, position: dto.position },
    });

    if (fromColumnId !== dto.columnId) {
      await this.activityService.logCardMoved(
        cardId,
        userId,
        fromColumnId,
        dto.columnId,
      );
    }

    this.gateway.broadcastToBoard(board.id, {
      type: 'card:moved',
      payload: moved,
      userId,
    });
    return moved;
  }

  async remove(userId: string, cardId: string) {
    const card = await this.findCard(cardId);
    const col = await this.findColumnWithBoard(card.columnId);
    const board = await this.boardService.findOne(userId, col.boardId);

    await this.activityService.create({
      cardId,
      userId,
      actionType: 'CARD_DELETED' as never,
      metadata: { extra: { title: card.title } },
    });

    await this.prisma.card.delete({ where: { id: cardId } });
    this.gateway.broadcastToBoard(board.id, {
      type: 'card:deleted',
      payload: { cardId, columnId: card.columnId },
      userId,
    });
  }

  private async findCard(cardId: string) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('카드를 찾을 수 없습니다.');
    return card;
  }

  private async findColumnWithBoard(columnId: string) {
    const col = await this.prisma.column.findUnique({
      where: { id: columnId },
    });
    if (!col) throw new NotFoundException('컬럼을 찾을 수 없습니다.');
    return col;
  }
}
