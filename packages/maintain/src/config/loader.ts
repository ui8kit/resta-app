import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z, ZodError } from 'zod';
import type { IMaintainConfig } from '../core/interfaces';
import { createDefaultMaintainConfig } from './defaults';

const refactorAuditSchema = z.object({
  mapping: z.string().min(1),
  scope: z.array(z.string().min(1)).min(1),
  maxMatchesPerEntry: z.number().int().min(1).optional(),
});

const invariantsSchema = z.object({
  routes: z.object({
    appFile: z.string().min(1),
    required: z.array(z.string().min(1)).min(1),
  }),
  fixtures: z.object({
    pageFile: z.string().min(1),
    requiredPageDomains: z.array(z.string().min(1)).min(1),
  }),
  blocks: z.object({
    dir: z.string().min(1),
    indexFile: z.string().min(1),
    recursive: z.boolean().optional(),
  }),
  context: z.object({
    file: z.string().min(1),
    requiredSymbols: z.array(z.string().min(1)).optional(),
    fixtureImportPattern: z.string().min(1).optional(),
  }),
});

const fixturesSchema = z.object({
  targets: z
    .array(
      z.object({
        file: z.string().min(1),
        schema: z.string().min(1),
      })
    )
    .min(1),
});

const viewExportsSchema = z.object({
  pattern: z.string().min(1),
  exportShape: z.enum(['interface+function']),
});

const contractsSchema = z.object({
  blueprint: z.string().min(1),
  appFile: z.string().min(1).optional(),
  entityTypeRequireInlineBody: z.boolean().optional(),
});

const cleanSchema = z.object({
  paths: z.array(z.string().min(1)).min(1),
  pathsByMode: z
    .object({
      full: z.array(z.string().min(1)).optional(),
      dist: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  includeTsBuildInfo: z.boolean().optional(),
});

const dataClassConflictsSchema = z.object({
  scope: z.array(z.string().min(1)).min(1),
  pattern: z.string().min(1),
  ignoreDataClasses: z.array(z.string().min(1)).optional(),
});

const componentTagSchema = z.object({
  scope: z.array(z.string().min(1)).min(1),
  pattern: z.string().min(1),
  tagMapPath: z.union([z.string().min(1), z.null()]).optional(),
});

const colorTokensSchema = z.object({
  scope: z.array(z.string().min(1)).min(1),
  pattern: z.string().min(1),
  tokenSource: z.enum(['utility-props.map']).optional(),
  utilityPropsMapPath: z.string().min(1),
});

const severitySchema = z.enum(['error', 'warn', 'info']);

const genLintSchema = z.object({
  scope: z.array(z.string().min(1)).min(1),
  pattern: z.string().min(1),
  rules: z
    .object({
      GEN001: severitySchema.optional(),
      GEN002: severitySchema.optional(),
      GEN003: severitySchema.optional(),
      GEN004: severitySchema.optional(),
      GEN005: severitySchema.optional(),
      GEN006: severitySchema.optional(),
      GEN007: severitySchema.optional(),
      GEN008: severitySchema.optional(),
    })
    .catchall(severitySchema)
    .optional(),
});

const checkersSchema = z
  .object({
    refactorAudit: refactorAuditSchema.optional(),
    invariants: invariantsSchema.optional(),
    fixtures: fixturesSchema.optional(),
    viewExports: viewExportsSchema.optional(),
    contracts: contractsSchema.optional(),
    clean: cleanSchema.optional(),
    dataClassConflicts: dataClassConflictsSchema.optional(),
    componentTag: componentTagSchema.optional(),
    colorTokens: colorTokensSchema.optional(),
    genLint: genLintSchema.optional(),
  })
  .catchall(z.unknown());

export const maintainConfigSchema = z.object({
  root: z.string().min(1).optional(),
  reportsDir: z.string().min(1).optional(),
  continueOnError: z.boolean().optional(),
  maxParallel: z.number().int().min(1).optional(),
  checkers: checkersSchema.default({}),
});

export type MaintainConfigInput = z.infer<typeof maintainConfigSchema>;

export interface LoadMaintainConfigOptions {
  cwd?: string;
  configPath?: string;
}

export function loadMaintainConfig(options: LoadMaintainConfigOptions = {}): IMaintainConfig {
  const cwd = resolve(options.cwd ?? process.cwd());
  const configPath = resolve(cwd, options.configPath ?? 'maintain.config.json');

  if (!existsSync(configPath)) {
    throw new Error(`Maintain config not found: ${configPath}`);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(readFileSync(configPath, 'utf-8')) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse maintain config JSON: ${message}`);
  }

  let parsed: MaintainConfigInput;
  try {
    parsed = maintainConfigSchema.parse(parsedJson);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; ');
      throw new Error(`Invalid maintain config: ${details}`);
    }
    throw error;
  }

  const defaults = createDefaultMaintainConfig(cwd);
  return {
    ...defaults,
    ...parsed,
    root: parsed.root ? resolve(cwd, parsed.root) : defaults.root,
    reportsDir: parsed.reportsDir ?? defaults.reportsDir,
    continueOnError: parsed.continueOnError ?? defaults.continueOnError,
    maxParallel: parsed.maxParallel ?? defaults.maxParallel,
    checkers: parsed.checkers ?? {},
  };
}
