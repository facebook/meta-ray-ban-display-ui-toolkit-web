/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ZoomIndicator component for Meta Ray-Ban Display
 *
 * A non-interactive zoom level overlay displaying a vertical SliderBar
 * with an icon at the bottom. The parent controls the value.
 *
 * Layout: Vertical pill with SliderBar on top, icon on bottom.
 * Background uses elevation 2 background.
 *
 * The vertical layout is achieved via CSS transforms on the horizontal
 * SliderBar (writing-mode: vertical-lr + rotate(180deg)).
 *
 * Not focusable, not clickable. Value is controlled externally.
 *
 * Accessibility: exposed as a progressbar (aria-valuenow/min/max) with an
 * aria-label formatted as the bare percentage "NN%" (no "Zoom " prefix). When
 * `announceUpdatesForAccessibility` is enabled, a polite aria-live region
 * announces "NN%" on value change.
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import { ZOOM_INDICATOR_DEFAULT_ICON } from './private/IndicatorIcons';
import { SliderBarOrientation, SliderBarState } from './SliderBar';
import { SliderBarInternal } from './private/SliderBarInternal';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { splitIndicatorAriaAttributes } from './private/IndicatorValue';
import {
  getZoomIndicatorAccessibilityPercent,
  getZoomIndicatorAriaLabel,
  getZoomIndicatorClassName,
  getZoomIndicatorClampedValue,
  getZoomIndicatorContainerStyle,
  getZoomIndicatorContentStyle,
  getZoomIndicatorSliderWrapperStyle,
  hasZoomIndicatorIcon,
} from './private/ZoomIndicatorLayout';
import type { ZoomIndicatorProps } from './ZoomIndicator.types';
import styles from './ZoomIndicator.module.css';

export type { ZoomIndicatorProps } from './ZoomIndicator.types';

const DEFAULT_STYLE: CSSProperties = {};

const DEFAULT_ICON = ZOOM_INDICATOR_DEFAULT_ICON;

/**
 * ZoomIndicator
 *
 * A non-interactive vertical pill displaying a progress bar and icon.
 * Used to represent the current zoom level of an interaction.
 */
export const ZoomIndicator = memo(forwardRef<HTMLDivElement, ZoomIndicatorProps>(
  function ZoomIndicator(
    {
      icon = DEFAULT_ICON,
      minimumValue = 0,
      maximumValue = 1,
      value,
      animated = false,
      announceUpdatesForAccessibility = false,
      className = '',
      style = DEFAULT_STYLE,
      'aria-label': ariaLabel,
      ...rest
    },
    ref,
  ) {
    const hasIcon = hasZoomIndicatorIcon(icon);

    // Clamp value to [min, max]
    const clampedValue = useMemo(
      () => getZoomIndicatorClampedValue(value, minimumValue, maximumValue),
      [value, minimumValue, maximumValue],
    );

    // Accessibility percentage
    const accessPercent = useMemo(
      () => getZoomIndicatorAccessibilityPercent(clampedValue, minimumValue, maximumValue),
      [clampedValue, minimumValue, maximumValue],
    );

    const contentStyle = useMemo(
      () => getZoomIndicatorContentStyle(hasIcon),
      [hasIcon],
    );
    const containerStyle = useMemo(
      () => getZoomIndicatorContainerStyle(style),
      [style],
    );
    const sliderWrapperStyle = useMemo(
      () => getZoomIndicatorSliderWrapperStyle(),
      [],
    );
    const zoomIndicatorClassName = useMemo(
      () => getZoomIndicatorClassName(
        styles.zoomIndicator,
        className,
      ),
      [className],
    );
    const zoomIndicatorAriaLabel = useMemo(
      () => getZoomIndicatorAriaLabel(
        ariaLabel,
        accessPercent,
      ),
      [ariaLabel, accessPercent],
    );
    const { rootProps, progressbarAriaProps } = splitIndicatorAriaAttributes(rest);

    /**
     * Live-region text announces the rounded percentage (e.g. "NN%").
     * Empty when announcements are disabled so nothing is announced.
     *
     * The `role="progressbar"` element is not focusable (no tab stop), so there
     * is no focus state to gate on -- gating on focus would silence
     * announcements entirely. Announcements are instead gated on the caller's
     * `announceUpdatesForAccessibility` opt-in (same idiom as ProgressRing).
     */
    const liveAnnouncement = announceUpdatesForAccessibility
      ? `${accessPercent}%`
      : '';

    return (
      <div
        {...rootProps}
        ref={ref}
        className={zoomIndicatorClassName}
        style={containerStyle}
      >
        <div
          {...progressbarAriaProps}
          className={styles.content}
          style={contentStyle}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={minimumValue}
          aria-valuemax={maximumValue}
          aria-label={zoomIndicatorAriaLabel}
        >
          <div className={styles.sliderWrapper} style={sliderWrapperStyle}>
            <SliderBarInternal
              minimumValue={minimumValue}
              maximumValue={maximumValue}
              value={clampedValue}
              orientation={SliderBarOrientation.VERTICAL}
              state={SliderBarState.FOCUSED}
              shouldExpandOnFocus={true}
              animated={animated}
              presentational
            />
          </div>
          {hasIcon && (
            <div className={styles.icon}>
              {icon != null && <IconImage source={icon} />}
            </div>
          )}
        </div>
        {/* Live region announces "NN%" on value change when enabled. Kept a
            sibling of the role="progressbar" element so screen readers reliably
            announce updates. */}
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
