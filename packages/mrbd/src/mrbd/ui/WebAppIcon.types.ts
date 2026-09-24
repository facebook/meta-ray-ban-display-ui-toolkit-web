/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { VisualState } from '@wearables-ui-toolkit/foundation';
import type { HTMLAttributes } from 'react';

export interface WebAppIconProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onError' | 'onLoad'
> {
  /** Image URL for the web-app artwork. */
  iconSrc?: string | null;

  /** Base color used to tint monochrome artwork and derive the container gradient. */
  themeColor?: string | null;

  /** Explicit container-gradient colors. */
  radialColors?: readonly string[] | null;

  /** Optional offsets for `radialColors`. Invalid arrays are ignored. */
  radialStops?: readonly number[] | null;

  /** Optional focused inner-glow color. */
  innerGlowColor?: string | null;

  /** Whether the material responds to partial-focus lighting. Defaults to true. */
  partialFocusLighting?: boolean;

  /** Static interaction state rendered by the icon material. Defaults to `DEFAULT`. */
  visualState?: VisualState;

  /** Visible width in pixels. The canonical 112px material scales to fit. */
  width?: number;

  /** Visible height in pixels. The canonical 112px material scales to fit. */
  height?: number;

  /** Called when the requested artwork resolves. `true` means custom artwork is ready. */
  onIconReady?: (succeeded: boolean) => void;
}
