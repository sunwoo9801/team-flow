import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(
    @Inject(CommentService)
    private readonly commentService: CommentService,
  ) {}

  @Get('cards/:cardId/comments')
  findByCard(
    @Param('cardId') cardId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commentService.findByCard(
      cardId,
      cursor,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('cards/:cardId/comments')
  create(
    @CurrentUser('sub') userId: string,
    @Param('cardId') cardId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.create(userId, cardId, dto);
  }

  @Delete('comments/:commentId')
  remove(
    @CurrentUser('sub') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.remove(userId, commentId);
  }
}
