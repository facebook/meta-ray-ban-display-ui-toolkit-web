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

import {
  describe,
  expect,
  it,
} from 'vitest';
import keywordIndex from './keyword-index.json';
import manifest from './manifest.json';
import packageJson from '../package.json';
import * as iconExports from './index';
import { loadUITIconAssetUrl } from './browser';
import type {
  UITIconAssetPath,
  UITIconKeywordIndex,
  UITIconManifestEntry,
} from './index';

const DARK_PAINT_VALUES = new Set([
  'black',
  '#000',
  '#000000',
  '#111112',
]);
const ICON_ENTRIES = manifest as readonly UITIconManifestEntry[];
const KEYWORD_INDEX = keywordIndex as UITIconKeywordIndex;
const PACKAGE_EXPORTS = packageJson.exports as Record<string, unknown>;
const SVG_ASSETS = import.meta.glob<string>('./svg/*.svg', {
  eager: true,
  import: 'default',
  query: '?raw',
});
const SVG_ASSET_PATHS = new Set(Object.keys(SVG_ASSETS));

function getVariantAssetPaths(
  entry: UITIconManifestEntry,
): readonly UITIconAssetPath[] {
  return [
    entry.filled,
    entry.outline,
  ].filter((assetPath): assetPath is UITIconAssetPath => assetPath != null);
}

function getManifestAssetPaths(
  entry: UITIconManifestEntry,
): readonly UITIconAssetPath[] {
  return [
    entry.default,
    ...getVariantAssetPaths(entry),
  ];
}

function hasDarkPaint(svgSource: string): boolean {
  const paintAttributes = svgSource.matchAll(/(fill|stroke)="([^"]+)"/g);

  for (const match of paintAttributes) {
    if (DARK_PAINT_VALUES.has(match[2].toLowerCase())) {
      return true;
    }
  }

  return false;
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(segment => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join('');
}

function toExportName(assetPath: UITIconAssetPath): string {
  const iconEntry = ICON_ENTRIES.find(entry =>
    [
      entry.filled,
      entry.outline,
    ].includes(assetPath),
  );
  const variant = iconEntry?.filled === assetPath ? 'filled' : 'outline';
  const exportName = `${iconEntry?.name ?? ''}${toPascalCase(variant)}`;

  return /^[a-zA-Z_$]/.test(exportName) ? exportName : `icon${exportName}`;
}

describe('UI Toolkit public icon assets', () => {
  it('exports extension-bearing SVG asset subpaths', () => {
    expect(PACKAGE_EXPORTS['./svg/*.svg']).toEqual({
      types: './src/svg.d.ts',
      default: './dist/svg/*.svg',
    });
    expect(PACKAGE_EXPORTS).not.toHaveProperty('./svg/*');
  });

  it('exports each SVG asset as a tree-shakeable named ESM export', () => {
    const variantAssetPaths = ICON_ENTRIES.flatMap(getVariantAssetPaths);
    const missingExportNames = variantAssetPaths
      .map(toExportName)
      .filter(exportName => !(exportName in iconExports));
    const unexpectedRegistryExportNames = [
      'UITIcons',
      'icons',
      'iconRegistry',
    ].filter(exportName => exportName in iconExports);

    expect(missingExportNames).toEqual([]);
    expect(unexpectedRegistryExportNames).toEqual([]);
    expect(packageJson.sideEffects).toBe(false);
  });

  it('lazily resolves browser asset URLs from package asset paths', async () => {
    await expect(loadUITIconAssetUrl('./svg/accessibility__filled.svg')).resolves.toBe(
      iconExports.accessibilityFilled,
    );
    expect(loadUITIconAssetUrl('./svg/missing.svg')).toBeUndefined();
  });

  it('contains the cleared public asset set', () => {
    const variantAssetPaths = ICON_ENTRIES.flatMap(getVariantAssetPaths);

    expect(ICON_ENTRIES).toHaveLength(851);
    expect(variantAssetPaths).toHaveLength(1460);
    expect(new Set(variantAssetPaths).size).toBe(variantAssetPaths.length);
  });

  it('only references SVG assets that are included in the package', () => {
    const missingAssetPaths = ICON_ENTRIES
      .flatMap(getManifestAssetPaths)
      .filter(assetPath => !SVG_ASSET_PATHS.has(assetPath));

    expect(missingAssetPaths).toEqual([]);
  });

  it('ships only manifest-referenced SVG assets', () => {
    const manifestAssetPaths = new Set(ICON_ENTRIES.flatMap(getManifestAssetPaths));
    const extraAssetPaths = Object.keys(SVG_ASSETS)
      .filter(assetPath => !manifestAssetPaths.has(assetPath as UITIconAssetPath));

    expect(extraAssetPaths).toEqual([]);
  });

  it('normalizes dark SVG paint values to white', () => {
    const darkPaintAssetPaths = Object.entries(SVG_ASSETS)
      .filter(([, svgSource]) => hasDarkPaint(svgSource))
      .map(([assetPath]) => assetPath);

    expect(darkPaintAssetPaths).toEqual([]);
  });

  it('maps keywords only to known public icon names', () => {
    const iconNames = new Set(ICON_ENTRIES.map(entry => entry.name));
    const missingKeywordMappings = ICON_ENTRIES.flatMap(entry =>
      entry.keywords
        .filter(keyword => !KEYWORD_INDEX[keyword]?.includes(entry.name))
        .map(keyword => `${keyword}:${entry.name}`)
    );
    const unknownKeywordIconNames = Object.entries(KEYWORD_INDEX).flatMap(
      ([keyword, names]) =>
        names
          .filter(name => !iconNames.has(name))
          .map(name => `${keyword}:${name}`),
    );

    expect(missingKeywordMappings).toEqual([]);
    expect(unknownKeywordIconNames).toEqual([]);
  });
});
