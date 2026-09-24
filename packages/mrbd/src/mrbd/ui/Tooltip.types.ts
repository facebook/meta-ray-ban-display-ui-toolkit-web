/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { TooltipPosition } from '@wearables-ui-toolkit/foundation/base/InteractableBase';
import type {
  TooltipCenterPositionProvider,
  TooltipTargetRectProvider,
} from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';

export type {
  TooltipAnchorPoint,
  TooltipAnchorRect,
  TooltipCenterPositionProvider,
  TooltipTargetRectProvider,
} from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';

export interface TooltipShowOptions {
  text?: string;
  metadata?: string;
  icon?: IconSource;
  trailingIcon?: IconSource;
  content?: ReactNode;
  contentDescription?: string;
  isFocusable?: boolean;
  tracksAnchorScale?: boolean;
  centerPositionProvider?: TooltipCenterPositionProvider;
  targetRectProvider?: TooltipTargetRectProvider;
  /**
   * Whether to automatically dismiss the tooltip after a delay.
   * Defaults to `false`.
   */
  shouldAutoDismiss?: boolean;
  position?: TooltipPosition;
  showTooltipTail?: boolean;
  /**
   * Invoked exactly once when this tooltip hides, regardless of how it was
   * hidden (explicit `hide()` call or auto-dismiss completion).
   */
  onHide?: () => void;
}

export interface TooltipState {
  isShowing: boolean;
  portal: ReactNode;
  show: (anchor: HTMLElement, options: TooltipShowOptions) => void;
  /** Updates a visible tooltip without restarting its presentation. */
  update: (anchor: HTMLElement, options: TooltipShowOptions) => void;
  hide: (animated?: boolean) => void;
  refreshPosition: () => void;
}

export interface TooltipProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  text?: string;
  metadata?: string;
  icon?: IconSource;
  trailingIcon?: IconSource;
  content?: ReactNode;
  contentDescription?: string;
  isFocusable?: boolean;
  tracksAnchorScale?: boolean;
  centerPositionProvider?: TooltipCenterPositionProvider;
  targetRectProvider?: TooltipTargetRectProvider;
  isVisible?: boolean;
  onHide?: () => void;
  position?: TooltipPosition;
  /**
   * Whether to automatically dismiss the tooltip after a delay.
   * Defaults to `false`.
   */
  shouldAutoDismiss?: boolean;
  showTooltipTail?: boolean;
}
