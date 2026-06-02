import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { BoardModule } from './board/board.module';
import { KanbanModule } from './kanban/kanban.module';
import { GatewayModule } from './gateway/gateway.module';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [
    // ✅ isGlobal: true 가 반드시 있어야 하위 모듈에서 ConfigService 주입 가능
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    WorkspaceModule,
    BoardModule,
    KanbanModule,
    GatewayModule,
    ActivityModule,
  ],
})
export class AppModule {}
