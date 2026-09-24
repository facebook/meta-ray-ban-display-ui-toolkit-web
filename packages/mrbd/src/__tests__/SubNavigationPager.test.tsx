/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SubNavigationPager tests
 *
 * Composes a Pager + scrim + SubNavigation, with SubNavigation at top and
 * the scrim fading in on SubNav focus.
 */

import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { App } from '../mrbd/app/App';
import { SubNavigationPager } from '../mrbd/ui/SubNavigationPager';
import { getSubNavigationWrapperStyle } from '../mrbd/ui/private/SubNavigationPagerLayout';
import { AUTOHIDE_TIMEOUT } from '../mrbd/ui/private/SubNavigationMetrics';
import { TEST_ICON } from './helpers/testIcon';

const ITEMS = [
  { label: 'Home', icon: TEST_ICON },
  { label: 'Search', icon: TEST_ICON },
  { label: 'Profile', icon: TEST_ICON },
];

describe('SubNavigationPager initialization', () => {
  it('stays full bleed inside App without a Page inset layer', () => {
    const { container } = render(
      <App>
        <SubNavigationPager items={ITEMS.slice(0, 1)}>
          <div>Page 1</div>
        </SubNavigationPager>
      </App>,
    );

    const appContent = container.querySelector<HTMLElement>(
      '[data-app-content-root]',
    );
    expect(appContent).toHaveStyle({ height: '100%' });
    expect(appContent?.style.marginTop).toBe('');
    expect(container.querySelector('[role="main"]')).toBeNull();
    expect(
      container.querySelector<HTMLElement>('[class*="subNavigationWrapper"]')
        ?.style.getPropertyValue('--subnavigation-top-margin'),
    ).toBe('20px');
  });

  it('renders without crashing', () => {
    const { container } = render(
      <SubNavigationPager items={ITEMS}>
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders SubNavigation tab bar', () => {
    render(
      <SubNavigationPager items={ITEMS}>
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders page content', () => {
    const { container } = render(
      <SubNavigationPager items={ITEMS}>
        <div data-testid="p1">Page 1</div>
        <div data-testid="p2">Page 2</div>
        <div data-testid="p3">Page 3</div>
      </SubNavigationPager>
    );
    expect(container.textContent).toContain('Page 1');
  });

  it('renders scrim overlay', () => {
    const { container } = render(
      <SubNavigationPager items={ITEMS.slice(0, 1)}>
        <div>Page 1</div>
      </SubNavigationPager>
    );
    const scrim = container.querySelector('[class*="scrimView"]');
    expect(scrim).not.toBeNull();
  });

  it('rejects mismatched navigation items and pages', () => {
    expect(() => render(
      <SubNavigationPager items={ITEMS}>
        <div>Only page</div>
      </SubNavigationPager>,
    )).toThrow(/one item per page/);
  });
});

describe('SubNavigationPager subNavigationDisabled', () => {
  it('hides SubNavigation when disabled', () => {
    const { container } = render(
      <SubNavigationPager items={ITEMS.slice(0, 1)} subNavigationDisabled>
        <div>Page 1</div>
      </SubNavigationPager>
    );
    expect(container.querySelector('[role="tablist"]')).toBeNull();
  });

  it('shows SubNavigation when not disabled', () => {
    render(
      <SubNavigationPager items={ITEMS.slice(0, 1)}>
        <div>Page 1</div>
      </SubNavigationPager>
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});

describe('SubNavigationPager page changes', () => {
  it('calls onPageChange when tab is selected', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SubNavigationPager items={ITEMS} onPageChange={handleChange}>
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>
    );
    const tabItems = container.querySelectorAll('[class*="itemWrapper"]');
    expect(tabItems).toHaveLength(ITEMS.length);
    act(() => {
      tabItems[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handleChange).toHaveBeenCalled();
    expect(container.firstElementChild).toHaveAttribute('data-current-page', '1');
    expect(container.querySelector('[data-page-index="1"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    );
  });

  it('keeps a controlled page unchanged until its owner updates the index', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SubNavigationPager
        items={ITEMS}
        currentPageIndex={0}
        onPageChange={handleChange}
      >
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>,
    );

    const tabItems = container.querySelectorAll('[class*="itemWrapper"]');
    act(() => {
      tabItems[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handleChange).toHaveBeenCalledWith(1, 0, true);
    expect(container.firstElementChild).toHaveAttribute('data-current-page', '0');
    expect(container.querySelector('[data-page-index="0"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    );
  });

  it('respects navigationLocked', () => {
    const handleChange = vi.fn();
    const handleLocked = vi.fn();
    const { container } = render(
      <SubNavigationPager
        items={ITEMS.slice(0, 2)}
        onPageChange={handleChange}
        navigationLocked
        onNavigationAttemptWhileLocked={handleLocked}
      >
        <div>Page 1</div>
        <div>Page 2</div>
      </SubNavigationPager>
    );
    const tabItems = container.querySelectorAll('[class*="itemWrapper"]');
    expect(tabItems).toHaveLength(2);
    tabItems[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(handleChange).not.toHaveBeenCalled();
    expect(handleLocked).toHaveBeenCalledOnce();
  });
});

describe('SubNavigationPager focus management', () => {
  function StatefulPager() {
    const [index, setIndex] = useState(0);
    return (
      <SubNavigationPager
        items={ITEMS}
        currentPageIndex={index}
        onPageChange={(next) => setIndex(next)}
      >
        <button data-testid="p0-btn">Page 0 button</button>
        <button data-testid="p1-btn">Page 1 button</button>
        <button data-testid="p2-btn">Page 2 button</button>
      </SubNavigationPager>
    );
  }

  it('keeps focus on the SubNavigation after a tab-driven page change', () => {
    const { container } = render(<StatefulPager />);
    const tablist = container.querySelector('[role="tablist"]') as HTMLElement;
    act(() => {
      tablist.focus();
    });
    expect(document.activeElement).toBe(tablist);

    const items = container.querySelectorAll('[class*="itemWrapper"]');
    act(() => {
      items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Focus must stay on the tab bar so the user can swipe through consecutive
    // pages; it must not drop into the newly-shown page's content.
    const pager = container.querySelector(
      '[data-page-index="1"]',
    ) as HTMLElement;
    expect(pager).toHaveAttribute('role', 'group');
    expect(pager).toHaveAttribute('aria-roledescription', 'slide');
    expect(pager).toHaveAttribute('aria-hidden', 'false');
    expect(pager).not.toHaveAttribute('inert');
    expect(tablist.contains(document.activeElement)).toBe(true);
    expect(
      pager.contains(document.activeElement) &&
        document.activeElement !== tablist,
    ).toBe(false);
  });

  it('moves focus from the SubNavigation into active page content on ArrowDown', () => {
    const { container } = render(<StatefulPager />);
    const tablist = container.querySelector('[role="tablist"]') as HTMLElement;
    const items = container.querySelectorAll('[class*="itemWrapper"]');
    act(() => {
      tablist.focus();
      items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(tablist.contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(items[1], { key: 'ArrowDown' });

    expect(document.activeElement).toBe(screen.getByTestId('p1-btn'));
  });

  it('does not reclaim focus for changes that did not originate from the tab bar', () => {
    const { container } = render(
      <SubNavigationPager items={ITEMS.slice(0, 2)} currentPageIndex={0}>
        <button data-testid="p0-btn">Page 0 button</button>
        <button data-testid="p1-btn">Page 1 button</button>
      </SubNavigationPager>
    );
    const page0Button = container.querySelector(
      '[data-testid="p0-btn"]',
    ) as HTMLElement;
    // Focus moving into page content by any non-tab-bar path is left untouched:
    // the focus guard only redirects focus grabbed right after a tab selection.
    act(() => {
      page0Button.focus();
    });
    expect(document.activeElement).toBe(page0Button);
  });
});

describe('SubNavigationPager back handling', () => {
  it('consumes Escape to return to the home page when not already home', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SubNavigationPager
        items={ITEMS}
        currentPageIndex={2}
        homeIndex={0}
        onPageChange={handleChange}
      >
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>
    );
    const wrapper = container.firstElementChild!;
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });

    const dispatched = wrapper.dispatchEvent(event);

    expect(dispatched).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(handleChange).toHaveBeenCalledWith(0, 2, true);
  });

  it('browser Back returns to the home page', () => {
    const handleChange = vi.fn();
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 2 };
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <SubNavigationPager
        items={ITEMS}
        defaultPageIndex={2}
        homeIndex={0}
        onPageChange={handleChange}
      >
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>,
    );

    try {
      expect(window.history.state.__uitTransientBackEntry).toEqual(
        expect.any(String),
      );
      act(() => {
        window.history.replaceState(initialState, '', window.location.href);
        window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      });

      expect(handleChange).toHaveBeenCalledWith(0, 2, true);
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('lets Escape fall through when already on the home page', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SubNavigationPager
        items={ITEMS}
        currentPageIndex={0}
        homeIndex={0}
        onPageChange={handleChange}
      >
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>
    );
    const wrapper = container.firstElementChild!;
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });

    const dispatched = wrapper.dispatchEvent(event);

    expect(dispatched).toBe(true);
    expect(event.defaultPrevented).toBe(false);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('handles Escape from the focused SubNavigation header', () => {
    const handleChange = vi.fn();
    render(
      <SubNavigationPager
        items={ITEMS}
        currentPageIndex={1}
        homeIndex={0}
        onPageChange={handleChange}
      >
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>
    );

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Escape' });

    expect(handleChange).toHaveBeenCalledWith(0, 1, true);
  });

  it.each(['Escape', 'Backspace', 'BrowserBack', 'GoBack'])(
    'returns home from the focused SubNavigation strip on %s',
    (key) => {
      // Page content reaches the inner Pager, which honours every alias, so
      // this gap was invisible from page content: only keys pressed while the
      // STRIP has focus are handled by the root handler. That handler tested
      // `key === 'Escape'` alone, leaving the other three aliases dead from the
      // strip while working everywhere else.
      const handleChange = vi.fn();
      render(
        <SubNavigationPager
          items={ITEMS}
          currentPageIndex={1}
          homeIndex={0}
          onPageChange={handleChange}
        >
          <div>Page 1</div>
          <div>Page 2</div>
          <div>Page 3</div>
        </SubNavigationPager>
      );

      fireEvent.keyDown(screen.getByRole('tablist'), { key });

      expect(handleChange).toHaveBeenCalledWith(0, 1, true);
    },
  );

  it('ignores Backspace from the strip while a text field has focus', () => {
    // The shared predicate's text-entry exclusion must survive the delegation:
    // Backspace inside an input is editing, not navigation.
    const handleChange = vi.fn();
    render(
      <SubNavigationPager
        items={ITEMS}
        currentPageIndex={1}
        homeIndex={0}
        onPageChange={handleChange}
      >
        <div>
          <input aria-label="note" defaultValue="abc" />
        </div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>
    );

    const field = screen.getByLabelText('note');
    fireEvent.keyDown(field, { key: 'Backspace', target: field });

    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe('SubNavigationPager props', () => {
  it('defaults autoHide to false', () => {
    vi.useFakeTimers();
    try {
      render(
        <SubNavigationPager items={ITEMS.slice(0, 1)}>
          <div>Page 1</div>
        </SubNavigationPager>
      );

      act(() => {
        vi.advanceTimersByTime(AUTOHIDE_TIMEOUT);
      });

      expect(screen.getByRole('tablist')).toHaveStyle({ opacity: 1 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('accepts className', () => {
    const { container } = render(
      <SubNavigationPager items={ITEMS.slice(0, 1)} className="my-vp">
        <div>Page 1</div>
      </SubNavigationPager>
    );
    expect(container.firstElementChild?.className).toContain('my-vp');
  });

  it('data attributes reflect page state', () => {
    const { container } = render(
      <SubNavigationPager items={ITEMS} currentPageIndex={1}>
        <div>Page 1</div>
        <div>Page 2</div>
        <div>Page 3</div>
      </SubNavigationPager>
    );
    expect(container.firstElementChild?.getAttribute('data-current-page')).toBe('1');
    expect(container.firstElementChild?.getAttribute('data-page-count')).toBe('3');
  });

  it('omits the top margin when enableTopPadding is disabled', () => {
    const { container } = render(
      <SubNavigationPager items={ITEMS.slice(0, 1)} enableTopPadding={false}>
        <div>Page 1</div>
      </SubNavigationPager>
    );

    expect(
      container.querySelector<HTMLElement>('[class*="subNavigationWrapper"]')?.style
        .getPropertyValue('--subnavigation-top-margin')
    ).toBe('0px');
  });

  it('can apply the legacy top margin when explicitly enabled', () => {
    expect(getSubNavigationWrapperStyle(true)).toMatchObject({
      '--subnavigation-top-margin': '20px',
    });
  });

  it('places the internal SubNavigation header at the top of the component by default', () => {
    expect(getSubNavigationWrapperStyle(false)).toMatchObject({
      '--subnavigation-top-margin': '0px',
    });
  });
});
