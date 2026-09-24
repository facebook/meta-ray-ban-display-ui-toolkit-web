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
  const main = read('main.tsx');
  const pager = read('WorkPager.tsx');
  const context = read('WorkContext.tsx');
  const today = read('pages/TodayPage.tsx');
  const done = read('pages/DonePage.tsx');
  const detail = read('pages/DetailPage.tsx');
  const domain = read('domain.ts');
  const css = read('app.css');
  const failures = [];
  const allSource = [main, pager, context, today, done, detail, domain, css].join('\n');

  if (/HTMLButtonElement/.test(today + done) || /\bas\s+HTMLButtonElement\b/.test(today + done)) {
    failures.push('ListItem refs must use HTMLDivElement without a type cast');
  }
  if (/exemption[^\n]*validat|validat[^\n]*exemption/i.test(allSource)) {
    failures.push('application source must not contain validator-exemption comments');
  }

  if (!/<Route\b[^>]*path=['"]\/['"][^>]*element=\{<WorkPager\s*\/>\}/.test(main)) {
    failures.push('root route must render WorkPager');
  }
  if (!/<Route\b[^>]*path=['"]\/job\/:id['"][^>]*element=\{<DetailPage\s*\/>\}/.test(main)) {
    failures.push('detail route must use /job/:id');
  }
  if ((pager.match(/<SubNavigationPager\b/g) ?? []).length !== 1 || /<Page\b/.test(pager)) {
    failures.push('WorkPager must contain one SubNavigationPager and no Page');
  }
  if (!/label:\s*['"]Today['"]/.test(pager) || !/label:\s*['"]Done['"]/.test(pager)) {
    failures.push('pager must expose one-word Today and Done items');
  }
  if (!/calendar__filled\.svg/.test(pager) || !/circlecheck__filled\.svg/.test(pager)) {
    failures.push('pager must use the documented filled icons');
  }
  if (!/currentPageIndex=\{pageIndex\}/.test(pager) || !/onPageChange=\{setPageIndex\}/.test(pager)) {
    failures.push('pager selection must be controlled by durable context state');
  }

  if (!/todayJobs\s*=[\s\S]{0,160}?jobs\.filter\(\s*job\s*=>\s*!\s*job\.done\)/.test(context)) {
    failures.push('context must derive Today jobs from records that are not done');
  }
  if (!/doneJobs\s*=[\s\S]{0,160}?jobs\.filter\(\s*job\s*=>\s*job\.done\)/.test(context)) {
    failures.push('context must derive Done jobs from completed records');
  }
  if (!/toggleCompleted/.test(context) || !/toggleDeferred/.test(context)) {
    failures.push('context must implement durable completion and defer operations');
  }
  if (/let\s+nextDone\b[\s\S]*?setJobs\(/.test(context)) {
    failures.push('completion must compute next state before setJobs, not mutate a local from its updater');
  }
  if (!/returnFocusId/.test(context) || !/clearReturnFocus/.test(context)) {
    failures.push('context must carry one-shot focus handoff state for records moving between pages');
  }

  for (const title of domain.matchAll(/\btitle\s*:\s*(['"])(.*?)\1/g)) {
    if (title[2].trim().split(/\s+/).length > 2) {
      failures.push(`work title must contain at most two words: "${title[2]}"`);
    }
  }
  for (const subtitle of domain.matchAll(/\bsubtitle\s*:\s*(['"])(.*?)\1/g)) {
    if (/[•·|]/.test(subtitle[2]) || subtitle[2].trim().split(/\s+/).length > 3) {
      failures.push(`work subtitle must be one short location: "${subtitle[2]}"`);
    }
  }
  if (/toLocaleString\s*\(/.test(domain) || !/formatTodayTime/.test(domain) || !/formatDoneDate/.test(domain)) {
    failures.push('domain must define separate time-only Today and date-only Done formatters');
  }

  for (const [name, page, collection] of [
    ['TodayPage', today, 'todayJobs'],
    ['DonePage', done, 'doneJobs'],
  ]) {
    if (!new RegExp(`\\b${collection}\\.map\\(`).test(page)) {
      failures.push(`${name} must render its matching derived collection`);
    }
    if (!/<VerticalList\b[^>]*\binsetForHeader\b/.test(page)) {
      failures.push(`${name} must own a VerticalList with insetForHeader`);
    }
    if (!/<ScrollView\b[^>]*\binsetForHeader\b[^>]*\btabIndex=\{0\}/.test(page)) {
      failures.push(`${name} must provide a focusable ScrollView empty branch`);
    }
    if (/<Panel\b|<Button\b/.test(page)) {
      failures.push(`${name} collection/empty branches must not use Panel or Button`);
    }
    const formatter = name === 'TodayPage' ? 'formatTodayTime' : 'formatDoneDate';
    if (!new RegExp(`\\b${formatter}\\s*\\(`).test(page)) {
      failures.push(`${name} must use ${formatter} for its timestamp slot`);
    }
    if (!/returnFocusId/.test(page) || !/clearReturnFocus/.test(page) || !/preventScroll:\s*true/.test(page)) {
      failures.push(`${name} must restore a moved record by ID and clear the handoff`);
    }
  }

  if ((detail.match(/<Panel\b/g) ?? []).length !== 1) {
    failures.push('detail route must contain exactly one Panel');
  }
  if (!/<ScrollView\b[^>]*>[\s\S]*?<Panel\b[^>]*>\s*<div\b[^>]*className=['"]content-inset['"]/.test(detail)) {
    failures.push('detail Panel must be a direct ScrollView child with content-inset');
  }
  if ((detail.match(/<Button\b/g) ?? []).length !== 2 || (detail.match(/<ButtonRail\b/g) ?? []).length !== 1) {
    failures.push('detail must expose exactly two Buttons in one ButtonRail');
  }
  if (!/toggleCompleted/.test(detail) || !/toggleDeferred/.test(detail)) {
    failures.push('detail Buttons must perform completion and defer operations');
  }
  if (/title=['"](?:Back|Home|Close)/.test(detail)) {
    failures.push('detail must not render an application return control');
  }
  const actionDockRule = css.match(/\.action-dock\s*\{([^}]*)\}/)?.[1] ?? '';
  if (!/\bmin-inline-size:\s*0\s*;/.test(actionDockRule)) {
    failures.push('action-dock must allow its intrinsic ButtonRail to shrink to the viewport');
  }

  if (failures.length > 0) {
    console.error('\nTabbed work production pattern failed:');
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

console.log('\nUI Toolkit for Meta Ray-Ban Display tabbed work verification passed.');
