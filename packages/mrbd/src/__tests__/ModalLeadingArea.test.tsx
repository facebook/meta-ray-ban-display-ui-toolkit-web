/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalBannerSize } from '../mrbd/ui/Modal';
import { ModalLeadingArea } from '../mrbd/ui/private/ModalLeadingArea';
import { createModalBannerMaterial } from '../mrbd/ui/private/ModalMaterials';

function baseProps() {
  return {
    hasIcon: false,
    hasBanner: false,
    bannerAlt: 'Banner image',
    bannerSize: ModalBannerSize.STANDARD,
    bannerMaterial: createModalBannerMaterial(),
    showBannerTag: false,
    bannerTagText: null,
    hasLogo: false,
    logoAlt: 'Logo',
    hasAvatar: false,
    avatarAlt: 'Avatar',
  };
}

describe('ModalLeadingArea', () => {
  it('renders icon leading content first in the priority order', () => {
    const { container } = render(
      <ModalLeadingArea
        {...baseProps()}
        hasIcon
        icon="/icons/test-icon.svg"
        hasBanner
        bannerSrc="/banner.jpg"
      />,
    );

    expect(
      container.querySelector('[style*="mask-image"]'),
    ).not.toBeNull();
    expect(container.querySelector('[class*="bannerContainer"]')).toBeNull();
  });

  it('renders banner content with optional tag scrim', () => {
    const { container } = render(
      <ModalLeadingArea
        {...baseProps()}
        hasBanner
        bannerSrc="/banner.jpg"
        showBannerTag
        bannerTagText="Beta"
      />,
    );

    expect(container.querySelector('[class*="bannerContainer"]')).not.toBeNull();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders avatar leading content when requested', () => {
    const { container } = render(
      <ModalLeadingArea
        {...baseProps()}
        hasAvatar
        avatarSrc="/profile.webp"
        avatarAlt="Profile"
      />,
    );

    const avatar = container.querySelector('[role="img"][aria-label="Profile"]');
    expect(avatar).not.toBeNull();
  });
});
