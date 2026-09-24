#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createHash} from 'node:crypto';
import {existsSync, readFileSync, readdirSync, realpathSync} from 'node:fs';
import {extname, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

export const LICENSE_HEADER = `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */`;

export const ICON_LICENSE_HEADER = `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Meta Wearables Developer Terms found in
 * the LICENSE file in this package.
 *
 */`;

const APACHE_LICENSE_SHA256 =
  '600cc67cc4cb2f5ea317dcfc687ad1c74dc4bec8782bbe9db0afd83513b935b7';
const ROOT_NOTICE_SHA256 =
  '334cd58c0da639067e778e893c6e87b9f88f772a3470e09f0fce8ced01e1c441';
const ICON_LICENSE_SHA256 =
  '3277cd33ad5599634c488b1aba947e3a67b36132fd2749b28b6fe55007fb4564';
const ANDROIDX_LICENSE_SHA256 =
  'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4';
const ANDROIDX_NOTICE_SHA256 =
  'b60817656586a546e8f9b99fe57787eb59f5fb8ceb6825408f2bb581411f86e6';
const ANDROIDX_UPSTREAM_SHA256 =
  'c0fc46ba25776a0ac16751d5f9b0de5df3d385e36a32c65c0647ce139f73c73a';
const ICON_PUBLISHED_POLICY_FILES = Object.freeze([
  'LICENSE',
  'NOTICE',
  'README.md',
]);
const ANDROIDX_PUBLISHED_POLICY_FILES = Object.freeze([
  'LICENSE',
  'NOTICE',
  'README.md',
  'UPSTREAM.md',
]);
const ANDROIDX_SOURCE_HEADER = `/*
 * Copyright 2022 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */`;
const ANDROIDX_DERIVED_SOURCE_HEADER =
  `${LICENSE_HEADER}\n\n${ANDROIDX_SOURCE_HEADER}`;
const ANDROIDX_DERIVED_SOURCES = new Map([
  [
    'packages/androidx-shapes/src/AndroidXShapes.ts',
    'Modifications: Meta Platforms, Inc.',
  ],
  [
    'packages/androidx-shapes/src/AndroidXShapes.types.ts',
    'Modifications: Meta Platforms, Inc.',
  ],
]);
const SOURCE_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.js',
  '.jsx',
  '.mjs',
  '.ts',
  '.tsx',
]);
const EXCLUDED_DIRECTORY_NAMES = new Set([
  '.git',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

function toRepositoryPath(root, path) {
  return relative(root, path).split(sep).join('/');
}

function isExcludedDirectory(root, path) {
  const repositoryPath = toRepositoryPath(root, path);
  const directoryName = repositoryPath.split('/').at(-1);
  return EXCLUDED_DIRECTORY_NAMES.has(directoryName);
}

function collectPolicyFiles(root, directory = root) {
  const sourceFiles = [];
  const packageFiles = [];

  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (!isExcludedDirectory(root, path)) {
        const nested = collectPolicyFiles(root, path);
        sourceFiles.push(...nested.sourceFiles);
        packageFiles.push(...nested.packageFiles);
      }
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    if (entry.name === 'package.json') {
      packageFiles.push(path);
    }
    if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
      sourceFiles.push(path);
    }
  }

  return {sourceFiles, packageFiles};
}

function contentAfterShebang(contents) {
  if (!contents.startsWith('#!')) {
    return contents;
  }
  const firstNewline = contents.indexOf('\n');
  return firstNewline === -1 ? '' : contents.slice(firstNewline + 1);
}

export function missingIconPublishedPolicyFiles(manifest) {
  const publishedFiles = new Set(manifest.files ?? []);
  return ICON_PUBLISHED_POLICY_FILES.filter(
    requiredFile => !publishedFiles.has(requiredFile),
  );
}

export function missingAndroidXPublishedPolicyFiles(manifest) {
  const publishedFiles = new Set(manifest.files ?? []);
  return ANDROIDX_PUBLISHED_POLICY_FILES.filter(
    requiredFile => !publishedFiles.has(requiredFile),
  );
}

