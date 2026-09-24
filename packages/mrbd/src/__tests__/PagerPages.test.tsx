/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import { describe, expect, it } from 'vitest';
import {
  INVALID_PAGE_INDEX,
} from '@wearables-ui-toolkit/foundation/components/private/PagerAnimation';
import { PagerPages } from '@wearables-ui-toolkit/foundation/components/private/PagerPages';
import { PagerOrientation } from '@wearables-ui-toolkit/foundation/components/Pager.types';

function createRefs<T>(): MutableRefObject<T[]> {
  return { current: [] };
}

function renderPages(overrides = {}) {
  return render(
    <PagerPages
      pages={[<button key="one">One</button>, <button key="two">Two</button>]}
      pageRefs={createRefs<HTMLDivElement | null>()}
      internalIndex={0}
      pageCount={2}
      isTransitioning={false}
      previousIndex={INVALID_PAGE_INDEX}
      orientation={PagerOrientation.HORIZONTAL}
      peekState={null}
      getPageStyle={(index) => ({
        transform: `translate(${index * 100}px, 0px)`,
        opacity: index === 0 ? 1 : 0,
      })}
      {...overrides}
    />,
  );
}

describe('PagerPages', () => {
  it('renders pages with page labels and active hidden state', () => {
    const { container } = renderPages();

    const activePage = screen.getByRole('group', { name: 'Page 1 of 2' });
    expect(activePage).toHaveAttribute('aria-hidden', 'false');
    expect(activePage).toHaveAttribute('aria-roledescription', 'slide');
    expect(activePage).toHaveAttribute('data-uit-focus-section', 'true');
    expect(activePage).not.toHaveAttribute('inert');
    expect(activePage).not.toHaveClass('pageAnimated');
    const hiddenPage = container.querySelector('[data-page-index="1"]');
    expect(hiddenPage).toHaveAttribute('aria-label', 'Page 2 of 2');
    expect(hiddenPage).toHaveAttribute('aria-hidden', 'true');
    expect(hiddenPage).toHaveAttribute('inert');
    expect(hiddenPage).not.toHaveClass('pageAnimated');
  });

  it('leaves last-focused bookkeeping to page content', () => {
    const lastFocusedElementRef: MutableRefObject<HTMLElement | null> = {
      current: null,
    };

    renderPages({
      pages: [
        <div
          key="one"
          onFocusCapture={(event) => {
            if (event.target instanceof HTMLElement) {
              lastFocusedElementRef.current = event.target;
            }
          }}
        >
          <button>One</button>
        </div>,
        <button key="two">Two</button>,
      ],
    });

    screen.getByText('One').focus();
    expect(lastFocusedElementRef.current).toBe(screen.getByText('One'));
  });

  it('renders the peek scrim when peeking', () => {
    const { container } = renderPages({
      peekState: {
        outgoingIndex: 0,
        incomingIndex: 1,
        phase: 'peek',
      },
    });

    expect(container.querySelector('[class*="scrim"]')).not.toBeNull();
  });

  it('animates only the incoming and outgoing transition pages', () => {
    const { container } = renderPages({
      pages: [
        <button key="one">One</button>,
        <button key="two">Two</button>,
        <button key="three">Three</button>,
      ],
      internalIndex: 1,
      isTransitioning: true,
      pageCount: 3,
      previousIndex: 0,
    });

    expect(container.querySelector('[data-page-index="0"]')).toHaveClass(
      'pageAnimated',
    );
    expect(container.querySelector('[data-page-index="1"]')).toHaveClass(
      'pageAnimated',
    );
    expect(container.querySelector('[data-page-index="2"]')).toHaveClass(
      'pageHidden',
    );
    expect(container.querySelector('[data-page-index="2"]')).not.toHaveClass(
      'pageAnimated',
    );
  });
});
