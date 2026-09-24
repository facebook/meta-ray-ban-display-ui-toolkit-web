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
  type ComponentType,
  type ReactNode,
} from 'react';

export interface DefaultTooltipPresentationProps {
  text?: string;
  metadata?: string;
  showTooltipTail: boolean;
  tailDirection?: 'up' | 'down';
  tailCenterX: number;
}

export type DefaultTooltipPresentation = ComponentType<
  DefaultTooltipPresentationProps
>;

function FallbackTooltipPresentation({
  text,
  metadata,
}: DefaultTooltipPresentationProps) {
  return (
    <div>
      {text}
      {metadata == null ? null : <span>{metadata}</span>}
    </div>
  );
}

const DefaultTooltipPresentationContext =
  createContext<DefaultTooltipPresentation>(FallbackTooltipPresentation);

export interface TooltipPresentationProviderProps {
  children: ReactNode;
  presentation: DefaultTooltipPresentation;
}

export function TooltipPresentationProvider({
  children,
  presentation,
}: TooltipPresentationProviderProps) {
  return (
    <DefaultTooltipPresentationContext.Provider value={presentation}>
      {children}
    </DefaultTooltipPresentationContext.Provider>
  );
}

export function useDefaultTooltipPresentation():
  DefaultTooltipPresentation {
  return useContext(DefaultTooltipPresentationContext);
}
