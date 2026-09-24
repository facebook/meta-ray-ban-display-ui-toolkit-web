/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Typed `ContainerMaterialLayer` classes for composing container materials.
 * Each class renders exactly one visual effect and owns its typed
 * config, blend mode, and caching. Materials compose these in ordered lists.
 */

export {
  computeEllipticalRadialGeometry,
  resolveLayerValue,
  type LayerValue,
  type RadialGeometry,
  type RadialMultiplier,
} from './LayerSupport';

export { NoOpContainerMaterialLayer } from './NoOpContainerMaterialLayer';
export {
  SolidColorContainerMaterialLayer,
  type SolidColorLayerConfig,
} from './SolidColorContainerMaterialLayer';
export {
  LinearGradientContainerMaterialLayer,
  type LinearGradientLayerConfig,
  type LinearGradientPointProvider,
  type LinearGradientPoints,
} from './LinearGradientContainerMaterialLayer';
export { AnimatableLinearGradientContainerMaterialLayer } from './AnimatableLinearGradientContainerMaterialLayer';
export {
  RadialGradientContainerMaterialLayer,
  type RadialGradientLayerConfig,
} from './RadialGradientContainerMaterialLayer';
export { AnimatableRadialGradientContainerMaterialLayer } from './AnimatableRadialGradientContainerMaterialLayer';
export {
  BlurredRadialGradientContainerMaterialLayer,
  type BlurredRadialGradientLayerConfig,
} from './BlurredRadialGradientContainerMaterialLayer';
export {
  DropShadowContainerMaterialLayer,
  type DropShadowLayerConfig,
} from './DropShadowContainerMaterialLayer';
export {
  InnerShadowContainerMaterialLayer,
  type InnerShadowLayerConfig,
} from './InnerShadowContainerMaterialLayer';
export {
  NoiseContainerMaterialLayer,
  type NoiseLayerConfig,
} from './NoiseContainerMaterialLayer';
export {
  ImageContentContainerMaterialLayer,
  type ImageContentLayerConfig,
} from './ImageContentContainerMaterialLayer';
export {
  NinePatchImageOverlayContainerMaterialLayer,
  type NinePatchImageOverlayLayerConfig,
} from './NinePatchImageOverlayContainerMaterialLayer';
export {
  BaseGlowStrokeContainerMaterialLayer,
  type BaseGlowStrokeLayerConfig,
} from './BaseGlowStrokeContainerMaterialLayer';
export {
  LinearGradientGlowStrokeContainerMaterialLayer,
  type LinearGradientGlowStrokeLayerConfig,
} from './LinearGradientGlowStrokeContainerMaterialLayer';
export {
  RadialGradientGlowStrokeContainerMaterialLayer,
  type RadialGradientGlowStrokeLayerConfig,
} from './RadialGradientGlowStrokeContainerMaterialLayer';
