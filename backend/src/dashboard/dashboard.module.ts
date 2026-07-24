import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BoardModule } from '../board/board.module';

@Module({
  imports: [PrismaModule, BoardModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
