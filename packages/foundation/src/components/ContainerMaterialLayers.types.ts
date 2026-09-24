/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { VisualState } from '../base/Interactions';
import type {
  MaterialLayer,
  MaterialShapeContext,
  PartialFocusPosition,
} from '../material/ContainerMaterial';

export interface ContainerMaterialTransition {
  from: VisualState;
  to: VisualState;
  progress: number;
}

export interface ContainerMaterialLayersProps {
  layers: MaterialLayer[];
  effectiveVisualState: VisualState;
  activeMaterialTransition: ContainerMaterialTransition | null;
  isMaterialTransitionControlled: boolean;
  animated: boolean;
  effectiveUseSmoothCorners: boolean;
  materialClipPath?: string;
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
  /**
   * Render these layers as element-blended canvases so they blend with the live
   * DOM content behind them. Set only for foreground layers whose material opts
   * in (ContainerMaterialConfig.foregroundBlendsWithContent).
   */
  blendWithContent?: boolean;
}
