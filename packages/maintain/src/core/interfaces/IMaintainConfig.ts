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
}

export interface CleanCheckerConfig {
  paths: string[];
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
