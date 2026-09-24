/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { reactWithCompilerOptions } from '../../tools/reactCompilerConfig';

export default defineConfig({
  base: './',
  root: __dirname,
  plugins: [react(reactWithCompilerOptions())],
  resolve: {
    alias: {
      '@wearables-ui-toolkit/icons/svg': path.resolve(
        __dirname,
        '../../packages/icons/src/svg',
      ),
      '@wearables-ui-toolkit/mrbd/react-router': path.resolve(
        __dirname,
        '../../packages/mrbd/src/react-router/index.tsx',
      ),
      '@wearables-ui-toolkit/mrbd/styles.css': path.resolve(
        __dirname,
        '../../packages/mrbd/src/styles.css',
      ),
      '@wearables-ui-toolkit/mrbd': path.resolve(
        __dirname,
        '../../packages/mrbd/src/index.ts',
      ),
      '@wearables-ui-toolkit/androidx-shapes': path.resolve(
        __dirname,
        '../../packages/androidx-shapes/src/index.ts',
      ),
      '@wearables-ui-toolkit/icons': path.resolve(
        __dirname,
        '../../packages/icons/src/index.ts',
      ),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
