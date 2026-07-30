import { Knex } from 'knex';
import UserPassword from 'src/modules/users/domain/value-objects/UserPassword';

async function hashPassword(password: string): Promise<string> {
  const newPassword = UserPassword.create(password);
  const hash = await newPassword.hashPassword();
  return hash;
}

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  // Inserts seed entries
  await knex('users').insert([
    {
      email: 'test@mail.com',
      password: await hashPassword('asdfasdf'),
    },
  ]);
}
