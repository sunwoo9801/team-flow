import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async create(userId: string, workspaceId: string, dto: CreateBoardDto) {
    await this.workspaceService.assertMember(workspaceId, userId);
    return this.prisma.board.create({
      data: { title: dto.title, workspaceId },
    });
  }

  async findAll(userId: string, workspaceId: string) {
    await this.workspaceService.assertMember(workspaceId, userId);
    return this.prisma.board.findMany({
      where: { workspaceId },
      include: { _count: { select: { columns: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });
    if (!board) throw new NotFoundException('보드를 찾을 수 없습니다.');
    await this.workspaceService.assertMember(board.workspaceId, userId);
    return board;
  }

  async update(userId: string, boardId: string, dto: UpdateBoardDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });
    if (!board) throw new NotFoundException();
    await this.workspaceService.assertMember(board.workspaceId, userId);
    return this.prisma.board.update({
      where: { id: boardId },
      data: { title: dto.title },
    });
  }

  async remove(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });
    if (!board) throw new NotFoundException();
    await this.workspaceService.assertAdmin(board.workspaceId, userId);
    await this.prisma.board.delete({ where: { id: boardId } });
  }
}
