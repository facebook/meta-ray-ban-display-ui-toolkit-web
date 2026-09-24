/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import {
  APP_GRID_STYLES,
  DEFAULT_APP_GRID_STYLE,
  isAppGridStyle,
  readStoredAppGridStyle,
  writeStoredAppGridStyle,
} from './appGridStyle';

describe('app grid style preference', () => {
  it('accepts only supported style identifiers', () => {
    expect(isAppGridStyle(APP_GRID_STYLES.TWO_COLUMN_TILES)).toBe(true);
    expect(isAppGridStyle(APP_GRID_STYLES.THREE_COLUMN_ICONS)).toBe(true);
    expect(isAppGridStyle('compact')).toBe(false);
  });

  it('uses the three-column layout when no preference is stored', () => {
    expect(readStoredAppGridStyle({ getItem: () => null })).toBe(
      APP_GRID_STYLES.THREE_COLUMN_ICONS,
    );
    expect(DEFAULT_APP_GRID_STYLE).toBe(APP_GRID_STYLES.THREE_COLUMN_ICONS);
  });

  it('restores a supported stored preference', () => {
    expect(readStoredAppGridStyle({
      getItem: () => APP_GRID_STYLES.TWO_COLUMN_TILES,
    })).toBe(APP_GRID_STYLES.TWO_COLUMN_TILES);
  });

  it('falls back safely when storage reads fail', () => {
    expect(readStoredAppGridStyle({
      getItem: () => {
        throw new Error('unavailable');
      },
    })).toBe(DEFAULT_APP_GRID_STYLE);
  });

  it('stores the selected style when storage is available', () => {
    const setItem = vi.fn();

    writeStoredAppGridStyle(APP_GRID_STYLES.THREE_COLUMN_ICONS, { setItem });

    expect(setItem).toHaveBeenCalledWith(
      'uit-launcher-app-grid-style',
      APP_GRID_STYLES.THREE_COLUMN_ICONS,
    );
  });
});
