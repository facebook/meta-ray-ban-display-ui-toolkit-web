/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useLayoutEffect, useState, type RefObject} from 'react';

const PROBE_FONT_SIZE = 100;

/** Observe host text-size multiplication without changing the user's setting. */
export function useFontScale(rootRef: RefObject<HTMLElement | null>): number {
  const [fontScale, setFontScale] = useState(1);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root == null || typeof window === 'undefined') return;
    if (!/Android\b/.test(navigator.userAgent)) return;

    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = `position:absolute;display:block;visibility:hidden;pointer-events:none;font-size:${PROBE_FONT_SIZE}px;line-height:1;white-space:nowrap;`;
    probe.textContent = 'M';
    root.appendChild(probe);

    const update = () => {
      const measuredSize = Number.parseFloat(window.getComputedStyle(probe).fontSize);
      const next = measuredSize / PROBE_FONT_SIZE;
      if (Number.isFinite(next) && next > 0) {
        setFontScale(current => Math.abs(current - next) < 0.0001 ? current : next);
      }
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(probe);
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      probe.remove();
    };
  }, [rootRef]);

  return fontScale;
}
