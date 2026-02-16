import 'dotenv/config';
import path from 'path';
import type { Knex } from 'knex';

const root = path.resolve(process.cwd());

export const development: Knex.Config = {
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
  migrations: {
    directory: path.join(root, '/src/shared/knex/migrations'),
  },
  seeds: {
    directory: path.join(root, '/src/shared/knex/seeds'),
  },
};

// staging: {
//   client: "postgresql",
//   connection: {
//     database: "my_db",
//     user: "username",
//     password: "password"
//   },
//   pool: {
//     min: 2,
//     max: 10
//   },
//   migrations: {
//     tableName: "knex_migrations"
//   }
// },

// production: {
//   client: "postgresql",
//   connection: {
//     database: "my_db",
//     user: "username",
//     password: "password"
//   },
//   pool: {
//     min: 2,
//     max: 10
//   },
//   migrations: {
//     tableName: "knex_migrations"
//   }
// }
