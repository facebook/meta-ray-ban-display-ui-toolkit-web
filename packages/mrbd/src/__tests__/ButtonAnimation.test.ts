/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { AnimationDurations } from '@wearables-ui-toolkit/foundation/motion/Animations';
import {
  BUTTON_DEFAULT_CONTENT_SCALE,
  BUTTON_MINIMUM_WIDTH,
  LeadingAccessoryRenderMode,
  OPACITY_ANIMATION_COLLAPSE_DELAY,
  OPACITY_ANIMATION_DURATION,
  OPACITY_ANIMATION_EXPAND_DELAY,
  shouldDeferButtonStateChangeUntilMeasured,
} from '../mrbd/ui/private/ButtonLayout';
import {
  areButtonAnimationValuesAtTarget,
  getButtonAnimationTargetValues,
  getButtonAnimationTiming,
  getButtonInitialAnimationValues,
} from '../mrbd/ui/private/ButtonAnimation';

describe('ButtonAnimation', () => {
  it('defers only content-driven focused buttons until width is measured', () => {
    expect(
      shouldDeferButtonStateChangeUntilMeasured({
        customWidth: undefined,
        state: State.FOCUSED,
        hasText: true,
        measuredContentWidth: 0,
      }),
    ).toBe(true);
    expect(
      shouldDeferButtonStateChangeUntilMeasured({
        customWidth: undefined,
        state: State.DEFAULT,
        hasText: true,
        measuredContentWidth: 0,
      }),
    ).toBe(false);
    expect(
      shouldDeferButtonStateChangeUntilMeasured({
        customWidth: 200,
        state: State.FOCUSED,
        hasText: true,
        measuredContentWidth: 0,
      }),
    ).toBe(false);
    expect(
      shouldDeferButtonStateChangeUntilMeasured({
        customWidth: undefined,
        state: State.FOCUSED,
        hasText: false,
        measuredContentWidth: 0,
      }),
    ).toBe(false);
  });

  it('initializes icon buttons collapsed unless text is always shown', () => {
    expect(
      getButtonInitialAnimationValues({
        measuredContentWidth: 240,
        renderMode: LeadingAccessoryRenderMode.ICON,
        hasText: true,
        alwaysShowText: false,
      }),
    ).toMatchObject({
      width: BUTTON_MINIMUM_WIDTH,
      scale: BUTTON_DEFAULT_CONTENT_SCALE,
      textOpacity: 0,
    });

    expect(
      getButtonInitialAnimationValues({
        measuredContentWidth: 240,
        renderMode: LeadingAccessoryRenderMode.ICON,
        hasText: true,
        alwaysShowText: true,
      }).width,
    ).toBe(240);
  });

  it('computes target values from visual state and target width', () => {
    const target = getButtonAnimationTargetValues({
      state: State.FOCUSED,
      targetWidth: 240,
      renderMode: LeadingAccessoryRenderMode.ICON,
      hasText: true,
      alwaysShowText: false,
    });

    expect(target.width).toBe(240);
    expect(target.textOpacity).toBe(1);
  });

  it('uses the documented timing for press and text opacity transitions', () => {
    const startValues = getButtonInitialAnimationValues({
      measuredContentWidth: 72,
      renderMode: LeadingAccessoryRenderMode.ICON,
      hasText: true,
      alwaysShowText: false,
    });
    const expandedValues = {
      ...startValues,
      textOpacity: 1,
    };

    expect(
      getButtonAnimationTiming({
        state: State.PRESSED,
        previousState: State.FOCUSED,
        startValues,
        targetValues: expandedValues,
      }),
    ).toMatchObject({
      duration: AnimationDurations.CONTAINER_PRESS_IN,
      opacityDuration: AnimationDurations.CONTAINER_PRESS_IN,
      opacityDelay: 0,
    });

    expect(
      getButtonAnimationTiming({
        state: State.FOCUSED,
        previousState: State.DEFAULT,
        startValues,
        targetValues: expandedValues,
      }),
    ).toMatchObject({
      duration: AnimationDurations.CONTAINER_STATE_CHANGE,
      opacityDuration: OPACITY_ANIMATION_DURATION,
      opacityDelay: OPACITY_ANIMATION_EXPAND_DELAY,
    });

    expect(
      getButtonAnimationTiming({
        state: State.DEFAULT,
        previousState: State.FOCUSED,
        startValues: expandedValues,
        targetValues: startValues,
      }).opacityDelay,
    ).toBe(OPACITY_ANIMATION_COLLAPSE_DELAY);
  });

  it('uses the documented tolerance when checking whether values reached target', () => {
    const target = getButtonInitialAnimationValues({
      measuredContentWidth: 72,
      renderMode: LeadingAccessoryRenderMode.NONE,
      hasText: true,
      alwaysShowText: false,
    });

    expect(
      areButtonAnimationValuesAtTarget(
        {
          ...target,
          width: target.width + 0.005,
          scale: target.scale + 0.00005,
          textOpacity: target.textOpacity + 0.0005,
        },
        target,
      ),
    ).toBe(true);
    expect(
      areButtonAnimationValuesAtTarget(
        {
          ...target,
          width: target.width + 0.02,
        },
        target,
      ),
    ).toBe(false);
  });
});
