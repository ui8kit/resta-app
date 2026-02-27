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

export interface DataClassConflictCheckerConfig {
  scope: string[];
  pattern: string;
  ignoreDataClasses?: string[];
}

export interface ComponentTagCheckerConfig {
  scope: string[];
  pattern: string;
  tagMapPath?: string | null;
}

export interface ColorTokenCheckerConfig {
  scope: string[];
  pattern: string;
  tokenSource?: 'utility-props.map';
  utilityPropsMapPath: string;
}

export type GenLintRuleCode =
  | 'GEN001'
  | 'GEN002'
  | 'GEN003'
  | 'GEN004'
  | 'GEN005'
  | 'GEN006'
  | 'GEN007'
  | 'GEN008';

export type GenLintRulesConfig = Partial<Record<GenLintRuleCode, Severity>>;

export interface GenLintCheckerConfig {
  scope: string[];
  pattern: string;
  rules?: GenLintRulesConfig;
}

export interface LockedDirsCheckerConfig {
  dirs: string[];
  pattern: string;
}

export interface ViewHooksCheckerConfig {
  pattern: string;
  allowedHooks?: string[];
}

export interface UtilityPropLiteralsCheckerConfig {
  scope: string[];
  pattern: string;
  utilityPropsMapPath: string;
  /** When true, dynamic expressions inside DSL <Loop> are allowed (demoted to info instead of error). */
  allowDynamicInLoop?: boolean;
}

export interface OrphanFilesCheckerConfig {
  scope: string[];
  pattern: string;
  ignore?: string[];
  aliases?: Record<string, string>;
}

export interface BlockNestingCheckerConfig {
  scope: string[];
  pattern: string;
}

export interface KnownCheckerConfigs {
  refactorAudit?: RefactorAuditConfig;
  invariants?: InvariantsCheckerConfig;
  fixtures?: FixturesCheckerConfig;
  viewExports?: ViewExportsCheckerConfig;
  contracts?: ContractTestsCheckerConfig;
  clean?: CleanCheckerConfig;
  dataClassConflicts?: DataClassConflictCheckerConfig;
  componentTag?: ComponentTagCheckerConfig;
  colorTokens?: ColorTokenCheckerConfig;
  genLint?: GenLintCheckerConfig;
  lockedDirs?: LockedDirsCheckerConfig;
  viewHooks?: ViewHooksCheckerConfig;
  utilityPropLiterals?: UtilityPropLiteralsCheckerConfig;
  orphanFiles?: OrphanFilesCheckerConfig;
  blockNesting?: BlockNestingCheckerConfig;
}

export type MaintainCheckerConfigMap = Record<string, unknown> & KnownCheckerConfigs;

export interface IMaintainConfig {
  root: string;
  reportsDir?: string;
  continueOnError?: boolean;
  maxParallel?: number;
  checkers: MaintainCheckerConfigMap;
}
