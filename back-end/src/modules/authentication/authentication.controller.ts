import {
  Controller,
  Delete,
  Post,
  Body,
  Req,
  Res,
  Next,
  Logger,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import CreateUserDTO from '../authentication/dtos/createUser.dto';
import { AuthenticationService } from './services/authentication.service';
import type { UserDTO } from '../users/mappers/userMap';
import passport from 'passport';
import type { NextFunction, Request, Response } from 'express';
import LoginDTO from './dtos/login.dto';
import { InvalidCredentialsError } from './authentication.errors';
import ServerError from 'src/shared/ServerError';

@Controller('auth')
export class AuthenticationController {
  private readonly logger = new Logger(AuthenticationController.name);

  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('login')
  @ApiBody({
    type: LoginDTO,
    examples: {
      loginExample: {
        summary: 'Login',
        value: {
          email: 'andrew@mail.com',
          password: 'asdfasdf',
        } as LoginDTO,
      },
    },
  })
  login(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    passport.authenticate('local', (err, user: UserDTO) => {
      if (err) {
        this.logger.error('Login authentication error', err);
        next(err);
        return;
      }
      if (!user) {
        next(new InvalidCredentialsError());
        return;
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          this.logger.error(loginErr, 'Session login error');
          next(new ServerError('SESSION_LOGIN_ERROR', 'Session login error'));
          return;
        }
        return res.send({ data: { user } });
      });
    })(req, res, next);
  }

  @Delete('logout')
  logout(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(200);
    });
  }

  @Post('register')
  @ApiBody({
    type: CreateUserDTO,
    examples: {
      userExample1: {
        summary: 'Register a new user',
        value: {
          email: 'andrew@mail.com',
          password: 'asdfasdf',
          passwordConfirm: 'asdfasdf',
        } as CreateUserDTO,
      },
    },
  })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createUserDto: CreateUserDTO,
    @Next() next: NextFunction,
  ) {
    const user = await this.authenticationService.register(createUserDto);

    // Login the user automatically after creating their account
    req.login(user, (err) => {
      if (err) next(err);
      return res.send({
        data: {
          user,
        },
      });
    });
  }
}
