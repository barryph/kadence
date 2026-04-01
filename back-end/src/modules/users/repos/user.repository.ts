import { KnexService } from 'src/shared/knex/knex.service';
import User from '../domain/user.entity';
import UserEmail from '../domain/value-objects/UserEmail';
import { Injectable } from '@nestjs/common';
import type { IUserPersistence } from '../mappers/userMap';
import * as UserMap from '../mappers/userMap';

export interface IUsersRepo {
  exists(email: UserEmail): Promise<boolean>;
  getById(id: string): Promise<User | null>;
  getByEmail(id: UserEmail): Promise<User | null>;
  create(user: User): Promise<User>;
  // update(user: User): Promise<User | null>;
}

@Injectable()
// export default class UsersRepo implements IUsersRepo {
export default class UsersRepo implements IUsersRepo {
  constructor(private readonly knexService: KnexService) { }

  async exists(email: UserEmail) {
    const userResult = await this.knexService.connection.raw<{ rows: User[] }>(
      `SELECT * FROM users WHERE email = :email`,
      {
        email: email.value,
      },
    );
    const found = userResult.rows.length >= 1;
    return found;
  }

  async getById(id: string): Promise<User | null> {
    const result = await this.knexService.connection.raw<{
      rows: IUserPersistence[];
    }>(`SELECT * FROM users WHERE id = :id`, {
      id,
    });
    const user = result.rows[0];
    if (!user) return null;
    return UserMap.persistenceToDomain(user);
  }

  async getByEmail(email: UserEmail): Promise<User | null> {
    const result = await this.knexService.connection.raw<{
      rows: IUserPersistence[];
    }>(`SELECT * FROM users WHERE email = :email`, {
      email: email.value,
    });
    const user = result.rows[0];
    if (!user) return null;
    return UserMap.persistenceToDomain(user);
  }

  async create(userDomain: User): Promise<User> {
    const user = await UserMap.toPersistence(userDomain);
    const result = await this.knexService.connection.raw<{
      rows: IUserPersistence[];
    }>(
      `
        INSERT INTO users (email, password)
        VALUES (:email, :password)
        RETURNING *
      `,
      {
        email: user.email,
        password: user.password,
      },
    );
    const newUser = result.rows[0];
    return UserMap.persistenceToDomain(newUser);
  }
}
