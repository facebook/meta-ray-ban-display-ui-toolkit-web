/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SubNavigation tests
 *
 * Constants under test:
 * - ALPHA_INACTIVE = 0.5
 * - AUTOHIDE_TIMEOUT = 3000ms
 * - Item size: 48px
 * - Icon size: 32px
 * - Default active: none (-1)
 */

import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import {
  SubNavigation,
  type SubNavigationHandle,
  type SubNavigationItem,
} from '../mrbd/ui/SubNavigation';
import {
  getSubNavigationAriaLabel,
  getSubNavigationLiveAnnouncement,
} from '../mrbd/ui/private/SubNavigationLayout';

const iconUriFor = (label: string) => `/icons/sub-nav-${label}.svg`;

const makeItems = (count: number): SubNavigationItem[] =>
  Array.from({ length: count }, (_, i) => ({
    label: `Tab ${i}`,
    icon: { uri: iconUriFor(`${i}`) },
  }));

const THREE_ITEMS = makeItems(3);

// ============================================================================
// Initialization Tests
// ============================================================================

describe('SubNavigation initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} />
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('keeps the polite live region outside the tablist', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={0} />
    );
    const tablist = screen.getByRole('tablist');
    const live = screen.getByRole('status');
    expect(container.firstElementChild).toBe(tablist);
    expect(tablist).not.toContainElement(live);
  });

  it('renders all items', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} />
    );
    const items = container.querySelectorAll('[class*="itemWrapper"]');
    expect(items.length).toBe(3);
  });

  it('default active is none (-1): no tab highlighted', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} />
    );
    const items = container.querySelectorAll('[class*="itemContent"]');
    // Default has no active tab: every item is at inactive alpha.
    items.forEach((item) => {
      expect(item.getAttribute('style') ?? '').toContain('opacity: 0.5');
    });
  });

  it('passing active=N highlights tab N', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={1} />
    );
    const items = container.querySelectorAll('[class*="itemContent"]');
    expect(items[0]?.getAttribute('style')).toContain('opacity: 0.5');
    expect(items[1]?.getAttribute('style')).toContain('opacity: 1');
    expect(items[2]?.getAttribute('style')).toContain('opacity: 0.5');
  });

  it('opts out of automatic initial page focus by default', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} />
    );

    expect(container.firstElementChild).toHaveAttribute(
      'data-uit-initial-focus-excluded',
      'true',
    );
  });

  it('can opt back into automatic initial page focus', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} initialFocusEligible />
    );

    expect(container.firstElementChild).not.toHaveAttribute(
      'data-uit-initial-focus-excluded',
    );
  });
});

// ============================================================================
// Item Setting / Updating
// ============================================================================

describe('SubNavigation items', () => {
  it('updates when items change', () => {
    const { container, rerender } = render(
      <SubNavigation items={makeItems(2)} />
    );
    expect(container.querySelectorAll('[class*="itemWrapper"]').length).toBe(2);

    rerender(<SubNavigation items={makeItems(4)} />);
    expect(container.querySelectorAll('[class*="itemWrapper"]').length).toBe(4);
  });

  it('handles empty items list', () => {
    const { container } = render(<SubNavigation items={[]} />);
    const items = container.querySelectorAll('[class*="itemWrapper"]');
    expect(items.length).toBe(0);
  });

  it('handles single item', () => {
    const { container } = render(<SubNavigation items={makeItems(1)} />);
    const items = container.querySelectorAll('[class*="itemWrapper"]');
    expect(items.length).toBe(1);
  });
});

// ============================================================================
// Active item
// ============================================================================

describe('SubNavigation active item', () => {
  it('sets active by index', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={1} />
    );
    const items = container.querySelectorAll('[class*="itemContent"]');
    const style0 = items[0]?.getAttribute('style') ?? '';
    const style1 = items[1]?.getAttribute('style') ?? '';
    expect(style0).toContain('opacity: 0.5');
    expect(style1).toContain('opacity: 1');
  });

  it('deactivates previous item when active changes', () => {
    const { container, rerender } = render(
      <SubNavigation items={THREE_ITEMS} active={0} />
    );
    const items = container.querySelectorAll('[class*="itemContent"]');
    expect(items[0]?.getAttribute('style')).toContain('opacity: 1');

    rerender(<SubNavigation items={THREE_ITEMS} active={2} />);
    const items2 = container.querySelectorAll('[class*="itemContent"]');
    expect(items2[0]?.getAttribute('style')).toContain('opacity: 0.5');
    expect(items2[2]?.getAttribute('style')).toContain('opacity: 1');
  });

  it('handles out-of-bounds active index gracefully', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={99} />
    );
    expect(container.firstElementChild).not.toBeNull();
    expect(screen.getByRole('tablist')).not.toHaveAttribute('aria-label');
  });
});

