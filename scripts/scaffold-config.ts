#!/usr/bin/env bun
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_PATH = join(__dirname, "app-scaffold.config.json");

export interface ScaffoldConfig {
  appName: string;
  target: string;
  domain?: string;
  dataMode?: "local" | "shared";
  packageName: string;
  description: string;
  port?: number;
  title?: string;
}

export async function loadScaffoldConfig(configPath = DEFAULT_CONFIG_PATH): Promise<ScaffoldConfig> {
  if (!existsSync(configPath)) {
    throw new Error(`Config not found: ${configPath}`);
  }
  const raw = await Bun.file(configPath).json();
  return raw as ScaffoldConfig;
}

function parseArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

async function main(): Promise<void> {
  const field = parseArg("--field");
  if (!field) return;

  const config = await loadScaffoldConfig();
  const value = (config as unknown as Record<string, unknown>)[field];
  if (value === undefined || value === null) return;
  process.stdout.write(String(value));
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
