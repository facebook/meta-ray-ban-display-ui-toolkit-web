/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { App } from '@wearables-ui-toolkit/mrbd/App';
import { PageTransition } from '@wearables-ui-toolkit/mrbd';
import { useWebMcpTools } from '../../shared/webmcp';
import { AdjustmentPage } from './AdjustmentPage';
import { applyPreferenceInput } from './alphaLauncherPreferences';
import { AppMaterialProvider } from './AppMaterialTheme';
import { LauncherRail } from './LauncherRail';
import { NotificationsPage } from './NotificationsPage';
import { SettingsPage } from './SettingsPage';
import { useLauncherNavigation } from './useLauncherNavigation';

const INITIAL_BRIGHTNESS = 0.7;
const INITIAL_VOLUME = 0.6;
const BRIGHTNESS_KEY = 'alpha-launcher-brightness';
const VOLUME_KEY = 'alpha-launcher-volume';

function getStoredValue(key: string, fallback: number): number {
  const storedValue = window.sessionStorage.getItem(key);
  if (storedValue == null) {
    return fallback;
  }

  const value = Number(storedValue);
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
}

export function AlphaLauncherApp() {
  const navigation = useLauncherNavigation();
  const [brightness, setBrightness] = useState(() =>
    getStoredValue(BRIGHTNESS_KEY, INITIAL_BRIGHTNESS));
  const [volume, setVolume] = useState(() =>
    getStoredValue(VOLUME_KEY, INITIAL_VOLUME));
  const [isDoNotDisturbEnabled, setIsDoNotDisturbEnabled] = useState(false);
  const preferencesRef = useRef({
    brightness,
    volume,
    doNotDisturb: isDoNotDisturbEnabled,
  });

  const handleBrightnessChanged = useCallback((value: number) => {
    preferencesRef.current = {...preferencesRef.current, brightness: value};
    window.sessionStorage.setItem(BRIGHTNESS_KEY, String(value));
    setBrightness(value);
  }, []);

  const handleVolumeChanged = useCallback((value: number) => {
    preferencesRef.current = {...preferencesRef.current, volume: value};
    window.sessionStorage.setItem(VOLUME_KEY, String(value));
    setVolume(value);
  }, []);

  const handleDoNotDisturbChanged = useCallback((enabled: boolean) => {
    preferencesRef.current = {...preferencesRef.current, doNotDisturb: enabled};
    setIsDoNotDisturbEnabled(enabled);
  }, []);

  const preferenceTools = useMemo(() => [{
    name: 'set_display_preferences',
    description:
      'Sets brightness, volume, or Do Not Disturb in the Alpha Launcher sample.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        brightnessPercent: {
          type: 'number' as const,
          description: 'Brightness percentage from 0 through 100.',
        },
        volumePercent: {
          type: 'number' as const,
          description: 'Volume percentage from 0 through 100.',
        },
        doNotDisturb: {
          type: 'boolean' as const,
          description: 'Whether Do Not Disturb is enabled.',
        },
      },
    },
    execute: (input: Record<string, unknown>) => {
      const result = applyPreferenceInput(preferencesRef.current, input);
      if (!result.ok) {
        return {
          ...result,
          next_action: 'Ask for a valid display preference.',
        };
      }

      preferencesRef.current = result.preferences;
      if (Object.prototype.hasOwnProperty.call(input, 'brightnessPercent')) {
        handleBrightnessChanged(result.preferences.brightness);
      }
      if (Object.prototype.hasOwnProperty.call(input, 'volumePercent')) {
        handleVolumeChanged(result.preferences.volume);
      }
      if (Object.prototype.hasOwnProperty.call(input, 'doNotDisturb')) {
        handleDoNotDisturbChanged(result.preferences.doNotDisturb);
      }
      return {
        brightnessPercent: Math.round(result.preferences.brightness * 100),
        volumePercent: Math.round(result.preferences.volume * 100),
        doNotDisturb: result.preferences.doNotDisturb,
        next_action: 'Confirm the display preferences were updated.',
      };
    },
  }], [
    handleBrightnessChanged,
    handleDoNotDisturbChanged,
    handleVolumeChanged,
  ]);
  useWebMcpTools(preferenceTools);

  let pageContent: ReactNode;
  if (navigation.activePage == null) {
    pageContent = (
      <LauncherRail
        railRef={navigation.buttonRailRef}
        notificationsButtonRef={navigation.notificationsButtonRef}
        railFocusTarget={navigation.railFocusTarget}
        brightness={brightness}
        volume={volume}
        isDoNotDisturbEnabled={isDoNotDisturbEnabled}
        onDoNotDisturbChanged={handleDoNotDisturbChanged}
        onOpenPage={navigation.openPage}
        onChildFocusChange={navigation.handleRailChildFocus}
      />
    );
  } else if (navigation.activePage === 'brightness') {
    pageContent = (
      <AdjustmentPage
        setting="brightness"
        value={brightness}
        onValueChanged={handleBrightnessChanged}
        onClose={navigation.closePage}
      />
    );
  } else if (navigation.activePage === 'volume') {
    pageContent = (
      <AdjustmentPage
        setting="volume"
        value={volume}
        onValueChanged={handleVolumeChanged}
        onClose={navigation.closePage}
      />
    );
  } else if (navigation.activePage === 'notifications') {
    pageContent = <NotificationsPage />;
  } else {
    pageContent = <SettingsPage />;
  }

  return (
    <AppMaterialProvider>
      <App className="alpha-launcher">
        <main
          className={
            'launcher-screen launcher-page ' +
            (navigation.isPageReady ? 'is-ready ' : '') +
            (navigation.isLeavingPage ? 'is-leaving' : '')
          }
          aria-label="Alpha Launcher"
        >
          {/*
            The sample owns its short fade in CSS, so PageTransition only
            coordinates which page is mounted and does not add a second motion.
          */}
          <PageTransition
            transitionKey={navigation.activePage ?? 'button-rail'}
            disabled
            initialFocus="none"
            preservePageState={false}
          >
            {pageContent}
          </PageTransition>
        </main>
      </App>
    </AppMaterialProvider>
  );
}
