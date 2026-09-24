#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const bundledSource = resolve(scriptDirectory, 'llm-skills');
const repositorySource = resolve(scriptDirectory, '..', 'llm-skills');

const clientDirectories = new Map([
  ['claude-code', {account: '.claude/skills', project: '.claude/skills'}],
  ['codex', {account: '.codex/skills', project: '.agents/skills'}],
  ['muse-code', {account: '.agents/skills', project: '.agents/skills'}],
]);
const managedStateFileName = '.wearables-ui-toolkit-web-managed-skills.json';

function parseArguments(argv) {
  let client = '';
  let project = '';
  let account = false;
  let source = existsSync(bundledSource) ? bundledSource : repositorySource;
  let sourceExplicit = false;
  let force = false;
  let prune = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--client') {
      client = argv[index + 1] ?? '';
      index += 1;
    } else if (argument === '--project') {
      project = resolve(argv[index + 1] ?? '');
      index += 1;
    } else if (argument === '--account') {
      account = true;
    } else if (argument === '--source') {
      source = resolve(argv[index + 1] ?? '');
      sourceExplicit = true;
      index += 1;
    } else if (argument === '--force') {
      force = true;
    } else if (argument === '--prune') {
      prune = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!clientDirectories.has(client)) {
    throw new Error('--client must be claude-code, codex, or muse-code');
  }
  if ((project === '') === !account) {
    throw new Error('Pass exactly one of --project <path> or --account');
  }
  if (prune && !account) {
    throw new Error('--prune is only valid with --account');
  }
  if (
    project !== '' &&
    (!existsSync(project) || !statSync(project).isDirectory())
  ) {
    throw new Error('--project must name an existing project directory');
  }
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    throw new Error(`Skill source directory does not exist: ${source}`);
  }
  return {account, client, project, source, sourceExplicit, force, prune};
}

function readManagedSkills(statePath) {
  if (!existsSync(statePath)) {
    return new Set();
  }
  let state;
  try {
    state = JSON.parse(readFileSync(statePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid managed-skill state JSON: ${statePath}`, {
      cause: error,
    });
  }
  if (
    state?.schemaVersion !== 1 ||
    !Array.isArray(state.skills) ||
    !state.skills.every(skill => typeof skill === 'string')
  ) {
    throw new Error(`Invalid managed-skill state: ${statePath}`);
  }
  return new Set(state.skills);
}

function writeManagedSkills(statePath, skills) {
  const temporaryStatePath = `${statePath}.${process.pid}.tmp`;
  try {
    writeFileSync(
      temporaryStatePath,
      `${JSON.stringify({schemaVersion: 1, skills: [...skills].sort()}, null, 2)}\n`,
    );
    renameSync(temporaryStatePath, statePath);
  } finally {
    rmSync(temporaryStatePath, {force: true});
  }
}

const {account, client, project, source, sourceExplicit, force, prune} = parseArguments(
  process.argv.slice(2),
);
const clientDirectory = clientDirectories.get(client);
const targetRoot = account
  ? resolve(homedir(), clientDirectory.account)
  : resolve(project, clientDirectory.project);
mkdirSync(targetRoot, {recursive: true});
const managedStatePath = resolve(
  targetRoot,
  '..',
  managedStateFileName,
);
const previouslyManagedSkills = account
  ? readManagedSkills(managedStatePath)
  : new Set();

const skills = readdirSync(source, {withFileTypes: true})
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();
const preservedAccountSkills = new Set();

for (const skill of skills) {
  const sourceDirectory = resolve(source, skill);
  if (!existsSync(resolve(sourceDirectory, 'SKILL.md'))) {
    throw new Error(`Skill source is missing SKILL.md: ${sourceDirectory}`);
  }
  const targetDirectory = resolve(targetRoot, skill);
  if (
    existsSync(targetDirectory) &&
    !force &&
    !previouslyManagedSkills.has(skill)
  ) {
    if (account) {
      preservedAccountSkills.add(skill);
      continue;
    }
    throw new Error(
      `Target already exists; rerun with --force to replace it: ${targetDirectory}`,
    );
  }
}

const managedSkills = new Set(previouslyManagedSkills);
let installedSkillCount = 0;

for (const skill of skills) {
  if (preservedAccountSkills.has(skill)) {
    continue;
  }
  const sourceDirectory = resolve(source, skill);
  const targetDirectory = resolve(targetRoot, skill);
  const targetExisted = existsSync(targetDirectory);
  if (targetExisted) {
    rmSync(targetDirectory, {recursive: true, force: true});
  }
  cpSync(sourceDirectory, targetDirectory, {recursive: true});
  installedSkillCount += 1;
  if (account && !targetExisted) {
    managedSkills.add(skill);
    // Persist each newly owned directory immediately. If interruption occurs
    // between the copy and this atomic state update, the next unforced account
    // sync preserves the directory rather than assuming ownership.
    writeManagedSkills(managedStatePath, managedSkills);
  }
}

if (account && (!sourceExplicit || prune)) {
  for (const skill of previouslyManagedSkills) {
    if (!skills.includes(skill)) {
      rmSync(resolve(targetRoot, skill), {recursive: true, force: true});
      managedSkills.delete(skill);
      writeManagedSkills(managedStatePath, managedSkills);
    }
  }
}

const scope = account ? 'account profile' : 'project';
console.log(
  `Installed ${installedSkillCount} UI Toolkit for Meta Ray-Ban Display skills for ${client} in ${targetRoot} (${scope})`,
);
if (preservedAccountSkills.size > 0) {
  console.log(
    `Preserved unmanaged skill director${preservedAccountSkills.size === 1 ? 'y' : 'ies'}: ${[...preservedAccountSkills].join(', ')}.`,
  );
}
