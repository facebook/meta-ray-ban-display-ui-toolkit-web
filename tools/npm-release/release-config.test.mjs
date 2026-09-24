/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  missingAndroidXPublishedPolicyFiles,
  missingIconPublishedPolicyFiles,
  validateLicensePolicy,
} from '../validate-license.mjs';
import {
  PACKAGE_ORDER,
  PRIVATE_RELEASE_PUBLISH_CONFIG,
  PUBLIC_RELEASE_PUBLISH_CONFIG,
  STAGING_PUBLISH_CONFIG,
  assertPrereleaseVersion,
  assertReleaseVersion,
  assertReleaseEnabled,
  createStagedPackageManifest,
  dependencyVersionFor,
  packagePrepackCommand,
  packagePrepackSteps,
  parseStagingReleaseTitle,
  publishConfigForRelease,
  validatePackageManifestCollection,
  validatePackageManifests,
} from './release-config.mjs';
import {
  assertPacklistUnchanged,
  createLocalRegistryRequestHandler,
  createPackageStage,
  generatePackageReadme,
  isolatedNpmEnvironment,
  parsePackOutput,
  parseRegistryPort,
  packStagedPackage,
  runPackagePrepack,
  runValidatedPackageLifecycles,
  scanTarball,
  startLocalRegistry,
  validateTarballPolicyFiles,
  verifyNpmRegistryIsolation,
  waitForPortFile,
} from './validate-packages.mjs';
import {
  assertPackageNotPublic,
  assertPackageVisibility,
  parseIntegrity,
  prevalidateReleaseArtifacts,
  publishRelease,
  releaseAccessFromEnvironment,
  sriForFile,
  validateTarEntryNames,
} from './publish-staging.mjs';
import {
  validatePublicDeclarations,
} from './validate-public-declarations.mjs';
import {
  CANARY_PACKAGE_NAME,
  assertCanaryVersion,
  preparePublishingCanary,
} from './prepare-publishing-canary.mjs';
import {
  publishCanary,
  validateCanaryArtifact,
} from './publish-canary.mjs';
import {
  launchPublicRelease,
} from './launch-public.mjs';

const fixtures = [];
const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const NPM_BIN = process.env.NPM_BIN ?? 'npm';
const NODE_BIN = path.resolve(process.env.NODE_BIN ?? process.execPath);
const TAR_BIN = process.env.TAR_BIN ?? 'tar';
const PROJECT_LICENSE = 'canonical project license\n';
const PROJECT_NOTICE = 'canonical project notice with font and icon carve-outs\n';
const ICON_LICENSE = 'canonical icon package terms\n';
const ANDROIDX_LICENSE = 'canonical AndroidX license\n';
const ANDROIDX_NOTICE = 'canonical AndroidX attribution\n';

function createStagingFixture(packageName, mutateSource = () => {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'wui-staging-source-test-'));
  const stagingRoot = mkdtempSync(path.join(tmpdir(), 'wui-staging-output-test-'));
  fixtures.push(root, stagingRoot);
  writeFileSync(path.join(root, 'LICENSE'), PROJECT_LICENSE);
  writeFileSync(path.join(root, 'NOTICE'), PROJECT_NOTICE);
  writeFileSync(path.join(root, 'tsconfig.base.json'), '{}\n');
  for (const relative of [
    'packages/foundation/README.md',
  ]) {
    const target = path.join(root, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, `${relative}\n`);
  }

  const entry = PACKAGE_ORDER.find(value => value.name === packageName);
  assert.notEqual(entry, undefined);
  const sourcePackageRoot = path.join(root, entry.directory);
  mkdirSync(sourcePackageRoot, { recursive: true });
  mkdirSync(path.join(sourcePackageRoot, 'src'), { recursive: true });
  writeFileSync(path.join(sourcePackageRoot, 'src/example.png'), 'example\n');
  for (const dependencyName of Object.keys(entry.internalDependencies)) {
    const dependencyEntry = PACKAGE_ORDER.find(
      value => value.name === dependencyName,
    );
    assert.notEqual(dependencyEntry, undefined);
    mkdirSync(path.join(stagingRoot, dependencyEntry.directory), {
      recursive: true,
    });
  }
  writeFileSync(
    path.join(sourcePackageRoot, 'package.json'),
    JSON.stringify({
      files: ['dist', 'LICENSE', 'NOTICE', 'README.md'],
      license: entry.license,
      name: entry.name,
      private: true,
      publishConfig: STAGING_PUBLISH_CONFIG,
      type: 'module',
      version: '1.2.3-next.1',
    }),
  );
  const isAndroidX = packageName.endsWith('/androidx-shapes');
  const isIcons = packageName.endsWith('/icons');
  writeFileSync(
    path.join(sourcePackageRoot, 'README.md'),
    isAndroidX
      ? 'package readme\n'
      : 'legal [license](../../LICENSE) [notice](../../NOTICE)\n',
  );
  if (isIcons) {
    writeFileSync(path.join(sourcePackageRoot, 'LICENSE'), ICON_LICENSE);
  }
  if (isAndroidX) {
    writeFileSync(path.join(sourcePackageRoot, 'LICENSE'), ANDROIDX_LICENSE);
    writeFileSync(path.join(sourcePackageRoot, 'NOTICE'), ANDROIDX_NOTICE);
    writeFileSync(path.join(sourcePackageRoot, 'UPSTREAM.md'), 'upstream\n');
  }
  mutateSource({ entry, root, sourcePackageRoot, stagingRoot });

  return {
    entry,
    root,
    sourcePackageRoot,
    ...createPackageStage(root, stagingRoot, entry, null, {
      npm: NPM_BIN,
    }),
  };
}

function runChecked(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: options.cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(
    result.status,
    0,
    `${command} ${arguments_.join(' ')} failed:\n${result.stdout}\n${result.stderr}`,
  );
  return result.stdout;
}

function runNpmChecked(arguments_, options = {}) {
  return NPM_BIN.endsWith('.js')
    ? runChecked(process.execPath, [NPM_BIN, ...arguments_], options)
    : runChecked(NPM_BIN, arguments_, options);
}

test.afterEach(() => {
  for (const fixture of fixtures) {
    rmSync(fixture, { force: true, recursive: true });
  }
  fixtures.length = 0;
});

function expectedDependencies(entry, version) {
  return Object.fromEntries(
    Object.keys(entry.internalDependencies).map(name => [
      name,
      dependencyVersionFor(version),
    ]),
  );
}

function packageManifest(entry, version, overrides = {}) {
  return {
    main: './dist/index.js',
    module: './dist/index.js',
    license: entry.license,
    name: entry.name,
    private: true,
    types: './dist/index.d.ts',
    version,
    dependencies: expectedDependencies(entry, version),
    peerDependencies: entry.peerDependencies,
    peerDependenciesMeta: entry.peerDependenciesMeta,
    publishConfig: publishConfigForRelease(version),
    scripts: {
      prepublishOnly: 'exit 97',
    },
    ...overrides,
  };
}

function createFixture(version = '1.2.3-next.1') {
  const root = mkdtempSync(path.join(tmpdir(), 'wui-release-config-test-'));
  fixtures.push(root);
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ private: true }),
  );
  for (const entry of PACKAGE_ORDER) {
    const directory = path.join(root, entry.directory);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify(packageManifest(entry, version)),
    );
  }
  return root;
}

function withPrepackScript(entry, script = 'scripts/prepack.mjs') {
  return {
    ...entry,
    prepackSteps: [{ arguments: [], runner: 'node', script }],
  };
}

function readManifest(root, directory) {
  const manifestPath = path.join(root, directory, 'package.json');
  return {
    manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
    manifestPath,
  };
}

function writeManifest(manifestPath, manifest) {
  writeFileSync(manifestPath, JSON.stringify(manifest));
}

function runTar(arguments_) {
  const result = spawnSync('tar', arguments_, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(
    result.status,
    0,
    `tar ${arguments_.join(' ')} failed:\n${result.stdout}\n${result.stderr}`,
  );
}

function writeArtifactTarball(
  root,
  entry,
  version,
  overrides = {},
  releaseAccess = null,
) {
  const sourceRoot = path.join(
    root,
    `source-${entry.name.split('/').at(-1)}`,
  );
  const packageRoot = path.join(sourceRoot, 'package');
  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(
    path.join(packageRoot, 'package.json'),
    `${JSON.stringify(createStagedPackageManifest(
      packageManifest(entry, version, overrides),
      entry.name,
      releaseAccess,
    ), null, 2)}\n`,
  );
  writeFileSync(path.join(packageRoot, 'README.md'), `${entry.name}\n`);
  const filename =
    `wearables-ui-toolkit-${entry.name.split('/').at(-1)}-${version}.tgz`;
  const tarball = path.join(root, filename);
  rmSync(tarball, { force: true });
  runTar([
    '-czf',
    tarball,
    '-C',
    sourceRoot,
    'package/package.json',
    'package/README.md',
  ]);
  return { filename, tarball };
}

function createArtifactFixture(options = {}) {
  const version = options.version ?? '1.0.0';
  const root = mkdtempSync(path.join(tmpdir(), 'wui-release-artifacts-'));
  fixtures.push(root);
  const packages = PACKAGE_ORDER.map((entry, index) => {
    const overrides = options.packageOverrides?.get(index) ?? {};
    const { filename, tarball } = writeArtifactTarball(
      root,
      entry,
      version,
      overrides,
      options.releaseAccess ?? null,
    );
    return {
      directory: entry.directory,
      filename,
      integrity: sriForFile(tarball),
      name: entry.name,
      version,
    };
  });
  const manifestPath = path.join(root, 'pack-manifest.json');
  writeFileSync(
    manifestPath,
    `${JSON.stringify({ packages, version }, null, 2)}\n`,
  );
  return { manifestPath, packages, root, version };
}

function replaceTarballWithDuplicateManifest(fixture, index) {
  const entry = PACKAGE_ORDER[index];
  const sourceRoot = path.join(
    fixture.root,
    `source-${entry.name.split('/').at(-1)}`,
  );
  const tarball = path.join(
    fixture.root,
    fixture.packages[index].filename,
  );
  rmSync(tarball, { force: true });
  runTar([
    '-czf',
    tarball,
    '-C',
    sourceRoot,
    'package/package.json',
    'package/package.json',
  ]);
  updateReleaseManifest(fixture, release => {
    release.packages[index].integrity = sriForFile(tarball);
  });
}

function updateReleaseManifest(fixture, callback) {
  const release = JSON.parse(readFileSync(fixture.manifestPath, 'utf8'));
  callback(release);
  writeFileSync(
    fixture.manifestPath,
    `${JSON.stringify(release, null, 2)}\n`,
  );
}

function fakeNpm(log, options = {}) {
  return (arguments_) => {
    log.push(arguments_);
    if (arguments_[0] === '--version') {
      return { status: 0, stderr: '', stdout: '11.5.1\n' };
    }
    if (arguments_[0] === 'view') {
      if (options.existingIntegrity != null) {
        return {
          status: 0,
          stderr: '',
          stdout: `${JSON.stringify(options.existingIntegrity)}\n`,
        };
      }
      return { status: 1, stderr: 'E404 Not Found\n', stdout: '' };
    }
    if (arguments_[0] === 'publish') {
      return { status: options.publishStatus ?? 0, stderr: '', stdout: '' };
    }
    return { status: 90, stderr: 'unexpected fake npm command', stdout: '' };
  };
}

function privateFetch(log = []) {
  return async (url, options) => {
    log.push({ options, url: String(url) });
    return new Response('', { status: 404 });
  };
}

async function withServer(handler, callback) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  try {
    return await callback(`http://127.0.0.1:${address.port}/`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('publishing canary is permanently private and version-constrained', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'wui-publishing-canary-'));
  const source = path.join(root, 'source');
  const output = path.join(root, 'output');
  fixtures.push(root);
  mkdirSync(output);
  const version = '0.0.0-canary.1';
  const manifest = preparePublishingCanary(source, version);
  assert.equal(manifest.name, CANARY_PACKAGE_NAME);
  assert.equal(manifest.publishConfig.access, 'restricted');
  assert.equal(manifest.publishConfig.tag, 'next');
  assert.throws(() => assertCanaryVersion('1.0.0'), /must match/);
  runNpmChecked(
    ['pack', source, '--ignore-scripts', '--pack-destination', output],
    { cwd: root },
  );
  assert.match(validateCanaryArtifact(output, version), /\.tgz$/);
  const npmLog = [];
  await publishCanary({
    canaryEnabled: 'true',
    directory: output,
    fetchImpl: privateFetch(),
    runNpmFn: fakeNpm(npmLog),
    version,
  });
  const publish = npmLog.find(args => args[0] === 'publish');
  assert.notEqual(publish, undefined);
  assert.ok(publish.includes('--access=restricted'));
  assert.ok(publish.includes('--tag=next'));
  assert.ok(publish.includes('--ignore-scripts'));
  assert.ok(!publish.includes('--provenance'));
});

