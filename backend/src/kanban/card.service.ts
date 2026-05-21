import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';

@Injectable()
export class CardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardService: BoardService,
  ) {}

  async create(userId: string, columnId: string, dto: CreateCardDto) {
    const col = await this.findColumnWithBoard(columnId);
    await this.boardService.findOne(userId, col.boardId);
    const last = await this.prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
    });
    const position = last ? last.position + 1.0 : 1.0;
    return this.prisma.card.create({
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
  }

  async update(userId: string, cardId: string, dto: UpdateCardDto) {
    const card = await this.findCard(cardId);
    const col = await this.findColumnWithBoard(card.columnId);
    await this.boardService.findOne(userId, col.boardId);
    return this.prisma.card.update({
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
  }

  async move(userId: string, cardId: string, dto: MoveCardDto) {
    const card = await this.findCard(cardId);
    const col = await this.findColumnWithBoard(card.columnId);
    await this.boardService.findOne(userId, col.boardId);
    return this.prisma.card.update({
      where: { id: cardId },
      data: { columnId: dto.columnId, position: dto.position },
    });
  }

  async remove(userId: string, cardId: string) {
    const card = await this.findCard(cardId);
    const col = await this.findColumnWithBoard(card.columnId);
    await this.boardService.findOne(userId, col.boardId);
    await this.prisma.card.delete({ where: { id: cardId } });
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
