/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import type { VisualState } from '../../base/Interactions';
import type {
  MaterialLayer,
  MaterialShapeContext,
} from '../../material/ContainerMaterial';
import { ContainerMaterialCanvas } from './ContainerMaterialCanvas';
import { ZERO_PARTIAL_FOCUS_POSITION } from './useContainerPartialFocusFeedback';
import styles from '../Container.module.css';
import { ContentSurface } from './ContentSurface';
import type { ContainerContentStyle, ContentClipMode } from '../ContainerContent.types';

const STATIC_INTERACTION_TRANSITION = {
  duration: 0,
  interpolator: 'linear',
} as const;

interface StaticContainerFrameProps {
  children?: ReactNode;
  /** Pass-through DOM attributes spread FIRST on the root element. */
  rootProps?: HTMLAttributes<HTMLDivElement>;
  containerRef: Ref<HTMLDivElement>;
  contentRef: Ref<HTMLDivElement>;
  backgroundLayerRef: Ref<HTMLDivElement>;
  foregroundLayerRef: Ref<HTMLDivElement>;
  className: string;
  contentClassName?: string;
  containerStyle: CSSProperties;
  effectiveUseSmoothCorners: boolean;
  smoothCornerPath: string | null;
  materialShapePath: string | null;
  contentClip: ContentClipMode;
  contentStyle?: ContainerContentStyle;
  outerWidth?: number;
  outerHeight?: number;
  fallbackRadius?: string;
  fillWidth: boolean;
  fillHeight: boolean;
  backgroundLayers: MaterialLayer[];
  foregroundLayers: MaterialLayer[];
  visualState: VisualState;
  containerW: number;
  containerH: number;
  shapeContext: MaterialShapeContext;
  idPrefix: string;
  backgroundLayerStyle: CSSProperties;
  foregroundLayerStyle: CSSProperties;
  foregroundBlendsWithContent: boolean;
  backgroundBlendsWithBackdrop: boolean;
}

/**
 * Render-only StaticContainer frame: static material layers, content clipping,
 * and smooth-corner clip definitions without interaction state.
 */
export const StaticContainerFrame = memo(function StaticContainerFrame({
  children,
  rootProps,
  containerRef,
  contentRef,
  backgroundLayerRef,
  foregroundLayerRef,
  className,
  contentClassName = '',
  containerStyle,
  effectiveUseSmoothCorners,
  smoothCornerPath,
  materialShapePath,
  contentClip,
  contentStyle,
  outerWidth,
  outerHeight,
  fallbackRadius,
  fillWidth,
  fillHeight,
  backgroundLayers,
  foregroundLayers,
  visualState,
  containerW,
  containerH,
  shapeContext,
  idPrefix,
  backgroundLayerStyle,
  foregroundLayerStyle,
  foregroundBlendsWithContent,
  backgroundBlendsWithBackdrop,
}: StaticContainerFrameProps) {
  const materialClipPath = useMemo(
    () => materialShapePath
      ? `path('${materialShapePath}')`
      : undefined,
    [materialShapePath],
  );
  const contentClipPath = useMemo(
    () => effectiveUseSmoothCorners && smoothCornerPath
      ? `path('${smoothCornerPath}')`
      : undefined,
    [effectiveUseSmoothCorners, smoothCornerPath],
  );
  const backgroundLayerWrapperStyle = useMemo(
    () => ({
      ...backgroundLayerStyle,
      isolation: backgroundBlendsWithBackdrop ? 'auto' as const : undefined,
      zIndex: backgroundBlendsWithBackdrop ? 'auto' as const : undefined,
    }),
    [backgroundBlendsWithBackdrop, backgroundLayerStyle],
  );
  const foregroundLayerWrapperStyle = useMemo(
    () => ({
      ...foregroundLayerStyle,
      zIndex: foregroundBlendsWithContent
        ? 'auto' as const
        : backgroundBlendsWithBackdrop
          ? 2
          : undefined,
    }),
    [
      backgroundBlendsWithBackdrop,
      foregroundBlendsWithContent,
      foregroundLayerStyle,
    ],
  );

  return (
    <div
      {...rootProps}
      data-uit-background-blends-with-backdrop={
        backgroundBlendsWithBackdrop ? 'true' : undefined
      }
      ref={containerRef}
      className={`${styles.container} ${className} ${rootProps?.className ?? ''}`.trim()}
      style={{ ...containerStyle, ...rootProps?.style }}
    >
      <div
        ref={backgroundLayerRef}
        className={styles.backgroundLayers}
        style={backgroundLayerWrapperStyle}
      >
        <ContainerMaterialCanvas
          layers={backgroundLayers}
          effectiveVisualState={visualState}
          activeMaterialTransition={null}
          isMaterialTransitionControlled={false}
          animated={false}
          effectiveUseSmoothCorners={effectiveUseSmoothCorners}
          materialClipPath={materialClipPath}
          layerPathD={materialShapePath}
          layerW={containerW}
          layerH={containerH}
          idPrefix={idPrefix}
          shapeContext={shapeContext}
          partialFocusPosition={ZERO_PARTIAL_FOCUS_POSITION}
          interactionTransition={STATIC_INTERACTION_TRANSITION}
          blendWithContent={backgroundBlendsWithBackdrop}
        />
      </div>

      <ContentSurface
        surfaceRef={contentRef}
        contentClassName={contentClassName}
        contentStyle={contentStyle}
        contentClip={contentClip}
        outerWidth={outerWidth}
        outerHeight={outerHeight}
        fallbackRadius={fallbackRadius}
        fillWidth={fillWidth}
        fillHeight={fillHeight}
        clipPath={effectiveUseSmoothCorners ? contentClipPath : undefined}
        backgroundBlendsWithBackdrop={backgroundBlendsWithBackdrop}
      >
        {children}
      </ContentSurface>

      <div
        ref={foregroundLayerRef}
        className={styles.foregroundLayers}
        style={foregroundLayerWrapperStyle}
      >
        <ContainerMaterialCanvas
          layers={foregroundLayers}
          effectiveVisualState={visualState}
          activeMaterialTransition={null}
          isMaterialTransitionControlled={false}
          animated={false}
          effectiveUseSmoothCorners={effectiveUseSmoothCorners}
          materialClipPath={materialClipPath}
          layerPathD={materialShapePath}
          layerW={containerW}
          layerH={containerH}
          idPrefix={idPrefix}
          shapeContext={shapeContext}
          partialFocusPosition={ZERO_PARTIAL_FOCUS_POSITION}
          interactionTransition={STATIC_INTERACTION_TRANSITION}
          blendWithContent={foregroundBlendsWithContent}
        />
      </div>
    </div>
  );
});
