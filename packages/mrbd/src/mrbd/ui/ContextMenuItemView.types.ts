/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from 'react';
import type { ContainerRootStyle } from '@wearables-ui-toolkit/foundation';
import type { ContainerProps } from '@wearables-ui-toolkit/foundation/components/Container';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { ButtonItemIconSize } from './ButtonItemIconSize';
import type { ContextMenuSize } from './ContextMenu.types';
import type { IconTintColor } from './IconTintColor';

export interface ContextMenuItemViewProps
  extends Omit<ContainerProps, 'width' | 'height'> {
  /**
   * Content to render inside the menu item. The item is a Container that
   * accepts arbitrary child elements. Convenience props (icon, label) are also
   * available for simple use cases.
   */
  children?: ReactNode;

  /**
   * Minimum-size variant. Match the containing ContextMenu's `size`.
   *
   * @default 'default'
   */
  size?: ContextMenuSize;

  /**
   * Icon to display in the item. The base item is a bare, children-only
   * Container; this icon/label layout is a convenience for simple use cases.
   * For richer icon/title items, see `ButtonContextMenuItemView`.
   */
  icon?: IconSource;

  /** Text label below the icon (convenience; see `icon`). */
  label?: string;

  /** Click handler */
  onClick?: () => void;

  /** Width of the item in pixels or a CSS sizing value. */
  width?: number | string;

  /** Height of the item in pixels or a CSS sizing value. */
  height?: number | string;

  /**
   * Inline style applied after the size defaults. Explicit `minWidth` and
   * `minHeight` values override their respective defaults independently.
   */
  style?: ContainerRootStyle;
}

/**
 * Accessibility note: the leading icon is decorative — the `IconSource` carries
 * no accessible label (icons render `alt=""`/`aria-hidden`). The accessible
 * name therefore comes from `ariaLabel ?? title`. Icon-only items (an `icon`
 * with no `title`) must pass an explicit `ariaLabel` to be announced.
 */
export interface ButtonContextMenuItemViewProps
  extends Omit<ContextMenuItemViewProps, 'children' | 'label'> {
  /** Optional leading icon. */
  icon?: IconSource;

  /** Optional title text. */
  title?: string;

  /**
   * Icon size. Defaults to {@link ButtonItemIconSize.MEDIUM}. Use
   * {@link ButtonItemIconSize.LARGE} for a larger icon and tighter horizontal
   * content padding when a title is present. Items without a title have no
   * horizontal content padding at either icon size.
   */
  iconSize?: ButtonItemIconSize;

  /**
   * Semantic tint applied to the leading icon. Defaults to
   * {@link IconTintColor.PRIMARY}. Use {@link IconTintColor.NEGATIVE} for
   * destructive actions such as report or delete.
   */
  iconTintColor?: IconTintColor;
}

export interface EmojiContextMenuItemViewProps
  extends Omit<ContextMenuItemViewProps, 'children' | 'icon' | 'label'> {
  /** Emoji text to display. */
  emoji?: string;

  /** Whether to show the selected dot below the emoji. */
  isEmojiSelected?: boolean;
}
