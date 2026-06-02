import { Module } from '@nestjs/common';
import { ColumnController } from './column.controller';
import { ColumnService } from './column.service';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { BoardModule } from '../board/board.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [BoardModule, WorkspaceModule, GatewayModule, ActivityModule, NotificationModule],
  controllers: [ColumnController, CardController],
  providers: [ColumnService, CardService],
  exports: [ColumnService, CardService],
})
export class KanbanModule {}
