/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { SliderBarState } from '../SliderBar.types';
import {
  LIST_ITEM_DEFAULT_SLIDER_INCREMENT_PERCENTAGE,
} from './ListItemMetrics';
import { TimestampPosition } from '../ListItem.types';
import type {
  ListItemAriaRole,
  ListItemContentDescriptionInput,
  ListItemLayoutState,
  ListItemVisibilityInput,
} from './ListItemLayout.types';

export type {
  ListItemAriaRole,
  ListItemContentDescriptionInput,
  ListItemLayoutState,
  ListItemVisibilityInput,
} from './ListItemLayout.types';

export function hasVisibleListItemText(value?: string): value is string {
  return value != null && value.length > 0;
}

export function clampListItemSliderValue(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  return Math.min(Math.max(value, minimumValue), maximumValue);
}

export function getListItemSliderNextValue({
  value,
  minimumValue,
  maximumValue,
  incrementPercentage = LIST_ITEM_DEFAULT_SLIDER_INCREMENT_PERCENTAGE,
  increment,
}: {
  value: number;
  minimumValue: number;
  maximumValue: number;
  incrementPercentage?: number;
  increment: boolean;
}): number {
  const step = (maximumValue - minimumValue) * incrementPercentage;
  const delta = increment ? step : -step;

  return clampListItemSliderValue(value + delta, minimumValue, maximumValue);
}

export function getListItemSliderAnnouncementPercent(
  value: number,
  minimumValue: number,
  maximumValue: number,
): number {
  if (minimumValue === maximumValue) {
    return 100;
  }

  return Math.round(((value - minimumValue) / (maximumValue - minimumValue)) * 100);
}

export function getListItemSliderState(state: State): SliderBarState {
  switch (state) {
    case State.FOCUSED:
    case State.PRESSED:
      return SliderBarState.FOCUSED;
    case State.DEFAULT:
    default:
      return SliderBarState.IDLE;
  }
}

export function getListItemAriaRole({
  effectiveShowSlider,
  effectiveShowSwitch,
  effectiveShowRadio,
}: Pick<
  ListItemLayoutState,
  'effectiveShowSlider' | 'effectiveShowSwitch' | 'effectiveShowRadio'
>): ListItemAriaRole {
  if (effectiveShowSlider) {
    return 'slider';
  }

  if (effectiveShowSwitch) {
    return 'switch';
  }

  if (effectiveShowRadio) {
    return 'radio';
  }

  return 'button';
}

