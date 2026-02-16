import type { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.string('password_reset_token');
    table.datetime('password_reset_expires');

    table.timestamps(true, true);
  });
}
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
}
