import {
  Controller,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsAuthedGuard } from '../authentication/is-authed.guard';
import { ActivitiesService } from './services/activities.service';
import CreateActivityDTO from './dtos/createActivity.dto';
import { UserDTO } from '../users/mappers/userMap';
import { ApiBody } from '@nestjs/swagger';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) { }

  @Post('/')
  @UseGuards(IsAuthedGuard)
  @ApiBody({
    type: CreateActivityDTO,
    examples: {
      userExample1: {
        summary: 'Create a new activity',
        value: {
          name: 'Back Squat',
          ticker: 'SQUT',
          interval: 3,
        } as CreateActivityDTO,
      },
    },
  })
  async create(
    @Req() req: Request,
    @Body() createActivityDto: CreateActivityDTO,
  ) {
    const userId = (req.user as UserDTO).id;
    const activity = await this.activitiesService.create(
      createActivityDto,
      userId,
    );

    return {
      data: {
        activity,
      },
    };
  }

  @Get('/')
  @UseGuards(IsAuthedGuard)
  async getAllByUserId(@Req() req: Request) {
    const userId = (req.user as UserDTO).id;
    const activities = await this.activitiesService.getAllByUserId(userId);
    return {
      data: {
        activities,
      },
    };
  }

  @Post('/:activityId/complete')
  @UseGuards(IsAuthedGuard)
  async complete(@Req() req: Request, @Param('activityId') activityId: string) {
    const userId = (req.user as UserDTO).id;
    const activity = await this.activitiesService.completeActivity(
      activityId,
      userId,
    );

    return {
      data: {
        activity,
      },
    };
  }

  @Get('/timeline')
  @UseGuards(IsAuthedGuard)
  async getActivityTimeline(
    @Req() req: Request,
    @Query('month') month: string,
  ) {
    const userId = (req.user as UserDTO).id;
    const timeline = await this.activitiesService.getActivityTimeline(
      userId,
      month,
    );
    return {
      data: {
        timeline,
      },
    };
  }
}
