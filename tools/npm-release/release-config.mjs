/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const PACKAGE_ENTRY_POINTS = Object.freeze({
  main: './dist/index.js',
  module: './dist/index.js',
  types: './dist/index.d.ts',
});
const REACT_PEERS = Object.freeze({
  react: '^19.2.7',
  'react-dom': '^19.2.7',
  'react-router-dom': '^7.17.0',
});
const ROUTER_PEER_META = Object.freeze({
  'react-router-dom': Object.freeze({ optional: true }),
});

function prepackStep(runner, arguments_ = [], script = null) {
  return Object.freeze({
    arguments: Object.freeze(arguments_),
    runner,
    ...(script == null ? {} : { script }),
  });
}

const VALIDATED_PREPACK_GUARD = prepackStep(
  'npm-node',
  [],
  '../../tools/npm-release/assert-validated-prepack.mjs',
);

function definePrepackSteps(...steps) {
  return Object.freeze([VALIDATED_PREPACK_GUARD, ...steps]);
}

export const PACKAGE_ORDER = Object.freeze([
  Object.freeze({
    directory: 'packages/androidx-shapes',
    internalDependencies: Object.freeze({}),
    license: 'Apache-2.0',
    name: '@wearables-ui-toolkit/androidx-shapes',
    peerDependencies: Object.freeze({}),
    peerDependenciesMeta: Object.freeze({}),
    prepackSteps: definePrepackSteps(
      prepackStep('vite', ['build']),
      prepackStep('tsc', ['-p', 'tsconfig.build.json']),
    ),
  }),
  Object.freeze({
    directory: 'packages/icons',
    internalDependencies: Object.freeze({}),
    license: 'SEE LICENSE IN LICENSE',
    name: '@wearables-ui-toolkit/icons',
    peerDependencies: Object.freeze({}),
    peerDependenciesMeta: Object.freeze({}),
    prepackSteps: definePrepackSteps(
      prepackStep('node', [], 'scripts/generate-icon-exports.mjs'),
      prepackStep('node', [], 'scripts/clean-icon-dist.mjs'),
      prepackStep('tsc', ['-p', 'tsconfig.build.json']),
      prepackStep('node', ['--dist'], 'scripts/generate-icon-exports.mjs'),
      prepackStep('node', [], 'scripts/copy-icon-assets.mjs'),
      prepackStep('node', [], 'scripts/verify-icon-build.mjs'),
    ),
  }),
  Object.freeze({
    directory: 'packages/foundation',
    internalDependencies: Object.freeze({
      '@wearables-ui-toolkit/androidx-shapes': true,
    }),
    license: 'Apache-2.0',
    name: '@wearables-ui-toolkit/foundation',
    peerDependencies: REACT_PEERS,
    peerDependenciesMeta: ROUTER_PEER_META,
    prepackSteps: definePrepackSteps(
      prepackStep('node', ['--check'], 'scripts/generate-corner-radius-css.mjs'),
      prepackStep('vite', ['build']),
      prepackStep('node', [], 'scripts/verify-styles.mjs'),
      prepackStep('tsc', ['-p', 'tsconfig.build.json']),
      prepackStep('node', [], 'scripts/verify-public-declarations.mjs'),
    ),
  }),
  Object.freeze({
    directory: 'packages/mrbd',
    internalDependencies: Object.freeze({
      '@wearables-ui-toolkit/foundation': true,
    }),
    license: 'Apache-2.0',
    name: '@wearables-ui-toolkit/mrbd',
    peerDependencies: REACT_PEERS,
    peerDependenciesMeta: ROUTER_PEER_META,
    prepackSteps: definePrepackSteps(
      prepackStep('node', [], 'scripts/generate-public-api.mjs'),
      prepackStep('vite', ['build']),
      prepackStep('node', [], 'scripts/verify-styles.mjs'),
      prepackStep('tsc', ['-p', 'tsconfig.build.json']),
      prepackStep('node', [], 'scripts/verify-public-declarations.mjs'),
      prepackStep('node', ['--check'], 'scripts/generate-public-api.mjs'),
    ),
  }),
]);

const PREPACK_TOOL_SCRIPTS = Object.freeze({
  tsc: 'node_modules/typescript/bin/tsc',
  vite: 'node_modules/vite/bin/vite.js',
});

