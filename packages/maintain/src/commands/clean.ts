import type { Command } from 'commander';
import type { CleanCheckerConfig } from '../core/interfaces';
import { executeMaintainRun } from './shared';

type CleanMode = 'full' | 'dist';

const PRESET_PATHS: Record<CleanMode, string[]> = {
  full: ['node_modules', '../react'],
  dist: ['../react', 'node_modules/.vite'],
};

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
    .description('Run clean checker in dry-run or execute mode')
    .option('--cwd <dir>', 'Working directory', '.')
    .option('--config <path>', 'Maintain config file path', 'maintain.config.json')
    .option('--mode <mode>', 'Clean mode: full|dist', 'dist')
    .option('--paths <paths>', 'Comma-separated paths override')
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
            const preset = PRESET_PATHS[mode];
            const currentConfig: CleanCheckerConfig = config.checkers.clean ?? {
              paths: preset,
              includeTsBuildInfo: true,
            };

            config.checkers.clean = {
              ...currentConfig,
              paths: overridePaths ?? preset,
              includeTsBuildInfo: currentConfig.includeTsBuildInfo ?? true,
            };
          },
        });

        if (!report.success) {
          process.exit(1);
        }
      }
    );
}
