import 'dotenv/config';
import path from 'path';
import type { Knex } from 'knex';
import * as fs from 'node:fs';

const isProduction = process.env.NODE_ENV === 'production';
const root = path.resolve(process.cwd());

export const development: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DATABASE_HOST,
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

export const production: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DATABASE_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.DATABASE_NAME,
    // global-bundle.pem does not exist outside of prod,
    // we check isProduction to avoid erroring attempting to read a file that doesn't exist
    ...(isProduction && {
      ssl: {
        ca: fs.readFileSync('global-bundle.pem'),
        rejectUnauthorized: false, // Set to false if using self-signed certificates
      },
    }),
  },
  pool: {
    min: 2,
    max: 10,
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
