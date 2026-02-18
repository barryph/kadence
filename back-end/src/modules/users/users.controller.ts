import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { IsAuthedGuard } from '../authentication/is-authed.guard';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('/')
  findOne(@Query('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(IsAuthedGuard)
  @Get('/protec')
  protec() {
    return { myData: 'this is a secret' };
  }

  @Get('/current')
  getCurrent(@Req() req: Request) {
    return { data: { user: req.user } };
  }
}