export function validateLicensePolicy(repositoryRoot) {
  const errors = [];
  const licensePath = resolve(repositoryRoot, 'LICENSE');
  const noticePath = resolve(repositoryRoot, 'NOTICE');

  if (!existsSync(licensePath)) {
    errors.push('LICENSE is missing from the repository root');
  } else {
    const digest = createHash('sha256')
      .update(readFileSync(licensePath))
      .digest('hex');
    if (digest !== APACHE_LICENSE_SHA256) {
      errors.push('LICENSE does not match the approved Apache License 2.0 text');
    }
  }

  if (!existsSync(noticePath)) {
    errors.push('NOTICE is missing from the repository root');
  } else {
    const digest = createHash('sha256')
      .update(readFileSync(noticePath))
      .digest('hex');
    if (digest !== ROOT_NOTICE_SHA256) {
      errors.push('NOTICE does not match the approved project notice');
    }
  }

  const {sourceFiles, packageFiles} = collectPolicyFiles(repositoryRoot);
  for (const path of sourceFiles.sort()) {
    const repositoryPath = toRepositoryPath(repositoryRoot, path);
    const contents = contentAfterShebang(readFileSync(path, 'utf8'));
    const expectedHeader = repositoryPath.startsWith('packages/icons/')
      ? ICON_LICENSE_HEADER
      : LICENSE_HEADER;
    if (!contents.startsWith(`${expectedHeader}\n`)) {
      errors.push(`${repositoryPath} is missing the approved license header`);
    }
    const modificationNotice = ANDROIDX_DERIVED_SOURCES.get(repositoryPath);
    if (modificationNotice != null) {
      if (!contents.startsWith(`${ANDROIDX_DERIVED_SOURCE_HEADER}\n`)) {
        errors.push(`${repositoryPath} is missing the original Android Open Source Project header after the approved license header`);
      }
      if (!contents.includes(modificationNotice)) {
        errors.push(`${repositoryPath} is missing its Meta modification notice`);
      }
    }
  }

  for (const repositoryPath of ANDROIDX_DERIVED_SOURCES.keys()) {
    if (!sourceFiles.some(path => toRepositoryPath(repositoryRoot, path) === repositoryPath)) {
      errors.push(`${repositoryPath} is missing from the AndroidX package`);
    }
  }

  for (const path of packageFiles.sort()) {
    const repositoryPath = toRepositoryPath(repositoryRoot, path);
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    const expectedLicense = repositoryPath === 'packages/icons/package.json'
      ? 'SEE LICENSE IN LICENSE'
      : repositoryPath === 'package.json' || repositoryPath === 'oss/package.json'
        ? 'SEE LICENSE IN NOTICE'
        : 'Apache-2.0';
    if (manifest.license !== expectedLicense) {
      errors.push(
        `${repositoryPath} must declare \"license\": \"${expectedLicense}\"`,
      );
    }
  }

  const iconPackageRoot = resolve(repositoryRoot, 'packages/icons');
  const iconLicensePath = resolve(iconPackageRoot, 'LICENSE');
  if (!existsSync(iconLicensePath)) {
    errors.push('packages/icons/LICENSE is missing');
  } else {
    const digest = createHash('sha256')
      .update(readFileSync(iconLicensePath))
      .digest('hex');
    if (digest !== ICON_LICENSE_SHA256) {
      errors.push('packages/icons/LICENSE does not match the approved icon terms notice');
    }
  }

  const iconManifestPath = resolve(iconPackageRoot, 'package.json');
  if (!existsSync(iconManifestPath)) {
    errors.push('packages/icons/package.json is missing');
  } else {
    const manifest = JSON.parse(readFileSync(iconManifestPath, 'utf8'));
    for (const missingFile of missingIconPublishedPolicyFiles(manifest)) {
      errors.push(`packages/icons/package.json must publish ${missingFile}`);
    }
  }

  const androidxPackageRoot = resolve(repositoryRoot, 'packages/androidx-shapes');
  const androidxLicensePath = resolve(androidxPackageRoot, 'LICENSE');
  if (!existsSync(androidxLicensePath)) {
    errors.push('packages/androidx-shapes/LICENSE is missing');
  } else {
    const digest = createHash('sha256')
      .update(readFileSync(androidxLicensePath))
      .digest('hex');
    if (digest !== ANDROIDX_LICENSE_SHA256) {
      errors.push('packages/androidx-shapes/LICENSE does not match the approved upstream Apache text');
    }
  }

  const androidxNoticePath = resolve(androidxPackageRoot, 'NOTICE');
  const androidxUpstreamPath = resolve(androidxPackageRoot, 'UPSTREAM.md');
  for (const [path, approvedDigest] of [
    [androidxNoticePath, ANDROIDX_NOTICE_SHA256],
    [androidxUpstreamPath, ANDROIDX_UPSTREAM_SHA256],
  ]) {
    const repositoryPath = toRepositoryPath(repositoryRoot, path);
    if (!existsSync(path)) {
      errors.push(`${repositoryPath} is missing`);
      continue;
    }
    const digest = createHash('sha256')
      .update(readFileSync(path))
      .digest('hex');
    if (digest !== approvedDigest) {
      errors.push(`${repositoryPath} does not match the approved attribution text`);
    }
  }

  const androidxManifestPath = resolve(androidxPackageRoot, 'package.json');
  if (!existsSync(androidxManifestPath)) {
    errors.push('packages/androidx-shapes/package.json is missing');
  } else {
    const manifest = JSON.parse(readFileSync(androidxManifestPath, 'utf8'));
    for (const missingFile of missingAndroidXPublishedPolicyFiles(manifest)) {
      errors.push(
        `packages/androidx-shapes/package.json must publish ${missingFile}`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`UI Toolkit for Meta Ray-Ban Display license policy failed:\n- ${errors.join('\n- ')}`);
  }

  return {
    packageCount: packageFiles.length,
    sourceCount: sourceFiles.length,
  };
}

function runFromCommandLine() {
  const repositoryRoot = resolve(process.argv[2] ?? resolve(fileURLToPath(import.meta.url), '../..'));
  const result = validateLicensePolicy(repositoryRoot);
  console.log(
    `License policy valid for ${result.sourceCount} source files and ${result.packageCount} package manifests.`,
  );
}

if (
  process.argv[1] != null &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
) {
  runFromCommandLine();
}
