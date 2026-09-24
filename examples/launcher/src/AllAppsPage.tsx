/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import {
  NavigationDirection,
  ScrollView,
  Toast,
  usePagerPageLifecycle,
  type PagerInitialFocusRequest,
} from '@wearables-ui-toolkit/mrbd';
import type { AppId, LauncherApp } from './launcherCatalog';
import {
  APP_GRID_STYLES,
  type AppGridStyle,
} from './appGridStyle';
import { LauncherAppTile } from './LauncherAppTile';
import { LauncherIconGridTile } from './LauncherIconGridTile';
import { LauncherSmallButton } from './LauncherSmallButton';
import { PinGlyph } from './ControlGlyph';
import {
  classNames,
  focusLauncherElement,
  usePrefersReducedMotion,
} from './launcherUtils';

const REORDER_DURATION_MS = 260;
const REORDER_EASING = 'cubic-bezier(0.68, 0, 0.29, 1)';
const ICON_GRID_ENTRANCE_DURATION_MS = 350;
const ICON_GRID_COLUMN_COUNT = 3;
const ICON_GRID_ENTRANCE_ROW_COUNT = 4;
const SCROLL_POSITION_TOP_OFFSET = 83;
const PREVIOUS_APP_GRID_HINT =
  'Try the previous 2-column grid in Settings.';

interface SlotRect {
  left: number;
  top: number;
}

function getSlotRects(root: HTMLElement | null): Map<AppId, SlotRect> {
  const rects = new Map<AppId, SlotRect>();
  root
    ?.querySelectorAll<HTMLElement>('[data-launcher-app-tile-slot]')
    .forEach(element => {
      const appId = element.dataset.launcherAppTileSlot as AppId | undefined;
      if (appId != null) {
        const rect = element.getBoundingClientRect();
        rects.set(appId, { left: rect.left, top: rect.top });
      }
    });
  return rects;
}

function scrollSlotIntoView(
  scrollElement: HTMLElement,
  slotElement: HTMLElement,
): void {
  const scrollRect = scrollElement.getBoundingClientRect();
  const slotRect = slotElement.getBoundingClientRect();
  if (slotRect.top >= scrollRect.top && slotRect.bottom <= scrollRect.bottom) {
    return;
  }
  const grid = slotElement.parentElement;
  const paddingTop = grid == null
    ? Number.NaN
    : Number.parseFloat(window.getComputedStyle(grid).paddingTop);
  const targetTop = Number.isFinite(paddingTop)
    ? paddingTop
    : SCROLL_POSITION_TOP_OFFSET;
  const maxScrollTop = Math.max(
    0,
    scrollElement.scrollHeight - scrollElement.clientHeight,
  );
  scrollElement.scrollTo({
    top: Math.max(0, Math.min(slotElement.offsetTop - targetTop, maxScrollTop)),
    behavior: 'auto',
  });
}

