import type { Command } from 'commander';
import { executeMaintainRun } from './shared';

function parseCheckerList(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const names = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return names.length > 0 ? names : undefined;
}

export function registerRunCommand(program: Command): void {
  program
    .command('run', { isDefault: true })
    .description('Run checkers configured in maintain.config.json')
    .option('--cwd <dir>', 'Working directory', '.')
    .option('--config <path>', 'Maintain config file path', 'maintain.config.json')
    .option('--check <names>', 'Comma-separated checker names')
    .option('--max-parallel <number>', 'Override max parallel checker count')
    .action(async (options: { cwd: string; config: string; check?: string; maxParallel?: string }) => {
      const maxParallel = options.maxParallel ? Number(options.maxParallel) : undefined;
      const checkerNames = parseCheckerList(options.check);

      const { report } = await executeMaintainRun({
        cwd: options.cwd,
        configPath: options.config,
        checkerNames,
        mode: 'run',
        mutateConfig: (config) => {
          if (maxParallel && Number.isFinite(maxParallel) && maxParallel > 0) {
            config.maxParallel = Math.floor(maxParallel);
          }
        },
      });

      if (!report.success) {
        process.exit(1);
      }
    });
}
