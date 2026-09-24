/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
  type ReactElement,
} from 'react';
import {
  VignetteEdge,
  type VignetteProps,
} from './Vignette.types';
import {
  VIGNETTE_FADE_DURATION_MS,
  VIGNETTE_SCRIM_SIZE,
} from './private/VignetteMetrics';
import styles from './Vignette.module.css';

export { VignetteEdge } from './Vignette.types';
export type {
  VignetteEdgeVisibility,
  VignetteEdgeAnimation,
  VignetteProps,
} from './Vignette.types';

const DEFAULT_STYLE: CSSProperties = {};
const ALL_EDGES = [
  VignetteEdge.TOP,
  VignetteEdge.BOTTOM,
  VignetteEdge.LEFT,
  VignetteEdge.RIGHT,
];

function getEdgeClassName(edge: VignetteEdge): string {
  switch (edge) {
    case VignetteEdge.TOP:
      return styles.top;
    case VignetteEdge.BOTTOM:
      return styles.bottom;
    case VignetteEdge.LEFT:
      return styles.left;
    case VignetteEdge.RIGHT:
    default:
      return styles.right;
  }
}

export const Vignette = memo(forwardRef<HTMLDivElement, VignetteProps>(
  function Vignette(
    {
      animate = true,
      animatedEdges,
      className = '',
      enabledEdges,
      style = DEFAULT_STYLE,
      ...rest
    },
    ref,
  ): ReactElement {
    const rootClassName = useMemo(
      () => [
        styles.root,
        className,
      ].filter(Boolean).join(' '),
      [className],
    );

    // Drive the scrim size + fade duration from the metric constants so the CSS
    // and the source-of-truth values cannot drift.
    const rootStyle = useMemo<CSSProperties>(
      () => ({
        ['--vignette-scrim-size' as string]: `${VIGNETTE_SCRIM_SIZE}px`,
        ['--vignette-fade-duration' as string]: `${VIGNETTE_FADE_DURATION_MS}ms`,
        ...style,
      }),
      [style],
    );

    return (
      <div
        ref={ref}
        className={rootClassName}
        style={rootStyle}
        aria-hidden="true"
        {...rest}
      >
        {ALL_EDGES.map((edge) => {
          const isEnabled = enabledEdges?.[edge] ?? true;
          const shouldAnimate = animatedEdges?.[edge] ?? animate;
          return (
            <div
              key={edge}
              className={[
                styles.scrim,
                shouldAnimate ? styles.animate : '',
                getEdgeClassName(edge),
                isEnabled ? '' : styles.hidden,
              ].filter(Boolean).join(' ')}
            />
          );
        })}
      </div>
    );
  },
));
