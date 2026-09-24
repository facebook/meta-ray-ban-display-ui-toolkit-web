/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo } from 'react';
import {
  App as FoundationApp,
  CarouselPaginationPresentationProvider,
  TooltipPresentationProvider,
  type AppProps as FoundationAppProps,
} from '@wearables-ui-toolkit/foundation';
import { PaginationIndicator } from '../ui/PaginationIndicator';
import { ToastContainer } from '../ui/Toast';
import { TooltipContainer } from '../ui/TooltipContainer';
import '../../styles.css';

export type AppProps = FoundationAppProps;

export const App = memo(function App({ children, ...props }: AppProps) {
  return (
    <TooltipPresentationProvider presentation={TooltipContainer}>
      <CarouselPaginationPresentationProvider
        presentation={PaginationIndicator}
      >
        <FoundationApp {...props}>
          {children}
          <ToastContainer />
        </FoundationApp>
      </CarouselPaginationPresentationProvider>
    </TooltipPresentationProvider>
  );
});
