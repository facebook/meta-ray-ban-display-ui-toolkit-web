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
 * Semantic icon tint. Callers pick a semantic case; the component resolves it to
 * a design-system color token. Free-form CSS color strings are intentionally NOT
 * accepted — this keeps the API strict (no per-instance raw colors).
 */
export const IconTintColor = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ACCENT: 'accent',
  ON_CHECKED: 'on-checked',
  ACTION: 'action',
  POSITIVE: 'positive',
  WARNING: 'warning',
  NEGATIVE: 'negative',
  INFO: 'info',
} as const;

export type IconTintColor = (typeof IconTintColor)[keyof typeof IconTintColor];

// Intentionally mixes token families: PRIMARY/SECONDARY/ACCENT map to
// `colorIcon*`, ON_CHECKED maps to the checked-control foreground token, and
// the status-style cases (ACTION/POSITIVE/WARNING/NEGATIVE/INFO) map to shared
// `colorPersistent*` tokens. Don't "normalize" these to one family.
const ICON_TINT_ATTRIBUTE: Record<IconTintColor, ThemeAttribute> = {
  [IconTintColor.PRIMARY]: ThemeAttribute.COLOR_ICON_PRIMARY,
  [IconTintColor.SECONDARY]: ThemeAttribute.COLOR_ICON_SECONDARY,
  [IconTintColor.ACCENT]: ThemeAttribute.COLOR_ICON_ACCENT,
  [IconTintColor.ON_CHECKED]: ThemeAttribute.COLOR_BUTTON_PRIMARY_BACKGROUND,
  [IconTintColor.ACTION]: ThemeAttribute.COLOR_PERSISTENT_ACTION,
  [IconTintColor.POSITIVE]: ThemeAttribute.COLOR_PERSISTENT_POSITIVE,
  [IconTintColor.WARNING]: ThemeAttribute.COLOR_PERSISTENT_WARNING,
  [IconTintColor.NEGATIVE]: ThemeAttribute.COLOR_PERSISTENT_NEGATIVE,
  [IconTintColor.INFO]: ThemeAttribute.COLOR_PERSISTENT_INFO,
};

/** Resolve a semantic {@link IconTintColor} to its CSS color token value. */
export function getIconTintCSSVariable(tint: IconTintColor): string {
  return getCSSVariable(ICON_TINT_ATTRIBUTE[tint]);
}

/**
 * CSS `mix-blend-mode` for a tint. Composites the SECONDARY tint with a lighten
 * blend (so a dimmed secondary glyph lifts against the material behind it). All
 * other tints composite normally.
 */
export function getIconTintBlendMode(
  tint: IconTintColor,
): CSSProperties['mixBlendMode'] {
  return tint === IconTintColor.SECONDARY
    ? 'lighten'
    : undefined;
}