// ============================================================================
// Alpha / Opacity (alpha changes on active/inactive)
// ============================================================================

describe('SubNavigation item alpha (ALPHA_INACTIVE=0.5)', () => {
  it('active item has full opacity (1)', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={0} />
    );
    const items = container.querySelectorAll('[class*="itemContent"]');
    expect(items[0]?.getAttribute('style')).toContain('opacity: 1');
  });

  it('inactive items have half opacity (0.5)', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={0} />
    );
    const items = container.querySelectorAll('[class*="itemContent"]');
    expect(items[1]?.getAttribute('style')).toContain('opacity: 0.5');
    expect(items[2]?.getAttribute('style')).toContain('opacity: 0.5');
  });
});

// ============================================================================
// Keyboard Navigation (DPAD right/left, boundary cases)
// ============================================================================

describe('SubNavigation keyboard navigation (DPAD)', () => {
  it('handles ArrowRight on the focused tablist container', () => {
    const handleChange = vi.fn();
    render(
      <SubNavigation items={THREE_ITEMS} active={0} onActiveChange={handleChange} />
    );
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('ArrowRight advances to next item', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={0} onActiveChange={handleChange} />
    );
    const keyTarget = container.querySelector('[class*="navRow"]')!;
    fireEvent.keyDown(keyTarget, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('ArrowLeft goes to previous item', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={2} onActiveChange={handleChange} />
    );
    const keyTarget = container.querySelector('[class*="navRow"]')!;
    fireEvent.keyDown(keyTarget, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('ArrowRight at last item does nothing (boundary)', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={2} onActiveChange={handleChange} />
    );
    const keyTarget = container.querySelector('[class*="navRow"]')!;
    fireEvent.keyDown(keyTarget, { key: 'ArrowRight' });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('ArrowLeft at first item does nothing (boundary)', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={0} onActiveChange={handleChange} />
    );
    const keyTarget = container.querySelector('[class*="navRow"]')!;
    fireEvent.keyDown(keyTarget, { key: 'ArrowLeft' });
    expect(handleChange).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Listener / Callback (listener on click)
// ============================================================================

describe('SubNavigation onActiveChange callback', () => {
  it('calls onActiveChange when item is clicked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} active={0} onActiveChange={handleChange} />
    );
    const items = container.querySelectorAll('[class*="itemWrapper"]');
    fireEvent.click(items[2]);
    expect(handleChange).toHaveBeenCalledWith(2);
  });
});

// ============================================================================
// Accessibility (ARIA labels and tab semantics)
// ============================================================================

describe('SubNavigation accessibility', () => {
  it('exposes active-descendant tab semantics from its single focus owner', () => {
    render(<SubNavigation items={THREE_ITEMS} active={0} />);
    const tablist = screen.getByRole('tablist');
    const tabs = screen.getAllByRole('tab');

    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
    expect(tablist).toHaveAttribute('aria-activedescendant', tabs[0].id);
  });

  it('aria-label includes active item name and position', () => {
    render(<SubNavigation items={THREE_ITEMS} active={0} />);
    const tablist = screen.getByRole('tablist');
    const label = tablist.getAttribute('aria-label') ?? '';
    expect(label).toContain('Tab 0');
    expect(label).toContain('1 of 3');
  });

  it('aria-label updates when active changes', () => {
    const { rerender } = render(
      <SubNavigation items={THREE_ITEMS} active={0} />
    );
    const tablist = screen.getByRole('tablist');
    expect(tablist.getAttribute('aria-label')).toContain('1 of 3');

    rerender(<SubNavigation items={THREE_ITEMS} active={2} />);
    expect(tablist.getAttribute('aria-label')).toContain('3 of 3');
  });
});

// ============================================================================
// AutoHide (autoHide defaults/toggling)
// ============================================================================

describe('SubNavigation autoHide (AUTOHIDE_TIMEOUT=3000)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to autoHide disabled', () => {
    const { container } = render(<SubNavigation items={THREE_ITEMS} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 1');
  });

  it('starts visible when autoHide is enabled', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} autoHide />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 1');
  });

  it('hides after the auto-hide timeout when autoHide remains enabled and unfocused', () => {
    vi.useFakeTimers();
    render(<SubNavigation items={THREE_ITEMS} autoHide />);
    const tablist = screen.getByRole('tablist');

    expect(tablist).toHaveStyle({ opacity: '1' });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(tablist).toHaveStyle({ opacity: '0' });
  });

  it('clears pending hide timers when autoHide is disabled', () => {
    vi.useFakeTimers();
    const { rerender } = render(<SubNavigation items={THREE_ITEMS} autoHide />);
    const tablist = screen.getByRole('tablist');

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    rerender(<SubNavigation items={THREE_ITEMS} autoHide={false} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(tablist).toHaveStyle({ opacity: '1' });
  });

  it('does not auto-hide while the tablist is focused', () => {
    vi.useFakeTimers();
    render(<SubNavigation items={THREE_ITEMS} autoHide />);
    const tablist = screen.getByRole('tablist');

    act(() => {
      tablist.focus();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(tablist).toHaveStyle({ opacity: '1' });
  });
});

// ============================================================================
// Loading state (item isLoading)
// ============================================================================

describe('SubNavigation loading state', () => {
  it('shows loader when item isLoading', () => {
    const loadingItems: SubNavigationItem[] = [
      { label: 'Tab 0', icon: { uri: iconUriFor('0') }, isLoading: true },
      { label: 'Tab 1', icon: { uri: iconUriFor('1') } },
    ];
    const { container } = render(<SubNavigation items={loadingItems} />);
    const loaders = container.querySelectorAll('[class*="loader"], svg circle');
    expect(loaders.length).toBeGreaterThan(0);
  });

  it('shows icon when not loading', () => {
    const { container } = render(<SubNavigation items={THREE_ITEMS} />);
    const icon = container.querySelector(`[style*="${iconUriFor('0')}"]`);
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('style')).toContain('mask-image');
  });
});

// ============================================================================
// onFocusChange
// ============================================================================

describe('SubNavigation onFocusChange', () => {
  it('fires true on focus enter and false on focus leave', () => {
    const handleFocusChange = vi.fn();
    render(
      <SubNavigation items={THREE_ITEMS} onFocusChange={handleFocusChange} />
    );
    const tablist = screen.getByRole('tablist');

    expect(handleFocusChange).not.toHaveBeenCalled();

    act(() => {
      tablist.focus();
    });
    expect(handleFocusChange).toHaveBeenLastCalledWith(true);

    act(() => {
      tablist.blur();
    });
    expect(handleFocusChange).toHaveBeenLastCalledWith(false);
    expect(handleFocusChange).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// Imperative handle (setVisible)
// ============================================================================

describe('SubNavigation ref.setVisible', () => {
  it('hides the header via the ref, overriding auto-hide visibility', () => {
    const ref = createRef<SubNavigationHandle>();
    const { container } = render(
      <SubNavigation ref={ref} items={THREE_ITEMS} />
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute('style')).toContain('opacity: 1');

    act(() => {
      ref.current?.setVisible(false);
    });
    expect(root?.getAttribute('style')).toContain('opacity: 0');

    act(() => {
      ref.current?.setVisible(true);
    });
    expect(root?.getAttribute('style')).toContain('opacity: 1');
  });

  it('disables the opacity transition when animated is false', () => {
    const ref = createRef<SubNavigationHandle>();
    const { container } = render(
      <SubNavigation ref={ref} items={THREE_ITEMS} />
    );
    const root = container.firstElementChild;

    act(() => {
      ref.current?.setVisible(false, false);
    });
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 0');
    expect(style).toContain('transition: none');
  });
});

// ============================================================================
// Container Material
// ============================================================================

describe('SubNavigation material', () => {
  it('has background layers from Container', () => {
    const { container } = render(<SubNavigation items={THREE_ITEMS} />);
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });

  it('has foreground layers from Container', () => {
    const { container } = render(<SubNavigation items={THREE_ITEMS} />);
    const fgLayers = container.querySelector('[class*="foregroundLayers"]');
    expect(fgLayers).not.toBeNull();
  });
});

// ============================================================================
// Icon Rendering
// ============================================================================

describe('SubNavigation icon rendering', () => {
  it('renders all item icons', () => {
    const { container } = render(<SubNavigation items={THREE_ITEMS} />);
    expect(
      container.querySelector(`[style*="${iconUriFor('0')}"]`),
    ).toBeTruthy();
    expect(
      container.querySelector(`[style*="${iconUriFor('1')}"]`),
    ).toBeTruthy();
    expect(
      container.querySelector(`[style*="${iconUriFor('2')}"]`),
    ).toBeTruthy();
    // Tinted icons render as mask spans, not <img>.
    expect(container.querySelectorAll('[style*="mask-image"]').length).toBe(3);
  });

  it('renders item labels in text elements', () => {
    const { container } = render(<SubNavigation items={THREE_ITEMS} />);
    const labels = container.querySelectorAll('[class*="textLabel"]');
    // Exactly one label per item — the width is measured via a detached clone, so
    // no persistent hidden measuring label lingers in the (clipped) row.
    expect(labels.length).toBe(3);
    expect(
      container.querySelectorAll('[class*="textLabel"][aria-hidden="true"]').length,
    ).toBe(0);
    expect(labels[0]?.textContent).toBe('Tab 0');
    expect(labels[1]?.textContent).toBe('Tab 1');
    expect(labels[2]?.textContent).toBe('Tab 2');
  });
});

// ============================================================================
// Custom Props
// ============================================================================

describe('SubNavigation custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} className="my-nav" />
    );
    expect(container.firstElementChild?.className).toContain('my-nav');
  });

  it('accepts custom style', () => {
    const { container } = render(
      <SubNavigation items={THREE_ITEMS} style={{ margin: 8 }} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });
});

// ============================================================================
// Accessibility (ARIA labels)
// ============================================================================

describe('SubNavigation accessibility labels', () => {
  it('builds "Page N of M, label" with next/previous swipe hints', () => {
    expect(getSubNavigationAriaLabel(THREE_ITEMS, 1)).toBe(
      'Page 2 of 3, Tab 1. Swipe up with one finger to navigate to Tab 2. Swipe down with one finger to navigate to Tab 0',
    );
  });

  it('omits the previous hint on the first page and the next hint on the last', () => {
    expect(getSubNavigationAriaLabel(THREE_ITEMS, 0)).toBe(
      'Page 1 of 3, Tab 0. Swipe up with one finger to navigate to Tab 1',
    );
    expect(getSubNavigationAriaLabel(THREE_ITEMS, 2)).toBe(
      'Page 3 of 3, Tab 2. Swipe down with one finger to navigate to Tab 1',
    );
  });

  it('omits the description with no pages or no valid active page', () => {
    expect(getSubNavigationAriaLabel([], 0)).toBeUndefined();
    expect(getSubNavigationAriaLabel(THREE_ITEMS, -1)).toBeUndefined();
  });

  it('live announcement is the concise "Page N of M, label" without hints', () => {
    expect(getSubNavigationLiveAnnouncement(THREE_ITEMS, 1)).toBe(
      'Page 2 of 3, Tab 1',
    );
  });

  it('exposes the description on the tablist and advertises arrow navigation', () => {
    const { container } = render(<SubNavigation items={THREE_ITEMS} active={1} />);
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist?.getAttribute('aria-label')).toBe(
      getSubNavigationAriaLabel(THREE_ITEMS, 1),
    );
    expect(tablist?.getAttribute('aria-keyshortcuts')).toBe(
      'ArrowLeft ArrowRight',
    );
  });

  it('announces active-page changes via a polite live region', () => {
    const { container, rerender } = render(
      <SubNavigation items={THREE_ITEMS} active={0} />
    );
    const live = container.querySelector('[role="status"]');
    expect(live?.getAttribute('aria-live')).toBe('polite');
    expect(live?.textContent).toBe('');

    rerender(<SubNavigation items={THREE_ITEMS} active={2} />);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'Page 3 of 3, Tab 2',
    );
  });
});

// ============================================================================
// Re-rendering
// ============================================================================

describe('SubNavigation re-rendering', () => {
  it('handles rapid active changes', () => {
    const { container, rerender } = render(
      <SubNavigation items={THREE_ITEMS} active={0} />
    );
    for (let i = 0; i < 3; i++) {
      rerender(<SubNavigation items={THREE_ITEMS} active={i} />);
    }
    const items = container.querySelectorAll('[class*="itemContent"]');
    expect(items[2]?.getAttribute('style')).toContain('opacity: 1');
  });

  it('handles items being replaced entirely', () => {
    const items1 = [
      { label: 'A', icon: { uri: iconUriFor('a') } },
      { label: 'B', icon: { uri: iconUriFor('b') } },
    ];
    const items2 = [
      { label: 'X', icon: { uri: iconUriFor('x') } },
      { label: 'Y', icon: { uri: iconUriFor('y') } },
      { label: 'Z', icon: { uri: iconUriFor('z') } },
    ];

    const { container, rerender } = render(
      <SubNavigation items={items1} />
    );
    expect(container.querySelectorAll('[class*="itemWrapper"]').length).toBe(2);

    rerender(<SubNavigation items={items2} />);
    expect(container.querySelectorAll('[class*="itemWrapper"]').length).toBe(3);
  });
});
