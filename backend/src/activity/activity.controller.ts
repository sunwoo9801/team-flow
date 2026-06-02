import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('cards/:cardId/activities')
  async getActivities(
    @Param('cardId') cardId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityService.findByCard({
      cardId,
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
