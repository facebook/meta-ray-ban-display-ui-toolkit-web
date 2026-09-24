/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { reactWithCompilerOptions } from '../../tools/reactCompilerConfig';

export default defineConfig({
  base: './',
  plugins: [react(reactWithCompilerOptions())],
  root: __dirname,
  resolve: {
    alias: {
      '@wearables-ui-toolkit/androidx-shapes': path.resolve(
        __dirname,
        '../../packages/androidx-shapes/src/index.ts',
      ),
      '@wearables-ui-toolkit/icons/svg': path.resolve(
        __dirname,
        '../../packages/icons/src/svg',
      ),
      '@wearables-ui-toolkit/icons': path.resolve(
        __dirname,
        '../../packages/icons/src/index.ts',
      ),
      '@wearables-ui-toolkit/mrbd/styles.css': path.resolve(
        __dirname,
        '../../packages/mrbd/src/styles.css',
      ),
      '@wearables-ui-toolkit/mrbd': path.resolve(
        __dirname,
        '../../packages/mrbd/src/index.ts',
      ),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  server: {
    open: false,
    strictPort: true,
  },
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
