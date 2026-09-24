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
  type ReactNode,
} from 'react';
import type { VisualState } from '../../base/Interactions';
import type {
  MaterialLayer,
  MaterialShapeContext,
  PartialFocusPosition,
} from '../../material/ContainerMaterial';
import { ContainerMaterialCanvas } from './ContainerMaterialCanvas';
import type { ContainerMaterialTransition } from '../ContainerMaterialLayers.types';
import styles from '../Container.module.css';

const CLIP_PATH_STYLE: CSSProperties = { position: 'absolute' };

interface ContainerFrameProps {
  children?: ReactNode;
  backgroundLayers: MaterialLayer[];
  foregroundLayers: MaterialLayer[];
  effectiveVisualState: VisualState;
  activeMaterialTransition: ContainerMaterialTransition | null;
  isMaterialTransitionControlled: boolean;
  animated: boolean;
  effectiveUseSmoothCorners: boolean;
  smoothCornerPath: string | null;
  cssSmoothCornerClipPath?: string;
  clipPathId: string;
  insetClipPathId: string;
  insetSmoothCornerPath: string | null;
  materialLayerPositionStyle: CSSProperties;
  hasInset: boolean;
  clipContent: boolean;
  layerPathD: string | null;
  layerW: number;
  layerH: number;
  idPrefix: string;
  shapeContext: MaterialShapeContext;
  partialFocusPosition: PartialFocusPosition;
  interactionTransition: {
    duration: number;
    interpolator: string;
  };
  foregroundBlendsWithContent: boolean;
  backgroundBlendsWithBackdrop: boolean;
}

/**
 * Container draw order: smooth clip definitions, background material, clipped
 * content, then foreground material.
 */
export const ContainerFrame = memo(function ContainerFrame({
  children,
  backgroundLayers,
  foregroundLayers,
  effectiveVisualState,
  activeMaterialTransition,
  isMaterialTransitionControlled,
  animated,
  effectiveUseSmoothCorners,
  smoothCornerPath,
  cssSmoothCornerClipPath,
  clipPathId,
  insetClipPathId,
  insetSmoothCornerPath,
  materialLayerPositionStyle,
  hasInset,
  clipContent,
  layerPathD,
  layerW,
  layerH,
  idPrefix,
  shapeContext,
  partialFocusPosition,
  interactionTransition,
  foregroundBlendsWithContent,
  backgroundBlendsWithBackdrop,
}: ContainerFrameProps) {
  const materialClipPath = useMemo(
    () => effectiveUseSmoothCorners
      ? hasInset && insetSmoothCornerPath
        ? `url(#${insetClipPathId})`
        : `url(#${clipPathId})`
      : undefined,
    [
      clipPathId,
      effectiveUseSmoothCorners,
      hasInset,
      insetClipPathId,
      insetSmoothCornerPath,
    ],
  );
  const contentWrapperStyle = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      position: backgroundBlendsWithBackdrop || foregroundBlendsWithContent
        ? 'relative' as const
        : undefined,
      zIndex: backgroundBlendsWithBackdrop ? 1 : undefined,
      overflow: clipContent ? 'hidden' : 'visible',
      borderRadius: clipContent ? 'inherit' : undefined,
      clipPath: (effectiveUseSmoothCorners && clipContent)
        ? cssSmoothCornerClipPath
        : undefined,
    }),
    [
      backgroundBlendsWithBackdrop,
      clipContent,
      cssSmoothCornerClipPath,
      effectiveUseSmoothCorners,
      foregroundBlendsWithContent,
    ],
  );
  const backgroundWrapperStyle = useMemo(
    () => backgroundBlendsWithBackdrop
      ? {
          ...materialLayerPositionStyle,
          isolation: 'auto' as const,
          zIndex: 'auto' as const,
        }
      : materialLayerPositionStyle,
    [backgroundBlendsWithBackdrop, materialLayerPositionStyle],
  );
  const foregroundWrapperStyle = useMemo(
    () => foregroundBlendsWithContent
      ? { ...materialLayerPositionStyle, zIndex: 'auto' as const }
      : backgroundBlendsWithBackdrop
        ? { ...materialLayerPositionStyle, zIndex: 2 }
        : materialLayerPositionStyle,
    [
      backgroundBlendsWithBackdrop,
      foregroundBlendsWithContent,
      materialLayerPositionStyle,
    ],
  );

  return (
    <>
      {effectiveUseSmoothCorners && smoothCornerPath && (
        <svg
          className={styles.clipPath}
          width="0"
          height="0"
          style={CLIP_PATH_STYLE}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <clipPath id={clipPathId}>
              <path d={smoothCornerPath} />
            </clipPath>
            {insetSmoothCornerPath && (
              <clipPath id={insetClipPathId}>
                <path d={insetSmoothCornerPath} />
              </clipPath>
            )}
          </defs>
        </svg>
      )}

      <div
        className={styles.backgroundLayers}
        style={backgroundWrapperStyle}
      >
        <ContainerMaterialCanvas
          layers={backgroundLayers}
          effectiveVisualState={effectiveVisualState}
          activeMaterialTransition={activeMaterialTransition}
          isMaterialTransitionControlled={isMaterialTransitionControlled}
          animated={animated}
          effectiveUseSmoothCorners={effectiveUseSmoothCorners}
          materialClipPath={materialClipPath}
          layerPathD={layerPathD}
          layerW={layerW}
          layerH={layerH}
          idPrefix={idPrefix}
          shapeContext={shapeContext}
          partialFocusPosition={partialFocusPosition}
          interactionTransition={interactionTransition}
          blendWithContent={backgroundBlendsWithBackdrop}
        />
      </div>

      <div
        className={styles.contentWrapper}
        style={contentWrapperStyle}
      >
        {children}
      </div>

      <div
        className={styles.foregroundLayers}
        style={foregroundWrapperStyle}
      >
        <ContainerMaterialCanvas
          layers={foregroundLayers}
          effectiveVisualState={effectiveVisualState}
          activeMaterialTransition={activeMaterialTransition}
          isMaterialTransitionControlled={isMaterialTransitionControlled}
          animated={animated}
          effectiveUseSmoothCorners={effectiveUseSmoothCorners}
          materialClipPath={materialClipPath}
          layerPathD={layerPathD}
          layerW={layerW}
          layerH={layerH}
          idPrefix={idPrefix}
          shapeContext={shapeContext}
          partialFocusPosition={partialFocusPosition}
          interactionTransition={interactionTransition}
          blendWithContent={foregroundBlendsWithContent}
        />
      </div>
    </>
  );
});
