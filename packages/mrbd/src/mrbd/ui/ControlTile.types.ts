/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ControlTile public API for Meta Ray-Ban Display.
 */

import type { ContainerProps } from '@wearables-ui-toolkit/foundation/components/Container';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type {
  ContainerMaterial,
} from '@wearables-ui-toolkit/foundation';
import type { IconTintColor } from './IconTintColor';

export interface ControlTileProps extends Omit<ContainerProps, 'children'> {
  /** Title text displayed below the icon */
  title?: string;

  /** Maximum lines for title text (default 2) */
  titleMaxLines?: number;

  /** Checked/toggle state. null = no toggle behavior. */
  checked?: boolean | null;

  /** Icon source (vector token or image source). */
  icon?: IconSource;

  /** Stable identity for the icon, used to detect icon swaps. */
  iconAnimationKey?: string | number;

  /** Whether icon changes should use a swap-animation-style fade/scale. */
  animateIconChanges?: boolean;

  /** Whether progress visibility changes should animate. Defaults to false. */
  animateProgressChanges?: boolean;

  /**
   * Semantic icon tint. Callers pick an {@link IconTintColor} case; the
   * component resolves it to a design-system color token.
   */
  iconTintColor?: IconTintColor;

  /**
   * Semantic icon tint used when `checked` is true.
   * Falls back to `iconTintColor`, then to the standard checked foreground
   * when using the default checked icon material.
   */
  checkedIconTintColor?: IconTintColor;

  /** Material used by the circular icon background. */
  iconContainerMaterial?: ContainerMaterial | null;

  /**
   * Material used by the circular icon background when `checked` is true.
   * Defaults to the standard ControlTile checked icon material. Pass `null` to
   * keep the regular icon container material while checked.
   */
  checkedIconContainerMaterial?: ContainerMaterial | null;

  /** Show circular progress bar around the icon */
  showCircularProgressBar?: boolean;

  /** Show horizontal progress bar instead of title */
  showHorizontalProgressBar?: boolean;

  /** Progress value 0..1 (used with circular or horizontal progress bar) */
  progress?: number;

  /**
   * Keep directional focus on this tile. Also
   * disables partial-focus rubberband feedback.
   */
  lockFocus?: boolean;

  /** Called when locked focus is lost through a programmatic focus change. */
  onLockedFocusLost?: () => void;

  /** Increment callback for progress (ArrowRight / d-pad right) */
  onIncrement?: (currentValue: number) => void;

  /** Decrement callback for progress (ArrowLeft / d-pad left) */
  onDecrement?: (currentValue: number) => void;

  /** Click handler */
  onClick?: () => void;
}
