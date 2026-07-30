import { PostgreSqlContainer } from '@testcontainers/postgresql';
import knex from 'knex';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ENV_FILE = path.join(__dirname, '.test-env.json');

export default async function globalSetup() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('kadence_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const env = {
    POSTGRES_USER: container.getUsername(),
    POSTGRES_PASSWORD: container.getPassword(),
    DATABASE_NAME: container.getDatabase(),
    DATABASE_HOST: container.getHost(),
    DATABASE_PORT: String(container.getPort()),
    NODE_ENV: 'test',
    SESSION_SECRET: 'test-session-secret',
  };

  fs.writeFileSync(
    ENV_FILE,
    JSON.stringify({ env, containerId: container.getId() }),
  );

  process.env.NODE_ENV = 'test';
  Object.assign(process.env, env);

  const db = knex({
    client: 'pg',
    connection: {
      host: env.DATABASE_HOST,
      port: Number(env.DATABASE_PORT),
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.DATABASE_NAME,
    },
    migrations: {
      directory: path.join(__dirname, '../src/shared/knex/migrations'),
    },
  });

  await db.migrate.latest();

  await db.raw(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      sid varchar NOT NULL,
      sess json NOT NULL,
      expired timestamptz NOT NULL,
      PRIMARY KEY (sid)
    )
  `);
  await db.raw(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expired ON user_sessions (expired)
  `);

  await db.destroy();
}

export { ENV_FILE };
