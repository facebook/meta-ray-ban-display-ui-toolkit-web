/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from 'react';
import type { ContainerProps } from '@wearables-ui-toolkit/foundation/components/Container';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type {
  PlaceholderStyle,
  StatusIndicatorType,
} from './Avatar.types';
import type { IconTintColor } from './IconTintColor';
import type { TrailingTag } from './TrailingTag';

export interface ButtonProps extends Omit<
  ContainerProps,
  | 'children'
  | 'width'
  | 'height'
  | 'materialTransition'
  | 'visualStateOverride'
  | 'visualStateForInteractionStateFn'
  | 'contentScaleForStateFn'
  | 'stateChangeAnimations'
> {
  title?: string;
  subtitle?: string;
  alwaysShowText?: boolean;
  icon?: IconSource;
  /**
   * Semantic icon tint. Callers pick an {@link IconTintColor} case; the
   * component resolves it to a design-system color token. Defaults to
   * {@link IconTintColor.PRIMARY} when unset.
   */
  iconTintColor?: IconTintColor;
  applyIconTinting?: boolean;
  showIconActiveIndicator?: boolean;
  iconRotation?: number;
  /** Whether changes to `iconRotation` animate. Defaults to false. */
  animateIconRotation?: boolean;
  /** Rotation transition duration in milliseconds. Defaults to 1000. */
  iconRotationDuration?: number;
  avatarSrc?: string;
  /** Content for the avatar primary surface. The Avatar owns the slot size. */
  avatarPrimaryContent?: ReactNode;
  avatarAlt?: string;
  /** Status indicator to display on the avatar. */
  statusIndicator?: StatusIndicatorType;

  /** Glyph drawn over the avatar status indicator dot. */
  statusIndicatorIcon?: IconSource;

  /** Avatar badge image source URL (rendered in the avatar badge slot). */
  avatarBadgeSrc?: string;

  /** Content for the avatar image-badge slot. The Avatar owns the badge size. */
  avatarBadgeContent?: ReactNode;

  /** Placeholder style for the avatar. */
  placeholderStyle?: PlaceholderStyle;

  /**
   * Semantic trailing tag shown after the title. Callers pick a closed
   * {@link TrailingTag} case; the component owns the displayed label (no
   * caller-supplied tag text). Defaults to {@link TrailingTag.NONE} when unset.
   */
  trailingTag?: TrailingTag;
  enforceMaxWidth?: boolean;
  width?: number | string;
}

/**
 * Options for {@link ButtonHandle.animateActionTransition}.
 *
 * The icon source is a single {@link IconSource}, so callers pass `endingIcon`
 * and an optional `endingTitle`.
 */
export interface ButtonActionTransitionOptions {
  /** Icon to display once the transition completes (e.g. a "sent" checkmark). */
  endingIcon?: IconSource;
  /**
   * Optional title to swap in partway through the transition. An empty string
   * (`''`) is treated the same as omitted (no title swap); to clear the title
   * update the declarative `title` prop instead.
   */
  endingTitle?: string;
}

/**
 * Imperative handle exposed by {@link Button} via `ref`, for actions that have
 * no declarative equivalent.
 */
export interface ButtonHandle {
  /**
   * Swaps the button's icon (and optionally its title) to reflect a completed
   * action — e.g. morphing a "send" arrow into a "sent" checkmark. The current
   * icon shrinks to scale 0, the icon/title are swapped while invisible, then
   * the new icon springs back up.
   *
   * No-op unless `opts.endingIcon` is provided.
   */
  animateActionTransition(opts: ButtonActionTransitionOptions): void;

  /**
   * The root DOM element of the button, for consumers that need direct access
   * to the underlying `HTMLDivElement`. Null before mount / after unmount.
   */
  getElement(): HTMLDivElement | null;
}
