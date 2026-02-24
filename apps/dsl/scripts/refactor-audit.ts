#!/usr/bin/env bun
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { dirname, extname, join, relative } from "path";
import { fileURLToPath } from "url";

type Severity = "error" | "warn" | "info";

interface MappingEntry {
  from: string;
  to: string;
  severity?: Severity;
}

interface MappingFile {
  version?: string;
  entries: MappingEntry[];
}

interface ResidualMatch {
  term: string;
  replacement: string;
  severity: Severity;
  file: string;
  line: number;
  excerpt: string;
}

interface EntryMetrics {
  from: string;
  to: string;
  severity: Severity;
  oldCount: number;
  newCount: number;
  residualCount: number;
  expectedCount: number;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const reportsDir = join(repoRoot, ".cursor", "reports");
const defaultMappingPath = join(repoRoot, ".manual", "brand-mapping.json");
const defaultScope = [
  "src",
  "fixtures",
];
const validExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mdx",
  ".css",
  ".scss",
  ".sh",
  ".yml",
  ".yaml",
]);

function parseArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(content: string, search: string): number {
  if (!search) return 0;
  const regex = new RegExp(escapeRegex(search), "gi");
  return content.match(regex)?.length ?? 0;
}

function listFilesRecursively(targetPath: string): string[] {
  const full = join(repoRoot, targetPath);
  const stats = statSync(full, { throwIfNoEntry: false });
  if (!stats) return [];
  if (stats.isFile()) return [full];

  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".turbo") continue;
    const next = join(full, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursively(relative(repoRoot, next)));
    else if (validExtensions.has(extname(entry.name))) out.push(next);
  }
  return out;
}

function collectResidualMatches(
  content: string,
  file: string,
  entry: MappingEntry,
  maxPerEntry: number
): ResidualMatch[] {
  const severity = entry.severity ?? "error";
  const from = entry.from;
  if (!from) return [];
  const regex = new RegExp(escapeRegex(from), "i");
  const lines = content.split(/\r?\n/);
  const out: ResidualMatch[] = [];
  for (let i = 0; i < lines.length && out.length < maxPerEntry; i += 1) {
    const line = lines[i] ?? "";
    if (!regex.test(line)) continue;
    out.push({
      term: from,
      replacement: entry.to,
      severity,
      file: relative(repoRoot, file).replace(/\\/g, "/"),
      line: i + 1,
      excerpt: line.trim().slice(0, 200),
    });
  }
  return out;
}

function loadMapping(mappingPath: string): MappingFile {
  const raw = readFileSync(mappingPath, "utf-8");
  const parsed = JSON.parse(raw) as MappingFile;
  if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) {
    throw new Error("Mapping file must contain non-empty 'entries' array.");
  }
  return parsed;
}

function maxSeverity(items: Severity[]): Severity {
  if (items.includes("error")) return "error";
  if (items.includes("warn")) return "warn";
  return "info";
}

function main(): void {
  const mappingArg = parseArg("--mapping");
  const scopeArg = parseArg("--scope");
  const runId = `audit_${Date.now()}`;
  const mappingPath = mappingArg ? join(repoRoot, mappingArg) : defaultMappingPath;
  const scope = scopeArg ? scopeArg.split(",").map((s) => s.trim()).filter(Boolean) : defaultScope;
  const mapping = loadMapping(mappingPath);
  const files = Array.from(new Set(scope.flatMap((path) => listFilesRecursively(path))));

  const metricsByEntry: EntryMetrics[] = mapping.entries.map((entry) => ({
    from: entry.from,
    to: entry.to,
    severity: entry.severity ?? "error",
    oldCount: 0,
    newCount: 0,
    residualCount: 0,
    expectedCount: 0,
  }));
  const residualMatches: ResidualMatch[] = [];

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    mapping.entries.forEach((entry, index) => {
      const oldCount = countMatches(content, entry.from);
      const newCount = countMatches(content, entry.to);
      metricsByEntry[index]!.oldCount += oldCount;
      metricsByEntry[index]!.newCount += newCount;
      metricsByEntry[index]!.residualCount += oldCount;
      metricsByEntry[index]!.expectedCount += oldCount + newCount;
      if (oldCount > 0) {
        residualMatches.push(...collectResidualMatches(content, file, entry, 10));
      }
    });
  }

  const severities = residualMatches.map((match) => match.severity);
  const reportSeverity = severities.length > 0 ? maxSeverity(severities) : "info";
  const report = {
    runId,
    generatedAt: new Date().toISOString(),
    scope,
    mappingVersion: mapping.version ?? "1.0.0",
    mappingFile: relative(repoRoot, mappingPath).replace(/\\/g, "/"),
    filesScanned: files.length,
    metrics: metricsByEntry,
    totals: {
      residualCount: metricsByEntry.reduce((sum, item) => sum + item.residualCount, 0),
      replacedCount: metricsByEntry.reduce((sum, item) => sum + item.newCount, 0),
    },
    residualMatches,
    severity: reportSeverity as Severity,
    recommendations:
      reportSeverity === "error"
        ? ["Replace or whitelist all residual legacy terms before finalization."]
        : reportSeverity === "warn"
          ? ["Review warn-level residual matches and confirm intentional exceptions."]
          : ["No residual terms detected for mapped entries."],
  };

  mkdirSync(reportsDir, { recursive: true });
  const outputPath = join(reportsDir, `refactor-audit-${runId}.json`);
  writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`Refactor audit report: ${relative(repoRoot, outputPath).replace(/\\/g, "/")}`);
  console.log(`Files scanned: ${report.filesScanned}`);
  console.log(`Residual matches: ${report.totals.residualCount}`);
  console.log(`Severity: ${report.severity}`);

  if (report.severity === "error") {
    process.exit(1);
  }
}

main();
