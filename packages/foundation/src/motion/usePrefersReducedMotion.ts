/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const subscribers = new Set<() => void>();
let mediaQuery: MediaQueryList | null = null;

function getMediaQuery(): MediaQueryList | null {
  if (
    mediaQuery == null &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  }
  return mediaQuery;
}

function subscribe(onStoreChange: () => void): () => void {
  const query = getMediaQuery();
  subscribers.add(onStoreChange);
  if (subscribers.size === 1) {
    query?.addEventListener('change', notifySubscribers);
  }

  return () => {
    subscribers.delete(onStoreChange);
    if (subscribers.size === 0) {
      query?.removeEventListener('change', notifySubscribers);
      mediaQuery = null;
    }
  };
}

function notifySubscribers(): void {
  subscribers.forEach(notify => notify());
}

function getSnapshot(): boolean {
  return getMediaQuery()?.matches ?? false;
}

/**
 * Tracks the user's `prefers-reduced-motion` system setting.
 *
 * Returns `true` when the user has requested reduced motion. JS-driven
 * animations should honor this by snapping to their target instead of
 * tweening (see `reducedMotionDuration`). CSS-transition components should
 * additionally guard with `@media (prefers-reduced-motion: reduce)`.
 *
 * SSR-safe: returns `false` when `window`/`matchMedia` is unavailable.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
