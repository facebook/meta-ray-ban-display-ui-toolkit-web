/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Avatar tests
 *
 * Key defaults:
 * - Default size: SMALL
 * - Default shape: CIRCLE
 * - Default style: STANDARD
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Avatar,
  AvatarSize,
  AvatarShape,
  AvatarStyle,
  StatusIndicatorType,
} from '../mrbd/ui/Avatar';

// ============================================================================
// Enum Tests
// ============================================================================

describe('AvatarSize enum', () => {
  it('has 8 entries', () => {
    expect(Object.keys(AvatarSize)).toHaveLength(8);
  });

  it('has Size members XXSMALL through XXXLARGE', () => {
    expect(AvatarSize.XXSMALL).toBe('xxsmall');
    expect(AvatarSize.XSMALL).toBe('xsmall');
    expect(AvatarSize.SMALL).toBe('small');
    expect(AvatarSize.MEDIUM).toBe('medium');
    expect(AvatarSize.LARGE).toBe('large');
    expect(AvatarSize.XLARGE).toBe('xlarge');
    expect(AvatarSize.XXLARGE).toBe('xxlarge');
    expect(AvatarSize.XXXLARGE).toBe('xxxlarge');
  });
});

describe('AvatarShape enum', () => {
  it('has CIRCLE and ROUNDED_RECTANGLE', () => {
    expect(AvatarShape.CIRCLE).toBe('circle');
    expect(AvatarShape.ROUNDED_RECTANGLE).toBe('roundedRectangle');
  });
});

describe('AvatarStyle enum', () => {
  it('has STANDARD, SURFACE, TRANSPARENT, TRANSLUCENT', () => {
    expect(AvatarStyle.STANDARD).toBe('standard');
    expect(AvatarStyle.SURFACE).toBe('surface');
    expect(AvatarStyle.TRANSPARENT).toBe('transparent');
    expect(AvatarStyle.TRANSLUCENT).toBe('translucent');
  });
});

describe('StatusIndicatorType enum', () => {
  it('has all 8 types', () => {
    expect(StatusIndicatorType.ACTIVE).toBe('active');
    expect(StatusIndicatorType.INACTIVE).toBe('inactive');
    expect(StatusIndicatorType.NOTIFICATION).toBe('notification');
    expect(StatusIndicatorType.UNREAD).toBe('unread');
    expect(StatusIndicatorType.POSITIVE).toBe('positive');
    expect(StatusIndicatorType.NEGATIVE).toBe('negative');
    expect(StatusIndicatorType.WARNING).toBe('warning');
    expect(StatusIndicatorType.CAUTION).toBe('caution');
  });
});

// ============================================================================
// Size Tests
// ============================================================================

