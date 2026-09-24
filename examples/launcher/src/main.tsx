/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LauncherExampleApp } from './App';
import './styles.css';

const rootElement = document.getElementById('root');
if (rootElement == null) {
  throw new Error('Expected an element with id="root".');
}

createRoot(rootElement).render(
  <StrictMode>
    <LauncherExampleApp />
  </StrictMode>,
);
