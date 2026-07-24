import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { SnapshotService } from './snapshot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class SnapshotController {
  constructor(
    @Inject(SnapshotService)
    private readonly snapshotService: SnapshotService,
  ) {}

  @Get('boards/:boardId/snapshots')
  findByBoard(@CurrentUser('sub') userId: string, @Param('boardId') boardId: string) {
    return this.snapshotService.findByBoard(userId, boardId);
  }

  @Post('boards/:boardId/snapshots')
  create(
    @CurrentUser('sub') userId: string,
    @Param('boardId') boardId: string,
    @Body() dto: CreateSnapshotDto,
  ) {
    return this.snapshotService.create(userId, boardId, dto);
  }

  @Post('snapshots/:snapshotId/restore')
  @HttpCode(HttpStatus.OK)
  restore(@CurrentUser('sub') userId: string, @Param('snapshotId') snapshotId: string) {
    return this.snapshotService.restore(userId, snapshotId);
  }

  @Delete('snapshots/:snapshotId')
  remove(@CurrentUser('sub') userId: string, @Param('snapshotId') snapshotId: string) {
    return this.snapshotService.remove(userId, snapshotId);
  }
}
