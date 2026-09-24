/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';

export const APP_GRID_STYLES = {
  TWO_COLUMN_TILES: 'twoColumnTiles',
  THREE_COLUMN_ICONS: 'threeColumnIcons',
} as const;

export type AppGridStyle =
  (typeof APP_GRID_STYLES)[keyof typeof APP_GRID_STYLES];

export const DEFAULT_APP_GRID_STYLE = APP_GRID_STYLES.THREE_COLUMN_ICONS;

export const APP_GRID_STYLE_LABELS: Record<AppGridStyle, string> = {
  [APP_GRID_STYLES.TWO_COLUMN_TILES]: 'Two columns',
  [APP_GRID_STYLES.THREE_COLUMN_ICONS]: 'Three columns',
};

const APP_GRID_STYLE_STORAGE_KEY = 'uit-launcher-app-grid-style';

interface ReadableStorage {
  getItem(key: string): string | null;
}

interface WritableStorage {
  setItem(key: string, value: string): void;
}

export function isAppGridStyle(value: unknown): value is AppGridStyle {
  return value === APP_GRID_STYLES.TWO_COLUMN_TILES ||
    value === APP_GRID_STYLES.THREE_COLUMN_ICONS;
}

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStoredAppGridStyle(
  storage: ReadableStorage | null = getBrowserStorage(),
): AppGridStyle {
  try {
    const storedStyle = storage?.getItem(APP_GRID_STYLE_STORAGE_KEY);
    return isAppGridStyle(storedStyle)
      ? storedStyle
      : DEFAULT_APP_GRID_STYLE;
  } catch {
    return DEFAULT_APP_GRID_STYLE;
  }
}

export function writeStoredAppGridStyle(
  style: AppGridStyle,
  storage: WritableStorage | null = getBrowserStorage(),
): void {
  try {
    storage?.setItem(APP_GRID_STYLE_STORAGE_KEY, style);
  } catch {
    // The in-memory preference still works when storage is unavailable.
  }
}

export function useAppGridStyle(): readonly [
  AppGridStyle,
  (style: AppGridStyle) => void,
] {
  const [style, setStyle] = useState(readStoredAppGridStyle);
  const updateStyle = useCallback((nextStyle: AppGridStyle) => {
    setStyle(nextStyle);
    writeStoredAppGridStyle(nextStyle);
  }, []);

  return [style, updateStyle] as const;
}
