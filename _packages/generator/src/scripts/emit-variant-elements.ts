import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import ts from "typescript";

export interface EmitVariantElementsOptions {
  /**
   * Absolute path to variants directory (e.g. ./src/variants resolved to absolute)
   */
  variantsDir: string;
  /**
   * Output directory for generated elements (e.g. ./src/elements resolved to absolute)
   */
  outputDir: string;
  /**
   * Import path for components (e.g. "../components")
   */
  componentsImportPath?: string;
}

interface VariantValue {
  variantKey: string;  // e.g. "variant", "size"
  valueKey: string;    // e.g. "primary", "lg"
  tokens: string[];    // e.g. ["bg-primary", "text-primary-foreground"]
  isDefault: boolean;
}

interface ParsedEntity {
  name: string;           // e.g. "button", "badge"
  componentName: string;  // e.g. "Button", "Badge"
  baseTokens: string[];
  variants: VariantValue[];
}

/**
 * Convert kebab-case or camelCase to PascalCase
 */
function toPascalCase(input: string): string {
  return input
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
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
  if (ts.isIdentifier(expr.expression)) return expr.expression.text === "cva";
  if (ts.isPropertyAccessExpression(expr.expression)) return expr.expression.name.text === "cva";
  return false;
}

/**
 * Get property key name from AST node.
 * Handles identifiers, string literals (including those with hyphens like "top-left"),
 * and numeric literals.
 */
function getPropertyKeyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name)) return name.text;
  // String literals are used for keys with hyphens or special characters (e.g., "top-left", "bottom-right")
  if (ts.isStringLiteral(name)) return name.text;
  if (ts.isNumericLiteral(name)) return name.text;
  return undefined;
}

/**
 * Derive entity name from file prefix and export name
 */
function deriveEntityName(filePrefix: string, exportName: string): string {
  let name = exportName.replace(/Variants$/i, "");
  const prefixLower = filePrefix.toLowerCase();
  const nameLower = name.toLowerCase();

  if (nameLower.startsWith(prefixLower)) {
    const rest = name.slice(filePrefix.length);
    const aggregators = ["style", "size", "base", "variant", "color", "state"];
    if (!rest || aggregators.includes(rest.toLowerCase())) {
      return filePrefix;
    }
    return `${filePrefix}-${kebabCase(rest)}`;
  }

  return kebabCase(name);
}

/**
 * Extract variant key from export name (e.g., buttonSizeVariants -> "size")
 */
function extractVariantKeyFromExport(filePrefix: string, exportName: string): string | undefined {
  const name = exportName.replace(/Variants$/i, "");
  const prefixLower = filePrefix.toLowerCase();
  const nameLower = name.toLowerCase();

  if (nameLower.startsWith(prefixLower)) {
    const rest = name.slice(filePrefix.length);
    if (rest) {
      return rest.charAt(0).toLowerCase() + rest.slice(1);
    }
  }
  return undefined;
}

/**
 * Parse a single cva() call and extract variant info
 */
function parseCvaCall(
  call: ts.CallExpression,
  filePrefix: string,
  exportName: string
): { entityName: string; baseTokens: string[]; variants: VariantValue[] } {
  const entityName = deriveEntityName(filePrefix, exportName);
  const baseTokens: string[] = [];
  const variants: VariantValue[] = [];

  // Base tokens (first argument)
  const baseArg = call.arguments[0];
  const baseString = getStringLiteral(baseArg) ?? "";
  baseTokens.push(...splitTokens(baseString));

  // Options object (second argument)
  const optsArg = call.arguments[1];
  if (!optsArg || !ts.isObjectLiteralExpression(optsArg)) {
    return { entityName, baseTokens, variants };
  }

  // Get variants and defaultVariants
  const variantsProp = getObjectProperty(optsArg, "variants");
  const defaultVariantsProp = getObjectProperty(optsArg, "defaultVariants");

  // Parse defaultVariants
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

  // Parse variants
  if (
    !variantsProp ||
    !ts.isPropertyAssignment(variantsProp) ||
    !ts.isObjectLiteralExpression(variantsProp.initializer)
  ) {
    return { entityName, baseTokens, variants };
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

      const isDefault =
        defaultVariants[variantKey] === valueKey ||
        (!defaultVariants[variantKey] && valueKey === "default");

      variants.push({
        variantKey,
        valueKey,
        tokens: valueTokens,
        isDefault,
      });
    }
  }

  return { entityName, baseTokens, variants };
}

/**
 * Parse a single variant file
 */
