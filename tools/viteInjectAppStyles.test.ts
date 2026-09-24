/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {RenderedChunk} from 'rollup';
import {describe, expect, it} from 'vitest';
import {injectAppStyles} from './viteInjectAppStyles';

async function renderAppChunk(code: string) {
  const plugin = injectAppStyles('app/App.js');
  if (typeof plugin.renderChunk !== 'function') {
    throw new Error('Expected a renderChunk hook');
  }
  return plugin.renderChunk.call(
    {} as never,
    code,
    {fileName: 'app/App.js'} as RenderedChunk,
    {} as never,
  );
}

describe('injectAppStyles', () => {
  it('inserts styles after client directives and static imports', async () => {
    const result = await renderAppChunk(
      '"use client";\nimport {dependency} from "dependency";\nexport {dependency};',
    );

    expect(result).toBeTypeOf('object');
    expect(result).toMatchObject({
      code: '"use client";\nimport {dependency} from "dependency";\nimport "../styles.css";\nexport {dependency};',
    });
    expect(result && typeof result === 'object' && result.map).toBeTruthy();
  });

  it('injects styles even when the chunk has no client directive', async () => {
    const result = await renderAppChunk('export const App = 1;');

    expect(result).toMatchObject({
      code: 'import "../styles.css";\nexport const App = 1;',
    });
  });

  it('does not duplicate an existing single-quoted style import', async () => {
    const code = "import '.././styles.css';\nexport const App = 1;";

    expect(await renderAppChunk(code)).toBeNull();
  });
});
