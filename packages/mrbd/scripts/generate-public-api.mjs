/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  packageSubpathExports,
  publicApiSections,
} from './public-api-manifest.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '..');
const indexPath = path.join(packageDir, 'src', 'index.ts');
const packageJsonPath = path.join(packageDir, 'package.json');
const shouldCheck = process.argv.includes('--check');

const HEADER = [
  '/**',
  ' * Copyright (c) Meta Platforms, Inc. and affiliates.',
  ' *',
  ' * This source code is licensed under the Apache License, Version 2.0 found in the',
  ' * LICENSE file in the root directory of this source tree.',
  ' *',
  ' */',
  '',
  '/**',
  ' * Public API exports for UI Toolkit for Meta Ray-Ban Display.',
  ' *',
  ' * Generated from scripts/public-api-manifest.mjs.',
  ' */',
  '',
];

function fail(message) {
  throw new Error(`Invalid @wearables-ui-toolkit/mrbd public API manifest: ${message}`);
}

function assertPublicSource(source) {
  if (source == null || source === '') {
    fail('missing source path');
  }
  if (source.startsWith('.') || source.startsWith('/') || source.includes('\\')) {
    fail(`source must be package-src relative without a leading dot: ${source}`);
  }
  if (source.split('/').includes('private')) {
    fail(`public API source must not point at private code: ${source}`);
  }
}

function moduleSpecifier(source) {
  return source.startsWith('@') ? source : `./${source}`;
}

function formatNamedExport(kind, names, source) {
  if (names == null || names.length === 0) {
    return [];
  }

  const prefix = kind === 'type' ? 'export type' : 'export';
  if (names.length === 1) {
    return [`${prefix} { ${names[0]} } from '${moduleSpecifier(source)}';`];
  }

  return [
    `${prefix} {`,
    ...names.map(name => `  ${name},`),
    `} from '${moduleSpecifier(source)}';`,
  ];
}

function renderIndex() {
  const lines = [...HEADER];

  for (const section of publicApiSections) {
    lines.push(`// ${section.title}`);

    for (const entry of section.exports) {
      assertPublicSource(entry.source);

      if (entry.comments != null) {
        for (const comment of entry.comments) {
          lines.push(`// ${comment}`);
        }
      }

      if (entry.exportAll === true) {
        lines.push(`export * from '${moduleSpecifier(entry.source)}';`);
      }

      lines.push(...formatNamedExport('value', entry.values, entry.source));
      lines.push(...formatNamedExport('type', entry.types, entry.source));
    }

    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function renderPackageExports() {
  const exportsMap = {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
    },
    './styles.css': './dist/styles.css',
    './package.json': './package.json',
  };
  const seenSubpaths = new Set();

  for (const entry of packageSubpathExports) {
    assertPublicSource(entry.source);
    if (entry.source.startsWith('@')) {
      continue;
    }
    if (entry.subpath == null || entry.subpath === '') {
      fail('missing package subpath');
    }
    if (entry.subpath.startsWith('.') || entry.subpath.startsWith('/')) {
      fail(`package subpath must not start with a path marker: ${entry.subpath}`);
    }
    if (seenSubpaths.has(entry.subpath)) {
      fail(`duplicate package subpath export: ${entry.subpath}`);
    }
    seenSubpaths.add(entry.subpath);

    exportsMap[`./${entry.subpath}`] = {
      types: `./dist/${entry.source}.d.ts`,
      import: `./dist/${entry.source}.js`,
    };
  }

  return exportsMap;
}

function validateManifest() {
  const valueExports = new Set();
  const typeExports = new Set();

  for (const section of publicApiSections) {
    if (section.title == null || section.title === '') {
      fail('section is missing a title');
    }

    for (const entry of section.exports) {
      assertPublicSource(entry.source);

      for (const name of entry.values ?? []) {
        if (valueExports.has(name)) {
          fail(`duplicate value export: ${name}`);
        }
        valueExports.add(name);
      }

      for (const name of entry.types ?? []) {
        if (typeExports.has(name)) {
          fail(`duplicate type export: ${name}`);
        }
        typeExports.add(name);
      }
    }
  }

  renderPackageExports();
}

async function writeOrCheck(filePath, expectedContents) {
  if (!shouldCheck) {
    await writeFile(filePath, expectedContents);
    return;
  }

  const actualContents = await readFile(filePath, 'utf8');
  if (actualContents !== expectedContents) {
    throw new Error(
      `${path.relative(packageDir, filePath)} is stale. Run \`yarn generate\` in packages/mrbd.`,
    );
  }
}

validateManifest();

const nextIndex = renderIndex();
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
packageJson.exports = renderPackageExports();
const nextPackageJson = `${JSON.stringify(packageJson, null, 2)}\n`;

await writeOrCheck(indexPath, nextIndex);
await writeOrCheck(packageJsonPath, nextPackageJson);
