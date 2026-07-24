import { Controller, Get, Param, UseGuards, Inject } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    @Inject(DashboardService)
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('boards/:boardId/dashboard')
  getBoardDashboard(@CurrentUser('sub') userId: string, @Param('boardId') boardId: string) {
    return this.dashboardService.getBoardDashboard(userId, boardId);
  }
}
