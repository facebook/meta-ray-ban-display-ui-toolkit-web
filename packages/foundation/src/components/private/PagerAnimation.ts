/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type PagerAxis = 'horizontal' | 'vertical';

export interface PeekState {
  outgoingIndex: number;
  incomingIndex: number;
  phase: 'peek' | 'restore';
}

export const INVALID_PAGE_INDEX = -1;

export const DEFAULT_OVERLAP_PX = 50;

export const PEEK_PERCENT = 0.2;

export const SPRING_SETTLE_MS = 400;

export const PEEK_OUT_MS = 160;
export const PEEK_RESTORE_MS = 320;

const INCOMING_ALPHA_RANGE = { inMin: 0.25, inMax: 1.0, outMin: 0.0, outMax: 1.0 };
const OUTGOING_ALPHA_RANGE = { inMin: 0.05, inMax: 0.75, outMin: 0.0, outMax: 1.0 };

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const clamped = Math.max(inMin, Math.min(inMax, value));
  const normalized = (clamped - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
}

export function getPageTranslation(
  orientation: PagerAxis,
  visibleIndex: number,
  pageIndex: number,
  containerSize: number,
): { x: number; y: number } {
  const offset = pageIndex - visibleIndex;

  if (orientation === 'horizontal') {
    return {
      x: offset * (containerSize - DEFAULT_OVERLAP_PX),
      y: 0,
    };
  }

  return {
    x: 0,
    y: offset * (containerSize - DEFAULT_OVERLAP_PX),
  };
}

export function getPageAlpha(visibleIndex: number, pageIndex: number): number {
  return visibleIndex === pageIndex ? 1 : 0;
}

export function getMappedAlpha(rawAlpha: number, isIncoming: boolean): number {
  const range = isIncoming ? INCOMING_ALPHA_RANGE : OUTGOING_ALPHA_RANGE;
  return mapRange(rawAlpha, range.inMin, range.inMax, range.outMin, range.outMax);
}
