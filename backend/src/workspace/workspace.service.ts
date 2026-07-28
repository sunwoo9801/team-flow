import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '@prisma/client';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {
    console.log('WorkspaceService prisma:', !!this.prisma);
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        ownerId: userId,
        members: {
          create: { userId, role: MemberRole.admin },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { members: true, boards: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(workspaceId: string, userId: string) {
    const ws = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        boards: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ws) throw new NotFoundException('워크스페이스를 찾을 수 없습니다.');
    const isMember = ws.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('접근 권한이 없습니다.');
    return ws;
  }

  async remove(workspaceId: string, userId: string) {
    const ws = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!ws) throw new NotFoundException();
    if (ws.ownerId !== userId)
      throw new ForbiddenException('소유자만 삭제할 수 있습니다.');
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async assertMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('워크스페이스 멤버가 아닙니다.');
    return member;
  }

  async assertAdmin(workspaceId: string, userId: string) {
    const member = await this.assertMember(workspaceId, userId);
    if (member.role !== MemberRole.admin)
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    return member;
  }

  async rename(workspaceId: string, userId: string, name: string) {
    await this.assertAdmin(workspaceId, userId);
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });
  }

  async removeMember(workspaceId: string, actorId: string, targetUserId: string) {
    const ws = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) throw new NotFoundException();
    if (targetUserId === ws.ownerId) {
      throw new ForbiddenException(
        '소유자는 소유권을 이전한 후에만 워크스페이스를 탈퇴하거나 제거될 수 있습니다.',
      );
    }
    if (actorId === targetUserId) {
      await this.assertMember(workspaceId, actorId);
    } else {
      await this.assertAdmin(workspaceId, actorId);
    }
    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
  }

  async changeRole(
    workspaceId: string,
    actorId: string,
    targetUserId: string,
    role: MemberRole,
  ) {
    await this.assertAdmin(workspaceId, actorId);
    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { role },
    });
  }

  async transferOwnership(workspaceId: string, actorId: string, newOwnerId: string) {
    const ws = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) throw new NotFoundException();
    if (ws.ownerId !== actorId) {
      throw new ForbiddenException('소유자만 소유권을 이전할 수 있습니다.');
    }
    await this.assertMember(workspaceId, newOwnerId);

    const [workspace] = await this.prisma.$transaction([
      this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: newOwnerId },
      }),
      this.prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: newOwnerId } },
        data: { role: MemberRole.admin },
      }),
    ]);
    return workspace;
  }
}
