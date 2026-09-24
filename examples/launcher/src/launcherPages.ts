/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  getLauncherDetailPage,
  LAUNCHER_HISTORY_PAGES,
} from './launcherPageHistory';
import type { LauncherHistoryPage } from './launcherPageHistory';

export const QUICK_SETTINGS_PAGE_INDEX = 0;
export const HOME_PAGE_INDEX = 1;
export const ALL_APPS_PAGE_INDEX = 2;

export const UPPER_PANEL_PAGE_INDEX = 0;
export const HOME_PANEL_PAGE_INDEX = 1;

/**
 * The one place the launcher's routes and Pager indices are related.
 *
 * Every page the horizontal Pager can show has a history page; Home is the
 * page with no marker, which is why its entry maps to `null`. The vertical
 * Pager has the same relationship for the Upper Panel. Deriving both
 * directions from this table keeps a route rename or a page insertion from
 * having to be mirrored across the hook.
 */
const HORIZONTAL_PAGE_ROUTES: readonly (readonly [
  number,
  LauncherHistoryPage | null,
])[] = [
  [QUICK_SETTINGS_PAGE_INDEX, LAUNCHER_HISTORY_PAGES.QUICK_SETTINGS],
  [HOME_PAGE_INDEX, null],
  [ALL_APPS_PAGE_INDEX, LAUNCHER_HISTORY_PAGES.ALL_APPS],
];

/**
 * Which horizontal Pager page a history page is shown on.
 *
 * Detail pages live above Quick Settings, so they resolve to that page rather
 * than to one of their own.
 */
export function getHorizontalPageIndex(
  historyPage: LauncherHistoryPage | null,
): number {
  if (getLauncherDetailPage(historyPage) != null) {
    return QUICK_SETTINGS_PAGE_INDEX;
  }
  const match = HORIZONTAL_PAGE_ROUTES.find(
    ([, route]) => route === historyPage,
  );
  return match?.[0] ?? HOME_PAGE_INDEX;
}

/** Which vertical Pager page a history page is shown on. */
export function getVerticalPageIndex(
  historyPage: LauncherHistoryPage | null,
): number {
  return historyPage === LAUNCHER_HISTORY_PAGES.UPPER_PANEL
    ? UPPER_PANEL_PAGE_INDEX
    : HOME_PANEL_PAGE_INDEX;
}

/**
 * The history page a horizontal Pager index represents, or `null` for Home,
 * which is the route with no marker of its own.
 */
export function getHistoryPageForHorizontalIndex(
  pageIndex: number,
): LauncherHistoryPage | null {
  return (
    HORIZONTAL_PAGE_ROUTES.find(([index]) => index === pageIndex)?.[1] ?? null
  );
}
