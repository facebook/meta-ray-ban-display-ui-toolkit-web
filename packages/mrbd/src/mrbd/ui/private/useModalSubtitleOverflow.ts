/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

export interface ModalSubtitleOverflowState {
  subtitleRef: RefObject<HTMLParagraphElement | null>;
  isSubtitleOverflowing: boolean;
}

export function useModalSubtitleOverflow(
  showSubtitle: boolean,
  subtitle?: string,
): ModalSubtitleOverflowState {
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const [isSubtitleOverflowing, setIsSubtitleOverflowing] = useState(false);

  useLayoutEffect(() => {
    const subtitleEl = subtitleRef.current;
    if (subtitleEl == null || !showSubtitle) {
      setIsSubtitleOverflowing(false);
      return;
    }

    const updateOverflow = () => {
      const overflows =
        subtitleEl.scrollHeight > subtitleEl.clientHeight + 1 ||
        subtitleEl.scrollWidth > subtitleEl.clientWidth + 1;
      setIsSubtitleOverflowing(prev => (prev === overflows ? prev : overflows));
    };

    updateOverflow();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(subtitleEl);

    return () => observer.disconnect();
  }, [showSubtitle, subtitle]);

  return {
    subtitleRef,
    isSubtitleOverflowing,
  };
}
