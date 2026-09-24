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
  const tabbed = read('TabbedControls.tsx');
  const controls = read('pages/ControlsPage.tsx');
  const modes = read('pages/ModesPage.tsx');
  const state = read('ControlContext.tsx');
  const allSource = [tabbed, controls, modes, state, read('main.tsx')].join('\n');
  const failures = [];

  if ((allSource.match(/<SubNavigationPager\b/g) ?? []).length !== 1) {
    failures.push('application must contain exactly one SubNavigationPager');
  }
  if (/<Page\b|<Button(?:Rail|Group)?\b|<ScrollView\b/.test(allSource)) {
    failures.push('tabbed controls pattern forbids Page, Button actions, and ScrollView');
  }
  if ((controls.match(/<VerticalList\b[^>]*\binsetForHeader\b/g) ?? []).length !== 1) {
    failures.push('ControlsPage must own one VerticalList with insetForHeader');
  }
  if ((modes.match(/<VerticalList\b[^>]*\binsetForHeader\b/g) ?? []).length !== 1) {
    failures.push('ModesPage must own one VerticalList with insetForHeader');
  }
  if (!/<ListItem\b[\s\S]*?\bshowSwitch\b[\s\S]*?\bonCheckedChange=/.test(controls)) {
    failures.push('ControlsPage rows must use integrated controlled switches');
  }
  if (!/<ListItem\b[\s\S]*?\bshowRadioButton\b[\s\S]*?\bonCheckedChange=/.test(modes)) {
    failures.push('ModesPage rows must use integrated controlled radios');
  }
  const usesAudioLabels = /label:\s*['"]Output['"]/.test(tabbed) &&
    /label:\s*['"]Mic['"]/.test(tabbed);
  const usesGeneralLabels = /label:\s*['"]Controls['"]/.test(tabbed) &&
    /label:\s*['"]Modes['"]/.test(tabbed);
  if (!usesAudioLabels && !usesGeneralLabels) {
    failures.push('pager must use one documented one-word category preset');
  } else if (
    usesAudioLabels &&
    (!/speakerslider__filled\.svg/.test(tabbed) ||
      !/microphone__filled\.svg/.test(tabbed))
  ) {
    failures.push('Output and Mic categories must use the speaker-slider and microphone filled icons');
  } else if (
    usesGeneralLabels &&
    (!/sliders2horizontal__filled\.svg/.test(tabbed) ||
      !/circlecheck__filled\.svg/.test(tabbed))
  ) {
    failures.push('Controls and Modes categories must use the sliders and checkmark filled icons');
  }

  for (const match of state.matchAll(/\bsubtitle\s*:\s*(['"])(.*?)\1/g)) {
    const subtitle = match[2];
    if (subtitle.length > 14) {
      failures.push(
        `integrated-control subtitle must be at most 14 characters: "${subtitle}"`,
      );
    }
  }

  const controlBlock = state.match(
    /(?:initialControls|controls)\s*:\s*Control\[\]\s*=\s*\[([\s\S]*?)\];/,
  )?.[1] ?? '';
  for (const title of controlBlock.matchAll(/\btitle\s*:\s*(['"])(.*?)\1/g)) {
    if (/\b(?:balance|volume|intensity|level|pan|position)\b/i.test(title[2])) {
      failures.push(`switch control is not genuinely binary: "${title[2]}"`);
    }
  }
  for (const subtitle of controlBlock.matchAll(/\bsubtitle\s*:\s*(['"])(.*?)\1/g)) {
    if (/\b(?:on|off|enabled|disabled|active|inactive|centered|muted|unmuted)\b/i.test(subtitle[2])) {
      failures.push(`static switch subtitle asserts mutable state: "${subtitle[2]}"`);
    }
  }

  if (usesAudioLabels) {
    const audioModeCopy = new Map(
      [...state.matchAll(/\{[^{}]*\btitle\s*:\s*(['"])(.*?)\1[^{}]*\bsubtitle\s*:\s*(['"])(.*?)\3[^{}]*\}/g)]
        .map(match => [match[2], match[4]]),
    );
    if (audioModeCopy.get('Figure-8') !== 'Front + back') {
      failures.push('Figure-8 mode must describe its front-and-back pickup accurately');
    }
    if (audioModeCopy.get('Shotgun') !== 'Narrow focus') {
      failures.push('Shotgun mode must describe its narrow directional focus accurately');
    }
  }

  if (failures.length > 0) {
    console.error('\nTabbed controls production pattern failed:');
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

console.log('\nUI Toolkit for Meta Ray-Ban Display tabbed controls verification passed.');
