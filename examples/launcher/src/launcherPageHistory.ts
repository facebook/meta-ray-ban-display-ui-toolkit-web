/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createHashHistoryMarker } from './hashHistoryMarker';

export const LAUNCHER_HISTORY_PAGES = {
  ALL_APPS: 'allApps',
  APP_GRID_STYLE: 'appGridStyle',
  QUICK_SETTINGS: 'quickSettings',
  SETTINGS: 'settings',
  UPPER_PANEL: 'upperPanel',
} as const;

export type LauncherDetailPage =
  | typeof LAUNCHER_HISTORY_PAGES.APP_GRID_STYLE
  | typeof LAUNCHER_HISTORY_PAGES.SETTINGS;
export type LauncherHistoryPage =
  (typeof LAUNCHER_HISTORY_PAGES)[keyof typeof LAUNCHER_HISTORY_PAGES];

const HISTORY_STATE_PAGE_KEY = 'uitLauncherPage';

const HISTORY_PAGE_VALUES: readonly string[] = Object.values(
  LAUNCHER_HISTORY_PAGES,
);

function isLauncherHistoryPage(value: string): value is LauncherHistoryPage {
  return HISTORY_PAGE_VALUES.includes(value);
}

/**
 * Detail pages are the pages reachable below Quick Settings, ordered by how
 * deep they sit. The depth drives the detail transition's direction, so this
 * table is the single place that ordering is expressed.
 */
const DETAIL_PAGE_DEPTHS: ReadonlyMap<LauncherDetailPage, number> = new Map([
  [LAUNCHER_HISTORY_PAGES.SETTINGS, 1],
  [LAUNCHER_HISTORY_PAGES.APP_GRID_STYLE, 2],
]);

// Records the marker in history.state and mints the entry a deep link never
// pushed, so Back from a deep-linked page stays inside the launcher document.
const marker = createHashHistoryMarker<LauncherHistoryPage>({
  prefix: '#uit-launcher-page=',
  isValidValue: isLauncherHistoryPage,
  stateKey: HISTORY_STATE_PAGE_KEY,
  mintMissingEntry: true,
});

export function getLauncherHistoryPage(): LauncherHistoryPage | null {
  return marker.getActive();
}

export function getLauncherDetailPage(
  page: LauncherHistoryPage | null = getLauncherHistoryPage(),
): LauncherDetailPage | null {
  return page != null && DETAIL_PAGE_DEPTHS.has(page as LauncherDetailPage)
    ? (page as LauncherDetailPage)
    : null;
}

export function getLauncherDetailPageDepth(
  page: LauncherDetailPage | null,
): number {
  return page == null ? 0 : (DETAIL_PAGE_DEPTHS.get(page) ?? 0);
}

export function pushLauncherPageHistory(page: LauncherHistoryPage): void {
  marker.push(page);
}

export function replaceLauncherPageHistory(page: LauncherHistoryPage): void {
  marker.replace(page);
}

export function ensureLauncherDetailPageHistory(page: LauncherDetailPage): void {
  if (window.history.state?.[HISTORY_STATE_PAGE_KEY] === page) {
    return;
  }

  replaceLauncherPageHistory(LAUNCHER_HISTORY_PAGES.QUICK_SETTINGS);
  if (page === LAUNCHER_HISTORY_PAGES.APP_GRID_STYLE) {
    pushLauncherPageHistory(LAUNCHER_HISTORY_PAGES.SETTINGS);
  }
  pushLauncherPageHistory(page);
}

export function popLauncherPageHistory(page: LauncherHistoryPage): boolean {
  return marker.pop(page);
}

/** Testing hook: resets the pushed-entry count (see hashHistoryMarker). */
export function resetLauncherPageHistoryForTesting(): void {
  marker.resetPushedEntryCountForTesting();
}
