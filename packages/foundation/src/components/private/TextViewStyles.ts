/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  TextColor,
  TextStyle,
} from '../TextView.types';
import { TextAppearance } from '../../theme/TextAppearance';

/** Maps each text color to its theme color token. */
export const TEXT_COLOR_CSS_MAP: Record<TextColor, string> = {
  [TextColor.PRIMARY]: 'var(--uit-color-text-primary)',
  [TextColor.SECONDARY]: 'var(--uit-color-text-secondary)',
  // Use the dedicated placeholder / active-hover / accent text tokens, not
  // look-alike interactive/persistent tokens. ACTIVE_HOVER previously pointed at
  // --uit-color-interactive-stroke-targeted (5%-opaque white), rendering
  // near-invisible.
  [TextColor.PLACEHOLDER]: 'var(--uit-color-text-placeholder)',
  [TextColor.ACTIVE_HOVER]: 'var(--uit-color-text-active-hover)',
  [TextColor.ACCENT]: 'var(--uit-color-text-accent)',
};

/** Maps each text style to its CSS class. */
export const TEXT_STYLE_CLASS_MAP: Record<TextStyle, string> = {
  [TextStyle.NUMERAL1]: TextAppearance.NUMERAL1,
  [TextStyle.NUMERAL2]: TextAppearance.NUMERAL2,
  [TextStyle.DISPLAY1]: TextAppearance.DISPLAY1,
  [TextStyle.HEADING1]: TextAppearance.HEADING1,
  [TextStyle.HEADING2]: TextAppearance.HEADING2,
  [TextStyle.BODY1]: TextAppearance.BODY1,
  [TextStyle.BODY1_EMPHASIZED]: TextAppearance.BODY1_EMPHASIZED,
  [TextStyle.BODY2]: TextAppearance.BODY2,
  [TextStyle.BODY2_EMPHASIZED]: TextAppearance.BODY2_EMPHASIZED,
  [TextStyle.LABEL]: TextAppearance.LABEL,
  [TextStyle.LABEL_EMPHASIZED]: TextAppearance.LABEL_EMPHASIZED,
  [TextStyle.META1]: TextAppearance.META1,
  [TextStyle.META1_EMPHASIZED]: TextAppearance.META1_EMPHASIZED,
  [TextStyle.META2]: TextAppearance.META2,
  [TextStyle.META2_EMPHASIZED]: TextAppearance.META2_EMPHASIZED,
  [TextStyle.META3]: TextAppearance.META3,
};

export function getTextColorValue(textColor: TextColor): string {
  return TEXT_COLOR_CSS_MAP[textColor];
}

export function getTextStyleClass(textStyle: TextStyle): string {
  return TEXT_STYLE_CLASS_MAP[textStyle] ?? '';
}
