/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '../mrbd/ui/Header';
import {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from '../mrbd/ui/Avatar.types';
import { TEST_ICON } from './helpers/testIcon';

const { chipSpy } = vi.hoisted(() => ({ chipSpy: vi.fn() }));

// vi.mock is hoisted above the imports, so Header binds to this spied Chip even
// though the import statement appears first lexically.
vi.mock('../mrbd/ui/Chip', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../mrbd/ui/Chip')>();
  return {
    ...actual,
    Chip: (props: Record<string, unknown>) => {
      chipSpy(props);
      return null;
    },
  };
});

describe('Header forwards every avatar sub-API to the internal Chip', () => {
  it('passes statusIndicator, statusIndicatorIcon, primaryImageShape, and placeholderStyle through', () => {
    chipSpy.mockClear();
    render(
      <Header
        text="Amy"
        showAvatar
        avatarSrc="/avatars/test-avatar.png"
        statusIndicator={StatusIndicatorType.WARNING}
        statusIndicatorIcon={TEST_ICON}
        primaryImageShape={AvatarShape.ROUNDED_RECTANGLE}
        placeholderStyle={PlaceholderStyle.IMAGE}
      />,
    );

    expect(chipSpy).toHaveBeenCalledTimes(1);
    expect(chipSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusIndicator: StatusIndicatorType.WARNING,
        statusIndicatorIcon: TEST_ICON,
        primaryImageShape: AvatarShape.ROUNDED_RECTANGLE,
        placeholderStyle: PlaceholderStyle.IMAGE,
      }),
    );
  });

  it('leaves the avatar sub-APIs undefined when not provided', () => {
    chipSpy.mockClear();
    render(<Header text="Amy" showAvatar avatarSrc="/avatars/test-avatar.png" />);

    expect(chipSpy).toHaveBeenCalledTimes(1);
    const props = chipSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(props.statusIndicator).toBeUndefined();
    expect(props.statusIndicatorIcon).toBeUndefined();
    expect(props.primaryImageShape).toBeUndefined();
    expect(props.placeholderStyle).toBeUndefined();
  });

  it('passes a provided avatarAlt through to the Chip', () => {
    chipSpy.mockClear();
    render(
      <Header
        text="Amy"
        showAvatar
        avatarSrc="/avatars/test-avatar.png"
        avatarAlt="Amy's profile"
      />,
    );

    expect(chipSpy).toHaveBeenCalledTimes(1);
    expect(chipSpy).toHaveBeenCalledWith(
      expect.objectContaining({ avatarAlt: "Amy's profile" }),
    );
  });

  it('leaves avatarAlt undefined when not provided (no hardcoded default)', () => {
    chipSpy.mockClear();
    render(<Header text="Amy" showAvatar avatarSrc="/avatars/test-avatar.png" />);

    expect(chipSpy).toHaveBeenCalledTimes(1);
    const props = chipSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(props.avatarAlt).toBeUndefined();
  });
});
