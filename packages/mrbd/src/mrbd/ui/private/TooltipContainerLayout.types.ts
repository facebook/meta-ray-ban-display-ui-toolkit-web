/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import type { TooltipTailDirection } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning.types';

export interface TooltipContainerTailDimensions {
  tailHeight: number;
  tailWidth: number;
  tailLayoutPadding: number;
}

export interface TooltipContainerPadding {
  paddingTop: number;
  paddingBottom: number;
}

export interface TooltipContainerPaddingInput {
  showTail: boolean;
  tailDirection?: TooltipTailDirection;
  tailLayoutPadding: number;
  dropShadowPadding: number;
}

export interface TooltipContainerStyleInput {
  paddingTop: number;
  paddingBottom: number;
  dropShadowPadding: number;
  width?: number | string;
  autoWidth?: number;
  height?: number | string;
  style: CSSProperties;
}

export interface TooltipContainerAutoWidthInput {
  width?: number | string;
  measuredWidth: number;
}

export interface TooltipContainerEffectiveSizeInput {
  measuredWidth: number;
  measuredHeight: number;
  width?: number | string;
  height?: number | string;
}

export interface TooltipContainerEffectiveSize {
  width: number;
  height: number;
}