test('publishing canary requires the script-level enable gate', async () => {
  await assert.rejects(
    publishCanary({ directory: '/unused', version: '0.0.0-canary.1' }),
    /WUI_NPM_CANARY_ENABLED=true/,
  );
});

test('public launch preflights every package before changing visibility', async () => {
  const npmLog = [];
  const visibilityLog = [];
  const version = '1.0.0';
  const runNpmFn = arguments_ => {
    npmLog.push(arguments_);
    if (arguments_[0] === 'view') {
      return { status: 0, stderr: '', stdout: `${JSON.stringify(version)}\n` };
    }
    if (arguments_[0] === 'access') {
      return { status: 0, stderr: '', stdout: '' };
    }
    return { status: 90, stderr: 'unexpected command', stdout: '' };
  };
  const fetchImpl = async url => {
    visibilityLog.push(String(url));
    if (visibilityLog.length <= PACKAGE_ORDER.length) {
      return new Response('', { status: 404 });
    }
    const packageName = decodeURIComponent(new URL(url).pathname.slice(1));
    return new Response(JSON.stringify({
      'dist-tags': { latest: version },
      versions: { [version]: { name: packageName, version } },
    }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  };
  await launchPublicRelease({
    confirmation: 'MAKE_PUBLIC',
    publicLaunchEnabled: 'true',
    fetchImpl,
    runNpmFn,
    version,
  });
  const accessCalls = npmLog.filter(args => args[0] === 'access');
  assert.deepEqual(
    accessCalls.map(args => args[3]),
    PACKAGE_ORDER.map(entry => entry.name),
  );
  const firstAccess = npmLog.findIndex(args => args[0] === 'access');
  const lastView = npmLog.map(args => args[0]).lastIndexOf('view');
  assert.ok(firstAccess > lastView);
  assert.equal(visibilityLog.length, PACKAGE_ORDER.length * 2);
});

test('public launch performs no mutations when any private version is missing', async () => {
  const npmLog = [];
  let viewCount = 0;
  await assert.rejects(
    launchPublicRelease({
      confirmation: 'MAKE_PUBLIC',
      publicLaunchEnabled: 'true',
      fetchImpl: privateFetch(),
      runNpmFn: arguments_ => {
        npmLog.push(arguments_);
        if (arguments_[0] === 'view') {
          viewCount += 1;
          return {
            status: 0,
            stderr: '',
            stdout: `${JSON.stringify(viewCount === 2 ? '0.9.0' : '1.0.0')}\n`,
          };
        }
        return { status: 0, stderr: '', stdout: '' };
      },
      version: '1.0.0',
    }),
    /must be exactly 1\.0\.0/,
  );
  assert.equal(npmLog.some(args => args[0] === 'access'), false);
});

test('public launch reports that the first visibility mutation did not complete', async () => {
  const version = '1.0.0';
  await assert.rejects(
    launchPublicRelease({
      confirmation: 'MAKE_PUBLIC',
      publicLaunchEnabled: 'true',
      fetchImpl: privateFetch(),
      runNpmFn: arguments_ => {
        if (arguments_[0] === 'view') {
          return { status: 0, stderr: '', stdout: `${JSON.stringify(version)}\n` };
        }
        if (arguments_[0] === 'access') {
          return { status: 1, stderr: 'access failed\n', stdout: '' };
        }
        return { status: 90, stderr: 'unexpected command', stdout: '' };
      },
      version,
    }),
    error => {
      assert.match(error.message, /could not confirm any visibility changes/);
      assert.match(error.cause.message, /npm access set status=public/);
      return true;
    },
  );
});

test('public launch contextualizes anonymous verification network failures', async () => {
  const version = '1.0.0';
  let fetchCount = 0;
  await assert.rejects(
    launchPublicRelease({
      confirmation: 'MAKE_PUBLIC',
      publicLaunchEnabled: 'true',
      fetchImpl: async () => {
        fetchCount += 1;
        if (fetchCount <= PACKAGE_ORDER.length) {
          return new Response('', { status: 404 });
        }
        throw new Error('network unavailable');
      },
      runNpmFn: arguments_ => {
        if (arguments_[0] === 'view') {
          return { status: 0, stderr: '', stdout: `${JSON.stringify(version)}\n` };
        }
        if (arguments_[0] === 'access') {
          return { status: 0, stderr: '', stdout: '' };
        }
        return { status: 90, stderr: 'unexpected command', stdout: '' };
      },
      version,
    }),
    error => {
      assert.ok(error instanceof AggregateError);
      assert.match(error.message, /public metadata verification failed/);
      assert.equal(error.errors.length, PACKAGE_ORDER.length);
      for (const failure of error.errors) {
        assert.match(
          failure.message,
          /Unable to determine unauthenticated public visibility.*public-launch verification/,
        );
        assert.equal(failure.cause.message, 'network unavailable');
      }
      return true;
    },
  );
});

test('public launch rejects a malformed registry metadata response', async () => {
  const version = '1.0.0';
  let fetchCount = 0;
  await assert.rejects(
    launchPublicRelease({
      confirmation: 'MAKE_PUBLIC',
      publicLaunchEnabled: 'true',
      fetchImpl: async () => {
        fetchCount += 1;
        if (fetchCount <= PACKAGE_ORDER.length) {
          return new Response('', { status: 404 });
        }
        return new Response('not json', { status: 200 });
      },
      runNpmFn: arguments_ => {
        if (arguments_[0] === 'view') {
          return { status: 0, stderr: '', stdout: `${JSON.stringify(version)}\n` };
        }
        if (arguments_[0] === 'access') {
          return { status: 0, stderr: '', stdout: '' };
        }
        return { status: 90, stderr: 'unexpected command', stdout: '' };
      },
      version,
    }),
    error => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors.length, PACKAGE_ORDER.length);
      for (const failure of error.errors) {
        assert.match(failure.message, /returned malformed public metadata after launch/);
        assert.ok(failure.cause instanceof SyntaxError);
      }
      return true;
    },
  );
});

test('public launch requires the script-level enable gate', async () => {
  await assert.rejects(
    launchPublicRelease({ confirmation: 'MAKE_PUBLIC', version: '1.0.0' }),
    /WUI_NPM_PUBLIC_LAUNCH_ENABLED=true/,
  );
});

test('public launch refuses invalid confirmation and prerelease versions', async () => {
  await assert.rejects(
    launchPublicRelease({ confirmation: 'no', version: '1.0.0' }),
    /confirmation MAKE_PUBLIC/,
  );
  await assert.rejects(
    launchPublicRelease({
      confirmation: 'MAKE_PUBLIC',
      publicLaunchEnabled: 'true',
      version: '1.0.0-next.1',
    }),
    /requires a stable version/,
  );
});

test('accepts stable release titles and reserves production names from prereleases', () => {
  assert.equal(parseStagingReleaseTitle('Release version 1.2.3'), '1.2.3');
  for (const title of [
    'Release version 1.2.3-next.4',
    'Release version 2.0.0-rc.1+build.7',
    'Release version 1.2.3-0',
  ]) {
    assert.throws(
      () => parseStagingReleaseTitle(title),
      /Production npm releases require a stable version/,
    );
  }
});

test('ignores unrelated commit titles', () => {
  assert.equal(parseStagingReleaseTitle('Update package docs'), null);
  assert.equal(
    parseStagingReleaseTitle('Private npm staging 1.2.3-next.1'),
    null,
  );
});

test('rejects malformed, padded, and loosely prefixed release titles', () => {
  for (const title of [
    'Release version 01.2.3-next.1',
    'Release version 1.2.3-01',
    'Release version 1.2.3-next..1',
    'Release version 1.2.3-next.1 extra',
    'Release version  1.2.3-next.1',
    'Release version 1.2.3-next.1\n',
  ]) {
    assert.throws(() => parseStagingReleaseTitle(title));
  }
});

test('CLI accepts valid releases and ignores non-release titles', () => {
  const root = createFixture('1.2.3');
  for (const [title, expectedOutput, expectedMessage] of [
    [
      'Release version 1.2.3',
      'release=true\nversion=1.2.3\n',
      'Validated npm release 1.2.3.',
    ],
    [
      'Update package docs',
      'release=false\n',
      'Commit title is not an npm release.',
    ],
    [
      'Release version 1.2.3 done',
      'release=false\n',
      'Commit title is not an npm release.',
    ],
    [
      'Release version',
      'release=false\n',
      'Commit title is not an npm release.',
    ],
  ]) {
    const output = path.join(root, `output-${Math.random()}.txt`);
    const result = spawnSync(
      process.execPath,
      [
        path.join(PROJECT_ROOT, 'tools/npm-release/check-release-title.mjs'),
        '--root',
        root,
        '--title',
        title,
        '--github-output',
        output,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.equal(readFileSync(output, 'utf8'), expectedOutput);
    assert.match(result.stdout, new RegExp(expectedMessage.replaceAll('.', '\\.')));
  }
});

test('CLI fails closed for invalid reserved release titles', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'wui-release-title-test-'));
  fixtures.push(root);
  const titles = [
    'Release version ',
    'Release version    ',
    'Release version 1.2.3-next.1 ',
    'Release version not-a-version',
    'Release version 1.2.3-next.1',
    'Release version  1.2.3-next.1',
  ];
  for (const [index, title] of titles.entries()) {
    const output = path.join(root, `output-${index}.txt`);
    const existingOutput = index % 2 === 1;
    if (existingOutput) {
      writeFileSync(output, 'existing=true\n');
    }
    const result = spawnSync(
      process.execPath,
      [
        path.join(PROJECT_ROOT, 'tools/npm-release/check-release-title.mjs'),
        '--root',
        root,
        '--title',
        title,
        '--github-output',
        output,
      ],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /::error::Invalid npm release title/,
    );
    assert.doesNotMatch(result.stdout, /not an npm release/);
    if (existingOutput) {
      assert.equal(readFileSync(output, 'utf8'), 'existing=true\n');
    } else {
      assert.equal(existsSync(output), false);
    }
  }
});

test('CLI reports manifest validation errors without partial output', () => {
  const root = createFixture('1.2.3');
  fixtures.push(root);
  for (const existingOutput of [false, true]) {
    const output = path.join(root, `manifest-output-${existingOutput}.txt`);
    if (existingOutput) {
      writeFileSync(output, 'existing=true\n');
    }
    const result = spawnSync(
      process.execPath,
      [
        path.join(PROJECT_ROOT, 'tools/npm-release/check-release-title.mjs'),
        '--root',
        root,
        '--title',
        'Release version 1.2.4',
        '--github-output',
        output,
      ],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /::error::Invalid npm package manifests for 1\.2\.4:/,
    );
    assert.doesNotMatch(result.stderr, /\n\s+at /);
    assert.equal(result.stdout, '');
    if (existingOutput) {
      assert.equal(readFileSync(output, 'utf8'), 'existing=true\n');
    } else {
      assert.equal(existsSync(output), false);
    }
  }
});

