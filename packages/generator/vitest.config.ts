import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test settings
    globals: true,
    
    // Test file patterns
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'test/**/*.test.ts',
      'test/**/*.spec.ts',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'templates',
    ],
    
    // Setup files (run before each test file)
    setupFiles: ['./test/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      enabled: false, // Enable via --coverage flag
      
      // Files to include in coverage
      include: [
        'src/core/**/*.ts',
        'src/services/**/*.ts',
        'src/plugins/**/*.ts',
      ],
      
      // Files to exclude from coverage
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/**/index.ts', // Barrel exports only
        'src/core/interfaces/**', // Type-only files
        'src/stages/**/*.ts', // Thin wrappers, integration tested
      ],
      
      // Coverage thresholds
      thresholds: {
        statements: 75,
        branches: 70,
        functions: 70,
        lines: 75,
      },
      
      // Output formats
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      
      // Output directory
      reportsDirectory: './coverage',
      
      // Clean coverage on each run
      clean: true,
    },
    
    // Reporter configuration
    reporters: ['default'],
    
    // Timeout for tests
    testTimeout: 30000,
    
    // Hooks timeout
    hookTimeout: 30000,
    
    // Pool options for parallelization
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    
    // Watch mode settings
    watch: false,
    
    // Retry failed tests
    retry: 0,
    
    // Bail on first failure (useful for CI)
    bail: 0,
  },
  
  // Resolve aliases (match tsconfig paths)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