export function packagePrepackCommand(entry) {
  if (!Array.isArray(entry.prepackSteps) || entry.prepackSteps.length === 0) {
    throw new Error(`Missing structured prepack definition for ${entry.name}.`);
  }
  return entry.prepackSteps.map(step => {
    const arguments_ = step.runner === 'node' || step.runner === 'npm-node'
      ? [step.script, ...step.arguments]
      : step.arguments;
    if (arguments_.some(token => typeof token !== 'string' || !/^[A-Za-z0-9_@./:+-]+$/.test(token))) {
      throw new Error(`${entry.name} has an unsafe prepack command token.`);
    }
    const runner = step.runner === 'npm-node'
      ? '"$npm_node_execpath"'
      : step.runner;
    return [runner, ...arguments_].join(' ');
  }).join(' && ');
}

export function packagePrepackSteps(root, entry) {
  packagePrepackCommand(entry);
  return entry.prepackSteps.map(step => {
    if (step.runner === 'node' || step.runner === 'npm-node') {
      if (typeof step.script !== 'string' || step.script === '') {
        throw new Error(`${entry.name} has a Node prepack step without a script.`);
      }
      return [step.script, ...step.arguments];
    }
    const script = PREPACK_TOOL_SCRIPTS[step.runner];
    if (script == null) {
      throw new Error(`${entry.name} has an unsupported prepack runner: ${step.runner}`);
    }
    return [path.resolve(root, script), ...step.arguments];
  });
}

export const NPM_REGISTRY_URL = 'https://registry.npmjs.org/';
export const STAGING_PUBLISH_CONFIG = Object.freeze({
  access: 'restricted',
  registry: NPM_REGISTRY_URL,
  tag: 'next',
});
export const PRIVATE_RELEASE_PUBLISH_CONFIG = Object.freeze({
  access: 'restricted',
  registry: NPM_REGISTRY_URL,
  tag: 'latest',
});
export const PUBLIC_RELEASE_PUBLISH_CONFIG = Object.freeze({
  access: 'public',
  registry: NPM_REGISTRY_URL,
  tag: 'latest',
});

const PUBLIC_PACKAGE_NAMES = new Set(PACKAGE_ORDER.map(entry => entry.name));
const RELEASE_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export function assertReleaseVersion(version) {
  if (
    typeof version !== 'string' ||
    version.trim() !== version ||
    !RELEASE_SEMVER.test(version)
  ) {
    throw new Error(`npm releases require strict SemVer, received: ${version}`);
  }
  return version;
}

export function assertPrereleaseVersion(version) {
  const releaseVersion = assertReleaseVersion(version);
  if (!releaseVersion.split('+', 1)[0].includes('-')) {
    throw new Error(
      `Private npm staging requires a strict SemVer prerelease, received: ${version}`,
    );
  }
  return releaseVersion;
}

export function assertStableReleaseVersion(version) {
  const releaseVersion = assertReleaseVersion(version);
  if (releaseVersion.split('+', 1)[0].includes('-')) {
    throw new Error(
      `Production npm releases require a stable version, received: ${version}`,
    );
  }
  return releaseVersion;
}

export function dependencyVersionFor(version) {
  return assertReleaseVersion(version).split('+', 1)[0];
}

export function assertReleaseAccess(access) {
  if (access !== 'restricted' && access !== 'public') {
    throw new Error(`npm release access must be restricted or public, received: ${access}`);
  }
  return access;
}

export function publishConfigForRelease(version, access = 'restricted') {
  const releaseVersion = assertReleaseVersion(version);
  const prerelease = releaseVersion.split('+', 1)[0].includes('-');
  assertReleaseAccess(access);
  if (prerelease && access !== 'restricted') {
    throw new Error('Prerelease packages must remain restricted.');
  }
  return {
    access,
    registry: NPM_REGISTRY_URL,
    tag: prerelease ? 'next' : 'latest',
  };
}

export function assertReleaseEnabled(value) {
  if (value !== 'true') {
    throw new Error(
      'npm publishing requires WUI_NPM_RELEASE_ENABLED=true.',
    );
  }
  return value;
}

