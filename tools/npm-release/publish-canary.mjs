#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { lstatSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  assertPackageNotPublic,
  assertTrustedPublishingNpm,
  runNpm,
} from './publish-staging.mjs';
import {
  assertExactObject,
} from './release-config.mjs';
import {
  CANARY_PACKAGE_NAME,
  assertCanaryVersion,
} from './prepare-publishing-canary.mjs';

const EXPECTED_PUBLISH_CONFIG = {
  access: 'restricted',
  registry: 'https://registry.npmjs.org/',
  tag: 'next',
};

function requireSuccessful(command, arguments_, result) {
  if (result.status !== 0) {
    throw new Error(
      `${command} ${arguments_.join(' ')} failed with status ${result.status}:\n` +
      `${result.stdout ?? ''}${result.stderr ?? ''}`,
    );
  }
  return result.stdout ?? '';
}

function readTarManifest(tarball) {
  const arguments_ = ['-xOzf', tarball, 'package/package.json'];
  const result = spawnSync('tar', arguments_, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  return JSON.parse(requireSuccessful('tar', arguments_, result));
}

export function validateCanaryArtifact(directory, version) {
  const releaseVersion = assertCanaryVersion(version);
  const files = readdirSync(directory).filter(name => name.endsWith('.tgz'));
  if (files.length !== 1) {
    throw new Error(`Publishing canary requires exactly one tarball, received ${files.length}.`);
  }
  const tarball = path.resolve(directory, files[0]);
  const stats = lstatSync(tarball);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error('Publishing canary tarball must be a regular file.');
  }
  const manifest = readTarManifest(tarball);
  if (manifest.name !== CANARY_PACKAGE_NAME || manifest.version !== releaseVersion) {
    throw new Error('Publishing canary tarball identity does not match the requested release.');
  }
  assertExactObject(
    manifest.publishConfig,
    EXPECTED_PUBLISH_CONFIG,
    'Publishing canary publishConfig',
  );
  return tarball;
}

export async function publishCanary({
  canaryEnabled = process.env.WUI_NPM_CANARY_ENABLED,
  directory,
  fetchImpl = globalThis.fetch,
  runNpmFn = runNpm,
  version,
}) {
  if (canaryEnabled !== 'true') {
    throw new Error('Publishing canary requires WUI_NPM_CANARY_ENABLED=true.');
  }
  const tarball = validateCanaryArtifact(directory, version);
  assertTrustedPublishingNpm(runNpmFn);
  await assertPackageNotPublic(CANARY_PACKAGE_NAME, {
    fetchImpl,
    phase: 'canary pre-publish check',
  });
  const arguments_ = [
    'publish',
    tarball,
    '--registry=https://registry.npmjs.org/',
    '--access=restricted',
    '--tag=next',
    '--ignore-scripts',
  ];
  const result = runNpmFn(arguments_);
  requireSuccessful('npm', arguments_, result);
  await assertPackageNotPublic(CANARY_PACKAGE_NAME, {
    fetchImpl,
    phase: 'canary post-publish check',
  });
  console.log(`Private npm publishing canary ${version} completed.`);
}

const isMain = process.argv[1] != null &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [, , directory, version] = process.argv;
  if (directory == null || version == null) {
    throw new Error('usage: publish-canary.mjs <artifact-directory> <version>');
  }
  await publishCanary({ directory: path.resolve(directory), version });
}
