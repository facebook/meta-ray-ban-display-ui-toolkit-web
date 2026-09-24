/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCanvasMaterialAssets } from '@wearables-ui-toolkit/foundation/material/canvas/useCanvasMaterialAssets';

class FakeImage {
  static instances: FakeImage[] = [];

  complete = false;
  crossOrigin: string | null = null;
  naturalHeight = 1;
  naturalWidth = 1;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  readonly assignedSources: string[] = [];
  private source = '';

  constructor() {
    FakeImage.instances.push(this);
  }

  get src(): string {
    return this.source;
  }

  set src(value: string) {
    this.source = value;
    this.assignedSources.push(value);
  }
}

describe('useCanvasMaterialAssets', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    FakeImage.instances = [];
  });

  it('does not promote a repeatedly requested failed image in the cache', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.stubGlobal('Image', FakeImage as unknown as typeof Image);
    const { result, unmount } = renderHook(() => useCanvasMaterialAssets());
    const { getImage } = result.current;
    unmount();
    const failedUrl = 'https://example.com/missing.png';

    getImage(failedUrl);
    FakeImage.instances.find(image =>
      image.assignedSources.includes(failedUrl)
    )?.onerror?.();

    for (let index = 0; index < 64; index += 1) {
      getImage(failedUrl);
      const loadedUrl = `https://example.com/loaded-${index}.png`;
      getImage(loadedUrl);
      FakeImage.instances.find(image =>
        image.assignedSources.includes(loadedUrl)
      )?.onload?.();
    }

    expect(
      FakeImage.instances.filter(image =>
        image.assignedSources.includes(failedUrl)
      ),
    ).toHaveLength(1);

    getImage(failedUrl);

    expect(
      FakeImage.instances.filter(image =>
        image.assignedSources.includes(failedUrl)
      ),
    ).toHaveLength(2);
  });
});
