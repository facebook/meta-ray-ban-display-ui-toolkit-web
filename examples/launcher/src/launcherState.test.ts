/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { findLauncherApp, getAppsForGrid } from './launcherCatalog';
import {
  INITIAL_LAUNCHER_STATE,
  launcherReducer,
  type LauncherModelState,
} from './launcherState';

function stateWith(
  overrides: Partial<LauncherModelState> = {},
): LauncherModelState {
  return {
    ...INITIAL_LAUNCHER_STATE,
    quickSettings: { ...INITIAL_LAUNCHER_STATE.quickSettings },
    ...overrides,
  };
}

describe('launcherReducer', () => {
  it('pins and unpins an app without mutating the previous state', () => {
    const state = stateWith({ pinnedAppIds: ['trail-guide'] });
    Object.freeze(state);
    Object.freeze(state.pinnedAppIds);

    const pinned = launcherReducer(state, {
      type: 'toggleAppPinned',
      appId: 'reader',
    });
    const unpinned = launcherReducer(pinned, {
      type: 'toggleAppPinned',
      appId: 'reader',
    });

    expect(pinned.pinnedAppIds).toEqual(['trail-guide', 'reader']);
    expect(pinned.recentlyPinnedAppId).toBe('reader');
    expect(pinned.lastAction).toBe('Pinned Reader');
    expect(unpinned.pinnedAppIds).toEqual(['trail-guide']);
    expect(unpinned.recentlyPinnedAppId).toBeNull();
  });

  it('sets pinned state explicitly without duplicating an app', () => {
    const state = stateWith({ pinnedAppIds: ['trail-guide'] });
    const pinned = launcherReducer(state, {
      type: 'setAppPinned',
      appId: 'reader',
      pinned: true,
    });
    const pinnedAgain = launcherReducer(pinned, {
      type: 'setAppPinned',
      appId: 'reader',
      pinned: true,
    });

    expect(pinnedAgain.pinnedAppIds).toEqual(['trail-guide', 'reader']);
    expect(pinnedAgain.lastAction).toBe('Pinned Reader');
  });

  it('leaves state untouched when a pin request changes nothing', () => {
    const state = stateWith({
      pinnedAppIds: ['trail-guide', 'reader'],
      lastAction: 'Pinned Reader',
      recentlyPinnedAppId: 'reader',
    });

    const repinned = launcherReducer(state, {
      type: 'setAppPinned',
      appId: 'reader',
      pinned: true,
    });
    const unpinnedMissing = launcherReducer(state, {
      type: 'setAppPinned',
      appId: 'camera',
      pinned: false,
    });

    expect(repinned).toBe(state);
    expect(unpinnedMissing).toBe(state);
  });

  it('keeps another app’s pin highlight when a different app is unpinned', () => {
    const state = stateWith({
      pinnedAppIds: ['trail-guide', 'reader'],
      recentlyPinnedAppId: 'reader',
    });

    const unpinnedOther = launcherReducer(state, {
      type: 'setAppPinned',
      appId: 'trail-guide',
      pinned: false,
    });

    expect(unpinnedOther.pinnedAppIds).toEqual(['reader']);
    expect(unpinnedOther.recentlyPinnedAppId).toBe('reader');
  });

  it('clamps slider values to their supported range', () => {
    const tooBright = launcherReducer(stateWith(), {
      type: 'setBrightness',
      value: 2,
    });
    const tooQuiet = launcherReducer(tooBright, {
      type: 'setVolume',
      value: -1,
    });

    expect(tooBright.quickSettings.brightness).toBe(1);
    expect(tooQuiet.quickSettings.volume).toBe(0);
  });

  it('clears transient pin focus when pinning mode closes', () => {
    const state = stateWith({
      isPinningApps: true,
      recentlyPinnedAppId: 'reader',
    });

    expect(launcherReducer(state, {
      type: 'setPinningMode',
      enabled: false,
    })).toMatchObject({
      isPinningApps: false,
      lastAction: 'Done',
      recentlyPinnedAppId: null,
    });
  });
});

describe('getAppsForGrid', () => {
  it('finds app tiles by id or display title', () => {
    expect(findLauncherApp('trail guide')?.id).toBe('trail-guide');
    expect(findLauncherApp('color-grid')?.title).toBe('Color Grid');
    expect(findLauncherApp('missing')).toBeUndefined();
  });

  it('places pinned apps first without duplicating catalog entries', () => {
    const apps = getAppsForGrid(['reader', 'reader', 'camera']);

    expect(apps.slice(0, 2).map(app => app.id)).toEqual(['reader', 'camera']);
    expect(new Set(apps.map(app => app.id)).size).toBe(apps.length);
  });
});
