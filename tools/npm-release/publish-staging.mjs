#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createHash } from 'node:crypto';
import {
  lstatSync,
  readFileSync,
  realpathSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  PACKAGE_ORDER,
  NPM_REGISTRY_URL,
  assertReleaseAccess,
  assertReleaseVersion,
  assertReleaseEnabled,
  assertStableReleaseVersion,
  validatePackageManifestCollection,
} from './release-config.mjs';

const MINIMUM_TRUSTED_PUBLISHING_NPM = [11, 5, 1];
const PUBLIC_REGISTRY_URL = NPM_REGISTRY_URL;

function parseArguments(arguments_) {
  let manifest = null;
  let version = null;
  for (let index = 0; index < arguments_.length; index += 1) {
    if (arguments_[index] === '--manifest') {
      manifest = path.resolve(arguments_[++index]);
    } else if (arguments_[index] === '--version') {
      version = arguments_[++index];
    } else {
      throw new Error(`Unknown argument: ${arguments_[index]}`);
    }
  }
  if (manifest == null || version == null) {
    throw new Error(
      'usage: publish-staging.mjs --manifest <path> --version <version>',
    );
  }
  return { manifest, version: assertReleaseVersion(version) };
}

function runProcess(command, arguments_, options = {}) {
  return spawnSync(command, arguments_, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: options.capture ? 'pipe' : 'inherit',
  });
}

export function runNpm(arguments_, options = {}) {
  const npm = process.env.NPM_BIN ?? 'npm';
  const command = npm.endsWith('.js') ? process.execPath : npm;
  const commandArguments = npm.endsWith('.js')
    ? [npm, ...arguments_]
    : arguments_;
  return runProcess(command, commandArguments, options);
}

function commandFailure(command, arguments_, result) {
  const detail = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return new Error(
    `${command} ${arguments_.join(' ')} failed with status ${result.status}:\n${detail}`,
  );
}

function requireSuccessfulCommand(command, arguments_, result) {
  if (result.status !== 0) {
    throw commandFailure(command, arguments_, result);
  }
  return result.stdout ?? '';
}

function parseVersionTuple(value) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/.exec(
    value.trim(),
  );
  if (match == null) {
    throw new Error(`Unable to parse npm version: ${value.trim()}`);
  }
  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

export function assertTrustedPublishingNpm(runNpmFn = runNpm) {
  const result = runNpmFn(['--version'], { capture: true });
  const output = requireSuccessfulCommand('npm', ['--version'], result);
  const version = parseVersionTuple(output);
  if (compareVersions(version, MINIMUM_TRUSTED_PUBLISHING_NPM) < 0) {
    throw new Error(
      `Private npm staging requires npm >= ${MINIMUM_TRUSTED_PUBLISHING_NPM.join('.')}, received ${output.trim()}.`,
    );
  }
}

function assertRegularFile(file, label) {
  const stats = lstatSync(file);
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new Error(`${label} must be a regular file and may not be a symlink.`);
  }
}

