import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import type { CheckContext, InvariantsCheckerConfig } from '../core/interfaces';
import { FileScanner } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

export class InvariantsChecker extends BaseChecker<InvariantsCheckerConfig> {
  private readonly scanner = new FileScanner();

  constructor() {
    super(
      'invariants',
      'Validate route, fixture, block, and context invariants',
      'invariants'
    );
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const issues = [
      ...this.validateFixtureDomains(context.root, config),
      ...this.validateRoutes(context.root, config),
      ...this.validateBlocks(context.root, config),
      ...this.validateContext(context.root, config),
    ];
    const errorCount = issues.filter((issue) => issue.level === 'error').length;

    return {
      success: errorCount === 0,
      issues,
      stats: {
        errorCount,
        warningCount: issues.filter((issue) => issue.level === 'warn').length,
      },
    };
  }

  private validateFixtureDomains(root: string, config: InvariantsCheckerConfig) {
    const issues = [];
    const fixturePath = resolve(root, config.fixtures.pageFile);
    if (!existsSync(fixturePath)) {
      issues.push(
        this.createIssue(
          'error',
          'PAGE_FIXTURE_MISSING',
          `Fixture not found: ${this.relative(root, fixturePath)}`,
          {
            file: this.relative(root, fixturePath),
            hint: 'Add the missing fixture file or update checkers.invariants.fixtures.pageFile.',
            suggestion: 'Create fixtures/shared/page.json with required page domains.',
          }
        )
      );
      return issues;
    }

    let pageFixture: unknown;
    try {
      pageFixture = JSON.parse(readFileSync(fixturePath, 'utf-8')) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(
        this.createIssue('error', 'PAGE_FIXTURE_INVALID_JSON', message, {
          file: this.relative(root, fixturePath),
          hint: 'Fix JSON syntax in the fixture file.',
          suggestion: 'Run a JSON formatter/linter and ensure commas/quotes are valid.',
        })
      );
      return issues;
    }

    const pageRecord = (pageFixture as { page?: Record<string, unknown> }).page;
    if (!pageRecord || typeof pageRecord !== 'object') {
      issues.push(
        this.createIssue(
          'error',
          'PAGE_FIXTURE_INVALID_SHAPE',
          `Fixture "${this.relative(root, fixturePath)}" must contain object key "page".`,
          {
            expected: 'Object with key "page"',
            received: 'Missing or non-object "page"',
            hint: 'Ensure fixture root has a "page" object with required domain arrays.',
          }
        )
      );
      return issues;
    }

    for (const key of config.fixtures.requiredPageDomains) {
      const value = pageRecord[key];
      if (!Array.isArray(value)) {
        issues.push(
          this.createIssue(
            'error',
            'PAGE_DOMAIN_MISSING',
            `Fixture "${this.relative(root, fixturePath)}" is missing array "page.${key}".`,
            {
              expected: `page.${key} to be an array`,
              received: 'Missing or non-array value',
              hint: `Add "page.${key}": [] to ${this.relative(root, fixturePath)}.`,
            }
          )
        );
      }
    }

    return issues;
  }

  private validateRoutes(root: string, config: InvariantsCheckerConfig) {
    const issues = [];
    const appPath = resolve(root, config.routes.appFile);
    if (!existsSync(appPath)) {
      issues.push(
        this.createIssue('error', 'APP_FILE_MISSING', `App file not found: ${this.relative(root, appPath)}`, {
          file: this.relative(root, appPath),
          hint: 'Ensure routes entry point exists or update checkers.invariants.routes.appFile.',
        })
      );
      return issues;
    }

    const appContent = readFileSync(appPath, 'utf-8');
    const routePaths = this.extractRoutePaths(appContent);
    for (const route of config.routes.required) {
      if (!routePaths.has(route)) {
        issues.push(
          this.createIssue('error', 'ROUTE_MISSING', `Required route not found in App file: ${route}`, {
            file: this.relative(root, appPath),
            expected: route,
            received: 'Route not registered',
            hint: `Add <Route path="${route}" element={...} /> to App.tsx.`,
          })
        );
      }
    }

    const routeImports = this.extractRouteImports(appContent);
    for (const importPath of routeImports) {
      const resolvedImport = this.resolveImportPath(importPath, appPath, root);
      if (!resolvedImport) {
        continue;
      }
      if (!this.moduleFileExists(resolvedImport)) {
        issues.push(
          this.createIssue(
            'error',
            'ROUTE_FILE_MISSING',
            `Route import does not resolve to a file: ${importPath}`,
            {
              file: this.relative(root, appPath),
              hint: 'Fix route import path or create the missing route module.',
              suggestion: `Ensure import "${importPath}" resolves to an existing file.`,
            }
          )
        );
      }
    }

    return issues;
  }

