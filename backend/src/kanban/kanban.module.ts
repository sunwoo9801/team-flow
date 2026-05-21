import { Module } from '@nestjs/common';
import { ColumnController } from './column.controller';
import { ColumnService } from './column.service';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { BoardModule } from '../board/board.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [BoardModule, WorkspaceModule],
  controllers: [ColumnController, CardController],
  providers: [ColumnService, CardService],
  exports: [ColumnService, CardService],
})
export class KanbanModule {}
