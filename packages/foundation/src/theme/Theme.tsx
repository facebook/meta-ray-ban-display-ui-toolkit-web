/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Theme system for UI Toolkit for Meta Ray-Ban Display
 *
 * Theming is exposed publicly ONLY through CSS custom properties (see
 * `theme.css`). This module keeps the INTERNAL helper used by components to
 * build `var(--…)` references from a {@link ThemeAttribute}.
 */

import { THEME_ATTRIBUTE_CSS_VAR, ThemeAttribute } from './Theme.types';

export { ThemeAttribute } from './Theme.types';

/**
 * Get the `var(...)` reference for a theme attribute, resolved through the
 * canonical {@link THEME_ATTRIBUTE_CSS_VAR} map (no runtime name munging).
 *
 * INTERNAL: not part of the public surface. Components use this to read design
 * values via CSS custom properties.
 */
export function getCSSVariable(attribute: ThemeAttribute): string {
  return `var(${THEME_ATTRIBUTE_CSS_VAR[attribute]})`;
}
