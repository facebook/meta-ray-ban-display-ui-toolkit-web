/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Scrim component for Meta Ray-Ban Display
 *
 * Gradient overlay view that darkens edges of the screen.
 * Each position creates a gradient from black to transparent in that direction.
 * FULL position is a solid semi-transparent overlay.
 *
 * Non-interactive — not clickable or focusable.
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  getScrimMergedStyle,
} from './private/ScrimLayout';
import {
  ScrimPosition,
  type ScrimProps,
} from './Scrim.types';

export { ScrimPosition } from './Scrim.types';
export type { ScrimProps } from './Scrim.types';

const DEFAULT_STYLE: CSSProperties = {};

// ============================================================================
// Component
// ============================================================================

/**
 * Scrim component
 * Renders a gradient overlay at the specified edge of its container.
 *
 * Usage:
 * ```tsx
 * <Scrim position={ScrimPosition.LEFT} />
 * <Scrim position={ScrimPosition.FULL} />
 * ```
 */
export const Scrim = memo(forwardRef<HTMLDivElement, ScrimProps>(
  function Scrim(
    {
      position = ScrimPosition.LEFT,
      className = '',
      style = DEFAULT_STYLE,
      ...rest
    },
    ref
  ) {
    /**
     * Compute the background gradient and positioning based on position.
     *
     * Directional scrims use gradient backgrounds scaled to the Scrim view
     * bounds, so the gradient spans the full parent area rather than staying at
     * the intrinsic source size.
     * - LEFT:   gradient left(black)->right(transparent)
     *           Source: left-edge scrim gradient.
     * - RIGHT:  gradient left(transparent)->right(black)
     *           Source: right-edge scrim gradient.
     * - TOP:    gradient top(black)->bottom(transparent)
     *           Source: top-edge scrim gradient.
     * - BOTTOM: gradient top(transparent)->bottom(black)
     *           Source: bottom-edge scrim gradient.
     * - FULL:   600x600 viewport, multi-stop vertical gradient
     */
    const mergedStyle = useMemo(
      () => getScrimMergedStyle({ position, style }),
      [position, style],
    );

    return (
      <div
        {...rest}
        ref={ref}
        // All scrim layout/visuals live in the inline style (BASE_SCRIM_STYLE +
        // gradient); there is no scrim CSS class, so the consumer className is
        // applied directly.
        className={className || undefined}
        style={mergedStyle}
        aria-hidden="true"
      />
    );
  }
));
