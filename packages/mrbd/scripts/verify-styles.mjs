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
const foundationStylesPath = path.resolve(
  packageDirectory,
  '../foundation/dist/styles.css',
);
const componentStylesPath = path.resolve(
  packageDirectory,
  'dist/component-styles.css',
);
const mrbdStylesPath = path.resolve(packageDirectory, 'dist', 'styles.css');
const appEntryPath = path.resolve(
  packageDirectory,
  'dist',
  'mrbd',
  'app',
  'App.js',
);

const [foundationStyles, componentStyles, mrbdStyles, appEntry] = await Promise.all([
  readFile(foundationStylesPath, 'utf8'),
  readFile(componentStylesPath, 'utf8'),
  readFile(mrbdStylesPath, 'utf8'),
  readFile(appEntryPath, 'utf8'),
]);

const declaredTokens = css =>
  new Set([...css.matchAll(/(--uit-[a-z0-9-]+)\s*:/g)].map(match => match[1]));
const missingFoundationTokens = [...declaredTokens(foundationStyles)].filter(
  token => !mrbdStyles.includes(`${token}:`),
);
if (missingFoundationTokens.length > 0) {
  throw new Error(
    `MRBD compatibility stylesheet is missing Foundation tokens: ${missingFoundationTokens.join(', ')}`,
  );
}

const foundationMarker = '/* Foundation styles */';
const componentMarker = '/* MRBD component styles */';
const specializedToken = '--uit-chip-min-height:';
if (
  !mrbdStyles.startsWith(foundationMarker) ||
  mrbdStyles.indexOf(componentMarker) <= mrbdStyles.indexOf(foundationMarker)
) {
  throw new Error(
    'MRBD compatibility stylesheet must order Foundation before MRBD styles.',
  );
}

if (!componentStyles.includes(specializedToken)) {
  throw new Error('MRBD component stylesheet must include specialized dimensions.');
}

if (!/\bimport\s*["']\.\.\/\.\.\/component-styles\.css["']/.test(appEntry)) {
  throw new Error('Meta Ray-Ban Display App must load its component stylesheet.');
}

if (/\bimport\s*["']\.\.\/\.\.\/styles\.css["']/.test(appEntry)) {
  throw new Error(
    'Meta Ray-Ban Display App must not load the compatibility stylesheet.',
  );
}