function containedArtifactPath(root, filename, packageName) {
  if (
    typeof filename !== 'string' ||
    filename.length === 0 ||
    path.basename(filename) !== filename ||
    !filename.endsWith('.tgz')
  ) {
    throw new Error(`Invalid tarball filename for ${packageName}: ${filename}`);
  }
  const rootPath = realpathSync(root);
  const candidate = path.resolve(rootPath, filename);
  const relative = path.relative(rootPath, candidate);
  if (
    relative === '' ||
    relative.startsWith(`..${path.sep}`) ||
    relative === '..' ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Tarball for ${packageName} escapes the artifact directory.`);
  }
  assertRegularFile(candidate, `Tarball for ${packageName}`);
  const realCandidate = realpathSync(candidate);
  const realRelative = path.relative(rootPath, realCandidate);
  if (
    realRelative.startsWith(`..${path.sep}`) ||
    realRelative === '..' ||
    path.isAbsolute(realRelative)
  ) {
    throw new Error(`Tarball for ${packageName} resolves outside the artifact directory.`);
  }
  return realCandidate;
}

export function sriForFile(file) {
  return `sha512-${createHash('sha512').update(readFileSync(file)).digest('base64')}`;
}

function runTar(arguments_) {
  const result = runProcess('tar', arguments_, { capture: true });
  return requireSuccessfulCommand('tar', arguments_, result);
}

export function validateTarEntryNames(names, tarball) {
  if (names.length === 0) {
    throw new Error(`Tarball is empty: ${tarball}`);
  }
  const seenCanonicalNames = new Set();
  for (const name of names) {
    const canonicalName = path.posix.normalize(name);
    const segments = name.split('/');
    if (
      name.length === 0 ||
      name.includes('\0') ||
      name.includes('\\') ||
      name.endsWith('/') ||
      path.posix.isAbsolute(name) ||
      segments.some(segment =>
        segment === '' ||
        segment === '.' ||
        segment === '..' ||
        segment.includes(':')
      ) ||
      segments[0] !== 'package' ||
      canonicalName !== name
    ) {
      throw new Error(`Tarball contains a noncanonical or unsafe path: ${name}`);
    }
    if (seenCanonicalNames.has(canonicalName)) {
      throw new Error(
        `Tarball contains a duplicate canonical path: ${canonicalName}`,
      );
    }
    seenCanonicalNames.add(canonicalName);
  }
  if (!seenCanonicalNames.has('package/package.json')) {
    throw new Error('Tarball is missing package/package.json.');
  }
  return seenCanonicalNames;
}

function tarEntries(tarball) {
  const names = runTar(['-tzf', tarball])
    .split('\n')
    .filter(Boolean);
  validateTarEntryNames(names, tarball);

  const verboseEntries = runTar(['-tvzf', tarball])
    .split('\n')
    .filter(Boolean);
  if (verboseEntries.length !== names.length) {
    throw new Error('Tarball listing was internally inconsistent.');
  }
  for (const entry of verboseEntries) {
    if (entry[0] !== '-' && entry[0] !== 'd') {
      throw new Error(
        `Tarball may contain only regular files and directories: ${entry}`,
      );
    }
  }
  return names;
}

function inspectEmbeddedManifest(tarball, expectedName, expectedVersion) {
  tarEntries(tarball);
  const source = runTar(['-xOzf', tarball, 'package/package.json']);
  let manifest;
  try {
    manifest = JSON.parse(source);
  } catch (error) {
    throw new Error(`Tarball contains invalid package/package.json: ${tarball}`, {
      cause: error,
    });
  }
  if (manifest.name !== expectedName) {
    throw new Error(
      `Tarball package name must be ${expectedName}, received ${manifest.name}.`,
    );
  }
  if (manifest.version !== expectedVersion) {
    throw new Error(
      `${expectedName} tarball version must be ${expectedVersion}, received ${manifest.version}.`,
    );
  }
  return manifest;
}

export function prevalidateReleaseArtifacts(manifestPath, expectedVersion) {
  assertRegularFile(manifestPath, 'Pack manifest');
  const version = assertReleaseVersion(expectedVersion);
  let release;
  try {
    release = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid pack manifest: ${manifestPath}`, { cause: error });
  }
  if (release.version !== version) {
    throw new Error(
      `Pack manifest version ${release.version} does not match ${version}.`,
    );
  }
  if (
    !Array.isArray(release.packages) ||
    release.packages.length !== PACKAGE_ORDER.length
  ) {
    throw new Error(
      `Pack manifest must contain exactly ${PACKAGE_ORDER.length} packages.`,
    );
  }

  const names = new Set();
  const packageManifests = new Map();
  const root = path.dirname(manifestPath);
  const artifacts = release.packages.map((entry, index) => {
    const expected = PACKAGE_ORDER[index];
    if (entry?.name !== expected.name || entry?.directory !== expected.directory) {
      throw new Error(
        `Pack manifest package ${index + 1} must be ${expected.name} from ${expected.directory}.`,
      );
    }
    if (names.has(entry.name)) {
      throw new Error(`Pack manifest contains duplicate package ${entry.name}.`);
    }
    names.add(entry.name);
    if (assertReleaseVersion(entry.version) !== version) {
      throw new Error(
        `${entry.name} pack-manifest version ${entry.version} does not match ${version}.`,
      );
    }
    const tarball = containedArtifactPath(root, entry.filename, entry.name);
    const integrity = sriForFile(tarball);
    if (entry.integrity !== integrity) {
      throw new Error(
        `${entry.name} tarball integrity mismatch: expected ${entry.integrity}, computed ${integrity}.`,
      );
    }
    const packageManifest = inspectEmbeddedManifest(
      tarball,
      entry.name,
      version,
    );
    packageManifests.set(entry.name, packageManifest);
    return {
      ...entry,
      integrity,
      packageManifest,
      tarball,
    };
  });
  validatePackageManifestCollection(packageManifests, version);
  return artifacts;
}

