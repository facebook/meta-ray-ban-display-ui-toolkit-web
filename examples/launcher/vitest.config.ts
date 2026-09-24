/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Running this workspace's tests directly must match the repository-wide run:
// jsdom plus the shared setup supplies browser globals jsdom omits, and the
// global test hooks are what register Testing Library's between-test cleanup.
// The workspace aliases mirror the repo-wide vitest config so cross-package
// imports resolve to source without a prior build.
const workspaceAliases = [
  {
    find: '@wearables-ui-toolkit/androidx-shapes',
    replacement: path.resolve(
      __dirname,
      '../../packages/androidx-shapes/src/index.ts',
    ),
  },
  {
    find: '@wearables-ui-toolkit/foundation/styles.css',
    replacement: path.resolve(
      __dirname,
      '../../packages/foundation/src/theme/theme.css',
    ),
  },
  {
    find: /^@wearables-ui-toolkit\/foundation\/(.+)$/,
    replacement: path.resolve(__dirname, '../../packages/foundation/src/$1'),
  },
  {
    find: '@wearables-ui-toolkit/foundation',
    replacement: path.resolve(
      __dirname,
      '../../packages/foundation/src/index.ts',
    ),
  },
  {
    find: '@wearables-ui-toolkit/icons/svg',
    replacement: path.resolve(
      __dirname,
      '../../packages/icons/src/svg',
    ),
  },
  {
    find: '@wearables-ui-toolkit/icons',
    replacement: path.resolve(
      __dirname,
      '../../packages/icons/src/index.ts',
    ),
  },
  {
    find: '@wearables-ui-toolkit/mrbd/react-router',
    replacement: path.resolve(
      __dirname,
      '../../packages/mrbd/src/react-router/index.tsx',
    ),
  },
  {
    find: '@wearables-ui-toolkit/mrbd/styles.css',
    replacement: path.resolve(
      __dirname,
      '../../packages/mrbd/src/styles.css',
    ),
  },
  {
    find: '@wearables-ui-toolkit/mrbd',
    replacement: path.resolve(
      __dirname,
      '../../packages/mrbd/src/index.ts',
    ),
  },
];

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: workspaceAliases,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: [path.resolve(__dirname, '../../vitest.setup.ts')],
      css: {
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
    },
  }),
);
