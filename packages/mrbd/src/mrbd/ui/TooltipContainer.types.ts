/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { TooltipTailDirection } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning.types';

export type TooltipContainerTailDirection = TooltipTailDirection;

export interface TooltipContainerProps {
  /** The text to display in the tooltip */
  text?: string;

  /** The metadata text to display in the tooltip */
  metadata?: string;

  /** Icon to display on the leading (left) side */
  icon?: IconSource;

  /** Icon to display on the trailing (right) side */
  trailingIcon?: IconSource;

  /**
   * Whether to show the tooltip tail (triangular pointer arrow).
   * When false, the tail is hidden and the tooltip uses a clean pill shape.
   * Defaults to true.
   */
  showTooltipTail?: boolean;

  /** Position relative to anchor — controls tail direction */
  tailDirection?: TooltipContainerTailDirection;

  /** Tail horizontal center position in px (relative to tooltip left edge) */
  tailCenterX?: number;

  /** Additional inline styles */
  style?: CSSProperties;

  /** Additional CSS class */
  className?: string;

  /** Width of container */
  width?: number | string;

  /** Height of container */
  height?: number | string;
}