describe('Avatar default size', () => {
  it('defaults to SMALL (56px)', () => {
    const { container } = render(<Avatar alt="Test" />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 56');
    expect(style).toContain('height: 56');
  });
});

describe('Avatar sizes match the dimension constants', () => {
  const SIZE_MAP: Record<string, number> = {
    [AvatarSize.XXSMALL]: 36,
    [AvatarSize.XSMALL]: 48,
    [AvatarSize.SMALL]: 56,
    [AvatarSize.MEDIUM]: 64,
    [AvatarSize.LARGE]: 72,
    [AvatarSize.XLARGE]: 88,
    [AvatarSize.XXLARGE]: 104,
    [AvatarSize.XXXLARGE]: 200,
  };

  for (const [size, px] of Object.entries(SIZE_MAP)) {
    it(`${size} = ${px}px`, () => {
      const { container } = render(
        <Avatar alt="Test" size={size as AvatarSize} />
      );
      const style = container.firstElementChild?.getAttribute('style') ?? '';
      expect(style).toContain(`width: ${px}`);
      expect(style).toContain(`height: ${px}`);
    });
  }
});

// ============================================================================
// Rendering Tests
// ============================================================================

describe('Avatar rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<Avatar alt="Test" />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=img', () => {
    render(<Avatar alt="Test" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    const { container } = render(<Avatar src="/test.webp" alt="Test" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/test.webp');
  });

  it('renders primary React content before image content', () => {
    const { container } = render(
      <Avatar
        src="/ignored.webp"
        alt="Custom"
        primaryContent={<span data-testid="primary-content">Primary content</span>}
      />,
    );

    expect(screen.getByTestId('primary-content')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(
      screen.getByTestId('primary-content').closest('[class*="avatarContent"]'),
    ).not.toBeNull();
  });

  it('renders empty placeholder surface when no src and no icon is provided', () => {
    const { container } = render(<Avatar alt="John" />);
    const placeholder = container.querySelector('[class*="avatarPlaceholder"]');
    expect(placeholder).not.toBeNull();
    expect(placeholder?.innerHTML).toBe('');
  });

  it('renders caller-provided placeholder icon', () => {
    const { container } = render(
      <Avatar alt="alice" placeholderIcon={{ uri: '/icons/placeholder.svg' }} />,
    );
    const placeholder = container.querySelector('[class*="avatarPlaceholder"]');
    expect(placeholder).not.toBeNull();
    const icon = placeholder?.querySelector('[style*="mask-image"]');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('style')).toContain('/icons/placeholder.svg');
  });

  it('removes placeholder icon when placeholderIcon is cleared', () => {
    const { container, rerender } = render(
      <Avatar alt="alice" placeholderIcon={{ uri: '/icons/placeholder.svg' }} />,
    );
    expect(
      container.querySelector('[class*="avatarPlaceholder"] [style*="mask-image"]'),
    ).not.toBeNull();

    rerender(<Avatar alt="alice" />);
    expect(
      container.querySelector('[class*="avatarPlaceholder"] [style*="mask-image"]'),
    ).toBeNull();
  });
});

// ============================================================================
// Accessibility
// ============================================================================

describe('Avatar accessibility', () => {
  it('defaults to the default avatar title when no alt is provided', () => {
    render(<Avatar />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Profile Picture');
  });

  it('aria-label includes alt text', () => {
    render(<Avatar alt="Profile Picture" />);
    const avatar = screen.getByRole('img');
    expect(avatar.getAttribute('aria-label')).toContain('Profile Picture');
  });

  it('aria-label includes status indicator description', () => {
    render(
      <Avatar alt="Profile Picture" statusIndicator={StatusIndicatorType.ACTIVE} />
    );
    const avatar = screen.getByRole('img');
    const label = avatar.getAttribute('aria-label') ?? '';
    expect(label).toContain('Profile Picture');
    expect(label).toContain('Active Status');
  });

  it('aria-label without status indicator is just alt text', () => {
    render(<Avatar alt="Test" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Test');
  });

  it('aria-label uses statusIndicatorLabels override when provided', () => {
    render(
      <Avatar
        alt="Profile Picture"
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: 'En ligne' }}
      />,
    );
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'Profile Picture, En ligne',
    );
  });

  it('aria-label falls back to the default label for omitted status overrides', () => {
    render(
      <Avatar
        alt="Profile Picture"
        statusIndicator={StatusIndicatorType.INACTIVE}
        statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: 'En ligne' }}
      />,
    );
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'Profile Picture, Inactive Status',
    );
  });
});

// ============================================================================
// Status Indicator
// ============================================================================

describe('Avatar status indicator', () => {
  it('shows status dot when statusIndicator is set', () => {
    const { container } = render(
      <Avatar alt="Test" statusIndicator={StatusIndicatorType.ACTIVE} />
    );
    const statusDot = container.querySelector('[role="status"]');
    expect(statusDot).not.toBeNull();
  });

  it('hides status dot when statusIndicator is not set', () => {
    const { container } = render(<Avatar alt="Test" />);
    const statusDot = container.querySelector('[role="status"]');
    expect(statusDot).toBeNull();
  });

  it('status dot has correct accessibility label', () => {
    const { container } = render(
      <Avatar alt="Test" statusIndicator={StatusIndicatorType.ACTIVE} />
    );
    const statusDot = container.querySelector('[role="status"]');
    expect(statusDot?.getAttribute('aria-label')).toBe('Active Status');
  });

  it('status dot uses statusIndicatorLabels override for its accessibility label', () => {
    const { container } = render(
      <Avatar
        alt="Test"
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: 'En ligne' }}
      />
    );
    const statusDot = container.querySelector('[role="status"]');
    expect(statusDot?.getAttribute('aria-label')).toBe('En ligne');
  });

  it('status indicator takes priority over badge image and badge content', () => {
    const { container } = render(
      <Avatar
        alt="Test"
        statusIndicator={StatusIndicatorType.ACTIVE}
        badgeImageSrc="/badge.png"
        badgeContent={<span data-testid="badge-content">Badge content</span>}
      />
    );
    const statusDot = container.querySelector('[role="status"]');
    expect(statusDot).not.toBeNull();
    expect(screen.queryByTestId('badge-content')).toBeNull();
    expect(container.querySelector('img[src="/badge.png"]')).toBeNull();
  });
});

// ============================================================================
// Badge Image
// ============================================================================

