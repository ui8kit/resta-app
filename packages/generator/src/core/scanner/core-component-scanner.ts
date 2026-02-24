/**
 * Core Component Scanner
 *
 * Auto-detects exportable components from @ui8kit/core
 * Provides safety check: fail loudly if unknown PascalCase component is encountered.
 */

/**
 * Scan @ui8kit/core package and extract all exported component names.
 *
 * This is used to populate the passthroughComponents list automatically,
 * so developers don't need to manually update it when adding components.
 *
 * @example
 * ```ts
 * const components = await getCoreComponentNames();
 * // => ['Block', 'Container', 'Stack', 'Grid', ...]
 * ```
 */
export async function getCoreComponentNames(): Promise<string[]> {
  try {
    // Dynamic import of @ui8kit/core to get exports
    const coreModule = await import('@ui8kit/core');
    
    const componentNames: string[] = [];
    
    for (const [exportName, value] of Object.entries(coreModule)) {
      // Skip non-component exports (types end with "Props", functions, etc.)
      if (exportName.endsWith('Props') || exportName.endsWith('Props[]')) {
        continue;
      }
      
      // Skip non-component values (constants, functions that aren't React components)
      if (value === null || value === undefined) {
        continue;
      }
      
      // Check if this looks like a React component (PascalCase + function/component)
      if (typeof value === 'function' && /^[A-Z][a-zA-Z0-9]*$/.test(exportName)) {
        componentNames.push(exportName);
      }
    }
    
    return componentNames.sort();
  } catch (error) {
    console.warn(
      '@ui8kit/core not available or failed to import. Falling back to manual list.',
      error instanceof Error ? error.message : String(error)
    );
    return getFallbackCoreComponents();
  }
}

/**
 * Get fallback list of known core components.
 * Use this when dynamic import fails or during build time.
 */
export function getFallbackCoreComponents(): string[] {
  return [
    // Layout
    'Block', 'Container', 'Stack', 'Group', 'Box',
    // Typography
    'Title', 'Text',
    // Interactive
    'Button', 'Badge',
    // Media
    'Image', 'Icon',
    // Composite
    'Grid', 'Card', 'CardHeader', 'CardTitle', 'CardDescription',
    'CardContent', 'CardFooter', 'Sheet',
    'Accordion', 'AccordionItem', 'AccordionTrigger', 'AccordionContent',
  ];
}

/**
 * Validate that a PascalCase component name is a known core component.
 * Useful for fail-fast detection when components are misclassified as includes.
 *
 * @example
 * ```ts
 * const knownComponents = getFallbackCoreComponents();
 * if (!isKnownCoreComponent('Block', knownComponents)) {
 *   console.warn('Unknown component: Block (should add to passthrough list?)');
 * }
 * ```
 */
export function isKnownCoreComponent(
  tagName: string,
  knownComponents: string[] = getFallbackCoreComponents()
): boolean {
  return knownComponents.includes(tagName);
}

/**
 * Get list of PascalCase tags that are NOT known core components.
 * Use for warnings during generation.
 */
export function findUnknownComponents(
  tags: string[],
  knownComponents: string[] = getFallbackCoreComponents()
): string[] {
  const pascalCaseRegex = /^[A-Z]/;
  
  return tags.filter(
    tag => pascalCaseRegex.test(tag) && !knownComponents.includes(tag)
  );
}
