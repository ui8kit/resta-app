import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'test/**/*'],
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  
  build: {
    // Library mode configuration
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'cli/generate': resolve(__dirname, 'src/cli/generate.ts'),
        'cli/generate-templates': resolve(__dirname, 'src/cli/generate-templates.ts'),
      },
      name: 'UI8KitGenerator',
      formats: ['es'],
    },
    
    // Output directory
    outDir: 'dist',
    
    // Empty output directory before build
    emptyOutDir: true,
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Target Node.js environment
    target: 'node18',
    
    // Rollup options
    rollupOptions: {
      // External dependencies (don't bundle these)
      // Mark all dependencies as external (don't bundle them)
      external: (id, parentId, isResolved) => {
        // Never externalize entry points or local source files
        if (id.includes('/src/') || id.endsWith('/src')) return false;
        if (id.startsWith('.') || id.startsWith('@/')) return false;
        
        // Node.js built-ins
        if (id.startsWith('node:')) return true;
        if (['fs', 'fs/promises', 'path', 'url', 'crypto', 'stream', 'util', 'events', 'buffer', 'child_process'].includes(id)) {
          return true;
        }
        
        // External: any bare import (npm packages)
        if (/^[a-z@]/.test(id) && !id.startsWith('@/')) {
          return true;
        }
        
        return false;
      },
      
      output: {
        // Preserve module structure
        preserveModules: true,
        preserveModulesRoot: 'src',
        
        // Entry file names
        entryFileNames: '[name].js',
        
        // Chunk file names
        chunkFileNames: '[name].js',
        
        // Export format
        format: 'es',
        
        // Interop settings
        interop: 'auto',
        
        // Exports mode
        exports: 'named',
      },
    },
    
    // Minification (disabled for library - consumers can minify)
    minify: false,
    
    // Report compressed size
    reportCompressedSize: false,
  },
  
  // Resolve aliases (match tsconfig paths)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
