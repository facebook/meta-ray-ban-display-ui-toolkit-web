#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const queries = process.argv
  .slice(2)
  .map(query => query.toLowerCase().trim())
  .filter(Boolean);

if (queries.length === 0 || queries.includes('--help')) {
  console.error(
    'Usage: find-filled-icon.mjs <concept> [<concept> ...]\n' +
      'Quote multi-word concepts, for example: "recent clock" "saved bookmark"',
  );
  process.exit(2);
}

const requireFromWorkspace = createRequire(
  resolve(process.cwd(), 'package.json'),
);
const manifestPath = requireFromWorkspace.resolve(
  '@wearables-ui-toolkit/icons/manifest.json',
);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

let missingMatch = false;

for (const query of queries) {
  const terms = query.split(/\s+/);
  const matches = manifest
    .filter(entry => entry.filled)
    .map(entry => {
      const name = entry.name.toLowerCase();
      const slug = entry.slug.toLowerCase();
      const keywords = entry.keywords.map(keyword => keyword.toLowerCase());
      const score = terms.reduce((total, term) => {
        if (name === term || slug === term) {
          return total + 12;
        }
        if (name.includes(term) || slug.includes(term)) {
          return total + 6;
        }
        if (keywords.includes(term)) {
          return total + 4;
        }
        if (keywords.some(keyword => keyword.includes(term))) {
          return total + 1;
        }
        return total;
      }, 0);
      return {...entry, score};
    })
    .filter(entry => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.name.localeCompare(right.name),
    )
    .slice(0, 3);

  if (matches.length === 0) {
    console.error(`${query}: no filled icon matched`);
    missingMatch = true;
    continue;
  }

  console.log(`${query}:`);
  for (const entry of matches) {
    const subpath = entry.filled.replace(/^\.\/svg\//, '');
    console.log(
      `  ${entry.name}: import ${entry.name}Filled from ` +
        `'@wearables-ui-toolkit/icons/svg/${subpath}';`,
    );
  }
}

process.exitCode = missingMatch ? 1 : 0;
