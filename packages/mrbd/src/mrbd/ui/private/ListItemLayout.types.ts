/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import type { SliderBarState } from '../SliderBar.types';
import type {
  StatusIcon,
  StatusIndicator,
  TimestampPosition,
} from '../ListItem.types';

export type ListItemAriaRole = 'button' | 'switch' | 'radio' | 'slider';

export interface ListItemVisibilityInput {
  title?: string;
  subtitle?: string;
  subtitleMaxLines: number;
  timestamp?: string;
  timestampPosition: TimestampPosition;
  showSwitch: boolean;
  showRadioButton: boolean;
  showSlider: boolean;
  statusIndicator?: StatusIndicator;
  statusIndicatorIcons?: StatusIcon[];
  hasAccessoryIcon: boolean;
  accessoryIconAlwaysVisible: boolean;
  trailingTagLabel?: string;
  hasAvatar: boolean;
  hasIcon: boolean;
  currentState: State;
}

export interface ListItemLayoutState {
  effectiveTitle?: string;
  effectiveSubtitle?: string;
  effectiveShowSlider: boolean;
  effectiveShowSwitch: boolean;
  effectiveShowRadio: boolean;
  effectiveHasTimestamp: boolean;
  effectiveHasStatus: boolean;
  effectiveHasAccessoryIcon: boolean;
  effectiveHasTag: boolean;
  hasAvatar: boolean;
  hasIcon: boolean;
  hasLeading: boolean;
  hasStatusIcons: boolean;
  isMultiline: boolean;
  showAccessoryTimestamp: boolean;
  showSubtitleTimestamp: boolean;
  hasTrailingContent: boolean;
  accessoryIconOpacity: number;
  ariaRole: ListItemAriaRole;
  sliderState: SliderBarState;
}

export interface ListItemContentDescriptionInput {
  layout: ListItemLayoutState;
  titleContentDescription?: string;
  subtitleContentDescription?: string;
  timestampContentDescription?: string;
  timestamp?: string;
  statusIndicator?: StatusIndicator;
  statusIndicatorIcons?: StatusIcon[];
  trailingTagLabel?: string;
  containerContentDescription?: string;
}
