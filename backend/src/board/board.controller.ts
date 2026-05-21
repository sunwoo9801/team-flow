import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post('workspaces/:workspaceId/boards')
  create(
    @CurrentUser('sub') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateBoardDto,
  ) {
    return this.boardService.create(userId, workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/boards')
  findAll(
    @CurrentUser('sub') userId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.boardService.findAll(userId, workspaceId);
  }

  @Get('boards/:boardId')
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.boardService.findOne(userId, boardId);
  }

  @Patch('boards/:boardId')
  update(
    @CurrentUser('sub') userId: string,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardService.update(userId, boardId, dto);
  }

  @Delete('boards/:boardId')
  remove(
    @CurrentUser('sub') userId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.boardService.remove(userId, boardId);
  }
}
