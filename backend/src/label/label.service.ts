import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { BoardGateway } from '../gateway/board.gateway';
import { ActivityService } from '../activity/activity.service';
import { CardActionType } from '@prisma/client';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

const LABEL_SELECT = { id: true, boardId: true, name: true, color: true } as const;

@Injectable()
export class LabelService {
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

  async create(userId: string, boardId: string, dto: CreateLabelDto) {
    await this.boardService.findOne(userId, boardId);
    const label = await this.prisma.label.create({
      data: { boardId, name: dto.name, color: dto.color },
      select: LABEL_SELECT,
    });
    this.gateway.broadcastToBoard(boardId, {
      type: 'label:created',
      payload: label,
      userId,
    });
    return label;
  }

  async findByBoard(userId: string, boardId: string) {
    await this.boardService.findOne(userId, boardId);
    return this.prisma.label.findMany({
      where: { boardId },
      orderBy: { createdAt: 'asc' },
      select: LABEL_SELECT,
    });
  }

  async update(userId: string, labelId: string, dto: UpdateLabelDto) {
    const label = await this.findLabel(labelId);
    await this.boardService.findOne(userId, label.boardId);

    const updated = await this.prisma.label.update({
      where: { id: labelId },
      data: { ...(dto.name !== undefined && { name: dto.name }), ...(dto.color !== undefined && { color: dto.color }) },
      select: LABEL_SELECT,
    });
    this.gateway.broadcastToBoard(label.boardId, {
      type: 'label:updated',
      payload: updated,
      userId,
    });
    return updated;
  }

  async remove(userId: string, labelId: string) {
    const label = await this.findLabel(labelId);
    await this.boardService.findOne(userId, label.boardId);

    await this.prisma.label.delete({ where: { id: labelId } });
    this.gateway.broadcastToBoard(label.boardId, {
      type: 'label:deleted',
      payload: { labelId, boardId: label.boardId },
      userId,
    });
  }

  async attachToCard(userId: string, cardId: string, labelId: string) {
    const card = await this.findCardWithBoard(cardId);
    const board = await this.boardService.findOne(userId, card.boardId);
    const label = await this.findLabel(labelId);
    if (label.boardId !== board.id) {
      throw new NotFoundException('해당 보드의 라벨이 아닙니다.');
    }

    const updated = await this.prisma.card.update({
      where: { id: cardId },
      data: { labels: { connect: { id: labelId } } },
      include: { labels: { select: LABEL_SELECT } },
    });

    await this.activityService.create({
      cardId,
      userId,
      actionType: CardActionType.LABEL_ADDED,
      metadata: { extra: { labelId, name: label.name } },
    });

    this.gateway.broadcastToBoard(board.id, {
      type: 'card:updated',
      payload: updated,
      userId,
    });

    return updated;
  }

  async detachFromCard(userId: string, cardId: string, labelId: string) {
    const card = await this.findCardWithBoard(cardId);
    const board = await this.boardService.findOne(userId, card.boardId);
    const label = await this.findLabel(labelId);

    const updated = await this.prisma.card.update({
      where: { id: cardId },
      data: { labels: { disconnect: { id: labelId } } },
      include: { labels: { select: LABEL_SELECT } },
    });

    await this.activityService.create({
      cardId,
      userId,
      actionType: CardActionType.LABEL_REMOVED,
      metadata: { extra: { labelId, name: label.name } },
    });

    this.gateway.broadcastToBoard(board.id, {
      type: 'card:updated',
      payload: updated,
      userId,
    });

    return updated;
  }

  private async findLabel(labelId: string) {
    const label = await this.prisma.label.findUnique({ where: { id: labelId } });
    if (!label) throw new NotFoundException('라벨을 찾을 수 없습니다.');
    return label;
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
