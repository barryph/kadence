import {
  Controller,
  Post,
  Put,
  Body,
  Req,
  Query,
  UseGuards,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsAuthedGuard } from '../authentication/is-authed.guard';
import { ActivitiesService } from './services/activities.service';
import CreateActivityDTO from './dtos/createActivity.dto';
import EditActivityDTO from './dtos/editActivity.dto';
import ActivityDateActionDTO from './dtos/activityDateAction.dto';
import { UserDTO } from '../users/mappers/userMap';
import { ApiBody } from '@nestjs/swagger';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

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

  @Get('/:activityId')
  @UseGuards(IsAuthedGuard)
  async getById(@Req() req: Request, @Param('activityId') activityId: string) {
    const userId = (req.user as UserDTO).id;
    const activity = await this.activitiesService.getById(activityId, userId);
    return {
      data: {
        activity,
      },
    };
  }

  @Put('/edit/:activityId')
  @UseGuards(IsAuthedGuard)
  async edit(
    @Req() req: Request,
    @Param('activityId') activityId: string,
    @Body() editActivityDto: EditActivityDTO,
  ) {
    const userId = (req.user as UserDTO).id;
    const activity = await this.activitiesService.editActivity(
      activityId,
      editActivityDto,
      userId,
    );

    return {
      data: {
        activity,
      },
    };
  }

  @Post('/:activityId/complete')
  @UseGuards(IsAuthedGuard)
  async complete(
    @Req() req: Request,
    @Param('activityId') activityId: string,
    @Body() body: ActivityDateActionDTO,
  ) {
    const userId = (req.user as UserDTO).id;
    const updatedActivity = await this.activitiesService.completeActivity(
      activityId,
      userId,
      body.date,
    );

    return {
      data: {
        activity: updatedActivity,
      },
    };
  }

  @Post('/:activityId/undo')
  @UseGuards(IsAuthedGuard)
  async undo(
    @Req() req: Request,
    @Param('activityId') activityId: string,
    @Body() body: ActivityDateActionDTO,
  ) {
    const userId = (req.user as UserDTO).id;
    await this.activitiesService.undoActivityEvent(
      activityId,
      userId,
      body.date,
    );

    return {
      success: true,
    };
  }

  @Delete('/:activityId')
  @UseGuards(IsAuthedGuard)
  async delete(@Req() req: Request, @Param('activityId') activityId: string) {
    const userId = (req.user as UserDTO).id;
    await this.activitiesService.deleteActivity(activityId, userId);

    return {
      success: true,
    };
  }
}
