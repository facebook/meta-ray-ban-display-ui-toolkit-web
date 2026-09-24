/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ContainerMaterial,
  ContainerMaterialConfig,
} from './ContainerMaterial';
import type { VisualState } from '../base/Interactions';

/**
 * Options for createDefaultContainerMaterial.
 */
export interface DefaultContainerMaterialOptions {
  /** Include drop shadow layer. Default: false */
  withDropShadow?: boolean;
  /** Visual states where the default glow stroke is fully hidden. */
  hideGlowForStates?: readonly VisualState[];
  /** Override container material config */
  config?: Partial<ContainerMaterialConfig>;
}

export type DefaultContainerMaterialFactory = (
  options?: DefaultContainerMaterialOptions | Partial<ContainerMaterialConfig>,
) => ContainerMaterial;
