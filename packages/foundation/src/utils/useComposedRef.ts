/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  type Ref,
  type RefObject,
  type RefCallback,
} from 'react';

/**
 * Composes a forwarded ref with a local object ref using React 19 callback-ref
 * cleanup semantics.
 */
export function useComposedRef<T>(
  forwardedRef: Ref<T>,
  localRef: RefObject<T | null>,
): RefCallback<T> {
  return useCallback(
    (node: T | null) => {
      localRef.current = node;
      if (node == null) {
        if (typeof forwardedRef === 'function') {
          forwardedRef(null);
        } else if (forwardedRef != null) {
          forwardedRef.current = null;
        }
        return;
      }

      const forwardedCleanup =
        typeof forwardedRef === 'function'
          ? forwardedRef(node)
          : undefined;
      if (forwardedRef != null && typeof forwardedRef !== 'function') {
        forwardedRef.current = node;
      }

      let cleaned = false;
      return () => {
        if (cleaned) {
          return;
        }
        cleaned = true;
        localRef.current = null;

        if (typeof forwardedRef === 'function') {
          if (typeof forwardedCleanup === 'function') {
            forwardedCleanup();
          } else {
            forwardedRef(null);
          }
        } else if (forwardedRef != null) {
          forwardedRef.current = null;
        }
      };
    },
    [forwardedRef, localRef],
  );
}
