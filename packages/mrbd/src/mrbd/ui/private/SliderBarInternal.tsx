/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SliderBar component for Meta Ray-Ban Display
 *
 * A horizontal bar showing a value between min and max.
 * Used as a building block inside IsolatedControl, VolumeIndicator,
 * ZoomIndicator, ProgressIndicator, and ListItem.
 *
 * Keyboard handling is built into the SliderBar via the `onChange` +
 * `incrementPercentage` props so the component is fully operable via keyboard
 * alone (Meta Ray-Ban Display has no touch, only d-pad/trackpad). When `onChange` is
 * omitted, parent components like IsolatedControl drive value changes instead.
 */

import {
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  getSliderBarAccessibilityPercent,
  getSliderBarClassName,
  getSliderBarClampedValue,
  getSliderBarContainerStyle,
  getSliderBarFillColor,
  getSliderBarFillStyle,
  getSliderBarNextValue,
  getSliderBarProgressPercent,
  getSliderBarTrackHeight,
  isSliderBarInteractive,
} from './SliderBarLayout';
import { SLIDER_BAR_DEFAULT_INCREMENT_PERCENTAGE } from './SliderBarMetrics';
import { SliderBarFrame } from './SliderBarFrame';
import {
  SliderBarOrientation,
  SliderBarSize,
  SliderBarState,
  type SliderBarInternalProps,
} from '../SliderBar.types';
import styles from '../SliderBar.module.css';

// ---------- Component ----------

const DEFAULT_STYLE: CSSProperties = {};

/**
 * SliderBar
 *
 * A horizontal bar that displays a value as a filled portion of a track.
 * Supports keyboard-driven value changes via Left/Right arrow keys when
 * `onChange` is provided.
 *
 * When `onChange` is undefined, the component is purely display-only and
 * not focusable, leaving parent components (IsolatedControl, etc.) to own the
 * interaction. In that non-interactive case it reports `role="progressbar"`
 * with `aria-valuenow/min/max`. Only the interactive case (`onChange` present)
 * reports `role="slider"`.
 */
const SliderBarComponent = memo(forwardRef<HTMLDivElement, SliderBarInternalProps>(
  function SliderBar(
    {
      minimumValue = 0,
      maximumValue = 1,
      value = 0,
      state = SliderBarState.IDLE,
      size = SliderBarSize.DEFAULT,
      orientation = SliderBarOrientation.HORIZONTAL,
      shouldExpandOnFocus = true,
      animated = false,
      stateAnimated,
      onChange,
      incrementPercentage = SLIDER_BAR_DEFAULT_INCREMENT_PERCENTAGE,
      disabled = false,
      presentational = false,
      className = '',
      style = DEFAULT_STYLE,
      'aria-label': ariaLabel,
      ...rest
    },
    ref,
  ) {
    // State-driven transitions (cross-axis focus-expansion + bar/track color)
    // animate on `stateAnimated`, which is independent of `animated` (the
    // value/fill flag). When a parent omits `stateAnimated` we fall back to
    // `animated` so standalone SliderBar usage is unchanged.
    const resolvedStateAnimated = stateAnimated ?? animated;

    // Whether this component is interactive (has onChange handler)
    const isInteractive = useMemo(
      () => isSliderBarInteractive({
        hasChangeHandler: onChange != null,
        disabled,
      }),
      [disabled, onChange],
    );

    // Clamp value to [min, max]
    const clampedValue = useMemo(
      () => getSliderBarClampedValue(value, minimumValue, maximumValue),
      [value, minimumValue, maximumValue],
    );

    // Percentage for the fill bar width
    const progressPercent = useMemo(
      () => getSliderBarProgressPercent(clampedValue, minimumValue, maximumValue),
      [clampedValue, minimumValue, maximumValue],
    );

    // Announce percentage for a11y
    const accessibilityPercent = useMemo(
      () => getSliderBarAccessibilityPercent(clampedValue, minimumValue, maximumValue),
      [clampedValue, minimumValue, maximumValue],
    );

    // Height based on state, size, and expansion config
    const trackHeight = useMemo(
      () => getSliderBarTrackHeight({ state, size, shouldExpandOnFocus }),
      [state, size, shouldExpandOnFocus],
    );

    // Cross-axis (height/width) animates only on IDLE<->FOCUSED state changes.
    // Track the layout inputs so a size/orientation/expansion change snaps
    // instead of tweening. The mount render also snaps.
    const isFirstRender = useRef(true);
    const prevLayoutRef = useRef({ size, orientation, shouldExpandOnFocus });
    const layoutChanged =
      prevLayoutRef.current.size !== size ||
      prevLayoutRef.current.orientation !== orientation ||
      prevLayoutRef.current.shouldExpandOnFocus !== shouldExpandOnFocus;
    useEffect(() => {
      prevLayoutRef.current = { size, orientation, shouldExpandOnFocus };
    }, [size, orientation, shouldExpandOnFocus]);
    useEffect(() => {
      isFirstRender.current = false;
    }, []);
    const animateCrossAxis =
      resolvedStateAnimated && !layoutChanged && !isFirstRender.current;

    // Fill color based on state: idle color for IDLE, active color for FOCUSED.
    const fillColor = useMemo(() => {
      return getSliderBarFillColor(state);
    }, [state]);

    /**
     * Keyboard handler for Left/Right arrow keys. Arrow presses are consumed so
     * they adjust the value instead of moving focus, with Right incrementing and
     * Left decrementing.
     *
     * keydown fires repeatedly for held keys, and each repeat triggers an
     * increment, giving natural acceleration behavior.
     */
    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (!isInteractive) return;

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          event.stopPropagation();

          const newValue = getSliderBarNextValue({
            clampedValue,
            minimumValue,
            maximumValue,
            incrementPercentage,
            direction: event.key === 'ArrowRight' ? 'increment' : 'decrement',
          });
          onChange!(newValue);
        }
      },
      [isInteractive, clampedValue, minimumValue, maximumValue, incrementPercentage, onChange],
    );

    // Container style
    const containerStyle = useMemo(
      () => getSliderBarContainerStyle({
        orientation,
        trackHeight,
        animateCrossAxis,
        style,
      }),
      [animateCrossAxis, orientation, style, trackHeight],
    );

    // Fill style
    const fillStyle = useMemo(
      () => getSliderBarFillStyle({
        orientation,
        progressPercent,
        fillColor,
        valueAnimated: animated,
        stateAnimated: resolvedStateAnimated,
      }),
      [animated, resolvedStateAnimated, fillColor, orientation, progressPercent],
    );

    // Build className list
    const containerClassName = useMemo(
      () => getSliderBarClassName({
        baseClassName: styles.sliderBar,
        animatedClassName: styles.animated,
        stateAnimated: resolvedStateAnimated,
        className,
      }),
      [resolvedStateAnimated, className],
    );

    return (
      <SliderBarFrame
        ref={ref}
        className={containerClassName}
        style={containerStyle}
        isInteractive={isInteractive}
        presentational={presentational}
        clampedValue={clampedValue}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        accessibilityLabel={ariaLabel ?? `${accessibilityPercent}%`}
        accessibilityValueText={`${accessibilityPercent}%`}
        disabled={disabled}
        fillStyle={fillStyle}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  },
));

/**
 * In-package-only handle that accepts `presentational` (used by ListItem and
 * IsolatedControl, which own the slider role/state). Not barrel-exported.
 */
export const SliderBarInternal = SliderBarComponent;
