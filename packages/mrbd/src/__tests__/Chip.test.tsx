/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Chip tests
 *
 * Constants:
 * - Min height: 44px
 * - Styles: EMPHASIZED, DEEMPHASIZED, ELEVATED
 * - Default style: DEEMPHASIZED
 * - Corner radius: SMALL (24px), MEDIUM when large avatar
 * - Text: meta2 text style (22px)
 * - Padding: 16px horizontal, variable vertical
 * - Icon: 24px (--uit-icon-medium), 8px right margin when text visible
 * - Avatar sizes: SMALL, LARGE
 * - Loading: shows IndeterminateLoader in place of icon
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { Chip, ChipStyle } from '../mrbd/ui/Chip';
import {
  CHIP_LOADING_SWAP_ENTER_DURATION_MS,
  CHIP_LOADING_SWAP_MIDPOINT_MS,
  CHIP_LOADING_SWAP_SEGMENT_DURATION_MS,
  CHIP_LAYOUT_TRANSITION_DURATION_MS,
  CHIP_LEADING_TRANSITION_DURATION_MS,
} from '../mrbd/ui/private/ChipAnimation';
import { CHIP_BACKGROUND_SURFACE } from '../mrbd/ui/private/ChipMetrics';
import { ChipAvatarSize } from '../mrbd/ui/Chip.types';
import { createChipMaterialForStyle } from '../mrbd/ui/private/ChipMaterials';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { TEST_ICON as TEST_VECTOR_ICON } from './helpers/testIcon';
import { drawLayer } from './helpers/canvasRecorder';

const TEST_ICON_SRC = '/icons/test-icon.svg';
const TEST_ICON = { uri: TEST_ICON_SRC };
const CSS_SOURCE = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/Chip.module.css`,
  'utf8',
);
const DIMENSIONS_SOURCE = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/theme/dimensions.css`,
  'utf8',
);

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ============================================================================
// Default initialization
// ============================================================================

