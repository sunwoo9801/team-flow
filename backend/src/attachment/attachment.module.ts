import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AttachmentController } from './attachment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BoardModule } from '../board/board.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [PrismaModule, BoardModule, GatewayModule, ActivityModule],
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
