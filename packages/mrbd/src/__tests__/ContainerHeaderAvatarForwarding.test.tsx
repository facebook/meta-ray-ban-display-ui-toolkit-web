/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContainerHeader } from '../mrbd/ui/ContainerHeader';
import {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from '../mrbd/ui/Avatar.types';

const { avatarSpy } = vi.hoisted(() => ({ avatarSpy: vi.fn() }));

// vi.mock is hoisted above the imports above, so ContainerHeader binds to this
// spied Avatar even though the import statement appears first lexically.
vi.mock('../mrbd/ui/Avatar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../mrbd/ui/Avatar')>();
  return {
    ...actual,
    Avatar: (props: Record<string, unknown>) => {
      avatarSpy(props);
      return null;
    },
  };
});

describe('ContainerHeader forwards every avatar sub-API to the internal Avatar', () => {
  it('passes statusIndicator, primaryImageShape, placeholderStyle, and badge props through', () => {
    avatarSpy.mockClear();
    render(
      <ContainerHeader
        title="Amy"
        avatarSrc="/avatars/test-avatar.png"
        statusIndicator={StatusIndicatorType.WARNING}
        primaryImageShape={AvatarShape.ROUNDED_RECTANGLE}
        placeholderStyle={PlaceholderStyle.IMAGE}
        avatarBadgeSrc="/badges/test-badge.png"
      />,
    );

    expect(avatarSpy).toHaveBeenCalledTimes(1);
    expect(avatarSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusIndicator: StatusIndicatorType.WARNING,
        primaryImageShape: AvatarShape.ROUNDED_RECTANGLE,
        placeholderStyle: PlaceholderStyle.IMAGE,
        badgeImageSrc: '/badges/test-badge.png',
      }),
    );
  });

  it('leaves the avatar sub-APIs undefined when not provided', () => {
    avatarSpy.mockClear();
    render(<ContainerHeader title="Amy" avatarSrc="/avatars/test-avatar.png" />);

    expect(avatarSpy).toHaveBeenCalledTimes(1);
    const props = avatarSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(props.statusIndicator).toBeUndefined();
    expect(props.primaryImageShape).toBeUndefined();
    expect(props.placeholderStyle).toBeUndefined();
    expect(props.badgeImageSrc).toBeUndefined();
    expect(props.badgeContent).toBeUndefined();
  });
});
