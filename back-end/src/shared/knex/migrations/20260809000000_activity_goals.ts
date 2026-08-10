import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activity_goals', (table) => {
    table.increments('id').primary();
    table
      .integer('activity_id')
      .unsigned()
      .references('activities.id')
      .onDelete('CASCADE')
      .notNullable();
    table.integer('target_per_week').notNullable();

    table.unique(['activity_id']);

    table.timestamps(true, true);
  });

  await knex.raw(`
    ALTER TABLE activity_goals
    ADD CONSTRAINT activity_goals_target_per_week_check
    CHECK (target_per_week BETWEEN 1 AND 7);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE activity_goals
    DROP CONSTRAINT activity_goals_target_per_week_check;
  `);
  await knex.schema.dropTable('activity_goals');
}
