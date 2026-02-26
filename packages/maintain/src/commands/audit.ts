import type { Command } from 'commander';
import type { RefactorAuditConfig } from '../core/interfaces';
import { executeMaintainRun } from './shared';

const DEFAULT_REFRACTOR_SCOPE = ['src', 'fixtures'];
const DEFAULT_MAPPING = 'scripts/schemas/brand-mapping.json';

function parseScope(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const scope = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return scope.length > 0 ? scope : undefined;
}

export function registerAuditCommand(program: Command): void {
  program
    .command('audit')
    .description('Run refactor audit checker')
    .option('--cwd <dir>', 'Working directory', '.')
    .option('--config <path>', 'Maintain config file path', 'maintain.config.json')
    .option('--mapping <path>', 'Mapping file path override')
    .option('--scope <paths>', 'Comma-separated scope paths override')
    .action(
      async (options: { cwd: string; config: string; mapping?: string; scope?: string }) => {
        const scope = parseScope(options.scope);
        const { report } = await executeMaintainRun({
          cwd: options.cwd,
          configPath: options.config,
          checkerNames: ['refactor-audit'],
          mode: 'audit',
          mutateConfig: (config) => {
            const currentConfig: RefactorAuditConfig = config.checkers.refactorAudit ?? {
              mapping: DEFAULT_MAPPING,
              scope: DEFAULT_REFRACTOR_SCOPE,
            };

            config.checkers.refactorAudit = {
              ...currentConfig,
              ...(options.mapping ? { mapping: options.mapping } : {}),
              ...(scope ? { scope } : {}),
            };
          },
        });

        if (!report.success) {
          process.exit(1);
        }
      }
    );
}
