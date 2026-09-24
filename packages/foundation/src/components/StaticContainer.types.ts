/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  HTMLAttributes,
  ReactNode,
} from 'react';
import type { VisualState } from '../base/Interactions';
import type { ContainerMaterial } from '../material/ContainerMaterial';
import type { ShapeProvider } from '../material/ShapeProvider';

/**
 * Background style for StaticContainer. External callers may only select
 * `NONE`, `PRIMARY`, or `SECONDARY`.
 */
export const BackgroundStyle = {
  NONE: 'none',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
} as const;
export type BackgroundStyle = (typeof BackgroundStyle)[keyof typeof BackgroundStyle];

export type StaticContainerLayoutTransitionAnchor = 'start' | 'end';

export interface StaticContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Container content. */
  children?: ReactNode;

  /** Material for visual styling. */
  material?: ContainerMaterial;

  /** Geometry used for clipping and all material fill/stroke paths. */
  shapeProvider?: ShapeProvider;

  /**
   * Static visual state rendered by the material. Defaults to `DEFAULT` and
   * does not add focus, press, or other interaction behavior.
   */
  visualState?: VisualState;

  /** Width of container. */
  width?: number | string;

  /** Height of container. */
  height?: number | string;

  /** Background style controlling the static visual state. */
  backgroundStyle?: BackgroundStyle;

  /** Whether to clip child views within the container. */
  clipContent?: boolean;

  /**
   * Whether to render smooth (squircle) corners. When `false`, the container
   * falls back to plain rounded corners (e.g. before measurement is available or
   * when squircle rendering is undesirable).
   */
  useSmoothCorners?: boolean;

  /** Token incremented by component code to request one coordinated layout transition. */
  layoutTransitionToken?: number;

  /** Data used to request layout transitions for intrinsic content changes. */
  layoutTransitionSignature?: unknown;

  /** Anchor used for coordinated layout/material bounds transitions. */
  layoutTransitionAnchor?: StaticContainerLayoutTransitionAnchor;

  /** Called when a requested layout transition completes. */
  onLayoutTransitionComplete?: () => void;

  /** Additional CSS class for the content wrapper. */
  contentClassName?: string;
}
