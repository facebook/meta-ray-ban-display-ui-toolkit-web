/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface AlphaLauncherPreferences {
  brightness: number;
  volume: number;
  doNotDisturb: boolean;
}

export type PreferenceUpdateResult =
  | {
    ok: true;
    preferences: AlphaLauncherPreferences;
  }
  | {
    ok: false;
    error: 'invalid_preferences';
    message: string;
  };

function parsePercentage(
  value: unknown,
  name: string,
): { ok: true; value: number } | { ok: false; message: string } {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    return {
      ok: false,
      message: `${name} must be a number from 0 through 100.`,
    };
  }
  return { ok: true, value: value / 100 };
}

export function applyPreferenceInput(
  current: AlphaLauncherPreferences,
  input: Record<string, unknown>,
): PreferenceUpdateResult {
  const hasBrightness = Object.prototype.hasOwnProperty.call(
    input,
    'brightnessPercent',
  );
  const hasVolume = Object.prototype.hasOwnProperty.call(input, 'volumePercent');
  const hasDoNotDisturb = Object.prototype.hasOwnProperty.call(
    input,
    'doNotDisturb',
  );
  if (!hasBrightness && !hasVolume && !hasDoNotDisturb) {
    return {
      ok: false,
      error: 'invalid_preferences',
      message: 'Choose at least one display preference to update.',
    };
  }

  let brightness = current.brightness;
  if (hasBrightness) {
    const parsed = parsePercentage(input.brightnessPercent, 'Brightness');
    if (!parsed.ok) {
      return { ok: false, error: 'invalid_preferences', message: parsed.message };
    }
    brightness = parsed.value;
  }

  let volume = current.volume;
  if (hasVolume) {
    const parsed = parsePercentage(input.volumePercent, 'Volume');
    if (!parsed.ok) {
      return { ok: false, error: 'invalid_preferences', message: parsed.message };
    }
    volume = parsed.value;
  }

  let doNotDisturb = current.doNotDisturb;
  if (hasDoNotDisturb) {
    if (typeof input.doNotDisturb !== 'boolean') {
      return {
        ok: false,
        error: 'invalid_preferences',
        message: 'Do Not Disturb must be true or false.',
      };
    }
    doNotDisturb = input.doNotDisturb;
  }

  return {
    ok: true,
    preferences: { brightness, volume, doNotDisturb },
  };
}
