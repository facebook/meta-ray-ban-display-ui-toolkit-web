/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen } from '@testing-library/react';
import type { RefObject } from 'react';
import { describe, expect, it } from 'vitest';
import { ButtonContent } from '../mrbd/ui/private/ButtonContent';
import { IconTintColor } from '../mrbd/ui/IconTintColor';
import { TrailingTag } from '../mrbd/ui/TrailingTag';
import {
  BUTTON_MINIMUM_WIDTH,
  ICON_IMAGEVIEW_LEADING_MARGIN_WITHOUT_TEXT,
  LeadingAccessoryRenderMode,
} from '../mrbd/ui/private/ButtonLayout';

const TEST_ICON_SRC = '/icons/test-icon.svg';

const ref: RefObject<HTMLDivElement | null> = { current: null };

function renderContent(overrides = {}) {
  return render(
    <ButtonContent
      contentViewContainerRef={ref}
      contentViewRef={ref}
      contentViewContainerStyle={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
      contentViewStyle={{
        width: 'fit-content',
        height: '100%',
        minWidth: BUTTON_MINIMUM_WIDTH,
      }}
      renderMode={LeadingAccessoryRenderMode.ICON}
      icon={{ uri: TEST_ICON_SRC }}
      applyIconTinting
      showIconActiveIndicator={false}
      iconRotation={0}
      title="Reply"
      hasText
      shouldTruncate={false}
      iconLeadingMargin={ICON_IMAGEVIEW_LEADING_MARGIN_WITHOUT_TEXT}
      iconCounterScale={1}
      iconActionScale={1}
      iconActionTransition="none"
      textOpacity={1}
      {...overrides}
    />,
  );
}

describe('ButtonContent', () => {
  it('renders icon and text in the content viewport hierarchy', () => {
    const { container } = renderContent();

    const icon = container.querySelector('[class*="iconImageView"] [style*="mask-image"]');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('style')).toContain(`url("${TEST_ICON_SRC}")`);
    expect(screen.getByText('Reply')).toBeInTheDocument();
    expect(container.querySelector('[class*="contentViewContainer"]')).not.toBeNull();
    expect(container.querySelector('[class*="contentView"]')).not.toBeNull();
  });

  it('tints a currentColor icon with the resolved primary icon CSS variable', () => {
    const { container } = renderContent();
    const iconContent = container.querySelector('[class*="iconContent"]');
    const style = iconContent?.getAttribute('style') ?? '';

    // Must be the kebab-case variable that theme.css actually emits, so a
    // `currentColor` icon resolves to white instead of falling back to black.
    expect(style).toContain('color: var(--uit-color-icon-primary)');
    // Guard against the camelCase enum value leaking back into the var name.
    expect(style).not.toContain('--colorIconPrimary');
  });

  it('resolves an explicit semantic iconTintColor to its token, overriding the default tint', () => {
    const { container } = renderContent({ iconTintColor: IconTintColor.NEGATIVE });
    const iconContent = container.querySelector('[class*="iconContent"]');
    const style = iconContent?.getAttribute('style') ?? '';

    expect(style).toContain('color: var(--uit-color-persistent-negative)');
    expect(style).not.toContain('var(--uit-color-icon-primary)');
    // Only SECONDARY composites with lighten; NEGATIVE must not.
    expect(style).not.toContain('mix-blend-mode: lighten');
  });

  it('composites a SECONDARY icon tint with the lighten blend mode', () => {
    const { container } = renderContent({ iconTintColor: IconTintColor.SECONDARY });
    const iconContent = container.querySelector('[class*="iconContent"]');
    const style = iconContent?.getAttribute('style') ?? '';

    expect(style).toContain('color: var(--uit-color-icon-secondary)');
    expect(style).toContain('mix-blend-mode: lighten');
  });

  it('resolves the ACCENT tint to the colorIconAccent token', () => {
    const { container } = renderContent({ iconTintColor: IconTintColor.ACCENT });
    const style = container.querySelector('[class*="iconContent"]')?.getAttribute('style') ?? '';
    expect(style).toContain('color: var(--uit-color-icon-accent)');
    expect(style).not.toContain('mix-blend-mode: lighten');
  });

  it('does not apply a blend mode to the default PRIMARY icon tint', () => {
    const { container } = renderContent();
    const style = container.querySelector('[class*="iconContent"]')?.getAttribute('style') ?? '';
    expect(style).not.toContain('--uit-blend-mode-secondary');
  });

  it('omits icon tint color when tinting is disabled', () => {
    const { container } = renderContent({ applyIconTinting: false });
    const iconContent = container.querySelector('[class*="iconContent"]');
    const style = iconContent?.getAttribute('style') ?? '';

    expect(style).not.toContain('color:');
  });

  it('renders the active indicator as invisible instead of removing it', () => {
    const { container } = renderContent({ showIconActiveIndicator: false });
    const indicator = container.querySelector('[class*="iconIndicator"]');

    expect(indicator).not.toBeNull();
    expect(indicator?.getAttribute('style')).toContain('visibility: hidden');
  });

  it('isolates rotation from action scale transitions', () => {
    const { container } = renderContent({
      iconRotation: 90,
      animateIconRotation: true,
      iconRotationDuration: 640,
      iconActionScale: 0.8,
      iconActionTransition: 'transform 200ms ease-out',
    });
    const actionStyle = container.querySelector('[class*="iconContent"]')
      ?.getAttribute('style') ?? '';
    const rotationStyle = container.querySelector('[class*="iconRotationContent"]')
      ?.getAttribute('style') ?? '';

    expect(actionStyle).toContain('scale(0.8)');
    expect(actionStyle).toContain('transition: transform 200ms ease-out');
    expect(actionStyle).not.toContain('rotate(');
    expect(rotationStyle).toContain('rotate(90deg)');
    expect(rotationStyle).toContain('transition: transform 640ms ease-out');
  });

  it('renders avatar mode without icon content', () => {
    const { container } = renderContent({
      renderMode: LeadingAccessoryRenderMode.AVATAR,
      icon: undefined,
      avatarSrc: 'avatar.png',
      avatarAlt: 'Amy',
    });

    expect(container.querySelector('[class*="iconImageView"] [style*="mask-image"]')).toBeNull();
    expect(screen.getByLabelText('Amy')).toBeInTheDocument();
    expect(container.querySelector('[class*="avatarContent"]')).not.toBeNull();
  });

  it('resolves the BETA trailing tag to its design-system label', () => {
    renderContent({ trailingTag: TrailingTag.BETA, textOpacity: 0.5 });

    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it.each([
    ['TrailingTag.NONE', TrailingTag.NONE],
    ['undefined', undefined],
  ])('renders no trailing tag when trailingTag is %s', (_label, trailingTag) => {
    renderContent({ trailingTag });

    expect(screen.queryByText('Beta')).toBeNull();
  });

  it('does not render the BETA trailing tag without text content', () => {
    renderContent({ title: undefined, hasText: false, trailingTag: TrailingTag.BETA });

    expect(screen.queryByText('Beta')).toBeNull();
  });
});
