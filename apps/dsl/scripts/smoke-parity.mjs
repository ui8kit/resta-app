import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");

// =============================================================================
// CONFIG — what to check (edit here, no hardcoding below)
// =============================================================================
const CONFIG = {
  repoRoot,
  packages: [
    {
      name: "cli",
      dir: resolve(repoRoot, "packages/cli"),
      buildCmd: ["bun", "run", "build"],
      type: "subcommands",
      entry: { src: "src/index.ts", dist: "dist/index.js" },
      cases: [
        { label: "scan-engine", args: ["scan", "--cwd", resolve(repoRoot, "apps/engine")] },
      ],
    },
    {
      name: "sdk",
      dir: resolve(repoRoot, "packages/sdk"),
      buildCmd: null,
      type: "binaries",
      cases: [
        {
          label: "validate-engine",
          binary: "validate",
          args: ["--cwd", resolve(repoRoot, "apps/engine")],
        },
        {
          label: "inspect-engine",
          binary: "inspect",
          args: ["--cwd", resolve(repoRoot, "apps/engine")],
        },
        {
          label: "generate-engine",
          binary: "generate",
          args: [
            "--cwd",
            resolve(repoRoot, "apps/engine"),
            "--target",
            "react",
          ],
        },
      ],
    },
  ],
};

// =============================================================================
// Runner
// =============================================================================
function run(cmd, args, cwd) {
  const nodeOptions = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} --max-old-space-size=4096`
    : "--max-old-space-size=4096";
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "pipe",
    encoding: "utf-8",
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
    },
  });
  return {
    cmd: `${cmd} ${args.join(" ")}`,
    code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function assertSuccess(result, title) {
  if (result.code !== 0) {
    console.error(`FAILED: ${title}`);
    console.error(`Command: ${result.cmd}`);
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(1);
  }
}

function assertEqual(a, b, title) {
  if (a !== b) {
    console.error(`FAILED: ${title}`);
    console.error(`Left: ${a}`);
    console.error(`Right: ${b}`);
    process.exit(1);
  }
}

for (const pkg of CONFIG.packages) {
  if (pkg.buildCmd) {
    const buildResult = run(pkg.buildCmd[0], pkg.buildCmd.slice(1), pkg.dir);
    assertSuccess(buildResult, `Build ${pkg.name}`);
  }

  for (const c of pkg.cases) {
    if (pkg.type === "subcommands") {
      const srcPath = resolve(pkg.dir, pkg.entry.src);
      const distPath = resolve(pkg.dir, pkg.entry.dist);
      const srcRun = run("bun", [srcPath, ...c.args], pkg.dir);
      const distRun = run("bun", [distPath, ...c.args], pkg.dir);
      assertEqual(srcRun.code, distRun.code, `Exit code parity for ${c.label}`);
      assertSuccess(srcRun, `Source ${pkg.name} run: ${c.label}`);
      assertSuccess(distRun, `Dist ${pkg.name} run: ${c.label}`);
    } else if (pkg.type === "binaries") {
      const binPath = resolve(pkg.dir, "src/cli", `${c.binary}.ts`);
      const runResult = run("bun", [binPath, ...c.args], pkg.dir);
      assertSuccess(runResult, `${pkg.name} ${c.label}`);
    }
  }
}

console.log("Smoke parity passed.");
