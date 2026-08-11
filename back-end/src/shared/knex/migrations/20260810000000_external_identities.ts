import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // OAuth-only users have no email/password login, so no password is set.
  await knex.schema.alterTable('users', (table) => {
    table.string('password').nullable().alter();
  });

  await knex.schema.createTable('external_identities', (table) => {
    table.increments('id').primary();
    table.string('provider', 16).notNullable().checkIn(['google', 'apple']);
    table.string('provider_subject', 512).notNullable();
    table
      .bigInteger('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    // Informational only. Never used to resolve or link identities.
    table.string('provider_email', 512);
    table.timestamps(true, true);

    table.unique(['provider', 'provider_subject']);
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('external_identities');
  await knex.schema.alterTable('users', (table) => {
    table.string('password').notNullable().alter();
  });
}
