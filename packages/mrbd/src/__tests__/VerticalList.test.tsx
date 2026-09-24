/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { VerticalList } from '@wearables-ui-toolkit/foundation/components/VerticalList';

describe('VerticalList', () => {
  it('keeps scrolling on the full-width viewport and spaces the row container', () => {
    const { container } = render(
      <VerticalList contentClassName="custom-content">
        <button>First row</button>
      </VerticalList>,
    );

    const scrollView = container.querySelector('[data-scroll-view="true"]');
    const content = screen.getByRole('button', { name: 'First row' }).parentElement;

    expect(scrollView).toBeInTheDocument();
    expect(content).toHaveClass('custom-content');
    expect(content?.className).toContain('content');
    expect(content).toHaveAttribute('data-uit-focus-boundary-root', 'true');
  });

  it('forwards header inset behavior and the scroll element ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <VerticalList ref={ref} insetForHeader headerHeight={72}>
        <button>First row</button>
      </VerticalList>,
    );

    const scrollView = container.querySelector<HTMLElement>(
      '[data-scroll-view="true"]',
    );

    expect(scrollView?.style.paddingTop).toBe(
      'calc(72px + var(--uit-page-content-origin-offset, 0px))',
    );
    expect(ref.current).toBe(scrollView);
  });
});
