/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  EMPTY_SCROLL_METRICS,
  getScrollMetrics,
  sameScrollMetrics,
} from './FadingEdges';
import {
  SCROLLBAR_HIDE_DELAY_MS,
  getScrollViewContentOverflows,
} from './ScrollViewLayout';
import type { ScrollViewOrientation } from '../ScrollView.types';

export interface UseScrollViewStateOptions {
  scrollRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  orientation: ScrollViewOrientation;
  isScrollbarEnabled: boolean;
  onScroll?: (scrollTop: number) => void;
}

export function useScrollViewState({
  scrollRef,
  children,
  width,
  height,
  orientation,
  isScrollbarEnabled,
  onScroll,
}: UseScrollViewStateOptions) {
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrollbarVisible, setScrollbarVisible] = useState(false);
  const [scrollState, setScrollState] = useState(EMPTY_SCROLL_METRICS);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setScrollbarVisible(false);
      hideTimeoutRef.current = null;
    }, SCROLLBAR_HIDE_DELAY_MS);
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const nextScrollState = getScrollMetrics(el);
    setScrollState(current =>
      sameScrollMetrics(current, nextScrollState) ? current : nextScrollState,
    );
  }, [scrollRef]);

  useLayoutEffect(() => {
    updateScrollState();

    const el = scrollRef.current;
    if (!el) return undefined;

    const frameId = requestAnimationFrame(updateScrollState);
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateScrollState);
      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', updateScrollState);
      };
    }

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    Array.from(el.children).forEach(child => observer.observe(child));
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [children, height, orientation, scrollRef, updateScrollState, width]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const nextScrollState = getScrollMetrics(el);
    const contentOverflows = getScrollViewContentOverflows(
      nextScrollState,
      orientation,
    );

    setScrollState(current =>
      sameScrollMetrics(current, nextScrollState) ? current : nextScrollState,
    );

    if (isScrollbarEnabled && contentOverflows) {
      setScrollbarVisible(true);
      scheduleHide();
    }

    onScroll?.(nextScrollState.scrollTop);
  }, [orientation, isScrollbarEnabled, onScroll, scheduleHide, scrollRef]);

  const contentOverflows = getScrollViewContentOverflows(scrollState, orientation);

  useEffect(() => {
    if (!isScrollbarEnabled || !contentOverflows) {
      setScrollbarVisible(false);
    }
  }, [contentOverflows, isScrollbarEnabled]);

  return {
    scrollState,
    scrollbarVisible,
    handleScroll,
  };
}
