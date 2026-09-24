/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DefaultContainerMaterialFactory } from './DefaultContainerMaterial.types';

export type DefaultMaterialFactory = DefaultContainerMaterialFactory;

export interface OutboundMessageMaterialTheme {
  idleFill: string;
  gradientStep1: string;
  gradientStep2: string;
  gradientStep3: string;
  gradientStep4: string;
  glowTint: string;
}
