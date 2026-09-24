/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContainerHeader } from '../mrbd/ui/ContainerHeader';
import {
  AvatarShape,
  StatusIndicatorType,
} from '../mrbd/ui/Avatar.types';

const AVATAR_SRC = '/avatars/test-avatar.png';
const BADGE_SRC = '/badges/test-badge.png';
const STATUS_ICON_SRC = '/icons/test-status-glyph.png';

describe('ContainerHeader avatar sub-APIs', () => {
  it('forwards statusIndicator to the avatar badge as the resolved status token', () => {
    const { container } = render(
      <ContainerHeader
        title="Amy"
        avatarSrc={AVATAR_SRC}
        statusIndicator={StatusIndicatorType.NEGATIVE}
      />,
    );

    // The status dot lives inside the avatar's aria-hidden badge (the status is
    // conveyed via the avatar's combined aria-label), so query it by class
    // rather than role.
    const statusDot = container.querySelector('[class*="statusDot"]');
    expect(statusDot).not.toBeNull();
    const style = statusDot?.getAttribute('style') ?? '';
    expect(style).toContain('background-color: var(--uit-color-persistent-negative');
    expect(statusDot?.getAttribute('aria-label')).toBe('Negative Status');
  });

  it('forwards a ROUNDED_RECTANGLE primaryImageShape to the avatar clip', () => {
    const { container } = render(
      <ContainerHeader
        title="Amy"
        avatarSrc={AVATAR_SRC}
        primaryImageShape={AvatarShape.ROUNDED_RECTANGLE}
      />,
    );

    const clipped = container.querySelector('[class*="avatarClipped"]');
    const style = clipped?.getAttribute('style') ?? '';
    expect(style).toContain('clip-path: path(');
    expect(style).not.toContain('border-radius: 50%');
  });

  it('defaults the avatar to a CIRCLE clip when no primaryImageShape is forwarded', () => {
    const { container } = render(
      <ContainerHeader title="Amy" avatarSrc={AVATAR_SRC} />,
    );

    const clipped = container.querySelector('[class*="avatarClipped"]');
    const style = clipped?.getAttribute('style') ?? '';
    expect(style).toContain('border-radius: 50%');
  });

  it('forwards statusIndicatorIcon as a glyph over the status dot', () => {
    const { container } = render(
      <ContainerHeader
        title="Amy"
        avatarSrc={AVATAR_SRC}
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorIcon={STATUS_ICON_SRC}
      />,
    );

    const glyph = container.querySelector('[class*="statusIndicatorGlyph"]');
    expect(glyph).not.toBeNull();
  });

  it('forwards avatarBadgeSrc to the avatar badge image', () => {
    const { container } = render(
      <ContainerHeader
        title="Amy"
        avatarSrc={AVATAR_SRC}
        avatarBadgeSrc={BADGE_SRC}
      />,
    );

    const badgeImg = container.querySelector(`img[src="${BADGE_SRC}"]`);
    expect(badgeImg).not.toBeNull();
  });
});
