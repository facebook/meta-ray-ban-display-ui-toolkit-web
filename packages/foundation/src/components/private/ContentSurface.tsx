/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, type CSSProperties, type ReactNode, type Ref } from 'react';

import type { ContainerContentStyle, ContentClipMode } from '../ContainerContent.types';

export type ContentSurfaceStyle = ContainerContentStyle;

interface ContentSurfaceProps {
  children?: ReactNode;
  surfaceRef?: Ref<HTMLDivElement>;
  contentClassName?: string;
  contentStyle?: ContentSurfaceStyle;
  fillWidth: boolean;
  fillHeight: boolean;
  contentClip: ContentClipMode;
  clipPath?: string;
  outerWidth?: number;
  outerHeight?: number;
  fallbackRadius?: string;
  backgroundBlendsWithBackdrop: boolean;
}

const CONTENT_DISPLAYS = new Set(['block', 'flex', 'grid', 'inline-block', 'inline-flex', 'inline-grid', 'flow-root']);

/** The zero-root-inset, normal-flow content envelope shared by both container owners. */
export const ContentSurface = memo(function ContentSurface({
  children,
  surfaceRef,
  contentClassName,
  contentStyle,
  fillWidth,
  fillHeight,
  contentClip,
  clipPath,
  outerWidth,
  outerHeight,
  fallbackRadius = '0px',
  backgroundBlendsWithBackdrop,
}: ContentSurfaceProps) {
  const boundsClip = outerWidth != null && outerHeight != null && outerWidth > 0 && outerHeight > 0
    ? `inset(0px calc(100% - ${outerWidth}px) calc(100% - ${outerHeight}px) 0px round ${contentClip === 'shape' ? fallbackRadius : '0px'})`
    : undefined;
  const resolvedClip = contentClip === 'none' ? undefined : contentClip === 'shape' ? clipPath ?? boundsClip : boundsClip;
  const style: CSSProperties = {
    ...contentStyle,
    display: contentStyle?.display == null ? undefined : CONTENT_DISPLAYS.has(contentStyle.display) ? contentStyle.display : 'block',
    transform: undefined,
    translate: undefined,
    scale: undefined,
    rotate: 'none',
    zoom: 1,
    position: 'relative',
    boxSizing: 'border-box',
    width: fillWidth ? '100%' : 'auto',
    height: fillHeight ? '100%' : 'auto',
    minWidth: 0,
    minHeight: 0,
    maxWidth: 'none',
    maxHeight: 'none',
    margin: 0,
    flex: '1 1 auto',
    alignSelf: 'stretch',
    overflow: contentClip === 'none' ? 'visible' : 'hidden',
    borderRadius: resolvedClip == null && contentClip === 'shape' ? 'inherit' : 0,
    clipPath: resolvedClip,
    WebkitClipPath: resolvedClip,
    zIndex: backgroundBlendsWithBackdrop ? 1 : undefined,
  };
  return (
    <div ref={surfaceRef} className={contentClassName} data-uit-content-surface="" data-uit-content-clip={contentClip === 'none' ? undefined : 'true'} style={style}>
      {children}
    </div>
  );
});