export const AllAppsPage = memo(function AllAppsPage({
  appGridStyle,
  apps,
  isPinningApps,
  pinnedAppIds,
  recentlyPinnedAppId,
  consumePreviousGridHint,
  isActive,
  onLaunchApp,
  onSetPinningMode,
  onTogglePinned,
}: {
  appGridStyle: AppGridStyle;
  apps: readonly LauncherApp[];
  isPinningApps: boolean;
  pinnedAppIds: readonly AppId[];
  recentlyPinnedAppId: AppId | null;
  consumePreviousGridHint: () => boolean;
  isActive: boolean;
  onLaunchApp: (id: AppId) => void;
  onSetPinningMode: (enabled: boolean) => void;
  onTogglePinned: (id: AppId) => void;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  const lastFocusedAppIndexRef = useRef<number | null>(null);
  const rectsBeforeReorderRef = useRef<Map<AppId, SlotRect> | null>(null);
  const entranceCleanupTimeoutRef = useRef<number | null>(null);
  const hasHandledPreviousGridHintRef = useRef(false);
  const appOrderKey = apps.map(app => app.id).join('|');
  const pinnedIds = useMemo(() => new Set(pinnedAppIds), [pinnedAppIds]);
  const usesIconGrid = appGridStyle === APP_GRID_STYLES.THREE_COLUMN_ICONS;

  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  const focusAppAtIndex = useCallback((index: number): boolean => {
    const app = apps[index];
    if (app == null) {
      return false;
    }
    const slot = gridRef.current?.querySelector<HTMLElement>(
      `[data-launcher-app-tile-slot="${app.id}"]`,
    );
    const tile = slot?.querySelector<HTMLElement>(
      `[data-uit-capture-id="launcher-app-${app.id}"]`,
    );
    return focusLauncherElement(tile ?? slot ?? null);
  }, [apps]);
  const recordFocusedApp = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement) || gridRef.current == null) {
      return;
    }
    const slot = target.closest<HTMLElement>('[data-launcher-app-tile-slot]');
    const appId = slot?.dataset.launcherAppTileSlot as AppId | undefined;
    const index = apps.findIndex(app => app.id === appId);
    if (slot != null && gridRef.current.contains(slot) && index >= 0) {
      lastFocusedAppIndexRef.current = index;
    }
  }, [apps]);
  const onRequestInitialFocus = useCallback((request: PagerInitialFocusRequest) => {
    if (
      request.direction === NavigationDirection.UP ||
      request.direction === NavigationDirection.DOWN ||
      request.direction === NavigationDirection.BACK
    ) {
      return true;
    }
    const previousIndex = lastFocusedAppIndexRef.current;
    if (previousIndex != null && focusAppAtIndex(previousIndex)) {
      return true;
    }
    return focusAppAtIndex(
      request.direction === NavigationDirection.RIGHT && apps.length > 1 ? 1 : 0,
    );
  }, [apps.length, focusAppAtIndex]);
  const clearIconGridEntrance = useCallback(() => {
    if (entranceCleanupTimeoutRef.current != null) {
      window.clearTimeout(entranceCleanupTimeoutRef.current);
      entranceCleanupTimeoutRef.current = null;
    }
    const grid = gridRef.current;
    grid?.classList.remove('allAppsGridEntering');
    grid
      ?.querySelectorAll<HTMLElement>('[data-launcher-app-tile-slot]')
      .forEach(slot => {
        delete slot.dataset.iconGridEntrance;
        slot.style.removeProperty('--launcher-icon-grid-entrance-delay');
        slot.style.removeProperty('--launcher-icon-grid-entrance-offset');
      });
  }, []);
  const onWillHidePage = useCallback(() => {
    recordFocusedApp(document.activeElement);
    clearIconGridEntrance();
    if (isPinningApps) {
      onSetPinningMode(false);
    }
  }, [clearIconGridEntrance, isPinningApps, onSetPinningMode, recordFocusedApp]);
  const restartIconGridEntrance = useCallback(() => {
    clearIconGridEntrance();
    if (!usesIconGrid || prefersReducedMotionRef.current) {
      return;
    }
    const grid = gridRef.current;
    if (grid == null) {
      return;
    }
    const scrollRect = scrollViewRef.current?.getBoundingClientRect();
    const slots = Array.from(
      grid.querySelectorAll<HTMLElement>('[data-launcher-app-tile-slot]'),
    );
    const firstVisibleIndex = scrollRect == null
      ? 0
      : Math.max(0, slots.findIndex(slot => {
          const rect = slot.getBoundingClientRect();
          return rect.bottom > scrollRect.top && rect.top < scrollRect.bottom;
        }));
    const columnCount = ICON_GRID_COLUMN_COUNT;
    const firstVisibleRow = Math.floor(firstVisibleIndex / columnCount);
    const firstAnimatedIndex = firstVisibleRow * columnCount;
    const animatedSlotCount = ICON_GRID_ENTRANCE_ROW_COUNT * columnCount;
    let lastRelativeRow = 0;
    slots.forEach((slot, index) => {
      const animatedIndex = index - firstAnimatedIndex;
      if (animatedIndex < 0 || animatedIndex >= animatedSlotCount) {
        delete slot.dataset.iconGridEntrance;
        slot.style.removeProperty('--launcher-icon-grid-entrance-delay');
        slot.style.removeProperty('--launcher-icon-grid-entrance-offset');
        return;
      }
      const relativeRow = Math.floor(index / columnCount) - firstVisibleRow;
      lastRelativeRow = Math.max(lastRelativeRow, relativeRow);
      slot.dataset.iconGridEntrance = 'true';
      slot.style.setProperty(
        '--launcher-icon-grid-entrance-delay',
        `${relativeRow * 60}ms`,
      );
      slot.style.setProperty(
        '--launcher-icon-grid-entrance-offset',
        `${relativeRow * 80}px`,
      );
    });
    void grid.offsetWidth;
    grid.classList.add('allAppsGridEntering');
    entranceCleanupTimeoutRef.current = window.setTimeout(
      clearIconGridEntrance,
      ICON_GRID_ENTRANCE_DURATION_MS + lastRelativeRow * 60,
    );
  }, [clearIconGridEntrance, usesIconGrid]);
  const showPreviousGridHint = useCallback(() => {
    if (!usesIconGrid || hasHandledPreviousGridHintRef.current) {
      return;
    }
    if (!consumePreviousGridHint()) {
      return;
    }
    hasHandledPreviousGridHintRef.current = true;
    Toast.show(PREVIOUS_APP_GRID_HINT);
  }, [consumePreviousGridHint, usesIconGrid]);
  useEffect(() => {
    if (isActive) {
      showPreviousGridHint();
    }
  }, [isActive, showPreviousGridHint]);
  const onWillShowPage = useCallback(() => {
    restartIconGridEntrance();
    showPreviousGridHint();
  }, [restartIconGridEntrance, showPreviousGridHint]);
  usePagerPageLifecycle(useMemo(() => ({
    onRequestInitialFocus,
    onWillShowPage,
    onWillHidePage,
  }), [
    onRequestInitialFocus,
    onWillShowPage,
    onWillHidePage,
  ]));

  const handleTogglePinned = (id: AppId) => {
    clearIconGridEntrance();
    rectsBeforeReorderRef.current = getSlotRects(gridRef.current);
    onTogglePinned(id);
  };

  useLayoutEffect(() => {
    scrollViewRef.current?.scrollTo({
      top: 0,
      behavior: prefersReducedMotionRef.current ? 'auto' : 'smooth',
    });
  }, [isPinningApps]);

  useLayoutEffect(() => {
    if (!isPinningApps || recentlyPinnedAppId == null) {
      return;
    }
    const slot = gridRef.current?.querySelector<HTMLElement>(
      `[data-launcher-app-tile-slot="${recentlyPinnedAppId}"]`,
    );
    const scrollElement = scrollViewRef.current;
    const tile = slot?.querySelector<HTMLElement>(
      `[data-uit-capture-id="launcher-app-${recentlyPinnedAppId}"]`,
    );
    if (slot == null || scrollElement == null || tile == null) {
      return;
    }
    scrollSlotIntoView(scrollElement, slot);
    const frameId = window.requestAnimationFrame(() => {
      tile.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [appOrderKey, isPinningApps, recentlyPinnedAppId]);

  useLayoutEffect(() => {
    const previousRects = rectsBeforeReorderRef.current;
    rectsBeforeReorderRef.current = null;
    if (previousRects == null || prefersReducedMotion) {
      return;
    }
    // Animate from the previous layout rect to the new one after pinned apps
    // move to the front of the catalog.
    gridRef.current
      ?.querySelectorAll<HTMLElement>('[data-launcher-app-tile-slot]')
      .forEach(element => {
        const appId = element.dataset.launcherAppTileSlot as AppId | undefined;
        const previous = appId == null ? null : previousRects.get(appId);
        if (previous == null) {
          return;
        }
        const current = element.getBoundingClientRect();
        const deltaX = previous.left - current.left;
        const deltaY = previous.top - current.top;
        if (Math.abs(deltaX) >= 0.5 || Math.abs(deltaY) >= 0.5) {
          element.animate(
            [
              { transform: `translate(${deltaX}px, ${deltaY}px)` },
              { transform: 'translate(0, 0)' },
            ],
            { duration: REORDER_DURATION_MS, easing: REORDER_EASING },
          );
        }
      });
  }, [appOrderKey, prefersReducedMotion]);

  useLayoutEffect(() => {
    if (!isActive) {
      clearIconGridEntrance();
      return;
    }
    restartIconGridEntrance();
    return clearIconGridEntrance;
  }, [clearIconGridEntrance, isActive, restartIconGridEntrance]);

  return (
    <section
      className={classNames(
        'launcherPage',
        'allAppsPage',
        isPinningApps && 'allAppsPagePinning',
        usesIconGrid && 'allAppsPageIconGrid',
      )}
      aria-label="All apps"
      onFocusCapture={event => recordFocusedApp(event.target)}
    >
      <ScrollView
        ref={scrollViewRef}
        ariaLabel="All apps"
        bottomFadingEdgeLength={64}
        className="allAppsScrollView"
        height={isPinningApps ? 'calc(100% - 77px)' : '100%'}
        topFadingEdgeLength={usesIconGrid ? 100 : 64}
        width="100%"
      >
        <div
          ref={gridRef}
          className={classNames(
            'allAppsGrid',
            usesIconGrid && 'allAppsGridIconGrid',
          )}
        >
          {apps.map((app, index) => (
            <div
              key={app.id}
              className={classNames(
                'launcherAppTileSlot',
                usesIconGrid && 'launcherIconGridTileSlot',
              )}
              data-launcher-app-tile-slot={app.id}
            >
              {usesIconGrid
                ? (
                  <LauncherIconGridTile
                    app={app}
                    isPinned={pinnedIds.has(app.id)}
                    isPinningMode={isPinningApps}
                    itemCount={apps.length}
                    itemPosition={index + 1}
                    onLaunch={onLaunchApp}
                    onTogglePinned={handleTogglePinned}
                  />
                )
                : (
                  <LauncherAppTile
                    app={app}
                    isPinned={pinnedIds.has(app.id)}
                    isPinningMode={isPinningApps}
                    onLaunch={onLaunchApp}
                    onTogglePinned={handleTogglePinned}
                  />
                )}
            </div>
          ))}
          {!isPinningApps && (
            <div className="allAppsManagePinsItem">
              <LauncherSmallButton
                className="allAppsManagePinsButton"
                icon={<PinGlyph className="launcherSmallButtonIcon" />}
                onClick={() => onSetPinningMode(true)}
                title="Manage pins"
              />
            </div>
          )}
        </div>
      </ScrollView>
      {isPinningApps && (
        <div className="allAppsDoneButtonBar">
          <LauncherSmallButton
            className="allAppsDoneButton"
            onClick={() => onSetPinningMode(false)}
            title="Done"
          />
        </div>
      )}
    </section>
  );
});
