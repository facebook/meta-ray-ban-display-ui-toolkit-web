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
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, isAbsolute, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateLicensePolicy} from './validate-license.mjs';

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(toolDirectory, '..');

function parseArguments(argv) {
  let source = resolve(repositoryRoot, 'llm-skills');
  let output = resolve(repositoryRoot, 'dist', 'skill-exports');
  let checkOnly = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--source') {
      source = resolve(argv[index + 1] ?? '');
      index += 1;
    } else if (argument === '--out') {
      output = resolve(argv[index + 1] ?? '');
      index += 1;
    } else if (argument === '--check') {
      checkOnly = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return {source, output, checkOnly};
}

function readFrontmatter(skillFile) {
  const contents = readFileSync(skillFile, 'utf8');
  const match = contents.match(/^---\n([\s\S]*?)\n---\n/);
  if (match == null) {
    throw new Error(`${skillFile} must begin with YAML frontmatter`);
  }

  const fields = new Map();
  for (const line of match[1].split('\n')) {
    if (line.trim() === '') continue;
    const field = line.match(/^([a-z_]+):\s*(.+)$/);
    if (field == null) {
      throw new Error(`${skillFile} uses unsupported multiline or nested frontmatter: ${line}`);
    }
    fields.set(field[1], field[2].replace(/^(['"])(.*)\1$/, '$2').trim());
  }

  const unknown = [...fields.keys()].filter(
    field => field !== 'name' && field !== 'description',
  );
  if (unknown.length > 0) {
    throw new Error(
      `${skillFile} has frontmatter outside the cross-client subset: ${unknown.join(', ')}`,
    );
  }
  return fields;
}

function collectFiles(directory, root = directory) {
  const files = [];
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(path, root));
    } else if (entry.isFile()) {
      files.push(relative(root, path).split(sep).join('/'));
    } else {
      throw new Error(`Skill packages must not contain links or special files: ${path}`);
    }
  }
  return files.sort();
}

function hashPackage(directory, files) {
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(resolve(directory, file)));
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

function validateOpenAiMetadata(skillDirectory) {
  const metadataFile = resolve(skillDirectory, 'agents', 'openai.yaml');
  if (!existsSync(metadataFile)) {
    throw new Error(`${metadataFile} is required for Codex presentation metadata`);
  }
  const metadata = readFileSync(metadataFile, 'utf8');
  for (const field of ['display_name', 'short_description', 'default_prompt']) {
    if (!new RegExp(`^  ${field}:\\s*["'].+["']\\s*$`, 'm').test(metadata)) {
      throw new Error(`${metadataFile} must define interface.${field}`);
    }
  }
}

function discoverSkills(source) {
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    throw new Error(`Skill source directory does not exist: ${source}`);
  }

  return readdirSync(source, {withFileTypes: true})
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const directory = resolve(source, entry.name);
      const skillFile = resolve(directory, 'SKILL.md');
      if (!existsSync(skillFile)) {
        throw new Error(`Skill directory is missing SKILL.md: ${directory}`);
      }
      const fields = readFrontmatter(skillFile);
      const name = fields.get('name') ?? '';
      const description = fields.get('description') ?? '';
      if (name !== entry.name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
        throw new Error(`${skillFile} name must match its kebab-case directory`);
      }
      if (description.length === 0) {
        throw new Error(`${skillFile} must provide a non-empty description`);
      }
      validateOpenAiMetadata(directory);
      const files = collectFiles(directory);
      return {
        name,
        description,
        directory,
        files,
        sha256: hashPackage(directory, files),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function assertSafeOutput(source, output) {
  if (!isAbsolute(output) || output === resolve(output, sep)) {
    throw new Error(`Refusing unsafe export output: ${output}`);
  }
  const relativeToSource = relative(source, output);
  if (relativeToSource === '' || !relativeToSource.startsWith(`..${sep}`)) {
    throw new Error('Export output must not be the skill source or one of its descendants');
  }
}

function prepareOutput(output) {
  const generatedEntries = new Set([
    'claude-code',
    'codex',
    'install-skills.mjs',
    'llm-skills',
    'manifest.json',
    'muse-code',
  ]);
  if (existsSync(output)) {
    const entries = readdirSync(output);
    const unexpected = entries.filter(entry => !generatedEntries.has(entry));
    if (unexpected.length > 0) {
      throw new Error(
        `Refusing to replace an export directory containing unknown files: ${unexpected.join(', ')}`,
      );
    }
    for (const entry of entries) {
      rmSync(resolve(output, entry), {recursive: true, force: true});
    }
  } else {
    mkdirSync(output, {recursive: true});
  }
}

function createManifest(skills) {
  return {
    schema_version: 2,
    skill_count: skills.length,
    skills: skills.map(({name, description, files, sha256}) => ({
      name,
      description,
      file_count: files.length,
      sha256,
    })),
    targets: targets.map(target => ({
      id: target.id,
      account_skills_directory: target.accountSkillsRoot,
      project_skills_directory: target.projectSkillsRoot,
      skill_count: skills.length,
    })),
  };
}

function serializedManifest(skills) {
  return `${JSON.stringify(createManifest(skills), null, 2)}\n`;
}

function checkCommittedManifest(skills) {
  const candidates = [
    resolve(repositoryRoot, 'oss', 'skill-manifest.json'),
    resolve(repositoryRoot, 'skill-manifest.json'),
  ];
  const manifestPath = candidates.find(existsSync);
  if (manifestPath == null) {
    throw new Error(
      'Committed skill manifest is missing; expected oss/skill-manifest.json',
    );
  }
  if (readFileSync(manifestPath, 'utf8') !== serializedManifest(skills)) {
    throw new Error(
      `${relative(repositoryRoot, manifestPath)} is stale. Run \`yarn skills:export\` and copy dist/skill-exports/manifest.json into oss/skill-manifest.json.`,
    );
  }
}

const targets = [
  {
    id: 'claude-code',
    accountSkillsRoot: '.claude/skills',
    projectSkillsRoot: '.claude/skills',
  },
  {
    id: 'codex',
    accountSkillsRoot: '.codex/skills',
    projectSkillsRoot: '.agents/skills',
  },
  {
    id: 'muse-code',
    accountSkillsRoot: '.agents/skills',
    projectSkillsRoot: '.agents/skills',
  },
];

function exportSkills(source, output, skills) {
  assertSafeOutput(source, output);
  prepareOutput(output);

  const bundledSkills = resolve(output, 'llm-skills');
  mkdirSync(bundledSkills, {recursive: true});
  for (const skill of skills) {
    cpSync(skill.directory, resolve(bundledSkills, skill.name), {recursive: true});
  }
  cpSync(
    resolve(toolDirectory, 'install-skills.mjs'),
    resolve(output, 'install-skills.mjs'),
  );

  writeFileSync(
    resolve(output, 'manifest.json'),
    serializedManifest(skills),
  );
}

const {source, output, checkOnly} = parseArguments(process.argv.slice(2));
validateLicensePolicy(repositoryRoot);
const skills = discoverSkills(source);
if (skills.length === 0) {
  throw new Error(`No skills found in ${source}`);
}

if (!checkOnly) {
  exportSkills(source, output, skills);
  console.log(`Exported one canonical bundle of ${skills.length} skills for Muse Code, Codex, and Claude Code to ${output}`);
} else {
  checkCommittedManifest(skills);
  console.log(`Validated ${skills.length} cross-client skill packages in ${source}`);
}
