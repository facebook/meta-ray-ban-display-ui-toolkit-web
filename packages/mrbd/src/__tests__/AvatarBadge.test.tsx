/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { StatusIndicatorType } from '../mrbd/ui/Avatar';
import { AvatarBadge } from '../mrbd/ui/private/AvatarBadge';

describe('AvatarBadge', () => {
  it('renders nothing when no badge should be shown', () => {
    const { container } = render(
      <AvatarBadge showBadge={false} badgeSize={28} badgeInset={0} />,
    );

    expect(container.firstElementChild).toBeNull();
  });

  it('renders status indicators with the default label mapping', () => {
    const { container } = render(
      <AvatarBadge
        showBadge
        badgeSize={28}
        badgeInset={0}
        statusIndicator={StatusIndicatorType.ACTIVE}
      />,
    );

    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.getAttribute('aria-label')).toBe('Active Status');
  });

  it('renders custom badge images when no status indicator is present', () => {
    const { container } = render(
      <AvatarBadge
        showBadge
        badgeSize={28}
        badgeInset={0}
        badgeImageSrc="/icons/badge.svg"
      />,
    );

    expect(
      container.querySelector('img[src="/icons/badge.svg"]'),
    ).toBeTruthy();
  });

  it('renders badge content before badge images when no status indicator is present', () => {
    const { container } = render(
      <AvatarBadge
        showBadge
        badgeSize={28}
        badgeInset={0}
        badgeContent={<span data-testid="badge-content">Badge content</span>}
        badgeImageSrc="/icons/badge.svg"
      />,
    );

    expect(container.querySelector('[data-testid="badge-content"]')).not.toBeNull();
    expect(container.querySelector('img[src="/icons/badge.svg"]')).toBeNull();
    expect(
      container.querySelector('[data-testid="badge-content"]')?.closest('[class*="badgeContent"]'),
    ).not.toBeNull();
  });

  it('renders the status indicator glyph inset inside the dot (28px -> 16px)', () => {
    const { container } = render(
      <AvatarBadge
        showBadge
        badgeSize={28}
        badgeInset={0}
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorIcon="/icons/glyph.svg"
      />,
    );

    const glyphWrapper = container.querySelector(
      '[class*="statusIndicatorGlyph"]',
    );
    expect(glyphWrapper).not.toBeNull();
    // The glyph lives inside the status dot, not the image-badge path.
    expect(glyphWrapper?.closest('[role="status"]')).not.toBeNull();
    // 28px dot -> inset floor(28*3/14)=6 -> glyph 28-12=16px.
    const glyph = glyphWrapper?.firstElementChild as HTMLElement;
    expect(glyph.style.width).toBe('16px');
    expect(glyph.style.height).toBe('16px');
  });

  it('scales the glyph inset for a smaller dot (16px -> 10px)', () => {
    const { container } = render(
      <AvatarBadge
        showBadge
        badgeSize={16}
        badgeInset={0}
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorIcon="/icons/glyph.svg"
      />,
    );

    // 16px dot -> inset floor(16*3/14)=3 -> glyph 16-6=10px.
    const glyph = container
      .querySelector('[class*="statusIndicatorGlyph"]')
      ?.firstElementChild as HTMLElement;
    expect(glyph.style.width).toBe('10px');
  });

  it('does not render a status glyph without a status indicator', () => {
    const { container } = render(
      <AvatarBadge
        showBadge
        badgeSize={28}
        badgeInset={0}
        badgeImageSrc="/icons/badge.svg"
        statusIndicatorIcon="/icons/glyph.svg"
      />,
    );

    expect(
      container.querySelector('[class*="statusIndicatorGlyph"]'),
    ).toBeNull();
  });

  it('uses the status indicator path before badge content', () => {
    const { container } = render(
      <AvatarBadge
        showBadge
        badgeSize={28}
        badgeInset={0}
        statusIndicator={StatusIndicatorType.ACTIVE}
        badgeContent={<span data-testid="badge-content">Badge content</span>}
      />,
    );

    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="badge-content"]')).toBeNull();
  });
});
