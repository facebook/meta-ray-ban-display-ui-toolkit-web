/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getHistoryPageForHorizontalIndex,
  getHorizontalPageIndex,
  getVerticalPageIndex,
  ALL_APPS_PAGE_INDEX,
  HOME_PAGE_INDEX,
  HOME_PANEL_PAGE_INDEX,
  QUICK_SETTINGS_PAGE_INDEX,
  UPPER_PANEL_PAGE_INDEX,
} from './launcherPages';
import {
  isTransientModeHistoryActive,
  popTransientModeHistory,
  pushTransientModeHistory,
} from './transientModeHistory';

describe('launcher route/index table', () => {
  it.each([
    ['quickSettings', QUICK_SETTINGS_PAGE_INDEX],
    ['allApps', ALL_APPS_PAGE_INDEX],
    // Home has no marker of its own, and the Upper Panel is a vertical route,
    // so both resolve to the horizontal Home page.
    [null, HOME_PAGE_INDEX],
    ['upperPanel', HOME_PAGE_INDEX],
    // Detail pages live above Quick Settings rather than on a page of their own.
    ['settings', QUICK_SETTINGS_PAGE_INDEX],
    ['appGridStyle', QUICK_SETTINGS_PAGE_INDEX],
  ] as const)('maps %s to horizontal page %i', (page, index) => {
    expect(getHorizontalPageIndex(page)).toBe(index);
  });

  it.each([
    ['upperPanel', UPPER_PANEL_PAGE_INDEX],
    ['quickSettings', HOME_PANEL_PAGE_INDEX],
    [null, HOME_PANEL_PAGE_INDEX],
  ] as const)('maps %s to vertical page %i', (page, index) => {
    expect(getVerticalPageIndex(page)).toBe(index);
  });

  it.each([
    [QUICK_SETTINGS_PAGE_INDEX, 'quickSettings'],
    [ALL_APPS_PAGE_INDEX, 'allApps'],
    [HOME_PAGE_INDEX, null],
  ] as const)('maps horizontal page %i back to %s', (index, page) => {
    expect(getHistoryPageForHorizontalIndex(index)).toBe(page);
  });

  it('round-trips every horizontal route through both directions', () => {
    for (const index of [
      QUICK_SETTINGS_PAGE_INDEX,
      HOME_PAGE_INDEX,
      ALL_APPS_PAGE_INDEX,
    ]) {
      expect(
        getHorizontalPageIndex(getHistoryPageForHorizontalIndex(index)),
      ).toBe(index);
    }
  });
});

describe('transient mode history on the shared marker', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('marks and clears a mode by hash alone', () => {
    pushTransientModeHistory('appPinning');

    expect(window.location.hash).toBe('#uit-launcher-mode=appPinning');
    expect(isTransientModeHistoryActive('appPinning')).toBe(true);
    expect(isTransientModeHistoryActive('quickSettingsSlider')).toBe(false);
  });

  it('records no history state, unlike the page marker', () => {
    pushTransientModeHistory('quickSettingsSlider');

    // A transient mode is identified by hash only. Writing a state key here
    // would make a deep-linked mode look like one this module pushed.
    expect(window.history.state).toBeNull();
  });

  it('pops only the matching mode, and never mints a missing entry', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const pushState = vi.spyOn(window.history, 'pushState');
    window.history.replaceState(null, '', '#uit-launcher-mode=appPinning');
    pushState.mockClear();

    expect(popTransientModeHistory('quickSettingsSlider')).toBe(false);
    expect(back).not.toHaveBeenCalled();

    expect(popTransientModeHistory('appPinning')).toBe(true);
    expect(back).toHaveBeenCalledOnce();
    // The page marker mints a parent entry for a deep link; a visible transient
    // mode must not move history, so nothing is pushed here.
    expect(pushState).not.toHaveBeenCalled();

    pushState.mockRestore();
    back.mockRestore();
  });
});
