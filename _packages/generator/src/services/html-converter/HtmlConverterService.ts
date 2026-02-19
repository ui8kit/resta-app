import type { IService, IServiceContext } from '../../core/interfaces';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Input for HtmlConverterService.execute()
 */
export interface HtmlConverterInput {
  /** Path to HTML/Liquid file to process */
  htmlPath: string;
  /** Selectors to ignore during extraction */
  ignoreSelectors?: Array<string | RegExp>;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Output from HtmlConverterService.execute()
 */
export interface HtmlConverterOutput {
  /** Generated @apply CSS */
  applyCss: string;
  /** Generated pure CSS3 */
  pureCss: string;
  /** Number of elements processed */
  elementsCount: number;
  /** Number of unique selectors */
  selectorsCount: number;
}

/**
 * File system interface for HtmlConverterService
 */
export interface HtmlConverterFileSystem {
  readFile(path: string): Promise<string>;
}

/**
 * Element data extracted from HTML
 */
interface ElementData {
  selector: string;
  classes: string[];
  sourceFile: string;
}

/**
 * HtmlConverterService options
 */
export interface HtmlConverterServiceOptions {
  /** File system implementation (for testing) */
  fileSystem?: HtmlConverterFileSystem;
}

/**
 * HtmlConverterService - Converts HTML to CSS using class mappings.
 * 
 * Responsibilities:
 * - Load and cache class mappings (ui8kit, shadcn)
 * - Extract elements with classes from HTML
 * - Generate @apply CSS for Tailwind
 * - Generate pure CSS3 with resolved properties
 * - Merge duplicate selectors for optimization
 */
export class HtmlConverterService implements IService<HtmlConverterInput, HtmlConverterOutput> {
  readonly name = 'html-converter';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = [];
  
  private context!: IServiceContext;
  private fs: HtmlConverterFileSystem;
  
  // Cached maps (loaded once in initialize)
  private ui8kitMap: Map<string, string> = new Map();
  private shadcnMap: Map<string, string> = new Map();
  
  constructor(options: HtmlConverterServiceOptions = {}) {
    this.fs = options.fileSystem ?? this.createDefaultFileSystem();
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
    
    // Load maps from config
    const mappings = (context.config as any)?.mappings;
    
    if (mappings?.ui8kitMap) {
      await this.loadUi8kitMap(mappings.ui8kitMap);
    } else {
      // Try default location
      await this.loadUi8kitMap();
    }
    
    if (mappings?.shadcnMap) {
      await this.loadShadcnMap(mappings.shadcnMap);
    } else {
      // Try built-in map
      await this.loadShadcnMap();
    }
    
    this.context.logger.debug(`Loaded ${this.ui8kitMap.size} ui8kit classes, ${this.shadcnMap.size} shadcn classes`);
  }
  
  async execute(input: HtmlConverterInput): Promise<HtmlConverterOutput> {
    const { htmlPath, ignoreSelectors = [], verbose = false } = input;
    
    if (verbose) {
      this.context.logger.info(`Converting HTML to CSS: ${htmlPath}`);
    }
    
    // Read HTML file
    const html = await this.fs.readFile(htmlPath);
    
    // Extract elements
    const elements = this.extractElementsFromHtml(html, htmlPath, ignoreSelectors);
    
    if (verbose) {
      this.context.logger.info(`Found ${elements.length} elements with classes`);
    }
    
    // Group by selectors
    const groupedElements = this.groupBySelectors(elements);
    
    // Merge duplicate class sets
    const mergedSelectors = this.mergeDuplicateClassSets(groupedElements);
    
    // Generate CSS
    const applyCss = this.generateApplyCss(mergedSelectors);
    const pureCss = this.generatePureCss(mergedSelectors);
    
    // Emit event
    this.context.eventBus.emit('html-converter:complete', {
      htmlPath,
      elementsCount: elements.length,
      selectorsCount: mergedSelectors.size,
    });
    
    return {
      applyCss,
      pureCss,
      elementsCount: elements.length,
      selectorsCount: mergedSelectors.size,
    };
  }
  
  async dispose(): Promise<void> {
    this.ui8kitMap.clear();
    this.shadcnMap.clear();
  }
  
  /**
   * Get total size of cached maps (for testing)
   */
  getMapsSize(): number {
    return this.ui8kitMap.size + this.shadcnMap.size;
  }
  
  /**
   * Check if class is valid for Tailwind @apply
   */
  isValidTailwindClass(className: string): boolean {
    // Skip Lucide icon classes
    if (className === 'lucide' || className.startsWith('lucide-')) {
      return false;
    }
    
    // Check maps
    return this.ui8kitMap.has(className) || this.shadcnMap.has(className);
  }
  
  /**
   * Extract class attribute values (not data-class)
   */
  extractClassAttribute(tagContent: string): string[] {
    const classRegex = /\s+class\s*=\s*["']([^"']*)["']/;
    const classMatch = tagContent.match(classRegex);
    if (!classMatch) return [];
    
    return classMatch[1].split(/\s+/).filter(cls => cls.trim());
  }
  
