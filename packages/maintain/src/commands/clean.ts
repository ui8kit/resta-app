import type { Command } from 'commander';
import type { CleanCheckerConfig, CleanMode } from '../core/interfaces';
import { executeMaintainRun } from './shared';

function parsePaths(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const paths = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return paths.length > 0 ? paths : undefined;
}

function parseMode(value: string | undefined): CleanMode {
  return value === 'full' ? 'full' : 'dist';
}

export function registerCleanCommand(program: Command): void {
  program
    .command('clean')
    .description('Run clean checker in dry-run or execute mode. Paths from maintain.config.json checkers.clean.')
    .option('--cwd <dir>', 'Working directory', '.')
    .option('--config <path>', 'Maintain config file path', 'maintain.config.json')
    .option('--mode <mode>', 'Clean mode: full|dist (uses pathsByMode when defined)', 'dist')
    .option('--paths <paths>', 'Comma-separated paths override (overrides config)')
    .option('--execute', 'Apply deletion (default is dry-run)', false)
    .action(
      async (options: {
        cwd: string;
        config: string;
        mode?: string;
        paths?: string;
        execute?: boolean;
      }) => {
        const mode = parseMode(options.mode);
        const overridePaths = parsePaths(options.paths);

        const { report } = await executeMaintainRun({
          cwd: options.cwd,
          configPath: options.config,
          checkerNames: ['clean'],
          mode: 'clean',
          dryRun: !options.execute,
          mutateConfig: (config) => {
            const currentConfig: CleanCheckerConfig | undefined = config.checkers.clean;
            const configPaths =
              currentConfig?.pathsByMode?.[mode] ?? currentConfig?.paths ?? [];
            const resolvedPaths = overridePaths ?? configPaths;

            if (resolvedPaths.length === 0) {
              throw new Error(
                'No paths to clean. Add checkers.clean.paths (or pathsByMode) in maintain.config.json, or use --paths.'
              );
            }

            config.checkers.clean = {
              ...currentConfig,
              paths: resolvedPaths,
              includeTsBuildInfo: currentConfig?.includeTsBuildInfo ?? true,
            };
          },
        });

        if (!report.success) {
          process.exit(1);
        }
      }
    );
}
