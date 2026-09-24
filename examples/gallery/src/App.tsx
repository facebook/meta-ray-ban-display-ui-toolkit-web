/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { App } from '@wearables-ui-toolkit/mrbd';
import {
  ReactRouterNavigationProvider,
} from '@wearables-ui-toolkit/mrbd/react-router';
import {
  HashRouter,
} from 'react-router-dom';
import { GalleryAgentTools } from './GalleryAgentTools';
import { GalleryRoutes } from './GalleryRoutes';

export function GalleryApp() {
  return (
    <HashRouter>
      <ReactRouterNavigationProvider>
        <App className="gallery-app">
          <GalleryAgentTools />
          <GalleryRoutes />
        </App>
      </ReactRouterNavigationProvider>
    </HashRouter>
  );
}