async function parseVariantFile(filePath: string, filePrefix: string): Promise<ParsedEntity[]> {
  const code = await readFile(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const entitiesMap = new Map<string, ParsedEntity>();

  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;

    const isExported = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;

    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;

      const exportName = decl.name.text;
      const init = decl.initializer;

      if (!init || !isCvaCall(init)) continue;

      const { entityName, baseTokens, variants } = parseCvaCall(init, filePrefix, exportName);

      // Get or create entity
      let entity = entitiesMap.get(entityName);
      if (!entity) {
        entity = {
          name: entityName,
          componentName: toPascalCase(entityName.split("-")[0]), // Base component name
          baseTokens: [],
          variants: [],
        };
        entitiesMap.set(entityName, entity);
      }

      entity.baseTokens.push(...baseTokens);
      entity.variants.push(...variants);
    }
  }

  return Array.from(entitiesMap.values());
}

/**
 * Represents a sub-entity element (e.g., card-header -> CardHeader)
 */
interface SubEntityElement {
  entityName: string;      // e.g., "card-header"
  componentName: string;   // e.g., "CardHeader"
  displayName: string;     // e.g., "Card Header"
}

/**
 * Known sub-components that are actually separate components (not just variant groups)
 * Only these will be imported as separate components
 */
const KNOWN_SUB_COMPONENTS: Record<string, string[]> = {
  card: ['header', 'title', 'description', 'content', 'footer'],
  accordion: ['item', 'trigger', 'content'],
};

/**
 * Generate element file content for a component
 */
function generateElementFile(
  filePrefix: string,
  entities: ParsedEntity[],
  componentsImportPath: string
): string {
  const componentName = toPascalCase(filePrefix);

  // Collect all non-default variants from base entity
  const allVariants: Array<{
    entityName: string;
    selector: string;
    variantKey: string;
    valueKey: string;
    displayName: string;
  }> = [];

  // Collect sub-entities (only those that are actual components, not variant groups)
  const subEntities: SubEntityElement[] = [];
  const knownSubComponents = KNOWN_SUB_COMPONENTS[filePrefix] || [];

  for (const entity of entities) {
    // Check if this is a sub-entity (not the base entity)
    if (entity.name !== filePrefix && entity.name.startsWith(`${filePrefix}-`)) {
      const subEntitySuffix = entity.name.slice(filePrefix.length + 1); // e.g., "header" from "card-header"
      
      // Only treat as sub-entity if it's a known sub-component
      if (knownSubComponents.includes(subEntitySuffix.toLowerCase())) {
        const subComponentName = `${componentName}${toPascalCase(subEntitySuffix)}`; // e.g., "CardHeader"
        const displayName = `${componentName} ${toPascalCase(subEntitySuffix)}`; // e.g., "Card Header"

        subEntities.push({
          entityName: entity.name,
          componentName: subComponentName,
          displayName,
        });
      }
    }

    // Collect variants (for both base and variant-group entities)
    for (const v of entity.variants) {
      if (v.isDefault) continue;
      if (v.tokens.length === 0) continue;

      // Use base component name for variant selectors, not sub-entity name
      const selector = `${filePrefix}-${v.variantKey}-${v.valueKey}`;
      const displayName = `${componentName}${toPascalCase(v.variantKey)} ${toPascalCase(v.valueKey)}`;

      allVariants.push({
        entityName: filePrefix, // Always use base entity for variants
        selector,
        variantKey: v.variantKey,
        valueKey: v.valueKey,
        displayName,
      });
    }
  }

  // Sort for deterministic output
  allVariants.sort((a, b) => a.selector.localeCompare(b.selector));
  subEntities.sort((a, b) => a.entityName.localeCompare(b.entityName));

  // Generate JSX elements
  const elements: string[] = [];

  // Base element
  elements.push(`  {/* Base */}`);
  elements.push(`  <${componentName} data-class="${filePrefix}">${componentName}</${componentName}>`);

  // Variant elements (for base entity)
  if (allVariants.length > 0) {
    elements.push(`  {/* Variants */}`);
    for (const v of allVariants) {
      elements.push(`  <${componentName} data-class="${v.selector}" ${v.variantKey}="${v.valueKey}">${v.displayName}</${componentName}>`);
    }
  }

  // Sub-entity elements (e.g., CardHeader, CardTitle)
  if (subEntities.length > 0) {
    elements.push(`  {/* Sub-components */}`);
    for (const sub of subEntities) {
      elements.push(`  <${sub.componentName} data-class="${sub.entityName}">${sub.displayName}</${sub.componentName}>`);
    }
  }

  // Build imports - include base component and all sub-components
  const allComponents = [componentName, ...subEntities.map((s) => s.componentName)];
  const imports = `import { ${allComponents.join(", ")} } from "${componentsImportPath}";`;
  // const typeImports = generateTypeImports(componentName, subEntities, componentsImportPath);

  const content = `/**
 * Generated by @ui8kit/generator - variant elements
 * Do not edit manually - this file is auto-generated
 */

import type { ReactNode, ComponentProps } from "react";
${imports}

/**
 * ${componentName} variant elements for documentation and reuse.
 * Each element has a single variant with corresponding data-class attribute.
 */
export function ${componentName}Elements() {
  return (
    <>
${elements.join("\n")}
    </>
  );
}

/**
 * Reusable ${filePrefix} element components.
 * Accept children and props for composition.
 */
${generateReusableComponents(filePrefix, componentName, allVariants, subEntities)}
`;

  return content;
}