describe('Avatar badge image', () => {
  it('shows badge when badgeImage is provided', () => {
    const { container } = render(
      <Avatar alt="Test" badgeImageSrc="/badge.png" />
    );
    const badgeImg = container.querySelector('[class*="badgeContent"]');
    expect(badgeImg).not.toBeNull();
    expect(badgeImg?.querySelector('img[src="/badge.png"]')).not.toBeNull();
  });

  it('renders badge React content before badge image content', () => {
    const { container } = render(
      <Avatar
        alt="Test"
        badgeImageSrc="/ignored-badge.png"
        badgeContent={<span data-testid="badge-content">Badge content</span>}
      />
    );

    expect(screen.getByTestId('badge-content')).toBeInTheDocument();
    expect(container.querySelector('img[src="/ignored-badge.png"]')).toBeNull();
    expect(
      screen.getByTestId('badge-content').closest('[class*="badgeContent"]'),
    ).not.toBeNull();
  });

  it('hides badge when no badgeImage', () => {
    const { container } = render(<Avatar alt="Test" />);
    const badge = container.querySelector('[class*="badgeContainer"]');
    expect(badge).toBeNull();
  });
});

// ============================================================================
// Shape
// ============================================================================

describe('Avatar shape', () => {
  it('defaults to CIRCLE (clips the avatar area with a circular border-radius)', () => {
    const { container } = render(<Avatar alt="Test" />);
    const clipped = container.querySelector('[class*="avatarClipped"]');

    expect(clipped?.getAttribute('style')).toContain('border-radius: 50%');
  });

  it('ROUNDED_RECTANGLE clips with a smooth (cubic) CSS clip-path', () => {
    const { container } = render(
      <Avatar alt="Test" primaryImageShape={AvatarShape.ROUNDED_RECTANGLE} />
    );
    const style = container
      .querySelector('[class*="avatarClipped"]')
      ?.getAttribute('style') ?? '';

    expect(style).toContain('clip-path: path(');
    // 'C' = cubic-bezier segments, i.e. smooth (squircle) corners.
    expect(style).toContain('C');
  });

  it('subtracts the badge cutout with a centered radial-gradient mask', () => {
    const { container } = render(
      <Avatar alt="Test" statusIndicator={StatusIndicatorType.ACTIVE} />
    );
    const style = container
      .querySelector('[class*="avatarClipped"]')
      ?.getAttribute('style') ?? '';

    expect(style).toContain('mask-image: radial-gradient');
    // Cutout centered on the bottom-right badge (cx/cy = 48px for a 56px avatar).
    expect(style).toContain('48px 48px');
  });
});

// ============================================================================
// Style
// ============================================================================

describe('Avatar style', () => {
  it('defaults to STANDARD', () => {
    const { container } = render(<Avatar alt="Test" />);
    const clipped = container.querySelector('[class*="standard"]');
    expect(clipped).not.toBeNull();
  });

  it('SURFACE style applies different class', () => {
    const { container } = render(
      <Avatar alt="Test" avatarStyle={AvatarStyle.SURFACE} />
    );
    const clipped = container.querySelector('[class*="surface"]');
    expect(clipped).not.toBeNull();
  });

  it('TRANSPARENT style applies different class', () => {
    const { container } = render(
      <Avatar alt="Test" avatarStyle={AvatarStyle.TRANSPARENT} />
    );
    const clipped = container.querySelector('[class*="transparent"]');
    expect(clipped).not.toBeNull();
  });

  it('TRANSLUCENT style applies different class', () => {
    const { container } = render(
      <Avatar alt="Test" avatarStyle={AvatarStyle.TRANSLUCENT} />
    );
    const clipped = container.querySelector('[class*="translucent"]');
    expect(clipped).not.toBeNull();
  });
});

// ============================================================================
// Duo Layout
// ============================================================================

