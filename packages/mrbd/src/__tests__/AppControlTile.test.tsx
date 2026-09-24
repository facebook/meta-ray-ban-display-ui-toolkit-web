/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * AppControlTile tests
 *
 * Layout constants:
 * - Padding: 20px
 * - Image container size: 72px
 * - Image size: 40px
 * - Title margin start: 16px
 * - Min height: 120px, min width: 144px
 * - Avatar and app image are mutually exclusive
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppControlTile } from '../mrbd/ui/AppControlTile';
import {
  APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
  APP_CONTROL_TILE_IMAGE_SIZE,
  APP_CONTROL_TILE_MIN_HEIGHT,
  APP_CONTROL_TILE_TITLE_MARGIN_START,
} from '../mrbd/ui/private/AppControlTileMetrics';
import {
  getAppControlTileAccessibilityLabel,
  getAppControlTileRootStyle,
  hasAppControlTileTitle,
} from '../mrbd/ui/private/AppControlTileLayout';
import { createDefaultContainerMaterial } from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterial';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { StatusIndicatorType } from '../mrbd/ui/Avatar.types';
import { TEST_ICON } from './helpers/testIcon';

const APP_ICON_SRC = '/icons/test-app-icon.svg';
const STATUS_ICON_SRC = '/icons/test-status-icon.svg';

