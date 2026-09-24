/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Pager,
  PagerPage,
  Toast,
} from '@wearables-ui-toolkit/mrbd';
import { AllAppsPage } from './AllAppsPage';
import { APP_GRID_STYLES, type AppGridStyle } from './appGridStyle';
import { getAppsForGrid } from './launcherCatalog';

const originalScrollTo = HTMLElement.prototype.scrollTo;

beforeEach(() => {
  HTMLElement.prototype.scrollTo = vi.fn();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  HTMLElement.prototype.scrollTo = originalScrollTo;
});

describe('AllAppsPage variants', () => {
  it('keeps the existing tile grid and opts into the icon grid explicitly', () => {
    const apps = getAppsForGrid([]).slice(0, 3);
    const renderPage = (appGridStyle: AppGridStyle) => (
      <Pager currentPageIndex={0}>
        <PagerPage>
          <AllAppsPage
            appGridStyle={appGridStyle}
            apps={apps}
            consumePreviousGridHint={() => false}
            isActive
            isPinningApps={false}
            pinnedAppIds={[]}
            recentlyPinnedAppId={null}
            onLaunchApp={vi.fn()}
            onSetPinningMode={vi.fn()}
            onTogglePinned={vi.fn()}
          />
        </PagerPage>
      </Pager>
    );
    const view = render(renderPage(APP_GRID_STYLES.TWO_COLUMN_TILES));

    expect(view.container.querySelectorAll('.launcherAppTile')).toHaveLength(3);
    expect(view.container.querySelectorAll('.launcherIconGridSurface'))
      .toHaveLength(0);

    view.rerender(renderPage(APP_GRID_STYLES.THREE_COLUMN_ICONS));
    expect(view.container.querySelectorAll('.launcherAppTile')).toHaveLength(0);
    expect(view.container.querySelectorAll('.launcherIconGridSurface'))
      .toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Trail Guide, 1 of 3' }))
      .toBeInTheDocument();
  });

  it('shows the previous-grid hint once in a launcher session', () => {
    const apps = getAppsForGrid([]).slice(0, 3);
    const toastSpy = vi.spyOn(Toast, 'show').mockReturnValue(1);
    let hasShownPreviousGridHint = false;
    const consumePreviousGridHint = vi.fn(() => {
      if (hasShownPreviousGridHint) {
        return false;
      }
      hasShownPreviousGridHint = true;
      return true;
    });
    const renderPager = (currentPageIndex: number) => (
      <Pager animated={false} currentPageIndex={currentPageIndex}>
        <PagerPage>
          <div>Home</div>
        </PagerPage>
        <PagerPage>
          <AllAppsPage
            appGridStyle={APP_GRID_STYLES.THREE_COLUMN_ICONS}
            apps={apps}
            consumePreviousGridHint={consumePreviousGridHint}
            isActive={currentPageIndex === 1}
            isPinningApps={false}
            pinnedAppIds={[]}
            recentlyPinnedAppId={null}
            onLaunchApp={vi.fn()}
            onSetPinningMode={vi.fn()}
            onTogglePinned={vi.fn()}
          />
        </PagerPage>
      </Pager>
    );
    const view = render(renderPager(0));

    view.rerender(renderPager(1));
    expect(toastSpy).toHaveBeenCalledTimes(1);
    expect(toastSpy).toHaveBeenCalledWith(
      'Try the previous 2-column grid in Settings.',
    );

    view.rerender(renderPager(0));
    view.rerender(renderPager(1));
    expect(toastSpy).toHaveBeenCalledTimes(1);
    expect(consumePreviousGridHint).toHaveBeenCalledTimes(1);
  });

  it('shows the previous-grid hint when the app starts on All Apps', () => {
    const toastSpy = vi.spyOn(Toast, 'show').mockReturnValue(1);
    const consumePreviousGridHint = vi.fn(() => true);

    render(
      <Pager animated={false} currentPageIndex={0}>
        <PagerPage>
          <AllAppsPage
            appGridStyle={APP_GRID_STYLES.THREE_COLUMN_ICONS}
            apps={getAppsForGrid([]).slice(0, 3)}
            consumePreviousGridHint={consumePreviousGridHint}
            isActive
            isPinningApps={false}
            pinnedAppIds={[]}
            recentlyPinnedAppId={null}
            onLaunchApp={vi.fn()}
            onSetPinningMode={vi.fn()}
            onTogglePinned={vi.fn()}
          />
        </PagerPage>
      </Pager>,
    );

    expect(consumePreviousGridHint).toHaveBeenCalledOnce();
    expect(toastSpy).toHaveBeenCalledWith(
      'Try the previous 2-column grid in Settings.',
    );
  });
});
