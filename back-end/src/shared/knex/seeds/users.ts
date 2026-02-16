import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

// TODO: This is not optimal. It is repeating this function from the authentication service
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
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