/**
 * Generate type imports for component props
 * NOTE: Currently commented out as types are not used in generated elements
 */
// function generateTypeImports(
//   componentName: string,
//   subEntities: SubEntityElement[],
//   componentsImportPath: string
// ): string {
//   // Import prop types from components
//   const propTypes = [`${componentName}Props`];
//   for (const sub of subEntities) {
//     propTypes.push(`${sub.componentName}Props`);
//   }
//   return `import type { ${propTypes.join(", ")} } from "${componentsImportPath}";`;
// }

/**
 * Generate reusable component wrappers that accept children and props
 */
function generateReusableComponents(
  filePrefix: string,
  componentName: string,
  allVariants: Array<{
    selector: string;
    variantKey: string;
    valueKey: string;
    displayName: string;
  }>,
  subEntities: SubEntityElement[]
): string {
  const exports: string[] = [];

  // Base reusable component
  exports.push(`/** Base ${componentName} with semantic data-class */
export const ${componentName}Element = ({ children, ...props }: Omit<ComponentProps<typeof ${componentName}>, "data-class"> & { children?: ReactNode }) => (
  <${componentName} data-class="${filePrefix}" {...props}>{children ?? "${componentName}"}</${componentName}>
);`);

  // Variant reusable components
  for (const v of allVariants) {
    const exportName = `${componentName}${toPascalCase(v.valueKey)}`;
    exports.push(`/** ${componentName} with ${v.valueKey} variant */
export const ${exportName} = ({ children, ...props }: Omit<ComponentProps<typeof ${componentName}>, "data-class" | "${v.variantKey}"> & { children?: ReactNode }) => (
  <${componentName} data-class="${v.selector}" ${v.variantKey}="${v.valueKey}" {...props}>{children ?? "${v.displayName}"}</${componentName}>
);`);
  }

  // Sub-entity reusable components (e.g., CardHeaderElement, CardTitleElement)
  for (const sub of subEntities) {
    const exportName = `${sub.componentName}Element`;
    exports.push(`/** ${sub.displayName} with semantic data-class */
export const ${exportName} = ({ children, ...props }: Omit<ComponentProps<typeof ${sub.componentName}>, "data-class"> & { children?: ReactNode }) => (
  <${sub.componentName} data-class="${sub.entityName}" {...props}>{children ?? "${sub.displayName}"}</${sub.componentName}>
);`);
  }

  return exports.join("\n\n");
}

/**
 * Generate index file that re-exports all element files
 */
function generateIndexFile(fileNames: string[]): string {
  const exports = fileNames
    .map((f) => `export * from "./${f.replace(/\.tsx$/, "")}";`)
    .sort()
    .join("\n");

  return `/**
 * Generated by @ui8kit/generator - elements index
 * Do not edit manually - this file is auto-generated
 */

${exports}
`;
}

export interface EmitVariantElementsResult {
  /**
   * Map of file name -> file content
   */
  files: Map<string, string>;
}

/**
 * Main entry point: emit variant element files
 */
export async function emitVariantElements(
  options: EmitVariantElementsOptions
): Promise<EmitVariantElementsResult> {
  const { variantsDir, componentsImportPath = "../components" } = options;

  // Find all .ts files except index.ts
  const entries = await readdir(variantsDir);
  const variantFiles = entries
    .filter((f) => f.toLowerCase().endsWith(".ts"))
    .filter((f) => f.toLowerCase() !== "index.ts")
    .sort();

  const files = new Map<string, string>();
  const generatedFileNames: string[] = [];

  for (const fileName of variantFiles) {
    const absPath = join(variantsDir, fileName);
    const filePrefix = basename(fileName).replace(/\.ts$/i, "");

    const entities = await parseVariantFile(absPath, filePrefix);

    if (entities.length === 0) continue;

    const outputFileName = `${filePrefix}.tsx`;
    const content = generateElementFile(filePrefix, entities, componentsImportPath);

    files.set(outputFileName, content);
    generatedFileNames.push(outputFileName);
  }

  // Generate index file
  if (generatedFileNames.length > 0) {
    files.set("index.ts", generateIndexFile(generatedFileNames));
  }

  return { files };
}