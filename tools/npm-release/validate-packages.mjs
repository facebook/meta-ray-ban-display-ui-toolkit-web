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
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import {
  PACKAGE_ORDER,
  assertReleaseAccess,
  createStagedPackageManifest,
  packagePrepackCommand,
  packagePrepackSteps,
  readPackageManifest,
  validatePackageManifestCollection,
  validatePackageManifests,
} from './release-config.mjs';
import { validateLicensePolicy } from '../validate-license.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIRECTORY = path.dirname(SCRIPT_PATH);
const DEFAULT_ROOT = path.resolve(SCRIPT_DIRECTORY, '../..');
const TAR_BIN = process.env.TAR_BIN ?? 'tar';
const TEXT_EXTENSIONS = new Set([
  '', '.css', '.d.ts', '.js', '.json', '.md', '.mjs', '.svg', '.ts', '.tsx', '.txt',
]);
const ALLOWED_SCOPED_PACKAGE_REFERENCES = new Set([
  ...PACKAGE_ORDER.map(entry => entry.name),
  '@types/react',
  '@types/react-dom',
  '@vitejs/plugin-react',
]);
const SCOPED_PACKAGE_REFERENCE = /@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*/gi;

function run(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env ?? process.env,
    maxBuffer: 64 * 1024 * 1024,
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${arguments_.join(' ')} failed\n${result.stdout ?? ''}${result.stderr ?? ''}`,
    );
  }
  return result.stdout ?? '';
}

function runNpm(npm, arguments_, options = {}) {
  return npm.endsWith('.js')
    ? run(process.execPath, [npm, ...arguments_], options)
    : run(npm, arguments_, options);
}

export function parsePackOutput(stdout) {
  for (
    let index = stdout.lastIndexOf('[');
    index >= 0;
  ) {
    try {
      const value = JSON.parse(stdout.slice(index));
      if (Array.isArray(value) && value.length === 1) {
        return value[0];
      }
    } catch {
      // Keep looking for the final JSON array after lifecycle output.
    }
    if (index === 0) break;
    index = stdout.lastIndexOf('[', index - 1);
  }
  throw new Error(`npm pack did not return a JSON payload:\n${stdout}`);
}

function argumentValue(arguments_, index, option) {
  const value = arguments_[index + 1];
  if (value == null || value.startsWith('--')) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}

function parseArguments(arguments_) {
  let root = DEFAULT_ROOT;
  let output = null;
  let npm = process.env.NPM_BIN ?? 'npm';
  let node = path.resolve(process.env.NODE_BIN ?? process.execPath);
  let releaseAccess = null;
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--root') {
      root = path.resolve(argumentValue(arguments_, index, argument));
      index += 1;
    } else if (argument === '--output') {
      output = path.resolve(argumentValue(arguments_, index, argument));
      index += 1;
    } else if (argument === '--npm') {
      const value = argumentValue(arguments_, index, argument);
      npm = value.includes('/') || value.includes('\\')
        ? path.resolve(value)
        : value;
      index += 1;
    } else if (argument === '--node') {
      node = path.resolve(argumentValue(arguments_, index, argument));
      index += 1;
    } else if (argument === '--release-access') {
      releaseAccess = assertReleaseAccess(
        argumentValue(arguments_, index, argument),
      );
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { node, npm, output, releaseAccess, root };
}

function exportTargets(exportsValue) {
  if (typeof exportsValue === 'string') return [exportsValue];
  if (exportsValue == null || typeof exportsValue !== 'object') return [];
  return Object.values(exportsValue).flatMap(exportTargets);
}

function matchesTarget(files, target) {
  const normalized = target.replace(/^\.\//, '');
  if (!normalized.includes('*')) return files.includes(normalized);
  const pattern = new RegExp(
    `^${normalized.split('*').map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+')}$`,
  );
  return files.some(file => pattern.test(file));
}

function validatePack(entry, manifest, pack) {
  if (pack.name !== entry.name || pack.version !== manifest.version) {
    throw new Error(`npm pack returned unexpected identity for ${entry.name}`);
  }
  const files = pack.files.map(file => file.path).sort();
  const requiredFiles = [
    'LICENSE',
    'NOTICE',
    'README.md',
    'dist/index.d.ts',
    'dist/index.js',
    'package.json',
    ...(entry.name.endsWith('/androidx-shapes') ? ['UPSTREAM.md'] : []),
  ];
  for (const required of requiredFiles) {
    if (!files.includes(required)) {
      throw new Error(`${entry.name} tarball is missing ${required}`);
    }
  }
  for (const file of files) {
    if (/^node_modules(?:\/|$)/.test(file)) {
      throw new Error(`${entry.name} tarball contains a dependency directory: ${file}`);
    }
    if (
      /(?:^|\/)(?:__tests__|[^/]+\.(?:test|spec)\.)/.test(file) ||
      file.endsWith('.map')
    ) {
      throw new Error(
        `${entry.name} tarball contains a development artifact: ${file}`,
      );
    }
    if (file.startsWith('src/')) {
      const allowed = entry.name.endsWith('/androidx-shapes') ||
        (entry.name.endsWith('/icons') && [
          'src/keyword-index.json',
          'src/manifest.json',
          'src/svg.d.ts',
        ].includes(file));
      if (!allowed) {
        throw new Error(
          `${entry.name} tarball exposes unexpected source: ${file}`,
        );
      }
    }
  }
  for (const target of [
    manifest.main,
    manifest.module,
    manifest.types,
    ...exportTargets(manifest.exports),
  ].filter(Boolean)) {
    if (!matchesTarget(files, target)) {
      throw new Error(
        `${entry.name} export target is absent from tarball: ${target}`,
      );
    }
  }
}

