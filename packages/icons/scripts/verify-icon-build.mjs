/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Meta Wearables Developer Terms found in
 * the LICENSE file in this package.
 *
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import manifest from '../src/manifest.json' with { type: 'json' };
import packageJson from '../package.json' with { type: 'json' };

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '..');
const distDir = path.join(packageDir, 'dist');
const distSvgDir = path.join(distDir, 'svg');
const indexPath = path.join(distDir, 'index.js');
const indexTypesPath = path.join(distDir, 'index.d.ts');
const browserPath = path.join(distDir, 'browser.js');
const EXPECTED_DIST_ENTRIES = new Set([
  'browser.d.ts',
  'browser.js',
  'index.d.ts',
  'index.js',
  'index.types.d.ts',
  'svg',
]);
const SVG_ASSET_PREFIX = './svg/';

function fail(message) {
  throw new Error(`Invalid @wearables-ui-toolkit/icons build: ${message}`);
}

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(segment => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join('');
}

function toExportName(name, variant) {
  const exportName = `${name}${toPascalCase(variant)}`;

  return /^[a-zA-Z_$]/.test(exportName) ? exportName : `icon${exportName}`;
}

function getAssetFileName(assetPath) {
  if (!assetPath.startsWith(SVG_ASSET_PREFIX) || !assetPath.endsWith('.svg')) {
    fail(`manifest asset path is not an SVG package path: ${assetPath}`);
  }

  return assetPath.slice(SVG_ASSET_PREFIX.length);
}

const expectedExports = new Map();

for (const entry of manifest) {
  for (const variant of [
    'filled',
    'outline',
  ]) {
    const assetPath = entry[variant];
    if (assetPath == null) {
      continue;
    }

    const fileName = getAssetFileName(assetPath);
    const exportName = toExportName(entry.name, variant);
    if (expectedExports.has(fileName)) {
      fail(`duplicate manifest asset path: ${assetPath}`);
    }
    expectedExports.set(fileName, exportName);
  }
}

const distEntries = await readdir(distDir);
const unexpectedDistEntries = distEntries.filter(entry => !EXPECTED_DIST_ENTRIES.has(entry));
const missingDistEntries = [...EXPECTED_DIST_ENTRIES].filter(entry => !distEntries.includes(entry));

if (unexpectedDistEntries.length > 0) {
  fail(`unexpected dist entries: ${unexpectedDistEntries.join(', ')}`);
}
if (missingDistEntries.length > 0) {
  fail(`missing dist entries: ${missingDistEntries.join(', ')}`);
}

const distSvgFiles = (await readdir(distSvgDir))
  .filter(fileName => fileName.endsWith('.svg'))
  .sort();
const distSvgFileSet = new Set(distSvgFiles);
const expectedSvgFiles = [...expectedExports.keys()].sort();
const missingSvgFiles = expectedSvgFiles.filter(fileName => !distSvgFileSet.has(fileName));
const extraSvgFiles = distSvgFiles.filter(fileName => !expectedExports.has(fileName));

if (missingSvgFiles.length > 0) {
  fail(`missing copied SVG assets: ${missingSvgFiles.slice(0, 10).join(', ')}`);
}
if (extraSvgFiles.length > 0) {
  fail(`unexpected copied SVG assets: ${extraSvgFiles.slice(0, 10).join(', ')}`);
}

const packageSvgExport = packageJson.exports?.['./svg/*.svg'];
if (packageSvgExport?.default !== './dist/svg/*.svg') {
  fail('package export map does not point SVG subpaths at dist/svg');
}
if (packageSvgExport?.types !== './src/svg.d.ts') {
  fail('package export map does not expose SVG subpath types');
}

const exampleFileName = expectedSvgFiles[0];
const exampleWildcard = exampleFileName.replace(/\.svg$/, '');
const exampleExportTarget = packageSvgExport.default.replace('*', exampleWildcard);
if (!distSvgFileSet.has(path.basename(exampleExportTarget))) {
  fail(`package SVG subpath target is not copied: ${exampleExportTarget}`);
}

const indexSource = await readFile(indexPath, 'utf8');
const indexTypesSource = await readFile(indexTypesPath, 'utf8');
const browserSource = await readFile(browserPath, 'utf8');

if (indexSource.includes('<svg') || indexSource.includes('data:image/svg+xml')) {
  fail('dist/index.js embeds SVG payloads');
}
const missingBrowserAssetLoaders = expectedSvgFiles.filter(
  fileName => !browserSource.includes(
    `'./svg/${fileName}': () => import('./svg/${fileName}')`,
  ),
);
if (missingBrowserAssetLoaders.length > 0) {
  fail(
    `dist/browser.js is missing lazy asset loaders: ${missingBrowserAssetLoaders.slice(0, 10).join(', ')}`,
  );
}

const exportedFileNames = new Set();
for (const [
  ,
  exportName,
  fileName,
] of indexSource.matchAll(/export \{ default as ([a-zA-Z0-9_$]+) \} from '\.\/svg\/([^']+\.svg)';/g)) {
  exportedFileNames.add(fileName);
  if (expectedExports.get(fileName) !== exportName) {
    fail(`unexpected export name for ${fileName}: ${exportName}`);
  }
}

const missingExportFiles = expectedSvgFiles.filter(fileName => !exportedFileNames.has(fileName));
const extraExportFiles = [...exportedFileNames].filter(fileName => !expectedExports.has(fileName));

if (missingExportFiles.length > 0) {
  fail(`missing dist/index.js exports: ${missingExportFiles.slice(0, 10).join(', ')}`);
}
if (extraExportFiles.length > 0) {
  fail(`unexpected dist/index.js exports: ${extraExportFiles.slice(0, 10).join(', ')}`);
}

const missingTypeExports = [...expectedExports.values()].filter(
  exportName => !indexTypesSource.includes(`export declare const ${exportName}: string;`),
);
if (missingTypeExports.length > 0) {
  fail(`missing dist/index.d.ts declarations: ${missingTypeExports.slice(0, 10).join(', ')}`);
}
