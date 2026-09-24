#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {readdirSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {dirname, extname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const workspace = process.cwd();
const sourceDirectory = resolve(workspace, process.argv[2] ?? 'src');
const requireFromWorkspace = createRequire(resolve(workspace, 'package.json'));
const scriptDirectory = dirname(fileURLToPath(import.meta.url));

function collectSource(directory) {
  const files = [];
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const location = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSource(location));
    } else if (['.css', '.ts', '.tsx'].includes(extname(entry.name))) {
      files.push(readFileSync(location, 'utf8'));
    }
  }
  return files;
}

function verifyPatternContract() {
  const source = collectSource(sourceDirectory).join('\n');
  const failures = [];

  const photoSources = Array.from(
    source.matchAll(/\bsrc\s*:\s*([A-Za-z_$][\w$]*)\s*[,}]/g),
    match => match[1],
  );

  if (/https?:\/\//.test(source)) {
    failures.push('bundle stable local media instead of remote image URLs');
  }
  if (/\.svg(?:['"]|\?)/i.test(source)) {
    failures.push('photographic media must use local raster assets, never SVG/vector stand-ins');
  }
  if (!/\.(?:png|jpe?g|webp|avif)(?:['"]|\?)/i.test(source)) {
    failures.push('media browser must import or reference local raster photographs');
  }
  if (photoSources.length === 0) {
    failures.push('media records must declare one local raster source per destination');
  } else if (new Set(photoSources).size !== photoSources.length) {
    failures.push('each media destination must use a unique photograph; never reuse one image under different copy');
  }
  const usesBundledLandscapes = /coast\.png/.test(source) &&
    /forest\.png/.test(source) && /overlook\.png/.test(source);
  if (usesBundledLandscapes && photoSources.length !== 3) {
    failures.push('the three bundled landscape photographs must produce exactly three truthful destinations');
  }
  if (usesBundledLandscapes) {
    const requiredCopy = [
      'Still water gathers between dark rocks while mist softens the distant shore.',
      'Low light catches the pools and uneven stone along the waterline.',
      'Field journal · Rocky coast',
      'A narrow path curves through moss, ferns, and sunlit trees.',
      'Warm light reaches the ground between trunks and dense green undergrowth.',
      'Field journal · Woodland path',
      'Forested ridges recede into haze beyond a rocky foreground.',
      'Soft daylight separates the layered slopes across the broad view.',
      'Field journal · Mountain overlook',
    ];
    for (const copy of requiredCopy) {
      if (!source.includes(copy)) {
        failures.push(`bundled landscape content must use the truthful canonical copy: "${copy}"`);
      }
    }
  }
  if (/\b(?:bundled|generated)\b[^\n]*\b(?:photo|photograph|asset|study)\b|\bphotograph from\b|\bno (?:structures|people) (?:are )?visible\b/i.test(source)) {
    failures.push('product copy must not expose asset provenance or defensively describe absent pixels');
  }
  if (!/<Card\b[\s\S]*?\bwidth=\{`[\s\S]*?100vi[\s\S]*?100vb[\s\S]*?--uit-spacing-small[\s\S]*?`\}/.test(source)) {
    failures.push('Card width must include the documented inline and block-space bounds');
  }
  if (!/<Card\b[^>]*\bbottomScrim=\{ScrimType\.(?:SMALL|MEDIUM|TALL|FULL)\}/.test(source)) {
    failures.push('Card must enable a bottom scrim');
  }
  const belowScrimTag = source.match(/<CardBelowScrim\b[^>]*>/)?.[0] ?? '';
  if (!/\bstyle=\{\{/.test(belowScrimTag) || !/position:\s*['"]absolute['"]/.test(belowScrimTag) || !/inset:\s*0\b/.test(belowScrimTag)) {
    failures.push('CardBelowScrim media must fill an absolute layer');
  }
  const aboveScrimTag = source.match(/<CardAboveScrim\b[^>]*>/)?.[0] ?? '';
  if (!/\bstyle=\{\{/.test(aboveScrimTag) || !/position:\s*['"]absolute['"]/.test(aboveScrimTag) || !/insetBlockEnd:\s*['"]var\(--uit-spacing-[\w-]+\)['"]/.test(aboveScrimTag)) {
    failures.push('CardAboveScrim copy must be anchored over the media layer');
  }
  if (!/<StaticContainer\b[\s\S]*?\bwidth=['"]100%['"][\s\S]*?\bheight=\{`min\([\s\S]*?100vi[\s\S]*?100vb[\s\S]*?--uit-spacing-small[\s\S]*?`\}/.test(source)) {
    failures.push('detail StaticContainer must use the full-width responsive height contract');
  }

  for (const field of source.matchAll(/\b(?:fieldLabel|eyebrow)\s*:\s*(['"])(.*?)\1/g)) {
    if (field[2] !== field[2].toLocaleUpperCase()) {
      failures.push(`eyebrow fieldLabel must be uppercase: "${field[2]}"`);
    }
  }
  if (/\b(?:source|context)\.toUpperCase\s*\(/.test(source)) {
    failures.push('source/context copy must retain natural case; uppercase only the eyebrow/category field');
  }

  if (failures.length > 0) {
    console.error('\nMedia browser production pattern failed:');
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

console.log('\nUI Toolkit for Meta Ray-Ban Display media browser verification passed.');
