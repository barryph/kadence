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
    // TODO: Move valueobject creation into user.createNew
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
}
