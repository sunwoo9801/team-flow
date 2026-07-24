import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { LabelService } from './label.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class LabelController {
  constructor(
    @Inject(LabelService)
    private readonly labelService: LabelService,
  ) {}

  @Get('boards/:boardId/labels')
  findByBoard(@CurrentUser('sub') userId: string, @Param('boardId') boardId: string) {
    return this.labelService.findByBoard(userId, boardId);
  }

  @Post('boards/:boardId/labels')
  create(
    @CurrentUser('sub') userId: string,
    @Param('boardId') boardId: string,
    @Body() dto: CreateLabelDto,
  ) {
    return this.labelService.create(userId, boardId, dto);
  }

  @Patch('labels/:labelId')
  update(
    @CurrentUser('sub') userId: string,
    @Param('labelId') labelId: string,
    @Body() dto: UpdateLabelDto,
  ) {
    return this.labelService.update(userId, labelId, dto);
  }

  @Delete('labels/:labelId')
  remove(@CurrentUser('sub') userId: string, @Param('labelId') labelId: string) {
    return this.labelService.remove(userId, labelId);
  }

  @Post('cards/:cardId/labels/:labelId')
  attach(
    @CurrentUser('sub') userId: string,
    @Param('cardId') cardId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.labelService.attachToCard(userId, cardId, labelId);
  }

  @Delete('cards/:cardId/labels/:labelId')
  detach(
    @CurrentUser('sub') userId: string,
    @Param('cardId') cardId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.labelService.detachFromCard(userId, cardId, labelId);
  }
}
