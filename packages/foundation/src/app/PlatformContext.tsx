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
import type { Platform } from '../base/Platform';

const PlatformContext = createContext<Platform>('mrbd');

interface PlatformProviderProps {
  children: ReactNode;
  platform: Platform;
}

export function PlatformProvider({
  children,
  platform,
}: PlatformProviderProps) {
  return (
    <PlatformContext.Provider value={platform}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform(): Platform {
  return useContext(PlatformContext);
}
