import type { IService, IServiceContext } from '../../core/interfaces';

/**
 * Input for UiKitMapService.execute()
 */
export interface UiKitMapServiceInput {
  /** Path to utility-props.map.ts */
  propsMapPath: string;
  /** Path to tw-css-extended.json */
  tailwindMapPath: string;
  /** Path to shadcn.map.json (design tokens) */
  shadcnMapPath: string;
  /** Path to grid.map.json (responsive grid classes) */
  gridMapPath: string;
  /** Output path for ui8kit.map.json */
  outputPath: string;
}

/**
 * Output from UiKitMapService.execute()
 */
export interface UiKitMapServiceOutput {
  /** Total number of classes in the generated map */
  totalClasses: number;
  /** Number of Tailwind classes */
  tailwindClasses: number;
  /** Number of Shadcn design token classes */
  shadcnClasses: number;
  /** Number of grid classes */
  gridClasses: number;
  /** Classes that couldn't be resolved (missing from all sources) */
  missingClasses: string[];
  /** Output file path */
  outputPath: string;
}

/**
 * File system interface for UiKitMapService
 */
export interface UiKitMapFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

/**
 * UiKitMapService options
 */
export interface UiKitMapServiceOptions {
  fileSystem?: UiKitMapFileSystem;
}

/**
 * UiKitMapService - Generates ui8kit.map.json from multiple sources.
 * 
 * This service:
 * 1. Parses utility-props.map.ts to get list of classes
 * 2. Resolves CSS values from tw-css-extended.json
 * 3. Adds design tokens from shadcn.map.json
 * 4. Adds grid classes from grid.map.json
 * 5. Outputs a unified ui8kit.map.json
 */
export class UiKitMapService implements IService<UiKitMapServiceInput, UiKitMapServiceOutput> {
  readonly name = 'uikit-map';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = [];
  
  private context!: IServiceContext;
  private fs: UiKitMapFileSystem;
  
  constructor(options: UiKitMapServiceOptions = {}) {
    this.fs = options.fileSystem ?? this.createDefaultFileSystem();
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
  }
  
  async execute(input: UiKitMapServiceInput): Promise<UiKitMapServiceOutput> {
    const {
      propsMapPath,
      tailwindMapPath,
      shadcnMapPath,
      gridMapPath,
      outputPath,
    } = input;
    
    this.context.logger.info('Building UI8Kit class map...');
    
    // Step 1: Parse utility-props.map.ts to get all class names
    const propsContent = await this.fs.readFile(propsMapPath);
    const propsMap = this.parsePropsMap(propsContent);
    const classNames = this.buildClassNames(propsMap);
    
    this.context.logger.debug(`Parsed ${classNames.length} class names from utility-props.map.ts`);
    
    // Step 2: Load Tailwind CSS map
    const tailwindContent = await this.fs.readFile(tailwindMapPath);
    const tailwindMap: Record<string, string> = JSON.parse(tailwindContent);
    
    this.context.logger.debug(`Loaded ${Object.keys(tailwindMap).length} Tailwind classes`);
    
    // Step 3: Load Shadcn design tokens
    const shadcnContent = await this.fs.readFile(shadcnMapPath);
    const shadcnMap: Record<string, string> = JSON.parse(shadcnContent);
    
    this.context.logger.debug(`Loaded ${Object.keys(shadcnMap).length} Shadcn design tokens`);
    
    // Step 4: Load grid classes
    const gridContent = await this.fs.readFile(gridMapPath);
    const gridMap: Record<string, string> = JSON.parse(gridContent);
    
    this.context.logger.debug(`Loaded ${Object.keys(gridMap).length} grid classes`);
    
    // Step 5: Build the unified map
    const uiKitMap: Record<string, string> = {};
    const missingClasses: string[] = [];
    let tailwindCount = 0;
    let shadcnCount = 0;
    
    for (const className of classNames) {
      // Priority: Shadcn > Tailwind (Shadcn overrides Tailwind for semantic colors)
      if (shadcnMap[className]) {
        uiKitMap[className] = shadcnMap[className];
        shadcnCount++;
      } else if (tailwindMap[className]) {
        uiKitMap[className] = tailwindMap[className];
        tailwindCount++;
      } else {
        missingClasses.push(className);
      }
    }
    
    // Step 6: Add all grid classes (they are responsive, always needed)
    for (const [className, cssValue] of Object.entries(gridMap)) {
      uiKitMap[className] = cssValue;
    }
    
    // Step 7: Sort keys alphabetically for consistent output
    const sortedMap: Record<string, string> = {};
    const sortedKeys = Object.keys(uiKitMap).sort();
    for (const key of sortedKeys) {
      sortedMap[key] = uiKitMap[key];
    }
    
    // Step 8: Write output
    const outputContent = JSON.stringify(sortedMap, null, 2) + '\n';
    await this.fs.writeFile(outputPath, outputContent);
    
    const result: UiKitMapServiceOutput = {
      totalClasses: Object.keys(sortedMap).length,
      tailwindClasses: tailwindCount,
      shadcnClasses: shadcnCount,
      gridClasses: Object.keys(gridMap).length,
      missingClasses,
      outputPath,
    };
    
    // Log results
    this.context.logger.info(`Generated ui8kit.map.json with ${result.totalClasses} classes`);
    this.context.logger.info(`  - Tailwind: ${result.tailwindClasses}`);
    this.context.logger.info(`  - Shadcn: ${result.shadcnClasses}`);
    this.context.logger.info(`  - Grid: ${result.gridClasses}`);
    
    if (missingClasses.length > 0) {
      this.context.logger.warn(`Missing ${missingClasses.length} classes:`);
      for (const cls of missingClasses.slice(0, 10)) {
        this.context.logger.warn(`  - ${cls}`);
      }
      if (missingClasses.length > 10) {
        this.context.logger.warn(`  ... and ${missingClasses.length - 10} more`);
      }
    }
    
    this.context.eventBus.emit('uikit-map:generated', {
      totalClasses: result.totalClasses,
      outputPath,
    });
    
    return result;
  }
  
  async dispose(): Promise<void> {
    // No cleanup needed
  }
  
  /**
   * Parse utility-props.map.ts and extract the utilityPropsMap object
   */
  private parsePropsMap(content: string): Record<string, string[]> {
    // Extract the object between { and } as const;
    const match = content.match(/export const utilityPropsMap = \{([\s\S]*?)\} as const;/);
    if (!match) {
      throw new Error('Could not parse utilityPropsMap from file');
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
   * Build class names from props map
   * Handles bare tokens (value="") -> just prop name
   */
  private buildClassNames(propsMap: Record<string, string[]>): string[] {
    const classNames: string[] = [];
    
    for (const [prop, values] of Object.entries(propsMap)) {
      for (const value of values) {
        if (value === '') {
          classNames.push(prop);
        } else {
          classNames.push(`${prop}-${value}`);
        }
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(classNames)].sort();
  }
  
  /**
   * Create default file system implementation
   */
  private createDefaultFileSystem(): UiKitMapFileSystem {
    return {
      readFile: async (path: string) => {
        const { readFile } = await import('node:fs/promises');
        return readFile(path, 'utf-8');
      },
      writeFile: async (path: string, content: string) => {
        const { writeFile, mkdir } = await import('node:fs/promises');
        const { dirname } = await import('node:path');
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, content, 'utf-8');
      },
      exists: async (path: string) => {
        const { access } = await import('node:fs/promises');
        try {
          await access(path);
          return true;
        } catch {
          return false;
        }
      },
    };
  }
}
