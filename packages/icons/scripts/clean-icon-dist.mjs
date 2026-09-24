/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Meta Wearables Developer Terms found in
 * the LICENSE file in this package.
 *
 */

/**
 * (c) Meta Platforms, Inc. and affiliates.
 */

import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '..');
const distDir = path.join(packageDir, 'dist');

await rm(distDir, {
  recursive: true,
  force: true,
});
await mkdir(distDir, { recursive: true });
