/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * RadioButton component for Meta Ray-Ban Display
 * Radio button control (checked/unchecked) — building block intended for use inside ListItem.
 */

import {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  canToggleRadioButton,
  getRadioButtonContainerStyle,
  getRadioButtonGeometry,
  isRadioButtonActivationKey,
} from './RadioButtonLayout';
import { RadioButtonFrame } from './RadioButtonFrame';
import type {
  RadioButtonInternalProps,
} from '../RadioButton.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * RadioButton component
 * Renders a circular radio button with a background circle, stroke ring, and an
 * inner filled circle when checked.
 */
const RadioButtonComponent = memo(forwardRef<HTMLDivElement, RadioButtonInternalProps>(
  function RadioButton(
    {
      checked = false,
      onChange,
      disabled = false,
      presentational = false,
      className = '',
      style = DEFAULT_STYLE,
      ...rest
    },
    ref
  ) {
    // Interactive only when a parent wired a change handler and the node is not
    // presentational — the node is checkable only when interaction is attached.
    // The public RadioButton never passes onChange, so it stays visual-only.
    const interactive = !presentational && onChange != null;

    const handleClick = useCallback(() => {
      if (!interactive || !canToggleRadioButton(disabled)) return;
      onChange?.(!checked);
    }, [interactive, disabled, checked, onChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
      if (!interactive || !canToggleRadioButton(disabled)) return;
      if (isRadioButtonActivationKey(e.key)) {
        e.preventDefault();
        onChange?.(!checked);
      }
    }, [interactive, disabled, checked, onChange]);

    const { center, outerRadius, strokeRadius, fillRadius } = useMemo(
      () => getRadioButtonGeometry(),
      [],
    );
    const containerStyle = useMemo(
      () => getRadioButtonContainerStyle({ interactive, disabled, style }),
      [interactive, disabled, style],
    );

    return (
      <RadioButtonFrame
        ref={ref}
        className={className}
        style={containerStyle}
        interactive={interactive}
        disabled={disabled}
        checked={checked}
        presentational={presentational}
        center={center}
        outerRadius={outerRadius}
        strokeRadius={strokeRadius}
        fillRadius={fillRadius}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  }
));

/**
 * In-package-only handle that accepts `presentational` (used by ListItem and
 * other parents that own the radio role/state). Not barrel-exported.
 */
export const RadioButtonInternal = RadioButtonComponent;
