/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Page } from '../mrbd/ui/Page';
import type { HeaderProps } from '../mrbd/ui/Header';
import {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from '../mrbd/ui/Avatar.types';
import { TEST_ICON } from './helpers/testIcon';

const { headerSpy } = vi.hoisted(() => ({ headerSpy: vi.fn() }));

// vi.mock is hoisted above the imports, so Page binds to this spied Header even
// though the import statement appears first lexically.
vi.mock('../mrbd/ui/Header', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../mrbd/ui/Header')>();
  return {
    ...actual,
    Header: (props: HeaderProps) => {
      headerSpy(props);
      // Render the real Header so the forwarded avatar sub-API renders end-to-end.
      return <actual.Header {...props} />;
    },
  };
});

describe('Page forwards every header avatar sub-API to the internal Header', () => {
  it('passes headerStatusIndicator, headerStatusIndicatorIcon, headerPrimaryImageShape, and headerPlaceholderStyle through', () => {
    headerSpy.mockClear();
    render(
      <Page
        headerText="Amy"
        headerShowAvatar
        headerAvatarSrc="/avatars/test-avatar.png"
        headerStatusIndicator={StatusIndicatorType.WARNING}
        headerStatusIndicatorIcon={TEST_ICON}
        headerPrimaryImageShape={AvatarShape.ROUNDED_RECTANGLE}
        headerPlaceholderStyle={PlaceholderStyle.IMAGE}
      />,
    );

    expect(headerSpy).toHaveBeenCalledTimes(1);
    expect(headerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusIndicator: StatusIndicatorType.WARNING,
        statusIndicatorIcon: TEST_ICON,
        primaryImageShape: AvatarShape.ROUNDED_RECTANGLE,
        placeholderStyle: PlaceholderStyle.IMAGE,
      }),
    );
  });

  it('leaves the header avatar sub-APIs undefined when not provided', () => {
    headerSpy.mockClear();
    render(
      <Page headerText="Amy" headerShowAvatar headerAvatarSrc="/avatars/test-avatar.png" />,
    );

    expect(headerSpy).toHaveBeenCalledTimes(1);
    const props = headerSpy.mock.calls[0][0] as HeaderProps;
    expect(props.statusIndicator).toBeUndefined();
    expect(props.statusIndicatorIcon).toBeUndefined();
    expect(props.primaryImageShape).toBeUndefined();
    expect(props.placeholderStyle).toBeUndefined();
  });
});

describe('Page renders the header avatar status indicator glyph end-to-end', () => {
  it('draws the headerStatusIndicatorIcon glyph over the status dot', () => {
    const { container } = render(
      <Page
        headerText="Amy"
        headerShowAvatar
        headerAvatarSrc="/avatars/test-avatar.png"
        headerStatusIndicator={StatusIndicatorType.ACTIVE}
        headerStatusIndicatorIcon={TEST_ICON}
      />,
    );

    const statusDot = container.querySelector('[role="status"]');
    expect(statusDot).not.toBeNull();
    // Vector glyphs render inline as <svg> tinted to icon-primary.
    expect(statusDot?.querySelector('svg')).not.toBeNull();
  });
});
