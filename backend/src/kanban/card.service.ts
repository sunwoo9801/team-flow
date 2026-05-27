import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { BoardGateway } from '../gateway/board.gateway';
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
  ) {
    console.log('CardService prisma:', !!this.prisma);
    console.log('CardService boardService:', !!this.boardService);
    console.log('CardService gateway:', !!this.gateway);
  }

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
    this.gateway.broadcastToBoard(board.id, {
      type: 'card:created',
      payload: card,
      userId,
    });
    return card;
  }

  async update(userId: string, cardId: string, dto: UpdateCardDto) {
    const card = await this.findCard(cardId);
    const col = await this.findColumnWithBoard(card.columnId);
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
    const moved = await this.prisma.card.update({
      where: { id: cardId },
      data: { columnId: dto.columnId, position: dto.position },
    });
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
