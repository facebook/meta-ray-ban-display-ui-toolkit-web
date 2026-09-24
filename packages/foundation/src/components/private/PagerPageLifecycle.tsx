/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { PagerPageLifecycle } from '../Pager.types';

export interface PagerPageLifecycleStore {
  current: PagerPageLifecycle | null;
  isMounted: boolean;
  pendingWillShow: boolean;
}

const PagerPageLifecycleContext =
  createContext<PagerPageLifecycleStore | null>(null);

export function PagerPageLifecycleProvider({
  children,
  fallbackLifecycle,
  store,
}: {
  children: ReactNode;
  fallbackLifecycle: PagerPageLifecycle;
  store: PagerPageLifecycleStore;
}) {
  const fallbackLifecycleRef = useRef(fallbackLifecycle);
  useLayoutEffect(() => {
    fallbackLifecycleRef.current = fallbackLifecycle;
  }, [fallbackLifecycle]);

  useLayoutEffect(() => {
    store.isMounted = true;
    if (store.pendingWillShow) {
      store.pendingWillShow = false;
      (
        store.current?.onWillShowPage ??
        fallbackLifecycleRef.current.onWillShowPage
      )?.();
    }

    return () => {
      store.isMounted = false;
      store.pendingWillShow = false;
    };
  }, [store]);

  return (
    <PagerPageLifecycleContext.Provider value={store}>
      {children}
    </PagerPageLifecycleContext.Provider>
  );
}

/** Registers lifecycle behavior from within the content of a Pager page. */
export function usePagerPageLifecycle(
  lifecycle: PagerPageLifecycle,
): void {
  const store = useContext(PagerPageLifecycleContext);
  if (store == null) {
    throw new Error('usePagerPageLifecycle must be used within a Pager page.');
  }

  useLayoutEffect(() => {
    store.current = lifecycle;
    return () => {
      if (store.current === lifecycle) {
        store.current = null;
      }
    };
  }, [lifecycle, store]);
}
