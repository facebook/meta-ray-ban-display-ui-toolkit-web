/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo, useReducer } from 'react';
import {
  DEFAULT_PINNED_APP_IDS,
  HOME_CARDS,
  getAppsForGrid,
  getLauncherApp,
  type AppId,
  type HomeCard,
  type HomeCardAction,
  type LauncherApp,
} from './launcherCatalog';

export type {
  AppId,
  HomeCard,
  HomeCardAction,
  LauncherApp,
} from './launcherCatalog';

export interface QuickSettingsState {
  audioOnly: boolean;
  brightness: number;
  doNotDisturb: boolean;
  volume: number;
}

export interface LauncherModelState {
  isPinningApps: boolean;
  lastAction: string;
  pinnedAppIds: readonly AppId[];
  quickSettings: QuickSettingsState;
  recentlyPinnedAppId: AppId | null;
}

export type LauncherAction =
  | { type: 'announce'; message: string }
  | { type: 'launchApp'; appId: AppId }
  | { type: 'setPinningMode'; enabled: boolean }
  | { type: 'setAppPinned'; appId: AppId; pinned: boolean }
  | { type: 'toggleAppPinned'; appId: AppId }
  | { type: 'setBrightness'; value: number }
  | { type: 'setVolume'; value: number }
  | { type: 'toggleAudioOnly' }
  | { type: 'toggleDoNotDisturb' };

export const INITIAL_LAUNCHER_STATE: LauncherModelState = {
  isPinningApps: false,
  lastAction: 'Launcher ready',
  pinnedAppIds: DEFAULT_PINNED_APP_IDS,
  quickSettings: {
    audioOnly: false,
    brightness: 0.66,
    doNotDisturb: false,
    volume: 0.34,
  },
  recentlyPinnedAppId: null,
};

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function launcherReducer(
  state: LauncherModelState,
  action: LauncherAction,
): LauncherModelState {
  switch (action.type) {
    case 'announce':
      return { ...state, lastAction: action.message };
    case 'launchApp':
      return {
        ...state,
        lastAction: `Launch ${getLauncherApp(action.appId).title}`,
      };
    case 'setPinningMode':
      return {
        ...state,
        isPinningApps: action.enabled,
        lastAction: action.enabled ? 'Manage pins' : 'Done',
        recentlyPinnedAppId: action.enabled ? state.recentlyPinnedAppId : null,
      };
    case 'setAppPinned': {
      const isPinned = state.pinnedAppIds.includes(action.appId);
      if (isPinned === action.pinned) {
        // A redundant request changes no pins, so it must not announce an
        // action or clear the highlight another app owns.
        return state;
      }
      const app = getLauncherApp(action.appId);
      return {
        ...state,
        lastAction: `${action.pinned ? 'Pinned' : 'Unpinned'} ${app.title}`,
        pinnedAppIds: action.pinned
          ? [...state.pinnedAppIds, action.appId]
          : state.pinnedAppIds.filter(id => id !== action.appId),
        recentlyPinnedAppId: action.pinned
          ? action.appId
          : state.recentlyPinnedAppId === action.appId
            ? null
            : state.recentlyPinnedAppId,
      };
    }
    case 'toggleAppPinned': {
      const app = getLauncherApp(action.appId);
      const isPinned = state.pinnedAppIds.includes(action.appId);
      return {
        ...state,
        lastAction: `${isPinned ? 'Unpinned' : 'Pinned'} ${app.title}`,
        pinnedAppIds: isPinned
          ? state.pinnedAppIds.filter(id => id !== action.appId)
          : [...state.pinnedAppIds, action.appId],
        recentlyPinnedAppId: isPinned ? null : action.appId,
      };
    }
    case 'setBrightness':
      return {
        ...state,
        lastAction: 'Set brightness',
        quickSettings: {
          ...state.quickSettings,
          brightness: clampProgress(action.value),
        },
      };
    case 'setVolume':
      return {
        ...state,
        lastAction: 'Set volume',
        quickSettings: {
          ...state.quickSettings,
          volume: clampProgress(action.value),
        },
      };
    case 'toggleAudioOnly': {
      const audioOnly = !state.quickSettings.audioOnly;
      return {
        ...state,
        lastAction: audioOnly ? 'Audio only enabled' : 'Audio only disabled',
        quickSettings: { ...state.quickSettings, audioOnly },
      };
    }
    case 'toggleDoNotDisturb': {
      const doNotDisturb = !state.quickSettings.doNotDisturb;
      return {
        ...state,
        lastAction: doNotDisturb
          ? 'Do not disturb enabled'
          : 'Do not disturb disabled',
        quickSettings: { ...state.quickSettings, doNotDisturb },
      };
    }
  }
}

export interface LauncherState extends LauncherModelState {
  apps: readonly LauncherApp[];
  homeCards: readonly HomeCard[];
  launchApp: (id: AppId) => void;
  performHomeCardAction: (action: HomeCardAction) => void;
  setAppPinningMode: (enabled: boolean) => void;
  setAppPinned: (id: AppId, pinned: boolean) => void;
  setBrightness: (value: number) => void;
  setVolume: (value: number) => void;
  toggleAppPinned: (id: AppId) => void;
  toggleAudioOnly: () => void;
  toggleDoNotDisturb: () => void;
  triggerAction: (message: string) => void;
}

export function useLauncherState(): LauncherState {
  const [state, dispatch] = useReducer(launcherReducer, INITIAL_LAUNCHER_STATE);
  const apps = useMemo(
    () => getAppsForGrid(state.pinnedAppIds),
    [state.pinnedAppIds],
  );
  const launchApp = useCallback((appId: AppId) => {
    dispatch({ type: 'launchApp', appId });
  }, []);
  const performHomeCardAction = useCallback((action: HomeCardAction) => {
    dispatch(action.type === 'launchApp'
      ? { type: 'launchApp', appId: action.appId }
      : { type: 'announce', message: action.message });
  }, []);
  const setAppPinningMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'setPinningMode', enabled });
  }, []);
  const setAppPinned = useCallback((appId: AppId, pinned: boolean) => {
    dispatch({ type: 'setAppPinned', appId, pinned });
  }, []);
  const setBrightness = useCallback((value: number) => {
    dispatch({ type: 'setBrightness', value });
  }, []);
  const setVolume = useCallback((value: number) => {
    dispatch({ type: 'setVolume', value });
  }, []);
  const toggleAppPinned = useCallback((appId: AppId) => {
    dispatch({ type: 'toggleAppPinned', appId });
  }, []);
  const toggleAudioOnly = useCallback(() => {
    dispatch({ type: 'toggleAudioOnly' });
  }, []);
  const toggleDoNotDisturb = useCallback(() => {
    dispatch({ type: 'toggleDoNotDisturb' });
  }, []);
  const triggerAction = useCallback((message: string) => {
    dispatch({ type: 'announce', message });
  }, []);

  return useMemo(() => ({
    ...state,
    apps,
    homeCards: HOME_CARDS,
    launchApp,
    performHomeCardAction,
    setAppPinningMode,
    setAppPinned,
    setBrightness,
    setVolume,
    toggleAppPinned,
    toggleAudioOnly,
    toggleDoNotDisturb,
    triggerAction,
  }), [
    apps,
    launchApp,
    performHomeCardAction,
    setAppPinningMode,
    setAppPinned,
    setBrightness,
    setVolume,
    state,
    toggleAppPinned,
    toggleAudioOnly,
    toggleDoNotDisturb,
    triggerAction,
  ]);
}