test('derives restricted prerelease and stable private/public publish policy', () => {
  assert.equal(assertReleaseVersion('1.0.0'), '1.0.0');
  assert.deepEqual(
    publishConfigForRelease('1.0.0-next.1'),
    STAGING_PUBLISH_CONFIG,
  );
  assert.deepEqual(
    publishConfigForRelease('1.0.0'),
    PRIVATE_RELEASE_PUBLISH_CONFIG,
  );
  assert.deepEqual(
    publishConfigForRelease('1.0.0', 'public'),
    PUBLIC_RELEASE_PUBLISH_CONFIG,
  );
  assert.throws(
    () => publishConfigForRelease('1.0.0-next.1', 'public'),
    /Prerelease packages must remain restricted/,
  );
});

test('public visibility checks require public readability', async () => {
  await assert.doesNotReject(
    assertPackageVisibility('@wearables-ui-toolkit/icons', 'public', {
      fetchImpl: async () => new Response('', { status: 200 }),
    }),
  );
  await assert.rejects(
    assertPackageVisibility('@wearables-ui-toolkit/icons', 'public', {
      fetchImpl: async () => new Response('', { status: 404 }),
    }),
    /expected public access/,
  );
});

test('rejects stable, non-string, and whitespace-padded versions directly', () => {
  for (const version of [
    '1.2.3',
    '1.2.3-next.1\n',
    '1.2.3-next.1\r',
    ' 1.2.3-next.1',
    null,
  ]) {
    assert.throws(() => assertPrereleaseVersion(version));
  }
});

test('exports the filesystem manifest validator used by package validation', async () => {
  const releaseConfigModule = await import('./release-config.mjs');
  assert.equal(
    releaseConfigModule.validatePackageManifests,
    validatePackageManifests,
  );
  assert.equal(validatePackageManifests(createFixture()).version, '1.2.3-next.1');
});

test('derives manifest commands and execution argv from one prepack definition', () => {
  for (const entry of PACKAGE_ORDER) {
    const { manifest } = readManifest(PROJECT_ROOT, entry.directory);
    const commandSegments = packagePrepackCommand(entry).split(' && ');
    const executedSteps = packagePrepackSteps(PROJECT_ROOT, entry);
    assert.equal(executedSteps.length, commandSegments.length, entry.name);
    const renderedSteps = executedSteps.map(
      ([script, ...arguments_], index) => {
        const runner = entry.prepackSteps[index].runner;
        if (runner === 'vite' || runner === 'tsc') {
          return [runner, ...arguments_].join(' ');
        }
        const command = runner === 'npm-node'
          ? '"$npm_node_execpath"'
          : 'node';
        return [command, script, ...arguments_].join(' ');
      },
    );
    assert.deepEqual(renderedSteps, commandSegments, entry.name);
    assert.equal(manifest.scripts.prepack, commandSegments.join(' && '));
  }
});

test('pins required internal dependency edges without build metadata', () => {
  assert.equal(
    dependencyVersionFor('1.2.3-next.4+build.7'),
    '1.2.3-next.4',
  );
  const root = createFixture('1.2.3-next.4+build.7');
  assert.equal(
    validatePackageManifests(root).version,
    '1.2.3-next.4+build.7',
  );
});

test('rejects missing, ranged, misplaced, and unexpected internal edges', () => {
  for (const mutate of [
    manifest => delete manifest.dependencies['@wearables-ui-toolkit/foundation'],
    manifest => {
      manifest.dependencies['@wearables-ui-toolkit/foundation'] =
        '^1.2.3-next.1';
    },
    manifest => {
      delete manifest.dependencies['@wearables-ui-toolkit/foundation'];
      manifest.devDependencies = {
        '@wearables-ui-toolkit/foundation': '1.2.3-next.1',
      };
    },
    manifest => {
      manifest.dependencies['@wearables-ui-toolkit/icons'] = '1.2.3-next.1';
    },
  ]) {
    const root = createFixture();
    const { manifest, manifestPath } = readManifest(root, 'packages/mrbd');
    mutate(manifest);
    writeManifest(manifestPath, manifest);
    assert.throws(() => validatePackageManifests(root));
  }
});


test('requires package-specific license declarations', () => {
  const iconsRoot = createFixture();
  const icons = readManifest(iconsRoot, 'packages/icons');
  icons.manifest.license = 'Apache-2.0';
  writeManifest(icons.manifestPath, icons.manifest);
  assert.throws(
    () => validatePackageManifests(iconsRoot),
    /icons must declare "license": "SEE LICENSE IN LICENSE"/,
  );

  const foundationRoot = createFixture();
  const foundation = readManifest(foundationRoot, 'packages/foundation');
  foundation.manifest.license = 'SEE LICENSE IN LICENSE';
  writeManifest(foundation.manifestPath, foundation.manifest);
  assert.throws(
    () => validatePackageManifests(foundationRoot),
    /foundation must declare "license": "Apache-2.0"/,
  );
});

test('requires consistent root JavaScript and declaration entry points', () => {
  for (const mutate of [
    manifest => { delete manifest.main; },
    manifest => { manifest.module = './dist/alternate.js'; },
    manifest => { manifest.types = './dist/alternate.d.ts'; },
  ]) {
    const root = createFixture();
    const { manifest, manifestPath } = readManifest(root, 'packages/mrbd');
    mutate(manifest);
    writeManifest(manifestPath, manifest);
    assert.throws(
      () => validatePackageManifests(root),
      /entry points/,
    );
  }
});

test('requires the exact supported peer dependency contract', () => {
  for (const mutate of [
    manifest => delete manifest.peerDependencies.react,
    manifest => { manifest.peerDependencies.react = '^19.0.0'; },
    manifest => { manifest.peerDependencies['react-dom'] = '19.2.7'; },
    manifest => {
      manifest.peerDependenciesMeta['react-router-dom'].optional = false;
    },
    manifest => { manifest.peerDependencies.extra = '^1.0.0'; },
  ]) {
    const root = createFixture();
    const { manifest, manifestPath } = readManifest(root, 'packages/foundation');
    mutate(manifest);
    writeManifest(manifestPath, manifest);
    assert.throws(() => validatePackageManifests(root));
  }
});

test('requires stable package manifests to use the latest tag', () => {
  const root = createFixture();
  const { manifest, manifestPath } = readManifest(
    root,
    'packages/androidx-shapes',
  );
  manifest.version = '1.2.3';
  writeManifest(manifestPath, manifest);
  assert.throws(
    () => validatePackageManifests(root),
    /publishConfig\.tag must be \"latest\"/,
  );
});

test('requires private source manifests and publishable staged clones', () => {
  const root = createFixture();
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({ private: false }));
  assert.throws(
    () => validatePackageManifests(root),
    /root workspace must remain private/,
  );

  for (const invalidPrivate of [false, 'true', undefined]) {
    const sourceRoot = createFixture();
    const { manifest, manifestPath } = readManifest(
      sourceRoot,
      'packages/icons',
    );
    if (invalidPrivate === undefined) delete manifest.private;
    else manifest.private = invalidPrivate;
    writeManifest(manifestPath, manifest);
    assert.throws(
      () => validatePackageManifests(sourceRoot),
      /source manifest must set private to true/,
    );
  }

  const stagedRoot = createFixture();
  const stagedManifests = new Map(PACKAGE_ORDER.map(entry => {
    const { manifest } = readManifest(stagedRoot, entry.directory);
    const staged = createStagedPackageManifest(manifest, entry.name);
    assert.equal(Object.hasOwn(staged, 'private'), false);
    assert.deepEqual(staged.publishConfig, STAGING_PUBLISH_CONFIG);
    return [entry.name, staged];
  }));
  assert.equal(
    validatePackageManifestCollection(stagedManifests).version,
    '1.2.3-next.1',
  );
});

test('package validator rejects an invalid configured release access before building', () => {
  const result = spawnSync(
    process.execPath,
    [
      path.join(PROJECT_ROOT, 'tools/npm-release/validate-packages.mjs'),
      '--release-access',
      'invalid',
    ],
    { encoding: 'utf8' },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /access must be restricted or public/);
  assert.doesNotMatch(result.stdout, /Building/);
});

test('staging can apply the configured stable release access', () => {
  const entry = PACKAGE_ORDER[0];
  const source = packageManifest(entry, '1.0.0', {
    publishConfig: PRIVATE_RELEASE_PUBLISH_CONFIG,
  });
  const staged = createStagedPackageManifest(source, entry.name, 'public');
  assert.equal(Object.hasOwn(staged, 'private'), false);
  assert.deepEqual(staged.publishConfig, PUBLIC_RELEASE_PUBLISH_CONFIG);
  assert.deepEqual(source.publishConfig, PRIVATE_RELEASE_PUBLISH_CONFIG);
  assert.throws(
    () => createStagedPackageManifest(source, entry.name, 'invalid'),
    /access must be restricted or public/,
  );
});

test('requires a restricted source baseline and accepts private or public staging', () => {
  const root = createFixture('1.0.0');
  assert.equal(validatePackageManifests(root, '1.0.0').version, '1.0.0');

  const publicSource = createFixture('1.0.0');
  const publicManifest = readManifest(publicSource, 'packages/icons');
  publicManifest.manifest.publishConfig = PUBLIC_RELEASE_PUBLISH_CONFIG;
  writeManifest(publicManifest.manifestPath, publicManifest.manifest);
  assert.throws(
    () => validatePackageManifests(publicSource, '1.0.0'),
    /source publishConfig\.access must remain restricted/,
  );

  for (const access of ['restricted', 'public']) {
    const stagedManifests = new Map(PACKAGE_ORDER.map(entry => {
      const { manifest } = readManifest(root, entry.directory);
      return [
        entry.name,
        createStagedPackageManifest(manifest, entry.name, access),
      ];
    }));
    assert.equal(
      validatePackageManifestCollection(stagedManifests, '1.0.0').version,
      '1.0.0',
    );
  }
});

test('labels missing publishConfig and compares package policy independent of key order', () => {
  const missingRoot = createFixture();
  const missing = readManifest(missingRoot, 'packages/icons');
  delete missing.manifest.publishConfig;
  writeManifest(missing.manifestPath, missing.manifest);
  assert.throws(
    () => validatePackageManifests(missingRoot),
    /@wearables-ui-toolkit\/icons publishConfig/,
  );

  const stableRoot = createFixture('1.0.0');
  for (const entry of PACKAGE_ORDER) {
    const { manifest, manifestPath } = readManifest(stableRoot, entry.directory);
    manifest.publishConfig = entry.name.endsWith('/icons')
      ? {
        tag: PRIVATE_RELEASE_PUBLISH_CONFIG.tag,
        registry: PRIVATE_RELEASE_PUBLISH_CONFIG.registry,
        access: PRIVATE_RELEASE_PUBLISH_CONFIG.access,
      }
      : PRIVATE_RELEASE_PUBLISH_CONFIG;
    writeManifest(manifestPath, manifest);
  }
  assert.equal(validatePackageManifests(stableRoot, '1.0.0').version, '1.0.0');

  const mismatched = readManifest(stableRoot, 'packages/mrbd');
  mismatched.manifest.publishConfig = PUBLIC_RELEASE_PUBLISH_CONFIG;
  writeManifest(mismatched.manifestPath, mismatched.manifest);
  assert.throws(
    () => validatePackageManifests(stableRoot, '1.0.0'),
    /@wearables-ui-toolkit\/mrbd source publishConfig\.access/,
  );
});

test('rejects public access, latest, alternate registries, and extra publish fields', () => {
  for (const mutate of [
    manifest => { manifest.publishConfig.access = 'public'; },
    manifest => { manifest.publishConfig.tag = 'latest'; },
    manifest => {
      manifest.publishConfig.registry = 'https://registry.example.com/';
    },
    manifest => { manifest.publishConfig.directory = 'dist'; },
  ]) {
    const root = createFixture();
    const { manifest, manifestPath } = readManifest(root, 'packages/icons');
    mutate(manifest);
    writeManifest(manifestPath, manifest);
    assert.throws(() => validatePackageManifests(root));
  }
});

