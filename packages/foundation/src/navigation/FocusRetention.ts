/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { preserveFocusedInteractableDuringNavigation } from '../base/FocusCoordinator';

export { preserveFocusedInteractableDuringNavigation };

/**
 * Keeps the focused interactable's visual state across same-document route
 * changes, for any router.
 *
 * Pass a value that changes on every navigation, such as the router's location
 * key. A URL-based key must include query and hash changes. The hook starts a
 * focus hold when the browser applies a history traversal (`popstate`) and
 * whenever `routeKey` changes
 * after the first render. The React Router and Next.js navigation providers
 * call it for you; call it directly when composing another router.
 */
export function useNavigationFocusRetention(
  routeKey: string | null | undefined,
): void {
  useNavigationFocusRetentionTrigger(routeKey);
}

/** @internal Adapters can open the same lifecycle-owned hold before history writes. */
export function useNavigationFocusRetentionTrigger(
  routeKey: string | null | undefined,
): () => void {
  const committedRouteKeyRef = useRef(routeKey);
  const releaseHoldRef = useRef<(() => void) | null>(null);
  const openHold = useCallback(() => {
    openNavigationHold(releaseHoldRef);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', openHold);
    return () => {
      window.removeEventListener('popstate', openHold);
      releaseHoldRef.current?.();
      releaseHoldRef.current = null;
    };
  }, [openHold]);

  useLayoutEffect(() => {
    if (committedRouteKeyRef.current === routeKey) {
      return;
    }
    committedRouteKeyRef.current = routeKey;
    openHold();
  }, [openHold, routeKey]);

  return openHold;
}

function openNavigationHold(releaseHoldRef: { current: (() => void) | null }) {
  releaseHoldRef.current?.();
  releaseHoldRef.current = preserveFocusedInteractableDuringNavigation();
}