function extractedPackageFile(packageRoot, relative, packageName) {
  const candidate = path.resolve(packageRoot, relative);
  const contained = path.relative(packageRoot, candidate);
  if (
    contained === '..' ||
    contained.startsWith(`..${path.sep}`) ||
    path.isAbsolute(contained)
  ) {
    throw new Error(`${packageName} tarball path escapes the package: ${relative}`);
  }
  const stats = lstatSync(candidate, { throwIfNoEntry: false });
  if (stats == null) {
    throw new Error(`${packageName} tarball is missing ${relative}`);
  }
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new Error(`${packageName} tarball entry must be a regular file: ${relative}`);
  }
  return candidate;
}

export function composeAndroidXNotice(androidXNotice, projectNotice) {
  return `${androidXNotice.trimEnd()}\n\n${projectNotice.trimStart()}`;
}

function legalPolicyFilesForPackage(root, entry) {
  const projectLicense = readFileSync(path.resolve(root, 'LICENSE'));
  const projectNotice = readFileSync(path.resolve(root, 'NOTICE'), 'utf8');
  const packageRoot = path.resolve(root, entry.directory);
  if (entry.name.endsWith('/icons')) {
    return {
      LICENSE: readFileSync(path.resolve(packageRoot, 'LICENSE')),
      NOTICE: Buffer.from(projectNotice),
    };
  }
  if (!entry.name.endsWith('/androidx-shapes')) {
    return {
      LICENSE: projectLicense,
      NOTICE: Buffer.from(projectNotice),
    };
  }

  return {
    LICENSE: readFileSync(path.resolve(packageRoot, 'LICENSE')),
    NOTICE: Buffer.from(composeAndroidXNotice(
      readFileSync(path.resolve(packageRoot, 'NOTICE'), 'utf8'),
      projectNotice,
    )),
    'UPSTREAM.md': readFileSync(path.resolve(packageRoot, 'UPSTREAM.md')),
  };
}

const PUBLIC_REPOSITORY_URL =
  'https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web';
const DEVELOPER_CENTER_DESIGN_URL =
  'https://wearables.developer.meta.com/docs/develop/webapps/design';
const PACKAGE_README_CONFIG = Object.freeze({
  '@wearables-ui-toolkit/androidx-shapes': Object.freeze({
    description: 'Rounded-polygon geometry utilities.',
    documentationUrl:
      `${PUBLIC_REPOSITORY_URL}/blob/main/packages/androidx-shapes/README.md`,
    licenseUrl:
      `${PUBLIC_REPOSITORY_URL}/blob/main/packages/androidx-shapes/LICENSE`,
    noticeUrl:
      `${PUBLIC_REPOSITORY_URL}/blob/main/packages/androidx-shapes/NOTICE`,
    packageUrl:
      `${PUBLIC_REPOSITORY_URL}/tree/main/packages/androidx-shapes`,
  }),
  '@wearables-ui-toolkit/foundation': Object.freeze({
    description:
      'React primitives for UI Toolkit for Meta Ray-Ban Display.',
    documentationUrl:
      `${DEVELOPER_CENTER_DESIGN_URL}/foundations/overview/`,
    licenseUrl: `${PUBLIC_REPOSITORY_URL}/blob/main/LICENSE`,
    noticeUrl: `${PUBLIC_REPOSITORY_URL}/blob/main/NOTICE`,
    packageUrl:
      `${PUBLIC_REPOSITORY_URL}/tree/main/packages/foundation`,
  }),
  '@wearables-ui-toolkit/icons': Object.freeze({
    assetTermsUrl: 'https://wearables.developer.meta.com/terms/',
    description: 'SVG icon assets for UI Toolkit for Meta Ray-Ban Display.',
    documentationUrl:
      `${DEVELOPER_CENTER_DESIGN_URL}/foundations/utilities/icons/`,
    licenseUrl:
      `${PUBLIC_REPOSITORY_URL}/blob/main/packages/icons/LICENSE`,
    noticeUrl: `${PUBLIC_REPOSITORY_URL}/blob/main/NOTICE`,
    packageUrl:
      `${PUBLIC_REPOSITORY_URL}/tree/main/packages/icons`,
  }),
  '@wearables-ui-toolkit/mrbd': Object.freeze({
    description:
      'React component library for UI Toolkit for Meta Ray-Ban Display.',
    documentationUrl:
      `${DEVELOPER_CENTER_DESIGN_URL}/getting-started/installation/`,
    licenseUrl: `${PUBLIC_REPOSITORY_URL}/blob/main/LICENSE`,
    noticeUrl: `${PUBLIC_REPOSITORY_URL}/blob/main/NOTICE`,
    packageUrl:
      `${PUBLIC_REPOSITORY_URL}/tree/main/packages/mrbd`,
  }),
});

export function generatePackageReadme(entry, tag = 'next') {
  const config = PACKAGE_README_CONFIG[entry.name];
  if (config == null) {
    throw new Error(`Missing generated README configuration for ${entry.name}.`);
  }
  if (tag !== 'next' && tag !== 'latest') {
    throw new Error(`Unsupported npm README install tag: ${tag}`);
  }
  const licenseText = config.assetTermsUrl == null
    ? `See [LICENSE](${config.licenseUrl}) and ` +
      `[NOTICE](${config.noticeUrl}).\n`
    : 'This package is licensed under the ' +
      `[Meta Wearables Developer Terms](${config.assetTermsUrl}).\n\n` +
      `- [Package LICENSE](${config.licenseUrl})\n` +
      `- [Project NOTICE](${config.noticeUrl})\n`;
  return (
    `# ${entry.name}\n\n` +
    `${config.description}\n\n` +
    '## Install\n\n' +
    '```sh\n' +
    `npm install ${entry.name}@${tag}\n` +
    '```\n\n' +
    '## Links\n\n' +
    `- [Repository](${PUBLIC_REPOSITORY_URL})\n` +
    `- [Package source](${config.packageUrl})\n` +
    `- [Documentation](${config.documentationUrl})\n\n` +
    '## License\n\n' +
    licenseText
  );
}

