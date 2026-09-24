/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';
import {
  getToastPresentation,
  subscribeToastPresentation,
} from './ToastManager';
import type {
  ToastPresentation,
} from '../Toast.types';

export function useToastPresentation(): ToastPresentation {
  const [presentation, setPresentation] = useState<ToastPresentation>(() =>
    getToastPresentation(),
  );

  useEffect(() => {
    return subscribeToastPresentation(setPresentation);
  }, []);

  return presentation;
}
