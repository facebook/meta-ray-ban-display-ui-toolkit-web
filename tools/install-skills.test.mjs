/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const installerPath = path.resolve(scriptDirectory, 'install-skills.mjs');

function writeSkill(source, name, body) {
  const directory = path.resolve(source, name);
  mkdirSync(directory, {recursive: true});
  writeFileSync(path.resolve(directory, 'SKILL.md'), `${body}\n`);
}

function runInstaller(args, environment = {}) {
  return execFileSync(process.execPath, [installerPath, ...args], {
    encoding: 'utf8',
    env: {...process.env, ...environment},
  });
}

test('installs Muse Code skills into a project and requires force to replace them', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'uit-skills-project-'));
  const source = path.resolve(root, 'source');
  const project = path.resolve(root, 'project');
  mkdirSync(project);
  writeSkill(source, 'example-skill', 'version one');

  try {
    runInstaller([
      '--client', 'muse-code',
      '--project', project,
      '--source', source,
    ]);
    const installedSkill = path.resolve(
      project,
      '.agents/skills/example-skill/SKILL.md',
    );
    assert.equal(readFileSync(installedSkill, 'utf8'), 'version one\n');

    writeSkill(source, 'example-skill', 'version two');
    assert.throws(() => runInstaller([
      '--client', 'muse-code',
      '--project', project,
      '--source', source,
    ]));

    runInstaller([
      '--client', 'muse-code',
      '--project', project,
      '--source', source,
      '--force',
    ]);
    assert.equal(readFileSync(installedSkill, 'utf8'), 'version two\n');
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});

test('synchronizes account skills without removing unrelated user skills', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'uit-skills-account-'));
  const source = path.resolve(root, 'source');
  const accountSkills = path.resolve(root, '.agents/skills');
  writeSkill(source, 'current-skill', 'version one');
  writeSkill(source, 'removed-skill', 'remove me');

  try {
    runInstaller(
      ['--client', 'muse-code', '--account', '--source', source, '--prune'],
      {HOME: root, USERPROFILE: root},
    );
    writeSkill(accountSkills, 'unrelated-skill', 'keep me');
    writeSkill(source, 'current-skill', 'version two');
    rmSync(path.resolve(source, 'removed-skill'), {recursive: true});
    writeSkill(source, 'new-skill', 'new');

    runInstaller(
      ['--client', 'muse-code', '--account', '--source', source, '--prune'],
      {HOME: root, USERPROFILE: root},
    );

    assert.equal(
      readFileSync(
        path.resolve(accountSkills, 'current-skill/SKILL.md'),
        'utf8',
      ),
      'version two\n',
    );
    assert.equal(
      readFileSync(
        path.resolve(accountSkills, 'new-skill/SKILL.md'),
        'utf8',
      ),
      'new\n',
    );
    assert.equal(
      readFileSync(
        path.resolve(accountSkills, 'unrelated-skill/SKILL.md'),
        'utf8',
      ),
      'keep me\n',
    );
    assert.equal(existsSync(path.resolve(accountSkills, 'removed-skill')), false);
    assert.deepEqual(
      JSON.parse(
        readFileSync(
          path.resolve(
            root,
            '.agents/.wearables-ui-toolkit-web-managed-skills.json',
          ),
          'utf8',
        ),
      ),
      {
        schemaVersion: 1,
        skills: ['current-skill', 'new-skill'],
      },
    );
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});

test('uses each client account root', () => {
  const clients = [
    ['claude-code', '.claude/skills'],
    ['codex', '.codex/skills'],
  ];

  for (const [client, relativeTarget] of clients) {
    const root = mkdtempSync(path.join(tmpdir(), `uit-skills-${client}-`));
    const source = path.resolve(root, 'source');
    writeSkill(source, 'example-skill', client);
    try {
      runInstaller(
        ['--client', client, '--account', '--source', source],
        {HOME: root, USERPROFILE: root},
      );
      assert.equal(
        readFileSync(
          path.resolve(root, relativeTarget, 'example-skill/SKILL.md'),
          'utf8',
        ),
        `${client}\n`,
      );
    } finally {
      rmSync(root, {recursive: true, force: true});
    }
  }
});

test('does not prune account skills when installing from a partial source', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'uit-skills-partial-source-'));
  const source = path.resolve(root, 'source');
  writeSkill(source, 'first-skill', 'first');
  writeSkill(source, 'second-skill', 'second');

  try {
    runInstaller(
      ['--client', 'muse-code', '--account', '--source', source, '--prune'],
      {HOME: root, USERPROFILE: root},
    );
    rmSync(path.resolve(source, 'second-skill'), {recursive: true});
    runInstaller(
      ['--client', 'muse-code', '--account', '--source', source],
      {HOME: root, USERPROFILE: root},
    );

    assert.equal(
      existsSync(path.resolve(root, '.agents/skills/second-skill')),
      true,
    );
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});

test('rejects ambiguous install scope and invalid managed state', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'uit-skills-invalid-'));
  const source = path.resolve(root, 'source');
  const project = path.resolve(root, 'project');
  mkdirSync(project);
  writeSkill(source, 'example-skill', 'example');

  try {
    assert.throws(() => runInstaller([
      '--client', 'muse-code',
      '--account',
      '--project', project,
      '--source', source,
    ]), /Pass exactly one/);

    mkdirSync(path.resolve(root, '.agents'), {recursive: true});
    const managedStatePath = path.resolve(
      root,
      '.agents/.wearables-ui-toolkit-web-managed-skills.json',
    );
    writeFileSync(managedStatePath, '{not-json\n');
    assert.throws(
      () =>
        runInstaller(
          ['--client', 'muse-code', '--account', '--source', source],
          {HOME: root, USERPROFILE: root},
        ),
      error =>
        error.message.includes('Invalid managed-skill state JSON') &&
        error.message.includes(managedStatePath),
    );

    writeFileSync(
      managedStatePath,
      '{"schemaVersion":1,"skills":"not-an-array"}\n',
    );
    assert.throws(() => runInstaller(
      ['--client', 'muse-code', '--account', '--source', source],
      {HOME: root, USERPROFILE: root},
    ), /Invalid managed-skill state/);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});

test('does not claim a forced replacement of an unmanaged account skill', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'uit-skills-forced-account-'));
  const source = path.resolve(root, 'source');
  const accountSkills = path.resolve(root, '.agents/skills');
  writeSkill(source, 'colliding-skill', 'toolkit version');
  writeSkill(accountSkills, 'colliding-skill', 'user version');

  try {
    runInstaller(
      ['--client', 'muse-code', '--account', '--source', source, '--force'],
      {HOME: root, USERPROFILE: root},
    );
    writeSkill(source, 'colliding-skill', 'new toolkit version');
    const output = runInstaller(
      ['--client', 'muse-code', '--account', '--source', source],
      {HOME: root, USERPROFILE: root},
    );
    assert.match(output, /Preserved unmanaged skill directory: colliding-skill/);
    assert.equal(
      readFileSync(
        path.resolve(accountSkills, 'colliding-skill/SKILL.md'),
        'utf8',
      ),
      'toolkit version\n',
    );

    rmSync(path.resolve(source, 'colliding-skill'), {recursive: true});
    runInstaller(
      ['--client', 'muse-code', '--account', '--source', source],
      {HOME: root, USERPROFILE: root},
    );

    assert.equal(
      readFileSync(
        path.resolve(accountSkills, 'colliding-skill/SKILL.md'),
        'utf8',
      ),
      'toolkit version\n',
    );
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