function publicPackageUrl(packageName, registryUrl) {
  return new URL(encodeURIComponent(packageName), registryUrl);
}

export async function assertPackageVisibility(
  packageName,
  expectedAccess,
  options = {},
) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const phase = options.phase ?? 'visibility check';
  const registryUrl = options.registryUrl ?? PUBLIC_REGISTRY_URL;
  let response;
  try {
    response = await fetchImpl(publicPackageUrl(packageName, registryUrl), {
      cache: 'no-store',
      headers: {
        accept: 'application/vnd.npm.install-v1+json',
        'cache-control': 'no-cache',
      },
      method: 'GET',
      redirect: 'error',
    });
  } catch (error) {
    throw new Error(
      `Unable to determine unauthenticated public visibility for ${packageName} during ${phase}.`,
      { cause: error },
    );
  }
  await response.body?.cancel();
  if (expectedAccess === 'restricted' && response.status === 404) {
    return;
  }
  if (expectedAccess === 'public' && response.status === 200) {
    return;
  }
  if (response.status === 200) {
    throw new Error(
      `${packageName} is publicly readable from the npm registry during ${phase}; expected restricted access.`,
    );
  }
  if (response.status === 404) {
    throw new Error(
      `${packageName} is not publicly readable from the npm registry during ${phase}; expected public access.`,
    );
  }
  throw new Error(
    `Ambiguous unauthenticated npm visibility for ${packageName} during ${phase}: HTTP ${response.status}.`,
  );
}

export function assertPackageNotPublic(packageName, options = {}) {
  return assertPackageVisibility(packageName, 'restricted', options);
}

async function assertAllPackageVisibility(artifacts, options) {
  const failures = [];
  for (const artifact of artifacts) {
    try {
      await assertPackageVisibility(
        artifact.name,
        artifact.packageManifest.publishConfig.access,
        options,
      );
    } catch (error) {
      failures.push({ error, name: artifact.name });
    }
  }
  if (failures.length > 0) {
    const details = failures
      .map(({ error, name }) =>
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      )
      .join('\n');
    throw new AggregateError(
      failures.map(failure => failure.error),
      `Unauthenticated npm visibility checks failed for ${failures.length} package(s):\n${details}`,
    );
  }
}

export function parseIntegrity(stdout) {
  let value;
  try {
    value = JSON.parse(stdout);
  } catch (error) {
    throw new Error(
      'npm view returned malformed dist.integrity JSON; refusing to publish.',
      { cause: error },
    );
  }
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      'npm view did not return a non-empty dist.integrity; refusing to publish.',
    );
  }
  return value;
}

function remoteIntegrity(packageName, version, runNpmFn) {
  const arguments_ = [
    'view',
    `${packageName}@${version}`,
    'dist.integrity',
    '--json',
    `--registry=${NPM_REGISTRY_URL}`,
  ];
  const result = runNpmFn(arguments_, { capture: true });
  if (result.status === 0) {
    return parseIntegrity(result.stdout);
  }
  const detail = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (/E404|404 Not Found|is not in this registry/i.test(detail)) {
    return null;
  }
  throw commandFailure('npm', arguments_, result);
}

