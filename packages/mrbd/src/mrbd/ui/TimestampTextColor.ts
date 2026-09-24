/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { getCSSVariable, ThemeAttribute } from '@wearables-ui-toolkit/foundation/theme/Theme';

/**
 * Semantic timestamp text color. Callers pick a semantic case; the component
 * resolves it to a design-system color token. Free-form CSS color strings are
 * intentionally NOT accepted — this keeps the API strict (no per-instance raw
 * colors).
 */
export const TimestampTextColor = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ACCENT: 'accent',
} as const;

export type TimestampTextColor =
  (typeof TimestampTextColor)[keyof typeof TimestampTextColor];

// PRIMARY/SECONDARY resolve to the `colorText*` tokens and ACCENT resolves to
// `colorTextAccent`; the active theme's CSS variables supply the concrete value.
const TIMESTAMP_TEXT_ATTRIBUTE: Record<TimestampTextColor, ThemeAttribute> = {
  [TimestampTextColor.PRIMARY]: ThemeAttribute.COLOR_TEXT_PRIMARY,
  [TimestampTextColor.SECONDARY]: ThemeAttribute.COLOR_TEXT_SECONDARY,
  [TimestampTextColor.ACCENT]: ThemeAttribute.COLOR_TEXT_ACCENT,
};

/** Resolve a semantic {@link TimestampTextColor} to its CSS color token value. */
export function getTimestampTextCSSVariable(color: TimestampTextColor): string {
  return getCSSVariable(TIMESTAMP_TEXT_ATTRIBUTE[color]);
}

/**
 * CSS `mix-blend-mode` for a timestamp color. Composites the SECONDARY color
 * with a lighten blend (so a dimmed glyph lifts against the material behind it).
 * All other colors composite normally.
 */
export function getTimestampTextBlendMode(
  color: TimestampTextColor,
): CSSProperties['mixBlendMode'] {
  return color === TimestampTextColor.SECONDARY
    ? 'lighten'
    : undefined;
}
