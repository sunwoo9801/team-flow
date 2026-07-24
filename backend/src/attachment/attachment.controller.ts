import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PresignAttachmentDto } from './dto/presign-attachment.dto';
import { ConfirmAttachmentDto } from './dto/confirm-attachment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class AttachmentController {
  constructor(
    @Inject(AttachmentService)
    private readonly attachmentService: AttachmentService,
  ) {}

  @Get('cards/:cardId/attachments')
  findByCard(@CurrentUser('sub') userId: string, @Param('cardId') cardId: string) {
    return this.attachmentService.findByCard(userId, cardId);
  }

  @Post('cards/:cardId/attachments/presign')
  presign(
    @CurrentUser('sub') userId: string,
    @Param('cardId') cardId: string,
    @Body() dto: PresignAttachmentDto,
  ) {
    return this.attachmentService.presign(userId, cardId, dto);
  }

  @Post('cards/:cardId/attachments')
  confirm(
    @CurrentUser('sub') userId: string,
    @Param('cardId') cardId: string,
    @Body() dto: ConfirmAttachmentDto,
  ) {
    return this.attachmentService.confirm(userId, cardId, dto);
  }

  @Get('attachments/:attachmentId/download-url')
  getDownloadUrl(
    @CurrentUser('sub') userId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.attachmentService.getDownloadUrl(userId, attachmentId);
  }

  @Delete('attachments/:attachmentId')
  remove(
    @CurrentUser('sub') userId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.attachmentService.remove(userId, attachmentId);
  }
}