function dryRunPackageFiles(npm, packageRoot, environment) {
  const pack = parsePackOutput(runNpm(
    npm,
    ['pack', '--dry-run', '--ignore-scripts', '--json'],
    {
      capture: true,
      cwd: packageRoot,
      env: environment,
    },
  ));
  return new Set(pack.files.map(file => file.path));
}

export function assertPacklistUnchanged(
  before,
  after,
  packageName,
  operation,
) {
  const beforeFiles = [...before].sort();
  const afterFiles = [...after].sort();
  if (JSON.stringify(beforeFiles) !== JSON.stringify(afterFiles)) {
    throw new Error(`${packageName} ${operation} changed the npm packlist.`);
  }
}

const FORBIDDEN_AUTOMATIC_NPM_SCRIPTS = new Set([
  'dependencies',
  'install',
  'postinstall',
  'postpack',
  'postprepack',
  'postprepare',
  'postpublish',
  'postuninstall',
  'postversion',
  'preinstall',
  'prepare',
  'preprepare',
  'preprepack',
  'prepublish',
  'prepublishOnly',
  'preuninstall',
  'preversion',
  'publish',
  'uninstall',
  'version',
]);

function assertLifecycleScriptPolicy(entry, manifest) {
  const expected = packagePrepackCommand(entry);
  if (manifest.scripts?.prepack !== expected) {
    throw new Error(
      `${entry.name} prepack command does not match release policy.`,
    );
  }
  for (const scriptName of Object.keys(manifest.scripts ?? {})) {
    if (
      scriptName !== 'prepack' &&
      FORBIDDEN_AUTOMATIC_NPM_SCRIPTS.has(scriptName)
    ) {
      throw new Error(
        `${entry.name} must not define automatic npm lifecycle script ${scriptName}.`,
      );
    }
  }
}

function assertPrepackCommandUnchanged(root, entry, snapshot) {
  const captured = snapshot.manifests.get(entry.name)?.manifest;
  if (captured == null) {
    throw new Error(`Missing captured manifest for ${entry.name}.`);
  }
  assertLifecycleScriptPolicy(entry, captured);
  const current = JSON.parse(readFileSync(
    path.resolve(root, entry.directory, 'package.json'),
    'utf8',
  ));
  assertLifecycleScriptPolicy(entry, current);
}

export function runPackagePrepack(
  root,
  entry,
  node,
  environment = process.env,
) {
  if (typeof node !== 'string' || node === '') {
    throw new Error(`${entry.name} prepack requires an explicit Node binary.`);
  }
  const validatedEnvironment = {
    ...environment,
    WUI_NPM_VALIDATED_PREPACK: '1',
  };
  for (const arguments_ of packagePrepackSteps(root, entry)) {
    run(node, arguments_, {
      cwd: path.resolve(root, entry.directory),
      env: validatedEnvironment,
    });
  }
}

