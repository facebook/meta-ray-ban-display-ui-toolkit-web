/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** Minimum height of the input surface. */
export const INPUT_TEXT_VIEW_MIN_HEIGHT = 91;

/** Maximum number of visible text lines before the input scrolls. */
export const INPUT_TEXT_VIEW_MAX_LINES = 3;

/** Body text line height used when computed styles are unavailable. */
export const INPUT_TEXT_VIEW_LINE_HEIGHT = 40;

/** Vertical padding once the field contains more than one line. */
export const INPUT_TEXT_VIEW_VERTICAL_PADDING = 24;

/** Vertical padding that centers one line in the minimum-height surface. */
export const INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING =
  (INPUT_TEXT_VIEW_MIN_HEIGHT - INPUT_TEXT_VIEW_LINE_HEIGHT) / 2;

/** Horizontal padding: 24px on each edge. */
export const INPUT_TEXT_VIEW_HORIZONTAL_PADDING = 24;

/** In-field accessory wrapper size. */
export const INPUT_TEXT_VIEW_ACCESSORY_SIZE = 56;

/** Separate action button size. */
export const INPUT_TEXT_VIEW_ACTION_BUTTON_SIZE = 88;

/** Space between the text surface and separate action. */
export const INPUT_TEXT_VIEW_ACTION_BUTTON_GAP = 8;

/** Sidebar and accessory horizontal margin. */
export const INPUT_TEXT_VIEW_ACCESSORY_MARGIN = 16;

/** Trailing padding when the accessory is visible. */
export const INPUT_TEXT_VIEW_ACCESSORY_TRAILING_PADDING =
  INPUT_TEXT_VIEW_ACCESSORY_SIZE + INPUT_TEXT_VIEW_ACCESSORY_MARGIN * 2;

/** Scrollbar width. */
export const INPUT_TEXT_VIEW_SCROLLBAR_WIDTH = 6;

/** Minimum scrollbar thumb height. */
export const INPUT_TEXT_VIEW_SCROLLBAR_MIN_THUMB_HEIGHT = 16;

/** Loader size. */
export const INPUT_TEXT_VIEW_LOADER_SIZE = 40;

/** Initial shrink-when-empty width until rendered hint measurement is available. */
export const INPUT_TEXT_VIEW_DEFAULT_EMPTY_WIDTH = 252;
