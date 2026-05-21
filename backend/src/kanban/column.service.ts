import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';

@Injectable()
export class ColumnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardService: BoardService,
  ) {}

  async create(userId: string, boardId: string, dto: CreateColumnDto) {
    await this.boardService.findOne(userId, boardId);
    const last = await this.prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
    });
    const position = last ? last.position + 1.0 : 1.0;
    return this.prisma.column.create({
      data: { title: dto.title, position, boardId },
    });
  }

  async update(userId: string, columnId: string, dto: UpdateColumnDto) {
    const col = await this.findColumn(columnId);
    await this.boardService.findOne(userId, col.boardId);
    return this.prisma.column.update({
      where: { id: columnId },
      data: { title: dto.title },
    });
  }

  async move(userId: string, columnId: string, dto: MoveColumnDto) {
    const col = await this.findColumn(columnId);
    await this.boardService.findOne(userId, col.boardId);
    return this.prisma.column.update({
      where: { id: columnId },
      data: { position: dto.position },
    });
  }

  async remove(userId: string, columnId: string) {
    const col = await this.findColumn(columnId);
    await this.boardService.findOne(userId, col.boardId);
    await this.prisma.column.delete({ where: { id: columnId } });
  }

  private async findColumn(columnId: string) {
    const col = await this.prisma.column.findUnique({
      where: { id: columnId },
    });
    if (!col) throw new NotFoundException('컬럼을 찾을 수 없습니다.');
    return col;
  }
}