function policyFileSnapshot(file) {
  const bytes = readFileSync(file);
  return {
    bytes,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

export function captureSourcePolicy(root, entries = PACKAGE_ORDER) {
  const canonicalLegalFiles = {
    LICENSE: policyFileSnapshot(path.resolve(root, 'LICENSE')),
    NOTICE: policyFileSnapshot(path.resolve(root, 'NOTICE')),
  };
  const manifests = new Map();
  const expectedLegalPolicyFiles = new Map();
  const sourceLegalFiles = new Map();
  for (const entry of entries) {
    const manifestPath = path.resolve(root, entry.directory, 'package.json');
    const snapshot = policyFileSnapshot(manifestPath);
    manifests.set(entry.name, {
      ...snapshot,
      manifest: JSON.parse(snapshot.bytes.toString('utf8')),
    });
    expectedLegalPolicyFiles.set(entry.name, legalPolicyFilesForPackage(root, entry));
    const sourcePolicyFiles = entry.name.endsWith('/icons')
      ? ['LICENSE']
      : entry.name.endsWith('/androidx-shapes')
        ? ['LICENSE', 'NOTICE', 'UPSTREAM.md']
        : [];
    if (sourcePolicyFiles.length > 0) {
      sourceLegalFiles.set(entry.name, new Map(
        sourcePolicyFiles.map(filename => [
          filename,
          policyFileSnapshot(path.resolve(root, entry.directory, filename)),
        ]),
      ));
    }
  }
  return {
    canonicalLegalFiles,
    expectedLegalPolicyFiles,
    manifests,
    sourceLegalFiles,
  };
}

function assertPolicyFileUnchanged(file, expected, label) {
  const actual = policyFileSnapshot(file);
  if (
    actual.sha256 !== expected.sha256 ||
    !actual.bytes.equals(expected.bytes)
  ) {
    throw new Error(`${label} changed during npm lifecycle execution.`);
  }
}

export function assertSourcePolicyUnchanged(root, snapshot) {
  for (const filename of ['LICENSE', 'NOTICE']) {
    assertPolicyFileUnchanged(
      path.resolve(root, filename),
      snapshot.canonicalLegalFiles[filename],
      `Repository ${filename}`,
    );
  }
  for (const entry of PACKAGE_ORDER) {
    const expected = snapshot.manifests.get(entry.name);
    if (expected != null) {
      assertPolicyFileUnchanged(
        path.resolve(root, entry.directory, 'package.json'),
        expected,
        `${entry.name} package.json`,
      );
    }
    for (const [filename, legalSnapshot] of
      snapshot.sourceLegalFiles.get(entry.name) ?? []) {
      assertPolicyFileUnchanged(
        path.resolve(root, entry.directory, filename),
        legalSnapshot,
        `${entry.name} ${filename}`,
      );
    }
  }
}

export function runValidatedPackageLifecycles(
  root,
  environment = process.env,
  options = {},
) {
  const entries = options.entries ?? PACKAGE_ORDER;
  const validateManifests =
    options.validateManifests ?? validatePackageManifests;
  const validateLicense = options.validateLicense ?? validateLicensePolicy;
  const initialValidation = validateManifests(root);
  validateLicense(root);
  const snapshot = captureSourcePolicy(root, entries);
  const node = options.node ?? process.env.NODE_BIN ?? process.execPath;
  for (const entry of entries) {
    assertSourcePolicyUnchanged(root, snapshot);
    assertPrepackCommandUnchanged(root, entry, snapshot);
    runPackagePrepack(
      root,
      entry,
      node,
      environment,
    );
    assertSourcePolicyUnchanged(root, snapshot);
  }
  const failures = [];
  for (const validate of [
    () => validateManifests(root),
    () => validateLicense(root),
    () => assertSourcePolicyUnchanged(root, snapshot),
  ]) {
    try {
      validate();
    } catch (error) {
      failures.push(String(error));
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `Post-lifecycle source validation failed:\n- ${failures.join('\n- ')}`,
    );
  }
  return { snapshot, version: initialValidation?.version };
}

function assertPackedManifestPolicy(actual, expected, packageName) {
  for (const field of [
    'name',
    'version',
    'license',
    'private',
    'publishConfig',
    'files',
    'exports',
    'main',
    'module',
    'types',
    'dependencies',
    'peerDependencies',
    'peerDependenciesMeta',
  ]) {
    if (JSON.stringify(actual[field]) !== JSON.stringify(expected[field])) {
      throw new Error(
        `${packageName} packed package.json changed policy field ${field}.`,
      );
    }
  }
}

export function packStagedPackage(
  npm,
  packageRoot,
  output,
  environment,
  expectedFiles,
) {
  const pack = parsePackOutput(runNpm(
    npm,
    [
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      output,
    ],
    {
      capture: true,
      cwd: packageRoot,
      env: environment,
    },
  ));
  assertPacklistUnchanged(
    expectedFiles,
    new Set(pack.files.map(file => file.path)),
    pack.name,
    'actual pack versus validated dry-run',
  );
  return pack;
}

export function createPackageStage(
  root,
  stagingRoot,
  entry,
  manifest = null,
  options = {},
) {
  const sourceRoot = path.resolve(root, entry.directory);
  const sourceManifest = manifest ?? JSON.parse(
    readFileSync(path.resolve(sourceRoot, 'package.json'), 'utf8'),
  );
  if (sourceManifest.name !== entry.name) {
    throw new Error(
      `${entry.name} staging received ${sourceManifest.name ?? 'an unnamed package'}.`,
    );
  }
  const stagedManifest = createStagedPackageManifest(
    sourceManifest,
    entry.name,
    options.releaseAccess ?? null,
  );
  const packageRoot = path.resolve(stagingRoot, entry.directory);
  mkdirSync(stagingRoot, { recursive: true });
  for (const relative of [
    'tsconfig.base.json',
    'tools/reactCompilerConfig.ts',
    'tools/viteInjectAppStyles.ts',
  ]) {
    const source = path.resolve(root, relative);
    if (!existsSync(source)) {
      continue;
    }
    if (lstatSync(source).isSymbolicLink()) {
      throw new Error(`Staging build support is a symbolic link: ${source}`);
    }
    const destination = path.resolve(stagingRoot, relative);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination);
  }
  cpSync(sourceRoot, packageRoot, {
    filter: source => {
      const relativeSource = path.relative(sourceRoot, source)
        .split(path.sep)
        .join('/');
      if (
        relativeSource === 'LICENSE' ||
        relativeSource === 'NOTICE' ||
        relativeSource === 'README.md' ||
        relativeSource === 'UPSTREAM.md'
      ) {
        return false;
      }
      if (path.basename(source) === 'node_modules') {
        return false;
      }
      if (lstatSync(source).isSymbolicLink()) {
        throw new Error(
          `${entry.name} staging source contains a symbolic link: ${source}`,
        );
      }
      return true;
    },
    recursive: true,
  });

  const tarballPolicyFiles = options.expectedLegalPolicyFiles ?? legalPolicyFilesForPackage(root, entry);
  const expectedTarballPolicyFiles = {
    ...tarballPolicyFiles,
    'README.md': Buffer.from(
      generatePackageReadme(entry, stagedManifest.publishConfig.tag),
    ),
  };
  for (const [filename, contents] of Object.entries(expectedTarballPolicyFiles)) {
    writeFileSync(path.resolve(packageRoot, filename), contents);
  }
  writeFileSync(
    path.resolve(packageRoot, 'package.json'),
    `${JSON.stringify(stagedManifest, null, 2)}
`,
  );
  const npm = options.npm;
  if (typeof npm !== 'string' || npm === '') {
    throw new Error(`${entry.name} staging requires an explicit npm binary.`);
  }
  const packedFiles = dryRunPackageFiles(
    npm,
    packageRoot,
    options.environment ?? process.env,
  );
  const verifiedPackedFiles = dryRunPackageFiles(
    npm,
    packageRoot,
    options.environment ?? process.env,
  );
  assertPacklistUnchanged(
    packedFiles,
    verifiedPackedFiles,
    entry.name,
    'repeated dry-run validation',
  );

  const rootNodeModules = path.resolve(root, 'node_modules');
  const stagedNodeModules = path.resolve(stagingRoot, 'node_modules');
  if (existsSync(rootNodeModules) && !existsSync(stagedNodeModules)) {
    symlinkSync(rootNodeModules, stagedNodeModules, 'dir');
  }
  for (const dependencyName of Object.keys(entry.internalDependencies)) {
    const dependencyEntry = PACKAGE_ORDER.find(
      value => value.name === dependencyName,
    );
    if (dependencyEntry == null) {
      throw new Error(`${entry.name} has an unknown staged dependency: ${dependencyName}`);
    }
    const stagedDependency = path.resolve(stagingRoot, dependencyEntry.directory);
    if (!existsSync(stagedDependency)) {
      throw new Error(
        `${entry.name} staged dependency is not ready: ${dependencyName}`,
      );
    }
    const dependencyLink = path.resolve(
      packageRoot,
      'node_modules',
      ...dependencyName.split('/'),
    );
    mkdirSync(path.dirname(dependencyLink), { recursive: true });
    symlinkSync(stagedDependency, dependencyLink, 'dir');
  }
  return {
    manifest: stagedManifest,
    tarballPolicyFiles: expectedTarballPolicyFiles,
    manifestBytes: readFileSync(path.resolve(packageRoot, 'package.json')),
    packedFiles,
    packageRoot,
  };
}

export function validateTarballPolicyFiles(
  packageRoot,
  packageName,
  expectedTarballPolicyFiles,
) {
  for (const [relative, expectedContents] of Object.entries(expectedTarballPolicyFiles)) {
    const actualContents = readFileSync(
      extractedPackageFile(packageRoot, relative, packageName),
    );
    if (!actualContents.equals(expectedContents)) {
      throw new Error(`${packageName} tarball contains an unexpected ${relative}`);
    }
  }
}

export function scanTarball(
  pack,
  tarball,
  packageName,
  expectedTarballPolicyFiles,
  expectedManifestBytes = null,
) {
  const extractionRoot = mkdtempSync(path.join(tmpdir(), 'wui-npm-tar-scan-'));
  const packageRoot = path.resolve(extractionRoot, 'package');
  try {
    run(TAR_BIN, ['-xzf', tarball, '-C', extractionRoot]);
    validateTarballPolicyFiles(
      packageRoot,
      packageName,
      expectedTarballPolicyFiles,
    );

    const manifestPath = extractedPackageFile(
      packageRoot,
      'package.json',
      packageName,
    );
    const manifestBytes = readFileSync(manifestPath);
    if (
      expectedManifestBytes != null &&
      !manifestBytes.equals(expectedManifestBytes)
    ) {
      throw new Error(
        `${packageName} packed package.json bytes differ from the staged manifest.`,
      );
    }

    const extractedFiles = new Map();
    for (const file of pack.files.map(entry => entry.path)) {
      extractedFiles.set(
        file,
        extractedPackageFile(packageRoot, file, packageName),
      );
    }
    for (const [file, extractedFile] of extractedFiles) {
      const extension = file.endsWith('.d.ts') ? '.d.ts' : path.extname(file);
      if (!TEXT_EXTENSIONS.has(extension)) continue;
      const source = readFileSync(extractedFile, 'utf8');
      for (const reference of source.matchAll(SCOPED_PACKAGE_REFERENCE)) {
        if (!ALLOWED_SCOPED_PACKAGE_REFERENCES.has(reference[0])) {
          throw new Error(
            `${packageName} tarball contains a non-publishable package reference in ${file}`,
          );
        }
      }
    }
    return JSON.parse(manifestBytes.toString('utf8'));
  } finally {
    rmSync(extractionRoot, { recursive: true, force: true });
  }
}

function localDependencyClosure(root, packageNames) {
  const dependencies = {};
  const pending = [...packageNames];
  while (pending.length > 0) {
    const packageName = pending.pop();
    if (Object.hasOwn(dependencies, packageName)) continue;
    const packageRoot = path.resolve(
      root,
      'node_modules',
      ...packageName.split('/'),
    );
    const manifestPath = path.resolve(packageRoot, 'package.json');
    if (!existsSync(manifestPath)) {
      throw new Error(`Consumer dependency is unavailable: ${packageName}`);
    }
    dependencies[packageName] = `file:${packageRoot}`;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    pending.push(...Object.keys(manifest.dependencies ?? {}));
  }
  return Object.fromEntries(
    Object.entries(dependencies).sort(([left], [right]) =>
      left.localeCompare(right)
    ),
  );
}

function consumerPeerDependencies(root, includeRouter) {
  return localDependencyClosure(root, [
    '@types/react',
    '@types/react-dom',
    'react',
    'react-dom',
    ...(includeRouter ? ['react-router', 'react-router-dom'] : []),
  ]);
}

const CONSUMERS = [
  {
    directPackage: '@wearables-ui-toolkit/androidx-shapes',
    expectedInstalled: ['@wearables-ui-toolkit/androidx-shapes'],
    name: 'androidx-shapes',
    peers: false,
    router: false,
    source:
      `import { generateAndroidXRoundedPolygonPath } from '@wearables-ui-toolkit/androidx-shapes';\n` +
      `void generateAndroidXRoundedPolygonPath;\n`,
  },
  {
    directPackage: '@wearables-ui-toolkit/icons',
    expectedInstalled: ['@wearables-ui-toolkit/icons'],
    name: 'icons',
    peers: false,
    router: false,
    source:
      `import { loadUITIconAssetUrl } from '@wearables-ui-toolkit/icons/browser';\n` +
      `import { airplaneFilled } from '@wearables-ui-toolkit/icons';\n` +
      `import airplaneAsset from '@wearables-ui-toolkit/icons/svg/airplane__filled.svg';\n` +
      `void loadUITIconAssetUrl; void airplaneFilled; void airplaneAsset;\n`,
  },
  {
    directPackage: '@wearables-ui-toolkit/foundation',
    expectedInstalled: [
      '@wearables-ui-toolkit/androidx-shapes',
      '@wearables-ui-toolkit/foundation',
    ],
    name: 'foundation',
    peers: true,
    router: true,
    source:
      `import { Container } from '@wearables-ui-toolkit/foundation';\n` +
      `import { Container as ContainerSubpath } from '@wearables-ui-toolkit/foundation/components/Container';\n` +
      `import { ReactRouterNavigationProvider } from '@wearables-ui-toolkit/foundation/react-router';\n` +
      `import '@wearables-ui-toolkit/foundation/styles.css';\n` +
      `void Container; void ContainerSubpath; void ReactRouterNavigationProvider;\n`,
  },
  {
    directPackage: '@wearables-ui-toolkit/mrbd',
    expectedInstalled: [
      '@wearables-ui-toolkit/androidx-shapes',
      '@wearables-ui-toolkit/foundation',
      '@wearables-ui-toolkit/mrbd',
    ],
    name: 'mrbd',
    peers: true,
    router: true,
    source:
      `import { createRoot } from 'react-dom/client';\n` +
      `import { BrowserRouter } from 'react-router-dom';\n` +
      `import { App, Button, Page } from '@wearables-ui-toolkit/mrbd';\n` +
      `import { Button as ButtonSubpath } from '@wearables-ui-toolkit/mrbd/Button';\n` +
      `import { ReactRouterNavigationProvider } from '@wearables-ui-toolkit/mrbd/react-router';\n` +
      `import '@wearables-ui-toolkit/mrbd/styles.css';\n` +
      `void ButtonSubpath;\n` +
      `createRoot(document.getElementById('root')!).render(\n` +
      `  <BrowserRouter><ReactRouterNavigationProvider><App><Page><Button title="Continue" /></Page></App></ReactRouterNavigationProvider></BrowserRouter>,\n` +
      `);\n`,
  },
];

function writeConsumer(fixture, root, consumer, version) {
  mkdirSync(path.resolve(fixture, 'src'), { recursive: true });
  const dependencies = {
    [consumer.directPackage]: version,
    ...(consumer.peers
      ? consumerPeerDependencies(root, consumer.router)
      : {}),
  };
  writeFileSync(
    path.resolve(fixture, 'package.json'),
    `${JSON.stringify({
      dependencies,
      name: `wui-${consumer.name}-consumer`,
      private: true,
      type: 'module',
    }, null, 2)}\n`,
  );
  writeFileSync(
    path.resolve(fixture, 'tsconfig.json'),
    `${JSON.stringify({
      compilerOptions: {
        allowArbitraryExtensions: true,
        jsx: 'react-jsx',
        lib: ['DOM', 'ES2022'],
        module: 'ESNext',
        moduleResolution: 'Bundler',
        noEmit: true,
        resolveJsonModule: true,
        strict: true,
        target: 'ES2022',
      },
      include: ['src'],
    }, null, 2)}\n`,
  );
  writeFileSync(
    path.resolve(fixture, 'index.html'),
    '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
  );
  writeFileSync(path.resolve(fixture, 'src/main.tsx'), consumer.source);
}

function assertConsumerResolution(fixture, consumer, version) {
  const directManifest = JSON.parse(
    readFileSync(path.resolve(fixture, 'package.json'), 'utf8'),
  );
  const directToolkitPackages = Object.keys(directManifest.dependencies).filter(
    name => name.startsWith('@wearables-ui-toolkit/'),
  );
  if (
    directToolkitPackages.length !== 1 ||
    directToolkitPackages[0] !== consumer.directPackage
  ) {
    throw new Error(
      `${consumer.name} consumer must declare only ${consumer.directPackage} directly.`,
    );
  }
  for (const packageName of consumer.expectedInstalled) {
    const installed = JSON.parse(
      readFileSync(
        path.resolve(fixture, 'node_modules', ...packageName.split('/'), 'package.json'),
        'utf8',
      ),
    );
    if (installed.version !== version) {
      throw new Error(
        `${consumer.name} resolved ${packageName}@${installed.version}, expected ${version}.`,
      );
    }
  }
}

const NPM_SCOPE_REGISTRY_KEY = '@wearables-ui-toolkit:registry';

function npmRegistryArguments(userConfig, registryUrl) {
  return [
    `--userconfig=${userConfig}`,
    `--registry=${registryUrl}`,
    `--${NPM_SCOPE_REGISTRY_KEY}=${registryUrl}`,
  ];
}

export function isolatedNpmEnvironment(
  environment,
  userConfig,
  registryUrl,
) {
  const isolated = {};
  for (const [name, value] of Object.entries(environment)) {
    const normalized = name.toLowerCase();
    if (
      normalized.startsWith('npm_config_') ||
      normalized === 'npm_token' ||
      normalized === 'node_auth_token'
    ) {
      continue;
    }
    isolated[name] = value;
  }
  isolated.NPM_CONFIG_USERCONFIG = userConfig;
  isolated.NPM_CONFIG_REGISTRY = registryUrl;
  isolated[`npm_config_${NPM_SCOPE_REGISTRY_KEY}`] = registryUrl;
  return isolated;
}

export function verifyNpmRegistryIsolation(
  npm,
  cwd,
  userConfig,
  registryUrl,
  environment,
) {
  const arguments_ = npmRegistryArguments(userConfig, registryUrl);
  for (const key of ['registry', NPM_SCOPE_REGISTRY_KEY]) {
    const configured = runNpm(
      npm,
      [...arguments_, 'config', 'get', key],
      { capture: true, cwd, env: environment },
    ).trim();
    if (configured !== registryUrl) {
      throw new Error(
        `Isolated npm ${key} resolved to ${configured}, expected ${registryUrl}.`,
      );
    }
  }
}

function validateConsumers(
  root,
  npm,
  registryUrl,
  userConfig,
  workRoot,
  environment,
  version,
) {
  const isolatedEnvironment = isolatedNpmEnvironment(
    environment,
    userConfig,
    registryUrl,
  );
  verifyNpmRegistryIsolation(
    npm,
    root,
    userConfig,
    registryUrl,
    isolatedEnvironment,
  );
  const registryArguments = npmRegistryArguments(userConfig, registryUrl);
  for (const consumer of CONSUMERS) {
    const fixture = path.resolve(workRoot, `consumer-${consumer.name}`);
    writeConsumer(fixture, root, consumer, version);
    runNpm(
      npm,
      [
        ...registryArguments,
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--no-package-lock',
      ],
      { cwd: fixture, env: isolatedEnvironment },
    );
    assertConsumerResolution(fixture, consumer, version);
    console.log(
      `Validated isolated ${consumer.name} consumer: direct ${consumer.directPackage}; resolved ${consumer.expectedInstalled.join(', ')}.`,
    );
    run(process.execPath, [
      path.resolve(root, 'node_modules/typescript/bin/tsc'),
      '-p',
      fixture,
    ]);
    run(
      process.execPath,
      [path.resolve(root, 'node_modules/vite/bin/vite.js'), 'build'],
      { cwd: fixture },
    );
  }
}

export function parseRegistryPort(value) {
  const source = value.trim();
  if (source !== value || !/^[1-9]\d*$/.test(source)) return null;
  const port = Number(source);
  return Number.isSafeInteger(port) && port <= 65535 ? port : null;
}

function registryProcessError(exitCode, signalCode) {
  if (signalCode != null) {
    return new Error(
      `Local package registry terminated with signal ${signalCode}.`,
    );
  }
  if (exitCode != null) {
    return new Error(
      `Local package registry exited with status ${exitCode}.`,
    );
  }
  return null;
}

function waitForPollOrProcessFailure(serverProcess, delayFn, milliseconds) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      serverProcess.removeListener('exit', onExit);
      serverProcess.removeListener('error', onError);
    };
    const finish = callback => value => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };
    const onExit = (code, signal) => {
      finish(reject)(
        registryProcessError(code, signal) ??
          new Error('Local package registry exited before becoming ready.'),
      );
    };
    const onError = error => {
      finish(reject)(new Error('Local package registry failed to start.', {
        cause: error,
      }));
    };
    serverProcess.once('exit', onExit);
    serverProcess.once('error', onError);
    Promise.resolve(delayFn(milliseconds)).then(finish(resolve), finish(reject));
  });
}

