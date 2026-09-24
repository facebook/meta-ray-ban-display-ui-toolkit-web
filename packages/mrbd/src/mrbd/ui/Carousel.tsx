/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { forwardRef, memo } from 'react';
import {
  Carousel as FoundationCarousel,
  CarouselPaginationPresentationProvider,
  type CarouselHandle,
  type CarouselProps,
} from '@wearables-ui-toolkit/foundation';
import { PaginationIndicator } from './PaginationIndicator';

export {
  CarouselIndicatorPlacement,
  CarouselVerticalAlignment,
} from '@wearables-ui-toolkit/foundation';
export type {
  CarouselHandle,
  CarouselProps,
  ProgressIndicatorCustomization,
} from '@wearables-ui-toolkit/foundation';

export const Carousel = memo(
  forwardRef<CarouselHandle, CarouselProps>(function Carousel(props, ref) {
    return (
      <CarouselPaginationPresentationProvider
        presentation={PaginationIndicator}
      >
        <FoundationCarousel ref={ref} {...props} />
      </CarouselPaginationPresentationProvider>
    );
  }),
);
