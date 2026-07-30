import {
  Controller,
  Delete,
  Post,
  Body,
  Req,
  Res,
  Next,
  Logger,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import CreateUserDTO from '../authentication/dtos/createUser.dto';
import { AuthenticationService } from './services/authentication.service';
import type { UserDTO } from '../users/mappers/userMap';
import passport from 'passport';
import type { NextFunction, Request, Response } from 'express';
import LoginDTO from './dtos/login.dto';
import ForgotPasswordDTO from './dtos/forgotPassword.dto';
import ResetPasswordDTO from './dtos/resetPassword.dto';
import { InvalidCredentialsError } from './authentication.errors';
import ServerError from 'src/shared/ServerError';
import { ForgotPasswordRateLimitGuard } from './guards/forgot-password-rate-limit.guard';

@Controller('auth')
export class AuthenticationController {
  private readonly logger = new Logger(AuthenticationController.name);

  constructor(private readonly authenticationService: AuthenticationService) { }

  @Post('login')
  @HttpCode(200)
  @ApiBody({
    type: LoginDTO,
    examples: {
      loginExample: {
        summary: 'Login',
        value: {
          email: 'andrew@mail.com',
          password: 'asdfasdf',
        },
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

      req.session.regenerate((regenErr) => {
        if (regenErr) return next(regenErr);
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            this.logger.error(loginErr, 'Session login error');
            next(new ServerError('SESSION_LOGIN_ERROR', 'Session login error'));
            return;
          }
          return res.send({ data: { user } });
        });
      });
    })(req, res, next);
  }

  @Delete('logout')
  @HttpCode(200)
  logout(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.session.destroy((destroyError) => {
        if (destroyError) return next(destroyError);
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
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
        },
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

    req.session.regenerate((regenErr) => {
      if (regenErr) return next(regenErr);
      // Login the user automatically after creating their account
      req.login(user, (err) => {
        if (err) next(err);
        return res.send({
          data: {
            user,
          },
        });
      });
    });
  }

  @Post('forgot-password')
  @HttpCode(200)
  @UseGuards(ForgotPasswordRateLimitGuard)
  @ApiBody({
    type: ForgotPasswordDTO,
    examples: {
      forgotPasswordExample: {
        summary: 'Request a password reset email',
        value: {
          email: 'andrew@mail.com',
        },
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDTO) {
    await this.authenticationService.forgotPassword(forgotPasswordDto.email);
    return {
      data: {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      },
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiBody({
    type: ResetPasswordDTO,
    examples: {
      resetPasswordExample: {
        summary: 'Reset password with token',
        value: {
          token: 'a1b2c3d4e5f6789012345678901234567890abcd',
          password: 'newpassword',
        },
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
    await this.authenticationService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
    return { data: { message: 'Password has been reset successfully.' } };
  }
}
