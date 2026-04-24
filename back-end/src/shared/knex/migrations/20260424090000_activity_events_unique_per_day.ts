import type { Knex } from 'knex';

const UNIQUE_INDEX_NAME = 'activity_events_activity_id_date_unique';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DELETE FROM activity_events
    WHERE date IS NULL;
  `);

  await knex.raw(`
    DELETE FROM your_table
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM your_table
      GROUP BY activity_id, date
    );
  `);

  await knex.schema.alterTable('activity_events', (table) => {
    table.date('date').notNullable().alter();
    table.unique(['activity_id', 'date'], UNIQUE_INDEX_NAME);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('activity_events', (table) => {
    table.dropUnique(['activity_id', 'date'], UNIQUE_INDEX_NAME);
    table.date('date').nullable().alter();
  });
}
