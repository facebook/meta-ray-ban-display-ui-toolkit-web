/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * IsolatedControl component for Meta Ray-Ban Display
 *
 * A standalone control that allows the user to adjust a value between
 * a minimum and maximum via Left/Right arrow keys, with an optional icon.
 *
 * When focused, Left/Right key events are consumed to adjust the value.
 * Focus cannot be moved left/right while focused on this control (d-pad
 * left/right are captured). Up/Down and manual focus changes still work.
 *
 * Extends Container, which provides focus/press state visual transitions.
 *
 * The SliderBar inside is non-interactive (excluded from accessibility).
 * IsolatedControl itself handles all keyboard interaction
 * and exposes the full slider role to accessibility.
 */

import {
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react';
import {
  Container,
  PartialFocusSupportedAxis,
} from '@wearables-ui-toolkit/foundation/components/Container';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { SliderBarInternal } from './private/SliderBarInternal';
import {
  getIsolatedControlContentStyle,
  getIsolatedControlMinWidth,
} from './private/IsolatedControlLayout';
import {
  ISOLATED_CONTROL_DEFAULT_INCREMENT_PERCENTAGE,
  ISOLATED_CONTROL_HEIGHT,
} from './private/IsolatedControlMetrics';
import type {
  IsolatedControlHandle,
  IsolatedControlProps,
} from './IsolatedControl.types';
import { useIsolatedControlInteraction } from './private/useIsolatedControlInteraction';
import styles from './IsolatedControl.module.css';

export type {
  IsolatedControlHandle,
  IsolatedControlProps,
} from './IsolatedControl.types';

const EMPTY_ISOLATED_CONTROL_STYLE: CSSProperties = {};

// ---------- Component ----------

/**
 * IsolatedControl
 *
 * Standalone slider control with icon, driven by Left/Right arrow keys.
 * Wraps Container for focus/press visual states and SliderBar for the
 * value display.
 *
 * Key handling:
 * - ArrowLeft: decrement value by incrementPercentage
 * - ArrowRight: increment value by incrementPercentage
 * - Enter/Space: click (if onClick provided)
 * - These keys are consumed (stopPropagation) to prevent focus navigation.
 */
export const IsolatedControl = memo(forwardRef<IsolatedControlHandle, IsolatedControlProps>(
  function IsolatedControl(
    {
      icon,
      minimumValue = 0,
      maximumValue = 1,
      value,
      defaultValue,
      incrementPercentage = ISOLATED_CONTROL_DEFAULT_INCREMENT_PERCENTAGE,
      onValueChanged,
      onClick,
      animated = true,
      disabled = false,
      className = '',
      style = EMPTY_ISOLATED_CONTROL_STYLE,
      'aria-label': ariaLabel,
      partialFocusSupportedAxis,
      ...containerProps
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const hasIcon = icon != null;
    const {
      clampedValue,
      sliderBarState,
      accessPercent,
      valueAnimated,
      setValue,
      handleKeyDown,
      handleKeyUp,
      handleStateChange,
    } = useIsolatedControlInteraction({
      value,
      defaultValue,
      minimumValue,
      maximumValue,
      incrementPercentage,
      disabled,
      animated,
      onValueChanged,
      onClick,
    });

    useImperativeHandle(
      ref,
      (): IsolatedControlHandle => ({
        setValue: (next: number, animatedChange?: boolean) => {
          setValue(next, animatedChange);
        },
        getElement: () => rootRef.current,
      }),
      [setValue],
    );
    const contentStyle = useMemo(
      () => getIsolatedControlContentStyle(hasIcon),
      [hasIcon],
    );
    const containerStyle = useMemo(
      () => ({
        height: ISOLATED_CONTROL_HEIGHT,
        minWidth: getIsolatedControlMinWidth(hasIcon),
        ...style,
      }),
      [hasIcon, style],
    );
    const containerClassName = useMemo(
      () => `${styles.isolatedControl} ${className}`,
      [className],
    );
    const accessibilityLabel = useMemo(
      () => ariaLabel ?? `${accessPercent}%`,
      [ariaLabel, accessPercent],
    );

    return (
      <Container
        ref={rootRef}
        className={containerClassName}
        style={containerStyle}
        {...containerProps}
        disabled={disabled}
        onStateChange={handleStateChange}
        partialFocusSupportedAxis={
          partialFocusSupportedAxis ?? PartialFocusSupportedAxis.Y
        }
        /**
         * Smooth corners use ResizeObserver-measured dimensions for the SVG
         * clip path, so responsive width is supported (height is already
         * fixed at 88px). The first render briefly uses CSS border-radius
         * until measurement completes.
         *
         * The slider role, tabIndex, aria-*, and key handlers are spread after
         * `containerProps` so a consumer's extra props cannot clobber the
         * component's own slider semantics or arrow-key value handling.
         */
        role="slider"
        tabIndex={0}
        aria-valuenow={clampedValue}
        aria-valuemin={minimumValue}
        aria-valuemax={maximumValue}
        aria-label={accessibilityLabel}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      >
        <div className={styles.content} style={contentStyle}>
          {icon != null && (
            <div className={styles.icon}>
              <IconImage source={icon} />
            </div>
          )}
          <div className={styles.sliderWrapper}>
            <SliderBarInternal
              minimumValue={minimumValue}
              maximumValue={maximumValue}
              value={clampedValue}
              state={sliderBarState}
              shouldExpandOnFocus={true}
              animated={valueAnimated}
              stateAnimated={animated}
              presentational
            />
          </div>
        </div>
      </Container>
    );
  },
));
