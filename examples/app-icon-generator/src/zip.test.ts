/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { createZip } from './zip';

const decoder = new TextDecoder();

describe('createZip', () => {
  it('writes named files and a ZIP end record', async () => {
    const zip = createZip([
      { path: 'meta-wearables-manifest.json', data: new TextEncoder().encode('{}') },
      { path: 'README.md', data: new TextEncoder().encode('# Ready') },
    ]);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    const contents = decoder.decode(bytes);
    expect(contents).toContain('meta-wearables-manifest.json');
    expect(contents).not.toContain('.well-known/meta-wearables-manifest.json');
    expect(contents).toContain('README.md');
    expect(new DataView(bytes.buffer).getUint32(bytes.length - 22, true)).toBe(0x06054b50);
  });
});
