#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import {
  dirname,
  join,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetDirectory = join(skillDirectory, 'assets', 'app-shell');
const workspace = resolve(process.argv[2] ?? '.');
const files = [
  'index.html',
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
];

mkdirSync(workspace, { recursive: true });

for (const file of files) {
  const destination = join(workspace, file);
  if (existsSync(destination)) {
    throw new Error(`Refusing to overwrite ${destination}`);
  }
  copyFileSync(join(assetDirectory, file), destination);
}

console.log('UI Toolkit application shell initialized.');
