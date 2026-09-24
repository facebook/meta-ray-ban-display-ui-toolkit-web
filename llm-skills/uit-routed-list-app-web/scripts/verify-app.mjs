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
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const workspace = process.cwd();
const sourceDirectory = resolve(workspace, process.argv[2] ?? 'src');
const requireFromWorkspace = createRequire(resolve(workspace, 'package.json'));
const scriptDirectory = dirname(fileURLToPath(import.meta.url));

function verifyPatternContract() {
  const detailPath = resolve(sourceDirectory, 'pages/DetailPage.tsx');
  const collectionPath = resolve(sourceDirectory, 'pages/CollectionPage.tsx');
  const emptyPath = resolve(sourceDirectory, 'pages/CollectionEmptyPage.tsx');
  const domainPath = resolve(sourceDirectory, 'domain.ts');
  const detail = readFileSync(detailPath, 'utf8');
  const collection = readFileSync(collectionPath, 'utf8');
  const empty = readFileSync(emptyPath, 'utf8');
  const domain = readFileSync(domainPath, 'utf8');
  const failures = [];

  if ((detail.match(/<Panel\b/g) ?? []).length !== 1) {
    failures.push('detail route must contain exactly one Panel information backdrop');
  }
  if (
    !/<ScrollView\b[^>]*>\s*<Panel\b[^>]*\bwidth=['"]100%['"][^>]*>\s*<div\b[^>]*className=['"]content-inset['"]/.test(
      detail,
    )
  ) {
    failures.push(
      'detail Panel must be a direct ScrollView child, use width="100%", and contain the tokenized content-inset wrapper',
    );
  }
  if (/<Panel\b/.test(collection) || /<Panel\b/.test(empty)) {
    failures.push('collection and empty-state routes must not use Panel');
  }

  for (const title of domain.matchAll(/\btitle\s*:\s*(['"])(.*?)\1/g)) {
    if (title[2].length > 10) {
      failures.push(`timestamped mock title is too long for compact layouts: "${title[2]}"`);
    }
  }
  for (const subtitle of domain.matchAll(/\bsubtitle\s*:\s*(['"])(.*?)\1/g)) {
    if (subtitle[2].length > 12) {
      failures.push(`timestamped mock subtitle is too long for compact layouts: "${subtitle[2]}"`);
    }
  }

  const savedActionField = detail.match(
    /title=\{\s*record\.([A-Za-z_$][\w$]*)\s*\?\s*['"]Unsave/i,
  )?.[1];
  if (
    savedActionField != null &&
    new RegExp(
      `record\\.${savedActionField}\\s*\\?\\s*['"](?:Verified|Available|Accessible|Approved|Complete)['"]`,
      'i',
    ).test(detail)
  ) {
    failures.push(
      `save state record.${savedActionField} also controls an independent informational status; model the two facts separately`,
    );
  }

  if (failures.length > 0) {
    console.error('\nRouted-list production pattern failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
}

function run(label, executable, args) {
  console.log(`\n${label}`);
  const result = spawnSync(executable, args, {
    cwd: workspace,
    stdio: 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

verifyPatternContract();

run('TypeScript', process.execPath, [
  requireFromWorkspace.resolve('typescript/bin/tsc'),
  '--noEmit',
  '--noUnusedLocals',
  '--noUnusedParameters',
]);

run('UI Toolkit application structure', process.execPath, [
  resolve(
    scriptDirectory,
    '../../uit-screen-architecture-web/scripts/validate-app-structure.mjs',
  ),
  sourceDirectory,
]);

run('Production build', process.execPath, [
  resolve(dirname(requireFromWorkspace.resolve('vite/package.json')), 'bin/vite.js'),
  'build',
]);

console.log('\nUI Toolkit for Meta Ray-Ban Display application verification passed.');
