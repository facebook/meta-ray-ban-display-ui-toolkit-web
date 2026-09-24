/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import test from 'node:test';

import {validateTerminology} from './validate-terminology.mjs';

const CONFIGURATION_ROOT = ['.', 'llms'].join('');
const ADDITIONAL_WORKSPACE_ROOT = 'extra';
const PLATFORM_IMPLEMENTATION_TERM = ['nat', 'ive'].join('');
const SOURCE_LANGUAGE_TERM = ['Kot', 'lin'].join('');

function withFixture(files, callback) {
  const root = mkdtempSync(join(tmpdir(), 'uit-terminology-'));
  try {
    for (const [path, contents] of Object.entries(files)) {
      const absolutePath = join(root, path);
      mkdirSync(dirname(absolutePath), {recursive: true});
      writeFileSync(absolutePath, contents);
    }
    callback(root);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
}

test('rejects cross-implementation copy in workspace samples', () => {
  const samplePath = `${ADDITIONAL_WORKSPACE_ROOT}/sample/Screen.tsx`;
  const prohibitedCopy = [PLATFORM_IMPLEMENTATION_TERM, 'design system'].join(
    ' ',
  );
  withFixture(
    {
      'package.json': JSON.stringify({
        workspaces: [`${ADDITIONAL_WORKSPACE_ROOT}/*`],
      }),
      [samplePath]: prohibitedCopy,
    },
    root => {
      assert.throws(
        () => validateTerminology(root),
        error => error instanceof Error && error.message.includes(samplePath),
      );
    },
  );
});

test('rejects comparison language in public source', () => {
  const prohibitedCopy = [
    ['mir', 'rors'].join(''),
    PLATFORM_IMPLEMENTATION_TERM,
  ].join(' ');
  withFixture({'packages/mrbd/src/Component.tsx': prohibitedCopy}, root => {
    assert.throws(
      () => validateTerminology(root),
      error =>
        error instanceof Error &&
        error.message.includes('packages/mrbd/src/Component.tsx'),
    );
  });
});

test('rejects implementation-code references', () => {
  const codeTerm = 'code';
  const source = [
    `${PLATFORM_IMPLEMENTATION_TERM} ${codeTerm}`,
    `${PLATFORM_IMPLEMENTATION_TERM} ${codeTerm}base`,
  ].join('\n');
  withFixture({'packages/mrbd/src/Component.tsx': source}, root => {
    assert.throws(
      () => validateTerminology(root),
      error =>
        error instanceof Error &&
        error.message.includes('packages/mrbd/src/Component.tsx') &&
        error.message.match(/platform implementation reference/gu)?.length === 2,
    );
  });
});

test('allows web terminology and excludes policy, deploy, and generated text', () => {
  const policyCopy = [
    ['port', 'ed from'].join(''),
    SOURCE_LANGUAGE_TERM,
  ].join(' ');
  const implementationCopy = [
    PLATFORM_IMPLEMENTATION_TERM,
    'design system',
  ].join(' ');
  withFixture(
    {
      'package.json': JSON.stringify({
        workspaces: [`${ADDITIONAL_WORKSPACE_ROOT}/*`],
      }),
      [`${CONFIGURATION_ROOT}/skills/uit-public-leak-prevention-web/SKILL.md`]:
        policyCopy,
      'README.md': `Use ${PLATFORM_IMPLEMENTATION_TERM} HTML element semantics.`,
      'build/index.html': implementationCopy,
      [`${ADDITIONAL_WORKSPACE_ROOT}/deploy/prompt.md`]: implementationCopy,
      'llm-skills/uit-public-leak-prevention-web/SKILL.md': policyCopy,
      'node_modules/example/README.md': implementationCopy,
      'packages/androidx-shapes/README.md': policyCopy,
      'packages/mrbd/dist/index.js': implementationCopy,
    },
    root => {
      const result = validateTerminology(root);
      assert.equal(result.inventory, 'filesystem');
    },
  );
});
