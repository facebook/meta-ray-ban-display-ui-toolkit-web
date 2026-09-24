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
import { PaginationMode } from './Carousel.types';

export interface CarouselPaginationPresentationProps {
  mode: PaginationMode;
  pageCount: number;
  currentPage: number;
}

export type CarouselPaginationPresentation = ComponentType<
  CarouselPaginationPresentationProps
>;

function DefaultCarouselPaginationPresentation({
  mode,
  pageCount,
  currentPage,
}: CarouselPaginationPresentationProps) {
  if (mode === PaginationMode.TEXT) {
    return <span>{`${currentPage + 1} of ${pageCount}`}</span>;
  }

  return (
    <span aria-hidden="true">
      {Array.from({ length: pageCount }, (_, index) => (
        <span key={index} data-active={index === currentPage} />
      ))}
    </span>
  );
}

const CarouselPaginationPresentationContext =
  createContext<CarouselPaginationPresentation>(
    DefaultCarouselPaginationPresentation,
  );

export interface CarouselPaginationPresentationProviderProps {
  children: ReactNode;
  presentation: CarouselPaginationPresentation;
}

export function CarouselPaginationPresentationProvider({
  children,
  presentation,
}: CarouselPaginationPresentationProviderProps) {
  return (
    <CarouselPaginationPresentationContext.Provider value={presentation}>
      {children}
    </CarouselPaginationPresentationContext.Provider>
  );
}

export function useCarouselPaginationPresentation():
  CarouselPaginationPresentation {
  return useContext(CarouselPaginationPresentationContext);
}
