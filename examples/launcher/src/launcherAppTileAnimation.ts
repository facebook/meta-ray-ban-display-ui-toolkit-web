/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { State } from '@wearables-ui-toolkit/mrbd';

const ICON_DEFAULT_SCALE = 0.663;
const CUBIC_BEZIER_SCALE = [0.68, 0, 0.29, 1] as const;
const CUBIC_BEZIER_PRESS_IN = [0.23, 0.23, 0.24, 1] as const;
const CUBIC_BEZIER_PRESS_OUT = [0.25, 0.08, 0.4, 1] as const;

export interface LauncherAppTileAnimationValues {
  iconMaterialOpacity: number;
  iconScale: number;
  pinBackgroundProgress: number;
  pinContainerOpacity: number;
  pinIconOpacity: number;
  pinIconScale: number;
  titleTranslationX: number;
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

// CSS cannot animate the app tile's coordinated interaction and pin states on
// one timeline. This solves the same cubic-bezier curve used by those states.
function cubicBezierY(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
): number {
  if (x <= 0 || x >= 1) {
    return x <= 0 ? 0 : 1;
  }
  const curveX = (t: number) => {
    const inverse = 1 - t;
    return 3 * inverse * inverse * t * x1 +
      3 * inverse * t * t * x2 + t * t * t;
  };
  const curveY = (t: number) => {
    const inverse = 1 - t;
    return 3 * inverse * inverse * t * y1 +
      3 * inverse * t * t * y2 + t * t * t;
  };
  const derivativeX = (t: number) => {
    const inverse = 1 - t;
    return 3 * inverse * inverse * x1 +
      6 * inverse * t * (x2 - x1) + 3 * t * t * (1 - x2);
  };

  let t = x;
  for (let index = 0; index < 6; index += 1) {
    const difference = curveX(t) - x;
    const derivative = derivativeX(t);
    if (Math.abs(difference) < 0.0001 || Math.abs(derivative) < 0.0001) {
      break;
    }
    t -= difference / derivative;
  }
  if (t < 0 || t > 1) {
    let low = 0;
    let high = 1;
    t = x;
    for (let index = 0; index < 10; index += 1) {
      const currentX = curveX(t);
      if (Math.abs(currentX - x) < 0.0001) {
        break;
      }
      if (currentX < x) {
        low = t;
      } else {
        high = t;
      }
      t = (low + high) / 2;
    }
  }
  return curveY(t);
}

export function getLauncherAppTileAnimationValues(
  state: State,
  isPinningMode: boolean,
  isPinned: boolean,
): LauncherAppTileAnimationValues {
  const isFocused = state === State.FOCUSED || state === State.PRESSED;
  return {
    iconMaterialOpacity: isFocused ? 0 : 1,
    iconScale: isFocused ? 1 : ICON_DEFAULT_SCALE,
    pinBackgroundProgress: isPinned ? 1 : 0,
    pinContainerOpacity: isPinningMode ? 1 : 0,
    pinIconOpacity: isPinned ? 1 : 0,
    pinIconScale: isPinned ? 1 : 0.5,
    titleTranslationX: isFocused ? -4 : 0,
  };
}

export function launcherAppTileAnimationValuesEqual(
  first: LauncherAppTileAnimationValues,
  second: LauncherAppTileAnimationValues,
): boolean {
  return (Object.keys(first) as Array<keyof LauncherAppTileAnimationValues>)
    .every(key => Math.abs(first[key] - second[key]) < 0.0001);
}

export function interpolateLauncherAppTileAnimationValues(
  start: LauncherAppTileAnimationValues,
  target: LauncherAppTileAnimationValues,
  progress: number,
): LauncherAppTileAnimationValues {
  return {
    iconMaterialOpacity: interpolate(start.iconMaterialOpacity, target.iconMaterialOpacity, progress),
    iconScale: interpolate(start.iconScale, target.iconScale, progress),
    pinBackgroundProgress: interpolate(start.pinBackgroundProgress, target.pinBackgroundProgress, progress),
    pinContainerOpacity: interpolate(start.pinContainerOpacity, target.pinContainerOpacity, progress),
    pinIconOpacity: interpolate(start.pinIconOpacity, target.pinIconOpacity, progress),
    pinIconScale: interpolate(start.pinIconScale, target.pinIconScale, progress),
    titleTranslationX: interpolate(start.titleTranslationX, target.titleTranslationX, progress),
  };
}

export function getLauncherAppTileInteractionProgress(
  fromState: State,
  toState: State,
  progress: number,
): number {
  const [x1, y1, x2, y2] = toState === State.PRESSED
    ? CUBIC_BEZIER_PRESS_IN
    : fromState === State.PRESSED
      ? CUBIC_BEZIER_PRESS_OUT
      : CUBIC_BEZIER_SCALE;
  return cubicBezierY(x1, y1, x2, y2, progress);
}

export function getLauncherAppTilePinProgress(progress: number): number {
  return cubicBezierY(...CUBIC_BEZIER_SCALE, progress);
}