describe('AppControlTile initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<AppControlTile />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=button', () => {
    render(<AppControlTile title="App" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('AppControlTile title', () => {
  it('renders title text', () => {
    const { container } = render(<AppControlTile title="Music" />);
    expect(container.textContent).toContain('Music');
  });

  it('hides title container when no title', () => {
    const { container } = render(<AppControlTile iconSrc={APP_ICON_SRC} />);
    const titleContainer = container.querySelector('[class*="titleContainer"]');
    expect(titleContainer).toBeNull();
  });

  it('title updates on rerender', () => {
    const { container, rerender } = render(<AppControlTile title="First" />);
    expect(container.textContent).toContain('First');
    rerender(<AppControlTile title="Second" />);
    expect(container.textContent).toContain('Second');
  });

  it('empty title hides title container', () => {
    const { container } = render(<AppControlTile title="" />);
    const titleContainer = container.querySelector('[class*="titleContainer"]');
    expect(titleContainer).toBeNull();
  });
});

describe('AppControlTile app image vs avatar (mutual exclusivity)', () => {
  it('renders icon when provided', () => {
    const { container } = render(<AppControlTile iconSrc={APP_ICON_SRC} />);
    const iconContainer = container.querySelector('[class*="appIconContainer"]');
    expect(iconContainer?.querySelector(`img[src="${APP_ICON_SRC}"]`)).not.toBeNull();
  });

  it('renders custom icon content in place of the icon source', () => {
    const { container } = render(
      <AppControlTile
        iconSrc={APP_ICON_SRC}
        iconContent={<span data-testid="custom-icon">Custom</span>}
      />,
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(container.querySelector(`img[src="${APP_ICON_SRC}"]`)).toBeNull();
  });

  it('renders avatar when avatarSrc provided', () => {
    const { container } = render(
      <AppControlTile avatarSrc="/avatar.webp" avatarAlt="User" />
    );
    const avatar = container.querySelector('[role="img"]');
    expect(avatar).not.toBeNull();
  });

  it('renders avatar when avatarPrimaryContent is provided without avatarSrc', () => {
    const { container } = render(
      <AppControlTile
        iconSrc={APP_ICON_SRC}
        avatarPrimaryContent={<span data-testid="avatar-primary">A</span>}
      />
    );

    expect(screen.getByTestId('avatar-primary')).toBeInTheDocument();
    expect(container.querySelector(`img[src="${APP_ICON_SRC}"]`)).toBeNull();
  });

  it('avatar hides icon (setting an avatar hides the app image)', () => {
    const { container } = render(
      <AppControlTile iconSrc={APP_ICON_SRC} avatarSrc="/avatar.webp" />
    );
    expect(container.querySelector(`img[src="${APP_ICON_SRC}"]`)).toBeNull();
    const avatar = container.querySelector('[role="img"]');
    expect(avatar).not.toBeNull();
  });

  it('renders avatar with badge image', () => {
    const { container } = render(
      <AppControlTile
        avatarSrc="/avatar.webp"
        avatarBadgeSrc="/badge.webp"
      />
    );
    const badge = container.querySelector('[class*="badgeContent"]');
    expect(badge).not.toBeNull();
  });

  it('renders avatar badge content', () => {
    render(
      <AppControlTile
        avatarSrc="/avatar.webp"
        avatarBadgeContent={<span data-testid="avatar-badge">B</span>}
      />,
    );

    expect(screen.getByTestId('avatar-badge')).toBeInTheDocument();
  });

  it('forwards avatarStatusIndicatorIcon glyph onto the status dot', () => {
    const { container } = render(
      <AppControlTile
        avatarSrc="/avatar.webp"
        avatarStatusIndicator={StatusIndicatorType.ACTIVE}
        avatarStatusIndicatorIcon={TEST_ICON}
      />
    );
    const statusDot = container.querySelector('[role="status"]');
    expect(statusDot).not.toBeNull();
    const glyph = container.querySelector('[class*="statusIndicatorGlyph"]');
    expect(glyph).not.toBeNull();
    expect(glyph?.querySelector('svg')).not.toBeNull();
  });
});

describe('AppControlTile status icon', () => {
  it('renders custom status media in place of the static icon', () => {
    render(
      <AppControlTile
        title="App"
        statusIcon={TEST_ICON}
        statusMedia={<canvas data-testid="animated-status" />}
      />,
    );

    expect(screen.getByTestId('animated-status')).toBeInTheDocument();
    expect(document.querySelector('[class*="statusIcon"] svg')).toBeNull();
  });

  it.each([false, true, ''])('does not reserve status layout for %j media', (statusMedia) => {
    const { container } = render(
      <AppControlTile title="App" statusMedia={statusMedia} />,
    );

    expect(screen.getByText('App').className).not.toContain('titleSingleLine');
    expect(container.querySelector('[class*="statusIcon"]')).toBeNull();
  });

  it('keeps numeric status media renderable', () => {
    const { container } = render(
      <AppControlTile title="App" statusMedia={0} />,
    );

    expect(screen.getByText('App').className).toContain('titleSingleLine');
    expect(container.querySelector('[class*="statusIcon"]')).toHaveTextContent('0');
  });

  it('falls back to the static icon for empty custom media', () => {
    const { container } = render(
      <AppControlTile title="App" statusIcon={TEST_ICON} statusMedia={false} />,
    );

    expect(
      container.querySelector('[class*="statusIcon"] svg'),
    ).not.toBeNull();
  });

  it('tints a URL status icon with the inherited color', () => {
    const { container } = render(
      <AppControlTile title="App" statusIcon={{ uri: STATUS_ICON_SRC }} />
    );
    const statusIcon = container.querySelector(`[style*='mask-image: url("${STATUS_ICON_SRC}")']`);
    expect(statusIcon).not.toBeNull();
    // Observable tint: the masked glyph is filled with the inherited color.
    expect(statusIcon?.getAttribute('style') ?? '').toContain(
      'background-color: currentcolor',
    );
  });

  it('tints a vector status icon via currentColor', () => {
    const { container } = render(
      <AppControlTile title="App" statusIcon={TEST_ICON} />
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Observable tint: the inline glyph fills with the inherited color and
    // actually draws path data rather than rendering an empty element.
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.querySelector('path[d]')).not.toBeNull();
  });

  it('hides status icon when not provided', () => {
    const { container } = render(<AppControlTile title="App" />);
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('AppControlTile image container dimensions', () => {
  it('image container is 72x72px', () => {
    const { container } = render(<AppControlTile iconSrc={APP_ICON_SRC} />);
    const imgContainer = container.querySelector('[class*="appImageContainer"]');
    const style = imgContainer?.getAttribute('style') ?? '';
    expect(style).toContain(`width: ${APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE}`);
    expect(style).toContain(`height: ${APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE}`);
  });

  it('renders the app icon at 40x40px with no material container by default', () => {
    const { container } = render(<AppControlTile iconSrc={APP_ICON_SRC} />);
    const iconContainer = container.querySelector('[class*="appIconContainer"]');
    const style = iconContainer?.getAttribute('style') ?? '';
    // No resting backdrop unless a caller opts in; the icon-container material
    // is only drawn when one is explicitly provided.
    expect(container.querySelector('[class*="appIconMaterial"]')).toBeNull();
    expect(style).toContain(`width: ${APP_CONTROL_TILE_IMAGE_SIZE}`);
    expect(style).toContain(`height: ${APP_CONTROL_TILE_IMAGE_SIZE}`);
  });

  it('renders provided iconContainerMaterial in the 72px icon container', () => {
    const { container } = render(
      <AppControlTile
        iconSrc={APP_ICON_SRC}
        iconContainerMaterial={createDefaultContainerMaterial()}
      />
    );
    const iconMaterial = container.querySelector('[class*="appIconMaterial"]');
    const iconContainer = container.querySelector('[class*="appIconContainer"]');
    const style = iconContainer?.getAttribute('style') ?? '';
    const clipPath = iconMaterial?.querySelector('clipPath path');
    expect(iconMaterial).not.toBeNull();
    expect(iconMaterial?.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
    expect(clipPath).toHaveAttribute(
      'd',
      new RoundedRectangleShapeProvider(CornerRadius.FULL).getShapePath({
        width: APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
        height: APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
      }),
    );
    expect(style).toContain(`width: ${APP_CONTROL_TILE_IMAGE_SIZE}`);
    expect(style).toContain(`height: ${APP_CONTROL_TILE_IMAGE_SIZE}`);
  });

  it('supports overriding the icon material shape', () => {
    const { container } = render(
      <AppControlTile
        iconSrc={APP_ICON_SRC}
        iconContainerMaterial={createDefaultContainerMaterial()}
        iconContainerShapeProvider={
          new RoundedRectangleShapeProvider(CornerRadius.XXSMALL)
        }
      />,
    );

    expect(
      container.querySelector('[class*="appIconMaterial"] clipPath path'),
    ).toHaveAttribute(
      'd',
      new RoundedRectangleShapeProvider(CornerRadius.XXSMALL).getShapePath({
        width: APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
        height: APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
      }),
    );
  });
});

describe('AppControlTile accessibility', () => {
  it('aria-label from title', () => {
    render(<AppControlTile title="Music Player" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toBe('Music Player');
  });

  it('does not synthesize an aria-label from avatarAlt when there is no title', () => {
    // The label derives from the title only and is never synthesized from the
    // avatar, so a title-less tile has no accessible name.
    render(<AppControlTile avatarSrc="/a.webp" avatarAlt="Profile" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toBeNull();
  });
});

describe('AppControlTile click', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<AppControlTile title="Test" onClick={handleClick} />);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('AppControlTile custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <AppControlTile title="Test" className="my-act" />
    );
    expect(container.firstElementChild?.className).toContain('my-act');
  });
});

describe('AppControlTile material', () => {
  it('has background layers', () => {
    const { container } = render(<AppControlTile title="Test" />);
    expect(container.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
  });
});

describe('AppControlTile layout helpers', () => {
  it('detects title presence', () => {
    expect(hasAppControlTileTitle('Music')).toBe(true);
    expect(hasAppControlTileTitle('')).toBe(false);
    expect(hasAppControlTileTitle(undefined)).toBe(false);
  });

  it('uses title-present root padding only when title exists', () => {
    expect(getAppControlTileRootStyle(true)).toEqual({ padding: 20 });
    expect(getAppControlTileRootStyle(false)).toEqual({});
  });

  it('resolves the accessibility label from the title only (no avatar fallback)', () => {
    expect(getAppControlTileAccessibilityLabel({ title: 'Music' })).toBe('Music');
    // No avatar-derived label is synthesized; no title -> undefined.
    expect(getAppControlTileAccessibilityLabel({})).toBeUndefined();
  });

  it('applies the min height and title margin constants', () => {
    const { container } = render(<AppControlTile title="Music" iconSrc={APP_ICON_SRC} />);
    const tileStyle = container.firstElementChild?.getAttribute('style') ?? '';
    const titleContainer = container.querySelector('[class*="titleContainer"]');
    const titleStyle = titleContainer?.getAttribute('style') ?? '';
    expect(tileStyle).toContain(`min-height: ${APP_CONTROL_TILE_MIN_HEIGHT}`);
    expect(titleStyle).toContain(`margin-left: ${APP_CONTROL_TILE_TITLE_MARGIN_START}`);
  });
});

describe('AppControlTile height (minHeight behavior)', () => {
  it('uses minHeight (not a fixed height) when no height is provided', () => {
    const { container } = render(<AppControlTile title="Music" />);
    const tileStyle = container.firstElementChild?.getAttribute('style') ?? '';
    // Uses minHeight when no height is provided so content can grow.
    expect(tileStyle).toContain(`min-height: ${APP_CONTROL_TILE_MIN_HEIGHT}`);
    expect(tileStyle).not.toMatch(/(?<!min-)height:\s*120px/);
  });

  it('uses a fixed height when height is explicitly provided', () => {
    const { container } = render(<AppControlTile title="Music" height={200} />);
    const tileStyle = container.firstElementChild?.getAttribute('style') ?? '';
    expect(tileStyle).toContain('height: 200px');
    // No inline minHeight is injected when a fixed height is set.
    expect(tileStyle).not.toContain('min-height: 120px');
  });
});
