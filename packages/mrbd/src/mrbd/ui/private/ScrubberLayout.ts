/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const SCRUBBER_MIN_VALUE = 0;
export const SCRUBBER_MAX_VALUE = 100;
export const SCRUBBER_KEYBOARD_STEP = 1;
export const SCRUBBER_KEYBOARD_LARGE_STEP = 5;

export function clampScrubberValue(value: number): number {
  if (!Number.isFinite(value)) {
    return SCRUBBER_MIN_VALUE;
  }
  return Math.min(Math.max(value, SCRUBBER_MIN_VALUE), SCRUBBER_MAX_VALUE);
}

export function normalizeScrubberDuration(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds)) {
    return 0;
  }
  return Math.max(0, Math.floor(durationSeconds));
}

export function formatScrubberTime(totalSeconds: number): string {
  const normalizedSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const seconds = normalizedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getScrubberElapsedSeconds(
  value: number,
  durationSeconds: number,
): number {
  return Math.round(
    (clampScrubberValue(value) / SCRUBBER_MAX_VALUE) *
      normalizeScrubberDuration(durationSeconds),
  );
}

export function getScrubberTooltipText(
  value: number,
  durationSeconds: number,
): string {
  const duration = normalizeScrubberDuration(durationSeconds);
  return duration > 0
    ? formatScrubberTime(getScrubberElapsedSeconds(value, duration))
    : `${Math.round(clampScrubberValue(value))}%`;
}

export function getScrubberAriaValueText(
  value: number,
  durationSeconds: number,
): string {
  const duration = normalizeScrubberDuration(durationSeconds);
  return duration > 0
    ? `${formatScrubberTime(getScrubberElapsedSeconds(value, duration))} of ${formatScrubberTime(duration)}`
    : `${Math.round(clampScrubberValue(value))}%`;
}

export function getScrubberPointerValue({
  clientX,
  trackLeft,
  trackWidth,
  rtl,
}: {
  clientX: number;
  trackLeft: number;
  trackWidth: number;
  rtl: boolean;
}): number | null {
  if (trackWidth <= 0) {
    return null;
  }
  const physicalFraction = Math.min(
    Math.max((clientX - trackLeft) / trackWidth, 0),
    1,
  );
  const logicalFraction = rtl ? 1 - physicalFraction : physicalFraction;
  return logicalFraction * SCRUBBER_MAX_VALUE;
}

export function getScrubberKeyboardValue({
  value,
  key,
  shiftKey,
  rtl,
}: {
  value: number;
  key: string;
  shiftKey: boolean;
  rtl: boolean;
}): number | null {
  if (key === 'Home') {
    return SCRUBBER_MIN_VALUE;
  }
  if (key === 'End') {
    return SCRUBBER_MAX_VALUE;
  }
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') {
    return null;
  }
  const step = shiftKey
    ? SCRUBBER_KEYBOARD_LARGE_STEP
    : SCRUBBER_KEYBOARD_STEP;
  const physicalDirection = key === 'ArrowRight' ? 1 : -1;
  const logicalDirection = rtl ? -physicalDirection : physicalDirection;
  return clampScrubberValue(value + step * logicalDirection);
}
