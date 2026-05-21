import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { BoardModule } from './board/board.module';
import { KanbanModule } from './kanban/kanban.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    WorkspaceModule,
    BoardModule,
    KanbanModule,
  ],
})
export class AppModule {}
