/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createRoot} from 'react-dom/client';
import {MessagingExampleApp} from './App';
import './styles.css';

const mountElement = document.getElementById('root');
if (mountElement == null) {
  throw new Error('Missing application mount element');
}

const windowBackground = 'var(--uit-color-background-window)';
document.documentElement.style.background = windowBackground;
document.body.style.background = windowBackground;
mountElement.style.background = windowBackground;

createRoot(mountElement).render(<MessagingExampleApp />);
