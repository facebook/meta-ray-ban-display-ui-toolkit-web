/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ReactNode,
  RefObject,
} from 'react';
import type {
  TooltipCenterPositionProvider,
  TooltipPosition,
  TooltipTargetRectProvider,
} from './TooltipPositioning';

export interface TooltipPopupProps {
  isVisible: boolean;
  text?: string;
  metadata?: string;
  content?: ReactNode;
  contentDescription?: string;
  focusable: boolean;
  showTail: boolean;
  position: TooltipPosition;
  centerPositionProvider?: TooltipCenterPositionProvider;
  targetRectProvider?: TooltipTargetRectProvider;
  anchorRef: RefObject<HTMLElement | null>;
  onFocusWithinChange: (hasFocus: boolean) => void;
  onBackRequest?: () => void;
  onExited: () => void;
}

export interface TooltipContentInjectedProps {
  tailCenterX: number;
  tailDirection?: 'up' | 'down';
  focusSearchOrigin: HTMLElement | null;
  maxWidth: number;
  isPositioned: boolean;
}
