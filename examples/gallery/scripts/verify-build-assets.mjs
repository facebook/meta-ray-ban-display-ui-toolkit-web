#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const assets = path.join(dist, 'assets');
const indexHtml = await readFile(path.join(dist, 'index.html'), 'utf8');

assert.doesNotMatch(
  indexHtml,
  /(?:href|src)="\/(?!\/)/,
  'Gallery entry-point assets must be relative to the deployed directory',
);

const bundleNames = (await readdir(assets)).filter(fileName =>
  /\.(?:css|js)$/.test(fileName),
);
for (const bundleName of bundleNames) {
  const bundle = await readFile(path.join(assets, bundleName), 'utf8');
  assert.doesNotMatch(
    bundle,
    /(?:["'`]|\burl\()\/(?:assets|gallery-)/,
    `${bundleName} contains an origin-root gallery asset URL`,
  );
}

for (const fileName of [
  'gallery-avatar-portrait.png',
  'gallery-avatar-secondary.png',
  'gallery-coast.png',
  'gallery-forest.png',
  'gallery-overlook.png',
]) {
  await readFile(path.join(dist, fileName));
}

console.log('Gallery build assets are deploy-directory relative.');
