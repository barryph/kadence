import { Inject, Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { InvalidCredentialsError } from '../authentication.errors';
import CreateUserDTO from '../dtos/createUser.dto';
import { UserDTO } from '../../users/mappers/userMap';
import User from '../../users/domain/user.entity';
import {
  EMAIL_SENDER,
  type IEmailSender,
} from 'src/shared/email/email-sender.port';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    private usersService: UsersService,
    @Inject(EMAIL_SENDER) private readonly emailSender: IEmailSender,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.getByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // OAuth-only accounts have no password and cannot use password login.
    if (!user.password) {
      throw new InvalidCredentialsError();
    }

    const doPasswordsMatch = await user.password.comparePasswords(pass);
    if (!doPasswordsMatch) {
      throw new InvalidCredentialsError();
    }

    return user;
  }

  async register(createUserDto: CreateUserDTO): Promise<UserDTO> {
    const user = await this.usersService.create(createUserDto);
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const resetRequest = await this.usersService.initiatePasswordReset(email);

    if (!resetRequest) {
      return;
    }

    try {
      await this.emailSender.sendPasswordResetEmail({
        recipientEmail: resetRequest.recipientEmail,
        resetToken: resetRequest.resetToken,
      });
    } catch (err) {
      // Swallowed on purpose, matching DeletionRequestService. The endpoint
      // answers with one generic message whether or not the address is
      // registered; surfacing a send failure would turn it into an
      // account-existence oracle whenever mail delivery is flaky.
      this.logger.error(
        `Failed to send the password reset email: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.usersService.resetPassword(token, password);
  }
}
