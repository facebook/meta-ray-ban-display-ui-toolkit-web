/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Marquee scroll speed (px/sec). The duration is derived from this so it is
 * proportional to how far the text must travel (constant speed) rather than a
 * fixed wall-clock loop.
 */
const MARQUEE_SPEED_PX_PER_SEC = 30;

export interface UseAppControlTileTitleOverflowOptions {
  title?: string;
  hasTitle: boolean;
  hasStatusIcon: boolean;
  enableTitleMarquee: boolean;
}

export function useAppControlTileTitleOverflow({
  title,
  hasTitle,
  hasStatusIcon,
  enableTitleMarquee,
}: UseAppControlTileTitleOverflowOptions) {
  const titleRef = useRef<HTMLDivElement>(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!hasTitle || !el) {
      setIsTitleOverflowing(false);
      return;
    }

    // Drive the marquee distance/duration from the actual overflow so the text
    // scrolls only the overflowing remainder at a constant speed, instead of
    // translating the whole text off-screen over a fixed 8s loop.
    const applyMarqueeMetrics = (node: HTMLDivElement, overflowPx: number) => {
      if (enableTitleMarquee && overflowPx > 0) {
        node.style.setProperty('--marquee-distance', `${overflowPx}px`);
        node.style.setProperty(
          '--marquee-duration',
          `${overflowPx / MARQUEE_SPEED_PX_PER_SEC}s`,
        );
      } else {
        node.style.removeProperty('--marquee-distance');
        node.style.removeProperty('--marquee-duration');
      }
    };

    const checkOverflow = () => {
      const node = titleRef.current;
      if (!node) return;
      const overflowPx = node.scrollWidth - node.clientWidth;
      setIsTitleOverflowing(overflowPx > 0);
      applyMarqueeMetrics(node, overflowPx);
    };

    const frameId = requestAnimationFrame(checkOverflow);

    // Recompute when the available width changes (ResizeObserver) and once fonts
    // finish loading (text metrics shift), not only when the title/flags change,
    // so the overflow state stays correct across layout changes.
    let fontsCancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          if (!fontsCancelled) checkOverflow();
        })
        .catch(() => {});
    }

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(checkOverflow);
    observer?.observe(el);

    // Pause the marquee while the tile is offscreen, so it only animates when
    // visible.
    const visibilityObserver =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entries) => {
            const node = titleRef.current;
            if (!node) return;
            node.style.setProperty(
              '--marquee-play-state',
              entries[0]?.isIntersecting ? 'running' : 'paused',
            );
          });
    visibilityObserver?.observe(el);

    return () => {
      cancelAnimationFrame(frameId);
      fontsCancelled = true;
      observer?.disconnect();
      visibilityObserver?.disconnect();
    };
  }, [title, hasTitle, hasStatusIcon, enableTitleMarquee]);

  return {
    titleRef,
    isTitleOverflowing,
  };
}
