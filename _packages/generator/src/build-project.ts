import type { AppConfig, BuildResult } from '@ui8kit/sdk';

async function debugLog(runId: string, hypothesisId: string, location: string, message: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch('http://127.0.0.1:7618/ingest/1a743e9b-8a63-4e35-95d4-015cb5a878d0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '4cbe3d',
      },
      body: JSON.stringify({
        sessionId: '4cbe3d',
        runId,
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    });
  } catch {
    // ignore logging transport failures
  }
}

export async function buildProject(rawConfig: AppConfig, cwd = process.cwd()): Promise<BuildResult> {
  const outDir = rawConfig.outDir ?? `dist/${rawConfig.target}`;
  // #region agent log
  await debugLog('pre-fix', 'H1', 'src/build-project.ts:28', 'buildProject stub path invoked', {
    cwd,
    target: rawConfig.target,
    outDir,
  });
  // #endregion
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
