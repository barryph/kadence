import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { IsAuthedGuard } from '../authentication/is-authed.guard';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor() { }

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
