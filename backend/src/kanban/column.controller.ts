import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ColumnService } from './column.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';
import { Inject } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller()
export class ColumnController {
  constructor(
    @Inject(ColumnService)
    private readonly columnService: ColumnService,
  ) {
    console.log('columnService:', !!this.columnService);
  }

  @Post('boards/:boardId/columns')
  create(
    @CurrentUser('sub') userId: string,
    @Param('boardId') boardId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.columnService.create(userId, boardId, dto);
  }

  @Patch('columns/:columnId')
  update(
    @CurrentUser('sub') userId: string,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.columnService.update(userId, columnId, dto);
  }

  @Patch('columns/:columnId/move')
  move(
    @CurrentUser('sub') userId: string,
    @Param('columnId') columnId: string,
    @Body() dto: MoveColumnDto,
  ) {
    return this.columnService.move(userId, columnId, dto);
  }

  @Delete('columns/:columnId')
  remove(
    @CurrentUser('sub') userId: string,
    @Param('columnId') columnId: string,
  ) {
    return this.columnService.remove(userId, columnId);
  }
}
