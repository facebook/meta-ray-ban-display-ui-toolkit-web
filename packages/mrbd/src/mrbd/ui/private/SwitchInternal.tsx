/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Switch component for Meta Ray-Ban Display
 * Toggle switch control (on/off) — building block intended for use inside ListItem.
 */

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  canToggleSwitch,
  getSwitchContainerStyle,
  getSwitchGeometry,
  getSwitchPosition,
  getSwitchTransition,
  isSwitchActivationKey,
} from './SwitchLayout';
import { SwitchFrame } from './SwitchFrame';
import type { SwitchInternalProps } from '../Switch.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * Switch component
 * Renders a toggle switch with an animated thumb sliding between on/off positions.
 * The track color interpolates between the default and on-state colors.
 * The thumb shows as an outline (ring) when off and fills solid when on.
 */
const SwitchComponent = memo(forwardRef<HTMLDivElement, SwitchInternalProps>(
  function Switch(
    {
      checked = false,
      onChange,
      disabled = false,
      animated = true,
      presentational = false,
      className = '',
      style = DEFAULT_STYLE,
      ...rest
    },
    ref
  ) {
    // Interactive only when a parent wired a change handler and the node is not
    // presentational — the node is checkable only when interaction is attached.
    // The public Switch never passes onChange, so it stays a visual-only block.
    const interactive = !presentational && onChange != null;

    // Animation progress (0 = off, 1 = on) is a pure function of `checked`, so
    // it is derived in render — no duplicated state, no extra render per toggle.
    const position = getSwitchPosition(checked);

    // Snap on the mount render, animate on subsequent changes. The ref is
    // flipped after the first commit so the initial paint never animates.
    const isFirstRender = useRef(true);
    useEffect(() => {
      isFirstRender.current = false;
    }, []);

    const handleClick = useCallback(() => {
      if (!interactive || !canToggleSwitch(disabled)) return;
      onChange?.(!checked);
    }, [interactive, disabled, checked, onChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
      if (!interactive || !canToggleSwitch(disabled)) return;
      if (isSwitchActivationKey(e.key)) {
        e.preventDefault();
        onChange?.(!checked);
      }
    }, [interactive, disabled, checked, onChange]);

    // Calculate thumb center X position
    // thumbMargin = 4px
    const {
      thumbCenterX,
      thumbCenterY,
      thumbInnerRadius,
      thumbOutlineRadius,
      thumbTranslateX,
    } = useMemo(
      () => getSwitchGeometry(position),
      [position],
    );

    // Whether we should use CSS-driven transition
    const shouldAnimate = animated && !isFirstRender.current;

    const containerStyle = useMemo(
      () => getSwitchContainerStyle({ interactive, disabled, style }),
      [interactive, disabled, style],
    );

    // Transition for animated thumb/track movement
    // Uses a cubic-bezier(0.68, 0, 0.29, 1) easing over a 300ms duration.
    const transitionValue = useMemo(
      () => getSwitchTransition(shouldAnimate),
      [shouldAnimate],
    );

    return (
      <SwitchFrame
        ref={ref}
        className={className}
        style={containerStyle}
        interactive={interactive}
        disabled={disabled}
        checked={checked}
        presentational={presentational}
        thumbCenterX={thumbCenterX}
        thumbCenterY={thumbCenterY}
        thumbInnerRadius={thumbInnerRadius}
        thumbOutlineRadius={thumbOutlineRadius}
        thumbTranslateX={thumbTranslateX}
        position={position}
        shouldAnimate={shouldAnimate}
        transitionValue={transitionValue}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  }
));

/**
 * In-package-only handle that accepts `presentational` (used by ListItem and
 * other parents that own the switch role/state). Not barrel-exported.
 */
export const SwitchInternal = SwitchComponent;
