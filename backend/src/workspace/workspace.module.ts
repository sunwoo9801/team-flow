import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { InviteService } from './invite.service';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService, InviteService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
