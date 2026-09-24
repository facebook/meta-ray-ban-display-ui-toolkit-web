#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CANARY_PACKAGE_NAME = '@wearables-ui-toolkit/publishing-canary';
const CANARY_VERSION = /^0\.0\.0-canary\.(0|[1-9]\d*)$/;

export function assertCanaryVersion(version) {
  if (typeof version !== 'string' || !CANARY_VERSION.test(version)) {
    throw new Error(
      `Publishing canary version must match 0.0.0-canary.<integer>, received: ${version}`,
    );
  }
  return version;
}

export function preparePublishingCanary(output, version) {
  const releaseVersion = assertCanaryVersion(version);
  const packageRoot = path.resolve(output);
  mkdirSync(packageRoot, { recursive: true });
  const manifest = {
    name: CANARY_PACKAGE_NAME,
    version: releaseVersion,
    description: 'Private package used only to verify WUI npm publishing infrastructure.',
    license: 'UNLICENSED',
    publishConfig: {
      access: 'restricted',
      registry: 'https://registry.npmjs.org/',
      tag: 'next',
    },
  };
  writeFileSync(
    path.join(packageRoot, 'package.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  writeFileSync(
    path.join(packageRoot, 'README.md'),
    '# WUI npm publishing canary\n\nThis package is permanently private and contains no product code.\n',
  );
  return manifest;
}

const isMain = process.argv[1] != null &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [, , output, version] = process.argv;
  if (output == null || version == null) {
    throw new Error('usage: prepare-publishing-canary.mjs <output> <version>');
  }
  preparePublishingCanary(output, version);
}
