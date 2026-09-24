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
    injectAppStyles('app/App.js'),
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  build: {
    cssCodeSplit: false,
    lib: {
      entry: collectSourceEntries(path.resolve(__dirname, 'src')),
      formats: ['es'],
    },
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
        'react/compiler-runtime',
        '@wearables-ui-toolkit/androidx-shapes',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        dir: 'dist',
        format: 'es',
        entryFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? assetInfo.name ?? '';
          return name.endsWith('.css')
            ? 'styles.css'
            : 'assets/[name][extname]';
        },
        banner: '"use client";',
      },
    },
  },
});
