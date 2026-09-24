/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  KeyboardEventHandler,
  ReactElement,
} from 'react';
import type { TooltipPosition } from '@wearables-ui-toolkit/foundation/base/TooltipPopup';
import type { TooltipTargetRectProvider } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';
import type { StaticContainerProps } from '@wearables-ui-toolkit/foundation';
import type { VerticalMenuButtonProps } from './VerticalMenuButton.types';

export const VerticalMenuCorner = {
  ABOVE_LEFT: 'above-left',
  ABOVE_RIGHT: 'above-right',
  BELOW_LEFT: 'below-left',
  BELOW_RIGHT: 'below-right',
} as const;
export type VerticalMenuCorner =
  (typeof VerticalMenuCorner)[keyof typeof VerticalMenuCorner];

export const VerticalMenuDismissReason = {
  ESCAPE: 'escape',
  NAVIGATION: 'navigation',
} as const;
export type VerticalMenuDismissReason =
  (typeof VerticalMenuDismissReason)[keyof typeof VerticalMenuDismissReason];

export interface VerticalMenuAnchorProps {
  tooltipFocusable: true;
  tooltipPosition: TooltipPosition;
  tooltipShowTail: false;
  tooltipTargetRectProvider: TooltipTargetRectProvider;
}

export interface VerticalMenuProps extends Omit<
  StaticContainerProps,
  | 'children'
  | 'clipContent'
  | 'cornerRadius'
  | 'height'
  | 'material'
  | 'onKeyDown'
  | 'onKeyDownCapture'
  | 'role'
  | 'width'
> {
  /** Menu items. */
  children?: ReactElement<VerticalMenuButtonProps> |
    readonly ReactElement<VerticalMenuButtonProps>[];

  /** Called when focus navigation exits the menu or Escape is pressed. */
  onDismissRequest?: (reason: VerticalMenuDismissReason) => void;

  /** Moves focus to the first menu item when mounted. */
  autoFocusFirstItem?: boolean;

  /** Receives key events before the menu handles them. */
  onKeyDownCapture?: KeyboardEventHandler<HTMLDivElement>;
}
