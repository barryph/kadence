import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { IsAuthedGuard } from '../authentication/is-authed.guard';
import { ActivityGoalsService } from './services/activityGoals.service';
import GetGoalsQueryDTO from './dtos/getGoals.dto';
import { UserDTO } from '../users/mappers/userMap';

@Controller('goals')
export class ActivityGoalsController {
  constructor(private readonly activityGoalsService: ActivityGoalsService) {}

  @Get('/')
  @UseGuards(IsAuthedGuard)
  async getAllByUserId(@Req() req: Request, @Query() query: GetGoalsQueryDTO) {
    const userId = (req.user as UserDTO).id;
    const goals = await this.activityGoalsService.getAllByUserId(
      userId,
      query.today,
    );
    return {
      data: {
        goals,
      },
    };
  }

  @Get('/:activityId')
  @UseGuards(IsAuthedGuard)
  async getStats(
    @Req() req: Request,
    @Param('activityId') activityId: string,
    @Query() query: GetGoalsQueryDTO,
  ) {
    const userId = (req.user as UserDTO).id;
    const stats = await this.activityGoalsService.getStats(
      activityId,
      userId,
      query.today,
    );
    return {
      data: stats,
    };
  }
}
