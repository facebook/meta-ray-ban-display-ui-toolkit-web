/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createHashHistoryMarker } from './hashHistoryMarker';

export const LAUNCHER_TRANSIENT_MODES = {
  APP_PINNING: 'appPinning',
  QUICK_SETTINGS_SLIDER: 'quickSettingsSlider',
} as const;

export type LauncherTransientMode =
  (typeof LAUNCHER_TRANSIENT_MODES)[keyof typeof LAUNCHER_TRANSIENT_MODES];

// Derived from the table above so the type and the runtime check cannot drift.
const TRANSIENT_MODE_VALUES: readonly string[] = Object.values(
  LAUNCHER_TRANSIENT_MODES,
);

function isTransientMode(value: string): value is LauncherTransientMode {
  return TRANSIENT_MODE_VALUES.includes(value);
}

// No state key and no deep-link minting: a transient mode is identified by hash
// alone, and a visible mode whose marker is missing or foreign clears locally
// while keeping the parent page's hash rather than moving history.
const marker = createHashHistoryMarker<LauncherTransientMode>({
  prefix: '#uit-launcher-mode=',
  isValidValue: isTransientMode,
});

export function isTransientModeHistoryActive(
  mode: LauncherTransientMode,
): boolean {
  return marker.isActive(mode);
}

export function pushTransientModeHistory(mode: LauncherTransientMode): void {
  marker.push(mode);
}

export function popTransientModeHistory(mode: LauncherTransientMode): boolean {
  return marker.pop(mode);
}
