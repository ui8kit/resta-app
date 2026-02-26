import type { IMaintainConfig } from '../core/interfaces';

export function createDefaultMaintainConfig(root: string): IMaintainConfig {
  return {
    root,
    reportsDir: '.cursor/reports',
    continueOnError: true,
    maxParallel: 1,
    checkers: {},
  };
}
