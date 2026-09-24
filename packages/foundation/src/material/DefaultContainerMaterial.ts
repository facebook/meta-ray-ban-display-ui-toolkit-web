/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Default container material implementation.
 *
 * Defines the exact colors, alphas, stroke widths, and gradient positions for
 * the default container material.
 */

import {
  ContainerMaterial,
  createContainerMaterialWithOwnedLayers,
} from './ContainerMaterial';
import type { ContainerMaterialConfig } from './ContainerMaterial';
import { createDefaultContainerMaterialLayers } from './DefaultContainerMaterialLayers';
import type { DefaultContainerMaterialOptions } from './DefaultContainerMaterial.types';

export type { DefaultContainerMaterialOptions } from './DefaultContainerMaterial.types';

/**
 * Create default container material with its full layer configuration.
 *
 * Layer order (8 layers for Meta Ray-Ban Display default):
 * 1. shadowMaterialLayer (DropShadow) - BACKGROUND
 * 2. idleMaterialLayer (SolidColor) - BACKGROUND
 * 3. focusedMaterialLayer (RadialGradient) - BACKGROUND
 * 4. innerShadowMaterialLayer (InnerShadow) - BACKGROUND
 * 5. noiseMaterialLayer (Noise) - BACKGROUND (Meta Ray-Ban Display only)
 * 6. pressedMaterialLayer (SolidColor) - BACKGROUND
 * 7. glowStrokeMaterialLayer (RadialGradientGlowStroke) - BACKGROUND
 * 8. focusedGlowStrokeMaterialLayer (RadialGradientGlowStroke) - FOREGROUND
 */
export function createDefaultContainerMaterial(
  options: DefaultContainerMaterialOptions | Partial<ContainerMaterialConfig> = {}
): ContainerMaterial {
  // Support both old config-only signature and new options object
  const opts: DefaultContainerMaterialOptions =
    'withDropShadow' in options ||
    'hideGlowForStates' in options ||
    'config' in options
      ? (options as DefaultContainerMaterialOptions)
      : { config: options as Partial<ContainerMaterialConfig> };

  const withDropShadow = opts.withDropShadow ?? false;
  const config = opts.config ?? {};

  const layers = createDefaultContainerMaterialLayers({
    withDropShadow,
    hideGlowForStates: opts.hideGlowForStates,
  });

  const defaultConfig: ContainerMaterialConfig = {
    layers,
    hidden: false,
    alpha: 1.0,
    ...config,
  };

  return config.layers == null
    ? createContainerMaterialWithOwnedLayers(defaultConfig)
    : new ContainerMaterial(defaultConfig);
}
