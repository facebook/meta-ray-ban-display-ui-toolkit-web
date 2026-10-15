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
  type MutableRefObject,
  type RefObject,
} from 'react';
import {
  getFirstCarouselFocusableDescendant,
  getNearestCenteredCarouselIndex,
  getCarouselScrollTarget,
} from './CarouselLayout';

const SCROLL_IDLE_DELAY_MS = 120;

interface UseCarouselScrollPositionOptions {
  scrollAreaRef: RefObject<HTMLDivElement | null>;
  itemRefs: MutableRefObject<Array<HTMLDivElement | null>>;
  currentIndexRef: MutableRefObject<number>;
  itemCount: number;
  onCenteredItemChange: (index: number) => void;
  updateScrollMetrics: () => void;
}

export function useCarouselScrollPosition({
  scrollAreaRef,
  itemRefs,
  currentIndexRef,
  itemCount,
  onCenteredItemChange,
  updateScrollMetrics,
}: UseCarouselScrollPositionOptions) {
  const pendingScrollTargetRef = useRef<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSynchronizingScroll = useRef(false);
  const onCenteredItemChangeRef = useRef(onCenteredItemChange);

  useLayoutEffect(() => {
    onCenteredItemChangeRef.current = onCenteredItemChange;
  }, [onCenteredItemChange]);

  const synchronizeScrollPosition = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea == null) return;
    const index = getNearestCenteredCarouselIndex(
      scrollArea,
      itemRefs.current,
      itemCount,
    );
    if (index == null) return;

    if (index !== currentIndexRef.current) {
      onCenteredItemChangeRef.current(index);
    }

    const item = itemRefs.current[index];
    const activeElement = scrollArea.ownerDocument.activeElement;
    if (
      currentIndexRef.current !== index ||
      item == null ||
      !scrollArea.contains(activeElement) ||
      item.contains(activeElement)
    ) {
      return;
    }

    isSynchronizingScroll.current = true;
    try {
      (getFirstCarouselFocusableDescendant(item) ?? item).focus({
        preventScroll: true,
      });
    } finally {
      isSynchronizingScroll.current = false;
    }
  }, [currentIndexRef, itemCount, itemRefs, scrollAreaRef]);

  const finishScroll = useCallback(() => {
    if (idleTimerRef.current != null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    pendingScrollTargetRef.current = null;
    synchronizeScrollPosition();
  }, [synchronizeScrollPosition]);

  const finishQuietScroll = useCallback(() => {
    idleTimerRef.current = null;
    const scrollArea = scrollAreaRef.current;
    const target = pendingScrollTargetRef.current;
    if (
      scrollArea != null &&
      target != null &&
      Math.abs(scrollArea.scrollLeft - target) > 1
    ) {
      return;
    }
    pendingScrollTargetRef.current = null;
    synchronizeScrollPosition();
  }, [scrollAreaRef, synchronizeScrollPosition]);

  const scheduleScrollEnd = useCallback(() => {
    if (idleTimerRef.current != null) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(finishQuietScroll, SCROLL_IDLE_DELAY_MS);
  }, [finishQuietScroll]);

  const scrollToItem = useCallback(
    (index: number, smooth: boolean = true) => {
      const scrollArea = scrollAreaRef.current;
      const item = itemRefs.current[index];
      if (scrollArea == null || item == null) return;

      const target = getCarouselScrollTarget(scrollArea, item);
      pendingScrollTargetRef.current =
        Math.abs(scrollArea.scrollLeft - target) > 1 ? target : null;
      scrollArea.scrollTo({
        left: target,
        behavior: smooth ? 'smooth' : 'auto',
      });
      scheduleScrollEnd();
    },
    [itemRefs, scheduleScrollEnd, scrollAreaRef],
  );

  const handleScroll = useCallback(() => {
    updateScrollMetrics();
    const scrollArea = scrollAreaRef.current;
    const target = pendingScrollTargetRef.current;
    if (
      scrollArea != null &&
      (target == null || Math.abs(scrollArea.scrollLeft - target) <= 1)
    ) {
      pendingScrollTargetRef.current = null;
      synchronizeScrollPosition();
    }
    scheduleScrollEnd();
  }, [
    scheduleScrollEnd,
    scrollAreaRef,
    synchronizeScrollPosition,
    updateScrollMetrics,
  ]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea == null) return;
    const beginDirectScroll = () => {
      if (idleTimerRef.current != null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      pendingScrollTargetRef.current = null;
    };
    scrollArea.addEventListener('scrollend', finishScroll);
    scrollArea.addEventListener('wheel', beginDirectScroll, {passive: true});
    scrollArea.addEventListener('pointerdown', beginDirectScroll, {
      passive: true,
    });
    return () => {
      scrollArea.removeEventListener('scrollend', finishScroll);
      scrollArea.removeEventListener('wheel', beginDirectScroll);
      scrollArea.removeEventListener('pointerdown', beginDirectScroll);
      if (idleTimerRef.current != null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      pendingScrollTargetRef.current = null;
    };
  }, [finishScroll, scrollAreaRef]);

  return {handleScroll, isSynchronizingScroll, scrollToItem};
}
