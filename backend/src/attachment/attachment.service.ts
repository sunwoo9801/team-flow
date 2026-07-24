import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { BoardGateway } from '../gateway/board.gateway';
import { ActivityService } from '../activity/activity.service';
import { CardActionType } from '@prisma/client';
import { PresignAttachmentDto } from './dto/presign-attachment.dto';
import { ConfirmAttachmentDto } from './dto/confirm-attachment.dto';

const USER_SELECT = { id: true, name: true, email: true } as const;
const PRESIGN_EXPIRES_SECONDS = 300;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

@Injectable()
export class AttachmentService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,

    @Inject(BoardService)
    private readonly boardService: BoardService,

    @Inject(BoardGateway)
    private readonly gateway: BoardGateway,

    @Inject(ActivityService)
    private readonly activityService: ActivityService,

    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow<string>('AWS_S3_BUCKET');
    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async presign(userId: string, cardId: string, dto: PresignAttachmentDto) {
    const card = await this.findCardWithBoard(cardId);
    await this.boardService.findOne(userId, card.boardId);

    const key = `cards/${cardId}/${randomUUID()}-${sanitizeFileName(dto.fileName)}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.mimeType,
      ContentLength: dto.fileSize,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });

    return { uploadUrl, key };
  }

  async confirm(userId: string, cardId: string, dto: ConfirmAttachmentDto) {
    const card = await this.findCardWithBoard(cardId);
    const board = await this.boardService.findOne(userId, card.boardId);

    const attachment = await this.prisma.attachment.create({
      data: {
        cardId,
        userId,
        fileName: dto.fileName,
        fileKey: dto.fileKey,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
      },
      include: { user: { select: USER_SELECT } },
    });

    await this.activityService.create({
      cardId,
      userId,
      actionType: CardActionType.ATTACHMENT_ADDED,
      metadata: { extra: { fileName: dto.fileName } },
    });

    this.gateway.broadcastToBoard(board.id, {
      type: 'attachment:created',
      payload: attachment,
      userId,
    });

    return attachment;
  }

  async findByCard(userId: string, cardId: string) {
    const card = await this.findCardWithBoard(cardId);
    await this.boardService.findOne(userId, card.boardId);

    return this.prisma.attachment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: USER_SELECT } },
    });
  }

  async getDownloadUrl(userId: string, attachmentId: string) {
    const attachment = await this.findAttachment(attachmentId);
    const card = await this.findCardWithBoard(attachment.cardId);
    await this.boardService.findOne(userId, card.boardId);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: attachment.fileKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
    });
    const url = await getSignedUrl(this.s3, command, {
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });

    return { url, fileName: attachment.fileName };
  }

  async remove(userId: string, attachmentId: string) {
    const attachment = await this.findAttachment(attachmentId);
    if (attachment.userId !== userId) {
      throw new ForbiddenException('본인이 업로드한 첨부파일만 삭제할 수 있습니다.');
    }

    const card = await this.findCardWithBoard(attachment.cardId);
    const board = await this.boardService.findOne(userId, card.boardId);

    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: attachment.fileKey }),
    );
    await this.prisma.attachment.delete({ where: { id: attachmentId } });

    await this.activityService.create({
      cardId: attachment.cardId,
      userId,
      actionType: CardActionType.ATTACHMENT_DELETED,
      metadata: { extra: { fileName: attachment.fileName } },
    });

    this.gateway.broadcastToBoard(board.id, {
      type: 'attachment:deleted',
      payload: { attachmentId, cardId: attachment.cardId },
      userId,
    });
  }

  private async findAttachment(attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    return attachment;
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
