/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  KeyboardEventHandler,
  ReactNode,
  Ref,
  UIEventHandler,
} from 'react';
import {
  memo,
  useMemo,
} from 'react';
import styles from '../ContextMenu.module.css';

interface ContextMenuFrameProps {
  children?: ReactNode;
  containerRef: Ref<HTMLDivElement>;
  scrollRef: Ref<HTMLDivElement>;
  className: string;
  containerStyle: CSSProperties;
  role?: string;
  ariaLabel?: string;
  ariaDisabled?: boolean | 'true' | 'false';
  pathD: string | null;
  effectiveWidth: number;
  effectiveHeight: number;
  shadowOffsetY: number;
  scrollViewportStyle: CSSProperties;
  fadingEdgeStrengths: {
    left: number;
    right: number;
  };
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onScroll: UIEventHandler<HTMLDivElement>;
}

/**
 * Render-only ContextMenu popup frame: material path, horizontal viewport,
 * items slot, and fading edges.
 */
export const ContextMenuFrame = memo(function ContextMenuFrame({
  children,
  containerRef,
  scrollRef,
  className,
  containerStyle,
  role,
  ariaLabel,
  ariaDisabled,
  pathD,
  effectiveWidth,
  effectiveHeight,
  shadowOffsetY,
  scrollViewportStyle,
  fadingEdgeStrengths,
  onKeyDown,
  onScroll,
}: ContextMenuFrameProps) {
  const materialShapeStyle = useMemo(
    () => ({ filter: `drop-shadow(0 ${shadowOffsetY}px 6px rgba(0, 0, 0, 0.6))` }),
    [shadowOffsetY],
  );
  const leftFadeStyle = useMemo(
    () => ({ opacity: fadingEdgeStrengths.left }),
    [fadingEdgeStrengths.left],
  );
  const rightFadeStyle = useMemo(
    () => ({ opacity: fadingEdgeStrengths.right }),
    [fadingEdgeStrengths.right],
  );

  return (
    <div
      ref={containerRef}
      className={`${styles.contextMenu} ${className}`}
      style={containerStyle}
      role={role ?? 'menu'}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled}
    >
      {pathD && (
        <svg
          className={styles.materialShape}
          viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          style={materialShapeStyle}
        >
          <path d={pathD} fill="var(--uit-color-background-elevation3, #646A76)" />
        </svg>
      )}

      <div
        className={styles.scrollViewport}
        style={scrollViewportStyle}
      >
        <div
          ref={scrollRef}
          className={styles.scrollContainer}
          data-scroll-view="true"
          onKeyDown={onKeyDown}
          onScroll={onScroll}
        >
          <div className={styles.itemsContainer}>
            {children}
          </div>
        </div>
        <div
          className={`${styles.fadingEdge} ${styles.fadingEdgeLeft}`}
          style={leftFadeStyle}
          aria-hidden="true"
        />
        <div
          className={`${styles.fadingEdge} ${styles.fadingEdgeRight}`}
          style={rightFadeStyle}
          aria-hidden="true"
        />
      </div>
    </div>
  );
});
