/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { InteractionConstants } from './Interactions';

let lastFocusChangeTimestampMs = 0;
let timeBetweenLastTwoFocusChangesMs = Number.MAX_SAFE_INTEGER;
let lastFastScrollTimestampMs = 0;

interface FocusChangeSnapshot {
  lastFocusChangeTimestampMs: number;
  timeBetweenLastTwoFocusChangesMs: number;
  lastFastScrollTimestampMs: number;
}

let preRecordedFocusChangeSnapshot: FocusChangeSnapshot | null = null;

function recordFocusChangeAt(now: number): void {
  if (lastFocusChangeTimestampMs > 0) {
    timeBetweenLastTwoFocusChangesMs = now - lastFocusChangeTimestampMs;
    if (timeBetweenLastTwoFocusChangesMs < InteractionConstants.FAST_SCROLL_THRESHOLD_MS) {
      lastFastScrollTimestampMs = now;
    }
  }
  lastFocusChangeTimestampMs = now;
}

/**
 * Browser focus transfer blurs the old element before focusing the new one.
 * Pre-record directional transfers so both state changes observe the same
 * fast-scroll classification, then let the incoming focus consume the record.
 */
export function withPreRecordedFocusChange<T>(focus: () => T): T {
  if (preRecordedFocusChangeSnapshot != null) {
    return focus();
  }

  const snapshot: FocusChangeSnapshot = {
    lastFocusChangeTimestampMs,
    timeBetweenLastTwoFocusChangesMs,
    lastFastScrollTimestampMs,
  };
  recordFocusChangeAt(Date.now());
  preRecordedFocusChangeSnapshot = snapshot;

  try {
    return focus();
  } finally {
    if (preRecordedFocusChangeSnapshot === snapshot) {
      lastFocusChangeTimestampMs = snapshot.lastFocusChangeTimestampMs;
      timeBetweenLastTwoFocusChangesMs = snapshot.timeBetweenLastTwoFocusChangesMs;
      lastFastScrollTimestampMs = snapshot.lastFastScrollTimestampMs;
      preRecordedFocusChangeSnapshot = null;
    }
  }
}

export const FastScrollTracker = {
  recordFocusChange(): void {
    if (preRecordedFocusChangeSnapshot != null) {
      preRecordedFocusChangeSnapshot = null;
      return;
    }
    recordFocusChangeAt(Date.now());
  },

  get isCurrentlyFastScrolling(): boolean {
    return (
      timeBetweenLastTwoFocusChangesMs < InteractionConstants.FAST_SCROLL_THRESHOLD_MS ||
      (lastFastScrollTimestampMs > 0 &&
        Date.now() - lastFastScrollTimestampMs <
          InteractionConstants.FAST_SCROLL_DECAY_THRESHOLD)
    );
  },

  reset(): void {
    lastFocusChangeTimestampMs = 0;
    timeBetweenLastTwoFocusChangesMs = Number.MAX_SAFE_INTEGER;
    lastFastScrollTimestampMs = 0;
    preRecordedFocusChangeSnapshot = null;
  },

  invalidateFastScrollDecay(): void {
    lastFastScrollTimestampMs = 0;
  },
};