test('requires every package to use the release-title version', () => {
  const root = createFixture();
  assert.throws(
    () => validatePackageManifests(root, '1.2.3-next.2'),
    /must use version 1\.2\.3-next\.2/,
  );
});

test('requires icon package legal files in the source packlist', () => {
  const complete = {
    files: ['dist', 'LICENSE', 'NOTICE', 'README.md'],
  };
  assert.deepEqual(missingIconPublishedPolicyFiles(complete), []);
  for (const requiredFile of ['LICENSE', 'NOTICE', 'README.md']) {
    assert.deepEqual(
      missingIconPublishedPolicyFiles({
        files: complete.files.filter(file => file !== requiredFile),
      }),
      [requiredFile],
    );
  }
});

test('requires AndroidX policy and attribution files in the source packlist', () => {
  const complete = {
    files: ['dist', 'LICENSE', 'NOTICE', 'README.md', 'UPSTREAM.md'],
  };
  assert.deepEqual(missingAndroidXPublishedPolicyFiles(complete), []);
  for (const requiredFile of ['LICENSE', 'NOTICE', 'README.md', 'UPSTREAM.md']) {
    assert.deepEqual(
      missingAndroidXPublishedPolicyFiles({
        files: complete.files.filter(file => file !== requiredFile),
      }),
      [requiredFile],
    );
  }
});

test('accepts the exact canonical repository and AndroidX legal bytes', () => {
  assert.doesNotThrow(() => validateLicensePolicy(PROJECT_ROOT));
});

test('generates exact next-tag installation guidance', () => {
  const icons = PACKAGE_ORDER.find(
    entry => entry.name === '@wearables-ui-toolkit/icons',
  );
  assert.notEqual(icons, undefined);
  assert.equal(
    generatePackageReadme(icons),
    '# @wearables-ui-toolkit/icons\n\n' +
      'SVG icon assets for UI Toolkit for Meta Ray-Ban Display.\n\n' +
      '## Install\n\n' +
      '```sh\n' +
      'npm install @wearables-ui-toolkit/icons@next\n' +
      '```\n\n' +
      '## Links\n\n' +
      '- [Repository](https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web)\n' +
      '- [Package source](https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web/tree/main/packages/icons)\n' +
      '- [Documentation](https://wearables.developer.meta.com/docs/develop/webapps/design/foundations/utilities/icons/)\n\n' +
      '## License\n\n' +
      'This package is licensed under the [Meta Wearables Developer Terms](https://wearables.developer.meta.com/terms/).\n\n' +
      '- [Package LICENSE](https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web/blob/main/packages/icons/LICENSE)\n' +
      '- [Project NOTICE](https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web/blob/main/NOTICE)\n',
  );
  for (const entry of PACKAGE_ORDER) {
    assert.match(
      generatePackageReadme(entry),
      new RegExp(`npm install ${entry.name.replace('/', '\\/')}@next\\n`),
    );
  }
});

test('generates latest-tag installation guidance for stable releases', () => {
  const icons = PACKAGE_ORDER.find(
    entry => entry.name === '@wearables-ui-toolkit/icons',
  );
  assert.notEqual(icons, undefined);
  assert.match(generatePackageReadme(icons, 'latest'), /npm install .*@latest/);
});

test('reports the packlist comparison operation', () => {
  assert.throws(
    () => assertPacklistUnchanged(
      new Set(['README.md']),
      new Set(['package.json']),
      '@wearables-ui-toolkit/icons',
      'repeated dry-run validation',
    ),
    /icons repeated dry-run validation changed the npm packlist/,
  );
  assert.throws(
    () => assertPacklistUnchanged(
      new Set(['README.md']),
      new Set(['package.json']),
      '@wearables-ui-toolkit/icons',
      'actual pack versus validated dry-run',
    ),
    /icons actual pack versus validated dry-run changed the npm packlist/,
  );
});

test('stages deterministic README and canonical legal files', () => {
  const fixture = createStagingFixture(
    '@wearables-ui-toolkit/foundation',
    ({ sourcePackageRoot }) => {
      writeFileSync(path.join(sourcePackageRoot, 'LICENSE'), 'untrusted license\n');
      writeFileSync(path.join(sourcePackageRoot, 'NOTICE'), 'untrusted notice\n');
      writeFileSync(
        path.join(sourcePackageRoot, 'README.md'),
        '<script>untrusted source README</script>\n',
      );
    },
  );
  const stagedManifest = JSON.parse(
    readFileSync(path.join(fixture.packageRoot, 'package.json'), 'utf8'),
  );
  assert.equal(Object.hasOwn(stagedManifest, 'private'), false);
  assert.deepEqual(stagedManifest.publishConfig, STAGING_PUBLISH_CONFIG);
  assert.equal(
    readFileSync(path.join(fixture.packageRoot, 'LICENSE'), 'utf8'),
    PROJECT_LICENSE,
  );
  assert.equal(
    readFileSync(path.join(fixture.packageRoot, 'NOTICE'), 'utf8'),
    PROJECT_NOTICE,
  );
  assert.equal(
    readFileSync(path.join(fixture.sourcePackageRoot, 'LICENSE'), 'utf8'),
    'untrusted license\n',
  );
  assert.equal(
    readFileSync(path.join(fixture.sourcePackageRoot, 'NOTICE'), 'utf8'),
    'untrusted notice\n',
  );
  assert.equal(
    readFileSync(path.join(fixture.packageRoot, 'README.md'), 'utf8'),
    generatePackageReadme(fixture.entry),
  );
  assert.notEqual(
    readFileSync(path.join(fixture.sourcePackageRoot, 'README.md'), 'utf8'),
    readFileSync(path.join(fixture.packageRoot, 'README.md'), 'utf8'),
  );
  assert.doesNotThrow(() => validateTarballPolicyFiles(
    fixture.packageRoot,
    fixture.entry.name,
    fixture.tarballPolicyFiles,
  ));
  writeFileSync(
    path.join(fixture.packageRoot, 'README.md'),
    'wrong generated README\n',
  );
  assert.throws(
    () => validateTarballPolicyFiles(
      fixture.packageRoot,
      fixture.entry.name,
      fixture.tarballPolicyFiles,
    ),
    /tarball contains an unexpected README\.md/,
  );
});

test('stages the icon package terms', () => {
  const fixture = createStagingFixture('@wearables-ui-toolkit/icons');
  assert.equal(
    readFileSync(path.join(fixture.packageRoot, 'LICENSE'), 'utf8'),
    ICON_LICENSE,
  );
  assert.notEqual(
    readFileSync(path.join(fixture.packageRoot, 'LICENSE'), 'utf8'),
    PROJECT_LICENSE,
  );
  assert.match(
    readFileSync(path.join(fixture.packageRoot, 'README.md'), 'utf8'),
    /This package is licensed under the .*Wearables Developer Terms/s,
  );
});