  /**
   * Extract data-class attribute value
   */
  extractDataClassAttribute(tagContent: string): string {
    const dataClassMatch = tagContent.match(/data-class\s*=\s*["']([^"']*)["']/);
    return dataClassMatch ? dataClassMatch[1].trim() : '';
  }
  
  // ===========================================================================
  // Private Methods
  // ===========================================================================
  
  /**
   * Load ui8kit map from path or default location
   */
  private async loadUi8kitMap(configuredPath?: string): Promise<void> {
    const projectRoot = process.cwd();
    
    const possiblePaths: string[] = [];
    
    if (configuredPath) {
      const absolutePath = this.isAbsolutePath(configuredPath)
        ? configuredPath
        : join(projectRoot, configuredPath);
      possiblePaths.push(absolutePath);
    }
    
    // Default location
    possiblePaths.push(join(projectRoot, 'src', 'lib', 'ui8kit.map.json'));
    
    for (const mapPath of possiblePaths) {
      try {
        const jsonContent = await this.fs.readFile(mapPath);
        const mapObject = JSON.parse(jsonContent);
        
        this.ui8kitMap = new Map(Object.entries(mapObject));
        return;
      } catch {
        // Try next path
      }
    }
    
    this.context.logger.warn(
      `Could not find ui8kit.map.json. Tried: ${possiblePaths.join(', ')}. ` +
      `Set config.mappings.ui8kitMap in your generator.config.ts`
    );
  }
  
  /**
   * Load shadcn map from path or built-in
   */
  private async loadShadcnMap(configuredPath?: string): Promise<void> {
    let mapPath: string;
    
    if (configuredPath) {
      const projectRoot = process.cwd();
      mapPath = this.isAbsolutePath(configuredPath)
        ? configuredPath
        : join(projectRoot, configuredPath);
    } else {
      // Use built-in map from generator package
      try {
        const pkgDir = dirname(fileURLToPath(import.meta.url));
        mapPath = join(pkgDir, '..', '..', 'lib', 'shadcn.map.json');
      } catch {
        // Fallback for test environment
        mapPath = join(process.cwd(), 'src', 'lib', 'shadcn.map.json');
      }
    }
    
    try {
      const jsonContent = await this.fs.readFile(mapPath);
      const mapObject = JSON.parse(jsonContent);
      
      this.shadcnMap = new Map(Object.entries(mapObject));
    } catch {
      this.context.logger.debug(`shadcn.map.json not found at ${mapPath}, using empty map`);
      this.shadcnMap = new Map();
    }
  }
  
  /**
   * Check if path is absolute
   */
  private isAbsolutePath(path: string): boolean {
    return path.startsWith('/') || /^[a-zA-Z]:/.test(path);
  }
  
  /**
   * Extract elements with classes from HTML
   */
  private extractElementsFromHtml(
    html: string,
    sourceFile: string,
    ignoreSelectors: Array<string | RegExp>
  ): ElementData[] {
    const elements: ElementData[] = [];
    
    const isIgnored = (selector: string): boolean => {
      if (!selector) return false;
      for (const pattern of ignoreSelectors) {
        if (!pattern) continue;
        if (typeof pattern === 'string') {
          if (selector === pattern) return true;
        } else {
          try {
            if (pattern.test(selector)) return true;
          } catch {
            // Ignore bad regex
          }
        }
      }
      return false;
    };
    
    // Find all HTML tags
    const tagRegex = /<[^>]+>/g;
    let match;
    
    while ((match = tagRegex.exec(html)) !== null) {
      const tagContent = match[0];
      
      const classes = this.extractClassAttribute(tagContent);
      const dataClass = this.extractDataClassAttribute(tagContent);
      
      if (classes.length > 0 || dataClass) {
        const selector = dataClass || this.generateSelector(tagContent);
        
        if (dataClass && isIgnored(selector)) {
          continue;
        }
        
        elements.push({
          selector,
          classes: classes.filter(cls => !cls.includes('data-class')),
          sourceFile,
        });
      }
    }
    
    return elements;
  }
  
