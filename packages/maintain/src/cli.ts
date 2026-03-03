#!/usr/bin/env bun
import { Command } from 'commander';
import { registerAuditCommand } from './commands/audit';
import { registerCleanCommand } from './commands/clean';
import { registerRunCommand } from './commands/run';
import { registerValidateCommand } from './commands/validate';

const program = new Command();
const COMMAND_OPTIONS_HELP = `
Command options quick reference:
  run      --cwd, --config, --check, --max-parallel, --verbose
  validate --cwd, --config, --check, --verbose
  audit    --cwd, --config, --mapping, --scope, --verbose
  clean    --cwd, --config, --mode, --paths, --execute, --verbose
`;

program.name('maintain').description('Project maintenance CLI for UI8Kit workspaces').version('0.1.0');

registerRunCommand(program);
registerValidateCommand(program);
registerAuditCommand(program);
registerCleanCommand(program);
program.addHelpText('after', COMMAND_OPTIONS_HELP);

void program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
