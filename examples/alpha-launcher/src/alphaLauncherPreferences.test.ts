/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { applyPreferenceInput } from './alphaLauncherPreferences';

const INITIAL_PREFERENCES = {
  brightness: 0.7,
  volume: 0.6,
  doNotDisturb: false,
};

describe('applyPreferenceInput', () => {
  it('updates supplied preferences without resetting omitted values', () => {
    expect(applyPreferenceInput(INITIAL_PREFERENCES, {
      brightnessPercent: 40,
      doNotDisturb: true,
    })).toEqual({
      ok: true,
      preferences: {
        brightness: 0.4,
        volume: 0.6,
        doNotDisturb: true,
      },
    });
  });

  it('accepts an idempotent explicit value', () => {
    expect(applyPreferenceInput(INITIAL_PREFERENCES, {
      doNotDisturb: false,
    })).toEqual({
      ok: true,
      preferences: INITIAL_PREFERENCES,
    });
  });

  it('rejects empty and out-of-range updates', () => {
    expect(applyPreferenceInput(INITIAL_PREFERENCES, {})).toMatchObject({
      ok: false,
      error: 'invalid_preferences',
    });
    expect(applyPreferenceInput(INITIAL_PREFERENCES, {
      volumePercent: 101,
    })).toMatchObject({
      ok: false,
      error: 'invalid_preferences',
    });
  });
});