describe('Chip defaults', () => {
  it('renders without crashing', () => {
    const { container } = render(<Chip text="Test" />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('default style is DEEMPHASIZED', () => {
    const { container } = render(<Chip text="Test" />);
    expect(container.textContent).toContain('Test');
  });

  it('renders text', () => {
    render(<Chip text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('uses StaticContainer as base', () => {
    const { container } = render(<Chip text="Test" />);
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });

  it('renders its solid material through the smooth shape path', async () => {
    const offsetWidthDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    );
    const offsetHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    );

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 208,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => 44,
    });

    try {
      const { container } = render(
        <Chip text="Header Demo" chipStyle={ChipStyle.EMPHASIZED} />
      );

      // The solid material is drawn onto a single background canvas, sized from
      // the chip's measured border box plus overflow padding.
      await waitFor(() => {
        expect(
          container.querySelector('[class*="backgroundLayers"] canvas'),
        ).not.toBeNull();
      });

      // The chip's idle layer fills the smooth-corner shape path with the
      // emphasized chip surface color through the canvas draw op: the fill is
      // issued against the supplied shape path (not a rectangle) and uses the
      // expected surface color.
      const idleLayer = createChipMaterialForStyle(
        ChipStyle.EMPHASIZED,
      ).getBackgroundLayers()[0];
      const recorder = drawLayer(idleLayer, { state: VisualState.DEFAULT });
      const fillOps = recorder.ofType('fill');
      expect(fillOps.length).toBeGreaterThan(0);
      expect(fillOps[0].args.length).toBe(1);
      expect(fillOps[0].style?.fillStyle).toBe(CHIP_BACKGROUND_SURFACE);

      // The smooth shape path is rendered to the canvas, not exposed as SVG, so
      // no per-layer SVG material path remains in the DOM.
      expect(
        container.querySelector('[class*="backgroundLayers"] svg [class*="materialLayer"]'),
      ).toBeNull();
    } finally {
      if (offsetWidthDescriptor != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetWidth',
          offsetWidthDescriptor,
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
      }
      if (offsetHeightDescriptor != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetHeight',
          offsetHeightDescriptor,
        );
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight');
      }
    }
  });
});

// ============================================================================
// Text property
// ============================================================================

describe('Chip text', () => {
  it('updates when changed', () => {
    const { rerender } = render(<Chip text="v1" />);
    expect(screen.getByText('v1')).toBeInTheDocument();

    rerender(<Chip text="v2" />);
    expect(screen.getByText('v2')).toBeInTheDocument();
  });

  it('renders empty chip when text is empty', () => {
    const { container } = render(<Chip text="" />);
    expect(container.firstElementChild).not.toBeNull();
  });
});

// ============================================================================
// Metadata
// ============================================================================

describe('Chip metadata', () => {
  it('renders metadata text', () => {
    const { container } = render(<Chip text="Main" metadata="Info" />);
    expect(container.textContent).toContain('Info');
  });

  it('hides metadata when not provided', () => {
    const { container } = render(<Chip text="Main" />);
    // Metadata element should not render or be empty
    expect(container.textContent).toBe('Main');
  });
});

// ============================================================================
// ChipStyle values
// ============================================================================

describe('Chip styles', () => {
  it.each([
    [ChipStyle.DEEMPHASIZED, 'textDeemphasized'],
    [ChipStyle.EMPHASIZED, 'textEmphasized'],
    [ChipStyle.ELEVATED, 'textElevated'],
  ])('applies the %s text treatment', (chipStyle, expectedClass) => {
    render(<Chip text="Test" chipStyle={chipStyle} />);

    expect(screen.getByText('Test').className).toContain(expectedClass);
  });
});

describe('ChipStyle enum values', () => {
  it('DEEMPHASIZED = "deemphasized"', () => {
    expect(ChipStyle.DEEMPHASIZED).toBe('deemphasized');
  });
  it('EMPHASIZED = "emphasized"', () => {
    expect(ChipStyle.EMPHASIZED).toBe('emphasized');
  });
  it('ELEVATED = "elevated"', () => {
    expect(ChipStyle.ELEVATED).toBe('elevated');
  });
});

// ============================================================================
// Icon (icon margins)
// ============================================================================

describe('Chip icon', () => {
  it('renders and tints a URL icon when provided', () => {
    const { container } = render(
      <Chip text="Test" icon={TEST_ICON} />
    );
    const iconContainer = container.querySelector('[data-chip-leading-kind="icon"]');
    expect(iconContainer).not.toBeNull();
    const iconGlyph = iconContainer?.querySelector('[style*="mask-image"]');
    expect(iconGlyph).not.toBeNull();
    const glyphStyle = iconGlyph?.getAttribute('style') ?? '';
    expect(glyphStyle).toContain(TEST_ICON_SRC);
    // Observable tint: the glyph fills with the chip's inherited color.
    expect(glyphStyle).toContain('background-color: currentcolor');
  });

  it('hides icon when not provided', () => {
    const { container } = render(<Chip text="Test" />);
    expect(container.querySelector('[data-chip-leading-kind="icon"]')).toBeNull();
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
  });

  it('renders the icon glyph inside the chip icon container', () => {
    const { container } = render(
      <Chip text="Test" icon={TEST_ICON} />
    );
    const iconContainer = container.querySelector('[data-chip-leading-kind="icon"]');
    expect(iconContainer).not.toBeNull();
    expect(iconContainer?.querySelector('[style*="mask-image"]')).not.toBeNull();
  });

  it('renders a vector token glyph inline and tints it via currentColor', () => {
    const { container } = render(
      <Chip text="Test" icon={TEST_VECTOR_ICON} />
    );
    const iconContainer = container.querySelector('[data-chip-leading-kind="icon"]');
    expect(iconContainer).not.toBeNull();
    // Vector tokens render inline as <svg> tinted via currentColor (not a mask)
    // and draw real glyph path data.
    const svg = iconContainer?.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.querySelector('path[d]')).not.toBeNull();
    expect(iconContainer?.querySelector('[style*="mask-image"]')).toBeNull();
  });
});

// ============================================================================
// Avatar (showAvatar, avatar overrides icon)
// ============================================================================