test('direct workspace npm pack fails before package builds run', () => {
  for (const entry of PACKAGE_ORDER) {
    const options = {
      cwd: path.join(PROJECT_ROOT, entry.directory),
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${path.dirname(process.execPath)}:${process.env.PATH ?? ''}`,
      },
    };
    const result = NPM_BIN.endsWith('.js')
      ? spawnSync(
        process.execPath,
        [NPM_BIN, 'pack', '--dry-run', '--json'],
        options,
      )
      : spawnSync(NPM_BIN, ['pack', '--dry-run', '--json'], options);
    assert.notEqual(result.status, 0, entry.name);
    assert.match(
      `${result.stdout ?? ''}${result.stderr ?? ''}`,
      /Direct workspace npm pack is unsupported/,
    );
  }
});

test('recursively rejects undeclared declaration package references', async () => {
  const packageRoot = mkdtempSync(path.join(tmpdir(), 'wui-declarations-test-'));
  fixtures.push(packageRoot);
  mkdirSync(path.join(packageRoot, 'dist/nested'), { recursive: true });
  writeFileSync(
    path.join(packageRoot, 'package.json'),
    JSON.stringify({
      dependencies: { '@wearables-ui-toolkit/foundation': '1.2.3-next.1' },
      name: '@wearables-ui-toolkit/mrbd',
      peerDependencies: { react: '^19.2.7' },
    }),
  );
  writeFileSync(
    path.join(packageRoot, 'dist/index.d.ts'),
    "export type {ComponentType} from 'react';\n" +
      "export type {ContainerMaterial} from '@wearables-ui-toolkit/foundation/material';\n" +
      "export type {LocalType} from './nested/local.js';\n",
  );
  writeFileSync(
    path.join(packageRoot, 'dist/nested/local.d.ts'),
    'export type LocalType = string;\n',
  );
  await assert.doesNotReject(() => validatePublicDeclarations(packageRoot));
  for (const [extension, declaration] of [
    [
      'd.mts',
      "export type {Icon} from '@wearables-ui-toolkit/icons/private';\n",
    ],
    [
      'd.cts',
      "import Icon = require('@wearables-ui-toolkit/icons/private');\n" +
        'export = Icon;\n',
    ],
  ]) {
    const leak = path.join(packageRoot, `dist/nested/leak.${extension}`);
    writeFileSync(leak, declaration);
    await assert.rejects(
      () => validatePublicDeclarations(packageRoot),
      /non-publishable module reference: @wearables-ui-toolkit\/icons\/private/,
    );
    rmSync(leak);
  }
});

test('runs prepack once with explicit Node under a stripped PATH', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'wui-lifecycle-source-test-'));
  const packageWorkspaceRoot = mkdtempSync(path.join(tmpdir(), 'wui-lifecycle-workspace-test-'));
  const output = mkdtempSync(path.join(tmpdir(), 'wui-lifecycle-pack-test-'));
  fixtures.push(root, packageWorkspaceRoot, output);
  writeFileSync(path.join(root, 'LICENSE'), PROJECT_LICENSE);
  writeFileSync(path.join(root, 'NOTICE'), PROJECT_NOTICE);
  writeFileSync(path.join(root, 'tsconfig.base.json'), '{}\n');
  const baseEntry = PACKAGE_ORDER.find(
    value => value.name === '@wearables-ui-toolkit/icons',
  );
  assert.notEqual(baseEntry, undefined);
  const entry = withPrepackScript(baseEntry);
  const sourcePackageRoot = path.join(root, entry.directory);
  mkdirSync(path.join(sourcePackageRoot, 'dist'), { recursive: true });
  mkdirSync(path.join(sourcePackageRoot, 'scripts'), { recursive: true });
  writeFileSync(path.join(sourcePackageRoot, 'README.md'), 'Lifecycle fixture\n');
  writeFileSync(path.join(sourcePackageRoot, 'LICENSE'), ICON_LICENSE);
  writeFileSync(path.join(sourcePackageRoot, 'dist/removed.txt'), 'remove me\n');
  writeFileSync(
    path.join(sourcePackageRoot, 'scripts/prepack.mjs'),
    "import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';\n" +
      "const countPath = 'prepack-count.txt';\n" +
      "const count = existsSync(countPath) ? Number(readFileSync(countPath, 'utf8')) : 0;\n" +
      "writeFileSync(countPath, String(count + 1));\n" +
      "mkdirSync('dist', {recursive: true});\n" +
      "writeFileSync('dist/generated.txt', 'generated\\n');\n" +
      "rmSync('dist/removed.txt', {force: true});\n",
  );
  const manifest = {
    files: ['dist', 'LICENSE', 'NOTICE', 'README.md'],
    license: entry.license,
    name: entry.name,
    private: true,
    publishConfig: STAGING_PUBLISH_CONFIG,
    scripts: { prepack: packagePrepackCommand(entry) },
    type: 'module',
    version: '1.2.3-next.1',
  };
  writeFileSync(
    path.join(sourcePackageRoot, 'package.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  runPackagePrepack(
    root,
    entry,
    NODE_BIN,
    { ...process.env, PATH: '' },
  );
  assert.equal(
    readFileSync(path.join(sourcePackageRoot, 'prepack-count.txt'), 'utf8'),
    '1',
  );
  assert.equal(existsSync(path.join(sourcePackageRoot, 'dist/generated.txt')), true);
  assert.equal(existsSync(path.join(sourcePackageRoot, 'dist/removed.txt')), false);

  const preparedPackage = createPackageStage(
    root,
    packageWorkspaceRoot,
    entry,
    manifest,
    { npm: NPM_BIN },
  );
  const pack = packStagedPackage(
    NPM_BIN,
    preparedPackage.packageRoot,
    output,
    process.env,
    preparedPackage.packedFiles,
  );
  assert.equal(preparedPackage.packedFiles.has('dist/generated.txt'), true);
  assert.equal(preparedPackage.packedFiles.has('dist/removed.txt'), false);
  assert.deepEqual(
    new Set(pack.files.map(file => file.path)),
    preparedPackage.packedFiles,
  );
  assert.equal(
    readFileSync(path.join(sourcePackageRoot, 'prepack-count.txt'), 'utf8'),
    '1',
  );
});

test('rejects automatic npm hooks outside the trusted prepack command', () => {
  for (const hook of ['preprepack', 'postprepack', 'postinstall']) {
    const root = mkdtempSync(path.join(tmpdir(), `wui-${hook}-test-`));
    fixtures.push(root);
    writeFileSync(path.join(root, 'LICENSE'), PROJECT_LICENSE);
    writeFileSync(path.join(root, 'NOTICE'), PROJECT_NOTICE);
    const baseEntry = PACKAGE_ORDER.find(
      value => value.name === '@wearables-ui-toolkit/icons',
    );
    assert.notEqual(baseEntry, undefined);
    const entry = withPrepackScript(baseEntry);
    const packageRoot = path.join(root, entry.directory);
    mkdirSync(path.join(packageRoot, 'scripts'), { recursive: true });
    writeFileSync(path.join(packageRoot, 'LICENSE'), ICON_LICENSE);
    const prepackCommand = packagePrepackCommand(entry);
    writeFileSync(
      path.join(packageRoot, 'package.json'),
      `${JSON.stringify({
        name: entry.name,
        scripts: {
          [hook]: 'node scripts/forbidden.mjs',
          prepack: prepackCommand,
        },
        version: '1.2.3-next.1',
      })}\n`,
    );
    assert.throws(
      () => runValidatedPackageLifecycles(
        root,
        process.env,
        {
          entries: [entry],
          node: NODE_BIN,
          validateLicense: () => {},
          validateManifests: () => ({ version: '1.2.3-next.1' }),
        },
      ),
      new RegExp(`must not define automatic npm lifecycle script ${hook}`),
    );
  }
});

test('stops before package two after package one mutates shared policy', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'wui-malicious-lifecycle-test-'));
  fixtures.push(root);
  writeFileSync(path.join(root, 'LICENSE'), PROJECT_LICENSE);
  writeFileSync(path.join(root, 'NOTICE'), PROJECT_NOTICE);
  const entries = [
    '@wearables-ui-toolkit/icons',
    '@wearables-ui-toolkit/foundation',
  ].map(packageName => {
    const entry = PACKAGE_ORDER.find(value => value.name === packageName);
    assert.notEqual(entry, undefined);
    return withPrepackScript(entry);
  });
  for (const entry of entries) {
    const packageRoot = path.join(root, entry.directory);
    mkdirSync(path.join(packageRoot, 'scripts'), { recursive: true });
    writeFileSync(
      path.join(packageRoot, 'package.json'),
      `${JSON.stringify({
        files: ['dist', 'LICENSE', 'NOTICE', 'README.md'],
        name: entry.name,
        private: true,
        publishConfig: STAGING_PUBLISH_CONFIG,
        scripts: { prepack: packagePrepackCommand(entry) },
        version: '1.2.3-next.1',
      }, null, 2)}\n`,
    );
  }
  const firstRoot = path.join(root, entries[0].directory);
  const secondRoot = path.join(root, entries[1].directory);
  writeFileSync(path.join(firstRoot, 'LICENSE'), ICON_LICENSE);
  writeFileSync(
    path.join(firstRoot, 'scripts/prepack.mjs'),
    "import {readFileSync, writeFileSync} from 'node:fs';\n" +
      "const path = '../foundation/package.json';\n" +
      "const manifest = JSON.parse(readFileSync(path, 'utf8'));\n" +
      "manifest.scripts.prepack = 'node scripts/compromised.mjs';\n" +
      "manifest.publishConfig.access = 'public';\n" +
      "writeFileSync(path, JSON.stringify(manifest));\n" +
      "writeFileSync('../../LICENSE', 'tampered\\n');\n",
  );
  writeFileSync(
    path.join(secondRoot, 'scripts/prepack.mjs'),
    "import {writeFileSync} from 'node:fs';\n" +
      "writeFileSync('package-two-ran.txt', 'ran\\n');\n",
  );
  const validateManifests = currentRoot => {
    for (const entry of entries) {
      const current = JSON.parse(readFileSync(
        path.join(currentRoot, entry.directory, 'package.json'),
        'utf8',
      ));
      if (current.publishConfig.access !== 'restricted') {
        throw new Error(`${entry.name} publishConfig.access must remain restricted`);
      }
      if (current.scripts.prepack !== packagePrepackCommand(entry)) {
        throw new Error(`${entry.name} prepack script changed`);
      }
    }
    return { version: '1.2.3-next.1' };
  };
  assert.throws(
    () => runValidatedPackageLifecycles(
      root,
      process.env,
      {
        entries,
        node: NODE_BIN,
        validateLicense: () => {},
        validateManifests,
      },
    ),
    /(?:Repository LICENSE|foundation package\.json) changed during npm lifecycle/,
  );
  assert.equal(existsSync(path.join(secondRoot, 'package-two-ran.txt')), false);
});

test('stops before package two after package one mutates AndroidX legal files', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'wui-androidx-mutation-test-'));
  fixtures.push(root);
  writeFileSync(path.join(root, 'LICENSE'), PROJECT_LICENSE);
  writeFileSync(path.join(root, 'NOTICE'), PROJECT_NOTICE);
  const entries = [
    '@wearables-ui-toolkit/icons',
    '@wearables-ui-toolkit/androidx-shapes',
  ].map(packageName => {
    const entry = PACKAGE_ORDER.find(value => value.name === packageName);
    assert.notEqual(entry, undefined);
    return withPrepackScript(entry);
  });
  for (const entry of entries) {
    const packageRoot = path.join(root, entry.directory);
    mkdirSync(path.join(packageRoot, 'scripts'), { recursive: true });
    writeFileSync(
      path.join(packageRoot, 'package.json'),
      `${JSON.stringify({
        name: entry.name,
        private: true,
        scripts: { prepack: packagePrepackCommand(entry) },
        version: '1.2.3-next.1',
      })}\n`,
    );
  }
  const firstRoot = path.join(root, entries[0].directory);
  const secondRoot = path.join(root, entries[1].directory);
  writeFileSync(path.join(firstRoot, 'LICENSE'), ICON_LICENSE);
  writeFileSync(path.join(secondRoot, 'LICENSE'), ANDROIDX_LICENSE);
  writeFileSync(path.join(secondRoot, 'NOTICE'), ANDROIDX_NOTICE);
  writeFileSync(path.join(secondRoot, 'UPSTREAM.md'), 'upstream\n');
  writeFileSync(
    path.join(firstRoot, 'scripts/prepack.mjs'),
    "import {writeFileSync} from 'node:fs';\n" +
      "writeFileSync('../androidx-shapes/LICENSE', 'tampered license\\n');\n" +
      "writeFileSync('../androidx-shapes/NOTICE', 'tampered notice\\n');\n" +
      "writeFileSync('../androidx-shapes/UPSTREAM.md', 'tampered upstream\\n');\n",
  );
  writeFileSync(
    path.join(secondRoot, 'scripts/prepack.mjs'),
    "import {writeFileSync} from 'node:fs';\n" +
      "writeFileSync('package-two-ran.txt', 'ran\\n');\n",
  );
  assert.throws(
    () => runValidatedPackageLifecycles(
      root,
      process.env,
      {
        entries,
        node: NODE_BIN,
        validateLicense: () => {},
        validateManifests: () => ({ version: '1.2.3-next.1' }),
      },
    ),
    /androidx-shapes.*(?:LICENSE|NOTICE|UPSTREAM\.md) changed during npm lifecycle/,
  );
  assert.equal(existsSync(path.join(secondRoot, 'package-two-ran.txt')), false);
});

test('uses the npm dry-run packlist and ignores source README content', () => {
  const fixture = createStagingFixture(
    '@wearables-ui-toolkit/mrbd',
    ({ sourcePackageRoot }) => {
      const hiddenFile = path.join(sourcePackageRoot, 'dist/hidden.txt');
      mkdirSync(path.dirname(hiddenFile), { recursive: true });
      writeFileSync(hiddenFile, 'hidden\n');
      writeFileSync(path.join(sourcePackageRoot, 'dist/.npmignore'), 'hidden.txt\n');
      writeFileSync(
        path.join(sourcePackageRoot, 'README.md'),
        '<script>source README must never ship</script>\n',
      );
    },
  );
  assert.equal(fixture.packedFiles.has('dist/hidden.txt'), false);
  assert.equal(fixture.packedFiles.has('README.md'), true);
  assert.equal(
    readFileSync(path.join(fixture.packageRoot, 'README.md'), 'utf8'),
    generatePackageReadme(fixture.entry),
  );
});

test('stages deterministic READMEs for every public package', () => {
  const packageWorkspaceRoot = mkdtempSync(path.join(tmpdir(), 'wui-actual-readmes-test-'));
  fixtures.push(packageWorkspaceRoot);
  for (const entry of PACKAGE_ORDER) {
    const { manifest } = readManifest(PROJECT_ROOT, entry.directory);
    const preparedPackage = createPackageStage(
      PROJECT_ROOT,
      packageWorkspaceRoot,
      entry,
      manifest,
      { npm: NPM_BIN },
    );
    const stagedReadme = readFileSync(
      path.join(preparedPackage.packageRoot, 'README.md'),
      'utf8',
    );
    assert.equal(
      stagedReadme,
      generatePackageReadme(entry, manifest.publishConfig.tag),
    );
    assert.equal(preparedPackage.packedFiles.has('README.md'), true);
    assert.doesNotThrow(() => validateTarballPolicyFiles(
      preparedPackage.packageRoot,
      entry.name,
      preparedPackage.tarballPolicyFiles,
    ));
  }
});

test('stages AndroidX attribution with the project notice appended', () => {
  const fixture = createStagingFixture(
    '@wearables-ui-toolkit/androidx-shapes',
  );
  const expectedNotice =
    'canonical AndroidX attribution\n\n' +
    'canonical project notice with font and icon carve-outs\n';
  assert.equal(
    readFileSync(path.join(fixture.packageRoot, 'LICENSE'), 'utf8'),
    ANDROIDX_LICENSE,
  );
  assert.equal(
    readFileSync(path.join(fixture.packageRoot, 'NOTICE'), 'utf8'),
    expectedNotice,
  );
  assert.equal(
    readFileSync(path.join(fixture.sourcePackageRoot, 'NOTICE'), 'utf8'),
    ANDROIDX_NOTICE,
  );
  assert.equal(
    readFileSync(path.join(fixture.packageRoot, 'UPSTREAM.md'), 'utf8'),
    'upstream\n',
  );
  assert.doesNotThrow(() => validateTarballPolicyFiles(
    fixture.packageRoot,
    fixture.entry.name,
    fixture.tarballPolicyFiles,
  ));
  writeFileSync(path.join(fixture.packageRoot, 'UPSTREAM.md'), 'wrong\n');
  assert.throws(
    () => validateTarballPolicyFiles(
      fixture.packageRoot,
      fixture.entry.name,
      fixture.tarballPolicyFiles,
    ),
    /tarball contains an unexpected UPSTREAM\.md/,
  );
});

test('rejects missing or incorrect staged tarball NOTICE content', () => {
  const missingNotice = createStagingFixture('@wearables-ui-toolkit/icons');
  rmSync(path.join(missingNotice.packageRoot, 'NOTICE'));
  assert.throws(
    () => validateTarballPolicyFiles(
      missingNotice.packageRoot,
      missingNotice.entry.name,
      missingNotice.tarballPolicyFiles,
    ),
    /tarball is missing NOTICE/,
  );

  const incorrectNotice = createStagingFixture('@wearables-ui-toolkit/mrbd');
  writeFileSync(path.join(incorrectNotice.packageRoot, 'NOTICE'), 'wrong\n');
  assert.throws(
    () => validateTarballPolicyFiles(
      incorrectNotice.packageRoot,
      incorrectNotice.entry.name,
      incorrectNotice.tarballPolicyFiles,
    ),
    /tarball contains an unexpected NOTICE/,
  );
});

test('packs and scans canonical legal bytes from a staged package', () => {
  const fixture = createStagingFixture(
    '@wearables-ui-toolkit/foundation',
    ({ sourcePackageRoot }) => {
      mkdirSync(path.join(sourcePackageRoot, 'dist'), { recursive: true });
      writeFileSync(path.join(sourcePackageRoot, 'dist/index.js'), 'export {};\n');
      writeFileSync(path.join(sourcePackageRoot, 'dist/index.d.ts'), 'export {};\n');
      writeFileSync(
        path.join(sourcePackageRoot, 'package.json'),
        `${JSON.stringify({
          files: ['dist', 'LICENSE', 'NOTICE', 'README.md'],
          name: '@wearables-ui-toolkit/foundation',
          private: true,
          publishConfig: STAGING_PUBLISH_CONFIG,
          type: 'module',
          version: '1.2.3-next.1',
        }, null, 2)}\n`,
      );
    },
  );
  const output = mkdtempSync(path.join(tmpdir(), 'wui-staged-pack-test-'));
  fixtures.push(output);
  const pack = parsePackOutput(runNpmChecked(
    ['pack', '--ignore-scripts', '--json', '--pack-destination', output],
    { cwd: fixture.packageRoot },
  ));
  assert.equal(existsSync(path.join(fixture.sourcePackageRoot, 'LICENSE')), false);
  assert.equal(pack.files.some(file => file.path === 'LICENSE'), true);
  assert.equal(pack.files.some(file => file.path === 'NOTICE'), true);
  const manifest = scanTarball(
    pack,
    path.join(output, pack.filename),
    fixture.entry.name,
    fixture.tarballPolicyFiles,
    fixture.manifestBytes,
  );
  assert.equal(manifest.name, fixture.entry.name);
});

test('rejects a postinstall injected after staging', () => {
  const fixture = createStagingFixture('@wearables-ui-toolkit/icons');
  const stagedManifestPath = path.join(fixture.packageRoot, 'package.json');
  const injected = JSON.parse(readFileSync(stagedManifestPath, 'utf8'));
  injected.scripts = { postinstall: 'node compromised.mjs' };
  writeFileSync(stagedManifestPath, `${JSON.stringify(injected, null, 2)}\n`);
  const output = mkdtempSync(path.join(tmpdir(), 'wui-postinstall-pack-test-'));
  fixtures.push(output);
  const pack = packStagedPackage(
    NPM_BIN,
    fixture.packageRoot,
    output,
    process.env,
    fixture.packedFiles,
  );
  assert.throws(
    () => scanTarball(
      pack,
      path.join(output, pack.filename),
      fixture.entry.name,
      fixture.tarballPolicyFiles,
      fixture.manifestBytes,
    ),
    /packed package\.json bytes differ from the staged manifest/,
  );
});

test('excludes real and symlinked node_modules while rejecting other source symlinks', () => {
  const nested = createStagingFixture(
    '@wearables-ui-toolkit/icons',
    ({ sourcePackageRoot }) => {
      const nestedModules = path.join(sourcePackageRoot, 'nested/node_modules');
      mkdirSync(nestedModules, { recursive: true });
      writeFileSync(path.join(nestedModules, 'private.js'), 'private\n');
    },
  );
  assert.equal(
    existsSync(path.join(nested.packageRoot, 'nested/node_modules')),
    false,
  );

  const symlinkedDependencies = createStagingFixture(
    '@wearables-ui-toolkit/icons',
    ({ root, sourcePackageRoot }) => {
      const dependencies = path.join(root, 'dependencies');
      mkdirSync(dependencies);
      symlinkSync(dependencies, path.join(sourcePackageRoot, 'node_modules'));
    },
  );
  assert.equal(
    existsSync(path.join(symlinkedDependencies.packageRoot, 'node_modules')),
    false,
  );

  assert.throws(
    () => createStagingFixture(
      '@wearables-ui-toolkit/mrbd',
      ({ root, sourcePackageRoot }) => {
        const outside = path.join(root, 'outside.js');
        writeFileSync(outside, 'outside\n');
        symlinkSync(outside, path.join(sourcePackageRoot, 'escape.js'));
      },
    ),
    /staging source contains a symbolic link/,
  );
});

test('rejects a symbolic link in any extracted tarball entry', () => {
  const source = mkdtempSync(path.join(tmpdir(), 'wui-symlink-tar-source-'));
  const output = mkdtempSync(path.join(tmpdir(), 'wui-symlink-tar-output-'));
  fixtures.push(source, output);
  const packageRoot = path.join(source, 'package');
  mkdirSync(packageRoot);
  writeFileSync(path.join(packageRoot, 'LICENSE'), PROJECT_LICENSE);
  writeFileSync(path.join(packageRoot, 'NOTICE'), PROJECT_NOTICE);
  writeFileSync(path.join(packageRoot, 'package.json'), '{}\n');
  const outside = path.join(source, 'outside.bin');
  writeFileSync(outside, 'outside\n');
  symlinkSync('../outside.bin', path.join(packageRoot, 'linked.bin'));
  const tarball = path.join(output, 'malicious.tgz');
  runChecked(TAR_BIN, ['-czf', tarball, '-C', source, 'package']);
  assert.throws(
    () => scanTarball(
      {
        files: [
          { path: 'LICENSE' },
          { path: 'NOTICE' },
          { path: 'package.json' },
          { path: 'linked.bin' },
        ],
      },
      tarball,
      '@wearables-ui-toolkit/foundation',
      {
        LICENSE: Buffer.from(PROJECT_LICENSE),
        NOTICE: Buffer.from(PROJECT_NOTICE),
      },
    ),
    /tarball entry must be a regular file/,
  );
});

test('isolates npm registry configuration from malicious parent settings', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'wui-npm-config-test-'));
  fixtures.push(root);
  const maliciousUserConfig = path.join(root, 'malicious.npmrc');
  const emptyUserConfig = path.join(root, 'empty.npmrc');
  writeFileSync(
    maliciousUserConfig,
    'registry=https://registry.example.invalid/\n' +
      '@wearables-ui-toolkit:registry=https://scope.example.invalid/\n' +
      '//registry.example.invalid/:_authToken=secret\n',
  );
  writeFileSync(emptyUserConfig, '');
  const registryUrl = 'http://127.0.0.1:4873/';
  const environment = isolatedNpmEnvironment(
    {
      ...process.env,
      NODE_AUTH_TOKEN: 'secret',
      NPM_CONFIG_REGISTRY: 'https://registry.example.invalid/',
      NPM_CONFIG_USERCONFIG: maliciousUserConfig,
      'npm_config_@wearables-ui-toolkit:registry':
        'https://scope.example.invalid/',
      npm_config_auth: 'secret',
    },
    emptyUserConfig,
    registryUrl,
  );
  assert.equal(environment.NODE_AUTH_TOKEN, undefined);
  assert.equal(environment.npm_config_auth, undefined);
  assert.equal(environment.NPM_CONFIG_USERCONFIG, emptyUserConfig);
  assert.equal(environment.NPM_CONFIG_REGISTRY, registryUrl);
  assert.equal(
    environment['npm_config_@wearables-ui-toolkit:registry'],
    registryUrl,
  );
  assert.doesNotThrow(() => verifyNpmRegistryIsolation(
    NPM_BIN,
    root,
    emptyUserConfig,
    registryUrl,
    environment,
  ));
});

test('local registry advertises each package staged dist-tag', () => {
  for (const [version, publishConfig] of [
    ['1.2.3-next.1', STAGING_PUBLISH_CONFIG],
    ['1.2.3', PRIVATE_RELEASE_PUBLISH_CONFIG],
  ]) {
    let body = null;
    const response = {
      statusCode: 200,
      end: value => { body = value; },
      setHeader: () => {},
    };
    const packageName = '@wearables-ui-toolkit/foundation';
    const handler = createLocalRegistryRequestHandler(
      {
        packages: [{
          filename: 'package.tgz',
          integrity: 'sha512-example',
          manifest: { name: packageName, publishConfig, version },
          name: packageName,
          shasum: 'example',
          version,
        }],
      },
      () => 'http://127.0.0.1:43123/',
    );
    handler({ url: `/${encodeURIComponent(packageName)}` }, response);
    assert.deepEqual(
      JSON.parse(body)['dist-tags'],
      { [publishConfig.tag]: version },
    );
  }
});

test('returns structured HTTP 500 JSON when a registry tarball read fails', () => {
  const headers = new Map();
  let body = null;
  const response = {
    statusCode: 200,
    end: value => { body = value; },
    setHeader: (name, value) => headers.set(name, value),
  };
  const handler = createLocalRegistryRequestHandler(
    {
      packages: [{
        filename: 'package.tgz',
        name: '@wearables-ui-toolkit/foundation',
        tarball: '/missing/package.tgz',
      }],
    },
    () => 'http://127.0.0.1:43123/',
    { readFile: () => { throw new Error('tarball disappeared'); } },
  );
  assert.doesNotThrow(() => handler(
    { url: '/%40wearables-ui-toolkit%2Ffoundation/-/package.tgz' },
    response,
  ));
  assert.equal(response.statusCode, 500);
  assert.equal(headers.get('content-type'), 'application/json');
  assert.deepEqual(JSON.parse(body), { error: 'Error: tarball disappeared' });
});

test('returns structured HTTP 500 JSON when registry metadata fails', () => {
  const headers = new Map();
  let body = null;
  const response = {
    statusCode: 200,
    end: value => { body = value; },
    setHeader: (name, value) => headers.set(name, value),
  };
  const handler = createLocalRegistryRequestHandler(
    {
      packages: [{
        filename: 'package.tgz',
        manifest: {},
        name: '@wearables-ui-toolkit/foundation',
        version: '1.2.3-next.1',
      }],
    },
    () => { throw new Error('registry address unavailable'); },
  );
  assert.doesNotThrow(() => handler(
    { url: '/%40wearables-ui-toolkit%2Ffoundation' },
    response,
  ));
  assert.equal(response.statusCode, 500);
  assert.equal(headers.get('content-type'), 'application/json');
  assert.deepEqual(
    JSON.parse(body),
    { error: 'Error: registry address unavailable' },
  );
});

test('parses one npm pack payload and terminates on invalid arrays', () => {
  assert.deepEqual(
    parsePackOutput('lifecycle output\n[{"filename":"package.tgz"}]'),
    { filename: 'package.tgz' },
  );
  assert.throws(
    () => parsePackOutput('[{"filename":"first.tgz"},{"filename":"second.tgz"}]'),
    /did not return a JSON payload/,
  );
});

test('accepts only complete non-zero registry ports', () => {
  assert.equal(parseRegistryPort('43123'), 43123);
  for (const value of ['', '0', '43x', '65536', ' 43123']) {
    assert.equal(parseRegistryPort(value), null);
  }
});

test('detects registry child exit after one async polling interval', async () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'wui-registry-exit-test-'));
  fixtures.push(fixture);
  const serverProcess = new EventEmitter();
  serverProcess.exitCode = null;
  serverProcess.signalCode = null;
  let waitCount = 0;
  await assert.rejects(
    waitForPortFile(path.join(fixture, 'port.txt'), serverProcess, {
      delayFn: () => new Promise(resolve => {
        setImmediate(() => {
          waitCount += 1;
          serverProcess.exitCode = 17;
          serverProcess.emit('exit', 17, null);
          resolve();
        });
      }),
    }),
    /Local package registry exited with status 17/,
  );
  assert.equal(waitCount, 1);
});

test('detects registry signal exit after one async polling interval', async () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'wui-registry-signal-test-'));
  fixtures.push(fixture);
  const serverProcess = new EventEmitter();
  serverProcess.exitCode = null;
  serverProcess.signalCode = null;
  await assert.rejects(
    waitForPortFile(path.join(fixture, 'port.txt'), serverProcess, {
      delayFn: () => new Promise(resolve => {
        setImmediate(() => {
          serverProcess.signalCode = 'SIGABRT';
          serverProcess.emit('exit', null, 'SIGABRT');
          resolve();
        });
      }),
    }),
    /Local package registry terminated with signal SIGABRT/,
  );
});

test('rejects a ready port when the registry is already dead', async () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'wui-registry-stale-test-'));
  fixtures.push(fixture);
  const portFile = path.join(fixture, 'port.txt');
  writeFileSync(portFile, '43123');
  const serverProcess = new EventEmitter();
  serverProcess.exitCode = 23;
  serverProcess.signalCode = null;
  await assert.rejects(
    waitForPortFile(portFile, serverProcess),
    /Local package registry exited with status 23/,
  );
});

test('rejects a child exit that races a newly ready port', async () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'wui-registry-ready-race-test-'));
  fixtures.push(fixture);
  const portFile = path.join(fixture, 'port.txt');
  writeFileSync(portFile, '43123');
  const serverProcess = new EventEmitter();
  serverProcess.exitCode = null;
  serverProcess.signalCode = null;
  await assert.rejects(
    waitForPortFile(portFile, serverProcess, {
      delayFn: () => new Promise(resolve => {
        setImmediate(() => {
          serverProcess.exitCode = 29;
          serverProcess.emit('exit', 29, null);
          resolve();
        });
      }),
    }),
    /Local package registry exited with status 29/,
  );
});

test('rejects a child error while waiting for registry readiness', async () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'wui-registry-error-test-'));
  fixtures.push(fixture);
  const serverProcess = new EventEmitter();
  serverProcess.exitCode = null;
  serverProcess.signalCode = null;
  await assert.rejects(
    waitForPortFile(path.join(fixture, 'port.txt'), serverProcess, {
      delayFn: () => new Promise(resolve => {
        setImmediate(() => {
          serverProcess.emit('error', new Error('spawn failed'));
          resolve();
        });
      }),
    }),
    error =>
      error.message === 'Local package registry failed to start.' &&
      error.cause?.message === 'spawn failed',
  );
});

test('waits for registry shutdown when async port handoff fails', async () => {
  const signals = [];
  let shutdownComplete = false;
  const serverProcess = new EventEmitter();
  serverProcess.exitCode = null;
  serverProcess.signalCode = null;
  serverProcess.kill = signal => {
    signals.push(signal);
    setImmediate(() => {
      shutdownComplete = true;
      serverProcess.signalCode = signal;
      serverProcess.emit('exit', null, signal);
    });
    return true;
  };
  await assert.rejects(
    startLocalRegistry('config.json', 'port.txt', {
      spawnImpl: () => serverProcess,
      waitForPortFileFn: async () => {
        throw new Error('port handoff failed');
      },
    }),
    /port handoff failed/,
  );
  assert.deepEqual(signals, ['SIGTERM']);
  assert.equal(shutdownComplete, true);
});

test('requires the explicit staging enable gate', () => {
  assert.equal(assertReleaseEnabled('true'), 'true');
  for (const value of [undefined, '', 'false', 'TRUE', '1']) {
    assert.throws(
      () => assertReleaseEnabled(value),
      /WUI_NPM_RELEASE_ENABLED=true/,
    );
  }
});

test('prevalidates exact artifact order, containment, regular files, SRI, and embedded policy', () => {
  const valid = createArtifactFixture();
  assert.equal(
    prevalidateReleaseArtifacts(valid.manifestPath, valid.version).length,
    4,
  );

  const reordered = createArtifactFixture();
  updateReleaseManifest(reordered, release => {
    [release.packages[0], release.packages[1]] = [
      release.packages[1],
      release.packages[0],
    ];
  });
  assert.throws(
    () => prevalidateReleaseArtifacts(reordered.manifestPath, reordered.version),
    /package 1 must be/,
  );

  const traversal = createArtifactFixture();
  updateReleaseManifest(traversal, release => {
    release.packages[0].filename = '../outside.tgz';
  });
  assert.throws(
    () => prevalidateReleaseArtifacts(traversal.manifestPath, traversal.version),
    /Invalid tarball filename/,
  );

  const badIntegrity = createArtifactFixture();
  updateReleaseManifest(badIntegrity, release => {
    release.packages[2].integrity = 'sha512-not-the-artifact';
  });
  assert.throws(
    () => prevalidateReleaseArtifacts(badIntegrity.manifestPath, badIntegrity.version),
    /integrity mismatch/,
  );

  const linked = createArtifactFixture();
  const linkedTarball = path.join(linked.root, linked.packages[1].filename);
  rmSync(linkedTarball);
  symlinkSync(path.join(linked.root, linked.packages[0].filename), linkedTarball);
  updateReleaseManifest(linked, release => {
    release.packages[1].integrity = sriForFile(linkedTarball);
  });
  assert.throws(
    () => prevalidateReleaseArtifacts(linked.manifestPath, linked.version),
    /may not be a symlink/,
  );

  assert.throws(
    () => createArtifactFixture({
      releaseAccess: 'public',
      version: '1.2.3-next.1',
    }),
    /Prerelease packages must remain restricted/,
  );
  assert.throws(
    () => validateTarEntryNames([
      'package/package.json',
      'package//package.json',
    ], 'alias.tgz'),
    /noncanonical or unsafe path/,
  );
  for (const unsafe of [
    '/package/package.json',
    'package/./package.json',
    'package/sub/../package.json',
    'package/package.json/',
    'package\\package.json',
    'package/C:/package.json',
  ]) {
    assert.throws(
      () => validateTarEntryNames([unsafe], 'unsafe.tgz'),
      /noncanonical or unsafe path/,
    );
  }
});

test('a concrete duplicate archive member causes zero publishes', async () => {
  const fixture = createArtifactFixture();
  replaceTarballWithDuplicateManifest(fixture, 3);
  const npmLog = [];
  await assert.rejects(
    publishRelease({
      fetchImpl: privateFetch(),
      manifestPath: fixture.manifestPath,
      runNpmFn: fakeNpm(npmLog),
      releaseEnabled: 'true',
      version: fixture.version,
    }),
    /duplicate canonical path/,
  );
  assert.equal(npmLog.filter(args => args[0] === 'publish').length, 0);
});

test('a malformed later artifact causes zero publishes', async () => {
  const fixture = createArtifactFixture();
  writeFileSync(
    path.join(fixture.root, fixture.packages[3].filename),
    'tampered',
    { flag: 'a' },
  );
  const npmLog = [];
  await assert.rejects(
    publishRelease({
      fetchImpl: privateFetch(),
      manifestPath: fixture.manifestPath,
      runNpmFn: fakeNpm(npmLog),
      releaseEnabled: 'true',
      version: fixture.version,
    }),
    /integrity mismatch/,
  );
  assert.equal(npmLog.filter(args => args[0] === 'publish').length, 0);
});

test('public visibility probes are unauthenticated and public exposure blocks all publishes', async () => {
  const fixture = createArtifactFixture();
  const npmLog = [];
  const requests = [];
  await withServer((request, response) => {
    requests.push(request.headers);
    response.statusCode = requests.length === 2 ? 200 : 404;
    response.end('{}');
  }, async registryUrl => {
    await assert.rejects(
      publishRelease({
        fetchImpl: globalThis.fetch,
        manifestPath: fixture.manifestPath,
        registryUrl,
        runNpmFn: fakeNpm(npmLog),
        releaseEnabled: 'true',
        version: fixture.version,
      }),
      /publicly readable/,
    );
  });
  assert.equal(requests.length, 4);
  assert.ok(requests.every(headers => headers.authorization == null));
  assert.equal(npmLog.filter(args => args[0] === 'publish').length, 0);
});

test('network and ambiguous visibility results fail closed', async () => {
  await assert.rejects(
    assertPackageNotPublic('@wearables-ui-toolkit/icons', {
      fetchImpl: async () => { throw new Error('network down'); },
    }),
    /Unable to determine/,
  );
  await assert.rejects(
    assertPackageNotPublic('@wearables-ui-toolkit/icons', {
      fetchImpl: async () => new Response('', { status: 503 }),
    }),
    /Ambiguous.*HTTP 503/,
  );
});

test('bootstrap integrity parsing fails closed with clear errors', () => {
  assert.equal(parseIntegrity('"sha512-example"'), 'sha512-example');
  for (const output of ['', 'not json', 'null', '{}', '""']) {
    assert.throws(() => parseIntegrity(output), /dist\.integrity.*refusing/);
  }
});

test('OIDC and bootstrap paths publish only after full preflight and never run lifecycle scripts', async () => {
  for (const bootstrapTokenEnabled of [false, true]) {
    const fixture = createArtifactFixture();
    const npmLog = [];
    const visibilityLog = [];
    await publishRelease({
      bootstrapTokenEnabled,
      fetchImpl: privateFetch(visibilityLog),
      manifestPath: fixture.manifestPath,
      runNpmFn: fakeNpm(npmLog),
      releaseEnabled: 'true',
      version: fixture.version,
    });
    assert.equal(visibilityLog.length, 8);
    assert.ok(
      visibilityLog.every(
        request => request.options.headers.authorization == null,
      ),
    );
    const viewCalls = npmLog
      .map((args, index) => ({ args, index }))
      .filter(call => call.args[0] === 'view');
    assert.equal(viewCalls.length, bootstrapTokenEnabled ? 4 : 0);
    const firstPublishIndex = npmLog.findIndex(args => args[0] === 'publish');
    if (bootstrapTokenEnabled) {
      assert.ok(firstPublishIndex > 0);
      assert.deepEqual(
        viewCalls.map(call => call.args[1]),
        PACKAGE_ORDER.map(entry => `${entry.name}@${fixture.version}`),
      );
      assert.ok(viewCalls.every(call => call.index < firstPublishIndex));
    }
    const publishCalls = npmLog.filter(args => args[0] === 'publish');
    assert.equal(publishCalls.length, 4);
    for (const call of publishCalls) {
      assert.ok(call.includes('--access=restricted'));
      assert.ok(call.includes('--tag=latest'));
      assert.ok(!call.includes('--provenance'));
      assert.ok(call.includes('--ignore-scripts'));
    }
  }
});

test('publisher access environment defaults empty values to restricted', () => {
  assert.equal(releaseAccessFromEnvironment(undefined), 'restricted');
  assert.equal(releaseAccessFromEnvironment(''), 'restricted');
  assert.equal(releaseAccessFromEnvironment('restricted'), 'restricted');
  assert.equal(releaseAccessFromEnvironment('public'), 'public');
  assert.throws(
    () => releaseAccessFromEnvironment('invalid'),
    /access must be restricted or public/,
  );
});

test('credentialed publisher rejects prereleases before any npm request', async () => {
  const fixture = createArtifactFixture({ version: '1.2.3-next.1' });
  const npmLog = [];
  await assert.rejects(
    publishRelease({
      expectedAccess: 'restricted',
      fetchImpl: privateFetch(),
      manifestPath: fixture.manifestPath,
      runNpmFn: fakeNpm(npmLog),
      releaseEnabled: 'true',
      version: fixture.version,
    }),
    /Production npm releases require a stable version/,
  );
  assert.equal(npmLog.length, 0);
});

test('publisher rejects artifacts that disagree with configured stable access', async () => {
  const packageOverrides = new Map(
    PACKAGE_ORDER.map((_, index) => [index, {
      publishConfig: PRIVATE_RELEASE_PUBLISH_CONFIG,
    }]),
  );
  const fixture = createArtifactFixture({ packageOverrides, version: '1.0.0' });
  const npmLog = [];
  await assert.rejects(
    publishRelease({
      expectedAccess: 'public',
      fetchImpl: privateFetch(),
      manifestPath: fixture.manifestPath,
      runNpmFn: fakeNpm(npmLog),
      releaseEnabled: 'true',
      version: fixture.version,
    }),
    /does not match WUI_NPM_STABLE_RELEASE_ACCESS=public/,
  );
  assert.equal(npmLog.length, 0);
});

test('stable private publishing uses restricted access and latest', async () => {
  const packageOverrides = new Map(
    PACKAGE_ORDER.map((_, index) => [index, {
      publishConfig: PRIVATE_RELEASE_PUBLISH_CONFIG,
    }]),
  );
  const fixture = createArtifactFixture({ packageOverrides, version: '1.0.0' });
  const npmLog = [];
  await publishRelease({
    expectedAccess: 'restricted',
    fetchImpl: privateFetch(),
    manifestPath: fixture.manifestPath,
    runNpmFn: fakeNpm(npmLog),
    releaseEnabled: 'true',
    version: fixture.version,
  });
  const publishCalls = npmLog.filter(args => args[0] === 'publish');
  assert.equal(publishCalls.length, PACKAGE_ORDER.length);
  assert.ok(publishCalls.every(call => call.includes('--access=restricted')));
  assert.ok(publishCalls.every(call => call.includes('--tag=latest')));
});

test('stable public publishing uses latest and requires public visibility', async () => {
  const fixture = createArtifactFixture({
    releaseAccess: 'public',
    version: '1.0.0',
  });
  const npmLog = [];
  await publishRelease({
    expectedAccess: 'public',
    fetchImpl: async () => new Response('', { status: 200 }),
    manifestPath: fixture.manifestPath,
    runNpmFn: fakeNpm(npmLog),
    releaseEnabled: 'true',
    version: fixture.version,
  });
  const publishCalls = npmLog.filter(args => args[0] === 'publish');
  assert.equal(publishCalls.length, PACKAGE_ORDER.length);
  assert.ok(publishCalls.every(call => call.includes('--access=public')));
  assert.ok(publishCalls.every(call => call.includes('--tag=latest')));
});

test('release workflow isolates credentials from build and lifecycle execution', () => {
  const repositoryRoot = path.resolve(import.meta.dirname, '../..');
  const sourceWorkflow = path.resolve(
    repositoryRoot,
    'oss/.github/workflows/npm-release.yml',
  );
  const publicWorkflow = path.resolve(
    repositoryRoot,
    '.github/workflows/npm-release.yml',
  );
  const workflowPath = existsSync(sourceWorkflow)
    ? sourceWorkflow
    : publicWorkflow;
  const workflow = readFileSync(workflowPath, 'utf8');
  const buildStart = workflow.indexOf('  build-release-artifacts:');
  const publishStart = workflow.indexOf('  publish-release:');
  assert.ok(buildStart > 0 && publishStart > buildStart);
  const prePublish = workflow.slice(0, publishStart);
  const buildJob = workflow.slice(buildStart, publishStart);
  const canaryBuildStart = workflow.indexOf('  build-publishing-canary:');
  assert.ok(canaryBuildStart > publishStart);
  const publishJob = workflow.slice(publishStart, canaryBuildStart);
  const canaryJobs = workflow.slice(canaryBuildStart);

  assert.deepEqual(
    [...publishJob.matchAll(/^    environment:\s*(.+)$/gm)].map(
      match => match[1],
    ),
    ['npm-publish'],
  );
  const permissions = /^    permissions:\n((?:      [^\n]+\n)+)    steps:/m.exec(
    publishJob,
  );
  assert.equal(
    permissions?.[1],
    '      actions: read\n      id-token: write\n',
  );
  assert.equal((workflow.match(/id-token: write/g) ?? []).length, 2);
  assert.match(workflow, /^          - release$/m);
  assert.match(
    workflow,
    /github\.event_name == 'push' \|\| inputs\.operation == 'release'/,
  );
  assert.match(workflow, /Manual npm releases must run from the main branch/);
  assert.match(workflow, /Manual npm releases require a release_version input/);
  assert.match(
    workflow,
    /Manual npm releases require confirmation PUBLISH_RELEASE/,
  );
  assert.match(workflow, /GITHUB_COMMIT_TITLE="\$\(git log -1 --pretty=%B\)"/);
  assert.match(
    workflow,
    /GITHUB_COMMIT_TITLE="Release version \$RELEASE_VERSION"/,
  );
  assert.doesNotMatch(workflow, /head_commit\.message/);
  const releaseAccessEnvironment =
    /WUI_NPM_STABLE_RELEASE_ACCESS: \$\{\{ vars\.WUI_NPM_STABLE_RELEASE_ACCESS \|\| 'restricted' \}\}/;
  assert.match(buildJob, releaseAccessEnvironment);
  assert.match(buildJob, /--release-access "\$WUI_NPM_STABLE_RELEASE_ACCESS"/);
  const trustedPublishStep = publishJob.slice(
    publishJob.indexOf('      - name: Publish with Trusted Publishing'),
    publishJob.indexOf('      - name: Publish with temporary bootstrap token'),
  );
  const bootstrapPublishStep = publishJob.slice(
    publishJob.indexOf('      - name: Publish with temporary bootstrap token'),
  );
  assert.match(trustedPublishStep, releaseAccessEnvironment);
  assert.match(bootstrapPublishStep, releaseAccessEnvironment);
  assert.doesNotMatch(prePublish, /id-token: write|secrets\.NPM_TOKEN/);
  assert.doesNotMatch(
    publishJob,
    /actions\/checkout|\byarn\b|npm install|npm pack|prepack|prepare/,
  );
  assert.deepEqual(
    [...publishJob.matchAll(/^      - name: (.+)$/gm)].map(match => match[1]),
    [
      'Download immutable publisher',
      'Download validated package artifacts',
      'Verify downloaded publisher files',
      'Set up trusted-publishing runtime',
      'Publish with Trusted Publishing',
      'Publish with temporary bootstrap token',
    ],
  );
  assert.match(publishJob, /actions\/download-artifact@[0-9a-f]{40}/);
  assert.match(publishJob, /WUI_NPM_BOOTSTRAP_TOKEN_ENABLED != 'true'/);
  assert.match(publishJob, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/);
  assert.match(publishJob, /NPM_CONFIG_USERCONFIG: \$\{\{ runner\.temp \}\}/);
  assert.match(publishJob, /trap cleanup EXIT HUP INT TERM/);
  assert.match(publishJob, /rm -f "\$NPM_CONFIG_USERCONFIG"/);
  assert.equal((publishJob.match(/secrets\.NPM_TOKEN/g) ?? []).length, 1);

  const stageIndex = workflow.indexOf(
    'Copy release scripts before validation',
  );
  const uploadIndex = workflow.indexOf('Upload immutable publisher');
  const titleIndex = workflow.indexOf(
    'node tools/npm-release/check-release-title.mjs',
  );
  assert.ok(stageIndex < uploadIndex && uploadIndex < titleIndex);
  assert.match(
    workflow,
    /actions\/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02/,
  );
  assert.match(
    workflow,
    /actions\/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093/,
  );
  for (const match of workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)) {
    assert.match(match[1], /@[0-9a-f]{40}$/);
  }
  assert.match(canaryJobs, /WUI_NPM_CANARY_ENABLED == 'true'/);
  assert.match(workflow, /0\.0\.0-canary\.<integer>/);
  assert.match(canaryJobs, /^    environment: npm-publish$/m);
  assert.equal(
    (canaryJobs.match(/WUI_NPM_CANARY_ENABLED: \$\{\{ vars\.WUI_NPM_CANARY_ENABLED \}\}/g) ?? []).length,
    2,
  );
  assert.match(workflow, /inputs\.operation == 'public_launch'/);
  assert.match(workflow, /WUI_NPM_PUBLIC_LAUNCH_ENABLED == 'true'/);
  assert.match(workflow, /^    environment: npm-public-launch$/m);
  const launchJob = workflow.slice(workflow.indexOf('  launch-public-packages:'));
  assert.doesNotMatch(launchJob, /actions\/checkout|npm pack|prepack|prepare/);
  assert.equal((launchJob.match(/secrets\.NPM_PUBLIC_LAUNCH_TOKEN/g) ?? []).length, 1);
  assert.match(workflow, /secrets\.NPM_PUBLIC_LAUNCH_TOKEN/);
  assert.match(workflow, /PUBLIC_LAUNCH_CONFIRMATION/);
  assert.match(
    launchJob,
    /WUI_NPM_PUBLIC_LAUNCH_ENABLED: \$\{\{ vars\.WUI_NPM_PUBLIC_LAUNCH_ENABLED \}\}/,
  );
  assert.doesNotMatch(
    workflow,
    /pull_request|\bgh release\b|\bgit tag\b|actions\/(?:create-release|upload-release-asset)/,
  );
});

test('post-publish audit probes every package and aggregates failures', async () => {
  const fixture = createArtifactFixture();
  const npmLog = [];
  const visibilityCalls = [];
  let error;
  try {
    await publishRelease({
      fetchImpl: async url => {
        visibilityCalls.push(String(url));
        const call = visibilityCalls.length;
        const status = call === 5 ? 200 : call === 6 ? 503 : 404;
        return new Response('', { status });
      },
      manifestPath: fixture.manifestPath,
      runNpmFn: fakeNpm(npmLog),
      releaseEnabled: 'true',
      version: fixture.version,
    });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof AggregateError);
  assert.equal(error.errors.length, 2);
  assert.equal(visibilityCalls.length, 8);
  assert.match(error.message, /androidx-shapes.*publicly readable/s);
  assert.match(error.message, /icons.*HTTP 503/s);
  assert.equal(npmLog.filter(args => args[0] === 'publish').length, 4);
});

test('post-publish public exposure fails the completed release', async () => {
  const fixture = createArtifactFixture();
  const npmLog = [];
  let visibilityCall = 0;
  await assert.rejects(
    publishRelease({
      fetchImpl: async () => {
        visibilityCall += 1;
        return new Response('', {
          status: visibilityCall === 5 ? 200 : 404,
        });
      },
      manifestPath: fixture.manifestPath,
      runNpmFn: fakeNpm(npmLog),
      releaseEnabled: 'true',
      version: fixture.version,
    }),
    /publicly readable.*post-publish/,
  );
  assert.equal(npmLog.filter(args => args[0] === 'publish').length, 4);
});

test('post-publish ambiguity reports completion and forbids blind retry', async () => {
  const fixture = createArtifactFixture();
  let visibilityCall = 0;
  await assert.rejects(
    publishRelease({
      fetchImpl: async () => {
        visibilityCall += 1;
        return new Response('', {
          status: visibilityCall === 5 ? 503 : 404,
        });
      },
      manifestPath: fixture.manifestPath,
      runNpmFn: fakeNpm([]),
      releaseEnabled: 'true',
      version: fixture.version,
    }),
    error => {
      assert.match(error.message, /published all artifacts/);
      assert.match(error.message, /Do not retry/);
      assert.match(error.message, /HTTP 503/);
      return true;
    },
  );
});
