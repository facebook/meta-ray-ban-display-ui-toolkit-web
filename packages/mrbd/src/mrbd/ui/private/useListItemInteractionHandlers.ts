/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
  type MouseEventHandler,
} from 'react';
import type { ListItemLayoutState } from './ListItemLayout.types';
import { getListItemSliderNextValue } from './ListItemLayout';

export interface UseListItemInteractionHandlersParams {
  disabled: boolean;
  layout: Pick<
    ListItemLayoutState,
    'effectiveShowSlider' | 'effectiveShowSwitch' | 'effectiveShowRadio'
  >;
  sliderValue: number;
  sliderMinimumValue: number;
  sliderMaximumValue: number;
  sliderIncrementPercentage: number;
  checked: boolean;
  onSliderValueChange?: (value: number) => void;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: MouseEventHandler<HTMLElement>;
}

export interface ListItemInteractionHandlers {
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  handleKeyUp: (event: KeyboardEvent<HTMLDivElement>) => void;
  handleListItemClick: (event: MouseEvent<HTMLElement>) => void;
}

export function useListItemInteractionHandlers({
  disabled,
  layout,
  sliderValue,
  sliderMinimumValue,
  sliderMaximumValue,
  sliderIncrementPercentage,
  checked,
  onSliderValueChange,
  onCheckedChange,
  onClick,
}: UseListItemInteractionHandlersParams): ListItemInteractionHandlers {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      if (
        layout.effectiveShowSlider &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [disabled, layout.effectiveShowSlider],
  );
  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (
        disabled ||
        !layout.effectiveShowSlider ||
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const newValue = getListItemSliderNextValue({
        value: sliderValue,
        minimumValue: sliderMinimumValue,
        maximumValue: sliderMaximumValue,
        incrementPercentage: sliderIncrementPercentage,
        increment: event.key === 'ArrowRight',
      });
      onSliderValueChange?.(newValue);
    },
    [
      disabled,
      layout.effectiveShowSlider,
      sliderValue,
      sliderMinimumValue,
      sliderMaximumValue,
      sliderIncrementPercentage,
      onSliderValueChange,
    ],
  );

  const handleListItemClick = useCallback((event: MouseEvent<HTMLElement>) => {
    if (disabled) {
      return;
    }

    if (layout.effectiveShowSwitch || layout.effectiveShowRadio) {
      onCheckedChange?.(!checked);
      return;
    }

    onClick?.(event);
  }, [
    disabled,
    layout.effectiveShowSwitch,
    layout.effectiveShowRadio,
    checked,
    onCheckedChange,
    onClick,
  ]);

  return {
    handleKeyDown,
    handleKeyUp,
    handleListItemClick,
  };
}
