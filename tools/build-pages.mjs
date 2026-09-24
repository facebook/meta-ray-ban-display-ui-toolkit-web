/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import assert from 'node:assert/strict';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesRoot = path.join(root, 'build', 'pages');
const dependencies = [
  {
    name: 'AndroidX shapes package',
    workspace: '@wearables-ui-toolkit/androidx-shapes',
  },
  {
    name: 'icons package',
    workspace: '@wearables-ui-toolkit/icons',
  },
  {
    name: 'foundation package',
    workspace: '@wearables-ui-toolkit/foundation',
  },
  {
    name: 'Meta Ray-Ban Display package',
    workspace: '@wearables-ui-toolkit/mrbd',
  },
];
const sites = [
  {
    name: 'index',
    workspace: '@meta/wearables-ui-toolkit-pages-index',
    source: 'examples/pages-index/dist',
    destination: '.',
  },
  {
    name: 'icon browser',
    workspace: '@meta/wearables-ui-toolkit-icon-browser',
    source: 'examples/icon-browser/dist',
    destination: 'utilities/icons',
  },
  {
    name: 'app icon generator',
    workspace: '@meta/wearables-ui-toolkit-app-icon-generator',
    source: 'examples/app-icon-generator/dist',
    destination: 'utilities/app-icons',
  },
  {
    name: 'component gallery',
    workspace: '@meta/wearables-ui-toolkit-mrbd-gallery',
    source: 'examples/gallery/dist',
    destination: 'component-gallery',
  },
  {
    name: 'launcher',
    workspace: '@meta/wearables-ui-toolkit-mrbd-example-launcher',
    source: 'examples/launcher/dist',
    destination: 'launcher',
  },
  {
    name: 'alpha launcher',
    workspace: '@meta/wearables-ui-toolkit-mrbd-alpha-launcher',
    source: 'examples/alpha-launcher/dist',
    destination: 'alpha-launcher',
  },
  {
    name: 'messaging',
    workspace: '@meta/wearables-ui-toolkit-mrbd-messaging-demo',
    source: 'examples/messaging/dist',
    destination: 'messaging',
  },
];

function buildWorkspace({ name, workspace }) {
  const result = spawnSync('yarn', ['workspace', workspace, 'build'], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  assert.equal(result.status, 0, `Failed to build ${name}`);
}

async function copyDirectoryContents(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source)) {
    await cp(path.join(source, entry), path.join(destination, entry), {
      recursive: true,
    });
  }
}

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files;
}

async function verifyPagesArtifact() {
  for (const site of sites) {
    const indexPath = path.join(pagesRoot, site.destination, 'index.html');
    await readFile(indexPath);
  }

  const textFiles = (await listFiles(pagesRoot)).filter(filePath =>
    /\.(?:css|html|js)$/.test(filePath),
  );
  for (const filePath of textFiles) {
    const contents = await readFile(filePath, 'utf8');
    assert.doesNotMatch(
      contents,
      /(?:href|src)=["']\/(?!\/)|\burl\(\s*["']?\/(?!\/)|["'`]\/[^"'`\s?#]+\.(?:avif|css|gif|ico|jpe?g|js|json|mp4|otf|png|svg|ttf|wasm|webm|woff2?)(?:[?#][^"'`]*)?/i,
      `${path.relative(pagesRoot, filePath)} contains an origin-root asset URL`,
    );
  }
}

for (const dependency of dependencies) {
  buildWorkspace(dependency);
}
for (const site of sites) {
  buildWorkspace(site);
}

await rm(pagesRoot, { force: true, recursive: true });
await mkdir(pagesRoot, { recursive: true });
for (const site of sites) {
  await copyDirectoryContents(
    path.join(root, site.source),
    path.join(pagesRoot, site.destination),
  );
}
await writeFile(path.join(pagesRoot, '.nojekyll'), '');
await verifyPagesArtifact();

console.log(`Built ${sites.length} isolated sites in ${pagesRoot}.`);
