/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Pager,
  PagerPage,
} from '@wearables-ui-toolkit/mrbd';
import { HomePage } from './HomePage';
import { HOME_CARDS } from './launcherCatalog';

afterEach(cleanup);

describe('HomePage', () => {
  it('uses WebAppIcon for notification artwork without changing activation', () => {
    const cards = HOME_CARDS.slice(0, 2);
    const onSelectCard = vi.fn();
    const { container } = render(
      <Pager animated={false} currentPageIndex={0}>
        <PagerPage>
          <HomePage
            cards={cards}
            currentPageIndex={1}
            onPageChange={vi.fn()}
            onSelectCard={onSelectCard}
          />
        </PagerPage>
      </Pager>,
    );

    const icons = container.querySelectorAll('.homeNotificationWebAppIcon');
    expect(icons).toHaveLength(2);
    expect(icons[0]).toHaveStyle({
      // Hardcoded so a wrong corner radius in the component fails here instead
      // of being recomputed into the expectation.
      borderRadius: '9999px',
      height: '64px',
      width: '64px',
    });

    fireEvent.click(screen.getByRole('button', {
      name: 'Plan a walking route. Open Trail Guide.',
    }));
    expect(onSelectCard).toHaveBeenCalledWith({
      type: 'launchApp',
      appId: 'trail-guide',
    });
  });
});
