/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ProgressIndicator component for Meta Ray-Ban Display
 *
 * A horizontal progress bar that displays a value between min and max.
 * Uses SliderBar internally for the bar rendering. Non-interactive --
 * the parent controls the value. Supports active/inactive visual states
 * and DEFAULT/THIN size variants.
 *
 * Accessibility: Exposed as a progressbar with range info.
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  getProgressIndicatorAccessibilityPercent,
  getProgressIndicatorAriaLabel,
  getProgressIndicatorClassName,
  getProgressIndicatorClampedValue,
  getProgressIndicatorContainerStyle,
  getProgressIndicatorSliderSize,
  getProgressIndicatorSliderState,
} from './private/ProgressIndicatorLayout';
import { SliderBarInternal } from './private/SliderBarInternal';
import { splitIndicatorAriaAttributes } from './private/IndicatorValue';
import {
  ProgressIndicatorSize,
  type ProgressIndicatorProps,
} from './ProgressIndicator.types';
import styles from './ProgressIndicator.module.css';

export { ProgressIndicatorSize } from './ProgressIndicator.types';
export type { ProgressIndicatorProps } from './ProgressIndicator.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * ProgressIndicator
 *
 * A non-interactive horizontal progress bar that displays a value
 * as a filled portion of a track. The parent component controls the
 * value; this component is display-only.
 */
export const ProgressIndicator = memo(forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  function ProgressIndicator(
    {
      minimumValue = 0,
      maximumValue = 1,
      value = 0,
      size = ProgressIndicatorSize.DEFAULT,
      isActive = true,
      animated = false,
      announceUpdatesForAccessibility = true,
      className = '',
      style = DEFAULT_STYLE,
      'aria-label': ariaLabel,
      ...rest
    },
    ref,
  ) {
    // Clamp value to [min, max]
    const clampedValue = useMemo(
      () => getProgressIndicatorClampedValue(value, minimumValue, maximumValue),
      [value, minimumValue, maximumValue],
    );

    // Map active state to SliderBar state
    const sliderState = useMemo(
      () => getProgressIndicatorSliderState(isActive),
      [isActive],
    );

    // Map size to SliderBar size
    const sliderSize = useMemo(
      () => getProgressIndicatorSliderSize(size),
      [size],
    );

    // Accessibility percentage
    const accessPercent = useMemo(
      () => getProgressIndicatorAccessibilityPercent(clampedValue, minimumValue, maximumValue),
      [clampedValue, minimumValue, maximumValue],
    );

    const containerStyle = useMemo(
      () => getProgressIndicatorContainerStyle(style),
      [style],
    );
    const progressIndicatorClassName = useMemo(
      () => getProgressIndicatorClassName(
        styles.progressIndicator,
        className,
      ),
      [className],
    );
    const progressIndicatorAriaLabel = useMemo(
      () => getProgressIndicatorAriaLabel(
        ariaLabel,
        accessPercent,
      ),
      [ariaLabel, accessPercent],
    );
    const liveAnnouncement = announceUpdatesForAccessibility
      ? `${accessPercent}%`
      : '';
    const { rootProps, progressbarAriaProps } = splitIndicatorAriaAttributes(rest);

    return (
      <div
        {...rootProps}
        ref={ref}
        className={progressIndicatorClassName}
        style={containerStyle}
      >
        <div
          {...progressbarAriaProps}
          className={styles.progressbar}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={minimumValue}
          aria-valuemax={maximumValue}
          aria-label={progressIndicatorAriaLabel}
        >
          <SliderBarInternal
            minimumValue={minimumValue}
            maximumValue={maximumValue}
            value={clampedValue}
            state={sliderState}
            size={sliderSize}
            shouldExpandOnFocus={false}
            animated={animated}
            presentational
          />
        </div>
        {/* Sibling of the role node so screen readers reliably announce updates. */}
        <div
          className={styles.visuallyHidden}
          aria-live="polite"
          aria-atomic="true"
        >
          {liveAnnouncement}
        </div>
      </div>
    );
  },
));
