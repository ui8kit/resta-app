import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import ts from "typescript";

export interface EmitVariantsApplyCssOptions {
  /**
   * Absolute path to variants directory (e.g. ./src/variants resolved to absolute)
   */
  variantsDir: string;
}

type Tokens = string[];

type Entity = {
  baseTokens: Tokens;
  rules: Map<string, Tokens>; // selector -> tokens
};

export interface VariantsArtifacts {
  /**
   * CSS content for variants.apply.css
   */
  css: string;
  /**
   * All semantic selectors (including base entities, e.g. "button", and per-variant selectors, e.g. "button-primary").
   * Sorted for deterministic output.
   */
  selectors: string[];
  /**
   * Optional: selector -> token list (stable-deduped). Useful for diagnostics/debugging.
   */
  selectorToTokens?: Record<string, string[]>;
}

/**
 * Convert camelCase/PascalCase to kebab-case
 */
function kebabCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

/**
 * Split a class string into individual tokens
 */
function splitTokens(s: string): string[] {
  return s
    .trim()
    .split(/\s+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Stable deduplication preserving first occurrence order
 */
function stableDedupe(tokens: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function createEntity(): Entity {
  return { baseTokens: [], rules: new Map<string, Tokens>() };
}

/**
 * Extract string literal value from AST node
 */
function getStringLiteral(node: ts.Expression | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

/**
 * Get property from object literal by name
 */
function getObjectProperty(obj: ts.ObjectLiteralExpression, name: string): ts.ObjectLiteralElementLike | undefined {
  return obj.properties.find((p) => {
    if (!ts.isPropertyAssignment(p)) return false;
    const key = p.name;
    if (ts.isIdentifier(key)) return key.text === name;
    if (ts.isStringLiteral(key)) return key.text === name;
    return false;
  });
}

/**
 * Check if expression is a cva() call
 */
function isCvaCall(expr: ts.Expression): expr is ts.CallExpression {
  if (!ts.isCallExpression(expr)) return false;
  // cva(...) or something.cva(...)
  if (ts.isIdentifier(expr.expression)) return expr.expression.text === "cva";
  if (ts.isPropertyAccessExpression(expr.expression)) return expr.expression.name.text === "cva";
  return false;
}

/**
 * Get property key name from AST node
 */
function getPropertyKeyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name)) return name.text;
  if (ts.isNumericLiteral(name)) return name.text;
  return undefined;
}

/**
 * Derive entity name from file prefix and export name.
 * 
 * Examples:
 * - button.ts, buttonStyleVariants -> button
 * - button.ts, buttonSizeVariants -> button
 * - card.ts, cardHeaderVariants -> card-header
 * - card.ts, cardVariantVariants -> card
 */
function deriveEntityName(filePrefix: string, exportName: string): string {
  // Remove "Variants" suffix
  let name = exportName.replace(/Variants$/i, "");
  
  // If name starts with file prefix, extract the rest
  const prefixLower = filePrefix.toLowerCase();
  const nameLower = name.toLowerCase();
  
  if (nameLower.startsWith(prefixLower)) {
    const rest = name.slice(filePrefix.length);
    // Common aggregator suffixes that collapse to base entity
    const aggregators = ["style", "size", "base", "variant", "color", "state"];
    if (!rest || aggregators.includes(rest.toLowerCase())) {
      return filePrefix;
    }
    // Otherwise it's a sub-entity: cardHeader -> card-header
    return `${filePrefix}-${kebabCase(rest)}`;
  }
  
  // Fallback: just kebab-case the whole name
  return kebabCase(name);
}

/**
 * Parse a single cva() call and extract base tokens + variant rules
 */
function parseCvaCall(
  call: ts.CallExpression,
  entityName: string,
  entity: Entity
): void {
  // Base tokens (first argument)
  const baseArg = call.arguments[0];
  const baseString = getStringLiteral(baseArg) ?? "";
  entity.baseTokens.push(...splitTokens(baseString));

  // Options object (second argument)
  const optsArg = call.arguments[1];
  if (!optsArg || !ts.isObjectLiteralExpression(optsArg)) return;

  // Get variants and defaultVariants
  const variantsProp = getObjectProperty(optsArg, "variants");
  const defaultVariantsProp = getObjectProperty(optsArg, "defaultVariants");

  // Parse defaultVariants: { variant: "primary", size: "default" }
  const defaultVariants: Record<string, string> = {};
  if (
    defaultVariantsProp &&
    ts.isPropertyAssignment(defaultVariantsProp) &&
    ts.isObjectLiteralExpression(defaultVariantsProp.initializer)
  ) {
    for (const p of defaultVariantsProp.initializer.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const k = getPropertyKeyName(p.name);
      const v = getStringLiteral(p.initializer);
      if (k && v) defaultVariants[k] = v;
    }
  }

  // Parse variants: { variant: { primary: "...", secondary: "..." }, size: { sm: "...", lg: "..." } }
  if (
    !variantsProp ||
    !ts.isPropertyAssignment(variantsProp) ||
    !ts.isObjectLiteralExpression(variantsProp.initializer)
  ) {
    return;
  }

  for (const variantGroup of variantsProp.initializer.properties) {
    if (!ts.isPropertyAssignment(variantGroup)) continue;
    
    const variantKey = getPropertyKeyName(variantGroup.name);
    if (!variantKey) continue;
    if (!ts.isObjectLiteralExpression(variantGroup.initializer)) continue;

    for (const valueEntry of variantGroup.initializer.properties) {
      if (!ts.isPropertyAssignment(valueEntry)) continue;
      
      const valueKey = getPropertyKeyName(valueEntry.name);
      if (!valueKey) continue;

      const classString = getStringLiteral(valueEntry.initializer) ?? "";
      const valueTokens = splitTokens(classString);

      // Check if this is the default variant value
      const isDefault = defaultVariants[variantKey] === valueKey || 
                        (!defaultVariants[variantKey] && valueKey === "default");

      if (isDefault) {
        // Default variant tokens go into base entity
        entity.baseTokens.push(...valueTokens);
        continue;
      }

      if (valueTokens.length === 0) continue;

      // Generate selector: entity-valueKey (e.g., button-primary, button-lg)
      const selector = `${entityName}-${valueKey}`;

      const existing = entity.rules.get(selector) ?? [];
      existing.push(...valueTokens);
      entity.rules.set(selector, existing);
    }
  }
}

/**
 * Parse a single variant file and extract all cva() declarations
 */
async function parseVariantFile(
  filePath: string,
  filePrefix: string,
  entities: Map<string, Entity>
): Promise<void> {
  const code = await readFile(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    
    // Only process exported declarations
    const isExported = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;

    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      
      const exportName = decl.name.text;
      const init = decl.initializer;
      
      if (!init || !isCvaCall(init)) continue;

      // Derive entity name from file prefix and export name
      const entityName = deriveEntityName(filePrefix, exportName);
      
      // Get or create entity
      const entity = entities.get(entityName) ?? createEntity();
      entities.set(entityName, entity);

      // Parse the cva() call
      parseCvaCall(init, entityName, entity);
    }
  }
}

