import * as fs from 'node:fs';
import { ENV_FILE } from './global-setup';
import { destroyTestKnex, truncateAllTables } from './helpers/test-database';

beforeAll(() => {
  if (fs.existsSync(ENV_FILE)) {
    const { env } = JSON.parse(fs.readFileSync(ENV_FILE, 'utf-8')) as {
      env: Record<string, string>;
    };
    Object.assign(process.env, env);
  }
});

beforeEach(async () => {
  await truncateAllTables();
});

afterAll(async () => {
  await destroyTestKnex();
});
