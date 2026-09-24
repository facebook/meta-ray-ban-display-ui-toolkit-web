/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { contextMenuPath } from './ContextMenuPath';
import {
  getContextMenuEffectiveSize,
  getContextMenuShadowOffsetY,
} from './ContextMenuLayout';
import type {
  ContextMenuMeasuredSize,
  ContextMenuTailDirection,
} from './ContextMenuLayout.types';

export interface ContextMenuContainerStyleOptions {
  totalHeight: number;
  paddingTop: number;
  paddingBottom: number;
  dropShadowPadding: number;
  maxWidth?: number;
  style?: CSSProperties;
}

export function getContextMenuContainerStyle({
  totalHeight,
  paddingTop,
  paddingBottom,
  dropShadowPadding,
  maxWidth,
  style = {},
}: ContextMenuContainerStyleOptions): CSSProperties {
  return {
    height: totalHeight,
    padding: `${paddingTop}px ${dropShadowPadding}px ${paddingBottom}px ${dropShadowPadding}px`,
    width: 'max-content',
    maxWidth,
    boxSizing: 'border-box',
    ...style,
  };
}

export interface ContextMenuMaterialShapeOptions {
  measuredSize: ContextMenuMeasuredSize;
  maxWidth?: number;
  totalHeight: number;
  dropShadowPadding: number;
  showTailPointer: boolean;
  tailDirection?: ContextMenuTailDirection;
  tailCenterX?: number;
}

export interface ContextMenuMaterialShape {
  effectiveWidth: number;
  effectiveHeight: number;
  pathD: string | null;
  shadowOffsetY: number;
}

export function getContextMenuMaterialShape({
  measuredSize,
  maxWidth,
  totalHeight,
  dropShadowPadding,
  showTailPointer,
  tailDirection,
  tailCenterX,
}: ContextMenuMaterialShapeOptions): ContextMenuMaterialShape {
  const { width: effectiveWidth, height: effectiveHeight } =
    getContextMenuEffectiveSize(measuredSize, maxWidth, totalHeight);
  const pathD =
    effectiveWidth > 0 && effectiveHeight > 0
      ? contextMenuPath({
          width: effectiveWidth,
          height: effectiveHeight,
          inset: dropShadowPadding,
          tailDirection: showTailPointer ? tailDirection : undefined,
          tailCenterX: tailCenterX ?? effectiveWidth / 2,
        })
      : null;

  return {
    effectiveWidth,
    effectiveHeight,
    pathD,
    shadowOffsetY: getContextMenuShadowOffsetY(tailDirection),
  };
}

export function getContextMenuScrollViewportStyle(
  fadingEdgeLength: number,
): CSSProperties {
  return {
    '--uit-context-menu-fading-edge-length': `${fadingEdgeLength}px`,
  } as CSSProperties;
}
