/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';

export interface InteractableBaseSemanticsOptions {
  isFocusable: boolean;
  isClickable: boolean;
  isDisabled: boolean;
  hasInteractionState: boolean;
  tabIndex: number;
  role?: string;
  ariaDisabled?: boolean;
  inferButtonRole?: boolean;
  forceNonFocusableTabIndex?: boolean;
}

export interface InteractableBaseSemantics {
  role?: string;
  tabIndex?: number;
  ariaDisabled?: boolean;
}

export function getInteractableBaseSemantics({
  isFocusable,
  isClickable,
  isDisabled,
  hasInteractionState,
  tabIndex,
  role,
  ariaDisabled,
  inferButtonRole = true,
  forceNonFocusableTabIndex = false,
}: InteractableBaseSemanticsOptions): InteractableBaseSemantics {
  return {
    role: role ?? (isClickable && inferButtonRole ? 'button' : undefined),
    tabIndex: isFocusable ? tabIndex : forceNonFocusableTabIndex ? -1 : undefined,
    ariaDisabled: hasInteractionState ? (ariaDisabled ?? isDisabled) : ariaDisabled,
  };
}

export interface InteractableBaseStyleOptions {
  style?: CSSProperties;
  isClickable: boolean;
  isDisabled: boolean;
  hasTooltip: boolean;
}

export function getInteractableBaseStyle({
  style = {},
  isClickable,
  isDisabled,
  hasTooltip,
}: InteractableBaseStyleOptions): CSSProperties {
  return {
    cursor: isClickable ? (isDisabled ? 'not-allowed' : 'pointer') : 'default',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    opacity: isDisabled ? 'var(--uit-disabled-opacity)' : 'var(--uit-enabled-opacity)',
    ...style,
    position: hasTooltip ? 'relative' : undefined,
  };
}
