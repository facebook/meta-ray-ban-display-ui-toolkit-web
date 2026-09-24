/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  MediaWrapper,
  MediaWrapperPosition,
  MediaWrapperSize,
} from '@wearables-ui-toolkit/foundation/components/MediaWrapper';
import {
  MEDIA_WRAPPER_LARGE_DARK_OVERLAY_STOP,
  MEDIA_WRAPPER_SCRIM_HEIGHT,
} from '@wearables-ui-toolkit/foundation/components/private/MediaWrapperMetrics';

describe('MediaWrapper', () => {
  it('uses the configured scrim heights', () => {
    expect(MEDIA_WRAPPER_SCRIM_HEIGHT.small).toBe(64);
    expect(MEDIA_WRAPPER_SCRIM_HEIGHT.large).toBe(88);
    expect(MEDIA_WRAPPER_LARGE_DARK_OVERLAY_STOP).toBe(75);
  });

  it('defaults to bottom large content ordering', () => {
    const { container } = render(
      <MediaWrapper>
        <span>Caption</span>
      </MediaWrapper>,
    );

    const root = container.firstElementChild as HTMLElement;
    const first = root.children[0] as HTMLElement;
    const second = root.children[1] as HTMLElement;
    expect(first.className).toContain('scrim');
    expect(first.className).toContain('large');
    expect(first.className).toContain('bottomLarge');
    expect(second.className).toContain('contentSlot');
  });

  it('places content before the gradient for top wrappers', () => {
    const { container } = render(
      <MediaWrapper
        position={MediaWrapperPosition.TOP}
        size={MediaWrapperSize.SMALL}
      >
        <span>Caption</span>
      </MediaWrapper>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect((root.children[0] as HTMLElement).className).toContain('contentSlot');
    expect((root.children[1] as HTMLElement).className).toContain('topSmall');
  });
});
