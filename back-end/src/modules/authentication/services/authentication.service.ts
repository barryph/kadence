import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { InvalidCredentialsError } from '../authentication.errors';
import CreateUserDTO from '../dtos/createUser.dto';
import { UserDTO } from '../../users/mappers/userMap';
import User from '../../users/domain/user.entity';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(private usersService: UsersService) { }

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.getByEmail(email);
    if (!user) {
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

    if (resetRequest) {
      // TODO(Mailgun): Send password reset email to resetRequest.recipientEmail.
      // Include resetRequest.resetToken in the reset link (never return it in API responses).
      this.logger.log(
        `[TODO Mailgun] Password reset email would be sent to ${resetRequest.recipientEmail}`,
      );
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.usersService.resetPassword(token, password);
  }
}
