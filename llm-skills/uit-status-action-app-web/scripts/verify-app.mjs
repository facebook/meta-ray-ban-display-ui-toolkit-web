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
  const page = read('StatusPage.tsx');
  const main = read('main.tsx');
  const css = read('app.css');
  const allSource = [main, page].join('\n');
  const failures = [];

  if ((allSource.match(/<Page\b/g) ?? []).length !== 1) {
    failures.push('status action pattern must contain exactly one Page');
  }
  if (/<(?:Routes?|SubNavigationPager|VerticalList|ListItem|ButtonGroup)\b/.test(allSource)) {
    failures.push('status action pattern forbids routes, pagers, lists, and ButtonGroup');
  }
  if (/\buseEffect\b|\bsetInterval\b|\bsetTimeout\b/.test(allSource)) {
    failures.push('status action pattern forbids timers and automatic transitions');
  }
  if ((page.match(/<Panel\b/g) ?? []).length !== 1) {
    failures.push('status action Page must contain exactly one Panel');
  }
  if (
    !/<ScrollView\b[^>]*\binsetForHeader\b[^>]*\btabIndex=\{0\}[^>]*>\s*<Panel\b[^>]*\bwidth=['"]100%['"][^>]*>\s*<div\b[^>]*className=['"]content-inset['"]/.test(
      page,
    )
  ) {
    failures.push(
      'Panel must be a direct child of the inset, focusable ScrollView, use width="100%", and contain content-inset',
    );
  }
  if ((page.match(/<TextView\b/g) ?? []).length !== 4) {
    failures.push('Panel must use exactly four TextView roles');
  }
  if (
    !/textStyle=\{TextStyle\.LABEL\}[\s\S]*?textColor=\{TextColor\.SECONDARY\}[\s\S]*?>\s*STATUS\s*<\/TextView>/.test(
      page,
    )
  ) {
    failures.push('STATUS eyebrow must be all caps with secondary text color');
  }
  if ((page.match(/<ButtonRail\b/g) ?? []).length !== 1 || (page.match(/<Button\b/g) ?? []).length !== 1) {
    failures.push('status action Page must contain one ButtonRail with one Button');
  }
  if (!/onClick=\{\w+\}/.test(page) || !/Toast\.show\(/.test(page)) {
    failures.push('persistent Button must perform a state operation with Toast feedback');
  }
  const header = page.match(/headerText=['"]([^'"]+)['"]/)?.[1];
  if (!header || header.trim().split(/\s+/).length > 2) {
    failures.push('Page headerText must be a one- or two-word literal');
  }
  if ((css.match(/^[^\s@][^{]*\{/gm) ?? []).length !== 5) {
    failures.push('app.css must retain only the five documented selector blocks');
  }
  const contentInsetRule = css.match(/\.content-inset\s*\{([^}]*)\}/)?.[1] ?? '';
  const actionDockRule = css.match(/\.action-dock\s*\{([^}]*)\}/)?.[1] ?? '';
  if (!/\bmin-inline-size:\s*0\s*;/.test(actionDockRule)) {
    failures.push('action-dock must allow its intrinsic ButtonRail to shrink to the viewport');
  }
  const gapDeclarations = contentInsetRule.match(/\bgap\s*:/g) ?? [];
  if (gapDeclarations.length !== 1) {
    failures.push('content-inset must contain exactly one gap declaration');
  } else if (
    !/\bgap:\s*calc\(\s*var\(--uit-spacing-large\)\s*\+\s*var\(--uit-spacing-xsmall\)\s*\)\s*;/.test(
      contentInsetRule,
    )
  ) {
    failures.push('content-inset gap must use the prescribed large-plus-xsmall token rhythm');
  }
  if (!/\bpadding:\s*var\(--uit-spacing-large\)\s*;/.test(contentInsetRule)) {
    failures.push('content-inset padding must use exactly var(--uit-spacing-large)');
  }

  const safetyCriticalProduct = /\b(?:cold storage|temperature|food safety|health|security|alarm|environmental)\b/i.test(
    allSource,
  );
  if (
    safetyCriticalProduct &&
    /\b(?:monitoring|measurement|alerts?)\s+(?:paused|stopped|disabled|muted)|\b(?:pause|stop|disable|mute)\s+(?:monitoring|measurement|alerts?)/i.test(
      allSource,
    )
  ) {
    failures.push('safety-critical products must keep monitoring active and use the action for a safe workflow state such as acknowledgement');
  }
  if (
    safetyCriticalProduct &&
    /\b(?:needs review|acknowledge(?:d)?)\b/i.test(allSource) &&
    !/\b(?:alert|event|excursion|door|threshold|outside|rose|fell|rise|drop)\b/i.test(
      allSource,
    )
  ) {
    failures.push('safety-critical acknowledgement requires a concrete alert, event, excursion, door condition, or threshold reason');
  }

  if (failures.length > 0) {
    console.error('\nStatus action production pattern failed:');
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

console.log('\nUI Toolkit for Meta Ray-Ban Display status action verification passed.');