describe('Avatar duo layout', () => {
  it('renders duo layout for a secondary image and renders that image', () => {
    const { container } = render(
      <Avatar alt="Test" src="/primary.webp" secondarySrc="/secondary.webp" />
    );

    const duoLayers = container.querySelectorAll('[class*="duoClipLayer"]');
    expect(duoLayers.length).toBeGreaterThan(0);
    expect(container.querySelector('img[src="/secondary.webp"]')).not.toBeNull();
  });

  it('does not render duo layout when no secondarySrc', () => {
    const { container } = render(<Avatar alt="Test" src="/primary.webp" />);
    const duoLayers = container.querySelectorAll('[class*="duoClipLayer"]');
    expect(duoLayers.length).toBe(0);
  });

  it('renders duo layout for secondary custom content and mounts that content', () => {
    const { container } = render(
      <Avatar
        alt="Test"
        primaryContent={<span>Primary content</span>}
        secondaryContent={<span data-testid="secondary-content">Secondary content</span>}
      />
    );

    expect(screen.getByTestId('secondary-content')).toBeInTheDocument();
    expect(container.querySelectorAll('[class*="duoClipLayer"]').length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Stroke
// ============================================================================

describe('Avatar stroke', () => {
  it('shows stroke overlay when showStroke=true', () => {
    const { container } = render(<Avatar alt="Test" showStroke />);
    const stroke = container.querySelector('[class*="strokeOverlay"]');
    expect(stroke).not.toBeNull();
  });

  it('hides stroke overlay by default', () => {
    const { container } = render(<Avatar alt="Test" />);
    const stroke = container.querySelector('[class*="strokeOverlay"]');
    expect(stroke).toBeNull();
  });
});

// ============================================================================
// Clip Path
// ============================================================================

describe('Avatar clip path', () => {
  it('renders hidden SVG masks for duo (path-difference) clipping', () => {
    const { container } = render(
      <Avatar alt="Test" src="/primary.webp" secondarySrc="/secondary.webp" />
    );

    expect(
      container.querySelector('svg[class*="clipSvg"] mask[id$="-avatar-duo-primary-mask"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('svg[class*="clipSvg"] mask[id$="-avatar-duo-secondary-mask"]'),
    ).not.toBeNull();
  });

  it('uses the avatar mask on the visible area', () => {
    const { container } = render(
      <Avatar alt="Test" statusIndicator={StatusIndicatorType.ACTIVE} />
    );
    const clipped = container.querySelector('[class*="avatarClipped"]');

    expect(clipped?.getAttribute('style')).toContain('mask-image: radial-gradient');
    expect(clipped?.getAttribute('style')).toContain('-webkit-mask-image: radial-gradient');
  });

  it('does not simulate the badge cutout with a black overlay element', () => {
    const { container } = render(
      <Avatar alt="Test" statusIndicator={StatusIndicatorType.ACTIVE} />
    );

    expect(container.querySelector('[class*="badgeCutoutFill"]')).toBeNull();
  });

  it('expands the duo mask region so bottom-right badge cutouts can extend past avatar bounds', () => {
    const { container } = render(
      <Avatar
        alt="Test"
        src="/primary.webp"
        secondarySrc="/secondary.webp"
        statusIndicator={StatusIndicatorType.ACTIVE}
      />
    );
    const mask = container.querySelector('mask[id$="-avatar-duo-primary-mask"]');

    expect(mask?.getAttribute('x')).toBe('-12');
    expect(mask?.getAttribute('y')).toBe('-12');
    expect(mask?.getAttribute('width')).toBe('80');
    expect(mask?.getAttribute('height')).toBe('80');
  });

  it('does not apply a badge cutout mask when no badge/status exists', () => {
    const { container } = render(<Avatar alt="Test" />);
    const style = container
      .querySelector('[class*="avatarClipped"]')
      ?.getAttribute('style') ?? '';

    expect(style).not.toContain('radial-gradient');
  });
});

// ============================================================================
// Re-rendering
// ============================================================================

describe('Avatar re-rendering', () => {
  it('updates when size changes', () => {
    const { container, rerender } = render(
      <Avatar alt="Test" size={AvatarSize.SMALL} />
    );
    expect(container.firstElementChild?.getAttribute('style')).toContain('width: 56');

    rerender(<Avatar alt="Test" size={AvatarSize.XXLARGE} />);
    expect(container.firstElementChild?.getAttribute('style')).toContain('width: 104');
  });

  it('updates when status indicator changes', () => {
    const { container, rerender } = render(<Avatar alt="Test" />);
    expect(container.querySelector('[role="status"]')).toBeNull();

    rerender(<Avatar alt="Test" statusIndicator={StatusIndicatorType.ACTIVE} />);
    expect(container.querySelector('[role="status"]')).not.toBeNull();

    rerender(<Avatar alt="Test" />);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('updates when src changes', () => {
    const { container, rerender } = render(<Avatar src="/img1.webp" alt="Test" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/img1.webp');

    rerender(<Avatar src="/img2.webp" alt="Test" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/img2.webp');
  });
});

// ============================================================================
// Custom Props
// ============================================================================

describe('Avatar custom props', () => {
  it('accepts className', () => {
    const { container } = render(<Avatar alt="Test" className="my-avatar" />);
    expect(container.firstElementChild?.className).toContain('my-avatar');
  });

  it('accepts custom style', () => {
    const { container } = render(<Avatar alt="Test" style={{ margin: 8 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });
});
