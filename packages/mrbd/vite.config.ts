/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync } from 'node:fs';
import path from 'path';
import { reactWithCompilerOptions } from '../../tools/reactCompilerConfig';
import { injectAppStyles } from '../../tools/viteInjectAppStyles';
import { buildStyles } from './scripts/build-styles.mjs';

const FOUNDATION_PACKAGE = '@wearables-ui-toolkit/foundation';

const buildCompatibilityStyles = {
  name: 'build-compatibility-styles',
  writeBundle: buildStyles,
};

function collectSourceEntries(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectSourceEntries(entryPath);
    }
    if (
      !entry.isFile() ||
      !/\.tsx?$/.test(entry.name) ||
      /(?:\.test|\.d)\.tsx?$/.test(entry.name)
    ) {
      return [];
    }
    return [entryPath];
  });
}

export default defineConfig({
  plugins: [
    react(reactWithCompilerOptions()),
    injectAppStyles('mrbd/app/App.js', 'component-styles.css'),
    buildCompatibilityStyles,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  build: {
    // Components own their CSS modules in source. Vite aggregates the MRBD
    // modules into one asset, and injectAppStyles makes App load it after the
    // Foundation App dependency. build-styles.mjs separately creates the
    // self-contained compatibility export.
    cssCodeSplit: false,
    lib: {
      entry: collectSourceEntries(path.resolve(__dirname, 'src')),
      formats: ['es'],
    },
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      external: (id) =>
        id === 'react' ||
        id === 'react-dom' ||
        id === 'react-router-dom' ||
        id === 'react/jsx-runtime' ||
        id === 'react/compiler-runtime' ||
        id === FOUNDATION_PACKAGE || id.startsWith(`${FOUNDATION_PACKAGE}/`),
      output: {
        // Mirror the src/ tree in dist/ so subpath imports resolve and
        // bundlers can drop unused modules.
        preserveModules: true,
        preserveModulesRoot: 'src',
        dir: 'dist',
        format: 'es',
        entryFileNames: '[name].js',
        // Keep the App-loaded MRBD-only stylesheet separate from the public
        // compatibility bundle so Foundation styles are not loaded twice.
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? assetInfo.name ?? '';
          if (name.endsWith('.css')) {
            return 'component-styles.css';
          }
          return 'assets/[name][extname]';
        },
        // Carry the React Server Components client directive into every
        // emitted module. If the React Compiler / plugin pipeline strips or
        // relocates this, the build-fix pass must re-inject it.
        banner: '"use client";',
      },
    },
  },
});