  private validateBlocks(root: string, config: InvariantsCheckerConfig) {
    const issues = [];
    const blocksDir = resolve(root, config.blocks.dir);
    const indexPath = resolve(root, config.blocks.indexFile);

    if (!existsSync(indexPath)) {
      issues.push(
        this.createIssue(
          'error',
          'BLOCKS_INDEX_MISSING',
          `Blocks index file not found: ${this.relative(root, indexPath)}`,
          {
            file: this.relative(root, indexPath),
            hint: 'Create index.ts and export all block components from it.',
          }
        )
      );
      return issues;
    }

    if (!existsSync(blocksDir)) {
      issues.push(
        this.createIssue('error', 'BLOCKS_DIR_MISSING', `Blocks directory not found: ${this.relative(root, blocksDir)}`, {
          file: this.relative(root, blocksDir),
          hint: 'Create the blocks directory or adjust checkers.invariants.blocks.dir.',
        })
      );
      return issues;
    }

    const indexContent = readFileSync(indexPath, 'utf-8');
    const blockFiles = this.listBlockFiles(blocksDir, config.blocks.recursive ?? true);
    for (const block of blockFiles) {
      if (!indexContent.includes(block)) {
        issues.push(
          this.createIssue(
            'warn',
            'BLOCK_NOT_EXPORTED',
            `Block "${block}" is not exported from ${this.relative(root, indexPath)}.`,
            {
              file: this.relative(root, indexPath),
              hint: `Add export for "${block}" in ${this.relative(root, indexPath)}.`,
              suggestion: `Add: export { ${block} } from './${block}';`,
            }
          )
        );
      }
    }

    return issues;
  }

  private validateContext(root: string, config: InvariantsCheckerConfig) {
    const issues = [];
    const contextFile = resolve(root, config.context.file);
    if (!existsSync(contextFile)) {
      issues.push(
        this.createIssue(
          'error',
          'CONTEXT_FILE_MISSING',
          `Context file not found: ${this.relative(root, contextFile)}`,
          {
            file: this.relative(root, contextFile),
            hint: 'Create the context adapter file or update checkers.invariants.context.file.',
          }
        )
      );
      return issues;
    }

    const contextContent = readFileSync(contextFile, 'utf-8');
    const requiredSymbols = config.context.requiredSymbols ?? [];
    for (const symbol of requiredSymbols) {
      if (!contextContent.includes(symbol)) {
        issues.push(
          this.createIssue(
            'warn',
            'CONTEXT_SYMBOL_MISSING',
            `Expected symbol "${symbol}" was not found in context file.`,
            {
              file: this.relative(root, contextFile),
              expected: symbol,
              received: 'Symbol not found',
              hint: `Export "${symbol}" from ${this.relative(root, contextFile)}.`,
            }
          )
        );
      }
    }

    const importPattern = new RegExp(
      config.context.fixtureImportPattern ?? "from ['\"]([^'\"]*fixtures[^'\"]*\\.json)['\"]",
      'g'
    );
    const imports = Array.from(contextContent.matchAll(importPattern)).map((match) => match[1] ?? '');
    for (const importPath of imports) {
      const resolvedImport = this.resolveImportPath(importPath, contextFile, root);
      if (!resolvedImport || !this.moduleFileExists(resolvedImport, ['.json'])) {
        issues.push(
          this.createIssue(
            'error',
            'FIXTURE_IMPORT_MISSING',
            `Fixture import not found: ${importPath}`,
            {
              file: this.relative(root, contextFile),
              hint: 'Fix the fixture import path or create the missing JSON fixture file.',
            }
          )
        );
      }
    }

    return issues;
  }

  private listBlockFiles(dirPath: string, recursive: boolean): string[] {
    const pattern = recursive ? '**/*.tsx' : '*.tsx';
    const files = this.scanner.scan(dirPath, pattern, { useCache: true });
    return Array.from(new Set(files.map((file) => basename(file.relativePath, '.tsx'))));
  }

  private extractRoutePaths(content: string): Set<string> {
    const routes = new Set<string>();
    const routePattern = /path=['"]([^'"]+)['"]/g;
    for (const match of content.matchAll(routePattern)) {
      routes.add(match[1] ?? '');
    }
    return routes;
  }

  private extractRouteImports(content: string): string[] {
    const imports: string[] = [];
    const importPattern = /import\s+(?:type\s+)?(?:[^'"]+)\s+from\s+['"]([^'"]+)['"]/g;
    for (const match of content.matchAll(importPattern)) {
      const importPath = match[1] ?? '';
      if (importPath.includes('/routes/') || importPath.startsWith('@/routes/')) {
        imports.push(importPath);
      }
    }
    return imports;
  }

  private resolveImportPath(importPath: string, sourceFilePath: string, root: string): string | undefined {
    if (importPath.startsWith('@/')) {
      return resolve(root, 'src', importPath.slice(2));
    }
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return resolve(dirname(sourceFilePath), importPath);
    }
    return undefined;
  }

  private moduleFileExists(modulePath: string, extensions = ['.ts', '.tsx', '.js', '.jsx']): boolean {
    const candidates = [
      modulePath,
      ...extensions.map((ext) => `${modulePath}${ext}`),
      ...extensions.map((ext) => join(modulePath, `index${ext}`)),
    ];
    return candidates.some((candidate) => existsSync(candidate));
  }

  private relative(root: string, targetPath: string): string {
    return relative(root, targetPath).replace(/\\/g, '/');
  }
}
