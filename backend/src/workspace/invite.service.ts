import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class InviteService {
  constructor(private readonly prisma: PrismaService) {}

  async createInviteLink(workspaceId: string): Promise<string> {
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일

    await this.prisma.inviteToken.create({
      data: { token, workspaceId, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${frontendUrl}/invite/${token}`;
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
    });

    if (!invite) throw new NotFoundException('유효하지 않은 초대 링크입니다.');
    if (invite.usedAt)
      throw new BadRequestException('이미 사용된 초대 링크입니다.');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('만료된 초대 링크입니다.');

    const alreadyMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invite.workspaceId, userId },
      },
    });
    if (alreadyMember)
      throw new ConflictException('이미 워크스페이스의 멤버입니다.');

    const [, member] = await this.prisma.$transaction([
      this.prisma.inviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: MemberRole.member,
        },
      }),
    ]);

    return member;
  }

  async getInviteInfo(token: string) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
      include: { workspace: { select: { id: true, name: true } } },
    });
    if (!invite) throw new NotFoundException('유효하지 않은 초대 링크입니다.');
    if (invite.usedAt)
      throw new BadRequestException('이미 사용된 초대 링크입니다.');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('만료된 초대 링크입니다.');
    return invite;
  }
}
