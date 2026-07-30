import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('users.id').notNullable();
    table.string('name').notNullable();
    table.string('color').notNullable();

    table.timestamps(true, true);
  });

  await knex.schema.alterTable('activities', (table) => {
    table
      .integer('category_id')
      .unsigned()
      .references('categories.id')
      .nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('activities', (table) => {
    table.dropColumn('category_id');
  });

  await knex.schema.dropTable('categories');
}