export async function waitForPortFile(portFile, serverProcess, options = {}) {
  const attempts = options.attempts ?? 400;
  const delayFn = options.delayFn ?? delay;
  const pollIntervalMs = options.pollIntervalMs ?? 25;
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    const processError = registryProcessError(
      serverProcess.exitCode,
      serverProcess.signalCode,
    );
    if (processError != null) throw processError;

    if (existsSync(portFile)) {
      const port = parseRegistryPort(readFileSync(portFile, 'utf8'));
      if (port != null) {
        await waitForPollOrProcessFailure(serverProcess, delayFn, 0);
        const readinessError = registryProcessError(
          serverProcess.exitCode,
          serverProcess.signalCode,
        );
        if (readinessError != null) throw readinessError;
        return port;
      }
    }
    if (attempt < attempts) {
      await waitForPollOrProcessFailure(
        serverProcess,
        delayFn,
        pollIntervalMs,
      );
    }
  }
  throw new Error('Timed out waiting for the local package registry.');
}

function waitForProcessExit(serverProcess, delayFn, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      serverProcess.removeListener('exit', onExit);
      serverProcess.removeListener('error', onError);
    };
    const finish = callback => value => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };
    const onExit = () => finish(resolve)(true);
    const onError = error => finish(reject)(error);
    serverProcess.once('exit', onExit);
    serverProcess.once('error', onError);
    Promise.resolve(delayFn(timeoutMs)).then(
      () => finish(resolve)(false),
      finish(reject),
    );
  });
}

