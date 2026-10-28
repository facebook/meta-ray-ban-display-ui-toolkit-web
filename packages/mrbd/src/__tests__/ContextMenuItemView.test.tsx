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
 * - Min size: 56px by default or 48px when small
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

  it('uses a 48px minimum square for the small size', () => {
    const { container } = render(<ContextMenuItemView size="small" />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('min-width: 48');
    expect(style).toContain('min-height: 48');
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
      <ContextMenuItemView width={200} height={200} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 200');
    expect(style).toContain('height: 200');
  });

  it('keeps intrinsic content minimums aligned with live size and minimum-height overrides', () => {
    const view = render(<ButtonContextMenuItemView icon={TEST_ICON} title="Save" />);
    const item = screen.getByRole('menuitem', { name: 'Save' });
    expect(item.style.getPropertyValue('--uit-context-menu-item-min-height')).toBe('56px');
    expect(item.style.height).toBe('');

    view.rerender(<ButtonContextMenuItemView size="small" icon={TEST_ICON} title="Save" />);
    expect(screen.getByRole('menuitem', { name: 'Save' })).toBe(item);
    expect(item.style.minHeight).toBe('48px');
    expect(item.style.getPropertyValue('--uit-context-menu-item-min-height')).toBe('48px');

    view.rerender(<ButtonContextMenuItemView size="small" icon={TEST_ICON} title="Save" style={{ minHeight: 80 }} />);
    expect(item.style.minHeight).toBe('80px');
    expect(item.style.getPropertyValue('--uit-context-menu-item-min-height')).toBe('80px');
    expect(item.style.height).toBe('');
    view.unmount();
  });

  it.each(['default', 'small'] as const)('keeps %s caller minimum overrides independent and restores defaults on reset', size => {
    const minimum = size === 'small' ? '48px' : '56px';
    const view = render(<ContextMenuItemView size={size} ariaLabel="Custom size" style={{ minHeight: 24 }} />);
    const item = screen.getByRole('menuitem', { name: 'Custom size' });
    expect(item.style.minWidth).toBe(minimum);
    expect(item.style.minHeight).toBe('24px');
    expect(item.style.getPropertyValue('--uit-context-menu-item-min-height')).toBe('24px');

    view.rerender(<ContextMenuItemView size={size} ariaLabel="Custom size" style={{ minWidth: 80, minHeight: 0 }} />);
    expect(screen.getByRole('menuitem', { name: 'Custom size' })).toBe(item);
    expect(item.style.minWidth).toBe('80px');
    expect(item.style.minHeight).toBe('0px');
    expect(item.style.getPropertyValue('--uit-context-menu-item-min-height')).toBe('0px');

    view.rerender(<ContextMenuItemView size={size} ariaLabel="Custom size" style={{ minWidth: 32 }} />);
    expect(item.style.minWidth).toBe('32px');
    expect(item.style.minHeight).toBe(minimum);
    expect(item.style.getPropertyValue('--uit-context-menu-item-min-height')).toBe(minimum);

    view.rerender(<ContextMenuItemView size={size} ariaLabel="Custom size" />);
    expect(item.style.minWidth).toBe(minimum);
    expect(item.style.minHeight).toBe(minimum);
    expect(item.style.getPropertyValue('--uit-context-menu-item-min-height')).toBe(minimum);
    view.unmount();
  });

  it('preserves a caller-defined CSS minimum without resolving it into a fixed height', () => {
    const { container } = render(<ContextMenuItemView label="Action" style={{ minHeight: '4rem' }} />);
    const item = container.firstElementChild as HTMLElement;
    expect(item.style.minHeight).toBe('4rem');
    expect(item.style.getPropertyValue('--uit-context-menu-item-min-height')).toBe('4rem');
    expect(item.style.height).toBe('');
  });

  it.each(['default', 'small'] as const)('preserves %s minimums for an icon-only item and selected emoji', size => {
    const view = render(
      <>
        <ButtonContextMenuItemView size={size} icon={TEST_ICON} ariaLabel="Star" />
        <EmojiContextMenuItemView size={size} emoji="👍" isEmojiSelected ariaLabel="Selected reaction" />
      </>,
    );
    const minimum = size === 'small' ? '48px' : '56px';
    for (const item of screen.getAllByRole('menuitem')) {
      expect(item.style.minHeight).toBe(minimum);
      expect(item.style.minWidth).toBe(minimum);
      expect(item.style.getPropertyValue('--uit-context-menu-item-min-height')).toBe(minimum);
    }
    expect(view.container.querySelector('[class*="selectionDot"]')).not.toBeNull();
    view.unmount();
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

    const content = container.querySelector('[class*="buttonItemContent"]');
    expect(content?.className).not.toContain('buttonItemContentWithTitle');
    expect(content?.className).not.toContain('buttonItemContentLarge');
  });

  it('adds tokenized horizontal padding only when a title is present', () => {
    const { container, rerender } = render(
      <ButtonContextMenuItemView icon={TEST_ICON} title="Favorite" />
    );

    let content = container.querySelector('[class*="buttonItemContent"]');
    expect(content?.className).toContain('buttonItemContentWithTitle');

    rerender(
      <ButtonContextMenuItemView
        icon={TEST_ICON}
        title="Favorite"
        iconSize="large"
      />
    );
    content = container.querySelector('[class*="buttonItemContent"]');
    expect(content?.className).toContain('buttonItemContentLarge');
  });

  it.each(['medium', 'large'] as const)('removes %s icon padding when the title is removed', (iconSize) => {
    const { container, rerender } = render(
      <ButtonContextMenuItemView icon={TEST_ICON} title="Save" iconSize={iconSize} ariaLabel="Save" />,
    );

    rerender(<ButtonContextMenuItemView icon={TEST_ICON} iconSize={iconSize} ariaLabel="Save" />);

    const content = container.querySelector('[class*="buttonItemContent"]');
    expect(content).not.toBeNull();
    expect(content?.className).not.toContain('buttonItemContentWithTitle');
    expect(content?.className).not.toContain('buttonItemContentLarge');
    expect(screen.getByRole('menuitem', { name: 'Save' })).toBeInTheDocument();
  });

  it('forwards compact sizing to button and emoji presets', () => {
    render(
      <>
        <ButtonContextMenuItemView size="small" icon={TEST_ICON} iconSize="large" ariaLabel="Save" />
        <EmojiContextMenuItemView size="small" emoji="👍" ariaLabel="Like" isEmojiSelected />
      </>,
    );

    for (const item of screen.getAllByRole('menuitem')) {
      expect(item.style.minWidth).toBe('48px');
      expect(item.style.minHeight).toBe('48px');
    }
    expect(screen.getByRole('menuitem', { name: 'Like' }).querySelector('[class*="selectionDot"]')).not.toBeNull();
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
