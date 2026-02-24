/**
 * File System Abstraction Layer
 *
 * Decouples TemplateService from Node.js fs/promises.
 * Enables testing with virtual filesystems and alternative backends.
 */

import type { Dirent } from 'fs';

/**
 * File system interface for pluggable implementations.
 */
export interface IFileSystem {
  /**
   * Read file contents as UTF-8 string
   */
  readFile(path: string, encoding?: string): Promise<string>;

  /**
   * Write file contents
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * Create directory (recursive)
   */
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;

  /**
   * List directory entries
   */
  readdir(
    path: string,
    options?: { withFileTypes?: false }
  ): Promise<string[]>;
  readdir(
    path: string,
    options?: { withFileTypes?: true }
  ): Promise<Dirent[]>;

  /**
   * Get file/directory stats
   */
  stat(path: string): Promise<FileStat>;

  /**
   * Check if file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get absolute path (for virtual filesystems)
   */
  resolve(...paths: string[]): string;

  /**
   * Get relative path between two paths
   */
  relative(from: string, to: string): string;

  /**
   * Get directory name of a path
   */
  dirname(path: string): string;

  /**
   * Get file name of a path
   */
  basename(path: string, ext?: string): string;

  /**
   * Get file extension
   */
  extname(path: string): string;

  /**
   * Join path segments
   */
  join(...paths: string[]): string;
}

/**
 * File stats
 */
export interface FileStat {
  isFile(): boolean;
  isDirectory(): boolean;
}
