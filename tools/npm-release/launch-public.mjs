#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PACKAGE_ORDER,
  NPM_REGISTRY_URL,
  assertReleaseVersion,
} from './release-config.mjs';
import {
  assertPackageNotPublic,
  runNpm,
} from './publish-staging.mjs';

function requireStableVersion(version) {
  const releaseVersion = assertReleaseVersion(version);
  if (releaseVersion.includes('-') || releaseVersion.includes('+')) {
    throw new Error(`Public launch requires a stable version, received: ${version}`);
  }
  return releaseVersion;
}

function parseJsonOutput(result, label) {
  if (result.status !== 0) {
    throw new Error(
      `${label} failed with status ${result.status}:\n${result.stdout ?? ''}${result.stderr ?? ''}`,
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${label} returned invalid JSON.`, { cause: error });
  }
}

async function assertPublicRelease(packageName, version, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(
      new URL(encodeURIComponent(packageName), NPM_REGISTRY_URL),
      {
        cache: 'no-store',
        headers: {
          accept: 'application/vnd.npm.install-v1+json',
          'cache-control': 'no-cache',
        },
        method: 'GET',
        redirect: 'error',
      },
    );
  } catch (error) {
    throw new Error(
      `Unable to determine unauthenticated public visibility for ${packageName} during public-launch verification.`,
      { cause: error },
    );
  }
  if (response.status !== 200) {
    await response.body?.cancel();
    throw new Error(`${packageName} is not publicly readable after launch: HTTP ${response.status}.`);
  }
  let metadata;
  try {
    metadata = await response.json();
  } catch (error) {
    throw new Error(
      `${packageName} returned malformed public metadata after launch.`,
      { cause: error },
    );
  }
  if (metadata?.['dist-tags']?.latest !== version || metadata?.versions?.[version] == null) {
    throw new Error(
      `${packageName} public metadata does not expose ${version} as latest.`,
    );
  }
}

export async function launchPublicRelease({
  confirmation,
  fetchImpl = globalThis.fetch,
  publicLaunchEnabled = process.env.WUI_NPM_PUBLIC_LAUNCH_ENABLED,
  runNpmFn = runNpm,
  version,
}) {
  if (confirmation !== 'MAKE_PUBLIC') {
    throw new Error('Public launch requires confirmation MAKE_PUBLIC.');
  }
  if (publicLaunchEnabled !== 'true') {
    throw new Error(
      'Public launch requires WUI_NPM_PUBLIC_LAUNCH_ENABLED=true.',
    );
  }
  const releaseVersion = requireStableVersion(version);

  for (const entry of PACKAGE_ORDER) {
    await assertPackageNotPublic(entry.name, {
      fetchImpl,
      phase: 'public-launch preflight',
    });
    const result = runNpmFn([
      'view',
      `${entry.name}@${releaseVersion}`,
      'version',
      '--json',
      `--registry=${NPM_REGISTRY_URL}`,
    ], { capture: true });
    const observed = parseJsonOutput(result, `npm view ${entry.name}@${releaseVersion}`);
    if (observed !== releaseVersion) {
      throw new Error(
        `${entry.name} private release must be exactly ${releaseVersion}, received ${observed}.`,
      );
    }
  }

  const changed = [];
  try {
    for (const entry of PACKAGE_ORDER) {
      const arguments_ = [
        'access',
        'set',
        'status=public',
        entry.name,
        `--registry=${NPM_REGISTRY_URL}`,
      ];
      const result = runNpmFn(arguments_, { capture: true });
      if (result.status !== 0) {
        throw new Error(
          `npm ${arguments_.join(' ')} failed with status ${result.status}:\n` +
          `${result.stdout ?? ''}${result.stderr ?? ''}`,
        );
      }
      changed.push(entry.name);
    }
  } catch (error) {
    const message = changed.length === 0
      ? 'Public launch could not confirm any visibility changes because the first npm access command failed. The registry may still have applied the change; verify npm state before retrying.'
      : `Public launch partially changed ${changed.length} package(s): ${changed.join(', ')}. Stop and inspect npm; do not blindly retry.`;
    throw new Error(message, { cause: error });
  }

  const failures = [];
  for (const entry of PACKAGE_ORDER) {
    try {
      await assertPublicRelease(entry.name, releaseVersion, fetchImpl);
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length > 0) {
    throw new AggregateError(
      failures,
      'All visibility mutations completed, but public metadata verification failed. Stop and inspect npm.',
    );
  }
  console.log(`Public npm launch completed for ${releaseVersion}.`);
}

const isMain = process.argv[1] != null &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [, , version, confirmation] = process.argv;
  if (version == null || confirmation == null) {
    throw new Error('usage: launch-public.mjs <stable-version> MAKE_PUBLIC');
  }
  await launchPublicRelease({ confirmation, version });
}
