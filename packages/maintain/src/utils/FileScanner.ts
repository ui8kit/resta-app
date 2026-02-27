import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export interface ScannedFile {
  path: string;
  relativePath: string;
  size: number;
  mtimeMs: number;
  read(): string;
}

export interface FileScanOptions {
  cwd?: string;
  ignore?: string[];
  useCache?: boolean;
  includeDotFiles?: boolean;
}

export class FileScanner {
  private readonly cache = new Map<string, ScannedFile[]>();

  scan(root: string, pattern: string, options: FileScanOptions = {}): ScannedFile[] {
    const normalizedPattern = this.normalizePattern(pattern);
    const absoluteRoot = resolve(root);
    const scanRoot = resolve(absoluteRoot, options.cwd ?? '.');

    if (!existsSync(scanRoot)) {
      return [];
    }

    const cacheEnabled = options.useCache !== false;
    const cacheKey = JSON.stringify({
      scanRoot,
      pattern: normalizedPattern,
      ignore: options.ignore ?? [],
      includeDotFiles: options.includeDotFiles ?? false,
    });

    if (cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const matcher = this.patternToRegex(normalizedPattern);
    const ignoreMatchers = (options.ignore ?? []).map((entry) =>
      this.patternToRegex(this.normalizePattern(entry))
    );
    const files: ScannedFile[] = [];

    this.walk(scanRoot, (absolutePath, relPath) => {
      const normalizedPath = relPath.replace(/\\/g, '/');
      if (!options.includeDotFiles && this.hasDotSegment(normalizedPath)) {
        return;
      }
      if (!matcher.test(normalizedPath)) {
        return;
      }
      if (ignoreMatchers.some((ignore) => ignore.test(normalizedPath))) {
        return;
      }

      const stats = statSync(absolutePath);
      let contentCache: string | undefined;

      files.push({
        path: absolutePath,
        relativePath: normalizedPath,
        size: stats.size,
        mtimeMs: stats.mtimeMs,
        read: () => {
          if (contentCache === undefined) {
            contentCache = readFileSync(absolutePath, 'utf-8');
          }
          return contentCache;
        },
      });
    });

    const sorted = files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
    if (cacheEnabled) {
      this.cache.set(cacheKey, sorted);
    }
    return sorted;
  }

  clearCache(): void {
    this.cache.clear();
  }

  private walk(
    dirPath: string,
    onFile: (absolutePath: string, relativePath: string) => void,
    basePath = dirPath
  ): void {
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.turbo') {
        continue;
      }
      const absolutePath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        this.walk(absolutePath, onFile, basePath);
        continue;
      }
      if (entry.isFile()) {
        onFile(absolutePath, relative(basePath, absolutePath));
      }
    }
  }

  private normalizePattern(pattern: string): string {
    const normalized = pattern.trim().replace(/\\/g, '/');
    if (!normalized || normalized === '.') {
      return '**/*';
    }
    return normalized.startsWith('./') ? normalized.slice(2) : normalized;
  }

  private patternToRegex(pattern: string): RegExp {
    const source: string[] = ['^'];
    const glob = pattern;
    const escaped = /[.+^${}()|[\]\\]/;

    for (let index = 0; index < glob.length; index += 1) {
      const char = glob[index];
      const next = glob[index + 1];
      const afterNext = glob[index + 2];

      if (char === '*' && next === '*') {
        if (afterNext === '/') {
          source.push('(?:.*/)?');
          index += 2;
        } else {
          source.push('.*');
          index += 1;
        }
        continue;
      }

      if (char === '*') {
        source.push('[^/]*');
        continue;
      }

      if (char === '?') {
        source.push('[^/]');
        continue;
      }

      if (escaped.test(char)) {
        source.push('\\', char);
        continue;
      }

      source.push(char);
    }

    source.push('$');
    return new RegExp(source.join(''));
  }

  private hasDotSegment(pathValue: string): boolean {
    return pathValue
      .split('/')
      .some((segment) => segment.length > 1 && segment.startsWith('.'));
  }
}