  /**
   * Generate selector for elements without data-class
   */
  private generateSelector(tagContent: string): string {
    const tagMatch = tagContent.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
    const tagName = tagMatch ? tagMatch[1] : 'div';
    
    // Generate random suffix
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    for (let i = 0; i < 7; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${tagName}-${suffix}`;
  }
  
  /**
   * Group elements by selectors
   */
  private groupBySelectors(elements: ElementData[]): Map<string, string[]> {
    const selectorMap = new Map<string, string[]>();
    
    for (const element of elements) {
      if (element.classes.length === 0) continue;
      
      const existingClasses = selectorMap.get(element.selector) || [];
      const allClasses = [...existingClasses, ...element.classes];
      const uniqueClasses = [...new Set(allClasses)];
      
      selectorMap.set(element.selector, uniqueClasses);
    }
    
    return selectorMap;
  }
  
  /**
   * Merge selectors with identical class sets
   */
  private mergeDuplicateClassSets(selectorMap: Map<string, string[]>): Map<string, string[]> {
    const classSetToSelectors = new Map<string, string[]>();
    
    for (const [selector, classes] of selectorMap.entries()) {
      const classSetKey = [...classes].sort().join(' ');
      
      const existingSelectors = classSetToSelectors.get(classSetKey) || [];
      existingSelectors.push(selector);
      classSetToSelectors.set(classSetKey, existingSelectors);
    }
    
    const mergedMap = new Map<string, string[]>();
    
    for (const [classSetKey, selectors] of classSetToSelectors.entries()) {
      const classes = classSetKey.split(' ');
      
      if (selectors.length > 1) {
        const combinedSelector = selectors.sort().join(', ');
        mergedMap.set(combinedSelector, classes);
      } else {
        mergedMap.set(selectors[0], classes);
      }
    }
    
    return mergedMap;
  }
  
  /**
   * Generate @apply CSS
   */
  private generateApplyCss(selectorMap: Map<string, string[]>): string {
    const cssRules: string[] = [];
    const sortedSelectors = Array.from(selectorMap.keys()).sort();
    
    for (const selector of sortedSelectors) {
      const classes = selectorMap.get(selector) || [];
      const validClasses = classes.filter(cls => this.isValidTailwindClass(cls));
      
      if (validClasses.length > 0) {
        if (selector.includes(', ')) {
          const selectors = selector.split(', ').map(s => `.${s.trim()}`).join(', ');
          cssRules.push(`${selectors} {\n  @apply ${validClasses.join(' ')};\n}`);
        } else {
          cssRules.push(`.${selector} {\n  @apply ${validClasses.join(' ')};\n}`);
        }
      }
    }
    
    const deduplicatedRules = this.deduplicateCssRules(cssRules);
    
    const header = `/*
 * Generated CSS - @apply directives
 * Do not edit manually - this file is auto-generated
 * Generated on: ${new Date().toISOString()}
 */\n\n`;
    
    return header + deduplicatedRules.join('\n\n') + '\n';
  }
  
  /**
   * Generate pure CSS3
   */
  private generatePureCss(selectorMap: Map<string, string[]>): string {
    const cssRules: string[] = [];
    const sortedSelectors = Array.from(selectorMap.keys()).sort();
    
    for (const selector of sortedSelectors) {
      const classes = selectorMap.get(selector) || [];
      const cssProperties: string[] = [];
      
      for (const className of classes) {
        let cssProperty = this.ui8kitMap.get(className) ?? this.shadcnMap.get(className);
        
        if (cssProperty) {
          cssProperties.push(`  ${cssProperty}`);
        } else if (className !== 'lucide' && !className.startsWith('lucide-')) {
          cssProperties.push(`  /* Unknown class: ${className} */`);
        }
      }
      
      if (cssProperties.length > 0) {
        if (selector.includes(', ')) {
          const selectors = selector.split(', ').map(s => `.${s.trim()}`).join(', ');
          cssRules.push(`${selectors} {\n${cssProperties.join('\n')}\n}`);
        } else {
          cssRules.push(`.${selector} {\n${cssProperties.join('\n')}\n}`);
        }
      }
    }
    
    const deduplicatedRules = this.deduplicateCssRules(cssRules);
    
    const header = `/*
 * Generated CSS - Pure CSS3 properties
 * Do not edit manually - this file is auto-generated
 * Generated on: ${new Date().toISOString()}
 */\n\n`;
    
    return header + deduplicatedRules.join('\n\n') + '\n';
  }
  
  /**
   * Deduplicate CSS rules with identical content
   */
  private deduplicateCssRules(cssRules: string[]): string[] {
    const contentToSelectors = new Map<string, string[]>();
    
    for (const rule of cssRules) {
      const match = rule.match(/^(.+?)\s*\{\s*(.+?)\s*\}\s*$/s);
      if (!match) continue;
      
      const [, selector, content] = match;
      const trimmedContent = content.trim();
      
      if (trimmedContent.includes('/* Unknown class:')) {
        continue;
      }
      
      const existingSelectors = contentToSelectors.get(trimmedContent) || [];
      existingSelectors.push(selector);
      contentToSelectors.set(trimmedContent, existingSelectors);
    }
    
    const deduplicatedRules: string[] = [];
    
    for (const [content, selectors] of contentToSelectors.entries()) {
      if (selectors.length > 1) {
        const combinedSelector = selectors.sort().join(', ');
        deduplicatedRules.push(`${combinedSelector} {\n${content}\n}`);
      } else {
        deduplicatedRules.push(`${selectors[0]} {\n${content}\n}`);
      }
    }
    
    return deduplicatedRules.sort();
  }
  
  /**
   * Create default file system
   */
  private createDefaultFileSystem(): HtmlConverterFileSystem {
    return {
      readFile: async (path: string) => {
        const { readFile } = await import('node:fs/promises');
        return readFile(path, 'utf-8');
      },
    };
  }
}
