/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { BackgroundStyle } from '@wearables-ui-toolkit/foundation';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';

/**
 * Creates the Panel-backed modal material.
 * A new material is created per Modal instance.
 */
export function createModalMaterial() {
  return MaterialLibrary.panel();
}

/**
 * Creates the StaticContainer material used to clip banner images.
 */
export function createModalBannerMaterial() {
  return MaterialLibrary.defaultStatic();
}

export const MODAL_BANNER_BACKGROUND_STYLE = BackgroundStyle.NONE;
