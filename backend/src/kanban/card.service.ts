import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { BoardGateway } from '../gateway/board.gateway';
import { ActivityService } from '../activity/activity.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { Inject } from '@nestjs/common';

@Injectable()
export class CardService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,

    @Inject(BoardService)
    private readonly boardService: BoardService,

    @Inject(BoardGateway)
    private readonly gateway: BoardGateway,

    private readonly activityService: ActivityService, // ← 추가
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

    // ← 추가
    await this.activityService.logCardCreated(card.id, userId, card.title);

    this.gateway.broadcastToBoard(board.id, {
      type: 'card:created',
      payload: card,
      userId,
    });
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
    const existing = await this.findCard(cardId); // ← before 값 추적용
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

    // ← 추가: 변경된 필드만 activity 기록
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
    const fromColumnId = card.columnId; // ← 추가

    const moved = await this.prisma.card.update({
      where: { id: cardId },
      data: { columnId: dto.columnId, position: dto.position },
    });

    // ← 추가: 컬럼 이동 시만 기록
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

    // ← 추가
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
