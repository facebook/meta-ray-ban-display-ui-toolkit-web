#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { appendFileSync } from 'node:fs';
import path from 'node:path';
import {
  parseStagingReleaseTitle,
  validatePackageManifests,
} from './release-config.mjs';

function parseArguments(arguments_) {
  let root = process.cwd();
  let title = process.env.GITHUB_COMMIT_TITLE ?? '';
  let output = process.env.GITHUB_OUTPUT ?? null;
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--root') {
      root = path.resolve(arguments_[++index]);
    } else if (argument === '--title') {
      title = arguments_[++index];
    } else if (argument === '--github-output') {
      output = path.resolve(arguments_[++index]);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { output, root, title };
}

const { output, root, title } = parseArguments(process.argv.slice(2));
const commitTitle = title.split(/\r?\n/, 1)[0];
const releasePrefix = 'Release version ';
const releaseCandidate = commitTitle.startsWith(releasePrefix)
  ? commitTitle.slice(releasePrefix.length)
  : null;
const isReservedReleaseCommand =
  releaseCandidate != null &&
  (
    releaseCandidate.length === 0 ||
    releaseCandidate.trim() !== releaseCandidate ||
    !/\s/.test(releaseCandidate)
  );
let version;
try {
  version = isReservedReleaseCommand
    ? parseStagingReleaseTitle(commitTitle)
    : null;
} catch (error) {
  console.error(
    `::error::Invalid npm release title ${JSON.stringify(commitTitle)}: ${error.message}`,
  );
  process.exitCode = 1;
}

if (process.exitCode == null) {
  const values = version == null
    ? { release: 'false' }
    : { release: 'true', version };

  if (version != null) {
    try {
      validatePackageManifests(root, version);
    } catch (error) {
      console.error(
        `::error::Invalid npm package manifests for ${version}: ${error.message}`,
      );
      process.exitCode = 1;
    }
  }

  if (process.exitCode == null) {
    if (output != null) {
      appendFileSync(
        output,
        `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`,
      );
    }
    console.log(
      version == null
        ? 'Commit title is not an npm release.'
        : `Validated npm release ${version}.`,
    );
  }
}
