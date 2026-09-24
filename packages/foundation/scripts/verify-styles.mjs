/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageDirectory = path.resolve(scriptDirectory, '..');
const appEntry = await readFile(
  path.resolve(packageDirectory, 'dist', 'app', 'App.js'),
  'utf8',
);

if (!/\bimport\s*["']\.\.\/styles\.css["']/.test(appEntry)) {
  throw new Error('Foundation App must load the packaged stylesheet.');
}