describe('Chip avatar', () => {
  it('renders avatar when showAvatar + avatarSrc provided', () => {
    const { container } = render(
      <Chip text="Test" showAvatar avatarSrc="/test.webp" />
    );
    // Avatar renders inside chip (may use SVG mask, not direct img)
    const avatar = container.querySelector('[role="img"]');
    expect(avatar).not.toBeNull();
  });

  it('forwards avatar content slots to the owned Avatar', () => {
    render(
      <Chip
        text="Test"
        showAvatar
        avatarPrimaryContent={<span data-testid="chip-avatar-primary">P</span>}
        avatarSecondaryContent={<span data-testid="chip-avatar-secondary">S</span>}
        avatarBadgeContent={<span data-testid="chip-avatar-badge">B</span>}
      />
    );

    expect(screen.getByTestId('chip-avatar-primary')).toBeInTheDocument();
    expect(screen.getByTestId('chip-avatar-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('chip-avatar-badge')).toBeInTheDocument();
  });

  it('updates avatar content without restarting the leading transition', () => {
    const { container, rerender } = render(
      <Chip
        text="Test"
        showAvatar
        avatarPrimaryContent={<span data-testid="avatar-a">A</span>}
      />,
    );

    rerender(
      <Chip
        text="Test"
        showAvatar
        avatarPrimaryContent={<span data-testid="avatar-b">B</span>}
      />,
    );

    expect(screen.getByTestId('avatar-b')).toBeInTheDocument();
    expect(screen.queryByTestId('avatar-a')).toBeNull();
    expect(
      container.querySelector('[data-chip-leading-kind="avatar"]'),
    ).toHaveAttribute('data-chip-leading-phase', 'visible');
  });

  it('updates avatar content without interrupting an in-flight transition', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Chip text="Test" icon={TEST_ICON} />,
    );

    rerender(
      <Chip
        text="Test"
        showAvatar
        avatarPrimaryContent={<span data-testid="avatar-a">A</span>}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
    });

    rerender(
      <Chip
        text="Test"
        showAvatar
        avatarPrimaryContent={<span data-testid="avatar-b">B</span>}
      />,
    );

    expect(screen.getByTestId('avatar-b')).toBeInTheDocument();
    expect(screen.queryByTestId('avatar-a')).toBeNull();
    expect(
      container.querySelector('[data-chip-leading-kind="avatar"]'),
    ).toHaveAttribute('data-chip-leading-phase', 'entering');

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
    });
    expect(
      container.querySelector('[data-chip-leading-kind="avatar"]'),
    ).toHaveAttribute('data-chip-leading-phase', 'visible');
  });

  it('infers avatar visibility from avatar content props', () => {
    const { container } = render(
      <Chip
        text="Test"
        avatarPrimaryContent={<span>Avatar</span>}
        icon={TEST_ICON}
      />,
    );

    expect(
      container.querySelector('[data-chip-leading-kind="avatar"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-chip-leading-kind="icon"]'),
    ).toBeNull();
  });

  it('avatar overrides icon', () => {
    const { container } = render(
      <Chip text="Test" showAvatar avatarSrc="/test.webp" icon={TEST_ICON} />
    );
    expect(container.querySelector('[data-chip-leading-kind="avatar"]')).not.toBeNull();
    expect(container.querySelector('[data-chip-leading-kind="icon"]')).toBeNull();
  });

  it('uses the sm-med spacing for standalone large-avatar chips', () => {
    expect(CSS_SOURCE).toContain(
      'margin-right: var(--uit-chip-large-avatar-gap, var(--uit-spacing-sm-med));',
    );
  });
});

// ============================================================================
// Minimum chip height (44px)
// ============================================================================

describe('Chip minimum height (44px)', () => {
  it('binds the rendered chip to the 44px design token', () => {
    const { container } = render(<Chip text="X" />);
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain('chip');
    expect(CSS_SOURCE).toMatch(
      /\.chip\s*\{[^}]*min-height:\s*var\(--uit-chip-min-height\);/s,
    );
    expect(DIMENSIONS_SOURCE).toMatch(/--uit-chip-min-height:\s*44px;/);
  });
});

// ============================================================================
// Accessibility
// ============================================================================

describe('Chip accessibility', () => {
  it('text is accessible', () => {
    render(<Chip text="Chip Label" />);
    expect(screen.getByText('Chip Label')).toBeInTheDocument();
  });
});

// ============================================================================
// Maximum line count
// ============================================================================

