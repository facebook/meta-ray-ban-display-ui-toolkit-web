/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { VisualState } from '../base/Interactions';

export interface DefaultContainerMaterialLayerOptions {
  /** Include drop shadow layer. Default: false */
  withDropShadow?: boolean;

  /** Visual states where the default glow stroke is fully hidden. */
  hideGlowForStates?: readonly VisualState[];
}
