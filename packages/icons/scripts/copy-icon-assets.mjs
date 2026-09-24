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

import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '..');
const sourceSvgDir = path.join(packageDir, 'src', 'svg');
const distSvgDir = path.join(packageDir, 'dist', 'svg');

await rm(distSvgDir, {
  recursive: true,
  force: true,
});
await mkdir(path.dirname(distSvgDir), { recursive: true });
await cp(sourceSvgDir, distSvgDir, { recursive: true });
