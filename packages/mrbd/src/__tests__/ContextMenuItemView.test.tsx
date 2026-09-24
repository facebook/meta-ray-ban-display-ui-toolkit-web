/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContextMenuItemView tests
 *
 * Constants:
 * - Min size: 56px (CONTEXT_MENU_ITEM_SIZE)
 * - Material: the default material
 * - Corner radius: LARGE (pill)
 * - State: DEFAULT initially
 * - hideGlowForStates: [DEFAULT]
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ButtonContextMenuItemView,
  ContextMenuItemView,
  EmojiContextMenuItemView,
} from '../mrbd/ui/ContextMenuItemView';
import { TEST_ICON } from './helpers/testIcon';

// ============================================================================
// Dimension Tests (minimum width/height of 56px)
// ============================================================================

describe('ContextMenuItemView dimensions (56px minimum)', () => {
  it('has minimum width of 56px', () => {
    const { container } = render(<ContextMenuItemView />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('min-width: 56');
  });

  it('has minimum height of 56px', () => {
    const { container } = render(<ContextMenuItemView />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('min-height: 56');
  });

  it('minimum size enforced with no explicit dimensions', () => {
    const { container } = render(<ContextMenuItemView />);
    const el = container.firstElementChild;
    expect(el).not.toBeNull();
    const style = el?.getAttribute('style') ?? '';
    expect(style).toContain('min-width: 56');
    expect(style).toContain('min-height: 56');
  });

  it('larger explicit dimensions override minimum', () => {
    const { container } = render(
      <ContextMenuItemView style={{ width: 200, height: 200 }} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 200');
    expect(style).toContain('height: 200');
  });
});

// ============================================================================
// Material Configuration (material initialization, mutability)
// ============================================================================

describe('ContextMenuItemView material', () => {
  it('is initialized with material', () => {
    const { container } = render(<ContextMenuItemView />);
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });

  it('uses default material', () => {
    const { container } = render(<ContextMenuItemView />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('applies background layers', () => {
    const { container } = render(<ContextMenuItemView />);
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });

  it('applies foreground layers', () => {
    const { container } = render(<ContextMenuItemView />);
    const fgLayers = container.querySelector('[class*="foregroundLayers"]');
    expect(fgLayers).not.toBeNull();
  });

  it('multiple instances have independent materials', () => {
    const { container: c1 } = render(<ContextMenuItemView />);
    const { container: c2 } = render(<ContextMenuItemView />);
    const bg1 = c1.querySelector('[class*="backgroundLayers"]');
    const bg2 = c2.querySelector('[class*="backgroundLayers"]');
    expect(bg1).not.toBeNull();
    expect(bg2).not.toBeNull();
    expect(bg1).not.toBe(bg2);
  });
});

// ============================================================================
// Child View Tests (adding child views)
// ============================================================================

describe('ContextMenuItemView children', () => {
  it('renders children when provided', () => {
    render(
      <ContextMenuItemView>
        <span data-testid="emoji">😊</span>
      </ContextMenuItemView>
    );
    expect(screen.getByTestId('emoji')).toBeInTheDocument();
    expect(screen.getByTestId('emoji').textContent).toBe('😊');
  });

  it('renders as child of parent container', () => {
    render(
      <div data-testid="parent">
        <ContextMenuItemView label="Test" />
      </div>
    );
    const parent = screen.getByTestId('parent');
    expect(parent.children.length).toBe(1);
  });

  it('renders icon convenience prop from a token', () => {
    const { container } = render(<ContextMenuItemView icon={TEST_ICON} />);
    const slot = container.querySelector('[class*="itemIcon"]');
    expect(slot).not.toBeNull();
    expect(slot?.querySelector('svg')).toBeTruthy();
  });

  it('renders icon convenience prop from a URL source', () => {
    const { container } = render(
      <ContextMenuItemView icon={{ uri: '/icons/menu-icon.svg' }} />
    );
    const icon = container.querySelector('[style*="mask-image"]');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('style')).toContain('/icons/menu-icon.svg');
  });

  it('renders label convenience prop', () => {
    const { container } = render(<ContextMenuItemView label="Favorite" />);
    expect(container.textContent).toContain('Favorite');
  });

  it('renders icon + label together', () => {
    const { container } = render(
      <ContextMenuItemView icon={TEST_ICON} label="Share" />
    );
    const slot = container.querySelector('[class*="itemIcon"]');
    expect(slot?.querySelector('svg')).toBeTruthy();
    expect(container.textContent).toContain('Share');
  });

  it('children override icon/label', () => {
    render(
      <ContextMenuItemView icon={TEST_ICON} label="Ignored">
        <div data-testid="custom">Custom Content</div>
      </ContextMenuItemView>
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });
});

// ============================================================================
// Item subclasses
// ============================================================================

describe('ButtonContextMenuItemView', () => {
  it('renders icon and title horizontally', () => {
    const { container } = render(
      <ButtonContextMenuItemView icon={TEST_ICON} title="Favorite" />
    );

    const icon = container.querySelector('[class*="buttonItemIcon"]');
    expect(icon).toBeTruthy();
    expect(icon?.querySelector('svg')).toBeTruthy();
    expect(container.textContent).toContain('Favorite');
    expect(screen.getByRole('menuitem').getAttribute('aria-label')).toBe('Favorite');
  });

  it('supports icon-only action items', () => {
    const { container } = render(
      <ButtonContextMenuItemView icon={TEST_ICON} ariaLabel="Star" />
    );

    const icon = container.querySelector('[class*="buttonItemIcon"]');
    expect(icon?.querySelector('svg')).toBeTruthy();
    expect(screen.getByRole('menuitem').getAttribute('aria-label')).toBe('Star');
  });
});

describe('EmojiContextMenuItemView', () => {
  it('renders emoji menu items', () => {
    render(<EmojiContextMenuItemView emoji="🔥" />);

    expect(screen.getByRole('menuitem').textContent).toBe('🔥');
    expect(screen.getByRole('menuitem').getAttribute('aria-label')).toBe('🔥');
  });

  it('renders selected dot when selected', () => {
    const { container } = render(<EmojiContextMenuItemView emoji="😊" isEmojiSelected />);

    expect(container.querySelector('[class*="selectionDot"]')).not.toBeNull();
  });

  it('wraps emoji content in a centered slot', () => {
    const { container } = render(<EmojiContextMenuItemView emoji="😊" isEmojiSelected />);

    const slot = container.querySelector('[class*="emojiItemContent"]');
    expect(slot).not.toBeNull();
    expect(slot?.textContent).toBe('😊');
    expect(slot?.querySelector('[class*="selectionDot"]')).not.toBeNull();
  });
});

// ============================================================================
// Accessibility (role as menuitem)
// ============================================================================

describe('ContextMenuItemView accessibility', () => {
  it('has role=menuitem', () => {
    render(<ContextMenuItemView label="Delete" />);
    expect(screen.getByRole('menuitem')).toBeInTheDocument();
  });

  it('aria-label from label prop', () => {
    render(<ContextMenuItemView label="Copy" />);
    const item = screen.getByRole('menuitem');
    expect(item.getAttribute('aria-label')).toBe('Copy');
  });
});

// ============================================================================
// Click handler
// ============================================================================

describe('ContextMenuItemView interaction', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ContextMenuItemView label="Action" onClick={handleClick} />);
    screen.getByRole('menuitem').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Custom props (className, style)
// ============================================================================

describe('ContextMenuItemView custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <ContextMenuItemView className="my-item" label="Test" />
    );
    expect(container.firstElementChild?.className).toContain('my-item');
  });

  it('accepts custom style merged with defaults', () => {
    const { container } = render(
      <ContextMenuItemView style={{ margin: 8 }} label="Test" />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('min-width: 56');
    expect(style).toContain('margin: 8px');
  });

  it('renders without crashing when no props provided', () => {
    const { container } = render(<ContextMenuItemView />);
    expect(container.firstElementChild).not.toBeNull();
  });
});

// ============================================================================
// Re-rendering
// ============================================================================

describe('ContextMenuItemView re-rendering', () => {
  it('updates label on rerender', () => {
    const { container, rerender } = render(
      <ContextMenuItemView label="First" />
    );
    expect(container.textContent).toContain('First');

    rerender(<ContextMenuItemView label="Second" />);
    expect(container.textContent).toContain('Second');
  });

  it('handles icon toggle', () => {
    const { container, rerender } = render(<ContextMenuItemView label="Test" />);
    expect(container.querySelector('[class*="itemIcon"]')).toBeNull();

    rerender(<ContextMenuItemView label="Test" icon={TEST_ICON} />);
    const slot = container.querySelector('[class*="itemIcon"]');
    expect(slot).not.toBeNull();
    expect(slot?.querySelector('svg')).toBeTruthy();

    rerender(<ContextMenuItemView label="Test" />);
    expect(container.querySelector('[class*="itemIcon"]')).toBeNull();
  });
});
