#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, extname, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const CONFIGURATION_ROOT = ['.', 'llms'].join('');
const PLATFORM_IMPLEMENTATION_TERM = ['nat', 'ive'].join('');
const MOBILE_PLATFORM_TERM = ['And', 'roid'].join('');
const SOURCE_LANGUAGE_TERM = ['Kot', 'lin'].join('');
const IMPLEMENTATION_TERMS = [
  PLATFORM_IMPLEMENTATION_TERM,
  MOBILE_PLATFORM_TERM,
  SOURCE_LANGUAGE_TERM,
].join('|');
const JVM_SOURCE_EXTENSION = ['k', 't'].join('');
const RESOURCE_SOURCE_EXTENSION = ['x', 'ml'].join('');

const ALWAYS_SCANNED_ROOTS = [
  CONFIGURATION_ROOT,
  'CONTRIBUTING.md',
  'README.md',
  'examples',
  'llm-skills',
  'packages',
  'tools',
  'vitest.config.ts',
  'vitest.setup.ts',
];

const EXCLUDED_DIRECTORIES = new Set([
  'build',
  'coverage',
  'deploy',
  'dist',
  'node_modules',
  'uit-public-leak-prevention-web',
]);

const EXCLUDED_FILES = new Set([
  'packages/androidx-shapes/README.md',
  'packages/androidx-shapes/UPSTREAM.md',
  'packages/androidx-shapes/src/AndroidXShapes.ts',
  'packages/androidx-shapes/src/AndroidXShapes.types.ts',
  'tools/validate-license.mjs',
  'tools/validate-terminology.mjs',
  'tools/validate-terminology.test.mjs',
]);

const SCANNED_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mdx',
  '.mjs',
  '.ts',
  '.tsx',
]);

const PROHIBITED_PATTERNS = [
  {
    description: 'sample implementation reference',
    expression: new RegExp(`\\b${PLATFORM_IMPLEMENTATION_TERM}\\b`, 'giu'),
    pathExpression: /(?:^|\/)(?:examples|[^/]*sample)\//u,
  },
  {
    description: 'cross-implementation comparison',
    expression: new RegExp(
      `\\b(?:match(?:es|ed|ing)?|mirror(?:s|ed|ing)?|parity with|port(?:ed)? from|derived from)\\s+(?:the\\s+)?(?:${IMPLEMENTATION_TERMS})\\b`,
      'giu',
    ),
  },
  {
    description: 'platform implementation reference',
    expression: new RegExp(
      `\\b${PLATFORM_IMPLEMENTATION_TERM}(?:[- ](?:only|equivalent))?\\s+(?:app(?:lication)?|asset(?:s)?|behavior|code(?:[ -]?base)?|component(?:\\s+(?:gallery|implementation|library))?|counterpart|demo|design[- ]system|dimensions?|gallery|hierarchy|implementation|layout|scenario(?:s)?|screen|source|styles?|toolkit|version)\\b`,
      'giu',
    ),
  },
  {
    description: 'platform provenance label',
    expression: new RegExp(
      `\\b${PLATFORM_IMPLEMENTATION_TERM}\\s*(?::|source\\b)`,
      'giu',
    ),
  },
  {
    description: 'source-language provenance',
    expression: new RegExp(`\\b${SOURCE_LANGUAGE_TERM}\\b`, 'gu'),
  },
  {
    description: 'source-artifact provenance',
    expression: new RegExp(
      `\\b(?:[A-Za-z_$][\\w$]*(?:Activity|Fragment|View)\\.${JVM_SOURCE_EXTENSION}|[a-z][a-z0-9_]*(?:_activity|_fragment|_view)\\.${RESOURCE_SOURCE_EXTENSION})\\b`,
      'gu',
    ),
  },
];

function toRepositoryPath(repositoryRoot, path) {
  return relative(repositoryRoot, path).split(sep).join('/');
}

function isExcludedPath(repositoryPath) {
  const directorySegments = repositoryPath.split('/').slice(0, -1);
  return (
    EXCLUDED_FILES.has(repositoryPath) ||
    directorySegments.some(segment => EXCLUDED_DIRECTORIES.has(segment))
  );
}

