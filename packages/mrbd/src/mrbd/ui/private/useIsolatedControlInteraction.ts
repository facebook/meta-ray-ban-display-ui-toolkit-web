/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { State, type InteractionState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  clampIsolatedControlValue,
  getIsolatedControlAnnouncementPercent,
  getIsolatedControlNextValue,
  getIsolatedControlSliderState,
} from './IsolatedControlLayout';

export interface UseIsolatedControlInteractionOptions {
  /**
   * Controlled value. When undefined the control is uncontrolled and seeds
   * its internal value from `defaultValue`.
   */
  value?: number;
  /** Initial value for uncontrolled mode. Falls back to `minimumValue`. */
  defaultValue?: number;
  minimumValue: number;
  maximumValue: number;
  incrementPercentage: number;
  disabled: boolean;
  /**
   * Component-level animation default. Key-driven value changes animate with
   * this flag; the imperative `setValue` overrides it per call by forwarding the
   * caller's own animated flag to the slider.
   */
  animated: boolean;
  onValueChanged?: (value: number) => void;
  onClick?: () => void;
}

export function useIsolatedControlInteraction({
  value,
  defaultValue,
  minimumValue,
  maximumValue,
  incrementPercentage,
  disabled,
  animated,
  onValueChanged,
  onClick,
}: UseIsolatedControlInteractionOptions) {
  const [interactionState, setInteractionState] = useState<State>(State.DEFAULT);

  // Whether the currently rendered value transition should animate. Seeded from
  // the component-level `animated`; each commit updates it so a programmatic
  // `setValue(v, false)` jumps while key increments animate.
  const [valueAnimated, setValueAnimated] = useState<boolean>(animated);

  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState<number>(
    () => defaultValue ?? minimumValue,
  );

  // The value the control actually renders: the controlled prop when provided,
  // otherwise the self-managed internal value.
  const rawValue = isControlled ? value : internalValue;

  const clampedValue = useMemo(
    () => clampIsolatedControlValue(rawValue, minimumValue, maximumValue),
    [rawValue, minimumValue, maximumValue],
  );

  // Latest clamped value, read by imperative/key handlers without re-binding.
  const clampedValueRef = useRef(clampedValue);
  const isControlledRef = useRef(isControlled);
  useLayoutEffect(() => {
    clampedValueRef.current = clampedValue;
    isControlledRef.current = isControlled;
  }, [clampedValue, isControlled]);

  const sliderBarState = useMemo(
    () => getIsolatedControlSliderState(interactionState),
    [interactionState],
  );

  const accessPercent = useMemo(
    () => getIsolatedControlAnnouncementPercent(
      clampedValue,
      minimumValue,
      maximumValue,
    ),
    [clampedValue, minimumValue, maximumValue],
  );

  // Commits a new value: self-updates internal state when uncontrolled, and
  // always notifies via onValueChanged. The control mutates its own value and
  // fires the listener.
  const commitValue = useCallback(
    (next: number, animatedChange: boolean) => {
      const clamped = clampIsolatedControlValue(next, minimumValue, maximumValue);
      setValueAnimated(animatedChange);
      if (!isControlledRef.current) {
        setInternalValue(clamped);
      }
      onValueChanged?.(clamped);
    },
    [minimumValue, maximumValue, onValueChanged],
  );

  const setValue = useCallback(
    (next: number, animatedChange: boolean = false) => {
      commitValue(next, animatedChange);
    },
    [commitValue],
  );

  const incrementOrDecrement = useCallback(
    (increment: boolean) => {
      commitValue(
        getIsolatedControlNextValue({
          value: clampedValueRef.current,
          minimumValue,
          maximumValue,
          incrementPercentage,
          increment,
        }),
        animated,
      );
    },
    [commitValue, minimumValue, maximumValue, incrementPercentage, animated],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if ((event.key === 'Enter' || event.key === ' ') && onClick) {
        event.preventDefault();
        onClick();
      }
    },
    [disabled, onClick],
  );
  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      incrementOrDecrement(event.key === 'ArrowRight');
    },
    [disabled, incrementOrDecrement],
  );

  const handleStateChange = useCallback(
    (_prev: InteractionState, next: InteractionState) => {
      setInteractionState(next.state);
    },
    [],
  );

  return {
    clampedValue,
    sliderBarState,
    accessPercent,
    valueAnimated,
    setValue,
    handleKeyDown,
    handleKeyUp,
    handleStateChange,
  };
}