/**
 * Main entry point: emit variants.apply.css content
 */
export async function emitVariantsApplyCss(options: EmitVariantsApplyCssOptions): Promise<string> {
  const { css } = await emitVariantsArtifacts(options);
  return css;
}

/**
 * Full artifacts: CSS + selectors list + token mapping
 */
export async function emitVariantsArtifacts(options: EmitVariantsApplyCssOptions): Promise<VariantsArtifacts> {
  const { variantsDir } = options;

  // Find all .ts files except index.ts
  const entries = await readdir(variantsDir);
  const variantFiles = entries
    .filter((f) => f.toLowerCase().endsWith(".ts"))
    .filter((f) => f.toLowerCase() !== "index.ts")
    .sort();

  const entities = new Map<string, Entity>();

  // Parse each variant file
  for (const fileName of variantFiles) {
    const absPath = join(variantsDir, fileName);
    const filePrefix = basename(fileName).replace(/\.ts$/i, "");
    
    await parseVariantFile(absPath, filePrefix, entities);
  }

  // Build CSS output
  const cssRules: string[] = [];
  const entityNames = Array.from(entities.keys()).sort();
  const selectorsOut: string[] = [];
  const selectorToTokens: Record<string, string[]> = {};

  for (const entityName of entityNames) {
    const entity = entities.get(entityName)!;
    
    // Base entity selector
    const baseTokens = stableDedupe(entity.baseTokens);
    if (baseTokens.length) {
      cssRules.push(`.${entityName} {\n  @apply ${baseTokens.join(" ")};\n}`);
      selectorsOut.push(entityName);
      selectorToTokens[entityName] = baseTokens;
    }

    // Variant selectors
    const selectors = Array.from(entity.rules.keys()).sort();
    for (const sel of selectors) {
      const tokens = stableDedupe(entity.rules.get(sel)!);
      if (!tokens.length) continue;
      cssRules.push(`.${sel} {\n  @apply ${tokens.join(" ")};\n}`);
      selectorsOut.push(sel);
      selectorToTokens[sel] = tokens;
    }
  }

  const header = `/*
 * Generated by @ui8kit/generator - variants.apply.css
 * Do not edit manually - this file is auto-generated
 * Generated on: ${new Date().toISOString()}
 */

`;

  const css = header + cssRules.join("\n\n") + "\n";
  const selectors = Array.from(new Set(selectorsOut)).sort();

  return {
    css,
    selectors,
    selectorToTokens,
  };
}