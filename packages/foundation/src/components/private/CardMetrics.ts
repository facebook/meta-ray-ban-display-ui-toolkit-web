/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** Default scrim heights for each semantic scrim size. */
export const CARD_SCRIM_HEIGHT_SMALL = 130;
export const CARD_SCRIM_HEIGHT_MEDIUM = 154;
export const CARD_SCRIM_HEIGHT_TALL = 200;

/**
 * Fallback FULL-scrim height used only before the card's rendered height has
 * been measured. The FULL scrim is sized from the measured rendered element;
 * this named constant is the fallback before that measurement is available.
 */
export const CARD_FULL_SCRIM_FALLBACK_HEIGHT = 600;

/** Roughly 75% black (191/255). */
export const CARD_SCRIM_COLOR = 'rgba(0, 0, 0, 0.75)';
