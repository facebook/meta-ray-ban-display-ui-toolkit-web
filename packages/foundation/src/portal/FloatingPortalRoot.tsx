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
  type ReactNode,
} from 'react';

const FloatingPortalRootContext = createContext<HTMLElement | null | undefined>(
  undefined,
);

export interface FloatingPortalRootProviderProps {
  root: HTMLElement | null;
  children: ReactNode;
}

export function FloatingPortalRootProvider({
  root,
  children,
}: FloatingPortalRootProviderProps) {
  return (
    <FloatingPortalRootContext.Provider value={root}>
      {children}
    </FloatingPortalRootContext.Provider>
  );
}

export function useFloatingPortalRoot(): HTMLElement | null {
  const scopedRoot = useContext(FloatingPortalRootContext);

  if (scopedRoot !== undefined) {
    return scopedRoot;
  }

  return typeof document === 'undefined' ? null : document.body;
}

export function getFloatingPortalRootOffset(root: HTMLElement | null): {
  left: number;
  position: 'absolute' | 'fixed';
  top: number;
} {
  if (
    root == null ||
    typeof document === 'undefined' ||
    root === document.body
  ) {
    return { left: 0, position: 'fixed', top: 0 };
  }

  const rootRect = root.getBoundingClientRect();
  return {
    left: rootRect.left,
    position: 'absolute',
    top: rootRect.top,
  };
}
