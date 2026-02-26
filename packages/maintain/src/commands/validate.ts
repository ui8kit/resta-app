import type { Command } from 'commander';
import { executeMaintainRun } from './shared';

const DEFAULT_VALIDATE_CHECKERS = ['invariants', 'fixtures', 'view-exports', 'contracts'];

function normalizeCheckerName(name: string): string {
  if (name === 'viewExports') {
    return 'view-exports';
  }
  if (name === 'refactorAudit') {
    return 'refactor-audit';
  }
  return name;
}

function parseCheckerList(value?: string): string[] {
  if (!value) {
    return [...DEFAULT_VALIDATE_CHECKERS];
  }
  return value
    .split(',')
    .map((item) => normalizeCheckerName(item.trim()))
    .filter(Boolean);
}

export function registerValidateCommand(program: Command): void {
  program
    .command('validate')
    .description('Run validation checkers (invariants, fixtures, view exports, contracts)')
    .option('--cwd <dir>', 'Working directory', '.')
    .option('--config <path>', 'Maintain config file path', 'maintain.config.json')
    .option('--check <names>', 'Comma-separated checker names')
    .action(async (options: { cwd: string; config: string; check?: string }) => {
      const checkerNames = parseCheckerList(options.check);
      const { report } = await executeMaintainRun({
        cwd: options.cwd,
        configPath: options.config,
        checkerNames,
        mode: 'validate',
      });

      if (!report.success) {
        process.exit(1);
      }
    });
}