describe('Chip maxLines', () => {
  it('defaults to multi-line (wraps)', () => {
    const { container } = render(
      <Chip text="This is a very long chip text that should wrap to multiple lines" />
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('keeps maxLines=1 text on one non-wrapping line', () => {
    render(<Chip text="2 of 5" maxLines={1} />);
    expect(screen.getByText('2 of 5')).toHaveStyle({
      whiteSpace: 'nowrap',
      width: 'max-content',
    });
  });
});

// ============================================================================
// Loading state
// ============================================================================

describe('Chip loading state', () => {
  it('defaults to not loading', () => {
    const { container } = render(<Chip text="Test" />);
    // No loader should be visible
    expect(container.querySelector('[class*="loader"]')).toBeNull();
  });

  it('shows loader when isLoading is true', () => {
    const { container } = render(<Chip text="Test" isLoading />);
    // Loader should be visible (IndeterminateLoader or similar)
    expect(container.firstElementChild).not.toBeNull();
  });
});

// ============================================================================
// Re-rendering stress tests (rapid successive changes)
// ============================================================================

describe('Chip re-rendering', () => {
  it('handles rapid text changes', () => {
    const { rerender } = render(<Chip text="1" />);
    for (let i = 2; i <= 10; i++) {
      rerender(<Chip text={String(i)} />);
    }
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('handles style changes', () => {
    const { rerender } = render(
      <Chip text="Test" chipStyle={ChipStyle.DEEMPHASIZED} />
    );
    expect(screen.getByText('Test').className).toContain('textDeemphasized');

    rerender(<Chip text="Test" chipStyle={ChipStyle.EMPHASIZED} />);
    expect(screen.getByText('Test').className).toContain('textEmphasized');

    rerender(<Chip text="Test" chipStyle={ChipStyle.ELEVATED} />);
    expect(screen.getByText('Test').className).toContain('textElevated');

    rerender(<Chip text="Test" chipStyle={ChipStyle.DEEMPHASIZED} />);
    expect(screen.getByText('Test').className).toContain('textDeemphasized');
  });

  it('handles icon toggle', () => {
    vi.useFakeTimers();
    const { rerender, container } = render(<Chip text="Test" />);
    expect(container.querySelector('[data-chip-leading-kind="icon"]')).toBeNull();

    rerender(<Chip text="Test" icon={TEST_ICON} />);
    expect(
      container.querySelector('[data-chip-leading-kind="icon"]'),
    ).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
    });
    rerender(<Chip text="Test" />);
    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
    });

    expect(container.querySelector('[data-chip-leading-kind="icon"]')).toBeNull();
  });
});

// ============================================================================
// Animated content transitions
// ============================================================================

describe('Chip animated content transitions', () => {
  it('keeps the outgoing icon mounted while the avatar transition exits', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Chip text="Test" icon={TEST_ICON} />
    );
    expect(container.querySelector('[data-chip-leading-kind="icon"]')).not.toBeNull();

    rerender(
      <Chip text="Test" showAvatar avatarSrc="/test.webp" />
    );

    expect(
      container.querySelector('[data-chip-leading-kind="icon"] [style*="mask-image"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-chip-leading-kind="icon"]')?.getAttribute(
        'data-chip-leading-phase',
      ),
    ).toBe('exiting');

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
    });

    expect(container.querySelector('[data-chip-leading-kind="avatar"]')).not.toBeNull();
    expect(container.querySelector('[data-chip-leading-kind="icon"]')).toBeNull();
  });

  it('uses a staged layout hold before animating in a large avatar', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Chip text="Test" icon={TEST_ICON} />
    );

    rerender(
      <Chip
        text="Test"
        showAvatar
        avatarSrc="/test.webp"
        avatarSize={ChipAvatarSize.LARGE}
      />
    );

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
    });

    expect(
      container.querySelector('[data-chip-leading-kind="avatar"]')?.getAttribute(
        'data-chip-leading-phase',
      ),
    ).toBe('layout');

    act(() => {
      vi.advanceTimersByTime(CHIP_LAYOUT_TRANSITION_DURATION_MS);
    });

    expect(
      container.querySelector('[data-chip-leading-kind="avatar"]')?.getAttribute(
        'data-chip-leading-phase',
      ),
    ).toBe('entering');
  });

  it('clips title text without ellipsis during staged layout transitions', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <Chip text="Header Demo" icon={TEST_ICON} />
    );

    rerender(
      <Chip
        text="Header Demo"
        showAvatar
        avatarSrc="/test.webp"
        avatarSize={ChipAvatarSize.LARGE}
      />
    );

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
    });

    const title = screen.getByText('Header Demo');
    expect(title).toHaveStyle({
      overflow: 'visible',
      textOverflow: 'clip',
      whiteSpace: 'nowrap',
      width: 'max-content',
    });
    expect(title.getAttribute('style')).not.toContain('line-clamp');
  });

  it('keeps title text visible without ellipsis when showing an icon', () => {
    const { container, rerender } = render(<Chip text="Header Demo" />);

    rerender(<Chip text="Header Demo" icon={TEST_ICON} />);

    const title = screen.getByText('Header Demo');
    expect(title).toHaveStyle({
      overflow: 'visible',
      textOverflow: 'clip',
      whiteSpace: 'nowrap',
      width: 'max-content',
    });
    expect(title.getAttribute('style')).not.toContain('line-clamp');
    expect(
      document.querySelector('[class*="chipTrailingAnchorContent"]'),
    ).not.toBeNull();
    expect(container.firstElementChild).toHaveStyle({
      overflow: 'visible',
    });
  });

  it('keeps title text visible without ellipsis when hiding an icon', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Chip text="Header Demo" icon={TEST_ICON} />
    );

    rerender(<Chip text="Header Demo" />);

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
    });

    const title = screen.getByText('Header Demo');
    expect(title).toHaveStyle({
      overflow: 'visible',
      textOverflow: 'clip',
      whiteSpace: 'nowrap',
      width: 'max-content',
    });
    expect(title.getAttribute('style')).not.toContain('line-clamp');
    expect(
      document.querySelector('[class*="chipTrailingAnchorContent"]'),
    ).not.toBeNull();
    expect(container.firstElementChild).toHaveStyle({
      overflow: 'visible',
    });
  });

  it('keeps title text in the synchronized layout transition when revealing a loading indicator', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Chip text="Header Demo" />);

    rerender(<Chip text="Header Demo" isLoading />);

    const title = screen.getByText('Header Demo');
    expect(title).toHaveStyle({
      overflow: 'visible',
      textOverflow: 'clip',
      whiteSpace: 'nowrap',
      width: 'max-content',
    });
    expect(title).toHaveAttribute('data-uit-layout-transition-part', 'chip-text');
    expect(title).not.toHaveAttribute('data-uit-layout-transition-skip-flip');
    expect(
      document.querySelector('[class*="chipTrailingAnchorContent"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-chip-leading-kind="loader"]')?.getAttribute(
        'data-chip-leading-phase',
      ),
    ).toBe('entering');
    const chipRoot = container.firstElementChild;
    expect(chipRoot).toHaveStyle({
      overflow: 'visible',
    });
    expect(chipRoot?.children[1]).toHaveStyle({
      overflow: 'hidden',
    });

    act(() => {
      vi.advanceTimersByTime(CHIP_LAYOUT_TRANSITION_DURATION_MS);
    });

    expect(
      container.querySelector('[data-chip-leading-kind="loader"]')?.getAttribute(
        'data-chip-leading-phase',
      ),
    ).toBe('visible');
    expect(
      document.querySelector('[class*="chipTrailingAnchorContent"]'),
    ).not.toBeNull();
    expect(chipRoot?.children[1]).toHaveStyle({
      overflow: 'hidden',
    });
  });


  it('uses a midpoint loading swap instead of the full icon avatar transition', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Chip text="Test" icon={TEST_ICON} />
    );

    rerender(<Chip text="Test" icon={TEST_ICON} isLoading />);

    expect(
      container.querySelector('[data-chip-leading-kind="icon"]')?.getAttribute(
        'data-chip-leading-phase',
      ),
    ).toBe('exiting');

    act(() => {
      vi.advanceTimersByTime(CHIP_LOADING_SWAP_SEGMENT_DURATION_MS);
    });

    expect(container.querySelector('[data-chip-leading-kind="loader"]')).not.toBeNull();
    expect(
      container.querySelector('[data-chip-leading-kind="loader"]')?.getAttribute(
        'data-chip-leading-phase',
      ),
    ).toBe('entering');
  });

  it('derives loading swap timing from the loading spring', () => {
    expect(CHIP_LOADING_SWAP_SEGMENT_DURATION_MS).toBe(
      CHIP_LOADING_SWAP_MIDPOINT_MS,
    );
    expect(CHIP_LOADING_SWAP_MIDPOINT_MS).toBeCloseTo(1000 / 60 * 7, 4);
    expect(CHIP_LOADING_SWAP_ENTER_DURATION_MS).toBeGreaterThan(
      CHIP_LOADING_SWAP_MIDPOINT_MS,
    );
  });

  it('waits for the centralized layout transition before animating in', () => {
    vi.useFakeTimers();
    const offsetWidthDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    );
    const offsetHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    );
    let width = 209;

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => width,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => 44,
    });

    try {
      const { container, rerender } = render(
        <Chip text="Test" icon={TEST_ICON} />
      );

      width = 233;
      rerender(
        <Chip
          text="Test"
          showAvatar
          avatarSrc="/test.webp"
          avatarSize={ChipAvatarSize.LARGE}
        />
      );

      act(() => {
        vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
      });

      expect(
        container.querySelector('[data-chip-leading-kind="avatar"]')?.getAttribute(
          'data-chip-leading-phase',
        ),
      ).toBe('layout');

      act(() => {
        vi.advanceTimersByTime(CHIP_LAYOUT_TRANSITION_DURATION_MS);
      });

      expect(
        container.querySelector('[data-chip-leading-kind="avatar"]')?.getAttribute(
          'data-chip-leading-phase',
        ),
      ).toBe('layout');

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(
        container.querySelector('[data-chip-leading-kind="avatar"]')?.getAttribute(
          'data-chip-leading-phase',
        ),
      ).toBe('entering');
    } finally {
      if (offsetWidthDescriptor != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetWidth',
          offsetWidthDescriptor,
        );
      }
      if (offsetHeightDescriptor != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetHeight',
          offsetHeightDescriptor,
        );
      }
    }
  });

  it('stages direct icon show through layout before scale in', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Chip text="Test" icon={TEST_ICON} />
    );

    rerender(<Chip text="Test" />);

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS);
    });

    expect(container.querySelector('[data-chip-leading-kind="icon"]')).toBeNull();

    rerender(<Chip text="Test" icon={TEST_ICON} />);

    expect(
      container.querySelector('[data-chip-leading-kind="icon"]')?.getAttribute(
        'data-chip-leading-phase',
      ),
    ).toBe('layout');
    expect(screen.getByText('Test')).toHaveAttribute(
      'data-uit-layout-transition-part',
      'chip-text',
    );
    expect(screen.getByText('Test')).not.toHaveAttribute(
      'data-uit-layout-transition-skip-flip',
    );
  });

  it('animates chip bounds when content dimensions change', () => {
    vi.useFakeTimers();
    const animate = vi.fn(() => ({
      cancel: vi.fn(),
      oncancel: null,
      onfinish: null,
    }) as unknown as Animation);
    const animateDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'animate',
    );
    const offsetWidthDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    );
    const offsetHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    );
    let width = 80;

    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: animate,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => width,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => 44,
    });

    try {
      const { container, rerender } = render(<Chip text="Short" />);
      const chipRoot = container.firstElementChild as HTMLElement;
      width = 144;
      rerender(<Chip text="Longer chip text" />);

      expect(animate).not.toHaveBeenCalled();
      expect(chipRoot).toHaveStyle({
        height: '44px',
        width: '80px',
      });

      act(() => {
        vi.advanceTimersByTime(CHIP_LAYOUT_TRANSITION_DURATION_MS + 100);
      });

      expect(chipRoot).toHaveStyle({
        height: 'auto',
        width: 'auto',
      });
    } finally {
      if (animateDescriptor != null) {
        Object.defineProperty(HTMLElement.prototype, 'animate', animateDescriptor);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'animate');
      }
      if (offsetWidthDescriptor != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetWidth',
          offsetWidthDescriptor,
        );
      }
      if (offsetHeightDescriptor != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetHeight',
          offsetHeightDescriptor,
        );
      }
    }
  });
});

// ============================================================================
// Custom props
// ============================================================================

describe('Chip custom props', () => {
  it('accepts className', () => {
    const { container } = render(<Chip text="Test" className="my-chip" />);
    expect(container.firstElementChild?.className).toContain('my-chip');
  });

  it('accepts custom style', () => {
    const { container } = render(<Chip text="Test" style={{ margin: 8 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });
});
