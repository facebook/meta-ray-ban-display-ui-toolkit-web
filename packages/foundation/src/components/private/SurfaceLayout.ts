/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  State,
  type ContentScaleForStateFn,
} from '../../base/Interactions';
import {
  getContentScaleForState,
  type Platform,
} from '../../base/Platform';

export interface SurfaceSize {
  width: number;
  height: number;
}

/**
 * Resolves the size used to compute the content "breathing" scale.
 *
 * Content scale is derived from the actual measured element width, so for
 * non-numeric (auto/percentage) widths the real rendered size is used. When a
 * measured size isn't available yet, width 0 is returned so
 * `getSurfaceContentScale` yields 1 (no breathing) rather than a fabricated
 * magnitude. Explicit numeric width/height always win.
 */
export function resolveSurfaceSize(
  width: number | string,
  height: number | string,
  measured?: { w: number; h: number } | null,
): SurfaceSize {
  return {
    width: typeof width === 'number' ? width : (measured?.w ?? 0),
    height: typeof height === 'number' ? height : (measured?.h ?? 0),
  };
}

export function getSurfaceContentScale(
  platform: Platform,
  state: State,
  size: SurfaceSize,
  contentScaleForStateFn?: ContentScaleForStateFn,
): number {
  if (size.width <= 0) return 1;
  return contentScaleForStateFn
    ? contentScaleForStateFn(state, size)
    : getContentScaleForState(state, platform, size);
}

export function getSurfaceInnerShadowAlpha(state: State): {
  focused: number;
  pressed: number;
} {
  return {
    focused: state === State.FOCUSED || state === State.PRESSED ? 1 : 0,
    pressed: state === State.PRESSED ? 1 : 0,
  };
}
