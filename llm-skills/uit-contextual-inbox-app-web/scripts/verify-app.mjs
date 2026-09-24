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
  const app = read('App.tsx');
  const main = read('main.tsx');
  const styles = read('index.css');
  const allSource = [app, main, styles].join('\n');
  const failures = [];

  if ((app.match(/<Page\b/g) ?? []).length !== 1) {
    failures.push('application must contain exactly one Page');
  }
  if ((app.match(/<VerticalList\b/g) ?? []).length !== 1) {
    failures.push('application must contain exactly one root VerticalList');
  }
  if (!/<Page\b[^>]*\bheaderText=/.test(app)) {
    failures.push('Page must provide its concise page header through headerText');
  }
  if (!/<VerticalList\b[^>]*\binsetForHeader\b/.test(app)) {
    failures.push('root VerticalList must use insetForHeader');
  }
  if (/<(?:ScrollView|Panel|Container|Button|ButtonRail|Divider)\b/.test(app)) {
    failures.push('contextual inbox must not add another scroll owner, backdrop, container, or persistent action control');
  }

  if (!/\.map\s*\(/.test(app) || !/<ListItem\b/.test(app)) {
    failures.push('records must render as adjacent ListItems in the VerticalList');
  }
  const titleField = app.match(
    /\btitle=\{\s*[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)\s*\}/,
  )?.[1];
  if (titleField == null) {
    failures.push('ListItem title must be exactly one record identity field, not a composed template');
  } else {
    const identityPattern = new RegExp(
      `\\b${titleField}\\s*:\\s*(['"])(.*?)\\1`,
      'g',
    );
    for (const identity of app.matchAll(identityPattern)) {
      if (
        identity[2].length > 9 ||
        identity[2].trim().split(/\s+/).length > 2
      ) {
        failures.push(`mock row identity must be at most two words and 9 characters: "${identity[2]}"`);
      }
    }
  }
  for (const subtitle of app.matchAll(/\bsubtitle=\{`([^`]*)`\}/g)) {
    const interpolations = subtitle[1].match(/\$\{/g) ?? [];
    if (interpolations.length > 1 && !subtitle[1].includes('·')) {
      failures.push('multi-field ListItem subtitle must separate its two facts with a middle dot');
    }
  }
  if (!/\bariaLabel=(['"])Open actions\1/.test(app)) {
    failures.push('every ListItem trigger must use ariaLabel="Open actions" and let ListItem append its visible record text');
  }
  if (/\baria(?:Label|-label)=\{[^}]*[Oo]pen actions for/.test(app)) {
    failures.push('ListItem ariaLabel must not repeat the record name that ListItem already appends');
  }
  if (/\b(?:chevron|arrow)[^\n]*__filled\.svg/i.test(app)) {
    failures.push('ListItems must not use navigation arrows or chevrons');
  }
  if (!/Map\s*<\s*string\s*,\s*HTMLDivElement\s*>/.test(app)) {
    failures.push('ListItem refs must be stored by record id as HTMLDivElement values');
  }
  if (/HTMLButtonElement|\bas\s+HTMLDivElement\b/.test(app)) {
    failures.push('ListItem refs must use HTMLDivElement without a type cast');
  }

  if ((app.match(/<VerticalMenu\b/g) ?? []).length !== 1) {
    failures.push('mapped ListItems must share one declarative VerticalMenu template');
  }
  const menuButtons = app.match(/<VerticalMenuButton\b/g) ?? [];
  if (menuButtons.length < 2 || menuButtons.length > 3) {
    failures.push('VerticalMenu must contain two or three concise commands');
  }
  if (!/tooltipMode=\{[^}]*TooltipMode\.ALWAYS[^}]*TooltipMode\.NONE[^}]*\}/s.test(app)) {
    failures.push('only the open record may expose its tooltip menu');
  }
  if (!/tooltipContent=\{\s*<VerticalMenu\b/s.test(app)) {
    failures.push('VerticalMenu must be supplied through the ListItem tooltipContent prop');
  }
  if (!/getVerticalMenuAnchorProps\(\s*VerticalMenuCorner\.ABOVE_RIGHT\s*\)/.test(app)) {
    failures.push('ListItem menu must use the ABOVE_RIGHT public anchor props');
  }
  if (!/\.stopPropagation\s*\(\s*\)/.test(app)) {
    failures.push('menu command activation must stop propagation before dismissal');
  }
  const menuButtonTags = app.match(/<VerticalMenuButton\b[\s\S]*?\/>/g) ?? [];
  for (const tag of menuButtonTags) {
    const staticText = tag.match(/\btext=(['"])(.*?)\1/)?.[2];
    const expressionText = tag.match(/\btext=\{([^}]*)\}/)?.[1];
    const labels = staticText == null
      ? [...(expressionText ?? '').matchAll(/(['"])(.*?)\1/g)].map(match => match[2])
      : [staticText];
    for (const label of labels) {
      if (label.length > 10) {
        failures.push(`VerticalMenu command must be at most 10 characters: "${label}"`);
      }
    }
  }
  const disabledExpressions = menuButtonTags.map(tag =>
    tag.match(/\bdisabled=\{([^}]+)\}/)?.[1]?.replace(/\s+/g, ' ').trim(),
  );
  if (
    disabledExpressions.length > 1 &&
    disabledExpressions.every(Boolean) &&
    new Set(disabledExpressions).size === 1
  ) {
    failures.push('retained rows must not expose a menu where one terminal-state expression disables every command');
  }

  const focusRestores = app.match(
    /rowRefs\.current\.get\s*\([^)]*\)\?\.focus\s*\(\s*\{\s*preventScroll\s*:\s*true\s*\}\s*\)/g,
  ) ?? [];
  if (focusRestores.length < menuButtons.length + 1) {
    failures.push('Back dismissal and every menu command must explicitly restore ListItem focus without scrolling');
  }
  if (!/onDismissRequest=\{[\s\S]*?setOpenRecordId\(null\)[\s\S]*?requestAnimationFrame\s*\(/.test(app)) {
    failures.push('onDismissRequest must close the menu and restore trigger focus on the next frame');
  }
  if (/\b(?:pushState|replaceState|popstate|useBackNavigation)\b/.test(app)) {
    failures.push('VerticalMenu owns transient Back history; application source must not add history entries or Back listeners');
  }
  if (!/<Toast\b/.test(app) && !/Toast\.show\s*\(/.test(app)) {
    failures.push('menu command results must provide concise Toast feedback');
  }

  if (!/background:\s*var\(--uit-color-background-window\)/.test(styles)) {
    failures.push('document background must use the toolkit window color token');
  }
  if (/#[0-9a-f]{3,8}\b|\b(?:margin|padding|gap|width|height)\s*:\s*\d+(?:\.\d+)?px/i.test(styles)) {
    failures.push('application styles must not hardcode visual values or authored spacing');
  }
  if (/style=\{\{|className=['"][^'"]*(?:list|row|menu|item)/i.test(app)) {
    failures.push('do not restyle the toolkit list, row, or menu internals');
  }
  if (/exemption[^\n]*validat|validat[^\n]*exemption/i.test(allSource)) {
    failures.push('application source must not contain validator-exemption comments');
  }

  if (failures.length > 0) {
    console.error('\nContextual inbox production pattern failed:');
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

console.log('\nUI Toolkit for Meta Ray-Ban Display contextual inbox verification passed.');
