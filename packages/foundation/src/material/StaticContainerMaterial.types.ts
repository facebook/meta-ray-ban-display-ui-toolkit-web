/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ContainerMaterialConfig } from './ContainerMaterial';

export interface StaticContainerMaterialOptions {
  withDropShadow?: boolean;
  idleColor?: string;
  secondary?: boolean;
  config?: Partial<ContainerMaterialConfig>;
}
