/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { reactWithCompilerOptions } from './tools/reactCompilerConfig';

export default defineConfig({
  plugins: [react(reactWithCompilerOptions())],
  resolve: {
    alias: [
      {
        find: '@wearables-ui-toolkit/androidx-shapes',
        replacement: path.resolve(
          __dirname,
          './packages/androidx-shapes/src/index.ts',
        ),
      },
      {
        find: '@wearables-ui-toolkit/icons/svg',
        replacement: path.resolve(
          __dirname,
          './packages/icons/src/svg',
        ),
      },
      {
        find: '@wearables-ui-toolkit/icons/manifest.json',
        replacement: path.resolve(
          __dirname,
          './packages/icons/src/manifest.json',
        ),
      },
      {
        find: '@wearables-ui-toolkit/icons/keyword-index.json',
        replacement: path.resolve(
          __dirname,
          './packages/icons/src/keyword-index.json',
        ),
      },
      {
        find: '@wearables-ui-toolkit/icons',
        replacement: path.resolve(
          __dirname,
          './packages/icons/src/index.ts',
        ),
      },
      {
        find: '@wearables-ui-toolkit/foundation/styles.css',
        replacement: path.resolve(
          __dirname,
          './packages/foundation/src/theme/theme.css',
        ),
      },
      {
        find: /^@wearables-ui-toolkit\/foundation\/(.+)$/,
        replacement: path.resolve(__dirname, './packages/foundation/src/$1'),
      },
      {
        find: '@wearables-ui-toolkit/foundation',
        replacement: path.resolve(
          __dirname,
          './packages/foundation/src/index.ts',
        ),
      },
      {
        find: '@wearables-ui-toolkit/mrbd/react-router',
        replacement: path.resolve(
          __dirname,
          './packages/mrbd/src/react-router/index.tsx',
        ),
      },
      {
        find: '@wearables-ui-toolkit/mrbd/App',
        replacement: path.resolve(
          __dirname,
          './packages/mrbd/src/mrbd/app/App.tsx',
        ),
      },
      {
        find: '@wearables-ui-toolkit/mrbd/Button',
        replacement: path.resolve(
          __dirname,
          './packages/mrbd/src/mrbd/ui/Button.tsx',
        ),
      },
      {
        find: '@wearables-ui-toolkit/mrbd/ButtonDivider',
        replacement: path.resolve(
          __dirname,
          './packages/mrbd/src/mrbd/ui/ButtonDivider.tsx',
        ),
      },
      {
        find: '@wearables-ui-toolkit/mrbd/ButtonRail',
        replacement: path.resolve(
          __dirname,
          './packages/mrbd/src/mrbd/ui/ButtonRail.tsx',
        ),
      },
      {
        find: '@wearables-ui-toolkit/mrbd',
        replacement: path.resolve(
          __dirname,
          './packages/mrbd/src/index.ts',
        ),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'examples/alpha-launcher/src/**/*.{test,spec}.{ts,tsx}',
      'examples/gallery/src/**/*.{test,spec}.{ts,tsx}',
      'packages/icons/src/**/*.{test,spec}.{ts,tsx}',
      'packages/foundation/src/**/*.{test,spec}.{ts,tsx}',
      'packages/mrbd/src/**/*.{test,spec}.{ts,tsx}',
      'examples/launcher/src/**/*.{test,spec}.{ts,tsx}',
      'examples/messaging/src/**/*.{test,spec}.{ts,tsx}',
      'examples/shared/**/*.{test,spec}.{ts,tsx}',
      'tools/**/*.{test,spec}.{ts,tsx}',
    ],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
});
