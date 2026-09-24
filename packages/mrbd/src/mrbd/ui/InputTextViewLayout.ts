/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  INPUT_TEXT_VIEW_ACCESSORY_TRAILING_PADDING,
  INPUT_TEXT_VIEW_ACTION_BUTTON_GAP,
  INPUT_TEXT_VIEW_ACTION_BUTTON_SIZE,
  INPUT_TEXT_VIEW_DEFAULT_EMPTY_WIDTH,
  INPUT_TEXT_VIEW_HORIZONTAL_PADDING,
} from './InputTextViewMetrics';
import type {
  InputTextViewLayoutState,
  InputTextViewScrollState,
} from './InputTextViewLayout.types';
import { InputTextViewSize } from './InputTextView.types';

export type {
  InputTextViewLayoutState,
  InputTextViewScrollState,
} from './InputTextViewLayout.types';

const SCROLL_EDGE_EPSILON_PX = 1;

export function shouldShowInputTextViewAccessory({
  showLoader,
}: {
  showLoader: boolean;
}): boolean {
  return showLoader;
}

export function shouldShowInputTextViewActionButton({
  showActionButton,
  hasAction,
}: {
  showActionButton: boolean;
  hasAction: boolean;
}): boolean {
  return hasAction && showActionButton;
}

export function getInputTextViewContainerWidth({
  size,
  hasText,
  showActionButton = false,
}: {
  size: InputTextViewSize;
  hasText: boolean;
  showActionButton?: boolean;
}): CSSProperties['width'] {
  if (size === InputTextViewSize.SHRINK_WHEN_EMPTY && !hasText) {
    return getInputTextViewEmptyContainerWidth();
  }

  return showActionButton
    ? `calc(100% - ${
      INPUT_TEXT_VIEW_ACTION_BUTTON_SIZE + INPUT_TEXT_VIEW_ACTION_BUTTON_GAP
    }px)`
    : '100%';
}

export function getInputTextViewEmptyContainerWidth(): number {
  return INPUT_TEXT_VIEW_DEFAULT_EMPTY_WIDTH;
}

export function getInputTextViewEditAreaStyle(showAccessory: boolean): CSSProperties {
  return {
    paddingRight: showAccessory
      ? INPUT_TEXT_VIEW_ACCESSORY_TRAILING_PADDING
      : INPUT_TEXT_VIEW_HORIZONTAL_PADDING,
  };
}

export function getInputTextViewScrollState({
  scrollTop,
  scrollHeight,
  clientHeight,
}: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): InputTextViewScrollState {
  const maxScroll = Math.max(scrollHeight - clientHeight, 0);
  const isScrollable = maxScroll > SCROLL_EDGE_EPSILON_PX;

  if (!isScrollable) {
    return {
      isScrollable: false,
      showTopFade: false,
      showBottomFade: false,
      scrollRatio: 0,
      viewportRatio: 1,
    };
  }

  const clampedScrollTop = Math.min(Math.max(scrollTop, 0), maxScroll);
  return {
    isScrollable: true,
    showTopFade: clampedScrollTop > SCROLL_EDGE_EPSILON_PX,
    showBottomFade: clampedScrollTop < maxScroll - SCROLL_EDGE_EPSILON_PX,
    scrollRatio: clampedScrollTop / maxScroll,
    viewportRatio: Math.min(clientHeight / scrollHeight, 1),
  };
}

export function getInputTextViewLayoutState({
  value,
  size,
  showLoader,
  showActionButton: showActionButtonProp,
  hasAction,
}: {
  value: string;
  size: InputTextViewSize;
  showLoader: boolean;
  showActionButton: boolean;
  hasAction: boolean;
}): InputTextViewLayoutState {
  const hasText = value.length > 0;
  const showAccessory = shouldShowInputTextViewAccessory({ showLoader });
  const showActionButton = shouldShowInputTextViewActionButton({
    showActionButton: showActionButtonProp,
    hasAction,
  });

  return {
    hasText,
    showAccessory,
    showActionButton,
    containerWidth: getInputTextViewContainerWidth({
      size,
      hasText,
      showActionButton,
    }),
    editAreaStyle: getInputTextViewEditAreaStyle(showAccessory),
  };
}
