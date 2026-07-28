import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { ENV_FILE } from './global-setup';

export default async function globalTeardown() {
  if (!fs.existsSync(ENV_FILE)) {
    return;
  }

  const { containerId } = JSON.parse(fs.readFileSync(ENV_FILE, 'utf-8')) as {
    containerId: string;
  };

  try {
    execSync(`docker rm -f ${containerId}`, { stdio: 'ignore' });
  } catch {
    // Container may already be stopped
  }

  fs.unlinkSync(ENV_FILE);
}
