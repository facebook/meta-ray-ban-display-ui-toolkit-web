/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {App} from '@wearables-ui-toolkit/mrbd';
import {
  ReactRouterNavigationProvider,
  ReactRouterPageTransition,
} from '@wearables-ui-toolkit/mrbd/react-router';
import {HashRouter, Navigate, Route, Routes} from 'react-router-dom';
import {MessagingAgentTools} from './MessagingAgentTools';
import {MessagingProvider} from './MessagingProvider';
import {InboxPage} from './pages/InboxPage';
import {ThreadPage} from './pages/ThreadPage';

export function MessagingExampleApp() {
  return (
    <HashRouter>
      <ReactRouterNavigationProvider>
        <App>
          <MessagingProvider>
            <MessagingAgentTools />
            <ReactRouterPageTransition>
              {({location}) => (
                <Routes location={location}>
                  <Route path="/" element={<InboxPage />} />
                  <Route path="/thread/:threadId" element={<ThreadPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              )}
            </ReactRouterPageTransition>
          </MessagingProvider>
        </App>
      </ReactRouterNavigationProvider>
    </HashRouter>
  );
}