function readWorkspaceRoots(repositoryRoot) {
  const manifestPath = resolve(repositoryRoot, 'package.json');
  if (!existsSync(manifestPath)) {
    return [];
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const workspaces = Array.isArray(manifest.workspaces)
    ? manifest.workspaces
    : (manifest.workspaces?.packages ?? []);

  return workspaces
    .map(workspace => workspace.split('/')[0])
    .filter(workspace => workspace !== '' && !/[?*[{]/u.test(workspace));
}

function collectFilesFromFilesystem(repositoryRoot, path) {
  if (!existsSync(path)) {
    return [];
  }

  const repositoryPath = toRepositoryPath(repositoryRoot, path);
  if (isExcludedPath(repositoryPath)) {
    return [];
  }

  const stats = lstatSync(path);
  if (stats.isSymbolicLink()) {
    return [];
  }
  if (stats.isFile()) {
    return SCANNED_EXTENSIONS.has(extname(path)) ? [path] : [];
  }
  if (!stats.isDirectory()) {
    return [];
  }

  return readdirSync(path, {withFileTypes: true}).flatMap(entry => {
    if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) {
      return [];
    }
    return collectFilesFromFilesystem(repositoryRoot, resolve(path, entry.name));
  });
}

function findSaplingRoot(path) {
  let current = resolve(path);
  while (true) {
    if (existsSync(resolve(current, '.hg'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function collectFilesFromSapling(repositoryRoot, scannedRoots) {
  const sourceControlRoot = findSaplingRoot(repositoryRoot);
  if (sourceControlRoot == null) {
    return null;
  }

  const projectPath = toRepositoryPath(sourceControlRoot, repositoryRoot);
  const selectors = [...scannedRoots].flatMap(entry => {
    const path = resolve(repositoryRoot, entry);
    if (!existsSync(path)) {
      return [];
    }
    const repositoryPath = [projectPath, entry].filter(Boolean).join('/');
    return lstatSync(path).isDirectory()
      ? [`glob:${repositoryPath}/**`]
      : [repositoryPath];
  });
  if (selectors.length === 0) {
    return [];
  }

  const result = spawnSync(
    'sl',
    [
      '--reason',
      'validate toolkit terminology using tracked files - sl help files',
      'files',
      ...selectors,
    ],
    {
      cwd: sourceControlRoot,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (result.error?.code === 'ENOENT') {
    return null;
  }
  if (result.status !== 0) {
    throw new Error(
      `Could not read the tracked-file inventory:\n${result.stderr.trim()}`,
    );
  }

  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map(path => resolve(sourceControlRoot, path))
    .filter(path => existsSync(path) && lstatSync(path).isFile())
    .filter(path => SCANNED_EXTENSIONS.has(extname(path)))
    .filter(path => !isExcludedPath(toRepositoryPath(repositoryRoot, path)));
}

function findLineAndColumn(source, index) {
  const precedingSource = source.slice(0, index);
  const line = precedingSource.split('\n').length;
  const lastNewline = precedingSource.lastIndexOf('\n');
  return {line, column: index - lastNewline};
}

export function validateTerminology(repositoryRoot) {
  const scannedRoots = new Set([
    ...ALWAYS_SCANNED_ROOTS,
    ...readWorkspaceRoots(repositoryRoot),
  ]);
  const trackedFiles = collectFilesFromSapling(repositoryRoot, scannedRoots);
  const files = (
    trackedFiles ??
    [...scannedRoots].flatMap(entry =>
      collectFilesFromFilesystem(repositoryRoot, resolve(repositoryRoot, entry)),
    )
  );
  const uniqueFiles = [...new Set(files)].sort();
  const failures = [];

  for (const path of uniqueFiles) {
    const source = readFileSync(path, 'utf8');
    const repositoryPath = toRepositoryPath(repositoryRoot, path);

    for (const {description, expression, pathExpression} of PROHIBITED_PATTERNS) {
      if (pathExpression != null && !pathExpression.test(repositoryPath)) {
        continue;
      }
      expression.lastIndex = 0;
      for (const match of source.matchAll(expression)) {
        const {line, column} = findLineAndColumn(source, match.index ?? 0);
        const lineText = source.split('\n')[line - 1]?.trim() ?? '';
        failures.push(
          `${repositoryPath}:${line}:${column} ${description}: ${JSON.stringify(match[0])}\n` +
            `  ${lineText}`,
        );
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(
      'UI Toolkit for Meta Ray-Ban Display terminology policy failed:\n- ' +
        failures.join('\n- '),
    );
  }

  return {
    fileCount: uniqueFiles.length,
    inventory: trackedFiles == null ? 'filesystem' : 'sapling',
  };
}

function runFromCommandLine() {
  const repositoryRoot = resolve(
    process.argv[2] ?? resolve(fileURLToPath(import.meta.url), '../..'),
  );
  const result = validateTerminology(repositoryRoot);
  console.log(
    `Terminology policy valid for ${result.fileCount} workspace files ` +
      `(${result.inventory} inventory).`,
  );
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  runFromCommandLine();
}
