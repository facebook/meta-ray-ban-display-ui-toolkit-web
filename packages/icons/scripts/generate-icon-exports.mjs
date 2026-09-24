/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Meta Wearables Developer Terms found in
 * the LICENSE file in this package.
 *
 */

/**
 * (c) Meta Platforms, Inc. and affiliates.
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import manifest from '../src/manifest.json' with { type: 'json' };

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '..');
const svgDir = path.join(packageDir, 'src', 'svg');
const indexPath = path.join(packageDir, 'src', 'index.ts');
const browserPath = path.join(packageDir, 'src', 'browser.ts');
const distIndexPath = path.join(packageDir, 'dist', 'index.js');
const distIndexTypesPath = path.join(packageDir, 'dist', 'index.d.ts');
const distBrowserPath = path.join(packageDir, 'dist', 'browser.js');
const shouldWriteDist = process.argv.includes('--dist') || process.argv.includes('--dist-types');
const shouldCheck = process.argv.includes('--check');

async function writeOrCheck(filePath, expectedContents) {
  if (!shouldCheck) {
    await writeFile(filePath, expectedContents);
    return;
  }

  const actualContents = await readFile(filePath, 'utf8');
  if (actualContents !== expectedContents) {
    throw new Error(
      `${path.relative(packageDir, filePath)} is stale. Run \`yarn generate\` in packages/icons.`,
    );
  }
}

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(segment => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join('');
}

const fileNames = (await readdir(svgDir))
  .filter(fileName => fileName.endsWith('.svg'))
  .sort();
const exportNameByFileName = new Map();

for (const entry of manifest) {
  for (const variant of [
    'filled',
    'outline',
  ]) {
    const assetPath = entry[variant];
    if (assetPath == null) {
      continue;
    }

    const fileName = assetPath.replace('./svg/', '');
    const exportName = `${entry.name}${toPascalCase(variant)}`;
    exportNameByFileName.set(
      fileName,
      /^[a-zA-Z_$]/.test(exportName) ? exportName : `icon${exportName}`,
    );
  }
}

const exportNames = new Set();
const exportEntries = [];
const headerLines = [
  '/**',
  ' * Copyright (c) Meta Platforms, Inc. and affiliates.',
  ' *',
  ' * This source code is licensed under the Meta Wearables Developer Terms found in',
  ' * the LICENSE file in this package.',
  ' *',
  ' */',
  '',
];
const sourceLines = [
  ...headerLines,
  'export type {',
  '  UITIconAssetPath,',
  '  UITIconKeywordIndex,',
  '  UITIconManifestEntry,',
  '  UITIconVariant,',
  "} from './index.types';",
  '',
];
const distTypeLines = [
  ...headerLines,
  'export type {',
  '  UITIconAssetPath,',
  '  UITIconKeywordIndex,',
  '  UITIconManifestEntry,',
  '  UITIconVariant,',
  "} from './index.types';",
  '',
];
const distJsLines = [
  ...headerLines,
];
const distBrowserLines = [
  ...headerLines,
  'const ICON_ASSET_LOADERS = {',
];
const sourceBrowserLines = [
  ...headerLines,
  "import type { UITIconAssetPath } from './index.types';",
  '',
  'type UITIconAssetLoader = () => Promise<string>;',
  '',
  'const ICON_ASSET_LOADERS: Readonly<',
  '  Partial<Record<UITIconAssetPath, UITIconAssetLoader>>',
  '> = {',
];

for (const fileName of fileNames) {
  const exportName = exportNameByFileName.get(fileName);
  if (exportName == null) {
    throw new Error(`Missing icon manifest entry for ${fileName}`);
  }
  if (exportNames.has(exportName)) {
    throw new Error(`Duplicate icon export name: ${exportName}`);
  }
  exportNames.add(exportName);
  exportEntries.push({
    exportName,
    fileName,
  });
}

for (const {
  exportName,
  fileName,
} of exportEntries) {
  sourceLines.push(`export { default as ${exportName} } from './svg/${fileName}';`);
  distJsLines.push(`export { default as ${exportName} } from './svg/${fileName}';`);
  distTypeLines.push(`export declare const ${exportName}: string;`);
  sourceBrowserLines.push(
    `  './svg/${fileName}': () => import('./svg/${fileName}').then(module => module.default),`,
  );
  distBrowserLines.push(
    `  './svg/${fileName}': () => import('./svg/${fileName}').then(module => module.default),`,
  );
}

sourceBrowserLines.push(
  '};',
  '',
  'export function loadUITIconAssetUrl(',
  '  assetPath: UITIconAssetPath,',
  '): Promise<string> | undefined {',
  '  return ICON_ASSET_LOADERS[assetPath]?.();',
  '}',
  '',
);
distBrowserLines.push(
  '};',
  '',
  'export function loadUITIconAssetUrl(assetPath) {',
  '  return ICON_ASSET_LOADERS[assetPath]?.();',
  '}',
  '',
);

await writeOrCheck(indexPath, `${sourceLines.join('\n')}\n`);
await writeOrCheck(browserPath, `${sourceBrowserLines.join('\n')}\n`);

if (shouldWriteDist) {
  await mkdir(path.dirname(distIndexPath), { recursive: true });
  await writeOrCheck(distIndexPath, `${distJsLines.join('\n')}\n`);
  await writeOrCheck(distIndexTypesPath, `${distTypeLines.join('\n')}\n`);
  await writeOrCheck(distBrowserPath, `${distBrowserLines.join('\n')}\n`);
}
