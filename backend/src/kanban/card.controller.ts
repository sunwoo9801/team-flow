import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CardService } from './card.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('columns/:columnId/cards')
  create(
    @CurrentUser('sub') userId: string,
    @Param('columnId') columnId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardService.create(userId, columnId, dto);
  }

  @Patch('cards/:cardId')
  update(
    @CurrentUser('sub') userId: string,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardService.update(userId, cardId, dto);
  }

  @Patch('cards/:cardId/move')
  move(
    @CurrentUser('sub') userId: string,
    @Param('cardId') cardId: string,
    @Body() dto: MoveCardDto,
  ) {
    return this.cardService.move(userId, cardId, dto);
  }

  @Delete('cards/:cardId')
  remove(@CurrentUser('sub') userId: string, @Param('cardId') cardId: string) {
    return this.cardService.remove(userId, cardId);
  }
}
