/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MaterialColors } from '@wearables-ui-toolkit/foundation/colors/Colors';
import { ChipStyle } from '../Chip.types';

/** Minimum chip height in px. */
export const CHIP_MINIMUM_HEIGHT = 44;

/**
 * Semantic background used by EMPHASIZED and DEEMPHASIZED chips:
 * the colorBackgroundSurface token.
 */
export const CHIP_BACKGROUND_SURFACE = MaterialColors.backgroundSurface;

/**
 * Semantic background used by ELEVATED chips.
 */
export const CHIP_BACKGROUND_ELEVATION_1 = MaterialColors.backgroundElevation1;

export const CHIP_BACKGROUND_BY_STYLE: Record<ChipStyle, string> = {
  [ChipStyle.EMPHASIZED]: CHIP_BACKGROUND_SURFACE,
  [ChipStyle.DEEMPHASIZED]: CHIP_BACKGROUND_SURFACE,
  [ChipStyle.ELEVATED]: CHIP_BACKGROUND_ELEVATION_1,
};
