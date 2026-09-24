/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../mrbd/ui/Button';
import {
  PlaceholderStyle,
  StatusIndicatorType,
} from '../mrbd/ui/Avatar.types';

const STATUS_GLYPH_SRC = '/icons/status-glyph.svg';

describe('Button forwards the avatar sub-API to the internal Avatar', () => {
  it('renders the status indicator dot and glyph on the avatar', () => {
    const { container } = render(
      <Button
        avatarSrc="/avatars/test-avatar.png"
        avatarAlt="Amy"
        title="Amy"
        statusIndicator={StatusIndicatorType.WARNING}
        statusIndicatorIcon={{ uri: STATUS_GLYPH_SRC }}
        avatarBadgeSrc="/badges/test-badge.png"
        placeholderStyle={PlaceholderStyle.IMAGE}
      />,
    );

    const statusDot = container.querySelector('[role="status"]');
    expect(statusDot).not.toBeNull();

    const statusGlyph = container.querySelector('[class*="statusIndicatorGlyph"]');
    expect(statusGlyph).not.toBeNull();
    expect(statusGlyph?.querySelector('[style*="mask-image"]')?.getAttribute('style')).toContain(
      STATUS_GLYPH_SRC,
    );
  });
});
