/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createDefaultContainerMaterial } from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterial';

/**
 * Create default AppControlTile material.
 * Wraps the current material in a dynamic container material.
 */
export function createAppControlTileMaterial() {
  return createDefaultContainerMaterial();
}
