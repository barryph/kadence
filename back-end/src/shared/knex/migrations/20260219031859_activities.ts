import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activities', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('ticker').nullable();
    // table.integer('interval').notNullable();
    table.specificType('interval', 'interval').notNullable();
    table.integer('user_id').unsigned().references('users.id').notNullable();

    table.timestamps(true, true);
  });

  await knex.schema.createTable('activity_events', (table) => {
    table.date('date');
    table
      .integer('activity_id')
      .unsigned()
      .references('activities.id')
      .notNullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('activity_events');
  await knex.schema.dropTable('activities');
}
