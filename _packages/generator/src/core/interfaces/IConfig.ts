import type { UncssStepConfig } from '../../steps/postprocess-uncss';

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
    routes: Record<string, RouteConfig>;
    outputDir: string;
    mode?: 'tailwind' | 'semantic' | 'inline';
    cssHref?: string;
    partials?: {
      sourceDir: string;
      outputDir?: string;
      props?: Record<string, Record<string, unknown>>;
    };
    stripDataClassInTailwind?: boolean;
  };
  
  /**
   * UnCSS configuration
   */
  uncss?: UncssStepConfig;
  
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
   * PostCSS + Tailwind processing
   */
  postcss?: {
    enabled?: boolean;
    entryImports?: string[];
    sourceDir?: string;
    outputDir?: string;
    outputFileName?: string;
    uncss?: {
      enabled?: boolean;
      outputFileName?: string;
      timeout?: number;
    };
  };

  /**
   * Fixture-based route discovery
   */
  fixtures?: {
    dir: string;
    collections?: string[];
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
    routes: ['/'],
    outputDir: './dist/css',
    pureCss: false,
  },
  html: {
    routes: { '/': { title: 'Home' } },
    outputDir: './dist/html',
    mode: 'tailwind',
    cssHref: '/css/styles.css',
  },
};