export function parseStagingReleaseTitle(title) {
  const prefix = 'Release version ';
  if (!title.startsWith(prefix)) {
    return null;
  }
  const version = title.slice(prefix.length);
  if (version.length === 0 || version.trim() !== version) {
    throw new Error('Release titles must be exactly `Release version <version>`');
  }
  return assertStableReleaseVersion(version);
}

function assertOnlyKeys(actual, expectedKeys, label) {
  const actualObject = actual ?? {};
  if (
    typeof actualObject !== 'object' ||
    Array.isArray(actualObject) ||
    actualObject == null
  ) {
    throw new Error(`${label} must be an object.`);
  }
  const actualKeys = Object.keys(actualObject).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(sortedExpectedKeys)) {
    throw new Error(
      `${label} must contain exactly ${sortedExpectedKeys.join(', ') || '(no fields)'}.`,
    );
  }
  return actualObject;
}

export function assertExactObject(actual, expected, label) {
  const expectedKeys = Object.keys(expected).sort();
  const actualObject = assertOnlyKeys(actual, expectedKeys, label);
  for (const key of expectedKeys) {
    const actualValue = actualObject[key];
    const expectedValue = expected[key];
    if (
      expectedValue != null &&
      typeof expectedValue === 'object' &&
      !Array.isArray(expectedValue)
    ) {
      assertExactObject(actualValue, expectedValue, `${label}.${key}`);
    } else if (actualValue !== expectedValue) {
      throw new Error(
        `${label}.${key} must be ${JSON.stringify(expectedValue)}, received ${JSON.stringify(actualValue)}.`,
      );
    }
  }
}

function assertReleasePublishConfig(manifest, packageName) {
  const label = `${packageName} publishConfig`;
  const publishConfig = assertOnlyKeys(
    manifest.publishConfig,
    ['access', 'registry', 'tag'],
    label,
  );
  let expectedConfig;
  try {
    expectedConfig = publishConfigForRelease(manifest.version, publishConfig.access);
  } catch (error) {
    throw new Error(`${label} is invalid: ${error.message}`, { cause: error });
  }
  assertExactObject(publishConfig, expectedConfig, label);
}

export function assertSourcePackageBoundary(manifest, packageName) {
  assertReleasePublishConfig(manifest, packageName);
  if (manifest.publishConfig.access !== 'restricted') {
    throw new Error(
      `${packageName} source publishConfig.access must remain restricted.`,
    );
  }
  if (manifest.private !== true) {
    throw new Error(
      `${packageName} source manifest must set private to true.`,
    );
  }
}

export function assertStagedPackageBoundary(manifest, packageName) {
  assertReleasePublishConfig(manifest, packageName);
  if (Object.hasOwn(manifest, 'private') && manifest.private !== false) {
    throw new Error(
      `${packageName} staged manifest private must be absent or false.`,
    );
  }
}

export function createStagedPackageManifest(
  sourceManifest,
  packageName,
  releaseAccess = null,
) {
  assertSourcePackageBoundary(sourceManifest, packageName);
  const stagedManifest = { ...sourceManifest };
  if (releaseAccess != null) {
    stagedManifest.publishConfig = publishConfigForRelease(
      sourceManifest.version,
      releaseAccess,
    );
  }
  delete stagedManifest.private;
  assertStagedPackageBoundary(stagedManifest, packageName);
  return stagedManifest;
}

export function readPackageManifest(root, entry) {
  const manifestPath = path.resolve(root, entry.directory, 'package.json');
  return {
    manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
    manifestPath,
  };
}

function assertInternalDependencies(entry, manifest, dependencyVersion) {
  const expectedNames = Object.keys(entry.internalDependencies).sort();
  const observed = [];
  for (const field of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]) {
    for (const [dependencyName, version] of Object.entries(manifest[field] ?? {})) {
      if (!PUBLIC_PACKAGE_NAMES.has(dependencyName)) {
        continue;
      }
      observed.push({ dependencyName, field, version });
    }
  }
  const observedNames = observed.map(value => value.dependencyName).sort();
  if (JSON.stringify(observedNames) !== JSON.stringify(expectedNames)) {
    throw new Error(
      `${entry.name} must declare exactly these internal dependencies: ${expectedNames.join(', ') || '(none)'}.`,
    );
  }
  for (const dependencyName of expectedNames) {
    const dependency = observed.find(value => value.dependencyName === dependencyName);
    if (dependency?.field !== 'dependencies') {
      throw new Error(
        `${entry.name} must declare ${dependencyName} in dependencies.`,
      );
    }
    if (dependency.version !== dependencyVersion) {
      throw new Error(
        `${entry.name} dependencies.${dependencyName} must be exactly ${dependencyVersion}, received ${dependency.version}.`,
      );
    }
  }
}

