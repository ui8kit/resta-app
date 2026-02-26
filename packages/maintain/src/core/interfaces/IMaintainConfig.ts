export type Severity = 'error' | 'warn' | 'info';

export interface RefactorAuditConfig {
  mapping: string;
  scope: string[];
  maxMatchesPerEntry?: number;
}

export interface InvariantsCheckerConfig {
  routes: {
    appFile: string;
    required: string[];
  };
  fixtures: {
    pageFile: string;
    requiredPageDomains: string[];
  };
  blocks: {
    dir: string;
    indexFile: string;
    recursive?: boolean;
  };
  context: {
    file: string;
    requiredSymbols?: string[];
    fixtureImportPattern?: string;
  };
}

export interface FixturesTargetConfig {
  file: string;
  schema: string;
}

export interface FixturesCheckerConfig {
  targets: FixturesTargetConfig[];
}

export type ViewExportShape = 'interface+function';

export interface ViewExportsCheckerConfig {
  pattern: string;
  exportShape: ViewExportShape;
}

export interface ContractTestsCheckerConfig {
  blueprint: string;
  appFile?: string;
  /**
   * When true (default), entity types must be inline objects or interfaces so required fields can be validated.
   * When false, type aliases (e.g. `export type Page = DesignSectionItem`) are accepted; required-fields check is skipped.
   * The strict shape requirement (interface or inline type) applies only to View components (*View.tsx) via viewExports checker.
   */
  entityTypeRequireInlineBody?: boolean;
}

export type CleanMode = 'full' | 'dist';

export interface CleanCheckerConfig {
  /** Paths to clean (relative to app root). Used when pathsByMode doesn't define the mode. */
  paths: string[];
  /** Optional paths per mode. full = full cleanup (node_modules, outDir, etc.). dist = generated output only. */
  pathsByMode?: Partial<Record<CleanMode, string[]>>;
  includeTsBuildInfo?: boolean;
}

export interface IMaintainConfig {
  root: string;
  reportsDir?: string;
  continueOnError?: boolean;
  maxParallel?: number;
  checkers: {
    refactorAudit?: RefactorAuditConfig;
    invariants?: InvariantsCheckerConfig;
    fixtures?: FixturesCheckerConfig;
    viewExports?: ViewExportsCheckerConfig;
    contracts?: ContractTestsCheckerConfig;
    clean?: CleanCheckerConfig;
  };
}
