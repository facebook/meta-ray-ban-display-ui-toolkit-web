/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync, writeFileSync } from 'node:fs';

const tokenPath = new URL(
  '../src/theme/corner-radius.tokens.json',
  import.meta.url,
);
const cssOutputPath = new URL('../src/theme/corner-radius.css', import.meta.url);
const typescriptOutputPath = new URL(
  '../src/theme/corner-radius.generated.ts',
  import.meta.url,
);
const tokens = JSON.parse(readFileSync(tokenPath, 'utf8'));
const entries = Object.entries(tokens);
const declarations = entries
  .map(([, { cssVariable, cssPixels }]) => (
    `  ${cssVariable}: ${cssPixels}px;`
  ))
  .join('\n');
const cssOutput = `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* Generated from corner-radius.tokens.json. */

:root {
${declarations}
}
`;
const definitions = entries
  .map(([name, { cssPixels, geometryPixels }]) => (
    `  ${name}: {\n` +
    `    cssPixels: ${cssPixels},\n` +
    `    geometryPixels: ${geometryPixels},\n` +
    '  },'
  ))
  .join('\n');
const typescriptOutput = `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Generated from corner-radius.tokens.json.

export const cornerRadiusDefinitions = {
${definitions}
} as const;
`;

if (process.argv.includes('--check')) {
  const staleOutputs = [
    [cssOutputPath, cssOutput],
    [typescriptOutputPath, typescriptOutput],
  ].filter(([path, output]) => readFileSync(path, 'utf8') !== output);
  if (staleOutputs.length > 0) {
    console.error(
      'Generated corner-radius files are out of date. Run ' +
      '`yarn workspace @wearables-ui-toolkit/foundation generate`.',
    );
    process.exitCode = 1;
  }
} else {
  writeFileSync(cssOutputPath, cssOutput);
  writeFileSync(typescriptOutputPath, typescriptOutput);
}
