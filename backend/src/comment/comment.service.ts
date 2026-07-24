import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { BoardGateway } from '../gateway/board.gateway';
import { ActivityService } from '../activity/activity.service';
import { NotificationService } from '../notification/notification.service';
import { parseMentionedUserIds } from '../notification/mention.parser';
import { CardActionType, NotificationType } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';

const USER_SELECT = { id: true, name: true, email: true } as const;

@Injectable()
export class CommentService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,

    @Inject(BoardService)
    private readonly boardService: BoardService,

    @Inject(BoardGateway)
    private readonly gateway: BoardGateway,

    @Inject(ActivityService)
    private readonly activityService: ActivityService,

    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, cardId: string, dto: CreateCommentDto) {
    const card = await this.findCardWithBoard(cardId);
    const board = await this.boardService.findOne(userId, card.boardId);

    const comment = await this.prisma.comment.create({
      data: { cardId, userId, content: dto.content },
      include: { user: { select: USER_SELECT } },
    });

    await this.activityService.create({
      cardId,
      userId,
      actionType: CardActionType.COMMENT_ADDED,
      metadata: { extra: { content: dto.content } },
    });

    this.gateway.broadcastToBoard(board.id, {
      type: 'comment:created',
      payload: comment,
      userId,
    });

    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    const mentionedIds = parseMentionedUserIds(dto.content);

    if (mentionedIds.length > 0) {
      const notifications = await this.notificationService.createMentionNotifications(
        mentionedIds,
        userId,
        cardId,
        board.id,
        board.workspaceId,
        actor?.name ?? '누군가',
      );
      for (const n of notifications) {
        this.gateway.emitToUser(n.userId, 'notification', n);
      }
    }

    if (
      card.assigneeId &&
      card.assigneeId !== userId &&
      !mentionedIds.includes(card.assigneeId)
    ) {
      const notification = await this.notificationService.create({
        userId: card.assigneeId,
        actorId: userId,
        type: NotificationType.COMMENT_ADDED,
        message: `${actor?.name ?? '누군가'}님이 담당 카드에 댓글을 남겼습니다.`,
        link: `/workspace/${board.workspaceId}/board/${board.id}?card=${cardId}`,
        cardId,
      });
      this.gateway.emitToUser(card.assigneeId, 'notification', notification);
    }

    return comment;
  }

  async findByCard(cardId: string, cursor?: string, limit = 20) {
    const comments = await this.prisma.comment.findMany({
      where: { cardId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: USER_SELECT } },
    });

    const hasNextPage = comments.length > limit;
    const items = hasNextPage ? comments.slice(0, limit) : comments;

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
      hasNextPage,
    };
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.userId !== userId) {
      throw new ForbiddenException('본인이 작성한 댓글만 삭제할 수 있습니다.');
    }

    const card = await this.findCardWithBoard(comment.cardId);
    const board = await this.boardService.findOne(userId, card.boardId);

    await this.prisma.comment.delete({ where: { id: commentId } });

    await this.activityService.create({
      cardId: comment.cardId,
      userId,
      actionType: CardActionType.COMMENT_DELETED,
      metadata: { extra: { content: comment.content } },
    });

    this.gateway.broadcastToBoard(board.id, {
      type: 'comment:deleted',
      payload: { commentId, cardId: comment.cardId },
      userId,
    });
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