export async function stopLocalRegistry(serverProcess, options = {}) {
  if (
    serverProcess.exitCode != null ||
    serverProcess.signalCode != null
  ) {
    return;
  }
  const delayFn = options.delayFn ?? delay;
  const timeoutMs = options.timeoutMs ?? 1000;
  let exitWait = waitForProcessExit(serverProcess, delayFn, timeoutMs);
  if (!serverProcess.kill('SIGTERM')) {
    return;
  }
  if (await exitWait) {
    return;
  }
  if (
    serverProcess.exitCode != null ||
    serverProcess.signalCode != null
  ) {
    return;
  }
  exitWait = waitForProcessExit(serverProcess, delayFn, timeoutMs);
  if (!serverProcess.kill('SIGKILL')) {
    return;
  }
  if (!(await exitWait)) {
    throw new Error('Local package registry did not exit after SIGKILL.');
  }
}

export async function startLocalRegistry(configPath, portFile, options = {}) {
  const spawnImpl = options.spawnImpl ?? spawn;
  const waitForPortFileFn = options.waitForPortFileFn ?? waitForPortFile;
  const serverProcess = spawnImpl(
    process.execPath,
    [SCRIPT_PATH, '--serve-local-registry', configPath, portFile],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  try {
    const port = await waitForPortFileFn(portFile, serverProcess);
    return {
      process: serverProcess,
      url: `http://127.0.0.1:${port}/`,
    };
  } catch (error) {
    await stopLocalRegistry(serverProcess);
    throw error;
  }
}

function packageMetadata(packageRecord, baseUrl) {
  return {
    name: packageRecord.name,
    'dist-tags': {
      [packageRecord.manifest.publishConfig.tag]: packageRecord.version,
    },
    versions: {
      [packageRecord.version]: {
        ...packageRecord.manifest,
        dist: {
          integrity: packageRecord.integrity,
          shasum: packageRecord.shasum,
          tarball:
            `${baseUrl}${encodeURIComponent(packageRecord.name)}/-/` +
            packageRecord.filename,
        },
      },
    },
  };
}

export function createLocalRegistryRequestHandler(
  config,
  getBaseUrl,
  options = {},
) {
  const readFile = options.readFile ?? readFileSync;
  return (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const decodedPath = decodeURIComponent(requestUrl.pathname.slice(1));
      if (decodedPath === '-/ping') {
        response.setHeader('content-type', 'application/json');
        response.end('{}');
        return;
      }
      for (const packageRecord of config.packages) {
        if (decodedPath === packageRecord.name) {
          response.setHeader('content-type', 'application/json');
          response.end(
            JSON.stringify(packageMetadata(packageRecord, getBaseUrl())),
          );
          return;
        }
        if (
          decodedPath ===
          `${packageRecord.name}/-/${packageRecord.filename}`
        ) {
          response.setHeader('content-type', 'application/octet-stream');
          response.end(readFile(packageRecord.tarball));
          return;
        }
      }
      response.statusCode = 404;
      response.end('not found');
    } catch (error) {
      response.statusCode = 500;
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ error: String(error) }));
    }
  };
}

