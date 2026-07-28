import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { MoveChecklistItemDto } from './dto/move-checklist-item.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(
    @Inject(ChecklistService)
    private readonly checklistService: ChecklistService,
  ) {}

  @Post('cards/:cardId/checklist-items')
  create(
    @CurrentUser('sub') userId: string,
    @Param('cardId') cardId: string,
    @Body() dto: CreateChecklistItemDto,
  ) {
    return this.checklistService.create(userId, cardId, dto);
  }

  @Patch('checklist-items/:itemId')
  update(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.checklistService.update(userId, itemId, dto);
  }

  @Patch('checklist-items/:itemId/move')
  move(
    @CurrentUser('sub') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: MoveChecklistItemDto,
  ) {
    return this.checklistService.move(userId, itemId, dto);
  }

  @Delete('checklist-items/:itemId')
  remove(@CurrentUser('sub') userId: string, @Param('itemId') itemId: string) {
    return this.checklistService.remove(userId, itemId);
  }
}
