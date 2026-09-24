/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  MutableRefObject,
  ReactNode,
} from 'react';
import {
  memo,
  useCallback,
  useMemo,
} from 'react';
import {
  PEEK_OUT_MS,
  PEEK_RESTORE_MS,
} from './PagerAnimation';
import type { PeekState } from './PagerAnimation';
import {
  getPagerPageClassName,
  getPagerPeekScrimClassName,
  type PagerStyleClasses,
} from './PagerPresentation';
import { PagerOrientation } from '../Pager.types';
import styles from '../Pager.module.css';

const pagerStyles = styles as unknown as PagerStyleClasses;

interface PagerPagesProps {
  pages: ReactNode[];
  pageRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  internalIndex: number;
  pageCount: number;
  isTransitioning: boolean;
  previousIndex: number;
  orientation: PagerOrientation;
  peekState: PeekState | null;
  getPageStyle: (pageIndex: number) => CSSProperties;
  unmountInactivePages?: boolean;
  /** Indices force-mounted via the imperative `preloadPageIfNeeded` handle. */
  forcedPreloadIndices?: ReadonlySet<number>;
  /** Indices force-unmounted via the imperative `unloadPage` handle. */
  forcedUnloadIndices?: ReadonlySet<number>;
}

/**
 * Render-only page stack for Pager: absolutely positioned pages, page
 * focus bookkeeping, and the peek scrim used before boundary navigation.
 */
export const PagerPages = memo(function PagerPages({
  pages,
  pageRefs,
  internalIndex,
  pageCount,
  isTransitioning,
  previousIndex,
  orientation,
  peekState,
  getPageStyle,
  unmountInactivePages = false,
  forcedPreloadIndices,
  forcedUnloadIndices,
}: PagerPagesProps) {
  const shouldRenderPage = useCallback((pageIndex: number): boolean => {
    // An explicit `unloadPage` call wins over everything except the currently
    // visible page (the handle refuses to unload that one).
    if (
      forcedUnloadIndices?.has(pageIndex) === true &&
      pageIndex !== internalIndex
    ) {
      return false;
    }

    if (!unmountInactivePages) {
      return true;
    }

    return (
      pageIndex === internalIndex ||
      forcedPreloadIndices?.has(pageIndex) === true ||
      (isTransitioning && pageIndex === previousIndex) ||
      (peekState != null &&
        (pageIndex === peekState.outgoingIndex || pageIndex === peekState.incomingIndex))
    );
  }, [
    forcedPreloadIndices,
    forcedUnloadIndices,
    internalIndex,
    isTransitioning,
    peekState,
    previousIndex,
    unmountInactivePages,
  ]);
  const getPageClassName = useCallback((pageIndex: number): string => {
    return getPagerPageClassName({
      styles: pagerStyles,
      pageIndex,
      internalIndex,
      isTransitioning,
      previousIndex,
      peekState,
    });
  }, [internalIndex, isTransitioning, peekState, previousIndex]);
  const peekScrimStyle = useMemo(
    () => peekState == null
      ? undefined
      : {
          opacity: peekState.phase === 'peek' ? 1 : 0,
          transition: `opacity ${
            peekState.phase === 'peek' ? PEEK_OUT_MS : PEEK_RESTORE_MS
          }ms cubic-bezier(0.0, 0.0, 0.2, 1)`,
        },
    [peekState],
  );

  return (
    <>
      {pages.map((page, index) => {
        if (!shouldRenderPage(index)) {
          return null;
        }

        return (
          <div
            key={index}
            ref={(el) => {
              pageRefs.current[index] = el;
            }}
            className={getPageClassName(index)}
            style={getPageStyle(index)}
            role="group"
            aria-roledescription="slide"
            aria-hidden={index !== internalIndex}
            aria-label={`Page ${index + 1} of ${pageCount}`}
            data-page-index={index}
            data-uit-focus-section="true"
            inert={index !== internalIndex}
            tabIndex={-1}
          >
            {page}
          </div>
        );
      })}
      {peekState != null && (
        <div
          className={getPagerPeekScrimClassName({
            styles: pagerStyles,
            orientation,
            peekState,
          })}
          style={peekScrimStyle}
          aria-hidden="true"
        />
      )}
    </>
  );
});
