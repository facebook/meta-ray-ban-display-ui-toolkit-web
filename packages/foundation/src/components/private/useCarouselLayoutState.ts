/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useLayoutEffect,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  EMPTY_SCROLL_METRICS,
  getScrollMetrics,
  sameScrollMetrics,
} from './FadingEdges';
import {
  areCarouselEdgeOffsetsEqual,
  getCarouselEdgeOffsets,
} from './CarouselLayout';

export interface UseCarouselLayoutStateOptions {
  scrollAreaRef: RefObject<HTMLDivElement | null>;
  itemRefs: MutableRefObject<Array<HTMLDivElement | null>>;
  items: ReactNode[];
  itemCount: number;
}

export function useCarouselLayoutState({
  scrollAreaRef,
  itemRefs,
  items,
  itemCount,
}: UseCarouselLayoutStateOptions) {
  const [edgeOffsets, setEdgeOffsets] = useState({ start: 0, end: 0 });
  const [scrollMetrics, setScrollMetrics] = useState(EMPTY_SCROLL_METRICS);

  const updateEdgeOffsets = useCallback(() => {
    const nextOffsets = getCarouselEdgeOffsets(
      scrollAreaRef.current,
      itemRefs.current,
      itemCount,
    );

    setEdgeOffsets((current) =>
      areCarouselEdgeOffsetsEqual(current, nextOffsets)
        ? current
        : nextOffsets,
    );
  }, [itemCount, itemRefs, scrollAreaRef]);

  const updateScrollMetrics = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const nextMetrics = getScrollMetrics(scrollArea);
    setScrollMetrics(current =>
      sameScrollMetrics(current, nextMetrics) ? current : nextMetrics,
    );
  }, [scrollAreaRef]);

  useLayoutEffect(() => {
    updateEdgeOffsets();
    updateScrollMetrics();

    const scrollArea = scrollAreaRef.current;
    const observedItems = itemRefs.current.filter(
      (item): item is HTMLDivElement => item != null,
    );
    const updateLayoutState = () => {
      updateEdgeOffsets();
      updateScrollMetrics();
    };
    const frameId = requestAnimationFrame(updateLayoutState);

    if (typeof ResizeObserver === 'undefined' || scrollArea == null) {
      window.addEventListener('resize', updateLayoutState);
      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', updateLayoutState);
      };
    }

    const observer = new ResizeObserver(updateLayoutState);
    observer.observe(scrollArea);
    observedItems.forEach((item) => observer.observe(item));

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [items, itemRefs, scrollAreaRef, updateEdgeOffsets, updateScrollMetrics]);

  return {
    edgeOffsets,
    scrollMetrics,
    updateScrollMetrics,
  };
}
