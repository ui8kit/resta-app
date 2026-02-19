/**
 * Generator configuration interface.
 * 
 * This is the main configuration object passed to the generator.
 */
export interface GeneratorConfig {
  /**
   * Application metadata
   */
  app: {
    name: string;
    lang?: string;
  };
  
  /**
   * CSS class mapping paths
   */
  mappings?: {
    ui8kitMap?: string;
    shadcnMap?: string;
  };
  
  /**
   * CSS generation configuration
   */
  css: {
    entryPath: string;
    routes: string[];
    outputDir: string;
    pureCss?: boolean;
    /**
     * Output file names (customizable)
     */
    outputFiles?: {
      /** Tailwind @apply CSS file name (default: 'tailwind.apply.css') */
      applyCss?: string;
      /** Pure CSS file name (default: 'ui8kit.local.css') */
      pureCss?: string;
      /** Variants CSS file name (default: 'variants.apply.css') */
      variantsCss?: string;
      /** Shadcn CSS file name (default: 'shadcn.css') */
      shadcnCss?: string;
    };
  };
  
  /**
   * HTML generation configuration
   */
  html: {
    viewsDir: string;
    routes: Record<string, RouteConfig>;
    outputDir: string;
    mode?: 'tailwind' | 'semantic' | 'inline';
    partials?: {
      sourceDir: string;
      outputDir?: string;
      props?: Record<string, Record<string, unknown>>;
    };
    stripDataClassInTailwind?: boolean;
    /**
     * Layout configuration
     */
    layout?: {
      /** Main layout template path (default: 'layouts/layout.liquid') */
      template?: string;
      /** Custom layout templates directory */
      templatesDir?: string;
    };
  };
  
  /**
   * Client script configuration
   */
  clientScript?: {
    enabled?: boolean;
    outputDir?: string;
    fileName?: string;
    darkModeSelector?: string;
  };
  
  /**
   * UnCSS configuration
   */
  uncss?: {
    enabled?: boolean;
    htmlFiles?: string[];
    cssFile?: string;
    outputDir?: string;
    ignore?: string[];
    media?: boolean;
    timeout?: number;
  };
  
  /**
   * Asset copying configuration
   */
  assets?: {
    copy?: string[];
  };
  
  /**
   * Variant elements generation
   */
  elements?: {
    enabled?: boolean;
    variantsDir?: string;
    outputDir?: string;
    componentsImportPath?: string;
  };
  
  /**
   * MDX documentation configuration
   */
  mdx?: {
    enabled: boolean;
    docsDir: string;
    outputDir: string;
    demosDir?: string;
    navOutput?: string;
    basePath?: string;
    components?: Record<string, string>;
    propsSource?: string;
    toc?: {
      minLevel?: number;
      maxLevel?: number;
    };
  };
  
  /**
   * Template generation configuration
   * 
   * Transforms React components to template files (Liquid, Handlebars, Twig, Latte)
   */
  template?: {
    /** Enable template generation */
    enabled?: boolean;
    /** Template engine to use */
    engine?: 'react' | 'liquid' | 'handlebars' | 'twig' | 'latte';
    /** Source directories for components (relative to root) */
    sourceDirs?: string[];
    /** Output directory for generated templates (relative to root) */
    outputDir?: string;
    /** File patterns to include (default: ['**\/*.tsx']) */
    include?: string[];
    /** File patterns to exclude */
    exclude?: string[];
    /** Enable verbose logging */
    verbose?: boolean;
    /** Plugin-specific configuration */
    pluginConfig?: {
      /** Prepend text to every template */
      prependComment?: string;
      /** Enable pretty printing */
      prettyPrint?: boolean;
    };
  };
  
  /**
   * Plugin-specific configuration
   */
  plugins?: Record<string, unknown>;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  title: string;
  seo?: {
    description?: string;
    keywords?: string[];
    image?: string;
  };
  data?: Record<string, unknown>;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: GeneratorConfig = {
  app: {
    name: 'UI8Kit Generator',
    lang: 'en',
  },
  css: {
    entryPath: './src/main.tsx',
    routes: ['/'],
    outputDir: './dist/css',
    pureCss: false,
  },
  html: {
    viewsDir: './views',
    routes: { '/': { title: 'Home' } },
    outputDir: './dist/html',
    mode: 'tailwind',
  },
  clientScript: {
    enabled: false,
    outputDir: './dist/assets/js',
    fileName: 'main.js',
  },
};
