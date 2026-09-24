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
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const workspace = process.cwd();
const sourceDirectory = resolve(workspace, process.argv[2] ?? 'src');
const requireFromWorkspace = createRequire(resolve(workspace, 'package.json'));
const scriptDirectory = dirname(fileURLToPath(import.meta.url));

function read(relativePath) {
  return readFileSync(resolve(sourceDirectory, relativePath), 'utf8');
}

function verifyPatternContract() {
  const page = read('TimedSessionPage.tsx');
  const main = read('main.tsx');
  const css = read('app.css');
  const allSource = [main, page].join('\n');
  const failures = [];

  if (!/type\s+SessionPhase\s*=\s*['"]running['"]\s*\|\s*['"]paused['"]\s*\|\s*['"]complete['"]/.test(page)) {
    failures.push('timed session must declare running, paused, and complete phases');
  }
  if (!/useEffect\([\s\S]*?window\.setInterval\([\s\S]*?setPhase\(['"]complete['"]\)[\s\S]*?return 0[\s\S]*?\},\s*1000\)[\s\S]*?\},\s*\[phase\]\)/.test(page)) {
    failures.push('countdown must use one phase-owned interval and transition to complete at zero');
  }
  if (!/const\s*\[\s*remainingSeconds\s*,\s*setRemainingSeconds\s*\]\s*=\s*useState\(/.test(page)) {
    failures.push('countdown must use readable remainingSeconds state destructuring');
  }
  for (const required of ['Timing', 'Paused', 'Complete', 'Pause', 'Resume', 'Restart']) {
    if (!page.includes(`'${required}'`) && !page.includes(`"${required}"`)) {
      failures.push(`timed session must handle ${required}`);
    }
  }
  if (/const\s+SUPPORTING_COPY\b/.test(page)) {
    failures.push('supporting copy must derive from phase instead of one shared constant');
  }
  if (!/const\s+supportingCopy\s*=[\s\S]{0,500}?phase[\s\S]{0,500}?['"]complete['"]/.test(page)) {
    failures.push('supportingCopy must explicitly derive running, paused, and complete content from phase');
  }
  if (!/TextStyle\.BODY2\}[\s\S]*?>\s*\{supportingCopy\}\s*<\/TextView>/.test(page)) {
    failures.push('BODY2 supporting TextView must render phase-derived supportingCopy');
  }
  if ((allSource.match(/<Page\b/g) ?? []).length !== 1 || (page.match(/<Panel\b/g) ?? []).length !== 1) {
    failures.push('timed session must contain exactly one Page and one Panel');
  }
  if (!/<ScrollView\b[^>]*\binsetForHeader\b[^>]*\btabIndex=\{0\}[^>]*>\s*<Panel\b[^>]*>\s*<div\b[^>]*className=['"]content-inset['"]/.test(page)) {
    failures.push('Panel must be a direct child of the inset, focusable ScrollView');
  }
  if ((page.match(/<TextView\b/g) ?? []).length !== 4) {
    failures.push('Panel must use exactly four TextView roles');
  }
  if (!/textStyle=\{TextStyle\.LABEL\}[\s\S]*?textColor=\{TextColor\.SECONDARY\}[\s\S]*?>\s*STATUS\s*<\/TextView>/.test(page)) {
    failures.push('STATUS eyebrow must be all caps with secondary text color');
  }
  if ((page.match(/<ButtonRail\b/g) ?? []).length !== 1 || (page.match(/<Button\b/g) ?? []).length !== 1) {
    failures.push('timed session must contain one ButtonRail with one persistent Button');
  }
  const header = page.match(/headerText=['"]([^'"]+)['"]/)?.[1];
  if (!header || header.trim().split(/\s+/).length > 2) {
    failures.push('Page headerText must be a one- or two-word literal');
  }
  if ((css.match(/^[^\s@][^{]*\{/gm) ?? []).length !== 5) {
    failures.push('app.css must retain only the five documented selector blocks');
  }
  if (!/\.content-inset\s*\{[\s\S]*?gap:\s*calc\(var\(--uit-spacing-large\)\s*\+\s*var\(--uit-spacing-xsmall\)\)/.test(css)) {
    failures.push('content-inset must use the prescribed large-plus-xsmall text-stack rhythm');
  }

  if (failures.length > 0) {
    console.error('\nTimed session production pattern failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
}

function run(label, executable, args) {
  console.log(`\n${label}`);
  const result = spawnSync(executable, args, {cwd: workspace, stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

verifyPatternContract();

run('TypeScript', process.execPath, [
  requireFromWorkspace.resolve('typescript/bin/tsc'),
  '--noEmit',
  '--noUnusedLocals',
  '--noUnusedParameters',
]);
run('UI Toolkit application structure', process.execPath, [
  resolve(scriptDirectory, '../../uit-screen-architecture-web/scripts/validate-app-structure.mjs'),
  sourceDirectory,
]);
run('Production build', process.execPath, [
  resolve(dirname(requireFromWorkspace.resolve('vite/package.json')), 'bin/vite.js'),
  'build',
]);

console.log('\nUI Toolkit for Meta Ray-Ban Display timed session verification passed.');
