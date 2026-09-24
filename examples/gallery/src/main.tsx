/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GalleryApp } from './App';
import './gallery.css';

const root = document.getElementById('root');

if (root == null) {
  throw new Error('Expected the gallery root element to exist.');
}

createRoot(root).render(
  <StrictMode>
    <GalleryApp />
  </StrictMode>,
);