function publishArtifact(artifact, runNpmFn) {
  const publishConfig = artifact.packageManifest.publishConfig;
  const arguments_ = [
    'publish',
    artifact.tarball,
    `--registry=${publishConfig.registry}`,
    `--access=${publishConfig.access}`,
    `--tag=${publishConfig.tag}`,
    '--ignore-scripts',
  ];
  const result = runNpmFn(arguments_);
  if (result.status !== 0) {
    throw commandFailure('npm', arguments_, result);
  }
}

export function releaseAccessFromEnvironment(value) {
  return assertReleaseAccess(value || 'restricted');
}

export async function publishRelease(options) {
  const {
    bootstrapTokenEnabled = false,
    expectedAccess = null,
    fetchImpl = globalThis.fetch,
    manifestPath,
    registryUrl = PUBLIC_REGISTRY_URL,
    runNpmFn = runNpm,
    version,
  } = options;
  assertReleaseEnabled(options.releaseEnabled);
  const stableVersion = assertStableReleaseVersion(version);

  const artifacts = prevalidateReleaseArtifacts(manifestPath, stableVersion);
  if (expectedAccess != null) {
    const releaseAccess = assertReleaseAccess(expectedAccess);
    for (const artifact of artifacts) {
      if (artifact.packageManifest.publishConfig.access !== releaseAccess) {
        throw new Error(
          `${artifact.name} artifact access ${artifact.packageManifest.publishConfig.access} does not match WUI_NPM_STABLE_RELEASE_ACCESS=${releaseAccess}.`,
        );
      }
    }
  }
  assertTrustedPublishingNpm(runNpmFn);
  await assertAllPackageVisibility(artifacts, {
    fetchImpl,
    phase: 'pre-publish check',
    registryUrl,
  });

  const plans = artifacts.map(artifact => ({ artifact, skip: false }));
  if (bootstrapTokenEnabled) {
    for (const plan of plans) {
      const existing = remoteIntegrity(plan.artifact.name, version, runNpmFn);
      if (existing != null) {
        if (existing !== plan.artifact.integrity) {
          throw new Error(
            `${plan.artifact.name}@${version} already exists with different integrity; refusing to overwrite.`,
          );
        }
        plan.skip = true;
      }
    }
  }

  let publishError = null;
  try {
    for (const plan of plans) {
      if (plan.skip) {
        console.log(
          `${plan.artifact.name}@${version} already matches ${plan.artifact.integrity}; skipping.`,
        );
        continue;
      }
      publishArtifact(plan.artifact, runNpmFn);
    }
  } catch (error) {
    publishError = error;
  }

  let visibilityError = null;
  try {
    await assertAllPackageVisibility(artifacts, {
      fetchImpl,
      phase: 'post-publish check',
      registryUrl,
    });
  } catch (error) {
    visibilityError = error;
  }
  if (visibilityError != null && publishError != null) {
    throw new AggregateError(
      [publishError, visibilityError],
      'The npm release may be partially published and visibility could not be confirmed. Do not retry; investigate registry state first.',
    );
  }
  if (visibilityError != null) {
    const errors = visibilityError instanceof AggregateError
      ? visibilityError.errors
      : [visibilityError];
    throw new AggregateError(
      errors,
      `The npm release published all artifacts, but the mandatory post-publish visibility audit failed. Do not retry; investigate registry state first.\n${visibilityError.message}`,
      { cause: visibilityError },
    );
  }
  if (publishError != null) {
    throw publishError;
  }

  const publishConfig = artifacts[0].packageManifest.publishConfig;
  console.log(
    `npm release completed for ${version} with ${publishConfig.access} access and the ${publishConfig.tag} tag.`,
  );
}

async function main() {
  const { manifest, version } = parseArguments(process.argv.slice(2));
  await publishRelease({
    bootstrapTokenEnabled:
      process.env.WUI_NPM_BOOTSTRAP_TOKEN_ENABLED === 'true',
    expectedAccess: releaseAccessFromEnvironment(
      process.env.WUI_NPM_STABLE_RELEASE_ACCESS,
    ),
    manifestPath: manifest,
    releaseEnabled: process.env.WUI_NPM_RELEASE_ENABLED,
    version,
  });
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  await main();
}
