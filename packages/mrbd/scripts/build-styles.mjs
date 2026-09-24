#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

export async function buildStyles() {
  const foundationStyles = await readFile(
    path.resolve(packageDirectory, '../foundation/dist/styles.css'),
    'utf8',
  );
  const componentStyles = await readFile(
    path.resolve(packageDirectory, 'dist/component-styles.css'),
    'utf8',
  );

  await writeFile(
    path.resolve(packageDirectory, 'dist/styles.css'),
    `/* Foundation styles */\n${foundationStyles.trimEnd()}\n` +
      `/* MRBD component styles */\n${componentStyles}`,
  );
}

if (
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await buildStyles();
}
