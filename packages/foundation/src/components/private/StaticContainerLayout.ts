/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VisualState } from '../../base/Interactions';
import { BackgroundStyle } from '../StaticContainer.types';
import type { ResolvedBackgroundStyle } from './StaticContainerBackgroundStyle';

export interface StaticContainerDimensions {
  width: number;
  height: number;
}

/**
 * Resolve the static visual state from a (possibly internal) background style.
 * Only the public `NONE` case hides the material; every other case — including
 * the internal always-visible style that {@link TextSwitcher} relies on — keeps
 * the material in its DEFAULT (visible) visual state.
 */
export function getStaticContainerVisualState(
  backgroundStyle: ResolvedBackgroundStyle,
  visualState: VisualState = VisualState.DEFAULT,
): VisualState {
  return backgroundStyle === BackgroundStyle.NONE
    ? VisualState.NONE
    : visualState;
}

export function resolveStaticContainerDimensions(
  width: number | string,
  height: number | string,
  measuredDims: { w: number; h: number } | null,
): StaticContainerDimensions | null {
  const hasFixedDimensions = typeof width === 'number' && typeof height === 'number';
  if (hasFixedDimensions) {
    return {
      width: width as number,
      height: height as number,
    };
  }

  if (measuredDims != null && measuredDims.w > 0 && measuredDims.h > 0) {
    return {
      width: measuredDims.w,
      height: measuredDims.h,
    };
  }

  return null;
}
