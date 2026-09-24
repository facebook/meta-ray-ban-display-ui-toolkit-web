/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CornerRadius } from '@wearables-ui-toolkit/foundation';

/** Modal panel corner radius. */
export const MODAL_PANEL_CORNER_RADIUS = CornerRadius.MEDIUM;

/** Banner StaticContainer corner radius. */
export const MODAL_BANNER_CORNER_RADIUS = CornerRadius.XXSMALL;

/**
 * Modal icon container size, in px. The icon fills this 56px container, so no
 * separate icon-size constant is needed.
 */
export const MODAL_ICON_CONTAINER_SIZE = 56;

/** Standard banner height / width ratio. */
export const MODAL_BANNER_STANDARD_HEIGHT_RATIO = 204 / 440;

/** Taller banner height / width ratio. */
export const MODAL_BANNER_TALLER_HEIGHT_RATIO = 300 / 440;

/** Read-more padding, in px. */
export const MODAL_READ_MORE_PADDING = 2;

/** Fade width before the read-more label, in px. */
export const MODAL_READ_MORE_SCRIM_WIDTH = 72;

/** One-line Heading2 measured height in the standard Modal. */
export const MODAL_STANDARD_TITLE_TEXT_VIEW_HEIGHT = 51;
