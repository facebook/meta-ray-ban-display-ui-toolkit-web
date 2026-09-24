/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Page tests
 *
 * A container with a lazily-inflated header, content fills remaining space.
 * Header uses Chip with EMPHASIZED style.
 */

import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { VerticalList } from '@wearables-ui-toolkit/foundation/components/VerticalList';
import { Page, type PageHandle } from '../mrbd/ui/Page';
import {
  getPagePaneTitle,
  shouldRenderPageHeader,
} from '../mrbd/ui/private/PageLayout';
import {
  PAGE_HEADER_TRANSLATION_Z,
  PAGE_SYSTEM_BAR_INSET_TOP,
} from '../mrbd/ui/private/PageMetrics';
import { TEST_ICON } from './helpers/testIcon';

describe('Page initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<Page />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=main', () => {
    render(<Page headerText="Test" />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Page>
        <span data-testid="content">Hello</span>
      </Page>
    );
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content.parentElement).toHaveAttribute('data-uit-focus-section', 'true');
  });

  it('insets child content below the system-bar region by default', () => {
    const { container } = render(<Page>Content</Page>);
    const page = container.querySelector<HTMLElement>('[role="main"]');
    const content = page?.lastElementChild as HTMLElement | null;

    expect(page?.style.top).toBe('');
    expect(page?.style.paddingTop).toBe('');
    expect(content?.style.top).toBe(`${PAGE_SYSTEM_BAR_INSET_TOP}px`);
  });

  it('can opt child content out of the system-bar inset', () => {
    const { container } = render(
      <Page enableSystemBarInset={false}>Content</Page>,
    );
    const content = container.querySelector('[role="main"]')
      ?.lastElementChild as HTMLElement | null;

    expect(content?.style.top).toBe('0px');
  });

  it('keeps the default system-bar inset when the header is hidden', () => {
    const { container } = render(<Page showHeader={false}>Content</Page>);

    expect(container.querySelector('[class*="headerWrapper"]')).toBeNull();
    expect(
      (container.querySelector('[role="main"]')?.lastElementChild as HTMLElement)
        .style.top,
    ).toBe(`${PAGE_SYSTEM_BAR_INSET_TOP}px`);
  });

  it('keeps the system-bar and VerticalList header insets independent', () => {
    const { container } = render(
      <Page headerText="Settings">
        <VerticalList insetForHeader>
          <button>First row</button>
        </VerticalList>
      </Page>,
    );

    expect(
      (container.querySelector('[role="main"]')?.lastElementChild as HTMLElement)
        .style.top,
    ).toBe(`${PAGE_SYSTEM_BAR_INSET_TOP}px`);
    expect(
      container.querySelector<HTMLElement>('[data-scroll-view="true"]')?.style
        .paddingTop,
    ).toBe(
      'calc(64px + var(--uit-page-content-origin-offset, 0px))',
    );
  });
});

