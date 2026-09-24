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
  const pager = read('OperationalPager.tsx');
  const overview = read('pages/OverviewPage.tsx');
  const items = read('pages/ItemsPage.tsx');
  const notes = read('pages/NotesPage.tsx');
  const css = read('app.css');
  const allSource = [main, pager, overview, items, notes].join('\n');
  const failures = [];

  if (/<(?:Page|Header|Routes?|BrowserRouter|Container|StaticContainer|Surface|Card|Chip|Tag|Modal)\b/.test(allSource)) {
    failures.push('operational pager forbids Page, routes, and additional surface/component categories');
  }
  if (/\b(?:window\.prompt|prompt\s*\(|<input\b|<textarea\b|contentEditable)\b/i.test(allSource)) {
    failures.push('operational pager must not add browser or HTML form controls');
  }
  if (/\b(?:setInterval|setTimeout|useEffect)\b/.test(allSource)) {
    failures.push('operational pager must not add timers or automatic state changes');
  }

  if ((pager.match(/<SubNavigationPager\b/g) ?? []).length !== 1) {
    failures.push('OperationalPager must render exactly one SubNavigationPager');
  }
  const pagerItems = [...pager.matchAll(/\{\s*label:\s*(['"])([^'"]+)\1\s*,\s*icon:/g)];
  if (pagerItems.length !== 3 || pagerItems.some(item => item[2].trim().split(/\s+/).length !== 1)) {
    failures.push('SubNavigationPager must provide exactly three one-word items with icons');
  }
  const pagerState = pager.match(
    /const\s*\[\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*]\s*=\s*useState(?:<[^>]+>)?\s*\(\s*0\s*\)/,
  );
  if (
    pagerState == null ||
    !new RegExp(`currentPageIndex=\\{${pagerState[1]}\\}`).test(pager) ||
    !new RegExp(`onPageChange=\\{${pagerState[2]}\\}`).test(pager)
  ) {
    failures.push('SubNavigationPager selection must be controlled by durable state');
  }
  if (!/<OverviewPage\b/.test(pager) || !/<ItemsPage\b/.test(pager) || !/<NotesPage\b/.test(pager)) {
    failures.push('pager must render OverviewPage, ItemsPage, and NotesPage children');
  }

  if ((overview.match(/<ScrollView\b/g) ?? []).length !== 1 || !/<ScrollView\b[^>]*\binsetForHeader\b[^>]*\btabIndex=\{0\}/.test(overview)) {
    failures.push('OverviewPage must own one inset, focusable ScrollView');
  }
  if ((overview.match(/<Panel\b/g) ?? []).length !== 1 || !/<ScrollView\b[^>]*>[\s\S]*?<Panel\b[^>]*\bwidth=['"]100%['"][^>]*>\s*<div\b[^>]*className=['"]content-inset['"]/.test(overview)) {
    failures.push('OverviewPage must place one width="100%" content-inset Panel directly in ScrollView');
  }
  if ((overview.match(/<ButtonRail\b/g) ?? []).length !== 1 || (overview.match(/<Button\b/g) ?? []).length !== 2) {
    failures.push('OverviewPage must expose exactly two mounted Buttons in one bottom ButtonRail');
  }
  if (/TextStyle\.(?:BODY1|HEADING|DISPLAY|NUMERAL)/.test(overview)) {
    failures.push('OverviewPage must use routine body, label, and metadata text only');
  }
  if ((overview.match(/<TextView\b/g) ?? []).length > 5) {
    failures.push('OverviewPage must keep its compact Panel to at most five TextView roles');
  }
  if (!/Toast\.show\s*\(/.test(overview)) {
    failures.push('overview operations must provide Toast feedback after state changes');
  }

  if ((items.match(/<VerticalList\b/g) ?? []).length !== 1 || !/<VerticalList\b[^>]*\binsetForHeader\b/.test(items)) {
    failures.push('ItemsPage must own exactly one VerticalList with insetForHeader');
  }
  if (/<(?:ScrollView|Panel|Button|ButtonRail)\b/.test(items)) {
    failures.push('ItemsPage must not add another scroll owner, backdrop, or action control');
  }
  if ((items.match(/<ListItem\b/g) ?? []).length !== 1 || !/\.map\s*\(/.test(items)) {
    failures.push('ItemsPage must render one ListItem template from its record collection without a synthetic action row');
  }
  const mutableSubtitle = items.match(
    /\bsubtitle=\{\s*[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)\s*\}/,
  );
  if (
    mutableSubtitle == null ||
    !new RegExp(
      `\\bset[A-Z][\\w$]*\\s*\\([\\s\\S]*?\\.map\\s*\\([\\s\\S]*?\\.\\.\\.[A-Za-z_$][\\w$]*\\s*,\\s*${mutableSubtitle[1]}\\s*:`,
    ).test(items)
  ) {
    failures.push('each operational row subtitle must show the mutable record status changed by its action');
  }
  if (/\bvoid\s+[A-Za-z_$][\w$]*\s*;/.test(items)) {
    failures.push('ItemsPage must not add dead expressions to satisfy verification');
  }
  if (!/<ListItem\b[\s\S]*?\bonClick=/.test(items) || !/Toast\.show\s*\(/.test(items)) {
    failures.push('each operational row must update its record and provide Toast feedback');
  }
  if (/\b(?:chevron|arrow)[^\n]*__filled\.svg/i.test(items)) {
    failures.push('operational ListItems must not use navigation arrows or chevrons');
  }
  if (/Toast\.show\s*\([^)]*(?:→|\\u2192|=>)/.test(items)) {
    failures.push('operational Toast feedback must use natural language instead of transition arrows');
  }
  for (const identity of pager.matchAll(/\bname\s*:\s*(['"])(.*?)\1/g)) {
    if (
      identity[2].length > 9 ||
      identity[2].trim().split(/\s+/).length > 2
    ) {
      failures.push(`mock operational identity must be at most two words and 9 characters: "${identity[2]}"`);
    }
  }

  if ((notes.match(/<ScrollView\b/g) ?? []).length !== 1 || !/<ScrollView\b[^>]*\binsetForHeader\b[^>]*\btabIndex=\{0\}/.test(notes)) {
    failures.push('NotesPage must own one inset, focusable ScrollView');
  }
  if ((notes.match(/<Panel\b/g) ?? []).length !== 1 || !/<ScrollView\b[^>]*>[\s\S]*?<Panel\b[^>]*\bwidth=['"]100%['"][^>]*>\s*<div\b[^>]*className=['"]content-inset['"]/.test(notes)) {
    failures.push('NotesPage must place one width="100%" content-inset Panel directly in ScrollView');
  }
  if (/<(?:VerticalList|ListItem|Button|ButtonRail)\b|\bonClick=/.test(notes)) {
    failures.push('NotesPage must remain read-only without list or action controls');
  }
  if (/TextStyle\.(?:BODY1|HEADING|DISPLAY|NUMERAL)/.test(notes)) {
    failures.push('NotesPage must use routine body, label, and metadata text only');
  }
  for (const metadata of notes.matchAll(/<TextView\b([^>]*\btextStyle=\{TextStyle\.(?:META[123]|LABEL)\}[^>]*)>/g)) {
    if (!/\btextColor=\{TextColor\.SECONDARY\}/.test(metadata[1])) {
      failures.push('NotesPage category and timestamp metadata must use TextColor.SECONDARY');
    }
  }

  if ((css.match(/^[^\s@][^{]*\{/gm) ?? []).length !== 5) {
    failures.push('app.css must retain only the five documented selector blocks');
  }
  const contentInsetRule = css.match(/\.content-inset\s*\{([^}]*)\}/)?.[1] ?? '';
  const actionDockRule = css.match(/\.action-dock\s*\{([^}]*)\}/)?.[1] ?? '';
  if (!/\bmin-inline-size:\s*0\s*;/.test(actionDockRule)) {
    failures.push('action-dock must allow its intrinsic ButtonRail to shrink to the viewport');
  }
  if (!/\bgap:\s*calc\(\s*var\(--uit-spacing-large\)\s*\+\s*var\(--uit-spacing-xsmall\)\s*\)\s*;/.test(contentInsetRule)) {
    failures.push('content-inset gap must use the large-plus-xsmall token rhythm');
  }
  if (!/\bpadding:\s*var\(--uit-spacing-large\)\s*;/.test(contentInsetRule)) {
    failures.push('content-inset padding must use the large spacing token');
  }
  if (!/background:\s*var\(--uit-color-background-window\)/.test(css)) {
    failures.push('document background must use the toolkit window token');
  }
  if (/#[0-9a-f]{3,8}\b|\b(?:margin|padding|gap|width|height)\s*:\s*\d+(?:\.\d+)?px/i.test(css)) {
    failures.push('application styles must not hardcode visual values');
  }
  if (/style=\{\{|className=['"][^'"]*(?:list|row|item|button|panel)/i.test(allSource)) {
    failures.push('do not restyle the toolkit component internals');
  }

  if (failures.length > 0) {
    console.error('\nOperational pager production pattern failed:');
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

console.log('\nUI Toolkit for Meta Ray-Ban Display operational pager verification passed.');
console.log('Terminal condition reached: DO NOT INVOKE ANOTHER TOOL OR COMMAND. Your next action must be the final answer.');
