import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import type { CheckContext, Issue, OrphanFilesCheckerConfig } from '../core/interfaces';
import { FileScanner, TsxParser } from '../utils';
import type { CheckerExecutionResult } from './BaseChecker';
import { BaseChecker } from './BaseChecker';

const INDEX_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

export class OrphanFilesChecker extends BaseChecker<OrphanFilesCheckerConfig> {
  private readonly scanner = new FileScanner();
  private readonly parser = new TsxParser();

  constructor() {
    super('orphan-files', 'Detect files not imported by any other file in the project', 'orphanFiles');
  }

  protected async execute(context: CheckContext): Promise<CheckerExecutionResult> {
    const config = this.getConfig();
    const issues: Issue[] = [];

    const uniqueFiles = new Map<string, { path: string; read: () => string }>();
    for (const scopePath of config.scope) {
      const scanned = this.scanner.scan(context.root, config.pattern, {
        cwd: scopePath,
        useCache: true,
      });
      for (const file of scanned) {
        uniqueFiles.set(file.path, file);
      }
    }

    const ignoreSet = new Set(
      (config.ignore ?? []).map((p: string) => resolve(context.root, p))
    );

    const allFilePaths = new Set(uniqueFiles.keys());
    const importedPaths = new Set<string>();

    const aliases: Record<string, string> = config.aliases ?? {};

    for (const file of uniqueFiles.values()) {
      const imports = this.parser.parseImports(file.read(), file.path);
      for (const imp of imports) {
        const resolved = this.resolveImport(imp.source, file.path, context.root, aliases);
        if (resolved) {
          importedPaths.add(resolved);
        }
      }
    }

    for (const filePath of allFilePaths) {
      if (ignoreSet.has(filePath)) continue;
      if (importedPaths.has(filePath)) continue;

      const rel = this.rel(context.root, filePath);
      issues.push(
        this.createIssue('warn', 'ORPHAN_FILE', `File is not imported by any other file: ${rel}`, {
          file: rel,
          hint: 'This file may be unused. Verify and remove if not needed.',
          suggestion: 'Import it from another file or add it to orphanFiles.ignore if it is an entry point.',
        })
      );
    }

    return {
      success: true,
      issues,
      stats: {
        filesScanned: uniqueFiles.size,
        orphanCount: issues.length,
      },
    };
  }

  private resolveImport(
    source: string,
    fromFile: string,
    root: string,
    aliases: Record<string, string>
  ): string | null {
    if (source.startsWith('.')) {
      return this.resolveRelative(dirname(fromFile), source);
    }

    for (const [alias, target] of Object.entries(aliases)) {
      const prefix = alias.endsWith('/') ? alias : alias + '/';
      if (source === alias || source.startsWith(prefix)) {
        const rest = source === alias ? '' : source.slice(prefix.length);
        const base = resolve(root, target);
        const full = rest ? resolve(base, rest) : base;
        return this.resolveRelative(dirname(full), './' + (rest || 'index'));
      }
    }

    return null;
  }

  private resolveRelative(dir: string, source: string): string | null {
    const base = resolve(dir, source);

    for (const ext of INDEX_EXTENSIONS) {
      const withExt = base + ext;
      if (existsSync(withExt)) return withExt;
    }

    for (const ext of INDEX_EXTENSIONS) {
      const indexFile = resolve(base, 'index' + ext);
      if (existsSync(indexFile)) return indexFile;
    }

    if (existsSync(base)) return base;

    return null;
  }

  private rel(root: string, target: string): string {
    return relative(root, target).replace(/\\/g, '/');
  }
}