function validatePackageManifestCollectionWithBoundary(
  manifests,
  expectedVersion,
  assertPackageBoundary,
) {
  const releaseVersion = expectedVersion == null
    ? null
    : assertReleaseVersion(expectedVersion);

  for (const entry of PACKAGE_ORDER) {
    const manifest = manifests.get(entry.name);
    if (manifest == null) {
      throw new Error(`Missing manifest for ${entry.name}.`);
    }
    if (manifest.name !== entry.name) {
      throw new Error(
        `Package manifest must be named ${entry.name}, received ${manifest.name}.`,
      );
    }
    if (manifest.license !== entry.license) {
      throw new Error(
        `${entry.name} must declare \"license\": \"${entry.license}\".`,
      );
    }
    const manifestVersion = assertReleaseVersion(manifest.version);
    if (releaseVersion != null && manifestVersion !== releaseVersion) {
      throw new Error(
        `${entry.name} must use version ${releaseVersion}, received ${manifestVersion}.`,
      );
    }
    assertPackageBoundary(manifest, entry.name);
    assertExactObject(
      Object.fromEntries(
        Object.keys(PACKAGE_ENTRY_POINTS).map(field => [field, manifest[field]]),
      ),
      PACKAGE_ENTRY_POINTS,
      `${entry.name} entry points`,
    );
    assertExactObject(
      manifest.peerDependencies,
      entry.peerDependencies,
      `${entry.name} peerDependencies`,
    );
    assertExactObject(
      manifest.peerDependenciesMeta,
      entry.peerDependenciesMeta,
      `${entry.name} peerDependenciesMeta`,
    );
  }

  const versions = new Set([...manifests.values()].map(manifest => manifest.version));
  if (versions.size !== 1) {
    throw new Error(
      `Release package versions must match exactly: ${[...versions].join(', ')}.`,
    );
  }
  const expectedPublishConfig = manifests.get(PACKAGE_ORDER[0].name).publishConfig;
  for (const entry of PACKAGE_ORDER.slice(1)) {
    assertExactObject(
      manifests.get(entry.name).publishConfig,
      expectedPublishConfig,
      `${entry.name} publishConfig`,
    );
  }
  const version = assertReleaseVersion(releaseVersion ?? [...versions][0]);
  const dependencyVersion = dependencyVersionFor(version);

  for (const entry of PACKAGE_ORDER) {
    assertInternalDependencies(
      entry,
      manifests.get(entry.name),
      dependencyVersion,
    );
  }

  return { manifests, version };
}

export function validatePackageManifestCollection(manifests, expectedVersion = null) {
  return validatePackageManifestCollectionWithBoundary(
    manifests,
    expectedVersion,
    assertStagedPackageBoundary,
  );
}

export function validateSourcePackageManifestCollection(
  manifests,
  expectedVersion = null,
) {
  return validatePackageManifestCollectionWithBoundary(
    manifests,
    expectedVersion,
    assertSourcePackageBoundary,
  );
}

export function validatePackageManifests(root, expectedVersion = null) {
  const rootManifest = JSON.parse(
    readFileSync(path.resolve(root, 'package.json'), 'utf8'),
  );
  if (rootManifest.private !== true) {
    throw new Error('The root workspace must remain private.');
  }

  const manifests = new Map();
  for (const entry of PACKAGE_ORDER) {
    const { manifest, manifestPath } = readPackageManifest(root, entry);
    if (manifest.name !== entry.name) {
      throw new Error(
        `${manifestPath} must be named ${entry.name}, received ${manifest.name}.`,
      );
    }
    manifests.set(entry.name, manifest);
  }
  return validateSourcePackageManifestCollection(manifests, expectedVersion);
}
