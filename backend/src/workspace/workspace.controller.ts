import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { InviteService } from './invite.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { RenameWorkspaceDto } from './dto/rename-workspace.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(
    @Inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService,

    @Inject(InviteService)
    private readonly inviteService: InviteService,
  ) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.workspaceService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.workspaceService.findOne(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.workspaceService.remove(id, userId);
  }

  @Patch(':id')
  rename(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: RenameWorkspaceDto,
  ) {
    return this.workspaceService.rename(id, userId, dto.name);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('sub') actorId: string,
  ) {
    return this.workspaceService.removeMember(id, actorId, targetUserId);
  }

  @Patch(':id/members/:userId/role')
  changeRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('sub') actorId: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.workspaceService.changeRole(id, actorId, targetUserId, dto.role);
  }

  @Post(':id/transfer-ownership')
  transferOwnership(
    @Param('id') id: string,
    @CurrentUser('sub') actorId: string,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.workspaceService.transferOwnership(id, actorId, dto.newOwnerId);
  }

  // 초대 링크 생성
  @Post(':id/invite')
  async createInvite(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.workspaceService.assertAdmin(id, userId);
    const link = await this.inviteService.createInviteLink(id);
    return { inviteLink: link };
  }

  // 초대 정보 조회 (로그인 없이 접근 가능)
  @Get('invite/:token')
  @UseGuards() // JwtAuthGuard 제거 — 퍼블릭
  getInviteInfo(@Param('token') token: string) {
    return this.inviteService.getInviteInfo(token);
  }

  // 초대 수락
  @Post('invite/:token/accept')
  acceptInvite(
    @Param('token') token: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.inviteService.acceptInvite(token, userId);
  }
}
