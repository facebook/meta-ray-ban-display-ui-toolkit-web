/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** Theme attributes used by the component-facing color APIs. */
export enum ThemeAttribute {
  COLOR_ICON_PRIMARY = 'colorIconPrimary',
  COLOR_ICON_SECONDARY = 'colorIconSecondary',
  COLOR_ICON_ACCENT = 'colorIconAccent',
  COLOR_BUTTON_PRIMARY_BACKGROUND = 'colorButtonPrimaryBackground',
  COLOR_TEXT_PRIMARY = 'colorTextPrimary',
  COLOR_TEXT_SECONDARY = 'colorTextSecondary',
  COLOR_TEXT_ACCENT = 'colorTextAccent',
  COLOR_PERSISTENT_ACTION = 'colorPersistentAction',
  COLOR_PERSISTENT_POSITIVE = 'colorPersistentPositive',
  COLOR_PERSISTENT_WARNING = 'colorPersistentWarning',
  COLOR_PERSISTENT_NEGATIVE = 'colorPersistentNegative',
  COLOR_PERSISTENT_INFO = 'colorPersistentInfo',
}

export const THEME_ATTRIBUTE_CSS_VAR: Record<ThemeAttribute, `--${string}`> = {
  [ThemeAttribute.COLOR_ICON_PRIMARY]: '--uit-color-icon-primary',
  [ThemeAttribute.COLOR_ICON_SECONDARY]: '--uit-color-icon-secondary',
  [ThemeAttribute.COLOR_ICON_ACCENT]: '--uit-color-icon-accent',
  [ThemeAttribute.COLOR_BUTTON_PRIMARY_BACKGROUND]:
    '--uit-color-button-primary-background',
  [ThemeAttribute.COLOR_TEXT_PRIMARY]: '--uit-color-text-primary',
  [ThemeAttribute.COLOR_TEXT_SECONDARY]: '--uit-color-text-secondary',
  [ThemeAttribute.COLOR_TEXT_ACCENT]: '--uit-color-text-accent',
  [ThemeAttribute.COLOR_PERSISTENT_ACTION]: '--uit-color-persistent-action',
  [ThemeAttribute.COLOR_PERSISTENT_POSITIVE]: '--uit-color-persistent-positive',
  [ThemeAttribute.COLOR_PERSISTENT_WARNING]: '--uit-color-persistent-warning',
  [ThemeAttribute.COLOR_PERSISTENT_NEGATIVE]: '--uit-color-persistent-negative',
  [ThemeAttribute.COLOR_PERSISTENT_INFO]: '--uit-color-persistent-info',
};