async function serveLocalRegistry(configPath, portFile) {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  let server;
  const requestHandler = createLocalRegistryRequestHandler(config, () => {
    const address = server.address();
    return `http://127.0.0.1:${address.port}/`;
  });
  server = createServer(requestHandler);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const temporaryPortFile = `${portFile}.${process.pid}.tmp`;
    writeFileSync(temporaryPortFile, String(address.port));
    renameSync(temporaryPortFile, portFile);
  });
  const close = () => {
    server.close(() => process.exit(0));
    server.closeAllConnections();
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

function prepareOutputDirectory(requestedOutput, temporaryRoot) {
  const output = requestedOutput ?? path.resolve(temporaryRoot, 'tarballs');
  if (!existsSync(output)) {
    mkdirSync(output, { recursive: true });
    return output;
  }
  const stats = lstatSync(output);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error(`Output must be a directory and may not be a symlink: ${output}`);
  }
  if (readdirSync(output).length > 0) {
    throw new Error(`Output directory must be empty: ${output}`);
  }
  return output;
}

async function main() {
  const {
    node,
    npm,
    output: requestedOutput,
    releaseAccess,
    root,
  } = parseArguments(process.argv.slice(2));
  const lifecycleEnvironment = {
    ...process.env,
    PATH: `${path.resolve(root, 'node_modules/.bin')}:${process.env.PATH ?? ''}`,
  };
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), 'wui-npm-release-'),
  );
  let registry = null;
  try {
    const output = prepareOutputDirectory(requestedOutput, temporaryRoot);
    const npmUserConfig = path.resolve(temporaryRoot, 'empty-user.npmrc');
    writeFileSync(npmUserConfig, '');
    const { snapshot, version } = runValidatedPackageLifecycles(
      root,
      lifecycleEnvironment,
      { node },
    );
    const packs = [];
    const stagingRoot = path.resolve(temporaryRoot, 'staging');
    mkdirSync(stagingRoot, { recursive: true });
    for (const entry of PACKAGE_ORDER) {
      const expectedManifest = snapshot.manifests.get(entry.name)?.manifest;
      if (expectedManifest == null) {
        throw new Error(`Missing captured manifest for ${entry.name}.`);
      }
      const {
        manifest: stagedManifest,
        tarballPolicyFiles,
        manifestBytes,
        packedFiles,
        packageRoot,
      } = createPackageStage(
        root,
        stagingRoot,
        entry,
        expectedManifest,
        {
          environment: lifecycleEnvironment,
          expectedLegalPolicyFiles: snapshot.expectedLegalPolicyFiles.get(entry.name),
          npm,
          releaseAccess,
        },
      );
      const pack = packStagedPackage(
        npm,
        packageRoot,
        output,
        lifecycleEnvironment,
        packedFiles,
      );
      validatePack(entry, stagedManifest, pack);
      const tarball = path.resolve(output, pack.filename);
      const packageManifest = scanTarball(
        pack,
        tarball,
        entry.name,
        tarballPolicyFiles,
        manifestBytes,
      );
      assertPackedManifestPolicy(
        packageManifest,
        stagedManifest,
        entry.name,
      );
      packs.push({
        directory: entry.directory,
        filename: pack.filename,
        integrity: pack.integrity,
        manifest: packageManifest,
        name: entry.name,
        shasum: createHash('sha1').update(readFileSync(tarball)).digest('hex'),
        tarball,
        version: pack.version,
      });
    }
    validatePackageManifestCollection(
      new Map(packs.map(pack => [pack.name, pack.manifest])),
      version,
    );

    const registryConfig = path.resolve(temporaryRoot, 'registry.json');
    const registryPort = path.resolve(temporaryRoot, 'registry-port.txt');
    writeFileSync(
      registryConfig,
      `${JSON.stringify({ packages: packs }, null, 2)}\n`,
    );
    registry = await startLocalRegistry(registryConfig, registryPort);
    validateConsumers(
      root,
      npm,
      registry.url,
      npmUserConfig,
      temporaryRoot,
      lifecycleEnvironment,
      version,
    );

    writeFileSync(
      path.resolve(output, 'pack-manifest.json'),
      `${JSON.stringify({
        packages: packs.map(({ manifest, shasum, tarball, ...pack }) => pack),
        version,
      }, null, 2)}\n`,
    );
    console.log(
      `Validated ${packs.length} npm tarballs and ${CONSUMERS.length} isolated consumer fixtures for ${version}.`,
    );
  } finally {
    try {
      if (registry != null) {
        await stopLocalRegistry(registry.process);
      }
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }
}

if (
  process.argv[1] != null &&
  realpathSync(path.resolve(process.argv[1])) === realpathSync(SCRIPT_PATH)
) {
  if (process.argv[2] === '--serve-local-registry') {
    await serveLocalRegistry(process.argv[3], process.argv[4]);
  } else {
    await main();
  }
}