describe('Page header', () => {
  it('header visibility is driven solely by showHeader', () => {
    // The header is shown/hidden based on showHeader alone — independent of
    // whether any header content (text/metadata/icon/avatar) is set.
    expect(shouldRenderPageHeader({ showHeader: true })).toBe(true);
    expect(shouldRenderPageHeader({ showHeader: false })).toBe(false);
  });

  it('pane title (aria-label) joins header text and metadata', () => {
    // The pane title joins header text and metadata: "text, metadata".
    expect(getPagePaneTitle(true, 'Now playing', 'Spotify')).toBe(
      'Now playing, Spotify',
    );
    expect(getPagePaneTitle(true, 'Now playing')).toBe('Now playing');
    expect(getPagePaneTitle(false, 'Now playing', 'Spotify')).toBeUndefined();
  });

  it('renders header when headerText is set', () => {
    const { container } = render(<Page headerText="Settings" />);
    expect(container.textContent).toContain('Settings');
  });

  it('sets header stacking to the header translation z value', () => {
    const { container } = render(<Page headerText="Settings" />);
    const headerWrapper = container.querySelector('[class*="headerWrapper"]');
    expect(headerWrapper?.getAttribute('style')).toContain(
      `z-index: ${PAGE_HEADER_TRANSLATION_Z}`,
    );
  });

  it('keeps the header at the same system-safe position when content opts out', () => {
    const { container, rerender } = render(<Page headerText="Settings" />);
    const initialHeader = container.querySelector<HTMLElement>(
      '[class*="headerWrapper"]',
    );
    const initialHeaderTop = initialHeader?.style.top;

    expect(initialHeaderTop).toBe(`${PAGE_SYSTEM_BAR_INSET_TOP}px`);

    rerender(
      <Page headerText="Settings" enableSystemBarInset={false} />,
    );
    const optOutHeader = container.querySelector<HTMLElement>(
      '[class*="headerWrapper"]',
    );

    expect(optOutHeader?.style.top).toBe(initialHeaderTop);
    expect(
      (container.querySelector('[role="main"]')?.lastElementChild as HTMLElement)
        .style.top,
    ).toBe('0px');
  });

  it('hides header when showHeader is false', () => {
    const { container } = render(
      <Page headerText="Hidden" showHeader={false} />
    );
    const headerWrapper = container.querySelector('[class*="headerWrapper"]');
    expect(headerWrapper).toBeNull();
  });

  it('renders the header container when showHeader is true with no header content', () => {
    // The header is visible whenever showHeader is true, even with no
    // text/metadata/icon/avatar. showHeader=false is the only suppression path.
    const { container } = render(<Page />);
    const headerWrapper = container.querySelector('[class*="headerWrapper"]');
    expect(headerWrapper).not.toBeNull();
  });

  it('renders no header container when showHeader is false', () => {
    const { container } = render(<Page showHeader={false} />);
    const headerWrapper = container.querySelector('[class*="headerWrapper"]');
    expect(headerWrapper).toBeNull();
  });

  it('renders header metadata', () => {
    const { container } = render(
      <Page headerText="Title" headerMetadata="3 items" />
    );
    expect(container.textContent).toContain('3 items');
  });

  it('forwards header loading state over icon content', () => {
    const { container } = render(
      <Page headerText="Title" headerIcon={TEST_ICON} headerIsLoading />
    );

    // Loading wins over icon content: the leading slot shows the loader, not the icon.
    expect(container.querySelector('[data-chip-leading-kind="loader"]')).not.toBeNull();
    expect(container.querySelector('[data-chip-leading-kind="icon"]')).toBeNull();
    expect(container.querySelector('[class*="loader"]')).not.toBeNull();
  });

  it('renders a bundled token header icon inline as svg', () => {
    const { container } = render(
      <Page headerText="Title" headerIcon={TEST_ICON} />
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('forwards header max lines to the rendered chip text', () => {
    const { container } = render(
      <Page headerText="Two line title" headerMaxLines={2} />
    );
    const text = container.querySelector('[class*="textView"]');
    expect(text?.getAttribute('style')).toContain('-webkit-line-clamp: 2');
  });

  it('forwards header avatar content slots', () => {
    render(
      <Page
        headerText="Title"
        headerIcon={TEST_ICON}
        headerAvatarPrimaryContent={<span data-testid="page-avatar-primary">P</span>}
        headerAvatarSecondaryContent={<span data-testid="page-avatar-secondary">S</span>}
        headerAvatarBadgeContent={<span data-testid="page-avatar-badge">B</span>}
      />
    );

    expect(screen.getByTestId('page-avatar-primary')).toBeInTheDocument();
    expect(screen.getByTestId('page-avatar-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('page-avatar-badge')).toBeInTheDocument();
    expect(document.querySelector('[data-chip-leading-kind="icon"]')).toBeNull();
  });
});

describe('Page accessibility', () => {
  it('pane title helper follows rendered header state', () => {
    expect(getPagePaneTitle(true, 'Settings')).toBe('Settings');
    expect(getPagePaneTitle(false, 'Settings')).toBeUndefined();
  });

  it('aria-label from header text', () => {
    render(<Page headerText="Settings" />);
    expect(screen.getByRole('main').getAttribute('aria-label')).toBe('Settings');
  });

  it('no aria-label when no header', () => {
    render(<Page />);
    const main = screen.getByRole('main');
    expect(main.getAttribute('aria-label')).toBeNull();
  });

  it('honors explicit root semantics', () => {
    render(
      <Page role="region" aria-label="Custom page label" headerText="Header label" />,
    );

    expect(
      screen.getByRole('region', { name: 'Custom page label' }),
    ).toBeInTheDocument();
  });
});

describe('Page imperative handle', () => {
  it('exposes getHeaderHeight returning a number', () => {
    const ref = createRef<PageHandle>();
    render(<Page ref={ref} headerText="Settings" />);
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.getHeaderHeight).toBe('function');
    // jsdom reports 0 layout, so we assert the contract: a number is returned.
    const height = ref.current?.getHeaderHeight();
    expect(typeof height).toBe('number');
  });

  it('getHeaderHeight returns 0 when showHeader is false', () => {
    const ref = createRef<PageHandle>();
    render(<Page ref={ref} headerText="Hidden" showHeader={false} />);
    expect(ref.current?.getHeaderHeight()).toBe(0);
  });

  it('getHeaderHeight returns a number when showHeader is true with no header content', () => {
    // The header renders whenever showHeader is true, so the height contract
    // matches the rendered-header case (jsdom reports 0 layout).
    const ref = createRef<PageHandle>();
    render(<Page ref={ref} />);
    expect(typeof ref.current?.getHeaderHeight()).toBe('number');
  });

  it('reflects header visibility changes through the ref', () => {
    const ref = createRef<PageHandle>();
    const { rerender } = render(<Page ref={ref} headerText="Settings" />);
    expect(typeof ref.current?.getHeaderHeight()).toBe('number');
    act(() => {
      rerender(<Page ref={ref} headerText="Settings" showHeader={false} />);
    });
    expect(ref.current?.getHeaderHeight()).toBe(0);
  });
});

describe('Page custom props', () => {
  it('accepts className', () => {
    const { container } = render(<Page className="my-page" />);
    expect(container.firstElementChild?.className).toContain('my-page');
  });
});
