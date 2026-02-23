import type { AppConfig, BuildResult } from '@ui8kit/sdk';

export async function buildProject(rawConfig: AppConfig, cwd = process.cwd()): Promise<BuildResult> {
  const outDir = rawConfig.outDir ?? `dist/${rawConfig.target}`;
  return {
    ok: false,
    generated: 0,
    outputDir: outDir,
    engine: rawConfig.target,
    errors: [
      'Template build pipeline was removed from @ui8kit/generator runtime. Use dedicated template pipeline instead.',
    ],
    warnings: [],
  };
}
