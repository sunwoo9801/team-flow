import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CARD_INCLUDE } from '../prisma/card-include.constant';
import { BoardService } from '../board/board.service';
import { BoardGateway } from '../gateway/board.gateway';
import { ActivityService } from '../activity/activity.service';
import { CardActionType } from '@prisma/client';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { MoveChecklistItemDto } from './dto/move-checklist-item.dto';

@Injectable()
export class ChecklistService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,

    @Inject(BoardService)
    private readonly boardService: BoardService,

    @Inject(BoardGateway)
    private readonly gateway: BoardGateway,

    @Inject(ActivityService)
    private readonly activityService: ActivityService,
  ) {}

  async create(userId: string, cardId: string, dto: CreateChecklistItemDto) {
    const { boardId } = await this.findCardWithBoard(cardId);
    const board = await this.boardService.findOne(userId, boardId);
    const last = await this.prisma.checklistItem.findFirst({
      where: { cardId },
      orderBy: { position: 'desc' },
    });
    const position = last ? last.position + 1.0 : 1.0;

    await this.prisma.checklistItem.create({
      data: { cardId, text: dto.text, position },
    });

    await this.activityService.create({
      cardId,
      userId,
      actionType: CardActionType.CHECKLIST_ITEM_ADDED,
      metadata: { extra: { text: dto.text } },
    });

    return this.broadcastCard(board.id, cardId, userId);
  }

  async update(userId: string, itemId: string, dto: UpdateChecklistItemDto) {
    const item = await this.findItem(itemId);
    const { boardId } = await this.findCardWithBoard(item.cardId);
    const board = await this.boardService.findOne(userId, boardId);

    const updated = await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        ...(dto.text !== undefined && { text: dto.text }),
        ...(dto.done !== undefined && { done: dto.done }),
      },
    });

    if (dto.done !== undefined && dto.done !== item.done) {
      await this.activityService.create({
        cardId: item.cardId,
        userId,
        actionType: CardActionType.CHECKLIST_ITEM_TOGGLED,
        metadata: { extra: { text: updated.text, done: updated.done } },
      });
    }

    return this.broadcastCard(board.id, item.cardId, userId);
  }

  async move(userId: string, itemId: string, dto: MoveChecklistItemDto) {
    const item = await this.findItem(itemId);
    const { boardId } = await this.findCardWithBoard(item.cardId);
    const board = await this.boardService.findOne(userId, boardId);

    await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: { position: dto.position },
    });

    return this.broadcastCard(board.id, item.cardId, userId);
  }

  async remove(userId: string, itemId: string) {
    const item = await this.findItem(itemId);
    const { boardId } = await this.findCardWithBoard(item.cardId);
    const board = await this.boardService.findOne(userId, boardId);

    await this.prisma.checklistItem.delete({ where: { id: itemId } });

    await this.activityService.create({
      cardId: item.cardId,
      userId,
      actionType: CardActionType.CHECKLIST_ITEM_REMOVED,
      metadata: { extra: { text: item.text } },
    });

    return this.broadcastCard(board.id, item.cardId, userId);
  }

  private async broadcastCard(boardId: string, cardId: string, userId: string) {
    const updated = await this.prisma.card.findUniqueOrThrow({
      where: { id: cardId },
      include: CARD_INCLUDE,
    });
    this.gateway.broadcastToBoard(boardId, {
      type: 'card:updated',
      payload: updated,
      userId,
    });
    return updated;
  }

  private async findItem(itemId: string) {
    const item = await this.prisma.checklistItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('체크리스트 항목을 찾을 수 없습니다.');
    return item;
  }

  private async findCardWithBoard(cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { column: true },
    });
    if (!card) throw new NotFoundException('카드를 찾을 수 없습니다.');
    return { ...card, boardId: card.column.boardId };
  }
}
