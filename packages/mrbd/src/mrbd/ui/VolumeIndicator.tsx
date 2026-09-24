/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * VolumeIndicator component for Meta Ray-Ban Display
 *
 * A non-interactive volume overlay displaying an icon and a SliderBar.
 * The parent controls the value -- this component is display-only.
 *
 * Layout: Horizontal pill with icon on the left, SliderBar filling
 * the remaining width. Background uses elevation 2 background.
 *
 * Not focusable, not clickable. The value is controlled by the parent/host.
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import { VOLUME_INDICATOR_DEFAULT_ICON } from './private/IndicatorIcons';
import { SliderBarState } from './SliderBar';
import { SliderBarInternal } from './private/SliderBarInternal';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { splitIndicatorAriaAttributes } from './private/IndicatorValue';
import {
  getVolumeIndicatorAccessibilityPercent,
  getVolumeIndicatorAriaLabel,
  getVolumeIndicatorClassName,
  getVolumeIndicatorClampedValue,
  getVolumeIndicatorContainerStyle,
  getVolumeIndicatorContentStyle,
  getVolumeIndicatorSliderWrapperStyle,
  hasVolumeIndicatorIcon,
} from './private/VolumeIndicatorLayout';
import type { VolumeIndicatorProps } from './VolumeIndicator.types';
import styles from './VolumeIndicator.module.css';

export type { VolumeIndicatorProps } from './VolumeIndicator.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * Default left-side glyph: the speaker (three-arcs) icon.
 * Pass `icon={null}` to hide the icon area.
 */
const DEFAULT_ICON = VOLUME_INDICATOR_DEFAULT_ICON;

/**
 * VolumeIndicator
 *
 * A non-interactive horizontal pill displaying an icon and a progress bar.
 * Used as a volume overlay whose value is controlled by the parent/host.
 */
export const VolumeIndicator = memo(forwardRef<HTMLDivElement, VolumeIndicatorProps>(
  function VolumeIndicator(
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
    const hasIcon = hasVolumeIndicatorIcon(icon);

    // Clamp value to [min, max]
    const clampedValue = useMemo(
      () => getVolumeIndicatorClampedValue(value, minimumValue, maximumValue),
      [value, minimumValue, maximumValue],
    );

    // Accessibility percentage
    const accessPercent = useMemo(
      () => getVolumeIndicatorAccessibilityPercent(clampedValue, minimumValue, maximumValue),
      [clampedValue, minimumValue, maximumValue],
    );

    const contentStyle = useMemo(
      () => getVolumeIndicatorContentStyle(hasIcon),
      [hasIcon],
    );
    const containerStyle = useMemo(
      () => getVolumeIndicatorContainerStyle(style),
      [style],
    );
    const sliderWrapperStyle = useMemo(
      () => getVolumeIndicatorSliderWrapperStyle(),
      [],
    );
    const volumeIndicatorClassName = useMemo(
      () => getVolumeIndicatorClassName(
        styles.volumeIndicator,
        className,
      ),
      [className],
    );
    const volumeIndicatorAriaLabel = useMemo(
      () => getVolumeIndicatorAriaLabel(
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
        className={volumeIndicatorClassName}
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
          aria-label={volumeIndicatorAriaLabel}
        >
          {hasIcon && (
            <div className={styles.icon}>
              {icon != null && <IconImage source={icon} />}
            </div>
          )}
          <div className={styles.sliderWrapper} style={sliderWrapperStyle}>
            <SliderBarInternal
              minimumValue={minimumValue}
              maximumValue={maximumValue}
              value={clampedValue}
              state={SliderBarState.FOCUSED}
              shouldExpandOnFocus={true}
              animated={animated}
              presentational
            />
          </div>
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
