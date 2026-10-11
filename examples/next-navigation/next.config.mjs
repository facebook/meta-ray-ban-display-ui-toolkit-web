/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A static export runs on any static host. `distDir` places the export in
  // `dist`, like the other samples.
  output: 'export',
  distDir: 'dist',
  // Exports `lists/groceries/index.html` so static servers resolve deep links.
  trailingSlash: true,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
