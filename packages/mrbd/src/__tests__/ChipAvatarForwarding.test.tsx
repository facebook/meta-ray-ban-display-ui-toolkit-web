/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Chip } from '../mrbd/ui/Chip';
import {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from '../mrbd/ui/Avatar.types';

const STATUS_ICON_SRC = '/icons/status-glyph.svg';
const STATUS_ICON = { uri: STATUS_ICON_SRC };

describe('Chip forwards the avatar sub-API to the internal Avatar', () => {
  it('renders the status role dot and the status indicator glyph over the avatar', () => {
    const { container } = render(
      <Chip
        text="Amy"
        showAvatar
        avatarSrc="/avatars/test-avatar.png"
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorIcon={STATUS_ICON}
      />,
    );

    // The avatar mounts inside the chip.
    expect(container.querySelector('[role="img"]')).not.toBeNull();

    // statusIndicator forwarded -> Avatar renders its status dot with role="status".
    const statusDot = container.querySelector('[role="status"]');
    expect(statusDot).not.toBeNull();

    // statusIndicatorIcon forwarded -> glyph drawn over the dot via a masked
    // IconImage for uri sources.
    const glyph = statusDot?.querySelector('[style*="mask-image"]');
    expect(glyph).not.toBeNull();
    expect(glyph?.getAttribute('style')).toContain(STATUS_ICON_SRC);
  });

  it('forwards primaryImageShape, placeholderStyle, and secondary src through to the avatar', () => {
    const { container } = render(
      <Chip
        text="Amy"
        showAvatar
        primaryImageShape={AvatarShape.ROUNDED_RECTANGLE}
        placeholderStyle={PlaceholderStyle.IMAGE}
        avatarSecondarySrc="/avatars/secondary.png"
      />,
    );

    // placeholderStyle forwarded -> placeholder element tagged with the style.
    expect(
      container.querySelector('[data-placeholder-style="image"]'),
    ).not.toBeNull();

    // avatarSecondarySrc forwarded -> Avatar enters the duo layout and renders
    // the secondary image.
    const secondary = container.querySelector(
      'img[src="/avatars/secondary.png"]',
    );
    expect(secondary).not.toBeNull();
  });

  it('omits the avatar status indicator when no sub-API props are provided', () => {
    const { container } = render(
      <Chip text="Amy" showAvatar avatarSrc="/avatars/test-avatar.png" />,
    );

    expect(container.querySelector('[role="img"]')).not.toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});
