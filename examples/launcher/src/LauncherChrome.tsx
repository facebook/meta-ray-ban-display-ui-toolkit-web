/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  MaterialLibrary,
  PaginationIndicator,
  PaginationMode,
  Panel,
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/mrbd';
import {
  ALL_APPS_PAGE_INDEX,
  HOME_PAGE_INDEX,
  UPPER_PANEL_PAGE_INDEX,
} from './launcherPages';

const PAGE_COUNT = 3;
const STATUS_INDICATOR_HEIGHT = 'clamp(3.5rem, 10.667vmin, 4rem)';
const STATUS_INDICATOR_WIDTH = 'clamp(6rem, 18cqw, 6.75rem)';
const STATUS_INDICATOR_MANAGE_PINS_WIDTH =
  'clamp(10rem, 31.667cqw, 11.875rem)';
const STATUS_INDICATOR_MATERIAL_HORIZONTAL_INSET = 4;
const STATUS_CONTENT_WIDTH = 'clamp(15rem, 48.667cqw, 18.25rem)';
const STATUS_BAR_TOP =
  'max(env(safe-area-inset-top), clamp(0.5rem, 1.333dvh, 0.75rem))';
const STATUS_BAR_UPPER_BOTTOM = 'clamp(4.5rem, 13.667dvh, 5.125rem)';
const STATUS_BAR_HOME_ANIMATION_DELAY_MS = 500;

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  weekday: 'short',
});
const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

type StatusBarMode = 'clock' | 'pagination' | 'tempState' | 'upperClock';

function useClockLabel(): string {
  const [date, setDate] = useState(() => new Date());

  useEffect(() => {
    let intervalId: number | null = null;
    const now = new Date();
    const timeoutId = window.setTimeout(() => {
      setDate(new Date());
      intervalId = window.setInterval(() => setDate(new Date()), 60_000);
    }, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()));

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId != null) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return useMemo(
    () => `${DATE_FORMATTER.format(date)} \u2022 ${TIME_FORMATTER.format(date)}`,
    [date],
  );
}

function getStatusBarMode(
  horizontalPageIndex: number,
  verticalPageIndex: number,
): StatusBarMode {
  if (
    horizontalPageIndex === HOME_PAGE_INDEX &&
    verticalPageIndex === UPPER_PANEL_PAGE_INDEX
  ) {
    return 'upperClock';
  }
  return horizontalPageIndex === HOME_PAGE_INDEX ? 'clock' : 'pagination';
}

export const LauncherChrome = memo(function LauncherChrome({
  allAppsStatusText,
  horizontalPageIndex,
  isQuickSettingsSliderOverlayActive,
  verticalPageIndex,
}: {
  allAppsStatusText?: string;
  horizontalPageIndex: number;
  isQuickSettingsSliderOverlayActive: boolean;
  verticalPageIndex: number;
}) {
  const targetMode =
    allAppsStatusText != null && horizontalPageIndex === ALL_APPS_PAGE_INDEX
      ? 'tempState'
      : getStatusBarMode(horizontalPageIndex, verticalPageIndex);
  const [displayMode, setDisplayMode] = useState<StatusBarMode>(targetMode);
  const previousTargetModeRef = useRef(targetMode);
  const clockLabel = useClockLabel();
  const material = useMemo(
    () => MaterialLibrary.statusIndicatorPanel()
      .withInset({
        left: STATUS_INDICATOR_MATERIAL_HORIZONTAL_INSET,
        top: 0,
        right: STATUS_INDICATOR_MATERIAL_HORIZONTAL_INSET,
        bottom: 0,
      }),
    [],
  );

  useEffect(() => {
    const previousTargetMode = previousTargetModeRef.current;
    previousTargetModeRef.current = targetMode;
    if (targetMode === 'clock' && previousTargetMode === 'pagination') {
      const timer = window.setTimeout(
        () => setDisplayMode(targetMode),
        STATUS_BAR_HOME_ANIMATION_DELAY_MS,
      );
      return () => window.clearTimeout(timer);
    }
    setDisplayMode(targetMode);
    return undefined;
  }, [targetMode]);

  const style = {
    '--launcher-status-bar-top': displayMode === 'upperClock'
      ? `calc(100% - ${STATUS_BAR_UPPER_BOTTOM})`
      : STATUS_BAR_TOP,
    '--launcher-status-bar-width': displayMode === 'pagination'
      ? STATUS_INDICATOR_WIDTH
      : displayMode === 'tempState'
        ? STATUS_INDICATOR_MANAGE_PINS_WIDTH
        : STATUS_CONTENT_WIDTH,
    '--launcher-status-bar-height': STATUS_INDICATOR_HEIGHT,
  } as CSSProperties;

  return (
    <div
      className="launcherStatusBar"
      data-status-bar-mode={displayMode}
      data-slider-overlay-active={
        isQuickSettingsSliderOverlayActive ? 'true' : undefined
      }
      style={style}
    >
      <Panel
        className="launcherStatusBarSurface"
        height="100%"
        material={material}
        width="100%"
      >
        <div className="launcherStatusBarContent">
          <TextView
            as="span"
            className="launcherStatusBarClock"
            textStyle={TextStyle.META1_EMPHASIZED}
            textColor={TextColor.PRIMARY}
          >
            {clockLabel}
          </TextView>
          <TextView
            as="span"
            className="launcherStatusBarTempState"
            textStyle={TextStyle.META2}
            textColor={TextColor.SECONDARY}
          >
            {allAppsStatusText}
          </TextView>
          <PaginationIndicator
            className="launcherPagination"
            currentPage={horizontalPageIndex}
            mode={PaginationMode.DOTS}
            pageCount={PAGE_COUNT}
            data-uit-capture-id="launcher-horizontal-pagination"
          />
        </div>
      </Panel>
    </div>
  );
});
