import {
  Controller,
  Post,
  Body,
  Req,
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
import GetActivityTimelineDTO from './dtos/getTimelineDto.dto';

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

  @Get('/')
  @UseGuards(IsAuthedGuard)
  @ApiBody({
    type: GetActivityTimelineDTO,
    examples: {
      userExample1: {
        summary: 'Fetch part of the activity timeline',
        value: {
          month: '2026-04',
        } as GetActivityTimelineDTO,
      },
    },
  })
  async getActivityTimeline(@Body() getTimelineDTO: GetActivityTimelineDTO) {
    const month = getTimelineDTO.month;
    const timeline = await this.activitiesService.getActivityTimeline(month);
    return {
      data: {
        timeline,
      },
    };
  }
}
