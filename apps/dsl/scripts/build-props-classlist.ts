#!/usr/bin/env bun
/**
 * Build a list of all CSS classes generated from utility-props.map.ts
 * 
 * Outputs JSON array of class names to ui8kit.list.props.json
 * 
 * Usage:
 *   bun run scripts/build-props-classlist.ts
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");

// Paths
const PROPS_MAP_PATH = resolve(ROOT, "src/lib/utility-props.map.ts");
const OUTPUT_PATH = resolve(ROOT, "src/lib/ui8kit.list.props.json");

/**
 * Parse utility-props.map.ts and extract the utilityPropsMap object
 */
function parsePropsMap(content: string): Record<string, string[]> {
  // Extract the object between { and } as const;
  const match = content.match(/export const utilityPropsMap = \{([\s\S]*?)\} as const;/);
  if (!match) {
    throw new Error("Could not parse utilityPropsMap from file");
  }
  
  const objectContent = match[1];
  
  // Parse each prop and its values
  const propsMap: Record<string, string[]> = {};
  
  // Match pattern: "propName": ["value1", "value2", ...]
  const propRegex = /"([^"]+)":\s*\[([\s\S]*?)\]/g;
  let propMatch;
  
  while ((propMatch = propRegex.exec(objectContent)) !== null) {
    const propName = propMatch[1];
    const valuesContent = propMatch[2];
    
    // Extract values from the array
    const values: string[] = [];
    const valueRegex = /"([^"]*)"/g;
    let valueMatch;
    
    while ((valueMatch = valueRegex.exec(valuesContent)) !== null) {
      values.push(valueMatch[1]);
    }
    
    propsMap[propName] = values;
  }
  
  return propsMap;
}

/**
 * Build class name from prop and value
 * Handles bare tokens (value="") -> just prop name
 */
function buildClassName(prop: string, value: string): string {
  if (value === "") {
    return prop;
  }
  return `${prop}-${value}`;
}

function main() {
  console.log("Building props class list from src/lib/utility-props.map.ts...\n");

  if (!existsSync(PROPS_MAP_PATH)) {
    console.error(`Error: utility-props.map.ts not found at ${PROPS_MAP_PATH}`);
    process.exit(1);
  }

  // Load and parse props map
  const content = readFileSync(PROPS_MAP_PATH, "utf-8");
  const propsMap = parsePropsMap(content);
  
  // Build list of all class names
  const classNames: string[] = [];
  
  for (const [prop, values] of Object.entries(propsMap)) {
    for (const value of values) {
      const className = buildClassName(prop, value);
      classNames.push(className);
    }
  }
  
  // Sort alphabetically and remove duplicates
  const uniqueClassNames = [...new Set(classNames)].sort();
  
  // Write output
  writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueClassNames, null, 2) + "\n");
  
  console.log(`✅ Generated ${uniqueClassNames.length} class names`);
  console.log(`📁 Output: ${OUTPUT_PATH}`);
  
  // Show first 10 as preview
  console.log("\nPreview (first 10):");
  uniqueClassNames.slice(0, 10).forEach(c => console.log(`  "${c}"`));
  console.log("  ...");
}

main();
