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
  popTransientModeHistory,
  pushTransientModeHistory,
} from './transientModeHistory';

describe('transient mode history', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('marks slider adjustment as a same-document history entry', () => {
    pushTransientModeHistory('quickSettingsSlider');

    expect(window.location.hash).toBe(
      '#uit-launcher-mode=quickSettingsSlider',
    );
  });

  it('uses browser back only for the matching active mode', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    pushTransientModeHistory('appPinning');

    expect(popTransientModeHistory('quickSettingsSlider')).toBe(false);
    expect(back).not.toHaveBeenCalled();

    expect(popTransientModeHistory('appPinning')).toBe(true);
    expect(back).toHaveBeenCalledOnce();
    back.mockRestore();
  });
});
