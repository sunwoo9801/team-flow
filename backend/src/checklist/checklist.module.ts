import { Module } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BoardModule } from '../board/board.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [PrismaModule, BoardModule, GatewayModule, ActivityModule],
  controllers: [ChecklistController],
  providers: [ChecklistService],
  exports: [ChecklistService],
})
export class ChecklistModule {}
