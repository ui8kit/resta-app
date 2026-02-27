#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'maintain',
  ['validate', '--cwd', '.', '--config', 'maintain.config.json', '--check', 'gen-lint'],
  { stdio: 'inherit' }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
