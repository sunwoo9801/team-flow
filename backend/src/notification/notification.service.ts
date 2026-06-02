import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  actorId: string;
  type: NotificationType;
  message: string;
  link?: string;
  cardId?: string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        actorId: dto.actorId,
        type: dto.type,
        message: dto.message,
        link: dto.link,
        cardId: dto.cardId,
      },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAllByUser(userId: string, cursor?: string, limit = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    });

    const hasNextPage = notifications.length > limit;
    const items = hasNextPage ? notifications.slice(0, limit) : notifications;

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
      hasNextPage,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createMentionNotifications(
    mentionedUserIds: string[],
    actorId: string,
    cardId: string,
    boardId: string,
    workspaceId: string,
    actorName: string,
  ) {
    const link = `/workspace/${workspaceId}/board/${boardId}?card=${cardId}`;

    const results = await Promise.allSettled(
      mentionedUserIds
        .filter((uid) => uid !== actorId) // 자기 자신 멘션 제외
        .map((userId) =>
          this.create({
            userId,
            actorId,
            type: NotificationType.MENTION,
            message: `${actorName}님이 카드에서 회원님을 멘션했습니다.`,
            link,
            cardId,
          }),
        ),
    );

    return results
      .filter((r) => r.status === 'fulfilled')
      .map(
        (r) =>
          (r as PromiseFulfilledResult<Awaited<ReturnType<typeof this.create>>>)
            .value,
      );
  }
}