export function getListItemLayoutState({
  title,
  subtitle,
  subtitleMaxLines,
  timestamp,
  timestampPosition,
  showSwitch,
  showRadioButton,
  showSlider,
  statusIndicator,
  statusIndicatorIcons,
  hasAccessoryIcon,
  accessoryIconAlwaysVisible,
  trailingTagLabel,
  hasAvatar,
  hasIcon,
  currentState,
}: ListItemVisibilityInput): ListItemLayoutState {
  const effectiveTitle = showSlider ? undefined : title;
  const effectiveSubtitle = showSlider ? undefined : subtitle;
  const effectiveShowSlider =
    showSlider &&
    !hasVisibleListItemText(effectiveTitle) &&
    !hasVisibleListItemText(effectiveSubtitle);
  const effectiveHasTimestamp = hasVisibleListItemText(timestamp);
  const hasStatusIcons = statusIndicatorIcons != null && statusIndicatorIcons.length > 0;
  const effectiveHasStatus = statusIndicator != null || hasStatusIcons;
  const effectiveShowSwitch =
    showSwitch && !effectiveHasTimestamp && !effectiveHasStatus;
  const effectiveShowRadio =
    showRadioButton && !showSwitch && !effectiveHasTimestamp && !effectiveHasStatus;
  const effectiveHasAccessoryIcon =
    hasAccessoryIcon &&
    !effectiveShowSwitch &&
    !effectiveShowRadio &&
    !effectiveHasTimestamp &&
    !effectiveHasStatus;
  const effectiveHasTag =
    hasVisibleListItemText(trailingTagLabel) &&
    !effectiveShowSwitch &&
    !effectiveShowRadio &&
    !effectiveHasTimestamp &&
    !effectiveHasStatus &&
    !effectiveHasAccessoryIcon;
  const showAccessoryTimestamp =
    effectiveHasTimestamp &&
    (timestampPosition === TimestampPosition.ACCESSORY ||
      timestampPosition === TimestampPosition.ACCESSORY_TOP);
  const showSubtitleTimestamp =
    effectiveHasTimestamp && timestampPosition === TimestampPosition.SUBTITLE;
  const hasTrailingContent =
    effectiveShowSwitch ||
    effectiveShowRadio ||
    effectiveHasAccessoryIcon ||
    effectiveHasTag ||
    showAccessoryTimestamp ||
    showSubtitleTimestamp ||
    effectiveHasStatus;

  const layoutState: Omit<ListItemLayoutState, 'ariaRole'> = {
    effectiveTitle,
    effectiveSubtitle,
    effectiveShowSlider,
    effectiveShowSwitch,
    effectiveShowRadio,
    effectiveHasTimestamp,
    effectiveHasStatus,
    effectiveHasAccessoryIcon,
    effectiveHasTag,
    hasAvatar,
    hasIcon,
    hasLeading: hasAvatar || hasIcon,
    hasStatusIcons,
    // Multiline is derived solely from the subtitle clamp. There is no
    // app-level font-scale signal on the web (scaling is browser-level zoom/rem),
    // so there is no large-font path that forces a 2-line title.
    isMultiline: subtitleMaxLines > 1,
    showAccessoryTimestamp,
    showSubtitleTimestamp,
    hasTrailingContent,
    accessoryIconOpacity:
      currentState === State.DEFAULT && !accessoryIconAlwaysVisible ? 0 : 1,
    sliderState: getListItemSliderState(currentState),
  };

  return {
    ...layoutState,
    ariaRole: getListItemAriaRole(layoutState),
  };
}

export function getListItemContentDescription({
  layout,
  titleContentDescription,
  subtitleContentDescription,
  timestampContentDescription,
  timestamp,
  statusIndicator,
  statusIndicatorIcons,
  trailingTagLabel,
  containerContentDescription,
}: ListItemContentDescriptionInput): string {
  const parts: string[] = [];

  if (hasVisibleListItemText(containerContentDescription)) {
    parts.push(containerContentDescription);
  }

  const titleDesc = titleContentDescription ?? layout.effectiveTitle;
  const subtitleDesc = subtitleContentDescription ?? layout.effectiveSubtitle;
  const timestampDesc = timestampContentDescription ?? timestamp;

  if (hasVisibleListItemText(titleDesc)) {
    parts.push(titleDesc);
  }

  if (hasVisibleListItemText(subtitleDesc)) {
    parts.push(subtitleDesc);
  }

  if (
    hasVisibleListItemText(timestampDesc) &&
    (layout.showAccessoryTimestamp || layout.showSubtitleTimestamp)
  ) {
    parts.push(timestampDesc);
  }

  if (layout.effectiveHasStatus && statusIndicator?.contentDescription) {
    parts.push(statusIndicator.contentDescription);
  }

  if (layout.effectiveHasTag && trailingTagLabel) {
    parts.push(trailingTagLabel);
  }

  if (layout.effectiveHasStatus && statusIndicatorIcons) {
    for (const statusIcon of statusIndicatorIcons) {
      if (hasVisibleListItemText(statusIcon.accessibilityContentDescription)) {
        parts.push(statusIcon.accessibilityContentDescription);
      }
    }
  }

  return parts.join(', ');
}

export function getListItemSubtitleStyle(subtitleMaxLines: number): CSSProperties {
  return {
    WebkitLineClamp: subtitleMaxLines,
    display: subtitleMaxLines > 1 ? '-webkit-box' : undefined,
    WebkitBoxOrient: subtitleMaxLines > 1 ? 'vertical' : undefined,
    whiteSpace: subtitleMaxLines > 1 ? 'normal' : 'nowrap',
  };
}
