import { Injectable } from '@nestjs/common';
import User from '../domain/user.entity';
import UserEmail from '../domain/value-objects/UserEmail';
import CreateUserDTO from '../../authentication/dtos/createUser.dto';
import UserPassword from '../domain/value-objects/UserPassword';
import * as UserMap from '../mappers/userMap';
import {
  PasswordsDontMatchError,
  EmailTakenError,
} from '../domain/user.errors';
import UsersRepo from '../repos/user.repository';
import { InvalidResetTokenError } from '../../authentication/authentication.errors';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from '../../authentication/utils/password-reset-token';
import { PASSWORD_RESET_TOKEN_EXPIRY_MS } from '../../authentication/constants/password-reset.constants';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepo) { }

  async getById(id: string): Promise<User | null> {
    const user = await this.usersRepo.getById(id);
    return user;
  }

  async getByEmail(rawEmail: string): Promise<User | null> {
    const email = UserEmail.create(rawEmail);
    const user = await this.usersRepo.getByEmail(email);
    return user;
  }

  async create(body: CreateUserDTO) {
    const email = UserEmail.create(body.email);
    const password = UserPassword.create(body.password);
    const user = User.createNew({
      email,
      password,
    });

    if (body.password !== body.passwordConfirm) {
      throw new PasswordsDontMatchError();
    }
    const userAlreadyExists = await this.usersRepo.exists(email);

    if (userAlreadyExists) {
      throw new EmailTakenError();
    }

    const created = await this.usersRepo.create(user);

    return UserMap.toDTO(created);
  }

  async initiatePasswordReset(
    rawEmail: string,
  ): Promise<{ recipientEmail: string; resetToken: string } | null> {
    const email = UserEmail.create(rawEmail);
    const user = await this.usersRepo.getByEmail(email);

    // Is no matching user is found, silently return as to not give away if an
    // account with this email exists
    if (!user?.isPersisted()) {
      return null;
    }

    const { token, hashedToken } = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);
    await this.usersRepo.setPasswordResetToken(user.id, hashedToken, expiresAt);

    return {
      recipientEmail: user.email.value,
      resetToken: token,
    };
  }

  async resetPassword(rawToken: string, rawPassword: string): Promise<void> {
    const hashedToken = hashPasswordResetToken(rawToken);
    const resetRecord =
      await this.usersRepo.findPasswordResetByToken(hashedToken);

    if (
      !resetRecord ||
      resetRecord.passwordResetExpires.getTime() <= Date.now()
    ) {
      throw new InvalidResetTokenError();
    }

    const newPassword = UserPassword.create(rawPassword);
    const hashedPassword = await newPassword.hashPassword();

    await this.usersRepo.updatePassword(resetRecord.userId, hashedPassword);
    await this.usersRepo.clearUserSessions(resetRecord.userId);
  }
}
